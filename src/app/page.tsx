export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center text-zinc-100">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
          Sabre
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Logs</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Acesse o link enviado pela Sabre para acompanhar o progresso do seu
          projeto.
        </p>
      </div>
    </div>
  );
}
