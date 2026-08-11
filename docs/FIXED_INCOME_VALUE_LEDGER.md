# Renda fixa baseada em valor

## Escopo

Este contrato atende CDB, LCI, LCA, LCD e instrumentos equivalentes cuja posição natural é um saldo monetário. Tesouro Direto permanece quantitativo quando a origem fornece quantidade e preço.

## Eventos

- `FIXED_INCOME_APPLICATION`: aporte por valor; aumenta saldo e capital aplicado.
- `FIXED_INCOME_REDEMPTION`: resgate por valor; reduz saldo e realiza proporcionalmente a remuneração acumulada.
- `RENDIMENTO`: aumenta saldo sem aumentar capital. Pode ser um lançamento real ou ajuste acumulado explicitamente datado na reconciliação.

Os dois fluxos usam `totalValue` no domínio e `value_amount` no PostgreSQL. `quantity`, `unitPrice` e `fees` ficam zero. A engine usa preço interno 1 apenas para consolidar o saldo; isso nunca é persistido como quantidade inventada.

## Identidade

Instrumentos sem ticker de mercado recebem identificador interno determinístico composto por produto, indexador e vencimento quando confirmados. O nome não afirma existência de ticker negociável.

## Segurança

Uma importação deve usar UUIDs determinísticos, validar carteira e fonte antes da escrita, caber em uma única operação atômica ou usar transação server-side e reconciliar novamente após a gravação. Ajustes acumulados precisam informar data de referência e evidência; distribuição histórica desconhecida não é fabricada.

## Limites

Tributação detalhada, marcação a mercado, curvas de indexador, garantia, carência e liquidez intradiária permanecem fora desta etapa.
