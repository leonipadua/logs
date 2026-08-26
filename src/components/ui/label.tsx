import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-label font-medium uppercase tracking-[0.02em] text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}
