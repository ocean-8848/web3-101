#!/usr/bin/env node
// Freshness audit: scan src/ for date/year citations and external links to flag entries older than 18 months.
// Usage: node tools/freshness.js [--months 18]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const argIdx = process.argv.indexOf('--months');
const MAX_MONTHS = argIdx > 0 ? Math.max(1, +process.argv[argIdx + 1] || 18) : 18;
const now = new Date();
const files = fs.readdirSync(path.join(root, 'src'))
  .filter(f => (f.startsWith('sub-') || f.startsWith('ch-')) && f.endsWith('.js'))
  .sort();

const stale = [];
let totalDates = 0, totalCites = 0;

for (const f of files) {
  const txt = fs.readFileSync(path.join(root, 'src', f), 'utf8');
  const cites = (txt.match(/cite\(/g) || []).length;
  totalCites += cites;

  // Match explicit YYYY-MM or "截至 YYYY 年" markers
  for (const m of txt.matchAll(/(202\d)-(0[1-9]|1[0-2])|截至\s*(202\d)\s*年/g)) {
    totalDates++;
    const y = +(m[1] || m[3]);
    const mo = m[2] ? +m[2] : 6;
    const monthsOld = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - mo);
    if (monthsOld > MAX_MONTHS) {
      stale.push({ file: f, marker: m[0], monthsOld });
    }
  }
}

console.log(`Scanned ${files.length} source files | cite() calls: ${totalCites} | date markers: ${totalDates} | threshold: > ${MAX_MONTHS} months`);
if (!stale.length) {
  console.log('FRESHNESS OK: no dated snapshots older than ' + MAX_MONTHS + ' months.');
} else {
  const byFile = {};
  for (const s of stale) {
    byFile[s.file] = byFile[s.file] || [];
    byFile[s.file].push(`${s.marker} (${s.monthsOld}m)`);
  }
  console.log(`Found ${stale.length} dated markers older than ${MAX_MONTHS} months across ${Object.keys(byFile).length} files (historical event dates may be intentional):`);
  for (const [f, list] of Object.entries(byFile).slice(0, 20)) {
    console.log(`  ${f}: ${[...new Set(list)].slice(0, 6).join(', ')}`);
  }
  if (Object.keys(byFile).length > 20) console.log(`  ... and ${Object.keys(byFile).length - 20} more files`);
}
