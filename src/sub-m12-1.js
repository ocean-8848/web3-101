/* ---------- M15 综合毕业项目：总览 m12 · m12-1..m12-5 ---------- */
(() => {
CUR = 'm12';
addCh({ id: 'm12', nav: '综合毕业项目', title: 'M15 综合毕业项目：从零交付一个链上产品', html: `
<h1>M15 综合毕业项目：从零交付一个链上产品</h1>
${meta(['说清毕业项目和各模块 ★ 实战项目的区别：它要把合约、前端、后端与索引、钱包与运维、安全、合规接成一个能上线的产品。', '从三个选题里选一个，并列出它要用到哪些模块的哪些文章。', '按 8–10 周的时间预算和五项评审标准，给自己排出交付计划。'], '前置：建议至少学完 <a href="#m02">M02 智能合约开发</a>、<a href="#m13">M05 DeFi 协议</a>、<a href="#m07">M03 Web3 大前端</a>，并做过一个模块的 ★ 实战项目')}

<h2>1. 一句话理解</h2>
${one('前面每个模块的 ★ 实战项目练的是“一个方向做深”。毕业项目练的是“把所有方向接起来”：一个真实用户能打开网页、连上钱包、存钱、看到收益曲线、在出事时被保护的完整产品。')}
${call('analogy', `<p>模块实战像在驾校分别练倒车入库、坡道起步和侧方停车。毕业项目像路考：同一辆车、同一条路，所有动作连在一起做，还要应对突发情况。</p>
<p>比喻的局限：路考有标准答案，毕业项目没有。评审看的是你怎样做取舍、怎样证明它安全，而不是某个固定功能清单。</p>`)}

<h2>2. 毕业项目和模块实战有什么不同</h2>
${tbl(['模块', '已有的 ★ 实战项目', '毕业项目怎样复用'], [
  ['M01 区块链基础', '<a href="#m01-9">M01.9</a> / <a href="#m01-50">M01.10</a> 充值入账服务', '复用“按高度推进 + 重组回滚 + 幂等入库”的索引思路'],
  ['M02 合约', '<a href="#m02-12">M05.9 质押挖矿协议</a>', '复用 Foundry 测试、审计清单和奖励累加器的数学'],
  ['M03 前端', '<a href="#m07-10">M03.10</a> / <a href="#m07-50">M03.11</a> DEX 兑换前端', '复用 wagmi + viem 的连接、授权、交易状态流程'],
  ['M14 应用赛道', '<a href="#m09-6">M14.7 链上凭证与声誉 DApp</a>', '选题 C 的起点'],
  ['M08 钱包', '<a href="#m03-9">M08.10</a> / <a href="#m03-50">M08.11</a> 托管钱包服务', '复用多签、密钥分级和 keeper 热钱包的管理办法'],
  ['M04 公链', '<a href="#m05-10">M04.8</a> / <a href="#m05-50">M04.9</a> RPC 网关', '索引器和 keeper 走自己的 RPC 网关或多家 RPC'],
  ['M07 零知识与隐私计算', '<a href="#m10-7">M07.7 Merkle 成员证明</a>', '选题 C 的可选扩展'],
  ['M09 CEX / M10 DEX', '<a href="#m04-10">M09.11</a> 迷你 CEX、<a href="#m04-77">M10.7</a> 聚合器后端', '选题 B 的起点'],
  ['M13 Agent', '<a href="#m06-9">M13.9</a> / <a href="#m06-50">M13.10</a> 策略交易 Agent', '选题 C 的 Agent 部分'],
  ['M11 预测市场', '<a href="#m08-11">M11.11</a> / <a href="#m08-50">M11.12</a> 二元预测市场', '可作为选题 A 的替代策略来源（选读）'],
  ['M12 合规', '<a href="#m11-6">M12.8 合规引擎</a>', '前端地域限制与地址筛查']
])}
<p>毕业项目<strong>不重新讲</strong>这些内容。每用到一项，正文给一个“前情提要”框和链接，你回去复习即可。毕业项目新增的是三件事：<strong>跨层的接口约定</strong>（合约事件 → 索引表 → API → 前端）、<strong>上线与运维</strong>（监控、密钥、应急），以及<strong>把它讲给别人听</strong>（文档、演示、面试）。</p>

<h2>3. 三个选题</h2>
${compare('三个毕业选题', [
  { name: 'A. 链上收益金库产品', tag: '默认，M15.2–M15.4 以它为例', kind: 'key', points: ['ERC-4626 金库 + 一个借贷供应策略', '前端：存入、取出、收益曲线', '索引器：份额价格历史', 'keeper：定时结算收益与再平衡', '运维：Safe 多签 + 时间锁 + 暂停', '主要用到：M02、M03、M01.8、M08.4、M02.10、M12.8'] },
  { name: 'B. 小型兑换聚合', tag: '偏交易与后端', kind: 'info', points: ['在 2–3 个 DEX 之间报价与路由', '后端报价服务 + 模拟执行', '前端：兑换、滑点、授权', '监控：报价偏差、失败率', '主要用到：<a href="#m04-71">M10.1</a>–<a href="#m04-78">M10.8</a>、<a href="#m02-10">M05.2</a>、<a href="#m05-7">M04.7 MEV</a>、<a href="#m07-10">M03.10</a>'] },
  { name: 'C. 链上凭证 + Agent 助手', tag: '偏身份与 AI', kind: '', points: ['给完成任务的用户发可验证凭证', 'Agent 读凭证并在策略约束下代用户操作', '后端：凭证签发 + Agent 策略引擎', '主要用到：<a href="#m09-1">M14.1</a>、<a href="#m09-6">M14.7</a>、<a href="#m06-4">M13.4</a>、<a href="#m06-6">M13.5</a>、<a href="#m07-6">M03.6</a>'] }
], [
  ['key', '三个选题都必须包含六层：合约、前端、后端或索引、钱包与运维、安全、合规。缺一层就不算毕业项目，只算模块练习。'],
  ['flow', '选题 A 的资金流最清楚，安全题目最典型（份额计价、通胀攻击、策略亏损），所以本模块用它做示例。'],
  ['limit', '选题 B 和 C 没有逐行示例。你按 M15.1 的交付物清单和 M15.2 的设计方法自己展开。'],
  ['risk', '三个选题都只部署到测试网。不要把毕业项目直接部署到主网接收真实资金：未经专业审计的金库就是给攻击者准备的奖金。']
])}

<h2>4. 本模块的结构</h2>
${mm('M15 五篇文章怎样衔接', `
flowchart LR
  P1["M15.1 说明<br/>选题 交付物 评审"] --> P2["M15.2 设计<br/>架构 数据模型 威胁模型"]
  P2 --> P3["M15.3 实现<br/>合约 测试 前端 索引 CI"]
  P3 --> P4["M15.4 上线<br/>自审 监控 应急 合规"]
  P4 --> P5["M15.5 作品集与面试"]
  P4 -->|"发现设计问题"| P2
  P3 -->|"测试失败"| P3
`, [
  ['flow', '按“说明 → 设计 → 实现 → 上线 → 展示”推进。M15.2 和 M15.3 合起来覆盖 ★ 实战项目的 12 个固定部分。'],
  ['fail', '最常见的失败是跳过设计直接写代码，第 6 周才发现事件里缺字段，前端和索引器要全部返工。'],
  ['key', '上线阶段发现设计问题要回到 M15.2 改文档，再改代码。文档和代码不一致，评审时直接扣分。']
])}

<h2>5. 时间预算与评审</h2>
${tbl(['周（示例，业余每周 10–15 小时）', '交付物'], [
  ['第 1 周', '选题、范围、仓库骨架、README 初稿'],
  ['第 2 周', '架构文档、数据模型、接口约定、威胁模型初稿'],
  ['第 3–4 周', '合约 + 单元测试 + 模糊测试'],
  ['第 5 周', '不变量测试、部署脚本、测试网部署'],
  ['第 6 周', '索引器 + API'],
  ['第 7 周', '前端主流程'],
  ['第 8 周', 'keeper、监控告警、应急演练'],
  ['第 9 周', '自审报告、Slither、修复'],
  ['第 10 周', '演示视频、作品集整理、模拟面试']
])}
<p>评审按五项打分：功能 25%、安全 30%、工程质量 20%、文档 15%、运维 10%（详细标准见 <a href="#m12-1">M15.1</a>）。安全权重最高，因为链上产品一旦出错，用户的钱拿不回来。</p>

<h2>6. 学完能做什么</h2>
<ul>
  <li>独立交付一个测试网上的完整链上产品，并能回答“它怎样被攻击、你怎样防”。</li>
  <li>写出一份别人能照着复现的架构文档和威胁模型。</li>
  <li>拿着它去面试合约、后端、前端、协议或数据方向的岗位。</li>
</ul>
${call('info', '<p>学习路线和整体作品集规划在 <a href="#m00-7">M00.7 学习路线与作品集</a>。本模块只讲毕业项目本身，以及怎样把它展示出来。</p>')}
` });

CUR = 'm12-1';
addCh({ id: 'm12-1', nav: '毕业项目说明', title: 'M15.1 毕业项目说明：选题、交付物与评审标准', desc: '交付哪七样东西、怎样打分、范围怎样砍、一个人还是组队', html: `
<h1>M15.1 毕业项目说明：选题、交付物与评审标准</h1>
${meta(['列出毕业项目的七项交付物，并说清每一项“做到什么程度算合格”。', '用五项评审标准和权重给一个项目打分，并找出最该补的短板。', '按 MoSCoW 方法砍范围，并决定一个人做还是组队做。'], '前置：<a href="#m12">M15 综合毕业项目总览</a>、<a href="#m00-7">M00.7 学习路线与作品集</a>')}
${beginner(`<p><strong>交付物（Deliverable）</strong>：项目结束时必须交出去、别人能检查的东西，例如代码仓库、文档、演示链接。</p>
<p><strong>威胁模型（Threat model）</strong>：一份表格式文档，写清“系统里有什么值钱的东西、谁会来攻击、从哪里攻击、你怎样防”。</p>
<p><strong>测试网（Testnet）</strong>：和主网规则一样、但代币没有价值的公链，例如 Sepolia。部署和试错都免费。</p>
<p><strong>评审标准（Rubric）</strong>：一张打分表。每一项有权重和“几分是什么样子”的描述。</p>
<p><strong>MVP（最小可行产品）</strong>：只保留核心流程、能真实使用的最小版本。</p>`)}

<h2>1. 一句话理解</h2>
${one('毕业项目不是“写完代码”就结束。你要交出七样东西，让一个陌生的评审在 30 分钟内能看懂它做什么、跑起来、相信它是安全的。')}
${call('analogy', `<p>交付毕业项目像卖一套房子：房子本身（代码和部署）是核心，但买家还要看房产证（README）、户型图（架构文档）、验房报告（测试报告和自审报告）、物业手册（运维与应急）。缺了这些，房子再好也很难成交。</p>
<p>比喻的局限：房子可以带着小毛病成交，链上合约的“小毛病”可能直接让全部资金被盗。所以安全部分的权重最高。</p>`)}
${art('一图看懂：七样交付物分成四层，评审最看重“能信”', 660, 350, [
  S.text(135, 26, '你交出的七样东西', { size: 13.5, b: 1, anchor: 'middle' }),
  S.box(10, 44, 250, 52, { k: 'info', t: '能用', s: '测试网演示 · 演示视频', left: 1 }),
  S.box(10, 108, 250, 52, { k: 'info', t: '能读', s: 'README · 架构文档 · 威胁模型', left: 1 }),
  S.box(10, 172, 250, 52, { k: 'key', t: '能信', s: '测试报告（含自审与 Slither）', left: 1 }),
  S.box(10, 236, 250, 52, { k: 'idle', dash: 1, t: '能复现', s: '代码仓库 · CI 绿灯', left: 1 }),
  S.text(535, 26, '评审五项权重', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(440, 76, '功能', { size: 13, anchor: 'end' }),
  S.box(450, 56, 175, 40, { k: 'info', t: '25%', mono: 1 }),
  S.text(440, 130, '文档', { size: 13, anchor: 'end' }),
  S.box(450, 110, 105, 40, { k: 'info', t: '15%', mono: 1 }),
  S.text(440, 204, '安全', { size: 13, b: 1, anchor: 'end' }),
  S.box(450, 184, 210, 40, { k: 'key', t: '30%', mono: 1 }),
  S.text(440, 258, '工程', { size: 13, anchor: 'end' }),
  S.box(450, 238, 140, 40, { k: 'info', t: '20%', mono: 1 }),
  S.text(440, 312, '运维', { size: 13, anchor: 'end' }),
  S.box(450, 292, 70, 40, { k: 'info', t: '10%', mono: 1 }),
  S.arrow(262, 198, 372, 198, { k: 'key', label: '决定最后分数' }),
  S.text(135, 322, '共七项，分在四层里', { size: 12, dim: 1, anchor: 'middle' })
], [
  ['flow', '左边是你要交的东西，右边是评审怎样打分。评审的阅读顺序大致是从上到下：先演示、再文档、再测试、最后才翻代码。'],
  ['key', '安全占 30%，是权重最高的一项，而它主要由“能信”这一层（测试报告、自审、不变量）来证明。'],
  ['risk', '只有代码、没有文档和测试的仓库，文档与工程质量两项通常拿不到及格分。'],
  ['limit', '权重是本课程的示例评分表，真实评审会按各自标准调整。']
], '左侧是七项交付物分成能用、能读、能信、能复现四层；右侧是功能25、文档15、安全30、工程20、运维10的五项评审权重，能信一层对应权重最高的安全项。', 'm12-1')}

<h2>2. 七项交付物</h2>
${layers('毕业项目的交付物分层', [
  { name: '能用', sub: '评审第一眼看的', chips: ['测试网演示（前端 URL + 已验证合约）', '3–5 分钟演示视频'], kind: 'key' },
  { name: '能读', sub: '评审判断你懂不懂', chips: ['README', '架构文档', '威胁模型'] },
  { name: '能信', sub: '评审判断它安不安全', chips: ['测试报告（覆盖率 + 模糊 + 不变量）', '自审报告与 Slither 结果'], kind: 'risk' },
  { name: '能复现', sub: '评审能不能自己跑', chips: ['代码仓库', 'CI 绿灯', '一条命令起本地环境'] }
], [
  ['flow', '评审的阅读顺序通常是从上到下：先看演示，再读文档，再看测试，最后才翻代码。'],
  ['key', '“能用”层决定评审愿不愿意往下看；“能信”层决定最后的分数。'],
  ['fail', '只有代码、没有文档的仓库，评审只能猜你的设计意图，通常给不到工程质量和文档两项的及格分。']
], ['看懂之后', '相信之后', '想验证时'])}
${tbl(['交付物', '合格标准（示例）', '常见缺陷'], [
  ['代码仓库', '单仓多包（<code>contracts/</code> <code>web/</code> <code>indexer/</code> <code>keeper/</code> <code>docs/</code>）；有 LICENSE；没有私钥和 API Key', '把 <code>.env</code> 提交进仓库；依赖不锁版本'],
  ['README', '一句话说明、截图、演示链接、合约地址、快速开始（≤ 5 条命令）、目录说明、已知限制', '只有 <code>forge init</code> 生成的默认内容'],
  ['架构文档', '分层图、关键调用顺序图、状态机、数据模型、接口表、技术选型理由', '只有一张图，没有解释为什么这样设计'],
  ['威胁模型', '资产清单、角色与权限、攻击面表（攻击 / 影响 / 防护 / 测试编号）', '只写“已防重入”，没有对应测试'],
  ['测试报告', '<code>forge coverage</code> 行覆盖率（核心合约 ≥ 90%，示例）、模糊与不变量的轮数和结果、已知未覆盖项', '只截图“全部通过”，没有说测了什么'],
  ['测试网演示', '前端可公开访问；合约在区块浏览器已验证源码；有测试代币领取方式', '部署后不维护，评审打开时 RPC 已失效'],
  ['演示视频', '3–5 分钟：问题 → 演示主流程 → 一次故障演示（例如暂停）→ 架构 → 安全措施', '10 分钟屏幕录制，没有讲解']
])}
${call('warn', '<p>仓库公开前，用 <code>git log -p | grep -i "private"</code> 之类的命令检查历史提交。私钥一旦进过 Git 历史，删掉文件也没用，要当作已泄露处理：换新密钥、转走测试资产。密钥管理见 <a href="#m03-8">M08.9 企业钱包系统设计</a>。</p>')}

<h2>3. 评审标准</h2>
${tbl(['维度', '权重', '1 分（不及格）', '3 分（合格）', '5 分（优秀）'], [
  ['功能', '25%', '主流程跑不通', '主流程跑通，边界情况部分处理', '主流程 + 异常流程（暂停、超额、亏损）都能演示'],
  ['安全', '30%', '没有威胁模型，或有已知高危问题', '威胁模型覆盖主要攻击面，每项有测试；Slither 高危为 0', '有不变量测试和自审报告；对每个“接受的风险”写了理由'],
  ['工程质量', '20%', '没有测试或 CI', 'CI 跑编译、测试、静态分析；代码有注释', '一条命令起本地全栈；部署脚本可重复；类型安全的前后端接口'],
  ['文档', '15%', '只有 README 默认内容', 'README + 架构文档 + 威胁模型齐全', '文档和代码一致；陌生人 30 分钟内能复现'],
  ['运维', '10%', '没有监控', '关键事件有告警；有暂停开关', '有应急手册并演练过一次；有复盘模板']
])}
<p><strong>算一算（示例）：</strong>某项目功能 4 分、安全 2 分、工程质量 4 分、文档 3 分、运维 3 分。</p>
${steps([
  '加权：功能 4 × 0.25 = 1.00；安全 2 × 0.30 = 0.60；工程 4 × 0.20 = 0.80；文档 3 × 0.15 = 0.45；运维 3 × 0.10 = 0.30。',
  '总分 = 1.00 + 0.60 + 0.80 + 0.45 + 0.30 = <strong>3.15 / 5</strong>。',
  '如果把安全从 2 分补到 4 分：总分增加 2 × 0.30 = 0.60，变成 3.75。如果把功能从 4 补到 5：只增加 0.25。',
  '结论：时间有限时，先补权重高、分数低的维度。本例应先补威胁模型和不变量测试，而不是再加一个功能。'
])}
${exq([['安全维度里，“威胁模型的每一项都有测试编号”为什么这么重要？', '<p>因为“我防了”只是一句话，测试才是证据。评审看到“通胀攻击 → 防护：虚拟份额 → 测试 T-07”，就能直接打开 T-07 验证。没有编号，评审要自己猜哪段测试对应哪个风险。</p>']])}

<h2>4. 砍范围：先保证“能交付”</h2>
<p>毕业项目最大的风险不是技术难，而是做不完。用 MoSCoW 方法把需求分成四类：</p>
${tbl(['类别', '含义', '选题 A 的例子'], [
  ['Must（必须有）', '没有它产品不成立', '存入、取出、一个策略、份额价格、暂停、测试网部署'],
  ['Should（应该有）', '没有它产品能用，但明显不完整', '收益曲线、keeper 自动结算、业绩费、监控告警'],
  ['Could（可以有）', '有时间再做', '多策略切换、存款上限动态调整、邮件通知'],
  ['Won’t（这次不做）', '明确写进“已知限制”', '主网部署、多链、跨链存款、治理代币']
])}
${mm('范围决策：一个需求要不要做', `
flowchart TB
  Q["新需求"] --> A{"不做它<br/>主流程还能演示吗"}
  A -->|"不能"| M["Must：本周做"]
  A -->|"能"| B{"它会增加<br/>新的资金攻击面吗"}
  B -->|"会"| W["Won’t：写进已知限制"]:::risk
  B -->|"不会"| C{"剩余时间<br/>大于 2 周吗"}
  C -->|"是"| S["Should 或 Could"]
  C -->|"否"| W
`, [
  ['key', '“会增加新的资金攻击面”的需求优先砍。每多一个能动资金的函数，威胁模型和测试的工作量都要加一份。'],
  ['flow', '把砍掉的需求写进 README 的“已知限制”和“扩展方向”。评审会把它看成成熟的取舍，而不是没做完。'],
  ['fail', '第 8 周还在加新功能，通常意味着没有时间做自审和演示视频，总分反而下降。']
])}

<h2>5. 一个人做还是组队</h2>
${compare('单人与组队', [
  { name: '单人', tag: '适合求职展示', kind: 'key', points: ['每一层都是你写的，面试时什么都能讲', '范围要更小：建议只做 Must + 部分 Should', '没有人做代码评审：用 AI 和社区评审补位'] },
  { name: '2–3 人小组', tag: '适合练协作', kind: 'info', points: ['典型分工：合约 / 前端 / 后端与运维', '要先定接口：ABI、事件字段、API 表', '每个 PR 至少一人评审', '简历上写清你负责哪一层，避免面试被问穿'] }
], [
  ['key', '组队的第一周只做一件事：把合约事件和 API 的字段定下来，写进 <code>docs/interfaces.md</code>。之后三层可以并行。'],
  ['risk', '组队时最常见的冲突是“合约改了事件，前端和索引器不知道”。用 CI 检查 ABI 是否和索引器里的 ABI 一致。'],
  ['limit', '组队项目在面试中仍然按个人评价。你没写过的部分，至少要能讲清它的接口和风险。']
])}

${tryit(`<p><strong>动手练习：</strong>在 30 分钟内搭好毕业项目的仓库骨架。</p>
${steps([
  '新建目录 <code>capstone/</code>，在里面运行 <code>forge init contracts</code>，再用 <code>npm create vite@latest web</code> 建前端，<code>pnpm create ponder</code> 建索引器（选 TypeScript）。',
  '新建 <code>docs/</code>，放四个空文件：<code>architecture.md</code>、<code>threat-model.md</code>、<code>interfaces.md</code>、<code>test-report.md</code>。',
  '在根目录写 <code>.gitignore</code>，至少忽略 <code>.env</code>、<code>broadcast/</code> 里的本地链记录、<code>node_modules/</code>。',
  '写 README：一句话说明、MoSCoW 表、10 周计划表、“已知限制”小节。',
  '推送到 GitHub，在 Projects 里按第 1–10 周建看板列。'
])}
<p>预期结果：一个空但结构完整的仓库。之后每周只往固定位置加东西，评审也能按固定位置找。</p>`)}

${exercises([
  ['你的项目测试覆盖率 95%，但威胁模型只有三行。按评审标准，安全维度大约几分？为什么？', '<p>大约 2 分。覆盖率只说明代码被执行过，不说明测了正确的攻击场景。安全维度要求威胁模型覆盖主要攻击面，并且每项对应一个测试。先补威胁模型，再检查每一项是否真有测试。</p>'],
  ['还剩 2 周，Must 都做完了，Should 里还有“收益曲线”和“监控告警”两项，只能做一项。按评审标准你选哪个？', '<p>选监控告警。它同时提升运维（10%）和安全（30%）两个维度，而且能在演示视频里做一次“告警触发 → 暂停”的故障演示。收益曲线只提升功能维度，可以用区块浏览器的数据截图临时替代。</p>'],
  ['三人组队，合约同学在第 5 周给 <code>Harvest</code> 事件加了一个字段。列出至少三件必须同步做的事。', '<p>一、更新 <code>docs/interfaces.md</code>；二、索引器更新 ABI 和事件处理函数，必要时重新索引；三、前端或 API 如果用到该字段，同步更新类型；四、在 CI 里加 ABI 一致性检查，防止下次再漏。</p>']
])}
${checklist([
  '能背出七项交付物，并说出每一项的合格标准。',
  '能用五项评审标准给自己的项目打一个加权分。',
  '能用 MoSCoW 把选题的需求分成四类，并写出“已知限制”。',
  '仓库骨架已建好，<code>.env</code> 不在 Git 里。',
  '组队时已写好 <code>docs/interfaces.md</code> 的第一版。'
])}
${mistakes([
  ['代码写完、测试全过，项目就完成了。', '还差文档、威胁模型、测试网演示和视频。评审先看演示和文档，再看代码。'],
  ['功能越多分越高。', '功能只占 25%。多一个动资金的功能，就多一份攻击面和测试工作，常常让安全分下降。'],
  ['测试覆盖率高就说明安全。', '覆盖率只说明代码被执行过。安全要看测试是否对应威胁模型里的每一种攻击。'],
  ['组队项目可以只讲自己写的部分。', '面试官会问整体设计。你至少要讲清其他层的接口和风险。']
])}
${recap([
  '七项交付物：仓库、README、架构文档、威胁模型、测试报告、测试网演示、演示视频。',
  '评审五项：功能 25%、安全 30%、工程质量 20%、文档 15%、运维 10%。安全权重最高。',
  '时间有限时，先补“权重高、分数低”的维度。',
  '用 MoSCoW 砍范围；会增加资金攻击面的需求优先砍，并写进已知限制。',
  '组队先定接口；单人做要把范围压得更小。'
])}
${quiz([
  { q: '五项评审标准中权重最高的是哪一项？', o: ['功能', '工程质量', '安全', '文档'], a: 2, why: '安全占 30%。链上产品出错后资金难以追回，所以安全最重要。功能 25%，工程 20%，文档 15%。' },
  { q: '某项目功能 5、安全 3、工程 3、文档 3、运维 3 分，加权总分是多少？', o: ['3.0', '3.5', '3.25', '3.75'], a: 1, why: '5×0.25 + 3×0.30 + 3×0.20 + 3×0.15 + 3×0.10 = 1.25 + 0.9 + 0.6 + 0.45 + 0.3 = 3.5。' },
  { q: '下面哪个需求最应该放进 Won’t？', o: ['取出资金', '暂停开关', '测试网部署', '支持跨链存款'], a: 3, why: '跨链存款引入桥和消息验证，是全新的资金攻击面，工作量大。前三项是 Must。' },
  { q: '私钥曾被提交到 Git 历史，后来删除了文件。正确做法是？', o: ['已经删除，不用处理', '把仓库设为私有即可', '当作已泄露：换新密钥并转走资产', '改写一次提交说明'], a: 2, why: '历史提交仍然包含私钥，任何拿到过仓库的人都能读到。唯一安全的做法是换密钥。' },
  { q: '三人组队，第一周最该完成什么？', o: ['把前端做漂亮', '定下合约事件与 API 字段', '部署到主网', '录演示视频'], a: 1, why: '接口定下来，三层才能并行开发。接口反复变化是组队项目返工的主要原因。' }
])}
${terms([
  ['交付物', 'Deliverable', '项目结束时交给评审、可以被检查的成果。'],
  ['评审标准', 'Rubric', '列出评分维度、权重和每档分数描述的打分表。'],
  ['威胁模型', 'Threat model', '列出资产、攻击者、攻击面和防护措施的文档。'],
  ['最小可行产品', 'MVP (Minimum Viable Product)', '只保留核心流程、可以真实使用的最小版本。'],
  ['MoSCoW 方法', 'MoSCoW prioritization', '把需求分成 Must、Should、Could、Won’t 四类的排序方法。'],
  ['已知限制', 'Known limitations', 'README 中写明的、本版本有意不做或不处理的事项。']
])}
` });

CUR = 'm12-2';
addCh({ id: 'm12-2', nav: '设计：收益金库', title: 'M15.2 设计：链上收益金库产品', desc: 'ERC-4626 金库的架构、角色、风控、数据模型、接口与威胁模型', html: `
<h1>M15.2 设计：链上收益金库产品</h1>
${meta(['画出收益金库的六层架构，说清合约、keeper、索引器、API、前端和多签各自的职责。', '用具体数字算出份额价格、业绩费，以及有无虚拟份额时通胀攻击的结果。', '写出金库的数据模型、接口表和威胁模型，并让每一项威胁对应一个测试编号。'], '前置：<a href="#m12-1">M15.1 毕业项目说明</a>、<a href="#m02-11">M05.3 借贷协议深入</a>、<a href="#m02-8">M02.9 合约安全 II</a>')}
${beginner(`<p><strong>金库（Vault）</strong>：一个合约，用户把资产（例如 USDC）存进去，合约替所有人统一拿去赚收益。</p>
<p><strong>份额（Share）</strong>：存入资产后拿到的凭证代币。份额本身是 ERC-20，代表“你占金库的百分之几”。</p>
<p><strong>ERC-4626</strong>：以太坊上“代币化金库”的标准接口，规定了存入、取出、份额换算等函数${cite('EIP-4626: Tokenized Vaults', 'https://eips.ethereum.org/EIPS/eip-4626')}。</p>
<p><strong>策略（Strategy）</strong>：金库把资产拿去赚钱的具体方式。本项目的策略是把 USDC 存进借贷协议赚利息。</p>
<p><strong>Keeper</strong>：链下的机器人程序，定时调用合约函数，例如结算收益、再平衡。</p>
<p><strong>时间锁（Timelock）</strong>：一个合约，所有管理操作提交后要等一段时间才能执行，给用户留出发现问题和退出的时间。</p>`)}

<h2>1. 一句话理解</h2>
${one('收益金库 = 一个 ERC-4626 合约 + 一个策略合约。用户存 USDC 拿份额；策略把 USDC 借给借贷协议赚利息；利息让每份额值的 USDC 慢慢变多。链下的 keeper 负责结算，索引器负责记录份额价格历史，多签和时间锁负责管理权限。')}
${call('analogy', `<p>金库像一个合伙基金：每个人按投入的钱拿到对应的“基金份额”。基金经理（策略）把钱拿去放贷。利息进账后，基金总值变大，每一份额的净值上升。你赎回时按当时的净值拿钱。</p>
<p>比喻的局限：真实基金有托管行、审计师和监管机构盯着；链上金库只有代码、多签和你写的监控。代码错了，没有人帮你把钱追回来。</p>`)}
${art('一图看懂：用户资金只在金库、策略、借贷协议之间流动', 660, 390, [
  S.zone(0, 6, 480, 98, { t: '链下（只读写，不托管资金）' }),
  S.box(12, 36, 128, 56, { k: 'info', icon: 'phone', t: '前端', s: '存取 · 曲线' }),
  S.box(172, 36, 128, 56, { k: 'info', icon: 'db', t: '索引器', s: '份额价格快照' }),
  S.box(332, 36, 128, 56, { k: 'info', icon: 'bot', t: 'keeper', s: '结算 / 再平衡' }),
  S.zone(0, 122, 660, 220, { t: '链上（资金所在）' }),
  S.box(12, 160, 100, 56, { k: 'plain', icon: 'person', t: '用户', s: '存款人' }),
  S.box(200, 160, 150, 56, { k: 'key', icon: 'lock', t: 'YieldVault', s: 'ERC-4626 金库', mono: 1 }),
  S.box(410, 160, 110, 56, { k: 'warn', t: '策略合约', s: '借出 USDC' }),
  S.box(552, 160, 100, 56, { k: 'idle', dash: 1, icon: 'bank', t: '借贷协议', s: '外部依赖' }),
  S.box(200, 270, 150, 56, { k: 'ok', icon: 'shield', t: '多签 + 时间锁', s: '改参数要等 48 小时' }),
  S.arrow(112, 188, 198, 188, { k: 'key', both: 1, label: 'USDC ⇄ 份额' }),
  S.arrow(350, 188, 408, 188, { k: 'warn', both: 1, label: 'USDC' }),
  S.arrow(520, 188, 550, 188, { k: 'warn', both: 1 }),
  S.arrow(240, 160, 240, 94, { k: 'info', label: '读事件' }),
  S.arrow(172, 64, 142, 64, { k: 'info' }),
  S.arrow(340, 94, 320, 158, { k: 'info', dash: 1 }),
  S.arrow(275, 268, 275, 218, { k: 'ok', label: '管理权限' }),
  S.text(330, 370, '份额价格 = totalAssets ÷ totalSupply：利息进账，每份额值的 USDC 变多', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '用户的 USDC 走 用户 → 金库 → 策略 → 借贷协议；利息沿原路回到金库，让份额价格慢慢上升。'],
  ['key', '金库是唯一的核心：份额记账、存款上限、业绩费都在它里面。链下三个组件不托管任何资金。'],
  ['risk', '借贷协议和策略是最大的外部依赖，出问题时 totalAssets 会下降，所以需要亏损熔断和紧急撤回。'],
  ['limit', '管理权限只给多签加时间锁：能改参数，但合约里没有“转走用户资产”的函数。']
], '链下有前端、索引器和 keeper，不托管资金；链上用户把 USDC 存入金库换份额，金库把资金交给策略，策略存入借贷协议赚利息；多签加时间锁管理金库权限。', 'm12-2')}

<h2>2. 项目目标与验收标准（示例）</h2>
${tbl(['类别', '验收标准（示例数字）'], [
  ['功能', '用户可存入、取出、查看份额价格历史；keeper 每 24 小时结算一次收益；守护者可在 1 笔交易内暂停存款'],
  ['正确性', '任意存入后立即全额取出，取回金额 ≥ 存入 − 1 个最小单位；国库只通过业绩费获得份额'],
  ['安全', '空金库捐赠攻击下，后续存款人损失 &lt; 0.01%；所有管理操作经过 Safe 2/3 签名 + 48 小时时间锁'],
  ['性能', '索引器延迟 &lt; 30 秒；API P95 &lt; 300 ms；前端首屏 &lt; 3 秒'],
  ['运维', '份额价格单次下跌 &gt; 0.5% 在 5 分钟内告警；守护者从告警到暂停 &lt; 15 分钟（演练测得）']
])}

<h2>3. 需求拆解与用户故事</h2>
${tbl(['角色', '用户故事', '优先级'], [
  ['存款用户', '我想存入 USDC，看到预计拿到多少份额，并在一笔或两笔交易内完成授权和存入', 'Must'],
  ['存款用户', '我想随时取出，看到能取多少、要不要等', 'Must'],
  ['存款用户', '我想看到过去 30 天的份额价格曲线和年化收益', 'Should'],
  ['Keeper', '我每天检查一次收益，收益覆盖 Gas 的 3 倍以上才结算', 'Should'],
  ['守护者', '我收到告警后能立即暂停新存款，并把资金从策略撤回金库', 'Must'],
  ['管理员（多签）', '我修改费率、上限或策略时，要经过时间锁，用户能提前看到', 'Must'],
  ['合规', '受限地区或被制裁地址打开前端时，看到限制提示，不能发起交易', 'Should']
])}

<h2>4. 系统架构</h2>
${layers('收益金库的六层架构', [
  { name: '前端', sub: 'React + wagmi + viem', chips: ['存入 / 取出', '收益曲线', '地域与地址筛查提示'] },
  { name: 'API 与索引器', sub: 'Ponder（或 Go 日志轮询器）+ PostgreSQL', chips: ['事件入库', '份额价格快照', 'REST / GraphQL'] },
  { name: 'Keeper 与监控', sub: '链下进程', chips: ['harvest 结算', 'rebalance 再平衡', '告警规则'] },
  { name: '金库合约', sub: 'ERC-4626 + AccessControl + Pausable', chips: ['份额记账', '存款上限', '业绩费', '亏损熔断'], kind: 'key' },
  { name: '策略合约', sub: '借贷协议供应（Aave V3 测试网或 Mock）', chips: ['deposit / withdraw', 'totalAssets'], kind: 'risk' },
  { name: '治理与权限', sub: 'Safe 多签 + TimelockController', chips: ['管理员 = 时间锁', '守护者 = 运维多签', 'keeper = 热钱包'] }
], [
  ['flow', '用户资金只在“金库 ↔ 策略 ↔ 借贷协议”之间流动。链下组件（索引器、keeper、前端）都不托管资金。'],
  ['key', '份额价格由链上 <code>totalAssets / totalSupply</code> 决定，不来自预言机。预言机只用于前端显示美元价值和风控告警。'],
  ['risk', '策略层是最大的外部依赖：借贷协议出问题，金库的 totalAssets 会下降。所以要有亏损熔断和紧急撤回。'],
  ['limit', '本设计只支持一种资产、一个策略。多策略分配是扩展方向，不在 MVP 内。']
], ['读事件与状态', '定时调用', '记账与调用', '供应与赎回', '管理权限'])}
${recall('<p>借贷协议怎样计息、aToken 余额为什么会自己增长，见 <a href="#m02-11">M05.3 借贷协议深入</a>。多签的门限签名与操作流程见 <a href="#m03-4">M08.4 多签钱包</a>。索引器的游标、重组回滚与幂等入库见 <a href="#m01-8">M01.8 索引器工程</a>，这里不再展开。</p>')}

<h3>4.1 角色与权限</h3>
${tbl(['角色', '持有者（示例）', '能做什么', '不能做什么'], [
  ['DEFAULT_ADMIN_ROLE', 'TimelockController（最短延迟 48 小时）', '换策略、改费率（上限 20%）、改存款上限、解除暂停、授予角色', '不能直接转走用户资产（合约里没有这样的函数）'],
  ['时间锁的 Proposer / Executor', '管理 Safe（2/3）', '向时间锁提交与执行操作', '不能跳过延迟'],
  ['GUARDIAN_ROLE', '运维 Safe（1/2，快速响应）', '暂停、把资金从策略撤回金库', '不能解除暂停，不能改参数'],
  ['KEEPER_ROLE', 'keeper 热钱包（只放少量 Gas）', 'harvest、rebalance', '不能改参数、不能暂停'],
  ['国库 treasury', '管理 Safe', '接收业绩费份额', '—']
])}
${call('info', '<p>设计原则是<strong>“停得快，开得慢”</strong>：暂停只要守护者一个签名，几分钟内完成；解除暂停和改参数要走 48 小时时间锁。攻击者拿到守护者密钥，最多只能让金库停摆，不能偷钱。时间锁的 <code>schedule</code>、<code>execute</code>、<code>cancel</code> 与三种角色见 OpenZeppelin 文档' + cite('OpenZeppelin：TimelockController API', 'https://docs.openzeppelin.com/contracts/5.x/api/governance#TimelockController') + '。</p>')}

<h3>4.2 关键调用顺序</h3>
${mm('存入、结算收益、取出的调用顺序', `
sequenceDiagram
  participant U as 用户
  participant FE as 前端
  participant V as 金库合约
  participant S as 策略合约
  participant P as 借贷协议
  participant K as Keeper
  U->>FE: 输入 1000 USDC
  FE->>V: 读 previewDeposit 显示预计份额
  U->>V: approve 然后 deposit
  V-->>U: 铸造份额 发出 Deposit 事件
  K->>V: rebalance 保留 10 百分比闲置
  V->>S: deposit 900 USDC
  S->>P: supply
  Note over P: 利息按秒累积
  K->>V: harvest 每 24 小时
  V->>S: 读 totalAssets
  V-->>V: 计算收益 给国库铸业绩费份额 发出 Harvest 事件
  U->>V: redeem 全部份额
  V->>S: 闲置不够时 withdraw 差额
  S->>P: withdraw
  V-->>U: 转出 USDC 发出 Withdraw 事件
`, [
  ['flow', '存入时资金先留在金库（闲置），由 keeper 的 rebalance 统一送进策略。这样每笔存款不用多付策略交互的 Gas。'],
  ['key', 'harvest 只做“记账”：比较现在和上次的 totalAssets，算出收益，按收益铸业绩费份额。它不移动资金。'],
  ['fail', '借贷协议的流动性被借光时，策略 withdraw 会失败，用户的大额取出会 revert。前端要先读 <code>maxWithdraw</code> 并提示。'],
  ['risk', 'keeper 长期不调用 harvest，不会丢钱，但份额价格对外显示的收益会滞后。真正危险的是 harvest 的收益计算把“新存款”误算成收益，见 M15.3。']
])}

<h3>4.3 金库状态机</h3>
${mm('金库运行状态', `
stateDiagram-v2
  state "正常运行" as Active
  state "已暂停 只能取出" as Paused
  state "紧急撤回 资金回到金库" as Exited
  state "退役 只能取出" as Retired
  [*] --> Active: 部署并通过时间锁设置策略
  Active --> Paused: 守护者 pause 或 亏损超限自动暂停
  Paused --> Exited: 守护者 emergencyExit
  Paused --> Active: 时间锁 unpause
  Exited --> Active: 时间锁设置新策略并 unpause
  Exited --> Retired: 时间锁把存款上限设为 0
  Retired --> [*]
`, [
  ['key', '在任何状态下，用户都能取出。暂停只停新存款和策略操作，不锁用户的钱。'],
  ['flow', '自动暂停的触发条件是 harvest 发现单次亏损超过 maxLossBps（示例 0.5%）。'],
  ['risk', '如果把“暂停”设计成同时禁止取出，守护者密钥被盗或误操作时，用户资金会被冻结。只有在策略本身被攻击、取出会放大损失时，才考虑禁止取出，并写进威胁模型。'],
  ['limit', 'Exited 状态下资金是闲置 USDC，没有收益。长时间停留会让用户转走资金。']
])}

<h2>5. 份额数学与通胀攻击</h2>
<p>ERC-4626 接口与收益代币化的背景见 <a href="#m02-64">M05.5 收益金库与收益代币化</a>。</p>
<p>ERC-4626 规定：<code>convertToShares</code> 和 <code>convertToAssets</code> 必须向下取整；会改变状态的函数要“对金库有利”地取整，也就是用户少拿${cite('EIP-4626: Tokenized Vaults', 'https://eips.ethereum.org/EIPS/eip-4626')}。基本公式是：</p>
${code('TEXT', `
份额价格  pps    = totalAssets / totalSupply
存入得份额 shares = assets × totalSupply / totalAssets      （向下取整）
取出得资产 assets = shares × totalAssets / totalSupply      （向下取整）
`)}
<p><strong>算一算（示例）：份额价格与业绩费。</strong>金库有 1,000,000 USDC，1,000,000 份额，pps = 1.000000。一周后策略利息让 totalAssets 变成 1,001,000 USDC，业绩费 10%。</p>
${steps([
  '收益 = 1,001,000 − 1,000,000 = 1,000 USDC；业绩费 = 1,000 × 10% = 100 USDC。',
  '业绩费不转 USDC，而是给国库铸份额。要求铸完后国库份额正好值 100 USDC：feeShares = 100 × 1,000,000 ÷ (1,001,000 − 100) ≈ 99.91 份额。',
  '铸完后 totalSupply = 1,000,099.91，pps = 1,001,000 ÷ 1,000,099.91 ≈ 1.000900。',
  '用户的周收益 = 0.09%，年化约 0.09% × 52 ≈ 4.68%（未复利，示例）。没有业绩费时是 0.10%，年化约 5.2%。'
])}
<h3>5.1 首位存款人通胀攻击</h3>
${recall('<p><a href="#m02-8">M02.9 合约安全 II</a> 已经介绍过这种攻击：攻击者向空金库存 1 wei 拿 1 份额，再直接转账“捐赠”大量资产，让每份额极贵，后来者的份额被向下取整成 0。这里用数字把它算清楚，并说明我们的防护参数怎样选。</p>')}
<p>OpenZeppelin 的 ERC4626 实现用<strong>虚拟份额与虚拟资产</strong>防护：换算时分子加 <code>10^offset</code> 个虚拟份额，分母加 1 个虚拟资产。源码中的公式是 <code>assets × (totalSupply + 10^offset) / (totalAssets + 1)</code>，offset 由可重写的 <code>_decimalsOffset()</code> 返回${cite('OpenZeppelin Contracts：ERC4626.sol 源码', 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC4626.sol')}。官方文档说明：offset 为 0 时攻击已无利可图；offset 越大，攻击者要承受的损失越大，可以比能偷到的金额大几个数量级${cite('OpenZeppelin 文档：ERC-4626', 'https://docs.openzeppelin.com/contracts/5.x/erc4626')}${cite('OpenZeppelin：A Novel Defense Against ERC4626 Inflation Attacks', 'https://www.openzeppelin.com/news/a-novel-defense-against-erc4626-inflation-attacks')}。</p>
<p><strong>算一算（示例，USDC 6 位小数，单位为最小单位）：</strong>攻击者先存 1，再捐赠 10,000 USDC（10¹⁰）；受害者随后存入 10,000 USDC。</p>
${tbl(['实现', '攻击者份额', '受害者份额', '受害者可取回', '攻击者结果'], [
  ['朴素公式（无虚拟份额）', '1', '10¹⁰ × 1 ÷ (10¹⁰ + 1) = <strong>0</strong>', '0 USDC，损失 100%', '独占约 20,000 USDC，赚 10,000'],
  ['OpenZeppelin，offset = 0', '1', '1', '约 6,666.67 USDC', '也只能取回约 6,666.67，亏约 3,333'],
  ['OpenZeppelin，offset = 6（本项目）', '1,000,000', '1,999,999', '约 9,999.9975 USDC，损失约 0.0025', '取回约 5,000，亏约 5,000']
])}
${mm('为什么虚拟份额让攻击亏本', `
flowchart LR
  A["攻击者存 1 wei<br/>再捐赠 10000 USDC"] --> B{"换算公式里<br/>有虚拟份额吗"}
  B -->|"没有"| C["受害者份额取整为 0<br/>捐赠和存款都归攻击者"]:::risk
  B -->|"有 offset 6"| D["10 的 6 次方个虚拟份额<br/>分走一半捐赠"]:::ok
  D --> E["受害者只损失取整误差"]
  D --> F["攻击者亏掉约一半捐赠"]
`, [
  ['key', '虚拟份额像一个“永远不取钱的隐形股东”。攻击者捐赠的资产有一部分永久归它，攻击者自己拿不回来。'],
  ['flow', 'offset 越大，虚拟股东占的比例越大，受害者的取整误差越小，攻击者的损失越大。'],
  ['limit', '虚拟份额解决的是“后来者被取整吃掉”。它不能防止别的合约把你的 <code>convertToAssets</code> 当成价格预言机后被操纵，见 5.2。'],
  ['risk', 'offset 会让份额的 decimals 变成资产 decimals + offset（本例 6 + 6 = 12）。前端和索引器显示份额数量时要用 12 位，不是 6 位。']
])}
${call('deep', '<p>另一种常见防护是部署时由团队先存入一笔“死份额”（例如铸给不可用地址），让金库从不为空。OpenZeppelin 的文章把它与虚拟份额做了比较' + cite('OpenZeppelin：A Novel Defense Against ERC4626 Inflation Attacks', 'https://www.openzeppelin.com/news/a-novel-defense-against-erc4626-inflation-attacks') + '。本项目两者都做：offset = 6，并在部署脚本里由国库先存 1 USDC。</p>')}
<h3>5.2 别人怎样读你的份额价格</h3>
<p>你的金库份额以后可能被别的协议当作抵押品，它们会用 <code>convertToAssets</code> 给份额定价。EIP-4626 明确提醒：<code>preview</code> 类函数可以通过改变链上状态被操纵，不一定适合当价格预言机${cite('EIP-4626: Tokenized Vaults', 'https://eips.ethereum.org/EIPS/eip-4626')}。2025 年 6 月 Resupply 事件中，攻击者向一个新建、流动性很低的 ERC-4626 金库捐赠资产，抬高其兑换率，使借贷协议的计算取整为 0、绕过健康检查，借走约 960 万美元${cite('The Block：Resupply 被盗逾 900 万美元', 'https://www.theblock.co/news/ecosystems/2025-06-26-resupply-exploited-blocksec-359764')}${cite('BlockSec：Resupply 攻击深度分析', 'https://blocksec.com/blog/in-depth-analysis-and-reflections-on-the-resupply-protocol-attack-incident')}。所以在 README 的“集成须知”里写明：份额价格可以被捐赠瞬间抬高，集成方要用时间加权或限制单块变化。</p>

<h2>6. 风控参数</h2>
${tbl(['参数', '示例值', '作用', '谁能改'], [
  ['depositCap', '100,000 USDC', '测试网阶段限制总规模，控制最坏损失', '时间锁'],
  ['bufferBps', '1000（10%）', '金库保留的闲置资金比例，应付日常取出', '时间锁'],
  ['performanceFeeBps', '1000（10%），硬上限 2000', '收益的业绩费', '时间锁，合约内校验上限'],
  ['maxLossBps', '50（0.5%）', '单次 harvest 亏损超过它，自动暂停', '时间锁'],
  ['最小 harvest 收益', '≥ 3 × 预估 Gas 成本', '避免 keeper 白花 Gas', 'keeper 配置（链下）'],
  ['USDC 脱锚告警', 'Chainlink USDC/USD &lt; 0.98', '只告警，不进入份额计算', '监控配置（链下）']
])}
${call('warn', '<p>不要把预言机价格写进 <code>totalAssets</code>。金库的资产和份额都以 USDC 计，份额价格只需要“金库里有多少 USDC”。把预言机放进记账，等于给攻击者多开一个操纵入口。读 Chainlink 价格做告警时，要检查 <code>updatedAt</code> 是否超过该喂价的心跳时间 ' + tag('惯例') + '。</p>')}

<h2>7. 技术选型</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['合约框架', 'Foundry', 'Hardhat', '测试用 Solidity 写，自带模糊与不变量测试，见 <a href="#m02-4">M02.4 开发工具链</a>'],
  ['金库基类', 'OpenZeppelin ERC4626（v5）', 'Solmate ERC4626', '内置虚拟份额防护，经过广泛审计'],
  ['策略', 'Aave V3 测试网市场或 MockStrategy', 'Compound 测试网', 'Aave 有官方测试网市场和水龙头${cite("Aave 文档：Testing & Debugging", "https://aave.com/docs/aave-v3/smart-contracts/testing-and-debugging")}；不稳定时用 Mock 保证演示'],
  ['权限', 'Safe + TimelockController', '单签 EOA', '单签不满足安全评审标准'],
  ['索引器', 'Ponder（TypeScript）', 'Go 日志轮询器（<a href="#m01-8">M01.8</a>）、The Graph', 'Ponder 一个进程完成索引 + GraphQL，开发最快'],
  ['前端', 'React + wagmi + viem', 'ethers.js', '与 <a href="#m07-10">M03.10</a> 一致'],
  ['监控', 'OpenZeppelin Monitor（开源）或自写规则', 'Tenderly、Forta', 'Defender 托管服务按官方计划于 2026-07-01 停止服务，官方推荐自托管开源 Monitor${cite("OpenZeppelin：Doubling Down on Open Source and Phasing Out Defender", "https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender")}']
])}
${call('info', '<p>Aave 测试网市场的 USDC 是 Aave 自己发的测试代币，不是 Circle 在 Sepolia 上发的 USDC。地址以 Aave 官方地址页为准' + cite('Aave 文档：Addresses', 'https://aave.com/docs/resources/addresses') + '，不要从第三方博客复制。</p>')}

<h2>8. 数据模型</h2>
<h3>8.1 合约存储</h3>
${tbl(['变量', '类型', '说明'], [
  ['strategy', 'IStrategy', '当前策略合约'],
  ['depositCap', 'uint256', '总资产上限'],
  ['bufferBps / performanceFeeBps / maxLossBps', 'uint16', '风控参数，单位 bp（万分之一）'],
  ['treasury', 'address', '业绩费接收地址'],
  ['lastTotalAssets', 'uint256', '上次结算后的总资产，用于计算收益。存入和取出时必须同步加减'],
  ['继承自 ERC20 / AccessControl / Pausable', '—', '份额余额、角色、暂停标志']
])}
<h3>8.2 索引数据库（PostgreSQL）</h3>
${code('SQL', `
-- 每个链上事件一行。唯一键保证重放和重组恢复时不会重复入库
CREATE TABLE vault_event (
  chain_id     INT         NOT NULL,
  tx_hash      TEXT        NOT NULL,
  log_index    INT         NOT NULL,
  block_number BIGINT      NOT NULL,
  block_time   TIMESTAMP   NOT NULL,
  kind         TEXT        NOT NULL,          -- deposit / withdraw / harvest / paused
  account      TEXT,                          -- owner 地址，harvest 为空
  assets       NUMERIC(78) NOT NULL DEFAULT 0, -- 原始最小单位，不做小数换算
  shares       NUMERIC(78) NOT NULL DEFAULT 0,
  PRIMARY KEY (chain_id, tx_hash, log_index)
);
-- 份额价格快照：每个事件之后记一次
CREATE TABLE share_price (
  chain_id      INT         NOT NULL,
  block_number  BIGINT      NOT NULL,
  block_time    TIMESTAMP   NOT NULL,
  total_assets  NUMERIC(78) NOT NULL,
  total_supply  NUMERIC(78) NOT NULL,
  pps_1e18      NUMERIC(78) NOT NULL,          -- 每 1 份额（12 位）对应的资产 × 1e18
  PRIMARY KEY (chain_id, block_number)
);
-- 用户持仓（由事件累加，可随时从 vault_event 重建）
CREATE TABLE position (
  chain_id   INT         NOT NULL,
  account    TEXT        NOT NULL,
  shares     NUMERIC(78) NOT NULL,
  net_assets NUMERIC(78) NOT NULL,             -- 累计存入 − 累计取出，用于算盈亏
  PRIMARY KEY (chain_id, account)
);
`)}
<p>金额一律用 <code>NUMERIC(78)</code> 存最小单位（uint256 最多 78 位十进制），换算成小数只在 API 输出或前端显示时做。原因见 <a href="#m07-4">M03.4 单位与精度</a>。</p>

<h2>9. 接口设计</h2>
${tbl(['类型', '接口', '说明'], [
  ['合约 · 用户', '<code>deposit(assets, receiver)</code> <code>mint</code> <code>withdraw(assets, receiver, owner)</code> <code>redeem</code>', 'ERC-4626 标准函数'],
  ['合约 · 读', '<code>totalAssets()</code> <code>convertToAssets(shares)</code> <code>maxDeposit</code> <code>maxWithdraw(owner)</code> <code>previewDeposit</code>', '前端显示与校验'],
  ['合约 · keeper', '<code>harvest()</code> <code>rebalance()</code>', '只允许 KEEPER_ROLE'],
  ['合约 · 守护者', '<code>pause()</code> <code>emergencyExit()</code>', '只允许 GUARDIAN_ROLE'],
  ['合约 · 管理员', '<code>setStrategy</code> <code>setParams</code> <code>unpause</code>', '只允许时间锁'],
  ['事件', '<code>Deposit</code> <code>Withdraw</code>（标准）、<code>Harvest(profit, loss, feeShares, totalAssets)</code>、<code>ParamsChanged</code>、<code>StrategyChanged</code>、<code>Paused</code>', '索引器与监控的输入'],
  ['REST', '<code>GET /v1/vaults/{addr}</code>', 'TVL、pps、7 日与 30 日年化、是否暂停'],
  ['REST', '<code>GET /v1/vaults/{addr}/share-price?from=&amp;to=&amp;interval=1h</code>', '收益曲线数据'],
  ['REST', '<code>GET /v1/users/{addr}/positions</code>', '持仓、成本、未实现盈亏']
])}
${call('info', '<p>API 只做“读”。所有写操作由用户钱包直接调用合约，后端不碰私钥、不转发交易。这样后端被攻破也不会丢用户资金，最多显示错误数据。前端在提交前用 <code>simulateContract</code> 再读一次链上状态，不完全信任 API。</p>')}

<h2>10. 威胁模型摘要</h2>
${tbl(['编号', '威胁', '影响', '防护', '测试'], [
  ['TH-01', '首位存款人通胀攻击', '后来者份额被取整吃掉', 'offset = 6 + 部署时种子存款', 'T-07 单元测试；I-02 不变量'],
  ['TH-02', 'harvest 把新存款算成收益', '国库多收业绩费，用户被稀释', '存入/取出时同步 lastTotalAssets', 'T-11 单元测试；I-03 不变量'],
  ['TH-03', '策略亏损或被攻击', 'totalAssets 下降', 'maxLossBps 自动暂停；守护者 emergencyExit；存款上限', 'T-14 模拟亏损'],
  ['TH-04', '管理员换成恶意策略', '资金被策略转走', '时间锁 48 小时 + 监控 CallScheduled 事件 + 用户可退出', 'T-16 未经时间锁调用 revert'],
  ['TH-05', 'keeper 私钥泄露', '攻击者乱调 harvest / rebalance', 'keeper 只有这两个权限；两者都不能转出资金', 'T-17 权限测试'],
  ['TH-06', '份额价格被别的协议当预言机', '集成方被捐赠操纵', 'README 集成须知；监控单块 pps 跳变', '文档项'],
  ['TH-07', '借贷协议流动性枯竭', '大额取出失败', 'bufferBps 闲置资金；前端读 maxWithdraw 提示', 'T-19'],
  ['TH-08', '前端被篡改或钓鱼仿站', '用户签了错误交易', '发布产物哈希、CSP、合约地址写死并在 README 公示', '见 <a href="#m07-8">M03.8 前端安全</a>'],
  ['TH-09', '受限地区或制裁地址使用', '合规风险', '前端地域提示 + 地址筛查', '见 <a href="#m11-6">M12.8</a>']
])}
${cases([
  ['Sonne Finance：新市场上线时被捐赠攻击', '2024-05-15', '<p>Sonne Finance 是部署在 Optimism 上的 Compound v2 分叉借贷协议。团队通过多签排队了一个 2 天时间锁提案，用来新建 VELO 市场并设置抵押系数。时间锁到期后，攻击者抢先执行了这些交易，在新的空市场上用已知的“捐赠攻击”操纵兑换率，造成约 2,000 万美元损失，协议随后暂停了 Optimism 上的市场。</p><p>启示：一、“空市场 / 空金库”是最危险的时刻，部署、种子存款、开启使用要放进<strong>同一笔交易</strong>或用权限保护执行；二、时间锁的 execute 如果对任何人开放，攻击者可以替你按下按钮并插入自己的交易。</p>', [['The Block 报道', 'https://www.theblock.co/news/ecosystems/2024-05-15-lending-protocol-sonne-finance-faces-20-million-exploit-pauses-markets-on-optimism-294508'], ['Sonne 官方复盘', 'https://medium.com/@SonneFinance/post-mortem-sonne-finance-exploit-12f3daa82b06']]]
], 'h3')}

${tryit(`<p><strong>动手练习：</strong>在区块浏览器上读一个真实 ERC-4626 金库的份额价格。</p>
${steps([
  '在 Etherscan 上搜索一个声明支持 ERC-4626 的金库合约（例如某个主流协议的储蓄金库），打开 Read Contract 标签。',
  '读 <code>asset()</code>、<code>decimals()</code>、<code>totalAssets()</code>、<code>totalSupply()</code>。',
  '在 <code>convertToAssets</code> 里输入 <code>10^decimals</code>（1 个完整份额），记下结果。',
  '用 totalAssets ÷ totalSupply 手算一遍份额价格，和 convertToAssets 的结果比较。',
  '检查份额 decimals 是否大于资产 decimals，推断它是否使用了 offset。'
])}
<p>预期结果：两种算法的结果只差取整误差。如果份额 decimals 比资产多，说明它很可能用了虚拟份额偏移（这是推断，以源码为准）。</p>`)}

${exercises([
  ['金库有 500,000 USDC、480,000 份额，用户存入 12,000 USDC（不考虑虚拟份额）。他得到多少份额？', '<p>pps = 500,000 ÷ 480,000 ≈ 1.041667。份额 = 12,000 × 480,000 ÷ 500,000 = 11,520 份额，向下取整。</p>'],
  ['为什么守护者只能暂停、不能解除暂停？如果守护者也能解除暂停，会多出什么风险？', '<p>暂停是降低风险的动作，越快越好；解除暂停是重新暴露风险的动作，需要多人审议。如果守护者能解除暂停，攻击者拿到守护者密钥后，可以在团队暂停后立刻解除，让攻击继续。</p>'],
  ['给威胁模型补一行：“业绩费率被设成 100%”。写出影响、防护和测试。', '<p>影响：所有收益归国库，用户收益为 0。防护：合约里 <code>MAX_FEE_BPS = 2000</code> 的硬上限，超过则 revert；改费率必须经过时间锁，用户能提前 48 小时看到。测试：调用 <code>setParams</code> 传入 2001 bp，断言 revert。</p>'],
  ['索引表里为什么不直接存“份额价格（小数）”而是存 total_assets、total_supply 和 pps_1e18？', '<p>原始整数可以精确重算，小数会累积误差；保存分子分母还能在发现计算错误后重算 pps，不用重新索引全部区块。</p>']
])}
${checklist([
  '能画出六层架构，并说出哪几层托管资金、哪几层不托管。',
  '能写出四种角色的权限表，并解释“停得快，开得慢”。',
  '能用数字算出有无虚拟份额时通胀攻击的结果。',
  '能写出 vault_event、share_price 两张表的 DDL 和唯一键。',
  '威胁模型的每一行都有测试编号或文档项。'
])}
${mistakes([
  ['份额价格要用预言机来算。', '份额价格就是 totalAssets ÷ totalSupply，都以 USDC 计。预言机只用于美元显示和告警。'],
  ['用了 OpenZeppelin ERC4626 就不用管通胀攻击。', '虚拟份额只保护你的存款人。别的协议用你的份额价格当预言机时，仍然可能被捐赠操纵。'],
  ['暂停就应该把所有函数都停掉。', '暂停应只停存款和策略操作，保留取出。否则守护者误操作或被盗会冻结用户资金。'],
  ['keeper 钱包权限越大越方便。', 'keeper 是热钱包，最容易泄露。它只应有 harvest 和 rebalance，而且这两个函数都不能转出资金。'],
  ['部署后再找时间存种子资金。', '部署和种子存款之间的空窗期就是攻击窗口。放进同一个部署脚本、同一个区块内完成。']
])}
${recap([
  '架构六层：前端、API 与索引器、keeper 与监控、金库、策略、治理权限。只有金库和策略托管资金。',
  '份额价格 = totalAssets ÷ totalSupply；业绩费以铸份额的方式收取。',
  'offset = 6 的虚拟份额让通胀攻击亏本，受害者只损失取整误差；部署时再加种子存款。',
  '权限设计“停得快，开得慢”：守护者能暂停，解除暂停和改参数走时间锁。',
  '威胁模型的每一项都要有防护和测试编号。'
])}
${quiz([
  { q: '本设计中，份额价格从哪里来？', o: ['Chainlink USDC/USD 喂价', '索引器计算后写回合约', 'totalAssets ÷ totalSupply', 'keeper 每天上报'], a: 2, why: '份额价格由链上状态直接决定。预言机只用于显示和告警；索引器和 keeper 都不能写入价格。' },
  { q: '使用 offset = 6 时，下列哪一项正确？', o: ['份额 decimals 仍是 6', '份额 decimals 变成 12', '攻击者能赚到受害者的一半存款', '金库不能再收业绩费'], a: 1, why: 'OpenZeppelin ERC4626 的 decimals = 资产 decimals + offset，所以 USDC 金库的份额是 12 位。攻击会亏本，业绩费不受影响。' },
  { q: '守护者密钥被盗，攻击者最多能做什么？', o: ['转走全部资金', '把业绩费改成 100%', '暂停金库并把资金撤回金库', '换成恶意策略'], a: 2, why: '守护者只有 pause 和 emergencyExit。改参数和换策略要经过时间锁。' },
  { q: 'Sonne Finance 事件给部署流程最直接的启示是？', o: ['不要用时间锁', '空市场是攻击窗口，部署、种子存款与开启要原子完成', '不要用 Compound 分叉', '多签门限要更高'], a: 1, why: '攻击发生在新市场刚创建、还是空市场时。时间锁本身没问题，问题在执行顺序和空窗期。' },
  { q: '后端 API 在本设计中负责什么？', o: ['代用户签名并广播存款', '保存用户私钥', '只读：提供历史与聚合数据', '决定份额价格'], a: 2, why: '写操作全部由用户钱包直接调用合约。API 被攻破最多显示错误数据，不会丢钱。' }
])}
${terms([
  ['代币化金库', 'Tokenized Vault (ERC-4626)', '以 ERC-20 份额表示存款占比、接口统一的金库标准。'],
  ['份额价格', 'Price per share (PPS)', '每 1 份额可以兑换的资产数量，等于总资产除以总份额。'],
  ['通胀攻击', 'Inflation / donation attack', '向空金库捐赠资产抬高份额价格，让后来者份额被向下取整的攻击。'],
  ['虚拟份额偏移', 'Virtual shares / decimals offset', '在换算公式中加入不属于任何人的份额与资产，使通胀攻击亏本。'],
  ['业绩费', 'Performance fee', '按收益的一定比例收取的费用，本项目以铸份额的方式给国库。'],
  ['守护者', 'Guardian', '只能执行暂停等降风险操作的快速响应角色。'],
  ['亏损熔断', 'Loss circuit breaker', '结算时发现亏损超过阈值就自动暂停的机制。'],
  ['闲置缓冲', 'Idle buffer', '金库保留在本合约、不投入策略的资产比例，用于应付取出。']
])}
` });
CUR = 'm12-3';
addCh({ id: 'm12-3', nav: '实现：合约与前后端', title: 'M15.3 实现：合约、前端与索引', desc: '金库与策略合约、Foundry 单元/模糊/不变量测试、部署脚本、前端、索引器、keeper 与 CI', html: `
<h1>M15.3 实现：合约、前端与索引</h1>
${meta(['写出基于 OpenZeppelin ERC4626 的金库合约，包括虚拟份额偏移、存款上限、业绩费和亏损熔断。', '为金库写单元测试、模糊测试和带 handler 的不变量测试，并让每个测试对应威胁模型编号。', '把合约事件接到 Ponder 索引器、前端和 keeper，并用 CI 把编译、测试、静态分析和 ABI 一致性串起来。'], '前置：<a href="#m12-2">M15.2 设计：链上收益金库产品</a>、<a href="#m02-4">M02.4 开发工具链</a>、<a href="#m07-5">M03.5 写合约</a>')}
${beginner(`<p><strong>单元测试（Unit test）</strong>：给一个函数固定输入，检查输出是否符合预期。</p>
<p><strong>模糊测试（Fuzz test）</strong>：测试框架自动生成大量随机输入，反复调用同一个测试函数，寻找让断言失败的输入。</p>
<p><strong>不变量测试（Invariant test）</strong>：框架随机组合调用一串函数，每次调用后检查“永远应该成立”的性质，例如“总资产 ≥ 所有份额可兑换的资产”。</p>
<p><strong>Handler（处理器）</strong>：不变量测试里的一个辅助合约。它把随机输入整理成合理的调用（例如金额不超过余额），避免框架把时间浪费在必然失败的调用上。</p>
<p><strong>CI（持续集成）</strong>：每次推送代码，服务器自动编译、测试、检查，失败就标红。</p>`)}

<h2>1. 一句话理解</h2>
${one('实现阶段的目标不是“写出能跑的代码”，而是“写出能被证明正确的代码”：每一条设计约束都落成一行 require 或一个 override，每一条威胁都落成一个测试，每一次推送都由 CI 重新证明一遍。')}
${call('analogy', `<p>写合约像造一座桥，测试像荷载试验。单元测试是在指定位置放一辆指定重量的卡车；模糊测试是随机放各种重量的车；不变量测试是让成千上万辆车随机上桥、刹车、掉头，同时一直盯着“桥面不能下沉超过 1 厘米”。</p>
<p>比喻的局限：桥的荷载有物理上限，合约的输入空间几乎无限。不变量测试只能大幅提高信心，不能证明没有漏洞。</p>`)}
${art('一图看懂：一个仓库五个包，ABI 是前后端共同的唯一来源', 690, 360, [
  S.zone(0, 8, 300, 344, { t: 'contracts/（Foundry）' }),
  S.box(12, 40, 276, 54, { k: 'key', t: 'src/YieldVault.sol', s: 'ERC4626 + AccessControl + Pausable', mono: 1 }),
  S.box(12, 130, 276, 54, { k: 'warn', t: 'src/AaveV3Strategy.sol', s: '实现 IStrategy，存入 Aave', mono: 1 }),
  S.box(12, 220, 276, 54, { k: 'plain', t: 'script/Deploy.s.sol', s: '部署金库、策略、时间锁', mono: 1 }),
  S.box(12, 290, 276, 54, { k: 'idle', dash: 1, t: 'test/*.t.sol', s: '单元 · 模糊 · 不变量', mono: 1 }),
  S.arrow(150, 94, 150, 128, { k: 'warn', label: 'IStrategy' }),
  S.arrow(150, 220, 150, 186, { k: 'plain', label: '部署' }),
  S.route([[288, 67], [405, 67], [405, 126]], { k: 'key', label: 'forge inspect' }),
  S.box(345, 126, 120, 60, { k: 'info', icon: 'file', t: 'abi/', s: '合约编译产物', mono: 1 }),
  S.box(530, 40, 150, 54, { k: 'info', t: 'web/', s: 'React + wagmi + viem', mono: 1 }),
  S.box(530, 129, 150, 54, { k: 'info', t: 'indexer/', s: 'Ponder + PostgreSQL', mono: 1 }),
  S.box(530, 218, 150, 54, { k: 'info', t: 'keeper/', s: 'TypeScript + viem', mono: 1 }),
  S.arrow(467, 150, 528, 70, { k: 'info' }),
  S.arrow(467, 156, 528, 156, { k: 'info' }),
  S.arrow(467, 162, 528, 242, { k: 'info' }),
  S.text(500, 318, '改合约 → 重新导出 ABI → CI 检查三处一致', { size: 13.5, b: 1, anchor: 'middle', mw: 340 })
], [
  ['flow', '合约包编译后用 forge inspect 导出 ABI；前端、索引器、keeper 三个包都只读这一个目录。'],
  ['key', '核心代码只有两个合约文件：YieldVault.sol 是金库，AaveV3Strategy.sol 是策略，两者通过 IStrategy 接口对话。'],
  ['fail', 'ABI 不一致时：索引器不报错但新字段全是空值，或前端提示函数不存在。CI 的 ABI 一致性检查就是防这个。'],
  ['limit', '图中只画了合约与三个链下包；docs/ 文档目录没有画出。']
], '左侧 contracts 目录里有 YieldVault、AaveV3Strategy、Deploy 脚本和测试；金库编译后导出 abi 目录，web、indexer、keeper 三个包都读取这一个 abi 目录。', 'm12-3')}

<h2>2. 仓库结构与工具链</h2>
${mm('单仓多包结构与 CI 流水线', `
flowchart LR
  subgraph R["capstone 仓库"]
    C["contracts<br/>Foundry"]
    W["web<br/>React wagmi viem"]
    I["indexer<br/>Ponder"]
    K["keeper<br/>TypeScript viem"]
    D["docs<br/>架构 威胁模型 测试报告"]
  end
  C -->|"forge inspect 导出 ABI"| AB["abi 目录"]
  AB --> W
  AB --> I
  AB --> K
  R --> CI{"GitHub Actions"}
  CI --> T1["forge fmt build test"]
  CI --> T2["Slither 高危为 0"]:::key
  CI --> T3["ABI 一致性检查"]
  CI --> T4["web 类型检查与构建"]
`, [
  ['flow', 'ABI 只有一个来源：合约编译产物。前端、索引器、keeper 都从同一个目录读取，CI 检查它们是否一致。'],
  ['fail', 'ABI 不一致的现象是：索引器不报错，但新字段全是空值；或前端调用时报“函数不存在”。'],
  ['key', 'Slither 高危结果为 0 是 CI 的硬门槛。中低危结果写进测试报告，说明哪些是误报、哪些接受。']
])}
${recall('<p>Foundry 的安装、<code>forge</code> / <code>cast</code> / <code>anvil</code> 的基本用法见 <a href="#m02-4">M02.4 开发工具链</a>；wagmi 与 viem 的连接钱包、读写合约流程见 <a href="#m07-2">M03.2 连接钱包</a>、<a href="#m07-3">M03.3 读合约</a>、<a href="#m07-5">M03.5 写合约</a>。本篇只给与金库相关的代码。</p>')}

<h2>3. 金库合约</h2>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface IStrategy {
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);   // 策略里的资产（含已累积利息）
    function deposit(uint256 assets) external;                // 只允许金库调用：从金库拉走资产
    function withdraw(uint256 assets) external returns (uint256); // 只允许金库调用：把资产送回金库
}

contract YieldVault is ERC4626, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    uint16 public constant MAX_FEE_BPS = 2000;               // 业绩费硬上限 20%

    IStrategy public strategy;
    address public treasury;
    uint256 public depositCap;
    uint16 public bufferBps = 1000;                          // 闲置 10%
    uint16 public performanceFeeBps = 1000;                  // 业绩费 10%
    uint16 public maxLossBps = 50;                           // 单次亏损超过 0.5% 自动暂停
    uint256 public lastTotalAssets;                          // 上次结算后的总资产

    event Harvest(uint256 profit, uint256 loss, uint256 feeShares, uint256 totalAssets);
    event ParamsChanged(uint256 depositCap, uint16 bufferBps, uint16 feeBps, uint16 maxLossBps, address treasury);
    event StrategyChanged(address oldStrategy, address newStrategy);
    error FeeTooHigh();
    error StrategyNotEmpty();
    error WrongAsset();

    constructor(IERC20 asset_, address admin, address guardian, address keeper, address treasury_, uint256 cap_)
        ERC20("Capstone Yield Vault USDC", "cyvUSDC")
        ERC4626(asset_)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);   // 部署后移交给 TimelockController
        _grantRole(GUARDIAN_ROLE, guardian);
        _grantRole(KEEPER_ROLE, keeper);
        treasury = treasury_;
        depositCap = cap_;
    }

    // TH-01：虚拟份额偏移。份额 decimals = 6 + 6 = 12
    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }

    function totalAssets() public view override returns (uint256) {
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        return address(strategy) == address(0) ? idle : idle + strategy.totalAssets();
    }

    // 暂停或达到上限时返回 0。OpenZeppelin 的 deposit 会检查它并 revert
    function maxDeposit(address) public view override returns (uint256) {
        if (paused()) return 0;
        uint256 ta = totalAssets();
        return ta >= depositCap ? 0 : depositCap - ta;
    }

    function maxMint(address receiver) public view override returns (uint256) {
        return _convertToShares(maxDeposit(receiver), Math.Rounding.Floor);
    }

    // TH-02：存入的资产不是收益，必须同步计入 lastTotalAssets
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        lastTotalAssets += assets;
    }

    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        if (idle < assets) strategy.withdraw(assets - idle); // 闲置不够时从策略补齐（策略由时间锁设置，属于受信合约）
        super._withdraw(caller, receiver, owner, assets, shares);
        lastTotalAssets = lastTotalAssets > assets ? lastTotalAssets - assets : 0;
    }

    // ---------- keeper ----------
    function harvest() external onlyRole(KEEPER_ROLE) whenNotPaused {
        uint256 nowAssets = totalAssets();
        uint256 last = lastTotalAssets;
        if (nowAssets >= last) {
            uint256 profit = nowAssets - last;
            uint256 fee = profit * performanceFeeBps / 10_000;
            uint256 feeShares;
            if (fee > 0) {
                // 按“扣费后”的价格铸份额：铸完后国库份额正好值 fee
                feeShares = fee.mulDiv(totalSupply() + 10 ** _decimalsOffset(), nowAssets - fee + 1, Math.Rounding.Floor);
                _mint(treasury, feeShares);
            }
            emit Harvest(profit, 0, feeShares, nowAssets);
        } else {
            uint256 loss = last - nowAssets;
            if (loss * 10_000 > last * maxLossBps) _pause(); // TH-03：亏损熔断，不 revert，保证暂停生效
            emit Harvest(0, loss, 0, nowAssets);
        }
        lastTotalAssets = nowAssets;
    }

    function rebalance() external onlyRole(KEEPER_ROLE) whenNotPaused {
        uint256 target = totalAssets() * bufferBps / 10_000;
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        if (idle > target) {
            uint256 amount = idle - target;
            IERC20(asset()).forceApprove(address(strategy), amount);
            strategy.deposit(amount);
        } else if (idle < target) {
            strategy.withdraw(target - idle);
        }
    }

    // ---------- 守护者：停得快 ----------
    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    function emergencyExit() external onlyRole(GUARDIAN_ROLE) {
        _pauseIfNot();
        strategy.withdraw(strategy.totalAssets()); // 把资金全部撤回金库，用户仍可取出
    }

    // ---------- 管理员（时间锁）：开得慢 ----------
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setStrategy(IStrategy next) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (next.asset() != asset()) revert WrongAsset();
        if (address(strategy) != address(0) && strategy.totalAssets() != 0) revert StrategyNotEmpty();
        emit StrategyChanged(address(strategy), address(next));
        strategy = next;
    }

    function setParams(uint256 cap_, uint16 buffer_, uint16 fee_, uint16 maxLoss_, address treasury_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (fee_ > MAX_FEE_BPS) revert FeeTooHigh();
        depositCap = cap_; bufferBps = buffer_; performanceFeeBps = fee_; maxLossBps = maxLoss_; treasury = treasury_;
        emit ParamsChanged(cap_, buffer_, fee_, maxLoss_, treasury_);
    }

    function _pauseIfNot() internal {
        if (!paused()) _pause();
    }
}
`)}
${tbl(['设计约束（M15.2）', '代码落点'], [
  ['TH-01 通胀攻击', '<code>_decimalsOffset()</code> 返回 6；部署脚本做种子存款'],
  ['TH-02 新存款被算成收益', '<code>_deposit</code> / <code>_withdraw</code> 同步加减 <code>lastTotalAssets</code>'],
  ['TH-03 策略亏损', '<code>harvest</code> 的亏损分支调用 <code>_pause()</code>，并且<strong>不 revert</strong>'],
  ['暂停时仍能取出', '只有 <code>maxDeposit</code>、<code>harvest</code>、<code>rebalance</code> 受暂停影响；<code>withdraw</code> / <code>redeem</code> 不受影响'],
  ['业绩费上限', '<code>MAX_FEE_BPS</code> 常量 + <code>FeeTooHigh</code> 错误']
])}
${call('warn', '<p>亏损分支里如果写成 <code>revert LossTooHigh()</code>，交易回滚会把 <code>_pause()</code> 一起撤销，熔断就失效了。要“记录并暂停”，而不是“拒绝”。这是 TH-03 测试必须覆盖的点。</p>')}
${call('info', '<p><code>_withdraw</code> 在销毁份额之前调用了外部的策略合约。这里没有加重入锁，因为策略只能由时间锁设置，属于受信合约，资产 USDC 也没有转账回调。如果你的策略会调用不受信的第三方合约，或资产是带回调的代币，就要继承 OpenZeppelin 的 <code>ReentrancyGuard</code>。这条判断要写进威胁模型的“接受的风险”。重入的原理见 <a href="#m02-7">M02.8 合约安全 I</a>。</p>')}

<h3>3.1 策略合约（Aave V3 供应）</h3>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStrategy} from "./YieldVault.sol";

// Aave V3 Pool 的两个函数（只声明用到的部分）
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract AaveV3Strategy is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;   // 测试网市场的 USDC（以 Aave 官方地址页为准）
    IERC20 public immutable aToken;  // 对应的 aUSDC，余额随利息自动增长
    IPool public immutable pool;
    address public immutable vault;

    constructor(IERC20 token_, IERC20 aToken_, IPool pool_, address vault_) {
        token = token_; aToken = aToken_; pool = pool_; vault = vault_;
    }

    modifier onlyVault() { require(msg.sender == vault, "only vault"); _; }

    function asset() external view returns (address) { return address(token); }

    function totalAssets() external view returns (uint256) { return aToken.balanceOf(address(this)); }

    function deposit(uint256 amount) external onlyVault {
        token.safeTransferFrom(vault, address(this), amount);
        token.forceApprove(address(pool), amount);
        pool.supply(address(token), amount, address(this), 0);
    }

    function withdraw(uint256 amount) external onlyVault returns (uint256) {
        return pool.withdraw(address(token), amount, vault); // 直接取回到金库地址
    }
}
`)}
<p>测试和本地演示用 <code>MockStrategy</code>：它持有 MockUSDC，提供 <code>simulateYield(amount)</code>（给自己铸币，模拟利息）和 <code>simulateLoss(amount)</code>（销毁自己的币，模拟亏损）。Aave 测试网不稳定或水龙头额度不够时，演示也切到 Mock，并在 README 里说明。</p>

<h2>4. 测试：从单元到不变量</h2>
${mm('测试金字塔与威胁编号', `
flowchart TB
  U["单元测试 约 30 个<br/>T-01 到 T-30 固定场景"] --> F["模糊测试 约 8 个<br/>随机金额 随机用户"]
  F --> INV["不变量测试 3 条<br/>I-01 到 I-03 随机调用序列"]:::key
  INV --> FORK["分叉测试 2 个<br/>对接真实 Aave 测试网市场"]
  TM["威胁模型 TH-01 到 TH-09"] -.->|"每项至少对应一个"| U
  TM -.-> INV
