export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "bloqueada";
export type ProjectStatus = "em_andamento" | "concluido" | "pausado";

export interface Client {
  id: string;
  nome: string;
  slug: string;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  nome: string;
  descricao: string | null;
  public_id: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  project_id: string;
  titulo: string;
  ordem: number;
}

export interface Task {
  id: string;
  phase_id: string;
  titulo: string;
  descricao: string | null;
  status: TaskStatus;
  ordem: number;
  updated_at: string;
}

export interface PhaseWithTasks extends Phase {
  tasks: Task[];
}

export interface ProjectWithPhases extends Project {
  phases: PhaseWithTasks[];
}
