import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const outputDirectory = resolve("website");
const requiredFiles = ["index.html"];
const config = JSON.parse(await readFile(resolve("threshold.config.json"), "utf8"));
const vaultData = JSON.parse(
  await readFile(resolve(outputDirectory, "data", "threshold-vault.json"), "utf8"),
);

if (vaultData.vaultRoot !== config.vaultRoot) {
  throw new Error(`Website vault source drifted: ${vaultData.vaultRoot}`);
}

await Promise.all(
  requiredFiles.map((file) => access(resolve(outputDirectory, file), constants.R_OK)),
);

const entries = await readdir(outputDirectory);
if (entries.length === 0) {
  throw new Error("Cloudflare Pages output directory is empty");
}

console.log(`Cloudflare Pages static output ready: ${outputDirectory}`);
console.log(`Canonical vault data ready: ${vaultData.vaultRoot}`);