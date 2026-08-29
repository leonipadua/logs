import { describe, it, expect } from "vitest";
import {
  TRANSICOES_OFERTA,
  ehTerminal,
  podeTransicionar,
  type EstadoOferta,
} from "./offer-state";

describe("máquina de estados da oferta", () => {
  it("publicar: rascunho -> disponivel", () => {
    expect(podeTransicionar("rascunho", "disponivel")).toBe(true);
  });

  it("cliente inicia checkout: disponivel -> em_negociacao", () => {
    expect(podeTransicionar("disponivel", "em_negociacao")).toBe(true);
  });

  it("pagamento confirmado: em_negociacao -> desbloqueada", () => {
    expect(podeTransicionar("em_negociacao", "desbloqueada")).toBe(true);
  });

  it("pagamento falhou: em_negociacao -> disponivel", () => {
    expect(podeTransicionar("em_negociacao", "disponivel")).toBe(true);
  });

  it("desbloqueio manual do admin: disponivel -> desbloqueada", () => {
    expect(podeTransicionar("disponivel", "desbloqueada")).toBe(true);
  });

  it("não permite reabrir uma oferta desbloqueada", () => {
    expect(podeTransicionar("desbloqueada", "disponivel")).toBe(false);
    expect(podeTransicionar("desbloqueada", "em_negociacao")).toBe(false);
  });

  it("não permite pular de rascunho direto para desbloqueada", () => {
    expect(podeTransicionar("rascunho", "desbloqueada")).toBe(false);
  });

  it("não permite iniciar checkout duas vezes (em_negociacao -> em_negociacao)", () => {
    expect(podeTransicionar("em_negociacao", "em_negociacao")).toBe(false);
  });

  it("desbloqueada e removida são terminais", () => {
    expect(ehTerminal("desbloqueada")).toBe(true);
    expect(ehTerminal("removida")).toBe(true);
    expect(ehTerminal("disponivel")).toBe(false);
  });

  it("todo alvo de transição é um estado conhecido", () => {
    const estados = Object.keys(TRANSICOES_OFERTA) as EstadoOferta[];
    for (const alvos of Object.values(TRANSICOES_OFERTA)) {
      for (const alvo of alvos) expect(estados).toContain(alvo);
    }
  });
});
