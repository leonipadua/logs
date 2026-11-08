import { ClaudeNarrativeProvider } from "./claude";
import { TemplateNarrativeProvider } from "./template";
import type { NarrativeInput, NarrativeOutput, NarrativeProvider } from "./types";

export type { NarrativeInput, NarrativeOutput, NarrativeProvider, DorNarrativa, ItemNarrativa } from "./types";
export { TemplateNarrativeProvider } from "./template";
export { ClaudeNarrativeProvider, CLAUDE_MODEL } from "./claude";
export { validarNarrativa } from "./validate";

/** Sem ANTHROPIC_API_KEY = template local. */
export function getNarrativeProvider(env: Record<string, string | undefined> = process.env): NarrativeProvider {
  const key = env.ANTHROPIC_API_KEY?.trim();
  return key ? new ClaudeNarrativeProvider(key) : new TemplateNarrativeProvider();
}

/** Gera a narrativa; qualquer falha do provider cai no template. Nunca lança. */
export async function gerarNarrativa(
  input: NarrativeInput,
  provider: NarrativeProvider = getNarrativeProvider(),
): Promise<NarrativeOutput> {
  try {
    return await provider.gerar(input);
  } catch (e) {
    console.error("[narrative] provider falhou, usando template:", e instanceof Error ? e.message : e);
    return new TemplateNarrativeProvider().gerar(input);
  }
}
