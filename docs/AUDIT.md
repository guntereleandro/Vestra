# Auditoria CORE-00

Data: 2026-07-25. Escopo: repositório atual, sem alteração funcional.

## Resumo executivo

O produto já possui uma base modular e útil: operações são fonte de verdade, cálculos estão razoavelmente separados da interface, o domínio de mercado possui contrato/fallback e há validadores executáveis. A arquitetura, porém, continua sendo de aplicação local de um único navegador. Persistência, sessão, concorrência, segurança multiusuário e sincronização ainda não existem.

O caminho recomendado não é reescrever. É conservar engine e componentes, introduzir contratos de repositório, consolidar contratos de dados e migrar os domínios Core na ordem do roadmap.

## Catálogo por domínio

| Domínio | Módulos principais | Estado |
|---|---|---|
| Operações | `lib/data/operations.js`, `OperationsPage`, `OperationModal` | CRUD completo local; validação limitada |
| Carteira | `portfolio.js`, `totals.js`, Portfolio components | funcional e derivada |
| Proventos | tipos de renda em operations/portfolio | dados e totais existem; página é placeholder |
| Cotações/mercado | `lib/market`, API routes, market/settings components | funcional com BRAPI/fallback |
| Histórico | `portfolioHistory.js`, chart, performance | funcional, snapshot dependente do cliente |
| Objetivos | `goals.js`, Goals components, analytics | funcional local |
| Diagnósticos | `lib/engine/diagnostics`, components/hooks | funcional determinístico |
| Perfil/estratégia | risk/diagnostic preferences e forms | funcional local |
| Comportamento | behavior diagnostics, daily experience | derivado de operações |
| Performance | `lib/engine/performance`, components/hooks | funcional com limitações documentadas |
| Conhecimento | repository/service/catalog/routes | funcional e estático |
| Configurações | quotes, market, strategy, risk, data | funcional, página concentrada |
| Backup | `storage.js`, DataManagement, Command Palette | funcional, mas incompleto e duplicado |
| Navegação/Command Palette | AppShell, command components/hook | funcional; ações de dados exigem revisão |

## Pontos fortes

- Operações já são a fonte de verdade para posição, custo e proventos.
- Engine financeira e engines de diagnóstico/performance são funções determinísticas sem chamadas de rede ou React.
- Normalizadores toleram formatos legados e evitam vários valores inválidos.
- Mercado está isolado por serviço, providers e rotas internas; token permanece no servidor.
- Fallback local preserva parte do funcionamento quando a BRAPI falha.
- Interface tem componentes por domínio, estados vazios em fluxos principais e linguagem visual consistente.
- Backup possui versão, validação, confirmação na tela de configurações e compatibilidade com versões anteriores.
- Validadores cobrem mercado, diagnósticos, performance e conhecimento.
- Central de Conhecimento já tem contrato de repositório que serve como referência arquitetural.

## Engine atual

### Reutilizável

- ordenação e custo médio;
- consolidação por ativo e totais;
- validações numéricas/datas;
- alocação e analytics;
- diagnósticos de alocação, diversificação, renda, risco, estratégia e comportamento;
- avaliação de perfil;
- performance, drawdown, contribuição e timeline.

### Pureza e acoplamentos

As funções de `lib/engine` são predominantemente puras. Acoplamentos remanescentes:

- `portfolio.js` importa `isIncomeOperation` de `lib/data`;
- `portfolioAnalytics.js` também conhece tipos do domínio de dados;
- formatadores BRL/pt-BR ficam em `totals.js`;
- `portfolioHistory.js` (data) importa engine e relógio global;
- engines assumem contratos implícitos de objetos, sem schema compartilhado.

### Duplicações e riscos

