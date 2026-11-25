/* ---------- Labs M07 零知识证明与隐私：zkmember 匿名成员证明的数据 ---------- */
(() => {

addLab('zkmember', {
  ch: 'm10-7', title: '匿名成员证明：Merkle 组 + nullifier', desc: '8 个成员的身份承诺组成一棵 Merkle 树。选一个成员，看认证路径如何算回根；再用 nullifier = H(secret, scope) 防止同一 scope 重复领取，并观察改一个叶子后根如何变化。',
  mount(el, p) {
    // 预填 8 个成员：secret 只在成员自己的设备上；组里公开的只有身份承诺 H(id:secret)
    const members = [
      ['Alice', 'a1-7f3c-river'], ['Bob', 'b2-91aa-stone'], ['Carol', 'c3-4d0e-cloud'], ['Dave', 'd4-be12-maple'],
      ['Erin', 'e5-03f9-ocean'], ['Frank', 'f6-6c47-ember'], ['Grace', 'g7-a85d-lotus'], ['Heidi', 'h8-2e6b-cedar']
    ].map(([name, secret]) => ({ name, secret }));
    const outsider = { name: 'Mallory（非成员）', secret: 'm0-dead-beef' };
    const scopes = [['airdrop-2026-r1', '空投第 1 轮'], ['vote-proposal-42', '提案 42 投票'], ['airdrop-2026-r2', '空投第 2 轮']];
    let sel = 2, scope = scopes[0][0], tampered = false;
    let spent = new Map(); // nullifier -> { scope, recipient } 合约里的 nullifierUsed
    let rootHistory = [];  // 合约记住的最近几个根
    const H = s => sha256(s);
    const idc = secret => H('id:' + secret);                // 身份承诺（真实系统用 Poseidon）
    const nul = (secret, sc) => H('nul:' + secret + ':' + sc); // nullifier = H(secret, scope)
    const short = h => h.slice(0, 8);

    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认选中 Carol，看橙色兄弟节点和右侧逐步计算：3 个兄弟哈希就把她的叶子算回根。② 点“领取”：成功，nullifier 被记下。再点一次“领取”：同一 scope 被拒绝。③ 换成“提案 42 投票”再领：不同 scope 得到不同 nullifier，允许。④ 勾选“篡改叶子 6”，看根变了、旧根进入历史。⑤ 选“非成员”，验证失败。</div>
    <div class="small muted">选择证明者</div>
    ${segHtml('who', members.map((m, i) => [String(i), m.name]).concat([['x', '非成员']]), String(sel))}
    <div class="small muted" style="margin-top:6px">选择 scope（同一个 scope 里每人只能领一次）</div>
    ${segHtml('scope', scopes, scope)}
    <div class="row-btns" style="margin-top:8px">
      <button type="button" class="btn primary" data-claim>领取 / 投票</button>
      <button type="button" class="btn" data-reset>清空已用 nullifier</button>
      <label class="small"><input type="checkbox" data-tamper> 篡改叶子 6（Frank 的身份承诺）</label>
    </div>
    <div data-tree style="overflow-x:auto;margin-top:8px"></div>
    <div class="two">
      <div><div class="small muted">证明要用的数据（真实 ZK 证明里这些都是私有输入）</div><div class="log" data-path></div></div>
      <div><div class="small muted">合约状态与日志</div><div class="log" data-log></div></div>
    </div>
    <div class="stats" data-s></div>
    <div class="verdict info" data-vd></div>
    <div class="small muted" style="margin-top:6px">说明：这里用 SHA-256 代替 Poseidon，只为了在浏览器里不依赖任何库。真实电路用 Poseidon，因为它在电路里便宜得多。实验把“证明所描述的数据”全部摊开给你看；真正的零知识证明只公开 <b>根、nullifier、scope、message</b>，验证者看不到是哪片叶子、哪条路径、哪个 secret。</div>`;

    const leafOf = i => (tampered && i === 5) ? H('id:forged-by-admin') : idc(members[i].secret);
    const build = () => {
      const lv = [members.map((m, i) => leafOf(i))];
      while (lv[lv.length - 1].length > 1) {
        const cur = lv[lv.length - 1], nxt = [];
        for (let i = 0; i < cur.length; i += 2) nxt.push(H(cur[i] + cur[i + 1]));
        lv.push(nxt);
      }
      return lv;
    };
    const pathOf = (lv, idx) => {
      const out = [];
      for (let l = 0; l < lv.length - 1; l++) { const right = idx & 1; out.push({ sib: lv[l][idx ^ 1], right, l, sidx: idx ^ 1 }); idx >>= 1; }
      return out;
    };
    const who = () => sel === 'x' ? outsider : members[sel];
    const log = [];
    const addLog = (cls, t) => { log.unshift(`<div class="${cls}">${t}</div>`); if (log.length > 12) log.pop(); };

    function render() {
      const lv = build(), root = lv[lv.length - 1][0];
      if (!rootHistory.length || rootHistory[0] !== root) { rootHistory.unshift(root); if (rootHistory.length > 4) rootHistory.pop(); }
      const m = who();
      const leaf = idc(m.secret);
      const idx = sel === 'x' ? -1 : sel;
      // 非成员：拿 Carol 的路径冒充，算出来对不上
      const path = pathOf(lv, idx < 0 ? 2 : idx);
      // tree
      const onPath = new Set(), sibs = new Set();
      if (idx >= 0) { let k = idx; for (let l = 0; l < lv.length; l++) { onPath.add(l + ':' + k); if (l < lv.length - 1) sibs.add(l + ':' + (k ^ 1)); k >>= 1; } }
      let th = '';
      for (let l = lv.length - 1; l >= 0; l--) {
        const row = lv[l], span = 8 / row.length;
        th += `<div style="display:grid;grid-template-columns:repeat(8,minmax(30px,1fr));gap:3px;margin-bottom:4px;min-width:280px">` + row.map((h, i) => {
          const k = l + ':' + i, a = onPath.has(k), s = sibs.has(k), bad = tampered && l === 0 && i === 5;
          const bd = a ? 'var(--accent)' : s ? 'var(--warn)' : bad ? 'var(--risk)' : 'var(--rule)';
          const bg = a ? 'var(--accent-soft)' : s ? 'var(--warn-soft)' : bad ? 'var(--risk-soft)' : 'var(--tint)';
          const lab = l === 0 ? members[i].name : l === lv.length - 1 ? '根' : 'N' + l + '.' + i;
          return `<div style="grid-column:span ${span};border:1.5px solid ${bd};background:${bg};border-radius:6px;padding:3px 2px;text-align:center;min-width:0"><div class="small" style="font-weight:600;font-size:11px;white-space:nowrap;overflow:hidden">${esc(lab)}</div><div class="mono" style="font-size:10px;overflow:hidden">${h.slice(0, l === 0 ? 4 : 6)}</div></div>`;
        }).join('') + '</div>';
      }
      $('[data-tree]', el).innerHTML = th + `<div class="small muted">图例：<span style="color:var(--accent)">■</span> 计算路径　<span style="color:var(--warn)">■</span> 认证路径上的兄弟节点（3 个）${tampered ? '　<span style="color:var(--risk)">■</span> 被篡改的叶子' : ''}</div>`;
      // verify step by step
      let h = leaf;
      const lines = [`<div>secret（私有）：${esc(m.secret)}</div>`, `<div>① 叶子 = H(id:secret) = ${short(h)}…</div>`];
      path.forEach((s, j) => {
        const nh = s.right ? H(s.sib + h) : H(h + s.sib);
        lines.push(`<div>${['②', '③', '④'][j]} 第 ${j + 1} 层 pathIndex=${s.right}，兄弟在${s.right ? '左' : '右'}：H(${s.right ? short(s.sib) + ' ‖ ' + short(h) : short(h) + ' ‖ ' + short(s.sib)}) = ${short(nh)}…</div>`);
        h = nh;
      });
      const inTree = h === root;
      const n = nul(m.secret, scope);
      lines.push(`<div class="${inTree ? 'ok' : 'risk'}">算出的根 ${short(h)}… ${inTree ? '=' : '≠'} 当前根 ${short(root)}…</div>`);
      lines.push(`<div>nullifier = H(secret, “${esc(scope)}”) = ${short(n)}…（公开）</div>`);
      $('[data-path]', el).innerHTML = lines.join('');
      const used = spent.has(n);
      $('[data-s]', el).innerHTML = stat('当前根', short(root) + '…') +
        stat('成员资格', inTree ? '在组内' : '不在组内', inTree ? 'ok' : 'risk') +
        stat('本 scope 的 nullifier', short(n) + '…', used ? 'warn' : '') +
        stat('状态', used ? '已用过' : '未用过', used ? 'warn' : 'ok') +
        stat('已记录 nullifier 数', String(spent.size)) +
        stat('根历史（新→旧）', rootHistory.map(short).join(' / '));
      $('[data-log]', el).innerHTML = log.join('') || '<div class="muted">还没有领取记录。点“领取 / 投票”。</div>';
      return { root, inTree, n, used, m };
    }
    let state;
    const vd = msg => { const v = $('[data-vd]', el); v.className = 'verdict ' + msg[0]; v.textContent = msg[1]; };
    const refresh = () => {
      state = render();
      if (!state.inTree) vd(['risk', `${state.m.name} 的叶子算不回当前根。真实合约里，证明验证会失败（或者证明根本生成不出来）：电路要求“叶子 + 路径 = 公开的根”。`]);
      else if (state.used) vd(['warn', `${state.m.name} 在 scope “${scope}” 里已经用过这个 nullifier。再提交会被合约拒绝。换一个 scope 试试。`]);
      else vd(['ok', `${state.m.name} 在组内，nullifier 尚未使用。点“领取 / 投票”。验证者只会看到根和 nullifier，看不到是第几片叶子。`]);
    };
    seg(el, 'who', v => { sel = v === 'x' ? 'x' : +v; refresh(); });
    seg(el, 'scope', v => { scope = v; refresh(); });
    $('[data-claim]', el).addEventListener('click', () => {
      state = render();
      const tagOf = sc => (scopes.find(s => s[0] === sc) || [sc, sc])[1];
      if (!state.inTree) { addLog('risk', `拒绝：根不匹配（${esc(state.m.name)}）`); refresh(); vd(['risk', '拒绝：成员证明不成立。非成员无法构造出能算回根的路径。']); return; }
      if (state.used) { addLog('warn', `拒绝：nullifier ${short(state.n)}… 已用过（${esc(tagOf(scope))}）`); render(); vd(['warn', `拒绝：同一个人、同一个 scope 算出的 nullifier 完全相同，合约查表发现已用过。这就是防双领的全部机制。`]); return; }
      spent.set(state.n, { scope });
      addLog('ok', `通过：${esc(tagOf(scope))}，nullifier ${short(state.n)}… 记为已用`);
      render();
      vd(['ok', `领取成功。合约记下了 nullifier ${short(state.n)}…，但它无法从 nullifier 反推出是谁（不知道 secret 就算不出来）。再点一次试试。`]);
    });
    $('[data-reset]', el).addEventListener('click', () => { spent = new Map(); log.length = 0; refresh(); });
    $('[data-tamper]', el).addEventListener('change', e => {
      tampered = e.target.checked;
      addLog(tampered ? 'risk' : 'info', tampered ? '管理员把叶子 6 换成了另一个承诺：根变化，旧根进入历史' : '恢复叶子 6：根回到原值');
      refresh();
      if (tampered) vd(['risk', `改了一片叶子，根就变了：上面的根历史里能看到新旧两个根。${sel === 5 ? 'Frank 的真实身份承诺已不在树里，他现在无法证明成员资格。' : '其他成员仍能证明，但证明必须基于新根；合约要决定旧根还接受多久（根历史窗口）。'}公开成员列表和每次换根的事件，用户才能发现这种改动。`]);
    });
    // 预填一条历史：Frank 已在第 1 轮领过
    spent.set(nul(members[5].secret, scopes[0][0]), { scope: scopes[0][0] });
    addLog('ok', `通过：空投第 1 轮，nullifier ${short(nul(members[5].secret, scopes[0][0]))}… 记为已用（预填：有人已领过）`);
    refresh();
  }
});

})();
