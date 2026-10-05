import { loadVault } from "./loadVault.js";

function resolveRenderer(chamber) {
  if (chamber.id === "ella") {
    return "ella";
  }

  if (chamber.id === "dialogues") {
    return "dialogue";
  }

  return "garden";
}

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toWorldChamber(chamber) {
  return {
    id: toSlug(chamber.title || chamber.id),
    sourceId: chamber.id,
    name: chamber.title,
    description: chamber.description || "A Threshold chamber.",
    renderer: resolveRenderer(chamber),
    content: chamber.body || "",
    assets: chamber.assets || []
  };
}

export async function getVault() {
  return loadVault();
}

export async function getChambers() {
  const vault = await loadVault();
  return (vault.chambers || []).map(toWorldChamber);
}

export async function getChamber(id) {
  const chambers = await getChambers();
  const chamber = chambers.find((candidate) => candidate.id === id);

  return chamber || { error: "not-found" };
}
