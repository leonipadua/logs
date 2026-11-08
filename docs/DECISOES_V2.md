# Decisões de execução do PRD Logs v2

Fonte: `docs/PRD_LOGS_V2.md`. Decisões tomadas com Leoni em 2026-11-08:

1. **Estender** o código existente (F0–F9). Mapeamento PRD → tabelas:
   - `account` = `organizations` (ganha segmento, cidade, estágio, saúde, asaas_customer_id)
   - `sprint` = `phases` (ganha etapa S0..S4+, critério de pronto)
   - `task` = `tasks` existente (ganha dono sabre|cliente, prazo, bloqueada_por_tier)
   - `offer` do PRD (proposta) = nova tabela `proposals` (a `offers` existente é a oferta trancada de upsell; não renomear)
   - `project`/`contract` do PRD: `projects` existente + nova `contracts`
2. **Escopo desta rodada:** roadmap fases 1–3 (Fundação; Cockpit + Proposta viva; Projeto + Portal).
3. **Catálogo e tiers:** seed PLACEHOLDER editável, marcado como provisório. Capacidade configurável (padrão 2 projetos em S0–S3).
4. **IA:** interface `NarrativeProvider`; padrão = template local; Claude API plugável via `ANTHROPIC_API_KEY`. IA nunca define preço/escopo/tier/desconto.
5. Questões em aberto do PRD (§8) seguem abertas; usar configuração, não valores fixos no código.