- custo médio é calculado em `averagePrice.js` e reimplementado em `portfolio.js`;
- helpers `safeNumber`, clamp/percentuais e normalização temporal se repetem;
- vendas acima da quantidade mantida são truncadas, não rejeitadas;
- operações do mesmo dia dependem da prioridade do tipo, não de horário/ordem explícita;
- lucro realizado não é modelado; `profit` representa posição aberta;
- fallback por preço médio faz valor atual parecer estável quando cotação inexiste, embora `hasQuote` sinalize a condição;
- rentabilidade/performance requer uma definição formal antes de ser critério de produto.

### Testes

Os scripts são validadores úteis, mas não há runner, cobertura, fixtures persistidas, testes de componentes, E2E ou CI declarada. O lint não aplica regras semânticas de ESLint.

## Interface

### Reutilização

AppShell, modais, cards de dashboard, AssetLogo, autocomplete, QuoteInfo/Modal, componentes de diagnóstico, performance e conhecimento são reaproveitáveis.

### Concentração

`MarketAssetPage` (242 linhas), `Dashboard` (188), `CommandPalette` (142), `MarketSearch` (125), `GoalsPage` (100) e componentes de configuração concentram múltiplas responsabilidades. Não são bloqueadores imediatos, mas deverão ser separados durante mudanças naturais, não em refatoração geral.

### Fluxos completos

CRUD de operações; carteira consolidada; detalhes do ativo; cotações manuais/automáticas; objetivos; estratégia e risco; backup via configurações; mercado; conhecimento.

### Fluxos incompletos ou sem utilidade Core imediata

- Proventos: placeholder, apesar dos dados existentes — bloqueador funcional do Core.
- Relatórios e Metas: placeholders; Metas duplica Objetivos.
- IA, Simulações e IR: placeholders e explicitamente fora do Core; devem ser preservados sem investimento agora.
- A Command Palette aponta para query params de “nova operação” e “novo objetivo”; os consumidores precisam ser confirmados/testados como fluxo integral.
- Importação pela Command Palette substitui dados sem a confirmação detalhada oferecida em Configurações.
- `useGoals.js` vazio sugere módulo abandonado.

### Estados e erros

Existem loading, empty e mensagens de erro em áreas principais. Falta uma estratégia global para erro de sincronização, retry, conflito, offline e sessão expirada. Erros de storage são reduzidos a um booleano; normalização frequentemente descarta registros inválidos sem relatório.

## Mercado e produção

### Pontos positivos

- token server-only;
- timeout e limite de resposta;
- códigos de erro normalizados;
- chunk por limite configurável;
- fallback para plano sem módulos avançados;
- cache com TTL;
- UI não importa provider externo.

### Riscos

- todas as rotas são públicas e não possuem rate limiting próprio;
- status reporta “online” se há token, sem health check real;
- fallback de busca pode mascarar falha externa;
- cache está por navegador, não compartilhado;
- a URL base BRAPI está fixa no provider e no validador;
- `fetchJson` pressupõe JSON e não usa timeout no cliente;
- `BRAPI_TOKEN` é a única variável documentada;
- disponibilidade, cotas, licença e campos dependem do plano do fornecedor;
- não há observabilidade, métricas de consumo ou circuit breaker.

## Dívidas priorizadas

