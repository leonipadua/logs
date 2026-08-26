# ARCHITECTURE — Sabre Logs v1

Documento técnico de referência. Define stack, estrutura, camadas de abstração e as convenções que a implementação deve seguir. Complementa o [PRD](./PRD.md).

---

## 1. Stack

| Camada | Escolha | Observação |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Já instalado e pinado em `16.3.0` |
| UI | **React 19** | Server Components por padrão |
| Estilo | **Tailwind CSS v4** (CSS-first) | Sem `tailwind.config.js`; tokens em `@theme` no `globals.css` |
| Banco + Auth + Realtime | **Supabase** (Postgres) | Auth nativo substitui a senha única do MVP |
| Sessão SSR | **`@supabase/ssr`** | A instalar; o MVP usa `supabase-js` com `persistSession: false` |
| Validação | **zod** | A instalar; hoje não há validação nenhuma |
| Estado de formulário | `useActionState` + Server Actions | Erro por campo, não `throw` |
| Email | **Resend**, atrás de `EmailProvider` | Ver §4 |
| Pagamento | **Asaas**, atrás de `PaymentProvider` | Ver §4 — conta ainda não existe |
| Hospedagem | Vercel | Já vinculado (`.vercel/`) |

### O que deliberadamente **não** entra

- **shadcn/ui** — a direção visual ([DESIGN_SYSTEM](./DESIGN_SYSTEM.md)) é editorial, não o default do shadcn. Adotá-lo empurraria o produto para a estética genérica que o Leoni pediu para evitar. Componentes primitivos (dialog, popover, select acessível) podem vir de **Radix UI** puro, sem a camada de estilo do shadcn.
- **ORM (Prisma/Drizzle)** — a RLS é a fronteira de segurança e ela vive no Postgres. Um ORM tenta ser essa fronteira na aplicação e cria duas fontes de verdade. Usar o client do Supabase com tipos gerados por `supabase gen types`.
- **Biblioteca de estado global** — Server Components + Server Actions cobrem o caso.

---

## 2. Convenções do Next 16 (obrigatório ler antes de codar)

O `AGENTS.md` do repositório é explícito: esta versão do Next tem mudanças de API em relação ao que os modelos conhecem. **Antes de escrever código, ler o guia relevante em `node_modules/next/dist/docs/`.** Guias mais relevantes para este projeto:

- `01-app/02-guides/authentication.md`
- `01-app/02-guides/data-security.md`
- `01-app/02-guides/multi-tenant.md`
- `01-app/02-guides/server-actions.md` e `01-app/01-getting-started/07-mutating-data.md`
- `01-app/01-getting-started/16-proxy.md` e `01-app/03-api-reference/03-file-conventions/proxy.md`
- `01-app/02-guides/content-security-policy.md`
- `01-app/02-guides/forms.md`
- `01-app/03-api-reference/01-directives/use-cache.md`

Convenções já identificadas no repo e que devem ser mantidas:

| Convenção | Detalhe |
|---|---|
| `src/proxy.ts` exportando `proxy()` | Substitui `middleware.ts`/`middleware()`. Já em uso no MVP |
| `params` e `searchParams` são `Promise` | `const { slug } = await params` |
| Tipos globais `LayoutProps<"/">` / `PageProps<"/rota">` | Globais do Next 16, não importados |
| Turbopack | Bundler padrão |

### Estratégia de cache — decisão

Praticamente todo dado deste produto é por usuário e muda com frequência. **Padrão: renderização dinâmica.** Não adotar Cache Components / `use cache` na v1 — o ganho é marginal e o risco de vazar dado de uma organização no cache de outra é real. Reavaliar apenas para as páginas institucionais, que são estáticas por natureza.

O que o MVP faz (`export const dynamic = "force-dynamic"` em toda página de dados) permanece correto; verificar no guia `caching-without-cache-components.md` se há forma mais idiomática na 16.3.

---

## 3. Estrutura de diretórios alvo

