-- A 0004 revogou execução de `anon`/`authenticated` diretamente, mas toda
-- função ganha `execute` para o pseudo-papel `public` na criação — e todo
-- papel (inclusive anon/authenticated) herda de `public`. Revogar do papel
-- nomeado não remove essa concessão implícita; é preciso revogar de `public`.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.prevent_self_clear_must_change_password() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_org_member(uuid) from public;
revoke execute on function public.is_org_owner(uuid) from public;

-- is_admin/is_org_member/is_org_owner continuam necessárias para o motor
-- de RLS, que as executa com o papel do usuário autenticado.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_owner(uuid) to authenticated;
