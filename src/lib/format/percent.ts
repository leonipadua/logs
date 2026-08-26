/** Formata uma fração (0..1) como percentual pt-BR inteiro, ex.: 0.625 -> "63%". */
export function formatPercentPtBR(fracao: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(fracao);
}
