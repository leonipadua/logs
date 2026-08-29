import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-16">
      <section className="flex flex-col items-start gap-5">
        <p className="text-label uppercase tracking-wide text-text-tertiary">Sabre</p>
        <h1 className="font-display text-display-lg text-text-primary">
          Acompanhe o progresso do seu projeto, em tempo real.
        </h1>
        <p className="max-w-xl text-body-lg text-text-secondary">
          O Sabre Logs é o painel onde clientes da Sabre acompanham cada etapa do agente de
          IA contratado — o que já foi feito, o que está em andamento e o que vem a seguir.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button>Entrar no painel</Button>
          </Link>
          <Link href="/contato" className="text-body-sm text-accent-text hover:underline">
            Falar com a Sabre
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="mb-2 text-body-lg font-medium text-text-primary">Progresso claro</h2>
          <p className="text-body-sm text-text-secondary">
            Cada fase e etapa do projeto, com status atualizado conforme o trabalho avança.
          </p>
        </Card>
        <Card>
          <h2 className="mb-2 text-body-lg font-medium text-text-primary">Acesso por convite</h2>
          <p className="text-body-sm text-text-secondary">
            Sem cadastro público. O acesso é criado pela Sabre para cada cliente.
          </p>
        </Card>
        <Card>
          <h2 className="mb-2 text-body-lg font-medium text-text-primary">Feito sob medida</h2>
          <p className="text-body-sm text-text-secondary">
            Reflete o trabalho combinado com a Sabre — sem funcionalidades genéricas.
          </p>
        </Card>
      </section>
    </div>
  );
}
