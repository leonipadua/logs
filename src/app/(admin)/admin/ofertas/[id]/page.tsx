import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatarEntregaveis } from "@/lib/domain/indicacoes";
import { EditarOfertaForm } from "./editar-oferta-form";

export const dynamic = "force-dynamic";

export default async function EditarOfertaPage({ params }: PageProps<"/admin/ofertas/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: oferta } = await supabase.from("offers").select("*").eq("id", id).maybeSingle();
  if (!oferta) notFound();

  const entregaveis = Array.isArray(oferta.entregaveis) ? (oferta.entregaveis as string[]) : [];

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/ofertas" className="text-body-sm text-text-secondary hover:text-text-primary">
        ← Catálogo de ofertas
      </Link>

      <div>
        <h1 className="font-display text-display-md text-text-primary">{oferta.titulo}</h1>
        <p className="text-body-sm text-text-tertiary">/{oferta.slug}</p>
      </div>

      <Card>
        <EditarOfertaForm
          oferta={{
            id: oferta.id,
            titulo: oferta.titulo,
            insightPadrao: oferta.insight_padrao,
            descricaoEntrega: oferta.descricao_entrega ?? "",
            precoPadraoCentavos: oferta.preco_padrao_centavos,
            prazoEstimadoDias: oferta.prazo_estimado_dias,
            ativa: oferta.ativa,
            resumoPublico: oferta.resumo_publico ?? "",
            descricaoPublica: oferta.descricao_publica ?? "",
            entregaveisTexto: formatarEntregaveis(entregaveis),
            paraQuem: oferta.para_quem ?? "",
            resultadoEsperado: oferta.resultado_esperado ?? "",
            prazoPublico: oferta.prazo_publico ?? "",
          }}
        />
      </Card>
    </div>
  );
}
