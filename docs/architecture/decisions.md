# Registro de decisões arquiteturais (ADR)

Cada decisão técnica relevante é registrada aqui no formato ADR (Architecture Decision Record).

## ADR-001: TypeScript com strict mode

**Data**: 2026-06-22
**Status**: Aceita

**Contexto**: O projeto iniciou em JavaScript puro, sem tipagem das respostas da API do Bling nem verificação em tempo de build.

**Decisão**: Migrar para TypeScript com `strict: true` e `noUncheckedIndexedAccess: true`.

**Consequências**:
- Positivas: tipagem das respostas da API do Bling, erros capturados em tempo de build, acessos a índices forçam checagem de `undefined`.
- Negativas: necessidade de configurar o esbuild para transpilar TS antes de carregar no Chrome.

## ADR-002: esbuild como bundler

**Data**: 2026-06-22
**Status**: Aceita

**Contexto**: Content scripts do Manifest V3 não suportam ES Modules nativamente quando injetados pelo manifest. É preciso bundlar o código em um único arquivo.

**Decisão**: Usar esbuild em vez de Webpack ou Rollup.

**Consequências**:
- Positivas: build extremamente rápido, configuração mínima, saída em formato IIFE compatível com content scripts.
- Negativas: ecossistema de plugins menor que o do Webpack (irrelevante para o escopo atual).

## ADR-003: Zero dependências de runtime

**Data**: 2026-06-22
**Status**: Aceita

**Contexto**: A UI da extensão é simples (bubble + painel). Frameworks como Vue ou React adicionariam peso e complexidade.

**Decisão**: Construir a UI com DOM puro, sem dependências de runtime.

**Consequências**:
- Positivas: bundle pequeno, sem overhead de framework, carregamento rápido no content script.
- Negativas: manipulação manual do DOM; aceitável dado o tamanho da UI.

## ADR-004: Shadow DOM não adotado

**Data**: 2026-06-22
**Status**: Aceita

**Contexto**: Shadow DOM isolaria o CSS da extensão dos estilos da página hospedeira (callsys).

**Decisão**: Não usar Shadow DOM; aplicar CSS diretamente com seletores prefixados (`bl-`).

**Consequências**:
- Positivas: simplicidade de implementação e depuração.
- Negativas: risco teórico de colisão de estilos, mitigado pelo prefixo `bl-` em todos os seletores (e `--bl-` nas variáveis). A complexidade do Shadow DOM não se justificou frente ao benefício.

## ADR-005: Cookies de sessão em vez de API key

**Data**: 2026-06-22
**Status**: Aceita

**Contexto**: Os endpoints utilizados são da API interna do Bling, que não oferece suporte a token externo (Bearer/API key) para esse fluxo.

**Decisão**: Autenticar via cookies da sessão ativa do navegador, encaminhados pelo service worker com `credentials: "include"`.

**Consequências**:
- Positivas: funciona com a sessão que o agente já mantém aberta, sem gestão de credenciais.
- Negativas: o usuário precisa estar logado no Bling em outra aba; o token de sessão expira em ~5 minutos (renovado automaticamente em sessão ativa).

## ADR-006: CSS modular com tokens de design

**Data**: 2026-06-22
**Status**: Aceita

**Contexto**: O `styles.css` único cresceu com o redesign do bubble (identidade visual do Bling, novos estados e campos). Cores e medidas estavam espalhadas e duplicadas, dificultando manutenção e consistência.

**Decisão**: Quebrar a estilização em `src/presentation/styles/` com um módulo por área (`_variables`, `_bubble`, `_panel`, `_fields`, `_states`) agregados por `index.css` via `@import`. Centralizar cores, espaços, raios e sombras em tokens `--bl-*` no `_variables.css`. O esbuild inlina os imports em um único `dist/content.css`, referenciado pelo manifest.

**Consequências**:
- Positivas: tokens reaproveitáveis, cada área de UI isolada em seu arquivo, prefixo `--bl-` evita colisão com variáveis CSS do callsys/Bling.
- Negativas: o CSS passa a depender do build (não é mais servido direto de `src/`); é preciso rodar `npm run build` após alterar estilos.

## ADR-007: Emojis substituídos por SVGs inline

**Data**: 2026-06-22
**Status**: Aceita

**Contexto**: Os estados da UI usavam emojis (❌, ✅, ⚠️, 🏢), cuja renderização varia por SO/fonte e destoa da identidade visual do Bling.

**Decisão**: Remover todos os emojis e usar SVGs inline (`src/presentation/icons.ts`) com `currentColor`, controlados pelo CSS. Mantém a premissa de zero dependências de runtime (ADR-003).

**Consequências**:
- Positivas: aparência consistente entre plataformas, cor controlada por CSS, sem assets externos.
- Negativas: markup SVG no bundle (peso desprezível).
