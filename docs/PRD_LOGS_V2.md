# PRD — Logs

Nov 5, 2026 · @Leoni

## 1. Visão e problema

O Logs é o sistema operacional da Sabre: um único registro do ciclo de vida de cada conta, do primeiro diagnóstico à renovação. Ele vende, faz o onboarding, mostra o progresso ao cliente e mede o negócio.

**Problemas que resolve**

- **Venda sem padrão:** proposta, preço e oferta mudam de lead para lead, e o escopo cresce sem cobrança (caso Plena, v2 pelo mesmo valor).
- **Entrega sem previsibilidade:** sem semanas e critérios de pronto fixos, o cliente não sabe o que esperar e Leoni não sabe quanto cabe na agenda.
- **Pós-venda invisível:** o cliente não vê o valor sendo construído, e é a entrega do mês 1 que gera indicação, o maior multiplicador de receita da Sabre.
- **Gestão no escuro:** MRR, inadimplência, custo de API por cliente e capacidade estão espalhados ou não existem.

**Princípios**

1. **Um registro, várias telas.** Toda ação relevante vira um evento; vendas, portal, metas e financeiro são leituras do mesmo log.
2. **Encantar pela tecnologia.** O lead tem que ver a própria dor virar sistema na frente dele. A experiência é a prova de competência.
3. **Preço por regra, narrativa por IA.** A IA personaliza o texto; nunca define preço, escopo ou desconto.
4. **Recompensa é mais Sabre, nunca Sabre mais barata.** Prêmios são acesso e status, não moedas, créditos ou descontos.
5. **Usar antes de completar.** Cada módulo entra em uso real assim que existe no mínimo (ex.: controle financeiro antes do Asaas).

## 2. Usuários e jornada

Três públicos usam o Logs, e cada um vê uma fatia diferente da mesma conta.

| Usuário | Quando entra | O que vê | O que faz |
| --- | --- | --- | --- |
| Leoni (admin) | Sempre | Tudo: pipeline, contas, metas, financeiro, capacidade | Conduz calls, gera propostas, gerencia sprints, registra pagamentos |
| Lead | Do diagnóstico ao fechamento | Proposta viva personalizada | Lê a proposta, escolhe o tier, aceita |
| Cliente | Do contrato ao fim | Portal: sprint atual, progresso, resultados, pendências dele | Entrega dados e acessos, acompanha, indica, faz upgrade |

A proposta não morre no fechamento: a mesma URL vira o portal do cliente, e as projeções da proposta viram as metas do projeto.

&#91;embedded content: jornada da conta · 10 etapas, 1 ciclo\]

A venda termina no contrato, mas a conta não: depois da entrega, upgrade e indicação reabrem o ciclo.

## 3. Módulos

São cinco módulos sobre o mesmo dado, construídos na ordem do caixa: o que fecha contrato primeiro, o que mede o negócio por último.

### 3.1 Cockpit de vendas

Tela que Leoni usa ao vivo nas calls de diagnóstico e de vendas.

- **Captura SPIN estruturada:** cada dor entra como Situação, Problema, Implicação ou Necessidade, com um número obrigatório na Implicação (leads perdidos/mês, ticket médio, horas gastas).
- **Qualificação BANT** lado a lado, para saber se o lead vai para proposta ou sai do funil.
- **Mapeamento por regra:** dor → módulo do catálogo (Sabre OS Playbook) → preço fixo. Sem campo de preço livre.
- **Gerar proposta:** um clique monta a proposta viva a partir do que foi capturado.
- Ritmo: o diagnóstico captura; a reunião de vendas revela a página pronta.

### 3.2 Proposta viva

Página personalizada do lead, que depois do aceite vira o portal.

- **Custo da dor em R$/mês**, calculado a partir das Implicações capturadas.
- **Solução por dor:** cada seção liga uma dor dele a um módulo, com texto personalizado pela IA.
- **Três tiers com ancoragem;** o do meio é o alvo. O tier cheio mostra o que fica bloqueado nos outros.
- **ROI como projeção com premissas explícitas** ("considerando N leads/mês e ticket R$X"), nunca como promessa.
- **Aceite na página:** escolhe o tier, aceita os termos, gera contrato e primeira cobrança.

