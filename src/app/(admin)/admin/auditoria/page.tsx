import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDataHoraPtBR } from "@/lib/format";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: eventos } = await supabase
    .from("audit_log")
    .select("id, acao, entidade, entidade_id, created_at, actor_id, profiles(nome, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-display-md text-text-primary">Auditoria</h1>

      {!eventos || eventos.length === 0 ? (
        <EmptyState title="Nenhum evento ainda" description="As mutações do painel aparecem aqui." />
      ) : (
        <Table caption="Log de auditoria">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Quando</TableHeaderCell>
              <TableHeaderCell>Quem</TableHeaderCell>
              <TableHeaderCell>Ação</TableHeaderCell>
              <TableHeaderCell>Entidade</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {eventos.map((ev) => {
              const perfil = Array.isArray(ev.profiles) ? ev.profiles[0] : ev.profiles;
              return (
                <TableRow key={ev.id}>
                  <TableCell numeric>{formatDataHoraPtBR(ev.created_at)}</TableCell>
                  <TableCell>{perfil?.nome ?? "—"}</TableCell>
                  <TableCell>{ev.acao}</TableCell>
                  <TableCell className="text-text-tertiary">
                    {ev.entidade}
                    {ev.entidade_id ? ` · ${ev.entidade_id.slice(0, 8)}` : ""}
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
