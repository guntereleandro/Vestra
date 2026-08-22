# Histórico de preços

## Contrato

Versão 1.0.0. Cada ponto preserva:

- `timestamp`;
- `open`, `high`, `low`;
- `close`;
- `adjustedClose`;
- `volume`.

`close` é obrigatório para um ponto válido. Os demais campos usam `null` quando ausentes. A série é ordenada por timestamp e inclui proveniência.

## Cobertura atual

O plano Free é tratado como no máximo três meses. A UI oferece somente 1M e 3M; não promete 1A/5A/Max nem usa permissões de sandbox como garantia. A matriz real confirmou 64 pontos para PETR4, MXRF11 e IVVB11 em 3M.

## Gráfico

O gráfico principal usa `close`, entendido como preço de fechamento negociado. `adjustedClose` é preservado no contrato, mas não substitui silenciosamente o fechamento e não é tratado como retorno total. O SVG é responsivo, sem biblioteca nova, possui estados de loading, vazio, erro, retry, período e dados por ponto.

## Limitações

- sem análise técnica, RSI, MACD ou projeção;
- sem garantia de mesma profundidade para toda classe;
- sem preenchimento de dias ausentes;
- sem inferência de splits/proventos;
- sem cache persistente de histórico nesta entrega.

Eventos e ajustes futuros precisam reconciliar a semântica da fonte antes de alimentar performance ou carteira.
