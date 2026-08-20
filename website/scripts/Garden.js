/* -------------------------------------------------------
   GARDEN CORE
------------------------------------------------------- */

const rooms = [
  "herb-room",
  "greenhouse",
  "lagoon",
  "cave-corridor",
  "meadow",
  "shore",
  "camp"
];

let currentRoom = 0;
let greenhouseLoopActive = false;
let meadowLoopActive = false;
let campLoopActive = false;

function showRoom(index) {
  document.querySelectorAll(".room").forEach((room) => room.classList.remove("active"));
  const room = document.getElementById(rooms[index]);
  if (room) {
    room.classList.add("active");
  }
  currentRoom = index;

  stopAllSounds();
  triggerRoomEffects(index);
}

/* -------------------------------------------------------
   ENVIRONMENTAL EFFECTS
------------------------------------------------------- */

function triggerRoomEffects(index) {
  if (index === 1) greenhouseGlow();
  if (index === 2) lagoonFireflies();
  if (index === 4) {
    meadowWind();
    playSound("wind");
  }
  if (index === 5) {
    shoreTideLight();
    playSound("ocean");
  }
  if (index === 6) {
    campFire();
    playSound("fire");
  }
}

/* Glow */
function greenhouseGlow() {
  if (greenhouseLoopActive) {
    return;
  }
  greenhouseLoopActive = true;

  const loop = () => {
    const plants = document.querySelectorAll("#greenhouse .glow-plant");
    plants.forEach((plant) => {
      const intensity = 0.4 + Math.random() * 0.6;
      plant.style.filter = `brightness(${intensity})`;
    });
    requestAnimationFrame(loop);
  };

  loop();
}

/* Fireflies */
function lagoonFireflies() {
  const lagoon = document.getElementById("lagoon");
  if (!lagoon || lagoon.dataset.spawned) {
    return;
  }
  lagoon.dataset.spawned = "true";

  for (let i = 0; i < 20; i++) {
    const firefly = document.createElement("div");
    firefly.className = "firefly";
    firefly.style.left = Math.random() * 100 + "vw";
    firefly.style.top = Math.random() * 100 + "vh";
    firefly.innerHTML = "<svg class=\"firefly-svg\" width=\"8\" height=\"8\"><circle cx=\"4\" cy=\"4\" r=\"3\" fill=\"white\" opacity=\"0.8\"/></svg>";
    lagoon.appendChild(firefly);
    animateFirefly(firefly);
  }
}

function animateFirefly(firefly) {
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const duration = 4000 + Math.random() * 4000;

  firefly.animate(
    [
      { transform: `translate(${x}vw, ${y}vh)` },
      { opacity: Math.random() }
    ],
    { duration, iterations: Infinity }
  );
}

/* Meadow Wind */
function meadowWind() {
  if (meadowLoopActive) {
    return;
  }
  meadowLoopActive = true;

  const loop = () => {
    const grass = document.querySelectorAll("#meadow .grass");
    grass.forEach((blade) => {
      const sway = Math.sin(Date.now() / 1000 + Math.random()) * 3;
      blade.style.transform = `rotate(${sway}deg)`;
    });
    requestAnimationFrame(loop);
  };

  loop();
}

/* Tide Light */
function shoreTideLight() {
  const shore = document.getElementById("shore");
  if (!shore || shore.dataset.spawned) {
    return;
  }
  shore.dataset.spawned = "true";

  const wave = document.createElement("div");
  wave.className = "tide-light";
  shore.appendChild(wave);

  wave.animate(
    [
      { opacity: 0.1, transform: "scaleX(1)" },
      { opacity: 0.5, transform: "scaleX(1.2)" },
      { opacity: 0.1, transform: "scaleX(1)" }
    ],
    { duration: 3000, iterations: Infinity }
  );
}

/* Camp Fire */
function campFire() {
  if (campLoopActive) {
    return;
  }
  campLoopActive = true;

  const loop = () => {
    const fire = document.querySelector("#camp .fire");
    if (fire) {
      const intensity = 0.8 + Math.random() * 0.4;
      fire.style.filter = `brightness(${intensity})`;
    }
    requestAnimationFrame(loop);
  };

  loop();
}

/* -------------------------------------------------------
   TRANSITIONS
------------------------------------------------------- */

function setupMovementTransitions() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") goToGreenhouse();
    if (event.key === "ArrowLeft") goToLagoon();
    if (event.key === "ArrowUp") goToMeadow();
    if (event.key === "ArrowDown") goToCamp();
  });
}

function setupProximityTriggers() {
  const triggers = document.querySelectorAll(".trigger");
  triggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", () => trigger.classList.add("active-trigger"));
    trigger.addEventListener("mouseleave", () => trigger.classList.remove("active-trigger"));
  });
}

function glowPathSequence() {
  const path = document.querySelectorAll("#greenhouse .glow-plant");
  if (!path.length) {
    return;
  }

  let i = 0;

  function step() {
    path.forEach((plant) => {
      plant.style.filter = "brightness(0.3)";
    });
    path[i].style.filter = "brightness(1.2)";
    i = (i + 1) % path.length;
    setTimeout(step, 400);
  }

  step();
}

