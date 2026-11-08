import { CalendarClock, PauseCircle } from "lucide-react";
import { formatDataPtBR, formatDiaPtBR } from "@/lib/format";

interface ClockBannerProps {
  relogio: string;
  motivo: string | null;
  origem: string | null;
  pausadoEm: string | null;
  diasPausados: number;
  naFila: boolean;
  dataInicioPrevista: string | null;
}

/**
 * PRD §4: o relógio pausado é visível para os dois lados, com o motivo.
 * Nunca só cor: ícone + texto (DESIGN_SYSTEM §5.2).
 */
export function ClockBanner({
  relogio,
  motivo,
  origem,
  pausadoEm,
  diasPausados,
  naFila,
  dataInicioPrevista,
}: ClockBannerProps) {
  if (naFila) {
    return (
      <div role="status" className="flex gap-3 rounded-md border border-state-locked/20 bg-state-locked-bg px-4 py-3">
        <CalendarClock size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-state-locked" aria-hidden="true" />
        <div>
          <p className="text-body font-medium text-text-primary">Seu projeto está na fila de início</p>
          <p className="text-body-sm text-text-secondary">
            Para entregar com qualidade, a Sabre limita quantos projetos rodam ao mesmo tempo.
            {dataInicioPrevista ? ` Início previsto: ${formatDiaPtBR(dataInicioPrevista)}.` : " A data de início será confirmada em breve."}
          </p>
        </div>
      </div>
    );
  }

  if (relogio !== "pausado") return null;

  return (
    <div role="status" className="flex gap-3 rounded-md border border-state-blocked/20 bg-state-blocked-bg px-4 py-3">
      <PauseCircle size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-state-blocked" aria-hidden="true" />
      <div>
        <p className="text-body font-medium text-text-primary">Prazo do projeto pausado</p>
        <p className="text-body-sm text-text-secondary">
          {motivo ?? "Há uma pendência aguardando."}
          {pausadoEm ? ` Desde ${formatDataPtBR(pausadoEm)}.` : ""}
        </p>
        <p className="mt-1 text-body-sm text-text-secondary">
          {origem === "manual"
            ? "A Sabre pausou o prazo e vai avisar quando retomar."
            : "Assim que a pendência for resolvida, o prazo volta a correr sozinho."}
        </p>
        {diasPausados > 0 && (
          <p className="mt-1 text-body-sm tabular-nums text-text-tertiary">{diasPausados} dia(s) pausado(s) antes desta pausa.</p>
        )}
      </div>
    </div>
  );
}