`, [
  ['flow', '越往上，单个测试覆盖的场景越多，运行越慢。CI 每次跑单元和模糊；不变量用 ci 配置跑更多轮。'],
  ['key', '威胁模型是测试的“需求文档”。先写威胁，再写测试，最后写代码让测试通过。'],
  ['limit', '分叉测试依赖外部 RPC，可能不稳定。把它们放进单独的 profile，失败时不阻塞合并，但要人工确认。']
])}
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {YieldVault} from "../src/YieldVault.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";       // 6 位小数，带 mint / burn
import {MockStrategy} from "./mocks/MockStrategy.sol";

contract YieldVaultTest is Test {
    MockUSDC usdc;
    YieldVault vault;
    MockStrategy strat;
    address admin = makeAddr("timelock");
    address guardian = makeAddr("guardian");
    address keeper = makeAddr("keeper");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address attacker = makeAddr("attacker");

    function setUp() public {
        usdc = new MockUSDC();
        vault = new YieldVault(usdc, admin, guardian, keeper, treasury, 100_000e6);
        strat = new MockStrategy(usdc, address(vault));
        vm.prank(admin);
        vault.setStrategy(strat);
    }

    function _deposit(address who, uint256 amount) internal returns (uint256 shares) {
        usdc.mint(who, amount);
        vm.startPrank(who);
        usdc.approve(address(vault), amount);
        shares = vault.deposit(amount, who);
        vm.stopPrank();
    }

    // T-07 / TH-01：空金库捐赠攻击，受害者损失 < 0.01%，攻击者亏本
    function test_T07_inflationAttackUnprofitable() public {
        _deposit(attacker, 1);
        usdc.mint(attacker, 10_000e6);
        vm.prank(attacker);
        usdc.transfer(address(vault), 10_000e6);            // 直接捐赠，不经过 deposit

        uint256 shares = _deposit(alice, 10_000e6);
        assertGt(shares, 0);
        assertGe(vault.previewRedeem(shares), 10_000e6 * 9_999 / 10_000);
        assertLt(vault.previewRedeem(vault.balanceOf(attacker)), 10_000e6);
    }

    // T-11 / TH-02：新存款不能被算成收益
    function test_T11_depositIsNotProfit() public {
        _deposit(alice, 1_000e6);
        vm.prank(keeper);
        vault.harvest();
        _deposit(bob, 5_000e6);
        vm.prank(keeper);
        vault.harvest();
        assertEq(vault.balanceOf(treasury), 0);
    }

    // T-14 / TH-03：亏损超过 0.5% 自动暂停，用户仍能取出
    function test_T14_lossPausesButWithdrawWorks() public {
        uint256 shares = _deposit(alice, 10_000e6);
        vm.prank(keeper);
        vault.rebalance();
        strat.simulateLoss(100e6);                           // 亏损 1%
        vm.prank(keeper);
        vault.harvest();
        assertTrue(vault.paused());
        assertEq(vault.maxDeposit(bob), 0);
        vm.prank(alice);
        uint256 got = vault.redeem(shares, alice, alice);
        assertApproxEqAbs(got, 9_900e6, 1);
    }

    // T-16 / TH-04：非时间锁不能换策略
    function test_T16_onlyAdminSetsStrategy() public {
        vm.expectRevert();
        vm.prank(guardian);
        vault.setStrategy(strat);
    }

    // 模糊：存入后立即全部取出，不能赚钱，最多损失 1 个最小单位
    function testFuzz_roundTrip(uint256 amount) public {
        amount = bound(amount, 1, 100_000e6);
        uint256 shares = _deposit(alice, amount);
        vm.prank(alice);
        uint256 back = vault.redeem(shares, alice, alice);
        assertLe(back, amount);
        assertGe(back + 1, amount);
    }
}
`)}
<h3>4.1 不变量测试与 handler</h3>
<p>Foundry 的不变量测试函数以 <code>invariant_</code> 开头；在 <code>setUp()</code> 里用 <code>targetContract(address(handler))</code> 让框架只调用 handler；<code>[invariant]</code> 配置里的 <code>runs</code>、<code>depth</code>、<code>fail_on_revert</code> 控制轮数、每轮调用次数和遇到 revert 是否算失败${cite('Foundry Book：Invariant Testing', 'https://getfoundry.sh/forge/invariant-testing')}。</p>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {YieldVault} from "../src/YieldVault.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";
import {MockStrategy} from "./mocks/MockStrategy.sol";

