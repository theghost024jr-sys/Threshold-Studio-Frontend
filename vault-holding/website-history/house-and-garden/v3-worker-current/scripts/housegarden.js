// HOUSE & GARDEN ENGINE
(function () {
  const oldHouse = document.getElementById("old-house");
  const newHouse = document.getElementById("new-house");
  const garden = document.getElementById("garden");

  if (!oldHouse || !newHouse || !garden) return;

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
