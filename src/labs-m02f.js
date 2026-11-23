/* ---------- Labs M02f: lststake 流动性质押记账 · ptyt 本金/收益代币拆分 ---------- */
(() => {
addLab('lststake', {
  ch: 'm02-63', title: '流动性质押：余额增长 vs 汇率上升', desc: '存入 10 ETH，设定年化收益、协议费和一次罚没事件，比较“余额每月增长”的 rebase 代币与“余额不变、汇率上升”的份额代币，两者价值始终相同（参数均为示例）。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认参数下看两张图：rebase 代币的余额上升，份额代币的余额是一条平线，汇率上升；两者的 ETH 价值相同。② 把罚没比例拉到 3%：第 6 个月 rebase 余额下降（所有持有人按比例分担），份额代币的汇率下降。③ 把协议费调到 20%，看净年化变化。④ 把罚没月份移到第 12 个月，看全年收益被一次事件抹掉多少。</div>
    <div class="ctrls">${rng(p, 'apr', '验证者毛年化收益（示例）', 1, 8, 0.1, 3.2)}${rng(p, 'fee', '协议费（占奖励）', 0, 20, 1, 10)}${rng(p, 'dep', '存入 ETH', 1, 100, 1, 10)}${rng(p, 'sm', '罚没发生的月份', 1, 12, 1, 6)}${rng(p, 'sl', '池内被罚没比例', 0, 3, 0.05, 0.5)}</div>
    <div class="stats" data-s></div>
    <div data-c1></div><div data-c2></div>
    <div class="verdict" data-vd></div>`;
    const ctrl = bindInputs(el, { apr: v => v.toFixed(1) + '%', fee: v => v + '%', dep: v => v + ' ETH', sm: v => '第 ' + v + ' 月', sl: v => v.toFixed(2) + '%' }, draw);
    function draw(v) {
      v = v || ctrl.read();
      const net = v.apr * (1 - v.fee / 100) / 100;
      const shares = v.dep;              // 初始 1 份额 = 1 ETH
      let pool = v.dep, noSlashPool = v.dep;
      const bal = [[0, shares]], rate = [[0, 1]], valNo = [[0, shares]];
      let feePaid = 0, lost = 0;
      for (let m = 1; m <= 12; m++) {
        const gross = pool * v.apr / 100 / 12;
        feePaid += gross * v.fee / 100;
        pool += gross * (1 - v.fee / 100);
        noSlashPool *= 1 + net / 12;
        if (m === v.sm) { lost = pool * v.sl / 100; pool -= lost; }
        bal.push([m, pool]); rate.push([m, pool / shares]); valNo.push([m, noSlashPool]);
      }
      const end = pool, rateEnd = end / shares, gain = end - v.dep;
      $('[data-s]', el).innerHTML =
        stat('净年化（扣协议费）', fmtN(net * 100, 2) + '%') +
        stat('rebase 代币期末余额', fmtN(end, 3) + ' stETH 类', '') +
        stat('份额代币期末余额', fmtN(shares, 3) + '（不变）') +
        stat('份额代币汇率', fmtN(rateEnd, 4) + ' ETH', rateEnd < 1 ? 'risk' : 'ok') +
        stat('一次罚没你分担', fmtN(lost, 4) + ' ETH', lost > 0.05 * v.dep ? 'risk' : lost > 0 ? 'warn' : 'ok') +
        stat('协议费合计', fmtN(feePaid, 4) + ' ETH');
      const lo = Math.min(...bal.map(b => b[1]), v.dep) * 0.99, hi = Math.max(...bal.map(b => b[1]), valNo[12][1]) * 1.01;
      $('[data-c1]', el).innerHTML = lineChart({ label: 'rebase 代币余额与份额代币余额', xr: [0, 12], yr: [lo, hi],
        series: [{ pts: bal, cls: 's1', area: true }, { pts: [[0, shares], [12, shares]], cls: 's2' }, { pts: valNo, cls: 's3' }],
        markers: v.sl > 0 ? [{ x: v.sm, y: bal[v.sm][1], cls: 'dot2', label: '罚没' }] : [],
        xticks: [0, 3, 6, 9, 12], fx: t => t + '月', yticks: [lo, (lo + hi) / 2, hi], fy: t => fmtN(t, 2) }) +
        '<div class="small muted">实线 + 阴影：rebase 代币余额（每月增长，罚没月下降）。平线：份额代币余额（不变）。细线：如果没有罚没的 rebase 余额。</div>';
      const rlo = Math.min(...rate.map(r => r[1]), 1) * 0.995, rhi = Math.max(...rate.map(r => r[1])) * 1.005;
      $('[data-c2]', el).innerHTML = lineChart({ label: '份额代币的汇率（ETH 每枚）', xr: [0, 12], yr: [rlo, rhi],
        series: [{ pts: rate, cls: 's1' }, { pts: [[0, 1], [12, 1]], cls: 's2' }],
        markers: v.sl > 0 ? [{ x: v.sm, y: rate[v.sm][1], cls: 'dot2', label: '罚没' }] : [],
        xticks: [0, 3, 6, 9, 12], fx: t => t + '月', yticks: [rlo, (rlo + rhi) / 2, rhi], fy: t => fmtN(t, 3) }) +
        '<div class="small muted">实线：份额代币汇率。平线：rebase 代币的汇率恒为 1，所有变化体现在余额里。</div>';
      const vd = $('[data-vd]', el);
      const pct = gain / v.dep;
      if (v.sl >= 1.5) { vd.className = 'verdict risk'; vd.textContent = `一次罚没吞掉池内 ${v.sl.toFixed(2)}%，相当于约 ${fmtN(v.sl / (net * 100) * 12, 1)} 个月的净收益。罚没由全体持有人按份额分担：你没有做错任何事，也一样承担。真实世界里单次事件通常小得多，但选择运营者分散的池，就是在降低这个风险。`; }
      else if (v.sl > 0) { vd.className = 'verdict warn'; vd.textContent = `全年 ETH 价值 ${v.dep} → ${fmtN(end, 3)}（${fmtP(pct, 2)}）。无论 rebase 还是份额代币，价值都一样；区别只在“变化显示在哪里”。集成这类代币的协议要选对读取方式。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `没有罚没：全年 ETH 价值 ${v.dep} → ${fmtN(end, 3)}（${fmtP(pct, 2)}）。rebase 余额增长，份额代币汇率上升，两者价值一致。`; }
    }
    draw();
  }
});

