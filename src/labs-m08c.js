/* ---------- Labs M11 期权定价与盈亏: option ---------- */
(() => {

addLab('option', {
  ch: 'm08-60', title: '期权定价、盈亏曲线与 Greeks 模拟器', desc: '调整标的价格、行权价、剩余天数与隐含波动率（IV），实时计算 Black-Scholes 理论权利金、Delta/Gamma/Vega/Theta，并绘制买方与卖方的到期盈亏线。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 保持看涨期权（Call）买方，拖动“隐含波动率 IV”从 40% 到 120%，观察标的现价不变时权利金为何暴涨。② 把“剩余天数”拉到 1 天，看时间价值归零、Delta 在行权价附近急剧跳变（高 Gamma）。③ 切换到“卖方（DOV 视角）”，看到期盈亏曲线如何变成“收益封顶、亏损敞口巨大”。</div>
    <div class="ctrls">
      ${rng(p, 'spot', '标的现价 S（美元）', 2000, 4500, 50, 3000)}
      ${rng(p, 'strike', '行权价 K（美元）', 2000, 4500, 50, 3200)}
      ${rng(p, 'days', '剩余到期天数 T（天）', 1, 90, 1, 30)}
      ${rng(p, 'iv', '隐含波动率 IV（%）', 20, 150, 5, 70)}
    </div>
    <div class="row-btns">
      ${segHtml('kind', [['call', '看涨期权 Call'], ['put', '看跌期权 Put']], 'call')}
      ${segHtml('side', [['long', '买方（付权利金）'], ['short', '卖方 / DOV（收权利金）']], 'long')}
    </div>
    <div class="stats" data-s></div>
    <div data-ch></div>
    <div class="log" data-raw></div>
    <div class="verdict" data-vd></div>`;

    // 标准正态分布 CDF 与 PDF 近似（Abramowitz & Stegun）
    const pdf = x => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    const cdf = x => {
      const a = Math.abs(x), t = 1 / (1 + 0.2316419 * a);
      const d = pdf(a) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      return x >= 0 ? 1 - d : d;
    };

    const SK = seg(el, 'kind', () => B.upd());
    const SS = seg(el, 'side', () => B.upd());

    const B = bindInputs(el, {
      spot: x => '$' + x, strike: x => '$' + x, days: x => x + ' 天', iv: x => x + '%'
    }, v => {
      const S = v.spot, K = v.strike, T = v.days / 365, sig = v.iv / 100;
      const isCall = SK.get() === 'call', isLong = SS.get() === 'long';
      const sqrtT = Math.sqrt(T);
      const d1 = (Math.log(S / K) + 0.5 * sig * sig * T) / (sig * sqrtT);
      const d2 = d1 - sig * sqrtT;
      const prem = isCall ? (S * cdf(d1) - K * cdf(d2)) : (K * cdf(-d2) - S * cdf(-d1));
      const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
      const timeVal = Math.max(0, prem - intrinsic);

      const sign = isLong ? 1 : -1;
      const delta = sign * (isCall ? cdf(d1) : cdf(d1) - 1);
      const gamma = sign * (pdf(d1) / (S * sig * sqrtT));
      const vega = sign * (S * pdf(d1) * sqrtT) / 100; // per 1% IV
      const theta = sign * (-(S * pdf(d1) * sig) / (2 * sqrtT)) / 365; // per day
      const be = isCall ? (K + prem) : (K - prem);

      $('[data-s]', el).innerHTML =
        stat('理论权利金', '$' + fmtN(prem, 2), 'info') +
        stat('内在 / 时间价值', '$' + fmtN(intrinsic, 1) + ' / $' + fmtN(timeVal, 1)) +
        stat('盈亏平衡点', '$' + fmtN(be, 1), 'ok') +
        stat('Delta / Gamma', fmtN(delta, 3) + ' / ' + fmtN(gamma * 100, 3) + 'e-2') +
        stat('Vega / Theta(日)', (vega >= 0 ? '+' : '') + '$' + fmtN(vega, 2) + ' / ' + (theta >= 0 ? '+' : '') + '$' + fmtN(theta, 2), theta < 0 ? 'warn' : 'ok');

      // 绘制到期盈亏曲线
      const xmin = Math.max(500, Math.round((K * 0.55) / 100) * 100);
      const xmax = Math.round((K * 1.45) / 100) * 100;
      const pts = [];
      let ymin = 0, ymax = 0;
      for (let x = xmin; x <= xmax; x += (xmax - xmin) / 60) {
        const pay = isCall ? Math.max(0, x - K) : Math.max(0, K - x);
        const pnl = sign * (pay - prem);
        pts.push([x, pnl]);
        if (pnl < ymin) ymin = pnl;
        if (pnl > ymax) ymax = pnl;
      }
      const pad = Math.max(150, (ymax - ymin) * 0.15);
      const curPay = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
      const curPnl = sign * (curPay - prem);

      $('[data-ch]', el).innerHTML = lineChart({
        w: 640, h: 220,
        xr: [xmin, xmax], yr: [ymin - pad, ymax + pad],
        xticks: [xmin, Math.round((xmin + K) / 2), K, Math.round((xmax + K) / 2), xmax],
        yticks: [Math.round(ymin), 0, Math.round(ymax)],
        fx: t => '$' + t, fy: t => (t >= 0 ? '+' : '') + '$' + t,
        label: '到期日盈亏曲线（美元）',
        hlines: [{ y: 0, cls: 's3', label: '盈亏平衡线 $0' }],
        vlines: [{ x: K, cls: 's3', label: '行权价 K' }],
        series: [{ pts, cls: isLong ? 's1' : 's2' }],
        markers: [{ x: S, y: curPnl, label: '当前现价到期盈亏', cls: 'dot' }]
      });

      $('[data-raw]', el).innerHTML =
        `方向：${isLong ? '买方（Long）' : '卖方（Short / DOV）'} ${isCall ? '看涨 Call' : '看跌 Put'} | 现价 S=$${S}，行权价 K=$${K}，剩余 ${v.days} 天，IV=${v.iv}%。<br>` +
        `每涨 $1 标的，仓位约变动 ${delta >= 0 ? '+' : ''}$${fmtN(delta, 2)}；每过 1 天时间衰减 ${theta >= 0 ? '+' : ''}$${fmtN(theta, 2)}；IV 每涨 1% 变动 ${vega >= 0 ? '+' : ''}$${fmtN(vega, 2)}。`;

      const vd = $('[data-vd]', el);
      if (!isLong && v.days <= 7 && Math.abs(S - K) / K < 0.08) {
        vd.className = 'verdict risk';
        vd.textContent = '高 Gamma 警告：卖方临近到期且现价贴近行权价，标的小幅跳空就会让 Delta 剧烈翻转，极易引发对冲亏损或强平。';
      } else if (!isLong) {
        vd.className = 'verdict warn';
        vd.textContent = `卖方视角：每天坐收约 $${fmtN(Math.abs(theta), 2)} 的时间衰减，最大盈利锁定为 $${fmtN(prem, 1)}；但一旦突破盈亏平衡点 $${fmtN(be, 1)}，亏损将随行情单边扩大。`;
      } else {
        vd.className = 'verdict ok';
        vd.textContent = `买方视角：最大亏损锁定在权利金 $${fmtN(prem, 1)}，永不爆仓；但每天需承受约 $${fmtN(Math.abs(theta), 2)} 的时间衰减，需在到期前越过 $${fmtN(be, 1)} 才能净盈利。`;
      }
    });
  }
});

})();
