import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDiaPtBR } from "@/lib/format";
import type { carregarVisaoCapacidade } from "@/lib/data/capacidade";
import Link from "next/link";

type Visao = Awaited<ReturnType<typeof carregarVisaoCapacidade>>;

/** Capacidade é limite duro (PRD §7.8): vagas em S0–S3 e fila com data de início explícita. */
export function CapacidadeCard({ visao, destaqueId }: { visao: Visao; destaqueId?: string }) {
  const { capacidade, ocupantes, fila } = visao;
  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-body-lg font-medium text-text-primary">Capacidade</h2>
        <Badge tone={capacidade.cheia ? "blocked" : "done"}>
          {capacidade.cheia ? "Cheia" : `${capacidade.livre} vaga(s) livre(s)`}
        </Badge>
      </div>
      <p className="mb-4 font-display text-display-sm tabular-nums text-text-primary">
        {capacidade.ocupados} de {capacidade.max} em S0–S3
      </p>

      <h3 className="mb-2 text-label uppercase text-text-tertiary">Ocupando vagas</h3>
      {ocupantes.length === 0 ? (
        <p className="mb-4 text-body-sm text-text-secondary">Nenhum projeto em S0–S3.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-1">
          {ocupantes.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-body-sm">
              <Link href={`/admin/projetos/${p.id}`} className={p.id === destaqueId ? "font-medium text-text-primary" : "text-text-secondary hover:underline"}>
                {p.nome} · S{p.semanaAtual}
              </Link>
              <span className="tabular-nums text-text-tertiary">libera ~{p.data ? formatDiaPtBR(p.data) : "—"}</span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-2 text-label uppercase text-text-tertiary">Fila</h3>
      {fila.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Ninguém esperando.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {fila.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between text-body-sm">
              <Link href={`/admin/projetos/${p.id}`} className={p.id === destaqueId ? "font-medium text-text-primary" : "text-text-secondary hover:underline"}>
                {i + 1}. {p.nome} ({p.organizacao})
              </Link>
              <span className="tabular-nums text-text-tertiary">início {p.data ? formatDiaPtBR(p.data) : "a definir"}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
