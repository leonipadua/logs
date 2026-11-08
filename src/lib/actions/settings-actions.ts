"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTING_DEFS, validarSetting } from "@/lib/domain/settings";
import type { FormState } from "./form-state";

export async function salvarConfiguracoesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessao = await requireAdmin();

  const errors: Record<string, string> = {};
  const valores: Record<string, number> = {};
  for (const def of SETTING_DEFS) {
    const r = validarSetting(def, formData.get(def.chave));
    if (r.ok) valores[def.chave] = r.valor;
    else errors[def.chave] = r.erro;
  }
  if (Object.keys(errors).length > 0) return { errors };

  const admin = createAdminClient();
  const { error } = await admin.from("settings").upsert(
    SETTING_DEFS.map((def) => ({ chave: def.chave, valor: valores[def.chave], updated_by: sessao.userId })),
    { onConflict: "chave" },
  );
  if (error) return { message: "Não foi possível salvar as configurações." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "salvar_configuracoes",
    entidade: "settings",
    depois: valores,
  });
  revalidatePath("/admin/configuracoes");
  return { success: true, message: "Configurações salvas." };
}
