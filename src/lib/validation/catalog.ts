import { z } from "zod";
import { reaisParaCentavos } from "@/lib/format/currency";

const slugRegex = /^[a-z0-9-]+$/;
const slugMsg = "Use apenas letras minúsculas, números e hífen.";

/** Checkbox HTML: "on" quando marcado, ausente quando não. */
const checkbox = z
  .string()
  .nullish()
  .transform((v) => v === "on" || v === "true");

const reais = (msg: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const centavos = reaisParaCentavos(v === "" ? "0" : v);
      if (centavos === null || centavos < 0) {
        ctx.addIssue({ code: "custom", message: msg });
        return z.NEVER;
      }
      return centavos;
    });

const textoOpcional = z.string().trim().nullish().or(z.literal(""));

const moduloCampos = {
  slug: z.string().trim().min(2, "Informe o slug.").regex(slugRegex, slugMsg),
  nome: z.string().trim().min(2, "Informe o nome."),
  descricao: textoOpcional,
  precoImplementacao: reais("Informe um valor em reais, ex.: 4.000,00."),
  mensalidade: reais("Informe um valor em reais, ex.: 600,00."),
  horasEstimadas: z.coerce.number().min(0, "Horas não podem ser negativas.").max(9999),
  doresGatilho: z
    .string()
    .trim()
    .nullish()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ativo: checkbox,
  placeholder: checkbox,
};

export const criarModuloSchema = z.object(moduloCampos);
export const editarModuloSchema = z.object({ moduleId: z.string().uuid(), ...moduloCampos });
export const excluirModuloSchema = z.object({ moduleId: z.string().uuid() });

export const editarTierSchema = z.object({
  tierId: z.string().uuid(),
  nome: z.string().trim().min(2, "Informe o nome."),
  descricao: textoOpcional,
  ativo: checkbox,
  placeholder: checkbox,
});

export const composicaoTierSchema = z.object({
  tierId: z.string().uuid(),
  moduleIds: z.array(z.string().uuid()),
});

export const editarCondicaoSchema = z.object({
  conditionId: z.string().uuid(),
  nome: z.string().trim().min(2, "Informe o nome."),
  descricao: textoOpcional,
  // Em %, ex.: -5 = 5% de desconto na implementação (condição de pagamento, PRD §7.3).
  ajustePercentual: z.coerce
    .number()
    .min(-30, "Mínimo -30%.")
    .max(30, "Máximo 30%.")
    .transform((v) => Math.round(v * 100)),
  ativo: checkbox,
  placeholder: checkbox,
});
