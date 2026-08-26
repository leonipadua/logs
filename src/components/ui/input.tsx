import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid}
        className={cn(
          "min-h-11 w-full rounded-sm border bg-surface-raised px-3 text-body text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          invalid
            ? "border-state-blocked focus-visible:ring-state-blocked"
            : "border-border-default focus-visible:ring-accent",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
