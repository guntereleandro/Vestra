# Vestra

> A fonte operacional pode ser Local ou Supabase, sempre escolhida explicitamente e resolvida antes da engine. Consulte [Selecao da fonte](docs/DATA_SOURCE_SELECTION.md) e [Operacoes remotas](docs/REMOTE_OPERATIONS_USAGE.md).

Versao 0.8.2

Gerenciador pessoal de investimentos para investidores brasileiros, com interface escura, responsiva e foco em acompanhamento patrimonial.

O Vestra funciona sem banco de dados e sem autenticacao. Dados financeiros do usuario ficam no `localStorage`. A partir da versao 0.4.0, cotacoes automaticas podem ser consultadas pela brapi.dev por rotas internas do servidor Next.js.

O nome atual e a identidade pública são configurados em `lib/config/brandConfig.js`. “Vestra” permanece como nome interno até a definição da marca final.

## Vestra Core e governança

O Vestra Core tem como objetivo tornar o produto confiável para administrar investimentos diariamente e substituir o Investidor10 nas funções essenciais. A conclusão será validada por 30 dias consecutivos de uso real sem depender do serviço de referência.

O desenvolvimento ocorre em etapas pequenas, compatíveis e verificáveis. Cada etapa respeita o roadmap, preserva comportamento e dados existentes, atualiza a documentação aplicável e só avança após cumprir lint, build, validadores e critérios de aceite.

As fontes oficiais de governança são:

- `docs/CORE.md`: missão, escopo e critério dos 30 dias;
- `docs/ARCHITECTURE_DECISIONS.md`: decisões arquitetônicas permanentes;
- `docs/ENGINEERING_PRINCIPLES.md`: princípios de engenharia;
- `docs/DEFINITION_OF_DONE.md`: critérios para conclusão de cada etapa;
- `docs/CORE_ROADMAP.md`: ordem e dependências das entregas.

## Funcionalidades atuais

- Dashboard 2.0 refinado, com hero patrimonial premium, grafico em destaque, cards padronizados, alocacao com legenda lateral, resumo em mini cards, carteira em cards e ultimas 5 operacoes.
- Experiencia diaria do Dashboard na versao 0.4.2, com Timeline, recordes, jornada, insights por regras e conquistas discretas.
- Resumo "Desde sua ultima visita" na versao 0.4.3, com comparacao local de patrimonio, dividendos, operacoes e recordes.
- Modulo Objetivos na versao 0.5.0, com metas patrimoniais, renda passiva e objetivos manuais acompanhados no navegador.
- Area publica Mercado na versao 0.6.0, com pesquisa de ativos em `/mercado` e pagina publica em `/mercado/[ticker]`.
- Asset Experience 2.0, com pagina publica do ativo mais premium, hero de cotacao e indicadores em hierarquia clara.
- Engine de diagnostico patrimonial 0.7.0, pura e deterministica, com diagnosticos de alocacao, diversificacao, concentracao, renda, risco e qualidade de dados.
- Diagnostico da carteira 0.7.1 em `/carteira`, com quatro scores descritivos, confianca, limitacoes e detalhes expansiveis baseados somente na saida estruturada da engine.
- Diagnostico personalizado 0.7.2, com estrategia local configuravel, divergencias separadas dos diagnosticos gerais e preferencias incluidas no backup.
- Perfil e tolerancia a risco 0.7.3, com questionario deterministico, parametros derivados confirmaveis e coerencia contextual separada na Carteira.
- Padroes de comportamento 0.7.4, calculados de forma deterministica a partir do historico real de operacoes, sem inferir intencao.
- Performance Patrimonial 0.7.5, com crescimento decomposto em aportes, valorizacao e proventos, drawdown, contribuicoes e consistencia.
- Knowledge Repository 0.8.2, com contrato desacoplado, schema editorial, conteúdo published/public e fallback local.
- Command Palette com `Ctrl+K` para navegar, buscar ativos e objetivos, e acessar acoes rapidas.
- Operacoes como fonte da verdade para quantidade, custo, preco medio e proventos.
- Carteira consolidada automaticamente a partir do historico de operacoes.
- Historico patrimonial diario.
- Pagina de detalhes por ativo em `/carteira/[ticker]`.
- Cotacoes manuais e automaticas com prioridade explicita.
- Integracao brapi.dev no servidor, com fallback local.
- Pagina publica do ativo com cotacao, variacao diaria, indicadores disponiveis, dividendos e informacoes da empresa.
- Cache temporario de mercado em `vestra:marketCache:v1`.
- Cadastro mestre expandido e autocomplete com busca local + externa.
- Central de dados de mercado em Configuracoes.
- Backup e restauracao sem incluir cache temporario ou credenciais.
- Camada de repositorios assincronos para os dominios essenciais, com provider local compativel e preparada para adapters futuros.

## Repositorios do Core

`lib/repositories` define contratos para perfil, carteiras, operacoes, proventos, cotacoes, snapshots e preferencias. Todos os metodos publicos retornam `Promise`.

`lib/services` é a entrada dos hooks e componentes. O Provider Local continua ativo e usando as mesmas chaves do `localStorage`. Quando existe sessão e carteira remota ativa, a CORE-06 sincroniza de forma não destrutiva o catálogo de ativos, cotações e preferências para o Supabase. Consulte `docs/REPOSITORIES.md`.

## Infraestrutura Supabase

A CORE-03 instalou somente os SDKs oficiais `@supabase/supabase-js` e `@supabase/ssr` e preparou clientes separados para navegador, servidor e administração. A configuração privada passa por `envConfig`, e a secret key administrativa é server-only.

