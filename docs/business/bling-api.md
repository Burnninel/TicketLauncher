# Endpoints da API do Bling

A extensão usa dois endpoints da API interna do Bling. A autenticação é feita pelos cookies da sessão ativa, injetados automaticamente pelo Chrome (ver [data-flow.md](../architecture/data-flow.md)).

## Busca de empresa por CNPJ

```
GET https://www.bling.com.br/Api/v3/adm-empresas/empresas

Query params:
  pesquisa={cnpj_limpo}  (somente números)
  pagina=1
  habilitarContagem=0
  ordem=nome
  situacao=Todas
  situacaoContrato=Todos
  sorteadaMigrar=A

Headers:
  x-api-revision: 3.1.0
  (cookies de sessão injetados automaticamente pelo Chrome)

Resposta de sucesso (200):
{
  "data": {
    "data": [
      {
        "id": 14880053114,
        "nome": "Nome da Empresa"
      }
    ],
    "paginacao": {
      "totalRegistros": 1
    }
  }
}

Campos utilizados: data.data[0].id, data.data[0].nome
Resposta sem resultado: data.data[] vazio → empresa não encontrada
```

## Criação de ticket

```
POST https://www.bling.com.br/services/tickets.server.php?f=salvarNovoTicket

Headers:
  Content-Type: application/x-www-form-urlencoded
  (cookies de sessão injetados automaticamente pelo Chrome)

Body (URL-encoded):
  xajax=salvarNovoTicket
  xajaxr={timestamp_ms}
  xajaxargs[]=0
  xajaxargs[]={xml_uri_encoded}
  xajaxargs[]=false

XML (antes do encodeURIComponent):
  <xjxobj>
    <e><k>idEmpresa</k><v>{id}</v></e>
    <e><k>idIncidente</k><v></v></e>
    <e><k>empresa</k><v>{nome}</v></e>
    <e><k>mensagem</k><v>{mensagem}</v></e>
    <e><k>tipo</k><v>D</v></e>
    <e><k>prioridade</k><v>N</v></e>
    <e><k>grupo</k><v>8</v></e>
    <e><k>subgrupo</k><v>null</v></e>
    <e><k>ticketProblema</k><v>561</v></e>
    <e><k>funcionalidade</k><v>null</v></e>
    <e><k>ligacaoTelefonica</k><v>S</v></e>
    <e><k>registroChat</k><v>null</v></e>
  </xjxobj>

Resposta de sucesso (200):
  {"status":"success","numero":"5593155","id":"15856701046"}

Protocolo: xajax (framework PHP legado de AJAX)
```

## Observações

- As chaves do XML (`idEmpresa`, `tipo`, etc.) e os query params (`pesquisa`, `pagina`, etc.) permanecem em português por serem parte do contrato externo do Bling. O código interno usa nomes em inglês e mapeia para essas chaves em `XmlBuilder` e `BlingApi`.
- A resposta usa `nome` (empresa) e `numero`/`id` (ticket) — campos preservados em português pela mesma razão.
