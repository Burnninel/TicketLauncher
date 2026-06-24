# Plano de autenticação da integração VoiceTranscriber

## Objetivo

Eliminar a configuração manual do token da extensão antes da distribuição para a equipe inteira.

Para o teste pontual com um atendente, a extensão pode usar um token vindo do `.env` no momento do build. Isso simplifica o piloto, mas não deve ser tratado como solução final de produção.

## Estado temporário para piloto

### Como funciona

1. O arquivo `.env` local da extensão define `VOICE_TRANSCRIBER_INTEGRATION_TOKEN`.
2. O `npm run build` lê esse valor e embute no bundle gerado em `dist/content.js`.
3. A extensão envia o token no header `x-integration-token`.
4. O VoiceTranscriber valida esse valor contra `INTEGRATION_API_TOKEN`.

### Arquivos envolvidos

- `esbuild.config.js`: lê o `.env` e injeta a constante de build.
- `src/shared/config.ts`: guarda o valor injetado.
- `src/infrastructure/voicetranscriber.api.ts`: usa o token do build; se vazio, ainda tenta o fallback antigo via `chrome.storage.local`.
- `.env.example`: referência da variável esperada.

### Cuidados

- Não commitar `.env`.
- Não publicar essa build para muitos usuários como solução definitiva.
- Qualquer pessoa com acesso ao pacote da extensão consegue inspecionar o token embutido.
- Usar apenas para teste controlado.

## Opção recomendada sem depender do Bling: Google corporativo

### Ideia

O atendente usa a extensão em um perfil do Chrome autenticado com a conta Google corporativa, por exemplo `nome@bling.com.br`.

A extensão pede ao Chrome uma comprovação temporária dessa conta. O VoiceTranscriber valida essa comprovação com o Google e aceita apenas usuários do domínio permitido.

### Fluxo

1. Atendente está logado no Chrome com `@bling.com.br`.
2. Atendente cria o ticket pela extensão.
3. A extensão pede um token temporário ao Chrome/Google.
4. A extensão chama o VoiceTranscriber com `Authorization: Bearer <token_google>`.
5. O VoiceTranscriber valida o token com o Google.
6. Se o email for do domínio permitido, a requisição é aceita.

### Mudanças na extensão

1. Adicionar permissões no `manifest.json`:

```json
"permissions": [
  "storage",
  "identity",
  "identity.email"
]
```

2. Adicionar configuração OAuth no `manifest.json`:

```json
"oauth2": {
  "client_id": "CLIENT_ID_DA_EXTENSAO.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

3. Criar um gateway de autenticação na extensão:

- chama `chrome.identity.getAuthToken`;
- tenta primeiro sem popup;
- se necessário, usa modo interativo quando o usuário clicar para criar o ticket;
- não salva token permanente no `chrome.storage.local`.

4. Alterar `VoiceTranscriberApi`:

- remover `x-integration-token` no modo final;
- enviar `Authorization: Bearer <token_google>`.

### Mudanças no VoiceTranscriber

1. Criar middleware de autenticação Google para `/v1/integrations`.
2. Validar o token recebido com o Google.
3. Conferir:

- email verificado;
- domínio permitido, inicialmente `bling.com.br`;
- client ID esperado da extensão;
- token ainda válido.

4. Registrar no contexto da request:

```js
req.integrationUser = {
  provider: "google",
  email,
  sub
};
```

5. Opcionalmente persistir `integration_user_email` em logs ou tabela de auditoria.

### Variáveis sugeridas no VoiceTranscriber

```env
INTEGRATION_AUTH_MODE=google
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_ALLOWED_DOMAINS=bling.com.br
```

Durante transição:

```env
INTEGRATION_AUTH_MODE=google_or_static
```

Assim o token fixo atual continua funcionando como fallback até a migração terminar.

### Vantagens

- Não depende de mudança no Bling.
- Não exige configuração manual por atendente.
- Novo usuário funciona se estiver usando conta corporativa permitida.
- Saída de funcionário fica coberta quando a conta Google corporativa perde acesso.
- Permite auditar qual email iniciou a transcrição.

### Limitações

- Garante que o usuário tem conta Google do domínio, mas não prova sozinho que ele tem permissão específica no Bling.
- A proteção prática continua forte porque a extensão só chama o VoiceTranscriber depois que o ticket foi criado com sucesso usando a sessão real do Bling.

## Opção ideal com apoio do Bling: token curto emitido pelo Bling

### Ideia

O Bling seria a fonte de confiança. A extensão pediria um token curto ao próprio Bling usando a sessão já ativa do usuário.

### Fluxo

1. Atendente está logado no Bling.
2. A extensão pede ao Bling um token curto para o VoiceTranscriber.
3. O Bling valida sessão e permissão do usuário.
4. O Bling emite um JWT curto.
5. A extensão envia esse JWT ao VoiceTranscriber.
6. O VoiceTranscriber valida assinatura, expiração e permissão.

### Mudanças no Bling

1. Criar endpoint interno, por exemplo:

```http
POST /api/integrations/voice-transcriber/token
```

2. Validar a sessão atual do usuário.
3. Validar se o usuário tem permissão para usar a integração.
4. Emitir JWT com validade curta, por exemplo 5 minutos.
5. Expor chave pública/JWKS ou combinar chave segura com o VoiceTranscriber.

### Mudanças na extensão

1. Chamar o endpoint do Bling usando a sessão atual do navegador.
2. Receber JWT curto.
3. Enviar `Authorization: Bearer <jwt>` para o VoiceTranscriber.
4. Cachear apenas em memória ou `chrome.storage.session`, nunca como segredo permanente.

### Mudanças no VoiceTranscriber

1. Criar middleware JWT.
2. Validar:

- emissor `bling`;
- audiência `voice-transcriber`;
- expiração;
- assinatura;
- grupos/permissões.

3. Auditar usuário que disparou a integração.

### Vantagens

- Melhor controle de permissão real.
- O acesso acompanha exatamente o usuário logado no Bling.
- Excelente auditoria.
- Não guarda segredo na extensão.

### Limitações

- Depende de aprovação e implementação dentro do Bling.
- Pode demorar mais para sair.

## Decisão sugerida

1. Piloto imediato: `.env` no build da extensão.
2. Produção sem depender do Bling: Google corporativo via `chrome.identity`.
3. Futuro ideal, se houver abertura interna: JWT curto emitido pelo Bling.
