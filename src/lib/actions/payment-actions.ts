"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments";
import { assinarPayloadMock } from "@/lib/payments/mock-provider";
import { simularWebhookSchema, definirAssinaturaSchema } from "@/lib/validation/payments";
import type { FormState } from "./form-state";

/**
 * Gatilho manual do admin (F5, ARCHITECTURE §4.1): dispara uma requisição
 * real para o mesmo endpoint que o provedor de verdade chamaria — exercita
 * o código de verificação/idempotência/reconciliação, não um atalho.
 */
export async function simularWebhookAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = simularWebhookSchema.safeParse({
    chargeId: formData.get("chargeId"),
    novoStatus: formData.get("novoStatus"),
  });
  if (!parsed.success) return { message: "Dados inválidos." };

  const origin = String(formData.get("origin") ?? "");
  if (!origin) return { message: "Origem da requisição ausente." };

  const admin = createAdminClient();
  const { data: charge } = await admin
    .from("charges")
    .select("provider_charge_id, valor_centavos, organization_id")
    .eq("id", parsed.data.chargeId)
    .single();
  if (!charge?.provider_charge_id) return { message: "Cobrança não encontrada." };

  const corpo = JSON.stringify({
    providerEventId: crypto.randomUUID(),
    tipo: `pagamento.${parsed.data.novoStatus}`,
    providerChargeId: charge.provider_charge_id,
    status: parsed.data.novoStatus,
    valorCentavos: charge.valor_centavos,
  });

  const resposta = await fetch(`${origin}/api/webhooks/pagamento`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-mock-signature": assinarPayloadMock(corpo) },
    body: corpo,
  });

  if (!resposta.ok) return { message: "O webhook simulado retornou erro." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "simular_webhook_pagamento",
    entidade: "charges",
    entidadeId: parsed.data.chargeId,
    depois: { novoStatus: parsed.data.novoStatus },
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/app", "layout");
  return { success: true, message: `Webhook simulado: cobrança marcada como "${parsed.data.novoStatus}".` };
}

export async function definirAssinaturaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = definirAssinaturaSchema.safeParse({
    organizationId: formData.get("organizationId"),
    valorCentavos: formData.get("valorCentavos"),
    diaVencimento: formData.get("diaVencimento"),
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { errors: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])) };
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("nome, documento, email_faturamento, provider_customer_id")
    .eq("id", parsed.data.organizationId)
    .single();
  if (!org) return { message: "Organização não encontrada." };

  const { data: existente } = await admin
    .from("subscriptions")
    .select("*")
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();

  let providerSubscriptionId = existente?.provider_subscription_id ?? null;

  // Assinatura de R$ 0 é de primeira classe: não gera nada no provedor.
  if (parsed.data.valorCentavos > 0 && !providerSubscriptionId) {
    let providerCustomerId = org.provider_customer_id;
    if (!providerCustomerId) {
      const cliente = await paymentProvider.criarCliente({
        organizationId: parsed.data.organizationId,
        nome: org.nome,
        documento: org.documento,
        email: org.email_faturamento,
      });
      providerCustomerId = cliente.providerCustomerId;
      await admin.from("organizations").update({ provider_customer_id: providerCustomerId }).eq("id", parsed.data.organizationId);
    }
    const assinatura = await paymentProvider.criarAssinatura({
      providerCustomerId,
      valorCentavos: parsed.data.valorCentavos,
      diaVencimento: parsed.data.diaVencimento,
      descricao: `Assinatura mensal — ${org.nome}`,
    });
    providerSubscriptionId = assinatura.providerSubscriptionId;
  } else if (parsed.data.valorCentavos === 0) {
    providerSubscriptionId = null;
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      organization_id: parsed.data.organizationId,
      valor_centavos: parsed.data.valorCentavos,
      dia_vencimento: parsed.data.diaVencimento,
      provider_subscription_id: providerSubscriptionId,
      status: "ativa",
    },
    { onConflict: "organization_id" },
  );
  if (error) return { message: "Não foi possível salvar a assinatura." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "definir_assinatura",
    entidade: "subscriptions",
    entidadeId: parsed.data.organizationId,
    depois: parsed.data,
  });

  revalidatePath(`/admin/organizacoes/${parsed.data.organizationId}`);
  return { success: true, message: "Assinatura salva." };
}
