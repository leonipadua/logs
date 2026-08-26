# DESIGN_SYSTEM — Sabre Logs v1

Direção visual e especificação de componentes. Existe para que "moderno, tech, sem cara de IA" seja uma instrução executável e não uma impressão subjetiva.

---

## 1. Direção

**Editorial / fintech premium.** Referências de calibragem: Stripe, Mercury, Ramp, Linear (pelo rigor, não pela paleta).

Três atributos que definem tudo abaixo:

1. **Claro por padrão.** O MVP era escuro porque escuro parece "tech" com pouco esforço. Fundo claro é mais difícil de acertar e por isso comunica cuidado. Tema escuro existe desde o início como par completo de tokens, não como remendo.
2. **Tipografia carrega o peso.** Serifada nos títulos e nos números grandes; sans neutra na interface. É o que diferencia um painel financeiro de um dashboard de template.
3. **Respiro, não decoração.** O que separa as áreas é espaço em branco e hierarquia tipográfica. Borda e sombra entram só onde há real necessidade de separação.

### Por que "cara de IA" acontece

A estética que o Leoni pediu para evitar é reconhecível e tem componentes concretos. São proibições, não sugestões:

| Proibido | Por quê |
|---|---|
| Gradiente roxo→azul (`#6366f1` → `#8b5cf6` e vizinhança) | É a assinatura visual de produto gerado |
| Glassmorphism / `backdrop-blur` em card | Idem |
| Sombra colorida (`shadow-indigo-500/50`) | Idem |
| Emoji como ícone de interface (✨ 🚀 🎯 💡) | Idem — inclusive em texto de UI |
| Hero centralizado com headline gigante em gradiente | Idem |
| `border-radius` em pill (999px) em card ou botão largo | Idem |
| Dark mode com fundo `#0a0a0a` puro e accent neon | O visual do MVP; substituído |
| Ícone com fundo circular colorido em grid de features | Idem |

---

## 2. Tokens

Tailwind v4 é CSS-first: **não existe `tailwind.config.js`**. Tudo em `src/app/globals.css` dentro de `@theme`. Nenhum componente escreve cor literal — sempre token.

### 2.1 Estrutura

```css
@import "tailwindcss";

:root {
  /* superfícies */
  --surface-base:      #fbfbfa;  /* fundo da página — off-white quente, nunca #fff puro */
  --surface-raised:    #ffffff;  /* cards, tabelas */
  --surface-sunken:    #f4f4f2;  /* áreas recuadas, headers de tabela */
  --surface-inverse:   #16171a;

  /* texto */
  --text-primary:      #16171a;
  --text-secondary:    #5c5f66;
  --text-tertiary:     #8b8e96;
  --text-inverse:      #fbfbfa;

  /* borda */
  --border-subtle:     #e8e8e5;
  --border-default:    #d8d8d4;
  --border-strong:     #b8b8b3;

  /* accent — um só, frio, sóbrio */
  --accent:            #1f5c4d;  /* verde profundo, não neon */
  --accent-hover:      #17463a;
  --accent-subtle:     #e8f0ed;
  --accent-text:       #1f5c4d;

  /* semânticas de estado */
  --state-done:        #1f5c4d;  /* concluída — mesma família do accent */
  --state-progress:    #9a6b1f;  /* em andamento — âmbar escuro, legível */
  --state-pending:     #8b8e96;  /* pendente — neutro */
  --state-blocked:     #a33a2f;  /* bloqueada — problema */
  --state-locked:      #4a4d8f;  /* trancada — oportunidade (índigo apagado) */

  --state-done-bg:     #e8f0ed;
  --state-progress-bg: #f7efdf;
  --state-pending-bg:  #f1f1ef;
  --state-blocked-bg:  #f7e8e6;
  --state-locked-bg:   #ecedf6;

  /* elevação */
  --shadow-sm: 0 1px 2px rgb(22 23 26 / 0.04), 0 1px 1px rgb(22 23 26 / 0.03);
  --shadow-md: 0 2px 4px rgb(22 23 26 / 0.04), 0 4px 12px rgb(22 23 26 / 0.05);
  --shadow-lg: 0 4px 8px rgb(22 23 26 / 0.05), 0 12px 32px rgb(22 23 26 / 0.07);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* … pares escuros … */ }
}
:root[data-theme="dark"] { /* … mesmos pares … */ }

@theme inline {
  --color-surface-base:   var(--surface-base);
  --color-surface-raised: var(--surface-raised);
  /* … mapear todos … */
  --font-display: var(--font-display), Georgia, "Times New Roman", serif;
  --font-sans:    var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono:    var(--font-mono), ui-monospace, monospace;
}
```

### 2.2 Regras de token

- **Nenhuma cor tem definição única dentro de um bloco de media query.** A paleta clara é definida em `:root` puro; o escuro apenas redefine.
- `body` recebe `background: var(--surface-base)` explicitamente.
- **Um accent só.** Nada de segunda cor de marca. As semânticas de estado não são cores de marca — são vocabulário funcional.
- **Trancada (`--state-locked`) nunca compartilha cor com bloqueada (`--state-blocked`).** É a distinção mais importante da UI inteira ([PRD](./PRD.md) §4).

