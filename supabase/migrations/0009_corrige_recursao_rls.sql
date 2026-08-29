-- Bug real da 0002: a política "owner le os membros da sua organizacao"
-- fazia um subselect direto em organization_members dentro da própria
-- política dessa tabela — recursão infinita. is_org_owner() é security
-- definer e resolve isso (a consulta interna roda com o papel do dono da
-- função, não do usuário, e não reaciona a política de quem chamou).

drop policy "owner le os membros da sua organizacao" on public.organization_members;

create policy "owner le os membros da sua organizacao"
  on public.organization_members for select to authenticated
  using (public.is_org_owner(organization_id));
