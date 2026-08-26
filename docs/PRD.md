# PRD — Sabre Logs v1

| | |
|---|---|
| **Produto** | Logs |
| **Versão do documento** | 1.0 |
| **Status** | Especificação aprovada, implementação não iniciada |
| **Substitui** | `docs/_mvp/PRD-mvp.md` (MVP com link ofuscado) |
| **Documentos irmãos** | [ARCHITECTURE](./ARCHITECTURE.md) · [DATA_MODEL](./DATA_MODEL.md) · [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) · [SECURITY](./SECURITY.md) · [INTEGRATIONS](./INTEGRATIONS.md) · [ROADMAP](./ROADMAP.md) |

---

## 1. Contexto

### 1.1 O que existe hoje

O MVP do Logs entrega uma coisa e entrega bem: o cliente da Sabre abre um link e vê em que pé está o onboarding do agente de IA dele. Fases, tasks, percentual, atualização em tempo real.

O acesso é um UUID na URL (`/p/9f3c…`). Não há login, não há token assinado, não há expiração. Isso foi uma escolha consciente do MVP — evitava sessão, senha e recuperação de senha num produto que precisava existir em dias. O custo foi aceito na época e está documentado em `_mvp/logs_arquitetura.md`.

### 1.2 Por que mudar agora

Três limites do modelo atual travam o produto:

1. **O link não é um endereço.** `.../p/9f3c8a12-…` não cabe num cartão, num email institucional, numa conversa. O cliente perde o link e precisa pedir de novo. Não há percepção de "eu tenho uma conta na Sabre" — há a percepção de "recebi um arquivo".
2. **Não dá para falar com o cliente.** Sem identidade, não existe email transacional. Toda entrega concluída depende do Leoni avisar manualmente por WhatsApp. O produto não trabalha sozinho.
3. **Não há caminho de receita dentro do produto.** Hoje o Logs mostra o que foi entregue. Ele não mostra o que *poderia* ser entregue, e não tem como cobrar por isso. Cada upsell é uma conversa comercial do zero.

### 1.3 O que a v1 resolve

A v1 transforma o Logs de painel de acompanhamento em **plataforma de relacionamento com o cliente da Sabre**: conta própria com URL limpa, comunicação automática por email, uma timeline que exibe tanto o que já foi feito quanto o que está trancado atrás de um pagamento, e um painel financeiro que dá ao operador a visão de receita que hoje mora numa planilha.

### 1.4 Princípio orientador

> O cliente entra para ver progresso e sai querendo mais escopo.

Toda decisão de escopo abaixo se justifica por essa frase. O painel não é um Jira para o cliente; é uma vitrine honesta de trabalho entregue, com desejo desenhado na borda.

---

## 2. Personas

### P1 · Cliente final (usuário primário)

Dono ou sócio de um negócio pequeno/médio/grande que contratou um agente de IA da Sabre. Não é técnico. Entra no painel entre uma e quatro vezes por semana, quase sempre pelo celular, quase sempre para responder a pergunta *"em que pé está?"*. Vocabulário técnico o afasta; percentual, data e nome de etapa em português o tranquilizam.

Sucesso para ele: em menos de 10 segundos saber se está no prazo e o que vem a seguir.

### P2 · Usuário secundário da organização

Gerente, sócio ou responsável de operação que o cliente adiciona à conta. Mesmas permissões de leitura, sem poder de decisão comercial (não fecha desbloqueio). Existe porque negócio raramente tem uma pessoa só — e porque forçar compartilhamento de senha é um problema de segurança que se cria sozinho.

### P3 · Administrador Sabre (Leoni)

Operador único. Cria organizações, convida clientes, monta a timeline do projeto, marca tasks como concluídas, escreve as ofertas de desbloqueio e acompanha a receita. É o único papel com poder de escrita no sistema inteiro. Também tem acesso a um painel onde pode desenvolver ofertas completas sem publicar para nenhum cliente, apenas para planejamento comercial.

Sucesso para ele: atualizar o status de um projeto em menos de um minuto e ver a receita do mês sem abrir planilha.

