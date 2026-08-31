# Arquitetura atual

Rotas futuras de IA, IR, simulações e relatórios permanecem preservadas tecnicamente, mas não são expostas na navegação do Core. O checklist de estabilidade está em `CORE_STABILITY.md`.

## Site, aplicacao e onboarding (CORE-09)

`/` e a Landing publica; `/dashboard` e a entrada autenticada. `AppShell` separa navegacao publica e privada, enquanto `proxy.js` protege todo o patrimonio, preserva `next` e encaminha usuario sem membership ao onboarding. Mercado e Auth permanecem publicos. Detalhes em `PUBLIC_PRIVATE_ARCHITECTURE.md` e `ONBOARDING.md`.

## Fonte operacional (CORE-08)

Servicos consultam `dataSourceResolver`, que valida sessao, carteira, membership e `portfolio_preferences.data_source`, retornando somente adapters Local ou Supabase. A engine continua pura e recebe arrays normalizados. Cache remoto e apenas de memoria, isolado por carteira e invalidado em CRUD, logout e troca de carteira.

Estado atualizado na CORE-05. Este documento descreve o repositório existente; não é a arquitetura-alvo.

## Visão geral

Aplicação Next.js com App Router, React e JavaScript. Dados essenciais usam serviços e oito contratos assíncronos. O Provider Local permanece como fonte operacional da interface; Supabase Auth e os adapters remotos da CORE-06 mantêm uma cópia não destrutiva de ativos, cotações e preferências da carteira ativa. Cálculos determinísticos vivem em `lib/engine`; mercado passa por `lib/market` e rotas internas.

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

Supabase Auth opcional:
  lib/supabase -> clients browser/server/admin
  profiles/portfolios -> repositories implementados
  assets/quotes/preferences -> tabelas CORE-06 com RLS
  operations -> tabela CORE-07; uso manual em /conta
  dividends -> NOT_IMPLEMENTED
  snapshots -> portfolio_snapshots
  PostgreSQL -> profiles, portfolios, portfolio_members + RLS
