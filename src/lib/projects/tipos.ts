import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Admin = SupabaseClient<Database>;

export type ResultadoAcao<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; erro: string; pendencias?: string[] };
