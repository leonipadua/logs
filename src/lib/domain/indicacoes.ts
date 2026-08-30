import { randomBytes } from "node:crypto";

/**
 * Vitrine de indicações: um cliente envia seu link único para um conhecido,
 * que vira lead ao clicar no WhatsApp. Toda a decisão de texto e ordenação
 * mora aqui para poder ser testada sem banco.
 */

/**
 * Token curto e colável, sem `+` nem `/` que quebram em URL. 8 bytes dão
 * ~1.8e19 combinações — inadivinhável sem ser um link feio de copiar.
 */
export function gerarTokenIndicacao(): string {
  return randomBytes(8).toString("base64url");
}

/**
 * Mensagem que já vai preenchida no WhatsApp. Cita quem indicou (é o que
 * abre a conversa) e a oferta, quando o lead veio de uma página de detalhe.
 */
export function montarMensagemWhatsApp({
  nomeIndicador,
  tituloOferta,
}: {
  nomeIndicador: string;
  tituloOferta?: string | null;
}): string {
  if (tituloOferta) {
    return `Olá! Vim pela indicação de ${nomeIndicador} e quero saber mais sobre "${tituloOferta}".`;
  }
  return `Olá! Vim pela indicação de ${nomeIndicador} e quero conhecer o que a Sabre pode fazer.`;
}

/** Link wa.me com a mensagem pré-preenchida. */
export function montarUrlWhatsApp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export type ItemVitrine = {
  ordem: number;
  titulo: string;
};

/**
 * Ordem de exibição da vitrine: o `ordem` definido pelo admin manda; quando
 * empata (o padrão é todo mundo em 0), cai para ordem alfabética, para o
 * resultado não depender da ordem que o banco devolveu.
 */
export function ordenarVitrine<T extends ItemVitrine>(itens: readonly T[]): T[] {
  return [...itens].sort(
    (a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

/**
 * Os campos que o lead vê. Uma oferta sem `resumo_publico` aparece na vitrine
 * como um card mudo — o admin precisa ser avisado antes de divulgar o link.
 */
export function ofertaProntaParaVitrine(oferta: {
  resumo_publico?: string | null;
  descricao_publica?: string | null;
}): boolean {
  return Boolean(oferta.resumo_publico?.trim() && oferta.descricao_publica?.trim());
}

/**
 * O textarea do admin recebe um item por linha; o banco guarda um array.
 * Linhas vazias e hífens decorativos que o admin costuma colar são descartados.
 */
export function parseEntregaveis(texto: string): string[] {
  return texto
    .split("\n")
    .map((linha) => linha.trim().replace(/^[-•*]\s*/, "").trim())
    .filter((linha) => linha.length > 0);
}

/** Caminho inverso: array do banco de volta para o textarea. */
export function formatarEntregaveis(entregaveis: readonly string[]): string {
  return entregaveis.join("\n");
}
