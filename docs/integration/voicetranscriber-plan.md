# Plano de Integração — TicketLauncher → VoiceTranscriber

> **Status:** aprovado — implementação iniciada no TicketLauncher
> Todas as decisões em aberto do §5 foram fechadas em 2026-06-22.
> O lado TicketLauncher já captura `callId` e notifica o VT após criar o ticket; o lado VoiceTranscriber permanece como próxima etapa.
>
> **Data de referência:** 2026-06-22
> **Projetos:** `C:\Dev\TicketLauncher` (extensão Chrome) e `C:\Dev\VoiceTranscriber` (API Node + worker Python)
>
> **Revisão 2 (fluxo invertido):** a extensão passa a ser o **ponto de partida da transcrição**,
> substituindo o webhook como gatilho. O webhook do CallSys permanece como **caminho paralelo/legado, sem alterações**.

---

## 0. Resumo executivo

### 0.1 Novo fluxo (a extensão dispara a transcrição)

```
1. Atendente clica no bubble  →  ticket criado no Bling
2. Extensão captura { callId, ticketNumber, ticketId } e envia ao VoiceTranscriber (VT)
3. VT recebe os dados e consulta a API do CallSys com o callId p/ obter os dados da ligação
4. VT cria a ligação em `awaiting_callsys`, grava `record_link` como `audio_url`, e coloca em polling (job por call_id)
5. Quando o polling detecta a ligação concluída → promove para `received` e enfileira a transcrição
```

O **webhook `POST /webhooks/call-ended`** segue funcionando em paralelo, **sem mudanças** (caminho legado).

### 0.2 Chave de junção — CONFIRMADA

`Cód: 3317785` (DOM CallSys, `.text-chip.vs-chip--text`) **==** `call.id` do webhook **==** `calls.call_id` no VT.
Validado pelo usuário. Deixa de ser item bloqueante.

### 0.3 O que o VoiceTranscriber JÁ tem (reaproveitável)

A análise mostrou que **quase toda a maquinaria já existe**; a integração é majoritariamente **orquestração de peças existentes**, não código novo de base:

| Peça pronta | Arquivo | Papel na integração |
| --- | --- | --- |
| **Cliente da API CallSys por call_id** | `services/callsysReport.service.js` → `fetchCallsysExtensionCallReport(callId)` | Consulta os dados completos da ligação (POST `{callid}`) — **§2.2** |
| **Criação de linha `awaiting_callsys` + seed do poll + enfileiramento** | `modules/webhook/usecases/processCallEndedWebhook.usecase.js` → `persistCallsysDeferredAwaitingRow()` + `ensureCallsysPerCallPollJobScheduled()` | É exatamente o que um webhook **ONCALL** faz hoje — **§3.4** |
| **Fila + agendamento do poll por ligação** | `queues/callsysPerCallPoll.queue.js` → `enqueueCallsysPerCallPollJob({ callId, scheduledFor })` | Dedup por `callsys-poll-<callId>` |
| **Use case do poll (consulta CallSys, gate, promove, transcreve)** | `modules/callsys/usecases/runCallsysPerCallPoll.usecase.js` | Roda até concluir e chama `runPostReceivedTranscriptionPipeline` |
| **Gate de disposição** (`continue`/`deferred`/`skip`/`fail`) | `modules/webhook/utils/callsysCallFinalize.util.js` → `resolveCallsysReportDisposition()` | Decide quando a ligação está pronta |
| **Colunas de ticket na tabela `calls`** | migration `004` (`ticket_transcricao`, `cnpj_transcricao`) + whitelist `extractCallColumnUpdates` | Persistência do vínculo |

### 0.4 O que falta (trabalho real de implementação)

