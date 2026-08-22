# Capacidades de providers de mercado

## Contrato

`lib/market/marketCapabilities.js` é a fonte oficial de capacidades. Valores podem ser `true`, `false` ou uma limitação declarada. A UI não consulta nome de plano nem importa provider externo.

| Capacidade | Local | BRAPI atual |
|---|---|---|
| search | sim | sim |
| quote | somente contexto | sim |
| quoteDetails | não | sim |
| historicalPrices | não | Free: até 3 meses |
| fundamentals | não | condicionado ao plano/ticker |
| dividends | não | parcial |
| corporateActions | não | parcial |
| etfComposition | não | não |

## Proveniência

Cada dataset externo pode informar:

- `provider`;
- `sourceUpdatedAt`;
- `fetchedAt`;
- `availability`: available, unavailable, plan-restricted, not-applicable ou fallback;
- `limitation`;
- `fallback`.

Configuração e conectividade são estados separados. Token presente retorna “configurado / não verificado”. Somente `verify=1` executa uma consulta controlada e registra `checkedAt`.

## Evolução

Novos providers devem implementar capacidades, contratos internos e proveniência sem serem importados por componentes. Composição futura deve escolher provider por capacidade e classe; fallback nunca pode apagar a causa da indisponibilidade.

## Contrato de eventos e pré-requisitos da CORE-14

`marketContracts.js` reserva DIVIDEND, JCP, BONUS, SPLIT, REVERSE_SPLIT, SUBSCRIPTION, CONVERSION e UNKNOWN. A abstração não persiste nem converte eventos em operações.

Antes de Proventos Automáticos, a CORE-14 precisa:

1. escolher fonte/capacidade com cobertura comprovada por ação e FII;
2. preservar declaração, ex-date, data-com e pagamento separadamente;
3. definir identidade determinística, deduplicação e idempotência entre atualizações;
4. distinguir provento anunciado, aprovado, pago e cancelado;
5. reconciliar evento externo com operação manual sem sobrescrever UUID;
6. exigir consentimento para criar qualquer fato na carteira e respeitar fonte Local/Supabase;
7. definir RLS/transação caso exista persistência remota;
8. manter eventos corporativos fora de compra/venda e testar a engine financeira.
