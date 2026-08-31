# Proventos Automáticos

## Definição

Proventos automáticos significam descoberta de eventos públicos, cálculo de uma expectativa privada e conciliação assistida. Não significam crédito financeiro automático.

```text
BRAPI -> normalizador -> evento global -> elegibilidade histórica -> expectativa da carteira
                                                              -> confirmação/vínculo -> operação recebida
```

`portfolio_operations` continua sendo a única fonte da verdade para dinheiro recebido. Expectativas nunca entram em patrimônio, aportes, disponibilidade, performance realizada, snapshots, Dashboard recebido, diagnostics ou renda passiva histórica.

## Contratos e lifecycle

- Evento: `DIVIDEND`, `JCP` ou `INCOME`; lifecycle global `ANNOUNCED`, `CONFIRMED`, `CORRECTED`, `CANCELLED`, `UNKNOWN`.
- Expectativa: `ELIGIBLE`, `EXPECTED`, `CONFIRMED_RECEIVED`, `RECONCILED`, `IGNORED`, `CANCELLED`, `CONFLICT`.
- Operação confirmada: `DIVIDENDO`, `JCP` ou `RENDIMENTO`, segundo a regra permanente de `isPassiveIncomeOperation`.

Caixa Remunerado, renda fixa por valor, amortização, bônus, split e conversão não geram expectativas de proventos.

## Identidade e precisão

A identidade canônica combina ativo/ISIN, tipo, datas de corte/ex/pagamento, valor unitário, moeda, parcela e período. Alias externo preserva a identidade do provider. Nunca se deduplica apenas por ticker/data ou ticker/data/valor. Quantidade e valores usam oito casas na persistência; a multiplicação pura usa inteiros escalados, sem arredondamento binário de `Number`.

## Elegibilidade

Precedência de corte: data-com explícita; `lastDatePrior` comprovada; ex-date somente com calendário de mercado confiável. Sem corte confiável, o evento fica auditável e nenhuma expectativa é criada. A quantidade é reconstruída pelo ledger cronológico existente, incluindo compra, venda, split, bonificação e conversão.

## BRAPI e sincronização

O adapter v2 consulta um ticker por chamada, no máximo três simultâneos, com cache e deduplicação in-flight. Resultados por ativo distinguem `SUCCESS`, `NO_EVENTS`, `UNSUPPORTED`, `PLAN_RESTRICTED`, `NOT_FOUND`, `RATE_LIMITED` e `ERROR`; falha parcial não derruba os demais ativos. A janela inicial é 550 dias de operações relevantes e 180 dias à frente.

A rota autenticada exige carteira ativa, papel owner/editor e fonte `SUPABASE`. Ela nunca cria operações. A confirmação e o vínculo são RPCs atômicas e idempotentes. Um vínculo não pode cruzar carteiras.

## Correções, cancelamentos e matching

Expectativa ignorada não é recriada. Correção atualiza apenas expectativa ainda não reconciliada e deve manter histórico de versão. Recebimento reconciliado nunca é alterado automaticamente. Cancelamento bloqueia pendentes; recebidos viram revisão, sem exclusão.

Matching usa carteira, ativo, tipo, data e valor. `EXACT_MATCH` pode ser vinculado após ação do usuário; `LIKELY_MATCH` e `AMBIGUOUS` exigem revisão; UUID manual é preservado.

## Backup e importação

Operações confirmadas já pertencem ao backup normal. Eventos e expectativas são dados remotos reconstruíveis e não são exigidos por backups/importações antigos. Importações legadas não fabricam expectativas.

## Estado de validação em 2026-08-30

Contratos, engine pura, migration, repositories, adapter, rota, UI e regressões locais foram implementados. O build passou. O dry-run remoto foi bloqueado por falha de conexão PostgreSQL da Supabase CLI antes de qualquer mudança. Migration, RLS, SDK remoto, dry-run da carteira real, primeira sincronização e idempotência real permanecem gates obrigatórios.

### CORE-14.1 — gate remoto

O painel autenticado confirmou o projeto `mwdogrezcpuzpohpeirs`, branch `main`, região São Paulo. O primeiro preflight ocorreu enquanto o compute estava em `Coming up…` e retornou uma visão transitória incompleta. Após o estado `Healthy`, a mesma inspeção confirmou 1 usuário Auth, `profiles`, `portfolios`, `portfolio_preferences`, `portfolio_operations` e 109 operações. As quatro tabelas CORE-14 ainda não existem.

A migration CORE-14 não foi aplicada. Seus pré-requisitos CORE-05–CORE-11 e a carteira real estão presentes; a CLI ainda precisa de conectividade/autenticação PostgreSQL validada e um novo preflight deve ocorrer somente com o compute `Healthy`. Nenhuma restauração é necessária e nenhuma operação, evento ou expectativa foi modificada.
