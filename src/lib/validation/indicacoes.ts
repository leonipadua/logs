import { z } from "zod";

export const criarLinkIndicacaoSchema = z.object({
  organizationId: z.string().uuid("Escolha a organização."),
  nome: z.string().trim().min(2, "Informe o nome que o indicado vai ver."),
});

export const alternarOfertaVitrineSchema = z.object({
  referralLinkId: z.string().uuid(),
  offerId: z.string().uuid(),
  /** "1" quando a oferta deve passar a aparecer na vitrine. */
  selecionar: z.enum(["0", "1"]),
});

export const reordenarOfertaVitrineSchema = z.object({
  referralLinkId: z.string().uuid(),
  offerId: z.string().uuid(),
  ordem: z.coerce.number().int().min(0, "A ordem não pode ser negativa."),
});

export const alternarLinkSchema = z.object({
  referralLinkId: z.string().uuid(),
  ativar: z.enum(["0", "1"]),
});

export const excluirLinkSchema = z.object({
  referralLinkId: z.string().uuid(),
});
