"use client";

import { useActionState } from "react";
import { editarOrganizacaoAction, arquivarOrganizacaoAction } from "@/lib/actions/organization-actions";
import { convidarUsuarioAction } from "@/lib/actions/invitation-actions";
import { definirAssinaturaAction } from "@/lib/actions/payment-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Organizacao {
  id: string;
  nome: string;
  slug: string;
  documento: string | null;
  telefone: string | null;
  email_faturamento: string | null;
}

export function EditarOrganizacaoForm({ org }: { org: Organizacao }) {
  const [state, action, pending] = useActionState(editarOrganizacaoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={org.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="nome" error={state.errors?.nome}>
          <Input id="nome" name="nome" defaultValue={org.nome} required />
        </Field>
        <Field label="Slug" htmlFor="slug" error={state.errors?.slug}>
          <Input id="slug" name="slug" defaultValue={org.slug} required />
        </Field>
        <Field label="Documento (CNPJ/CPF)" htmlFor="documento" error={state.errors?.documento}>
          <Input id="documento" name="documento" defaultValue={org.documento ?? ""} />
        </Field>
        <Field label="Telefone" htmlFor="telefone" error={state.errors?.telefone}>
          <Input id="telefone" name="telefone" defaultValue={org.telefone ?? ""} />
        </Field>
        <Field label="Email de faturamento" htmlFor="emailFaturamento" error={state.errors?.emailFaturamento}>
          <Input id="emailFaturamento" name="emailFaturamento" type="email" defaultValue={org.email_faturamento ?? ""} />
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

export function ConvidarMembroFormAdmin({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(convidarUsuarioAction, INITIAL_FORM_STATE);
  return (
    <form
      action={(formData) => {
        formData.set("origin", window.location.origin);
        return action(formData);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nome" htmlFor="convite-nome" error={state.errors?.nome}>
          <Input id="convite-nome" name="nome" required />
        </Field>
        <Field label="Email" htmlFor="convite-email" error={state.errors?.email}>
          <Input id="convite-email" name="email" type="email" required />
        </Field>
        <Field label="Papel" htmlFor="convite-role">
          <select
            id="convite-role"
            name="role"
            className="min-h-11 w-full rounded-sm border border-border-default bg-surface-raised px-3 text-body text-text-primary"
          >
            <option value="member">Member</option>
            <option value="owner">Owner</option>
          </select>
        </Field>
      </div>
      {state.message && (
        <p className="text-body-sm text-state-progress" role="status">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Convidando…" : "Convidar membro"}
      </Button>
    </form>
  );
}

export function DefinirAssinaturaForm({
  organizationId,
  valorAtualCentavos,
  diaVencimentoAtual,
}: {
  organizationId: string;
  valorAtualCentavos: number;
  diaVencimentoAtual: number;
}) {
  const [state, action, pending] = useActionState(definirAssinaturaAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <Field label="Valor mensal (centavos)" htmlFor="valorCentavos" error={state.errors?.valorCentavos} hint="0 = sem recorrência">
        <Input id="valorCentavos" name="valorCentavos" type="number" min={0} defaultValue={valorAtualCentavos} />
      </Field>
      <Field label="Dia de vencimento" htmlFor="diaVencimento" error={state.errors?.diaVencimento}>
        <Input id="diaVencimento" name="diaVencimento" type="number" min={1} max={28} defaultValue={diaVencimentoAtual} />
      </Field>
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Salvando…" : "Salvar assinatura"}
      </Button>
      {state.message && (
        <span className={`text-body-sm ${state.success ? "text-state-done" : "text-state-blocked"}`}>{state.message}</span>
      )}
    </form>
  );
}

export function ArquivarOrganizacaoForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(arquivarOrganizacaoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <Button variant="secondary" type="submit" disabled={pending}>
        {pending ? "Arquivando…" : "Arquivar organização"}
      </Button>
      {state.message && <span className="text-body-sm text-state-blocked">{state.message}</span>}
    </form>
  );
}