1. **Endpoint novo no VT** que recebe `{ callId, ticketNumber, ticketId }` e **orquestra**: consulta CallSys → grava `record_link` como `audio_url` → cria `awaiting_callsys` → agenda poll → grava o vínculo do ticket.
2. **Captura do `callId` no TicketLauncher** (scraper) e disparo (**§3.2/§3.3**).
3. **Extração de `persistCallsysDeferredAwaitingRow`** para módulo compartilhado (`seedAwaitingCall.util.js`) consumido tanto pelo webhook quanto pelo novo endpoint.
4. **Migrations** para colunas `bling_ticket_*` e tabela-ponte `callsys_ticket_links`.

> A lacuna da URL de áudio (§3.5) está **encerrada** — `record_link` é gravado como `audio_url` no seed do endpoint, sem mudanças no pipeline de polling.

---

## 1. Análise do TicketLauncher (origem dos dados)

### 1.1 Arquitetura e ponto de confirmação do ticket

Clean Architecture: `presentation → domain ← infrastructure`, `shared` transversal; `content.ts` orquestra via callbacks.

Ponto exato onde o ticket é confirmado — [content.ts:71-73](../../src/content.ts):

```ts
const result = await ticketUseCase.createTicket(currentCompany, message);
panel.showTicketCreated(result.ticketNumber);
```

`result` é `ITicketResult = { ticketNumber, ticketId }` ([bling.api.ts:47-50](../../src/infrastructure/bling.api.ts)). Neste momento já temos `result.ticketNumber`, `result.ticketId`, `currentCnpj` e `currentCompany`. Falta apenas o **código da ligação** (`Cód: 3317785`).

### 1.2 O proxy do service worker já é genérico

[background.ts:16-39](../../src/background.ts) faz `fetch(message.url, init)` para qualquer URL; o que limita é `host_permissions`. Para falar com o VT basta adicionar o host do VT a `host_permissions` e reutilizar `HttpClient` (que envia `type: "BLING_FETCH"`). O POST ao VT usa `Content-Type: application/json` (parametrizável por chamada).

---

## 2. Análise do VoiceTranscriber (destino + orquestração)

### 2.1 API e autenticação

`node-api/src/server.js`:

```
app.use("/webhooks",  webhookSecretAuthMiddleware,            webhookRoutes)   // header secreto
app.use("/dashboard", dashboardOperatorAuthMiddleware,        dashboardRoutes) // cookie/Basic
app.use("/calls",     apiOperatorAuthMiddleware,              callRoutes)      // cookie/Basic
app.use("/v1",        apiOperatorAuthExceptHealthMiddleware,  v1Routes)        // cookie/Basic (health livre)
```

Duas camadas de auth independentes (`docs/autenticacao-node-api.md`): **webhook** (header secreto `WEBHOOK_SECRET`, timing-safe) e **operador** (cookie/Basic). Para máquina-a-máquina (extensão) o modelo de **header secreto** é o adequado; **não** usar credenciais de operador. Ver §3.8.

### 2.2 Cliente da API CallSys — JÁ EXISTE

`services/callsysReport.service.js` expõe:

```js
fetchCallsysExtensionCallReport(callId)
//  → POST  CALLSYS_REPORT_API_URL   (relatório "queuecalls")
//    header: api-token: CALLSYS_REPORT_API_TOKEN
//    body  : { "callid": "<callId>" }            (campo configurável CALLSYS_REPORT_BODY_CALL_ID_FIELD)
//  → { ok, row, httpStatus, raw }   com row normalizada por normalizeCallsysQueueCallsReportRow()
```

**Este é o endpoint do CallSys que retorna os dados completos de uma ligação por `call_id`.** É o **mesmo** cliente que o poll por ligação e o webhook já usam. **Nenhum cliente novo é necessário.** A `row` traz (normalizados): `status`, `phone`, `datetime_start/answer/end`, `talk_time`, `call_time`, `active`, `record_link` (URL da gravação) e os campos brutos.

