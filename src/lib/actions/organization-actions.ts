"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarOrganizacaoSchema } from "@/lib/validation/auth";
import { editarOrganizacaoSchema } from "@/lib/validation/admin";
import type { FormState } from "./form-state";

export async function criarOrganizacaoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = criarOrganizacaoSchema.safeParse({
    nome: formData.get("nome"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .insert({ nome: parsed.data.nome, slug: parsed.data.slug })
    .select("id")
    .single();

  if (error) {
    return { errors: { slug: "Já existe uma organização com esse slug." } };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_organizacao",
    entidade: "organizations",
    entidadeId: data.id,
    depois: parsed.data,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/organizacoes");
  return { success: true };
}

export async function editarOrganizacaoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = editarOrganizacaoSchema.safeParse({
    organizationId: formData.get("organizationId"),
    nome: formData.get("nome"),
    slug: formData.get("slug"),
    documento: formData.get("documento"),
    telefone: formData.get("telefone"),
    emailFaturamento: formData.get("emailFaturamento"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const admin = createAdminClient();
  const { data: antes } = await admin
    .from("organizations")
    .select("nome, slug, documento, telefone, email_faturamento")
    .eq("id", parsed.data.organizationId)
    .single();

  const { error } = await admin
    .from("organizations")
    .update({
      nome: parsed.data.nome,
      slug: parsed.data.slug,
      documento: parsed.data.documento || null,
      telefone: parsed.data.telefone || null,
      email_faturamento: parsed.data.emailFaturamento || null,
    })
    .eq("id", parsed.data.organizationId);

  if (error) {
    return { errors: { slug: "Já existe uma organização com esse slug." } };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "editar_organizacao",
    entidade: "organizations",
    entidadeId: parsed.data.organizationId,
    antes,
    depois: parsed.data,
  });

  revalidatePath(`/admin/organizacoes/${parsed.data.organizationId}`);
  return { success: true, message: "Alterações salvas." };
}

export async function arquivarOrganizacaoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();
  const organizationId = String(formData.get("organizationId") ?? "");
  if (!organizationId) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ arquivada_em: new Date().toISOString() })
    .eq("id", organizationId);
  if (error) return { message: "Não foi possível arquivar a organização." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "arquivar_organizacao",
    entidade: "organizations",
    entidadeId: organizationId,
  });

  revalidatePath("/admin/organizacoes");
  return { success: true };
}
