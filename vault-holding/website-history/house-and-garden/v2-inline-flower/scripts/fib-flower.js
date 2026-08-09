(function () {
  const root = document.getElementById("fibFlowerRoot");
  const svg = document.getElementById("fibFlowerSvg");
  const summary = document.getElementById("fibFlowerSummary");
  const nodeTitle = document.getElementById("fibFlowerNodeTitle");
  const nodeMeta = document.getElementById("fibFlowerNodeMeta");
  const nodeLore = document.getElementById("fibFlowerNodeLore");

  if (!root || !svg || !summary || !nodeTitle || !nodeMeta || !nodeLore) {
    return;
  }

  const centerX = 480;
  const centerY = 320;
  const baseRadius = 182;
  const petalCount = 8;

  const core = {
    id: "threshold-core",
    label: "Threshold",
    kind: "root",
    excerpt: "Root Machine: Fib Flower geometry loaded from vault manifests.",
    sourcePath: "data/vault-archive.json"
  };

  const fallbackNodes = [
    { id: "fib", label: "Fib Flower", kind: "geometry", excerpt: "Geometry root for branches." },
    { id: "drift", label: "Drift", kind: "motion", excerpt: "Movement and state transitions." },
    { id: "collapse", label: "Collapse", kind: "failure", excerpt: "Necessary failure mode." },
    { id: "anchor", label: "Anchor", kind: "stability", excerpt: "Stability under pressure." },
    { id: "pressure", label: "Pressure", kind: "tension", excerpt: "Load gradients across the field." },
    { id: "resonance", label: "Resonance", kind: "feedback", excerpt: "Feedback and coherence tuning." },
    { id: "orbit", label: "Orbit", kind: "path", excerpt: "Path routing around chambers." },
    { id: "capture", label: "Capture", kind: "event", excerpt: "Event lock and commitment." }
  ];

  function truncate(text, maxLen) {
    const value = typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
    if (!value) {
      return "No vault excerpt available.";
    }
    return value.length > maxLen ? value.slice(0, maxLen - 3) + "..." : value;
  }

  function deriveArchiveNodes(archive) {
    if (!archive || typeof archive !== "object") {
      return [];
    }

    const species = archive.species || {};
    const weather = archive.weather || {};
    const chambers = archive.chambers || {};
    const actors = archive.actors || {};
    const weatherFog = resolveChannelNote(weather.fog);
    const weatherCollapse = resolveChannelNote(weather.collapse);
    const chamberSoil = resolveChannelNote(chambers.soil);
    const chamberFog = resolveChannelNote(chambers.fog);
    const actorExpand = resolveChannelNote(actors.expand);
    const actorCollapse = resolveChannelNote(actors.collapse);

    return [
      {
        id: "fib",
        label: "Fib Flower",
        kind: "geometry",
        excerpt: species.expand && species.expand.note ? species.expand.note.excerpt : "Fib geometry seeded by canopy species forms.",
        sourcePath: species.expand && species.expand.note ? species.expand.note.relativePath : "data/vault-archive.json"
      },
      {
        id: "drift",
        label: "Drift",
        kind: "motion",
        excerpt: weatherFog ? weatherFog.excerpt : "Drift weather not yet mapped.",
        sourcePath: weatherFog ? weatherFog.relativePath : "data/vault-archive.json"
      },
      {
        id: "collapse",
        label: "Collapse",
        kind: "failure",
        excerpt: weatherCollapse ? weatherCollapse.excerpt : "Collapse weather not yet mapped.",
        sourcePath: weatherCollapse ? weatherCollapse.relativePath : "data/vault-archive.json"
      },
      {
        id: "anchor",
        label: "Anchor",
        kind: "stability",
        excerpt: chamberSoil ? chamberSoil.excerpt : "Anchor chamber not yet mapped.",
        sourcePath: chamberSoil ? chamberSoil.relativePath : "data/vault-archive.json"
      },
      {
        id: "pressure",
        label: "Pressure",
        kind: "tension",
        excerpt: weatherCollapse ? weatherCollapse.excerpt : "Pressure weather not yet mapped.",
        sourcePath: weatherCollapse ? weatherCollapse.relativePath : "data/vault-archive.json"
      },
      {
        id: "resonance",
        label: "Resonance",
        kind: "feedback",
        excerpt: chamberFog ? chamberFog.excerpt : "Resonance chamber not yet mapped.",
        sourcePath: chamberFog ? chamberFog.relativePath : "data/vault-archive.json"
      },
      {
        id: "orbit",
        label: "Orbit",
        kind: "path",
        excerpt: actorExpand ? actorExpand.excerpt : "Orbit actor route not yet mapped.",
        sourcePath: actorExpand ? actorExpand.relativePath : "data/vault-archive.json"
      },
      {
        id: "capture",
        label: "Capture",
        kind: "event",
        excerpt: actorCollapse ? actorCollapse.excerpt : "Capture actor event not yet mapped.",
        sourcePath: actorCollapse ? actorCollapse.relativePath : "data/vault-archive.json"
      }
    ];
  }

  function resolveChannelNote(channelEntry) {
    if (!channelEntry) {
      return null;
    }

    if (Array.isArray(channelEntry.notePool) && channelEntry.notePool.length > 0) {
      return channelEntry.notePool[0];
    }

    if (channelEntry.note) {
      return channelEntry.note;
    }

    return channelEntry;
  }

  function deriveIndexWeight(indexPayload) {
    if (!indexPayload || !indexPayload.categories || typeof indexPayload.categories !== "object") {
      return 0;
    }

    return Object.keys(indexPayload.categories).reduce(function (acc, key) {
      const list = indexPayload.categories[key];
      return acc + (Array.isArray(list) ? list.length : 0);
    }, 0);
  }

  function createSvgEl(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs).forEach(function (key) {
      el.setAttribute(key, String(attrs[key]));
    });
    return el;
  }

  function spawnOrbitShapes(nodeName, cx, cy, color) {
    const orbitShapes = [];
    for (let i = 0; i < 4; i += 1) {
      const shape = createSvgEl("text", {
        x: cx.toFixed(2),
        y: cy.toFixed(2),
        class: "node-orbit-shape",
        "data-node": nodeName
      });
      shape.textContent = "○";
      shape.style.color = color || "#d8d8d8";
      shape.style.setProperty("--orbit-delay", (i * 0.3).toFixed(2) + "s");
      shape.style.setProperty("--orbit-radius", (34 + (i * 3)).toFixed(1) + "px");
      shape.style.setProperty("--orbit-cx", cx.toFixed(2) + "px");
      shape.style.setProperty("--orbit-cy", cy.toFixed(2) + "px");
      orbitShapes.push(shape);
    }
    return orbitShapes;
  }

  function updateInspector(node) {
    nodeTitle.textContent = node.label;
    nodeMeta.textContent = "Role: " + node.kind + " | Source: " + (node.sourcePath || "vault");
    nodeLore.textContent = truncate(node.excerpt, 280);
  }

  function emitGeometrySignal(nodes, vaultWeight) {
    const detail = {
      machine: "fib-flower",
      nodeCount: nodes.length + 1,
      vaultWeight: vaultWeight,
      updatedAt: Date.now()
    };

    window.dispatchEvent(new CustomEvent("threshold:fibflower-update", { detail: detail }));
  }

  function render(nodes, vaultWeight) {
    svg.innerHTML = "";

    const rings = [0.46, 0.62, 0.78];
    rings.forEach(function (ratio, idx) {
      svg.appendChild(createSvgEl("circle", {
        cx: centerX,
        cy: centerY,
        r: (baseRadius * (1 + ratio)).toFixed(2),
        class: "fib-orbit fib-orbit-" + (idx + 1)
      }));
    });

    const coreEl = createSvgEl("circle", {
      cx: centerX,
      cy: centerY,
      r: 38,
      id: "threshold",
      class: "fib-node fib-core node",
      tabindex: 0,
      "data-id": "threshold",
      "data-node": "threshold"
    });

    const coreText = createSvgEl("text", {
      x: centerX,
      y: centerY + 5,
      class: "fib-label fib-label-core node-label",
      "data-id": "threshold",
      "data-node": "threshold"
    });
    coreText.textContent = "Threshold";

    svg.appendChild(coreEl);
    svg.appendChild(coreText);
    spawnOrbitShapes("threshold", centerX, centerY, "#d8d8d8").forEach(function (shape) {
      svg.appendChild(shape);
    });

    nodes.slice(0, petalCount).forEach(function (node, index) {
      const angle = (-Math.PI / 2) + (index * (Math.PI * 2 / petalCount));
      const radius = baseRadius + ((index % 2 === 0 ? 1 : -1) * 24);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const edge = createSvgEl("line", {
        x1: centerX,
        y1: centerY,
        x2: x,
        y2: y,
        class: "fib-edge"
      });

      const petal = createSvgEl("circle", {
        id: node.id,
        cx: x.toFixed(2),
        cy: y.toFixed(2),
        r: 26,
        class: "fib-node fib-petal node",
        tabindex: 0,
        "data-id": node.id,
        "data-node": node.id
      });

      const label = createSvgEl("text", {
        x: x.toFixed(2),
        y: (y + 48).toFixed(2),
        class: "fib-label node-label",
        "data-id": node.id,
        "data-node": node.id
      });
      label.textContent = node.label;

      const nodeColor = getComputedStyle(document.documentElement).getPropertyValue("--node-" + node.id).trim();

      function focusNode() {
        updateInspector(node);
      }

      petal.addEventListener("mouseenter", focusNode);
      petal.addEventListener("focus", focusNode);
      petal.addEventListener("click", function () {
        focusNode();
        window.dispatchEvent(new CustomEvent("threshold:capture", {
          detail: {
            source: "fib-flower",
            node: node.id,
            label: node.label,
            kind: node.kind
          }
        }));
      });

      svg.appendChild(edge);
      svg.appendChild(petal);
      svg.appendChild(label);
      spawnOrbitShapes(node.id, x, y, nodeColor).forEach(function (shape) {
        svg.appendChild(shape);
      });
    });

    updateInspector(core);
    summary.textContent = "Vault-linked geometry online. " + (nodes.length + 1) + " nodes | Index weight " + vaultWeight + ".";
    emitGeometrySignal(nodes, vaultWeight);
  }

  function mountFromVault() {
    Promise.all([
      fetch("data/vault-archive.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch("data/vault-index.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (results) {
      const archivePayload = results[0];
      const indexPayload = results[1];
      const archive = archivePayload && archivePayload.archive ? archivePayload.archive : null;
      const derived = deriveArchiveNodes(archive);
      const nodes = derived.length > 0 ? derived : fallbackNodes;
      const vaultWeight = deriveIndexWeight(indexPayload);
      render(nodes, vaultWeight);
    }).catch(function () {
      render(fallbackNodes, 0);
      summary.textContent = "Vault manifests unavailable. Running fallback geometry.";
    });
  }

  mountFromVault();
})();
