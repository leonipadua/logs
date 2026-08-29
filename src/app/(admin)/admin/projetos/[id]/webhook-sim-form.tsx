"use client";

import { useActionState } from "react";
import { simularWebhookAction } from "@/lib/actions/payment-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Button } from "@/components/ui/button";

export function SimularWebhookForm({ chargeId }: { chargeId: string }) {
  const [state, action, pending] = useActionState(simularWebhookAction, INITIAL_FORM_STATE);
  return (
    <form
      action={(formData) => {
        formData.set("origin", window.location.origin);
        return action(formData);
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="chargeId" value={chargeId} />
      <span className="text-body-sm text-text-tertiary">Simular webhook:</span>
      <Button type="submit" name="novoStatus" value="paga" disabled={pending} variant="secondary">
        {pending ? "Enviando…" : "Pagamento confirmado"}
      </Button>
      <Button type="submit" name="novoStatus" value="falhou" disabled={pending} variant="ghost">
        Pagamento falhou
      </Button>
      {state.message && (
        <span className={`text-body-sm ${state.success ? "text-state-done" : "text-state-blocked"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
