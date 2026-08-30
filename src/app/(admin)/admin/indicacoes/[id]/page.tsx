import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { excluirLinkAction } from "@/lib/actions/indicacao-actions";
import { ofertaProntaParaVitrine } from "@/lib/domain/indicacoes";
import { AlternarLinkForm } from "../indicacao-forms";
import { CopiarLinkButton } from "../copiar-link-button";
import { AlternarOfertaForm, OrdemForm } from "./vitrine-forms";

export const dynamic = "force-dynamic";

export default async function VitrineAdminPage({ params }: PageProps<"/admin/indicacoes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: link }, { data: ofertas }] = await Promise.all([
    supabase
      .from("referral_links")
      .select("id, nome, token, ativo, visitas, organizations(nome), referral_link_offers(offer_id, ordem, visitas, cliques)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("offers")
      .select("id, slug, titulo, ativa, resumo_publico, descricao_publica")
      .order("titulo"),
  ]);

  if (!link) notFound();

  const org = Array.isArray(link.organizations) ? link.organizations[0] : link.organizations;
  const curadoria = new Map(
    (link.referral_link_offers ?? []).map((linha) => [linha.offer_id, linha]),
  );
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/indique/${link.token}`;
  const totalCliques = (link.referral_link_offers ?? []).reduce((soma, o) => soma + o.cliques, 0);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/indicacoes" className="text-body-sm text-text-secondary hover:text-text-primary">
        ← Indicações
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-display-md text-text-primary">{link.nome}</h1>
          <p className="text-body-sm text-text-tertiary">{org?.nome ?? "—"}</p>
        </div>
        {!link.ativo && <Badge tone="blocked">inativo</Badge>}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-label uppercase tracking-wide text-text-tertiary">Link para o cliente enviar</p>
            <p className="mt-1 truncate font-mono text-mono-sm text-text-primary">{url}</p>
            <p className="mt-2 tabular-nums text-body-sm text-text-secondary">
              {link.visitas} visita(s) · {totalCliques} contato(s) no WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CopiarLinkButton url={url} />
            <AlternarLinkForm referralLinkId={link.id} ativo={link.ativo} />
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-body-lg font-medium text-text-primary">Ofertas desta vitrine</h2>
        <p className="mt-1 text-body-sm text-text-secondary">
          Marque o que aparece para quem abrir este link. O indicado não vê preço — só o conteúdo
          público de cada oferta.
        </p>
      </div>

      {!ofertas || ofertas.length === 0 ? (
        <EmptyState
          title="Nenhuma oferta no catálogo"
          description="Crie ofertas em /admin/ofertas antes de montar a vitrine."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ofertas.map((oferta) => {
            const selecionada = curadoria.get(oferta.id);
            const pronta = ofertaProntaParaVitrine(oferta);

            return (
              <Card key={oferta.id} className={selecionada ? "border-accent" : undefined}>
                <div className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/admin/ofertas/${oferta.id}`}
                      className="font-medium text-text-primary hover:underline"
                    >
                      {oferta.titulo}
                    </Link>
                    {!oferta.ativa && <Badge tone="blocked">inativa</Badge>}
                  </div>

                  <p className="text-body-sm text-text-secondary">
                    {oferta.resumo_publico || (
                      <span className="text-text-tertiary">Sem resumo público.</span>
                    )}
                  </p>

                  {!pronta && (
                    <p className="text-body-sm text-state-blocked">
                      Falta conteúdo público —{" "}
                      <Link href={`/admin/ofertas/${oferta.id}`} className="underline">
                        preencher antes de divulgar
                      </Link>
                      .
                    </p>
                  )}

                  {selecionada && (
                    <p className="tabular-nums text-body-sm text-text-tertiary">
                      {selecionada.visitas} visita(s) · {selecionada.cliques} contato(s)
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <AlternarOfertaForm
                      referralLinkId={link.id}
                      offerId={oferta.id}
                      selecionada={Boolean(selecionada)}
                    />
                    {selecionada && (
                      <OrdemForm
                        referralLinkId={link.id}
                        offerId={oferta.id}
                        ordem={selecionada.ordem}
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-state-blocked/40">
        <h2 className="text-body-lg font-medium text-text-primary">Zona de risco</h2>
        <p className="mt-1 mb-4 text-body-sm text-text-secondary">
          Excluir apaga o link e todo o histórico de visitas e contatos dele.
        </p>
        <ConfirmDeleteButton
          action={excluirLinkAction}
          hiddenFields={{ referralLinkId: link.id }}
          title={`Excluir o link de ${link.nome}?`}
          description="O link já enviado para conhecidos deixa de funcionar imediatamente, e as visitas e contatos registrados são perdidos. Para apenas pausar, use “Desativar link”."
          triggerLabel="Excluir link"
        />
      </Card>
    </div>
  );
}
