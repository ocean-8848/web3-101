/* ---------- Labs M08: hdpath, nonce ---------- */
(() => {

addLab('hdpath', {
  ch: 'm03-2', title: 'HD 派生路径浏览器', desc: '选择币种、账户、找零链和地址序号，逐层读懂 m/44′/coin′/account′/change/index，并体会 xpub 能做什么、不能做什么。',
  mount(el, p) {
    const COINS = {
      '0': { name: 'BTC', full: '比特币', note: 'BIP-44 传统地址；新系统更常用 BIP-84（m/84′/0′/…，bc1q 开头）。' },
      '60': { name: 'ETH', full: '以太坊', note: 'MetaMask 默认变 index；所有 EVM 链（BSC、Polygon、Arbitrum…）通常复用 coin_type 60。' },
      '195': { name: 'TRON', full: '波场', note: '与以太坊同用 secp256k1，地址编码为 Base58Check，以 T 开头。' },
      '501': { name: 'SOL', full: 'Solana', note: 'Solana 用 Ed25519（SLIP-0010），真实钱包只用硬化派生，常见路径 m/44′/501′/account′/0′。本实验为对照仍显示 5 层结构。' }
    };
    let coin = '60';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 选 ETH，把 index 从 0 拖到 5，看地址如何变化而路径只改最后一位。② 切换到 BTC，把 change 改成 1，读“找零链”的解释。③ 打开“只持有 xpub 的服务器”，看哪些层变成“可派生”、哪些操作被禁止。④ 读底部风险区：为什么最后两层不能随便泄露子私钥。</div>
    <div class="row-btns">${segHtml('coin', [['0', 'BTC 0'], ['60', 'ETH 60'], ['195', 'TRON 195'], ['501', 'SOL 501']], '60')}
      <label class="small" for="${p}-xpub" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="${p}-xpub" data-k="xpub"> 只持有 xpub 的服务器</label></div>
    <div class="ctrls">${rng(p, 'acct', 'account（账户，硬化）', 0, 9, 1, 0)}${rng(p, 'chg', 'change（0 收款 / 1 找零）', 0, 1, 1, 0)}${rng(p, 'idx', 'address_index（地址序号）', 0, 99, 1, 0)}</div>
    <div class="stats" data-s></div>
    <div class="table-wrap" data-layers></div>
    <div class="two"><div><div class="small muted" style="margin:6px 0">该账户 / 找零链下前 5 个地址（演示）</div><div class="log" data-list></div></div>
    <div><div class="small muted" style="margin:6px 0">服务器能力</div><div class="log" data-cap></div></div></div>
    <div class="verdict" data-vd></div>
    <div class="call risk" style="margin-top:10px"><span class="tag">风险</span><p><strong>非硬化 + xpub + 子私钥泄露 → 父私钥可被推出。</strong>普通派生时，子私钥 = 父私钥 + I<sub>L</sub>，而 I<sub>L</sub> = HMAC-SHA512(父链码, 父公钥 ‖ index) 只依赖 xpub 里的公开信息。攻击者有 xpub 又拿到任意一个子私钥，计算 父私钥 = 子私钥 − I<sub>L</sub>（mod n），就能派生出该链下所有地址的私钥。硬化层（带 ′）的派生输入是父私钥，这条推导链在那里被切断。</p></div>`;
    const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const enc = (hex, cs, n) => { let s = ''; for (let i = 0; i < n; i++) { const b = parseInt(hex.substr((i * 2) % 62, 2), 16) + i * 7; s += cs[b % cs.length]; } return s; };
    const demoAddr = (c, path) => {
      const h = sha256('demo-seed-演示种子|' + path) + sha256(path + '|2');
      if (c === '60') return '0x' + h.slice(0, 40);
      if (c === '0') return '1' + enc(h, B58, 33);
      if (c === '195') return 'T' + enc(h, B58, 33);
      return enc(h, B58, 44);
    };
    const pathOf = (c, a, ch, i) => `m/44′/${c}′/${a}′/${ch}/${i}`;
    let V;
    const draw = v => {
      v = v || V.read();
      const C = COINS[coin], path = pathOf(coin, v.acct, v.chg, v.idx);
      $('[data-s]', el).innerHTML = stat('完整路径', `<span class="mono" style="font-size:15px">${path}</span>`) +
        stat('演示地址（演示用，非真实派生算法）', `<span class="mono" style="font-size:12px;overflow-wrap:anywhere">${demoAddr(coin, path)}</span>`, 'info') +
        stat('币种', `${C.name} · ${C.full}`);
      const rows = [
        ['m', '—', '主密钥', '由种子经 HMAC-SHA512("Bitcoin seed") 得到主私钥和链码', 'risk', '离线保管'],
        ['purpose', '44′', '是', '固定 44，表示遵循 BIP-44 五层结构', 'risk', '需要私钥'],
        ['coin_type', coin + '′', '是', `SLIP-44 编号：${C.name} = ${coin}。不同币种互相隔离`, 'risk', '需要私钥'],
        ['account', v.acct + '′', '是', `第 ${v.acct} 个账户。企业可按业务线、客户或冷热分账户。xpub 通常从这一层导出`, 'warn', v.xpub ? 'xpub 在这一层' : '需要私钥'],
        ['change', String(v.chg), '否', v.chg ? '1 = 内部链（找零地址），比特币把找零发到这里' : '0 = 外部链（收款地址），给用户展示的地址都在这里', 'ok', v.xpub ? '可用 xpub 派生' : '可派生'],
        ['address_index', String(v.idx), '否', `第 ${v.idx} 个地址，从 0 递增。交易所给每个用户分配一个 index`, 'ok', v.xpub ? '可用 xpub 派生' : '可派生']
      ];
      $('[data-layers]', el).innerHTML = `<table><thead><tr><th>层</th><th>值</th><th>硬化</th><th>含义</th><th>${v.xpub ? 'xpub 服务器' : '持有种子时'}</th></tr></thead><tbody>${rows.map(r => `<tr><td class="mono">${r[0]}</td><td class="mono"><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td><td><span style="color:var(--${v.xpub ? r[4] : 'ok'})">${v.xpub ? (r[4] === 'ok' ? '✓ ' : r[4] === 'warn' ? '◎ ' : '✗ ') : '✓ '}${r[5]}</span></td></tr>`).join('')}</tbody></table>`;
      $('[data-list]', el).innerHTML = [0, 1, 2, 3, 4].map(i => { const pp = pathOf(coin, v.acct, v.chg, i); return `<div class="${i === v.idx ? 'info' : ''}">${pp}  ${demoAddr(coin, pp)}</div>`; }).join('') + '<div class="warn">演示地址 = sha256(示例种子 + 路径) 截取，仅用于观察“路径变 → 地址变”。真实地址必须由 BIP-32 + 曲线运算得出。</div>';
      $('[data-cap]', el).innerHTML = v.xpub
        ? ['<div class="ok">✓ 派生 change/index 下任意地址（普通派生）</div>', '<div class="ok">✓ 监听充值、展示收款地址</div>', '<div class="risk">✗ 不能签名、不能转账（没有私钥）</div>', '<div class="risk">✗ 不能派生其他 account′ 或 coin_type′（硬化层需要父私钥）</div>', '<div class="warn">◎ 泄露 xpub = 泄露该账户全部地址与余额（隐私）</div>'].join('')
        : ['<div class="ok">✓ 派生任意路径的私钥和地址</div>', '<div class="ok">✓ 签名任意地址的交易</div>', '<div class="risk">✗ 这台机器被攻破 = 整棵树所有资金失守</div>', '<div class="warn">◎ 种子只应存在于离线环境、HSM 或 MPC 分片中</div>'].join('');
      const vd = $('[data-vd]', el);
      if (v.xpub) { vd.className = 'verdict ok'; vd.textContent = `这台服务器只有 m/44′/${coin}′/${v.acct}′ 的 xpub：它能为用户生成 ${path} 这样的地址，但无法动用任何资金。签名交给隔离的签名服务。`; }
      else { vd.className = 'verdict warn'; vd.textContent = `持有种子的机器能算出 ${path} 的私钥。${C.note}在线服务不应持有种子，打开上方开关看推荐架构。`; }
    };
    seg(el, 'coin', c => { coin = c; draw(); });
    V = bindInputs(el, { acct: x => x + '′', chg: x => x ? '1 找零' : '0 收款', idx: x => x }, draw);
  }
});

addLab('nonce', {
  ch: 'm03-6', title: 'Nonce 卡单模拟器', desc: '一个热钱包地址连续发出提币。制造低费用卡单和 nonce 空洞，观察后续交易如何被阻塞，再用加速、取消、填洞把队列疏通。',
  mount(el, p) {
    let chain = 42, next = 45, seq = 0;
    let pool = [], done = [], logs = [];
    const add = (nonce, amt, fee, kind) => pool.push({ id: ++seq, nonce, amt, fee, kind: kind || 'pay', tries: 1 });
    add(42, 1.5, 32); add(43, 0.8, 10); add(44, 2.0, 32);
    const log = (cls, s) => { logs.unshift(`<div class="${cls}">${s}</div>`); logs = logs.slice(0, 40); };
    log('warn', '初始状态：nonce 43 用 10 gwei 发出，低于基础费，nonce 44 被它阻塞。');
    el.innerHTML = `<div class="try"><b>试一试：</b>① 先点“模拟出块”：只有 nonce 42 被打包，43 费用太低卡住，44 被阻塞。② 点“加速最早卡单”，再出块，看 43、44 一起上链。③ 点“制造空洞”再“发起提币”，出块后观察新交易全部被阻塞。④ 点“自动填洞”修复。⑤ 拖动基础费，看哪些交易变成“费用过低”。</div>
    <div class="ctrls">${rng(p, 'base', '当前网络基础费 (gwei)', 5, 60, 1, 20)}</div>
    <div class="row-btns">
      <button class="btn primary" data-a="send">发起一笔提币</button>
      <button class="btn" data-a="low">以过低费用发出</button>
      <button class="btn" data-a="mine">⛏ 模拟出块</button>
      <button class="btn" data-a="speed">加速最早卡单</button>
      <button class="btn" data-a="cancel">取消最早卡单</button>
      <button class="btn" data-a="gap">制造空洞</button>
      <button class="btn" data-a="fill">自动填洞</button>
    </div>
    <div class="stats" data-s></div>
    <div class="table-wrap" data-pool></div>
    <div class="verdict" data-vd></div>
    <div class="two"><div><div class="small muted" style="margin:6px 0">已上链（最近）</div><div class="log" data-done></div></div><div><div class="small muted" style="margin:6px 0">操作日志</div><div class="log" data-log></div></div></div>`;
    let V, base = 20;
    const market = () => Math.round((base * 1.5 + 2) * 10) / 10;
    const byNonce = n => pool.find(t => t.nonce === n);
    const analyze = () => {
      const max = Math.max(next - 1, ...pool.map(t => t.nonce));
      const info = {}; let blocked = false, firstGap = null, firstLow = null, pendingN = chain;
      for (let n = chain; n <= max; n++) {
        const t = byNonce(n);
        if (!t) { if (firstGap === null) firstGap = n; blocked = true; continue; }
        if (blocked) { info[n] = 'blocked'; continue; }
        if (t.fee < base) { info[n] = 'low'; if (firstLow === null) firstLow = n; blocked = true; pendingN = n + 1; continue; }
        info[n] = 'ready'; pendingN = n + 1;
      }
      let pend = chain; while (byNonce(pend)) pend++;
      return { info, firstGap, firstLow, pend, max };
    };
    const ST = { ready: ['可打包', 'ok'], low: ['费用过低（卡住）', 'warn'], blocked: ['被前序 nonce 阻塞', 'risk'] };
    const draw = () => {
      const A = analyze();
      const gaps = []; for (let n = chain; n < next; n++) if (!byNonce(n)) gaps.push(n);
      $('[data-s]', el).innerHTML = stat('链上已确认 nonce（latest）', chain) + stat('节点 pending nonce', A.pend, A.pend < next ? 'warn' : '') +
        stat('本地已分配到', next - 1) + stat('内存池交易', pool.length + ' 笔') + stat('空洞', gaps.length ? gaps.join(', ') : '无', gaps.length ? 'risk' : 'ok') + stat('建议费用', market() + ' gwei');
      const rows = pool.slice().sort((a, b) => a.nonce - b.nonce);
      const gapRows = gaps.map(n => ({ gap: true, nonce: n }));
      const all = rows.concat(gapRows).sort((a, b) => a.nonce - b.nonce);
      $('[data-pool]', el).innerHTML = `<table><thead><tr><th>nonce</th><th>类型</th><th>金额</th><th>maxFee</th><th>状态</th></tr></thead><tbody>${all.length ? all.map(t => t.gap
        ? `<tr style="background:var(--risk-soft)"><td class="mono"><b>${t.nonce}</b></td><td colspan="3">— 空洞：这个 nonce 没有任何交易 —</td><td style="color:var(--risk)">缺失，阻塞后续全部</td></tr>`
        : (() => { const s = ST[A.info[t.nonce]] || ST.ready; return `<tr${s[1] === 'risk' ? ' style="background:var(--risk-soft)"' : s[1] === 'warn' ? ' style="background:var(--warn-soft)"' : ''}><td class="mono"><b>${t.nonce}</b></td><td>${t.kind === 'cancel' ? '取消（0 转给自己）' : t.kind === 'fill' ? '填洞（0 转给自己）' : '提币'}${t.tries > 1 ? ' · 第 ' + t.tries + ' 版' : ''}</td><td class="mono">${t.amt} ETH</td><td class="mono">${t.fee} gwei</td><td style="color:var(--${s[1]})">${s[0]}</td></tr>`; })()).join('') : '<tr><td colspan="5" class="muted">内存池为空</td></tr>'}</tbody></table>`;
      $('[data-done]', el).innerHTML = done.slice(0, 12).map(t => `<div class="ok">nonce ${t.nonce} · ${t.kind === 'pay' ? t.amt + ' ETH' : t.kind === 'cancel' ? '已取消（0）' : '填洞（0）'} · ${t.fee} gwei</div>`).join('') || '<div class="muted">还没有新区块</div>';
      $('[data-log]', el).innerHTML = logs.join('');
      const vd = $('[data-vd]', el);
      if (A.firstGap !== null) { vd.className = 'verdict risk'; vd.textContent = `nonce ${A.firstGap} 缺失（空洞）。节点只按 nonce 连续打包，${A.firstGap} 之后的交易全部无法上链。应对：用 nonce ${A.firstGap} 发一笔 0 ETH 转给自己的“填洞交易”，或重发原交易。`; }
      else if (A.firstLow !== null) { vd.className = 'verdict warn'; vd.textContent = `nonce ${A.firstLow} 的 maxFee 低于当前基础费 ${base} gwei，卡在内存池，后面的交易都被它阻塞。应对：用同一 nonce 重新签名，maxFee 和小费都至少提高 10%（加速）；如果这笔提币已不需要，就发同 nonce 的 0 转账给自己（取消）。`; }
      else if (pool.length) { vd.className = 'verdict ok'; vd.textContent = `nonce ${chain}–${A.max} 连续且费用足够。下一个区块会全部打包。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `队列健康：链上 nonce = 本地已分配 + 1 = ${chain}。没有待处理交易。`; }
    };
    const firstStuck = () => { const A = analyze(); return A.firstLow !== null ? byNonce(A.firstLow) : null; };
    const bump = t => { const min = Math.ceil(t.fee * 1.1 * 10) / 10; return Math.max(min, market()); };
    const act = {
      send() { const amt = Math.round((0.2 + ((seq * 37) % 30) / 10) * 10) / 10; add(next, amt, market()); log('info', `分配 nonce ${next}，提币 ${amt} ETH，maxFee ${market()} gwei。`); next++; },
      low() { const f = Math.max(1, Math.round(base * 0.5)); add(next, 1.0, f); log('warn', `nonce ${next} 只给了 ${f} gwei（低于基础费 ${base}），它会卡住。`); next++; },
      mine() {
        let n = 0;
        while (true) { const t = byNonce(chain); if (!t || t.fee < base) break; pool = pool.filter(x => x !== t); done.unshift(t); chain++; n++; }
        log(n ? 'ok' : 'warn', n ? `新区块：打包 ${n} 笔，链上 nonce 前进到 ${chain}。` : `新区块：没有打包任何交易。nonce ${chain} ${byNonce(chain) ? '费用不足' : '缺失'}。`);
      },
      speed() { const t = firstStuck(); if (!t) { log('muted', '没有因费用过低而卡住的交易。'); return; } const nf = bump(t); log('info', `加速 nonce ${t.nonce}：${t.fee} → ${nf} gwei（≥ 原费用 ×1.1 且不低于建议费用），金额与收款人不变，重新签名替换。`); t.fee = nf; t.tries++; },
      cancel() { const t = firstStuck(); if (!t) { log('muted', '没有可取消的卡单。'); return; } const nf = bump(t); log('info', `取消 nonce ${t.nonce}：替换为 0 ETH 转给自己，费用 ${t.fee} → ${nf} gwei。原提币需要重新排队。`); t.fee = nf; t.amt = 0; t.kind = 'cancel'; t.tries++; },
      gap() { log('risk', `nonce ${next} 已分配但签名失败、没有发出：形成空洞。`); next++; },
      fill() { let k = 0; for (let n = chain; n < next; n++) if (!byNonce(n)) { add(n, 0, market(), 'fill'); k++; } log(k ? 'ok' : 'muted', k ? `填补 ${k} 个空洞：每个缺失 nonce 发一笔 0 ETH 给自己。` : '没有空洞。'); }
    };
    $$('[data-a]', el).forEach(b => b.addEventListener('click', () => { act[b.dataset.a](); draw(); }));
    V = bindInputs(el, { base: x => x + ' gwei' }, v => { base = v.base; draw(); });
  }
});

})();
