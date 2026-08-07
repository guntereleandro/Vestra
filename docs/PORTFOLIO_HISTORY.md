# Histórico Patrimonial

## Fonte ativa

O Dashboard e a engine de performance consomem `portfolioHistory` carregado pelo mesmo provider das operações: Local usa snapshots do navegador; Supabase usa snapshots da carteira remota ativa. Não existe composição híbrida. Troca de fonte, carteira, login ou logout limpa o estado visível e o cache remoto antes da nova carga.

## Casos sem histórico

Carteira nova ou vazia não recebe passado inventado. O gráfico explica que o histórico começa no primeiro estado financeiro completo observado. Um único ponto inicia o acompanhamento; dois ou mais pontos habilitam as análises temporais existentes.

## Dados derivados

`journeyRecords` representa máximos e marcos reconstruíveis a partir de operações, posições e snapshots. Permanece local por compatibilidade, sem tabela remota; a direção futura é derivá-lo, não duplicá-lo.

`lastDashboardVisit` mede mudanças desde a visita anterior no dispositivo. É estado de UX, não verdade financeira, e permanece local por dispositivo.

## Performance

As fórmulas de crescimento, aportes, valorização, proventos, drawdown, contribuições e `wealth_consistency` não foram alteradas. Apenas a coleção histórica de entrada passou a respeitar a fonte ativa.
