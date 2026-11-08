import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { carregarCapacidade, carregarSettings } from "@/lib/data/settings";
import { ConfiguracoesForm } from "./configuracoes-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [valores, capacidade] = await Promise.all([carregarSettings(supabase), carregarCapacidade(supabase)]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-md text-text-primary">Configurações</h1>
        <p className="max-w-2xl text-body text-text-secondary">
          Parâmetros do Logs. Questões em aberto do PRD ficam aqui, não fixas no código.
        </p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-label uppercase text-text-tertiary">Capacidade agora</p>
          <p className="mt-2 font-display text-display-md tabular-nums text-text-primary">
            {capacidade.ocupados} / {capacidade.max}
          </p>
          <p className="text-body-sm text-text-secondary">projetos em S0–S3 fora da fila</p>
        </div>
        {capacidade.cheia ? (
          <Badge tone="blocked">Cheia: o próximo aceite entra na fila</Badge>
        ) : (
          <Badge tone="done">{capacidade.livre} vaga(s) livre(s)</Badge>
        )}
      </Card>

      <Card>
        <ConfiguracoesForm valores={valores} />
      </Card>
    </div>
  );
}
