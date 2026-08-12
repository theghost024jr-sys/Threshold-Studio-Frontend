import { registerVaultPaths } from './vault/paths.js';
import { FogOverlay } from './systems/FogOverlay.js';
import { RootArchive } from './systems/RootArchive.js';
import { LanternPedal } from './systems/LanternPedal.js';
import { GardenSeedReveal } from './systems/GardenSeedReveal.js';
import { PulseEngine } from './systems/PulseEngine.js';
import { ContributionChamber } from './contribution/ContributionChamber.js';

export class HouseAndGardenChamber {
  constructor({ root, store, eventBus, config = {} }) {
    this.root = root;
    this.store = store;
    this.eventBus = eventBus;
    this.config = { ...HouseAndGardenChamber.DEFAULTS, ...config };
    this._systems = {};
    this._initialized = false;
  }

  static get DEFAULTS() {
    return {
      fogEnabled: true,
      seedAutoReveal: false,
      pulseInterval: 4000,
      lanternCount: 7,
      contributionOpen: true,
    };
  }

  async init() {
    if (this._initialized) return;

    registerVaultPaths(this.store);
    this._systems.fog = new FogOverlay(this.root, this.config);
    this._systems.rootArchive = new RootArchive(this.store, this.eventBus);
    this._systems.lantern = new LanternPedal(this.root, this.config);
    this._systems.seedReveal = new GardenSeedReveal(
      this.root,
      this.store,
      this.eventBus,
      this.config,
    );
    this._systems.pulse = new PulseEngine(this.eventBus, this.config);
    this._systems.contribution = new ContributionChamber(
      this.root,
      this.store,
      this.eventBus,
      this.config,
    );

    await this._systems.rootArchive.hydrate();
    this._systems.fog.mount();
    this._systems.lantern.mount();
    this._systems.seedReveal.mount();
    this._systems.contribution.mount();
    this._systems.pulse.start();
    this._bindEvents();

    this._initialized = true;
    this.eventBus.emit('chamber:ready', { id: 'house-and-garden' });
  }

  _bindEvents() {
    const { eventBus } = this;

    eventBus.on('seed:revealed', ({ seedId }) => {
      this._systems.pulse.trigger('seed', { seedId });
      this._systems.lantern.illuminate(seedId);
    });

    eventBus.on('contribution:open', () => {
      this._systems.fog.setDensity(0.3);
    });

    eventBus.on('contribution:close', () => {
      this._systems.fog.setDensity(1.0);
    });

    eventBus.on('rootArchive:addEntry', ({ entry }) => {
      this._systems.rootArchive.addEntry(entry);
    });

    eventBus.on('pulse:align', () => {
      this._systems.pulse.syncZone('shore', { source: 'align' });
    });
  }

  destroy() {
    this._systems.pulse?.stop();
    Object.values(this._systems).forEach((system) => system.destroy?.());
    this.eventBus.emit('chamber:destroyed', { id: 'house-and-garden' });
    this._initialized = false;
  }
}