# ROADMAP — Sabre Logs v1

Sequência de implementação. Cada fase tem escopo, dependências, épicos do [PRD](./PRD.md) que atende e critério objetivo de conclusão.

**Princípio de ordenação:** nenhuma fase até a F7 depende de conta em serviço externo. O produto inteiro é construído e demonstrável com adaptadores locais; a F8 apenas troca os adaptadores.

```
F0 ──> F1 ──> F2 ──> F3 ──> F4 ──> F5 ──┐
                                         ├──> F7 ──> F8 ──> F9
                                   F6 ───┘
```

---

## F0 · Fundação

**Épicos:** — · **Depende de:** nada

### Escopo

1. **[BLOQUEANTE] Rotação de credenciais** ([SECURITY](./SECURITY.md) §1). Chave `service_role`, chave anônima, senha do banco, `ADMIN_PASSWORD`, `SESSION_SECRET`. Reescrever `.env.example` só com placeholders.
2. **Limpeza do repositório** ([ARCHITECTURE](./ARCHITECTURE.md) §7): deletar `src/src/`, `public/public/`, `src/lib/admin/session.ts`, `src/app/p/[uuid]/`, `src/app/admin/login/`. Reescrever o `README.md`.
3. **Dependências**: instalar `@supabase/ssr`, `zod`, `lucide-react`, primitivos Radix necessários.
4. **Design system em código**: tokens no `@theme` do `globals.css` ([DESIGN_SYSTEM](./DESIGN_SYSTEM.md) §2), fontes display/sans/mono, utilitário de numerais tabulares, tema claro e escuro completos.
5. **Primitivos de UI**: botão, input, label, badge, card, tabela, modal, skeleton, estado vazio.
6. **`lib/format/`**: BRL a partir de centavos, data pt-BR, percentual.
7. Cabeçalhos de segurança e CSP com nonce em `next.config.ts`.

### Pronto quando

- [ ] Nenhuma chave do MVP continua válida
- [ ] `.env.example` só com placeholders; nenhum segredo em `NEXT_PUBLIC_`
- [ ] Página de amostra dos primitivos renderiza corretamente nos dois temas com contraste AA
- [ ] `next build` limpo, sem `src/src/` nem `public/public/`

---

## F1 · Identidade e acesso

**Épicos:** E1 · **Depende de:** F0

### Escopo

1. Migrations `0001`–`0002` e `0007` (RLS) ([DATA_MODEL](./DATA_MODEL.md)): funções auxiliares, `profiles`, `organizations`, `organization_members`, `invitations`.
2. Tipos gerados por `supabase gen types`.
3. Clients Supabase (`server`, `browser`, `admin` com `server-only`).
4. `proxy.ts` com **validação real de sessão** + redirecionamento por `must_change_password`.
5. Telas: `/login`, `/trocar-senha`, `/recuperar-senha`, `/redefinir-senha`, `/convite-expirado`.
6. Actions: convidar (gera senha temporária), reenviar, aceitar, revogar, trocar senha.
7. Seletor de organização para quem pertence a mais de uma.
8. Rate limiting em login e recuperação.
9. `audit_log` funcionando.

> Nesta fase o email ainda não sai de verdade: o `ConsoleEmailProvider` imprime M1 e M2 no console. A senha temporária também é exibida uma única vez ao admin ao criar o convite, então o fluxo é testável ponta a ponta.

### Pronto quando

- [ ] **O checklist de RLS do [DATA_MODEL](./DATA_MODEL.md) §10 passa integralmente** — item mais importante desta fase
- [ ] Supabase Advisor sem alerta de segurança
- [ ] Usuário com `must_change_password` não alcança `/app` por nenhum caminho
- [ ] Usuário da organização A não lê nada de B (URL direta, id em formulário, chamada de API)
- [ ] Convite expirado tem tela própria
- [ ] Rate limit responde `429` com `Retry-After`

---

## F2 · Área do cliente

**Épicos:** E2 · **Depende de:** F1

### Escopo

1. Migration `0003`: `projects`, `phases`, `tasks` (com `slug`, `motivo_bloqueio`, `concluida_em`, `email_digest_enviado`).
2. Migration `0009`: migração dos dados do MVP — **com `email_digest_enviado = true` em todo histórico concluído** ([DATA_MODEL](./DATA_MODEL.md) §9).
3. Camada de leitura `lib/data/` e cálculo de progresso (ofertas não entram no denominador).
4. Rotas `/app`, `/app/projetos/[slug]`, `/app/projetos/[slug]/[taskSlug]`, `/app/conta`.
5. Componentes de timeline com os 5 estados ([DESIGN_SYSTEM](./DESIGN_SYSTEM.md) §5.2).
6. Realtime **escopado por `project_id`** (migration `0008`), com degradação para revalidação periódica.
7. `loading.tsx`, `error.tsx`, `not-found.tsx` e estados vazios com copy própria.

