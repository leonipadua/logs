import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCentavosBRL, formatDataPtBR } from "@/lib/format";

export const dynamic = "force-dynamic";

function csvEscape(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: cobrancas } = await supabase
    .from("charges")
    .select("*, organizations(nome)")
    .order("created_at", { ascending: false });

  const cabecalho = ["Organização", "Tipo", "Método", "Valor", "Status", "Vencimento", "Data de pagamento"];
  const linhas = (cobrancas ?? []).map((c) => {
    const org = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations;
    return [
      org?.nome ?? "",
      c.tipo,
      c.metodo ?? "",
      formatCentavosBRL(c.valor_centavos),
      c.status,
      formatDataPtBR(c.vencimento),
      c.data_pagamento ? formatDataPtBR(c.data_pagamento) : "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });

  const csv = [cabecalho.join(","), ...linhas].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cobrancas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
