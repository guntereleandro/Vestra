# Selecao da fonte operacional

## Validacao remota CORE-08.1

Em 2026-08-01, a migration `20260801000100_core_08_data_source_preference.sql` foi aplicada ao Supabase Development `mwdogrezcpuzpohpeirs`. O dry run anterior mostrou somente essa migration e o dry run posterior confirmou o banco atualizado.

A matriz SDK confirmou default Local, troca e persistencia Supabase/Local, isolamento entre carteiras, login/logout sem alteracao implicita, importacao sem troca de fonte, anon bloqueado, usuario sem membership isolado e papeis owner/editor/viewer. A jornada visual confirmou leitura remota, CRUD owner, recarga, retorno Local e logout. Todos os usuarios, carteiras e registros artificiais foram removidos.

A restricao inicial era a verificacao de revogacao TLS do monitor local. A aplicacao segura usou o pooler oficial com `sslmode=require` e senha lida somente em memoria; nenhuma verificacao TLS foi desabilitada.

Cada carteira possui `portfolio_preferences.data_source`, com valores `LOCAL` ou `SUPABASE` e default `LOCAL`. Login, logout e importacao nao mudam essa preferencia.

`dataSourceResolver` valida configuracao, sessao, usuario, carteira ativa, membership, papel e carregamento. Ele entrega exatamente um conjunto de repositories aos servicos. Listas Local e Supabase nunca sao combinadas e CRUD nunca faz dual write.

Supabase exige escolha confirmada e carga bem-sucedida. Falhas aparecem como erro sem alterar a preferencia; o retorno Local no dispositivo e apenas um fallback em memoria. Logout limpa cache remoto e preserva localStorage. Trocar carteira limpa cache antes de resolver a nova preferencia.

Owner/editor podem trocar a preferencia e escrever. Viewer apenas consulta. Telas baseadas em operacoes exibem a origem. Os estados sem login, sem carteira, acesso negado, sessao expirada, rede indisponivel e erro remoto sao distintos; erro nunca equivale a carteira vazia.
