# DATA_MODEL — Sabre Logs v1

Especificação do esquema Postgres (Supabase). **Este documento não foi aplicado ao banco.** É a fonte de verdade para escrever as migrations em `supabase/migrations/` durante a implementação.

Princípios:

- **RLS é a fronteira de segurança.** Toda tabela tem RLS habilitada e políticas explícitas. Uma query que esqueça o filtro de organização não deve conseguir vazar nada.
- **Nenhuma política permissiva.** O `for select to anon using (true)` do MVP é o anti-padrão que estamos corrigindo.
- **Dinheiro em centavos**, `integer`, nunca `numeric` com casa decimal flutuante.
- **Escrita do cliente é sempre negada.** O cliente lê; o admin escreve. Onde o cliente precisa agir (iniciar um desbloqueio), a ação passa por Server Action com validação, não por `insert` direto.

---

## 1. Convenções

| Convenção | Regra |
|---|---|
| Chave primária | `uuid` com `default gen_random_uuid()` |
| Timestamps | `timestamptz`, `created_at default now()`, `updated_at` por trigger |
| Enums | `text` + `check` constraint (mais fácil de evoluir que `create type` no Supabase) |
| Nomes | Tabelas em inglês no plural; colunas de domínio em português (mantém o vocabulário do produto) |
| Soft delete | Não usar na v1, exceto onde indicado (`organizations.arquivada_em`) |
| Ordem | Coluna `ordem integer not null default 0` |

---

## 2. Funções auxiliares

Todas as políticas dependem destas duas funções. `security definer` com `search_path` fixado — sem isso, são vetor de escalonamento de privilégio.

```sql
-- Papel global de administrador Sabre.
-- A fonte é o app_metadata do JWT, que só o service_role consegue escrever.
-- NUNCA derivar de user_metadata: o usuário pode alterar o próprio user_metadata.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Vínculo do usuário autenticado com uma organização.
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_members m
     where m.organization_id = org
       and m.user_id = auth.uid()
       and m.revogado_em is null
  );
$$;

-- Papel dentro da organização (owner tem poderes extras: convidar, pagar).
create or replace function public.is_org_owner(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_members m
     where m.organization_id = org
       and m.user_id = auth.uid()
       and m.role = 'owner'
       and m.revogado_em is null
  );
$$;
```

**Atenção à recursão:** as políticas de `organization_members` não podem chamar `is_org_member`, senão a política consulta a tabela que ela mesma protege. A política daquela tabela usa `user_id = auth.uid()` diretamente.

Trigger de `updated_at` (reaproveitar a do MVP):

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
```

---

## 3. Identidade e organizações

### 3.1 `profiles`

Espelho de `auth.users` com os campos de domínio. Populado por trigger em `auth.users`.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id`, `on delete cascade` |
| `nome` | `text not null` | |
| `email` | `text not null` | Cópia denormalizada para exibição/busca |
| `must_change_password` | `boolean not null default true` | Trava o acesso até a troca (E1.3) |
| `notificar_task_concluida` | `boolean not null default true` | Opt-out do email M3 |
| `ultimo_acesso_em` | `timestamptz` | |
| `created_at` / `updated_at` | `timestamptz` | |

```sql
alter table public.profiles enable row level security;

create policy "usuario le o proprio perfil"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "usuario atualiza o proprio perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- Nota: must_change_password NÃO pode ser alterado pelo próprio usuário via update
-- direto. Restringir por trigger BEFORE UPDATE que rejeita a mudança quando
-- auth.uid() = id e a flag está passando de true para false sem troca real de senha.
-- A limpeza da flag ocorre em Server Action após updateUser(), com service_role.

create policy "admin gerencia perfis"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

### 3.2 `organizations`

O cliente da Sabre.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `nome` | `text not null` | Nome fantasia |
| `slug` | `text not null unique` | Usado em rotas de admin |
| `documento` | `text` | CNPJ/CPF — necessário para o Asaas |
| `email_faturamento` | `text` | |
| `telefone` | `text` | |
| `provider_customer_id` | `text` | Id do cliente no provedor de pagamento |
| `arquivada_em` | `timestamptz` | Soft delete |
| `created_at` / `updated_at` | | |

```sql
alter table public.organizations enable row level security;

