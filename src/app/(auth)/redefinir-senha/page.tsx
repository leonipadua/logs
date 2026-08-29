import { RedefinirSenhaForm } from "./redefinir-senha-form";

export const metadata = { robots: { index: false } };

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash: tokenHash } = await searchParams;

  if (!tokenHash) {
    return (
      <p className="text-center text-body text-text-secondary">
        Link inválido. Peça uma nova recuperação de senha.
      </p>
    );
  }

  return <RedefinirSenhaForm tokenHash={tokenHash} />;
}
