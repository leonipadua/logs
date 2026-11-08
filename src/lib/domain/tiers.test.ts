import { describe, it, expect } from "vitest";
import { doresNaoCobertas, montarVitrine, precoComCondicao, tierAlvo, type ModuloCatalogo, type TierCatalogo } from "./tiers";

const mod = (id: string, impl: number, mens: number, ativo = true): ModuloCatalogo => ({
  id, nome: `Módulo ${id}`, descricao: null, ativo, preco_implementacao_centavos: impl, mensalidade_centavos: mens, horas_estimadas: 10,
});
const modulos = [mod("a", 100_000, 10_000), mod("b", 200_000, 20_000), mod("c", 300_000, 30_000), mod("d", 50_000, 0, false)];
const tiers: TierCatalogo[] = [
  { id: "t3", ordem: 3, nome: "Escala", descricao: null, ativo: true, moduleIds: ["a", "b", "c", "d"] },
  { id: "t1", ordem: 1, nome: "Essencial", descricao: null, ativo: true, moduleIds: ["a"] },
  { id: "t2", ordem: 2, nome: "Completo", descricao: null, ativo: true, moduleIds: ["a", "b"] },
];

describe("vitrine de tiers", () => {
  const v = montarVitrine(tiers, modulos, ["b"]);

  it("ordena por ancoragem e marca o do meio como alvo", () => {
    expect(v.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
    expect(v.map((t) => t.alvo)).toEqual([false, true, false]);
    expect(tierAlvo(tiers)?.id).toBe("t2");
  });

  it("preço = soma dos módulos ativos do catálogo", () => {
    expect(v[1].preco).toEqual({ implementacaoCentavos: 300_000, mensalidadeCentavos: 30_000, horas: 20 });
    expect(v[2].preco.implementacaoCentavos).toBe(600_000); // módulo inativo "d" fora
  });

  it("tier cheio mostra o que fica bloqueado nos outros", () => {
    expect(v[0].bloqueados.map((m) => m.id)).toEqual(["b", "c"]);
    expect(v[1].bloqueados.map((m) => m.id)).toEqual(["c"]);
    expect(v[2].bloqueados).toEqual([]);
    expect(v[0].bloqueados.find((m) => m.id === "b")?.cobreDor).toBe(true);
  });

  it("dores não cobertas por tier", () => {
    expect(doresNaoCobertas(v[0], ["a", "b"])).toEqual(["b"]);
    expect(doresNaoCobertas(v[1], ["a", "b"])).toEqual([]);
  });

  it("condição de pagamento só ajusta a implementação", () => {
    const p = precoComCondicao(v[1], -500);
    expect(p.implementacaoCentavos).toBe(285_000);
    expect(p.mensalidadeCentavos).toBe(30_000);
  });

  it("ignora tiers inativos", () => {
    expect(montarVitrine(tiers.map((t) => (t.id === "t1" ? { ...t, ativo: false } : t)), modulos).map((t) => t.id)).toEqual(["t2", "t3"]);
    expect(tierAlvo([{ ordem: 2, ativo: false }])).toBeNull();
  });
});
