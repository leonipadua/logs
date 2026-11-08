import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { promoverFila, sincronizarProjetosEmS0, sincronizarRelogios } from "@/lib/projects";

export const dynamic = "force-dynamic";

/**
 * Varredura diária (Vercel Cron — ARCHITECTURE §4.3). Cobranças pendentes
 * cujo vencimento já passou viram `vencida`; a oferta associada, se ainda
 * em negociação, volta a `disponivel` para nova tentativa.
 *
 * Logs v2 (fase 3): também pausa/retoma o relógio dos projetos conforme as
 * pendências do cliente vencidas (PRD §7.6), completa S0 com o pagamento e o
 * kickoff, e promove a fila de capacidade.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "não autorizado" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: vencidas } = await admin
    .from("charges")
    .update({ status: "vencida" })
    .in("status", ["pendente", "agendada"])
    .lt("vencimento", hoje)
    .select("id, project_offer_id");

  const ofertaIds = (vencidas ?? []).map((c) => c.project_offer_id).filter((id): id is string => !!id);
  if (ofertaIds.length > 0) {
    await admin.from("project_offers").update({ status: "disponivel" }).in("id", ofertaIds).eq("status", "em_negociacao");
  }

  // Cada etapa isolada: uma falha não impede as demais varreduras.
  const projetos: Record<string, unknown> = {};
  try {
    projetos.s0Sincronizados = await sincronizarProjetosEmS0(admin);
    projetos.relogios = await sincronizarRelogios(admin);
    projetos.promovidosDaFila = (await promoverFila(admin)).length;
  } catch (e) {
    console.error("[cron] falha na varredura de projetos", e);
    projetos.erro = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({ ok: true, cobrancasMarcadas: vencidas?.length ?? 0, projetos });
}
