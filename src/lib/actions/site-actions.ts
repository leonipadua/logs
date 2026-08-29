"use server";

import { headers } from "next/headers";
import { verificarLimite } from "@/lib/rate-limit";
import { enviarEmailComLog } from "@/lib/email/send-and-log";
import { templateContato } from "@/lib/email/templates";
import { contatoSchema } from "@/lib/validation/site";
import type { FormState } from "./form-state";

async function ipDoRequisitante(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
}

export async function contatoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contatoSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    mensagem: formData.get("mensagem"),
    empresa: formData.get("empresa"),
  });
  if (!parsed.success) {
    const errosVisiveis = { ...parsed.error.flatten().fieldErrors };
    delete errosVisiveis.empresa;
    return { errors: errosVisiveis as Record<string, string> };
  }

  // Honeypot preenchido: finge sucesso sem enviar nada.
  if (parsed.data.empresa) {
    return { success: true, message: "Mensagem enviada. Responderemos em breve." };
  }

  const ip = await ipDoRequisitante();
  const [porEmail, porIp] = await Promise.all([
    verificarLimite({ chave: `contato:email:${parsed.data.email}`, limite: 3, janelaSegundos: 3600 }),
    verificarLimite({ chave: `contato:ip:${ip}`, limite: 10, janelaSegundos: 3600 }),
  ]);
  if (porEmail.excedido || porIp.excedido) {
    return { message: "Muitas mensagens em pouco tempo. Aguarde um pouco e tente de novo." };
  }

  const destino = process.env.EMAIL_CONTATO_DESTINO ?? "contato@sabre.dev";
  const { assunto, html, texto } = templateContato(parsed.data);
  await enviarEmailComLog({ para: destino, assunto, html, texto, tag: "CONTATO" });

  return { success: true, message: "Mensagem enviada. Responderemos em breve." };
}
