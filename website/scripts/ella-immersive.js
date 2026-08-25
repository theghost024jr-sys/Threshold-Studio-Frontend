import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";
import { glyphSystem } from "./glyph-system.js";

const stage = document.querySelector("[data-ella-stage]");
const canvas = document.querySelector("#ella-world");
const signalHost = document.querySelector("#ella-signal");
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

  const portraitDepth = -3.8;
  const portrait = new THREE.Mesh(
    new THREE.PlaneGeometry(2 / 3, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, fog: true, transparent: true, opacity: 0 }),
  );
  portrait.position.z = portraitDepth;
  portrait.renderOrder = -2;
  scene.add(portrait);

  new THREE.TextureLoader().load(
    "/assets/beyond/Ella.png",
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      portrait.material.map = texture;
      portrait.material.opacity = 1;
      portrait.material.needsUpdate = true;
      document.body.classList.add("is-25d-ready");
    },
    undefined,
    () => {
      scene.remove(portrait);
    },
  );

  let randomSeed = 48271;
  function seededRandom() {
    randomSeed = (randomSeed * 16807) % 2147483647;
    return (randomSeed - 1) / 2147483646;
  }

  function createSnowLayer({ count, depth, size, opacity, spread }) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (seededRandom() - 0.5) * spread;
      positions[index * 3 + 1] = (seededRandom() - 0.5) * spread;
      positions[index * 3 + 2] = depth + (seededRandom() - 0.5) * 0.8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xf4f1e8,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const layer = new THREE.Points(geometry, material);
    scene.add(layer);
    return layer;
  }

  const snowLayers = [
    { object: createSnowLayer({ count: 110, depth: -2.4, size: 0.025, opacity: 0.28, spread: 17 }), factor: 0.08 },
    { object: createSnowLayer({ count: 80, depth: 0.8, size: 0.045, opacity: 0.5, spread: 15 }), factor: 0.2 },
    { object: createSnowLayer({ count: 42, depth: 3.6, size: 0.085, opacity: 0.68, spread: 13 }), factor: 0.42 },
  ];

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

  const signalGlyph = signalHost
    ? glyphSystem.mount(signalHost, {
        glyphId: "field-signal",
        flowerId: "ella-field",
        identityVectorId: "ella",
        signals,
      })
    : null;
  let animationFrame = 0;
  const pointer = new THREE.Vector2();
  const targetPointer = new THREE.Vector2();
  const clock = new THREE.Clock();

  function setSignal(name, value) {
    signals[name] = value;
    signalGlyph?.update(signals);
    stage.style.setProperty(`--${name}`, typeof value === "number" ? value : Number(value));
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const portraitDistance = camera.position.z - portraitDepth;
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * portraitDistance;
    const visibleWidth = visibleHeight * camera.aspect;
    portrait.scale.setScalar(visibleHeight * 1.02);
    portrait.userData.baseX = camera.aspect > 0.9 ? visibleWidth * 0.17 : 0;
    portrait.position.x = portrait.userData.baseX;
  }

  function updatePointer(event) {
    targetPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetPointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    setSignal("resonance", Math.min(1, 0.35 + Math.abs(targetPointer.x) * 0.5));
    setSignal("drift", Math.min(1, Math.hypot(targetPointer.x, targetPointer.y) * 0.55));
  }

  function render() {
    animationFrame = window.requestAnimationFrame(render);
    const elapsed = clock.getElapsedTime();
    pointer.lerp(targetPointer, 0.035);

    if (!reduceMotion.matches) {
      world.rotation.z = elapsed * 0.025;
      world.rotation.x = -0.08 + pointer.y * 0.08;
      world.rotation.y = pointer.x * 0.12;
      portrait.position.x = portrait.userData.baseX + pointer.x * 0.16;
      portrait.position.y = pointer.y * 0.09;
      snowLayers.forEach(({ object, factor }, index) => {
        object.position.x = pointer.x * factor;
        object.position.y = pointer.y * factor * 0.55 - (elapsed * (0.018 + index * 0.012)) % 1.4;
      });
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
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", updatePointer, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else {
      clock.getDelta();
      render();
    }
  });

  resize();
  setSignal("resonance", signals.resonance);
  setSignal("drift", signals.drift);
  setSignal("anchored", signals.anchored);
  render();
}