"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarProjetoSchema, editarProjetoSchema } from "@/lib/validation/admin";
import type { FormState } from "./form-state";

export async function criarProjetoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = criarProjetoSchema.safeParse({
    organizationId: formData.get("organizationId"),
    nome: formData.get("nome"),
    slug: formData.get("slug"),
    descricao: formData.get("descricao"),
    previsaoEntrega: formData.get("previsaoEntrega"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .insert({
      organization_id: parsed.data.organizationId,
      nome: parsed.data.nome,
      slug: parsed.data.slug,
      descricao: parsed.data.descricao || null,
      previsao_entrega: parsed.data.previsaoEntrega || null,
    })
    .select("id")
    .single();

  if (error) {
    return { errors: { slug: "Já existe um projeto com esse slug nesta organização." } };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_projeto",
    entidade: "projects",
    entidadeId: data.id,
    depois: parsed.data,
  });

  redirect(`/admin/projetos/${data.id}`);
}

export async function editarProjetoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = editarProjetoSchema.safeParse({
    projectId: formData.get("projectId"),
    nome: formData.get("nome"),
    slug: formData.get("slug"),
    descricao: formData.get("descricao"),
    status: formData.get("status"),
    previsaoEntrega: formData.get("previsaoEntrega"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data: antes } = await admin
    .from("projects")
    .select("nome, slug, descricao, status, previsao_entrega")
    .eq("id", parsed.data.projectId)
    .single();

  const { error } = await admin
    .from("projects")
    .update({
      nome: parsed.data.nome,
      slug: parsed.data.slug,
      descricao: parsed.data.descricao || null,
      status: parsed.data.status,
      previsao_entrega: parsed.data.previsaoEntrega || null,
    })
    .eq("id", parsed.data.projectId);

  if (error) {
    return { errors: { slug: "Já existe um projeto com esse slug nesta organização." } };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "editar_projeto",
    entidade: "projects",
    entidadeId: parsed.data.projectId,
    antes,
    depois: parsed.data,
  });

  revalidatePath(`/admin/projetos/${parsed.data.projectId}`);
  return { success: true, message: "Alterações salvas." };
}

export async function excluirProjetoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { data: projeto } = await admin
    .from("projects")
    .select("organization_id")
    .eq("id", projectId)
    .single();

  const { error } = await admin.from("projects").delete().eq("id", projectId);
  if (error) return { message: "Não foi possível excluir o projeto." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "excluir_projeto",
    entidade: "projects",
    entidadeId: projectId,
  });

  redirect(projeto ? `/admin/organizacoes/${projeto.organization_id}` : "/admin/organizacoes");
}
