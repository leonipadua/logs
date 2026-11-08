import type { ZodError } from "zod";

/** Primeiro erro de cada campo, no formato de FormState.errors. */
export function erroPorCampo(error: ZodError): Record<string, string> {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, v]) => v && v.length > 0)
      .map(([k, v]) => [k, (v as string[])[0]]),
  );
}
