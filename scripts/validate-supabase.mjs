import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function collectJavaScript(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) return collectJavaScript(path.relative(root, child));
    return /\.(?:js|mjs)$/.test(entry.name) ? [child] : [];
  });
}

const packageJson = JSON.parse(read("package.json"));
assert(packageJson.dependencies?.["@supabase/supabase-js"], "@supabase/supabase-js não instalado.");
assert(packageJson.dependencies?.["@supabase/ssr"], "@supabase/ssr não instalado.");

const {
  createBrowserSupabaseClient,
  SUPABASE_BROWSER_CONFIG_ERROR_CODE,
} = await import("../lib/supabase/client/browserClient.js");

const browserClient = createBrowserSupabaseClient({
  url: "https://validation.supabase.co",
  publishableKey: "validation-publishable-key",
});
assert(browserClient?.supabaseUrl === "https://validation.supabase.co", "Browser Client não foi criado.");

try {
  createBrowserSupabaseClient();
  throw new Error("Browser Client aceitou configuração ausente.");
} catch (error) {
  assert(error.code === SUPABASE_BROWSER_CONFIG_ERROR_CODE, "Erro inesperado para configuração pública ausente.");
}

const serverClientUrl = pathToFileURL(path.join(root, "lib", "supabase", "client", "serverClient.js")).href;
const adminClientUrl = pathToFileURL(path.join(root, "lib", "supabase", "client", "adminClient.js")).href;
const configUrl = pathToFileURL(path.join(root, "lib", "supabase", "config", "supabaseConfig.js")).href;
const nextHeadersUrl = pathToFileURL(path.join(root, "node_modules", "next", "headers.js")).href;
const serverProbe = `
  const { registerHooks } = await import("node:module");
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "server-only") {
        return { url: "data:text/javascript,export default {}", shortCircuit: true };
      }
      if (specifier === "next/headers") {
        return { url: ${JSON.stringify(nextHeadersUrl)}, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    }
  });
  const cookieStore = { getAll() { return []; }, set() {} };
  const config = {
    url: "https://validation.supabase.co",
    publishableKey: "validation-publishable-key",
    secretKey: "validation-secret-key"
  };
  const { createServerSupabaseClient } = await import(${JSON.stringify(serverClientUrl)});
  const { createAdminSupabaseClient } = await import(${JSON.stringify(adminClientUrl)});
  const {
    getSupabaseConfigDiagnostics,
    requireSupabaseConfig,
    SUPABASE_CONFIG_ERROR_CODE
  } = await import(${JSON.stringify(configUrl)});
  const serverClient = await createServerSupabaseClient({ config, cookieStore });
  const adminClient = createAdminSupabaseClient({ config });
  if (!serverClient || !adminClient) throw new Error("Clientes server/admin não foram criados.");
  const diagnostics = getSupabaseConfigDiagnostics({ url: "", publishableKey: "", secretKey: "" });
  if (diagnostics.serverReady || diagnostics.adminReady) throw new Error("Ambiente vazio foi marcado como pronto.");
  try {
    requireSupabaseConfig({ config: {} });
    throw new Error("Configuração ausente não foi rejeitada.");
  } catch (error) {
    if (error.code !== SUPABASE_CONFIG_ERROR_CODE) throw error;
  }
`;

const probeEnvironment = { ...process.env };
delete probeEnvironment.SUPABASE_URL;
delete probeEnvironment.SUPABASE_ANON_KEY;
delete probeEnvironment.SUPABASE_SERVICE_ROLE_KEY;
delete probeEnvironment.SUPABASE_SECRET_KEY;
delete probeEnvironment.NEXT_PUBLIC_SUPABASE_URL;
delete probeEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
delete probeEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serverProbeResult = spawnSync(
  process.execPath,
  ["--conditions=react-server", "--input-type=module", "--eval", serverProbe],
  { cwd: root, env: probeEnvironment, encoding: "utf8" },
);
assert(
  serverProbeResult.status === 0,
  `Clientes server/admin inválidos: ${serverProbeResult.stderr || serverProbeResult.stdout}`,
);

