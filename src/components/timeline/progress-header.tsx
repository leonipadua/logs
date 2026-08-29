import { formatDataHoraPtBR, formatPercentPtBR } from "@/lib/format";
import type { Progresso } from "@/lib/domain/progress";

interface ProgressHeaderProps {
  nomeProjeto: string;
  progresso: Progresso;
  atualizadoEm: string;
}

export function ProgressHeader({ nomeProjeto, progresso, atualizadoEm }: ProgressHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-display-md text-text-primary">{nomeProjeto}</h1>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-display-sm tabular-nums text-text-primary">
          {formatPercentPtBR(progresso.fracao)}
        </span>
        <span className="text-body-sm tabular-nums text-text-secondary">
          {progresso.concluidas} de {progresso.total} etapas concluídas
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-[400ms] ease-[cubic-bezier(0.2,0,0,1)]"
          style={{ width: `${Math.round(progresso.fracao * 100)}%` }}
        />
      </div>
      <p className="text-body-sm text-text-tertiary">Atualizado em {formatDataHoraPtBR(atualizadoEm)}</p>
    </header>
  );
}
