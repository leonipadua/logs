import "server-only";
import { ConsoleEmailProvider } from "./console-provider";
import { ResendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./types";

export type { EnviarEmailInput } from "./types";

/** Seleção por presença de RESEND_API_KEY, com override em EMAIL_PROVIDER (ARCHITECTURE §4.2). */
function getProvider(): EmailProvider {
  const override = process.env.EMAIL_PROVIDER;
  if (override === "console") return new ConsoleEmailProvider();
  if (override === "resend" || process.env.RESEND_API_KEY) return new ResendEmailProvider();
  return new ConsoleEmailProvider();
}

export const emailProvider = getProvider();
