"use client";

import { useActionState, useState } from "react";
import {
  atualizarEstagioAction,
  capturarDorAction,
  criarContatoAction,
  registrarCallAction,
  salvarBantAction,
} from "@/lib/actions/cockpit-actions";
import { gerarPropostaAction } from "@/lib/actions/proposal-actions";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/form-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CRITERIO_BANT_LABEL,
  CRITERIOS_BANT,
  ESTAGIO_LABEL,
  ESTAGIOS,
  TIPO_SPIN_LABEL,
  TIPOS_SPIN,
  UNIDADE_LABEL,
  UNIDADES,
  type Bant,
  type Estagio,
} from "@/lib/domain/spin";

const SELECT =
  "min-h-11 w-full rounded-sm border border-border-default bg-surface-raised px-3 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1";

function Feedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p className={`text-body-sm ${state.success ? "text-state-done" : "text-state-blocked"}`} role="status">
      {state.message}
    </p>
  );
}

export function EstagioForm({ organizationId, estagio }: { organizationId: string; estagio: string }) {
  const [state, action, pending] = useActionState(atualizarEstagioAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="w-48">
        <Field label="Estágio" htmlFor="estagio" error={state.errors?.estagio}>
          <select id="estagio" name="estagio" defaultValue={estagio} className={SELECT}>
            {ESTAGIOS.map((e) => (
              <option key={e} value={e}>{ESTAGIO_LABEL[e as Estagio]}</option>
            ))}
          </select>
        </Field>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Salvando…" : "Atualizar estágio"}</Button>
      <Feedback state={state} />
    </form>
  );
}

export function ContatoForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(criarContatoAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="ct-nome" error={state.errors?.nome}>
          <Input id="ct-nome" name="nome" required invalid={!!state.errors?.nome} />
        </Field>
        <Field label="Papel" htmlFor="ct-papel" error={state.errors?.papel}>
          <select id="ct-papel" name="papel" defaultValue="decisor" className={SELECT}>
            <option value="decisor">Decisor</option>
            <option value="operador">Operador</option>
            <option value="outro">Outro</option>
          </select>
        </Field>
        <Field label="WhatsApp" htmlFor="ct-whats">
          <Input id="ct-whats" name="whatsapp" inputMode="tel" />
        </Field>
        <Field label="E-mail" htmlFor="ct-email" error={state.errors?.email}>
          <Input id="ct-email" name="email" type="email" invalid={!!state.errors?.email} />
        </Field>
      </div>
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">{pending ? "Salvando…" : "Adicionar contato"}</Button>
    </form>
  );
}

