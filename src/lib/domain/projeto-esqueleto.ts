/**
 * Esqueleto automático S0–S4+ (PRD §4), gerado no aceite da proposta.
 * Puro: devolve o plano (sprints + tasks); quem grava é src/lib/projects.
 */
import { somarDias, slugify } from "./datas";
import { comporDescricaoSprint, semanaDaEtapa, type Etapa } from "./sprint";

export type DonoTask = "sabre" | "cliente";
export type CategoriaTask = "dado" | "acesso" | "aprovacao" | "outro";

interface TarefaModelo {
  titulo: string;
  descricao?: string;
  dono: DonoTask;
  categoria?: CategoriaTask;
  /** Já nasce concluída (ex.: contrato assinado no aceite). */
  concluida?: boolean;
}

interface EtapaModelo {
  etapa: Etapa;
  titulo: string;
  objetivo: string;
  criterioPronto: string;
  dependeDoCliente: string;
  tasks: TarefaModelo[];
}

export const ESQUELETO_PADRAO: readonly EtapaModelo[] = [
  {
    etapa: "S0",
    titulo: "S0 · Pré-kickoff",
    objetivo: "Contrato e terreno prontos.",
    criterioPronto: "Pagamento confirmado e kickoff marcado.",
    dependeDoCliente: "Assinar e pagar.",
    tasks: [
      { titulo: "Contrato assinado", dono: "sabre", concluida: true },
      { titulo: "Primeira cobrança paga", dono: "cliente", categoria: "outro" },
      { titulo: "Checklist de onboarding enviado", dono: "sabre", concluida: true },
      { titulo: "Kickoff agendado", dono: "sabre" },
    ],
  },
  {
    etapa: "S1",
    titulo: "S1 · Onboarding de dados",
    objetivo: "Preparar o terreno.",
    criterioPronto: "Todos os acessos validados e estratégia aprovada pelo cliente.",
    dependeDoCliente: "Entregar dados e acessos até D+3.",
    tasks: [
      { titulo: "Entregar dados internos", descricao: "Planilhas, tabelas de preço, scripts de atendimento e o que o time usa hoje.", dono: "cliente", categoria: "dado" },
      { titulo: "Liberar acesso ao Google Calendar", dono: "cliente", categoria: "acesso" },
      { titulo: "Liberar acesso à Meta (anúncios e WhatsApp Business)", dono: "cliente", categoria: "acesso" },
      { titulo: "Liberar acesso ao CRM", dono: "cliente", categoria: "acesso" },
      { titulo: "Validar acessos e APIs", dono: "sabre" },
      { titulo: "Modelar o banco de dados", dono: "sabre" },
      { titulo: "Definir a estratégia de execução dos agentes", dono: "sabre" },
      { titulo: "Aprovar a estratégia de execução", dono: "cliente", categoria: "aprovacao" },
    ],
  },
  {
    etapa: "S2",
    titulo: "S2 · Construção",
    objetivo: "Agentes e sistema funcionando.",
    criterioPronto: "Fluxo principal rodando com dado real em ambiente de teste.",
    dependeDoCliente: "Testar e dar feedback.",
    tasks: [
      { titulo: "Desenvolver e treinar os agentes", dono: "sabre" },
      { titulo: "Integrar o MLP do sistema (CRM ou outro)", dono: "sabre" },
      { titulo: "Rodar o fluxo principal com dado real em teste", dono: "sabre" },
      { titulo: "Testar e dar feedback", dono: "cliente", categoria: "aprovacao" },
    ],
  },
  {
    etapa: "S3",
    titulo: "S3 · Entrega",
    objetivo: "Escopo completo em produção.",
    criterioPronto: "Checklist de escopo 100% e aceite formal do cliente.",
    dependeDoCliente: "Aceite.",
    tasks: [
      { titulo: "Ajustes finais", dono: "sabre" },
      { titulo: "Sistema em produção", dono: "sabre" },
      { titulo: "Treinamento de uso", dono: "sabre" },
      { titulo: "Aceite formal do escopo", dono: "cliente", categoria: "aprovacao" },
    ],
  },
  etapaS4(),
];

function etapaS4(): EtapaModelo {
  return {
    etapa: "S4",
    titulo: "S4+ · Otimização",
    objetivo: "Melhorar o resultado até o fim do contrato.",
    criterioPronto: "Relatório do ciclo publicado no portal.",
    dependeDoCliente: "Usar o sistema.",
    tasks: [
      { titulo: "Ciclo de ajustes", dono: "sabre" },
      { titulo: "Relatório de resultado vs projeção publicado", dono: "sabre" },
    ],
  };
}

