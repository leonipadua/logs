-- Gamificação (E3). Catálogo global do admin + instância publicada por projeto.

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  insight_padrao text not null,
  descricao_entrega text,
  preco_padrao_centavos integer not null default 0 check (preco_padrao_centavos >= 0),
  recorrencia_centavos integer not null default 0 check (recorrencia_centavos >= 0),
  prazo_estimado_dias integer,
  template_fases jsonb not null default '[]',
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

alter table public.offers enable row level security;

-- O catálogo NÃO é legível pelo cliente — só a instância publicada no
-- projeto dele (project_offers). Evita expor preço padrão e o portfólio
-- inteiro de capacidades.
create policy "somente admin acessa o catalogo"
  on public.offers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.project_offers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  offer_id uuid references public.offers (id),
  slug text not null,
  titulo text not null,
  insight text not null,
  descricao_entrega text,
  preco_centavos integer not null default 0 check (preco_centavos >= 0),
  prazo_estimado_dias integer,
  status text not null default 'rascunho' check (status in ('rascunho', 'disponivel', 'em_negociacao', 'desbloqueada', 'removida')),
  ordem integer not null default 0,
  impressoes integer not null default 0,
  cliques integer not null default 0,
  desbloqueada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create index on public.project_offers (project_id, status, ordem);

create trigger set_project_offers_updated_at
  before update on public.project_offers
  for each row execute function public.set_updated_at();

alter table public.project_offers enable row level security;

-- Cliente vê apenas ofertas publicadas do próprio projeto. rascunho e
-- removida ficam invisíveis.
create policy "membro le ofertas publicadas do seu projeto"
  on public.project_offers for select to authenticated
  using (
    status in ('disponivel', 'em_negociacao', 'desbloqueada')
    and exists (
      select 1 from public.projects p
       where p.id = project_offers.project_id
         and public.is_org_member(p.organization_id)
    )
  );

create policy "admin le tudo"
  on public.project_offers for select to authenticated
  using (public.is_admin());

create policy "somente admin escreve ofertas do projeto"
  on public.project_offers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- A transição disponivel -> em_negociacao disparada pelo cliente ocorre em
-- Server Action com service_role, após validar o vínculo e o estado. O
-- cliente nunca faz update direto (mesmo com is_org_member, a política
-- acima nega escrita a quem não é admin).

-- Fases materializadas por um desbloqueio referenciam a oferta de origem.
alter table public.phases
  add constraint phases_origem_offer_id_fkey
  foreign key (origem_offer_id) references public.project_offers (id);
