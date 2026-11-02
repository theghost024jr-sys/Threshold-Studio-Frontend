const shell = document.querySelector(".entry-shell");
const orbit = document.querySelector("[data-hub-wheel]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let drag = null;
let depth = 0;
let panX = 0;
let panY = 0;
let audio;
let lastCueAt = 0;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function renderView(panX, panY) {
  document.body.style.setProperty("--main-hub-pan-x", `${panX}px`);
  document.body.style.setProperty("--main-hub-pan-y", `${panY}px`);
  document.body.style.setProperty("--main-hub-depth", depth.toFixed(2));
  orbit.dataset.mainHubDepth = String(Math.round(depth * 3));
}

async function enableSpatialSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!audio || audio.state === "closed") audio = new AudioContext();
  if (audio.state !== "running") {
    try {
      await audio.resume();
    } catch (error) {
      console.error("Unable to start main Hub spatial sound.", error);
    }
  }
}

function playPanCue(panX) {
  if (!audio || audio.state !== "running" || reducedMotion.matches) return;
  const now = performance.now();
  if (now - lastCueAt < 180) return;
  lastCueAt = now;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const panner = audio.createStereoPanner?.();
  oscillator.type = "sine";
  oscillator.frequency.value = 220 + Math.abs(panX) * 1.4;
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.014, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18);
  oscillator.connect(gain);
  if (panner) {
    panner.pan.value = clamp(panX / 180, -0.75, 0.75);
    gain.connect(panner);
    panner.connect(audio.destination);
  } else {
    gain.connect(audio.destination);
  }
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.2);
}

function bindMainHubPan() {
  if (!shell || !orbit) return;

  orbit.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("a, button")) return;
    void enableSpatialSound();
    drag = { x: event.clientX, y: event.clientY, panX, panY, moved: false };
  });

  orbit.addEventListener("pointermove", (event) => {
    if (!drag) return;
    panX = clamp(event.clientX - drag.x + drag.panX, -220, 220);
    panY = clamp(event.clientY - drag.y + drag.panY, -140, 140);
    if (Math.hypot(panX, panY) >= 8) drag.moved = true;
    document.body.classList.toggle("is-main-hub-panning", drag.moved);
    renderView(panX, panY);
    playPanCue(panX);
  });

  const endDrag = () => {
    drag = null;
    document.body.classList.remove("is-main-hub-panning");
  };
  orbit.addEventListener("pointerup", endDrag);
  orbit.addEventListener("pointercancel", endDrag);

  orbit.addEventListener("wheel", (event) => {
    event.preventDefault();
    depth = clamp(depth + Math.sign(event.deltaY) * 0.17, 0, 1);
    renderView(panX, panY);
  }, { passive: false });
}

bindMainHubPan();
renderView(panX, panY);

window.addEventListener("pagehide", () => {
  if (audio && audio.state !== "closed") {
    void audio.close().catch((error) => console.error("Unable to close main Hub spatial sound.", error));
  }
}, { once: true });