Config relevante (`node-api/.env.example`): `CALLSYS_REPORT_API_URL` (ex.: `https://bling.callsys.com.br/app/api/integra/report/queuecalls`), `CALLSYS_REPORT_API_TOKEN`, `CALLSYS_REPORT_API_TOKEN_HEADER=api-token`, `CALLSYS_REPORT_BODY_CALL_ID_FIELD=callid`, `CALLSYS_REPORT_HTTP_METHOD=POST`, `CALLSYS_REPORT_ALLOWED_HOSTS=bling.callsys.com.br`. Utilitários adicionais para contato/agentes em `modules/reprocess/callsysIntegraApi.util.js` (`resolveCallsysContactUrl`, `fetchCallsysJson`).

### 2.3 Como uma ligação entra em polling + transcrição (a "trilha" a reaproveitar)

Hoje, quando o webhook chega com a ligação **ainda ativa** (`status === "ONCALL"`), o processador faz exatamente o que o novo fluxo precisa — `processCallEndedWebhook.usecase.js`:

1. `persistCallsysDeferredAwaitingRow(normalized, msg)` → `createCall({ ...status: "awaiting_callsys", ...buildInitializedCallsysPerCallPollFields() })`.
2. `ensureCallsysPerCallPollJobScheduled(call)` → `enqueueCallsysPerCallPollJob({ callId, scheduledFor: call.callsys_next_poll_at })`.
3. O worker `runCallsysPerCallPollUseCase` (fila `callsys-call-poll`) consulta `fetchCallsysExtensionCallReport(callId)`, aplica `resolveCallsysReportDisposition`:
   - `deferred` → reagenda (`callsys_next_poll_at`) até `callsys_poll_max_attempts`;
   - `skip`/`fail` → fecha;
   - `continue` (ligação concluída e elegível) → promove a `received` e chama `runPostReceivedTranscriptionPipeline` (download do áudio + fila de transcrição).

> **Conclusão:** o novo endpoint deve **reusar essa trilha**. O fluxo da extensão é equivalente a "injetar uma ligação ONCALL" no sistema, sem depender do webhook.

### 2.4 Banco de dados (tabela `calls`)

Chave de negócio: `UNIQUE (call_id, source_key)` e `UNIQUE (idempotency_key)` onde `idempotency_key = "<source_key>:<call_id>"`. Colunas `NOT NULL`: `call_id`, `source_key`, `idempotency_key`, `company_id`, `branch_id`, `status`. `company_id`/`branch_id` usam defaults de env (`DEFAULT_COMPANY_ID`/`DEFAULT_BRANCH_ID`, fallback `empresa-001`/`filial-001` — ver `payload.adapter.js:352`).

Colunas de ticket já existentes (migration 004) e já no whitelist de update (`extractCallColumnUpdates`, `pgRuntimeRepository.js:490-501`):

| Coluna | Tipo | Origem hoje | Observação |
| --- | --- | --- | --- |
| `ticket_transcricao` | VARCHAR(128) | worker Python (extrai do .txt) | **não reusar** — risco de colisão com o worker |
| `cnpj_transcricao` | VARCHAR(20) | worker Python | idem |

**Colunas dedicadas aprovadas (§3.7):** `bling_ticket_numero`, `bling_ticket_id`, `bling_ticket_cnpj`, `bling_ticket_synced_at`. As colunas do worker Python permanecem intactas para reconciliação/auditoria.

### 2.5 Timing — RESOLVIDO pelo novo fluxo

No fluxo invertido a ligação **está sempre ativa** quando a extensão dispara (o atendente acabou de criar o ticket durante a chamada). O VT cria a linha proativamente em `awaiting_callsys` e faz o polling até concluir. **O problema de timing da revisão anterior deixa de existir.** A tabela-ponte (§3.7) passa a ser **registro autoritativo do vínculo ligação ↔ ticket**, não mais mitigação de timing.

---

## 3. Plano de integração (fluxo invertido)

### 3.1 Payload enviado pela extensão

`POST {VT_BASE_URL}/v1/integrations/callsys-ticket`, `Content-Type: application/json`:

