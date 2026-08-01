# Auditoria de Segurança de Dependências

## CORE-08 - selecao segura

O resolver nao importa admin client, nao registra tokens, valida usuario e membership antes da fonte remota e isola cache por portfolio. Nao ha fallback silencioso, mistura de carteiras ou dual write.

Validacao Development de 2026-08-01: RLS e grants permaneceram ativos; anon foi bloqueado; usuario sem membership nao leu dados; viewer leu e nao escreveu; editor e owner escreveram. Credenciais foram lidas somente em memoria e fixtures foram removidas.

## CORE-07 — Operações

- `portfolio_operations` possui RLS explícito e nenhum grant para anon/public.
- Owner/editor escrevem; viewer lê; não membros não observam linhas.
- `created_by` deriva da sessão e identidade/carteira/autoria são imutáveis.
- O Browser Client não recebe secret key; service role aparece somente em testes server-only e limpeza.
- Importação e reconciliação não registram conteúdo financeiro ou credenciais.
- Nenhuma tabela de snapshots, histórico ou proventos foi criada.

## Relatório npm — 2026-07-31

`npm audit` reportou três vulnerabilidades de severidade alta em dependências transitivas `postcss` e `sharp` trazidas pelo Next. A correção automática sugerida exige `--force` e propõe uma mudança incompatível para Next 9.3.3; por isso nenhuma dependência foi alterada nesta etapa. O risco permanece registrado para atualização controlada posterior.

Data: 2026-07-27.

Comando: `npm audit --omit=dev --json`. Nenhum `npm audit fix --force` foi executado.

## Resultado

O primeiro relatório continha três grupos de vulnerabilidades altas. `npm audit fix`, sem `--force`, atualizou `next` de 16.2.10 para 16.2.12 e o PostCSS da cadeia Tailwind de 8.5.16 para 8.5.23. Os advisories próprios do Next foram corrigidos, mas duas dependências empacotadas por ele continuam sinalizadas.

| Pacote | Versão instalada | Alcance | Correção indicada pelo npm | Risco de atualização | Recomendação |
|---|---:|---|---|---|---|
| `next` | 16.2.12 | dependência direta; App Router, Proxy e servidor | corrigido em 16.2.11+ para GHSA-6gpp-xcg3-4w24, GHSA-m99w-x7hq-7vfj, GHSA-89xv-2m56-2m9x e GHSA-p9j2-gv94-2wf4 | médio: framework central | atualização compatível aplicada; lint, build e rotas devem permanecer obrigatórios |
| `postcss` | 8.5.23 na cadeia Tailwind; 8.4.31 dentro do Next | processamento de CSS e source maps | GHSA-qx2v-qp2m-jg93 corrigida em 8.5.10; GHSA-6g55-p6wh-862q após 8.5.11; GHSA-r28c-9q8g-f849 após 8.5.17 | médio: versão vulnerável permanece empacotada no Next | bloqueador para Production até o Next fornecer cadeia corrigida ou substituição compatível |
| `sharp` | 0.34.5 transitivo do Next | otimização de imagens no servidor | GHSA-f88m-g3jw-g9cj corrigida em 0.35.0 | médio: binário nativo | bloqueador para Production até atualização compatível da cadeia do Next |

## Alcance no Vestra

- Não há evidência de exploração no repositório.
- Os advisories próprios do Next foram removidos com 16.2.12.
- `postcss` atua principalmente no pipeline de build.
- `sharp` é dependência opcional/transitiva usada pela otimização de imagens do Next.
- O relatório do npm deve ser refeito após qualquer atualização porque advisories e versões corrigidas mudam.

## Decisão

Foi aplicada somente a atualização compatível oferecida por `npm audit fix`, sem `--force`. O relatório residual continua com três vulnerabilidades altas agregadas por causa do PostCSS e Sharp transitivos do Next.

O npm passou a sugerir `npm audit fix --force` com downgrade incompatível para `next@9.3.3`; essa ação foi rejeitada. Os advisories residuais são dívida técnica bloqueadora para Production, mas não impedem validação local da arquitetura de autenticação.

A correção recomendada é uma entrega de segurança pequena antes de qualquer deploy Production, sem `--force`, com:

1. atualização compatível indicada pelo npm;
2. `npm audit`;
3. todos os validadores;
4. teste manual das rotas de autenticação e mercado;
5. lint e build.
## CORE-05 — Banco e autorização

- RLS habilitado nas três tabelas públicas.
- Nenhum privilégio ou policy para `anon`.
- `authenticated` recebe apenas operações necessárias.
- Membership e ownership derivam de `auth.uid()`, nunca de profile ou input arbitrário.
- Helpers `SECURITY DEFINER` são mínimos, booleanos e usam `search_path = ''`.
- RPC atômica define criador e owner pela sessão.
- Trigger impede remoção ou rebaixamento do último owner.
- Migrations, seed e testes não contêm usuários reais, senhas ou tokens.
- Admin Client não participa dos repositories normais.

Evidência local: 50 testes pgTAP positivos e negativos aprovados.

Evidência remota em 2026-07-30:

- três migrations registradas no Development;
- dump sanitizado confirmou tabelas, constraints, funções, triggers, índices, RLS, policies e grants;
- SDK confirmou owner/editor/viewer, isolamento, RPC, último owner e bloqueio anon;
- bundle cliente permanece sem secret key ou Admin Client;
- contas, carteiras e credenciais temporárias de teste foram removidas;
- nenhum dado financeiro foi migrado.

## Relatório npm de 2026-07-30

`npm audit --json` reportou 3 vulnerabilidades de severidade alta: `next` como dependência direta e `postcss`/`sharp` transitivas. A sugestão automática indica downgrade major incompatível do Next.js, portanto nenhuma correção automática ou `--force` foi aplicada nesta etapa. O risco permanece registrado para atualização controlada e reteste separado.
