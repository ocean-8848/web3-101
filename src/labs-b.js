/* ---------- Labs B: threshold, eip1559, orderbook, finality, rollup ---------- */

addLab('threshold', {
  ch: 'm03', title: '门限签名：丢失 vs 被盗', desc: 'n 个持有人，任意 m 个签名即可动用资金。点击每个持有人切换状态：正常 → 丢失 → 被盗。观察“你还能签吗”和“攻击者能签吗”。',
  mount(el, p) {
    const NAMES = ['CEO 硬件钱包', 'CFO 手机', '服务器 A', '服务器 B', '托管商', '备份保险柜', '审计方'];
    let st = Array(7).fill('ok'), mode = 'mpc';
    el.innerHTML = `<div class="try"><b>试一试：</b>① n = 3，m = 2：标记 1 个丢失，仍能签名；再标记 1 个丢失，资金冻结。② 改成 m = 1：1 个被盗就会丢钱。③ 找出 n = 5 时同时容忍 2 丢失、2 被盗的 m。</div>
    <div class="ctrls">${rng(p, 'n', '持有人数量 n', 2, 7, 1, 3)}${rng(p, 'm', '签名门限 m', 1, 7, 1, 2)}</div>
    <div class="row-btns">${segHtml('mode', [['mpc', 'MPC 门限签名'], ['ms', '链上多签（Safe）']], 'mpc')}<button class="btn" data-clear>全部恢复正常</button></div>
    <div class="cards" data-keys style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"></div>
    <div class="stats" data-s></div><div class="verdict" data-vd></div><div class="small muted" data-mode></div>`;
    let V;
    const draw = (v) => {
      v = v || V.read();
      const { n, m } = v;
      if (m > n) { V.set('m', n); return; }
      const keys = st.slice(0, n);
      const ok = keys.filter(s => s === 'ok').length, lost = keys.filter(s => s === 'lost').length, stolen = keys.filter(s => s === 'stolen').length;
      const ownerCan = ok + stolen >= m, atkCan = stolen >= m;
      const LBL = { ok: '✓ 正常', lost: '✗ 丢失', stolen: '☠ 被盗' }, CLS = { ok: 'ok', lost: 'warn', stolen: 'risk' };
      $('[data-keys]', el).innerHTML = keys.map((s, i) => `<button type="button" class="stat ${CLS[s]}" data-key="${i}" style="text-align:left;cursor:pointer;font:inherit"><div class="k">${mode === 'mpc' ? '分片' : '私钥'} ${i + 1} · ${NAMES[i]}</div><div class="v" style="font-size:15px">${LBL[s]}</div></button>`).join('');
      $$('[data-key]', el).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.key; st[i] = st[i] === 'ok' ? 'lost' : st[i] === 'lost' ? 'stolen' : 'ok'; draw(); }));
      $('[data-s]', el).innerHTML = stat('可容忍丢失', (n - m) + ' 个') + stat('可容忍被盗', (m - 1) + ' 个') + stat('你能签名吗', ownerCan ? '能' : '不能', ownerCan ? 'ok' : 'warn') + stat('攻击者能签名吗', atkCan ? '能' : '不能', atkCan ? 'risk' : 'ok');
      const vd = $('[data-vd]', el);
      if (atkCan) { vd.className = 'verdict risk'; vd.textContent = `资金被盗：攻击者持有 ${stolen} 个，达到门限 ${m}。他可以立即转走全部资产。`; }
      else if (!ownerCan) { vd.className = 'verdict warn'; vd.textContent = `资金冻结：可用的只剩 ${ok + stolen} 个，低于门限 ${m}。没人能动这笔钱，包括你。`; }
      else if (stolen > 0) { vd.className = 'verdict warn'; vd.textContent = `暂时安全，但必须立刻行动：${mode === 'mpc' ? '重新分片（Reshare），让被盗分片失效，地址不变。' : '用剩余私钥把资金转到新的多签，或更换签名者。'}`; }
      else { vd.className = 'verdict ok'; vd.textContent = '安全：你能签名，攻击者不能。'; }
      $('[data-mode]', el).textContent = mode === 'mpc' ? 'MPC：链上只看到一个普通签名。被盗后可以重新分片，旧分片作废，地址不变。适合多链。' : '多签：链上合约检查 m 个签名，签名者公开可审计。更换签名者需要一笔链上交易。只能用在支持合约的链上。';
    };
    seg(el, 'mode', v => { mode = v; draw(); });
    $('[data-clear]', el).addEventListener('click', () => { st = Array(7).fill('ok'); draw(); });
    V = bindInputs(el, { n: v => v + ' 个', m: v => v + ' 个' }, draw);
  }
});

