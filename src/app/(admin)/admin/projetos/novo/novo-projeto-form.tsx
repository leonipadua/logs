"use client";

import { useActionState } from "react";
import { criarProjetoAction } from "@/lib/actions/project-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NovoProjetoForm({
  organizacoes,
  organizationIdPadrao,
}: {
  organizacoes: { id: string; nome: string }[];
  organizationIdPadrao?: string;
}) {
  const [state, action, pending] = useActionState(criarProjetoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Organização" htmlFor="organizationId" error={state.errors?.organizationId}>
        <select
          id="organizationId"
          name="organizationId"
          required
          defaultValue={organizationIdPadrao ?? ""}
          className="min-h-11 w-full rounded-sm border border-border-default bg-surface-raised px-3 text-body text-text-primary"
        >
          <option value="">Selecione…</option>
          {organizacoes.map((org) => (
            <option key={org.id} value={org.id}>
              {org.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nome do projeto" htmlFor="nome" error={state.errors?.nome}>
        <Input id="nome" name="nome" required />
      </Field>
      <Field label="Slug" htmlFor="slug" error={state.errors?.slug} hint="letras minúsculas, números e hífen — vira a URL do cliente">
        <Input id="slug" name="slug" required />
      </Field>
      <Field label="Descrição" htmlFor="descricao" error={state.errors?.descricao}>
        <Input id="descricao" name="descricao" />
      </Field>
      <Field label="Previsão de entrega" htmlFor="previsaoEntrega" error={state.errors?.previsaoEntrega}>
        <Input id="previsaoEntrega" name="previsaoEntrega" type="date" />
      </Field>
      {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Criando…" : "Criar projeto"}
      </Button>
    </form>
  );
}
