import { describe, it, expect } from "vitest";
import { calcularCustoDaDor } from "./pain-cost";

describe("custo da dor em R$/mês", () => {
  it("R$/mês informado entra direto", () => {
    const r = calcularCustoDaDor([{ id: "a", descricao: "x", valor: 3000, unidade: "brl_mes" }]);
    expect(r.custoMensalCentavos).toBe(300000);
  });

  it("leads perdidos = leads × conversão × ticket (premissas explícitas)", () => {
    const r = calcularCustoDaDor(
      [{ id: "a", descricao: "x", valor: 40, unidade: "leads_mes" }],
      { ticketMedioCentavos: 150000, taxaConversao: 0.2 },
    );
    expect(r.custoMensalCentavos).toBe(40 * 0.2 * 150000);
    expect(r.linhas[0].formula).toMatch(/40 leads\/mês × 20% de conversão/);
  });

  it("ticket pode vir de uma Implicação em ticket_medio_brl e não soma como custo", () => {
    const r = calcularCustoDaDor(
      [
        { id: "a", descricao: "leads", valor: 10, unidade: "leads_mes" },
        { id: "b", descricao: "ticket", valor: 2000, unidade: "ticket_medio_brl" },
      ],
      { taxaConversao: 0.5 },
    );
    expect(r.premissas.ticketMedioCentavos).toBe(200000);
    expect(r.custoMensalCentavos).toBe(10 * 0.5 * 200000);
  });

  it("sem premissa não inventa número: linha nula e pendência", () => {
    const r = calcularCustoDaDor([
      { id: "a", descricao: "leads", valor: 10, unidade: "leads_mes" },
      { id: "b", descricao: "horas", valor: 20, unidade: "horas_mes" },
    ]);
    expect(r.custoMensalCentavos).toBe(0);
    expect(r.linhas.map((l) => l.centavos)).toEqual([null, null]);
    expect(r.pendencias).toHaveLength(2);
  });

  it("horas × custo da hora", () => {
    const r = calcularCustoDaDor([{ id: "a", descricao: "h", valor: 20, unidade: "horas_mes" }], { custoHoraCentavos: 6000 });
    expect(r.custoMensalCentavos).toBe(120000);
  });

  it("unidade inválida não gera custo", () => {
    const r = calcularCustoDaDor([{ id: "a", descricao: "h", valor: 5, unidade: "pizza" }]);
    expect(r.custoMensalCentavos).toBe(0);
    expect(r.linhas[0].centavos).toBeNull();
  });
});
