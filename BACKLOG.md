# Backlog — pós-MVP

Itens deliberadamente fora do escopo do `PRD.md` para priorizar entrega rápida. Retomar depois que o MVP estiver no ar.

- **Comentários por tarefa** — notas de progresso do operador visíveis ao cliente em cada tarefa. Adiado: o status já comunica o essencial; comentários são um refinamento de comunicação, não bloqueiam o uso.
- **Seção de pendências do cliente** — destaque de itens que dependem de ação do cliente (acessos, aprovações, conteúdo). Adiado: útil, mas exige modelagem própria (tipo de tarefa "aguardando cliente") que pode vir depois da timeline básica funcionar.
- **Notificações por e-mail** — avisar o cliente quando uma tarefa muda de status. Adiado: exige serviço de e-mail transacional (Resend, etc.) e templates; o cliente pode simplesmente checar o link.
- **Upload de anexos** — arquivos ligados a tarefas/fases. Adiado: exige Supabase Storage, políticas de acesso e UI de upload — não essencial para visualizar progresso.
- **Multiusuário no admin** — mais de um operador com login próprio. Adiado: hoje só a Sabre (Leoni) opera; senha única resolve.
- **Previsão de entrega automática** — estimativa de data de conclusão baseada em velocidade histórica. Adiado: precisa de dados históricos que ainda não existem.
- **Exportar PDF** — gerar relatório de progresso em PDF. Adiado: nice-to-have, o link já serve como "relatório vivo".
- **Reordenação drag-and-drop** — hoje resolvido via campo numérico de `ordem`, mais simples de implementar.
- **Rotação de `public_id`** — permitir invalidar e gerar um novo link caso o UUID vaze. Adiado: risco baixo no MVP, mas deve ser adicionado antes de escalar para muitos clientes.
- **Testes automatizados** — suíte de testes (unitários/E2E). Adiado: MVP validado manualmente primeiro; adicionar testes ao estabilizar o modelo de dados.
- **Analytics de acesso** — saber quando/quantas vezes o cliente abriu o link. Adiado: métrica interessante para a Sabre, mas não bloqueia o valor entregue ao cliente.
- **shadcn/ui** — biblioteca de componentes formal. Adiado: os componentes já foram construídos diretamente em Tailwind seguindo as diretrizes de design premium/dark do PRD; trocar por shadcn depois é refino de DX, não funcionalidade.
- **Escopo do canal Realtime** — hoje o cliente escuta mudanças em `tasks`/`phases` sem filtrar por projeto (baixo volume de tráfego no MVP). Adiado: refinar o filtro do canal por `project_id` quando houver mais clientes simultâneos.
