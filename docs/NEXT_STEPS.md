# Próximos passos

Status: MVP com código completo (F0–F2 do roadmap do `PRD.md`) e build de produção verificado (`npx next build` passa limpo, TypeScript sem erros, todas as rotas geram corretamente). Falta apenas conectar a um projeto Supabase real e testar visualmente antes do deploy.

## 1. Criar/configurar o projeto Supabase

- Criar um projeto em https://supabase.com (ou usar um existente).
- No SQL Editor do projeto, rodar o conteúdo de `supabase/schema.sql` (cria as tabelas `clients`, `projects`, `phases`, `tasks`, índices, triggers de `updated_at` e RLS).

## 2. Preencher `.env.local`

Copiar `.env.example` para `.env.local` e preencher:

- `NEXT_PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → service_role key (nunca expor no client)
- `ADMIN_PASSWORD` — senha escolhida para o painel `/admin`
- `SESSION_SECRET` — string aleatória forte (ex.: `openssl rand -hex 32`)

## 3. Rodar localmente e testar

```
npm run dev
```

- Criar um cliente e um projeto pelo `/admin` (senha = `ADMIN_PASSWORD`).
- Adicionar fases e tarefas ao projeto, copiar o link `/p/<uuid>` gerado.
- Abrir o link em outra aba/navegador anônimo e confirmar que a timeline aparece corretamente.
- Alterar o status de uma tarefa no admin e confirmar que a tela do cliente atualiza sozinha (Supabase Realtime) sem reload manual.
- Testar o caso de UUID inválido em `/p/algo-invalido` (deve mostrar a tela de "link inválido").

## 4. Deploy (Vercel)

- Conectar o repositório à Vercel.
- Configurar as mesmas variáveis de ambiente do `.env.local` no painel do projeto Vercel.
- Deploy e reteste do fluxo completo em produção.

## Observações técnicas desta sessão (para não repetir)

- O disco C: estava crítico (96% cheio) e corrompeu a instalação do `node_modules` — já resolvido (cache do npm limpo, reinstalação limpa). Se voltar a dar erro estranho de módulo não encontrado, checar espaço em disco primeiro.
- `middleware.ts` foi renomeado para `src/proxy.ts` (convenção do Next 16 — a função exportada chama-se `proxy`, não `middleware`).
- Itens deliberadamente fora do MVP estão documentados em `BACKLOG.md`.
