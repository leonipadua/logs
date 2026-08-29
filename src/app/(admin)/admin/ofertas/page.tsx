import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCentavosBRL } from "@/lib/format";
import { CriarOfertaForm } from "./oferta-forms";

export const dynamic = "force-dynamic";

export default async function OfertasPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: ofertas } = await supabase.from("offers").select("*").order("titulo");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-display-md text-text-primary">Catálogo de ofertas</h1>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Nova oferta</h2>
        <CriarOfertaForm />
      </Card>

      {!ofertas || ofertas.length === 0 ? (
        <EmptyState title="Nenhuma oferta ainda" description="Crie a primeira capacidade do catálogo acima." />
      ) : (
        <div className="flex flex-col gap-3">
          {ofertas.map((o) => (
            <Card key={o.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{o.titulo}</p>
                  <p className="text-body-sm text-text-tertiary">/{o.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-body-sm text-text-secondary">
                    {formatCentavosBRL(o.preco_padrao_centavos)}
                  </span>
                  {!o.ativa && <Badge tone="blocked">inativa</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
