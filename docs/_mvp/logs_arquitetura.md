# Plataforma "Logs" - Arquitetura e Soluções

**Objetivo:** Entregar acesso aos clientes para acompanhamento do progresso de desenvolvimento dos agentes de IA durante a etapa de onboarding.
**Hospedagem:** Vercel (Gratuita)

## Alternativas de Banco de Dados (CRUD Completo)

Para evitar atualizações manuais no código (`git push`) e escalar a plataforma, as seguintes opções gratuitas se integram perfeitamente à Vercel:

### 1. O Caminho Robusto: Supabase (PostgreSQL)
O Supabase oferece um banco de dados PostgreSQL gratuito generoso, ideal para estruturar a base de um sistema escalável.
*   **Vantagem:** Permite deixar as tabelas preparadas para múltiplos clientes utilizando políticas de segurança no nível da linha (*Row Level Security - RLS*), garantindo que um cliente visualize exclusivamente suas próprias tarefas e agentes.
*   **Como funciona:** O front-end hospedado na Vercel faz chamadas via API diretamente para o Supabase para realizar as operações CRUD. Além disso, o Supabase já possui um sistema nativo de autenticação que pode ser implementado no futuro sem custos iniciais.

### 2. O Caminho Nativo: Vercel Postgres
A Vercel conta com um ecossistema próprio de banco de dados. O Vercel Postgres possui um plano "Hobby" gratuito que atende perfeitamente à operação inicial.
*   **Vantagem:** A gestão fica unificada no mesmo painel da aplicação (Vercel), dispensando a criação e configuração de contas em serviços externos.
*   **Como funciona:** As queries SQL são escritas diretamente nas Serverless Functions (ou Server Actions, caso utilize Next.js), conectando o front-end ao banco de forma nativa e otimizada.

### 3. O Caminho da Automação: Notion API + n8n
Se o objetivo for agilidade de entrega visual sem construir um back-end do zero, o Notion pode atuar como o banco de dados das tarefas.
*   **Vantagem:** O gerenciamento interno dos projetos continua sendo feito de forma visual (movendo cards em um kanban no Notion), sem esforço extra.
*   **Como funciona:** A aplicação na Vercel pode consumir a API do Notion em tempo real, ou um fluxo no n8n pode capturar as atualizações no Notion e enviar os dados para a Vercel via webhook. O cliente interage com a interface do *Logs*, mas a fonte da verdade permanece no Notion.

---

## Solução Temporária de Acesso (Sem Sistema de Login)

Para a fase inicial com os primeiros clientes, onde a configuração de um sistema de login tradicional (JWT, sessões, recuperação de senha) adicionaria complexidade desnecessária, utiliza-se a estratégia de **Rotas Dinâmicas Ofuscadas**.

*   **A Estratégia:** Em vez de uma tela de login tradicional, gera-se uma URL única contendo um UUID (um identificador alfanumérico aleatório) exclusivo para o cliente.
*   **Exemplo de Rota:** `seusite.vercel.app/onboarding/c8a7b9-22f1-4g5h-882a`
*   **Funcionamento:** A aplicação extrai o UUID da URL, consulta o banco de dados (Supabase, Vercel Postgres ou Notion) para verificar a qual cliente aquele ID pertence e, em seguida, renderiza exclusivamente as tarefas e o dashboard correspondentes.
*   **Segurança e Usabilidade:** Segue o mesmo princípio de compartilhamento de arquivos via link (como no Google Drive ou Notion). É um método seguro para o nível de sensibilidade dos dados de acompanhamento e remove completamente o atrito, pois o cliente não precisa criar senhas ou realizar cadastros.