---

## 3. Objetivos e não-objetivos

### 3.1 Objetivos da v1

| # | Objetivo | Como se mede |
|---|---|---|
| O1 | Cliente acessa por conta própria, com URL limpa | ≥ 90% dos clientes ativos ativaram a conta em até 7 dias do convite |
| O2 | O produto comunica sozinho | 100% das tasks concluídas geram notificação sem ação manual |
| O3 | Upsell nasce dentro do produto | ≥ 30% dos clientes clicam em ao menos uma task trancada por mês |
| O4 | Operador enxerga a receita sem planilha | Receita do mês, MRR e próximas cobranças visíveis em uma tela |
| O5 | Base segura por padrão | Nenhuma tabela legível sem vínculo de organização; nenhum segredo no repositório |

### 3.2 Não-objetivos (decisões explícitas de *não* fazer)

- **Não é self-serve.** Não existe cadastro público. Conta só nasce por convite do admin. O produto é o braço digital de um serviço vendido por conversa.
- **Não é ferramenta de gestão de projeto.** O cliente não cria, edita, comenta ou reordena nada. Ele lê. Escrita é exclusiva do admin.
- **Não é um chat.** Não há mensagens, threads ou comentários na v1 (ver [BACKLOG](./BACKLOG.md)).
- **Não há preço público.** A precificação é por negociação; o valor só aparece dentro da oferta específica daquele cliente.
- **Não há app nativo.** Web responsiva, mobile-first.

---

## 4. Modelo de domínio

Em prosa, antes do esquema formal ([DATA_MODEL](./DATA_MODEL.md)):

```
Organização  (o cliente da Sabre — uma empresa)
  ├── Membros            (1..N usuários, papéis owner / member)
  ├── Assinatura         (0 ou 1, valor mensal >= R$ 0)
  ├── Cobranças          (histórico financeiro: recorrentes e avulsas)
  └── Projetos           (1..N — normalmente 1 no início)
        └── Fases        (ordenadas)
              ├── Tasks               (o trabalho contratado)
              └── Ofertas do projeto  (o trabalho NÃO contratado, trancado)
                    └── referencia →  Oferta (catálogo global do admin)
```

Dois conceitos merecem definição precisa porque são o coração da v1:

**Task.** Unidade de trabalho dentro do escopo já contratado. Pertence a uma fase, tem ordem, título, descrição opcional e um de quatro estados: `pendente`, `em_andamento`, `concluida`, `bloqueada` (impedida por algo externo — não confundir com trancada).

**Oferta de projeto (task trancada).** Aparece na mesma timeline, na mesma posição visual que uma task, mas representa capacidade que o cliente **não** contratou. Carrega uma copy de insight escrita pelo admin (*"aumente 15% sua taxa de conversão adicionando um sistema de vendas automatizado"*) e um preço. Ao ser paga, deixa de ser oferta e vira uma fase/task normal no escopo do cliente.

A distinção entre `bloqueada` e trancada é fonte previsível de confusão e precisa ficar clara na UI: **bloqueada** = "não conseguimos avançar" (problema); **trancada** = "podemos fazer isso por você" (oportunidade). Nunca compartilham cor, ícone ou vocabulário.

---

## 5. Épicos

Cada épico tem *user stories* e critérios de aceite verificáveis. A numeração (E1…E8) é referenciada pelo [ROADMAP](./ROADMAP.md).

---

### E1 · Identidade e acesso

Substitui o link ofuscado por conta real. É pré-requisito de todo o resto.

#### Histórias

- **E1.1** — Como admin, crio uma organização e convido o primeiro usuário informando nome e email, para que o cliente tenha acesso à plataforma.
- **E1.2** — Como cliente convidado, recebo um email com uma **senha temporária** e o endereço de login, para entrar sem precisar de link mágico.
- **E1.3** — Como cliente, no primeiro acesso sou **obrigado** a trocar a senha temporária por uma minha antes de ver qualquer conteúdo.
- **E1.4** — Como cliente, esqueci minha senha e consigo recuperá-la por email sem falar com ninguém.
- **E1.5** — Como owner de uma organização, convido outro usuário da minha empresa para ver os projetos.
- **E1.6** — Como usuário que pertence a mais de uma organização, alterno entre elas sem deslogar.
- **E1.7** — Como admin, revogo o acesso de um usuário imediatamente.

