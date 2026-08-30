"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { registrarAuditoria } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarTokenIndicacao } from "@/lib/domain/indicacoes";
import {
  alternarLinkSchema,
  alternarOfertaVitrineSchema,
  criarLinkIndicacaoSchema,
  excluirLinkSchema,
  reordenarOfertaVitrineSchema,
} from "@/lib/validation/indicacoes";
import type { FormState } from "./form-state";

function erroDeCampos(parsed: { error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }): FormState {
  const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
  return { errors: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])) };
}

export async function criarLinkIndicacaoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = criarLinkIndicacaoSchema.safeParse({
    organizationId: formData.get("organizationId"),
    nome: formData.get("nome"),
  });
  if (!parsed.success) return erroDeCampos(parsed);

  const admin = createAdminClient();

  // O token é curto de propósito (link colável no WhatsApp), então a colisão,
  // embora improvável, é tratada em vez de virar erro para o admin.
  let linkId: string | null = null;
  for (let tentativa = 0; tentativa < 5 && !linkId; tentativa++) {
    const { data, error } = await admin
      .from("referral_links")
      .insert({
        organization_id: parsed.data.organizationId,
        nome: parsed.data.nome,
        token: gerarTokenIndicacao(),
      })
      .select("id")
      .single();

    if (!error) linkId = data.id;
    else if (!error.message.includes("referral_links_token_key")) {
      return { message: "Não foi possível criar o link. Confira a organização escolhida." };
    }
  }
  if (!linkId) return { message: "Não foi possível gerar um token único. Tente de novo." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "criar_link_indicacao",
    entidade: "referral_links",
    entidadeId: linkId,
    depois: { organizationId: parsed.data.organizationId, nome: parsed.data.nome },
  });

  revalidatePath("/admin/indicacoes");
  return { success: true };
}

/** O toggle "aparece nesta vitrine" de cada card de oferta. */
export async function alternarOfertaVitrineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = alternarOfertaVitrineSchema.safeParse({
    referralLinkId: formData.get("referralLinkId"),
    offerId: formData.get("offerId"),
    selecionar: formData.get("selecionar"),
  });
  if (!parsed.success) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { referralLinkId, offerId } = parsed.data;

  if (parsed.data.selecionar === "1") {
    // Entra no fim da vitrine: maior ordem atual + 1.
    const { data: ultima } = await admin
      .from("referral_link_offers")
      .select("ordem")
      .eq("referral_link_id", referralLinkId)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await admin
      .from("referral_link_offers")
      .insert({ referral_link_id: referralLinkId, offer_id: offerId, ordem: (ultima?.ordem ?? -1) + 1 });
    if (error) return { message: "Não foi possível adicionar a oferta à vitrine." };
  } else {
    const { error } = await admin
      .from("referral_link_offers")
      .delete()
      .eq("referral_link_id", referralLinkId)
      .eq("offer_id", offerId);
    if (error) return { message: "Não foi possível remover a oferta da vitrine." };
  }

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: parsed.data.selecionar === "1" ? "adicionar_oferta_vitrine" : "remover_oferta_vitrine",
    entidade: "referral_link_offers",
    entidadeId: referralLinkId,
    depois: { offerId },
  });

  revalidatePath(`/admin/indicacoes/${referralLinkId}`);
  return { success: true };
}

export async function reordenarOfertaVitrineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = reordenarOfertaVitrineSchema.safeParse({
    referralLinkId: formData.get("referralLinkId"),
    offerId: formData.get("offerId"),
    ordem: formData.get("ordem"),
  });
  if (!parsed.success) return erroDeCampos(parsed);

  const admin = createAdminClient();
  const { error } = await admin
    .from("referral_link_offers")
    .update({ ordem: parsed.data.ordem })
    .eq("referral_link_id", parsed.data.referralLinkId)
    .eq("offer_id", parsed.data.offerId);
  if (error) return { message: "Não foi possível reordenar." };

  revalidatePath(`/admin/indicacoes/${parsed.data.referralLinkId}`);
  return { success: true };
}

export async function alternarLinkAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = alternarLinkSchema.safeParse({
    referralLinkId: formData.get("referralLinkId"),
    ativar: formData.get("ativar"),
  });
  if (!parsed.success) return { message: "Dados inválidos." };

  const ativo = parsed.data.ativar === "1";
  const admin = createAdminClient();
  const { error } = await admin
    .from("referral_links")
    .update({ ativo })
    .eq("id", parsed.data.referralLinkId);
  if (error) return { message: "Não foi possível alterar o link." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: ativo ? "reativar_link_indicacao" : "desativar_link_indicacao",
    entidade: "referral_links",
    entidadeId: parsed.data.referralLinkId,
  });

  revalidatePath("/admin/indicacoes");
  revalidatePath(`/admin/indicacoes/${parsed.data.referralLinkId}`);
  return { success: true, message: ativo ? "Link reativado." : "Link desativado — quem abrir agora vê uma página de erro." };
}

export async function excluirLinkAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessao = await requireAdmin();

  const parsed = excluirLinkSchema.safeParse({ referralLinkId: formData.get("referralLinkId") });
  if (!parsed.success) return { message: "Dados inválidos." };

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("referral_links")
    .select("nome, token")
    .eq("id", parsed.data.referralLinkId)
    .single();

  const { error } = await admin.from("referral_links").delete().eq("id", parsed.data.referralLinkId);
  if (error) return { message: "Não foi possível excluir o link." };

  await registrarAuditoria({
    actorId: sessao.userId,
    acao: "excluir_link_indicacao",
    entidade: "referral_links",
    entidadeId: parsed.data.referralLinkId,
    antes: link,
  });

  revalidatePath("/admin/indicacoes");
  redirect("/admin/indicacoes");
}
