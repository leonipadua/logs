import "server-only";
import type { ContextoSprint } from "@/lib/domain/sprint";
import type { Admin } from "./tipos";

/**
 * Regra 7 (sem sprint sem pagamento): a primeira cobrança do contrato está paga.
 * Reaproveita `charges` (F5); qualquer cobrança paga da conta após o contrato
 * conta como a primeira. Quando a Fase 4 criar cobranças ligadas ao contrato,
 * é só apertar este filtro aqui.
 */
export async function pagamentoConfirmado(
  admin: Admin,
  organizationId: string,
  desde?: string | null,
): Promise<boolean> {
  let q = admin
    .from("charges")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "paga");
  if (desde) q = q.gte("data_pagamento", desde);
  const { count } = await q;
  return (count ?? 0) > 0;
}

export async function kickoffMarcado(admin: Admin, projectId: string): Promise<boolean> {
  const { count } = await admin
    .from("project_meetings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tipo", "kickoff")
    .neq("status", "cancelada");
  return (count ?? 0) > 0;
}

export async function carregarContextoSprint(
  admin: Admin,
  projeto: { id: string; organization_id: string; contract_id: string | null },
): Promise<ContextoSprint> {
  let desde: string | null = null;
  if (projeto.contract_id) {
    const { data: contrato } = await admin
      .from("contracts")
      .select("created_at")
      .eq("id", projeto.contract_id)
      .maybeSingle();
    desde = contrato?.created_at ?? null;
  }
  const [pago, kickoff] = await Promise.all([
    pagamentoConfirmado(admin, projeto.organization_id, desde),
    kickoffMarcado(admin, projeto.id),
  ]);
  return { pagamentoConfirmado: pago, kickoffMarcado: kickoff };
}