```json
{
  "callId": "3317785",
  "ticketNumber": "5593155",
  "ticketId": "15856701046",
  "cnpj": "12345678000190",
  "companyName": "EMPRESA EXEMPLO LTDA",
  "source": "ticketlauncher"
}
```

| Campo | Origem | Obrigatório | Uso no VT |
| --- | --- | --- | --- |
| `callId` | scraper `extractCallId()` | sim | `call_id` + consulta CallSys |
| `ticketNumber` | `ITicketResult.ticketNumber` | sim | vínculo do ticket |
| `ticketId` | `ITicketResult.ticketId` | sim | vínculo do ticket |
| `cnpj` | `currentCnpj` | não | auditoria / `bling_ticket_cnpj` |
| `companyName` | `currentCompany.name` | não | log |
| `source` | constante | não | auditoria/log apenas — **não** particiona unicidade (ver §3.6) |

Resposta esperada: `202 { status: "accepted", callId, awaiting_callsys: true }` (orquestração assíncrona) ou `409 { status: "duplicate" }` se já houver linha para o `call_id`/`source_key`.

### 3.2 Captura do código da ligação (CallSys DOM)

```html
<span class="text-chip vs-chip--text">Cód: 3317785</span>
```

- **Seletor:** `.text-chip.vs-chip--text`; iterar e casar `/^\s*Cód:\s*(\d+)/i`, capturar os dígitos.
- **Ausência:** retornar `null` → **não** dispara a integração (sem chave não há vínculo); o ticket no Bling permanece criado e o usuário não é bloqueado (§3.9).
- **Onde:** novo método `extractCallId(): string | null` em [callsys.scraper.ts](../../src/infrastructure/callsys.scraper.ts) (mesma fonte DOM do `extractCnpj`); seletor em `Config.callsys.selectors.callIdChip`.

### 3.3 Disparo no TicketLauncher (camada e momento)

- **Camada:** [content.ts](../../src/content.ts), após `createTicket` ter sucesso (`:72`).
- **Estratégia:** **fire-and-forget** — o sucesso exibido (`showTicketCreated`) não depende da resposta do VT.
- **Clean Architecture:** novo `domain/usecases/notify-transcriber.usecase.ts` (`NotifyTranscriberUseCase.linkTicket(dto)`) chamando `infrastructure/voicetranscriber.api.ts` (usa `HttpClient`). Não acoplar ao `TicketUseCase`.

```text
1. result = await ticketUseCase.createTicket(...)
2. panel.showTicketCreated(result.ticketNumber)      // UX imediata, inalterada
3. const callId = scraper.extractCallId()
4. if (callId) void notifyTranscriberUseCase
       .linkTicket({ callId, result, cnpj: currentCnpj, company: currentCompany })
       .catch(log)                                    // silencioso (§3.9)
```

### 3.4 Orquestração no VT (o endpoint novo) — coração da revisão

`POST /v1/integrations/callsys-ticket` executa, em ordem:

1. **Validar** o body (`callId` + `ticketNumber` obrigatórios) → 400 se faltar.
2. **Registrar o vínculo** do ticket de forma autoritativa (tabela-ponte `callsys_ticket_links`, §3.7) — idempotente por `call_id`. Isso garante que o vínculo nunca se perde, independentemente do resultado da transcrição.
3. **Consultar o CallSys** com `fetchCallsysExtensionCallReport(callId)` (§2.2) para obter os dados da ligação (status, phone, document, datas, `record_link`, etc.).
4. **Gravar `record_link` como `audio_url`** antes de criar a linha — `resolveCallsysRecordLink(report)` já lê o campo correto. Ver §3.5.
5. **Construir o payload normalizado** a partir da `row` do relatório (reusando `normalizePayload` + `mergeCallsysReportIntoNormalized`), preenchendo `company_id`/`branch_id` com os defaults de env e `source_key` conforme §3.6.
6. **Semear a trilha de polling**: chamar a **mesma** função usada pelo webhook ONCALL — `seedAwaitingCall(normalized, "Ligacao ativa; iniciada pela extensão")` (extraída de `processCallEndedWebhook.usecase.js`, ver §3.4 nota abaixo) — que cria a linha `awaiting_callsys` com `audio_url` já populado, seta os campos do poll e **agenda o job** `enqueueCallsysPerCallPollJob`. Gravar também as colunas `bling_ticket_*` (§3.7) nessa criação/seed.
7. **Responder 202** imediatamente. O restante (polling → conclusão → transcrição) corre de forma assíncrona pela trilha existente (§2.3).

