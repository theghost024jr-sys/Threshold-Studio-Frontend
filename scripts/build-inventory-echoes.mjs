import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { PAGE_ECHOES } from "../website/config/page-echoes.js";

const repositoryRoot = resolve(".");

function validateInventoryPath(sourceRoot, value) {
  if (typeof value !== "string" || !value || value.includes("\\")) {
    throw new Error(`Invalid inventory echo source path: ${value}`);
  }
  const normalized = value.split("/").join(sep);
  const absolute = resolve(sourceRoot, normalized);
  const relativePath = relative(sourceRoot, absolute);
  if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === "..") {
    throw new Error(`Inventory echo source escapes the current website snapshot: ${value}`);
  }
  return { absolute, relativePath };
}

export function addInventoryBase(html, sourcePath) {
  if (typeof sourcePath !== "string" || sourcePath.includes("\\")
    || sourcePath.split("/").some((segment) => segment === ".." || segment === ".")) {
    throw new Error(`Invalid inventory echo source path: ${sourcePath}`);
  }
  const directory = sourcePath.split("/").slice(0, -1).join("/");
  const baseHref = directory ? `/${directory}/` : "/";
  const headTag = html.match(/<head\b[^>]*>/i);

  if (!headTag) {
    throw new Error(`Inventory page ${sourcePath} is missing a head element`);
  }
  if (/<base\b/i.test(html)) {
    throw new Error(`Inventory page ${sourcePath} already declares a base element`);
  }

  return html.replace(headTag[0], `${headTag[0]}\n  <base href="${baseHref}">`);
}

export function rewriteInventoryLinks(html, sourcePath) {
  let output = html;
  if (["contact.html", "housegarden.html", "mythology.html"].includes(sourcePath)) {
    // The selected snapshot has no ledger page; route stale links to the live Portal.
    output = output.replace(/(\bhref\s*=\s*)(["'])ledger\.html\2/gi, "$1$2/portal/$2");
  }
  if (["housegarden.html", "mythology.html"].includes(sourcePath)) {
    output = output.replace(
      /(\bhref\s*=\s*)(["'])chamber-palette-map\.html\2/gi,
      "$1$2/world-map.html$2"
    );
  }
  return output;
}

export async function buildInventoryEchoes(root = repositoryRoot) {
  const sourceRoot = resolve(root, "html-inventory", "website");
  const destinationRoot = resolve(root, "website", "echoes", "inventory");
  const inventoryEchoes = PAGE_ECHOES.filter((echo) => echo.inventorySource);
  const prepared = [];

  for (const echo of inventoryEchoes) {
    const source = validateInventoryPath(sourceRoot, echo.inventorySource);
    if (echo.href !== `/echoes/inventory/${echo.inventorySource}`) {
      throw new Error(`Inventory echo route does not match its source: ${echo.href}`);
    }
    const relativeSource = source.relativePath.split(sep).join("/");
    const destination = resolve(destinationRoot, source.relativePath);
    const destinationRelative = relative(destinationRoot, destination);
    if (!destinationRelative || destinationRelative.startsWith(`..${sep}`) || destinationRelative === "..") {
      throw new Error(`Inventory echo output escapes its dedicated directory: ${echo.href}`);
    }

    const html = await readFile(resolve(sourceRoot, relativeSource), "utf8");
    const output = addInventoryBase(rewriteInventoryLinks(html, relativeSource), relativeSource);
    prepared.push({ destination, output });
  }

  await rm(destinationRoot, { recursive: true, force: true });
  for (const { destination, output } of prepared) {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, output, "utf8");
  }

  return inventoryEchoes.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const count = await buildInventoryEchoes();
  console.log(`Promoted ${count} current inventory page echo(s).`);
}
