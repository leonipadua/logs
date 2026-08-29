import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-24 text-center">
      <h1 className="font-display text-display-sm text-text-primary">Página não encontrada</h1>
      <p className="text-body text-text-secondary">O que você procura não existe ou não está mais disponível.</p>
      <Link href="/app" className="text-body-sm text-accent-text hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
