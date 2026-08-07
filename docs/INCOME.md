# Proventos

Proventos são operações e não constituem uma segunda fonte de verdade.

`DIVIDENDO`, `JCP` e `RENDIMENTO` permanecem em `portfolio_operations` ou `vestra:operations:v1`. `incomeAnalytics.js` filtra a coleção operacional ativa e calcula totais, pagamentos, média mensal, agrupamentos, meses sem pagamento e filtros. Não existe tabela de proventos.

Criação, edição e exclusão usam `operationsService`; owner/editor escrevem e viewer somente lê. Troca de fonte ou carteira substitui toda a coleção, sem combinação Local/Supabase. Backups e a importação CORE-07 já incluem proventos como operações.
