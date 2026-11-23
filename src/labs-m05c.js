/* ---------- M04 实验：trace（链上取证 · 资金追踪练习） ---------- */
(() => {
addLab('trace', {
  ch: 'm05-67', title: '资金追踪练习：一次被盗资金的多跳路径', desc: '一个预先填好的小型交易图：受害热钱包 → 攻击者 → 拆分 → DEX 兑换 → 跨链桥 → 交易所充值地址，另有一笔混币和一笔干扰入账。逐跳读证据、选启发式，看每一跳的置信度和此刻仍能冻结的资金。数据均为虚构示例，ETH 按 3,000 美元计。',
  mount(el, p) {
    const ETH = 3000;
    const NODE = {
      V: '受害热钱包', A0: '攻击者 A0', A1: 'A1', A2: 'A2', A3: 'A3', DUST: '0xdead… 陌生地址',
      POOL: 'DEX 池 USDT/WETH', MIX: '混币池 100 ETH 档', OUT: '4 个新地址', BR: '跨链桥', B1: 'B1（Arbitrum）',
      D1: '交易所 X 充值地址', HOT: '交易所 X 热钱包'
    };
    const HEU = [['direct', '直接转账'], ['dex', 'DEX 兑换解码'], ['bridge', '跨链消息匹配'], ['amt', '金额 + 时间匹配'], ['deposit', '充值地址归集'], ['ignore', '忽略：无关入账']];
    const HL = Object.fromEntries(HEU);
    // 每一跳：证据、正确启发式、各启发式给出的置信度（未列出的按 0.2 计）
    const HOPS = {
      h1: { t: 0, title: 'H1 · 受害热钱包 → A0', amt: '600 ETH + 3,200,000 USDT', ok: 'direct', conf: { direct: 1, amt: 0.7 },
        ev: ['攻击交易 0x7a1… 调用了受害方的提币合约。', '内部转账：600 ETH，V → A0。', 'USDT Transfer：3,200,000，V → A0。'],
        why: '资金在同一笔交易里直接从 V 转到 A0，事件明确，置信度 100%。' },
      h2: { t: 0.2, title: 'H2 · A0 拆分到 A1 / A2 / A3', amt: '1.2M USDT · 2.0M USDT · 599.9 ETH', ok: 'direct', conf: { direct: 1, amt: 0.7 },
        ev: ['同一区块内 A0 签名了 3 笔交易（nonce 0、1、2）。', 'USDT 1,200,000 → A1；USDT 2,000,000 → A2。', 'ETH 599.9 → A3（A0 留 0.1 ETH 付 Gas）。'],
        why: '三笔都是 A0 签名的直接转账，A1、A2、A3 可以并入攻击者簇。' },
      h3: { t: 0.3, title: 'H3 · 0xdead… → A0（干扰）', amt: '0.0001 ETH', ok: 'ignore', conf: { ignore: 1 },
        ev: ['A0 收到 0.0001 ETH，来自 0xdead…。', '0xdead… 当天给 3,000 个地址各发了 0.0001 ETH。', '它和 A0 此前没有任何往来，A0 也没有回转给它。'],
        why: '这是群发的灰尘或地址投毒，<b>转入</b>不代表同一控制者。把它并入簇会产生误报。' },
      h4: { t: 0.5, title: 'H4 · A1 在 DEX 把 USDT 换成 ETH', amt: '1,200,000 USDT → 399.2 ETH', ok: 'dex', conf: { dex: 0.98, amt: 0.7, direct: 0.5 },
        ev: ['一笔交易里：USDT Transfer A1 → 池子 1,200,000。', 'Swap 事件：recipient = A1，换出 399.2 WETH。', 'WETH Withdrawal 后 399.2 ETH 回到 A1。'],
        why: '输入和输出在同一笔交易里，Swap 事件写明接收者，几乎确定。兑换后 A1 持有的是 ETH，发行方无法再冻结。' },
      h5: { t: 3, title: 'H5 · A1 存入混币池', amt: '4 × 100 ETH', ok: 'amt', conf: { amt: 0.25 },
        ev: ['A1 分 4 次存入 100 ETH 档混币池。', '同一时段这个池子共有 180 笔 100 ETH 存款。', '6 小时后 4 个新地址各取出 100 ETH，Gas 来自不同来源。'],
        why: '存取之间没有链上联系，只能按时间和面额做概率推断，置信度很低，不能单独作为冻结依据。' },
      h6: { t: 2, title: 'H6 · A3 → 跨链桥 → B1', amt: '599.9 ETH → 599.6 ETH', ok: 'bridge', conf: { bridge: 0.97, amt: 0.75, direct: 0.3 },
        ev: ['以太坊：A3 调用桥合约 depositETH，事件 depositId = 88213。', '4 分钟后 Arbitrum：桥释放 599.6 ETH 给 B1，事件 depositId = 88213。', '差额 0.3 ETH 是桥手续费。'],
        why: '两条链上的事件带同一个 depositId，可以高置信度对上。只凭金额和时间匹配会低很多。' },
      h7: { t: 6, title: 'H7 · B1 → D1 → 交易所热钱包', amt: '599.5 ETH', ok: 'deposit', conf: { deposit: 0.95, direct: 0.8, amt: 0.6 },
        ev: ['B1 把 599.5 ETH 转给 D1。', '20 分钟后 D1 把余额全部转给 HOT（交易所 X 已标注的热钱包）。', 'D1 过去 30 天还有 12 笔转入，都被归集到 HOT。'],
        why: '“收款后整笔归集到交易所热钱包”是充值地址的特征。交易所知道 D1 属于哪个账户，可以冻结。' }
    };
    const PATHS = [
      { k: 'usdt2', name: 'USDT 线 ②（A2 按兵不动）', seq: ['V', 'h1', 'A0', 'h2', 'A2'] },
      { k: 'usdt1', name: 'USDT 线 ①（换币后混币）', seq: ['V', 'h1', 'A0', 'h2', 'A1', 'h4', 'POOL', 'h5', 'MIX'] },
      { k: 'eth', name: 'ETH 线（跨链后进交易所）', seq: ['V', 'h1', 'A0', 'h2', 'A3', 'h6', 'B1', 'h7', 'HOT'] },
      { k: 'dust', name: '干扰入账', seq: ['DUST', 'h3', 'A0'] }
    ];
    // 冻结点：在 [from, to) 小时内可冻结
    const FREEZE = [
      { name: 'A1 的 1,200,000 USDT', who: 'USDT 发行方黑名单', usd: 1200000, from: 0.2, to: 0.5, after: 'A1 已在 DEX 把 USDT 换成 ETH' },
      { name: 'A2 的 2,000,000 USDT', who: 'USDT 发行方黑名单', usd: 2000000, from: 0.2, to: 9, after: '第 9 小时 A2 把 USDT 换成了 ETH' },
      { name: 'D1 的 599.5 ETH', who: '交易所 X 冻结账户', usd: 599.5 * ETH, from: 6, to: 10, after: '第 10 小时攻击者已从交易所提走' },
      { name: '混币池里的 400 ETH', who: '无人能冻结', usd: 0, from: 99, to: 99, after: '混币池没有冻结开关' }
    ];
    const pick = { h1: 'direct', h2: 'direct', h3: null, h4: null, h5: null, h6: null, h7: null };
    let cur = 'h4';

    el.innerHTML = `<div class="try"><b>试一试：</b>① 点“H4”读证据，选“DEX 兑换解码”，看置信度。② 依次处理 H3、H5、H6、H7；故意给 H6 选“金额 + 时间匹配”，看 ETH 线的整体置信度下降多少。③ 拖动“响应时间”从 0.3 到 1、6、12 小时，看哪些冻结点从“可冻结”变成“已错过”。</div>
    <div class="ctrls">${rng(p, 'hr', '响应时间：发现攻击后过了多少小时才通知各方', 0, 24, 0.1, 0.4)}</div>
    <div data-paths></div>
    <div data-hop></div>
    <div class="stats" data-s></div>
    <div class="log" data-fz></div>
    <div class="verdict" data-vd></div>`;

    const confOf = h => { const c = pick[h]; if (!c) return null; const v = HOPS[h].conf[c]; return v == null ? 0.2 : v; };
    const pathConf = (seq, upto) => { let x = 1, done = true; for (const s of seq) { if (HOPS[s]) { const c = confOf(s); if (c == null) { done = false; } else x *= c; } if (s === upto) break; } return { x, done }; };
    const col = c => c == null ? 'var(--ink-2)' : c >= 0.9 ? 'var(--ok)' : c >= 0.6 ? 'var(--warn)' : 'var(--risk)';
    const chip = t => `<span style="display:inline-block;padding:2px 8px;border:1px solid var(--rule);border-radius:12px;background:var(--ground);font-size:12.5px">${esc(t)}</span>`;
    const hopBtn = h => { const c = confOf(h); const on = h === cur;
      return `<button type="button" data-hop-k="${h}" style="padding:2px 8px;border-radius:12px;font-size:12.5px;cursor:pointer;border:2px solid ${on ? 'var(--accent)' : 'var(--rule)'};background:var(--tint);color:${col(c)}">→ ${h.toUpperCase()} · ${c == null ? '未判断' : Math.round(c * 100) + '%'} →</button>`; };

    function renderPaths() {
      $('[data-paths]', el).innerHTML = PATHS.map(P => {
        const pc = pathConf(P.seq);
        const tail = P.k === 'dust' ? (pick.h3 && pick.h3 !== 'ignore' ? '<span style="color:var(--risk)">已误并入攻击者簇</span>' : pick.h3 ? '<span style="color:var(--ok)">已排除</span>' : '未判断')
          : `整体置信度 <b style="color:${col(pc.done ? pc.x : null)}">${pc.done ? Math.round(pc.x * 100) + '%' : '未完成'}</b>`;
        return `<div style="margin:6px 0;padding:8px;border:1px solid var(--rule);border-radius:8px"><div class="small" style="margin-bottom:4px"><b>${P.name}</b> · ${tail}</div><div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">${P.seq.map(s => HOPS[s] ? hopBtn(s) : chip(NODE[s])).join('')}</div></div>`;
      }).join('');
      $$('[data-hop-k]', el).forEach(b => b.addEventListener('click', () => { cur = b.dataset.hopK; render(); }));
    }

    function renderHop() {
      const H0 = HOPS[cur];
      const box = $('[data-hop]', el);
      box.innerHTML = `<div style="padding:8px 10px;border-left:4px solid var(--accent);background:var(--tint);border-radius:6px;margin:6px 0">
        <div><b>${H0.title}</b> <span class="muted small">第 ${H0.t} 小时 · ${H0.amt}</span></div>
        <div class="log" style="margin:6px 0">${H0.ev.map(x => `<div>· ${x}</div>`).join('')}</div>
        <div class="small" style="margin:4px 0">你用哪条启发式把这一跳连起来？</div>
        <div class="row-btns">${segHtml('heu', HEU, pick[cur] || '')}</div>
        <div class="small" style="margin-top:6px" data-why></div></div>`;
      seg(box, 'heu', v => { pick[cur] = v; render(); });
      const c = pick[cur];
      $('[data-why]', box).innerHTML = !c ? '<span class="muted">还没有判断这一跳。</span>'
        : c === H0.ok ? `<span style="color:var(--ok)">✓ ${HL[c]}：</span>${H0.why}`
        : `<span style="color:var(--risk)">✗ “${HL[c]}”不是最合适的证据（本跳置信度只有 ${Math.round(confOf(cur) * 100)}%）。</span>参考：${HL[H0.ok]}。`;
    }

    function render() {
      const T = ui.read().hr;
      renderPaths(); renderHop();
      const eth = pathConf(PATHS[2].seq), u1 = pathConf(PATHS[1].seq);
      const fz = FREEZE.map(f => ({ ...f, st: f.usd === 0 ? 'none' : T < f.from ? 'early' : T < f.to ? 'open' : 'missed' }));
      const open = fz.filter(f => f.st === 'open').reduce((a, f) => a + f.usd, 0);
      const missed = fz.filter(f => f.st === 'missed').reduce((a, f) => a + f.usd, 0);
      const fp = pick.h3 && pick.h3 !== 'ignore';
      $('[data-s]', el).innerHTML =
        stat('本跳置信度', confOf(cur) == null ? '—' : fmtP(confOf(cur), 0), confOf(cur) == null ? '' : confOf(cur) >= 0.9 ? 'ok' : confOf(cur) >= 0.6 ? 'warn' : 'risk') +
        stat('ETH 线到交易所的置信度', eth.done ? fmtP(eth.x, 0) : '未完成', eth.done ? (eth.x >= 0.8 ? 'ok' : 'warn') : '') +
        stat('USDT 线 ① 到混币后的置信度', u1.done ? fmtP(u1.x, 0) : '未完成', u1.done ? 'risk' : '') +
        stat('第 ' + fmtN(T, 1) + ' 小时仍可冻结', '$' + fmtN(open, 0), open > 0 ? 'ok' : 'risk') +
        stat('已错过的冻结机会', '$' + fmtN(missed, 0), missed > 0 ? 'risk' : '') +
        stat('误报（误并入簇）', fp ? '1 个地址' : '0', fp ? 'risk' : 'ok');
      $('[data-fz]', el).innerHTML = fz.map(f => {
        const s = f.st === 'open' ? `<span class="ok">可冻结</span>（窗口 ${f.from}–${f.to} 小时）`
          : f.st === 'early' ? `<span class="info">资金还没到</span>（第 ${f.from} 小时才到，可先把上游地址加入监控名单）`
          : f.st === 'missed' ? `<span class="risk">已错过</span>：${f.after}`
          : `<span class="risk">不可冻结</span>：${f.after}`;
        return `<div>${f.name} · ${f.who} · ${s}</div>`;
      }).join('');
      const V = $('[data-vd]', el);
      const ethLow = eth.done && eth.x < 0.8;
      let msg, cls;
      if (fp) { msg = '你把一个群发灰尘的陌生地址并入了攻击者簇。真实报告里这会让无辜地址被拉黑，先回到 H3 排除它。'; cls = 'risk'; }
      else if (ethLow) { msg = `ETH 线整体置信度只有 ${fmtP(eth.x, 0)}，交易所可能要求补充证据才冻结。回到最弱的一跳，换用更强的证据（例如桥的 depositId）。`; cls = 'warn'; }
      else if (open > 0) { msg = `现在通知各方，还能冻结约 $${fmtN(open, 0)}。先把攻击者簇地址同步给发行方和交易所，再继续深入分析。`; cls = 'ok'; }
      else if (T < 6) { msg = '稳定币已换掉，ETH 还在路上：把 B1 等地址提前发给主要交易所，等资金到达时立即冻结。'; cls = 'warn'; }
      else { msg = `第 ${fmtN(T, 1)} 小时，所有冻结窗口都已关闭，错过约 $${fmtN(missed, 0)}。链上仍能追踪，但只能等资金再次流入可配合的机构。`; cls = 'risk'; }
      V.className = 'verdict ' + cls; V.innerHTML = msg;
    }

    let ui = null;
    ui = bindInputs(el, { hr: v => fmtN(v, 1) + ' 小时' }, () => { if (ui) render(); });
    render();
  }
});
})();
