/* Figure lint for the hand-drawn art kit. Run in the browser pane on a built preview page:
     const m = await import('/tools/figlint.js'); JSON.stringify(await m.default());
   Optional: await m.default({ ids: ['m05-60'] })   (limit to some pages)
   Reports, per figure: text outside the canvas, text outside its own box (data-bx), overlapping text, tiny text. */
export default async function figLint(opt = {}) {
  const ids = opt.ids || H.ch.filter(c => c.kind !== 'stage').map(c => c.id);
  const out = [];
  let figs = 0;
  for (const id of ids) {
    location.hash = id;
    await new Promise(r => setTimeout(r, 90));
    const view = document.querySelector('#view');
    for (const svg of view.querySelectorAll('svg.fk-art')) {
      figs++;
      const vb = svg.viewBox.baseVal, sr = svg.getBoundingClientRect(), k = vb.width / (sr.width || 1);
      const title = (svg.closest('figure').querySelector('.mmd-title span') || {}).textContent || '';
      const items = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim()).map(t => {
        const r = t.getBoundingClientRect();
        return { t, txt: t.textContent.trim().slice(0, 18), x: (r.left - sr.left) * k, y: (r.top - sr.top) * k, w: r.width * k, h: r.height * k, fs: parseFloat(t.getAttribute('font-size')) || 0 };
      });
      const bad = [];
      for (const a of items) {
        if (a.x < -1 || a.y < -1 || a.x + a.w > vb.width + 1 || a.y + a.h > vb.height + 1) bad.push('outside canvas: ' + a.txt);
        const bx = a.t.dataset.bx;
        if (bx) { const [x, y, w, h] = bx.split(',').map(Number); if (a.x < x - 0.5 || a.x + a.w > x + w + 0.5 || a.y < y - 1 || a.y + a.h > y + h + 1) bad.push('outside its box: ' + a.txt); }
        if (a.fs && a.fs < 10) bad.push('tiny font ' + a.fs.toFixed(1) + ': ' + a.txt);
      }
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j];
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (w > 2 && h > 2 && w * h > 0.12 * Math.min(a.w * a.h, b.w * b.h)) bad.push('overlap: ' + a.txt + ' / ' + b.txt);
      }
      if (bad.length) out.push({ id, title, bad });
    }
  }
  return { pages: ids.length, figures: figs, problems: out.length, list: out };
}
