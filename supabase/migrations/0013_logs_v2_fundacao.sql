-- Logs v2 — Fundação + schema das fases 2 e 3 (PRD_LOGS_V2 §6, DECISOES_V2).
-- Mapeamento: account = organizations; sprint = phases; task = tasks;
-- offer do PRD (proposta) = proposals (a `offers` existente segue sendo a
-- oferta trancada de upsell); project/contract = projects + contracts.
--
-- Regras invioláveis no banco:
--   * Preço só vem do catálogo: proposals/proposal_items NÃO têm coluna de
--     valor. O total é derivado por calc_proposta_preco(); contracts e
--     change_requests têm o valor congelado/derivado por trigger.
--   * Cliente só enxerga a própria conta (is_org_member). Lead nunca recebe
--     policy para anon: o acesso por token passa por funções security
--     definer executáveis só por service_role (rota server-side).

-- =========================================================
-- 1. organizations (account)
-- =========================================================

alter table public.organizations
  add column segmento text,
  add column cidade text,
  add column estagio text not null default 'prospeccao'
    check (estagio in ('prospeccao', 'conexao', 'diagnostico', 'proposta', 'fechado', 'cliente')),
  add column saude text
    check (saude in ('saudavel', 'atencao', 'risco')),
  add column asaas_customer_id text;

-- Todas as organizações anteriores a esta migration são clientes ativos.
update public.organizations set estagio = 'cliente';

create unique index organizations_asaas_customer_id_key
  on public.organizations (asaas_customer_id) where asaas_customer_id is not null;
create index on public.organizations (estagio);

-- =========================================================
-- 2. Catálogo: modules, tiers, tier_modules, payment_conditions
-- =========================================================

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  preco_implementacao_centavos integer not null default 0 check (preco_implementacao_centavos >= 0),
  mensalidade_centavos integer not null default 0 check (mensalidade_centavos >= 0),
  horas_estimadas numeric(6, 1) not null default 0 check (horas_estimadas >= 0),
  -- Tags de dor que mapeiam para este módulo (mapeamento dor -> módulo por regra).
  dores_gatilho text[] not null default '{}',
  ativo boolean not null default true,
  placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_modules_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

-- ordem 1..3 = ancoragem (barato, alvo, cheio). `alvo` é o do meio por
-- construção: não dá para marcar outro tier como alvo.
create table public.tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  ordem smallint not null unique check (ordem between 1 and 3),
  nome text not null,
  descricao text,
  alvo boolean generated always as (ordem = 2) stored,
  ativo boolean not null default true,
  placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_tiers_updated_at
  before update on public.tiers
  for each row execute function public.set_updated_at();

