/* ---------- M04 实验（比特币）：utxo 选币与手续费 · lnchan 闪电通道与多跳路由 ---------- */
(() => {
/* 交易体积参数（vbyte），来自 Bitcoin Optech 交易体积计算器的常用近似值 */
const VB = {
  p2wpkh: { name: 'P2WPKH（bc1q）', inp: 68, out: 31, ovh: 10.5, dust: 294 },
  p2tr: { name: 'P2TR（bc1p）', inp: 57.5, out: 43, ovh: 10.5, dust: 330 },
  p2pkh: { name: 'P2PKH（1 开头）', inp: 148, out: 34, ovh: 10, dust: 546 }
};
const PAY_OUT = 31; // 收款人输出：固定按 P2WPKH 计
const WALLET = [1200000, 850000, 420000, 300000, 152000, 95000, 30000, 4000]; // 预填钱包（sat）

addLab('utxo', {
  ch: 'm05-60', title: 'UTXO 选币与手续费', desc: '一个装着 8 个 UTXO 的钱包。设定付款金额、费率和地址类型，比较“最大优先 / 最小优先 / 精确匹配（类 BnB）”三种选币策略：用了哪些输入、交易多大、手续费多少、找零是否变成粉尘。',
  mount(el, p) {
    let typ = 'p2wpkh', strat = 'bnb';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认值（付 1,000,000 sat、20 sat/vB）下切换三种策略：精确匹配找到 3 个输入、不需要找零的组合；比较三者的输入个数、手续费和找零。② 把付款金额调到 500,000，精确匹配找不到组合，回退到最大优先。③ 把费率拉到 150 sat/vB，看 4,000 sat 那个小 UTXO 变成“不经济”（花它的手续费比它本身还贵）。④ 切换到 P2PKH，看同样的交易手续费变多少。</div>
    <div class="row-btns">${segHtml('typ', [['p2wpkh', 'P2WPKH'], ['p2tr', 'P2TR'], ['p2pkh', 'P2PKH（旧）']], 'p2wpkh')}</div>
    <div class="row-btns">${segHtml('strat', [['largest', '最大优先'], ['smallest', '最小优先'], ['bnb', '精确匹配（类 BnB）']], 'bnb')}</div>
    <div class="ctrls">${rng(p, 'amt', '付款金额（sat）', 10000, 3000000, 5000, 1000000)}${rng(p, 'fr', '费率（sat/vB）', 1, 200, 1, 20)}</div>
    <div class="stats" data-s></div><div class="log" data-log></div><div data-t></div><div class="verdict" data-vd></div>`;

    // 交易体积：开销 + 输入 + 输出
    const vsize = (t, nIn, withChange) => Math.ceil(t.ovh + nIn * t.inp + PAY_OUT + (withChange ? t.out : 0));
    // 给定一组输入，算出手续费、找零；找零低于粉尘阈值时并入手续费
    function settle(t, ins, amt, fr) {
      const sum = ins.reduce((a, i) => a + WALLET[i], 0);
      const feeC = Math.ceil(vsize(t, ins.length, true) * fr);
      const feeN = Math.ceil(vsize(t, ins.length, false) * fr);
      if (sum - amt - feeC >= t.dust) return { ok: true, ins, sum, fee: feeC, change: sum - amt - feeC, vs: vsize(t, ins.length, true), dustDrop: 0 };
      if (sum - amt - feeN >= 0) return { ok: true, ins, sum, fee: sum - amt, change: 0, vs: vsize(t, ins.length, false), dustDrop: sum - amt - feeN };
      return { ok: false, ins, sum };
    }
    function greedy(t, order, amt, fr) {
      const ins = [];
      for (const i of order) { ins.push(i); const r = settle(t, ins, amt, fr); if (r.ok) return r; }
      return { ok: false, ins, sum: ins.reduce((a, i) => a + WALLET[i], 0) };
    }
    // 类 BnB：枚举全部子集（8 个 UTXO = 256 种），找“不需要找零、浪费最少”的组合
    function bnb(t, amt, fr, useful) {
      const costOfChange = Math.ceil(t.out * fr + t.inp * fr); // 现在多一个找零输出 + 将来花掉它
      let best = null;
      for (let m = 1; m < 1 << WALLET.length; m++) {
        const ins = []; for (let i = 0; i < WALLET.length; i++) if (m & (1 << i)) ins.push(i);
        if (ins.some(i => !useful.includes(i))) continue;
        const sum = ins.reduce((a, i) => a + WALLET[i], 0);
        const feeN = Math.ceil(vsize(t, ins.length, false) * fr);
        const excess = sum - amt - feeN;
        if (excess < 0 || excess > costOfChange) continue;
        if (!best || excess < best.excess) best = { ins, excess };
      }
      if (!best) return null;
      const r = settle(t, best.ins, amt, fr);
      return Object.assign(r, { change: 0, fee: r.sum - amt, vs: vsize(t, best.ins.length, false), dustDrop: best.excess, cost: costOfChange });
    }
    function run(name, t, v, useful) {
      const desc = useful.slice().sort((a, b) => WALLET[b] - WALLET[a]);
      const asc = desc.slice().reverse();
      if (name === 'largest') return greedy(t, desc, v.amt, v.fr);
      if (name === 'smallest') return greedy(t, asc, v.amt, v.fr);
      const r = bnb(t, v.amt, v.fr, useful);
      if (r) return Object.assign(r, { exact: true });
      return Object.assign(greedy(t, desc, v.amt, v.fr), { fallback: true });
    }
    const NAMES = { largest: '最大优先', smallest: '最小优先', bnb: '精确匹配' };

    const upd = v => {
      const t = VB[typ];
      const inCost = Math.ceil(t.inp * v.fr);
      const useful = WALLET.map((_, i) => i).filter(i => WALLET[i] > inCost); // 有效价值 > 0
      const uneco = WALLET.map((_, i) => i).filter(i => !useful.includes(i));
      const r = run(strat, t, v, useful);
      const S = $('[data-s]', el), L = $('[data-log]', el), vd = $('[data-vd]', el);
      if (!r.ok) {
        S.innerHTML = stat('钱包可用余额', fmtN(useful.reduce((a, i) => a + WALLET[i], 0), 0) + ' sat') + stat('结果', '余额不足', 'risk');
        L.innerHTML = '<div class="risk">即使用上全部经济的 UTXO，也凑不够“付款 + 手续费”。降低金额或费率。</div>';
        $('[data-t]', el).innerHTML = ''; vd.className = 'verdict risk'; vd.textContent = '余额不足：比特币钱包的“可花余额”要先减去花每个 UTXO 的手续费。';
        return;
      }
      S.innerHTML = stat('输入个数', r.ins.length) + stat('交易体积', fmtN(r.vs, 0) + ' vB') + stat('手续费', fmtN(r.fee, 0) + ' sat', r.fee > v.amt * 0.02 ? 'warn' : '') +
        stat('有效费率', fmtN(r.fee / r.vs, 1) + ' sat/vB') + stat('找零', r.change ? fmtN(r.change, 0) + ' sat' : '无找零输出', r.change ? '' : 'ok') + stat('并入手续费的零头', fmtN(r.dustDrop || 0, 0) + ' sat', r.dustDrop > 0 ? 'warn' : '');
      L.innerHTML = WALLET.map((a, i) => {
        const used = r.ins.includes(i), bad = uneco.includes(i);
        return `<div class="${used ? 'ok' : bad ? 'risk' : ''}">${used ? '✔ 输入' : bad ? '✘ 不经济' : '· 未用'}  UTXO #${i + 1}  ${fmtN(a, 0).padStart(9)} sat  有效价值 ${fmtN(a - inCost, 0)}</div>`;
      }).join('') + `<div>— 输出：收款 ${fmtN(v.amt, 0)} sat${r.change ? '；找零 ' + fmtN(r.change, 0) + ' sat → 自己的找零地址' : '；没有找零输出'}</div>` +
        `<div>— 体积 = ${t.ovh} + ${r.ins.length} × ${t.inp} + ${PAY_OUT}${r.change ? ' + ' + t.out : ''} ≈ ${r.vs} vB；手续费 = 输入合计 ${fmtN(r.sum, 0)} − 输出合计 ${fmtN(v.amt + r.change, 0)} = ${fmtN(r.fee, 0)} sat</div>`;
      const rows = ['largest', 'smallest', 'bnb'].map(n => { const q = run(n, t, v, useful); return q.ok ? [NAMES[n] + (q.fallback ? '（无精确解，回退最大优先）' : ''), q.ins.length, fmtN(q.vs, 0), fmtN(q.fee, 0), q.change ? fmtN(q.change, 0) : '—', fmtN(WALLET.length - uneco.length - q.ins.length, 0)] : [NAMES[n], '—', '—', '余额不足', '—', '—']; });
      $('[data-t]', el).innerHTML = tbl(['策略', '输入数', 'vB', '手续费 sat', '找零 sat', '剩余可用 UTXO 数'], rows);
      const msgs = [];
      if (strat === 'bnb' && r.exact) msgs.push('精确匹配成功：输入合计正好覆盖“付款 + 手续费”，多出的零头小于“新建并将来花掉一个找零输出”的成本（约 ' + fmtN(r.cost, 0) + ' sat），所以直接并入手续费。没有找零，链上隐私更好，也不产生新的小 UTXO。');
      if (strat === 'bnb' && r.fallback) msgs.push('找不到精确组合，回退到最大优先。Bitcoin Core 实际会同时跑多种算法，按“浪费”指标选最优结果。');
      if (strat === 'smallest') msgs.push('最小优先会一次花掉很多小 UTXO：费率低时可以“顺便整理碎片”，费率高时手续费明显更贵。');
      if (strat === 'largest') msgs.push('最大优先输入最少、手续费最低，但会留下越来越多小 UTXO，以后费率高时它们可能变成不经济的“粉尘”。');
      if (r.dustDrop > 0 && !r.exact) msgs.push('找零低于粉尘阈值 ' + t.dust + ' sat，钱包不写找零输出，零头并入手续费。');
      if (uneco.length) msgs.push('当前费率下有 ' + uneco.length + ' 个 UTXO 的价值不够付花它的手续费（' + inCost + ' sat），钱包应跳过它们。');
      vd.className = 'verdict ' + (uneco.length ? 'warn' : 'info'); vd.textContent = msgs.join(' ');
    };
    let B;
    seg(el, 'typ', m => { typ = m; B.upd(); });
    seg(el, 'strat', m => { strat = m; B.upd(); });
    B = bindInputs(el, { amt: v => v.toLocaleString() + ' sat', fr: v => v + ' sat/vB' }, upd);
  }
});

