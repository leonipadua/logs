import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ count: totalOrganizacoes }, { count: totalProjetos }, { count: tasksPendentes }] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "em_andamento"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["pendente", "em_andamento"]),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-display-md text-text-primary">Visão geral</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-label uppercase text-text-tertiary">Organizações</p>
          <p className="mt-2 font-display text-display-md tabular-nums text-text-primary">{totalOrganizacoes ?? 0}</p>
        </Card>
        <Card>
          <p className="text-label uppercase text-text-tertiary">Projetos em andamento</p>
          <p className="mt-2 font-display text-display-md tabular-nums text-text-primary">{totalProjetos ?? 0}</p>
        </Card>
        <Card>
          <p className="text-label uppercase text-text-tertiary">Etapas em aberto</p>
          <p className="mt-2 font-display text-display-md tabular-nums text-text-primary">{tasksPendentes ?? 0}</p>
        </Card>
      </div>

      <Card>
        <Link href="/admin/organizacoes" className="text-body-lg font-medium text-accent-text hover:underline">
          Gerenciar organizações e projetos →
        </Link>
      </Card>
    </div>
  );
}
