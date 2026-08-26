import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "done" | "progress" | "pending" | "blocked" | "locked" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  done: "bg-state-done-bg text-state-done",
  progress: "bg-state-progress-bg text-state-progress",
  pending: "bg-state-pending-bg text-text-secondary",
  blocked: "bg-state-blocked-bg text-state-blocked",
  locked: "bg-state-locked-bg text-state-locked",
  neutral: "bg-surface-sunken text-text-secondary",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Badge de texto. Nunca é o único sinal de estado — sempre acompanhado de ícone/rótulo. */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-label font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
