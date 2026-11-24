/* ---------- M03 子文章（4/4）：★ 实战 DEX 兑换前端 ---------- */
(() => {
CUR = 'm07-10';
addCh({ id: 'm07-10', nav: '实战·设计：DEX 兑换前端', title: 'M03.10 实战·设计：DEX 兑换前端（Next.js + wagmi + viem）', desc: '项目目标、需求拆解、系统架构、技术选型、数据模型与接口设计', html: `
<h1>M03.10 实战·设计：DEX 兑换前端（Next.js + wagmi + viem）</h1>
${meta(['独立设计一个多链 DEX 兑换前端的架构、组件树、状态机和接口。', '实现报价 hook、approve/Permit2 授权、兑换、交易追踪和错误处理的关键代码。', '制定测试（anvil 分叉 E2E）、部署（Vercel/IPFS + CSP）、监控和安全清单，并按 6 周交付。'], '本模块 <a href="#m07-1">M03.1</a> 至 <a href="#m07-9">M03.9</a>、<a href="#m02-10">M08.2 AMM 深入</a>', ['units', 'eip712', 'txlife'])}
${beginner(`<p><strong>DEX（去中心化交易所）</strong>：用智能合约撮合兑换的交易所，例如 Uniswap。用户自己保管资产（原理见 <a href="#lab-amm">AMM 实验</a>）。</p>
<p><strong>报价（Quote）</strong>：在当前池子状态下，用 X 个 A 代币能换到多少个 B 代币。</p>
<p><strong>Quoter 合约</strong>：Uniswap 提供的“只算不换”合约，模拟一次兑换并返回结果。</p>
<p><strong>聚合器（Aggregator）</strong>：在多个 DEX 之间寻找最优路径的服务，例如 0x、1inch。</p>
<p><strong>滑点（Slippage）</strong>：报价与实际成交之间允许的最大偏差，用来保护用户不被坏价格成交。</p>
<p><strong>Permit2</strong>：Uniswap 的通用授权合约。用户对它 approve 一次，之后每次兑换只需要签名（见 <a href="#m07-6">M03.6</a>）。</p>`)}

<h2>一句话理解</h2>
${one('DEX 兑换前端 = 选代币 → 实时报价 → 设置滑点 → 授权 → 兑换 → 追踪 → 记录。每一步都要对金额精度、链 ID、失败分支和安全负责。')}
${call('analogy', `<p>它像机场的外币兑换柜台，只是柜员换成了合约：显示屏实时更新汇率（报价），你告诉柜员“汇率差超过 0.5% 就别换了”（滑点），你签字授权柜员从你钱包取钱（授权），换好后给你回单（回执），回单存进你的历史记录。</p>
<p>类比的局限：机场柜台的汇率几分钟才变一次。链上价格每个区块都可能变，而且有人专门盯着你的交易抢跑（MEV，见 <a href="#m05-7">M04.7</a>）。</p>`)}
${art('一图看懂：一张兑换卡片，背后是三路数据与一个由状态决定的按钮', 660, 330, [
  S.zone(10, 30, 300, 244, { t: 'SwapCard 兑换卡片', k: 'info' }),
  S.box(22, 62, 276, 48, { k: 'tint', t: '卖出 1,000 USDC', s: '余额与授权：读链上' }),
  S.box(22, 120, 276, 48, { k: 'key', t: '买入 ≈ 0.285 WETH', s: '最少收到 0.283575' }),
  S.box(22, 178, 276, 34, { k: 'tint', t: '价格影响 0.35% · 滑点 0.5%' }),
  S.box(22, 222, 276, 40, { k: 'ok', icon: 'bolt', t: '授权 USDC → 兑换', s: '按钮文案由状态派生' }),
  S.box(370, 62, 280, 48, { k: 'info', icon: 'link', t: 'RPC：余额 · 授权', s: 'wagmi + TanStack Query' }),
  S.box(370, 120, 280, 48, { k: 'info', icon: 'chart', t: 'QuoterV2：4 个费率档', s: '并行 eth_call，取最优' }),
  S.box(370, 222, 280, 40, { k: 'warn', icon: 'wallet', t: '钱包：授权与兑换签名', s: 'spender 硬编码' }),
  S.arrow(312, 86, 368, 86),
  S.arrow(312, 144, 368, 144),
  S.arrow(312, 242, 368, 242),
  S.text(330, 308, '1,000 USDC → 0.285 WETH；minOut = 0.285 × 99.5% = 0.283575（示例）', { size: 13, anchor: 'middle', mw: 640 })
], [ ['flow', '卡片上的每个数字都有来源：余额和授权读 RPC，报价来自 QuoterV2，签名交给钱包。'], ['key', '“最少收到”由最新报价和滑点算出，写进交易参数，是用户对抗价格变动的唯一保护。'], ['fail', '余额、授权、报价会随区块变化，按钮状态要由这三份数据实时派生。'], ['limit', '本项目只做精确输入、单跳为主的兑换。'] ], 'DEX 兑换卡片显示卖出 1000 USDC、买入约 0.285 WETH、价格影响和滑点，余额授权来自 RPC，报价来自 QuoterV2，签名交给钱包', 'm07-10')}

<h2>1. 项目目标与验收标准</h2>
<p>功能目标：在以太坊主网和 Base 上，用户可以连接钱包、切换网络、选择代币并看到余额、获得实时报价、设置滑点、完成授权（approve 或 Permit2）和兑换、看到交易状态并查询历史记录。</p>
${tbl(['类别', '验收标准（示例）', '如何度量'], [
  ['功能', '支持 Ethereum、Base；ETH/WETH/USDC/USDT/DAI/WBTC 等 20 个代币；精确输入（exact input）兑换', 'E2E 用例全部通过'],
  ['报价延迟', '输入停止后 P95 &lt; 800 ms 显示报价', '埋点 quote_latency_ms'],
  ['报价新鲜度', '报价超过 30 秒或新区块到来后自动刷新；提交前必须是最新报价', '代码审查 + E2E'],
  ['首屏性能', 'LCP &lt; 2.5 s（4G 中端手机）；首屏 JS &lt; 250 KB gzip', 'Lighthouse CI、bundle-analyzer'],
  ['可用性', '前端 99.9%；任一 RPC 故障时自动切换', '外部探活 + RPC 故障演练'],
  ['交易质量', '非用户原因的失败（模拟失败 + revert）&lt; 2%；revert 率 &lt; 1%', '埋点 tx_reverted_rate'],
  ['精度', '所有金额 bigint 计算；显示舍入方向正确；6/8/18 位代币测试覆盖', '单元测试 + 属性测试'],
  ['安全', '严格 CSP；默认精确授权；签名前展示人话；依赖锁版本；产物哈希公开', '安全清单逐项验收'],
  ['可访问性', '键盘可完成全部流程；状态变化有 aria-live 播报', 'axe 扫描 0 严重问题']
])}

<h2>2. 需求拆解与用户故事</h2>
${tbl(['编号', '用户故事', '验收条件'], [
  ['US-1', '作为新用户，我想用 MetaMask 或手机钱包连接，以便开始兑换', '桌面显示 EIP-6963 发现的扩展；手机显示 WalletConnect；刷新后保持连接'],
  ['US-2', '作为用户，我想在 Ethereum 和 Base 之间切换', '顶部网络选择器；钱包在不支持的链上时显示“切换网络”按钮'],
  ['US-3', '作为用户，我想搜索代币并看到余额', '按名称/符号/地址搜索；显示余额；粘贴未知地址时显示“未验证代币”警告'],
  ['US-4', '作为用户，我想输入金额后立即看到能换多少', '防抖 300 ms 后报价；显示价格、价格影响、最少收到、预估 Gas'],
  ['US-5', '作为用户，我想设置滑点', '预设 0.1%/0.5%/1%，可自定义；&gt; 5% 时红色警告；&lt; 0.05% 时提示可能失败'],
  ['US-6', '作为用户，我想用最少的步骤完成授权', '额度不足时显示“授权”步骤；默认精确金额；支持 Permit2 签名'],
  ['US-7', '作为用户，我想看到兑换进度并在失败时知道原因', '状态 Toast + 浏览器链接；拒签不报错；revert 显示人话原因'],
  ['US-8', '作为用户，我想查看历史兑换', '列表按时间倒序、游标分页；包含待确认交易']
])}

<h2>3. 系统架构、调用链与状态机</h2>
${mm('DEX 兑换前端系统架构', `
flowchart TB
  subgraph FE["浏览器 · Next.js 客户端"]
    UI["SwapCard 等组件"] --> HK["hooks<br/>useQuote · useSwap · useBalances"]
    HK --> WG["wagmi + TanStack Query"]
  end
  subgraph BE["Next.js 服务端 · Route Handlers"]
    TL["/api/tokens<br/>代币列表"]
    QP["/api/quote<br/>聚合器代理 隐藏 API Key"]
    HS["/api/swaps<br/>历史记录"]
  end
  WG -->|"eth_call 报价 · 余额 · 授权"| RPC["RPC 池<br/>主 + 备"]
  WG -->|"签名请求"| WAL["钱包"]
  WAL -->|"广播"| RPC
  HK --> TL
  HK --> QP
  HK --> HS
  QP --> AGG["聚合器 API"]
  HS --> DB[("PostgreSQL")]
  IDX["索引器<br/>监听 Swap 事件"] --> DB
  IDX --> RPC
  RPC --> CT["Quoter · SwapRouter02<br/>Permit2 · ERC-20"]
`, [
  ['flow', '报价有两条路：直接 eth_call 调 Quoter 合约（无需后端），或经后端代理调聚合器 API（需要隐藏 API Key）。'],
  ['key', '前端可以没有后端完成兑换；后端只负责代币列表、聚合器代理和历史记录，宕机时兑换主流程仍可用。'],
  ['fail', 'RPC 池全部不可用时，报价和余额都无法读取。显示明确的“网络异常”，禁止提交。'],
  ['risk', '聚合器返回的 to/data 是第三方构造的交易。前端必须校验 to 在白名单中并展示解码结果。'],
  ['limit', '本项目只做精确输入、单跳为主的兑换；多跳路由与限价单作为扩展。']
])}
${mm('关键调用链（一）：报价与授权', `
sequenceDiagram
  participant U as 用户
  participant F as 前端
  participant R as RPC
  participant W as 钱包
  U->>F: 输入 1000 USDC 选 WETH
  F->>R: 并行模拟 Quoter 4 个费率档
  R-->>F: 返回各档 amountOut 与 gasEstimate
  F->>F: 选最优档 计算 minOut 与价格影响
  F->>R: 读 allowance
  R-->>F: allowance 小于 1000 USDC
  U->>F: 点击 授权 USDC
  F->>W: approve SwapRouter02 精确 1000 USDC
  W-->>F: txHash A
  F->>R: 等待 A 的回执
`, [
  ['fail', '授权回执成功前就允许点“兑换”，模拟会因 allowance 不足失败。'],
  ['risk', 'approve 的 spender 必须是硬编码的 SwapRouter02 地址，不能来自 URL 或接口返回。'],
  ['key', '只授权本次需要的精确数量，不默认无限授权。']
])}
${mm('关键调用链（二）：兑换与确认', `
sequenceDiagram
  participant U as 用户
  participant F as 前端
  participant R as RPC
  participant W as 钱包
  U->>F: 点击 兑换
  F->>R: 重新报价并 simulate multicall deadline exactInputSingle
  F->>W: writeContract
  W-->>F: txHash B
  F->>R: waitForTransactionReceipt 含替换处理
  R-->>F: status success 与 Transfer 日志
  F->>F: 解析实际收到数量 刷新余额 写入历史
`, [
  ['flow', '提交兑换前重新报价并模拟：用户可能在授权确认期间停留了很久，旧报价已经失效。'],
  ['key', 'minOut 由最新报价和滑点计算，写进交易参数。它是用户对抗价格变动与夹子攻击的唯一保护。'],
  ['fail', '用户在钱包里加速或取消交易会产生替换交易，等待回执时要处理“被替换”的情况。']
])}
${mm('兑换卡片核心状态机', `
stateDiagram-v2
  state "等待输入" as Input
  state "报价中" as Quoting
  state "报价就绪" as Quoted
  state "无可用路径" as NoRoute
  state "余额不足" as NoBalance
  state "需要授权" as NeedApproval
  state "授权中" as Approving
  state "可兑换" as Ready
  state "签名中" as Signing
  state "确认中" as Pending
  state "成功" as Success
  state "失败" as Failed
  [*] --> Input
  Input --> Quoting: 金额与代币有效
  Quoting --> Quoted: 报价返回
  Quoting --> NoRoute: 所有费率档失败
  Quoted --> Quoting: 新区块或 30 秒或输入变化
  Quoted --> NoBalance: 金额大于余额
  Quoted --> NeedApproval: allowance 不足
  Quoted --> Ready: allowance 足够
  NeedApproval --> Approving: 点击授权
  Approving --> NeedApproval: 拒签或失败
  Approving --> Ready: 授权确认
  Ready --> Signing: 点击兑换
  Signing --> Ready: 拒签 4001
  Signing --> Pending: 得到 txHash
  Pending --> Success: status success
  Pending --> Failed: status reverted
  Failed --> Quoting: 重试
  Success --> Input: 再来一笔
`, [
  ['key', '按钮文案完全由这个状态决定：输入金额 / 余额不足 / 授权 USDC / 兑换 / 请在钱包确认 / 确认中。'],
  ['fail', 'Quoted 状态下余额或授权会随区块变化，状态要由“报价 + 余额 + 授权”三份数据实时派生，而不是一次性设置。'],
  ['limit', '这个状态机不包含跨链；跨链兑换需要 M03.7 的长时任务追踪。']
])}
<p>组件树与状态归属：</p>
${code('BASH', `
app/swap/page.tsx (服务端：读取代币列表做 SSG/ISR)
└─ <SwapPage>                      'use client'
   ├─ <Header>  ConnectButton · NetworkSelect（useSwitchChain）
   ├─ <SwapCard>                   本地状态：tokenIn, tokenOut, amountIn(string), slippageBps
   │  ├─ <TokenAmountInput side="in">   余额（useBalances）· “最大”按钮
   │  │  └─ <TokenSelectModal>          搜索、未验证代币警告
   │  ├─ <FlipButton>
   │  ├─ <TokenAmountInput side="out" readOnly>   报价（useQuote）
   │  ├─ <QuoteDetails>             价格 · 价格影响 · 最少收到 · 预估 Gas · 路由
   │  ├─ <SlippageSettings>         持久化到 localStorage
   │  └─ <ActionButton>             由 useSwapState 派生：approve / swap / disabled 原因
   ├─ <TxToaster>                   全局：useTxTracker（待处理交易持久化）
   └─ <HistoryPanel>                useInfiniteQuery → /api/swaps，合并本地待确认交易
`)}
${tbl(['状态', '放在哪里', '理由'], [
  ['连接、账户、链', 'wagmi', '唯一事实来源，自动处理事件'],
  ['余额、授权、报价', 'TanStack Query（wagmi Hook 或 useQuery）', '缓存、去重、按区块失效'],
  ['tokenIn/out、金额、滑点', 'SwapCard 组件状态 + URL 查询参数', '可分享链接；金额保存为字符串'],
  ['滑点、自定义代币', 'localStorage（try/catch 包裹）', '每个用户的偏好'],
  ['待处理交易', 'localStorage + 内存 store（如 zustand）', '刷新页面后恢复追踪'],
  ['历史记录', '后端 API + 本地待确认合并', '跨设备可见']
])}

<h2>4. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['框架', 'Next.js App Router', 'Vite + React', 'SSG 代币页、Route Handlers 做代理、Vercel 预览环境'],
  ['链交互', 'viem 2.x', 'ethers v6', '类型推导、体积、与 wagmi 同源'],
  ['React 绑定', 'wagmi 2.x + TanStack Query v5', '自写 Hooks', '连接、缓存、重连、SSR 支持成熟'],
  ['连接 UI', 'RainbowKit', 'Reown AppKit、ConnectKit', 'EVM-only 场景开箱即用；可动态加载'],
  ['报价', 'Uniswap V3 QuoterV2（链上）+ 聚合器 API（可选）', '只用聚合器', '链上报价无第三方依赖；聚合器路径更优，两者互为降级'],
  ['授权', 'approve 精确金额（默认）+ Permit2（聚合器路径）', '只用无限 approve', '安全默认 + 少一步交易的选项'],
  ['数据', 'PostgreSQL + 自建轻量索引器（或 Ponder）', 'The Graph 托管', '历史记录需要按用户分页，结构简单'],
  ['UI', 'Tailwind + Radix 组件', 'MUI', '体积小、可访问性好'],
  ['测试', 'vitest、Testing Library、Playwright、anvil', 'Jest、Cypress', '速度快；anvil 分叉主网'],
  ['监控', 'Sentry + 自定义指标（Prometheus/Grafana 或 Datadog）', 'LogRocket', '错误追踪 + 业务指标'],
  ['部署', 'Vercel（主）+ IPFS/ENS（备）', 'Cloudflare Pages', '预览环境、边缘缓存；IPFS 抗审查且可验证']
])}

<h2>5. 数据模型</h2>
${code('SQL', `
-- 代币列表（以 Uniswap Token List 格式导入，后台审核后上架）
CREATE TABLE tokens (
  chain_id     INTEGER     NOT NULL,
  address      CHAR(42)    NOT NULL,            -- EIP-55 校验和格式
  symbol       TEXT        NOT NULL,
  name         TEXT        NOT NULL,
  decimals     SMALLINT    NOT NULL CHECK (decimals BETWEEN 0 AND 36),  -- 从链上读取后写入
  logo_uri     TEXT,
  verified     BOOLEAN     NOT NULL DEFAULT false,
  PRIMARY KEY (chain_id, address)
);

-- 兑换记录：前端提交 txHash 后写入 pending；索引器根据链上 Swap/Transfer 事件确认
CREATE TABLE swaps (
  id            BIGSERIAL PRIMARY KEY,
  chain_id      INTEGER     NOT NULL,
  tx_hash       CHAR(66)    NOT NULL,
  account       CHAR(42)    NOT NULL,
  token_in      CHAR(42)    NOT NULL,
  token_out     CHAR(42)    NOT NULL,
  amount_in     NUMERIC(78,0) NOT NULL,         -- uint256 最大 78 位十进制，存原始整数
  quoted_out    NUMERIC(78,0) NOT NULL,
  min_out       NUMERIC(78,0) NOT NULL,
  actual_out    NUMERIC(78,0),                  -- 确认后从日志解析
  slippage_bps  INTEGER     NOT NULL,
  route         TEXT        NOT NULL,           -- 'v3:500' | 'agg:0x'
  status        TEXT        NOT NULL DEFAULT 'pending',  -- pending | success | reverted | replaced | dropped
  block_number  BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at  TIMESTAMPTZ,
  UNIQUE (chain_id, tx_hash)
);
CREATE INDEX idx_swaps_account ON swaps (account, created_at DESC, id DESC);  -- 游标分页
`)}
${code('TYPESCRIPT', `
// 前端核心类型
export type Token = { chainId: number; address: \`0x\${string}\`; symbol: string; name: string; decimals: number; verified: boolean; isNative?: boolean }
export type Quote = {
  amountIn: bigint; amountOut: bigint; fee: 100 | 500 | 3000 | 10000   // V3 费率档（百万分之）
  gasEstimate: bigint; priceImpactBps: number; blockNumber: bigint; at: number; source: 'v3' | 'agg'
}
export type PendingTx = { hash: \`0x\${string}\`; chainId: number; kind: 'approve' | 'swap'; summary: string; createdAt: number }
`)}

<h2>6. 接口设计</h2>
${tbl(['接口', '方法与路径', '参数', '返回'], [
  ['代币列表', 'GET /api/tokens', 'chainId', 'Token[]，CDN 缓存 10 分钟'],
  ['聚合器报价（代理）', 'GET /api/quote', 'chainId, sellToken, buyToken, sellAmount, taker, slippageBps', '{ buyAmount, minBuyAmount, transaction{to,data,value,gas}, permit2?{eip712} }'],
  ['记录兑换', 'POST /api/swaps', '{ chainId, txHash, tokenIn, tokenOut, amountIn, quotedOut, minOut, slippageBps, route }', '201；需 SIWE 会话或签名校验'],
  ['历史记录', 'GET /api/swaps', 'account, chainId, cursor, limit≤50', '{ items, next }']
])}
${code('SOLIDITY', `
// 前端用到的合约函数签名（Uniswap V3，地址以官方部署文档为准）
// QuoterV2：非 view，内部通过 revert 返回结果，前端用 eth_call（simulateContract）调用
struct QuoteExactInputSingleParams { address tokenIn; address tokenOut; uint256 amountIn; uint24 fee; uint160 sqrtPriceLimitX96; }
function quoteExactInputSingle(QuoteExactInputSingleParams memory params)
  external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate);

// SwapRouter02：参数结构里没有 deadline，用 multicall(deadline, data[]) 包一层实现截止时间
struct ExactInputSingleParams { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }
function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory);

// ERC-20 与 Permit2
function allowance(address owner, address spender) external view returns (uint256);
function approve(address spender, uint256 amount) external returns (bool);
// Permit2 (0x000000000022D473030F116dDEE9F6B43aC78BA3)
function allowance(address user, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce);
`)}

${recap([
  '验收标准要量化：报价 P95 延迟、首屏体积、revert 率、可用性、可访问性。',
  '架构：前端直连 RPC 完成报价与兑换，后端只做代币列表、聚合器代理、历史记录。',
  '核心状态机由报价、余额、授权三份数据实时派生，按钮文案由状态决定。'
])}
${quiz([
  { q: '本项目里，报价和兑换交易由谁直接与链交互？', o: ['后端服务代用户签名并发送', '前端直连 RPC 完成报价与兑换，后端只提供代币列表、聚合器代理和历史记录', '聚合器的服务器替用户提交', '钱包插件自动完成，不需要前端参与'], a: 1, why: '架构上前端直连 RPC 报价和发交易，用户自己签名；后端只做不涉及资金的辅助服务，减少托管风险和单点。' },
  { q: '兑换按钮上的文案（例如“授权 USDC”“兑换”“余额不足”）应该怎么决定？', o: ['写死在页面上，按步骤切换', '由后端接口统一返回', '由报价、余额、授权三份实时数据派生出的状态决定', '由用户手动选择'], a: 2, why: '核心状态机由报价、余额、授权三份数据实时派生，按钮文案只是状态的展示。这样按钮不会和链上真实状态不一致。' }
])}
${exercises([["为兑换前端的这些状态选择存放位置：连接与链、余额与授权、tokenIn 与金额、滑点偏好、待处理交易、历史记录。说明理由。", "<p>连接、账户和链放在 wagmi，它是唯一事实来源。余额、授权和报价放在 TanStack Query，便于缓存和按区块失效。tokenIn、tokenOut、金额放在 SwapCard 组件状态和 URL 参数，金额存字符串。滑点偏好放 localStorage，用 try/catch 包裹。待处理交易放 localStorage 加内存 store，刷新后恢复追踪。历史记录走后端 API，并合并本地待确认交易。</p>"], ["（示例）swaps 表的 amount_in 用 <code>NUMERIC(78,0)</code>。为什么不用 PostgreSQL 的 BIGINT（最大约 9.22 × 10^18）？用 10 个 WETH 验证一下。", "<p>10 WETH 的链上整数是 10 × 10^18 = 10^19，已经超过 BIGINT 的上限。uint256 最大约 1.158 × 10^77，有 78 位十进制数字。用 <code>NUMERIC(78,0)</code> 能无损保存任意链上原始整数。</p>"], ["用户点完“授权 USDC”后等了两分钟才点“兑换”。为什么提交前要重新报价并模拟？如果不这样做会怎样？", "<p>授权确认期间价格可能已经变化，旧报价已经失效。minOut 由最新报价和滑点计算并写进交易，它是用户对抗价格变动和夹子攻击的唯一保护。用旧报价算 minOut，交易可能 revert，或者保护力度不对。授权回执成功前也不能允许兑换，否则模拟会因 allowance 不足失败。</p>"]])}
${checklist(["能把 DEX 兑换需求写成带验收条件的用户故事，并给出量化的验收标准。", "能画出兑换前端的系统架构，说明前端、后端、索引器和 RPC 各自的分工。", "能画出兑换卡片状态机，并由报价、余额、授权三份数据派生按钮文案。", "能为连接、余额、报价、滑点、待处理交易选出合适的状态存放位置。", "能设计 tokens 和 swaps 表，用 NUMERIC(78,0) 保存链上原始整数。"])}
${call('info', '<p>设计到此完成。下一篇 <a href="#m07-50">M03.11 实战·实现</a> 讲核心代码、测试策略、部署运维、安全清单与里程碑。</p>', '下一篇')}
` });

CUR = 'm07-50';
addCh({ id: 'm07-50', nav: '实战·实现：DEX 兑换前端', title: 'M03.11 实战·实现：DEX 兑换前端（Next.js + wagmi + viem）', desc: '核心代码、测试策略、部署运维、安全清单、里程碑与扩展方向', html: `
<h1>M03.11 实战·实现：DEX 兑换前端（Next.js + wagmi + viem）</h1>
${meta(['按上篇的设计，读懂并能复现本项目的核心代码。', '为项目制定测试策略：单元、集成、模糊与故障注入。', '完成部署、监控与安全清单，并按里程碑交付。'], '前置：<a href="#m07-10">M03.10 实战·设计</a>')}
${call('info', '<p>本篇是项目的下篇。架构图、数据模型和接口定义都在<a href="#m07-10">上篇</a>，读代码时可以对照着看。</p>')}

<h2>7. 核心代码</h2>
${art('代码结构：界面调用 hooks，hooks 读配置与 ABI', 660, 340, [
  S.box(230, 34, 200, 52, { k: 'info', t: 'SwapCard.tsx', s: '组件 · 本地状态', tag: '界面', mono: 1 }),
  S.box(10, 140, 196, 56, { k: 'key', t: 'useQuote.ts', s: '4 个费率档并行报价', tag: 'hook', mono: 1 }),
  S.box(232, 140, 196, 56, { k: 'key', t: 'useSwap.ts', s: '授权 · 模拟 · 发送', tag: 'hook', mono: 1 }),
  S.box(454, 140, 196, 56, { k: 'tint', t: 'swapErrors.ts', s: '兑换专用错误文案', tag: '错误', mono: 1 }),
  S.box(10, 254, 196, 56, { k: 'idle', t: 'abi/quoterV2.ts', s: 'Quoter 函数签名', tag: 'ABI', mono: 1 }),
  S.box(232, 254, 196, 56, { k: 'ok', t: 'constants/addresses.ts', s: '地址硬编码 + 校验和', tag: '配置', mono: 1, ts: 11.5 }),
  S.box(454, 254, 196, 56, { k: 'idle', t: 'abi/swapRouter02.ts', s: 'Router 函数签名', tag: 'ABI', mono: 1, ts: 11.5 }),
  S.arrow(290, 88, 150, 138),
  S.arrow(330, 88, 330, 138),
  S.arrow(430, 168, 452, 168),
  S.arrow(130, 198, 130, 252),
  S.arrow(160, 198, 290, 252),
  S.arrow(330, 198, 330, 252),
  S.arrow(400, 198, 520, 252),
  S.text(330, 332, '依赖方向：界面 → hooks → 配置与 ABI（合约地址只在一处硬编码）', { size: 13, anchor: 'middle', mw: 640 })
], [ ['flow', '界面只调用 hooks；hooks 从 constants 取地址、从 abi 取函数签名，没有任何组件直接拼 calldata。'], ['key', '合约地址只在 constants/addresses.ts 里硬编码一次，所有 hooks 共用。'], ['risk', 'spender 和 to 来自这个文件，不来自 URL 参数或接口返回。'], ['limit', 'swapErrors.ts 只补兑换专用文案，通用错误解析在 M03.5。'] ], 'SwapCard.tsx 调用 useQuote 与 useSwap，两个 hook 从 constants/addresses.ts 取地址，从 abi 目录取函数签名，useSwap 的错误交给 swapErrors.ts', 'm07-50')}
${art('数据在哪：余额与报价在链上，历史在数据库，待处理交易在浏览器', 680, 344, [
  S.zone(10, 34, 190, 244, { t: '服务端 · Next.js', k: 'idle' }),
  S.zone(245, 34, 190, 244, { t: '浏览器', k: 'info' }),
  S.zone(480, 34, 190, 244, { t: '链上与钱包', k: 'warn' }),
  S.box(20, 64, 170, 58, { k: 'tint', icon: 'server', t: 'Route Handlers', s: '/api/quote 代理聚合器\n/api/swaps 历史', ss: 11 }),
  S.box(20, 150, 170, 52, { k: 'info', icon: 'db', t: 'PostgreSQL', s: '历史库 · 索引器写入' }),
  S.box(255, 64, 170, 52, { k: 'key', icon: 'code', t: 'SwapCard + hooks', s: 'useQuote · useSwap' }),
  S.box(255, 150, 170, 52, { k: 'info', icon: 'link', t: 'wagmi + Query', s: '缓存 · 按区块失效' }),
  S.box(255, 228, 170, 40, { k: 'idle', dash: 1, t: 'localStorage', s: '待处理交易 · 滑点' }),
  S.box(490, 64, 170, 52, { k: 'warn', icon: 'wallet', t: '钱包', s: '签名 · 广播' }),
  S.box(490, 150, 170, 52, { k: 'info', icon: 'cloud', t: 'RPC 池', s: '主 + 备' }),
  S.box(490, 228, 170, 40, { k: 'info', icon: 'code', t: 'Quoter · Router', s: 'Permit2 · ERC-20' }),
  S.arrow(255, 90, 192, 90, { label: '/api' }),
  S.arrow(340, 118, 340, 148),
  S.arrow(427, 176, 488, 176, { label: 'eth_call' }),
  S.arrow(427, 160, 488, 110, { k: 'warn' }),
  S.arrow(575, 118, 575, 148, { k: 'warn', label: '广播' }),
  S.arrow(575, 204, 575, 226),
  S.text(340, 312, '余额与授权读 RPC；历史读数据库；刷新页面后，待处理交易从 localStorage 恢复', { size: 13, anchor: 'middle', mw: 660 })
], [ ['flow', '链上的数据（余额、授权、报价）经 RPC 读，不经过后端；后端只管代币列表、聚合器代理和历史。'], ['key', '兑换主流程只依赖浏览器、RPC 和钱包，后端宕机时仍可兑换。'], ['fail', 'RPC 池全部不可用时，报价和余额都读不到，要显示“网络异常”并禁止提交。'], ['risk', '聚合器 API Key 只放在服务端，浏览器永远拿不到。'] ], '服务端有 Route Handlers 和 PostgreSQL，浏览器有组件、wagmi 和 localStorage，链上与钱包一侧有钱包、RPC 池和合约', 'm07-50')}
<h3>7.1 地址与配置</h3>
${code('TYPESCRIPT', `
// src/constants/addresses.ts —— 硬编码 + 校验和；地址以 Uniswap 官方部署文档为准
import { getAddress } from 'viem'
import { mainnet, base } from 'wagmi/chains'

export const UNI = {
  [mainnet.id]: {
    quoterV2: getAddress('0x61fFE014bA17989E743c5F6cB21bF9697530B21e'),
    swapRouter02: getAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
    weth: getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  },
  [base.id]: {
    quoterV2: getAddress('0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'),
    swapRouter02: getAddress('0x2626664c2603336E57B271c5C0b26F421741e481'),
    weth: getAddress('0x4200000000000000000000000000000000000006'),
  },
} as const
export const PERMIT2 = getAddress('0x000000000022D473030F116dDEE9F6B43aC78BA3')
export const FEE_TIERS = [100, 500, 3000, 10000] as const
`)}
<h3>7.2 报价 hook：并行查询 4 个费率档，取最优</h3>
${code('TYPESCRIPT', `
// src/features/swap/useQuote.ts
import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useBlockNumber } from 'wagmi'
import { quoterV2Abi } from '@/abi/quoterV2'
import { UNI, FEE_TIERS } from '@/constants/addresses'
import { useDebounce } from '@/hooks/useDebounce'

export function useQuote(chainId: keyof typeof UNI, tokenIn?: Token, tokenOut?: Token, amountIn?: bigint) {
  const client = usePublicClient({ chainId })
  const debounced = useDebounce(amountIn, 300)                 // 停止输入 300 ms 后才报价
  const { data: block } = useBlockNumber({ chainId, watch: true })
  const addrIn = tokenIn?.isNative ? UNI[chainId].weth : tokenIn?.address
  const addrOut = tokenOut?.isNative ? UNI[chainId].weth : tokenOut?.address

  return useQuery({
    // 区块号进入 queryKey：每个新区块自动重新报价；placeholderData 保留旧值避免闪烁
    queryKey: ['quote', chainId, addrIn, addrOut, debounced?.toString(), block?.toString()],
    enabled: !!client && !!addrIn && !!addrOut && !!debounced && debounced > 0n && addrIn !== addrOut,
    placeholderData: prev => prev,
    staleTime: 30_000,
    retry: 1,
    queryFn: async (): Promise<Quote> => {
      const t0 = performance.now()
      const results = await Promise.allSettled(FEE_TIERS.map(fee =>
        client!.simulateContract({                                // Quoter 不是 view，用 simulate 走 eth_call
          address: UNI[chainId].quoterV2, abi: quoterV2Abi, functionName: 'quoteExactInputSingle',
          args: [{ tokenIn: addrIn!, tokenOut: addrOut!, amountIn: debounced!, fee, sqrtPriceLimitX96: 0n }],
        }).then(r => ({ fee, amountOut: r.result[0], gasEstimate: r.result[3] }))))
      const ok = results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []))
      if (!ok.length) throw new NoRouteError()                    // 所有费率档都没有池子或流动性
      // 比较“扣除 Gas 后”的净收益更严谨；此处简化为比较 amountOut
      const best = ok.reduce((a, b) => (b.amountOut > a.amountOut ? b : a))
      track('quote_latency_ms', performance.now() - t0, { chainId })
      return { amountIn: debounced!, amountOut: best.amountOut, fee: best.fee, gasEstimate: best.gasEstimate,
               priceImpactBps: 0 /* 用池子现价与成交均价计算，见 7.4 */, blockNumber: block ?? 0n, at: Date.now(), source: 'v3' }
    },
  })
}
`)}
<h3>7.3 兑换流程：授权 → 重新报价 → 模拟 → 发送 → 追踪</h3>
${code('TYPESCRIPT', `
// src/features/swap/useSwap.ts
import { useAccount, useConfig, useReadContract, useWriteContract } from 'wagmi'
import { simulateContract, waitForTransactionReceipt } from '@wagmi/core'
import { encodeFunctionData, erc20Abi, parseEventLogs, isAddressEqual } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { swapRouter02Abi } from '@/abi/swapRouter02'

export function useSwap(chainId: keyof typeof UNI, tokenIn: Token, tokenOut: Token) {
  const { address } = useAccount()
  const config = useConfig()
  const qc = useQueryClient()
  const { writeContractAsync } = useWriteContract()
  const router = UNI[chainId].swapRouter02

  const allowance = useReadContract({
    chainId, address: tokenIn.address, abi: erc20Abi, functionName: 'allowance',
    args: address ? [address, router] : undefined,
    query: { enabled: !!address && !tokenIn.isNative },
  })

  async function approve(amount: bigint) {                       // 默认精确金额
    const { request } = await simulateContract(config, {
      chainId, account: address, address: tokenIn.address, abi: erc20Abi, functionName: 'approve', args: [router, amount],
    })
    const hash = await writeContractAsync(request)
    tracker.add({ hash, chainId, kind: 'approve', summary: '授权 ' + tokenIn.symbol, createdAt: Date.now() })
    const rc = await waitForTransactionReceipt(config, { chainId, hash })
    if (rc.status !== 'success') throw new Error('授权交易失败')
    await allowance.refetch()                                    // 以链上为准
  }

  async function swap(quote: Quote, slippageBps: bigint, getFreshQuote: () => Promise<Quote>) {
    // 1. 提交前重新报价：防止用户停留太久导致报价过期
    const fresh = Date.now() - quote.at > 15_000 ? await getFreshQuote() : quote
    const minOut = (fresh.amountOut * (10_000n - slippageBps)) / 10_000n
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)   // 20 分钟

    // 2. 编码 exactInputSingle，再用 multicall(deadline, data[]) 加截止时间
    const inner = encodeFunctionData({ abi: swapRouter02Abi, functionName: 'exactInputSingle', args: [{
      tokenIn: tokenIn.isNative ? UNI[chainId].weth : tokenIn.address,
      tokenOut: tokenOut.isNative ? UNI[chainId].weth : tokenOut.address,   // 输出原生 ETH 需追加 unwrapWETH9，此处省略
      fee: fresh.fee, recipient: address!, amountIn: fresh.amountIn, amountOutMinimum: minOut, sqrtPriceLimitX96: 0n,
    }] })
    const { request } = await simulateContract(config, {
      chainId, account: address, address: router, abi: swapRouter02Abi, functionName: 'multicall',
      args: [deadline, [inner]],
      value: tokenIn.isNative ? fresh.amountIn : 0n,             // 输入原生 ETH 时，路由合约自动包装成 WETH
    })

    // 3. 发送并追踪（含加速/取消）
    const hash = await writeContractAsync(request)
    tracker.add({ hash, chainId, kind: 'swap', summary: \`兑换 \${tokenIn.symbol} → \${tokenOut.symbol}\`, createdAt: Date.now() })
    void fetch('/api/swaps', { method: 'POST', body: JSON.stringify({ chainId, txHash: hash, amountIn: fresh.amountIn.toString(), quotedOut: fresh.amountOut.toString(), minOut: minOut.toString(), slippageBps: Number(slippageBps), route: 'v3:' + fresh.fee }) })
    const rc = await waitForTransactionReceipt(config, { chainId, hash, onReplaced: r => tracker.replace(hash, r) })

    // 4. 解析实际收到数量：找 tokenOut 合约发给用户的 Transfer 日志
    const logs = parseEventLogs({ abi: erc20Abi, eventName: 'Transfer', logs: rc.logs })
    const received = logs.find(l => isAddressEqual(l.address, tokenOut.address) && isAddressEqual(l.args.to, address!))?.args.value
    qc.invalidateQueries({ queryKey: ['balances'] })             // 刷新余额（键名按项目约定）
    return { receipt: rc, received, minOut }
  }

  return { allowance, approve, swap }
}
`)}
<h3>7.4 价格影响与滑点设置</h3>
${code('TYPESCRIPT', `
// 价格影响 = 1 − 成交均价 / 小额参考价。参考价用极小金额（例如 1/1000 的输入）报价得到，避免直接解析 sqrtPriceX96
export function priceImpactBps(amountIn: bigint, amountOut: bigint, refIn: bigint, refOut: bigint): number {
  // 比较 amountOut/amountIn 与 refOut/refIn，交叉相乘避免除法丢精度
  const lhs = amountOut * refIn, rhs = refOut * amountIn
  if (rhs === 0n) return 0
  return Number(((rhs - lhs) * 10_000n) / rhs)                 // 结果是基点，可安全转 number
}

export const SLIPPAGE_PRESETS = [10n, 50n, 100n] as const       // 0.1% / 0.5% / 1%
export function slippageWarning(bps: bigint): string | null {
  if (bps < 5n) return '滑点过低，交易可能失败'
  if (bps > 500n) return '滑点过高，你可能遭遇夹子攻击，成交价格明显变差'
  return null
}
`)}
<h3>算一算：一次兑换的报价、最少收到与价格影响（示例）</h3>
${steps(['输入 1,000 USDC = 1,000,000,000（6 位）。Quoter 返回 amountOut = 285,000,000,000,000,000（18 位）= 0.285 WETH，费率档 500。', '参考报价：输入 1 USDC 得到 0.000286 WETH，即参考价 0.000286 WETH/USDC。', '成交均价 = 0.285 ÷ 1,000 = 0.000285。价格影响 = 1 − 0.000285 ÷ 0.000286 ≈ 0.35%（35 bps）。', '滑点 0.5%：minOut = 285,000,000,000,000,000 × 9,950 ÷ 10,000 = 283,575,000,000,000,000，即 0.283575 WETH。', '显示：“预计收到 0.285 WETH，最少收到 0.283575 WETH，价格影响 0.35%”。价格影响 &gt; 1% 黄色、&gt; 5% 红色并要求二次确认。'])}
<h3>7.5 错误处理</h3>
${code('TYPESCRIPT', `
// src/features/swap/swapErrors.ts —— 在通用 explainError（M03.5）之上补充兑换专用文案
const SWAP_REASONS: Record<string, string> = {
  'Too little received': '价格变动超过你的滑点设置。请刷新报价，或适当调高滑点。',
  'Transaction too old': '交易超过截止时间才被打包，已自动失效。请重新提交。',
  'STF': '代币转账失败：授权不足或代币有转账限制（例如收税代币）。',
}
export function explainSwapError(err: unknown): { text: string; silent?: boolean; action?: 'requote' | 'approve' | 'switch' } {
  if (err instanceof NoRouteError) return { text: '没有找到可用的交易路径，请换一个代币或减少金额。' }
  if (err instanceof BaseError) {
    if (err.walk(e => e instanceof UserRejectedRequestError)) return { text: '', silent: true }
    if (err.walk(e => e instanceof ChainMismatchError)) return { text: '请切换到正确的网络。', action: 'switch' }
    const rev = err.walk(e => e instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null
    const reason = rev?.reason ?? rev?.data?.errorName
    if (reason && SWAP_REASONS[reason]) return { text: SWAP_REASONS[reason], action: reason === 'STF' ? 'approve' : 'requote' }
  }
  return { text: explainError(err) }                          // 回落到通用解析
}
`)}
<h3>7.6 Permit2 路径（经聚合器）</h3>
<p>聚合器（以 0x Swap API v2 的 permit2 端点为例，字段以其官方文档为准）返回一份 Permit2 的 EIP-712 数据和一笔待发送的交易。前端流程：确保代币已 approve 给 Permit2 合约（一次性）→ 签 EIP-712 → 把签名附加到交易 data 末尾 → 校验 <code>to</code> 在白名单 → 发送。</p>
${code('TYPESCRIPT', `
import { concat, numberToHex, size } from 'viem'

async function swapViaAggregator(q: AggQuote) {
  if (!isAddressEqual(q.transaction.to, ALLOWED_AGG_TARGETS[chainId])) throw new Error('未知的交易目标合约')  // 白名单
  let data = q.transaction.data
  if (q.permit2?.eip712) {
    // 签名前把关键字段翻译成人话展示：代币、额度、spender、期限（参考 eip712 实验）
    const sig = await signTypedDataAsync(q.permit2.eip712)
    data = concat([data, numberToHex(size(sig), { signed: false, size: 32 }), sig])    // 长度 + 签名
  }
  return sendTransactionAsync({ to: q.transaction.to, data, value: BigInt(q.transaction.value) })
}
// 后端 /api/quote 负责附加 API Key 请求聚合器，前端永远拿不到 Key
`)}

<h2>8. 测试策略</h2>
${tbl(['层级', '工具', '用例清单（节选）'], [
  ['单元', 'vitest', 'formatAmount 6/8/18 位与舍入方向；minOut 边界（0、10000 bps）；priceImpactBps 交叉相乘；explainSwapError 每个 reason；parseUnits 输入校验'],
  ['属性/模糊', 'fast-check', '任意合法金额字符串 parse 再 format 等于规范化原值；minOut 永远 ≤ quote'],
  ['组件', 'Testing Library + wagmi mock', '未连接/错链/余额不足/需授权/可兑换五种按钮文案；拒签后按钮恢复；滑点 &gt; 5% 警告'],
  ['E2E', 'Playwright + anvil 分叉主网', '见下方用例'],
  ['接口压测', 'k6', '/api/quote 200 RPS 下 P95 &lt; 500 ms；聚合器超时时 3 秒内降级为链上报价'],
  ['故障注入', 'Playwright 路由拦截', '主 RPC 返回 500 → 切备用；报价接口超时 → 降级；回执 status reverted → 失败文案'],
])}
${steps(['E2E-1：连接 mock 钱包 → 选择 USDC → WETH → 输入 1000 → 等待报价出现且最少收到小于预计收到。', 'E2E-2：allowance 为 0 时按钮显示“授权 USDC”，授权后变为“兑换”。', 'E2E-3：完成兑换，余额 USDC 减少 1000、WETH 增加且 ≥ minOut；历史列表出现该交易。', 'E2E-4：把滑点设为 0.01%，用 anvil 在报价后插入一笔大额交易推动价格（模拟价格变动），兑换应 revert 并显示“价格变动超过滑点”。', 'E2E-5：钱包切到不支持的链，显示“切换网络”，点击后恢复。', 'E2E-6：发送后用 anvil 停止自动挖矿（evm_setAutomine false），验证“确认中”状态；手动 mine 后变为成功。'])}
${code('TYPESCRIPT', `
// e2e/swap.spec.ts（节选）
import { test, expect } from '@playwright/test'
import { createTestClient, http, parseUnits } from 'viem'
import { foundry } from 'viem/chains'
const anvil = createTestClient({ chain: foundry, mode: 'anvil', transport: http('http://127.0.0.1:8545') })

test.beforeEach(async () => {
  test.info().annotations.push({ type: 'fork', description: 'mainnet@21000000' })
  // 每个用例从同一快照开始，互不影响
  ;(globalThis as any).snap = await anvil.snapshot()
})
test.afterEach(async () => { await anvil.revert({ id: (globalThis as any).snap }) })

test('USDC → WETH 授权并兑换', async ({ page }) => {
  await page.goto('/swap?chain=1&in=USDC&out=WETH')
  await page.getByRole('textbox', { name: '支付金额' }).fill('1000')
  await expect(page.getByTestId('quote-out')).not.toHaveText('—', { timeout: 10_000 })
  await page.getByRole('button', { name: '授权 USDC' }).click()
  await page.getByRole('button', { name: '兑换' }).click()
  await expect(page.getByRole('status')).toContainText('兑换成功', { timeout: 20_000 })
})
`)}

<h2>9. 部署与运维</h2>
${tbl(['环境', '链', '用途', '部署方式'], [
  ['local', 'anvil 分叉', '开发与 E2E', 'npm run dev'],
  ['preview', 'Sepolia / Base Sepolia', '每个 PR 评审', 'Vercel Preview（自动）'],
  ['staging', '主网（小额白名单）', '发布前验收', 'Vercel 独立项目 + 访问保护'],
  ['production', 'Ethereum + Base', '正式', 'Vercel Production + IPFS/ENS 镜像']
])}
${steps(['CI：lint → typecheck → vitest → build → anvil 分叉 E2E → Lighthouse CI（性能预算不达标则失败）。', '合并到 main 后自动部署 staging；人工验收后打 tag 发布 production。', '发布时计算构建产物哈希并上传 IPFS，把 CID 写入 GitHub Release；ENS contenthash 由多签更新。', '密钥：聚合器 API Key、数据库连接串只放在服务端环境变量（不带 NEXT_PUBLIC_）；RPC Key 在服务商后台限制来源域名；部署 Token 最小权限并定期轮换。', '回滚：Vercel 一键回滚到上一版本；IPFS 版本作为前端被篡改时的应急入口。'])}
${code('TYPESCRIPT', `
// next.config.ts —— 兑换前端的 CSP（域名为示例，按实际 RPC、WalletConnect、聚合器调整）
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://raw.githubusercontent.com https://assets.coingecko.com",   // 代币图标来源白名单
  "connect-src 'self' https://eth-mainnet.g.alchemy.com https://base-mainnet.g.alchemy.com https://mainnet.base.org wss://relay.walletconnect.com wss://relay.walletconnect.org https://*.walletconnect.com",
  "frame-src https://verify.walletconnect.com",
  "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
].join('; ')
export default { async headers() { return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: csp }] }] } }
// 聚合器请求经 /api/quote 代理，所以 connect-src 不需要放行聚合器域名
`)}
${tbl(['指标（示例）', '含义', '告警阈值（示例）'], [
  ['<code>quote_latency_ms</code> P95', '报价耗时', '&gt; 1,500 ms 持续 10 分钟'],
  ['<code>quote_error_rate</code>', '报价失败比例（排除 NoRoute）', '&gt; 5%'],
  ['<code>swap_sim_failed_total{reason}</code>', '提交前模拟失败', '任一 reason 1 小时内突增 5 倍'],
  ['<code>swap_reverted_rate</code>', '上链后 revert 比例', '&gt; 1%'],
  ['<code>swap_slippage_realized_bps</code>', '实际成交相对报价的偏差分布', 'P95 &gt; 用户设置的 80%：报价可能过期'],
  ['<code>rpc_error_rate{provider}</code>', '各 RPC 失败率', '&gt; 5%，自动摘除并告警'],
  ['<code>frontend_bundle_hash_mismatch</code>', '线上 JS 哈希与发布记录不一致', '出现即 P0 告警']
])}

<h2>10. 安全清单与威胁模型</h2>
${tbl(['威胁', '入口', '防护', '验证'], [
  ['依赖投毒篡改 spender/to', 'npm 包', '精确版本 + lockfile 评审 + npm ci --ignore-scripts', 'CI 日志、PR 评审记录'],
  ['前端托管被篡改', 'Vercel/S3 凭证泄露', '最小权限 + 硬件密钥 + 线上哈希监控 + IPFS 备份', '哈希比对告警演练'],
  ['DNS 劫持', '域名注册商', '注册商锁 + DNSSEC + 公告官方 ENS 入口', '季度审计'],
  ['聚合器返回恶意交易', '第三方 API', 'to 白名单 + calldata 解码展示 + 模拟资产变化', '单元测试：非白名单 to 被拒绝'],
  ['恶意代币（收税、黑名单、假冒符号）', '用户粘贴地址', '未验证代币警告 + 显示完整地址 + 需勾选确认', 'E2E'],
  ['夹子攻击（三明治）', '公开内存池', '默认滑点 0.5%，&gt; 5% 强警告；可选私有交易通道（RPC 层）', '实际滑点指标'],
  ['钓鱼签名', '仿冒站点', 'Permit2 签名前人话展示；sigDeadline 设为分钟级', '<a href="#lab-eip712">签名请求翻译器</a>的红旗规则写成单测'],
  ['XSS', '代币名称、图标', '代币元数据只作文本渲染；图标域名白名单；CSP', '注入 &lt;script&gt; 名称的代币不执行'],
  ['精度错误', '代码 bug', 'bigint 全程 + decimals 从链上读 + 属性测试', '<a href="#lab-units">单位实验</a>对应用例']
])}
${call('warn', `<p>永远不要从 URL 参数、接口返回或 localStorage 读取路由合约、Permit2、spender 地址。URL 只能携带代币<strong>选择</strong>，代币也要与已审核列表比对；未在列表中的地址按“未验证代币”处理。</p>`)}

${mm('DEX 前端的交付顺序：先连上链，再做交易', `
flowchart LR
  W1["第 1 周<br/>脚手架、连接钱包与 CI"]
  W2["第 2 周<br/>代币列表与报价"]
  W3["第 3 周<br/>授权与兑换，分叉 E2E"]
  W4["第 4 周<br/>交易状态与历史记录"]
  W5["第 5 周<br/>Permit2、性能与安全"]
  W6["第 6 周<br/>上线、监控与故障演练"]
  W1 --> W2 --> W3 --> W4 --> W5 --> W6
  class W1 key
  class W6 ok
`, [
  ['flow', '授权与兑换（第 3 周）依赖前两周的连接和报价；E2E 测试从第 3 周开始，在 anvil 分叉上跑。'],
  ['key', '每周结束都要有可演示的交付物，而不是“写了一部分代码”。'],
  ['limit', '6 周是单人或小团队的示例节奏，实际以团队规模和验收标准调整。']
])}
<h2>11. 里程碑计划（6 周）</h2>
${tbl(['周', '目标', '交付物'], [
  ['第 1 周', '脚手架与连接', 'Next.js + wagmi 项目；连接/切链/SSR 无闪烁；CI（lint、typecheck、vitest）；代币列表 API'],
  ['第 2 周', '代币与报价', 'TokenSelectModal、余额 multicall、useQuote（4 费率档、防抖、按区块刷新）、价格影响与滑点设置；单元测试'],
  ['第 3 周', '授权与兑换', 'approve 精确授权、useSwap（重新报价、multicall deadline、模拟、发送）、错误解析；anvil 分叉 E2E-1 至 E2E-3'],
  ['第 4 周', '状态与历史', 'TxToaster + 待处理交易持久化 + 替换处理；/api/swaps 与轻量索引器；HistoryPanel；E2E-4 至 E2E-6'],
  ['第 5 周', 'Permit2、性能与安全', '聚合器代理与 Permit2 路径；钱包库动态加载；CSP/安全头；Lighthouse 预算；安全清单自查'],
  ['第 6 周', '上线与监控', 'staging 验收、监控大盘与告警、IPFS/ENS 镜像、发布流程文档、故障演练（RPC 故障、回滚）']
])}

<h2>12. 扩展方向与面试/作品集要点</h2>
${steps(['<strong>扩展</strong>：多跳路由（exactInput + path 编码）；精确输出（exact output）；Uniswap V4 与 Universal Router；跨链兑换（意图/桥聚合）；限价单（链下签名订单）；智能账户批量调用（EIP-5792，approve + swap 一次确认）；Gas 代付。', '<strong>作品集展示</strong>：线上地址 + IPFS CID；架构图与状态机图；E2E 录屏；监控大盘截图；一页“安全设计说明”。', '<strong>面试高频问题</strong>：为什么金额不能用 number？报价过期怎么处理？minOut 怎么算、为什么能防夹子？用户加速交易后前端怎么追踪？无限授权的风险和替代方案？前端如何防供应链攻击？SSR 水合问题怎么解决？', '<strong>讲清取舍</strong>：链上 Quoter vs 聚合器、approve vs Permit2、乐观更新 vs 等回执、自建索引 vs 托管服务。'])}
<p><strong>下一步：毕业项目</strong>。把合约、前端、后端和上线运维串成一个完整作品，见 <a href="#m12">M14 综合毕业项目</a>。</p>

${mistakes([
  ['报价显示出来就可以一直用。', '报价随区块变化。超过 15–30 秒或新区块到来要刷新，提交前必须重新报价。'],
  ['滑点设大一点，交易更容易成功。', '滑点越大，夹子攻击能拿走的价值越多。默认 0.5%，超过 5% 要强警告。'],
  ['聚合器返回的交易可以直接发送。', '必须校验 to 白名单、解码 calldata、模拟资产变化后再交给钱包。'],
  ['兑换成功后显示报价数量即可。', '实际成交可能与报价不同。从回执的 Transfer 日志解析实际收到数量。']
])}
${recap([
  '验收标准要量化：报价 P95 延迟、首屏体积、revert 率、可用性、可访问性。',
  '架构：前端直连 RPC 完成报价与兑换，后端只做代币列表、聚合器代理、历史记录。',
  '核心状态机由报价、余额、授权三份数据实时派生，按钮文案由状态决定。',
  '报价并行查询 4 个费率档；提交前重新报价；minOut 用基点计算并写入交易；用 multicall(deadline) 加截止时间。',
  '测试用 anvil 分叉主网 + 快照回滚；部署用 Vercel + IPFS 镜像 + 严格 CSP；监控报价、模拟失败、revert、实际滑点。',
  '安全：地址硬编码、精确授权、签名前人话、聚合器目标白名单、未验证代币警告、产物哈希监控。'
])}
${quiz([
  { q: 'Uniswap V3 的 QuoterV2.quoteExactInputSingle 不是 view 函数，前端应如何调用？', o: ['发送真实交易', '用 simulateContract（eth_call）调用，不上链', '无法在前端调用', '用 getLogs 读取'], a: 1, why: 'QuoterV2 内部通过模拟兑换并 revert 来返回结果，用 eth_call 调用即可，不花 Gas。viem 的 readContract 类型上只接受 view/pure，所以用 simulateContract。' },
  { q: '报价 amountOut = 2,000,000（USDC 6 位），滑点 1%。minOut 是多少？', o: ['1,980,000', '1,998,000', '2,020,000', '1,800,000'], a: 0, why: '2,000,000 × (10,000 − 100) ÷ 10,000 = 1,980,000，即 1.98 USDC。' },
  { q: 'SwapRouter02 的 exactInputSingle 参数里没有 deadline，如何给兑换加截止时间？', o: ['在前端用 setTimeout 取消', '用 multicall(uint256 deadline, bytes[] data) 包装调用', '在钱包里设置', '不需要截止时间'], a: 1, why: 'SwapRouter02 提供带 deadline 的 multicall 重载，超过截止时间会 revert（Transaction too old）。前端定时器无法撤回已广播的交易。' },
  { q: '聚合器接口返回了交易 to 和 data，下面哪一步不可省略？', o: ['把 data 显示给用户', '校验 to 在硬编码白名单中，并模拟资产变化', '把交易发两次', '修改 data 中的金额'], a: 1, why: '聚合器是第三方，返回内容可能被篡改或出错。白名单校验 + 模拟是防线。' },
  { q: 'E2E 测试中每个用例前 snapshot、用例后 revert 的目的是？', o: ['加快 RPC 速度', '让每个用例从相同的链状态开始，互不影响', '减少 Gas 消耗', '模拟链重组'], a: 1, why: 'anvil 的快照与回滚让测试隔离且可复现。它与 RPC 速度、Gas 和链重组模拟无关。' }
])}
${exercises([["（示例）输入 2,000 USDC，报价得到 0.56 WETH。参考报价是 1 USDC 换 0.0003 WETH。价格影响是多少基点？界面应怎样提示？滑点 0.5% 时最少收到多少？", "<p>成交均价 = 0.56 ÷ 2,000 = 0.00028。价格影响 = 1 − 0.00028 ÷ 0.0003 ≈ 6.67%；用 <code>priceImpactBps</code> 交叉相乘并截断得 666 bps。超过 5%，要红色提示并要求二次确认。minOut = 560,000,000,000,000,000 × 9,950 ÷ 10,000 = 557,200,000,000,000,000，即 0.5572 WETH。</p>"], ["设计一组故障注入测试，验证 RPC 故障、报价接口超时和交易 revert 三种情况。每个用例的预期结果是什么？", "<p>用 Playwright 路由拦截注入故障。让主 RPC 返回 500，预期自动切到备用 RPC，报价和余额仍能显示。让报价接口超时，预期 3 秒内降级为链上报价。让回执 status 为 reverted，预期显示失败文案，而不是成功。</p>"], ["走聚合器的 Permit2 路径时，前端发送前必须做哪些检查？聚合器的 API Key 应该放在哪里？", "<p>先校验 <code>q.transaction.to</code> 在硬编码白名单中，不在就拒绝。签 Permit2 的 EIP-712 前，把代币、额度、spender、期限翻译成人话展示，sigDeadline 设为分钟级。API Key 只放在后端 /api/quote 的服务端环境变量里，不带 NEXT_PUBLIC_，前端永远拿不到。</p>"]])}
${checklist(["能写出并行查询 4 个费率档、带 300 ms 防抖并按区块刷新的 useQuote。", "能按授权、重新报价、multicall(deadline) 编码、模拟、发送、追踪的顺序实现 useSwap。", "能用交叉相乘算出价格影响的基点，并用 minOut 公式算出最少收到。", "能写出单元、属性、组件、E2E 和故障注入的测试清单，并用 anvil 的 snapshot 和 revert 隔离用例。", "能逐项完成部署与安全清单：服务端保存 API Key、严格 CSP、聚合器目标白名单、线上哈希监控。"])}
${terms([
  ['QuoterV2', 'Uniswap V3 QuoterV2', '通过模拟兑换返回报价的合约，用 eth_call 调用'],
  ['SwapRouter02', 'Uniswap SwapRouter02', 'Uniswap 的兑换路由合约，支持 V2/V3 与带 deadline 的 multicall'],
  ['费率档', 'Fee Tier', 'V3 池子的手续费等级：0.01%、0.05%、0.3%、1%'],
  ['最少收到', 'Minimum Received (amountOutMinimum)', '由报价和滑点算出、写入交易的成交下限'],
  ['价格影响', 'Price Impact', '本次交易使成交均价相对参考价偏离的比例'],
  ['夹子攻击', 'Sandwich Attack', '在用户交易前后各插一笔交易获利的 MEV 攻击'],
  ['聚合器', 'DEX Aggregator', '在多个流动性来源间寻找最优路径的服务']
])}
` });
})();
