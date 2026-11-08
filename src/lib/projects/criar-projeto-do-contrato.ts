import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent, type Ator } from "@/lib/events";
import { carregarSettings } from "@/lib/data/settings";
import { paraISO, slugify, somarDias } from "@/lib/domain/datas";
import { decidirEntrada, fimDeS3 } from "@/lib/domain/fila-capacidade";
import {
  montarEsqueleto,
  type ModuloBloqueado,
  type ModuloDoCatalogo,
} from "@/lib/domain/projeto-esqueleto";
import { sincronizarProjeto } from "./sprints";
import type { Admin } from "./tipos";

export interface CriarProjetoOpcoes {
  /** Quem disparou (padrão: sistema, ex.: aceite da proposta). */
  ator?: Ator;
  /** Injetável em teste. */
  agora?: Date;
}

export interface CriarProjetoResultado {
  projectId: string;
  /** false = o contrato já tinha projeto (chamada repetida, nada foi alterado). */
  criado: boolean;
  naFila: boolean;
  /** Data de início explícita (hoje quando não há fila). */
  dataInicioPrevista: string | null;
}

async function carregarModulos(admin: Admin, tierId: string | null) {
  const incluidos: ModuloDoCatalogo[] = [];
  const bloqueados: ModuloBloqueado[] = [];
  if (!tierId) return { incluidos, bloqueados };

  const { data: tiers } = await admin
    .from("tiers")
    .select("id, ordem, nome, tier_modules(module_id, ordem, modules(id, nome, descricao, ativo))")
    .order("ordem");
  const atual = (tiers ?? []).find((t) => t.id === tierId);
  if (!atual) return { incluidos, bloqueados };

  type Linha = { ordem: number; modules: { id: string; nome: string; descricao: string | null; ativo: boolean } | null };
  const modulosDoTier = (t: { tier_modules: unknown }) =>
    ((t.tier_modules ?? []) as unknown as (Omit<Linha, "modules"> & { modules: Linha["modules"] | Linha["modules"][] })[])
      .map((l) => ({ ordem: l.ordem, modulo: Array.isArray(l.modules) ? l.modules[0] : l.modules }))
      .filter((l): l is { ordem: number; modulo: NonNullable<Linha["modules"]> } => !!l.modulo && l.modulo.ativo)
      .sort((a, b) => a.ordem - b.ordem)
      .map((l) => l.modulo);

  const jaIncluidos = new Set<string>();
  for (const m of modulosDoTier(atual)) {
    jaIncluidos.add(m.id);
    incluidos.push({ id: m.id, nome: m.nome, descricao: m.descricao });
  }
  // Tiers acima, do mais baixo ao mais alto: o módulo é "liberado" pelo primeiro que o contém.
  for (const tier of (tiers ?? []).filter((t) => t.ordem > atual.ordem)) {
    for (const m of modulosDoTier(tier)) {
      if (jaIncluidos.has(m.id)) continue;
      jaIncluidos.add(m.id);
      bloqueados.push({ id: m.id, nome: m.nome, descricao: m.descricao, tierId: tier.id, tierNome: tier.nome });
    }
  }
  return { incluidos, bloqueados };
}

