export class PulseEngine {
  constructor(eventBus, config) {
    this.eventBus = eventBus;
    this.config = config;
    this._zones = {
      meadow: { tick: 0, interval: null, phaseOffset: 0, multiplier: 1 },
      shore: { tick: 0, interval: null, phaseOffset: 1400, multiplier: 1.35 },
    };
    this._running = false;
    this._shoreStartTimer = null;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._startZone('meadow');
    this._shoreStartTimer = setTimeout(() => {
      this._shoreStartTimer = null;
      if (this._running) this._startZone('shore');
    }, this._zones.shore.phaseOffset);
  }

  stop() {
    this._running = false;
    clearTimeout(this._shoreStartTimer);
    this._shoreStartTimer = null;
    Object.keys(this._zones).forEach((name) => this._stopZone(name));
  }

  trigger(type, payload = {}) {
    this.eventBus.emit(`pulse:${type}`, { type, ts: Date.now(), ...payload });
  }

  syncZone(zoneName, sourceData) {
    const zone = this._zones[zoneName];
    if (!zone || !this._running) return;
    this._stopZone(zoneName);
    this._startZone(zoneName);
    this.eventBus.emit(`pulse:${zoneName}:synced`, { zoneName, sourceData });
  }

  setRate(zoneName, multiplier) {
    const zone = this._zones[zoneName];
    if (!zone || !Number.isFinite(multiplier) || multiplier <= 0) return;
    zone.multiplier = multiplier;
    if (this._running && zone.interval) {
      this._stopZone(zoneName);
      this._startZone(zoneName);
    }
  }

  pauseZone(zoneName) {
    this._stopZone(zoneName);
  }

  resumeZone(zoneName) {
    if (this._running && this._zones[zoneName] && !this._zones[zoneName].interval) {
      this._startZone(zoneName);
    }
  }

  destroy() {
    this.stop();
  }

  _startZone(name) {
    const zone = this._zones[name];
    if (!zone || zone.interval) return;
    const intervalMs = Math.round(this.config.pulseInterval * zone.multiplier);
    zone.interval = setInterval(() => {
      zone.tick += 1;
      this.eventBus.emit(`pulse:${name}`, {
        zone: name,
        tick: zone.tick,
        ts: Date.now(),
        phase: this._computePhase(zone.tick),
      });
    }, intervalMs);
  }

  _stopZone(name) {
    const zone = this._zones[name];
    if (zone?.interval) {
      clearInterval(zone.interval);
      zone.interval = null;
    }
  }

  _computePhase(tick) {
    return (tick % 4) / 4;
  }
}