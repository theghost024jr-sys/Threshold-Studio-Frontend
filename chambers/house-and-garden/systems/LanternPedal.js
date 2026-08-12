import { resolveVaultPath } from '../vault/paths.js';

const CLASS = 'hag-lantern';
const DEFAULT_POSITIONS = [
  { left: '8%', bottom: '12%' },
  { left: '20%', bottom: '18%' },
  { left: '33%', bottom: '10%' },
  { left: '46%', bottom: '20%' },
  { left: '59%', bottom: '14%' },
  { left: '72%', bottom: '22%' },
  { left: '85%', bottom: '16%' },
];

export class LanternPedal {
  constructor(root, config) {
    this.root = root;
    this.config = config;
    this._container = null;
    this._lanterns = [];
    this._seedMap = new Map();
    this._animations = [];
    this._alive = false;
  }

  mount() {
    this._container = document.createElement('div');
    this._container.className = `${CLASS}-container`;
    this._container.setAttribute('aria-hidden', 'true');
    this.root.appendChild(this._container);
    this._alive = true;

    const count = Math.min(this.config.lanternCount, DEFAULT_POSITIONS.length);
    for (let index = 0; index < count; index += 1) {
      const element = document.createElement('div');
      element.className = CLASS;
      element.dataset.lanternId = `lantern-${index}`;
      Object.assign(element.style, DEFAULT_POSITIONS[index], { position: 'absolute' });

      const glowElement = document.createElement('div');
      glowElement.className = `${CLASS}__glow`;
      glowElement.style.backgroundImage = `url(${resolveVaultPath('hag:lantern:glow-sprite')})`;

      const pedalElement = document.createElement('img');
      pedalElement.className = `${CLASS}__pedal`;
      pedalElement.src = resolveVaultPath('hag:lantern:pedal-idle');
      pedalElement.alt = '';

      element.append(glowElement, pedalElement);
      this._container.appendChild(element);
      const lantern = {
        el: element,
        id: `lantern-${index}`,
        lit: false,
        glowEl: glowElement,
        pedalEl: pedalElement,
      };
      this._lanterns.push(lantern);
      this._startSway(lantern, index);
    }
  }

  illuminate(seedId) {
    const index = this._seedMap.has(seedId)
      ? this._seedMap.get(seedId)
      : this._lanterns.findIndex((lantern) => !lantern.lit);
    if (index === -1) return;

    const lantern = this._lanterns[index];
    if (!lantern || lantern.lit) return;
    this._seedMap.set(seedId, index);
    lantern.lit = true;
    lantern.pedalEl.src = resolveVaultPath('hag:lantern:pedal-lit');
    lantern.el.classList.add(`${CLASS}--lit`);
    this._pulseGlow(lantern.glowEl);
  }

  extinguishAll() {
    this._lanterns.forEach((lantern) => {
      lantern.lit = false;
      lantern.pedalEl.src = resolveVaultPath('hag:lantern:pedal-idle');
      lantern.el.classList.remove(`${CLASS}--lit`);
      lantern.glowEl.style.opacity = '0';
    });
    this._seedMap.clear();
  }

  destroy() {
    this._alive = false;
    this._animations.forEach((id) => cancelAnimationFrame(id));
    this._container?.remove();
  }

  _startSway(lantern, index) {
    const period = 2800 + index * 340;
    const amplitude = 3 + (index % 3);
    const phase = index * (Math.PI / 3);
    const animate = (timestamp) => {
      if (!this._alive) return;
      const angle = amplitude * Math.sin((timestamp / period) * Math.PI * 2 + phase);
      lantern.el.style.transform = `rotate(${angle}deg)`;
      this._animations[index] = requestAnimationFrame(animate);
    };
    this._animations[index] = requestAnimationFrame(animate);
  }

  _pulseGlow(glowElement) {
    let start = null;
    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / 800, 1);
      const opacity = progress < 0.3
        ? progress / 0.3
        : 1 - (progress - 0.3) / 0.7;
      glowElement.style.opacity = opacity.toFixed(3);
      if (progress < 1) requestAnimationFrame(step);
      else glowElement.style.opacity = '0.45';
    };
    requestAnimationFrame(step);
  }
}