```
src/
  app/
    (site)/                     # institucional, público, estático
      page.tsx                  #  /
      contato/page.tsx
      privacidade/page.tsx
      termos/page.tsx
      layout.tsx                # header/footer institucional
    (auth)/                     # público, sem sessão
      login/page.tsx
      recuperar-senha/page.tsx
      redefinir-senha/page.tsx
      convite-expirado/page.tsx
      layout.tsx
    (app)/                      # área do cliente — exige sessão
      app/
        page.tsx                # redireciona ou lista projetos
        projetos/[slug]/page.tsx
        projetos/[slug]/[taskSlug]/page.tsx
        conta/page.tsx
        faturas/page.tsx
        desbloquear/[offerSlug]/page.tsx
        layout.tsx              # shell + troca de organização
      trocar-senha/page.tsx     # fora do shell: sem nav, sem escape
    (admin)/                    # exige papel admin
      admin/
        page.tsx                # visão geral
        financeiro/page.tsx     # E5
        organizacoes/...
        projetos/[id]/...
        ofertas/...             # catálogo
        auditoria/page.tsx
        layout.tsx
    api/
      webhooks/pagamento/route.ts
    robots.ts
    sitemap.ts
    llms.txt/route.ts           # serve text/markdown em /llms.txt
    globals.css
    layout.tsx
  components/
    ui/                         # primitivos do design system
    timeline/                   # item de fase, item de task, cadeado
    financeiro/                 # tabelas e indicadores
    forms/                      # campo + erro + submit
  lib/
    supabase/                   # server, client, admin(service-role), types gerados
    auth/                       # sessão, papéis, guards
    data/                       # leitura (queries)
    actions/                    # server actions, por domínio
    payments/                   # PaymentProvider + adaptadores
    email/                      # EmailProvider + adaptadores + templates
    validation/                 # schemas zod compartilhados
    format/                     # moeda BRL, data pt-BR, percentual
  proxy.ts
supabase/
  migrations/                   # numeradas, versionadas
```

**Regra de fronteira:** `lib/data/` só lê, `lib/actions/` só escreve. Nenhum componente fala com o Supabase diretamente.

---

## 4. Camadas de abstração para integrações externas

Nem Asaas nem Google OAuth têm conta criada. A arquitetura precisa permitir que **todo o produto seja construído, testado e demonstrado sem nenhuma credencial externa**, e que a conta real seja plugada depois sem alterar telas.

### 4.1 `PaymentProvider`

```ts
// lib/payments/types.ts — contrato, não implementação
type MetodoPagamento = "pix" | "credito" | "debito";

interface PaymentProvider {
  criarCliente(input: DadosCliente): Promise<{ providerCustomerId: string }>;

  criarAssinatura(input: {
    providerCustomerId: string;
    valorCentavos: number;      // 0 => não cria nada no provedor
    diaVencimento: number;
    descricao: string;
  }): Promise<{ providerSubscriptionId: string | null }>;

  cancelarAssinatura(providerSubscriptionId: string): Promise<void>;

  criarCobranca(input: {
    providerCustomerId: string;
    valorCentavos: number;
    metodo: MetodoPagamento;
    descricao: string;
    idempotencyKey: string;
    vencimento: string;         // ISO date
  }): Promise<CobrancaCriada>;   // { providerChargeId, checkoutUrl?, pix? }

  consultarCobranca(providerChargeId: string): Promise<StatusCobranca>;

  verificarWebhook(req: Request): Promise<EventoPagamento | null>;  // null = assinatura inválida
}
```

Implementações:

| Adaptador | Fase | Comportamento |
|---|---|---|
| `MockPaymentProvider` | v1 (F5) | Gera ids falsos, QR Code de exemplo, e expõe um gatilho manual em `/admin` para simular a confirmação do webhook. Permite exercitar o fluxo E3+E4+E5 inteiro |
| `AsaasPaymentProvider` | F8 | Implementação real. Contrato de endpoints em [INTEGRATIONS](./INTEGRATIONS.md) |

Seleção por `PAYMENT_PROVIDER=mock|asaas`. Um `switch` num único módulo `lib/payments/index.ts`.

**Regra inviolável:** o estado de pagamento no nosso banco só muda por evento de webhook verificado (ou pelo gatilho manual do mock em ambiente não-produtivo). Nenhum retorno de navegador libera nada.

### 4.2 `EmailProvider`

```ts
interface EmailProvider {
  enviar(input: {
    para: string | string[];
    assunto: string;
    html: string;
    texto: string;
    tag: string;              // M1, M2, M3, M4a...
    idempotencyKey?: string;
  }): Promise<{ providerMessageId: string }>;
}
```

| Adaptador | Quando |
|---|---|
| `ConsoleEmailProvider` | Desenvolvimento sem `RESEND_API_KEY`. Imprime assunto, destinatário e versão texto no console; grava em `email_log` normalmente |
| `ResendEmailProvider` | Quando o domínio estiver verificado |

Seleção por presença de `RESEND_API_KEY`, com override em `EMAIL_PROVIDER`.

**Regra:** falha de email nunca aborta a transação de negócio. O envio ocorre depois do commit e erros vão para `email_log` com status `falhou`, sem propagar.

### 4.3 Agregação do email M3

A janela de digest precisa de um disparo temporal. Duas opções, em ordem de preferência:

1. **Cron do Vercel** (`vercel.json` / `vercel.ts`) a cada 15 min varrendo tasks concluídas com email pendente. Simples, observável, sem infraestrutura nova. **Recomendado.**
2. `pg_cron` no Supabase — mantém tudo no banco, mas dificulta reaproveitar os templates TypeScript.

---

## 5. Fluxo de dados e uso de chaves

Três clientes Supabase distintos, com propósitos que não se misturam:

| Cliente | Chave | Onde | Uso |
|---|---|---|---|
| `createServerClient()` | anon/publishable | Server Components, Server Actions | **Padrão.** Roda com a sessão do usuário; RLS decide o que ele vê |
| `createBrowserClient()` | anon/publishable | Client Components | Apenas Realtime, escopado ao projeto |
| `createAdminClient()` | `service_role` | Somente `api/webhooks/*` e jobs de cron | Ignora RLS. **Nunca** importável de código de componente |

Para garantir a última linha: o módulo do admin client deve começar com `import "server-only"` e lançar erro se `typeof window !== "undefined"`.

**A RLS é a fronteira de segurança, não o código da aplicação.** Se uma query esquecer o filtro por organização, a RLS ainda deve impedir o vazamento. É o oposto do MVP, onde `using (true)` deixa a segurança inteira nas mãos da query.

---

## 6. Realtime

O MVP assina `postgres_changes` em `tasks` e `phases` **sem filtro** — todo cliente conectado recebe eventos de todos os projetos de todos os clientes. É vazamento de metadados e desperdício.

Na v1:

- Um canal por projeto, com filtro `project_id=eq.<id>`.
- A publicação Realtime respeita RLS (habilitar `realtime` apenas nas tabelas necessárias e confiar nas políticas).
- Degradação: se a conexão cair, revalidar por intervalo em vez de exibir erro.

---

## 7. Tratamento do código do MVP

Decisão: **refatorar no lugar**, mantendo o repositório, o histórico e o scaffolding (Next 16, Tailwind v4, tsconfig, ESLint, vínculo com a Vercel). O conteúdo de `src/` é substituído. O visual atual **não** é referência.

Limpeza obrigatória na F0:

| Item | Ação |
|---|---|
| `src/src/app/` | Deletar — cópia órfã do starter `create-next-app` |
| `public/public/` | Deletar — duplicata |
| `README.md` | Reescrever (hoje é boilerplate) |
| `src/lib/admin/session.ts` | Deletar — substituído pelo Supabase Auth |
| `src/app/p/[uuid]/` | Deletar — modelo de link ofuscado descontinuado |
| `src/app/admin/login/` | Deletar — senha única substituída |
| `.env.example` | Reescrever **sem valores reais** (ver [SECURITY](./SECURITY.md)) |
| `supabase/schema.sql` | Substituir por `supabase/migrations/` numeradas |

O que pode ser reaproveitado como ponto de partida conceitual (não como código copiado): a lógica de `computeProgress()`, a ideia do `STATUS_CONFIG` mapeando estado → ícone + rótulo + classe, e a estrutura de montagem `projeto → fases → tasks` em `lib/data/project.ts`.

---

## 8. Padrões de implementação

### Server Actions

Toda action segue o mesmo formato:

1. `requireUser()` / `requireAdmin()` — autenticação e papel primeiro, sempre.
2. Parse com schema zod. Erro de validação retorna `{ errors: { campo: mensagem } }` para `useActionState`.
3. Mutação via client com sessão do usuário (RLS ativa).
4. `audit_log`.
5. `revalidatePath` do escopo afetado.
6. Efeitos colaterais (email, pagamento) **depois** do commit, tolerantes a falha.

Nunca `throw new Error("...")` cru como o MVP faz — o usuário vê tela de erro genérica e perde o que digitou.

### Erros

- `error.tsx` por route group, com identificador de correlação exibido.
- `not-found.tsx` específico por contexto.
- `loading.tsx` com skeleton que respeita o layout final (evita salto).

### Formatação

Centralizar em `lib/format/`: moeda BRL a partir de centavos, data/hora pt-BR, percentual. Nenhum `toLocaleString` espalhado por componente.

---

## 9. Qualidade

| Item | v1 |
|---|---|
| TypeScript | `strict`, sem `any` em fronteira de dados |
| Tipos do banco | Gerados por `supabase gen types typescript`, versionados, nunca escritos à mão |
| Lint | ESLint já configurado; adicionar regra que proíbe importar o admin client fora de `api/` |
| Testes | F9: Vitest para lógica de domínio (progresso, MRR, digest, estados de oferta) e Playwright para os fluxos F-A, F-C e F-D |
| Observabilidade | F9: log estruturado nas actions e no webhook; monitoramento de erro |