#### Regras

- Papéis: `admin` (global, Sabre) · `owner` (da organização) · `member` (da organização). Somente `owner` convida membros; somente `admin` cria organizações.
- Senha temporária: gerada pelo sistema, aleatória, ≥ 12 caracteres, **exibida ao admin apenas uma vez** no momento da criação (para o caso de precisar passar por outro canal) e enviada por email.
- Convite expira em **7 dias**. Após expirar, o admin reenvia — o que gera nova senha temporária e invalida a anterior.
- `must_change_password = true` bloqueia todas as rotas autenticadas exceto `/trocar-senha`.
- Política de senha: mínimo 10 caracteres, verificação contra lista de senhas comuns, sem regra de "1 maiúscula + 1 símbolo" (aumenta atrito sem aumentar entropia real).
- Sessão: cookie httpOnly gerenciado pelo Supabase Auth via `@supabase/ssr`, com refresh automático. Verificação real no `proxy.ts` — não apenas presença de cookie.

#### Critérios de aceite

- [ ] Não existe rota pública de cadastro. Tentar acessar `/cadastro` retorna 404.
- [ ] Usuário com `must_change_password = true` que tenta acessar `/app` é redirecionado para `/trocar-senha` e não consegue sair de lá sem trocar.
- [ ] Convite expirado exibe tela própria com instrução de contato, não erro genérico.
- [ ] Usuário de uma organização não consegue, por nenhum caminho (URL direta, id em formulário, chamada de API), ler dados de outra organização.
- [ ] Login tem limite de tentativas por email e por IP (ver [SECURITY](./SECURITY.md)).
- [ ] Revogação de acesso encerra a sessão ativa do usuário na próxima requisição.

---

### E2 · Área do cliente

#### Histórias

- **E2.1** — Como cliente, acesso `/app` e vejo meu projeto sem precisar procurar nada.
- **E2.2** — Como cliente, vejo no topo o nome do projeto, o percentual concluído, quantas etapas faltam e quando foi a última atualização.
- **E2.3** — Como cliente, percorro a timeline de fases e entendo em qual estamos.
- **E2.4** — Como cliente, abro uma task e leio a descrição do que foi/será feito.
- **E2.5** — Como cliente, vejo um histórico das últimas atualizações do projeto.
- **E2.6** — Como cliente com mais de um projeto, escolho qual visualizar.

#### Regras de URL

| Rota | Conteúdo |
|---|---|
| `/app` | Redireciona para o projeto único, ou lista projetos se houver mais de um |
| `/app/projetos/[slug]` | Timeline do projeto |
| `/app/projetos/[slug]/[taskSlug]` | Detalhe da task (ou modal com URL própria) |
| `/app/conta` | Perfil, troca de senha, membros da organização |
| `/app/faturas` | Histórico de cobranças e recibos da organização |

Nada de UUID em URL visível. `slug` é derivado do nome do projeto, único por organização.

#### Critérios de aceite

- [ ] Nenhuma URL da área logada contém UUID.
- [ ] O percentual considera apenas tasks contratadas — **ofertas trancadas nunca entram no denominador** (senão o cliente parece estar "menos pronto" por existir upsell disponível).
- [ ] A timeline é legível em tela de 360px sem rolagem horizontal.
- [ ] Cada estado de task é distinguível por ícone + rótulo textual, nunca só por cor.
- [ ] Alteração feita pelo admin aparece para o cliente em ≤ 5s sem recarregar a página (Realtime escopado ao projeto).
- [ ] Existe `loading` e `error` boundary em cada rota de dados.

---

### E3 · Gamificação e desbloqueio

O mecanismo de desejo. **Somente o administrador gerencia ofertas** — é regra de negócio, não detalhe de permissão.

#### Histórias

