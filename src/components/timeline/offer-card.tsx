import Link from "next/link";
import { Lock } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { formatCentavosBRL } from "@/lib/format";

/**
 * DESIGN_SYSTEM §5.3. Nunca compartilha cor, forma ou vocabulário com o
 * estado "bloqueada" — é oportunidade, não problema.
 */
export function OfferCard({ oferta }: { oferta: Tables<"project_offers"> }) {
  return (
    <li className="rounded-md border border-state-locked/20 bg-state-locked-bg p-5">
      <div className="mb-2 flex items-center gap-2">
        <Lock size={16} strokeWidth={1.5} className="text-state-locked" aria-hidden="true" />
        <span className="text-body-lg font-medium text-text-primary">{oferta.titulo}</span>
      </div>
      <p className="mb-3 font-display text-display-sm text-text-primary">{oferta.insight}</p>
      {oferta.descricao_entrega && (
        <p className="mb-4 text-body-sm text-text-secondary">{oferta.descricao_entrega}</p>
      )}
      <div className="mb-4 flex items-baseline gap-3">
        <span className="tabular-nums text-body-lg font-medium text-text-primary">
          {formatCentavosBRL(oferta.preco_centavos)}
        </span>
        {oferta.prazo_estimado_dias && (
          <span className="text-body-sm text-text-tertiary">~{oferta.prazo_estimado_dias} dias</span>
        )}
      </div>
      <Link
        href={`/app/desbloquear/${oferta.slug}`}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-body font-medium text-text-inverse hover:bg-accent-hover"
      >
        Desbloquear
      </Link>
    </li>
  );
}
