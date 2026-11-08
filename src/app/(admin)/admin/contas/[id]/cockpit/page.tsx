import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { excluirDorAction } from "@/lib/actions/cockpit-actions";
import { formatCentavosBRL, formatDataHoraPtBR } from "@/lib/format";
import {
  avaliarBant,
  categoriasDisponiveis,
  lerBant,
  TIPO_SPIN_LABEL,
  TIPOS_SPIN,
  UNIDADE_LABEL,
  ESTAGIO_LABEL,
  type Estagio,
  type TipoSpinDominio,
  type Unidade,
} from "@/lib/domain/spin";
import { montarRascunho, type PainParaProposta } from "@/lib/domain/proposal";
import { HORIZONTE_PADRAO_MESES, RECUPERACAO_PADRAO } from "@/lib/domain/roi";
import { TAXA_CONVERSAO_PADRAO } from "@/lib/domain/proposal";
import { BantForm, CallForm, ContatoForm, DorForm, EstagioForm, GerarPropostaForm } from "./cockpit-forms";

export const dynamic = "force-dynamic";

const VEREDITO = {
  proposta: { tone: "done", label: "Qualificado: seguir para proposta" },
  nutrir: { tone: "progress", label: "Nutrir antes de propor" },
  sair: { tone: "blocked", label: "Sair do funil" },
  incompleto: { tone: "pending", label: "Qualificação incompleta" },
} as const;

