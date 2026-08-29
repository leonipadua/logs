import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CriarOrganizacaoForm } from "../admin-forms";

export const dynamic = "force-dynamic";

export default async function OrganizacoesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: organizacoes } = await supabase
    .from("organizations")
    .select("id, nome, slug, arquivada_em, organization_members(id), projects(id)")
    .order("nome");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-display-md text-text-primary">Organizações</h1>

      <CriarOrganizacaoForm />

      {!organizacoes || organizacoes.length === 0 ? (
        <EmptyState title="Nenhuma organização ainda" description="Crie a primeira organização acima." />
      ) : (
        <div className="flex flex-col gap-3">
          {organizacoes.map((org) => (
            <Card key={org.id}>
              <Link href={`/admin/organizacoes/${org.id}`} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">
                    {org.nome} {org.arquivada_em && <span className="text-text-tertiary">(arquivada)</span>}
                  </p>
                  <p className="text-body-sm text-text-tertiary">/{org.slug}</p>
                </div>
                <p className="text-body-sm tabular-nums text-text-secondary">
                  {org.organization_members?.length ?? 0} membro(s) · {org.projects?.length ?? 0} projeto(s)
                </p>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
