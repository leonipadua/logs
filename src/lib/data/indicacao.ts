import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ordenarVitrine } from "@/lib/domain/indicacoes";

/**
 * Leitura da vitrine pública. Quem abre o link não tem sessão, e as tabelas de
 * indicação não têm política para `anon` de propósito — expor `referral_links`
 * ao anônimo revelaria a lista inteira de clientes que indicam. Por isso a
 * consulta roda com service_role e devolve só os campos que o lead pode ver:
 * nada de preço, nada de dado do cliente que indicou além do nome.
 */

export type OfertaDaVitrine = {
  id: string;
  slug: string;
  titulo: string;
  ordem: number;
  resumo_publico: string | null;
};

export type Vitrine = {
  linkId: string;
  token: string;
  nomeIndicador: string;
  ofertas: OfertaDaVitrine[];
};

/** `null` quando o token não existe ou o link foi desativado. */
export async function getVitrinePorToken(token: string): Promise<Vitrine | null> {
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("referral_links")
    .select("id, token, nome, ativo, referral_link_offers(ordem, offers(id, slug, titulo, ativa, resumo_publico))")
    .eq("token", token)
    .maybeSingle();

  if (!link || !link.ativo) return null;

  type LinhaCuradoria = {
    ordem: number;
    offers: { id: string; slug: string; titulo: string; ativa: boolean; resumo_publico: string | null } | null;
  };

  const ofertas = (link.referral_link_offers as unknown as LinhaCuradoria[])
    .flatMap((linha) => {
      const oferta = linha.offers;
      // Oferta desativada no catálogo some da vitrine sem o admin precisar
      // desmarcá-la link a link.
      if (!oferta || !oferta.ativa) return [];
      return [{
        id: oferta.id,
        slug: oferta.slug,
        titulo: oferta.titulo,
        ordem: linha.ordem,
        resumo_publico: oferta.resumo_publico,
      }];
    });

  return {
    linkId: link.id,
    token: link.token,
    nomeIndicador: link.nome,
    ofertas: ordenarVitrine(ofertas),
  };
}

export type OfertaPublica = {
  id: string;
  slug: string;
  titulo: string;
  resumo_publico: string | null;
  descricao_publica: string | null;
  entregaveis: string[];
  para_quem: string | null;
  resultado_esperado: string | null;
  prazo_publico: string | null;
};

/**
 * Detalhe de uma oferta *dentro* de uma vitrine. Uma oferta que não está na
 * curadoria daquele link não é acessível pela URL direta.
 */
export async function getOfertaDaVitrine(
  token: string,
  slug: string,
): Promise<{ vitrine: Vitrine; oferta: OfertaPublica } | null> {
  const vitrine = await getVitrinePorToken(token);
  if (!vitrine) return null;
  if (!vitrine.ofertas.some((o) => o.slug === slug)) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("offers")
    .select("id, slug, titulo, resumo_publico, descricao_publica, entregaveis, para_quem, resultado_esperado, prazo_publico")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;

  return {
    vitrine,
    oferta: {
      ...data,
      entregaveis: Array.isArray(data.entregaveis) ? (data.entregaveis as string[]) : [],
    },
  };
}

/** Contadores de vaidade do admin — falha silenciosa, nunca derruba a página. */
export async function registrarVisitaVitrine(linkId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("referral_links").select("visitas").eq("id", linkId).single();
  if (data) await admin.from("referral_links").update({ visitas: data.visitas + 1 }).eq("id", linkId);
}

export async function registrarVisitaOferta(linkId: string, offerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_link_offers")
    .select("visitas")
    .eq("referral_link_id", linkId)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (data) {
    await admin
      .from("referral_link_offers")
      .update({ visitas: data.visitas + 1 })
      .eq("referral_link_id", linkId)
      .eq("offer_id", offerId);
  }
}

export async function registrarCliqueOferta(linkId: string, offerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_link_offers")
    .select("cliques")
    .eq("referral_link_id", linkId)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (data) {
    await admin
      .from("referral_link_offers")
      .update({ cliques: data.cliques + 1 })
      .eq("referral_link_id", linkId)
      .eq("offer_id", offerId);
  }
}