create table public.tier_modules (
  tier_id uuid not null references public.tiers (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete restrict,
  ordem integer not null default 0,
  primary key (tier_id, module_id)
);

create index on public.tier_modules (module_id);

-- Única alavanca de preço permitida (PRD §7.3): condição de pagamento
-- definida no catálogo. ajuste_bps em pontos-base sobre a implementação
-- (ex.: -500 = 5% a menos à vista). Nunca por proposta.
create table public.payment_conditions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  ajuste_bps integer not null default 0 check (ajuste_bps between -3000 and 3000),
  ativo boolean not null default true,
  placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_payment_conditions_updated_at
  before update on public.payment_conditions
  for each row execute function public.set_updated_at();

-- Preço agregado de um tier (soma dos módulos ativos). Única fonte do total.
create or replace function public.calc_tier_preco(p_tier_id uuid)
returns table (implementacao_centavos bigint, mensalidade_centavos bigint, horas numeric)
language sql
stable
set search_path = public
as $$
  select
    coalesce(sum(m.preco_implementacao_centavos), 0)::bigint,
    coalesce(sum(m.mensalidade_centavos), 0)::bigint,
    coalesce(sum(m.horas_estimadas), 0)::numeric
  from public.tier_modules tm
  join public.modules m on m.id = tm.module_id and m.ativo
  where tm.tier_id = p_tier_id;
$$;

-- =========================================================
-- 3. CRM: contacts, calls, pains
-- =========================================================

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  nome text not null,
  papel text not null default 'outro' check (papel in ('decisor', 'operador', 'outro')),
  whatsapp text,
  email text,
  principal boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.contacts (organization_id);

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  tipo text not null check (tipo in ('prospeccao', 'diagnostico', 'vendas')),
  realizada_em timestamptz not null default now(),
  resultado text check (resultado in ('avancou', 'agendou', 'sem_avanco', 'sem_resposta', 'perdido', 'fechado')),
  duracao_min integer check (duracao_min is null or duracao_min >= 0),
  -- Qualificação BANT: {budget, authority, need, timing} — estrutura livre por ora.
  bant jsonb not null default '{}' check (jsonb_typeof(bant) = 'object'),
  notas text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.calls (organization_id, realizada_em desc);
create index on public.calls (tipo, realizada_em desc);

create trigger set_calls_updated_at
  before update on public.calls
  for each row execute function public.set_updated_at();

create table public.pains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  call_id uuid references public.calls (id) on delete set null,
  module_id uuid references public.modules (id) on delete set null,
  tipo_spin text not null check (tipo_spin in ('situacao', 'problema', 'implicacao', 'necessidade')),
  categoria text,
  descricao text not null,
  valor_numerico numeric(14, 2),
  unidade text,
  custo_mensal_centavos bigint check (custo_mensal_centavos is null or custo_mensal_centavos >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- PRD §3.1: Implicação exige número (leads perdidos/mês, ticket médio, horas).
  constraint pain_implicacao_exige_numero check (
    tipo_spin <> 'implicacao' or (valor_numerico is not null and unidade is not null)
  )
);

create index on public.pains (organization_id);
create index on public.pains (call_id);
create index on public.pains (module_id);

create trigger set_pains_updated_at
  before update on public.pains
  for each row execute function public.set_updated_at();

-- =========================================================
-- 4. Proposta viva: proposals, proposal_items
-- =========================================================

-- SEM coluna de preço, de propósito (PRD §7.1). O total vem de
-- calc_proposta_preco(). Não adicionar valor/preço/desconto aqui.
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  call_id uuid references public.calls (id) on delete set null,
  -- Token da URL pública (/proposta/<token>). Capacidade ao portador: só
  -- é lido por service_role via proposta_por_token(); nunca por anon.
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  titulo text,
  status text not null default 'rascunho' check (status in ('rascunho', 'enviada', 'aceita')),
  tier_sugerido_id uuid references public.tiers (id) on delete set null,
  tier_id uuid references public.tiers (id) on delete restrict,
  condicao_pagamento_id uuid references public.payment_conditions (id) on delete restrict,
  -- PRD §7.4: ROI sempre com premissas ({leads_mes, ticket_medio, ...}).
  premissas_roi jsonb not null default '{}' check (jsonb_typeof(premissas_roi) = 'object'),
  -- Narrativa gerada por NarrativeProvider (texto apenas; nunca preço/escopo).
  narrativa jsonb not null default '{}' check (jsonb_typeof(narrativa) = 'object'),
  validade_ate date,
  view_count integer not null default 0 check (view_count >= 0),
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  enviada_em timestamptz,
  aceita_em timestamptz,
  aceite_nome text,
  aceite_termos_versao text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposta_enviada_tem_data check (status = 'rascunho' or enviada_em is not null),
  constraint proposta_aceita_tem_tier check (status <> 'aceita' or (tier_id is not null and aceita_em is not null))
);

create index on public.proposals (organization_id, status);
create index on public.proposals (status, last_viewed_at desc);

create trigger set_proposals_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

-- Solução por dor: liga uma dor a um módulo, com texto personalizado.
create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  pain_id uuid references public.pains (id) on delete set null,
  module_id uuid not null references public.modules (id) on delete restrict,
  narrativa text,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  unique (proposal_id, module_id)
);

create index on public.proposal_items (proposal_id, ordem);
create index on public.proposal_items (pain_id);

-- Preço de uma proposta: tier escolhido (ou, antes do aceite, o informado
-- em p_tier_id / sugerido) + condição de pagamento. Sempre derivado do catálogo.
create or replace function public.calc_proposta_preco(p_proposal_id uuid, p_tier_id uuid default null)
returns table (implementacao_centavos bigint, mensalidade_centavos bigint, horas numeric)
language plpgsql
stable
set search_path = public
as $$
declare
  v_tier uuid;
  v_bps integer := 0;
  v_impl bigint;
  v_mens bigint;
  v_horas numeric;