O provider Supabase possui adapters funcionais para profiles, portfolios, assets, operations, quotes e preferences. Operações podem ser importadas manualmente e reconciliadas em `/conta`; o Provider Local continua ativo. Proventos derivados e snapshots permanecem locais. Consulte `docs/OPERATIONS_MIGRATION.md`.

## Autenticação

A CORE-04 implementa cadastro, confirmação de e-mail, login, logout, sessão SSR, recuperação e atualização de senha com Supabase Auth. `/conta` é a única rota protegida; as áreas financeiras permanecem acessíveis e locais.

Auth User não é Profile de negócio. Criar uma conta não envia, associa ou remove operações, carteira, preferências ou snapshots. Consulte `docs/AUTHENTICATION.md`.

## Banco local e migrations

A CORE-05 versiona `profiles`, `portfolios` e `portfolio_members` em `supabase/migrations`, com RLS, privilégios mínimos e testes pgTAP. O Provider Local continua sendo a fonte financeira.

```text
npx supabase start
npx supabase db reset --local
npx supabase test db
npm run test:database-schema
npm run test:database-sdk
```

Consulte `docs/DATABASE_SCHEMA.md`, `docs/RLS_POLICIES.md` e `docs/DATABASE_MIGRATIONS.md`.

## Camada de mercado

`lib/market` concentra providers, cache, normalizacao e servico unico de mercado.

Providers atuais:

- `localProvider`: fallback offline baseado no cadastro mestre e nas cotacoes manuais.
- `brapiProvider`: provider externo usado somente no servidor.

Rotas internas:

- `/api/market/search`
- `/api/market/assets/[ticker]`
- `/api/market/quotes`
- `/api/market/status`

A interface consome apenas as rotas internas e `marketService`. Nenhum componente React importa provider externo.

## Mercado publico

A area `/mercado` permite pesquisar ativos sem autenticacao. O campo principal aceita ticker, nome ou empresa e abre `/mercado/[ticker]` ao selecionar um resultado ou pressionar Enter.

A pagina publica do ativo mostra nome, ticker, cotacao, variacao diaria, setor, segmento, bolsa, ultima atualizacao, indicadores disponiveis, historico de dividendos quando retornado pelo provedor e uma secao sobre a empresa. A experiencia visual separa cotacao, indicadores principais e indicadores secundarios para leitura rapida.

Indicadores ausentes sao exibidos como `Dado indisponivel`. O Vestra nao transforma ausencia de dados em zero.

Quando `BRAPI_TOKEN` nao estiver configurado, a area continua usando o fallback local e mostra estados apropriados para cotacao ausente ou ativo nao encontrado.

## Prioridade de cotacoes

O Vestra calcula uma cotacao efetiva antes da engine financeira:

1. Cotacao manual com `manualOverride`.
2. Cotacao automatica valida.
3. Cache valido.
4. Preco medio como fallback visual sinalizado.

Cotacoes antigas importadas ou ja salvas sao migradas como manuais.

## Configuracao de ambiente

Copie `.env.example` para `.env.local` e preencha somente os valores necessários ao ambiente. As variáveis públicas aceitas são:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`

As variáveis privadas preparadas são:

- `BRAPI_TOKEN`, usado atualmente apenas no servidor;
- `SUPABASE_SECRET_KEY`, opcional e reservada ao Admin Client server-only;
- `SUPABASE_SERVICE_ROLE_KEY`, aceita temporariamente como compatibilidade com a chave administrativa legada.

Nunca adicione prefixo `NEXT_PUBLIC_` a tokens ou chaves privadas. Valores ausentes continuam opcionais nesta etapa.

Na Vercel:

1. Abra o projeto.
2. Va em Settings.
3. Entre em Environment Variables.
4. Crie `BRAPI_TOKEN`.
5. Faça novo deploy.

`lib/config/envConfig.js` é server-only. Componentes clientes não devem importá-lo.

Variáveis Supabase ausentes não impedem o funcionamento local nem o build. Formulários de Auth exibem indisponibilidade controlada nesse estado.

## LocalStorage

Chaves versionadas:

- `vestra:operations:v1`
- `vestra:assetsMaster:v1`
- `vestra:assetQuotes:v1`
- `vestra:portfolioHistory:v1`
- `vestra:journeyRecords:v1`
- `vestra:lastDashboardVisit:v1`
- `vestra:goals:v1`
- `vestra:goalMilestones:v1`
- `vestra:marketCache:v1`

O cache e temporario e pode ser limpo sem afetar a carteira.

## Backup

O backup schema atual e `5`.

Inclui:

- operacoes;
- cotacoes persistentes;
- ativos personalizados;
- historico patrimonial.
- preferencias de diagnostico;
- perfil de risco.

Nao inclui:

- cache temporario;
- recordes da experiencia diaria;
- ultimo acesso ao Dashboard;
- objetivos patrimoniais;
- marcos de objetivos;
- token da brapi;
- respostas completas da API.

Backups antigos suportados continuam aceitos.

## Como rodar localmente

```bash
npm install
npm run dev
```

Validacao:

```bash
npm run lint
npm run test:market
node scripts/validate-diagnostics.mjs
npm run test:knowledge
npm run test:repositories
npm run test:supabase
npm run test:auth
npm run build
```

## Limitacoes atuais

- Sem dividendos automaticos.
- Sem corretoras.
- Sem banco de dados.
- Sem autenticacao.
- Sem painel administrativo funcional.
- Sem recomendacoes de investimento.
- Os diagnosticos nao avaliam retorno esperado, volatilidade, correlacao ou liquidez.
- A disponibilidade e limites da brapi.dev dependem do fornecedor e dos termos de uso.
