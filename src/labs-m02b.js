/* ---------- Labs M02b: irm ---------- */
(() => {
addLab('irm', {
  ch: 'm02-11', title: '拐点利率模型', desc: '借贷池的利率随利用率变化：拐点前缓慢上升，拐点后陡增。调节各参数，观察借款年化、存款年化和曲线形状（参数均为示例）。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认参数下把利用率从 50% 拖到 80%（拐点），借款利率只涨几个百分点。② 继续拖到 95%，借款利率陡增。③ 把储备金率调到 30%，看存款利率下降多少。④ 把 slope2 调到 10%，想一想：拐点后利率不涨，存款人还能取出钱吗？</div>
    <div class="ctrls">${rng(p, 'base', '基础利率 base', 0, 10, 0.25, 0)}${rng(p, 's1', '拐点前斜率 slope1', 0, 20, 0.25, 4)}${rng(p, 's2', '拐点后斜率 slope2', 0, 300, 5, 75)}${rng(p, 'uopt', '最优利用率（拐点）', 50, 95, 1, 80)}${rng(p, 'rf', '储备金率', 0, 50, 1, 10)}${rng(p, 'u', '当前利用率 U', 0, 100, 1, 70)}</div>
    <div class="stats" data-s></div><div data-c></div><div class="verdict" data-vd></div>`;
    const borrow = (u, v) => {
      const uo = v.uopt / 100, b = v.base / 100, s1 = v.s1 / 100, s2 = v.s2 / 100;
      return u <= uo ? b + s1 * u / uo : b + s1 + s2 * (u - uo) / (1 - uo);
    };
    const supply = (u, v) => borrow(u, v) * u * (1 - v.rf / 100);
    const pct = x => x + '%';
    bindInputs(el, { base: pct, s1: pct, s2: pct, uopt: pct, rf: pct, u: pct }, v => {
      const u = v.u / 100, uo = v.uopt / 100;
      const br = borrow(u, v), sr = supply(u, v), spread = br * u - sr;
      $('[data-s]', el).innerHTML = stat('借款年化', fmtP(br), u > uo ? 'risk' : br > 0.1 ? 'warn' : 'ok') + stat('存款年化', fmtP(sr), 'ok') +
        stat('利用率 / 拐点', fmtP(u, 0) + ' / ' + fmtP(uo, 0), u > uo ? 'risk' : '') + stat('协议储备收入（占存款，年化）', fmtP(spread)) +
        stat('可提取流动性（占存款）', fmtP(1 - u, 0), 1 - u < 0.1 ? 'risk' : '');
      const bp = [], sp = [];
      for (let i = 0; i <= 100; i++) { const x = i / 100; bp.push([i, borrow(x, v) * 100]); sp.push([i, supply(x, v) * 100]); }
      const ymax = Math.max(5, Math.ceil((borrow(1, v) * 100) * 1.08 / 5) * 5);
      const yt = []; for (let i = 0; i <= 4; i++) yt.push(Math.round(ymax * i / 4));
      $('[data-c]', el).innerHTML = lineChart({ label: '借款与存款利率随利用率变化', xr: [0, 100], yr: [0, ymax], series: [{ pts: bp, cls: 's1' }, { pts: sp, cls: 's2' }],
        vlines: [{ x: v.uopt, label: '拐点 ' + v.uopt + '%' }],
        markers: [{ x: v.u, y: br * 100, cls: u > uo ? 'dot2' : 'dot', label: '借 ' + fmtP(br, 1) }, { x: v.u, y: sr * 100, cls: 'dot', label: '存 ' + fmtP(sr, 1), below: true }],
        xticks: [0, 20, 40, 60, 80, 100], fx: t => t + '%', yticks: yt, fy: t => t + '%' }) +
        '<div class="small muted">实线 = 借款利率，虚线 = 存款利率 = 借款利率 × 利用率 × (1 − 储备金率)。</div>';
      const vd = $('[data-vd]', el);
      if (u > uo) {
        vd.className = 'verdict risk';
        vd.textContent = `利用率 ${fmtP(u, 0)} 已越过拐点。池子里只剩 ${fmtP(1 - u, 0)} 的存款可供提取。陡增的借款利率逼借款人还款，高存款利率吸引新存款，把利用率拉回拐点以下，保证存款人随时能取钱。`;
      } else if (u > uo - 0.1) {
        vd.className = 'verdict warn';
        vd.textContent = `接近拐点。再借出 ${fmtP(uo - u, 0)} 的存款，利率曲线斜率就会从 slope1 跳到 slope2，利率开始陡增。`;
      } else {
        vd.className = 'verdict ok';
        vd.textContent = `拐点以下利率平缓上升，鼓励借款、提高资金利用效率。存款人只拿到借款利息的 ${fmtP(u * (1 - v.rf / 100), 0)}：一部分资金没借出，另一部分利息进入储备金。`;
      }
    });
  }
});
})();
