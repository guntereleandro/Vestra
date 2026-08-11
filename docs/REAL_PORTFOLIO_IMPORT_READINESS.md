# Preparação da importação da carteira real

> Decisão final de 2026-08-11: as evidências posteriores eliminaram as pendências categoria A. Renda variável, Tesouro, LCI BRB e Mercado Pago reconciliam; CDBs encerrados permanecem retidos como B. O preflight operacional de destino, fonte, backup, idempotência e duplicidade foi aprovado. A escrita aguarda autorização expressa.

Status: suporte de domínio implementado; migrations e SDK validados no Supabase Development; reconciliação integral e preflight aprovados em 2026-08-11. A carteira real ainda não foi importada.

## Objetivo e limite

Este documento compara os eventos encontrados na carteira do Investidor10 com o contrato canônico do Vestra. A importação não deve transformar eventos desconhecidos em `COMPRA`, `VENDA` ou provento apenas para fazê-los passar pela validação. Registros sem representação econômica fiel ficam retidos, preservados em sua forma de origem e fora da engine até uma decisão explícita de domínio.

O contrato atual também aceita `SPLIT`, `BONUS`, `CONVERSION`, `CASH_DEPOSIT`, `CASH_WITHDRAWAL`, `FIXED_INCOME_APPLICATION` e `FIXED_INCOME_REDEMPTION`. A matriz abaixo preserva o diagnóstico anterior; sua resolução definitiva está registrada na seção “Patch de compatibilidade” e em `REAL_PORTFOLIO_PRE_IMPORT_RECONCILIATION.md`.

## Matriz de compatibilidade

| Caso real | Compatibilidade atual | Decisão de importação | Motivo |
|---|---|---|---|
| Compra e venda ordinárias | Compatível | Importar após validação e reconciliação | O fato econômico coincide com `COMPRA`/`VENDA`. |
| Dividendo, JCP e rendimento efetivos | Compatível | Importar após validação e reconciliação | O fato econômico coincide com os tipos de renda, sem quantidade. |
| Bonificação em ações/cotas, origem `Bônus` | Incompatível | Reter | Não existe evento que aumente quantidade preservando ou alocando custo sem registrar aporte. Não converter em compra comum ou compra a custo zero sem regra fiscal explícita. |
| Desdobramento, inclusive SADI11 1:10 | Incompatível | Reter | Deve multiplicar quantidade e ajustar preço unitário/preço médio sem mudar custo, patrimônio ou aporte. Compra/venda não expressa isso. |
| Conversão/incorporação SADI11 → SAPI11 | Incompatível | Reter o par como uma unidade | Exige transferência atômica de quantidade e base de custo, com continuidade econômica e sem presumir alienação tributável. |
| Depósitos em `CDB - Mercado Pago - Pós-Fixado - 120% CDI` | Incompatível com segurança | Reter | São aportes em caixa remunerado, não `RENDIMENTO` e não CDB convencional. O rótulo `Caixa` existente é apenas classificação de ativo; não define saldo, liquidez, remuneração, resgate ou tributação. |
| Tesouro IPCA+ 2032, quantidade 0,10 | Compatível com ressalvas | Importar condicionalmente | Quantidade e preço aceitam oito casas decimais. O título e vencimento devem compor uma identidade estável; vencimento e indexador ainda não são campos estruturados. O valor aplicado deve reconciliar com quantidade × preço + taxas. |
| CDB, LCI e renda fixa tradicional | Compatível para movimentação básica, incompleto para atributos | Importar condicionalmente | Aporte/resgate pode ser modelado como compra/venda e `Renda Fixa` existe como classe. Vencimento, indexador, emissor, liquidez e tributação não são estruturados e não podem ser inferidos. |

## Regras de retenção

- Preservar o registro bruto, descrição da origem, data, identificador externo e vínculo entre eventos relacionados.
- Não enviar o registro retido ao normalizador atual: tipos desconhecidos seriam descartados, e aliases artificiais alterariam seu significado.
- Conversão deve manter juntas a saída de SADI11 e a entrada de SAPI11; importar apenas um lado é proibido.
- Nenhuma aproximação por observação, texto em `notes`, compra de custo zero ou venda/compra compensatória autoriza alimentar a engine.
- A liberação exige contrato, cálculo, persistência, importador, reconciliação e testes de regressão cobrindo o evento.

## Impacto de uma classificação incorreta

