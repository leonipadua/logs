import { z } from "zod";

/** `empresa` é o honeypot: campo invisível para humanos, atraente para bots. */
export const contatoSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um email válido."),
  mensagem: z.string().trim().min(10, "Conte um pouco mais — pelo menos 10 caracteres."),
  empresa: z.string().max(0).nullish().or(z.literal("")),
});