export function CallForm({
  organizationId,
  contatos,
}: {
  organizationId: string;
  contatos: { id: string; nome: string }[];
}) {
  const [state, action, pending] = useActionState(registrarCallAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="call-tipo" error={state.errors?.tipo}>
          <select id="call-tipo" name="tipo" defaultValue="diagnostico" className={SELECT}>
            <option value="prospeccao">Prospecção</option>
            <option value="diagnostico">Diagnóstico</option>
            <option value="vendas">Vendas</option>
          </select>
        </Field>
        <Field label="Contato" htmlFor="call-contato">
          <select id="call-contato" name="contactId" defaultValue="" className={SELECT}>
            <option value="">Sem contato definido</option>
            {contatos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Resultado" htmlFor="call-resultado">
          <select id="call-resultado" name="resultado" defaultValue="" className={SELECT}>
            <option value="">Ainda sem resultado</option>
            <option value="avancou">Avançou</option>
            <option value="agendou">Agendou próxima etapa</option>
            <option value="sem_avanco">Sem avanço</option>
            <option value="sem_resposta">Sem resposta</option>
            <option value="perdido">Perdido</option>
            <option value="fechado">Fechado</option>
          </select>
        </Field>
        <Field label="Duração (min)" htmlFor="call-duracao" error={state.errors?.duracaoMin}>
          <Input id="call-duracao" name="duracaoMin" inputMode="numeric" invalid={!!state.errors?.duracaoMin} />
        </Field>
      </div>
      <Field label="Notas" htmlFor="call-notas">
        <Textarea id="call-notas" name="notas" className="min-h-20" />
      </Field>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="self-start">{pending ? "Registrando…" : "Registrar call"}</Button>
    </form>
  );
}

export function DorForm({
  organizationId,
  calls,
  categorias,
}: {
  organizationId: string;
  calls: { id: string; rotulo: string }[];
  categorias: string[];
}) {
  const [state, action, pending] = useActionState(capturarDorAction, INITIAL_FORM_STATE);
  const [tipo, setTipo] = useState<string>("problema");
  const implicacao = tipo === "implicacao";
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tipo SPIN" htmlFor="dor-tipo" error={state.errors?.tipoSpin}>
          <select id="dor-tipo" name="tipoSpin" value={tipo} onChange={(e) => setTipo(e.target.value)} className={SELECT}>
            {TIPOS_SPIN.map((t) => <option key={t} value={t}>{TIPO_SPIN_LABEL[t]}</option>)}
          </select>
        </Field>
        <Field label="Categoria da dor" htmlFor="dor-cat" hint="Mapeia a dor ao módulo do catálogo, por regra.">
          <select id="dor-cat" name="categoria" defaultValue="" className={SELECT}>
            <option value="">Sem categoria (sem módulo)</option>
            {categorias.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
        <Field label="Call de origem" htmlFor="dor-call">
          <select id="dor-call" name="callId" defaultValue={calls[0]?.id ?? ""} className={SELECT}>
            <option value="">Nenhuma</option>
            {calls.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
          </select>
        </Field>
      </div>
      <Field label="O que o lead disse" htmlFor="dor-desc" error={state.errors?.descricao}>
        <Textarea id="dor-desc" name="descricao" required className="min-h-20" invalid={!!state.errors?.descricao} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={implicacao ? "Número (obrigatório)" : "Número (opcional)"}
          htmlFor="dor-valor"
          hint="Leads perdidos/mês, ticket médio, horas gastas."
          error={state.errors?.valor}
        >
          <Input id="dor-valor" name="valor" inputMode="decimal" required={implicacao} invalid={!!state.errors?.valor} />
        </Field>
        <Field label={implicacao ? "Unidade (obrigatória)" : "Unidade"} htmlFor="dor-unidade" error={state.errors?.unidade}>
          <select id="dor-unidade" name="unidade" defaultValue="" required={implicacao} className={SELECT}>
            <option value="">Selecione</option>
            {UNIDADES.map((u) => <option key={u} value={u}>{UNIDADE_LABEL[u]}</option>)}
          </select>
        </Field>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="self-start">{pending ? "Salvando…" : "Registrar dor"}</Button>
    </form>
  );
}

export function BantForm({ organizationId, callId, bant }: { organizationId: string; callId: string | null; bant: Bant }) {
  const [state, action, pending] = useActionState(salvarBantAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="callId" value={callId ?? ""} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CRITERIOS_BANT.map((c) => (
          <fieldset key={c} className="flex flex-col gap-2 rounded-md border border-border-subtle p-4">
            <legend className="px-1 text-label font-medium uppercase tracking-[0.02em] text-text-secondary">{CRITERIO_BANT_LABEL[c]}</legend>
            <select name={`${c}Resposta`} defaultValue={bant[c]?.resposta ?? ""} aria-label={`${CRITERIO_BANT_LABEL[c]}: resposta`} className={SELECT}>
              <option value="">Não avaliado</option>
              <option value="sim">Sim</option>
              <option value="parcial">Parcial</option>
              <option value="nao">Não</option>
            </select>
            <Textarea name={`${c}Nota`} defaultValue={bant[c]?.nota ?? ""} aria-label={`${CRITERIO_BANT_LABEL[c]}: nota`} placeholder="Nota" className="min-h-16" />
          </fieldset>
        ))}
      </div>
      {state.errors?.callId && <p className="text-body-sm text-state-blocked" role="alert">{state.errors.callId}</p>}
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending || !callId} className="self-start">
        {pending ? "Salvando…" : "Salvar qualificação"}
      </Button>
    </form>
  );
}

export function GerarPropostaForm({
  organizationId,
  padroes,
  podeGerar,
}: {
  organizationId: string;
  padroes: { ticketMedio: string; taxaConversaoPct: string; recuperacaoPct: string; horizonteMeses: string };
  podeGerar: boolean;
}) {
  const [state, action, pending] = useActionState(gerarPropostaAction, INITIAL_FORM_STATE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <p className="max-w-[68ch] text-body-sm text-text-secondary">
        Premissas do cálculo. Elas aparecem na proposta ao lado de cada número projetado. Preços vêm do catálogo: não há campo
        de preço aqui.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Ticket médio (R$)" htmlFor="g-ticket" error={state.errors?.ticketMedio}>
          <Input id="g-ticket" name="ticketMedio" inputMode="decimal" defaultValue={padroes.ticketMedio} invalid={!!state.errors?.ticketMedio} />
        </Field>
        <Field label="Conversão de leads (%)" htmlFor="g-conv" error={state.errors?.taxaConversaoPct}>
          <Input id="g-conv" name="taxaConversaoPct" inputMode="decimal" defaultValue={padroes.taxaConversaoPct} invalid={!!state.errors?.taxaConversaoPct} />
        </Field>
        <Field label="Custo da hora (R$)" htmlFor="g-hora" error={state.errors?.custoHora}>
          <Input id="g-hora" name="custoHora" inputMode="decimal" invalid={!!state.errors?.custoHora} />
        </Field>
        <Field label="Recuperação da dor (%)" htmlFor="g-rec" error={state.errors?.recuperacaoPct}>
          <Input id="g-rec" name="recuperacaoPct" inputMode="decimal" defaultValue={padroes.recuperacaoPct} invalid={!!state.errors?.recuperacaoPct} />
        </Field>
        <Field label="Horizonte (meses)" htmlFor="g-hor" error={state.errors?.horizonteMeses}>
          <Input id="g-hor" name="horizonteMeses" type="number" min={1} max={36} defaultValue={padroes.horizonteMeses} invalid={!!state.errors?.horizonteMeses} />
        </Field>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending || !podeGerar} className="self-start">
        {pending ? "Gerando…" : "Gerar proposta"}
      </Button>
      {!podeGerar && <p className="text-body-sm text-text-tertiary">Capture ao menos uma dor com categoria do catálogo para gerar a proposta.</p>}
    </form>
  );
}
