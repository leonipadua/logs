/**
 * Agregação pura do digest de tasks concluídas (E7 M3). O cron lê as linhas
 * e delega a estas funções a decisão de "quem recebe o quê", para que a
 * regra "marcar 5 tasks em 2 minutos gera 1 email" seja testável sem banco.
 */

type Relacao<T> = T | T[] | null | undefined;

function primeiro<T>(rel: Relacao<T>): T | undefined {
  return Array.isArray(rel) ? rel[0] : (rel ?? undefined);
}

export interface TaskConcluidaParaDigest {
  id: string;
  phases: Relacao<{ project_id: string }>;
}

/**
 * Agrupa os ids das tasks concluídas por projeto. Tasks sem fase associada
 * são ignoradas. A ordem de inserção das chaves segue a ordem das tasks.
 */
export function agruparTaskIdsPorProjeto(
  tasks: TaskConcluidaParaDigest[],
): Map<string, string[]> {
  const porProjeto = new Map<string, string[]>();
  for (const task of tasks) {
    const fase = primeiro(task.phases);
    if (!fase) continue;
    const lista = porProjeto.get(fase.project_id) ?? [];
    lista.push(task.id);
    porProjeto.set(fase.project_id, lista);
  }
  return porProjeto;
}

export interface MembroParaDigest {
  profiles: Relacao<{ email: string; notificar_task_concluida: boolean }>;
}

/**
 * Emails dos membros que NÃO optaram por sair do M3. Membros sem perfil, sem
 * email ou com opt-out são descartados; duplicatas são removidas.
 */
export function destinatariosDoDigest(membros: MembroParaDigest[]): string[] {
  const emails = new Set<string>();
  for (const membro of membros) {
    const perfil = primeiro(membro.profiles);
    if (perfil?.notificar_task_concluida && perfil.email) {
      emails.add(perfil.email);
    }
  }
  return [...emails];
}