### Pronto quando

- [ ] Nenhuma URL da área logada contém UUID
- [ ] Timeline legível a 360px, sem rolagem horizontal
- [ ] Alteração do admin aparece em ≤ 5s sem recarregar
- [ ] Todo estado tem ícone + rótulo
- [ ] Dados do MVP migrados e conferidos manualmente

---

## F3 · Admin operacional

**Épicos:** E6 · **Depende de:** F2

### Escopo

1. Shell do admin com navegação e indicador de ambiente.
2. CRUD de organizações e gestão de membros.
3. CRUD completo de projetos, fases e tasks — **incluindo editar**, que o MVP não tem.
4. Troca de status em um clique com transição otimista.
5. Reordenação por campo numérico.
6. Todo formulário com zod + `useActionState` + erro por campo.
7. Confirmação explícita de exclusão, dizendo o que será perdido.
8. Tela de auditoria.

### Pronto quando

- [ ] Nenhuma action lança erro cru; toda validação volta por campo
- [ ] Fase e task são editáveis
- [ ] Toda mutação gera `audit_log`
- [ ] Um projeto completo é montado do zero em menos de 5 minutos

---

## F4 · Gamificação

**Épicos:** E3 · **Depende de:** F3

### Escopo

1. Migration `0004`: `offers` e `project_offers` com snapshot de título/insight/preço.
2. Admin: catálogo de ofertas (com `template_fases` em JSON) e publicação numa timeline específica, com override de copy e preço.
3. Cliente: bloco de vitrine ao fim da timeline (máx. 3), card com cadeado e trilho pontilhado.
4. Tela `/app/desbloquear/[offerSlug]`: insight em serifada, o que está incluso, prazo, preço.
5. Máquina de estados da oferta ([PRD](./PRD.md) E3), com a transição `disponivel → em_negociacao` por Server Action validada.
6. Materialização: ao desbloquear, gerar fase + tasks a partir do `template_fases`.
7. Telemetria: impressão, clique, início de checkout, conversão.

> A tela de desbloqueio existe, mas o botão ainda não cobra — F5 conecta o pagamento. Nesta fase o admin pode desbloquear manualmente para validar a materialização.

### Pronto quando

- [ ] Usuário não-admin não cria, edita nem precifica oferta — validado contra o banco, não só na UI
- [ ] `select * from offers` como cliente retorna zero linhas
- [ ] Oferta trancada não altera o percentual de progresso
- [ ] "Trancada" e "bloqueada" são visualmente inconfundíveis
- [ ] Desbloqueio manual materializa a fase corretamente

---

## F5 · Pagamentos com adaptador local

**Épicos:** E4, E5 · **Depende de:** F4

### Escopo

1. Migration `0005`: `subscriptions`, `charges`, `payment_events`, com as constraints de `R$ 0` e de vínculo único.
2. Interface `PaymentProvider` ([ARCHITECTURE](./ARCHITECTURE.md) §4.1).
3. `MockPaymentProvider`: ids falsos, QR Code de exemplo, e **gatilho manual no admin para simular o webhook** — é o que torna o fluxo inteiro testável sem conta.
4. Rota `/api/webhooks/pagamento` completa: verificação de assinatura, gravação bruta, idempotência, reconciliação, máquina de estados.
5. Checkout do desbloqueio conectado à oferta (Pix, crédito, débito).
6. `/app/faturas` com histórico e recibo.
7. Admin: assinatura por organização (valor e dia de vencimento), aceitando R$ 0.
8. **Dashboard financeira** (E5) com as definições de métrica do PRD, mais exportação CSV.
9. Cron de varredura de cobranças vencidas.

### Pronto quando

- [ ] Fluxo completo do F-C funciona com o mock: clicar no cadeado → escolher método → simular webhook → oferta desbloqueada → fase materializada
- [ ] Webhook é idempotente (reenviar o mesmo evento não duplica nada)
- [ ] Assinatura de R$ 0 não gera cobrança nem entra no MRR
- [ ] Receita realizada e prevista aparecem separadas e rotuladas
- [ ] Todo valor exibido com tabulares e formato pt-BR
- [ ] Nenhum dado de cartão em log ou banco

---

## F6 · Emails

**Épicos:** E7 · **Depende de:** F5 (paralelizável a partir da F2) · **Externo:** Resend

### Escopo

1. Migration `0006`: `email_log`.
2. Interface `EmailProvider` + `ConsoleEmailProvider` (já em uso desde a F1, formalizado aqui).
3. Sete templates HTML + texto, em pt-BR ([INTEGRATIONS](./INTEGRATIONS.md) §2).
4. Gatilhos ligados: M1, M2, M4a/b/c, M5.
5. **Digest do M3**: cron a cada 15 min, janela de 30 min, agregação por projeto.
6. Opt-out do M3 em `/app/conta`.
7. `ResendEmailProvider` e webhook de bounce.

