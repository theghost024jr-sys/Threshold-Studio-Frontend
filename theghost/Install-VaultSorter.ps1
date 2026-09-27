<#
.SYNOPSIS
    Installs the Vault Sorter plugin into an Obsidian vault.

.DESCRIPTION
    Run from anywhere. Pass -VaultRoot to point at your vault folder
    (the one containing the .obsidian/ directory).
    Creates .obsidian/plugins/vault-sorter/ and writes manifest.json + main.js.
    After running, open Obsidian → Settings → Community Plugins → enable "Vault Sorter".

.PARAMETER VaultRoot
    Path to your Obsidian vault root (default: current directory).

.PARAMETER Force
    Overwrite existing plugin files.

.EXAMPLE
    cd "C:\Users\James Romeo\OneDrive\theghost"
    .\Install-VaultSorter.ps1

    .\Install-VaultSorter.ps1 -VaultRoot "C:\Users\James Romeo\OneDrive\theghost" -Force

.NOTES
    Plugin ID    : vault-sorter
    Version      : 1.0.0
    Min Obsidian : 1.1.6
    After install, go to:
      Settings → Community Plugins → (turn off Safe Mode if prompted) → enable Vault Sorter
    Run via:
      Ctrl+P  →  "Run Vault Sorter"
      or the git-merge ribbon icon on the left sidebar.
