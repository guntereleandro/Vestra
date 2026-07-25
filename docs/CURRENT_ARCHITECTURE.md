# Arquitetura atual

Estado atualizado na CORE-02. Este documento descreve o repositório existente; não é a arquitetura-alvo.

## Visão geral

Aplicação Next.js com App Router, React e JavaScript. Fluxos essenciais usam serviços e contratos assíncronos com adapter local; domínios ainda não migrados continuam em `lib/data`. Cálculos determinísticos vivem majoritariamente em `lib/engine`; dados de mercado passam por `lib/market` e por quatro rotas internas de servidor.

```text
Páginas App Router
  -> componentes e hooks clientes
     -> lib/services
        -> repositoryRegistry
           -> adapters locais -> lib/data -> localStorage
     -> lib/engine -> valores derivados
     -> lib/market/marketService
        -> cache local
        -> /api/market/*
           -> brapiProvider -> brapi.dev
        -> localProvider como fallback
```

Não existem autenticação, banco, sincronização, jobs, filas ou observabilidade de produção.

## Organização das pastas

- `app/`: rotas, metadados, layout global, CSS e API de mercado.
- `components/`: interface agrupada por assets, command, dashboard, diagnostics, goals, knowledge, layout, market, operations, performance, portfolio, quotes e settings.
- `hooks/`: orquestração cliente para dados financeiros, mercado, diagnósticos, estratégia, risco, performance e Command Palette. `useGoals.js` está vazio.
- `lib/config/`: identidade pública, ambiente público, ambiente privado server-only e flags operacionais.
- `lib/data/`: contratos, normalização e persistência local.
- `lib/repositories/`: contratos assíncronos, erros, registry e adapters locais.
- `lib/services/`: coordenação de operações, cotações, snapshots, preferências e dados do portfólio.
- `lib/engine/`: cálculos financeiros, diagnósticos e performance.
- `lib/dashboard/`: experiência diária, fatos, recordes e objetivos.
- `lib/market/`: contrato de provider, normalização, busca, cache e serviço.
- `lib/knowledge/`: catálogo editorial e repositório local.
- `scripts/`: lint textual/sintático e validadores executáveis.
- `knowledge/`: índices Markdown e metadados editoriais; o conteúdo exibido está em `lib/knowledge/catalog.js`.
- `docs/`: documentação técnica e de produto.
- `public/`: inexistente no estado auditado; logos usam iniciais ou URLs remotas.

## Rotas de interface

| Rota | Estado |
|---|---|
| `/` | Dashboard funcional |
| `/carteira` | Carteira, performance e diagnósticos funcionais |
| `/carteira/[ticker]` | Detalhes derivados de operações e cotação |
| `/operacoes` | CRUD local de compras, vendas e proventos |
| `/objetivos` | CRUD local de objetivos |
| `/mercado` e `/mercado/[ticker]` | Busca pública e detalhes via mercado/fallback |
| `/configuracoes` | Cotações, estratégia, risco, mercado e backup |
| `/conhecimento/*` | Central local, categorias e artigos estáticos |
| `/proventos` | Placeholder; os registros existem apenas como operações |
| `/relatorios`, `/metas` | Placeholders |
| `/imposto-de-renda`, `/simulacoes`, `/ia` | Placeholders fora do Core |

Há duplicidade conceitual entre `/metas` (placeholder) e `/objetivos` (funcional).

## Domínios existentes

### Operações

`lib/data/operations.js` define COMPRA, VENDA, DIVIDENDO, JCP e RENDIMENTO. `OperationsPage` usa `operationsService` para inclusão, edição e exclusão. O adapter local preserva o array existente como fonte de verdade financeira.

### Carteira e proventos

`lib/engine/portfolio.js` agrupa operações por ticker, aplica custo médio móvel, acumula proventos e combina cotações/metadados. `totals.js` consolida carteira. `DividendsRepository` é uma visão assíncrona sobre operações de renda e não cria persistência paralela.

### Histórico patrimonial

`lib/data/portfolioHistory.js` mantém no máximo um snapshot por dia. `useInvestmentData` chama `snapshotsService`, que persiste por `PortfolioSnapshotsRepository`, quando muda a assinatura de operações ou cotações e também após migração.

### Objetivos

`lib/data/goals.js`, componentes de goals e `lib/dashboard/goalsAnalytics.js` implementam metas automáticas e manuais. Marcos possuem contrato local, mas a integração precisa ser tratada como secundária no Core.

### Diagnósticos, perfil, estratégia e comportamento

