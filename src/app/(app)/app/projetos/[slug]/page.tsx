import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getProjetoPorSlug, getReunioesDoProjeto } from "@/lib/data/project";
import { computeProgress } from "@/lib/domain/progress";
import { calcularSistemaConstruido } from "@/lib/domain/sistema-construido";
import { dentroDoEscopo } from "@/lib/domain/sprint";
import { carregarContextoSprint } from "@/lib/projects/contexto";
import { ClockBanner } from "@/components/timeline/clock-banner";
import { PendenciasCliente } from "@/components/timeline/pendencias-cliente";
import { SprintTimeline } from "@/components/timeline/sprint-timeline";
import { TasksBloqueadas } from "@/components/timeline/tasks-bloqueadas";
import { ReunioesETreinamentos } from "@/components/timeline/reunioes";
import { ProgressHeader } from "@/components/timeline/progress-header";
import { PhaseSection } from "@/components/timeline/phase-section";
import { OfferCard } from "@/components/timeline/offer-card";
import { ProjectRealtimeListener } from "@/components/realtime/project-listener";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ProjetoPage({ params }: PageProps<"/app/projetos/[slug]">) {
  await requireUser();
  const { slug } = await params;

  const dados = await getProjetoPorSlug(slug);
  if (!dados) notFound();
  const { projeto, fases, ofertas } = dados;

  // Projeto no padrão Sabre (S0–S4+) tem semana_atual; os legados seguem na timeline original.
  const ehV2 = projeto.semana_atual !== null;
  const fasesSprint = fases.filter((f) => f.etapa !== null);
  const fasesExtras = ehV2 ? fases.filter((f) => f.etapa === null) : fases;

  const todasTasks = fases.flatMap((f) => f.tasks);
  const tasksNoEscopo = dentroDoEscopo(todasTasks);
  const progresso = ehV2
    ? calcularSistemaConstruido(fases.flatMap((f) => f.tasks.map((t) => ({ ...t, etapa: f.etapa }))))
    : computeProgress(tasksNoEscopo);

  const agora = new Date();
  const hoje = agora.toISOString().slice(0, 10);
  const supabase = await createClient();
  const [reunioes, ctx] = await Promise.all([
    ehV2 ? getReunioesDoProjeto(projeto.id) : Promise.resolve([]),
    ehV2 ? carregarContextoSprint(supabase, projeto) : Promise.resolve(null),
  ]);

  const pendencias = fases
    .filter((f) => f.etapa === null || f.status !== "pendente")
    .flatMap((f) =>
      f.tasks
        .filter((t) => t.dono === "cliente" && !t.bloqueada_por_tier_id)
        .map((t) => ({ ...t, faseTitulo: f.titulo })),
    );
  const tasksBloqueadas = todasTasks.filter((t) => t.bloqueada_por_tier_id && t.status === "bloqueada");

  const ultimaAtualizacao = todasTasks.reduce(
    (maisRecente, t) => (t.updated_at > maisRecente ? t.updated_at : maisRecente),
    projeto.updated_at,
  );

  const faseAtivaId =
    fases.find((f) => f.tasks.some((t) => t.status === "em_andamento"))?.id ??
    fases.find((f) => f.tasks.some((t) => t.status !== "concluida"))?.id;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <ProjectRealtimeListener projectId={projeto.id} phaseIds={fases.map((f) => f.id)} />
      <ProgressHeader
        nomeProjeto={projeto.nome}
        progresso={progresso}
        atualizadoEm={ultimaAtualizacao}
        unidade={ehV2 ? "entregas do sistema concluídas" : undefined}
      />

      {ehV2 && (
        <ClockBanner
          relogio={projeto.relogio}
          motivo={projeto.relogio_motivo}
          origem={projeto.relogio_origem}
          pausadoEm={projeto.relogio_pausado_em}
          diasPausados={projeto.relogio_dias_pausados}
          naFila={projeto.na_fila}
          dataInicioPrevista={projeto.data_inicio_prevista}
        />
      )}

      {ehV2 && (
        <PendenciasCliente tasks={pendencias} projectSlug={projeto.slug} hoje={hoje} />
      )}

      {ehV2 && fasesSprint.length > 0 && (
        <SprintTimeline
          fases={fasesSprint}
          projectSlug={projeto.slug}
          aguardandoPagamento={ctx !== null && !ctx.pagamentoConfirmado}
        />
      )}

      {ehV2 && <ReunioesETreinamentos reunioes={reunioes} agora={agora} />}

      {fases.length === 0 ? (
        <EmptyState
          title="Seu projeto está sendo montado"
          description="A Sabre está preparando as primeiras etapas. Você recebe um aviso assim que a timeline estiver pronta."
        />
      ) : fasesExtras.length > 0 ? (
        <ol className="flex flex-col gap-8" aria-live="polite">
          {fasesExtras.map((fase) => (
            <li key={fase.id}>
              <PhaseSection fase={fase} projectSlug={projeto.slug} ativa={fase.id === faseAtivaId} />
            </li>
          ))}
        </ol>
      ) : null}

      {ehV2 && (
        <TasksBloqueadas
          tasks={tasksBloqueadas}
          nomeProjeto={projeto.nome}
          whatsapp={process.env.NEXT_PUBLIC_WHATSAPP_ADMIN}
        />
      )}

      {ofertas.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-dashed border-border-default pt-8">
          <h2 className="text-label uppercase tracking-wide text-text-tertiary">
            Disponível para o seu projeto
          </h2>
          <ul className="flex flex-col gap-4">
            {ofertas.map((oferta) => (
              <OfferCard key={oferta.id} oferta={oferta} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
