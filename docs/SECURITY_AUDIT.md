# Auditoria de Segurança de Dependências

## CORE-13 — npm audit em 2026-08-22

`npm audit`, executado com certificados do sistema, reportou quatro vulnerabilidades altas agregadas em `nanoid`, `postcss`, `@tailwindcss/postcss` e `next`. Advisory principal: `GHSA-2v37-7h3g-55p8`, custom generators do nanoid podem entrar em loop quando recebem tamanho zero. O relatório informa **No fix available**.

O Vestra não importa `nanoid` nem chama custom generator diretamente; o alcance observado é transitivo pelo pipeline Next/PostCSS/Tailwind. Nenhuma dependência foi alterada e nenhum `audit fix --force` foi executado. A pendência exige monitoramento e nova auditoria quando a cadeia publicar correção; não invalida os contratos do Mercado 2.0, mas permanece risco de dependência para Production.

## CORE-13 — superfície de mercado

A auditoria de 2026-08-22 confirmou que `BRAPI_TOKEN` permanece server-only, fora do bundle, backup e localStorage; componentes acessam somente rotas internas; respostas possuem limite de 500 KB e timeout no provider; erros expostos são sanitizados. Nenhum valor secreto foi registrado nos testes reais.

Pendências: o token ainda é enviado ao fornecedor por query string; as rotas públicas não possuem limitação própria; o status considera token presente como provider online; e não há observabilidade sanitizada de cota, cache, latência ou status. O plano Free permite um ticker por chamada, enquanto o Vestra forma lotes de até 20, aumentando falhas e consumo imprevisível. Qualquer evolução deve manter redaction, adotar o mecanismo oficial mais seguro suportado pela BRAPI e impedir exposição de respostas brutas.

Situação após implementação: as rotas possuem limite best-effort de 60 requisições/minuto por IP e aceitam apenas operações/tickers/ranges fechados; plano Free usa um ticker por chamada; status separa configuração de conectividade; `/mercado` e `/api/market` deixam de executar chamadas Supabase desnecessárias no Proxy. O contador em memória não é compartilhado entre instâncias serverless e não substitui proteção de borda. O token permanece em query string até existir confirmação documental segura para mudança do mecanismo oficial.

## CORE-12.1 — atualização validada em 2026-08-07

O Next.js foi atualizado de 16.2.12 para 16.3.0, sem `npm audit fix --force`. A cadeia passou a usar PostCSS 8.5.23 e Sharp 0.35.3. `npm audit` passou com **0 vulnerabilidades**.

| Pacote | Cadeia | Alcance no Vestra | Versão corrigida | Impacto validado | Risco de não atualizar |
|---|---|---|---|---|---|
| `next` | direta | App Router, Proxy, renderização e build | 16.3.0 | Auth, rotas públicas/privadas, Supabase SSR, Mercado, lint, build e regressão financeira aprovados | mantém as vulnerabilidades transitivas agregadas |
| `postcss` | `next -> postcss` | processamento de CSS/source maps | 8.5.23 | build aprovado | leitura indevida de source maps e XSS nos cenários dos advisories |
| `sharp` | `next -> sharp` | otimização de imagens no servidor | 0.35.3 | build e rotas de imagem aprovados | vulnerabilidades herdadas do libvips |

O Browser Client padrão do Supabase passou a reutilizar uma única instância, removendo a causa dos avisos de múltiplos clientes Auth no mesmo contexto. Configurações explícitas de teste continuam isoladas.

Os registros abaixo permanecem como histórico e foram substituídos, para a decisão atual, por este resultado.

CORE-12 reafirma que diagnósticos técnicos não podem registrar tokens, cookies, service role ou operações financeiras completas. Vulnerabilidades transitivas de PostCSS/Sharp bloqueiam Production até atualização validada.

## CORE-08 - selecao segura

O resolver nao importa admin client, nao registra tokens, valida usuario e membership antes da fonte remota e isola cache por portfolio. Nao ha fallback silencioso, mistura de carteiras ou dual write.

Validacao Development de 2026-08-01: RLS e grants permaneceram ativos; anon foi bloqueado; usuario sem membership nao leu dados; viewer leu e nao escreveu; editor e owner escreveram. Credenciais foram lidas somente em memoria e fixtures foram removidas.

## CORE-07 — Operações

- `portfolio_operations` possui RLS explícito e nenhum grant para anon/public.
- Owner/editor escrevem; viewer lê; não membros não observam linhas.
- `created_by` deriva da sessão e identidade/carteira/autoria são imutáveis.
- O Browser Client não recebe secret key; service role aparece somente em testes server-only e limpeza.
- Importação e reconciliação não registram conteúdo financeiro ou credenciais.
- `portfolio_snapshots` está protegida por RLS e grants mínimos; anon não acessa, viewer não escreve e DELETE do cliente permanece revogado. Proventos continuam sem tabela independente.

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
