import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type SessaoAtual = {
  userId: string;
  email: string;
  isAdmin: boolean;
  perfil: Tables<"profiles">;
};

/** Memoizado por render: uma consulta de sessão por requisição. */
export const getSessao = cache(async (): Promise<SessaoAtual | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!perfil) return null;

  return {
    userId: user.id,
    email: user.email ?? perfil.email,
    isAdmin: user.app_metadata?.role === "admin",
    perfil,
  };
});

/** Exige sessão válida com senha já trocada. Redireciona caso contrário. */
export async function requireUser(): Promise<SessaoAtual> {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  if (sessao.perfil.must_change_password) redirect("/trocar-senha");
  return sessao;
}

/** Exige papel admin global da Sabre. */
export async function requireAdmin(): Promise<SessaoAtual> {
  const sessao = await requireUser();
  if (!sessao.isAdmin) redirect("/app");
  return sessao;
}

/** Admin sempre pode; owner só na própria organização. */
export async function requireOrgOwnerOuAdmin(organizationId: string): Promise<SessaoAtual> {
  const sessao = await requireUser();
  if (sessao.isAdmin) return sessao;

  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", sessao.userId)
    .is("revogado_em", null)
    .eq("role", "owner")
    .maybeSingle();

  if (!data) redirect("/app");
  return sessao;
}

export async function getOrganizacoesDoUsuario(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role, organizations(id, nome, slug)")
    .eq("user_id", userId)
    .is("revogado_em", null);
  return data ?? [];
}
