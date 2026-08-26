import { cn } from "@/lib/utils/cn";

/** Bloco de carregamento com as dimensões exatas do conteúdo final (evita salto de layout). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-surface-sunken", className)}
      style={{ animationDuration: "1.5s" }}
      aria-hidden="true"
    />
  );
}
