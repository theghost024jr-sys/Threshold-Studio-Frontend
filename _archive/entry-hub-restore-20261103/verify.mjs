import fs from 'node:fs';
const t = fs.readFileSync('C:/Threshold/website/index.html', 'utf8');

const count = (re) => (t.match(re) || []).length;
console.log('aside open/close      ', count(/<aside\b/g), count(/<\/aside>/g));
console.log('entry-copy blocks     ', count(/class="entry-copy"/g));
console.log('.entry-nav rules      ', count(/\.entry-nav \{/g));
console.log('entry-nav display:none', /\.entry-nav \{[^}]*display:\s*none/.test(t));
console.log('crossing anchors      ', count(/class="entry-crossing"/g));
console.log('first-crossing attrs  ', count(/data-main-hub-first-crossing/g));
console.log('world-map link        ', /class="entry-map-link" href="world-map\.html"/.test(t));
console.log('route links           ', count(/<a href="(housegarden|pages\/threshold|ethos|learningwheel|discover|invitation|mythology|glyphs|dialogues|contact)\.html">/g));

// which element owns the crossing attribute
const m = t.match(/<a[^>]*data-main-hub-first-crossing[^>]*>/);
console.log('crossing element      ', m && m[0]);
