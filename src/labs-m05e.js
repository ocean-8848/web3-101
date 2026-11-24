/* ---------- Labs M05 跨链路由: xintent ---------- */
(() => {

addLab('xintent', {
  ch: 'm05-71', title: '跨链意图（ERC-7683）vs Circle CCTP 路由模拟器', desc: '调整 USDC 跨链金额、对速度的敏感度与 L1/L2 网络拥堵程度，对比 ERC-7683 Solver 秒级垫资与 Circle CCTP 原生销毁-铸造的到账时间、综合费用与最优路由建议。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 先在 $1,000 小额下看 ERC-7683 Solver 与 CCTP 的到账时间与费用对比。② 把跨链金额拉到 $2,000,000，观察 Solver 库存溢价如何飙升，以及为什么系统推荐改走 CCTP。③ 切换“以太坊主网 → Base”与“Arbitrum → Base”，观察 Gas 与确认时间变化。</div>
    <div class="ctrls">
      ${rng(p, 'amt', '跨链金额（USDC，按对数档位）', 2, 7, 0.25, 3)}
      ${rng(p, 'gwei', '以太坊 L1 Gas 价格（gwei，示例）', 3, 60, 1, 15)}
    </div>
    <div class="row-btns">
      ${segHtml('pair', [['l2l2', 'Arbitrum → Base（L2 互跨）'], ['l1l2', '以太坊 L1 → Base']], 'l2l2')}
      ${segHtml('pref', [['fast', '速度优先（零售/即时交易）'], ['cheap', '成本优先（司库/大额调仓）']], 'fast')}
    </div>
    <div class="stats" data-s></div>
    <div class="log" data-raw></div>
    <div class="verdict" data-vd></div>`;

    const SP = seg(el, 'pair', () => B.upd());
    const SF = seg(el, 'pref', () => B.upd());

    const B = bindInputs(el, {
      amt: x => '$' + fmtN(Math.round(Math.pow(10, x)), 0),
      gwei: x => x + ' gwei'
    }, v => {
      const amount = Math.round(Math.pow(10, v.amt));
      const isL1 = SP.get() === 'l1l2';
      const fastPref = SF.get() === 'fast';
      const ethPrice = 3000;

      // 示例估算模型：Intent Solver = 固定中继/Gas + 阶梯流动性溢价（超 25 万开始显著爬升）
      const intentBaseGas = isL1 ? (120000 * v.gwei * 1e-9 * ethPrice) : 0.08;
      const solverBps = amount <= 10000 ? 4 : amount <= 100000 ? 7 : amount <= 500000 ? 15 : 35;
      const intentFee = intentBaseGas + amount * (solverBps / 10000);
      const intentSec = isL1 ? 15 : 3;

      // Circle CCTP = 源链 burn Gas + 目标链 mint Gas（零滑点、无百分比垫资费）
      const cctpFee = isL1 ? (180000 * v.gwei * 1e-9 * ethPrice + 0.05) : 0.12;
      const cctpMin = isL1 ? 15 : 13;

      const pickCCTP = amount >= 250000 || (!fastPref && intentFee > cctpFee * 1.5);
      const save = Math.abs(intentFee - cctpFee);

      $('[data-s]', el).innerHTML =
        stat('ERC-7683 Intent 预估费', '$' + fmtN(intentFee, 2) + '（' + intentSec + ' 秒到账）', pickCCTP ? 'warn' : 'ok') +
        stat('Circle CCTP 预估费', '$' + fmtN(cctpFee, 2) + '（约 ' + cctpMin + ' 分钟）', pickCCTP ? 'ok' : 'info') +
        stat('两者费用差额', '$' + fmtN(save, 2), save > 100 ? 'warn' : 'info') +
        stat('推荐路由', pickCCTP ? 'Circle CCTP 原生通道' : 'ERC-7683 Solver 意图', 'ok');

      $('[data-raw]', el).innerHTML =
        `路径：${isL1 ? '以太坊 L1 → Base' : 'Arbitrum → Base'} | 金额：$${fmtN(amount, 0)} USDC。<br>` +
        `• <b>ERC-7683 意图网络</b>：Solver 在目标链立即垫付原生 USDC，基础 Gas ≈ $${fmtN(intentBaseGas, 2)} + 流动性溢价 ${solverBps} bps = <b>$${fmtN(intentFee, 2)}</b>（${intentSec} 秒到账）。<br>` +
        `• <b>Circle CCTP</b>：源链销毁 + 官方 Iris 证明 + 目标链 1:1 铸造，零百分比滑点，仅付双链 Gas ≈ <b>$${fmtN(cctpFee, 2)}</b>（等待约 ${cctpMin} 分钟最终性确认）。`;

      const vd = $('[data-vd]', el);
      if (amount >= 250000) {
        vd.className = 'verdict ok';
        vd.textContent = `大额推荐 CCTP：金额达 $${fmtN(amount, 0)}，若走 Solver 垫资需付高达 $${fmtN(intentFee, 0)} 的库存占用溢价；改走 Circle CCTP 仅需约 $${fmtN(cctpFee, 2)}，立省 $${fmtN(save, 0)} 且获得 100% 官方原生 USDC。`;
      } else if (fastPref) {
        vd.className = 'verdict ok';
        vd.textContent = `中小额推荐 ERC-7683 意图：仅多花约 $${fmtN(Math.max(0, intentFee - cctpFee), 2)}，就能把等待时间从 ${cctpMin} 分钟压缩到 ${intentSec} 秒，大幅提升 C 端用户转化体验。`;
      } else {
        vd.className = 'verdict info';
        vd.textContent = `成本优先模式：金额 $${fmtN(amount, 0)} 下，CCTP 费用 $${fmtN(cctpFee, 2)} 低于意图垫资 $${fmtN(intentFee, 2)}；若业务能容忍 ${cctpMin} 分钟最终性等待，优先走 CCTP。`;
      }
    });
  }
});

})();
