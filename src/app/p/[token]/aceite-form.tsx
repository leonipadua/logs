"use client";

import { useActionState, useState } from "react";
import { aceitarPropostaAction } from "@/lib/actions/proposal-public-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TierVitrine } from "@/lib/domain/tiers";
import { TierCard } from "./tier-card";

interface Props {
  token: string;
  tiers: TierVitrine[];
  tierPadraoId: string | null;
  condicoes: { id: string; nome: string; descricao: string | null; ajusteBps: number }[];
}

/** Escolha do tier, condição de pagamento (catálogo) e aceite dos termos. Sem campo de preço. */
export function AceiteForm({ token, tiers, tierPadraoId, condicoes }: Props) {
  const [state, action, pending] = useActionState(aceitarPropostaAction, INITIAL_FORM_STATE);
  const [condicaoId, setCondicaoId] = useState(condicoes[0]?.id ?? "");
  const ajuste = condicoes.find((c) => c.id === condicaoId)?.ajusteBps ?? 0;

  if (state.success) {
    return (
      <p className="rounded-md border border-border-subtle bg-state-done-bg px-4 py-3 text-body text-state-done" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="token" value={token} />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-display text-display-sm text-text-primary">Escolha como começar</legend>
        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((t) => (
            <TierCard
              key={t.id}
              tier={t}
              ajusteBps={ajuste}
              selectable={{ name: "tierId", defaultChecked: t.id === tierPadraoId }}
            />
          ))}
        </div>
        {state.errors?.tierId && <p className="text-body-sm text-state-blocked" role="alert">{state.errors.tierId}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-label font-medium uppercase tracking-[0.02em] text-text-secondary">Condição de pagamento</legend>
        {condicoes.map((c) => (
          <label key={c.id} className="flex min-h-11 items-start gap-3 text-body text-text-primary">
            <input
              type="radio"
              name="condicaoId"
              value={c.id}
              checked={condicaoId === c.id}
              onChange={() => setCondicaoId(c.id)}
              className="mt-1 size-4 accent-[var(--accent)]"
              required
            />
            <span>
              {c.nome}
              {c.descricao && <span className="block text-body-sm text-text-tertiary">{c.descricao.replace(/^Provisório\.\s*/i, "")}</span>}
            </span>
          </label>
        ))}
        {state.errors?.condicaoId && <p className="text-body-sm text-state-blocked" role="alert">{state.errors.condicaoId}</p>}
      </fieldset>

      <div className="max-w-md">
        <Field label="Seu nome completo" htmlFor="aceiteNome" error={state.errors?.aceiteNome}>
          <Input id="aceiteNome" name="aceiteNome" autoComplete="name" required invalid={!!state.errors?.aceiteNome} />
        </Field>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex min-h-11 items-start gap-3 text-body text-text-primary">
          <input type="checkbox" name="termos" className="mt-1 size-4 accent-[var(--accent)]" required />
          <span>
            Li e aceito os termos desta proposta: escopo conforme a opção escolhida, vigência mínima de contrato, e pedidos fora
            do escopo tratados como pedido de mudança. Os valores são os do catálogo da Sabre.
          </span>
        </label>
        {state.errors?.termos && <p className="text-body-sm text-state-blocked" role="alert">{state.errors.termos}</p>}
      </div>

      {state.message && <p className="text-body-sm text-state-blocked" role="alert">{state.message}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Registrando aceite…" : "Aceitar proposta"}
      </Button>
    </form>
  );
}
