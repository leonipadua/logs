/** Datas de calendário como "YYYY-MM-DD" (UTC), sem depender do fuso do servidor. */

const MS_DIA = 86_400_000;

export function paraISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  return paraISO(new Date(d.getTime() + dias * MS_DIA));
}

/** Dias inteiros entre dois instantes (nunca negativo). */
export function diasEntre(de: Date | string, ate: Date | string): number {
  const a = typeof de === "string" ? new Date(de) : de;
  const b = typeof ate === "string" ? new Date(ate) : ate;
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / MS_DIA));
}

export function maxData(a: string, b: string): string {
  return a >= b ? a : b;
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}
