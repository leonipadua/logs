import type { EmailProvider, EnviarEmailInput } from "./types";

/**
 * Adaptador de desenvolvimento: imprime no console e não exige nenhuma
 * chave. Formalizado na F6 junto do ResendEmailProvider e do email_log.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async enviar(input: EnviarEmailInput) {
    const id = `console_${Date.now()}`;
    console.log(
      `\n[email:${input.tag}] para=${[input.para].flat().join(", ")}\n` +
        `assunto: ${input.assunto}\n${input.texto}\n`,
    );
    return { providerMessageId: id };
  }
}
