import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

interface LimiteConfig {
  chave: string;
  limite: number;
  janelaSegundos: number;
}

/**
 * Contador em Postgres com janela deslizante (SECURITY §3). Registra o
 * acerto sempre; retorna se o limite já foi excedido para esta chave.
 */
export async function verificarLimite({
  chave,
  limite,
  janelaSegundos,
}: LimiteConfig): Promise<{ excedido: boolean; retryAfterSegundos: number }> {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - janelaSegundos * 1000).toISOString();

  const { count } = await admin
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("chave", chave)
    .gte("created_at", desde);

  const excedido = (count ?? 0) >= limite;
  if (!excedido) {
    await admin.from("rate_limit_hits").insert({ chave });
  }

  return { excedido, retryAfterSegundos: janelaSegundos };
}
