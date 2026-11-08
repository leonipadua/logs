import { describe, it, expect } from "vitest";
import { aplicarCondicaoPagamento, modulosBloqueados, somarModulos } from "./catalog";

const mod = (impl: number, mens: number, horas: number, ativo = true) => ({
  ativo,
  preco_implementacao_centavos: impl,
  mensalidade_centavos: mens,
  horas_estimadas: horas,
});

describe("catálogo", () => {
  it("soma implementação, mensalidade e horas dos módulos ativos", () => {
    expect(somarModulos([mod(100, 10, 2), mod(200, 20, 3.5), mod(999, 99, 9, false)])).toEqual({
      implementacaoCentavos: 300,
      mensalidadeCentavos: 30,
      horas: 5.5,
    });
  });

  it("tier vazio custa zero", () => {
    expect(somarModulos([])).toEqual({ implementacaoCentavos: 0, mensalidadeCentavos: 0, horas: 0 });
  });

  it("condição de pagamento ajusta só a implementação", () => {
    const base = { implementacaoCentavos: 100000, mensalidadeCentavos: 5000, horas: 10 };
    expect(aplicarCondicaoPagamento(base, -500)).toEqual({ ...base, implementacaoCentavos: 95000 });
    expect(aplicarCondicaoPagamento(base, 0)).toEqual(base);
  });

  it("lista o que fica bloqueado nos tiers menores", () => {
    expect(modulosBloqueados(["a", "b"], ["a", "b", "c", "d"])).toEqual(["c", "d"]);
  });
});