contract Handler is Test {
    YieldVault public vault;
    MockUSDC public usdc;
    MockStrategy public strat;
    address public keeper;
    address[3] public actors = [address(0xA11CE), address(0xB0B), address(0xCA401)];
    uint256 public ghostYield;                       // 累计模拟收益（影子变量）

    constructor(YieldVault v, MockUSDC u, MockStrategy s, address k) {
        vault = v; usdc = u; strat = s; keeper = k;
    }

    function deposit(uint256 who, uint256 amount) external {
        address a = actors[who % 3];
        uint256 max = vault.maxDeposit(a);
        if (max == 0) return;
        amount = bound(amount, 1, max);
        usdc.mint(a, amount);
        vm.startPrank(a);
        usdc.approve(address(vault), amount);
        vault.deposit(amount, a);
        vm.stopPrank();
    }

    function redeem(uint256 who, uint256 shares) external {
        address a = actors[who % 3];
        uint256 bal = vault.balanceOf(a);
        if (bal == 0) return;
        shares = bound(shares, 1, bal);
        vm.prank(a);
        vault.redeem(shares, a, a);
    }

    function accrue(uint256 bps) external {
        uint256 amt = strat.totalAssets() * bound(bps, 0, 50) / 10_000; // 每次最多 0.5%
        strat.simulateYield(amt);
        ghostYield += amt;
    }

    function harvest() external { vm.prank(keeper); vault.harvest(); }
    function rebalance() external { vm.prank(keeper); vault.rebalance(); }
}

