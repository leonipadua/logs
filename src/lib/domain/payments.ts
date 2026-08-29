import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { EventoPagamento } from "@/lib/payments/types";
import { materializarOferta } from "./offers";
import { emailsDosOwners } from "./notifications";
import { enviarEmailComLog } from "@/lib/email/send-and-log";
import { templatePagamentoConfirmado, templateCobrancaFalhouOuVencida } from "@/lib/email/templates";
import { formatCentavosBRL } from "@/lib/format";

const URL_FATURAS = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/faturas`;

async function notificarOwners(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  tag: "M4b" | "M4c",
  montar: () => { assunto: string; html: string; texto: string },
) {
  const destinatarios = await emailsDosOwners(admin, organizationId);
  if (destinatarios.length === 0) return;
  const { assunto, html, texto } = montar();
  await enviarEmailComLog({ para: destinatarios, assunto, html, texto, tag }, organizationId);
}

/**
 * SECURITY §6: nunca regride de `paga`; reconcilia valor contra a cobrança
 * local antes de confirmar; idempotência é responsabilidade do chamador
 * (unique em payment_events, verificada antes desta função rodar).
 */
export async function processarEventoPagamento(
  admin: ReturnType<typeof createAdminClient>,
  evento: EventoPagamento,
): Promise<void> {
  const { data: charge } = await admin
    .from("charges")
    .select("*, organizations(nome)")
    .eq("provider_charge_id", evento.providerChargeId)
    .maybeSingle();

  if (!charge) {
    throw new Error(`Cobrança não encontrada para provider_charge_id=${evento.providerChargeId}`);
  }

  if (charge.status === "paga") return; // idempotente: nunca regride

  if (charge.valor_centavos !== evento.valorCentavos) {
    await admin
      .from("charges")
      .update({ motivo_falha: `Divergência de valor: cobrança=${charge.valor_centavos} evento=${evento.valorCentavos}` })
      .eq("id", charge.id);
    return;
  }

  if (evento.status === "paga") {
    await admin
      .from("charges")
      .update({ status: "paga", data_pagamento: new Date().toISOString(), motivo_falha: null })
      .eq("id", charge.id);

    if (charge.tipo === "desbloqueio" && charge.project_offer_id) {
      await materializarOferta(admin, charge.project_offer_id);
    }

    const org = Array.isArray(charge.organizations) ? charge.organizations[0] : charge.organizations;
    await notificarOwners(admin, charge.organization_id, "M4b", () =>
      templatePagamentoConfirmado({
        nomeOrganizacao: org?.nome ?? "",
        valorFormatado: formatCentavosBRL(charge.valor_centavos),
        urlFaturas: URL_FATURAS,
      }),
    );
    return;
  }

  if (evento.status === "falhou") {
    await admin
      .from("charges")
      .update({ status: "falhou", tentativas: charge.tentativas + 1, motivo_falha: "Pagamento recusado pelo provedor." })
      .eq("id", charge.id);

    if (charge.tipo === "desbloqueio" && charge.project_offer_id) {
      await admin.from("project_offers").update({ status: "disponivel" }).eq("id", charge.project_offer_id);
    }

    await notificarOwners(admin, charge.organization_id, "M4c", () =>
      templateCobrancaFalhouOuVencida({
        motivo: "Sua cobrança não pôde ser confirmada. Você pode tentar novamente pela mesma tela.",
        urlFaturas: URL_FATURAS,
      }),
    );
    return;
  }

  if (evento.status === "vencida") {
    await admin.from("charges").update({ status: "vencida" }).eq("id", charge.id);

    await notificarOwners(admin, charge.organization_id, "M4c", () =>
      templateCobrancaFalhouOuVencida({
        motivo: "Uma cobrança venceu sem pagamento confirmado.",
        urlFaturas: URL_FATURAS,
      }),
    );
  }
}
