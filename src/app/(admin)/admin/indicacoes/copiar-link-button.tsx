"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copia a URL da vitrine para o admin colar no WhatsApp do cliente. */
export function CopiarLinkButton({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard bloqueado (contexto inseguro): o admin ainda consegue
      // selecionar a URL exibida na tela.
    }
  }

  return (
    <Button variant="secondary" type="button" onClick={copiar} className="gap-2">
      {copiado ? <Check size={16} strokeWidth={1.5} aria-hidden /> : <Copy size={16} strokeWidth={1.5} aria-hidden />}
      {copiado ? "Copiado" : "Copiar"}
    </Button>
  );
}
