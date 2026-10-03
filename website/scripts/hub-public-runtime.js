function displayName(nodeId) {
  return String(nodeId || "housegarden").replace(/^glyph_/, "Glyph: ").replace(/_/g, " ");
}

async function initialize() {
  const engine = window.threshold;
  const nodeIndicator = document.getElementById("hub-engine-node");
  const depthIndicator = document.getElementById("hub-maze-depth");
  const enterButton = document.getElementById("hub-enter-engine");
  if (!engine || !nodeIndicator || !depthIndicator || !enterButton) {
    return;
  }
  await engine.boot();
  const render = () => {
    nodeIndicator.textContent = `Position: ${displayName(engine.getCurrentNodeId())}`;
    depthIndicator.textContent = `Maze depth: ${engine.getMazeDepth()}`;
  };
  render();
  window.addEventListener("threshold:current-node-changed", render);
  window.addEventListener("threshold:maze-depth-changed", render);
  enterButton.addEventListener("click", () => engine.navigateTo("housegarden", { reveal: true }));
}

initialize().catch(() => {});