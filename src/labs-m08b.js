/* ---------- Labs M09b: funding ---------- */
(() => {
addLab('funding', {
  ch: 'm08-8', title: '资金费率计算器（溢价 → 资金费率）', desc: '按常见实现“资金费率 = 溢价指数 + clamp(利率 − 溢价指数, ±0.05%)，再按上限截断”计算每期资金费率、年化和你要付或收的金额。参数均为示例。',
  mount(el, p) {
    let side = 'long';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 溢价在 −0.04% 到 +0.06% 之间拖动：资金费率一直等于 0.01%，这就是曲线中间的“平台区”。② 把溢价拉到 +0.50%：资金费率变成 0.45%，多头每 8 小时付出名义价值的 0.45%。③ 切到“做空”，把持有周期拉到 90 期（30 天），看空头累计收到多少。④ 把溢价拉到 +1%，观察资金费率被上限截断。</div>
    <div class="row-btns">${segHtml('side', [['long', '我做多 Long'], ['short', '我做空 Short']], 'long')}</div>
    <div class="ctrls">${rng(p, 'prem', '溢价指数（永续相对指数价格）', -1, 1, 0.01, 0.15)}${rng(p, 'rate', '利率（每 8 小时）', 0, 0.05, 0.001, 0.01)}${rng(p, 'clamp', 'clamp 上下限 ±', 0, 0.2, 0.01, 0.05)}${rng(p, 'cap', '资金费率上限 ±（示例）', 0.1, 2, 0.05, 0.75)}${rng(p, 'notional', '仓位名义价值（USDT）', 1000, 1000000, 1000, 100000)}${rng(p, 'n', '持有周期数（每期 8 小时）', 1, 90, 1, 21)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>
    <p class="muted small">说明：公式结构参考主流 CEX 公开文档的常见实现；利率、clamp、上限都是示例参数，不同交易所、不同合约不一样。假设每期溢价和名义价值保持不变。</p>`;
    const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
    // 所有输入以“百分比数值”表示：0.01 表示 0.01%
    const fr = (P, v) => clamp(P + clamp(v.rate - P, -v.clamp, v.clamp), -v.cap, v.cap);
    let V;
    const draw = v => {
      v = v || V.read();
      const F = fr(v.prem, v);                       // 每期资金费率（%）
      const per = v.notional * F / 100;              // 每期金额：正数表示多头付给空头
      const dir = side === 'long' ? 1 : -1;
      const mine = -per * dir;                       // 对我而言：正数 = 收到，负数 = 支付
      const total = mine * v.n;
      const apr = F * 3 * 365;                       // 年化（%），每天 3 期
      const lo = v.rate - v.clamp, hi = v.rate + v.clamp; // 平台区边界
      $('[data-s]', el).innerHTML =
        stat('每期资金费率', (F >= 0 ? '+' : '') + F.toFixed(4) + '%', Math.abs(F) >= v.cap - 1e-9 ? 'risk' : Math.abs(F) > 0.05 ? 'warn' : '') +
        stat('年化（× 3 × 365）', (apr >= 0 ? '+' : '') + apr.toFixed(2) + '%') +
        stat(mine >= 0 ? '你每期收到' : '你每期支付', fmtN(Math.abs(mine), 2) + ' USDT', mine >= 0 ? 'ok' : 'risk') +
        stat(`${v.n} 期累计（${(v.n / 3).toFixed(1)} 天）`, (total >= 0 ? '+' : '−') + fmtN(Math.abs(total), 2) + ' USDT', total >= 0 ? 'ok' : 'risk') +
        stat('若用 10x 杠杆：累计占保证金', fmtP(Math.abs(total) / (v.notional / 10), 1), Math.abs(total) / (v.notional / 10) > 0.2 ? 'risk' : '') +
        stat('平台区（资金费率 = 利率）', `${lo.toFixed(2)}% ~ ${hi.toFixed(2)}%`);
      const pts = [], id = [];
      for (let i = 0; i <= 400; i++) { const x = -1 + 2 * i / 400; pts.push([x, fr(x, v)]); id.push([x, x]); }
      const yM = Math.max(1, v.cap * 1.1);
      $('[data-c]', el).innerHTML = lineChart({
        label: '溢价指数到资金费率的映射', h: 260, xr: [-1, 1], yr: [-yM, yM],
        series: [{ pts: id, cls: 's2' }, { pts }],
        hlines: [{ y: v.cap, cls: 's3', label: '上限 +' + v.cap.toFixed(2) + '%' }, { y: -v.cap, cls: 's3', label: '下限 −' + v.cap.toFixed(2) + '%' }, { y: 0, cls: 'grid' }],
        markers: [{ x: v.prem, y: F, cls: 'dot2', label: `溢价 ${v.prem.toFixed(2)}% → ${F.toFixed(3)}%` }],
        xticks: [-1, -0.5, 0, 0.5, 1], fx: t => t + '%', yticks: [-yM, -yM / 2, 0, yM / 2, yM].map(t => +t.toFixed(2)), fy: t => t + '%'
      });
      const vd = $('[data-vd]', el);
      const who = F > 0 ? '多头付给空头' : F < 0 ? '空头付给多头' : '双方都不付';
      let why;
      if (F > 0 && v.prem > hi) why = '永续价格高于指数价格（多头太拥挤）。持多成本上升，部分多头平仓；套利者“做空永续 + 买入现货”赚资金费，卖压把永续价格压回指数。';
      else if (F < 0) why = '永续价格低于指数价格（空头太拥挤）。持空成本上升，部分空头平仓；套利者“做多永续 + 卖出现货/借币卖出”，买压把永续价格抬回指数。';
      else why = '溢价落在平台区内，资金费率等于利率项（示例 0.01%/8h）。这代表“持有 USDT 和持有币”的利率差，价格已经足够接近指数。';
      vd.className = 'verdict ' + (mine >= 0 ? 'ok' : 'warn');
      vd.textContent = `本期 ${who}。${why} 你${side === 'long' ? '做多' : '做空'}，${mine >= 0 ? '收到' : '支付'} ${fmtN(Math.abs(mine), 2)} USDT/期。`;
    };
    seg(el, 'side', s => { side = s; draw(); });
    V = bindInputs(el, {
      prem: v => (v >= 0 ? '+' : '') + v.toFixed(2) + '%', rate: v => v.toFixed(3) + '%', clamp: v => '±' + v.toFixed(2) + '%',
      cap: v => '±' + v.toFixed(2) + '%', notional: v => v.toLocaleString() + ' USDT', n: v => v + ' 期'
    }, v => { if (V) draw(v); else setTimeout(() => draw(v)); });
  }
});
})();
