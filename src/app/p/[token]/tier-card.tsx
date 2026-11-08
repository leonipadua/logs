import { Check, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCentavosBRL } from "@/lib/format";
import { precoComCondicao, type TierVitrine } from "@/lib/domain/tiers";

interface TierCardProps {
  tier: TierVitrine;
  /** Ajuste (pontos-base) da condição de pagamento escolhida; vem do catálogo. */
  ajusteBps: number;
  /** Com `name`, o cartão vira uma opção de rádio (aceite). Sem, é só leitura. */
  selectable?: { name: string; defaultChecked: boolean; onSelect?: () => void };
  escolhido?: boolean;
}

/** Cartão de tier com ancoragem: o alvo se destaca e o cheio mostra o que os outros bloqueiam. */
export function TierCard({ tier, ajusteBps, selectable, escolhido }: TierCardProps) {
  const preco = precoComCondicao(tier, ajusteBps);
  const corpo = (
    <div
      className={`flex h-full flex-col gap-4 rounded-md border bg-surface-raised p-5 ${
        tier.alvo ? "border-accent" : "border-border-subtle"
      } ${selectable ? "has-[:checked]:ring-2 has-[:checked]:ring-accent" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-display-sm text-text-primary">{tier.nome}</p>
        {tier.alvo && <Badge tone="done">Recomendado para você</Badge>}
        {escolhido && <Badge tone="done">Opção escolhida</Badge>}
      </div>
      {tier.descricao && <p className="text-body-sm text-text-secondary">{tier.descricao.replace(/^Provisório\.\s*/i, "")}</p>}
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-body-sm">
        <dt className="text-text-tertiary">Implementação</dt>
        <dd className="text-right tabular-nums text-text-primary">{formatCentavosBRL(preco.implementacaoCentavos)}</dd>
        <dt className="text-text-tertiary">Mensalidade</dt>
        <dd className="text-right tabular-nums text-text-primary">{formatCentavosBRL(preco.mensalidadeCentavos)}</dd>
      </dl>
      <div>
        <p className="mb-2 text-label font-medium uppercase tracking-[0.02em] text-text-secondary">Incluído</p>
        <ul className="flex flex-col gap-1.5">
          {tier.incluidos.map((m) => (
            <li key={m.id} className="flex items-start gap-2 text-body-sm text-text-primary">
              <Check size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-state-done" aria-hidden="true" />
              <span>
                {m.nome}
                {m.cobreDor && <span className="text-text-tertiary"> · responde a uma dor sua</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {tier.bloqueados.length > 0 && (
        <div className="rounded-sm border border-state-locked/20 bg-state-locked-bg p-3">
          <p className="mb-2 text-label font-medium uppercase tracking-[0.02em] text-state-locked">Não incluído nesta opção</p>
          <ul className="flex flex-col gap-1.5">
            {tier.bloqueados.map((m) => (
              <li key={m.id} className="flex items-start gap-2 text-body-sm text-text-secondary">
                <Lock size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-state-locked" aria-hidden="true" />
                <span>
                  {m.nome}
                  {m.cobreDor && <span className="text-state-locked"> · responde a uma dor sua</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (!selectable) return corpo;
  return (
    <label className="block cursor-pointer rounded-md focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1">
      <input
        type="radio"
        name={selectable.name}
        value={tier.id}
        defaultChecked={selectable.defaultChecked}
        onChange={selectable.onSelect}
        className="sr-only"
        required
      />
      {corpo}
    </label>
  );
}
