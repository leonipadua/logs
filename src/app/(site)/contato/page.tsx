import { ContatoForm } from "./contato-form";

export const metadata = {
  title: "Contato — Sabre Logs",
  description: "Fale com a Sabre sobre o Sabre Logs.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-display-md text-text-primary">Contato</h1>
        <p className="mt-2 text-body text-text-secondary">
          Tem alguma dúvida sobre o Sabre Logs? Escreva para nós.
        </p>
      </div>
      <ContatoForm />
    </div>
  );
}
