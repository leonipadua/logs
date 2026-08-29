import "server-only";
import { emailProvider } from "./index";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EnviarEmailInput } from "./types";

/**
 * ARCHITECTURE §4.2 — falha de email nunca aborta a transação de negócio.
 * Chamar sempre depois do commit da mutação principal; nunca faz `throw`.
 */
export async function enviarEmailComLog(
  input: EnviarEmailInput,
  organizationId?: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const destinatarios = [input.para].flat();

  try {
    const { providerMessageId } = await emailProvider.enviar(input);
    await admin.from("email_log").insert(
      destinatarios.map((destinatario) => ({
        tag: input.tag,
        destinatario,
        assunto: input.assunto,
        organization_id: organizationId ?? null,
        status: "enviado" as const,
        provider_message_id: providerMessageId,
      })),
    );
  } catch (erro) {
    await admin.from("email_log").insert(
      destinatarios.map((destinatario) => ({
        tag: input.tag,
        destinatario,
        assunto: input.assunto,
        organization_id: organizationId ?? null,
        status: "falhou" as const,
        erro: erro instanceof Error ? erro.message : String(erro),
      })),
    );
  }
}