addLab('eip1559', {
  ch: 'm03', title: 'EIP-1559 Gas 费市场', desc: '设定当前基础费和区块拥堵程度。观察未来 20 个区块的基础费走势，以及你的交易能否被打包、实际付多少。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 区块使用率 100%：每块基础费 +12.5%。② 使用率 50%：基础费不变。③ 把 maxFee 设成 2 倍基础费，连续满块时，第几个区块后你的交易打不进去？</div>
    <div class="ctrls">${rng(p, 'base', '当前基础费 (gwei)', 1, 200, 1, 20)}${rng(p, 'used', '区块 Gas 使用率', 0, 100, 5, 100)}${rng(p, 'tip', '你的小费 priority (gwei)', 0, 10, 0.5, 2)}${rng(p, 'max', '你的上限 maxFee (gwei)', 1, 400, 1, 42)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>`;
    const ETH = 3000, GAS = 21000;
    bindInputs(el, { base: v => v + ' gwei', used: v => v + '%', tip: v => v + ' gwei', max: v => v + ' gwei' }, v => {
      const ser = [[0, v.base]]; let b = v.base;
      for (let i = 1; i <= 20; i++) { b = b * (1 + 0.125 * (v.used - 50) / 50); ser.push([i, b]); }
      const next = ser[1][1];
      const firstOut = ser.findIndex(([, bb]) => bb > v.max);
      const inc = v.max >= next;
      const tip = Math.max(0, Math.min(v.tip, v.max - next));
      const paid = next + tip;
      const cost = paid * GAS * 1e-9;
      $('[data-s]', el).innerHTML = stat('下一块基础费', fmtN(next, 2) + ' gwei') + stat('你的交易', inc ? '可以打包' : '等待（maxFee < 基础费）', inc ? 'ok' : 'risk') +
        stat('实际单价 = 基础费 + 小费', inc ? fmtN(paid, 2) + ' gwei' : '—') + stat('一笔转账费用（21,000 gas）', inc ? '$' + fmtN(cost * ETH, 3) : '—') +
        stat('其中被销毁', inc ? fmtN(next * GAS * 1e-9, 6) + ' ETH' : '—') + stat('退回（maxFee − 实付）', inc ? fmtN(v.max - paid, 2) + ' gwei/gas' : '—');
      const ymax = Math.max(v.max, ...ser.map(s => s[1])) * 1.1;
      $('[data-c]', el).innerHTML = lineChart({ label: '基础费走势', xr: [0, 20], yr: [0, ymax], series: [{ pts: ser, area: true }], hlines: [{ y: v.max, cls: 's3', label: '你的 maxFee' }], xticks: [0, 5, 10, 15, 20], fx: t => '+' + t + ' 块', yticks: [0, ymax / 2, ymax].map(t => Math.round(t)), fy: t => t + ' gwei' });
      const vd = $('[data-vd]', el);
      if (!inc) { vd.className = 'verdict risk'; vd.textContent = '你的 maxFee 低于下一块基础费。交易会停在内存池，直到基础费下降。可以用相同 nonce、更高费用的交易替换它。'; }
      else if (firstOut > 0) { vd.className = 'verdict warn'; vd.textContent = `按当前拥堵持续下去，第 ${firstOut} 个区块后基础费超过你的 maxFee。如果这之前没被打包，交易会卡住。`; }
      else { vd.className = 'verdict ok'; vd.textContent = '在 20 个区块内，你的 maxFee 始终高于基础费。交易会被及时打包，多付部分自动退回。'; }
    });
  }
});

addLab('orderbook', {
  ch: 'm04', title: '订单簿撮合引擎', desc: 'BTC/USDT 订单簿。提交限价单或市价单，引擎按“价格优先、时间优先”撮合。成交价取挂单方（Maker）价格。',
  mount(el, p) {
    let seq = 0;
    const mk = (side, price, qty, who) => ({ id: ++seq, side, price, qty, who });
    let asks = [[60100, 0.8], [60150, 1.2], [60200, 2.0], [60300, 1.5], [60500, 3.0]].map(([pr, q]) => mk('sell', pr, q, '做市商'));
    let bids = [[60000, 1.0], [59950, 0.6], [59900, 2.2], [59800, 1.8], [59600, 3.0]].map(([pr, q]) => mk('buy', pr, q, '做市商'));
    const trades = [];
    el.innerHTML = `<div class="try"><b>试一试：</b>① 提交“市价买 3 BTC”：它会吃掉多档卖单，看平均价。② 提交“限价卖 0.5 @ 59,950”：它会和买单成交。③ 提交“限价买 1 @ 60,050”：不成交，成为新的买一（挂单）。</div>
    <div class="row-btns" style="gap:10px">
      ${segHtml('side', [['buy', '买入'], ['sell', '卖出']], 'buy')}
      ${segHtml('type', [['limit', '限价'], ['market', '市价']], 'market')}
      <label class="small" for="${p}-px">价格 <input type="number" id="${p}-px" step="50" value="60050" style="width:100px"></label>
      <label class="small" for="${p}-qty">数量 <input type="number" id="${p}-qty" step="0.1" min="0.1" value="3" style="width:80px"></label>
      <button class="btn primary" data-go>提交订单</button><button class="btn" data-rand>随机订单</button>
    </div>
    <div class="two"><div data-book></div><div><div class="small muted" style="margin-bottom:4px">成交记录（最新在上）</div><div class="log" data-log></div></div></div>
    <div class="verdict info" data-vd>等待订单。</div>`;
    let side = 'buy', type = 'market';
    seg(el, 'side', v => side = v); seg(el, 'type', v => { type = v; $(`#${p}-px`).disabled = v === 'market'; });
    $(`#${p}-px`).disabled = true;
    const draw = () => {
      asks.sort((a, b) => a.price - b.price || a.id - b.id); bids.sort((a, b) => b.price - a.price || a.id - b.id);
      const agg = list => { const m = []; list.forEach(o => { const l = m[m.length - 1]; if (l && l.price === o.price) { l.qty += o.qty; l.n++; } else m.push({ price: o.price, qty: o.qty, n: 1 }); }); return m.slice(0, 6); };
      const A = agg(asks).reverse(), Bd = agg(bids);
      const max = Math.max(1, ...A.map(x => x.qty), ...Bd.map(x => x.qty));
      const row = (x, c) => `<div style="display:grid;grid-template-columns:1fr 1fr 40px;gap:8px;position:relative;padding:2px 8px;font-family:var(--f-mono);font-size:13px"><span style="position:absolute;inset:0 0 0 auto;width:${x.qty / max * 100}%;background:var(--${c}-soft)"></span><span style="position:relative;color:var(--${c})">${x.price.toLocaleString()}</span><span style="position:relative;text-align:right">${x.qty.toFixed(2)}</span><span style="position:relative;text-align:right;color:var(--ink-2)">×${x.n}</span></div>`;
      const spread = asks.length && bids.length ? asks[0].price - bids[0].price : NaN;
      $('[data-book]', el).innerHTML = `<div class="small muted" style="display:grid;grid-template-columns:1fr 1fr 40px;gap:8px;padding:0 8px"><span>价格 USDT</span><span style="text-align:right">数量 BTC</span><span style="text-align:right">单数</span></div>${A.map(x => row(x, 'risk')).join('')}<div style="padding:4px 8px;font-size:12px;border-block:1px dashed var(--rule);margin:2px 0" class="mono muted">价差 ${isFinite(spread) ? spread.toLocaleString() : '—'} · 中间价 ${isFinite(spread) ? ((asks[0].price + bids[0].price) / 2).toLocaleString() : '—'}</div>${Bd.map(x => row(x, 'ok')).join('')}`;
      $('[data-log]', el).innerHTML = trades.length ? trades.slice(0, 30).map(t => `<div class="${t.side === 'buy' ? 'ok' : 'risk'}">${t.side === 'buy' ? '买' : '卖'} ${t.qty.toFixed(2)} @ ${t.price.toLocaleString()}  <span class="muted">Taker #${t.taker} ↔ Maker #${t.maker}</span></div>`).join('') : '<div class="muted">暂无成交</div>';
    };
    const submit = (sd, tp, price, qty, who = '你') => {
      if (!(qty > 0)) return;
      const o = mk(sd, price, qty, who);
      const book = sd === 'buy' ? asks : bids;
      const cross = m => tp === 'market' || (sd === 'buy' ? m.price <= price : m.price >= price);
      let filled = 0, notional = 0, levels = new Set();
      while (o.qty > 1e-9 && book.length && cross(book[0])) {
        const m = book[0], q = Math.min(o.qty, m.qty);
        o.qty -= q; m.qty -= q; filled += q; notional += q * m.price; levels.add(m.price);
        trades.unshift({ side: sd, qty: q, price: m.price, taker: o.id, maker: m.id });
        if (m.qty <= 1e-9) book.shift();
      }
      let msg = `订单 #${o.id}（${who}）${sd === 'buy' ? '买' : '卖'} ${qty} BTC ${tp === 'market' ? '市价' : '限价 ' + price.toLocaleString()}：`;
      msg += filled > 0 ? `成交 ${filled.toFixed(2)} BTC，跨越 ${levels.size} 档，均价 ${fmtN(notional / filled, 1)}。` : '没有可成交的对手单。';
      if (o.qty > 1e-9) {
        if (tp === 'limit') { (sd === 'buy' ? bids : asks).push(o); msg += ` 剩余 ${o.qty.toFixed(2)} BTC 进入订单簿成为挂单（Maker）。`; }
        else msg += ` 剩余 ${o.qty.toFixed(2)} BTC 因深度不足被取消。`;
      }
      $('[data-vd]', el).textContent = msg;
      draw();
    };
    $('[data-go]', el).addEventListener('click', () => submit(side, type, +$(`#${p}-px`).value, +$(`#${p}-qty`).value));
    $('[data-rand]', el).addEventListener('click', () => {
      const sd = Math.random() < .5 ? 'buy' : 'sell';
      const mid = asks.length && bids.length ? (asks[0].price + bids[0].price) / 2 : 60000;
      const px = Math.round((mid + (Math.random() - .5) * 400) / 50) * 50;
      submit(sd, 'limit', px, Math.round((0.1 + Math.random() * 1.5) * 10) / 10, '随机用户');
    });
    draw();
  }
});