> **Reuso por extração (aprovado §5.6):** extrair `persistCallsysDeferredAwaitingRow` (hoje privada em `processCallEndedWebhook.usecase.js`) para `modules/callsys/seedAwaitingCall.util.js` e consumi-la tanto no webhook quanto no novo endpoint, evitando divergência. Esta refatoração é interna ao VT e **não** altera o comportamento do webhook.

**Decisão — disparar o poll na hora vs. esperar o agendamento:** `seedAwaitingCall` agenda o primeiro poll para `callsys_next_poll_at`. Como a ligação ainda está ativa, o primeiro poll provavelmente retornará `deferred` e reagendará — comportamento correto. Não é preciso poll imediato.

### 3.5 Origem da URL de áudio — RESOLVIDA (Opção A aprovada)

**Validação real:** `record_link` é retornado pelo `/report/queuecalls` **mesmo com a ligação em andamento** (`status: "ONCALL"`, `finished: false`). Response real observado:

```json
{
  "status": "ONCALL",
  "finished": false,
  "datetime_end": null,
  "record_link": "https://bling.callsys.com.br/app/api/integra/record/IN/3317506/1782138434.4052"
}
```

**Opção A aprovada:** no seed feito pelo endpoint da extensão, gravar `record_link` (lido via `resolveCallsysRecordLink(report)`) como `audio_url` na criação da linha `awaiting_callsys`. O `audio_url` fica populado desde o seed.

**Consequências:**
- O pipeline de polling (`runCallsysPerCallPoll.usecase.js`) lê `claimedCall.audio_url` — já estará preenchido, **sem nenhuma mudança necessária no polling**.
- `mergeCallsysReportIntoNormalized` **não é alterado** (continua ignorando `record_link` como `audio_url` no caminho do webhook — comportamento correto e intacto).
- A gravação de `audio_url = record_link` é responsabilidade exclusiva do `linkCallsysTicket.usecase.js` (passo 4 de §3.4), isolada no fluxo da extensão.

**A lacuna arquitetural está encerrada. Polling e webhook seguem sem mudanças.**

### 3.6 Coexistência com o webhook legado — DECIDIDO

**Decisão: mesmo `source_key` para webhook e extensão.**

Enquanto webhook e extensão coexistem, ambos usam o **mesmo `source_key`** (configurável via env, ex.: `"default"`). A unicidade `UNIQUE (call_id, source_key)` garante que o segundo a chegar para a mesma ligação receba `duplicate` (409) e não reprocesse. Sem dupla transcrição, sem lógica extra de dedupe.

O campo `source` do payload da extensão (§3.1) serve apenas para **auditoria/log**, não para particionar a unicidade.

> Variável de env sugerida: `INTEGRATION_TICKET_SOURCE_KEY` (default idêntico ao `DEFAULT_SOURCE_KEY` do webhook).

### 3.7 Banco de dados — colunas e tabela-ponte

**Migration nova** (Postgres + espelho MySQL), ex. `011__calls_bling_ticket_columns.sql`:

```sql
ALTER TABLE calls
  ADD COLUMN bling_ticket_numero    VARCHAR(32)  NULL DEFAULT NULL,
  ADD COLUMN bling_ticket_id        VARCHAR(32)  NULL DEFAULT NULL,
  ADD COLUMN bling_ticket_cnpj      VARCHAR(20)  NULL DEFAULT NULL,
  ADD COLUMN bling_ticket_synced_at TIMESTAMPTZ  NULL DEFAULT NULL;
```