contract YieldVaultInvariant is Test {
    Handler handler;
    YieldVault vault;
    address treasury = makeAddr("treasury");

    function setUp() public {
        MockUSDC usdc = new MockUSDC();
        address keeper = makeAddr("keeper");
        vault = new YieldVault(usdc, address(this), address(this), keeper, treasury, 1_000_000e6);
        MockStrategy strat = new MockStrategy(usdc, address(vault));
        vault.setStrategy(strat);
        handler = new Handler(vault, usdc, strat, keeper);
        targetContract(address(handler));
    }

    // I-01 偿付能力：所有份额能兑换的资产不超过总资产
    function invariant_I01_solvent() public view {
        assertLe(vault.convertToAssets(vault.totalSupply()), vault.totalAssets());
    }

    // I-02 份额守恒：三个用户 + 国库的份额之和等于总份额
    function invariant_I02_sharesConserved() public view {
        uint256 sum = vault.balanceOf(treasury);
        for (uint256 i; i < 3; i++) sum += vault.balanceOf(handler.actors(i));
        assertEq(sum, vault.totalSupply());
    }

    // I-03 / TH-02：国库份额的价值不超过累计收益（新存款被误算为收益时会失败）
    function invariant_I03_feeBounded() public view {
        assertLe(vault.convertToAssets(vault.balanceOf(treasury)), handler.ghostYield());
    }
}
`)}
${code('TOML', `
# contracts/foundry.toml
[profile.ci.fuzz]
runs = 10000

