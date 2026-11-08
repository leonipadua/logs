import { describe, it, expect } from "vitest";
import { calcularRoi, projetarRoi } from "./roi";

const base = { custoMensalCentavos: 1_000_000, recuperacao: 0.5, horizonteMeses: 12, implementacaoCentavos: 1_200_000, mensalidadeCentavos: 200_000 };

describe("ROI como projeção", () => {
  it("calcula ganho, investimento, saldo e payback", () => {
    const r = calcularRoi(base)!;
    expect(r.ganhoMensalCentavos).toBe(500_000);
    expect(r.ganhoHorizonteCentavos).toBe(6_000_000);
    expect(r.investimentoHorizonteCentavos).toBe(1_200_000 + 2_400_000);
    expect(r.saldoHorizonteCentavos).toBe(6_000_000 - 3_600_000);
    expect(r.paybackMeses).toBe(4); // 1.2M / (500k - 200k)
  });
  it("nunca se paga quando a mensalidade consome o ganho", () => {
    expect(calcularRoi({ ...base, mensalidadeCentavos: 600_000 })!.paybackMeses).toBeNull();
  });
  it("sem custo da dor ou premissas inválidas não há ROI", () => {
    expect(calcularRoi({ ...base, custoMensalCentavos: 0 })).toBeNull();
    expect(calcularRoi({ ...base, recuperacao: 0 })).toBeNull();
    expect(calcularRoi({ ...base, recuperacao: 1.5 })).toBeNull();
    expect(calcularRoi({ ...base, horizonteMeses: 0 })).toBeNull();
  });
  it("toda projeção vem com premissas explícitas e aviso de que não é promessa", () => {
    const p = projetarRoi(base, ["40 leads/mês × 20%"])!;
    expect(p.premissas.length).toBeGreaterThanOrEqual(4);
    expect(p.premissas[0]).toBe("40 leads/mês × 20%");
    expect(p.premissas.join(" ")).toMatch(/50%/);
    expect(p.premissas.at(-1)).toMatch(/não promessa/);
  });
  it("sem ROI, sem projeção (nenhum número sem premissa)", () => {
    expect(projetarRoi({ ...base, custoMensalCentavos: 0 }, [])).toBeNull();
  });
});
