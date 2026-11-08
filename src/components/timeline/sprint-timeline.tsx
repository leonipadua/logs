import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { formatDiaPtBR, formatPercentPtBR } from "@/lib/format";
import { dentroDoEscopo, separarDescricaoSprint } from "@/lib/domain/sprint";
import { cn } from "@/lib/utils/cn";
import { TaskItem } from "./task-item";

type Fase = Tables<"phases"> & { tasks: Tables<"tasks">[] };

const STATUS = {
  concluida: { label: "Concluída", icon: CheckCircle2, cor: "text-state-done", fundo: "bg-state-done-bg" },
  em_andamento: { label: "Sprint atual", icon: CircleDot, cor: "text-state-progress", fundo: "bg-state-progress-bg" },
  pendente: { label: "Próxima", icon: Circle, cor: "text-state-pending", fundo: "bg-state-pending-bg" },
} as const;

/** Linha do tempo S0–S4+ (PRD §3.3): sprint atual em destaque, demais recolhidas. */
export function SprintTimeline({
  fases,
  projectSlug,
  aguardandoPagamento,
}: {
  fases: Fase[];
  projectSlug: string;
  /** S1+ ainda não começa: primeira cobrança sem pagamento (regra 7). */
  aguardandoPagamento: boolean;
}) {
  const atual = fases.find((f) => f.status === "em_andamento") ?? fases.find((f) => f.status === "pendente");

  return (
    <ol className="flex flex-col gap-4" aria-label="Linha do tempo do projeto">
      {fases.map((fase) => {
        const status = STATUS[fase.status as keyof typeof STATUS] ?? STATUS.pendente;
        const Icon = status.icon;
        const ehAtual = fase.id === atual?.id;
        const escopo = dentroDoEscopo(fase.tasks);
        const feitas = escopo.filter((t) => t.status === "concluida").length;
        const { objetivo, dependeDoCliente } = separarDescricaoSprint(fase.descricao);
        const bloqueadaPorPagamento = aguardandoPagamento && fase.etapa !== "S0" && fase.status === "pendente";

        const cabecalho = (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", status.fundo)}>
                <Icon size={16} strokeWidth={1.5} className={status.cor} aria-hidden="true" />
              </span>
              <span className={cn("text-body-lg font-medium", ehAtual ? "text-text-primary" : "text-text-secondary")}>
                {fase.titulo}
              </span>
              <span className={cn("text-label uppercase", status.cor)}>{status.label}</span>
            </span>
            <span className="text-body-sm tabular-nums text-text-tertiary">
              {escopo.length > 0 && `${formatPercentPtBR(feitas / escopo.length)} · `}
              {fase.inicio_previsto && fase.fim_previsto
                ? `${formatDiaPtBR(fase.inicio_previsto)} a ${formatDiaPtBR(fase.fim_previsto)}`
                : ""}
            </span>
          </div>
        );

        const corpo = (
          <div className="mt-3 flex flex-col gap-3">
            {objetivo && <p className="text-body-sm text-text-secondary">{objetivo}</p>}
            {bloqueadaPorPagamento && (
              <p className="text-body-sm text-state-progress">Começa assim que a primeira cobrança for paga.</p>
            )}
            {fase.criterio_pronto && (
              <p className="text-body-sm text-text-secondary">
                <span className="font-medium text-text-primary">Pronto quando: </span>
                {fase.criterio_pronto}
              </p>
            )}
            {dependeDoCliente && (
              <p className="text-body-sm text-text-secondary">
                <span className="font-medium text-text-primary">Depende de você: </span>
                {dependeDoCliente}
              </p>
            )}
            <ol className="flex flex-col gap-3">
              {escopo.map((task) => (
                <TaskItem key={task.id} task={task} projectSlug={projectSlug} />
              ))}
            </ol>
          </div>
        );

        return (
          <li key={fase.id} aria-current={ehAtual ? "step" : undefined}>
            {ehAtual ? (
              <div className="rounded-md border border-accent/30 bg-surface-raised p-5">
                {cabecalho}
                {corpo}
              </div>
            ) : (
              <details className="rounded-md border border-border-subtle px-5 py-3">
                <summary className="cursor-pointer list-none">{cabecalho}</summary>
                {corpo}
              </details>
            )}
          </li>
        );
      })}
    </ol>
  );
}
