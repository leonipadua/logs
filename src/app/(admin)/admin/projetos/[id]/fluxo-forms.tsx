"use client";

import { useActionState } from "react";
import {
  atualizarReuniaoAction,
  criarReuniaoAction,
  fecharSprintAction,
  pausarRelogioAction,
  retomarRelogioAction,
} from "@/lib/actions/project-flow-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Mensagem({ state }: { state: { message?: string; success?: boolean } }) {
  if (!state.message) return null;
  return (
    <p role="status" className={`text-body-sm ${state.success ? "text-state-done" : "text-state-blocked"}`}>
      {state.message}
    </p>
  );
}

export function PausarRelogioForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(pausarRelogioAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <Field label="Motivo da pausa" htmlFor="pausa-motivo" error={state.errors?.motivo}>
        <Input id="pausa-motivo" name="motivo" required minLength={5} placeholder="Ex.: aguardando liberação da API da Meta" className="w-80" />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Pausando…" : "Pausar relógio"}
      </Button>
      <Mensagem state={state} />
    </form>
  );
}

export function RetomarRelogioForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(retomarRelogioAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Retomando…" : "Retomar relógio"}
      </Button>
      <Mensagem state={state} />
    </form>
  );
}

export function FecharSprintForm({ faseId, pronta }: { faseId: string; pronta: boolean }) {
  const [state, action, pending] = useActionState(fecharSprintAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="faseId" value={faseId} />
      <Button type="submit" variant={pronta ? "primary" : "secondary"} disabled={pending}>
        {pending ? "Validando…" : "Fechar sprint"}
      </Button>
      <Mensagem state={state} />
    </form>
  );
}

export function AgendarReuniaoForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(criarReuniaoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="projectId" value={projectId} />
      <Field label="Tipo" htmlFor="reuniao-tipo">
        <select
          id="reuniao-tipo"
          name="tipo"
          defaultValue="reuniao"
          className="min-h-11 w-full rounded-sm border border-border-default bg-surface-raised px-3 text-body text-text-primary"
        >
          <option value="kickoff">Kickoff</option>
          <option value="treinamento">Treinamento</option>
          <option value="reuniao">Reunião</option>
        </select>
      </Field>
      <Field label="Título" htmlFor="reuniao-titulo" error={state.errors?.titulo}>
        <Input id="reuniao-titulo" name="titulo" required />
      </Field>
      <Field label="Data e hora" htmlFor="reuniao-quando" error={state.errors?.ocorreEm}>
        <Input id="reuniao-quando" name="ocorreEm" type="datetime-local" required />
      </Field>
      <Field label="Duração (min)" htmlFor="reuniao-duracao" error={state.errors?.duracaoMin}>
        <Input id="reuniao-duracao" name="duracaoMin" type="number" min={5} />
      </Field>
      <Field label="Link da reunião" htmlFor="reuniao-link" error={state.errors?.linkReuniao}>
        <Input id="reuniao-link" name="linkReuniao" type="url" placeholder="https://" />
      </Field>
      <div className="flex items-end gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Agendando…" : "Agendar"}
        </Button>
        <Mensagem state={state} />
      </div>
    </form>
  );
}

export function AtualizarReuniaoForm({
  reuniaoId,
  status,
  gravacaoUrl,
}: {
  reuniaoId: string;
  status: string;
  gravacaoUrl: string | null;
}) {
  const [state, action, pending] = useActionState(atualizarReuniaoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="reuniaoId" value={reuniaoId} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Status da reunião"
        className="min-h-9 rounded-sm border border-border-default bg-surface-raised px-2 text-body-sm text-text-primary"
      >
        <option value="agendada">Agendada</option>
        <option value="realizada">Realizada</option>
        <option value="cancelada">Cancelada</option>
      </select>
      <Input name="gravacaoUrl" type="url" defaultValue={gravacaoUrl ?? ""} placeholder="Link da gravação" aria-label="Link da gravação" className="w-56" />
      <Button type="submit" variant="ghost" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
      <Mensagem state={state} />
      {state.errors?.gravacaoUrl && <span className="text-body-sm text-state-blocked">{state.errors.gravacaoUrl}</span>}
    </form>
  );
}
