"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { materializarOferta } from "@/lib/domain/offers";
import { emailsDosOwners } from "@/lib/domain/notifications";
import { paymentProvider } from "@/lib/payments";
import { enviarEmailComLog } from "@/lib/email/send-and-log";
import { templateCobrancaGerada } from "@/lib/email/templates";
import { formatCentavosBRL } from "@/lib/format";
import {
  criarOfertaSchema,
  publicarOfertaSchema,
  removerOfertaSchema,
  desbloquearManualSchema,
  iniciarDesbloqueioSchema,
} from "@/lib/validation/offers";
import type { FormState } from "./form-state";

export async function criarOfertaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = criarOfertaSchema.safeParse({
    slug: formData.get("slug"),
    titulo: formData.get("titulo"),
    insightPadrao: formData.get("insightPadrao"),
    descricaoEntrega: formData.get("descricaoEntrega"),
    precoPadraoCentavos: formData.get("precoPadraoCentavos"),
    prazoEstimadoDias: formData.get("prazoEstimadoDias"),
    templateFasesJson: formData.get("templateFasesJson"),
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { errors: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])) };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("offers")
    .insert({
      slug: parsed.data.slug,
      titulo: parsed.data.titulo,
      insight_padrao: parsed.data.insightPadrao,
      descricao_entrega: parsed.data.descricaoEntrega || null,
      preco_padrao_centavos: parsed.data.precoPadraoCentavos,
      prazo_estimado_dias: parsed.data.prazoEstimadoDias ?? null,
      template_fases: parsed.data.templateFasesJson,
    })
    .select("id")
    .single();

  if (error) return { errors: { slug: "Já existe uma oferta com esse slug." } };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_oferta",
    entidade: "offers",
    entidadeId: data.id,
    depois: { slug: parsed.data.slug, titulo: parsed.data.titulo },
  });

  revalidatePath("/admin/ofertas");
  return { success: true };
}

export async function publicarOfertaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = publicarOfertaSchema.safeParse({
    projectId: formData.get("projectId"),
    offerId: formData.get("offerId"),
    slug: formData.get("slug"),
    titulo: formData.get("titulo"),
    insight: formData.get("insight"),
    descricaoEntrega: formData.get("descricaoEntrega"),
    precoCentavos: formData.get("precoCentavos"),
    prazoEstimadoDias: formData.get("prazoEstimadoDias"),
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { errors: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])) };
  }

  const admin = createAdminClient();

  const { count } = await admin
    .from("project_offers")
    .select("id", { count: "exact", head: true })
    .eq("project_id", parsed.data.projectId)
    .eq("status", "disponivel");
  if ((count ?? 0) >= 3) {
    return { message: "Este projeto já tem 3 ofertas disponíveis — o máximo da vitrine." };
  }

  const { data, error } = await admin
    .from("project_offers")
    .insert({
      project_id: parsed.data.projectId,
      offer_id: parsed.data.offerId,
      slug: parsed.data.slug,
      titulo: parsed.data.titulo,
      insight: parsed.data.insight,
      descricao_entrega: parsed.data.descricaoEntrega || null,
      preco_centavos: parsed.data.precoCentavos,
      prazo_estimado_dias: parsed.data.prazoEstimadoDias ?? null,
      status: "disponivel",
    })
    .select("id")
    .single();

  if (error) return { errors: { slug: "Já existe uma oferta com esse slug neste projeto." } };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "publicar_oferta",
    entidade: "project_offers",
    entidadeId: data.id,
    depois: parsed.data,
  });

  revalidatePath(`/admin/projetos/${parsed.data.projectId}`);
  return { success: true };
}

export async function removerOfertaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = removerOfertaSchema.safeParse({ projectOfferId: formData.get("projectOfferId") });
  if (!parsed.success) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { data: oferta } = await admin
    .from("project_offers")
    .select("project_id")
    .eq("id", parsed.data.projectOfferId)
    .single();
  if (!oferta) return { message: "Oferta não encontrada." };

  const { error } = await admin
    .from("project_offers")
    .update({ status: "removida" })
    .eq("id", parsed.data.projectOfferId);
  if (error) return { message: "Não foi possível remover a oferta." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "remover_oferta",
    entidade: "project_offers",
    entidadeId: parsed.data.projectOfferId,
  });

  revalidatePath(`/admin/projetos/${oferta.project_id}`);
  return { success: true };
}

/**
 * F4/F5: gatilho manual do admin para validar a materialização sem
 * depender de um pagamento real (não há conta Asaas ainda — F8).
 */
export async function desbloquearManualAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = desbloquearManualSchema.safeParse({ projectOfferId: formData.get("projectOfferId") });
  if (!parsed.success) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  let projectId: string;
  try {
    projectId = await materializarOferta(admin, parsed.data.projectOfferId);
  } catch {
    return { message: "Não foi possível desbloquear a oferta." };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "desbloquear_oferta_manual",
    entidade: "project_offers",
    entidadeId: parsed.data.projectOfferId,
  });

  revalidatePath(`/admin/projetos/${projectId}`);
  return { success: true, message: "Oferta desbloqueada e fase materializada." };
}

