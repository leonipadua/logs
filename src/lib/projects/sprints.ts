import "server-only";
import { logEvent, type Ator } from "@/lib/events";
import { carregarCapacidade, carregarSettings } from "@/lib/data/settings";
import { diferencaDias, paraISO, somarDias } from "@/lib/domain/datas";
import { montarCicloS4, type SprintPlano } from "@/lib/domain/projeto-esqueleto";
import { quantosPromover } from "@/lib/domain/fila-capacidade";
import {
  ehEtapa,
  podeFecharSprint,
  podeIniciarSprint,
  proximaEtapa,
  semanaDaEtapa,
  type Etapa,
} from "@/lib/domain/sprint";
import { carregarContextoSprint } from "./contexto";
import { deslocarPrazos } from "./prazos";
import type { Admin, ResultadoAcao } from "./tipos";

async function carregarProjetoBase(admin: Admin, projectId: string) {
  const { data } = await admin
    .from("projects")
    .select("id, organization_id, contract_id, na_fila, status")
    .eq("id", projectId)
    .maybeSingle();
  return data;
}

/** Marca uma task como concluída e registra `task.done` (uma vez só). */
export async function concluirTask(
  admin: Admin,
  task: { id: string; dono: string },
  projeto: { id: string; organization_id: string },
  ator: Ator,
): Promise<boolean> {
  const { data } = await admin
    .from("tasks")
    .update({ status: "concluida", concluida_em: new Date().toISOString(), motivo_bloqueio: null })
    .eq("id", task.id)
    .neq("status", "concluida")
    .select("id");
  if (!data || data.length === 0) return false;
  await logEvent({
    tipo: "task.done",
    ator,
    organizationId: projeto.organization_id,
    entidadeId: task.id,
    payload: { taskId: task.id, projectId: projeto.id, dono: task.dono === "cliente" ? "cliente" : "sabre" },
  });
  return true;
}

/**
 * S0 se completa sozinha com o que o sistema já sabe: pagamento confirmado
 * conclui "Primeira cobrança paga"; reunião de kickoff conclui "Kickoff agendado".
 * Idempotente; chamada pelo cron, pelo webhook de pagamento e ao agendar reuniões.
 */
export async function sincronizarProjeto(admin: Admin, projectId: string, ator: Ator = { tipo: "sistema" }) {
  const projeto = await carregarProjetoBase(admin, projectId);
  if (!projeto || projeto.na_fila) return;

  const { data: s0 } = await admin
    .from("phases")
    .select("id, tasks(id, titulo, dono, status)")
    .eq("project_id", projectId)
    .eq("etapa", "S0")
    .maybeSingle();
  if (!s0) return;

  const ctx = await carregarContextoSprint(admin, projeto);
  for (const task of s0.tasks) {
    const pronta =
      (task.titulo === "Primeira cobrança paga" && ctx.pagamentoConfirmado) ||
      (task.titulo === "Kickoff agendado" && ctx.kickoffMarcado);
    if (pronta && task.status !== "concluida") await concluirTask(admin, task, projeto, ator);
  }
}

/** Sincroniza todas as contas com S0 em andamento (cron). */
export async function sincronizarProjetosEmS0(admin: Admin): Promise<number> {
  const { data } = await admin
    .from("phases")
    .select("project_id, projects!inner(na_fila, status)")
    .eq("etapa", "S0")
    .eq("status", "em_andamento");
  const ids = [...new Set((data ?? []).map((f) => f.project_id))];
  for (const id of ids) await sincronizarProjeto(admin, id);
  return ids.length;
}

/** Sincroniza os projetos de uma conta (ex.: logo após o webhook de pagamento). */
export async function sincronizarProjetosDaConta(admin: Admin, organizationId: string) {
  const { data } = await admin.from("projects").select("id").eq("organization_id", organizationId).eq("status", "em_andamento");
  for (const p of data ?? []) await sincronizarProjeto(admin, p.id);
}

async function criarFaseComTasks(admin: Admin, projectId: string, sprint: SprintPlano) {
  const { data: fase } = await admin
    .from("phases")
    .insert({
      project_id: projectId,
      titulo: sprint.titulo,
      descricao: sprint.descricao,
      ordem: sprint.ordem,
      etapa: sprint.etapa,
      criterio_pronto: sprint.criterio_pronto,
      status: sprint.status,
      inicio_previsto: sprint.inicio_previsto,
      fim_previsto: sprint.fim_previsto,
    })
    .select("id")
    .single();
  if (!fase) return;
  await admin.from("tasks").insert(
    sprint.tasks.map((t) => ({
      phase_id: fase.id,
      titulo: t.titulo,
      slug: t.slug,
      descricao: t.descricao,
      dono: t.dono,
      categoria: t.categoria,
      status: t.status,
      prazo: t.prazo,
      ordem: t.ordem,
    })),
  );
}

/** Ao iniciar uma sprint, as pendências do cliente ganham prazo D+N (padrão D+3). */
async function aplicarPrazosDoCliente(admin: Admin, phaseId: string, hoje: string) {
  const { prazo_pendencia_cliente_dias } = await carregarSettings(admin);
  await admin
    .from("tasks")
    .update({ prazo: somarDias(hoje, prazo_pendencia_cliente_dias) })
    .eq("phase_id", phaseId)
    .eq("dono", "cliente")
    .neq("status", "concluida")
    .is("bloqueada_por_tier_id", null)
    .is("prazo", null)
    .in("categoria", ["dado", "acesso", "aprovacao"]);
}

