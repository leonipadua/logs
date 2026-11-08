/**
 * Proposta viva: formato do snapshot de premissas, montagem do rascunho a
 * partir das dores, sinal de follow-up e regras do aceite. Sem preço livre:
 * preços vêm de catalog.ts / calc_proposta_preco.
 */
import { calcularCustoDaDor, type Implicacao, type PremissasCusto, type ResultadoCusto } from "./pain-cost";
import { HORIZONTE_PADRAO_MESES, RECUPERACAO_PADRAO } from "./roi";

export const TERMOS_VERSAO = "2026-11-provisorio";
export const TAXA_CONVERSAO_PADRAO = 0.2;

/** Snapshot guardado em proposals.premissas_roi (lido pela página pública). */
export interface PremissasProposta {
  ticketMedioCentavos: number | null;
  taxaConversao: number | null;
  custoHoraCentavos: number | null;
  recuperacao: number;
  horizonteMeses: number;
  custoMensalCentavos: number;
  linhasCusto: { descricao: string; centavos: number | null; formula: string }[];
  pendencias: string[];
}

export interface PainParaProposta {
  id: string;
  tipo_spin: string;
  descricao: string;
  valor_numerico: number | null;
  unidade: string | null;
  module_id: string | null;
}

export interface ItemRascunho {
  moduleId: string;
  painId: string | null;
}

export interface RascunhoProposta {
  itens: ItemRascunho[];
  premissas: PremissasProposta;
  custo: ResultadoCusto;
}

const PRIORIDADE: Record<string, number> = { implicacao: 0, problema: 1, necessidade: 2, situacao: 3 };

export function implicacoesDasDores(dores: PainParaProposta[]): Implicacao[] {
  return dores
    .filter((d) => d.tipo_spin === "implicacao" && d.valor_numerico !== null && d.unidade !== null)
    .map((d) => ({ id: d.id, descricao: d.descricao, valor: Number(d.valor_numerico), unidade: d.unidade as string }));
}

/**
 * Um item por módulo (unique proposal_id+module_id). A dor que ancora o item
 * é a de maior prioridade SPIN (implicação > problema > necessidade > situação).
 */
export function montarRascunho(
  dores: PainParaProposta[],
  entrada: Partial<PremissasCusto> & { recuperacao?: number; horizonteMeses?: number } = {},
): RascunhoProposta {
  const mapeadas = dores.filter((d) => d.module_id);
  const porModulo = new Map<string, PainParaProposta>();
  for (const d of mapeadas) {
    const atual = porModulo.get(d.module_id!);
    if (!atual || (PRIORIDADE[d.tipo_spin] ?? 9) < (PRIORIDADE[atual.tipo_spin] ?? 9)) porModulo.set(d.module_id!, d);
  }
  const itens: ItemRascunho[] = [...porModulo.entries()].map(([moduleId, d]) => ({ moduleId, painId: d.id }));

  const custo = calcularCustoDaDor(implicacoesDasDores(dores), {
    ticketMedioCentavos: entrada.ticketMedioCentavos ?? null,
    taxaConversao: entrada.taxaConversao ?? TAXA_CONVERSAO_PADRAO,
    custoHoraCentavos: entrada.custoHoraCentavos ?? null,
  });

  return {
    itens,
    custo,
    premissas: {
      ticketMedioCentavos: custo.premissas.ticketMedioCentavos,
      taxaConversao: custo.premissas.taxaConversao,
      custoHoraCentavos: custo.premissas.custoHoraCentavos,
      recuperacao: entrada.recuperacao ?? RECUPERACAO_PADRAO,
      horizonteMeses: entrada.horizonteMeses ?? HORIZONTE_PADRAO_MESES,
      custoMensalCentavos: custo.custoMensalCentavos,
      linhasCusto: custo.linhas.filter((l) => l.centavos !== 0).map((l) => ({
        descricao: l.descricao,
        centavos: l.centavos,
        formula: l.formula,
      })),
      pendencias: custo.pendencias,
    },
  };
}

