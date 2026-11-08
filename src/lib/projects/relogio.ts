import "server-only";
import { logEvent, type Ator } from "@/lib/events";
import { diasEntre, paraISO } from "@/lib/domain/datas";
import { decidirRelogio, novasVencidas, pendenciasVencidas, type TaskParaRelogio } from "@/lib/domain/relogio";
import { deslocarPrazos } from "./prazos";
import type { Admin, ResultadoAcao } from "./tipos";

type Origem = "automatico" | "manual";

export async function pausarRelogio(
  admin: Admin,
  projectId: string,
  motivo: string,
  origem: Origem,
  ator: Ator,
  agora: Date = new Date(),
): Promise<ResultadoAcao> {
  const { data } = await admin
    .from("projects")
    .update({
      relogio: "pausado",
      relogio_pausado_em: agora.toISOString(),
      relogio_motivo: motivo,
      relogio_origem: origem,
    })
    .eq("id", projectId)
    .eq("relogio", "rodando")
    .select("id, organization_id");
  const projeto = data?.[0];
  if (!projeto) return { ok: false, erro: "O relógio já está pausado (ou o projeto não existe)." };

  await logEvent({
    tipo: "clock.paused",
    ator,
    organizationId: projeto.organization_id,
    entidadeId: projectId,
    payload: { projectId, motivo },
  });
  return { ok: true };
}

/** Retoma, soma os dias parados e empurra as datas previstas na mesma medida. */
export async function retomarRelogio(
  admin: Admin,
  projectId: string,
  ator: Ator,
  agora: Date = new Date(),
): Promise<ResultadoAcao<{ diasPausados: number }>> {
  const { data: antes } = await admin
    .from("projects")
    .select("id, organization_id, relogio, relogio_pausado_em, relogio_dias_pausados")
    .eq("id", projectId)
    .maybeSingle();
  if (!antes || antes.relogio !== "pausado") return { ok: false, erro: "O relógio não está pausado." };

  const dias = antes.relogio_pausado_em ? diasEntre(antes.relogio_pausado_em, agora) : 0;
  const { data } = await admin
    .from("projects")
    .update({
      relogio: "rodando",
      relogio_pausado_em: null,
      relogio_motivo: null,
      relogio_origem: null,
      relogio_dias_pausados: antes.relogio_dias_pausados + dias,
    })
    .eq("id", projectId)
    .eq("relogio", "pausado")
    .select("id");
  if (!data || data.length === 0) return { ok: false, erro: "O relógio já foi retomado." };

  await deslocarPrazos(admin, projectId, dias);
  await logEvent({
    tipo: "clock.resumed",
    ator,
    organizationId: antes.organization_id,
    entidadeId: projectId,
    payload: { projectId, diasPausados: dias },
  });
  return { ok: true, diasPausados: dias };
}

export interface ResumoRelogios {
  pausados: number;
  retomados: number;
  vencidasRegistradas: number;
}

/**
 * Varredura do cron: pendência do cliente vencida pausa o projeto sem ninguém
 * cobrar (PRD §7.6); resolvida, retoma. Emite `client_task.overdue` uma vez por task.
 */
export async function sincronizarRelogios(admin: Admin, agora: Date = new Date()): Promise<ResumoRelogios> {
  const hoje = paraISO(agora);
  const resumo: ResumoRelogios = { pausados: 0, retomados: 0, vencidasRegistradas: 0 };
  const ator: Ator = { tipo: "sistema" };

  const { data: projetos } = await admin
    .from("projects")
    .select("id, organization_id, relogio, relogio_origem, relogio_pausado_em")
    .eq("status", "em_andamento")
    .eq("na_fila", false)
    .not("semana_atual", "is", null);

  const { data: abertas } = await admin
    .from("tasks")
    .select("id, dono, status, prazo, bloqueada_por_tier_id, vencida_registrada_em, phases!inner(project_id)")
    .eq("dono", "cliente")
    .neq("status", "concluida")
    .not("prazo", "is", null)
    .lt("prazo", hoje);

  const porProjeto = new Map<string, TaskParaRelogio[]>();
  for (const t of abertas ?? []) {
    const fase = Array.isArray(t.phases) ? t.phases[0] : t.phases;
    if (!fase) continue;
    const lista = porProjeto.get(fase.project_id) ?? [];
    lista.push(t);
    porProjeto.set(fase.project_id, lista);
  }

  for (const projeto of projetos ?? []) {
    const vencidas = pendenciasVencidas(porProjeto.get(projeto.id) ?? [], hoje);

    for (const t of novasVencidas(vencidas)) {
      await admin.from("tasks").update({ vencida_registrada_em: agora.toISOString() }).eq("id", t.id);
      await logEvent({
        tipo: "client_task.overdue",
        ator,
        organizationId: projeto.organization_id,
        entidadeId: t.id,
        payload: { taskId: t.id, projectId: projeto.id, prazo: t.prazo ?? hoje },
      });
      resumo.vencidasRegistradas++;
    }

    const decisao = decidirRelogio(
      { relogio: projeto.relogio, relogioOrigem: projeto.relogio_origem, pausadoEm: projeto.relogio_pausado_em },
      vencidas,
      agora,
    );
    if (decisao.acao === "pausar") {
      const r = await pausarRelogio(admin, projeto.id, decisao.motivo, "automatico", ator, agora);
      if (r.ok) resumo.pausados++;
    } else if (decisao.acao === "retomar") {
      const r = await retomarRelogio(admin, projeto.id, ator, agora);
      if (r.ok) resumo.retomados++;
    }
  }
  return resumo;
}
