"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireOrgOwnerOuAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarSenhaTemporaria } from "@/lib/auth/passwords";
import { enviarEmailComLog } from "@/lib/email/send-and-log";
import { templateConvite } from "@/lib/email/templates";
import { convidarUsuarioSchema } from "@/lib/validation/auth";
import type { FormState } from "./form-state";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function enviarConviteEmail(
  nome: string,
  email: string,
  senhaTemporaria: string,
  origin: string,
  organizationId: string,
) {
  const { assunto, html, texto } = templateConvite({
    nome,
    email,
    senhaTemporaria,
    urlLogin: `${origin}/login`,
  });
  await enviarEmailComLog({ para: email, assunto, html, texto, tag: "M1" }, organizationId);
}

export async function convidarUsuarioAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const parsed = convidarUsuarioSchema.safeParse({
    organizationId,
    nome: formData.get("nome"),
    email: formData.get("email"),
    role: formData.get("role") ?? "member",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const sessao = await requireOrgOwnerOuAdmin(parsed.data.organizationId);
  // Owner nunca convida como owner — só o admin global pode.
  const role = sessao.isAdmin ? parsed.data.role : "member";

  const admin = createAdminClient();
  const senhaTemporaria = gerarSenhaTemporaria();

  const { data: novoUsuario, error: erroCriacao } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: senhaTemporaria,
    email_confirm: true,
    user_metadata: { nome: parsed.data.nome },
  });

  if (erroCriacao || !novoUsuario.user) {
    return { errors: { email: "Não foi possível convidar este email (talvez já exista)." } };
  }

  await admin.from("organization_members").insert({
    organization_id: parsed.data.organizationId,
    user_id: novoUsuario.user.id,
    role,
  });

  const tokenBruto = randomBytes(32).toString("hex");
  await admin.from("invitations").insert({
    organization_id: parsed.data.organizationId,
    email: parsed.data.email,
    nome: parsed.data.nome,
    role,
    token_hash: hashToken(tokenBruto),
    convidado_por: sessao.userId,
  });

  await enviarConviteEmail(
    parsed.data.nome,
    parsed.data.email,
    senhaTemporaria,
    (formData.get("origin") as string) ?? "",
    parsed.data.organizationId,
  );

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "convidar_usuario",
    entidade: "organization_members",
    entidadeId: novoUsuario.user.id,
    depois: { email: parsed.data.email, role, organizationId: parsed.data.organizationId },
  });

  revalidatePath("/admin");
  return { success: true, message: `Senha temporária (mostrada uma única vez): ${senhaTemporaria}` };
}

export async function reenviarConviteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  if (!email || !organizationId) return { message: "Dados inválidos." };

  const sessao = await requireOrgOwnerOuAdmin(organizationId);
  const admin = createAdminClient();

  const { data: perfil } = await admin.from("profiles").select("id, nome").eq("email", email).maybeSingle();
  if (!perfil) return { message: "Usuário não encontrado." };

  const novaSenha = gerarSenhaTemporaria();
  await admin.auth.admin.updateUserById(perfil.id, { password: novaSenha });
  await admin.from("profiles").update({ must_change_password: true }).eq("id", perfil.id);

  const tokenBruto = randomBytes(32).toString("hex");
  await admin
    .from("invitations")
    .update({ revogado_em: new Date().toISOString() })
    .eq("email", email)
    .is("aceito_em", null);
  await admin.from("invitations").insert({
    organization_id: organizationId,
    email,
    token_hash: hashToken(tokenBruto),
    convidado_por: sessao.userId,
  });

  await enviarConviteEmail(perfil.nome, email, novaSenha, (formData.get("origin") as string) ?? "", organizationId);

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "reenviar_convite",
    entidade: "invitations",
    entidadeId: perfil.id,
  });

  revalidatePath("/admin");
  return { success: true, message: `Nova senha temporária (mostrada uma única vez): ${novaSenha}` };
}

export async function revogarUsuarioAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!organizationId || !userId) return { message: "Dados inválidos." };

  const sessao = await requireOrgOwnerOuAdmin(organizationId);

  if (!sessao.isAdmin) {
    const admin = createAdminClient();
    const { data: alvo } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (alvo?.role === "owner" || userId === sessao.userId) {
      return { message: "Um owner não pode revogar outro owner nem a si mesmo." };
    }
  }

  const admin = createAdminClient();
  await admin
    .from("organization_members")
    .update({ revogado_em: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "revogar_usuario",
    entidade: "organization_members",
    entidadeId: userId,
  });

  revalidatePath("/admin");
  return { success: true };
}