addLab('finality', {
  ch: 'm05', title: 'PoS 最终性与不活跃泄漏', desc: '100 个验证者，质押相等。调整离线和作恶比例，然后逐个 epoch 运行。观察何时能最终确定，以及不活跃泄漏如何让链自我恢复。泄漏速度为教学示例，真实协议更慢。',
  mount(el, p) {
    let stake = [], epoch = 0, fin = 0, timer = null;
    el.innerHTML = `<div class="try"><b>试一试：</b>① 离线 20%：每个 epoch 都能最终确定。② 离线 45%：无法最终确定。点“自动运行”，看离线验证者的质押被逐步扣减，直到在线质押重新超过 2/3。③ 作恶 34%：作恶者拒绝投票，可以阻止最终性。</div>
    <div class="ctrls">${rng(p, 'off', '离线验证者比例', 0, 60, 1, 45)}${rng(p, 'bad', '作恶（拒绝投票）比例', 0, 40, 1, 0)}</div>
    <div class="row-btns"><button class="btn primary" data-step>运行 1 个 epoch</button><button class="btn" data-auto>▶ 自动运行</button><button class="btn" data-reset>重置</button></div>
    <div data-grid style="display:grid;grid-template-columns:repeat(20,1fr);gap:3px;max-width:520px"></div>
    <div class="small muted"><span style="color:var(--ok)">■</span> 在线投票　<span style="color:var(--ink-2)">■</span> 离线　<span style="color:var(--risk)">■</span> 作恶　（方块越淡 = 剩余质押越少）</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>`;
    let hist = [];
    const role = i => { const { off, bad } = V.read(); return i < bad ? 'bad' : i < bad + off ? 'off' : 'on'; };
    const reset = () => { stake = Array(100).fill(32); epoch = 0; fin = 0; hist = []; clearInterval(timer); timer = null; $('[data-auto]', el).textContent = '▶ 自动运行'; draw(); };
    const share = () => { const tot = stake.reduce((a, b) => a + b, 0); const on = stake.reduce((a, s, i) => a + (role(i) === 'on' ? s : 0), 0); return { tot, on, r: on / tot }; };
    const draw = (last) => {
      const s = share();
      $('[data-grid]', el).innerHTML = stake.map((st, i) => { const r = role(i); const c = r === 'on' ? 'var(--ok)' : r === 'off' ? 'var(--ink-2)' : 'var(--risk)'; return `<span title="验证者 ${i + 1}: ${st.toFixed(1)} ETH" style="aspect-ratio:1;border-radius:2px;background:${c};opacity:${Math.max(.15, st / 32)}"></span>`; }).join('');
      $('[data-s]', el).innerHTML = stat('epoch', epoch) + stat('在线投票质押占比', fmtP(s.r, 1), s.r >= 2 / 3 ? 'ok' : 'risk') + stat('已最终确定的 epoch', fin) + stat('离线者平均剩余质押', (() => { const o = stake.filter((_, i) => role(i) === 'off'); return o.length ? fmtN(o.reduce((a, b) => a + b, 0) / o.length, 2) + ' ETH' : '—'; })());
      $('[data-c]', el).innerHTML = hist.length > 1 ? lineChart({ label: '在线质押占比', h: 180, xr: [0, Math.max(10, hist.length - 1)], yr: [0, 1], series: [{ pts: hist.map((r, i) => [i, r]) }], hlines: [{ y: 2 / 3, label: '2/3 最终性门槛' }], yticks: [0, .5, 1], fy: t => (t * 100) + '%', xticks: [0, Math.max(10, hist.length - 1)] }) : '';
      const vd = $('[data-vd]', el), { bad } = V.read();
      if (s.r >= 2 / 3) { vd.className = 'verdict ok'; vd.textContent = last === 'recovered' ? `在 epoch ${epoch} 恢复最终确定。离线验证者为此付出了质押。` : '在线投票质押 ≥ 2/3：检查点可以被证明并最终确定。'; }
      else if (bad >= 34 && share().on / share().tot < 2 / 3 && V.read().off === 0) { vd.className = 'verdict risk'; vd.textContent = '作恶者 ≥ 1/3，拒绝投票即可阻止最终性。泄漏也会扣他们的质押，但这是一场消耗战。'; }
      else { vd.className = 'verdict warn'; vd.textContent = '在线投票质押 < 2/3：链继续出块，但无法最终确定。不活跃泄漏开始扣减不投票者的质押。'; }
    };
    const step = () => {
      const before = share().r >= 2 / 3;
      epoch++;
      if (share().r >= 2 / 3) fin++;
      else stake = stake.map((s, i) => role(i) === 'on' ? s : s * 0.94);
      hist.push(share().r);
      const after = share().r >= 2 / 3;
      draw(!before && after ? 'recovered' : '');
      if (after && timer && !before) { clearInterval(timer); timer = null; $('[data-auto]', el).textContent = '▶ 自动运行'; }
    };
    const V = bindInputs(el, { off: v => v + '%', bad: v => v + '%' }, () => { if (stake.length) reset(); });
    $('[data-step]', el).addEventListener('click', step);
    $('[data-auto]', el).addEventListener('click', e => {
      if (timer) { clearInterval(timer); timer = null; e.target.textContent = '▶ 自动运行'; return; }
      e.target.textContent = '⏸ 暂停';
      timer = setInterval(() => { if (!el.isConnected || epoch > 200) { clearInterval(timer); timer = null; return; } step(); }, 220);
    });
    $('[data-reset]', el).addEventListener('click', reset);
    reset();
  }
});

