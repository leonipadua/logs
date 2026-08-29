"use client";

import { useActionState } from "react";
import { trocarSenhaAction } from "@/lib/actions/auth-actions";
import { convidarUsuarioAction } from "@/lib/actions/invitation-actions";
import { alternarNotificacaoTaskAction } from "@/lib/actions/profile-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TrocarSenhaVoluntariaForm() {
  const [state, action, pending] = useActionState(trocarSenhaAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nova senha" htmlFor="senha" error={state.errors?.senha} hint="Mínimo de 10 caracteres.">
        <Input id="senha" name="senha" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirmar senha" htmlFor="confirmarSenha" error={state.errors?.confirmarSenha}>
        <Input id="confirmarSenha" name="confirmarSenha" type="password" autoComplete="new-password" required />
      </Field>
      {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}

export function NotificacaoTaskToggle({ ativo }: { ativo: boolean }) {
  const [state, action, pending] = useActionState(alternarNotificacaoTaskAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="ativar" value={(!ativo).toString()} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Salvando…" : ativo ? "Desativar" : "Ativar"}
      </Button>
      <span className="text-body-sm text-text-secondary">
        {ativo ? "Você recebe um email quando etapas são concluídas." : "Notificações de etapas concluídas desativadas."}
      </span>
      {state.message && <span className="text-body-sm text-state-done">{state.message}</span>}
    </form>
  );
}

export function ConvidarMembroForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(convidarUsuarioAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="role" value="member" />
      <div className="flex gap-2">
        <Field label="Nome" htmlFor={`nome-${organizationId}`} error={state.errors?.nome}>
          <Input id={`nome-${organizationId}`} name="nome" required />
        </Field>
        <Field label="Email" htmlFor={`email-${organizationId}`} error={state.errors?.email}>
          <Input id={`email-${organizationId}`} name="email" type="email" required />
        </Field>
      </div>
      {state.message && <p className="text-body-sm text-state-progress">{state.message}</p>}
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? "Convidando…" : "Convidar membro"}
      </Button>
    </form>
  );
}
