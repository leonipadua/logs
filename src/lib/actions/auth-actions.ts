"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarLimite } from "@/lib/rate-limit";
import { validarPoliticaSenha } from "@/lib/auth/passwords";
import { enviarEmailComLog } from "@/lib/email/send-and-log";
import { templateRecuperacaoSenha } from "@/lib/email/templates";
import {
  loginSchema,
  trocarSenhaSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
} from "@/lib/validation/auth";
import type { FormState } from "./form-state";

async function ipDoRequisitante(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
}

/** Encerra as demais sessões do usuário, mantendo apenas a atual. */
async function encerrarOutrasSessoes(accessToken: string) {
  const admin = createAdminClient();
  await admin.auth.admin.signOut(accessToken, "others");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }
  const { email, senha } = parsed.data;
  const ip = await ipDoRequisitante();

  const [porEmail, porIp] = await Promise.all([
    verificarLimite({ chave: `login:email:${email}`, limite: 5, janelaSegundos: 900 }),
    verificarLimite({ chave: `login:ip:${ip}`, limite: 20, janelaSegundos: 900 }),
  ]);
  if (porEmail.excedido || porIp.excedido) {
    return { message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error || !data.user) {
    return { message: "Email ou senha inválidos." };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("must_change_password")
    .eq("id", data.user.id)
    .single();

  if (perfil?.must_change_password) {
    const admin = createAdminClient();
    const { data: convite } = await admin
      .from("invitations")
      .select("expira_em")
      .eq("email", email)
      .is("aceito_em", null)
      .is("revogado_em", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (convite && new Date(convite.expira_em) < new Date()) {
      await supabase.auth.signOut();
      redirect("/convite-expirado");
    }
    redirect("/trocar-senha");
  }

  const next = formData.get("next");
  const destino = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  redirect(destino);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function trocarSenhaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = trocarSenhaSchema.safeParse({
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }
  const erroPolitica = validarPoliticaSenha(parsed.data.senha);
  if (erroPolitica) return { errors: { senha: erroPolitica } };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) return { message: "Não foi possível trocar a senha. Tente de novo." };

  const admin = createAdminClient();
  await admin.from("profiles").update({ must_change_password: false }).eq("id", user!.id);
  await admin
    .from("invitations")
    .update({ aceito_em: new Date().toISOString() })
    .eq("email", user!.email!)
    .is("aceito_em", null);

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    await encerrarOutrasSessoes(sessionData.session.access_token);
  }

  redirect("/app");
}

export async function recuperarSenhaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = recuperarSenhaSchema.safeParse({ email: formData.get("email") });
  const mensagemGenerica = {
    message: "Se este email existir, enviaremos instruções de recuperação.",
  };
  if (!parsed.success) return mensagemGenerica;

  const ip = await ipDoRequisitante();
  const [porEmail, porIp] = await Promise.all([
    verificarLimite({ chave: `recuperar:email:${parsed.data.email}`, limite: 3, janelaSegundos: 3600 }),
    verificarLimite({ chave: `recuperar:ip:${ip}`, limite: 10, janelaSegundos: 3600 }),
  ]);
  if (porEmail.excedido || porIp.excedido) return mensagemGenerica;

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
  });

  if (data?.properties?.hashed_token) {
    const origin = (await headers()).get("origin") ?? "";
    const link = `${origin}/redefinir-senha?token_hash=${data.properties.hashed_token}`;
    const { assunto, html, texto } = templateRecuperacaoSenha({ urlRedefinir: link });
    await enviarEmailComLog({ para: parsed.data.email, assunto, html, texto, tag: "M2" });
  }

  return mensagemGenerica;
}

export async function redefinirSenhaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = redefinirSenhaSchema.safeParse({
    tokenHash: formData.get("tokenHash"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }
  const erroPolitica = validarPoliticaSenha(parsed.data.senha);
  if (erroPolitica) return { errors: { senha: erroPolitica } };

  const supabase = await createClient();
  const { error: erroVerificacao } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.tokenHash,
    type: "recovery",
  });
  if (erroVerificacao) {
    return { message: "Link inválido ou expirado. Peça uma nova recuperação." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) return { message: "Não foi possível redefinir a senha. Tente de novo." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    await admin.from("profiles").update({ must_change_password: false }).eq("id", user.id);
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    await encerrarOutrasSessoes(sessionData.session.access_token);
  }

  redirect("/app");
}
