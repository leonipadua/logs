"use client";

import { useActionState } from "react";
import { criarOfertaAction } from "@/lib/actions/offer-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TEMPLATE_EXEMPLO = `[
  { "titulo": "Vendas automatizadas por WhatsApp", "tasks": [
    { "titulo": "Configurar número comercial" },
    { "titulo": "Montar fluxo de atendimento" }
  ] }
]`;

export function CriarOfertaForm() {
  const [state, action, pending] = useActionState(criarOfertaAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" htmlFor="o-slug" error={state.errors?.slug}>
          <Input id="o-slug" name="slug" required />
        </Field>
        <Field label="Título" htmlFor="o-titulo" error={state.errors?.titulo}>
          <Input id="o-titulo" name="titulo" required />
        </Field>
        <Field label="Preço padrão (centavos)" htmlFor="o-preco" error={state.errors?.precoPadraoCentavos}>
          <Input id="o-preco" name="precoPadraoCentavos" type="number" min={0} required />
        </Field>
        <Field label="Prazo estimado (dias)" htmlFor="o-prazo" error={state.errors?.prazoEstimadoDias}>
          <Input id="o-prazo" name="prazoEstimadoDias" type="number" min={0} />
        </Field>
      </div>
      <Field label="Insight padrão" htmlFor="o-insight" error={state.errors?.insightPadrao} hint="a frase de desejo que aparece na vitrine">
        <Input id="o-insight" name="insightPadrao" required />
      </Field>
      <Field label="O que está incluso" htmlFor="o-descricao" error={state.errors?.descricaoEntrega}>
        <Input id="o-descricao" name="descricaoEntrega" />
      </Field>
      <Field
        label="Fases e etapas materializadas ao desbloquear (JSON)"
        htmlFor="o-template"
        error={state.errors?.templateFasesJson}
        hint="array de {titulo, tasks:[{titulo}]}"
      >
        <textarea
          id="o-template"
          name="templateFasesJson"
          rows={6}
          defaultValue={TEMPLATE_EXEMPLO}
          className="w-full rounded-sm border border-border-default bg-surface-raised p-3 font-mono text-mono-sm text-text-primary"
        />
      </Field>
      {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
      {state.success && <p className="text-body-sm text-state-done">Oferta criada.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Criando…" : "Criar oferta"}
      </Button>
    </form>
  );
}
