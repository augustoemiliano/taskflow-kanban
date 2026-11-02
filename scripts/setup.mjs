// Prepara o projeto após `npm install` na raiz:
// 1) cria backend/.env e frontend/.env a partir dos .env.example (se não existirem)
// 2) instala as dependências do back-end e do front-end (npm ci quando há lockfile)
import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projects = ["backend", "frontend"];

for (const project of projects) {
  const example = join(root, project, ".env.example");
  const target = join(root, project, ".env");

  if (existsSync(example) && !existsSync(target)) {
    copyFileSync(example, target);
    console.log(`[setup] ${project}/.env criado a partir de .env.example`);
  }
}

if (process.env.SKIP_SUBPROJECT_INSTALL === "1") {
  process.exit(0);
}

for (const project of projects) {
  const cwd = join(root, project);
  const command = existsSync(join(cwd, "package-lock.json")) ? "ci" : "install";
  console.log(`[setup] npm ${command} em ${project}/ ...`);

  const args = [command, "--no-audit", "--no-fund"];
  // When invoked through npm, reuse the same npm CLI (avoids shell quirks on Windows).
  const npmCli = process.env.npm_execpath;
  const result = npmCli
    ? spawnSync(process.execPath, [npmCli, ...args], { cwd, stdio: "inherit" })
    : spawnSync("npm", args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

  if (result.status !== 0) {
    console.error(`[setup] falha ao instalar dependências de ${project}/`);
    process.exit(result.status ?? 1);
  }
}

console.log("[setup] pronto! Rode `npm run dev` para subir API + front.");
