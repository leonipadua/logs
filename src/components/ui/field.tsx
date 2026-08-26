import type { ReactNode } from "react";
import { Label } from "./label";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Campo de formulário: rótulo + controle + ajuda/erro por campo (nunca banner genérico). */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-body-sm text-text-tertiary">{hint}</p>
      )}
      {error && (
        <p className="text-body-sm text-state-blocked" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
