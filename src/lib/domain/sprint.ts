/**
 * Regras de sprint (PRD §4 e §7): critério de pronto, fechamento e o gating
 * "sem sprint sem pagamento". Funções puras; o I/O fica em src/lib/projects.
 */

export const ETAPAS = ["S0", "S1", "S2", "S3", "S4"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const ROTULO_ETAPA: Record<Etapa, string> = {
  S0: "S0 · Pré-kickoff",
  S1: "S1 · Onboarding de dados",
  S2: "S2 · Construção",
  S3: "S3 · Entrega",
  S4: "S4+ · Otimização",
};

export function ehEtapa(valor: unknown): valor is Etapa {
  return typeof valor === "string" && (ETAPAS as readonly string[]).includes(valor);
}

/** Semana do projeto = índice da etapa (S0 = 0 … S4 = 4). */
export function semanaDaEtapa(etapa: Etapa): number {
  return ETAPAS.indexOf(etapa);
}

/** S4+ é cíclica: não tem próxima etapa. */
export function proximaEtapa(etapa: Etapa): Etapa | null {
  const i = ETAPAS.indexOf(etapa);
  return i >= 0 && i < ETAPAS.length - 1 ? ETAPAS[i + 1] : null;
}

export interface TaskDeSprint {
  status: string;
  dono: string;
  bloqueada_por_tier_id: string | null;
}

/** Task bloqueada por tier é oportunidade de upgrade: fora do escopo contratado. */
export function dentroDoEscopo<T extends Pick<TaskDeSprint, "bloqueada_por_tier_id">>(tasks: T[]): T[] {
  return tasks.filter((t) => !t.bloqueada_por_tier_id);
}

export interface ContextoSprint {
  /** Primeira cobrança do contrato paga (charges.status = 'paga'). */
  pagamentoConfirmado: boolean;
  /** Existe reunião de kickoff agendada. */
  kickoffMarcado: boolean;
}

export type Veredito = { ok: true } | { ok: false; pendencias: string[] };

/** Regra 7 do PRD: S1 (e as seguintes) só começam com a primeira cobrança paga. */
export function podeIniciarSprint(etapa: Etapa, ctx: Pick<ContextoSprint, "pagamentoConfirmado">): Veredito {
  if (etapa === "S0") return { ok: true };
  if (!ctx.pagamentoConfirmado) {
    return { ok: false, pendencias: ["Primeira cobrança ainda não foi paga: sem sprint sem pagamento."] };
  }
  return { ok: true };
}

/**
 * Critério de pronto. S0 = pagamento confirmado + kickoff marcado. As demais
 * fecham quando toda task dentro do escopo está concluída.
 */
export function avaliarCriterioPronto(etapa: Etapa, tasks: TaskDeSprint[], ctx: ContextoSprint): Veredito {
  const pendencias: string[] = [];

  if (etapa === "S0") {
    if (!ctx.pagamentoConfirmado) pendencias.push("Pagamento da primeira cobrança não confirmado.");
    if (!ctx.kickoffMarcado) pendencias.push("Kickoff não agendado.");
  } else {
    const escopo = dentroDoEscopo(tasks);
    if (escopo.length === 0) pendencias.push("A sprint não tem entregas cadastradas.");
    const abertas = escopo.filter((t) => t.status !== "concluida");
    if (abertas.length > 0) {
      const cliente = abertas.filter((t) => t.dono === "cliente").length;
      const sabre = abertas.length - cliente;
      if (sabre > 0) pendencias.push(`${sabre} entrega(s) da Sabre em aberto.`);
      if (cliente > 0) pendencias.push(`${cliente} pendência(s) do cliente em aberto.`);
    }
  }

  return pendencias.length === 0 ? { ok: true } : { ok: false, pendencias };
}

/** Fechar sprint exige a sprint em andamento e o critério batendo. */
export function podeFecharSprint(
  sprint: { etapa: Etapa; status: string },
  tasks: TaskDeSprint[],
  ctx: ContextoSprint,
): Veredito {
  if (sprint.status === "concluida") return { ok: false, pendencias: ["A sprint já está fechada."] };
  if (sprint.status !== "em_andamento") return { ok: false, pendencias: ["A sprint ainda não começou."] };
  return avaliarCriterioPronto(sprint.etapa, tasks, ctx);
}

const MARCADOR_DEPENDE = "\n\nDepende do cliente: ";

/** phases.descricao guarda "objetivo + depende do cliente" num só texto. */
export function comporDescricaoSprint(objetivo: string, dependeDoCliente: string): string {
  return `${objetivo}${MARCADOR_DEPENDE}${dependeDoCliente}`;
}

export function separarDescricaoSprint(descricao: string | null): { objetivo: string; dependeDoCliente: string | null } {
  if (!descricao) return { objetivo: "", dependeDoCliente: null };
  const i = descricao.indexOf(MARCADOR_DEPENDE);
  if (i < 0) return { objetivo: descricao, dependeDoCliente: null };
  return { objetivo: descricao.slice(0, i), dependeDoCliente: descricao.slice(i + MARCADOR_DEPENDE.length) };
}
