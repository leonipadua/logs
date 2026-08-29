import { z } from "zod";

export const simularWebhookSchema = z.object({
  chargeId: z.string().uuid(),
  novoStatus: z.enum(["paga", "falhou", "vencida"]),
});

export const definirAssinaturaSchema = z.object({
  organizationId: z.string().uuid(),
  valorCentavos: z.coerce.number().int().min(0),
  diaVencimento: z.coerce.number().int().min(1).max(28),
});
