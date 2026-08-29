import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Varredura diária (Vercel Cron — ARCHITECTURE §4.3). Cobranças pendentes
 * cujo vencimento já passou viram `vencida`; a oferta associada, se ainda
 * em negociação, volta a `disponivel` para nova tentativa.
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

  return NextResponse.json({ ok: true, cobrancasMarcadas: vencidas?.length ?? 0 });
}
