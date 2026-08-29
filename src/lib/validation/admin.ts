import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;
const slugMsg = "Use apenas letras minúsculas, números e hífen.";

export const editarOrganizacaoSchema = z.object({
  organizationId: z.string().uuid(),
  nome: z.string().trim().min(2, "Informe o nome."),
  slug: z.string().trim().min(2).regex(slugRegex, slugMsg),
  documento: z.string().trim().nullish().or(z.literal("")),
  telefone: z.string().trim().nullish().or(z.literal("")),
  emailFaturamento: z.string().trim().email("Email inválido.").nullish().or(z.literal("")),
});

export const projectStatusEnum = z.enum(["em_andamento", "concluido", "pausado", "arquivado"]);

export const criarProjetoSchema = z.object({
  organizationId: z.string().uuid("Selecione uma organização."),
  nome: z.string().trim().min(2, "Informe o nome do projeto."),
  slug: z.string().trim().min(2).regex(slugRegex, slugMsg),
  descricao: z.string().trim().nullish().or(z.literal("")),
  previsaoEntrega: z.string().trim().nullish().or(z.literal("")),
});

export const editarProjetoSchema = z.object({
  projectId: z.string().uuid(),
  nome: z.string().trim().min(2, "Informe o nome do projeto."),
  slug: z.string().trim().min(2).regex(slugRegex, slugMsg),
  descricao: z.string().trim().nullish().or(z.literal("")),
  status: projectStatusEnum,
  previsaoEntrega: z.string().trim().nullish().or(z.literal("")),
});

export const criarFaseSchema = z.object({
  projectId: z.string().uuid(),
  titulo: z.string().trim().min(2, "Informe o título da fase."),
  descricao: z.string().trim().nullish().or(z.literal("")),
  ordem: z.coerce.number().int().default(0),
});

export const editarFaseSchema = z.object({
  faseId: z.string().uuid(),
  titulo: z.string().trim().min(2, "Informe o título da fase."),
  descricao: z.string().trim().nullish().or(z.literal("")),
  ordem: z.coerce.number().int(),
});

export const taskStatusEnum = z.enum(["pendente", "em_andamento", "concluida", "bloqueada"]);

export const criarTaskSchema = z.object({
  faseId: z.string().uuid(),
  titulo: z.string().trim().min(2, "Informe o título da etapa."),
  slug: z.string().trim().min(2).regex(slugRegex, slugMsg),
  descricao: z.string().trim().nullish().or(z.literal("")),
  ordem: z.coerce.number().int().default(0),
});

export const editarTaskSchema = z.object({
  taskId: z.string().uuid(),
  titulo: z.string().trim().min(2, "Informe o título da etapa."),
  descricao: z.string().trim().nullish().or(z.literal("")),
  ordem: z.coerce.number().int(),
  status: taskStatusEnum,
  motivoBloqueio: z.string().trim().nullish().or(z.literal("")),
});

export const mudarStatusTaskSchema = z.object({
  taskId: z.string().uuid(),
  status: taskStatusEnum,
  motivoBloqueio: z.string().trim().nullish().or(z.literal("")),
});