begin
  select coalesce(p_tier_id, p.tier_id, p.tier_sugerido_id), coalesce(pc.ajuste_bps, 0)
    into v_tier, v_bps
    from public.proposals p
    left join public.payment_conditions pc on pc.id = p.condicao_pagamento_id
   where p.id = p_proposal_id;

  if v_tier is null then
    return query select 0::bigint, 0::bigint, 0::numeric;
    return;
  end if;

  select t.implementacao_centavos, t.mensalidade_centavos, t.horas
    into v_impl, v_mens, v_horas
    from public.calc_tier_preco(v_tier) t;

  return query select round(v_impl * (10000 + v_bps) / 10000.0)::bigint, v_mens, v_horas;
end;
$$;

-- Acesso do lead: SOMENTE service_role (rota server-side). Retorna apenas
-- campos próprios para o lead — nunca notas de call, BANT ou IDs internos.
create or replace function public.proposta_por_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'organization_id', p.organization_id,
    'organizacao_nome', o.nome,
    'titulo', p.titulo,
    'status', p.status,
    'tier_id', p.tier_id,
    'tier_sugerido_id', p.tier_sugerido_id,
    'condicao_pagamento_id', p.condicao_pagamento_id,
    'premissas_roi', p.premissas_roi,
    'narrativa', p.narrativa,
    'validade_ate', p.validade_ate,
    'aceita_em', p.aceita_em,
    'itens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'module_id', i.module_id, 'pain_id', i.pain_id, 'narrativa', i.narrativa, 'ordem', i.ordem
      ) order by i.ordem)
      from public.proposal_items i where i.proposal_id = p.id
    ), '[]'::jsonb)
  )
  from public.proposals p
  join public.organizations o on o.id = p.organization_id
  where p.token = p_token
    and p.status in ('enviada', 'aceita')
    and (p.validade_ate is null or p.validade_ate >= current_date or p.status = 'aceita');
$$;

-- Registra visualização (offer.viewed). Também só service_role.
create or replace function public.registrar_visualizacao_proposta(p_token text)
returns table (proposal_id uuid, organization_id uuid, view_count integer, primeira_vez boolean)
language sql
volatile
security definer
set search_path = public
as $$
  update public.proposals p
     set view_count = p.view_count + 1,
         first_viewed_at = coalesce(p.first_viewed_at, now()),
         last_viewed_at = now()
   where p.token = p_token and p.status in ('enviada', 'aceita')
  returning p.id, p.organization_id, p.view_count, (p.view_count = 1);
$$;

revoke execute on function public.proposta_por_token(text) from public, anon, authenticated;
revoke execute on function public.registrar_visualizacao_proposta(text) from public, anon, authenticated;
grant execute on function public.proposta_por_token(text) to service_role;
grant execute on function public.registrar_visualizacao_proposta(text) to service_role;

-- =========================================================
-- 5. Contratos
-- =========================================================

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  proposal_id uuid unique references public.proposals (id) on delete restrict,
  -- 'legado' = cliente anterior ao Logs v2 (ex.: Plena), sem proposta; os
  -- valores são do admin. Para 'proposta' o trigger força o valor do catálogo.
  origem text not null default 'proposta' check (origem in ('proposta', 'legado')),
  tier_id uuid references public.tiers (id) on delete restrict,
  status text not null default 'rascunho' check (status in ('rascunho', 'ativo', 'encerrado', 'cancelado')),
  vigencia_inicio date,
  vigencia_meses integer not null default 6 check (vigencia_meses >= 1),
  valor_implementacao_centavos integer not null default 0 check (valor_implementacao_centavos >= 0),
  mensalidade_centavos integer not null default 0 check (mensalidade_centavos >= 0),
  -- [{numero, tipo: 'entrada'|'parcela', valor_centavos, vencimento}]
  plano_parcelas jsonb not null default '[]' check (jsonb_typeof(plano_parcelas) = 'array'),
  -- O que entra na mensalidade de S4+ (itens de texto). Fora disso = change request.
  escopo_retainer jsonb not null default '[]' check (jsonb_typeof(escopo_retainer) = 'array'),
  termos_versao text,
  assinado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contrato_proposta_exige_origem check (origem = 'legado' or proposal_id is not null)
);

create index on public.contracts (organization_id, status);

create trigger set_contracts_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- Preço do contrato originado de proposta = catálogo, sem exceção.
create or replace function public.enforce_contract_catalog_price()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_impl bigint;
  v_mens bigint;
  v_horas numeric;
  v_tier uuid;