### 3.3 Onboarding e portal do cliente

O que o cliente vê do aceite até o fim do contrato.

- **Linha do tempo das semanas** (S0 a S4+) com a sprint atual em destaque e % do sistema construído.
- **Pendências do cliente:** checklist de dados e acessos (Calendar, Meta, CRM, WhatsApp) com prazo e status. Pendência vencida pausa o relógio do projeto, visível para os dois lados.
- **Placar de resultado:** leads atendidos pelo agente, horas economizadas, R$ no pipeline, comparados às projeções da proposta.
- **Tasks bloqueadas:** módulos de tiers acima aparecem com o ganho potencial e o botão de upgrade.
- **Treinamentos gravados** e agenda das reuniões.
- **Indicação:** link próprio do cliente, com status da indicação.

### 3.4 CRM interno da Sabre

O painel de Leoni.

- **Pipeline:** prospecção → conexão → diagnóstico → proposta → fechado, com registro rápido de call.
- **Metas:** MRR, calls/dia, prospecções, tasks (detalhe na seção 5).
- **Tasks:** tudo que Leoni tem a fazer, por conta e por sprint.
- **Capacidade:** horas/semana comprometidas (implementações + retainers + aulas) contra horas disponíveis. Limite inicial: 2 implementações em paralelo.
- **Saúde da conta:** uso do sistema, resultado vs projeção, pagamentos em dia, engajamento. Sinaliza risco de churn e momento de upsell.
- **Pedidos de mudança:** todo pedido fora do escopo vira registro e é classificado como incluído no retainer ou aditivo.

### 3.5 Financeiro

Primeiro controle, depois cobrança real via Asaas.

- **Fase A, controle:** contratos, cobranças previstas, pagamentos registrados à mão, MRR, inadimplência, custo de API e infra por cliente, margem por cliente, alocação nos baldes do Sabre Financial OS.
- **Fase B, Asaas:** clientes, assinaturas e cobranças sincronizados (Pix, boleto, cartão), baixa automática por webhook, régua de cobrança.
- O modelo da Fase A já espelha os objetos do Asaas, para a Fase B ser sincronização e não refatoração.
- **Teste do modelo:** tem que suportar o contrato da Plena (implementação com entrada + parcelas embutidas na mensalidade, vigência mínima de 6 meses).

## 4. Padrão de entrega Sabre

Toda implementação segue a mesma sequência de semanas, e cada semana só fecha quando bate seu critério de pronto. O Logs cria esse esqueleto automaticamente no aceite da proposta.

| Etapa | Objetivo | Entregas padrão | Critério de pronto | Depende do cliente |
| --- | --- | --- | --- | --- |
| S0 · Pré-kickoff | Contrato e terreno prontos | Contrato assinado, 1ª cobrança paga, checklist de onboarding enviado, kickoff agendado | Pagamento confirmado e kickoff marcado | Assinar e pagar |
| S1 · Onboarding de dados | Preparar o terreno | Dados internos coletados, acessos e APIs configurados (Calendar, Meta, CRM), banco de dados modelado, estratégia de execução dos agentes | Todos os acessos validados e estratégia aprovada pelo cliente | Entregar dados e acessos até D+3 |
| S2 · Construção | Agentes e sistema funcionando | Agentes desenvolvidos/treinados, MLP do sistema integrado (CRM ou outro) | Fluxo principal rodando com dado real em ambiente de teste | Testar e dar feedback |
| S3 · Entrega | Escopo completo em produção | Ajustes finais, sistema em produção, treinamento de uso | Checklist de escopo 100% e aceite formal do cliente | Aceite |
| S4+ · Otimização | Melhorar resultado até o fim do contrato | Ciclos semanais ou quinzenais de ajuste, relatório de resultado vs projeção | Relatório do ciclo publicado no portal | Usar o sistema |

**Regras da entrega**

