import { createAnonClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { ProjectWithPhases, Task } from "@/lib/supabase/types";

export async function getProjectByPublicId(
  publicId: string
): Promise<ProjectWithPhases | null> {
  const supabase = createAnonClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("public_id", publicId)
    .maybeSingle();

  if (projectError || !project) return null;

  const { data: phases, error: phasesError } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", project.id)
    .order("ordem", { ascending: true });

  if (phasesError || !phases) return { ...project, phases: [] };

  const phaseIds = phases.map((p) => p.id);
  let tasks: Task[] = [];

  if (phaseIds.length > 0) {
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .in("phase_id", phaseIds)
      .order("ordem", { ascending: true });
    tasks = tasksData ?? [];
  }

  return {
    ...project,
    phases: phases.map((phase) => ({
      ...phase,
      tasks: tasks.filter((t) => t.phase_id === phase.id),
    })),
  };
}

export function computeProgress(project: ProjectWithPhases): {
  total: number;
  concluidas: number;
  percent: number;
} {
  const allTasks = project.phases.flatMap((p) => p.tasks);
  const total = allTasks.length;
  const concluidas = allTasks.filter((t) => t.status === "concluida").length;
  const percent = total === 0 ? 0 : Math.round((concluidas / total) * 100);
  return { total, concluidas, percent };
}

/** Usado no admin — não filtra por RLS pública. */
export async function listProjectsWithClient() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(nome)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
