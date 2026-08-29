"use client";

import { useActionState } from "react";
import { criarOrganizacaoAction } from "@/lib/actions/organization-actions";
import { reenviarConviteAction, revogarUsuarioAction } from "@/lib/actions/invitation-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CriarOrganizacaoForm() {
  const [state, action, pending] = useActionState(criarOrganizacaoAction, INITIAL_FORM_STATE);
  return (
    <Card>
      <h2 className="font-display text-display-sm text-text-primary">Nova organização</h2>
      <form action={action} className="mt-4 flex flex-col gap-4">
        <Field label="Nome" htmlFor="org-nome" error={state.errors?.nome}>
          <Input id="org-nome" name="nome" required />
        </Field>
        <Field label="Slug" htmlFor="org-slug" error={state.errors?.slug} hint="letras minúsculas, números e hífen">
          <Input id="org-slug" name="slug" required />
        </Field>
        {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
        {state.success && <p className="text-body-sm text-state-done">Organização criada.</p>}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Criando…" : "Criar organização"}
        </Button>
      </form>
    </Card>
  );
}

export function ReenviarConviteButton({ email, organizationId }: { email: string; organizationId: string }) {
  const [state, action, pending] = useActionState(reenviarConviteAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <Button variant="ghost" type="submit" disabled={pending}>
        {pending ? "Reenviando…" : "Reenviar convite"}
      </Button>
      {state.message && <span className="text-body-sm text-state-progress">{state.message}</span>}
    </form>
  );
}

export function RevogarUsuarioButton({ userId, organizationId }: { userId: string; organizationId: string }) {
  const [state, action, pending] = useActionState(revogarUsuarioAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <Button variant="ghost" type="submit" disabled={pending}>
        {pending ? "Revogando…" : "Revogar acesso"}
      </Button>
      {state.message && <span className="text-body-sm text-state-blocked">{state.message}</span>}
    </form>
  );
}