/* -------------------------------------------------------
   CONTENT AND LORE
------------------------------------------------------- */

function saveLedger() {
  const input = document.getElementById("ledger-input");
  const entries = document.getElementById("ledger-entries");
  if (!input || !entries) {
    return;
  }

  const text = input.value;
  if (!text.trim()) {
    return;
  }

  const entry = document.createElement("p");
  entry.textContent = text;
  entries.appendChild(entry);
  input.value = "";
}

/* -------------------------------------------------------
   SOUND ENGINE
------------------------------------------------------- */

const sounds = {};

function playSound(name) {
  const sound = sounds[name];
  if (!sound) {
    return;
  }

  sound.loop = true;
  sound.volume = 0.4;
  sound.play().catch(() => {
    // Ignore autoplay restrictions until user interaction occurs.
  });
}

function stopAllSounds() {
  Object.values(sounds).forEach((sound) => {
    sound.pause();
  });
}

/* -------------------------------------------------------
   VISUAL ASSETS
------------------------------------------------------- */

function setupVineInteractivity() {
  const vine = document.querySelector(".vine");
  if (!vine) {
    return;
  }

  window.addEventListener("mousemove", (event) => {
    const intensity = Math.min(1, Math.abs(event.clientX - 160) / 400);
    vine.style.stroke = `rgba(80,180,120,${1 - intensity})`;
  });
}

function setupGrowthCanvas() {
  const canvas = document.getElementById("garden-growth");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "-1";

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  const petals = [];
  const petalCount = Math.min(42, Math.max(18, Math.round((canvas.width * canvas.height) / 30000)));
  for (let i = 0; i < petalCount; i++) {
    petals.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      grow: Math.random() * 0.003 + 0.001
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    petals.forEach((petal) => {
      petal.r += petal.grow;
      if (petal.r > 3) {
        petal.r = Math.random() * 1.2 + 0.6;
      }

      petal.x += petal.vx;
      petal.y += petal.vy;

      if (petal.x < 0) {
        petal.x = canvas.width;
      }
      if (petal.x > canvas.width) {
        petal.x = 0;
      }
      if (petal.y < 0) {
        petal.y = canvas.height;
      }
      if (petal.y > canvas.height) {
        petal.y = 0;
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 200, 150, ${0.08 + petal.r / 30})`;
      ctx.arc(petal.x, petal.y, petal.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

function drawGrass() {
  const canvas = document.getElementById("meadow-canvas");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const sway = Math.sin(Date.now() / 1000 + i) * 3;
      ctx.save();
      ctx.translate(x, canvas.height - 20);
      ctx.rotate((sway * Math.PI) / 180);
      ctx.fillStyle = "#7fa06b";
      ctx.fillRect(0, 0, 3, -40);
      ctx.restore();
    }
    requestAnimationFrame(render);
  }

  render();
}

/* -------------------------------------------------------
   UI NAVIGATION
------------------------------------------------------- */

function setupUI() {
  const uiNavButtons = Array.from(document.querySelectorAll("#ui-nav button[data-target]"));
  const herb = document.getElementById("nav-herb") || uiNavButtons.find((button) => button.dataset.target === "herb-room");
  const greenhouse = document.getElementById("nav-greenhouse") || uiNavButtons.find((button) => button.dataset.target === "greenhouse");
  const lagoon = document.getElementById("nav-lagoon") || uiNavButtons.find((button) => button.dataset.target === "lagoon");
  const cave = document.getElementById("nav-cave") || uiNavButtons.find((button) => button.dataset.target === "cave-corridor");
  const meadow = document.getElementById("nav-meadow") || uiNavButtons.find((button) => button.dataset.target === "meadow");
  const shore = document.getElementById("nav-shore") || uiNavButtons.find((button) => button.dataset.target === "shore");
  const camp = document.getElementById("nav-camp") || uiNavButtons.find((button) => button.dataset.target === "camp");
  const save = document.getElementById("ledger-save");

  if (herb) herb.onclick = () => showRoom(0);
  if (greenhouse) greenhouse.onclick = goToGreenhouse;
  if (lagoon) lagoon.onclick = goToLagoon;
  if (cave) cave.onclick = goToCave;
  if (meadow) meadow.onclick = goToMeadow;
  if (shore) shore.onclick = goToShore;
  if (camp) camp.onclick = goToCamp;
  if (save) save.onclick = saveLedger;
}

/* -------------------------------------------------------
   ROOM SHORTCUTS
------------------------------------------------------- */

function goToGreenhouse() { showRoom(1); }
function goToLagoon() { showRoom(2); }
function goToCave() { showRoom(3); }
function goToMeadow() { showRoom(4); }
function goToShore() { showRoom(5); }
function goToCamp() { showRoom(6); }

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */

window.showRoom = showRoom;
window.saveLedger = saveLedger;

window.onload = () => {
  setupMovementTransitions();
  setupProximityTriggers();
  setupUI();
  glowPathSequence();
  setupVineInteractivity();
  setupGrowthCanvas();
  drawGrass();
  playSound("chimes");
};
