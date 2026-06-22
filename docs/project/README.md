# Bling - Criar Ticket

Extensão Chrome que permite criar tickets de suporte no Bling diretamente da tela de atendimento do callsys, sem alternar de aba ou redigitar dados da empresa.

## O que é

Um bubble flutuante injetado na tela do callsys (`https://bling.callsys.com.br/omnichannel`). Com um clique, a extensão captura o CNPJ do atendimento ativo, busca a empresa no Bling e cria o ticket de suporte com os dados preenchidos automaticamente.

## Por que existe

Agentes de suporte precisavam sair da tela do callsys e abrir o Bling manualmente para registrar cada ticket — copiando dados da empresa à mão. Isso consumia tempo e abria espaço para erros de digitação durante o atendimento.

## Como funciona

1. O agente abre o callsys com um atendimento ativo.
2. Clica no bubble "Iniciar Atendimento".
3. A extensão lê o CNPJ do campo da tela.
4. Consulta a API do Bling e exibe o nome da empresa encontrada.
5. O agente digita a mensagem do atendimento e confirma.
6. A extensão cria o ticket e exibe o número gerado.

## Pré-requisitos

- Google Chrome instalado
- Conta no Bling com sessão ativa (logado em uma aba)
- Acesso ao callsys com atendimento aberto

## Links úteis

- [Configuração do ambiente](../guides/setup.md)
- [Instalação da extensão](../guides/install-extension.md)
- [Como usar](../guides/how-to-use.md)
