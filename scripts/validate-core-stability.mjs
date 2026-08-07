import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const shell=read("components/layout/AppShell.js");
const assetDetailsRoute=read("app/carteira/[ticker]/page.js");
for(const route of ["/ia","/imposto-de-renda","/simulacoes","/relatorios"]){assert(!shell.includes(`href: "${route}"`),`Placeholder exposto: ${route}`);}
for(const route of ["/dashboard","/carteira","/operacoes","/proventos","/mercado","/configuracoes","/conta"]){assert(shell.includes(`href: "${route}"`),`Rota Core ausente: ${route}`);}
assert(assetDetailsRoute.includes("await params"),"Detalhe do ativo nao aguarda os parametros assincronos do App Router.");
const protocol=read("docs/CORE_30_DAY_VALIDATION.md");
for(const field of ["Dashboard","Operações","Proventos","Cotações","Usou concorrente?","Tempo para resolver"]){assert(protocol.includes(field),`Campo diário ausente: ${field}`);}
assert(read("docs/CORE_STABILITY.md").includes("Erros nunca devem ser convertidos em carteira vazia"),"Regra de erro ausente.");
console.log("Estabilidade validada: navegação Core, recuperação e protocolo dos 30 dias.");
