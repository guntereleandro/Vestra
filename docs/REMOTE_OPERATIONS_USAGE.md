# Uso de operacoes remotas

1. Entre na conta e selecione a carteira remota.
2. Compare ou importe manualmente, se necessario. Importar nao ativa a fonte.
3. Revise contagens, conflitos e comparacao financeira.
4. Escolha Supabase e confirme.

Owner/editor executam CRUD remoto; viewer possui leitura. RLS e a autoridade final. Operacoes remotas nunca sao copiadas automaticamente para localStorage.

A reconciliacao compara UUIDs, quantidade, preco medio, custo, posicao, proventos, lucro realizado e totais. Divergencias nao sao resolvidas automaticamente.

Limitacoes: historico patrimonial e snapshots continuam locais; cotacoes remotas sao lidas, mas a edicao visual de cotacao permanece Local nesta etapa.
