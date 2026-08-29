import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NovoProjetoForm } from "./novo-projeto-form";

export const dynamic = "force-dynamic";

export default async function NovoProjetoPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>;
}) {
  await requireAdmin();
  const { organizationId } = await searchParams;
  const supabase = await createClient();
  const { data: organizacoes } = await supabase.from("organizations").select("id, nome").order("nome");

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="font-display text-display-md text-text-primary">Novo projeto</h1>
      <Card>
        <NovoProjetoForm organizacoes={organizacoes ?? []} organizationIdPadrao={organizationId} />
      </Card>
    </div>
  );
}
