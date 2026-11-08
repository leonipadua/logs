import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessao } from "@/lib/auth/session";
import { logEvent } from "@/lib/events";
import { carregarPropostaPublica } from "@/lib/proposals/public";
import { formatCentavosBRL, formatDataPtBR } from "@/lib/format";
import { tierAlvo } from "@/lib/domain/tiers";
import { AceiteForm } from "./aceite-form";
import { TierCard } from "./tier-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proposta Sabre",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Proposta viva (PRD §3.2). Rota server-side por token: leitura e contagem de
 * visualização via funções security definer com service_role. O admin que abre
 * o link (pré-visualização) não conta como visualização do lead.
 */
export default async function PropostaPublicaPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const proposta = await carregarPropostaPublica(token);
  if (!proposta) notFound();

  const sessao = await getSessao();
  if (!sessao?.isAdmin) {
    const { data } = await createAdminClient().rpc("registrar_visualizacao_proposta", { p_token: token });
    const v = data?.[0];
    if (v) {
      await logEvent({
        tipo: "offer.viewed",
        ator: { tipo: "lead" },
        organizationId: v.organization_id,
        entidadeId: v.proposal_id,
        payload: { proposalId: v.proposal_id, viewCount: v.view_count, primeiraVez: v.primeira_vez },
      });
    }
  }

  const aceita = proposta.status === "aceita";
  const alvo = tierAlvo(proposta.vitrine);
  const tierPadraoId = proposta.tierSugeridoId ?? alvo?.id ?? null;
  const tierRoi = proposta.tierEscolhidoId ?? tierPadraoId;
  const roi = tierRoi ? proposta.roiPorTier[tierRoi] : null;
  const premissas = proposta.premissas;
  const condicaoEscolhida = proposta.condicoes.find((c) => c.id === proposta.condicaoEscolhidaId);

  return (
    <div className="min-h-screen bg-surface-base">
      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16">
        <header className="flex max-w-[68ch] flex-col gap-4">
          <p className="text-label uppercase tracking-wide text-text-tertiary">Sabre · Proposta</p>
          <h1 className="font-display text-display-lg text-text-primary">{proposta.titulo ?? `Proposta para ${proposta.organizacaoNome}`}</h1>
          {proposta.narrativa.abertura && <p className="text-body-lg text-text-secondary">{proposta.narrativa.abertura}</p>}
          {proposta.validadeAte && !aceita && (
            <p className="text-body-sm text-text-tertiary tabular-nums">Válida até {formatDataPtBR(`${proposta.validadeAte}T12:00:00`)}</p>
          )}
        </header>

        {aceita && (
          <section aria-labelledby="aceite-h" className="rounded-md border border-border-subtle bg-state-done-bg p-6">
            <h2 id="aceite-h" className="font-display text-display-sm text-state-done">Proposta aceita</h2>
            <p className="mt-2 max-w-[68ch] text-body text-text-primary">
              Aceita em {proposta.aceitaEm ? formatDataPtBR(proposta.aceitaEm) : "—"}
              {condicaoEscolhida ? `, com a condição “${condicaoEscolhida.nome}”` : ""}. A Sabre entra em contato com os próximos
              passos.
            </p>
          </section>
        )}

        {premissas && premissas.custoMensalCentavos > 0 && (
          <section aria-labelledby="custo-h" className="flex flex-col gap-4">
            <h2 id="custo-h" className="font-display text-display-sm text-text-primary">O que isso custa hoje</h2>
            <p className="font-display text-display-md tabular-nums text-text-primary">
              {formatCentavosBRL(premissas.custoMensalCentavos)}
              <span className="ml-2 font-sans text-body text-text-tertiary">por mês, estimado</span>
            </p>
            <details className="max-w-[68ch] text-body-sm text-text-secondary">
              <summary className="min-h-11 cursor-pointer py-2">Como chegamos a esse número</summary>
              <ul className="ml-5 list-disc">
                {proposta.premissasCustoTexto.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </details>
          </section>
        )}

        {proposta.narrativa.itens.length > 0 && (
          <section aria-labelledby="solucao-h" className="flex flex-col gap-6">
            <h2 id="solucao-h" className="font-display text-display-sm text-text-primary">Sua dor, virando sistema</h2>
            <ol className="flex flex-col gap-4">
              {proposta.narrativa.itens.map((i) => (
                <li key={i.moduleId} className="grid gap-4 rounded-md border border-border-subtle bg-surface-raised p-5 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-label font-medium uppercase tracking-[0.02em] text-text-secondary">O que você nos contou</p>
                    <p className="text-body text-text-primary">{i.dor}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-label font-medium uppercase tracking-[0.02em] text-text-secondary">{i.moduloNome}</p>
                    <p className="text-body text-text-primary">{i.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {roi && (
          <section aria-labelledby="roi-h" className="flex flex-col gap-4">
            <h2 id="roi-h" className="font-display text-display-sm text-text-primary">Projeção de retorno</h2>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-body-sm text-text-tertiary">Recuperação estimada por mês</dt>
                <dd className="font-display text-display-sm tabular-nums text-text-primary">{formatCentavosBRL(roi.resultado.ganhoMensalCentavos)}</dd>
              </div>
              <div>
                <dt className="text-body-sm text-text-tertiary">Saldo no horizonte de {premissas?.horizonteMeses} meses</dt>
                <dd className="font-display text-display-sm tabular-nums text-text-primary">{formatCentavosBRL(roi.resultado.saldoHorizonteCentavos)}</dd>
              </div>
              <div>
                <dt className="text-body-sm text-text-tertiary">Retorno da implementação</dt>
                <dd className="font-display text-display-sm tabular-nums text-text-primary">
                  {roi.resultado.paybackMeses ? `em ${roi.resultado.paybackMeses} meses` : "não se paga no horizonte"}
                </dd>
              </div>
            </dl>
            <div className="max-w-[68ch] rounded-md bg-surface-sunken p-4">
              <p className="mb-2 text-label font-medium uppercase tracking-[0.02em] text-text-secondary">Premissas desta projeção</p>
              <ul className="ml-5 list-disc text-body-sm text-text-secondary">
                {roi.premissas.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </section>
        )}

        <section aria-labelledby="tiers-h" className="flex flex-col gap-6">
          {!aceita && <h2 id="tiers-h" className="sr-only">Opções e aceite</h2>}
          {proposta.narrativa.fechamento && <p className="max-w-[68ch] text-body-lg text-text-secondary">{proposta.narrativa.fechamento}</p>}
          {aceita ? (
            <>
              <h2 id="tiers-h" className="font-display text-display-sm text-text-primary">Opção escolhida</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                {proposta.vitrine
                  .filter((t) => t.id === proposta.tierEscolhidoId)
                  .map((t) => (
                    <TierCard key={t.id} tier={t} ajusteBps={condicaoEscolhida?.ajusteBps ?? 0} escolhido />
                  ))}
              </div>
            </>
          ) : proposta.expirada ? (
            <p className="rounded-md border border-border-default bg-state-progress-bg px-4 py-3 text-body text-state-progress" role="note">
              O prazo desta proposta terminou. Fale com a Sabre para renová-la.
            </p>
          ) : proposta.vitrine.length === 0 || proposta.condicoes.length === 0 ? (
            <p className="text-body text-text-secondary">As opções estão sendo atualizadas. Volte em instantes ou fale com a Sabre.</p>
          ) : (
            <AceiteForm token={token} tiers={proposta.vitrine} tierPadraoId={tierPadraoId} condicoes={proposta.condicoes} />
          )}
        </section>
      </main>
    </div>
  );
}
