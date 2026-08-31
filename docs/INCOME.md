# Proventos

Proventos são operações e não constituem uma segunda fonte de verdade.

`DIVIDENDO`, `JCP` e `RENDIMENTO` permanecem em `portfolio_operations` ou `vestra:operations:v1`. `incomeAnalytics.js` filtra a coleção operacional ativa e calcula totais, pagamentos, média mensal, agrupamentos, meses sem pagamento e filtros. Não existe tabela de proventos.

Criação, edição e exclusão usam `operationsService`; owner/editor escrevem e viewer somente lê. Troca de fonte ou carteira substitui toda a coleção, sem combinação Local/Supabase. Backups e a importação CORE-07 já incluem proventos como operações.

## Fronteira de automação

Evento público, expectativa da carteira e recebimento são fatos diferentes. Dados anunciados por providers não entram em `portfolio_operations`, totais, Dashboard, snapshots, performance realizada ou diagnostics. A proposta da CORE-14 mantém “A receber” em domínio separado e exige confirmação conservadora ou conciliação com uma operação existente.

Caixa Remunerado e Renda Fixa continuam fora de Proventos mesmo quando possuem retorno positivo. Rendimento de FII recebido continua `RENDIMENTO`; amortização de FII é devolução de capital e não pode usar esse tipo sem evolução explícita do ledger.

Auditoria e modelo: `AUTOMATIC_INCOME_AUDIT.md` e `INCOME_EVENT_MODEL.md`.
