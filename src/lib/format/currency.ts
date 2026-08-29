const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor em centavos (integer) como BRL, ex.: 120000 -> "R$ 1.200,00". */
export function formatCentavosBRL(centavos: number): string {
  return BRL_FORMATTER.format(centavos / 100);
}

/** Converte centavos (integer) para reais (number), ex.: 120050 -> 1200.5. */
export function centavosParaReais(centavos: number): number {
  return centavos / 100;
}

/**
 * Converte uma entrada de reais em centavos (integer), aceitando number ou
 * string no formato pt-BR ("1.200,50", "R$ 1.200,50", "10", "10,5"). Retorna
 * `null` quando a entrada não representa um valor monetário válido — nunca
 * lança. O resultado é sempre arredondado para o centavo mais próximo, então
 * `reaisParaCentavos(centavosParaReais(n))` devolve `n` para todo integer.
 */
export function reaisParaCentavos(entrada: string | number): number | null {
  let reais: number;

  if (typeof entrada === "number") {
    reais = entrada;
  } else {
    const limpo = entrada
      .trim()
      .replace(/^R\$\s*/i, "")
      .replace(/\s/g, "");
    if (limpo === "") return null;

    // pt-BR: ponto separa milhar, vírgula separa decimal.
    const normalizado = limpo.replace(/\./g, "").replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(normalizado)) return null;
    reais = Number(normalizado);
  }

  if (!Number.isFinite(reais)) return null;
  return Math.round(reais * 100);
}
