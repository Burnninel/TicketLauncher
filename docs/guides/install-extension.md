# Instalação da extensão no Chrome

Antes de instalar, gere a pasta `dist/` com `npm run build` (veja [setup.md](setup.md)).

## Passo a passo

1. Abra o Chrome e acesse `chrome://extensions`.
2. Ative o **"Modo do desenvolvedor"** (toggle no canto superior direito).
3. Clique em **"Carregar sem compactação"**.
4. Selecione a pasta **`dist/`** (gerada pelo build).
5. A extensão aparece listada como **"Bling - Criar Ticket"**.

> Observação: sempre rode `npm run build` antes de carregar ou recarregar a extensão. O build copia o `manifest.json` e a pasta `assets/` para dentro de `dist/`, tornando-a autocontida.

## Verificação

- A extensão aparece em `chrome://extensions` sem erros listados.
- Ao abrir `https://bling.callsys.com.br/omnichannel` com um atendimento ativo, o bubble "Iniciar Atendimento" surge no canto inferior direito.

## Atualização

Sempre que o código mudar:

1. Rode `npm run build` para regenerar `dist/`.
2. Em `chrome://extensions`, clique no ícone de atualizar (↻) no card da extensão.
3. Recarregue a aba do callsys.
