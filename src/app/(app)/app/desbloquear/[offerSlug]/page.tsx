import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOfertaPorSlug } from "@/lib/data/project";
import { formatCentavosBRL } from "@/lib/format";
import { ImpressaoTracker, IniciarDesbloqueioForm } from "./desbloqueio-forms";

export const dynamic = "force-dynamic";

export default async function DesbloquearPage({ params }: PageProps<"/app/desbloquear/[offerSlug]">) {
  await requireUser();
  const { offerSlug } = await params;

  const dados = await getOfertaPorSlug(offerSlug);
  if (!dados || dados.oferta.status === "rascunho" || dados.oferta.status === "removida") notFound();
  const { oferta, projeto } = dados;

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN;
  const mensagem = encodeURIComponent(`Olá! Quero saber mais sobre "${oferta.titulo}" no projeto ${projeto.nome}.`);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <ImpressaoTracker projectOfferId={oferta.id} />
      <Link href={`/app/projetos/${projeto.slug}`} className="text-body-sm text-text-secondary hover:text-text-primary">
        ← {projeto.nome}
      </Link>

      <div>
        <p className="text-label uppercase tracking-wide text-text-tertiary">{oferta.titulo}</p>
        <h1 className="font-display text-display-md text-text-primary">{oferta.insight}</h1>
      </div>

      {oferta.descricao_entrega && <p className="text-body-lg text-text-secondary">{oferta.descricao_entrega}</p>}

      <div className="flex items-baseline gap-4 rounded-md border border-border-subtle bg-surface-raised p-5">
        <span className="tabular-nums font-display text-display-sm text-text-primary">
          {formatCentavosBRL(oferta.preco_centavos)}
        </span>
        {oferta.prazo_estimado_dias && (
          <span className="text-body-sm text-text-tertiary">prazo estimado de {oferta.prazo_estimado_dias} dias</span>
        )}
      </div>

      {oferta.status === "em_negociacao" ? (
        <p className="text-body text-state-progress">
          Seu pedido está registrado. Assim que o pagamento for confirmado, a etapa é liberada automaticamente.
        </p>
      ) : oferta.status === "desbloqueada" ? (
        <p className="text-body text-state-done">Esta oferta já foi desbloqueada e faz parte do seu projeto.</p>
      ) : (
        <IniciarDesbloqueioForm projectOfferId={oferta.id} />
      )}

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${mensagem}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <MessageCircle size={16} strokeWidth={1.5} />
          Entrar em contato
        </a>
      )}
    </div>
  );
}