+ acrescentar essas colunas ao whitelist `extractCallColumnUpdates` (`pgRuntimeRepository.js:400+`).

**Tabela-ponte (registro autoritativo do vínculo):**

```sql
CREATE TABLE callsys_ticket_links (
  id BIGSERIAL PRIMARY KEY,
  call_id VARCHAR(64) NOT NULL,
  source_key VARCHAR(64) NOT NULL DEFAULT 'ticketlauncher',
  ticket_numero VARCHAR(32) NOT NULL,
  ticket_id VARCHAR(32) NULL,
  cnpj VARCHAR(20) NULL,
  company_name VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_callsys_ticket_links UNIQUE (call_id, source_key)
);
```

O endpoint grava aqui **sempre** (passo 2 do §3.4) e espelha em `calls.bling_ticket_*` na criação/seed. Assim o vínculo é preservado mesmo que a transcrição falhe ou seja `skip`.

### 3.8 Autenticação do endpoint — DECIDIDO

**Token dedicado:**
- Variável de ambiente: `INTEGRATION_API_TOKEN`
- Header: `x-integration-token`
- Middleware: `integrationTokenAuth` independente, reutilizando o utilitário de comparação timing-safe de `webhookSecretAuth.middleware.js`
- Montagem: `app.use("/v1/integrations", integrationTokenAuthMiddleware, integrationRoutes)` **antes** do middleware de operador ou em prefixo próprio

**Não compartilhar o `WEBHOOK_SECRET`.**

**Segredo na extensão:**
O token **não é versionado nem embutido no bundle**. A extensão lê `chrome.storage.local["voiceTranscriberIntegrationToken"]` e envia o valor no header `x-integration-token`. Enquanto não houver tela de opções, a configuração é manual. Tráfego sempre **HTTPS** em produção (tunnel Cloudflare — `docs/guia-cloudflare-tunnel-local.md`).

**`host_permissions` (manifest):** adicionar o host do VT (`http://127.0.0.1:3000/*` em dev e/ou o domínio do tunnel em prod). Sem isso o `fetch` no service worker é bloqueado.

### 3.9 Tratamento de erros

Princípio: **o ticket no Bling já foi criado; nada na integração pode bloquear o fluxo principal.**

| Situação | Comportamento |
| --- | --- |
| `extractCallId()` retorna `null` | Não dispara; log discreto. Ticket segue como sucesso. |
| VT indisponível / timeout / 5xx | `catch` silencioso (fire-and-forget). Sucesso do ticket intacto. |
| VT aceita mas CallSys report falha | VT decide: reagendar (poll) ou registrar erro; **o vínculo já foi gravado** (tabela-ponte). |
| Falha de auth (401) | Log de erro; sem impacto no usuário. Sinaliza segredo/URL mal configurados. |
| `record_link` nunca aparece / ligação não conclui | Poll esgota (`callsys_poll_exhausted`) como hoje; vínculo permanece registrado. |

- **Visibilidade ao usuário:** silenciosa — **decisão confirmada (§5.7)**. Nenhum indicador de sincronização.
- **Idempotência:** endpoint idempotente por `call_id` (tabela-ponte UNIQUE + `createCall` já trata corrida → `duplicate`). Retry seguro.
- **Resiliência opcional:** 1–2 tentativas com backoff no use case da extensão, ainda fire-and-forget.

---

## 4. Arquivos a criar / modificar

**TicketLauncher** (`C:\Dev\TicketLauncher`)

