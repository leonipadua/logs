import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmailComLog } from "@/lib/email/send-and-log";
import { templateDesbloqueioLiberado } from "@/lib/email/templates";
import { emailsDosMembros } from "./notifications";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/**
 * Ao ser paga, a oferta materializa uma fase real com as tasks do
 * `template_fases` do catálogo (PRD E3). Usado tanto pelo desbloqueio
 * manual do admin (F4/F5, sem pagamento real) quanto pelo webhook (F5+).
 */
export async function materializarOferta(
  admin: ReturnType<typeof createAdminClient>,
  projectOfferId: string,
): Promise<string> {
  const { data: oferta } = await admin
    .from("project_offers")
    .select("*, offers(template_fases)")
    .eq("id", projectOfferId)
    .single();
  if (!oferta) throw new Error("Oferta não encontrada.");

  const templateFases = (
    Array.isArray(oferta.offers) ? oferta.offers[0]?.template_fases : oferta.offers?.template_fases
  ) as { titulo: string; tasks: { titulo: string }[] }[] | undefined;

  const { data: fasesExistentes } = await admin
    .from("phases")
    .select("ordem")
    .eq("project_id", oferta.project_id)
    .order("ordem", { ascending: false })
    .limit(1);
  let proximaOrdem = (fasesExistentes?.[0]?.ordem ?? -1) + 1;

  for (const faseTemplate of templateFases ?? []) {
    const { data: fase } = await admin
      .from("phases")
      .insert({
        project_id: oferta.project_id,
        titulo: faseTemplate.titulo,
        ordem: proximaOrdem++,
        origem_offer_id: oferta.id,
      })
      .select("id")
      .single();
    if (!fase) continue;

    const tasksParaInserir = (faseTemplate.tasks ?? []).map((t, index) => ({
      phase_id: fase.id,
      titulo: t.titulo,
      slug: `${slugify(t.titulo)}-${fase.id.slice(0, 8)}-${index}`,
      ordem: index,
      status: "pendente",
    }));
    if (tasksParaInserir.length > 0) {
      await admin.from("tasks").insert(tasksParaInserir);
    }
  }

  await admin
    .from("project_offers")
    .update({ status: "desbloqueada", desbloqueada_em: new Date().toISOString() })
    .eq("id", projectOfferId);

  const { data: projeto } = await admin
    .from("projects")
    .select("nome, slug, organization_id")
    .eq("id", oferta.project_id)
    .single();

  if (projeto) {
    const destinatarios = await emailsDosMembros(admin, projeto.organization_id);
    if (destinatarios.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const { assunto, html, texto } = templateDesbloqueioLiberado({
        nomeOferta: oferta.titulo,
        nomeProjeto: projeto.nome,
        urlProjeto: `${baseUrl}/app/projetos/${projeto.slug}`,
      });
      await enviarEmailComLog({ para: destinatarios, assunto, html, texto, tag: "M5" }, projeto.organization_id);
    }
  }

  return oferta.project_id;
}
