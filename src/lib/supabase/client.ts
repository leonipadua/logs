"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para uso no browser (realtime da área do cliente).
 * Usa a anon key — sujeito a RLS.
 */
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
