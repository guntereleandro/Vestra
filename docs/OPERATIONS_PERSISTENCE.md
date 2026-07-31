# Persistência de operações

## Arquitetura

`OperationsRepository` mantém o contrato assíncrono existente. Local usa `vestra:operations:v1`; Supabase usa `portfolio_operations`. O registry continua selecionando Local por padrão e a engine recebe uma coleção coerente de uma única origem.

## Mapeamento

O banco guarda `ticker`, `asset_name` e `asset_type` como snapshot do lançamento. Foi escolhido ticker, em vez de FK para `portfolio_assets`, porque o contrato local identifica operações por ticker e precisa preservar histórico mesmo quando metadados do catálogo mudam. `portfolio_id + ticker` possui índice para leitura.

Compra e venda não persistem `totalValue`: o adapter o recalcula pelo normalizador existente. Rendas persistem apenas `income_amount`, pois esse é o valor informado.

## Segurança

Membros leem; owner/editor escrevem e excluem; viewer só lê; anon não possui privilégio. `created_by` nasce de `auth.uid()`. Trigger impede alterar ID, carteira ou autor. O fluxo normal usa Browser Client, nunca Admin Client.

## Seleção do provider

O adapter Supabase é usado apenas pela área autenticada de importação/reconciliação e pelos testes controlados. CRUD da tela `/operacoes`, hooks, dashboard e engine continuam no Provider Local.

## Erros e interrupção

Upserts usam lotes de 500 IDs. Lotes confirmados não são revertidos se uma chamada posterior falhar; a repetição é segura e completa apenas os registros ausentes. Nenhuma falha remove dados locais ou registros remotos.
