export default function ProjectNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center text-zinc-100">
      <div>
        <p className="text-6xl">🔗</p>
        <h1 className="mt-4 text-xl font-semibold">Link inválido ou expirado</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Não encontramos nenhum projeto para este link. Verifique se o
          endereço foi copiado corretamente ou entre em contato com a Sabre.
        </p>
      </div>
    </div>
  );
}
