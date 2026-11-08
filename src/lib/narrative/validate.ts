import type { NarrativeInput, NarrativeOutput } from "./types";

/**
 * Barreira de segurança da saída de IA: a narrativa não pode conter dinheiro,
 * percentual, número, desconto, nome de tier nem promessa. Falhou = descarta e
 * cai no template.
 */
const PROIBIDOS: RegExp[] = [
  /R\$/i,
  /\breais?\b/i,
  /\d/, // nenhum número: valores e projeções vêm das regras, não do texto
  /%|por\s*cento/i,
  /\b(desconto|gr[aá]tis|gratuit[oa]|de gra[cç]a|promo[cç][aã]o|barato|econom(ia|ize)|pre[cç]o|valor(es)?|mensalidade|parcela[sd]?|investimento|tier|plano)\b/i,
  /\b(essencial|completo|escala)\b/i,
  /\b(garant[ei]\w*|prometemos|sem\s+risco|resultado\s+certo)\b/i,
];

const MAX_ABERTURA = 600;
const MAX_ITEM = 700;
const MAX_FECHAMENTO = 400;

export function textoSeguro(t: unknown, max: number): t is string {
  return typeof t === "string" && t.trim().length > 0 && t.length <= max && !PROIBIDOS.some((r) => r.test(t));
}

/**
 * Valida e normaliza a saída bruta. Só aceita os módulos/dores que vieram na
 * entrada (a IA não inclui nem remove escopo). Retorna null se algo falhar.
 */
export function validarNarrativa(bruta: unknown, input: NarrativeInput): NarrativeOutput | null {
  if (!bruta || typeof bruta !== "object") return null;
  const o = bruta as Record<string, unknown>;
  if (!textoSeguro(o.abertura, MAX_ABERTURA) || !textoSeguro(o.fechamento, MAX_FECHAMENTO)) return null;
  if (!Array.isArray(o.itens)) return null;

  const esperados = new Map(input.dores.map((d) => [d.moduleId, d]));
  const itens: NarrativeOutput["itens"] = [];
  for (const bruto of o.itens) {
    if (!bruto || typeof bruto !== "object") return null;
    const i = bruto as Record<string, unknown>;
    if (typeof i.moduleId !== "string") return null;
    const dor = esperados.get(i.moduleId);
    if (!dor) return null; // módulo fora do escopo definido pela regra
    if (!textoSeguro(i.texto, MAX_ITEM)) return null;
    if (itens.some((x) => x.moduleId === i.moduleId)) return null;
    // A dor exibida é a capturada pelo cockpit, não a reescrita pela IA.
    itens.push({ moduleId: dor.moduleId, painId: dor.painId, dor: dor.descricao, texto: i.texto.trim() });
  }
  const modulosEsperados = new Set(input.dores.map((d) => d.moduleId));
  if (itens.length !== modulosEsperados.size) return null;

  return { abertura: o.abertura.trim(), itens, fechamento: o.fechamento.trim(), origem: "claude" };
}