create policy "membro le a propria organizacao"
  on public.organizations for select to authenticated
  using (public.is_org_member(id) or public.is_admin());

create policy "somente admin escreve organizacao"
  on public.organizations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

### 3.3 `organization_members`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK → organizations, cascade | |
| `user_id` | `uuid` FK → profiles, cascade | |
| `role` | `text not null default 'member'` | `check in ('owner','member')` |
| `revogado_em` | `timestamptz` | Revogação sem perder histórico |
| `created_at` | | |

`unique (organization_id, user_id)`. Índices em ambas as colunas.

```sql
alter table public.organization_members enable row level security;

-- Sem is_org_member aqui: evita recursão.
create policy "usuario le os proprios vinculos"
  on public.organization_members for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "owner le os membros da sua organizacao"
  on public.organization_members for select to authenticated
  using (
    exists (
      select 1 from public.organization_members me
       where me.organization_id = organization_members.organization_id
         and me.user_id = auth.uid()
         and me.role = 'owner'
         and me.revogado_em is null
    )
  );

create policy "somente admin escreve vinculos"
  on public.organization_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Convite feito por owner (E1.5) passa por Server Action com service_role,
-- após validar is_org_owner. Não há insert direto pelo cliente.
```

### 3.4 `invitations`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `email` | `text not null` | |
| `nome` | `text` | |
| `role` | `text not null default 'member'` | |
| `token_hash` | `text not null` | Hash do token; nunca o token em claro |
| `expira_em` | `timestamptz not null` | `now() + interval '7 days'` |
| `aceito_em` | `timestamptz` | |
| `revogado_em` | `timestamptz` | |
| `convidado_por` | `uuid` FK → profiles | |
| `created_at` | | |

RLS: leitura só para `admin` e para o `owner` da organização; escrita só `admin`/service_role. O convidado nunca lê a tabela — a validação do token é feita por Server Action.

---

## 4. Projetos, fases e tasks

### 4.1 `projects`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK, cascade | |
| `nome` | `text not null` | |
| `slug` | `text not null` | `unique (organization_id, slug)` — é a URL limpa |
| `descricao` | `text` | |
| `status` | `text not null default 'em_andamento'` | `check in ('em_andamento','concluido','pausado','arquivado')` |
| `previsao_entrega` | `date` | Opcional, informada pelo admin |
| `created_at` / `updated_at` | | |

O `public_id` do MVP **é descartado**. O acesso passa a ser por sessão + vínculo de organização.

```sql
alter table public.projects enable row level security;

create policy "membro le projetos da sua organizacao"
  on public.projects for select to authenticated
  using (public.is_org_member(organization_id) or public.is_admin());

create policy "somente admin escreve projetos"
  on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

### 4.2 `phases`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `project_id` | `uuid` FK, cascade | |
| `titulo` | `text not null` | |
| `descricao` | `text` | |
| `ordem` | `integer not null default 0` | |
| `origem_offer_id` | `uuid` FK → project_offers, null | Preenchido quando a fase nasceu de um desbloqueio |
| `created_at` / `updated_at` | | |

Política de leitura via join com `projects`:

```sql
create policy "membro le fases dos projetos da sua organizacao"
  on public.phases for select to authenticated
  using (
    exists (
      select 1 from public.projects p
       where p.id = phases.project_id
         and (public.is_org_member(p.organization_id) or public.is_admin())
    )
  );
