/* ---------- Labs M14 应用赛道（3）: bondcurve ---------- */
(() => {

addLab('bondcurve', {
  ch: 'm09-7', title: '联合曲线发币实验室', desc: '用虚拟储备的恒定乘积曲线模拟一次 pump.fun 式发币：沿曲线买入直到毕业，看价格、市值、头号持有人占比，再切换“创作者清仓”看价格冲击。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 先把“创作者首买”设为 0，把“曲线进度”拖到 100%，看毕业时的市值。② 把“创作者首买”调到 8 SOL，看他一个人持有多少比例。③ 保持进度 60%，点“创作者清仓”，看价格跌多少、散户账面亏多少。④ 把进度拖到 100% 再清仓，对比毕业前后。</div>
    <div class="ctrls">
      ${rng(p, 'creator', '创作者首买（SOL，创建时同一笔交易买入）', 0, 20, 0.5, 5)}
      ${rng(p, 'buy', '散户每笔买入（SOL）', 0.2, 5, 0.1, 1)}
      ${rng(p, 'prog', '曲线进度（已买入的真实 SOL ÷ 85）', 0, 100, 1, 60)}
      ${rng(p, 'sol', 'SOL 价格（美元，示例）', 80, 300, 5, 150)}
    </div>
    <div class="row-btns">${segHtml('sell', [['hold', '创作者持有'], ['sell', '创作者清仓']], 'hold')}</div>
    <div class="stats" data-s></div>
    <div data-ch></div>
    <div class="log" data-raw></div>
    <div class="verdict" data-vd></div>`;

    // 示例参数：来自 pump.fun 官方文档的初始值（截至 2026-11 查阅）；费率取 1%
    const VS0 = 30, VT0 = 1073000000, REAL_T0 = 793100000, SUPPLY = 1e9, FEE = 0.01, GRAD_SOL = 85;
    const K = VS0 * VT0;
    const mcapSol = (vs, vt) => vs / vt * SUPPLY;

    const sim = v => {
      let vs = VS0, vt = VT0, realT = REAL_T0, realS = 0;
      const holders = []; // 每笔买入一个持有人
      const buy = (who, sol) => {
        const net = sol * (1 - FEE);
        const room = Math.max(0, GRAD_SOL - realS);
        const used = Math.min(net, room);
        if (used <= 0) return 0;
        const nvs = vs + used, nvt = K / nvs, got = vt - nvt;
        vs = nvs; vt = nvt; realT -= got; realS += used;
        const h = holders.find(x => x.who === who);
        if (h) h.tok += got; else holders.push({ who, tok: got });
        return got;
      };
      if (v.creator > 0) buy('创作者', v.creator);
      const target = v.prog / 100 * GRAD_SOL;
      let n = 0;
      while (realS < target - 1e-9 && n < 5000) {
        const room = target - realS;
        const sol = Math.min(v.buy, room / (1 - FEE));
        buy('散户 ' + (++n), sol);
      }
      return { vs, vt, realT, realS, holders, n };
    };

    const S = seg(el, 'sell', () => B.upd());
    const B = bindInputs(el, {
      creator: x => fmtN(x, 1) + ' SOL', buy: x => fmtN(x, 1) + ' SOL', prog: x => x + '%', sol: x => '$' + x
    }, v => {
      const st = sim(v);
      const price = st.vs / st.vt;
      const grad = st.realT <= 1;
      const top = st.holders.slice().sort((a, b) => b.tok - a.tok)[0];
      const topPct = top ? top.tok / SUPPLY : 0;
      const creator = st.holders.find(h => h.who === '创作者');
      const selling = S.get() === 'sell' && creator && !grad;
      let after = null;
      if (selling) {
        const nvt = st.vt + creator.tok, nvs = K / nvt;
        const out = (st.vs - nvs) * (1 - FEE);
        after = { price: nvs / nvt, out, vs: nvs, vt: nvt, realS: st.realS - (st.vs - nvs) };
      }
      const retailTok = st.holders.filter(h => h.who !== '创作者').reduce((a, h) => a + h.tok, 0);
      const retailMark = after ? retailTok * after.price : retailTok * price;
      const retailNow = retailTok * price;

      $('[data-s]', el).innerHTML =
        stat('当前价格', fmtN(price * 1e6, 3) + ' µSOL/枚', 'info') +
        stat('市值', fmtN(mcapSol(st.vs, st.vt), 1) + ' SOL ≈ $' + fmtN(mcapSol(st.vs, st.vt) * v.sol, 0)) +
        stat('曲线已吸入真实 SOL', fmtN(st.realS, 1) + ' / ' + GRAD_SOL) +
        stat('头号持有人占总供应', (top ? esc(top.who) + ' ' : '') + fmtP(topPct, 1), topPct > 0.2 ? 'risk' : topPct > 0.08 ? 'warn' : 'ok') +
        stat('状态', grad ? '已毕业，迁移到 AMM 池' : '曲线内交易', grad ? 'ok' : '') +
        (after ? stat('清仓后价格', fmtN(after.price * 1e6, 3) + ' µSOL/枚（' + fmtP(after.price / price - 1, 1) + '）', 'risk') : '');

      // 曲线图：x = 已吸入真实 SOL，y = 市值（SOL）
      const pts = []; for (let r = 0; r <= GRAD_SOL; r += 1) { const vs = VS0 + r; pts.push([r, mcapSol(vs, K / vs)]); }
      const ymax = mcapSol(VS0 + GRAD_SOL, K / (VS0 + GRAD_SOL)) * 1.05;
      const markers = [{ x: st.realS, y: mcapSol(st.vs, st.vt), label: '现在', cls: 'dot' }];
      if (after) markers.push({ x: Math.max(0, after.realS), y: mcapSol(after.vs, after.vt), label: '清仓后', cls: 'dot', below: true });
      $('[data-ch]', el).innerHTML = lineChart({ w: 640, h: 220, xr: [0, GRAD_SOL], yr: [0, ymax], xticks: [0, 20, 40, 60, 85], yticks: [0, 100, 200, 300, 400], fy: t => t + '', label: '联合曲线：市值（SOL）随真实 SOL 吸入量上升', series: [{ pts, cls: 's1' }], markers });

      const crPct = creator ? creator.tok / SUPPLY : 0;
      $('[data-raw]', el).innerHTML =
        `虚拟储备 vS = ${fmtN(st.vs, 2)} SOL，vT = ${fmtN(st.vt / 1e6, 2)} M 枚；k = vS × vT 恒定。<br>` +
        `曲线内尚未卖出的代币：${fmtN(st.realT / 1e6, 1)} M（初始 793.1 M）。<br>` +
        (creator ? `创作者持有 ${fmtN(creator.tok / 1e6, 1)} M 枚 = ${fmtP(crPct, 1)}。<br>` : '创作者没有首买。<br>') +
        `散户 ${st.holders.length - (creator ? 1 : 0)} 个地址，合计 ${fmtN(retailTok / 1e6, 1)} M 枚，账面价值 ${fmtN(retailNow, 2)} SOL。` +
        (after ? `<br>创作者清仓：取走 ${fmtN(after.out, 2)} SOL（扣 1% 费），价格 ${fmtP(after.price / price - 1, 1)}；散户账面价值变为 ${fmtN(retailMark, 2)} SOL（${fmtP(retailNow ? retailMark / retailNow - 1 : 0, 1)}）。` : '');

      const vd = $('[data-vd]', el);
      if (after && after.price / price < 0.7) { vd.className = 'verdict risk'; vd.textContent = `危险：创作者持有 ${fmtP(crPct, 1)}，一笔清仓让价格下跌 ${fmtP(1 - after.price / price, 0)}。曲线只会按公式给卖出者付款，买入的人排在后面承担损失。买之前先看创作者钱包和头部持仓。`; }
      else if (after) { vd.className = 'verdict warn'; vd.textContent = `创作者清仓对价格的冲击为 ${fmtP(after.price / price - 1, 1)}，在这组参数下较小。头部持仓越高、曲线进度越浅，冲击越大。`; }
      else if (grad) { vd.className = 'verdict ok'; vd.textContent = '已毕业：曲线内的代币售罄，剩余代币和约 85 SOL 的真实储备被迁入 AMM 池。毕业后价格由池子里的买卖决定，创作者清仓的冲击要按池子深度重新算。'; }
      else if (topPct > 0.2) { vd.className = 'verdict risk'; vd.textContent = `头号持有人占总供应 ${fmtP(topPct, 1)}。一个地址能决定价格，这是最常见的“拉盘—出货”结构。`; }
      else if (topPct > 0.08) { vd.className = 'verdict warn'; vd.textContent = `头号持有人占 ${fmtP(topPct, 1)}，偏高。再检查是否多个新钱包来自同一资金来源（捆绑买入）。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `持仓较分散（头号持有人 ${fmtP(topPct, 1)}）。分散不等于安全，仍需检查权限、税率和资金来源。`; }
    });
  }
});

})();
