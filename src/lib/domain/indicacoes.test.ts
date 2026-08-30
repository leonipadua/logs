import { describe, it, expect } from "vitest";
import {
  formatarEntregaveis,
  gerarTokenIndicacao,
  montarMensagemWhatsApp,
  montarUrlWhatsApp,
  ofertaProntaParaVitrine,
  ordenarVitrine,
  parseEntregaveis,
} from "./indicacoes";

describe("token de indicação", () => {
  it("é seguro para URL (sem +, / ou =)", () => {
    for (let i = 0; i < 50; i++) {
      expect(gerarTokenIndicacao()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("não repete entre chamadas", () => {
    const tokens = new Set(Array.from({ length: 200 }, gerarTokenIndicacao));
    expect(tokens.size).toBe(200);
  });
});

describe("mensagem de WhatsApp", () => {
  it("cita a oferta e quem indicou", () => {
    expect(montarMensagemWhatsApp({ nomeIndicador: "Padaria do João", tituloOferta: "Site institucional" })).toBe(
      'Olá! Vim pela indicação de Padaria do João e quero saber mais sobre "Site institucional".',
    );
  });

  it("cai na versão genérica quando o lead vem da vitrine, sem oferta", () => {
    const msg = montarMensagemWhatsApp({ nomeIndicador: "Padaria do João" });
    expect(msg).toContain("Padaria do João");
    expect(msg).not.toContain('"');
  });

  it("trata null como ausência de oferta", () => {
    expect(montarMensagemWhatsApp({ nomeIndicador: "Ana", tituloOferta: null })).toBe(
      montarMensagemWhatsApp({ nomeIndicador: "Ana" }),
    );
  });

  it("escapa acentos e aspas ao montar a URL", () => {
    const url = montarUrlWhatsApp("5575991027940", 'Olá! "Site"');
    expect(url.startsWith("https://wa.me/5575991027940?text=")).toBe(true);
    expect(url).not.toContain(" ");
    expect(url).not.toContain('"');
    expect(decodeURIComponent(url.split("?text=")[1])).toBe('Olá! "Site"');
  });
});

describe("ordenação da vitrine", () => {
  it("respeita a ordem definida pelo admin", () => {
    const ordenado = ordenarVitrine([
      { ordem: 2, titulo: "B" },
      { ordem: 1, titulo: "C" },
      { ordem: 0, titulo: "A" },
    ]);
    expect(ordenado.map((o) => o.titulo)).toEqual(["A", "C", "B"]);
  });

  it("desempata alfabeticamente quando todos estão em 0", () => {
    const ordenado = ordenarVitrine([
      { ordem: 0, titulo: "Zap" },
      { ordem: 0, titulo: "Automação" },
      { ordem: 0, titulo: "Órfão" },
    ]);
    expect(ordenado.map((o) => o.titulo)).toEqual(["Automação", "Órfão", "Zap"]);
  });

  it("não muta o array recebido", () => {
    const original = [
      { ordem: 2, titulo: "B" },
      { ordem: 1, titulo: "A" },
    ];
    ordenarVitrine(original);
    expect(original.map((o) => o.titulo)).toEqual(["B", "A"]);
  });
});

describe("prontidão da oferta para a vitrine", () => {
  it("exige resumo e descrição públicos preenchidos", () => {
    expect(ofertaProntaParaVitrine({ resumo_publico: "Resumo", descricao_publica: "Texto" })).toBe(true);
  });

  it("recusa campos ausentes ou só com espaços", () => {
    expect(ofertaProntaParaVitrine({ resumo_publico: "Resumo", descricao_publica: null })).toBe(false);
    expect(ofertaProntaParaVitrine({ resumo_publico: "   ", descricao_publica: "Texto" })).toBe(false);
    expect(ofertaProntaParaVitrine({})).toBe(false);
  });
});

describe("entregáveis", () => {
  it("quebra o textarea em itens, ignorando linhas vazias", () => {
    expect(parseEntregaveis("Site de 5 páginas\n\nHospedagem\n  Suporte  \n")).toEqual([
      "Site de 5 páginas",
      "Hospedagem",
      "Suporte",
    ]);
  });

  it("remove os marcadores que o admin cola junto", () => {
    expect(parseEntregaveis("- Site\n• Domínio\n* SSL")).toEqual(["Site", "Domínio", "SSL"]);
  });

  it("texto vazio vira lista vazia", () => {
    expect(parseEntregaveis("   \n\n ")).toEqual([]);
  });

  it("formatar e parsear é ida e volta", () => {
    const itens = ["Site de 5 páginas", "Hospedagem por 12 meses"];
    expect(parseEntregaveis(formatarEntregaveis(itens))).toEqual(itens);
  });
});
