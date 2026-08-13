import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com anon key — respeita RLS. Usado nas leituras públicas
 * da área do cliente (/p/[uuid]).
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Cliente com service_role key — ignora RLS. Usado apenas em Server
 * Actions/rotas do admin, nunca exposto ao browser.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
