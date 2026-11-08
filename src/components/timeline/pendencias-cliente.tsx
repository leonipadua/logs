import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { formatDiaPtBR } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

type TaskComFase = Tables<"tasks"> & { faseTitulo: string };

const CATEGORIA: Record<string, string> = {
  dado: "Dados",
  acesso: "Acesso",
  aprovacao: "Aprovação",
  outro: "Outro",
};

/** Checklist de dados e acessos que dependem do cliente, com prazo e status (PRD §3.3). */
export function PendenciasCliente({
  tasks,
  projectSlug,
  hoje,
}: {
  tasks: TaskComFase[];
  projectSlug: string;
  hoje: string;
}) {
  if (tasks.length === 0) return null;

  const abertas = tasks
    .filter((t) => t.status !== "concluida")
    .sort((a, b) => (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999") || a.ordem - b.ordem);
  const feitas = tasks.filter((t) => t.status === "concluida");

  return (
    <section aria-labelledby="pendencias-titulo" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="pendencias-titulo" className="font-display text-display-sm text-text-primary">
          Pendências suas
        </h2>
        <span className="text-body-sm tabular-nums text-text-secondary">
          {feitas.length} de {tasks.length} entregues
        </span>
      </div>
      {abertas.length === 0 ? (
        <p className="rounded-md bg-state-done-bg px-4 py-3 text-body-sm text-state-done">
          Tudo que dependia de você está entregue. Obrigado!
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface-raised">
          {abertas.map((t) => {
            const vencida = !!t.prazo && t.prazo < hoje;
            const Icon = vencida ? AlertTriangle : Circle;
            return (
              <li key={t.id} className="flex items-start gap-3 px-4 py-3">
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  className={cn("mt-0.5 shrink-0", vencida ? "text-state-blocked" : "text-state-pending")}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link href={`/app/projetos/${projectSlug}/${t.slug}`} className="text-body text-text-primary hover:underline">
                    {t.titulo}
                  </Link>
                  <span className="text-body-sm text-text-tertiary">
                    {t.categoria ? `${CATEGORIA[t.categoria] ?? t.categoria} · ` : ""}
                    {t.faseTitulo}
                  </span>
                </div>
                <span className={cn("shrink-0 text-body-sm tabular-nums", vencida ? "font-medium text-state-blocked" : "text-text-secondary")}>
                  {t.prazo ? (vencida ? `Vencida em ${formatDiaPtBR(t.prazo)}` : `até ${formatDiaPtBR(t.prazo)}`) : "sem prazo"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {feitas.length > 0 && (
        <details className="text-body-sm text-text-secondary">
          <summary className="cursor-pointer">Já entregues ({feitas.length})</summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {feitas.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <CheckCircle2 size={16} strokeWidth={1.5} className="text-state-done" aria-hidden="true" />
                {t.titulo}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
