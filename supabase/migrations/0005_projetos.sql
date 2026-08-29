-- Projetos, fases e tasks (E2). O `public_id` do MVP é descartado — acesso
-- passa a ser por sessão + vínculo de organização.
--
-- As tabelas do MVP ocupam esses mesmos nomes. Renomeadas com sufixo
-- `_mvp` para liberar o nome e servir de origem para a migration de dados
-- (0006), depois removidas.

alter table public.clients rename to mvp_clients;
alter table public.projects rename to mvp_projects;
alter table public.phases rename to mvp_phases;
alter table public.tasks rename to mvp_tasks;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  nome text not null,
  slug text not null,
  descricao text,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluido', 'pausado', 'arquivado')),
  previsao_entrega date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  titulo text not null,
  descricao text,
  ordem integer not null default 0,
  origem_offer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.phases (project_id, ordem);

create trigger set_phases_updated_at
  before update on public.phases
  for each row execute function public.set_updated_at();

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.phases (id) on delete cascade,
  titulo text not null,
  slug text not null,
  descricao text,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida', 'bloqueada')),
  motivo_bloqueio text,
  ordem integer not null default 0,
  concluida_em timestamptz,
  email_digest_enviado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, slug)
);

create index on public.tasks (phase_id, ordem);
create index on public.tasks (status, concluida_em) where email_digest_enviado = false;

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- RLS: leitura para membros da organização dona do projeto; escrita exclusiva do admin.

alter table public.projects enable row level security;

create policy "membro le projetos da sua organizacao"
  on public.projects for select to authenticated
  using (public.is_org_member(organization_id) or public.is_admin());

create policy "somente admin escreve projetos"
  on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.phases enable row level security;

create policy "membro le fases dos projetos da sua organizacao"
  on public.phases for select to authenticated
  using (
    exists (
      select 1 from public.projects p
       where p.id = phases.project_id
         and (public.is_org_member(p.organization_id) or public.is_admin())
    )
  );

create policy "somente admin escreve fases"
  on public.phases for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.tasks enable row level security;

create policy "membro le tasks dos projetos da sua organizacao"
  on public.tasks for select to authenticated
  using (
    exists (
      select 1 from public.phases ph
      join public.projects p on p.id = ph.project_id
       where ph.id = tasks.phase_id
         and (public.is_org_member(p.organization_id) or public.is_admin())
    )
  );

create policy "somente admin escreve tasks"
  on public.tasks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