/** Lê premissas_roi (jsonb) de forma defensiva. */
export function lerPremissas(json: unknown): PremissasProposta | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const recuperacao = num(o.recuperacao);
  const horizonte = num(o.horizonteMeses);
  const custo = num(o.custoMensalCentavos);
  if (recuperacao === null || horizonte === null || custo === null) return null;
  const linhas = Array.isArray(o.linhasCusto) ? o.linhasCusto : [];
  return {
    ticketMedioCentavos: num(o.ticketMedioCentavos),
    taxaConversao: num(o.taxaConversao),
    custoHoraCentavos: num(o.custoHoraCentavos),
    recuperacao,
    horizonteMeses: horizonte,
    custoMensalCentavos: custo,
    linhasCusto: linhas
      .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
      .map((l) => ({
        descricao: typeof l.descricao === "string" ? l.descricao : "",
        centavos: num(l.centavos),
        formula: typeof l.formula === "string" ? l.formula : "",
      })),
    pendencias: Array.isArray(o.pendencias) ? o.pendencias.filter((p): p is string => typeof p === "string") : [],
  };
}

/** Frases das premissas do custo (ticket, conversão, hora) para exibição. */
export function premissasDoCustoEmTexto(p: PremissasProposta): string[] {
  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const out: string[] = [];
  for (const l of p.linhasCusto) if (l.centavos !== null && l.centavos > 0) out.push(`${l.descricao}: ${l.formula}.`);
  if (p.ticketMedioCentavos) out.push(`Ticket médio considerado: ${brl(p.ticketMedioCentavos)}.`);
  return out;
}

// --- Follow-up (offer.viewed é o melhor sinal) -----------------------------

export type SinalFollowUp = "quente" | "esfriando" | "sem_abertura" | null;

export interface PropostaSinal {
  status: string;
  view_count: number;
  last_viewed_at: string | null;
  enviada_em: string | null;
}

const HORA = 3_600_000;

export function sinalFollowUp(p: PropostaSinal, agora: Date = new Date()): SinalFollowUp {
  if (p.status !== "enviada") return null;
  if (p.view_count > 0 && p.last_viewed_at) {
    const horas = (agora.getTime() - new Date(p.last_viewed_at).getTime()) / HORA;
    return horas <= 48 ? "quente" : "esfriando";
  }
  if (p.enviada_em) {
    const horas = (agora.getTime() - new Date(p.enviada_em).getTime()) / HORA;
    if (horas > 48) return "sem_abertura";
  }
  return null;
}

export const SINAL_LABEL: Record<Exclude<SinalFollowUp, null>, string> = {
  quente: "Abriu nas últimas 48 h: bom momento para contato",
  esfriando: "Abriu, mas há mais de 48 h: retome o contato",
  sem_abertura: "Enviada há mais de 48 h e ainda não aberta",
};

// --- Aceite ----------------------------------------------------------------

export function somarDias(base: Date, dias: number): string {
  const d = new Date(base.getTime() + dias * 24 * HORA);
  return d.toISOString().slice(0, 10);
}

export function propostaExpirada(validadeAte: string | null, status: string, hoje: Date = new Date()): boolean {
  if (status === "aceita" || !validadeAte) return false;
  return validadeAte < hoje.toISOString().slice(0, 10);
}

export interface ParcelaContrato {
  numero: number;
  tipo: "entrada" | "parcela";
  valor_centavos: number;
  vencimento: string;
}

/**
 * Plano inicial: a implementação (já ajustada pela condição de pagamento do
 * catálogo) vence como entrada. Parcelamento fino é decisão de contrato (Fase 4).
 */
export function planoDeParcelas(implementacaoCentavos: number, hoje: Date = new Date()): ParcelaContrato[] {
  if (implementacaoCentavos <= 0) return [];
  return [{ numero: 1, tipo: "entrada", valor_centavos: implementacaoCentavos, vencimento: somarDias(hoje, 3) }];
}

/** Escopo do retainer S4+: o que a mensalidade cobre (módulos do tier com mensalidade). */
export function escopoRetainer(modulos: { nome: string; mensalidade_centavos: number }[]): string[] {
  return modulos.filter((m) => m.mensalidade_centavos > 0).map((m) => `Manutenção e otimização: ${m.nome}`);
}
