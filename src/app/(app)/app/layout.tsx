import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/app" className="text-label uppercase tracking-wide text-text-tertiary">
            Sabre Logs
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/app/faturas" className="text-body-sm text-text-secondary hover:text-text-primary">
              Faturas
            </Link>
            <Link href="/app/conta" className="text-body-sm text-text-secondary hover:text-text-primary">
              Conta
            </Link>
            <form action={logoutAction}>
              <Button variant="ghost" type="submit">
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
