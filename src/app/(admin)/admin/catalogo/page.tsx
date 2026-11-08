import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCentavosBRL } from "@/lib/format";
import { somarModulos } from "@/lib/domain/catalog";
import {
  ComposicaoTierForm,
  CriarModuloForm,
  EditarCondicaoForm,
  EditarModuloForm,
  EditarTierForm,
} from "./catalogo-forms";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: modulos }, { data: tiers }, { data: composicao }, { data: condicoes }] = await Promise.all([
    supabase.from("modules").select("*").order("nome"),
    supabase.from("tiers").select("*").order("ordem"),
    supabase.from("tier_modules").select("tier_id, module_id, ordem").order("ordem"),
    supabase.from("payment_conditions").select("*").order("nome"),
  ]);

  const lista = modulos ?? [];
  const porId = new Map(lista.map((m) => [m.id, m]));
  const haProvisorio =
    lista.some((m) => m.placeholder) || (tiers ?? []).some((t) => t.placeholder) || (condicoes ?? []).some((c) => c.placeholder);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-md text-text-primary">Catálogo</h1>
        <p className="max-w-2xl text-body text-text-secondary">
          Única fonte de preço da Sabre. Propostas e contratos derivam daqui — mudar um preço aqui vale para todas as
          propostas ainda não aceitas.
        </p>
      </div>

      {haProvisorio && (
        <div className="rounded-md border border-border-default bg-state-progress-bg px-4 py-3 text-body-sm text-state-progress" role="note">
          Há itens provisórios no catálogo (valores de exemplo). Revise preços e composição e desmarque “Provisório”
          quando estiverem definitivos.
        </div>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="tiers-h">
        <h2 id="tiers-h" className="font-display text-display-sm text-text-primary">Tiers</h2>
        <p className="text-body-sm text-text-tertiary">
          Três tiers com ancoragem: o do meio é o alvo. O preço de cada tier é a soma dos módulos ativos que o compõem.
        </p>
        {!tiers || tiers.length === 0 ? (
          <EmptyState title="Nenhum tier" description="Os três tiers são criados pela migration de fundação." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {tiers.map((t) => {
              const ids = (composicao ?? []).filter((c) => c.tier_id === t.id).map((c) => c.module_id);
              const soma = somarModulos(ids.map((id) => porId.get(id)).filter((m) => m !== undefined));
              return (
                <Card key={t.id} className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-display-sm text-text-primary">{t.nome}</p>
                    {t.alvo && <Badge tone="progress">Tier alvo</Badge>}
                    {t.placeholder && <Badge tone="pending">Provisório</Badge>}
                    {!t.ativo && <Badge tone="blocked">Inativo</Badge>}
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-body-sm">
                    <dt className="text-text-tertiary">Implementação</dt>
                    <dd className="text-right tabular-nums text-text-primary">{formatCentavosBRL(soma.implementacaoCentavos)}</dd>
                    <dt className="text-text-tertiary">Mensalidade</dt>
                    <dd className="text-right tabular-nums text-text-primary">{formatCentavosBRL(soma.mensalidadeCentavos)}</dd>
                    <dt className="text-text-tertiary">Horas estimadas</dt>
                    <dd className="text-right tabular-nums text-text-primary">{soma.horas}</dd>
                  </dl>
                  <EditarTierForm
                    tier={{ id: t.id, nome: t.nome, descricao: t.descricao, ativo: t.ativo, placeholder: t.placeholder, moduleIds: ids }}
                  />
                  <ComposicaoTierForm
                    tierId={t.id}
                    modulos={lista.map((m) => ({ id: m.id, nome: m.nome, ativo: m.ativo }))}
                    selecionados={ids}
                  />
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="modulos-h">
        <h2 id="modulos-h" className="font-display text-display-sm text-text-primary">Módulos</h2>
        <Card>
          <h3 className="mb-4 text-body-lg font-medium text-text-primary">Novo módulo</h3>
          <CriarModuloForm />
        </Card>
        {lista.length === 0 ? (
          <EmptyState title="Nenhum módulo ainda" description="Crie o primeiro módulo do catálogo acima." />
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map((m) => (
              <Card key={m.id} className="p-0">
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium text-text-primary">{m.nome}</p>
                      <p className="text-body-sm text-text-tertiary">/{m.slug}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-body-sm">
                      <span className="tabular-nums text-text-secondary">
                        {formatCentavosBRL(m.preco_implementacao_centavos)} + {formatCentavosBRL(m.mensalidade_centavos)}/mês
                      </span>
                      <span className="tabular-nums text-text-tertiary">{m.horas_estimadas} h</span>
                      {m.placeholder && <Badge tone="pending">Provisório</Badge>}
                      {!m.ativo && <Badge tone="blocked">Inativo</Badge>}
                    </div>
                  </summary>
                  <div className="border-t border-border-subtle p-4">
                    <EditarModuloForm modulo={m} />
                  </div>
                </details>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="cond-h">
        <h2 id="cond-h" className="font-display text-display-sm text-text-primary">Condições de pagamento</h2>
        <p className="text-body-sm text-text-tertiary">
          A única alavanca de preço permitida (PRD §7.3). Definida aqui, nunca por proposta.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {(condicoes ?? []).map((c) => (
            <Card key={c.id}>
              <div className="mb-4 flex items-center gap-2">
                <p className="font-medium text-text-primary">{c.nome}</p>
                {c.placeholder && <Badge tone="pending">Provisória</Badge>}
              </div>
              <EditarCondicaoForm condicao={c} />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
