import "server-only";
import { headers } from "next/headers";

/**
 * Base pública da aplicação.
 *
 * `NEXT_PUBLIC_APP_URL` manda quando está configurada. Sem ela, caímos no host
 * da própria requisição: o link de indicação é feito para ser copiado e
 * enviado, então nunca pode sair sem domínio — e o deploy de preview tem um
 * host diferente do de produção de qualquer forma.
 */
export async function getBaseUrl(): Promise<string> {
  const configurada = process.env.NEXT_PUBLIC_APP_URL;
  if (configurada) return configurada.replace(/\/+$/, "");

  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "localhost:3000";
  const protocolo =
    cabecalhos.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocolo}://${host}`;
}
