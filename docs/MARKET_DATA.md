# Mercado 2.0 — contrato operacional

## Objetivo

O Mercado fornece identidade, cotação, histórico curto e indicadores disponíveis sem alterar operações ou a engine financeira. Ausência é `null`; zero só existe quando recebido explicitamente; timestamps de fonte nunca são fabricados.

## Fluxo

```text
Componentes -> marketService -> cache/deduplicação -> /api/market/*
                                             -> capabilities
Rotas server-only -> rate limit -> brapiProvider -> BRAPI
Fallback de identidade -> localProvider
```

O Proxy do Next ignora renovação de Auth em `/mercado/*` e `/api/market/*`. Essas rotas são públicas e stateless; isso evita que indisponibilidade do Supabase atrase consultas públicas sem alterar a proteção das rotas patrimoniais.

## Quote Contract 2.0

Campos canônicos:

- `ticker`, `price`, `change`, `changePercent`;
- `open`, `dayHigh`, `dayLow`, `previousClose`, `volume`;
- `marketStatus`, `currency`, `source`, `updatedAt`;
- `provenance`: provider, timestamp da fonte, coleta, disponibilidade, limitação e fallback.

Preço precisa ser positivo. Os demais números aceitam zero legítimo e usam `null` para ausência. `updatedAt` usa somente `regularMarketTime` válido; `fetchedAt` é separado e representa a coleta.

## Classificação

Ordem: metadata explícita, catálogo, tipo do provider, catálogo mestre e fallback controlado. O sufixo `11` não determina FII. A matriz validada cobre MXRF11/HGLG11/KNCR11 como FII, IVVB11/BOVA11/GOLD11 como ETF e SANB11 como Unit.

## Atualização da carteira

O Free usa uma chamada por ticker, concorrência máxima de três, deduplicação em voo, cache e resultado parcial. Um ticker inválido não cancela os demais. O retorno separa `fetched`, `cached`, `notFound` e `failed`. Atualização manual ignora/invalida cache; não existe dual write nem alteração de operações.

## Disponibilidade e fallback

- Local: identidade, catálogo, pesquisa e cotação fornecida explicitamente pelo contexto.
- Local não fabrica cotação, fundamentos ou timestamp.
- Erro remoto preserva identidade local, mas carrega `remoteError` e aviso visível.
- 403 mantém cotação básica e marca fundamentos como restritos.
- timeout, rate limit, 404, rede e erro do provider mantêm códigos distintos.

## Cache

`vestra:marketCache:v1` continua temporário e fora do backup. TTL: 30 minutos. Entradas expiradas são ignoradas; podem ser removidas por `pruneExpiredMarketCache`; limpeza e invalidação são explícitas. Promessas cliente com a mesma URL são compartilhadas e liberadas ao concluir.

## Rotas

- `GET /api/market/search?q=`;
- `GET /api/market/assets/[ticker]`;
- `GET /api/market/quotes?tickers=` — um ticker no plano atual;
- `GET /api/market/history/[ticker]?range=1mo|3mo`;
- `GET /api/market/status?verify=1`.

Todas aplicam limite best-effort de 60 requisições/minuto por IP em memória. Em serverless, instâncias não compartilham o contador; é proteção mínima, não firewall distribuído.

## Segurança

`BRAPI_TOKEN` permanece server-only. A UI acessa apenas rotas internas. Respostas e erros são sanitizados e limitados. O token continua em query string porque a troca de mecanismo não foi confirmada na documentação usada; logs nunca registram a URL externa. Rotas públicas não aceitam URL arbitrária e, portanto, não funcionam como proxy genérico.
