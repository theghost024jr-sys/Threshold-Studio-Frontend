(function () {
  const archive = document.getElementById("archive");
  const status = document.getElementById("archiveStatus");
  const trail = document.getElementById("archiveTrail");
  const chamber = document.getElementById("chamber");
  const paths = Array.from(document.querySelectorAll(".path"));

  if (!archive || !status || !trail || !chamber || paths.length === 0) return;

  let glyphs = {};
  let depth = 0;
  const emotionByGlyph = {
    collapse: { fear: 1 },
    expand: { relief: 1 },
    fog: { confusion: 1 },
    soil: { reflection: 1 }
  };

  function activateGlyph(choice, section, button, effectText) {
    const result = window.ThresholdEmotions.activateGlyph(choice);
    if (!result) return;

    depth += 1;
    archive.dataset.weather = choice;
    archive.dataset.chamberState = result.status;
    paths.forEach((path) => path.setAttribute("aria-pressed", String(path.dataset.choice === choice)));
    status.textContent = `${glyphs[choice].name} activated.`;
    trail.textContent = `Maze depth ${depth}`;
    section.dataset.state = "activated";
    effectText.textContent = `Chamber ${result.status}: ${result.effects.join(", ")}.`;
    button.disabled = true;
    button.textContent = "Activated";
  }

  function revealGlyph(choice) {
    const selected = glyphs[choice];
    if (!selected) return;

    const section = document.createElement("section");
    const copy = document.createElement("div");
    const title = document.createElement("h2");
    const text = document.createElement("p");
    const effectText = document.createElement("p");
    const activate = document.createElement("button");
    const image = document.createElement("img");

    section.className = "archive-chamber glyph-chamber";
    section.dataset.state = "visible";
    copy.className = "glyph-copy";
    title.textContent = selected.name;
    text.className = "glyph-text";
    text.textContent = selected.text;
    effectText.className = "glyph-effect";
    effectText.textContent = "The glyph is visible but dormant.";
    activate.className = "glyph-activate";
    activate.type = "button";
    activate.textContent = `Activate ${selected.name}`;
    activate.addEventListener("click", function () {
      activateGlyph(choice, section, activate, effectText);
    });
    image.className = "glyph-asset";
    image.src = selected.asset;
    image.alt = `${selected.name} glyph`;
    copy.append(title, text, effectText, activate);
    section.append(image, copy);
    chamber.replaceChildren(section);
    status.textContent = `${selected.name} appears. Activate it to change the chamber.`;
  }

  function enterPath(choice) {
    const emotions = window.ThresholdEmotions;
    if (!emotions || !emotionByGlyph[choice]) return;
    emotions.transitionChamber({ id: `glyph-archive-${choice}`, force: choice });
    emotions.choose({ id: choice, emotion: emotionByGlyph[choice] });
    const appearance = emotions.checkGlyphAppearance();
    if (appearance) revealGlyph(appearance);
  }

  function bindPaths() {
    paths.forEach(function (path) {
      path.disabled = false;
      path.addEventListener("click", function () {
        enterPath(path.dataset.choice);
      });
    });
  }

  paths.forEach(function (path) { path.disabled = true; });
  fetch("config/glyphs.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("glyph index fetch failed");
      return response.json();
    })
    .then(function (data) {
      glyphs = data && data.glyphs ? data.glyphs : {};
      bindPaths();
    })
    .catch(function () {
      status.textContent = "The glyph index could not be opened.";
    });
})();