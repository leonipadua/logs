import type { NarrativeInput, NarrativeOutput, NarrativeProvider } from "./types";

/** Texto local, determinístico, por dor -> módulo. Padrão quando não há chave de IA. */
export class TemplateNarrativeProvider implements NarrativeProvider {
  readonly nome = "template" as const;

  async gerar(input: NarrativeInput): Promise<NarrativeOutput> {
    const onde = [input.segmento, input.cidade].filter(Boolean).join(" em ");
    const abertura = onde
      ? `Esta proposta foi montada a partir da conversa com a ${input.organizacaoNome} (${onde}). Cada seção abaixo parte de uma dor que você descreveu.`
      : `Esta proposta foi montada a partir da conversa com a ${input.organizacaoNome}. Cada seção abaixo parte de uma dor que você descreveu.`;

    const vistos = new Set<string>();
    const itens = input.dores
      .filter((d) => (vistos.has(d.moduleId) ? false : (vistos.add(d.moduleId), true)))
      .map((d) => ({
        moduleId: d.moduleId,
        painId: d.painId,
        dor: d.descricao,
        texto: `Para essa dor, o módulo “${d.moduloNome}” entra no seu fluxo. ${
          d.moduloDescricao ? d.moduloDescricao.replace(/^Provisório\.\s*/i, "") : "Ele resolve o ponto descrito acima."
        }`,
      }));

    return {
      abertura,
      itens,
      fechamento:
        "Os três formatos abaixo cobrem o mesmo problema em profundidades diferentes. O do meio é o que recomendamos para o que você nos contou.",
      origem: "template",
    };
  }
}
