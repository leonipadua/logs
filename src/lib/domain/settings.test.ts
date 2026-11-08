import { describe, it, expect } from "vitest";
import { SETTING_DEFS, calcularCapacidade, defaultSettings, mesclarSettings, validarSetting } from "./settings";

const cap = SETTING_DEFS[0];

describe("settings", () => {
  it("capacidade padrão é 2 projetos", () => {
    expect(defaultSettings().capacidade_max_projetos).toBe(2);
  });

  it("valida faixa, inteiro e número", () => {
    expect(validarSetting(cap, "3")).toEqual({ ok: true, valor: 3 });
    expect(validarSetting(cap, "0").ok).toBe(false);
    expect(validarSetting(cap, "2,5").ok).toBe(false);
    expect(validarSetting(cap, "abc").ok).toBe(false);
    expect(validarSetting(cap, "").ok).toBe(false);
    expect(validarSetting(SETTING_DEFS[1], "12,5")).toEqual({ ok: true, valor: 12.5 });
  });

  it("mescla linhas do banco sobre os padrões e ignora lixo", () => {
    const v = mesclarSettings([
      { chave: "capacidade_max_projetos", valor: 4 },
      { chave: "vigencia_minima_meses", valor: "nope" },
      { chave: "desconhecida", valor: 1 },
    ]);
    expect(v.capacidade_max_projetos).toBe(4);
    expect(v.vigencia_minima_meses).toBe(6);
  });

  it("capacidade cheia manda o próximo para a fila", () => {
    expect(calcularCapacidade(2, 2)).toEqual({ max: 2, ocupados: 2, livre: 0, cheia: true });
    expect(calcularCapacidade(2, 1).cheia).toBe(false);
    expect(calcularCapacidade(2, 5).livre).toBe(0);
  });
});
