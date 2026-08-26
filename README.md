# Sabre Logs

Plataforma de relacionamento com o cliente da Sabre: conta própria, timeline de progresso do agente de IA contratado, gamificação de upsell e painel financeiro para o operador.

A especificação completa do produto vive em [`docs/`](./docs/README.md) — leia `docs/README.md` antes de tocar em qualquer parte do código. `docs/_mvp/` é histórico da primeira versão (link ofuscado) e não deve ser usado como referência.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase (Postgres, Auth, Realtime) · Resend · Asaas. Detalhes em [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Antes de codar

Este projeto está pinado numa versão do Next.js com mudanças de API em relação a versões anteriores. Leia `AGENTS.md` e os guias relevantes em `node_modules/next/dist/docs/` antes de escrever código.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencher com as chaves reais do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Segredos

`.env.example` contém apenas placeholders. Segredos reais só em `.env.local` (fora do controle de versão) ou nas variáveis de ambiente da Vercel — nunca commitados. Ver [`docs/SECURITY.md`](./docs/SECURITY.md).

## Roteiro

O desenvolvimento segue as fases descritas em [`docs/ROADMAP.md`](./docs/ROADMAP.md), da fundação (F0) ao endurecimento pré-produção (F9).
