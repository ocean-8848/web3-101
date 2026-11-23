/* ---------- Labs M02a: erc20 授权模型 ---------- */
(() => {
addLab('erc20', {
  ch: 'm02-5', title: 'ERC-20 授权与钓鱼模拟', desc: 'Alice 持有 1,000 USDC。她给 DEX 授权，DEX 用 transferFrom 扣款；她又误签了攻击者的授权。观察余额、allowance 矩阵、事件日志和 revert 原因。',
  mount(el, p) {
    const NAMES = { alice: 'Alice', dex: 'DEX 合约', atk: '攻击者合约' };
    const ADDR = { alice: '0xA11c…e001', dex: '0xDE0…5a02', atk: '0xBAD…f003' };
    const MAX = Infinity; // 代表 type(uint256).max
    let bal, alw, logs, stolen;
    const reset = () => {
      bal = { alice: 1000, dex: 0, atk: 0 };
      alw = { alice: { dex: 0, atk: 0 }, dex: { alice: 0, atk: 0 }, atk: { alice: 0, dex: 0 } };
      logs = []; stolen = 0;
      approve('alice', 'dex', 300, true);
    };
    const fmtA = v => v === MAX ? 'MAX（2²⁵⁶−1）' : fmtN(v, 2);
    const raw = v => v === MAX ? '115792…639935' : String(Math.round(v * 1e6));
    const log = (cls, s) => { logs.unshift({ cls, s }); if (logs.length > 40) logs.pop(); };
    function approve(owner, spender, v, quiet) {
      alw[owner][spender] = v;
      log(quiet ? 'info' : 'ok', `→ ${NAMES[owner]} 调用 USDC.approve(${ADDR[spender]}, ${raw(v)})\n  ✓ 成功  event Approval(owner=${ADDR[owner]}, spender=${ADDR[spender]}, value=${fmtA(v)})`);
    }
    function transferFrom(spender, from, to, v) {
      const a = alw[from][spender];
      const head = `→ ${NAMES[spender]} 调用 USDC.transferFrom(${ADDR[from]}, ${ADDR[to]}, ${raw(v)})`;
      if (!(v > 0)) { log('warn', head + '\n  ✗ 金额必须大于 0（本模拟器的输入校验）'); return false; }
      if (a < v) { log('risk', `${head}\n  ✗ REVERT ERC20InsufficientAllowance(spender=${ADDR[spender]}, allowance=${raw(a)}, needed=${raw(v)})\n  状态全部回滚。Gas 照扣。`); return false; }
      if (bal[from] < v) { log('risk', `${head}\n  ✗ REVERT ERC20InsufficientBalance(sender=${ADDR[from]}, balance=${raw(bal[from])}, needed=${raw(v)})\n  状态全部回滚。Gas 照扣。`); return false; }
      if (a !== MAX) alw[from][spender] = a - v;
      bal[from] -= v; bal[to] += v;
      log('ok', `${head}\n  ✓ 成功  event Transfer(from=${ADDR[from]}, to=${ADDR[to]}, value=${fmtN(v, 2)})\n  allowance 变为 ${fmtA(alw[from][spender])}${a === MAX ? '（无限授权不递减）' : ''}`);
      return true;
    }
    el.innerHTML = `<div class="try"><b>试一试：</b>① 让 DEX transferFrom 500：超过授权 300，交易 revert。② 勾选“无限”，再 approve DEX，然后 transferFrom 500：成功，allowance 仍是 MAX。③ 点“Alice 误签攻击者授权”，再点“攻击者转走全部”：余额清零。④ 重置后先误签，再点“撤销攻击者授权”，然后让攻击者转账：revert。</div>
    <div class="ctrls">
      <label class="rng" for="${p}-amt"><span>approve 金额（USDC）</span><input type="number" id="${p}-amt" min="0" step="1" value="500"></label>
      <label class="rng" for="${p}-inf"><span>无限授权（type(uint256).max）</span><input type="checkbox" id="${p}-inf"></label>
      <label class="rng" for="${p}-tf"><span>transferFrom 金额（USDC）</span><input type="number" id="${p}-tf" min="0" step="1" value="500"></label>
    </div>
    <div class="row-btns">
      <button class="btn primary" data-act="apDex">Alice approve DEX</button>
      <button class="btn" data-act="tfDex">DEX transferFrom（Alice→DEX）</button>
      <button class="btn" data-act="apAtk">Alice 误签攻击者授权（钓鱼）</button>
      <button class="btn" data-act="tfAtk">攻击者 transferFrom 全部</button>
      <button class="btn" data-act="revDex">撤销 DEX 授权（approve 0）</button>
      <button class="btn" data-act="revAtk">撤销攻击者授权（approve 0）</button>
      <button class="btn" data-act="reset">重置</button>
    </div>
    <div class="stats" data-s></div>
    <div class="two"><div data-m></div><div><div class="small muted" style="margin-bottom:4px">调用与事件日志（最新在上）</div><div class="log" data-log style="max-height:300px"></div></div></div>
    <div class="verdict" data-vd></div>`;
    const num = id => { const v = parseFloat($(`#${p}-${id}`, el).value); return isFinite(v) && v >= 0 ? v : 0; };
    function draw() {
      $('[data-s]', el).innerHTML = Object.keys(NAMES).map(k => stat(NAMES[k] + ' 余额', fmtN(bal[k], 2) + ' USDC', k === 'alice' && bal.alice === 0 ? 'risk' : '')).join('') +
        stat('被盗金额', fmtN(stolen, 2) + ' USDC', stolen > 0 ? 'risk' : 'ok');
      const keys = Object.keys(NAMES);
      $('[data-m]', el).innerHTML = `<div class="small muted" style="margin-bottom:4px">allowance[owner][spender] 矩阵（行 = 资金主人，列 = 被授权方）</div>` +
        tbl(['owner ＼ spender', ...keys.map(k => NAMES[k])], keys.map(o => [`<b>${NAMES[o]}</b>`, ...keys.map(s => {
          if (o === s) return '<span class="muted">—</span>';
          const v = alw[o][s];
          const color = v === 0 ? 'var(--ink-2)' : s === 'atk' ? 'var(--risk)' : v === MAX ? 'var(--warn)' : 'var(--ok)';
          return `<span class="mono" style="color:${color}">${fmtA(v)}</span>`;
        })]));
      $('[data-log]', el).innerHTML = logs.map(l => `<div class="${l.cls}">${esc(l.s)}</div>`).join('');
      const vd = $('[data-vd]', el), a = alw.alice;
      if (stolen > 0 && a.atk > 0) { vd.className = 'verdict risk'; vd.textContent = `攻击者已转走 ${fmtN(stolen, 2)} USDC，而且授权还在：Alice 以后收到的 USDC 也会被转走。立刻 approve(攻击者, 0)。链上转账不可撤回。`; }
      else if (stolen > 0) { vd.className = 'verdict risk'; vd.textContent = `攻击者已转走 ${fmtN(stolen, 2)} USDC。撤销授权只能阻止下一次，不能追回已转走的钱。教训：签名前看清 spender 地址和金额。`; }
      else if (a.atk > 0) { vd.className = 'verdict risk'; vd.textContent = `危险：攻击者持有 ${fmtA(a.atk)} 的授权。他不需要 Alice 的私钥，随时可以调用 transferFrom。现在撤销还来得及。`; }
      else if (a.dex === MAX) { vd.className = 'verdict warn'; vd.textContent = '无限授权：省去以后每次 approve 的 Gas，但 DEX 合约一旦有漏洞或被升级成恶意版本，Alice 的全部 USDC 都暴露。按需授权更安全。'; }
      else if (a.dex > 0) { vd.className = 'verdict ok'; vd.textContent = `DEX 只能动用 ${fmtA(a.dex)} USDC。授权额度就是风险上限。用完后额度自动递减。`; }
      else { vd.className = 'verdict ok'; vd.textContent = 'Alice 没有给任何合约授权。没有授权，任何人都不能用 transferFrom 动她的余额。'; }
    }
    const act = {
      apDex: () => approve('alice', 'dex', $(`#${p}-inf`, el).checked ? MAX : num('amt')),
      tfDex: () => transferFrom('dex', 'alice', 'dex', num('tf')),
      apAtk: () => { log('warn', '⚠ Alice 在钓鱼网站点击“领取空投”，钱包弹窗里的真实内容是：approve(攻击者, MAX)'); approve('alice', 'atk', MAX); },
      tfAtk: () => { const v = bal.alice; if (v === 0) { log('warn', '→ 攻击者扫描到 Alice 余额为 0，等待她下次入账。'); return; } if (transferFrom('atk', 'alice', 'atk', v)) stolen += v; },
      revDex: () => approve('alice', 'dex', 0),
      revAtk: () => approve('alice', 'atk', 0),
      reset
    };
    $$('[data-act]', el).forEach(b => b.addEventListener('click', () => { act[b.dataset.act](); draw(); }));
    reset(); draw();
  }
});
})();
