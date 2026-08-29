-- audit_log (E6.7, usado desde a F1 pelas actions de convite/revogação) e
-- rate_limit_hits (SECURITY §3 — contador em Postgres com janela deslizante).
-- Antecipadas da numeração original do DATA_MODEL porque o produto é
-- construído fase a fase, não de uma vez.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  antes jsonb,
  depois jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

create index on public.audit_log (entidade, entidade_id);

alter table public.audit_log enable row level security;

create policy "admin le auditoria"
  on public.audit_log for select to authenticated
  using (public.is_admin());
-- Escrita exclusiva por service_role (Server Actions), que ignora RLS.

-- ---------------------------------------------------------------------

create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  chave text not null,
  created_at timestamptz not null default now()
);

create index on public.rate_limit_hits (chave, created_at);

alter table public.rate_limit_hits enable row level security;
-- Nenhuma política para authenticated/anon: apenas service_role acessa.
