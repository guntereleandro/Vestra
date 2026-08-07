import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const requiredRoutes = [
  "app/entrar/page.js",
  "app/cadastrar/page.js",
  "app/recuperar-senha/page.js",
  "app/atualizar-senha/page.js",
  "app/confirmar-email/page.js",
  "app/auth/callback/route.js",
  "app/conta/page.js",
];
for (const route of requiredRoutes) {
  assert(fs.existsSync(path.join(root, route)), `Rota obrigatória ausente: ${route}.`);
}

const [
  authErrors,
  authValidation,
  authRedirects,
  authHelpers,
  sessionHelpers,
  { getRepositoryProvider },
] = await Promise.all([
  import("../lib/auth/authErrors.js"),
  import("../lib/auth/authValidation.js"),
  import("../lib/auth/authRedirects.js"),
  import("../lib/supabase/helpers/authHelpers.js"),
  import("../lib/supabase/helpers/sessionHelpers.js"),
  import("../lib/repositories/repositoryRegistry.js"),
]);

const expectedErrorCodes = [
  "AUTH_NOT_CONFIGURED",
  "INVALID_CREDENTIALS",
  "EMAIL_NOT_CONFIRMED",
  "EMAIL_ALREADY_REGISTERED",
  "PASSWORD_TOO_SHORT",
  "PASSWORD_MISMATCH",
  "INVALID_EMAIL",
  "SESSION_EXPIRED",
  "RECOVERY_LINK_INVALID",
  "AUTH_RATE_LIMITED",
  "AUTH_PROVIDER_ERROR",
  "UNSAFE_REDIRECT",
];
for (const code of expectedErrorCodes) {
  assert(authErrors.AUTH_ERROR_CODES[code] === code, `Código de erro ausente: ${code}.`);
}
assert(
  authErrors.normalizeAuthError({ code: "invalid_credentials" }).code === "INVALID_CREDENTIALS",
  "Credenciais inválidas não foram normalizadas.",
);
assert(
  authErrors.normalizeAuthError({ code: "email_not_confirmed" }).code === "EMAIL_NOT_CONFIRMED",
  "E-mail não confirmado não foi normalizado.",
);
assert(
  authErrors.normalizeAuthError({ status: 429 }).code === "AUTH_RATE_LIMITED",
  "Rate limit não foi normalizado.",
);

assert(authValidation.isValidEmail("pessoa@example.com"), "E-mail válido foi rejeitado.");
assert(!authValidation.isValidEmail("pessoa@"), "E-mail inválido foi aceito.");
assert(authValidation.validatePassword("12345678") === "12345678", "Senha válida foi rejeitada.");
try {
  authValidation.validatePassword("1234567");
  throw new Error("Senha curta foi aceita.");
} catch (error) {
  assert(error.code === "PASSWORD_TOO_SHORT", "Código incorreto para senha curta.");
}
try {
  authValidation.validatePasswordConfirmation("12345678", "87654321");
  throw new Error("Confirmação divergente foi aceita.");
} catch (error) {
  assert(error.code === "PASSWORD_MISMATCH", "Código incorreto para divergência de senha.");
}

const unsafeRedirects = [
  "https://evil.example",
  "//evil.example/path",
  "/\\evil.example",
  "javascript:alert(1)",
];
for (const value of unsafeRedirects) {
  assert(authRedirects.getSafeRedirectPath(value) === "/dashboard", `Open redirect aceito: ${value}.`);
}
assert(
  authRedirects.getSafeRedirectPath("/conta?tab=seguranca") === "/conta?tab=seguranca",
  "Destino interno seguro foi rejeitado.",
);

const helperClient = {
  auth: {
    async getUser() {
      return { data: { user: { id: "validation-user" } }, error: null };
    },
    async getClaims() {
      return { data: { claims: { sub: "validation-user" } }, error: null };
    },
    async getSession() {
      return {
        data: {
          session: {
            access_token: "validation-token",
            user: { id: "validation-user" },
          },
        },
        error: null,
      };
    },
  },
};
const [{ user }, { claims }, { session }] = await Promise.all([
  authHelpers.getAuthenticatedUser(helperClient),
  authHelpers.getVerifiedClaims(helperClient),
  sessionHelpers.getSessionSnapshot(helperClient),
]);
assert(user?.id === "validation-user", "Helper de usuario autenticado invalido.");
assert(claims?.sub === "validation-user", "Helper de claims verificadas invalido.");
assert(sessionHelpers.hasActiveSession(session), "Helper de sessao ativa invalido.");
assert(!sessionHelpers.hasActiveSession(null), "Sessao ausente foi marcada como ativa.");

