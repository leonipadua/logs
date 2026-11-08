-- Logs v2 · Fase 3 — Projeto e portal do cliente.
-- Estende projects (origem da pausa do relógio, 1 projeto por contrato) e
-- cria project_meetings (agenda de reuniões e treinamentos gravados).

-- 1. projects ---------------------------------------------------------------

-- Distingue a pausa automática (cron, pendência vencida) da manual (admin):
-- só a automática é retomada sozinha quando o vencimento é resolvido.
alter table public.projects
  add column relogio_origem text check (relogio_origem in ('automatico', 'manual'));

-- criarProjetoDoContrato é idempotente: no máximo um projeto por contrato.
create unique index projects_contract_id_key
  on public.projects (contract_id) where contract_id is not null;

-- 2. project_meetings -------------------------------------------------------

create table public.project_meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  tipo text not null default 'reuniao' check (tipo in ('kickoff', 'treinamento', 'reuniao')),
  titulo text not null,
  descricao text,
  ocorre_em timestamptz not null,
  duracao_min integer check (duracao_min is null or duracao_min > 0),
  link_reuniao text,
  -- Treinamentos gravados ficam no portal (PRD §4).
  gravacao_url text,
  status text not null default 'agendada' check (status in ('agendada', 'realizada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.project_meetings (project_id, ocorre_em);
create index on public.project_meetings (project_id, tipo);

create trigger set_project_meetings_updated_at
  before update on public.project_meetings
  for each row execute function public.set_updated_at();

alter table public.project_meetings enable row level security;

create policy "somente admin escreve reunioes"
  on public.project_meetings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "membro le reunioes dos seus projetos"
  on public.project_meetings for select to authenticated
  using (
    exists (
      select 1 from public.projects pr
       where pr.id = project_meetings.project_id
         and public.is_org_member(pr.organization_id)
    )
  );

revoke all on public.project_meetings from anon;
