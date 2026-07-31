# Migrations de banco

## Fonte da verdade

`supabase/migrations/` é a única fonte versionada do schema. Alterações feitas no Dashboard ou SQL Editor devem ser reproduzidas imediatamente em migration e validadas localmente.

## Estrutura

```text
supabase/
  config.toml
  migrations/
    20260730000100_core_05_identity_portfolios.sql
    20260730000200_core_05_service_role_maintenance.sql
    20260730000300_core_05_allow_portfolio_cascade.sql
  seed.sql
  tests/database/
    core_05_schema.test.sql
    core_05_rls.test.sql
```

`seed.sql` permanece vazio para não versionar usuários ou dados pessoais.

## Fluxo Development

1. Instalar dependências com `npm install`.
2. Iniciar a stack com `npx supabase start`.
3. Recriar o banco com `npx supabase db reset --local`.
4. Executar `npx supabase test db`.
5. Executar `npm run test:database-schema`.
6. Autenticar a CLI com `npx supabase login`.
7. Vincular exclusivamente o projeto Development com `npx supabase link --project-ref <development-ref>`.
8. Revisar com `npx supabase db push --dry-run`.
9. Aplicar com `npx supabase db push`.
10. Repetir validações remotas e SDK.

O passo remoto nunca deve ocorrer antes do reset e dos testes locais aprovados.

## Aplicação no Development — 2026-07-30

Projeto Development vinculado pelo project ref documentado do ambiente. A migration inicial já estava registrada no histórico remoto quando a CORE-05.1 começou. O dry run confirmou ausência de divergências.

Durante os testes foram encontradas e versionadas duas correções indispensáveis:

- `20260730000200`: leitura sanitizada e limpeza controlada pelo `service_role` server-only;
- `20260730000300`: permite cascata somente quando a carteira inteira é removida, preservando o bloqueio da remoção direta do último owner.

As três migrations constam no histórico remoto. Nenhum seed, reset remoto, `migration repair`, `--include-all` ou `--include-seed` foi usado.

## Aplicação no Development — 2026-07-31

`20260731000100_core_06_persistent_domain.sql` criou as quatro tabelas da CORE-06, `can_edit_portfolio`, índices, constraints, triggers, grants e policies. Foi aplicada primeiro no banco local e depois por `db push --linked`. O aviso posterior de cache do catálogo `pg-delta` não afetou a aplicação, confirmada pela validação SDK remota.

## Aplicação no Development — CORE-07

`20260731000200_core_07_portfolio_operations.sql` criou enum, tabela, índices, proteção de identidade, timestamp, RLS e privilégios. A cadeia completa foi recriada localmente antes do dry run e do push no Development. O SDK remoto confirmou CRUD, precisão, idempotência, papéis, isolamento e regressão financeira; dados artificiais foram removidos.

## Ambientes

- Local: descartável e reproduzível pelas migrations.
- Development remoto: integração compartilhada e validação antes de Production.
- Production futuro: projeto separado; sem reset remoto e sem seed.

Nunca usar `db reset --linked` em Production. `.temp`, `.branches`, tokens e senhas não são versionados.

## Backfill

A migration executa um INSERT idempotente de `auth.users(id)` para `public.profiles(id)`, sem copiar e-mail ou metadata. Novos usuários ganham profile explicitamente pelo repository após login; não existe trigger bloqueante em `auth.users`.

## Verificações

- `npx supabase db reset --local`: reproduz a cadeia completa.
- `npx supabase test db`: executa pgTAP.
- `node scripts/validate-database-schema.mjs`: inspeção estática de tabelas, RLS, policies, privilégios, índices, funções, backfill, escopo e ausência de credenciais.
- `node scripts/validate-database-sdk.mjs`: valida repositories e isolamento pela Data API quando recebe variáveis `SUPABASE_TEST_*` de um ambiente controlado.
- `node scripts/validate-remote-database-schema.mjs`: valida um dump temporário do schema remoto sem ler dados pessoais.
- `node scripts/validate-database-backfill.mjs`: compara somente contagens sanitizadas de Auth Users e Profiles.
