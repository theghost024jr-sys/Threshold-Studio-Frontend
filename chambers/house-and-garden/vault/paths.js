const BASE =
  (typeof process !== 'undefined' && process.env?.HAG_VAULT_BASE) ||
  '/vault/house-and-garden';

export const VAULT_PATHS = {
  'hag:env:meadow-bg': 'environments/meadow/background.webp',
  'hag:env:meadow-mid': 'environments/meadow/midground.webp',
  'hag:env:meadow-fore': 'environments/meadow/foreground.webp',
  'hag:env:shore-bg': 'environments/shore/background.webp',
  'hag:env:shore-mid': 'environments/shore/midground.webp',
  'hag:env:shore-fore': 'environments/shore/foreground.webp',
  'hag:env:house-exterior': 'environments/house/exterior.webp',
  'hag:env:house-interior': 'environments/house/interior.webp',
  'hag:fog:texture-a': 'effects/fog/texture-a.webp',
  'hag:fog:texture-b': 'effects/fog/texture-b.webp',
  'hag:fog:mask': 'effects/fog/mask.svg',
  'hag:lantern:glow-sprite': 'elements/lantern/glow-sprite.webp',
  'hag:lantern:pedal-idle': 'elements/lantern/pedal-idle.webp',
  'hag:lantern:pedal-lit': 'elements/lantern/pedal-lit.webp',
  'hag:lantern:swing-anim': 'elements/lantern/swing.json',
  'hag:seed:packet-closed': 'elements/seeds/packet-closed.webp',
  'hag:seed:packet-open': 'elements/seeds/packet-open.webp',
  'hag:seed:reveal-burst': 'elements/seeds/reveal-burst.webp',
  'hag:seed:data': 'data/seeds.json',
  'hag:root:manifest': 'data/root-archive-manifest.json',
  'hag:root:icon-set': 'elements/root/icons.svg',
  'hag:audio:meadow-pulse': 'audio/meadow-pulse.ogg',
  'hag:audio:shore-pulse': 'audio/shore-pulse.ogg',
  'hag:audio:seed-chime': 'audio/seed-chime.ogg',
  'hag:audio:lantern-ignite': 'audio/lantern-ignite.ogg',
  'hag:contrib:form-bg': 'contribution/form-background.webp',
  'hag:contrib:icon-submit': 'contribution/icon-submit.svg',
  'hag:contrib:icon-cancel': 'contribution/icon-cancel.svg',
};

export function registerVaultPaths(store) {
  for (const [key, relativePath] of Object.entries(VAULT_PATHS)) {
    store.vaultSet(key, `${BASE}/${relativePath}`);
  }
}

export function resolveVaultPath(key) {
  const relativePath = VAULT_PATHS[key];
  if (!relativePath) {
    throw new Error(`[HouseAndGarden] Unknown vault key: "${key}"`);
  }
  return `${BASE}/${relativePath}`;
}