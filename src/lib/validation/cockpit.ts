import { z } from "zod";
import { reaisParaCentavos } from "@/lib/format/currency";
import { ESTAGIOS, TIPOS_SPIN, UNIDADES } from "@/lib/domain/spin";

const textoOpcional = z.string().trim().nullish().or(z.literal(""));

/** Número pt-BR vindo de input texto ("1.200,50"). */
const numeroPtBR = (msg: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v.replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({ code: "custom", message: msg });
        return z.NEVER;
      }
      return n;
    });

const reaisOpcional = (msg: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const c = reaisParaCentavos(v);
      if (c === null || c < 0) {
        ctx.addIssue({ code: "custom", message: msg });
        return z.NEVER;
      }
      return c;
    });

export const criarLeadSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da empresa."),
  segmento: textoOpcional,
  cidade: textoOpcional,
});

export const estagioSchema = z.object({
  organizationId: z.string().uuid(),
  estagio: z.enum(ESTAGIOS, { message: "Estágio inválido." }),
});

export const contatoSchema = z.object({
  organizationId: z.string().uuid(),
  nome: z.string().trim().min(2, "Informe o nome."),
  papel: z.enum(["decisor", "operador", "outro"], { message: "Escolha o papel." }),
  whatsapp: textoOpcional,
  email: z.string().trim().email("E-mail inválido.").or(z.literal("")).nullish(),
});

const respostaBant = z.enum(["sim", "parcial", "nao"]).or(z.literal(""));

export const bantCampos = {
  budgetResposta: respostaBant.nullish(),
  budgetNota: textoOpcional,
  authorityResposta: respostaBant.nullish(),
  authorityNota: textoOpcional,
  needResposta: respostaBant.nullish(),
  needNota: textoOpcional,
  timingResposta: respostaBant.nullish(),
  timingNota: textoOpcional,
};

export const callSchema = z.object({
  organizationId: z.string().uuid(),
  tipo: z.enum(["prospeccao", "diagnostico", "vendas"], { message: "Escolha o tipo da call." }),
  contactId: z.string().uuid().or(z.literal("")).nullish(),
  resultado: z.enum(["avancou", "agendou", "sem_avanco", "sem_resposta", "perdido", "fechado"]).or(z.literal("")).nullish(),
  duracaoMin: z.string().trim().regex(/^\d*$/, "Use minutos inteiros.").nullish(),
  notas: textoOpcional,
});

export const bantSchema = z.object({
  organizationId: z.string().uuid(),
  callId: z.string().uuid("Registre uma call antes de salvar o BANT."),
  ...bantCampos,
});

/**
 * Captura SPIN. Implicação EXIGE valor numérico + unidade (PRD §3.1) — aqui no
 * zod e, de novo, na constraint pain_implicacao_exige_numero do banco.
 */
export const dorSchema = z
  .object({
    organizationId: z.string().uuid(),
    callId: z.string().uuid().or(z.literal("")).nullish(),
    tipoSpin: z.enum(TIPOS_SPIN, { message: "Escolha o tipo SPIN." }),
    categoria: textoOpcional,
    descricao: z.string().trim().min(3, "Descreva a dor."),
    valor: numeroPtBR("Informe um número válido, ex.: 40 ou 1.500,00.").nullish(),
    unidade: z.enum(UNIDADES).or(z.literal("")).nullish(),
  })
  .superRefine((d, ctx) => {
    const temValor = d.valor !== null && d.valor !== undefined;
    const temUnidade = !!d.unidade;
    if (d.tipoSpin === "implicacao") {
      if (!temValor) ctx.addIssue({ code: "custom", path: ["valor"], message: "Implicação exige um número (leads perdidos, ticket, horas)." });
      if (!temUnidade) ctx.addIssue({ code: "custom", path: ["unidade"], message: "Implicação exige a unidade do número." });
    } else if (temValor !== temUnidade) {
      ctx.addIssue({
        code: "custom",
        path: [temValor ? "unidade" : "valor"],
        message: "Informe número e unidade juntos, ou deixe os dois em branco.",
      });
    }
  });

export const excluirDorSchema = z.object({ organizationId: z.string().uuid(), painId: z.string().uuid() });

export const gerarPropostaSchema = z.object({
  organizationId: z.string().uuid(),
  ticketMedio: reaisOpcional("Informe um valor em reais, ex.: 1.500,00."),
  taxaConversaoPct: numeroPtBR("Informe um percentual, ex.: 20.").nullish(),
  custoHora: reaisOpcional("Informe um valor em reais, ex.: 60,00."),
  recuperacaoPct: numeroPtBR("Informe um percentual, ex.: 50.").nullish(),
  horizonteMeses: z.coerce.number().int("Use meses inteiros.").min(1, "Mínimo 1 mês.").max(36, "Máximo 36 meses."),
});

export const marcarEnviadaSchema = z.object({ proposalId: z.string().uuid() });

export const aceiteSchema = z.object({
  token: z.string().trim().min(32).max(128).regex(/^[a-f0-9]+$/, "Link inválido."),
  tierId: z.string().uuid("Escolha uma das opções."),
  condicaoId: z.string().uuid("Escolha a condição de pagamento."),
  aceiteNome: z.string().trim().min(3, "Informe seu nome completo."),
  termos: z
    .string()
    .nullish()
    .transform((v) => v === "on" || v === "true")
    .refine((v) => v, { message: "É preciso aceitar os termos." }),
});
