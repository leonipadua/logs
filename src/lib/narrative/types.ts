/**
 * NarrativeProvider: escreve SÓ texto (PRD §7.2, DECISOES_V2 #4). A entrada não
 * carrega preço, tier nem desconto, e a saída é validada para não conter nenhum.
 */
export interface DorNarrativa {
  painId: string;
  moduleId: string;
  /** Nome do módulo do catálogo (sem preço). */
  moduloNome: string;
  moduloDescricao: string | null;
  tipoSpin: string;
  descricao: string;
}

export interface NarrativeInput {
  organizacaoNome: string;
  segmento?: string | null;
  cidade?: string | null;
  dores: DorNarrativa[];
}

export interface ItemNarrativa {
  moduleId: string;
  painId: string | null;
  /** A dor, nas palavras do lead, para a seção "o que você nos contou". */
  dor: string;
  /** Texto que liga a dor ao módulo. */
  texto: string;
}

export interface NarrativeOutput {
  abertura: string;
  itens: ItemNarrativa[];
  fechamento: string;
  /** Quem gerou: "template" ou "claude". */
  origem: "template" | "claude";
}

export interface NarrativeProvider {
  readonly nome: "template" | "claude";
  gerar(input: NarrativeInput): Promise<NarrativeOutput>;
}
