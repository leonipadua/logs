-- Pagamentos (E4, E5). Construído inteiramente atrás do adaptador mock —
-- nenhuma credencial do Asaas existe ainda (F8 troca o adaptador).

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  valor_centavos integer not null default 0 check (valor_centavos >= 0),
  dia_vencimento integer not null default 10 check (dia_vencimento between 1 and 28),
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'cancelada', 'inadimplente')),
  provider_subscription_id text,
  iniciada_em date not null default current_date,
  cancelada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sub_zero_sem_provider check (valor_centavos > 0 or provider_subscription_id is null)
);

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "membro le a assinatura da sua organizacao"
  on public.subscriptions for select to authenticated
  using (public.is_org_member(organization_id) or public.is_admin());

create policy "somente admin escreve assinatura"
  on public.subscriptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id),
  project_offer_id uuid references public.project_offers (id),
  tipo text not null check (tipo in ('assinatura', 'desbloqueio')),
  valor_centavos integer not null check (valor_centavos > 0),
  metodo text check (metodo in ('pix', 'credito', 'debito')),
  status text not null default 'pendente' check (status in ('pendente', 'agendada', 'paga', 'vencida', 'falhou', 'estornada', 'cancelada')),
  vencimento date not null,
  data_pagamento timestamptz,
  provider_charge_id text unique,
  checkout_url text,
  pix_payload text,
  pix_qrcode_base64 text,
  idempotency_key text not null unique,
  motivo_falha text,
  tentativas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charge_vinculo_unico check (
    (tipo = 'assinatura' and subscription_id is not null and project_offer_id is null) or
    (tipo = 'desbloqueio' and project_offer_id is not null and subscription_id is null)
  )
);

create index on public.charges (organization_id, status);
create index on public.charges (status, vencimento);
create index on public.charges (data_pagamento);

create trigger set_charges_updated_at
  before update on public.charges
  for each row execute function public.set_updated_at();

alter table public.charges enable row level security;

-- Leitura para membros (E4.4, /app/faturas). Escrita exclusiva de
-- service_role — toda mudança de estado vem do webhook, nem o admin
-- escreve pela própria sessão.
create policy "membro le cobrancas da sua organizacao"
  on public.charges for select to authenticated
  using (public.is_org_member(organization_id) or public.is_admin());

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  tipo text not null,
  payload jsonb not null,
  assinatura_valida boolean not null,
  processado_em timestamptz,
  erro_processamento text,
  recebido_em timestamptz not null default now(),
  unique (provider, provider_event_id)
);

alter table public.payment_events enable row level security;
-- Nenhuma política para authenticated: só service_role (webhook) escreve
-- e lê. Admin consulta via tela própria, que usa o client de servidor
-- com is_admin() — adicionamos select para admin por conveniência de
-- auditoria futura.
create policy "admin le eventos de pagamento"
  on public.payment_events for select to authenticated
  using (public.is_admin());
