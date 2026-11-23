/* ---------- Labs A: hashchain, confirm, amm, il, lending ---------- */

addLab('hashchain', {
  ch: 'm01', title: '哈希链挖矿', desc: '4 个区块用哈希串成链。改动任意区块的数据，观察后续区块如何失效；再用“挖矿”重新找到合格的 nonce。',
  mount(el, p) {
    const blocks = [
      { data: 'Alice → Bob 5 BTC', nonce: 0 },
      { data: 'Bob → Carol 2 BTC', nonce: 0 },
      { data: 'Carol → Dave 1 BTC', nonce: 0 },
      { data: 'Dave → Erin 0.5 BTC', nonce: 0 }
    ];
    let diff = 3, mining = null;
    el.innerHTML = `<div class="try"><b>试一试：</b>① 点击“全部挖矿”让链有效。② 把区块 #2 的“Bob → Carol 2 BTC”改成“20 BTC”。③ 观察 #2、#3、#4 全部变红。④ 调高难度，再挖一次，感受时间成本。</div>
    <div class="ctrls">${rng(p, 'diff', '难度（哈希开头 0 的个数）', 1, 4, 1, 3)}</div>
    <div class="row-btns"><button class="btn primary" data-act="all">⛏ 全部挖矿</button><span class="muted small" data-o2="msg">每多一个 0，平均尝试次数 ×16。</span></div>
    <div class="two" data-blocks></div>`;
    const box = $('[data-blocks]', el), msg = $('[data-o2="msg"]', el);
    const hashOf = (i, prev) => sha256(`${i}|${prev}|${blocks[i].data}|${blocks[i].nonce}`);
    function compute() {
      let prev = '0'.repeat(64), okChain = true;
      return blocks.map((b, i) => {
        const h = hashOf(i, prev);
        const powOk = h.startsWith('0'.repeat(diff));
        okChain = okChain && powOk;
        const r = { prev, h, ok: okChain };
        prev = h;
        return r;
      });
    }
    function draw() {
      const st = compute();
      box.innerHTML = blocks.map((b, i) => `<div class="stat ${st[i].ok ? 'ok' : 'risk'}" style="display:grid;gap:6px">
        <div class="k" style="display:flex;justify-content:space-between"><b>区块 #${i + 1}</b><span>${st[i].ok ? '✓ 有效' : '✗ 无效'}</span></div>
        <label class="small muted" for="${p}-d${i}">数据</label><input type="text" id="${p}-d${i}" data-i="${i}" value="${esc(b.data)}">
        <div class="small mono">nonce: ${b.nonce}</div>
        <div class="small mono muted" style="overflow-wrap:anywhere">prev: ${st[i].prev.slice(0, 20)}…</div>
        <div class="small mono" style="overflow-wrap:anywhere">hash: <b>${st[i].h.slice(0, diff)}</b>${st[i].h.slice(diff, 24)}…</div>
        <button class="btn" data-mine="${i}">⛏ 挖这个区块</button></div>`).join('');
      $$('input[data-i]', box).forEach(inp => inp.addEventListener('change', () => { blocks[+inp.dataset.i].data = inp.value; draw(); }));
      $$('[data-mine]', box).forEach(b => b.addEventListener('click', () => mine([+b.dataset.mine])));
    }
    function mine(list) {
      if (mining) return;
      const t0 = performance.now(); let tries = 0;
      const queue = [...list];
      const step = () => {
        if (!el.isConnected) { mining = null; return; }
        const i = queue[0];
        if (i === undefined) { mining = null; msg.textContent = `完成：共尝试 ${tries.toLocaleString()} 次，用时 ${((performance.now() - t0) / 1000).toFixed(2)} 秒。`; draw(); return; }
        const prev = i === 0 ? '0'.repeat(64) : compute()[i - 1].h;
        const target = '0'.repeat(diff);
        for (let k = 0; k < 3000; k++) {
          tries++;
          if (hashOf(i, prev).startsWith(target)) { queue.shift(); break; }
          blocks[i].nonce++;
        }
        msg.textContent = `挖矿中… 区块 #${i + 1}，已尝试 ${tries.toLocaleString()} 次`;
        mining = setTimeout(step, 0);
      };
      list.forEach(i => { blocks[i].nonce = 0; });
      mining = setTimeout(step, 0);
    }
    $('[data-act="all"]', el).addEventListener('click', () => mine([0, 1, 2, 3]));
    bindInputs(el, { diff: v => v + ' 个 0' }, v => { diff = v.diff; draw(); });
  }
});

