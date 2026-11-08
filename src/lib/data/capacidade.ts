import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { carregarCapacidade } from "@/lib/data/settings";
import { fimDeS3 } from "@/lib/domain/fila-capacidade";

type Client = SupabaseClient<Database>;

export interface ProjetoNaCapacidade {
  id: string;
  nome: string;
  organizacao: string;
  semanaAtual: number | null;
  /** Fim previsto de S3 (libera a vaga) ou data de início prevista, se na fila. */
  data: string | null;
  relogio: string;
}

/** Visão do admin: capacidade (limite duro), quem ocupa as vagas e quem espera. */
export async function carregarVisaoCapacidade(client: Client) {
  const capacidade = await carregarCapacidade(client);
  const { data } = await client
    .from("projects")
    .select("id, nome, semana_atual, start_date, created_at, na_fila, relogio, relogio_dias_pausados, data_inicio_prevista, organizations(nome)")
    .eq("status", "em_andamento")
    .not("semana_atual", "is", null)
    .order("data_inicio_prevista", { ascending: true, nullsFirst: false });

  const ocupantes: ProjetoNaCapacidade[] = [];
  const fila: ProjetoNaCapacidade[] = [];
  for (const p of data ?? []) {
    const org = Array.isArray(p.organizations) ? p.organizations[0] : p.organizations;
    const base = {
      id: p.id,
      nome: p.nome,
      organizacao: org?.nome ?? "",
      semanaAtual: p.semana_atual,
      relogio: p.relogio,
    };
    if (p.na_fila) fila.push({ ...base, data: p.data_inicio_prevista });
    else if (p.semana_atual !== null && p.semana_atual <= 3) {
      ocupantes.push({ ...base, data: fimDeS3(p.start_date ?? p.created_at.slice(0, 10), p.relogio_dias_pausados) });
    }
  }
  return { capacidade, ocupantes, fila };
}
