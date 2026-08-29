import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

if (typeof window !== "undefined") {
  throw new Error("lib/supabase/admin nunca deve ser importado no cliente.");
}

/**
 * service_role: ignora RLS. Só para Server Actions que exigem a Admin API
 * (criar usuário, gerar link de recuperação) e para webhooks/cron — nunca
 * para leitura/escrita coberta por política de RLS comum.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
