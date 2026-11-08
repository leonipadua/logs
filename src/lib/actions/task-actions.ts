"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { atorDaSessao, logEvent } from "@/lib/events";
import { criarTaskSchema, editarTaskSchema, mudarStatusTaskSchema } from "@/lib/validation/admin";
import type { FormState } from "./form-state";

async function getProjectIdDaFase(admin: ReturnType<typeof createAdminClient>, faseId: string) {
  const { data } = await admin.from("phases").select("project_id").eq("id", faseId).single();
  return data?.project_id ?? null;
}

/** PRD §6: concluir uma task registra `task.done` (alimenta a linha do tempo do portal). */
async function emitirTaskDone(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  taskId: string,
  dono: string,
  ator: ReturnType<typeof atorDaSessao>,
) {
  const { data: projeto } = await admin.from("projects").select("organization_id").eq("id", projectId).single();
  await logEvent({
    tipo: "task.done",
    ator,
    organizationId: projeto?.organization_id ?? null,
    entidadeId: taskId,
    payload: { taskId, projectId, dono: dono === "cliente" ? "cliente" : "sabre" },
  });
}

export async function criarTaskAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = criarTaskSchema.safeParse({
    faseId: formData.get("faseId"),
    titulo: formData.get("titulo"),
    slug: formData.get("slug"),
    descricao: formData.get("descricao"),
    ordem: formData.get("ordem"),
    dono: formData.get("dono") ?? undefined,
    prazo: formData.get("prazo") ?? "",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tasks")
    .insert({
      dono: parsed.data.dono,
      prazo: parsed.data.prazo,
      phase_id: parsed.data.faseId,
      titulo: parsed.data.titulo,
      slug: parsed.data.slug,
      descricao: parsed.data.descricao || null,
      ordem: parsed.data.ordem,
    })
    .select("id")
    .single();

  if (error) return { errors: { slug: "Já existe uma etapa com esse slug nesta fase." } };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_task",
    entidade: "tasks",
    entidadeId: data.id,
    depois: parsed.data,
  });

  const projectId = await getProjectIdDaFase(admin, parsed.data.faseId);
  if (projectId) revalidatePath(`/admin/projetos/${projectId}`);
  return { success: true };
}

export async function editarTaskAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = editarTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    ordem: formData.get("ordem"),
    status: formData.get("status"),
    motivoBloqueio: formData.get("motivoBloqueio"),
    dono: formData.get("dono") ?? undefined,
    prazo: formData.get("prazo") ?? "",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data: antes } = await admin
    .from("tasks")
    .select("phase_id, titulo, descricao, ordem, status, motivo_bloqueio, dono, prazo, bloqueada_por_tier_id")
    .eq("id", parsed.data.taskId)
    .single();
  if (!antes) return { message: "Etapa não encontrada." };
  if (antes.bloqueada_por_tier_id && parsed.data.status === "concluida") {
    return { message: "Etapa bloqueada por tier: só é liberada com o upgrade." };
  }

  const jaConcluida = antes.status === "concluida";
  const { error } = await admin
    .from("tasks")
    .update({
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao || null,
      ordem: parsed.data.ordem,
      dono: parsed.data.dono,
      prazo: parsed.data.prazo,
      // Prazo novo: a pendência volta a poder gerar um novo client_task.overdue.
      ...(parsed.data.prazo !== antes.prazo ? { vencida_registrada_em: null } : {}),
      status: parsed.data.status,
      // Tasks bloqueadas por tier mantêm o motivo (ganho potencial/plano) mostrado no portal.
      motivo_bloqueio:
        parsed.data.status === "bloqueada"
          ? parsed.data.motivoBloqueio || antes.motivo_bloqueio || null
          : antes.bloqueada_por_tier_id
            ? antes.motivo_bloqueio
            : null,
      concluida_em: parsed.data.status === "concluida" ? (jaConcluida ? undefined : new Date().toISOString()) : null,
    })
    .eq("id", parsed.data.taskId);
  if (error) return { message: "Não foi possível salvar a etapa." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "editar_task",
    entidade: "tasks",
    entidadeId: parsed.data.taskId,
    antes,
    depois: parsed.data,
  });

  const projectId = await getProjectIdDaFase(admin, antes.phase_id);
  if (projectId && parsed.data.status === "concluida" && !jaConcluida) {
    await emitirTaskDone(admin, projectId, parsed.data.taskId, parsed.data.dono, atorDaSessao(sessao));
  }
  if (projectId) revalidatePath(`/admin/projetos/${projectId}`);
  return { success: true, message: "Etapa atualizada." };
}

export async function mudarStatusTaskAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = mudarStatusTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    motivoBloqueio: formData.get("motivoBloqueio"),
  });
  if (!parsed.success) return { message: "Status inválido." };

  const admin = createAdminClient();
  const { data: antes } = await admin
    .from("tasks")
    .select("phase_id, status, dono, bloqueada_por_tier_id")
    .eq("id", parsed.data.taskId)
    .single();
  if (!antes) return { message: "Etapa não encontrada." };
  if (antes.bloqueada_por_tier_id && parsed.data.status === "concluida") {
    return { message: "Etapa bloqueada por tier: só é liberada com o upgrade." };
  }

  const { error } = await admin
    .from("tasks")
    .update({
      status: parsed.data.status,
      motivo_bloqueio: parsed.data.status === "bloqueada" ? parsed.data.motivoBloqueio || null : null,
      concluida_em: parsed.data.status === "concluida" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.taskId);
  if (error) return { message: "Não foi possível mudar o status." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "mudar_status_task",
    entidade: "tasks",
    entidadeId: parsed.data.taskId,
    antes: { status: antes.status },
    depois: { status: parsed.data.status },
  });

  const projectId = await getProjectIdDaFase(admin, antes.phase_id);
  if (projectId && parsed.data.status === "concluida" && antes.status !== "concluida") {
    await emitirTaskDone(admin, projectId, parsed.data.taskId, antes.dono, atorDaSessao(sessao));
  }
  if (projectId) revalidatePath(`/admin/projetos/${projectId}`);
  return { success: true };
}

export async function excluirTaskAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { data: task } = await admin.from("tasks").select("phase_id").eq("id", taskId).single();
  if (!task) return { message: "Etapa não encontrada." };

  const { error } = await admin.from("tasks").delete().eq("id", taskId);
  if (error) return { message: "Não foi possível excluir a etapa." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "excluir_task",
    entidade: "tasks",
    entidadeId: taskId,
  });

  const projectId = await getProjectIdDaFase(admin, task.phase_id);
  if (projectId) revalidatePath(`/admin/projetos/${projectId}`);
  return { success: true };
}
