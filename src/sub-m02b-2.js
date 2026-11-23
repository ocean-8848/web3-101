/* ---------- M02 子文章（m02b-2）：稳定币 / AMM 深入 ---------- */
(() => {
CUR = 'm02-9';
addCh({ id: 'm02-9', nav: '稳定币', title: 'M06.1 稳定币：法币抵押、超额抵押、算法与工程集成', desc: '三类稳定币如何维持 1 美元，为什么会脱锚，集成时要注意什么', html: `
<h1>M06.1 稳定币：法币抵押、超额抵押、算法与工程集成</h1>
${meta(['说清三类稳定币各自靠什么维持 1 美元，以及各自的失败方式。', '用 MakerDAO 的 CDP 模型算出清算价格，并解释稳定费和 PSM 的作用。', '在合约和后端集成稳定币时，正确处理精度、黑名单、可升级风险和脱锚。'], '<a href="#m02-5">M02.5 ERC-20 与授权</a>、<a href="#m13">M06 总览</a>')}
${beginner(`<p><strong>锚定（Peg）</strong>：稳定币承诺的目标价格，通常是 1 美元。价格明显偏离目标叫<strong>脱锚（Depeg）</strong>。</p>
<p><strong>储备（Reserve）</strong>：发行方为支撑稳定币持有的资产，例如现金和短期美国国债。</p>
<p><strong>铸造 / 赎回（Mint / Redeem）</strong>：用 1 美元换 1 枚新币叫铸造；把币交回、拿回 1 美元叫赎回。</p>
<p><strong>抵押率（Collateral Ratio）</strong>：抵押品价值 ÷ 借出的稳定币价值。150% 表示每借 100 美元要抵押 150 美元的资产。</p>
<p><strong>套利（Arbitrage）</strong>：在两个地方以不同价格同时买卖同一资产赚差价。套利者是把价格拉回 1 美元的主要力量。</p>`)}

<h2>1. 一句话理解</h2>
${one('稳定币是“价格盯住 1 美元的代币”。它能否守住 1 美元，取决于两件事：背后有没有足够的资产，以及有没有人能低买高卖把价格拉回来。')}
${call('analogy', `<p>稳定币像游乐场的代币：入口用 1 元换 1 枚，出口用 1 枚换回 1 元。只要出口一直能兑换，场内代币就值 1 元。如果有一天大家怀疑出口的钱箱是空的，所有人都会挤去出口，场内代币立刻打折。</p>
<p>比喻的局限：游乐场代币只在场内用；稳定币在全球 7×24 小时流通，一次挤兑可能在几小时内发生。</p>`)}
${art('一图看懂：稳定币的 1 美元，靠“出口永远能兑换 1 美元”撑住', 660, 372, [
  S.box(10, 36, 190, 70, { k: 'warn', t: '市价 0.99 美元', s: '套利者买入，找发行方\n赎回 1 美元', icon: 'chart' }),
  S.box(235, 36, 190, 70, { k: 'key', t: '1 枚 ＝ 1 美元', s: '发行方的铸造 / 赎回口', icon: 'bank' }),
  S.box(460, 36, 190, 70, { k: 'warn', t: '市价 1.01 美元', s: '套利者 1 美元铸造，\n再到市场卖出', icon: 'chart' }),
  S.arrow(202, 71, 233, 71, { k: 'warn' }),
  S.arrow(458, 71, 427, 71, { k: 'warn' }),
  S.route([[300, 108], [300, 132], [105, 132], [105, 158]], { k: 'plain' }),
  S.arrow(330, 108, 330, 156, { k: 'plain' }),
  S.route([[360, 108], [360, 132], [555, 132], [555, 158]], { k: 'plain' }),
  S.box(10, 160, 190, 94, { k: 'info', icon: 'bank', t: '法币抵押', s: 'USDC、USDT\n银行现金 + 短期国债\n信任：发行方' }),
  S.box(235, 160, 190, 94, { k: 'info', icon: 'lock', t: '超额抵押', s: 'DAI\n链上 ETH 抵押率 ≥ 150%\n信任：合约与预言机' }),
  S.box(460, 160, 190, 94, { k: 'info', icon: 'scale', t: '合成对冲', s: 'USDe\n现货 ETH + 永续空单\n信任：对冲与资金费率' }),
  S.text(330, 282, '三种“储备”，回答同一个问题：所有人同时赎回，钱从哪里来？', { size: 13.5, b: 1, anchor: 'middle', mw: 620 }),
  S.box(10, 304, 640, 54, { k: 'risk', icon: 'warn', t: '出口一堵，币价就离开 1 美元', s: 'USDC 2023 年 3 月：约 33 亿美元储备存于硅谷银行，价格最低约 0.87 美元' })
], [
  ['flow', '币价偏离 1 美元，套利者就从兑换口赚差价，把价格拉回去；这个机制只在兑换口畅通时有效。'],
  ['key', '三类稳定币的区别只在“兑换口背后的钱”放在哪里：银行、链上合约，还是对冲头寸。'],
  ['risk', '兑换口一旦堵住（银行倒闭、抵押品暴跌、费率转负），套利停止，币价就会脱锚。'],
  ['limit', '图中的价格和抵押率是示例或文中数据；没有一种设计同时做到去中心化、资本高效、绝对稳定。']
], '中间是 1 枚等于 1 美元的兑换口，币价低于或高于 1 美元时套利者从两侧靠近它；下方是支撑兑换口的三类储备：法币抵押、超额抵押、合成对冲；底部红框提示兑换口一旦堵住就会脱锚。', 'm02-9')}

<h2>2. 为什么需要稳定币，以及三种设计</h2>
<p>加密资产价格波动大：ETH 一天涨跌 10% 并不罕见。交易、借贷、支付、记账都需要一个“价格稳定的计价单位”。稳定币让链上拥有美元，同时保留链上资产的特点：24 小时转账、可编程、能直接放进 DeFi 合约。截至 2026 年 11 月，据 DefiLlama 统计，美元稳定币总市值约 2,800 亿美元，其中 USDT 约 1,740 亿、USDC 约 690 亿，两者合计占八成以上。${cite('DefiLlama：Stablecoins', 'https://defillama.com/stablecoins')}</p>
${tbl(['类型', '代表', '1 美元靠什么', '主要风险'], [
  ['法币抵押', 'USDT、USDC、PYUSD', '发行方银行账户里的现金与短期国债，1:1 赎回', '托管银行、发行方信用、监管冻结'],
  ['加密超额抵押', 'DAI / USDS（MakerDAO，2024 年 8 月更名 Sky）、LUSD' + cite('The Block：MakerDAO 更名 Sky，DAI 可升级为 USDS', 'https://www.theblock.co/post/313235/makerdao-mkr-sky-dai-stablecoin-usds'), '链上超额抵押 + 自动清算', '抵押品暴跌、清算失灵、间接依赖 USDC'],
  ['算法 / 合成', 'UST（已崩溃）、USDe（Ethena）', '铸烧机制或对冲头寸', '死亡螺旋、资金费率转负、交易所对手方风险']
])}
${compare('三类稳定币的价值来源', [
  { name: '法币抵押', tag: 'USDC / USDT', kind: 'info', points: ['用户把 1 美元电汇给发行方', '发行方铸造 1 枚稳定币', '储备放在银行存款和短期国债里', '信任对象：发行方与审计'] },
  { name: '加密超额抵押', tag: 'DAI', kind: 'key', points: ['用户锁入约 1.5 美元的 ETH', 'CDP 合约借出 1 枚 DAI', '预言机持续报价，抵押不足就清算', '信任对象：合约、预言机与抵押率'] },
  { name: '算法 / 合成', tag: 'USDe 类', kind: 'risk', points: ['用户抵押 ETH，同时做空等值永续合约', '现货涨跌与空单盈亏相互抵消', '用这个对冲头寸发行稳定币', '信任对象：对冲执行与资金费率'] }
], [
  ['flow', '法币型的价值在链外的银行；超额抵押型的价值在链上合约；合成型的价值在“现货多头 + 衍生品空头”的组合里。'],
  ['key', '判断一个稳定币，先问：如果所有人同时赎回，钱从哪里来？'],
  ['risk', '法币型可以被发行方冻结；超额抵押型在暴跌时可能资不抵债；合成型在资金费率长期为负或交易所出问题时亏损。'],
  ['limit', '没有一种设计同时做到：完全去中心化、资本高效、绝对稳定。这常被称为稳定币“不可能三角”。']
])}

<h2>3. 法币抵押：USDT 与 USDC</h2>
${steps([
  '<strong>铸造</strong>：机构客户完成 KYC，把美元电汇给发行方。发行方在链上调用 <code>mint</code>，给客户地址铸造等量代币。',
  '<strong>赎回</strong>：客户把代币转给发行方，发行方销毁（burn）代币并电汇美元。普通用户通常不能直接赎回，而是在交易所卖出。',
  '<strong>套利维持锚定</strong>：币价 0.99 时，套利者在市场买入、找发行方 1 美元赎回；币价 1.01 时，套利者 1 美元铸造、在市场卖出。',
  '<strong>储备披露</strong>：Circle 每月发布第三方鉴证报告' + cite('Circle：USDC Transparency', 'https://www.circle.com/transparency') + '；Tether 按季度发布鉴证报告' + cite('Tether：2026 年第一季度鉴证报告公告', 'https://tether.io/news/tether-posts-1-04b-q1-2026-profit-despite-highly-volatile-global-markets-reaches-all-time-highs-8-23b-reserve-buffer-and-maintains-u-s-treasury-heavy-backing/') + '。储备主要是现金和短期美国国债（以发行方最新报告为准）。',
  '<strong>冻结与黑名单</strong>：合约内置黑名单。被列入的地址无法转出（USDC 也无法转入）。发行方按执法要求冻结被盗资金或受制裁地址（制裁筛查见 <a href="#m11-2">M05.2 KYC、AML 与制裁筛查</a>）。'
])}
${call('info', `<p>监管：欧盟 MiCA 对稳定币（ART / EMT）发行方的规定自 2024 年 6 月 30 日起适用；${cite('EBA：Asset-referenced and e-money tokens (MiCA)', 'https://www.eba.europa.eu/regulation-and-policy/asset-referenced-and-e-money-tokens-mica')}美国《GENIUS 法案》于 2025 年 7 月 18 日签署，为支付型稳定币建立联邦框架。${cite('白宫：GENIUS 法案签署说明', 'https://www.whitehouse.gov/fact-sheets/2025/07/fact-sheet-president-donald-j-trump-signs-genius-act-into-law/')}合规要求影响哪些稳定币能在哪些地区的交易所上架，具体以最新法规为准；各法域的稳定币规则对比见 <a href="#m11-4">M05.4 主要法域</a>。</p>`)}
<h3>3.1 脱锚案例：2023 年 3 月 USDC 与硅谷银行</h3>
${mm('USDC 脱锚因果链（2023 年 3 月 10–13 日）', `
flowchart LR
  A["3 月 10 日<br/>硅谷银行 SVB 倒闭"] --> B["Circle 披露约 33 亿美元<br/>储备存于 SVB"]
  B --> C["周末银行电汇关闭<br/>无法铸造赎回"]
  C --> D["二级市场抛售<br/>USDC 最低约 0.87–0.88 美元"]
  D --> E["DAI 也跌到约 0.88–0.9 美元<br/>因 PSM 持有大量 USDC"]
  B --> F["3 月 12 日美国监管宣布<br/>SVB 存款全额兑付"]
  F --> G["3 月 13 日银行恢复<br/>赎回通道重开"]
  G --> H["USDC 回到约 1 美元"]
`, [
  ['flow', '锚定靠“随时能 1:1 赎回”。周末银行关门，套利通道断了，价格只由恐慌情绪决定。' + cite('Circle：33 亿美元储备风险解除，脱锚收窄', 'https://www.circle.com/pressroom/3-3-billion-of-usdc-reserve-risk-removed-dollar-de-peg-closes') + cite('The Block：USDC 与 DAI 跌至约 0.88 美元', 'https://www.theblock.co/post/218993/usdc-and-dai-remain-at-about-0-90-following-circles-disclosure-of-funds-at-svb')],
  ['risk', '风险会传导：DAI 的储备里有大量 USDC，所以“去中心化稳定币”一起脱锚；以 USDC 计价的借贷池触发清算。'],
  ['key', '法币型稳定币的风险不在合约，而在银行和发行方。工程上要对“稳定币价格 ≠ 1”做预案。'],
  ['limit', '这次因为监管兑付而恢复。如果储备真的损失，脱锚会是永久的。']
])}

<h2>4. 加密超额抵押：DAI 与 MakerDAO</h2>
<p>MakerDAO 用 <strong>CDP</strong>（Collateralized Debt Position，抵押债仓，Maker 称为 Vault）发行 DAI：用户把 ETH 锁进合约，按抵押率借出 DAI。DAI 不是“存进去的钱”，而是新铸造的债务。还 DAI 加利息，才能取回 ETH。</p>
<p><strong>算一算（示例）：</strong>某 ETH 金库最低抵押率 150%，清算罚金 13%，ETH 价格 3,000 美元。</p>
${steps([
  '用户锁入 10 ETH，价值 30,000 美元。最多借 30,000 ÷ 1.5 = 20,000 DAI。为了安全，他只借 12,000 DAI，抵押率 = 30,000 ÷ 12,000 = 250%。',
  '清算价格 = 债务 × 最低抵押率 ÷ 抵押数量 = 12,000 × 1.5 ÷ 10 = <strong>1,800 美元</strong>。ETH 跌到 1,800 以下，金库可被清算。',
  '稳定费（Stability Fee）：借款年利率，例如 5%。一年后债务 = 12,000 × 1.05 = 12,600 DAI，清算价升到 12,600 × 1.5 ÷ 10 = 1,890 美元。',
  '若 ETH 跌到 1,700：拍卖出售抵押品，偿还 12,600 DAI + 13% 罚金 1,638 DAI = 14,238 DAI。按 1,700 价格需卖出约 8.38 ETH，用户拿回约 1.62 ETH。'
])}
${mm('DAI 的锚定工具箱', `
flowchart TB
  P{"DAI 市场价格"} -->|"高于 1 美元"| UP["需要增加 DAI 供给"]
  P -->|"低于 1 美元"| DN["需要减少 DAI 供给"]
  UP --> UP1["下调稳定费 → 更多人借 DAI"]
  UP --> UP2["PSM：1 USDC 换 1 DAI"]
  DN --> DN1["上调稳定费 → 借款人还 DAI"]
  DN --> DN2["提高储蓄利率 DSR → 锁定 DAI"]
  DN --> DN3["PSM：1 DAI 换 1 USDC"]
  LQ["清算：荷兰式拍卖<br/>价格从高往下降"] --> SOL["保证每枚 DAI 有足额抵押"]
`, [
  ['flow', '稳定费和储蓄利率是“慢工具”，靠改变借贷意愿调节供给；PSM（Peg Stability Module，锚定稳定模块）是“快工具”，1:1 兑换直接封住价差。'],
  ['risk', 'PSM 让 DAI 很稳，但也让 DAI 大量持有 USDC，继承了 USDC 的冻结和银行风险（见 2023 年 3 月）。'],
  ['fail', '2020 年 3 月 12 日（“黑色星期四”），ETH 暴跌、Gas 暴涨，清算机器人失效，部分拍卖被 0 DAI 出价拍走，社区统计约 830 万美元的 ETH 抵押品以 0 DAI 成交（各方口径不一，Maker 复盘的净损失口径约 665 万美元）。2021 年 Maker 推出 Liquidations 2.0，改为荷兰式拍卖。' + cite('Cointelegraph：Maker 债务危机复盘', 'https://cointelegraph.com/news/maker-debt-crisis-post-mortem-recommends-new-safeguards') + cite('Maker 文档：Liquidation 2.0 模块', 'https://docs.makerdao.com/smart-contract-modules/dog-and-clipper-detailed-documentation')],
  ['key', '超额抵押型的安全边际来自抵押率和清算速度，不来自任何人的承诺。']
])}

<h2>5. 算法与合成稳定币</h2>
<h3>5.1 UST：2022 年 5 月的死亡螺旋</h3>
<p>Terra 的 UST 没有外部抵押。协议承诺：任何时候都能用 1 枚 UST 换走价值 1 美元的 LUNA，反之亦然。UST 低于 1 美元时，套利者买 UST、换 LUNA 卖出，从而减少 UST 供给。这个机制只在 LUNA 有价值时成立。</p>
${mm('UST 崩溃因果链', `
flowchart TB
  A["Anchor 协议提供约 20% 存款收益<br/>吸引大量 UST 存款"] --> B["UST 市值一度约 180 亿美元"]
  B --> C["2022 年 5 月初<br/>大额 UST 被抛售，价格跌到 0.98"]
  C --> D["持有人赎回 UST 换 LUNA<br/>并卖出 LUNA"]
  D --> E["LUNA 供给暴增、价格下跌"]
  E --> F["每枚 UST 能换到的 LUNA 价值<br/>更不可信，恐慌加剧"]
  F --> D
  E --> G["储备 BTC 被用于护盘仍失败"]
  F --> H["数日内 UST 跌到几美分<br/>LUNA 接近归零，各方估算市值蒸发 400 亿至 600 亿美元"]
`, [
  ['flow', '正反馈回路：UST 跌 → 增发 LUNA → LUNA 跌 → 信心更差 → UST 再跌。'],
  ['risk', '“用自己发行的代币做抵押”在恐慌时没有外部价值支撑。收益率越高、增长越快，崩溃规模越大。' + cite('NBER：Anatomy of a Run: The Terra Luna Crash', 'https://www.nber.org/papers/w31160') + cite('The Block：Terra、Luna 与 UST 崩溃经过', 'https://www.theblock.co/post/146444/terra-luna-and-ust-how-we-got-here') + cite('GSR：Dissecting the Terra/UST Bank Run', 'https://www.gsr.io/wp-content/uploads/2022/05/2022.05.25_Dissecting-the-Terra_UST-Bank-Run.pdf')],
  ['key', '看稳定币收益率时问：收益来自哪里？UST 的 20% 收益靠补贴，不可持续；代币设计层面的失败方式见 <a href="#m02-60">M06.6 代币经济设计</a> 第 7 节。'],
  ['limit', '赎回机制也有容量上限，大规模挤兑时套利来不及。']
])}
<h3>5.2 Ethena 类 delta 中性设计</h3>
<p>USDe 的思路：用户存入 ETH（或质押 ETH），协议在中心化交易所开等值的永续合约空头。ETH 涨 10%：现货赚 10%，空头亏 10%，总价值不变。这叫 <strong>delta 中性</strong>。收益来自质押收益和永续合约的<strong>资金费率</strong>（多头付给空头的费用，见 <a href="#m08">M09</a>）。风险：① 资金费率长期为负时，空头要付钱，侵蚀储备；② 头寸放在交易所，存在交易所对手方和托管风险；③ 极端行情下对冲腿和现货腿可能无法同时平仓。</p>

<h2>6. 稳定币在 DeFi、支付中的角色与工程集成</h2>
<p>在 DeFi 中，稳定币是 AMM 的主要计价资产、借贷池里借款需求最大的资产、衍生品的保证金和清算单位。在支付中，稳定币用于跨境汇款、交易所之间的结算、商户收款（商户收款链路与跨境结算见 <a href="#m09-4">M11.4 RWA 与链上支付</a>）。对后端来说，稳定币就是一个 ERC-20 合约，但有几个与“普通代币”不同的坑：</p>
${tbl(['坑', '事实', '工程处理'], [
  ['精度', '以太坊上 USDC、USDT 为 6 位小数；DAI 为 18 位；BSC 上的 USDT 为 18 位', '永远读取 decimals()，按“链 + 合约地址”配置，不按币名硬编码'],
  ['非标准返回值', '以太坊 USDT 的 transfer / approve 不返回 bool', '合约用 SafeERC20；后端用回执的 Transfer 事件确认到账'],
  ['approve 先清零', 'USDT 要求把非零授权改成非零前先设为 0', 'SafeERC20.forceApprove'],
  ['黑名单', 'USDC 黑名单地址不能收发；USDT 黑名单地址不能转出', '合约不要假设转账必成功；提现前检查收款地址；pull 模式避免一个被冻结地址卡住全体'],
  ['可升级合约', 'USDC、USDT 都可由发行方升级或暂停', '监控其代理的 Upgraded 事件和 Pause 事件；风险评估时把发行方当作可信第三方'],
  ['脱锚', '价格可能短时间偏离 1 美元', '借贷、清算、记账使用预言机价格，不要写死 1.0；设置脱锚告警']
])}
${code('SOLIDITY', `
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StablePayout {
    using SafeERC20 for IERC20;
    mapping(address => mapping(address => uint256)) public owed; // token => user => 金额

    // 把“美元金额（18 位）”换算成该稳定币的最小单位
    function toTokenUnits(address token, uint256 usd18) public view returns (uint256) {
        uint8 d = IERC20Metadata(token).decimals();   // USDC = 6
        return usd18 / 10 ** (18 - d);                // 假设 d ≤ 18；向下取整对协议有利
    }

    // pull 模式：一个被列入黑名单的用户只会让自己的 claim 失败
    function claim(address token) external {
        uint256 amt = owed[token][msg.sender];
        owed[token][msg.sender] = 0;
        IERC20(token).safeTransfer(msg.sender, amt);
    }

    function approveRouter(address token, address router, uint256 amt) internal {
        IERC20(token).forceApprove(router, amt);      // 兼容 USDT 的“先清零”要求
    }
}
`)}
${tryit(`<p>在 Etherscan 上读 USDC 合约：</p>
<ol><li>打开 etherscan.io，搜索 USDC（以太坊主网地址以 <code>0xA0b86991</code> 开头，务必核对官方公布的完整地址）。</li>
<li>页面显示 “This contract may be a proxy contract”。点 Contract → Read as Proxy。</li>
<li>调用 <code>decimals</code>，预期返回 6。调用 <code>totalSupply</code>，除以 10<sup>6</sup> 得到流通量。</li>
<li>找到 <code>isBlacklisted</code>，输入任意地址，预期多数返回 false。</li>
<li>在 Events 标签页筛选 <code>Blacklisted</code> 事件，观察发行方冻结地址的记录。</li></ol>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['按链和合约地址配置稳定币，decimals 从链上读取', '同名代币在不同链上精度不同', '启动时校验配置的 decimals 与链上一致'],
  ['所有转账使用 SafeERC20，授权使用 forceApprove', '兼容 USDT', '主网分叉测试 USDT 转账和改授权'],
  ['资金分发采用 pull 模式', '被冻结地址不会卡住全体', '测试：黑名单地址 claim 失败，其他人正常'],
  ['监控发行方合约的 Upgraded / Paused / Blacklisted 事件', '发行方可以单方面改变规则', '告警：事件出现后 5 分钟内通知值班'],
  ['稳定币价格偏离 1 美元超过 0.5%（示例）告警', '提前发现脱锚', '用 Chainlink USDC/USD 等价格源持续比对'],
  ['单一稳定币敞口设上限', '分散发行方和银行风险', '风险报表按稳定币统计持仓占比']
])}
${mistakes([
  ['稳定币永远等于 1 美元。', '稳定币只是“目标”1 美元。USDC 在 2023 年 3 月跌到约 0.87，UST 在 2022 年 5 月跌到几美分。系统要处理价格偏离。'],
  ['DAI 是去中心化的，所以不受 USDC 影响。', 'DAI 通过 PSM 持有大量 USDC，2023 年 3 月和 USDC 一起脱锚。去中心化程度要看抵押品构成。'],
  ['所有 USDT 都是 6 位小数。', '以太坊 USDT 是 6 位，BSC 上的 USDT 是 18 位。必须按链和合约地址读取 decimals。'],
  ['收益率高的稳定币更好。', '收益一定有来源：国债利息、借款利息、资金费率或补贴。补贴型高收益（例如 Anchor 的约 20%）不可持续。']
])}
${recap([
  '稳定币解决链上的计价与结算问题。判断标准：所有人同时赎回时，钱从哪里来。',
  '法币型靠银行储备 + 1:1 赎回 + 套利；风险在发行方、银行和监管冻结。',
  '超额抵押型靠抵押率 + 清算 + 稳定费 + PSM；清算价 = 债务 × 最低抵押率 ÷ 抵押数量。',
  '算法型无外部抵押时会进入死亡螺旋（UST）；合成型（delta 中性）依赖资金费率和交易所。',
  '集成要点：读 decimals、SafeERC20、forceApprove、pull 模式、监控升级与黑名单事件、脱锚告警。'
])}
${quiz([
  { q: '2023 年 3 月 USDC 脱锚的直接原因是什么？', o: ['合约被黑客攻击', '部分储备存放在倒闭的硅谷银行，且周末无法赎回', 'Circle 增发了大量 USDC', '预言机报价错误'], a: 1, why: 'Circle 约 33 亿美元储备在 SVB，银行周末关闭导致铸造赎回通道中断。合约本身没有被攻击，也没有超发。' },
  { q: '金库抵押 10 ETH、债务 12,000 DAI、最低抵押率 150%。清算价格是多少？', o: ['1,200 美元', '1,500 美元', '1,800 美元', '2,000 美元'], a: 2, why: '清算价 = 12,000 × 1.5 ÷ 10 = 1,800。A 忽略了抵押率；B 和 D 用错了公式。' },
  { q: 'UST 崩溃中的“死亡螺旋”指什么？', o: ['UST 下跌 → 增发 LUNA → LUNA 下跌 → 信心更差 → UST 再跌', 'ETH 下跌导致 DAI 清算', '交易所冻结了 UST', '资金费率转负导致对冲亏损'], a: 0, why: 'UST 的锚定靠可兑换成 LUNA，LUNA 增发和下跌形成正反馈。B 描述 DAI；D 描述 Ethena 类风险。' },
  { q: '合约要向用户分发 USDC 奖励。下面哪种做法最稳妥？', o: ['for 循环里对每个用户调用 transfer 并忽略返回值', '记账后让用户自己 claim，转账用 SafeERC20', '把金额按 18 位小数写死', '假设 USDC 永远等于 1 美元并直接记账'], a: 1, why: 'pull 模式避免黑名单地址卡住全体，SafeERC20 处理返回值。A 有 DoS 和静默失败；C 精度错误；D 忽略脱锚。' }
])}
${exercises([["计算题：某 ETH 金库最低抵押率 150%（示例）。用户锁入 20 ETH，ETH 价格 2,500 美元，借出 20,000 DAI。求当前抵押率和清算价格。稳定费 4%，一年后清算价格变成多少？", "<p>抵押品价值 20 × 2,500 = 50,000 美元。抵押率 = 50,000 ÷ 20,000 = 250%。</p><p>清算价格 = 20,000 × 1.5 ÷ 20 = 1,500 美元。</p><p>一年后债务 = 20,000 × 1.04 = 20,800 DAI，清算价格 = 20,800 × 1.5 ÷ 20 = 1,560 美元。不还利息，清算价会慢慢上升。</p>"], ["思考题：USDC 市场价跌到 0.98 美元（示例）。套利者怎样把价格拉回 1 美元？买入 100,000 枚能赚多少（不计费用）？为什么 2023 年 3 月的那个周末这个机制失灵了？", "<p>套利者在市场以 0.98 买入 100,000 枚，花 98,000 美元；再找发行方按 1 美元赎回，拿回 100,000 美元，赚 2,000 美元。买盘推高市场价。</p><p>2023 年 3 月 SVB 倒闭后，周末银行电汇关闭，铸造和赎回通道中断。套利者无法赎回，价格只由恐慌情绪决定，所以 USDC 跌到约 0.87–0.88 美元。</p>"], ["计算题：用文中的 <code>toTokenUnits</code> 把 1.2345678 美元（18 位表示）换算成 USDC 的最小单位。结果是多少？丢掉的部分归谁？", "<p>usd18 = 1.2345678 × 10¹⁸ = 1,234,567,800,000,000,000。USDC 的 decimals 为 6，要除以 10¹²。</p><p>结果为 1,234,567.8，整数除法向下取整得 <strong>1,234,567</strong>，即 1.234567 USDC。</p><p>丢掉的 0.0000008 美元留在协议里。向下取整对协议有利，这是有意的设计。</p>"]])}
${checklist(["能说出法币抵押、加密超额抵押、算法或合成三类稳定币各自的锚定来源和失败方式。", "能用“债务 × 最低抵押率 ÷ 抵押数量”算出 CDP 清算价，并算出稳定费对清算价的影响。", "在 Etherscan 上用 Read as Proxy 读过 USDC 的 decimals、totalSupply 和 isBlacklisted。", "能写出按 decimals 换算金额、用 SafeERC20 和 forceApprove、按拉取模式分发的稳定币集成代码。", "能为稳定币集成列出监控项：Upgraded、Paused、Blacklisted 事件和脱锚告警。"])}
${terms([
  ['稳定币', 'Stablecoin', '价格以 1 美元等法币为目标的代币'],
  ['脱锚', 'Depeg', '稳定币价格明显偏离目标价格'],
  ['抵押债仓', 'CDP, Collateralized Debt Position', '锁定抵押品并借出稳定币的链上仓位'],
  ['稳定费', 'Stability Fee', 'CDP 借款人按年支付的利息'],
  ['锚定稳定模块', 'PSM, Peg Stability Module', '以 1:1 兑换 DAI 与 USDC 等稳定币的模块'],
  ['死亡螺旋', 'Death Spiral', '价格下跌与增发、信心下降相互强化的正反馈'],
  ['Delta 中性', 'Delta Neutral', '现货多头与衍生品空头相互抵消，组合价值不随价格变化'],
  ['黑名单', 'Blacklist', '发行方可冻结特定地址的合约功能']
])}
` });

CUR = 'm02-10';
addCh({ id: 'm02-10', nav: 'AMM 深入', title: 'M06.2 AMM 深入：恒定乘积、Uniswap V2/V3、Curve 与 LP 风险', desc: '从公式推导到合约调用链，再到集中流动性与 LP 真实收益', html: `
<h1>M06.2 AMM 深入：恒定乘积、Uniswap V2/V3、Curve 与 LP 风险</h1>
${meta(['推导恒定乘积的成交公式、价格影响和 LP 份额公式，并能手算。', '画出 Uniswap V2 的 Factory / Pair / Router 结构和一次 swap 的调用链；解释 V3 的 tick 和虚拟储备。', '比较 AMM、Curve、聚合器和订单簿，评估 LP 的收益与风险（无常损失、LVR）。'], '<a href="#m13">M06 总览</a>、<a href="#m02-5">M02.5 ERC-20 与授权</a>', ['amm', 'il'])}
${beginner(`<p><strong>流动性池（Liquidity Pool）</strong>：一个合约里存着两种代币，任何人都能和它兑换。</p>
<p><strong>LP（Liquidity Provider，流动性提供者）</strong>：往池子存代币、赚手续费的人。存入后拿到 <strong>LP 代币</strong>，代表在池子里的份额。</p>
<p><strong>滑点（Slippage）</strong>：下单时预期价格和实际成交价格的差。</p>
<p><strong>价格影响（Price Impact）</strong>：你的交易本身把池子价格推动了多少。</p>
<p><strong>套利者（Arbitrageur）</strong>：发现池子价格和外部市场价格不同时，低买高卖赚差价的人或机器人。</p>`)}

<h2>1. 一句话理解</h2>
${one('AMM 用一个公式代替订单簿：池子里两种代币的数量乘积保持不变，价格就是两者的比值。谁来交易，价格就沿着曲线滑动。')}
${call('analogy', `<p>想象一台天平式兑换机：左盘放 ETH，右盘放 USDC。你往左盘加 ETH，机器必须从右盘吐出 USDC，规则是“左盘数量 × 右盘数量”不变。左盘越重，再加 1 个 ETH 能换到的 USDC 越少，所以大单的均价越差。</p>
<p>比喻的局限：天平不知道外面市场的价格。池子价格被推偏后，要靠套利者把它拉回，而套利者的利润来自 LP。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m02-10"><div class="mmd-title"><span>一图看懂：恒定乘积曲线上的一笔买入</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 272" role="img" aria-label="恒定乘积曲线与一笔交易的移动"><polyline points="90.0,30.0 93.3,40.6 96.7,50.2 100.0,59.0 103.3,67.0 106.7,74.4 110.0,81.3 113.3,87.6 116.7,93.5 120.0,99.0 123.3,104.1 126.7,108.9 130.0,113.3 133.3,117.5 136.7,121.5 140.0,125.2 143.3,128.8 146.7,132.1 150.0,135.3 153.3,138.3 156.7,141.1 160.0,143.8 163.3,146.4 166.7,148.9 170.0,151.2 173.3,153.5 176.7,155.6 180.0,157.7 183.3,159.6 186.7,161.5 190.0,163.3 193.3,165.1 196.7,166.8 200.0,168.4 203.3,169.9 206.7,171.4 210.0,172.9 213.3,174.2 216.7,175.6 220.0,176.9 223.3,178.1 226.7,179.4 230.0,180.5 233.3,181.7 236.7,182.8 240.0,183.8 243.3,184.9 246.7,185.9 250.0,186.9 253.3,187.8 256.7,188.7 260.0,189.6 263.3,190.5 266.7,191.3 270.0,192.2 273.3,193.0 276.7,193.7 280.0,194.5 283.3,195.2 286.7,196.0 290.0,196.7 293.3,197.4 296.7,198.0 300.0,198.7 303.3,199.3 306.7,199.9 310.0,200.5 313.3,201.1 316.7,201.7 320.0,202.3 323.3,202.8 326.7,203.4 330.0,203.9 333.3,204.4 336.7,204.9 340.0,205.4 343.3,205.9 346.7,206.4 350.0,206.9 353.3,207.3 356.7,207.8 360.0,208.2 363.3,208.6 366.7,209.1 370.0,209.5 373.3,209.9 376.7,210.3 380.0,210.7 383.3,211.1 386.7,211.4 390.0,211.8 393.3,212.2 396.7,212.5 400.0,212.9 403.3,213.2 406.7,213.6 410.0,213.9 413.3,214.2 416.7,214.6 420.0,214.9 423.3,215.2 426.7,215.5 430.0,215.8 433.3,216.1 436.7,216.4 440.0,216.7 443.3,216.9 446.7,217.2 450.0,217.5 453.3,217.8 456.7,218.0 460.0,218.3 463.3,218.6 466.7,218.8 470.0,219.1 473.3,219.3 476.7,219.5 480.0,219.8 483.3,220.0 486.7,220.2 490.0,220.5 493.3,220.7 496.7,220.9 500.0,221.1 503.3,221.4 506.7,221.6 510.0,221.8 513.3,222.0 516.7,222.2 520.0,222.4 523.3,222.6 526.7,222.8 530.0,223.0 533.3,223.2 536.7,223.4 540.0,223.5 543.3,223.7 546.7,223.9 550.0,224.1 553.3,224.3 556.7,224.4 560.0,224.6 563.3,224.8 566.7,225.0 570.0,225.1 573.3,225.3 576.7,225.4 580.0,225.6 583.3,225.8 586.7,225.9 590.0,226.1 593.3,226.2 596.7,226.4 600.0,226.5 603.3,226.7 606.7,226.8 610.0,227.0 613.3,227.1 616.7,227.3 620.0,227.4 623.3,227.5 626.7,227.7 630.0,227.8 633.3,227.9 636.7,228.1 640.0,228.2 643.3,228.3 646.7,228.5 650.0,228.6 653.3,228.7 656.7,228.8 660.0,229.0 663.3,229.1 666.7,229.2 670.0,229.3 673.3,229.4 676.7,229.5 680.0,229.7 683.3,229.8 686.7,229.9 690.0,230.0" fill="none" stroke="var(--accent)" stroke-width="3"/><line x1="90" y1="230" x2="710" y2="230" stroke="var(--ink-2)" stroke-width="2"/><path d="M710.0 230.0 L702.8 233.5 L702.8 226.5 z" fill="var(--ink-2)"/><line x1="90" y1="230" x2="90" y2="20" stroke="var(--ink-2)" stroke-width="2"/><path d="M90.0 20.0 L93.5 27.2 L86.5 27.2 z" fill="var(--ink-2)"/><text x="700" y="252" font-size="12" text-anchor="end" fill="var(--ink)">池内 ETH 数量 x</text><text x="82" y="30" font-size="12" text-anchor="start" fill="var(--ink)">池内 USDC 数量 y</text><line x1="290.0" y1="196.7" x2="290.0" y2="163.3" stroke="var(--ok)" stroke-width="2.5" stroke-dasharray="5 4"/><line x1="290.0" y1="163.33333333333334" x2="196.0" y2="163.33333333333334" stroke="var(--risk)" stroke-width="2.5"/><path d="M196.0 163.3 L203.2 159.9 L203.2 166.8 z" fill="var(--risk)"/><circle cx="290.0" cy="196.66666666666669" r="7" fill="var(--info)" stroke="var(--paper)" stroke-width="2"/><circle cx="190.0" cy="163.33333333333334" r="7" fill="var(--risk)" stroke="var(--paper)" stroke-width="2"/><text x="302.0" y="216.66666666666669" font-size="12.5" text-anchor="start" fill="var(--ink)" font-weight="700">A：交易前</text><text x="178.0" y="185.33333333333334" font-size="12.5" text-anchor="end" fill="var(--ink)" font-weight="700">B：交易后</text><text x="300.0" y="184.0" font-size="12" text-anchor="start" fill="var(--ok)">① 用户放入 USDC，y 增加</text><text x="260.0" y="151.33333333333334" font-size="12" text-anchor="middle" fill="var(--risk)">② 取走 ETH，x 减少</text><text x="556.6666666666667" y="210.44444444444446" font-size="13" text-anchor="middle" fill="var(--accent)" font-weight="700">x · y = k（曲线上任意点乘积相同）</text><text x="380" y="262" font-size="12.5" text-anchor="middle" fill="var(--ink-2)">从 A 到 B，池内 ETH 变少、USDC 变多：ETH 的价格 y ÷ x 上升，买得越多越贵</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>每笔交易都让池子的状态沿着 x · y = k 的曲线移动：放进一种币，就要拿出另一种币，使乘积不变（不计手续费）。</span></li><li><span class="chip key">关键</span><span>价格就是曲线上该点的 y ÷ x。买入 ETH 让点向左上移动，价格上升，这就是滑点的来源。</span></li><li><span class="chip limit">局限</span><span>曲线永远碰不到坐标轴：池子不可能被一笔交易买空，但价格会趋向无穷大。</span></li></ul></figcaption></figure>

<h2>2. 恒定乘积：从公式到手算</h2>
<h3>2.1 成交公式推导</h3>
<p>同一条恒定乘积曲线也被用来做发币，见 <a href="#m09-7">M11.6 NFT 市场、版税与 Memecoin 发行</a> 中的联合曲线。</p>
<p>设池子有 x 个 ETH、y 个 USDC，k = x·y。交易者卖出 Δx 个 ETH，手续费率 f（V2 为 0.3%），记 γ = 1 − f。只有 γΔx 参与定价，手续费留在池子里。</p>
${steps([
  '交易后必须满足 (x + γΔx)(y − Δy) = x·y。',
  '展开解出 <strong>Δy = y·γΔx / (x + γΔx)</strong>。这就是 Uniswap V2 <code>getAmountOut</code> 的公式。',
  '即时价格（边际价格）= y / x。成交均价 = Δy / Δx。',
  '不计手续费时，成交均价 = y / (x + Δx)。价格影响 = 1 − 均价 / 即时价 = Δx / (x + Δx)。交易量占池子比例越大，价格影响越大。'
])}
<p><strong>算一算（示例）：</strong>池子 1,000 ETH / 3,000,000 USDC，卖出 10 ETH，费率 0.3%。</p>
${steps([
  'γΔx = 0.997 × 10 = 9.97。',
  'Δy = 3,000,000 × 9.97 / (1,000 + 9.97) = 29,910,000 / 1,009.97 ≈ <strong>29,615 USDC</strong>。',
  '成交均价 ≈ 2,961.5，比即时价 3,000 低约 1.28%。其中约 0.3% 是手续费，约 0.98% 是价格影响。',
  '交易后池子：x = 1,010（10 个 ETH 全部进入池子），y ≈ 2,970,385。新价格 ≈ 2,941。k 从 3.0×10<sup>9</sup> 增加到约 3.0002×10<sup>9</sup>，增加的部分就是手续费。'
])}
<p>先在实验里重复这个例子：设置池子 1,000 ETH、卖出 10 ETH、费率 0.3%，核对成交额。然后把交易量拉到 300 ETH，观察价格影响超过 20%。</p>
${lab('amm')}
<h3>2.2 手续费与 LP 份额</h3>
<p>手续费不单独发放，而是留在池子里，让每个 LP 代币对应的代币变多。LP 代币的数量规则：</p>
${steps([
  '<strong>首次添加</strong>：LP 代币 = √(x·y) − 1000。1000 个最小单位永久锁定（V2 把它铸给零地址），防止有人把每份额价格抬到极高、让后来者买不起。',
  '<strong>后续添加</strong>：LP 代币 = min(Δx·S / x, Δy·S / y)，S 为现有 LP 代币总量。按比例存入，多出来的一边相当于送给池子。',
  '<strong>移除</strong>：按 LP 代币占比取回两种代币：Δx = x·l / S，Δy = y·l / S。',
  '<strong>算一算（示例）</strong>：首次存入 100 ETH + 300,000 USDC，√(100 × 300,000) = √30,000,000 ≈ 5,477.2（按 18 位小数计时单位换算后同理），首个 LP 拿到几乎全部份额。'
])}
${call('info', `<p>V2 有一个“协议费开关”：打开后，0.3% 手续费中的 1/6（即 0.05%）以增发 LP 代币的方式归协议。开关由治理决定。</p>`)}

<h2>3. Uniswap V2 架构与 swap 调用链</h2>
${mm('Uniswap V2 合约结构', `
flowchart LR
  U["用户 / 前端"] -->|"swapExactTokensForTokens"| R["Router02<br/>算路径 检查滑点和截止时间"]
  R -->|"getPair / 计算地址"| F["Factory<br/>createPair 用 CREATE2 部署"]
  F -->|"部署"| P1["Pair ETH/USDC<br/>储备 reserve0 reserve1<br/>LP 代币 ERC-20"]
  F -->|"部署"| P2["Pair USDC/DAI"]
  R -->|"transferFrom 把输入币直接转进 Pair"| P1
  R -->|"pair.swap(amount0Out, amount1Out, to)"| P1
  P1 -->|"多跳时 to = 下一个 Pair"| P2
  P2 -->|"输出币"| U
  P1 -->|"累计价格 price0CumulativeLast"| O["TWAP 预言机读取方"]
`, [
  ['flow', 'Router 不持有资金。它把用户的币直接转进 Pair，再调用 Pair.swap；多跳路由时，上一个 Pair 的输出直接转进下一个 Pair。'],
  ['key', 'Pair 是核心合约：它不关心是谁转进来的币，只在 swap 末尾检查“扣除手续费后的 k 不变小”。这让闪电兑换（flash swap）成为可能：先拿币，回调里再付钱。'],
  ['risk', '直接调用 Pair 不受 Router 的 amountOutMin 和 deadline 保护。集成方合约必须自己检查最小输出。'],
  ['limit', 'V2 的流动性均匀分布在 0 到无穷大的价格区间，绝大部分资金在当前价格附近用不上，资本效率低。']
])}
${code('SOLIDITY', `
// Uniswap V2 Pair.swap 的核心检查（简化，原代码为 Solidity 0.5）
function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external lock {
    require(amount0Out > 0 || amount1Out > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    // ① 先把输出币乐观地转给 to（闪电兑换在这里回调 to 合约）
    if (amount0Out > 0) _safeTransfer(token0, to, amount0Out);
    if (amount1Out > 0) _safeTransfer(token1, to, amount1Out);
    if (data.length > 0) IUniswapV2Callee(to).uniswapV2Call(msg.sender, amount0Out, amount1Out, data);
    // ② 用实际余额反推本次转入了多少
    uint balance0 = IERC20(token0).balanceOf(address(this));
    uint balance1 = IERC20(token1).balanceOf(address(this));
    uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
    uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
    // ③ 扣除 0.3% 手续费后，k 不能变小
    uint b0Adj = balance0 * 1000 - amount0In * 3;
    uint b1Adj = balance1 * 1000 - amount1In * 3;
    require(b0Adj * b1Adj >= uint(_reserve0) * _reserve1 * 1000**2, "K");
    _update(balance0, balance1, _reserve0, _reserve1);   // 更新储备和累计价格
}
`)}
<p>注意函数上的 <code>lock</code> 修饰器：这是 V2 自己的重入锁（见 <a href="#m02-7">M02.8</a>）。</p>

<h2>4. V3 集中流动性与 Curve</h2>
<p>Uniswap V3 允许 LP 只在自选的价格区间 [P<sub>a</sub>, P<sub>b</sub>] 内提供流动性。价格被离散成 <strong>tick</strong>：第 i 个 tick 的价格 = 1.0001<sup>i</sup>，相邻 tick 相差 0.01%。每个费率档位有 tick 间距（例如 0.05% 档为 10，0.3% 档为 60，1% 档为 200），区间边界必须落在间距的整数倍上。合约内部用 <code>sqrtPriceX96</code>（√价格 × 2<sup>96</sup>）存价格。</p>
${steps([
  '<strong>虚拟储备</strong>：区间内的仓位表现得像一个更大的 V2 池子，满足 (x + L/√P<sub>b</sub>)·(y + L·√P<sub>a</sub>) = L²。L 是流动性，括号里加上的部分是“虚拟”的，并不真实存在。',
  '<strong>资本效率</strong>：当前价格位于区间几何中点时，相同 L 所需资金是全区间的 1 − (P<sub>a</sub>/P<sub>b</sub>)<sup>1/4</sup> 倍。',
  '<strong>算一算（示例）</strong>：价格 3,000，区间 [2,700, 3,333.3]。P<sub>a</sub>/P<sub>b</sub> = 0.81，0.81<sup>1/4</sup> ≈ 0.9487。资本效率 = 1 / (1 − 0.9487) ≈ <strong>19.5 倍</strong>：用 1/19.5 的资金提供和 V2 一样深的流动性。',
  '<strong>区间外</strong>：价格涨过 P<sub>b</sub>，仓位全部变成 USDC（ETH 全被买走）；跌破 P<sub>a</sub>，仓位全部变成 ETH。区间外不赚手续费，LP 需要调整区间（再平衡）。',
  '<strong>LP 凭证</strong>：每个仓位的区间不同，所以 V3 用 NFT（ERC-721）表示仓位，手续费也不自动复投，需要手动收取。'
])}
${mm('V3 仓位随价格变化的状态', `
stateDiagram-v2
  state "区间内：持有两种代币，赚手续费" as In
  state "高于上界：只剩 USDC，不赚费" as Above
  state "低于下界：只剩 ETH，不赚费" as Below
  [*] --> In: 创建仓位
  In --> Above: 价格上涨穿过 Pb
  In --> Below: 价格下跌穿过 Pa
  Above --> In: 价格回落
  Below --> In: 价格回升
  Above --> [*]: LP 移除或重设区间
  Below --> [*]: LP 移除或重设区间
`, [
  ['flow', '价格上涨时，区间内的 ETH 被逐步卖成 USDC；穿过上界后，仓位等于“在区间内分批卖光了 ETH”。'],
  ['risk', '区间越窄，资本效率越高，但价格越容易跑出区间，无常损失也被同比放大。'],
  ['key', '集中流动性把 LP 变成了“主动管理的做市商”，专业做市者和自动化金库（ALM）占据了大部分收益。'],
  ['limit', '每次穿越初始化的 tick 都要更新状态，跨 tick 多的大单 Gas 更高。']
])}
<p><strong>Curve StableSwap</strong>：面向价格应接近 1:1 的资产（USDC/USDT、stETH/ETH）。它把“恒定和”（x + y = 常数，价格完全不变但会被抽干）和“恒定积”结合，用放大系数 A 控制：靠近平衡点时曲线接近直线，滑点极小；远离平衡点时退化为恒定积，保证不会被抽干。A 越大，平衡点附近越平坦。</p>
${call('deep', `<p>StableSwap 不变量（n 种代币，D 为平衡时的总量）：A·n<sup>n</sup>·Σx<sub>i</sub> + D = A·D·n<sup>n</sup> + D<sup>n+1</sup> / (n<sup>n</sup>·Πx<sub>i</sub>)。合约用牛顿迭代法求解 D 和兑换输出。Uniswap V4（2025 年 1 月上线${cite('Uniswap：Uniswap v4 is Here', 'https://blog.uniswap.org/uniswap-v4-is-here')}）在单例合约中支持“hooks”，允许池子在兑换前后执行自定义逻辑，例如动态费率。</p>`)}

<h2>5. 聚合器、订单簿对比与 LP 的真实收益</h2>
<p><strong>DEX 聚合器</strong>（1inch、0x、CoW Swap、ParaSwap 等）在链下搜索多个池子，把一笔大单拆分到多条路径，例如 60% 走 V3 0.05% 池、40% 走 Curve，再在链上按路径执行。CoW Swap 采用批量拍卖：先在用户之间直接撮合，剩余部分再交给求解者（solver）竞价执行，能减少 MEV。</p>
${tbl(['维度', 'AMM', '订单簿（CEX / 链上 CLOB）'], [
  ['报价方', '公式 + 被动 LP', '主动做市商挂单'],
  ['长尾资产', '任何人都能建池', '需要做市商愿意报价'],
  ['资本效率', 'V2 低，V3 高但要主动管理', '高'],
  ['链上成本', '一次 swap 即成交', '挂单撤单频繁，需要高性能链或链下撮合'],
  ['对 LP / 做市商的风险', '无常损失、LVR、被套利', '库存风险，但可随时撤单调价'],
  ['MEV 暴露', '三明治、套利', '抢单、取消竞争']
])}
<p><strong>LP 收益 = 手续费 − 无常损失 − LVR 相关损失 − Gas</strong>。</p>
${steps([
  '<strong>无常损失（IL）</strong>：价格比变为 r 时，LP 价值相对单纯持有的差 = 2√r / (1 + r) − 1。r = 2 时约 −5.7%，r = 4 时约 −20%。',
  '<strong>LVR</strong>（Loss-Versus-Rebalancing）：AMM 总是以“过时价格”和套利者成交。把 LP 和一个“按市场价同步调仓”的策略对比，差额就是 LVR。对恒定乘积池，LVR 的瞬时速率约为 σ²/8 × 池子价值（σ 为年化波动率）。IL 只看起点和终点，LVR 随时间累积，即使价格回到起点也不会消失。',
  '<strong>算一算（示例）</strong>：σ = 60%，池子价值 100 万美元，年 LVR ≈ 0.36 / 8 × 1,000,000 = 45,000 美元，即 4.5%。手续费年化低于 4.5% 时，这个池子的 LP 长期跑输“调仓基准”。'
])}
<p>用实验验证：把价格倍数设为 2，记录 IL；再调整手续费年化和天数，找到打平点。</p>
${lab('il')}
${tryit(`<p>手算并在链上核对一笔 V2 兑换：</p>
<ol><li>在 Etherscan 打开 Uniswap V2 的某个 Pair 合约（例如 WETH/USDC，从 Uniswap 官方信息页获取地址），Read Contract 调用 <code>getReserves</code>，记下 reserve0 和 reserve1，并调用 <code>token0</code> 确认哪个是 USDC。</li>
<li>按 Δy = y·0.997Δx / (x + 0.997Δx) 计算卖出 1 WETH 能得到多少 USDC（注意 USDC 为 6 位小数、WETH 为 18 位）。</li>
<li>打开 Router02 合约，Read Contract 调用 <code>getAmountsOut(1000000000000000000, [WETH, USDC])</code>。</li>
<li>预期结果：你的手算结果和 Router 返回值在最后几位以内一致（差异来自整数截断）。</li></ol>`)}
${mistakes([
  ['价格影响就是手续费。', '手续费固定（例如 0.3%），价格影响随交易量占池子比例增长。卖出池子 30% 的 ETH，价格影响超过 20%。'],
  ['手续费会单独发到 LP 钱包。', 'V2 的手续费留在池子里，提高每个 LP 代币对应的资产；V3 的手续费累积在仓位上，需要手动收取。'],
  ['V3 区间越窄越好。', '区间越窄资本效率越高，但更容易出区间停止赚费，无常损失也被放大，需要频繁再平衡并支付 Gas。'],
  ['价格回到起点，LP 就没有损失。', '无常损失会消失，但期间套利者造成的 LVR 已经实现，不会回来。']
])}
${recap([
  '恒定乘积成交公式 Δy = y·γΔx / (x + γΔx)；价格影响约等于 Δx / (x + Δx)。',
  'LP 份额：首次 √(x·y) − 1000（永久锁定），后续按比例取最小值；手续费留在池子里使 k 增长。',
  'V2 = Factory（CREATE2 部署）+ Pair（储备、k 检查、TWAP 累加）+ Router（路径、滑点、截止时间）。',
  'V3 用 tick（1.0001<sup>i</sup>）和虚拟储备实现集中流动性；区间外仓位变成单一资产且不赚费。Curve 用放大系数 A 让稳定币对滑点极小。',
  'LP 真实收益 = 手续费 − 无常损失 − LVR − Gas；聚合器拆单降低价格影响。'
])}
${quiz([
  { q: '池子 100 ETH / 300,000 USDC，不计手续费卖出 100 ETH，能得到多少 USDC？', o: ['300,000', '150,000', '200,000', '100,000'], a: 1, why: 'Δy = 300,000 × 100 / (100 + 100) = 150,000。卖出数量等于池子 ETH 数量时，只能拿到一半 USDC，价格影响 50%。' },
  { q: 'Uniswap V2 首次添加流动性时，为什么要永久锁定 1000 个最小单位的 LP 代币？', o: ['作为协议手续费', '防止每份额价格被操纵到极高，让后来者无法参与', '补偿部署 Gas', '用作 TWAP 的初始值'], a: 1, why: '锁定最小流动性让“抬高单份额价格”的攻击代价极高。它不是手续费，也和 Gas、TWAP 无关。' },
  { q: 'V3 仓位区间 [2,700, 3,333]，ETH 价格涨到 4,000。仓位现在是什么状态？', o: ['同时持有 ETH 和 USDC，正常赚费', '全部是 ETH，不赚费', '全部是 USDC，不赚费', '仓位被清算'], a: 2, why: '价格上穿上界时 ETH 已被全部卖成 USDC，区间外不赚手续费。AMM 仓位没有清算概念。' },
  { q: '关于 LVR，哪一项正确？', o: ['价格回到起点时 LVR 归零', 'LVR 随时间累积，与波动率平方成正比', 'LVR 只存在于订单簿', 'LVR 就是手续费收入'], a: 1, why: 'LVR 是相对调仓基准的累计损失，速率约 σ²/8 × 价值，不会因价格回到起点而消失。A 描述的是无常损失。' }
])}
${exercises([["计算题：池子有 2,000 ETH 和 4,000,000 USDC（示例），费率 0.3%。卖出 50 ETH 能得到多少 USDC？成交均价比即时价低多少？", "<p>γΔx = 0.997 × 50 = 49.85。</p><p>Δy = 4,000,000 × 49.85 / (2,000 + 49.85) = 199,400,000 / 2,049.85 ≈ <strong>97,275.4 USDC</strong>。</p><p>成交均价 ≈ 1,945.5，比即时价 2,000 低约 2.72%。其中不计手续费的价格影响为 50 / 2,050 ≈ 2.44%，其余主要来自 0.3% 手续费。</p>"], ["计算题：LP 存入价值 10,000 美元的 ETH/USDC（各占一半，示例）。之后 ETH 价格涨到 9 倍。单纯持有和做 LP 各值多少？无常损失是多少？", "<p>单纯持有：USDC 部分 5,000，ETH 部分 5,000 × 9 = 45,000，合计 50,000 美元。</p><p>无常损失 = 2√9 / (1 + 9) − 1 = 6/10 − 1 = −40%。LP 价值 = 50,000 × 0.6 = 30,000 美元。</p><p>LP 比单纯持有少 20,000 美元。手续费收入必须超过这个差额，LP 才划算。</p>"], ["设计题：你的合约绕过 Router，直接调用 Uniswap V2 Pair 的 swap。合约需要自己补上哪些保护？", "<p>Pair 只检查扣除手续费后 k 不变小，不提供 amountOutMin 和 deadline 保护。</p><p>合约要先读 <code>getReserves</code>，用 Δy = y·γΔx / (x + γΔx) 算出预期输出，并要求它不低于调用方传入的最小输出。还要检查截止时间。然后把输入币转进 Pair，再调用 <code>swap</code>。函数本身也要防重入。</p>"]])}
${checklist(["能用 Δy = y·γΔx / (x + γΔx) 手算一笔 V2 兑换的输出和价格影响。", "能用 Pair 的 getReserves 和 Router02 的 getAmountsOut 在链上核对手算结果。", "能说出 Factory、Pair、Router 各自的职责，以及直接调用 Pair 时缺少哪些保护。", "能算出 V3 区间仓位的资本效率，并判断价格出区间后仓位的资产构成。", "能用 2√r / (1 + r) − 1 和 σ²/8 估算 LP 的无常损失和 LVR。"])}
${terms([
  ['恒定乘积', 'Constant Product', 'x·y = k，Uniswap V1/V2 的定价不变量'],
  ['价格影响', 'Price Impact', '交易本身导致的池子价格变化'],
  ['LP 代币', 'LP Token', '代表流动性池份额的代币'],
  ['闪电兑换', 'Flash Swap', '先从池子取出代币、在同一笔交易末尾付款的 V2 功能'],
  ['集中流动性', 'Concentrated Liquidity', 'LP 只在自选价格区间内提供流动性的机制'],
  ['Tick', 'Tick', 'V3 的离散价格刻度，价格 = 1.0001 的 i 次方'],
  ['虚拟储备', 'Virtual Reserves', 'V3 区间仓位等效的“更大池子”储备量'],
  ['放大系数', 'Amplification Coefficient, A', 'Curve 中控制曲线在平衡点附近平坦程度的参数'],
  ['DEX 聚合器', 'DEX Aggregator', '在多个池子之间拆单路由、寻找最优价格的服务'],
  ['LVR', 'Loss-Versus-Rebalancing', 'LP 相对按市场价调仓策略的累计损失']
])}
` });
})();
