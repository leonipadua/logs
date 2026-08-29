/**
 * Máquina de estados de uma oferta de projeto (PRD §E3).
 *
 *   rascunho ──publicar──> disponivel ──cliente clica──> em_negociacao
 *                              │                              │
 *                              │                        pagamento confirmado
 *                              ▼                              ▼
 *                           removida                     desbloqueada
 *
 * `desbloquear` pode partir tanto de `disponivel` (desbloqueio manual do
 * admin, sem pagamento) quanto de `em_negociacao` (webhook de pagamento).
 * `em_negociacao` volta a `disponivel` quando o pagamento falha.
 */
export type EstadoOferta =
  | "rascunho"
  | "disponivel"
  | "em_negociacao"
  | "desbloqueada"
  | "removida";

export const TRANSICOES_OFERTA: Record<EstadoOferta, readonly EstadoOferta[]> = {
  rascunho: ["disponivel", "removida"],
  disponivel: ["em_negociacao", "desbloqueada", "removida"],
  em_negociacao: ["disponivel", "desbloqueada", "removida"],
  desbloqueada: [],
  removida: [],
};

/** Estados terminais: nenhuma transição sai deles. */
export function ehTerminal(estado: EstadoOferta): boolean {
  return TRANSICOES_OFERTA[estado].length === 0;
}

/** `true` se a oferta pode ir de `de` para `para`. */
export function podeTransicionar(de: EstadoOferta, para: EstadoOferta): boolean {
  return TRANSICOES_OFERTA[de].includes(para);
}
