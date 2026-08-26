const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formata uma data em pt-BR, ex.: "24 de março de 2026". */
export function formatDataPtBR(data: Date | string): string {
  return DATE_FORMATTER.format(new Date(data));
}

/** Formata data e hora em pt-BR, ex.: "24 de março de 2026 às 14:32". */
export function formatDataHoraPtBR(data: Date | string): string {
  const formatado = DATETIME_FORMATTER.formatToParts(new Date(data));
  const hora = formatado.find((p) => p.type === "hour")?.value;
  const minuto = formatado.find((p) => p.type === "minute")?.value;
  const dataBase = formatDataPtBR(data);
  return `${dataBase} às ${hora}:${minuto}`;
}
