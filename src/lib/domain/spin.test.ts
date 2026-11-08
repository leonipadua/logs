import { describe, it, expect } from "vitest";
import { avaliarBant, categoriasDisponiveis, implicacaoValida, lerBant, mapearDorParaModulo, normalizarTag, slugDeNome } from "./spin";

const modulos = [
  { id: "m1", ativo: true, dores_gatilho: ["atendimento", "lead_perdido"] },
  { id: "m2", ativo: true, dores_gatilho: ["agenda", "no_show"] },
  { id: "m3", ativo: false, dores_gatilho: ["controle"] },
];

describe("mapeamento dor -> módulo por regra", () => {
  it("mapeia pela categoria, ignorando acento/caixa/espaço", () => {
    expect(mapearDorParaModulo("Lead perdido", modulos)).toBe("m1");
    expect(mapearDorParaModulo("NO-SHOW", modulos)).toBe("m2");
  });
  it("não mapeia categoria vazia, desconhecida ou de módulo inativo", () => {
    expect(mapearDorParaModulo(null, modulos)).toBeNull();
    expect(mapearDorParaModulo("", modulos)).toBeNull();
    expect(mapearDorParaModulo("xyz", modulos)).toBeNull();
    expect(mapearDorParaModulo("controle", modulos)).toBeNull();
  });
  it("lista categorias só de módulos ativos", () => {
    expect(categoriasDisponiveis(modulos)).toEqual(["agenda", "atendimento", "lead_perdido", "no_show"]);
    expect(normalizarTag("  Resposta Lenta ")).toBe("resposta_lenta");
  });
});

describe("implicação exige número e unidade", () => {
  it("rejeita implicação sem número ou unidade", () => {
    expect(implicacaoValida({ tipo_spin: "implicacao", valor_numerico: null, unidade: "leads_mes" })).toBe(false);
    expect(implicacaoValida({ tipo_spin: "implicacao", valor_numerico: 10, unidade: null })).toBe(false);
    expect(implicacaoValida({ tipo_spin: "implicacao", valor_numerico: 10, unidade: "banana" })).toBe(false);
  });
  it("aceita implicação completa e outros tipos sem número", () => {
    expect(implicacaoValida({ tipo_spin: "implicacao", valor_numerico: 10, unidade: "leads_mes" })).toBe(true);
    expect(implicacaoValida({ tipo_spin: "problema", valor_numerico: null, unidade: null })).toBe(true);
  });
});

describe("BANT", () => {
  const r = (budget: string, authority: string, need: string, timing: string) =>
    lerBant({ budget: { resposta: budget }, authority: { resposta: authority }, need: { resposta: need }, timing: { resposta: timing } });
  it("incompleto enquanto faltar critério", () => {
    const a = avaliarBant(lerBant({ need: { resposta: "sim" } }));
    expect(a.veredito).toBe("incompleto");
    expect(a.faltam).toEqual(["budget", "authority", "timing"]);
  });
  it("need ou budget = não sai do funil", () => {
    expect(avaliarBant(r("sim", "sim", "nao", "sim")).veredito).toBe("sair");
    expect(avaliarBant(r("nao", "sim", "sim", "sim")).veredito).toBe("sair");
  });
  it("authority ou timing = não nutre", () => {
    expect(avaliarBant(r("sim", "nao", "sim", "sim")).veredito).toBe("nutrir");
    expect(avaliarBant(r("sim", "sim", "sim", "nao")).veredito).toBe("nutrir");
  });
  it("3+ sins vai para proposta; menos nutre", () => {
    expect(avaliarBant(r("sim", "sim", "sim", "parcial")).veredito).toBe("proposta");
    expect(avaliarBant(r("parcial", "sim", "sim", "parcial")).veredito).toBe("nutrir");
  });
  it("lerBant ignora lixo", () => {
    expect(lerBant("x")).toEqual({});
    expect(lerBant({ budget: { resposta: "talvez" } }).budget?.resposta).toBeUndefined();
  });
});

describe("slug", () => {
  it("normaliza e sufixa", () => {
    expect(slugDeNome("Clínica São João!", "ab12")).toBe("clinica-sao-joao-ab12");
    expect(slugDeNome("!!!", "x")).toBe("lead-x");
  });
});
