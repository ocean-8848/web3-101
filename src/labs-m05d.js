/* ---------- Labs M04 公链基础设施: oracle ---------- */
(() => {

addLab('oracle', {
  ch: 'm05-69', title: '预言机报价新鲜度与 L2 排序器宕机模拟', desc: '调整市场瞬时跌幅、推模式偏差阈值、心跳间隔与 L2 排序器恢复宽限期，直观观察 Push 与 Pull 预言机是否放行交易、是否存在陈旧报价套利窗口。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认参数下看 Push 模式为什么尚未更新链上价格，导致合约仍按旧价成交。② 把“现货瞬时跌幅”拖到 3%（超过 0.5% 偏差阈值），观察 Push 触发更新。③ 切换“L2 排序器刚恢复（第 10 分钟）”，看开启/关闭 Sequencer Uptime Feed 宽限期的安全差别。</div>
    <div class="ctrls">
      ${rng(p, 'drop', '现货瞬时跌幅（%）', 0, 15, 0.2, 0.4)}
      ${rng(p, 'dev', 'Push 偏差阈值（%）', 0.1, 2.0, 0.1, 0.5)}
      ${rng(p, 'age', '距离上次链上更新（分钟）', 1, 90, 1, 20)}
      ${rng(p, 'hb', '心跳上限 MAX_STALENESS（分钟）', 15, 120, 5, 60)}
    </div>
    <div class="row-btns">${segHtml('seq', [['ok', 'L2 排序器正常'], ['recover_guard', '刚恢复 10 分钟（有宽限期）'], ['recover_noguard', '刚恢复 10 分钟（无宽限期）']], 'ok')}</div>
    <div class="stats" data-s></div>
    <div class="log" data-raw></div>
    <div class="verdict" data-vd></div>`;

    const S = seg(el, 'seq', () => B.upd());
    const B = bindInputs(el, {
      drop: x => '-' + fmtN(x, 1) + '%', dev: x => fmtN(x, 1) + '%', age: x => x + ' 分钟', hb: x => x + ' 分钟'
    }, v => {
      const base = 3000;
      const spot = base * (1 - v.drop / 100);
      const stale = v.age > v.hb;
      const pushTriggered = v.drop >= v.dev || stale;
      const pushPrice = pushTriggered && !stale ? spot : base;
      const gapPct = ((pushPrice - spot) / spot) * 100;
      const seqMode = S.get();

      let status = '正常成交', cls = 'ok', msg = '';
      if (seqMode === 'recover_guard') {
        status = '已拦截（宽限期保护）'; cls = 'ok';
        msg = '安全：L2 排序器仅恢复 10 分钟（小于 60 分钟宽限期），Sequencer Uptime Feed 拦截清算与大额借贷，给借款人留出补仓窗口。';
      } else if (seqMode === 'recover_noguard') {
        status = '高危（宕机恢复抢清算）'; cls = 'risk';
        msg = `危险：未接 Sequencer Uptime Feed！排序器刚恢复 10 分钟，现货已跌至 $${fmtN(spot, 0)}，用户在宕机期无法补仓却会被机器人第一时间强平。`;
      } else if (stale) {
        status = '已熔断（陈旧报价拦截）'; cls = 'warn';
        msg = `报价已过时（${v.age} 分钟 > 心跳上限 ${v.hb} 分钟），SafeOracleConsumer 触发 StalePrice() revert，成功防止按过期价格成交。`;
      } else if (!pushTriggered && v.drop > 0.2) {
        status = '存在偏差套利窗口'; cls = 'warn';
        msg = `现货跌了 ${fmtN(v.drop, 1)}% 但未达到 Push 偏差阈值 ${fmtN(v.dev, 1)}%，链上仍报旧价 $${base}（偏离 ${fmtN(gapPct, 2)}%）。高杠杆衍生品在这种场景下应改用 Pull 模式预言机。`;
      } else {
        msg = `Push 预言机已同步最新价 $${fmtN(pushPrice, 1)}；Pull 模式同样在交易 calldata 中携带最新 $${fmtN(spot, 1)} 签名，无显著价差风险。`;
      }

      $('[data-s]', el).innerHTML =
        stat('真实现货价', '$' + fmtN(spot, 1), 'info') +
        stat('Push 链上报价', stale ? '已过期（拒绝）' : '$' + fmtN(pushPrice, 1), stale ? 'warn' : pushTriggered ? 'ok' : 'warn') +
        stat('Pull 随单报价', '$' + fmtN(spot, 1) + '（亚秒级）', 'ok') +
        stat('风控判定', status, cls);

      $('[data-raw]', el).innerHTML =
        `基准旧价：$${base} | 现货现价：$${fmtN(spot, 2)} | 距上次更新：${v.age} / ${v.hb} 分钟。<br>` +
        `Push 触发条件：跌幅 ${fmtN(v.drop, 1)}% ${v.drop >= v.dev ? '≥' : '<'} 偏差阈值 ${fmtN(v.dev, 1)}% → ${pushTriggered ? '触发节点喂价上链' : '未触发（仍沿用旧价）'}。<br>` +
        `Pull 模式行为：无需等节点推送，用户或清算人在下单交易中直接附带最新签名（$${fmtN(spot, 2)}），合约验签后立即按现价结算。`;

      const vd = $('[data-vd]', el);
      vd.className = 'verdict ' + cls;
      vd.textContent = msg;
    });
  }
});

})();
