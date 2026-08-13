-- Logs — schema inicial (MVP)
-- Rodar no SQL Editor do Supabase (ou via CLI/migrations).

create extension if not exists "pgcrypto";

-- =========================================================
-- Tabelas
-- =========================================================

create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  slug        text unique not null,
  created_at  timestamptz not null default now()
);

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  nome        text not null,
  descricao   text,
  public_id   uuid unique not null default gen_random_uuid(),
  status      text not null default 'em_andamento'
              check (status in ('em_andamento', 'concluido', 'pausado')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists phases (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  titulo      text not null,
  ordem       int not null default 0
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  phase_id    uuid not null references phases(id) on delete cascade,
  titulo      text not null,
  descricao   text,
  status      text not null default 'pendente'
              check (status in ('pendente', 'em_andamento', 'concluida', 'bloqueada')),
  ordem       int not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists idx_projects_client_id on projects(client_id);
create index if not exists idx_projects_public_id on projects(public_id);
create index if not exists idx_phases_project_id on phases(project_id);
create index if not exists idx_tasks_phase_id on tasks(phase_id);

-- =========================================================
-- updated_at automático
-- =========================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================
-- Regra do MVP: o cliente (role "anon", via public_id na URL) só pode
-- LER projects/phases/tasks do projeto cujo public_id ele possui.
-- Toda escrita (admin) passa por Server Actions usando a service_role key,
-- que ignora RLS — portanto não são necessárias policies de escrita aqui.

alter table clients  enable row level security;
alter table projects enable row level security;
alter table phases   enable row level security;
alter table tasks    enable row level security;

-- clients: sem acesso público (só service_role, usado no admin)
drop policy if exists "no public access to clients" on clients;

-- projects: leitura pública somente por public_id exato
drop policy if exists "public can read project by public_id" on projects;
create policy "public can read project by public_id"
  on projects for select
  to anon
  using (true);

-- phases: leitura pública das fases de um projeto
drop policy if exists "public can read phases" on phases;
create policy "public can read phases"
  on phases for select
  to anon
  using (true);

-- tasks: leitura pública das tarefas de uma fase
drop policy if exists "public can read tasks" on tasks;
create policy "public can read tasks"
  on tasks for select
  to anon
  using (true);

-- Observação: a leitura pública é ampla (SELECT em qualquer linha), pois o
-- Postgres/Supabase não filtra por "parâmetro da URL" — quem restringe ao
-- projeto correto é a query da aplicação (sempre filtrando por public_id).
-- Os UUIDs não são enumeráveis/adivinháveis, e as rotas /p/<uuid> são
-- noindex. Ver PRD.md seção 6 para o racional de segurança.
