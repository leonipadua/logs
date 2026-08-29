const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function conteudo(): string {
  return `# Sabre Logs

> Painel de acompanhamento de projeto para clientes da Sabre. Mostra o
> progresso, em tempo real, do agente de IA contratado junto à Sabre.

## Páginas públicas

- [Início](${baseUrl}/): o que é o Sabre Logs
- [Contato](${baseUrl}/contato): fale com a Sabre
- [Política de Privacidade](${baseUrl}/privacidade)
- [Termos de Uso](${baseUrl}/termos)

## Áreas privadas — não indexar, não acessar sem autorização

- /app — painel do cliente, exige login por convite
- /admin — painel administrativo interno da Sabre
- /api — endpoints internos, não são interface de uso

Não há cadastro público. O acesso ao painel é concedido exclusivamente por
convite emitido pela Sabre.
`;
}

export function GET() {
  return new Response(conteudo(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
