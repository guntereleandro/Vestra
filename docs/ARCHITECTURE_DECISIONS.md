# Decisões de Arquitetura do Vestra Core

## ADR-011 — Sincronização inicial não destrutiva

### Contexto

Ativos, cotações e preferências precisam chegar ao Supabase sem trocar de uma vez a fonte de dados da interface nem arriscar operações ainda locais.

### Decisão

Manter o Provider Local como fonte operacional e sincronizar Local → Supabase por upsert quando houver usuário autenticado e carteira remota ativa. A sincronização não executa exclusões remotas. Carteira ativa é persistida por usuário; dados de domínio são isolados por carteira e RLS.

### Consequências

- dados locais e chaves existentes permanecem compatíveis;
- a cópia remota pode conter linhas antigas até existir reconciliação assistida;
- conflitos bidirecionais não são resolvidos nesta etapa;
- a engine financeira continua fora dos repositories.

### Alternativas consideradas

- trocar todo o registry para Supabase: rejeitada porque operações e snapshots ainda são locais;
- sincronização bidirecional automática: adiada por exigir política de conflitos e reconciliação;
- substituir remotamente o conjunto inteiro com exclusões: rejeitada por risco de perda.

## ADR-012 — Operações remotas com importação manual

### Contexto

Operações são a fonte da verdade e sua associação automática a uma conta ou carteira poderia enviar dados para o destino errado ou sobrescrever divergências.

### Decisão

Persistir operações por carteira em `portfolio_operations`, mantendo o Provider Local global. A importação exige ação do usuário, backup prévio e reconciliação por UUID. Somente registros existentes apenas localmente são enviados; conflitos e registros somente remotos permanecem intactos.

O banco armazena fatos de entrada. Compra e venda não armazenam total derivado; proventos armazenam `income_amount`. Ticker e metadados históricos são mantidos no lançamento, sem FK obrigatória ao catálogo mutável.

### Consequências

- importações são idempotentes e retomáveis, mas não atômicas entre lotes;
- não há pull, merge automático ou mudança global de provider;
- UUID, carteira e autor são imutáveis;
- valores derivados continuam na engine.

### Alternativas consideradas

- migração automática após login: rejeitada por ausência de consentimento;
- FK obrigatória para `portfolio_assets`: rejeitada para não impedir histórico quando o catálogo mudar;
- persistir preço médio e posição: rejeitada por duplicar a fonte da verdade;
- resolver conflitos pelo registro mais recente: rejeitada por poder apagar uma correção legítima.

Status: fonte oficial das decisões arquitetônicas permanentes do Vestra Core.

Este documento registra decisões que devem orientar novas entregas e revisões. O histórico cronológico anterior permanece em `docs/DECISIONS.md`. Mudanças relevantes devem criar uma nova ADR ou declarar explicitamente qual ADR foi substituída; decisões antigas não devem ser apagadas.

## ADR-001 — Operações como única fonte da verdade

### Contexto

Quantidade, custo, preço médio, posição, resultado e proventos precisam permanecer coerentes. Armazenar esses valores como cadastros independentes criaria múltiplas versões do mesmo fato financeiro.

### Decisão

Operações registradas são a única fonte da verdade para reconstruir a carteira. Posições, consolidações, métricas e proventos são dados derivados. Cotações e snapshots têm responsabilidades próprias, mas não substituem o histórico de operações.

### Consequências

- Correções em operações recompõem os resultados derivados.
- Proventos são representados por operações e não por uma segunda persistência concorrente.
- Consultas podem exigir consolidação, cache controlado ou snapshots, sem transformar esses derivados em nova fonte primária.
- Migrações devem preservar o histórico e a ordem semântica das operações.

### Alternativas consideradas

- Persistir posições consolidadas como fonte principal: rejeitada pelo risco de divergência.
- Manter tabelas independentes de operações e proventos sem vínculo: rejeitada por duplicar fatos financeiros.
- Usar snapshots como fonte primária: rejeitada porque snapshots representam estados derivados em datas específicas.

## ADR-002 — Engine financeira pura

### Contexto

Regras financeiras precisam ser auditáveis, reproduzíveis e reutilizáveis, independentemente da interface, do navegador, da persistência ou de provedores externos.

### Decisão

A engine financeira é composta por funções determinísticas que recebem dados e parâmetros explícitos e retornam resultados sem acessar React, DOM, storage, rede ou estado global mutável. Efeitos colaterais ficam fora da engine.

### Consequências

