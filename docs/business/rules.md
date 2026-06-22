# Regras de negócio

## Regras do ticket

- Todo ticket criado pela extensão usa os valores padrão definidos em `TICKET_DEFAULTS` (`src/shared/constants.ts`).
- O CNPJ capturado deve ter 11 (CPF) ou 14 (CNPJ) dígitos após a limpeza de formatação.
- A empresa deve existir no Bling antes de o ticket ser criado.
- A mensagem é o único campo preenchido pelo usuário no momento da criação.

## Valores fixos do ticket

| Campo | Valor | Significado |
|-------|-------|-------------|
| `tipo` | `D` | Dúvida |
| `prioridade` | `N` | Normal |
| `grupo` | `8` | Grupo padrão |
| `ticketProblema` | `561` | Problema padrão |
| `ligacaoTelefonica` | `S` | Sim |

## Restrições

- O usuário deve estar autenticado no Bling para que a extensão funcione.
- A extensão só é injetada na URL `https://bling.callsys.com.br/omnichannel*`.
- Não é possível criar ticket sem CNPJ preenchido no atendimento ativo.

## Futuras evoluções previstas

- Campo de seleção de grupo.
- Seleção de tipo de ticket.
- Histórico de tickets criados na sessão.
