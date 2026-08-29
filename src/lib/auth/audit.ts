import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

interface RegistrarAuditoriaInput {
  actorId: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  antes?: unknown;
  depois?: unknown;
}

/** Toda mutação registra entrada em audit_log (ARCHITECTURE §8). */
export async function registrarAuditoria(input: RegistrarAuditoriaInput) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor_id: input.actorId,
    acao: input.acao,
    entidade: input.entidade,
    entidade_id: input.entidadeId ?? null,
    antes: (input.antes as never) ?? null,
    depois: (input.depois as never) ?? null,
  });
}
