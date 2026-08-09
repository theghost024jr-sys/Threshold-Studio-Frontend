(function () {
  const chamberTargets = {
    dialogues: {
      containerId: "humanoid-dialogues-grid",
      title: "Voice Entities",
      mode: "dialogues"
    },
    ethos: {
      containerId: "humanoid-ethos-grid",
      title: "Archetypes",
      mode: "ethos"
    },
    invitation: {
      containerId: "humanoid-invitation-grid",
      title: "Guides",
      mode: "invitation"
    }
  };

  const state = {
    chamber: null,
    payload: null,
    visibleEntries: [],
    allEntries: [],
    activeIndex: -1,
    branchIndex: 0,
    shell: null,
    noteIndexByPath: new Map()
  };

  function activeChamber() {
    for (const key of Object.keys(chamberTargets)) {
      if (document.getElementById(chamberTargets[key].containerId)) {
        return key;
      }
    }
    return null;
  }

  function chamberLabel(chamber) {
    if (chamber === "dialogues") return "Voice Chamber";
    if (chamber === "ethos") return "Archetype Chamber";
    return "Threshold Chamber";
  }

  function randomSample(items, count) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = copy[i];
      copy[i] = copy[j];
      copy[j] = t;
    }
    return copy.slice(0, count);
  }

  function createViewer() {
    const shell = document.createElement("section");
    shell.id = "humanoid-viewer";
    shell.className = "humanoid-viewer is-hidden";
    shell.setAttribute("aria-hidden", "true");
    shell.innerHTML = [
      '<div class="humanoid-backdrop" data-close="true"></div>',
      '<article class="humanoid-panel" data-mode="dialogues">',
      '  <div class="humanoid-aura" aria-hidden="true"></div>',
      '  <div class="humanoid-top">',
      '    <h3 id="humanoid-viewer-title">Humanoid Viewer</h3>',
      '    <div class="humanoid-head-actions">',
      '      <button type="button" id="humanoid-prev" class="humanoid-branch-button">Prev</button>',
      '      <button type="button" id="humanoid-next" class="humanoid-branch-button">Next</button>',
      '      <button type="button" class="humanoid-close" data-close="true">Close</button>',
      '    </div>',
      '  </div>',
      '  <p id="humanoid-viewer-mode" class="humanoid-mode-line"></p>',
      '  <div class="humanoid-body">',
      '    <div class="humanoid-image-wrap">',
      '      <div class="humanoid-halo" id="humanoid-halo" aria-hidden="true">◌</div>',
      '      <img id="humanoid-viewer-image" alt="Humanoid preview">',
      '    </div>',
      '    <div class="humanoid-meta">',
      '      <p id="humanoid-role"></p>',
      '      <p id="humanoid-personality"></p>',
      '      <p id="humanoid-voice"></p>',
      '      <p id="humanoid-orientation"></p>',
      '      <p id="humanoid-concept"></p>',
      '      <p id="humanoid-vault-path"></p>',
      '      <p id="humanoid-note-excerpt" class="humanoid-note-excerpt">Loading vault note context...</p>',
      '      <p><a id="humanoid-note" class="humanoid-note" href="#" target="_blank" rel="noreferrer">Open Vault Note</a></p>',
      '      <div id="humanoid-dialogue" class="humanoid-dialogue-branch" hidden></div>',
      '      <div id="humanoid-dialogue-response" class="humanoid-dialogue-response" hidden></div>',
      '      <div id="humanoid-dialogue-tools" class="humanoid-dialogue-tools" hidden>',
      '        <button type="button" id="humanoid-branch-prev" class="humanoid-branch-button">Prev Branch</button>',
      '        <button type="button" id="humanoid-branch-next" class="humanoid-branch-button">Next Branch</button>',
      '        <input id="humanoid-whisper-input" type="text" placeholder="Whisper into the branch">',
      '        <button type="button" id="humanoid-whisper-send" class="humanoid-branch-button">Echo Return</button>',
      '      </div>',
      '      <div id="humanoid-invitation-links" class="humanoid-invitation-links" hidden>',
      '        <a href="dialogues.html">Dialogues</a>',
      '        <a href="ethos.html">Ethos</a>',
      '        <a href="mythology.html">Mythology</a>',
      '        <a href="chamber-palette-map.html">Chamber Map</a>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join("\n");

    document.body.appendChild(shell);
    return shell;
  }

  function buildRefreshControl(chamber, container) {
    if (!container || document.getElementById(`humanoid-refresh-${chamber}`)) {
      return;
    }

    const controlWrap = document.createElement("div");
    controlWrap.className = "humanoid-triad-refresh";
    const button = document.createElement("button");
    button.id = `humanoid-refresh-${chamber}`;
    button.type = "button";
    button.className = "humanoid-refresh-btn";
    button.textContent = "Refresh Entities";
    controlWrap.appendChild(button);
    container.insertAdjacentElement("beforebegin", controlWrap);

    button.addEventListener("click", function () {
      if (!state.allEntries.length) {
        return;
      }
      state.visibleEntries = randomSample(state.allEntries, Math.min(12, state.allEntries.length));
      renderCards();
      pulsePanel("refresh");
    });
  }

  function pulsePanel(reason) {
    const container = document.getElementById(chamberTargets[state.chamber].containerId);
    if (!container) {
      return;
    }
    container.classList.remove("is-pulsing");
    void container.offsetWidth;
    container.classList.add("is-pulsing");
    container.setAttribute("data-pulse-reason", reason || "interaction");
  }

  function renderCards() {
    const target = chamberTargets[state.chamber];
    const container = document.getElementById(target.containerId);
    if (!container) {
      return;
    }

    container.replaceChildren();

    if (!state.visibleEntries.length) {
      const p = document.createElement("p");
      p.textContent = "No humanoid entities detected for this chamber yet.";
      p.className = "vault-law-body";
      container.appendChild(p);
      return;
    }

    state.visibleEntries.forEach(function (entry, idx) {
      const card = document.createElement("article");
      card.className = "humanoid-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Open ${entry.name}`);
      card.setAttribute("data-mode", entry.chamber || state.chamber);

      const h3 = document.createElement("h3");
      h3.textContent = `${entry.glyph || "~"} ${entry.name}`;

      const p = document.createElement("p");
      p.textContent = `${chamberLabel(entry.chamber)} · ${entry.metadata && entry.metadata.role ? entry.metadata.role : "Humanoid"}`;

      const preview = document.createElement("div");
      preview.className = "humanoid-preview";
      if (entry.preview) {
        const img = document.createElement("img");
        img.src = entry.preview;
        img.alt = `${entry.name} preview`;
        preview.appendChild(img);
      } else {
        preview.textContent = "Preview missing";
      }

      card.appendChild(h3);
      card.appendChild(p);
      card.appendChild(preview);

      function openCard() {
        openViewerByIndex(idx);
      }

      card.addEventListener("click", openCard);
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCard();
        }
      });

      container.appendChild(card);
    });
  }

  function normalizePath(value) {
    return String(value || "").replace(/\\/g, "/").replace(/^\//, "");
  }

  function buildNoteIndexMap(payload) {
    const nodes = payload && Array.isArray(payload.nodes) ? payload.nodes : [];
    const map = new Map();
    nodes.forEach(function (node) {
      map.set(normalizePath(node.path || "").toLowerCase(), node);
    });
    state.noteIndexByPath = map;
  }

  function resolveNoteContext(entry) {
    const vaultRelative = entry && entry.note && entry.note.vaultRelative ? entry.note.vaultRelative : "";
    const key = normalizePath(vaultRelative).toLowerCase();
    if (!key || !state.noteIndexByPath.has(key)) {
      return null;
    }
    return state.noteIndexByPath.get(key);
  }

  function setNoteAnchor(noteEl, entry) {
    if (!noteEl) {
      return;
    }
    if (entry.note && entry.note.exists && entry.note.obsidianUrl) {
      noteEl.href = entry.note.obsidianUrl;
      noteEl.textContent = "Open Vault Note";
      noteEl.classList.remove("is-disabled");
      return;
    }
    noteEl.href = "#";
    noteEl.textContent = "Vault Note Missing";
    noteEl.classList.add("is-disabled");
  }

  function syncDialogueMode(entry) {
    const branch = document.getElementById("humanoid-dialogue");
    const response = document.getElementById("humanoid-dialogue-response");
    const tools = document.getElementById("humanoid-dialogue-tools");
    const whisperInput = document.getElementById("humanoid-whisper-input");
    const prevBtn = document.getElementById("humanoid-branch-prev");
    const nextBtn = document.getElementById("humanoid-branch-next");
    const sendBtn = document.getElementById("humanoid-whisper-send");

    const branches = entry && entry.metadata && Array.isArray(entry.metadata.dialogueBranches)
      ? entry.metadata.dialogueBranches
      : [];

    function renderBranch(prefix) {
      if (!branches.length) {
        branch.hidden = true;
        response.hidden = true;
        tools.hidden = true;
        return;
      }

      branch.hidden = false;
      response.hidden = false;
      tools.hidden = false;

      const active = branches[state.branchIndex % branches.length];
      branch.textContent = `${prefix || "Active"} branch ${state.branchIndex + 1}/${branches.length}: ${active}`;
      response.textContent = "Echo channel waiting for whisper input.";
    }

    state.branchIndex = 0;
    if (whisperInput) {
      whisperInput.value = "";
    }

    prevBtn.onclick = function () {
      state.branchIndex = (state.branchIndex - 1 + branches.length) % branches.length;
      renderBranch("Shifted");
      pulsePanel("branch-prev");
    };

    nextBtn.onclick = function () {
      state.branchIndex = (state.branchIndex + 1) % branches.length;
      renderBranch("Shifted");
      pulsePanel("branch-next");
    };

    sendBtn.onclick = function () {
      const whisper = whisperInput && whisperInput.value ? whisperInput.value.trim() : "";
      const branchName = branches[state.branchIndex % branches.length] || "Unknown";
      response.textContent = whisper
        ? `Echo return via ${branchName}: "${whisper}" was heard and linked to vault resonance.`
        : `Echo return via ${branchName}: no whisper provided.`;
      pulsePanel("echo-return");
    };

    renderBranch();
  }

  function setModeVisibility(mode) {
    const dialogue = document.getElementById("humanoid-dialogue");
    const response = document.getElementById("humanoid-dialogue-response");
    const dialogueTools = document.getElementById("humanoid-dialogue-tools");
    const invitationLinks = document.getElementById("humanoid-invitation-links");

    const isDialogues = mode === "dialogues";
    const isInvitation = mode === "invitation";

    if (!isDialogues) {
      dialogue.hidden = true;
      response.hidden = true;
      dialogueTools.hidden = true;
    }

    invitationLinks.hidden = !isInvitation;
  }

  function renderViewerEntry(entry) {
    if (!entry || !state.shell) {
      return;
    }

    const panel = state.shell.querySelector(".humanoid-panel");
    const title = document.getElementById("humanoid-viewer-title");
    const modeLine = document.getElementById("humanoid-viewer-mode");
    const image = document.getElementById("humanoid-viewer-image");
    const role = document.getElementById("humanoid-role");
    const personality = document.getElementById("humanoid-personality");
    const voice = document.getElementById("humanoid-voice");
    const orientation = document.getElementById("humanoid-orientation");
    const concept = document.getElementById("humanoid-concept");
    const pathText = document.getElementById("humanoid-vault-path");
    const excerpt = document.getElementById("humanoid-note-excerpt");
    const note = document.getElementById("humanoid-note");
    const halo = document.getElementById("humanoid-halo");

    const mode = entry.chamber || state.chamber;
    panel.setAttribute("data-mode", mode);
    panel.classList.remove("is-transitioning");
    void panel.offsetWidth;
    panel.classList.add("is-transitioning");

    title.textContent = `${entry.name} · ${chamberLabel(mode)}`;
    modeLine.textContent = `${mode.toUpperCase()} resonance · ${entry.routing && entry.routing.reason ? entry.routing.reason : "vault-routed"}`;
    role.textContent = `Role: ${entry.metadata && entry.metadata.role ? entry.metadata.role : "Humanoid"}`;
    personality.textContent = `Personality: ${entry.metadata && entry.metadata.personality ? entry.metadata.personality : "Unresolved"}`;
    voice.textContent = `Voice Signature: ${entry.metadata && entry.metadata.voiceSignature ? entry.metadata.voiceSignature : "Unresolved"}`;
    orientation.textContent = `Orientation: ${entry.metadata && entry.metadata.orientation ? entry.metadata.orientation : "Unresolved"}`;
    concept.textContent = `Conceptual Alignment: ${entry.metadata && entry.metadata.conceptLine ? entry.metadata.conceptLine : (entry.metadata && entry.metadata.thresholdLine ? entry.metadata.thresholdLine : "Not specified")}`;
    pathText.textContent = `Vault Path: ${entry.note && entry.note.vaultRelative ? entry.note.vaultRelative : "unresolved"}`;

    halo.textContent = entry.glyph || "◌";

    if (entry.preview) {
      image.src = entry.preview;
      image.alt = `${entry.name} preview`;
    } else {
      image.removeAttribute("src");
      image.alt = `${entry.name} preview missing`;
    }

    const noteContext = resolveNoteContext(entry);
    excerpt.textContent = noteContext && noteContext.excerpt
      ? `Vault note: ${noteContext.excerpt}`
      : "Vault note context not indexed for this entity.";

    setNoteAnchor(note, entry);
    setModeVisibility(mode);

    if (mode === "dialogues") {
      syncDialogueMode(entry);
    }
  }

  function openViewerByIndex(index) {
    if (!state.visibleEntries.length) {
      return;
    }
    state.activeIndex = ((index % state.visibleEntries.length) + state.visibleEntries.length) % state.visibleEntries.length;
    renderViewerEntry(state.visibleEntries[state.activeIndex]);
    state.shell.classList.remove("is-hidden");
    state.shell.setAttribute("aria-hidden", "false");
    pulsePanel("viewer-open");
  }

  function closeViewer() {
    if (!state.shell) {
      return;
    }
    state.shell.classList.add("is-hidden");
    state.shell.setAttribute("aria-hidden", "true");
    pulsePanel("viewer-close");
  }

  function bindViewerControls() {
    const prev = document.getElementById("humanoid-prev");
    const next = document.getElementById("humanoid-next");

    prev.addEventListener("click", function () {
      if (!state.visibleEntries.length) {
        return;
      }
      openViewerByIndex(state.activeIndex - 1);
      pulsePanel("viewer-prev");
    });

    next.addEventListener("click", function () {
      if (!state.visibleEntries.length) {
        return;
      }
      openViewerByIndex(state.activeIndex + 1);
      pulsePanel("viewer-next");
    });

    state.shell.addEventListener("click", function (event) {
      const target = event.target;
      if (target instanceof Element && target.getAttribute("data-close") === "true") {
        closeViewer();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (state.shell.classList.contains("is-hidden")) {
        return;
      }
      if (event.key === "Escape") {
        closeViewer();
      }
      if (event.key === "ArrowLeft") {
        openViewerByIndex(state.activeIndex - 1);
      }
      if (event.key === "ArrowRight") {
        openViewerByIndex(state.activeIndex + 1);
      }
    });
  }

  function loadVaultIndex() {
    return fetch("vault-search-index.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then(function (payload) {
        if (payload) {
          buildNoteIndexMap(payload);
        }
      })
      .catch(function () {
        state.noteIndexByPath = new Map();
      });
  }

  function init() {
    state.chamber = activeChamber();
    if (!state.chamber) {
      return;
    }

    state.shell = createViewer();
    bindViewerControls();

    fetch("data/humanoid-triad.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("humanoid triad manifest missing");
        }
        return response.json();
      })
      .then(function (payload) {
        state.payload = payload;
        state.allEntries = payload && payload.chambers && Array.isArray(payload.chambers[state.chamber])
          ? payload.chambers[state.chamber]
          : [];

        const container = document.getElementById(chamberTargets[state.chamber].containerId);
        buildRefreshControl(state.chamber, container);

        state.visibleEntries = randomSample(state.allEntries, Math.min(12, state.allEntries.length));
        renderCards();
        pulsePanel("initial-render");

        return loadVaultIndex();
      })
      .catch(function () {
        const container = document.getElementById(chamberTargets[state.chamber].containerId);
        if (!container) {
          return;
        }
        container.textContent = "Humanoid triad data missing. Run build-humanoid-triad-index.js.";
      });
  }

  init();
})();
