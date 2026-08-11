import { buildFibonacciUrl, resolveFibonacciRoute } from "./fibonacci-routing.js";

const routeLinks = document.querySelectorAll("[data-fibonacci-spoke][data-fibonacci-path]");
const seedArchive = document.querySelector("[data-hub-seed-archive]");
const seedList = document.querySelector("[data-hub-seed-list]");
const hubWheel = document.querySelector("[data-hub-wheel]");
const hubReceptor = document.querySelector("[data-hub-receptor]");
const hubNodeField = document.querySelector("[data-hub-node-field]");
const voidCanvas = document.querySelector("[data-void-field]");
const categoryLinks = Array.from(document.querySelectorAll(".entry-actions a, .entry-engine"));

const voidSignatures = {
  ethos: { color: [214, 168, 75], motion: "vertical" },
  glyphs: { color: [75, 117, 255], motion: "horizontal" },
  mythology: { color: [187, 76, 43], motion: "spiral" },
  dialogues: { color: [107, 224, 235], motion: "ripple" },
  contact: { color: [255, 239, 199], motion: "radiating" }
};

function title(value) {
  return String(value || "unknown").replace(/-/g, " ");
}

function loadReturnedSeeds() {
  try {
    const seeds = JSON.parse(sessionStorage.getItem("threshold:hub-seeds") || "[]");
    return Array.isArray(seeds) ? seeds.slice(-6).reverse() : [];
  } catch {
    return [];
  }
}

function renderReturnedSeeds() {
  if (!seedArchive || !seedList) {
    return;
  }
  const seeds = loadReturnedSeeds();
  seedList.replaceChildren();
  seeds.forEach((seed) => {
    const state = seed && seed.state || {};
    const item = document.createElement("li");
    const fib = document.createElement("span");
    const version = document.createElement("span");
    const memory = document.createElement("span");
    fib.className = "entry-seed-fib";
    version.className = "entry-seed-version";
    memory.className = "entry-seed-memory";
    fib.textContent = "Fib " + String(seed.fromFib || "?");
    version.textContent = title(state.version);
    memory.textContent = "Returned with " + title(state.choice)
      + " · " + String(Number(state.stays || 0)) + " stays";
    item.append(fib, version, memory);
    seedList.appendChild(item);
  });
  seedArchive.hidden = seeds.length === 0;
}

renderReturnedSeeds();