[profile.ci.invariant]
runs = 512
depth = 64
fail_on_revert = false   # handler 已过滤大部分无效调用；剩余 revert 不算失败
`)}
${exq([['把金库里 <code>_deposit</code> 中的 <code>lastTotalAssets += assets;</code> 删掉，哪个测试会先失败？为什么？', '<p>T-11 会失败：第二次 harvest 把 bob 的 5,000 USDC 当成收益，给国库铸了约 500 USDC 的份额。不变量 I-03 也会失败，因为国库份额价值远超累计模拟收益 ghostYield。这正是“先写威胁、再写测试”的价值：一个漏掉的加法被两处同时抓住。</p>']])}

<h2>5. 部署脚本</h2>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {YieldVault} from "../src/YieldVault.sol";
import {AaveV3Strategy, IPool} from "../src/AaveV3Strategy.sol";

contract Deploy is Script {
    function run() external {
        address adminSafe = vm.envAddress("ADMIN_SAFE");      // 管理 Safe，2/3
        address opsSafe = vm.envAddress("GUARDIAN_SAFE");     // 运维 Safe，1/2
        address keeper = vm.envAddress("KEEPER");
        IERC20 usdc = IERC20(vm.envAddress("AAVE_USDC"));
        IERC20 aUsdc = IERC20(vm.envAddress("AAVE_AUSDC"));
        IPool pool = IPool(vm.envAddress("AAVE_POOL"));

        vm.startBroadcast();
        address[] memory safes = new address[](1);
        safes[0] = adminSafe;
        // 48 小时延迟；proposer 与 executor 都是管理 Safe；admin 传 0 地址，时间锁自己管理自己
        TimelockController timelock = new TimelockController(2 days, safes, safes, address(0));

        // 部署者临时担任管理员，完成初始化后立即移交
        YieldVault vault = new YieldVault(usdc, msg.sender, opsSafe, keeper, adminSafe, 100_000e6);
        AaveV3Strategy strat = new AaveV3Strategy(usdc, aUsdc, pool, address(vault));
        vault.setStrategy(strat);

        // 种子存款：1 USDC，份额给管理 Safe（TH-01 的第二道防线）
        usdc.approve(address(vault), 1e6);
        vault.deposit(1e6, adminSafe);

        vault.grantRole(vault.DEFAULT_ADMIN_ROLE(), address(timelock));
        vault.renounceRole(vault.DEFAULT_ADMIN_ROLE(), msg.sender);
        vm.stopBroadcast();
    }
}
`)}
${code('BASH', `
# 私钥存进加密的 keystore，不写进 .env
cast wallet import deployer --interactive

# 先在本地分叉上演练，再广播到 Sepolia 并在区块浏览器验证源码
forge script script/Deploy.s.sol --fork-url $SEPOLIA_RPC_URL --account deployer
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --account deployer --broadcast --verify

# 部署后自检：管理员已移交、部署者已无权限
cast call $VAULT "hasRole(bytes32,address)(bool)" 0x0000000000000000000000000000000000000000000000000000000000000000 $TIMELOCK --rpc-url $SEPOLIA_RPC_URL
cast call $VAULT "hasRole(bytes32,address)(bool)" 0x0000000000000000000000000000000000000000000000000000000000000000 $DEPLOYER --rpc-url $SEPOLIA_RPC_URL
`)}
${call('info', '<p><code>forge script</code> 会把脚本里的多个调用作为<strong>多笔交易</strong>依次发送，它们不一定在同一个区块。部署和种子存款之间仍有短暂空窗。本项目靠 offset = 6 保证这个空窗内的攻击也亏本；如果要严格原子化，写一个工厂合约，在一笔交易里完成“部署金库 → 设置策略 → 种子存款 → 移交权限”。</p>')}

<h2>6. 前端：存入流程</h2>
${code('TYPESCRIPT', `
// web/src/DepositForm.tsx —— wagmi v2 + viem
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { vaultAbi } from "./abi/YieldVault";          // 从合约编译产物生成，带 as const
import { VAULT, USDC } from "./addresses";              // 地址写死在代码里，并在 README 公示

export function DepositForm() {
  const { address } = useAccount();
  const [input, setInput] = useState("100");
  const assets = parseUnits(input || "0", 6);          // USDC 6 位
  const enabled = Boolean(address);

  const { data: allowance = 0n, refetch } = useReadContract({
    address: USDC, abi: erc20Abi, functionName: "allowance",
    args: address ? [address, VAULT] : undefined, query: { enabled },
  });
  const { data: maxDep = 0n } = useReadContract({
    address: VAULT, abi: vaultAbi, functionName: "maxDeposit",
    args: address ? [address] : undefined, query: { enabled },
  });
  const { data: preview = 0n } = useReadContract({
    address: VAULT, abi: vaultAbi, functionName: "previewDeposit", args: [assets],
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash, query: { enabled: Boolean(hash) } });

  const needApprove = allowance < assets;
  const blocked = assets === 0n || assets > maxDep;     // 暂停或超过上限时 maxDeposit 为 0

  function submit() {
    if (!address) return;
    if (needApprove) {
      // 只授权本次金额，不用无限授权
      writeContract({ address: USDC, abi: erc20Abi, functionName: "approve", args: [VAULT, assets] },
        { onSuccess: () => refetch() });
    } else {
      writeContract({ address: VAULT, abi: vaultAbi, functionName: "deposit", args: [assets, address] });
    }
  }

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" />
      <p>预计得到 {formatUnits(preview, 12)} 份额（份额为 12 位小数）</p>
      {assets > maxDep && <p>超过可存额度：{formatUnits(maxDep, 6)} USDC（金库可能已暂停或已满）</p>}
      <button disabled={blocked || isPending || confirming} onClick={submit}>
        {needApprove ? "1/2 授权 USDC" : "2/2 存入"}
      </button>
    </div>
  );
}
`)}
<p>交易各阶段的状态提示（签名中、已广播、已确认、失败原因）沿用 <a href="#m07-7">M03.7 交易状态与 UX</a> 的做法。取出页面要先读 <code>maxWithdraw(owner)</code>：借贷协议流动性不足时，它可能小于用户持仓价值（TH-07）。</p>

<h2>7. 索引器：份额价格历史</h2>
${recall('<p>自己写 Go 日志轮询器时，按高度推进、记录区块哈希、检测重组并回滚、用 (tx_hash, log_index) 做唯一键，这些都在 <a href="#m01-8">M01.8 索引器工程</a> 里。下面用 Ponder 实现，它内部替你处理了游标和重组。</p>')}
${code('TYPESCRIPT', `
// indexer/ponder.config.ts
import { createConfig } from "ponder";
import { vaultAbi } from "./abis/YieldVault";

export default createConfig({
  chains: { sepolia: { id: 11155111, rpc: process.env.PONDER_RPC_URL_11155111 } },
  contracts: {
    YieldVault: {
      abi: vaultAbi,
      chain: "sepolia",
      address: "0xYourVaultAddress",      // 部署后填写
      startBlock: 0,                       // 改成部署区块，避免从头扫描
    },
  },
});

// indexer/ponder.schema.ts
import { onchainTable } from "ponder";

export const vaultEvent = onchainTable("vault_event", (t) => ({
  id: t.text().primaryKey(),               // Ponder 的 event.id，全局唯一
  kind: t.text().notNull(),
  account: t.hex(),
  assets: t.bigint().notNull(),
  shares: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const sharePrice = onchainTable("share_price", (t) => ({
  blockNumber: t.bigint().primaryKey(),
  timestamp: t.bigint().notNull(),
  totalAssets: t.bigint().notNull(),
  totalSupply: t.bigint().notNull(),
  pps1e18: t.bigint().notNull(),           // 1 个完整份额（1e12）值多少 USDC，再乘 1e18
}));
`)}
${code('TYPESCRIPT', `
// indexer/src/index.ts
import { ponder } from "ponder:registry";
import { vaultEvent, sharePrice } from "ponder:schema";

// 每个事件之后，按该事件所在区块读一次链上状态，写一条份额价格快照
async function snapshot(event: { block: { number: bigint; timestamp: bigint }; log: { address: \`0x\${string}\` } }, context: any) {
  const abi = context.contracts.YieldVault.abi;
  const [totalAssets, totalSupply] = await Promise.all([
    context.client.readContract({ abi, address: event.log.address, functionName: "totalAssets" }),
    context.client.readContract({ abi, address: event.log.address, functionName: "totalSupply" }),
  ]);
  const pps1e18 = totalSupply === 0n ? 0n : (totalAssets * 10n ** 24n) / totalSupply; // (ta/1e6)/(ts/1e12)×1e18
  await context.db
    .insert(sharePrice)
    .values({ blockNumber: event.block.number, timestamp: event.block.timestamp, totalAssets, totalSupply, pps1e18 })
    .onConflictDoUpdate({ totalAssets, totalSupply, pps1e18 });
}

ponder.on("YieldVault:Deposit", async ({ event, context }) => {
  await context.db.insert(vaultEvent).values({
    id: event.id, kind: "deposit", account: event.args.owner,
    assets: event.args.assets, shares: event.args.shares,
    blockNumber: event.block.number, timestamp: event.block.timestamp,
  }).onConflictDoNothing();
  await snapshot(event, context);
});

ponder.on("YieldVault:Harvest", async ({ event, context }) => {
  await context.db.insert(vaultEvent).values({
    id: event.id, kind: event.args.loss > 0n ? "loss" : "harvest", account: null,
    assets: event.args.profit, shares: event.args.feeShares,
    blockNumber: event.block.number, timestamp: event.block.timestamp,
  }).onConflictDoNothing();
  await snapshot(event, context);
});
// Withdraw 同理：kind = "withdraw"，account = event.args.owner
`)}
<p>Ponder 的配置字段（<code>chains</code>、<code>contracts</code> 里的 <code>abi</code> / <code>chain</code> / <code>address</code> / <code>startBlock</code>）、<code>onchainTable</code> 和 <code>ponder.on("合约:事件")</code> 的写法见官方文档${cite('Ponder 文档：Contracts 配置', 'https://ponder.sh/docs/config/contracts')}${cite('Ponder 文档：Get started', 'https://ponder.sh/docs/get-started')}。Ponder 版本更新较快，以你安装版本的文档为准。M15.2 的 REST 接口可以在 Ponder 的 API 文件里用 Hono 路由实现，也可以单独写一个只读服务直接查这两张表。</p>
<p><strong>算一算（示例）：</strong>某次快照 totalAssets = 1,001,000,000,000（1,001,000 USDC），totalSupply = 1,000,099,910,000,000,000（1,000,099.91 份额，12 位）。</p>
${steps([
  'pps1e18 = 1,001,000,000,000 × 10²⁴ ÷ 1,000,099,910,000,000,000。',
  '= 1.001 × 10³⁶ ÷ 1.00009991 × 10¹⁸ ≈ 1.000900 × 10¹⁸。',
  '前端显示时除以 10¹⁸：份额价格 ≈ 1.000900 USDC，与 M15.2 第 5 节手算一致。',
  '7 日年化 =（本周 pps ÷ 上周 pps − 1）× 52。用整数快照算，可以随时重算、审计。'
])}

