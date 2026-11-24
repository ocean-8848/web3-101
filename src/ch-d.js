/* ---------- M03 Web3 大前端 ---------- */
CUR = 'm07';
addCh({ id: 'm07', code: 'M03', group: 'core', nav: 'Web3 大前端', title: 'M03 Web3 大前端', html: `
<h1>M03 Web3 大前端</h1>
${meta(['说清 DApp 前端、钱包、RPC、合约四者的关系。', '用 viem/wagmi 完成连接钱包、读合约、发交易、签 EIP-712 消息。', '为交易的每个状态设计前端反馈，包括拒签、替换、重组。'], '<a href="#m02">M02 智能合约</a>', ['txlife'])}

<h2>1. 一句话理解</h2>
${one('Web3 前端不保管用户数据，也不保管私钥。它的工作是：读链上状态、构造交易、请钱包签名、追踪交易直到确认。')}
${call('analogy', `<p>Web2 前端像餐厅服务员：你点菜，他把单子交给后厨，后厨（服务器）替你做决定。</p>
<p>Web3 前端像一张填好的支票：前端帮你把金额、收款人写好，但<strong>签字必须你亲手在钱包里签</strong>。签完以后，支票交给银行（区块链）处理，前端只能在旁边告诉你“银行处理到哪一步了”。</p>`)}

<h2>2. 四方关系</h2>
${mm('DApp 前端的四个参与方', `
flowchart LR
  UI["DApp 前端<br/>React + wagmi + viem"] -->|"EIP-1193 request<br/>eth_requestAccounts"| W["钱包<br/>MetaMask / Rabby / WalletConnect"]
  W -->|"用户确认后签名"| W
  W -->|"广播已签名交易"| RPC["RPC 节点"]
  UI -->|"只读调用 eth_call"| RPC
  RPC --> SC[("合约")]
  UI -->|"索引数据<br/>历史 · 列表 · 统计"| IDX["索引服务 / 后端 API"]
`, [
  ['flow', '读操作前端直接走 RPC；写操作必须经过钱包签名。前端永远拿不到私钥。'],
  ['key', 'EIP-1193 是钱包暴露给网页的统一接口（window.ethereum.request）。wagmi/viem 封装了它。'],
  ['fail', '用户钱包连在主网，DApp 需要 Base 链。前端必须检测 chainId 并请求切换网络（wallet_switchEthereumChain）。'],
  ['risk', '前端本身是攻击面：DNS 劫持或依赖包投毒可以把“授权”交易的 spender 换成攻击者地址。2023 年 12 月 Ledger Connect Kit 的 npm 包就被投毒。' + cite('Ledger：Connect Kit 安全事件报告', 'https://www.ledger.com/blog/security-incident-report')]
])}

<h2>3. 用 viem 读写合约</h2>
${code('TYPESCRIPT', `
import { createPublicClient, createWalletClient, custom, http, parseUnits } from 'viem'
import { base } from 'viem/chains'

const pub = createPublicClient({ chain: base, transport: http() })
const wallet = createWalletClient({ chain: base, transport: custom(window.ethereum) })

// 1. 连接钱包，拿到地址
const [account] = await wallet.requestAddresses()

// 2. 读：查询余额（不需要签名，不花 Gas）
const bal = await pub.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [account] })

// 3. 先模拟，再写：模拟失败就不弹钱包，避免用户白付 Gas
const { request } = await pub.simulateContract({
  account, address: USDC, abi: erc20Abi, functionName: 'transfer',
  args: [to, parseUnits('25', 6)],       // USDC 精度是 6，不是 18
})
const hash = await wallet.writeContract(request)

