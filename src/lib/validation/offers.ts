import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;
const slugMsg = "Use apenas letras minúsculas, números e hífen.";

const templateFaseSchema = z.object({
  titulo: z.string().min(1),
  tasks: z.array(z.object({ titulo: z.string().min(1) })).default([]),
});

export const criarOfertaSchema = z.object({
  slug: z.string().trim().min(2).regex(slugRegex, slugMsg),
  titulo: z.string().trim().min(2, "Informe o título."),
  insightPadrao: z.string().trim().min(5, "Escreva a copy de insight."),
  descricaoEntrega: z.string().trim().nullish().or(z.literal("")),
  precoPadraoCentavos: z.coerce.number().int().min(0, "Preço não pode ser negativo."),
  prazoEstimadoDias: z.coerce.number().int().min(0).nullish(),
  templateFasesJson: z
    .string()
    .trim()
    .min(2)
    .transform((val, ctx) => {
      try {
        const parsed = JSON.parse(val);
        const result = z.array(templateFaseSchema).safeParse(parsed);
        if (!result.success) {
          ctx.addIssue({ code: "custom", message: "Formato inválido: use um array de {titulo, tasks:[{titulo}]}." });
          return z.NEVER;
        }
        return result.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "JSON inválido." });
        return z.NEVER;
      }
    }),
});

/**
 * Conteúdo que o lead vê na vitrine de indicação. Nenhum campo é obrigatório
 * — a oferta pode existir só para uso interno; a página do admin avisa quando
 * falta o que a vitrine precisa (ver `ofertaProntaParaVitrine`).
 */
export const conteudoPublicoSchema = z.object({
  resumoPublico: z.string().trim().max(200, "Máximo de 200 caracteres.").nullish().or(z.literal("")),
  descricaoPublica: z.string().trim().nullish().or(z.literal("")),
  entregaveisTexto: z.string().nullish().or(z.literal("")),
  paraQuem: z.string().trim().nullish().or(z.literal("")),
  resultadoEsperado: z.string().trim().nullish().or(z.literal("")),
  prazoPublico: z.string().trim().max(60).nullish().or(z.literal("")),
});

export const editarOfertaSchema = z
  .object({
    offerId: z.string().uuid(),
    titulo: z.string().trim().min(2, "Informe o título."),
    insightPadrao: z.string().trim().min(5, "Escreva a copy de insight."),
    descricaoEntrega: z.string().trim().nullish().or(z.literal("")),
    precoPadraoCentavos: z.coerce.number().int().min(0, "Preço não pode ser negativo."),
    prazoEstimadoDias: z.coerce.number().int().min(0).nullish(),
    ativa: z.enum(["0", "1"]),
  })
  .extend(conteudoPublicoSchema.shape);

export const publicarOfertaSchema = z.object({
  projectId: z.string().uuid(),
  offerId: z.string().uuid(),
  slug: z.string().trim().min(2).regex(slugRegex, slugMsg),
  titulo: z.string().trim().min(2),
  insight: z.string().trim().min(5),
  descricaoEntrega: z.string().trim().nullish().or(z.literal("")),
  precoCentavos: z.coerce.number().int().min(0),
  prazoEstimadoDias: z.coerce.number().int().min(0).nullish(),
});

export const removerOfertaSchema = z.object({
  projectOfferId: z.string().uuid(),
});

export const desbloquearManualSchema = z.object({
  projectOfferId: z.string().uuid(),
});

export const iniciarDesbloqueioSchema = z.object({
  projectOfferId: z.string().uuid(),
  metodo: z.enum(["pix", "credito", "debito"]),
});