#>
param(
    [string]$VaultRoot = (Get-Location).Path,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PluginDir = Join-Path $VaultRoot '.obsidian\plugins\vault-sorter'

function Write-Source {
    param([string]$RelPath, [string]$Content)
    $full = Join-Path $PluginDir $RelPath
    $dir  = Split-Path $full -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    if ((Test-Path $full) -and -not $Force) {
        Write-Host "  SKIP   $RelPath  (already exists — use -Force to overwrite)" -ForegroundColor Yellow
        return
    }
    [System.IO.File]::WriteAllText($full, $Content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  WRITE  $RelPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Vault Sorter Plugin Installer ===" -ForegroundColor Cyan
Write-Host "    Vault    : $VaultRoot"
Write-Host "    Plugin   : $PluginDir"
Write-Host "    Force    : $($Force.IsPresent)"
Write-Host ""

# Verify this looks like an Obsidian vault
$obsidianDir = Join-Path $VaultRoot '.obsidian'
if (-not (Test-Path $obsidianDir)) {
    Write-Host "WARNING: No .obsidian/ folder found at: $VaultRoot" -ForegroundColor Yellow
    Write-Host "         Are you sure this is your vault root?" -ForegroundColor Yellow
    Write-Host "         Continuing anyway..." -ForegroundColor Yellow
    Write-Host ""
}


Write-Source 'manifest.json' @'
{
  "id": "vault-sorter",
  "name": "Vault Sorter",
  "version": "1.0.0",
  "minAppVersion": "1.1.6",
  "description": "Analyzes term frequency and context weighting across vault notes. Routes and links files to folders based on how often and how meaningfully key terms appear — including dialogue, headings, and frontmatter.",
  "author": "James Romeo",
  "authorUrl": "",
  "isDesktopOnly": true
}
'@


Write-Source 'main.js' @'
'use strict';

var obsidian = require('obsidian');

// ─── Stopwords ────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','was','are','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'shall','can','need','dare','used','it','its','this','that','these',
  'those','i','me','my','myself','we','our','ours','ourselves','you',
  'your','yours','yourself','he','him','his','himself','she','her','hers',
  'herself','they','them','their','theirs','themselves','what','which',
  'who','whom','when','where','why','how','all','both','each','few',
  'more','most','other','some','such','no','not','only','same','so',
  'than','too','very','just','now','then','here','there','also','as',
  'if','into','about','up','out','over','after','before','between',
  'through','during','again','further','once','any','against','below',
  'above','own','off','while','s','t','don','won','isn','aren','wasn',
  'weren','hasn','haven','hadn','doesn','didn','couldn','wouldn','shouldn',
  'that','from','have','with','been','were','they','their','said','each',
  'which','there','what','out','about','who','get','got','its','like',
  'time','way','can','still','back','take','come','made','long','thing',
  'look','make','know','place','year','live','every','find','hand',
  'high','move','page','need','large','often','hold','real','life',
  'few','north','open','seem','together','next','white','children',
  'begin','got','walk','example','ease','paper','group','always','music',
  'those','both','mark','book','letter','until','mile','river','car',
  'feet','care','second','enough','plain','girl','usual','young','ready',
  'above','ever','red','list','though','feel','talk','bird','soon',
  'body','dog','family','direct','pose','leave','song','measure','door'
]);

const MIN_TERM_LEN   = 4;
const LINK_SEPARATOR = '\n\n---\n<!-- vault-sorter-links -->\n';

const DEFAULT_SETTINGS = {
  minFrequency:       3,
  headingWeight:      3.0,
  dialogueWeight:     2.5,
  frontmatterWeight:  4.0,
  firstParaWeight:    2.0,
  bodyWeight:         1.0,
  autoLink:           true,
  autoFrontmatter:    true,
  reportNote:         '_Sort Report',
  customMappings:     {},   // { 'term': 'folder/path' }
  ignorePatterns:     ['Excalidraw', '.obsidian', '_Sort Report', '.trash'],
  dialoguePatterns:   [
    '^[A-Z][A-Z\\s]{2,}:\\s',          // GHOST: says something
    '^>\\s*\\[!quote\\]',              // > [!quote]
    '"[^"]{8,}"',                      // inline quoted speech (8+ chars)
    "^'[^']{8,}'",                     // single-quoted speech
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip markdown syntax and tokenize a string into lowercase words.
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g,   '')        // fenced code blocks
    .replace(/`[^`]+`/g,          '')        // inline code
    .replace(/!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1') // wikilink text
    .replace(/\[([^\]]+)\]\([^)]+\)/g,      '$1') // markdown links
    .replace(/#+\s*/g,            ' ')       // headings hashes
    .replace(/[*_~>|]/g,         ' ')       // bold/italic/blockquote
    .replace(/[^a-z\s\-']/g,     ' ')       // strip non-alpha
    .split(/\s+/)
    .map(w  => w.replace(/^[-']+|[-']+$/g, ''))
    .filter(w => w.length >= MIN_TERM_LEN && !STOPWORDS.has(w));
}

/**
 * Parse markdown into labelled sections for context-weighted scoring.
 * Returns { headings[], frontmatter[], dialogue[], firstPara[], body[] }
 */
function parseSections(content, dialoguePatterns) {
  const dlgRegs = dialoguePatterns.map(p => new RegExp(p));
  const lines    = content.split('\n');
  const out      = { headings: [], frontmatter: [], dialogue: [], firstPara: [], body: [] };

  let inFM         = false;
  let fmDone       = false;
  let fmIdx        = 0;
  let inFirstPara  = false;
  let firstParaDone= false;

  for (const line of lines) {
    // ── Frontmatter ──────────────────────────────────────────────────────────
    if (fmIdx === 0 && line.trim() === '---') { inFM = true; fmIdx++; continue; }
    if (inFM) {
      if (line.trim() === '---' || line.trim() === '...') { inFM = false; fmDone = true; }
      else out.frontmatter.push(line);
      fmIdx++;
      continue;
    }
    if (!fmDone) fmDone = true; // no frontmatter present

    // ── Headings ─────────────────────────────────────────────────────────────
    if (/^#{1,6}\s/.test(line)) {
      out.headings.push(line.replace(/^#+\s*/, ''));
      continue;
    }

    // ── Dialogue ─────────────────────────────────────────────────────────────
    if (dlgRegs.some(r => r.test(line))) {
      out.dialogue.push(line);
      // also feed into body for base score
      out.body.push(line);
      continue;
    }

    // ── First paragraph ───────────────────────────────────────────────────────
    if (!firstParaDone) {
      if (line.trim().length > 0) {
        inFirstPara = true;
        out.firstPara.push(line);
      } else if (inFirstPara) {
        firstParaDone = true;
        inFirstPara   = false;
      }
    }

    out.body.push(line);
  }

  return out;
}

/**
 * Build a { keyword → [folderPath, ...] } map from vault folder names.
 * Strips leading numeric prefixes like "09 - ".
 */
function buildFolderKeyMap(folders) {
  const map = {};
  for (const folder of folders) {
    const raw = folder.name
      .toLowerCase()
      .replace(/^\d+\s*[-–—]\s*/, '')   // "09 - Collapse" → "collapse"
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

    for (const word of raw.split(/\s+/)) {
      if (word.length >= MIN_TERM_LEN && !STOPWORDS.has(word)) {
        if (!map[word]) map[word] = [];
        if (!map[word].includes(folder.path)) map[word].push(folder.path);
      }
    }
  }
  return map;
}

/**
 * Score a single file's content against a folder keyword map.
 * Returns { folderPath: score } object.
 */
function scoreFile(content, folderKeyMap, customMappings, settings) {
  const sections = parseSections(content, settings.dialoguePatterns);
  const scores   = {};

  // Merge custom mappings into working map (term → [path])
  const fullMap = {};
  for (const [k, paths] of Object.entries(folderKeyMap)) {
    fullMap[k] = [...paths];
  }
  for (const [term, folder] of Object.entries(customMappings)) {
    const t = term.toLowerCase().trim();
    if (!fullMap[t]) fullMap[t] = [];
    if (!fullMap[t].includes(folder)) fullMap[t].push(folder);
  }

  const acc = (tokens, weight) => {
    for (const tok of tokens) {
      const destinations = fullMap[tok];
      if (!destinations) continue;
      for (const dest of destinations) {
        scores[dest] = (scores[dest] || 0) + weight;
      }
    }
  };

  acc(tokenize(sections.headings.join(' ')),    settings.headingWeight);
  acc(tokenize(sections.frontmatter.join(' ')), settings.frontmatterWeight);
  acc(tokenize(sections.firstPara.join(' ')),   settings.firstParaWeight);
  acc(tokenize(sections.dialogue.join(' ')),    settings.dialogueWeight);
  acc(tokenize(sections.body.join(' ')),        settings.bodyWeight);

  return scores;
}

/**
 * Count every term across all file contents (corpus frequency).
 * Returns { term: count } object.
 */
function buildGlobalFreq(contents) {
  const freq = {};
  for (const c of contents) {
    for (const tok of tokenize(c)) {
      freq[tok] = (freq[tok] || 0) + 1;
    }
  }
  return freq;
}

/**
 * Pick the highest-scoring folder from a scores map.
 * Returns { folder, score } or null.
 */
function topFolder(scores) {
  const entries = Object.entries(scores);
  if (!entries.length) return null;
  const [folder, score] = entries.sort((a, b) => b[1] - a[1])[0];
  return score > 0 ? { folder, score } : null;
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

class VaultSorterSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Vault Sorter' });

    const s = (name, desc) => new obsidian.Setting(containerEl).setName(name).setDesc(desc);

    s('Min. corpus frequency', 'A term must appear at least this many times across the whole vault before it scores any file.')
      .addText(t => t.setPlaceholder('3').setValue(String(this.plugin.settings.minFrequency))
        .onChange(async v => { this.plugin.settings.minFrequency = parseInt(v) || 3; await this.plugin.saveSettings(); }));

    s('Heading weight', 'Score multiplier for terms found in headings (##, ###, …).')
      .addText(t => t.setPlaceholder('3.0').setValue(String(this.plugin.settings.headingWeight))
        .onChange(async v => { this.plugin.settings.headingWeight = parseFloat(v) || 3.0; await this.plugin.saveSettings(); }));

    s('Dialogue / speech weight', 'Multiplier for terms inside quoted speech or speaker lines (e.g. GHOST: …).')
      .addText(t => t.setPlaceholder('2.5').setValue(String(this.plugin.settings.dialogueWeight))
        .onChange(async v => { this.plugin.settings.dialogueWeight = parseFloat(v) || 2.5; await this.plugin.saveSettings(); }));

    s('Frontmatter weight', 'Multiplier for terms found in YAML frontmatter (tags, fields, values).')
      .addText(t => t.setPlaceholder('4.0').setValue(String(this.plugin.settings.frontmatterWeight))
        .onChange(async v => { this.plugin.settings.frontmatterWeight = parseFloat(v) || 4.0; await this.plugin.saveSettings(); }));

    s('First-paragraph weight', 'Multiplier for terms in the first non-heading paragraph of a note.')
      .addText(t => t.setPlaceholder('2.0').setValue(String(this.plugin.settings.firstParaWeight))
        .onChange(async v => { this.plugin.settings.firstParaWeight = parseFloat(v) || 2.0; await this.plugin.saveSettings(); }));

    s('Auto-update frontmatter', 'Write suggested-folder, key-terms, and sort-score into each note\'s frontmatter after every run.')
      .addToggle(t => t.setValue(this.plugin.settings.autoFrontmatter)
        .onChange(async v => { this.plugin.settings.autoFrontmatter = v; await this.plugin.saveSettings(); }));

    s('Auto-link related files', 'Append [[wiki-links]] between notes that share the same top folder assignment.')
      .addToggle(t => t.setValue(this.plugin.settings.autoLink)
        .onChange(async v => { this.plugin.settings.autoLink = v; await this.plugin.saveSettings(); }));

    s('Report note name', 'Name of the note created/updated with each run\'s full results table.')
      .addText(t => t.setPlaceholder('_Sort Report').setValue(this.plugin.settings.reportNote)
        .onChange(async v => { this.plugin.settings.reportNote = v.trim() || '_Sort Report'; await this.plugin.saveSettings(); }));

    s('Ignore patterns', 'Comma-separated path fragments to exclude (folders or note names).')
      .addText(t => t.setPlaceholder('Excalidraw,.obsidian').setValue(this.plugin.settings.ignorePatterns.join(', '))
        .onChange(async v => {
          this.plugin.settings.ignorePatterns = v.split(',').map(x => x.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        }));

    // ── Custom term→folder mappings ──────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Custom term → folder mappings' });
    containerEl.createEl('p', {
      text: 'One entry per line in the format:  term :: folder/path',
      attr: { style: 'color:var(--text-muted);font-size:13px;margin-bottom:8px;' }
    });
    containerEl.createEl('p', {
      text: 'Example:  collapse :: 09 - Collapse',
      attr: { style: 'color:var(--text-muted);font-size:13px;font-style:italic;margin-bottom:12px;' }
    });

    const area = containerEl.createEl('textarea', {
      attr: {
        rows: 14,
        spellcheck: false,
        style: 'width:100%;font-family:monospace;font-size:12px;background:var(--background-secondary);color:var(--text-normal);border:1px solid var(--background-modifier-border);border-radius:4px;padding:8px;box-sizing:border-box;'
      }
    });
    area.value = Object.entries(this.plugin.settings.customMappings)
      .map(([k, v]) => `${k} :: ${v}`)
      .join('\n');
    area.addEventListener('change', async () => {
      const map = {};
      for (const line of area.value.split('\n')) {
        const idx = line.indexOf('::');
        if (idx === -1) continue;
        const k = line.slice(0, idx).trim().toLowerCase();
        const v = line.slice(idx + 2).trim();
        if (k && v) map[k] = v;
      }
      this.plugin.settings.customMappings = map;
      await this.plugin.saveSettings();
    });

    // ── Dialogue patterns ────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Dialogue detection patterns (regex)' });
    containerEl.createEl('p', {
      text: 'One regex per line. Lines matching any pattern are treated as character speech and get the dialogue weight multiplier.',
      attr: { style: 'color:var(--text-muted);font-size:13px;margin-bottom:12px;' }
    });

    const dlgArea = containerEl.createEl('textarea', {
      attr: {
        rows: 6,
        spellcheck: false,
        style: 'width:100%;font-family:monospace;font-size:12px;background:var(--background-secondary);color:var(--text-normal);border:1px solid var(--background-modifier-border);border-radius:4px;padding:8px;box-sizing:border-box;'
      }
    });
    dlgArea.value = this.plugin.settings.dialoguePatterns.join('\n');
    dlgArea.addEventListener('change', async () => {
      this.plugin.settings.dialoguePatterns = dlgArea.value.split('\n').map(l => l.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    });
  }
}

// ─── Results Modal ────────────────────────────────────────────────────────────

class SortResultsModal extends obsidian.Modal {
  constructor(app, results) {
    super(app);
    this.results = results;
  }

  onOpen() {
    const { contentEl, results } = this;
    contentEl.createEl('h2', { text: '🌿 Vault Sorter — Results' });

    const stat = (label, val) => {
      const p = contentEl.createEl('p', { attr: { style: 'margin:2px 0;font-size:13px;' } });
      p.createEl('strong', { text: label + ': ' });
      p.createSpan({ text: String(val) });
    };
    stat('Files scanned',          results.scanned);
    stat('Folder suggestions',     results.suggestions.length);
    stat('Frontmatter updated',    results.frontmatterUpdated);
    stat('Links created',          results.linked);

    if (!results.suggestions.length) {
      contentEl.createEl('p', {
        text: 'No strong folder assignments found. Try lowering Min. corpus frequency in settings.',
        attr: { style: 'color:var(--text-muted);margin-top:16px;' }
      });
      return;
    }

    contentEl.createEl('p', {
      text: `Full report written to: ${results.reportPath}`,
      attr: { style: 'color:var(--text-accent);font-size:12px;margin:12px 0 4px;' }
    });

    const wrap = contentEl.createEl('div', { attr: { style: 'overflow-y:auto;max-height:380px;margin-top:8px;' } });
    const table = wrap.createEl('table', { attr: { style: 'width:100%;border-collapse:collapse;font-size:12px;' } });
    const thead = table.createEl('thead');
    const hr = thead.createEl('tr');
    const thStyle = 'text-align:left;padding:6px 8px;border-bottom:2px solid var(--background-modifier-border);position:sticky;top:0;background:var(--background-primary);';
    ['File', 'Suggested Folder', 'Top Terms', 'Score'].forEach(h =>
      hr.createEl('th', { text: h, attr: { style: thStyle } })
    );

    const tbody = table.createEl('tbody');
    const sorted = [...results.suggestions].sort((a, b) => b.score - a.score);
    for (const r of sorted) {
      const row = tbody.createEl('tr', { attr: { style: 'border-bottom:1px solid var(--background-modifier-border-hover);' } });
      const td = (txt, extra = '') => row.createEl('td', { text: txt, attr: { style: `padding:5px 8px;${extra}` } });
      td(r.file);
      td(r.folder, 'color:var(--color-accent);');
      td(r.topTerms.slice(0, 4).join(', '), 'color:var(--text-muted);');
      td(r.score.toFixed(1));
    }

    new obsidian.ButtonComponent(contentEl)
      .setButtonText('Close')
      .setCta()
      .onClick(() => this.close());
  }

  onClose() { this.contentEl.empty(); }
}

// ─── Main Plugin ──────────────────────────────────────────────────────────────

class VaultSorterPlugin extends obsidian.Plugin {

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VaultSorterSettingTab(this.app, this));

    // Ribbon button
    this.addRibbonIcon('git-merge', 'Run Vault Sorter', () => this.runSorter());

    // Commands
    this.addCommand({
      id:       'vault-sorter-run-all',
      name:     'Run on entire vault',
      callback: () => this.runSorter(),
    });

    this.addCommand({
      id:   'vault-sorter-run-active',
      name: 'Sort active note only',
      checkCallback: (checking) => {
        const f = this.app.workspace.getActiveFile();
        if (f && f.extension === 'md') {
          if (!checking) this.sortSingleFile(f);
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id:   'vault-sorter-open-report',
      name: 'Open last Sort Report',
      callback: async () => {
        const path = `${this.settings.reportNote}.md`;
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof obsidian.TFile) {
          await this.app.workspace.getLeaf().openFile(file);
        } else {
          new obsidian.Notice('No Sort Report found. Run the sorter first.');
        }
      },
    });

    console.log('[VaultSorter] v1.0.0 loaded');
  }

  onunload() {
    console.log('[VaultSorter] unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Ensure arrays / objects exist after merge
    if (!Array.isArray(this.settings.ignorePatterns))   this.settings.ignorePatterns   = DEFAULT_SETTINGS.ignorePatterns;
    if (!Array.isArray(this.settings.dialoguePatterns)) this.settings.dialoguePatterns = DEFAULT_SETTINGS.dialoguePatterns;
    if (typeof this.settings.customMappings !== 'object') this.settings.customMappings = {};
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // ── Public run methods ─────────────────────────────────────────────────────

  async runSorter() {
    const notice = new obsidian.Notice('🌿 Vault Sorter scanning…', 0);
    try {
      const results = await this._runFullAnalysis();
      notice.hide();
      await this._writeReport(results);
      new SortResultsModal(this.app, results).open();
    } catch (err) {
      notice.hide();
      new obsidian.Notice(`Vault Sorter error: ${err.message}`);
      console.error('[VaultSorter]', err);
    }
  }

  async sortSingleFile(file) {
    const notice = new obsidian.Notice(`🌿 Sorting "${file.basename}"…`, 0);
    try {
      const content    = await this.app.vault.read(file);
      const folders    = this._getFolders();
      const fkMap      = buildFolderKeyMap(folders);
      const scores     = scoreFile(content, fkMap, this.settings.customMappings, this.settings);
      const best       = topFolder(scores);
      const terms      = this._topTerms(content, {});

      if (best && this.settings.autoFrontmatter) {
        await this._writeFrontmatter(file, content, best, terms);
      }
      notice.hide();
      new obsidian.Notice(best
        ? `→ ${file.basename}  ⟶  ${best.folder}  (score: ${best.score.toFixed(1)})`
        : `No strong match found for "${file.basename}".`
      );
    } catch (err) {
      notice.hide();
      new obsidian.Notice(`Error: ${err.message}`);
      console.error('[VaultSorter]', err);
    }
  }

  // ── Core analysis ──────────────────────────────────────────────────────────

  async _runFullAnalysis() {
    const vault   = this.app.vault;
    const ignore  = this.settings.ignorePatterns;

    // 1. Collect all .md files
    const files = vault.getMarkdownFiles()
      .filter(f => !ignore.some(p => f.path.toLowerCase().includes(p.toLowerCase())));

    // 2. Read all content in parallel (batched to avoid OOM on huge vaults)
    const BATCH   = 80;
    const contents = [];
    for (let i = 0; i < files.length; i += BATCH) {
      const batch = await Promise.all(files.slice(i, i + BATCH).map(f => vault.read(f)));
      contents.push(...batch);
    }

    // 3. Corpus frequency — used for minimum frequency gate and top-term extraction
    const globalFreq = buildGlobalFreq(contents);

    // 4. Folder keyword map (auto + custom)
    const fkMap = buildFolderKeyMap(this._getFolders());

    // Gate: remove terms below minFrequency from the map entirely
    for (const term of Object.keys(fkMap)) {
      if ((globalFreq[term] || 0) < this.settings.minFrequency) {
        delete fkMap[term];
      }
    }

    const results = {
      scanned:              files.length,
      linked:               0,
      frontmatterUpdated:   0,
      suggestions:          [],
      reportPath:           `${this.settings.reportNote}.md`,
    };

    // 5. Score every file
    const ranked = [];
    for (let i = 0; i < files.length; i++) {
      const file    = files[i];
      const content = contents[i];
      const scores  = scoreFile(content, fkMap, this.settings.customMappings, this.settings);
      const best    = topFolder(scores);
      const terms   = this._topTerms(content, globalFreq);

      if (best) {
        ranked.push({ file, content, folder: best.folder, score: best.score, topTerms: terms });
        results.suggestions.push({ file: file.basename, folder: best.folder, score: best.score, topTerms: terms });
      }
    }

    // 6. Frontmatter
    if (this.settings.autoFrontmatter) {
      for (const r of ranked) {
        await this._writeFrontmatter(r.file, r.content, { folder: r.folder, score: r.score }, r.topTerms);
        results.frontmatterUpdated++;
      }
      // Refresh content after frontmatter writes for link step
      for (const r of ranked) {
        r.content = await vault.read(r.file);
      }
    }

    // 7. Cross-links
    if (this.settings.autoLink) {
      results.linked = await this._buildLinks(ranked);
    }

    return results;
  }

  // ── Frontmatter writer ─────────────────────────────────────────────────────

  async _writeFrontmatter(file, content, best, topTerms) {
    const today    = new Date().toISOString().slice(0, 10);
    const newFields = [
      `suggested-folder: "${best.folder}"`,
      `sort-score: ${best.score.toFixed(1)}`,
      topTerms.length ? `key-terms: [${topTerms.map(t => `"${t}"`).join(', ')}]` : '',
      `sorted-at: ${today}`,
    ].filter(Boolean);

    let updated;
    const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(FM_RE);

    if (match) {
      let fm = match[1]
        .replace(/^(suggested-folder|sort-score|key-terms|sorted-at):.*\r?\n?/gm, '')
        .trimEnd();
      updated = content.replace(FM_RE, `---\n${fm}\n${newFields.join('\n')}\n---`);
    } else {
      updated = `---\n${newFields.join('\n')}\n---\n\n${content}`;
    }

    if (updated !== content) {
      await this.app.vault.modify(file, updated);
    }
  }

  // ── Link builder ───────────────────────────────────────────────────────────

  async _buildLinks(ranked) {
    // Group by suggested folder
    const byFolder = {};
    for (const r of ranked) {
      if (!byFolder[r.folder]) byFolder[r.folder] = [];
      byFolder[r.folder].push(r);
    }

    let count = 0;
    for (const [folder, group] of Object.entries(byFolder)) {
      if (group.length < 2) continue;

      for (const item of group) {
        const others   = group.filter(o => o.file.path !== item.file.path);
        const existing = new Set((item.content.match(/\[\[([^\]|]+)/g) || []).map(l => l.slice(2)));
        const newLinks = others
          .filter(o => !existing.has(o.file.basename) && !existing.has(o.file.path))
          .map(o => `[[${o.file.basename}]]`);

        if (!newLinks.length) continue;

        // Don't duplicate the sorter block
        if (item.content.includes('<!-- vault-sorter-links -->')) continue;

        const block = `${LINK_SEPARATOR}*Sorted into: ${folder}*\n${newLinks.join('  ')}\n`;
        await this.app.vault.modify(item.file, item.content + block);
        count += newLinks.length;
      }
    }
    return count;
  }

  // ── Report writer ──────────────────────────────────────────────────────────

  async _writeReport(results) {
    const ts   = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const path = `${this.settings.reportNote}.md`;

    let md = `---\ntags: [vault-sorter, report]\nupdated: ${ts}\n---\n\n`;
    md += `# 🌿 Vault Sorter Report\n`;
    md += `*${ts}*\n\n`;
    md += `| Stat | Value |\n|---|---|\n`;
    md += `| Files scanned | ${results.scanned} |\n`;
    md += `| Folder suggestions | ${results.suggestions.length} |\n`;
    md += `| Frontmatter updated | ${results.frontmatterUpdated} |\n`;
    md += `| Links created | ${results.linked} |\n\n`;
    md += `## Suggestions\n\n`;
    md += `| File | Folder | Score | Key Terms |\n|---|---|---|---|\n`;

    for (const r of [...results.suggestions].sort((a, b) => b.score - a.score)) {
      md += `| [[${r.file}]] | ${r.folder} | ${r.score.toFixed(1)} | ${r.topTerms.slice(0, 4).join(', ')} |\n`;
    }

    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof obsidian.TFile) {
      await this.app.vault.modify(existing, md);
    } else {
      await this.app.vault.create(path, md);
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  _getFolders() {
    const ignore = this.settings.ignorePatterns;
    return this.app.vault.getAllLoadedFiles()
      .filter(f => f instanceof obsidian.TFolder && !ignore.some(p => f.path.toLowerCase().includes(p.toLowerCase())));
  }

  _topTerms(content, globalFreq) {
    const freq = {};
    for (const tok of tokenize(content)) {
      if (Object.keys(globalFreq).length && (globalFreq[tok] || 0) < this.settings.minFrequency) continue;
      freq[tok] = (freq[tok] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([t]) => t);
  }

  _isIgnored(path) {
    return this.settings.ignorePatterns.some(p => path.toLowerCase().includes(p.toLowerCase()));
  }
}

module.exports = VaultSorterPlugin;
'@



Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open Obsidian"
Write-Host "  2. Settings  →  Community Plugins"
Write-Host "  3. If Safe Mode is on, turn it off"
Write-Host "  4. Find 'Vault Sorter' and enable it"
Write-Host "  5. Press Ctrl+P and type 'Run Vault Sorter'"
Write-Host ""
Write-Host "Tip: Use 'Sort active note only' command to test on a single file first." -ForegroundColor DarkCyan
Write-Host ""
