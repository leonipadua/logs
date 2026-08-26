# SECURITY — Sabre Logs v1

Políticas de segurança e conformidade. Itens marcados **[BLOQUEANTE]** impedem deploy em produção enquanto não resolvidos.

---

## 1. [BLOQUEANTE] Credenciais expostas no repositório

O arquivo `.env.example` está **commitado** contendo o que aparentam ser valores reais e não placeholders:

| Variável | Problema |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL real do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | **JWT de service_role.** Ignora toda RLS. Acesso total de leitura e escrita ao banco |
| `ADMIN_PASSWORD` | Senha do painel administrativo |
| `SESSION_SECRET` | Definido como `0531` — além de exposto, trivialmente adivinhável |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Recebe um valor com prefixo `sb_secret_`. Uma **chave secreta atribuída a uma variável `NEXT_PUBLIC_`**, ou seja, embutida no bundle e visível a qualquer visitante |

Estão no histórico do Git e possivelmente num repositório remoto. Devem ser tratados como **comprometidos**.

### Ação obrigatória, antes de qualquer outra coisa

1. Rotacionar no painel do Supabase: chave `service_role`, chave anônima/publicável, e a senha do banco.
2. Trocar `ADMIN_PASSWORD` e `SESSION_SECRET` — ambos deixam de existir na v1 (substituídos pelo Supabase Auth), mas precisam ser invalidados enquanto o MVP estiver no ar.
3. Reescrever `.env.example` **apenas com placeholders**, sem exceção.
4. Auditar o histórico do Git. Como as chaves serão rotacionadas, reescrever o histórico é opcional; se o repositório for público, é recomendado.
5. Confirmar que nenhuma chave secreta permanece em variável `NEXT_PUBLIC_`.

### Política de segredos (permanente)

| Regra | Detalhe |
|---|---|
| `NEXT_PUBLIC_` = público | Vai para o bundle do navegador. Só a URL do Supabase e a chave anônima/publicável podem usar esse prefixo |
| `service_role` nunca no cliente | Módulo com `import "server-only"`, importável apenas de `api/webhooks/*` e jobs |
| `.env.example` só com placeholders | `SUPABASE_SERVICE_ROLE_KEY=<gerar no painel do Supabase>` |
| Segredo de produção só na Vercel | Nunca em arquivo commitado |
| Rotação | Toda chave rotacionada ao fim de qualquer exposição e a cada troca de escopo de acesso |
| Log | Nenhum log imprime token, senha, chave, header `Authorization` ou payload de cartão |

---

## 2. RLS como fronteira primária

O modelo atual tem `for select to anon using (true)` em `projects`, `phases` e `tasks`. Na prática: **qualquer portador da chave anônima — que está no bundle público — pode ler todos os projetos de todos os clientes.** A única coisa que impede isso hoje é a query da aplicação filtrar por `public_id`, e filtro de aplicação não é controle de segurança.

Na v1 nenhuma política permissiva existe. As políticas estão especificadas em [DATA_MODEL](./DATA_MODEL.md), com um checklist de verificação (§10) que precisa passar integralmente antes da F1 ser considerada concluída.

Pontos de atenção na implementação:

- Funções `security definer` **sempre** com `set search_path = public` — sem isso são vetor de escalonamento.
- `is_admin()` lê `app_metadata` do JWT, nunca `user_metadata` (o usuário pode alterar o próprio `user_metadata`).
- Políticas de `organization_members` não podem chamar `is_org_member` (recursão).
- Toda tabela nova nasce com `enable row level security` na mesma migration em que é criada.
- Rodar o **Supabase Advisor** (`get_advisors`) após cada migration de esquema.

---

## 3. Autenticação

| Item | Regra |
|---|---|
| Provedor | Supabase Auth, email + senha. Google OAuth na F8 |
| Sessão | Cookie `httpOnly`, `secure`, `sameSite=lax`, gerido por `@supabase/ssr` |
| Verificação no proxy | **Validar a sessão de fato.** O MVP só checa presença de cookie (`request.cookies.has`) — qualquer cookie com o nome certo passa pelo proxy |
| Política de senha | Mínimo 10 caracteres, checagem contra lista de senhas comuns. Sem exigência de símbolo/maiúscula (atrito sem entropia) |
| Senha temporária | ≥ 12 caracteres de gerador criptográfico, uso único, expira em 7 dias, força troca |
| `must_change_password` | Bloqueia toda rota autenticada exceto `/trocar-senha`. Limpa apenas por Server Action após troca efetiva |
| Troca de senha | Encerra as demais sessões do usuário |
| Recuperação | Token de uso único, validade de 1 hora, hash armazenado (nunca o token) |
| Enumeração de usuários | `/recuperar-senha` responde sempre igual, exista o email ou não |
| Revogação | `revogado_em` em `organization_members` + invalidação da sessão na próxima requisição |

