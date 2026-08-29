import Link from "next/link";

function anoAtual(): number {
  return new Date().getFullYear();
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-body-sm focus:text-text-primary"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-label uppercase tracking-wide text-text-tertiary">
            Sabre Logs
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-5">
            <Link href="/contato" className="text-body-sm text-text-secondary hover:text-text-primary">
              Contato
            </Link>
            <Link
              href="/login"
              className="text-body-sm font-medium text-accent-text hover:underline"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 py-8 text-center text-body-sm text-text-tertiary sm:flex-row sm:justify-between sm:text-left">
          <p>© {anoAtual()} Sabre. Todos os direitos reservados.</p>
          <nav aria-label="Institucional" className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-text-primary">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-text-primary">
              Termos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
