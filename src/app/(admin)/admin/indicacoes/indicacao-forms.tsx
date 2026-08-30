"use client";

import { useActionState } from "react";
import { criarLinkIndicacaoAction, alternarLinkAction } from "@/lib/actions/indicacao-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OrganizacaoOpcao {
  id: string;
  nome: string;
}

export function CriarLinkForm({ organizacoes }: { organizacoes: OrganizacaoOpcao[] }) {
  const [state, action, pending] = useActionState(criarLinkIndicacaoAction, INITIAL_FORM_STATE);

  if (organizacoes.length === 0) {
    return (
      <p className="text-body-sm text-text-secondary">
        Cadastre uma organização antes de criar um link de indicação.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente que vai indicar" htmlFor="i-org" error={state.errors?.organizationId}>
          <select
            id="i-org"
            name="organizationId"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-sm border border-border-default bg-surface-raised px-3 text-body text-text-primary"
          >
            <option value="" disabled>
              Escolha…
            </option>
            {organizacoes.map((org) => (
              <option key={org.id} value={org.id}>
                {org.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Nome exibido para o indicado"
          htmlFor="i-nome"
          error={state.errors?.nome}
          hint='aparece como "Indicado por ..."'
        >
          <Input id="i-nome" name="nome" required />
        </Field>
      </div>
      {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
      {state.success && <p className="text-body-sm text-state-done">Link criado.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Criando…" : "Criar link"}
      </Button>
    </form>
  );
}

export function AlternarLinkForm({ referralLinkId, ativo }: { referralLinkId: string; ativo: boolean }) {
  const [state, action, pending] = useActionState(alternarLinkAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="referralLinkId" value={referralLinkId} />
      <input type="hidden" name="ativar" value={ativo ? "0" : "1"} />
      <Button variant="secondary" type="submit" disabled={pending}>
        {pending ? "Salvando…" : ativo ? "Desativar link" : "Reativar link"}
      </Button>
      {state.message && <p className="text-body-sm text-text-tertiary">{state.message}</p>}
    </form>
  );
}
