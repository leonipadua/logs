"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { erroPorCampo } from "@/lib/validation/errors";
import {
  composicaoTierSchema,
  criarModuloSchema,
  editarCondicaoSchema,
  editarModuloSchema,
  editarTierSchema,
  excluirModuloSchema,
} from "@/lib/validation/catalog";
import type { FormState } from "./form-state";

const CAMINHO = "/admin/catalogo";

function moduloFormData(formData: FormData) {
  return {
    slug: formData.get("slug"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    precoImplementacao: formData.get("precoImplementacao") ?? "",
    mensalidade: formData.get("mensalidade") ?? "",
    horasEstimadas: formData.get("horasEstimadas") ?? 0,
    doresGatilho: formData.get("doresGatilho"),
    ativo: formData.get("ativo"),
    placeholder: formData.get("placeholder"),
  };
}

function moduloRow(d: {
  slug: string;
  nome: string;
  descricao?: string | null;
  precoImplementacao: number;
  mensalidade: number;
  horasEstimadas: number;
  doresGatilho: string[];
  ativo: boolean;
  placeholder: boolean;
}) {
  return {
    slug: d.slug,
    nome: d.nome,
    descricao: d.descricao || null,
    preco_implementacao_centavos: d.precoImplementacao,
    mensalidade_centavos: d.mensalidade,
    horas_estimadas: d.horasEstimadas,
    dores_gatilho: d.doresGatilho,
    ativo: d.ativo,
    placeholder: d.placeholder,
  };
}

export async function criarModuloAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = criarModuloSchema.safeParse(moduloFormData(formData));
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };

  const admin = createAdminClient();
  const { data, error } = await admin.from("modules").insert(moduloRow(parsed.data)).select("id").single();
  if (error) return { errors: { slug: "Já existe um módulo com esse slug." } };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_modulo",
    entidade: "modules",
    entidadeId: data.id,
    depois: moduloRow(parsed.data),
  });
  revalidatePath(CAMINHO);
  return { success: true, message: "Módulo criado." };
}

export async function editarModuloAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = editarModuloSchema.safeParse({ moduleId: formData.get("moduleId"), ...moduloFormData(formData) });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };

  const admin = createAdminClient();
  const { data: antes } = await admin.from("modules").select("*").eq("id", parsed.data.moduleId).single();
  const { error } = await admin.from("modules").update(moduloRow(parsed.data)).eq("id", parsed.data.moduleId);
  if (error) return { errors: { slug: "Já existe um módulo com esse slug." } };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "editar_modulo",
    entidade: "modules",
    entidadeId: parsed.data.moduleId,
    antes,
    depois: moduloRow(parsed.data),
  });
  revalidatePath(CAMINHO);
  return { success: true, message: "Módulo salvo." };
}

export async function excluirModuloAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = excluirModuloSchema.safeParse({ moduleId: formData.get("moduleId") });
  if (!parsed.success) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { error } = await admin.from("modules").delete().eq("id", parsed.data.moduleId);
  if (error) {
    return { message: "Módulo em uso (tier, proposta ou dor). Desative-o em vez de excluir." };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "excluir_modulo",
    entidade: "modules",
    entidadeId: parsed.data.moduleId,
  });
  revalidatePath(CAMINHO);
  return { success: true };
}

export async function editarTierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = editarTierSchema.safeParse({
    tierId: formData.get("tierId"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    ativo: formData.get("ativo"),
    placeholder: formData.get("placeholder"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };

  const admin = createAdminClient();
  const depois = {
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    ativo: parsed.data.ativo,
    placeholder: parsed.data.placeholder,
  };
  const { error } = await admin.from("tiers").update(depois).eq("id", parsed.data.tierId);
  if (error) return { message: "Não foi possível salvar o tier." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "editar_tier",
    entidade: "tiers",
    entidadeId: parsed.data.tierId,
    depois,
  });
  revalidatePath(CAMINHO);
  return { success: true, message: "Tier salvo." };
}

/** Substitui a composição do tier (módulos incluídos, na ordem do catálogo). */
export async function definirComposicaoTierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = composicaoTierSchema.safeParse({
    tierId: formData.get("tierId"),
    moduleIds: formData.getAll("moduleIds"),
  });
  if (!parsed.success) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { error: erroDelete } = await admin.from("tier_modules").delete().eq("tier_id", parsed.data.tierId);
  if (erroDelete) return { message: "Não foi possível atualizar a composição." };

  if (parsed.data.moduleIds.length > 0) {
    const { error } = await admin.from("tier_modules").insert(
      parsed.data.moduleIds.map((moduleId, i) => ({ tier_id: parsed.data.tierId, module_id: moduleId, ordem: i + 1 })),
    );
    if (error) return { message: "Não foi possível atualizar a composição." };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "definir_composicao_tier",
    entidade: "tiers",
    entidadeId: parsed.data.tierId,
    depois: { moduleIds: parsed.data.moduleIds },
  });
  revalidatePath(CAMINHO);
  return { success: true, message: "Composição salva." };
}

export async function editarCondicaoPagamentoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = editarCondicaoSchema.safeParse({
    conditionId: formData.get("conditionId"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    ajustePercentual: formData.get("ajustePercentual") ?? 0,
    ativo: formData.get("ativo"),
    placeholder: formData.get("placeholder"),
  });
  if (!parsed.success) return { errors: erroPorCampo(parsed.error) };

  const admin = createAdminClient();
  const depois = {
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    ajuste_bps: parsed.data.ajustePercentual,
    ativo: parsed.data.ativo,
    placeholder: parsed.data.placeholder,
  };
  const { error } = await admin.from("payment_conditions").update(depois).eq("id", parsed.data.conditionId);
  if (error) return { message: "Não foi possível salvar a condição." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "editar_condicao_pagamento",
    entidade: "payment_conditions",
    entidadeId: parsed.data.conditionId,
    depois,
  });
  revalidatePath(CAMINHO);
  return { success: true, message: "Condição salva." };
}
