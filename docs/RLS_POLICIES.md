# Políticas RLS — CORE-05

Todas as tabelas públicas da etapa possuem Row Level Security explícito. Não existem policies para `anon`.

## CORE-10 — portfolio_snapshots

Owner/editor/viewer podem selecionar snapshots da carteira. Owner/editor podem inserir e atualizar. DELETE não é concedido ao cliente. Anon e usuário sem membership não acessam linhas; a carteira A não lê a B.

## CORE-08 - fonte operacional

`data_source` reutiliza as policies de `portfolio_preferences`: membros leem; owner/editor escrevem; viewer nao altera. RLS continua sendo a autoridade final.

## Defesa em profundidade

RLS e privilégios SQL são aplicados juntos:

- `anon` e `public` recebem `REVOKE ALL`;
- `authenticated` recebe apenas operações necessárias;
- INSERT direto em `portfolios` e DELETE físico não são concedidos;
- funções administrativas internas não são executáveis pelo cliente;
- a RPC de criação é executável apenas por `authenticated`.

`service_role` permanece restrito ao servidor e não participa dos fluxos normais. Possui somente SELECT nas três tabelas e DELETE em portfolios para auditoria sanitizada e limpeza controlada de testes; não é importado pelo navegador.

## Profiles

| Operação | Regra |
|---|---|
| SELECT | somente `id = auth.uid()` |
| INSERT | somente profile com `id = auth.uid()` |
| UPDATE | somente o próprio profile, preservando o mesmo ID |
| DELETE | não concedido e sem policy |

## Portfolios

| Operação | Regra |
|---|---|
| SELECT | somente membros da carteira |
| INSERT | bloqueado; usar RPC atômica |
| UPDATE | somente owner |
| DELETE | não concedido; owner usa `is_archived` |

Na CORE-05, editor e viewer possuem leitura. Edição por editor foi deliberadamente adiada até existirem campos financeiros com uma matriz de permissão concreta.

## Portfolio members

| Operação | Regra |
|---|---|
| SELECT | qualquer membro da carteira |
| INSERT | somente owner; não pode inserir a si próprio |
| UPDATE | somente owner; chaves são imutáveis |
| DELETE | somente owner; não pode remover a si próprio |

O trigger de integridade também impede remover ou rebaixar o último owner, inclusive por caminhos privilegiados que não dependam de RLS.

## Funções auxiliares

`is_portfolio_member` e `is_portfolio_owner` são `SECURITY DEFINER`, possuem `search_path = ''`, nomes totalmente qualificados e escopo somente de leitura booleana. Isso evita recursão de policies sobre `portfolio_members`.

`create_portfolio_with_owner`:

- exige `auth.uid()`;
- ignora qualquer identidade fornecida pelo cliente;
- define `created_by` e `user_id` a partir da sessão;
- cria carteira e membership owner atomicamente;
- usa `search_path = ''`;
- não exige secret key no navegador.

## Evidências

`supabase/tests/database/core_05_rls.test.sql` cobre usuários A, B e C, anon, profile próprio, isolamento, owner, editor, membership, autoelevação, último owner e cascata administrativa. Os testes executam com os papéis PostgreSQL reais `authenticated` e `anon`.

No Development remoto, a mesma matriz foi repetida pelo SDK com contas artificiais: profile próprio, RPC, update por owner, leitura por viewer/editor, bloqueios de escrita, isolamento sem membership, bloqueio anon e proteção do último owner. Todos os dados artificiais foram removidos.

## Domínio CORE-06

`portfolio_assets`, `portfolio_asset_quotes` e `portfolio_preferences` permitem leitura a qualquer membro. Escrita e exclusão exigem `owner` ou `editor`, verificadas por `can_edit_portfolio`. `viewer` permanece somente leitura.

`user_portfolio_preferences` só pode ser lida ou alterada pelo próprio `auth.uid()`. A carteira ativa deve ser nula ou pertencer ao usuário. Anon não recebe privilégios em nenhuma tabela.

`core_06_schema_rls.test.sql` e a validação SDK cobrem existência, RLS, policies, chaves, triggers, owner/editor/viewer, isolamento e bloqueio anon.

## Operações CORE-07

| Operação | Owner | Editor | Viewer | Sem vínculo/anon |
|---|---:|---:|---:|---:|
| SELECT | sim | sim | sim | não |
| INSERT | sim | sim | não | não |
| UPDATE | sim | sim | não | não |
| DELETE | sim | sim | não | não |

INSERT exige `created_by = auth.uid()`. `protect_operation_identity` impede alterar UUID, carteira ou autor. A exclusão é física e explícita. `core_07_operations_rls.test.sql` cobre CRUD, papéis, isolamento, anon, idempotência, enum e constraints.