### 2.3 Tema escuro

Pares equivalentes, mantendo a mesma lógica de camadas. Base sugerida: `--surface-base: #131416`, `--surface-raised: #1a1c1f`, `--surface-sunken: #0f1012`, texto `#f0efec` / `#9ca0a8`. O accent no escuro sobe em luminosidade (`#3d9b82`) para manter contraste AA. Não é `#000` puro em lugar nenhum.

---

## 3. Tipografia

### 3.1 Famílias

| Papel | Escolha | Alternativas aceitáveis |
|---|---|---|
| Display (serifada) | **Instrument Serif** | Fraunces, Newsreader, Source Serif 4 |
| Interface (sans) | **Inter** | Geist Sans (já no projeto), Söhne |
| Dados / código | Geist Mono | JetBrains Mono |

Carregadas via `next/font/google` como variáveis CSS, como o MVP já faz. Toda família precisa de stack de fallback real.

A serifada é **exclusiva de títulos e de números-destaque**. Nunca em rótulo, botão, tabela ou corpo de texto longo.

### 3.2 Escala

| Token | Tamanho / line-height | Família | Uso |
|---|---|---|---|
| `display-lg` | 44 / 1.1 | display | Título da home |
| `display-md` | 32 / 1.15 | display | Nome do projeto, valor da receita do mês |
| `display-sm` | 24 / 1.2 | display | Título de seção, percentual de progresso |
| `body-lg` | 17 / 1.6 | sans | Copy de insight da oferta, texto institucional |
| `body` | 15 / 1.55 | sans | Padrão |
| `body-sm` | 13.5 / 1.5 | sans | Descrição secundária |
| `label` | 12.5 / 1.4, `+0.02em`, medium | sans | Rótulo de campo, cabeçalho de tabela |
| `mono-sm` | 13 / 1.4 | mono | Id, código Pix, chave |

Peso: 400 e 500 na sans; 400 na serifada. **Sem 700.** Hierarquia vem de tamanho e cor, não de peso — é o que dá o ar editorial.

### 3.3 Numerais tabulares (obrigatório)

Todo número que possa aparecer numa coluna, mudar em tempo real ou ser comparado usa `font-variant-numeric: tabular-nums`. Isso cobre: percentual de progresso, todo valor em BRL, contadores "X de Y", datas e a dashboard financeira inteira.

Utilitário dedicado, aplicado sem exceção. É um detalhe pequeno com efeito desproporcional na percepção de rigor — e sua ausência é justamente o que faz um painel parecer template.

---

## 4. Espaço, forma e elevação

**Escala de espaçamento** (base 4): 4, 8, 12, 16, 24, 32, 48, 64, 96. Nada fora dela.

**Raios:** `sm 4px` (badge, input) · `md 8px` (card, botão) · `lg 12px` (modal, painel). **Nunca pill.**

**Elevação:** o padrão de separação é borda `1px` em `--border-subtle` sobre `--surface-raised`. Sombra só onde há sobreposição real (modal, dropdown, header fixo ao rolar). Card estático não tem sombra.

**Largura de leitura:** conteúdo textual em no máximo `68ch`. A área do cliente tem contêiner de `1120px`; a dashboard do admin pode ir a `1360px`.

**Grade:** mobile-first, uma coluna até 768px. A timeline é sempre uma coluna, em qualquer largura.

---

## 5. Componentes

### 5.1 Header de progresso

Nome do projeto em `display-md`; percentual em `display-sm` com tabulares; "X de Y etapas concluídas" em `body-sm`; "atualizado em …" em `body-sm` terciário.

Barra: 6px, raio 3px, trilho `--surface-sunken`, preenchimento em `--accent` **sólido, sem gradiente**. Transição de largura em 400ms `ease-out`. Sempre acompanhada do número — a barra nunca é a única informação.

**Ofertas trancadas não entram no cálculo** ([PRD](./PRD.md) E2).

### 5.2 Item de timeline — cinco estados

A timeline é uma `<ol>` com trilho vertical de 1px à esquerda e um marcador por item. Cada estado é ícone + rótulo + cor; **nunca cor sozinha**.

| Estado | Marcador | Rótulo | Cor |
|---|---|---|---|
| Pendente | Círculo vazado, borda `--border-default` | "Pendente" | `--state-pending` |
| Em andamento | Círculo com preenchimento parcial | "Em andamento" | `--state-progress` |
| Concluída | Círculo preenchido com "check" | "Concluída" | `--state-done` |
| Bloqueada | Círculo com traço horizontal | "Bloqueada" + motivo | `--state-blocked` |
| **Trancada** | **Cadeado, com o trilho em traço pontilhado** | "Disponível" | `--state-locked` |

