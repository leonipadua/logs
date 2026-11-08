import { describe, it, expect } from "vitest";
import {
  avaliarCriterioPronto,
  comporDescricaoSprint,
  podeFecharSprint,
  podeIniciarSprint,
  proximaEtapa,
  separarDescricaoSprint,
  type TaskDeSprint,
} from "./sprint";

const t = (status: string, dono = "sabre", tier: string | null = null): TaskDeSprint => ({
  status,
  dono,
  bloqueada_por_tier_id: tier,
});

describe("sem sprint sem pagamento", () => {
  it("S0 sempre pode começar; S1+ exige cobrança paga", () => {
    expect(podeIniciarSprint("S0", { pagamentoConfirmado: false }).ok).toBe(true);
    for (const e of ["S1", "S2", "S3", "S4"] as const) {
      expect(podeIniciarSprint(e, { pagamentoConfirmado: false }).ok).toBe(false);
      expect(podeIniciarSprint(e, { pagamentoConfirmado: true }).ok).toBe(true);
    }
  });
});

describe("critério de pronto", () => {
  it("S0 = pagamento confirmado + kickoff marcado", () => {
    expect(avaliarCriterioPronto("S0", [], { pagamentoConfirmado: true, kickoffMarcado: true }).ok).toBe(true);
    const sem = avaliarCriterioPronto("S0", [], { pagamentoConfirmado: false, kickoffMarcado: false });
    expect(sem).toMatchObject({ ok: false });
    expect(!sem.ok && sem.pendencias).toHaveLength(2);
    expect(avaliarCriterioPronto("S0", [], { pagamentoConfirmado: true, kickoffMarcado: false }).ok).toBe(false);
  });

  it("S1+ exige todas as tasks do escopo concluídas, ignorando as bloqueadas por tier", () => {
    const ctx = { pagamentoConfirmado: true, kickoffMarcado: true };
    expect(avaliarCriterioPronto("S2", [t("concluida"), t("bloqueada", "sabre", "tier-3")], ctx).ok).toBe(true);
    const aberto = avaliarCriterioPronto("S1", [t("concluida"), t("pendente"), t("pendente", "cliente")], ctx);
    expect(aberto.ok).toBe(false);
    expect(!aberto.ok && aberto.pendencias.join(" ")).toMatch(/Sabre.*cliente/s);
  });

  it("sprint sem entregas não fecha", () => {
    expect(avaliarCriterioPronto("S3", [], { pagamentoConfirmado: true, kickoffMarcado: true }).ok).toBe(false);
  });
});

describe("podeFecharSprint", () => {
  const ctx = { pagamentoConfirmado: true, kickoffMarcado: true };
  it("só fecha sprint em andamento com critério batendo", () => {
    expect(podeFecharSprint({ etapa: "S2", status: "em_andamento" }, [t("concluida")], ctx).ok).toBe(true);
    expect(podeFecharSprint({ etapa: "S2", status: "em_andamento" }, [t("pendente")], ctx).ok).toBe(false);
    expect(podeFecharSprint({ etapa: "S2", status: "pendente" }, [t("concluida")], ctx).ok).toBe(false);
    expect(podeFecharSprint({ etapa: "S2", status: "concluida" }, [t("concluida")], ctx).ok).toBe(false);
  });
});

describe("etapas e descrição", () => {
  it("S4+ não tem próxima etapa", () => {
    expect(proximaEtapa("S0")).toBe("S1");
    expect(proximaEtapa("S3")).toBe("S4");
    expect(proximaEtapa("S4")).toBeNull();
  });

  it("compõe e separa objetivo e dependência do cliente", () => {
    const d = comporDescricaoSprint("Preparar o terreno.", "Entregar dados.");
    expect(separarDescricaoSprint(d)).toEqual({ objetivo: "Preparar o terreno.", dependeDoCliente: "Entregar dados." });
    expect(separarDescricaoSprint("só texto")).toEqual({ objetivo: "só texto", dependeDoCliente: null });
    expect(separarDescricaoSprint(null).objetivo).toBe("");
  });
});
