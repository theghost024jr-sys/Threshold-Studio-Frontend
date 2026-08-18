// HOUSE & GARDEN ENGINE
(function () {
  const oldHouse = document.getElementById("old-house");
  const newHouse = document.getElementById("new-house");
  const garden = document.getElementById("garden");
  const pollen = Array.from(document.querySelectorAll(".pollen.clickable"));
  const pollenProgress = document.querySelector("[data-pollen-progress]");
  const gardenPortal = document.querySelector("[data-garden-portal]");

  if (!oldHouse || !newHouse || !garden) return;

  const activatedPollen = new Set();
  pollen.forEach((mote, index) => {
    mote.addEventListener("click", () => {
      if (activatedPollen.has(mote)) return;
      activatedPollen.add(mote);
      mote.dataset.activated = "true";
      mote.disabled = true;
      mote.classList.add("pulse");
      setTimeout(() => mote.classList.remove("pulse"), 400);

      if (pollenProgress) pollenProgress.textContent = `${activatedPollen.size} of ${pollen.length} pollen motes found.`;
      if (gardenPortal && activatedPollen.size === pollen.length) {
        gardenPortal.dataset.revealed = "true";
        gardenPortal.setAttribute("aria-hidden", "false");
        gardenPortal.querySelector("a")?.removeAttribute("tabindex");
      }
    });
    mote.dataset.pollenIndex = String(index + 1);
  });

  let state = {
    visits: 0,
    lastPause: null,
    gardenNotes: []
  };

  try {
    const saved = localStorage.getItem("threshold.housegarden.v1");
    if (saved) state = JSON.parse(saved);
  } catch {}

  function save() {
    localStorage.setItem("threshold.housegarden.v1", JSON.stringify(state));
  }

  window.addEventListener("threshold:chamber-identity", (event) => {
    const identity = event.detail;

    oldHouse.querySelector(".old-title").textContent = identity.oldHouse?.title || "Old House";
    oldHouse.querySelector(".old-lore").textContent = identity.oldHouse?.lore || "";
  });

  window.addEventListener("threshold:chamber-identity", (event) => {
    const identity = event.detail;

    newHouse.querySelector(".new-title").textContent = identity.newHouse?.title || "New House";
    newHouse.querySelector(".new-lore").textContent = identity.newHouse?.lore || "";
  });

  garden.addEventListener("click", () => {
    const note = `Paused at ${new Date().toLocaleTimeString()}`;
    state.gardenNotes.push(note);
    state.lastPause = note;
    save();
    renderGarden();
  });

  function renderGarden() {
    const list = garden.querySelector(".garden-notes");
    list.innerHTML = "";
    state.gardenNotes.forEach((n) => {
      const li = document.createElement("li");
      li.textContent = n;
      list.appendChild(li);
    });
  }

  renderGarden();
})();
