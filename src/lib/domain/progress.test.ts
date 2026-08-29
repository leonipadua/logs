import { describe, it, expect } from "vitest";
import { computeProgress } from "./progress";

type Tasks = Parameters<typeof computeProgress>[0];
const tasks = (...status: string[]) => status.map((s) => ({ status: s })) as Tasks;

describe("computeProgress", () => {
  it("projeto sem tasks tem fração 0 e não divide por zero", () => {
    expect(computeProgress([])).toEqual({ concluidas: 0, total: 0, fracao: 0 });
  });

  it("conta apenas tasks com status 'concluida'", () => {
    expect(
      computeProgress(tasks("concluida", "concluida", "em_andamento", "pendente", "bloqueada")),
    ).toEqual({ concluidas: 2, total: 5, fracao: 0.4 });
  });

  it("projeto 100% concluído tem fração 1", () => {
    expect(computeProgress(tasks("concluida", "concluida"))).toMatchObject({ fracao: 1 });
  });

  it("nenhuma task concluída mantém fração 0 com total > 0", () => {
    expect(computeProgress(tasks("pendente", "bloqueada"))).toEqual({
      concluidas: 0,
      total: 2,
      fracao: 0,
    });
  });
});
