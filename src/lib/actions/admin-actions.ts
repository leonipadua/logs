"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkAdminPassword,
  createAdminSession,
  destroyAdminSession,
  isAdminAuthenticated,
} from "@/lib/admin/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ProjectStatus, TaskStatus } from "@/lib/supabase/types";

async function requireAdmin() {
  const authed = await isAdminAuthenticated();
  if (!authed) throw new Error("Não autenticado");
}

// ---------- Auth ----------

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!checkAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ---------- Clients ----------

export async function createClientAction(formData: FormData) {
  await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!nome || !slug) throw new Error("Nome e slug são obrigatórios");

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("clients").insert({ nome, slug });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

// ---------- Projects ----------

export async function createProjectAction(formData: FormData) {
  await requireAdmin();
  const client_id = String(formData.get("client_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  if (!client_id || !nome) throw new Error("Cliente e nome são obrigatórios");

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("projects")
    .insert({ client_id, nome, descricao });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function updateProjectStatusAction(
  projectId: string,
  status: ProjectStatus
) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function deleteProjectAction(projectId: string) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

// ---------- Phases ----------

export async function createPhaseAction(formData: FormData) {
  await requireAdmin();
  const project_id = String(formData.get("project_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const ordem = Number(formData.get("ordem") ?? 0);
  if (!project_id || !titulo) throw new Error("Projeto e título são obrigatórios");

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("phases")
    .insert({ project_id, titulo, ordem });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${project_id}`);
}

export async function deletePhaseAction(phaseId: string, projectId: string) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("phases").delete().eq("id", phaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${projectId}`);
}

// ---------- Tasks ----------

export async function createTaskAction(formData: FormData) {
  await requireAdmin();
  const phase_id = String(formData.get("phase_id") ?? "");
  const project_id = String(formData.get("project_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const ordem = Number(formData.get("ordem") ?? 0);
  if (!phase_id || !titulo) throw new Error("Fase e título são obrigatórios");

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("tasks")
    .insert({ phase_id, titulo, descricao, ordem });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${project_id}`);
}

export async function updateTaskStatusAction(
  taskId: string,
  projectId: string,
  status: TaskStatus
) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteTaskAction(taskId: string, projectId: string) {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/projects/${projectId}`);
}
