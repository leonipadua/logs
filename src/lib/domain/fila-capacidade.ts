/**
 * Fila de capacidade (PRD §4 e §7.8): limite duro de projetos em S0–S3.
 * Cheio => o aceite entra na fila com data de início explícita.
 */
import { maxData, somarDias } from "./datas";

/** S0–S3 = 4 semanas. */
export const DIAS_S0_S3 = 28;

/** Quando um projeto libera a capacidade (fim de S3, descontadas as pausas). */
export function fimDeS3(startDate: string, diasPausados = 0): string {
  return somarDias(startDate, DIAS_S0_S3 + diasPausados);
}

export interface EntradaNaFila {
  naFila: boolean;
  /** Data de início explícita (hoje quando não há fila). */
  dataInicioPrevista: string;
}

/**
 * @param max           capacidade_max_projetos
 * @param fimsDosOcupantes  fim de S3 previsto de cada projeto hoje em S0–S3
 * @param jaNaFila      projetos já esperando (FIFO: o novo entra atrás deles)
 */
export function decidirEntrada(
  max: number,
  fimsDosOcupantes: string[],
  jaNaFila: number,
  hoje: string,
): EntradaNaFila {
  const ordenados = [...fimsDosOcupantes].sort();
  // Ocupação acima do máximo (configuração reduzida): só libera vaga após os excedentes saírem.
  const excedentes = Math.max(0, ordenados.length - max);
  const vagas = ordenados.slice(excedentes).map((d) => maxData(d, hoje));
  while (vagas.length < max) vagas.push(hoje);

  const proxima = () => {
    vagas.sort();
    const inicio = vagas[0];
    vagas[0] = somarDias(inicio, DIAS_S0_S3);
    return inicio;
  };

  for (let i = 0; i < jaNaFila; i++) proxima();
  const inicio = proxima();
  return { naFila: inicio > hoje, dataInicioPrevista: inicio };
}

/** Quantos projetos da fila podem começar agora. */
export function quantosPromover(max: number, ocupados: number, naFila: number): number {
  return Math.max(0, Math.min(naFila, max - ocupados));
}
