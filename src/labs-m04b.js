/* ---------- Labs M10（b）：route 拆单路由 ---------- */
(() => {

addLab('route', {
  ch: 'm04-72', title: '两池拆单路由', desc: '同一交易对的两个 x·y=k 池子。调节储备、手续费、交易量和每次 swap 的 gas，比较全给 A、全给 B 与最优拆单的净输出。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认值下最优比例约 67% 给 A，比全给 A 多约 8,470 USDC。② 把交易量拖到 1 ETH：拆单多得的不到 gas，最优变成“不拆”。③ 把池 B 的 USDC 储备调到 1,600 千：B 价格更高，最优比例偏向 B。④ 把 gas 调到 100 USDC，看曲线两端的跳变。</div>
    <div class="ctrls">${rng(p, 'ax', '池 A：ETH 储备', 100, 5000, 50, 1000)}${rng(p, 'ay', '池 A：USDC 储备（千）', 300, 15000, 50, 3000)}${rng(p, 'af', '池 A：手续费率', 0, 1, 0.01, 0.3)}</div>
    <div class="ctrls">${rng(p, 'bx', '池 B：ETH 储备', 100, 5000, 50, 500)}${rng(p, 'by', '池 B：USDC 储备（千）', 300, 15000, 50, 1500)}${rng(p, 'bf', '池 B：手续费率', 0, 1, 0.01, 0.3)}</div>
    <div class="ctrls">${rng(p, 'amt', '卖出 ETH 数量', 1, 500, 1, 100)}${rng(p, 'gas', '每次 swap 的 gas（折合 USDC）', 0, 200, 1, 6)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>`;
    // 卖 dx ETH 换 USDC 的输出（V2 公式：先扣手续费，再按 x·y=k）
    const out = (x, y, f, dx) => { if (dx <= 0) return 0; const e = dx * (1 - f); return y * e / (x + e); };
    bindInputs(el, {
      ax: v => v.toLocaleString() + ' ETH', ay: v => (v * 1000).toLocaleString() + ' USDC', af: v => v.toFixed(2) + '%',
      bx: v => v.toLocaleString() + ' ETH', by: v => (v * 1000).toLocaleString() + ' USDC', bf: v => v.toFixed(2) + '%',
      amt: v => v + ' ETH', gas: v => v + ' USDC'
    }, v => {
      const A = { x: v.ax, y: v.ay * 1000, f: v.af / 100 }, B = { x: v.bx, y: v.by * 1000, f: v.bf / 100 };
      const n = v.amt, g = v.gas;
      const spotA = A.y / A.x, spotB = B.y / B.x, best = Math.max(spotA, spotB);
      // s = 给 A 的百分比，0–100，步长 1%；只用一个池子时只付一次 gas
      const net = s => {
        const da = n * s / 100, db = n - da;
        const gross = out(A.x, A.y, A.f, da) + out(B.x, B.y, B.f, db);
        return { gross, net: gross - g * ((da > 0 ? 1 : 0) + (db > 0 ? 1 : 0)), da, db };
      };
      const pts = []; let opt = { s: 0, ...net(0) };
      for (let s = 0; s <= 100; s++) { const r = net(s); pts.push([s, r.net]); if (r.net > opt.net) opt = { s, ...r }; }
      const allA = net(100), allB = net(0);
      const impact = (o, dx, ref) => 1 - o / dx / ref; // 相对参考价的成交价格损失（含手续费）
      const iA = impact(allA.gross, n, spotA), iB = impact(allB.gross, n, spotB), iS = impact(opt.gross, n, best);
      const single = allA.net >= allB.net ? { name: 'A', r: allA } : { name: 'B', r: allB };
      const gain = opt.net - single.r.net;
      // 交易后两个池子的现价（拆单最优时应接近相等）
      const postA = opt.da > 0 ? (A.y - out(A.x, A.y, A.f, opt.da)) / (A.x + opt.da) : spotA;
      const postB = opt.db > 0 ? (B.y - out(B.x, B.y, B.f, opt.db)) / (B.x + opt.db) : spotB;
      $('[data-s]', el).innerHTML =
        stat('全给 A：净输出', fmtN(allA.net, 2) + ' USDC') + stat('全给 A：价格影响', fmtP(iA), iA > 0.05 ? 'risk' : iA > 0.01 ? 'warn' : 'ok') +
        stat('全给 B：净输出', fmtN(allB.net, 2) + ' USDC') + stat('全给 B：价格影响', fmtP(iB), iB > 0.05 ? 'risk' : iB > 0.01 ? 'warn' : 'ok') +
        stat('最优：给 A 的比例', opt.s + '%（A ' + fmtN(opt.da, 2) + ' / B ' + fmtN(opt.db, 2) + ' ETH）', 'ok') +
        stat('最优：净输出', fmtN(opt.net, 2) + ' USDC', 'ok') +
        stat('最优：价格影响（对较好现价）', fmtP(iS), iS > 0.05 ? 'risk' : iS > 0.01 ? 'warn' : 'ok') +
        stat('交易后现价 A / B', fmtN(postA, 1) + ' / ' + fmtN(postB, 1)) +
        stat('现价 A / B', fmtN(spotA, 1) + ' / ' + fmtN(spotB, 1)) +
        stat('拆单比最好的单池多得', (gain >= 0 ? '+' : '−') + fmtN(Math.abs(gain), 2) + ' USDC', gain > 0 ? 'ok' : '');
      const ys = pts.map(q => q[1]), lo = Math.min(...ys), hi = Math.max(...ys), pad = Math.max((hi - lo) * 0.08, 1);
      const y0 = lo - pad, y1 = hi + pad;
      $('[data-c]', el).innerHTML = lineChart({
        label: '净输出随“给 A 的比例”变化', xr: [0, 100], yr: [y0, y1], series: [{ pts, area: true }],
        markers: [{ x: opt.s, y: opt.net, label: '最优 ' + opt.s + '%' }],
        xticks: [0, 25, 50, 75, 100], fx: t => t + '%',
        yticks: [y0 + pad, (y0 + y1) / 2, y1 - pad], fy: t => fmtN(t, 0)
      });
      const vd = $('[data-vd]', el);
      if (opt.s === 0 || opt.s === 100) {
        vd.className = 'verdict warn';
        vd.textContent = `不拆更好：全给池 ${opt.s === 100 ? 'A' : 'B'}。拆单能多换到的输出，抵不过第二次 swap 的 ${g} USDC gas。交易越小、gas 越贵，越不该拆。`;
      } else {
        vd.className = 'verdict ok';
        vd.textContent = `拆单更好：${opt.s}% 给 A。交易后两个池子的现价接近相等（${fmtN(postA, 1)} 与 ${fmtN(postB, 1)}），这就是“边际价格相等”的最优条件。扣掉两次 gas 后仍比最好的单池多 ${fmtN(gain, 2)} USDC。`;
      }
    });
  }
});

})();
