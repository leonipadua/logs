export type MetodoPagamento = "pix" | "credito" | "debito";

export interface DadosCliente {
  organizationId: string;
  nome: string;
  documento?: string | null;
  email?: string | null;
}

export interface CriarCobrancaInput {
  providerCustomerId: string;
  valorCentavos: number;
  metodo: MetodoPagamento;
  descricao: string;
  idempotencyKey: string;
  vencimento: string; // ISO date
}

export interface CobrancaCriada {
  providerChargeId: string;
  checkoutUrl?: string;
  pix?: { payload: string; qrcodeBase64: string };
}

export type StatusCobrancaProvider = "pendente" | "paga" | "falhou" | "vencida" | "estornada" | "cancelada";

export interface EventoPagamento {
  providerEventId: string;
  tipo: string;
  providerChargeId: string;
  status: StatusCobrancaProvider;
  valorCentavos: number;
  payload: unknown;
}

/** ARCHITECTURE §4.1 — contrato, não implementação. */
export interface PaymentProvider {
  criarCliente(input: DadosCliente): Promise<{ providerCustomerId: string }>;

  criarAssinatura(input: {
    providerCustomerId: string;
    valorCentavos: number; // 0 => não cria nada no provedor
    diaVencimento: number;
    descricao: string;
  }): Promise<{ providerSubscriptionId: string | null }>;

  cancelarAssinatura(providerSubscriptionId: string): Promise<void>;

  criarCobranca(input: CriarCobrancaInput): Promise<CobrancaCriada>;

  consultarCobranca(providerChargeId: string): Promise<StatusCobrancaProvider>;

  /** null = assinatura inválida. */
  verificarWebhook(req: Request): Promise<EventoPagamento | null>;
}
