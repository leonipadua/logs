import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getProjetoPorSlug } from "@/lib/data/project";
import { computeProgress } from "@/lib/domain/progress";
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

  const todasTasks = fases.flatMap((f) => f.tasks);
  const progresso = computeProgress(todasTasks);

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
      <ProgressHeader nomeProjeto={projeto.nome} progresso={progresso} atualizadoEm={ultimaAtualizacao} />

      {fases.length === 0 ? (
        <EmptyState
          title="Seu projeto está sendo montado"
          description="A Sabre está preparando as primeiras etapas. Você recebe um aviso assim que a timeline estiver pronta."
        />
      ) : (
        <ol className="flex flex-col gap-8" aria-live="polite">
          {fases.map((fase) => (
            <li key={fase.id}>
              <PhaseSection fase={fase} projectSlug={projeto.slug} ativa={fase.id === faseAtivaId} />
            </li>
          ))}
        </ol>
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
