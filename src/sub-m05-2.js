/* ---------- M04 子文章（二）---------- */
(() => {

/* ===================== m05-4 扩容路线 ===================== */
CUR = 'm05-4';
addCh({ id: 'm05-4', nav: '扩容路线', title: 'M04.4 扩容路线：链上、链下与模块化区块链', desc: '从加大区块到 Rollup 与 DA 层，看清每种扩容方案的安全假设', html: `
<h1>M04.4 扩容路线：链上、链下与模块化区块链</h1>
${meta(['区分链上扩容（加大区块、分片）和链下扩容（状态通道、侧链、Plasma、Rollup、Validium）。', '解释数据可用性问题，以及它为什么决定了一个扩容方案“安全不安全”。', '用“执行 / 结算 / 共识 / 数据可用性”四层模型，分析任意一条 L2、L3 或应用链的安全假设。'], '<a href="#m05-1">M04.1 公链全景</a>、<a href="#m05-2">M04.2 以太坊架构</a>')}
${beginner(`<p><strong>吞吐量（Throughput）</strong>：一条链每秒能处理多少笔交易，常用 TPS（Transactions Per Second）表示。</p>
<p><strong>L1 / L2</strong>：L1（Layer 1，第一层）是基础公链本身，例如以太坊主网。L2（Layer 2，第二层）是建在 L1 之上、借用 L1 安全性的系统。</p>
<p><strong>状态（State）</strong>：链上所有账户余额、合约存储的当前快照。执行交易就是把旧状态变成新状态。</p>
<p><strong>数据可用性（Data Availability，DA）</strong>：交易数据被公开发布，任何人都能下载。只有数据可下载，别人才能独立检查结果对不对。</p>
<p><strong>安全假设（Security Assumption）</strong>：一个系统“不丢钱”需要哪些条件成立，例如“5 个签名者里至少 3 个诚实”。</p>`)}

<h2>1. 一句话理解</h2>
${one('扩容就是让更多交易便宜地上链；每一种扩容方案都在用某种新的安全假设，交换更高的吞吐量。读懂一个方案，先问：数据放在哪？谁来证明结果正确？我能不能自己把钱取回来？')}
${call('analogy', `<p>把 L1 想成一条只有 2 条车道的高速公路。扩容有三类思路：</p>
<p>① <strong>拓宽马路</strong>（加大区块）：车道变多，但修路和维护的成本高，只有大公司养得起路，普通人无法再“检查路况”。② <strong>分出多条平行公路</strong>（分片）：总运力变大，但跨路协调变复杂。③ <strong>拼车上路</strong>（Rollup）：100 个乘客挤进一辆大巴，只占一个车位，高速公路只登记乘客名单。</p>
<p>类比的局限：真实的 Rollup 不只是“拼车”，它还要向 L1 证明“乘客都下对了站”（状态转换正确），这一步才是安全的关键。</p>`)}
${art('一图看懂：离 L1 越远，交易越便宜，要多信任的东西越多', 660, 312, [
  S.box(10, 14, 150, 128, { k: 'tint', icon: 'block', t: 'L1 直接', s: '数据：L1\n证明：L1 共识\n≈143 TPS 示例', ss: 11.5 }),
  S.box(173, 14, 150, 128, { k: 'key', icon: 'doc', t: 'Rollup', s: '数据：L1 blob\n证明：L1 验证\n≈1,638 TPS 示例', ss: 11 }),
  S.box(336, 14, 150, 128, { k: 'warn', icon: 'db', t: 'Validium', s: '数据：外部 DA\n证明：有效性证明\n更便宜', ss: 11.5 }),
  S.box(499, 14, 150, 128, { k: 'risk', icon: 'link', t: '侧链', s: '数据：侧链自己\n证明：侧链共识\n更便宜 要靠桥', ss: 11.5 }),
  S.pill(10, 158, 150, 30, '能自己强制取回', { k: 'ok' }),
  S.pill(173, 158, 150, 30, '能自己强制取回', { k: 'ok' }),
  S.pill(336, 158, 150, 30, '数据被扣留就不能', { k: 'risk' }),
  S.pill(499, 158, 150, 30, '依赖桥和侧链验证者', { k: 'risk' }),
  S.arrow(10, 232, 650, 232, { k: 'key', label: '离 L1 越远：越便宜，信任假设越多' }),
  S.text(330, 290, '选方案先问三件事：数据放哪？谁证明正确？我能不能自己把钱取回来？', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '从左到右，执行和数据逐步离开 L1，吞吐上升，L1 能替用户兜底的部分变少。'],
  ['key', '以太坊走 Rollup 中心路线：L1 提供更多更便宜的 blob 数据空间，执行交给 Rollup。'],
  ['risk', 'Validium 和侧链出事时，L1 无法帮用户找回资金。'],
  ['limit', 'TPS 是示例估算（区块 Gas 上限 3,600 万；每块 6 个 blob），真实数字以链上为准。']
], '四种扩容方案按离 L1 的距离排列：L1 直接交易、Rollup、Validium、侧链，越往右越便宜但信任假设越多', 'm05-4')}

<h2>2. 为什么不能简单地“加大区块”</h2>
<p>L1 的吞吐量受两个参数限制：每个区块的容量（以太坊用 Gas 上限衡量）和出块间隔。直接加大区块，TPS 确实会上升。但每个全节点都要下载、执行、存储全部区块。区块越大，运行节点需要的带宽、CPU 和磁盘越多。能运行节点的人越少，链就越依赖少数大机构，去中心化就下降。这就是 <a href="#m05-1">M04.1</a> 讲的<strong>不可能三角</strong>：去中心化、安全、可扩展性三者难以同时做到最好。</p>
${call('info', `<p>2017 年比特币社区发生过“区块大小之争”。主张加大区块的一方分叉出了比特币现金（BCH）。比特币主链选择保持小区块，把扩容交给链下方案（闪电网络）。这场争论的核心正是“节点成本 vs 吞吐量”。</p>`)}
<p><strong>算一算（示例）：以太坊 L1 的理论上限</strong></p>
${steps([
  '假设区块 Gas 上限为 3,600 万（示例值，以太坊在 2025 年逐步上调过 Gas 上限，具体以链上为准）。',
  '一笔最简单的 ETH 转账消耗 21,000 Gas。',
  '每个区块最多容纳：36,000,000 ÷ 21,000 ≈ 1,714 笔转账。',
  '出块间隔 12 秒：1,714 ÷ 12 ≈ <strong>143 TPS</strong>。',
  '真实交易（代币转账、DEX 兑换）消耗 5 万到 20 万 Gas，实际 TPS 只有十几到几十。'
])}
<p>对比：如果把交易数据交给 Rollup，用 blob 发布。假设每个区块的 blob 目标数是 6 个（示例，Pectra 升级后的目标值），每个 blob 128 KB，每笔压缩后的 L2 交易 40 字节：6 × 131,072 ÷ 40 ≈ 19,660 笔 / 12 秒 ≈ <strong>1,638 TPS</strong>。数据带宽，而不是执行能力，成为新的上限。</p>

<h2>3. 链上扩容与链下扩容全景</h2>
${mm('扩容方案分类图', `
flowchart TB
  ROOT["扩容方案"] --> ON["链上扩容<br/>改 L1 本身"]
  ROOT --> OFF["链下扩容<br/>交易在 L1 之外执行"]
  ON --> BIG["加大区块 / 缩短出块<br/>节点成本上升"]
  ON --> SH["分片 Sharding<br/>以太坊转向数据分片"]
  OFF --> CH["状态通道<br/>闪电网络"]
  OFF --> SC["侧链<br/>独立共识 + 桥"]
  OFF --> PL["Plasma<br/>只发布状态承诺"]
  OFF --> RU["Rollup<br/>数据上 L1 + 证明"]
  OFF --> VA["Validium / Optimium<br/>数据放链下"]
  RU --> OR["乐观 Rollup<br/>欺诈证明"]
  RU --> ZK["ZK Rollup<br/>有效性证明"]
  SH --> DS["Danksharding 路线<br/>blob 为 Rollup 提供数据空间"]
  DS -.->|"服务于"| RU
`, [
  ['flow', '链上扩容直接修改 L1 的参数或结构；链下扩容把执行搬出 L1，只把“摘要”或“数据 + 证明”交回 L1。'],
  ['key', '以太坊选择“Rollup 中心路线”：L1 不追求执行更多交易，而是提供更多、更便宜的数据空间（blob），让 Rollup 去执行。'],
  ['limit', '状态通道只适合固定参与者之间的高频交互（例如支付），不适合开放的 DeFi 合约。'],
  ['risk', '侧链和 Validium 的数据或安全不完全依赖 L1。它们出事时，L1 无法帮用户找回资金。']
])}
<p>下面逐个说明。</p>
<p><strong>状态通道（State Channel）</strong>：两方先在 L1 锁定资金，然后在链下来回交换签名过的余额更新，最后只把最终余额提交到 L1。比特币闪电网络（Lightning Network）就是支付通道网络。优点是即时、几乎免费；缺点是需要双方在线、资金要提前锁定、只适合固定参与者（通道、HTLC 与多跳路由见 <a href="#m05-62">M04.21 闪电网络</a>）。</p>
<p><strong>侧链（Sidechain）</strong>：一条独立运行的区块链，有自己的验证者和共识，通过桥和 L1 互通。例如 Polygon PoS 最初就定位为以太坊侧链。侧链的安全完全取决于它自己的验证者，与 L1 无关。</p>
<p><strong>Plasma</strong>：2017 年提出。运营者只把每个区块的状态承诺（默克尔根）发布到 L1，交易数据留在链下。用户发现作恶时，用“退出游戏”把资金撤回 L1。问题在于：如果运营者扣留数据，用户就无法证明自己的余额，只能大规模抢先退出。Plasma 难以支持通用智能合约，后来被 Rollup 取代。</p>
<p><strong>Rollup</strong>：把交易数据完整发布到 L1，并用欺诈证明或有效性证明保证结果正确。任何人都能用 L1 上的数据重建 L2 状态。细节见 <a href="#m05-5">M04.5 Rollup 深入</a>。</p>
<p><strong>Validium / Optimium</strong>：证明方式和 Rollup 相同（Validium 用 ZK 证明，Optimium 用欺诈证明），但数据不发布到 L1，而是交给一个数据可用性委员会（DAC）或外部 DA 层。更便宜，但如果数据被扣留，用户可能无法提款。</p>

<h2>4. 数据可用性：扩容安全的核心</h2>
<p>新手常以为“有了 ZK 证明就绝对安全”。其实证明只保证“新状态是按规则从旧状态算出来的”。如果没有人能拿到交易数据，你就不知道自己账户的余额和默克尔证明，也无法在运营者消失时自己提款。所以数据可用性和证明一样重要。</p>
${mm('数据被扣留时会发生什么', `
flowchart LR
  OP["运营者 / 排序器"] -->|"发布状态根"| L1[("L1 合约")]
  OP -->|"扣留交易数据"| X["数据不可得"]
  X --> U1["用户无法计算<br/>自己的余额证明"]
  U1 --> F1["Validium：资金冻结<br/>直到数据恢复"]
  X --> U2["验证者无法检查<br/>状态是否正确"]
  U2 --> F2["乐观方案：无法发起<br/>欺诈证明，错误状态生效"]
  L1 -.->|"Rollup：数据在 L1"| OK["任何人可重建状态<br/>并强制提款"]
`, [
  ['flow', '运营者可以只发布状态根而扣留数据。Rollup 强制把数据写进 L1，从根本上消除这个问题。'],
  ['fail', '在乐观方案里，没有数据就没人能挑战；错误的状态根在挑战期结束后会被当成正确结果。'],
  ['risk', 'Validium 和 Optimium 依赖 DAC 成员诚实并在线。DAC 成员串通扣留数据，用户资金被冻结。'],
  ['key', '判断一个 L2 是否“继承 L1 安全”，第一个问题永远是：交易数据是否发布在 L1 上。']
])}
<p><strong>数据可用性采样（Data Availability Sampling，DAS）</strong>：如果数据量很大，轻节点不想下载全部数据，怎么确认“数据真的都发布了”？方法是把数据做纠删码（Erasure Coding）扩展成两倍，再随机抽查几十个小片段。只要抽查都成功，就能以极高概率确认完整数据可恢复。Celestia 从 2023 年主网起使用 DAS；以太坊在 2025 年 12 月的 Fusaka 升级中引入 PeerDAS，让节点只下载部分 blob 数据。</p>
${call('deep', `<p>为什么纠删码 + 抽样有效？数据扩展成 2 倍后，只要任意 50% 的片段可得，就能恢复全部数据。攻击者想让数据不可恢复，必须扣留超过 50% 的片段。一个轻节点随机抽 30 次，每次抽中“可得片段”的概率不超过 1/2，30 次全部成功的概率不超过 (1/2)^30 ≈ 10 亿分之一。</p>`)}

<h2>5. 模块化区块链：四层拆分</h2>
<p>传统公链（比特币、早期以太坊、Solana）是<strong>单体链（Monolithic）</strong>：一条链同时负责执行、结算、共识和数据可用性。<strong>模块化区块链（Modular Blockchain）</strong>把这四件事拆开，每一层交给最擅长的系统。</p>
${tbl(['层', '职责', '例子'], [
  ['执行层 Execution', '运行交易，计算新状态', 'Rollup 的排序器和执行节点（Arbitrum、OP Mainnet、Base、zkSync）'],
  ['结算层 Settlement', '验证证明、裁决争议、作为桥的信任锚', '以太坊 L1 上的 Rollup 合约'],
  ['共识层 Consensus', '对交易顺序达成一致', '以太坊信标链、Celestia 的 CometBFT 共识'],
  ['数据可用性层 DA', '保证数据已发布、可下载', '以太坊 blob、Celestia、EigenDA、Avail']
])}
${mm('模块化堆栈：一个 Rollup 由哪些层拼成', `
flowchart TB
  APP["应用 / 用户交易"] --> EX["执行层<br/>Rollup 节点"]
  EX -->|"状态根 + 证明"| ST["结算层<br/>以太坊 L1 合约"]
  EX -->|"交易数据"| DAQ{"数据放哪？"}
  DAQ -->|"以太坊 blob"| ETHDA["以太坊 DA<br/>= Rollup"]
  DAQ -->|"Celestia / EigenDA"| ALT["外部 DA 层<br/>= Validium 类"]
  ST --> CON["共识层<br/>以太坊 PoS"]
  ETHDA --> CON
  ALT --> CON2["外部 DA 自己的共识"]
`, [
  ['flow', '执行层把状态根和证明交给结算层，把数据交给 DA 层。DA 的选择决定了它在分类上是 Rollup 还是 Validium 类。'],
  ['key', '安全性取决于最弱的一层。结算在以太坊但数据在外部 DA，则安全上限等于外部 DA 的安全。'],
  ['limit', '模块越多，跨层通信、升级协调和故障排查越复杂。'],
  ['risk', '外部 DA 层宕机或被攻击时，依赖它的链可能停止出块或无法提款。']
])}
<h3>各方案安全假设对比</h3>
${tbl(['方案', '数据放哪', '正确性保证', '用户能否单方面取回资金', '主要信任对象'], [
  ['L1 直接交易', 'L1', 'L1 共识', '能', 'L1 验证者'],
  ['状态通道', '参与方本地', '双方签名 + L1 争议', '能（需在线监控）', '对手方 + 自己在线'],
  ['侧链', '侧链', '侧链共识', '不能，依赖桥', '侧链验证者 + 桥'],
  ['Plasma', '运营者', '欺诈证明 + 退出', '能，但数据扣留时困难', '运营者 + 自己在线'],
  ['乐观 Rollup', 'L1', '欺诈证明（1 个诚实挑战者）', '能（强制包含 + 挑战期）', 'L1 + 至少一个诚实验证者'],
  ['ZK Rollup', 'L1', '有效性证明（数学）', '能', 'L1 + 密码学 + 电路无漏洞'],
  ['Validium', 'DAC / 外部 DA', '有效性证明', '数据被扣留时不能', 'DAC 或外部 DA'],
  ['Optimium', 'DAC / 外部 DA', '欺诈证明', '数据被扣留时不能', 'DAC + 诚实挑战者']
])}
${call('warn', `<p>表格描述的是“设计目标”。很多 L2 目前仍有可升级合约、安全委员会、中心化排序器或尚未上线的证明系统。一个“乐观 Rollup”如果欺诈证明还没开放，它实际上依赖运营者诚实。选链前请查看 <a href="#m05-5">M04.5</a> 讲的 L2BEAT 安全阶段。</p>`)}

<h3>L3 与应用链</h3>
<p><strong>L3（Layer 3）</strong>：建在 L2 之上的链，把 L2 当作结算层。例如基于 Arbitrum Orbit 或 OP Stack 部署、结算到某个 L2 的链。好处是更便宜、可定制 Gas 代币和参数；代价是安全链条变长：L3 → L2 → L1，任何一环出问题都会传导。</p>
<p><strong>应用链（Appchain）</strong>：为单个应用定制的链。实现方式有三类：① Cosmos SDK 独立链，靠 IBC 互通（见 <a href="#m05-1">M04.1</a>）；② 用 Rollup 框架（OP Stack、Arbitrum Orbit、ZK Stack、Polygon CDK）部署专用 Rollup；③ 使用“Rollup 即服务”（RaaS）厂商托管。选择应用链的常见原因：需要独占吞吐、自定义 Gas 代币、自定义排序规则（例如防 MEV）、或收取排序收入。</p>

<h2>6. 工程视角：如何评估和接入一个扩容方案</h2>
${steps([
  '确认 DA：数据发布在以太坊 blob、calldata，还是外部 DA？在区块浏览器上找批次提交交易验证。',
  '确认证明系统：欺诈证明是否已上线、是否无需许可（任何人都能挑战）？ZK 证明是否已在 L1 验证？',
  '确认升级权限：合约由谁升级？是否有时间锁？安全委员会成员和阈值是多少？',
  '确认退出路径：排序器宕机时，用户能否通过 L1 强制包含交易并提款？要等多久？',
  '确认工程依赖：RPC 服务、区块浏览器、索引器（The Graph 或自建）、预言机、官方桥在该链是否可用。',
  '确认费用模型：L2 费用 = L2 执行费 + L1 数据费。数据费随 blob 市场波动，写进成本监控。'
])}
${code('BASH', `
# 查看以太坊主网最新区块中 blob 的使用情况（Dencun 之后的区块头字段）
curl -s -X POST https://ethereum-rpc.publicnode.com \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBlockByNumber","params":["latest",false]}' \\
  | jq '.result | {number, gasUsed, gasLimit, blobGasUsed, excessBlobGas}'
# blobGasUsed ÷ 131072 = 本区块包含的 blob 数量
`)}
${tryit(`<p>目标：亲眼看到 Rollup 把数据交给 L1。</p>
<ol><li>打开 L2BEAT 网站（l2beat.com），在 Scaling 列表中选择 Base 或 Arbitrum One，查看 “Data Availability” 一栏，记录它的 DA 方式。</li>
<li>再找一条标注为 Validium 或 Optimium 的链，对比它的 DA 方式和风险说明。</li>
<li>运行上面的 curl 命令，计算最新区块包含几个 blob。</li></ol>
<p>预期结果：主流 Rollup 的 DA 显示为 Ethereum（blobs）；Validium 类显示为 DAC 或外部 DA；最新区块的 blob 数量在 0 到上限之间。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['确认目标链的 DA 方式', '决定数据扣留时资金是否安全', 'L2BEAT 风险页 + 查看批次提交交易'],
  ['确认证明系统已上线且无需许可', '证明未上线时，安全等于运营者诚实', '查阅官方文档与 L2BEAT 阶段评级'],
  ['记录升级权限和时间锁', '恶意或错误升级可直接转走桥内资产', '读取代理合约 admin 和多签成员'],
  ['演练强制提款路径', '排序器宕机时需要自救', '测试网上走一遍 L1 强制包含流程'],
  ['监控 L1 数据费', '数据费波动直接影响 L2 成本', '按日记录 blob base fee 与批次成本']
])}

${mistakes([
  ['TPS 越高的链越好。', 'TPS 只是一个维度。要同时看去中心化程度、数据可用性和用户能否自行退出。'],
  ['有 ZK 证明就绝对安全。', '证明只保证计算正确。数据不可得时，用户仍可能无法提款；电路漏洞和升级权限也是风险。'],
  ['侧链也是 L2。', '侧链有独立共识，安全不来自 L1。严格意义上的 L2 必须让 L1 保证数据和结果。'],
  ['分片已经被放弃了。', '以太坊放弃的是“执行分片”，转向“数据分片”：blob 和 PeerDAS 就是数据分片路线的一部分。'],
  ['L3 一定比 L2 更好。', 'L3 更便宜、更可定制，但安全依赖链更长，桥接和退出更复杂。']
])}
${recap([
  '加大区块会抬高节点成本，牺牲去中心化；这是不可能三角的直接体现。',
  '链下扩容按“数据放哪、谁证明正确”区分：状态通道、侧链、Plasma、Rollup、Validium。',
  '数据可用性和证明同等重要：没有数据，就无法挑战、无法自行提款。',
  '模块化区块链把执行、结算、共识、DA 拆开，安全取决于最弱的一层。',
  '以太坊走 Rollup 中心路线：L1 提供数据空间（blob、PeerDAS），Rollup 负责执行。'
])}
${quiz([
  { q: '一条链把 ZK 有效性证明提交到以太坊，但交易数据交给一个 7 人委员会保存。它属于哪一类？', o: ['ZK Rollup', '侧链', 'Validium', '状态通道'], a: 2, why: '证明在 L1 验证、数据放链下委员会（DAC），这就是 Validium。ZK Rollup 要求数据发布在 L1；侧链有独立共识；状态通道只在参与方之间交换签名。' },
  { q: '在乐观 Rollup 中，如果运营者扣留交易数据，最直接的后果是什么？', o: ['验证者无法发起欺诈证明，错误状态可能生效', 'L1 会自动回滚 L2', 'ZK 证明失效', '用户的私钥泄露'], a: 0, why: '欺诈证明需要原始数据来重放执行。没有数据，没人能证明错误。L1 不会自动回滚；乐观 Rollup 没有 ZK 证明；数据扣留与私钥无关。' },
  { q: '假设区块 Gas 上限 3,000 万、出块 12 秒，只做 21,000 Gas 的转账，L1 的 TPS 约是多少？', o: ['约 12', '约 1,428', '约 2,500', '约 119'], a: 3, why: '30,000,000 ÷ 21,000 ≈ 1,428 笔每块，÷ 12 秒 ≈ 119 TPS。1,428 是每块笔数，不是每秒。' },
  { q: '数据可用性采样（DAS）让轻节点做什么？', o: ['下载全部区块数据并执行', '随机抽查少量数据片段，以高概率确认数据完整可得', '验证 ZK 证明', '替代共识投票'], a: 1, why: 'DAS 基于纠删码：抽查片段都成功，就能以极高概率确认数据可恢复，不需要下载全部数据。它不执行交易、不验证证明、也不替代共识。' }
])}
${exercises([["计算题（示例）：假设区块 Gas 上限为 4,500 万，出块 12 秒，只做 21,000 Gas 的转账，L1 的 TPS 约是多少？如果交给 Rollup，每个区块 6 个 blob、每笔压缩后的 L2 交易 100 字节，TPS 约是多少？", "<p>L1：45,000,000 ÷ 21,000 ≈ 2,142 笔每块，÷ 12 秒 ≈ <strong>178 TPS</strong>。</p><p>Rollup：6 × 131,072 = 786,432 字节，÷ 100 ≈ 7,864 笔每块，÷ 12 秒 ≈ <strong>655 TPS</strong>。</p><p>交易压缩得越小，Rollup 的上限越高。这时数据带宽，而不是执行能力，成为上限。</p>"], ["思考题：一条链把状态根和证明结算到以太坊，但交易数据放在一个外部 DA 层。它能说自己“完全继承以太坊安全”吗？为什么？", "<p>不能。模块化堆栈的安全取决于最弱的一层。数据不在以太坊上，它在分类上属于 Validium 类，而不是 Rollup。</p><p>外部 DA 层宕机或扣留数据时，用户无法计算自己的余额证明，可能无法提款。所以它的安全上限等于外部 DA 层的安全。</p>"], ["计算题（示例）：数据用纠删码扩展成 2 倍后，一个轻节点随机抽查 20 个片段且全部成功。攻击者扣留了足以让数据不可恢复的片段，这种情况下 20 次全成功的概率最多是多少？", "<p>要让数据不可恢复，攻击者必须扣留超过 50% 的片段。所以每次抽中可得片段的概率不超过 1/2。</p><p>20 次全部成功的概率不超过 (1/2)^20 = 1/1,048,576，约<strong>百万分之一</strong>。抽查次数越多，这个概率下降得越快。</p>"]])}
${checklist(["能区分状态通道、侧链、Plasma、Rollup、Validium、Optimium 的数据位置和正确性保证。", "能解释数据被扣留时，乐观方案和 Validium 分别会出什么问题。", "能用执行、结算、共识、DA 四层模型拆解一条 L2 或 L3 的安全假设。", "能用 Gas 上限和 blob 参数估算 L1 与 Rollup 的理论 TPS。", "做过用 eth_getBlockByNumber 读取 blobGasUsed，并算出区块里的 blob 数量。"])}
${terms([
  ['可扩展性', 'Scalability', '系统在不明显降低去中心化与安全的前提下处理更多交易的能力'],
  ['分片', 'Sharding', '把数据或执行拆到多个分区并行处理的链上扩容方法'],
  ['状态通道', 'State Channel', '参与方在链下交换签名状态、只把最终结果提交到 L1 的方案'],
  ['侧链', 'Sidechain', '有独立共识、通过桥与主链互通的区块链'],
  ['Plasma', 'Plasma', '只向 L1 发布状态承诺、依靠退出机制保护用户的早期 L2 方案'],
  ['Validium', 'Validium', '使用有效性证明、但数据放在链下的扩容方案'],
  ['数据可用性采样', 'Data Availability Sampling, DAS', '随机抽查纠删码片段以确认数据完整发布的方法'],
  ['模块化区块链', 'Modular Blockchain', '把执行、结算、共识、数据可用性分给不同系统的架构'],
  ['应用链', 'Appchain', '为单个应用定制的专用区块链或 Rollup']
])}
` });

/* ===================== m05-5 Rollup 深入 ===================== */
CUR = 'm05-5';
addCh({ id: 'm05-5', nav: 'Rollup 深入', title: 'M04.5 Rollup 深入：从提交交易到 L1 最终确定', desc: '走完 L2 交易全流程，理解欺诈证明、有效性证明、排序器和提款', html: `
<h1>M04.5 Rollup 深入：从提交交易到 L1 最终确定</h1>
${meta(['按顺序说出一笔 L2 交易从提交到 L1 最终确定的 7 个阶段。', '用交互式二分解释乐观 Rollup 的欺诈证明，用“电路 + 证明者 + 验证合约”解释 ZK Rollup。', '评估一个 L2 的排序器风险、强制包含、提款流程、blob 费用和 L2BEAT 安全阶段。'], '<a href="#m05-4">M04.4 扩容路线</a>', ['rollup'])}
${beginner(`<p><strong>排序器（Sequencer）</strong>：L2 上负责接收交易、决定顺序、打包出块的节点。</p>
<p><strong>批次（Batch）</strong>：排序器把很多笔 L2 交易压缩成一包，一次性发布到 L1。</p>
<p><strong>状态根（State Root）</strong>：用一个 32 字节哈希代表 L2 全部状态。状态有任何变化，状态根就会变。</p>
<p><strong>欺诈证明（Fraud Proof）</strong>：有人认为状态根错了，就在 L1 上发起挑战，证明它错。</p>
<p><strong>有效性证明（Validity Proof）</strong>：用零知识证明（ZK Proof）的数学方法，直接证明状态根是对的。</p>
<p><strong>挑战期（Challenge Period）</strong>：乐观 Rollup 留给挑战者的时间窗口，常见为 7 天。</p>`)}

<h2>1. 一句话理解</h2>
${one('Rollup 在 L2 执行交易，把交易数据和新状态根交给 L1；乐观 Rollup 先假定结果正确、留出时间让人挑战，ZK Rollup 每次都附上数学证明。')}
${call('analogy', `<p>想象一家公司的会计（排序器）每天记账，并把账本复印件（交易数据）和当日余额汇总（状态根）交给审计署（L1）。</p>
<p><strong>乐观模式</strong>：审计署先相信汇总，7 天内任何员工发现错账都能举报，审计署逐行核对争议部分。<strong>ZK 模式</strong>：会计每天附上一份“数学公证书”，审计署花几秒验证公证书，就知道汇总一定正确。</p>
<p>类比的局限：真实的欺诈证明不是“逐行核对整本账”，而是通过二分法把争议缩小到一条机器指令，只在 L1 上执行这一步。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m05-5"><div class="mmd-title"><span>一图看懂：Rollup 怎样把交易交回以太坊</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 260" role="img" aria-label="L2 排序器打包交易，把数据和状态根提交到 L1"><rect x="10" y="20" width="470" height="120" rx="12" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="30" y="44" font-size="14" text-anchor="start" fill="var(--ink)" font-weight="700">L2：执行层（便宜、快）</text><rect x="30" y="62" width="48" height="28" rx="6" fill="var(--paper)" stroke="var(--info)" stroke-width="1.5"/><text x="54" y="81" font-size="12" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">tx</text><rect x="90" y="62" width="48" height="28" rx="6" fill="var(--paper)" stroke="var(--info)" stroke-width="1.5"/><text x="114" y="81" font-size="12" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">tx</text><rect x="150" y="62" width="48" height="28" rx="6" fill="var(--paper)" stroke="var(--info)" stroke-width="1.5"/><text x="174" y="81" font-size="12" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">tx</text><rect x="210" y="62" width="48" height="28" rx="6" fill="var(--paper)" stroke="var(--info)" stroke-width="1.5"/><text x="234" y="81" font-size="12" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">tx</text><line x1="264" y1="76" x2="300" y2="76" stroke="var(--ink-2)" stroke-width="2"/><path d="M300.0 76.0 L292.8 79.5 L292.8 72.5 z" fill="var(--ink-2)"/><rect x="304" y="56" width="156" height="44" rx="8" fill="var(--paper)" stroke="var(--info)" stroke-width="1.5"/><text x="382" y="76" font-size="12.5" text-anchor="middle" fill="var(--ink)" font-weight="700">排序器 Sequencer</text><text x="382" y="92" font-size="11" text-anchor="middle" fill="var(--ink-2)">排序、执行、打包</text><text x="245" y="124" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">用户几秒内看到结果（软确认）</text><line x1="382" y1="102" x2="382" y2="176" stroke="var(--ink-2)" stroke-width="2"/><path d="M382.0 176.0 L378.5 168.8 L385.5 168.8 z" fill="var(--ink-2)"/><text x="392" y="150" font-size="12" text-anchor="start" fill="var(--ink)">压缩后的交易数据 + 新状态根</text><rect x="10" y="180" width="740" height="70" rx="12" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><text x="30" y="204" font-size="14" text-anchor="start" fill="var(--ink)" font-weight="700">L1 以太坊：结算层（安全的最终来源）</text><rect x="300" y="212" width="170" height="28" rx="6" fill="var(--paper)" stroke="var(--accent)" stroke-width="1.5"/><text x="385" y="231" font-size="12" text-anchor="middle" fill="var(--ink)">blob / calldata 数据</text><rect x="500" y="20" width="250" height="56" rx="10" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="1.5"/><text x="625" y="44" font-size="12.5" text-anchor="middle" fill="var(--ink)" font-weight="700">Optimistic：先默认正确</text><text x="625" y="63" font-size="11" text-anchor="middle" fill="var(--ink)">挑战期内可提交欺诈证明（常见 7 天）</text><rect x="500" y="84" width="250" height="56" rx="10" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="625" y="108" font-size="12.5" text-anchor="middle" fill="var(--ink)" font-weight="700">ZK：每批附有效性证明</text><text x="625" y="127" font-size="11" text-anchor="middle" fill="var(--ink)">L1 合约验证证明后即确认</text><line x1="625" y1="142" x2="560" y2="208" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M560.0 208.0 L562.6 200.4 L567.5 205.3 z" fill="var(--ink-2)"/></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>L2 执行交易并打包，把压缩数据和新状态根发布到 L1；任何人都能用这些数据重算 L2 状态。</span></li><li><span class="chip key">关键</span><span>两条路线的区别在“怎么证明状态根是对的”：Optimistic 靠挑战期内的欺诈证明，ZK 靠每批的有效性证明。</span></li><li><span class="chip limit">局限</span><span>排序器通常只有一个，它能决定交易顺序，也可能宕机；这是当前 Rollup 的中心化风险。</span></li></ul></figcaption></figure>

<h2>2. 一笔 L2 交易的完整旅程</h2>
${mm('L2 交易全流程（以乐观 Rollup 为例）', `
sequenceDiagram
  participant U as 用户钱包
  participant S as 排序器
  participant N as L2 节点
  participant B as 批次提交器
  participant L as L1 合约
  participant V as 验证者
  U->>S: 1 发送已签名交易
  S->>S: 2 排序并执行
  S-->>U: 软确认，约 1 到 2 秒
  S->>N: 广播 L2 区块
  S->>B: 3 累积交易形成批次
  B->>L: 4 用 blob 发布压缩数据
  B->>L: 5 提交状态根
  V->>L: 6 下载数据重放执行
  alt 状态根错误
    V->>L: 发起欺诈证明
  else 7 天内无挑战
    L->>L: 7 状态根最终确定
  end
`, [
  ['flow', '用户先从排序器拿到软确认；数据进入 L1 后，交易顺序不再可改；挑战期结束后，状态根最终确定，提款可以执行。'],
  ['key', 'L2 交易有三种“确认”：排序器软确认 → 数据在 L1 上被最终确定（约 13 分钟）→ 状态根最终确定（乐观约 7 天，ZK 在证明验证后）。'],
  ['fail', '排序器在发布批次前宕机或作恶，软确认可能失效。交易所充值应以“数据已在 L1 最终确定”为准。'],
  ['risk', '如果没有任何验证者在线检查，错误的状态根可以通过挑战期。乐观 Rollup 的安全假设是“至少一个诚实验证者”。']
])}
${steps([
  '<strong>提交</strong>：用户用钱包签名交易，发送到 L2 RPC，RPC 转给排序器。',
  '<strong>排序与执行</strong>：排序器决定顺序（多数按先到先服务或优先费），执行交易，产出 L2 区块，并立即返回回执（软确认）。',
  '<strong>打包批次</strong>：批次提交器（Batcher）把一段时间内的 L2 区块压缩（例如用 zlib 或 brotli）。',
  '<strong>发布到 L1</strong>：用 EIP-4844 blob 交易把压缩数据写到 L1。这一步决定了交易的最终顺序。',
  '<strong>提交状态根</strong>：提议者（Proposer）把新状态根（OP Stack 称为 output root）提交到 L1 合约。',
  '<strong>证明或挑战</strong>：乐观 Rollup 进入挑战期；ZK Rollup 由证明者生成有效性证明，L1 验证合约检查它。',
  '<strong>最终确定</strong>：挑战期结束或证明通过，状态根被 L1 接受，L2 到 L1 的提款可以执行。'
])}

<h2>3. 两种证明方式</h2>
<h3>3.1 乐观 Rollup：交互式二分欺诈证明</h3>
<p>直接在 L1 上重放一整个批次太贵。解决办法是<strong>交互式二分（Interactive Bisection）</strong>：提议者和挑战者对“执行轨迹”反复二分，找到第一条双方意见不同的指令，L1 只执行这一条指令来裁决。</p>
${mm('交互式二分：把百万步争议缩小到一步', `
flowchart TB
  A["争议：执行 1,048,576 步后<br/>状态根不同"] --> B["双方提交第 524,288 步的状态"]
  B -->|"在此一致"| C["争议在后半段"]
  B -->|"在此不同"| D["争议在前半段"]
  C --> E["继续二分<br/>每轮范围减半"]
  D --> E
  E --> F["约 20 轮后<br/>只剩 1 步有分歧"]
  F --> G["L1 链上执行这一条指令<br/>OP 用 MIPS，Arbitrum 用 WASM"]
  G --> H{"谁的结果对？"}
  H -->|"提议者错"| I["状态根作废<br/>提议者押金被罚没"]
  H -->|"挑战者错"| J["挑战者押金被罚没"]
`, [
  ['flow', '每一轮双方各提交一个中间状态的哈希，范围减半；2 的 20 次方约 100 万，所以约 20 轮就能定位到单步。'],
  ['key', 'L1 只执行一条指令，成本固定且很低。这让欺诈证明在经济上可行。'],
  ['limit', '二分需要多轮 L1 交易和响应时间，这是挑战期长达 7 天的原因之一：要给诚实方足够时间应对，并抵抗审查。'],
  ['risk', '如果欺诈证明是“许可制”（只有白名单地址能挑战），安全就退化为信任白名单。']
])}
<p><strong>算一算（示例）</strong>：一个批次的执行轨迹有 2,000,000,000 步（20 亿）。二分轮数 = ⌈log₂(2,000,000,000)⌉ = ⌈30.9⌉ = <strong>31 轮</strong>。每轮假设双方各用 1 小时响应，最多约 62 小时，远小于 7 天挑战期。</p>
<p>现状：OP Mainnet 在 2024 年 6 月上线了无需许可的故障证明（Fault Proofs）${cite('Optimism 官方博客：无需许可故障证明上线', 'https://www.optimism.io/blog/permissionless-fault-proofs-and-stage-1-arrive-to-the-op-stack')}；Arbitrum One 在 2025 年 2 月启用了 BoLD 争议协议，允许任何人参与挑战${cite('The Block：Arbitrum BoLD 上线主网', 'https://www.theblock.co/post/340278/offchain-labs-releases-arbitrum-bold-on-mainnet-for-permissionless-validation')}。具体参数以官方文档为准。</p>

<h3>3.2 ZK Rollup：有效性证明</h3>
<p>ZK Rollup 的思路是“先证明再上链”。用三个部件直观理解：</p>
${tbl(['部件', '它做什么', '类比'], [
  ['电路 Circuit', '把“执行交易的规则”（EVM 或自定义虚拟机）写成数学约束', '一张考试的标准答案模板'],
  ['证明者 Prover', '对一个批次运行电路，生成一个很小的证明（几百字节到几百 KB）', '考生交卷时附上的“自证正确”的证书'],
  ['验证合约 Verifier', '部署在 L1，用几十万 Gas 验证证明', '阅卷老师只看证书，几秒就判对错']
])}
<p>关键性质：<strong>验证成本几乎不随交易数量增长</strong>。1 笔和 10,000 笔交易，验证证明的 Gas 差不多。代价是生成证明需要大量计算（GPU 集群，分钟到小时级）。代表项目：zkSync Era、Starknet、Scroll、Linea；Polygon zkEVM 曾是其中之一，但已于 2025-06 宣布在 2026 年停运 Mainnet Beta（排序器计划 2026-07-01 停止）${cite('Polygon 论坛：Sunsetting Polygon zkEVM Mainnet Beta in 2026', 'https://forum.polygon.technology/t/sunsetting-polygon-zkevm-mainnet-beta-in-2026/21020')}，详见 <a href="#m10-4">M04.13 zkEVM 与 ZK Rollup</a>。</p>
${tbl(['维度', '乐观 Rollup', 'ZK Rollup'], [
  ['默认假设', '结果正确，除非被挑战', '没有证明就不接受'],
  ['安全前提', '至少一个诚实且在线的挑战者', '密码学假设 + 电路实现无漏洞'],
  ['L2 → L1 提款', '约 7 天', '证明验证后（分钟到数小时）'],
  ['链下成本', '低', '证明生成昂贵'],
  ['EVM 兼容', '高，几乎可直接部署', '取决于 zkEVM 类型，有差异需测试'],
  ['代表', 'Arbitrum One、OP Mainnet、Base', 'zkSync Era、Starknet、Scroll、Linea']
])}

<h2>4. 排序器、强制包含与提款</h2>
<p>目前多数 L2 只有一个由项目方运营的排序器。中心化排序器带来三类风险：<strong>宕机</strong>（L2 停止出块）、<strong>审查</strong>（拒绝你的交易）、<strong>MEV 抽取</strong>（重排交易获利，见 <a href="#m05-7">M04.7 MEV</a>）。</p>
<p>改进方向：① <strong>去中心化排序器</strong>：多个排序器轮流出块；② <strong>共享排序（Shared Sequencing）</strong>：多条 Rollup 共用一个排序网络，便于跨 Rollup 原子操作；③ <strong>基于 L1 排序（Based Rollup）</strong>：直接让 L1 区块提议者排序 L2 交易，例如 Taiko。</p>
<p><strong>强制包含（Forced Inclusion）</strong>：排序器审查你时，你可以把交易直接提交到 L1 上的 Rollup 合约（Arbitrum 称为 Delayed Inbox，OP Stack 通过 OptimismPortal 存入）。排序器必须在一个时间窗口内把它纳入 L2；超时后任何人都可以强制纳入。窗口长度示例：Arbitrum 约 24 小时，OP Stack 约 12 小时，以官方文档为准。</p>
${mm('L2 → L1 提款状态机（乐观 Rollup，OP Stack 风格）', `
stateDiagram-v2
  state "L2 发起提款" as Init
  state "等待状态根上 L1" as WaitRoot
  state "在 L1 证明提款" as Proven
  state "挑战期 约 7 天" as Challenge
  state "在 L1 完成提款" as Finalized
  state "状态根被推翻" as Invalid
  [*] --> Init
  Init --> WaitRoot: L2 交易被打包
  WaitRoot --> Proven: 提交默克尔证明
  Proven --> Challenge: 开始计时
  Challenge --> Finalized: 无有效挑战
  Challenge --> Invalid: 欺诈证明成功
  Invalid --> WaitRoot: 等待新状态根后重新证明
  Finalized --> [*]
`, [
  ['flow', 'OP Stack 提款需要用户在 L1 上发两笔交易：先“证明”，挑战期结束后再“完成”。'],
  ['fail', '用户只做了第一步就忘记第二步，资金会一直停在桥合约里。前端和后端都要提醒并跟踪状态。'],
  ['limit', '官方桥提款慢。第三方快速桥（流动性网络）可以几分钟到账，但引入新的信任方，见 <a href="#m05-8">M04.26 跨链桥</a>。'],
  ['key', 'L1 → L2 的充值通常只需几分钟；L2 → L1 的提款才需要等挑战期。']
])}

<h2>5. EIP-4844 blob 与 L2 费用</h2>
<p>2024 年 3 月，以太坊 Dencun 升级上线 EIP-4844（Proto-Danksharding），引入 <strong>blob</strong>：一种附在区块上的临时数据。每个 blob 固定 128 KB（4,096 × 32 字节 = 131,072 字节），EVM 不能读取它的内容，只能读取它的承诺哈希。共识节点保存 blob 约 18 天（4,096 个 epoch）后删除。blob 有独立的费用市场（blob base fee），和普通 Gas 分开调节。Dencun 时目标 3 个、上限 6 个；2025 年 5 月的 Pectra 升级（EIP-7691）提高到目标 6 个、上限 9 个。</p>
<p>L2 用户支付的费用由两部分组成：</p>
${code('TYPESCRIPT', `
// L2 交易费 = L2 执行费 + L1 数据费（分摊）
// 示例数值，仅用于理解结构
const l2GasUsed = 21_000n;          // L2 上执行消耗的 gas
const l2GasPrice = 1_000_000n;      // 0.001 gwei（单位 wei）
const l2ExecFee = l2GasUsed * l2GasPrice;

const txBytes = 40n;                // 压缩后这笔交易占用的字节
const blobBytes = 131_072n;
const blobBaseFee = 1_000_000_000n; // 1 gwei，每 blob gas
// 一个 blob 的费用 = 131072 blob gas × blobBaseFee，按字节分摊
const l1DataFee = (blobBytes * blobBaseFee * txBytes) / blobBytes;

console.log('L2 执行费 wei =', l2ExecFee);   // 21,000,000,000,000 wei = 0.000021 ETH
console.log('L1 数据费 wei =', l1DataFee);   // 40,000,000,000 wei = 0.00000004 ETH
`)}
<p><strong>算一算（示例，ETH = 3,000 美元）</strong></p>
${steps([
  '一个 blob 的费用：131,072 blob gas × 1 gwei = 131,072 gwei ≈ 0.000131 ETH ≈ <strong>0.39 美元</strong>。',
  '一个 blob 能装：131,072 ÷ 40 ≈ 3,276 笔压缩交易。',
  '每笔分摊数据费：0.39 ÷ 3,276 ≈ <strong>0.00012 美元</strong>。',
  '如果改用 calldata：40 字节 × 16 Gas = 640 Gas；按 20 gwei 计算 = 12,800 gwei ≈ 0.0000128 ETH ≈ <strong>0.038 美元</strong>，约是 blob 的 300 倍。',
  '如果批次只装了 300 笔交易，blob 仍按整块收费：0.39 ÷ 300 ≈ 0.0013 美元，单笔贵了约 10 倍。'
])}
<p>先在下面的实验里观察：① 把“每批交易数”从 500 调到 10，看单笔成本如何上升；② 切换到 calldata，对比数据成本的量级；③ 把 Blob Gas 价格调高，模拟 blob 拥堵。</p>
${lab('rollup')}
<p>观察结论：blob 按整块计费，所以排序器要在“等更多交易摊薄成本”和“尽快上链降低延迟”之间权衡。这也是 L2 批次间隔从几十秒到几分钟不等的原因。</p>
${call('deep', `<p>blob base fee 用“伪指数函数”调节：每个区块用量高于目标，excess_blob_gas 增加，费用按指数上涨；低于目标则下降。公式为 fake_exponential(MIN_BLOB_BASE_FEE, excess_blob_gas, BLOB_BASE_FEE_UPDATE_FRACTION)。最低价是 1 wei，所以需求低时 blob 几乎免费。</p>`)}

<h2>6. L2 安全阶段与工程接入</h2>
<p>L2BEAT 把 Rollup 的去中心化程度分为三个阶段（Stages）。概念如下（具体判定标准以 L2BEAT 最新规则为准）：</p>
${tbl(['阶段', '含义', '通俗理解'], [
  ['Stage 0', '“完全辅助轮”：数据在 L1、可从数据重建状态，但证明系统可能未上线，运营者可以随意升级', '项目方说了算，你在信任团队'],
  ['Stage 1', '“有限辅助轮”：证明系统已上线；只有达到高门槛的安全委员会可以推翻证明结果；普通升级前给用户留出退出时间', '规则主导，紧急情况由委员会兜底'],
  ['Stage 2', '“无辅助轮”：证明系统无需许可；安全委员会只能处理链上可证明的漏洞；升级前给用户留出更长退出窗口', '代码说了算，用户可自行退出']
])}
${code('BASH', `
# 查询 OP Mainnet 和 Base 的最新区块号，与 L1 对比延迟（公共 RPC 仅供学习）
for url in https://mainnet.optimism.io https://mainnet.base.org; do
  curl -s -X POST $url -H 'Content-Type: application/json' \\
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' | jq -r .result
done
# 提示：L2 节点还提供 optimism_syncStatus（OP Stack）等方法，
# 可以看到 unsafe（软确认）、safe（数据已上 L1）、finalized（L1 已最终确定）三个高度
`)}
${tryit(`<p>目标：追踪一笔 L2 交易如何落到 L1。</p>
<ol><li>在 Base 的区块浏览器（basescan.org）随便打开一笔交易，记录它的区块号和时间。</li>
<li>在 Etherscan 上搜索 Base 的批次提交地址（L2BEAT 的 Base 页面列出了合约和地址），找到一笔 type 3（blob）交易。</li>
<li>点开这笔 L1 交易的 “Blobs” 标签，看到它携带的 blob 数量和 blob gas 价格。</li>
<li>在 L2BEAT 的 Base 页面查看它当前的 Stage 评级和风险说明。</li></ol>
<p>预期结果：L2 交易在几分钟内被打包进 L1 的 blob 交易；你能看到 blob 数量、blob gas 费用和项目的安全阶段。</p>`)}
${call('warn', `<p>交易所或支付服务接入 L2 充值时，不要用排序器软确认入账。推荐至少等到 L2 的 safe 高度（数据已上 L1），大额等到 finalized。提款到 L1 的业务要把 7 天挑战期写进用户协议和产品流程。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['充值确认标准使用 safe / finalized 高度', '软确认可能因排序器故障失效', '监听 optimism_syncStatus 或 eth_getBlockByNumber("safe")'],
  ['提款两步流程有任务跟踪', '漏掉“完成提款”会让资金卡在桥里', '后端任务表记录 prove / finalize 状态并告警'],
  ['监控 L1 数据费和批次延迟', '数据费上涨或批次停发说明异常', '采集 blob base fee 与最近批次时间'],
  ['准备排序器宕机预案', '宕机期间无法出块', '演练强制包含交易，写入运维手册'],
  ['跟踪 L2 合约升级公告', '升级可能改变提款规则或安全模型', '订阅官方治理论坛 + 监控代理合约 Upgraded 事件']
])}

