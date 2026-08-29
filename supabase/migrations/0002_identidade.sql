-- Identidade e organizações (E1). Tabelas primeiro, depois as funções que
-- dependem delas (is_org_member/is_org_owner), depois RLS — nessa ordem,
-- porque o Postgres valida a existência das relações na criação da função.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  must_change_password boolean not null default true,
  notificar_task_concluida boolean not null default true,
  ultimo_acesso_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Espelha auth.users -> profiles na criação do usuário (convite do admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  documento text,
  email_faturamento text,
  telefone text,
  provider_customer_id text,
  arquivada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  revogado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index on public.organization_members (organization_id);
create index on public.organization_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  nome text,
  role text not null default 'member' check (role in ('owner', 'member')),
  token_hash text not null,
  expira_em timestamptz not null default (now() + interval '7 days'),
  aceito_em timestamptz,
  revogado_em timestamptz,
  convidado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index on public.invitations (organization_id);
create index on public.invitations (email);

-- Funções que dependem de organization_members — precisam da tabela acima.

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

-- Impede o próprio usuário de zerar must_change_password por update direto.
-- A limpeza legítima ocorre em Server Action, via admin client (service_role),
-- depois de uma troca de senha real.
create or replace function public.prevent_self_clear_must_change_password()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'service_role'
     and old.must_change_password = true
     and new.must_change_password = false then
    raise exception 'must_change_password só pode ser limpa pelo servidor';
  end if;
  return new;
end;
$$;

create trigger guard_must_change_password
  before update on public.profiles
  for each row execute function public.prevent_self_clear_must_change_password();

-- RLS — nenhuma política permissiva, uma tabela de cada vez.

alter table public.profiles enable row level security;

create policy "usuario le o proprio perfil"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "usuario atualiza o proprio perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin gerencia perfis"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.organizations enable row level security;

create policy "membro le a propria organizacao"
  on public.organizations for select to authenticated
  using (public.is_org_member(id) or public.is_admin());

create policy "somente admin escreve organizacao"
  on public.organizations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.organization_members enable row level security;

-- Sem is_org_member aqui: evitaria recursão (a política consultaria a
-- própria tabela que protege).
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

alter table public.invitations enable row level security;

create policy "admin le convites"
  on public.invitations for select to authenticated
  using (public.is_admin());

create policy "owner le convites da sua organizacao"
  on public.invitations for select to authenticated
  using (public.is_org_owner(organization_id));

create policy "somente admin escreve convites"
  on public.invitations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
