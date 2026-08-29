import Link from "next/link";

export const metadata = { robots: { index: false } };

export default function ConviteExpiradoPage() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="font-display text-display-sm text-text-primary">Convite expirado</h1>
      <p className="text-body text-text-secondary">
        Seu convite não é mais válido. Entre em contato com a Sabre para receber um novo.
      </p>
      <Link href="/login" className="text-body-sm text-accent-text hover:underline">
        Voltar para o login
      </Link>
    </div>
  );
}
