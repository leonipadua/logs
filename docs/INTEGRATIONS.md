# INTEGRATIONS — Sabre Logs v1

Contrato de cada integração externa. Escrito **antes** de as contas existirem, para que a implementação futura seja plugar um adaptador e não redesenhar o sistema.

> **Estado atual:** não há conta no Asaas nem credencial de Google OAuth. Ambos são **fase futura (F8)**. A v1 é construída inteira contra adaptadores locais, e precisa funcionar ponta a ponta sem nenhuma credencial externa.

---

## 1. Supabase — ativo

Único serviço externo já em uso.

| Item | Detalhe |
|---|---|
| Uso | Postgres, Auth, Realtime |
| Bibliotecas | `@supabase/supabase-js` (instalada), **`@supabase/ssr` (a instalar)** |
| Autenticação | Email + senha; provedor Google adicionado na F8 |
| Templates de email do Supabase | **Desativados.** Todo email sai pelo `EmailProvider` para manter identidade visual e log unificado |
| Tipos | `supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`, versionado. Nunca escrever à mão como no MVP |
| Realtime | Habilitar publicação apenas em `tasks` e `phases`; canal filtrado por `project_id` |
| Backup | Configurar e testar restauração antes do go-live |

Migração do MVP: as chaves atuais estão comprometidas e devem ser rotacionadas antes de tudo ([SECURITY](./SECURITY.md) §1).

---

## 2. Resend — email transacional

### Pré-requisitos (fora do código)

1. Conta no Resend.
2. Domínio verificado (SPF, DKIM, DMARC no DNS da Sabre). **Sem domínio verificado, entrega vai para spam.**
3. Remetente definido — sugestão: `Sabre Logs <logs@sabre.[dominio]>`, com `Reply-To` apontando para um endereço monitorado por humano.

### Contrato

Implementa `EmailProvider` ([ARCHITECTURE](./ARCHITECTURE.md) §4.2). Enquanto `RESEND_API_KEY` não existir, o `ConsoleEmailProvider` assume e o produto funciona normalmente — inclusive gravando `email_log`.

### Templates

Todos em pt-BR, com versão HTML e versão texto puro. Layout comum: logo em texto, corpo em uma coluna de 560px, rodapé com identificação da Sabre e link de preferências. Sem imagem remota (bloqueada por padrão em muitos clientes) e sem emoji.

| Tag | Assunto | Variáveis | Conteúdo essencial |
|---|---|---|---|
| **M1** | Seu acesso ao painel da Sabre | `nome`, `organizacao`, `email`, `senhaTemporaria`, `urlLogin`, `expiraEm` | Boas-vindas, credenciais, aviso de que a senha é temporária e expira em 7 dias, botão para o login |
| **M2** | Redefinição de senha | `nome`, `urlRedefinicao`, `validade` | Link de uso único, validade de 1 hora, aviso de "se não foi você, ignore" |
| **M3** | Novidades no seu projeto | `nome`, `projeto`, `tasks[]`, `percentual`, `urlProjeto` | **Digest.** "N etapas concluídas", lista das etapas, percentual atualizado, link. Rodapé com opt-out |
| **M4a** | Nova cobrança disponível | `organizacao`, `valor`, `vencimento`, `descricao`, `urlFatura` | Valor, vencimento, forma de pagamento, link |
| **M4b** | Pagamento confirmado | `organizacao`, `valor`, `data`, `descricao`, `urlRecibo` | Confirmação e recibo |
| **M4c** | Cobrança pendente | `organizacao`, `valor`, `vencimento`, `motivo`, `urlPagamento` | Motivo em linguagem humana, como regularizar. Tom neutro, sem ameaça |
| **M5** | Nova etapa liberada no seu projeto | `nome`, `projeto`, `tituloOferta`, `urlProjeto` | Confirmação do desbloqueio e o que vem a seguir |

### Regras operacionais

- **M3 é o único com opt-out** (`profiles.notificar_task_concluida`). Os demais são transacionais.
- Janela de digest do M3: 30 minutos, varrida por cron a cada 15 min ([ARCHITECTURE](./ARCHITECTURE.md) §4.3).
- Todo envio grava `email_log` com `tag`, destinatário, status e `provider_message_id`.
- Falha de envio **nunca** aborta a operação de negócio.
- Bounce e reclamação: webhook do Resend em `/api/webhooks/email` marca `email_log.status` e sinaliza o endereço como inválido, para o admin corrigir o cadastro.
- Nenhum email carrega senha em claro exceto M1.

### Variáveis

`RESEND_API_KEY` (secreta), `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_PROVIDER` (opcional, força `console` ou `resend`), `RESEND_WEBHOOK_SECRET`.

---

## 3. Asaas — pagamentos [FASE FUTURA · F8]

