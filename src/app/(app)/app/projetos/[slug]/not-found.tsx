import Link from "next/link";

export default function ProjetoNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-24 text-center">
      <h1 className="font-display text-display-sm text-text-primary">Projeto não encontrado</h1>
      <p className="text-body text-text-secondary">
        Este projeto não existe ou você não tem acesso a ele.
      </p>
      <Link href="/app" className="text-body-sm text-accent-text hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
