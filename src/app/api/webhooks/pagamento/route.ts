import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments";
import { processarEventoPagamento } from "@/lib/domain/payments";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function tentarParsear(texto: string): Json {
  try {
    return JSON.parse(texto) as Json;
  } catch {
    return { raw: texto };
  }
}

/**
 * SECURITY §6 — endpoint mais sensível: escrita não autenticada por sessão
 * que altera estado financeiro. Verificar assinatura antes de qualquer
 * coisa; persistir o payload bruto antes de interpretar; responder rápido.
 */
export async function POST(request: Request) {
  const corpoBruto = await request.clone().text();
  const provider = process.env.PAYMENT_PROVIDER ?? "mock";
  const admin = createAdminClient();

  const evento = await paymentProvider.verificarWebhook(request);

  if (!evento) {
    await admin.from("payment_events").insert({
      provider,
      provider_event_id: `invalido_${crypto.randomUUID()}`,
      tipo: "assinatura_invalida",
      payload: tentarParsear(corpoBruto),
      assinatura_valida: false,
    });
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const { error: erroInsert } = await admin.from("payment_events").insert({
    provider,
    provider_event_id: evento.providerEventId,
    tipo: evento.tipo,
    payload: tentarParsear(corpoBruto),
    assinatura_valida: true,
  });

  if (erroInsert) {
    // unique(provider, provider_event_id): reentrega do mesmo evento —
    // idempotente, não reprocessa.
    return NextResponse.json({ ok: true, duplicado: true });
  }

  try {
    await processarEventoPagamento(admin, evento);
    await admin
      .from("payment_events")
      .update({ processado_em: new Date().toISOString() })
      .eq("provider", provider)
      .eq("provider_event_id", evento.providerEventId);
  } catch (erro) {
    await admin
      .from("payment_events")
      .update({ erro_processamento: erro instanceof Error ? erro.message : String(erro) })
      .eq("provider", provider)
      .eq("provider_event_id", evento.providerEventId);
  }

  return NextResponse.json({ ok: true });
}