begin
  if new.origem = 'proposta' then
    select p.tier_id into v_tier from public.proposals p where p.id = new.proposal_id;
    if v_tier is null or new.tier_id is distinct from v_tier then
      raise exception 'Contrato deve usar o tier escolhido na proposta aceita.'
        using errcode = 'check_violation';
    end if;
    select c.implementacao_centavos, c.mensalidade_centavos, c.horas
      into v_impl, v_mens, v_horas
      from public.calc_proposta_preco(new.proposal_id) c;
    if new.valor_implementacao_centavos <> v_impl or new.mensalidade_centavos <> v_mens then
      raise exception 'Preço do contrato deve vir do catálogo (implementação %, mensalidade %).', v_impl, v_mens
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger contracts_preco_do_catalogo
  before insert or update of valor_implementacao_centavos, mensalidade_centavos, origem, proposal_id, tier_id
  on public.contracts
  for each row execute function public.enforce_contract_catalog_price();

-- =========================================================
-- 6. projects / phases (sprint) / tasks
-- =========================================================

alter table public.projects
  add column contract_id uuid references public.contracts (id) on delete set null,
  add column relogio text not null default 'rodando' check (relogio in ('rodando', 'pausado')),
  add column relogio_pausado_em timestamptz,
  add column relogio_motivo text,
  add column relogio_dias_pausados integer not null default 0 check (relogio_dias_pausados >= 0),
  -- null = projeto legado, fora do padrão S0–S4+ (não conta na capacidade).
  add column semana_atual smallint check (semana_atual is null or semana_atual >= 0),
  add column data_inicio_prevista date,
  add column data_fim_prevista date,
  add column na_fila boolean not null default false,
  add column start_date date;

create index on public.projects (contract_id);
create index on public.projects (na_fila, start_date) where na_fila;

alter table public.phases
  add column etapa text check (etapa in ('S0', 'S1', 'S2', 'S3', 'S4')),
  add column criterio_pronto text,
  add column status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida')),
  add column inicio_previsto date,
  add column fim_previsto date,
  add column fechada_em timestamptz;

-- S4 = "S4+" (pode repetir em ciclos); S0..S3 são únicas por projeto.
create unique index phases_projeto_etapa_key
  on public.phases (project_id, etapa) where etapa is not null and etapa <> 'S4';

alter table public.tasks
  add column dono text not null default 'sabre' check (dono in ('sabre', 'cliente')),
  add column categoria text check (categoria in ('dado', 'acesso', 'aprovacao', 'outro')),
  add column prazo date,
  add column bloqueada_por_tier_id uuid references public.tiers (id) on delete set null,
  add column module_id uuid references public.modules (id) on delete set null,
  -- Dedupe do evento client_task.overdue.
  add column vencida_registrada_em timestamptz;

create index on public.tasks (dono, prazo) where status <> 'concluida';
create index on public.tasks (module_id);
create index on public.tasks (bloqueada_por_tier_id);

-- Projetos ocupando capacidade: S0–S3 (semana 0..3), em andamento, fora da fila.
create or replace function public.projetos_em_implementacao()
returns integer
language sql
stable
set search_path = public
as $$
  select count(*)::integer
    from public.projects
   where status = 'em_andamento'
     and na_fila = false
     and semana_atual between 0 and 3;
$$;

-- =========================================================
-- 7. change_requests
-- =========================================================

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  descricao text not null,
  classificacao text check (classificacao in ('retainer', 'aditivo')),
  status text not null default 'aberto' check (status in ('aberto', 'aprovado', 'recusado', 'concluido')),
  module_id uuid references public.modules (id) on delete set null,
  -- Derivado do catálogo por trigger; nunca informado à mão.
  valor_centavos integer check (valor_centavos is null or valor_centavos >= 0),
  solicitado_por uuid references public.profiles (id) on delete set null,
  resolvido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint aditivo_exige_modulo check (classificacao is distinct from 'aditivo' or module_id is not null)
);

create index on public.change_requests (project_id, status);

create trigger set_change_requests_updated_at
  before update on public.change_requests
  for each row execute function public.set_updated_at();

create or replace function public.derive_change_request_valor()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.classificacao = 'aditivo' then
    select m.preco_implementacao_centavos into new.valor_centavos
      from public.modules m where m.id = new.module_id;
  else
    new.valor_centavos := null;
  end if;
  return new;
end;
$$;

