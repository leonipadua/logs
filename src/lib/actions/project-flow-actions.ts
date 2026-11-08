"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { atorDaSessao } from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { fecharSprint, sincronizarProjeto } from "@/lib/projects/sprints";
import { pausarRelogio, retomarRelogio } from "@/lib/projects/relogio";
import {
  atualizarReuniaoSchema,
  criarReuniaoSchema,
  excluirReuniaoSchema,
  fecharSprintSchema,
  pausarRelogioSchema,
  retomarRelogioSchema,
} from "@/lib/validation/projeto";
import type { FormState } from "./form-state";

function revalidarProjeto(projectId: string) {
  revalidatePath(`/admin/projetos/${projectId}`);
  revalidatePath("/app", "layout");
}

export async function pausarRelogioAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = pausarRelogioSchema.safeParse({
    projectId: formData.get("projectId"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };

  const admin = createAdminClient();
  const r = await pausarRelogio(admin, parsed.data.projectId, parsed.data.motivo, "manual", atorDaSessao(sessao));
  if (!r.ok) return { message: r.erro };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "pausar_relogio",
    entidade: "projects",
    entidadeId: parsed.data.projectId,
    depois: { motivo: parsed.data.motivo, origem: "manual" },
  });
  revalidarProjeto(parsed.data.projectId);
  return { success: true, message: "Relógio pausado." };
}

export async function retomarRelogioAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = retomarRelogioSchema.safeParse({ projectId: formData.get("projectId") });
  if (!parsed.success) return { message: "Projeto inválido." };

  const admin = createAdminClient();
  const r = await retomarRelogio(admin, parsed.data.projectId, atorDaSessao(sessao));
  if (!r.ok) return { message: r.erro };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "retomar_relogio",
    entidade: "projects",
    entidadeId: parsed.data.projectId,
    depois: { diasPausados: r.diasPausados },
  });
  revalidarProjeto(parsed.data.projectId);
  return { success: true, message: `Relógio retomado (${r.diasPausados} dia(s) parado(s)).` };
}

export async function fecharSprintAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = fecharSprintSchema.safeParse({ faseId: formData.get("faseId") });
  if (!parsed.success) return { message: "Sprint inválida." };

  const admin = createAdminClient();
  const { data: fase } = await admin.from("phases").select("project_id").eq("id", parsed.data.faseId).maybeSingle();
  const r = await fecharSprint(admin, parsed.data.faseId, atorDaSessao(sessao));
  if (!r.ok) {
    return { message: r.pendencias?.length ? `${r.erro} ${r.pendencias.join(" ")}` : r.erro };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "fechar_sprint",
    entidade: "phases",
    entidadeId: parsed.data.faseId,
    depois: { proximaEtapa: r.proximaEtapa },
  });
  if (fase) revalidarProjeto(fase.project_id);
  return {
    success: true,
    message: r.proximaEtapa
      ? `Sprint fechada. ${r.proximaEtapa} em andamento.`
      : "Sprint fechada. A próxima só começa com a primeira cobrança paga.",
  };
}

export async function criarReuniaoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = criarReuniaoSchema.safeParse({
    projectId: formData.get("projectId"),
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    ocorreEm: formData.get("ocorreEm"),
    duracaoMin: formData.get("duracaoMin"),
    linkReuniao: formData.get("linkReuniao"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("project_meetings")
    .insert({
      project_id: parsed.data.projectId,
      tipo: parsed.data.tipo,
      titulo: parsed.data.titulo,
      ocorre_em: new Date(parsed.data.ocorreEm).toISOString(),
      duracao_min: parsed.data.duracaoMin,
      link_reuniao: parsed.data.linkReuniao,
    })
    .select("id")
    .single();
  if (error || !data) return { message: "Não foi possível agendar a reunião." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_reuniao",
    entidade: "project_meetings",
    entidadeId: data.id,
    depois: parsed.data,
  });
  if (parsed.data.tipo === "kickoff") await sincronizarProjeto(admin, parsed.data.projectId, atorDaSessao(sessao));
  revalidarProjeto(parsed.data.projectId);
  return { success: true, message: "Reunião agendada." };
}

export async function atualizarReuniaoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = atualizarReuniaoSchema.safeParse({
    reuniaoId: formData.get("reuniaoId"),
    status: formData.get("status"),
    gravacaoUrl: formData.get("gravacaoUrl"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("project_meetings")
    .update({ status: parsed.data.status, gravacao_url: parsed.data.gravacaoUrl })
    .eq("id", parsed.data.reuniaoId)
    .select("project_id")
    .single();
  if (error || !data) return { message: "Não foi possível atualizar a reunião." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "atualizar_reuniao",
    entidade: "project_meetings",
    entidadeId: parsed.data.reuniaoId,
    depois: parsed.data,
  });
  revalidarProjeto(data.project_id);
  return { success: true, message: "Reunião atualizada." };
}

export async function excluirReuniaoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();
  const parsed = excluirReuniaoSchema.safeParse({ reuniaoId: formData.get("reuniaoId") });
  if (!parsed.success) return { message: "Reunião inválida." };

  const admin = createAdminClient();
  const { data } = await admin.from("project_meetings").delete().eq("id", parsed.data.reuniaoId).select("project_id").single();
  if (!data) return { message: "Reunião não encontrada." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "excluir_reuniao",
    entidade: "project_meetings",
    entidadeId: parsed.data.reuniaoId,
  });
  revalidarProjeto(data.project_id);
  return { success: true };
}
