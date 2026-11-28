/* ---------- M10 子文章（7）：m04-77 / m04-78 ★ 实战 DEX 聚合器报价与路由后端 ---------- */
(() => {

CUR = 'm04-77';
addCh({ id: 'm04-77', nav: '实战·设计：聚合器后端', title: 'M10.7 实战·设计：DEX 聚合器报价与路由后端（Go）', desc: '项目目标、需求拆解、系统架构、技术选型、数据模型与接口设计', html: `
<h1>M10.7 实战·设计：DEX 聚合器报价与路由后端（Go）</h1>
${meta(['为 DEX 兑换前端设计一个 Go 报价与路由后端：池子索引、路径搜索、拆单、交易构造与模拟。', '写出量化的验收标准、用户故事、架构图、调用链和报价请求状态机。', '设计 PostgreSQL 表、内存路由图和 REST 接口（/quote、/swap-tx）及错误码。'], '<a href="#m02-10">M05.2 AMM 深入</a>、<a href="#m04-72">M10.2 报价与路由</a>、<a href="#m01-8">M01.8 索引器工程</a>、<a href="#m07-10">M03.10 实战·设计：DEX 兑换前端</a>')}
${beginner(`<p><strong>聚合器（Aggregator）</strong>：在多个 DEX 的多个池子之间寻找最优兑换方案的服务。用户只说“我要用 A 换 B”，聚合器决定走哪些池子、每个池子换多少。</p>
<p><strong>路径（Path）与跳（Hop）</strong>：从 A 到 B 经过的池子序列。USDC → WETH → DAI 经过两个池子，叫“两跳”。</p>
<p><strong>拆单（Split）</strong>：把一笔大单分成几份，分别走不同路径。每个池子承受的价格冲击变小，总输出变多。</p>
<p><strong>报价（Quote）</strong>：在某个区块的池子状态下，输入 X 能得到多少 Y。报价绑定区块号，下一个区块可能就不准了。</p>
<p><strong>calldata</strong>：交易里交给合约的参数字节。本服务构造 calldata，但不签名、不发送。</p>
<p><strong>eth_call 模拟</strong>：让节点“假装执行”一笔交易并返回结果，不上链、不花 Gas。</p>`)}

<h2>1. 一句话理解</h2>
${one('聚合器后端 = 每个区块更新一张“池子图” → 收到报价请求时在图上搜路径、拆单、扣 Gas 选净输出最大的方案 → 用户确认后构造路由合约的 calldata 并模拟 → 交给前端，由用户在钱包里签名。服务只算账和出方案，永远不碰私钥。')}
${call('analogy', `<p>它像一个比价导航 App。地图（池子图）每分钟刷新路况（每个区块刷新储备）。你输入起点和终点（A 换 B），它算出几条路线，告诉你“走高速 70%、走省道 30% 最快”（拆单），还把油费算进去（Gas）。最后它把路线发给你，但方向盘在你手里（钱包签名）。</p>
<p>类比的局限：导航算错了你只是迟到；报价过期或路由被篡改，用户会直接少拿钱。所以每一份方案都要绑定区块、先模拟、并且写进最少收到（minOut）。</p>`)}
${art('一图看懂：一次报价 = 带区块号的路径方案 + 最少收到的底线，由用户签名', 660, 350, [
  S.zone(10, 28, 640, 190, { t: '聚合器后端（Go）：只读、只构造交易' }),
  S.box(24, 58, 120, 56, { k: 'info', t: '10,000 USDC', s: '输入', mono: 1 }),
  S.box(254, 58, 120, 56, { k: 'tint', t: '4.9603 WETH', s: '第 1 跳输出', mono: 1 }),
  S.box(484, 58, 152, 56, { k: 'key', icon: 'coin', t: '9,793.91 DAI', s: '方案输出', mono: 1 }),
  S.arrow(146, 86, 252, 86, { label: '池 A 0.3%' }), S.arrow(376, 86, 482, 86, { label: '池 B 0.3%' }),
  S.text(24, 140, '方案里还带着：', { size: 12, b: 1 }),
  S.box(24, 150, 190, 52, { k: 'tint', t: '绑定区块 N', s: '状态快照的“照片”' }),
  S.box(234, 150, 190, 52, { k: 'tint', t: '扣 Gas 的净输出', s: '单路与拆单比较' }),
  S.box(444, 150, 192, 52, { k: 'ok', icon: 'shield', t: 'minOut 9,744.95', s: '滑点 0.5% 的底线', mono: 1 }),
  S.arrow(330, 220, 330, 270, { label: '返回 calldata' }),
  S.box(210, 272, 240, 48, { k: 'warn', icon: 'wallet', t: '用户钱包', s: '签名并广播，方向盘在用户手里' }),
  S.text(330, 340, '两跳路线、数字取自设计篇的精确计算示例', { size: 12, dim: 1, anchor: 'middle' })
], [
  ['flow', '输入沿路径逐跳变成输出，第 1 跳的输出就是第 2 跳的输入，每跳都付池子手续费。'],
  ['key', '服务只构造交易，不碰私钥。方案必须绑定区块号，并写进 minOut，才能在链上被检查。'],
  ['risk', '报价过期或被篡改，用户会直接少拿钱，所以返回前要用 eth_call 模拟。'],
  ['limit', '这里只画了一条路径；拆单时一份方案里会有多条。']
], '10,000 USDC 经池 A 换成约 4.96 WETH，再经池 B 换成约 9,793.91 DAI，方案绑定区块号并带有最少收到数量，返回给用户钱包签名', 'm04-77')}
${recall(`<p>V2 池子的兑换公式和手续费推导见 <a href="#m02-10">M05.2 AMM 深入</a>；路径、拆单、价格影响和聚合器的概念见 <a href="#m04-72">M10.2 报价与路由</a>；“意图 + Solver”这种把路由交给链下竞争者的模式见 <a href="#m04-74">M10.4 意图交易与 Solver</a>。本项目实现的是传统的“报价 → 用户自己发交易”模式。</p>`)}

<h2>2. 项目目标与验收标准</h2>
<p>功能目标：在<strong>一条 EVM 链</strong>（以以太坊主网为例）上，覆盖 Uniswap V2 风格池和 Uniswap V3 池。服务为 <a href="#m07-10">M03.10 DEX 兑换前端</a>提供两个接口：<code>GET /quote</code> 返回最优方案，<code>POST /swap-tx</code> 返回可直接交给钱包的交易（to、data、value、gas）。V3 池的报价不在本服务里重写 tick 数学，而是用 <code>eth_call</code> 调用链上的 <strong>QuoterV2</strong> 合约。</p>
${tbl(['类别', '验收标准（示例）', '如何度量'], [
  ['功能', '支持 V2 与 V3 池；路径最多 3 跳；最多 3 条路线拆单；精确输入（exact input）', '分叉测试用例全部通过'],
  ['报价延迟', '缓存命中 P95 ≤ 50 ms；未命中 P95 ≤ 300 ms（含 V3 的 eth_call）', '<code>quote_latency_seconds</code> 直方图'],
  ['新鲜度', '报价所用状态落后链头 ≤ 1 个区块；落后 &gt; 3 个区块时拒绝报价', '<code>indexer_head_lag_blocks</code>'],
  ['正确性', '同一区块上 eth_call 模拟的输出与报价偏差 ≤ 1 bp；/swap-tx 在新区块重新模拟时 99% 请求偏差 ≤ 10 bps', '<code>quote_sim_deviation_bps</code>'],
  ['拆单质量', '选中方案的净输出 ≥ 最优单路线净输出（性质测试保证）', '性质测试 + 线上对比日志'],
  ['可用性', '月可用性 99.9%；任一 RPC 节点故障时自动切换', '外部探活 + RPC 故障演练'],
  ['吞吐', '单实例 500 次报价/秒（示例硬件 4 核 8 GB）', 'k6 压测'],
  ['安全', '服务不持有任何私钥；返回的 to 只能是白名单路由合约；代币白名单；按 IP 和 API Key 限流', '安全清单逐项验收']
])}
${call('info', `<p>“新鲜度 ≤ 1 个区块”的意思是：报价引擎读到的池子图，最多比 RPC 节点看到的最新区块晚 1 个。它不保证交易上链时价格不变。交易上链时价格变化由 minOut（最少收到）兜底。</p>`)}

<h2>3. 需求拆解与用户故事</h2>
${tbl(['编号', '用户故事', '验收条件'], [
  ['US-1', '作为前端开发者，我想用一个接口拿到 A 换 B 的最优报价', 'GET /quote 返回 amountOut、minOut、路线明细、Gas 估算、区块号和 quoteId'],
  ['US-2', '作为用户，我想在大额兑换时自动拆单', '金额大时返回多条路线和每条的份额；小额时只返回单路线（Gas 更划算）'],
  ['US-3', '作为用户，我想看到扣除 Gas 之后的真实收益', '响应包含 gasCostInTokenOut 和 netOut；排序按 netOut'],
  ['US-4', '作为前端开发者，我想拿到可直接签名的交易', 'POST /swap-tx 返回 to、data、value、gas；to 是白名单路由合约'],
  ['US-5', '作为用户，我不想签一笔注定失败的交易', '/swap-tx 返回前做 eth_call 模拟；授权不足时返回 NEEDS_APPROVAL 和 spender'],
  ['US-6', '作为运维，我想在链重组时报价仍然正确', '重组后回滚到共同祖先的快照；重组期间的报价用回滚后的状态'],
  ['US-7', '作为运维，我想知道服务是否落后链头', '指标 indexer_head_lag_blocks；落后超过阈值时 /quote 返回 STALE_STATE'],
  ['US-8', '作为安全负责人，我想阻止恶意代币和过度调用', '只报价白名单代币；按 IP / API Key 限流；超限返回 429']
])}

<h2>4. 系统架构、调用链与状态机</h2>
${mm('聚合器后端系统架构', `
flowchart TB
  subgraph FE["前端 · M03.10 兑换前端"]
    UI["SwapCard"] --> API["Next.js /api/quote 代理<br/>附加 API Key"]
  end
  subgraph SVC["聚合器后端 · Go"]
    HTTP["HTTP 层<br/>鉴权 · 限流 · 参数校验"]
    ENG["报价引擎<br/>路径搜索 · 拆单 · Gas"]
    CACHE["每区块缓存<br/>singleflight"]
    SNAP["池子图快照<br/>原子指针 · 最近 64 块"]
    IDX["池子索引器<br/>按区块跟日志 · 重组回滚"]
    BLD["交易构造<br/>calldata · eth_call 模拟"]
  end
  API --> HTTP
  HTTP --> CACHE --> ENG
  ENG --> SNAP
  IDX --> SNAP
  HTTP --> BLD
  IDX -->|"getLogs · header"| GW["RPC 网关<br/>M04.8"]
  ENG -->|"QuoterV2 eth_call"| GW
  BLD -->|"eth_call · estimateGas"| GW
  IDX --> DB[("PostgreSQL<br/>tokens · pools · pool_state")]
  HTTP --> DB
  UI -->|"用户签名并广播"| WAL["钱包"]
  class SNAP key
  class WAL ok
`, [
  ['flow', '索引器是池子图唯一的写入者；报价引擎只读快照。两者通过“原子替换快照指针”交接，读路径不加锁。'],
  ['key', '服务只构造交易，签名和广播都发生在用户钱包。服务被攻破时，攻击者最多返回坏方案，但前端的 to 白名单和用户签名的 minOut 仍然是防线。'],
  ['fail', 'RPC 网关落后或断开时，快照停止推进。HTTP 层检查快照年龄，超过阈值返回 STALE_STATE，而不是用旧状态报价。'],
  ['limit', '只覆盖一条链、V2 与 V3 两类池子；不做跨链、不做 Curve/Balancer 等其他曲线（作为扩展方向）。'],
  ['risk', 'V3 报价依赖 RPC 节点执行 QuoterV2。节点返回错误数据会导致错误报价，所以 /swap-tx 必须再做一次完整交易的模拟。']
])}
<p>RPC 访问统一走 <a href="#m05-10">M04.8 高可用 RPC 网关</a>：它负责多节点切换、按区块号路由和限流。本服务只配置一个网关地址。</p>
${mm('关键调用链：报价 → 授权 → 构造交易 → 用户签名', `
sequenceDiagram
  participant U as 用户
  participant F as 前端
  participant S as 聚合器后端
  participant R as RPC 网关
  participant W as 钱包
  U->>F: 输入 10000 USDC 换 DAI
  F->>S: GET /quote 带 tokenIn tokenOut amountIn
  S->>S: 读快照 搜路径 拆单 扣 Gas
  S->>R: QuoterV2 eth_call 仅 V3 跳
  S-->>F: quoteId amountOut minOut routes block
  U->>F: 点击 兑换
  F->>S: POST /swap-tx 带 quoteId from slippageBps
  S->>R: 读 allowance 与余额 然后 eth_call 模拟
  S-->>F: to data value gas simulatedOut
  F->>F: 校验 to 等于硬编码路由地址
  F->>W: 请求签名
  W->>R: 广播交易
`, [
  ['flow', '前端 M03.10 的 /api/quote 路由原来代理第三方聚合器。现在它改为代理本服务，同样在服务端附加 API Key，浏览器拿不到 Key。'],
  ['key', '/swap-tx 只返回交易内容，不返回签名。用户在钱包里看到的 to 是路由合约，minOut 已写进 data。'],
  ['fail', '授权不足时，模拟一定失败。服务先读 allowance，不足就返回 NEEDS_APPROVAL，前端进入“需要授权”状态（M03.10 状态机）。'],
  ['risk', '前端必须自己校验 to 在硬编码白名单里，不能因为“后端是自己的”就跳过。']
])}
${mm('一次报价与构造交易请求的状态机', `
stateDiagram-v2
  state "已接收" as Received
  state "参数校验" as Validating
  state "缓存命中" as CacheHit
  state "路由计算" as Routing
  state "已报价" as Quoted
  state "已过期" as Expired
  state "检查授权" as CheckAllowance
  state "需要授权" as NeedsApproval
  state "构造交易" as Building
  state "模拟中" as Simulating
  state "可签名" as Ready
  state "拒绝" as Rejected
  [*] --> Received
  Received --> Validating
  Validating --> Rejected: 代币不在白名单或限流
  Validating --> Rejected: 快照过旧 STALE_STATE
  Validating --> CacheHit: 同区块同参数
  Validating --> Routing: 未命中
  Routing --> Quoted: 找到路线
  Routing --> Rejected: NO_ROUTE
  CacheHit --> Quoted
  Quoted --> Expired: 超过 2 个区块
  Expired --> Routing: swap-tx 自动重新报价
  Quoted --> CheckAllowance: POST swap-tx
  CheckAllowance --> NeedsApproval: allowance 不足
  CheckAllowance --> Building: 足够
  Building --> Simulating
  Simulating --> Ready: 偏差在容忍度内
  Simulating --> Rejected: 模拟 revert 或偏差过大
  Ready --> [*]
`, [
  ['key', '报价只在“同区块同参数”时复用。缓存绑定当前快照（区块号加区块哈希，重组后不会混用），新快照到来时整个缓存作废。'],
  ['flow', 'Expired 不是终态：/swap-tx 发现报价超过 2 个区块（示例）时，用同样参数重新路由，并在响应里返回新的报价，前端要把新数字展示给用户。'],
  ['fail', '模拟偏差过大通常说明快照落后或池子在当前区块被大单改变。返回 QUOTE_DRIFT，前端重新报价。'],
  ['limit', '状态机只描述服务端。交易广播后的确认、替换、失败追踪由前端负责（M03.10 第 3 节）。']
])}

<h3>算一算：两跳路线的精确输出（示例）</h3>
<p>设两个 V2 池子，手续费都是 0.3%。池 A：USDC/WETH，储备 2,000,000 USDC（6 位小数）和 1,000 WETH（18 位）。池 B：WETH/DAI，储备 500 WETH 和 1,000,000 DAI（18 位）。用户输入 10,000 USDC，路线 USDC → WETH → DAI。V2 公式：<code>out = in×997×R_out ÷ (R_in×1000 + in×997)</code>，结果向下取整。</p>
${steps([
  '第 1 跳输入：10,000 USDC = 10,000,000,000（链上整数）。in×997 = 9,970,000,000,000。',
  '第 1 跳分子 = 9,970,000,000,000 × 1,000×10^18 = 9,970,000,000,000 × 10^21。分母 = 2,000,000,000,000 × 1,000 + 9,970,000,000,000 = 2,009,970,000,000,000。',
  '第 1 跳输出 = 4,960,273,038,901,078,125 wei，即约 4.960273 WETH。不计手续费和价格冲击时应为 5 WETH。',
  '第 2 跳：in×997 = 4,945,392,219,784,374,890,625。分母 = 500×10^18 × 1,000 + 4,945,392,219,784,374,890,625 = 504,945,392,219,784,374,890,625。',
  '第 2 跳输出 = 9,793,914,938,096,564,347,345 wei，即约 9,793.9149 DAI。理想值 10,000 DAI，损失约 2.06%（两次 0.3% 手续费 + 两次价格冲击）。',
  '滑点 0.5%：minOut = 9,793,914,938,096,564,347,345 × 9,950 ÷ 10,000 = 9,744,945,363,406,081,525,608（约 9,744.9454 DAI）。'
])}
<p>这些数字在下篇的单元测试里作为<strong>精确期望值</strong>使用：Go 实现必须逐位相等，差 1 wei 也算失败。</p>

<h2>5. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['语言', 'Go 1.22+', 'Rust、TypeScript', '并发模型简单；go-ethereum 是官方客户端，ABI、RPC、类型齐全；与 M01 的索引器同栈'],
  ['链交互', 'github.com/ethereum/go-ethereum（ethclient、accounts/abi）', 'web3 库自写 JSON-RPC', 'FilterLogs 支持按区块哈希查询；abi.Pack 支持结构体数组'],
  ['大数运算', 'math/big', 'holiman/uint256', 'big.Int 与链上整数语义一致、易读；热点路径可换 uint256 提速'],
  ['V2 报价', '本地公式计算', '每次 eth_call getAmountsOut', '公式简单且精确；本地计算微秒级，适合拆单的大量试算'],
  ['V3 报价', '链上 QuoterV2 eth_call', '本地重写 tick 数学', '跨 tick 计算复杂、易错；QuoterV2 与真实 swap 走同一段代码。代价是每次多一次 RPC 往返'],
  ['数据库', 'PostgreSQL 16 + pgx v5', 'ClickHouse', '池子元数据和状态快照需要事务和唯一约束；报价日志量大时可分区或转存'],
  ['缓存', '进程内 map（按区块失效）+ singleflight', 'Redis', '缓存只在一个区块内有效，进程内最快；多实例各自缓存即可'],
  ['HTTP', 'net/http（Go 1.22 路由）', 'gin、echo', '依赖少；中间件自写鉴权、限流（golang.org/x/time/rate）'],
  ['路由合约', '自定义最小路由合约 MiniRouter（下篇给出）', 'Uniswap Universal Router', '接口简单、便于讲清白名单与 minOut 检查；生产可换成经过审计的路由合约'],
  ['测试', 'go test + Foundry anvil 主网分叉', 'Hardhat', 'anvil 启动快，支持 snapshot/revert 和固定分叉区块'],
  ['监控', 'Prometheus + Grafana + OpenTelemetry', 'Datadog', '指标、链路追踪开源可自建']
])}
<p>表中版本号只是举例，写的是最低要求，以各项目官方发布为准：截至 2026-11-28，Go 最新为 1.27（2026-08 发布），PostgreSQL 最新大版本为 19（2026-11-19 发布），16 仍在官方支持期内（到 2028-11），pgx 仍是 v5。</p>
${compare('V2 与 V3 的报价方式对比', [
  { name: 'V2：本地算', tag: '快', kind: 'ok', points: ['输入：快照里的 reserve0、reserve1', '公式：in×997×R_out ÷ (R_in×1000 + in×997)', '延迟：微秒级，可做上千次拆单试算', '风险：快照落后时结果偏差'] },
  { name: 'V3：链上 QuoterV2', tag: '准', kind: 'info', points: ['输入：tokenIn、tokenOut、fee、amountIn', '执行：节点在指定区块模拟真实 swap', '延迟：一次 RPC 往返（毫秒级）', '风险：调用次数多，要批量和缓存'] },
  { name: '混合路线', tag: '分跳处理', kind: 'key', points: ['逐跳计算：V2 跳本地算，V3 跳 eth_call', '同一个区块号贯穿整条路线', 'QuoterV2 只能报纯 V3 路径，混合路径必须逐跳', '最终以整笔交易的 eth_call 模拟为准'] }
], [
  ['key', '“V3 不重写 tick 数学”是一个明确的工程取舍：用一次 RPC 往返换取与链上完全一致的结果。'],
  ['limit', '拆单需要同一路线在多个金额下的输出。V3 路线要预先批量报价 N 个金额点，调用次数随 N 线性增长。'],
  ['fail', '不同跳用不同区块号报价，结果会互相矛盾。所有 eth_call 都传入快照的区块号。']
])}

<h2>6. 数据模型</h2>
<h3>6.1 PostgreSQL DDL</h3>
${code('SQL', `
-- 代币白名单：与前端 tokens 表同源（M03.10），后台审核后 verified = true 才参与报价
CREATE TABLE tokens (
  chain_id      INTEGER   NOT NULL,
  address       CHAR(42)  NOT NULL,              -- EIP-55 校验和格式
  symbol        TEXT      NOT NULL,
  decimals      SMALLINT  NOT NULL CHECK (decimals BETWEEN 0 AND 36),
  verified      BOOLEAN   NOT NULL DEFAULT false,
  is_hub        BOOLEAN   NOT NULL DEFAULT false, -- 可作为中间跳的枢纽币：WETH、USDC、USDT、DAI、WBTC（示例）
  transfer_flag TEXT      NOT NULL DEFAULT 'standard',  -- standard | fee_on_transfer | rebasing | blocked
  PRIMARY KEY (chain_id, address)
);

-- 池子元数据：由工厂合约的 PairCreated / PoolCreated 事件发现
CREATE TABLE pools (
  chain_id       INTEGER   NOT NULL,
  address        CHAR(42)  NOT NULL,
  kind           TEXT      NOT NULL CHECK (kind IN ('v2', 'v3')),
  factory        CHAR(42)  NOT NULL,              -- 只收录白名单工厂创建的池子
  token0         CHAR(42)  NOT NULL,
  token1         CHAR(42)  NOT NULL,
  fee_ppm        INTEGER   NOT NULL,              -- 百万分之：V2 = 3000，V3 = 100/500/3000/10000
  created_block  BIGINT    NOT NULL,
  enabled        BOOLEAN   NOT NULL DEFAULT true, -- 人工下架开关
  PRIMARY KEY (chain_id, address)
);
CREATE INDEX idx_pools_t0 ON pools (chain_id, token0);
CREATE INDEX idx_pools_t1 ON pools (chain_id, token1);

-- 已处理区块：索引器游标与重组检测（M01.8 的做法）
CREATE TABLE blocks (
  chain_id     INTEGER  NOT NULL,
  number       BIGINT   NOT NULL,
  hash         CHAR(66) NOT NULL,
  parent_hash  CHAR(66) NOT NULL,
  PRIMARY KEY (chain_id, number)
);

-- 池子状态快照：只在池子状态变化的区块写一行；某区块的状态 = number ≤ 该区块的最新一行
CREATE TABLE pool_state (
  chain_id        INTEGER       NOT NULL,
  pool            CHAR(42)      NOT NULL,
  block_number    BIGINT        NOT NULL,
  block_hash      CHAR(66)      NOT NULL,          -- 重组时按 block_number 删除，并校验哈希
  reserve0        NUMERIC(78,0),                   -- V2
  reserve1        NUMERIC(78,0),
  sqrt_price_x96  NUMERIC(78,0),                   -- V3，只用于剪枝和监控
  liquidity       NUMERIC(78,0),
  tick            INTEGER,
  PRIMARY KEY (chain_id, pool, block_number)
);

-- 报价日志：用于 /swap-tx 取回方案、事后对账和质量分析；按月分区，保留 30 天（示例）
CREATE TABLE quotes (
  quote_id        UUID          PRIMARY KEY,
  chain_id        INTEGER       NOT NULL,
  block_number    BIGINT        NOT NULL,
  token_in        CHAR(42)      NOT NULL,
  token_out       CHAR(42)      NOT NULL,
  amount_in       NUMERIC(78,0) NOT NULL,
  amount_out      NUMERIC(78,0) NOT NULL,
  gas_estimate    BIGINT        NOT NULL,
  net_out         NUMERIC(78,0) NOT NULL,          -- amount_out 减去 Gas 折算成 token_out 的数量
  routes          JSONB         NOT NULL,          -- [{"share":7,"amountIn":"...","hops":[...]}]
  api_key_id      TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  sim_out         NUMERIC(78,0),                   -- /swap-tx 模拟结果，回填
  sim_block       BIGINT
);
CREATE INDEX idx_quotes_created ON quotes (created_at);
`)}
${call('info', `<p>为什么 pool_state 不是“每个区块每个池子一行”？以太坊主网每 12 秒一个区块，收录 2 万个池子（示例）时，每天会写 1.4 亿行，绝大多数是重复值。只写变化的池子，行数降到“每个区块实际被交易的池子数”。</p>`)}
<h3>6.2 内存中的路由图</h3>
<p>报价不查数据库。索引器在内存里维护一个<strong>不可变快照</strong>：每个新区块复制一份池子表（只复制指针），把变化的池子换成新对象，然后原子替换“当前快照”指针。报价引擎拿到指针后，这份快照在整个请求期间都不会变。</p>
${code('GO', `
package graph

import (
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

type Kind uint8

const (
	KindV2 Kind = 1
	KindV3 Kind = 2
)

// Pool 是某个区块时刻的池子状态。快照之间共享未变化的 *Pool，变化时整体替换，不原地修改
type Pool struct {
	Addr           common.Address
	Kind           Kind
	Token0, Token1 common.Address
	FeePpm         uint32   // 百万分之：3000 = 0.3%
	Reserve0       *big.Int // V2 储备
	Reserve1       *big.Int
	SqrtPriceX96   *big.Int // V3：只用于剪枝（判断是否有流动性），报价走 QuoterV2
	Liquidity      *big.Int
}

// Edge 是图上的一条有向边：从 token 出发经过某个池子
type Edge struct {
	Pool common.Address
	To   common.Address
}

// Snapshot 是某个区块的完整池子图
type Snapshot struct {
	Block  uint64
	Hash   common.Hash
	SeenAt time.Time                        // 本服务看到这个区块的时间，用于判断是否过旧
	Pools  map[common.Address]*Pool         // 池子地址 -> 状态
	Adj    map[common.Address][]Edge        // 代币 -> 出边（只在新池加入时重建，快照间共享）
	Hubs   map[common.Address]bool          // 可作为中间跳的枢纽币
}

// Hop / Path / Route 是报价引擎的输出结构
type Hop struct {
	Pool              common.Address
	Kind              Kind
	TokenIn, TokenOut common.Address
	FeePpm            uint32
}
type Path []Hop

type Route struct {
	Path      Path
	Chunks    int      // 分到 N 份中的几份
	AmountIn  *big.Int
	AmountOut *big.Int
	Gas       uint64
}
`)}

<h2>7. 接口设计</h2>
${tbl(['接口', '方法与路径', '参数', '返回'], [
  ['报价', 'GET /v1/quote', 'chainId, tokenIn, tokenOut, amountIn（链上整数字符串）, slippageBps（默认 50）, maxHops（≤ 3）, maxSplits（≤ 3）', '{ quoteId, blockNumber, amountOut, minOut, gasEstimate, gasCostInTokenOut, netOut, priceImpactBps（相对理想输出的总损失，含手续费）, routes[], expiresAtBlock }'],
  ['构造交易', 'POST /v1/swap-tx', '{ quoteId, from, recipient, slippageBps, deadlineSec }', '{ to, data, value, gas, minOut, simulatedOut, blockNumber, requoted }'],
  ['支持的代币', 'GET /v1/tokens', 'chainId', 'verified 代币列表（前端可与自己的列表比对）'],
  ['健康检查', 'GET /healthz', '无', '{ headBlock, snapshotBlock, lagBlocks, rpcOk }'],
  ['价格流（可选）', 'WS /v1/stream', '订阅 { tokenIn, tokenOut, amountIn }', '每个新区块推送一次 quote 摘要；每连接最多 5 个订阅（示例）']
])}
${code('JSON', `
// GET /v1/quote?chainId=1&tokenIn=0xA0b8…USDC&tokenOut=0x6B17…DAI&amountIn=10000000000&slippageBps=50
{
  "quoteId": "5f0c2d1e-6a8b-4c55-9a0e-2f1b7d3c9e41",
  "blockNumber": 21000000,
  "expiresAtBlock": 21000002,
  "amountIn": "10000000000",
  "amountOut": "9793914938096564347345",
  "minOut": "9744945363406081525608",
  "gasEstimate": 171000,
  "gasCostInTokenOut": "6840000000000000000",
  "netOut": "9787074938096564347345",
  "priceImpactBps": 206,
  "routes": [
    { "chunks": 10, "amountIn": "10000000000", "amountOut": "9793914938096564347345",
      "hops": [
        { "pool": "0xPoolA…", "kind": "v2", "fee": 3000, "tokenIn": "USDC", "tokenOut": "WETH" },
        { "pool": "0xPoolB…", "kind": "v2", "fee": 3000, "tokenIn": "WETH", "tokenOut": "DAI" }
      ] }
  ]
}
`)}
<p>上面数字来自第 4 节的算一算（示例）。gasCostInTokenOut 假设 171,000 Gas、20 gwei、1 WETH = 2,000 DAI：171,000 × 20 × 10^9 = 0.00342 ETH，折合 6.84 DAI。priceImpactBps 用“不计手续费和冲击的理想输出 10,000 DAI”估算：1 − 9,793.91 ÷ 10,000 ≈ 2.06%。注意：本设计里这个字段是<strong>相对理想值的总损失</strong>，包含两跳各 0.3% 的手续费，不是纯价格影响。扣掉手续费后纯价格冲击约 1.46%（2.06% − 0.6% 粗算；按乘法精算 1 − 9,793.91 ÷ (10,000 × 0.997²) ≈ 1.47%）。前端如果要单独展示“价格影响”，要另算或另加字段。</p>
${code('JSON', `
// POST /v1/swap-tx  请求
{ "quoteId": "5f0c2d1e-…", "from": "0xUser…", "recipient": "0xUser…", "slippageBps": 50, "deadlineSec": 1200 }

// 200 响应：前端校验 to 后交给钱包签名
{ "to": "0xMiniRouter…", "data": "0x…", "value": "0", "gas": "205200",
  "minOut": "9744945363406081525608", "simulatedOut": "9793914938096564347345",
  "blockNumber": 21000001, "requoted": false }

// 409 响应：授权不足，前端进入“需要授权”状态
{ "error": { "code": "NEEDS_APPROVAL", "message": "allowance 不足", "spender": "0xMiniRouter…", "required": "10000000000" } }
`)}
${tbl(['错误码', 'HTTP', '含义', '前端动作'], [
  ['INVALID_PARAM', '400', '地址格式、金额、跳数或滑点越界', '显示参数错误'],
  ['TOKEN_NOT_ALLOWED', '400', '代币不在白名单或被标记 blocked', '显示“未支持的代币”'],
  ['NO_ROUTE', '404', '3 跳内没有可用路径或流动性不足', '提示换代币或减少金额'],
  ['QUOTE_NOT_FOUND', '404', 'quoteId 不存在或已清理', '重新报价'],
  ['NEEDS_APPROVAL', '409', '用户对路由合约的 allowance 不足', '进入授权步骤（spender = 路由合约）'],
  ['INSUFFICIENT_BALANCE', '409', '用户余额不足', '显示余额不足'],
  ['QUOTE_DRIFT', '409', '模拟输出与报价偏差超过容忍度（示例 10 bps）', '重新报价并让用户确认新数字'],
  ['SIMULATION_FAILED', '422', 'eth_call 模拟 revert（附解码后的原因）', '显示原因，禁止签名'],
  ['RATE_LIMITED', '429', '超过 IP 或 API Key 限额', '退避重试'],
  ['STALE_STATE', '503', '快照落后链头超过 3 个区块（示例）', '暂停报价，显示网络异常'],
  ['UPSTREAM_RPC', '502', 'RPC 网关错误或超时', '重试一次后提示']
])}
${tryit(`<p>先亲手读一次 V2 池子的储备，理解索引器要维护的数据：</p>
<ol><li>安装 Foundry，准备一个以太坊主网 RPC 地址，记为 RPC。</li>
<li>用 cast 查询 V2 工厂合约（地址见 Uniswap 官方文档 V2 Factory 页面）里 USDC 与 WETH 的交易对：<code>cast call 工厂地址 "getPair(address,address)(address)" USDC地址 WETH地址 --rpc-url RPC</code>。</li>
<li>读储备：<code>cast call 交易对地址 "getReserves()(uint112,uint112,uint32)" --rpc-url RPC</code>，再读 <code>token0()</code> 确认哪个储备是 USDC。</li>
<li>把储备代入第 4 节的公式，手算输入 1,000 USDC 的输出；再用 <code>cast call</code> V2 Router02 的 <code>getAmountsOut(uint256,address[])</code> 对比。</li>
<li>预期结果：手算值与 getAmountsOut 返回值逐位相等。如果差 1，检查是否忘了向下取整。</li></ol>`)}

${recap([
  '服务定位：为 M03.10 兑换前端提供 /quote 与 /swap-tx；只构造和模拟交易，签名永远在用户钱包。',
  '验收标准量化：报价 P95 延迟、新鲜度 ≤ 1 个区块、同区块模拟偏差 ≤ 1 bp、可用性 99.9%（均为示例）。',
  '架构核心：索引器单写池子图快照，报价引擎读不可变快照；所有 eth_call 固定在快照区块号。',
  'V2 本地公式计算，V3 通过 eth_call 调 QuoterV2，不在服务里重写 tick 数学。',
  '数据：pool_state 只记录变化；quotes 保存方案供 /swap-tx 取回；错误码与前端状态一一对应。'
])}
${quiz([
  { q: '本服务在一次兑换中负责哪件事？', o: ['代用户签名并广播交易', '托管用户资金后统一兑换', '计算方案、构造 calldata 并模拟，签名由用户钱包完成', '只返回价格，不返回交易'], a: 2, why: '服务只出方案和未签名交易。它不持有私钥，也不托管资金。只返回价格则无法支撑 /swap-tx。' },
  { q: '为什么 V3 池的报价选择调用链上 QuoterV2，而不是在 Go 里重写？', o: ['V3 池没有公开的储备数据', '跨 tick 计算复杂易错，QuoterV2 与真实 swap 走同一段代码，结果一致', 'QuoterV2 不需要 RPC', 'Go 无法处理 160 位整数'], a: 1, why: '这是用一次 RPC 往返换取正确性的取舍。V3 状态是公开的，QuoterV2 也需要 RPC，Go 的 big.Int 能处理任意位数。' },
  { q: '/swap-tx 发现用户 allowance 不足，应该怎样响应？', o: ['返回 409 NEEDS_APPROVAL 和 spender，让前端走授权步骤', '跳过模拟直接返回交易', '用服务的钱包先替用户授权', '把滑点调大后重试'], a: 0, why: '授权必须由用户自己签。跳过模拟会让用户签一笔必然失败的交易；服务不能持有钱包；滑点与授权无关。' }
])}
${exercises([
  ['（示例）把第 4 节的输入改为 1,000 USDC，其他不变。先算第 1 跳输出约多少 WETH，再判断价格冲击比 10,000 USDC 时大还是小，为什么？', '<p>第 1 跳输出 = 1,000×10^6×997×10^21 ÷ (2×10^15 + 997×10^9) 约 0.4983 WETH，理想值 0.5 WETH，损失约 0.35%，其中 0.3% 是手续费。输入只占池子储备的 0.05%，价格冲击远小于 10,000 USDC 时（占 0.5%）。</p>'],
  ['为 pool_state 设计一个查询：取出区块 N 时所有池子的状态。说明为什么需要 (chain_id, pool, block_number) 主键。', '<p>用 <code>SELECT DISTINCT ON (pool) * FROM pool_state WHERE chain_id = 1 AND block_number &lt;= N ORDER BY pool, block_number DESC</code>。主键保证同一池子在同一区块只有一行，并让“某池子 ≤ N 的最新一行”可以走索引倒序扫描。</p>'],
  ['列出 /quote 响应中哪些字段必须保存在 quotes 表里，/swap-tx 才能在不重新计算的情况下构造交易？', '<p>至少需要：block_number（判断是否过期）、token_in、token_out、amount_in、amount_out（计算 minOut 和模拟偏差）、routes（每条路线的 amountIn 和 hops，用来编码 calldata）。gas_estimate 用于对比模拟后的 estimateGas。</p>']
])}
${checklist(['能写出本项目的量化验收标准，并说明“新鲜度 ≤ 1 个区块”与 minOut 的分工。', '能画出索引器、快照、报价引擎、交易构造和 RPC 网关之间的数据流。', '能手算两跳 V2 路线的精确输出和 minOut。', '能写出 tokens、pools、blocks、pool_state、quotes 的 DDL，并解释 pool_state 只记变化的原因。', '能列出 /quote、/swap-tx 的字段和错误码，并说出前端对每个错误码的动作。'])}
${call('info', '<p>设计到此完成。下一篇 <a href="#m04-78">M10.8 实战·实现</a> 讲核心代码、测试策略、部署运维、安全清单与里程碑。</p>', '下一篇')}
` });

CUR = 'm04-78';
addCh({ id: 'm04-78', nav: '实战·实现：聚合器后端', title: 'M10.8 实战·实现：DEX 聚合器报价与路由后端（Go）', desc: '核心代码、测试策略、部署运维、安全清单、里程碑与扩展方向', html: `
<h1>M10.8 实战·实现：DEX 聚合器报价与路由后端（Go）</h1>
${meta(['按上篇的设计，读懂并能复现索引器、V2 数学、路径搜索、拆单、Gas 折算、calldata 构造和模拟的核心代码。', '为项目制定测试策略：精确值单元测试、anvil 主网分叉测试、性质测试和 RPC 延迟故障注入。', '完成监控、安全清单与威胁模型，并按 6 周里程碑交付。'], '前置：<a href="#m04-77">M10.7 实战·设计</a>')}
${call('info', '<p>本篇是项目的下篇。架构图、状态机、数据模型和接口定义都在<a href="#m04-77">上篇</a>，读代码时可以对照着看。</p>')}
${art('一图看懂：几个 Go 包各管一段，索引器写、报价读、构造器出交易', 660, 350, [
  S.box(10, 40, 190, 64, { k: 'info', mono: 1, icon: 'server', t: 'indexer', s: 'Indexer.Step\nfindAncestor' }),
  S.box(235, 40, 190, 64, { k: 'key', mono: 1, icon: 'db', t: 'graph', s: 'Snapshot · Pool · Edge\nFindPaths' }),
  S.box(460, 40, 190, 64, { k: 'tint', mono: 1, icon: 'hash', t: 'amm', s: 'GetAmountOut\n（big.Int）' }),
  S.arrow(202, 72, 233, 72),
  S.box(235, 150, 190, 72, { k: 'info', mono: 1, icon: 'cpu', t: 'quote', s: 'PathQuoter · GreedySplit\nfinalize · Engine.Quote' }),
  S.arrow(330, 148, 330, 106, { label: '读快照' }),
  S.arrow(556, 106, 427, 166),
  S.box(10, 150, 170, 60, { k: 'idle', dash: 1, icon: 'cloud', t: 'RPC 网关', s: '日志 · eth_call' }),
  S.arrow(95, 148, 95, 106, { label: 'getLogs' }),
  S.box(235, 262, 190, 60, { k: 'info', mono: 1, icon: 'code', t: 'txbuild', s: 'BuildSwapCalldata\nSimulate' }),
  S.arrow(330, 224, 330, 260, { label: 'Plan' }),
  S.box(460, 262, 190, 60, { k: 'warn', mono: 1, icon: 'lock', t: 'MiniRouter.sol', s: '链上执行，不持有余额' }),
  S.arrow(427, 292, 458, 292, { dash: 1 }),
  S.route([[233, 306], [95, 306], [95, 212]], { k: 'info', dash: 1, label: 'eth_call 模拟' }),
  S.text(330, 342, '框内是正文里真实的包名、类型和函数名：indexer 写快照，quote 只读快照', { size: 12.5, anchor: 'middle', mw: 630 })
], [
  ['flow', '链上日志经 RPC 进入 indexer，写成 graph 的快照；quote 读快照算出方案；txbuild 把方案变成 calldata。'],
  ['key', 'graph 是中心：indexer 是唯一的写入者，quote 和 txbuild 只读，所以读路径不加锁。'],
  ['risk', '路由合约 MiniRouter 在链上执行，要自己限定调用目标，且不持有用户余额。'],
  ['limit', '本图只画主要依赖；缓存、HTTP 层和数据库不在这里，见下方数据流图。']
], 'indexer 包通过 RPC 读日志并写入 graph 包的快照，quote 包读取快照算出方案，txbuild 包构造调用数据并交给链上的 MiniRouter 合约执行', 'm04-78')}

<h2>8. 核心代码</h2>
${art('一图看懂：数据从链上进来，在进程内存里被读，只有方案出去', 660, 336, [
  S.zone(10, 30, 160, 244, { t: '链上 / RPC' }),
  S.zone(190, 30, 300, 244, { t: '聚合器进程（Go）' }),
  S.zone(510, 30, 140, 112, { t: 'PostgreSQL' }),
  S.box(22, 66, 136, 60, { k: 'info', icon: 'cloud', t: 'RPC 网关', s: '日志 · 区块头' }),
  S.box(22, 178, 136, 60, { k: 'idle', dash: 1, icon: 'code', t: '链上合约', s: 'eth_call 模拟' }),
  S.box(206, 62, 268, 42, { k: 'info', mono: 1, t: 'indexer', s: '按区块跟日志，重组回滚' }),
  S.box(206, 128, 268, 52, { k: 'key', icon: 'db', t: '池子图快照', s: '原子指针 · 最近 64 块' }),
  S.box(206, 206, 126, 52, { k: 'info', mono: 1, t: 'quote 引擎', s: '只读快照' }),
  S.box(348, 206, 126, 52, { k: 'info', mono: 1, t: 'txbuild', s: '构造并模拟' }),
  S.arrow(150, 100, 204, 84), S.arrow(340, 106, 340, 126), S.arrow(270, 182, 270, 204),
  S.box(522, 64, 116, 62, { k: 'tint', t: '三张表', s: 'tokens · pools\npool_state', mono: 1 }),
  S.arrow(476, 82, 520, 90, { both: 1 }),
  S.box(510, 196, 140, 62, { k: 'warn', icon: 'wallet', t: '用户钱包', s: '签名并广播' }),
  S.arrow(476, 232, 508, 232),
  S.route([[410, 260], [410, 296], [90, 296], [90, 240]], { k: 'info', dash: 1, label: 'eth_call 模拟' }),
  S.text(330, 326, '只有 indexer 写快照；服务只返回方案，签名和广播在用户钱包', { size: 12.5, anchor: 'middle', mw: 630 })
], [
  ['flow', '链上日志经 RPC 网关进入 indexer，更新内存里的池子图快照，同时落库到 PostgreSQL。'],
  ['key', '报价引擎只读内存里的快照，读路径不加锁；indexer 同时把 tokens、pools、pool_state 写进数据库。'],
  ['fail', 'RPC 落后时快照停止推进，HTTP 层按快照年龄返回 STALE_STATE，不用旧状态报价。'],
  ['limit', '数据库和链上合约在进程之外：V2 在本地算，V3 报价和返回前的模拟要经 RPC 做 eth_call。']
], '链上数据经 RPC 网关进入聚合器进程的 indexer，写入内存里的池子图快照并落库，报价引擎和交易构造只读快照，结果返回给用户钱包', 'm04-78')}
<h3>8.1 池子索引器：按区块跟日志，处理重组</h3>
${recall(`<p>索引器的三条纪律来自 <a href="#m01-8">M01.8 索引器工程</a>：按区块顺序推进；每个区块校验 parentHash，不一致就找共同祖先并回滚；写入幂等（唯一键）。这里把“回滚数据库”扩展为“回滚内存快照”。</p>`)}
<p>做法：每个新区块按<strong>区块哈希</strong>取日志（不是按区块号），只关心四类事件：V2 的 <code>Sync(uint112,uint112)</code> 直接带新储备；V3 的 <code>Swap</code> 带新的 sqrtPriceX96 和 liquidity；V3 的 <code>Mint</code>、<code>Burn</code> 只标记“需要刷新”。内存里保留最近 64 个区块的快照（示例），重组时直接切回共同祖先的快照。</p>
${code('GO', `
package indexer

import (
	"context"
	"errors"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"

	"example.com/aggsvc/graph"
)

var (
	topicSync   = crypto.Keccak256Hash([]byte("Sync(uint112,uint112)"))
	topicV3Swap = crypto.Keccak256Hash([]byte("Swap(address,address,int256,int256,uint160,uint128,int24)"))
	topicV3Mint = crypto.Keccak256Hash([]byte("Mint(address,address,int24,int24,uint128,uint256,uint256)"))
	topicV3Burn = crypto.Keccak256Hash([]byte("Burn(address,int24,int24,uint128,uint256,uint256)"))
)

const keep = 64 // 内存中保留的快照数（示例），也是能处理的最大重组深度

var ErrDeepReorg = errors.New("重组深度超过内存快照，需要从数据库全量重建")

type Store interface {
	SaveBlock(ctx context.Context, n uint64, hash, parent common.Hash, changed []*graph.Pool) error // 同一事务写 blocks + pool_state
	DeleteAfter(ctx context.Context, n uint64) error                                                // 重组：删除 > n 的 blocks 与 pool_state
}

type Indexer struct {
	ec      *ethclient.Client
	store   Store
	snaps   map[uint64]*graph.Snapshot
	head    *graph.Snapshot
	publish func(*graph.Snapshot) // 原子替换报价引擎读取的快照指针
	readV3  func(ctx context.Context, pools []common.Address, block uint64) (map[common.Address]*graph.Pool, error)
}

// Step 推进一个区块。返回 reorg=true 表示发生回滚，调用方应立即再调用 Step
func (ix *Indexer) Step(ctx context.Context) (reorg bool, err error) {
	n := ix.head.Block + 1
	h, err := ix.ec.HeaderByNumber(ctx, new(big.Int).SetUint64(n))
	if err != nil {
		return false, err // 包括 ethereum.NotFound：新区块还没出，调用方稍后重试
	}
	if h.ParentHash != ix.head.Hash { // 父哈希对不上：链头换了分叉
		anc, err := ix.findAncestor(ctx)
		if err != nil {
			return false, err
		}
		if err := ix.store.DeleteAfter(ctx, anc.Block); err != nil {
			return false, err
		}
		ix.head = anc
		ix.publish(anc) // 报价立刻改用祖先状态
		reorgTotal.Inc()
		return true, nil
	}

	bh := h.Hash()
	logs, err := ix.ec.FilterLogs(ctx, ethereum.FilterQuery{
		BlockHash: &bh, // 按哈希取：就算这期间又发生重组，也不会混入另一条分叉的日志
		Topics:    [][]common.Hash{{topicSync, topicV3Swap, topicV3Mint, topicV3Burn}},
	})
	if err != nil {
		return false, err
	}

	next := ix.head.CloneShallow(n, bh) // 复制池子表的指针，不复制池子对象
	next.SeenAt = time.Now()
	changed := map[common.Address]*graph.Pool{}
	var dirtyV3 []common.Address
	for _, lg := range logs { // 日志按 logIndex 升序，同一池子后来的事件覆盖前面的
		old := next.Pools[lg.Address]
		if old == nil || len(lg.Topics) == 0 {
			continue // 不是已收录的池子：可能是假池子发出的同名事件，直接忽略
		}
		switch lg.Topics[0] {
		case topicSync:
			if len(lg.Data) < 64 {
				continue
			}
			p := *old // 复制后修改，旧快照里的对象保持不变
			p.Reserve0 = new(big.Int).SetBytes(lg.Data[0:32])
			p.Reserve1 = new(big.Int).SetBytes(lg.Data[32:64])
			next.Pools[lg.Address], changed[lg.Address] = &p, &p
		case topicV3Swap:
			if len(lg.Data) < 160 { // 非 indexed 字段：amount0, amount1, sqrtPriceX96, liquidity, tick
				continue
			}
			p := *old
			p.SqrtPriceX96 = new(big.Int).SetBytes(lg.Data[64:96])
			p.Liquidity = new(big.Int).SetBytes(lg.Data[96:128])
			next.Pools[lg.Address], changed[lg.Address] = &p, &p
		default: // Mint / Burn：区间内流动性可能变化，读一次 liquidity()
			dirtyV3 = append(dirtyV3, lg.Address)
		}
	}
	if len(dirtyV3) > 0 {
		fresh, err := ix.readV3(ctx, dirtyV3, n) // 用 Multicall3 批量 eth_call，固定区块号 n
		if err != nil {
			return false, err
		}
		for a, p := range fresh {
			next.Pools[a], changed[a] = p, p
		}
	}

	list := make([]*graph.Pool, 0, len(changed))
	for _, p := range changed {
		list = append(list, p)
	}
	if err := ix.store.SaveBlock(ctx, n, bh, h.ParentHash, list); err != nil {
		return false, err // 未提交：下次从同一区块重来，幂等
	}
	ix.snaps[n] = next
	delete(ix.snaps, n-keep)
	ix.head = next
	ix.publish(next)
	return false, nil
}

// findAncestor 从链头往回找：第一个“内存快照哈希 = 链上同高度哈希”的区块就是共同祖先
func (ix *Indexer) findAncestor(ctx context.Context) (*graph.Snapshot, error) {
	for k := ix.head.Block; k+keep > ix.head.Block && k > 0; k-- {
		s, ok := ix.snaps[k]
		if !ok {
			break
		}
		h, err := ix.ec.HeaderByNumber(ctx, new(big.Int).SetUint64(k))
		if err != nil {
			return nil, err
		}
		if h.Hash() == s.Hash {
			return s, nil
		}
	}
	return nil, ErrDeepReorg
}
`)}
${call('deep', `<p>新池子的发现（V2 工厂的 PairCreated、V3 工厂的 PoolCreated 事件）也在同一个循环里处理：只收录<strong>白名单工厂</strong>创建、且两个代币都在 tokens 白名单里的池子，写入 pools 表后重建 Adj。代码结构与上面相同，此处省略。</p>`)}

<h3>8.2 V2 兑换数学（big.Int）</h3>
${code('GO', `
package amm

import "math/big"

var tenK = big.NewInt(10000)

// GetAmountOut 与 UniswapV2Library.getAmountOut 等价。
// 合约写死 997/1000；这里用万分位参数化费率：feeBps = 30 时，分子分母同乘 10，向下取整结果完全相同
func GetAmountOut(amountIn, reserveIn, reserveOut *big.Int, feeBps int64) *big.Int {
	if amountIn.Sign() <= 0 || reserveIn.Sign() <= 0 || reserveOut.Sign() <= 0 {
		return new(big.Int)
	}
	inWithFee := new(big.Int).Mul(amountIn, big.NewInt(10000-feeBps)) // amountIn × 9970
	num := new(big.Int).Mul(inWithFee, reserveOut)
	den := new(big.Int).Mul(reserveIn, tenK)
	den.Add(den, inWithFee)
	return num.Quo(num, den) // Quo 对正数向下取整，与 Solidity 整数除法一致
}

// Reserves 按输入代币方向返回 (reserveIn, reserveOut)
func Reserves(token0, tokenIn common.Address, r0, r1 *big.Int) (*big.Int, *big.Int) {
	if tokenIn == token0 {
		return r0, r1
	}
	return r1, r0
}
`)}
<p>（上面第二个函数需要 <code>import "github.com/ethereum/go-ethereum/common"</code>。）</p>

<h3>8.3 路径搜索：枢纽币限制下的 ≤ 3 跳 DFS</h3>
<p>全图搜索 3 跳的路径数会随池子数爆炸。常用的剪枝：<strong>中间代币只能是枢纽币</strong>（WETH、USDC、USDT、DAI、WBTC，示例）；不重复经过同一代币；跳过没有流动性的池子；每对代币最多保留 50 条路径（示例）。</p>
${code('GO', `
package graph

// FindPaths 返回 tokenIn 到 tokenOut 的所有简单路径（不重复代币），跳数 ≤ maxHops
func (s *Snapshot) FindPaths(in, out common.Address, maxHops, limit int) []Path {
	var res []Path
	var cur Path
	visited := map[common.Address]bool{in: true}

	var dfs func(tok common.Address)
	dfs = func(tok common.Address) {
		for _, e := range s.Adj[tok] {
			if len(res) >= limit {
				return
			}
			p := s.Pools[e.Pool]
			if p == nil || !p.Usable() || visited[e.To] {
				continue // 池子被下架、没有流动性，或会形成环
			}
			cur = append(cur, Hop{Pool: p.Addr, Kind: p.Kind, TokenIn: tok, TokenOut: e.To, FeePpm: p.FeePpm})
			switch {
			case e.To == out:
				res = append(res, append(Path(nil), cur...)) // 复制一份，避免后续修改 cur
			case len(cur) < maxHops && s.Hubs[e.To]: // 只有枢纽币能做中间跳
				visited[e.To] = true
				dfs(e.To)
				visited[e.To] = false
			}
			cur = cur[:len(cur)-1]
		}
	}
	dfs(in)
	return res
}

// Usable：V2 两边储备都大于 0；V3 liquidity 大于 0
func (p *Pool) Usable() bool {
	if p.Kind == KindV2 {
		return p.Reserve0 != nil && p.Reserve1 != nil && p.Reserve0.Sign() > 0 && p.Reserve1.Sign() > 0
	}
	return p.Liquidity != nil && p.Liquidity.Sign() > 0
}
`)}

<h3>8.4 逐跳报价：V2 本地算，V3 调 QuoterV2</h3>
${code('GO', `
package quote

import (
	"context"
	_ "embed"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"

	"example.com/aggsvc/amm"
	"example.com/aggsvc/graph"
)

// IQuoterV2 的 ABI 文件（从 Uniswap v3-periphery 编译产物导出），编译时嵌入二进制
//
//go:embed abi/IQuoterV2.json
var quoterABIJSON string

var quoterABI = mustABI(quoterABIJSON) // mustABI：abi.JSON(strings.NewReader(s))，出错直接 panic（启动即失败）

// 字段名与 ABI 组件名一一对应（首字母大写）；uint24、uint160 在 go-ethereum 里映射为 *big.Int
type quoteParams struct {
	TokenIn           common.Address
	TokenOut          common.Address
	AmountIn          *big.Int
	Fee               *big.Int
	SqrtPriceLimitX96 *big.Int
}

const gasV2Hop = 60_000 // 每个 V2 跳的 Gas（示例，用分叉测试校准）

type PathQuoter struct {
	ec     *ethclient.Client
	quoter common.Address // QuoterV2 地址，以 Uniswap 官方部署文档为准
}

// Quote 沿路径逐跳计算；所有 eth_call 固定在快照区块号，保证整条路线看到同一个状态
func (q *PathQuoter) Quote(ctx context.Context, s *graph.Snapshot, p graph.Path, amountIn *big.Int) (*big.Int, uint64, error) {
	amt, gas := amountIn, uint64(0)
	for _, h := range p {
		pool := s.Pools[h.Pool]
		switch h.Kind {
		case graph.KindV2:
			rIn, rOut := amm.Reserves(pool.Token0, h.TokenIn, pool.Reserve0, pool.Reserve1)
			amt = amm.GetAmountOut(amt, rIn, rOut, int64(pool.FeePpm/100)) // 3000 ppm = 30 bps
			gas += gasV2Hop
		case graph.KindV3:
			data, err := quoterABI.Pack("quoteExactInputSingle", quoteParams{
				TokenIn: h.TokenIn, TokenOut: h.TokenOut, AmountIn: amt,
				Fee: big.NewInt(int64(h.FeePpm)), SqrtPriceLimitX96: new(big.Int), // 0 = 不设价格限制
			})
			if err != nil {
				return nil, 0, err
			}
			// QuoterV2 不是 view 函数，但用 eth_call 调用不会上链
			raw, err := q.ec.CallContract(ctx, ethereum.CallMsg{To: &q.quoter, Data: data}, new(big.Int).SetUint64(s.Block))
			if err != nil {
				return nil, 0, err // 池子流动性不足时 QuoterV2 会 revert
			}
			out, err := quoterABI.Unpack("quoteExactInputSingle", raw)
			if err != nil {
				return nil, 0, err
			}
			amt = out[0].(*big.Int)
			gas += out[3].(*big.Int).Uint64() // QuoterV2 自带的 gasEstimate
		}
		if amt.Sign() == 0 {
			return nil, 0, ErrNoLiquidity
		}
	}
	return amt, gas, nil
}
`)}
${call('info', `<p>也可以用 abigen 从 ABI 生成类型安全的绑定代码，代替手写 Pack/Unpack。纯 V3 的多跳路径也可以改用 <code>quoteExactInput(bytes path, uint256 amountIn)</code> 一次报完；混合 V2/V3 的路径只能逐跳。</p>`)}

<h3>8.5 拆单：N 份贪心分配</h3>
<p>把输入切成 N 份（示例 N = 10），每一份交给“再多加这一份、输出增加最多”的路线。恒定乘积曲线的输出是<strong>凹函数</strong>（每多投一份，多得到的越来越少），这时逐份贪心在 N 份网格上就是最优分配。前提是参与拆单的路线<strong>不共享池子</strong>，否则一条路线会改变另一条的价格。</p>
${code('GO', `
package quote

// OutTable[i][k] = 路线 i 分到 k 份时的输出，k = 0..N，OutTable[i][0] = 0。
// V2 路线本地算；V3 路线要批量报 N 个金额点（Multicall3 一次打包，固定区块号）
type OutTable [][]*big.Int

// GreedySplit 返回每条路线分到的份数，总和等于 n
func GreedySplit(t OutTable, n int) []int {
	k := make([]int, len(t))
	gain := new(big.Int)
	for c := 0; c < n; c++ {
		best, bestGain := -1, new(big.Int).SetInt64(-1)
		for i := range t {
			if k[i] >= n {
				continue
			}
			gain.Sub(t[i][k[i]+1], t[i][k[i]]) // 边际输出：多给这一份能多拿多少
			if gain.Cmp(bestGain) > 0 {
				best, bestGain = i, new(big.Int).Set(gain)
			}
		}
		if best < 0 || bestGain.Sign() <= 0 {
			break // 再加份额也不增加输出：剩余份额只能说明流动性耗尽
		}
		k[best]++
	}
	return k
}

// pickDisjoint 从按单路线输出排好序的路径里，挑出最多 m 条互不共享池子的路线
func pickDisjoint(paths []graph.Path, m int) []graph.Path {
	used := map[common.Address]bool{}
	var res []graph.Path
	for _, p := range paths {
		ok := true
		for _, h := range p {
			if used[h.Pool] {
				ok = false
				break
			}
		}
		if !ok {
			continue
		}
		for _, h := range p {
			used[h.Pool] = true
		}
		if res = append(res, p); len(res) == m {
			break
		}
	}
	return res
}
`)}

<h3>8.6 扣除 Gas 的净输出与方案选择</h3>
${code('GO', `
package quote

const (
	gasBase       = 21_000 // 交易基础 Gas
	gasRouterBase = 30_000 // 路由合约固定开销（示例）
)

type Plan struct {
	Routes    []graph.Route
	AmountOut *big.Int
	Gas       uint64
	GasCost   *big.Int // 折算成 tokenOut 的链上整数
	Net       *big.Int
}

// gasCostInOut 把 Gas 成本折算成 tokenOut：gasWei × (tokenOut 储备 ÷ WETH 储备)。
// 用快照里“WETH/tokenOut 流动性最深的 V2 池”的中间价；两边都是链上整数，精度自动对齐
func gasCostInOut(s *graph.Snapshot, gasUnits uint64, gasPrice *big.Int, weth, tokenOut common.Address) *big.Int {
	wei := new(big.Int).Mul(new(big.Int).SetUint64(gasUnits), gasPrice)
	if tokenOut == weth {
		return wei
	}
	p := s.DeepestV2(weth, tokenOut)
	if p == nil {
		return wei.SetInt64(0) // 找不到价格：不扣 Gas，并打点 gas_price_missing_total
	}
	rWeth, rOut := amm.Reserves(p.Token0, weth, p.Reserve0, p.Reserve1)
	wei.Mul(wei, rOut)
	return wei.Quo(wei, rWeth)
}

func finalize(s *graph.Snapshot, routes []graph.Route, gasPrice *big.Int, weth, out common.Address) Plan {
	sum, gas := new(big.Int), uint64(gasBase+gasRouterBase)
	for _, r := range routes {
		sum.Add(sum, r.AmountOut)
		gas += r.Gas
	}
	cost := gasCostInOut(s, gas, gasPrice, weth, out)
	return Plan{Routes: routes, AmountOut: sum, Gas: gas, GasCost: cost, Net: new(big.Int).Sub(sum, cost)}
}

// choose：拆单方案只有在净输出更大时才被采用。这一行保证了性质测试里的不等式
func choose(single, split Plan) Plan {
	if split.Net.Cmp(single.Net) > 0 {
		return split
	}
	return single
}
`)}
<h3>算一算：拆单是否值得多付 Gas（示例）</h3>
<p>两个 USDC/WETH 的 V2 池：P1 储备 2,000,000 USDC / 1,000 WETH，P2 储备 1,000,000 USDC / 500 WETH（同价，P1 深一倍）。输入 100,000 USDC，N = 10，每份 10,000 USDC。Gas 价格 20 gwei，每个 V2 跳 60,000 Gas（示例）。</p>
${steps([
  '只走 P1：输出 47,482,973,758,155,927,037 wei（约 47.4830 WETH）。只走 P2 更少：约 45.3305 WETH。',
  '贪心逐份分配：前几份都给 P1；当 P1 的边际输出低于 P2 时开始给 P2。最终 P1 得 7 份、P2 得 3 份。理论最优是按储备比例 2:1（约 6.67 : 3.33），网格上最接近的就是 7 : 3。',
  '拆单输出：P1 输入 70,000 USDC 得 33.718397 WETH，P2 输入 30,000 USDC 得 14.520686 WETH，合计 48,239,082,825,865,122,596 wei（约 48.2391 WETH）。',
  'Gas：单路线 21,000 + 30,000 + 60,000 = 111,000，成本 0.00222 WETH；拆单 171,000，成本 0.00342 WETH。tokenOut 就是 WETH，不用折算。',
  '净输出：单路线 47.4830 − 0.00222 ≈ 47.4808 WETH；拆单 48.2391 − 0.00342 ≈ 48.2357 WETH。拆单多得约 0.755 WETH，远大于多出的 0.0012 WETH Gas，选择拆单。',
  '如果输入只有 1,000 USDC，拆单多得的输出不到多出的 Gas，choose 会返回单路线。'
])}

<h3>8.7 路由合约与 calldata 构造</h3>
<p>为了把“白名单”和“minOut 检查”讲清楚，本项目自己定义一个最小路由合约 MiniRouter。它从用户拉取 tokenIn，按路线逐跳兑换，最后检查接收者实际收到的 tokenOut ≥ minOut。生产环境应换成经过审计的路由合约。</p>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112, uint112, uint32);
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}
interface IUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)
        external returns (int256 amount0, int256 amount1);
}

/// 最小路由：无管理员、无存款、不持有余额；只在一笔交易内转手代币
contract MiniRouter {
    using SafeERC20 for IERC20;

    struct Hop { address pool; uint8 kind; uint16 feeBps; }   // kind：1 = V2，2 = V3
    struct Route { uint256 amountIn; Hop[] hops; }

    uint160 internal constant MIN_SQRT_RATIO = 4295128739;    // 取自 v3-core TickMath
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;

    address private activePool;                                // V3 回调校验：只接受正在调用的池子

    error Expired();
    error TooLittleReceived(uint256 got, uint256 minOut);
    error BadCallback();
    error PartialFill(uint256 used, uint256 amt);

    function swap(address tokenIn, address tokenOut, Route[] calldata routes, uint256 minOut, address recipient, uint256 deadline)
        external returns (uint256 amountOut)
    {
        if (block.timestamp > deadline) revert Expired();
        uint256 before = IERC20(tokenOut).balanceOf(recipient);
        for (uint256 i; i < routes.length; ++i) {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), routes[i].amountIn);
            _route(tokenIn, routes[i], recipient);
        }
        amountOut = IERC20(tokenOut).balanceOf(recipient) - before;   // 以实际到账为准
        if (amountOut < minOut) revert TooLittleReceived(amountOut, minOut);
    }

    function _route(address tok, Route calldata r, address recipient) private {
        uint256 amt = r.amountIn;
        for (uint256 j; j < r.hops.length; ++j) {
            Hop calldata h = r.hops[j];
            address to = j + 1 == r.hops.length ? recipient : address(this);
            (amt, tok) = h.kind == 1 ? _v2(h, tok, amt, to) : _v3(h, tok, amt, to);
        }
    }

    function _v2(Hop calldata h, address tok, uint256 amt, address to) private returns (uint256 out, address next) {
        IUniswapV2Pair p = IUniswapV2Pair(h.pool);
        bool zf = p.token0() == tok;
        next = zf ? p.token1() : p.token0();
        IERC20(tok).safeTransfer(h.pool, amt);
        (uint112 r0, uint112 r1,) = p.getReserves();
        (uint256 rIn, uint256 rOut) = zf ? (uint256(r0), uint256(r1)) : (uint256(r1), uint256(r0));
        uint256 inWithFee = amt * (10000 - h.feeBps);
        out = inWithFee * rOut / (rIn * 10000 + inWithFee);
        p.swap(zf ? 0 : out, zf ? out : 0, to, "");
    }

    function _v3(Hop calldata h, address tok, uint256 amt, address to) private returns (uint256 out, address next) {
        IUniswapV3Pool p = IUniswapV3Pool(h.pool);
        bool zf = p.token0() == tok;
        next = zf ? p.token1() : p.token0();
        activePool = h.pool;
        (int256 a0, int256 a1) = p.swap(to, zf, int256(amt), zf ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1, abi.encode(tok));
        activePool = address(0);
        uint256 used = uint256(zf ? a0 : a1);                   // 池子实际收走的输入
        if (used != amt) revert PartialFill(used, amt);          // 到价格上限前流动性耗尽会部分成交：整笔回滚，不留残余
        out = uint256(-(zf ? a1 : a0));
    }

    function uniswapV3SwapCallback(int256 d0, int256 d1, bytes calldata data) external {
        if (msg.sender != activePool) revert BadCallback();       // 防止任意合约冒充池子来拿钱
        address tok = abi.decode(data, (address));
        IERC20(tok).safeTransfer(msg.sender, uint256(d0 > 0 ? d0 : d1));
    }
}
`)}
${call('warn', `<p>MiniRouter 是教学用的最小实现：它假设代币是标准 ERC-20（不收转账税、不变基），所以服务端用 tokens 表的 transfer_flag 把非标准代币排除在外。V2、V3 池的地址都由调用者传入，合约本身不校验池子真伪；保护用户的是最后一行“实际到账 ≥ minOut”，以及前端只对白名单 to 签名。“不持有余额”靠两点保证：每条路线的输入在同一笔交易里全部转给池子；V3 池在价格上限前流动性耗尽只会部分成交，所以 <code>_v3</code> 校验池子实际收走的数量等于 <code>amt</code>，否则 <code>PartialFill</code> 整笔回滚（也可以改成把剩余退给 msg.sender）。回调只认 activePool，但调用者自己传入的假“池子”成为 activePool 后，仍能通过回调动用合约里的代币，因此合约在交易之间不能有余额：误转进来的代币可能被任何人取走，不要往路由合约里直接转币。上线前必须经过审计。</p>`)}
${code('GO', `
package txbuild

// abi 结构体：字段名与 Solidity 结构体成员一一对应，uint16 映射为 uint16，uint8 映射为 uint8
type abiHop struct {
	Pool   common.Address
	Kind   uint8
	FeeBps uint16
}
type abiRoute struct {
	AmountIn *big.Int
	Hops     []abiHop
}

// routerABI 由 forge build 产出的 out/MiniRouter.sol/MiniRouter.json 中的 abi 字段加载（go:embed），此处省略
var routerABI abi.ABI

func BuildSwapCalldata(p quote.Plan, tokenIn, tokenOut, recipient common.Address, minOut *big.Int, deadline int64) ([]byte, error) {
	routes := make([]abiRoute, 0, len(p.Routes))
	for _, r := range p.Routes {
		hops := make([]abiHop, len(r.Path))
		for i, h := range r.Path {
			hops[i] = abiHop{Pool: h.Pool, Kind: uint8(h.Kind), FeeBps: uint16(h.FeePpm / 100)}
		}
		routes = append(routes, abiRoute{AmountIn: r.AmountIn, Hops: hops})
	}
	return routerABI.Pack("swap", tokenIn, tokenOut, routes, minOut, recipient, big.NewInt(deadline))
}

// MinOut = 报价输出 × (10000 − slippageBps) ÷ 10000，向下取整
func MinOut(amountOut *big.Int, slippageBps int64) *big.Int {
	v := new(big.Int).Mul(amountOut, big.NewInt(10000-slippageBps))
	return v.Quo(v, big.NewInt(10000))
}
`)}
<p>注意：V3 跳在合约里不需要 feeBps（池子自己知道费率），传 0 即可；V2 跳必须传池子真实费率，否则合约算出的 out 会让 pair.swap 因 K 值检查失败而 revert。</p>

<h3>8.8 返回前的 eth_call 模拟</h3>
${code('GO', `
package txbuild

// Simulate 以用户身份 eth_call 整笔交易，返回路由合约的 amountOut 与偏差（基点）
func (b *Builder) Simulate(ctx context.Context, from common.Address, data []byte, quoted *big.Int) (*big.Int, int64, uint64, error) {
	msg := ethereum.CallMsg{From: from, To: &b.router, Data: data}
	raw, err := b.ec.CallContract(ctx, msg, nil) // nil = latest：交易会在之后的区块执行，用最新状态最接近真实
	if err != nil {
		var de rpc.DataError
		if errors.As(err, &de) {
			return nil, 0, 0, &SimError{Reason: decodeRevert(de.ErrorData())} // 解码 TooLittleReceived 等自定义错误
		}
		return nil, 0, 0, err
	}
	vals, err := routerABI.Unpack("swap", raw)
	if err != nil {
		return nil, 0, 0, err
	}
	got := vals[0].(*big.Int)

	// 偏差 = |got − quoted| × 10000 ÷ quoted
	diff := new(big.Int).Sub(got, quoted)
	diff.Abs(diff).Mul(diff, big.NewInt(10000)).Quo(diff, quoted)

	gas, err := b.ec.EstimateGas(ctx, msg)
	if err != nil {
		return nil, 0, 0, err
	}
	return got, diff.Int64(), gas * 12 / 10, nil // Gas 上限加 20% 余量（示例）
}
`)}
<p>/swap-tx 的处理顺序：取回 quote → 超过 2 个区块（示例）就重新路由 → 检查 tokens 白名单 → 读 <code>allowance(from, router)</code> 和余额（不足返回 NEEDS_APPROVAL / INSUFFICIENT_BALANCE）→ 计算 minOut 和 deadline → 编码 calldata → Simulate → 偏差 &gt; 10 bps（示例）返回 QUOTE_DRIFT → 回填 quotes.sim_out → 返回 to、data、gas。</p>

<h3>8.9 每区块缓存与请求合并</h3>
${code('GO', `
package quote

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"golang.org/x/sync/singleflight"
)

const maxLag = 36 * time.Second         // 3 个区块（示例，12 秒出块）
const computeTimeout = 2 * time.Second // 一次合并计算的独立超时（示例）

type Engine struct {
	snap  atomic.Pointer[graph.Snapshot] // 索引器调用 snap.Store(next) 发布新快照
	sf    singleflight.Group
	mu    sync.Mutex
	owner *graph.Snapshot // 缓存属于哪一份快照：指针相同 = 同一区块、同一哈希
	cache map[string]*Plan
}

func (e *Engine) Quote(ctx context.Context, r Req) (*Plan, uint64, error) {
	s := e.snap.Load()
	if time.Since(s.SeenAt) > maxLag {
		return nil, 0, ErrStaleState // 宁可不报，也不用旧状态报
	}
	key := fmt.Sprintf("%s:%s:%s:%d:%d", r.TokenIn.Hex(), r.TokenOut.Hex(), r.AmountIn.String(), r.MaxHops, r.MaxSplits)

	e.mu.Lock()
	// 快照更新：整个缓存作废。只有当前快照能替换缓存，拿着旧快照的慢请求不会把缓存重置回旧区块
	if e.owner != s && s == e.snap.Load() {
		e.owner, e.cache = s, map[string]*Plan{}
	}
	if p, ok := e.cache[key]; ok && e.owner == s {
		e.mu.Unlock()
		cacheHits.Inc()
		return p, s.Block, nil
	}
	e.mu.Unlock()

	// 同一快照（按区块哈希区分，重组后同号不同哈希不会混用）、同一参数的并发请求只算一次
	v, err, _ := e.sf.Do(s.Hash.Hex()+":"+key, func() (any, error) {
		// 不用首个请求的 ctx：它一取消或超时，合并进来的其他请求会一起失败
		cctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), computeTimeout)
		defer cancel()
		return e.compute(cctx, s, r) // FindPaths → 单路线报价 → pickDisjoint → OutTable → GreedySplit → choose
	})
	if err != nil {
		return nil, 0, err
	}
	p := v.(*Plan)
	e.mu.Lock()
	if e.owner == s { // 算完时快照已更新，结果只返回给本次请求，不写进新快照的缓存
		e.cache[key] = p
	}
	e.mu.Unlock()
	return p, s.Block, nil
}
`)}
<p>两处细节：缓存与快照指针绑定，而不是只比区块号。如果写成“区块号不同就重置”，持旧快照的慢请求会把缓存重置回旧区块、清掉新区块的结果，造成抖动；重组后同号不同哈希的快照也会混用。请求合并的闭包用 <code>context.WithoutCancel</code> 加独立超时，避免第一个请求取消时连累合并进来的请求；如果还要让每个调用方能各自提前放弃，可以改用 <code>sf.DoChan</code> 并在外面 select 自己的 ctx。</p>
${call('info', `<p>为什么前端连续输入时缓存命中率不高？因为金额每次都不同。前端已经做了 300 ms 防抖（M03.10）；服务端不对金额“取整分桶”，否则返回的数字会和用户输入对不上。真正受益的是同一金额的重复请求，例如 WebSocket 价格流和多个用户同时报同一个热门对。</p>`)}

<h2>9. 测试策略</h2>
${tbl(['层级', '工具', '用例清单（节选）'], [
  ['单元：数学', 'go test', 'GetAmountOut 对照上篇两跳例子的精确值；边界：输入 0、储备 0、uint112 最大储备；MinOut 在 0 与 10,000 bps'],
  ['单元：路由', 'go test', 'FindPaths 不产生环、跳数 ≤ 3、中间只出现枢纽币；pickDisjoint 不共享池子；GreedySplit 份数和为 N'],
  ['性质测试', 'Go 原生 fuzz（go test -fuzz）', '任意储备与金额下：choose 返回的 Net ≥ 最优单路线 Net；拆单总输出 ≥ 最优单路线输出（Gas 前）；GreedySplit 的结果不劣于任何两条路线的其他整数分配'],
  ['索引器', 'go test + 假 RPC', '构造分叉链：在第 N 块替换哈希，验证 findAncestor 返回 N−1、pool_state 中 &gt; N−1 的行被删除、快照回到祖先'],
  ['分叉测试', 'anvil 主网分叉 + go test -tags fork', '固定分叉区块；部署 MiniRouter；对 20 个代币对（示例）比较 /quote 与模拟结果偏差 ≤ 1 bp；V3 路线与 QuoterV2 完全一致'],
  ['故障注入', 'toxiproxy 在服务与 RPC 之间', 'RPC 延迟 2 秒：快照停止推进，超过 maxLag 后 /quote 返回 STALE_STATE；RPC 断开再恢复：索引器追平且无重复写入'],
  ['压测', 'k6', '热门 10 个对 + 随机金额，500 RPS 下 P95 达标；观察 GC 停顿与 big.Int 分配']
])}
${code('GO', `
package amm

import (
	"math/big"
	"testing"
)

func n(s string) *big.Int { v, ok := new(big.Int).SetString(s, 10); if !ok { panic(s) }; return v }

// 上篇第 4 节的两跳例子：10,000 USDC → WETH → DAI，两个池子都是 0.3%
func TestTwoHopExact(t *testing.T) {
	hop1 := GetAmountOut(n("10000000000"), n("2000000000000"), n("1000000000000000000000"), 30)
	if hop1.String() != "4960273038901078125" {
		t.Fatalf("hop1 = %s", hop1)
	}
	hop2 := GetAmountOut(hop1, n("500000000000000000000"), n("1000000000000000000000000"), 30)
	if hop2.String() != "9793914938096564347345" {
		t.Fatalf("hop2 = %s", hop2)
	}
}

func TestSmall(t *testing.T) {
	// 1000 × 9970 × 10^6 ÷ (10^6 × 10000 + 1000 × 9970) = 996.0（向下取整）
	if got := GetAmountOut(big.NewInt(1000), big.NewInt(1_000_000), big.NewInt(1_000_000), 30); got.Int64() != 996 {
		t.Fatalf("got %d", got.Int64())
	}
}

// 性质：拆单方案的净输出永远不低于最优单路线（choose 的保证），任意储备与金额
func FuzzSplitNotWorse(f *testing.F) {
	f.Add(uint64(2_000_000), uint64(1_000), uint64(1_000_000), uint64(500), uint64(100_000))
	f.Fuzz(func(t *testing.T, a0, a1, b0, b1, in uint64) {
		if a0 == 0 || a1 == 0 || b0 == 0 || b1 == 0 || in == 0 {
			t.Skip()
		}
		single, split := planBoth(a0, a1, b0, b1, in) // 测试辅助：构造两条 V2 路线并调用 GreedySplit + finalize + choose
		if chosen := choose(single, split); chosen.Net.Cmp(single.Net) < 0 {
			t.Fatalf("chosen net %s < single net %s", chosen.Net, single.Net)
		}
	})
}
`)}
<p>（FuzzSplitNotWorse 需要访问 quote 包的 choose，实际放在 quote 包的测试文件里；为了阅读方便与数学测试写在一起。）</p>
${code('BASH', `
# 分叉测试：固定区块，保证每次运行结果可复现
anvil --fork-url "$MAINNET_RPC" --fork-block-number 21000000 --port 8545 &
forge create src/MiniRouter.sol:MiniRouter --rpc-url http://127.0.0.1:8545 --private-key "$ANVIL_TEST_KEY" --broadcast
# 用 anvil 的测试账户准备 USDC：anvil_impersonateAccount 一个持币地址并转账，然后 approve 给 MiniRouter
ROUTER=部署地址 RPC_URL=http://127.0.0.1:8545 go test -tags fork ./e2e/... -run TestQuoteMatchesSimulation -v
`)}
${steps([
  'FORK-1：USDC → WETH 单跳 V2，/quote 与 /swap-tx 模拟结果逐位相等（同一区块，偏差 0）。',
  'FORK-2：USDC → WETH 走 V3 0.05% 池，服务报价与直接调用 QuoterV2 的结果逐位相等。',
  'FORK-3：10 万 USDC → DAI，返回 2 条以上路线；模拟输出 ≥ 单路线模拟输出 − 多出的 Gas 折算。',
  'FORK-4：报价后用 anvil 插入一笔大额交易推动价格，再调 /swap-tx：返回 requoted = true 或 QUOTE_DRIFT。',
  'FORK-5：allowance 为 0 时 /swap-tx 返回 409 NEEDS_APPROVAL，spender = MiniRouter。',
  'FORK-6：用 anvil_mine 推进区块、evm_snapshot / evm_revert 制造重组，索引器回滚到祖先并重新追平。'
])}
${tryit(`<p>在本地跑通“报价 = 模拟”这条核心不变量：</p>
<ol><li>按上面的 BASH 启动 anvil 分叉并部署 MiniRouter。</li>
<li>写一个最小 Go 程序：用 ethclient 读 USDC/WETH V2 交易对的 getReserves，用 8.2 节的 GetAmountOut 算 1,000 USDC 的输出。</li>
<li>用 8.7 节的 BuildSwapCalldata 构造单路线单跳的交易（minOut 设为算出的值），再用 8.8 节的 Simulate 以持币地址的身份 eth_call。</li>
<li>预期结果：模拟输出与本地计算逐位相等，偏差 0 bp。把 minOut 加 1 再模拟，预期 revert 并解码出 TooLittleReceived。</li></ol>`)}

<h2>10. 部署与运维</h2>
${tbl(['环境', '链', '用途', '部署方式'], [
  ['local', 'anvil 主网分叉', '开发、分叉测试', 'docker-compose：anvil + postgres + aggsvc'],
  ['staging', 'Sepolia 或主网分叉常驻实例', '前端预览环境联调', 'K8s 单副本，独立 API Key'],
  ['production', '以太坊主网', '正式', 'K8s 3 副本（示例）+ HPA；索引器每个副本各自运行，或单独部署并通过快照服务共享']
])}
${steps([
  'CI：go vet → golangci-lint → go test（含 fuzz 种子用例）→ forge test（MiniRouter）→ anvil 分叉测试 → 构建镜像并签名。',
  '配置：链 ID、RPC 网关地址、QuoterV2 地址、MiniRouter 地址、工厂白名单、枢纽币列表都写进版本化配置文件；地址变更走代码评审。',
  '密钥：本服务只有两类密钥：数据库密码和 RPC 网关的访问凭证，放 K8s Secret 或密钥管理服务。服务<strong>没有任何链上私钥</strong>。',
  '启动：先从 pool_state 加载最近状态建快照，再从 blocks 表游标继续追块；追平前 /healthz 返回未就绪，不接流量。',
  '发布：滚动发布；新副本追平链头后才加入负载均衡。回滚：上一版本镜像 + 同一数据库（表结构变更必须向后兼容）。'
])}
${tbl(['指标（示例）', '含义', '告警阈值（示例）'], [
  ['<code>indexer_head_lag_blocks</code>', '链头区块号 − 快照区块号', '&gt; 1 持续 1 分钟告警；&gt; 3 立即 P1'],
  ['<code>indexer_reorg_total</code> / <code>indexer_reorg_depth</code>', '重组次数与深度', '深度 ≥ 3 告警；ErrDeepReorg 出现即 P1'],
  ['<code>quote_latency_seconds</code>{cache}', '报价耗时直方图，按命中与否分开', '未命中 P95 &gt; 0.3 s 持续 10 分钟'],
  ['<code>quote_errors_total</code>{code}', '按错误码计数', 'NO_ROUTE 之外的错误率 &gt; 2%'],
  ['<code>quote_sim_deviation_bps</code>', '/swap-tx 模拟输出与报价的偏差分布', 'P99 &gt; 10 bps 持续 15 分钟'],
  ['<code>swap_tx_sim_failed_total</code>{reason}', '模拟失败原因', '任一 reason 1 小时内突增 5 倍'],
  ['<code>quoter_v2_calls_total</code> / <code>rpc_request_seconds</code>', 'V3 报价调用量与 RPC 耗时', 'RPC P95 &gt; 0.2 s；单次报价 V3 调用 &gt; 50 次'],
  ['<code>quote_cache_hit_ratio</code>', '缓存命中率', '低于基线 50% 时排查（可能是攻击性随机金额）'],
  ['<code>split_routes_used</code>', '每个方案使用的路线数分布', '仅观察，用于评估拆单收益']
])}
${mm('报价链路的观测点', `
flowchart LR
  A["RPC 网关"] -->|"head lag"| B["索引器"]
  B -->|"reorg depth"| C["快照"]
  C --> D["报价引擎"]
  D -->|"latency · cache hit"| E["报价接口 quote"]
  E --> F["交易接口 swap-tx"]
  F -->|"sim deviation"| G["前端"]
  class C key
  class F risk
`, [
  ['flow', '指标沿数据流从左到右分布：先看索引器是否落后，再看报价是否慢，最后看模拟是否和报价一致。'],
  ['fail', 'sim deviation 突然变大，而 head lag 正常，通常说明某个池子的状态解码出错，或新接入的池子类型不是标准 V2。'],
  ['key', 'head lag 是第一优先级指标：它一旦超标，后面所有数字都不可信。']
])}

<h2>11. 安全清单与威胁模型</h2>
${tbl(['威胁', '入口', '防护', '验证'], [
  ['报价过期导致用户少拿钱', '快照落后、用户停留过久', '报价绑定区块；超过 2 个区块重新路由；maxLag 熔断；minOut 写进交易', 'FORK-4；head lag 告警演练'],
  ['恶意或非标准代币', '收税、变基、黑名单、假冒符号代币', '只报价 verified 代币；transfer_flag 非 standard 的不参与路由；按地址不按符号识别', '单元测试：未审核代币返回 TOKEN_NOT_ALLOWED'],
  ['假池子污染报价', '任何人都能部署合约并发出 Sync 事件', '只收录白名单工厂创建的池子；索引器忽略未收录地址的日志', '分叉测试：部署假池发事件，快照不变'],
  ['返回的交易目标被篡改', '服务被攻破或配置被改', '服务只输出配置中的 MiniRouter；前端独立硬编码白名单并校验 to；配置变更需评审', '前端单测：非白名单 to 被拒绝'],
  ['私钥泄露', '服务器被入侵', '本服务不持有任何签名私钥；部署测试网合约的密钥只在 CI 的测试环境中', '代码与配置扫描：仓库中无私钥'],
  ['滥用与拒绝服务', '大量随机金额请求击穿缓存、放大 V3 eth_call', '按 IP 和 API Key 令牌桶限流；单次报价 V3 调用上限；maxHops ≤ 3、maxSplits ≤ 3', 'k6 压测超限请求返回 429'],
  ['RPC 返回错误数据', '单一节点故障或被篡改', '走 M04.8 网关的多节点；关键路径（/swap-tx）以整笔模拟为准；可选多节点交叉比对', '故障注入：某节点返回错误储备时偏差告警触发'],
  ['V3 回调被冒充', '任意合约调用 uniswapV3SwapCallback', 'MiniRouter 只接受 activePool 的回调；V3 部分成交即回滚，合约在交易之间不留余额', 'forge 测试：外部调用回调 revert BadCallback']
])}
${call('warn', `<p>不要把“构造交易”升级成“代用户发交易”。一旦服务持有签名私钥，它就从“算错了用户少拿一点”变成“被攻破了用户资产全部丢失”。需要代付 Gas 或批量执行时，改用账户抽象或意图模式（见 <a href="#m04-74">M10.4</a>），签名仍然由用户完成。</p>`)}

${mm('聚合器后端的交付顺序：先数据，后路由', `
flowchart LR
  W1["第 1 周<br/>骨架、DDL 与 V2 数学"]
  W2["第 2 周<br/>索引器与重组回滚"]
  W3["第 3 周<br/>路径搜索、V3 报价与 /quote"]
  W4["第 4 周<br/>拆单、Gas 折算与缓存"]
  W5["第 5 周<br/>MiniRouter、/swap-tx 与分叉测试"]
  W6["第 6 周<br/>监控、故障演练与前端联调"]
  W1 --> W2 --> W3 --> W4 --> W5 --> W6
  class W1 key
  class W6 ok
`, [
  ['flow', '报价的正确性建立在快照之上，所以第 2 周先把索引器和重组做对；路由、拆单都依赖它。'],
  ['key', '每周结束都要有可演示的交付物：第 1 周是两跳例子的精确测试通过，第 5 周是“报价 = 模拟”在分叉上成立。'],
  ['limit', '6 周是单人或小团队的示例节奏，实际以团队规模和验收标准调整。']
])}
<h2>12. 里程碑计划（6 周）</h2>
${tbl(['周', '目标', '交付物'], [
  ['第 1 周', '骨架与数学', 'Go 模块结构（cmd/、indexer/、graph/、quote/、txbuild/、httpapi/）；docker-compose；DDL 迁移；GetAmountOut 与 MinOut 精确值测试'],
  ['第 2 周', '索引器', '池子发现（白名单工厂）；按区块哈希取日志；快照复制与发布；重组回滚与 DeleteAfter；假 RPC 的重组测试'],
  ['第 3 周', '路径与报价', 'FindPaths（枢纽币、≤ 3 跳）；PathQuoter（V2 本地 + QuoterV2）；GET /v1/quote 与错误码；quotes 表落库'],
  ['第 4 周', '拆单与性能', 'pickDisjoint、OutTable（V3 批量报价）、GreedySplit、Gas 折算、choose；每区块缓存 + singleflight；fuzz 性质测试；k6 基线'],
  ['第 5 周', '交易构造', 'MiniRouter + forge 测试；BuildSwapCalldata；allowance 与余额检查；Simulate 与偏差判定；POST /v1/swap-tx；FORK-1 至 FORK-6'],
  ['第 6 周', '上线准备', 'Prometheus 指标与 Grafana 看板、告警规则；toxiproxy 故障演练记录；限流；与 M03.10 前端联调（/api/quote 改为代理本服务）；README 与架构文档']
])}

<h2>13. 扩展方向与面试/作品集要点</h2>
${tbl(['扩展方向', '涉及知识'], [
  ['更多曲线：Curve 稳定池、Balancer 加权池', '各自的不变量与报价函数；同样可选“本地实现”或“链上模拟”'],
  ['Uniswap V4 池', '单例合约 + hooks；hook 可能改变兑换结果，必须模拟（<a href="#m04-73">M10.3 Uniswap V4</a>）'],
  ['更优拆单', '凸优化或边际价格相等的解析解；共享池子的路线联合模拟'],
  ['MEV 保护', '私有交易通道、动态滑点（<a href="#m05-7">M04.7 MEV</a>）'],
  ['意图与 Solver', '把本服务改造成 Solver：对用户签名的意图报价竞标（<a href="#m04-74">M10.4</a>）'],
  ['本地 V3 数学', '用 tick 位图和流动性快照本地报价，消除 QuoterV2 的 RPC 往返；必须用分叉测试逐位对齐']
])}
${steps([
  '<strong>讲清一个取舍</strong>：为什么 V3 用 QuoterV2 而不是本地数学？答：正确性优先，用一次 RPC 往返换与链上一致；性能瓶颈出现后再本地化，并用分叉测试逐位对齐。',
  '<strong>讲清一个不变量</strong>：“同一区块上报价 = 模拟”。展示分叉测试和 quote_sim_deviation_bps 看板。',
  '<strong>讲清一次故障</strong>：RPC 延迟 2 秒时发生了什么？答：快照停止推进 → maxLag 熔断 → /quote 返回 STALE_STATE → 恢复后追平，没有用旧状态报价。',
  '<strong>给出数字</strong>：两跳例子的精确输出、拆单 7 : 3 多得 0.755 WETH、P95 延迟、缓存命中率。',
  '<strong>作品集材料</strong>：仓库 README（架构图、状态机）、一键分叉测试脚本、Grafana 截图、与 M03.10 前端联调的录屏。'
])}

${mistakes([
  ['路由服务越聪明越好，可以顺便帮用户签名发交易。', '服务只构造与模拟交易，签名在用户钱包。持有私钥会把计算错误升级为资产被盗。'],
  ['按区块号取日志就够了。', '重组时同一高度会有两个区块。按区块哈希取日志，并校验 parentHash，才能保证快照来自同一条链。'],
  ['拆单一定比单路线好。', '每多一条路线就多付一段 Gas。小额交易拆单的额外输出常常不够付 Gas，要比较扣除 Gas 后的净输出。'],
  ['报价算对了，交易就一定成功。', '交易在之后的区块执行，状态可能已变化。必须写入 minOut、设置 deadline，并在返回前做整笔 eth_call 模拟。'],
  ['链上发出 Sync 事件的合约都是池子。', '任何人都能部署合约发同名事件。只收录白名单工厂创建的池子，忽略其他地址的日志。']
])}
${recap([
  '索引器按区块哈希取 Sync / V3 Swap / Mint / Burn 日志，复制并发布不可变快照；重组时切回共同祖先的快照并删除数据库中更新的行。',
  'V2 用 big.Int 本地复刻 getAmountOut，结果与链上逐位相等；V3 每跳用 eth_call 调 QuoterV2，区块号固定为快照区块。',
  '路径搜索限制 ≤ 3 跳、中间只走枢纽币；拆单在互不共享池子的路线间按 N 份贪心分配，凹函数下网格最优。',
  '方案按扣除 Gas 后的净输出选择，choose 保证净输出不低于最优单路线。',
  '/swap-tx：检查授权与余额 → 编码 MiniRouter calldata（含 minOut、deadline）→ 以用户身份 eth_call 模拟 → 偏差超限拒绝。',
  '测试有精确值单元测试、fuzz 性质测试、anvil 分叉测试和 RPC 延迟故障注入；head lag 是第一优先级告警。'
])}
${quiz([
  { q: '索引器取日志时用 FilterQuery 的 BlockHash 而不是区块号范围，主要原因是？', o: ['按哈希查询更快', '重组时同一高度可能有不同区块，按哈希能保证日志属于本次处理的那个区块', 'RPC 节点不支持按区块号查询', '为了节省数据库空间'], a: 1, why: '同一高度在重组前后对应不同区块。按哈希取日志与 parentHash 校验配合，快照才来自同一条链。速度、节点支持和数据库空间都不是原因。' },
  { q: '用 V2 公式计算：输入 1,000，储备 1,000,000 / 1,000,000，手续费 0.3%，链上结果是？', o: ['999', '997', '1,000', '996'], a: 3, why: '1,000 × 997 × 1,000,000 ÷ (1,000,000 × 1,000 + 997,000) = 996.006…，整数除法向下取整得 996。997 是只扣手续费、忽略价格冲击的结果。' },
  { q: '拆单只在互不共享池子的路线之间进行，原因是？', o: ['共享池子的路线会互相改变价格，单独计算的输出表不再成立', '合约不允许同一池子出现两次', 'Gas 会翻倍', 'QuoterV2 不支持'], a: 0, why: 'OutTable 假设每条路线的输出只取决于自己的份额。共享池子时，一条路线的成交会改变另一条的储备，贪心结果就不可信。' },
  { q: '输入 1,000 USDC 时，拆单比单路线多得 0.0005 WETH，但多出 0.0012 WETH 的 Gas。choose 应返回？', o: ['拆单方案，因为总输出更大', '两个都返回让用户选', '单路线方案，因为扣除 Gas 后净输出更大', '返回 NO_ROUTE'], a: 2, why: 'choose 比较的是 Net = 输出 − Gas 折算。拆单净输出少 0.0007 WETH，所以返回单路线。' },
  { q: '下列哪一项不是本服务的安全防线？', o: ['前端校验 to 在硬编码白名单中', '服务器上保存一把热钱包私钥用于加速交易', 'minOut 写进交易由合约检查', '只收录白名单工厂创建的池子'], a: 1, why: '本服务不持有任何私钥。保存热钱包私钥会把服务变成攻击目标。其余三项都是设计中的防线。' }
])}
${exercises([
  ['（示例）在 8.6 节的拆单例子里，把 Gas 价格改为 200 gwei，其他不变。拆单还值得吗？写出两种方案的净输出。', '<p>单路线 Gas 成本 = 111,000 × 200 × 10^9 = 0.0222 WETH，净输出约 47.4830 − 0.0222 = 47.4608 WETH。拆单 Gas 成本 = 171,000 × 200 × 10^9 = 0.0342 WETH，净输出约 48.2391 − 0.0342 = 48.2049 WETH。拆单仍多得约 0.744 WETH，仍然值得。</p>'],
  ['设计一个测试，证明索引器在 2 个区块深的重组后，快照和数据库都回到了正确状态。写出构造步骤和断言。', '<p>用假 RPC：先喂区块 100、101、102，其中 101、102 各有一条 Sync 事件改变池子 P 的储备。然后把 101、102 替换成新哈希的 101′、102′（parentHash 链接到 100），101′ 里 P 的储备不同。断言：Step 返回 reorg = true；head.Block = 100；pool_state 中 block_number &gt; 100 的行已删除；继续 Step 两次后，P 的储备等于 101′ 和 102′ 的事件值，blocks 表 101、102 的哈希是新哈希。</p>'],
  ['/swap-tx 模拟时偏差为 35 bps，超过 10 bps 的容忍度。列出两种可能原因，以及服务和前端分别怎么处理。', '<p>原因一：报价后池子在新区块被大单改变（正常市场变化）。原因二：快照落后或某个池子的状态解码错误（服务缺陷）。服务返回 QUOTE_DRIFT 并记录偏差指标；若同一池子反复出现偏差，告警并人工下架该池。前端重新调用 /quote，把新数字展示给用户再次确认。</p>']
])}
${checklist(['能写出按区块哈希取日志、校验 parentHash、切回祖先快照的索引器主循环。', '能用 big.Int 实现 GetAmountOut，并让上篇两跳例子的测试逐位通过。', '能实现 ≤ 3 跳的路径搜索、互不共享池子的路线挑选和 N 份贪心拆单。', '能把 Gas 折算成 tokenOut 并按净输出选择方案，用 fuzz 测试验证“不劣于最优单路线”。', '能构造 MiniRouter 的 calldata、以用户身份 eth_call 模拟，并按偏差和错误码给出响应。'])}
${terms([
  ['聚合器', 'DEX Aggregator', '在多个池子和 DEX 之间搜索并组合最优兑换方案的服务'],
  ['拆单', 'Order Splitting', '把一笔输入分成多份走不同路线，以降低每个池子的价格冲击'],
  ['枢纽币', 'Hub Token', '流动性最深、允许作为中间跳的代币，例如 WETH、USDC'],
  ['净输出', 'Net Output', '报价输出减去 Gas 成本折算成输出代币后的数量'],
  ['快照', 'Snapshot', '某个区块时刻的完整池子状态，生成后不再修改'],
  ['请求合并', 'Singleflight', '同一时刻相同参数的并发请求只执行一次计算，结果共享'],
  ['性质测试', 'Property-based Testing', '随机生成输入并检查不变量始终成立的测试方法'],
  ['QuoterV2', 'Uniswap V3 QuoterV2', '通过模拟兑换返回报价的合约，用 eth_call 调用']
])}
` });

})();
