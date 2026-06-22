# Fluxo de dados

## Fluxo completo

| Etapa | Responsável | Saída |
|-------|-------------|-------|
| Ler CNPJ do DOM do callsys | `CallsysScraper.extractCnpj()` | `cnpj: string \| null` |
| Validar e buscar empresa | `CompanyUseCase.fetchCompanyByCnpj()` | `CompanyEntity` |
| Requisição GET à API do Bling | `BlingApi.findCompanyByCnpj()` | `{ id, nome }` |
| Exibir nome da empresa | `Panel.showCompany()` | UI atualizada |
| Capturar mensagem do agente | `Panel.getMessage()` | `message: string` |
| Montar e criar o ticket | `TicketUseCase.createTicket()` | `ITicketResult` |
| Serializar corpo xajax | `XmlBuilder.buildRequestBody()` | `body: string` |
| Requisição POST à API do Bling | `BlingApi.createTicket()` | `{ ticketNumber, ticketId }` |
| Exibir sucesso | `Panel.showTicketCreated()` | UI atualizada |

## Diagrama de criação de ticket

```
[callsys DOM]
    ↓ extractCnpj()
[CallsysScraper]
    ↓ cnpj: string
[CompanyUseCase.fetchCompanyByCnpj()]
    ↓ GET /Api/v3/adm-empresas/empresas
[BlingApi.findCompanyByCnpj()]
    ↓ CompanyEntity { id, name }
[Panel — exibe nome da empresa]
    ↓ mensagem: string (input do usuário)
[TicketUseCase.createTicket()]
    ↓ new TicketEntity(company, message)
[XmlBuilder.buildRequestBody()]
    ↓ body: string (xajax URL-encoded)
[BlingApi.createTicket()]
    ↓ POST /services/tickets.server.php
[Panel.showTicketCreated(ticketNumber)]
```

## Proxy via service worker

Toda requisição HTTP passa pelo `background.ts`. O content script roda em `callsys.com.br` e não pode fazer fetch autenticado cross-origin para `bling.com.br` (CORS bloqueia e cookies são removidos). O `HttpClient` envia `chrome.runtime.sendMessage({ type: "BLING_FETCH", ... })`; o service worker, que detém os `host_permissions`, executa o `fetch` com `credentials: "include"` e devolve `{ ok, status, text }`.

## Tratamento de erros

| Ponto de falha | Causa | Mensagem ao usuário |
|----------------|-------|---------------------|
| CNPJ não encontrado no DOM | Atendimento sem CNPJ preenchido | "CNPJ não encontrado" |
| CNPJ inválido | Menos de 11/14 dígitos após limpeza | erro genérico |
| Empresa não encontrada | CNPJ não cadastrado no Bling | "Nenhuma empresa encontrada" |
| Sessão expirada | Resposta HTTP 401 | "Sessão expirada" |
| Timeout | Sem resposta em 10s | "Tempo excedido" |
| Erro na criação | Falha no POST do ticket | erro genérico de ticket |

Os erros são lançados em inglês nas camadas internas e mapeados para mensagens amigáveis em português na camada de apresentação (`content.ts → toCompanyErrorMessage()` e `MESSAGES`).

## Autenticação

A extensão não envia Bearer nem API key. O Chrome injeta automaticamente os cookies de sessão (`PHPSESSID`, `PCSID`, `bling_oauth_access`) nas requisições ao domínio `bling.com.br`, desde que o service worker use `credentials: "include"` e o usuário esteja logado no Bling em outra aba.