> Tudo até o item 6 é implementável e testável sem conta no Resend. Só o item 7 depende de domínio verificado.

### Pronto quando

- [ ] Sem `RESEND_API_KEY`, tudo funciona pelo console e grava `email_log`
- [ ] Marcar 5 tasks em 2 minutos gera **1** email
- [ ] Todo email tem versão texto e renderiza bem em cliente escuro
- [ ] Falha de envio não derruba a operação de negócio
- [ ] Opt-out do M3 respeitado

---

## F7 · Institucional e conformidade

**Épicos:** E8 · **Depende de:** F0 · **Externo:** dados cadastrais da Sabre

### Escopo

1. `/` — home curta, sem preço, com caminho claro para o login.
2. `/contato` — formulário com rate limit e proteção anti-spam.
3. `/privacidade` e `/termos` com conteúdo real ([SECURITY](./SECURITY.md) §9).
4. `robots.ts` bloqueando `/app`, `/admin`, `/api` e rotas de auth.
5. `/llms.txt` servido como `text/markdown`.
6. `sitemap.ts` só com rotas públicas.
7. `X-Robots-Tag: noindex` nas rotas privadas.
8. Metadata, OG image e favicon.

### Pronto quando

- [ ] Nenhuma rota privada aparece no sitemap ou é indexável
- [ ] `/llms.txt` existe, em markdown, declarando a área privada
- [ ] Política de privacidade com razão social, CNPJ e encarregado reais
- [ ] Páginas públicas passam em WCAG AA e navegação por teclado
- [ ] **Bloqueio conhecido:** dados cadastrais pendentes com o Leoni (R3 do [PRD](./PRD.md))

---

## F8 · Integrações externas

**Épicos:** E4 (real), E1 (OAuth) · **Depende de:** F5, F6, F7 · **Externo:** conta Asaas, Google Cloud

Fase inteiramente bloqueada por provisionamento. Ver a ordem de provisionamento em [INTEGRATIONS](./INTEGRATIONS.md) §7.

### Escopo

1. `AsaasPaymentProvider` contra o **sandbox**, conferindo a documentação oficial vigente.
2. Webhook real: token, mapeamento de eventos, reconciliação de valor.
3. Pix real: QR Code e copia-e-cola do provedor.
4. Cartão de crédito e débito por checkout hospedado/tokenização.
5. Validação ponta a ponta em sandbox: assinatura, desbloqueio, falha, estorno, vencimento.
6. Virada para produção com transação real de valor baixo.
7. Google OAuth com as decisões da [INTEGRATIONS](./INTEGRATIONS.md) §4 — só email convidado entra.

### Pronto quando

- [ ] **Trocar `PAYMENT_PROVIDER=mock` por `asaas` não exigiu mudança em nenhuma tela.** Se exigiu, a abstração da F5 falhou
- [ ] Assinatura, desbloqueio, falha, estorno e vencimento validados em sandbox
- [ ] Uma transação real de valor baixo confirmada em produção
- [ ] Login por Google funciona para email convidado e é rejeitado para email não convidado

---

## F9 · Endurecimento

**Épicos:** transversal · **Depende de:** F8

### Escopo

1. **Testes**: Vitest para lógica de domínio (progresso, MRR, digest, máquina de estados da oferta, conversão centavos↔reais); Playwright para F-A, F-C e F-D.
2. Observabilidade: log estruturado nas actions e no webhook, monitoramento de erro, alerta de falha de webhook.
3. Revisão de performance com dados reais; índices conferidos.
4. Backup do Supabase com restauração testada.
5. **Checklist pré-produção do [SECURITY](./SECURITY.md) §11 integralmente executado.**
6. Auditoria de acessibilidade com leitor de tela.

### Pronto quando

- [ ] Os três fluxos críticos cobertos por teste E2E
- [ ] Lógica financeira coberta por teste unitário
- [ ] Checklist de segurança 100% concluído
- [ ] Restauração de backup testada uma vez de verdade

---

## Bloqueios externos, consolidados

| Fase | Bloqueio | Responsável |
|---|---|---|
| F0 | Acesso ao painel do Supabase para rotacionar chaves | Leoni |
| F6 (parcial) | Conta Resend + domínio verificado | Leoni |
| F7 | Razão social, CNPJ, endereço, email do encarregado | Leoni |
| F8 | Conta Asaas aprovada + chave sandbox | Leoni |
| F8 | Projeto no Google Cloud Console | Leoni |

Nenhum outro bloqueio externo existe. F0 a F5 são inteiramente executáveis com o que já está disponível.
