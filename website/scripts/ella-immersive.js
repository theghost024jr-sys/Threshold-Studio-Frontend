import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

const stage = document.querySelector("[data-ella-stage]");
const canvas = document.querySelector("#ella-world");
const signalCanvas = document.querySelector("#ella-signal");
const signalStatus = document.querySelector("#signal-status");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (stage && canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07100d, 0.068);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.4, 12);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x07100d, 0);

  const world = new THREE.Group();
  scene.add(world);

  const flowerPoints = [];
  const nodeCount = 144;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < nodeCount; index += 1) {
    const progress = index / (nodeCount - 1);
    const radius = 0.28 + progress * 4.15;
    const angle = index * goldenAngle;
    const depth = Math.sin(index * 0.47) * 0.32 - progress * 0.45;
    flowerPoints.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        depth,
      ),
    );
  }

  const flowerGeometry = new THREE.BufferGeometry().setFromPoints(flowerPoints);
  const flowerMaterial = new THREE.PointsMaterial({
    color: 0xd5e3c2,
    size: 0.075,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flower = new THREE.Points(flowerGeometry, flowerMaterial);
  flower.rotation.x = -0.16;
  world.add(flower);

  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x88a991,
    transparent: true,
    opacity: 0.22,
  });

  [1.55, 2.65, 4.05].forEach((radius, index) => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.62);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(128));
    const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    orbit.rotation.set(0.58 + index * 0.12, index * 0.38, index * 0.48);
    world.add(orbit);
  });

  const anchorGeometry = new THREE.IcosahedronGeometry(0.19, 1);
  const anchorMaterial = new THREE.MeshBasicMaterial({ color: 0xf0c98b });
  const anchors = Array.from({ length: 5 }, (_, index) => {
    const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor.userData = {
      angle: (index / 5) * Math.PI * 2,
      radius: 2.2 + (index % 2) * 1.15,
      speed: 0.08 + index * 0.008,
    };
    world.add(anchor);
    return anchor;
  });

  const signals = {
    resonance: 0.42,
    drift: 0.18,
    anchored: true,
  };

  let riveInstance = null;
  let riveInputs = {};
  let fallbackFrame = 0;
  const pointer = new THREE.Vector2();
  const targetPointer = new THREE.Vector2();
  const clock = new THREE.Clock();

  function setSignal(name, value) {
    signals[name] = value;
    const input = riveInputs[name];
    if (input) input.value = value;
    stage.style.setProperty(`--${name}`, typeof value === "number" ? value : Number(value));
  }

  async function mountRive() {
    const source = signalCanvas?.dataset.riveSrc;
    const stateMachine = signalCanvas?.dataset.riveStateMachine || "Threshold Signals";

    if (!signalCanvas || !source) {
      signalStatus.textContent = "Live field";
      return;
    }

    try {
      const { Rive, Layout, Fit, Alignment } = await import(
        "https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.31.5/+esm"
      );
      riveInstance = new Rive({
        src: source,
        canvas: signalCanvas,
        stateMachines: stateMachine,
        autoplay: true,
        layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
        onLoad: () => {
          const inputs = riveInstance.stateMachineInputs(stateMachine);
          riveInputs = Object.fromEntries(inputs.map((input) => [input.name, input]));
          Object.entries(signals).forEach(([name, value]) => setSignal(name, value));
          riveInstance.resizeDrawingSurfaceToCanvas();
          signalStatus.textContent = "Rive linked";
        },
      });
    } catch (error) {
      console.warn("Ella signal layer could not load Rive.", error);
      signalStatus.textContent = "Field fallback";
    }
  }

  function drawFallbackSignal(time) {
    if (!signalCanvas || riveInstance) return;
    const context = signalCanvas.getContext("2d");
    const size = signalCanvas.width;
    const center = size / 2;
    context.clearRect(0, 0, size, size);
    context.strokeStyle = "rgba(213, 227, 194, 0.72)";
    context.lineWidth = 1.5;

    for (let ring = 0; ring < 3; ring += 1) {
      const pulse = reduceMotion.matches ? 0 : Math.sin(time * 0.0015 + ring) * 3;
      context.beginPath();
      context.arc(center, center, 18 + ring * 13 + pulse, 0, Math.PI * 2);
      context.stroke();
    }

    context.fillStyle = "#f0c98b";
    context.beginPath();
    context.arc(center, center, 5 + signals.resonance * 3, 0, Math.PI * 2);
    context.fill();
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    riveInstance?.resizeDrawingSurfaceToCanvas();
  }

  function updatePointer(event) {
    targetPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetPointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    setSignal("resonance", Math.min(1, 0.35 + Math.abs(targetPointer.x) * 0.5));
    setSignal("drift", Math.min(1, Math.hypot(targetPointer.x, targetPointer.y) * 0.45));
  }

  function render(time = 0) {
    fallbackFrame = window.requestAnimationFrame(render);
    const elapsed = clock.getElapsedTime();
    pointer.lerp(targetPointer, 0.035);

    if (!reduceMotion.matches) {
      world.rotation.z = elapsed * 0.025;
      world.rotation.x = -0.08 + pointer.y * 0.08;
      world.rotation.y = pointer.x * 0.12;
    }

    anchors.forEach((anchor, index) => {
      const motion = reduceMotion.matches ? 0 : elapsed * anchor.userData.speed;
      const angle = anchor.userData.angle + motion;
      anchor.position.set(
        Math.cos(angle) * anchor.userData.radius,
        Math.sin(angle) * anchor.userData.radius * 0.62,
        Math.sin(angle * 1.7 + index) * 0.6,
      );
      anchor.scale.setScalar(0.82 + signals.resonance * 0.32);
    });

    flowerMaterial.opacity = 0.62 + signals.resonance * 0.28;
    renderer.render(scene, camera);
    drawFallbackSignal(time);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", updatePointer, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(fallbackFrame);
    } else {
      clock.getDelta();
      render();
    }
  });

  resize();
  setSignal("resonance", signals.resonance);
  setSignal("drift", signals.drift);
  setSignal("anchored", signals.anchored);
  mountRive();
  render();
}