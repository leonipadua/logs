"use client";

import { useTransition } from "react";
import { updateProjectStatusAction } from "@/lib/actions/admin-actions";
import type { ProjectStatus } from "@/lib/supabase/types";

const OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "pausado", label: "Pausado" },
];

export function ProjectStatusSelect({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const value = e.target.value as ProjectStatus;
        startTransition(() => {
          updateProjectStatusAction(projectId, value);
        });
      }}
      className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 disabled:opacity-50"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
