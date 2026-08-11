import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const outputDirectory = resolve("website");
const requiredFiles = ["index.html"];

await Promise.all(
  requiredFiles.map((file) => access(resolve(outputDirectory, file), constants.R_OK)),
);

const entries = await readdir(outputDirectory);
if (entries.length === 0) {
  throw new Error("Cloudflare Pages output directory is empty");
}

console.log(`Cloudflare Pages static output ready: ${outputDirectory}`);