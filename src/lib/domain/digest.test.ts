import { describe, it, expect } from "vitest";
import { agruparTaskIdsPorProjeto, destinatariosDoDigest } from "./digest";

describe("agruparTaskIdsPorProjeto", () => {
  it("agrupa os ids das tasks por projeto — 5 tasks de 1 projeto viram 1 grupo", () => {
    const tasks = ["a", "b", "c", "d", "e"].map((id) => ({ id, phases: { project_id: "p1" } }));
    const grupos = agruparTaskIdsPorProjeto(tasks);
    expect(grupos.size).toBe(1);
    expect(grupos.get("p1")).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("separa tasks de projetos diferentes", () => {
    const grupos = agruparTaskIdsPorProjeto([
      { id: "a", phases: { project_id: "p1" } },
      { id: "b", phases: { project_id: "p2" } },
      { id: "c", phases: { project_id: "p1" } },
    ]);
    expect(grupos.get("p1")).toEqual(["a", "c"]);
    expect(grupos.get("p2")).toEqual(["b"]);
  });

  it("aceita a relação phases vinda como array do Supabase", () => {
    const grupos = agruparTaskIdsPorProjeto([{ id: "a", phases: [{ project_id: "p1" }] }]);
    expect(grupos.get("p1")).toEqual(["a"]);
  });

  it("ignora tasks sem fase associada", () => {
    const grupos = agruparTaskIdsPorProjeto([
      { id: "a", phases: null },
      { id: "b", phases: [] },
      { id: "c", phases: { project_id: "p1" } },
    ]);
    expect(grupos.size).toBe(1);
    expect(grupos.get("p1")).toEqual(["c"]);
  });
});

describe("destinatariosDoDigest", () => {
  const membro = (email: string, notificar_task_concluida: boolean) => ({
    profiles: { email, notificar_task_concluida },
  });

  it("inclui só quem não fez opt-out do M3", () => {
    const emails = destinatariosDoDigest([
      membro("ana@x.com", true),
      membro("bruno@x.com", false),
      membro("caio@x.com", true),
    ]);
    expect(emails).toEqual(["ana@x.com", "caio@x.com"]);
  });

  it("remove duplicatas", () => {
    expect(
      destinatariosDoDigest([membro("ana@x.com", true), membro("ana@x.com", true)]),
    ).toEqual(["ana@x.com"]);
  });

  it("descarta membros sem perfil ou sem email", () => {
    const emails = destinatariosDoDigest([
      { profiles: null },
      { profiles: { email: "", notificar_task_concluida: true } },
      membro("ok@x.com", true),
    ]);
    expect(emails).toEqual(["ok@x.com"]);
  });

  it("lista vazia quando ninguém quer receber", () => {
    expect(destinatariosDoDigest([membro("a@x.com", false)])).toEqual([]);
  });
});