<h2>7. 动手：自己发一条 L2，起一条测试链</h2>
<p>读懂 Rollup 最快的办法是自己部署一条。你要部署和运行的，正是前面章节讲过的那几个角色：<strong>排序器</strong>（出块）、<strong>批次提交者</strong>（把数据发到 L1）、<strong>状态提议者</strong>（把状态根发到 L1）和 <strong>L1 上的桥与争议合约</strong>。</p>
<h3>7.1 OP Stack：官方教程的组件与路径</h3>
${tbl(['组件', '对应角色', '作用'], [
  ['op-deployer', '部署工具', '在 L1 上部署合约并生成配置'],
  ['op-reth + op-node', '排序器（执行 + 共识）', '执行客户端出块，op-node 驱动并与 L1 同步'],
  ['op-batcher', '批次提交者', '把交易数据发布到 L1'],
  ['op-proposer', '状态提议者', '向 L1 提交状态根提案'],
  ['op-challenger', '挑战者', '监控争议']
])}
<p>官方教程只面向<strong>测试网</strong>，L1 用 Sepolia，需要一个 Sepolia 的 L1 RPC 地址；文中估计约需 2–3 Sepolia ETH，水龙头一次只给 0.05 ETH，所以要提前攒。${cite('Optimism 文档：Create your own L2 rollup testnet', 'https://docs.optimism.io/operators/chain-operators/tutorials/create-l2-rollup')}教程提供“自动路径”，命令如下（以官方当前文档为准）：</p>
${code('BASH', `
git clone https://github.com/ethereum-optimism/optimism.git
cd optimism/docs/public-docs/create-l2-rollup-example
cp .example.env .env     # 填入 L1_RPC_URL、PRIVATE_KEY 等
make init                # 下载 op-deployer
make setup               # 在 Sepolia 部署合约并生成配置
make up                  # 启动全部服务
make test-l1             # 验证 L1 连接
make test-l2             # 验证 L2 功能
`)}
<p>想看清每个角色，可以走“手动路径”：按 deployer、sequencer、batcher、proposer、challenger 五个目录逐个配置启动。命令细节在官方各子页面，本书不抄。</p>
<h3>7.2 Arbitrum：用 nitro-testnode 在本机起 L1 + L2</h3>
<p>Arbitrum 的本地模拟环境 nitro-testnode 会起一个 dev 模式的 Geth 作为 L1（chain ID 1337），再起 Nitro L2，并为不同角色（排序器、批次提交者、验证者）各起一个节点。需要 Docker 和 docker compose。${cite('Arbitrum 文档：Run a local full chain simulation', 'https://docs.arbitrum.io/run-arbitrum-node/run-local-full-chain-simulation')}</p>
${code('BASH', `
git clone -b release --recurse-submodules https://github.com/OffchainLabs/nitro-testnode.git && cd nitro-testnode
./test-node.bash --init     # 首次启动；会清空旧数据并重新部署
# L1: http://localhost:8545   L2（chain ID 412346）: http://localhost:8547
./test-node.bash            # 之后重启
`)}
<p>想在 Orbit 里体验 L3 或代币桥，可加 <code>--l3node</code>、<code>--tokenbridge</code>；<code>./test-node.bash --help</code> 列出全部选项。官方提醒：仓库里的默认密钥和地址是公开的，不要用于生产。正式发布一条 Arbitrum 链的步骤（Orbit SDK、验证者配置）请直接读官方文档的“Launch an Arbitrum chain”部分，这里没有逐条核对，不写命令。</p>
${tryit(`<p>目标：在本机跑一条 Rollup，看到它的 L1 和 L2 各有一个 RPC。</p>
<ol><li>安装 Docker，按上面的 nitro-testnode 命令执行 <code>./test-node.bash --init</code>。</li>
<li>用 <code>curl -s -X POST localhost:8545 ...eth_blockNumber</code> 和同样的请求打向 <code>localhost:8547</code>，对比两条链的区块高度。</li>
<li>执行 <code>docker exec nitro-testnode-sequencer-1 cat /config/l2_chain_info.json</code>，找到 L1 上的核心合约地址（桥、Rollup 合约）。</li></ol>
<p>预期结果：L2 区块不断增长，L1 上能看到 Rollup 合约；你亲眼确认“排序器 + 批次提交者 + L1 合约”三件套。</p>`)}
${call('warn', `<p><strong>成本与信任模型</strong>：测试网不花真钱，只花水龙头 ETH。上主网则要自己承担 L1 数据费（blob 费，见第 5 节）、排序器与批次提交者的服务器和密钥管理，并且你的用户会问：谁能升级合约？排序器宕机怎么办？提款多久？自己发链意味着你成为运营者，这些问题的答案由你决定并对用户负责，对照第 6 节的 L2BEAT 阶段评估自己的链。</p>`)}

