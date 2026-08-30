-- Vitrine de indicações. Cada cliente recebe um link único que ele envia para
-- conhecidos; o indicado (lead, sem conta) abre o link e vê as ofertas que a
-- Sabre curou para aquela vitrine. Objetivo: transformar cliente satisfeito em
-- canal de aquisição, com atribuição de quem indicou.

-- 1. Conteúdo público do catálogo -------------------------------------------
-- offers hoje só tem texto interno (insight_padrao é copy de gamificação para
-- quem já é cliente). O lead precisa de conteúdo de venda próprio, e nenhum
-- preço: a conversa de valor acontece no WhatsApp.

alter table public.offers
  add column resumo_publico text,
  add column descricao_publica text,
  add column entregaveis jsonb not null default '[]',
  add column para_quem text,
  add column resultado_esperado text,
  add column prazo_publico text;

comment on column public.offers.resumo_publico is 'Frase curta exibida no card da vitrine de indicação.';
comment on column public.offers.entregaveis is 'Array de strings: tudo que está incluso na contratação.';
comment on column public.offers.prazo_publico is 'Texto livre ("3 a 4 semanas"), separado do prazo_estimado_dias interno.';

-- 2. Links de indicação ------------------------------------------------------

create table public.referral_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token text not null unique,
  nome text not null,
  ativo boolean not null default true,
  visitas integer not null default 0 check (visitas >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Diferente de invitations.token_hash, o token aqui é gravado EM CLARO. Não é
-- credencial: é uma URL de marketing que o cliente divulga e que o admin
-- precisa poder recopiar a qualquer momento. O que ele libera é uma vitrine
-- sem preço e sem dado de terceiro — o risco de vazamento é a própria
-- divulgação, que é o objetivo.
comment on column public.referral_links.token is 'Token público em claro (URL de divulgação, não credencial).';
comment on column public.referral_links.nome is 'Nome do indicador exibido para o lead ("Indicado por ...").';

create index on public.referral_links (organization_id);

create trigger set_referral_links_updated_at
  before update on public.referral_links
  for each row execute function public.set_updated_at();

alter table public.referral_links enable row level security;

-- Sem política para anon: a página pública lê via service_role, nunca expondo
-- a tabela inteira (que lista todos os clientes que indicam).
create policy "somente admin acessa os links de indicacao"
  on public.referral_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 3. Curadoria por link ------------------------------------------------------
-- A seleção é por link, não global: a vitrine enviada por uma padaria mostra
-- ofertas diferentes da enviada por uma clínica.

create table public.referral_link_offers (
  id uuid primary key default gen_random_uuid(),
  referral_link_id uuid not null references public.referral_links (id) on delete cascade,
  offer_id uuid not null references public.offers (id) on delete cascade,
  ordem integer not null default 0,
  visitas integer not null default 0 check (visitas >= 0),
  cliques integer not null default 0 check (cliques >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (referral_link_id, offer_id)
);

create index on public.referral_link_offers (referral_link_id, ordem);

create trigger set_referral_link_offers_updated_at
  before update on public.referral_link_offers
  for each row execute function public.set_updated_at();

alter table public.referral_link_offers enable row level security;

create policy "somente admin acessa a curadoria da vitrine"
  on public.referral_link_offers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
