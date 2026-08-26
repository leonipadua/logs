import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatCentavosBRL, formatDataPtBR, formatPercentPtBR } from "@/lib/format";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Amostra dos primitivos do design system — usada para conferir contraste
 * AA e comportamento nos dois temas (F0). Não faz parte do produto final.
 */
export default function UiPreviewPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header>
        <p className="text-label uppercase tracking-wide text-text-tertiary">
          Design system
        </p>
        <h1 className="font-display text-display-lg text-text-primary">
          Amostra de primitivos
        </h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-label uppercase text-text-tertiary">Botões</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Salvar alterações</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver detalhes</Button>
          <Button variant="primary" disabled>
            Desabilitado
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label uppercase text-text-tertiary">Badges de estado</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="done">Concluída</Badge>
          <Badge tone="progress">Em andamento</Badge>
          <Badge tone="pending">Pendente</Badge>
          <Badge tone="blocked">Bloqueada</Badge>
          <Badge tone="locked">Trancada</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label uppercase text-text-tertiary">Formulário</h2>
        <Card className="flex max-w-sm flex-col gap-4">
          <Field label="Nome do projeto" htmlFor="nome">
            <Input id="nome" name="nome" placeholder="Ex.: Agente de vendas" />
          </Field>
          <Field
            label="Email"
            htmlFor="email"
            error="Informe um email válido."
          >
            <Input id="email" name="email" invalid />
          </Field>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label uppercase text-text-tertiary">
          Tabela financeira
        </h2>
        <Card className="p-0">
          <Table caption="Cobranças recentes">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Organização</TableHeaderCell>
                <TableHeaderCell>Vencimento</TableHeaderCell>
                <TableHeaderCell align="right">Valor</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Padaria Boa Massa</TableCell>
                <TableCell numeric>{formatDataPtBR("2026-09-10")}</TableCell>
                <TableCell align="right" numeric>
                  {formatCentavosBRL(120000)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label uppercase text-text-tertiary">
          Progresso e skeleton
        </h2>
        <p className="font-display text-display-sm tabular-nums text-text-primary">
          {formatPercentPtBR(0.62)}
        </p>
        <Skeleton className="h-4 w-48" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label uppercase text-text-tertiary">Estado vazio</h2>
        <EmptyState
          title="Seu projeto está sendo montado"
          description="A Sabre está preparando as primeiras etapas. Você recebe um aviso assim que a timeline estiver pronta."
        />
      </section>
    </div>
  );
}
