/**
 * Regras puras do cockpit (PRD §3.1): SPIN estruturado, mapeamento dor -> módulo
 * por regra e qualificação BANT. Nada aqui define preço: o módulo mapeado só
 * aponta para o catálogo.
 */

export const TIPOS_SPIN = ["situacao", "problema", "implicacao", "necessidade"] as const;
export type TipoSpinDominio = (typeof TIPOS_SPIN)[number];

export const TIPO_SPIN_LABEL: Record<TipoSpinDominio, string> = {
  situacao: "Situação",
  problema: "Problema",
  implicacao: "Implicação",
  necessidade: "Necessidade",
};

/** Unidades aceitas na captura numérica (coluna pains.unidade). */
export const UNIDADES = ["leads_mes", "brl_mes", "horas_mes", "ticket_medio_brl"] as const;
export type Unidade = (typeof UNIDADES)[number];

export const UNIDADE_LABEL: Record<Unidade, string> = {
  leads_mes: "leads perdidos por mês",
  brl_mes: "R$ perdidos por mês",
  horas_mes: "horas gastas por mês",
  ticket_medio_brl: "ticket médio (R$)",
};

export function ehUnidade(v: unknown): v is Unidade {
  return typeof v === "string" && (UNIDADES as readonly string[]).includes(v);
}

/** Implicação exige número + unidade (espelha a constraint pain_implicacao_exige_numero). */
export function implicacaoValida(p: {
  tipo_spin: string;
  valor_numerico: number | null;
  unidade: string | null;
}): boolean {
  if (p.tipo_spin !== "implicacao") return true;
  return p.valor_numerico !== null && Number.isFinite(p.valor_numerico) && p.unidade !== null && ehUnidade(p.unidade);
}

// --- Mapeamento dor -> módulo (por regra) ---------------------------------

export interface ModuloGatilho {
  id: string;
  ativo: boolean;
  dores_gatilho: string[];
}

export function normalizarTag(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/** Todas as categorias de dor conhecidas (união dos gatilhos dos módulos ativos). */
export function categoriasDisponiveis(modulos: ModuloGatilho[]): string[] {
  const set = new Set<string>();
  for (const m of modulos) {
    if (!m.ativo) continue;
    for (const t of m.dores_gatilho) set.add(normalizarTag(t));
  }
  return [...set].sort();
}

/**
 * Regra: o módulo ativo cujo gatilho contém a categoria da dor. Em caso de
 * empate vence o primeiro na ordem recebida (estável). Sem categoria, sem módulo.
 */
export function mapearDorParaModulo(categoria: string | null | undefined, modulos: ModuloGatilho[]): string | null {
  if (!categoria) return null;
  const alvo = normalizarTag(categoria);
  if (!alvo) return null;
  const achado = modulos.find((m) => m.ativo && m.dores_gatilho.some((t) => normalizarTag(t) === alvo));
  return achado?.id ?? null;
}

// --- BANT -----------------------------------------------------------------

export const CRITERIOS_BANT = ["budget", "authority", "need", "timing"] as const;
export type CriterioBant = (typeof CRITERIOS_BANT)[number];
export type RespostaBant = "sim" | "parcial" | "nao";

export const CRITERIO_BANT_LABEL: Record<CriterioBant, string> = {
  budget: "Budget · orçamento",
  authority: "Authority · decisor",
  need: "Need · necessidade",
  timing: "Timing · prazo",
};

export interface CriterioBantValor {
  resposta?: RespostaBant;
  nota?: string;
}
export type Bant = Partial<Record<CriterioBant, CriterioBantValor>>;

export type VereditoBant = "proposta" | "nutrir" | "sair" | "incompleto";

export interface AvaliacaoBant {
  veredito: VereditoBant;
  sim: number;
  faltam: CriterioBant[];
  motivo: string;
}

export function lerBant(json: unknown): Bant {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const out: Bant = {};
  for (const c of CRITERIOS_BANT) {
    const v = (json as Record<string, unknown>)[c];
    if (!v || typeof v !== "object") continue;
    const r = (v as Record<string, unknown>).resposta;
    const n = (v as Record<string, unknown>).nota;
    out[c] = {
      resposta: r === "sim" || r === "parcial" || r === "nao" ? r : undefined,
      nota: typeof n === "string" && n.trim() ? n.trim() : undefined,
    };
  }
  return out;
}

/**
 * Regra de decisão (lado a lado no cockpit):
 *  - sem os 4 critérios respondidos: incompleto;
 *  - need ou budget = não: sai do funil (sem dor ou sem verba não há proposta);
 *  - authority ou timing = não: nutrir (achar o decisor / esperar o momento);
 *  - demais: proposta se ao menos 3 forem "sim", senão nutrir.
 */
export function avaliarBant(bant: Bant): AvaliacaoBant {
  const faltam = CRITERIOS_BANT.filter((c) => !bant[c]?.resposta);
  const sim = CRITERIOS_BANT.filter((c) => bant[c]?.resposta === "sim").length;
  if (faltam.length > 0) {
    return { veredito: "incompleto", sim, faltam, motivo: "Responda os quatro critérios para decidir." };
  }
  if (bant.need?.resposta === "nao") {
    return { veredito: "sair", sim, faltam, motivo: "Sem necessidade clara, não há o que propor." };
  }
  if (bant.budget?.resposta === "nao") {
    return { veredito: "sair", sim, faltam, motivo: "Sem orçamento, a proposta não fecha." };
  }
  if (bant.authority?.resposta === "nao") {
    return { veredito: "nutrir", sim, faltam, motivo: "Falta chegar ao decisor." };
  }
  if (bant.timing?.resposta === "nao") {
    return { veredito: "nutrir", sim, faltam, motivo: "O momento ainda não é este." };
  }
  if (sim >= 3) return { veredito: "proposta", sim, faltam, motivo: "Qualificado para proposta." };
  return { veredito: "nutrir", sim, faltam, motivo: "Qualificação parcial: aprofunde antes de propor." };
}

export const ESTAGIOS = ["prospeccao", "conexao", "diagnostico", "proposta", "fechado", "cliente"] as const;
export type Estagio = (typeof ESTAGIOS)[number];
export const ESTAGIO_LABEL: Record<Estagio, string> = {
  prospeccao: "Prospecção",
  conexao: "Conexão",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  fechado: "Fechado",
  cliente: "Cliente",
};

/** Slug de organização a partir do nome, com sufixo para evitar colisão. */
export function slugDeNome(nome: string, sufixo: string): string {
  const base = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "lead"}-${sufixo}`;
}
