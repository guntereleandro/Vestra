# Eventos corporativos

## Decisão

Eventos corporativos fazem parte do ledger cronológico de `portfolio_operations`, mas não são fluxos financeiros. A mesma ordenação usada pela engine impede que uma tabela paralela se torne uma segunda fonte da verdade. Os tipos atuais são `SPLIT`, `BONUS` e `CONVERSION`; grupamento usa `SPLIT` com razão inversa.

## Semântica

- `SPLIT`: `ratio_from` → `ratio_to`; multiplica a quantidade e preserva o custo total.
- `BONUS`: acrescenta `quantity` e `attributed_cost`; nunca gera aporte. Custo desconhecido fica `PENDING` localmente e bloqueia importação remota.
- `CONVERSION`: baixa `quantity` do ticker de origem e credita `target_quantity` no destino. Transfere `transferred_cost` explícito ou, quando ausente, o custo proporcional determinístico. Não cria venda, aporte ou lucro realizado.

Os eventos não usam `income_amount`, `cash_amount`, preço unitário ou taxas. Cisão e subscrição não foram implementadas; a estrutura de destino e custo transferido permite evolução sem aliases de compra/venda.

## Invariantes

Desdobramento não altera custo total. Bonificação não entra em contribuições. Conversão preserva continuidade econômica e deve ser atômica no mesmo registro. Eventos inválidos ou com base de custo pendente não podem passar pela importação segura.