const [
  { repositoryContracts, validateRepositoryContract },
  {
    getRepositories,
    getRepositoryProvider,
    setRepositoryProvider,
  },
  { REPOSITORY_PROVIDER },
  { SUPABASE_NOT_IMPLEMENTED },
] = await Promise.all([
  import("../lib/repositories/contracts/index.js"),
  import("../lib/repositories/repositoryRegistry.js"),
  import("../lib/repositories/repositoryTypes.js"),
  import("../lib/repositories/supabase/createSupabaseRepositoryStub.js"),
]);

assert(getRepositoryProvider() === REPOSITORY_PROVIDER.LOCAL, "Provider Local não é o provider inicial.");
setRepositoryProvider(REPOSITORY_PROVIDER.SUPABASE);
const supabaseRepositories = getRepositories();
for (const name of Object.keys(repositoryContracts)) {
  const validation = validateRepositoryContract(name, supabaseRepositories[name]);
  assert(validation.valid, `${name}: adapter Supabase não respeita o contrato.`);
}
try {
  await supabaseRepositories.profiles.getCurrent();
  throw new Error("Stub Supabase não lançou erro explícito.");
} catch (error) {
  assert(error.code === SUPABASE_NOT_IMPLEMENTED, "Stub Supabase não retornou NOT_IMPLEMENTED.");
} finally {
  setRepositoryProvider(REPOSITORY_PROVIDER.LOCAL);
}
assert(getRepositoryProvider() === REPOSITORY_PROVIDER.LOCAL, "Provider Local não foi restaurado.");

const browserSource = read("lib/supabase/client/browserClient.js");
assert(!browserSource.includes("process.env"), "Browser Client lê ambiente diretamente.");
assert(!browserSource.includes("SERVICE_ROLE"), "Browser Client referencia SERVICE_ROLE.");

const environmentReaders = [
  ...collectJavaScript("app"),
  ...collectJavaScript("components"),
  ...collectJavaScript("hooks"),
  ...collectJavaScript("lib"),
].filter((file) => /process\.env\.(?:NEXT_PUBLIC_)?SUPABASE_/.test(
  read(path.relative(root, file)),
));
assert(
  environmentReaders.every((file) => [
    "lib/config/envConfig.js",
    "lib/config/publicEnvConfig.js",
  ].includes(path.relative(root, file).replaceAll("\\", "/"))),
  `Leituras Supabase fora das configurações centrais: ${environmentReaders.map((file) => path.relative(root, file)).join(", ")}`,
);

const forbiddenClientImports = [
  "envConfig",
  "supabaseConfig",
  "adminClient",
  "serverClient",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const clientViolations = [
  ...collectJavaScript("app"),
  ...collectJavaScript("components"),
  ...collectJavaScript("hooks"),
  ...collectJavaScript("lib"),
].filter((file) => {
  const source = fs.readFileSync(file, "utf8");
  return /^\s*["']use client["'];/m.test(source)
    && forbiddenClientImports.some((token) => source.includes(token));
});
assert(
  clientViolations.length === 0,
  `Import privado em módulo Client: ${clientViolations.map((file) => path.relative(root, file)).join(", ")}`,
);

const infrastructureFiles = [
  ...collectJavaScript("lib/supabase"),
  ...collectJavaScript("lib/repositories/supabase"),
];
const loggingViolations = infrastructureFiles.filter((file) => /\bconsole\.(?:log|info|debug|warn|error)\s*\(/.test(fs.readFileSync(file, "utf8")));
assert(
  loggingViolations.length === 0,
  `Infraestrutura Supabase não deve registrar credenciais ou payloads: ${loggingViolations.join(", ")}`,
);

assert(fs.existsSync(path.join(root, "proxy.js")), "Proxy mínimo para futura autenticação ausente.");
assert(getRepositoryProvider() === REPOSITORY_PROVIDER.LOCAL, "Provider final deve permanecer Local.");

console.log(
  "Supabase validado: clientes browser/server/admin, configuração opcional, separação de segredos, "
  + "7 adapters stub, registry multi-provider e Provider Local ativo.",
);
