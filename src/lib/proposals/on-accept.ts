import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/events";
import { criarProjetoDoContrato } from "@/lib/projects";

/**
 * GANCHO DO ACEITE. Chamado por aceitarPropostaAction depois que a proposta
 * virou `aceita` e o contrato (origem = 'proposta') foi criado.
 *
 * Registra `offer.accepted` e cria o projeto (esqueleto S0–S4+, fila de
 * capacidade, `project.started`) via criarProjetoDoContrato, que é idempotente.
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

    if (contrato?.id) {
      await criarProjetoDoContrato(contrato.id, { ator: { tipo: "lead" } });
    } else {
      console.error("[on-accept] contrato não encontrado para a proposta", proposalId);
    }
  } catch (e) {
    console.error("[on-accept] falha no gancho do aceite", proposalId, e instanceof Error ? e.message : e);
  }
}