O trilho pontilhado no estado trancado é o que separa visualmente "o que faz parte do seu projeto" de "o que pode passar a fazer" — antes mesmo de o usuário ler qualquer rótulo. Bloqueada e trancada não compartilham forma, cor nem vocabulário.

Ícones: **Lucide**, traço 1.5px, 16px na timeline. Nunca emoji.

### 5.3 Card de oferta (a vitrine)

Fica ao fim da timeline, sob um cabeçalho de seção próprio ("Disponível para o seu projeto"), separado por um divisor.

Composição:
1. Cadeado + título em `body-lg` medium.
2. **Copy de insight em `display-sm` serifada** — é a frase que precisa ser lida. É o único lugar da interface do cliente onde a serifada aparece em texto que não é título de página, e essa exceção é intencional.
3. Descrição do que está incluso, em `body-sm`.
4. Preço com tabulares + prazo estimado.
5. Um botão primário: "Desbloquear".

Fundo `--state-locked-bg`, borda `--state-locked` a 20% de opacidade. Sem sombra colorida, sem brilho, sem animação de pulso. O desejo vem da copy, não do efeito.

### 5.4 Tabela financeira

Cabeçalho em `label` sobre `--surface-sunken`. Linhas com divisor de 1px, sem zebra. **Valores alinhados à direita, tabulares, sempre.** Status como badge de texto com ponto colorido — nunca badge inteiro colorido, que polui a leitura vertical.

Total ou destaque em `display-sm` serifada, acima da tabela, não dentro dela.

### 5.5 Formulário

Label acima do campo em `label`. Input com borda `--border-default`, foco com anel de 2px em `--accent` e offset de 1px. Erro: borda `--state-blocked` + mensagem em `body-sm` abaixo do campo — **erro por campo, nunca banner genérico no topo**. Texto de ajuda em `body-sm` terciário abaixo, antes do erro.

Um único botão primário por tela. O secundário é fantasma (texto + borda).

### 5.6 Estado vazio

Sem ilustração, sem ícone gigante. Título em `display-sm`, uma frase de explicação em `body`, e uma ação ou um caminho de contato. Copy específica por contexto ([PRD](./PRD.md) §7) — nunca "Nenhum item encontrado".

### 5.7 Skeleton

Blocos em `--surface-sunken` com as **dimensões exatas** do conteúdo final, para não haver salto de layout. Pulso de opacidade em 1.5s. Sem gradiente varrendo — shimmer é marca de template.

---

## 6. Movimento

Comedido e curto. `120ms` para hover e foco; `200ms` para entrada de elemento; `400ms` para a barra de progresso. Curva padrão `cubic-bezier(0.2, 0, 0, 1)`.

Sem parallax, sem animação de scroll, sem número que "conta" ao aparecer. Respeitar `prefers-reduced-motion: reduce` desativando toda transição não essencial.

---

## 7. Acessibilidade (requisito, não recomendação)

- **Contraste WCAG AA** (4.5:1 em texto, 3:1 em elemento gráfico) nos **dois** temas. Cada par de tokens é verificado.
- **Estado nunca comunicado só por cor** — sempre ícone + rótulo textual. Regra herdada do PRD do MVP e mantida.
- Foco visível em todo elemento interativo; anel jamais removido sem substituto.
- Alvo de toque mínimo de 44×44px.
- Ordem de tabulação segue a ordem visual; modal prende o foco e devolve ao fechar.
- Toda tabela tem `<caption>` ou `aria-label`; toda imagem informativa tem alternativo.
- Atualização em tempo real anunciada por `aria-live="polite"`.
- Zoom de 200% sem perda de conteúdo ou rolagem horizontal.

---

## 8. Escrita de interface

O texto é parte do design e segue as mesmas regras de sobriedade.

- Português do Brasil, segunda pessoa ("seu projeto"), tom direto.
- Sem exclamação. Sem "Ops!". Sem emoji.
- Sem jargão técnico na área do cliente: "etapa", não "task"; "atualizado", não "sincronizado".
- Erro diz **o que aconteceu e o que fazer**, nunca só "algo deu errado".
- Números com formatação pt-BR: `R$ 1.200,00`, `24 de março`, `62%`.
- Botão descreve a ação: "Desbloquear", "Salvar alterações", "Enviar convite" — nunca "OK" ou "Continuar" sozinho.

---

## 9. Checklist de revisão visual

Antes de dar uma tela por pronta:

- [ ] Nenhuma cor literal fora dos tokens.
- [ ] Todo número comparável usa tabulares.
- [ ] A tela funciona nos dois temas, com contraste AA verificado.
- [ ] Legível a 360px sem rolagem horizontal.
- [ ] Todo estado tem ícone + rótulo, não só cor.
- [ ] Nenhum item da lista de proibições da §1 está presente.
- [ ] Um botão primário por tela.
- [ ] Estado vazio, de carregamento e de erro existem e têm copy própria.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Navegação completa por teclado com foco sempre visível.
