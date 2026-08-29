-- Extensões e funções auxiliares sem dependência de tabela.
-- security definer + search_path fixo: sem isso são vetor de escalonamento.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Papel global de administrador Sabre. Fonte: app_metadata do JWT (só
-- service_role escreve). Nunca derivar de user_metadata (o usuário altera).
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