// 4. 等待回执，再更新 UI
const receipt = await pub.waitForTransactionReceipt({ hash, confirmations: 1 })
`)}
${call('info', '<p>金额永远用 <code>bigint</code> 和代币的 <code>decimals</code> 处理。JavaScript 的 <code>number</code> 只有 53 位精度，<code>0.1 + 0.2 !== 0.3</code>，会导致金额错误。</p>')}

<h2>4. 签名：交易签名 vs 消息签名</h2>
${tbl(['类型', '方法', '上链吗', '用途', '风险'], [
  ['交易签名', 'eth_sendTransaction', '是，花 Gas', '转账、调用合约', '用户能在钱包看到明确的转账金额'],
  ['个人消息', 'personal_sign', '否', '登录（Sign-In with Ethereum）', '低'],
  ['结构化数据', 'eth_signTypedData_v4（EIP-712）', '否，但可被他人提交上链', 'Permit 授权、链下订单', '<strong>高</strong>：一个 Permit 签名就能授权别人转走代币']
])}
${call('warn', '<p>“签名不花钱”不等于“签名没风险”。钓鱼网站最常用的手法是诱导用户签 Permit / Permit2 消息。签名后，攻击者在链上提交它，转走代币，用户钱包里甚至没有出现过一笔交易。前端应该把 EIP-712 消息的关键字段（spender、amount、deadline）翻译成人话展示。</p>')}

<h2>5. 交易状态机：前端最难的部分</h2>
<p>一笔交易从点击按钮到最终确定，要经过很多状态。很多 DApp 只处理“成功”和“失败”，导致用户看到转圈圈就重复点击。</p>
${mm('前端视角的交易状态机', `
stateDiagram-v2
  state "未连接" as Idle
  state "已连接" as Conn
  state "网络错误" as Wrong
  state "等待签名" as Sign
  state "已广播 · 待打包" as Pending
  state "已加速 · 替换" as Replaced
  state "已打包 1 确认" as Mined
  state "已最终确定" as Final
  state "链上失败 Revert" as Reverted
  [*] --> Idle
  Idle --> Conn: 连接钱包
  Conn --> Wrong: chainId 不匹配
  Wrong --> Conn: 切换网络
  Conn --> Sign: 点击提交
  Sign --> Conn: 用户拒签 4001
  Sign --> Pending: 返回 txHash
  Pending --> Replaced: 用户在钱包加速
  Replaced --> Pending: 追踪新 hash
  Pending --> Mined: 回执 status=1
  Pending --> Reverted: 回执 status=0
  Pending --> Conn: 被丢弃
  Mined --> Pending: 链重组
  Mined --> Final: 达到最终性
  Final --> [*]
`, [
  ['key', '拒签（错误码 4001）不是错误，是用户的正常选择。前端应该安静地回到可操作状态，不要弹红色报错。'],
  ['fail', '用户在钱包里点“加速”，交易 hash 会变。如果前端只盯着旧 hash，会永远显示“处理中”。viem 的 waitForTransactionReceipt 会处理替换。'],
  ['fail', '回执 status=0 表示交易上链了但执行失败（Revert）。Gas 已扣。前端要解析 revert 原因并告诉用户。'],
  ['limit', '前端关闭后，状态机就停了。长时间的交易（例如跨链）需要后端或索引服务持续追踪。']
])}
${lab('txlife')}

<h2>6. 前端安全清单</h2>
${tbl(['检查项', '为什么'], [
  ['锁定依赖版本，审查 lockfile 变化', '防止 npm 包投毒'],
  ['设置严格的 CSP 和 SRI', '防止注入脚本替换交易参数'],
  ['授权额度默认等于本次金额，不默认无限', '降低授权被滥用时的损失'],
  ['展示交易模拟结果（资产变化）', '让用户在签名前看到“将转出什么”'],
  ['地址显示校验和格式，并完整对比', '防止地址投毒（前后几位相同的假地址）'],
  ['所有金额用 bigint 和 decimals 计算', '防止精度错误']
])}

${terms([
  ['DApp', 'Decentralized Application', '前端 + 智能合约组成的去中心化应用'],
  ['EIP-1193', 'Ethereum Provider API', '钱包向网页暴露的标准接口'],
  ['viem / wagmi', 'viem / wagmi', 'TypeScript 以太坊库 / React Hooks 封装'],
  ['EIP-712', 'Typed Structured Data Signing', '结构化、可读的消息签名标准'],
  ['Permit', 'EIP-2612 Permit', '用签名代替 approve 交易的授权方式'],
  ['回执', 'Transaction Receipt', '交易上链后的结果，含 status、gasUsed、logs'],
  ['WalletConnect', 'WalletConnect', '让移动端钱包通过二维码连接网页的协议']
])}
${qs(['在<a href="#lab-txlife">交易状态机实验</a>中，依次触发“提交 → 加速 → 打包 → 重组”。前端在每一步应该显示什么文案？', '为什么写合约前要先 simulateContract？如果跳过模拟，用户会遇到什么？', '一个网站请你签一条 EIP-712 消息，字段里有 spender 和 value = 115792089237316195423570985008687907853269984665640564039457584007913129639935。这意味着什么？'])}
` });

