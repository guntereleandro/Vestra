# Perícia do ambiente Supabase Development

Data da investigação: 2026-08-31. Escopo: somente leitura.

## Conclusão

**DEVELOPMENT LOCALIZADO.** O ambiente usado pelo Vestra é o projeto `Vestra`, project ref `mwdogrezcpuzpohpeirs`, branch `main`, região `sa-east-1` (São Paulo).

A leitura inicial incorreta ocorreu enquanto o painel indicava o compute como **Coming up…**. Nesse intervalo, o SQL Editor respondeu com os schemas internos, zero usuários e sem tabelas `public`, enquanto o Data API continuava servindo a carteira. Após o compute mudar para **Healthy**, a mesma consulta SQL retornou 1 usuário Auth, as tabelas Vestra e 109 operações. Não houve perda, reset ou troca de projeto.

## Ambientes acessíveis

| Projeto | Ref | Região/estado | Relação com Vestra |
| --- | --- | --- | --- |
| Vestra | `mwdogrezcpuzpohpeirs` | São Paulo, ativo/Healthy | Development real localizado |
| SwipeMusic | `ymndcqokhrwkuvooxnvo` | São Paulo, ativo | Sem migrations Vestra, zero Auth, zero operações Vestra |
| Auralis | `bvtcnaydbrzuhpcfphnv` | `us-east-1`, pausado | Projeto não relacionado |

O plano atual possui somente a branch `main` do Vestra; não existem branches persistentes ou preview. O dashboard chama `main` de Production branch, mas o projeto foi historicamente utilizado como ambiente Development do Vestra. Essa diferença de nomenclatura deve ser tratada em uma decisão futura de separação de ambientes, sem mudança nesta investigação.

## Referências encontradas

- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` aponta para `mwdogrezcpuzpohpeirs`.
- `supabase/.temp/project-ref` e `linked-project.json`: mesmo ref e projeto `Vestra`.
- `supabase/.temp/pooler-url`: pooler São Paulo; credenciais não registradas neste documento.
- histórico Git e `docs/DATA_SOURCE_SELECTION.md`: somente esse ref, desde a aplicação da CORE-08 em 2026-08-01.
- `.vercel/project.json`: projeto Vercel `vestra`.
- bundles públicos do deployment `vestra-nine.vercel.app`: mesmo ref `mwdogrezcpuzpohpeirs`.
- nenhum segundo project ref Supabase foi encontrado no repositório ou histórico Git.

## Estado remoto confirmado

Com o compute saudável, duas superfícies independentes concordaram:

| Evidência | Resultado |
| --- | ---: |
| Auth users | 1 |
| Profiles | 1 |
| Portfolios | 1 |
| Portfolio members | 1 |
| Portfolio preferences | 1 |
| Portfolio operations | 109 |
| Portfolio snapshots | 4 |
| Carteira ativa | `Minha carteira` |

O verificador remoto reconciliou 101 operações por IDs determinísticos e 8 por aliases, com zero ausentes, zero conflitos e zero novos registros. As posições, Tesouro, LCI BRB e Mercado Pago coincidiram com o preflight aprovado.

## Migration history

O painel remoto contém as nove migrations predecessoras:

1. `20260730000100_core_05_identity_portfolios`
2. `20260730000200_core_05_service_role_maintenance`
3. `20260730000300_core_05_allow_portfolio_cascade`
4. `20260731000100_core_06_persistent_domain`
5. `20260731000200_core_07_portfolio_operations`
6. `20260801000100_core_08_data_source_preference`
7. `20260806000100_core_10_portfolio_snapshots`
8. `20260807000100_import_compatibility_events`
9. `20260811000100_value_based_fixed_income`

A migration CORE-14 ainda não está aplicada, como esperado.

## Artefatos de recuperação

- `backups/pre-real-import-final-2026-08-11T04-19-35.364Z.backup.json` existe.
- SHA-256 verificado: `DBFA9654EE23FA12CCFAD2B730D578B870B33FB08E96680746C00F10433CF07F`.
- O backup registra as 8 operações preexistentes antes da importação final.
- `data/imports/vestra_real_import_equivalence_manifest.json` existe, possui fingerprint e 8 aliases.
- O staging congelado contém 114 registros de origem: 108 prontos gerando 109 eventos canônicos e 6 históricos retidos.
- O lote final registra 101 inserções determinísticas + 8 aliases preservados = 109 eventos econômicos.
- Artefatos SQL de importação e rollback existem; não foram executados.

## Hipóteses avaliadas

- **A — CLI linkada ao projeto errado:** rejeitada; ref local e remoto coincidem.
- **B — aplicação aponta para outro projeto:** rejeitada; local e bundle Vercel usam o mesmo ref.
- **C — dados em outra branch:** rejeitada; somente `main` existe.
- **D — banco resetado:** rejeitada; após estabilização, schema e dados reapareceram integralmente.
- **E — projeto removido/substituído:** rejeitada; projeto, migrations, Auth e dados concordam.
- **F — validações anteriores em outro ambiente:** sem evidência; todas as referências históricas convergem.
- **G — janela transitória de inicialização/roteamento do compute:** confirmada. O painel mostrava `Coming up…`; após `Healthy`, SQL e Data API convergiram.

## Conectividade da CLI

O hostname PostgreSQL direto não resolveu por DNS na rede testada. O pooler resolveu em IPv4 e aceitou TCP, mas a autenticação CLI com a senha local não concluiu. Isso é uma pendência de conexão/credencial da CLI, não de identidade ou integridade do Development.

## Próximo passo recomendado

Manter o link atual. Antes de retomar a CORE-14.1, atualizar/validar de forma controlada a senha de banco usada pela CLI ou usar o SQL Editor somente após confirmar status **Healthy**. Repetir preflight de contagens e executar dry-run antes de qualquer migration. Nenhuma restauração é necessária.

## Garantia de não alteração

Foram executadas somente buscas locais, consultas SQL `SELECT`, consultas REST/Admin de leitura, inspeção do painel e verificação de arquivos/hash. Nenhuma migration, DDL, DML, seed, importação, RPC de escrita, alteração de env, relink ou restauração foi realizada.
