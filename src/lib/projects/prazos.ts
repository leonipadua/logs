import "server-only";
import { somarDias } from "@/lib/domain/datas";
import type { Admin } from "./tipos";

/**
 * Empurra as datas previstas (projeto e sprints ainda abertas) em `dias`:
 * usado ao retomar o relógio e ao promover um projeto da fila.
 */
export async function deslocarPrazos(admin: Admin, projectId: string, dias: number): Promise<void> {
  if (dias === 0) return;

  const { data: projeto } = await admin
    .from("projects")
    .select("data_fim_prevista, previsao_entrega")
    .eq("id", projectId)
    .maybeSingle();
  if (projeto) {
    await admin
      .from("projects")
      .update({
        data_fim_prevista: projeto.data_fim_prevista ? somarDias(projeto.data_fim_prevista, dias) : null,
        previsao_entrega: projeto.previsao_entrega ? somarDias(projeto.previsao_entrega, dias) : null,
      })
      .eq("id", projectId);
  }

  const { data: fases } = await admin
    .from("phases")
    .select("id, inicio_previsto, fim_previsto")
    .eq("project_id", projectId)
    .neq("status", "concluida");
  for (const f of fases ?? []) {
    await admin
      .from("phases")
      .update({
        inicio_previsto: f.inicio_previsto ? somarDias(f.inicio_previsto, dias) : null,
        fim_previsto: f.fim_previsto ? somarDias(f.fim_previsto, dias) : null,
      })
      .eq("id", f.id);
  }
}
