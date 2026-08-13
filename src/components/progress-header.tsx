interface ProgressHeaderProps {
  nome: string;
  descricao: string | null;
  percent: number;
  concluidas: number;
  total: number;
  updatedAt: string;
}

export function ProgressHeader({
  nome,
  descricao,
  percent,
  concluidas,
  total,
  updatedAt,
}: ProgressHeaderProps) {
  const formattedDate = new Date(updatedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Progresso do projeto
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-50 sm:text-3xl">
          {nome}
        </h1>
        {descricao && (
          <p className="mt-2 max-w-xl text-sm text-zinc-400">{descricao}</p>
        )}

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-400">
              {percent}%
            </span>
            <span className="text-sm text-zinc-500">
              {concluidas} de {total} tarefas concluídas
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Última atualização: {formattedDate}
          </p>
        </div>
      </div>
    </header>
  );
}
