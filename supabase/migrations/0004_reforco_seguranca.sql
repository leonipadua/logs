-- Correções apontadas pelo Supabase Advisor após 0001-0003.

-- search_path mutável é vetor de escalonamento mesmo em funções sem
-- security definer explícito, se o role puder manipular o search_path da
-- sessão.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Funções de trigger não são chamadas via RPC por ninguém — só pelo próprio
-- Postgres. Revogar execução direta de anon/authenticated.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.prevent_self_clear_must_change_password() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;

-- is_admin/is_org_member/is_org_owner precisam continuar executáveis por
-- authenticated (são chamadas pelo próprio motor de RLS com o papel do
-- usuário). anon nunca aciona política alguma que as use — revogar apenas
-- a chamada direta via RPC pública.
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_org_member(uuid) from anon;
revoke execute on function public.is_org_owner(uuid) from anon;
