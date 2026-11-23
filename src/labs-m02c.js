/* ---------- M02 补充实验：重入攻击调用栈 ---------- */
(() => {
addLab('reentrancy', {
  ch: 'm02-7', title: '重入攻击调用栈', desc: '金库里有用户存款 10 ETH，攻击者存入 1 ETH 后调用提款。选择金库版本，单步或自动执行，观察调用栈、金库余额和攻击者的记账余额如何变化。',
  mount(el, p) {
    let ver = 'bug', steps = [], idx = 0, timer = null;
    el.innerHTML = `<div class="try"><b>试一试：</b>① 选“有漏洞”，点“自动执行”：调用栈一层层加深，金库被掏空。② 切到“CEI 修复”：第二次进入时记账余额已是 0，require 失败，整笔回滚到只取走自己的 1 ETH。③ 切到“重入锁修复”：第二次进入被锁拦截。</div>
    <div class="row-btns">${segHtml('ver', [['bug', '有漏洞：先转账后记账'], ['cei', 'CEI 修复'], ['guard', '重入锁修复']], 'bug')}</div>
    <div class="row-btns"><button class="btn primary" data-auto>▶ 自动执行</button><button class="btn" data-step>单步</button><button class="btn" data-reset>重置</button></div>
    <div class="two"><div><div class="small muted" style="margin-bottom:4px">调用栈（下方为最新一层）</div><div class="log" data-stack style="min-height:180px"></div></div>
    <div><div class="stats" data-s></div></div></div>
    <div class="code-wrap"><span class="lang">SOLIDITY · 当前版本的 withdraw</span><pre data-code style="font-size:12.5px"></pre></div>
    <div class="verdict info" data-vd>点击“单步”或“自动执行”。</div>`;
    const CODE = {
      bug: 'function withdraw() external {\n  uint amt = balance[msg.sender];\n  require(amt > 0);\n  (bool ok,) = msg.sender.call{value: amt}("");  // ① 先转账：控制权交给对方\n  require(ok);\n  balance[msg.sender] = 0;                         // ② 后记账：太晚了\n}',
      cei: 'function withdraw() external {\n  uint amt = balance[msg.sender];\n  require(amt > 0);                                // Checks\n  balance[msg.sender] = 0;                         // Effects：先记账\n  (bool ok,) = msg.sender.call{value: amt}("");  // Interactions：再转账\n  require(ok);\n}',
      guard: 'bool locked;\nmodifier nonReentrant() { require(!locked, "reentrant"); locked = true; _; locked = false; }\n\nfunction withdraw() external nonReentrant {\n  uint amt = balance[msg.sender];\n  require(amt > 0);\n  (bool ok,) = msg.sender.call{value: amt}("");\n  require(ok);\n  balance[msg.sender] = 0;\n}'
    };
    // build the full trace of frames for the chosen version
    const build = () => {
      const out = []; let vault = 11, book = 1, atk = 0, depth = 0, locked = false;
      const snap = (t, cls) => out.push({ t, cls, vault, book, atk, depth });
      snap('攻击合约调用 Vault.withdraw()', 'info');
      while (true) {
        depth++;
        if (ver === 'guard' && locked) { snap(`  `.repeat(depth) + `第 ${depth} 层 withdraw：require(!locked) 失败 → revert`, 'ok'); snap('内层回滚被攻击合约忽略，外层继续执行', 'info'); depth--; break; }
        if (ver === 'guard') locked = true;
        const amt = book;
        if (!(amt > 0)) { snap(`  `.repeat(depth) + `第 ${depth} 层 withdraw：记账余额 = 0，require(amt > 0) 失败 → revert`, 'ok'); snap('内层回滚被攻击合约忽略，外层继续执行', 'info'); depth--; break; }
        if (vault < amt) { snap(`  `.repeat(depth) + `第 ${depth} 层：金库只剩 ${vault} ETH，不够转 ${amt} ETH → 攻击者停止重入`, 'warn'); depth--; break; }
        if (ver === 'cei') { book = 0; snap(`  `.repeat(depth) + `第 ${depth} 层：先把 balance[攻击者] 置 0`, 'ok'); }
        vault -= amt; atk += amt;
        snap(`  `.repeat(depth) + `第 ${depth} 层：call 转出 ${amt} ETH → 触发攻击合约 receive()`, depth > 1 ? 'risk' : '');
        snap(`  `.repeat(depth) + `receive() 里再次调用 withdraw()`, depth > 1 || ver === 'bug' ? 'risk' : 'warn');
        if (depth > 20) break;
      }
      // unwind: remaining frames set balance = 0
      while (depth > 0) { if (ver !== 'cei') book = 0; snap(`  `.repeat(depth) + `第 ${depth} 层返回：执行 balance[攻击者] = 0`, ''); depth--; }
      if (ver === 'guard') locked = false;
      snap(`结束：攻击者共取走 ${atk} ETH（其中 ${Math.max(0, atk - 1)} ETH 属于其他用户）`, atk > 1 ? 'risk' : 'ok');
      return out;
    };
    const draw = () => {
      const cur = steps[Math.min(idx, steps.length) - 1] || { vault: 11, book: 1, atk: 0, depth: 0 };
      $('[data-stack]', el).innerHTML = steps.slice(0, idx).map(s => `<div class="${s.cls}">${esc(s.t)}</div>`).join('') || '<div class="muted">尚未开始</div>';
      const st = $('[data-stack]', el); st.scrollTop = st.scrollHeight;
      const loss = Math.max(0, cur.atk - 1);
      $('[data-s]', el).innerHTML = stat('金库 ETH 余额', cur.vault + ' ETH', cur.vault < 10 ? 'risk' : 'ok') + stat('攻击者已取走', cur.atk + ' ETH', loss ? 'risk' : '') + stat('balance[攻击者]（记账）', cur.book + ' ETH') + stat('当前调用深度', cur.depth) + stat('其他用户损失', loss + ' ETH', loss ? 'risk' : 'ok');
      const vd = $('[data-vd]', el);
      if (idx >= steps.length && steps.length) {
        vd.className = 'verdict ' + (loss ? 'risk' : 'ok');
        vd.textContent = loss ? `金库被掏空：转账发生在记账之前，每次重入时 balance 仍是 1 ETH。攻击者拿走了其他用户 ${loss} ETH。` : ver === 'cei' ? 'CEI 修复有效：第二次进入时记账余额已经是 0，攻击者只能取回自己的 1 ETH。' : '重入锁有效：第二次进入时 locked = true，调用被拒绝。攻击者只能取回自己的 1 ETH。';
      } else if (idx) { vd.className = 'verdict info'; vd.textContent = `执行中：第 ${idx} / ${steps.length} 步。`; }
    };
    const reset = () => { clearInterval(timer); timer = null; $('[data-auto]', el).textContent = '▶ 自动执行'; steps = build(); idx = 0; $('[data-code]', el).textContent = CODE[ver]; $('[data-vd]', el).className = 'verdict info'; $('[data-vd]', el).textContent = '点击“单步”或“自动执行”。'; draw(); };
    const step = () => { if (idx < steps.length) { idx++; draw(); } if (idx >= steps.length && timer) { clearInterval(timer); timer = null; $('[data-auto]', el).textContent = '▶ 自动执行'; } };
    seg(el, 'ver', v => { ver = v; reset(); });
    $('[data-step]', el).addEventListener('click', step);
    $('[data-reset]', el).addEventListener('click', reset);
    $('[data-auto]', el).addEventListener('click', e => {
      if (timer) { clearInterval(timer); timer = null; e.target.textContent = '▶ 自动执行'; return; }
      if (idx >= steps.length) reset();
      e.target.textContent = '⏸ 暂停';
      timer = setInterval(() => { if (!el.isConnected) { clearInterval(timer); return; } step(); }, 450);
    });
    reset();
  }
});
})();
