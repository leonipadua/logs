import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectByPublicId, computeProgress } from "@/lib/data/project";
import { ProgressHeader } from "@/components/progress-header";
import { PhaseTimeline } from "@/components/phase-timeline";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function ClientProjectPage({ params }: PageProps) {
  const { uuid } = await params;
  const project = await getProjectByPublicId(uuid);

  if (!project) notFound();

  const progress = computeProgress(project);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <RealtimeRefresh />
      <ProgressHeader
        nome={project.nome}
        descricao={project.descricao}
        percent={progress.percent}
        concluidas={progress.concluidas}
        total={progress.total}
        updatedAt={project.updated_at}
      />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <PhaseTimeline phases={project.phases} />
      </main>
    </div>
  );
}
