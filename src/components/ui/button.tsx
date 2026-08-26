import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-text-inverse hover:bg-accent-hover disabled:bg-border-default disabled:text-text-tertiary",
  secondary:
    "border border-border-default text-text-primary hover:border-border-strong disabled:border-border-subtle disabled:text-text-tertiary",
  ghost: "text-text-secondary hover:text-text-primary disabled:text-text-tertiary",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-body font-medium transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
