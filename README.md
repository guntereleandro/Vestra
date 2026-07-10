# Vestra

Versao 0.5.0

Gerenciador pessoal de investimentos para investidores brasileiros, com interface escura, responsiva e foco em acompanhamento patrimonial.

O Vestra funciona sem banco de dados e sem autenticacao. Dados financeiros do usuario ficam no `localStorage`. A partir da versao 0.4.0, cotacoes automaticas podem ser consultadas pela brapi.dev por rotas internas do servidor Next.js.

## Funcionalidades atuais

- Dashboard 2.0 refinado, com hero patrimonial premium, grafico em destaque, cards padronizados, alocacao com legenda lateral, resumo em mini cards, carteira em cards e ultimas 5 operacoes.
- Experiencia diaria do Dashboard na versao 0.4.2, com Timeline, recordes, jornada, insights por regras e conquistas discretas.
- Resumo "Desde sua ultima visita" na versao 0.4.3, com comparacao local de patrimonio, dividendos, operacoes e recordes.
- Modulo Objetivos na versao 0.5.0, com metas patrimoniais, renda passiva e objetivos manuais acompanhados no navegador.
- Command Palette com `Ctrl+K` para navegar, buscar ativos e objetivos, e acessar acoes rapidas.
- Operacoes como fonte da verdade para quantidade, custo, preco medio e proventos.
- Carteira consolidada automaticamente a partir do historico de operacoes.
- Historico patrimonial diario.
- Pagina de detalhes por ativo em `/carteira/[ticker]`.
- Cotacoes manuais e automaticas com prioridade explicita.
- Integracao brapi.dev no servidor, com fallback local.
- Cache temporario de mercado em `vestra:marketCache:v1`.
- Cadastro mestre expandido e autocomplete com busca local + externa.
- Central de dados de mercado em Configuracoes.
- Backup e restauracao sem incluir cache temporario ou credenciais.

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

## Prioridade de cotacoes

O Vestra calcula uma cotacao efetiva antes da engine financeira:

1. Cotacao manual com `manualOverride`.
2. Cotacao automatica valida.
3. Cache valido.
4. Preco medio como fallback visual sinalizado.

Cotacoes antigas importadas ou ja salvas sao migradas como manuais.

## Configuracao da brapi.dev

Crie `.env.local` na raiz do projeto:

```bash
BRAPI_TOKEN=
```

Preencha o valor localmente, sem versionar esse arquivo.

Na Vercel:

1. Abra o projeto.
2. Va em Settings.
3. Entre em Environment Variables.
4. Crie `BRAPI_TOKEN`.
5. Faça novo deploy.

Nunca use `NEXT_PUBLIC_BRAPI_TOKEN`. O token deve existir apenas no servidor.

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

O backup schema atual e `3`.

Inclui:

- operacoes;
- cotacoes persistentes;
- ativos personalizados;
- historico patrimonial.

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
npm run build
```

## Limitacoes atuais

- Sem dividendos automaticos.
- Sem corretoras.
- Sem banco de dados.
- Sem autenticacao.
- Sem painel administrativo funcional.
- Sem recomendacoes de investimento.
- A disponibilidade e limites da brapi.dev dependem do fornecedor e dos termos de uso.