${mistakes([
  ['L2 交易返回成功就等于最终确定。', '那只是排序器软确认。数据进入 L1 并最终确定后，交易顺序才不可更改。'],
  ['乐观 Rollup 每笔交易都要等 7 天。', 'L2 内部交易秒级完成；只有通过官方桥从 L2 提款到 L1 才需等挑战期。'],
  ['ZK Rollup 不需要任何信任。', '仍需信任电路实现无漏洞、证明系统的密码学假设，以及升级权限不被滥用。'],
  ['blob 数据永久保存在以太坊上。', 'blob 约 18 天后被共识节点删除；需要历史数据的人要依靠归档服务或 L2 节点自行保存。'],
  ['中心化排序器可以偷走用户资金。', '排序器可以宕机、审查、重排交易，但不能伪造签名；错误状态会被证明系统拒绝（前提是证明系统已上线）。']
])}
${recap([
  'L2 交易有三层确认：软确认 → 数据上 L1（safe）→ 状态根最终确定。',
  '乐观 Rollup 用交互式二分把争议缩到一条指令，在 L1 执行裁决；安全前提是至少一个诚实挑战者。',
  'ZK Rollup 用电路 + 证明者 + 验证合约，验证成本几乎不随交易数增长。',
  '中心化排序器可宕机和审查；强制包含是用户的逃生通道。',
  'EIP-4844 blob 按整块 128 KB 计费、约 18 天后删除，让 L2 数据费下降一到两个数量级。',
  '接入 L2 前查看 L2BEAT Stage 评级、升级权限和提款流程。'
])}
${quiz([
  { q: '一个批次的执行轨迹有 1,000,000 步，交互式二分大约需要几轮才能定位到单步？', o: ['约 1,000 轮', '约 7 轮', '约 20 轮', '约 500,000 轮'], a: 2, why: '每轮范围减半，2 的 20 次方 = 1,048,576 ≥ 1,000,000，所以约 20 轮。二分是对数级，不是线性级。' },
  { q: '交易所为某个 OP Stack 链上的充值入账，最合理的确认标准是？', o: ['等到 safe 或 finalized 高度', '收到排序器回执即可', '等 7 天挑战期结束', '只看用户截图'], a: 0, why: 'safe 表示数据已发布到 L1，finalized 表示对应 L1 区块已最终确定，顺序无法再改。软确认可能失效；7 天挑战期只影响 L2→L1 提款，不影响 L2 内部充值。' },
  { q: '关于 EIP-4844 blob，下列哪项正确？', o: ['EVM 合约可以直接读取 blob 的全部内容', 'blob 永久保存在每个全节点', 'blob 和普通 Gas 共用同一个价格', 'blob 按整块计费，批次太小会浪费'], a: 3, why: 'blob 固定 128 KB，按整块计费。EVM 只能读取它的承诺哈希；blob 约 18 天后删除；blob 有独立的 blob base fee。' },
  { q: '排序器持续拒绝你的提款交易，你应该怎么做？', o: ['等排序器恢复，别无他法', '通过 L1 合约提交交易，使用强制包含机制', '换一个 RPC 服务商', '向 L1 验证者申请回滚'], a: 1, why: '强制包含允许用户直接在 L1 提交交易，排序器超时未纳入时任何人都能强制纳入。换 RPC 无法绕过排序器；L1 验证者不会回滚 L2。' }
])}
${exercises([["计算题（示例）：一个批次的执行轨迹有 500,000,000 步。交互式二分需要几轮才能定位到单步？如果每轮双方各用 1 小时响应，最多要多久？", "<p>2^28 = 268,435,456，小于 5 亿；2^29 = 536,870,912，大于 5 亿。所以需要 <strong>29 轮</strong>。</p><p>每轮双方各 1 小时，共 2 小时，最多约 29 × 2 = <strong>58 小时</strong>，远小于 7 天挑战期。</p>"], ["计算题（示例）：blob base fee 为 5 gwei，ETH = 3,000 美元。一个 blob 的费用是多少？排序器只装了 2,000 笔交易就发布，每笔分摊多少数据费？", "<p>一个 blob：131,072 blob gas × 5 gwei = 655,360 gwei ≈ 0.000655 ETH ≈ <strong>1.97 美元</strong>。</p><p>blob 按整块收费。2,000 笔分摊：1.97 ÷ 2,000 ≈ <strong>0.00098 美元</strong>每笔。装得越满，单笔越便宜；但等更多交易会增加上链延迟。</p>"], ["设计题：为 OP Stack 链的 L2 → L1 提款设计一个后端跟踪任务。要记录哪些状态？什么情况下告警？", "<p>任务表为每笔提款记录状态：L2 发起、等待状态根、已证明（prove）、挑战期中、已完成（finalize）。</p><p>告警规则示例：挑战期已结束但仍未完成提款；状态根被推翻后需要重新证明。原因是用户常常只做了第一步，资金会一直停在桥合约里。</p>"]])}
${checklist(["能按顺序说出 L2 交易从提交到最终确定的 7 个阶段，以及三种确认各对应哪一步。", "能用交互式二分解释欺诈证明，并算出给定步数需要的轮数。", "能算出一笔 L2 交易分摊的 blob 数据费，并解释批次太小为什么更贵。", "能说出排序器审查或宕机时，怎样用强制包含把交易送进 L2。", "能说出 L2BEAT Stage 0、1、2 的区别，并在 L2BEAT 上查到一条链的阶段。"])}
${terms([
  ['批次提交器', 'Batcher', '把压缩后的 L2 交易数据发布到 L1 的组件'],
  ['软确认', 'Soft Confirmation', '排序器给出的即时回执，在数据上 L1 前仍可能改变'],
  ['交互式二分', 'Interactive Bisection', '双方反复对半缩小执行轨迹争议、直到单步的欺诈证明方法'],
  ['证明者', 'Prover', '为批次生成零知识有效性证明的计算节点'],
  ['验证合约', 'Verifier Contract', '部署在 L1、检查有效性证明的智能合约'],
  ['强制包含', 'Forced Inclusion', '用户通过 L1 合约绕过排序器、强制交易进入 L2 的机制'],
  ['共享排序', 'Shared Sequencing', '多条 Rollup 共用同一排序网络的设计'],
  ['L2 安全阶段', 'L2BEAT Stages', 'L2BEAT 按证明系统与升级权限对 Rollup 去中心化程度的 0/1/2 分级']
])}
` });

/* ===================== m05-6 节点运维与 RPC ===================== */
CUR = 'm05-6';
addCh({ id: 'm05-6', nav: '节点运维与 RPC', title: 'M04.6 节点运维与 RPC：部署、监控、安全与排障', desc: '从硬件选型到 Prometheus 告警，学会自己运行和守护以太坊节点', html: `
<h1>M04.6 节点运维与 RPC：部署、监控、安全与排障</h1>
${meta(['根据业务需求选择节点类型（全节点、归档节点、轻节点）和同步模式，并估算硬件。', '用 Docker Compose 或 systemd 部署“执行客户端 + 共识客户端”，并接入 Prometheus / Grafana 监控。', '在自建节点和 RPC 服务商之间做取舍，配置 RPC 安全，并按步骤排查常见故障。'], '<a href="#m05-2">M04.2 以太坊架构</a>、<a href="#m01">M01 区块链基础</a>')}
${beginner(`<p><strong>节点（Node）</strong>：运行区块链客户端软件的电脑。它下载区块、验证交易、保存状态。</p>
<p><strong>JSON-RPC</strong>：节点对外提供的接口协议。应用发送 JSON 格式的请求，例如 eth_getBalance，节点返回结果。</p>
<p><strong>同步（Sync）</strong>：新节点从网络下载并验证历史数据，追上最新区块的过程。</p>
<p><strong>对等节点（Peer）</strong>：和你的节点直接相连、交换区块和交易的其他节点。</p>
<p><strong>Prometheus / Grafana</strong>：Prometheus 定时抓取并存储监控指标；Grafana 把指标画成图表和面板。</p>`)}

