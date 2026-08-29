import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";
import { STATUS_CONFIG, type TaskStatus } from "./status-config";
import { cn } from "@/lib/utils/cn";

interface TaskItemProps {
  task: Tables<"tasks">;
  projectSlug: string;
}

export function TaskItem({ task, projectSlug }: TaskItemProps) {
  const status = STATUS_CONFIG[task.status as TaskStatus] ?? STATUS_CONFIG.pendente;
  const Icon = status.icon;

  return (
    <li className="relative pl-7">
      <span
        className={cn(
          "absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full",
          status.corFundo,
        )}
      >
        <Icon size={14} strokeWidth={1.5} className={status.cor} aria-hidden="true" />
      </span>
      <Link
        href={`/app/projetos/${projectSlug}/${task.slug}`}
        className="flex flex-col gap-0.5 rounded-sm py-0.5 hover:underline"
      >
        <span className="text-body text-text-primary">{task.titulo}</span>
        <span className={cn("text-label", status.cor)}>
          {status.label}
          {task.status === "bloqueada" && task.motivo_bloqueio ? ` — ${task.motivo_bloqueio}` : ""}
        </span>
      </Link>
    </li>
  );
}
