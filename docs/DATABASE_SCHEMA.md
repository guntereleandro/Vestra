# Schema de banco — CORE-05 e CORE-06

Status: aplicado e validado no Supabase Development em 2026-07-31. As três migrations da CORE-05 e a migration da CORE-06 estão registradas remotamente.

## CORE-08 - preferencia da fonte

`portfolio_preferences.data_source` aceita somente `LOCAL` ou `SUPABASE`, possui default `LOCAL` e nao cria tabela financeira. A preferencia pertence a carteira.

## Escopo

A CORE-05 introduz somente identidade de negócio e autorização:

- `public.profiles`;
- `public.portfolios`;
- `public.portfolio_members`;
- enum `public.portfolio_role`.

Operações, proventos e snapshots ainda não possuem tabelas. O Provider Local continua sendo a fonte operacional da interface.

## Domínio persistente CORE-06

- `portfolio_assets`: catálogo mestre por carteira, com PK `(portfolio_id, ticker)`;
- `portfolio_asset_quotes`: entradas manual/automática de preço; preço efetivo continua derivado pela engine JavaScript;
- `portfolio_preferences`: estratégia diagnóstica e perfil de risco tipados por carteira;
- `user_portfolio_preferences`: carteira ativa por Auth User.

Campos derivados de mercado (`effectivePrice`, indicadores, dividendos do provider e payloads de quote embutidos) não são duplicados. `target_allocation` e respostas do questionário usam JSONB por serem mapas dinâmicos; os demais campos possuem colunas e constraints explícitas.

## Operações CORE-07

`portfolio_operations` possui UUID, `portfolio_id`, snapshot de ticker/nome/tipo, enum com os cinco tipos atuais, data civil, quantidade, preço unitário, taxas, valor de renda, notas, origem, ID externo opcional, autor e timestamps.

Quantidade usa `numeric(28,8)` e dinheiro `numeric(24,8)`. Compra/venda exigem quantidade positiva e não aceitam `income_amount`; renda exige quantidade/preço zero e `income_amount` positivo. Não existem colunas de preço médio, saldo, posição, lucro, patrimônio ou totais. Ticker é referência histórica, sem FK obrigatória ao catálogo.

## Convenções

- UUID em chaves primárias e estrangeiras.
- `timestamptz` com valores produzidos pelo servidor PostgreSQL.
- nomes `snake_case`.
- constraints e ações de exclusão explícitas.
- moeda ISO com três letras maiúsculas.
- locale e timezone como textos validados.
- nenhuma coluna de marca, e-mail, senha, token ou claim.

## `profiles`

Uma linha por `auth.users`, com `id` compartilhado e `on delete cascade`.

| Coluna | Contrato |
|---|---|
| `id` | UUID, PK e FK para `auth.users(id)` |
| `display_name` | texto obrigatório, até 120 caracteres |
| `avatar_url` | opcional, até 2048 caracteres |
| `locale` | padrão `pt-BR` |
| `default_currency` | padrão `BRL` |
| `timezone` | padrão `America/Sao_Paulo` |
| `created_at`, `updated_at` | `timestamptz` |

O e-mail permanece exclusivamente no Supabase Auth.

## `portfolios`

Representa a fronteira de autorização futura. `created_by` registra o criador original; ownership efetivo vem de `portfolio_members`.

| Coluna | Contrato |
|---|---|
| `id` | UUID gerado pelo PostgreSQL |
| `name` | obrigatório, de 1 a 120 caracteres úteis |
| `slug` | opcional, formato URL-safe |
| `description` | opcional, até 500 caracteres |
| `base_currency` | padrão `BRL` |
| `timezone` | padrão `America/Sao_Paulo` |
| `created_by` | FK para `auth.users`, `on delete restrict` |
| `is_archived` | padrão `false`; substitui exclusão física |
| `created_at`, `updated_at` | `timestamptz` |

Não há INSERT ou DELETE direto pela Data API. A criação ocorre pela RPC atômica.

## `portfolio_members`

Relação N:N entre Auth User e carteira.

| Coluna | Contrato |
|---|---|
| `portfolio_id`, `user_id` | PK composta; impedem duplicação |
| `role` | enum `owner`, `editor` ou `viewer` |
| `invited_by` | Auth User opcional, `on delete set null` |
| `accepted_at` | instante opcional de aceite |
| `created_at`, `updated_at` | `timestamptz` |

O enum PostgreSQL foi escolhido porque o conjunto é pequeno, estável e participa diretamente das regras de autorização. Alterações futuras exigirão migration explícita.

## Integridade

- `create_portfolio_with_owner` cria carteira e owner na mesma transação.
- `protect_membership` impede troca das chaves da associação e remoção/rebaixamento do último owner.
- A remoção server-only de uma carteira pode executar a cascata de memberships; exclusão ou rebaixamento direto do último owner continua bloqueado.
- `protect_portfolio_identity` impede alteração de `created_by`.
- `set_updated_at` mantém timestamps sem depender do cliente.
- backfill idempotente cria somente IDs de profiles para usuários já existentes.

O backfill remoto foi confirmado por contagem sanitizada: todos os Auth Users existentes possuem Profile. Nenhum e-mail ou UUID foi registrado.
