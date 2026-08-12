import { resolveVaultPath } from '../vault/paths.js';

const CLASS = 'hag-fog';

export class FogOverlay {
  constructor(root, config) {
    this.root = root;
    this.config = config;
    this._el = null;
    this._canvases = {};
    this._ctxs = {};
    this._textures = {};
    this._density = 1;
    this._offsets = { a: 0, b: 0 };
    this._raf = null;
    this._alive = false;
    this._boundSyncSize = this._syncSize.bind(this);
    this._boundTick = this._tick.bind(this);
  }

  mount() {
    if (!this.config.fogEnabled) return;

    this._el = document.createElement('div');
    this._el.className = CLASS;
    this._el.setAttribute('aria-hidden', 'true');

    ['a', 'b'].forEach((layer) => {
      const canvas = document.createElement('canvas');
      canvas.className = `${CLASS}__layer`;
      canvas.dataset.layer = layer;
      this._el.appendChild(canvas);
      this._canvases[layer] = canvas;
      this._ctxs[layer] = canvas.getContext('2d');
    });

    this.root.appendChild(this._el);
    this._alive = true;
    this._loadTextures().then(() => {
      if (!this._alive) return;
      this._syncSize();
      window.addEventListener('resize', this._boundSyncSize);
      this._tick();
    });
  }

  setDensity(target, ms = 600) {
    const boundedTarget = Math.max(0, Math.min(1, target));
    const start = performance.now();
    const initialDensity = this._density;
    const delta = boundedTarget - initialDensity;

    const step = (now) => {
      const progress = Math.min((now - start) / ms, 1);
      this._density = initialDensity + delta * FogOverlay._easeInOut(progress);
      if (progress < 1 && this._alive) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  destroy() {
    this._alive = false;
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._boundSyncSize);
    this._el?.remove();
  }

  async _loadTextures() {
    const load = (key) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = resolveVaultPath(key);
      });

    try {
      [this._textures.a, this._textures.b] = await Promise.all([
        load('hag:fog:texture-a'),
        load('hag:fog:texture-b'),
      ]);
    } catch (error) {
      console.warn('[FogOverlay] Texture load failed; using solid fallback.', error);
    }
  }

  _syncSize() {
    const { width, height } = this.root.getBoundingClientRect();
    ['a', 'b'].forEach((layer) => {
      this._canvases[layer].width = width;
      this._canvases[layer].height = height;
    });
  }

  _tick() {
    if (!this._alive) return;
    const widthA = this._canvases.a.width || 1;
    const widthB = this._canvases.b.width || 1;
    this._offsets.a = (this._offsets.a + 0.15) % widthA;
    this._offsets.b = (this._offsets.b - 0.08 + widthB) % widthB;
    this._drawLayer('a', 0.55 * this._density, this._offsets.a);
    this._drawLayer('b', 0.35 * this._density, this._offsets.b);
    this._raf = requestAnimationFrame(this._boundTick);
  }

  _drawLayer(layer, alpha, offsetX) {
    const context = this._ctxs[layer];
    const { width, height } = this._canvases[layer];
    context.clearRect(0, 0, width, height);
    context.globalAlpha = alpha;
    const texture = this._textures[layer];

    if (texture) {
      const textureWidth = texture.naturalWidth;
      const firstX = offsetX % textureWidth;
      for (let x = firstX - textureWidth; x < width + textureWidth; x += textureWidth) {
        context.drawImage(texture, x, 0, textureWidth, height);
      }
    } else {
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(200,220,210,0.6)');
      gradient.addColorStop(0.5, 'rgba(180,205,195,0.3)');
      gradient.addColorStop(1, 'rgba(200,220,210,0.6)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    }
    context.globalAlpha = 1;
  }

  static _easeInOut(value) {
    return value < 0.5 ? 2 * value * value : -1 + (4 - 2 * value) * value;
  }
}