```

### 4.3 `tasks`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `phase_id` | `uuid` FK, cascade | |
| `titulo` | `text not null` | |
| `slug` | `text not null` | Para a URL de detalhe; único por fase |
| `descricao` | `text` | Agora com campo no formulário do admin — faltava no MVP |
| `status` | `text not null default 'pendente'` | `check in ('pendente','em_andamento','concluida','bloqueada')` |
| `motivo_bloqueio` | `text` | Só quando `bloqueada`; explica ao cliente |
| `ordem` | `integer not null default 0` | |
| `concluida_em` | `timestamptz` | Marca temporal para o digest de email |
| `email_digest_enviado` | `boolean not null default false` | Controle do M3 |
| `created_at` / `updated_at` | | |

Mesmo padrão de política, via join `phases → projects`. Índice em `(phase_id, ordem)` e em `(status, concluida_em) where email_digest_enviado = false` para o cron do digest.

---

## 5. Ofertas (gamificação)

### 5.1 `offers` — catálogo global do admin

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text not null unique` | |
| `titulo` | `text not null` | "Vendas automatizadas por WhatsApp" |
| `insight_padrao` | `text not null` | "Aumente 15% sua taxa de conversão…" |
| `descricao_entrega` | `text` | O que está incluso |
| `preco_padrao_centavos` | `integer not null` | `check >= 0` |
| `recorrencia_centavos` | `integer not null default 0` | Impacto na mensalidade, se houver |
| `prazo_estimado_dias` | `integer` | |
| `template_fases` | `jsonb not null default '[]'` | Fases/tasks materializadas ao desbloquear |
| `ativa` | `boolean not null default true` | |
| `created_at` / `updated_at` | | |

```sql
alter table public.offers enable row level security;

-- O catálogo NÃO é legível pelo cliente. O cliente só vê a instância
-- publicada no projeto dele (project_offers). Isso evita expor preço
-- padrão e o portfólio inteiro de capacidades.
create policy "somente admin acessa o catalogo"
  on public.offers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

### 5.2 `project_offers` — a oferta na timeline de um cliente

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `project_id` | `uuid` FK, cascade | |
| `offer_id` | `uuid` FK → offers | |
| `slug` | `text not null` | URL de `/app/desbloquear/[offerSlug]`; único por projeto |
| `titulo` | `text not null` | Cópia no momento da publicação (snapshot) |
| `insight` | `text not null` | Copy específica para este cliente |
| `descricao_entrega` | `text` | |
| `preco_centavos` | `integer not null` | `check >= 0` — preço efetivo deste cliente |
| `prazo_estimado_dias` | `integer` | |
| `status` | `text not null default 'rascunho'` | `check in ('rascunho','disponivel','em_negociacao','desbloqueada','removida')` |
| `ordem` | `integer not null default 0` | |
| `impressoes` | `integer not null default 0` | Telemetria E3.7 |
| `cliques` | `integer not null default 0` | |
| `desbloqueada_em` | `timestamptz` | |
| `created_at` / `updated_at` | | |

**Snapshot deliberado:** título, insight, descrição e preço são copiados do catálogo no momento da publicação. Editar o catálogo depois não deve alterar retroativamente uma oferta que o cliente já viu ou pela qual já pagou.

```sql
alter table public.project_offers enable row level security;

-- Cliente vê apenas ofertas publicadas do próprio projeto.
-- rascunho e removida ficam invisíveis.
create policy "membro le ofertas publicadas do seu projeto"
  on public.project_offers for select to authenticated
  using (
    status in ('disponivel','em_negociacao','desbloqueada')
    and exists (
      select 1 from public.projects p
       where p.id = project_offers.project_id
         and public.is_org_member(p.organization_id)
    )
  );

create policy "admin le tudo"
  on public.project_offers for select to authenticated
  using (public.is_admin());

create policy "somente admin escreve ofertas do projeto"
  on public.project_offers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- A transição disponivel -> em_negociacao disparada pelo cliente ocorre