<h2>1. 一句话理解</h2>
${one('节点是你的应用读写区块链的唯一入口；运维节点的目标是：数据正确、跟得上最新块、接口安全、出故障时能快速切换。')}
${call('analogy', `<p>节点像一座本地图书馆，收藏了全部账本副本。全节点保存“最新版目录 + 近期借阅记录”；归档节点保存“每一天的完整目录快照”，可以查询任意历史日期；RPC 服务商像图书馆连锁店，你付费借用别人的馆藏。</p>
<p>类比的局限：图书馆的书不会自己变化，而节点每 12 秒就要接收和验证一个新区块，掉线几分钟就会落后。</p>`)}
${art('一图看懂：应用通过 RPC 入口读写链，入口背后是自建节点或服务商', 660, 334, [
  S.box(10, 66, 130, 76, { k: 'info', icon: 'phone', t: '应用 / 后端', s: '读写链' }),
  S.box(210, 12, 210, 62, { k: 'idle', dash: 1, icon: 'cloud', t: 'RPC 服务商', s: '按量付费 · 省运维' }),
  S.box(210, 134, 210, 62, { k: 'key', icon: 'server', t: '自建节点', s: '你运维 · 数据自己掌控' }),
  S.box(490, 66, 160, 76, { k: 'tint', icon: 'globe', t: '以太坊网络', s: 'P2P 同步每个区块' }),
  S.arrow(142, 92, 208, 52, { label: 'RPC' }),
  S.arrow(142, 116, 208, 160, { label: 'RPC' }),
  S.arrow(422, 52, 488, 92),
  S.arrow(422, 160, 488, 116),
  S.text(315, 232, '自建时，先选一种节点类型', { size: 12.5, b: 1, anchor: 'middle' }),
  S.box(10, 248, 200, 56, { k: 'idle', t: '轻节点', s: '只存区块头 · 几 GB' }),
  S.box(230, 248, 200, 56, { k: 'key', t: '全节点（裁剪）', s: '近期状态 · 约 1.5–2.5 TB' }),
  S.box(450, 248, 200, 56, { k: 'info', t: '归档节点', s: '全部历史状态 · 约 2–4 TB', ss: 11.5 }),
  S.line(315, 198, 315, 222, { dash: 1 }),
  S.text(330, 326, '示例：一台全节点服务器约 4 TB NVMe + 32 GB 内存，磁盘量级为 2026 年公开资料', { size: 12, dim: 1, anchor: 'middle', mw: 640 })
], [
  ['flow', '应用只认 RPC 地址；背后是自己的节点还是服务商，对代码几乎透明，可以随时切换。'],
  ['key', '自建换来数据控制权和隐私，代价是同步、监控、升级都要自己做。'],
  ['fail', '磁盘跟不上或落后最新块，节点会同步不上；备用一个服务商做故障切换。'],
  ['limit', '轻节点依赖别人给数据和证明；查任意历史状态必须用归档节点。']
], '应用经 RPC 访问自建节点或 RPC 服务商，二者都与以太坊网络同步；自建节点分为轻节点、全节点和归档节点三类', 'm05-6')}

