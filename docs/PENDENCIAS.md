# Pendências para 100% — Institucional, conformidade e integrações

Este arquivo existe para uma única finalidade: quando você (Leoni) tiver em
mãos as chaves de API e os dados cadastrais da Sabre, saber **exatamente**
onde colocar cada um, sem precisar reabrir o contexto todo do projeto numa
sessão futura.

Nada aqui é segredo — é só o mapa de "o que falta" e "onde entra". As chaves
reais **nunca** vão neste arquivo nem em `.env.example`: sempre em
`.env.local` (local, fora do git) ou nas variáveis de ambiente da Vercel.

---

## 1. Dados cadastrais da Sabre — bloqueia `/privacidade` e `/termos`

**Sem isso, a F7 não pode ser considerada 100% concluída** (ROADMAP F7,
"Pronto quando"; SECURITY §9, "[BLOQUEANTE] Pendência").

Dados necessários:

| Dado | Onde entra |
|---|---|
| Razão social | `src/app/(site)/privacidade/page.tsx` e `src/app/(site)/termos/page.tsx`, substituindo todo `[RAZÃO SOCIAL PENDENTE]` |
| CNPJ | Mesmos arquivos, substituindo `[CNPJ PENDENTE]` |
| Endereço | Mesmos arquivos, substituindo `[ENDEREÇO PENDENTE]` |
| Email do encarregado de dados (DPO) | Mesmos arquivos, substituindo `[EMAIL DO ENCARREGADO PENDENTE]` — este email também deve ser uma caixa real e monitorada, pois é o canal oficial de solicitação de direitos do titular (LGPD, prazo de resposta 15 dias) |

As duas páginas já têm a estrutura completa (dados tratados, operadores,
retenção, cookies, direitos do titular) — falta só passar o find-and-replace
nesses quatro placeholders. Depois disso, remover o bloco `AvisoPendencia`
(o card vermelho no topo de cada página) em ambos os arquivos.

---

## 2. Variáveis de ambiente — onde cada chave entra

Todas em `.env.local` (desenvolvimento) e, quando for para produção, no
painel da Vercel (Project Settings → Environment Variables). **Nunca em
`.env.example`, nunca commitadas.**

### Já resolvido / não bloqueia nada

| Variável | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Já em `.env.local`. Decisão sua: manter as chaves atuais sem rotacionar (repo e projeto privados). Rotação continua **opcional**, não bloqueia nada. |
| `NEXT_PUBLIC_APP_URL` | Ajustar para o domínio real quando for para produção (hoje `http://localhost:3000`). Usado em `robots.ts`, `sitemap.ts`, `llms.txt`, links de email e `metadataBase`. |
| `CRON_SECRET` | Gerar uma string aleatória antes de produção (ex.: `openssl rand -hex 32`) e colocar na Vercel. Sem isso as rotas de cron ficam sem autenticação — aceitável só em dev. |
| `NEXT_PUBLIC_WHATSAPP_ADMIN` | Opcional. Número da Sabre em E.164 sem símbolos (ex.: `5511999998888`). Se vazio, o link de WhatsApp na tela de desbloqueio simplesmente não aparece. |
| `EMAIL_PROVIDER=console` | Já funcional. Deixa o `ConsoleEmailProvider` ativo — todo email vai para o log do servidor, nada é perdido, o produto funciona ponta a ponta sem provedor real. |
| `PAYMENT_PROVIDER=mock` | Já funcional. `MockPaymentProvider` cobre toda a F5. |

### Pendente — Resend (email real)

Sem isto, o produto continua funcionando (via `ConsoleEmailProvider`), mas
nenhum email M1–M5 ou de contato sai de verdade.

1. Criar conta no [Resend](https://resend.com).
2. Verificar um domínio da Sabre (registros SPF, DKIM, DMARC no DNS).
3. Gerar uma API key.

| Variável | Onde obter | Onde entra |
|---|---|---|
| `RESEND_API_KEY` | Painel do Resend → API Keys | `.env.local` / Vercel. Usada em `src/lib/email/resend-provider.ts` |
| `RESEND_FROM_EMAIL` | Um endereço do domínio verificado, ex.: `Sabre Logs <logs@sabre.dominio>` | `.env.local` / Vercel |
| `EMAIL_PROVIDER` | Trocar de `console` para `resend` (ou deixar vazio — o sistema já infere pela presença de `RESEND_API_KEY`) | `.env.local` / Vercel |
| `EMAIL_CONTATO_DESTINO` | O email real que deve receber as mensagens do formulário `/contato` (F7) | `.env.local` / Vercel. Hoje sem valor, o `contatoAction` usa `contato@sabre.dev` como placeholder de desenvolvimento |

Nenhuma mudança de código é necessária para ativar — é só preencher essas
variáveis.

### Pendente — Asaas (pagamento real, F8)

Fase inteiramente futura, **não bloqueia F0–F7**.

1. Conta Asaas (PJ) com cadastro aprovado.
2. Chave Pix cadastrada e conta bancária vinculada.
3. Chave de API de sandbox (para desenvolver a F8) e depois de produção.
4. Webhook configurado no painel do Asaas apontando para
   `https://<seu-dominio>/api/webhooks/pagamento`.

| Variável | Onde obter | Onde entra |
|---|---|---|
| `PAYMENT_PROVIDER` | Trocar de `mock` para `asaas` só quando a F8 estiver implementada | `.env.local` / Vercel |
| `ASAAS_API_KEY` | Painel do Asaas | `.env.local` / Vercel |
| `ASAAS_ENV` | `sandbox` ou `production` | `.env.local` / Vercel |
| `ASAAS_WEBHOOK_TOKEN` | Definido por você ao configurar o webhook no painel do Asaas | `.env.local` / Vercel |

### Pendente — Google OAuth (login social, F8)

Também fase futura. Depende dos dados cadastrais da seção 1 (a tela de
consentimento do Google exige uma política de privacidade publicada).

1. Criar projeto no Google Cloud Console.
2. Configurar tela de consentimento OAuth (nome, logo, link de
   `/privacidade` — por isso a dependência da seção 1).
3. Criar credencial OAuth (Client ID/Secret), com URI de redirecionamento
   apontando para o callback do Supabase Auth.
4. Habilitar o provedor Google no painel de Authentication do Supabase.

| Variável | Onde entra |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | **Não vai para `.env.local`.** Cole diretamente no painel do Supabase (Authentication → Providers → Google) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Mesmo painel do Supabase, não no código |

---

## 3. Resumo — o que falta, em ordem de prioridade

1. **Dados cadastrais da Sabre** (seção 1) — o único item que bloqueia a F7 em si.
2. **Conta Resend + domínio verificado** — ativa email real (F6 já está pronta para receber isso).
3. **Conta Asaas + chave sandbox** — pré-requisito da F8.
4. **Projeto no Google Cloud Console** — pré-requisito da F8, depende do item 1.

Nenhum destes bloqueia o funcionamento atual do produto: F0 a F7 rodam
inteiramente com os adaptadores locais (`ConsoleEmailProvider`,
`MockPaymentProvider`) e com placeholders claramente sinalizados nas páginas
legais.
