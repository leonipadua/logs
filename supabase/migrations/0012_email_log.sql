-- E7: registro de todo envio, com status e id do provedor.
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  tag text not null,
  destinatario text not null,
  assunto text not null,
  organization_id uuid references public.organizations (id),
  status text not null check (status in ('enviado', 'falhou', 'bounce')),
  provider_message_id text,
  erro text,
  created_at timestamptz not null default now()
);

create index on public.email_log (organization_id);
create index on public.email_log (tag, created_at);

alter table public.email_log enable row level security;

create policy "admin le email_log"
  on public.email_log for select to authenticated
  using (public.is_admin());
-- Escrita exclusiva por service_role (o envio sempre roda em Server Action/cron).