`lib/engine/diagnostics/` contém regras determinísticas de alocação, diversificação, renda, risco, estratégia e comportamento. Preferências e questionário de risco são persistidos separadamente.

### Performance

`lib/engine/performance/` calcula decomposição de crescimento, regularidade de aportes, drawdown, contribuições e timeline a partir de operações, posições e snapshots.

### Conhecimento

`knowledgeRepository.js` define o contrato; `localKnowledgeRepository.js` implementa o provider; `knowledgeService.js` expõe a API de leitura. O conteúdo efetivamente renderizado está em `lib/knowledge/catalog.js`; os Markdown em `knowledge/` não são a fonte carregada em runtime.

### Backup e configurações

`lib/data/storage.js` agrega parte dos dados locais, migra formatos legados, cria/restaura backup e limpa chaves. `DataManagement` oferece confirmação visual. A Command Palette também exporta/importa e atualiza cotações por um fluxo próprio.

O backup continua direto na camada de dados por ser transversal ao formato legado. Leitura de portfólio e atualização de cotações da Command Palette já usam serviços.

### Repositórios

Sete contratos públicos cobrem profiles, portfolios, operations, dividends, quotes, portfolioSnapshots e preferences. `repositoryRegistry.js` resolve o provider `local`. Os IDs locais são `local-profile` e `local-default-portfolio`. Veja `docs/REPOSITORIES.md`.

### Navegação e Command Palette

`AppShell` contém navegação desktop/mobile e marca fixa. `CommandPalette` pesquisa rotas, ativos, objetivos e conhecimento, além de executar ações de dados.

## Fluxos de dados

### Operação até carteira

1. Modal produz um registro.
2. `normalizeOperations` normaliza e recalcula `totalValue`.
3. Estado React é persistido por `useInvestmentData`.
4. `calculatePositions` reprocessa todo o histórico.
5. `calculatePortfolioTotals`, dashboard, diagnósticos e performance consomem resultados derivados.
6. Um snapshot diário pode ser atualizado.

### Cotação

1. Cotação manual/automática persistente vive em `vestra:assetQuotes:v1`.
2. Resposta externa temporária vive em `vestra:marketCache:v1`.
3. `marketService` prioriza cotação local, depois cache, depois rota interna.
4. `quotes.js` determina manual override, automática e preço efetivo.
5. Na ausência de cotação, a posição usa preço médio como fallback, com `hasQuote=false`.

### Backup

O schema 5 inclui operações, cotações, ativos customizados, histórico, preferências diagnósticas e perfil de risco. Não inclui objetivos, marcos, jornada, última visita, cache ou chaves legadas.

## API e providers de mercado

- `GET /api/market/search?q=`
- `GET /api/market/assets/[ticker]`
- `GET /api/market/quotes?tickers=`
- `GET /api/market/status`

`brapiProvider` é server-only, usa `BRAPI_TOKEN`, timeout de 7 segundos, limite de resposta de 500 KB e até 20 tickers por chamada. O plano sem módulos avançados tenta novamente sem esses módulos. `localProvider` pesquisa catálogo e cotações fornecidos pelo cliente.

## Configuração

`lib/config/brandConfig.js` centraliza identidade, URLs, e-mails, assets, locale, moeda, metadados e prefixo de exportação. `publicEnvConfig.js` aceita apenas `NEXT_PUBLIC_*`; `envConfig.js` é server-only e concentra BRAPI e a preparação privada para Supabase. `appConfig.js` mantém a versão exibida e parâmetros operacionais/mercado.

O provider BRAPI lê o token exclusivamente de `envConfig.js`. Componentes clientes importam somente `brandConfig`, `publicEnvConfig` ou `appConfig`; não há caminho cliente para segredos. Não há `next.config.*`; são usados defaults do Next.js. `jsconfig.json` define apenas o alias `@/*`.

## Dependências

Produção: Next, React, React DOM, Tailwind/PostCSS e `lucide-react`, todos fixados como `latest` no manifesto, embora o lockfile registre resoluções concretas. Não há dependências de teste, banco ou autenticação.

## Validação existente

- `npm run lint`: valida sintaxe com `node --check`, imports relativos e padrões básicos; não é ESLint.
- `test:market`: normalizadores, busca, cache e prioridade de cotações.
- `test:diagnostics`: regras e contratos de diagnóstico.
- `test:performance`: performance e decomposição.
- `test:knowledge`: contrato, conteúdo e rotas do repositório local.
- `test:brapi`: integração real, dependente de token e rede.
- `next build`: compilação e geração das rotas.
