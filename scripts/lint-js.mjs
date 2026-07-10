import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ignored = new Set([".git", ".next", ".npm-cache", "node_modules"]);

function collect(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (ignored.has(name)) return [];
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return collect(path);
    return name.endsWith(".js") || name.endsWith(".mjs") ? [path] : [];
  });
}

const files = collect(process.cwd());
const failed = files.filter((file) => spawnSync(process.execPath, ["--check", file], { stdio: "inherit" }).status !== 0);

if (failed.length) {
  console.error(`\n${failed.length} arquivo(s) com erro de sintaxe.`);
  process.exit(1);
}

console.log(`${files.length} arquivo(s) JavaScript verificados.`);
