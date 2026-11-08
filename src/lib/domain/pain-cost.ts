/**
 * Custo da dor em R$/mês a partir das Implicações (PRD §3.2). Toda conversão
 * usa uma premissa explícita; sem a premissa, a linha fica sem valor (nunca
 * se inventa número) e entra em `pendencias`.
 */
import { ehUnidade, type Unidade } from "./spin";

export interface Implicacao {
  id: string;
  descricao: string;
  valor: number;
  unidade: Unidade | string;
}

export interface PremissasCusto {
  /** Ticket médio em centavos. Pode vir de uma Implicação em ticket_medio_brl. */
  ticketMedioCentavos?: number | null;
  /** Fração 0..1 de leads perdidos que teriam fechado. */
  taxaConversao?: number | null;
  /** Custo da hora de trabalho em centavos. */
  custoHoraCentavos?: number | null;
}

export interface LinhaCusto {
  painId: string;
  descricao: string;
  /** null = sem premissa suficiente para converter em R$. */
  centavos: number | null;
  /** Memória de cálculo legível. */
  formula: string;
}

export interface ResultadoCusto {
  custoMensalCentavos: number;
  linhas: LinhaCusto[];
  pendencias: string[];
  /** Premissas efetivamente usadas (já resolvidas), para persistir na proposta. */
  premissas: Required<{ [K in keyof PremissasCusto]: number | null }>;
}

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Ticket médio: premissa explícita ganha; senão a maior Implicação em ticket_medio_brl. */
export function resolverTicketMedio(implicacoes: Implicacao[], premissas: PremissasCusto): number | null {
  if (premissas.ticketMedioCentavos != null && premissas.ticketMedioCentavos > 0) return premissas.ticketMedioCentavos;
  const tickets = implicacoes.filter((i) => i.unidade === "ticket_medio_brl" && i.valor > 0);
  if (tickets.length === 0) return null;
  return Math.round(Math.max(...tickets.map((t) => t.valor)) * 100);
}

export function calcularCustoDaDor(implicacoes: Implicacao[], premissas: PremissasCusto = {}): ResultadoCusto {
  const ticket = resolverTicketMedio(implicacoes, premissas);
  const conv = premissas.taxaConversao ?? null;
  const custoHora = premissas.custoHoraCentavos ?? null;
  const pendencias: string[] = [];
  const linhas: LinhaCusto[] = [];

  for (const i of implicacoes) {
    if (!ehUnidade(i.unidade) || !Number.isFinite(i.valor) || i.valor < 0) {
      linhas.push({ painId: i.id, descricao: i.descricao, centavos: null, formula: "Unidade ou valor inválido." });
      continue;
    }
    switch (i.unidade) {
      case "brl_mes": {
        const c = Math.round(i.valor * 100);
        linhas.push({ painId: i.id, descricao: i.descricao, centavos: c, formula: `${brl(c)} por mês, informado na call` });
        break;
      }
      case "leads_mes": {
        if (ticket === null || conv === null || conv <= 0) {
          linhas.push({ painId: i.id, descricao: i.descricao, centavos: null, formula: "Falta ticket médio ou taxa de conversão." });
          if (!pendencias.includes("Informe ticket médio e taxa de conversão para converter leads perdidos em R$."))
            pendencias.push("Informe ticket médio e taxa de conversão para converter leads perdidos em R$.");
          break;
        }
        const c = Math.round(i.valor * conv * ticket);
        linhas.push({
          painId: i.id,
          descricao: i.descricao,
          centavos: c,
          formula: `${i.valor} leads/mês × ${Math.round(conv * 100)}% de conversão × ${brl(ticket)} de ticket`,
        });
        break;
      }
      case "horas_mes": {
        if (custoHora === null || custoHora <= 0) {
          linhas.push({ painId: i.id, descricao: i.descricao, centavos: null, formula: "Falta o custo da hora." });
          if (!pendencias.includes("Informe o custo da hora para converter horas gastas em R$."))
            pendencias.push("Informe o custo da hora para converter horas gastas em R$.");
          break;
        }
        const c = Math.round(i.valor * custoHora);
        linhas.push({ painId: i.id, descricao: i.descricao, centavos: c, formula: `${i.valor} h/mês × ${brl(custoHora)} por hora` });
        break;
      }
      case "ticket_medio_brl":
        // É premissa, não custo.
        linhas.push({ painId: i.id, descricao: i.descricao, centavos: 0, formula: "Ticket médio: usado como premissa, não é custo." });
        break;
    }
  }

  const custoMensalCentavos = linhas.reduce((s, l) => s + (l.centavos ?? 0), 0);
  return {
    custoMensalCentavos,
    linhas,
    pendencias,
    premissas: { ticketMedioCentavos: ticket, taxaConversao: conv, custoHoraCentavos: custoHora },
  };
}
