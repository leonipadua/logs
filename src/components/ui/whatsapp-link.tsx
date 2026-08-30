import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface WhatsAppLinkProps {
  /** URL final — wa.me direto ou uma rota interna que contabiliza e redireciona. */
  href: string;
  children: React.ReactNode;
  variant?: "botao" | "discreto";
  className?: string;
}

const VARIANT_CLASSES = {
  botao:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-body font-medium text-text-inverse transition-colors duration-[120ms] hover:bg-accent-hover",
  discreto:
    "inline-flex w-fit items-center gap-2 text-body-sm text-text-secondary transition-colors duration-[120ms] hover:text-text-primary",
} as const;

/**
 * CTA de WhatsApp. Sempre `target="_blank"` com `rel="noopener noreferrer"` —
 * o wa.me abre o app e a página de origem precisa continuar aberta atrás.
 */
export function WhatsAppLink({ href, children, variant = "botao", className }: WhatsAppLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        VARIANT_CLASSES[variant],
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
        className,
      )}
    >
      <MessageCircle size={variant === "botao" ? 18 : 16} strokeWidth={1.5} aria-hidden />
      {children}
    </a>
  );
}