create trigger change_requests_valor_do_catalogo
  before insert or update on public.change_requests
  for each row execute function public.derive_change_request_valor();

-- =========================================================
-- 8. settings + events
-- =========================================================

create table public.settings (
  chave text primary key check (chave ~ '^[a-z0-9_]+$'),
  valor jsonb not null,
  descricao text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo ~ '^[a-z_]+\.[a-z_]+$'),
  ator_tipo text not null check (ator_tipo in ('admin', 'cliente', 'lead', 'sistema')),
  ator_id uuid,
  organization_id uuid references public.organizations (id) on delete set null,
  entidade text not null,
  entidade_id uuid,
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object'),
  -- Só eventos marcados aparecem no portal do cliente (placar, linha do tempo).
  visivel_cliente boolean not null default false,
  ocorrido_em timestamptz not null default now()
);

create index on public.events (tipo, ocorrido_em desc);
create index on public.events (organization_id, ocorrido_em desc);
create index on public.events (entidade, entidade_id);
create index on public.events (ocorrido_em desc);

-- =========================================================
-- 9. RLS
-- =========================================================

alter table public.modules enable row level security;
alter table public.tiers enable row level security;
alter table public.tier_modules enable row level security;
alter table public.payment_conditions enable row level security;
alter table public.contacts enable row level security;
alter table public.calls enable row level security;
alter table public.pains enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.contracts enable row level security;
alter table public.change_requests enable row level security;
alter table public.settings enable row level security;
alter table public.events enable row level security;

-- Admin: acesso total. Tabelas internas (catálogo, CRM, config) são só do admin;
-- o cliente enxerga preço/escopo apenas via contrato e proposta aceita.
do $$
declare
  t text;
begin
  foreach t in array array[
    'modules', 'tiers', 'tier_modules', 'payment_conditions', 'contacts', 'calls',
    'pains', 'proposals', 'proposal_items', 'contracts', 'change_requests', 'settings'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      'somente admin acessa ' || t, t
    );
  end loop;
end $$;

create policy "admin le eventos"
  on public.events for select to authenticated
  using (public.is_admin());

create policy "membro le eventos visiveis da sua organizacao"
  on public.events for select to authenticated
  using (visivel_cliente and organization_id is not null and public.is_org_member(organization_id));
-- events: escrita só por service_role (logEvent).

create policy "membro le propostas aceitas da sua organizacao"
  on public.proposals for select to authenticated
  using (status = 'aceita' and public.is_org_member(organization_id));

create policy "membro le itens das propostas aceitas da sua organizacao"
  on public.proposal_items for select to authenticated
  using (
    exists (
      select 1 from public.proposals p
       where p.id = proposal_items.proposal_id
         and p.status = 'aceita'
         and public.is_org_member(p.organization_id)
    )
  );

create policy "membro le contratos da sua organizacao"
  on public.contracts for select to authenticated
  using (public.is_org_member(organization_id));

create policy "membro le pedidos de mudanca dos seus projetos"
  on public.change_requests for select to authenticated
  using (
    exists (
      select 1 from public.projects pr
       where pr.id = change_requests.project_id
         and public.is_org_member(pr.organization_id)
    )
  );

-- Funções auxiliares: fora do alcance de anon (RLS já bloquearia os dados).
revoke execute on function public.calc_tier_preco(uuid) from public, anon;
revoke execute on function public.calc_proposta_preco(uuid, uuid) from public, anon;
revoke execute on function public.projetos_em_implementacao() from public, anon;
revoke execute on function public.enforce_contract_catalog_price() from public, anon, authenticated;
revoke execute on function public.derive_change_request_valor() from public, anon, authenticated;
grant execute on function public.calc_tier_preco(uuid) to authenticated, service_role;
grant execute on function public.calc_proposta_preco(uuid, uuid) to authenticated, service_role;
grant execute on function public.projetos_em_implementacao() to authenticated, service_role;

-- Defesa em profundidade: anon nunca toca nas tabelas novas.
revoke all on
  public.modules, public.tiers, public.tier_modules, public.payment_conditions,
  public.contacts, public.calls, public.pains, public.proposals, public.proposal_items,
  public.contracts, public.change_requests, public.settings, public.events
from anon;

-- =========================================================
-- 10. Seed PLACEHOLDER (provisório — editável em /admin/catalogo)
-- =========================================================

