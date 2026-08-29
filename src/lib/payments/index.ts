import "server-only";
import { MockPaymentProvider } from "./mock-provider";
import type { PaymentProvider } from "./types";

export type { PaymentProvider, MetodoPagamento, EventoPagamento } from "./types";

function getProvider(): PaymentProvider {
  const escolhido = process.env.PAYMENT_PROVIDER ?? "mock";
  if (escolhido === "asaas") {
    // F8: troca por AsaasPaymentProvider real, sem alterar nenhuma tela
    // (ARCHITECTURE §4.1 — regra inviolável de troca de adaptador).
    throw new Error("AsaasPaymentProvider ainda não existe — implementado na F8.");
  }
  return new MockPaymentProvider();
}

export const paymentProvider = getProvider();
