# Guia de contribuição

## Configuração do ambiente

Veja [docs/guides/setup.md](../guides/setup.md) para instruções completas de instalação e build.

## Convenções de código

- **Inglês** em todo o código, sem exceção (nomes de variáveis, funções, classes, comentários).
- **Clean Architecture**: respeite a direção de dependências (`presentation → domain ← infrastructure`, `shared` é importado por todos e não importa ninguém).
- **TypeScript strict**: `strict: true`, `noUncheckedIndexedAccess: true`. Nenhum `any` — use `unknown` e estreite o tipo.
- **Indentação com TABS** (1 tab por nível).
- Nenhuma string ou URL hardcoded fora de `src/shared/config.ts` e `src/shared/constants.ts`.

## Nomenclatura

| Tipo       | Regra                       | Correto                          | Incorreto             |
|------------|-----------------------------|----------------------------------|-----------------------|
| Função     | verbo + substantivo         | `fetchCompanyByCnpj()`           | `company()`           |
| Variável   | camelCase descritivo        | `companyName`                    | `cn`, `data1`         |
| Booleano   | prefixo `is`/`has`/`can`     | `isValid`, `hasError`, `isOpen`  | `valid`, `error`      |
| Constante  | UPPER_SNAKE_CASE            | `HTTP_TIMEOUT_MS`                | `httpTimeout`         |
| Classe     | PascalCase                  | `CompanyUseCase`                 | `companyUsecase`      |

## Antes de commitar

- [ ] `npm run typecheck` passa sem erros
- [ ] `npm run build` gera `dist/` sem erros
- [ ] Nenhuma string ou URL hardcoded fora de `config.ts`/`constants.ts`
- [ ] Nenhum `any` no TypeScript
- [ ] Indentação com tabs

## Estrutura de commits

Adote [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add bubble animation on ticket creation
fix: handle empty CNPJ field gracefully
refactor: extract xml builder to shared layer
docs: add data flow diagram
chore: upgrade esbuild to 0.21
```

Prefixos: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`.