<h2>2. 节点类型、同步模式与硬件</h2>
<p>The Merge 之后，一个完整的以太坊节点由两个程序组成：<strong>执行客户端</strong>（Geth、Nethermind、Besu、Erigon、Reth）和<strong>共识客户端</strong>（Lighthouse、Prysm、Teku、Nimbus、Lodestar），两者通过 Engine API（默认端口 8551，用 JWT 密钥认证）通信。详见 <a href="#m05-2">M04.2</a>。</p>
${tbl(['节点类型', '保存什么', '能回答什么', '磁盘（示例，截至 2026 年公开资料量级）', '典型用途'], [
  ['全节点（裁剪）', '最近状态 + 全部区块', '最新状态、近期历史状态（约最近 128 个块）', '约 1.5–2.5 TB NVMe', 'DApp 读写、充值监听、发交易'],
  ['归档节点', '每个区块的历史状态', '任意历史区块的余额、合约存储、eth_call', 'Erigon / Reth 约 2–4 TB；Geth 传统哈希模式可超过 20 TB，v1.16 起的路径模式归档约 2 TB 起（截至 2026 年公开资料）' + cite('Geth 文档：归档节点', 'https://geth.ethereum.org/docs/fundamentals/archive'), '数据分析、索引器、审计、对账'],
  ['轻节点', '只保存区块头', '依赖其他节点提供数据和证明', '几 GB', '钱包、嵌入式设备'],
  ['验证者节点', '全节点 + 验证者客户端', '同全节点', '同全节点', '参与 PoS 质押，见 <a href="#m05-3">M04.3</a>']
])}
<p><strong>同步模式</strong>：</p>
${steps([
  '<strong>快照同步（Snap Sync）</strong>：Geth 默认模式。先下载最近的状态快照，再验证区块头链，几小时到一天完成。适合绝大多数业务。',
  '<strong>全量同步（Full Sync）</strong>：从创世块开始重放每一笔交易。最慢（数天到数周），但验证最彻底。',
  '<strong>归档同步（Archive）</strong>：全量同步并保留每个区块的历史状态，例如 Geth 的 --gcmode archive，或直接使用 Erigon / Reth 的归档模式。',
  '<strong>检查点同步（Checkpoint Sync）</strong>：共识客户端从一个可信的最终确定检查点开始同步，几分钟完成，而不是从信标链创世开始。'
])}
<p><strong>算一算（示例）：一台全节点服务器配置</strong></p>
${steps([
  'CPU：4–8 核；内存：32 GB（16 GB 可运行，但同步和高并发 RPC 吃紧）。',
  '磁盘：执行客户端约 1.5 TB，共识客户端约 200 GB，合计 1.7 TB。',
  '磁盘增长：假设每周增长 15 GB（示例），一年 15 × 52 = 780 GB。',
  '预留 30% 空闲空间（压缩与裁剪需要临时空间）：(1.7 + 0.78) ÷ 0.7 ≈ 3.5 TB。所以选 <strong>4 TB NVMe SSD</strong>。',
  '带宽：25 Mbps 以上，每月流量约 1–2 TB（示例）。机械硬盘和低端 SATA SSD 的随机读写跟不上，会导致同步永远落后。'
])}