/** Cliente clica no cadeado e escolhe forma de pagamento — inicia o checkout (E4.1). */
export async function iniciarDesbloqueioAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireUser();
  const parsed = iniciarDesbloqueioSchema.safeParse({
    projectOfferId: formData.get("projectOfferId"),
    metodo: formData.get("metodo"),
  });
  if (!parsed.success) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { data: oferta } = await admin
    .from("project_offers")
    .select("id, slug, titulo, status, preco_centavos, project_id, cliques, projects(organization_id, organizations(id, nome, documento, email_faturamento, provider_customer_id))")
    .eq("id", parsed.data.projectOfferId)
    .single();
  if (!oferta) return { message: "Oferta não encontrada." };

  const projeto = Array.isArray(oferta.projects) ? oferta.projects[0] : oferta.projects;
  const org = Array.isArray(projeto?.organizations) ? projeto?.organizations[0] : projeto?.organizations;
  if (!org) return { message: "Organização não encontrada." };

  const { data: vinculo } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", org.id)
    .eq("user_id", sessao.userId)
    .is("revogado_em", null)
    .maybeSingle();
  if (!vinculo) return { message: "Você não tem acesso a esta oferta." };

  if (oferta.status !== "disponivel") {
    return { message: "Esta oferta não está mais disponível para desbloqueio." };
  }

  const idempotencyKey = `desbloqueio:${oferta.id}`;
  const { data: cobrancaExistente } = await admin
    .from("charges")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (cobrancaExistente && ["pendente", "agendada"].includes(cobrancaExistente.status)) {
    await admin
      .from("project_offers")
      .update({ status: "em_negociacao", cliques: oferta.cliques + 1 })
      .eq("id", oferta.id);
    revalidatePath(`/app/desbloquear/${oferta.slug}`);
    return {
      success: true,
      message: montarMensagemCheckout(cobrancaExistente.metodo),
      pix:
        cobrancaExistente.metodo === "pix" && cobrancaExistente.pix_payload
          ? { payload: cobrancaExistente.pix_payload, qrcodeBase64: cobrancaExistente.pix_qrcode_base64 ?? "" }
          : null,
    };
  }

  let providerCustomerId = org.provider_customer_id;
  if (!providerCustomerId) {
    const cliente = await paymentProvider.criarCliente({
      organizationId: org.id,
      nome: org.nome,
      documento: org.documento,
      email: org.email_faturamento,
    });
    providerCustomerId = cliente.providerCustomerId;
    await admin.from("organizations").update({ provider_customer_id: providerCustomerId }).eq("id", org.id);
  }

  const vencimento = new Date().toISOString().slice(0, 10);
  const cobranca = await paymentProvider.criarCobranca({
    providerCustomerId,
    valorCentavos: oferta.preco_centavos,
    metodo: parsed.data.metodo,
    descricao: oferta.titulo,
    idempotencyKey,
    vencimento,
  });

  const { error: erroCharge } = await admin.from("charges").insert({
    organization_id: org.id,
    project_offer_id: oferta.id,
    tipo: "desbloqueio",
    valor_centavos: oferta.preco_centavos,
    metodo: parsed.data.metodo,
    vencimento,
    provider_charge_id: cobranca.providerChargeId,
    checkout_url: cobranca.checkoutUrl ?? null,
    pix_payload: cobranca.pix?.payload ?? null,
    pix_qrcode_base64: cobranca.pix?.qrcodeBase64 ?? null,
    idempotency_key: idempotencyKey,
  });
  if (erroCharge) return { message: "Não foi possível iniciar o pagamento. Tente de novo." };

  await admin
    .from("project_offers")
    .update({ status: "em_negociacao", cliques: oferta.cliques + 1 })
    .eq("id", oferta.id);

  const donosEmails = await emailsDosOwners(admin, org.id);
  if (donosEmails.length > 0) {
    const { assunto, html, texto } = templateCobrancaGerada({
      nomeOrganizacao: org.nome,
      descricao: oferta.titulo,
      valorFormatado: formatCentavosBRL(oferta.preco_centavos),
      urlFaturas: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/faturas`,
    });
    await enviarEmailComLog({ para: donosEmails, assunto, html, texto, tag: "M4a" }, org.id);
  }

  revalidatePath(`/app/desbloquear/${oferta.slug}`);
  return {
    success: true,
    message: montarMensagemCheckout(parsed.data.metodo),
    pix: cobranca.pix ?? null,
  };
}

function montarMensagemCheckout(metodo: string | null): string {
  if (metodo === "pix") return "Pix gerado. Assim que o pagamento cair, a etapa é liberada automaticamente.";
  return "Pedido registrado. Assim que o pagamento for confirmado, a etapa é liberada automaticamente.";
}

export async function registrarImpressaoOfertaAction(projectOfferId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("project_offers").select("impressoes").eq("id", projectOfferId).single();
  if (data) {
    await admin.from("project_offers").update({ impressoes: data.impressoes + 1 }).eq("id", projectOfferId);
  }
}
