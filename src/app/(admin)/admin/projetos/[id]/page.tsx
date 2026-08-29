import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { excluirProjetoAction } from "@/lib/actions/project-actions";
import { excluirFaseAction } from "@/lib/actions/phase-actions";
import { excluirTaskAction } from "@/lib/actions/task-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCentavosBRL } from "@/lib/format";
import {
  EditarProjetoForm,
  CriarFaseForm,
  EditarFaseForm,
  CriarTaskForm,
  StatusTaskSelect,
  EditarTaskModal,
} from "./project-forms";
import { PublicarOfertaForm, RemoverOfertaButton, DesbloquearManualButton } from "./offer-admin-forms";
import { SimularWebhookForm } from "./webhook-sim-form";

const OFERTA_STATUS_TONE = {
  disponivel: "locked",
  em_negociacao: "progress",
  desbloqueada: "done",
  rascunho: "neutral",
  removida: "blocked",
} as const;

export const dynamic = "force-dynamic";

export default async function ProjetoDetailPage({ params }: PageProps<"/admin/projetos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, organizations(id, nome)")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const { data: fases } = await supabase
    .from("phases")
    .select("*, tasks(*)")
    .eq("project_id", id)
    .order("ordem", { ascending: true });

  const fasesOrdenadas = (fases ?? []).map((f) => ({ ...f, tasks: [...f.tasks].sort((a, b) => a.ordem - b.ordem) }));
  const org = Array.isArray(project.organizations) ? project.organizations[0] : project.organizations;
  const proximaOrdemFase = fasesOrdenadas.length === 0 ? 0 : Math.max(...fasesOrdenadas.map((f) => f.ordem)) + 1;

  const { data: catalogoOfertas } = await supabase
    .from("offers")
    .select("id, slug, titulo, insight_padrao, descricao_entrega, preco_padrao_centavos, prazo_estimado_dias")
    .eq("ativa", true)
    .order("titulo");

  const { data: ofertasDoProjeto } = await supabase
    .from("project_offers")
    .select("*")
    .eq("project_id", id)
    .neq("status", "removida")
    .order("created_at", { ascending: false });

  const { data: cobrancasPendentes } = await supabase
    .from("charges")
    .select("id, project_offer_id")
    .in("project_offer_id", (ofertasDoProjeto ?? []).map((o) => o.id))
    .in("status", ["pendente", "agendada"]);
  const cobrancaPorOferta = new Map((cobrancasPendentes ?? []).map((c) => [c.project_offer_id, c.id]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        {org && (
          <Link href={`/admin/organizacoes/${org.id}`} className="text-body-sm text-text-secondary hover:text-text-primary">
            ← {org.nome}
          </Link>
        )}
        <h1 className="font-display text-display-md text-text-primary">{project.nome}</h1>
      </div>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Dados do projeto</h2>
        <EditarProjetoForm project={project} />
      </Card>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-body-lg font-medium text-text-primary">Fases e etapas</h2>
        </div>

        {fasesOrdenadas.length === 0 && (
          <EmptyState title="Nenhuma fase ainda" description="Adicione a primeira fase abaixo." />
        )}

        {fasesOrdenadas.map((fase) => {
          const proximaOrdemTask = fase.tasks.length === 0 ? 0 : Math.max(...fase.tasks.map((t) => t.ordem)) + 1;
          return (
            <Card key={fase.id}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <EditarFaseForm fase={fase} />
                <ConfirmDeleteButton
                  action={excluirFaseAction}
                  hiddenFields={{ faseId: fase.id }}
                  title="Excluir fase"
                  description={`A fase "${fase.titulo}" e suas ${fase.tasks.length} etapa(s) serão excluídas permanentemente.`}
                />
              </div>

              <ul className="mb-4 flex flex-col divide-y divide-border-subtle">
                {fase.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-body-sm text-text-primary">{task.titulo}</span>
                    <span className="flex items-center gap-2">
                      <StatusTaskSelect task={task} />
                      <EditarTaskModal task={task} />
                      <ConfirmDeleteButton
                        action={excluirTaskAction}
                        hiddenFields={{ taskId: task.id }}
                        title="Excluir etapa"
                        description={`A etapa "${task.titulo}" será excluída permanentemente.`}
                      />
                    </span>
                  </li>
                ))}
              </ul>

              <CriarTaskForm faseId={fase.id} proximaOrdem={proximaOrdemTask} />
            </Card>
          );
        })}

        <Card>
          <CriarFaseForm projectId={project.id} proximaOrdem={proximaOrdemFase} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-body-lg font-medium text-text-primary">Ofertas deste projeto</h2>
        {(ofertasDoProjeto ?? []).length > 0 && (
          <ul className="mb-6 flex flex-col gap-3">
            {(ofertasDoProjeto ?? []).map((oferta) => (
              <li key={oferta.id} className="rounded-md border border-border-subtle p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-text-primary">{oferta.titulo}</span>
                  <Badge tone={OFERTA_STATUS_TONE[oferta.status as keyof typeof OFERTA_STATUS_TONE] ?? "neutral"}>
                    {oferta.status}
                  </Badge>
                </div>
                <p className="mb-2 text-body-sm text-text-secondary">
                  {formatCentavosBRL(oferta.preco_centavos)} · {oferta.impressoes} impressão(ões) · {oferta.cliques} clique(s)
                </p>
                {oferta.status === "em_negociacao" && cobrancaPorOferta.has(oferta.id) && (
                  <div className="mb-2">
                    <SimularWebhookForm chargeId={cobrancaPorOferta.get(oferta.id)!} />
                  </div>
                )}
                {(oferta.status === "disponivel" || oferta.status === "em_negociacao") && (
                  <div className="flex gap-2">
                    <DesbloquearManualButton projectOfferId={oferta.id} />
                    <RemoverOfertaButton projectOfferId={oferta.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <PublicarOfertaForm projectId={project.id} ofertas={catalogoOfertas ?? []} />
      </Card>

      <Card>
        <h2 className="mb-2 text-body-lg font-medium text-text-primary">Zona de risco</h2>
        <p className="mb-4 text-body-sm text-text-secondary">
          Excluir o projeto remove permanentemente todas as {fasesOrdenadas.length} fase(s) e{" "}
          {fasesOrdenadas.reduce((acc, f) => acc + f.tasks.length, 0)} etapa(s) associadas.
        </p>
        <ConfirmDeleteButton
          action={excluirProjetoAction}
          hiddenFields={{ projectId: project.id }}
          title="Excluir projeto"
          description={`O projeto "${project.nome}" e todo o seu conteúdo serão excluídos permanentemente. Essa ação não pode ser desfeita.`}
          triggerLabel="Excluir projeto"
        />
      </Card>
    </div>
  );
}
