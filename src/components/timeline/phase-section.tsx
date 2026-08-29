import type { Tables } from "@/lib/supabase/types";
import { TaskItem } from "./task-item";

interface PhaseSectionProps {
  fase: Tables<"phases"> & { tasks: Tables<"tasks">[] };
  projectSlug: string;
  ativa: boolean;
}

export function PhaseSection({ fase, projectSlug, ativa }: PhaseSectionProps) {
  return (
    <section
      className="relative border-l border-border-subtle pl-4"
      aria-current={ativa ? "step" : undefined}
    >
      <h2 className="mb-3 text-body-lg font-medium text-text-primary">
        {fase.titulo}
        {ativa && (
          <span className="ml-2 align-middle text-label font-medium uppercase text-accent-text">
            Em andamento
          </span>
        )}
      </h2>
      {fase.descricao && <p className="mb-3 text-body-sm text-text-secondary">{fase.descricao}</p>}
      <ol className="flex flex-col gap-3">
        {fase.tasks.map((task) => (
          <TaskItem key={task.id} task={task} projectSlug={projectSlug} />
        ))}
      </ol>
    </section>
  );
}
