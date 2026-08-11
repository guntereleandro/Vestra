# Vestra - Arquitetura

## Objetivo

O Vestra e um sistema de gerenciamento de investimentos focado em patrimonio, evolucao financeira e acompanhamento de carteira.

A prioridade e manter uma arquitetura simples, escalavel e desacoplada.

## Principios

- Operacoes sao a fonte da verdade.
- A interface nunca realiza calculos financeiros complexos.
- Toda regra financeira pertence a `lib/engine`.
- Dados estaticos sao separados dos dados dinamicos.
- Mercado e engine financeira sao dominios separados.
- A interface e a engine nunca dependem diretamente de uma API de mercado especifica.
- Todo codigo novo deve respeitar a responsabilidade do dominio.

## Dominios

### Engine financeira

Responsavel por preco medio, custo, lucro/prejuizo, rentabilidade, carteira consolidada, proventos e analises derivadas.

`lib/engine/diagnostics` recebe dados ja consolidados e produz diagnosticos patrimoniais estruturados. O modulo e puro, deterministico e independente de interface, persistencia, mercado, providers e APIs. O contrato esta em `docs/DIAGNOSTICS.md`.

Preferencias de diagnostico pertencem a `lib/data/diagnosticPreferences.js`, usam `vestra:diagnosticPreferences:v1` e chegam a engine apenas por `parameters`. Diagnosticos gerais usam regras padrao; comparacoes personalizadas usam escopo `strategy`.

`behaviorMetrics.js` transforma somente operacoes e datas em metricas historicas. `behaviorDiagnostics.js` aplica amostras minimas e regras centralizadas, produzindo itens com escopo `behavior` sem inferencias psicologicas.

`lib/engine/performance` e um dominio puro e independente que explica crescimento, fluxos, valorizacao, proventos, drawdown e contribuicoes. Seu contrato esta em `docs/PERFORMANCE.md`.

`lib/domain/operations/passiveIncome.js` e a fonte unica da semantica de proventos. Fluxos de capital, retorno economico interno e eventos patrimoniais nao sao classificados como proventos; consumidores reutilizam essa regra em vez de manter listas proprias.

O questionario de risco e persistido por `lib/data/riskProfile.js` em `vestra:riskProfile:v1`. A classificacao e os parametros derivados pertencem a `riskProfileAssessment.js`; diagnósticos de coerencia usam escopo `risk_profile` e nao alteram preferencias automaticamente.

### Dados locais

`lib/data` armazena e normaliza operacoes, cadastro mestre, cotacoes manuais, historico patrimonial e persistencia local.

### Repositorios e servicos

`lib/repositories` define contratos assincronos para os dominios essenciais do Core. `repositoryRegistry.js` seleciona o provider; atualmente somente o adapter local existe e reutiliza `lib/data`.

`lib/services` coordena repositorios para hooks e componentes. Nenhum componente importa adapters locais. Operacoes continuam como fonte da verdade e proventos sao derivados delas, sem persistencia duplicada.

### Mercado

`lib/market` e a camada de mercado. Ela prepara o Vestra para APIs futuras sem acoplar componentes ou engine a provedores especificos.

Estrutura:

- `providers`: adaptadores de origem de dados.
- `marketService.js`: interface unica para a aplicacao.
- `assetSearch.js`: busca e ranking.
- `quoteCache.js`: cache temporario versionado.
- `marketNormalizers.js`: normalizacao de respostas externas.

O `localProvider` usa o cadastro mestre e cotacoes manuais como fallback permanente.

O `brapiProvider` e o primeiro provider externo real. Ele roda somente no servidor e e acessado pela interface por rotas internas em `/api/market/*`.

### Rotas internas de mercado

- `/api/market/search`
- `/api/market/assets/[ticker]`
- `/api/market/quotes`
- `/api/market/status`

Essas rotas leem `BRAPI_TOKEN` no servidor, validam entradas, aplicam limites e retornam erros sanitizados.

### Configuracao

`lib/config/appConfig.js` centraliza configuracoes simples. No futuro, esses valores poderao vir de banco de dados e painel administrativo protegido.

### Interface

Componentes React exibem dados e acionam hooks/servicos. Eles nao importam provedores de mercado diretamente e nao concentram regras financeiras.

### Conhecimento

`knowledge/` e a fonte local oficial de documentacao estruturada. `lib/knowledge/repositories` define o contrato de origem, enquanto `knowledgeService.js` normaliza acesso, filtros, pesquisa, relacionados, rotas e fallback. Interface, Command Palette e rotas não conhecem a implementação local. `metadata.json` versiona o manifesto e a governanca esta em `docs/KNOWLEDGE.md`.

## LocalStorage

Chaves versionadas:

- `vestra:operations:v1`
- `vestra:assetsMaster:v1`
- `vestra:assetQuotes:v1`
- `vestra:portfolioHistory:v1`
- `vestra:marketCache:v1`

O cache de mercado e temporario e nao e necessario para restaurar a carteira.

## Politica de cotacoes

A camada de dados calcula `effectivePrice` antes da engine financeira:

1. Manual com override.
2. Automatica valida.
3. Cache valido.
4. Preco medio como fallback visual.
