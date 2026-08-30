"use client";

import { useActionState } from "react";
import { editarOfertaAction } from "@/lib/actions/offer-actions";
import { INITIAL_FORM_STATE } from "@/lib/actions/form-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface OfertaEditavel {
  id: string;
  titulo: string;
  insightPadrao: string;
  descricaoEntrega: string;
  precoPadraoCentavos: number;
  prazoEstimadoDias: number | null;
  ativa: boolean;
  resumoPublico: string;
  descricaoPublica: string;
  entregaveisTexto: string;
  paraQuem: string;
  resultadoEsperado: string;
  prazoPublico: string;
}

export function EditarOfertaForm({ oferta }: { oferta: OfertaEditavel }) {
  const [state, action, pending] = useActionState(editarOfertaAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="offerId" value={oferta.id} />

      <section className="flex flex-col gap-4">
        <h2 className="text-body-lg font-medium text-text-primary">Dados internos</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" htmlFor="e-titulo" error={state.errors?.titulo}>
            <Input id="e-titulo" name="titulo" defaultValue={oferta.titulo} required />
          </Field>
          <Field label="Preço padrão (centavos)" htmlFor="e-preco" error={state.errors?.precoPadraoCentavos}>
            <Input
              id="e-preco"
              name="precoPadraoCentavos"
              type="number"
              min={0}
              defaultValue={oferta.precoPadraoCentavos}
              required
            />
          </Field>
        </div>

        <Field
          label="Insight padrão"
          htmlFor="e-insight"
          error={state.errors?.insightPadrao}
          hint="copy interna da vitrine do cliente logado — o indicado não vê"
        >
          <Input id="e-insight" name="insightPadrao" defaultValue={oferta.insightPadrao} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="O que está incluso (interno)" htmlFor="e-descricao" error={state.errors?.descricaoEntrega}>
            <Input id="e-descricao" name="descricaoEntrega" defaultValue={oferta.descricaoEntrega} />
          </Field>
          <Field label="Prazo estimado (dias)" htmlFor="e-prazo" error={state.errors?.prazoEstimadoDias}>
            <Input
              id="e-prazo"
              name="prazoEstimadoDias"
              type="number"
              min={0}
              defaultValue={oferta.prazoEstimadoDias ?? ""}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-body text-text-primary">
          <input type="checkbox" name="ativa" value="1" defaultChecked={oferta.ativa} className="size-4" />
          Oferta ativa
          <span className="text-body-sm text-text-tertiary">(inativa some de todas as vitrines)</span>
        </label>
      </section>

      <section className="flex flex-col gap-4 border-t border-border-subtle pt-8">
        <div>
          <h2 className="text-body-lg font-medium text-text-primary">Conteúdo da vitrine pública</h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            É isto que o indicado lê ao abrir um link de indicação. Nenhum preço aparece na página.
          </p>
        </div>

        <Field
          label="Resumo público"
          htmlFor="e-resumo"
          error={state.errors?.resumoPublico}
          hint="uma frase, exibida no card da vitrine"
        >
          <Input id="e-resumo" name="resumoPublico" maxLength={200} defaultValue={oferta.resumoPublico} />
        </Field>

        <Field
          label="Descrição pública"
          htmlFor="e-descricao-publica"
          error={state.errors?.descricaoPublica}
          hint="abre a página de detalhe; quebras de linha são preservadas"
        >
          <Textarea id="e-descricao-publica" name="descricaoPublica" rows={5} defaultValue={oferta.descricaoPublica} />
        </Field>

        <Field
          label="O que está disponível para contratação"
          htmlFor="e-entregaveis"
          error={state.errors?.entregaveisTexto}
          hint="um item por linha"
        >
          <Textarea id="e-entregaveis" name="entregaveisTexto" rows={6} defaultValue={oferta.entregaveisTexto} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Para quem é" htmlFor="e-para-quem" error={state.errors?.paraQuem}>
            <Input id="e-para-quem" name="paraQuem" defaultValue={oferta.paraQuem} />
          </Field>
          <Field label="O que o cliente ganha" htmlFor="e-resultado" error={state.errors?.resultadoEsperado}>
            <Input id="e-resultado" name="resultadoEsperado" defaultValue={oferta.resultadoEsperado} />
          </Field>
        </div>

        <Field
          label="Prazo público"
          htmlFor="e-prazo-publico"
          error={state.errors?.prazoPublico}
          hint='texto livre, ex.: "3 a 4 semanas"'
        >
          <Input id="e-prazo-publico" name="prazoPublico" maxLength={60} defaultValue={oferta.prazoPublico} />
        </Field>
      </section>

      {state.message && (
        <p className={state.success ? "text-body-sm text-state-done" : "text-body-sm text-state-blocked"}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar oferta"}
      </Button>
    </form>
  );
}
