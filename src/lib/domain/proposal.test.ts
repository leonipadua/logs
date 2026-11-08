import { describe, it, expect } from "vitest";
import { escopoRetainer, lerPremissas, montarRascunho, planoDeParcelas, propostaExpirada, sinalFollowUp, somarDias } from "./proposal";

const dores = [
  { id: "p1", tipo_spin: "situacao", descricao: "s", valor_numerico: null, unidade: null, module_id: "m1" },
  { id: "p2", tipo_spin: "implicacao", descricao: "perde leads", valor_numerico: 40, unidade: "leads_mes", module_id: "m1" },
  { id: "p3", tipo_spin: "problema", descricao: "agenda", valor_numerico: null, unidade: null, module_id: "m2" },
  { id: "p4", tipo_spin: "problema", descricao: "sem módulo", valor_numerico: null, unidade: null, module_id: null },
];

describe("montarRascunho", () => {
  const r = montarRascunho(dores, { ticketMedioCentavos: 100_000 });
  it("um item por módulo, ancorado na dor de maior prioridade SPIN", () => {
    expect(r.itens).toEqual([
      { moduleId: "m1", painId: "p2" },
      { moduleId: "m2", painId: "p3" },
    ]);
  });
  it("guarda custo e premissas explícitas (conversão padrão visível)", () => {
    expect(r.premissas.taxaConversao).toBe(0.2);
    expect(r.premissas.custoMensalCentavos).toBe(40 * 0.2 * 100_000);
    expect(r.premissas.recuperacao).toBe(0.5);
    expect(r.premissas.horizonteMeses).toBe(12);
  });
  it("round-trip pelo jsonb", () => {
    const lida = lerPremissas(JSON.parse(JSON.stringify(r.premissas)));
    expect(lida?.custoMensalCentavos).toBe(r.premissas.custoMensalCentavos);
    expect(lerPremissas({})).toBeNull();
  });
});

describe("follow-up por visualização", () => {
  const agora = new Date("2026-11-10T12:00:00Z");
  const base = { status: "enviada", view_count: 0, last_viewed_at: null, enviada_em: "2026-11-09T12:00:00Z" };
  it("aberta há pouco = quente", () => {
    expect(sinalFollowUp({ ...base, view_count: 2, last_viewed_at: "2026-11-10T08:00:00Z" }, agora)).toBe("quente");
  });
  it("aberta há mais de 48 h = esfriando", () => {
    expect(sinalFollowUp({ ...base, view_count: 1, last_viewed_at: "2026-11-05T08:00:00Z" }, agora)).toBe("esfriando");
  });
  it("enviada há mais de 48 h sem abrir", () => {
    expect(sinalFollowUp({ ...base, enviada_em: "2026-11-01T00:00:00Z" }, agora)).toBe("sem_abertura");
    expect(sinalFollowUp(base, agora)).toBeNull();
  });
  it("só propostas enviadas geram sinal", () => {
    expect(sinalFollowUp({ ...base, status: "aceita", view_count: 3, last_viewed_at: "2026-11-10T08:00:00Z" }, agora)).toBeNull();
    expect(sinalFollowUp({ ...base, status: "rascunho" }, agora)).toBeNull();
  });
});

describe("aceite", () => {
  it("validade", () => {
    const hoje = new Date("2026-11-10T12:00:00Z");
    expect(propostaExpirada("2026-11-09", "enviada", hoje)).toBe(true);
    expect(propostaExpirada("2026-11-10", "enviada", hoje)).toBe(false);
    expect(propostaExpirada("2026-11-01", "aceita", hoje)).toBe(false);
    expect(propostaExpirada(null, "enviada", hoje)).toBe(false);
    expect(somarDias(hoje, 15)).toBe("2026-11-25");
  });
  it("plano de parcelas parte do preço do catálogo", () => {
    const hoje = new Date("2026-11-10T12:00:00Z");
    expect(planoDeParcelas(500_000, hoje)).toEqual([{ numero: 1, tipo: "entrada", valor_centavos: 500_000, vencimento: "2026-11-13" }]);
    expect(planoDeParcelas(0, hoje)).toEqual([]);
  });
  it("escopo do retainer lista só módulos com mensalidade", () => {
    expect(escopoRetainer([{ nome: "A", mensalidade_centavos: 1 }, { nome: "B", mensalidade_centavos: 0 }])).toEqual(["Manutenção e otimização: A"]);
  });
});
