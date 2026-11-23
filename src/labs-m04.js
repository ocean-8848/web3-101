/* ---------- Labs M08: ledger, por ---------- */
(() => {

addLab('ledger', {
  ch: 'm04-3', title: '双分录账本模拟器', desc: 'Alice、Bob 和平台手续费账户，资产 USDT 与 BTC。每个操作写入成对分录，实时检查“用户总额 + 平台 = 外部充值 − 外部提币”。可以注入 bug，也可以重复提交同一业务单号。',
  mount(el, p) {
    // 金额用整数最小单位存储，避免浮点误差：USDT 6 位小数，BTC 8 位小数
    const DEC = { USDT: 1e6, BTC: 1e8 };
    const SHOW = { USDT: 2, BTC: 4 };
    const ACC = [['alice', 'Alice'], ['bob', 'Bob'], ['fee', '平台手续费']];
    const ASSETS = ['USDT', 'BTC'];
    const PRICE = 60000, QTY = 0.1, FEE = 0.001; // 示例参数
    let S;
    const fmtA = (a, v) => fmtN(v / DEC[a], SHOW[a]);
    function reset() {
      S = { bal: {}, ext: { USDT: { dep: 0, wd: 0 }, BTC: { dep: 0, wd: 0 } }, journal: [], done: new Map(), seq: 1000, orders: { buy: null, sell: null }, last: null, log: [] };
      ACC.forEach(([k]) => { S.bal[k] = {}; ASSETS.forEach(a => S.bal[k][a] = { avail: 0, frozen: 0 }); });
      // 预置初始余额：同样通过“外部充值”分录写入，保证不变量从一开始就成立
      apply({ type: 'dep', who: 'alice', asset: 'USDT', amt: 2000 }, 'DEP-INIT-A', true);
      apply({ type: 'dep', who: 'bob', asset: 'USDT', amt: 8000 }, 'DEP-INIT-B1', true);
      apply({ type: 'dep', who: 'bob', asset: 'BTC', amt: 0.5 }, 'DEP-INIT-B2', true);
      S.log.unshift({ c: 'info', t: '已预置初始余额：Alice 2,000 USDT；Bob 8,000 USDT + 0.5 BTC。' });
    }
    const name = k => k === 'ext' ? '托管资产（链上）' : ACC.find(x => x[0] === k)[1];
    const bucketName = b => b === 'avail' ? '可用' : b === 'frozen' ? '冻结' : '';
    // 一条分录：dir = 借 / 贷。用户负债账户：贷 = 增加，借 = 减少。托管资产账户：借 = 增加，贷 = 减少。
    function line(ref, dir, who, asset, bucket, amt) {
      S.journal.unshift({ ref, dir, acct: name(who) + (bucket ? '·' + bucketName(bucket) : ''), asset, amt });
      if (who === 'ext') return;
      S.bal[who][asset][bucket] += dir === '贷' ? amt : -amt;
    }
    function apply(op, ref, silent) {
      if (S.done.has(ref)) {
        S.log.unshift({ c: 'warn', t: `幂等拦截：业务单号 ${ref} 已处理过（${S.done.get(ref)}）。直接返回上次结果，余额不变。` });
        return false;
      }
      const u = op.who, a = op.asset;
      const n = Math.round(op.amt * DEC[a]);
      let desc = '';
      if (op.type === 'dep') {
        line(ref, '借', 'ext', a, '', n); line(ref, '贷', u, a, 'avail', n);
        S.ext[a].dep += n; desc = `${name(u)} 充值 ${fmtN(op.amt, SHOW[a])} ${a}`;
      } else if (op.type === 'freeze') {
        if (S.bal[u][a].avail < n) { S.log.unshift({ c: 'risk', t: `拒绝 ${ref}：${name(u)} 可用 ${a} 只有 ${fmtA(a, S.bal[u][a].avail)}，需要 ${fmtA(a, n)}。` }); return false; }
        line(ref, '借', u, a, 'avail', n); line(ref, '贷', u, a, 'frozen', n);
        desc = `${name(u)} 冻结 ${fmtA(a, n)} ${a}（${op.why}）`;
      } else if (op.type === 'unfreeze') {
        line(ref, '借', u, a, 'frozen', n); line(ref, '贷', u, a, 'avail', n);
        desc = `${name(u)} 解冻 ${fmtA(a, n)} ${a}（${op.why}）`;
      } else if (op.type === 'wd') {
        line(ref, '借', u, a, 'frozen', n); line(ref, '贷', 'ext', a, '', n);
        S.ext[a].wd += n; desc = `${name(u)} 提币扣减 ${fmtA(a, n)} ${a}（链上已确认）`;
      } else if (op.type === 'trade') {
        const quote = Math.round(PRICE * QTY * DEC.USDT), base = Math.round(QTY * DEC.BTC);
        const fq = Math.round(quote * FEE), fb = Math.round(base * FEE);
        // USDT 腿：Alice 冻结 → Bob 可用 + 平台手续费
        line(ref, '借', 'alice', 'USDT', 'frozen', quote);
        if (!op.bug) line(ref, '贷', 'bob', 'USDT', 'avail', quote - fq);
        line(ref, '贷', 'fee', 'USDT', 'avail', fq);
        // BTC 腿：Bob 冻结 → Alice 可用 + 平台手续费
        line(ref, '借', 'bob', 'BTC', 'frozen', base);
        line(ref, '贷', 'alice', 'BTC', 'avail', base - fb);
        line(ref, '贷', 'fee', 'BTC', 'avail', fb);
        desc = `撮合成交 0.1 BTC @ 60,000，双方各付 0.1% 手续费${op.bug ? '（注入 bug：漏记 Bob 收款）' : ''}`;
      }
      S.done.set(ref, desc);
      S.last = { op, ref };
      if (!silent) S.log.unshift({ c: op.bug ? 'risk' : 'ok', t: `✓ ${ref}：${desc}` });
      return true;
    }
    const nextRef = pre => pre + '-' + (++S.seq);
    el.innerHTML = `<div class="try"><b>试一试：</b>① 先点“Alice 挂买单”：余额不足被拒绝；再点“Alice 充值”后重试。② 依次点“Bob 挂卖单”“撮合成交”，看每格 available / frozen 和流水表。③ 点“重复提交上一笔”，看幂等拦截。④ 打开“注入 bug”，再挂单撮合一次，看不变量变红和差额。</div>
    <div class="row-btns" style="flex-wrap:wrap;gap:8px">
      <button class="btn" data-op="dep">Alice 充值 10,000 USDT</button>
      <button class="btn" data-op="buy">Alice 挂买单冻结（0.1 BTC @ 60,000）</button>
      <button class="btn" data-op="sell">Bob 挂卖单冻结 0.1 BTC</button>
      <button class="btn primary" data-op="match">撮合成交（手续费 0.1%）</button>
      <button class="btn" data-op="cancel">撤单解冻</button>
      <button class="btn" data-op="wd">Bob 提币 5,000 USDT</button>
    </div>
    <div class="row-btns" style="flex-wrap:wrap;gap:8px;margin-top:8px">
      <button class="btn" data-op="dup">↻ 重复提交上一笔（同一业务单号）</button>
      <label class="small" for="${p}-bug" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="${p}-bug"> 注入 bug：成交时只记一边</label>
      <button class="btn" data-op="reset">重置</button>
    </div>
    <div data-grid style="margin-top:10px"></div>
    <div class="stats" data-s style="margin-top:10px"></div>
    <div class="verdict" data-vd></div>
    <div class="two" style="margin-top:10px">
      <div><div class="small muted" style="margin-bottom:4px">流水表（最新在上）：业务单号 · 借/贷 · 账户 · 金额</div><div class="log" data-j></div></div>
      <div><div class="small muted" style="margin-bottom:4px">操作日志</div><div class="log" data-log></div></div>
    </div>`;
    const bugBox = $(`#${p}-bug`, el);
    function draw() {
      const cell = (k, a) => { const b = S.bal[k][a]; return `<span class="mono">${fmtA(a, b.avail)}</span> <span class="muted small">/ ${fmtA(a, b.frozen)}</span>`; };
      $('[data-grid]', el).innerHTML = `<div class="table-wrap"><table><thead><tr><th>账户</th><th>USDT 可用 / 冻结</th><th>BTC 可用 / 冻结</th></tr></thead><tbody>${ACC.map(([k, n]) => `<tr><td>${n}</td><td>${cell(k, 'USDT')}</td><td>${cell(k, 'BTC')}</td></tr>`).join('')}</tbody></table></div>`;
      let allOk = true, msg = [];
      const cards = ASSETS.map(a => {
        const sum = ACC.reduce((s, [k]) => s + S.bal[k][a].avail + S.bal[k][a].frozen, 0);
        const ext = S.ext[a].dep - S.ext[a].wd, diff = sum - ext, ok = diff === 0;
        if (!ok) { allOk = false; msg.push(`${a} 差额 ${diff > 0 ? '+' : '−'}${fmtA(a, Math.abs(diff))}`); }
        return stat(`${a}：用户 + 平台`, fmtA(a, sum)) + stat(`${a}：外部充值 − 外部提币`, fmtA(a, ext)) + stat(`${a} 不变量`, ok ? '✓ 相等' : '✗ 差 ' + fmtA(a, Math.abs(diff)), ok ? 'ok' : 'risk');
      });
      // 每个业务单号内：借方合计 = 贷方合计（同一资产）
      const byRef = {};
      S.journal.forEach(j => { const key = j.ref + '|' + j.asset; byRef[key] = (byRef[key] || 0) + (j.dir === '借' ? j.amt : -j.amt); });
      const bad = Object.entries(byRef).filter(([, v]) => v !== 0).map(([k]) => k.split('|')[0]);
      $('[data-s]', el).innerHTML = cards.join('') + stat('借贷不平的单号', bad.length ? [...new Set(bad)].join(', ') : '无', bad.length ? 'risk' : 'ok');
      const vd = $('[data-vd]', el);
      if (allOk && !bad.length) { vd.className = 'verdict ok'; vd.textContent = '账平：每种资产的“用户 + 平台”恰好等于“外部充值 − 外部提币”，每个业务单号内借贷相等。'; }
      else { vd.className = 'verdict risk'; vd.textContent = `账不平！${msg.join('；')}。对账系统会在这里报警并暂停提币，直到找出漏记的分录。`; }
      $('[data-j]', el).innerHTML = S.journal.length ? S.journal.slice(0, 60).map(j => `<div class="${j.dir === '借' ? 'info' : 'ok'}">${j.ref}  ${j.dir}  ${j.acct}  ${fmtA(j.asset, j.amt)} ${j.asset}</div>`).join('') : '<div class="muted">暂无分录</div>';
      $('[data-log]', el).innerHTML = S.log.slice(0, 40).map(l => `<div class="${l.c}">${esc(l.t)}</div>`).join('');
      const o = S.orders;
      $('[data-op="match"]', el).disabled = !(o.buy && o.sell);
      $('[data-op="cancel"]', el).disabled = !(o.buy || o.sell);
    }
    function act(k) {
      const o = S.orders;
      if (k === 'reset') { reset(); bugBox.checked = false; }
      else if (k === 'dep') apply({ type: 'dep', who: 'alice', asset: 'USDT', amt: 10000 }, nextRef('DEP'));
      else if (k === 'buy') {
        if (o.buy) S.log.unshift({ c: 'warn', t: 'Alice 已有一个未成交买单。先撮合或撤单。' });
        else { const ref = nextRef('ORD'); if (apply({ type: 'freeze', who: 'alice', asset: 'USDT', amt: PRICE * QTY, why: '买单 ' + ref }, ref)) o.buy = ref; }
      } else if (k === 'sell') {
        if (o.sell) S.log.unshift({ c: 'warn', t: 'Bob 已有一个未成交卖单。先撮合或撤单。' });
        else { const ref = nextRef('ORD'); if (apply({ type: 'freeze', who: 'bob', asset: 'BTC', amt: QTY, why: '卖单 ' + ref }, ref)) o.sell = ref; }
      } else if (k === 'match') {
        if (o.buy && o.sell) { if (apply({ type: 'trade', bug: bugBox.checked }, 'TRD-' + o.buy + '-' + o.sell)) { o.buy = null; o.sell = null; } }
      } else if (k === 'cancel') {
        if (o.buy) { apply({ type: 'unfreeze', who: 'alice', asset: 'USDT', amt: PRICE * QTY, why: '撤销 ' + o.buy }, 'CXL-' + o.buy); o.buy = null; }
        if (o.sell) { apply({ type: 'unfreeze', who: 'bob', asset: 'BTC', amt: QTY, why: '撤销 ' + o.sell }, 'CXL-' + o.sell); o.sell = null; }
      } else if (k === 'wd') {
        const ref = nextRef('WD');
        if (apply({ type: 'freeze', who: 'bob', asset: 'USDT', amt: 5000, why: '提币申请 ' + ref }, ref + '-FRZ')) {
          apply({ type: 'wd', who: 'bob', asset: 'USDT', amt: 5000 }, ref + '-DONE');
        }
      } else if (k === 'dup') {
        if (!S.last) S.log.unshift({ c: 'warn', t: '还没有可重复的请求。' });
        else apply(S.last.op, S.last.ref);
      }
      draw();
    }
    $$('[data-op]', el).forEach(b => b.addEventListener('click', () => act(b.dataset.op)));
    bugBox.addEventListener('change', () => { S.log.unshift({ c: bugBox.checked ? 'risk' : 'info', t: bugBox.checked ? '已注入 bug：下一次成交将漏记 Bob 的 USDT 收款分录。' : '已关闭 bug。已经写错的账不会自动修复：真实系统要写一笔“调账分录”更正。' }); draw(); });
    reset();
    draw();
  }
});

addLab('por', {
  ch: 'm04-8', title: '默克尔和树储备金证明', desc: '8 个用户余额构成默克尔和树：每个节点 = 哈希 + 子树余额和。选择一个用户查看他的证明路径；调节链上储备看储备率；再看“偷偷删除大户”为什么只有被删的人能发现。',
  mount(el, p) {
    const bal = [1200, 350, 8000, 150, 600, 24000, 50, 900]; // 示例余额（USDT）
    let me = 0, hide = false;
    el.innerHTML = `<div class="try"><b>试一试：</b>① 选择 U3，看他的证明路径（橙色是路径，蓝色是兄弟节点），确认验证通过。② 把储备滑块拉到 30,000 以下，看储备率低于 100%。③ 点“偷偷删除一个大户”：负债总额变小、储备率变好看；选 U6 验证失败，选其他用户验证仍然通过。</div>
    <div class="small muted" style="margin-bottom:4px">用户余额（USDT，可编辑）</div>
    <div data-ins style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px"></div>
    <div class="ctrls" style="margin-top:8px">${rng(p, 'res', '交易所链上储备（USDT）', 0, 60000, 500, 36000)}</div>
    <div class="row-btns" style="flex-wrap:wrap;gap:8px">${segHtml('me', bal.map((_, i) => [String(i), 'U' + (i + 1)]), '0')}<button class="btn" data-hide>交易所偷偷删除一个大户</button></div>
    <div data-tree style="overflow-x:auto;margin-top:10px"></div>
    <div class="stats" data-s style="margin-top:10px"></div>
    <div class="verdict" data-vd></div>
    <div class="small muted" style="margin:8px 0 4px">验证过程（用户在自己的电脑上执行）</div>
    <div class="log" data-log></div>`;
    $('[data-ins]', el).innerHTML = bal.map((b, i) => `<label class="small" for="${p}-u${i}">U${i + 1}<input type="number" id="${p}-u${i}" data-u="${i}" min="0" step="50" value="${b}" style="width:100%"></label>`).join('');
    const H8 = s => sha256(s).slice(0, 8);
    // 叶子：hash(用户ID | 随机盐 | 余额)。盐防止别人穷举余额。
    const leafOf = (i, b) => ({ h: H8(`U${i + 1}|salt-${i * 7919 + 13}|${b}`), sum: b, user: i });
    const parent = (l, r) => ({ h: H8(`${l.h}|${l.sum}|${r.h}|${r.sum}`), sum: l.sum + r.sum });
    function build(includeIdx) {
      const leaves = includeIdx.map(i => leafOf(i, bal[i]));
      while (leaves.length < 8) leaves.push({ h: H8('pad|' + leaves.length), sum: 0, user: -1 });
      const lv = [leaves];
      while (lv[lv.length - 1].length > 1) { const cur = lv[lv.length - 1], nx = []; for (let i = 0; i < cur.length; i += 2) nx.push(parent(cur[i], cur[i + 1])); lv.push(nx); }
      return lv;
    }
    const bigIdx = () => bal.indexOf(Math.max(...bal));
    function draw(v) {
      const all = bal.map((_, i) => i);
      const del = bigIdx();
      const incl = hide ? all.filter(i => i !== del) : all;
      const lv = build(incl);
      const root = lv[lv.length - 1][0];
      const realSum = bal.reduce((s, b) => s + b, 0);
      // 找到我的叶子位置
      const pos = lv[0].findIndex(n => n.user === me);
      const pathSet = new Set(), sibSet = new Set();
      if (pos >= 0) { let k = pos; for (let d = 0; d < lv.length; d++) { pathSet.add(d + ':' + k); if (d < lv.length - 1) sibSet.add(d + ':' + (k ^ 1)); k >>= 1; } }
      const box = (n, d, k) => {
        const key = d + ':' + k, onP = pathSet.has(key), onS = sibSet.has(key);
        const st = onP ? 'border-color:var(--warn);background:var(--warn-soft)' : onS ? 'border-color:var(--info);background:var(--info-soft)' : '';
        const lbl = d === 0 ? (n.user >= 0 ? 'U' + (n.user + 1) : '空') : d === lv.length - 1 ? '根 Root' : 'N' + d + '.' + k;
        return `<div class="stat" style="padding:4px 6px;${st}"><div class="k" style="font-size:11px">${lbl}</div><div class="mono" style="font-size:11px;overflow-wrap:anywhere">${n.h}</div><div class="mono" style="font-size:12px;font-weight:600">Σ ${n.sum.toLocaleString()}</div></div>`;
      };
      $('[data-tree]', el).innerHTML = `<div style="min-width:560px;display:grid;gap:6px">${lv.slice().reverse().map((row, ri) => { const d = lv.length - 1 - ri; return `<div style="display:grid;grid-template-columns:repeat(${row.length},1fr);gap:6px">${row.map((n, k) => box(n, d, k)).join('')}</div>`; }).join('')}</div>`;
      // 验证：用户只拿到自己的叶子数据 + 兄弟节点，自己算到根
      const log = [];
      let ok = false;
      if (pos < 0) {
        log.push({ c: 'risk', t: `U${me + 1} 用自己的 ID、盐和余额 ${bal[me].toLocaleString()} 算出叶子哈希 ${leafOf(me, bal[me]).h}。` });
        log.push({ c: 'risk', t: '交易所给不出包含这个叶子的证明路径（叶子不在树里）。自证失败：我的余额没有被计入负债！' });
      } else {
        let cur = leafOf(me, bal[me]), k = pos, sibOk = true;
        log.push({ c: 'info', t: `第 0 步：叶子 = hash(U${me + 1} | 盐 | ${bal[me]}) = ${cur.h}，Σ = ${cur.sum.toLocaleString()}` });
        for (let d = 0; d < lv.length - 1; d++) {
          const sib = lv[d][k ^ 1];
          if (sib.sum < 0) sibOk = false;
          const [l, r] = k % 2 === 0 ? [cur, sib] : [sib, cur];
          cur = parent(l, r);
          log.push({ c: 'info', t: `第 ${d + 1} 步：兄弟 ${sib.h}（Σ ${sib.sum.toLocaleString()}，${sib.sum >= 0 ? '非负 ✓' : '负数 ✗'}）→ 父节点 ${cur.h}，Σ ${cur.sum.toLocaleString()}` });
          k >>= 1;
        }
        ok = cur.h === root.h && cur.sum === root.sum && sibOk;
        log.push({ c: ok ? 'ok' : 'risk', t: ok ? `算出的根 ${cur.h} / Σ ${cur.sum.toLocaleString()} 与交易所公布的根一致。我的余额被包含，路径上没有负数余额。` : '算出的根和公布的根不一致，验证失败。' });
      }
      $('[data-log]', el).innerHTML = log.map(l => `<div class="${l.c}">${esc(l.t)}</div>`).join('');
      const res = v.res, ratio = res / root.sum, realRatio = res / realSum;
      $('[data-s]', el).innerHTML = stat('公布的负债总额（根 Σ）', root.sum.toLocaleString()) + stat('链上储备', res.toLocaleString()) +
        stat('公布储备率', fmtP(ratio, 1), ratio >= 1 ? 'ok' : 'risk') +
        (hide ? stat('真实负债 / 真实储备率', realSum.toLocaleString() + ' / ' + fmtP(realRatio, 1), realRatio >= 1 ? 'ok' : 'risk') : '') +
        stat(`U${me + 1} 自证`, ok ? '通过' : '失败', ok ? 'ok' : 'risk');
      const vd = $('[data-vd]', el);
      if (hide) { vd.className = 'verdict risk'; vd.textContent = `交易所删掉了 U${del + 1}（${bal[del].toLocaleString()} USDT）。公布储备率 ${fmtP(ratio, 1)}，真实储备率 ${fmtP(realRatio, 1)}。只有 U${del + 1} 本人验证会失败；其他 7 人的路径都正确，他们无法发现。这就是 PoR 的“负债完整性”局限。`; }
      else if (ratio < 1) { vd.className = 'verdict risk'; vd.textContent = `储备不足：链上储备只覆盖 ${fmtP(ratio, 1)} 的负债。如果所有用户同时提币，交易所无法全部兑付。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `储备率 ${fmtP(ratio, 1)}，且 U${me + 1} 验证通过。注意：这只证明了“公布的负债”有足够储备。`; }
      $('[data-hide]', el).textContent = hide ? '恢复：把大户放回树中' : '交易所偷偷删除一个大户';
    }
    let B;
    $$('input[data-u]', el).forEach(inp => inp.addEventListener('input', () => { const x = Math.max(0, Math.round(+inp.value || 0)); bal[+inp.dataset.u] = x; B.upd(); }));
    seg(el, 'me', v => { me = +v; B.upd(); });
    $('[data-hide]', el).addEventListener('click', () => { hide = !hide; B.upd(); });
    B = bindInputs(el, { res: v => v.toLocaleString() + ' USDT' }, draw);
  }
});

})();
