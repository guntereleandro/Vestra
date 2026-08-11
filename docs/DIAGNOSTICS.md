# Engine de Diagnóstico Patrimonial

## Objetivo

`lib/engine/diagnostics` transforma fatos da carteira em diagnósticos estruturados, determinísticos, factuais e neutros. A engine é pura: não acessa React, armazenamento, rede, providers ou APIs e não emite recomendações.

## Contrato de entrada

`generatePortfolioDiagnostics(input)` aceita `positions`, `operations`, `totals`, `income` (ou `proventos`), `assetMetadata` (ou `assetsMetadata`), `objectives`, `parameters` e `generatedAt`.

Diagnósticos de renda usam exclusivamente `isPassiveIncomeOperation`. `RENDIMENTO` de Caixa Remunerado ou Renda Fixa por valor não participa de concentração, dependência, média ou resiliência de proventos, embora continue compondo retorno econômico e performance.

- Posições devem chegar consolidadas, com ticker, tipo, quantidade, valor atual e dados da cotação.
- Operações inválidas são contadas e ignoradas nas análises dependentes delas.
- Proventos consolidados aceitam ticker, data e valor em `totalValue`, `value` ou `amount`.
- Metadados podem incluir setor, país, moeda e classe.
- Parâmetros previstos: `targetAllocation`, `maxPositionPercent`, `maxClassPercent`, `preferredCountries`, `preferredCurrencies` e `riskProfile`.
- `generatedAt` é fornecido pelo chamador. Quando ausente, a saída usa `null` e não avalia idade de cotações, preservando o determinismo.

Campos ausentes não são inventados: reduzem a confiança e aparecem nas limitações.

## Contrato de saída

```js
{
  generatedAt,
  summary,
  scores: {
    diversification: { value, confidence, limitations },
    concentration: { value, confidence, limitations },
    income_resilience: { value, confidence, limitations },
    data_quality: { value, confidence, limitations }
  },
  diagnostics: [{ id, category, severity, status, title, summary, evidence, metrics, confidence, limitations }],
  dataQuality,
  limitations
}
```

`confidence` varia de 0 a 1. Scores variam de 0 a 100, descrevem somente os dados observados e não são um score geral de qualidade do investimento.

## Fórmulas dos scores

Todas as referências, limites e pesos estão em `diagnosticRules.js`.

- `diversification`: 40% cobertura do mínimo de ativos + 35% cobertura do mínimo de classes + 25% cobertura setorial. Cada componente é limitado a 100.
- `concentration`: 50% maior posição + 30% três maiores posições + 20% maior classe. Componentes começam em 100 no limite configurado e caem linearmente até zero ao se aproximarem de 100%.
- `income_resilience`: 70% concentração da maior fonte + 30% cobertura do período mínimo. Sem proventos, a confiança é zero.
- `data_quality`: 45% cobertura de cotações + 20% atualidade + 25% metadados completos + 10% validade das operações. Sem `generatedAt`, atualidade vale zero e a confiança é reduzida.

Valores são arredondados para inteiros para evitar falsa precisão. Confiança e limitações devem acompanhar qualquer exibição futura.

## Regras atuais

- posição acima de 30%; três maiores acima de 70%; classe acima de 60%;
- referências mínimas de 5 ativos e 3 classes;
- uma fonte acima de 60% dos proventos;
- cotação com mais de 7 dias;
- mínimo de 6 meses para média mensal de proventos.

Limites de posição e classe aceitam parâmetros personalizados. Os demais parâmetros ficam reservados sem inferências nesta versão.

## Limitações

- Não projeta preços ou renda, não avalia retorno esperado e não recomenda ativos.
- Não calcula volatilidade, correlação, liquidez, crédito ou adequação ao perfil.
- Exposição geográfica, cambial e setorial depende dos metadados recebidos.
- Não há série histórica patrimonial no contrato atual.
- Datas e moedas não são convertidas; valores devem chegar consolidados.

## Como adicionar diagnósticos

1. Adicione limites somente em `diagnosticRules.js`.
2. Implemente função pura no módulo da categoria.
3. Produza o schema completo por `createDiagnostic`.
4. Inclua evidências, métricas, confiança e limitações.
5. Integre no orquestrador e adicione fixture ao validador.
6. Confirme determinismo, scores válidos, ausência de números não finitos e linguagem não recomendatória.

