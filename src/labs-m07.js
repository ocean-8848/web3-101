/* ---------- Labs M03: units, eip712 ---------- */
(() => {

addLab('units', {
  ch: 'm07-4', title: '单位与精度实验室', desc: '输入一个人类可读金额，选择代币精度，看它在链上变成什么整数；再看 JS number 在哪里算错钱，以及用错 decimals 会差多少倍。',
  mount(el, p) {
    const TOK = { eth: ['ETH', 18], usdc: ['USDC', 6], wbtc: ['WBTC', 8], custom: ['自定义', null] };
    let tok = 'usdc';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 保持 1234.567891 + USDC，记下链上整数。② 切到 ETH，看 gwei 一栏，并对比“number 换算”是否还相等。③ 在金额末尾再加两位数字，观察截断提示。④ 看最下方：把 USDC 当 18 位解析，差了多少倍。</div>
    <div class="ctrls">
      <label class="rng" for="${p}-amt"><span>人类可读金额</span><input type="text" id="${p}-amt" data-k="amt" value="1234.567891" inputmode="decimal" autocomplete="off" spellcheck="false"></label>
      ${rng(p, 'dec', '自定义 decimals（选“自定义”时生效）', 0, 30, 1, 12)}
    </div>
    <div class="row-btns">${segHtml('tok', [['eth', 'ETH · 18'], ['usdc', 'USDC · 6'], ['wbtc', 'WBTC · 8'], ['custom', '自定义']], 'usdc')}</div>
    <div class="stats" data-s></div>
    <div class="log" data-raw></div>
    <div class="verdict" data-vd></div>
    <h4 style="margin:14px 0 6px">精度陷阱区：JS number vs bigint</h4>
    <div class="log" data-trap style="max-height:none"></div>
    <h4 style="margin:14px 0 6px">错误 decimals 演示：把 USDC 按 18 位解析</h4>
    <div class="stats" data-wrong></div>
    <div class="verdict risk" data-vd2></div>`;

    const groups = n => n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // BigInt 版 parseUnits：多余小数位直接截断（向下），并报告是否截断
    function parse(str, d) {
      const s = String(str).replace(/[,\s_]/g, '');
      if (!/^\d*\.?\d*$/.test(s) || s === '' || s === '.') return { err: '格式错误：只允许数字和一个小数点。' };
      let [i, f = ''] = s.split('.');
      i = i || '0';
      const cut = f.length > d;
      const dropped = cut ? f.slice(d) : '';
      f = f.slice(0, d).padEnd(d, '0');
      return { raw: BigInt(i + f), cut, dropped };
    }
    // BigInt 版 formatUnits：精确，不经过浮点
    function format(raw, d) {
      const neg = raw < 0n; let v = neg ? -raw : raw;
      const s = v.toString().padStart(d + 1, '0');
      const ip = s.slice(0, s.length - d), fp = d ? s.slice(s.length - d).replace(/0+$/, '') : '';
      return (neg ? '-' : '') + ip + (fp ? '.' + fp : '');
    }
    const fmtHuman = (raw, d) => { const s = format(raw, d); const [a, b] = s.split('.'); return groups(a) + (b ? '.' + b : ''); };

    const segT = seg(el, 'tok', v => { tok = v; B.upd(); });
    const B = bindInputs(el, { dec: v => v + ' 位' }, v => {
      const d = tok === 'custom' ? v.dec : TOK[tok][1];
      const sym = TOK[tok][0];
      const r = parse(v.amt, d);
      const vd = $('[data-vd]', el);
      if (r.err) {
        $('[data-s]', el).innerHTML = stat('链上整数', '—', 'risk');
        $('[data-raw]', el).innerHTML = '';
        vd.className = 'verdict risk'; vd.textContent = r.err;
        $('[data-wrong]', el).innerHTML = ''; $('[data-vd2]', el).textContent = '先输入合法金额。';
        return;
      }
      const raw = r.raw;
      const back = format(raw, d);
      // number 换算：很多新手会这样写
      const numWay = Number(String(v.amt).replace(/[,\s_]/g, '')) * Math.pow(10, d);
      let numStr;
      try { numStr = BigInt(Math.floor(numWay)).toString(); } catch (e) { numStr = String(numWay); }
      const numOk = numStr === raw.toString();
      $('[data-s]', el).innerHTML =
        stat('代币 / decimals', sym + ' · ' + d) +
        stat('链上整数位数', raw.toString().length + ' 位', raw > 9007199254740991n ? 'warn' : '') +
        stat('超过 2^53？', raw > 9007199254740991n ? '是：number 已不精确' : '否', raw > 9007199254740991n ? 'warn' : 'ok') +
        stat('number 换算是否一致', numOk ? '一致（这次运气好）' : '不一致', numOk ? 'ok' : 'risk');
      $('[data-raw]', el).innerHTML =
        `<div>parseUnits("${esc(v.amt)}", ${d})</div>` +
        `<div class="ok">= ${raw.toString()}n</div>` +
        `<div>十六进制：0x${raw.toString(16)}</div>` +
        `<div>formatUnits(原始值, ${d}) = "${back}"　显示：${fmtHuman(raw, d)} ${esc(sym)}</div>` +
        (tok === 'eth' ? `<div class="info">按 gwei 表示：${fmtHuman(raw / 1000000000n, 0)}${raw % 1000000000n ? '.' + (raw % 1000000000n).toString().padStart(9, '0').replace(/0+$/, '') : ''} gwei（1 gwei = 10^9 wei）</div>` : '') +
        `<div class="${numOk ? 'muted' : 'risk'}">number 写法 Math.floor(Number(输入) × 10^${d}) = ${numStr}${numOk ? '' : '　← 与 bigint 结果不同'}</div>`;
      if (r.cut) { vd.className = 'verdict warn'; vd.textContent = `输入有 ${d + r.dropped.length} 位小数，超过 ${sym} 的 ${d} 位。多出的“${r.dropped}”已被截断（向下）。生产环境应在输入框直接拒绝，而不是悄悄截断。注意：viem 的 parseUnits 会四舍五入，ethers v6 会抛错。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `精确转换：${back} ${sym} = ${raw.toString()} 个最小单位。全程只做字符串拼接和 BigInt，没有经过浮点数。`; }

      // 错误 decimals：USDC 应为 6 位，却按 18 位解析
      const r6 = parse(v.amt, 6), r18 = parse(v.amt, 18);
      const ratio = r6.raw === 0n ? null : r18.raw / r6.raw;
      $('[data-wrong]', el).innerHTML =
        stat('正确（6 位）链上整数', groups(r6.raw.toString()), 'ok') +
        stat('错误（18 位）链上整数', groups(r18.raw.toString()), 'risk') +
        stat('相差倍数', ratio === null ? '—' : '10^' + (ratio.toString().length - 1), 'risk');
      $('[data-vd2]', el).textContent = r6.raw === 0n ? '金额为 0，无法比较倍数。' :
        `合约把错误的整数当作 6 位 USDC 读取，会认为你要转 ${fmtHuman(r18.raw, 6)} USDC，而不是 ${fmtHuman(r6.raw, 6)} USDC。轻则余额不足 revert，重则授权额度被放大 10^12 倍。decimals 必须从合约读取。`;
    });

    // 精度陷阱区（固定演示）
    const a = 0.1 + 0.2, big = Number('12345678901234567890'), m = 1.1 * 3;
    const bigRaw = 1100000n * 3n; // 1.1 USDC = 1,100,000（6 位）
    $('[data-trap]', el).innerHTML =
      `<div>0.1 + 0.2 = <span class="risk">${a}</span>　（期望 0.3；=== 0.3 的结果是 ${a === 0.3}）</div>` +
      `<div>Number("12345678901234567890") = <span class="risk">${String(big)}</span>　（末尾位数丢失：超过 2^53 = 9007199254740992）</div>` +
      `<div>BigInt("12345678901234567890") = <span class="ok">12345678901234567890n</span>　（精确）</div>` +
      `<div>number：1.1 USDC × 3 = <span class="risk">${m}</span></div>` +
      `<div>bigint：1100000n × 3n = <span class="ok">${bigRaw}n</span> → formatUnits = <span class="ok">"${format(bigRaw, 6)}"</span> USDC</div>` +
      `<div>bigint 除法截断：7n / 2n = ${7n / 2n}n；-7n / 2n = ${-7n / 2n}n（向零截断）</div>` +
      `<div class="muted">(1.005).toFixed(2) = "${(1.005).toFixed(2)}"　（不是 1.01：1.005 在二进制里略小于 1.005）</div>`;
    void segT;
  }
});

