import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  createPhaseAction,
  createTaskAction,
  deletePhaseAction,
  deleteProjectAction,
  deleteTaskAction,
} from "@/lib/actions/admin-actions";
import { ProjectStatusSelect } from "@/components/admin/project-status-select";
import { TaskStatusSelect } from "@/components/admin/task-status-select";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import type { Phase, Task } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProjectDetail(id: string) {
  const supabase = createServiceRoleClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(nome)")
    .eq("id", id)
    .maybeSingle();

  if (!project) return null;

  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", id)
    .order("ordem", { ascending: true });

  const phaseIds = (phases ?? []).map((p: Phase) => p.id);
  let tasks: Task[] = [];
  if (phaseIds.length > 0) {
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .in("phase_id", phaseIds)
      .order("ordem", { ascending: true });
    tasks = tasksData ?? [];
  }

  return { project, phases: phases ?? [], tasks };
}

export default async function AdminProjectPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, phases, tasks } = detail;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Projetos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{project.nome}</h1>
            <p className="text-xs text-zinc-500">
              {(project as { clients?: { nome?: string } }).clients?.nome}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProjectStatusSelect projectId={project.id} status={project.status} />
            <CopyLinkButton publicId={project.public_id} />
            <form action={deleteProjectAction.bind(null, project.id)}>
              <button className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950">
                Excluir projeto
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        {phases.map((phase: Phase) => {
          const phaseTasks = tasks.filter((t) => t.phase_id === phase.id);
          return (
            <section
              key={phase.id}
              className="rounded-lg border border-zinc-800 p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{phase.titulo}</h2>
                <form action={deletePhaseAction.bind(null, phase.id, project.id)}>
                  <button className="text-xs text-zinc-600 hover:text-red-400">
                    remover fase
                  </button>
                </form>
              </div>

              <ul className="mt-3 space-y-2">
                {phaseTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-zinc-900/50 px-3 py-2"
                  >
                    <span className="text-sm">{task.titulo}</span>
                    <div className="flex items-center gap-2">
                      <TaskStatusSelect
                        taskId={task.id}
                        projectId={project.id}
                        status={task.status}
                      />
                      <form action={deleteTaskAction.bind(null, task.id, project.id)}>
                        <button className="text-xs text-zinc-600 hover:text-red-400">
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>

              <form
                action={createTaskAction}
                className="mt-3 flex flex-wrap gap-2"
              >
                <input type="hidden" name="phase_id" value={phase.id} />
                <input type="hidden" name="project_id" value={project.id} />
                <input
                  name="titulo"
                  placeholder="Nova tarefa"
                  required
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
                />
                <input
                  name="ordem"
                  type="number"
                  defaultValue={phaseTasks.length}
                  className="w-16 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
                />
                <button className="rounded-md bg-zinc-800 px-3 py-1 text-xs hover:bg-zinc-700">
                  Adicionar
                </button>
              </form>
            </section>
          );
        })}

        <form
          action={createPhaseAction}
          className="flex flex-wrap gap-2 rounded-lg border border-dashed border-zinc-800 p-4"
        >
          <input type="hidden" name="project_id" value={project.id} />
          <input
            name="titulo"
            placeholder="Nome da nova fase"
            required
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
          />
          <input
            name="ordem"
            type="number"
            defaultValue={phases.length}
            className="w-20 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
          />
          <button className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400">
            Adicionar fase
          </button>
        </form>
      </main>
    </div>
  );
}
