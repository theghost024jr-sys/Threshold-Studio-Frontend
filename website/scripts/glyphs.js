(function () {
  const archive = document.getElementById("archive");
  const status = document.getElementById("archiveStatus");
  const trail = document.getElementById("archiveTrail");
  const chamber = document.getElementById("chamber");
  const paths = Array.from(document.querySelectorAll(".path"));

  if (!archive || !status || !trail || !chamber || paths.length === 0) return;

  const chambers = {
    collapse: {
      title: "Storm Chamber",
      description: "Collapse is pressure given a room. The passage contracts until fracture becomes legible architecture.",
      glyphs: ["The Pendant That Refused to Collapse", "The Storm That Kept Its Lantern", "The Clasp That Refused to Break"]
    },
    expand: {
      title: "Shimmer Chamber",
      description: "Expansion widens the signal without abandoning its form. Light moves outward and the cave answers.",
      glyphs: ["The Mobius Strip with Three Loops", "The Shimmer That Refused to Sell", "The Guest Who Became Gravity"]
    },
    fog: {
      title: "Fog Chamber",
      description: "Fog slows the body enough for subtle signal to emerge. Partial sight becomes a way forward.",
      glyphs: ["The Listening Tree", "The Fog That Carried a Door", "The Echo That Needed No Attribution"]
    },
    soil: {
      title: "Soil Chamber",
      description: "Soil takes memory inward and returns it as structure. Buried fragments become nourishment rather than loss.",
      glyphs: ["The Root That Remembered Rain", "The Center That Remembered Its Edges", "The Compost Crown"]
    }
  };

  let depth = 0;

  function render(choice) {
    const selected = chambers[choice];
    if (!selected) return;

    depth += 1;
    archive.dataset.weather = choice;
    paths.forEach((path) => path.setAttribute("aria-pressed", String(path.dataset.choice === choice)));
    status.textContent = `${selected.title} opened. The Archive has reacted to your movement.`;
    trail.textContent = `Maze depth ${depth}`;

    const section = document.createElement("section");
    const copy = document.createElement("div");
    const title = document.createElement("h2");
    const description = document.createElement("p");
    const glyphs = document.createElement("div");

    section.className = "archive-chamber";
    title.textContent = selected.title;
    description.textContent = selected.description;
    glyphs.className = "chamber-glyphs";
    glyphs.setAttribute("aria-label", `${selected.title} glyphs`);
    selected.glyphs.forEach((name) => {
      const glyph = document.createElement("span");
      glyph.className = "chamber-glyph";
      glyph.textContent = name;
      glyphs.appendChild(glyph);
    });
    copy.append(title, description);
    section.append(copy, glyphs);
    chamber.replaceChildren(section);
  }

  paths.forEach((path) => path.addEventListener("click", () => render(path.dataset.choice)));
})();