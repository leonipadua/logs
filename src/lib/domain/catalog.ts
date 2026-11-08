/**
 * Regras puras do catálogo. O preço de um tier é SEMPRE a soma dos módulos
 * que o compõem (espelha public.calc_tier_preco no banco). Não existe preço
 * por proposta (PRD §7.1).
 */

export interface ModuloPreco {
  ativo: boolean;
  preco_implementacao_centavos: number;
  mensalidade_centavos: number;
  horas_estimadas: number;
}

export interface PrecoAgregado {
  implementacaoCentavos: number;
  mensalidadeCentavos: number;
  horas: number;
}

/** Soma apenas módulos ativos (igual ao calc_tier_preco). */
export function somarModulos(modulos: ModuloPreco[]): PrecoAgregado {
  return modulos
    .filter((m) => m.ativo)
    .reduce<PrecoAgregado>(
      (acc, m) => ({
        implementacaoCentavos: acc.implementacaoCentavos + m.preco_implementacao_centavos,
        mensalidadeCentavos: acc.mensalidadeCentavos + m.mensalidade_centavos,
        horas: acc.horas + Number(m.horas_estimadas),
      }),
      { implementacaoCentavos: 0, mensalidadeCentavos: 0, horas: 0 },
    );
}

/** Aplica o ajuste da condição de pagamento (pontos-base) só na implementação. */
export function aplicarCondicaoPagamento(preco: PrecoAgregado, ajusteBps: number): PrecoAgregado {
  return {
    ...preco,
    implementacaoCentavos: Math.round((preco.implementacaoCentavos * (10000 + ajusteBps)) / 10000),
  };
}

/** Módulos que o tier superior libera e o inferior não tem (o que "fica bloqueado"). */
export function modulosBloqueados(idsDoTier: string[], idsDoTierCheio: string[]): string[] {
  const tem = new Set(idsDoTier);
  return idsDoTierCheio.filter((id) => !tem.has(id));
}
