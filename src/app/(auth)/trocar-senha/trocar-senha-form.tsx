"use client";

import { useActionState } from "react";
import { trocarSenhaAction } from "@/lib/actions/auth-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TrocarSenhaForm() {
  const [state, action, pending] = useActionState(trocarSenhaAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="font-display text-display-sm text-text-primary">Defina sua senha</h1>
      <p className="text-body-sm text-text-secondary">
        Este é seu primeiro acesso. Escolha uma senha para continuar.
      </p>

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
        {pending ? "Salvando…" : "Salvar e continuar"}
      </Button>
    </form>
  );
}
