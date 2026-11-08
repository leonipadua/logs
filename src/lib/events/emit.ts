import type { TablesInsert } from "@/lib/supabase/types";
import {
  ENTIDADE_DO_EVENTO,
  EVENT_TYPES,
  VISIVEL_AO_CLIENTE_POR_PADRAO,
  type EventType,
  type LogEventInput,
} from "./types";

const ATORES = ["admin", "cliente", "lead", "sistema"] as const;

export type EventRow = TablesInsert<"events">;

/** Monta a linha de `events`. Pura e sem I/O — a parte testável do logEvent. */
export function buildEventRow<T extends EventType>(input: LogEventInput<T>): EventRow {
  if (!EVENT_TYPES.includes(input.tipo)) {
    throw new Error(`Tipo de evento desconhecido: ${String(input.tipo)}`);
  }
  if (!ATORES.includes(input.ator.tipo)) {
    throw new Error(`Tipo de ator inválido: ${String(input.ator.tipo)}`);
  }
  if (input.payload === null || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    throw new Error("payload de evento deve ser um objeto.");
  }

  return {
    tipo: input.tipo,
    ator_tipo: input.ator.tipo,
    ator_id: input.ator.id ?? null,
    organization_id: input.organizationId ?? null,
    entidade: input.entidade ?? ENTIDADE_DO_EVENTO[input.tipo],
    entidade_id: input.entidadeId ?? null,
    payload: input.payload as unknown as EventRow["payload"],
    visivel_cliente: input.visivelCliente ?? VISIVEL_AO_CLIENTE_POR_PADRAO.has(input.tipo),
    ...(input.ocorridoEm ? { ocorrido_em: input.ocorridoEm.toISOString() } : {}),
  };
}

/** Subconjunto do client Supabase de que o emissor precisa (facilita teste). */
export interface EventsInsertClient {
  from(table: "events"): {
    insert(row: EventRow): PromiseLike<{ error: { message: string } | null }>;
  };
}

export type LogEventResult = { ok: true } | { ok: false; error: string };

/**
 * Grava o evento. Nunca lança: registrar evento não pode derrubar a ação do
 * usuário (mesma filosofia do registrarAuditoria, mas sem propagar falha).
 */
export async function emitEvent<T extends EventType>(
  client: EventsInsertClient,
  input: LogEventInput<T>,
): Promise<LogEventResult> {
  try {
    const row = buildEventRow(input);
    const { error } = await client.from("events").insert(row);
    if (error) {
      console.error("[events] falha ao gravar evento", input.tipo, error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[events] erro ao montar/gravar evento", input.tipo, message);
    return { ok: false, error: message };
  }
}