<h2>3. 部署：Docker、systemd 与 Kubernetes</h2>
${mm('单机节点部署拓扑', `
flowchart LR
  APP["应用 / RPC 网关"] -->|"HTTP 8545 / WS 8546<br/>仅内网"| EL["执行客户端<br/>Geth"]
  EL <-->|"Engine API 8551<br/>JWT 认证"| CL["共识客户端<br/>Lighthouse"]
  EL <-->|"P2P 30303 TCP/UDP"| NET1["以太坊 P2P 网络"]
  CL <-->|"P2P 9000 TCP/UDP"| NET2["信标链 P2P 网络"]
  EL -->|"指标 6060"| PR["Prometheus"]
  CL -->|"指标 5054"| PR
  NE["node_exporter<br/>CPU 磁盘 网络"] --> PR
  PR --> GF["Grafana 面板"]
  PR --> AM["Alertmanager<br/>告警到 IM / 电话"]
`, [
  ['flow', '应用只访问 8545/8546；两个客户端之间用 8551 通信；P2P 端口对公网开放以获得对等节点。'],
  ['risk', '8545 和 8551 绝不能暴露到公网。8551 泄露加 JWT 泄露，攻击者可以向执行客户端喂假区块。'],
  ['fail', '执行客户端和共识客户端任一停止，节点就停止跟进最新块。两者都要监控。'],
  ['key', 'P2P 端口要放行，否则对等节点数过低，同步缓慢且容易被孤立。']
])}
${code('YAML', `
# docker-compose.yml —— 以太坊主网全节点（示例，版本号请换成你验证过的发布版）
services:
  geth:
    image: ethereum/client-go:stable
    restart: unless-stopped
    command:
      - --mainnet
      - --syncmode=snap
      - --http
      - --http.addr=0.0.0.0          # 容器内监听；对外端口只绑定到 127.0.0.1
      - --http.api=eth,net,web3      # 不开放 admin、debug、txpool
      - --http.vhosts=*
      - --ws
      - --ws.addr=0.0.0.0
      - --ws.api=eth,net,web3
      - --authrpc.addr=0.0.0.0
      - --authrpc.vhosts=*
      - --authrpc.jwtsecret=/secrets/jwt.hex
      - --metrics
      - --metrics.addr=0.0.0.0
      - --metrics.port=6060
    ports:
      - "127.0.0.1:8545:8545"
      - "127.0.0.1:8546:8546"
      - "30303:30303/tcp"
      - "30303:30303/udp"
    volumes:
      - /data/geth:/root/.ethereum
      - /data/secrets:/secrets:ro

  lighthouse:
    image: sigp/lighthouse:latest
    restart: unless-stopped
    command:
      - lighthouse
      - bn
      - --network=mainnet
      - --execution-endpoint=http://geth:8551
      - --execution-jwt=/secrets/jwt.hex
      - --checkpoint-sync-url=https://mainnet.checkpoint.sigp.io
      - --http
      - --http-address=0.0.0.0
      - --metrics
      - --metrics-address=0.0.0.0
    ports:
      - "9000:9000/tcp"
      - "9000:9000/udp"
    volumes:
      - /data/lighthouse:/root/.lighthouse
      - /data/secrets:/secrets:ro
`)}
${code('BASH', `
# 1. 生成执行层与共识层共享的 JWT 密钥（32 字节十六进制）
sudo mkdir -p /data/secrets && openssl rand -hex 32 | sudo tee /data/secrets/jwt.hex
sudo chmod 600 /data/secrets/jwt.hex

# 2. 启动并查看日志
docker compose up -d
docker compose logs -f --tail=50 geth

# 3. 检查同步状态：返回 false 表示已同步完成
curl -s -X POST localhost:8545 -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_syncing","params":[]}'

# 4. 检查对等节点数（十六进制）
curl -s -X POST localhost:8545 -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"net_peerCount","params":[]}'

# 5. 共识客户端健康：Beacon API 同步状态
curl -s localhost:5052/eth/v1/node/syncing | jq
`)}
<p><strong>systemd</strong>：不用容器时，为两个客户端各写一个 unit 文件，设置 Restart=always、专用低权限用户、LimitNOFILE 调高（例如 65535），停止时给足优雅退出时间（TimeoutStopSec=300），避免数据库损坏。</p>
<p><strong>Kubernetes</strong>：用 StatefulSet + 本地 NVMe 的 PersistentVolume，一个 Pod 内放执行客户端和共识客户端两个容器，共享 JWT Secret。注意：节点数据有状态、同步耗时长，不能像无状态服务一样随意漂移；滚动升级要逐个进行，并配置 readiness 探针（同步完成才接流量）。</p>