const authServiceSource = read("lib/auth/authService.js");
const expectedServiceExports = [
  "signUpWithPassword",
  "signInWithPassword",
  "signOut",
  "requestPasswordRecovery",
  "updatePassword",
  "getAuthenticatedUser",
];
for (const method of expectedServiceExports) {
  assert(
    new RegExp(`export async function ${method}\\s*\\(`).test(authServiceSource),
    `Contrato ausente no authService: ${method}.`,
  );
}
assert(!authServiceSource.includes("localStorage"), "authService não deve acessar localStorage.");
assert(!authServiceSource.includes("clearVestraData"), "Logout não pode limpar dados locais.");
assert(!authServiceSource.includes("SUPABASE_SERVICE_ROLE_KEY"), "authService referencia SERVICE_ROLE.");

const proxySource = read("proxy.js");
assert(proxySource.includes("!isPublicRoute(pathname) && !authenticated"), "Proxy nao protege globalmente a area privada.");
assert(proxySource.includes('"/entrar"') && proxySource.includes('"/cadastrar"'), "Rotas públicas de autenticação ausentes no Proxy.");
assert(proxySource.includes("auth.getClaims()"), "Proxy não verifica claims para renovar/validar identidade.");
assert(proxySource.includes("auth.getUser()"), "Proxy nao invalida sessao de usuario removido antes do onboarding.");
assert(proxySource.includes("auth.signOut()"), "Proxy nao limpa a sessao de usuario removido.");
assert(!proxySource.includes("serviceRole") && !proxySource.includes("SERVICE_ROLE"), "Proxy referencia service role.");
for (const publicRoute of ["/recuperar-senha", "/atualizar-senha", "/confirmar-email", "/auth/callback"]) {
  assert(proxySource.includes(`"${publicRoute}"`), `${publicRoute} nao foi declarada publica.`);
}

const callbackSource = read("app/auth/callback/route.js");
assert(callbackSource.includes("exchangeCodeForSession"), "Callback PKCE não troca código por sessão.");
assert(callbackSource.includes("verifyOtp"), "Callback não suporta confirmação por token_hash.");
assert(callbackSource.includes("getSafeRedirectPath"), "Callback não valida destino.");

const clientSources = [
  authServiceSource,
  read("lib/supabase/client/browserClient.js"),
  ...fs.readdirSync(path.join(root, "components", "auth"))
    .filter((file) => file.endsWith(".js"))
    .map((file) => read(path.join("components", "auth", file))),
].join("\n");
assert(!clientSources.includes("SUPABASE_SERVICE_ROLE_KEY"), "SERVICE_ROLE presente em código cliente.");
assert(!clientSources.includes("adminClient"), "Admin Client importado por código cliente.");
assert(!clientSources.includes("serverClient"), "Server Client importado por código cliente.");

const sqlFiles = [];
function collectSql(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) collectSql(target);
    else if (entry.name.endsWith(".sql")) sqlFiles.push(target);
  }
}
collectSql(path.join(root, "supabase"));
const sqlSource = sqlFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n").toLowerCase();
for (const forbiddenTable of ["dividends"]) {
  assert(
    !new RegExp(`create\\s+table\\s+(?:public\\.)?${forbiddenTable}\\b`).test(sqlSource),
    `CORE-05 não pode criar tabela financeira: ${forbiddenTable}.`,
  );
}
assert(getRepositoryProvider() === "local", "Provider Local deixou de ser o provider ativo.");

if (process.argv.includes("--connectivity")) {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || "";
  assert(url && key, "Conectividade opcional exige URL e chave pública.");
  const response = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(7000),
  });
  assert(response.ok, `Health check Supabase Auth retornou ${response.status}.`);
}

console.log(
  "Auth validado: 7 rotas, contratos, erros, entradas, redirects, PKCE, separação client/server, "
  + "Provider Local, snapshots remotos e ausência de tabela independente de proventos.",
);
