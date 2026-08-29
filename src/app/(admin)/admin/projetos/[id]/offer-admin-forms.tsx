"use client";

import { useActionState, useRef } from "react";
import { publicarOfertaAction, removerOfertaAction, desbloquearManualAction } from "@/lib/actions/offer-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OfertaCatalogo {
  id: string;
  slug: string;
  titulo: string;
  insight_padrao: string;
  descricao_entrega: string | null;
  preco_padrao_centavos: number;
  prazo_estimado_dias: number | null;
}

export function PublicarOfertaForm({ projectId, ofertas }: { projectId: string; ofertas: OfertaCatalogo[] }) {
  const [state, action, pending] = useActionState(publicarOfertaAction, INITIAL_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  function preencherPadroes(offerId: string) {
    const oferta = ofertas.find((o) => o.id === offerId);
    if (!oferta || !formRef.current) return;
    const form = formRef.current;
    (form.elements.namedItem("slug") as HTMLInputElement).value = oferta.slug;
    (form.elements.namedItem("titulo") as HTMLInputElement).value = oferta.titulo;
    (form.elements.namedItem("insight") as HTMLTextAreaElement).value = oferta.insight_padrao;
    (form.elements.namedItem("descricaoEntrega") as HTMLInputElement).value = oferta.descricao_entrega ?? "";
    (form.elements.namedItem("precoCentavos") as HTMLInputElement).value = String(oferta.preco_padrao_centavos);
    (form.elements.namedItem("prazoEstimadoDias") as HTMLInputElement).value = String(oferta.prazo_estimado_dias ?? "");
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      <Field label="Oferta do catálogo" htmlFor="offerId">
        <select
          id="offerId"
          name="offerId"
          required
          onChange={(e) => preencherPadroes(e.target.value)}
          className="min-h-11 w-full rounded-sm border border-border-default bg-surface-raised px-3 text-body text-text-primary"
        >
          <option value="">Selecione…</option>
          {ofertas.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug nesta oferta" htmlFor="offer-slug" error={state.errors?.slug}>
          <Input id="offer-slug" name="slug" required />
        </Field>
        <Field label="Título" htmlFor="offer-titulo" error={state.errors?.titulo}>
          <Input id="offer-titulo" name="titulo" required />
        </Field>
        <Field label="Preço para este cliente (centavos)" htmlFor="offer-preco" error={state.errors?.precoCentavos}>
          <Input id="offer-preco" name="precoCentavos" type="number" min={0} required />
        </Field>
        <Field label="Prazo estimado (dias)" htmlFor="offer-prazo" error={state.errors?.prazoEstimadoDias}>
          <Input id="offer-prazo" name="prazoEstimadoDias" type="number" min={0} />
        </Field>
      </div>
      <Field label="Insight (copy específica para este cliente)" htmlFor="offer-insight" error={state.errors?.insight}>
        <textarea
          id="offer-insight"
          name="insight"
          rows={2}
          required
          className="w-full rounded-sm border border-border-default bg-surface-raised p-3 text-body text-text-primary"
        />
      </Field>
      <Field label="O que está incluso" htmlFor="offer-descricao" error={state.errors?.descricaoEntrega}>
        <Input id="offer-descricao" name="descricaoEntrega" />
      </Field>
      {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Publicando…" : "Publicar na vitrine"}
      </Button>
    </form>
  );
}

export function RemoverOfertaButton({ projectOfferId }: { projectOfferId: string }) {
  const [state, action, pending] = useActionState(removerOfertaAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="projectOfferId" value={projectOfferId} />
      <Button variant="ghost" type="submit" disabled={pending}>
        {pending ? "Removendo…" : "Remover"}
      </Button>
      {state.message && <span className="text-body-sm text-state-blocked">{state.message}</span>}
    </form>
  );
}

export function DesbloquearManualButton({ projectOfferId }: { projectOfferId: string }) {
  const [state, action, pending] = useActionState(desbloquearManualAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="projectOfferId" value={projectOfferId} />
      <Button variant="secondary" type="submit" disabled={pending}>
        {pending ? "Desbloqueando…" : "Desbloquear manualmente"}
      </Button>
      {state.message && <span className="text-body-sm text-state-done">{state.message}</span>}
    </form>
  );
}
