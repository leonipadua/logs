"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarFaseSchema, editarFaseSchema } from "@/lib/validation/admin";
import type { FormState } from "./form-state";

export async function criarFaseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = criarFaseSchema.safeParse({
    projectId: formData.get("projectId"),
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    ordem: formData.get("ordem"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("phases")
    .insert({
      project_id: parsed.data.projectId,
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao || null,
      ordem: parsed.data.ordem,
    })
    .select("id")
    .single();

  if (error) return { message: "Não foi possível criar a fase." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_fase",
    entidade: "phases",
    entidadeId: data.id,
    depois: parsed.data,
  });

  revalidatePath(`/admin/projetos/${parsed.data.projectId}`);
  return { success: true };
}

export async function editarFaseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = editarFaseSchema.safeParse({
    faseId: formData.get("faseId"),
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    ordem: formData.get("ordem"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data: antes } = await admin
    .from("phases")
    .select("project_id, titulo, descricao, ordem")
    .eq("id", parsed.data.faseId)
    .single();
  if (!antes) return { message: "Fase não encontrada." };

  const { error } = await admin
    .from("phases")
    .update({ titulo: parsed.data.titulo, descricao: parsed.data.descricao || null, ordem: parsed.data.ordem })
    .eq("id", parsed.data.faseId);
  if (error) return { message: "Não foi possível salvar a fase." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "editar_fase",
    entidade: "phases",
    entidadeId: parsed.data.faseId,
    antes,
    depois: parsed.data,
  });

  revalidatePath(`/admin/projetos/${antes.project_id}`);
  return { success: true, message: "Fase atualizada." };
}

export async function excluirFaseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const faseId = String(formData.get("faseId") ?? "");
  if (!faseId) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { data: fase } = await admin.from("phases").select("project_id").eq("id", faseId).single();
  if (!fase) return { message: "Fase não encontrada." };

  const { error } = await admin.from("phases").delete().eq("id", faseId);
  if (error) return { message: "Não foi possível excluir a fase." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "excluir_fase",
    entidade: "phases",
    entidadeId: faseId,
  });

  revalidatePath(`/admin/projetos/${fase.project_id}`);
  return { success: true };
}
