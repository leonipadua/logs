"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { atorDaSessao, logEvent } from "@/lib/events";
import { erroPorCampo } from "@/lib/validation/errors";
import { gerarPropostaSchema, marcarEnviadaSchema } from "@/lib/validation/cockpit";
import { avaliarBant, lerBant } from "@/lib/domain/spin";
import { montarRascunho, somarDias, type PainParaProposta } from "@/lib/domain/proposal";
import { tierAlvo } from "@/lib/domain/tiers";
import { gerarNarrativa } from "@/lib/narrative";
import { mesclarSettings } from "@/lib/domain/settings";
import type { Json } from "@/lib/supabase/types";
import type { FormState } from "./form-state";

/** "Gerar proposta": monta a proposta viva (rascunho) a partir do que o cockpit capturou. */
export async function gerarPropostaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = gerarPropostaSchema.safeParse({
    organizationId: formData.get("organizationId"),
    ticketMedio: formData.get("ticketMedio") ?? "",
    taxaConversaoPct: formData.get("taxaConversaoPct") ?? "",
    custoHora: formData.get("custoHora") ?? "",
    recuperacaoPct: formData.get("recuperacaoPct") ?? "",
    horizonteMeses: formData.get("horizonteMeses") ?? 12,
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };
  const d = parsed.data;
  for (const [campo, v] of [["taxaConversaoPct", d.taxaConversaoPct], ["recuperacaoPct", d.recuperacaoPct]] as const) {
    if (v != null && (v <= 0 || v > 100)) return { errors: { [campo]: "Use um percentual entre 1 e 100." } };
  }

  const supabase = await createClient();
  const [{ data: org }, { data: dores }, { data: calls }, { data: modulos }, { data: tiers }] =
    await Promise.all([
      supabase.from("organizations").select("id, nome, segmento, cidade").eq("id", d.organizationId).maybeSingle(),
      supabase
        .from("pains")
        .select("id, tipo_spin, descricao, valor_numerico, unidade, module_id, call_id")
        .eq("organization_id", d.organizationId)
        .order("created_at"),
      supabase
        .from("calls")
        .select("id, bant, realizada_em")
        .eq("organization_id", d.organizationId)
        .order("realizada_em", { ascending: false }),
      supabase.from("modules").select("id, nome, descricao, ativo"),
      supabase.from("tiers").select("id, ordem, ativo").order("ordem"),
    ]);
  if (!org) return { message: "Lead não encontrado." };

  const ultimaComBant = (calls ?? []).find((c) => Object.keys(lerBant(c.bant)).length > 0);
  if (avaliarBant(lerBant(ultimaComBant?.bant)).veredito === "sair") {
    return { message: "A qualificação BANT indica sair do funil. Revise o BANT antes de gerar a proposta." };
  }

  const modulosPorId = new Map((modulos ?? []).map((m) => [m.id, m]));
  const doresProposta: PainParaProposta[] = (dores ?? []).map((p) => ({
    id: p.id,
    tipo_spin: p.tipo_spin,
    descricao: p.descricao,
    valor_numerico: p.valor_numerico === null ? null : Number(p.valor_numerico),
    unidade: p.unidade,
    module_id: p.module_id && modulosPorId.get(p.module_id)?.ativo ? p.module_id : null,
  }));

  const rascunho = montarRascunho(doresProposta, {
    ticketMedioCentavos: d.ticketMedio,
    taxaConversao: d.taxaConversaoPct != null ? d.taxaConversaoPct / 100 : undefined,
    custoHoraCentavos: d.custoHora,
    recuperacao: d.recuperacaoPct != null ? d.recuperacaoPct / 100 : undefined,
    horizonteMeses: d.horizonteMeses,
  });
  if (rascunho.itens.length === 0) {
    return { message: "Nenhuma dor está mapeada para um módulo. Capture dores com uma categoria do catálogo." };
  }

  const alvo = tierAlvo(tiers ?? []);
  if (!alvo) return { message: "O tier alvo (do meio) está inativo ou ausente no catálogo." };

  const narrativa = await gerarNarrativa({
    organizacaoNome: org.nome,
    segmento: org.segmento,
    cidade: org.cidade,
    dores: rascunho.itens.map((i) => {
      const dor = doresProposta.find((p) => p.id === i.painId)!;
      const modulo = modulosPorId.get(i.moduleId)!;
      return {
        painId: dor.id,
        moduleId: i.moduleId,
        moduloNome: modulo.nome,
        moduloDescricao: modulo.descricao,
        tipoSpin: dor.tipo_spin,
        descricao: dor.descricao,
      };
    }),
  });

  const { data: proposta, error } = await supabase
    .from("proposals")
    .insert({
      organization_id: d.organizationId,
      call_id: ultimaComBant?.id ?? calls?.[0]?.id ?? null,
      titulo: `Proposta para ${org.nome}`,
      status: "rascunho",
      tier_sugerido_id: alvo.id,
      premissas_roi: rascunho.premissas as unknown as Json,
      narrativa: narrativa as unknown as Json,
      validade_ate: null,
      created_by: sessao.userId,
    })
    .select("id")
    .single();
  if (error || !proposta) return { message: "Não foi possível gerar a proposta. Tente de novo." };

  const { error: erroItens } = await supabase.from("proposal_items").insert(
    rascunho.itens.map((i, ordem) => ({
      proposal_id: proposta.id,
      pain_id: i.painId,
      module_id: i.moduleId,
      ordem,
      narrativa: narrativa.itens.find((n) => n.moduleId === i.moduleId)?.texto ?? null,
    })),
  );
  if (erroItens) {
    await supabase.from("proposals").delete().eq("id", proposta.id);
    return { message: "Não foi possível montar as seções da proposta. Tente de novo." };
  }

  // Validade só passa a contar no envio (marcarPropostaEnviadaAction), usando a configuração.
  await supabase.from("organizations").update({ estagio: "proposta" }).eq("id", d.organizationId).in("estagio", ["prospeccao", "conexao", "diagnostico"]);

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "gerar_proposta",
    entidade: "proposals",
    entidadeId: proposta.id,
    depois: { organizationId: d.organizationId, itens: rascunho.itens.length, narrativa: narrativa.origem },
  });
  revalidatePath("/admin/propostas");
  redirect("/admin/propostas");
}

