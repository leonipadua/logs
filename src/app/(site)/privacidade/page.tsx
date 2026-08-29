export const metadata = {
  title: "Política de Privacidade — Sabre Logs",
  description: "Como a Sabre trata dados pessoais no Sabre Logs.",
};

function AvisoPendencia() {
  return (
    <div className="rounded-sm border border-state-blocked bg-surface-raised p-4 text-body-sm text-text-primary">
      <strong>Documento incompleto.</strong> Os campos entre colchetes abaixo dependem de
      dados cadastrais da Sabre (razão social, CNPJ, endereço e email do encarregado) que
      ainda não foram informados. Esta política não deve ser considerada válida ou publicada
      até que sejam preenchidos.
    </div>
  );
}

export default function PrivacidadePage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-display-md text-text-primary">Política de Privacidade</h1>
        <p className="mt-2 text-body-sm text-text-tertiary">Última atualização: pendente de publicação.</p>
      </div>

      <AvisoPendencia />

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">1. Controlador</h2>
        <p className="text-body text-text-secondary">
          Esta política é mantida por [RAZÃO SOCIAL PENDENTE], inscrita no CNPJ
          [CNPJ PENDENTE], com sede em [ENDEREÇO PENDENTE] (&ldquo;Sabre&rdquo;), responsável pelo
          tratamento dos dados pessoais descritos abaixo, no âmbito do produto Sabre Logs.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">2. Dados que tratamos</h2>
        <ul className="list-disc pl-5 text-body text-text-secondary">
          <li>
            <strong>Cadastro:</strong> nome, email e telefone — base legal: execução de contrato.
          </li>
          <li>
            <strong>Organização:</strong> razão social, CNPJ/CPF e endereço de cobrança —
            base legal: execução de contrato e obrigação legal.
          </li>
          <li>
            <strong>Uso:</strong> último acesso e log de auditoria — base legal: legítimo
            interesse (segurança).
          </li>
          <li>
            <strong>Financeiro:</strong> histórico de cobranças e pagamentos — base legal:
            execução de contrato e obrigação legal.
          </li>
          <li>
            <strong>Comunicação:</strong> log de emails enviados — base legal: execução de
            contrato.
          </li>
        </ul>
        <p className="text-body text-text-secondary">
          Não tratamos dado sensível, dado de menor, nem o conteúdo das conversas de
          WhatsApp dos clientes — esse processamento pertence a outro produto da Sabre e tem
          política própria.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">3. Com quem compartilhamos</h2>
        <p className="text-body text-text-secondary">
          Usamos os seguintes operadores para viabilizar o serviço:
        </p>
        <ul className="list-disc pl-5 text-body text-text-secondary">
          <li>Supabase — banco de dados e autenticação.</li>
          <li>Vercel — hospedagem.</li>
          <li>Resend — envio de email transacional (EUA).</li>
          <li>Asaas — processamento de pagamento (Brasil).</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">4. Seus direitos</h2>
        <p className="text-body text-text-secondary">
          Você pode solicitar acesso, correção, portabilidade, eliminação, informação sobre
          compartilhamento e revogação de consentimento sobre seus dados. Para exercer esses
          direitos, escreva para [EMAIL DO ENCARREGADO PENDENTE]. Respondemos em até 15 dias.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">5. Por quanto tempo guardamos</h2>
        <ul className="list-disc pl-5 text-body text-text-secondary">
          <li>Conta ativa: enquanto durar a relação com a Sabre.</li>
          <li>Conta encerrada: 6 meses, depois anonimizada.</li>
          <li>Registro financeiro: 5 anos (obrigação fiscal).</li>
          <li>Log de auditoria: 2 anos.</li>
          <li>Log de emails: 1 ano.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">6. Cookies</h2>
        <p className="text-body text-text-secondary">
          Usamos apenas cookies estritamente necessários, para manter sua sessão e sua
          preferência de tema. Não usamos analytics de terceiros nem rastreamento.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">7. Encarregado de dados (DPO)</h2>
        <p className="text-body text-text-secondary">
          Canal de contato do encarregado: [EMAIL DO ENCARREGADO PENDENTE].
        </p>
      </section>
    </article>
  );
}