| Severidade | Problema/impacto | Arquivos | Risco e recomendação | Momento |
|---|---|---|---|---|
| Bloqueadora Core | Sem Auth, banco, RLS ou carteira multiusuário | todo fluxo data/hook | dados presos ao navegador; implementar apenas após adapter | CORE-02 a 05 |
| Bloqueadora Core | Proventos sem página funcional | `app/proventos`, operations/portfolio | rotina essencial ausente; construir sobre operações | CORE-08 |
| Bloqueadora Core | Persistência disparada por hooks/UI e múltiplos acessos diretos | `useInvestmentData`, Dashboard, Goals, CommandPalette, data modules | conflitos e sincronização frágeis; repositórios por domínio | CORE-02 |
| Alta | Backup omite goals, milestones, journey e visit | `storage.js`, docs, DataManagement | perda em troca de navegador; definir cobertura oficial | CORE-02 |
| Alta | Snapshots dependem de visita/efeito cliente e sobrescrevem o dia | hook/history | histórico não confiável entre dispositivos; política e job idempotente | CORE-09 |
| Alta | Venda sem saldo suficiente não é impedida; descarte silencioso de inválidos | operations/portfolio/storage | totais incorretos/perda na migração; validação explícita | CORE-06 |
| Alta | Ação de import da Command Palette não confirma substituição | `CommandPalette.js` | perda acidental; reutilizar fluxo seguro | CORE-02 |
| Alta | Ausência de testes de regressão do núcleo financeiro | engine/scripts | migração pode mudar resultados; fixtures antes do remoto | CORE-02/06 |
| Alta | RLS e modelo de autorização inexistentes | futuro Supabase | vazamento entre usuários; políticas e testes negativos | CORE-03/05 |
| Média | Metadados de ativo misturam seed, provider e customização | assetsMaster/market/storage | sobrescrita e duplicação; separar catálogo/override | CORE-02/03 |
| Média | Cotação persistente mistura manual e automática | quotes/storage/cache | propriedade e retenção ambíguas; separar escopos | CORE-02/07 |
| Média | Cálculo de custo duplicado | averagePrice/portfolio | divergência futura; consolidar com testes | CORE-06 |
| Média | Configuração de marca incompleta | layout, shell, docs, knowledge, backups | troca cara; centralizar | CORE-01 |
| Média | Dependências declaradas como `latest` | package.json | builds futuros não reprodutíveis após novo install | etapa de infraestrutura aprovada |
| Média | API pública sem proteção/rate limit/telemetria | API/market | abuso e custo | CORE-03/11 |
| Média | Lint apenas sintático | `lint-js.mjs` | defeitos React/import passam | CORE-11 ou antes se necessário |
| Baixa | `useGoals.js` vazio e `/metas` duplicada | hook/routes | confusão de manutenção | ao tocar objetivos/navegação |
| Baixa | Componentes grandes e configurações concentradas | components citados | manutenção mais lenta | refatoração oportunista |
| Pós-Core | Diagnósticos, comportamento, objetivos e Knowledge avançados | respectivos domínios | distração do caminho crítico | após CORE-12 |
| Pós-Core | IA, IR, simulações, notícias, scores e gamificação | placeholders/futuro | fora da missão | após Core |

## Prontidão para Supabase

### Pronto para reaproveitar

- contratos normalizados de operações, cotações, ativos, snapshots, perfil e estratégia;
- engine determinística;
- separação de provider de mercado;
- migração e backup versionados como ponto de partida;
- contrato de repositório demonstrado no domínio de conhecimento.

### Precisa ocorrer antes da migração

- criar repositórios assíncronos e retirar `localStorage` dos componentes/hooks;
- definir IDs, precisão decimal, timestamps, timezone, auditoria e soft delete;
- separar catálogo público de customizações por carteira;
- separar cotação pública, cache e override manual;
- cobrir engine com fixtures de regressão;
- corrigir validações de saldo/operação;
- definir cobertura de backup e reconciliação.

### RLS

Perfis, risco, carteiras, membros, operações, overrides, snapshots e preferências exigem RLS. Assets/cotações/conhecimento podem ser leitura pública, com escrita restrita ao backend. Segredos permanecem em ambiente server-only.

## Recomendações

1. Aprovar CORE-00 como baseline.
2. Executar CORE-01 somente como centralização sem rebranding.
3. Na CORE-02, usar adapters e testes de caracterização para manter o local funcionando.
4. Não conectar componentes diretamente ao Supabase.
5. Não materializar cálculos no banco antes de definir regra, precisão e regressão.
6. Tratar migração local como produto: preview, consentimento, idempotência e reconciliação.

