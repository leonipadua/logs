import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { formatDataHoraPtBR } from "@/lib/format";
import { SINAL_LABEL, sinalFollowUp } from "@/lib/domain/proposal";
import { CopiarLinkButton, MarcarEnviadaForm } from "./propostas-forms";

export const dynamic = "force-dynamic";

const STATUS = {
  rascunho: { tone: "pending", label: "Rascunho" },
  enviada: { tone: "progress", label: "Enviada" },
  aceita: { tone: "done", label: "Aceita" },
} as const;

export default async function PropostasPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: propostas } = await supabase
    .from("proposals")
    .select("id, token, titulo, status, view_count, first_viewed_at, last_viewed_at, enviada_em, aceita_em, validade_ate, organizations(id, nome), tiers!proposals_tier_id_fkey(nome)")
    .order("created_at", { ascending: false });

  const agora = new Date();
  const lista = propostas ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-md text-text-primary">Propostas</h1>
        <p className="max-w-2xl text-body text-text-secondary">
          Acompanhe o que foi enviado e quando o lead abriu a página: a visualização é o melhor sinal para o follow-up.
        </p>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          title="Nenhuma proposta ainda"
          description="Propostas nascem no cockpit, a partir das dores capturadas na call."
          action={<Link href="/admin/cockpit" className="text-accent-text underline-offset-2 hover:underline">Abrir o cockpit</Link>}
        />
      ) : (
        <Table caption="Propostas, status e visualizações">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Conta</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell align="right">Visualizações</TableHeaderCell>
              <TableHeaderCell>Última visualização</TableHeaderCell>
              <TableHeaderCell>Follow-up</TableHeaderCell>
              <TableHeaderCell align="right">Ação</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lista.map((p) => {
              const st = STATUS[p.status as keyof typeof STATUS] ?? STATUS.rascunho;
              const sinal = sinalFollowUp(p, agora);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/contas/${p.organizations?.id}/cockpit`} className="text-text-primary underline-offset-2 hover:underline">
                      {p.organizations?.nome ?? "—"}
                    </Link>
                    {p.tiers?.nome && <span className="block text-text-tertiary">{p.tiers.nome}</span>}
                  </TableCell>
                  <TableCell><Badge tone={st.tone}>{st.label}</Badge></TableCell>
                  <TableCell align="right" numeric>{p.view_count}</TableCell>
                  <TableCell numeric className="text-text-secondary">{p.last_viewed_at ? formatDataHoraPtBR(p.last_viewed_at) : "Ainda não aberta"}</TableCell>
                  <TableCell>
                    {sinal ? <Badge tone={sinal === "quente" ? "done" : "progress"}>{SINAL_LABEL[sinal]}</Badge> : <span className="text-text-tertiary">—</span>}
                  </TableCell>
                  <TableCell align="right">
                    {p.status === "rascunho" ? <MarcarEnviadaForm proposalId={p.id} /> : <CopiarLinkButton token={p.token} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
