# Market providers

Providers sao adaptadores. Eles escondem a origem dos dados de mercado do restante do Vestra.

A interface e a engine financeira nunca importam um provider diretamente. Use `lib/market/marketService.js`, hooks ou rotas internas.

## Providers atuais

- `localProvider`: fallback offline permanente.
- `brapiProvider`: provider externo real, usado somente no servidor.

## Contrato

Um provider pode implementar:

- `searchAssets(query, context)`
- `getAsset(ticker, context)`
- `getQuote(ticker, context)`
- `getQuotes(tickers, context)`
- `getProviderStatus()`

Respostas devem ser normalizadas com `marketNormalizers.js`.

## brapi.dev

O token deve ser lido exclusivamente de:

```bash
BRAPI_TOKEN=
```

Nunca use `NEXT_PUBLIC_BRAPI_TOKEN`.

O frontend chama apenas:

- `/api/market/search`
- `/api/market/assets/[ticker]`
- `/api/market/quotes`
- `/api/market/status`

As rotas internas validam parametros, aplicam timeout e retornam erros sanitizados.

## Cache

Cotacoes automaticas podem ser armazenadas temporariamente em `vestra:marketCache:v1`.

O cache nao substitui cotacao manual persistente e nao entra no backup.

## Limites e termos

Respeite limites, licencas e termos de uso do fornecedor. Falhas, timeout e HTTP 429 devem cair para mensagens amigaveis e fallback local quando possivel.
