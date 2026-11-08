"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarAuditoria } from "@/lib/auth/audit";
import { verificarLimite } from "@/lib/rate-limit";
import { aceiteSchema } from "@/lib/validation/cockpit";
import { erroPorCampo } from "@/lib/validation/errors";
import { mesclarSettings } from "@/lib/domain/settings";
import { escopoRetainer, planoDeParcelas, propostaExpirada, TERMOS_VERSAO } from "@/lib/domain/proposal";
import { aoAceitarProposta } from "@/lib/proposals/on-accept";
import type { Json } from "@/lib/supabase/types";
import type { FormState } from "./form-state";

async function ipDoRequisitante(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
}

/**
 * Aceite na página (sem sessão: o token é a capacidade). Ordem:
 *  1. valida (zod) + rate limit por IP e por token;
 *  2. proposals: enviada -> aceita (condicional, idempotente);
 *  3. contrato com valores de calc_proposta_preco (o trigger do banco confere);
 *  4. gancho aoAceitarProposta (evento offer.accepted; Fase 3 cria o projeto).
 */
export async function aceitarPropostaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = aceiteSchema.safeParse({
    token: formData.get("token"),
    tierId: formData.get("tierId"),
    condicaoId: formData.get("condicaoId"),
    aceiteNome: formData.get("aceiteNome"),
    termos: formData.get("termos"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };
  const d = parsed.data;

  const ip = await ipDoRequisitante();
  const [porIp, porToken] = await Promise.all([
    verificarLimite({ chave: `aceite:ip:${ip}`, limite: 10, janelaSegundos: 3600 }),
    verificarLimite({ chave: `aceite:token:${d.token.slice(0, 24)}`, limite: 6, janelaSegundos: 3600 }),
  ]);
  if (porIp.excedido || porToken.excedido) {
    return { message: "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo." };
  }

  const admin = createAdminClient();
  const { data: bruta } = await admin.rpc("proposta_por_token", { p_token: d.token });
  const p = bruta as unknown as { id: string; organization_id: string; status: string; validade_ate: string | null } | null;
  if (!p) return { message: "Esta proposta não está disponível. Fale com a Sabre para receber um novo link." };
  if (p.status === "aceita") return { message: "Esta proposta já foi aceita." };
  if (propostaExpirada(p.validade_ate, p.status)) {
    return { message: "O prazo desta proposta terminou. Fale com a Sabre para renová-la." };
  }

  const [{ data: tier }, { data: condicao }] = await Promise.all([
    admin.from("tiers").select("id").eq("id", d.tierId).eq("ativo", true).maybeSingle(),
    admin.from("payment_conditions").select("id").eq("id", d.condicaoId).eq("ativo", true).maybeSingle(),
  ]);
  if (!tier) return { errors: { tierId: "Esta opção não está mais disponível." } };
  if (!condicao) return { errors: { condicaoId: "Esta condição não está mais disponível." } };

  const agora = new Date();
  const { data: aceita, error: erroAceite } = await admin
    .from("proposals")
    .update({
      status: "aceita",
      tier_id: tier.id,
      condicao_pagamento_id: condicao.id,
      aceita_em: agora.toISOString(),
      aceite_nome: d.aceiteNome,
      aceite_termos_versao: TERMOS_VERSAO,
    })
    .eq("id", p.id)
    .eq("status", "enviada")
    .select("id")
    .maybeSingle();
  if (erroAceite) return { message: "Não foi possível registrar o aceite. Tente de novo." };
  if (!aceita) return { message: "Esta proposta já foi aceita." };

  const reverter = () => admin.from("proposals").update({ status: "enviada", tier_id: null, condicao_pagamento_id: null, aceita_em: null, aceite_nome: null, aceite_termos_versao: null }).eq("id", p.id);

  // Preço do contrato = catálogo (calc_proposta_preco); o trigger confere de novo.
  const { data: preco } = await admin.rpc("calc_proposta_preco", { p_proposal_id: p.id });
  const linha = preco?.[0];
  if (!linha) {
    await reverter();
    return { message: "Não foi possível calcular o contrato. Tente de novo ou fale com a Sabre." };
  }

  const [{ data: composicao }, { data: settings }] = await Promise.all([
    admin.from("tier_modules").select("modules(nome, mensalidade_centavos, ativo)").eq("tier_id", tier.id),
    admin.from("settings").select("chave, valor"),
  ]);
  const modulosDoTier = (composicao ?? [])
    .map((c) => c.modules)
    .filter((m): m is { nome: string; mensalidade_centavos: number; ativo: boolean } => !!m && m.ativo);

  const { data: contrato, error: erroContrato } = await admin
    .from("contracts")
    .insert({
      organization_id: p.organization_id,
      proposal_id: p.id,
      origem: "proposta",
      tier_id: tier.id,
      status: "ativo",
      vigencia_inicio: agora.toISOString().slice(0, 10),
      vigencia_meses: mesclarSettings(settings ?? []).vigencia_minima_meses,
      valor_implementacao_centavos: Number(linha.implementacao_centavos),
      mensalidade_centavos: Number(linha.mensalidade_centavos),
      plano_parcelas: planoDeParcelas(Number(linha.implementacao_centavos), agora) as unknown as Json,
      escopo_retainer: escopoRetainer(modulosDoTier) as unknown as Json,
      termos_versao: TERMOS_VERSAO,
      assinado_em: agora.toISOString(),
    })
    .select("id")
    .single();
  if (erroContrato || !contrato) {
    await reverter();
    return { message: "Não foi possível gerar o contrato. Nada foi cobrado; tente de novo ou fale com a Sabre." };
  }

  await admin.from("organizations").update({ estagio: "fechado" }).eq("id", p.organization_id);
  await registrarAuditoria({
    actorId: null,
    acao: "aceitar_proposta",
    entidade: "proposals",
    entidadeId: p.id,
    depois: { tierId: tier.id, condicaoId: condicao.id, contractId: contrato.id, aceiteNome: d.aceiteNome, ip },
  });
  await aoAceitarProposta(p.id);

  revalidatePath(`/p/${d.token}`);
  revalidatePath("/admin/propostas");
  return { success: true, message: "Proposta aceita. A Sabre entra em contato para os próximos passos." };
}
