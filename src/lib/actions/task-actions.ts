"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarTaskSchema, editarTaskSchema, mudarStatusTaskSchema } from "@/lib/validation/admin";
import type { FormState } from "./form-state";

async function getProjectIdDaFase(admin: ReturnType<typeof createAdminClient>, faseId: string) {
  const { data } = await admin.from("phases").select("project_id").eq("id", faseId).single();
  return data?.project_id ?? null;
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
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tasks")
    .insert({
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
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data: antes } = await admin
    .from("tasks")
    .select("phase_id, titulo, descricao, ordem, status, motivo_bloqueio")
    .eq("id", parsed.data.taskId)
    .single();
  if (!antes) return { message: "Etapa não encontrada." };

  const jaConcluida = antes.status === "concluida";
  const { error } = await admin
    .from("tasks")
    .update({
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao || null,
      ordem: parsed.data.ordem,
      status: parsed.data.status,
      motivo_bloqueio: parsed.data.status === "bloqueada" ? parsed.data.motivoBloqueio || null : null,
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
    .select("phase_id, status")
    .eq("id", parsed.data.taskId)
    .single();
  if (!antes) return { message: "Etapa não encontrada." };

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
