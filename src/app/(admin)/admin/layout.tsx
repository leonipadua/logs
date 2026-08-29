import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/organizacoes", label: "Organizações" },
  { href: "/admin/ofertas", label: "Ofertas" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/auditoria", label: "Auditoria" },
];

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <div className="min-h-screen">
      {isDev && (
        <div className="bg-state-progress-bg px-6 py-1.5 text-center text-label font-medium uppercase tracking-wide text-state-progress">
          Ambiente de desenvolvimento
        </div>
      )}
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-label uppercase tracking-wide text-text-tertiary">
              Sabre · Admin
            </Link>
            <nav className="flex items-center gap-4">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="text-body-sm text-text-secondary hover:text-text-primary">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