<h2>8. Keeper</h2>
${code('TYPESCRIPT', `
// keeper/src/main.ts —— 每小时检查一次，收益覆盖 3 倍 Gas 才结算；发现亏损立即结算以触发熔断
import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const VAULT = process.env.VAULT as Hex;
const ETH_USD_1E6 = 3_000_000_000n;                    // 示例：1 ETH = 3000 USDC，生产环境从喂价读取
const abi = parseAbi([
  "function totalAssets() view returns (uint256)",
  "function lastTotalAssets() view returns (uint256)",
  "function paused() view returns (bool)",
  "function harvest()",
]);
// 测试网可以从环境变量读私钥；生产环境改用 KMS 或签名服务
const account = privateKeyToAccount(process.env.KEEPER_KEY as Hex);
const pub = createPublicClient({ chain: sepolia, transport: http(process.env.RPC_URL) });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(process.env.RPC_URL) });

async function tick() {
  if (await pub.readContract({ address: VAULT, abi, functionName: "paused" })) return;
  const [now, last] = await Promise.all([
    pub.readContract({ address: VAULT, abi, functionName: "totalAssets" }),
    pub.readContract({ address: VAULT, abi, functionName: "lastTotalAssets" }),
  ]);
  const isLoss = now < last;
  if (!isLoss) {
    const gas = await pub.estimateContractGas({ address: VAULT, abi, functionName: "harvest", account });
    const gasPrice = await pub.getGasPrice();
    const costUsdc = (gas * gasPrice * ETH_USD_1E6) / 10n ** 18n;
    if (now - last < 3n * costUsdc) return;            // 收益不够付 Gas，跳过
  }
  const { request } = await pub.simulateContract({ address: VAULT, abi, functionName: "harvest", account });
  const hash = await wallet.writeContract(request);
  const rcpt = await pub.waitForTransactionReceipt({ hash });
  console.log(JSON.stringify({ msg: "harvest", isLoss, hash, status: rcpt.status }));
}

setInterval(() => tick().catch((e) => console.error(JSON.stringify({ msg: "tick_failed", err: String(e) }))), 3_600_000);
`)}
${call('warn', '<p>keeper 发现亏损时<strong>不看 Gas 成本</strong>，立即调用 harvest，因为只有 harvest 才会触发链上熔断。只在“有利可图”时才调用的 keeper，会在最需要它的时候沉默。keeper 的 nonce 与 Gas 策略见 <a href="#m03-6">M08.6 Nonce 管理</a>、<a href="#m03-7">M08.7 Gas 策略</a>。</p>')}

<h2>9. CI</h2>
${code('YAML', `
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  contracts:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: contracts } }
    steps:
      - uses: actions/checkout@v4
        with: { submodules: recursive }
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge fmt --check
      - run: forge build --sizes
      - run: forge test -vvv
        env: { FOUNDRY_PROFILE: ci }
      # ABI 一致性：编译产物与前端、索引器使用的 ABI 必须相同
      - run: forge inspect YieldVault abi --json > /tmp/abi.json && diff <(jq -S . /tmp/abi.json) <(jq -S . ../abi/YieldVault.json)
      - uses: crytic/slither-action@v0.4.0   # 版本以 GitHub Marketplace 为准
        with: { target: contracts, fail-on: high }
  # web / indexer / keeper 三个 job 同理：pnpm install --frozen-lockfile → tsc --noEmit → build
`)}
<p>Slither 在 Foundry 项目根目录运行 <code>slither .</code> 即可，它有官方的 GitHub Action <code>slither-action</code>${cite('crytic/slither（GitHub）', 'https://github.com/crytic/slither')}。CI 里只把“高危”设为失败门槛；中低危结果在 M15.4 的自审里逐条处理。</p>

<h2>10. 里程碑与扩展</h2>
${tbl(['周（示例）', '交付物', '完成标志'], [
  ['3', '金库 + MockStrategy + 单元测试', 'T-01 到 T-20 通过'],
  ['4', '模糊 + 不变量 + AaveV3Strategy', 'ci profile 下 I-01 到 I-03 通过'],
  ['5', '部署脚本 + Sepolia 部署', '区块浏览器源码已验证；管理员已移交时间锁'],
  ['6', 'Ponder 索引器 + REST', '收益曲线 API 返回 7 天数据'],
  ['7', '前端存入 / 取出 / 曲线', '新用户 2 分钟内完成首次存入'],
  ['8', 'keeper + 告警', '模拟亏损后 5 分钟内收到告警且金库已暂停']
])}
<p>扩展方向（写进 README，不进 MVP）：多策略按比例分配；用 ERC-2612 permit 把授权和存入合并成一步；把 keeper 换成 ERC-4337 会话密钥（见 <a href="#m06-5">M08.8 账户抽象深入</a>）；对份额价格提供 TWAP 接口方便集成方。作品集与面试要点见 <a href="#m12-5">M15.5</a>。</p>

${tryit(`<p><strong>动手练习：</strong>亲手制造一个漏洞，看测试能不能抓住它。</p>
${steps([
  '按本篇代码建好 <code>contracts/</code>，写好 MockUSDC 和 MockStrategy，运行 <code>forge test</code>，确认全部通过。',
  '把 <code>_decimalsOffset()</code> 的返回值改成 0，再运行 <code>forge test --match-test T07 -vvvv</code>，读出受害者和攻击者各自能取回多少。',
  '改回 6。删掉 <code>_deposit</code> 里的 <code>lastTotalAssets += assets;</code>，运行 <code>FOUNDRY_PROFILE=ci forge test --match-contract Invariant</code>，看 I-03 打印出的调用序列。',
  '恢复代码。运行 <code>forge coverage --report summary</code>，记下 YieldVault 的行覆盖率和分支覆盖率，写进 <code>docs/test-report.md</code>。'
])}
<p>预期结果：offset 为 0 时 T-07 失败（受害者约损失三分之一）；删掉加法后 T-11 和 I-03 都失败，Foundry 会给出最短的失败调用序列。</p>`)}

${exercises([
  ['为什么 <code>maxDeposit</code> 在暂停时返回 0，而不是在 <code>deposit</code> 上加 <code>whenNotPaused</code>？', '<p>ERC-4626 要求 <code>maxDeposit</code> 如实反映当前能存多少，前端和集成方会读它。让它返回 0，OpenZeppelin 的 <code>deposit</code> 会自动 revert，同时前端也能提前显示“已暂停”。只加修饰器的话，<code>maxDeposit</code> 仍返回正数，集成方会误以为能存。</p>'],
  ['不变量 I-01 为什么用 <code>assertLe</code> 而不是 <code>assertEq</code>？', '<p>因为虚拟份额和向下取整，<code>convertToAssets(totalSupply)</code> 总是略小于 <code>totalAssets</code>，差额属于虚拟份额和取整余量。要求相等会误报；要求“不超过”正好表达“不会欠用户钱”。</p>'],
  ['keeper 的私钥泄露了。根据本篇代码，攻击者能造成的最坏后果是什么？', '<p>攻击者只能调用 <code>harvest</code> 和 <code>rebalance</code>。harvest 只做记账，频繁调用最多让国库少收或多收一点取整误差；rebalance 只在金库和受信策略之间移动资金。两者都不能把资金转给任意地址。最坏后果是浪费 keeper 钱包里的 Gas 和增加一些策略交互次数。处理：从 KEEPER_ROLE 移除该地址（需走时间锁），换新 keeper。</p>'],
  ['索引器在一次重组中丢掉了两个区块。Ponder 和自写的 Go 轮询器分别怎样恢复？', '<p>Ponder 会检测重组并回滚受影响区块的数据，再重新处理。自写轮询器需要按 <a href="#m01-8">M01.8</a> 的方法：比较父哈希发现分叉，找到共同祖先，删除之后的行，从共同祖先重新扫描；唯一键保证重放不会重复。</p>']
])}
${checklist([
  '能写出金库的五个 override：<code>_decimalsOffset</code>、<code>totalAssets</code>、<code>maxDeposit</code>、<code>_deposit</code>、<code>_withdraw</code>，并说出各自防的威胁。',
  '能写一个带 handler 的不变量测试，并解释 ghost 变量的作用。',
  '能用 <code>forge script --broadcast --verify</code> 部署到 Sepolia，并用 <code>cast call</code> 验证权限已移交。',
  '能把合约事件接到 Ponder，写出份额价格快照表。',
  'CI 里有编译、测试、Slither、ABI 一致性四道检查。'
])}
${mistakes([
  ['亏损超限时直接 revert 最安全。', 'revert 会撤销同一笔交易里的 _pause()。要记录亏损并暂停，然后正常返回。'],
  ['不变量测试设置 fail_on_revert = true 才严格。', '没有 handler 过滤时，大量随机调用必然 revert，测试会被噪音淹没。先写好 handler，再考虑打开。'],
  ['前端读 API 的份额价格就够了。', 'API 只用于历史曲线。提交交易前要直接读合约的 previewDeposit 和 maxDeposit。'],
  ['keeper 只在有利可图时才调用 harvest。', '发现亏损时必须立即调用，否则链上熔断永远不会触发。'],
  ['部署脚本里的多个调用是原子的。', 'forge script 会发送多笔交易。要原子化，写一个工厂合约在一笔交易里完成。']
])}
${recap([
  '金库只改五处：offset、totalAssets、maxDeposit、_deposit、_withdraw；再加 harvest、rebalance 和权限函数。',
  '测试按威胁编号写：单元测试固定场景，模糊测试随机金额，不变量测试随机调用序列。',
  '部署脚本完成种子存款和权限移交，用 cast call 自检。',
  '前端写操作直接读合约校验；索引器按事件写份额价格快照，金额一律用整数。',
  'keeper 发现亏损要立即结算；CI 把编译、测试、Slither、ABI 一致性串起来。'
])}
${quiz([
  { q: '下面哪段改动会让“亏损熔断”失效？', o: ['把 maxLossBps 改成 100', '把亏损分支的 _pause() 改成 revert', '把 bufferBps 改成 2000', '把 keeper 换成新地址'], a: 1, why: 'revert 会把同一笔交易里的所有状态变化一起撤销，包括暂停。其他选项只是调整参数。' },
  { q: '不变量测试里 <code>targetContract(address(handler))</code> 的作用是？', o: ['让框架直接调用金库', '让框架只随机调用 handler 的函数', '关闭模糊测试', '部署 handler 到测试网'], a: 1, why: '框架只调用目标合约。handler 把随机输入整理成合理调用，再去调用金库。' },
  { q: '份额为 12 位小数，前端显示 previewDeposit 的结果时应该怎样换算？', o: ['formatUnits(x, 18)', 'formatUnits(x, 6)', 'formatUnits(x, 12)', '直接显示整数'], a: 2, why: '份额 decimals = 资产 6 位 + offset 6 位 = 12 位。用 6 位会显示成一百万倍。' },
  { q: 'CI 里 ABI 一致性检查主要防止什么问题？', o: ['合约字节码过大', '合约改了事件，前端或索引器还用旧 ABI', 'Slither 误报', '私钥泄露'], a: 1, why: '多包仓库里 ABI 只有一个来源。检查失败说明有人改了合约接口但没有同步下游。' },
  { q: 'keeper 私钥泄露，根据本篇设计，最坏后果是？', o: ['所有用户资金被转走', '业绩费被改成 100%', '浪费 Gas 和多几次策略交互', '金库被永久暂停'], a: 2, why: 'KEEPER_ROLE 只有 harvest 和 rebalance，两者都不能把资金转给任意地址，也不能改参数或暂停。' }
])}
${terms([
  ['不变量', 'Invariant', '在任何调用序列之后都必须成立的系统性质。'],
  ['处理器合约', 'Handler', '不变量测试中把随机输入整理成合理调用的辅助合约。'],
  ['影子变量', 'Ghost variable', '测试代码里额外记录的状态，用来和合约状态对照。'],
  ['分叉测试', 'Fork test', '在本地复制某条真实链的状态，与已部署合约交互的测试。'],
  ['加密密钥库', 'Keystore', '用口令加密保存私钥的文件，<code>cast wallet import</code> 生成。'],
  ['持续集成', 'CI (Continuous Integration)', '每次推送代码自动编译、测试、检查的流程。']
])}
` });

CUR = 'm12-4';
addCh({ id: 'm12-4', nav: '上线与应急', title: 'M15.4 上线：测试、审计演练、监控与应急', desc: '测试网上线清单、自审与 Slither、监控告警、密钥管理、应急手册与复盘', html: `
<h1>M15.4 上线：测试、审计演练、监控与应急</h1>
${meta(['按上线清单逐项验证金库，并用 M02.10 的方法写一份自审报告。', '为金库设计监控指标和告警阈值，并算出“从告警到暂停”的时间预算。', '写出应急手册和复盘模板，完成一次暂停演练，并在前端接入地域与地址筛查。'], '前置：<a href="#m12-3">M15.3 实现：合约、前端与索引</a>、<a href="#m02-62">M02.10 审计方法与安全工具链</a>、<a href="#m02-8">M02.9 合约安全 II</a>')}
${beginner(`<p><strong>自审（Self-audit）</strong>：正式审计之前，由开发者自己按审计流程把代码过一遍，写成报告。</p>
<p><strong>静态分析（Static analysis）</strong>：不运行代码，只读源码找可疑写法的工具，例如 Slither。</p>
<p><strong>告警（Alert）</strong>：监控系统发现指标越过阈值后，主动通知值班的人。</p>
<p><strong>应急手册（Runbook）</strong>：一份事先写好的操作步骤。出事时照着做，不临场想。</p>
<p><strong>复盘（Post-mortem）</strong>：事故结束后写的报告：发生了什么、为什么、怎样防止再发生。重点是改进流程，不是追责。</p>`)}

<h2>1. 一句话理解</h2>
${one('上线不是“部署成功”的那一刻，而是你能证明三件事：代码按自审和工具检查过；出问题时会在几分钟内被发现；发现之后有人知道该按哪个按钮。')}
${call('analogy', `<p>上线像餐厅开业。部署合约是装修完工；自审和 Slither 是卫生检查；监控是烟雾报警器；应急手册是墙上的消防疏散图；暂停演练是消防演习。没有报警器和演习的餐厅，装修再好也不能开门。</p>
<p>比喻的局限：餐厅失火有消防队，链上出事主要靠你自己。社区也有白帽应急响应组织（见第 5 节），但不能替代你的手册。</p>`)}
${art('一图看懂：从告警到暂停的 15 分钟，决定损失多少（示例）', 670, 310, [
  S.text(335, 24, '示例：每 3 分钟被多抽走 TVL 的 2%，TVL = 100,000 USDC（单位：分钟）', { size: 12.5, anchor: 'middle', mw: 640 }),
  S.text(10, 76, '现状\n先讨论再暂停', { size: 12, b: 1 }),
  S.box(120, 56, 56, 48, { k: 'info', t: '检测 2', r: 8 }),
  S.box(176, 56, 140, 48, { k: 'info', t: '通知到人 5', r: 8 }),
  S.box(316, 56, 224, 48, { k: 'risk', t: '决策与签名 8', r: 8 }),
  S.arrow(542, 80, 568, 80, { k: 'risk' }),
  S.box(570, 56, 90, 48, { k: 'risk', t: '≈ 10,000', s: 'USDC 损失', mono: 1 }),
  S.text(10, 166, '预授权\n先暂停再调查', { size: 12, b: 1 }),
  S.box(120, 146, 56, 48, { k: 'info', t: '检测 2', r: 8 }),
  S.box(176, 146, 140, 48, { k: 'info', t: '通知到人 5', r: 8 }),
  S.box(316, 146, 84, 48, { k: 'ok', t: '决策 3', r: 8 }),
  S.arrow(404, 170, 568, 170, { k: 'ok', dash: 1 }),
  S.box(570, 146, 90, 48, { k: 'ok', t: '≈ 6,667', s: 'USDC 损失', mono: 1 }),
  S.text(120, 126, '总计 15 分钟 = 5 个周期', { size: 12, dim: 1 }),
  S.text(120, 216, '总计 10 分钟 = 3⅓ 个周期', { size: 12, dim: 1 }),
  S.text(335, 268, '决策越快，损失越小；再用 depositCap 给损失设上限', { size: 13.5, b: 1, anchor: 'middle', mw: 620 }),
  S.text(335, 292, '损失 ≈ 100,000 × 2% × 周期数（未复合）', { size: 12, dim: 1, anchor: 'middle', mw: 620 })
], [
  ['flow', '时间轴从左到右：监控发现、叫醒值班的人、有人在运维 Safe 上签名暂停。三段加起来就是攻击者的作案窗口。'],
  ['key', '最长的一段是“决策与签名”。把“份额价格下跌超过阈值先暂停”预先授权，这一段从 8 分钟压到 3 分钟。'],
  ['risk', '只发到群里、没人值班的告警等于没有告警：通知段会无限拉长。'],
  ['limit', '图中的分钟数和比例都是示例，要靠一次暂停演练测出自己的真实数字。']
], '两条时间轴对比：现状检测2分钟、通知5分钟、决策8分钟共15分钟，损失约10000USDC；预先授权后决策3分钟共10分钟，损失约6667USDC。', 'm12-4')}

<h2>2. 测试网上线清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['合约源码已在区块浏览器验证', '评审和用户要能读源码', '浏览器合约页显示“已验证”的绿色标记'],
  ['DEFAULT_ADMIN_ROLE 只属于时间锁', '部署者权限残留是常见高危问题', '<code>cast call hasRole</code> 对时间锁为 true、对部署者为 false'],
  ['时间锁 minDelay = 48 小时', '用户需要退出窗口', '<code>cast call $TIMELOCK "getMinDelay()(uint256)"</code> 返回 172800'],
  ['守护者能暂停、不能解除', '“停得快，开得慢”', '用运维 Safe 实际发起一次 pause；用它调用 unpause 应 revert'],
  ['种子存款已完成', 'TH-01 第二道防线', '<code>totalSupply() &gt; 0</code> 且国库持有初始份额'],
  ['depositCap 已设置', '限制最坏损失', '读 <code>depositCap()</code>，前端显示剩余额度'],
  ['索引器已追上链头', '收益曲线要可用', 'Ponder 状态接口的最新区块与链头差 &lt; 5 个区块'],
  ['告警已接通', '出事能被发现', '在测试网模拟亏损，确认 5 分钟内收到通知'],
  ['README 写明合约地址和已知限制', '防仿站，管理预期', '地址与浏览器一致；“仅测试网、未经专业审计”写在首屏']
])}
${call('warn', '<p>毕业项目只上测试网。即使你对代码很有信心，也不要在没有专业审计、漏洞赏金和保险的情况下接收主网真实资金。“未经专业审计，请勿存入真实资产”要写在前端首屏和 README 首段。</p>')}