## Consumo futuro por IA

Uma futura IA deverá receber somente esta saída estruturada. Ela poderá explicar fatos e limitações calculados, mas não recalcular métricas, inventar dados nem ser a fonte primária dos diagnósticos.

## Consumo pela interface

Desde a versão 0.7.1, `/carteira` consome a saída por `usePortfolioDiagnostics`. O hook prepara posições, operações, totais e metadados, memoiza a execução e sanitiza falhas inesperadas. Ele não contém limites, pesos ou fórmulas.

A interface apresenta os quatro scores com rótulos neutros, confiança e limitações. Até cinco diagnósticos são ordenados para exibição por severidade, relevância do status e confiança. Evidências e métricas permanecem em elementos `details`, acessíveis por teclado. Nenhum componente infere recomendação ou qualidade absoluta.

Os cenários de carteira vazia, concentrada, diversificada, dados incompletos e proventos concentrados são cobertos por `scripts/validate-diagnostics.mjs`, que também verifica valores não finitos e linguagem proibida.

## Estratégia personalizada

A versão 0.7.2 persiste preferências em `vestra:diagnosticPreferences:v1`: limites por ativo e classe, alocação-alvo, países, moedas, perfil de risco, foco e data de atualização. `lib/data/diagnosticPreferences.js` valida, normaliza, lê e grava o contrato.

Os quatro scores e diagnósticos gerais continuam usando regras padrão. Preferências entram por `parameters` e geram itens com `scope: "strategy"` para limites excedidos, diferenças da alocação-alvo, países ou moedas preferidos sem exposição e conflitos entre foco e composição quando há classes calculáveis.

As referências de foco ficam centralizadas: renda considera FIIs e Renda Fixa; crescimento considera Ações, ETFs, BDRs e Cripto; foco equilibrado observa a maior classe. Perfil de risco é persistido, mas ainda não altera fórmulas.

O backup schema 4 inclui `diagnosticPreferences`. Backups 1, 2 e 3 continuam aceitos e recebem preferências vazias na importação.

## Perfil e tolerância a risco

A versão 0.7.3 persiste o questionário em `vestra:riskProfile:v1`. Sete dimensões recebem pontos: experiência, horizonte, liquidez, estabilidade de renda, tolerância a perdas, reserva e objetivo. Cada dimensão vale de 0 a 2 pontos, com objetivo de renda valendo 0,5. Até 5 pontos resulta em perfil conservador; acima de 5 até 10, moderado; acima de 10, agressivo.

Parâmetros derivados por perfil:

- conservador: ativo 10%, classe 40%, renda variável 30%, cripto 0%, caixa 20%;
- moderado: ativo 15%, classe 55%, renda variável 55%, cripto 5%, caixa 10%;
- agressivo: ativo 25%, classe 70%, renda variável 80%, cripto 10%, caixa 5%.

Esses valores são referências. A estratégia nunca é sobrescrita durante cálculo, salvamento ou importação. A ação explícita de aplicação mostra prévia e exige confirmação.

Diagnósticos com `scope: "risk_profile"` verificam renda variável frente ao perfil, cripto, liquidez declarada, ausência informada de reserva e horizonte curto com classes voláteis. A interface apresenta no máximo três itens em “Coerência com seu perfil”.

O backup schema 6 inclui `riskProfile` e eventos do ledger sem recalcular o perfil na importação. Backups 1 a 5 permanecem aceitos.

## Padrões de comportamento

A versão 0.7.4 usa somente operações, datas, tipos, quantidades, valores, tickers, encerramentos e proventos. A análise exige seis meses e seis operações para métricas de ritmo; dois encerramentos para permanência; três saídas para giro. Intervalos de até 7 dias são próximos, mudanças de 25% são relevantes e concentração de 70% ativa diagnósticos. Todos os limites ficam em `diagnosticRules.js`.

O score `behavior_consistency` combina regularidade dos aportes (35%), estabilidade do ritmo (25%), dispersão entre ativos (25%) e suficiência do histórico (15%). O resultado é arredondado, determinístico, inclui confiança e limitações e não julga o investidor.

Diagnósticos cobrem frequência e constância mensal, concentração por ativo e classe, tempo até encerramento, operações próximas, mudança recente, recorrência e concentração de proventos e giro quando a amostra é suficiente. A Carteira mostra o score e até quatro itens em seção separada.
