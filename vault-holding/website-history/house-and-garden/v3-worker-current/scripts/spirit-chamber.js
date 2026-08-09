const ORIENTATION_LINE = {
  cindervox: 'Fire · Ignition · Clarifying Rupture',
  porpoise: 'Water · Flow · Emotional Conductivity',
  whisperhawk: 'Air · Perspective · Pattern Lift',
  stonecat: 'Earth · Grounding · Structural Truth',
  lumenstag: 'Light · Alignment · Signal Illumination'
};

const SPIRIT_THEME = {
  cindervox: {
    background: 'linear-gradient(180deg, #140b0c 0%, #2a1011 45%, #3b1919 100%)',
    panel: 'rgba(16, 10, 10, 0.58)',
    border: 'rgba(246, 236, 224, 0.22)',
    text: '#f6ece0',
    accent: '#ffd2a4',
    shadow: 'rgba(255, 161, 102, 0.18)'
  },
  porpoise: {
    background: 'linear-gradient(180deg, #0b1625 0%, #13243d 45%, #1d3a54 100%)',
    panel: 'rgba(10, 16, 28, 0.58)',
    border: 'rgba(238, 246, 255, 0.24)',
    text: '#eef6ff',
    accent: '#b8e2ff',
    shadow: 'rgba(129, 198, 255, 0.18)'
  },
  whisperhawk: {
    background: 'linear-gradient(180deg, #10131d 0%, #1d2434 45%, #2a3348 100%)',
    panel: 'rgba(14, 18, 28, 0.58)',
    border: 'rgba(242, 244, 250, 0.24)',
    text: '#f2f4fa',
    accent: '#d6ddff',
    shadow: 'rgba(177, 194, 255, 0.18)'
  }
};

function spiritIdFromPage() {
  return String(document.body.dataset.spirit || '').trim().toLowerCase();
}

function resolveSpirit(manifest, spiritId) {
  const spirits = Array.isArray(manifest && manifest.spirits) ? manifest.spirits : [];
  return spirits.find((entry) => String(entry && entry.id || '').toLowerCase() === spiritId) || null;
}

function buildImageCandidates(spirit) {
  const variants = Array.isArray(spirit && spirit.variants) ? spirit.variants : [];
  const candidates = [];

  variants.forEach((variant) => {
    if (variant && variant.webPath) {
      candidates.push({
        src: variant.webPath,
        label: variant.label || 'variant',
        sourcePath: variant.sourcePath || ''
      });
    }
  });

  if (spirit && spirit.preview) {
    candidates.unshift({
      src: spirit.preview,
      label: 'preview',
      sourcePath: ''
    });
  }

  const seen = new Set();
  return candidates.filter((item) => {
    const key = String(item && item.src || '').toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function applyTheme(spiritId) {
  const theme = SPIRIT_THEME[spiritId] || SPIRIT_THEME.cindervox;
  document.body.style.background = theme.background;
  document.body.style.color = theme.text;

  const shell = document.querySelector('[data-spirit-shell]');
  if (shell) {
    shell.style.background = theme.panel;
    shell.style.borderColor = theme.border;
    shell.style.boxShadow = `0 24px 90px -46px ${theme.shadow}`;
  }

  document.querySelectorAll('a').forEach((anchor) => {
    anchor.style.color = theme.accent;
  });
}

function setStatus(text) {
  const status = document.querySelector('[data-spirit-status]');
  if (status) {
    status.textContent = text;
  }
}

function renderSpirit(spirit) {
  document.title = `Threshold Studio - ${spirit.name}`;

  const title = document.querySelector('[data-spirit-title]');
  const orientation = document.querySelector('[data-spirit-orientation]');
  const path = document.querySelector('[data-spirit-path]');
  const variants = document.querySelector('[data-spirit-variants]');
  const image = document.querySelector('[data-spirit-image]');
  const note = document.querySelector('[data-spirit-note]');

  if (title) {
    title.textContent = spirit.name;
  }

  if (orientation) {
    orientation.textContent = ORIENTATION_LINE[spirit.id] || `${spirit.element} orientation`;
  }

  if (variants) {
    const count = Array.isArray(spirit.variants) ? spirit.variants.length : 0;
    variants.textContent = `${spirit.element} chamber node · ${count} vault variant${count === 1 ? '' : 's'}`;
  }

  if (note) {
    if (spirit.note && spirit.note.exists && spirit.note.obsidianUrl) {
      note.href = spirit.note.obsidianUrl;
      note.removeAttribute('aria-disabled');
    } else {
      note.removeAttribute('href');
      note.setAttribute('aria-disabled', 'true');
    }
  }

  const candidates = buildImageCandidates(spirit);
  if (!image || !candidates.length) {
    if (path) {
      path.textContent = 'Vault -> PNG missing';
    }
    setStatus('Spirit image missing from manifest candidates.');
    return;
  }

  let pointer = 0;
  const tryNext = () => {
    if (pointer >= candidates.length) {
      image.removeAttribute('src');
      image.alt = `${spirit.name} image missing`;
      if (path) {
        path.textContent = 'Vault -> PNG missing';
      }
      setStatus('No manifest image candidate loaded successfully.');
      return;
    }

    const choice = candidates[pointer];
    pointer += 1;

    image.onerror = tryNext;
    image.onload = () => {
      image.onerror = null;
      image.onload = null;
      image.alt = `${spirit.name} spirit form`;
      if (path) {
        path.textContent = choice.sourcePath || choice.src;
      }
      setStatus('Spirit form linked from the vault manifest.');
    };

    image.src = choice.src;
  };

  tryNext();
}

async function init() {
  const spiritId = spiritIdFromPage();
  applyTheme(spiritId);
  setStatus('Linking spirit form from vault manifest...');

  let manifest = null;
  try {
    const response = await fetch('data/mythology-assets.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Manifest load failed: ${response.status}`);
    }
    manifest = await response.json();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Manifest load failed.');
    return;
  }

  const spirit = resolveSpirit(manifest, spiritId);
  if (!spirit) {
    setStatus(`Spirit "${spiritId}" not found in mythology manifest.`);
    return;
  }

  renderSpirit(spirit);
}

init();