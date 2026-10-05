import chambers from "./chambers.index.json";

const chamberFiles = {
  "house-and-garden.md": () => import("./house-and-garden.md?raw"),
  "ella.md": () => import("./ella.md?raw"),
  "dialogues.md": () => import("./dialogues.md?raw")
};

export async function loadChamber(id) {
  const chamber = chambers.find((candidate) => candidate.id === id);
  if (!chamber) {
    return { error: "not-found" };
  }

  const loadFile = chamberFiles[chamber.file];
  if (!loadFile) {
    return {
      error: "load-failed",
      detail: `No content loader is registered for ${chamber.file}.`
    };
  }

  try {
    const file = await loadFile();
    return {
      ...chamber,
      content: file.default
    };
  } catch (error) {
    return {
      error: "load-failed",
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}