/** Avalia o critério de pronto sem alterar nada (usado pela tela do admin). */
export async function avaliarFechamento(admin: Admin, phaseId: string) {
  const { data: fase } = await admin
    .from("phases")
    .select("id, project_id, etapa, status, tasks(status, dono, bloqueada_por_tier_id)")
    .eq("id", phaseId)
    .maybeSingle();
  if (!fase || !ehEtapa(fase.etapa)) return null;
  const projeto = await carregarProjetoBase(admin, fase.project_id);
  if (!projeto) return null;
  const ctx = await carregarContextoSprint(admin, projeto);
  return { fase: { ...fase, etapa: fase.etapa as Etapa }, projeto, ctx, veredito: podeFecharSprint({ etapa: fase.etapa as Etapa, status: fase.status }, fase.tasks, ctx) };
}

/**
 * Fecha a sprint só se o critério de pronto bate (PRD §4), registra
 * `sprint.closed` e abre a próxima (S1+ só com pagamento confirmado).
 * Fechar S3 libera uma vaga: a fila é promovida.
 */
export async function fecharSprint(
  admin: Admin,
  phaseId: string,
  ator: Ator,
  agora: Date = new Date(),
): Promise<ResultadoAcao<{ proximaEtapa: Etapa | null }>> {
  const avaliacao = await avaliarFechamento(admin, phaseId);
  if (!avaliacao) return { ok: false, erro: "Sprint não encontrada (ou sem etapa S0–S4)." };
  const { fase, projeto, ctx, veredito } = avaliacao;

  if (projeto.na_fila) return { ok: false, erro: "O projeto ainda está na fila de capacidade." };
  if (!veredito.ok) return { ok: false, erro: "O critério de pronto ainda não bate.", pendencias: veredito.pendencias };

  const hoje = paraISO(agora);
  const { data: fechada } = await admin
    .from("phases")
    .update({ status: "concluida", fechada_em: agora.toISOString() })
    .eq("id", phaseId)
    .eq("status", "em_andamento")
    .select("id");
  if (!fechada || fechada.length === 0) return { ok: false, erro: "A sprint já foi fechada." };

  await logEvent({
    tipo: "sprint.closed",
    ator,
    organizationId: projeto.organization_id,
    entidadeId: phaseId,
    payload: { phaseId, projectId: projeto.id, etapa: fase.etapa },
  });

  // --- próxima sprint ---------------------------------------------------------
  const proxima = proximaEtapa(fase.etapa);
  if (proxima === null) {
    // S4+ é cíclica: abre o próximo ciclo.
    const { data: ultimas } = await admin.from("phases").select("ordem").eq("project_id", projeto.id).order("ordem", { ascending: false }).limit(1);
    const ciclo = montarCicloS4(hoje, (ultimas?.[0]?.ordem ?? 4) + 1);
    await criarFaseComTasks(admin, projeto.id, ciclo);
    return { ok: true, proximaEtapa: "S4" };
  }

  const gate = podeIniciarSprint(proxima, ctx);
  if (!gate.ok) return { ok: true, proximaEtapa: null }; // fechada, mas a próxima aguarda pagamento

  const { data: seguinte } = await admin
    .from("phases")
    .select("id")
    .eq("project_id", projeto.id)
    .eq("etapa", proxima)
    .eq("status", "pendente")
    .order("ordem")
    .limit(1)
    .maybeSingle();
  if (seguinte) {
    await admin.from("phases").update({ status: "em_andamento" }).eq("id", seguinte.id);
    await aplicarPrazosDoCliente(admin, seguinte.id, hoje);
    await admin.from("projects").update({ semana_atual: semanaDaEtapa(proxima) }).eq("id", projeto.id);
  }

  if (fase.etapa === "S3") await promoverFila(admin);
  return { ok: true, proximaEtapa: proxima };
}

/**
 * Promove da fila os projetos que cabem na capacidade livre (FIFO por data de
 * início prevista). S0 começa na data da promoção e as datas se deslocam.
 */
export async function promoverFila(admin: Admin, agora: Date = new Date()): Promise<string[]> {
  const hoje = paraISO(agora);
  const capacidade = await carregarCapacidade(admin);
  const { data: fila } = await admin
    .from("projects")
    .select("id, organization_id, contract_id, data_inicio_prevista")
    .eq("na_fila", true)
    .eq("status", "em_andamento")
    .order("data_inicio_prevista", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const n = quantosPromover(capacidade.max, capacidade.ocupados, fila?.length ?? 0);
  const promovidos: string[] = [];

  for (const p of (fila ?? []).slice(0, n)) {
    // Promovido antes (ou depois) da data prometida: as datas previstas acompanham.
    const adiantamento = p.data_inicio_prevista ? diferencaDias(p.data_inicio_prevista, hoje) : 0;
    const { data: ok } = await admin
      .from("projects")
      .update({ na_fila: false, start_date: hoje, data_inicio_prevista: hoje, semana_atual: 0 })
      .eq("id", p.id)
      .eq("na_fila", true)
      .select("id");
    if (!ok || ok.length === 0) continue;
    await deslocarPrazos(admin, p.id, adiantamento);
    await admin.from("phases").update({ status: "em_andamento" }).eq("project_id", p.id).eq("etapa", "S0").eq("status", "pendente");
    await logEvent({
      tipo: "project.started",
      ator: { tipo: "sistema" },
      organizationId: p.organization_id,
      entidadeId: p.id,
      payload: { projectId: p.id, contractId: p.contract_id, naFila: false },
    });
    await sincronizarProjeto(admin, p.id);
    promovidos.push(p.id);
  }
  return promovidos;
}
