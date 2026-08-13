"use client";

import { useState } from "react";

export function CopyLinkButton({ publicId }: { publicId: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}/p/${publicId}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-500 hover:text-emerald-400"
    >
      {copied ? "Copiado!" : "Copiar link do cliente"}
    </button>
  );
}
