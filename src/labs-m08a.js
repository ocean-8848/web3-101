/* ---------- Labs M08a: arb（预测市场完整集合套利） ---------- */
(() => {
addLab('arb', {
  ch: 'm08-2', title: '预测市场套利检测器', desc: '二元市场的订单簿简化成 4 个价格：YES 买一 / 卖一、NO 买一 / 卖一。加上手续费和数量，实时判断能否通过“完整集合”套利，并给出逐步资金流。下方还有一个 3 结果市场。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认数据：YES 卖一 0.57 + NO 卖一 0.42 = 0.99，手续费 0.5%，存在“买入完整集合再赎回”套利。② 把手续费拉到 1.5%：利润被吃光。③ 把 YES 买一调到 0.62、NO 买一调到 0.45：出现“铸造再卖出”套利。④ 在下方 3 结果市场里，让三个价格之和偏离 1，观察方向变化。</div>
    <h3 style="margin:6px 0 0">A. 二元市场（YES / NO）</h3>
    <div class="ctrls">${rng(p, 'yb', 'YES 买一价 bid', 0.01, 0.99, 0.01, 0.55)}${rng(p, 'ya', 'YES 卖一价 ask', 0.01, 0.99, 0.01, 0.57)}${rng(p, 'nb', 'NO 买一价 bid', 0.01, 0.99, 0.01, 0.41)}${rng(p, 'na', 'NO 卖一价 ask', 0.01, 0.99, 0.01, 0.42)}${rng(p, 'fee', '手续费率（按成交额）', 0, 3, 0.1, 0.5)}${rng(p, 'qty', '可交易数量（份，受盘口深度限制）', 100, 10000, 100, 1000)}</div>
    <div class="stats" data-s></div>
    <div class="verdict" data-vd></div>
    <div class="log" data-log style="max-height:300px"></div>
    <h3 style="margin:10px 0 0">B. 多结果市场（3 个互斥结果，恰好一个为真）</h3>
    <div class="ctrls">${rng(p, 'm1', '结果 A 价格', 0.01, 0.99, 0.01, 0.40)}${rng(p, 'm2', '结果 B 价格', 0.01, 0.99, 0.01, 0.35)}${rng(p, 'm3', '结果 C 价格', 0.01, 0.99, 0.01, 0.30)}</div>
    <div class="small muted">简化：每个结果只有一个价格（买卖同价）。手续费率和数量沿用上方 A 区的设置。</div>
    <div class="stats" data-s2></div>
    <div class="verdict" data-vd2></div>
    <div class="log" data-log2 style="max-height:260px"></div>`;
    const f2 = x => x.toFixed(2), f4 = x => x.toFixed(4);
    const usd = x => (x < 0 ? '−' : '') + fmtN(Math.abs(x), 2) + ' USDC';
    const lines = arr => arr.map(([c, s]) => `<div class="${c}">${s}</div>`).join('');
    bindInputs(el, { yb: f2, ya: f2, nb: f2, na: f2, m1: f2, m2: f2, m3: f2, fee: v => v.toFixed(1) + '%', qty: v => v.toLocaleString() + ' 份' }, v => {
      const f = v.fee / 100, N = v.qty;
      /* ---------- A 区：二元市场 ---------- */
      (() => {
      const askSum = v.ya + v.na, bidSum = v.yb + v.nb;
      const buyCost = askSum * (1 + f);           // 买 1 YES + 1 NO 的总成本（含费）
      const sellGet = bidSum * (1 - f);           // 卖 1 YES + 1 NO 的净收入（扣费）
      const buyPer = 1 - buyCost, sellPer = sellGet - 1;
      const midY = (v.yb + v.ya) / 2, midN = (v.nb + v.na) / 2, midSum = midY + midN;
      const crossedY = v.yb > v.ya, crossedN = v.nb > v.na;
      const vd = $('[data-vd]', el), log = $('[data-log]', el);
      let st = stat('YES 卖一 + NO 卖一', f2(askSum), askSum < 1 ? 'ok' : '') + stat('YES 买一 + NO 买一', f2(bidSum), bidSum > 1 ? 'ok' : '') +
        stat('YES 隐含概率（中间价）', fmtP(midY, 1)) + stat('NO 隐含概率（中间价）', fmtP(midN, 1)) +
        stat('中间价之和偏离 1', (midSum >= 1 ? '+' : '') + f4(midSum - 1), Math.abs(midSum - 1) > 0.02 ? 'warn' : '');
      if (crossedY || crossedN) {
        vd.className = 'verdict warn';
        vd.textContent = `盘口交叉：${crossedY ? 'YES' : 'NO'} 的买一价高于卖一价。真实订单簿里撮合引擎会立刻成交这两张单，这种状态不会存在。请把买一价调到卖一价以下。`;
        log.innerHTML = lines([['info', '规则：同一个代币，买一价（最高买价）≤ 卖一价（最低卖价）。否则两张订单本身就能成交。']]);
        $('[data-s]', el).innerHTML = st; return;
      }
      if (buyPer > 1e-9) {
        st += stat('每份利润（买入集合）', usd(buyPer), 'ok') + stat(`总利润（${N.toLocaleString()} 份）`, usd(buyPer * N), 'ok') + stat('占用资金', usd(buyCost * N)) + stat('收益率', fmtP(buyPer / buyCost, 2), 'ok');
        vd.className = 'verdict ok';
        vd.textContent = `套利：买入完整集合再赎回。YES 卖一 ${f2(v.ya)} + NO 卖一 ${f2(v.na)} = ${f2(askSum)}，含 ${v.fee.toFixed(1)}% 手续费后成本 ${f4(buyCost)} < 1。每份赚 ${f4(buyPer)} USDC。`;
        log.innerHTML = lines([
          ['info', `第 1 步  在 YES 卖一价 ${f2(v.ya)} 买入 ${N} 份 YES：付出 ${usd(v.ya * N)}，手续费 ${usd(v.ya * N * f)}`],
          ['info', `第 2 步  在 NO 卖一价 ${f2(v.na)} 买入 ${N} 份 NO：付出 ${usd(v.na * N)}，手续费 ${usd(v.na * N * f)}`],
          ['info', `第 3 步  现在持有 ${N} 个完整集合（1 YES + 1 NO），总成本 ${usd(buyCost * N)}`],
          ['info', `第 4 步  调用合并 merge：${N} 个完整集合 → 立即取回 ${usd(N)}（不必等结算）`],
          ['ok', `结果  净利润 ${usd(buyPer * N)}。无论事件结果如何，利润都已锁定。`],
          ['warn', '注意  两腿要几乎同时成交。只成交一腿时，你持有的是单边方向仓位，价格可能马上变化（腿风险）。']
        ]);
      } else if (sellPer > 1e-9) {
        st += stat('每份利润（铸造卖出）', usd(sellPer), 'ok') + stat(`总利润（${N.toLocaleString()} 份）`, usd(sellPer * N), 'ok') + stat('占用资金', usd(N)) + stat('收益率', fmtP(sellPer, 2), 'ok');
        vd.className = 'verdict ok';
        vd.textContent = `套利：铸造完整集合再分别卖出。YES 买一 ${f2(v.yb)} + NO 买一 ${f2(v.nb)} = ${f2(bidSum)}，扣 ${v.fee.toFixed(1)}% 手续费后收入 ${f4(sellGet)} > 1。每份赚 ${f4(sellPer)} USDC。`;
        log.innerHTML = lines([
          ['info', `第 1 步  存入 ${usd(N)}，调用拆分 split：得到 ${N} 份 YES + ${N} 份 NO`],
          ['info', `第 2 步  在 YES 买一价 ${f2(v.yb)} 卖出 ${N} 份 YES：收到 ${usd(v.yb * N)}，扣手续费 ${usd(v.yb * N * f)}`],
          ['info', `第 3 步  在 NO 买一价 ${f2(v.nb)} 卖出 ${N} 份 NO：收到 ${usd(v.nb * N)}，扣手续费 ${usd(v.nb * N * f)}`],
          ['ok', `结果  收回 ${usd(sellGet * N)}，净利润 ${usd(sellPer * N)}。手里不剩任何份额，没有方向风险。`],
          ['warn', '注意  买一价只代表最优一档的深度。卖出数量超过这一档时，后面的成交价更低，利润会缩小。']
        ]);
      } else {
        const gapBuy = buyCost - 1, gapSell = 1 - sellGet;
        st += stat('买入集合还差', '+' + f4(gapBuy) + ' / 份', 'warn') + stat('铸造卖出还差', '+' + f4(gapSell) + ' / 份', 'warn');
        vd.className = 'verdict info';
        vd.textContent = `无套利。买入集合成本 ${f4(buyCost)} ≥ 1，铸造卖出收入 ${f4(sellGet)} ≤ 1。市场隐含 YES 概率约 ${fmtP(midY / midSum, 1)}（中间价归一化后）。`;
        log.innerHTML = lines([
          ['info', `检查 1  买入集合：(${f2(v.ya)} + ${f2(v.na)}) × (1 + ${v.fee.toFixed(1)}%) = ${f4(buyCost)}，不低于赎回所得 1，不做。`],
          ['info', `检查 2  铸造卖出：(${f2(v.yb)} + ${f2(v.nb)}) × (1 − ${v.fee.toFixed(1)}%) = ${f4(sellGet)}，不高于铸造成本 1，不做。`],
          ['info', `解读  中间价之和 ${f4(midSum)}。偏离 1 的部分主要来自买卖价差和手续费，这是做市商的收入，不是免费利润。`],
          ['info', `无套利带  ask 之和 < ${f4(1 / (1 + f))} 时买入集合有利可图；bid 之和 > ${f4(1 / (1 - f))} 时铸造卖出有利可图。两者之间就是无套利带。`]
        ]);
      }
      $('[data-s]', el).innerHTML = st;
      })();

      /* ---------- B 区：3 结果市场 ---------- */
      const S = v.m1 + v.m2 + v.m3;
      const bPer = 1 - S * (1 + f), sPer = S * (1 - f) - 1;
      const vd2 = $('[data-vd2]', el), log2 = $('[data-log2]', el);
      let s2 = stat('概率之和 A + B + C', f4(S), Math.abs(S - 1) > 0.02 ? 'warn' : 'ok') + stat('偏离 1', (S >= 1 ? '+' : '') + f4(S - 1)) +
        stat('归一化概率 A / B / C', `${fmtP(v.m1 / S, 0)} / ${fmtP(v.m2 / S, 0)} / ${fmtP(v.m3 / S, 0)}`);
      if (bPer > 1e-9) {
        s2 += stat('每组利润', usd(bPer), 'ok') + stat('总利润', usd(bPer * N), 'ok');
        vd2.className = 'verdict ok';
        vd2.textContent = `概率之和 ${f4(S)} 偏低：买入每个结果各 1 份。三个结果恰好一个为真，所以这组份额结算时必兑 1 USDC。`;
        log2.innerHTML = lines([
          ['info', `第 1 步  买 A、B、C 各 ${N} 份：成本 ${usd(S * N)}，手续费 ${usd(S * N * f)}`],
          ['info', `第 2 步  持有 ${N} 个“完整集合”（每个结果各 1 份）`],
          ['info', `第 3 步  合并 merge 取回 ${usd(N)}，或等结算：无论哪个结果为真，都兑付 ${usd(N)}`],
          ['ok', `结果  净利润 ${usd(bPer * N)}`]
        ]);
      } else if (sPer > 1e-9) {
        s2 += stat('每组利润', usd(sPer), 'ok') + stat('总利润', usd(sPer * N), 'ok');
        vd2.className = 'verdict ok';
        vd2.textContent = `概率之和 ${f4(S)} 偏高：用 1 USDC 铸造一组（A、B、C 各 1 份），再分别卖出。`;
        log2.innerHTML = lines([
          ['info', `第 1 步  存入 ${usd(N)}，拆分 split 得到 A、B、C 各 ${N} 份`],
          ['info', `第 2 步  分别卖出：收入 ${usd(S * N)}，扣手续费 ${usd(S * N * f)}`],
          ['ok', `结果  净利润 ${usd(sPer * N)}，不持有任何仓位`],
          ['warn', '注意  结果越多，需要同时成交的腿越多，腿风险和盘口深度问题越严重。']
        ]);
      } else {
        vd2.className = 'verdict info';
        vd2.textContent = `无套利：概率之和 ${f4(S)} 落在手续费形成的无套利带 [${f4(1 / (1 + f))}, ${f4(1 / (1 - f))}] 内。`;
        log2.innerHTML = lines([
          ['info', `买入一组成本 ${f4(S * (1 + f))} ≥ 1，铸造卖出收入 ${f4(S * (1 - f))} ≤ 1。`],
          ['info', '解读  用各价格除以总和，就得到归一化后的隐含概率。']
        ]);
      }
      $('[data-s2]', el).innerHTML = s2;
    });
  }
});
})();
