"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { atorDaSessao, logEvent } from "@/lib/events";
import { erroPorCampo } from "@/lib/validation/errors";
import {
  bantSchema,
  callSchema,
  contatoSchema,
  criarLeadSchema,
  dorSchema,
  estagioSchema,
  excluirDorSchema,
} from "@/lib/validation/cockpit";
import { mapearDorParaModulo, normalizarTag, slugDeNome } from "@/lib/domain/spin";
import type { Json } from "@/lib/supabase/types";
import type { FormState } from "./form-state";

/**
 * Escritas do cockpit usam o client da SESSÃO do admin: a RLS
 * (`is_admin()`) é a fronteira. service_role só para auditoria e eventos.
 */

const vazio = (v: string | null | undefined): string | null => (v && v.trim() !== "" ? v.trim() : null);

export async function criarLeadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = criarLeadSchema.safeParse({
    nome: formData.get("nome"),
    segmento: formData.get("segmento"),
    cidade: formData.get("cidade"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      nome: parsed.data.nome,
      slug: slugDeNome(parsed.data.nome, randomBytes(3).toString("hex")),
      segmento: vazio(parsed.data.segmento),
      cidade: vazio(parsed.data.cidade),
      estagio: "prospeccao",
    })
    .select("id")
    .single();
  if (error || !data) return { message: "Não foi possível criar o lead. Tente de novo." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_lead",
    entidade: "organizations",
    entidadeId: data.id,
    depois: { nome: parsed.data.nome },
  });
  revalidatePath("/admin/cockpit");
  redirect(`/admin/contas/${data.id}/cockpit`);
}

export async function atualizarEstagioAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = estagioSchema.safeParse({
    organizationId: formData.get("organizationId"),
    estagio: formData.get("estagio"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ estagio: parsed.data.estagio })
    .eq("id", parsed.data.organizationId);
  if (error) return { message: "Não foi possível atualizar o estágio." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "atualizar_estagio",
    entidade: "organizations",
    entidadeId: parsed.data.organizationId,
    depois: { estagio: parsed.data.estagio },
  });
  revalidatePath(`/admin/contas/${parsed.data.organizationId}/cockpit`);
  revalidatePath("/admin/cockpit");
  return { success: true, message: "Estágio atualizado." };
}

export async function criarContatoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = contatoSchema.safeParse({
    organizationId: formData.get("organizationId"),
    nome: formData.get("nome"),
    papel: formData.get("papel"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };

  const supabase = await createClient();
  const { count } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", parsed.data.organizationId);
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: parsed.data.organizationId,
      nome: parsed.data.nome,
      papel: parsed.data.papel,
      whatsapp: vazio(parsed.data.whatsapp),
      email: vazio(parsed.data.email),
      principal: (count ?? 0) === 0,
    })
    .select("id")
    .single();
  if (error || !data) return { message: "Não foi possível salvar o contato." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_contato",
    entidade: "contacts",
    entidadeId: data.id,
    depois: { organizationId: parsed.data.organizationId, papel: parsed.data.papel },
  });
  revalidatePath(`/admin/contas/${parsed.data.organizationId}/cockpit`);
  return { success: true, message: "Contato salvo." };
}