/* ---------- M11 预测市场与衍生品 ---------- */
CUR = 'm08';
addCh({ id: 'm08', code: 'M11', group: 'core', nav: '预测市场与衍生品', title: 'M11 预测市场与衍生品', html: `
<h1>M11 预测市场与衍生品</h1>
${meta(['解释预测市场的价格为什么等于概率，以及 LMSR 做市商如何定价。', '说清预测市场的结算流程和预言机争议机制。', '计算永续合约的强平价格、资金费率，并说明 Perp DEX 的三种架构。'], '<a href="#m13">M08 DeFi 协议</a>、<a href="#m04">M10 CEX</a>', ['lmsr', 'perp'])}

<h2>1. 一句话理解</h2>
${one('预测市场把“对未来事件的看法”变成可交易的份额，价格就是市场认为的概率。永续合约让你用保证金押注价格涨跌，用资金费率把合约价格拴在现货价格附近。')}
${call('analogy', `<p>预测市场像一张彩票：“如果 X 发生，这张票兑 1 美元；不发生，兑 0”。如果大家愿意花 0.62 美元买这张票，市场就认为 X 发生的概率约是 62%。</p>
<p>永续合约像一根橡皮筋：合约价格可以偏离现货价格，但偏离越多，资金费率这根橡皮筋拉得越紧，把价格拉回来。</p>`)}

<h2>2. 预测市场</h2>
<h3>2.1 份额与价格</h3>
<p>一个二元市场（例如“某事件在 2026 年底前发生吗？”）有两种份额：YES 和 NO。规则：</p>
<ul>
<li>1 YES + 1 NO 永远可以兑换 1 USDC（完整集合，Complete Set）。所以 YES 价格 + NO 价格 ≈ 1。</li>
<li>事件结算后，赢的一方每份兑 1 USDC，输的一方兑 0。</li>
</ul>
${mm('二元预测市场的生命周期', `
flowchart LR
  C["创建市场<br/>问题 · 结算规则 · 截止时间"] --> T["交易期<br/>订单簿 或 AMM 做市"]
  T --> CL["交易截止"]
  CL --> P["预言机提议结果<br/>例如 UMA 乐观预言机"]
  P --> DW{"挑战期内<br/>有人质疑？"}
  DW -->|"否"| R["结果确定"]
  DW -->|"是"| V["代币持有人投票裁决"]
  V --> R
  R --> PAY["赢方份额兑 1 USDC<br/>输方兑 0"]
`, [
  ['flow', '资金从交易者进入合约托管；结算后按份额分配。平台不需要承担方向风险（订单簿模式下）。'],
  ['key', 'Polymarket 用中心化订单簿撮合 + 链上结算（Polygon），结果由 UMA 乐观预言机给出。' + cite('Polymarket 文档：市场结算', 'https://docs.polymarket.com/concepts/resolution')],
  ['risk', '规则措辞是最大的风险。如果问题定义含糊，结算时会发生争议。投票者可能是利益相关方。'],
  ['limit', '长期市场的资金占用成本高。概率 95% 的事件，YES 价格可能只有 0.90，因为资金有时间价值。']
])}
<h3>2.2 LMSR：没有对手方也能交易</h3>
<p>新市场刚开时，订单簿是空的。对数市场评分规则（LMSR，Robin Hanson 提出）是一个自动做市商：它永远愿意报价，价格随买入量连续变化。</p>
${one('成本函数 C(q) = b · ln(e^(q_yes/b) + e^(q_no/b))　　YES 价格 = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))')}
<p>买入份额的成本 = C(买入后) − C(买入前)。参数 b 控制流动性：b 越大，价格越难被推动，但做市商的最大亏损 b · ln 2 也越大。</p>
${lab('lmsr')}

<h2>3. 永续合约</h2>
<h3>3.1 核心机制</h3>
${tbl(['概念', '定义', '示例'], [
  ['保证金', '开仓时锁定的资金', '1,000 USDC'],
  ['杠杆', '仓位名义价值 / 保证金', '10x → 仓位价值 10,000 USDC'],
  ['标记价格', '用于计算盈亏和强平的价格，通常取多个现货交易所的指数价', '防止单一市场插针导致强平'],
  ['维持保证金率', '仓位必须保持的最低保证金比例', '0.5%（示例）'],
  ['强平', '保证金低于维持保证金时，系统接管并平掉仓位', '多头 10x 开仓于 60,000，跌到约 54,300 被强平'],
  ['资金费率', '多空双方定期互付的费用；合约价高于现货时多头付给空头', '每 8 小时 0.01%（示例）']
])}
${mm('资金费率：把合约价格拉回现货价格', `
flowchart LR
  UP["合约价 > 现货价<br/>多头太多"] --> FR1["资金费率为正<br/>多头付给空头"]
  FR1 --> A1["持多成本上升 → 多头减仓<br/>套利者：做空合约 + 买现货"]
  A1 --> BAL["合约价回到现货附近"]
  DN["合约价 < 现货价<br/>空头太多"] --> FR2["资金费率为负<br/>空头付给多头"]
  FR2 --> A2["持空成本上升 → 空头减仓<br/>套利者：做多合约 + 卖现货"]
  A2 --> BAL
`, [
  ['key', '永续合约没有到期日。资金费率代替了交割，把价格锚定在现货附近。'],
  ['flow', '资金费在用户之间转移，平台不收（平台收的是交易手续费）。'],
  ['risk', '极端行情下资金费率可能远高于常态（常见基准是每 8 小时 0.01%），甚至触及平台设定的上限。长期持有高杠杆仓位，资金费会吃掉保证金。']
])}
${lab('perp')}

<h3>3.2 强平之后：谁来兜底</h3>
${mm('强平与穿仓处理链', `
flowchart TB
  M["标记价格触及强平价"] --> LQ["强平引擎接管仓位"]
  LQ --> SELL["在市场上平仓"]
  SELL --> Q{"成交价<br/>优于破产价？"}
  Q -->|"是"| INS["剩余保证金注入保险基金"]
  Q -->|"否：穿仓"| FUND{"保险基金<br/>够不够？"}
  FUND -->|"够"| COVER["保险基金补足亏损"]
  FUND -->|"不够"| ADL["自动减仓 ADL<br/>按盈利和杠杆排序，强制平掉对手方盈利仓位"]
`, [
  ['flow', '正常情况下，强平价比破产价（保证金归零的价格）更早触发，剩余部分进入保险基金。'],
  ['risk', '行情跳空时，平仓价可能比破产价更差，产生穿仓亏损。保险基金是第一道兜底，ADL 是最后一道。'],
  ['fail', 'ADL 会强制平掉盈利用户的仓位。2025 年 10 月 10—11 日的大规模清算中，Hyperliquid 等多家平台触发了 ADL。' + cite('FTI Consulting：2025 年 10 月加密暴跌分析', 'https://www.fticonsulting.com/insights/articles/crypto-crash-october-2025-leverage-met-liquidity') + cite('Protos：Gauntlet 报告称 Hyperliquid ADL 造成超额损失', 'https://protos.com/outdated-algorithm-caused-650m-excess-losses-on-hyperliquid-report')]
])}

<h2>4. Perp DEX 的三种架构</h2>
${tbl(['架构', '代表', '定价', '对手方', '主要风险'], [
  ['链上订单簿 / 专用链', 'Hyperliquid、dYdX v4', '订单簿撮合', '其他交易者 + 做市金库', '验证者集中；金库被操纵（2025 年 3 月 Hyperliquid JELLY 事件）' + cite('CoinDesk：Hyperliquid 下架 JELLYJELLY', 'https://www.coindesk.com/markets/2025/03/26/hyperliquid-delists-jellyjelly-after-vault-squeezed-in-usd13m-tussle')],
  ['预言机定价 + 资金池', 'GMX、Jupiter Perps', '直接用预言机价格成交', 'LP 资金池', '预言机延迟套利；LP 承担交易者盈利'],
  ['虚拟 AMM', 'Perpetual Protocol v1', 'x·y=k 的虚拟池子', '协议本身', '价格偏离；资金不足']
])}
${call('deep', `<p>Hyperliquid 为什么快？它用自己的 L1 链（HyperBFT 共识），把订单簿和撮合放在共识层，一个区块不到 1 秒。代价是验证者数量少、去中心化程度低。这是 M04 不可能三角的又一个例子。</p>`)}

<h2>5. 故障与边界</h2>
${tbl(['风险', '预测市场', 'Perp DEX'], [
  ['预言机', '结果被错误裁决或被操纵投票', '标记价格延迟或被操纵'],
  ['流动性', '冷门市场无人做市，价差大', '小币种深度不足，强平引发连锁下跌'],
  ['监管', '多数地区视为博彩或衍生品', '衍生品监管；地域限制'],
  ['合约', '托管合约漏洞', '保证金合约、金库合约漏洞']
])}
${call('warn', '<p>本章不构成投资建议。杠杆交易可能在几分钟内损失全部保证金。预测市场在很多国家和地区受到法律限制。</p>')}

${terms([
  ['预测市场', 'Prediction Market', '交易未来事件结果份额的市场，价格反映概率'],
  ['完整集合', 'Complete Set', '1 YES + 1 NO，可随时兑换 1 单位抵押品'],
  ['LMSR', 'Logarithmic Market Scoring Rule', '基于对数成本函数的预测市场做市算法'],
  ['乐观预言机', 'Optimistic Oracle', '默认接受提议结果、有争议才投票的预言机'],
  ['永续合约', 'Perpetual Futures', '无到期日、用资金费率锚定现货的合约'],
  ['标记价格', 'Mark Price', '用于计算盈亏和强平的公允价格'],
  ['资金费率', 'Funding Rate', '多空双方定期互付的费率'],
  ['强平', 'Liquidation', '保证金不足时系统强制平仓'],
  ['保险基金', 'Insurance Fund', '覆盖穿仓亏损的资金池'],
  ['自动减仓', 'ADL, Auto-Deleveraging', '保险基金不足时强制减少盈利方仓位']
])}
${qs(['在<a href="#lab-lmsr">LMSR 实验</a>中，b = 100 时买入 100 份 YES，价格变成多少？把 b 改成 1,000 再试。做市商的最大亏损分别是多少？', '在<a href="#lab-perp">永续实验</a>中，10x 和 50x 多头的强平价格距离开仓价各是多少百分比？', '为什么强平用标记价格而不用最新成交价？'])}
` });
