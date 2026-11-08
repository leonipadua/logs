import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessaoAtual } from "@/lib/auth/session";
import { emitEvent, type LogEventResult } from "./emit";
import type { Ator, EventType, LogEventInput } from "./types";

export type { Ator, AtorTipo, EventPayloads, EventType, LogEventInput } from "./types";
export { EVENT_TYPES, ENTIDADE_DO_EVENTO } from "./types";
export type { LogEventResult } from "./emit";

/**
 * Registra um evento do PRD §6 em `events` (service_role, server-side).
 *
 *   await logEvent({
 *     tipo: "offer.viewed",
 *     ator: { tipo: "lead" },
 *     organizationId: proposta.organization_id,
 *     entidadeId: proposta.id,
 *     payload: { proposalId: proposta.id, viewCount: 3, primeiraVez: false },
 *   });
 *
 * Nunca lança; retorna { ok } para quem quiser reagir à falha.
 */
export async function logEvent<T extends EventType>(input: LogEventInput<T>): Promise<LogEventResult> {
  return emitEvent(createAdminClient(), input);
}

/** Ator a partir da sessão atual (admin da Sabre ou membro cliente). */
export function atorDaSessao(sessao: Pick<SessaoAtual, "userId" | "isAdmin">): Ator {
  return { tipo: sessao.isAdmin ? "admin" : "cliente", id: sessao.userId };
}
