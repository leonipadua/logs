import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CriarLinkForm } from "./indicacao-forms";
import { CopiarLinkButton } from "./copiar-link-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Indicações" };

export default async function IndicacoesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: links }, { data: organizacoes }] = await Promise.all([
    supabase
      .from("referral_links")
      .select("id, nome, token, ativo, visitas, organizations(nome), referral_link_offers(cliques)")
      .order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, nome").is("arquivada_em", null).order("nome"),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-display-md text-text-primary">Indicações</h1>
        <p className="mt-2 text-body text-text-secondary">
          Cada cliente recebe um link para enviar a conhecidos. Quem abrir vê as ofertas que você
          escolher e fala com você pelo WhatsApp — sem preço na página.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Novo link</h2>
        <CriarLinkForm organizacoes={organizacoes ?? []} />
      </Card>

      {!links || links.length === 0 ? (
        <EmptyState
          title="Nenhum link de indicação ainda"
          description="Crie o primeiro link acima e escolha quais ofertas ele mostra."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {links.map((link) => {
            const org = Array.isArray(link.organizations) ? link.organizations[0] : link.organizations;
            const cliques = (link.referral_link_offers ?? []).reduce((soma, o) => soma + o.cliques, 0);
            const url = `${baseUrl}/indique/${link.token}`;

            return (
              <Card key={link.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/indicacoes/${link.id}`}
                      className="font-medium text-text-primary hover:underline"
                    >
                      {link.nome}
                    </Link>
                    <p className="text-body-sm text-text-tertiary">{org?.nome ?? "—"}</p>
                    <p className="mt-2 truncate font-mono text-mono-sm text-text-secondary">{url}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="tabular-nums text-body-sm text-text-secondary">
                      {link.visitas} visita(s) · {cliques} contato(s)
                    </span>
                    {!link.ativo && <Badge tone="blocked">inativo</Badge>}
                    <CopiarLinkButton url={url} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