| Ação | Arquivo | Conteúdo |
| --- | --- | --- |
| criar | `src/domain/usecases/notify-transcriber.usecase.ts` | `NotifyTranscriberUseCase.linkTicket(dto)` |
| criar | `src/infrastructure/voicetranscriber.api.ts` | `VoiceTranscriberApi.linkTicket(payload)` via `HttpClient` |
| modificar | `src/shared/types.ts` | tipo `ITicketLinkPayload` (DTO §3.1) |
| modificar | `src/infrastructure/callsys.scraper.ts` | `extractCallId(): string \| null` |
| modificar | `src/shared/config.ts` | bloco `voiceTranscriber` + `callsys.selectors.callIdChip` |
| modificar | `src/content.ts` | disparo fire-and-forget após `createTicket` (§3.3) |
| modificar | `manifest.json` | host do VT em `host_permissions` + permissão `storage` |
| modificar (docs) | `docs/architecture/decisions.md`, `CHANGELOG.md` | ADR do armazenamento local do token + registro da integração |

**VoiceTranscriber** (`C:\Dev\VoiceTranscriber`)

| Ação | Arquivo | Conteúdo |
| --- | --- | --- |
| criar | `node-api/src/routes/integration.routes.js` | rota `POST /v1/integrations/callsys-ticket` |
| criar | `node-api/src/middleware/integrationTokenAuth.middleware.js` | auth por `INTEGRATION_API_TOKEN`, timing-safe |
| criar | `node-api/src/modules/integrations/usecases/linkCallsysTicket.usecase.js` | orquestração §3.4 (vínculo → CallSys → `audio_url` → seed → poll) |
| criar | `node-api/src/modules/callsys/seedAwaitingCall.util.js` | **extração** de `persistCallsysDeferredAwaitingRow` p/ reuso (§5.6) |
| criar | `packages/database/postgres/migrations/011__calls_bling_ticket_columns.sql` (+ espelho MySQL) | colunas `bling_ticket_*` |
| criar | `packages/database/postgres/migrations/012__callsys_ticket_links.sql` (+ espelho MySQL) | tabela-ponte |
| modificar | `node-api/src/modules/webhook/usecases/processCallEndedWebhook.usecase.js` | passar a consumir `seedAwaitingCall.util.js` (sem mudar comportamento) |
| modificar | `node-api/src/repositories/runtime/pgRuntimeRepository.js` | whitelist `bling_ticket_*` + métodos da tabela-ponte |
| modificar | `node-api/src/server.js` | montar `/v1/integrations` sob `integrationTokenAuth` |
| modificar | `node-api/.env.example` | `INTEGRATION_API_TOKEN`, `INTEGRATION_TICKET_SOURCE_KEY`, garantir `CALLSYS_REPORT_API_URL/TOKEN` |
| modificar (docs) | `docs/architecture/decisions.md`, `CHANGELOG.md` | referência da nova integração |

> **Pré-requisito operacional:** a consulta ao CallSys exige `CALLSYS_REPORT_API_URL` + `CALLSYS_REPORT_API_TOKEN` configurados (`isCallsysExtensionReportConfigured()`), e `CALLSYS_POLL_ENABLED=true` para o worker de poll por ligação. Sem isso, o novo fluxo não consegue obter os dados da ligação nem promovê-la.

---

## 5. Decisões em aberto — TODAS FECHADAS

1. **Origem do áudio (§3.5):** ✅ **Opção A aprovada.** `record_link` disponível mesmo com ligação `ONCALL`. Gravado como `audio_url` no seed do endpoint da extensão. Polling e webhook sem mudanças.

2. **Coexistência com webhook (§3.6):** ✅ **Mesmo `source_key`** para webhook e extensão. Primeiro a chegar cria a linha; segundo recebe `duplicate` (409). Zero dupla transcrição. Campo `source` do payload é só auditoria.

3. **Auth do endpoint (§3.8):** ✅ **Token dedicado** `INTEGRATION_API_TOKEN`, header `x-integration-token`, middleware `integrationTokenAuth` independente com comparação timing-safe. Sem compartilhar `WEBHOOK_SECRET`.

4. **Segredo na extensão:** ✅ **Token em `chrome.storage.local`**. Nada de segredo versionado ou embutido no bundle; tela de opções fica como melhoria futura.

