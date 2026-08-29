import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

async function emailsDeMembros(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  role?: "owner",
): Promise<string[]> {
  let query = admin
    .from("organization_members")
    .select("profiles(email)")
    .eq("organization_id", organizationId)
    .is("revogado_em", null);
  if (role) query = query.eq("role", role);

  const { data } = await query;
  return (data ?? [])
    .map((m) => (Array.isArray(m.profiles) ? m.profiles[0]?.email : m.profiles?.email))
    .filter((email): email is string => !!email);
}

/** M4a/M4b/M4c: owner é quem decide sobre pagamento (PRD E7). */
export function emailsDosOwners(admin: ReturnType<typeof createAdminClient>, organizationId: string) {
  return emailsDeMembros(admin, organizationId, "owner");
}

/** M5: todos os membros ativos (PRD E7). */
export function emailsDosMembros(admin: ReturnType<typeof createAdminClient>, organizationId: string) {
  return emailsDeMembros(admin, organizationId);
}
