import type { Tables } from "@/lib/supabase/types";

export interface Progresso {
  concluidas: number;
  total: number;
  fracao: number;
}

/** Ofertas trancadas nunca entram neste cálculo (PRD E2, F4 adiciona o filtro). */
export function computeProgress(tasks: Pick<Tables<"tasks">, "status">[]): Progresso {
  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === "concluida").length;
  return { concluidas, total, fracao: total === 0 ? 0 : concluidas / total };
}
