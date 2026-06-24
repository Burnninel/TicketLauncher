# Configuração do ambiente de desenvolvimento

## Pré-requisitos

- Node.js >= 18
- npm
- Google Chrome

## Instalação

```bash
git clone https://github.com/org/bling-ticket-extension
cd bling-ticket-extension
npm install
```

## Build

```bash
npm run typecheck
npm run build
```

Rode `npm run typecheck` antes do build para capturar erros de tipo.

## Variáveis de ambiente

Para o piloto da integração com o VoiceTranscriber, copie `.env.example` para `.env` e preencha:

```env
VOICE_TRANSCRIBER_INTEGRATION_TOKEN=
```

Esse valor é lido apenas no momento do `npm run build` e fica embutido no bundle gerado em `dist/`. Use somente para teste controlado.

A estratégia de produção está documentada em `docs/integration/voicetranscriber-auth-plan.md`.

As demais configurações (URLs, endpoints, seletores e timeouts) ficam em `src/shared/config.ts`. As strings de UI ficam em `src/shared/constants.ts`.

## Estrutura gerada

O esbuild bundla o código TypeScript em:

- `dist/content.js`: content script injetado na página do callsys.
- `dist/background.js`: service worker, usado como proxy de requisições.
- `dist/content.css`: estilos do bubble/painel.

A pasta `dist/` é autocontida: além dos bundles JS/CSS, o build copia o `manifest.json` e a pasta `assets/` para dentro dela. É a `dist/` que o Chrome carrega em desenvolvimento e que se zipa para publicação na Chrome Web Store.

Ela não é versionada porque está no `.gitignore`. Sempre rode `npm run build` após clonar ou alterar o código TypeScript ou os estilos.
