"use client";

import { useActionState, useState } from "react";
import { editarProjetoAction } from "@/lib/actions/project-actions";
import { criarFaseAction, editarFaseAction } from "@/lib/actions/phase-actions";
import { criarTaskAction, editarTaskAction, mudarStatusTaskAction } from "@/lib/actions/task-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Tables } from "@/lib/supabase/types";

const STATUS_OPCOES = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "bloqueada", label: "Bloqueada" },
];

const DONO_OPCOES = [
  { value: "sabre", label: "Sabre" },
  { value: "cliente", label: "Cliente" },
];

function SelectField({
  id,
  name,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className="min-h-11 w-full rounded-sm border border-border-default bg-surface-raised px-3 text-body text-text-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function EditarProjetoForm({ project }: { project: Tables<"projects"> }) {
  const [state, action, pending] = useActionState(editarProjetoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={project.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="p-nome" error={state.errors?.nome}>
          <Input id="p-nome" name="nome" defaultValue={project.nome} required />
        </Field>
        <Field label="Slug" htmlFor="p-slug" error={state.errors?.slug}>
          <Input id="p-slug" name="slug" defaultValue={project.slug} required />
        </Field>
        <Field label="Status" htmlFor="p-status">
          <SelectField
            id="p-status"
            name="status"
            defaultValue={project.status}
            options={[
              { value: "em_andamento", label: "Em andamento" },
              { value: "concluido", label: "Concluído" },
              { value: "pausado", label: "Pausado" },
              { value: "arquivado", label: "Arquivado" },
            ]}
          />
        </Field>
        <Field label="Previsão de entrega" htmlFor="p-previsao" error={state.errors?.previsaoEntrega}>
          <Input id="p-previsao" name="previsaoEntrega" type="date" defaultValue={project.previsao_entrega ?? ""} />
        </Field>
        <Field label="Descrição" htmlFor="p-descricao" error={state.errors?.descricao}>
          <Input id="p-descricao" name="descricao" defaultValue={project.descricao ?? ""} />
        </Field>
      </div>
      {state.message && (
        <p className={`text-body-sm ${state.success ? "text-state-done" : "text-state-blocked"}`}>{state.message}</p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}

export function CriarFaseForm({ projectId, proximaOrdem }: { projectId: string; proximaOrdem: number }) {
  const [state, action, pending] = useActionState(criarFaseAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="ordem" value={proximaOrdem} />
      <Field label="Nova fase" htmlFor="fase-titulo" error={state.errors?.titulo}>
        <Input id="fase-titulo" name="titulo" placeholder="Ex.: F2 — Desenvolvimento" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando…" : "Adicionar fase"}
      </Button>
      {state.message && <span className="text-body-sm text-state-blocked">{state.message}</span>}
    </form>
  );
}

export function EditarFaseForm({ fase }: { fase: Tables<"phases"> }) {
  const [state, action, pending] = useActionState(editarFaseAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="faseId" value={fase.id} />
      <Field label="Título" htmlFor={`fase-titulo-${fase.id}`} error={state.errors?.titulo}>
        <Input id={`fase-titulo-${fase.id}`} name="titulo" defaultValue={fase.titulo} required />
      </Field>
      <Field label="Ordem" htmlFor={`fase-ordem-${fase.id}`} error={state.errors?.ordem}>
        <Input id={`fase-ordem-${fase.id}`} name="ordem" type="number" defaultValue={fase.ordem} className="w-20" />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
      {state.message && <span className="text-body-sm text-state-done">{state.message}</span>}
    </form>
  );
}

export function CriarTaskForm({ faseId, proximaOrdem }: { faseId: string; proximaOrdem: number }) {
  const [state, action, pending] = useActionState(criarTaskAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="faseId" value={faseId} />
      <input type="hidden" name="ordem" value={proximaOrdem} />
      <Field label="Nova etapa" htmlFor={`task-titulo-${faseId}`} error={state.errors?.titulo}>
        <Input id={`task-titulo-${faseId}`} name="titulo" required />
      </Field>
      <Field label="Slug" htmlFor={`task-slug-${faseId}`} error={state.errors?.slug} hint="único nesta fase">
        <Input id={`task-slug-${faseId}`} name="slug" required />
      </Field>
      <Field label="Dono" htmlFor={`task-dono-${faseId}`}>
        <SelectField id={`task-dono-${faseId}`} name="dono" defaultValue="sabre" options={DONO_OPCOES} />
      </Field>
      <Field label="Prazo" htmlFor={`task-prazo-${faseId}`} error={state.errors?.prazo}>
        <Input id={`task-prazo-${faseId}`} name="prazo" type="date" />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Adicionando…" : "Adicionar etapa"}
      </Button>
      {state.message && <span className="text-body-sm text-state-blocked">{state.message}</span>}
    </form>
  );
}

export function StatusTaskSelect({ task }: { task: Tables<"tasks"> }) {
  const [state, action] = useActionState(mudarStatusTaskAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="taskId" value={task.id} />
      <select
        name="status"
        defaultValue={task.status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="min-h-9 rounded-sm border border-border-default bg-surface-raised px-2 text-body-sm text-text-primary"
      >
        {STATUS_OPCOES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {state.message && <span className="text-body-sm text-state-blocked">{state.message}</span>}
    </form>
  );
}

export function EditarTaskModal({ task }: { task: Tables<"tasks"> }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editarTaskAction, INITIAL_FORM_STATE);

  return (
    <>
      <Button variant="ghost" type="button" onClick={() => setOpen(true)}>
        Editar
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={`Editar etapa`} description={task.titulo}>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="taskId" value={task.id} />
          <Field label="Título" htmlFor="t-titulo" error={state.errors?.titulo}>
            <Input id="t-titulo" name="titulo" defaultValue={task.titulo} required />
          </Field>
          <Field label="Descrição" htmlFor="t-descricao" error={state.errors?.descricao}>
            <Input id="t-descricao" name="descricao" defaultValue={task.descricao ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dono" htmlFor="t-dono">
              <SelectField id="t-dono" name="dono" defaultValue={task.dono} options={DONO_OPCOES} />
            </Field>
            <Field label="Prazo" htmlFor="t-prazo" error={state.errors?.prazo} hint="pendência do cliente vencida pausa o relógio">
              <Input id="t-prazo" name="prazo" type="date" defaultValue={task.prazo ?? ""} />
            </Field>
            <Field label="Ordem" htmlFor="t-ordem" error={state.errors?.ordem}>
              <Input id="t-ordem" name="ordem" type="number" defaultValue={task.ordem} />
            </Field>
            <Field label="Status" htmlFor="t-status">
              <SelectField id="t-status" name="status" defaultValue={task.status} options={STATUS_OPCOES} />
            </Field>
          </div>
          <Field label="Motivo do bloqueio" htmlFor="t-motivo" hint="preenchido só quando status = bloqueada">
            <Input id="t-motivo" name="motivoBloqueio" defaultValue={task.motivo_bloqueio ?? ""} />
          </Field>
          {state.message && <p className="text-body-sm text-state-blocked">{state.message}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : "Salvar etapa"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
