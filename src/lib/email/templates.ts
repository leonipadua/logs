interface Renderizado {
  assunto: string;
  html: string;
  texto: string;
}

/**
 * Envelope simples, com cores explícitas em todo elemento — clientes de
 * email escuros invertem qualquer coisa sem `background`/`color` fixos,
 * então nunca deixamos isso implícito (DESIGN_SYSTEM não se aplica aqui,
 * mas o princípio de "nunca confiar em cor implícita" vale igual).
 */
function envelope(tituloInterno: string, corpoHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8" /><meta name="color-scheme" content="light" /></head>
  <body style="margin:0;padding:32px 16px;background-color:#fbfbfa;font-family:ui-sans-serif,system-ui,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #e8e8e5;border-radius:8px;">
      <tr><td style="padding:32px;">
        <p style="margin:0 0 24px;font-size:12px;letter-spacing:0.02em;text-transform:uppercase;color:#8b8e96;">Sabre Logs</p>
        <h1 style="margin:0 0 16px;font-size:20px;color:#16171a;">${tituloInterno}</h1>
        ${corpoHtml}
      </td></tr>
    </table>
  </body>
</html>`;
}

function paragrafo(texto: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5c5f66;">${texto}</p>`;
}

function botao(href: string, rotulo: string): string {
  return `<a href="${href}" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background-color:#1f5c4d;color:#fbfbfa;text-decoration:none;border-radius:8px;font-size:15px;">${rotulo}</a>`;
}

export function templateConvite(input: { nome: string; email: string; senhaTemporaria: string; urlLogin: string }): Renderizado {
  const assunto = "Seu acesso ao Sabre Logs";
  const html = envelope(
    "Você foi convidado",
    paragrafo(`Olá, ${input.nome}. Você foi convidado para acompanhar seu projeto no Sabre Logs.`) +
      paragrafo(`Email: <strong>${input.email}</strong><br/>Senha temporária: <strong>${input.senhaTemporaria}</strong>`) +
      botao(input.urlLogin, "Acessar o painel") +
      paragrafo("No primeiro acesso você será solicitado a trocar essa senha. O convite expira em 7 dias."),
  );
  const texto = `Você foi convidado para o Sabre Logs.\n\nEmail: ${input.email}\nSenha temporária: ${input.senhaTemporaria}\nAcesse: ${input.urlLogin}\n\nO convite expira em 7 dias.`;
  return { assunto, html, texto };
}

export function templateRecuperacaoSenha(input: { urlRedefinir: string }): Renderizado {
  const assunto = "Redefinição de senha — Sabre Logs";
  const html = envelope(
    "Redefinir sua senha",
    paragrafo("Recebemos um pedido para redefinir sua senha.") +
      botao(input.urlRedefinir, "Redefinir senha") +
      paragrafo("O link expira em 1 hora. Se você não pediu isso, ignore este email."),
  );
  const texto = `Recebemos um pedido para redefinir sua senha.\n\nAcesse: ${input.urlRedefinir}\n\nO link expira em 1 hora. Se você não pediu isso, ignore este email.`;
  return { assunto, html, texto };
}

export function templateDigestTasks(input: { nomeProjeto: string; quantidade: number; urlProjeto: string }): Renderizado {
  const plural = input.quantidade === 1 ? "etapa concluída" : "etapas concluídas";
  const assunto = `${input.quantidade} ${plural} no seu projeto`;
  const html = envelope(
    `${input.quantidade} ${plural}`,
    paragrafo(`Seu projeto <strong>${input.nomeProjeto}</strong> avançou.`) + botao(input.urlProjeto, "Ver progresso"),
  );
  const texto = `${input.quantidade} ${plural} no projeto ${input.nomeProjeto}.\n\nVeja: ${input.urlProjeto}`;
  return { assunto, html, texto };
}

export function templateCobrancaGerada(input: { nomeOrganizacao: string; descricao: string; valorFormatado: string; urlFaturas: string }): Renderizado {
  const assunto = "Nova cobrança gerada";
  const html = envelope(
    "Cobrança gerada",
    paragrafo(`Uma nova cobrança foi gerada para <strong>${input.nomeOrganizacao}</strong>.`) +
      paragrafo(`${input.descricao} — ${input.valorFormatado}`) +
      botao(input.urlFaturas, "Ver faturas"),
  );
  const texto = `Nova cobrança para ${input.nomeOrganizacao}.\n${input.descricao} — ${input.valorFormatado}\n\nVeja: ${input.urlFaturas}`;
  return { assunto, html, texto };
}

export function templatePagamentoConfirmado(input: { nomeOrganizacao: string; valorFormatado: string; urlFaturas: string }): Renderizado {
  const assunto = "Pagamento confirmado";
  const html = envelope(
    "Pagamento confirmado",
    paragrafo(`Recebemos o pagamento de <strong>${input.valorFormatado}</strong> de ${input.nomeOrganizacao}. Obrigado!`) +
      botao(input.urlFaturas, "Ver faturas"),
  );
  const texto = `Pagamento de ${input.valorFormatado} confirmado para ${input.nomeOrganizacao}.\n\nVeja: ${input.urlFaturas}`;
  return { assunto, html, texto };
}

export function templateCobrancaFalhouOuVencida(input: { motivo: string; urlFaturas: string }): Renderizado {
  const assunto = "Cobrança pendente — ação necessária";
  const html = envelope(
    "Cobrança pendente",
    paragrafo(input.motivo) + botao(input.urlFaturas, "Ver faturas"),
  );
  const texto = `${input.motivo}\n\nVeja: ${input.urlFaturas}`;
  return { assunto, html, texto };
}

export function templateContato(input: { nome: string; email: string; mensagem: string }): Renderizado {
  const assunto = `Contato pelo site — ${input.nome}`;
  const html = envelope(
    "Nova mensagem de contato",
    paragrafo(`Nome: <strong>${input.nome}</strong><br/>Email: <strong>${input.email}</strong>`) +
      paragrafo(input.mensagem.replace(/\n/g, "<br/>")),
  );
  const texto = `Nova mensagem de contato.\n\nNome: ${input.nome}\nEmail: ${input.email}\n\n${input.mensagem}`;
  return { assunto, html, texto };
}

export function templateDesbloqueioLiberado(input: { nomeOferta: string; nomeProjeto: string; urlProjeto: string }): Renderizado {
  const assunto = "Nova etapa liberada no seu projeto";
  const html = envelope(
    "Etapa liberada",
    paragrafo(`"<strong>${input.nomeOferta}</strong>" foi liberada e já faz parte do projeto <strong>${input.nomeProjeto}</strong>.`) +
      botao(input.urlProjeto, "Ver projeto"),
  );
  const texto = `"${input.nomeOferta}" foi liberada no projeto ${input.nomeProjeto}.\n\nVeja: ${input.urlProjeto}`;
  return { assunto, html, texto };
}