- **E3.1** — Como admin, cadastro no catálogo uma capacidade que a Sabre sabe entregar (ex.: "Vendas automatizadas por WhatsApp"), com uma copy de insight e um preço padrão.
- **E3.2** — Como admin, insiro uma oferta do catálogo na timeline de um projeto específico, podendo sobrescrever a copy e o preço para aquele cliente.
- **E3.3** — Como cliente, vejo na timeline uma etapa com **cadeado**, visualmente distinta, que sinaliza uma capacidade disponível mas não contratada.
- **E3.4** — Como cliente, clico no cadeado e leio a mensagem de insight preparada para mim, com o benefício, uma descrição do que será entregue e o preço.
- **E3.5** — Como cliente, na mesma tela escolho a forma de pagamento e desbloqueio.
- **E3.6** — Como cliente, após pagar, vejo a etapa destravada e virar trabalho de verdade na minha timeline.
- **E3.7** — Como admin, acompanho quais ofertas foram vistas, clicadas e convertidas.

#### Estados de uma oferta de projeto

```
 rascunho ──publicar──> disponivel ──cliente clica──> em_negociacao
                             │                              │
                             │                        pagamento confirmado
                             │                              ▼
                             └──admin remove──> removida   desbloqueada ──> vira Fase/Tasks reais
```

| Estado | Visível ao cliente | Descrição |
|---|---|---|
| `rascunho` | Não | Admin montando a oferta |
| `disponivel` | Sim, com cadeado | Aguardando interesse |
| `em_negociacao` | Sim, com selo próprio | Cliente iniciou checkout; cobrança pendente |
| `desbloqueada` | Sim, como trabalho normal | Paga; gera fase/tasks no escopo |
| `removida` | Não | Retirada pelo admin |

#### Regras

- Ofertas ocupam sempre **o fim da timeline**, agrupadas sob um rótulo próprio (algo como "Disponível para o seu projeto"), nunca intercaladas entre fases contratadas. Motivo: misturar as duas coisas corrói a confiança na barra de progresso.
- No máximo **3 ofertas** visíveis simultaneamente por projeto. Vitrine, não catálogo.
- A copy de insight é campo livre do admin. O sistema não gera texto.
- O preço mostrado é sempre o preço efetivo daquele cliente (`project_offers.preco_centavos`), com fallback para o preço do catálogo.
- Ao ser desbloqueada, a oferta materializa uma nova fase com as tasks definidas no catálogo, em estado `pendente`, e some da vitrine.
- Registro de telemetria por oferta: impressão, clique, início de checkout, conversão.

#### Critérios de aceite

- [ ] Nenhum usuário não-`admin` consegue criar, editar, precificar ou remover oferta — nem por chamada direta ao banco (RLS) nem por server action.
- [ ] Oferta trancada não afeta o percentual de progresso do projeto.
- [ ] O visual de "trancada" é inequivocamente distinto do visual de "bloqueada".
- [ ] Após confirmação de pagamento, a oferta vira fase real e o cliente é notificado por email.
- [ ] Se o pagamento falhar, a oferta volta a `disponivel` com mensagem clara e sem cobrar.
- [ ] Deve ser possível através da página o cliente entrar em contato com o admin pelo Whatsapp para negociar a oferta, nunca com botão de "Negociar", mas sim de "Entrar em contato" além da opção de pagamento dentro da própria plataforma.

---

### E4 · Pagamentos

Provedor alvo: **Asaas**. A conta ainda não existe — a v1 implementa a camada atrás de uma interface (`PaymentProvider`) com adaptador *mock*, e o adaptador Asaas real entra na F8 ([INTEGRATIONS](./INTEGRATIONS.md), [ROADMAP](./ROADMAP.md)).

#### Histórias