export default async function CockpitContaPage({ params }: PageProps<"/admin/contas/[id]/cockpit">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("id, nome, segmento, cidade, estagio").eq("id", id).maybeSingle();
  if (!org) notFound();

  const [{ data: contatos }, { data: calls }, { data: dores }, { data: modulos }, { data: propostas }] = await Promise.all([
    supabase.from("contacts").select("id, nome, papel, whatsapp, email, principal").eq("organization_id", id).order("created_at"),
    supabase.from("calls").select("id, tipo, resultado, realizada_em, duracao_min, notas, bant").eq("organization_id", id).order("realizada_em", { ascending: false }),
    supabase.from("pains").select("id, tipo_spin, categoria, descricao, valor_numerico, unidade, module_id, call_id").eq("organization_id", id).order("created_at"),
    supabase.from("modules").select("id, nome, ativo, dores_gatilho"),
    supabase.from("proposals").select("id, status, titulo, created_at").eq("organization_id", id).order("created_at", { ascending: false }),
  ]);

  const listaCalls = calls ?? [];
  const listaDores = dores ?? [];
  const moduloPorId = new Map((modulos ?? []).map((m) => [m.id, m]));
  const callComBant = listaCalls.find((c) => Object.keys(lerBant(c.bant)).length > 0);
  const bant = lerBant(callComBant?.bant);
  const avaliacao = avaliarBant(bant);
  const veredito = VEREDITO[avaliacao.veredito];

  const doresProposta: PainParaProposta[] = listaDores.map((p) => ({
    id: p.id,
    tipo_spin: p.tipo_spin,
    descricao: p.descricao,
    valor_numerico: p.valor_numerico === null ? null : Number(p.valor_numerico),
    unidade: p.unidade,
    module_id: p.module_id,
  }));
  const rascunho = montarRascunho(doresProposta, {});
  const mapeadas = rascunho.itens.length;
  const rotuloCall = (c: { tipo: string; realizada_em: string }) => `${c.tipo} · ${formatDataHoraPtBR(c.realizada_em)}`;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Link href="/admin/cockpit" className="text-body-sm text-text-secondary hover:text-text-primary">← Cockpit</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-display-md text-text-primary">{org.nome}</h1>
          <Badge>{ESTAGIO_LABEL[org.estagio as Estagio] ?? org.estagio}</Badge>
        </div>
        <p className="text-body text-text-secondary">{[org.segmento, org.cidade].filter(Boolean).join(" · ") || "Sem segmento ou cidade informados."}</p>
        <EstagioForm organizationId={org.id} estagio={org.estagio} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Contatos e calls">
        <Card className="flex flex-col gap-4">
          <h2 className="text-body-lg font-medium text-text-primary">Contatos</h2>
          {(contatos ?? []).length === 0 ? (
            <p className="text-body-sm text-text-tertiary">Nenhum contato ainda. Adicione o decisor para a conversa ter um rosto.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(contatos ?? []).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 text-body-sm">
                  <span className="font-medium text-text-primary">{c.nome}</span>
                  <Badge>{c.papel}</Badge>
                  <span className="text-text-tertiary">{[c.whatsapp, c.email].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          )}
          <ContatoForm organizationId={org.id} />
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-body-lg font-medium text-text-primary">Registrar call</h2>
          <CallForm organizationId={org.id} contatos={(contatos ?? []).map((c) => ({ id: c.id, nome: c.nome }))} />
          {listaCalls.length > 0 && (
            <ul className="flex flex-col gap-1 border-t border-border-subtle pt-3 text-body-sm text-text-secondary">
              {listaCalls.slice(0, 5).map((c) => (
                <li key={c.id} className="tabular-nums">{rotuloCall(c)}{c.resultado ? ` · ${c.resultado.replace(/_/g, " ")}` : ""}</li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="spin-h">
        <h2 id="spin-h" className="font-display text-display-sm text-text-primary">Captura SPIN</h2>
        <Card>
          <DorForm
            organizationId={org.id}
            calls={listaCalls.map((c) => ({ id: c.id, rotulo: rotuloCall(c) }))}
            categorias={categoriasDisponiveis(modulos ?? [])}
          />
        </Card>

        {listaDores.length === 0 ? (
          <EmptyState title="Nenhuma dor capturada" description="Registre Situação, Problema, Implicação e Necessidade. Na Implicação, o número é obrigatório." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {TIPOS_SPIN.map((tipo) => {
              const doTipo = listaDores.filter((p) => p.tipo_spin === tipo);
              return (
                <Card key={tipo} className="flex flex-col gap-3">
                  <h3 className="text-label font-medium uppercase tracking-[0.02em] text-text-secondary">{TIPO_SPIN_LABEL[tipo as TipoSpinDominio]}</h3>
                  {doTipo.length === 0 ? (
                    <p className="text-body-sm text-text-tertiary">Nada capturado neste tipo.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {doTipo.map((p) => {
                        const modulo = p.module_id ? moduloPorId.get(p.module_id) : null;
                        return (
                          <li key={p.id} className="flex flex-col gap-1 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                            <p className="text-body text-text-primary">{p.descricao}</p>
                            <p className="text-body-sm tabular-nums text-text-secondary">
                              {p.valor_numerico !== null && p.unidade
                                ? `${Number(p.valor_numerico).toLocaleString("pt-BR")} ${UNIDADE_LABEL[p.unidade as Unidade] ?? p.unidade}`
                                : "Sem número"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {modulo ? <Badge tone="done">Módulo: {modulo.nome}</Badge> : <Badge tone="pending">Sem módulo mapeado</Badge>}
                              {p.categoria && <span className="text-body-sm text-text-tertiary">{p.categoria.replace(/_/g, " ")}</span>}
                              <ConfirmDeleteButton
                                action={excluirDorAction}
                                hiddenFields={{ organizationId: org.id, painId: p.id }}
                                title="Excluir esta dor?"
                                description="A dor sai do cockpit e não entra em novas propostas. Propostas já geradas não mudam."
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Card className="flex flex-col gap-2">
          <h3 className="text-label font-medium uppercase tracking-[0.02em] text-text-secondary">Custo da dor estimado</h3>
          <p className="font-display text-display-md tabular-nums text-text-primary">
            {rascunho.custo.custoMensalCentavos > 0 ? `${formatCentavosBRL(rascunho.custo.custoMensalCentavos)} por mês` : "Ainda sem estimativa"}
          </p>
          <ul className="ml-5 list-disc text-body-sm text-text-secondary">
            {rascunho.custo.linhas.filter((l) => l.centavos !== 0).map((l) => (
              <li key={l.painId}>{l.descricao}: {l.formula}</li>
            ))}
          </ul>
          {rascunho.custo.pendencias.map((p) => (
            <p key={p} className="text-body-sm text-state-progress">{p}</p>
          ))}
        </Card>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="bant-h">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="bant-h" className="font-display text-display-sm text-text-primary">Qualificação BANT</h2>
          <Badge tone={veredito.tone}>{veredito.label}</Badge>
        </div>
        <p className="text-body-sm text-text-secondary">{avaliacao.motivo}</p>
        <Card>
          {listaCalls.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">Registre uma call para salvar a qualificação nela.</p>
          ) : (
            <BantForm organizationId={org.id} callId={callComBant?.id ?? listaCalls[0].id} bant={bant} />
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="prop-h">
        <h2 id="prop-h" className="font-display text-display-sm text-text-primary">Proposta</h2>
        <Card>
          <GerarPropostaForm
            organizationId={org.id}
            podeGerar={mapeadas > 0}
            padroes={{
              ticketMedio: rascunho.custo.premissas.ticketMedioCentavos ? (rascunho.custo.premissas.ticketMedioCentavos / 100).toFixed(2).replace(".", ",") : "",
              taxaConversaoPct: String(Math.round(TAXA_CONVERSAO_PADRAO * 100)),
              recuperacaoPct: String(Math.round(RECUPERACAO_PADRAO * 100)),
              horizonteMeses: String(HORIZONTE_PADRAO_MESES),
            }}
          />
        </Card>
        {(propostas ?? []).length > 0 && (
          <p className="text-body-sm text-text-secondary">
            {(propostas ?? []).length} proposta(s) desta conta.{" "}
            <Link href="/admin/propostas" className="text-accent-text underline-offset-2 hover:underline">Ver em Propostas</Link>
          </p>
        )}
      </section>
    </div>
  );
}