export async function registrarCallAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = callSchema.safeParse({
    organizationId: formData.get("organizationId"),
    tipo: formData.get("tipo"),
    contactId: formData.get("contactId"),
    resultado: formData.get("resultado"),
    duracaoMin: formData.get("duracaoMin"),
    notas: formData.get("notas"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calls")
    .insert({
      organization_id: d.organizationId,
      tipo: d.tipo,
      contact_id: vazio(d.contactId),
      resultado: vazio(d.resultado),
      duracao_min: d.duracaoMin ? Number(d.duracaoMin) : null,
      notas: vazio(d.notas),
      created_by: sessao.userId,
    })
    .select("id")
    .single();
  if (error || !data) return { message: "Não foi possível registrar a call." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "registrar_call",
    entidade: "calls",
    entidadeId: data.id,
    depois: { tipo: d.tipo },
  });
  await logEvent({
    tipo: "call.logged",
    ator: atorDaSessao(sessao),
    organizationId: d.organizationId,
    entidadeId: data.id,
    payload: { callId: data.id, tipo: d.tipo, resultado: vazio(d.resultado) },
  });
  revalidatePath(`/admin/contas/${d.organizationId}/cockpit`);
  return { success: true, message: "Call registrada." };
}

export async function salvarBantAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = bantSchema.safeParse({
    organizationId: formData.get("organizationId"),
    callId: formData.get("callId"),
    budgetResposta: formData.get("budgetResposta"),
    budgetNota: formData.get("budgetNota"),
    authorityResposta: formData.get("authorityResposta"),
    authorityNota: formData.get("authorityNota"),
    needResposta: formData.get("needResposta"),
    needNota: formData.get("needNota"),
    timingResposta: formData.get("timingResposta"),
    timingNota: formData.get("timingNota"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error), message: erroPorCampo(parsed.error).callId };
  const d = parsed.data;

  const bant: Record<string, { resposta?: string; nota?: string }> = {};
  for (const c of ["budget", "authority", "need", "timing"] as const) {
    const resposta = d[`${c}Resposta`];
    const nota = d[`${c}Nota`];
    if (resposta || nota) bant[c] = { ...(resposta ? { resposta } : {}), ...(nota ? { nota } : {}) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("calls")
    .update({ bant: bant as Json })
    .eq("id", d.callId)
    .eq("organization_id", d.organizationId);
  if (error) return { message: "Não foi possível salvar o BANT." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "salvar_bant",
    entidade: "calls",
    entidadeId: d.callId,
    depois: bant,
  });
  revalidatePath(`/admin/contas/${d.organizationId}/cockpit`);
  return { success: true, message: "Qualificação salva." };
}

export async function capturarDorAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = dorSchema.safeParse({
    organizationId: formData.get("organizationId"),
    callId: formData.get("callId"),
    tipoSpin: formData.get("tipoSpin"),
    categoria: formData.get("categoria"),
    descricao: formData.get("descricao"),
    valor: formData.get("valor") ?? "",
    unidade: formData.get("unidade"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();
  // Mapeamento por regra: categoria -> módulo do catálogo. Sem escolha manual de preço.
  const { data: modulos } = await supabase.from("modules").select("id, ativo, dores_gatilho");
  const categoria = d.categoria ? normalizarTag(d.categoria) : null;
  const moduleId = mapearDorParaModulo(categoria, modulos ?? []);

  const { data, error } = await supabase
    .from("pains")
    .insert({
      organization_id: d.organizationId,
      call_id: vazio(d.callId),
      module_id: moduleId,
      tipo_spin: d.tipoSpin,
      categoria,
      descricao: d.descricao,
      valor_numerico: d.valor ?? null,
      unidade: d.unidade ? d.unidade : null,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { message: "Não foi possível salvar a dor. Confira número e unidade." };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "capturar_dor",
    entidade: "pains",
    entidadeId: data.id,
    depois: { tipoSpin: d.tipoSpin, categoria, moduleId },
  });
  await logEvent({
    tipo: "pain.captured",
    ator: atorDaSessao(sessao),
    organizationId: d.organizationId,
    entidadeId: data.id,
    payload: { painId: data.id, tipoSpin: d.tipoSpin, callId: vazio(d.callId), moduleId },
  });
  revalidatePath(`/admin/contas/${d.organizationId}/cockpit`);
  return {
    success: true,
    message: moduleId ? "Dor registrada e mapeada para um módulo." : "Dor registrada, sem módulo mapeado (escolha uma categoria do catálogo).",
  };
}

export async function excluirDorAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = excluirDorSchema.safeParse({
    organizationId: formData.get("organizationId"),
    painId: formData.get("painId"),
  });
  if (!parsed.success) return { message: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pains")
    .delete()
    .eq("id", parsed.data.painId)
    .eq("organization_id", parsed.data.organizationId);
  if (error) return { message: "Não foi possível excluir a dor." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "excluir_dor",
    entidade: "pains",
    entidadeId: parsed.data.painId,
  });
  revalidatePath(`/admin/contas/${parsed.data.organizationId}/cockpit`);
  return { success: true };
}
