import type { PhaseWithTasks } from "@/lib/supabase/types";
import { StatusBadge } from "@/components/status-badge";

function isPhaseComplete(phase: PhaseWithTasks) {
  return phase.tasks.length > 0 && phase.tasks.every((t) => t.status === "concluida");
}

export function PhaseTimeline({ phases }: { phases: PhaseWithTasks[] }) {
  if (phases.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Nenhuma fase cadastrada ainda.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-zinc-800 pl-6">
      {phases.map((phase) => {
        const complete = isPhaseComplete(phase);
        return (
          <li key={phase.id} className="mb-10 last:mb-0">
            <span
              className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                complete
                  ? "border-emerald-400 bg-emerald-400"
                  : "border-zinc-700 bg-zinc-950"
              }`}
            />
            <h2 className="text-lg font-semibold text-zinc-100">
              {phase.titulo}
            </h2>

            <ul className="mt-3 space-y-2">
              {phase.tasks.length === 0 && (
                <li className="text-sm text-zinc-600">Sem tarefas nesta fase.</li>
              )}
              {phase.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {task.titulo}
                    </p>
                    {task.descricao && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {task.descricao}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={task.status} />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
