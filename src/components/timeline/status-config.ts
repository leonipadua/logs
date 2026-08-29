import { Circle, CircleDot, CheckCircle2, CircleSlash2, type LucideIcon } from "lucide-react";

export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "bloqueada";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  cor: string;
  corFundo: string;
}

/** DESIGN_SYSTEM §5.2 — estado nunca comunicado só por cor, sempre ícone + rótulo. */
export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  pendente: { label: "Pendente", icon: Circle, cor: "text-state-pending", corFundo: "bg-state-pending-bg" },
  em_andamento: { label: "Em andamento", icon: CircleDot, cor: "text-state-progress", corFundo: "bg-state-progress-bg" },
  concluida: { label: "Concluída", icon: CheckCircle2, cor: "text-state-done", corFundo: "bg-state-done-bg" },
  bloqueada: { label: "Bloqueada", icon: CircleSlash2, cor: "text-state-blocked", corFundo: "bg-state-blocked-bg" },
};
