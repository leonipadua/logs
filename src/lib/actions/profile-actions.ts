"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./form-state";

/** Opt-out do M3 (E7) — o único email transacional com preferência do usuário. */
export async function alternarNotificacaoTaskAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireUser();
  const ativar = formData.get("ativar") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ notificar_task_concluida: ativar })
    .eq("id", sessao.userId);
  if (error) return { message: "Não foi possível salvar a preferência." };

  revalidatePath("/app/conta");
  return { success: true, message: ativar ? "Notificações ativadas." : "Notificações desativadas." };
}
