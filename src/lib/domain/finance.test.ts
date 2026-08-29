import { describe, it, expect } from "vitest";
import {
  janelaDoMes,
  limiteInadimplenciaISODate,
  diasEmAtraso,
  calcularMrr,
  calcularReceitaRealizada,
  calcularReceitaPrevista,
  calcularLtv,
} from "./finance";

const c = (valor_centavos: number, status = "paga") => ({ valor_centavos, status });

describe("janelaDoMes", () => {
  it("cobre do dia 1 00:00 ao último dia 23:59:59 do mês de base", () => {
    const { inicio, fim } = janelaDoMes(new Date(2026, 1, 15)); // fevereiro de 2026
    expect(inicio.getFullYear()).toBe(2026);
    expect(inicio.getMonth()).toBe(1);
    expect(inicio.getDate()).toBe(1);
    expect(inicio.getHours()).toBe(0);
    expect(fim.getMonth()).toBe(1);
    expect(fim.getDate()).toBe(28); // 2026 não é bissexto
    expect(fim.getHours()).toBe(23);
  });
});

describe("limiteInadimplenciaISODate", () => {
  it("devolve a data de 3 dias atrás em YYYY-MM-DD", () => {
    const agora = new Date("2026-08-10T12:00:00Z");
    expect(limiteInadimplenciaISODate(agora)).toBe("2026-08-07");
  });
});

describe("diasEmAtraso", () => {
  const agora = new Date("2026-08-10T00:00:00Z");
  it("conta dias corridos desde o vencimento", () => {
    expect(diasEmAtraso("2026-08-05T00:00:00Z", agora)).toBe(5);
  });
  it("é negativo quando ainda não venceu", () => {
    expect(diasEmAtraso("2026-08-12T00:00:00Z", agora)).toBe(-2);
  });
});

describe("calcularMrr", () => {
  it("soma os valores das assinaturas recebidas", () => {
    expect(calcularMrr([{ valor_centavos: 50000 }, { valor_centavos: 12000 }])).toBe(62000);
  });
  it("sem assinaturas o MRR é 0", () => {
    expect(calcularMrr([])).toBe(0);
  });
});

describe("receita realizada e prevista", () => {
  it("realizada é a soma das cobranças pagas no mês", () => {
    expect(calcularReceitaRealizada([c(10000), c(2550)])).toBe(12550);
  });
  it("prevista é realizada + pendentes do mês, mantidas separadas", () => {
    const realizada = calcularReceitaRealizada([c(10000)]);
    expect(calcularReceitaPrevista(realizada, [c(3000, "pendente"), c(2000, "agendada")])).toBe(15000);
  });
  it("sem pendentes, prevista == realizada", () => {
    expect(calcularReceitaPrevista(10000, [])).toBe(10000);
  });
});

describe("calcularLtv", () => {
  it("soma apenas cobranças com status 'paga'", () => {
    expect(
      calcularLtv([c(10000, "paga"), c(5000, "pendente"), c(2000, "paga"), c(9999, "falhou")]),
    ).toBe(12000);
  });
});
