const UNIT_VALUES = Array.from({ length: 11 }, (_, index) => (index / 10).toFixed(1));
const PAGE_ACTIONS = ["enter", "physics_change", "weather_change", "character_enter", "character_exit"];

function createOptions(values, selected) {
  return values.map((value) => `<option value="${value}"${String(value) === String(selected) ? " selected" : ""}>${value}</option>`).join("");
}

function numericValue(value) {
  return Number.isFinite(Number(value)) ? String(value) : "0";
}

function nodeMarkup(nodes) {
  return nodes.map((node) => `<option value="${node.id}">${node.id} (${node.type})</option>`).join("");
}

function configuredNodeIds(root) {
  return (root.dataset.nodeEditorIds || "").split(",").map((id) => id.trim()).filter(Boolean);
}

function renderEditor(root, node, nodes) {
  const weather = typeof node.weather === "object" ? node.weather : {};
  const physics = node.physics || {};
  root.innerHTML = [
    '<div class="node-editor-heading"><div><p class="node-editor-kicker">Live node state</p><h2>Node Console</h2></div><output data-node-status>Ready</output></div>',
    '<label>Node<select data-node-id>', nodeMarkup(nodes), '</select></label>',
    '<div class="node-editor-grid">',
    `<label>Humidity<select data-weather="humidity">${createOptions(UNIT_VALUES, weather.humidity)}</select></label>`,
    `<label>Pollen pulse<select data-weather="pollen_pulse">${createOptions(UNIT_VALUES, weather.pollen_pulse)}</select></label>`,
    `<label>Temperature<input data-weather="temperature" type="number" value="${numericValue(weather.temperature)}"></label>`,
    `<label>Resonance factor<select data-weather="resonance_factor">${createOptions(UNIT_VALUES, weather.resonance_factor)}</select></label>`,
    `<label>Pressure<select data-physics="pressure">${createOptions([0, 1, 2, 3, 4, 5], numericValue(physics.pressure))}</select></label>`,
    `<label>Drift<select data-physics="drift">${createOptions([-2, -1, 0, 1, 2], numericValue(physics.drift))}</select></label>`,
    `<label>Collapse<select data-physics="collapse">${createOptions(["false", "true"], String(Boolean(physics.collapse)))}</select></label>`,
    `<label>Resonance<select data-physics="resonance">${createOptions(UNIT_VALUES, numericValue(physics.resonance))}</select></label>`,
    `<label>Anchor<select data-physics="anchor">${createOptions(["false", "true"], String(Boolean(physics.anchor)))}</select></label>`,
    '</div>',
    `<label>Connections<select data-connections multiple size="5">${nodes.filter((candidate) => candidate.id !== node.id).map((candidate) => `<option value="${candidate.id}"${node.connections.includes(candidate.id) ? " selected" : ""}>${candidate.id}</option>`).join("")}</select></label>`,
    `<label>Page activation<select data-page-action>${createOptions(PAGE_ACTIONS, "enter")}</select></label>`,
    '<button type="button" data-apply-node>Apply node state</button>'
  ].join("");
  root.querySelector("[data-node-id]").value = node.id;
}

function fieldValues(root, selector, booleanFields) {
  return Array.from(root.querySelectorAll(selector)).reduce((values, field) => {
    const key = field.dataset.weather || field.dataset.physics;
    values[key] = booleanFields.has(key) ? field.value === "true" : Number(field.value);
    return values;
  }, {});
}

async function initialize() {
  const engine = window.threshold;
  if (!engine) {
    return;
  }
  await engine.boot();
  const nodes = engine.nodeRegistry.list();
  const roots = Array.from(document.querySelectorAll("#node-editor, [data-node-editor-ids]"));
  if (roots.length === 0 || nodes.length === 0) {
    return;
  }

  roots.forEach((root) => {
    const allowedIds = configuredNodeIds(root);
    const editorNodes = allowedIds.length
      ? nodes.filter((node) => allowedIds.includes(node.id))
      : nodes;
    if (editorNodes.length === 0) {
      return;
    }
    const showNode = (id) => renderEditor(root, engine.getNode(id) || editorNodes[0], editorNodes);
    showNode(editorNodes[0].id);

    root.addEventListener("change", (event) => {
      if (event.target.matches("[data-node-id]")) {
        showNode(event.target.value);
      }
    });
    root.addEventListener("click", (event) => {
      if (!event.target.matches("[data-apply-node]")) {
        return;
      }
      const id = root.querySelector("[data-node-id]").value;
      const node = engine.updateNode(id, {
        weather: fieldValues(root, "[data-weather]", new Set()),
        physics: fieldValues(root, "[data-physics]", new Set(["collapse", "anchor"])),
        connections: Array.from(root.querySelector("[data-connections]").selectedOptions, (option) => option.value)
      });
      if (!node) {
        return;
      }
      const action = root.querySelector("[data-page-action]").value;
      const activation = action === "enter"
        ? engine.navigateTo(node.id, { reveal: true })
        : engine.activateNode(node, { reveal: false });
      root.querySelector("[data-node-status]").textContent = activation ? `Applied ${action}` : "No activation";
    });
  });
}

initialize().catch(() => {});