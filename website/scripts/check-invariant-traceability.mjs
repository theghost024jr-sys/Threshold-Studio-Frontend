import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateTraceabilityRegistry } from "./validate-invariant-traceability.mjs";

const defaultRegistryPath = fileURLToPath(
  new URL("../config/invariant-traceability.json", import.meta.url)
);
const registryPath = resolve(process.cwd(), process.argv[2] || defaultRegistryPath);

try {
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  validateTraceabilityRegistry(registry);
  console.log(`Traceability registry is valid: ${registryPath}`);
} catch (error) {
  console.error(`Traceability registry validation failed: ${error.message}`);
  process.exitCode = 1;
}
