-- Migração dos dados do MVP para o novo esquema (DATA_MODEL §9).
-- Reaproveita os mesmos ids (organizations.id = mvp_clients.id,
-- projects.id = mvp_projects.id, etc.) — não há necessidade de tabela de
-- mapeamento com esse volume de dados.

insert into public.organizations (id, nome, slug, created_at)
select id, nome, slug, created_at from public.mvp_clients;

insert into public.projects (id, organization_id, nome, slug, descricao, status, created_at, updated_at)
select
  id,
  client_id,
  nome,
  lower(regexp_replace(regexp_replace(nome, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')),
  descricao,
  status,
  created_at,
  updated_at
from public.mvp_projects;

insert into public.phases (id, project_id, titulo, ordem)
select id, project_id, titulo, ordem from public.mvp_phases;

-- email_digest_enviado = true em toda task já concluída: sem isso, o
-- primeiro ciclo do cron de digest (F6) notificaria meses de histórico.
insert into public.tasks (id, phase_id, titulo, slug, descricao, status, ordem, concluida_em, email_digest_enviado, updated_at)
select
  id,
  phase_id,
  titulo,
  lower(regexp_replace(regexp_replace(titulo, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) || '-' || left(id::text, 8),
  descricao,
  status,
  ordem,
  case when status = 'concluida' then updated_at else null end,
  status = 'concluida',
  updated_at
from public.mvp_tasks;

drop table public.mvp_tasks;
drop table public.mvp_phases;
drop table public.mvp_projects;
drop table public.mvp_clients;
