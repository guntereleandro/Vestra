# Repositórios assíncronos

Status: Provider Local implementado na CORE-02; profiles/portfolios remotos na CORE-05; assets/quotes/preferences remotos na CORE-06.

## CORE-08 - selecao operacional

`dataSourceResolver` seleciona exatamente uma implementacao para operacoes, assets e quotes. `operationsService` nunca combina adapters nem executa dual write. O registry anterior permanece disponivel para compatibilidade.

## Objetivo

Separar os fluxos essenciais do Core do mecanismo atual de persistência. Componentes e hooks consomem serviços; serviços obtêm contratos pelo registry; adapters locais preservam `lib/data`, migrações, chaves e backup existentes.

```text
Componentes e hooks
  -> lib/services
     -> repositoryRegistry
        -> contratos
        -> adapters locais
           -> lib/data
              -> localStorage
```

Todos os métodos públicos dos oito contratos retornam `Promise`, inclusive no provider local.

## Registry

`lib/repositories/repositoryRegistry.js` é o ponto único de resolução. Ele conhece os providers `local` e `supabase`, mas o provider inicial e único consumido pela aplicação continua sendo `local`. Providers desconhecidos resultam em `UNSUPPORTED_OPERATION`; não existe fallback silencioso.

Componentes e hooks não importam adapters locais. `localCoreDataRepository` continua como gateway compatível para a gravação conjunta legada. A CORE-06 adicionou `AssetsRepository` como oitavo contrato público sem alterar as chaves existentes.

## Identidade local

- perfil: `local-profile`;
- carteira padrão: `local-default-portfolio`.

Os IDs são determinísticos e não são gravados em novas chaves. Perfis e metadados da carteira vivem somente em memória nesta etapa. A futura migração deverá mapeá-los para IDs remotos.

## Contratos

### AssetsRepository

- `listByPortfolio(portfolioId)`
- `getByTicker(portfolioId, ticker)`
- `upsert(input)`
- `remove(portfolioId, ticker)`
- `replaceAllByPortfolio(portfolioId, assets)`

O adapter local preserva `vestra:assetsMaster:v1`; o remoto usa `portfolio_assets`.

### ProfilesRepository

- `getCurrent()`
- `upsert(profile)`

### PortfoliosRepository

- `list()`
- `getActive()`
- `create(input)`
- `update(id, input)`
- `setActive(id)`

O adapter local expõe somente a carteira padrão. `create` retorna `UNSUPPORTED_OPERATION`.

### OperationsRepository

- `listByPortfolio(portfolioId)`
- `getById(id)`
- `create(input)`
- `update(id, input)`
- `remove(id)`
- `replaceAllByPortfolio(portfolioId, operations)`

Reutiliza `normalizeOperations`, `readLocalData` e `writeLocalData`.

### DividendsRepository

É uma visão derivada do `OperationsRepository`: Local e Supabase filtram `DIVIDENDO`, `JCP` e `RENDIMENTO` e delegam o CRUD ao mesmo armazenamento operacional.

- `listByPortfolio(portfolioId)`
- `create(input)`
- `update(id, input)`
- `remove(id)`

É uma visão sobre operações `DIVIDENDO`, `JCP` e `RENDIMENTO`. Não existe segunda cópia persistente: todo CRUD delega ao repositório de operações.

### QuotesRepository

- `listByPortfolio(portfolioId)`
- `getByTicker(portfolioId, ticker)`
- `upsert(input)`
- `remove(portfolioId, ticker)`
- `replaceAllByPortfolio(portfolioId, quotes)`

Preserva a chave `vestra:assetQuotes:v1` e a prioridade manual/automática existente.

### PortfolioSnapshotsRepository

- `listByPortfolio(portfolioId)`
- `upsertDaily(snapshot)`
- `getRange(portfolioId, startDate, endDate)`
- `getLatest(portfolioId)`
- `removeAllByPortfolio(portfolioId)`

Preserva um snapshot por data e a chave `vestra:portfolioHistory:v1`.

### PreferencesRepository

- `getByPortfolio(portfolioId)`
- `upsertByPortfolio(portfolioId, preferences)`

Agrupa somente preferências persistentes usadas pelo Core nesta transição: estratégia diagnóstica e perfil de risco. Cada contrato original e sua chave continuam válidos.

## Serviços de aplicação