-- em Server Action com service_role, após validar o vínculo e o estado.
-- O cliente nunca faz update direto.
```

Índice: `(project_id, status, ordem)`.

**Regra de vitrine (aplicada na consulta, não no banco):** no máximo 3 ofertas com status `disponivel` exibidas por projeto, sempre ao fim da timeline.

---

## 6. Financeiro

### 6.1 `subscriptions`

Uma por organização, no máximo.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK, cascade, `unique` | |
| `valor_centavos` | `integer not null default 0` | `check >= 0`. **Zero é válido e significa "sem recorrência"** |
| `dia_vencimento` | `integer not null default 10` | `check between 1 and 28` — evita o problema de dia 29–31 |
| `status` | `text not null default 'ativa'` | `check in ('ativa','pausada','cancelada','inadimplente')` |
| `provider_subscription_id` | `text` | `null` quando `valor_centavos = 0` |
| `iniciada_em` | `date not null default current_date` | |
| `cancelada_em` | `timestamptz` | |
| `created_at` / `updated_at` | | |

Constraint que grava a regra do R$ 0 no banco:

```sql
alter table public.subscriptions
  add constraint sub_zero_sem_provider
  check (valor_centavos > 0 or provider_subscription_id is null);
```

RLS: `select` para membros da organização (o cliente pode ver o que paga); `all` só para admin.

### 6.2 `charges`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `subscription_id` | `uuid` FK, null | Preenchido quando recorrente |
| `project_offer_id` | `uuid` FK, null | Preenchido quando desbloqueio |
| `tipo` | `text not null` | `check in ('assinatura','desbloqueio')` |
| `valor_centavos` | `integer not null` | `check > 0` — cobrança de zero não existe |
| `metodo` | `text` | `check in ('pix','credito','debito')` |
| `status` | `text not null default 'pendente'` | `check in ('pendente','agendada','paga','vencida','falhou','estornada','cancelada')` |
| `vencimento` | `date not null` | |
| `data_pagamento` | `timestamptz` | Base da "receita realizada" |
| `provider_charge_id` | `text unique` | |
| `checkout_url` | `text` | |
| `pix_payload` | `text` | Copia-e-cola |
| `pix_qrcode_base64` | `text` | |
| `idempotency_key` | `text not null unique` | Evita cobrança duplicada |
| `motivo_falha` | `text` | Traduzido para o cliente |
| `tentativas` | `integer not null default 0` | Retry da recorrência |
| `created_at` / `updated_at` | | |

Exatamente um dos vínculos deve estar presente:

```sql
alter table public.charges
  add constraint charge_vinculo_unico
  check (
    (tipo = 'assinatura'  and subscription_id is not null and project_offer_id is null) or
    (tipo = 'desbloqueio' and project_offer_id is not null and subscription_id is null)
  );
```

Índices: `(organization_id, status)`, `(status, vencimento)`, `(data_pagamento)` — este último sustenta a dashboard financeira.

RLS: `select` para membros da organização (E4.4, `/app/faturas`); escrita **exclusivamente service_role** — nem o admin escreve pela sessão, porque toda mudança de estado vem de webhook.

### 6.3 `payment_events`

Log bruto de webhook. Gravado **antes** de qualquer interpretação.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `provider` | `text not null` | `mock` ou `asaas` |
| `provider_event_id` | `text not null` | `unique (provider, provider_event_id)` → idempotência |
| `tipo` | `text not null` | Evento cru do provedor |
| `payload` | `jsonb not null` | Corpo integral |
| `assinatura_valida` | `boolean not null` | |
| `processado_em` | `timestamptz` | `null` = ainda não interpretado |
| `erro_processamento` | `text` | |
| `recebido_em` | `timestamptz default now()` | |

RLS: nenhuma política para `authenticated`. Apenas service_role. O admin consulta por uma view ou pela tela de auditoria.

---

## 7. Operação

### 7.1 `email_log`

| Coluna | Tipo |
|---|---|
| `id` `uuid` PK · `tag` `text` (M1…M5) · `destinatario` `text` · `assunto` `text` · `organization_id` `uuid` null · `status` `text` (`enviado`/`falhou`/`bounce`) · `provider_message_id` `text` · `erro` `text` · `created_at` |

Só admin lê.

### 7.2 `audit_log`

| Coluna | Tipo |
|---|---|
| `id` `uuid` PK · `actor_id` `uuid` · `acao` `text` · `entidade` `text` · `entidade_id` `uuid` · `antes` `jsonb` · `depois` `jsonb` · `ip` `inet` · `created_at` |

Só admin lê. Escrita por service_role a partir das Server Actions.

---

## 8. Ordem das migrations

```
0001_extensions_e_funcoes.sql     pgcrypto, set_updated_at, is_admin, is_org_member, is_org_owner
0002_identidade.sql               profiles (+ trigger em auth.users), organizations,
                                  organization_members, invitations