addLab('ptyt', {
  ch: 'm02-64', title: 'PT / YT：折价、固定收益与杠杆', desc: '把一份生息资产拆成本金代币 PT 和收益代币 YT。调隐含年化和剩余天数，看 PT 折价和固定收益；再调到期前的实际收益率，看 YT 的杠杆收益与亏损（示例参数，不含手续费和滑点）。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认：隐含年化 6%，剩 180 天。PT 约 0.971，持有到期固定赚约 3%（折合年化 6%）。② 把剩余天数拉到 365，PT 折价变大；拉到 30，PT 几乎等于 1。③ 看 YT 图：实际年化高于隐含年化时 YT 赚钱，低于时亏钱，交点就是隐含年化。④ 把隐含年化降到 2%：YT 变便宜，杠杆更高，但风险同样更高。</div>
    <div class="ctrls">${rng(p, 'imp', '市场隐含年化（PT 的固定收益）', 0.5, 20, 0.5, 6)}${rng(p, 'days', '距到期天数', 7, 365, 1, 180)}${rng(p, 'real', '到期前实际平均年化（底层收益）', 0, 20, 0.5, 9)}</div>
    <div class="stats" data-s></div>
    <div data-c1></div><div data-c2></div>
    <div class="verdict" data-vd></div>`;
    const ptP = (i, d) => 1 / Math.pow(1 + i, d / 365);
    const ctrl = bindInputs(el, { imp: v => v.toFixed(1) + '%', days: v => v + ' 天', real: v => v.toFixed(1) + '%' }, draw);
    function draw(v) {
      v = v || ctrl.read();
      const i = v.imp / 100, d = v.days, r = v.real / 100, t = d / 365;
      const pt = ptP(i, d), yt = 1 - pt;
      const ptRet = 1 / pt - 1;                      // 持有 PT 到期的总收益
      const lev = 1 / yt;                            // 每 1 单位资金买到的收益暴露
      const ytPay = Math.pow(1 + r, t) - 1;          // 每 1 单位底层资产在剩余期限内产生的收益
      const ytRet = ytPay / yt - 1;
      $('[data-s]', el).innerHTML =
        stat('PT 价格（按底层计）', fmtN(pt, 4)) +
        stat('PT 折价', fmtP(1 - pt, 2)) +
        stat('持有 PT 到期收益', fmtP(ptRet, 2) + '（年化 ' + fmtN(v.imp, 1) + '%）', 'ok') +
        stat('YT 价格', fmtN(yt, 4)) +
        stat('YT 杠杆（收益暴露倍数）', fmtN(lev, 1) + ' ×', lev > 20 ? 'risk' : lev > 8 ? 'warn' : '') +
        stat('YT 到期收益（按所设实际年化）', fmtP(ytRet, 1), ytRet < 0 ? 'risk' : 'ok');
      const ptPts = [], ytPts = [];
      for (let x = 0; x <= 365; x += 5) { const q = ptP(i, Math.max(x, 0)); ptPts.push([x, q]); ytPts.push([x, 1 - q]); }
      const lo = Math.max(0.5, Math.floor(Math.min(ptP(i, 365), 0.97) * 20) / 20 - 0.05);
      $('[data-c1]', el).innerHTML = lineChart({ label: 'PT 价格与 YT 价格随剩余天数变化', xr: [0, 365], yr: [0, 1.0],
        series: [{ pts: ptPts, cls: 's1', area: true }, { pts: ytPts, cls: 's3' }],
        markers: [{ x: d, y: pt, cls: 'dot', label: 'PT ' + fmtN(pt, 3), below: true, left: true }, { x: d, y: yt, cls: 'dot2', label: 'YT ' + fmtN(yt, 3) }],
        xticks: [0, 90, 180, 270, 365], fx: t => t + '天', yticks: [0, 0.25, 0.5, 0.75, 1], fy: t => fmtN(t, 2) }) +
        '<div class="small muted">实线 + 阴影：PT 价格，随到期临近升向 1。细线：YT 价格，= 1 − PT，向 0 衰减。横轴是“距到期天数”，向左是时间流逝。</div>';
      const ret = [];
      for (let x = 0; x <= 20; x += 0.5) ret.push([x, (Math.pow(1 + x / 100, t) - 1) / yt * 100 - 100]);
      const ymin = Math.min(-100, ...ret.map(a => a[1])), ymax = Math.max(50, ...ret.map(a => a[1]));
      $('[data-c2]', el).innerHTML = lineChart({ label: 'YT 到期收益随实际年化变化', xr: [0, 20], yr: [ymin, ymax],
        series: [{ pts: ret, cls: 's1' }],
        hlines: [{ y: 0, cls: 's3' }],
        vlines: [{ x: v.imp, label: '盈亏平衡' }],
        markers: [{ x: v.real, y: ytRet * 100, cls: 'dot2', label: fmtN(ytRet * 100, 0) + '%' }],
        xticks: [0, 5, 10, 15, 20], fx: t => t + '%', yticks: [ymin, 0, ymax], fy: t => fmtN(t, 0) + '%' }) +
        '<div class="small muted">横轴：到期前底层资产的实际平均年化。纵轴：买入 YT 持有到期的盈亏（百分比，不含手续费）。竖线：盈亏平衡点，等于市场隐含年化。</div>';
      const vd = $('[data-vd]', el);
      if (r < i) { vd.className = 'verdict risk'; vd.textContent = `实际年化 ${fmtN(v.real, 1)}% 低于隐含年化 ${fmtN(v.imp, 1)}%：买 YT 的人亏 ${fmtP(-ytRet, 0)}，而买 PT 的人仍然按 ${fmtN(v.imp, 1)}% 拿到固定收益。YT 的杠杆在这里放大的是亏损，最坏情况是本金归零（底层收益为 0）。`; }
      else if (lev > 15) { vd.className = 'verdict warn'; vd.textContent = `实际年化高于隐含年化，YT 赚 ${fmtP(ytRet, 0)}，但杠杆 ${fmtN(lev, 0)} 倍：底层收益稍有下降就由盈转亏，且到期时 YT 价值归零，没有“拿着等回本”这回事。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `实际年化 ${fmtN(v.real, 1)}% 高于隐含年化 ${fmtN(v.imp, 1)}%：YT 赚 ${fmtP(ytRet, 0)}。这是“押收益会上升”的赌注；PT 持有者放弃了这部分上行，换来确定的 ${fmtN(v.imp, 1)}%。`; }
    }
    draw();
  }
});
})();
