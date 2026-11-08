import { CalendarDays, ExternalLink, PlayCircle } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { formatDataHoraPtBR } from "@/lib/format";

const TIPO: Record<string, string> = { kickoff: "Kickoff", treinamento: "Treinamento", reuniao: "Reunião" };

/** Agenda de reuniões e treinamentos gravados (PRD §3.3 / §4). */
export function ReunioesETreinamentos({ reunioes, agora }: { reunioes: Tables<"project_meetings">[]; agora: Date }) {
  const validas = reunioes.filter((r) => r.status !== "cancelada");
  const proximas = validas.filter((r) => r.status === "agendada" && new Date(r.ocorre_em) >= agora);
  const gravados = validas
    .filter((r) => r.gravacao_url)
    .sort((a, b) => b.ocorre_em.localeCompare(a.ocorre_em));

  if (proximas.length === 0 && gravados.length === 0) return null;

  return (
    <section aria-label="Agenda e treinamentos" className="flex flex-col gap-6">
      {proximas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-display-sm text-text-primary">
            Próximas reuniões
          </h2>
          <ul className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface-raised">
            {proximas.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                <CalendarDays size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-tertiary" aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body text-text-primary">{r.titulo}</span>
                  <span className="text-body-sm text-text-tertiary">
                    {TIPO[r.tipo] ?? r.tipo} · {formatDataHoraPtBR(r.ocorre_em)}
                    {r.duracao_min ? ` · ${r.duracao_min} min` : ""}
                  </span>
                </div>
                {r.link_reuniao && (
                  <a
                    href={r.link_reuniao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-body-sm text-accent-text hover:underline"
                  >
                    Entrar <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {gravados.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-display-sm text-text-primary">Treinamentos gravados</h2>
          <ul className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface-raised">
            {gravados.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <PlayCircle size={18} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body text-text-primary">{r.titulo}</span>
                  <span className="text-body-sm text-text-tertiary">{formatDataHoraPtBR(r.ocorre_em)}</span>
                </div>
                <a
                  href={r.gravacao_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-accent-text hover:underline"
                >
                  Assistir
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