0003_projetos.sql                 projects, phases, tasks
0004_ofertas.sql                  offers, project_offers
0005_financeiro.sql               subscriptions, charges, payment_events
0006_operacao.sql                 email_log, audit_log
0007_rls.sql                      todas as políticas (isoladas para facilitar revisão)
0008_realtime.sql                 publicação Realtime apenas de tasks e phases
0009_migracao_mvp.sql             migração dos dados do MVP (ver §9)
```

Isolar as políticas numa migration própria é intencional: é o arquivo que precisa de revisão mais cuidadosa e ele deve poder ser lido inteiro de uma vez.

---

## 9. Migração dos dados do MVP

Volume atual é pequeno; a migração pode ser feita com script único e conferida manualmente.

| Origem (MVP) | Destino (v1) | Observação |
|---|---|---|
| `clients` | `organizations` | `nome` e `slug` diretos; `documento`, telefone e email de faturamento ficam nulos e são preenchidos pelo admin |
| `projects` | `projects` | **`public_id` é descartado.** `slug` gerado a partir de `nome`, resolvendo colisão por sufixo |
| `phases` | `phases` | Direto |
| `tasks` | `tasks` | Direto; `slug` gerado do título; `concluida_em` recebe `updated_at` para tasks já concluídas; `email_digest_enviado = true` para não disparar avalanche de emails de histórico |
| — | `organization_members` | Vazio: cada cliente precisa ser convidado (F-A) |
| — | `subscriptions` | Criar uma por organização com `valor_centavos = 0`, ajustada manualmente depois |

**Cuidado explícito:** marcar `email_digest_enviado = true` em toda task já concluída antes de ligar o cron de digest. Sem isso, o primeiro ciclo notifica meses de histórico.

Após a migração e a validação, derrubar as tabelas antigas que não foram reaproveitadas e remover `supabase/schema.sql` do repositório.

---

## 10. Checklist de verificação da RLS

A ser executado antes de considerar a F1 concluída. Com a chave anônima e um usuário da organização A autenticado:

- [ ] `select * from organizations` retorna **apenas** a organização A.
- [ ] `select * from projects` retorna apenas projetos de A.
- [ ] `select * from phases` e `tasks` retornam apenas os de A.
- [ ] `select * from offers` retorna **zero linhas** (catálogo é invisível ao cliente).
- [ ] `select * from project_offers` retorna apenas as de A e **nenhuma** em `rascunho` ou `removida`.
- [ ] `select * from charges` retorna apenas as de A.
- [ ] `select * from payment_events`, `email_log`, `audit_log` retornam zero linhas.
- [ ] Qualquer `insert`/`update`/`delete` em `projects`, `phases`, `tasks`, `offers`, `project_offers`, `charges` é rejeitado.
- [ ] `update profiles set must_change_password = false where id = auth.uid()` é rejeitado.
- [ ] Repetir tudo com um usuário sem nenhum vínculo: todas as consultas retornam zero linhas.
- [ ] Repetir com a chave anônima **sem autenticação**: todas as consultas retornam zero linhas.
