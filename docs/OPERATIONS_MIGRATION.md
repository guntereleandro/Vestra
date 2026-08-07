# Migração manual de operações

## Fluxo

1. Usuário entra em `/conta`.
2. Seleciona “Verificar dados”.
3. O serviço exige sessão e carteira remota ativa.
4. Operações locais são validadas e comparadas por UUID.
5. A prévia classifica somente local, somente remoto, iguais e divergentes.
6. O usuário confirma “Baixar backup e importar registros seguros”.
7. Um backup schema 5 é baixado antes da escrita.
8. Ativos necessários são sincronizados e somente registros “somente local” são enviados.
9. O serviço relê o remoto e apresenta a reconciliação final.

## Garantias

- nunca inicia automaticamente;
- nunca apaga local ou remoto;
- nunca sobrescreve IDs divergentes;
- repetir não duplica;
- nenhum dado é deduplicado por semelhança financeira;
- falha parcial pode ser retomada com a mesma ação;
- o backup local permanece restaurável.

## Conflitos

Mesmo UUID com conteúdo diferente é conflito. A CORE-07 apenas informa ticker/data e mantém os dois lados intactos. Escolha de vencedor, histórico de versões e merge ficam adiados.

## Limitações

A importação não troca a fonte global e não faz pull para o navegador. Operações exclusivamente remotas são apenas informadas. Dados já normalizados pelo legado podem ter perdido a forma bruta inválida anterior.

O fluxo existente pressupõe que a entrada já obedeça ao contrato canônico. Uma carga externa do Investidor10 deve passar antes pela triagem descrita em `REAL_PORTFOLIO_IMPORT_READINESS.md`. Bonificações, desdobramentos, conversões/incorporações e caixa remunerado ficam em lote retido; não podem ser remodelados como compra, venda ou rendimento para aproveitar este fluxo. Tesouro e renda fixa tradicional entram somente após identificação não ambígua e reconciliação de quantidade, preço, taxas e valor aplicado.
