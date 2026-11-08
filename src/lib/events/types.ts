/**
 * Catálogo tipado dos eventos mínimos do PRD v2 §6. Um evento = tipo + ator +
 * entidade + payload. Para criar um evento novo: adicione aqui (ENTIDADE_DO_EVENTO
 * e EventPayloads); o compilador força o resto.
 */

export type AtorTipo = "admin" | "cliente" | "lead" | "sistema";

export interface Ator {
  tipo: AtorTipo;
  /** profiles.id quando houver sessão; null para lead (token) e sistema (cron/webhook). */
  id?: string | null;
}

export type TipoCall = "prospeccao" | "diagnostico" | "vendas";
export type TipoSpin = "situacao" | "problema" | "implicacao" | "necessidade";

export interface EventPayloads {
  "call.logged": { callId: string; tipo: TipoCall; resultado?: string | null };
  "pain.captured": { painId: string; tipoSpin: TipoSpin; callId?: string | null; moduleId?: string | null };
  "offer.sent": { proposalId: string; tierSugeridoId?: string | null };
  "offer.viewed": { proposalId: string; viewCount: number; primeiraVez: boolean };
  "offer.accepted": { proposalId: string; tierId: string; contractId?: string | null };
  "project.started": { projectId: string; contractId?: string | null; naFila?: boolean };
  "task.done": { taskId: string; projectId?: string | null; dono?: "sabre" | "cliente" };
  "client_task.overdue": { taskId: string; projectId?: string | null; prazo: string };
  "clock.paused": { projectId: string; motivo: string };
  "clock.resumed": { projectId: string; diasPausados?: number };
  "sprint.closed": { phaseId: string; projectId?: string | null; etapa?: string | null };
  "charge.created": { chargeId: string; valorCentavos: number; vencimento?: string | null };
  "charge.paid": { chargeId: string; valorCentavos: number };
  "charge.overdue": { chargeId: string; valorCentavos?: number; vencimento?: string | null };
  "referral.created": { referralId: string; indicadoPor?: string | null };
  "referral.won": { referralId: string; contractId?: string | null };
  "upgrade.done": { projectId?: string | null; projectOfferId?: string | null; tierId?: string | null };
  "change_request.created": { changeRequestId: string; projectId: string; classificacao?: "retainer" | "aditivo" | null };
}

export type EventType = keyof EventPayloads;

/** Tabela/entidade padrão de cada evento (coluna events.entidade). */
export const ENTIDADE_DO_EVENTO: Record<EventType, string> = {
  "call.logged": "calls",
  "pain.captured": "pains",
  "offer.sent": "proposals",
  "offer.viewed": "proposals",
  "offer.accepted": "proposals",
  "project.started": "projects",
  "task.done": "tasks",
  "client_task.overdue": "tasks",
  "clock.paused": "projects",
  "clock.resumed": "projects",
  "sprint.closed": "phases",
  "charge.created": "charges",
  "charge.paid": "charges",
  "charge.overdue": "charges",
  "referral.created": "referrals",
  "referral.won": "referrals",
  "upgrade.done": "project_offers",
  "change_request.created": "change_requests",
};

export const EVENT_TYPES = Object.keys(ENTIDADE_DO_EVENTO) as EventType[];

/** Eventos que aparecem no portal do cliente por padrão (events.visivel_cliente). */
export const VISIVEL_AO_CLIENTE_POR_PADRAO: ReadonlySet<EventType> = new Set<EventType>([
  "project.started",
  "task.done",
  "client_task.overdue",
  "clock.paused",
  "clock.resumed",
  "sprint.closed",
  "upgrade.done",
]);

export interface LogEventInput<T extends EventType = EventType> {
  tipo: T;
  ator: Ator;
  payload: EventPayloads[T];
  /** Conta (organizations.id) dona do evento; essencial para o portal e o placar. */
  organizationId?: string | null;
  /** id da entidade (ex.: proposals.id). Padrão: nenhum. */
  entidadeId?: string | null;
  /** Sobrescreve a entidade padrão do tipo. */
  entidade?: string;
  /** Sobrescreve a visibilidade padrão do tipo. */
  visivelCliente?: boolean;
  ocorridoEm?: Date;
}
