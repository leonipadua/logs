import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid}
        className={cn(
          "min-h-28 w-full rounded-sm border bg-surface-raised px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
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
Textarea.displayName = "Textarea";