- **E4.1** — Como cliente, pago um desbloqueio com **cartão de crédito**, **cartão de débito** ou **Pix**.
- **E4.2** — Como cliente pagando com Pix, recebo QR Code e código copia-e-cola, e a tela reconhece o pagamento sozinha quando ele cai.
- **E4.3** — Como cliente, tenho uma **assinatura mensal** da organização, que pode ser de R$ 0,00 quando o contrato for só de implementação.
- **E4.4** — Como cliente, vejo em `/app/faturas` o histórico de cobranças com status e recibo.
- **E4.5** — Como cliente, sou avisado por email quando uma cobrança é gerada, paga ou falha.
- **E4.6** — Como admin, defino o valor e o dia de vencimento da assinatura de cada organização.

#### Regras

- **Assinatura de R$ 0,00 é um estado de primeira classe.** Ela existe no nosso banco (a organização tem plano e ciclo), mas **não gera cobrança no provedor** e não aparece como receita. Serve para o caso "cobrei só a implementação". Nenhuma tela deve exibir "R$ 0,00" como se fosse uma fatura pendente.
- Valores em **centavos, inteiro** (`integer`), nunca `float`. Moeda fixa BRL na v1.
- Toda cobrança tem chave de idempotência própria; webhook reprocessado não duplica registro.
- A confirmação de pagamento é **sempre** do webhook do provedor. O retorno do navegador é apenas UX — nunca libera nada sozinho.
- Falha de cobrança recorrente: 3 tentativas com intervalo crescente, depois `inadimplente`. Inadimplência **não** corta o acesso ao painel na v1 (decisão deliberada: o painel é relacionamento, não refém); apenas sinaliza ao admin.
- Dados de cartão **nunca** trafegam pelo nosso servidor nem são persistidos. Tokenização/checkout do provedor.

#### Critérios de aceite

- [ ] Nenhum dado de cartão é logado, persistido ou passa por server action nossa.
- [ ] Webhook rejeita requisição sem assinatura válida e é idempotente por `event_id`.
- [ ] Assinatura de R$ 0,00 não gera cobrança nem entra no cálculo de MRR.
- [ ] Pix exibe QR Code + copia-e-cola e atualiza a tela ao confirmar, sem refresh manual.
- [ ] Todo evento de pagamento recebido fica registrado bruto em `payment_events` antes de ser interpretado.
- [ ] A troca do adaptador mock pelo Asaas não exige mudança em nenhuma tela.

---

### E5 · Dashboard financeira do admin

#### Histórias

- **E5.1** — Como admin, vejo a **receita do mês corrente**: realizada e prevista.
- **E5.2** — Como admin, vejo o **MRR** e sua variação em relação ao mês anterior.
- **E5.3** — Como admin, vejo quanto **cada cliente** paga por mês e quanto já pagou no total.
- **E5.4** — Como admin, vejo as **próximas cobranças** ordenadas por data.
- **E5.5** — Como admin, vejo quem está **inadimplente** e há quantos dias.
- **E5.6** — Como admin, vejo o **histórico de desbloqueios** (receita avulsa) por período.
- **E5.7** — Como admin, **exporto CSV** de cobranças de um período.

#### Definições de métrica (escritas para não haver ambiguidade na implementação)

| Métrica | Definição |
|---|---|
| Receita realizada do mês | Soma das cobranças com status `paga` e `data_pagamento` dentro do mês |
| Receita prevista do mês | Realizada + cobranças `pendente`/`agendada` com vencimento no mês |
| MRR | Soma dos valores de assinaturas `ativa` com valor > 0. **Desbloqueios avulsos não entram.** |
| Receita avulsa | Cobranças do tipo `desbloqueio` pagas no período |
| Inadimplência | Cobranças `vencida` há mais de 3 dias corridos |
| LTV por cliente | Soma de tudo que a organização já pagou |

#### Critérios de aceite

- [ ] Todos os valores exibidos em BRL com numerais tabulares e separador pt-BR.
- [ ] A tela distingue visualmente receita realizada de prevista — nunca soma as duas num número único sem rótulo.
- [ ] Assinaturas de R$ 0,00 aparecem na lista de clientes com rótulo "sem recorrência", não como R$ 0,00 no MRR.
- [ ] Funciona com dados do adaptador mock, sem depender do Asaas.
- [ ] Filtro por período e por organização.

---

### E6 · Admin operacional

#### Histórias