addLab('confirm', {
  ch: 'm01', title: '确认数与双花概率', desc: '攻击者控制一部分算力，想私下挖一条更长的链抹掉你的交易。用中本聪白皮书第 11 节的公式，计算他在落后 z 个区块时追上的概率。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 攻击者算力 10%，确认数 6：成功率约 0.02%。② 把算力拉到 30%，找出让成功率低于 0.1% 的确认数。③ 把算力拉到 50%，观察确认数完全失效。</div>
    <div class="ctrls">${rng(p, 'q', '攻击者算力占比 q', 1, 50, 1, 10)}${rng(p, 'z', '等待确认数 z', 0, 30, 1, 6)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>`;
    function P(q, z) {
      const pp = 1 - q;
      if (q >= pp) return 1;
      const lam = z * (q / pp);
      let sum = 1, pois = Math.exp(-lam);
      for (let k = 0; k <= z; k++) {
        if (k > 0) pois *= lam / k;
        sum -= pois * (1 - Math.pow(q / pp, z - k));
      }
      return Math.max(0, sum);
    }
    bindInputs(el, { q: v => v + '%', z: v => v + ' 个' }, v => {
      const q = v.q / 100, pr = P(q, v.z);
      const need = (() => { for (let z = 0; z <= 300; z++) if (P(q, z) < 0.001) return z; return null; })();
      $('[data-s]', el).innerHTML = stat('攻击成功概率', pr >= 1 ? '100%' : pr < 1e-6 ? pr.toExponential(2) : fmtP(pr, 4), pr > 0.01 ? 'risk' : pr > 0.001 ? 'warn' : 'ok') +
        stat('等待时间（比特币 10 分钟/块）', v.z * 10 + ' 分钟') + stat('等待时间（以太坊 12 秒/块）', (v.z * 12 / 60).toFixed(1) + ' 分钟') +
        stat('成功率 < 0.1% 需要', need === null ? '不可能' : need + ' 个确认', need === null ? 'risk' : '');
      const pts = []; for (let z = 0; z <= 30; z++) pts.push([z, Math.max(-8, Math.log10(Math.max(P(q, z), 1e-8)))]);
      $('[data-c]', el).innerHTML = lineChart({ label: '成功概率随确认数变化（对数刻度）', xr: [0, 30], yr: [-8, 0], series: [{ pts, area: true }], markers: [{ x: v.z, y: Math.max(-8, Math.log10(Math.max(pr, 1e-8))), label: 'z = ' + v.z }], yticks: [0, -2, -4, -6, -8], fy: t => t === 0 ? '100%' : '1e' + t, xticks: [0, 5, 10, 15, 20, 25, 30], hlines: [{ y: -3, label: '0.1%' }] });
      const vd = $('[data-vd]', el);
      if (q >= 0.5) { vd.className = 'verdict risk'; vd.textContent = '攻击者算力 ≥ 50%：他的链迟早会更长。等多少确认都没用。这就是“51% 攻击”。'; }
      else if (pr > 0.01) { vd.className = 'verdict warn'; vd.textContent = '风险偏高。大额充值不能在这个确认数入账。'; }
      else { vd.className = 'verdict ok'; vd.textContent = '概率随确认数指数下降。交易所按资产价值和链的算力分布设置确认数。'; }
    });
  }
});

addLab('amm', {
  ch: 'm13', title: 'AMM 兑换模拟器（x·y=k）', desc: '一个 ETH/USDC 池子，初始价格 3,000 USDC。调节池子深度和交易量，看成交均价、价格影响和曲线上的移动。',
  mount(el, p) {
    let dir = 'sell';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 池子 1,000 ETH，卖出 10 ETH：价格影响约 1%。② 卖出 300 ETH：价格影响超过 20%。③ 把池子调到 10,000 ETH 再卖 300 ETH，对比结果。</div>
    <div class="row-btns">${segHtml('dir', [['sell', '卖出 ETH → 得到 USDC'], ['buy', '买入 ETH ← 付出 USDC']], 'sell')}</div>
    <div class="ctrls">${rng(p, 'depth', '池子 ETH 数量（深度）', 100, 10000, 100, 1000)}${rng(p, 'amt', '交易 ETH 数量', 1, 500, 1, 10)}${rng(p, 'fee', '手续费率', 0, 1, 0.05, 0.3)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict info" data-vd></div>`;
    const calc = v => {
      const x = v.depth, y = v.depth * 3000, k = x * y, f = v.fee / 100, spot = y / x;
      let dx = v.amt, dy, nx, ny;
      if (dir === 'sell') { const eff = dx * (1 - f); dy = y * eff / (x + eff); nx = x + dx; ny = y - dy; }
      else { if (dx >= x) dx = x * 0.99; dy = (y * dx / (x - dx)) / (1 - f); nx = x - dx; ny = y + dy * (1 - f); }
      const exec = dy / dx, newSpot = ny / nx;
      const impact = dir === 'sell' ? 1 - exec / spot : exec / spot - 1;
      return { x, y, k, spot, dx, dy, nx, ny, exec, newSpot, impact };
    };
    let B;
    const upd = v => {
      const r = calc(v);
      $('[data-s]', el).innerHTML = stat(dir === 'sell' ? '你得到 USDC' : '你付出 USDC', fmtN(r.dy, 0)) + stat('成交均价', fmtN(r.exec, 1)) +
        stat('价格影响（含手续费）', fmtP(r.impact), r.impact > 0.05 ? 'risk' : r.impact > 0.01 ? 'warn' : 'ok') + stat('交易后池内价格', fmtN(r.newSpot, 1));
      const xs = []; const lo = r.x * 0.4, hi = r.x * 1.8;
      for (let i = 0; i <= 80; i++) { const X = lo + (hi - lo) * i / 80; xs.push([X, r.k / X / 1e6]); }
      $('[data-c]', el).innerHTML = lineChart({ label: 'x·y=k 曲线', xr: [lo, hi], yr: [0, r.k / lo / 1e6 * 1.05], series: [{ pts: xs }], markers: [{ x: r.x, y: r.y / 1e6, label: '交易前', left: true }, { x: r.nx, y: r.ny / 1e6, cls: 'dot2', label: '交易后', below: true }], xticks: [lo, r.x, hi].map(Math.round), yticks: [0, r.k / r.x / 1e6, r.k / lo / 1e6].map(t => +t.toFixed(1)), fy: t => t + 'M', fx: t => t + ' ETH' });
      $('[data-vd]', el).textContent = `交易量占池子 ${fmtP(r.dx / r.x, 1)}。规律：价格影响 ≈ 交易量 / 池子深度。想让大额交易滑点小，需要更深的池子，或拆单、走聚合器。`;
    };
    seg(el, 'dir', d => { dir = d; B.upd(); });
    B = bindInputs(el, { depth: v => v.toLocaleString() + ' ETH', amt: v => v + ' ETH', fee: v => v.toFixed(2) + '%' }, upd);
  }
});

