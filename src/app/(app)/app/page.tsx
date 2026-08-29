import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listProjetosDoUsuario } from "@/lib/data/project";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const sessao = await requireUser();
  const projetos = await listProjetosDoUsuario(sessao.userId);

  if (projetos.length === 1) {
    redirect(`/app/projetos/${projetos[0].slug}`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <h1 className="font-display text-display-md text-text-primary">Olá, {sessao.perfil.nome}</h1>

      {projetos.length === 0 ? (
        <EmptyState
          title="Seu projeto está sendo montado"
          description="A Sabre está preparando as primeiras etapas. Você recebe um aviso assim que a timeline estiver pronta."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-label uppercase text-text-tertiary">Seus projetos</h2>
          {projetos.map((p) => (
            <Card key={p.id}>
              <Link href={`/app/projetos/${p.slug}`} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{p.nome}</p>
                  <p className="text-body-sm text-text-tertiary">{p.organizacaoNome}</p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