- **E6.1** — Como admin, faço CRUD de organizações.
- **E6.2** — Como admin, convido, reenvio convite e revogo usuários de qualquer organização.
- **E6.3** — Como admin, faço CRUD de projetos, fases e tasks — incluindo **editar**, que faltava no MVP.
- **E6.4** — Como admin, reordeno fases e tasks.
- **E6.5** — Como admin, gerencio o catálogo de ofertas e as ofertas de cada projeto.
- **E6.6** — Como admin, altero o status de uma task em um clique a partir da lista.
- **E6.7** — Como admin, vejo um log de auditoria do que foi alterado, por quem e quando.

#### Critérios de aceite

- [ ] Todo formulário valida com schema no servidor e devolve erro **por campo**, não `throw` genérico.
- [ ] Fases e tasks são editáveis, não apenas criáveis e deletáveis.
- [ ] Deletar algo com dependentes pede confirmação explícita e diz o que será perdido.
- [ ] Toda mutação registra entrada em `audit_log`.
- [ ] Reordenação por campo numérico é aceitável na v1; drag-and-drop segue no backlog.

---

### E7 · Emails transacionais

Provedor: **Resend**. Atrás de uma interface `EmailProvider` com adaptador de console para desenvolvimento — o sistema roda ponta a ponta sem chave.

| # | Email | Gatilho | Destinatário | Obrigatório |
|---|---|---|---|---|
| M1 | Convite e senha temporária | Admin cria/reenvia convite | Usuário convidado | Sim (transacional) |
| M2 | Recuperação de senha | Usuário solicita | Usuário | Sim |
| M3 | Task concluída | Task muda para `concluida` | Membros da organização | Optável |
| M4a | Cobrança gerada | Cobrança criada | Owner da organização | Sim |
| M4b | Pagamento confirmado | Webhook de pagamento | Owner | Sim |
| M4c | Cobrança vencida/falha | Falha ou vencimento | Owner | Sim |
| M5 | Desbloqueio liberado | Oferta vira `desbloqueada` | Membros | Sim |

#### Regras

- **M3 é agrupado (digest).** Marcar cinco tasks em sequência não dispara cinco emails: há uma janela de agregação (padrão 30 minutos) que consolida em uma mensagem *"3 etapas concluídas no seu projeto"*. Sem isso, o recurso vira spam na primeira semana de uso.
- Emails obrigatórios (transacionais) não têm opt-out. M3 tem, por membro, em `/app/conta`.
- Todo envio é registrado em `email_log` com status e id do provedor.
- Idioma pt-BR, remetente de domínio verificado da Sabre, com versão texto puro além do HTML.
- Falha de envio não derruba a operação principal: marcar task como concluída não pode falhar porque o email falhou. Envio é enfileirado/tolerante.

#### Critérios de aceite

- [ ] Em ambiente de desenvolvimento sem chave do Resend, os emails são renderizados no console e o fluxo completa normalmente.
- [ ] Marcar 5 tasks em 2 minutos produz **1** email, não 5.
- [ ] Todo email tem versão texto e passa em teste de renderização em cliente escuro.
- [ ] Nenhum email contém senha em texto claro exceto a temporária de M1, que expira em 7 dias.

---

### E8 · Institucional e conformidade

Escopo mínimo institucional — o produto não é vendido pelo site.

| Rota | Conteúdo |
|---|---|
| `/` | Home curta: o que é o Sabre Logs, para quem, e um caminho claro para o login |
| `/contato` | Formulário + canais diretos, com proteção anti-spam |
| `/privacidade` | Política de privacidade LGPD |
| `/termos` | Termos de uso |
| `/login`, `/recuperar-senha`, `/redefinir-senha` | Autenticação |
| `/robots.txt` | Permite institucional, bloqueia `/app`, `/admin`, `/api` |
| `/llms.txt` | Descrição em markdown do site para agentes de IA |
| `/sitemap.xml` | Apenas rotas públicas |

#### Critérios de aceite