- **Relógio pausado:** pendência do cliente vencida congela o prazo do projeto. O portal mostra a pausa e o motivo. Isso precisa estar no contrato.
- **Integrações lentas não travam o resto:** o que depende de aprovação externa (ex.: API da Meta) roda em paralelo; o resto é construído sobre dado histórico ou entrada manual primeiro ("Fase 0").
- **Cadência de reuniões:** 2 reuniões de treinamento por semana de S1 a S3; em S4+, 1 semanal ou quinzenal. Treinamentos recorrentes ficam gravados no portal.
- **Consultoria por WhatsApp** durante todo o contrato, com horário de resposta definido.
- **Retainer com escopo fechado:** o que entra na mensalidade de S4+ é listado na proposta. Fora disso, é pedido de mudança.
- **Capacidade:** no máximo 2 projetos em S0–S3 ao mesmo tempo. Um terceiro fechamento entra na fila com data de início.

## 5. Metas e recompensas

Um único motor de metas serve a Sabre, os projetos e o CRM dos clientes. As recompensas são acesso e status, nunca moeda ou desconto.

### 5.1 Motor de metas

Uma meta = métrica + alvo + período + dono + fonte automática do dado. O mesmo motor (já previsto no construtor de métricas da Plena) roda em três camadas:

| Camada | Exemplos | Fonte do dado |
| --- | --- | --- |
| Sabre | MRR, calls/dia, prospecções, diagnósticos, fechamentos, tasks concluídas | Eventos do CRM interno e do financeiro |
| Projeto do cliente | Resultados projetados na proposta (leads atendidos, horas economizadas, R$ no pipeline) | Eventos dos agentes e do CRM do cliente |
| CRM do cliente | Metas por vendedor ou corretor | CRM do cliente (módulo padrão do template) |

### 5.2 Funil reverso

A meta de calls não é chute: é calculada de trás pra frente a partir da meta de MRR e das taxas reais de conversão de Leoni.

```latex
\text{calls/dia} = \frac{\text{novo MRR desejado} / \text{ticket médio}}{t_{con} \cdot t_{diag} \cdot t_{prop} \cdot t_{fech} \cdot \text{dias úteis}}
```

- Cada call registrada atualiza as taxas, então a meta fica mais precisa com o uso.
- **Trava de capacidade:** se a meta de fechamentos passar da capacidade de entrega, o sistema avisa que a alavanca é preço, não volume.
- Taxas iniciais: a definir com os dados atuais de prospecção.

### 5.3 Recompensas por acesso e status

Só ações que geram caixa ou aceleram a entrega têm recompensa.

| Ação do cliente | Recompensa |
| --- | --- |
| Indicação que fecha contrato | Módulo real liberado antes da hora ou sessão estratégica extra com Leoni |
| Depoimento ou case publicado | Destaque como Cliente Fundador no site da Sabre |
| Upgrade de tier | Prioridade na fila da próxima sprint |
| Dados e acessos entregues em até 48h | Projeto entra no ritmo mais rápido de entrega, visível no portal |

Nada de pontos, medalhas, moedas, créditos ou descontos. O progresso do sistema e o placar de resultado são o que motiva o cliente.

## 6. Modelo de dados e eventos

A conta é o centro; tudo pendura nela, e toda mudança relevante grava um evento. Proposta: Supabase (mesma stack do Atrium), com RLS para o cliente enxergar só a própria conta.

| Entidade | Campos-chave | Liga com |
| --- | --- | --- |
| account | nome, segmento, cidade, estágio, saúde, asaas\_customer\_id | Tudo abaixo |
| contact | nome, papel (decisor, operador), WhatsApp, e-mail | account |
| call | tipo (prospecção, diagnóstico, vendas), data, resultado, duração | account |
| pain | tipo SPIN, descrição, valor numérico, unidade, custo R$/mês | account, call, module |
| module | catálogo: nome, descrição, preço de implementação, mensalidade, horas estimadas | pain, offer |
| offer | tier, módulos, preço total, premissas do ROI, status (rascunho, enviada, aceita) | account, module |
| contract | oferta aceita, vigência, implementação, mensalidade, plano de parcelas, escopo do retainer | account, offer |
| project | contrato, semana atual, relógio (rodando, pausado), datas previstas | contract |
| sprint | etapa (S0–S4+), critério de pronto, status | project |
| task | dono (Sabre ou cliente), prazo, status, bloqueada por tier | sprint |
| change\_request | descrição, classificação (retainer, aditivo), valor | project |
| goal | métrica, alvo, período, dono, camada, fonte | account ou Sabre |
| charge | valor, vencimento, status, forma, asaas\_payment\_id | contract |
| cost | tipo (API, infra, WhatsApp), valor/mês | account |
| referral | quem indicou, lead indicado, status, recompensa entregue | account |
| event | tipo, ator, entidade, payload, timestamp | Tudo |

