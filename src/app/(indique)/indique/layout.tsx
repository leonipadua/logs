/**
 * Landing de indicação: fica fora do header/footer de `(site)` de propósito.
 * O lead chegou por um link de confiança de um conhecido, não navegando pelo
 * site — qualquer menu tira o foco do único caminho que importa, o WhatsApp.
 */
export default function IndiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-body-sm focus:text-text-primary"
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-border-subtle">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <span className="text-label uppercase tracking-wide text-text-tertiary">Sabre</span>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border-subtle">
        <div className="mx-auto max-w-3xl px-6 py-8 text-body-sm text-text-tertiary">
          <p>© {new Date().getFullYear()} Sabre. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