/* ---------- lnchan：双方通道 + 三跳路由 ---------- */
addLab('lnchan', {
  ch: 'm05-62', title: '闪电通道与多跳路由', desc: '上半部分：Alice 与 Bob 的一条通道，双向付款，看余额条和承诺交易编号怎样变化。下半部分：A → B → C → D 三跳路由，按每跳手续费反推每段 HTLC 金额，并看某一跳流动性不足时付款在哪里失败。',
  mount(el, p) {
    const bar = (a, b, cap) => { const pa = cap ? a / cap * 100 : 0; return `<div style="display:flex;height:22px;border:1px solid var(--rule);border-radius:6px;overflow:hidden;font-size:12px;line-height:22px"><div style="width:${pa}%;background:var(--accent-soft);color:var(--ink);padding-left:6px;white-space:nowrap;overflow:hidden">${fmtN(a, 0)}</div><div style="flex:1;background:var(--ok-soft);color:var(--ink);text-align:right;padding-right:6px;white-space:nowrap;overflow:hidden">${fmtN(b, 0)}</div></div>`; };
    el.innerHTML = `<div class="try"><b>试一试：</b>① 点几次“Alice → Bob”，看余额条移动、承诺交易编号增加、作废的旧状态越来越多。② 把付款额调大到超过 Alice 可用余额，付款被拒。③ 下半部分默认能成功：核对每一跳的金额和手续费。④ 把“C → D 方向可用余额”拉到 50,000 以下，付款在 C 失败，错误一路退回给 A。</div>
    <h4>① 一条通道：Alice ⇄ Bob</h4>
    <div class="ctrls">${rng(p, 'cap', '通道容量（sat）', 100000, 5000000, 50000, 1000000)}${rng(p, 'pay', '单笔付款（sat）', 1000, 500000, 1000, 50000)}</div>
    <div class="row-btns"><button type="button" class="btn" data-ab>Alice → Bob 付款</button><button type="button" class="btn" data-ba>Bob → Alice 付款</button><button type="button" class="btn" data-rs>重置通道</button></div>
    <div data-bar style="margin:10px 0"></div><div class="stats" data-s1></div><div class="log" data-l1></div>
    <h4 style="margin-top:18px">② 三跳路由：A → B → C → D</h4>
    <div class="ctrls">${rng(p, 'amt', 'D 要收的金额（sat）', 1000, 300000, 1000, 80000)}${rng(p, 'ab', 'A → B 方向可用余额', 0, 500000, 5000, 400000)}${rng(p, 'bc', 'B → C 方向可用余额', 0, 500000, 5000, 300000)}${rng(p, 'cd', 'C → D 方向可用余额', 0, 500000, 5000, 200000)}</div>
    <div class="stats" data-s2></div><div class="log" data-l2></div><div class="verdict" data-vd></div>`;

    // ---- 第一部分：通道状态 ----
    let st;
    const RES = 0.01; // 通道保证金（channel reserve）示例：容量的 1%
    const reset = cap => { st = { cap, a: Math.round(cap * 0.7), b: cap - Math.round(cap * 0.7), n: 0, log: ['<div>注资交易上链：Alice 出资 ' + fmtN(cap, 0) + ' sat，开通道时把 ' + fmtN(cap - Math.round(cap * 0.7), 0) + ' sat 推给 Bob（示例），承诺交易 #0。</div>'] }; };
    const draw1 = () => {
      const r = Math.ceil(st.cap * RES);
      $('[data-bar]', el).innerHTML = `<div class="small muted" style="display:flex;justify-content:space-between"><span>Alice 本地余额</span><span>Bob 本地余额</span></div>` + bar(st.a, st.b, st.cap);
      $('[data-s1]', el).innerHTML = stat('Alice 可发送', fmtN(Math.max(0, st.a - r), 0) + ' sat') + stat('Bob 可发送', fmtN(Math.max(0, st.b - r), 0) + ' sat') + stat('当前承诺交易', '#' + st.n) + stat('已作废的旧状态', st.n, st.n ? 'warn' : '');
      $('[data-l1]', el).innerHTML = st.log.slice(-8).join('');
    };
    const pay = (fromA, amt) => {
      const r = Math.ceil(st.cap * RES), have = fromA ? st.a : st.b, who = fromA ? 'Alice' : 'Bob', to = fromA ? 'Bob' : 'Alice';
      if (have - amt < r) { st.log.push(`<div class="risk">✘ ${who} → ${to} ${fmtN(amt, 0)} sat 被拒：${who} 余额 ${fmtN(have, 0)}，扣掉保证金 ${fmtN(r, 0)} 后不够。通道里的钱只能在两人之间移动，容量不会变。</div>`); draw1(); return; }
      if (fromA) { st.a -= amt; st.b += amt; } else { st.b -= amt; st.a += amt; }
      st.n++;
      st.log.push(`<div class="ok">✔ ${who} → ${to} ${fmtN(amt, 0)} sat：双方签新承诺交易 #${st.n}，再交出 #${st.n - 1} 的撤销密钥。现在 Alice ${fmtN(st.a, 0)} / Bob ${fmtN(st.b, 0)}。</div>`);
      draw1();
    };
    $('[data-ab]', el).addEventListener('click', () => pay(true, B.read().pay));
    $('[data-ba]', el).addEventListener('click', () => pay(false, B.read().pay));
    $('[data-rs]', el).addEventListener('click', () => { reset(B.read().cap); draw1(); });

    // ---- 第二部分：路由 ----
    const HOPFEE = { B: { base: 1000, ppm: 500, cltv: 40 }, C: { base: 1000, ppm: 1000, cltv: 40 } }; // 示例手续费策略（msat 基础费 + 百万分比）
    const FINAL_CLTV = 18, TIP = 900000; // 示例：当前区块高度
    const draw2 = v => {
      // 从终点往回算：D 收 amt；C 转给 D 的金额 = amt；B 转给 C = amt + C 的手续费；A 转给 B = 再加 B 的手续费
      const fee = (h, x) => Math.ceil(HOPFEE[h].base / 1000 + x * HOPFEE[h].ppm / 1e6);
      const cd = v.amt, feeC = fee('C', cd), bc = cd + feeC, feeB = fee('B', bc), ab = bc + feeB;
      const exp = { cd: TIP + FINAL_CLTV, bc: TIP + FINAL_CLTV + HOPFEE.C.cltv, ab: TIP + FINAL_CLTV + HOPFEE.C.cltv + HOPFEE.B.cltv };
      const hops = [['A → B', ab, v.ab, exp.ab, 'A'], ['B → C', bc, v.bc, exp.bc, 'B'], ['C → D', cd, v.cd, exp.cd, 'C']];
      const failAt = hops.findIndex(h => h[1] > h[2]);
      $('[data-s2]', el).innerHTML = stat('A 总共付出', fmtN(ab, 0) + ' sat') + stat('B 赚的转发费', fmtN(feeB, 0) + ' sat') + stat('C 赚的转发费', fmtN(feeC, 0) + ' sat') + stat('总手续费率', fmtP((ab - cd) / cd, 3)) + stat('结果', failAt < 0 ? '成功' : '在 ' + hops[failAt][4] + ' 失败', failAt < 0 ? 'ok' : 'risk');
      const L = [];
      L.push('<div>D 生成发票：payment_hash = H(r)，原像 r 只有 D 知道。A 用洋葱包把每一跳的金额和过期高度分别加密给 B、C、D。</div>');
      hops.forEach((h, i) => {
        if (failAt >= 0 && i > failAt) { L.push(`<div class="muted">· ${h[0]}：没有到达</div>`); return; }
        if (i === failAt) { L.push(`<div class="risk">✘ ${h[0]}：要转 ${fmtN(h[1], 0)} sat，但 ${h[4]} 这一侧只有 ${fmtN(h[2], 0)} sat。${h[4]} 返回 temporary_channel_failure。</div>`); return; }
        L.push(`<div class="ok">✔ ${h[0]}：锁定 HTLC ${fmtN(h[1], 0)} sat，条件“出示 r 就给钱，否则高度 ${fmtN(h[3], 0)} 之后退回”</div>`);
      });
      if (failAt < 0) L.push('<div class="ok">D 出示 r 领取 C 的 HTLC → C 用同一个 r 领取 B 的 → B 再领取 A 的。r 原路返回，A 得到付款证明。</div>');
      else L.push(`<div class="warn">失败消息原路加密返回 A；上游已锁的 HTLC 被取消，资金退回，没有人亏钱。A 的寻路算法把这条通道记为“暂时不可用”，换路再试。</div>`);
      $('[data-l2]', el).innerHTML = L.join('');
      const vd = $('[data-vd]', el);
      if (failAt < 0) { vd.className = 'verdict ok'; vd.textContent = `每一跳的过期高度向上游递增（${fmtN(exp.cd, 0)} → ${fmtN(exp.bc, 0)} → ${fmtN(exp.ab, 0)}）：转发节点在下游领走钱之后，还有 ${HOPFEE.C.cltv} 个区块的时间去上游领钱。手续费按“基础费 + 金额 × 百万分比”计算（示例），所以金额越大，手续费越高。`; }
      else { vd.className = 'verdict risk'; vd.textContent = `通道总容量够，不代表这个方向的余额够。${hops[failAt][0]} 方向只有 ${fmtN(hops[failAt][2], 0)} sat 可用，付不了 ${fmtN(hops[failAt][1], 0)} sat。发送方事先看不到别人通道里的余额分布，只能试、失败、换路。这就是闪电网络“入站 / 出站流动性”问题。`; }
    };
    let B;
    B = bindInputs(el, { cap: v => v.toLocaleString() + ' sat', pay: v => v.toLocaleString() + ' sat', amt: v => v.toLocaleString() + ' sat', ab: v => v.toLocaleString(), bc: v => v.toLocaleString(), cd: v => v.toLocaleString() }, v => {
      if (!st || st.cap !== v.cap) reset(v.cap);
      draw1(); draw2(v);
    });
  }
});
})();
