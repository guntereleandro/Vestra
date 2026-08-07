# Inventário do localStorage

Estado da CORE-00. Todas as chaves pertencem hoje ao navegador, sem `user_id` ou carteira.

## Matriz completa

| Chave | Responsável e formato | Domínio | Leitores | Escritores/migração | Backup | Destino provável |
|---|---|---|---|---|---|---|
| `vestra:operations:v1` | `lib/data/storage.js`; array de `{id,ticker,assetName,assetType,operationType,date,quantity,unitPrice,fees,totalValue,notes}`; `id` é UUID | operações/proventos | `readLocalData`, hooks e Command Palette indiretamente | `writeLocalData`, restore; registros sem UUID migram uma vez na leitura | Sim | `portfolio_operations`, com `portfolio_id`, autor e timestamps |
| `vestra:assetsMaster:v1` | `storage.js` + `assetsMaster.js`; array de metadados normalizados por ticker | catálogo/customizações | `readLocalData`, busca local | `writeLocalData`, merge de seeds/operações/cotações, restore | Apenas customizações | catálogo público global + `portfolio_asset_metadata` apenas para overrides |
| `vestra:assetQuotes:v1` | `storage.js` + `quotes.js`; array com preços manual/automático, override, origem e datas | cotações | `readLocalData`, carteira/configurações | `writeLocalData`, restore, migração de `legacyQuotes` | Sim | tabela de overrides manuais por carteira; cotação pública em tabela/cache separado |
| `vestra:portfolioHistory:v1` | `portfolioHistory.js`; array diário `{id,date,timestamp,totalInvested,currentValue,profitLoss,dividends,positionsCount}` | histórico/performance | storage, dashboard, performance | `upsertPortfolioSnapshot`, restore | Sim | `portfolio_snapshots` por carteira e data |
| `vestra:diagnosticPreferences:v1` | `diagnosticPreferences.js`; objeto de limites, alocação-alvo, países, moedas, risco, foco e `updatedAt` | estratégia | hook e backup | formulário/hook, restore; normalização funciona como migração | Sim | `portfolio_preferences` ou `investment_strategies`, por carteira/usuário |
| `vestra:riskProfile:v1` | `riskProfile.js`; respostas, perfil calculado e timestamps | perfil/risco | hook, diagnósticos, backup | questionário/hook, restore; normalização | Sim | `user_risk_profiles`, com `user_id`; respostas sensíveis protegidas por RLS |
| `vestra:journeyRecords:v1` | `journeyRecords.js`; objeto indexado por recorde com valor/data/label/ticker/recordedAt | comportamento/dashboard | `Dashboard` | `Dashboard` via merge/write | Não | Derivável; se preservado, `portfolio_achievements`/eventos por carteira |
| `vestra:lastDashboardVisit:v1` | `lastDashboardVisit.js`; `{visitedAt,snapshot:{currentValue,dividends,operationsCount,positionsCount,highestPortfolio}}` | experiência | `Dashboard` | `Dashboard` | Não | Pode continuar local por dispositivo; opcionalmente preferência de usuário |
| `vestra:goals:v1` | `goals.js`; array de metas com tipo, alvo, progresso, prazo e timestamps | objetivos | Goals, Dashboard, Command Palette | Goals | Não | Fora da prioridade inicial; futuramente `goals` por usuário/carteira |
| `vestra:goalMilestones:v1` | `goals.js`; array de eventos de marco | objetivos/jornada | Goals/Dashboard | Goals | Não | `goal_milestones`, ligado a `goals`, se o domínio for mantido |
| `vestra:marketCache:v1` | `quoteCache.js`; mapa por ticker com quote, timestamp e expiração | mercado/cache | `marketService`, configurações | `marketService`, limpeza manual | Não | Cache de servidor/edge ou tabela de cotações com TTL; não é dado de carteira |
| `vestra:assets:v1` | formato legado de posições agregadas do MVP | legado | somente `readLocalData` durante migração | nunca escrito atualmente | Não | Consumido pela migração assistida e depois arquivado/removido localmente com consentimento |
| `vestra:quotes:v1` | array ou mapa legado de cotação | legado | fallback em `readLocalData` | nunca escrito atualmente | Não | Consumido para overrides/cotações na migração |
| `vestra:migration:operations:v1` | string `"completed"` | controle de migração | `readLocalData` | migração legada e restore | Não | Estado de importação por usuário/dispositivo ou registro de migration job |

## Participantes indiretos

- `hooks/useInvestmentData.js` lê no mount e grava operações, ativos e cotações sempre que seu estado muda; também dispara snapshots.
- `components/dashboard/Dashboard.js` gerencia jornada e última visita.
- `components/goals/GoalsPage.js` gerencia metas e marcos diretamente.
- `components/command/CommandPalette.js` possui fluxos próprios de backup, restore e atualização de cotações.
- `components/settings/DataManagement.js` usa o agregador de storage com confirmação.

## Migrações existentes

1. Posições antigas de `vestra:assets:v1` viram COMPRA na data da migração.
2. Proventos agregados antigos viram DIVIDENDO ou RENDIMENTO.
3. Preço atual antigo vira cotação manual.
4. `vestra:quotes:v1` é aceito como alternativa à chave atual.
5. Normalizadores toleram arrays/mapas e campos antigos.
6. O marcador `vestra:migration:operations:v1` impede repetição.

Limitação: a migração usa a data corrente, portanto não reconstrói o histórico econômico original.

## Lacunas do backup

O backup declara schema 6 e preserva os campos dos eventos do ledger, mas omite metas, marcos, jornada e última visita. Isso contradiz a expectativa de “todos os dados” e pode produzir perda funcional em troca de navegador. O cache deve continuar excluído. As chaves legadas e o marcador também não precisam ser exportados, desde que a migração nova mantenha rastreabilidade.

## Requisitos para a migração Core

- Congelar e documentar contratos antes de trocar o backend.
- Ler todas as chaves uma vez, validar, mostrar contagens e permitir revisão.
- Gerar idempotency key por importação e por registro.
- Não apagar dados locais automaticamente.
- Vincular dados ao usuário e à carteira escolhida.
- Comparar contagens e totais antes/depois.
- Manter exportação JSON de segurança.
- Registrar erros por item sem transformar valores inválidos em zero silenciosamente.
