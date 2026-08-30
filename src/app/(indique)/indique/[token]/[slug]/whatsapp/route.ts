import { NextResponse } from "next/server";
import { getOfertaDaVitrine, registrarCliqueOferta } from "@/lib/data/indicacao";
import { montarMensagemWhatsApp, montarUrlWhatsApp } from "@/lib/domain/indicacoes";

/**
 * Contabiliza o clique e redireciona para o wa.me. É um redirect de servidor,
 * e não um handler onClick, para o contador funcionar mesmo sem JS e para o
 * número do WhatsApp não precisar existir no HTML da página.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/indique/[token]/[slug]/whatsapp">,
) {
  const { token, slug } = await params;

  const dados = await getOfertaDaVitrine(token, slug);
  if (!dados) return new NextResponse("Não encontrado", { status: 404 });

  const numero = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN;
  if (!numero) return new NextResponse("Contato indisponível", { status: 404 });

  await registrarCliqueOferta(dados.vitrine.linkId, dados.oferta.id);

  const mensagem = montarMensagemWhatsApp({
    nomeIndicador: dados.vitrine.nomeIndicador,
    tituloOferta: dados.oferta.titulo,
  });

  return NextResponse.redirect(montarUrlWhatsApp(numero, mensagem), 302);
}
