/* ---------- 工具页：实验室、术语表；启动 ---------- */
sortCh();
CUR = 'labs';
addCh({ id: 'labs', code: 'LAB', group: 'tools', nav: `交互实验室（${Object.keys(H.labs).length} 个）`, title: '交互实验室', html: (() => {
  const mods = H.ch.filter(c => c.mod && c.sub === 0);
  return `<h1>交互实验室</h1>
<p>${Object.keys(H.labs).length} 个实验覆盖全部 ${mods.length} 个模块。每个实验都能单独打开，也嵌在对应文章里。读结论之前，先亲手改一次参数。</p>
${call('info', '<p>实验中的数字是示例值，用于演示机制。真实协议的参数会变化。</p>')}
${mods.map(c => { const ls = Object.entries(H.labs).filter(([, L]) => H.byId[L.ch] && H.byId[L.ch].mod === c.mod); return ls.length ? `<h2>${c.code} ${c.nav || c.title}</h2><div class="cards">${ls.map(([id, L]) => `<a class="card" href="#lab-${id}"><span class="from">LAB · ${H.byId[L.ch].code}</span><span class="t">${L.title}</span><span class="d">${L.desc}</span></a>`).join('')}</div>` : ''; }).join('')}`;
})() });

CUR = 'glossary';
addCh({ id: 'glossary', code: 'GLO', group: 'tools', nav: '术语总表', title: '术语总表', html: (() => {
  const seen = new Set();
  const list = H.terms.filter(x => { const k = x.t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return `<h1>术语总表</h1>
<p>全部文章的术语，共 ${list.length} 条。输入关键词过滤，点击文章编号跳转。</p>
<input class="search" id="gq" type="search" placeholder="过滤术语，例如：Gas、清算、MPC" style="max-width:420px">
${tbl(['术语', '英文', '定义', '出处'], list.map(x => [`<strong>${x.t}</strong>`, x.en, x.d, `<a href="#${x.ch}">${H.byId[x.ch] ? H.byId[x.ch].code : x.ch}</a>`]))}`;
})(),
  after(view) {
    const q = $('#gq', view);
    q.addEventListener('input', () => { const s = q.value.trim().toLowerCase(); $$('tbody tr', view).forEach(tr => { tr.hidden = s && !tr.textContent.toLowerCase().includes(s); }); });
  }
});

/* role map: what each Web3 job does, the abilities it needs, where the handbook teaches them, and the project that proves them */
CUR = 'roles';
addCh({ id: 'roles', code: 'ROLE', group: 'tools', nav: '岗位能力地图', title: '岗位能力地图', html: () => {
  const L = id => H.byId[id] ? `<a href="#${id}">${H.byId[id].code}${H.byId[id].sub ? ' ' + (H.byId[id].nav || '') : ''}</a>` : '';
  const Ls = ids => ids.map(L).filter(Boolean).join('、');
  const ROLES = [
    { n: '智能合约工程师', tr: 'contract', what: '设计、编写、测试和部署合约，维护升级与权限。', can: ['用 Solidity 写出带权限、可暂停、可升级的合约', '用 Foundry 写单元、模糊和不变量测试', '说出常见漏洞的成因和防法', '读懂 AMM、借贷、稳定币的核心公式'], mods: ['m02', 'm13', 'm07', 'm05'], proj: ['m02-12', 'm12-2'] },
    { n: '安全审计工程师', tr: 'contract', what: '找出合约和系统里会丢钱的缺陷，写出可复现的报告。', can: ['按威胁模型逐个检查权限、外部调用、价格来源', '用 Slither、模糊测试、不变量测试辅助审查', '把漏洞写成 PoC 测试并给出修复', '组织一次应急响应'], mods: ['m02', 'm13', 'm05'], proj: ['m02-62', 'm12-4'], ext: '深入内容见姊妹手册 <a href="https://claude.ai/artifact/AuMf2iv5HSYVzvQiBEE6pA" target="_blank" rel="noopener noreferrer">《Web3 安全手册》</a>。' },
    { n: '区块链后端 / 钱包工程师', tr: 'backend', what: '做充值监听、索引器、签名服务、托管钱包和节点基础设施。', can: ['用 go-ethereum 读块、订阅日志、处理重组', '设计不重不漏的入账流程和 Nonce 管理', '说清 HD、多签、MPC 的取舍并能接入其中一种', '搭建有监控的 RPC 网关'], mods: ['m01', 'm03', 'm05'], proj: ['m01-9', 'm03-9', 'm05-10'] },
    { n: '交易所工程师', tr: 'cex', what: '做撮合、账本、清算、充提、行情，或 DEX 报价与路由。', can: ['设计双分录账本并保证对账为零', '实现价格时间优先的撮合引擎', '说清冷热钱包与提币风控', '实现多池报价与拆单路由'], mods: ['m13', 'm03', 'm04', 'm08'], proj: ['m04-10', 'm04-78'] },
    { n: 'Web3 前端工程师', tr: 'frontend', what: '做 DApp 界面：连接钱包、读写合约、签名登录和交易状态。', can: ['用 wagmi + viem 连接钱包并读写合约', '正确处理单位精度和交易的每个状态', '实现 SIWE 与 EIP-712 签名', '识别并防住前端钓鱼与授权风险'], mods: ['m07', 'm09'], proj: ['m07-10', 'm09-6'] },
    { n: 'AI Agent 工程师', tr: 'agent', what: '让 AI 代理安全地读链、写链、付款。', can: ['把链上能力做成最小权限的工具（MCP）', '用确定性策略引擎和模拟拦截危险交易', '用账户抽象和会话密钥限制代理权限', '设计 Agent 支付流程'], mods: ['m06', 'm03'], proj: ['m06-9'] },
    { n: '链上数据分析师 / 研究员', tr: 'data', what: '用链上数据回答业务和研究问题，追踪资金，评估项目。', can: ['用 Dune SQL 写出活跃用户、交易量、留存查询', '识别刷量、重复计算和精度错误', '用地址聚类和标签追踪一笔被盗资金', '读懂代币经济与释放计划对价格的影响', '按固定框架写出一份协议研究备忘录'], mods: ['m05', 'm13', 'm11'], proj: ['m05-66', 'm05-67', 'm02-65'] },
    { n: '协议 / 密码学工程师', tr: 'protocol', what: '研究和实现共识、比特币与多链、零知识证明和隐私协议。', can: ['说清 PoS、UTXO、Move、IBC 各自的安全假设', '写出一个 Circom 电路并在链上验证', '比较 SNARK、STARK、MPC、FHE、TEE 的取舍', '评估一座跨链桥的信任模型'], mods: ['m05'], proj: ['m10-7'] },
    { n: '合规科技 / 风控工程师', tr: 'data', what: '把 KYC、KYT、旅行规则、制裁筛查做进产品和系统。', can: ['说清 VASP 的义务和主要法域的牌照类型', '设计充提筛查和规则引擎', '实现旅行规则消息交换和自托管地址验证', '建立案件管理与审计日志'], mods: ['m11', 'm04', 'm05'], proj: ['m11-6'] },
    { n: 'Web3 产品经理', tr: '', what: '选赛道、定方案、平衡体验、安全与合规。', can: ['说清主要应用赛道的商业模式和依赖的基础设施', '判断一个功能会带来哪些合规义务', '读懂代币经济、治理和激励设计', '和工程团队一起写威胁模型与上线清单'], mods: ['m00', 'm13', 'm09', 'm11'], proj: ['m12-1'] }
  ];
  const trName = id => (TRACKS.find(t => t.id === id) || {}).name || '';
  return `<h1>岗位能力地图</h1>
<p>本页把 Web3 常见岗位和本手册对应起来：每个岗位做什么、要具备哪些能力、在哪里学、用哪个项目证明。“具备初步实战能力”的标准是：<strong>读完必读模块、做完对应的阶段测验（首答正确率 ≥ 80%）、交付至少一个作品项目</strong>。</p>
${call('info', '<p>岗位边界在不同公司差别很大，本页是学习规划用的参照，不是招聘标准。选好岗位后，可以在左侧“我的方向”里选对应路线，目录会把选修篇变灰。</p>')}
${tbl(['岗位', '做什么', '对应路线', '必读模块', '作品项目'], ROLES.map(r => [`<strong>${r.n}</strong>`, r.what, r.tr ? `<button type="button" class="btn" data-role-track="${r.tr}">${trName(r.tr)}</button>` : '—', Ls(r.mods), Ls(r.proj)]))}
<h2>逐个岗位：能力清单</h2>
${ROLES.map(r => `<h3>${r.n}</h3><p>${r.what}${r.ext ? ' ' + r.ext : ''}</p><ul>${r.can.map(x => `<li>${x}</li>`).join('')}</ul><p class="small muted">在哪学：${Ls(r.mods)}；阶段测验：${r.mods.map(m => H.byId[m + '-quiz'] ? L(m + '-quiz') : '').filter(Boolean).join('、') || '—'}；作品：${Ls(r.proj)}</p>`).join('')}
<h2>所有方向的共同底座</h2>
<ul><li>${Ls(['m00', 'm01'])}：信任模型、哈希、签名、交易与节点。</li><li>${Ls(['m00-6'])}：安全第一课。所有岗位都会接触私钥或资金。</li><li>${Ls(['m12'])}：用毕业项目把多个模块串起来，这是最有说服力的作品。</li></ul>`;
}, after(view) {
  $$('[data-role-track]', view).forEach(b => b.addEventListener('click', () => { setTrack(b.dataset.roleTrack); b.textContent = '✓ 已切换'; }));
} });

/* home page table of contents, built from the registry */
H.byId.home.after = view => {
  const tb = $('[data-tracks]', view);
  if (tb) {
    const draw = () => {
      tb.innerHTML = `<div class="tracks">${TRACKS.map(tr => {
        const list = H.ch.filter(c => c.mod && c.sub && trackHas(tr, c));
        const mins = list.reduce((s, c) => s + minutesOf(c), 0);
        const proj = list.filter(c => levelOf(c) === '实战').map(c => `<a href="#${c.id}">${c.code}</a>`).join(' ');
        return `<div class="track${curTrack && curTrack.id === tr.id ? ' on' : ''}"><span class="t">${tr.name}</span><span class="d">${tr.who}</span><span class="d">必修 ${list.length} 篇 · 阅读约 ${Math.round(mins / 60)} 小时</span><span class="d">实战项目：${proj || '—'}</span><button type="button" class="btn ${curTrack && curTrack.id === tr.id ? '' : 'primary'}" data-track="${tr.id}">${curTrack && curTrack.id === tr.id ? '✓ 当前方向（点击取消）' : '设为我的方向'}</button></div>`;
      }).join('')}</div>`;
      $$('[data-track]', tb).forEach(b => b.addEventListener('click', () => { setTrack(curTrack && curTrack.id === b.dataset.track ? '' : b.dataset.track); draw(); }));
    };
    draw();
  }
  const box = $('[data-toc]', view); if (!box) return;
  const mods = H.ch.filter(c => c.mod && c.sub === 0);
  box.innerHTML = mods.map(m => {
    const subs = H.ch.filter(c => c.mod === m.mod && c.sub > 0);
    const labsOf = c => Object.entries(H.labs).filter(([, L]) => L.ch === c.id).map(([id, L]) => `<a href="#lab-${id}">${L.title}</a>`).join(' · ');
    return `<h3>${m.code} <a href="#${m.id}">${m.nav || m.title}</a></h3>` + tbl(['编号', '文章', '交互实验'], [[m.code, `<a href="#${m.id}">模块总览</a>`, labsOf(m) || '—']].concat(subs.map(s => [s.code, `<a href="#${s.id}">${s.nav || s.title}</a>${s.desc ? `<div class="muted small">${s.desc}</div>` : ''}`, labsOf(s) || '—'])));
  }).join('');
};

/* boot */
(function boot() {
  buildNav();
  initViewer();
  const lc = $('#labCount'); if (lc) lc.textContent = Object.keys(H.labs).length;
  const go = () => render(location.hash.slice(1) || 'home');
  window.addEventListener('hashchange', go);
  const root = document.documentElement;
  try { const sv = localStorage.getItem('w3hb-theme'); if (sv === 'light' || sv === 'dark') root.setAttribute('data-theme', sv); } catch (e) {}
  $('#themeBtn').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', nx);
    try { localStorage.setItem('w3hb-theme', nx); } catch (e) {}
  });
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $('#main').addEventListener('click', () => document.body.classList.remove('menu-open'));
  $('#q').addEventListener('input', e => search(e.target.value));
  $('#results').addEventListener('click', e => { if (e.target.closest('a')) { $('#q').value = ''; search(''); } });
  const rerender = () => { mmdReady = false; const v = $('#view'); renderDiagrams(v); };
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(rerender, 50)); } catch (e) {}
  new MutationObserver(() => setTimeout(rerender, 50)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  go();
})();