### Rate limiting [obrigatório na v1]

O MVP não tem nenhum, apesar de o PRD original exigir.

| Endpoint | Limite |
|---|---|
| `/login` | 5 tentativas / 15 min por email **e** por IP |
| `/recuperar-senha` | 3 / hora por email, 10 / hora por IP |
| Envio/reenvio de convite | 10 / hora por admin |
| `/contato` | 3 / hora por IP |
| Webhook de pagamento | Limite alto por IP, com allowlist do provedor quando disponível |

Implementação: contador no Postgres com janela deslizante (suficiente para a escala atual) ou Upstash Redis via marketplace da Vercel. Bloqueio responde `429` com `Retry-After`.

---

## 4. Autorização — matriz papel × recurso

`C` criar · `L` ler · `E` editar · `D` deletar · `—` sem acesso

| Recurso | admin | owner | member | anônimo |
|---|---|---|---|---|
| Organização (a sua) | C L E D | L | L | — |
| Outras organizações | C L E D | — | — | — |
| Membros da organização | C L E D | C L E* | L | — |
| Projetos / fases / tasks | C L E D | L | L | — |
| Catálogo de ofertas (`offers`) | C L E D | — | — | — |
| Ofertas do projeto | C L E D | L** | L** | — |
| Iniciar desbloqueio | — | ação | — | — |
| Assinatura | C L E D | L | L | — |
| Cobranças | L | L | L | — |
| `payment_events`, `email_log`, `audit_log` | L | — | — | — |
| Páginas institucionais | L | L | L | L |

\* `owner` convida e revoga `member`, nunca outro `owner` nem a si mesmo.
\** Somente ofertas em `disponivel`, `em_negociacao` ou `desbloqueada`. `rascunho` e `removida` são invisíveis.

Regra transversal: **toda Server Action verifica papel antes de tocar em dado**, mesmo com RLS ativa. Defesa em profundidade, e mensagem de erro melhor.

---

## 5. Cabeçalhos HTTP

Configurados em `next.config.ts` (ou `vercel.ts`) para todas as rotas:

| Cabeçalho | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` (e `frame-ancestors 'none'` na CSP) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Content-Security-Policy` | Ver abaixo |

**CSP com nonce**, seguindo `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`. Esboço:

```
default-src 'self';
script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
style-src 'self' 'nonce-{NONCE}';
img-src 'self' data: blob:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://<projeto>.supabase.co wss://<projeto>.supabase.co;
frame-src <domínio do checkout do provedor, quando houver>;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

Nada de `unsafe-inline` nem `unsafe-eval`. O `connect-src` precisa incluir `wss:` para o Realtime. Se o checkout do provedor for em iframe, o domínio dele entra em `frame-src` na F8 — não antes.

---

## 6. Webhook de pagamento

O endpoint mais sensível: é escrita não autenticada por sessão que altera estado financeiro.

1. **Verificar a assinatura antes de qualquer coisa.** Requisição sem assinatura válida é rejeitada com `401` e registrada com `assinatura_valida = false`.
2. **Persistir o payload bruto** em `payment_events` **antes** de interpretar.
3. **Idempotência** por `unique (provider, provider_event_id)`. Reentrega não duplica cobrança nem desbloqueio.
4. **Não confiar em valor vindo do webhook.** Reconciliar contra a `charge` local pela `provider_charge_id`; divergência de valor não confirma nada e alerta o admin.
5. **Responder rápido** (`200`), processando de forma assíncrona quando possível. Provedores reentregam em caso de timeout.
6. Ordem fora de sequência é esperada: a máquina de estados de `charges` deve ser idempotente e não regredir de `paga` para `pendente`.
7. Nunca aceitar confirmação vinda do navegador. O retorno de checkout é só UX.

---

## 7. Exposição a buscadores e agentes

### `robots.txt`

```
User-agent: *
Allow: /
Disallow: /app
Disallow: /admin
Disallow: /api
Disallow: /login
Disallow: /trocar-senha
Disallow: /recuperar-senha
Disallow: /redefinir-senha

Sitemap: https://<dominio>/sitemap.xml
```

`robots.txt` é diretiva de boa vizinhança, **não controle de acesso**. A proteção real é sessão + RLS. Toda rota privada também emite `noindex` via metadata.

### `llms.txt`

Arquivo em **markdown na raiz** (`/llms.txt`), servido como `text/markdown`, que descreve o site para agentes de IA. Conteúdo previsto:

```markdown
# Sabre Logs

> Painel de acompanhamento para clientes da Sabre: mostra o progresso da
> implementação de agentes de IA contratados, com etapas, status e histórico.

O acesso ao painel é restrito a clientes com conta, criada exclusivamente por
convite. Não há cadastro público.

