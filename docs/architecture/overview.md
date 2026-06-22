# Visão geral da arquitetura

O projeto adota Clean Architecture em 4 camadas. Cada camada tem uma responsabilidade única e uma direção de dependência restrita.

## Estrutura de pastas

```
src/
├── presentation/      UI injetada no DOM (bubble, painel, estados visuais)
│   ├── bubble.ts
│   ├── panel.ts
│   ├── status.ts
│   └── styles.css
├── domain/            Entidades e casos de uso (agnóstico ao ambiente)
│   ├── entities/
│   │   ├── company.entity.ts
│   │   └── ticket.entity.ts
│   └── usecases/
│       ├── company.usecase.ts
│       └── ticket.usecase.ts
├── infrastructure/    Implementações concretas (HTTP, DOM scraping)
│   ├── http.client.ts
│   ├── bling.api.ts
│   └── callsys.scraper.ts
├── shared/            Utilitários puros sem dependências das outras camadas
│   ├── config.ts
│   ├── constants.ts
│   ├── types.ts
│   ├── cnpj.formatter.ts
│   └── xml.builder.ts
├── content.ts         Entry point do content script
└── background.ts      Service worker (proxy de requisições)
```

## Camadas e responsabilidades

- **`presentation/`** — UI injetada no DOM (bubble, painel, estados visuais). Não contém lógica de negócio nem acesso a rede.
- **`domain/`** — Entidades e casos de uso. Totalmente agnóstico ao ambiente: sem DOM, sem `fetch`, sem `chrome.*`.
- **`infrastructure/`** — Implementações concretas que tocam o mundo externo (HTTP via service worker, scraping do DOM do callsys).
- **`shared/`** — Utilitários puros, tipos, configuração e constantes. Não depende de nenhuma outra camada.

## Regra de dependência

```
presentation → domain ← infrastructure
                 ↑
              shared  (todos importam; shared não importa ninguém)
```

- `domain` nunca importa `infrastructure` nem `presentation`.
- `infrastructure` nunca importa `presentation`.
- `shared` não importa nenhuma das outras camadas.

## Por que essa arquitetura

- **Trocar a API é barato**: alterar o Bling exige mexer apenas em `infrastructure`.
- **Testar o domínio é simples**: casos de uso não dependem de DOM nem rede, dispensando mocks pesados.
- **Clareza de localização**: a camada de cada trecho de código é óbvia pela responsabilidade.
