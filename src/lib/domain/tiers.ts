/**
 * Seleção e ancoragem dos 3 tiers (PRD §3.2). O preço sempre vem do catálogo
 * (somarModulos / aplicarCondicaoPagamento): aqui só se organiza a vitrine.
 */
import {
  aplicarCondicaoPagamento,
  modulosBloqueados,
  somarModulos,
  type ModuloPreco,
  type PrecoAgregado,
} from "./catalog";

export interface ModuloCatalogo extends ModuloPreco {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface TierCatalogo {
  id: string;
  ordem: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  moduleIds: string[];
}

export interface TierVitrine {
  id: string;
  ordem: number;
  nome: string;
  descricao: string | null;
  alvo: boolean;
  preco: PrecoAgregado;
  incluidos: { id: string; nome: string; descricao: string | null; cobreDor: boolean }[];
  /** Módulos do tier cheio que ESTE tier não tem (ancoragem). Vazio no tier cheio. */
  bloqueados: { id: string; nome: string; descricao: string | null; cobreDor: boolean }[];
}

/** O tier alvo é o do meio (ordem 2), por construção do banco. */
export function tierAlvo<T extends { ordem: number; ativo?: boolean }>(tiers: T[]): T | null {
  return tiers.find((t) => t.ordem === 2 && t.ativo !== false) ?? null;
}

/**
 * Monta os tiers ativos em ordem de ancoragem. `moduloIdsDasDores` marca o que
 * responde a uma dor do lead. O tier cheio é o de maior ordem.
 */
export function montarVitrine(
  tiers: TierCatalogo[],
  modulos: ModuloCatalogo[],
  moduloIdsDasDores: string[] = [],
): TierVitrine[] {
  const ativos = tiers.filter((t) => t.ativo).sort((a, b) => a.ordem - b.ordem);
  if (ativos.length === 0) return [];
  const porId = new Map(modulos.map((m) => [m.id, m]));
  const dores = new Set(moduloIdsDasDores);
  const cheio = ativos[ativos.length - 1];
  const idsAtivos = (ids: string[]) => ids.filter((id) => porId.get(id)?.ativo);
  const cheioIds = idsAtivos(cheio.moduleIds);

  const ref = (id: string) => {
    const m = porId.get(id)!;
    return { id, nome: m.nome, descricao: m.descricao, cobreDor: dores.has(id) };
  };

  return ativos.map((t) => {
    const ids = idsAtivos(t.moduleIds);
    return {
      id: t.id,
      ordem: t.ordem,
      nome: t.nome,
      descricao: t.descricao,
      alvo: t.ordem === 2,
      preco: somarModulos(ids.map((id) => porId.get(id)!)),
      incluidos: ids.map(ref),
      bloqueados: t.id === cheio.id ? [] : modulosBloqueados(ids, cheioIds).map(ref),
    };
  });
}

/** Preço exibido de um tier sob uma condição de pagamento do catálogo. */
export function precoComCondicao(tier: Pick<TierVitrine, "preco">, ajusteBps: number): PrecoAgregado {
  return aplicarCondicaoPagamento(tier.preco, ajusteBps);
}

/** Dores do lead que um tier NÃO cobre (útil para mostrar o que o tier cheio resolve). */
export function doresNaoCobertas(tier: TierVitrine, moduloIdsDasDores: string[]): string[] {
  const tem = new Set(tier.incluidos.map((m) => m.id));
  return moduloIdsDasDores.filter((id) => !tem.has(id));
}
