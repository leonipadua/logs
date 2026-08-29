import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCentavosBRL, formatDataPtBR } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

function inicioFimDoMes(base = new Date()) {
  const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
  const fim = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59);
  return { inicio, fim };
}

function limiteInadimplencia(): string {
  return new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
}

function diasEmAtraso(vencimento: string): number {
  return Math.floor((Date.now() - new Date(vencimento).getTime()) / 86400000);
}

export default async function FinanceiroPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { inicio, fim } = inicioFimDoMes();

  const [{ data: pagasNoMes }, { data: pendentesNoMes }, { data: assinaturasAtivas }, { data: proximasCobrancas }, { data: inadimplentes }, { data: organizacoes }] =
    await Promise.all([
      supabase
        .from("charges")
        .select("valor_centavos")
        .eq("status", "paga")
        .gte("data_pagamento", inicio.toISOString())
        .lte("data_pagamento", fim.toISOString()),
      supabase
        .from("charges")
        .select("valor_centavos")
        .in("status", ["pendente", "agendada"])
        .gte("vencimento", inicio.toISOString().slice(0, 10))
        .lte("vencimento", fim.toISOString().slice(0, 10)),
      supabase.from("subscriptions").select("valor_centavos").eq("status", "ativa").gt("valor_centavos", 0),
      supabase
        .from("charges")
        .select("id, vencimento, valor_centavos, tipo, organizations(nome)")
        .in("status", ["pendente", "agendada"])
        .order("vencimento", { ascending: true })
        .limit(20),
      supabase
        .from("charges")
        .select("id, vencimento, valor_centavos, organizations(nome)")
        .eq("status", "vencida")
        .lte("vencimento", limiteInadimplencia())
        .order("vencimento", { ascending: true }),
      supabase.from("organizations").select("id, nome, subscriptions(valor_centavos), charges(valor_centavos, status)"),
    ]);

  const receitaRealizada = (pagasNoMes ?? []).reduce((acc, c) => acc + c.valor_centavos, 0);
  const receitaPrevista = receitaRealizada + (pendentesNoMes ?? []).reduce((acc, c) => acc + c.valor_centavos, 0);
  const mrr = (assinaturasAtivas ?? []).reduce((acc, s) => acc + s.valor_centavos, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-md text-text-primary">Financeiro</h1>
        <a href="/admin/financeiro/exportar" className="text-body-sm text-accent-text hover:underline">
          Exportar CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-label uppercase text-text-tertiary">Receita realizada (mês)</p>
          <p className="mt-2 font-display text-display-sm tabular-nums text-text-primary">
            {formatCentavosBRL(receitaRealizada)}
          </p>
        </Card>
        <Card>
          <p className="text-label uppercase text-text-tertiary">Receita prevista (mês)</p>
          <p className="mt-2 font-display text-display-sm tabular-nums text-text-primary">
            {formatCentavosBRL(receitaPrevista)}
          </p>
        </Card>
        <Card>
          <p className="text-label uppercase text-text-tertiary">MRR</p>
          <p className="mt-2 font-display text-display-sm tabular-nums text-text-primary">{formatCentavosBRL(mrr)}</p>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-body-lg font-medium text-text-primary">Clientes</h2>
        <Table caption="Clientes e assinaturas">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Organização</TableHeaderCell>
              <TableHeaderCell align="right">Mensalidade</TableHeaderCell>
              <TableHeaderCell align="right">Total já pago (LTV)</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(organizacoes ?? []).map((org) => {
              const assinatura = Array.isArray(org.subscriptions) ? org.subscriptions[0] : org.subscriptions;
              const ltv = (org.charges ?? [])
                .filter((c: { status: string }) => c.status === "paga")
                .reduce((acc: number, c: { valor_centavos: number }) => acc + c.valor_centavos, 0);
              return (
                <TableRow key={org.id}>
                  <TableCell>
                    <Link href={`/admin/organizacoes/${org.id}`} className="hover:underline">
                      {org.nome}
                    </Link>
                  </TableCell>
                  <TableCell align="right" numeric>
                    {assinatura && assinatura.valor_centavos > 0 ? (
                      formatCentavosBRL(assinatura.valor_centavos)
                    ) : (
                      <span className="text-text-tertiary">sem recorrência</span>
                    )}
                  </TableCell>
                  <TableCell align="right" numeric>
                    {formatCentavosBRL(ltv)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-body-lg font-medium text-text-primary">Próximas cobranças</h2>
        {!proximasCobrancas || proximasCobrancas.length === 0 ? (
          <EmptyState title="Nada agendado" description="Não há cobranças pendentes no momento." />
        ) : (
          <Table caption="Próximas cobranças">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Vencimento</TableHeaderCell>
                <TableHeaderCell>Organização</TableHeaderCell>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell align="right">Valor</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proximasCobrancas.map((c) => {
                const org = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations;
                return (
                  <TableRow key={c.id}>
                    <TableCell numeric>{formatDataPtBR(c.vencimento)}</TableCell>
                    <TableCell>{org?.nome}</TableCell>
                    <TableCell>{c.tipo === "assinatura" ? "Assinatura" : "Desbloqueio"}</TableCell>
                    <TableCell align="right" numeric>
                      {formatCentavosBRL(c.valor_centavos)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-body-lg font-medium text-text-primary">Inadimplentes</h2>
        {!inadimplentes || inadimplentes.length === 0 ? (
          <EmptyState title="Nenhum inadimplente" description="Ninguém está com cobrança vencida há mais de 3 dias." />
        ) : (
          <ul className="flex flex-col gap-2">
            {inadimplentes.map((c) => {
              const org = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations;
              const dias = diasEmAtraso(c.vencimento);
              return (
                <li key={c.id} className="flex items-center justify-between rounded-md border border-border-subtle p-3">
                  <span className="text-body text-text-primary">{org?.nome}</span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums text-body-sm text-text-secondary">
                      {formatCentavosBRL(c.valor_centavos)}
                    </span>
                    <Badge tone="blocked">{dias} dias</Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