insert into public.modules (slug, nome, descricao, preco_implementacao_centavos, mensalidade_centavos, horas_estimadas, dores_gatilho, placeholder) values
  ('agente-whatsapp', 'Agente de atendimento no WhatsApp', 'Provisório. Agente que responde e qualifica leads 24h no WhatsApp.', 400000, 60000, 24, '{atendimento,resposta_lenta,lead_perdido}', true),
  ('agenda-automatica', 'Agenda e confirmações automáticas', 'Provisório. Agendamento, lembretes e confirmação sem intervenção humana.', 200000, 30000, 12, '{agenda,no_show}', true),
  ('qualificacao-leads', 'Qualificação e roteamento de leads', 'Provisório. Pontua leads e encaminha ao vendedor certo.', 250000, 40000, 16, '{qualificacao,triagem}', true),
  ('crm-funil', 'CRM e funil de vendas', 'Provisório. Pipeline com histórico unificado de cada lead.', 350000, 50000, 20, '{controle,planilha,funil}', true),
  ('followup-reativacao', 'Follow-up e reativação automática', 'Provisório. Cadência automática para leads parados e base antiga.', 200000, 35000, 12, '{followup,base_parada}', true),
  ('painel-resultados', 'Painel de resultados', 'Provisório. Painel de leads, conversão e receita no pipeline.', 250000, 30000, 14, '{visibilidade,relatorio}', true),
  ('captacao-meta', 'Integração com captação (Meta Ads)', 'Provisório. Leads de anúncios entram direto no fluxo.', 300000, 30000, 16, '{anuncios,captacao}', true),
  ('treinamento-equipe', 'Treinamento da equipe', 'Provisório. Treinamentos de uso gravados e ao vivo.', 150000, 0, 8, '{adocao,equipe}', true)
on conflict (slug) do nothing;

insert into public.tiers (slug, ordem, nome, descricao, placeholder) values
  ('essencial', 1, 'Essencial', 'Provisório. Entrada: atendimento e agenda automatizados.', true),
  ('completo', 2, 'Completo', 'Provisório. Tier alvo: atendimento, qualificação, CRM e follow-up.', true),
  ('escala', 3, 'Escala', 'Provisório. Tudo do Completo mais captação, painel e treinamento.', true)
on conflict (slug) do nothing;

insert into public.tier_modules (tier_id, module_id, ordem)
select t.id, m.id, x.ordem
  from (values
    ('essencial', 'agente-whatsapp', 1),
    ('essencial', 'agenda-automatica', 2),
    ('completo', 'agente-whatsapp', 1),
    ('completo', 'agenda-automatica', 2),
    ('completo', 'qualificacao-leads', 3),
    ('completo', 'crm-funil', 4),
    ('completo', 'followup-reativacao', 5),
    ('escala', 'agente-whatsapp', 1),
    ('escala', 'agenda-automatica', 2),
    ('escala', 'qualificacao-leads', 3),
    ('escala', 'crm-funil', 4),
    ('escala', 'followup-reativacao', 5),
    ('escala', 'painel-resultados', 6),
    ('escala', 'captacao-meta', 7),
    ('escala', 'treinamento-equipe', 8)
  ) as x(tier_slug, module_slug, ordem)
  join public.tiers t on t.slug = x.tier_slug
  join public.modules m on m.slug = x.module_slug
on conflict do nothing;

insert into public.payment_conditions (slug, nome, descricao, ajuste_bps, placeholder) values
  ('padrao', 'Condição padrão', 'Provisório. Entrada + parcelas conforme contrato.', 0, true),
  ('a-vista', 'À vista', 'Provisório. Ajuste de pagamento à vista a definir pela Sabre (0 até lá).', 0, true)
on conflict (slug) do nothing;

insert into public.settings (chave, valor, descricao) values
  ('capacidade_max_projetos', '2', 'Máximo de projetos em S0–S3 ao mesmo tempo (PRD §4). O próximo entra na fila.'),
  ('horas_semana_disponiveis', '20', 'Provisório. Horas/semana disponíveis para a Sabre (questão em aberto do PRD §8).'),
  ('vigencia_minima_meses', '6', 'Vigência mínima padrão dos contratos, em meses.'),
  ('proposta_validade_dias', '15', 'Provisório. Dias de validade de uma proposta enviada.'),
  ('prazo_pendencia_cliente_dias', '3', 'Prazo padrão (D+N) das pendências do cliente; vencida pausa o relógio.')
on conflict (chave) do nothing;
