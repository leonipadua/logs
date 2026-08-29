"use client";

import { useActionState } from "react";
import Link from "next/link";
import { recuperarSenhaAction } from "@/lib/actions/auth-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RecuperarSenhaForm() {
  const [state, action, pending] = useActionState(recuperarSenhaAction, INITIAL_FORM_STATE);

  if (state.message) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-display text-display-sm text-text-primary">Verifique seu email</h1>
        <p className="text-body text-text-secondary">{state.message}</p>
        <Link href="/login" className="text-body-sm text-accent-text hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="font-display text-display-sm text-text-primary">Recuperar senha</h1>
      <p className="text-body-sm text-text-secondary">
        Informe seu email. Se ele existir, enviaremos instruções de recuperação.
      </p>

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar instruções"}
      </Button>

      <Link href="/login" className="text-center text-body-sm text-text-secondary hover:text-text-primary">
        Voltar para o login
      </Link>
    </form>
  );
}
