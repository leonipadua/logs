import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guarda da regra inviolável PRD §7.1: não pode existir campo de preço livre
 * em proposals / proposal_items. Falha se alguém adicionar coluna de valor.
 */
const sql = readFileSync(resolve(__dirname, "../../../supabase/migrations/0013_logs_v2_fundacao.sql"), "utf8");

function corpoDaTabela(nome: string): string {
  const m = sql.match(new RegExp(`create table public\\.${nome} \\(([\\s\\S]*?)\\n\\);`));
  if (!m) throw new Error(`tabela ${nome} não encontrada na migration`);
  return m[1];
}

describe("regra: preço só vem do catálogo", () => {
  for (const tabela of ["proposals", "proposal_items"]) {
    it(`${tabela} não tem coluna de preço/valor/desconto`, () => {
      const colunas = corpoDaTabela(tabela)
        .split("\n")
        .map((l) => l.trim().match(/^([a-z_]+)\s/)?.[1])
        .filter((c): c is string => Boolean(c) && !["constraint", "check"].includes(c as string));
      const proibidas = colunas.filter((c) => /preco|valor|price|desconto|amount|total|centavos/.test(c));
      expect(proibidas).toEqual([]);
    });
  }

  it("contratos de proposta têm trigger de preço do catálogo", () => {
    expect(sql).toMatch(/create trigger contracts_preco_do_catalogo/);
  });

  it("nenhuma policy libera anon com using(true)", () => {
    expect(sql).not.toMatch(/to anon[\s\S]{0,80}using\s*\(\s*true\s*\)/i);
  });
});