- `operationsService.js`: CRUD de operações.
- `quotesService.js`: cotações persistentes.
- `snapshotsService.js`: cria snapshot com funções existentes e persiste pelo contrato.
- `preferencesService.js`: estratégia e perfil.
- `portfolioDataService.js`: carrega e salva o conjunto compatível usado por `useInvestmentData`, com fila de gravação para manter ordem.

Serviços não acessam DOM ou React e não duplicam regras financeiras.

## Consumidores migrados

- `useInvestmentData`: leitura assíncrona, persistência, cotações e snapshots.
- `OperationsPage`: criação, edição e exclusão pelos serviços.
- `useDiagnosticPreferences` e `useRiskProfile`: leitura e gravação assíncronas.
- `CommandPalette`: leitura do portfólio e atualização de cotações pelos serviços.

A API de estado de `useInvestmentData` foi preservada para os consumidores existentes.

## Domínios ainda diretos

Fora da CORE-02:

- cache de mercado;
- assets master como contrato público próprio;
- goals e milestones;
- jornada e última visita;
- conhecimento;
- backup/importação/limpeza;
- diagnósticos e performance, que continuam como engines puras.

Backup permanece em `lib/data/storage.js` porque é uma operação transversal sobre o contrato legado completo.

## Erros

`RepositoryError` expõe somente código e mensagem sanitizada:

- `REPOSITORY_NOT_INITIALIZED`
- `ENTITY_NOT_FOUND`
- `INVALID_INPUT`
- `STORAGE_READ_ERROR`
- `STORAGE_WRITE_ERROR`
- `CONFLICT`
- `UNSUPPORTED_OPERATION`

A causa técnica pode permanecer em `error.cause`, sem ser encaminhada à interface.

## Compatibilidade

- nenhuma chave foi criada ou renomeada;
- schema de backup passa a 6 e preserva leitura das versões 1–5;
- migrações legadas continuam em `readLocalData`;
- operações continuam sendo a fonte de verdade;
- proventos não são duplicados;
- normalizadores e engine existentes são reutilizados;
- o validador usa `localStorage` em memória e não acessa dados reais.

## Infraestrutura Supabase

`lib/repositories/supabase` contém oito adapters. Profiles, portfolios, assets, operations, quotes e preferences são funcionais. Dividends e portfolioSnapshots lançam `NOT_IMPLEMENTED`.

O registry é o único ponto de seleção. Nenhum consumidor seleciona `supabase`, e o validador sempre restaura `local` após testar os stubs. A implementação remota futura não deve alterar componentes nem mover regras financeiras ao banco. IDs locais serão mapeados somente durante a migração assistida posterior.

Veja `docs/SUPABASE_INFRASTRUCTURE.md`.

## Limitações

- somente a carteira padrão é persistida localmente;
- perfil e metadados da carteira não persistem entre reloads;
- o storage legado ainda é síncrono internamente;
- assets master possui contrato próprio, mas o gateway compatível ainda é usado pelo fluxo legado;
- não há concorrência multiaba ou resolução de conflitos; autenticação existe separadamente e não participa dos contratos de dados;
- snapshots continuam sendo disparados pelo cliente até a CORE-09.
- a sincronização CORE-06 é unidirecional Local → Supabase e não remove linhas remotas;
## Implementação Supabase na CORE-05

`SupabaseProfilesRepository` implementa `getCurrent` e `upsert`, sempre derivando o ID do Auth User. `SupabasePortfoliosRepository` implementa listagem, carteira ativa persistente por usuário, criação pela RPC `create_portfolio_with_owner` e atualização limitada por RLS.

Assets, Quotes, Preferences e Operations persistem por carteira e reutilizam os normalizadores existentes. Operations faz CRUD e upsert idempotente em lotes de 500, sem exclusão implícita. Dividends e PortfolioSnapshots continuam como stubs. O registry permanece em `local`.

Operations agora realiza round-trip dos campos de eventos corporativos e caixa remunerado. O contrato público de métodos não mudou; Local e Supabase compartilham normalização e validação. O Data Source Resolver continua entregando exatamente um repository, sem dual write.

Eventos de renda fixa por valor preservam `totalValue` no adapter Local e fazem round-trip por `value_amount` no Supabase. Os métodos do repository não mudam; quantidade e preço não são sintetizados.
