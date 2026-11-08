import { Lock, MessageCircle } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

/**
 * Módulos de tiers acima do contratado (PRD §3.3). Vocabulário de oportunidade
 * (índigo "trancada"), nunca o de "bloqueada" (DESIGN_SYSTEM §5.3).
 */
export function TasksBloqueadas({
  tasks,
  nomeProjeto,
  whatsapp,
}: {
  tasks: Tables<"tasks">[];
  nomeProjeto: string;
  whatsapp?: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <section aria-labelledby="upgrade-titulo" className="flex flex-col gap-4 border-t border-dashed border-border-default pt-8">
      <h2 id="upgrade-titulo" className="text-label uppercase tracking-wide text-text-tertiary">
        Disponível em um plano acima
      </h2>
      <ul className="flex flex-col gap-4">
        {tasks.map((task) => {
          const mensagem = encodeURIComponent(
            `Olá! Quero saber como liberar "${task.titulo.replace(/^Construir: /, "")}" no projeto ${nomeProjeto}.`,
          );
          return (
            <li key={task.id} className="rounded-md border border-state-locked/20 bg-state-locked-bg p-5">
              <div className="mb-2 flex items-center gap-2">
                <Lock size={16} strokeWidth={1.5} className="text-state-locked" aria-hidden="true" />
                <span className="text-body-lg font-medium text-text-primary">{task.titulo.replace(/^Construir: /, "")}</span>
              </div>
              {task.descricao && <p className="mb-2 text-body text-text-primary">{task.descricao}</p>}
              {task.motivo_bloqueio && <p className="mb-4 text-body-sm text-text-secondary">{task.motivo_bloqueio}</p>}
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp}?text=${mensagem}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-body font-medium text-text-inverse hover:bg-accent-hover"
                >
                  <MessageCircle size={16} strokeWidth={1.5} aria-hidden="true" />
                  Quero este upgrade
                </a>
              ) : (
                <p className="text-body-sm text-text-secondary">Fale com a Sabre para liberar este módulo.</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
