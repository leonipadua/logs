"use client";

import { useActionState } from "react";
import { salvarConfiguracoesAction } from "@/lib/actions/settings-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { SETTING_DEFS, type SettingsValues } from "@/lib/domain/settings";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ConfiguracoesForm({ valores }: { valores: SettingsValues }) {
  const [state, action, pending] = useActionState(salvarConfiguracoesAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {SETTING_DEFS.map((def) => (
          <Field key={def.chave} label={def.label} htmlFor={def.chave} hint={def.hint} error={state.errors?.[def.chave]}>
            <Input
              id={def.chave}
              name={def.chave}
              type="number"
              inputMode="decimal"
              min={def.min}
              max={def.max}
              step={def.step}
              defaultValue={valores[def.chave]}
              required
            />
          </Field>
        ))}
      </div>
      {state.message && (
        <p className={`text-body-sm ${state.success ? "text-state-done" : "text-state-blocked"}`} role="status">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar configurações"}
      </Button>
    </form>
  );
}