<h2>3. 审计演练：自审、Slither 与不变量战役</h2>
${recall('<p>审计的完整流程（确定范围、读文档、画调用图、逐函数审查、写发现、分级、修复验证）和 Slither、Echidna、Halmos 等工具的用法在 <a href="#m02-62">M02.10 审计方法与安全工具链</a>。本节只说明怎样把这套方法用在你自己的金库上。</p>')}
${steps2('自审五步（按 M02.10 的方法）', [
  { t: '1. 冻结范围', d: '记下提交哈希和文件清单：YieldVault.sol、AaveV3Strategy.sol，约 250 行', kind: '' },
  { t: '2. 列假设', d: '策略受信；USDC 无回调；时间锁不被绕过；Aave 测试网可能不可用', kind: '' },
  { t: '3. 逐函数审查', d: '每个 external 函数：谁能调、改了什么状态、调用了谁、取整方向', kind: 'key' },
  { t: '4. 工具扫描', d: 'Slither 全量；不变量战役加大轮数；覆盖率找没测到的分支', kind: '' },
  { t: '5. 写发现与处理', d: '每条：严重性、位置、描述、修复或接受理由、对应测试', kind: 'risk' }
], [
  ['flow', '先冻结范围再审。审到一半改代码，前面的结论全部作废。'],
  ['key', '第 3 步最花时间，也最有价值。工具找的是写法问题，逻辑问题（例如 TH-02）主要靠人读出来。'],
  ['limit', '自审不能替代第三方审计：作者最难发现自己的假设错误。自审报告的价值是展示你的方法。']
])}
${code('BASH', `
# Slither：在 Foundry 项目根目录运行，排除依赖库
cd contracts
slither . --filter-paths "lib/"
# 生成 Markdown 清单，贴进自审报告附录
slither . --filter-paths "lib/" --checklist > ../docs/slither.md

# 不变量战役：比 CI 更多轮、更深的调用序列（本地或夜间任务跑）
FOUNDRY_PROFILE=ci forge test --match-contract Invariant --fuzz-runs 10000 -vvv

# 覆盖率：找出没被测到的分支
forge coverage --report summary --report lcov
`)}
<p>Slither 默认运行全部检测器，结果分高、中、低和信息四级${cite('crytic/slither（GitHub）', 'https://github.com/crytic/slither')}。对每条结果只做三种处理之一：<strong>修复</strong>、<strong>标为误报并写理由</strong>、<strong>接受风险并写理由</strong>。不要用全局关闭检测器的方式让报告“变干净”。</p>
${tbl(['示例发现', '严重性', '处理'], [
  ['<code>_withdraw</code> 在销毁份额前调用外部策略（Slither：reentrancy 类提示）', '低（策略受信）', '接受：策略只能由时间锁设置；写进“假设”'],
  ['<code>setParams</code> 未限制 <code>maxLossBps</code> 上限', '中', '修复：加上限 1000，补测试 T-21'],
  ['<code>harvest</code> 在 totalSupply 很小时 feeShares 取整为 0', '信息', '接受：只影响极小金额的业绩费'],
  ['<code>emergencyExit</code> 在策略为空时调用会 revert', '低', '修复：策略为 0 地址时直接返回']
])}

<h2>4. 监控与告警</h2>
${mm('监控数据流', `
flowchart LR
  CH["Sepolia 链"] -->|"事件与状态"| MON["监控进程<br/>OpenZeppelin Monitor 或自写"]
  IDX["Ponder 索引器"] -->|"pps 与 TVL 历史"| MON
  MON --> R1{"规则判断"}
  R1 -->|"严重"| PG["电话或即时通讯<br/>值班守护者"]:::risk
  R1 -->|"警告"| CHN["团队频道"]:::warn
  R1 -->|"信息"| LOG["日志与看板"]
  PG --> SAFE["运维 Safe<br/>pause 或 emergencyExit"]
`, [
  ['flow', '监控读两类数据：链上事件（实时）和索引器的历史（算变化率）。两者互相校验：索引器停了，监控也要报警。'],
  ['key', '严重告警必须叫醒一个能签名的人。只发到频道、没人值班的告警等于没有。'],
  ['fail', '监控进程本身会挂。给它加心跳：每 5 分钟发一次“我还活着”，超过 15 分钟没有就报警。'],
  ['risk', 'OpenZeppelin Defender 托管服务按官方计划于 2026-07-01 停止服务，官方已开源 Monitor 和 Relayer 供自托管' + cite('OpenZeppelin：Monitor and Relayers Are Now Open Source', 'https://www.openzeppelin.com/news/monitor-and-relayers-are-now-open-source') + '。选工具时确认它仍在维护。']
])}
${tbl(['指标 / 事件', '规则（示例阈值）', '级别', '响应'], [
  ['份额价格', '单块下跌 &gt; 0.5%，或 1 小时下跌 &gt; 0.2%', '严重', '守护者评估后 pause'],
  ['Harvest 事件', '<code>loss &gt; 0</code>', '警告；超过 maxLossBps 时合约已自动暂停', '查策略和借贷协议状态'],
  ['TVL', '1 小时内变化 &gt; 30%', '警告', '确认是否为正常大额存取'],
  ['Paused / Unpaused 事件', '任何一次', '严重', '确认是计划内操作'],
  ['时间锁 CallScheduled 事件', '任何一次', '警告', '核对是否为团队提交的提案，解码 calldata'],
  ['RoleGranted / RoleRevoked', '任何一次', '严重', '核对与时间锁提案一致'],
  ['keeper 钱包余额', '&lt; 0.05 ETH', '警告', '充值 Gas'],
  ['keeper 最近一次 harvest', '&gt; 36 小时', '警告', '检查 keeper 进程'],
  ['索引器延迟', '&gt; 20 个区块', '警告', '检查 RPC 与 Ponder'],
  ['USDC/USD 喂价', '&lt; 0.98 或 updatedAt 超过心跳', '警告', '前端显示风险提示']
])}
<p><strong>算一算（示例）：从告警到暂停的时间预算。</strong>假设攻击者每 3 分钟能从策略里多抽走 TVL 的 2%，金库 TVL 为 100,000 USDC。</p>
${steps([
  '检测：监控每个区块检查一次，Sepolia 约 12 秒一个块，规则判断再加 1 分钟，计 <strong>2 分钟</strong>。',
  '通知到人：即时通讯 + 电话，值班人看到并确认，计 <strong>5 分钟</strong>。',
  '决策与签名：看看板、确认不是误报、在运维 Safe（1/2）发起 pause，计 <strong>8 分钟</strong>。',
  '总计 15 分钟 = 5 个 3 分钟周期，可能损失 ≈ 100,000 × 2% × 5 = <strong>10,000 USDC</strong>（未复合，示例）。',
  '如果把决策压到 3 分钟（预先授权“份额价格下跌 &gt; 0.5% 先暂停再调查”），总计 10 分钟，损失降到约 6,667 USDC。存款上限越低，绝对损失越小。'
])}
${call('info', '<p>这个计算说明了两件事：一、存款上限 depositCap 是最直接的损失上限；二、“先暂停，再调查”必须写进手册并预先授权，否则值班人会犹豫。暂停的代价只是一段时间不能存款，而犹豫的代价是资金。</p>')}

<h2>5. 密钥管理与应急手册</h2>
${recall('<p>多签门限的选择、签名人分布、硬件钱包与签名流程见 <a href="#m03-4">M08.4 多签钱包</a>；热钱包、冷钱包与签名服务的分级见 <a href="#m03-8">M08.9 企业钱包系统设计</a>。</p>')}
${tbl(['密钥', '存放', '能做什么', '泄露后的处理'], [
  ['部署者', '<code>cast wallet</code> 加密 keystore', '部署完成后无任何权限', '无需处理（已 renounce）'],
  ['管理 Safe 签名人 ×3', '各自的硬件钱包', '通过时间锁改参数、换策略', '其余签名人通过时间锁换掉该签名人'],
  ['运维 Safe 签名人 ×2', '硬件钱包 + 手机签名应用', '暂停、紧急撤回', '管理 Safe 通过时间锁移除'],
  ['keeper', '测试网：环境变量；生产：KMS', 'harvest、rebalance', '停掉 keeper，通过时间锁移除角色']
])}
${mm('应急响应：从告警到复盘', `
sequenceDiagram
  participant M as 监控
  participant G as 值班守护者
  participant S as 运维 Safe
  participant V as 金库
  participant T as 团队
  participant U as 用户
  M->>G: 严重告警 份额价格单块下跌 0.8 百分比
  G->>S: 发起 pause 交易
  S->>V: pause
  V-->>M: Paused 事件
  G->>T: 拉起应急频道 指定负责人
  T->>V: 读状态 定位策略问题
  G->>S: 如策略异常 发起 emergencyExit
  S->>V: emergencyExit 资金回到金库
  T->>U: 发布公告 存款已暂停 取出不受影响
  T->>T: 修复 走时间锁 unpause
  T->>U: 发布复盘
`, [
  ['flow', '顺序是“先止血、再定位、再沟通、最后恢复”。暂停在第一分钟做，不等根因。'],
  ['key', '对用户的第一条公告只说三件事：发生了什么、现在能做什么（取出仍可用）、下一次更新的时间。'],
  ['fail', '常见失误是先在群里讨论半小时再暂停。手册要写明：哪些告警允许值班人不经讨论直接暂停。'],
  ['risk', '攻击进行中不要在公开频道讨论漏洞细节，否则会引来模仿者。需要外部帮助时，可以联系 SEAL 911 这类免费的白帽应急热线' + cite('Security Alliance：SEAL 911', 'https://securityalliance.org/seal-911') + '。']
])}
${code('MARKDOWN', `
# 应急手册：份额价格异常下跌（RB-01）
触发：份额价格单块下跌 > 0.5% 或 Harvest(loss > 0) 且金库未自动暂停
授权：值班守护者可不经讨论直接执行第 1 步

1. 暂停：运维 Safe 调用 YieldVault.pause()，记录交易哈希
2. 定位：读 strategy.totalAssets()、Aave 市场状态、最近 20 笔金库交易
3. 判断：策略侧异常 → 运维 Safe 调用 emergencyExit()；金库自身漏洞 → 联系管理 Safe 全员
4. 沟通：30 分钟内发布第一条公告（模板 C-01），之后每 2 小时更新
5. 恢复：修复合约或换策略，经时间锁执行 setStrategy / unpause
6. 复盘：72 小时内发布复盘（模板 PM-01）
`)}

<h2>6. 合规检查</h2>
${recall('<p>KYC、AML 与制裁筛查的概念见 <a href="#m11-2">M12.2</a>；各法域的规则差异见 <a href="#m11-4">M12.6</a>；地域限制、地址风险评分的工程实现见 <a href="#m11-6">M12.8 合规引擎</a>。本节只说明毕业项目里最少要做什么。以下内容不是法律意见。</p>')}
${tbl(['检查', '做法（示例）', '局限'], [
  ['地域提示', '前端读 CDN 提供的访问者国家头信息，对受限地区显示限制说明，隐藏交易按钮', '只是前端限制，合约本身仍可被直接调用；VPN 可绕过'],
  ['地址筛查', '用户连接钱包后，前端请求自己的后端，后端调用筛查服务或比对 OFAC 公布的制裁地址，命中则禁止发起交易', '依赖名单更新及时；不要只用客户端名单'],
  ['服务条款', '首次使用时展示条款与风险提示，记录同意版本号', '条款不能替代各地的许可要求'],
  ['日志', '记录筛查请求的结果与时间，不记录不必要的个人信息', '保存期限和隐私要求要单独评估']
])}
${call('info', '<p>链上的 Chainalysis 制裁预言机合约曾被广泛用于地址筛查，但其官方页面现已标注为不再维护、不建议用于新的集成或生产环境的制裁筛查' + cite('Chainalysis：Sanctions Oracle 文档', 'https://go.chainalysis.com/chainalysis-oracle-docs.html') + '。选择筛查来源时，先确认它仍在维护、名单多久更新一次。</p>')}

<h2>7. 复盘模板与演练</h2>
${code('MARKDOWN', `
# 复盘 PM-01：<事件名称>
- 时间线（UTC）：首次异常 / 告警 / 暂停 / 定位 / 恢复，每项带交易哈希或截图
- 影响：受影响用户数、资金影响（USDC）、暂停时长
- 根因：技术原因 + 为什么测试和监控没有提前发现
- 做得好的：例如“告警 2 分钟到达，暂停在 6 分钟内完成”
- 做得不好的：例如“手册没写 emergencyExit 的判断标准”
- 改进项：每项有负责人和截止日期；对应新增的测试编号或告警规则
- 不追责声明：复盘关注系统和流程，不针对个人
`)}
<p>演练至少做一次，并录进演示视频：在测试网用 MockStrategy 调用 <code>simulateLoss</code> 制造 1% 亏损 → keeper 调 harvest → 合约自动暂停 → 告警到达 → 守护者执行 emergencyExit → 用户成功取出 → 按模板写一份演练复盘。把每一步的时间记下来，和第 4 节的时间预算比较。</p>

${tryit(`<p><strong>动手练习：</strong>完成一次“暂停演练”。</p>
${steps([
  '把金库部署到本地 <code>anvil</code> 或 Sepolia，用 MockStrategy；用两个测试账户各存入 1,000 测试 USDC，再调用 rebalance。',
  '启动你的监控脚本或 OpenZeppelin Monitor，配置“Harvest 事件 loss &gt; 0”和“Paused 事件”两条规则，通知发到你自己的即时通讯。',
  '调用 <code>simulateLoss</code> 制造 1% 亏损，再用 keeper 账户调用 harvest。记下告警到达时间。',
  '用守护者账户调用 <code>emergencyExit</code>，再用一个用户账户全额 redeem，确认取出成功。',
  '按复盘模板写一页演练记录，放进 <code>docs/drills/</code>。'
])}
<p>预期结果：harvest 之后 <code>paused()</code> 为 true，存款按钮变灰，取出仍然成功；你得到一份带真实时间数据的演练复盘。</p>`)}

${exercises([
  ['Slither 报告 <code>harvest</code> 里“先做除法再做乘法”的精度提示。你怎样判断它是真问题还是误报？', '<p>找到具体那一行，代入极端数字算一遍：例如收益只有 9 个最小单位、费率 10% 时 fee = 0，这是可以接受的取整；如果某种组合下会让 feeShares 远大于应得值，就是真问题。判断结论和算式写进自审报告，并补一个模糊测试覆盖这个区间。</p>'],
  ['为什么“时间锁 CallScheduled 事件”要设为告警，即使它通常是团队自己提交的？', '<p>因为管理 Safe 被攻破时，攻击者的第一步就是向时间锁提交恶意提案。48 小时的延迟只有在有人看到并能取消或通知用户退出时才有意义。监控让延迟真正变成防线。</p>'],
  ['TVL 为 50,000 USDC，攻击每 3 分钟抽走 2%，团队从告警到暂停要 12 分钟。估算最大损失；如果 depositCap 降到 20,000 呢？', '<p>12 分钟 = 4 个周期，损失 ≈ 50,000 × 2% × 4 = 4,000 USDC。上限降到 20,000 时，最坏情况 TVL 为 20,000，损失 ≈ 1,600 USDC。上限直接按比例压低最坏损失。</p>'],
  ['前端已经做了地域限制，为什么威胁模型里仍要把“受限地区使用”标成部分缓解？', '<p>合约是公开的，任何人都可以绕过前端直接调用；VPN 也能绕过地域判断。前端限制只能说明运营方没有主动向该地区提供服务，不能阻止链上交互。这一点要在文档里如实写明，并参考 M12 的框架评估是否需要更多措施。</p>']
])}
${checklist([
  '上线清单的每一项都有验证命令或截图。',
  '写完一份自审报告：范围、假设、逐函数发现、Slither 处理表。',
  '至少配置 6 条告警规则，并测试过其中 2 条能真实送达。',
  '应急手册 RB-01 写明了“谁可以不经讨论直接暂停”。',
  '完成一次暂停演练，并按模板写了演练复盘。',
  '前端有地域提示和地址筛查，文档写明了它们的局限。'
])}
${mistakes([
  ['Slither 报告全部清零才算安全。', 'Slither 找的是写法问题，逻辑漏洞主要靠人审。每条结果要修复或写明理由，不要靠关闭检测器清零。'],
  ['有时间锁就不需要监控。', '时间锁只给出 48 小时窗口。没有人盯着 CallScheduled 事件，这个窗口就白白过去。'],
  ['出事先查清根因，再决定是否暂停。', '先暂停再调查。暂停只停存款，取出不受影响，代价远小于犹豫。'],
  ['前端做了地域限制，就满足了合规要求。', '前端限制可以被绕过，合规义务因地区和业务而不同。毕业项目做的是工程演示，不是法律意见。'],
  ['复盘就是找出谁犯了错。', '复盘关注系统和流程：为什么测试和监控没有提前发现，以及怎样改进。']
])}
${recap([
  '上线清单逐项验证：源码已验证、权限已移交、时间锁 48 小时、种子存款、存款上限、告警接通。',
  '自审五步：冻结范围、列假设、逐函数审查、工具扫描、写发现与处理。',
  '监控盯份额价格、Harvest 亏损、暂停与权限事件、时间锁提案、keeper 健康。',
  '时间预算说明：存款上限和“先暂停再调查”的预先授权最能降低损失。',
  '应急顺序：止血、定位、沟通、恢复、复盘；合规检查要写明局限，不构成法律意见。'
])}
${quiz([
  { q: '下面哪条告警规则最能让 48 小时时间锁真正发挥作用？', o: ['keeper 余额不足', '时间锁 CallScheduled 事件', '索引器延迟', 'TVL 变化'], a: 1, why: '恶意提案必须先 schedule。看到 CallScheduled 才能在延迟期内取消或通知用户退出。' },
  { q: '对 Slither 的一条中危结果，哪种处理不合适？', o: ['修复并补测试', '确认误报并写理由', '接受风险并写理由', '在配置里全局关闭这个检测器'], a: 3, why: '全局关闭会掩盖以后真正的同类问题。每条结果要单独处理并留下记录。' },
  { q: '攻击每 3 分钟抽走 TVL 的 2%，TVL 100,000 USDC，响应 15 分钟。估算损失约为？', o: ['2,000 USDC', '6,000 USDC', '10,000 USDC', '30,000 USDC'], a: 2, why: '15 分钟 = 5 个周期，100,000 × 2% × 5 = 10,000 USDC（未复合，示例）。' },
  { q: '应急响应的第一步是？', o: ['在公开频道讨论漏洞细节', '查清根因', '暂停', '发布复盘'], a: 2, why: '先止血。暂停只停存款与策略操作，用户仍可取出。' },
  { q: '关于前端地域限制，哪种说法正确？', o: ['它能阻止任何受限地区用户调用合约', '它只是前端限制，合约仍可被直接调用', '做了它就不需要地址筛查', '它属于法律意见'], a: 1, why: '合约是公开的，前端限制和 VPN 都能被绕过。文档要如实写明局限。' }
])}
${terms([
  ['自审', 'Self-audit', '开发者按审计流程检查自己的代码并形成报告。'],
  ['静态分析', 'Static analysis', '不运行代码、通过读源码发现可疑写法的方法。'],
  ['应急手册', 'Runbook', '事先写好的、按步骤执行的故障处理文档。'],
  ['复盘', 'Post-mortem', '事故后记录时间线、根因和改进项的报告，不以追责为目的。'],
  ['心跳', 'Heartbeat', '程序定期发出的“仍在运行”信号，缺失即说明程序可能已停止。'],
  ['地域限制', 'Geo-blocking', '按访问者所在地区限制服务的做法。'],
  ['制裁筛查', 'Sanctions screening', '检查地址或用户是否出现在制裁名单上的流程。']
])}
` });

CUR = 'm12-5';
addCh({ id: 'm12-5', nav: '作品集与面试', title: 'M15.5 作品集与面试', desc: '把毕业项目变成作品：README、演示、设计文档，按岗位准备面试与笔试作业', html: `
<h1>M15.5 作品集与面试</h1>
${meta(['把毕业项目整理成评审 30 秒能看懂、30 分钟能复现的作品。', '写一份一页纸的设计文档，并在面试中按“问题树”讲清毕业项目。', '按目标岗位（合约、后端、前端、交易所、数据、协议）找到要复习的手册文章，并用时间预算完成一次笔试作业。'], '前置：<a href="#m12-4">M15.4 上线</a>、<a href="#m00-7">M00.7 学习路线与作品集</a>')}
${beginner(`<p><strong>作品集（Portfolio）</strong>：给招聘方看的一组项目，证明你能做出东西。</p>
<p><strong>设计文档（Design doc）</strong>：动手写代码之前（或交付之后）写的一份说明：要解决什么问题、考虑过哪些方案、为什么选这个。</p>
<p><strong>笔试作业（Take-home exercise）</strong>：公司给你一个小题目，限定时间（例如 4 小时或 3 天）在家完成并提交代码。</p>
<p><strong>系统设计面试（System design interview）</strong>：面试官给一个开放需求，你在白板上画架构、讲取舍。</p>`)}

