// Smoke test: load all sources in a stub DOM, evaluate every article, check references.
// Usage: node tools/smoke.js            (from web3-handbook/)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const sh = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const ls = pre => fs.readdirSync(path.join(root, 'src')).filter(f => f.startsWith(pre) && f.endsWith('.js')).sort().map(f => 'src/' + f);
const files = ['src/core.js', 'src/labs-a.js', 'src/labs-b.js', 'src/labs-c.js', ...ls('labs-m'), 'src/ch-intro.js', 'src/ch-a.js', 'src/ch-b.js', 'src/ch-c.js', 'src/ch-d.js', ...ls('sub-m'), ...ls('stage-')];
const stubEl = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } };
const ctx = { console, document: stubEl, window: {}, location: { hash: '' }, localStorage: { getItem: () => null, setItem() {} }, getComputedStyle: () => ({ getPropertyValue: () => '' }), unescape, encodeURIComponent, performance: { now: () => 0 }, setTimeout, clearTimeout, setInterval, clearInterval, matchMedia: () => ({ addEventListener() {} }) };
vm.createContext(ctx);
let src = '';
for (const f of files) src += fs.readFileSync(path.join(root, f), 'utf8') + '\n;\n';
src += `

function lintArt(html, id, problems) {
  const num = v => +v;
  for (const m of html.matchAll(/<svg class="fk-art" viewBox="0 0 (\\d+) (\\d+)"[^>]*>([\\s\\S]*?)<\\/svg>/g)) {
    const W = num(m[1]), Hh = num(m[2]); let body = m[3];
    if (!/data-mw/.test(body)) continue;              // hand-written raw SVG from before the kit: not linted
    const P = msg => problems.push(id + ': figure (' + W + 'x' + Hh + ') ' + msg);
    if (W < 560 || W > 700) P('width should be 560-700');
    if (Hh > 460) P('height should be <= 460');
    body = body.replace(/<g transform="translate\\([^"]*\\) scale\\([^"]*\\)"[^>]*>[\\s\\S]*?<\\/g>/g, '');
    const rects = [];
    for (const r of body.matchAll(/<rect x="([\\d.-]+)" y="([\\d.-]+)" width="([\\d.-]+)" height="([\\d.-]+)"([^>]*)>/g)) {
      const [x, y, w, h] = [r[1], r[2], r[3], r[4]].map(num), attr = r[5];
      const zone = /fill-opacity="\\.55"/.test(attr), label = /fill="var\\(--paper\\)" stroke="var\\(--rule\\)" stroke-width="1"\\//.test(attr) && /rx="6"/.test(attr);
      rects.push({ x, y, w, h, zone, label });
      if (x < -1 || y < -1 || x + w > W + 1 || y + h > Hh + 1) P('shape outside the canvas at (' + x + ',' + y + ')');
    }
    const boxes = rects.filter(r => !r.zone);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const ow = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ow > 3 && oh > 3) {
        const inA = b.x >= a.x - 1 && b.y >= a.y - 1 && b.x + b.w <= a.x + a.w + 1 && b.y + b.h <= a.y + a.h + 1, inB = a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
        if (!inA && !inB) P('boxes overlap near (' + Math.round(Math.max(a.x, b.x)) + ',' + Math.round(Math.max(a.y, b.y)) + ')');
      }
    }
    const tw = (str, size) => [...str].reduce((t, c) => t + (/[\\u2e80-\\u9fff\\uff00-\\uffef]/.test(c) ? size : size * 0.58), 0);
    for (const t of body.matchAll(/<text x="([\\d.-]+)" y="([\\d.-]+)"([^>]*)>([\\s\\S]*?)<\\/text>/g)) {
      const x = num(t[1]), y = num(t[2]), attr = t[3], fs = num((attr.match(/font-size="([\\d.]+)"/) || [0, 13])[1]), anc = (attr.match(/text-anchor="(\\w+)"/) || [0, 'start'])[1];
      const mw = num((attr.match(/data-mw="([\\d.]+)"/) || [0, 1e9])[1]), hasBox = /data-bx=/.test(attr);
      const lines = t[4].split(/<tspan[^>]*>/).filter(Boolean).map(l => l.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, 'x'));
      const wid = Math.min(Math.max(...lines.map(l => tw(l, fs))), mw), hgt = lines.length * fs * 1.32;
      const x0 = anc === 'middle' ? x - wid / 2 : anc === 'end' ? x - wid : x, x1 = x0 + wid, y0 = y - fs, y1 = y0 + hgt;
      if (fs < 11) P('text smaller than 11px: ' + lines[0].slice(0, 12));
      if (x0 < -1 || x1 > W + 1 || y0 < -2 || y1 > Hh + 2) P('text outside the canvas: ' + lines[0].slice(0, 12));
      if (!hasBox) for (const b of boxes) {
        const ow = Math.min(x1, b.x + b.w) - Math.max(x0, b.x), oh = Math.min(y1, b.y + b.h) - Math.max(y0, b.y);
        const inside = x0 >= b.x - 1 && x1 <= b.x + b.w + 1 && y0 >= b.y - 3 && y1 <= b.y + b.h + 3;
        if (ow > 4 && oh > 4 && !inside && !b.label) { P('text crosses a box edge: ' + lines[0].slice(0, 12)); break; }
      }
    }
    for (const p of body.matchAll(/<path d="(M[^"]+)" fill="none"/g)) for (const n of p[1].matchAll(/(-?[\\d.]+) (-?[\\d.]+)/g)) { if (num(n[1]) < -1 || num(n[1]) > W + 1 || num(n[2]) < -1 || num(n[2]) > Hh + 1) { P('line leaves the canvas'); break; } }
    if (!/aria-label="[^"]{4,}"/.test(m[0])) P('missing aria-label');
  }
}

const problems = [];
const ids = new Set(H.ch.map(c => c.id));
for (const c of H.ch) {
  const html = typeof c.html === 'function' ? c.html() : c.html;
  if (!c.title) problems.push(c.id + ': missing title');
  for (const m of html.matchAll(/data-lab="([^"]+)"/g)) if (!H.labs[m[1]]) problems.push(c.id + ': unknown lab ' + m[1]);
  for (const m of html.matchAll(/href="#([^"]+)"/g)) { const t = m[1]; if (t.startsWith('lab-') ? !H.labs[t.slice(4)] : !ids.has(t) && !['labs','glossary','home','roles'].includes(t)) problems.push(c.id + ': broken link #' + t); }
  lintArt(html, c.id, problems);
  if (c.kind === 'stage') { c._kb = (html.length / 1024).toFixed(1); const n = (html.match(/class="quiz"/g) || []).length; if (n < 6) problems.push(c.id + ': stage quiz has only ' + n + ' questions'); for (const m of html.matchAll(/data-a="(\\d+)"><div class="qq">[\\s\\S]*?<div class="qo">([\\s\\S]*?)<\\/div>/g)) if (+m[1] >= (m[2].match(/data-qi=/g) || []).length) problems.push(c.id + ': answer index out of range'); }
  else if (c.sub > 0) {
    if (!/class="quiz"/.test(html)) problems.push(c.id + ': no quiz');
    if (!/class="mmd"/.test(html)) problems.push(c.id + ': no diagram');
    if (!c.desc) problems.push(c.id + ': no desc');
    c._kb = (html.length / 1024).toFixed(1);
  }
}
for (const [id, L] of Object.entries(H.labs)) { if (!H.byId[L.ch]) problems.push('lab ' + id + ': unknown chapter ' + L.ch); if (typeof L.mount !== 'function') problems.push('lab ' + id + ': no mount'); }
const subs = H.ch.filter(c => c.sub > 0).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
console.log('articles:', H.ch.length, 'sub-articles:', subs.length, 'labs:', Object.keys(H.labs).length, 'diagrams:', H.mmd.length, 'terms:', H.terms.length);
console.log(subs.map(c => c.id + ' ' + c._kb + 'KB ' + (c.nav || '')).join('\\n'));
console.log(problems.length ? 'PROBLEMS:\\n' + problems.join('\\n') : 'OK: no problems');
`;
try { vm.runInContext(src, ctx, { filename: 'bundle.js' }); } catch (e) { console.error('RUNTIME ERROR:', e.stack); process.exit(1); }
