import { describe, it, expect } from "vitest";
import { aceiteSchema, dorSchema } from "./cockpit";

const org = "11111111-1111-4111-8111-111111111111";
const base = { organizationId: org, callId: "", tipoSpin: "implicacao", categoria: "", descricao: "Perdemos leads", valor: "", unidade: "" };

describe("dorSchema", () => {
  it("implicação sem número ou unidade falha", () => {
    const r = dorSchema.safeParse(base);
    expect(r.success).toBe(false);
    const campos = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(campos).toContain("valor");
    expect(campos).toContain("unidade");
  });
  it("implicação completa passa e converte pt-BR", () => {
    const r = dorSchema.safeParse({ ...base, valor: "1.500,50", unidade: "brl_mes" });
    expect(r.success && r.data.valor).toBe(1500.5);
  });
  it("outros tipos dispensam número, mas número exige unidade", () => {
    expect(dorSchema.safeParse({ ...base, tipoSpin: "problema" }).success).toBe(true);
    expect(dorSchema.safeParse({ ...base, tipoSpin: "problema", valor: "10" }).success).toBe(false);
  });
  it("rejeita unidade fora da lista e número negativo", () => {
    expect(dorSchema.safeParse({ ...base, valor: "10", unidade: "pizza" }).success).toBe(false);
    expect(dorSchema.safeParse({ ...base, valor: "-1", unidade: "leads_mes" }).success).toBe(false);
  });
});

describe("aceiteSchema", () => {
  const ok = { token: "a".repeat(64), tierId: org, condicaoId: org, aceiteNome: "Maria Souza", termos: "on" };
  it("exige termos, nome e ids", () => {
    expect(aceiteSchema.safeParse(ok).success).toBe(true);
    expect(aceiteSchema.safeParse({ ...ok, termos: null }).success).toBe(false);
    expect(aceiteSchema.safeParse({ ...ok, aceiteNome: "Al" }).success).toBe(false);
    expect(aceiteSchema.safeParse({ ...ok, tierId: "x" }).success).toBe(false);
    expect(aceiteSchema.safeParse({ ...ok, token: "../etc" }).success).toBe(false);
  });
  it("não aceita campo de preço (ignorado pelo schema)", () => {
    const r = aceiteSchema.safeParse({ ...ok, preco: 1 });
    expect(r.success && "preco" in r.data).toBe(false);
  });
});
