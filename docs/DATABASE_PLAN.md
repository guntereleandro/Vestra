# Plano conceitual de banco

Plano iniciado na CORE-00 e atualizado pela implementação incremental da CORE-05. O schema efetivo está em `supabase/migrations/` e descrito em `DATABASE_SCHEMA.md`.

## Estado da infraestrutura

A CORE-05 adicionou migrations locais reproduzíveis para `profiles`, `portfolios` e `portfolio_members`, com RLS, privilégios mínimos e testes pgTAP. A aplicação no projeto Development remoto permanece pendente de autenticação da CLI.

O schema será introduzido incrementalmente com o domínio que o utiliza:

- autenticação sem tabela de negócio na CORE-04;
- perfil, carteiras e associação de membros na CORE-05;
- ativos e operações na CORE-06;
- demais entidades nas respectivas etapas do roadmap.

## Princípios

- PostgreSQL/Supabase será a fonte persistente de verdade.
- Auth identifica a pessoa; perfil não substitui identidade.
- Toda informação privada terá dono explícito e política RLS.
- Carteira é a fronteira principal de agregação e autorização.
- Operações permanecem a fonte de verdade; posições e totais são derivados.
- Cotações públicas e catálogo de ativos não devem ser duplicados por usuário.
- Snapshots são históricos imutáveis ou versionados, não substitutos das operações.
- IDs devem ser estáveis e importações idempotentes.

## Entidades preliminares

### Identidade e acesso

- `profiles`: 1:1 com usuário do Auth; nome de exibição, locale, timezone e onboarding.
- `portfolios`: nome, moeda-base, estado, proprietário e timestamps.
- `portfolio_members`: relação usuário-carteira com papel (`owner`, `editor`, `viewer`).
- `subscription_accounts`/`entitlements`: reserva conceitual para planos futuros; não implementar cobrança no Core.

### Investimentos

- `assets`: catálogo global de ticker, bolsa, tipo, moeda e metadados públicos.
- `portfolio_asset_overrides`: nome/metadados manuais específicos de uma carteira.
- `operations`: compras, vendas e eventos de renda; pertence a uma carteira e referencia ativo.
- `manual_quotes`: override de cotação por carteira, ativo e autor.
- `market_quotes`: dados públicos por ativo, fonte e instante; escrita apenas por serviço confiável.
- `portfolio_snapshots`: totais por carteira, data e versão/metodologia.

### Perfil e preferências

- `user_risk_profiles`: questionário e resultado por usuário.
- `portfolio_preferences`: estratégia, alocações e limites por carteira.
- `user_preferences`: preferências de interface/sincronização que não pertencem à carteira.

### Domínios adiados

- `goals` e `goal_milestones`: preservar conceitualmente, migrar após o caminho crítico.
- jornada, conquistas e última visita: preferir derivação ou estado local antes de criar tabelas.
- conteúdo de conhecimento: público/global, apto a repositório editorial separado.

## Relações

```text
auth.users 1--1 profiles
auth.users 1--N portfolio_members N--1 portfolios
portfolios 1--N operations N--1 assets
portfolios 1--N manual_quotes N--1 assets
assets 1--N market_quotes
portfolios 1--N portfolio_snapshots
auth.users 1--N user_risk_profiles
portfolios 1--1 portfolio_preferences
```

Mesmo com um único usuário inicial, `portfolio_members` evita acoplar propriedade, compartilhamento e planos diretamente em `portfolios`.

## Escopo de propriedade

| Tipo | Escopo |
|---|---|
| Perfil e risco | `user_id` |
| Carteira, operações, snapshots, estratégia, overrides | `portfolio_id`; autor/auditoria também pode ter `user_id` |
| Catálogo e cotação de mercado | global/público para leitura |
| Conteúdo de conhecimento publicado | público/global |
| Cache efêmero, rascunho de formulário, última visita | pode continuar local |
| Configuração de provider e segredos | servidor/ambiente, nunca tabela pública ou cliente |

## Segurança e RLS

- `profiles`: usuário lê/edita apenas o próprio perfil.
- `portfolios`: acesso somente via associação válida em `portfolio_members`.
- `operations`, `manual_quotes`, `snapshots`, preferências e metas: política baseada na carteira; escrita limitada por papel.
- `portfolio_members`: somente owner administra membros; evitar autoelevação.
- `user_risk_profiles`: somente o próprio usuário.
- catálogo/conhecimento: leitura pública; escrita apenas service role/admin.
- `market_quotes`: leitura pública ou autenticada conforme custo; escrita apenas backend.
- Nunca expor `service_role`, `BRAPI_TOKEN` ou segredos no bundle cliente.

As políticas devem ser testadas com usuário A, usuário B, viewer, editor, owner e sessão anônima. Views e funções também precisam respeitar invoker/RLS.

## Estratégia de migração

1. Concluído na CORE-02: contratos assíncronos, registry, serviços e adapter local compatível.
2. Concluído na CORE-03: introduzir infraestrutura e stubs Supabase sem alterar cálculos ou dados.
3. Concluído parcialmente na CORE-04: ativar autenticação sem Profile ou dados remotos.
4. Criar Profile, carteiras e permissões com RLS antes de selecionar persistência remota.
5. Fazer operações remotas serem a fonte de verdade, com tratamento explícito de loading, conflito e erro.
6. Recalcular carteira pela engine existente.
7. Migrar cotações manuais e snapshots.
8. Importar dados locais com preview, confirmação, idempotência e relatório.
9. Manter cópia local como fallback controlado até a validação.
10. Desativar escrita local de cada domínio apenas após reconciliação.

Os contratos atuais de profiles, portfolios, operations, dividends, quotes, portfolioSnapshots e preferences são a fronteira da CORE-03. O adapter Supabase deverá respeitar erros, assinaturas e isolamento por `portfolioId`; o gateway interno de assets master deverá ser substituído ou formalizado antes de remover o provider local.

## Riscos

- IDs locais e datas geradas no cliente podem colidir ou estar em timezone incorreto.
- Operações inválidas hoje são descartadas por normalização, o que pode ocultar perda em importação.
- Venda maior que posição é truncada pela engine, sem rejeição de domínio.
- Snapshots do mesmo dia são sobrescritos e dependem de efeitos do cliente.
- Cotações persistentes misturam override do usuário e dado automático.
- Metadados de ativos misturam catálogo seed, provider e customização.
- Backup não contém todos os domínios.
- Cálculo de performance precisa de definição financeira e testes de regressão antes de materialização no servidor.

## Decisões a fechar antes do schema

- Suporte inicial a múltiplas carteiras e moeda-base.
- Tratamento de desdobramentos, bonificações, transferências e grupamentos.
- Política para vendas sem saldo e operações retroativas.
- Precisão decimal por quantidade, preço, taxas e valores.
- Fonte, frequência e licença das cotações.
- Regra de timezone e fechamento diário dos snapshots.
- Auditoria, soft delete e recuperação de operações.
- Estratégia offline e resolução de conflitos.
