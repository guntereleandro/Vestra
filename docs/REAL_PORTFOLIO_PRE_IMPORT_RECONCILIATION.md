# Pré-importação e reconciliação da carteira real

Data: 2026-08-11  
Fonte: `data/imports/vestra_staging_importacao_real.json`  
Decisão dos dados: **reconciliação financeira e preflight operacional aprovados**. A escrita continua proibida nesta etapa e depende de autorização expressa do usuário.

## Limites e método

O staging foi lido integralmente e convertido somente em memória por `scripts/reconcile-real-import.mjs`. O dry-run reutiliza `normalizeOperations`, `validatePortfolioEvent` e `calculatePositions`. O preflight acessou o Supabase Development somente para leitura da carteira de destino e das operações existentes; nenhum dado real foi escrito.

O arquivo de origem não contém IDs externos estáveis. O importador deriva UUIDs determinísticos do fingerprint do arquivo congelado, domínio, índice e conteúdo do registro; a estratégia foi validada antes de qualquer escrita.

## Resultado geral

| Métrica | Resultado |
|---|---:|
| Registros de origem | 114 |
| Renda variável | 87 |
| Renda fixa e caixa | 26 |
| Tesouro Direto | 1 |
| Registros de origem prontos | 108 |
| Eventos canônicos prontos | 109 |
| Registros retidos, somente históricos | 6 |

Os 108 registros aproveitados viram 109 eventos: o par de conversão vira um evento, enquanto LCI e Mercado Pago recebem ajustes acumulados explícitos na data da reconciliação. O lote contém 81 compras, 2 vendas, 2 bônus, 1 split, 1 conversão, 19 depósitos de caixa, 1 aplicação de renda fixa e 2 rendimentos acumulados.

Os IDs do dry-run são UUIDs determinísticos derivados por SHA-256 do fingerprint do arquivo congelado, domínio, índice e conteúdo do registro. A mesma entrada produz o mesmo ID e pode ser reconciliada idempotentemente; isso é responsabilidade do importador e não exige informação adicional do usuário.

## Conversão canônica

- `COMPRA` e `VENDA`: quantidade, preço e total foram preservados; todos reconciliaram sem taxa implícita.
- `BONUS`: GGBR4 recebeu 1 ação com custo total confirmado de R$ 11,55; GOAU4 recebeu 3 ações com custo total confirmado de R$ 24,90. Os valores são sobreposições auditáveis do dry-run; o staging bruto não foi reescrito.
- `SPLIT`: SADI11 foi convertido em razão `1 → 10`, sem fluxo e sem alteração de custo.
- `CONVERSION_OUT` + `CONVERSION_IN`: o par SADI11 → SAPI11 de 2025-12-10 virou um único `CONVERSION`, com 20 cotas de origem e 18 de destino. O custo integral de R$ 169,82 foi transferido proporcionalmente pela regra determinística da engine; não houve venda, recompra, aporte ou lucro realizado.
- `CASH_DEPOSIT`: os 19 lançamentos do Mercado Pago permanecem aportes de R$ 171,58 em `MP-CASH`. Um único `RENDIMENTO` de reconciliação em 2026-08-11 registra R$ 11,60, fechando saldo R$ 183,18 sem inventar distribuição diária. Retiradas: R$ 0,00.
- Tesouro IPCA+ 2032: o evento canônico preserva quantidade `0,10`, preço unitário R$ 2.947,30, custo R$ 294,73 e vencimento confirmado em 2032-08-15. A identidade determinística interna é `TESOURO-IPCA-2032-20320815`; ela não pressupõe ticker de mercado.
- LCI BRB: `FIXED_INCOME_APPLICATION` de R$ 1.000,00 em 2026-07-30 e `RENDIMENTO` acumulado de R$ 4,47 em 2026-08-11 fecham saldo bruto de R$ 1.004,47. Nenhuma quantidade foi inventada.
- CDBs Banco Inter, Santander e XP: retidos como categoria B. Todos estão encerrados e não afetam a posição atual; dados ausentes não foram fabricados.

## Reconciliação de renda variável

Valores de custo e preço médio abaixo incluem as duas bonificações com os custos atribuídos agora confirmados.