> Conta ainda não criada. Toda a v1 roda sobre o `MockPaymentProvider`. Esta seção é o contrato-alvo e **deve ser conferida contra a documentação oficial vigente** no momento da implementação — endpoints e campos abaixo são a expectativa de projeto, não fato verificado.

### Pré-requisitos (fora do código)

1. Conta Asaas (PJ) com cadastro aprovado.
2. Chave de API de **sandbox** para desenvolvimento e de **produção** para o go-live.
3. Chave Pix cadastrada e conta bancária vinculada.
4. Webhook configurado apontando para `https://<dominio>/api/webhooks/pagamento`, com token de autenticação.

### Ambientes

| Ambiente | Base URL | Variável |
|---|---|---|
| Sandbox | `https://api-sandbox.asaas.com/v3` | `ASAAS_ENV=sandbox` |
| Produção | `https://api.asaas.com/v3` | `ASAAS_ENV=production` |

Autenticação por header `access_token`. O painel do admin exibe um aviso visual permanente quando `ASAAS_ENV != production`.

### Mapeamento de conceitos

| Nosso modelo | Asaas |
|---|---|
| `organizations.provider_customer_id` | Customer |
| `subscriptions.provider_subscription_id` | Subscription |
| `charges.provider_charge_id` | Payment |
| `metodo: pix` | `billingType: PIX` |
| `metodo: credito` | `billingType: CREDIT_CARD` |
| `metodo: debito` | `billingType: DEBIT_CARD` |

### Operações necessárias

| Método do `PaymentProvider` | Chamada esperada |
|---|---|
| `criarCliente` | `POST /customers` — nome, cpfCnpj, email, telefone. `cpfCnpj` é obrigatório: `organizations.documento` precisa estar preenchido antes de qualquer cobrança |
| `criarAssinatura` | `POST /subscriptions` — customer, value, cycle `MONTHLY`, nextDueDate, billingType. **Não chamar quando `valor_centavos = 0`** |
| `cancelarAssinatura` | `DELETE /subscriptions/{id}` |
| `criarCobranca` | `POST /payments` — customer, billingType, value, dueDate, description, `externalReference` = nosso `charges.id` |
| Pix | `GET /payments/{id}/pixQrCode` → `payload` (copia-e-cola) e `encodedImage` (QR em base64) |
| Cartão | Usar link de checkout hospedado ou tokenização. **Dado de cartão não passa pelo nosso servidor** |
| `consultarCobranca` | `GET /payments/{id}` — usado para reconciliação, nunca como fonte primária |

**Valores:** a API trabalha em reais decimais; nosso banco em centavos inteiros. A conversão fica isolada no adaptador — `valorCentavos / 100` na saída, `Math.round(valor * 100)` na entrada. Nenhuma outra camada vê real decimal.

### Webhook — mapeamento de eventos

| Evento Asaas | Efeito interno |
|---|---|
| `PAYMENT_CREATED` | `charges.status = pendente` |
| `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` | `charges.status = paga`, `data_pagamento`; se `tipo = desbloqueio` → `project_offers.status = desbloqueada` + materializa fases/tasks + envia M4b e M5 |
| `PAYMENT_OVERDUE` | `charges.status = vencida`; envia M4c |
| `PAYMENT_REFUNDED` | `charges.status = estornada`; se era desbloqueio, sinaliza ao admin (a reversão do escopo é decisão humana, não automática) |
| `PAYMENT_DELETED` | `charges.status = cancelada` |
| `PAYMENT_UPDATED` | Reconciliar valor e vencimento |

Regras invioláveis de processamento em [SECURITY](./SECURITY.md) §6: verificar assinatura → gravar bruto → idempotência por `provider_event_id` → reconciliar valor contra a `charge` local → nunca regredir de `paga`.

### A regra do R$ 0,00

Assinatura com `valor_centavos = 0` é caso de negócio válido (contrato só de implementação). Ela existe em `subscriptions` com `provider_subscription_id = null` e **nenhuma chamada é feita ao Asaas**. Não gera cobrança, não entra no MRR, e o painel a exibe como "sem recorrência" — nunca como "R$ 0,00 pendente". A constraint `sub_zero_sem_provider` no [DATA_MODEL](./DATA_MODEL.md) grava essa regra no banco.

### Variáveis

`PAYMENT_PROVIDER` (`mock` | `asaas`), `ASAAS_API_KEY` (secreta), `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN` (secreta).

### Critério de aceite da F8

Trocar `PAYMENT_PROVIDER=mock` por `asaas` deve ativar o pagamento real **sem alterar nenhum componente de UI**. Se alguma tela precisar mudar, a abstração falhou e o problema é da F5, não da F8.

---

## 4. Google OAuth [FASE FUTURA · F8]

### Pré-requisitos

