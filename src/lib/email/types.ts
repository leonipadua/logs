export interface EnviarEmailInput {
  para: string | string[];
  assunto: string;
  html: string;
  texto: string;
  tag: "M1" | "M2" | "M3" | "M4a" | "M4b" | "M4c" | "M5" | "CONTATO";
  idempotencyKey?: string;
}

export interface EmailProvider {
  enviar(input: EnviarEmailInput): Promise<{ providerMessageId: string }>;
}