## Páginas públicas
- [Início](/): o que é o Sabre Logs
- [Contato](/contato): fale com a Sabre
- [Política de Privacidade](/privacidade)
- [Termos de Uso](/termos)

## Áreas privadas — não acessar, não indexar
- /app  — painel do cliente, exige autenticação
- /admin — painel administrativo, exige autenticação
- /api  — endpoints internos
```

Também emitir `X-Robots-Tag: noindex, nofollow` nas respostas de `/app`, `/admin` e `/api`.

---

## 8. Proteção de dados de pagamento

- **Nenhum dado de cartão toca o nosso servidor.** Checkout hospedado ou tokenização no cliente, sempre.
- Não persistir PAN, CVV ou validade — nem parcialmente, nem em log, nem em `payment_events` (higienizar o payload antes de gravar, se o provedor incluir algo).
- Guardar apenas: id da cobrança no provedor, bandeira, últimos 4 dígitos (se o provedor devolver), status e valor.
- Chaves do provedor apenas server-side. A chave de produção nunca vai para ambiente de desenvolvimento.
- Ambientes sandbox e produção separados por variável explícita, com aviso visual no painel quando em sandbox.

---

## 9. LGPD

### Dados tratados

| Categoria | Dados | Base legal |
|---|---|---|
| Cadastro | Nome, email, telefone | Execução de contrato |
| Organização | Razão social, CNPJ/CPF, endereço de cobrança | Execução de contrato / obrigação legal |
| Uso | Último acesso, log de auditoria | Legítimo interesse (segurança) |
| Financeiro | Histórico de cobranças e pagamentos | Execução de contrato / obrigação legal |
| Comunicação | Log de emails enviados | Execução de contrato |

**Não tratamos** dado sensível, dado de menor, nem conteúdo das conversas de WhatsApp dos clientes — esse processamento pertence a outro produto da Sabre e tem política própria.

### Operadores (subprocessadores) a declarar na política

| Operador | Finalidade | Local |
|---|---|---|
| Supabase | Banco de dados e autenticação | A confirmar (preferir região BR/US) |
| Vercel | Hospedagem | Global (edge) |
| Resend | Envio de email transacional | EUA |
| Asaas | Processamento de pagamento | Brasil |

### Direitos do titular

Acesso, correção, portabilidade, eliminação, informação sobre compartilhamento e revogação de consentimento. Canal: email do encarregado, publicado em `/privacidade`. Prazo de resposta: 15 dias.

### Retenção

| Dado | Prazo |
|---|---|
| Conta ativa | Enquanto durar a relação |
| Conta encerrada | 6 meses, depois anonimização |
| Registro financeiro | 5 anos (obrigação fiscal) |
| `audit_log` | 2 anos |
| `email_log` | 1 ano |
| `payment_events` | 5 anos |

### Cookies

Apenas cookies estritamente necessários (sessão e preferência de tema). Sem analytics de terceiros e sem rastreamento na v1 — o que dispensa banner de consentimento, mas exige a seção de cookies na política.

### [BLOQUEANTE] Pendência

Razão social, CNPJ, endereço e email do encarregado de dados da Sabre não estão disponíveis. Sem eles a política de privacidade e os termos não podem ser finalizados. Pendente com o Leoni (R3 do [PRD](./PRD.md)).

---

## 10. Validação de entrada

- **Todo** dado de entrada validado com schema zod no servidor. Validação de cliente é conveniência, nunca controle.
- Ids vindos do cliente sempre reverificados quanto a propriedade — nunca confiar em `organization_id` de formulário.
- Escrita sempre por client parametrizado do Supabase; nada de SQL montado por concatenação.
- Sem `dangerouslySetInnerHTML`. A copy de insight é campo livre do admin, mas é renderizada como texto, não HTML.
- Upload de arquivo não existe na v1 — quando existir (backlog), exige validação de tipo, tamanho e varredura.

---

## 11. Checklist pré-produção

- [ ] Todas as chaves do MVP rotacionadas (§1)
- [ ] `.env.example` só com placeholders
- [ ] Nenhum segredo em variável `NEXT_PUBLIC_`
- [ ] Checklist de RLS do [DATA_MODEL](./DATA_MODEL.md) §10 passa integralmente
- [ ] Supabase Advisor sem alerta de segurança
- [ ] Proxy valida a sessão de fato, não só a presença do cookie
- [ ] Rate limiting ativo em login, recuperação, convite e contato
- [ ] CSP com nonce ativa, sem `unsafe-inline`
- [ ] Webhook verifica assinatura e é idempotente
- [ ] `robots.txt` e `llms.txt` publicados e conferidos
- [ ] Sitemap sem rota privada
- [ ] `/privacidade` e `/termos` publicados com dados cadastrais reais
- [ ] Nenhum log contém token, senha ou dado de cartão
- [ ] Backup do Supabase configurado e restauração testada uma vez
