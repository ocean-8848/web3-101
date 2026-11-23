/* ---------- Labs M01: merkle, reorg ---------- */
(() => {
addLab('merkle', {
  ch: 'm01-2', title: '默克尔树：构建、证明与篡改', desc: '8 笔交易用 SHA-256 两两哈希成一棵树。点击叶子查看证明路径，修改叶子观察根哈希变化和旧证明失效；再用滑块比较证明与全量数据的大小。',
  mount(el, p) {
    const leaves = ['tx1: Alice → Bob 5 ETH', 'tx2: Bob → Carol 2 ETH', 'tx3: Carol → Dave 1 ETH', 'tx4: Dave → Erin 0.5 ETH', 'tx5: Erin → Frank 3 ETH', 'tx6: Frank → Grace 7 ETH', 'tx7: Grace → Heidi 0.2 ETH', 'tx8: Heidi → Ivan 4 ETH'];
    let sel = 2, snap = null, tree = null;
    el.innerHTML = `<div class="try"><b>试一试：</b>① 点击树底部的叶子 3（橙色是兄弟节点，绿色是计算路径），再点“验证证明”。② 把任意一个叶子的文字改一个字，观察根哈希变化，再点“验证证明”：旧证明失败。③ 点“为选中叶子重新生成证明”，验证又通过。④ 拖动最下面的滑块，看 100 万个叶子的证明有多短。</div>
    <div class="two">
      <div><div class="small muted">叶子数据（可编辑；点左侧编号选中）</div><div data-leaves style="display:grid;gap:4px;margin-top:4px"></div></div>
      <div><div class="small muted">证明快照（生成时记录的兄弟哈希和根）</div><div class="log" data-proof style="margin-top:4px"></div>
        <div class="row-btns" style="margin-top:8px"><button type="button" class="btn primary" data-verify>✓ 验证证明</button><button type="button" class="btn" data-regen>为选中叶子重新生成证明</button></div></div>
    </div>
    <div data-tree style="overflow-x:auto"></div>
    <div class="stats" data-s></div>
    <div class="verdict info" data-vd>已为叶子 3 生成证明（3 个兄弟哈希）。点“验证证明”，或点击其他叶子。</div>
    <div class="small muted" style="margin-top:6px"><b>证明有多短？</b>叶子越多，证明只多几个哈希，但全量数据线性增长。</div>
    <div class="ctrls">${rng(p, 'e', '叶子数量 n', 1, 20, 1, 13)}</div>
    <div class="stats" data-s2></div><div data-c></div>`;
    const short = h => h.slice(0, 6);
    const build = () => {
      const lv = [leaves.map(t => sha256(t))];
      while (lv[lv.length - 1].length > 1) {
        const cur = lv[lv.length - 1].slice();
        if (cur.length % 2) cur.push(cur[cur.length - 1]); // 奇数：复制最后一个
        const nxt = [];
        for (let i = 0; i < cur.length; i += 2) nxt.push(sha256(cur[i] + cur[i + 1]));
        lv.push(nxt);
      }
      return lv;
    };
    const proofOf = (lv, idx) => {
      const pf = [];
      for (let l = 0; l < lv.length - 1; l++) {
        const row = lv[l]; let sib = idx ^ 1;
        if (sib >= row.length) sib = idx;
        pf.push({ h: row[sib], side: sib < idx ? 'L' : 'R', level: l, sib });
        idx >>= 1;
      }
      return pf;
    };
    const makeSnap = i => { snap = { idx: i, text: leaves[i], all: leaves.slice(), proof: proofOf(tree, i), root: tree[tree.length - 1][0] }; };
    const label = (l, i, len) => l === 0 ? 'H' + (i + 1) : len === 1 ? '根' : `H(${i * (1 << l) + 1}-${(i + 1) * (1 << l)})`;
    function drawTree() {
      const L = tree.length, cols = tree[0].length;
      const pathSet = new Set(), sibSet = new Set();
      let idx = sel;
      for (let l = 0; l < L; l++) { pathSet.add(l + ':' + idx); if (l < L - 1) { let s = idx ^ 1; if (s >= tree[l].length) s = idx; if (s !== idx) sibSet.add(l + ':' + s); } idx >>= 1; }
      let html = '';
      for (let l = L - 1; l >= 0; l--) {
        const row = tree[l], span = cols / row.length;
        html += `<div style="display:grid;grid-template-columns:repeat(${cols},minmax(30px,1fr));gap:3px;margin-bottom:4px;min-width:270px">` + row.map((h, i) => {
          const k = l + ':' + i, onPath = pathSet.has(k), isSib = sibSet.has(k);
          const bd = onPath ? 'var(--accent)' : isSib ? 'var(--warn)' : 'var(--rule)';
          const bg = onPath ? 'var(--accent-soft)' : isSib ? 'var(--warn-soft)' : 'var(--tint)';
          const tag = l === 0 ? 'button type="button"' : 'div';
          return `<${tag} ${l === 0 ? `data-pick="${i}" aria-label="选中叶子 ${i + 1}"` : ''} style="grid-column:span ${span};border:1.5px solid ${bd};background:${bg};color:var(--ink);border-radius:6px;padding:3px 2px;text-align:center;font:inherit;cursor:${l === 0 ? 'pointer' : 'default'};min-width:0">
            <div class="small" style="font-weight:600;font-size:11px;white-space:nowrap;overflow:hidden">${label(l, i, row.length)}</div><div class="mono" style="font-size:10px;overflow:hidden">${l === 0 ? h.slice(0, 4) : short(h)}</div></${l === 0 ? 'button' : 'div'}>`;
        }).join('') + '</div>';
      }
      $('[data-tree]', el).innerHTML = html + `<div class="small muted">图例：<span style="color:var(--accent)">■</span> 从叶子到根的计算路径　<span style="color:var(--warn)">■</span> 证明需要的兄弟节点（共 ${L - 1} 个）</div>`;
      $$('[data-pick]', el).forEach(b => b.addEventListener('click', () => select(+b.dataset.pick)));
    }
    function drawProof() {
      const box = $('[data-proof]', el);
      if (!snap) { box.innerHTML = '<div>还没有证明。点击一个叶子。</div>'; return; }
      box.innerHTML = `<div>叶子 ${snap.idx + 1}：${esc(snap.text)}</div>` + snap.proof.map((s, j) => `<div class="info">${j + 1}. 兄弟 ${label(s.level, s.sib, 2)} 在${s.side === 'L' ? '左' : '右'}：${short(s.h)}…</div>`).join('') + `<div>生成时的根：${short(snap.root)}…</div>`;
    }
    function drawStats() {
      const root = tree[tree.length - 1][0];
      const changed = snap ? leaves.filter((t, i) => t !== snap.all[i]).length : 0;
      $('[data-s]', el).innerHTML = stat('当前根哈希', short(root) + '…') + stat('证明快照里的根', snap ? short(snap.root) + '…' : '—', snap && snap.root !== root ? 'risk' : '') +
        stat('证明长度', (tree.length - 1) + ' 个哈希') + stat('快照后被修改的叶子', changed + ' 个', changed ? 'warn' : 'ok');
    }
    function select(i) { sel = i; makeSnap(i); drawTree(); drawProof(); drawStats(); const vd = $('[data-vd]', el); vd.className = 'verdict info'; vd.textContent = `已为叶子 ${i + 1} 生成证明（${snap.proof.length} 个兄弟哈希）。点“验证证明”。`; }
    function verify() {
      const vd = $('[data-vd]', el), box = $('[data-proof]', el);
      if (!snap) { vd.className = 'verdict info'; vd.textContent = '先点击一个叶子生成证明。'; return; }
      let h = sha256(snap.text);
      const lines = [`<div>① 计算叶子哈希 H = ${short(h)}…</div>`];
      snap.proof.forEach((s, j) => { const nh = s.side === 'L' ? sha256(s.h + h) : sha256(h + s.h); lines.push(`<div>${j + 2 === 2 ? '②' : j + 2 === 3 ? '③' : '④'} ${s.side === 'L' ? `SHA256(${short(s.h)} ‖ ${short(h)})` : `SHA256(${short(h)} ‖ ${short(s.h)})`} = ${short(nh)}…</div>`); h = nh; });
      const root = tree[tree.length - 1][0], ok = h === root;
      lines.push(`<div class="${ok ? 'ok' : 'risk'}">算出 ${short(h)}… ${ok ? '=' : '≠'} 当前根 ${short(root)}…</div>`);
      box.innerHTML = lines.join('');
      const changed = leaves.map((t, i) => t !== snap.all[i] ? i + 1 : 0).filter(Boolean);
      vd.className = 'verdict ' + (ok ? 'ok' : 'risk');
      vd.textContent = ok ? `验证通过：叶子 ${snap.idx + 1} 确实在这棵树里。验证者只用了 ${snap.proof.length} 个兄弟哈希和 1 个根，没有看其他 ${leaves.length - 1} 笔交易。`
        : `验证失败：叶子 ${changed.join('、')} 被修改，根哈希变了，旧证明算出的根对不上。这就是“改一笔交易，区块头里的默克尔根就变”。点“为选中叶子重新生成证明”得到新证明。`;
    }
    const rebuild = () => { tree = build(); drawTree(); drawStats(); };
    $('[data-leaves]', el).innerHTML = leaves.map((t, i) => `<div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px;align-items:center"><button type="button" class="btn" data-sel="${i}" style="padding:2px 8px">${i + 1}</button><input type="text" id="${p}-leaf${i}" data-leaf="${i}" value="${esc(t)}" aria-label="叶子 ${i + 1} 数据"></div>`).join('');
    $$('input[data-leaf]', el).forEach(inp => inp.addEventListener('input', () => { leaves[+inp.dataset.leaf] = inp.value; rebuild(); const vd = $('[data-vd]', el); vd.className = 'verdict warn'; vd.textContent = '叶子已修改，根哈希已更新。点“验证证明”看旧证明还能不能通过。'; }));
    $$('[data-sel]', el).forEach(b => b.addEventListener('click', () => select(+b.dataset.sel)));
    $('[data-verify]', el).addEventListener('click', verify);
    $('[data-regen]', el).addEventListener('click', () => select(sel));
    tree = build(); makeSnap(sel); drawTree(); drawProof(); drawStats();
    const fmtB = b => b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(2) + ' MB' : b >= 1e3 ? (b / 1e3).toFixed(1) + ' KB' : b + ' B';
    bindInputs(el, { e: v => (2 ** v).toLocaleString('en-US') + ' 个' }, v => {
      const n = 2 ** v.e, proof = 32 * v.e, full = 250 * n, hashes = 32 * n;
      $('[data-s2]', el).innerHTML = stat('证明长度 log₂(n)', v.e + ' 个哈希') + stat('证明大小', proof + ' B', 'ok') + stat('全部叶子哈希', fmtB(hashes)) + stat('全部交易（按每笔 250 B 示例）', fmtB(full), 'warn') + stat('证明 / 全量', fmtP(proof / full, proof / full < 0.001 ? 5 : 2));
      const ptsP = [], ptsF = [];
      for (let k = 1; k <= 20; k++) { ptsP.push([2 ** k, Math.log10(32 * k)]); ptsF.push([2 ** k, Math.log10(250 * 2 ** k)]); }
      $('[data-c]', el).innerHTML = lineChart({ label: '证明大小与全量数据大小（对数刻度）', logx: true, xr: [2, 2 ** 20], yr: [1, 9], series: [{ pts: ptsF, cls: 's2' }, { pts: ptsP, cls: 's1' }], markers: [{ x: n, y: Math.log10(proof), label: '证明 ' + proof + ' B' }, { x: n, y: Math.log10(full), cls: 'dot2', label: '全量 ' + fmtB(full), below: true }], xticks: [2, 1024, 2 ** 20], fx: t => t >= 1e6 ? '1M' : t >= 1000 ? '1K' : t, yticks: [3, 6, 9], fy: t => ({ 3: '1 KB', 6: '1 MB', 9: '1 GB' }[t]) });
    });
  }
});

addLab('reorg', {
  ch: 'm01-8', title: '链重组与确认数：索引器模拟', desc: '一条链、一个按确认数入账的索引器。出块、制造 1 块重组（被孤立区块里的交易 50% 会重新打包）或 3 块深度重组（模拟双花，交易全部消失），观察确认数阈值 N 太小时的“入账后回滚”事故。',
  mount(el, p) {
    const AMTS = [50, 120, 300, 800, 1500, 5000];
    let chain, orphans, deps, seq, bseq, incidents, reorgs, N = 2, auto = null, lastMsg = '';
    el.innerHTML = `<div class="try"><b>试一试：</b>① N = 0，点“出一个新块”几次，再点“发生 1 块重组”：已入账的充值可能被回滚。② N = 3，点“发生 3 块深度重组”：仍有事故。③ N = 6，点“重置”后点“自动运行 30 块”：事故数保持 0，但入账变慢。</div>
    <div class="ctrls">${rng(p, 'n', '确认数阈值 N（确认数 ≥ N 才入账）', 0, 12, 1, 2)}</div>
    <div class="row-btns"><button type="button" class="btn primary" data-act="mine">⛏ 出一个新块</button><button type="button" class="btn" data-act="r1">↯ 发生 1 块重组</button><button type="button" class="btn" data-act="r3">↯↯ 发生 3 块深度重组</button><button type="button" class="btn" data-act="auto">▶ 自动运行 30 块</button><button type="button" class="btn" data-act="reset">重置</button></div>
    <div data-chain style="overflow-x:auto"></div>
    <div class="stats" data-s></div>
    <div class="table-wrap" data-t></div>
    <div class="verdict" data-vd></div>`;
    const tip = () => chain[chain.length - 1].h;
    const onMain = d => chain.some(b => b.id === d.blockId);
    const conf = d => onMain(d) ? tip() - d.h + 1 : 0;
    function newBlock(h, maxDeps) {
      const r = Math.random(), k = Math.min(maxDeps, r < 0.4 ? 0 : r < 0.8 ? 1 : 2);
      const b = { h, id: ++bseq, deps: [] };
      for (let i = 0; i < k; i++) { const d = { id: ++seq, amt: AMTS[Math.floor(Math.random() * AMTS.length)], h, blockId: b.id, status: 'pending', note: '' }; deps.push(d); b.deps.push(d.id); }
      return b;
    }
    function process() {
      deps.forEach(d => { if (d.status === 'pending' && onMain(d) && conf(d) >= N) d.status = 'credited'; });
    }
    function mine() { chain.push(newBlock(tip() + 1, 2)); process(); lastMsg = `出块：高度 ${tip()}。`; }
    function reorg(depth, reinclude) {
      if (chain.length <= depth + 1) { lastMsg = '链太短，先多出几个块。'; return; }
      const removed = chain.splice(chain.length - depth, depth);
      removed.forEach(b => orphans.push(b));
      const base = tip(), fresh = [];
      for (let i = 1; i <= depth + 1; i++) { const nb = newBlock(base + i, i === 1 ? 0 : 1); chain.push(nb); fresh.push(nb); }
      let lost = 0, back = 0, bad = 0;
      removed.forEach(b => b.deps.forEach(id => {
        const d = deps.find(x => x.id === id);
        if (Math.random() < reinclude) { // 交易回到交易池，被新分叉的第一个块重新打包
          d.h = fresh[0].h; d.blockId = fresh[0].id; fresh[0].deps.push(d.id); d.note = '重新打包'; back++;
        } else if (d.status === 'credited') { d.status = 'reverted'; incidents++; bad++; }
        else { d.status = 'orphaned'; lost++; }
      }));
      reorgs++;
      process();
      lastMsg = `${depth} 块重组：高度 ${depth === 1 ? base + 1 : (base + 1) + '–' + (base + depth)} 被孤立，新分叉 ${depth + 1} 个块。重新打包 ${back} 笔，未入账即失效 ${lost} 笔，入账后回滚 ${bad} 笔。`;
    }
    function reset() {
      if (auto) { clearInterval(auto); auto = null; }
      const ab = $('[data-act="auto"]', el); if (ab) ab.textContent = '▶ 自动运行 30 块';
      chain = [{ h: 1, id: 1, deps: [] }]; orphans = []; deps = []; seq = 0; bseq = 1; incidents = 0; reorgs = 0;
      for (let i = 0; i < 7; i++) mine();
      lastMsg = '已生成 8 个区块。';
    }
    const ST = { pending: ['待确认', 'warn'], credited: ['已入账', 'ok'], orphaned: ['已回滚·无损失', ''], reverted: ['已回滚·事故！', 'risk'] };
    function draw() {
      const W = el.clientWidth < 440 ? 7 : 10, hi = tip(), lo = Math.max(1, hi - W + 1), cols = hi - lo + 1;
      const cell = (b, kind) => {
        if (!b) return '<div></div>';
        const n = b.deps.length;
        const bd = kind === 'orphan' ? 'var(--risk)' : b.h === hi ? 'var(--accent)' : 'var(--rule)';
        const bg = kind === 'orphan' ? 'var(--risk-soft)' : n ? 'var(--accent-soft)' : 'var(--tint)';
        return `<div style="border:1.5px ${kind === 'orphan' ? 'dashed' : 'solid'} ${bd};background:${bg};border-radius:6px;padding:3px 2px;text-align:center;min-width:0"><div class="mono" style="font-size:11px;font-weight:600">${b.h}</div><div class="small" style="font-size:11px">${n ? '充×' + n : '·'}</div></div>`;
      };
      const row = (name, pick, kind) => `<div class="small muted" style="align-self:center;font-size:12px">${name}</div>` + Array.from({ length: cols }, (_, i) => cell(pick(lo + i), kind)).join('');
      const orphanAt = h => { for (let i = orphans.length - 1; i >= 0; i--) if (orphans[i].h === h) return orphans[i]; return null; };
      $('[data-chain]', el).innerHTML = `<div style="display:grid;grid-template-columns:52px repeat(${cols},minmax(34px,1fr));gap:4px;min-width:${52 + cols * 38}px">${row('主链', h => chain.find(b => b.h === h), 'main')}${row('被孤立', orphanAt, 'orphan')}</div>`;
      const c = s => deps.filter(d => d.status === s).length;
      $('[data-s]', el).innerHTML = stat('链高度', hi) + stat('阈值 N', N + ' 个确认') + stat('已入账', c('credited'), 'ok') + stat('待确认', c('pending'), c('pending') ? 'warn' : '') +
        stat('回滚（无损失）', c('orphaned')) + stat('入账后回滚（事故）', incidents, incidents ? 'risk' : 'ok') + stat('重组次数', reorgs);
      const list = deps.slice().reverse().slice(0, 10);
      $('[data-t]', el).innerHTML = `<style>[data-t] th,[data-t] td{padding:5px 7px!important;font-size:13px}</style><table><thead><tr><th>充值</th><th>金额</th><th>发现高度</th><th>确认</th><th>状态</th></tr></thead><tbody>${list.length ? list.map(d => {
        const [t, cls] = ST[d.status];
        return `<tr><td class="mono">D${d.id}</td><td class="mono">${d.amt.toLocaleString('en-US')}</td><td class="mono">${d.h}</td><td class="mono" style="white-space:nowrap">${onMain(d) ? conf(d) + '/' + N : '—'}</td><td style="color:${cls ? `var(--${cls})` : 'var(--ink-2)'};font-weight:600">${t}${d.note && onMain(d) ? '<div class="muted small">' + d.note + '</div>' : ''}</td></tr>`;
      }).join('') : '<tr><td colspan="5" class="muted">暂无充值。点“出一个新块”。</td></tr>'}</tbody></table>`;
      const vd = $('[data-vd]', el);
      if (incidents > 0) { vd.className = 'verdict risk'; vd.textContent = `${lastMsg} N = ${N} 时已发生 ${incidents} 次“入账后回滚”：用户已拿到余额，链上的钱却消失了。N 必须大于可能的重组深度（本实验最深 3 块，所以 N ≥ 4）。点“重置”后换一个 N 再试。`; }
      else if (N >= 4) { vd.className = 'verdict ok'; vd.textContent = `${lastMsg} N = ${N} 大于本实验的最大重组深度 3，重组只会影响“待确认”的充值，不会产生事故。代价是入账延迟：以太坊约 ${N} × 12 秒 = ${N * 12} 秒。`; }
      else { vd.className = 'verdict info'; vd.textContent = `${lastMsg} 目前没有事故。N = ${N} 小于等于 3，只要发生足够深的重组，已入账的充值就会被回滚。试试“发生 3 块深度重组”。`; }
    }
    $$('[data-act]', el).forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'mine') mine();
      if (a === 'r1') reorg(1, 0.5);
      if (a === 'r3') reorg(3, 0);
      if (a === 'reset') reset();
      if (a === 'auto') {
        if (auto) { clearInterval(auto); auto = null; b.textContent = '▶ 自动运行 30 块'; draw(); return; }
        let left = 30; b.textContent = '⏸ 停止';
        auto = setInterval(() => {
          if (!el.isConnected) { clearInterval(auto); auto = null; return; }
          const r = Math.random();
          if (r < 0.04) reorg(3, 0); else if (r < 0.16) reorg(1, 0.5); else mine();
          draw();
          if (--left <= 0) { clearInterval(auto); auto = null; b.textContent = '▶ 自动运行 30 块'; }
        }, 350);
        return;
      }
      draw();
    }));
    reset();
    bindInputs(el, { n: v => v + ' 个' }, v => { N = v.n; process(); draw(); });
  }
});
})();