1. Projeto no Google Cloud Console.
2. Tela de consentimento OAuth configurada (nome, logo, política de privacidade — depende da F7).
3. Client ID e Secret; URI de redirecionamento apontando para o callback do Supabase.
4. Provedor Google habilitado no painel de Auth do Supabase.

### Decisões de projeto

| Questão | Decisão |
|---|---|
| Quem pode entrar por Google? | **Somente email já convidado.** Login por Google de email sem convite é rejeitado com mensagem própria — não existe cadastro público ([PRD](./PRD.md) §3.2) |
| Vinculação de conta | Por email verificado. Usuário convidado que entra por Google é vinculado ao mesmo `profiles.id` |
| E o `must_change_password`? | **Limpar automaticamente.** A senha temporária deixa de ser o fator de acesso; exigir troca de uma senha que o usuário nunca usará é atrito sem ganho. A senha temporária é invalidada no ato |
| O usuário pode ter os dois métodos? | Sim. Quem entra por Google e depois usa "esqueci minha senha" define uma senha e passa a ter ambos |

Escopo mínimo: `email` e `profile`. Nada além.

### Variáveis

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (ambas configuradas no painel do Supabase, não na aplicação).

---

## 5. Vercel — hospedagem

| Item | Detalhe |
|---|---|
| Vínculo | Já existe (`.vercel/`) |
| CLI | **Não instalada.** Instalar (`npm i -g vercel`) para `vercel env pull` e `vercel logs` |
| Variáveis | Todas as secretas no painel; nunca em arquivo commitado |
| Cron | Digest de email (M3) e varredura de cobranças vencidas |
| Configuração | Avaliar `vercel.ts` (`@vercel/config`) para headers de segurança e crons em TypeScript |
| Preview deploys | **Precisam ficar protegidos** ou usar projeto Supabase separado — preview com banco de produção é vazamento |

---

## 6. Tabela consolidada de variáveis de ambiente

`P` = pública (vai para o bundle) · `S` = secreta (somente servidor)

| Variável | Tipo | Necessária em | Usada em | Observação |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | P | F1 | Clients Supabase | Rotacionar contexto antes de usar |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | P | F1 | Clients Supabase | **Chave anônima/publicável, jamais uma `sb_secret_`** |
| `SUPABASE_SERVICE_ROLE_KEY` | S | F1 | Webhooks e crons apenas | `import "server-only"` |
| `NEXT_PUBLIC_SITE_URL` | P | F1 | Links de email, callbacks | |
| `EMAIL_PROVIDER` | S | F6 | `lib/email` | `console` \| `resend`. Ausente → infere pela chave |
| `RESEND_API_KEY` | S | F6 | `ResendEmailProvider` | Ausente em dev → adaptador console |
| `EMAIL_FROM` | S | F6 | Templates | Domínio verificado |
| `EMAIL_REPLY_TO` | S | F6 | Templates | Caixa monitorada |
| `RESEND_WEBHOOK_SECRET` | S | F6 | `/api/webhooks/email` | Bounce e reclamação |
| `PAYMENT_PROVIDER` | S | F5 | `lib/payments` | `mock` \| `asaas` |
| `ASAAS_API_KEY` | S | F8 | `AsaasPaymentProvider` | |
| `ASAAS_ENV` | S | F8 | `AsaasPaymentProvider` | `sandbox` \| `production` |
| `ASAAS_WEBHOOK_TOKEN` | S | F8 | `/api/webhooks/pagamento` | |
| `CRON_SECRET` | S | F6 | Rotas de cron | Impede execução por terceiro |
| `GOOGLE_CLIENT_ID` | — | F8 | Painel do Supabase | Não fica na aplicação |
| `GOOGLE_CLIENT_SECRET` | — | F8 | Painel do Supabase | Não fica na aplicação |

### Removidas do MVP

| Variável | Motivo |
|---|---|
| `ADMIN_PASSWORD` | Substituída pelo Supabase Auth com papel `admin` |
| `SESSION_SECRET` | Sessão passa a ser do Supabase Auth |

---

## 7. Ordem de provisionamento

Sequência recomendada para o Leoni, com o que cada passo destrava:

1. **Rotacionar as chaves do Supabase** — [BLOQUEANTE], destrava tudo.
2. **Registrar/confirmar o domínio da Sabre** — destrava DNS, email e OAuth.
3. **Conta Resend + verificação do domínio** — destrava a F6 (emails reais).
4. **Reunir dados cadastrais** (razão social, CNPJ, endereço, encarregado) — destrava a F7 (páginas legais).
5. **Conta Asaas + chave sandbox** — destrava a F8.
6. **Google Cloud Console** — destrava o OAuth; depende do passo 4 (a tela de consentimento exige política de privacidade publicada).

Os passos 3 a 6 **não bloqueiam** as fases F0 a F5: o produto inteiro é construído e validado com os adaptadores locais.