5. **Colunas `bling_ticket_*` (§3.7):** ✅ **Colunas dedicadas aprovadas.** `bling_ticket_numero`, `bling_ticket_id`, `bling_ticket_cnpj`, `bling_ticket_synced_at`. Colunas `ticket_transcricao`/`cnpj_transcricao` do worker Python preservadas intactas.

6. **Reuso por extração (§3.4):** ✅ **Extração aprovada.** `persistCallsysDeferredAwaitingRow` será extraída para `modules/callsys/seedAwaitingCall.util.js`, consumida pelo webhook e pelo novo endpoint. Sem duplicação de lógica.

7. **UX:** ✅ **100% silenciosa.** Nenhum indicador de sincronização no widget por ora.

---

## 6. Ordem de implementação

### Fase 1 — VoiceTranscriber: migrations

- Colunas `bling_ticket_numero`, `bling_ticket_id`, `bling_ticket_cnpj`, `bling_ticket_synced_at` na tabela `calls` (migration `011`)
- Tabela `callsys_ticket_links` (migration `012`)
- Adicionar `bling_ticket_*` ao whitelist `extractCallColumnUpdates` em `pgRuntimeRepository.js`

### Fase 2 — VoiceTranscriber: refatoração de reuso

- Extrair `persistCallsysDeferredAwaitingRow` para `modules/callsys/seedAwaitingCall.util.js`
- Webhook passa a consumir o util — **zero mudança de comportamento**

### Fase 3 — VoiceTranscriber: endpoint + auth

- Middleware `integrationTokenAuth` (`x-integration-token`, `INTEGRATION_API_TOKEN`, timing-safe)
- Rota `POST /v1/integrations/callsys-ticket` em `integration.routes.js`
- Use case `linkCallsysTicket.usecase.js`:
  - valida body
  - grava `callsys_ticket_links`
  - chama `fetchCallsysExtensionCallReport(callId)`
  - lê `record_link` via `resolveCallsysRecordLink(report)` → inclui como `audio_url` no normalized
  - chama `seedAwaitingCall` com `audio_url` populado
  - grava `bling_ticket_*` na linha criada
  - responde 202
- Montar em `server.js` **fora/antes** do middleware de operador
- Atualizar `node-api/.env.example` com `INTEGRATION_API_TOKEN`, `INTEGRATION_TICKET_SOURCE_KEY`

### Fase 4 — TicketLauncher: scraper + integração

- `extractCallId(): string | null` em `callsys.scraper.ts` (seletor `.text-chip.vs-chip--text`, regex `/^\s*Cód:\s*(\d+)/i`)
- `Config.callsys.selectors.callIdChip` e bloco `voiceTranscriber` em `config.ts`
- Tipo `ITicketLinkPayload` em `types.ts`
- `VoiceTranscriberApi` em `infrastructure/voicetranscriber.api.ts`
- `NotifyTranscriberUseCase` em `domain/usecases/notify-transcriber.usecase.ts`
- Disparo fire-and-forget em `content.ts` após `createTicket` (§3.3)
- Host do VT em `host_permissions` no `manifest.json`
- Permissão `storage` no `manifest.json`
- Token lido de `chrome.storage.local["voiceTranscriberIntegrationToken"]`

### Fase 5 — Teste ponta-a-ponta

- Confirmar `CALLSYS_REPORT_API_URL`, `CALLSYS_REPORT_API_TOKEN` e `CALLSYS_POLL_ENABLED=true` configurados
- Criar ligação real, acionar o bubble, criar ticket
- Verificar linha `awaiting_callsys` criada, `audio_url` populado com `record_link` e poll agendado
- Verificar coexistência com webhook: segundo a chegar retorna `duplicate` (409)
- Aguardar conclusão da ligação e verificar promoção para `received` → transcrição

### Fase 6 — Documentação

- ADR em `docs/architecture/decisions.md`: registrar a integração e o armazenamento local do token
- `CHANGELOG.md` nos dois projetos (TicketLauncher e VoiceTranscriber)