```

O schema de identidade/autorização e o primeiro domínio persistente estão aplicados no Supabase Development. A sincronização CORE-06 é cliente, autenticada, idempotente e não destrutiva; ainda não há jobs, filas ou observabilidade de produção.

## Organização das pastas

- `app/`: rotas, metadados, layout global, CSS e API de mercado.
- `components/`: interface agrupada por assets, command, dashboard, diagnostics, goals, knowledge, layout, market, operations, performance, portfolio, quotes e settings.
- `hooks/`: orquestração cliente para dados financeiros, mercado, diagnósticos, estratégia, risco, performance e Command Palette. `useGoals.js` está vazio.
- `lib/config/`: identidade pública, ambiente público, ambiente privado server-only e flags operacionais.
- `lib/data/`: contratos, normalização e persistência local.
- `lib/repositories/`: contratos assíncronos, erros, registry e adapters locais.
- `lib/repositories/supabase/`: Profiles e Portfolios implementados; cinco adapters ainda lançam `NOT_IMPLEMENTED`.
- `lib/services/`: coordenação de operações, cotações, snapshots, preferências e dados do portfólio.
- `lib/supabase/`: configuração server-only, clientes por contexto e helpers de Auth.
- `supabase/`: configuração CLI, três migrations versionadas e testes pgTAP de schema/RLS.
- `lib/auth/`: serviço de Auth, validação, redirects, erros e acesso server-only ao usuário.
- `lib/engine/`: cálculos financeiros, diagnósticos e performance.
- `lib/dashboard/`: experiência diária, fatos, recordes e objetivos.
- `lib/market/`: contrato de provider, normalização, busca, cache e serviço.
- `lib/knowledge/`: catálogo editorial e repositório local.
- `scripts/`: lint textual/sintático e validadores executáveis.
- `knowledge/`: índices Markdown e metadados editoriais; o conteúdo exibido está em `lib/knowledge/catalog.js`.
- `docs/`: documentação técnica e de produto.
- `public/`: inexistente no estado auditado; logos usam iniciais ou URLs remotas.
- `proxy.js`: fronteira não bloqueante do Next.js 16, preparada para futura renovação de sessão.
- `app/entrar`, `cadastrar`, `recuperar-senha`, `atualizar-senha`, `confirmar-email`, `auth/callback` e `conta`: fluxos de Auth.

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
| `/proventos` | Totais, filtros, agrupamentos, histórico e CRUD derivados das operações ativas |
| `/entrar`, `/cadastrar`, `/recuperar-senha`, `/atualizar-senha`, `/confirmar-email` | Auth público |
| `/auth/callback` | callback PKCE/OTP |
| `/conta` | única rota protegida; mostra dados seguros do Auth |
| `/relatorios`, `/metas` | Placeholders |
| `/imposto-de-renda`, `/simulacoes`, `/ia` | Placeholders fora do Core |

Há duplicidade conceitual entre `/metas` (placeholder) e `/objetivos` (funcional).

## Domínios existentes

### Operações

`lib/data/operations.js` define COMPRA, VENDA, DIVIDENDO, JCP e RENDIMENTO. `OperationsPage` usa `operationsService` para inclusão, edição e exclusão. O adapter local preserva o array existente como fonte de verdade financeira.

### Carteira e proventos

`lib/engine/portfolio.js` agrupa operações por ticker, aplica custo médio móvel, acumula proventos e combina cotações/metadados. `totals.js` consolida carteira. `DividendsRepository` é uma visão assíncrona sobre operações de renda e não cria persistência paralela.

### Histórico patrimonial

`lib/data/portfolioHistory.js` mantém no máximo um snapshot por dia. `useInvestmentData` chama `snapshotsService` somente após carga completa e quando muda a assinatura financeira. Local usa `vestra:portfolioHistory:v1`; Supabase usa `portfolio_snapshots` da carteira ativa, sem mistura ou fallback cruzado.

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

Oito contratos públicos cobrem profiles, portfolios, assets, operations, dividends, quotes, portfolioSnapshots e preferences. O registry inicia em `local`. Profiles, portfolios, assets, operations, quotes e preferences possuem adapters remotos; dividends e portfolioSnapshots continuam como stubs. Operations remoto é usado somente pela importação/reconciliação autenticada.

### Navegação e Command Palette

`AppShell` contém navegação desktop/mobile e marca fixa. `CommandPalette` pesquisa rotas, ativos, objetivos e conhecimento, além de executar ações de dados.

## Fluxos de dados

### Operação até carteira

1. Modal produz um registro com UUID.
2. `normalizeOperations` normaliza e recalcula `totalValue`.
3. Estado React é persistido por `useInvestmentData`.
4. `calculatePositions` reprocessa todo o histórico.
5. `calculatePortfolioTotals`, dashboard, diagnósticos e performance consomem resultados derivados.
6. Um snapshot diário pode ser atualizado.

A área `/conta` compara Local e Supabase, baixa backup e importa manualmente somente UUIDs seguros. Ela não troca a origem usada pela engine.

O contrato operacional cobre apenas compra, venda, dividendo, JCP e rendimento. A arquitetura atual não representa eventos societários (bonificação, desdobramento ou conversão/incorporação) nem o ciclo próprio de uma conta remunerada. A classe visual `Caixa` não acrescenta semântica à engine. Quantidades fracionárias são aceitas; atributos estruturados de renda fixa, como vencimento e indexador, ainda não fazem parte da operação. A fronteira de compatibilidade da carteira real está documentada em `REAL_PORTFOLIO_IMPORT_READINESS.md`.

O patch de importação amplia esse mesmo ledger com eventos patrimoniais e caixa remunerado, sem criar uma segunda coleção. `portfolio.js` processa o histórico globalmente para permitir transferência entre tickers. `portfolioImportClassifier.js` faz triagem explícita; backup schema 6 e os adapters Local/Supabase preservam os campos adicionais. O formulário manual continua limitado aos tipos anteriores.

Renda fixa sem unidade natural usa eventos por valor (`FIXED_INCOME_APPLICATION`/`FIXED_INCOME_REDEMPTION`). O domínio mantém `totalValue`, o adapter remoto usa `value_amount` e a engine deriva saldo com preço interno 1. Rendimentos acumulados ficam no ledger como `RENDIMENTO` datado e não entram na visão de proventos passivos.

### Cotação

1. Cotação manual/automática persistente vive em `vestra:assetQuotes:v1`.
2. Resposta externa temporária vive em `vestra:marketCache:v1`.
3. `marketService` prioriza cotação local, depois cache, depois rota interna.
4. `quotes.js` determina manual override, automática e preço efetivo.
5. Na ausência de cotação, a posição usa preço médio como fallback, com `hasQuote=false`.

### Backup

O schema 6 inclui operações e eventos do ledger, cotações, ativos customizados, histórico, preferências diagnósticas e perfil de risco. Não inclui objetivos, marcos, jornada, última visita, cache ou chaves legadas. Backups 1–5 permanecem legíveis.

## API e providers de mercado

- `GET /api/market/search?q=`
- `GET /api/market/assets/[ticker]`
- `GET /api/market/quotes?tickers=`
- `GET /api/market/status`

`brapiProvider` é server-only, usa `BRAPI_TOKEN`, timeout de 7 segundos, limite de resposta de 500 KB e um ticker por chamada no plano Free. O plano sem módulos avançados tenta novamente sem esses módulos. `localProvider` pesquisa catálogo e cotações fornecidos pelo cliente.

### Auditoria CORE-13

A arquitetura de mercado cobre busca, identidade, cotação, indicadores parciais e uma coleção curta de dividendos. Não existem contratos de provider, rotas internas ou UI para histórico de preços, demonstrações, composição, dividendos v2 ou eventos corporativos completos. O cache é exclusivamente cliente e guarda cotações por 30 minutos.

A auditoria real identificou quatro fronteiras prioritárias: limite de lote incompatível com o plano Free, classificação indevida de ETF/unit terminado em `11` como FII, ausência convertida em zero/frescor atual e loading público sem término no deployment. Cobertura, campos, custos, segurança e proposta incremental estão em `MARKET_DATA_AUDIT.md`.

### Mercado 2.0 implementado

Quote Contract 2.0 preserva OHLCV, `null` e proveniência. `marketCapabilities` descreve capacidades Local/BRAPI; `assetClassification` resolve classe por metadata, catálogo e provider; histórico possui contrato, rota e gráfico para 1M/3M. O plano Free usa uma chamada por ticker com concorrência três, deduplicação, cache e falha parcial. Rotas públicas possuem rate limit best-effort e não aguardam Supabase Auth no Proxy. Detalhes: `MARKET_DATA.md`, `MARKET_CAPABILITIES.md` e `MARKET_HISTORY.md`.

### Auditoria de Proventos Automáticos

O runtime possui somente proventos recebidos como operações. Não existem evento global, expectativa “A receber”, aliases externos, lifecycle de correção/cancelamento ou vínculo de reconciliação. A coleção de dividendos do Mercado é informativa e nunca cria `portfolio_operations`.

A proposta preserva evento global versionado, expectativa privada por carteira e operação confirmada. A BRAPI atual cobriu no teste real apenas as exceções PETR4 e MXRF11; os demais ativos receberam restrição de plano ou contrato não aplicável. Evidência em `AUTOMATIC_INCOME_AUDIT.md`; modelo em `INCOME_EVENT_MODEL.md`.

## Configuração

`lib/config/brandConfig.js` centraliza identidade e URLs. `publicEnvConfig.js` lê URL e publishable key Supabase, mantendo fallback para a anon key legada; `envConfig.js` concentra a secret key administrativa, seu fallback legado server-only e BRAPI. `supabaseConfig.js` combina a configuração por contexto e valida somente quando um cliente é criado.

O provider BRAPI lê o token exclusivamente de `envConfig.js`. Componentes clientes importam somente configurações públicas; Browser Client recebe URL/publishable key explicitamente e não lê ambiente. Server Client, Admin Client e configuração Supabase são server-only. Não há caminho cliente para a secret key administrativa. Não há `next.config.*`; são usados defaults do Next.js. `jsconfig.json` define apenas o alias `@/*`.

## Dependências

Produção: Next, React, React DOM, Tailwind/PostCSS, `lucide-react`, `@supabase/supabase-js` e `@supabase/ssr`. Não há biblioteca adicional de autenticação.

## Validação existente

- `npm run lint`: valida sintaxe com `node --check`, imports relativos e padrões básicos; não é ESLint.
- `test:market`: normalizadores, busca, cache e prioridade de cotações.
- `test:diagnostics`: regras e contratos de diagnóstico.
- `test:performance`: performance e decomposição.
- `test:knowledge`: contrato, conteúdo e rotas do repositório local.
- `test:supabase`: clientes, configuração, imports, segurança, stubs e provider ativo.
- `test:auth`: rotas, contratos, erros, entradas, redirects, PKCE, separação client/server e ausência de migrations.
- `test:database-schema`: migrations, schema, RLS, funções, privilégios e ausência de operações/proventos/snapshots remotos.
- `test:database-sdk`: validação controlada dos repositories e RLS pela Data API.
- `test:brapi`: integração real, dependente de token e rede.
- `next build`: compilação e geração das rotas.
# CORE-14 — Proventos automáticos

`lib/domain/income` normaliza eventos e identidade; `lib/engine/incomeEligibility.js`, `incomeExpectation.js` e `incomeMatching.js` mantêm regras puras. O adapter BRAPI server-only alimenta `/api/income/sync`, que exige autenticação, carteira ativa, owner/editor e fonte Supabase. Eventos globais, aliases, expectativas e links são separados do ledger. `/proventos` possui Recebidos (operações) e A receber (expectativas). Confirmação/vínculo usa RPC atômica; somente a operação resultante passa à engine existente.

Estado remoto após auditoria forense: CORE-14 não aplicada. O Development correto é `mwdogrezcpuzpohpeirs`, branch `main`; após o compute ficar `Healthy`, foram confirmados 1 usuário Auth, o schema de negócio predecessor e 109 operações. A leitura vazia anterior ocorreu durante a inicialização transitória do compute.
