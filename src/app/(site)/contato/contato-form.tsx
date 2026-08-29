"use client";

import { useActionState } from "react";
import { contatoAction } from "@/lib/actions/site-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ContatoForm() {
  const [state, action, pending] = useActionState(contatoAction, INITIAL_FORM_STATE);

  if (state.success) {
    return (
      <p className="rounded-sm border border-border-subtle bg-surface-raised p-4 text-body text-text-primary">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.message && (
        <p className="text-body-sm text-state-blocked" role="alert">
          {state.message}
        </p>
      )}

      <Field label="Nome" htmlFor="nome" error={state.errors?.nome}>
        <Input id="nome" name="nome" autoComplete="name" required />
      </Field>

      <Field label="Email" htmlFor="email" error={state.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Mensagem" htmlFor="mensagem" error={state.errors?.mensagem}>
        <Textarea id="mensagem" name="mensagem" required />
      </Field>

      {/* Honeypot: invisível para humanos, atraente para bots de spam. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="empresa">Não preencher</label>
        <input id="empresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar mensagem"}
      </Button>
    </form>
  );
}
