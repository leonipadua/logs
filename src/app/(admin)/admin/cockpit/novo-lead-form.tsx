"use client";

import { useActionState } from "react";
import { criarLeadAction } from "@/lib/actions/cockpit-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function NovoLeadForm() {
  const [state, action, pending] = useActionState(criarLeadAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Empresa" htmlFor="lead-nome" error={state.errors?.nome}>
          <Input id="lead-nome" name="nome" required invalid={!!state.errors?.nome} />
        </Field>
        <Field label="Segmento" htmlFor="lead-segmento" hint="ex.: clínica, imobiliária">
          <Input id="lead-segmento" name="segmento" />
        </Field>
        <Field label="Cidade" htmlFor="lead-cidade">
          <Input id="lead-cidade" name="cidade" />
        </Field>
      </div>
      {state.message && <p className="text-body-sm text-state-blocked" role="alert">{state.message}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Criando…" : "Criar lead e abrir cockpit"}
      </Button>
    </form>
  );
}
