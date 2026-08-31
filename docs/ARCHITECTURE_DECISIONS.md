# Decisões de Arquitetura do Vestra Core

## ADR-019 — Mercado orientado por capacidades e proveniência

### Contexto

O contrato atual trata providers como se todos entregassem as mesmas funções. Na prática, busca, cotação, lote, perfil, fundamentos, histórico, dividendos e eventos variam por classe, plano e fonte. Fallback silencioso e valores fabricados para campos ausentes tornam impossível distinguir dado real de indisponibilidade.

### Decisão

A evolução do Mercado deve declarar capacidades por provider e classe. Toda resposta externa deve preservar provider, disponibilidade, limitação, timestamp da fonte, momento da coleta e estado de cache. `null` permanece ausência; zero e horário atual não são fallback. UI e engine continuam consumindo contratos internos e nunca importam fornecedor diretamente. O Provider Local permanece permanente e seu uso deve ser rastreável.

### Consequências

Novas fontes podem ser compostas por capacidade sem reescrever consumidores. Limites de plano passam a orientar lote, cache e UX. Histórico, fundamentos e eventos entram como contratos próprios. A primeira implementação precisa corrigir classificação, nulls, loading e lote antes de ampliar campos.

Implementação CORE-13: BRAPI Free usa uma chamada por ticker e concorrência três; histórico oferece somente 1M/3M e exibe `close`, preservando `adjustedClose`; rotas públicas de Mercado não aguardam Auth; rate limit em memória é best-effort. Eventos externos nunca são persistidos automaticamente.

### Alternativas consideradas

Ampliar apenas `brapiProvider`: rejeitada por manter acoplamento a um fornecedor. Exibir todos os campos para todas as classes: rejeitada por criar indicadores irrelevantes. Ocultar falhas com fallback local: rejeitada por perder proveniência. Migrar imediatamente para outra API: rejeitada sem auditoria de cobertura, licença e custo.

## ADR-018 — Semântica de proventos possui uma única fonte de domínio

### Contexto

`RENDIMENTO` pode representar tanto provento convencional quanto retorno econômico interno de Caixa Remunerado ou Renda Fixa por valor. Listas locais baseadas apenas no tipo operacional fizeram diagnósticos tratarem ajustes internos como proventos, embora Dashboard, totais e snapshots estivessem corretos.

### Decisão

`lib/domain/operations/passiveIncome.js` é a fonte oficial para classificar proventos. `DIVIDENDO`, `JCP` e `RENDIMENTO` são elegíveis, mas eventos associados a `Caixa Remunerado` ou `Renda Fixa` são retorno econômico, não provento. Dashboard, Proventos, diagnósticos, métricas comportamentais e repositories de proventos reutilizam a mesma regra. `lib/data/operations.js` mantém reexportação compatível.

### Consequências

Fluxo de capital, retorno econômico, provento e evento patrimonial permanecem conceitos distintos. Ajustes internos continuam compondo saldo e performance, mas não totais, recordes, concentração, dependência ou snapshots de proventos. Um validador impede listas paralelas nos consumidores auditados.

### Alternativas consideradas

Ocultar os cards: rejeitada por manter o cálculo incorreto. Tratar todo `RENDIMENTO` como provento: rejeitada por confundir domínios. Criar novos tipos apenas para a importação: rejeitada por alterar o lote reconciliado sem necessidade.

## ADR-017 — Renda fixa sem quantidade usa ledger por valor

### Contexto

CDB, LCI, LCA, LCD e instrumentos equivalentes podem ser apresentados naturalmente por aplicação, resgate e saldo monetário, sem quantidade ou preço unitário confiáveis. Forçar quantidade 1 e preço igual ao saldo cria unidades artificiais e mistura capital com remuneração.

### Decisão

Adicionar `FIXED_INCOME_APPLICATION` e `FIXED_INCOME_REDEMPTION` ao ledger único. Esses fatos persistem somente `value_amount`; quantidade e preço permanecem zero. A engine deriva um saldo monetário com preço interno 1, separa capital aplicado de rendimento e aceita `RENDIMENTO` como ajuste acumulado explícito na data de reconciliação. Tesouro Direto continua no contrato de quantidade fracionária quando quantidade e preço existem.

### Consequências

O modelo atende genericamente renda fixa baseada em valor sem tratamento específico para um emissor. Aplicações e resgates entram em contribuições líquidas; rendimento altera saldo e performance, mas não proventos passivos. O banco ganha `value_amount`, adapters fazem round-trip e a UI manual permanece inalterada.

### Alternativas consideradas

Quantidade 1 e preço igual ao aporte: rejeitada por inventar unidade. Reusar `cash_amount`: rejeitada por confundir renda fixa com Caixa Remunerado. Persistir saldo atual diretamente: rejeitada por criar segunda fonte de verdade. Fabricar rendimentos diários: rejeitada por perder auditabilidade.

