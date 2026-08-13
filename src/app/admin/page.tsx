import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listProjectsWithClient } from "@/lib/data/project";
import {
  createClientAction,
  createProjectAction,
  logoutAction,
} from "@/lib/actions/admin-actions";

export const dynamic = "force-dynamic";

async function getClients() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("clients").select("*").order("nome");
  return data ?? [];
}

export default async function AdminHomePage() {
  const [projects, clients] = await Promise.all([
    listProjectsWithClient(),
    getClients(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Painel Sabre</h1>
        <form action={logoutAction}>
          <button className="text-sm text-zinc-500 hover:text-zinc-300">
            Sair
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Projetos
          </h2>

          <ul className="mt-4 space-y-2">
            {projects.length === 0 && (
              <p className="text-sm text-zinc-600">Nenhum projeto criado ainda.</p>
            )}
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition hover:border-zinc-700"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{project.nome}</p>
                    <p className="text-xs text-zinc-500">
                      {(project as { clients?: { nome?: string } }).clients?.nome ?? "—"}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    /p/{project.public_id}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <form
            action={createProjectAction}
            className="mt-6 flex flex-wrap gap-2 rounded-lg border border-zinc-800 p-4"
          >
            <select
              name="client_id"
              required
              className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            >
              <option value="">Cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <input
              name="nome"
              placeholder="Nome do projeto"
              required
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            />
            <input
              name="descricao"
              placeholder="Descrição (opcional)"
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            />
            <button className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400">
              Criar projeto
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Clientes
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {clients.map((c) => (
              <li
                key={c.id}
                className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400"
              >
                {c.nome}
              </li>
            ))}
          </ul>

          <form
            action={createClientAction}
            className="mt-4 flex flex-wrap gap-2 rounded-lg border border-zinc-800 p-4"
          >
            <input
              name="nome"
              placeholder="Nome do cliente"
              required
              className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            />
            <input
              name="slug"
              placeholder="slug-unico"
              required
              className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            />
            <button className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium hover:bg-zinc-700">
              Criar cliente
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
