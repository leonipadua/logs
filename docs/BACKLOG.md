# BACKLOG — Sabre Logs

Itens deliberadamente fora da v1, com a razão de cada adiamento. Substitui o backlog do MVP: o que já foi absorvido pela v1 está registrado ao fim, para não ser reproposto.

Escopo da v1 em [PRD](./PRD.md) · sequência em [ROADMAP](./ROADMAP.md).

---

## Produto

**Comentários por task.** O cliente comentar numa etapa e o admin responder. Adiado porque abre um canal de suporte com expectativa de tempo de resposta que o operador único não consegue sustentar hoje. Reavaliar quando houver mais de uma pessoa na operação.

**Seção "aguardando você".** Etapas travadas por pendência do cliente (enviar acesso, aprovar texto). Exige um tipo de task com responsável e prazo, e um mecanismo de cobrança educada. Alto valor — provável primeiro item pós-v1. Hoje o campo `motivo_bloqueio` cobre o caso de forma passiva.

**Anexos de arquivo.** Contrato, relatório, print de resultado. Exige Supabase Storage, política de acesso própria, limite de tamanho e varredura de conteúdo. O volume atual não justifica.

**Exportação em PDF.** Relatório de progresso para o cliente enviar internamente. Depende de a timeline estar estável; refazer o layout em PDF antes disso é retrabalho garantido.

**Previsão automática de entrega.** Estimar a data de conclusão a partir do ritmo histórico. Precisa de histórico que ainda não existe. Na v1 o campo `projects.previsao_entrega` é preenchido pelo admin.

**Marketplace público de ofertas.** Catálogo navegável de capacidades da Sabre. Contradiz a decisão de que preço não é público e de que a oferta é curada por cliente. Só faz sentido se o modelo comercial mudar.

**Notificação por WhatsApp.** É onde os clientes de fato estão. Adiado porque exige API oficial, aprovação de template e um número dedicado — projeto próprio, não incremento.

---

## Interface

**Reordenação por drag-and-drop.** Campo numérico funciona e não bloqueia ninguém. Custa uma dependência e uma camada de estado que só o admin usaria.

**Adoção de shadcn/ui.** Avaliado e recusado para a v1: o default do shadcn empurra para a estética genérica que o [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) proíbe explicitamente. Primitivos acessíveis vêm do Radix puro, com estilo próprio.

**Seletor manual de tema.** Os tokens de tema claro e escuro existem desde a F0 e a preferência do sistema é respeitada. O controle explícito na interface é conveniência, não necessidade.

**Internacionalização.** Base de clientes 100% brasileira. Adicionar i18n agora é custo permanente sem benefício.

---

## Plataforma

**Múltiplos administradores Sabre.** O papel `admin` já é global e comporta mais de um usuário; o que falta é granularidade (quem vê o financeiro, quem só edita projeto). Implementar quando houver a segunda pessoa.

**Analytics de acesso ao painel.** Quem abriu, quando, o que olhou. Útil comercialmente, mas exige decisão de privacidade e aviso na política. A telemetria de oferta (impressão/clique/conversão) da v1 já cobre a pergunta mais importante.

**App nativo.** Web responsiva atende. Frequência de uso não justifica.

**Centralizar todas as entregas da Sabre no painel.** Visão do cliente sobre todos os produtos contratados, não só o onboarding. Depende de os outros agentes existirem e terem modelo de dados estável.

---

## Técnico

**Testes automatizados.** Não é adiamento indefinido: está na **F9** do roadmap, com escopo definido (Vitest para domínio, Playwright para os três fluxos críticos).

**Rotação do identificador público de projeto.** Item do backlog do MVP que **desapareceu por construção**: a v1 elimina o `public_id` e o acesso por link ofuscado. Registrado aqui apenas para fechar o assunto.

**Fila de jobs dedicada.** O digest de email e a varredura de cobranças rodam por cron da Vercel. Suficiente na escala atual. Migrar para Vercel Queues se o volume ou a necessidade de retry crescerem.

**Cache Components / `use cache`.** Avaliado e recusado na v1 ([ARCHITECTURE](./ARCHITECTURE.md) §2): quase todo dado é por usuário, o ganho é marginal e o risco de servir dado de uma organização no cache de outra é real.

**Insights financeiros e comerciais por IA** Adicionado apenas mais tarde por precisar de acesso à API.

---

## Absorvido pela v1 — não repropor

Itens do backlog do MVP que deixaram de ser backlog:

| Item do MVP | Onde foi parar |
|---|---|
| Notificações por email | E7 — sete templates, com digest |
| Multiusuário no admin | E1 — organizações com N usuários e papéis |
| Rotação do `public_id` | Eliminado: não há mais link ofuscado |
| Realtime escopado por projeto | F2 — canal filtrado por `project_id` |
| Upsell e cross-sell no painel | E3 — o mecanismo central da v1 |
