# Caixa remunerado

## Domínio

`Caixa Remunerado` é classe própria, separada de `Caixa` e `Renda Fixa`. O produto Mercado Pago identificado externamente como CDB 120% CDI não é reinterpretado como CDB convencional.

## Ledger

- `CASH_DEPOSIT`: valor financeiro puro em `cash_amount`; aumenta saldo, capital investido e contribuições.
- `CASH_WITHDRAWAL`: reduz saldo, capital investido e contribuições líquidas.
- `RENDIMENTO`: aumenta o saldo do caixa sem aumentar aporte. Não entra nos totais de dividendos/proventos passivos; aparece no resultado da posição.

O saldo é apresentado pela engine como quantidade monetária com preço interno unitário igual a 1. Isso é uma representação derivada, não uma exigência de quantidade × preço no contrato persistido.

Tributação, faixas promocionais, limites de remuneração, IOF, IR, liquidez intradiária e conciliação bancária permanecem fora deste patch.

## Reconciliação acumulada

Quando apenas o saldo confirmado e o capital aportado estão disponíveis, um único `RENDIMENTO` datado na medição pode registrar a diferença acumulada com nota explícita. Isso não presume distribuição diária. Para o Mercado Pago em 2026-08-11: depósitos R$ 171,58, retiradas R$ 0,00, rendimento líquido acumulado R$ 11,60 e saldo R$ 183,18.