- Cálculos podem ser validados por fixtures e scripts isolados.
- A mesma regra pode ser reutilizada por diferentes interfaces e infraestruturas.
- Normalização de entrada deve ocorrer em fronteiras bem definidas.
- Data e hora corrente, quando relevantes, devem ser fornecidas como parâmetros para preservar determinismo.

### Alternativas consideradas

- Calcular diretamente em componentes: rejeitada por acoplamento e risco de duplicação.
- Consultar persistência dentro da engine: rejeitada por impedir testes puros.
- Delegar regras financeiras ao banco ou provider de mercado: rejeitada por distribuir regras centrais entre infraestruturas.

## ADR-003 — Repository Pattern

### Contexto

O Vestra precisa evoluir da persistência local para Supabase sem reescrever componentes, hooks ou regras financeiras e sem romper os dados existentes.

### Decisão

Domínios persistentes essenciais são acessados por contratos em `lib/repositories`. Implementações específicas ficam em adapters, selecionados por um registry. Serviços de aplicação coordenam os repositórios para hooks e componentes.

### Consequências

- A origem de dados pode mudar mantendo contratos estáveis.
- Adapters normalizam e persistem, mas não contêm regras financeiras ou de interface.
- Componentes e hooks não importam adapters concretos.
- Alterações de contrato exigem avaliação de compatibilidade em todos os providers.

### Alternativas consideradas

- Acesso direto ao `localStorage` em toda a aplicação: rejeitada por acoplamento.
- Introduzir Supabase diretamente em componentes: rejeitada por misturar infraestrutura e UI.
- Criar uma abstração genérica única para qualquer entidade: rejeitada porque esconderia regras e limites próprios de cada domínio.

## ADR-004 — Contratos assíncronos

### Contexto

O storage local é majoritariamente síncrono, enquanto banco remoto, autenticação e sincronização são naturalmente assíncronos. Consumidores não devem precisar mudar novamente durante essa transição.

### Decisão

Todos os métodos públicos dos repositórios retornam `Promise`, inclusive no provider local. Erros atravessam a fronteira por códigos padronizados e mensagens sanitizadas.

### Consequências

- Consumidores já estão preparados para I/O remoto.
- Estados de carregamento e falha precisam ser tratados pelos fluxos consumidores.
- Adapters locais envolvem operações síncronas em contratos assíncronos.
- Rejeições devem manter semântica consistente entre providers.

### Alternativas consideradas

- Manter contratos síncronos até a chegada do Supabase: rejeitada por exigir uma segunda migração ampla.
- Aceitar métodos ora síncronos, ora assíncronos: rejeitada por gerar contratos ambíguos.
- Expor detalhes nativos de cada provider: rejeitada por vazar infraestrutura aos consumidores.

## ADR-005 — Registry de providers

### Contexto

A escolha do provider precisa ocorrer em um único ponto, de forma explícita, testável e sem imports condicionais espalhados.

### Decisão

`repositoryRegistry.js` é o ponto único de resolução dos repositórios. Providers devem ser registrados e implementar os contratos exigidos. Providers ausentes ou inválidos produzem erro explícito; não há seleção silenciosa de uma infraestrutura diferente.

### Consequências

- A composição da infraestrutura fica centralizada.
- Testes podem validar contratos contra implementações distintas.
- Novos providers não exigem mudanças em componentes.
- Inicialização e configuração incorretas falham de modo previsível.

### Alternativas consideradas

- Instanciar adapters em cada serviço: rejeitada por duplicar seleção e configuração.
- Resolver providers em componentes: rejeitada por acoplar UI à infraestrutura.
- Fazer fallback silencioso entre repositórios: rejeitada por poder gravar dados no destino errado.

## ADR-006 — Provider Local permanente

### Contexto

Os dados atuais, o funcionamento offline e a capacidade de recuperação não devem depender exclusivamente de um serviço remoto.

### Decisão

O provider local permanece como implementação suportada, mesmo após a introdução de providers remotos. Ele preserva compatibilidade com a camada local existente e serve como base controlada para migração, contingência e testes.

### Consequências

- Contratos devem continuar verificáveis contra o provider local.
- Namespaces e migrações legadas não podem ser renomeados sem uma migração explícita.
- Limitações do provider local devem ser declaradas, não mascaradas.
- A existência do provider local não implica fallback automático de gravações remotas.

### Alternativas consideradas

- Remover a persistência local após o Supabase: rejeitada por reduzir resiliência e dificultar migração.
- Manter o provider local apenas como código de teste: rejeitada porque dados reais existentes dependem dele.
- Sincronizar local e remoto implicitamente em todo acesso: adiada até haver estratégia explícita de conflitos e sincronização.

