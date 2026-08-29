import { describe, it, expect } from "vitest";
import { formatCentavosBRL, centavosParaReais, reaisParaCentavos } from "./currency";

// O Intl separa "R$" do número com um espaço não-quebrável cujo code point
// varia entre versões de ICU; normalizamos qualquer whitespace para comparar.
const norm = (s: string) => s.replace(/\s/g, " ");

describe("formatCentavosBRL", () => {
  it("formata centavos como BRL pt-BR", () => {
    expect(norm(formatCentavosBRL(120000))).toBe("R$ 1.200,00");
    expect(norm(formatCentavosBRL(2550))).toBe("R$ 25,50");
    expect(norm(formatCentavosBRL(0))).toBe("R$ 0,00");
  });
});

describe("centavosParaReais", () => {
  it("divide por 100 sem perder o decimal", () => {
    expect(centavosParaReais(120050)).toBe(1200.5);
    expect(centavosParaReais(0)).toBe(0);
  });
});

describe("reaisParaCentavos", () => {
  it("aceita number", () => {
    expect(reaisParaCentavos(1200.5)).toBe(120050);
    expect(reaisParaCentavos(10)).toBe(1000);
  });

  it("aceita string pt-BR com milhar e decimal", () => {
    expect(reaisParaCentavos("1.200,50")).toBe(120050);
    expect(reaisParaCentavos("1.234.567,89")).toBe(123456789);
  });

  it("aceita prefixo R$ e espaços", () => {
    expect(reaisParaCentavos("R$ 1.200,50")).toBe(120050);
    expect(reaisParaCentavos("  R$1.200,50  ")).toBe(120050);
  });

  it("aceita string sem parte decimal e com um só dígito decimal", () => {
    expect(reaisParaCentavos("10")).toBe(1000);
    expect(reaisParaCentavos("10,5")).toBe(1050);
  });

  it("arredonda para o centavo mais próximo", () => {
    expect(reaisParaCentavos("10,999")).toBe(1100);
    expect(reaisParaCentavos(10.994)).toBe(1099);
  });

  it("devolve null para entradas inválidas em vez de lançar", () => {
    expect(reaisParaCentavos("")).toBeNull();
    expect(reaisParaCentavos("abc")).toBeNull();
    expect(reaisParaCentavos("R$")).toBeNull();
    expect(reaisParaCentavos("1,2,3")).toBeNull();
    expect(reaisParaCentavos(Number.NaN)).toBeNull();
    expect(reaisParaCentavos(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("faz round-trip com centavosParaReais para qualquer valor inteiro", () => {
    for (const centavos of [0, 1, 99, 100, 2550, 120000, 123456789]) {
      expect(reaisParaCentavos(centavosParaReais(centavos))).toBe(centavos);
    }
  });
});
