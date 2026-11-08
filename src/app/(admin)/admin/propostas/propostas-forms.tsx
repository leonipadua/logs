"use client";

import { useActionState, useState } from "react";
import { marcarPropostaEnviadaAction } from "@/lib/actions/proposal-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Button } from "@/components/ui/button";

export function MarcarEnviadaForm({ proposalId }: { proposalId: string }) {
  const [state, action, pending] = useActionState(marcarPropostaEnviadaAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="proposalId" value={proposalId} />
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Marcando…" : "Marcar como enviada"}</Button>
      {state.message && !state.success && <p className="text-body-sm text-state-blocked" role="alert">{state.message}</p>}
    </form>
  );
}

/** Copia o link público (/p/<token>) usando a origem atual do admin. */
export function CopiarLinkButton({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  async function copiar() {
    const url = `${window.location.origin}/p/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setFalhou(false);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setFalhou(true);
    }
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="secondary" onClick={copiar}>{copiado ? "Link copiado" : "Copiar link"}</Button>
      {falhou && (
        <input
          readOnly
          aria-label="Link da proposta"
          value={`/p/${token}`}
          onFocus={(e) => e.currentTarget.select()}
          className="min-h-11 w-56 rounded-sm border border-border-default bg-surface-raised px-3 text-mono-sm text-text-primary"
        />
      )}
      <span className="sr-only" aria-live="polite">{copiado ? "Link copiado" : ""}</span>
    </div>
  );
}
