# Performance Patrimonial

## Objetivo

A engine em `lib/engine/performance` explica a evolução registrada do patrimônio sem acessar interface, armazenamento, mercado ou APIs. Aportes são fluxos de capital e nunca são apresentados como rentabilidade.

## Contrato

Entrada: `history`, `operations`, `positions` e `generatedAt`. Saída: `summary`, `growth`, `drawdown`, `contributions`, `timeline`, `scores`, `dataQuality` e `limitations`.

O patrimônio acompanhado de cada registro é `currentValue + dividends`. No período:

- crescimento = patrimônio final − patrimônio inicial;
- aportes = compras − vendas registradas entre as datas inicial e final;
- proventos = proventos acumulados finais − iniciais;
- valorização = crescimento − aportes − proventos;
- rentabilidade estimada = valorização ÷ (patrimônio inicial + aportes líquidos).

O drawdown compara cada registro ao maior patrimônio anterior. Contribuições por ativo usam `profit + dividends` das posições atualmente consolidadas.

## Score wealth_consistency

O score varia de 0 a 100 e combina:

- crescimento: 30%; componente neutro em 50, ajustado pela variação percentual;
- regularidade: 30%; meses com aportes em relação a seis meses;
- estabilidade: 25%; 100 menos duas vezes o drawdown percentual;
- suficiência histórica: 15%; quantidade de registros em relação a doze.

Cada componente é limitado a 0–100. A confiança cresce linearmente até doze registros. O score descreve a série disponível e não avalia qualidade de investimento.

## Limitações

- Histórico diário esparso pode ocultar drawdowns entre registros.
- Vendas são tratadas como fluxos negativos para separar capital e valorização.
- Ativos encerrados podem não aparecer no ranking de contribuições atual.
- Não há ponderação temporal de fluxos nem cálculo TWR/XIRR nesta versão.
