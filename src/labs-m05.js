/* ---------- M04 实验：sandwich ---------- */
(() => {
addLab('sandwich', {
  ch: 'm05-7', title: '三明治攻击模拟器', desc: '一个 ETH/USDC 恒定乘积池。你提交买单并设置滑点容忍度，机器人计算在你的容忍度内能抢跑的最大金额，按“机器人买 → 你买 → 机器人卖”三步执行。为简化，池子手续费为 0。',
  mount(el, p) {
    let route = 'public';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 保持默认值（池子 1,000 ETH、买单 30,000 USDC、滑点 1%），核对三步后的价格和机器人利润。② 把滑点拉到 5%，看你少拿的 ETH 和机器人利润一起放大。③ 把滑点拉到 0.1%，看机器人利润是否低于 Gas，攻击因此不划算。④ 切换到“私有交易池”，三明治不再发生。</div>
    <div class="row-btns">${segHtml('route', [['public', '公开内存池'], ['private', '使用私有交易池']], 'public')}</div>
    <div class="ctrls">${rng(p, 'depth', '池子 ETH 数量（深度，初始价格 3,000）', 100, 10000, 100, 1000)}${rng(p, 'amt', '你的买单（USDC）', 1000, 300000, 1000, 30000)}${rng(p, 'slip', '滑点容忍度', 0.1, 5, 0.1, 1)}${rng(p, 'gas', '机器人两笔交易的 Gas + 小费（示例，USDC）', 0, 300, 5, 40)}</div>
    <div class="stats" data-s></div><div class="log" data-log></div><div data-c></div><div class="verdict" data-vd></div>`;

    // 恒定乘积：x = ETH 储备，y = USDC 储备，k = x·y
    const buy = (x, y, usdc) => { const ny = y + usdc, nx = x * y / ny; return { out: x - nx, x: nx, y: ny }; };
    const sell = (x, y, eth) => { const nx = x + eth, ny = x * y / nx; return { out: y - ny, x: nx, y: ny }; };

    // 给定参数，模拟一次完整攻击（private=true 时不攻击）
    function sim(v, slipPct, priv) {
      const x0 = v.depth, y0 = v.depth * 3000;
      const clean = buy(x0, y0, v.amt).out;              // 无攻击时你得到的 ETH
      const minOut = clean * (1 - slipPct / 100);         // 你的最低接受量
      const victimOut = f => buy(buy(x0, y0, f).x, buy(x0, y0, f).y, v.amt).out;
      // 二分搜索：在 victimOut(f) ≥ minOut 的前提下，f 最大是多少
      let lo = 0, hi = y0 * 5;
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (victimOut(mid) >= minOut) lo = mid; else hi = mid; }
      const f = lo;
      const s1 = buy(x0, y0, f);
      const s2 = buy(s1.x, s1.y, v.amt);
      const s3 = sell(s2.x, s2.y, s1.out);
      const gross = s3.out - f, net = gross - v.gas;
      const attack = !priv && net > 0 && f > 1;
      if (!attack) return { attack: false, priv, clean, minOut, f, gross, net, p0: y0 / x0, got: clean, after: (y0 + v.amt) / (x0 - clean) };
      return { attack: true, clean, minOut, f, gross, net, got: s2.out, botEth: s1.out, botBack: s3.out,
        p0: y0 / x0, p1: s1.y / s1.x, p2: s2.y / s2.x, p3: s3.y / s3.x };
    }

    const upd = v => {
      const r = sim(v, v.slip, route === 'private');
      const loss = r.clean - r.got;
      $('[data-s]', el).innerHTML =
        stat('无攻击时你得到', fmtN(r.clean, 4) + ' ETH') +
        stat('最低接受量（滑点保护）', fmtN(r.minOut, 4) + ' ETH') +
        stat('实际得到', fmtN(r.got, 4) + ' ETH', r.attack ? 'risk' : 'ok') +
        stat('你少拿', r.attack ? fmtN(loss, 4) + ' ETH ≈ $' + fmtN(loss * r.p0, 0) : '0', r.attack ? 'risk' : 'ok') +
        stat('机器人抢跑金额', r.attack ? fmtN(r.f, 0) + ' USDC' : '—') +
        stat('机器人净利润（扣 Gas）', r.attack ? '$' + fmtN(r.net, 2) : (r.priv ? '无法攻击' : '不划算：$' + fmtN(r.net, 2)), r.attack ? 'warn' : '');
      const L = $('[data-log]', el);
      if (r.attack) {
        L.innerHTML = `<div>初始价格：<b>${fmtN(r.p0, 2)}</b> USDC/ETH</div>
          <div>① 机器人买入：付 ${fmtN(r.f, 2)} USDC，得 ${fmtN(r.botEth, 4)} ETH → 价格 <b>${fmtN(r.p1, 2)}</b></div>
          <div>② 你买入：付 ${fmtN(v.amt, 2)} USDC，得 ${fmtN(r.got, 4)} ETH（≥ 最低 ${fmtN(r.minOut, 4)}，交易成功）→ 价格 <b>${fmtN(r.p2, 2)}</b></div>
          <div>③ 机器人卖出：卖 ${fmtN(r.botEth, 4)} ETH，得 ${fmtN(r.botBack, 2)} USDC → 价格 <b>${fmtN(r.p3, 2)}</b></div>
          <div>机器人毛利 ${fmtN(r.gross, 2)} USDC − Gas ${fmtN(v.gas, 0)} = 净利 <b>${fmtN(r.net, 2)}</b> USDC</div>`;
      } else {
        L.innerHTML = `<div>初始价格：<b>${fmtN(r.p0, 2)}</b> USDC/ETH</div>
          <div>${r.priv ? '你的交易走私有通道，直接送到构建者，机器人在公开内存池里看不到它。' : `机器人最多能抢跑 ${fmtN(r.f, 0)} USDC，毛利 ${fmtN(r.gross, 2)} USDC，不够付 Gas ${fmtN(v.gas, 0)} USDC，放弃攻击。`}</div>
          <div>你买入：付 ${fmtN(v.amt, 2)} USDC，得 ${fmtN(r.got, 4)} ETH → 价格 <b>${fmtN(r.after, 2)}</b></div>`;
      }
      // 图：机器人净利润随滑点容忍度变化（公开内存池）
      const pts = [];
      for (let s = 0.1; s <= 5.0001; s += 0.1) { const q = sim(v, s, false); pts.push([s, Math.max(0, q.net)]); }
      const ymax = Math.max(10, ...pts.map(q => q[1])) * 1.1;
      const cur = Math.max(0, sim(v, v.slip, false).net);
      $('[data-c]', el).innerHTML = lineChart({ label: '机器人净利润 vs 你的滑点容忍度', h: 200, xr: [0.1, 5], yr: [0, ymax], series: [{ pts, area: true }],
        markers: [{ x: v.slip, y: cur, cls: 'dot2', label: '$' + fmtN(cur, 0) }], xticks: [0.1, 1, 2, 3, 4, 5], fx: t => t + '%',
        yticks: [0, ymax / 2, ymax].map(t => Math.round(t)), fy: t => '$' + t.toLocaleString() });
      const vd = $('[data-vd]', el);
      if (r.priv) { vd.className = 'verdict ok'; vd.textContent = '私有交易池：交易不进入公开内存池，机器人看不到也无法夹你。代价是你要信任私有通道的运营方不泄露、不自己抢跑。'; }
      else if (r.attack) { vd.className = 'verdict ' + (v.slip >= 2 ? 'risk' : 'warn'); vd.textContent = `机器人把你的成交价推到你允许的最坏价格附近。滑点设得越大，机器人能抢跑的金额越大，你被夹得越多。当前你多付约 $${fmtN((r.clean - r.got) * r.p0, 0)}。但滑点设得太小，正常的价格波动也会让交易回滚失败（仍要付 Gas）。`; }
      else { vd.className = 'verdict info'; vd.textContent = '滑点很小时，机器人的可抢跑空间不足以覆盖 Gas，攻击不划算。代价是：价格只要正常波动超过你的容忍度，交易就会失败。'; }
    };
    let B;
    seg(el, 'route', m => { route = m; B.upd(); });
    B = bindInputs(el, { depth: v => v.toLocaleString() + ' ETH', amt: v => v.toLocaleString() + ' USDC', slip: v => v.toFixed(1) + '%', gas: v => '$' + v }, upd);
  }
});
})();
