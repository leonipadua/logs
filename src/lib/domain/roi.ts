/**
 * ROI como PROJEÇÃO com premissas explícitas (PRD §3.2, §7.4). Nenhum número
 * sai daqui sem a lista de premissas que o gerou; sem custo da dor, não há ROI.
 */
export interface PremissasRoi {
  /** Custo mensal da dor, em centavos (resultado de calcularCustoDaDor). */
  custoMensalCentavos: number;
  /** Fração 0..1 do custo da dor que a solução recupera. Premissa editável. */
  recuperacao: number;
  /** Horizonte da projeção, em meses. */
  horizonteMeses: number;
}

export interface EntradaRoi extends PremissasRoi {
  /** Vêm do catálogo (calc_proposta_preco / somarModulos), nunca de input livre. */
  implementacaoCentavos: number;
  mensalidadeCentavos: number;
}

export interface ResultadoRoi {
  ganhoMensalCentavos: number;
  ganhoHorizonteCentavos: number;
  investimentoHorizonteCentavos: number;
  saldoHorizonteCentavos: number;
  /** Meses para a implementação se pagar com (ganho - mensalidade); null se nunca. */
  paybackMeses: number | null;
}

export interface ProjecaoRoi {
  resultado: ResultadoRoi;
  /** Frases prontas para exibir ao lado do número. */
  premissas: string[];
}

export const RECUPERACAO_PADRAO = 0.5;
export const HORIZONTE_PADRAO_MESES = 12;

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function calcularRoi(e: EntradaRoi): ResultadoRoi | null {
  if (!(e.custoMensalCentavos > 0)) return null;
  if (!(e.recuperacao > 0 && e.recuperacao <= 1)) return null;
  if (!Number.isInteger(e.horizonteMeses) || e.horizonteMeses < 1) return null;

  const ganhoMensal = Math.round(e.custoMensalCentavos * e.recuperacao);
  const ganhoHorizonte = ganhoMensal * e.horizonteMeses;
  const investimento = e.implementacaoCentavos + e.mensalidadeCentavos * e.horizonteMeses;
  const liquidoMensal = ganhoMensal - e.mensalidadeCentavos;
  return {
    ganhoMensalCentavos: ganhoMensal,
    ganhoHorizonteCentavos: ganhoHorizonte,
    investimentoHorizonteCentavos: investimento,
    saldoHorizonteCentavos: ganhoHorizonte - investimento,
    paybackMeses: liquidoMensal > 0 ? Math.ceil(e.implementacaoCentavos / liquidoMensal) : null,
  };
}

/** Projeção + as premissas em texto. Retorna null quando não dá para projetar. */
export function projetarRoi(e: EntradaRoi, premissasDaDor: string[]): ProjecaoRoi | null {
  const resultado = calcularRoi(e);
  if (!resultado) return null;
  return {
    resultado,
    premissas: [
      ...premissasDaDor,
      `Custo atual da dor estimado em ${brl(e.custoMensalCentavos)} por mês.`,
      `Considera que a solução recupera ${Math.round(e.recuperacao * 100)}% desse custo.`,
      `Horizonte de ${e.horizonteMeses} meses; investimento = implementação + ${e.horizonteMeses} mensalidades do tier.`,
      "Projeção, não promessa de resultado.",
    ],
  };
}