addLab('rollup', {
  ch: 'm05', title: 'Rollup 成本分摊', desc: '比较 L1 直接转账和 L2 转账的成本。L2 把一批交易的数据发布到 L1，固定开销被批内交易分摊。数据可以放在 calldata 或 EIP-4844 blob 里。',
  mount(el, p) {
    let mode = 'blob';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 每批 10 笔 vs 1,000 笔，看单笔成本。② 切换 calldata / blob，对比数据成本。③ 把 L1 Gas 调到 100 gwei（拥堵），看 L1 和 L2 的差距如何放大。</div>
    <div class="row-btns">${segHtml('mode', [['blob', 'Blob（EIP-4844）'], ['calldata', 'Calldata']], 'blob')}</div>
    <div class="ctrls">${rng(p, 'gas', 'L1 执行 Gas 价格 (gwei)', 1, 100, 1, 20)}${rng(p, 'blob', 'Blob Gas 价格 (gwei)', 0.001, 5, 0.001, 0.05)}${rng(p, 'n', '每批交易数', 1, 3000, 1, 500)}${rng(p, 'bytes', '每笔压缩后字节数', 10, 200, 1, 40)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict info" data-vd></div>`;
    const ETH = 3000, OVER = 200000, L1TX = 21000, BLOB = 131072;
    let V;
    const cost = (v, n) => {
      const bytes = n * v.bytes;
      const exec = OVER * v.gas * 1e-9;
      const data = mode === 'calldata' ? bytes * 16 * v.gas * 1e-9 : Math.ceil(bytes / BLOB) * BLOB * v.blob * 1e-9;
      return { per: (exec + data) / n * ETH, exec: exec / n * ETH, data: data / n * ETH, blobs: Math.ceil(bytes / BLOB) };
    };
    const upd = v => {
      const c = cost(v, v.n), l1 = L1TX * v.gas * 1e-9 * ETH;
      $('[data-s]', el).innerHTML = stat('L1 直接转账', '$' + fmtN(l1, 3)) + stat('L2 单笔成本', '$' + fmtN(c.per, 5), 'ok') + stat('便宜倍数', fmtN(l1 / c.per, 0) + ' 倍') +
        stat('其中固定开销分摊', '$' + fmtN(c.exec, 5)) + stat('其中数据成本', '$' + fmtN(c.data, 5)) + stat(mode === 'blob' ? '本批使用 blob 数' : '本批数据字节', mode === 'blob' ? c.blobs + ' 个' : (v.n * v.bytes).toLocaleString());
      const pts = []; for (let i = 0; i <= 60; i++) { const n = Math.round(Math.exp(Math.log(3000) * i / 60)); pts.push([Math.max(1, n), Math.log10(cost(v, Math.max(1, n)).per)]); }
      const lo = Math.floor(Math.min(...pts.map(q => q[1]), Math.log10(l1))) , hi = Math.ceil(Math.max(...pts.map(q => q[1]), Math.log10(l1)));
      $('[data-c]', el).innerHTML = lineChart({ label: '单笔成本 vs 每批交易数', logx: true, xr: [1, 3000], yr: [lo, hi], series: [{ pts }], hlines: [{ y: Math.log10(l1), label: 'L1 直接转账' }], markers: [{ x: v.n, y: Math.log10(c.per), label: '$' + fmtN(c.per, 4) }], xticks: [1, 10, 100, 1000, 3000], yticks: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), fy: t => '$' + (Math.pow(10, t) >= 1 ? Math.pow(10, t) : Math.pow(10, t).toPrecision(1)) });
      $('[data-vd]', el).textContent = mode === 'blob' ? 'Blob 按整块（128 KB）计费。批次太小时，blob 大部分空着，浪费钱；所以排序器会等交易攒够再提交。这就是 L2 “延迟上链”的经济原因。' : 'Calldata 每字节 16 gas，按 L1 执行 Gas 价格计费。L1 拥堵时 L2 数据成本同步上涨。2024 年 EIP-4844 之后，主流 L2 改用 blob。';
    };
    seg(el, 'mode', m => { mode = m; V.upd(); });
    V = bindInputs(el, { gas: v => v + ' gwei', blob: v => v.toFixed(3) + ' gwei', n: v => v.toLocaleString() + ' 笔', bytes: v => v + ' B' }, upd);
  }
});
