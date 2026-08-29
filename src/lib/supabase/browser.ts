import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Apenas para Realtime, escopado ao projeto (Client Components). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
