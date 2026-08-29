export const metadata = {
  title: "Termos de Uso — Sabre Logs",
  description: "Condições de uso do Sabre Logs.",
};

function AvisoPendencia() {
  return (
    <div className="rounded-sm border border-state-blocked bg-surface-raised p-4 text-body-sm text-text-primary">
      <strong>Documento incompleto.</strong> Os campos entre colchetes abaixo dependem de
      dados cadastrais da Sabre (razão social, CNPJ e endereço) que ainda não foram
      informados. Estes termos não devem ser considerados válidos ou publicados até que
      sejam preenchidos.
    </div>
  );
}

export default function TermosPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-display-md text-text-primary">Termos de Uso</h1>
        <p className="mt-2 text-body-sm text-text-tertiary">Última atualização: pendente de publicação.</p>
      </div>

      <AvisoPendencia />

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">1. Quem oferece o serviço</h2>
        <p className="text-body text-text-secondary">
          O Sabre Logs é oferecido por [RAZÃO SOCIAL PENDENTE], inscrita no CNPJ
          [CNPJ PENDENTE], com sede em [ENDEREÇO PENDENTE] (&ldquo;Sabre&rdquo;).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">2. O que é o Sabre Logs</h2>
        <p className="text-body text-text-secondary">
          O Sabre Logs é um painel de acompanhamento para clientes da Sabre, que permite
          visualizar o progresso de projetos contratados junto à Sabre. O acesso é concedido
          exclusivamente por convite — não há cadastro público.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">3. Conta e acesso</h2>
        <p className="text-body text-text-secondary">
          Cada conta é pessoal e intransferível. Você é responsável por manter sua senha em
          sigilo e por toda atividade realizada com suas credenciais. Suspeita de acesso não
          autorizado deve ser comunicada imediatamente à Sabre.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">4. Pagamentos</h2>
        <p className="text-body text-text-secondary">
          Assinaturas e cobranças de desbloqueio de escopo seguem as condições combinadas
          diretamente com a Sabre. Os métodos de pagamento e o processamento são feitos por
          provedor terceiro (Asaas); a Sabre não armazena dados de cartão.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">5. Uso aceitável</h2>
        <p className="text-body text-text-secondary">
          O Sabre Logs não pode ser usado para fins ilícitos, para tentar acessar dados de
          outras organizações, ou para comprometer a segurança do serviço.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">6. Alterações</h2>
        <p className="text-body text-text-secondary">
          Podemos atualizar estes termos para refletir mudanças no serviço ou na legislação.
          Alterações relevantes serão comunicadas por email.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-body-lg font-medium text-text-primary">7. Contato</h2>
        <p className="text-body text-text-secondary">
          Dúvidas sobre estes termos: fale conosco pela página de{" "}
          <a href="/contato" className="text-accent-text hover:underline">
            contato
          </a>
          .
        </p>
      </section>
    </article>
  );
}
