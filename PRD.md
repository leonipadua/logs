# PRD — Plataforma "Logs"

> Escopo enxuto e executável. Itens adiados estão em `BACKLOG.md`, não aqui.

## 1. Visão geral e problema

Hoje, durante o onboarding de agentes de IA, o cliente da Sabre não tem visibilidade do que já foi entregue e do que falta — o acompanhamento é feito por WhatsApp/e-mail sob demanda. Isso gera ansiedade no cliente e trabalho repetitivo de status update para a Sabre.

**Logs** é uma plataforma onde cada cliente acessa, por um link único, uma timeline em tempo real das tarefas do seu projeto de onboarding. A Sabre gerencia tudo por um painel administrativo simples, sem precisar tocar em código.

## 2. Personas

- **Cliente/stakeholder** — não é técnico, quer entender o progresso em poucos segundos, sem login ou treinamento.
- **Operador Sabre (Leoni)** — quer atualizar o status de uma tarefa em poucos cliques, sem `git push` ou deploy manual.

## 3. Escopo do MVP

### Área do cliente — `/p/<uuid>`
- Cabeçalho: nome do projeto, % de conclusão, data da última atualização.
- Timeline vertical de **fases**; cada fase lista suas **tarefas** com status: `pendente | em_andamento | concluida | bloqueada`.
- Tela própria para UUID inválido/projeto não encontrado.
- Sem login — acesso via link ofuscado (ver seção 6).

### Área admin — `/admin`
- Login por senha única (env var).
- Lista de clientes/projetos.
- CRUD de projetos, fases e tarefas (criar, editar, alterar status, excluir).
- Reordenação simples via campo numérico de ordem (sem drag-and-drop no MVP).
- Botão para copiar o link único do cliente.

### Atualização em tempo real
- Via Supabase Realtime.
- Fallback aceitável no dia 1: revalidação por polling a cada alguns segundos — **não bloquear o lançamento** por causa de realtime perfeito.

Tudo que não está listado acima está em `BACKLOG.md`.

## 4. Modelo de dados (Supabase / Postgres)

```
clients
  id            uuid pk
  nome          text
  slug          text unique
  created_at    timestamptz

projects
  id            uuid pk
  client_id     uuid fk -> clients.id
  nome          text
  descricao     text
  public_id     uuid unique default gen_random_uuid()   -- usado na rota /p/<public_id>
  status        text                                     -- ex: em_andamento | concluido | pausado
  created_at    timestamptz
  updated_at    timestamptz

phases
  id            uuid pk
  project_id    uuid fk -> projects.id
  titulo        text
  ordem         int

tasks
  id            uuid pk
  phase_id      uuid fk -> phases.id
  titulo        text
  descricao     text
  status        text        -- pendente | em_andamento | concluida | bloqueada
  ordem         int
  updated_at    timestamptz
```

- % de conclusão: calculado a partir de `tasks` (concluídas / total), via view ou no client.
- **RLS (Row Level Security):**
  - `anon` (o cliente): SELECT liberado em `projects`, `phases`, `tasks` apenas filtrando por `public_id` do projeto — sem acesso de escrita.
  - Toda escrita (CRUD do admin) passa por Server Actions do Next.js usando a `service_role key`, nunca exposta ao browser.

## 5. Arquitetura e stack

- **Frontend/Backend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui.
- **Banco:** Supabase (Postgres + RLS + Realtime).
- **Hospedagem:** Vercel, plano gratuito.
- **Variáveis de ambiente:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_PASSWORD`
  - `SESSION_SECRET`

## 6. Segurança do modelo escolhido

- Link ofuscado com UUID v4 segue o mesmo princípio de compartilhamento do Google Drive/Notion — adequado ao nível de sensibilidade dos dados (progresso de tarefas, não dados sigilosos).
- Páginas `/p/<uuid>` marcadas `noindex` e bloqueadas em `robots.txt` para não vazar por buscadores.
- Admin: senha única validada no servidor, cookie de sessão `httpOnly`, `secure`, `sameSite=strict`; rate limit básico nas tentativas de login.
- `service_role key` do Supabase só é usada em Server Actions/rotas server-side — nunca enviada ao browser.

## 7. Diretrizes de design (premium + tecnológico)

- Tema escuro por padrão, superfícies em camadas (fundo, cards, elementos elevados).
- Uma cor de acento para "concluído", outra para "em andamento" — status sempre com ícone **+** rótulo textual (nunca só cor, por acessibilidade).
- Uma ação primária por tela; fases sempre visíveis (sem esconder atrás de cliques extras).
- Tipografia geométrica/moderna; micro-interações discretas nas transições de status.
- Mobile-first — o cliente provavelmente abrirá o link pelo celular.
- Contraste mínimo WCAG AA.

## 8. Fluxos de usuário

**Cliente:**
1. Recebe o link único da Sabre (WhatsApp/e-mail).
2. Abre o link → vê nome do projeto, % de progresso, timeline de fases/tarefas.
3. Volta quando quiser conferir atualizações — sem precisar pedir status.

**Operador (admin):**
1. Acessa `/admin`, faz login com a senha.
2. Seleciona o projeto do cliente (ou cria um novo).
3. Edita/cria fase ou tarefa, altera status.
4. Copia o link único e envia ao cliente (na primeira vez) ou simplesmente segue trabalhando — o cliente já vê a atualização.

## 9. Critérios de aceite

- [ ] Criar um projeto no admin gera automaticamente um `public_id` e o link `/p/<public_id>` funciona.
- [ ] Acessar `/p/<uuid-inexistente>` mostra tela de "projeto não encontrado", sem erro cru.
- [ ] Alterar o status de uma tarefa no admin reflete na tela do cliente sem reload manual (realtime ou polling) em até alguns segundos.
- [ ] % de conclusão no cabeçalho do cliente é sempre consistente com o número de tarefas concluídas.
- [ ] Login do admin bloqueia acesso a `/admin/*` sem sessão válida.
- [ ] Cliente não autenticado não consegue alterar nenhum dado (validado via RLS, não apenas via UI).
- [ ] Layout funciona corretamente em viewport mobile (360px+) e desktop.

## 10. Roadmap de implementação

- **F0 — Setup:** repositório Next.js, projeto Supabase, schema SQL e RLS.
- **F1 — Leitura do cliente:** rota `/p/<uuid>`, timeline de fases/tarefas, cálculo de progresso.
- **F2 — Admin/CRUD:** login por senha, CRUD de projetos/fases/tarefas.
- **F3 — Polimento:** realtime, design premium/dark, estados vazios e de erro.
- **F4 — Deploy:** Vercel + variáveis de ambiente + domínio (se houver).

## 11. Métricas de sucesso

- Redução de perguntas "como está o projeto?" recebidas por canais informais.
- % de clientes que abrem o link ao menos uma vez por semana durante o onboarding.
- Tempo médio do operador para atualizar o status de uma tarefa (meta: menos de 30s).

## 12. Riscos e questões em aberto

- Limites do plano gratuito do Supabase/Vercel em caso de crescimento — reavaliar se necessário.
- O que acontece com o projeto/link após o fim do onboarding (arquivar? manter acessível?) — decidir antes do F4.
- Se o link deve expirar automaticamente após X dias — não incluído no MVP, decisão futura.

---

*Referência técnica complementar: `logs_arquitetura.md` (alternativas de banco de dados e estratégia de acesso sem login).*
