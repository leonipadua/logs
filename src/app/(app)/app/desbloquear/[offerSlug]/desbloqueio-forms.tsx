"use client";

import { useActionState, useEffect, useRef } from "react";
import Image from "next/image";
import { iniciarDesbloqueioAction, registrarImpressaoOfertaAction } from "@/lib/actions/offer-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Button } from "@/components/ui/button";

export function ImpressaoTracker({ projectOfferId }: { projectOfferId: string }) {
  const registrada = useRef(false);
  useEffect(() => {
    if (registrada.current) return;
    registrada.current = true;
    void registrarImpressaoOfertaAction(projectOfferId);
  }, [projectOfferId]);
  return null;
}

export function IniciarDesbloqueioForm({ projectOfferId }: { projectOfferId: string }) {
  const [state, action, pending] = useActionState(iniciarDesbloqueioAction, INITIAL_FORM_STATE);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body text-state-done">{state.message}</p>
        {state.pix && (
          <div className="flex flex-col items-start gap-3 rounded-md border border-border-subtle bg-surface-raised p-4">
            <Image
              src={`data:image/svg+xml;base64,${state.pix.qrcodeBase64}`}
              alt="QR Code Pix"
              width={180}
              height={180}
              unoptimized
            />
            <div className="flex w-full flex-col gap-1">
              <p className="text-label uppercase text-text-tertiary">Pix copia e cola</p>
              <code className="break-all rounded-sm bg-surface-sunken p-2 text-mono-sm text-text-primary">
                {state.pix.payload}
              </code>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="projectOfferId" value={projectOfferId} />
      <p className="text-label uppercase text-text-tertiary">Escolha a forma de pagamento</p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="metodo" value="pix" disabled={pending}>
          Pix
        </Button>
        <Button type="submit" name="metodo" value="credito" variant="secondary" disabled={pending}>
          Cartão de crédito
        </Button>
        <Button type="submit" name="metodo" value="debito" variant="secondary" disabled={pending}>
          Cartão de débito
        </Button>
      </div>
      {state.message && !state.success && <p className="text-body-sm text-state-blocked">{state.message}</p>}
    </form>
  );
}