export interface ModuloDoCatalogo {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface ModuloBloqueado extends ModuloDoCatalogo {
  tierId: string;
  tierNome: string;
}

export interface TaskPlano {
  titulo: string;
  slug: string;
  descricao: string | null;
  dono: DonoTask;
  categoria: CategoriaTask | null;
  status: "pendente" | "concluida" | "bloqueada";
  prazo: string | null;
  ordem: number;
  module_id: string | null;
  bloqueada_por_tier_id: string | null;
  motivo_bloqueio: string | null;
}

export interface SprintPlano {
  etapa: Etapa;
  titulo: string;
  descricao: string;
  criterio_pronto: string;
  ordem: number;
  status: "pendente" | "em_andamento";
  inicio_previsto: string;
  fim_previsto: string;
  tasks: TaskPlano[];
}

export interface EntradaEsqueleto {
  /** Data de início do projeto (já considera a fila). */
  inicio: string;
  /** Falso quando o projeto entra na fila: S0 só começa na promoção. */
  iniciarS0: boolean;
  modulosIncluidos: ModuloDoCatalogo[];
  modulosBloqueados: ModuloBloqueado[];
}

function slugUnico(titulo: string, usados: Set<string>): string {
  const base = slugify(titulo) || "task";
  let slug = base;
  for (let n = 2; usados.has(slug); n++) slug = `${base}-${n}`;
  usados.add(slug);
  return slug;
}

function tasksDaEtapa(modelo: EtapaModelo, entrada: EntradaEsqueleto): TaskPlano[] {
  const usados = new Set<string>();
  const tasks: TaskPlano[] = [];
  const push = (t: Omit<TaskPlano, "slug" | "ordem">) =>
    tasks.push({ ...t, slug: slugUnico(t.titulo, usados), ordem: tasks.length });

  for (const m of modelo.tasks) {
    push({
      titulo: m.titulo,
      descricao: m.descricao ?? null,
      dono: m.dono,
      categoria: m.categoria ?? null,
      status: m.concluida ? "concluida" : "pendente",
      prazo: null,
      module_id: null,
      bloqueada_por_tier_id: null,
      motivo_bloqueio: null,
    });
  }

  if (modelo.etapa === "S2") {
    for (const m of entrada.modulosIncluidos) {
      push({
        titulo: `Construir: ${m.nome}`,
        descricao: m.descricao,
        dono: "sabre",
        categoria: null,
        status: "pendente",
        prazo: null,
        module_id: m.id,
        bloqueada_por_tier_id: null,
        motivo_bloqueio: null,
      });
    }
    // Módulos de tiers acima: aparecem no portal com o ganho potencial e o upgrade.
    for (const m of entrada.modulosBloqueados) {
      push({
        titulo: `Construir: ${m.nome}`,
        descricao: m.descricao,
        dono: "sabre",
        categoria: null,
        status: "bloqueada",
        prazo: null,
        module_id: m.id,
        bloqueada_por_tier_id: m.tierId,
        motivo_bloqueio: `Disponível no plano ${m.tierNome}`,
      });
    }
  }
  return tasks;
}

/** Cada sprint dura 7 dias a partir do início; S4+ começa depois de S3. */
export function montarEsqueleto(entrada: EntradaEsqueleto): SprintPlano[] {
  return ESQUELETO_PADRAO.map((modelo, ordem) => {
    const semana = semanaDaEtapa(modelo.etapa);
    const inicio = somarDias(entrada.inicio, semana * 7);
    return {
      etapa: modelo.etapa,
      titulo: modelo.titulo,
      descricao: comporDescricaoSprint(modelo.objetivo, modelo.dependeDoCliente),
      criterio_pronto: modelo.criterioPronto,
      ordem,
      status: modelo.etapa === "S0" && entrada.iniciarS0 ? "em_andamento" : "pendente",
      inicio_previsto: inicio,
      fim_previsto: somarDias(inicio, 6),
      tasks: tasksDaEtapa(modelo, entrada),
    };
  });
}

/** Próximo ciclo de S4+ (criado ao fechar o anterior). */
export function montarCicloS4(inicio: string, ordem: number): SprintPlano {
  const modelo = etapaS4();
  const entrada: EntradaEsqueleto = { inicio, iniciarS0: false, modulosIncluidos: [], modulosBloqueados: [] };
  return {
    etapa: "S4",
    titulo: modelo.titulo,
    descricao: comporDescricaoSprint(modelo.objetivo, modelo.dependeDoCliente),
    criterio_pronto: modelo.criterioPronto,
    ordem,
    status: "em_andamento",
    inicio_previsto: inicio,
    fim_previsto: somarDias(inicio, 6),
    tasks: tasksDaEtapa(modelo, entrada),
  };
}

/** Prazo (D+N) das pendências do cliente, definido quando a sprint começa. */
export function prazoDasPendenciasNoInicio(inicio: string, prazoDias: number): string {
  return somarDias(inicio, prazoDias);
}