## ADR-007 — Fallback de mercado

### Contexto

Cotações externas podem ficar indisponíveis, sofrer limites de plano ou retornar dados incompletos. A carteira não pode deixar de funcionar por depender de uma única API.

### Decisão

A integração de mercado usa rotas internas e uma cadeia explícita de fontes. O provider local permanece como fallback para cadastro e cotações manuais. A prioridade da cotação efetiva é: manual com override, automática válida, cache válido e preço médio como fallback visual sinalizado.

### Consequências

- Ausência de dados externos é tratada como estado esperado e visível.
- `BRAPI_TOKEN` permanece somente no servidor.
- Cache de mercado é temporário e não integra o backup essencial.
- Fallback visual não transforma preço médio em cotação real.

### Alternativas consideradas

- Consumir a API externa diretamente no navegador: rejeitada por segurança e acoplamento.
- Tornar a API externa obrigatória: rejeitada por disponibilidade e limites do fornecedor.
- Persistir toda resposta externa como dado permanente: rejeitada por misturar cache expirável com fatos do usuário.

## ADR-008 — Separação Data / Engine / UI

### Contexto

Persistência, regras financeiras e apresentação mudam por motivos e ritmos diferentes. Misturá-las aumenta regressões e dificulta testes.

### Decisão

As responsabilidades são separadas:

- Data e repositories normalizam, recuperam e persistem dados.
- Engine calcula resultados puros e determinísticos.
- Services coordenam casos de uso.
- Hooks coordenam estado e ciclo de vida da interface.
- Componentes apresentam dados e capturam ações.

### Consequências

- Dependências seguem em direção às abstrações e ao domínio.
- Componentes não contêm regras financeiras nem acessam adapters.
- Engines não conhecem UI, storage, providers ou APIs.
- Coordenação transversal deve ocorrer em serviços, sem criar atalhos entre camadas.

### Alternativas consideradas

- Componentes autocontidos com acesso a dados e cálculos: rejeitada por baixa reutilização.
- Hooks como camada única para todas as responsabilidades: rejeitada por acoplar domínio ao React.
- Serviços com regras financeiras duplicadas: rejeitada porque a engine é a fonte dessas regras.

## ADR-009 — Branding centralizado

### Contexto

“Vestra” é o nome interno do projeto e a marca pública pode mudar. Textos, URLs, e-mails, logos e metadados espalhados tornariam a troca arriscada.

### Decisão

Identidade pública é centralizada em `lib/config/brandConfig.js`; ambiente público e segredos privados permanecem separados. Namespaces persistentes `vestra:*`, nomes técnicos internos e registros históricos continuam estáveis até existir migração específica.

### Consequências

- A marca pública pode ser alterada principalmente por configuração e assets centralizados.
- Componentes clientes não importam a configuração privada de ambiente.
- Renomear namespaces exige plano de migração e compatibilidade.
- Documentação deve distinguir marca pública, nome interno e identificadores técnicos.

### Alternativas consideradas

- Busca e substituição global no lançamento: rejeitada pelo risco sobre persistência e integrações.
- Ler toda identidade apenas de variáveis de ambiente: rejeitada por tornar valores estáveis dispersos e menos auditáveis.
- Renomear imediatamente chaves persistentes: rejeitada por quebrar dados existentes.

## ADR-010 — Evolução incremental do Core

### Contexto

O protótipo contém funcionalidades e dados que precisam ser preservados enquanto a fundação evolui. Refatorações amplas dificultariam identificar regressões e restaurar compatibilidade.

### Decisão

O Core evolui em etapas pequenas, ordenadas e aprovadas. Cada etapa deve manter compatibilidade, atualizar a documentação e cumprir a Definition of Done antes da próxima. Mudanças de ordem no roadmap exigem justificativa técnica documentada.

### Consequências

- Entregas têm escopo limitado e critérios de aceite explícitos.
- Lint, build e validadores aplicáveis são executados em cada etapa.
- Migrações são introduzidas antes de remover caminhos legados.
- Funcionalidades adiadas não desviam a sequência do Core.

### Alternativas consideradas

- Reescrever o produto a partir de uma nova base: rejeitada por desperdiçar ativos validados e elevar o risco.
- Migrar todos os domínios de uma vez: rejeitada por ampliar a superfície de regressão.
- Continuar adicionando funcionalidades sem sequência: rejeitada por não construir a fundação necessária ao uso diário.

## ADR-011 — Autenticação independente dos dados locais

