# Repositórios assíncronos

Status: provider local implementado na CORE-02; infraestrutura Supabase registrada como stub na CORE-03.

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

Todos os métodos públicos dos sete contratos retornam `Promise`, inclusive no provider local.

## Registry

`lib/repositories/repositoryRegistry.js` é o ponto único de resolução. Ele conhece os providers `local` e `supabase`, mas o provider inicial e único consumido pela aplicação continua sendo `local`. Providers desconhecidos resultam em `UNSUPPORTED_OPERATION`; não existe fallback silencioso.

Componentes e hooks não importam adapters locais. `localCoreDataRepository` é um gateway interno adicional usado para preservar a gravação conjunta de operações, catálogo mestre e cotações sem criar um oitavo contrato público.

## Identidade local

- perfil: `local-profile`;
- carteira padrão: `local-default-portfolio`.

Os IDs são determinísticos e não são gravados em novas chaves. Perfis e metadados da carteira vivem somente em memória nesta etapa. A futura migração deverá mapeá-los para IDs remotos.

## Contratos

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
- schema de backup permanece 5;
- migrações legadas continuam em `readLocalData`;
- operações continuam sendo a fonte de verdade;
- proventos não são duplicados;
- normalizadores e engine existentes são reutilizados;
- o validador usa `localStorage` em memória e não acessa dados reais.

## Infraestrutura Supabase

`lib/repositories/supabase` contém sete adapters que implementam a forma dos contratos assíncronos. Nesta etapa, todos os métodos lançam erro explícito com código `NOT_IMPLEMENTED`; não existe SQL, tabela, sincronização ou migração.

O registry é o único ponto de seleção. Nenhum consumidor seleciona `supabase`, e o validador sempre restaura `local` após testar os stubs. A implementação remota futura não deve alterar componentes nem mover regras financeiras ao banco. IDs locais serão mapeados somente durante a migração assistida posterior.

Veja `docs/SUPABASE_INFRASTRUCTURE.md`.

## Limitações

- somente a carteira padrão é persistida localmente;
- perfil e metadados da carteira não persistem entre reloads;
- o storage legado ainda é síncrono internamente;
- assets master ainda usa o gateway compatível, sem contrato próprio;
- não há concorrência multiaba ou resolução de conflitos; autenticação existe separadamente e não participa dos contratos de dados;
- snapshots continuam sendo disparados pelo cliente até a CORE-09.
- adapters Supabase ainda não consultam ou persistem dados.
