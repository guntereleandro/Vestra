# Infraestrutura Supabase

Status: infraestrutura criada na CORE-03; Auth ativado na CORE-04 quando variáveis públicas estão configuradas.

## Escopo

A CORE-03 introduziu os SDKs oficiais, clientes por contexto, configuração server-only, helpers, adapters stub e seleção multi-provider. A CORE-04 passou a usar Browser/Server Client para Supabase Auth e o Proxy para renovação de cookies. Não existem tabelas, SQL, migrations, policies de negócio, sincronização ou migração de dados.

O provider ativo continua sendo `local`.

## Fluxo atual

```text
Componentes e hooks
  -> services
    -> repositoryRegistry
      -> provider local (ativo)
        -> lib/data
          -> localStorage

Autenticação opcional
  lib/supabase
    -> Browser Client (URL + chave pública)
    -> Server Client (URL + chave pública)
    -> Admin Client (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY)
  repositoryRegistry
    -> provider supabase (registrado)
      -> 7 adapters stub
        -> erro NOT_IMPLEMENTED
```

## Organização

```text
lib/supabase/
  client/
    browserClient.js
    serverClient.js
    adminClient.js
  config/
    supabaseConfig.js
  helpers/
    authHelpers.js
    sessionHelpers.js

lib/repositories/supabase/
  createSupabaseRepositoryStub.js
  index.js
  supabaseProfilesRepository.js
  supabasePortfoliosRepository.js
  supabaseOperationsRepository.js
  supabaseDividendsRepository.js
  supabaseQuotesRepository.js
  supabasePortfolioSnapshotsRepository.js
  supabasePreferencesRepository.js

proxy.js
scripts/validate-supabase.mjs
```

## Clientes

### Browser Client

`browserClient.js` usa `createBrowserClient` de `@supabase/ssr`. Ele lê somente a configuração pública central ou aceita `{ url, publishableKey }` explicitamente. O campo `anonKey` permanece aceito apenas em overrides programáticos legados. O módulo não importa `envConfig` privado nem conhece a chave administrativa.

Somente `lib/auth/authService.js` cria esse cliente; componentes não chamam Supabase diretamente.

### Server Client

`serverClient.js` usa `createServerClient` de `@supabase/ssr`, configura o adapter de cookies do Next.js e obtém URL e publishable key exclusivamente por `supabaseConfig.js`. Pode ser usado em Server Components, Server Actions e Route Handlers.

Tentativas de gravação de cookie em Server Components somente leitura são ignoradas. No Proxy, o mesmo módulo preserva cookies da request e da response durante a renovação.

### Admin Client

`adminClient.js` usa `createClient` de `@supabase/supabase-js` com persistência e renovação de sessão desativadas. Ele exige secret key (ou a service role legada), importa `server-only` e não é consumido pela aplicação.

O Admin Client é reservado a operações confiáveis no servidor. Nunca deve ser usado para requisições em nome do usuário nem contornar RLS em fluxos comuns.

## Configuração

`lib/config/envConfig.js` é o único leitor das variáveis Supabase. `lib/supabase/config/supabaseConfig.js` valida a configuração apenas quando um cliente é solicitado. Variáveis ausentes não quebram lint ou build enquanto o provider Local está ativo.

| Variável | Contexto | Obrigatoriedade na CORE-03 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | obrigatória quando Auth está ativo |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador e servidor | obrigatória quando Auth está ativo |
| `SUPABASE_SECRET_KEY` | somente servidor confiável | opcional; exigida apenas ao criar Admin Client |
| `SUPABASE_SERVICE_ROLE_KEY` | fallback administrativo legado, somente servidor | opcional |

### Development

- Pode operar sem variáveis Supabase.
- Provider Local permanece ativo.
- Para validar clientes contra um projeto de desenvolvimento, configurar URL e publishable key localmente.
- Secret key só deve existir se um fluxo administrativo isolado precisar dela.

### Preview

- Usar projeto ou branch de Preview separado de Production.
- URL e publishable key tornam-se obrigatórias quando a autenticação for ativada.
- Secret key permanece opcional e restrita ao servidor.
- Nunca reutilizar dados financeiros reais para validação estrutural.

### Production

- URL e publishable key serão obrigatórias antes de ativar autenticação ou provider remoto.
- Secret key deve ser configurada apenas se houver caso administrativo aprovado.
- Segredos devem ficar no gerenciador do ambiente de deploy, nunca no repositório.
- Ausência de configuração deve falhar de forma explícita no fluxo que pedir o cliente, sem fallback silencioso de escrita.

## Providers e adapters

O registry reconhece `local` e `supabase`. O valor inicial permanece `local`; nenhum arquivo de aplicação seleciona `supabase`.

Os sete adapters Supabase implementam formalmente os métodos dos contratos assíncronos, mas cada método lança `SupabaseRepositoryNotImplementedError` com código `NOT_IMPLEMENTED`. Não há consulta SQL, acesso remoto ou mutação local.

Selecionar um provider diferente continua sendo uma ação explícita. Não há fallback silencioso entre gravações locais e remotas.

## Helpers

- `authHelpers.js`: normaliza leitura futura de usuário e claims verificadas.
- `sessionHelpers.js`: fornece snapshot de sessão e uma checagem estrutural simples.

Os helpers normalizam respostas básicas. A autorização da CORE-04 usa claims no Proxy e usuário verificado na página protegida, nunca apenas `getSession()`.

## Proxy e sessão

No Next.js 16, a antiga convenção Middleware chama-se Proxy. `proxy.js` executa `getClaims()`, permite que `@supabase/ssr` renove cookies e exclui assets estáticos pelo matcher.

Ele protege somente `/conta`, redireciona pessoas autenticadas para fora de `/entrar` e `/cadastrar` e deixa todas as demais rotas públicas. Não acessa service role ou tabelas.

## Segurança

- `SUPABASE_SECRET_KEY` e seu fallback legado `SUPABASE_SERVICE_ROLE_KEY` são lidos apenas por `envConfig.js`.
- `supabaseConfig.js`, Server Client e Admin Client usam `server-only`.
- Browser Client lê apenas `NEXT_PUBLIC_*` centralizadas e não referencia service role.
- Nenhum valor de credencial é registrado em logs ou diagnósticos.
- Diagnósticos retornam somente flags booleanas de presença.
- A publishable key não concede acesso irrestrito: quando o banco existir, todo dado privado exigirá RLS.
- O Admin Client não participa do registry nem dos fluxos de usuário.

## Validação

`node scripts/validate-supabase.mjs` verifica sem rede e sem modificar dados:

- instalação dos SDKs oficiais;
- criação dos clientes Browser, Server e Admin com valores sintéticos;
- comportamento seguro quando variáveis estão ausentes;
- leitura centralizada do ambiente;
- ausência de imports privados em módulos Client;
- registro e contratos dos sete adapters;
- erro `NOT_IMPLEMENTED`;
- ausência de logging na infraestrutura;
- Proxy mínimo;
- Provider Local ativo antes e depois do teste.

`node scripts/validate-repositories.mjs` continua validando CRUD local, contratos, backup e namespaces legados.

## Próximo fluxo previsto

Na CORE-05 serão criados Profile, carteiras, membros e RLS. ProfilesRepository somente então receberá implementação remota. Operações remotas pertencem à CORE-06. Não haverá migração automática de dados locais nessas etapas.

Detalhes de Auth estão em `docs/AUTHENTICATION.md`.
