import { resolveVaultPath } from '../vault/paths.js';

export class RootArchive {
  constructor(store, eventBus) {
    this.store = store;
    this.eventBus = eventBus;
    this._entries = [];
    this._index = new Map();
    this._ready = false;
  }

  async hydrate() {
    if (this._ready) return;

    try {
      const response = await fetch(resolveVaultPath('hag:root:manifest'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this._ingest(await response.json());
    } catch (error) {
      console.warn('[RootArchive] Manifest fetch failed; using empty archive.', error);
      this._ingest({ entries: [], meta: {} });
    }

    this._ready = true;
    this.store.set('hag:rootArchive:ready', true);
    this.store.set('hag:rootArchive:entries', [...this._entries]);
    this.eventBus.emit('rootArchive:ready', { count: this._entries.length });
  }

  getEntry(id) {
    return this._index.get(id) ?? null;
  }

  query(filters = {}) {
    return this._entries.filter((entry) =>
      Object.entries(filters).every(([key, value]) =>
        key === 'tag' ? entry.tags?.includes(value) : entry[key] === value,
      ),
    );
  }

  addEntry(entry) {
    const normalized = this._normalize(entry);
    this._entries.push(normalized);
    this._index.set(normalized.id, normalized);
    this.store.set('hag:rootArchive:entries', [...this._entries]);
    this.eventBus.emit('rootArchive:entryAdded', { entry: normalized });
    return normalized;
  }

  destroy() {
    this._ready = false;
  }

  _ingest({ entries = [], meta = {} }) {
    this._entries = entries.map((entry) => this._normalize(entry));
    this._index.clear();
    this._entries.forEach((entry) => this._index.set(entry.id, entry));
    if (meta.season) this.store.set('hag:rootArchive:season', meta.season);
    if (meta.cycleYear) this.store.set('hag:rootArchive:cycleYear', meta.cycleYear);
  }

  _normalize(raw) {
    return {
      id: raw.id ?? `entry-${Math.random().toString(36).slice(2)}`,
      name: raw.name ?? 'Unnamed Plant',
      category: raw.category ?? 'uncategorized',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      season: raw.season ?? null,
      contributor: raw.contributor ?? null,
      notes: raw.notes ?? raw.note ?? '',
      createdAt: raw.createdAt ?? new Date().toISOString(),
      seedIds: Array.isArray(raw.seedIds) ? raw.seedIds : [],
      lineage: Array.isArray(raw.lineage) ? raw.lineage : [],
    };
  }
}