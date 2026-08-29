import "server-only";
import type { EmailProvider, EnviarEmailInput } from "./types";

const REMETENTE = process.env.RESEND_FROM_EMAIL ?? "Sabre Logs <logs@sabre.dev>";

/** Chamada direta à API REST do Resend — sem SDK, um único endpoint. */
export class ResendEmailProvider implements EmailProvider {
  async enviar(input: EnviarEmailInput): Promise<{ providerMessageId: string }> {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: [input.para].flat(),
        subject: input.assunto,
        html: input.html,
        text: input.texto,
        tags: [{ name: "tipo", value: input.tag }],
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      throw new Error(`Resend respondeu ${resposta.status}: ${corpo}`);
    }

    const dados = (await resposta.json()) as { id: string };
    return { providerMessageId: dados.id };
  }
}