async function slugLivre(admin: Admin, organizationId: string, base: string): Promise<string> {
  const { data } = await admin.from("projects").select("slug").eq("organization_id", organizationId).like("slug", `${base}%`);
  const usados = new Set((data ?? []).map((p) => p.slug));
  let slug = base;
  for (let n = 2; usados.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

async function projetoExistente(admin: Admin, contractId: string) {
  const { data } = await admin
    .from("projects")
    .select("id, na_fila, data_inicio_prevista")
    .eq("contract_id", contractId)
    .maybeSingle();
  return data;
}

/**
 * Cria o projeto (esqueleto S0–S4+) de um contrato aceito. Idempotente: uma
 * segunda chamada para o mesmo contrato devolve o projeto existente.
 *
 * Trava de capacidade (PRD §7.8): com `capacidade_max_projetos` em S0–S3, o
 * projeto nasce `na_fila` com `data_inicio_prevista` explícita; o cron e o
 * fechamento de S3 promovem a fila (`promoverFila`).
 *
 * Chamada pela Fase 2 em `aoAceitarProposta` (src/lib/proposals/on-accept.ts).
 */
export async function criarProjetoDoContrato(
  contractId: string,
  opcoes: CriarProjetoOpcoes = {},
): Promise<CriarProjetoResultado> {
  const admin = createAdminClient();
  const agora = opcoes.agora ?? new Date();
  const hoje = paraISO(agora);
  const ator: Ator = opcoes.ator ?? { tipo: "sistema" };

  const { data: contrato } = await admin.from("contracts").select("*").eq("id", contractId).maybeSingle();
  if (!contrato) throw new Error(`Contrato não encontrado: ${contractId}`);
  if (contrato.status === "cancelado" || contrato.status === "encerrado") {
    throw new Error(`Contrato ${contrato.status} não gera projeto.`);
  }

  const existente = await projetoExistente(admin, contractId);
  if (existente) {
    return {
      projectId: existente.id,
      criado: false,
      naFila: existente.na_fila,
      dataInicioPrevista: existente.data_inicio_prevista,
    };
  }

  const { data: org } = await admin.from("organizations").select("id, nome").eq("id", contrato.organization_id).single();
  if (!org) throw new Error("Conta do contrato não encontrada.");

  // --- capacidade -----------------------------------------------------------
  const settings = await carregarSettings(admin);
  const { data: ocupantes } = await admin
    .from("projects")
    .select("start_date, created_at, relogio_dias_pausados")
    .eq("status", "em_andamento")
    .eq("na_fila", false)
    .gte("semana_atual", 0)
    .lte("semana_atual", 3);
  const { count: jaNaFila } = await admin
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("na_fila", true)
    .eq("status", "em_andamento");

  const fims = (ocupantes ?? []).map((p) => fimDeS3(p.start_date ?? p.created_at.slice(0, 10), p.relogio_dias_pausados));
  const entrada = decidirEntrada(settings.capacidade_max_projetos, fims, jaNaFila ?? 0, hoje);

  // --- esqueleto ------------------------------------------------------------
  const { incluidos, bloqueados } = await carregarModulos(admin, contrato.tier_id);
  const sprints = montarEsqueleto({
    inicio: entrada.dataInicioPrevista,
    iniciarS0: !entrada.naFila,
    modulosIncluidos: incluidos,
    modulosBloqueados: bloqueados,
  });

  const slug = await slugLivre(admin, org.id, `${slugify(org.nome) || "projeto"}-implementacao`);
  const { data: projeto, error: erroProjeto } = await admin
    .from("projects")
    .insert({
      organization_id: org.id,
      contract_id: contrato.id,
      nome: `Implementação ${org.nome}`,
      slug,
      status: "em_andamento",
      relogio: "rodando",
      semana_atual: 0,
      na_fila: entrada.naFila,
      start_date: entrada.naFila ? null : entrada.dataInicioPrevista,
      data_inicio_prevista: entrada.dataInicioPrevista,
      data_fim_prevista: somarDias(entrada.dataInicioPrevista, contrato.vigencia_meses * 30),
      previsao_entrega: somarDias(entrada.dataInicioPrevista, 27),
    })
    .select("id")
    .single();

  if (erroProjeto || !projeto) {
    // Corrida entre dois aceites: o índice único de contract_id garante um só projeto.
    const outro = await projetoExistente(admin, contractId);
    if (outro) {
      return { projectId: outro.id, criado: false, naFila: outro.na_fila, dataInicioPrevista: outro.data_inicio_prevista };
    }
    throw new Error(`Falha ao criar o projeto: ${erroProjeto?.message ?? "desconhecida"}`);
  }

  try {
    for (const sprint of sprints) {
      const { data: fase, error } = await admin
        .from("phases")
        .insert({
          project_id: projeto.id,
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
      if (error || !fase) throw new Error(error?.message ?? "fase não criada");

      const { error: erroTasks } = await admin.from("tasks").insert(
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
          module_id: t.module_id,
          bloqueada_por_tier_id: t.bloqueada_por_tier_id,
          motivo_bloqueio: t.motivo_bloqueio,
          concluida_em: t.status === "concluida" ? agora.toISOString() : null,
        })),
      );
      if (erroTasks) throw new Error(erroTasks.message);
    }
  } catch (e) {
    await admin.from("projects").delete().eq("id", projeto.id); // cascata limpa fases e tasks
    throw e;
  }

  // Corrida de capacidade: se outro aceite ocupou a última vaga entre a leitura e o insert,
  // este projeto cede e vai para a fila (limite duro).
  let naFila = entrada.naFila;
  let dataInicio = entrada.dataInicioPrevista;
  if (!naFila) {
    const { data: ocupados } = await admin.rpc("projetos_em_implementacao");
    if ((ocupados ?? 0) > settings.capacidade_max_projetos) {
      const reentrada = decidirEntrada(settings.capacidade_max_projetos, fims, (jaNaFila ?? 0) + 1, hoje);
      naFila = true;
      dataInicio = reentrada.dataInicioPrevista;
      await admin
        .from("projects")
        .update({ na_fila: true, start_date: null, data_inicio_prevista: dataInicio })
        .eq("id", projeto.id);
      await admin.from("phases").update({ status: "pendente" }).eq("project_id", projeto.id).eq("etapa", "S0");
    }
  }

  await logEvent({
    tipo: "project.started",
    ator,
    organizationId: org.id,
    entidade: "projects",
    entidadeId: projeto.id,
    payload: { projectId: projeto.id, contractId: contrato.id, naFila },
  });

  if (!naFila) await sincronizarProjeto(admin, projeto.id);

  return { projectId: projeto.id, criado: true, naFila, dataInicioPrevista: dataInicio };
}
