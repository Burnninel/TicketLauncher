# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]
### Changed
- Redesign do bubble e do painel com a identidade visual do Bling (verde)
- Estilização migrada para CSS modular com tokens de design (`src/presentation/styles/`), bundlada pelo esbuild em `dist/content.css`
- Campo de mensagem renomeado para "Descrição" e pré-preenchido com texto padrão editável

### Added
- Campo CNPJ / CPF no painel, pré-preenchido na abertura e editável (re-busca a empresa ao confirmar)
- Banner de sucesso com botão "Criar outro ticket"
- Ícones SVG inline (`src/presentation/icons.ts`)
- Integração fire-and-forget com VoiceTranscriber após criação do ticket, incluindo captura de `callId` no CallSys
- Armazenamento local do token de integração via `chrome.storage.local`, sem versionar segredo no bundle

### Removed
- Emojis dos estados da UI, substituídos por SVGs

## [1.0.0] - 2026-06-22
### Added
- Bubble flutuante na tela do callsys
- Captura automática de CNPJ do atendimento ativo
- Consulta de empresa por CNPJ na API do Bling
- Criação de ticket com dados dinâmicos
- Exibição do número e id do ticket criado