### Contexto

A identidade remota passa a existir antes da migração de carteira, operações e preferências. Associar dados locais automaticamente a uma conta criaria risco de envio ou mistura sem consentimento.

### Decisão

Supabase Auth identifica a pessoa, mas não altera o provider de dados. Login, cadastro e logout não selecionam repositories remotos, não apagam `localStorage` e não associam dados financeiros ao Auth User.

### Consequências

- Uma conta autenticada pode continuar usando a carteira local existente.
- Auth User e futuro Profile de negócio permanecem conceitos distintos.
- Sincronização exigirá fluxo próprio, explícito e reconciliável.
- Logout remove a sessão de autenticação, não os dados financeiros locais.

### Alternativas consideradas

- Migrar dados automaticamente no primeiro login: rejeitada por risco de perda e associação indevida.
- Tornar autenticação obrigatória para toda a aplicação: adiada até os dados protegidos existirem remotamente.
- Criar `public.profiles` junto ao Auth: adiada para uma etapa com schema e RLS testáveis.

## ADR-012 — Identidade verificada no servidor

### Contexto

Cookies podem conter sessão expirada ou manipulada. Ler apenas a presença de um cookie ou confiar em `getSession()` não é suficiente para proteger uma rota.

### Decisão

O Proxy usa `getClaims()` para validar e renovar a identidade; páginas protegidas usam `getUser()` quando precisam do registro atual. `getSession()` não autoriza rotas ou dados.

### Consequências

- `/conta` recebe proteção incremental sem bloquear o restante da aplicação.
- Cookies renovados precisam ser preservados na request e na response.
- Falha de validação equivale a estado não autenticado.
- A checagem de autorização futura continuará próxima dos dados, além do Proxy.

### Alternativas consideradas

- Confiar apenas na existência do cookie: rejeitada por não validar identidade.
- Usar somente `getSession()` no servidor: rejeitada por confiar em dados lidos do storage.
- Proteger globalmente todas as rotas: rejeitada porque os dados ainda permanecem locais.
## ADR-011 — Criação explícita e idempotente de Profile

**Contexto:** Profiles precisam existir para usuários atuais e futuros, mas triggers em `auth.users` podem bloquear cadastro quando falham.

**Decisão:** Criar profile pelo repository após login e executar backfill idempotente de IDs na migration.

**Consequências:** Auth permanece independente; o aplicativo deve garantir o profile antes de usar dados de negócio.

**Alternativas consideradas:** trigger em `auth.users` e criação administrativa manual. O trigger foi rejeitado pelo acoplamento; o processo manual não garante consistência.

## ADR-012 — Carteira criada por RPC atômica

**Contexto:** INSERT direto poderia produzir carteira sem owner e aceitar identidade manipulada.

**Decisão:** Revogar INSERT direto e expor `create_portfolio_with_owner`, `SECURITY DEFINER`, `search_path = ''`, identidade derivada de `auth.uid()`.

**Consequências:** Toda carteira nasce válida; mudanças no contrato exigem migration coordenada com o repository.

**Alternativas consideradas:** duas chamadas do cliente e trigger após INSERT. Duas chamadas não são atômicas; trigger esconderia a regra de autorização.

## ADR-013 — Papel como enum PostgreSQL

**Contexto:** O conjunto `owner/editor/viewer` é pequeno e participa de policies e integridade.

**Decisão:** Usar `public.portfolio_role`.

**Consequências:** valores inválidos são impossíveis; novos papéis exigem migration explícita.

**Alternativas consideradas:** texto com CHECK. Seria flexível, mas repetiria o contrato e reduziria clareza nas funções.

## ADR-014 — Snapshots históricos por fonte e carteira

**Contexto:** o histórico Local alimentava Dashboard e performance, mas não podia acompanhar uma carteira Supabase em outro dispositivo.

**Decisão:** persistir um snapshot diário mínimo por carteira, gerado somente após carga financeira completa. O provider selecionado fornece operações e snapshots em conjunto, sem fallback cruzado. `journeyRecords` permanece derivado e `lastDashboardVisit` local.

**Consequências:** histórico remoto é portátil e protegido por RLS; a mesma data é atualizada idempotentemente; carteira nova começa no primeiro estado observado; importação exige prévia e confirmação.

**Alternativas consideradas:** recalcular todo o passado apenas por operações, misturar histórico Local com operações remotas, criar tabelas de recordes/visitas e executar cron. Rejeitadas por ausência de cotações históricas confiáveis, risco de mistura e complexidade desnecessária.
