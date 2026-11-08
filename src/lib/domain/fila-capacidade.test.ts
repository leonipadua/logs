import { describe, it, expect } from "vitest";
import { decidirEntrada, fimDeS3, quantosPromover } from "./fila-capacidade";

const HOJE = "2026-11-08";

describe("fimDeS3", () => {
  it("S0–S3 = 28 dias mais os dias pausados", () => {
    expect(fimDeS3("2026-11-01")).toBe("2026-11-29");
    expect(fimDeS3("2026-11-01", 3)).toBe("2026-12-02");
  });
});

describe("decidirEntrada (limite duro)", () => {
  it("com vaga, começa hoje e não entra na fila", () => {
    expect(decidirEntrada(2, ["2026-11-20"], 0, HOJE)).toEqual({ naFila: false, dataInicioPrevista: HOJE });
    expect(decidirEntrada(2, [], 0, HOJE)).toEqual({ naFila: false, dataInicioPrevista: HOJE });
  });

  it("cheio: entra na fila com a data em que a primeira vaga abre", () => {
    expect(decidirEntrada(2, ["2026-11-25", "2026-11-18"], 0, HOJE)).toEqual({
      naFila: true,
      dataInicioPrevista: "2026-11-18",
    });
  });

  it("fila FIFO: o segundo da fila pega a vaga seguinte", () => {
    expect(decidirEntrada(2, ["2026-11-25", "2026-11-18"], 1, HOJE).dataInicioPrevista).toBe("2026-11-25");
    // terceiro: a vaga aberta em 18/11 reabre 28 dias depois (16/12)
    expect(decidirEntrada(2, ["2026-11-25", "2026-11-18"], 2, HOJE).dataInicioPrevista).toBe("2026-12-16");
  });

  it("ocupante já atrasado não dá data no passado", () => {
    expect(decidirEntrada(1, ["2026-10-01"], 0, HOJE)).toEqual({ naFila: false, dataInicioPrevista: HOJE });
  });

  it("ocupação acima do máximo espera os excedentes saírem", () => {
    // 3 ocupando, máximo 2: a primeira vaga só abre quando 2 terminarem
    expect(decidirEntrada(2, ["2026-11-12", "2026-11-18", "2026-11-25"], 0, HOJE)).toEqual({
      naFila: true,
      dataInicioPrevista: "2026-11-18",
    });
  });
});

describe("quantosPromover", () => {
  it("promove até a capacidade livre, sem passar do tamanho da fila", () => {
    expect(quantosPromover(2, 1, 3)).toBe(1);
    expect(quantosPromover(2, 2, 3)).toBe(0);
    expect(quantosPromover(2, 3, 3)).toBe(0);
    expect(quantosPromover(3, 0, 1)).toBe(1);
  });
});
