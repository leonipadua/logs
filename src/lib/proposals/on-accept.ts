import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/events";

/**
 * GANCHO DO ACEITE. Chamado por aceitarPropostaAction depois que a proposta
 * virou `aceita` e o contrato (origem = 'proposta') foi criado.
 *
 * Hoje só registra `offer.accepted`. A Fase 3 (projeto/portal) estende ESTA
 * função: criar projects (contract_id), o esqueleto S0–S4+, as pendências do
 * cliente e aplicar a fila de capacidade — emitindo `project.started`.
 *
 * Contrato: idempotente por proposalId, nunca lança (o aceite já foi
 * persistido; falha aqui não pode desfazê-lo).
 */
export async function aoAceitarProposta(proposalId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: proposta } = await admin
      .from("proposals")
      .select("id, organization_id, tier_id")
      .eq("id", proposalId)
      .maybeSingle();
    if (!proposta?.tier_id) {
      console.error("[on-accept] proposta sem tier escolhido", proposalId);
      return;
    }
    const { data: contrato } = await admin
      .from("contracts")
      .select("id")
      .eq("proposal_id", proposalId)
      .maybeSingle();

    await logEvent({
      tipo: "offer.accepted",
      ator: { tipo: "lead" },
      organizationId: proposta.organization_id,
      entidadeId: proposta.id,
      payload: { proposalId: proposta.id, tierId: proposta.tier_id, contractId: contrato?.id ?? null },
    });
  } catch (e) {
    console.error("[on-accept] falha no gancho do aceite", proposalId, e instanceof Error ? e.message : e);
  }
}
