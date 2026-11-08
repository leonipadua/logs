import { describe, it, expect, vi } from "vitest";
import {
  ClaudeNarrativeProvider,
  CLAUDE_MODEL,
  TemplateNarrativeProvider,
  gerarNarrativa,
  getNarrativeProvider,
  validarNarrativa,
  type NarrativeInput,
} from "./index";

const input: NarrativeInput = {
  organizacaoNome: "Clínica Aurora",
  segmento: "clínica",
  cidade: "Recife",
  dores: [
    { painId: "p1", moduleId: "m1", moduloNome: "Agente de atendimento", moduloDescricao: "Provisório. Responde leads 24h.", tipoSpin: "problema", descricao: "Demoramos a responder" },
    { painId: "p2", moduleId: "m2", moduloNome: "Agenda automática", moduloDescricao: null, tipoSpin: "problema", descricao: "Muitos faltam" },
  ],
};

const boa = {
  abertura: "Montamos esta proposta a partir da nossa conversa sobre o atendimento da clínica.",
  itens: [
    { moduleId: "m1", texto: "O agente responde cada contato na hora e encaminha quem está pronto para agendar." },
    { moduleId: "m2", texto: "A agenda confirma e lembra cada paciente sem depender da recepção." },
  ],
  fechamento: "Os formatos abaixo cobrem o mesmo problema em profundidades diferentes.",
};

const resposta = (obj: unknown, ok = true) =>
  vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => ({ content: [{ type: "text", text: JSON.stringify(obj) }] }) }) as unknown as Response);

describe("TemplateNarrativeProvider", () => {
  it("gera um texto por módulo, sem chave de API", async () => {
    const out = await new TemplateNarrativeProvider().gerar(input);
    expect(out.origem).toBe("template");
    expect(out.itens.map((i) => i.moduleId)).toEqual(["m1", "m2"]);
    expect(out.itens[0].dor).toBe("Demoramos a responder");
    expect(out.itens[0].texto).not.toMatch(/Provisório/);
  });
  it("sem ANTHROPIC_API_KEY usa template; com chave usa Claude", () => {
    expect(getNarrativeProvider({}).nome).toBe("template");
    expect(getNarrativeProvider({ ANTHROPIC_API_KEY: "  " }).nome).toBe("template");
    expect(getNarrativeProvider({ ANTHROPIC_API_KEY: "sk-x" }).nome).toBe("claude");
  });
});

describe("validarNarrativa (IA nunca decide dinheiro/escopo)", () => {
  it("aceita saída limpa e mantém a dor capturada", () => {
    const v = validarNarrativa(boa, input)!;
    expect(v.origem).toBe("claude");
    expect(v.itens[0].dor).toBe("Demoramos a responder");
  });
  it.each([
    ["preço em reais", "Por apenas R$ 500 você resolve."],
    ["número", "Em 30 dias tudo funciona."],
    ["percentual", "Reduz perdas em boa parte por cento."],
    ["desconto", "Com desconto especial para você."],
    ["tier", "Recomendamos o plano Completo."],
    ["garantia", "Garantimos o resultado."],
  ])("rejeita %s", (_n, texto) => {
    const ruim = { ...boa, itens: [{ moduleId: "m1", texto }, boa.itens[1]] };
    expect(validarNarrativa(ruim, input)).toBeNull();
  });
  it("rejeita módulo fora do escopo, faltando ou duplicado", () => {
    expect(validarNarrativa({ ...boa, itens: [...boa.itens, { moduleId: "m9", texto: "Extra sem escopo." }] }, input)).toBeNull();
    expect(validarNarrativa({ ...boa, itens: [boa.itens[0]] }, input)).toBeNull();
    expect(validarNarrativa({ ...boa, itens: [boa.itens[0], boa.itens[0]] }, input)).toBeNull();
  });
  it("rejeita formato inválido", () => {
    expect(validarNarrativa(null, input)).toBeNull();
    expect(validarNarrativa({ abertura: "x" }, input)).toBeNull();
  });
});

describe("ClaudeNarrativeProvider", () => {
  it("chama a API Messages com o modelo e sem preço no prompt", async () => {
    const f = resposta(boa);
    const out = await new ClaudeNarrativeProvider("sk-test", f as unknown as typeof fetch).gerar(input);
    expect(out.origem).toBe("claude");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("sk-test");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(CLAUDE_MODEL);
    expect(body.model).toBe("claude-sonnet-5-5");
    expect(body.system).toMatch(/Nunca cite preço/);
    expect(body.messages[0].content).not.toMatch(/preco|centavos|tier/i);
  });
  it("saída reprovada lança; gerarNarrativa cai no template", async () => {
    const ruim = { ...boa, abertura: "Tudo por R$ 99." };
    const provider = new ClaudeNarrativeProvider("k", resposta(ruim) as unknown as typeof fetch);
    await expect(provider.gerar(input)).rejects.toThrow();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await gerarNarrativa(input, provider)).origem).toBe("template");
  });
  it("erro HTTP cai no template", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const provider = new ClaudeNarrativeProvider("k", resposta({}, false) as unknown as typeof fetch);
    expect((await gerarNarrativa(input, provider)).origem).toBe("template");
  });
});
