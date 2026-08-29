import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReenviarConviteButton, RevogarUsuarioButton } from "../../admin-forms";
import { formatCentavosBRL } from "@/lib/format";
import {
  EditarOrganizacaoForm,
  ConvidarMembroFormAdmin,
  DefinirAssinaturaForm,
  ArquivarOrganizacaoForm,
} from "./org-detail-forms";

export const dynamic = "force-dynamic";

export default async function OrganizacaoDetailPage({ params }: PageProps<"/admin/organizacoes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("*").eq("id", id).maybeSingle();
  if (!org) notFound();

  const { data: membros } = await supabase
    .from("organization_members")
    .select("id, role, revogado_em, profiles(id, nome, email)")
    .eq("organization_id", id)
    .order("created_at", { ascending: false });

  const { data: projetos } = await supabase
    .from("projects")
    .select("id, nome, slug, status")
    .eq("organization_id", id)
    .order("nome");

  const { data: assinatura } = await supabase
    .from("subscriptions")
    .select("valor_centavos, dia_vencimento, status")
    .eq("organization_id", id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/organizacoes" className="text-body-sm text-text-secondary hover:text-text-primary">
          ← Organizações
        </Link>
        <h1 className="font-display text-display-md text-text-primary">{org.nome}</h1>
      </div>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Dados da organização</h2>
        <EditarOrganizacaoForm org={org} />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-body-lg font-medium text-text-primary">Projetos</h2>
          <Link
            href={`/admin/projetos/novo?organizationId=${org.id}`}
            className="text-body-sm text-accent-text hover:underline"
          >
            + Novo projeto
          </Link>
        </div>
        {!projetos || projetos.length === 0 ? (
          <EmptyState title="Nenhum projeto ainda" description="Crie o primeiro projeto desta organização." />
        ) : (
          <ul className="flex flex-col gap-2">
            {projetos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/projetos/${p.id}`}
                  className="flex items-center justify-between rounded-sm px-2 py-2 hover:bg-surface-sunken"
                >
                  <span className="text-body text-text-primary">{p.nome}</span>
                  <Badge tone={p.status === "concluido" ? "done" : "neutral"}>{p.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Membros</h2>
        <ul className="mb-6 flex flex-col gap-2">
          {(membros ?? []).length === 0 && (
            <li className="text-body-sm text-text-tertiary">Nenhum membro ainda.</li>
          )}
          {(membros ?? []).map((m) => {
            const perfil = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
            return (
              <li key={m.id} className="flex items-center justify-between gap-2 text-body-sm">
                <span>
                  {perfil?.nome} <span className="text-text-tertiary">({perfil?.email})</span>{" "}
                  <Badge tone={m.revogado_em ? "blocked" : "neutral"}>{m.revogado_em ? "revogado" : m.role}</Badge>
                </span>
                {!m.revogado_em && perfil && (
                  <span className="flex gap-2">
                    <ReenviarConviteButton email={perfil.email} organizationId={org.id} />
                    <RevogarUsuarioButton userId={perfil.id} organizationId={org.id} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <ConvidarMembroFormAdmin organizationId={org.id} />
      </Card>

      <Card>
        <h2 className="mb-1 text-body-lg font-medium text-text-primary">Assinatura</h2>
        <p className="mb-4 text-body-sm text-text-tertiary">
          {assinatura && assinatura.valor_centavos > 0
            ? `${formatCentavosBRL(assinatura.valor_centavos)}/mês, vencimento dia ${assinatura.dia_vencimento}`
            : "Sem recorrência"}
        </p>
        <DefinirAssinaturaForm
          organizationId={org.id}
          valorAtualCentavos={assinatura?.valor_centavos ?? 0}
          diaVencimentoAtual={assinatura?.dia_vencimento ?? 10}
        />
      </Card>

      {!org.arquivada_em && (
        <Card>
          <h2 className="mb-2 text-body-lg font-medium text-text-primary">Zona de risco</h2>
          <p className="mb-4 text-body-sm text-text-secondary">
            Arquivar oculta a organização das listas ativas. Os dados são preservados.
          </p>
          <ArquivarOrganizacaoForm organizationId={org.id} />
        </Card>
      )}
    </div>
  );
}
