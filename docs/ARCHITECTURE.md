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

### Dados locais

`lib/data` armazena e normaliza operacoes, cadastro mestre, cotacoes manuais, historico patrimonial e persistencia local.

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
