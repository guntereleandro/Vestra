# Autenticação e Sessão

Status: implementada na CORE-04; requer um projeto Supabase configurado para validação ponta a ponta.

## Escopo

A autenticação usa e-mail e senha do Supabase Auth, cookies SSR e fluxo PKCE. Ela identifica a pessoa, mas não sincroniza nem associa os dados financeiros locais.

Incluído:

- cadastro e confirmação de e-mail;
- login e logout;
- leitura verificada do usuário;
- renovação de sessão no Proxy;
- recuperação e atualização de senha;
- callback PKCE e confirmação por `token_hash`;
- proteção incremental de `/conta`.

Adiado:

- OAuth, login social, MFA, passkeys e telefone;
- usuários anônimos, organizações, convites, planos e papéis;
- `public.profiles` e qualquer tabela de negócio;
- adaptação dos repositories ao Supabase;
- sincronização ou migração de dados locais.

## Arquitetura

```text
Páginas e componentes de autenticação
  -> lib/auth/authService.js
    -> Browser Client @supabase/ssr
      -> Supabase Auth

Server Component /conta
  -> serverAuthService
    -> Server Client com cookies
      -> auth.getUser()

proxy.js
  -> createProxySupabaseClient
    -> auth.getClaims()
    -> request cookies + response cookies

auth/callback
  -> Server Client
    -> exchangeCodeForSession(code)
    -> ou verifyOtp(token_hash, type)
```

Componentes não chamam Supabase diretamente. Validação, erros e redirects pertencem a `lib/auth`.

## Configuração

Variáveis públicas:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, recomendada para projetos novos;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`, aceita como compatibilidade;
- `NEXT_PUBLIC_SITE_URL`;
- `NEXT_PUBLIC_APP_URL`.

Variável privada:

- `SUPABASE_SECRET_KEY`, opcional e nunca usada por autenticação de usuário;
- `SUPABASE_SERVICE_ROLE_KEY`, aceita como fallback legado somente no servidor.

O build e os fluxos locais continuam disponíveis sem Supabase. Ao tentar autenticar nesse estado, a interface retorna `AUTH_NOT_CONFIGURED`.

## Cookies e sessão

`@supabase/ssr` gerencia a sessão em cookies. O Proxy executa `auth.getClaims()` para validar a identidade e permitir renovação dos cookies. Ele preserva cookies tanto na request encaminhada quanto na response devolvida.

`getSession()` não é usado para autorizar `/conta`, pois uma sessão lida diretamente de storage não constitui identidade verificada. A página solicita o usuário atual ao Auth por `getUser()`.

Tokens, refresh tokens e IDs internos não são exibidos.

## Rotas

| Rota | Acesso | Responsabilidade |
|---|---|---|
| `/entrar` | público | login por e-mail e senha |
| `/cadastrar` | público | cadastro e orientação de confirmação |
| `/recuperar-senha` | público | solicitação neutra de recuperação |
| `/atualizar-senha` | público com sessão de recuperação | definição da nova senha |
| `/confirmar-email` | público | estado de confirmação |
| `/auth/callback` | público | troca PKCE ou verificação de OTP |
| `/conta` | protegido | e-mail, confirmação, último acesso e logout |

Dashboard, carteira, operações, mercado, objetivos e configurações continuam públicos nesta fase.

## Redirects

Destinos passam por `getSafeRedirectPath`. Somente caminhos relativos iniciados por `/`, sem barra dupla, protocolo ou barra invertida, são aceitos. Destinos externos retornam ao fallback `/conta`.

O Proxy preserva o destino interno ao enviar uma pessoa não autenticada de `/conta` para `/entrar`. Usuários autenticados em `/entrar` ou `/cadastrar` são enviados para `/conta`.

## Cadastro e confirmação

O cadastro usa `signUp` com `emailRedirectTo` apontando para `/auth/callback`. A interface sempre orienta a verificar o e-mail e não expõe detalhes internos do Auth.

O callback aceita:

- `code`, trocado uma única vez por `exchangeCodeForSession`;
- `token_hash` acompanhado de tipo permitido (`signup`, `email` ou `recovery`), validado por `verifyOtp`.

Código ausente, expirado, reutilizado ou inválido produz apenas um código público seguro.

## Recuperação de senha

1. A pessoa informa o e-mail.
2. `resetPasswordForEmail` envia o link para o callback.
3. A interface mostra uma conclusão neutra, sem confirmar a existência da conta.
4. O callback valida o código e força o destino `/atualizar-senha`.
5. A página confirma a sessão por `getUser()` e chama `updateUser({ password })`.
6. A sessão é mantida após a atualização, decisão que evita um segundo login no mesmo fluxo validado.

Senhas existem somente no estado efêmero dos formulários. Não entram em URL, log, storage persistente ou repository.

## Erros

Erros públicos normalizados:

- `AUTH_NOT_CONFIGURED`;
- `INVALID_CREDENTIALS`;
- `EMAIL_NOT_CONFIRMED`;
- `EMAIL_ALREADY_REGISTERED`;
- `PASSWORD_TOO_SHORT`;
- `PASSWORD_MISMATCH`;
- `INVALID_EMAIL`;
- `SESSION_EXPIRED`;
- `RECOVERY_LINK_INVALID`;
- `AUTH_RATE_LIMITED`;
- `AUTH_PROVIDER_ERROR`;
- `UNSAFE_REDIRECT`.

O mapeamento prioriza códigos do provider e status HTTP. Textos técnicos não são repassados ao usuário; a causa permanece apenas no objeto de erro interno.

## Painel Supabase

### Auth > URL Configuration

Development:

- Site URL: `http://localhost:3000`;
- Redirect URL: `http://localhost:3000/auth/callback`;
- Redirect URL: `http://localhost:3000/atualizar-senha`.

