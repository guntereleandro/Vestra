import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const proxy = read("proxy.js");
for (const route of ["/mercado", "/api/market", "/auth/callback"]) assert(proxy.includes(route), `Rota publica ausente: ${route}.`);
for (const behavior of ["loginRedirect(request)", 'new URL("/onboarding"', 'new URL("/dashboard"']) assert(proxy.includes(behavior), `Comportamento do proxy ausente: ${behavior}.`);
assert(proxy.includes("portfolio_members"), "Proxy nao verifica primeiro acesso por membership.");
assert(read("lib/services/accountCoreService.js").includes("completeRemoteOnboarding"), "Servico de onboarding ausente.");
assert(read("lib/auth/authRedirects.js").includes('DEFAULT_AUTH_REDIRECT = "/dashboard"'), "Redirect autenticado nao aponta para Dashboard.");
assert(read("components/auth/SignOutButton.js").includes('router.replace("/")'), "Logout nao retorna a Landing.");

const landing = read("components/landing/LandingPage.js");
for (const section of ["Como funciona", "Segurança", "Perguntas frequentes", "/cadastrar", "/mercado"]) assert(landing.includes(section), `Landing incompleta: ${section}.`);
assert(!/\bIA\b/.test(landing), "Landing anuncia IA.");

for (const file of ["app/robots.js", "app/sitemap.js", "public/icon.svg", "app/onboarding/page.js", "app/dashboard/page.js"]) {
  assert(fs.existsSync(path.join(root, file)), `Arquivo CORE-09 ausente: ${file}.`);
}
const rootPage = read("app/page.js");
for (const metadata of ["alternates", "openGraph", "twitter"]) assert(rootPage.includes(metadata), `SEO da Landing sem ${metadata}.`);
console.log("Arquitetura publica/privada validada: Landing, Mercado, proxy, onboarding, redirects e SEO.");
