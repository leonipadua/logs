import { loginAction } from "@/lib/actions/admin-actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <form
        action={loginAction}
        className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/60 p-8"
      >
        <h1 className="text-lg font-semibold text-zinc-100">Área Sabre</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Acesso restrito à equipe interna.
        </p>

        <label className="mt-6 block text-xs font-medium text-zinc-400">
          Senha
        </label>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />

        {error === "1" && (
          <p className="mt-2 text-xs text-red-400">Senha incorreta.</p>
        )}

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-emerald-500 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
