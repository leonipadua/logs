import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentProvider,
  DadosCliente,
  CriarCobrancaInput,
  CobrancaCriada,
  StatusCobrancaProvider,
  EventoPagamento,
} from "./types";

// Segredo só para assinar o gatilho manual do admin (F5). Nunca usado em
// produção — a F8 troca por verificação real do Asaas.
const MOCK_SHARED_SECRET = "sabre-logs-mock-webhook-secret";

export function assinarPayloadMock(corpo: string): string {
  return createHmac("sha256", MOCK_SHARED_SECRET).update(corpo).digest("hex");
}

function idFalso(prefixo: string) {
  return `mock_${prefixo}_${randomBytes(8).toString("hex")}`;
}

function pixMockSvgBase64(payload: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="#fff"/><rect x="10" y="10" width="200" height="200" fill="none" stroke="#000" stroke-width="4"/><text x="110" y="100" font-family="monospace" font-size="12" text-anchor="middle">QR CODE PIX</text><text x="110" y="120" font-family="monospace" font-size="10" text-anchor="middle">(simulado)</text><text x="110" y="150" font-family="monospace" font-size="8" text-anchor="middle">${payload.slice(0, 24)}</text></svg>`;
  return Buffer.from(svg).toString("base64");
}

export class MockPaymentProvider implements PaymentProvider {
  async criarCliente(input: DadosCliente) {
    void input;
    return { providerCustomerId: idFalso("cus") };
  }

  async criarAssinatura(input: { valorCentavos: number }) {
    if (input.valorCentavos === 0) return { providerSubscriptionId: null };
    return { providerSubscriptionId: idFalso("sub") };
  }

  async cancelarAssinatura(): Promise<void> {
    // mock: nada para cancelar de fato
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<CobrancaCriada> {
    const providerChargeId = idFalso("chg");
    if (input.metodo === "pix") {
      const payload = `00020126580014BR.GOV.BCB.PIX0136${providerChargeId}5204000053039865802BR5913SABRE LOGS6009SAO PAULO62070503***6304MOCK`;
      return { providerChargeId, pix: { payload, qrcodeBase64: pixMockSvgBase64(payload) } };
    }
    return { providerChargeId, checkoutUrl: `/app/faturas?checkout=${providerChargeId}` };
  }

  async consultarCobranca(): Promise<StatusCobrancaProvider> {
    // mock: o estado real vive só na nossa tabela `charges`, atualizada
    // pelo gatilho manual do admin — não há um "servidor Asaas" para consultar.
    return "pendente";
  }

  async verificarWebhook(req: Request): Promise<EventoPagamento | null> {
    const corpo = await req.text();
    const assinatura = req.headers.get("x-mock-signature");
    if (!assinatura) return null;

    const esperada = assinarPayloadMock(corpo);
    const a = Buffer.from(assinatura);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    try {
      const evento = JSON.parse(corpo) as EventoPagamento;
      return evento;
    } catch {
      return null;
    }
  }
}
