# Portfolio Snapshots

## Papel no domínio

Operações permanecem a fonte da verdade financeira. Um snapshot é somente o estado patrimonial observado em uma data e não substitui operações, cotações ou a engine.

O valor acumulado de proventos é derivado dessas operações no momento do snapshot; não há segunda leitura de renda.

O contrato normalizado contém `id`, `portfolioId`, `date`, `timestamp`, `totalInvested`, `currentValue`, `profitLoss`, `dividends` e `positionsCount`. A engine calcula esses valores antes da persistência.

## Geração

`useInvestmentData` registra ou atualiza um snapshot depois que operações, ativos e cotações da fonte selecionada terminaram de carregar. A assinatura financeira impede repetição sem mudança; carteiras vazias não geram snapshot. Alterações do mesmo dia usam upsert determinístico por `portfolio_id + snapshot_date`.

Não há escrita durante loading, render puro, troca de fonte/carteira ou para viewer. Não há cron, Realtime ou job externo.

## Providers

- LOCAL: `vestra:portfolioHistory:v1`, preservado sem migração automática.
- SUPABASE: `public.portfolio_snapshots`, sempre filtrado pela carteira ativa.

O resolver entrega um único repository. Histórico Local nunca completa ou substitui histórico remoto ausente.

## Importação

A Conta oferece prévia manual Local → Supabase. A prévia mostra quantidade, período, registros novos, equivalentes e conflitos. Somente datas ausentes são inseridas; conflitos nunca são sobrescritos silenciosamente. Repetir a importação é idempotente e os dados locais permanecem intactos.

## Segurança

Owner e editor leem e escrevem. Viewer somente lê. Anon e usuário sem membership não recebem acesso. DELETE não é concedido ao cliente; `service_role` mantém somente SELECT/DELETE para fixtures e manutenção controlada.
