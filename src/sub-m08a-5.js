/* ---------- M11 子文章（m08a 第 5 部分）：Polymarket 架构拆解 ---------- */
(() => {
CUR = 'm08-5';
addCh({ id: 'm08-5', nav: 'Polymarket 架构', title: 'M11.5 Polymarket 架构拆解：链下撮合、链上结算', desc: 'CTF 条件代币、EIP-712 订单、matchOrders、UMA 适配器，一条链路走通', html: `
<h1>M11.5 Polymarket 架构拆解：链下撮合、链上结算</h1>
${meta(['画出 Polymarket 的混合式架构，说清哪些步骤在链下、哪些在链上，以及“非托管”靠什么保证。', '计算 CTF 的 conditionId 与 positionId，并说出 split、merge、redeem 和 reportPayouts 的调用时机。', '构造一张 EIP-712 订单，解释交易所合约的三种撮合类型，并与纯链上 AMM 方案对比。'], '<a href="#m08-2">M11.2 交易与套利</a>、<a href="#m08-4">M11.4 结算与预言机</a>；了解 <a href="#m07">M03 Web3 大前端</a>中的签名部分更佳')}
${beginner(`<p><strong>Polygon</strong>：一条与以太坊兼容的区块链，手续费远低于以太坊主网。Polymarket 的合约部署在 Polygon PoS 上（链 ID 137）。</p>
<p><strong>ERC-1155</strong>：一种“多代币”标准。一个合约里可以有很多种代币，每种用一个 uint256 编号（tokenId）区分。Polymarket 的每个 YES / NO 份额都是同一个 ERC-1155 合约里的一个 tokenId。</p>
<p><strong>EIP-712</strong>：一种“结构化数据签名”标准。钱包会把签名内容按字段显示给用户，而不是一串看不懂的十六进制。</p>
<p><strong>非托管（Non-custodial）</strong>：平台不掌握你的私钥，不能在你没签名的情况下动你的资产。</p>
<p><strong>撮合（Matching）</strong>：把价格相容的买单和卖单配对成交。</p>`)}

<h2>1. 一句话理解</h2>
${one('Polymarket 把“快但需要信任”的撮合放在链下，把“慢但不能出错”的资产托管、成交交割和结算放在链上；用户签名的订单是两者之间的桥梁，撮合方只能按用户签过的条件成交。')}
${call('analogy', `<p>像一家拍卖行的“委托书”制度：你在委托书上签字写明“最高 0.62 买 100 份”，交给拍卖师（链下撮合）。拍卖师负责找到对手方，但钱和货都存在银行保险柜（链上合约）里。交割时，银行只认你的签字，并且只按委托书的条件执行。拍卖师可以拒绝或延迟处理你的委托，但不能篡改价格。</p>
<p><strong>类比的局限</strong>：拍卖师可以选择“先处理谁的委托”，这在链下撮合中同样存在：撮合方有排序权，可能被滥用或宕机。用户的保护是：随时可以在链上撤销委托，并且资产始终在自己的地址里。</p>`)}
${art('一图看懂：撮合在链下，资产和交割在链上，用户签名是两边的桥', 660, 356, [
  S.zone(10, 24, 220, 126, { t: '链下（快，要信任）' }),
  S.box(22, 52, 196, 84, { k: 'idle', icon: 'server', t: '撮合引擎 + 运营方', s: '配对订单，提交成交\n只能按签名条件成交' }),
  S.box(10, 196, 220, 70, { k: 'warn', icon: 'wallet', t: '用户钱包', s: '私钥在自己手里，签订单' }),
  S.arrow(120, 194, 120, 138, { k: 'warn', label: '签名订单' }),
  S.zone(364, 24, 286, 300, { t: '链上 Polygon（慢，可验证）' }),
  S.box(378, 54, 258, 60, { k: 'key', icon: 'check', t: 'CTF Exchange', s: '验签，按签名条件交割' }),
  S.box(378, 152, 258, 60, { k: 'ok', icon: 'db', t: 'CTF 合约 + USDC', s: '份额与抵押品都存在这里' }),
  S.box(378, 250, 258, 60, { k: 'info', icon: 'globe', t: 'UMA 适配器 + 预言机', s: '提议结果后 reportPayouts' }),
  S.arrow(507, 116, 507, 150, { k: 'plain' }),
  S.arrow(507, 248, 507, 214, { k: 'plain' }),
  S.arrow(220, 90, 376, 84, { k: 'key', label: '提交成交' }),
  S.route([[232, 231], [300, 231], [300, 182], [376, 182]], { k: 'ok', dash: 1, label: '直接调用', ls: 11 }),
  S.text(330, 344, '撮合方只能按你签过的条件成交；资金始终在链上合约和你自己手里', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '签名订单交给撮合引擎配对，运营方调用 matchOrders，交易所合约验签后转移份额和 USDC。'],
  ['key', '链下只决定“谁和谁成交”，资产转移必须通过合约验证你的签名，所以撮合方不能伪造成交。'],
  ['fail', '撮合服务宕机时不能下新单，但你可以绕开它，直接调用 CTF 合约 merge 或结算后 redeem。'],
  ['risk', '运营方有排序权，可能延迟某些订单；这是“非托管 + 中心化撮合”的折中。']
], '用户钱包签名订单交给链下撮合引擎，运营方把成交提交到链上的 CTF Exchange 合约，由合约验签并交割份额与 USDC。用户也可以绕开运营方直接调用 CTF 合约。', 'm08-5')}

<h2>2. 混合式架构总览</h2>
${mm('Polymarket 混合式架构', `
flowchart TB
  subgraph SOFF["链下"]
    UI["网页 / App"] --> API["CLOB API<br/>订单簿与撮合引擎"]
    API --> OP["运营方 Operator<br/>批量提交成交"]
  end
  subgraph SON["Polygon 链上"]
    EX["CTF Exchange 合约<br/>验签并交割"]
    CTF["条件代币合约 CTF<br/>ERC-1155 份额"]
    USDC["USDC 抵押品"]
    AD["UMA CTF 适配器"]
    OO["UMA 乐观预言机"]
  end
  W["用户钱包<br/>EOA 或代理钱包"] -->|"EIP-712 签名订单"| UI
  OP -->|"matchOrders"| EX
  EX -->|"转移份额或 split / merge"| CTF
  EX -->|"转移 USDC"| USDC
  CTF --- USDC
  AD -->|"请求结果"| OO
  OO -->|"结果"| AD
  AD -->|"reportPayouts"| CTF
  W -->|"redeemPositions 赎回"| CTF
`, [
  ['flow', '下单：钱包签名 → API。成交：撮合引擎配对 → 运营方调用 matchOrders → 交易所合约验签、转移资产。结算：适配器从 UMA 拿结果 → 写入 CTF → 用户赎回。'],
  ['key', '链下只负责“谁和谁成交”。资产转移必须经过合约验证用户签名，所以撮合方不能伪造成交。'],
  ['fail', 'API 或运营方宕机时，用户无法下新单，但资产仍在链上；用户可以直接调用 CTF 合约 merge 或在结算后 redeem。'],
  ['risk', '运营方掌握成交排序权，可能选择性延迟某些订单。合约层面无法完全防止，只能靠透明度和信誉约束。'],
  ['limit', '这不是“完全去中心化交易所”。它是“非托管 + 中心化撮合”的折中，用信任换取交易体验。']
])}
${tbl(['环节', '位置', '原因'], [
  ['挂单、撤单（常规）', '链下', '每秒大量变更，上链成本和延迟都不可接受'],
  ['撮合', '链下', '需要毫秒级响应'],
  ['成交交割', '链上', '资产转移必须可验证、不可篡改'],
  ['份额铸造 / 合并 / 赎回', '链上', '抵押品托管的核心'],
  ['结算结果', '链上（UMA）', '需要公开、可争议'],
  ['紧急撤单', '链上', '用户不依赖平台即可让旧签名失效']
])}

<h2>3. 条件代币框架 CTF</h2>
<p><strong>条件代币框架（Conditional Tokens Framework, CTF）</strong>由 Gnosis 开发，是一个通用的 ERC-1155 合约，用来表示“在某条件下才有价值”的代币。Polymarket 的所有份额都由它管理。</p>
<h3>3.1 三个 ID</h3>
${steps(['<strong>conditionId</strong>（条件 ID）：标识一个问题。conditionId = keccak256(oracle, questionId, outcomeSlotCount)。oracle 是唯一有权报告结果的地址（Polymarket 中是 UMA 适配器），questionId 是问题的唯一标识，outcomeSlotCount 是结果数（二元市场为 2）。', '<strong>indexSet</strong>（结果集合位图）：用二进制位表示“哪些结果”。二元市场中 YES = 0b01 = 1，NO = 0b10 = 2，“YES 或 NO” = 0b11 = 3。', '<strong>collectionId</strong>（集合 ID）：由 parentCollectionId、conditionId、indexSet 计算。不嵌套条件时 parentCollectionId = 0。', '<strong>positionId</strong>（头寸 ID）：positionId = uint256(keccak256(collateralToken, collectionId))。这就是 ERC-1155 的 tokenId，也是 CLOB API 里的 token_id。'])}
${call('info', `<p>同一个问题，用不同的抵押品（例如另一种稳定币）铸造出来的 YES 是<strong>不同的 tokenId</strong>，不能互相合并。positionId 把抵押品也编码进去，就是为了防止混用。</p>`)}
<h3>3.2 四个核心函数</h3>
${tbl(['函数', '调用者', '作用'], [
  ['prepareCondition(oracle, questionId, outcomeSlotCount)', '市场创建者（适配器）', '登记一个新条件，之后才能铸造份额'],
  ['splitPosition(collateral, parentCollectionId, conditionId, partition, amount)', '任何人', '锁入 amount 抵押品，按 partition（例如 [1, 2]）铸造各结果份额各 amount 份'],
  ['mergePositions(同上参数)', '任何人', 'split 的逆操作：交回各结果份额，取回抵押品'],
  ['reportPayouts(questionId, payouts)', '只能是 oracle 地址', '写入结果，例如 YES 为真时 payouts = [1, 0]'],
  ['redeemPositions(collateral, parentCollectionId, conditionId, indexSets)', '份额持有人', '按 payouts 比例兑付抵押品，份额被销毁']
])}
<p><strong>算一算（示例）</strong>：payouts = [1, 1]（50-50 结算）。你持有 300 YES 和 100 NO。每份兑付 = 该结果的 payout / payout 总和 = 1/2。赎回得到 (300 + 100) × 0.5 = 200 USDC。如果 payouts = [1, 0]，你得到 300 USDC，NO 份额兑 0。</p>
${mm('CTF 中一个二元市场的完整生命周期', `
sequenceDiagram
  participant A as UMA 适配器
  participant C as CTF 合约
  participant U as 用户
  participant O as UMA 预言机
  A->>C: prepareCondition 适配器地址 questionId 2
  A->>O: 发起价格请求
  U->>C: splitPosition 存入 100 USDC
  C-->>U: 100 YES 和 100 NO
  U->>C: mergePositions 交回 40 YES 和 40 NO
  C-->>U: 40 USDC
  O-->>A: 结果为 YES
  A->>C: reportPayouts questionId 数组 1 和 0
  U->>C: redeemPositions
  C-->>U: 60 YES 兑 60 USDC，NO 兑 0
`, [
  ['flow', 'prepareCondition 必须先于 split；reportPayouts 必须先于 redeem。merge 只在结算前有意义。'],
  ['key', '只有 prepareCondition 时登记的 oracle 地址能调用 reportPayouts。这条规则决定了“谁说了算”。'],
  ['fail', '如果 oracle 地址是一个有漏洞或被盗的合约，攻击者可以写入任意结果。适配器合约是安全审计重点。'],
  ['limit', 'CTF 本身不提供交易功能。交易由交易所合约或 AMM 在它之上实现。']
])}

<h2>4. 订单签名与链上成交</h2>
<h3>4.1 EIP-712 订单</h3>
<p>用户的每张限价单都是一份 EIP-712 结构化签名。字段如下（根据 Polymarket 开源的 CTF Exchange 合约，以官方仓库为准）：</p>
${tbl(['字段', '含义'], [
  ['salt', '随机数，让两张内容相同的订单哈希不同'],
  ['maker', '资金来源地址（代理钱包时是代理合约地址）'],
  ['signer', '实际签名的地址'],
  ['taker', '指定对手方；0 地址表示任何人'],
  ['tokenId', '要买或卖的 positionId'],
  ['makerAmount', '你付出的数量（买单是 USDC，卖单是份额）'],
  ['takerAmount', '你希望得到的数量（买单是份额，卖单是 USDC）'],
  ['expiration', '过期时间（Unix 秒，0 表示不过期）'],
  ['nonce', '用于批量撤单：链上提高 nonce 后，旧 nonce 的订单全部失效'],
  ['feeRateBps', '该订单接受的手续费率（基点）'],
  ['side', '0 = BUY，1 = SELL'],
  ['signatureType', '0 = EOA（EOA 直接签名），1 = POLY_PROXY（Polymarket 代理钱包），2 = POLY_GNOSIS_SAFE（Gnosis Safe 钱包）；仓库新版本还增加了 3 = POLY_1271（合约钱包的 ERC-1271 签名）']
])}
<p><strong>算一算（示例）</strong>：以 0.62 买入 100 份 YES。USDC 和 CTF 份额都使用 6 位小数。</p>
${steps(['side = BUY；makerAmount = 0.62 × 100 × 10⁶ = 62,000,000（付出 62 USDC）。', 'takerAmount = 100 × 10⁶ = 100,000,000（得到 100 份 YES）。', '限价 = makerAmount / takerAmount = 0.62。合约保证你的实际成交价不差于这个比例。', '若以 0.62 卖出 100 份 YES：side = SELL，makerAmount = 100,000,000（份额），takerAmount = 62,000,000（USDC）。'])}
${code('TYPESCRIPT', `
// 用 ethers v6 构造并签名一张订单（结构示意；生产请使用官方 @polymarket/clob-client）
import { Wallet, TypedDataDomain } from "ethers";

const domain: TypedDataDomain = {
  name: "Polymarket CTF Exchange",
  version: "1",
  chainId: 137,
  verifyingContract: "0xEXCHANGE_ADDRESS", // 以官方文档公布的交易所地址为准
};

const types = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "signer", type: "address" },
    { name: "taker", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "feeRateBps", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "signatureType", type: "uint8" },
  ],
};

async function signBuy(wallet: Wallet, tokenId: string, price: number, size: number) {
  const order = {
    salt: BigInt(Math.floor(Math.random() * 1e15)),
    maker: wallet.address,
    signer: wallet.address,
    taker: "0x0000000000000000000000000000000000000000",
    tokenId: BigInt(tokenId),
    makerAmount: BigInt(Math.round(price * size * 1e6)), // 付出 USDC
    takerAmount: BigInt(Math.round(size * 1e6)),         // 得到份额
    expiration: 0n,
    nonce: 0n,
    feeRateBps: 0n,
    side: 0,          // BUY
    signatureType: 0, // EOA
  };
  const signature = await wallet.signTypedData(domain, types, order);
  return { ...order, signature }; // 提交给 CLOB API，平台不接触私钥
}
`)}
<h3>4.2 交易所合约的三种撮合类型</h3>
<p>运营方调用交易所合约的 <code>matchOrders(takerOrder, makerOrders, takerFillAmount, makerFillAmounts)</code>（只有被授权的运营方地址可以调用）。合约逐一验证签名、过期时间、nonce、价格是否相容，然后按订单组合选择交割方式：</p>
${tbl(['类型', '订单组合', '合约做什么', '示例'], [
  ['普通成交（COMPLEMENTARY）', '一买一卖，同一个 tokenId', '直接互换：买方 USDC → 卖方，卖方份额 → 买方', '甲买 YES @ 0.62，乙卖 YES @ 0.62'],
  ['铸造（MINT）', '两张买单，分别买 YES 和 NO', '收取双方 USDC，调用 split 铸造完整集合，各给一边', '甲买 YES @ 0.62，乙买 NO @ 0.38，合计 1'],
  ['合并（MERGE）', '两张卖单，分别卖 YES 和 NO', '收取双方份额，调用 merge 取回 USDC，按价格分给双方', '甲卖 YES @ 0.60，乙卖 NO @ 0.40']
])}
${mm('一张买单从签名到链上成交', `
sequenceDiagram
  participant U as 用户钱包
  participant API as CLOB API
  participant ME as 撮合引擎
  participant OP as 运营方
  participant EX as CTF Exchange
  participant CTF as CTF 合约
  U->>API: 提交签名订单 买 YES 0.62 共 100 份
  API->>API: 校验签名 余额 授权
  API->>ME: 进入订单簿
  ME->>ME: 找到对手单 买 NO 0.38
  ME->>OP: 生成成交批次
  OP->>EX: matchOrders
  EX->>EX: 验签 检查 nonce 与过期时间
  EX->>CTF: splitPosition 100 USDC
  CTF-->>EX: 100 YES 和 100 NO
  EX-->>U: 转入 100 YES
  EX-->>OP: 发出 OrdersMatched 事件
  API-->>U: 推送成交回报
`, [
  ['flow', '链下环节到“生成成交批次”为止；从 matchOrders 开始全部在链上，可在区块浏览器查到。'],
  ['key', '用户必须事先对交易所合约做 USDC 和 CTF 份额的授权（approve / setApprovalForAll），合约才能代为转移。'],
  ['fail', '链上交易失败（例如用户在撮合后转走了余额）时，链下已显示的成交需要回滚。API 层要处理这种不一致。'],
  ['risk', '授权给交易所合约的额度是风险敞口。若合约有漏洞，被授权的资产都有风险。']
])}
${call('info', `<p><strong>非托管怎样保证</strong>：① 资产在用户地址（或用户控制的代理钱包）里，不在平台账户里；② 交易所合约只按用户签名的价格和数量成交；③ 用户可以在链上调用撤单或提高 nonce，让旧订单失效，不需要平台配合。</p>`)}
<h3>4.3 多结果市场与 NegRisk</h3>
<p>Polymarket 的多结果事件（例如“谁会赢得某奖项”）由多个二元市场组成，每个候选一个 YES / NO 市场。<strong>NegRisk 适配器</strong>允许把“某个候选的 NO”转换成“其他所有候选的 YES”。这个转换通道让各候选的 YES 价格之和被约束在 1 附近，原理见 <a href="#m08-2">M11.2 多结果市场</a>。</p>

<h2>5. 抵押品、结算与方案对比</h2>
<h3>5.1 USDC 抵押品</h3>
<p>Polymarket 长期用 Polygon 上的桥接版 USDC（USDC.e）作为抵押品；2026 年 4 月宣布以自有抵押代币 Polymarket USD（pUSD，按 1:1 由 USDC 支持）取代 USDC.e。${cite('Cointelegraph：Polymarket 以 USDC 支持的新代币取代 USDC.e', 'https://cointelegraph.com/news/polymarket-replace-usdce-usdc-backed-token-exchange-upgrade')}这意味着系统依赖 Circle 的 USDC 发行与冻结能力，在使用桥接资产期间还依赖跨链桥的安全性。稳定币风险见 <a href="#m02-9">M08.1 稳定币</a>。</p>
<h3>5.2 UMA 适配器结算</h3>
${steps(['<strong>初始化</strong>：适配器的 initialize 接收问题描述（ancillaryData）、奖励、提议保证金、挑战期，计算 questionId，并调用 CTF 的 prepareCondition（oracle = 适配器自己）。', '<strong>请求</strong>：适配器向 UMA 乐观预言机发起 YES_OR_NO_QUERY 类型的请求。', '<strong>提议与挑战</strong>：流程见 <a href="#m08-4">M11.4</a>。第一次争议会重置请求；第二次争议升级到 DVM 投票。', '<strong>结算</strong>：任何人调用适配器的 resolve，适配器读取结果并转换：YES → [1, 0]，NO → [0, 1]，50-50 → [1, 1]，再调用 reportPayouts。', '<strong>赎回</strong>：用户调用 CTF 的 redeemPositions 领取 USDC。'])}
<h3>5.3 与纯链上 AMM 预测市场对比</h3>
${tbl(['维度', 'Polymarket（链下 CLOB + 链上结算）', '纯链上 AMM（例如 FPMM 方案）'], [
  ['撮合位置', '链下，毫秒级', '链上，每笔一个区块'],
  ['下单成本', '挂单免 Gas，成交由运营方提交', '每笔交易付 Gas'],
  ['价差', '专业做市商可报很窄的价差', '取决于池子深度，冷门市场滑点大'],
  ['冷启动', '需要做市商或奖励', '有 LP 资金即可交易'],
  ['信任假设', '信任运营方不审查、不宕机', '只信任合约和预言机'],
  ['抗审查', '运营方可以拒绝订单、地域屏蔽', '任何人都可以直接调用合约'],
  ['资产托管', '非托管（合约 + 签名）', '非托管（合约）']
])}
<h3>5.4 监管与地域限制（截至 2026 年公开资料）</h3>
${steps(['2022 年 1 月：Polymarket 与美国 CFTC 和解，支付 140 万美元罚款，并开始限制美国用户访问其国际平台。' + cite('CFTC：Polymarket 和解新闻稿', 'https://www.cftc.gov/PressRoom/PressReleases/8478-22'), '2024 年：美国大选相关市场成交量达到数十亿美元级（总统大选主市场约 36 亿美元），平台成为主流媒体引用的概率来源之一，同时引发更多监管关注。' + cite('Decrypt：Polymarket 结算美国大选市场', 'https://decrypt.co/290374/polymarket-donald-trump-us-presidential-election'), '2025 年 7 月：公开报道显示，美国司法部和 CFTC 结束了对其的调查；Polymarket 宣布以约 1.12 亿美元收购持有 CFTC 牌照的交易所与清算机构 QCEX，为重新面向美国用户提供合规产品做准备。' + cite('The Block：Polymarket 收购 QCEX', 'https://www.theblock.co/post/363623/polymarket-plans-to-re-enter-us-with-acquisition-of-derivatives-exchange-qcex'), '多个国家和地区的监管机构对其采取了访问限制。受限地区名单会变化，以平台官方公布的受限地区列表为准。', '工程启示：面向全球的预测市场平台必须把“地域限制、KYC 层级、可交易市场类型”做成可配置的合规模块，而不是写死在代码里。'])}
${call('warn', `<p>不要用 VPN 等方式绕过地域限制。这可能违反平台条款和当地法律，账户和资金可能被冻结。本手册不构成法律建议。</p>`)}

<h2>6. 工程层：索引链上数据</h2>
<p>无论你是做数据看板、套利机器人，还是自建同类平台，都需要索引 CTF 与交易所合约的事件。核心事件（名称来自开源合约）：</p>
${tbl(['合约', '事件', '用途'], [
  ['CTF', 'ConditionPreparation', '发现新市场'],
  ['CTF', 'PositionSplit / PositionsMerge', '统计铸造与合并，计算未平仓量'],
  ['CTF', 'ConditionResolution', '市场结算结果'],
  ['CTF', 'PayoutRedemption', '用户赎回记录'],
  ['CTF Exchange', 'OrderFilled / OrdersMatched', '成交明细，计算成交量和价格'],
  ['CTF Exchange', 'OrderCancelled', '链上撤单']
])}
${code('SQL', `
-- 成交明细（从 OrderFilled 事件解析，示例）
CREATE TABLE fills (
  chain_id       INT NOT NULL DEFAULT 137,
  tx_hash        BYTEA NOT NULL,
  log_index      INT NOT NULL,
  block_number   BIGINT NOT NULL,
  order_hash     BYTEA NOT NULL,
  maker          BYTEA NOT NULL,
  taker          BYTEA NOT NULL,
  maker_asset_id NUMERIC(78,0) NOT NULL,   -- 0 表示 USDC，否则为 positionId
  taker_asset_id NUMERIC(78,0) NOT NULL,
  maker_filled   NUMERIC(38,0) NOT NULL,   -- 6 位小数的原始整数
  taker_filled   NUMERIC(38,0) NOT NULL,
  fee            NUMERIC(38,0) NOT NULL,
  PRIMARY KEY (chain_id, tx_hash, log_index) -- 幂等：重复消费同一日志不会重复入库
);
`)}
${tryit(`<p><strong>任务：在区块浏览器里追踪一笔真实成交。</strong></p>
<ol><li>打开 polygonscan.com，搜索 Polymarket 的 CTF Exchange 合约（地址以 Polymarket 官方文档为准）。</li>
<li>在 Transactions 页找一笔调用 <code>matchOrders</code> 的交易，打开 Logs 标签。</li>
<li>找到 OrderFilled 事件，记录 makerAssetId、takerAssetId、makerAmountFilled、takerAmountFilled。</li>
<li>计算成交价：USDC 数量 / 份额数量（两者都除以 10⁶）。</li>
<li>预期结果：你得到一个 0 到 1 之间的价格；如果同一笔交易里还有 PositionSplit 事件，说明这是一笔 MINT 类型的撮合。</li></ol>`)}
${mistakes([
  ['Polymarket 是完全去中心化的交易所', '资产托管和结算在链上，撮合在链下由运营方完成。它是“非托管 + 中心化撮合”的混合架构。'],
  ['平台可以随意挪用用户资金', '交易所合约只按用户签名的订单转移资产；资产在用户地址或用户控制的代理钱包中。真正的风险是合约漏洞和授权额度。'],
  ['YES 份额是 ERC-20 代币', 'YES / NO 份额是 CTF 合约中的 ERC-1155 tokenId，即 positionId。'],
  ['两个买单无法互相成交', '买 YES 和买 NO 的价格之和 ≥ 1 时，交易所合约可以收取双方 USDC 铸造完整集合，这就是 MINT 撮合。']
])}
${recap([
  '混合式架构：链下 CLOB 撮合 + Polygon 链上交割与结算；签名订单连接两者。',
  'CTF：conditionId = hash(oracle, questionId, 结果数)；positionId = hash(抵押品, collectionId)，即 ERC-1155 tokenId。',
  'split / merge 在结算前互换抵押品与完整集合；reportPayouts 只能由 oracle 调用；redeem 按 payouts 兑付。',
  'EIP-712 订单包含 makerAmount / takerAmount / nonce / side / signatureType；限价 = 两个数量之比。',
  'matchOrders 支持普通成交、MINT（两张买单）、MERGE（两张卖单）。',
  'UMA 适配器把 YES / NO / 50-50 转成 payouts 数组；监管与地域限制要做成可配置的合规模块。'
])}
${quiz([
  { q: '在 Polymarket 中，下面哪一步在链下完成？', o: ['订单撮合', '份额铸造 split', '结算结果写入 reportPayouts', '用户赎回 redeem'], a: 0, why: '撮合由链下引擎完成；split、reportPayouts、redeem 都是链上合约调用。' },
  { q: '以 0.40 买入 50 份 NO，订单的 makerAmount 和 takerAmount（6 位小数）应是？', o: ['makerAmount = 50,000,000，takerAmount = 20,000,000', 'makerAmount = 40,000,000，takerAmount = 50,000,000', 'makerAmount = 20,000,000，takerAmount = 50,000,000', 'makerAmount = 50,000,000，takerAmount = 40,000,000'], a: 2, why: '买单付出 USDC：0.40 × 50 = 20 USDC = 20,000,000；得到 50 份 = 50,000,000。' },
  { q: '甲挂买 YES @ 0.55，乙挂买 NO @ 0.45。交易所合约会用哪种方式成交？', o: ['普通成交', 'MERGE', '无法成交', 'MINT：收取 1 USDC 铸造完整集合，各给一边'], a: 3, why: '两张买单、价格之和 = 1，合约收取双方 USDC 调用 split，YES 给甲、NO 给乙。' },
  { q: '为什么 positionId 的计算要包含抵押品地址？', o: ['为了节省 Gas', '防止用不同抵押品铸造的份额被混用', '为了让份额可以跨链', '因为 ERC-1155 强制要求'], a: 1, why: '不同抵押品支持的份额价值不同，必须是不同的 tokenId，不能互相合并或赎回。' }
])}
${exercises([["计算题（示例）：你想以 0.35 卖出 200 份 NO。USDC 和份额都用 6 位小数。写出订单的 side、makerAmount 和 takerAmount，并算出隐含限价。", "<p>side = SELL。卖单付出的是份额：makerAmount = 200 × 10⁶ = <strong>200,000,000</strong>。得到的是 USDC：takerAmount = 0.35 × 200 × 10⁶ = <strong>70,000,000</strong>。限价 = 70,000,000 ÷ 200,000,000 = 0.35。合约保证成交价不差于这个比例。</p>"], ["思考题：下面三组订单分别会走哪种撮合类型？①甲买 YES @ 0.55，乙卖 YES @ 0.55；②甲买 YES @ 0.57，乙买 NO @ 0.43；③甲卖 YES @ 0.62，乙卖 NO @ 0.38。", "<p>①是同一 tokenId 的一买一卖，走<strong>普通成交（COMPLEMENTARY）</strong>，直接互换 USDC 和份额。②是两张买单，价格之和为 1，走 <strong>MINT</strong>：合约收取双方 USDC 调用 split，YES 给甲，NO 给乙。③是两张卖单，价格之和为 1，走 <strong>MERGE</strong>：合约收取双方份额调用 merge，按价格把 USDC 分给双方。</p>"], ["思考题：如果 CLOB API 和运营方同时宕机，用户的资产安全吗？用户能做什么，不能做什么？", "<p>资产仍在用户地址或用户控制的代理钱包里，平台动不了。用户可以在链上撤单或提高 nonce，让旧签名订单失效。持有成对份额时，可以直接调用 CTF 的 mergePositions 换回 USDC；结算后可以调用 redeemPositions 赎回。用户不能下新单，也无法让别人和自己成交。</p>"]])}
${checklist(["能画出混合式架构，并标出撮合、交割、份额铸造、结算各在链下还是链上。", "能说出 conditionId、collectionId、positionId 的计算输入，并解释 positionId 为什么包含抵押品地址。", "能按 6 位小数写出买单和卖单的 makerAmount 与 takerAmount。", "能根据订单组合判断交易所合约走普通成交、MINT 还是 MERGE。", "能说出 UMA 适配器把 YES、NO、50-50 分别转换成哪个 payouts 数组，以及谁能调用 reportPayouts。"])}
${terms([
  ['条件代币框架', 'CTF, Conditional Tokens Framework', 'Gnosis 开发的 ERC-1155 合约，用于表示有条件兑付的份额'],
  ['条件 ID', 'conditionId', 'hash(oracle, questionId, 结果数)，标识一个问题'],
  ['头寸 ID', 'positionId', 'hash(抵押品, collectionId)，即份额的 ERC-1155 tokenId'],
  ['结果位图', 'indexSet', '用二进制位表示一组结果，例如 YES = 1、NO = 2'],
  ['兑付向量', 'Payouts', 'oracle 写入的各结果兑付比例，例如 [1, 0]'],
  ['混合式交易所', 'Hybrid Exchange', '链下撮合、链上交割的交易所架构'],
  ['运营方', 'Operator', '有权向交易所合约提交成交批次的地址'],
  ['MINT / MERGE 撮合', 'Mint / Merge Match', '两张买单铸造完整集合成交，或两张卖单合并完整集合成交'],
  ['NegRisk 适配器', 'NegRisk Adapter', '把一个结果的 NO 转换为其他所有结果 YES 的合约，用于多结果事件']
])}
` });
})();