<h2>4. 监控与告警</h2>
${tbl(['指标', '含义', '告警阈值（示例）'], [
  ['区块高度落后', '本节点最新块与参考源（另一节点或服务商）的差', '> 3 个块持续 2 分钟：警告；> 10 个块：严重'],
  ['最新块时间戳延迟', 'now − latest block timestamp', '> 60 秒告警（正常约 0–24 秒）'],
  ['对等节点数', '执行层 p2p_peers、共识层 libp2p_peers', '执行层 < 10 或共识层 < 20 持续 10 分钟'],
  ['共识层同步距离', 'Beacon API sync_distance', '> 2 个 slot 持续 5 分钟'],
  ['磁盘使用率', 'node_exporter 文件系统指标', '> 80% 警告；> 90% 严重'],
  ['RPC 延迟 P99', '网关或节点侧请求耗时', 'eth_call P99 > 500 ms 持续 5 分钟'],
  ['RPC 错误率', '5xx 与 JSON-RPC error 比例', '> 1% 持续 5 分钟'],
  ['进程重启次数', '容器或 systemd 重启', '1 小时内 > 3 次']
])}
${code('YAML', `
# prometheus-rules.yml —— 告警规则示例（指标名以你使用的客户端与 exporter 实际暴露为准）
groups:
- name: eth-node
  rules:
  - alert: NodeBehindHead
    expr: max(eth_reference_head_block) - on() eth_node_head_block{job="geth"} > 10
    for: 2m
    labels: { severity: critical }
    annotations:
      summary: "节点落后参考源超过 10 个块"
  - alert: LowPeerCount
    expr: p2p_peers{job="geth"} < 10
    for: 10m
    labels: { severity: warning }
  - alert: DiskAlmostFull
    expr: (1 - node_filesystem_avail_bytes{mountpoint="/data"} / node_filesystem_size_bytes{mountpoint="/data"}) > 0.85
    for: 15m
    labels: { severity: warning }
`)}
${call('info', `<p>Geth 开启 --metrics 后，Prometheus 抓取路径是 /debug/metrics/prometheus；Lighthouse 的指标默认在 5054 端口 /metrics。区块高度落后需要“参考源”：可以写一个小 exporter，定时调用 2 家服务商的 eth_blockNumber 并取最大值。M04.8 实战会实现这一部分，见 <a href="#m05-10">M04.8</a>。</p>`)}

<h2>5. 自建节点还是 RPC 服务商</h2>
${mm('读写请求的路由与故障切换', `
flowchart TB
  C["应用请求"] --> GW["RPC 网关"]
  GW --> T{"请求类型"}
  T -->|"历史状态查询"| ARC["归档节点 / 服务商归档接口"]
  T -->|"最新状态读"| POOL["健康节点池"]
  T -->|"发送交易"| SEND["多路广播<br/>自建 + 服务商 + 私有交易池"]
  POOL --> H1["自建全节点"]
  POOL --> H2["服务商 A"]
  POOL --> H3["服务商 B"]
  H1 -.->|"落后或报错"| CB["熔断，摘除出池"]
  CB -.->|"恢复后"| POOL
`, [
  ['flow', '网关按请求类型路由：历史查询去归档节点，最新读去健康节点池，发交易多路广播。'],
  ['fail', '不同节点高度不同，同一用户连续请求落到不同节点，可能看到“余额回退”。需要粘滞会话或按块号查询。'],
  ['risk', '只用一家服务商时，它宕机或限流就会导致你的服务全部不可用。'],
  ['key', '生产环境的常见做法是“自建节点 + 至少两家服务商”，由网关做健康检查和自动切换。']
])}
${tbl(['维度', '自建节点', 'RPC 服务商（如 Alchemy、Infura、QuickNode）'], [
  ['启动时间', '数小时到数天同步', '几分钟拿到 API Key'],
  ['成本结构', '固定：服务器 + 运维人力', '按请求量或计算单元计费，量大时昂贵'],
  ['隐私', '查询不外泄', '服务商可看到你的 IP 和全部查询'],
  ['可控性', '可开启 debug / trace，自定义参数', '受套餐和方法白名单限制'],
  ['可用性', '单点故障需自行冗余', '多区域冗余，但会有区域性故障'],
  ['增值功能', '需自建', '增强 API（代币余额、NFT、Webhook）、多链支持']
])}
<p><strong>算一算（示例）：何时值得自建</strong>。假设业务每天 2,000 万次请求，平均每次 20 个计算单元：每月 2,000 万 × 20 × 30 = 120 亿计算单元。若服务商单价为每百万计算单元 0.5 美元（示例价格），月费约 6,000 美元。一台 4 TB NVMe 的独立服务器每月约 300–500 美元（示例），加上运维人力。请求量越大、越依赖 debug/trace 方法，自建越划算；请求量小、团队没有运维能力时，用服务商更省心。</p>