function initializeHubReactor() {
  if (!hubWheel || !hubReceptor || !hubNodeField) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const nodeCount = 8;
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const node = document.createElement("span");
    node.className = "entry-orbit-node";
    node.dataset.nodeIndex = String(index);
    hubNodeField.appendChild(node);
    return node;
  });
  const state = {
    pointerX: -1000,
    pointerY: -1000,
    rotation: 0,
    zone: "idle",
    previousZone: "idle",
    hoveredLink: null,
    hoverAngle: null,
    retreatStartedAt: 0,
    retreatFrom: 0,
    retreatTo: 0,
    scatterStartedAt: 0,
    descendingStartedAt: 0,
    lastSparkAt: 0,
    lastHeartbeatAt: 0,
    frameId: 0,
    lastFrameAt: performance.now()
  };
  const voidContext = voidCanvas?.getContext("2d", { alpha: true });
  const voidState = {
    width: 0,
    height: 0,
    pixelRatio: 1,
    signature: null,
    waves: [],
    particles: [],
    frameParticles: [],
    scrollY: window.scrollY
  };

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function easeInOut(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function wheelMetrics() {
    const rect = hubWheel.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      radius: rect.width / 2
    };
  }

  function resizeVoid() {
    if (!voidCanvas || !voidContext) {
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    voidState.width = window.innerWidth;
    voidState.height = window.innerHeight;
    voidState.pixelRatio = pixelRatio;
    voidCanvas.width = Math.round(voidState.width * pixelRatio);
    voidCanvas.height = Math.round(voidState.height * pixelRatio);
    voidCanvas.style.width = voidState.width + "px";
    voidCanvas.style.height = voidState.height + "px";
    voidContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const particleCount = voidState.width < 600 ? 34 : 62;
    while (voidState.particles.length < particleCount) {
      const index = voidState.particles.length;
      voidState.particles.push({
        x: Math.random() * voidState.width,
        y: Math.random() * voidState.height,
        previousX: 0,
        previousY: 0,
        size: 0.65 + Math.random() * 1.35,
        drift: 0.14 + Math.random() * 0.32,
        phase: index * 1.71 + Math.random() * Math.PI,
        gold: index % 9 === 0
      });
    }
    voidState.particles.length = particleCount;
    const frameParticleCount = voidState.width < 600 ? 12 : 20;
    while (voidState.frameParticles.length < frameParticleCount) {
      const index = voidState.frameParticles.length;
      voidState.frameParticles.push({
        progress: index / frameParticleCount,
        speed: 0.000012 + Math.random() * 0.00001,
        size: 0.55 + Math.random() * 0.85,
        gold: index % 5 === 0
      });
    }
    voidState.frameParticles.length = frameParticleCount;
    if (reducedMotion.matches) {
      drawVoid(performance.now(), 0, wheelMetrics(), true);
    }
  }

  function addPressureWave(type, strength = 1) {
    if (!voidContext || reducedMotion.matches) {
      return;
    }
    voidState.waves.push({
      bornAt: performance.now(),
      type,
      strength,
      signature: voidState.signature
    });
    voidState.waves = voidState.waves.slice(-9);
  }

  function emitSignal(type, detail = {}) {
    hubReceptor.dataset.signal = type;
    window.dispatchEvent(new CustomEvent("threshold:hub-signal", {
      detail: { type, zone: state.zone, ...detail }
    }));
    if (type === "pulse" || type === "charge") {
      addPressureWave(type, type === "charge" ? 0.9 : 0.55);
    } else if (type === "resonance") {
      addPressureWave("resonance", 1);
    } else if (type === "descent") {
      addPressureWave("descent", 1.4);
    }
  }

  function setZone(nextZone, now) {
    if (nextZone === state.zone) {
      return;
    }
    state.previousZone = state.zone;
    state.zone = nextZone;
    document.body.dataset.reactorZone = nextZone;

    if (state.hoveredLink && (nextZone === "approach" || nextZone === "contact")) {
      emitSignal("resonance", {
        category: state.hoveredLink.textContent.trim(),
        angle: state.hoverAngle
      });
    } else if (nextZone === "approach") {
      emitSignal("pulse");
    } else if (nextZone === "contact") {
      emitSignal("charge");
    } else if (nextZone === "retreat") {
      state.retreatStartedAt = now;
      state.retreatFrom = state.rotation;
      state.retreatTo = Math.floor(state.rotation / 360) * 360;
      state.scatterStartedAt = now;
      emitSignal("idle");
    } else if (nextZone === "idle") {
      emitSignal("idle");
    }
  }

  function categoryAngle(link) {
    const metrics = wheelMetrics();
    const rect = link.getBoundingClientRect();
    return Math.atan2(
      rect.top + rect.height / 2 - metrics.centerY,
      rect.left + rect.width / 2 - metrics.centerX
    );
  }

  function setCategory(link) {
    state.hoveredLink = link;
    state.hoverAngle = categoryAngle(link);
    const category = link.textContent.trim().toLowerCase();
    voidState.signature = voidSignatures[category] || {
      color: [214, 168, 75],
      motion: "ripple"
    };
    document.body.dataset.voidSignature = voidState.signature.motion;
    const frequency = 0.75 + categoryLinks.indexOf(link) * 0.07;
    hubWheel.style.setProperty("--category-frequency", frequency.toFixed(2) + "s");
    emitSignal("resonance", {
      category: link.textContent.trim(),
      angle: state.hoverAngle,
      frequency
    });
  }

  function clearCategory(link) {
    if (state.hoveredLink !== link) {
      return;
    }
    state.hoveredLink = null;
    state.hoverAngle = null;
    voidState.signature = null;
    delete document.body.dataset.voidSignature;
    emitSignal(state.zone === "contact" ? "charge" : state.zone === "approach" ? "pulse" : "idle");
  }

  function beginDescent(event, link) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const destination = link.href;
    if (!destination) {
      return;
    }
    event.preventDefault();
    state.descendingStartedAt = performance.now();
    document.body.classList.add("is-void-descending");
    hubWheel.classList.add("is-descending");
    hubReceptor.dataset.signal = "descent";
    emitSignal("descent", { category: link.textContent.trim(), destination });
    window.setTimeout(() => window.location.assign(destination), reducedMotion.matches ? 0 : 420);
  }

  categoryLinks.forEach((link) => {
    link.addEventListener("pointerenter", () => setCategory(link));
    link.addEventListener("pointerleave", () => clearCategory(link));
    link.addEventListener("focus", () => setCategory(link));
    link.addEventListener("blur", () => clearCategory(link));
    link.addEventListener("click", (event) => beginDescent(event, link));
  });
  if (categoryLinks.includes(document.activeElement)) {
    setCategory(document.activeElement);
  }

  document.addEventListener("pointermove", (event) => {
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    state.pointerX = -1000;
    state.pointerY = -1000;
  });

  window.addEventListener("resize", resizeVoid, { passive: true });
  window.addEventListener("scroll", () => {
    voidState.scrollY = window.scrollY;
  }, { passive: true });

  function updateZone(now, metrics) {
    if (state.descendingStartedAt) {
      return;
    }
    const distance = Math.hypot(state.pointerX - metrics.centerX, state.pointerY - metrics.centerY);
    if (distance <= metrics.radius) {
      setZone("contact", now);
    } else if (distance <= metrics.radius + 220) {
      setZone("approach", now);
    } else if (state.zone === "approach" || state.zone === "contact") {
      setZone("retreat", now);
    } else if (state.zone === "retreat" && now - state.retreatStartedAt >= 1200) {
      setZone("idle", now);
    }
    return distance;
  }

  function updateWheel(now, deltaSeconds, metrics, distance) {
    let proximity = 0;
    if (state.zone === "contact") {
      state.rotation += 15 * deltaSeconds;
      proximity = 1;
    } else if (state.zone === "approach") {
      proximity = clamp((metrics.radius + 220 - distance) / 220, 0, 1);
      state.rotation += (2 + proximity * 10) * deltaSeconds;
    } else if (state.zone === "retreat") {
      const progress = clamp((now - state.retreatStartedAt) / 1200, 0, 1);
      state.rotation = state.retreatFrom + (state.retreatTo - state.retreatFrom) * easeInOut(progress);
    }

    let vectorAngle = state.hoverAngle;
    if (vectorAngle === null && (state.zone === "approach" || state.zone === "contact")) {
      vectorAngle = Math.atan2(state.pointerY - metrics.centerY, state.pointerX - metrics.centerX);
    }
    const tiltStrength = state.hoveredLink ? 3 : state.zone === "contact" ? 3 : proximity * 1.6;
    const tiltX = vectorAngle === null ? 0 : -Math.sin(vectorAngle) * tiltStrength;
    const tiltY = vectorAngle === null ? 0 : Math.cos(vectorAngle) * tiltStrength;
    const charge = state.hoveredLink ? 0.9 : state.zone === "contact" ? 0.82 : state.zone === "approach" ? 0.3 + proximity * 0.36 : 0;
    const coreScale = state.descendingStartedAt ? 1.08 : 1 + proximity * 0.05;

    hubWheel.style.setProperty("--wheel-rotation", state.rotation.toFixed(3) + "deg");
    hubWheel.style.setProperty("--wheel-tilt-x", tiltX.toFixed(3) + "deg");
    hubWheel.style.setProperty("--wheel-tilt-y", tiltY.toFixed(3) + "deg");
    hubWheel.style.setProperty("--core-scale", coreScale.toFixed(3));
    hubWheel.style.setProperty("--core-glow", (0.18 + charge * 0.42).toFixed(3));
    hubWheel.style.setProperty("--spoke-glow", (state.hoveredLink ? 0.56 : charge * 0.32).toFixed(3));
    hubWheel.style.setProperty("--receptor-charge", charge.toFixed(3));
    hubReceptor.style.setProperty("--receptor-charge", charge.toFixed(3));
  }

  function updateNodes(now, metrics) {
    const seconds = now / 1000;
    const hoverSpread = 0.12;
    const scatterProgress = state.scatterStartedAt
      ? clamp((now - state.scatterStartedAt) / 1050, 0, 1)
      : 1;
    const scatterStrength = Math.sin(scatterProgress * Math.PI) * (1 - scatterProgress);
    const escapePhase = (now % 38000) / 38000;
    const escapingIndex = Math.floor(now / 38000) % nodeCount;
    const descendingProgress = state.descendingStartedAt
      ? clamp((now - state.descendingStartedAt) / 380, 0, 1)
      : 0;

    nodes.forEach((node, index) => {
      const idleRadius = metrics.radius * (0.34 + (index % 3) * 0.09);
      const pixelsPerSecond = 8 + (index % 5);
      const angularSpeed = pixelsPerSecond / idleRadius;
      const idleAngle = index / nodeCount * Math.PI * 2 + seconds * angularSpeed;
      let angle = idleAngle;
      let radius = idleRadius + Math.sin(seconds * 0.7 + index * 1.9) * 7;
      let opacity = 0.24;
      let scale = 1;

      if (state.zone === "approach" || state.zone === "contact") {
        const cursorAngle = Math.atan2(state.pointerY - metrics.centerY, state.pointerX - metrics.centerX);
        angle += Math.sin(cursorAngle - angle) * (state.zone === "contact" ? 0.24 : 0.14);
        radius += state.zone === "contact" ? 9 : 4;
        opacity = state.zone === "contact" ? 0.42 : 0.34;
      }
      if (state.hoverAngle !== null) {
        angle = state.hoverAngle + (index - (nodeCount - 1) / 2) * hoverSpread;
        radius = metrics.radius * (0.39 + (index % 2) * 0.04);
        opacity = 0.46;
        scale = 1.12;
      }
      if (state.zone === "retreat") {
        radius += (22 + (index % 4) * 6) * scatterStrength;
      }
      if (index === escapingIndex && escapePhase < 0.09 && state.zone === "idle") {
        const escapeProgress = escapePhase / 0.09;
        radius += Math.sin(escapeProgress * Math.PI) * (72 + (index % 3) * 18);
        opacity = 0.18 + Math.abs(Math.sin(escapeProgress * Math.PI * 7)) * 0.5;
      }
      if (descendingProgress > 0) {
        radius *= 1 - easeInOut(descendingProgress);
        opacity = 0.55 * (1 - descendingProgress);
        scale = 1 + descendingProgress * 0.8;
      }

      node.style.setProperty("--node-x", (Math.cos(angle) * radius).toFixed(2) + "px");
      node.style.setProperty("--node-y", (Math.sin(angle) * radius).toFixed(2) + "px");
      node.style.setProperty("--node-opacity", opacity.toFixed(3));
      node.style.setProperty("--node-scale", scale.toFixed(3));
    });

    if (state.zone === "contact" && now - state.lastSparkAt > 2800) {
      state.lastSparkAt = now;
      const node = nodes[Math.floor(now / 2800) % nodeCount];
      node.classList.remove("is-sparking");
      requestAnimationFrame(() => node.classList.add("is-sparking"));
      window.setTimeout(() => node.classList.remove("is-sparking"), 650);
    }
  }

  function framePoint(progress, inset, width, height) {
    const frameWidth = width - inset * 2;
    const frameHeight = height - inset * 2;
    const perimeter = frameWidth * 2 + frameHeight * 2;
    let distance = progress * perimeter;
    if (distance <= frameWidth) return { x: inset + distance, y: inset };
    distance -= frameWidth;
    if (distance <= frameHeight) return { x: width - inset, y: inset + distance };
    distance -= frameHeight;
    if (distance <= frameWidth) return { x: width - inset - distance, y: height - inset };
    distance -= frameWidth;
    return { x: inset, y: height - inset - distance };
  }

  function drawFieldFrame(context, now, deltaSeconds, metrics, activity, signature) {
    const width = voidState.width;
    const height = voidState.height;
    const seconds = now / 1000;
    const heartbeat = Math.pow(Math.max(0, Math.sin(seconds * Math.PI / 3)), 12);
    const engineFlicker = Math.pow(Math.max(0, Math.sin(seconds * Math.PI / 10.5)), 24);
    const shimmer = Math.pow(Math.max(0, Math.sin(seconds * Math.PI / 6)), 20);
    const retreatFade = state.zone === "retreat" ? 0.55 : 1;
    const descentProgress = state.descendingStartedAt
      ? clamp((now - state.descendingStartedAt) / 420, 0, 1)
      : 0;
    const inset = clamp(Math.min(width, height) * 0.026, 13, 28) + descentProgress * 5;
    const baseScale = 0.995 + Math.sin(seconds * Math.PI / 6) * 0.005;
    const frameScale = state.descendingStartedAt ? baseScale - descentProgress * 0.006 : baseScale;
    const influenceAngle = state.hoverAngle !== null
      ? state.hoverAngle
      : state.zone === "contact" || state.zone === "approach"
        ? Math.atan2(state.pointerY - metrics.centerY, state.pointerX - metrics.centerX)
        : 0;
    const tilt = state.zone === "contact" ? Math.cos(influenceAngle) * Math.PI / 120 : 0;
    const signatureColor = signature?.color || [31, 59, 255];
    const goldOpacity = (0.09 + activity * 0.07 + heartbeat * 0.07 + engineFlicker * 0.09) * retreatFade;
    const blueOpacity = (0.08 + activity * 0.09 + shimmer * 0.08) * retreatFade;
    const rippleStrength = state.hoveredLink ? 3.4 : state.zone === "contact" ? 2.4 : activity * 1.3;
    const steps = width < 600 ? 96 : 152;

    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(tilt);
    context.scale(frameScale, frameScale);
    context.translate(-width / 2, -height / 2);
    context.beginPath();
    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      const point = framePoint(progress, inset, width, height);
      const organic = Math.sin(progress * Math.PI * 18 + seconds * 0.16) * 0.75
        + Math.sin(progress * Math.PI * 37 - seconds * 0.09) * 0.38;
      let rippleX = 0;
      let rippleY = 0;
      if (signature?.motion === "vertical") rippleX = Math.sin(point.y * 0.035 + seconds * 1.4) * rippleStrength;
      if (signature?.motion === "horizontal") rippleY = Math.sin(point.x * 0.035 + seconds * 1.4) * rippleStrength;
      if (signature?.motion === "spiral") {
        rippleX = Math.cos(progress * Math.PI * 8 + seconds) * rippleStrength;
        rippleY = Math.sin(progress * Math.PI * 8 + seconds) * rippleStrength;
      }
      if (signature?.motion === "ripple") rippleY = Math.sin(progress * Math.PI * 12 + seconds * 2.2) * rippleStrength * 0.7;
      if (signature?.motion === "radiating") {
        rippleX = Math.cos(progress * Math.PI * 2) * rippleStrength;
        rippleY = Math.sin(progress * Math.PI * 2) * rippleStrength;
      }
      const x = point.x + rippleX + (point.x < width / 2 ? -organic : organic);
      const y = point.y + rippleY + (point.y < height / 2 ? -organic : organic);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.lineWidth = 3;
    context.strokeStyle = `rgba(214,168,75,${goldOpacity})`;
    context.shadowColor = `rgba(214,168,75,${goldOpacity * 1.8})`;
    context.shadowBlur = 8 + activity * 8;
    context.stroke();
    context.lineWidth = 1.15;
    context.strokeStyle = `rgba(${signatureColor.join(",")},${blueOpacity})`;
    context.shadowColor = `rgba(${signatureColor.join(",")},${blueOpacity * 2.2})`;
    context.shadowBlur = 12 + activity * 12;
    context.stroke();

    const frameSpeed = 1 + activity * 3.4;
    const escapePhase = (now % 37000) / 37000;
    voidState.frameParticles.forEach((particle, index) => {
      particle.progress = (particle.progress + particle.speed * deltaSeconds * 1000 * frameSpeed) % 1;
      const point = framePoint(particle.progress, inset, width, height);
      let escape = 0;
      if (index === 0 && escapePhase < 0.06) {
        escape = Math.sin(escapePhase / 0.06 * Math.PI) * 24;
      }
      const directionX = point.x === inset ? -1 : point.x === width - inset ? 1 : 0;
      const directionY = point.y === inset ? -1 : point.y === height - inset ? 1 : 0;
      context.beginPath();
      context.arc(point.x + directionX * escape, point.y + directionY * escape, particle.size, 0, Math.PI * 2);
      const color = particle.gold ? [214, 168, 75] : signatureColor;
      context.fillStyle = `rgba(${color.join(",")},${0.07 + activity * 0.08})`;
      context.fill();
    });
    context.restore();
  }

  function drawVoid(now, deltaSeconds, metrics, staticFrame = false) {
    if (!voidContext || (reducedMotion.matches && !staticFrame)) {
      return;
    }
    const context = voidContext;
    const width = voidState.width;
    const height = voidState.height;
    const centerX = metrics.centerX;
    const centerY = metrics.centerY;
    const activity = state.descendingStartedAt ? 1.5
      : state.hoveredLink ? 1
      : state.zone === "contact" ? 0.82
      : state.zone === "approach" ? 0.46
      : state.zone === "retreat" ? 0.12 : 0.2;
    const signature = voidState.signature;
    const fieldColor = signature?.color || [31, 59, 255];
    context.clearRect(0, 0, width, height);

    const field = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.72);
    field.addColorStop(0, `rgba(${fieldColor.join(",")},${0.025 + activity * 0.025})`);
    field.addColorStop(0.48, "rgba(10,15,43,0.055)");
    field.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = field;
    context.fillRect(0, 0, width, height);

    drawFieldFrame(context, now, deltaSeconds, metrics, activity, signature);

    const veinPulse = 0.5 + 0.5 * Math.sin(now / 1000 * Math.PI * 2 / 21);
    const veinOpacity = 0.028 + veinPulse * 0.026 + activity * 0.045;
    context.lineWidth = 0.7;
    for (let index = 0; index < 7; index += 1) {
      const baseAngle = index / 7 * Math.PI * 2 + state.rotation * Math.PI / 180 * 0.08;
      const targetAngle = state.hoverAngle === null ? baseAngle : baseAngle * 0.35 + state.hoverAngle * 0.65;
      const reach = Math.max(width, height) * 0.78;
      context.beginPath();
      context.moveTo(centerX, centerY);
      for (let step = 1; step <= 5; step += 1) {
        const distance = reach * step / 5;
        const bend = Math.sin(index * 4.7 + step * 2.2) * 13;
        context.lineTo(
          centerX + Math.cos(targetAngle) * distance + Math.cos(targetAngle + Math.PI / 2) * bend,
          centerY + Math.sin(targetAngle) * distance + Math.sin(targetAngle + Math.PI / 2) * bend
        );
      }
      context.strokeStyle = `rgba(214,168,75,${veinOpacity})`;
      context.stroke();
    }

    voidState.waves = voidState.waves.filter((wave) => now - wave.bornAt < 3600);
    voidState.waves.forEach((wave) => {
      const progress = (now - wave.bornAt) / 3600;
      const radius = 24 + progress * Math.max(width, height) * 0.62;
      const color = wave.signature?.color || [214, 168, 75];
      context.save();
      context.translate(centerX, centerY);
      if (wave.signature?.motion === "vertical") context.scale(0.62, 1.35);
      if (wave.signature?.motion === "horizontal") context.scale(1.35, 0.62);
      if (wave.signature?.motion === "spiral") context.rotate(progress * Math.PI * 1.6);
      context.beginPath();
      if (wave.signature?.motion === "spiral") {
        for (let angle = 0; angle < Math.PI * 4; angle += 0.15) {
          const spiralRadius = radius * angle / (Math.PI * 4);
          context.lineTo(Math.cos(angle) * spiralRadius, Math.sin(angle) * spiralRadius);
        }
      } else {
        context.arc(0, 0, radius, 0, Math.PI * 2);
      }
      context.strokeStyle = `rgba(${color.join(",")},${(1 - progress) * 0.075 * wave.strength})`;
      context.lineWidth = wave.type === "descent" ? 1.4 : 0.8;
      context.stroke();
      context.restore();
    });

    const descentProgress = state.descendingStartedAt
      ? clamp((now - state.descendingStartedAt) / 420, 0, 1)
      : 0;
    voidState.particles.forEach((particle, index) => {
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      const speed = particle.drift * (1 + activity * 2.4);
      let velocityX = Math.cos(particle.phase + now / 17000) * speed;
      let velocityY = Math.sin(particle.phase * 1.3 + now / 21000) * speed + 0.04;
      if (signature?.motion === "vertical") velocityY -= speed * 1.1;
      if (signature?.motion === "horizontal") velocityX += speed * 1.2;
      if (signature?.motion === "ripple") velocityY += Math.sin(now / 360 + index) * speed;
      const deltaX = particle.x - centerX;
      const deltaY = particle.y - centerY;
      const distance = Math.max(24, Math.hypot(deltaX, deltaY));
      if (signature?.motion === "spiral") {
        velocityX += -deltaY / distance * speed * 1.5;
        velocityY += deltaX / distance * speed * 1.5;
      }
      if (signature?.motion === "radiating") {
        velocityX += deltaX / distance * speed * 2;
        velocityY += deltaY / distance * speed * 2;
      }
      if (state.hoverAngle !== null) {
        const targetX = centerX + Math.cos(state.hoverAngle) * metrics.radius * 1.35;
        const targetY = centerY + Math.sin(state.hoverAngle) * metrics.radius * 1.35;
        velocityX += (targetX - particle.x) * 0.0008;
        velocityY += (targetY - particle.y) * 0.0008;
      }
      if (state.zone === "retreat") {
        velocityX += deltaX / distance * 0.8;
        velocityY += deltaY / distance * 0.8;
      }
      if (descentProgress > 0) {
        velocityX += (centerX - particle.x) * 0.04 * descentProgress;
        velocityY += (centerY - particle.y) * 0.04 * descentProgress;
      }
      particle.x += velocityX * deltaSeconds * 60;
      particle.y += velocityY * deltaSeconds * 60;
      particle.y -= voidState.scrollY * 0.00006 * (index % 5);
      if (particle.x < -8) particle.x = width + 8;
      if (particle.x > width + 8) particle.x = -8;
      if (particle.y < -8) particle.y = height + 8;
      if (particle.y > height + 8) particle.y = -8;
      const flicker = 0.055 + (0.5 + 0.5 * Math.sin(now / 900 + particle.phase)) * 0.07;
      const particleColor = particle.gold ? [214, 168, 75] : [83, 126, 255];
      if (activity > 0.45) {
        context.beginPath();
        context.moveTo(particle.previousX, particle.previousY);
        context.lineTo(particle.x, particle.y);
        context.strokeStyle = `rgba(${particleColor.join(",")},${flicker * activity * 0.45})`;
        context.stroke();
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(${particleColor.join(",")},${flicker})`;
      context.fill();
    });

    if (now - state.lastHeartbeatAt > 6000) {
      state.lastHeartbeatAt = now;
      addPressureWave("heartbeat", 0.48);
    }
  }

  function animate(now) {
    const deltaSeconds = clamp((now - state.lastFrameAt) / 1000, 0, 0.05);
    state.lastFrameAt = now;
    const metrics = wheelMetrics();
    const distance = updateZone(now, metrics);
    if (!reducedMotion.matches) {
      updateWheel(now, deltaSeconds, metrics, distance);
      updateNodes(now, metrics);
      drawVoid(now, deltaSeconds, metrics);
    }
    state.frameId = requestAnimationFrame(animate);
  }

  document.body.dataset.reactorZone = "idle";
  resizeVoid();
  emitSignal("idle");
  state.frameId = requestAnimationFrame(animate);
  window.addEventListener("pagehide", () => cancelAnimationFrame(state.frameId), { once: true });
}

initializeHubReactor();

if (routeLinks.length) {
  fetch("config/fibonacci-routes.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Fibonacci routes unavailable (" + response.status + ")");
      }
      return response.json();
    })
    .then((config) => {
      routeLinks.forEach((link) => {
        const lineage = resolveFibonacciRoute(
          config,
          link.dataset.fibonacciSpoke,
          link.dataset.fibonacciPath
        );
        link.href = buildFibonacciUrl(lineage, link.getAttribute("href"));
        link.addEventListener("click", () => {
          sessionStorage.setItem("threshold.fibonacci.lineage", JSON.stringify(lineage));
        });
      });
    })
    .catch((error) => {
      console.error(error);
    });
}