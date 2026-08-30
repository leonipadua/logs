import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getOfertaDaVitrine, registrarVisitaOferta } from "@/lib/data/indicacao";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function OfertaIndicadaPage({ params }: PageProps<"/indique/[token]/[slug]">) {
  const { token, slug } = await params;

  const dados = await getOfertaDaVitrine(token, slug);
  if (!dados) notFound();
  const { vitrine, oferta } = dados;

  await registrarVisitaOferta(vitrine.linkId, oferta.id);

  // A rota /whatsapp contabiliza o clique e redireciona — funciona sem JS.
  const urlContato = `/indique/${vitrine.token}/${oferta.slug}/whatsapp`;
  const temWhatsApp = Boolean(process.env.NEXT_PUBLIC_WHATSAPP_ADMIN);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <Link
        href={`/indique/${vitrine.token}`}
        className="text-body-sm text-text-secondary hover:text-text-primary"
      >
        ← Todas as ofertas
      </Link>

      <header className="flex flex-col gap-3">
        <p className="text-label uppercase tracking-wide text-text-tertiary">
          Indicado por {vitrine.nomeIndicador}
        </p>
        <h1 className="font-display text-display-md text-text-primary">{oferta.titulo}</h1>
        {oferta.resumo_publico && (
          <p className="text-body-lg text-text-secondary">{oferta.resumo_publico}</p>
        )}
      </header>

      {temWhatsApp && (
        <WhatsAppLink href={urlContato} className="self-start">
          Solicitar orçamento no WhatsApp
        </WhatsAppLink>
      )}

      {oferta.descricao_publica && (
        <p className="whitespace-pre-line text-body text-text-secondary">{oferta.descricao_publica}</p>
      )}

      {oferta.entregaveis.length > 0 && (
        <section className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-raised p-6">
          <h2 className="text-body-lg font-medium text-text-primary">O que está incluso</h2>
          <ul className="flex flex-col gap-2">
            {oferta.entregaveis.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-body text-text-secondary">
                <Check size={16} strokeWidth={1.5} aria-hidden className="mt-1 shrink-0 text-accent-text" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      <dl className="grid gap-5 sm:grid-cols-2">
        {oferta.para_quem && (
          <div>
            <dt className="text-label uppercase tracking-wide text-text-tertiary">Para quem é</dt>
            <dd className="mt-1 text-body text-text-secondary">{oferta.para_quem}</dd>
          </div>
        )}
        {oferta.resultado_esperado && (
          <div>
            <dt className="text-label uppercase tracking-wide text-text-tertiary">O que você ganha</dt>
            <dd className="mt-1 text-body text-text-secondary">{oferta.resultado_esperado}</dd>
          </div>
        )}
        {oferta.prazo_publico && (
          <div>
            <dt className="text-label uppercase tracking-wide text-text-tertiary">Prazo</dt>
            <dd className="mt-1 text-body text-text-secondary">{oferta.prazo_publico}</dd>
          </div>
        )}
        <div>
          <dt className="text-label uppercase tracking-wide text-text-tertiary">Investimento</dt>
          <dd className="mt-1 text-body text-text-secondary">
            Sob medida para o seu caso — peça um orçamento sem compromisso.
          </dd>
        </div>
      </dl>

      {temWhatsApp && (
        <div className="flex flex-col items-start gap-3 border-t border-border-subtle pt-8">
          <p className="text-body text-text-secondary">
            Me chama que a gente conversa sobre o seu caso e eu te passo o valor.
          </p>
          <WhatsAppLink href={urlContato}>Solicitar orçamento no WhatsApp</WhatsAppLink>
        </div>
      )}
    </div>
  );
}