<h2>1. 一句话理解</h2>
${one('毕业项目做完只是一半。另一半是让别人在很短时间内相信它：README 让人 30 秒看懂，演示视频让人 3 分钟看到它工作，设计文档和面试表达让人相信你懂每一个取舍。')}
${call('analogy', `<p>作品集像一本带目录的画册：封面（README 首屏）决定别人会不会翻开；目录（架构图）让人知道去哪看；每一页的说明文字（设计文档）告诉人你为什么这样画。</p>
<p>比喻的局限：画册只能看，代码可以被运行和验证。所以你的作品必须“能跑”，评审会真的去点那个按钮。</p>`)}
${art('一图看懂：同一个项目，在 30 秒、3 分钟、30 分钟、面试里逐级建立信任', 660, 320, [
  S.text(330, 24, '评审的信任是一级一级建立的', { size: 13.5, b: 1, anchor: 'middle' }),
  S.icon('doc', 80, 62, 28, 'info'),
  S.icon('eye', 247, 62, 28, 'key'),
  S.icon('code', 413, 62, 28, 'info'),
  S.icon('users', 580, 62, 28, 'ok'),
  S.box(10, 86, 140, 120, { k: 'info', t: '30 秒', s: 'README 首屏\n截图 + 演示链接\n仅测试网提示' }),
  S.box(177, 86, 140, 120, { k: 'key', t: '3 分钟', s: '演示视频\n主流程 + 故障演示\n架构与安全' }),
  S.box(343, 86, 140, 120, { k: 'info', t: '30 分钟', s: '设计文档 + 仓库\n5 条命令起全栈\n每条威胁有测试' }),
  S.box(510, 86, 140, 120, { k: 'ok', t: '面试', s: '问题树答到三层\n结论 · 数字\n验证（测试编号）' }),
  S.arrow(152, 146, 175, 146, { k: 'plain' }),
  S.arrow(319, 146, 341, 146, { k: 'plain' }),
  S.arrow(485, 146, 508, 146, { k: 'plain' }),
  S.pill(10, 222, 140, 30, '看懂它做什么', { k: 'info' }),
  S.pill(177, 222, 140, 30, '看到它在工作', { k: 'key', b: 1 }),
  S.pill(343, 222, 140, 30, '相信并能复现', { k: 'info' }),
  S.pill(510, 222, 140, 30, '相信你懂取舍', { k: 'ok' }),
  S.text(330, 290, '每一级都为下一级“值得点开”服务；故障演示是区别于普通作品的一环', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '从左到右是评审投入时间的增加：先扫一眼 README，再看视频，再花半小时读文档和跑仓库，最后进面试追问。'],
  ['key', '3 分钟视频里的故障演示（暂停后仍能取出）最能区分你和其他候选人，大多数作品只演示“能用”。'],
  ['fail', '常见失败：视频里在等交易确认、README 首屏找不到演示链接，评审在第一级就走了。'],
  ['limit', '时间是本课程建议的示例预算，不是行业标准。']
], '四级展示：30秒看README首屏，3分钟看含故障演示的演示视频，30分钟读设计文档和复现仓库，最后是答到三层的面试问题树。', 'm12-5')}
${recall('<p>整体学习路线、作品集仓库的组织方式、通用面试题和“目标 → 架构 → 最难的问题 → 怎么验证 → 数据结果 → 如果重做”的项目讲述框架，已经在 <a href="#m00-7">M00.7 学习路线与作品集</a> 讲过。本篇只讲：怎样展示<strong>完成后的毕业项目</strong>，以及按岗位准备面试。</p>')}

<h2>2. 把项目整理成作品</h2>
${tbl(['位置', '放什么', '检查标准'], [
  ['README 首屏', '一句话说明、一张截图或动图、演示链接、“仅测试网、未经专业审计”提示', '不滚动就能看到演示链接'],
  ['README 第二屏', '架构图（M15.2 的六层图）、合约地址表（带浏览器链接）、技术栈', '地址点得开，源码已验证'],
  ['快速开始', '≤ 5 条命令起本地全栈：anvil + 部署脚本 + 索引器 + 前端', '在一台新电脑上照做能跑通'],
  ['安全小节', '威胁模型摘要、自审报告链接、Slither 结果、不变量列表', '每条威胁都能点到测试'],
  ['数字', '测试数量、覆盖率、不变量轮数、告警到暂停的演练时间', '数字可复现，不写无法验证的数'],
  ['已知限制与扩展方向', '来自 M15.1 的 Won’t 清单', '诚实，不夸大']
])}
${steps2('3–5 分钟演示视频的结构（示例）', [
  { t: '0:00 问题', d: '一句话：用户想要稳健收益，但不想自己管理借贷仓位', kind: '' },
  { t: '0:20 演示主流程', d: '连钱包 → 授权 → 存入 → 看收益曲线 → 取出', kind: 'key' },
  { t: '1:30 故障演示', d: '模拟亏损 → 自动暂停 → 告警截图 → 用户仍能取出', kind: 'risk' },
  { t: '2:30 架构', d: '六层图，指出哪两层托管资金', kind: '' },
  { t: '3:15 安全', d: '通胀攻击数字对比、权限“停得快开得慢”、不变量', kind: '' },
  { t: '4:00 收尾', d: '最难的一个问题和你的解决方法；仓库链接', kind: '' }
], [
  ['key', '故障演示是区别于普通作品的关键。大多数作品只演示“能用”，你演示的是“出事时也安全”。'],
  ['fail', '常见问题是视频里在等交易确认。剪掉等待，或在本地 anvil 上录主流程。'],
  ['flow', '视频顺序和 README 顺序一致：先看到产品，再看到架构和安全。']
])}

<h2>3. 一页纸设计文档</h2>
${code('MARKDOWN', `
# 设计文档：Capstone Yield Vault（一页版）
## 背景与目标
用户把 USDC 存入金库获得借贷利息；目标：测试网可用、空金库攻击下损失 < 0.01%、告警到暂停 < 15 分钟

## 非目标
主网、多链、多策略、治理代币

## 方案
ERC-4626（OpenZeppelin，offset = 6）+ Aave V3 供应策略；Safe 2/3 + 48 小时时间锁；守护者可暂停

## 考虑过的备选
1. 每笔存款直接进入策略 —— 放弃：每笔多付 Gas，且策略故障时存款失败
2. 用预言机计算份额价格 —— 放弃：份额以 USDC 计，预言机只会增加操纵面
3. 暂停时禁止取出 —— 放弃：守护者被盗会冻结用户资金

## 风险与缓解
见 threat-model.md：TH-01 到 TH-09，每项对应测试编号

## 衡量指标
pps 曲线、TVL、告警到暂停时间、不变量轮数

## 如果重做
从第一天就写工厂合约，让部署与种子存款原子完成
`)}
<p>“考虑过的备选”是设计文档最有价值的部分。面试官最常问的不是“你做了什么”，而是“为什么不用另一种做法”。提前写好三条，面试时就有现成的答案。</p>

<h2>4. 面试：毕业项目的问题树</h2>
${mm('面试官怎样一层层追问你的金库', `
flowchart TB
  Q0["介绍一下你的毕业项目"] --> Q1["份额价格怎么算"]
  Q0 --> Q2["怎样防通胀攻击"]
  Q0 --> Q3["谁有什么权限"]
  Q1 --> Q11["为什么不用预言机"]
  Q1 --> Q12["业绩费怎么收 为什么铸份额"]
  Q2 --> Q21["offset 取 6 的理由"]:::key
  Q2 --> Q22["别的协议读你的价格会怎样"]
  Q3 --> Q31["守护者被盗会怎样"]
  Q3 --> Q32["时间锁的 execute 谁能调"]
  Q12 --> Q121["新存款会不会被算成收益"]:::risk
  Q22 --> Q221["讲一个真实事件"]
`, [
  ['flow', '面试官通常从一个开放问题开始，然后沿着你回答里最薄弱的地方往下追问三到四层。'],
  ['key', '每个分支准备到第三层：结论、理由、数字或测试编号。例如“offset = 6：攻击者捐赠 10,000 USDC 会亏约 5,000，受害者只损失约 0.0025”。'],
  ['risk', '“新存款会不会被算成收益”这类问题是在考你是否真的写过和测过。答“我写了 T-11 和 I-03，删掉那行加法两者都会失败”最有说服力。'],
  ['limit', '问题树只覆盖你的项目。岗位相关的基础题按第 5 节的表格复习。']
])}
${call('info', '<p>回答技巧：先给一句话结论，再给一个数字，最后说怎样验证。例如：“暂停不影响取出（结论）；演练中从告警到暂停用了 6 分钟（数字）；T-14 测试和演练复盘都在仓库里（验证）。”</p>')}

<h2>5. 按岗位复习</h2>
${tbl(['岗位', '常见考察领域', '复习文章', '毕业项目里能讲的部分'], [
  ['智能合约工程师', '重入与访问控制、预言机操纵、代理升级、Gas 优化、审计方法', '<a href="#m02-7">M02.8</a>、<a href="#m02-8">M02.9</a>、<a href="#m02-6">M02.7</a>、<a href="#m02-62">M02.10</a>、<a href="#m02-11">M05.3</a>', '金库 override、通胀攻击、不变量测试、自审报告'],
  ['后端 / 基础设施', '索引器与重组、nonce 与 Gas、RPC 高可用、幂等与对账', '<a href="#m01-8">M01.8</a>、<a href="#m01-9">M01.9</a>、<a href="#m03-6">M08.6</a>、<a href="#m05-6">M04.6</a>、<a href="#m05-10">M04.8</a>', 'Ponder 索引器、keeper、监控与心跳'],
  ['前端', '钱包连接与网络切换、单位精度、交易状态、签名安全、前端供应链', '<a href="#m07-2">M03.2</a>、<a href="#m07-4">M03.4</a>、<a href="#m07-7">M03.7</a>、<a href="#m07-8">M03.8</a>、<a href="#m07-9">M03.9</a>', '两步存入流程、12 位份额显示、maxDeposit 提示'],
  ['交易所', '账本与复式记账、撮合、充提与冷热钱包、储备金证明', '<a href="#m04-3">M09.4</a>、<a href="#m04-4">M09.5</a>、<a href="#m04-6">M09.7</a>、<a href="#m04-8">M09.9</a>', '份额记账与对账思路、密钥分级'],
  ['链上数据 / 研究', '事件解码、SQL 分析、资金追踪、指标定义', '<a href="#m05-9">M04.10</a>、<a href="#m05-66">M12.4</a>、<a href="#m05-67">M12.5</a>', 'share_price 表设计、年化收益计算'],
  ['协议 / 研究工程', '共识与最终性、Rollup、MEV、DeFi 机制设计', '<a href="#m05-2">M04.2</a>、<a href="#m05-3">M04.3</a>、<a href="#m05-5">M04.5</a>、<a href="#m05-7">M04.7</a>、<a href="#m10-4">M07.4</a>', '风控参数的取舍、集成方读价格的风险']
])}
<p>表里的“考察领域”是常见方向的归纳，不同公司差别很大 ${tag('惯例')}。投递前读职位描述，把出现的技术名词逐个对到手册文章上，没覆盖的再单独补。</p>

<h2>6. 笔试作业</h2>
<p><strong>算一算（示例）：一份 4 小时笔试作业的时间分配。</strong>题目：“写一个带锁定期的质押合约，附测试。”</p>
${steps([
  '读题与提问：<strong>20 分钟</strong>。列出不清楚的地方（锁定期从存入还是从最后一次存入算？能否提前取出？），写进 README 的“假设”。',
  '核心实现：<strong>100 分钟</strong>（占 42%）。只做题目要求的功能，不加额外特性。',
  '测试：<strong>70 分钟</strong>（占 29%）。正常流程、边界（锁定期刚好到期的那一秒）、权限、一个模糊测试。',
  'README：<strong>30 分钟</strong>。怎样运行、设计取舍、已知限制、如果有更多时间会做什么。',
  '缓冲：<strong>20 分钟</strong>。CI 跑一遍、自己从新目录克隆再运行一次。合计 240 分钟。'
])}
${tbl(['做', '不做'], [
  ['第一次提交就有能运行的骨架，之后小步提交', '最后一次性提交几千行'],
  ['在 README 写明假设和取舍', '默默选择一种理解，不说明'],
  ['测试覆盖边界和权限', '只测正常流程'],
  ['用题目指定的工具和版本', '为了炫技换一套陌生框架'],
  ['按时提交，未完成部分写进 README', '超时很多，或谎称完成']
])}
${call('warn', '<p>笔试作业可以用 AI 辅助，但要遵守公司的规则，并且你必须能逐行解释提交的每一段代码。面试官常在后续面试里让你现场修改作业，讲不出来比没写完更糟。</p>')}

${tryit(`<p><strong>动手练习：</strong>做一次完整的“作品发布 + 模拟面试”。</p>
${steps([
  '按第 2 节的表格重写 README 首屏和第二屏。请一位没看过项目的朋友打开仓库，计时：多久能找到演示链接、多久能说出项目做什么。',
  '按第 2 节的结构录一段 4 分钟以内的演示视频，必须包含故障演示。',
  '写一页设计文档，至少列出三条“考虑过的备选”。',
  '请同伴按第 4 节的问题树追问 20 分钟，把卡住的问题记下来，回到对应文章复习。',
  '选一个目标岗位，按第 5 节的表格列出要复习的文章，排进下一周的计划。'
])}
<p>预期结果：朋友在 30 秒内找到演示链接；你能把问题树的每个分支答到第三层；你有一份按岗位排好的复习清单。</p>`)}

${exercises([
  ['面试官问：“你的金库为什么不在每笔存款时直接把资金送进策略？”请用“结论 → 数字 → 验证”回答。', '<p>结论：为了节省用户 Gas 并隔离策略故障，存款先留在金库，由 keeper 统一再平衡。数字：每笔存款少一次外部调用和一次授权（具体节省以 <code>forge test --gas-report</code> 为准）；闲置比例 10% 覆盖日常取出。验证：rebalance 有单元测试，T-14 演示了策略亏损时取出仍然可用。</p>'],
  ['你投递“链上数据分析师”岗位。毕业项目里哪部分最值得在简历上写？怎样写？', '<p>写索引与指标部分：例如“设计份额价格快照表（整数存储、可重算），用快照计算 7 日与 30 日年化，与链上 convertToAssets 结果误差为取整级别”。同时准备 Dune 或 SQL 的复习（<a href="#m05-66">M12.4</a>），因为面试通常会现场写查询。</p>'],
  ['笔试作业只剩 30 分钟，核心功能完成了，但还没写测试和 README。你怎样分配？', '<p>先用 15 分钟写 2–3 个最关键的测试（正常流程、一个边界、一个权限），再用 15 分钟写 README：怎样运行、假设、未完成的部分和计划。可运行 + 有说明，比功能多一点但没人看得懂更好。</p>']
])}
${checklist([
  'README 首屏不滚动就能看到演示链接和“仅测试网”提示。',
  '演示视频不超过 5 分钟，包含一次故障演示。',
  '写好一页设计文档，至少三条备选方案和放弃理由。',
  '能把问题树的每个分支答到第三层（结论、数字、验证）。',
  '为目标岗位列出复习文章清单。',
  '能按 4 小时预算完成一份笔试作业，并在 README 写明假设。'
])}
${mistakes([
  ['作品越多越好，毕业项目只是其中一个。', '一个讲得透的完整产品，胜过多个停在示例阶段的项目。毕业项目应放在作品集首位。'],
  ['演示视频只要展示功能。', '故障演示（暂停、取出仍可用）最能体现工程能力，应占视频的四分之一左右。'],
  ['设计文档只写最终方案。', '“考虑过的备选和放弃理由”最有价值，也是面试最常追问的地方。'],
  ['笔试作业功能越多越好。', '评审看的是正确性、测试和说明。超出题目的功能通常不加分，还会挤掉测试时间。']
])}
${recap([
  'README 首屏放演示链接和测试网提示；第二屏放架构图和合约地址。',
  '演示视频 3–5 分钟：问题、主流程、故障演示、架构、安全、收尾。',
  '一页设计文档的核心是“考虑过的备选”。',
  '按问题树准备到第三层：结论、数字、验证。',
  '按岗位对照复习文章；笔试作业按时间预算分配，并写明假设。'
])}
${quiz([
  { q: '演示视频里最能区分你和其他候选人的部分通常是？', o: ['精美的界面动画', '故障演示：暂停后仍能取出', '介绍你用了多少个库', '展示代码行数'], a: 1, why: '大多数作品只演示“能用”。展示出事时的安全行为，体现的是生产意识。' },
  { q: '一页设计文档中，面试官最常追问的部分是？', o: ['背景', '考虑过的备选与放弃理由', '标题', '技术栈列表'], a: 1, why: '“为什么不用另一种做法”是最常见的追问，备选方案和理由正好回答它。' },
  { q: '4 小时笔试作业，下面哪种分配最合理？', o: ['全部时间写功能', '功能约 40%，测试约 30%，README 与缓冲约 30%', '先写 README 2 小时', '只写测试不写功能'], a: 1, why: '可运行、有测试、有说明的提交最容易得到好评。全部写功能会没有测试和说明。' },
  { q: '投递前端岗位，下列哪组文章最该优先复习？', o: ['M04.3 PoS 与 M04.5 Rollup', 'M03.2 连接钱包、M03.4 单位精度、M03.7 交易状态', 'M09.4 账本设计', 'M05.3 借贷协议'], a: 1, why: '前端面试集中在钱包连接、精度与交易状态。其他文章对应协议、交易所和合约岗位。' }
])}
${terms([
  ['作品集', 'Portfolio', '用来向招聘方证明能力的一组可验证项目。'],
  ['设计文档', 'Design doc', '说明问题、方案、备选与取舍的文档。'],
  ['笔试作业', 'Take-home exercise', '限定时间内在家完成并提交的编程题目。'],
  ['系统设计面试', 'System design interview', '在开放需求下画架构、讲取舍的面试形式。'],
  ['问题树', 'Question tree', '从一个开放问题出发、沿回答薄弱处逐层追问的结构。']
])}
` });
})();
