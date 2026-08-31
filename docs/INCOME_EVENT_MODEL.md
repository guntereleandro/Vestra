# Modelo conceitual de eventos de proventos

Status: proposta da CORE-14; nenhuma tabela ou comportamento implementado.

## Três fatos independentes

```text
Evento global de mercado
  -> elegibilidade e expectativa por carteira
     -> confirmação/conciliação
        -> operação financeira recebida
```

1. **Evento de mercado:** fato público sobre um instrumento; não pertence a uma carteira.
2. **Expectativa:** projeção privada calculada com a posição histórica de uma carteira.
3. **Operação recebida:** fato financeiro confirmado, mantido em `portfolio_operations`.

Somente o terceiro integra Proventos, Dashboard, snapshots, diagnostics e performance realizada. Expectativas não alteram a engine.

## Identidade canônica do evento

O mesmo evento pode chegar de várias fontes e não possui necessariamente ID universal. A identidade deve combinar:

- instrumento canônico, preferencialmente ISIN mais ticker vigente/bolsa;
- tipo econômico normalizado: `DIVIDEND`, `JCP`, `FII_INCOME`, `AMORTIZATION` ou `UNKNOWN`;
- data de elegibilidade (`recordDate`/data-com) e, quando conhecido, `exDate`;
- data/parcela de pagamento;
- valor bruto por unidade, moeda e precisão original;
- período relacionado ou identificador da parcela;
- versão do algoritmo de identidade.

`providerEventId` e `source` são aliases, não a identidade econômica isolada. A chave canônica pode ser um hash determinístico do tuple normalizado, com namespace e versão. Nunca usar apenas ticker + data ou ticker + data + valor.

Cada fonte mantém `(provider, providerEventId ou sourceFingerprint) -> canonicalEventId`. Eventos sem dados suficientes ficam `UNKNOWN`/em conflito, sem fusão automática. Dois pagamentos do mesmo ativo no mesmo dia permanecem separados por tipo, parcela/período, valor e aliases.

## Ciclo de vida

Fluxo normal conceitual:

```text
ANNOUNCED -> CONFIRMED -> ELIGIBLE -> EXPECTED -> PAID -> RECONCILED
```

- `ANNOUNCED`: publicação inicial, ainda sujeita a mudança.
- `CONFIRMED`: fonte aceita como suficiente para datas e valor.
- `ELIGIBLE`: carteira tinha posição elegível positiva.
- `EXPECTED`: valor da carteira foi calculado e pode aparecer em “A receber”.
- `PAID`: pagamento consta na fonte, mas ainda não prova crédito na conta do usuário.
- `RECONCILED`: operação recebida foi confirmada ou vinculada.

Estados excepcionais:

- `CORRECTED`: uma nova revisão substitui campos da versão anterior;
- `CANCELLED`: fonte confiável cancelou o evento;
- `UNKNOWN`: dados insuficientes, conflitantes ou tipo não mapeado.

Uma correção cria nova versão auditável. Evento global e expectativa ainda não reconciliada podem ser atualizados; operação recebida nunca é editada silenciosamente.

## Datas e elegibilidade

Campos separados:

- `declaredAt`/`approvedOn`: anúncio ou aprovação;
- `recordDate`/`lastDatePrior`: último dia com direito;
- `exDate`: primeiro dia sem direito, quando explícito;
- `paymentDate`: previsão/data de pagamento;
- `sourceObservedAt`: quando a fonte foi consultada;
- `effectiveFrom`: início da versão/correção.

Precedência para a data de corte:

1. `recordDate` ou data-com explícita e confiável;
2. `lastDatePrior` documentado como último dia com direito;
3. se houver apenas `exDate`, usar o pregão imediatamente anterior segundo calendário oficial;
4. nunca usar declaração ou pagamento como corte;
5. conflito ou calendário indisponível resulta em `UNKNOWN`, não em inferência por `-1 dia`.

Quantidade elegível é a posição derivada no fechamento da data de corte, dentro da carteira:

- compras e vendas até o corte, com convenção de negociação/liquidação documentada;
- split e bônus aplicados cronologicamente;
- conversão transfere posição e custo sem venda/recompra;
- posição zerada não recebe; recompra posterior não recupera direito passado;
- quantidade atual nunca substitui posição histórica;
- multicorretora futura pode agregar contas dentro da mesma carteira, preservando a origem para conciliação.

O ledger atual usa data civil e ordenação por tipo/UUID. Antes da implementação, casos de compra e venda no próprio corte precisam de fixtures e uma regra explícita alinhada à B3.

## Valor esperado

```text
grossExpected = eligibleQuantity × grossRatePerUnit
netExpected = grossExpected - informedWithholdings
```

Preservar decimal de origem, moeda, escala, valor bruto, retenções informadas e líquido esperado. Ausência de retenção não equivale a zero conhecido. Para JCP, não estimar imposto sem fonte/contrato confiável; o Core pode mostrar bruto e líquido apenas quando recebido da fonte.

Rendimento de FII permanece `RENDIMENTO` quando confirmado como recebido. Amortização não é renda passiva: é devolução de capital e requer evolução específica do ledger. Bonificação, split, subscrição e conversão são eventos patrimoniais, fora de Proventos.

