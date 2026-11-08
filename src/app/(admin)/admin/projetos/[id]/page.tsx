import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { excluirProjetoAction } from "@/lib/actions/project-actions";
import { excluirFaseAction } from "@/lib/actions/phase-actions";
import { excluirTaskAction } from "@/lib/actions/task-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCentavosBRL, formatDataHoraPtBR, formatDiaPtBR, formatPercentPtBR } from "@/lib/format";
import { carregarVisaoCapacidade } from "@/lib/data/capacidade";
import { carregarContextoSprint } from "@/lib/projects/contexto";
import { avaliarCriterioPronto, ehEtapa, separarDescricaoSprint } from "@/lib/domain/sprint";
import { pendenciasVencidas } from "@/lib/domain/relogio";
import { calcularSistemaConstruido } from "@/lib/domain/sistema-construido";
import { CapacidadeCard } from "../capacidade-card";
import {
  EditarProjetoForm,
  CriarFaseForm,
  EditarFaseForm,
  CriarTaskForm,
  StatusTaskSelect,
  EditarTaskModal,
} from "./project-forms";
import { PublicarOfertaForm, RemoverOfertaButton, DesbloquearManualButton } from "./offer-admin-forms";
import { SimularWebhookForm } from "./webhook-sim-form";
import {
  AgendarReuniaoForm,
  AtualizarReuniaoForm,
  FecharSprintForm,
  PausarRelogioForm,
  RetomarRelogioForm,
} from "./fluxo-forms";
import { excluirReuniaoAction } from "@/lib/actions/project-flow-actions";

const OFERTA_STATUS_TONE = {
  disponivel: "locked",
  em_negociacao: "progress",
  desbloqueada: "done",
  rascunho: "neutral",
  removida: "blocked",
} as const;

export const dynamic = "force-dynamic";

