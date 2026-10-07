import { access, copyFile, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const outputDirectory = resolve("website");
const workerSource = resolve("worker.js");
const workerOutput = resolve(outputDirectory, "_worker.js");
const requiredFiles = ["index.html", "_worker.js"];
const staticOnly = process.argv.includes("--static");
const vaultData = JSON.parse(
  await readFile(resolve(outputDirectory, "data", "threshold-vault.json"), "utf8"),
);

await copyFile(workerSource, workerOutput);

await Promise.all(
  requiredFiles.map((file) => access(resolve(outputDirectory, file), constants.R_OK)),
);

const entries = await readdir(outputDirectory);
if (entries.length === 0) {
  throw new Error("Cloudflare Pages output directory is empty");
}

console.log(`Cloudflare Pages static output ready: ${outputDirectory}`);
console.log(`Cloudflare Pages advanced-mode Worker ready: ${workerOutput}`);
console.log(staticOnly
  ? "Committed public data accepted for CI; canonical vault generation was not run."
  : `Canonical vault data ready for ${vaultData.authorship} authorship.`);