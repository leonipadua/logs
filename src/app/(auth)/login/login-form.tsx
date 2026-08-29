"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="font-display text-display-sm text-text-primary">Entrar</h1>
      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Email" htmlFor="email" error={state.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Senha" htmlFor="senha" error={state.errors?.senha}>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </Field>

      {state.message && (
        <p className="text-body-sm text-state-blocked" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <Link href="/recuperar-senha" className="text-center text-body-sm text-text-secondary hover:text-text-primary">
        Esqueci minha senha
      </Link>
    </form>
  );
}
