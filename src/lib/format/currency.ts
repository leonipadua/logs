const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor em centavos (integer) como BRL, ex.: 120000 -> "R$ 1.200,00". */
export function formatCentavosBRL(centavos: number): string {
  return BRL_FORMATTER.format(centavos / 100);
}