## Persistência conceitual

### `corporate_income_events` — global/compartilhada

- identidade canônica, instrumento/ISIN/ticker e tipo;
- todas as datas separadas;
- taxa bruta, moeda, precisão e período/parcela;
- estado, confiança, versão, origem preferida;
- payload fingerprint, `supersedes_event_id`, timestamps;
- sem `portfolio_id` e sem dados financeiros do usuário.

### `corporate_income_event_aliases` — global

- provider, provider event ID/fingerprint;
- canonical event ID;
- versão da normalização e observação de conflito;
- unicidade por provider + identidade externa.

### `portfolio_income_expectations` — privada

- `portfolio_id`, `event_id` e unicidade do par;
- data de corte usada, quantidade elegível e versão do ledger;
- bruto, retenções conhecidas, líquido, moeda;
- status, confiança, motivo de revisão/ignorar;
- sem efeito em `portfolio_operations`.

### `income_reconciliation_links` — privada

- `portfolio_id`, `expectation_id`, `operation_id`;
- método `MANUAL_CONFIRMATION`, `MANUAL_LINK` ou futuro `BROKER_STATEMENT`;
- score/critério de matching, confirmador e timestamp;
- uma operação não pode ser ligada silenciosamente a eventos incompatíveis.

Não criar tabela duplicada de recebidos: `portfolio_operations` continua sendo a fonte da verdade.

## RLS e multicarteria

- eventos e aliases globais: leitura autenticada ou pública conforme licença; escrita somente por backend controlado;
- expectativas e links: leitura conforme membership; owner/editor podem revisar/confirmar, viewer somente lê;
- operações: políticas existentes permanecem;
- cálculo sempre recebe `portfolio_id` explícito e não mistura carteiras;
- um evento global pode gerar no máximo uma expectativa por carteira, com quantidades distintas.

Licença da fonte pode impedir compartilhamento público do evento; nesse caso a exposição deve ser autenticada/contratual mesmo que o fato seja global.

## Conciliação com operação existente

Matching automático só pode produzir candidatos. Requer, em conjunto:

- mesma carteira, instrumento canônico e tipo compatível;
- datas de pagamento dentro de janela documentada;
- moeda e valores compatíveis dentro de tolerância explícita;
- quantidade elegível/taxa coerentes quando disponíveis;
- nenhum outro candidato ambíguo;
- aliases e parcela/período sem conflito.

Se houver uma operação manual equivalente, preservar seu UUID e criar apenas o link. Divergência ou múltiplos candidatos exige confirmação. Não deduplicar apenas por ticker, data ou valor.

Confirmação de expectativa sem operação existente deve criar operação e link na mesma transação. Reexecução encontra a unicidade do link/expectativa e não cria outra operação.

## Correções, cancelamentos e complementos

- expectativa não reconciliada acompanha a versão confirmada mais recente e mostra a mudança;
- expectativa ignorada permanece auditável;
- cancelamento impede nova confirmação e não apaga histórico;
- operação já reconciliada permanece imutável; correção abre conflito/revisão;
- complemento é novo evento/parcela quando economicamente distinto, não sobrescrita automática;
- conflito de fontes conserva todas as evidências e aplica precedência configurada.

## Idempotência

Após 100 execuções com a mesma entrada:

- um evento canônico;
- um alias por identidade externa;
- uma expectativa por evento/carteira;
- zero operações novas sem confirmação;
- no máximo uma operação vinculada após confirmação.

Correção acrescenta versão e atualiza somente a expectativa elegível ainda não reconciliada. Locks/unicidade e transação devem proteger corridas entre refresh manual e job futuro.

## Sincronização, cache e observabilidade

Primeiro estágio do Core:

1. botão manual “Atualizar proventos”;
2. buscar apenas ativos com posição/histórico potencialmente elegível;
3. cache servidor por provider + ticker + janela, TTL sugerido de 6 horas;
4. deduplicar requisições em voo, um ticker por chamada no plano Free e concorrência máxima três;
5. cache de evento histórico confirmado pode usar TTL de 24 horas; eventos futuros/alterados, 1–6 horas;
6. não consultar a cada render nem criar cron nesta fase;
7. falha parcial mantém resultados anteriores e expõe lacuna por ativo.

Logs sanitizados podem conter IDs internos, provider, contagens, latência, resultado e códigos de conflito. Nunca registrar token, payload bruto completo, posições, valores totais da carteira ou operações completas.

## UX mínima futura

`/proventos` terá duas visões:

- **Recebidos:** operações confirmadas atuais;
- **A receber:** expectativas com ativo, tipo, bruto/líquido conhecido, data prevista, status, origem e confiança.

Ações: confirmar recebimento, vincular operação existente, revisar, ignorar e atualizar. Ausência de data/valor deve aparecer como desconhecida. Nenhuma expectativa entra em totais realizados antes da reconciliação.
# Estado remoto

O modelo permanece definido e validado localmente, mas ainda não foi materializado no Supabase. A auditoria confirmou que os schemas predecessores estão presentes no Development correto; a leitura vazia do gate ocorreu durante a inicialização transitória do compute. A migration CORE-14 continua pendente.