<h3>RPC 安全</h3>
${steps([
  '<strong>不暴露管理 API</strong>：http.api 只开 eth、net、web3；admin、debug、txpool、miner 只在内网或本机开放，或干脆关闭。',
  '<strong>端口隔离</strong>：8545/8546 只绑定 127.0.0.1 或内网；8551 只给共识客户端；安全组只放行 P2P 端口。',
  '<strong>鉴权</strong>：在节点前放网关（Nginx、Envoy 或自研），校验 API Key 或 JWT，按 Key 记录用量。',
  '<strong>限流</strong>：按 Key 和 IP 限制 QPS；对 eth_getLogs 限制区块范围（例如每次 ≤ 2,000 块）；对 debug_traceTransaction 等重方法单独限流。',
  '<strong>请求体限制</strong>：限制批量请求条数（例如一个 batch ≤ 50 条）和请求体大小，防止单个请求拖垮节点。',
  '<strong>不在节点里放私钥</strong>：签名放在独立的签名服务或 HSM / MPC 中（见 <a href="#m03">M07 钱包</a>），节点只负责广播。'
])}
${call('warn', `<p>历史上有大量暴露在公网、并解锁了账户的 Geth 节点被机器人扫描并盗走资金：2018 年 360 Netlab 报告，攻击者扫描 8545 端口，从这类节点盗走了价值超过 2,000 万美元的 ETH。${cite('BleepingComputer：配置不当的以太坊客户端被盗超 2,000 万美元', 'https://www.bleepingcomputer.com/news/security/hackers-stole-over-20-million-from-misconfigured-ethereum-clients/')}今天 Geth 已移除 personal 命名空间，但原则不变：<strong>节点不保存可用私钥，RPC 端口不对公网开放</strong>。</p>`)}

<h2>6. 常见故障排查</h2>
${tbl(['现象', '可能原因', '排查与处理'], [
  ['eth_syncing 长期不为 false，高度增长很慢', '磁盘 IOPS 不足；对等节点少；内存不足', 'iostat 看磁盘利用率；换 NVMe；检查 30303 端口是否放行；增大内存'],
  ['执行客户端日志：Post-merge network, but no beacon client seen', '共识客户端未启动或 JWT 不匹配', '检查 8551 连通性、两边 JWT 文件内容一致、时钟同步'],
  ['节点高度停在某个块不动', '数据库损坏、客户端 bug、未及时升级导致分叉', '查看日志错误；对照客户端发布说明；必要时从快照重新同步'],
  ['eth_getLogs 超时或返回错误', '查询区块范围过大', '分段查询；用索引器代替大范围扫描'],
  ['共识层大量 missed attestation（验证者节点）', '时钟偏移、CPU 过载、网络抖动', '启用 chrony 或 NTP；检查负载；见 <a href="#m05-3">M04.3</a>'],
  ['磁盘写满后进程崩溃', '未监控磁盘增长', '扩容或裁剪；Geth 可离线执行 snapshot prune-state（哈希模式），新版本用 path 模式自动裁剪']
])}
${tryit(`<p>目标：用 curl 体检一个节点。</p>
<ol><li>使用一个公共 RPC（例如 https://ethereum-rpc.publicnode.com）或你自建的节点。</li>
<li>依次调用 eth_blockNumber、eth_syncing、net_peerCount（公共 RPC 可能禁用 net_peerCount）。</li>
<li>调用 eth_getBlockByNumber("latest", false)，把返回的 timestamp（十六进制）转成十进制，与当前时间比较。</li>
<li>再调用一次 admin_peers，观察是否返回 “method not found” 或类似错误。</li></ol>
<p>预期结果：最新块时间戳与当前时间相差 0–24 秒；eth_syncing 返回 false；admin_peers 被拒绝，说明管理 API 没有对外开放。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['8545 / 8546 / 8551 不对公网开放', '防止滥用、管理 API 被调用、假区块注入', '从外网 nmap 扫描，端口应为 filtered'],
  ['执行层与共识层客户端版本在硬分叉前升级', '未升级会停在旧链上', '对照官方硬分叉公告，在测试网先升级'],
  ['高度落后、对等节点、磁盘、延迟、错误率已告警', '故障要先于用户发现', '故障注入：停掉共识客户端，确认 2 分钟内告警'],
  ['至少两个独立上游可自动切换', '单一上游故障不影响服务', '屏蔽自建节点，确认网关流量切到服务商'],
  ['有可恢复的节点快照或备用节点', '数据库损坏后重新同步耗时长', '定期演练从快照恢复，记录耗时'],
  ['重方法（trace、getLogs 大范围）独立限流', '单个请求可拖垮节点', '压测时观察 P99 是否受影响']
])}

${mistakes([
  ['全节点可以查询任意历史区块的余额。', '裁剪的全节点只保留近期状态；查询很久以前的状态需要归档节点。'],
  ['只运行 Geth 就能同步主网。', 'The Merge 之后必须同时运行执行客户端和共识客户端，并用 JWT 连接。'],
  ['云服务器的普通云盘就够用。', '节点对随机读写要求高，低 IOPS 云盘会导致同步永远落后，应使用本地 NVMe 或高 IOPS 存储。'],
  ['把 8545 开放到公网方便调试。', '公开的 RPC 会被扫描和滥用；需要远程访问时应通过 VPN、SSH 隧道或带鉴权的网关。'],
  ['用一家大服务商就足够可靠。', '服务商也会发生区域故障和限流；关键业务至少准备两个独立上游。']
])}
${recap([
  '节点 = 执行客户端 + 共识客户端，通过 8551 端口和 JWT 通信。',
  '按需求选节点：全节点满足最新读写，归档节点满足历史状态查询；同步优先用快照同步加检查点同步。',
  '硬件关键是 NVMe 磁盘和足够内存；按增长速度预留 30% 以上空间。',
  '监控高度落后、对等节点数、磁盘、RPC 延迟和错误率，并设置明确阈值。',
  'RPC 安全：只开放必要的命名空间，端口内网化，网关鉴权与限流，节点不存私钥。',
  '生产环境采用“自建 + 多家服务商”冗余，用网关做健康检查与切换。'
])}
${quiz([
  { q: '你的数据分析服务需要查询 2021 年某个区块时某合约的存储值，应使用哪类节点？', o: ['轻节点', '裁剪的全节点', '验证者节点', '归档节点'], a: 3, why: '历史状态只有归档节点保存。裁剪全节点只保留近期状态；轻节点只有区块头；验证者节点通常也是裁剪全节点。' },
  { q: 'Geth 日志反复提示没有看到信标客户端，最先检查什么？', o: ['共识客户端是否运行、8551 是否连通、JWT 是否一致', '增加 http.api 中的 admin', '更换 RPC 服务商', '提高 Gas 价格'], a: 0, why: '执行客户端依赖共识客户端通过 Engine API（8551 + JWT）驱动。开放 admin 会带来安全风险，与此问题无关；RPC 服务商和 Gas 价格也无关。' },
  { q: '下列哪项 RPC 配置最安全？', o: ['http.addr=0.0.0.0 并开放 admin,debug', 'http.api=eth,net,web3，端口只绑定内网，前置带 API Key 的网关', '在节点中导入私钥并解锁账户', '关闭所有监控以减少端口'], a: 1, why: '最小化开放的命名空间、端口内网化、网关鉴权是标准做法。开放管理 API、在节点解锁账户都极其危险；关闭监控会让故障无法及时发现。' },
  { q: '全节点当前占用 1.7 TB，每周增长 15 GB，要求一年内不扩容且保留 30% 空闲，最少约需多大磁盘？', o: ['2 TB', '2.5 TB', '3.5 TB', '10 TB'], a: 2, why: '一年增长 15 × 52 = 780 GB，总计约 2.48 TB；除以 0.7 约 3.5 TB。2 TB 和 2.5 TB 不够；10 TB 远超需要。' }
])}
${exercises([["计算题（示例）：执行客户端和共识客户端合计占用 1.2 TB，每周增长 20 GB。要求一年内不扩容，并保留 30% 空闲空间，最少需要多大的磁盘？", "<p>一年增长：20 × 52 = 1,040 GB ≈ 1.04 TB。总计约 1.2 + 1.04 = 2.24 TB。</p><p>保留 30% 空闲：2.24 ÷ 0.7 ≈ <strong>3.2 TB</strong>。所以选 4 TB 的 NVMe SSD。</p>"], ["计算题（示例）：业务每天 500 万次请求，平均每次 20 个计算单元，服务商单价为每百万计算单元 0.5 美元。每月费用是多少？和每月 300–500 美元的独立服务器相比，怎样决定是否自建？", "<p>每月计算单元：5,000,000 × 20 × 30 = 30 亿，即 3,000 个百万。费用 = 3,000 × 0.5 = <strong>1,500 美元</strong>。</p><p>服务器本身更便宜，但还要加运维人力。团队有运维能力、需要 debug 或 trace 方法、请求量继续增长时，自建更划算。团队没有运维能力时，用服务商更省心。生产环境最好两者结合。</p>"], ["设计题：为“最新块时间戳延迟”写一条告警规则。说明阈值和持续时间，并解释为什么这样设。", "<p>规则示例：<code>time() - 最新块时间戳 &gt; 60</code> 持续 2 分钟则告警。指标名以你的客户端或 exporter 实际暴露为准。</p><p>正常情况下延迟在 0–24 秒之间，因为每 12 秒出一个块。超过 60 秒说明节点可能掉同步。设置持续时间可以避免偶尔的空块造成误报。</p>"]])}
${checklist(["能按业务需求在全节点、归档节点、轻节点之间做出选择，并说明理由。", "能用 Docker Compose 启动执行客户端和共识客户端，并让 8545 只绑定 127.0.0.1。", "能按增长速度和 30% 余量估算节点磁盘容量。", "能为区块高度落后、对等节点数、磁盘、RPC 延迟和错误率写出告警阈值。", "做过用 curl 调用 eth_syncing、net_peerCount 和 admin_peers 体检一个节点。"])}
${terms([
  ['执行客户端', 'Execution Client', '执行交易、维护状态并提供 JSON-RPC 的以太坊客户端'],
  ['共识客户端', 'Consensus Client', '运行 PoS 共识、跟踪信标链并驱动执行客户端的客户端'],
  ['归档节点', 'Archive Node', '保存每个区块历史状态、可查询任意历史状态的节点'],
  ['快照同步', 'Snap Sync', '先下载最近状态快照再验证区块头链的快速同步方式'],
  ['检查点同步', 'Checkpoint Sync', '共识客户端从可信最终确定检查点开始同步的方式'],
  ['JWT 密钥', 'JWT Secret', '执行客户端与共识客户端之间 Engine API 认证用的共享密钥'],
  ['对等节点', 'Peer', '与本节点直接相连、交换区块和交易的其他节点'],
  ['计算单元', 'Compute Unit, CU', 'RPC 服务商按方法复杂度计费的计量单位']
])}
` });

})();
