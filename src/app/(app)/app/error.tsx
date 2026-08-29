"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-24 text-center">
      <h1 className="font-display text-display-sm text-text-primary">Algo deu errado</h1>
      <p className="text-body text-text-secondary">
        Não conseguimos carregar esta página. Se o problema continuar, fale com a Sabre.
      </p>
      {error.digest && <p className="text-mono-sm text-text-tertiary">Referência: {error.digest}</p>}
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
