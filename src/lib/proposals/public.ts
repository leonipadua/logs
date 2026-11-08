import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  lerPremissas,
  premissasDoCustoEmTexto,
  propostaExpirada,
  type PremissasProposta,
} from "@/lib/domain/proposal";
import { projetarRoi, type ProjecaoRoi } from "@/lib/domain/roi";
import { montarVitrine, type TierVitrine } from "@/lib/domain/tiers";

/**
 * Leitura pública da proposta por token. Tudo via service_role + funções
 * security definer (proposta_por_token): não existe policy para anon. Só
 * devolve o que o lead pode ver — nunca BANT, notas de call, contatos ou
 * descrições de dores de outras propostas.
 */
export interface PropostaPublica {
  id: string;
  organizationId: string;
  organizacaoNome: string;
  titulo: string | null;
  status: "enviada" | "aceita";
  validadeAte: string | null;
  expirada: boolean;
  aceitaEm: string | null;
  tierEscolhidoId: string | null;
  tierSugeridoId: string | null;
  condicaoEscolhidaId: string | null;
  narrativa: {
    abertura: string;
    fechamento: string;
    itens: { moduleId: string; dor: string; texto: string; moduloNome: string }[];
  };
  premissas: PremissasProposta | null;
  premissasCustoTexto: string[];
  vitrine: TierVitrine[];
  condicoes: { id: string; nome: string; descricao: string | null; ajusteBps: number }[];
  /** ROI do tier alvo (projeção); null sem custo da dor. */
  roiPorTier: Record<string, ProjecaoRoi | null>;
}

interface RpcProposta {
  id: string;
  organization_id: string;
  organizacao_nome: string;
  titulo: string | null;
  status: string;
  tier_id: string | null;
  tier_sugerido_id: string | null;
  condicao_pagamento_id: string | null;
  premissas_roi: unknown;
  narrativa: unknown;
  validade_ate: string | null;
  aceita_em: string | null;
  itens: { module_id: string; pain_id: string | null; narrativa: string | null; ordem: number }[];
}

export async function carregarPropostaPublica(token: string): Promise<PropostaPublica | null> {
  if (!/^[a-f0-9]{32,128}$/.test(token)) return null;
  const admin = createAdminClient();

  const { data } = await admin.rpc("proposta_por_token", { p_token: token });
  const p = data as unknown as RpcProposta | null;
  if (!p || (p.status !== "enviada" && p.status !== "aceita")) return null;

  const [{ data: modulos }, { data: tiers }, { data: composicao }, { data: condicoes }] = await Promise.all([
    admin.from("modules").select("id, nome, descricao, ativo, preco_implementacao_centavos, mensalidade_centavos, horas_estimadas"),
    admin.from("tiers").select("id, ordem, nome, descricao, ativo"),
    admin.from("tier_modules").select("tier_id, module_id, ordem").order("ordem"),
    admin.from("payment_conditions").select("id, nome, descricao, ajuste_bps, ativo").eq("ativo", true).order("nome"),
  ]);

  const modulosPorId = new Map((modulos ?? []).map((m) => [m.id, m]));
  const idsDasDores = p.itens.map((i) => i.module_id);
  const vitrine = montarVitrine(
    (tiers ?? []).map((t) => ({
      ...t,
      moduleIds: (composicao ?? []).filter((c) => c.tier_id === t.id).map((c) => c.module_id),
    })),
    (modulos ?? []).map((m) => ({
      id: m.id,
      nome: m.nome,
      descricao: m.descricao,
      ativo: m.ativo,
      preco_implementacao_centavos: m.preco_implementacao_centavos,
      mensalidade_centavos: m.mensalidade_centavos,
      horas_estimadas: Number(m.horas_estimadas),
    })),
    idsDasDores,
  );

  const narrativaBruta = (p.narrativa ?? {}) as { abertura?: unknown; fechamento?: unknown; itens?: unknown };
  const itensNarr = Array.isArray(narrativaBruta.itens) ? (narrativaBruta.itens as Record<string, unknown>[]) : [];
  const itens = [...p.itens]
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => {
      const n = itensNarr.find((x) => x.moduleId === i.module_id);
      return {
        moduleId: i.module_id,
        dor: typeof n?.dor === "string" ? n.dor : "",
        texto: i.narrativa ?? (typeof n?.texto === "string" ? n.texto : ""),
        moduloNome: modulosPorId.get(i.module_id)?.nome ?? "Módulo",
      };
    });

  const premissas = lerPremissas(p.premissas_roi);
  const roiPorTier: Record<string, ProjecaoRoi | null> = {};
  for (const t of vitrine) {
    roiPorTier[t.id] = premissas
      ? projetarRoi(
          {
            custoMensalCentavos: premissas.custoMensalCentavos,
            recuperacao: premissas.recuperacao,
            horizonteMeses: premissas.horizonteMeses,
            implementacaoCentavos: t.preco.implementacaoCentavos,
            mensalidadeCentavos: t.preco.mensalidadeCentavos,
          },
          premissasDoCustoEmTexto(premissas),
        )
      : null;
  }

  return {
    id: p.id,
    organizationId: p.organization_id,
    organizacaoNome: p.organizacao_nome,
    titulo: p.titulo,
    status: p.status,
    validadeAte: p.validade_ate,
    expirada: propostaExpirada(p.validade_ate, p.status),
    aceitaEm: p.aceita_em,
    tierEscolhidoId: p.tier_id,
    tierSugeridoId: p.tier_sugerido_id,
    condicaoEscolhidaId: p.condicao_pagamento_id,
    narrativa: {
      abertura: typeof narrativaBruta.abertura === "string" ? narrativaBruta.abertura : "",
      fechamento: typeof narrativaBruta.fechamento === "string" ? narrativaBruta.fechamento : "",
      itens,
    },
    premissas,
    premissasCustoTexto: premissas ? premissasDoCustoEmTexto(premissas) : [],
    vitrine,
    condicoes: (condicoes ?? []).map((c) => ({ id: c.id, nome: c.nome, descricao: c.descricao, ajusteBps: c.ajuste_bps })),
    roiPorTier,
  };
}
