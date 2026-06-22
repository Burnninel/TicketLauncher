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
npm run typecheck   # verificação de tipos (tsc --noEmit)
npm run build       # gera dist/content.js e dist/background.js
```

Rode `npm run typecheck` antes do build para capturar erros de tipo.

## Variáveis de ambiente

Não há. Todas as configurações (URLs, endpoints, seletores, timeouts) ficam em `src/shared/config.ts`. As strings de UI ficam em `src/shared/constants.ts`.

## Estrutura gerada

O esbuild bundla o código TypeScript em:

- `dist/content.js` — content script injetado na página do callsys
- `dist/background.js` — service worker (proxy de requisições)

É a pasta `dist/` (junto com `manifest.json` e `assets/`) que o Chrome carrega. A pasta `dist/` é gerada pelo build e não é versionada (está no `.gitignore`) — sempre rode `npm run build` após clonar ou alterar o código TS.
