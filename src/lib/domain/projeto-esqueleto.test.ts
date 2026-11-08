import { describe, it, expect } from "vitest";
import { montarCicloS4, montarEsqueleto } from "./projeto-esqueleto";
import { separarDescricaoSprint } from "./sprint";

const entrada = {
  inicio: "2026-11-09",
  iniciarS0: true,
  modulosIncluidos: [{ id: "m1", nome: "Agente WhatsApp", descricao: "Atende leads." }],
  modulosBloqueados: [{ id: "m2", nome: "Painel", descricao: "Visão do funil.", tierId: "tier-3", tierNome: "Escala" }],
};

describe("montarEsqueleto", () => {
  const sprints = montarEsqueleto(entrada);

  it("gera S0–S4 na ordem, com critério de pronto e dependência do cliente", () => {
    expect(sprints.map((s) => s.etapa)).toEqual(["S0", "S1", "S2", "S3", "S4"]);
    expect(sprints[0].criterio_pronto).toMatch(/Pagamento confirmado e kickoff marcado/);
    expect(separarDescricaoSprint(sprints[1].descricao).dependeDoCliente).toMatch(/D\+3/);
    expect(sprints.map((s) => s.ordem)).toEqual([0, 1, 2, 3, 4]);
  });

  it("só S0 começa em andamento; datas semanais", () => {
    expect(sprints.map((s) => s.status)).toEqual(["em_andamento", "pendente", "pendente", "pendente", "pendente"]);
    expect(sprints[1].inicio_previsto).toBe("2026-11-16");
    expect(sprints[1].fim_previsto).toBe("2026-11-22");
  });

  it("na fila, S0 não inicia", () => {
    expect(montarEsqueleto({ ...entrada, iniciarS0: false })[0].status).toBe("pendente");
  });

  it("S0 nasce com contrato e checklist feitos; pagamento é do cliente", () => {
    const s0 = sprints[0].tasks;
    expect(s0.find((t) => t.titulo === "Contrato assinado")?.status).toBe("concluida");
    expect(s0.find((t) => t.titulo === "Primeira cobrança paga")?.dono).toBe("cliente");
    expect(s0.find((t) => t.titulo === "Kickoff agendado")?.status).toBe("pendente");
  });

  it("S1 tem dados e acessos do cliente", () => {
    const cliente = sprints[1].tasks.filter((t) => t.dono === "cliente");
    expect(cliente.some((t) => t.categoria === "dado")).toBe(true);
    expect(cliente.filter((t) => t.categoria === "acesso").length).toBeGreaterThanOrEqual(3);
  });

  it("módulos de tiers acima viram tasks bloqueadas com motivo e ganho potencial", () => {
    const s2 = sprints[2].tasks;
    const bloqueada = s2.find((t) => t.module_id === "m2");
    expect(bloqueada).toMatchObject({
      status: "bloqueada",
      bloqueada_por_tier_id: "tier-3",
      motivo_bloqueio: "Disponível no plano Escala",
      descricao: "Visão do funil.",
    });
    expect(s2.find((t) => t.module_id === "m1")).toMatchObject({ status: "pendente", bloqueada_por_tier_id: null });
  });

  it("slugs únicos por sprint", () => {
    for (const s of sprints) {
      const slugs = s.tasks.map((t) => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("montarCicloS4", () => {
  it("novo ciclo em andamento com relatório pendente", () => {
    const c = montarCicloS4("2026-12-07", 5);
    expect(c).toMatchObject({ etapa: "S4", status: "em_andamento", ordem: 5, inicio_previsto: "2026-12-07" });
    expect(c.tasks.every((t) => t.status === "pendente")).toBe(true);
  });
});