addLab('il', {
  ch: 'm13', title: '无常损失计算器', desc: '你以 3,000 USDC/ETH 的价格存入 1 ETH + 3,000 USDC（共 6,000 美元）。拖动价格，比较“做 LP”和“单纯持有”的价值，再加上手续费收入。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 价格涨到 2 倍：IL 约 −5.7%。② 跌到 0.5 倍：IL 也是 −5.7%（对称）。③ 设定价格 4 倍，调整手续费年化和天数，找到打平点。</div>
    <div class="ctrls">${rng(p, 'lr', '价格变化倍数 r', -2.3, 2.3, 0.01, 0.69)}${rng(p, 'apr', '手续费年化收益', 0, 100, 1, 20)}${rng(p, 'days', '持有天数', 1, 365, 1, 90)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>`;
    const il = r => 2 * Math.sqrt(r) / (1 + r) - 1;
    bindInputs(el, { lr: v => Math.exp(v).toFixed(2) + 'x', apr: v => v + '%', days: v => v + ' 天' }, v => {
      const r = Math.exp(v.lr), P = 3000 * r;
      const hodl = 3000 + P, lp = 6000 * Math.sqrt(r), loss = il(r), fee = lp * v.apr / 100 * v.days / 365;
      const net = lp + fee - hodl;
      $('[data-s]', el).innerHTML = stat('新 ETH 价格', fmtN(P, 0)) + stat('单纯持有价值', '$' + fmtN(hodl, 0)) + stat('LP 价值（不含手续费）', '$' + fmtN(lp, 0)) +
        stat('无常损失', fmtP(loss), loss < -0.05 ? 'risk' : loss < -0.01 ? 'warn' : 'ok') + stat('手续费收入', '$' + fmtN(fee, 0)) + stat('LP 相对持有的净盈亏', (net >= 0 ? '+$' : '−$') + fmtN(Math.abs(net), 0), net >= 0 ? 'ok' : 'risk');
      const pts = []; for (let i = 0; i <= 120; i++) { const x = Math.exp(-2.3 + 4.6 * i / 120); pts.push([x, il(x) * 100]); }
      $('[data-c]', el).innerHTML = lineChart({ label: '无常损失曲线', logx: true, xr: [0.1, 10], yr: [-50, 0], series: [{ pts, area: false }], markers: [{ x: r, y: loss * 100, cls: 'dot2', label: fmtP(loss, 1) }], xticks: [0.1, 0.25, 0.5, 1, 2, 4, 10], fx: t => t + 'x', yticks: [0, -10, -20, -30, -40, -50], fy: t => t + '%' });
      const vd = $('[data-vd]', el);
      vd.className = 'verdict ' + (net >= 0 ? 'ok' : 'warn');
      vd.textContent = net >= 0 ? `手续费覆盖了无常损失。做 LP 比单纯持有多赚 $${fmtN(net, 0)}。` : `手续费不足以覆盖无常损失。要打平，年化需要约 ${fmtN((hodl - lp) / lp / (v.days / 365) * 100, 1)}%。`;
    });
  }
});

addLab('lending', {
  ch: 'm13', title: '借贷健康因子与清算', desc: '抵押 ETH 借 USDC。清算阈值 82.5%、清算奖励 5%、单次最多清算 50% 债务（均为示例）。拖动 ETH 价格或点“模拟暴跌”。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 记下当前清算价。② 点“模拟暴跌 −40%”，观察健康因子跌破 1 的时刻。③ 把借款调高到 7,500，清算价上升多少？</div>
    <div class="ctrls">${rng(p, 'col', '抵押 ETH 数量', 1, 10, 0.5, 3)}${rng(p, 'debt', '借款 USDC', 500, 9000, 100, 5000)}${rng(p, 'price', 'ETH 价格', 500, 5000, 10, 3000)}</div>
    <div class="row-btns"><button class="btn" data-crash>📉 模拟暴跌 −40%</button><button class="btn" data-reset>重置价格 3000</button></div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>`;
    const LT = 0.825, BONUS = 0.05, CF = 0.5, MAXLTV = 0.8;
    let timer = null;
    const B = bindInputs(el, { col: v => v + ' ETH', debt: v => v.toLocaleString() + ' USDC', price: v => '$' + v.toLocaleString() }, v => {
      const colV = v.col * v.price, hf = colV * LT / v.debt, liqP = v.debt / (v.col * LT), ltv = v.debt / colV;
      $('[data-s]', el).innerHTML = stat('抵押品价值', '$' + fmtN(colV, 0)) + stat('当前 LTV', fmtP(ltv, 1), ltv > MAXLTV ? 'warn' : '') +
        stat('健康因子 HF', hf.toFixed(3), hf < 1 ? 'risk' : hf < 1.2 ? 'warn' : 'ok') + stat('清算价格', '$' + fmtN(liqP, 0));
      const pts = []; for (let pr = 500; pr <= 5000; pr += 50) pts.push([pr, Math.min(4, v.col * pr * LT / v.debt)]);
      $('[data-c]', el).innerHTML = lineChart({ label: '健康因子随 ETH 价格变化', xr: [500, 5000], yr: [0, 4], series: [{ pts }], hlines: [{ y: 1, label: 'HF = 1 清算线' }], vlines: [{ x: Math.min(5000, Math.max(500, liqP)), label: '清算价' }], markers: [{ x: v.price, y: Math.min(4, hf), cls: hf < 1 ? 'dot2' : 'dot', label: 'HF ' + hf.toFixed(2) }], xticks: [500, 1500, 2500, 3500, 4500], fx: t => '$' + t, yticks: [0, 1, 2, 3, 4] });
      const vd = $('[data-vd]', el);
      if (hf < 1) {
        const repay = v.debt * CF, seize = repay * (1 + BONUS) / v.price;
        vd.className = 'verdict risk';
        vd.textContent = seize > v.col ? `坏账：抵押品不足以覆盖清算。协议承担约 $${fmtN(repay * (1 + BONUS) - colV, 0)} 损失。` : `可被清算。清算人代还 ${fmtN(repay, 0)} USDC，拿走 ${seize.toFixed(3)} ETH（含 5% 奖励）。你损失奖励部分 $${fmtN(repay * BONUS, 0)}。`;
      } else if (hf < 1.2) { vd.className = 'verdict warn'; vd.textContent = `危险区。价格再跌 ${fmtP(1 - liqP / v.price, 1)} 就会被清算。考虑还款或追加抵押。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `安全。价格下跌 ${fmtP(1 - liqP / v.price, 1)} 才会触发清算。`; }
    });
    $('[data-crash]', el).addEventListener('click', () => {
      clearInterval(timer);
      const start = B.read().price, target = start * 0.6; let t = 0;
      timer = setInterval(() => { if (!el.isConnected) return clearInterval(timer); t += 1; B.set('price', Math.round(start - (start - target) * t / 40)); if (t >= 40) clearInterval(timer); }, 50);
    });
    $('[data-reset]', el).addEventListener('click', () => { clearInterval(timer); B.set('price', 3000); });
  }
});
