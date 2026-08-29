"use client";

import { useActionState, useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/form-state";

interface ConfirmDeleteButtonProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  hiddenFields: Record<string, string>;
  title: string;
  description: string;
  triggerLabel?: string;
}

/** Confirmação explícita de exclusão, dizendo o que será perdido (ARCHITECTURE/DESIGN_SYSTEM). */
export function ConfirmDeleteButton({
  action,
  hiddenFields,
  title,
  description,
  triggerLabel = "Excluir",
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);

  return (
    <>
      <Button variant="ghost" type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={title} description={description}>
        <form action={formAction} className="flex flex-col gap-4">
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
