import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmailComLog } from "@/lib/email/send-and-log";
import { templateDigestTasks } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const JANELA_MINUTOS = 30;

/**
 * E7 M3 — cron a cada 15 min (vercel.json). Agrega tasks concluídas há mais
 * de 30 min e ainda não notificadas numa única mensagem por projeto, para
 * marcar 5 tasks em 2 minutos não virar 5 emails.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "não autorizado" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const limite = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000).toISOString();

  const { data: tasks } = await admin
    .from("tasks")
    .select("id, phase_id, phases(project_id)")
    .eq("status", "concluida")
    .eq("email_digest_enviado", false)
    .lte("concluida_em", limite);

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, projetosNotificados: 0 });
  }

  const tasksPorProjeto = new Map<string, string[]>();
  for (const t of tasks) {
    const fase = Array.isArray(t.phases) ? t.phases[0] : t.phases;
    if (!fase) continue;
    const lista = tasksPorProjeto.get(fase.project_id) ?? [];
    lista.push(t.id);
    tasksPorProjeto.set(fase.project_id, lista);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  let projetosNotificados = 0;

  for (const [projectId, taskIds] of tasksPorProjeto) {
    const { data: projeto } = await admin
      .from("projects")
      .select("nome, slug, organization_id")
      .eq("id", projectId)
      .single();
    if (!projeto) continue;

    const { data: membros } = await admin
      .from("organization_members")
      .select("profiles(email, notificar_task_concluida)")
      .eq("organization_id", projeto.organization_id)
      .is("revogado_em", null);

    const destinatarios = (membros ?? [])
      .map((m) => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles))
      .filter((p): p is { email: string; notificar_task_concluida: boolean } => !!p?.notificar_task_concluida)
      .map((p) => p.email);

    if (destinatarios.length > 0) {
      const { assunto, html, texto } = templateDigestTasks({
        nomeProjeto: projeto.nome,
        quantidade: taskIds.length,
        urlProjeto: `${baseUrl}/app/projetos/${projeto.slug}`,
      });
      await enviarEmailComLog({ para: destinatarios, assunto, html, texto, tag: "M3" }, projeto.organization_id);
      projetosNotificados++;
    }

    await admin.from("tasks").update({ email_digest_enviado: true }).in("id", taskIds);
  }

  return NextResponse.json({ ok: true, projetosNotificados });
}
