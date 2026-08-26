import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Card estático: borda 1px, sem sombra (DESIGN_SYSTEM §4 — sombra só em sobreposição real). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-border-subtle bg-surface-raised p-6",
        className,
      )}
      {...props}
    />
  );
}
