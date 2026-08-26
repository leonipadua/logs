# Documentação — Sabre Logs v1

Especificação da versão definitiva do Sabre Logs. **Nada aqui foi implementado ainda** — estes documentos são o pilar para a construção.

## Por onde começar

| Documento | O que responde | Leia se… |
|---|---|---|
| **[PRD](./PRD.md)** | O que estamos construindo e por quê. Personas, épicos, fluxos, critérios de aceite | …você vai fazer qualquer coisa. É o documento pilar |
| **[ROADMAP](./ROADMAP.md)** | Em que ordem construir, e o que bloqueia o quê | …você vai começar a implementar |
| **[ARCHITECTURE](./ARCHITECTURE.md)** | Stack, estrutura de pastas, camadas de abstração, padrões | …você vai escrever código |
| **[DATA_MODEL](./DATA_MODEL.md)** | Esquema do banco e todas as políticas RLS | …você vai mexer no banco |
| **[DESIGN_SYSTEM](./DESIGN_SYSTEM.md)** | Tokens, tipografia, componentes, o que é proibido | …você vai desenhar ou construir tela |
| **[SECURITY](./SECURITY.md)** | Segredos, RLS, autenticação, cabeçalhos, LGPD | …antes de qualquer deploy |
| **[INTEGRATIONS](./INTEGRATIONS.md)** | Contrato de Supabase, Resend, Asaas, Google OAuth, e as variáveis de ambiente | …você vai plugar serviço externo |
| **[BACKLOG](./BACKLOG.md)** | O que ficou de fora e por quê | …você acha que faltou alguma coisa |

`_mvp/` guarda a documentação da primeira versão, apenas como registro histórico. Não use como referência.

## Decisões estruturais, em uma tabela

| Tema | Decisão |
|---|---|
| Acesso do cliente | Conta própria com login. O link ofuscado `/p/<uuid>` é descontinuado |
| Cadastro | Só por convite do admin. Senha temporária por email + troca obrigatória |
| Multi-tenant | Organização com N usuários (`owner` / `member`); `admin` global da Sabre |
| Escrita | Exclusiva do admin. O cliente lê |
| Gamificação | Ofertas trancadas ao fim da timeline, no máximo 3, curadas e precificadas pelo admin |
| Pagamento | Asaas, atrás de interface abstrata. Assinatura mensal (aceita R$ 0) + desbloqueio avulso |
| Email | Resend, atrás de interface abstrata. Adaptador de console em desenvolvimento |
| Visual | Editorial / fintech premium. Claro por padrão, serifada nos títulos, tabulares em todo número |
| Código do MVP | Repositório mantido, `src/` reescrito, visual não herdado |

## Três coisas que precisam de atenção antes de tudo

1. **[BLOQUEANTE] Credenciais expostas.** `.env.example` está commitado com `service_role`, senha de admin e `SESSION_SECRET`. Rotacionar antes de qualquer outra coisa — [SECURITY](./SECURITY.md) §1.
2. **A RLS é a fronteira de segurança**, não a query. O modelo atual (`using (true)` para `anon`) deixa todo projeto legível por quem tiver a chave anônima, que está no bundle público.
3. **Nenhuma conta externa é necessária até a F7.** Asaas e Google OAuth ficam na F8; o produto inteiro é construído e demonstrável com adaptadores locais.

## Pendente com o Leoni

| Pendência | Destrava |
|---|---|
| Rotacionar as chaves do Supabase | F0 — tudo |
| Conta Resend + domínio verificado | F6 (emails reais) |
| Razão social, CNPJ, endereço, email do encarregado | F7 (privacidade e termos) |
| Conta Asaas + chave sandbox | F8 (pagamento real) |
| Projeto no Google Cloud Console | F8 (OAuth) |
