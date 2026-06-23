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
npm run build       # gera dist/content.js, dist/background.js e dist/content.css
```

Rode `npm run typecheck` antes do build para capturar erros de tipo.

## Variáveis de ambiente

Não há. Todas as configurações (URLs, endpoints, seletores, timeouts) ficam em `src/shared/config.ts`. As strings de UI ficam em `src/shared/constants.ts`.

## Estrutura gerada

O esbuild bundla o código TypeScript em:

- `dist/content.js` — content script injetado na página do callsys
- `dist/background.js` — service worker (proxy de requisições)
- `dist/content.css` — estilos do bubble/painel (bundle dos módulos em `src/presentation/styles/`)

A pasta `dist/` é autocontida: além dos bundles JS/CSS, o build copia o `manifest.json` e a pasta `assets/` para dentro dela. É a `dist/` que o Chrome carrega em desenvolvimento e que se zipa para publicação na Chrome Web Store. Ela não é versionada (está no `.gitignore`) — sempre rode `npm run build` após clonar ou alterar o código TS ou os estilos.
