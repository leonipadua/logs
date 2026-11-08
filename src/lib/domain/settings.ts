/**
 * Configurações do Logs (tabela `settings`, chave -> jsonb). O PRD deixa
 * várias questões em aberto (capacidade, horas, vigência): nada é fixo no
 * código — os valores abaixo são só o fallback quando a linha não existe.
 */

export interface SettingDef {
  chave: string;
  label: string;
  hint: string;
  padrao: number;
  min: number;
  max: number;
  step: number;
  inteiro: boolean;
}

export const SETTING_DEFS = [
  { chave: "capacidade_max_projetos", label: "Capacidade: projetos simultâneos em S0–S3", hint: "Acima disso, o próximo aceite entra na fila com data de início.", padrao: 2, min: 1, max: 20, step: 1, inteiro: true },
  { chave: "horas_semana_disponiveis", label: "Horas por semana disponíveis", hint: "Provisório: horas reais que a Sabre tem por semana.", padrao: 20, min: 1, max: 168, step: 0.5, inteiro: false },
  { chave: "vigencia_minima_meses", label: "Vigência mínima do contrato (meses)", hint: "Padrão dos novos contratos.", padrao: 6, min: 1, max: 60, step: 1, inteiro: true },
  { chave: "proposta_validade_dias", label: "Validade da proposta (dias)", hint: "Provisório: prazo após o envio.", padrao: 15, min: 1, max: 90, step: 1, inteiro: true },
  { chave: "prazo_pendencia_cliente_dias", label: "Prazo das pendências do cliente (D+N)", hint: "Pendência vencida pausa o relógio do projeto.", padrao: 3, min: 0, max: 30, step: 1, inteiro: true },
] as const satisfies readonly SettingDef[];

export type SettingKey = (typeof SETTING_DEFS)[number]["chave"];
export type SettingsValues = Record<SettingKey, number>;

export const SETTING_KEYS = SETTING_DEFS.map((d) => d.chave) as SettingKey[];

export function defaultSettings(): SettingsValues {
  return Object.fromEntries(SETTING_DEFS.map((d) => [d.chave, d.padrao])) as SettingsValues;
}

/** Valida um valor cru contra a definição; retorna número ou mensagem de erro. */
export function validarSetting(def: SettingDef, bruto: unknown): { ok: true; valor: number } | { ok: false; erro: string } {
  const texto = typeof bruto === "string" ? bruto.trim().replace(",", ".") : bruto;
  if (texto === "" || texto === null || texto === undefined) return { ok: false, erro: "Informe um valor." };
  const n = Number(texto);
  if (!Number.isFinite(n)) return { ok: false, erro: "Informe um número válido." };
  if (def.inteiro && !Number.isInteger(n)) return { ok: false, erro: "Use um número inteiro." };
  if (n < def.min || n > def.max) return { ok: false, erro: `Use um valor entre ${def.min} e ${def.max}.` };
  return { ok: true, valor: n };
}

/** Mescla linhas do banco sobre os padrões, ignorando valores inválidos. */
export function mesclarSettings(linhas: { chave: string; valor: unknown }[]): SettingsValues {
  const out = defaultSettings();
  for (const l of linhas) {
    const def = SETTING_DEFS.find((d) => d.chave === l.chave);
    if (!def) continue;
    const r = validarSetting(def, l.valor);
    if (r.ok) out[def.chave] = r.valor;
  }
  return out;
}

/** Capacidade: livre = max - ocupados (nunca negativo); cheia => próximo aceite vai pra fila. */
export function calcularCapacidade(max: number, ocupados: number) {
  const livre = Math.max(0, max - ocupados);
  return { max, ocupados, livre, cheia: livre === 0 };
}