| Classificação artificial | Quantidade | Preço médio/custo | Patrimônio | Lucro realizado | Performance |
|---|---|---|---|---|---|
| Bonificação como compra | Pode atingir a quantidade final | Registra aporte/custo inexistente ou aplica custo zero sem base fiscal | Pode divergir com cotação ausente ou identidade errada | Vendas futuras usam base incorreta | Aportes e retorno ficam distorcidos |
| Desdobramento como compra/venda | Pode duplicar, reduzir ou truncar saldo | Altera custo quando ele deveria ser preservado | Pode apresentar salto artificial | Uma venda artificial pode criar lucro | Cria fluxo de caixa inexistente |
| Conversão como venda + compra | Pode fechar/abrir posições, mas perde continuidade | Realoca ou reinicia a base sem regra | Pode duplicar ou omitir valor durante o par | Pode criar resultado tributável fictício | Registra retirada e aporte inexistentes |
| Depósito do Mercado Pago como rendimento | Não constitui corretamente o saldo | Não registra capital aportado | Saldo pode ficar ausente ou depender de cotação artificial | Não aplicável diretamente | Superestima renda e retorno e subestima aportes |
| Renda fixa sem identidade/vencimento estáveis | Quantidade pode estar correta | Custo básico pode estar correto | Pode agregar produtos distintos ou usar preço inadequado | Resgates podem usar base errada | Fluxos e valorização podem ser atribuídos ao instrumento errado |

## Condições para importação imediata

Cada registro compatível ainda precisa ter data válida, identificador estável, ativo não ambíguo, tipo econômico confirmado, valores não negativos e reconciliação com o total da origem. Para Tesouro e renda fixa, não arredondar quantidade; preservar até oito casas. O nome/identificador do instrumento deve distinguir série e vencimento. Diferença material entre valor aplicado e o total derivado impede a importação até ser explicada por preço, taxas ou outra regra documentada.

## Gate do Dia 1/30

A aprovação visual e técnica da CORE-12 permanece válida, mas a descoberta de dados reais incompatíveis reabre a prontidão da carga. Há bloqueador categoria A enquanto qualquer posição atual, base de custo ou histórico necessário ao acompanhamento diário depender de bonificação, desdobramento, conversão ou caixa remunerado retido.

Antes do Dia 1 é necessário, no mínimo:

1. inventariar e reconciliar todos os registros reais, sem executar a importação;
2. separar o lote importável do lote retido, sem perda silenciosa;
3. decidir e validar o modelo de eventos societários que afetam posições atuais, especialmente a continuidade SADI11 → SAPI11;
4. decidir o contrato de caixa remunerado para representar aportes, saldo, remuneração, resgates e tributação;
5. confirmar que títulos fracionários e renda fixa tradicional fecham quantidade, custo e valor aplicado.

Se os eventos retidos não afetarem posição, custo ou histórico exigido no período de validação, sua exclusão de escopo teria de ser explícita e reconciliada. No conjunto descrito, conversão e caixa remunerado afetam a carteira real; portanto, não é seguro iniciar oficialmente os 30 dias antes de resolver o gate.

## Fora do escopo desta auditoria

Não foram alterados contrato, engine, repositories, schema, migrations ou dados. Não foi executada importação nem definida implementação definitiva dos novos eventos.

## Patch de compatibilidade

O ledger passou a reconhecer `SPLIT`, `BONUS`, `CONVERSION`, `CASH_DEPOSIT` e `CASH_WITHDRAWAL`. A classificação de origem distingue operação comum, desdobramento, bônus, conversão, caixa remunerado e item não suportado. Nenhum item desconhecido recebe alias silencioso. O round-trip remoto, idempotência e matriz owner/editor/viewer/anon passaram com dados artificiais removidos ao final.

Fixtures sanitizadas confirmam SADI11 1:10, transferência SADI11 → SAPI11, bônus de GGBR4/GOAU4 com custo atribuído explícito, depósitos/rendimento/retirada do Mercado Pago e Tesouro IPCA+ 2032 com quantidade `0,10`. Esta foi a validação inicial do contrato; a reconciliação integral posterior está no fechamento abaixo.

## Fechamento do gate — 2026-08-11

A reconciliação posterior substitui as ressalvas históricas acima. As 22 posições de renda variável fecharam sem divergência; Tesouro preservou quantidade `0,10`; LCI BRB fechou em R$ 1.004,47 por ledger monetário; Mercado Pago fechou em R$ 183,18, separando R$ 171,58 de capital e R$ 11,60 de remuneração. Os seis registros de CDBs encerrados ficam fora do lote como categoria B.

O preflight remoto confirmou 109 eventos canônicos, destino único, fonte SUPABASE, backup disponível, ausência de fixtures e dual write, lote atômico, IDs determinísticos, zero conflito de UUID e zero duplicidade semântica contra as 8 operações remotas existentes. Não resta pendência A. **APROVADO PARA IMPORTAÇÃO REAL**, sem autorizar a escrita nesta etapa.
