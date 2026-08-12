import { resolveVaultPath } from '../vault/paths.js';

const CLASS = 'hag-seed';
const REVEAL_MS = 750;
const STAGGER_MS = 120;

export class GardenSeedReveal {
  constructor(root, store, eventBus, config) {
    this.root = root;
    this.store = store;
    this.eventBus = eventBus;
    this.config = config;
    this._container = null;
    this._seeds = [];
    this._seedMap = new Map();
    this._timers = new Set();
  }

  mount() {
    this._container = document.createElement('div');
    this._container.className = `${CLASS}-grid`;
    this.root.appendChild(this._container);
    this._loadManifest();
  }

  revealById(seedId) {
    const seed = this._seedMap.get(seedId);
    if (seed?.state === 'ready') this._triggerReveal(seed);
  }

  resetAll() {
    this._clearTimers();
    this._seeds.forEach((seed) => this._setSeedState(seed, 'dormant'));
  }

  destroy() {
    this._clearTimers();
    this._container?.remove();
  }

  async _loadManifest() {
    let seeds;
    try {
      const response = await fetch(resolveVaultPath('hag:seed:data'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      seeds = Array.isArray(data.seeds) ? data.seeds : [];
    } catch (error) {
      console.warn('[GardenSeedReveal] Seed manifest unavailable; using placeholders.', error);
      seeds = GardenSeedReveal._placeholders();
    }
    this._buildSeeds(seeds);
    this._staggerReady();
  }

  _buildSeeds(seedDataArray) {
    seedDataArray.forEach((data, index) => {
      const id = data.id ?? `seed-${index}`;
      const element = document.createElement('div');
      element.className = CLASS;
      element.dataset.seedId = id;

      const burstElement = document.createElement('div');
      burstElement.className = `${CLASS}__burst`;
      burstElement.style.backgroundImage = `url(${resolveVaultPath('hag:seed:reveal-burst')})`;

      const packetButton = document.createElement('button');
      packetButton.className = `${CLASS}__packet`;
      packetButton.setAttribute('aria-label', `Reveal seed: ${data.name ?? id}`);

      const image = document.createElement('img');
      image.className = `${CLASS}__img`;
      image.src = resolveVaultPath('hag:seed:packet-closed');
      image.alt = '';
      packetButton.appendChild(image);

      const contentElement = document.createElement('div');
      contentElement.className = `${CLASS}__content`;
      contentElement.setAttribute('aria-live', 'polite');
      element.append(burstElement, packetButton, contentElement);
      this._container.appendChild(element);

      const seed = {
        id,
        state: 'dormant',
        el: element,
        packetBtn: packetButton,
        contentEl: contentElement,
        burstEl: burstElement,
        img: image,
        data,
      };
      this._seeds.push(seed);
      this._seedMap.set(id, seed);
      this._setSeedState(seed, 'dormant');
      packetButton.addEventListener('click', () => this._triggerReveal(seed));
    });
  }

  _staggerReady() {
    this._seeds.forEach((seed, index) => {
      this._schedule(() => {
        this._setSeedState(seed, 'ready');
        if (this.config.seedAutoReveal) {
          this._schedule(() => this._triggerReveal(seed), 800 + index * 600);
        }
      }, index * STAGGER_MS);
    });
  }

  _triggerReveal(seed) {
    if (seed.state !== 'ready') return;
    this._setSeedState(seed, 'revealing');
    seed.burstEl.classList.add(`${CLASS}__burst--active`);
    this._schedule(() => {
      seed.img.src = resolveVaultPath('hag:seed:packet-open');
    }, REVEAL_MS * 0.45);
    this._schedule(() => {
      seed.burstEl.classList.remove(`${CLASS}__burst--active`);
      this._injectContent(seed);
      this._setSeedState(seed, 'revealed');
      this.store.set(`hag:seed:${seed.id}:revealed`, true);
      this.eventBus.emit('seed:revealed', { seedId: seed.id, data: seed.data });
    }, REVEAL_MS);
  }

  _injectContent(seed) {
    const data = seed.data;
    seed.contentEl.innerHTML = `
      <h3 class="${CLASS}__name">${GardenSeedReveal._esc(data.name ?? seed.id)}</h3>
      ${data.family ? `<p class="${CLASS}__family">${GardenSeedReveal._esc(data.family)}</p>` : ''}
      ${data.note ? `<p class="${CLASS}__note">${GardenSeedReveal._esc(data.note)}</p>` : ''}
      ${data.contributor ? `<p class="${CLASS}__contrib">${GardenSeedReveal._esc(data.contributor)}</p>` : ''}
    `.trim();
  }

  _setSeedState(seed, state) {
    seed.state = state;
    seed.el.dataset.state = state;
    seed.packetBtn.disabled = state !== 'ready';
  }

  _schedule(callback, delay) {
    const timer = setTimeout(() => {
      this._timers.delete(timer);
      callback();
    }, delay);
    this._timers.add(timer);
  }

  _clearTimers() {
    this._timers.forEach((timer) => clearTimeout(timer));
    this._timers.clear();
  }

  static _esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static _placeholders() {
    return [
      { id: 'seed-placeholder-1', name: 'Morning Fern', family: 'Polypodiaceae', note: 'Unfurls at first light.' },
      { id: 'seed-placeholder-2', name: 'Ember Clover', family: 'Fabaceae', note: 'Warm-season perennial.' },
      { id: 'seed-placeholder-3', name: 'Shore Verbena', family: 'Verbenaceae', note: 'Salt-tolerant groundcover.' },
      { id: 'seed-placeholder-4', name: 'Meadow Campion', family: 'Caryophyllaceae', note: 'Attracts pollinators.' },
    ];
  }
}