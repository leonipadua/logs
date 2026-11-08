import { describe, it, expect } from "vitest";
import { calcularSistemaConstruido, type TaskParaSistema } from "./sistema-construido";

const t = (over: Partial<TaskParaSistema>): TaskParaSistema => ({
  status: "pendente",
  dono: "sabre",
  bloqueada_por_tier_id: null,
  etapa: "S2",
  ...over,
});

describe("calcularSistemaConstruido", () => {
  it("conta só entregas da Sabre no escopo, fora de S0 e S4+", () => {
    const r = calcularSistemaConstruido([
      t({ status: "concluida" }),
      t({}),
      t({ status: "concluida", etapa: "S0" }),
      t({ status: "concluida", etapa: "S4" }),
      t({ dono: "cliente", status: "concluida" }),
      t({ status: "bloqueada", bloqueada_por_tier_id: "tier-3" }),
    ]);
    expect(r).toEqual({ concluidas: 1, total: 2, fracao: 0.5 });
  });

  it("projeto legado (etapa nula) entra na conta; vazio = 0%", () => {
    expect(calcularSistemaConstruido([t({ etapa: null, status: "concluida" })]).fracao).toBe(1);
    expect(calcularSistemaConstruido([])).toEqual({ concluidas: 0, total: 0, fracao: 0 });
  });
});
