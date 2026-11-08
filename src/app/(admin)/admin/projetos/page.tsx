import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { carregarVisaoCapacidade } from "@/lib/data/capacidade";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CapacidadeCard } from "./capacidade-card";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  await requireAdmin();
  const supabase = await createClient();
  const visao = await carregarVisaoCapacidade(supabase);

  const { data: projetos } = await supabase
    .from("projects")
    .select("id, nome, status, semana_atual, na_fila, relogio, organizations(nome)")
    .neq("status", "arquivado")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-display-md text-text-primary">Projetos</h1>
      <CapacidadeCard visao={visao} />

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Todos os projetos</h2>
        {(projetos ?? []).length === 0 ? (
          <EmptyState title="Nenhum projeto ainda" description="Projetos nascem no aceite de uma proposta ou em Organizações." />
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle">
            {(projetos ?? []).map((p) => {
              const org = Array.isArray(p.organizations) ? p.organizations[0] : p.organizations;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/admin/projetos/${p.id}`} className="flex flex-col hover:underline">
                    <span className="text-body text-text-primary">{p.nome}</span>
                    <span className="text-body-sm text-text-tertiary">{org?.nome}</span>
                  </Link>
                  <span className="flex items-center gap-2">
                    {p.na_fila && <Badge tone="locked">Na fila</Badge>}
                    {p.relogio === "pausado" && <Badge tone="blocked">Relógio pausado</Badge>}
                    {p.semana_atual !== null && !p.na_fila && <Badge tone="progress">S{Math.min(p.semana_atual, 4)}</Badge>}
                    <Badge tone="neutral">{p.status}</Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
