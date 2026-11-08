"use client";

import { useActionState } from "react";
import {
  criarModuloAction,
  editarModuloAction,
  excluirModuloAction,
  editarTierAction,
  definirComposicaoTierAction,
  editarCondicaoPagamentoAction,
} from "@/lib/actions/catalog-actions";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";

export interface ModuloForm {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  preco_implementacao_centavos: number;
  mensalidade_centavos: number;
  horas_estimadas: number;
  dores_gatilho: string[];
  ativo: boolean;
  placeholder: boolean;
}

function centavosParaCampo(c: number): string {
  return (c / 100).toFixed(2).replace(".", ",");
}

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p className={`text-body-sm ${state.success ? "text-state-done" : "text-state-blocked"}`} role="status">
      {state.message}
    </p>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-body text-text-primary">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

function ModuloCampos({ m, prefix }: { m?: ModuloForm; prefix: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome" htmlFor={`${prefix}-nome`}>
        <Input id={`${prefix}-nome`} name="nome" defaultValue={m?.nome} required />
      </Field>
      <Field label="Slug" htmlFor={`${prefix}-slug`}>
        <Input id={`${prefix}-slug`} name="slug" defaultValue={m?.slug} required />
      </Field>
      <Field label="Implementação (R$)" htmlFor={`${prefix}-impl`}>
        <Input id={`${prefix}-impl`} name="precoImplementacao" inputMode="decimal" defaultValue={m ? centavosParaCampo(m.preco_implementacao_centavos) : ""} required />
      </Field>
      <Field label="Mensalidade (R$)" htmlFor={`${prefix}-mens`}>
        <Input id={`${prefix}-mens`} name="mensalidade" inputMode="decimal" defaultValue={m ? centavosParaCampo(m.mensalidade_centavos) : "0,00"} required />
      </Field>
      <Field label="Horas estimadas" htmlFor={`${prefix}-horas`}>
        <Input id={`${prefix}-horas`} name="horasEstimadas" type="number" min={0} step="0.5" defaultValue={m?.horas_estimadas ?? 0} required />
      </Field>
      <Field label="Dores que acionam o módulo" htmlFor={`${prefix}-dores`} hint="tags separadas por vírgula (mapeamento dor → módulo)">
        <Input id={`${prefix}-dores`} name="doresGatilho" defaultValue={m?.dores_gatilho.join(", ")} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Descrição" htmlFor={`${prefix}-desc`}>
          <Textarea id={`${prefix}-desc`} name="descricao" defaultValue={m?.descricao ?? ""} className="min-h-20" />
        </Field>
      </div>
      <Check name="ativo" label="Ativo no catálogo" defaultChecked={m?.ativo ?? true} />
      <Check name="placeholder" label="Provisório (ainda não definitivo)" defaultChecked={m?.placeholder ?? false} />
    </div>
  );
}

export function CriarModuloForm() {
  const [state, action, pending] = useActionState(criarModuloAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <ModuloCampos prefix="novo" />
      {state.errors?.slug && <p className="text-body-sm text-state-blocked" role="alert">{state.errors.slug}</p>}
      {state.errors && Object.entries(state.errors).filter(([k]) => k !== "slug").map(([k, v]) => (
        <p key={k} className="text-body-sm text-state-blocked" role="alert">{v}</p>
      ))}
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Criando…" : "Criar módulo"}
      </Button>
    </form>
  );
}

export function EditarModuloForm({ modulo }: { modulo: ModuloForm }) {
  const [state, action, pending] = useActionState(editarModuloAction, INITIAL_FORM_STATE);
  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="moduleId" value={modulo.id} />
        <ModuloCampos m={modulo} prefix={`m-${modulo.id}`} />
        {state.errors && Object.values(state.errors).map((v) => (
          <p key={v} className="text-body-sm text-state-blocked" role="alert">{v}</p>
        ))}
        <Feedback state={state} />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Salvando…" : "Salvar módulo"}
        </Button>
      </form>
      <ConfirmDeleteButton
        action={excluirModuloAction}
        hiddenFields={{ moduleId: modulo.id }}
        title={`Excluir "${modulo.nome}"?`}
        description="O módulo sai do catálogo. Se já estiver em tier, proposta ou dor, a exclusão é bloqueada — desative-o."
      />
    </div>
  );
}

export interface TierForm {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  placeholder: boolean;
  moduleIds: string[];
}

export function EditarTierForm({ tier }: { tier: TierForm }) {
  const [state, action, pending] = useActionState(editarTierAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tierId" value={tier.id} />
      <Field label="Nome" htmlFor={`t-${tier.id}-nome`} error={state.errors?.nome}>
        <Input id={`t-${tier.id}-nome`} name="nome" defaultValue={tier.nome} required />
      </Field>
      <Field label="Descrição" htmlFor={`t-${tier.id}-desc`}>
        <Textarea id={`t-${tier.id}-desc`} name="descricao" defaultValue={tier.descricao ?? ""} className="min-h-20" />
      </Field>
      <Check name="ativo" label="Ativo" defaultChecked={tier.ativo} />
      <Check name="placeholder" label="Provisório" defaultChecked={tier.placeholder} />
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar tier"}
      </Button>
    </form>
  );
}

export function ComposicaoTierForm({
  tierId,
  modulos,
  selecionados,
}: {
  tierId: string;
  modulos: { id: string; nome: string; ativo: boolean }[];
  selecionados: string[];
}) {
  const [state, action, pending] = useActionState(definirComposicaoTierAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="tierId" value={tierId} />
      <fieldset className="flex flex-col">
        <legend className="mb-1 text-label font-medium uppercase tracking-wide text-text-secondary">Módulos incluídos</legend>
        {modulos.map((m) => (
          <label key={m.id} className="flex min-h-11 items-center gap-2 text-body text-text-primary">
            <input
              type="checkbox"
              name="moduleIds"
              value={m.id}
              defaultChecked={selecionados.includes(m.id)}
              className="size-4 accent-[var(--accent)]"
            />
            {m.nome}
            {!m.ativo && <span className="text-body-sm text-text-tertiary">(inativo — não soma no preço)</span>}
          </label>
        ))}
      </fieldset>
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar composição"}
      </Button>
    </form>
  );
}

export interface CondicaoForm {
  id: string;
  nome: string;
  descricao: string | null;
  ajuste_bps: number;
  ativo: boolean;
  placeholder: boolean;
}

export function EditarCondicaoForm({ condicao }: { condicao: CondicaoForm }) {
  const [state, action, pending] = useActionState(editarCondicaoPagamentoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="conditionId" value={condicao.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor={`c-${condicao.id}-nome`} error={state.errors?.nome}>
          <Input id={`c-${condicao.id}-nome`} name="nome" defaultValue={condicao.nome} required />
        </Field>
        <Field
          label="Ajuste na implementação (%)"
          htmlFor={`c-${condicao.id}-ajuste`}
          error={state.errors?.ajustePercentual}
          hint="negativo = desconto por condição de pagamento (ex.: -5)"
        >
          <Input id={`c-${condicao.id}-ajuste`} name="ajustePercentual" type="number" step="0.01" defaultValue={condicao.ajuste_bps / 100} required />
        </Field>
      </div>
      <Field label="Descrição" htmlFor={`c-${condicao.id}-desc`}>
        <Input id={`c-${condicao.id}-desc`} name="descricao" defaultValue={condicao.descricao ?? ""} />
      </Field>
      <Check name="ativo" label="Ativa" defaultChecked={condicao.ativo} />
      <Check name="placeholder" label="Provisória" defaultChecked={condicao.placeholder} />
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar condição"}
      </Button>
    </form>
  );
}
