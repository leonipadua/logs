import { requireUser, getOrganizacoesDoUsuario } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrocarSenhaVoluntariaForm, ConvidarMembroForm, NotificacaoTaskToggle } from "./conta-forms";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const sessao = await requireUser();
  const organizacoes = await getOrganizacoesDoUsuario(sessao.userId);
  const supabase = await createClient();

  const organizacoesComMembros = await Promise.all(
    organizacoes.map(async (vinculo) => {
      const org = Array.isArray(vinculo.organizations) ? vinculo.organizations[0] : vinculo.organizations;
      if (!org || vinculo.role !== "owner") return { org, role: vinculo.role, membros: [] as { nome: string; email: string }[] };

      const { data: membros } = await supabase
        .from("organization_members")
        .select("role, revogado_em, profiles(nome, email)")
        .eq("organization_id", org.id)
        .is("revogado_em", null);

      return {
        org,
        role: vinculo.role,
        membros: (membros ?? []).map((m) => {
          const perfil = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return { nome: perfil?.nome ?? "", email: perfil?.email ?? "" };
        }),
      };
    }),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-12">
      <div>
        <p className="text-label uppercase tracking-wide text-text-tertiary">Sua conta</p>
        <h1 className="font-display text-display-md text-text-primary">{sessao.perfil.nome}</h1>
        <p className="text-body-sm text-text-secondary">{sessao.perfil.email}</p>
      </div>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Trocar senha</h2>
        <TrocarSenhaVoluntariaForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Notificações por email</h2>
        <NotificacaoTaskToggle ativo={sessao.perfil.notificar_task_concluida} />
      </Card>

      {organizacoesComMembros
        .filter((o) => o.role === "owner")
        .map(({ org, membros }) =>
          org ? (
            <Card key={org.id}>
              <h2 className="mb-1 text-body-lg font-medium text-text-primary">{org.nome}</h2>
              <p className="mb-4 text-body-sm text-text-tertiary">Membros da sua organização</p>
              <ul className="mb-6 flex flex-col gap-2">
                {membros.map((m) => (
                  <li key={m.email} className="flex items-center gap-2 text-body-sm text-text-primary">
                    {m.nome} <span className="text-text-tertiary">({m.email})</span>
                    <Badge tone="neutral">membro</Badge>
                  </li>
                ))}
              </ul>
              <ConvidarMembroForm organizationId={org.id} />
            </Card>
          ) : null,
        )}
    </div>
  );
}