**Eventos mínimos do v1**

- `call.logged`, `pain.captured`, `offer.sent`, `offer.viewed`, `offer.accepted`
- `project.started`, `task.done`, `client_task.overdue`, `clock.paused`, `clock.resumed`, `sprint.closed`
- `charge.created`, `charge.paid`, `charge.overdue`
- `referral.created`, `referral.won`, `upgrade.done`, `change_request.created`

`offer.viewed` importa: saber quando e quantas vezes o lead abriu a proposta é o melhor sinal para o follow-up.

## 7. Regras de negócio invioláveis

Estas regras ficam no código, não na boa vontade. Se uma tela permite quebrar uma delas, é bug.

1. **Preço só vem do catálogo.** Não existe campo de preço livre na proposta. Mudança de preço = mudança no catálogo, que vale para todos.
2. **IA não decide dinheiro.** Ela escreve narrativa; preço, escopo, tier e desconto são regras.
3. **Desconto não existe como recompensa.** A única alavanca de preço permitida é condição de pagamento (ex.: à vista ou anual antecipado), definida no catálogo.
4. **ROI sempre com premissas.** Nenhum número projetado aparece sem as premissas que o geraram.
5. **Escopo verbal não existe.** Tudo que foi combinado está na proposta aceita ou num pedido de mudança registrado.
6. **Relógio pausado é automático.** Pendência do cliente vencida pausa o projeto sem Leoni precisar cobrar.
7. **Sem sprint sem pagamento.** S1 só começa com a primeira cobrança paga.
8. **Capacidade é limite duro.** Com 2 projetos em S0–S3, o próximo aceite entra na fila com data de início explícita.
9. **Cliente só vê a própria conta.** Isolamento garantido no banco (RLS), não só na interface.
10. **Dado financeiro sensível tem conferência humana.** Nada de baixa automática baseada em leitura de IA (mesma regra adotada na Plena para comprovantes).

## 8. Roadmap e questões em aberto

A ordem segue o caixa: primeiro o que fecha contrato, depois o que segura e expande o cliente, por último o que automatiza a gestão. Cada fase entra em uso real antes da próxima começar.

1. **Fundação:** schema base (account, contact, module, event), auth, RLS, catálogo de módulos com preços fixos.
2. **Cockpit de vendas + proposta viva:** captura SPIN/BANT, mapeamento dor → módulo, geração da página, tracking de `offer.viewed`, aceite.
3. **Projeto e portal:** esqueleto S0–S4+ automático no aceite, tasks, pendências do cliente, relógio pausado, progresso.
4. **Financeiro Fase A:** contratos, cobranças, pagamentos manuais, MRR, inadimplência, custo e margem por cliente.
5. **CRM interno e metas:** pipeline, registro de calls, motor de metas, funil reverso, capacidade.
6. **Resultado e recompensas:** placar de resultado vs projeção, tasks bloqueadas com upgrade, indicações.
7. **Financeiro Fase B:** integração Asaas com webhook e régua de cobrança.
8. **Saúde da conta:** health score, alertas de churn e de momento de upsell.

**Questões em aberto**

- [ ] Quais técnicas de venda entram no cockpit além de SPIN e BANT (5 A's, níveis de consciência, equação de valor) e em que ponto de cada call?
- [ ] Catálogo de módulos: quais módulos, quais preços e o que compõe cada um dos 3 tiers?
- [ ] O que exatamente está incluído no retainer de S4+?
- [ ] Taxas de conversão atuais do funil para calibrar o funil reverso.
- [ ] Quantas horas por semana Leoni tem de fato para a Sabre, descontando faculdade?
- [ ] O Logs é um app novo ou estende a base do Atrium/sabre-os?
- [ ] Domínio e marca do portal: visual Sabre para lead e cliente, visual interno para o admin?
- [ ] Cláusula de relógio pausado: redação no contrato padrão.
- [ ] Migração dos clientes atuais (Plena e outros) para o Logs: entram em S4+ direto?
