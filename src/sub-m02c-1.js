/* ---------- M02 新增：m02-60 代币经济 · m02-61 DAO · m02-62 审计方法 ---------- */
(() => {
CUR = 'm02-60';
addCh({ id: 'm02-60', nav: '代币经济设计', title: 'M08.6 代币经济设计：供应、分配、释放与价值捕获', desc: '代币发多少、给谁、何时能卖、凭什么有价值，以及常见的失败方式', html: `
<h1>M08.6 代币经济设计：供应、分配、释放与价值捕获</h1>
${meta(['区分固定供应、通胀和燃烧三种供应模型，并算出通胀对不参与质押的持有人的稀释。', '读懂一张分配与解锁表：算出 TGE 流通量、FDV 与市值的差距，以及某个月的解锁压力。', '说清手续费开关、回购燃烧、ve 锁仓三种价值捕获方式，以及空投女巫过滤、积分计划和死亡螺旋的风险。'], '前置：<a href="#m02-50">M02.6 NFT 与代币发行</a>、<a href="#m02-11">M08.3 借贷协议深入</a>', ['vesting'])}
${beginner(`<p><strong>代币经济（Tokenomics）</strong>：一个代币的供应量、分配、释放节奏和价值来源的整体设计。</p>
<p><strong>TGE（Token Generation Event，代币生成事件）</strong>：代币第一次铸造并开始流通的时刻，通常也是上线交易的日子。</p>
<p><strong>流通量（Circulating supply）</strong>：已经解锁、可以自由转账和卖出的代币数量。<strong>总量（Total supply）</strong>包含还锁着的部分。</p>
<p><strong>FDV（Fully Diluted Valuation，完全稀释估值）</strong>：当前价格 × 最终总量。<strong>市值（Market cap）</strong>：当前价格 × 流通量。</p>
<p><strong>价值捕获（Value accrual）</strong>：协议赚到的钱，通过什么机制流向代币持有人。</p>
<p><strong>女巫（Sybil）</strong>：一个人控制大量地址，假装成很多不同用户，多领空投或多拿投票权。</p>`)}

<h2>1. 一句话理解</h2>
${one('代币经济回答四个问题：一共发多少（供应）、发给谁（分配）、什么时候能卖（释放）、凭什么值钱（价值捕获）。前三个决定卖压从哪来、什么时候来；第四个决定买盘从哪来。设计失败的代币，通常是卖压确定而买盘只靠想象。')}
${call('analogy', `<p>把代币想成一家公司的股份。供应是总股本；分配是创始人、投资人、员工期权池各占多少；释放是期权的归属计划（vesting）；价值捕获是分红和回购。</p>
<p>比喻的局限：股份背后有法律上的剩余索取权，公司亏损也有清算顺序。大多数代币没有这些法律权利，“分红”只是一段可以被治理改掉的合约代码。</p>`)}
${art('一图看懂：上线时只有 12% 的币在市场上，另外 88% 还在路上', 660, 330, [
  S.text(330, 22, '总量 10 亿枚，上线价 0.50 美元（示例）', { size: 13, anchor: 'middle', dim: 1 }),
  S.box(10, 36, 92, 56, { k: 'info', t: '12%', s: 'TGE 流通', mono: 1 }),
  S.box(106, 36, 544, 56, { k: 'idle', dash: 1, t: '88% 仍锁定或待释放', s: '其中投资人 18%：悬崖 12 个月，总期 36 个月' }),
  S.arrow(56, 94, 56, 122, { k: 'plain' }),
  S.arrow(330, 94, 330, 122, { k: 'plain' }),
  S.arrow(550, 94, 550, 122, { k: 'risk' }),
  S.box(10, 124, 200, 76, { k: 'info', icon: 'chart', t: '市值 6,000 万美元', s: '0.50 × 1.2 亿枚在流通' }),
  S.box(230, 124, 200, 76, { k: 'tint', icon: 'globe', t: 'FDV 5 亿美元', s: '0.50 × 10 亿枚\n是市值的 8.3 倍' }),
  S.box(450, 124, 200, 76, { k: 'risk', icon: 'clock', t: '第 12 个月解锁', s: '6,000 万枚 ≈ 3,000 万美元\n约占当时流通量的 24%' }),
  S.arrow(550, 202, 550, 230, { k: 'risk' }),
  S.box(110, 232, 540, 62, { k: 'key', icon: 'warn', t: '3,000 万 ÷ 日成交 500 万 ＝ 6 天的全市场成交额', s: '读解锁表，看“解锁金额 ÷ 日成交额”，不要只看枚数', mono: 1 })
], [
  ['flow', '市场只为流通的那一小部分定价；剩下的币按解锁表一批批进入，每一批都是潜在卖压。'],
  ['key', 'FDV ÷ 市值越大，未来要被市场消化的筹码越多。8.3 倍意味着 88% 的币还没到场。'],
  ['risk', '悬崖日补发会让某个月出现一大根解锁量；不同类别的悬崖撞在同一个月，会叠加。'],
  ['limit', '图中数字是示例，不是某个真实代币的数据；真实项目要读它自己的解锁表。']
], '顶部一条横条表示总量十亿枚：左侧 12% 已在流通，右侧 88% 仍在锁定；下方三个方框分别是市值六千万美元、完全稀释估值五亿美元、第十二个月投资人解锁三千万美元；底部结论是这笔解锁相当于六天的全市场成交额。', 'm02-60')}

<h2>2. 四个问题的全景</h2>
${recall('<p>ERC-20 的接口和授权见 <a href="#m02-5">M02.5 ERC-20 与授权</a>。分配表示例、IDO 认购比例的算法、悬崖期与线性释放的公式和一个手写的锁仓合约，已经在 <a href="#m02-50">M02.6 NFT 与代币发行</a> 第 6 节讲过。本篇不重复这些，而是讲“怎么判断一套设计是好是坏”。</p>')}
${layers('代币经济的四层', [
  { name: '供应', sub: '一共有多少，会不会变', chips: ['固定上限', '通胀发行', '燃烧销毁', '增发权限在谁手里'] },
  { name: '分配', sub: '给谁', chips: ['团队', '投资人', '社区激励', '金库', '空投 / 公开发售'] },
  { name: '释放', sub: '什么时候能卖', chips: ['TGE 解锁', '悬崖期', '线性释放', '排放曲线'], kind: 'risk' },
  { name: '价值捕获', sub: '凭什么值钱', chips: ['手续费开关', '回购燃烧', 've 锁仓', '治理权 / 使用权'], kind: 'key' }
], [
  ['flow', '上三层决定“有多少代币、在谁手里、何时进入市场”，也就是卖压的大小和时间。最下层决定协议收入如何变成对代币的需求。'],
  ['risk', '释放层是最常见的出错点：总量和分配看起来合理，但大量代币在同一个月解锁，价格承受不住。'],
  ['key', '读一个代币，先看合约里谁有增发和改参数的权限，再看解锁表，最后才看白皮书里的价值叙事。'],
  ['limit', '这四层都只是机制。代币最终值多少钱，取决于协议有没有真实用户和收入，机制设计救不了没人用的产品。']
], ['分配给', '按计划释放', '收入回流'])}

<h2>3. 供应模型：固定、通胀与燃烧</h2>
${compare('三种供应模型', [
  { name: '固定上限', tag: '例：比特币', kind: 'info', points: ['总量写死在共识规则里', '新币来自区块奖励，按固定节奏减半', '稀缺叙事清楚', '长期安全预算只能靠手续费'] },
  { name: '持续通胀', tag: '例：多数 PoS 链、流动性挖矿', kind: 'warn', points: ['每年按比例或固定数量增发', '增发用来支付质押者、验证者或流动性提供者', '不参与的持有人被稀释', '通胀率通常可由治理调整'] },
  { name: '燃烧抵消', tag: '例：以太坊 EIP-1559', kind: 'key', points: ['使用协议时销毁一部分代币', '净供应 = 发行 − 燃烧', '使用量高时净供应可能下降', '燃烧量随使用量波动，不是承诺'] }
], [
  ['flow', '比特币的新币只来自区块奖励，每 210,000 个区块减半一次，所以总量趋近但略少于 2,100 万枚。' + cite('Bitcoin Core 源码：consensus/amount.h（MAX_MONEY 注释）', 'https://github.com/bitcoin/bitcoin/blob/master/src/consensus/amount.h')],
  ['key', 'EIP-1559 把每笔交易的基础费（base fee）直接销毁，只把小费给出块者。' + cite('EIP-1559 规范', 'https://eips.ethereum.org/EIPS/eip-1559') + '燃烧让“使用量”和“供应量”挂钩。'],
  ['risk', '通胀发行的代币要问：谁在为这些新代币买单？如果买家只是来挖矿然后卖出的人，通胀就是持续卖压。'],
  ['limit', '“通缩”不等于“涨价”。供应下降只是减少卖压，需求不足时价格照样下跌。']
])}
<p><strong>算一算（示例）：</strong>某 PoS 代币总量 1,000,000,000 枚，年通胀 5%，新增代币全部发给质押者。全网质押率 60%。</p>
${steps([
  '一年新增 1,000,000,000 × 5% = 50,000,000 枚。',
  '质押者共持有 600,000,000 枚，名义年化 = 50,000,000 ÷ 600,000,000 ≈ 8.33%。',
  '一年后总量 1,050,000,000。质押者占比从 60% 升到 650,000,000 ÷ 1,050,000,000 ≈ 61.9%。',
  '不质押的持有人仍是 400,000,000 枚，占比从 40% 降到 400,000,000 ÷ 1,050,000,000 ≈ 38.1%：他们被稀释了约 4.8%（= 1 − 1 ÷ 1.05）。',
  '结论：质押者的“真实收益”≈ (1 + 8.33%) ÷ (1 + 5%) − 1 ≈ 3.2%，不是 8.33%。名义收益里有一大半只是抵消通胀。'
])}

<h2>4. 分配与释放：卖压从哪来、什么时候来</h2>
<p>分配表告诉你代币在谁手里，解锁表告诉你他们<strong>什么时候能卖</strong>。读解锁表时看四个参数：</p>
${tbl(['参数', '含义', '设计意图', '看什么'], [
  ['分配比例', '这一类人占总量多少', '激励对齐：团队和早期投资人拿得多，长期绑定', '团队 + 投资人合计占比；超过一半时治理和价格都由内部人主导' + tag('推断')],
  ['TGE 解锁', '上线当天立刻可卖的比例', '给空投用户和公开发售者流动性', 'TGE 流通量太低，价格由很少的筹码决定，FDV 虚高'],
  ['悬崖期（Cliff）', '这段时间内一枚都不解锁', '防止上线即抛', '悬崖结束那个月是否“补发”累计部分：补发会造成单月巨量解锁'],
  ['线性释放', '悬崖后按月或按秒均匀解锁', '把卖压摊平', '线性期越长越平滑；不同类别的悬崖是否撞在同一个月']
])}
${call('info', '<p>“悬崖后开始线性”和“悬崖日补发”是两种不同的写法。<a href="#m02-50">M02.6</a> 的公式属于后者：线性从起点开始计算，悬崖期内累计的部分在悬崖结束时一次性解锁。OpenZeppelin 的 <code>VestingWalletCliff</code> 也是这种语义：悬崖前返回 0，悬崖后按从起点算起的线性曲线返回。' + cite('OpenZeppelin Contracts 5.x：Finance（VestingWallet、VestingWalletCliff）', 'https://docs.openzeppelin.com/contracts/5.x/api/finance') + '同样是“12 个月悬崖 + 48 个月”，两种写法在第 12 个月的解锁量完全不同。</p>')}
<p>先做下面的实验，再看算一算。</p>
${lab('vesting')}
<p>实验里切换“释放方式”，观察第 12 个月：补发写法会出现一根大柱。再把投资人的悬崖期和团队设成同一个月，看两类解锁叠加的效果。</p>
<p><strong>算一算（示例）：</strong>总量 1,000,000,000 枚，上线价格 0.50 美元。TGE 流通 12%。投资人占 18%，悬崖 12 个月，悬崖日补发，总期 36 个月。二级市场日均成交额 500 万美元。</p>
${steps([
  'FDV = 0.50 × 1,000,000,000 = 5 亿美元；市值 = 0.50 × 120,000,000 = 6,000 万美元。FDV 是市值的 8.3 倍：市场只为 12% 的筹码定价。',
  '第 12 个月投资人解锁 = 180,000,000 × 12 ÷ 36 = 60,000,000 枚，按 0.50 美元约 3,000 万美元。',
  '假设流通量此时约 2.5 亿枚，这一次解锁相当于流通量的 24%。',
  '3,000 万美元 ÷ 每天 500 万美元 = 6 天的全市场成交额。即使只有一半被卖出，也要市场连续多天额外吸收。',
  '结论：看解锁不看“枚数”，而看“解锁量 ÷ 当时流通量”和“解锁金额 ÷ 日成交额”。'
])}
<p>做市商 Keyrock 统计了 16,000 多次代币解锁，发现约 90% 的解锁伴随负面价格压力；团队解锁影响最大，生态激励类解锁影响最小，价格压力往往在解锁前约 30 天就开始。${cite('Keyrock：From Locked to Liquidity: What 16,000+ Token Unlocks Teach Us', 'https://keyrock.com/from-locked-to-liquidity-what-16000-token-unlocks-teach-us/')}这是统计规律，不是对任何单个代币的预测。</p>
<p>工程上不要手写锁仓合约，直接用经过审计的 OpenZeppelin 实现。下面用 v5.1 起提供的 <code>VestingWalletCliff</code> 组合出一个带悬崖期的锁仓钱包：</p>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VestingWallet} from "@openzeppelin/contracts/finance/VestingWallet.sol";
import {VestingWalletCliff} from "@openzeppelin/contracts/finance/VestingWalletCliff.sol";

// 一个受益人一个钱包：把代币转进来，受益人随时调用 release(token) 领取已解锁部分
contract TeamVesting is VestingWalletCliff {
    constructor(address beneficiary, uint64 start, uint64 durationSeconds, uint64 cliffSeconds)
        VestingWallet(beneficiary, start, durationSeconds)   // 线性曲线从 start 开始算
        VestingWalletCliff(cliffSeconds)                     // cliff 前 vestedAmount 返回 0
    {}
}

// 部署示例（数值为示例）：
// start = TGE 时间戳，duration = 48 个月，cliff = 12 个月
// new TeamVesting(alice, tge, 48 * 30 days, 12 * 30 days);
// 然后 token.transfer(address(wallet), 1_200_000e18);
// 注意：VestingWallet 继承 Ownable，owner 就是受益人，可以 transferOwnership 把领取权转给别人
`)}
${call('warn', '<p>审查锁仓时只看三件事：锁仓合约是否可升级；有没有任何地址能提前取走锁仓代币；代币合约本身是否还有不受限的增发权限。三者中任何一个答案是“有”，解锁表就只是一个承诺。</p>')}

<h2>5. 价值捕获：协议收入怎么流向代币</h2>
${mm('三种价值捕获路径', `
flowchart LR
  U["用户交易 / 借款"] --> F["协议手续费收入"]
  F -->|"手续费开关"| T["协议金库或分配合约"]
  F -->|"默认"| LP["流动性提供者 / 存款人"]
  T -->|"回购"| B["市场买入代币"]
  B -->|"销毁"| X["总量减少"]
  T -->|"分给锁仓者"| V["ve 锁仓持有人"]
  V -->|"投票"| G["决定排放流向哪个池子"]
  G -->|"更多激励"| LP
`, [
  ['flow', '默认情况下，很多协议的手续费 100% 给流动性提供者。打开“手续费开关”后，一部分流向协议，再通过回购燃烧或分配给锁仓者回流到代币。'],
  ['key', '价值捕获的前提是协议有真实收入。没有收入，回购和分红都只能花金库的钱，等于用自己的钱买自己的代币。'],
  ['risk', '手续费开关从流动性提供者手里拿走收入。如果拿得太多，流动性会迁移到竞争对手，收入反而下降。'],
  ['limit', '这些机制都由治理控制，可以被下一次投票关闭或改参数。持有人得到的不是法律权利。']
])}
${tbl(['机制', '怎么做', '真实例子', '要注意'], [
  ['手续费开关（Fee switch）', '把交易手续费的一部分从流动性提供者转给协议', 'Uniswap 的 UNIfication 提案在 2025 年 12 月以 99.9% 赞成通过：打开协议手续费并用于持续销毁 UNI，并在两天时间锁后从金库销毁 1 亿枚 UNI。' + cite('The Block：Uniswap governance passes UNIfication proposal（2025-12-25）', 'https://www.theblock.co/post/383742/uniswap-passes-unification-proposal'), '流动性提供者收入下降；监管上可能更像“收益分配”'],
  ['回购燃烧（Buyback & burn）', '用收入在市场买入代币后销毁', '同上：Uniswap 把协议手续费用于销毁 UNI', '回购价格和节奏要透明，否则内部人可以抢跑'],
  ['ve 锁仓（Vote-escrow）', '锁仓越久，得到越多不可转让的投票权和收益份额', 'Curve：锁 CRV 1 周到 4 年，得到 veCRV = 锁仓量 × 剩余年数 ÷ 4，余额随时间线性衰减；持有人分手续费、加速奖励、投票决定 CRV 排放流向。' + cite('Curve 文档：What is veCRV', 'https://docs.curve.finance/user/vecrv/what-is-vecrv'), '锁仓者流动性被锁死；出现“贿选”市场，排放流向出价最高的项目']
])}
<p><strong>算一算（示例）：</strong>按 Curve 的公式 veCRV = CRV × 剩余年数 ÷ 4。</p>
${steps([
  'Alice 锁 1,000 CRV 4 年：得到 1,000 × 4 ÷ 4 = 1,000 veCRV。',
  'Bob 锁 1,000 CRV 1 年：得到 1,000 × 1 ÷ 4 = 250 veCRV。同样多的币，Bob 的投票权只有 Alice 的四分之一。',
  '2 年后 Alice 剩余 2 年：余额衰减到 1,000 × 2 ÷ 4 = 500 veCRV。她若续期到 4 年，又回到 1,000。',
  '结论：ve 设计奖励“长期承诺”，让短期投机者拿不到多数投票权。代价是锁仓者在 4 年内无法卖出。'
])}

<h2>6. 空投、女巫过滤与积分计划</h2>
${recall('<p>Merkle 树如何让合约只存一个根就能验证海量领取名单，见 <a href="#m01-2">M01.2 默克尔树与轻节点</a>。本节讲空投在经济设计上的问题：发给谁、怎么防女巫。</p>')}
${steps2('一次空投的流程', [
  { t: '① 定规则与快照', d: '选定区块高度作为快照，定义资格（交互次数、时长、金额），提前不公开具体规则' },
  { t: '② 女巫过滤', d: '把地址画成资金流图，找出由同一来源资助、行为相同的地址簇', kind: 'risk' },
  { t: '③ 生成名单', d: '计算每个地址的数量，生成 Merkle 根，名单和证明公开' },
  { t: '④ 领取期', d: '用户提交 Merkle 证明领取；设领取截止时间', kind: 'key' },
  { t: '⑤ 回收与评估', d: '未领取部分回收金库；追踪 30 / 90 天后还留在链上的用户' }
], [
  ['flow', '规则在快照之后公布，才能减少“按规则刷量”。'],
  ['risk', '女巫过滤永远有误伤和漏网：太严会误伤真实用户，太松让工作室拿走大头。'],
  ['key', '空投的目标是把代币交给会留下来使用和治理的人。领完就卖的地址越多，空投越接近一次性卖压。']
])}
<p>两个公开的女巫过滤案例：</p>
<ul>
  <li><strong>Arbitrum（2023）</strong>：基金会公开了过滤方法。先剔除交易所、桥和合约地址；再用“首次资助”和“最后归集”交易建资金图，把大的连通子图用 Louvain 社区检测算法拆成簇；同一来源资助、在 20 个以上地址的簇内转账、行为相似的地址被判为女巫。${cite('Arbitrum Foundation：sybil-detection（GitHub）', 'https://github.com/ArbitrumFoundation/sybil-detection')}</li>
  <li><strong>LayerZero（2024）</strong>：2024 年 5 月 3 日推出“自首”机制，14 天内自报的女巫地址保留原计划份额的 15%，之后被查出的地址一枚不给。${cite('The Block：LayerZero offers sybil farmers chance to self-report（2024-05-03）', 'https://www.theblock.co/post/292502/layerzero-offers-sybil-farmers-chance-to-self-report-in-the-name-of-durability')}</li>
</ul>
<p><strong>积分计划（Points）</strong>是空投前的“记账”：协议先按用户的存款量和时长发积分，不承诺兑换比例，以后再决定空投。EigenLayer 的再质押积分就是按“ETH × 小时”累计的。${cite('EigenLayer 文档：Restaked Points', 'https://docs.eigenlayer.xyz/eigenlayer/restaking-guides/restaking-user-guide/restaked-points')}积分对协议的好处是灵活，对用户的风险是：积分不是代币，没有合约保证，兑换规则可以事后改变。</p>
${exq([['为什么积分计划容易吸引“雇佣兵资金”？', '<p>积分按存款量 × 时长累计，用户的目标是空投而不是使用产品。空投一发完，激励消失，资金立即撤走。评估一个积分计划，要看空投后 30 天和 90 天的留存，而不是积分期间的峰值 TVL。</p>']])}

<h2>7. 常见失败方式</h2>
${mm('反身性死亡螺旋', `
flowchart TB
  A["代币价格下跌"] --> B["用代币支付的收益<br/>按美元计算变少"]
  B --> C["流动性和用户离开"]
  C --> D["协议收入下降"]
  D --> E["持有人卖出代币"]
  E --> A
  A --> F["若代币还是抵押品<br/>触发清算抛售"]
  F --> A
`, [
  ['flow', '当代币既是激励、又是抵押品、又是协议偿付能力的来源时，价格下跌会通过多条路径放大自己。'],
  ['fail', '算法稳定币是最极端的情况：用新铸的治理代币去赎回稳定币，价格越跌铸得越多。UST 与 LUNA 的过程见 <a href="#m02-9">M08.1 稳定币</a>。'],
  ['risk', '持有人越集中、杠杆越高，螺旋启动越快。'],
  ['key', '打断螺旋的办法：收益用外部资产支付（例如手续费里的稳定币），代币不作为系统偿付的最后来源。']
])}
${tbl(['失败方式', '机制', '早期信号'], [
  ['死亡螺旋', '代币价格与协议偿付能力或收益互相绑定', '收益完全用自身代币支付；代币同时被大量用作抵押品'],
  ['解锁悬顶（Unlock overhang）', '低流通高 FDV，后续解锁持续稀释', 'TGE 流通低于 10%（示例阈值）；团队与投资人悬崖撞在同一个月'],
  ['雇佣兵流动性', '排放结束或积分兑现后，资金立即离开', 'TVL 随排放率同步涨跌；用户留存低'],
  ['治理被收购', '代币便宜而金库很大，买票比攻击合约便宜', '金库价值远高于流通市值；投票参与率低。见 <a href="#m02-61">M08.7 DAO 治理与运营</a>'],
  ['隐藏增发', '合约里保留不受限的 mint 权限', '用区块浏览器读合约，找 mint、owner、可升级代理']
])}
<p>判断一个项目是否会走到这些失败方式，需要系统的研究方法，见 <a href="#m02-65">M08.8 项目研究与尽调</a>。</p>
${cases([
  ['Iron Finance：部分抵押稳定币与 TITAN 的挤兑', '2021-06', '<p>Iron Finance 的稳定币 IRON 由 USDC 和协议自己的代币 TITAN 共同支撑。2021 年 6 月中旬，大户从 IRON/USDC 池撤出流动性，IRON 脱锚；持有人赎回 IRON 时协议铸造并支付 TITAN，TITAN 被持续抛售，价格从约 60 多美元跌到接近 0。团队在事后复盘中称其为加密世界第一次大规模挤兑。</p><p>启示：用自己铸的代币作为偿付手段，价格下跌时偿付需要铸造更多代币，形成正反馈。</p>', [['The Defiant：Iron Finance implodes after bank run', 'https://thedefiant.io/news/defi/iron-finance-implodes-after-bank-run'], ['The Block：Mark Cuban on Titan’s collapse', 'https://www.theblock.co/post/108991/there-are-investments-and-there-are-flyers-mark-cuban-on-titans-collapse']]]
], 'h3')}

${tryit(`<p><strong>动手练习：</strong>从链上数据算出 veCRV 的平均锁仓时长。</p>
${steps([
  '在 Etherscan 打开 Curve 的 VotingEscrow 合约 <code>0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2</code>，进入 Contract → Read Contract。',
  '读 <code>supply</code>：当前锁在合约里的 CRV 总量（18 位小数）。',
  '读 <code>totalSupply</code>：当前全部 veCRV 余额。',
  '计算 平均剩余锁仓年数 ≈ totalSupply ÷ supply × 4。',
  '选做：在 Foundry 项目里 <code>forge install OpenZeppelin/openzeppelin-contracts</code>，部署上面的 <code>TeamVesting</code>，用 <code>vm.warp</code> 跳到第 11、12、24 个月，打印 <code>releasable(token)</code>，确认悬崖日补发的跳变。'
])}
<p>预期结果：你得到一个 0 到 4 之间的数字。越接近 4，说明锁仓者越倾向长期锁定。</p>`)}

${exercises([
  ['某代币年通胀 8%，全部给质押者，质押率 40%。不质押的持有人一年被稀释多少？质押者的真实收益约是多少？', '<p>新增 8% 总量，质押者名义年化 = 8% ÷ 40% = 20%。不质押者占比变为 1 ÷ 1.08，被稀释约 7.4%。质押者真实收益 ≈ 1.20 ÷ 1.08 − 1 ≈ 11.1%。</p>'],
  ['团队 20%、投资人 18%，都是 12 个月悬崖、悬崖日补发，总期分别是 48 和 36 个月。第 12 个月一共解锁总量的百分之几？如何改设计减轻冲击？', '<p>团队 20% × 12 ÷ 48 = 5%，投资人 18% × 12 ÷ 36 = 6%，合计 11%。改法：改成“悬崖后才开始线性”（第 12 个月不补发）；把两类的悬崖错开；或在悬崖后按月而不是一次性解锁。</p>'],
  ['一个协议没有手续费收入，却宣布每月用金库的稳定币回购燃烧代币。这是价值捕获吗？', '<p>不是可持续的价值捕获。回购用的是金库存量，不是经营收入；金库花完就停止。它短期支撑价格，长期减少协议的运营资金。判断标准是回购资金是否来自持续的外部收入。</p>'],
  ['设计一个空投的女巫过滤规则，并说出它的一种误伤情况。', '<p>例如：同一个地址首次资助了 20 个以上地址，且这些地址在同一天内做了相同顺序的交互，判为女巫簇。误伤：一个家庭或公司用同一个交易所提币地址给多个真实成员转 Gas，会被误判为同一来源。所以通常要先剔除交易所地址。</p>']
])}
${checklist([
  '能说出固定、通胀、燃烧三种供应模型，并算出通胀对不质押者的稀释。',
  '能从一张解锁表算出 TGE 流通量、FDV 与市值之比，以及任一月份的解锁量。',
  '能区分“悬崖后开始线性”和“悬崖日补发”，并在实验里复现两者的差别。',
  '能讲清手续费开关、回购燃烧和 ve 锁仓的资金流向与各自的代价。',
  '能列出至少三种女巫过滤信号，以及积分计划对用户的风险。'
])}
${mistakes([
  ['总量固定或通缩的代币一定会涨。', '供应只决定卖压。没有需求，固定总量的代币照样下跌。'],
  ['质押年化 10% 就是赚 10%。', '如果年化来自通胀增发，要扣除稀释后才是真实收益。'],
  ['锁仓 4 年就安全了。', '先查锁仓合约能否升级、有没有人能提前提走、代币还能不能增发。'],
  ['市值小就是便宜。', '低流通的代币要看 FDV。市值只为流通部分定价，后续解锁会持续稀释。'],
  ['积分迟早会按比例换成代币。', '积分没有合约保证，兑换规则由项目方决定，可以事后改变。']
])}
${recap([
  '代币经济的四个问题：供应、分配、释放、价值捕获。前三个决定卖压，最后一个决定买盘。',
  '通胀发行的名义收益要扣除稀释；燃烧把供应与使用量挂钩，但不保证价格。',
  '读解锁表看“解锁量 ÷ 当时流通量”和“解锁金额 ÷ 日成交额”，注意悬崖日补发造成的单月尖峰。',
  '价值捕获要有真实收入：手续费开关、回购燃烧、ve 锁仓都由治理控制，都可以被改掉。',
  '空投和积分的目标是留住真实用户；女巫过滤用资金图聚类，永远在误伤和漏网之间取舍。'
])}
${quiz([
  { q: '代币价格 1 美元，总量 10 亿枚，流通 1 亿枚。FDV 和市值分别是多少？', o: ['FDV 1 亿，市值 10 亿', 'FDV 10 亿，市值 1 亿', '两者都是 10 亿', '两者都是 1 亿'], a: 1, why: 'FDV = 价格 × 总量 = 10 亿美元；市值 = 价格 × 流通量 = 1 亿美元。FDV 是市值的 10 倍，说明 90% 的代币还没进入市场。' },
  { q: '同样“12 个月悬崖 + 总期 48 个月”，哪种写法会在第 12 个月出现单月大量解锁？', o: ['悬崖后才开始线性', '悬崖日补发（线性从起点算起）', '两种一样', '都不会解锁'], a: 1, why: '补发写法在悬崖结束时一次性解锁前 12 个月累计的 25%；另一种写法第 12 个月只开始解锁第一个月的量。' },
  { q: '按 Curve 公式，锁 2,000 CRV 2 年得到多少 veCRV？', o: ['2,000', '500', '4,000', '1,000'], a: 3, why: 'veCRV = 2,000 × 2 ÷ 4 = 1,000。之后余额随剩余时间线性下降。' },
  { q: '下面哪个是 Arbitrum 公开的女巫过滤方法中使用的手段？', o: ['要求所有用户 KYC', '用资金图和 Louvain 社区检测把地址聚类', '只看地址的 ETH 余额', '随机抽取一半地址'], a: 1, why: '基金会公开的方法先剔除交易所、桥和合约地址，再用首次资助和归集交易建图并聚类。' },
  { q: '以下哪种情况最容易形成死亡螺旋？', o: ['收益用手续费里的稳定币支付', '代币总量固定、没有增发', '协议用新铸的自身代币作为偿付手段', '代币只用于治理投票'], a: 2, why: '用自身代币偿付时，价格越低需要铸得越多，抛压越大，形成正反馈。Iron Finance 和 UST 都是这一结构。' }
])}
${terms([
  ['代币经济', 'Tokenomics', '代币的供应、分配、释放节奏和价值来源的整体设计。'],
  ['代币生成事件', 'TGE (Token Generation Event)', '代币首次铸造并开始流通的时刻。'],
  ['完全稀释估值', 'FDV (Fully Diluted Valuation)', '当前价格乘以最终总量。'],
  ['解锁悬顶', 'Unlock overhang', '大量未解锁代币将在未来进入市场，形成持续的潜在卖压。'],
  ['手续费开关', 'Fee switch', '把协议手续费的一部分从流动性提供者转给协议或代币持有人的治理开关。'],
  ['投票托管', 'Vote-escrow (ve)', '锁仓越久获得越多不可转让投票权和收益份额，余额随剩余时间衰减的设计。'],
  ['女巫攻击', 'Sybil attack', '一人控制大量地址冒充多个用户，多领空投或多拿投票权。'],
  ['积分计划', 'Points program', '空投前按用户行为累计、没有兑换承诺的链下记分。'],
  ['死亡螺旋', 'Death spiral', '代币价格下跌通过收益、抵押、偿付等路径自我放大的正反馈。']
])}
` });

CUR = 'm02-61';
addCh({ id: 'm02-61', nav: 'DAO 治理与运营', title: 'M08.7 DAO 治理与运营：提案、投票、时间锁与金库', desc: '从 Governor + 时间锁的完整部署，到 Snapshot 链下投票、Safe 金库和治理攻击', html: `
<h1>M08.7 DAO 治理与运营：提案、投票、时间锁与金库</h1>
${meta(['用 Foundry 部署 Governor + TimelockController，正确设置角色，并在测试里走完 propose → vote → queue → execute。', '比较代币投票、ve 投票、多签理事会和乐观治理，说清 Snapshot 链下投票的结果怎样才能在链上执行。', '设计一个 Safe 金库的权限方案，并用真实案例说明治理攻击的三种路径和防御。'], '前置：<a href="#m02-60">M08.6 代币经济设计</a>、<a href="#m02-3">M02.3 Solidity 基础 II</a>')}
${beginner(`<p><strong>DAO（Decentralized Autonomous Organization，去中心化自治组织）</strong>：用链上合约和代币投票来做决定、管钱的组织。</p>
<p><strong>提案（Proposal）</strong>：一组“要调用哪个合约、哪个函数、传什么参数”的操作，加上一段说明文字。</p>
<p><strong>时间锁（Timelock）</strong>：一个合约。提案通过后必须在这里排队等待一段时间，才能执行。</p>
<p><strong>委托（Delegation）</strong>：把自己代币的投票权交给另一个地址（也可以交给自己）。代币不离开你的钱包。</p>
<p><strong>法定人数（Quorum）</strong>：提案有效所需的最低票数。</p>
<p><strong>多签（Multisig）</strong>：需要 n 个签名人中至少 m 个签名才能执行交易的钱包，最常用的是 Safe。</p>`)}

<h2>1. 一句话理解</h2>
${one('DAO 治理就是“谁能提出改动、谁来投票、通过后等多久、由谁执行、钱放在哪”这五件事的合约化。好的治理让改动可预期、可观察、可撤离；坏的治理让一个买到足够票的人可以合法地拿走金库。')}
${call('analogy', `<p>像一个业主委员会：业主按面积投票（代币投票），可以委托邻居代投（委托），决议要贴公告七天后才执行（时间锁），公共维修基金放在需要三位委员共同签字的账户里（多签金库）。</p>
<p>比喻的局限：业主委员会的决议还受法律约束，可以上法院撤销。链上提案一旦执行，没有法院能回滚交易。</p>`)}
${art('一图看懂：DAO 的票不直接动钱，提案要先过时间锁', 660, 306, [
  S.box(10, 36, 130, 98, { k: 'info', icon: 'users', t: '持币人', s: '委托给委托人\n才有投票权' }),
  S.box(170, 36, 130, 98, { k: 'info', icon: 'doc', t: 'Governor', s: '提案与计票\n法定人数 4%\n（示例）' }),
  S.box(330, 36, 130, 98, { k: 'key', icon: 'clock', t: '时间锁', s: '排队 2 天后\n真正执行', tag: '执行者' }),
  S.box(490, 36, 160, 98, { k: 'ok', icon: 'bank', t: '金库与协议合约', s: 'owner ＝ 时间锁\n不是 Governor' }),
  S.arrow(142, 85, 168, 85, { k: 'plain' }),
  S.arrow(302, 85, 328, 85, { k: 'plain' }),
  S.arrow(462, 85, 488, 85, { k: 'plain' }),
  S.box(250, 176, 300, 58, { k: 'risk', icon: 'shield', t: '安全多签 3/5（可选）', s: '只能取消恶意提案，不能转钱' }),
  S.arrow(395, 174, 395, 136, { k: 'risk', label: '取消' }),
  S.text(330, 270, '投票通过 ≠ 立即执行：等待期里，其他人有时间退出或取消（示例参数）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '持币人投票，Governor 计票，时间锁排队并执行，最后才动到金库和协议合约。'],
  ['key', '权限都交给时间锁而不是 Governor；部署者必须放弃 DEFAULT_ADMIN_ROLE。'],
  ['risk', '买票或恶意提案能通过投票，但时间锁留出的等待期和取消权是最后一道防线。'],
  ['limit', '一币一票不是一人一票：投票权和财富成正比，链上没有可靠的“一个人”身份。']
], '从左到右四个方框：持币人投票，Governor 提案与计票，时间锁排队两天后执行，金库与协议合约由时间锁持有；时间锁下方有一个红色的安全多签，只能取消恶意提案。', 'm02-61')}

<h2>2. 治理模型全景</h2>
${compare('四种常见治理模型', [
  { name: '代币投票', tag: '一币一票', kind: 'info', points: ['持币即有投票权（委托后）', '透明、可组合', '大户和交易所主导', '参与率低时容易被买票攻击'] },
  { name: 've 投票', tag: '锁仓加权', kind: 'key', points: ['锁得越久票越多', '短期投机者票少', '流动性被锁死', '出现贿选市场'] },
  { name: '多签理事会', tag: '少数人签名', kind: 'warn', points: ['决策快，适合紧急情况', '信任集中在签名人', '常作为“安全委员会”只负责暂停', '要公开签名人和门限'] },
  { name: '乐观治理', tag: '默认通过，可否决', kind: 'info', points: ['小组提出、社区在期限内可否决', '降低投票疲劳', '依赖有人盯着', '否决门槛设计是关键'] }
], [
  ['flow', '真实 DAO 往往组合使用：代币投票决定大事，多签执行日常支出，安全委员会负责紧急暂停。' + tag('惯例')],
  ['risk', '任何模型最后都落在“谁持有执行权限”上。查清楚时间锁、金库和代理合约的 owner 是谁，比读治理论坛更重要。'],
  ['limit', '一币一票不是一人一票。投票权和财富成正比，链上没有可靠的“一个人”身份。'],
  ['key', 've 投票的锁仓公式见 <a href="#m02-60">M08.6 代币经济设计</a>。']
])}

<h2>3. Governor + TimelockController：从部署到执行</h2>
${recall('<p>提案的状态机（Pending → Active → Succeeded → Queued → Executed）、法定人数的计算、<code>ERC20Votes</code> 治理代币的写法、Beanstalk 闪电贷治理攻击，已在 <a href="#m02-8">M02.9 合约安全 II</a> 第 6.1 节讲过。本节讲部署时的角色设置和一次提案的完整调用。</p>')}
<p>OpenZeppelin 的治理由两个合约组成：<strong>Governor</strong> 负责提案和计票；<strong>TimelockController</strong> 负责排队和执行。<strong>时间锁才是真正执行提案的地址</strong>，所以金库资金、合约 owner 和各种权限都应该交给时间锁，而不是 Governor。${cite('OpenZeppelin Contracts 5.x：How to set up on-chain governance', 'https://docs.openzeppelin.com/contracts/5.x/governance')}</p>
${tbl(['时间锁角色', '作用', '应该给谁'], [
  ['PROPOSER_ROLE', '把操作放进队列', '只给 Governor。再给别人，等于让他绕过投票直接排队'],
  ['CANCELLER_ROLE', '取消队列中的操作', 'Governor；可以另给一个安全委员会多签，用于取消恶意提案'],
  ['EXECUTOR_ROLE', '执行到期的操作', '零地址（任何人都能执行），或者 Governor'],
  ['DEFAULT_ADMIN_ROLE', '授予和收回上面的角色', '时间锁自己。部署账户用完必须放弃（renounce）']
])}
${code('SOLIDITY', `
// script/DeployGov.s.sol —— forge script script/DeployGov.s.sol --rpc-url $RPC --broadcast
// 依赖：forge install OpenZeppelin/openzeppelin-contracts
// GovToken 和 MyGovernor 的写法见 M02.9（ERC20Votes + Governor 各模块组合）
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {GovToken} from "../src/GovToken.sol";
import {MyGovernor} from "../src/MyGovernor.sol";

contract DeployGov is Script {
    function run() external {
        vm.startBroadcast();
        address deployer = msg.sender;

        GovToken token = new GovToken();
        // 最小延迟 2 天；先不设 proposer/executor，部署者暂任 admin
        TimelockController tl = new TimelockController(2 days, new address[](0), new address[](0), deployer);
        MyGovernor gov = new MyGovernor(token, tl);

        tl.grantRole(tl.PROPOSER_ROLE(), address(gov));   // 只有 Governor 能排队
        tl.grantRole(tl.CANCELLER_ROLE(), address(gov));  // Governor 能取消
        tl.grantRole(tl.EXECUTOR_ROLE(), address(0));     // 到期后任何人都能执行
        tl.renounceRole(tl.DEFAULT_ADMIN_ROLE(), deployer); // 关键一步：部署者放弃管理权

        // 之后把金库资金和协议合约的 owner 转给 tl，而不是 gov
        vm.stopBroadcast();
    }
}
`)}
${mm('一次提案的完整调用（含时间锁）', `
sequenceDiagram
  participant P as 提案人
  participant G as Governor
  participant V as 投票人
  participant T as TimelockController
  participant X as 目标合约
  P->>G: propose 目标 金额 calldata 描述
  Note over G: 等待 votingDelay
  V->>G: castVote 提案ID 支持=1
  Note over G: 等待 votingPeriod 结束
  P->>G: queue 同样参数 加 descriptionHash
  G->>T: scheduleBatch
  Note over T: 等待 minDelay
  P->>G: execute 同样参数 加 descriptionHash
  G->>T: executeBatch
  T->>X: 以时间锁身份调用目标函数
`, [
  ['flow', '提案 ID 是参数的哈希，链上不保存参数本身。所以 queue 和 execute 要原样传回目标、金额、calldata 和描述的哈希（descriptionHash）。'],
  ['key', '最后调用目标合约的是时间锁地址。目标合约的权限检查要认时间锁。'],
  ['fail', 'execute 时描述文字差一个字符，哈希就不同，交易会回滚。前端和脚本都要保存提案时的原文。'],
  ['risk', '如果时间锁之外还有别的 proposer，或者部署者没有 renounce 管理员，治理可以被绕过。']
])}
<p>在 Foundry 测试里走完一次提案：</p>
${code('SOLIDITY', `
function test_ProposalLifecycle() public {
    // 准备：voter 持有代币并委托给自己（不委托就没有投票权）
    vm.prank(voter); token.delegate(voter);
    vm.roll(block.number + 1);                       // 让委托生效的区块成为过去

    address[] memory targets = new address[](1);
    uint256[] memory values = new uint256[](1);
    bytes[] memory calldatas = new bytes[](1);
    targets[0] = address(token);
    calldatas[0] = abi.encodeCall(token.transfer, (grantee, 1_000e18)); // 时间锁持有代币，转给资助对象
    string memory desc = "Grant 1000 GOV to grantee";

    vm.prank(voter);
    uint256 id = gov.propose(targets, values, calldatas, desc);

    vm.roll(block.number + gov.votingDelay() + 1);   // 进入 Active
    vm.prank(voter); gov.castVote(id, 1);            // 0 反对 1 赞成 2 弃权
    vm.roll(block.number + gov.votingPeriod() + 1);  // 投票结束 → Succeeded

    bytes32 dh = keccak256(bytes(desc));
    gov.queue(targets, values, calldatas, dh);       // 进入时间锁
    vm.warp(block.timestamp + 2 days + 1);           // 等过 minDelay
    gov.execute(targets, values, calldatas, dh);
    assertEq(token.balanceOf(grantee), 1_000e18);
}
`)}
<p><strong>算一算（示例）：</strong>参数和 OpenZeppelin 指南一致：votingDelay = 7,200 个区块，votingPeriod = 50,400 个区块，以太坊约 12 秒一个区块；时间锁 2 天。</p>
${steps([
  '投票延迟 = 7,200 × 12 秒 = 86,400 秒 = 1 天。',
  '投票期 = 50,400 × 12 秒 = 604,800 秒 = 7 天。',
  '时间锁 = 2 天。',
  '从提案到最早执行 = 1 + 7 + 2 = 10 天。任何紧急修复都不可能走这条路，所以协议另需一个只能“暂停”的安全多签。',
  '如果部署在出块 2 秒的 L2 上而照抄区块数，投票期只有 50,400 × 2 = 100,800 秒 ≈ 1.17 天。按区块数设参数时一定要按目标链的出块时间换算。'
])}

<h2>4. 委托与法定人数：票从哪来</h2>
<p><code>ERC20Votes</code> 的投票权只记在“被委托人”名下。持币但从未委托的地址，投票权为 0。所以大多数 DAO 的实际投票权集中在少数<strong>委托人（delegate）</strong>手里：他们公开立场，收集散户委托，代为投票。</p>
${tbl(['问题', '现象', '常见对策'], [
  ['投票冷漠', '大部分代币从未委托，法定人数难以达到', '空投时提示委托；委托人计划；按参与率动态调整法定人数' + tag('惯例')],
  ['法定人数太低', '少数票即可通过提案', '法定人数按总量比例设定，并定期按实际参与率复查'],
  ['法定人数太高', '正常提案都无法通过，治理瘫痪', '允许弃权票计入法定人数（GovernorCountingSimple 就是这样）'],
  ['交易所代币', '用户存在交易所的代币由交易所控制投票权', '关注交易所地址的委托和投票记录']
])}
<p><strong>算一算（示例）：</strong>总量 1,000,000,000，法定人数 4% = 40,000,000 票。已委托的投票权共 150,000,000，历史平均参与率 30%。</p>
${steps([
  '正常提案的预期票数 ≈ 150,000,000 × 30% = 45,000,000，刚刚超过法定人数。',
  '攻击者只需要让赞成票多于反对票，并让总票数过法定人数。若反对方只有 15,000,000 票，攻击者需要 25,000,001 票赞成（同时总票数 40,000,001 达到法定人数）。',
  '假设代币价格 0.40 美元，买 25,000,001 票约 1,000 万美元。若金库有 1 亿美元，攻击“回报率”是 10 倍。这就是“金库远大于可买票成本”时治理被收购的风险。'
])}

<h2>5. Snapshot 链下投票与链上执行</h2>
<p><strong>Snapshot</strong> 是一个链下、开源的投票平台：投票人用钱包签名投票，不上链，不花 Gas。${cite('Snapshot 文档', 'https://docs.snapshot.box/')}投票权由“策略（strategy）”在固定的快照区块计算，最常见的是按某个 ERC-20 的余额计票。链下投票的问题是：<strong>结果本身不能动链上的钱</strong>。把结果接到链上有三种做法：</p>
${mm('Snapshot 结果到链上执行的三条路', `
flowchart TB
  S["Snapshot 投票通过<br/>链下签名 免 Gas"] --> M["① 多签签名人<br/>按结果手动执行"]
  S --> R["② Reality 模块<br/>在 Reality.eth 提问 投票是否通过"]
  S --> O["③ UMA oSnap<br/>乐观预言机确认结果"]
  M --> SAFE["Safe 金库执行交易"]
  R -->|"答案为是 且 冷却期结束"| SAFE
  O -->|"已于 2025-12-15 停止支持"| SAFE
`, [
  ['flow', '最常见的是第一条：Snapshot 只表达社区意见，Safe 的签名人按结果执行。信任落在签名人身上。'],
  ['key', 'Reality 模块把“这个 Snapshot 提案是否通过、交易内容是否一致”变成 Reality.eth 上的问题，有人押保证金回答；答案为“是”且过了冷却期，任何人都能触发 Safe 执行。' + cite('Gnosis Guild：zodiac-module-reality', 'https://github.com/gnosisguild/zodiac-module-reality')],
  ['fail', 'UMA 宣布 oSnap 自 2025 年 12 月 15 日起停止支持，之后不能再从 DAO 的 Safe 执行交易，集成方需关闭 oSnap 并改由签名人执行。' + cite('UMA 文档：oSnap', 'https://docs.uma.xyz/developers/osnap')],
  ['risk', '自动执行路径要有人持续盯着：没人挑战错误答案，错误的交易也会被执行。']
])}
${tbl(['', 'Governor（链上）', 'Snapshot + 多签', 'Snapshot + Reality 模块'], [
  ['投票成本', '每票一笔交易', '免 Gas', '免 Gas'],
  ['执行', '时间锁到期后任何人可执行', '签名人手动执行', '预言机答案为“是”后任何人可执行'],
  ['信任', '合约代码', '签名人会照结果执行', '有人监控并挑战错误答案'],
  ['适合', '协议参数、资金划拨等必须强制执行的决定', '社区小、预算小、要快', '想要免 Gas 投票又要自动执行']
])}

<h2>6. 金库管理：用 Safe 管钱</h2>
<p>DAO 的金库通常放在 <strong>Safe</strong> 多签里，或者直接由时间锁持有。Safe 可以启用<strong>模块（module）</strong>：启用后的模块可以不经签名人逐笔确认就让 Safe 执行交易。Safe 文档明确警告：模块可以执行任意交易，恶意模块可以接管 Safe，只能添加可信且审计过的模块。${cite('Safe 文档：Smart Account Modules', 'https://docs.safe.global/advanced/smart-account-modules')}</p>
${layers('一个 DAO 金库的权限分层（示例）', [
  { name: '时间锁（由 Governor 控制）', sub: '大额与权限变更', chips: ['协议合约 owner', '金库主体资产', '升级代理'], kind: 'key' },
  { name: '运营多签 4/7', sub: '季度预算内的日常支出', chips: ['工资与资助', '审计费用', '单笔上限'] },
  { name: '安全多签 3/5', sub: '只能暂停，不能转钱', chips: ['pause()', '取消恶意提案'], kind: 'risk' },
  { name: '自动化模块', sub: '受限的重复操作', chips: ['按月支付流', '限额', '白名单收款地址'] }
], [
  ['flow', '越往上权限越大、门槛越高、等待越久；越往下越快、但额度和范围越小。'],
  ['risk', '安全多签只给“暂停”和“取消”权限。即使它的私钥全部泄露，最坏结果是协议暂停，而不是资金被盗。'],
  ['key', '运营多签的预算由治理按季度批给，用完要重新申请；单笔上限写在模块或流程里。'],
  ['limit', '多签签名人如果在同一家公司、同一个时区，门限再高也只是一个点。签名人要分散，并定期演练。']
], ['批预算', '紧急时', '按规则执行'])}
${tbl(['金库实践', '为什么', '怎么验证'], [
  ['资产分散：留出 12–24 个月运营支出的稳定币（示例）', '金库若全是自身代币，价格下跌时预算同时缩水', '定期公布金库报表：各资产占比、可支撑月数'],
  ['签名人公开、地域分散', '防止共谋和同时失联', '在论坛公布签名人身份与门限；每季度做一次签名演练'],
  ['交易前在模拟器检查', '防止签名界面显示与实际 calldata 不符', '用 Safe 的交易模拟和独立的 calldata 解码工具核对'],
  ['任何模块上线前审计', '模块可以绕过签名人', '提案中附审计报告和模块地址；启用后在浏览器核对']
])}

<h2>7. 治理攻击：三种路径</h2>
${tbl(['路径', '做法', '防御'], [
  ['借票', '闪电贷或借贷市场临时借到投票权（Beanstalk，见 <a href="#m02-8">M02.9</a>）', '投票权按提案创建时的快照；投票延迟'],
  ['买票', '在市场上合法买入足够代币，通过对自己有利的提案', '金库价值与可买票成本挂钩评估；时间锁让其他人撤离；安全委员会取消权'],
  ['恶意提案代码', '提案看起来无害，执行的合约里藏着别的逻辑', '审查提案调用的每个合约是否开源、是否可变；模拟执行'],
])}
${cases([
  ['Tornado Cash：伪装成旧提案的恶意升级', '2023-05-20', '<p>攻击者提交了一个声称与之前已通过提案相同的提案，其中多了一个函数。提案通过后，攻击者利用这个函数给自己凭空增加了 120 万票，从而控制了治理。安全研究者的分析指出，攻击者利用 selfdestruct 和 CREATE2 在同一地址重新部署了不同的代码。</p><p>启示：投票人审查的是提案的“说明”，执行的是地址上的“代码”。提案调用的合约必须开源、不可变，并在投票前完成模拟执行。</p>', [['The Block：Attacker uses malicious proposal to take over Tornado Cash governance', 'https://www.theblock.co/post/231637'], ['Halborn：Explained: The Tornado Cash Hack (May 2023)', 'https://www.halborn.com/blog/post/explained-the-tornado-cash-hack-may-2023']]],
  ['Compound 提案 289：合法买票与金库划拨', '2024-07-28', '<p>一个被称为“Golden Boys”的群体在公开市场积累 COMP，提出把 499,000 枚 COMP（约 2,400 万美元，约占金库 5%）划给由他们设计的收益产品。提案以 682,191 票对 633,636 票通过。社区和安全研究者称之为治理攻击；之后双方达成和解，提案被撤回。</p><p>启示：买票不违反任何合约规则。防御只能靠参与率、时间锁窗口和取消机制。</p>', [['The Block：$24 million Compound proposal passed by whale over DAO objections', 'https://www.theblock.co/post/307943/24-million-compound-finance-proposal-passed-by-whale-over-dao-objections'], ['The Block：Compound reaches truce with Humpy', 'https://www.theblock.co/post/308215/compound-reaches-truce-with-crypto-whale-humpy-after-controversial-vote-to-move-24-million-in-tokens/']]]
], 'h3')}

<h2>8. 法律外壳：简要了解</h2>
<p>DAO 在法律上是什么，各地不同。两个例子：美国怀俄明州 2021 年通过 SF0038，允许 DAO 注册为一种有限责任公司（DAO LLC），2021 年 7 月 1 日生效。${cite('Wyoming Legislature：SF0038（2021）', 'https://www.wyoleg.gov/2021/Enroll/SF0038.pdf')}2023 年 6 月，美国 CFTC 在针对 Ooki DAO 的诉讼中获得缺席判决，法院认定该 DAO 是可被起诉的非法人社团，判处约 64 万美元罚款并要求关闭网站。${cite('CFTC 新闻稿 8715-23', 'https://www.cftc.gov/PressRoom/PressReleases/8715-23')}这说明“没有公司实体”不等于“没有法律责任”，参与投票的成员可能被视为社团成员。本节不是法律建议；设立实体前请咨询所在法域的律师。合规的系统讲解见 M07 合规与监管模块。</p>

${tryit(`<p><strong>动手练习（二选一）：</strong></p>
<p><strong>A. 读一个真实提案。</strong></p>
${steps([
  '打开 Tally（tally.xyz），选择 Uniswap 或 Arbitrum 的治理页面，打开任意一个已执行（Executed）的提案。',
  '记录：提案人、投票开始与结束时间、赞成 / 反对 / 弃权票数、法定人数。',
  '展开“Executable code”或“Actions”，写出每个动作调用的目标合约和函数。',
  '复制目标地址到 Etherscan，确认它是否开源，是否是代理合约。',
  '找到执行交易，确认 <code>from</code> 或内部调用里出现的是时间锁地址。'
])}
<p><strong>B. 本地跑通一次治理。</strong>用 OpenZeppelin Contracts Wizard 生成 Governor，按本篇脚本部署到 <code>anvil</code>，然后运行上面的 <code>test_ProposalLifecycle</code>。预期结果：测试通过；把 <code>renounceRole</code> 那一行删掉，用 <code>cast call $TL "hasRole(bytes32,address)(bool)" 0x00…00 $DEPLOYER</code> 能看到部署者仍有管理权，这就是需要在审计中指出的问题。</p>`)}

${exercises([
  ['一个 DAO 的时间锁把 PROPOSER_ROLE 同时给了 Governor 和一个 2/3 多签。这样做有什么风险？', '<p>多签可以不经投票直接把任意操作放进队列，延迟到期后执行，等于有一条绕过治理的通道。正确做法：只给 Governor 提议权；多签最多拿 CANCELLER_ROLE，用来取消恶意提案。</p>'],
  ['你在 Arbitrum（约 0.25 秒一块，示例）部署 Governor，想要 1 天投票延迟、5 天投票期。区块数应该设多少？有没有更好的办法？', '<p>1 天 = 86,400 ÷ 0.25 = 345,600 块；5 天 = 1,728,000 块。更好的办法是让代币使用时间戳时钟（OpenZeppelin 的 ERC-6372 clock 模式），Governor 跟随代币时钟，按秒设参数，避免受出块时间变化影响。</p>'],
  ['Snapshot 投票通过了一笔 50 万美元的资助，但 Safe 签名人拒绝执行。社区能怎么办？这说明了什么？', '<p>社区只能通过社交压力、更换签名人（这本身也需要签名人配合）或迁移资金。它说明 Snapshot + 多签的信任落在签名人身上，投票结果没有强制力。需要强制执行的决定应走链上 Governor + 时间锁。</p>'],
  ['列出你会在一个治理提案投票前做的三项技术检查。', '<p>① 解码每个动作的 calldata，核对目标地址和参数与说明一致；② 检查目标合约是否开源、是否可升级或可自毁；③ 在主网分叉上模拟执行（例如 Foundry fork 测试或 Tenderly），确认状态变化符合预期。</p>']
])}
${checklist([
  '能用 Foundry 部署 Governor + 时间锁，并说出四个时间锁角色各应给谁。',
  '能在测试里完成 propose → castVote → queue → execute，并解释 descriptionHash 的作用。',
  '能把区块数参数换算成目标链上的实际时间。',
  '能说出 Snapshot 结果上链执行的三种方式及各自的信任假设。',
  '能为一个 DAO 金库设计分层权限，并指出 Safe 模块的风险。',
  '能用 Tornado Cash 和 Compound 两个案例说明“恶意代码”和“合法买票”两种攻击。'
])}
${mistakes([
  ['Governor 合约持有金库资金。', '执行提案的是时间锁。资金、owner 和权限都应交给时间锁。'],
  ['部署完 Governor 就是去中心化了。', '部署者若没有放弃时间锁管理员角色，或时间锁有其他 proposer，治理可以被绕过。'],
  ['Snapshot 投票通过就会自动执行。', '默认只是意见表达，需要签名人执行或接入预言机模块。'],
  ['持有代币就有投票权。', 'ERC20Votes 需要先委托（可以委托给自己），否则投票权为 0。'],
  ['买票攻击是漏洞，可以修补。', '买票完全符合规则。只能靠参与率、时间锁窗口、取消权和金库风险评估来防御。']
])}
${recap([
  'Governor 负责提案和计票，TimelockController 负责排队和执行；资金和权限交给时间锁。',
  '时间锁只让 Governor 当 proposer，执行者可设为任何人，部署者必须放弃管理员角色。',
  '委托决定实际投票权；法定人数要按真实参与率评估，并估算“买票成本 vs 金库价值”。',
  'Snapshot 免 Gas 但结果不能自动动钱；上链要靠签名人或预言机模块，oSnap 已停止支持。',
  '金库分层：时间锁管大额，运营多签管预算，安全多签只能暂停；Safe 模块可绕过签名人，必须审计。'
])}
${quiz([
  { q: 'OpenZeppelin 治理里，最终调用目标合约的地址是谁？', o: ['提案人', 'Governor', 'TimelockController', '投票最多的地址'], a: 2, why: 'Governor 在 execute 时让时间锁执行批量操作，目标合约看到的 msg.sender 是时间锁。所以权限要交给时间锁。' },
  { q: '为什么 execute 时要传 descriptionHash？', o: ['为了省 Gas', '提案 ID 由参数和描述哈希计算，链上不存原参数', '为了加密提案内容', 'Snapshot 需要它'], a: 1, why: 'Governor 只保存提案 ID。queue 和 execute 要原样传回参数和描述哈希，重新算出同一个 ID。' },
  { q: '部署时间锁后，下面哪一步最关键、最常被遗漏？', o: ['给 Governor 授予 EXECUTOR_ROLE', '部署者放弃 DEFAULT_ADMIN_ROLE', '把 minDelay 设为 0', '把代币转给 Governor'], a: 1, why: '部署者保留管理员角色，就能随时给自己授予 proposer 角色，绕过治理。' },
  { q: 'Snapshot + Reality 模块的执行依赖什么？', o: ['Snapshot 服务器直接调用 Safe', 'Reality.eth 上关于投票结果的问题被回答为“是”，且冷却期结束', '所有代币持有人签名', '以太坊基金会批准'], a: 1, why: 'Reality 模块把投票结果变成预言机问题，答案为“是”且过了冷却期，才允许执行。' },
  { q: 'Compound 提案 289 属于哪种治理攻击？', o: ['闪电贷借票', '提案里藏恶意代码', '合法买票并通过对自己有利的金库划拨', '私钥泄露'], a: 2, why: '提案方在公开市场积累 COMP，按规则投票通过。没有违反合约规则，所以防御只能来自参与率、时间锁和取消机制。' }
])}
${terms([
  ['去中心化自治组织', 'DAO', '用链上合约和代币投票做决策、管理资金的组织。'],
  ['时间锁控制器', 'TimelockController', '提案通过后排队等待、到期执行的合约，是治理的实际执行者。'],
  ['委托', 'Delegation', '把代币的投票权交给某个地址，代币本身不转移。'],
  ['委托人', 'Delegate', '接收他人委托、代为投票的地址或个人。'],
  ['法定人数', 'Quorum', '提案有效所需的最低票数。'],
  ['描述哈希', 'descriptionHash', '提案说明文字的 keccak256 哈希，与参数一起确定提案 ID。'],
  ['链下投票', 'Snapshot', '用钱包签名在链下投票、不花 Gas 的平台。'],
  ['Safe 模块', 'Safe module', '启用后可不经签名人逐笔确认就让 Safe 执行交易的合约。'],
  ['安全委员会', 'Security council', '只负责紧急暂停或取消恶意提案的小型多签。']
])}
` });

CUR = 'm02-62';
addCh({ id: 'm02-62', nav: '审计方法与工具链', title: 'M02.10 审计方法与安全工具链：从威胁建模到应急响应', desc: '一次审计怎么做、每种工具抓什么问题、上线后怎样监控和处置事故', html: `
<h1>M02.10 审计方法与安全工具链：从威胁建模到应急响应</h1>
${meta(['按步骤完成一次审计：定范围、写威胁模型、人工审阅、按影响 × 可能性定级、写报告、复审修复。', '为同一个合约分别写出 Foundry 不变量测试、Echidna / Medusa 属性、Halmos 符号测试和 Certora 规则，并说出它们各自能证明什么。', '为上线后的协议设计监控规则和应急预案，包括暂停、作战室、白帽救援与披露。'], '前置：<a href="#m02-8">M02.9 合约安全 II</a>、<a href="#m02-4">M02.4 开发工具链</a>')}
${beginner(`<p><strong>审计（Audit）</strong>：安全研究员在固定时间内审阅一份固定版本的代码，找出漏洞并写成报告。它不是保险，也不是“证明没有漏洞”。</p>
<p><strong>威胁模型（Threat model）</strong>：一张表，写清系统要保护什么资产、谁可能攻击、攻击者能做什么、系统信任谁。</p>
<p><strong>不变量（Invariant）</strong>：无论用户按什么顺序调用什么函数，都必须一直成立的性质。例如“合约余额 ≥ 所有用户存款之和”。</p>
<p><strong>符号执行（Symbolic execution）</strong>：不用具体数字，而是把输入当成未知数，一次推理所有可能的输入。</p>
<p><strong>形式化验证（Formal verification）</strong>：用数学方法证明代码在所有情况下满足某条规则，或者给出反例。</p>
<p><strong>漏洞赏金（Bug bounty）</strong>：协议公开承诺，谁报告漏洞就按严重程度付钱。</p>`)}

<h2>1. 一句话理解</h2>
${one('漏洞分类告诉你“找什么”，审计方法告诉你“怎么系统地找”，工具链帮你“用机器找得更多”，监控和应急决定“漏掉的那一个造成多大损失”。安全不是上线前的一次检查，而是贯穿设计到运营的流程。')}
${call('analogy', `<p>像飞机的安全体系：设计时做故障分析（威胁模型），出厂前做各种测试（模糊、形式化验证），第三方适航审查（审计），投入运营后有黑匣子和塔台（监控），出事有应急程序（应急响应）。</p>
<p>比喻的局限：飞机出事后可以停飞整个机型；合约一旦部署，攻击者和用户同时都能调用，而且很多合约不能停、不能改。所以“上线前”和“能暂停”都格外重要。</p>`)}
${art('一图看懂：审计从威胁模型开始，把“必须永远成立的事”写下来', 660, 380, [
  S.zone(10, 24, 180, 216, { t: '角色' }),
  S.zone(470, 24, 180, 216, { t: '外部依赖', k: 'idle' }),
  S.box(20, 52, 160, 50, { k: 'info', icon: 'person', t: '普通用户', s: '存入 / 提取 USDC' }),
  S.box(20, 112, 160, 50, { k: 'warn', icon: 'key', t: '管理员（多签）', s: '可改费率，上限 5%' }),
  S.box(20, 172, 160, 50, { k: 'ok', icon: 'shield', t: '守护者', s: '只能暂停' }),
  S.box(480, 52, 160, 50, { k: 'idle', dash: 1, icon: 'coin', t: 'USDC', s: '可冻结地址' }),
  S.box(480, 112, 160, 50, { k: 'idle', dash: 1, icon: 'eye', t: 'Chainlink 预言机', s: '1 小时内更新' }),
  S.box(480, 172, 160, 50, { k: 'idle', dash: 1, icon: 'chart', t: 'Uniswap 池', s: '只报价，不结算' }),
  S.box(250, 98, 160, 92, { k: 'key', icon: 'db', t: 'Vault 金库', s: '用户的 USDC\n份额代币\n协议手续费' }),
  S.arrow(182, 77, 248, 125, { k: 'plain' }),
  S.arrow(182, 137, 248, 144, { k: 'plain' }),
  S.arrow(182, 197, 248, 165, { k: 'plain' }),
  S.arrow(478, 77, 412, 125, { k: 'plain', dash: 1 }),
  S.arrow(478, 137, 412, 144, { k: 'plain', dash: 1 }),
  S.arrow(478, 197, 412, 165, { k: 'plain', dash: 1 }),
  S.box(10, 256, 640, 62, { k: 'ok', icon: 'check', t: '不变量：无论怎么操作都必须成立', s: 'I1 金库余额 ≥ 可赎回总额　I2 份额总量 ＝ 用户份额之和\nI3 费率 ≤ 5%　I4 暂停后存入与提取都失败' }),
  S.box(10, 328, 640, 42, { k: 'risk', icon: 'warn', t: '攻击面', s: '首个存款人捐赠操纵汇率 · 预言机过期 · 管理员私钥被盗后把费率设为上限' })
], [
  ['flow', '先列资产、角色和依赖，再写出不变量；审阅就是逐条找有没有路径能打破它。'],
  ['key', '不变量清单是主线：人工审阅逐条检查，工具链把它写成可执行的测试和规则。'],
  ['risk', '没有威胁模型的审计，容易只找到模式化漏洞，漏掉业务逻辑问题。'],
  ['limit', '这是一个示例金库的威胁模型；每个项目的角色、依赖和不变量都不同。']
], '中间是存款金库，左侧是三个角色：普通用户、多签管理员、只能暂停的守护者，右侧是三个外部依赖：USDC、预言机和 Uniswap 池；下方绿框列出四条必须永远成立的不变量，红框列出三种攻击面。', 'm02-62')}

<p>审计报告只是项目尽调的一环，完整的研究框架见 <a href="#m02-65">M08.8 项目研究与尽调</a>。</p>
<h2>2. 安全生命周期</h2>
${recall('<p>重入、访问控制、精度、外部调用、DoS 见 <a href="#m02-7">M02.8 合约安全 I</a>；预言机、闪电贷、签名、升级、治理攻击以及审计流程的概览图、事件响应状态机见 <a href="#m02-8">M02.9 合约安全 II</a>；Foundry 的模糊、不变量测试和 Slither 的基本用法见 <a href="#m02-4">M02.4 开发工具链</a>。本篇只讲方法和工具的深入用法。想系统学习漏洞原理与攻防实战，可读姊妹手册 <a href="https://claude.ai/artifact/AuMf2iv5HSYVzvQiBEE6pA" target="_blank" rel="noopener noreferrer">《Web3 安全手册》</a>。</p>')}
${layers('从设计到运营的安全层', [
  { name: '设计', sub: '上线前最便宜的修复点', chips: ['威胁模型', '不变量清单', '权限图'], kind: 'key' },
  { name: '开发', sub: '团队自己负责', chips: ['单元测试', '模糊 / 不变量测试', 'Slither 进 CI'] },
  { name: '外部审查', sub: '冻结一个 commit', chips: ['私有审计', '审计竞赛', '形式化验证'] },
  { name: '上线', sub: '限额逐步放开', chips: ['存款上限', '暂停开关', '漏洞赏金'] },
  { name: '运营', sub: '漏掉的问题在这里暴露', chips: ['实时监控', '应急预案', '复盘与披露'], kind: 'risk' }
], [
  ['flow', '每一层都假设上一层会漏掉问题。审计不是第一道防线，而是第三道。'],
  ['key', '同一个漏洞，在设计阶段修复只是改一行文档；上线后修复可能要暂停协议、迁移资金。'],
  ['limit', '没有任何一层能单独保证安全。审计过的协议仍然被攻击，原因常常是审计范围之外的代码、配置或升级。'],
  ['risk', '最常见的缺口在运营层：没有监控、没有暂停权限，或者暂停权限只在一个人手里。']
], ['冻结代码', '审计通过', '部署', '持续'])}

<h2>3. 一次审计怎么做</h2>
${steps2('审计项目的六个阶段', [
  { t: '① 定范围（Scoping）', d: '确定 commit 哈希、文件列表、代码行数（nSLOC）、外部依赖、部署链；确定时间和人数' },
  { t: '② 威胁模型', d: '列出资产、角色、信任假设、外部依赖、必须成立的不变量', kind: 'key' },
  { t: '③ 自动化扫描', d: 'Slither 打印器建立全局视图；检测器告警逐条确认或排除' },
  { t: '④ 人工审阅', d: '按入口函数逐个推演：谁能调用、改了什么状态、调用了谁、能否被重入或操纵', kind: 'risk' },
  { t: '⑤ 定级与报告', d: '每个问题写影响、可能性、复现步骤（最好是 Foundry PoC）、修复建议' },
  { t: '⑥ 修复复审', d: '只审修复提交的差异，确认没有引入新问题；报告注明最终审阅的 commit' }
], [
  ['flow', '范围定义的输出是一个固定 commit。之后任何改动都不在本次审计范围内。'],
  ['key', '威胁模型决定审阅的重点。没有威胁模型的审计，容易只找到“模式化”漏洞，漏掉业务逻辑问题。'],
  ['fail', '最常见的失败：审计后又改了代码直接上线，或者部署脚本、初始化参数不在审计范围。'],
  ['risk', '人工审阅是找到严重漏洞的主要来源，工具只能辅助。']
])}
<h3>3.1 威胁模型模板</h3>
<p>以一个“存款金库 + 管理员可调费率”的合约为例：</p>
${tbl(['项目', '内容（示例）'], [
  ['资产', '用户存入的 USDC；份额代币；协议累计的手续费'],
  ['角色', '普通用户；管理员（多签，可改费率，上限 5%）；守护者（只能暂停）；任何外部合约'],
  ['信任假设', '管理员不作恶但可能私钥泄露；USDC 合约行为正确；价格预言机在 1 小时内更新'],
  ['外部依赖', 'USDC（可能被冻结地址）、Chainlink 预言机、Uniswap 池（只用于报价，不用于结算）'],
  ['不变量', 'I1 金库 USDC 余额 ≥ 所有份额按当前汇率可赎回的总额；I2 份额总量 = 所有用户份额之和；I3 费率 ≤ 5%；I4 暂停后存入与提取都失败'],
  ['攻击面', '首个存款人通过捐赠操纵汇率；预言机过期；管理员私钥被盗后把费率设为上限']
])}
<p>不变量清单是整个流程的“主线”：人工审阅逐条检查有没有路径能打破它，工具链则把它写成可执行的测试和规则（第 4 节）。</p>
<h3>3.2 定级：影响 × 可能性</h3>
${tbl(['影响 ＼ 可能性', '高（任何人随时可触发）', '中（需要特定条件）', '低（需要特权或极端条件）'], [
  ['高（资金被盗或永久冻结）', '<b>Critical</b>', 'High', 'Medium'],
  ['中（部分资金损失、临时冻结）', 'High', 'Medium', 'Low'],
  ['低（功能异常、无资金损失）', 'Medium', 'Low', 'Low / Info']
])}
<p>这张矩阵是行业惯例，各家措辞不同。${tag('惯例')}漏洞赏金平台 Immunefi 的 v2.3 分级按影响定级：直接盗取用户资金、永久冻结资金、篡改治理投票结果、协议资不抵债属于 Critical；盗取未领取收益、临时冻结资金属于 High。${cite('Immunefi Vulnerability Severity Classification System v2.3', 'https://immunefi.com/immunefi-vulnerability-severity-classification-system-v2-3/')}</p>
<p><strong>算一算（示例）：</strong>估算一次私有审计的工作量。代码 1,800 nSLOC，复杂度中等，计划 2 名审计员。</p>
${steps([
  '假设每名审计员每天能深入审阅约 200–300 nSLOC（示例经验值，复杂代码会更低）' + tag('惯例') + '。',
  '单人需要 1,800 ÷ 250 ≈ 7.2 人天；审计强调两人独立覆盖同一代码，总量 ≈ 7.2 × 2 ≈ 14.4 人天。',
  '加上威胁建模、写 PoC、写报告约 20%：14.4 × 1.2 ≈ 17.3 人天。',
  '2 人并行 ≈ 8.6 个工作日，即约 2 周。修复复审另计 1–3 天。',
  '结论：在合约冻结前至少 3–4 周预约审计，并把修复复审时间排进上线计划。'
])}

<h2>4. 工具链：每种工具抓什么</h2>
${compare('四类自动化方法', [
  { name: '静态分析', tag: 'Slither', kind: 'info', points: ['不运行代码，分析语法树和数据流', '秒级出结果，适合进 CI', '擅长模式化问题', '误报多，要人工过滤'] },
  { name: '模糊 / 不变量测试', tag: 'Foundry、Echidna、Medusa', kind: 'key', points: ['随机生成输入和调用序列', '找到反例时给出最小复现', '覆盖“意想不到的调用顺序”', '跑得再久也只是抽样'] },
  { name: '符号测试', tag: 'Halmos', kind: 'info', points: ['把参数当未知数，覆盖所有取值', '复用 Foundry 风格的测试', '循环和调用深度受限', '路径爆炸时会超时'] },
  { name: '形式化验证', tag: 'Certora', kind: 'warn', points: ['用规范语言写规则，证明或给反例', '能对关键性质给出“全部情况”的结论', '写规则需要专门训练', '证明的只是你写下的规则'] }
], [
  ['flow', '从左到右，覆盖面越来越完整，成本也越来越高。常见组合：Slither 进 CI，不变量测试作为日常，核心模块用符号测试或形式化验证。'],
  ['limit', '所有工具都只检查你告诉它的性质。威胁模型漏掉的不变量，工具也不会去检查。'],
  ['key', '同一组不变量，最好在多种工具里各写一遍：模糊测试找反例快，形式化验证给出完整结论。'],
  ['risk', '“工具没有告警”不等于“没有漏洞”。经济攻击和跨协议组合问题通常需要人工分析。']
])}
<p>审计 ZK 电路要另查“欠约束”（约束少写、证明者可伪造见证）这类漏洞，见 <a href="#m10-3">M06.3 第一个电路 Circom</a>。</p>
<h3>4.1 Slither：先建立全局视图</h3>
<p>Slither 是 Trail of Bits 开源的静态分析框架，内置约 100 个检测器，还有一组“打印器”帮助审计员快速理解代码结构。${cite('crytic/slither（GitHub）', 'https://github.com/crytic/slither')}</p>
${code('BASH', `
slither . --print human-summary      # 合约数量、复杂度、各严重级别告警数
slither . --print vars-and-auth      # 每个函数写哪些状态变量、有哪些权限检查（审访问控制最有用）
slither . --print function-summary   # 函数可见性、修饰器、读写变量、外部调用
slither . --print entry-points       # 所有可从外部调用的状态修改函数 = 攻击面清单
slither . --triage-mode              # 逐条标记误报，结果写入 slither.db.json，下次不再出现
slither-check-upgradeability . MyVaultV1 --new-contract-name MyVaultV2   # 升级前检查存储布局
`)}
<h3>4.2 不变量测试：把威胁模型变成代码</h3>
<p>以 3.1 节的 I1、I3 为例，在 Foundry 的 Handler 模式里写成不变量（Handler 的基本结构见 <a href="#m02-4">M02.4</a>）：</p>
${code('SOLIDITY', `
// test/invariant/VaultInvariant.t.sol
contract VaultInvariantTest is Test {
    Vault vault; MockUSDC usdc; Handler handler;

    function setUp() public {
        usdc = new MockUSDC();
        vault = new Vault(usdc, admin);
        handler = new Handler(vault, usdc);      // Handler 里用 bound() 约束参数，并记录幽灵变量
        targetContract(address(handler));
    }

    // I1：金库持有的 USDC 足以按当前汇率赎回全部份额
    function invariant_solvent() public view {
        assertGe(usdc.balanceOf(address(vault)), vault.convertToAssets(vault.totalSupply()));
    }

    // I3：任何调用序列后，费率都不超过上限
    function invariant_feeCapped() public view {
        assertLe(vault.feeBps(), 500);
    }
}
// foundry.toml 中可调：[invariant] runs = 256, depth = 100, fail_on_revert = false
`)}
<h3>4.3 Echidna 与 Medusa：另一种随机引擎</h3>
<p>Echidna 和 Medusa 都来自 Trail of Bits。Echidna 用 <code>echidna_</code> 前缀、无参数、返回 bool 的函数表示属性；Medusa 基于 go-ethereum，受 Echidna 启发，默认识别 <code>fuzz_</code> 前缀，Trail of Bits 表示今后主要精力放在 Medusa。${cite('Trail of Bits：Unleashing Medusa: Fast and scalable smart contract fuzzing（2025-02）', 'https://blog.trailofbits.com/2025/02/14/unleashing-medusa-fast-and-scalable-smart-contract-fuzzing/')}换一个随机引擎跑同一组不变量，常常能找到 Foundry 没碰到的调用顺序。</p>
${code('SOLIDITY', `
// test/echidna/VaultEchidna.sol —— 运行：echidna test/echidna/VaultEchidna.sol --contract VaultEchidna
contract VaultEchidna {
    MockUSDC usdc = new MockUSDC();
    Vault vault = new Vault(usdc, address(this));

    constructor() { usdc.mint(address(this), 1e30); usdc.approve(address(vault), type(uint256).max); }

    // 引擎会随机调用下面这些公开函数，参数随机
    function deposit(uint256 a) public { vault.deposit(a % 1e24, address(this)); }
    function withdraw(uint256 a) public { vault.withdraw(a % 1e24, address(this), address(this)); }
    function donate(uint256 a) public { usdc.transfer(address(vault), a % 1e24); } // 模拟捐赠攻击

    // 属性：无参数、返回 bool、以 echidna_ 开头
    function echidna_solvent() public view returns (bool) {
        return usdc.balanceOf(address(vault)) >= vault.convertToAssets(vault.totalSupply());
    }
}
`)}
<h3>4.4 Halmos 与 Certora：覆盖所有输入</h3>
<p>Halmos 是 a16z 开源的符号测试工具，复用 Foundry 风格的测试合约，默认运行 <code>check_</code> 前缀的函数，参数被当成覆盖全部取值的符号变量。${cite('a16z crypto：Halmos v0.1.0 release highlights', 'https://a16zcrypto.com/posts/article/release-notes-halmos-v0-1-0')}Certora Prover 用 CVL 规范语言写规则和不变量，对每条规则给出“通过”或反例。${cite('Certora 文档：Rules', 'https://docs.certora.com/en/latest/docs/cvl/rules.html')}</p>
${code('SOLIDITY', `
// Halmos：pip install halmos，然后在项目根目录运行 halmos --function check_fee
function check_feeNeverExceedsCap(uint256 newFee) public {
    vm.prank(admin);
    try vault.setFeeBps(newFee) {} catch {}
    assert(vault.feeBps() <= 500);   // 对 newFee 的全部 2^256 种取值成立，否则给出反例
}
`)}
${code('CVL', `
// Certora CVL 规则（specs/Vault.spec），运行：certoraRun src/Vault.sol --verify Vault:specs/Vault.spec
methods {
    function totalSupply() external returns (uint256) envfree;
    function balanceOf(address) external returns (uint256) envfree;
}

// 规则：任何人的 transfer 都不改变份额总量
rule transferKeepsTotalSupply(address to, uint256 amount) {
    env e;
    uint256 before = totalSupply();
    transfer(e, to, amount);
    assert totalSupply() == before, "transfer must not change totalSupply";
}
`)}
${call('info', '<p>“形式化验证通过”的意思是：<strong>你写下的规则</strong>在模型假设下对所有输入成立。规则写错、写少，或者模型假设（例如外部合约的行为）与真实不符，证明就没有覆盖真实风险。读审计报告时要看它验证了哪些规则。</p>')}

<h2>5. 审计竞赛与漏洞赏金</h2>
${tbl(['形式', '怎么运作', '优点', '局限'], [
  ['私有审计', '协议付费请一家公司，固定团队、固定时间', '深度、可沟通、能做设计评审', '覆盖面取决于少数几个人'],
  ['审计竞赛', '协议出奖金池，大量独立研究员在固定时间内竞赛找漏洞，评审确定有效性和严重程度。Code4rena 的流程是提交期 → 评审期 → 48 小时评审后问答，之后可邀请优胜者做修复复审。' + cite('Code4rena 文档', 'https://docs.code4rena.com/'), '视角多、覆盖广', '提交质量参差，重复报告多；需要协议团队投入大量时间回应'],
  ['带首席的竞赛', 'Sherlock 会为比赛指派一名“首席高级研究员”做完整审阅，并在修复不超过一天工作量时负责修复复审。' + cite('Sherlock 文档：Lead Senior Watson selection process', 'https://docs.sherlock.xyz/audits/watsons/lead-senior-watson-selection-process'), '兼顾深度和广度', '成本高于单纯竞赛'],
  ['漏洞赏金', '上线后长期开放，按严重程度付钱；Immunefi 是最常见的平台', '覆盖运营期，攻击者也可能选择报告', '只有赏金足够有吸引力才有效']
])}
<p>Cantina 等平台同时提供私有审计、竞赛和赏金。选择的经验：核心新代码先做私有审计，再做竞赛扩大覆盖；上线后保持赏金，赏金上限与协议锁仓量挂钩。${tag('惯例')}</p>

<h2>6. 上线后的监控</h2>
<p>监控回答一个问题：<strong>攻击发生的第一分钟，团队能不能知道</strong>。两个变化要注意：OpenZeppelin 在 2025 年 6 月 30 日停止 Defender 新用户注册，平台于 2026 年 7 月 1 日关闭，改为开源、可自托管的 Monitor 和 Relayer。${cite('OpenZeppelin：Doubling Down on Open Source and Phasing Out Defender', 'https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender')}Forta 网络由“检测机器人”和“扫描节点”组成，任何人都可以编写机器人监控链上活动。${cite('Forta 文档：Getting started', 'https://docs.forta.network/en/latest/getting-started/')}</p>
${tbl(['监控规则（示例）', '阈值（示例）', '触发后动作'], [
  ['单笔或 10 分钟内金库净流出', '> TVL 的 5%', '高优先级告警，值班人 5 分钟内确认'],
  ['特权函数被调用', 'setFee、upgradeTo、grantRole 任意一次', '告警到安全频道；核对是否有对应的治理提案'],
  ['预言机价格偏离', '与第二来源偏差 > 3%，或超过心跳时间未更新', '告警；必要时暂停借款'],
  ['不变量链上检查', '定时读 totalAssets 与 totalSupply，偿付比 < 1', '立即升级为事故'],
  ['异常合约交互', '新部署的合约在同一区块内调用闪电贷 + 本协议', '告警并人工研判（可能是攻击准备）']
])}

<h2>7. 应急响应预案</h2>
${recall('<p>“告警 → 暂停 → 调查 → 时间锁修复 → 恢复 → 复盘”的状态机，以及“暂停权限只能停不能转钱”的原则，见 <a href="#m02-8">M02.9 合约安全 II</a> 第 6.3 节。本节给出可以直接放进团队文档的执行清单。</p>')}
${mm('事故发生后的第一小时', `
flowchart TB
  A["告警触发"] --> B{"5 分钟内确认<br/>是否真实攻击"}
  B -->|"误报"| Z["记录并调优规则"]
  B -->|"真实"| C["拉起作战室<br/>指定指挥人与记录人"]
  C --> D["守护者多签调用 pause<br/>覆盖所有入口"]
  C --> E["联系 SEAL 911<br/>与交易所 稳定币发行方"]
  D --> F{"剩余资金<br/>仍有风险吗"}
  F -->|"是"| G["白帽救援<br/>按 Safe Harbor 转入指定地址"]
  F -->|"否"| H["定位根因<br/>准备修复"]
  G --> H
  H --> I["对外公告<br/>只说已确认的事实"]
`, [
  ['flow', '暂停和联络并行进行。暂停越快，损失越小；联络越早，交易所和稳定币发行方越有机会冻结赃款。'],
  ['key', 'SEAL 911 是安全联盟（SEAL）运营的免费 Telegram 紧急求助通道，由白帽志愿者响应正在发生的安全事件。' + cite('Security Alliance：SEAL 911', 'https://securityalliance.org/seal-911')],
  ['risk', '白帽救援要事先授权。SEAL 的 Safe Harbor 框架让协议预先声明：白帽可以抢先转移有风险的资金，72 小时内归还到指定地址，默认奖励为救回资产的 10%、上限 100 万美元，具体条款由各协议设定。' + cite('Security Alliance：Safe Harbor', 'https://securityalliance.org/safe-harbor')],
  ['fail', '常见失误：暂停只覆盖存款没覆盖提取；作战室在公开频道讨论，攻击者实时看到；公告里猜测原因，之后又改口。']
])}
<p>追踪被盗资金流向的方法见 <a href="#m05-67">M04.13 链上取证</a>，在一个完整项目里写出上线清单和应急手册见 <a href="#m12-4">M14.4 上线与应急</a>。</p>
${tbl(['预案条目', '事前准备', '验收方式'], [
  ['暂停权限', '守护者多签 + 覆盖所有入口的 pause；签名人分布在不同时区', '每季度在测试网演练一次，记录从告警到暂停的分钟数'],
  ['联络清单', '安全团队、审计方、主要交易所、稳定币发行方、SEAL 911 的联系方式', '每季度核对一次是否过期'],
  ['作战室', '预先建好私密频道，规定指挥人、记录人、对外发言人', '演练时检查角色是否明确'],
  ['白帽与赏金', '采用 Safe Harbor 并公布救援地址；赏金页面写清范围', '在协议文档能找到这两项'],
  ['披露', '复盘模板：时间线、根因、损失、修复、补偿方案', '事故后 7 天内发布初步复盘（示例目标）']
])}
${cases([
  ['Euler Finance：被盗后通过谈判追回', '2023-03-13', '<p>Euler 被闪电贷攻击，损失约 1.97 亿美元。协议公开提出 10% 的赏金并悬赏线索；攻击者从 3 月 18 日起分批归还，到 4 月 4 日 Euler 宣布所有可追回的资金已全部归还。</p><p>启示：应急响应不止“暂停”，还包括与攻击者沟通、与链上分析机构和执法合作。可追回性取决于资金是否已经混币。</p>', [['The Block：Euler hacker returns $31 million, marking end to recoverable funds', 'https://www.theblock.co/post/224705/euler-hacker-returns-funds'], ['The Block：Euler exploiter returns $5.4 million in ETH', 'https://www.theblock.co/post/220983/euler-exploiter-returns-5-4-million-in-eth-to-defi-protocol']]]
], 'h3')}

${tryit(`<p><strong>动手练习：</strong>对同一个小金库跑三种工具。</p>
${steps([
  '在 Foundry 项目里写一个简单的 ERC-4626 风格金库（或用 <a href="#m02-3">M02.3</a> 的 ETH 金库），先为它写 3 条不变量（偿付、份额守恒、费率上限）。',
  '运行 <code>slither . --print vars-and-auth</code>，核对每个修改费率或权限的函数都有权限检查。',
  '运行 <code>forge test --match-contract Invariant</code>，把 <code>depth</code> 从 15 调到 100，观察运行时间和是否出现反例。',
  '<code>pip install halmos</code>，为费率上限写一个 <code>check_</code> 函数并运行 <code>halmos --function check_</code>。',
  '故意删掉 <code>setFeeBps</code> 里的上限检查，再跑一遍三种工具，记录哪个工具最先报告问题。'
])}
<p>预期结果：Slither 的 vars-and-auth 显示函数写了 feeBps；不变量测试和 Halmos 都给出反例，Halmos 的反例通常是一个大于 500 的具体数值。</p>`)}

${exercises([
  ['为一个借贷池写出 4 条不变量，并说出每条适合用哪种工具检查。', '<p>例：① 总借款 ≤ 总存款（不变量测试）；② 任何用户的健康因子 < 1 时可被清算（不变量测试 + 人工）；③ 利率模型输出单调不减（Halmos 对利用率参数做符号测试）；④ 存款再取出不会多于存入加利息（Certora 规则或不变量测试）。</p>'],
  ['审计报告里一个问题被评为 Medium：“管理员可以把费率设为 100%”。你作为项目方，会怎么回应和修复？', '<p>先确认影响：费率 100% 意味着用户收益全部归管理员，属于有条件的价值损失。修复：在 setFee 里加硬上限（例如 5%）；修改费率走时间锁；把管理员换成多签。然后请审计方复审修复提交。</p>'],
  ['监控显示 10 分钟内金库流出 8% 的 TVL，但交易看起来是正常提取。你的处理步骤是什么？', '<p>按预案：5 分钟内确认是否攻击（看提取地址是否集中、是否新合约、是否伴随闪电贷或价格异常）；不确定时先暂停，因为暂停的成本远小于继续被盗；拉作战室；确认是正常挤兑后恢复，并公告原因。</p>'],
  ['为什么“审计过”的协议仍然会被攻击？列出三个原因。', '<p>① 审计后改过代码或升级了实现，新代码不在范围内；② 漏洞在审计范围之外（部署脚本、初始化参数、外部依赖、前端）；③ 经济或组合攻击超出了威胁模型的假设。</p>']
])}
${checklist([
  '能为一个合约写出威胁模型表：资产、角色、信任假设、外部依赖、不变量。',
  '能按影响 × 可能性给一个问题定级，并写出带 Foundry PoC 的报告条目。',
  '能用 Slither 打印器列出攻击面和每个函数的权限检查。',
  '能把同一条不变量分别写成 Foundry 不变量、Echidna 属性和 Halmos check 函数。',
  '能为上线协议写出 5 条监控规则和第一小时的应急步骤。'
])}
${mistakes([
  ['审计过就安全了。', '审计只覆盖一个 commit、一段时间和审计员想到的场景。它降低风险，不消除风险。'],
  ['Slither 没有告警就没有漏洞。', '静态分析只找模式化问题，业务逻辑和经济攻击要靠不变量和人工。'],
  ['模糊测试跑了一晚上没出错，就证明了性质。', '模糊测试是抽样。要“所有输入”的结论，用符号测试或形式化验证。'],
  ['形式化验证通过就绝对安全。', '它只证明你写下的规则；规则少写或模型假设不对，证明就没有覆盖真实风险。'],
  ['出事后先查清原因再暂停。', '先暂停再调查。暂停的成本远小于继续被盗。']
])}
${recap([
  '安全是生命周期：设计（威胁模型）→ 开发（测试）→ 外部审查 → 限额上线 → 监控与应急。',
  '审计六步：定范围、威胁模型、自动化扫描、人工审阅、定级报告、修复复审；输入永远是一个固定 commit。',
  '工具各有分工：Slither 建立视图并抓模式化问题；Foundry / Echidna / Medusa 随机找反例；Halmos 和 Certora 覆盖全部输入。',
  '审计竞赛扩大覆盖，漏洞赏金覆盖运营期；Immunefi 按影响定级。',
  '监控决定发现速度，预案决定处置速度：先暂停、拉作战室、联络 SEAL 911，按 Safe Harbor 救援，按事实披露。'
])}
${quiz([
  { q: '审计范围定义阶段最重要的输出是什么？', o: ['审计报价', '一个固定的 commit 哈希和文件清单', '漏洞赏金金额', '上线日期'], a: 1, why: '审计结论只对那个 commit 有效。之后的任何改动都需要复审。' },
  { q: '下面哪种工具能对一个函数参数的全部取值给出结论？', o: ['Slither 检测器', 'Foundry 模糊测试', 'Halmos 符号测试', '人工抽查'], a: 2, why: 'Halmos 把参数当符号变量，覆盖全部取值；模糊测试只是随机抽样。' },
  { q: 'Echidna 的属性函数需要满足什么条件？', o: ['以 test_ 开头且有参数', '以 echidna_ 开头、无参数、返回 bool', '以 check_ 开头', '必须是 external payable'], a: 1, why: 'Echidna 调用无参数、返回 bool、以 echidna_ 开头的函数检查属性；check_ 是 Halmos 的约定。' },
  { q: '按 Immunefi v2.3，下面哪项属于 Critical？', o: ['临时冻结资金', '盗取未领取的收益', '直接盗取用户资金', 'Gas 优化建议'], a: 2, why: '直接盗取用户资金、永久冻结资金、篡改治理结果等属于 Critical；临时冻结和盗取未领取收益属于 High。' },
  { q: '监控发现疑似攻击、但还不能确认时，预案的第一步通常是？', o: ['等待更多数据再决定', '发布公告说明原因', '由守护者多签暂停协议并拉起作战室', '联系攻击者谈判'], a: 2, why: '暂停只影响可用性，继续被盗影响资金。先暂停，再调查。' }
])}
${terms([
  ['威胁模型', 'Threat model', '列出资产、角色、信任假设、外部依赖和不变量的分析文档。'],
  ['代码行数（不含注释空行）', 'nSLOC', '审计范围和报价常用的代码规模指标。'],
  ['概念验证', 'PoC (Proof of Concept)', '能复现漏洞的最小测试或脚本。'],
  ['符号测试', 'Symbolic testing', '把输入当作符号变量、一次覆盖所有取值的测试方法。'],
  ['形式化验证', 'Formal verification', '用数学方法证明代码满足规则或给出反例。'],
  ['审计竞赛', 'Audit contest', '由奖金池吸引大量独立研究员在固定时间内竞赛找漏洞。'],
  ['漏洞赏金', 'Bug bounty', '按严重程度向漏洞报告者付费的长期计划。'],
  ['作战室', 'War room', '事故期间由指挥人、记录人、技术与对外人员组成的私密协作频道。'],
  ['白帽安全港', 'Safe Harbor', '协议预先授权白帽在攻击中抢救资金并约定归还与奖励的框架。']
])}
` });
})();
