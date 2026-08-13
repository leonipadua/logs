import type { TaskStatus } from "@/lib/supabase/types";

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: string; className: string }
> = {
  pendente: {
    label: "Pendente",
    icon: "○",
    className: "bg-zinc-800 text-zinc-400 border-zinc-700",
  },
  em_andamento: {
    label: "Em andamento",
    icon: "◐",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  concluida: {
    label: "Concluída",
    icon: "✓",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  bloqueada: {
    label: "Bloqueada",
    icon: "✕",
    className: "bg-red-500/10 text-red-400 border-red-500/30",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
