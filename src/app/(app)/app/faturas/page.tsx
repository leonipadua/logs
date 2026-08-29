import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCentavosBRL, formatDataPtBR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  paga: "done",
  pendente: "progress",
  agendada: "progress",
  vencida: "blocked",
  falhou: "blocked",
  estornada: "blocked",
  cancelada: "neutral",
} as const;

export default async function FaturasPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: cobrancas } = await supabase
    .from("charges")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-display-md text-text-primary">Faturas</h1>

      {!cobrancas || cobrancas.length === 0 ? (
        <EmptyState title="Nenhuma cobrança ainda" description="O histórico de cobranças aparece aqui." />
      ) : (
        <Table caption="Histórico de cobranças">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Data</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Método</TableHeaderCell>
              <TableHeaderCell align="right">Valor</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cobrancas.map((c) => (
              <TableRow key={c.id}>
                <TableCell numeric>{formatDataPtBR(c.data_pagamento ?? c.vencimento)}</TableCell>
                <TableCell>{c.tipo === "assinatura" ? "Assinatura" : "Desbloqueio"}</TableCell>
                <TableCell className="capitalize">{c.metodo ?? "—"}</TableCell>
                <TableCell align="right" numeric>
                  {formatCentavosBRL(c.valor_centavos)}
                </TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[c.status as keyof typeof STATUS_TONE] ?? "neutral"}>{c.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
