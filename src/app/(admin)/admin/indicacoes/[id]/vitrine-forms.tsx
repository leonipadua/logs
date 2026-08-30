"use client";

import { useActionState } from "react";
import {
  alternarOfertaVitrineAction,
  reordenarOfertaVitrineAction,
} from "@/lib/actions/indicacao-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** O toggle de cada card: entra ou sai da vitrine deste link. */
export function AlternarOfertaForm({
  referralLinkId,
  offerId,
  selecionada,
}: {
  referralLinkId: string;
  offerId: string;
  selecionada: boolean;
}) {
  const [state, action, pending] = useActionState(alternarOfertaVitrineAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="referralLinkId" value={referralLinkId} />
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="selecionar" value={selecionada ? "0" : "1"} />
      <Button variant={selecionada ? "ghost" : "secondary"} type="submit" disabled={pending}>
        {pending ? "Salvando…" : selecionada ? "Remover da vitrine" : "Adicionar à vitrine"}
      </Button>
      {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
    </form>
  );
}

/** Ordem de exibição: menor primeiro. Salva ao sair do campo. */
export function OrdemForm({
  referralLinkId,
  offerId,
  ordem,
}: {
  referralLinkId: string;
  offerId: string;
  ordem: number;
}) {
  const [state, action, pending] = useActionState(reordenarOfertaVitrineAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="referralLinkId" value={referralLinkId} />
      <input type="hidden" name="offerId" value={offerId} />
      <label htmlFor={`ordem-${offerId}`} className="text-body-sm text-text-tertiary">
        Ordem
      </label>
      <Input
        id={`ordem-${offerId}`}
        name="ordem"
        type="number"
        min={0}
        defaultValue={ordem}
        aria-invalid={state.errors?.ordem ? true : undefined}
        className="w-16"
      />
      <Button variant="ghost" type="submit" disabled={pending}>
        {pending ? "…" : "OK"}
      </Button>
    </form>
  );
}
