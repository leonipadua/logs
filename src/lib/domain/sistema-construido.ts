import type { Progresso } from "./progress";

export interface TaskParaSistema {
  status: string;
  dono: string;
  bloqueada_por_tier_id: string | null;
  /** Etapa da sprint (S0..S4); null = fase legada/oferta, conta como construção. */
  etapa: string | null;
}

/**
 * % do sistema construído (PRD §3.3): entregas da Sabre dentro do escopo
 * contratado, concluídas sobre o total. Ficam de fora a burocracia de S0, o
 * ciclo contínuo de S4+, as pendências do cliente e as tasks bloqueadas por tier.
 */
export function calcularSistemaConstruido(tasks: TaskParaSistema[]): Progresso {
  const alvo = tasks.filter(
    (t) => t.dono === "sabre" && !t.bloqueada_por_tier_id && t.etapa !== "S0" && t.etapa !== "S4",
  );
  const concluidas = alvo.filter((t) => t.status === "concluida").length;
  return { concluidas, total: alvo.length, fracao: alvo.length === 0 ? 0 : concluidas / alvo.length };
}