Preview:

- cadastrar apenas origens de Preview realmente usadas;
- usar padrão controlado da Vercel somente quando necessário;
- evitar liberar previews de terceiros.

Production:

- Site URL: domínio oficial exato;
- Redirect URL: `https://dominio-oficial/auth/callback`;
- Redirect URL: `https://dominio-oficial/atualizar-senha`;
- não usar wildcard amplo quando caminhos exatos forem suficientes.

### Auth > Email Templates

Para confirmação por `token_hash`, o template pode apontar para:

```text
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/confirmar-email?status=success
```

O template de recuperação deve usar a URL de redirecionamento configurada pelo SDK e terminar no callback. Alterações de template devem ser testadas em Development antes de Preview ou Production.

### Auth > Providers

- habilitar somente Email;
- exigir confirmação de e-mail;
- manter OAuth e telefone desabilitados nesta etapa;
- alinhar a política mínima do painel com o mínimo de 8 caracteres exigido pela aplicação.

## Provider Local

Autenticação e persistência financeira são domínios separados:

- o registry inicia em `local`;
- login e logout não selecionam outro provider;
- operações, carteira, preferências e snapshots continuam no `localStorage`;
- logout não limpa dados locais;
- cadastro não importa backup;
- nenhum registro financeiro é enviado ao Supabase;
- Auth User não é Profile de negócio.

`public.profiles` e a adaptação de `ProfilesRepository` pertencem a uma etapa futura com schema e RLS próprios.

## Testes

Automático:

```bash
node scripts/validate-auth.mjs
node scripts/validate-supabase.mjs
node scripts/validate-repositories.mjs
```

Conectividade opcional, sem criar usuário:

```bash
node scripts/validate-auth.mjs --connectivity
```

O teste ponta a ponta de e-mail requer projeto Supabase Development, configuração de redirect e uma caixa postal controlada.

## Limitações

- sem projeto configurado, os fluxos retornam indisponibilidade controlada;
- não há Profile de negócio;
- somente `/conta` é protegida;
- não há sincronização entre navegadores;
- a entrega e reputação dos e-mails dependem da configuração do Supabase;
- testes reais de confirmação e recuperação não devem criar usuários automaticamente em Production.
