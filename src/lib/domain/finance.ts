/**
 * Lógica financeira pura (E5). Sem acesso a banco: recebe as linhas já lidas
 * e devolve números. Todas as definições seguem a tabela de métricas do PRD
 * §E5 — receita realizada vs. prevista são grandezas distintas e nunca são
 * somadas num único número sem rótulo pela UI.
 */

const DIA_MS = 86_400_000;

/** Primeiro instante e último instante do mês de `base`. */
export function janelaDoMes(base: Date = new Date()): { inicio: Date; fim: Date } {
  const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
  const fim = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59);
  return { inicio, fim };
}

/**
 * Data (YYYY-MM-DD) a partir da qual uma cobrança vencida conta como
 * inadimplência: vencida há mais de 3 dias corridos (PRD §E5).
 */
export function limiteInadimplenciaISODate(agora: Date = new Date()): string {
  return new Date(agora.getTime() - 3 * DIA_MS).toISOString().slice(0, 10);
}

/** Dias corridos entre `vencimento` e `agora` (negativo se ainda não venceu). */
export function diasEmAtraso(vencimento: string | Date, agora: Date = new Date()): number {
  return Math.floor((agora.getTime() - new Date(vencimento).getTime()) / DIA_MS);
}

function somaCentavos(linhas: { valor_centavos: number }[]): number {
  return linhas.reduce((acc, l) => acc + l.valor_centavos, 0);
}

/**
 * MRR: soma dos valores das assinaturas passadas. O chamador é responsável
 * por filtrar apenas assinaturas `ativa` com valor > 0 — assinatura de R$ 0
 * não entra no MRR (PRD §E4/§E5).
 */
export function calcularMrr(assinaturas: { valor_centavos: number }[]): number {
  return somaCentavos(assinaturas);
}

/** Receita realizada do mês: soma das cobranças `paga` com pagamento no mês. */
export function calcularReceitaRealizada(cobrancasPagasNoMes: { valor_centavos: number }[]): number {
  return somaCentavos(cobrancasPagasNoMes);
}

/**
 * Receita prevista do mês: realizada + cobranças `pendente`/`agendada` com
 * vencimento no mês.
 */
export function calcularReceitaPrevista(
  receitaRealizada: number,
  cobrancasPendentesNoMes: { valor_centavos: number }[],
): number {
  return receitaRealizada + somaCentavos(cobrancasPendentesNoMes);
}

/** LTV de um cliente: soma de tudo que a organização já pagou. */
export function calcularLtv(cobrancas: { status: string; valor_centavos: number }[]): number {
  return somaCentavos(cobrancas.filter((c) => c.status === "paga"));
}
