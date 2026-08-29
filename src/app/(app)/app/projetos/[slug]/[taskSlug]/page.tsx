import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getTaskPorSlug } from "@/lib/data/project";
import { STATUS_CONFIG, type TaskStatus } from "@/components/timeline/status-config";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: PageProps<"/app/projetos/[slug]/[taskSlug]">) {
  await requireUser();
  const { slug, taskSlug } = await params;

  const dados = await getTaskPorSlug(slug, taskSlug);
  if (!dados) notFound();
  const { task, fase, projeto } = dados;

  const status = STATUS_CONFIG[task.status as TaskStatus] ?? STATUS_CONFIG.pendente;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <Link
        href={`/app/projetos/${projeto.slug}`}
        className="inline-flex w-fit items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        {projeto.nome}
      </Link>

      <div>
        <p className="text-label uppercase tracking-wide text-text-tertiary">{fase.titulo}</p>
        <h1 className="font-display text-display-md text-text-primary">{task.titulo}</h1>
      </div>

      <Badge
        className="self-start"
        tone={task.status === "concluida" ? "done" : task.status === "em_andamento" ? "progress" : task.status === "bloqueada" ? "blocked" : "pending"}
      >
        {status.label}
      </Badge>

      {task.status === "bloqueada" && task.motivo_bloqueio && (
        <p className="rounded-md border border-state-blocked/20 bg-state-blocked-bg px-4 py-3 text-body-sm text-state-blocked">
          {task.motivo_bloqueio}
        </p>
      )}

      {task.descricao ? (
        <p className="text-body text-text-secondary">{task.descricao}</p>
      ) : (
        <p className="text-body text-text-tertiary">Sem descrição adicional para esta etapa.</p>
      )}
    </div>
  );
}
