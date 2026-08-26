import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

/** Estado vazio com copy própria por contexto — nunca "Nenhum item encontrado". */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-default px-6 py-12 text-center">
      <h3 className="font-display text-display-sm text-text-primary">{title}</h3>
      <p className="max-w-sm text-body text-text-secondary">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
