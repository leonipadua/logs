"use client";

import { useActionState } from "react";
import { redefinirSenhaAction } from "@/lib/actions/auth-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RedefinirSenhaForm({ tokenHash }: { tokenHash: string }) {
  const [state, action, pending] = useActionState(redefinirSenhaAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="font-display text-display-sm text-text-primary">Nova senha</h1>
      <input type="hidden" name="tokenHash" value={tokenHash} />

      <Field label="Nova senha" htmlFor="senha" error={state.errors?.senha} hint="Mínimo de 10 caracteres.">
        <Input id="senha" name="senha" type="password" autoComplete="new-password" required />
      </Field>

      <Field label="Confirmar senha" htmlFor="confirmarSenha" error={state.errors?.confirmarSenha}>
        <Input id="confirmarSenha" name="confirmarSenha" type="password" autoComplete="new-password" required />
      </Field>

      {state.message && (
        <p className="text-body-sm text-state-blocked" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