## ADR-016 — Ledger único distingue fluxos e eventos patrimoniais

### Contexto

Desdobramentos, bônus, conversões e caixa remunerado afetam posições reais, mas não cabem corretamente em compra/venda/provento.

### Decisão

Evoluir `portfolio_operations` como ledger de fatos cronológicos. Tipos corporativos não geram fluxo; depósitos e retiradas de caixa são fluxos de valor puro. A engine processa conversões entre ativos em uma passagem global. Bonificação sem custo fica pendente e não é persistida remotamente.

### Consequências

Uma única fonte reconstrói posições e snapshots; schema e backup ganham campos; a UI manual permanece compatível; importadores precisam classificar antes de gravar.

### Alternativas consideradas

Tabela `corporate_actions` separada: rejeitada agora por exigir junção e ordenação transacional entre duas fontes. Compra/venda sintética: rejeitada por criar caixa e resultado fictícios. Posições ajustadas diretamente: rejeitada por perder auditabilidade.

## ADR-015 — Eventos externos incompatíveis são retidos sem conversão artificial

### Contexto

A carteira real do Investidor10 contém bonificações, desdobramentos, conversões/incorporações, títulos fracionários e depósitos em caixa remunerado. O contrato atual reconhece somente compra, venda e três tipos de renda. Como operações são a fonte da verdade, uma equivalência apenas sintática pode alterar custo, quantidade, lucro e performance.

### Decisão

Importar imediatamente apenas fatos cujo significado econômico coincida com o contrato canônico e cujos valores sejam reconciliáveis. Preservar eventos incompatíveis em lote retido, fora da engine e sem perda da forma de origem, até existir decisão explícita de domínio e cobertura de regressão. É proibido representar bonificação ou desdobramento como compra, conversão como venda seguida de compra e aporte em caixa remunerado como rendimento. Quantidade fracionária não exige novo tipo; atributos próprios de renda fixa exigem tratamento separado da movimentação básica.

### Consequências

- a importação real deixa de ser “tudo ou nada” e passa a ter lote importável e lote retido;
- a engine não recebe fatos com significado adulterado;
- posições afetadas por eventos retidos não podem ser consideradas reconciliadas;
- a prontidão técnica da CORE-12 não basta para iniciar os 30 dias enquanto esses eventos afetarem a carteira em uso;
- suporte futuro exige mudança deliberada de contrato, persistência, importação e testes, nunca apenas um alias.

### Alternativas consideradas

- registrar bonificação/desdobramento como compra de custo zero: rejeitada por não expressar alocação de custo, aporte e regra fiscal;
- registrar conversão como venda e compra: rejeitada por criar realização e fluxos de caixa possivelmente inexistentes;
- registrar depósitos do Mercado Pago como rendimento ou CDB genérico: rejeitada por confundir capital, remuneração, liquidez e tributação;
- descartar eventos não reconhecidos: rejeitada por causar perda silenciosa e reconciliação falsa.

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

## ADR-020 — Evento, expectativa e recebimento são fatos distintos

### Contexto

Providers informam anúncios e pagamentos públicos, mas não comprovam posição elegível nem crédito na conta. Converter anúncio diretamente em operação duplicaria registros manuais e contaminaria snapshots e performance.

### Decisão

Proventos automáticos serão separados em evento global versionado, expectativa privada por carteira e operação recebida. Somente a operação confirmada integra a fonte da verdade. O Core começa com sincronização manual, expectativas idempotentes e confirmação ou vínculo manual.

Identidade combina instrumento, tipo, datas, parcela/período, taxa, moeda e aliases. Correções criam versões; cancelamentos não apagam histórico; UUID manual é preservado.

### Consequências

- expectativas não entram em totais realizados, snapshots, diagnostics ou performance;
- evento global não é duplicado por carteira;
- RLS protege expectativas e reconciliações por membership;
- cobertura, licença e lifecycle da fonte precedem crédito automático;
- Caixa Remunerado, Renda Fixa, amortizações e eventos patrimoniais permanecem fora de Proventos.

### Alternativas consideradas

- criar operação no anúncio: rejeitada porque anúncio não comprova recebimento;
- guardar expectativas em `portfolio_operations`: rejeitada por contaminar a fonte da verdade;
- deduplicar por ticker/data/valor: rejeitada por fundir eventos legítimos;
- usar quantidade atual em eventos históricos: rejeitada por produzir elegibilidade incorreta.

### Estado de implementação

Implementado localmente na CORE-14 com contratos puros, quatro tabelas versionadas em migration, RLS, adapter BRAPI por capability, cálculo histórico, matching, confirmação/vínculo transacional e UI Recebidos/A receber. A aplicação remota permanece pendente porque a conexão PostgreSQL falhou antes do dry-run; nenhuma tabela ou dado remoto foi alterado.