- [ ] `/app`, `/admin` e `/api` estão bloqueados no `robots.txt` e não aparecem no sitemap.
- [ ] `/llms.txt` existe na raiz, em markdown, e declara explicitamente que a área logada é privada.
- [ ] Política de privacidade cobre: dados coletados, base legal, retenção, compartilhamento com operadores (Supabase, Resend, Asaas, Vercel), direitos do titular e canal do encarregado.
- [ ] Formulário de contato não expõe email por scraping e tem rate limit.
- [ ] Todas as páginas públicas passam em WCAG AA de contraste e navegação por teclado.

---

## 6. Fluxos

### F-A · Do convite ao primeiro acesso

1. Admin cria a organização e informa nome + email do primeiro usuário.
2. Sistema cria o usuário no Supabase Auth com senha temporária gerada e `must_change_password = true`; cria `invitations` com validade de 7 dias.
3. **M1** é enviado com a senha temporária e o endereço de login.
4. Cliente acessa `/login`, entra com email + senha temporária.
5. `proxy.ts` detecta `must_change_password` e redireciona para `/trocar-senha`.
6. Cliente define a nova senha; flag é limpa; convite marcado como aceito.
7. Redireciona para `/app`.

**Se o convite expirou:** o login falha com mensagem específica e instrução para pedir novo convite — nunca "email ou senha inválidos".

### F-B · Consulta de progresso (o caminho de 10 segundos)

1. Cliente abre `/app` (sessão viva).
2. Vê header: nome do projeto, percentual, "X de Y etapas", data da última atualização.
3. Rola a timeline; a fase atual está destacada.
4. Ao fim, o bloco de ofertas disponíveis.

### F-C · Desbloqueio

1. Cliente clica na etapa com cadeado.
2. Abre a tela de oferta: copy de insight, o que está incluso, prazo estimado, preço, contato direto com o admin pelo botão de Whatsapp.
3. Cliente escolhe Pix, crédito ou débito.
4. Oferta vai para `em_negociacao`; cobrança criada no provedor.
5. Pix: QR Code + copia-e-cola, tela aguarda confirmação. Cartão: checkout do provedor.
6. Webhook confirma → cobrança `paga` → oferta `desbloqueada` → fase e tasks materializadas.
7. **M4b** e **M5** enviados. Timeline do cliente atualiza em tempo real.

**Se falhar:** oferta volta a `disponivel`, cobrança fica `falhou`, cliente vê o motivo e pode tentar outra forma de pagamento. Nada é cobrado.

### F-D · Recuperação de senha

1. `/recuperar-senha`, informa email.
2. Resposta **sempre** genérica ("se este email existir, enviaremos instruções") — não revela se a conta existe.
3. **M2** com link de uso único, validade de 1 hora.
4. `/redefinir-senha` valida o token, aplica a política de senha, encerra as demais sessões.

### F-E · Admin conclui uma task

1. Admin muda o status para `concluida`.
2. `updated_at` do projeto atualiza; progresso recalcula.
3. Realtime empurra para o cliente conectado.
4. Task entra na janela de agregação de **M3**; ao fechar a janela, um email é enviado aos membros que não optaram por sair.

---

## 7. Estados vazios e de erro

Estados vazios são parte do produto, não sobra. Cada um tem cópia própria e uma ação óbvia.

| Situação | O que exibir |
|---|---|
| Organização sem projeto | "Seu projeto está sendo montado" + previsão + contato |
| Projeto sem fase | Mesmo tratamento; nunca uma barra de 0% sem explicação |
| Nenhuma oferta disponível | Bloco simplesmente não aparece (não mostrar "nenhuma oferta") |
| Cobrança recusada | Motivo do provedor traduzido para linguagem humana + como tentar de novo |
| Convite expirado | Tela dedicada com instrução de contato |
| Sessão expirada | Redireciona para login preservando o destino pretendido |
| Erro de servidor | `error.tsx` com identificador do erro e caminho de contato — nunca stack trace |
| Sem conexão / Realtime caído | Degradar para revalidação periódica, sem alarme visual |

---

## 8. Métricas de sucesso

