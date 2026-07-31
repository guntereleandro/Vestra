# Contrato de operações

Status: contrato oficial auditado na CORE-07.

## Fonte da verdade

Operações são a única fonte persistida para posições, custo, preço médio, vendas, resultados e proventos. A engine deriva esses valores e nenhuma tabela pode competir com ela.

## Tipos canônicos

| Tipo | Quantidade | Preço unitário | Taxas | Valor recebido |
|---|---:|---:|---:|---:|
| `COMPRA` | maior que zero | zero ou positivo | zero ou positivo | derivado |
| `VENDA` | maior que zero | zero ou positivo | zero ou positivo | derivado |
| `DIVIDENDO` | zero | zero | zero ou positivo | maior que zero |
| `JCP` | zero | zero | zero ou positivo | maior que zero |
| `RENDIMENTO` | zero | zero | zero ou positivo | maior que zero |

Não há aliases canônicos adicionais. O MVP antigo convertia posições agregadas em `COMPRA` e renda agregada em `DIVIDENDO` ou `RENDIMENTO`.

## Registro de domínio

- `id`: UUID estável.
- `ticker`: 1–30 caracteres normalizados em maiúsculas.
- `assetName`: nome obrigatório, até 80 caracteres na interface.
- `assetType`: tipo normalizado pelo catálogo.
- `operationType`: um dos cinco tipos canônicos.
- `date`: data civil ISO `YYYY-MM-DD`.
- `quantity`: Number não negativo; até oito casas são preservadas no banco.
- `unitPrice`: Number não negativo; até oito casas são preservadas no banco.
- `fees`: Number não negativo; até oito casas são preservadas.
- `totalValue`: para compra, `quantity * unitPrice + fees`; para venda, `max(0, quantity * unitPrice - fees)`; para renda, valor informado.
- `notes`: texto opcional, até 240 caracteres.

`portfolioId`, `createdBy`, timestamps, `source` e `externalId` são metadados de infraestrutura e não entram na engine.

## Ordenação e edição

A engine ordena por data e, na mesma data, processa compra antes de venda e renda. A listagem remota ordena por data e UUID. Edição preserva o ID; no banco também preserva carteira e autor. Exclusão é física e explícita.

Vendas acima da posição são rejeitadas pelo modal atual. A engine limita defensivamente a baixa à quantidade existente; o repository legado não consulta posição ao validar.

## Precisão

PostgreSQL usa `numeric(28,8)` para quantidade e `numeric(24,8)` para dinheiro. O domínio atual usa JavaScript `Number`; a conversão ocorre apenas no adapter. Valores calculados não são arredondados pela persistência.

## Identidade local

Novos registros recebem `crypto.randomUUID()`. Registros legados sem UUID recebem UUID na primeira leitura e o array normalizado é gravado novamente em `vestra:operations:v1`. Backups antigos são aceitos e recebem UUID durante a restauração. Não há deduplicação por data, ticker ou valor.

## Dados não persistidos

Preço médio, quantidade mantida, custo atual, lucro realizado ou não realizado, posição, patrimônio, rentabilidade e totais globais permanecem derivados pela engine.