| Ativo | Quantidade calculada | Esperada | Diferença | Custo remanescente | Preço médio | Lucro realizado |
|---|---:|---:|---:|---:|---:|---:|
| BBSE3 | 10 | 10 | 0 | R$ 349,98 | R$ 34,9980 | R$ 0,00 |
| BTCI11 | 30 | 30 | 0 | R$ 275,82 | R$ 9,1940 | R$ 0,00 |
| CPTS11 | 20 | 20 | 0 | R$ 142,68 | R$ 7,1340 | R$ 0,00 |
| FGAA11 | 30 | 30 | 0 | R$ 260,28 | R$ 8,6760 | R$ 0,00 |
| GARE11 | 80 | 80 | 0 | R$ 685,87 | R$ 8,573375 | R$ 0,00 |
| GGBR4 | 10 | 10 | 0 | R$ 178,423333 | R$ 17,842333 | R$ 3,153333 |
| GOAU4 | 24 | 24 | 0 | R$ 237,10 | R$ 9,879167 | R$ 4,12 |
| GOLD11 | 10 | 10 | 0 | R$ 250,50 | R$ 25,05 | R$ 0,00 |
| ITSA4 | 20 | 20 | 0 | R$ 235,45 | R$ 11,7725 | R$ 0,00 |
| KNCR11 | 1 | 1 | 0 | R$ 98,70 | R$ 98,70 | R$ 0,00 |
| MXRF11 | 30 | 30 | 0 | R$ 294,15 | R$ 9,8050 | R$ 0,00 |
| PETR3 | 5 | 5 | 0 | R$ 253,07 | R$ 50,6140 | R$ 0,00 |
| PETR4 | 6 | 6 | 0 | R$ 267,52 | R$ 44,586667 | R$ 0,00 |
| SADI11 | 0 | 0 | 0 | R$ 0,00 | R$ 0,00 | R$ 0,00 |
| SANB3 | 12 | 12 | 0 | R$ 152,90 | R$ 12,741667 | R$ 0,00 |
| SAPI11 | 40 | 40 | 0 | R$ 369,04 | R$ 9,2260 | R$ 0,00 |
| SYNE3 | 100 | 100 | 0 | R$ 478,30 | R$ 4,7830 | R$ 0,00 |
| TAEE11 | 7 | 7 | 0 | R$ 239,53 | R$ 34,218571 | R$ 0,00 |
| UNIP6 | 10 | 10 | 0 | R$ 601,35 | R$ 60,1350 | R$ 0,00 |
| VGHF11 | 30 | 30 | 0 | R$ 229,00 | R$ 7,633333 | R$ 0,00 |
| VGIA11 | 50 | 50 | 0 | R$ 466,84 | R$ 9,3368 | R$ 0,00 |
| XPML11 | 10 | 10 | 0 | R$ 1.086,85 | R$ 108,6850 | R$ 0,00 |

SADI11 fecha em zero e SAPI11 fecha em 40. A conversão preservou R$ 169,82 de custo histórico e as compras posteriores adicionaram R$ 199,22, totalizando R$ 369,04. Nenhum lucro realizado foi criado pela conversão.

Todas as 22 quantidades finais de renda variável reconciliaram. As bonificações corrigiram GGBR4 de 9 para 10 ações e GOAU4 de 21 para 24 ações; custo, preço médio e lucro realizado foram recalculados cronologicamente pela engine.

## Registros bloqueados e informações necessárias

| Categoria | Registro | Motivo | Informação necessária |
|---|---|---|---|
| B | CDB Banco Inter: compra R$ 1.000,00 e venda R$ 1.033,82 | Posição encerrada | Não afeta a posição atual. Para histórico/performance completos, fornecer valor bruto e líquido do resgate, IR/IOF/taxas e datas confirmadas; quantidade artificial não será exigida. |
| B | CDB Santander: compra R$ 491,64 e vendas R$ 500,00/R$ 7,43 | Posição encerrada | Não afeta a posição atual. Para histórico/performance completos, confirmar se os dois créditos compõem o resgate total e informar IR/IOF/taxas. |
| B | CDB XP: aplicação histórica R$ 3.000,00 | Posição confirmada como encerrada; datas não confiáveis | Reter fora do lote atual. Afeta apenas reconstrução histórica/performance; nenhum dado ausente será inventado. |
| C | LCI BRB | Saldo atual reconciliado | Aplicação R$ 1.000,00 + rendimento acumulado R$ 4,47 = R$ 1.004,47 em 2026-08-11. Limitações tributárias e de indexador são documentais nesta etapa. |
| C | Mercado Pago | Saldo atual reconciliado | Aportes R$ 171,58 + rendimento líquido acumulado R$ 11,60 − retiradas R$ 0,00 = R$ 183,18 em 2026-08-11. |
| B | Patrimônio e performance | Sem cotações, snapshots ou proventos | Confirmar que pertencem a outra etapa; esta reconciliação valida operações e custos, não patrimônio de mercado ou performance completa. |
| C | Precisão em memória | Resíduos binários de `Number` | O banco preserva oito casas; arredondar somente na exibição. Não houve divergência econômica. |

## Riscos se o bloqueio for ignorado

- Os bônus agora reconciliam quantidade e custo; tratá-los como compra ainda criaria aporte fictício e permanece proibido.
- Tratar renda fixa de valor puro como uma unidade a preço 1 inventa quantidade e mascara rendimento/resgate.
- Importar só um lado da conversão duplicaria ou eliminaria patrimônio; o dry-run atômico não apresentou esse defeito.
- A estratégia determinística elimina a dependência de IDs fornecidos pelo usuário; o importador ainda deve aplicar conflito idempotente pelo UUID gerado.
- Mercado Pago como rendimento integral superestimaria performance e subestimaria aportes; o dry-run separa R$ 171,58 de contribuição e R$ 11,60 de remuneração.
- O staging não contém `DIVIDENDO`, `JCP` ou `RENDIMENTO`; se esses fatos deveriam integrar a migração, proventos e performance ficariam incompletos.

## Decisão

Não resta divergência categoria A. As posições atuais, custos, aportes, retiradas e rendimentos conhecidos reconciliam. Os seis registros de CDB encerrados permanecem categoria B, fora do lote, e as limitações tributárias/documentais são categoria C.

O preflight remoto confirmou a carteira ativa `Minha carteira` como destino único, papel `owner`, fonte `SUPABASE`, backup disponível, ausência de dual write e de fixtures, lote de 109 eventos dentro do limite atômico, zero conflito de UUID e zero duplicidade semântica contra as 8 operações remotas existentes. Nenhuma operação real foi escrita no Supabase.

**APROVADO PARA IMPORTAÇÃO REAL**, condicionada apenas à autorização expressa do usuário e à execução do protocolo atômico com backup e reconciliação pós-gravação.
