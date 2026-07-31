# Regressão financeira

## Objetivo

Proteger os resultados da engine enquanto a origem das operações muda. O fixture permanente contém compras múltiplas, taxas, venda parcial, venda total, posição zerada, recompra, quantidade fracionária, dividendos, JCP, rendimento, múltiplos ativos, datas fora de ordem e oito casas decimais.

## Execução

- `npm run test:financial-regression`: memória e Local Repository.
- `node scripts/validate-database-sdk.mjs`: o mesmo fixture pelo Supabase Repository, local e Development.
- `npm run test:operations-benchmark`: 100, 1.000 e 10.000 operações.

## Resultados protegidos

Quantidade, custo, preço médio, valor atual, resultado não realizado, lucro realizado, proventos por ativo, totais globais e determinismo.

O lucro realizado foi adicionado como saída derivada da engine, sem persistência e sem alterar os valores anteriormente exibidos. Taxa de venda reduz o resultado realizado. `calculatePortfolioTotals` apenas agrega esse novo campo.

Qualquer diferença entre memória, Local e Supabase bloqueia a conclusão.
