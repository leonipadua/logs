import { describe, it, expect } from "vitest";
import { decidirRelogio, novasVencidas, pendenciasVencidas, type TaskParaRelogio } from "./relogio";

const base: TaskParaRelogio = {
  id: "t1",
  dono: "cliente",
  status: "pendente",
  prazo: "2026-11-05",
  bloqueada_por_tier_id: null,
  vencida_registrada_em: null,
};
const HOJE = "2026-11-08";

describe("pendenciasVencidas", () => {
  it("só conta pendência do cliente aberta com prazo anterior a hoje", () => {
    const tasks = [
      base,
      { ...base, id: "hoje", prazo: HOJE },
      { ...base, id: "futuro", prazo: "2026-11-20" },
      { ...base, id: "sem-prazo", prazo: null },
      { ...base, id: "feita", status: "concluida" },
      { ...base, id: "sabre", dono: "sabre" },
      { ...base, id: "tier", bloqueada_por_tier_id: "tier-3" },
    ];
    expect(pendenciasVencidas(tasks, HOJE).map((t) => t.id)).toEqual(["t1"]);
  });

  it("dedupe do evento: só as ainda não registradas", () => {
    const v = pendenciasVencidas([base, { ...base, id: "t2", vencida_registrada_em: "2026-11-06T00:00:00Z" }], HOJE);
    expect(novasVencidas(v).map((t) => t.id)).toEqual(["t1"]);
  });
});

describe("decidirRelogio", () => {
  const agora = new Date("2026-11-08T12:00:00Z");

  it("pausa quando rodando e há pendência vencida", () => {
    const d = decidirRelogio({ relogio: "rodando", relogioOrigem: null, pausadoEm: null }, [base], agora);
    expect(d.acao).toBe("pausar");
    expect(d.acao === "pausar" && d.motivo).toMatch(/Pendência do cliente vencida/);
  });

  it("retoma pausa automática quando não há mais vencidas, contando os dias", () => {
    const d = decidirRelogio(
      { relogio: "pausado", relogioOrigem: "automatico", pausadoEm: "2026-11-03T12:00:00Z" },
      [],
      agora,
    );
    expect(d).toEqual({ acao: "retomar", diasPausados: 5 });
  });

  it("nunca retoma sozinho uma pausa manual", () => {
    const d = decidirRelogio({ relogio: "pausado", relogioOrigem: "manual", pausadoEm: "2026-11-03T12:00:00Z" }, [], agora);
    expect(d).toEqual({ acao: "nada" });
  });

  it("não repete a pausa nem retoma enquanto a pendência segue vencida", () => {
    expect(decidirRelogio({ relogio: "pausado", relogioOrigem: "automatico", pausadoEm: null }, [base], agora)).toEqual({
      acao: "nada",
    });
    expect(decidirRelogio({ relogio: "rodando", relogioOrigem: null, pausadoEm: null }, [], agora)).toEqual({ acao: "nada" });
  });
});
