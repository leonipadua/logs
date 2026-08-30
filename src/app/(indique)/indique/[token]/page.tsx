import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getVitrinePorToken, registrarVisitaVitrine } from "@/lib/data/indicacao";
import { montarMensagemWhatsApp, montarUrlWhatsApp } from "@/lib/domain/indicacoes";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function VitrinePage({ params }: PageProps<"/indique/[token]">) {
  const { token } = await params;

  const vitrine = await getVitrinePorToken(token);
  if (!vitrine) notFound();

  await registrarVisitaVitrine(vitrine.linkId);

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN;
  const urlWhatsApp = whatsapp
    ? montarUrlWhatsApp(whatsapp, montarMensagemWhatsApp({ nomeIndicador: vitrine.nomeIndicador }))
    : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-label uppercase tracking-wide text-text-tertiary">
          Indicado por {vitrine.nomeIndicador}
        </p>
        <h1 className="font-display text-display-md text-text-primary">
          O que a Sabre pode fazer pelo seu negócio
        </h1>
        <p className="text-body-lg text-text-secondary">
          {vitrine.nomeIndicador} trabalha com a gente e achou que isso aqui faria sentido para você.
          Escolha o que te interessa e fale direto comigo no WhatsApp — sem formulário, sem robô.
        </p>
      </header>

      {vitrine.ofertas.length === 0 ? (
        <p className="text-body text-text-secondary">
          Ainda não há nada publicado nesta página. Fale comigo no WhatsApp que eu te conto o que dá para fazer.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vitrine.ofertas.map((oferta) => (
            <Link
              key={oferta.id}
              href={`/indique/${vitrine.token}/${oferta.slug}`}
              className="group flex flex-col gap-2 rounded-md border border-border-subtle bg-surface-raised p-5 transition-colors duration-[120ms] hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            >
              <h2 className="text-body-lg font-medium text-text-primary">{oferta.titulo}</h2>
              {oferta.resumo_publico && (
                <p className="text-body-sm text-text-secondary">{oferta.resumo_publico}</p>
              )}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-body-sm text-accent-text">
                Ver detalhes
                <ArrowRight size={14} strokeWidth={1.5} aria-hidden className="transition-transform duration-[120ms] group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {urlWhatsApp && (
        <div className="flex flex-col items-start gap-3 border-t border-border-subtle pt-8">
          <p className="text-body text-text-secondary">Prefere já conversar?</p>
          <WhatsAppLink href={urlWhatsApp}>Falar com a Sabre no WhatsApp</WhatsAppLink>
        </div>
      )}
    </div>
  );
}