/** Rascunho -> enviada. Define a validade (configuração) e emite offer.sent. */
export async function marcarPropostaEnviadaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = marcarEnviadaSchema.safeParse({ proposalId: formData.get("proposalId") });
  if (!parsed.success) return { message: "Dados inválidos." };

  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("chave, valor");
  const dias = mesclarSettings(settings ?? []).proposta_validade_dias;
  const agora = new Date();

  const { data: proposta, error } = await supabase
    .from("proposals")
    .update({ status: "enviada", enviada_em: agora.toISOString(), validade_ate: somarDias(agora, dias) })
    .eq("id", parsed.data.proposalId)
    .eq("status", "rascunho")
    .select("id, organization_id, tier_sugerido_id")
    .maybeSingle();
  if (error) return { message: "Não foi possível marcar como enviada." };
  if (!proposta) return { message: "Esta proposta já foi enviada." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "enviar_proposta",
    entidade: "proposals",
    entidadeId: proposta.id,
    depois: { validadeDias: dias },
  });
  await logEvent({
    tipo: "offer.sent",
    ator: atorDaSessao(sessao),
    organizationId: proposta.organization_id,
    entidadeId: proposta.id,
    payload: { proposalId: proposta.id, tierSugeridoId: proposta.tier_sugerido_id },
  });
  revalidatePath("/admin/propostas");
  return { success: true, message: "Marcada como enviada. Copie o link para o lead." };
}
