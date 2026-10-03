const GLYPH_PATHS = ["glyph_collapse", "glyph_expand", "glyph_fog", "glyph_soil"];

export async function validateMazeDepth(engine = window.threshold) {
  if (!engine) {
    throw new Error("Threshold engine is unavailable");
  }
  await engine.boot();
  const initialDepth = engine.getMazeDepth();
  const incrementedDepth = engine.incrementMazeDepth();
  const resetDepth = engine.resetMazeDepth();
  engine.setMazeDepth(initialDepth);
  const glyphPaths = GLYPH_PATHS.map((id) => ({ id, available: Boolean(engine.getNode(id)) }));
  const report = {
    initialDepth,
    incremented: incrementedDepth === initialDepth + 1,
    reset: resetDepth === 0,
    restoredDepth: engine.getMazeDepth(),
    navigationReady: typeof engine.navigateTo === "function",
    glyphPaths,
    valid: incrementedDepth === initialDepth + 1
      && resetDepth === 0
      && engine.getMazeDepth() === initialDepth
      && glyphPaths.every((path) => path.available)
  };
  console.group("Threshold Maze Depth Validator");
  console.log(report);
  console.groupEnd();
  return report;
}

if (typeof window !== "undefined") {
  window.validateMazeDepth = validateMazeDepth;
}