| Métrica | Meta v1 | Origem |
|---|---|---|
| Ativação do convite em 7 dias | ≥ 90% | `invitations` |
| Sessões por cliente ativo/mês | ≥ 4 | Auth |
| Clientes que clicam em oferta/mês | ≥ 30% | Telemetria de oferta |
| Conversão clique → pagamento | ≥ 10% | `project_offers` + `charges` |
| Emails de task concluída por semana/cliente | ≤ 3 (sinal de digest funcionando) | `email_log` |
| Tempo do admin para atualizar um projeto | < 60s | Observação |

---

## 9. Riscos e questões abertas

| # | Risco / questão | Encaminhamento |
|---|---|---|
| R1 | **Credenciais expostas no repositório.** `.env.example` commitado com `service_role`, senha de admin e `SESSION_SECRET`; e uma chave `sb_secret_` numa variável `NEXT_PUBLIC_` | Bloqueante. Rotacionar tudo antes de qualquer deploy — item nº 1 da F0. Ver [SECURITY](./SECURITY.md) |
| R2 | Free tier do Supabase (pausa por inatividade, limites de Realtime) | Monitorar; plano pago quando houver receita recorrente |
| R3 | **Dados cadastrais da Sabre pendentes** (razão social, CNPJ, endereço, email do encarregado) para privacidade/termos | Bloqueia a conclusão da F7. Pendente com o Leoni |
| R4 | Sem conta Asaas, o fluxo de pagamento real não pode ser validado | Mitigado pelo adaptador mock; F8 é a fase de validação real |
| R5 | Gamificação mal calibrada pode soar como pressão de venda | Limite de 3 ofertas, posição sempre ao fim, copy sob controle do admin |
| R6 | O que acontece com a conta ao fim do onboarding? | A definir: manter como painel de relacionamento (preferência) vs. arquivar |
| R7 | Migração dos dados do MVP | Documentada no [DATA_MODEL](./DATA_MODEL.md); volume atual é pequeno |
| R8 | Operador único é ponto único de falha operacional | Fora de escopo técnico |

---

## 10. Fora de escopo da v1

Comentários por task · anexos de arquivo · exportação em PDF · reordenação por drag-and-drop · previsão automática de data de entrega · analytics de acesso ao painel · múltiplos administradores Sabre · internacionalização · app nativo · marketplace público de ofertas · Insights comerciais e financeiros por IA

Detalhamento e justificativa em [BACKLOG](./BACKLOG.md).

---

## 11. Rastreabilidade do pedido original

Para conferência de que nada do pedido se perdeu:

| Pedido | Onde está |
|---|---|
| Login para clientes, sem link único | E1, E2 |
| URL mais limpa | E2 (tabela de rotas) |
| Sistema de login com Supabase | E1, [ARCHITECTURE](./ARCHITECTURE.md) |
| Envio de email pela plataforma (Resend) | E7 |
| Recuperação de senha | E1.4, F-D, M2 |
| Email quando task for concluída | E7 (M3, com digest) |
| Desbloqueio / gamificação com cadeado | E3 |
| Só o admin gerencia essas funções | E3 (regra + RLS no [DATA_MODEL](./DATA_MODEL.md)) |
| Pagamento via Asaas | E4, [INTEGRATIONS](./INTEGRATIONS.md) |
| Mensagem de insight na task trancada | E3.4 |
| Cartão de crédito, débito e Pix | E4.1 |
| Dashboard financeira do admin | E5 |
| Receita do mês, valor por cliente, próximos pagamentos | E5 (definições de métrica) |
| Visual moderno e "tech" sem cara de IA | [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) |
| RLS no banco | [DATA_MODEL](./DATA_MODEL.md), [SECURITY](./SECURITY.md) |
| Não vazar chaves de API | [SECURITY](./SECURITY.md) §1 e §2 |
| robots.txt e llms.txt | E8, [SECURITY](./SECURITY.md) §7 |
| Página de contato, política de privacidade | E8 |
| Reaproveitar/descartar o código do MVP | [ARCHITECTURE](./ARCHITECTURE.md) §7, [ROADMAP](./ROADMAP.md) F0 |
