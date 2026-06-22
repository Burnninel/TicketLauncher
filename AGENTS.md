# bling-ticket-extension

Extensão Chrome que injeta um bubble na tela do callsys (https://bling.callsys.com.br/omnichannel) para criação de tickets de suporte no Bling sem sair da tela de atendimento.

## Stack
- TypeScript + esbuild (bundle para content script)
- Chrome Extension Manifest V3
- Zero dependências de runtime (sem React, Vue ou frameworks)

## Arquitetura
Clean Architecture em 4 camadas: presentation → domain → infrastructure → shared.
Nunca importar infrastructure em domain. Nunca importar presentation em domain ou infrastructure.

## Fluxo principal
1. Usuário abre o callsys com atendimento ativo
2. Clica em "Iniciar Atendimento" no bubble
3. Extensão lê o CNPJ do campo da tela (CallsysScraper)
4. Consulta API do Bling para obter idEmpresa e nome (BlingApi.findCompanyByCnpj)
5. Usuário digita a mensagem e confirma
6. Extensão cria o ticket via POST xajax (BlingApi.createTicket)
7. Exibe número e id do ticket criado

## Endpoints utilizados
- GET  https://www.bling.com.br/Api/v3/adm-empresas/empresas?pesquisa={cnpj}
- POST https://www.bling.com.br/services/tickets.server.php?f=salvarNovoTicket

## Autenticação
Não usa Bearer nem API key. Usa os cookies da sessão ativa do navegador (PHPSESSID, PCSID, bling_oauth_access). O Chrome injeta os cookies automaticamente para requisições ao domínio bling.com.br.

Como o content script roda em `callsys.com.br`, ele não consegue fazer requisições autenticadas cross-origin diretamente (CORS bloqueia e os cookies são removidos). Por isso todas as requisições passam pelo service worker (`background.ts`), que detém os `host_permissions` e encaminha o fetch com `credentials: "include"`.

## Convenções
- Inglês em todo o código sem exceção
- Strings de UI em português ficam em src/shared/constants.ts (MESSAGES)
- URLs e endpoints em src/shared/config.ts (Config)
- Nenhuma string ou URL hardcoded fora de config.ts e constants.ts
- Funções: verbo + substantivo (fetchCompanyByCnpj, createTicket, extractCnpj)
- Booleanos: prefixo is/has/can (isValid, hasError, isOpen)
- Indentação com TABS (1 tab por nível)
- Chaves PT preservadas apenas no contrato externo do Bling (XML do ticket, query params da API, campos `nome`/`numero` da resposta)

## Build
npm run build → gera dist/content.js e dist/background.js via esbuild
npm run typecheck → tsc --noEmit (rodar antes do build)

## Pontos de atenção
- Content scripts não suportam ES Modules nativamente → tudo bundlado pelo esbuild
- O usuário deve estar logado no Bling em outra aba para os cookies funcionarem
- Token bling_oauth_access expira em ~5 minutos; o browser renova automaticamente em sessão ativa
- O campo CNPJ no callsys usa Vue (vs-input); seletor: .vs-input--label → .vs-inputx
- O manifest aponta para dist/, não para src/ → sempre buildar após alterar TS
