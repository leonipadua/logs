import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  senha: z.string().min(1, "Informe sua senha."),
});

export const trocarSenhaSchema = z
  .object({
    senha: z.string().min(10, "A senha precisa de pelo menos 10 caracteres."),
    confirmarSenha: z.string(),
  })
  .refine((v) => v.senha === v.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export const recuperarSenhaSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
});

export const redefinirSenhaSchema = z
  .object({
    tokenHash: z.string().min(1),
    senha: z.string().min(10, "A senha precisa de pelo menos 10 caracteres."),
    confirmarSenha: z.string(),
  })
  .refine((v) => v.senha === v.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export const convidarUsuarioSchema = z.object({
  organizationId: z.string().uuid("Organização inválida."),
  nome: z.string().trim().min(2, "Informe o nome."),
  email: z.string().trim().email("Informe um email válido."),
  role: z.enum(["owner", "member"]).default("member"),
});

export const criarOrganizacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da organização."),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
});
