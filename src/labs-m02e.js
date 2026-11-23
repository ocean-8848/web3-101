/* ---------- Labs M02e: vesting 代币解锁曲线 ---------- */
(() => {
addLab('vesting', {
  ch: 'm02-60', title: '代币解锁曲线', desc: '总量 10 亿枚。给团队、投资人、社区、金库、空投分别设定分配比例、TGE 解锁、悬崖期和线性月数，观察 48 个月的流通量和每月解锁压力（参数均为示例）。',
  mount(el, p) {
    const CATS = [
      ['team', '团队'], ['inv', '投资人'], ['comm', '社区激励'], ['trea', '金库'], ['air', '空投']
    ];
    // 预填示例：合计 100%
    const S = {
      team: { alloc: 20, tge: 0, cliff: 12, lin: 36 },
      inv: { alloc: 18, tge: 0, cliff: 12, lin: 24 },
      comm: { alloc: 35, tge: 5, cliff: 0, lin: 48 },
      trea: { alloc: 17, tge: 10, cliff: 0, lin: 48 },
      air: { alloc: 10, tge: 60, cliff: 0, lin: 6 }
    };
    let cur = 'team', mode = 'after';
    const TOTAL = 1e9, M = 48;
    el.innerHTML = `<div class="try"><b>试一试：</b>① 默认方案下看第 12 个月：团队和投资人悬崖结束，但“悬崖后才开始线性”不会出现跳涨。② 把释放方式切到“悬崖日补发”：第 12 个月出现一根大柱，单月解锁占当时流通量的比例飙升。③ 选“投资人”，把悬崖期改成 6、线性改成 6：解锁集中在一年内，看判定变化。④ 选“空投”，把 TGE 解锁拉到 100%：首日流通变大，但后续压力变小。</div>
    <div class="row-btns">${segHtml('cat', CATS, 'team')}</div>
    <div class="row-btns">${segHtml('mode', [['after', '悬崖后开始线性'], ['catch', '悬崖日补发（从 TGE 起算）']], 'after')}</div>
    <div class="ctrls">${rng(p, 'alloc', '分配比例（占总量）', 0, 60, 1, 20)}${rng(p, 'tge', 'TGE 当天解锁（占本类）', 0, 100, 5, 0)}${rng(p, 'cliff', '悬崖期（月）', 0, 24, 1, 12)}${rng(p, 'lin', '线性释放（月）', 0, 48, 1, 36)}</div>
    <div class="stats" data-s></div>
    <div data-c></div><div data-c2></div>
    <div data-t></div>
    <div class="verdict" data-vd></div>`;
    const pct = x => x + '%', mon = x => x + ' 个月';
    // 某一类在第 m 个月末的累计解锁比例（0..1）
    const frac = (c, m) => {
      const t = c.tge / 100;
      if (m < 0) return 0;
      let f;
      if (mode === 'after') f = m < c.cliff ? 0 : c.lin === 0 ? 1 : Math.min(1, (m - c.cliff) / c.lin);
      else f = m < c.cliff ? 0 : (c.cliff + c.lin) === 0 ? 1 : Math.min(1, m / (c.cliff + c.lin));
      return t + (1 - t) * f;
    };
    const unlocked = (k, m) => S[k].alloc / 100 * frac(S[k], m); // 占总量
    const ctrl = bindInputs(el, { alloc: pct, tge: pct, cliff: mon, lin: mon }, v => { S[cur] = { alloc: v.alloc, tge: v.tge, cliff: v.cliff, lin: v.lin }; draw(); });
    const load = () => { ['alloc', 'tge', 'cliff', 'lin'].forEach(k => { $(`#${p}-${k}`, el).value = S[cur][k]; }); ctrl.upd(); };
    seg(el, 'cat', v => { cur = v; load(); });
    seg(el, 'mode', v => { mode = v; draw(); });
    function draw() {
      const keys = CATS.map(c => c[0]);
      const sum = keys.reduce((a, k) => a + S[k].alloc, 0);
      const circ = [], inside = [], monthly = [];
      for (let m = 0; m <= M; m++) {
        const c = keys.reduce((a, k) => a + unlocked(k, m), 0);
        const ins = unlocked('team', m) + unlocked('inv', m);
        circ.push([m, c * 100]); inside.push([m, ins * 100]);
        monthly.push([m, m === 0 ? c * 100 : (c - circ[m - 1][1] / 100) * 100]);
      }
      // 最大单月解锁（不含 TGE 当天），以及它占解锁前流通量的比例
      let mx = 1, ratio = 0, rm = 1;
      for (let m = 1; m <= M; m++) {
        if (monthly[m][1] > monthly[mx][1]) mx = m;
        const r = circ[m - 1][1] > 0 ? monthly[m][1] / circ[m - 1][1] : 0;
        if (r > ratio) { ratio = r; rm = m; }
      }
      const tge = circ[0][1], c12 = circ[12][1], c48 = circ[M][1];
      let full = -1; for (let m = 0; m <= M; m++) if (full < 0 && circ[m][1] >= sum - 1e-6) full = m;
      $('[data-s]', el).innerHTML =
        stat('分配合计', fmtN(sum, 0) + '%', Math.abs(sum - 100) > 0.01 ? 'risk' : 'ok') +
        stat('TGE 当天流通', fmtP(tge / 100, 1), tge < 10 ? 'warn' : '') +
        stat('第 12 个月流通', fmtP(c12 / 100, 1)) +
        stat('最大单月解锁', `第 ${mx} 月 · ${fmtP(monthly[mx][1] / 100, 2)}`, monthly[mx][1] > 5 ? 'risk' : monthly[mx][1] > 2 ? 'warn' : 'ok') +
        stat('单月解锁 ÷ 解锁前流通（最大）', `第 ${rm} 月 · ${fmtP(ratio, 1)}`, ratio > 0.25 ? 'risk' : ratio > 0.1 ? 'warn' : 'ok') +
        stat('全部解锁', full >= 0 ? `第 ${full} 个月` : `48 个月后（剩 ${fmtP((sum - c48) / 100, 1)}）`);
      const ymax = Math.max(20, Math.ceil(Math.max(sum, 1) / 20) * 20);
      $('[data-c]', el).innerHTML = lineChart({ label: '累计流通量占总量', xr: [0, M], yr: [0, ymax], series: [{ pts: circ, cls: 's1', area: true }, { pts: inside, cls: 's2' }],
        vlines: [{ x: 12, label: '12 月' }, { x: 24, label: '24 月' }],
        markers: [{ x: 0, y: tge, cls: 'dot', label: 'TGE ' + fmtN(tge, 1) + '%' }, { x: mx, y: circ[mx][1], cls: 'dot2', label: '最大解锁月' }],
        xticks: [0, 6, 12, 18, 24, 30, 36, 42, 48], fx: t => t + '月', yticks: [0, ymax / 4, ymax / 2, ymax * 3 / 4, ymax], fy: t => t + '%' }) +
        '<div class="small muted">实线 + 阴影 = 全部流通量；虚线 = 团队 + 投资人已解锁（“内部人”筹码）。</div>';
      const m1 = monthly.slice(1), ym = Math.max(2, Math.ceil(Math.max(...m1.map(x => x[1])) * 1.2));
      $('[data-c2]', el).innerHTML = lineChart({ label: '每月新增解锁占总量', xr: [1, M], yr: [0, ym], series: [{ pts: m1, cls: 's3' }],
        markers: [{ x: mx, y: monthly[mx][1], cls: 'dot2', label: fmtN(monthly[mx][1], 2) + '%' }],
        xticks: [1, 12, 24, 36, 48], fx: t => t + '月', yticks: [0, ym / 2, ym], fy: t => fmtN(t, 1) + '%' }) +
        '<div class="small muted">每月新增解锁 = 本月末流通 − 上月末流通。尖峰就是市场常说的“解锁悬顶”。</div>';
      $('[data-t]', el).innerHTML = tbl(['类别', '分配', 'TGE', '悬崖', '线性', '第 12 月已解锁', '数量（枚）'], CATS.map(([k, n]) => [
        k === cur ? `<b>${n}（编辑中）</b>` : n, S[k].alloc + '%', S[k].tge + '%', S[k].cliff + ' 月', S[k].lin + ' 月',
        fmtP(frac(S[k], 12), 0), fmtN(TOTAL * S[k].alloc / 100 * frac(S[k], 12), 0)]));
      const vd = $('[data-vd]', el);
      if (Math.abs(sum - 100) > 0.01) { vd.className = 'verdict risk'; vd.textContent = `分配合计 ${fmtN(sum, 0)}%，不等于 100%。真实项目里多出来的部分没有来源，少掉的部分去向不明。先把各类比例调到合计 100%。`; }
      else if (ratio > 0.25) { vd.className = 'verdict risk'; vd.textContent = `第 ${rm} 个月新增解锁相当于解锁前流通量的 ${fmtP(ratio, 0)}。市场要在一个月内吸收这么多新筹码，价格承压的风险很高。常见缓解：拉长线性期、取消悬崖日补发、分批解锁并提前公告。`; }
      else if (tge < 10 && inside[M][1] > 30) { vd.className = 'verdict warn'; vd.textContent = `TGE 流通只有 ${fmtN(tge, 1)}%，而团队和投资人最终持有 ${fmtN(inside[M][1], 0)}%。这是典型的“低流通、高 FDV”：早期价格由很少的筹码决定，后续解锁持续稀释。`; }
      else if (ratio > 0.1) { vd.className = 'verdict warn'; vd.textContent = `最大单月解锁约为当时流通量的 ${fmtP(ratio, 0)}（第 ${rm} 月）。可以接受，但要提前公告并观察成交量是否足够吸收。`; }
      else { vd.className = 'verdict ok'; vd.textContent = `解锁比较平滑：任何一个月的新增解锁都不超过当时流通量的 ${fmtP(ratio, 0)}。代价是团队和投资人的筹码长期锁定，项目要用其他方式（工资、预算）支持早期运营。`; }
    }
    load();
  }
});
})();
