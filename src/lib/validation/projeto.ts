import { z } from "zod";

const vazioParaNulo = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const pausarRelogioSchema = z.object({
  projectId: z.string().uuid(),
  motivo: z.string().trim().min(5, "Explique o motivo da pausa (mín. 5 caracteres).").max(300),
});

export const retomarRelogioSchema = z.object({ projectId: z.string().uuid() });

export const fecharSprintSchema = z.object({ faseId: z.string().uuid() });

export const donoTaskEnum = z.enum(["sabre", "cliente"]);

export const prazoSchema = z.preprocess(
  vazioParaNulo,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.").nullable(),
);

export const criarReuniaoSchema = z.object({
  projectId: z.string().uuid(),
  tipo: z.enum(["kickoff", "treinamento", "reuniao"]),
  titulo: z.string().trim().min(2, "Informe o título.").max(160),
  ocorreEm: z
    .string()
    .min(1, "Informe a data e hora.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data inválida."),
  duracaoMin: z.preprocess(vazioParaNulo, z.coerce.number().int().min(5).max(600).nullable()),
  linkReuniao: z.preprocess(vazioParaNulo, z.string().trim().url("Link inválido.").nullable()),
});

export const atualizarReuniaoSchema = z.object({
  reuniaoId: z.string().uuid(),
  status: z.enum(["agendada", "realizada", "cancelada"]),
  gravacaoUrl: z.preprocess(vazioParaNulo, z.string().trim().url("Link inválido.").nullable()),
});

export const excluirReuniaoSchema = z.object({ reuniaoId: z.string().uuid() });
