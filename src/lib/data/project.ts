import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listProjetosDoUsuario(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organizations(id, nome, projects(id, nome, slug, status, updated_at))")
    .eq("user_id", userId)
    .is("revogado_em", null);

  type ProjetoEmbutido = { id: string; nome: string; slug: string; status: string; updated_at: string };

  return (data ?? []).flatMap((membro) => {
    const org = Array.isArray(membro.organizations) ? membro.organizations[0] : membro.organizations;
    const projetos = (org?.projects ?? []) as ProjetoEmbutido[];
    return projetos.map((p) => ({ ...p, organizacaoNome: org?.nome ?? "" }));
  });
}

/**
 * Busca por slug entre os projetos que o usuário pode ver (RLS decide).
 * O slug é único por organização, não globalmente — ver ARCHITECTURE §3.
 */
export async function getProjetoPorSlug(slug: string) {
  const supabase = await createClient();
  const { data: projeto } = await supabase
    .from("projects")
    .select("*, organizations(id, nome)")
    .eq("slug", slug)
    .maybeSingle();
  if (!projeto) return null;

  const { data: fases } = await supabase
    .from("phases")
    .select("*, tasks(*)")
    .eq("project_id", projeto.id)
    .order("ordem", { ascending: true });

  const fasesOrdenadas = (fases ?? []).map((fase) => ({
    ...fase,
    tasks: [...fase.tasks].sort((a, b) => a.ordem - b.ordem),
  }));

  // Vitrine: no máximo 3, sempre ao fim, nunca intercaladas com fases contratadas (PRD E3).
  const { data: ofertas } = await supabase
    .from("project_offers")
    .select("*")
    .eq("project_id", projeto.id)
    .eq("status", "disponivel")
    .order("ordem", { ascending: true })
    .limit(3);

  return { projeto, fases: fasesOrdenadas, ofertas: ofertas ?? [] };
}

/** Slug único por projeto, não globalmente — mesmo padrão de getProjetoPorSlug. */
export async function getOfertaPorSlug(offerSlug: string) {
  const supabase = await createClient();
  const { data: oferta } = await supabase
    .from("project_offers")
    .select("*, projects(id, nome, slug)")
    .eq("slug", offerSlug)
    .maybeSingle();
  if (!oferta) return null;

  const projeto = Array.isArray(oferta.projects) ? oferta.projects[0] : oferta.projects;
  if (!projeto) return null;
  return { oferta, projeto };
}

export async function getTaskPorSlug(projectSlug: string, taskSlug: string) {
  const dados = await getProjetoPorSlug(projectSlug);
  if (!dados) return null;

  for (const fase of dados.fases) {
    const task = fase.tasks.find((t) => t.slug === taskSlug);
    if (task) return { task, fase, projeto: dados.projeto };
  }
  return null;
}

/** Reuniões e treinamentos do projeto (RLS: membro lê só os do próprio projeto). */
export async function getReunioesDoProjeto(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_meetings")
    .select("*")
    .eq("project_id", projectId)
    .order("ocorre_em", { ascending: true });
  return data ?? [];
}
