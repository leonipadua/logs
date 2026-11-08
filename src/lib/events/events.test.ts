import { describe, it, expect, vi } from "vitest";
import { buildEventRow, emitEvent, type EventRow, type EventsInsertClient } from "./emit";
import { ENTIDADE_DO_EVENTO, EVENT_TYPES } from "./types";

const PRD_EVENTOS = [
  "call.logged", "pain.captured", "offer.sent", "offer.viewed", "offer.accepted",
  "project.started", "task.done", "client_task.overdue", "clock.paused", "clock.resumed", "sprint.closed",
  "charge.created", "charge.paid", "charge.overdue",
  "referral.created", "referral.won", "upgrade.done", "change_request.created",
];

function fakeClient(error: { message: string } | null = null) {
  const rows: EventRow[] = [];
  const client: EventsInsertClient = {
    from: () => ({
      insert: async (row) => {
        rows.push(row);
        return { error };
      },
    }),
  };
  return { client, rows };
}

describe("catálogo de eventos", () => {
  it("cobre exatamente os eventos mínimos do PRD §6", () => {
    expect([...EVENT_TYPES].sort()).toEqual([...PRD_EVENTOS].sort());
  });

  it("todo tipo segue o formato aceito pela constraint do banco", () => {
    for (const tipo of EVENT_TYPES) expect(tipo).toMatch(/^[a-z_]+\.[a-z_]+$/);
  });
});

describe("buildEventRow", () => {
  it("preenche entidade padrão, ator e payload", () => {
    const row = buildEventRow({
      tipo: "offer.viewed",
      ator: { tipo: "lead" },
      organizationId: "org-1",
      entidadeId: "prop-1",
      payload: { proposalId: "prop-1", viewCount: 2, primeiraVez: false },
    });
    expect(row).toMatchObject({
      tipo: "offer.viewed",
      ator_tipo: "lead",
      ator_id: null,
      organization_id: "org-1",
      entidade: ENTIDADE_DO_EVENTO["offer.viewed"],
      entidade_id: "prop-1",
      visivel_cliente: false,
    });
    expect(row.payload).toEqual({ proposalId: "prop-1", viewCount: 2, primeiraVez: false });
  });

  it("marca como visível ao cliente só os tipos do portal, com override", () => {
    const base = { ator: { tipo: "sistema" as const }, payload: { taskId: "t" } };
    expect(buildEventRow({ ...base, tipo: "task.done" }).visivel_cliente).toBe(true);
    expect(buildEventRow({ ...base, tipo: "task.done", visivelCliente: false }).visivel_cliente).toBe(false);
    expect(
      buildEventRow({ tipo: "charge.paid", ator: { tipo: "sistema" }, payload: { chargeId: "c", valorCentavos: 1 } })
        .visivel_cliente,
    ).toBe(false);
  });

  it("respeita ator com id, entidade e data explícitas", () => {
    const row = buildEventRow({
      tipo: "call.logged",
      ator: { tipo: "admin", id: "user-1" },
      entidade: "calls",
      ocorridoEm: new Date("2026-11-08T12:00:00Z"),
      payload: { callId: "c1", tipo: "diagnostico" },
    });
    expect(row.ator_id).toBe("user-1");
    expect(row.ocorrido_em).toBe("2026-11-08T12:00:00.000Z");
  });

  it("rejeita tipo desconhecido e payload que não é objeto", () => {
    expect(() =>
      buildEventRow({ tipo: "nao.existe" as never, ator: { tipo: "admin" }, payload: {} as never }),
    ).toThrow(/desconhecido/);
    expect(() =>
      buildEventRow({ tipo: "task.done", ator: { tipo: "admin" }, payload: null as never }),
    ).toThrow(/objeto/);
  });
});

describe("emitEvent", () => {
  it("insere a linha e retorna ok", async () => {
    const { client, rows } = fakeClient();
    const r = await emitEvent(client, {
      tipo: "pain.captured",
      ator: { tipo: "admin", id: "u" },
      payload: { painId: "p", tipoSpin: "implicacao" },
    });
    expect(r).toEqual({ ok: true });
    expect(rows).toHaveLength(1);
    expect(rows[0].tipo).toBe("pain.captured");
  });

  it("nunca lança: erro do banco vira { ok: false }", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient({ message: "boom" });
    const r = await emitEvent(client, {
      tipo: "task.done",
      ator: { tipo: "admin" },
      payload: { taskId: "t" },
    });
    expect(r).toEqual({ ok: false, error: "boom" });
    spy.mockRestore();
  });

  it("nunca lança: exceção do cliente vira { ok: false }", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client: EventsInsertClient = {
      from: () => {
        throw new Error("sem rede");
      },
    };
    const r = await emitEvent(client, { tipo: "task.done", ator: { tipo: "admin" }, payload: { taskId: "t" } });
    expect(r).toEqual({ ok: false, error: "sem rede" });
    spy.mockRestore();
  });
});
