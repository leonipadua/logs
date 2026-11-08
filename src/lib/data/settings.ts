import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { calcularCapacidade, mesclarSettings, type SettingsValues } from "@/lib/domain/settings";

type Client = SupabaseClient<Database>;

/** Lê `settings` e devolve valores tipados (padrões quando a chave não existe). */
export async function carregarSettings(client: Client): Promise<SettingsValues> {
  const { data } = await client.from("settings").select("chave, valor");
  return mesclarSettings(data ?? []);
}

/** Capacidade atual: máximo configurado vs projetos em S0–S3 fora da fila. */
export async function carregarCapacidade(client: Client) {
  const [settings, { data: ocupados }] = await Promise.all([
    carregarSettings(client),
    client.rpc("projetos_em_implementacao"),
  ]);
  return calcularCapacidade(settings.capacidade_max_projetos, ocupados ?? 0);
}
