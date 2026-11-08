/**
 * Relógio automático do projeto (PRD §4 e §7.6): pendência do cliente vencida
 * pausa o prazo; resolvida, retoma. Funções puras.
 */
import { diasEntre } from "./datas";

export interface TaskParaRelogio {
  id: string;
  dono: string;
  status: string;
  prazo: string | null;
  bloqueada_por_tier_id: string | null;
  vencida_registrada_em: string | null;
}

/** Pendência do cliente vencida: dono cliente, aberta, no escopo, prazo anterior a hoje. */
export function pendenciasVencidas<T extends TaskParaRelogio>(tasks: T[], hoje: string): T[] {
  return tasks.filter(
    (t) =>
      t.dono === "cliente" &&
      t.status !== "concluida" &&
      !t.bloqueada_por_tier_id &&
      t.prazo !== null &&
      t.prazo < hoje,
  );
}

/** Só vira evento client_task.overdue na primeira vez (dedupe por vencida_registrada_em). */
export function novasVencidas<T extends TaskParaRelogio>(vencidas: T[]): T[] {
  return vencidas.filter((t) => t.vencida_registrada_em === null);
}

export interface EstadoRelogio {
  relogio: string;
  relogioOrigem: string | null;
  pausadoEm: string | null;
}

export type DecisaoRelogio =
  | { acao: "pausar"; motivo: string }
  | { acao: "retomar"; diasPausados: number }
  | { acao: "nada" };

export function motivoPausaAutomatica(vencidas: { prazo: string | null }[]): string {
  const n = vencidas.length;
  return n === 1
    ? "Pendência do cliente vencida: 1 item com prazo expirado."
    : `Pendência do cliente vencida: ${n} itens com prazo expirado.`;
}

/**
 * - rodando + vencida => pausa (automática).
 * - pausado automático + nenhuma vencida => retoma.
 * - pausa manual nunca é retomada sozinha.
 */
export function decidirRelogio(
  estado: EstadoRelogio,
  vencidas: { prazo: string | null }[],
  agora: Date,
): DecisaoRelogio {
  if (estado.relogio === "rodando" && vencidas.length > 0) {
    return { acao: "pausar", motivo: motivoPausaAutomatica(vencidas) };
  }
  if (estado.relogio === "pausado" && estado.relogioOrigem === "automatico" && vencidas.length === 0) {
    return { acao: "retomar", diasPausados: estado.pausadoEm ? diasEntre(estado.pausadoEm, agora) : 0 };
  }
  return { acao: "nada" };
}
