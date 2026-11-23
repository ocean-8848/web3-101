/* ---------- Labs M00: hashplay, sigtoy ---------- */
(() => {

addLab('hashplay', {
  ch: 'm00-2', title: '哈希游乐场：雪崩效应与工作量证明', desc: '两段只差一个字符的文字，SHA-256 结果有一半左右的比特不同。再试着找出以 N 个 0 开头的哈希，感受“只能靠穷举”。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 看预填的两句话：只差一个字母，哈希却几乎完全不同，不同比特约 50%。② 在任一输入框里加一个空格或改一个标点，观察百分比始终在 50% 附近。③ 把滑块调到 1、2、3、4，点击“开始寻找”，记录尝试次数：每多一个 0，平均次数约 ×16。</div>
    <div class="two">
      <label class="small" for="${p}-a" style="display:grid;gap:4px"><span class="muted">输入 A</span><input type="text" id="${p}-a" value="Alice pays Bob 10 ETH"></label>
      <label class="small" for="${p}-b" style="display:grid;gap:4px"><span class="muted">输入 B（预填：只改了一个字符）</span><input type="text" id="${p}-b" value="Alice pays Bob 19 ETH"></label>
    </div>
    <div class="log" data-hx></div>
    <div class="stats" data-s></div>
    <div class="verdict info" data-vd></div>
    <h4 style="margin:14px 0 4px">找出以 N 个 0 开头的哈希（对输入 A 追加 nonce）</h4>
    <div class="ctrls">${rng(p, 'n', '目标：开头 0 的个数 N', 1, 4, 1, 2)}</div>
    <div class="row-btns"><button type="button" class="btn primary" data-act="mine">⛏ 开始寻找</button><button type="button" class="btn" data-act="stop">停止</button><span class="muted small" data-msg>期望尝试次数 = 16 的 N 次方。</span></div>
    <div class="stats" data-ms></div>
    <div class="log" data-mlog><div class="muted">点击“开始寻找”。计算分批进行，不会卡住页面。</div></div>`;
    const ia = $(`#${p}-a`, el), ib = $(`#${p}-b`, el);
    const bits = h => h.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('');
    function compare() {
      const ha = sha256(ia.value), hb = sha256(ib.value);
      const ba = bits(ha), bb = bits(hb);
      let diff = 0; for (let i = 0; i < 256; i++) if (ba[i] !== bb[i]) diff++;
      let hexDiff = 0;
      const mark = (h, o) => h.split('').map((c, i) => { if (c !== o[i]) { hexDiff++; return `<span style="background:var(--risk-soft);color:var(--risk);font-weight:700">${c}</span>`; } return c; }).join('');
      const ma = mark(ha, hb); const mb = mark(hb, ha); hexDiff /= 2;
      $('[data-hx]', el).innerHTML = `<div><b>SHA-256(A)</b> = ${ma}</div><div><b>SHA-256(B)</b> = ${mb}</div><div class="muted">红色 = 两个哈希在该位置的十六进制字符不同。</div>`;
      const same = ia.value === ib.value;
      $('[data-s]', el).innerHTML = stat('输入相差字符数', (() => { const L = Math.max(ia.value.length, ib.value.length); let d = 0; for (let i = 0; i < L; i++) if (ia.value[i] !== ib.value[i]) d++; return d; })()) +
        stat('不同比特数（共 256）', diff, same ? 'ok' : '') + stat('不同比特占比', fmtP(diff / 256, 1), same ? 'ok' : (diff / 256 > 0.4 && diff / 256 < 0.6 ? 'ok' : 'warn')) + stat('不同十六进制字符（共 64）', hexDiff);
      const vd = $('[data-vd]', el);
      if (same) { vd.className = 'verdict ok'; vd.textContent = '两个输入完全相同，所以两个哈希完全相同（确定性）。改动任意一个字符再看。'; }
      else { vd.className = 'verdict info'; vd.textContent = `输入只差一点，输出有 ${diff} 个比特（${fmtP(diff / 256, 1)}）翻转。这就是雪崩效应：你无法从“输入很像”推断“输出很像”。随机情况下期望值是 128 位（50%）。`; }
    }
    ia.addEventListener('input', compare); ib.addEventListener('input', compare);
    compare();

    let N = 2, timer = null;
    const ms = $('[data-ms]', el), mlog = $('[data-mlog]', el), msg = $('[data-msg]', el);
    const showStats = (tries, t, found) => { ms.innerHTML = stat('目标前缀', '0'.repeat(N)) + stat('期望尝试次数', Math.pow(16, N).toLocaleString()) + stat('已尝试次数', tries.toLocaleString(), found ? 'ok' : '') + stat('用时', (t / 1000).toFixed(2) + ' 秒'); };
    bindInputs(el, { n: v => v + ' 个 0' }, v => { N = v.n; msg.textContent = `期望尝试次数 = 16^${N} = ${Math.pow(16, N).toLocaleString()} 次。`; if (!timer) showStats(0, 0, false); });
    function stop(note) { if (timer) { clearTimeout(timer); timer = null; } if (note) mlog.insertAdjacentHTML('afterbegin', `<div class="muted">${note}</div>`); }
    $('[data-act="stop"]', el).addEventListener('click', () => stop('已停止。'));
    $('[data-act="mine"]', el).addEventListener('click', () => {
      stop();
      const base = ia.value, target = '0'.repeat(N), t0 = performance.now();
      let nonce = 0;
      const step = () => {
        if (!el.isConnected) { timer = null; return; }
        for (let k = 0; k < 1500; k++) {
          const h = sha256(base + nonce);
          if (h.startsWith(target)) {
            timer = null;
            const t = performance.now() - t0;
            showStats(nonce + 1, t, true);
            mlog.insertAdjacentHTML('afterbegin', `<div class="ok">N=${N}：找到 nonce = ${nonce}，尝试 ${(nonce + 1).toLocaleString()} 次（期望 ${Math.pow(16, N).toLocaleString()}）。<br>SHA-256("${esc(base)}${nonce}") = <b>${h.slice(0, N)}</b>${h.slice(N)}</div>`);
            return;
          }
          nonce++;
        }
        showStats(nonce, performance.now() - t0, false);
        timer = setTimeout(step, 0);
      };
      timer = setTimeout(step, 0);
    });
  }
});

addLab('sigtoy', {
  ch: 'm00-3', title: '玩具 RSA 签名：私钥签名、公钥验证', desc: '用极小的 RSA 密钥（n = 3233）演示签名原理：Alice 用私钥签名，Bob 用公钥验证。篡改消息、篡改签名或用错公钥，验证都会失败。仅供教学，绝不安全。',
  mount(el, p) {
    const modpow = (b, x, m) => { let r = 1n; b %= m; while (x > 0n) { if (x & 1n) r = r * b % m; b = b * b % m; x >>= 1n; } return r; };
    const KEYS = {
      alice: { name: 'Alice 的公钥', n: 3233n, e: 17n, d: 2753n, desc: 'p=61, q=53, n=3233, e=17' },
      mallory: { name: '错误的公钥（Mallory）', n: 3599n, e: 7n, desc: 'p=59, q=61, n=3599, e=7' }
    };
    const hashN = (msg, n) => BigInt('0x' + sha256(msg)) % n;
    let keySel = 'alice';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 页面已经完成一次签名，验证结果为 ✓。② 点击“篡改消息”：Bob 收到的消息被改动，验证失败。③ 点“重置”，再点“篡改签名”或“用错误公钥验证”，验证同样失败。④ 自己改 Alice 的消息，再点“Alice 重新签名”。</div>
    <div class="verdict warn">⚠ 这是玩具算法：n 只有 12 位，任何人几秒就能分解出 p 和 q，算出私钥；而且哈希被取模到 0–3232，只有 3,233 种取值，很容易撞上。真实以太坊使用 ECDSA（secp256k1 曲线，256 位私钥）。但“私钥签名、公钥验证”的原理完全相同。</div>
    <div class="two">
      <div class="stat" style="display:grid;gap:6px">
        <div class="k"><b>Alice（签名方，持有私钥 d = 2753）</b></div>
        <label class="small muted" for="${p}-m">要签名的消息</label>
        <input type="text" id="${p}-m" value="Alice 同意支付 Bob 10 ETH">
        <div class="row-btns"><button type="button" class="btn primary" data-act="sign">✍ Alice 重新签名</button></div>
        <div class="log" data-alog></div>
      </div>
      <div class="stat" style="display:grid;gap:6px">
        <div class="k"><b>Bob（验证方，只有公钥）</b></div>
        <label class="small muted" for="${p}-rm">Bob 收到的消息</label>
        <input type="text" id="${p}-rm" value="">
        <label class="small muted" for="${p}-rs">Bob 收到的签名 s（0–3232 的整数）</label>
        <input type="text" id="${p}-rs" value="" inputmode="numeric">
        <div class="small">用于验证的公钥：</div>
        ${segHtml('key', [['alice', 'Alice 的公钥'], ['mallory', '错误的公钥']], 'alice')}
        <div class="log" data-blog></div>
      </div>
    </div>
    <div class="row-btns"><button type="button" class="btn" data-act="tmsg">篡改消息</button><button type="button" class="btn" data-act="tsig">篡改签名</button><button type="button" class="btn" data-act="wkey">用错误公钥验证</button><button type="button" class="btn" data-act="reset">重置</button></div>
    <div class="stats" data-s></div>
    <div class="verdict" data-vd></div>`;
    const im = $(`#${p}-m`, el), rm = $(`#${p}-rm`, el), rs = $(`#${p}-rs`, el);
    const keySeg = seg(el, 'key', v => { keySel = v; verify(); });
    const setKey = v => { const b = $(`[data-seg="key"] button[data-v="${v}"]`, el); if (b) b.click(); };
    let lastSig = 0n;
    function sign() {
      const k = KEYS.alice, h = hashN(im.value, k.n), s = modpow(h, k.d, k.n);
      lastSig = s;
      $('[data-alog]', el).innerHTML = `<div>① h = SHA-256(消息) mod 3233</div><div>&nbsp;&nbsp;= <b>${h}</b></div><div>② s = h<sup>d</sup> mod n = ${h}<sup>2753</sup> mod 3233</div><div>&nbsp;&nbsp;= <b>${s}</b></div><div class="muted">③ 发送（消息, s）给 Bob</div>`;
      rm.value = im.value; rs.value = String(s);
      verify();
    }
    function verify() {
      const k = KEYS[keySel];
      let s; try { s = BigInt(rs.value.trim() || 'x'); } catch (e) { s = null; }
      const blog = $('[data-blog]', el), vd = $('[data-vd]', el);
      if (s === null || s < 0n) { blog.innerHTML = '<div class="risk">签名必须是非负整数。</div>'; vd.className = 'verdict risk'; vd.textContent = '✗ 签名格式错误，验证失败。'; $('[data-s]', el).innerHTML = ''; return; }
      const h2 = hashN(rm.value, k.n), rec = modpow(s, k.e, k.n), ok = rec === h2;
      blog.innerHTML = `<div class="muted">公钥：${k.desc}</div><div>① h′ = SHA-256(收到的消息) mod ${k.n} = <b>${h2}</b></div><div>② s<sup>e</sup> mod n = ${s}<sup>${k.e}</sup> mod ${k.n} = <b>${rec}</b></div><div class="${ok ? 'ok' : 'risk'}">③ ${rec} ${ok ? '=' : '≠'} ${h2} → ${ok ? '✓ 签名有效' : '✗ 签名无效'}</div>`;
      $('[data-s]', el).innerHTML = stat('消息与原文一致', rm.value === im.value ? '是' : '否（被改动）', rm.value === im.value ? 'ok' : 'risk') +
        stat('签名与原签名一致', s === lastSig ? '是' : '否（被改动）', s === lastSig ? 'ok' : 'risk') + stat('验证用的公钥', k.name, keySel === 'alice' ? 'ok' : 'risk') + stat('验证结果', ok ? '✓ 有效' : '✗ 无效', ok ? 'ok' : 'risk');
      if (ok && (rm.value !== im.value || s !== lastSig || keySel !== 'alice')) { vd.className = 'verdict warn'; vd.textContent = '验证意外通过：这是玩具参数的碰撞（哈希只有 3,233 种取值）。真实的 256 位哈希和曲线上，这种情况在计算上不可能发生。'; }
      else if (ok) { vd.className = 'verdict ok'; vd.textContent = '✓ 验证通过。Bob 确认三件事：消息确实来自 Alice 私钥的持有者（身份）；消息没有被改过（完整性）；Alice 事后无法否认签过它（不可抵赖）。'; }
      else {
        vd.className = 'verdict risk';
        const why = keySel !== 'alice' ? '用了错误的公钥：只有与签名私钥配对的公钥才能验证通过。' : rm.value !== im.value ? '消息被改动：哈希变了，签名对应的是旧哈希。' : '签名被改动：用公钥还原出的值不再等于消息哈希。';
        vd.textContent = '✗ 验证失败。原因：' + why;
      }
    }
    rm.addEventListener('input', verify); rs.addEventListener('input', verify);
    $('[data-act="sign"]', el).addEventListener('click', () => { setKey('alice'); sign(); });
    $('[data-act="tmsg"]', el).addEventListener('click', () => { rm.value = rm.value.replace('10', '100') === rm.value ? rm.value + '!' : rm.value.replace('10', '100'); verify(); });
    $('[data-act="tsig"]', el).addEventListener('click', () => { let s; try { s = BigInt(rs.value.trim()); } catch (e) { s = lastSig; } rs.value = String((s + 1n) % 3233n); verify(); });
    $('[data-act="wkey"]', el).addEventListener('click', () => setKey('mallory'));
    $('[data-act="reset"]', el).addEventListener('click', () => { keySel = 'alice'; setKey('alice'); sign(); });
    void keySeg;
    sign();
  }
});

})();
