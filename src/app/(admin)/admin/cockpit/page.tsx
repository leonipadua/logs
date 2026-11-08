import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ESTAGIO_LABEL, type Estagio } from "@/lib/domain/spin";
import { NovoLeadForm } from "./novo-lead-form";

export const dynamic = "force-dynamic";

export default async function CockpitIndexPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, nome, segmento, cidade, estagio, updated_at")
    .is("arquivada_em", null)
    .order("updated_at", { ascending: false });

  const leads = (orgs ?? []).filter((o) => o.estagio !== "cliente");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-md text-text-primary">Cockpit de vendas</h1>
        <p className="max-w-2xl text-body text-text-secondary">
          Escolha um lead para conduzir a call: captura SPIN, qualificação BANT e geração da proposta viva.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Novo lead</h2>
        <NovoLeadForm />
      </Card>

      <section className="flex flex-col gap-4" aria-labelledby="leads-h">
        <h2 id="leads-h" className="font-display text-display-sm text-text-primary">Leads no funil</h2>
        {leads.length === 0 ? (
          <EmptyState title="Nenhum lead no funil" description="Crie o primeiro lead acima para abrir o cockpit da conversa." />
        ) : (
          <Table caption="Leads no funil de vendas">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Empresa</TableHeaderCell>
                <TableHeaderCell>Segmento</TableHeaderCell>
                <TableHeaderCell>Estágio</TableHeaderCell>
                <TableHeaderCell align="right">Ação</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.nome}</TableCell>
                  <TableCell className="text-text-secondary">{[o.segmento, o.cidade].filter(Boolean).join(" · ") || "—"}</TableCell>
                  <TableCell>
                    <Badge tone={o.estagio === "fechado" ? "done" : "neutral"}>{ESTAGIO_LABEL[o.estagio as Estagio] ?? o.estagio}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Link href={`/admin/contas/${o.id}/cockpit`} className="text-accent-text underline-offset-2 hover:underline">
                      Abrir cockpit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