addLab('eip712', {
  ch: 'm07-6', title: '签名请求翻译器', desc: '4 个预置的钱包签名请求。左边是钱包里看到的原始数据，右边翻译成人话：你在授权谁、多少、到什么时候、签名后别人能做什么，并标出红旗。',
  mount(el, p) {
    const ME = '0x9f3aB8C1d2E4F5a6B7c8D9e0F1a2B3c4D5e6c21d';
    const MAX256 = (2n ** 256n - 1n).toString();
    const MAX160 = (2n ** 160n - 1n).toString();
    const MAX48 = String(2 ** 48 - 1);
    const NOW = Math.floor(Date.now() / 1000);
    const KNOWN = { '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD': 'Uniswap Universal Router（示例）' };
    const P = {
      siwe: {
        name: 'SIWE 登录', origin: 'app.example.com', method: 'personal_sign',
        raw: `app.example.com wants you to sign in with your Ethereum account:\n${ME}\n\n登录 Example DApp。此签名不会发起交易，也不会花费 Gas。\n\nURI: https://app.example.com\nVersion: 1\nChain ID: 1\nNonce: 8f3k2LqZ9wPx1aB7\nIssued At: 2026-10-23T08:00:00.000Z\nExpiration Time: 2026-10-23T08:10:00.000Z`,
        chainId: 1, spender: null, unlimited: false, deadline: NOW + 600, zeroConsideration: false, base: 0,
        who: '没有授权任何人。只证明“你控制这个地址”。', what: '无代币授权。', until: '消息 10 分钟后过期。',
        can: '网站只能据此给你创建登录会话。它无法转走任何资产。前提是第一行的域名就是你正在访问的网站。'
      },
      permit: {
        name: 'ERC-20 Permit', origin: 'claim-usdc-airdrop.xyz', method: 'eth_signTypedData_v4',
        json: { domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
          types: { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
          primaryType: 'Permit',
          message: { owner: ME, spender: '0x7a2B9cE4d0F18a3b6C5d2e1F0a9B8c7D6e5F4a3B', value: MAX256, nonce: '0', deadline: '9999999999' } },
        chainId: 1, spender: '0x7a2B9cE4d0F18a3b6C5d2e1F0a9B8c7D6e5F4a3B', unlimited: true, deadline: 9999999999, zeroConsideration: false, base: 2,
        who: '一个未验证的陌生地址 0x7a2B…4a3B。', what: '你的全部 USDC（value = 2^256 − 1，即无限额度）。', until: 'deadline = 9999999999，即 2286 年。',
        can: '对方在 2286 年之前任何时候把这条签名提交上链，获得无限额度，然后 transferFrom 转走你现在和将来持有的全部 USDC。你的钱包里不会先出现任何交易。'
      },
      permit2: {
        name: 'Permit2 批量授权', origin: 'uniswap-rewards.app', method: 'eth_signTypedData_v4',
        json: { domain: { name: 'Permit2', chainId: 8453, verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' },
          types: { PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }],
            PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
          primaryType: 'PermitBatch',
          message: { details: [
            { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amount: MAX160, expiration: MAX48, nonce: '0' },
            { token: '0x4200000000000000000000000000000000000006', amount: MAX160, expiration: MAX48, nonce: '0' },
            { token: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', amount: '500000000000000000000', expiration: String(NOW + 30 * 86400), nonce: '0' }],
            spender: '0x5bE4F1c2D3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8', sigDeadline: String(NOW + 365 * 86400 * 10) } },
        chainId: 8453, spender: '0x5bE4F1c2D3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8', unlimited: true, deadline: 2 ** 48 - 1, zeroConsideration: false, base: 2,
        who: '一个未验证的陌生地址 0x5bE4…B7c8（不是 Uniswap 的路由合约）。', what: '一次签名同时授权 3 种代币：USDC 和 WETH 为最大额度 2^160 − 1，DAI 500 枚。', until: 'USDC、WETH 的 expiration = 2^48 − 1（约 890 万年后）；签名提交期限 10 年。',
        can: '对方提交签名后，可通过 Permit2 合约转走你已 approve 给 Permit2 的这些代币。很多用户早已对 Permit2 做过无限 approve，所以这一条签名就足以清空多个代币。'
      },
      seaport: {
        name: 'NFT 0 价挂单', origin: 'opensea-verify.io', method: 'eth_signTypedData_v4',
        json: { domain: { name: 'Seaport', version: '1.6', chainId: 1, verifyingContract: '0x0000000000000068F116a894984e2DB1123eB395' },
          types: { OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
            OfferItem: '…（itemType, token, identifierOrCriteria, startAmount, endAmount）', ConsiderationItem: '…（同上 + recipient）' },
          primaryType: 'OrderComponents',
          message: { offerer: ME, zone: '0x0000000000000000000000000000000000000000',
            offer: [{ itemType: 2, token: '0xNFT…（你的 NFT 合约，示例）', identifierOrCriteria: '1234', startAmount: '1', endAmount: '1' }],
            consideration: [{ itemType: 0, token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: '0', startAmount: '0', endAmount: '0', recipient: ME }],
            orderType: 0, startTime: String(NOW), endTime: '115792089237316195423570985008687907853269984665640564039457584007913129639935', zoneHash: '0x00…00', salt: '24446860302761739304752683030156737591518664810215442929818227897836383814680', conduitKey: '0x0000007b…（示例）', counter: '0' } },
        chainId: 1, spender: null, unlimited: false, deadline: Infinity, zeroConsideration: true, base: 2,
        who: '任何人。挂单是公开的，谁先成交谁拿走。', what: '你的 NFT #1234，对价（consideration）= 0 ETH。', until: 'endTime = 2^256 − 1，永不过期。',
        can: '任何人提交这条订单并支付 0 ETH，就能立刻拿走你的 NFT。前提是你曾对 Seaport 的 conduit 做过 setApprovalForAll（交易过 NFT 的用户几乎都做过）。'
      }
    };
    let cur = 'permit', net = '1';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 先看默认的 Permit：右侧列出了几面红旗？② 切到 SIWE 登录，对比风险等级。③ 切到 Permit2，注意 domain 的 chainId 与“钱包当前网络”不一致。④ 把网络切到 Base 8453，再看 Permit2 和 SIWE 的 chainId 红旗如何变化。</div>
    <div class="row-btns">${segHtml('pre', [['siwe', 'SIWE 登录'], ['permit', 'ERC-20 Permit'], ['permit2', 'Permit2 批量'], ['seaport', 'NFT 0 价挂单']], 'permit')}</div>
    <div class="row-btns"><span class="small muted">钱包当前网络：</span>${segHtml('net', [['1', 'Ethereum · 1'], ['8453', 'Base · 8453']], '1')}</div>
    <div class="two">
      <div><div class="small muted" style="margin-bottom:6px" data-src></div><pre class="log" data-json style="max-height:420px;margin:0"></pre></div>
      <div style="display:grid;gap:8px;align-content:start"><div class="stats" data-s></div><div data-tr style="border:1px solid var(--rule);border-radius:10px;padding:12px;background:var(--ground);display:grid;gap:6px"></div><div data-flags style="display:grid;gap:4px"></div></div>
    </div>
    <div class="verdict" data-vd></div>`;
    const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '—';
    const draw = () => {
      const x = P[cur];
      const chainMismatch = x.chainId !== +net;
      const longDl = x.deadline - NOW > 30 * 86400;
      const unknownSp = !!x.spender && !KNOWN[x.spender];
      const flags = [
        ['无限额度', x.unlimited, '额度为 2^256−1 或 2^160−1，等于“全部，现在和将来”'],
        ['未知 spender', unknownSp, x.spender ? 'spender ' + short(x.spender) + ' 不在已知合约列表中' : '本请求没有 spender 字段'],
        ['超长期限', longDl, '有效期超过 30 天（正常 Permit 通常为几分钟到几十分钟）'],
        ['对价为 0', x.zeroConsideration, '挂单要求收到的 consideration 总额为 0'],
        ['chainId 不匹配', chainMismatch, `签名的 chainId = ${x.chainId}，钱包当前网络 = ${net}`]
      ];
      const hits = flags.filter(f => f[1]).length;
      const severe = flags.slice(0, 4).filter(f => f[1]).length;
      const level = severe >= 2 || (severe >= 1 && chainMismatch) ? 3 : severe === 1 || (chainMismatch && x.base > 0) ? 2 : chainMismatch ? 2 : x.base >= 2 ? 2 : 1;
      const LV = { 1: ['低', 'ok'], 2: ['高', 'warn'], 3: ['极高', 'risk'] }[level];
      $('[data-src]', el).innerHTML = `请求来源：<span class="mono">${esc(x.origin)}</span> · 方法：<span class="mono">${x.method}</span>`;
      $('[data-json]', el).textContent = x.raw ? x.raw : JSON.stringify(x.json, null, 2);
      $('[data-s]', el).innerHTML = stat('风险等级', LV[0], LV[1]) + stat('红旗数量', hits + ' / 5', hits ? 'risk' : 'ok') + stat('签名类型', x.json ? x.json.primaryType : '文本消息');
      $('[data-tr]', el).innerHTML = `<div class="small muted">人话翻译</div>
        <div><b>授权给谁：</b>${x.who}</div><div><b>授权多少：</b>${x.what}</div><div><b>到什么时候：</b>${x.until}</div>
        <div><b>签名后别人能做什么：</b>${x.can}</div>`;
      $('[data-flags]', el).innerHTML = flags.map(([n, on, why]) => `<div class="small" style="display:flex;gap:8px;align-items:baseline;color:${on ? 'var(--risk)' : 'var(--ink-2)'}"><b style="min-width:1.2em">${on ? '⚑' : '·'}</b><span><b>${n}</b>：${on ? why : '未命中'}</span></div>`).join('');
      const vd = $('[data-vd]', el);
      if (level === 3) { vd.className = 'verdict risk'; vd.textContent = `建议：拒绝。命中 ${hits} 面红旗。来源域名 ${x.origin} 不是官方域名，请求内容远超“${cur === 'seaport' ? '验证' : '领取'}”需要的权限。签名无法撤销，签了只能祈祷。`; }
      else if (level === 2) { vd.className = 'verdict warn'; vd.textContent = chainMismatch ? '建议：先拒绝，核对后再签。签名的 chainId 与钱包当前网络不一致：要么网站配置错误，要么请求在为另一条链上的资产索要授权。' : '建议：核对 spender、额度、期限后再签。'; }
      else { vd.className = 'verdict ok'; vd.textContent = `建议：核对后签。这是登录签名，不涉及资产。只需确认第一行域名 ${x.origin} 就是你地址栏里的网站。`; }
    };
    seg(el, 'pre', v => { cur = v; draw(); });
    seg(el, 'net', v => { net = v; draw(); });
    draw();
  }
});

})();