export default async function ProjetoDetailPage({ params }: PageProps<"/admin/projetos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, organizations(id, nome)")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const { data: fases } = await supabase
    .from("phases")
    .select("*, tasks(*)")
    .eq("project_id", id)
    .order("ordem", { ascending: true });

  const fasesOrdenadas = (fases ?? []).map((f) => ({ ...f, tasks: [...f.tasks].sort((a, b) => a.ordem - b.ordem) }));
  const org = Array.isArray(project.organizations) ? project.organizations[0] : project.organizations;
  const proximaOrdemFase = fasesOrdenadas.length === 0 ? 0 : Math.max(...fasesOrdenadas.map((f) => f.ordem)) + 1;

  const { data: catalogoOfertas } = await supabase
    .from("offers")
    .select("id, slug, titulo, insight_padrao, descricao_entrega, preco_padrao_centavos, prazo_estimado_dias")
    .eq("ativa", true)
    .order("titulo");

  const { data: ofertasDoProjeto } = await supabase
    .from("project_offers")
    .select("*")
    .eq("project_id", id)
    .neq("status", "removida")
    .order("created_at", { ascending: false });

  const { data: cobrancasPendentes } = await supabase
    .from("charges")
    .select("id, project_offer_id")
    .in("project_offer_id", (ofertasDoProjeto ?? []).map((o) => o.id))
    .in("status", ["pendente", "agendada"]);
  const cobrancaPorOferta = new Map((cobrancasPendentes ?? []).map((c) => [c.project_offer_id, c.id]));

  // --- Logs v2 · fase 3: sprints, relógio, reuniões e capacidade ---
  const ehProjetoV2 = project.semana_atual !== null;
  const hoje = new Date().toISOString().slice(0, 10);
  const ctxSprint = await carregarContextoSprint(supabase, project);
  const { data: reunioes } = await supabase
    .from("project_meetings")
    .select("*")
    .eq("project_id", id)
    .order("ocorre_em", { ascending: true });
  const visaoCapacidade = await carregarVisaoCapacidade(supabase);
  const todasTasks = fasesOrdenadas.flatMap((f) => f.tasks.map((t) => ({ ...t, etapa: f.etapa })));
  const construido = calcularSistemaConstruido(todasTasks);
  const vencidas = pendenciasVencidas(todasTasks, hoje);

  return (
    <div className="flex flex-col gap-8">
      <div>
        {org && (
          <Link href={`/admin/organizacoes/${org.id}`} className="text-body-sm text-text-secondary hover:text-text-primary">
            ← {org.nome}
          </Link>
        )}
        <h1 className="font-display text-display-md text-text-primary">{project.nome}</h1>
      </div>

      {ehProjetoV2 && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-body-lg font-medium text-text-primary">Relógio do projeto</h2>
            <span className="flex items-center gap-2">
              {project.na_fila && <Badge tone="locked">Na fila · início {project.data_inicio_prevista ? formatDiaPtBR(project.data_inicio_prevista) : "a definir"}</Badge>}
              <Badge tone={project.relogio === "pausado" ? "blocked" : "done"}>
                {project.relogio === "pausado" ? "Pausado" : "Rodando"}
              </Badge>
            </span>
          </div>
          <p className="mb-1 text-body-sm text-text-secondary">
            Sistema construído: <span className="tabular-nums">{formatPercentPtBR(construido.fracao)}</span> ({construido.concluidas} de{" "}
            {construido.total} entregas) · {project.relogio_dias_pausados} dia(s) pausado(s) no total
            {project.data_fim_prevista && <> · fim previsto {formatDiaPtBR(project.data_fim_prevista)}</>}
          </p>
          {project.relogio === "pausado" ? (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-body-sm text-state-blocked">
                {project.relogio_motivo} ({project.relogio_origem === "manual" ? "pausa manual" : "pausa automática"}
                {project.relogio_pausado_em && <>, desde {formatDataHoraPtBR(project.relogio_pausado_em)}</>})
              </p>
              {project.relogio_origem !== "manual" && vencidas.length > 0 && (
                <p className="text-body-sm text-text-secondary">
                  Retoma sozinho quando as {vencidas.length} pendência(s) vencida(s) forem resolvidas.
                </p>
              )}
              <RetomarRelogioForm projectId={project.id} />
            </div>
          ) : (
            <div className="mt-3">
              {vencidas.length > 0 && (
                <p className="mb-3 text-body-sm text-state-progress">
                  {vencidas.length} pendência(s) do cliente vencida(s): o cron pausa o relógio na próxima varredura.
                </p>
              )}
              <PausarRelogioForm projectId={project.id} />
            </div>
          )}
        </Card>
      )}

      {ehProjetoV2 && <CapacidadeCard visao={visaoCapacidade} destaqueId={project.id} />}

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Dados do projeto</h2>
        <EditarProjetoForm project={project} />
      </Card>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-body-lg font-medium text-text-primary">Fases e etapas</h2>
        </div>

        {fasesOrdenadas.length === 0 && (
          <EmptyState title="Nenhuma fase ainda" description="Adicione a primeira fase abaixo." />
        )}

        {fasesOrdenadas.map((fase) => {
          const proximaOrdemTask = fase.tasks.length === 0 ? 0 : Math.max(...fase.tasks.map((t) => t.ordem)) + 1;
          return (
            <Card key={fase.id}>
              {ehEtapa(fase.etapa) && (
                <SprintResumo
                  fase={fase}
                  etapa={fase.etapa}
                  ctx={ctxSprint}
                  hoje={hoje}
                  naFila={project.na_fila}
                />
              )}
              <div className="mb-4 flex items-start justify-between gap-4">
                <EditarFaseForm fase={fase} />
                <ConfirmDeleteButton
                  action={excluirFaseAction}
                  hiddenFields={{ faseId: fase.id }}
                  title="Excluir fase"
                  description={`A fase "${fase.titulo}" e suas ${fase.tasks.length} etapa(s) serão excluídas permanentemente.`}
                />
              </div>

              <ul className="mb-4 flex flex-col divide-y divide-border-subtle">
                {fase.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex flex-col gap-0.5">
                      <span className="text-body-sm text-text-primary">{task.titulo}</span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={task.dono === "cliente" ? "progress" : "neutral"}>{task.dono === "cliente" ? "Cliente" : "Sabre"}</Badge>
                        {task.prazo && (
                          <Badge tone={task.status !== "concluida" && task.dono === "cliente" && task.prazo < hoje ? "blocked" : "pending"}>
                            prazo {formatDiaPtBR(task.prazo)}
                            {task.status !== "concluida" && task.dono === "cliente" && task.prazo < hoje ? " · vencido" : ""}
                          </Badge>
                        )}
                        {task.bloqueada_por_tier_id && <Badge tone="locked">{task.motivo_bloqueio ?? "Bloqueada por tier"}</Badge>}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusTaskSelect task={task} />
                      <EditarTaskModal task={task} />
                      <ConfirmDeleteButton
                        action={excluirTaskAction}
                        hiddenFields={{ taskId: task.id }}
                        title="Excluir etapa"
                        description={`A etapa "${task.titulo}" será excluída permanentemente.`}
                      />
                    </span>
                  </li>
                ))}
              </ul>

              <CriarTaskForm faseId={fase.id} proximaOrdem={proximaOrdemTask} />
            </Card>
          );
        })}

        <Card>
          <CriarFaseForm projectId={project.id} proximaOrdem={proximaOrdemFase} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Reuniões e treinamentos</h2>
        {(reunioes ?? []).length > 0 && (
          <ul className="mb-6 flex flex-col divide-y divide-border-subtle">
            {(reunioes ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="flex flex-col">
                  <span className="text-body text-text-primary">
                    {r.titulo} <Badge tone="neutral">{r.tipo}</Badge>
                  </span>
                  <span className="text-body-sm text-text-tertiary">{formatDataHoraPtBR(r.ocorre_em)}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <AtualizarReuniaoForm reuniaoId={r.id} status={r.status} gravacaoUrl={r.gravacao_url} />
                  <ConfirmDeleteButton
                    action={excluirReuniaoAction}
                    hiddenFields={{ reuniaoId: r.id }}
                    title="Excluir reunião"
                    description={`A reunião "${r.titulo}" será removida da agenda do cliente.`}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
        <AgendarReuniaoForm projectId={project.id} />
      </Card>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Ofertas deste projeto</h2>
        {(ofertasDoProjeto ?? []).length > 0 && (
          <ul className="mb-6 flex flex-col gap-3">
            {(ofertasDoProjeto ?? []).map((oferta) => (
              <li key={oferta.id} className="rounded-md border border-border-subtle p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-text-primary">{oferta.titulo}</span>
                  <Badge tone={OFERTA_STATUS_TONE[oferta.status as keyof typeof OFERTA_STATUS_TONE] ?? "neutral"}>
                    {oferta.status}
                  </Badge>
                </div>
                <p className="mb-2 text-body-sm text-text-secondary">
                  {formatCentavosBRL(oferta.preco_centavos)} · {oferta.impressoes} impressão(ões) · {oferta.cliques} clique(s)
                </p>
                {oferta.status === "em_negociacao" && cobrancaPorOferta.has(oferta.id) && (
                  <div className="mb-2">
                    <SimularWebhookForm chargeId={cobrancaPorOferta.get(oferta.id)!} />
                  </div>
                )}
                {(oferta.status === "disponivel" || oferta.status === "em_negociacao") && (
                  <div className="flex gap-2">
                    <DesbloquearManualButton projectOfferId={oferta.id} />
                    <RemoverOfertaButton projectOfferId={oferta.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <PublicarOfertaForm projectId={project.id} ofertas={catalogoOfertas ?? []} />
      </Card>

      <Card>
        <h2 className="mb-2 text-body-lg font-medium text-text-primary">Zona de risco</h2>
        <p className="mb-4 text-body-sm text-text-secondary">
          Excluir o projeto remove permanentemente todas as {fasesOrdenadas.length} fase(s) e{" "}
          {fasesOrdenadas.reduce((acc, f) => acc + f.tasks.length, 0)} etapa(s) associadas.
        </p>
        <ConfirmDeleteButton
          action={excluirProjetoAction}
          hiddenFields={{ projectId: project.id }}
          title="Excluir projeto"
          description={`O projeto "${project.nome}" e todo o seu conteúdo serão excluídos permanentemente. Essa ação não pode ser desfeita.`}
          triggerLabel="Excluir projeto"
        />
      </Card>
    </div>
  );
}

function SprintResumo({
  fase,
  etapa,
  ctx,
  hoje,
  naFila,
}: {
  fase: { id: string; status: string; criterio_pronto: string | null; descricao: string | null; inicio_previsto: string | null; fim_previsto: string | null; tasks: { status: string; dono: string; bloqueada_por_tier_id: string | null; prazo: string | null }[] };
  etapa: "S0" | "S1" | "S2" | "S3" | "S4";
  ctx: { pagamentoConfirmado: boolean; kickoffMarcado: boolean };
  hoje: string;
  naFila: boolean;
}) {
  const veredito = avaliarCriterioPronto(etapa, fase.tasks, ctx);
  const { objetivo, dependeDoCliente } = separarDescricaoSprint(fase.descricao);
  const statusTone = fase.status === "concluida" ? "done" : fase.status === "em_andamento" ? "progress" : "pending";
  const statusLabel = fase.status === "concluida" ? "Fechada" : fase.status === "em_andamento" ? "Em andamento" : "Pendente";
  const porDono = (dono: string) => fase.tasks.filter((t) => t.dono === dono && !t.bloqueada_por_tier_id);
  const feitas = (lista: { status: string }[]) => lista.filter((t) => t.status === "concluida").length;
  const sabre = porDono("sabre");
  const cliente = porDono("cliente");
  const vencidas = cliente.filter((t) => t.status !== "concluida" && t.prazo && t.prazo < hoje).length;

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-md bg-surface-sunken p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Badge tone={statusTone}>{statusLabel}</Badge>
          {fase.inicio_previsto && fase.fim_previsto && (
            <span className="text-body-sm tabular-nums text-text-tertiary">
              {formatDiaPtBR(fase.inicio_previsto)} a {formatDiaPtBR(fase.fim_previsto)}
            </span>
          )}
        </span>
        <span className="text-body-sm tabular-nums text-text-secondary">
          Sabre {feitas(sabre)}/{sabre.length} · Cliente {feitas(cliente)}/{cliente.length}
          {vencidas > 0 && <span className="text-state-blocked"> · {vencidas} vencida(s)</span>}
        </span>
      </div>
      {objetivo && <p className="text-body-sm text-text-secondary">{objetivo}</p>}
      {dependeDoCliente && <p className="text-body-sm text-text-tertiary">Depende do cliente: {dependeDoCliente}</p>}
      {fase.criterio_pronto && <p className="text-body-sm text-text-primary">Critério de pronto: {fase.criterio_pronto}</p>}
      {fase.status === "em_andamento" && !naFila && (
        <div className="flex flex-col gap-2">
          {!veredito.ok && (
            <ul className="list-disc pl-5 text-body-sm text-state-progress">
              {veredito.pendencias.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <FecharSprintForm faseId={fase.id} pronta={veredito.ok} />
        </div>
      )}
    </div>
  );
}
