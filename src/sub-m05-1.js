/* ---------- M04 子文章（一）---------- */
(() => {
CUR = 'm05-1';
addCh({ id: 'm05-1', nav: '公链全景', title: 'M04.1 公链全景：不可能三角与八条主流公链', desc: '比特币、以太坊、Solana、Cosmos 等八条链怎么设计，业务该选哪条', html: `
<h1>M04.1 公链全景：不可能三角与八条主流公链</h1>
${meta(['用“不可能三角”解释不同公链为什么做出不同取舍。', '说出比特币、以太坊、Solana、Cosmos、Polkadot、Aptos/Sui、TON、BNB Chain 的核心设计差异。', '按业务需求（安全、成本、生态、开发语言）为项目选链，并写出选型理由。'], '<a href="#m05">M04 总览</a>、<a href="#m01">M01 区块链基础</a>')}
${beginner(`<p><strong>公链（Public Blockchain）</strong>：任何人都可以读数据、发交易、运行节点的区块链。和它相对的是只有许可成员能参与的“联盟链”。</p>
<p><strong>共识（Consensus）</strong>：成千上万个互不信任的节点，对“下一个区块是什么”达成一致的规则。</p>
<p><strong>出块时间（Block Time）</strong>：两个区块之间的平均间隔。越短，用户越快看到交易被打包。</p>
<p><strong>最终性（Finality）</strong>：区块不能再被回滚的保证。被打包不等于最终确定。</p>
<p><strong>执行模型（Execution Model）</strong>：链怎样运行交易、怎样保存状态。例如账户模型、UTXO 模型、对象模型。</p>
<p><strong>生态（Ecosystem）</strong>：一条链上的钱包、DApp、开发工具、资金和开发者的总和。</p>`)}

<h2>1. 一句话理解</h2>
${one('每条公链都在“去中心化、安全、性能”三者之间做取舍。没有最好的链，只有最适合你业务的链。')}
${call('analogy', `<p>公链像不同的城市。比特币是一座只做金库的古城：城墙最厚，但路很窄。以太坊是一座首都：法院（L1）权威，日常交易交给卫星城（L2）。Solana 是一座高速都市：一条超宽主干道，所有车同时跑，但对城市基础设施（节点硬件）要求高。Cosmos 和 Polkadot 是“城市联盟”：每个城市自治，用统一的公路（IBC、XCM）相连。</p>
<p>类比的局限：城市可以搬家，链上的资产和合约却很难迁移。选链是一个长期决定。</p>`)}
${art('一图看懂：每条公链都偏向三角的一边，没有哪条能三个都拿满', 660, 312, [
  S.box(10, 14, 200, 56, { k: 'tint', icon: 'users', t: '去中心化', s: '人人能跑节点' }),
  S.box(230, 14, 200, 56, { k: 'tint', icon: 'shield', t: '安全', s: '攻击成本极高' }),
  S.box(450, 14, 200, 56, { k: 'tint', icon: 'bolt', t: '可扩展性', s: '高吞吐 低费用' }),
  S.arrow(110, 72, 110, 100),
  S.arrow(330, 72, 330, 100),
  S.arrow(550, 72, 550, 100),
  S.box(10, 102, 200, 96, { k: 'ok', t: '比特币', s: '10 分钟一块 · UTXO\n路窄，但城墙最厚' }),
  S.box(230, 102, 200, 96, { k: 'key', t: '以太坊', s: 'L1 保去中心化和安全\n性能交给 L2 Rollup' }),
  S.box(450, 102, 200, 44, { k: 'info', t: 'Solana', s: '单链高性能 · 硬件要求高' }),
  S.box(450, 154, 200, 44, { k: 'info', t: 'BNB Chain', s: '少量验证者换速度' }),
  S.box(450, 206, 200, 44, { k: 'info', t: 'Cosmos / Polkadot', s: '多条链分担负载' }),
  S.text(110, 222, '让步：吞吐低、脚本弱', { size: 12, dim: 1, anchor: 'middle' }),
  S.text(330, 222, '让步：L1 本身又慢又贵', { size: 12, dim: 1, anchor: 'middle' }),
  S.text(330, 288, '往一个角靠，其他角就让步：看 TPS 时，要连同节点成本一起看', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '从上往下读：先看一条链站在哪个角，再看它为此让出了什么。'],
  ['key', '没有最好的链，只有最适合业务的链：以太坊用 L2 补性能，Solana 靠硬件，Cosmos 靠多链。'],
  ['risk', '验证者越少，合谋或同时被监管施压的成本越低，评估链时先数独立验证者。'],
  ['limit', '三角是经验规律，不是定理；数据可用性采样、零知识证明正在放宽它。']
], '三列分别是去中心化、安全、可扩展性三个角，比特币偏去中心化与安全，以太坊保 L1 安全并把性能交给 L2，Solana、BNB Chain、Cosmos 与 Polkadot 偏性能', 'm05-1')}

<h2>2. 不可能三角：为什么没有完美的链</h2>
<p><strong>不可能三角（Blockchain Trilemma）</strong>指一条链很难同时做到三件事：</p>
${steps(['<strong>去中心化（Decentralization）</strong>：普通人用普通电脑就能运行节点、验证全部数据。', '<strong>安全（Security）</strong>：攻击者需要付出极高成本（算力或质押）才能篡改历史或审查交易。', '<strong>可扩展性（Scalability）</strong>：每秒能处理大量交易，费用低。'])}
<p>原因很直接：要提高吞吐量，最简单的办法是加大区块、缩短出块时间。但区块越大，节点需要的带宽、CPU、磁盘越多，能运行节点的人越少，去中心化就下降。</p>
${mm('不可能三角与各链的取舍方向', `
flowchart TB
  D["去中心化<br/>人人能跑节点"] --- S["安全<br/>攻击成本高"]
  S --- P["可扩展性<br/>高吞吐 低费用"]
  P --- D
  BTC["比特币<br/>优先 去中心化 + 安全"] -.-> D
  ETH["以太坊<br/>L1 保去中心化 + 安全<br/>性能交给 L2"] -.-> S
  SOL["Solana<br/>单链高性能<br/>节点硬件要求高"] -.-> P
  BNB["BNB Chain<br/>少量验证者换速度"] -.-> P
  COS["Cosmos / Polkadot<br/>多条链分担负载"] -.-> P
`, [
  ['flow', '每条虚线表示该链优先保障的方向。离某个角越近，其他两个角就让步越多。'],
  ['key', '“扩容”的本质是想办法同时拿到三个角：以太坊用 Rollup（见 <a href="#m05-4">M04.4</a>），Cosmos 用多链，Solana 用硬件和并行执行。'],
  ['limit', '三角是经验规律，不是数学定理。新技术（数据可用性采样、零知识证明）正在放宽它的约束。'],
  ['risk', '验证者越少，合谋或被监管机构同时施压的成本越低。评估一条链时，先数清它有多少个独立验证者。']
])}
${call('info', `<p>宣传中的 TPS（每秒交易数）经常是实验室峰值。比较链的性能时，看真实网络的日常 TPS、拥堵时的费用，以及运行一个节点需要的硬件。</p>`)}

<h2>3. 八条主流公链逐个看</h2>
<h3>3.1 比特币：UTXO、脚本与闪电网络</h3>
<p>比特币（Bitcoin，2009）使用工作量证明（PoW），平均 10 分钟出一个块。它的账本不是“账户余额表”，而是 <strong>UTXO（Unspent Transaction Output，未花费交易输出）</strong> 集合：每一枚“币”都是某笔交易的一个输出，花掉时必须整枚花掉，找零作为新输出回到自己地址。</p>
<p>比特币的 <strong>脚本（Script）</strong> 是一种故意不图灵完备的栈式语言，只能表达“谁能花这笔钱”的条件，例如单签、多签、时间锁。2021 年的 Taproot 升级让复杂条件更省空间、更隐私。</p>
<p><strong>闪电网络（Lightning Network）</strong> 是比特币的二层支付网络。两个人在链上锁定一笔资金，开一个 <strong>支付通道（Payment Channel）</strong>，之后在链下无限次互相签名更新余额，最后只把结果上链。多个通道连成网络，借助哈希时间锁合约（HTLC）实现跨通道路由支付。</p>
${mm('UTXO 模型：一笔交易怎样花币和找零', `
flowchart LR
  U1["UTXO A<br/>0.7 BTC 属于 Alice"] --> TX["交易 T<br/>Alice 签名解锁"]
  U2["UTXO B<br/>0.5 BTC 属于 Alice"] --> TX
  TX --> O1["新 UTXO<br/>1.0 BTC 给 Bob"]
  TX --> O2["新 UTXO 找零<br/>0.1999 BTC 回 Alice"]
  TX -.->|"输入 − 输出 = 0.0001"| FEE["矿工手续费"]
`, [
  ['flow', '输入的 UTXO 被整枚消耗；输出生成新 UTXO。余额 = 属于你的全部 UTXO 之和。'],
  ['fail', '忘记写找零输出，差额全部变成矿工手续费。这类错误在手写交易时真实发生过。'],
  ['key', 'UTXO 互相独立，天然适合并行验证；但表达复杂合约状态很不方便。'],
  ['limit', '比特币 L1 没有通用智能合约。DeFi 类应用需要侧链或二层方案。']
])}
<p>比特币各部分的深入讲解：UTXO 与脚本见 <a href="#m05-60">M05.4</a>，SegWit、Taproot 与 PSBT 见 <a href="#m05-61">M05.5</a>，闪电网络见 <a href="#m05-62">M05.6 闪电网络</a>。</p>
<h3>3.2 以太坊：账户、EVM 与 Rollup 中心路线</h3>
<p>以太坊（Ethereum，2015）使用 <strong>账户模型（Account Model）</strong>：全局状态是一张“地址 → 账户”的表，每个账户有余额、nonce，合约账户还有代码和存储。交易在 <strong>EVM（Ethereum Virtual Machine，以太坊虚拟机）</strong> 中执行，主流合约语言是 Solidity。</p>
<p>2022 年 The Merge 之后，以太坊改用权益证明（PoS），每 12 秒一个 slot，约 13 分钟（2 个 epoch）达到最终确定。以太坊的扩容策略叫 <strong>Rollup 中心路线图（Rollup-centric Roadmap）</strong>：L1 专注安全和数据可用性，日常交易在 Arbitrum、Optimism、Base 等 L2 上执行。细节见 <a href="#m05-2">M04.2 以太坊架构</a>。</p>
<h3>3.3 Solana：PoH、Sealevel 与账户模型</h3>
<p>Solana（2020）追求单链极致性能。三个关键设计：</p>
${steps(['<strong>历史证明（PoH，Proof of History）</strong>：领导者节点连续计算 SHA-256 哈希链，每个哈希都依赖上一个，形成一个可验证的“时钟”。交易插入哈希链中，就得到了无需额外通信的全局顺序。PoH 不是共识本身，共识由 Tower BFT（基于 PoS 投票）完成。', '<strong>Sealevel 并行执行</strong>：每笔交易必须提前声明要读写哪些账户。运行时把不冲突的交易分配到多个 CPU 核心同时执行。', '<strong>账户模型（程序与数据分离）</strong>：Solana 的程序（合约）本身无状态，数据存放在单独的“数据账户”里，由程序拥有。账户需要存入足额 SOL 才能免租（Rent-exempt）。'])}
<p>Solana 的 slot 约 400 毫秒；开发语言是 Rust（常用 Anchor 框架）。代价是验证者硬件要求高（高核 CPU、数百 GB 内存、高带宽），历史上也发生过多次全网停机，集中在 2021–2022 年；2024 年 2 月又因程序缓存 bug 停止出块约 5 小时。${cite('Anza：Solana 主网 2024-02-06 停机报告', 'https://solana.com/news/02-06-24-solana-mainnet-beta-outage-report')}</p>
<h3>3.4 Cosmos：CometBFT、IBC 与应用链</h3>
<p>Cosmos 不是一条链，而是一套“造链工具 + 链间协议”。</p>
${steps(['<strong>CometBFT（原名 Tendermint，2023 年改名）</strong>：一种 BFT 共识引擎。超过 2/3 投票权签名后，区块立即最终确定，没有分叉回滚。', '<strong>Cosmos SDK</strong>：用 Go 编写的模块化框架，开发者组合“银行、质押、治理”等模块，造出自己的链。', '<strong>IBC（Inter-Blockchain Communication，链间通信协议）</strong>：链之间用轻客户端互相验证对方的区块头，安全地传递代币和消息。', '<strong>应用链（Appchain）</strong>：一个应用独占一条链，可以自定义手续费、出块时间和治理。例如 dYdX v4、Osmosis。'])}
<h3>3.5 Polkadot：中继链与平行链</h3>
<p>Polkadot 采用 <strong>共享安全（Shared Security）</strong>：中心的 <strong>中继链（Relay Chain）</strong> 负责共识和最终性（BABE 出块 + GRANDPA 最终确定），多条 <strong>平行链（Parachain）</strong> 负责具体业务。平行链把区块交给中继链验证者检查，因此不需要自己招募验证者。平行链之间用 XCM 消息格式通信。开发框架是 Rust 的 Substrate（现属 Polkadot SDK）。Polkadot 已从“平行链插槽拍卖”转向按需购买区块空间的 Coretime 模式。</p>
<h3>3.6 Move 系：Aptos 与 Sui</h3>
<p>Aptos 和 Sui 都使用 <strong>Move 语言</strong>。Move 把资产建模为“资源（Resource）”：资源不能被复制、不能被隐式丢弃，只能被移动。这让“凭空增发”或“转账丢币”这类 bug 在语言层面更难出现。</p>
${tbl(['项目', 'Aptos', 'Sui'], [
  ['状态模型', '账户模型，资源存放在账户下', '<strong>对象模型（Object Model）</strong>：每个对象有全局唯一 ID 和所有者'],
  ['并行执行', 'Block-STM：先乐观并行执行，冲突的交易再重新执行', '只涉及“独占对象”的交易可走快速路径，无需全局排序；涉及“共享对象”的交易才走共识'],
  ['共识', 'AptosBFT（BFT 家族）', 'Mysticeti（基于 DAG 的 BFT）'],
  ['最终性', '亚秒到秒级', '亚秒到秒级']
])}
<p>Move 资源模型、Aptos 与 Sui 的开发细节见 <a href="#m05-64">M05.8 Move 链</a>。</p>
<h3>3.7 TON：分片与异步消息</h3>
<p>TON（The Open Network）最初由 Telegram 团队设计。它有一条主链（Masterchain）和多条工作链（Workchain），工作链按负载动态拆分成分片链（Shardchain）。合约之间不能同步调用，只能互发 <strong>异步消息</strong>，类似“演员模型（Actor Model）”。开发语言有 FunC、Tact、Tolk。优势是和 Telegram 的用户入口深度集成；难点是异步编程容易写出“消息发出去但对方失败、自己没回滚”的 bug。</p>
<h3>3.8 BNB Chain：EVM 兼容与少量验证者</h3>
<p>BNB Smart Chain 与以太坊 EVM 兼容，以太坊的合约、钱包、工具几乎可以直接使用。它采用 PoSA（权益授权 + 权威证明，共识名 Parlia），只有少量（数十个）活跃验证者轮流出块，因此费用低、速度快。2025 年的升级把出块时间先从 3 秒降到 1.5 秒（4 月 29 日 Lorentz）${cite('BNB Chain 文档：Lorentz 硬分叉公告', 'https://docs.bnbchain.org/announce/lorentz-bsc')}，再降到 0.75 秒（6 月 30 日 Maxwell）${cite('BNB Chain 官方博客：Maxwell 硬分叉', 'https://www.bnbchain.org/en/blog/bnb-chain-announces-maxwell-hardfork-bsc-moves-to-0-75-second-block-times')}；2026 年 1 月 14 日 Fermi 硬分叉进一步降到约 0.45 秒（截至 2026 年公开资料）${cite('BNB Chain 官方博客：Fermi 硬分叉', 'https://www.bnbchain.org/en/blog/fermi-hard-fork-accelerates-bsc-to-0-45-second-block-times')}。代价是去中心化程度低于以太坊。</p>

<h2>4. 一张表对比八条链</h2>
${tbl(['链', '共识', '出块时间（示例）', '最终性', '执行模型', '编程语言', '生态特点'], [
  ['比特币', 'PoW', '约 10 分钟', '概率性，常用 6 确认（约 1 小时）', 'UTXO + Script', 'Script（受限）', '价值存储、闪电网络支付'],
  ['以太坊', 'PoS（Gasper）', '12 秒/slot', '约 13 分钟（2 epoch）', '账户 + EVM，串行', 'Solidity、Vyper', 'DeFi、L2 最多、开发者最多'],
  ['Solana', 'PoS + PoH + Tower BFT', '约 0.4 秒/slot', '乐观确认亚秒级；finalized 约十几秒', '账户（程序与数据分离），Sealevel 并行', 'Rust（Anchor）', '高频交易、Meme、支付'],
  ['Cosmos 链', 'CometBFT', '约 1–7 秒（各链不同）', '即时（单区块）', '各链自定，Cosmos SDK', 'Go；可接 CosmWasm（Rust）', '应用链、IBC 互联'],
  ['Polkadot', 'NPoS：BABE + GRANDPA', '约 6 秒', '秒到十几秒', '平行链各自定义（Wasm 运行时）', 'Rust（Substrate）', '共享安全、XCM'],
  ['Aptos', 'AptosBFT', '亚秒级', '亚秒到秒级', '账户 + Move 资源，Block-STM 并行', 'Move', '高性能、Move 生态'],
  ['Sui', 'Mysticeti（DAG BFT）', '亚秒级', '亚秒到秒级', '对象模型，独占对象快速路径', 'Sui Move', '游戏、NFT、消费级应用'],
  ['TON', 'PoS（BFT）', '约数秒', '数秒', '主链 + 动态分片，异步消息', 'FunC、Tact、Tolk', 'Telegram 小程序与支付'],
  ['BNB Chain', 'PoSA（Parlia）', '1 秒以内（截至 2026 年约 0.45 秒）', '快速最终性数秒', '账户 + EVM', 'Solidity', '低费用 EVM、零售用户多']
])}
${call('warn', `<p>表中数字是截至 2026 年的公开资料，会随升级变化。上线前请到各链官方文档确认当前参数，尤其是最终性和确认数——充值入账规则直接依赖它们，设错会导致双花损失。</p>`)}
<p><strong>算一算（示例）</strong>：用户在比特币和以太坊上各充值一笔。交易所要求比特币 6 个确认、以太坊等最终确定。</p>
${steps(['比特币：6 × 10 分钟 = 60 分钟。', '以太坊：交易进块后，需要等它所在 epoch 被最终确定。最坏情况约 3 个 epoch：3 × 32 slot × 12 秒 = 1,152 秒 ≈ 19 分钟；通常约 13–15 分钟。', 'Solana：finalized 承诺约 32 个 slot：32 × 0.4 秒 ≈ 13 秒。', '结论：同样“安全入账”，用户等待时间相差可以超过 200 倍。选链时要把这一点写进产品体验设计。'])}

<h2>5. 如何为业务选链</h2>
<p>选链不是选“最快的链”，而是按约束排除。先问硬性约束，再比生态和成本。</p>
${mm('业务选链决策图', `
flowchart TB
  Q0["你的业务"] --> Q1{"主要处理 BTC<br/>或只做价值存储？"}
  Q1 -->|"是"| A1["比特币 + 闪电网络"]
  Q1 -->|"否"| Q2{"需要最多的 DeFi 流动性<br/>和最高安全？"}
  Q2 -->|"是"| Q3{"用户能接受 L1 费用？"}
  Q3 -->|"能，大额低频"| A2["以太坊 L1"]
  Q3 -->|"不能"| A3["以太坊 L2<br/>Arbitrum · Base · OP"]
  Q2 -->|"否"| Q4{"需要高频、低延迟<br/>例如订单簿 · 支付？"}
  Q4 -->|"是"| A4["Solana 或 Sui / Aptos"]
  Q4 -->|"否"| Q5{"需要自定义手续费<br/>治理或独占吞吐？"}
  Q5 -->|"是"| A5["应用链<br/>Cosmos SDK · OP Stack · Polkadot"]
  Q5 -->|"否"| Q6{"用户在 Telegram<br/>或强调低成本 EVM？"}
  Q6 -->|"Telegram"| A6["TON"]
  Q6 -->|"低成本 EVM"| A7["BNB Chain 或 EVM L2"]
`, [
  ['flow', '从上到下回答问题。每个问题都是一个硬约束，不满足就跳到下一个分支。'],
  ['key', '团队语言栈是隐藏的硬约束：Solidity 团队转 Rust/Move 至少需要数月学习和审计成本。'],
  ['limit', '决策图给出候选，不给最终答案。还要比较审计资源、托管服务、交易所支持和合规要求。'],
  ['risk', '选了验证者很少的链，等于接受“少数机构可以停链或审查”的风险。面向机构的资产类业务要特别评估。']
])}
<p>工程上，把选型写成一份可评审的打分表。下面是一个 TypeScript 的简化打分函数，权重按你的业务调整：</p>
${code('TYPESCRIPT', `
// 选链打分（示例）：分数 1–5，权重之和为 1
type Chain = { name: string; security: number; cost: number; ecosystem: number; latency: number; teamFit: number };
const weights = { security: 0.3, cost: 0.2, ecosystem: 0.25, latency: 0.1, teamFit: 0.15 };

function score(c: Chain): number {
  return (Object.keys(weights) as (keyof typeof weights)[])
    .reduce((sum, k) => sum + c[k] * weights[k], 0);
}

const candidates: Chain[] = [
  { name: 'Ethereum L1', security: 5, cost: 1, ecosystem: 5, latency: 2, teamFit: 5 },
  { name: 'Base (L2)',   security: 4, cost: 5, ecosystem: 4, latency: 4, teamFit: 5 },
  { name: 'Solana',      security: 4, cost: 5, ecosystem: 4, latency: 5, teamFit: 2 },
];
candidates
  .map(c => ({ name: c.name, score: score(c).toFixed(2) }))
  .sort((a, b) => +b.score - +a.score)
  .forEach(r => console.log(r.name, r.score));
`)}
${tryit(`<p>用浏览器对比三条链的真实区块：</p>
<ol><li>打开 mempool.space，点开最新比特币区块，记录区块大小和交易数。</li>
<li>打开 etherscan.io，点开最新以太坊区块，记录 Gas Used 和交易数；再点 “Slot” 链接，查看它属于哪个 epoch、是否已 Finalized。</li>
<li>打开 explorer.solana.com，观察 slot 编号每秒增长约 2–3 个。</li></ol>
<p>预期结果：你能用自己的数据说出三条链的出块间隔和单块交易数差异。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['确认数 / 最终性规则按链单独配置', '每条链的最终性模型不同，统一用“6 确认”会出错', '代码评审：每条链有独立的 confirmations 或 finalized 配置'],
  ['评估验证者数量与客户端多样性', '验证者少、客户端单一会放大停链风险', '查看链的浏览器或社区统计页面，记录数值与日期'],
  ['确认交易所、托管方、预言机支持', '缺少基础设施会让上线延迟数月', '列出依赖清单，逐项拿到书面支持确认'],
  ['评估停链历史与恢复方式', '停链期间充提必须暂停', '查阅官方事故报告，写进应急预案'],
  ['跨链迁移成本', '合约和资产难迁移，选错代价高', '估算重写合约、重新审计、迁移流动性的人月']
])}

${mistakes([
  ['TPS 越高的链越好。', '高 TPS 往往以更少验证者或更高硬件门槛为代价。要按业务约束选链。'],
  ['进了区块就等于到账。', '概率性最终性的链需要等确认数；以太坊要等最终确定，才算不可回滚。'],
  ['所有 EVM 兼容链都一样安全。', 'EVM 兼容只说明代码能运行。安全取决于共识、验证者分布和桥的设计。'],
  ['Cosmos 和 Polkadot 都是“一条链”。', '它们是多链体系：Cosmos 各链自己负责安全，Polkadot 平行链共享中继链安全。']
])}
${recap(['不可能三角：去中心化、安全、可扩展性很难同时最大化，每条链都在取舍。', '比特币用 UTXO + 受限脚本，扩容靠闪电网络支付通道。', '以太坊用账户 + EVM，扩容走 Rollup 中心路线。', 'Solana 用 PoH 排序 + Sealevel 并行；Sui 用对象模型；Aptos 用 Block-STM。', 'Cosmos 是应用链 + IBC，Polkadot 是中继链共享安全；TON 用异步消息和动态分片。', '选链按硬约束逐步排除，并把确认规则、生态依赖写进上线清单。'])}
${quiz([
  { q: '一条链把区块大小提高 10 倍，最可能直接牺牲不可能三角中的哪一项？', o: ['安全', '去中心化', '可扩展性', '三者都不受影响'], a: 1, why: '解析：大区块需要更多带宽和硬件，能运行节点的人变少，去中心化下降。可扩展性反而提高；安全不会直接下降。' },
  { q: 'Solana 的 PoH 主要解决什么问题？', o: ['替代共识投票', '加密交易内容', '降低存储成本', '在不额外通信的情况下给交易一个可验证的全局顺序'], a: 3, why: '解析：PoH 是可验证的时钟，用来排序。共识仍由 Tower BFT 投票完成；它不负责加密和存储。' },
  { q: 'Sui 中只涉及用户自己“独占对象”的转账，为什么能更快？', o: ['因为它不需要和其他交易做全局排序，可以走快速路径', '因为它跳过了签名验证', '因为它只由一个节点处理', '因为它不收手续费'], a: 0, why: '解析：独占对象不会和别人的交易冲突，不需要共识排序。签名仍要验证，也仍由验证者集合确认并收费。' },
  { q: '一个团队全部是 Solidity 开发者，需要深度 DeFi 流动性，且用户不能接受高 Gas。最合理的首选是？', o: ['比特币 L1', 'Cosmos 新应用链', '以太坊 L2（如 Arbitrum、Base）', 'TON'], a: 2, why: '解析：L2 兼容 EVM、费用低，又能接入以太坊流动性。比特币 L1 没有通用合约；新应用链需要从零建设流动性；TON 语言栈不同。' }
])}
${exercises([["计算题（示例）：用文中打分函数的权重（安全 0.3、成本 0.2、生态 0.25、延迟 0.1、团队匹配 0.15），算出 Base（L2）和 Solana 的得分。如果团队全员转到 Rust，Solana 的团队匹配分从 2 升到 5，排名会怎样变化？", "<p>Base：4×0.3 + 5×0.2 + 4×0.25 + 4×0.1 + 5×0.15 = 1.2 + 1.0 + 1.0 + 0.4 + 0.75 = <strong>4.35</strong>。</p><p>Solana：4×0.3 + 5×0.2 + 4×0.25 + 5×0.1 + 2×0.15 = 1.2 + 1.0 + 1.0 + 0.5 + 0.3 = <strong>4.00</strong>。</p><p>团队匹配分升到 5 后，Solana 多得 3×0.15 = 0.45，变为 4.45，超过 Base。这说明团队语言栈是隐藏的硬约束，它能直接改变选型结果。</p>"], ["思考题：一家交易所把比特币的“6 确认”规则直接套用到以太坊和 Solana 的充值入账上。这样做有什么问题？应该怎样改？", "<p>每条链的最终性模型不同。比特币是概率性最终性，确认数越多越难回滚。以太坊要等区块所在的 epoch 被最终确定（约 13 分钟），数 6 个区块并不等于不可回滚。Solana 有自己的 finalized 承诺。</p><p>统一规则会让入账过早，被重组时造成双花损失。应该按链单独配置 <code>confirmations</code> 或 <code>finalized</code> 规则，并在代码评审中检查。</p>"], ["思考题：TON 的合约之间只能互发异步消息。和以太坊的同步调用相比，开发者要额外处理什么风险？", "<p>在 TON 上，合约发出消息后不会立刻知道对方是否执行成功。对方失败时，发送方的状态不会自动回滚。</p><p>开发者要自己处理“消息发出去但对方失败、自己没回滚”的情况，例如设计回退消息和状态补偿。以太坊的同步调用失败时整笔交易回滚，不需要这类处理。</p>"]])}
${checklist(["能用不可能三角解释加大区块为什么会降低去中心化。", "能说出 UTXO 模型中找零输出的作用，以及漏写找零的后果。", "能对比 Solana 的 PoH 与 Sealevel、Sui 的对象模型、Aptos 的 Block-STM 各自解决什么问题。", "能按选链决策图为一个业务选出候选链，并写出硬约束和选型理由。", "能为每条链单独写出充值入账的确认数或最终性规则。"])}
${terms([
  ['不可能三角', 'Blockchain Trilemma', '去中心化、安全、可扩展性难以同时最大化的经验规律'],
  ['UTXO', 'Unspent Transaction Output', '未花费的交易输出，比特币记账的基本单位'],
  ['支付通道', 'Payment Channel', '双方链上锁定资金、链下反复更新余额、最后结算的结构'],
  ['历史证明', 'Proof of History', 'Solana 用连续哈希链构造的可验证时钟'],
  ['Sealevel', 'Sealevel', 'Solana 按声明的读写账户并行执行交易的运行时'],
  ['CometBFT', 'CometBFT (Tendermint)', 'Cosmos 使用的 BFT 共识引擎，单区块即最终确定'],
  ['IBC', 'Inter-Blockchain Communication', '基于轻客户端验证的链间通信协议'],
  ['应用链', 'Appchain', '为单个应用定制的独立区块链'],
  ['平行链', 'Parachain', '在 Polkadot 中继链上共享安全的业务链'],
  ['对象模型', 'Object Model', 'Sui 以带唯一 ID 和所有者的对象表示全部状态的模型']
])}
` });

CUR = 'm05-2';
addCh({ id: 'm05-2', nav: '以太坊架构', title: 'M04.2 以太坊架构：执行层、共识层与升级路线', desc: '两层客户端怎样配合出块，状态怎样存储，升级历史和路线图', html: `
<h1>M04.2 以太坊架构：执行层、共识层与升级路线</h1>
${meta(['画出执行层与共识层的分工，以及两者之间的 Engine API。', '说清以太坊状态、状态树、合约存储的结构，以及一个区块从提议到最终确定的全过程。', '列出 The Merge 以来的主要升级和路线图，并解释客户端多样性为什么重要。'], '<a href="#m05-1">M04.1 公链全景</a>、<a href="#m01">M01 区块链基础</a>')}
${beginner(`<p><strong>客户端（Client）</strong>：实现以太坊协议的软件。运行它的电脑叫节点。</p>
<p><strong>验证者（Validator）</strong>：质押 ETH、负责出块和投票的身份。一台机器可以运行很多个验证者。</p>
<p><strong>slot / epoch</strong>：以太坊的时间单位。1 个 slot = 12 秒，最多出 1 个块；1 个 epoch = 32 个 slot ≈ 6.4 分钟。</p>
<p><strong>状态（State）</strong>：此刻所有账户的余额、nonce、合约代码和合约存储的总和。</p>
<p><strong>硬分叉（Hard Fork）</strong>：协议规则升级。所有节点必须在约定的区块或时间点同时升级，否则会被分到另一条链上。</p>`)}

<h2>1. 一句话理解</h2>
${one('以太坊节点由两个程序组成：执行层负责“算对交易”，共识层负责“大家同意哪条链”。两者通过 Engine API 对话。')}
${call('analogy', `<p>把以太坊节点想成一家报社。执行层是编辑部：拿到稿件（交易），逐字核对、排版，算出新的版面（状态）。共识层是社委会：决定今天由谁主编、哪一版正式付印、印好的报纸何时永久归档（最终确定）。编辑部和社委会通过一条内部专线（Engine API）沟通。</p>
<p>类比的局限：报社只有一个社委会；以太坊有上百万个验证者同时投票，没有人能单独决定结果。</p>`)}
${art('一图看懂：一个以太坊节点 = 执行层 + 共识层，用 Engine API 对话', 660, 340, [
  S.zone(150, 14, 500, 276, { t: '你运维的一台节点服务器' }),
  S.box(10, 96, 112, 64, { k: 'info', icon: 'phone', t: '应用' }),
  S.text(66, 182, '只和执行层对话\nJSON-RPC 8545', { size: 12, dim: 1, anchor: 'middle' }),
  S.box(165, 52, 170, 110, { k: 'key', icon: 'cpu', t: '执行层 EL', s: '交易池 · EVM · 状态\nGeth / Reth 等\n网络 devp2p', ss: 11.5 }),
  S.box(475, 52, 165, 110, { k: 'info', icon: 'check', t: '共识层 CL', s: '选链头 · 最终性\nLighthouse / Prysm\n网络 libp2p', ss: 11.5 }),
  S.box(475, 214, 165, 60, { k: 'warn', icon: 'key', t: '验证者客户端 VC', s: '保管签名密钥' }),
  S.box(165, 214, 170, 60, { k: 'risk', dash: 1, t: '只跑 EL 不跑 CL', s: '永远同步不到最新块' }),
  S.arrow(124, 128, 163, 110),
  S.arrow(337, 107, 473, 107, { both: 1, k: 'key', label: 'Engine API · JWT' }),
  S.arrow(557, 212, 557, 164, { label: 'Beacon API' }),
  S.text(330, 322, 'EL 算对交易，CL 决定哪条链为准，缺一不可', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '应用只连执行层；共识层通过 Engine API 告诉执行层验证哪个区块、哪个是链头。'],
  ['key', '两层各有独立客户端，可以自由搭配，例如 Nethermind + Teku，这是客户端多样性的基础。'],
  ['fail', '只运行执行层，节点不知道哪条链是正确的，同步不到最新区块。'],
  ['risk', '8551 端口和 JWT 密钥一旦暴露，攻击者能向执行层注入错误链头。']
], '以太坊节点内部由执行层和共识层两个程序组成，通过 Engine API 通信，应用经 JSON-RPC 访问执行层，验证者客户端连接共识层', 'm05-2')}

<h2>2. 执行层与共识层：The Merge 之后的双客户端架构</h2>
<p>2022 年 9 月 15 日，<strong>The Merge（合并）</strong> 把原来的 PoW 主网（执行层）和 2020 年 12 月上线的信标链（Beacon Chain，共识层）合在一起。从此出块由 PoS 验证者负责，挖矿停止，以太坊能耗下降超过 99.9%（以太坊官方估算约 99.99%）。${cite('ethereum.org：以太坊能耗', 'https://ethereum.org/en/energy-consumption/')}</p>
${tbl(['层', '职责', '主要接口', '客户端（实现语言）'], [
  ['执行层 EL（Execution Layer）', '维护交易池、执行 EVM、维护状态、对外提供 JSON-RPC', 'JSON-RPC（8545）、Engine API（8551）、devp2p 网络', 'Geth（Go）、Nethermind（C#）、Besu（Java）、Erigon（Go）、Reth（Rust）'],
  ['共识层 CL（Consensus Layer）', '运行 PoS：选提议者、收集证明、分叉选择、最终性', 'Beacon API（REST，常用 5052）、libp2p 网络', 'Prysm（Go）、Lighthouse（Rust）、Teku（Java）、Nimbus（Nim）、Lodestar（TypeScript）'],
  ['验证者客户端 VC', '保管签名密钥，按共识层的指示签署区块和证明', '通过 Beacon API 连接共识层', '通常和共识客户端同一项目提供']
])}
${mm('一个以太坊节点的内部结构', `
flowchart LR
  subgraph EL["执行层客户端 例如 Geth"]
    POOL["交易池"] --> EVM["EVM 执行"]
    EVM --> ST[("状态数据库")]
  end
  subgraph CL["共识层客户端 例如 Lighthouse"]
    FC["分叉选择 LMD-GHOST"] --> FIN["最终性 Casper FFG"]
  end
  VC["验证者客户端<br/>保管签名密钥"] -->|"Beacon API"| CL
  CL -->|"Engine API + JWT<br/>端口 8551"| EL
  APP["DApp / 后端"] -->|"JSON-RPC 8545"| EL
  EL <-->|"devp2p<br/>交易 · 区块体"| P1["其他执行层节点"]
  CL <-->|"libp2p<br/>区块 · 证明"| P2["其他共识层节点"]
`, [
  ['flow', '应用只和执行层打交道（JSON-RPC）。共识层通过 Engine API 告诉执行层：“验证这个区块”“把链头设为这个区块”“为我打包一个新区块”。'],
  ['fail', '只运行执行层、不运行共识层，节点永远无法同步到最新区块——合并后执行层自己不知道哪条链是正确的。'],
  ['risk', 'Engine API 用 JWT 共享密钥鉴权。密钥泄露或把 8551 端口暴露到公网，攻击者可以向执行层注入错误的链头。'],
  ['key', '两层可以自由组合不同团队的客户端，例如 Nethermind + Teku。这是客户端多样性的基础。']
])}
<p><strong>Engine API</strong> 的三个核心方法：</p>
${steps(['<code>engine_newPayloadVx</code>：共识层把收到的区块（执行负载）交给执行层验证。执行层返回 VALID、INVALID 或 SYNCING。', '<code>engine_forkchoiceUpdatedVx</code>：共识层通知执行层新的链头、安全块和最终确定块；如果附带出块参数，执行层开始构建新区块。', '<code>engine_getPayloadVx</code>：轮到本节点出块时，共识层向执行层取回构建好的区块。'])}
<p>下面是用 Docker 启动一对客户端的最小命令（示例，参数以官方文档为准）：</p>
${code('BASH', `
# 1. 生成两层共享的 JWT 密钥（32 字节十六进制）
openssl rand -hex 32 > /secrets/jwt.hex

# 2. 执行层：Geth，开放 JSON-RPC 只给本机，Engine API 用 JWT 鉴权
geth --mainnet --datadir /data/geth \\
  --http --http.addr 127.0.0.1 --http.api eth,net,web3 \\
  --authrpc.addr 127.0.0.1 --authrpc.port 8551 \\
  --authrpc.jwtsecret /secrets/jwt.hex

# 3. 共识层：Lighthouse，从可信检查点快速同步
lighthouse bn --network mainnet --datadir /data/lighthouse \\
  --execution-endpoint http://127.0.0.1:8551 \\
  --execution-jwt /secrets/jwt.hex \\
  --checkpoint-sync-url https://mainnet.checkpoint.sigp.io \\
  --http --http-address 127.0.0.1

# 4. 检查同步状态
curl -s localhost:5052/eth/v1/node/syncing
curl -s -X POST localhost:8545 -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_syncing","params":[]}'
`)}

<h2>3. 客户端多样性：为什么不能都用 Geth</h2>
<p>每个客户端都可能有 bug。bug 的影响取决于使用该客户端的验证者占比：</p>
${tbl(['出 bug 的客户端占比', '后果'], [
  ['小于 1/3', '使用它的验证者离线或投错票，损失少量奖励；网络照常最终确定'],
  ['1/3 到 2/3', '网络无法最终确定。不活跃泄漏开始，离线一方的质押被逐步扣减'],
  ['大于 2/3', '错误的链可能被最终确定。修复后，这些验证者想回到正确链，会因“环绕投票”被罚没或被长期泄漏，损失可能是全部质押']
])}
<p>真实案例：2023 年 5 月，以太坊主网两次暂时无法最终确定，原因是部分共识客户端在高负载下处理旧证明出错；因为其他客户端正常，链继续出块，几个 epoch 后自动恢复。${cite('ethresear.ch：2023 年 5 月两次最终性事件分析', 'https://ethresear.ch/t/cascading-network-effects-on-ethereums-finality/15871')}2024 年 1 月，Nethermind 的一个 bug 让使用它的节点把一个有效区块判为无效、暂时停止跟随链，因为其占比远低于 1/3，网络没有受影响。${cite('Nethermind 官方事后报告（2024-01-21）', 'https://hackmd.io/@nethermindclient/ByW9sX_R6')}</p>
${call('warn', `<p>质押服务商和交易所集中使用同一个执行客户端，是整个以太坊的系统性风险。运行验证者时，优先选择占比低于 1/3 的少数派客户端。如果多数派客户端出 bug，你不会和多数人一起被罚。</p>`)}

<h2>4. 状态、状态树与存储</h2>
<p>以太坊的<strong>世界状态（World State）</strong>是一个“地址 → 账户”的映射。每个账户有四个字段：</p>
${steps(['<code>nonce</code>：外部账户已发出的交易数；合约账户已创建的合约数。', '<code>balance</code>：余额，单位 wei（1 ETH = 10^18 wei）。', '<code>storageRoot</code>：该合约存储树的根哈希。', '<code>codeHash</code>：合约代码的哈希；外部账户为空代码的哈希。'])}
<p>这些数据用 <strong>默克尔帕特里夏树（MPT，Merkle Patricia Trie）</strong> 组织。树根 <code>stateRoot</code> 写进每个区块头。任何账户的任何变化都会改变 stateRoot，所以节点只要比较一个 32 字节的哈希，就能确认双方状态完全一致。</p>
${mm('区块头、状态树与合约存储的关系', `
flowchart TB
  BH["区块头<br/>stateRoot · transactionsRoot · receiptsRoot"] --> SR["状态树 MPT<br/>键 = keccak256 地址"]
  SR --> A1["外部账户<br/>nonce · balance"]
  SR --> A2["合约账户 USDC<br/>nonce · balance · storageRoot · codeHash"]
  A2 --> STO["存储树<br/>键 = keccak256 槽位号"]
  A2 --> CODE["合约字节码"]
  STO --> S0["槽位 0：totalSupply"]
  STO --> S1["槽位 keccak256 地址, 9<br/>某用户余额"]
  BH --> TR["交易树"]
  BH --> RR["收据树<br/>日志 Logs"]
`, [
  ['flow', '区块头 → 状态树 → 账户 → 存储树 → 槽位。每一层都用哈希指向下一层。'],
  ['key', '有了 stateRoot，轻客户端可以用 <code>eth_getProof</code> 拿到默克尔证明，只信任区块头就能验证某个余额。'],
  ['limit', '状态只记录“当前值”。查询历史某区块的余额，需要归档节点保存每个区块的旧状态。'],
  ['fail', '状态持续增长（截至 2026 年，全节点数据为 TB 级）。磁盘慢或空间不足，节点会掉同步。']
])}
<p>合约的 Solidity 变量按顺序放进 2^256 个 32 字节槽位。<code>mapping(address =&gt; uint256)</code> 中某个键的位置是 <code>keccak256(键 . 槽位号)</code>。下面用 go-ethereum 直接读取存储槽：</p>
${code('GO', `
package main

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

func main() {
	ctx := context.Background()
	cli, err := ethclient.Dial("http://127.0.0.1:8545")
	if err != nil {
		panic(err)
	}
	token := common.HexToAddress("0xYourERC20Contract") // 示例：替换为真实合约
	holder := common.HexToAddress("0xHolder")
	balancesSlot := big.NewInt(0) // 示例：balances 映射位于槽位 0（以合约源码布局为准）

	// mapping 槽位 = keccak256( 左填充32字节的键 ++ 左填充32字节的槽位号 )
	key := crypto.Keccak256Hash(
		common.LeftPadBytes(holder.Bytes(), 32),
		common.LeftPadBytes(balancesSlot.Bytes(), 32),
	)
	raw, err := cli.StorageAt(ctx, token, key, nil) // nil 表示最新区块
	if err != nil {
		panic(err)
	}
	fmt.Println("余额（最小单位）:", new(big.Int).SetBytes(raw))
}
`)}

<h2>5. 一个区块的诞生：提议者、MEV-Boost 与构建者</h2>
<p>每个 slot，共识层用 RANDAO 随机数按有效余额加权，选出一位<strong>提议者（Proposer）</strong>。今天大多数提议者不自己排列交易，而是通过 <strong>MEV-Boost</strong> 中间件，把出块外包给专业的<strong>构建者（Builder）</strong>，自己只负责签名。这种分工叫 <strong>提议者-构建者分离（PBS）</strong>，细节见 <a href="#m05-7">M04.7 MEV</a>。</p>
${mm('一个 slot 内的出块流程（MEV-Boost）', `
sequenceDiagram
  participant U as 用户与搜索者
  participant B as 构建者
  participant R as 中继
  participant P as 提议者 共识层
  participant E as 执行层
  participant N as 全网验证者
  U->>B: 交易与交易包
  B->>R: 提交完整区块和出价
  P->>R: 请求最高出价的区块头
  R-->>P: 返回区块头 不含交易内容
  P->>R: 签名盲化区块头
  R->>N: 公布完整区块
  N->>E: newPayload 验证执行
  N->>N: 委员会成员在 slot 第 4 秒投票证明
`, [
  ['flow', '提议者只看到区块头和出价就签名，签名后中继才公开交易内容。这样构建者不怕提议者偷走区块里的套利机会。'],
  ['risk', '中继是可信第三方：它可能延迟公布、审查交易。提议者可以同时连接多个中继，并设置本地出块兜底。'],
  ['fail', '区块在 slot 开始后 4 秒内没有到达多数验证者，证明者会投给上一个区块，这个 slot 变成空块（missed slot），提议者拿不到奖励。'],
  ['key', '不使用 MEV-Boost 时，执行层通过 forkchoiceUpdated + getPayload 在本地构建区块，流程更简单但收入更低。']
])}
<p><strong>算一算（示例）</strong>：一个区块从提议到最终确定要多久？</p>
${steps(['区块在 epoch N 的第 6 个 slot（索引 5）产生：记为 0 秒。', 'epoch N 结束：还剩 26 个 slot × 12 秒 = 312 秒。', 'epoch N+1 结束时，epoch N+1 的检查点（本区块的后代）获得 2/3 证明，变为“已证明（justified）”：再过 384 秒，累计 696 秒。', 'epoch N+2 结束时，epoch N+2 也被证明，epoch N+1 的检查点变为“已最终确定（finalized）”，本区块随之最终确定：再过 384 秒，累计 1,080 秒 = 18 分钟。', '实践中客户端会更早处理投票，常见观测值约 13–15 分钟。交易所入账可以用 <code>eth_getBlockByNumber(&quot;finalized&quot;)</code> 判断。'])}

<h2>6. 升级历史与路线图</h2>
${tbl(['时间', '升级', '关键变化'], [
  ['2015-07', 'Frontier', '以太坊主网上线（PoW）'],
  ['2020-12', '信标链上线', 'PoS 共识层独立运行，开始接受质押'],
  ['2021-08', 'London', 'EIP-1559：基础费用销毁 + 小费机制'],
  ['2022-09', 'The Merge（Paris / Bellatrix）', 'PoW 停止，执行层接入信标链'],
  ['2023-04', 'Shanghai / Capella（Shapella）', 'EIP-4895：开放质押提款'],
  ['2024-03', 'Dencun（Cancun / Deneb）', 'EIP-4844 blob 交易，L2 数据成本大幅下降；EIP-1153 瞬时存储；EIP-6780 限制 SELFDESTRUCT'],
  ['2025-05', 'Pectra（Prague / Electra）', 'EIP-7702：外部账户可设置代码委托（持续有效，直到被替换或清除）；EIP-7251：单个验证者有效余额上限提高到 2,048 ETH；EIP-7002：执行层触发退出；EIP-7691：blob 目标 / 上限提高到 6 / 9'],
  ['2025-12', 'Fusaka（Fulu / Osaka）', 'EIP-7594 PeerDAS：节点只采样部分 blob 数据，为继续扩大 blob 容量铺路']
])}
<p>Vitalik Buterin 把长期路线图分为六部分：<strong>The Merge</strong>（PoS 与单 slot 最终性）、<strong>The Surge</strong>（Rollup 与数据扩容）、<strong>The Scourge</strong>（抵抗 MEV 与质押集中）、<strong>The Verge</strong>（无状态验证，用 Verkle 树或二叉树替换 MPT）、<strong>The Purge</strong>（删除历史数据与旧特性）、<strong>The Splurge</strong>（其他改进，例如账户抽象）。截至 2026 年公开资料，下一次升级 Glamsterdam 已选定的核心内容（headliner）是协议内 PBS（ePBS，EIP-7732）和区块级访问列表（BAL，EIP-7928），具体范围和上线时间以最终上线内容为准。</p>
${tryit(`<p>用 curl 观察两层客户端的数据（可以用公共 RPC，或自建节点）：</p>
<ol><li>执行层：<code>curl -s -X POST https://ethereum-rpc.publicnode.com -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBlockByNumber","params":["finalized",false]}'</code>，记下返回的 <code>number</code> 和 <code>stateRoot</code>。</li>
<li>把 <code>finalized</code> 换成 <code>latest</code>，对比两个区块号。</li>
<li>预期结果：latest 比 finalized 高约 64–96 个区块（2–3 个 epoch），说明最新区块还没有被最终确定。</li></ol>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['执行层与共识层都已同步', '任何一层落后，节点返回的数据都是旧的', '<code>eth_syncing</code> 返回 false；<code>/eth/v1/node/syncing</code> 中 is_syncing 为 false'],
  ['8551 和管理 API 只监听内网', '暴露后可被注入链头或调用危险方法', '在外网主机上 <code>nc -zv</code> 测试端口不通'],
  ['使用少数派客户端组合', '降低与多数派一起出错的风险', '对照社区客户端分布统计页面'],
  ['订阅硬分叉公告，提前升级', '错过升级时间点，节点会停在旧链', '监控客户端版本号；在测试网先演练'],
  ['入账使用 finalized 区块', 'latest 区块可能被重组', '代码评审：确认数逻辑使用 finalized 标签']
])}

${mistakes([
  ['The Merge 之后，Geth 一个程序就能跑以太坊节点。', '合并后必须同时运行执行客户端和共识客户端，两者通过 Engine API 通信。'],
  ['The Merge 降低了 Gas 费用。', 'The Merge 改变的是共识方式和能耗。费用下降主要来自 L2 和 EIP-4844。'],
  ['用哪个客户端只是个人偏好。', '客户端占比超过 1/3 或 2/3 时，它的 bug 会影响整个网络的最终性，甚至导致大规模罚没。'],
  ['stateRoot 里保存了所有历史余额。', 'stateRoot 只承诺当前状态。历史状态要靠归档节点保存。']
])}
${recap(['节点 = 执行层客户端 + 共识层客户端，通过 Engine API（JWT 鉴权）通信。', '客户端多样性决定 bug 的影响范围：超过 1/3 停最终性，超过 2/3 可能确认错误链。', '世界状态用 MPT 组织，stateRoot 写入区块头；合约存储是每个合约自己的一棵存储树。', '多数区块通过 MEV-Boost 由构建者生成，提议者只签名区块头。', '关键升级：Merge（2022）、Shapella 提款（2023）、Dencun blob（2024）、Pectra（2025）、Fusaka PeerDAS（2025）。'])}
${quiz([
  { q: 'Engine API 连接的是哪两个组件？', o: ['钱包与执行层', '共识层客户端与执行层客户端', '验证者客户端与中继', '两个执行层节点'], a: 1, why: '解析：Engine API 专门用于共识层驱动执行层。钱包用 JSON-RPC；验证者客户端用 Beacon API；执行层节点之间用 devp2p。' },
  { q: '某执行客户端被 70% 的验证者使用，它出现 bug 并确认了一条错误的链。最严重的后果是？', o: ['只有使用它的节点短暂离线', '交易费上涨', '全部 ETH 被增发', '错误链可能被最终确定，这些验证者回到正确链时会面临罚没或长期泄漏'], a: 3, why: '解析：超过 2/3 的质押可以最终确定任意链。离线只是小于 1/3 时的后果；这个 bug 与费用和增发无直接关系。' },
  { q: '以下哪项升级引入了 blob 交易，让 L2 成本大幅下降？', o: ['Dencun（2024）', 'Shapella（2023）', 'London（2021）', 'The Merge（2022）'], a: 0, why: '解析：EIP-4844 在 Dencun 上线。Shapella 开放提款，London 引入 EIP-1559，The Merge 切换到 PoS。' },
  { q: '你要验证某地址在某个旧区块的余额，而不想信任 RPC 服务商。最合适的方法是？', o: ['相信区块浏览器的截图', '调用 eth_getBalance 并相信结果', '用 eth_getProof 拿到默克尔证明，用可信区块头中的 stateRoot 验证', '查询交易池'], a: 2, why: '解析：默克尔证明 + 可信 stateRoot 可以独立验证。截图和直接返回值都需要信任对方；交易池里没有余额信息。' }
])}
${exercises([["计算题（示例）：一个区块在 epoch N 的第 20 个 slot（索引 19）产生。按文中“等两个后续 epoch 结束”的最坏模型，它最多要等多久才被最终确定？", "<p>epoch N 还剩 32 − 20 = 12 个 slot，即 12 × 12 = 144 秒。</p><p>epoch N+1 结束再加 384 秒，累计 528 秒。epoch N+2 结束再加 384 秒，累计 <strong>912 秒，约 15.2 分钟</strong>。</p><p>区块在 epoch 里越靠后产生，等待时间越短。实践中可以用 <code>eth_getBlockByNumber(\"finalized\")</code> 直接判断。</p>"], ["思考题：某执行客户端的验证者占比从 25% 涨到 40%，然后它出了一个让节点投错票的 bug。两种占比下，网络的后果有什么不同？", "<p>占比 25%（小于 1/3）时，只有使用它的验证者离线或投错票，损失少量奖励，网络照常最终确定。</p><p>占比 40%（在 1/3 到 2/3 之间）时，网络无法最终确定。不活跃泄漏开始，离线一方的质押被逐步扣减。</p><p>所以运行验证者时，应优先选择占比低于 1/3 的少数派客户端。</p>"], ["动手题：某 ERC-20 合约的 balances 映射位于槽位 3。写出读取某地址余额的槽位计算方法，并说明怎样在不信任 RPC 服务商的情况下验证这个值。", "<p>槽位 = <code>keccak256(左填充 32 字节的地址 ++ 左填充 32 字节的 3)</code>。用这个键调用 <code>eth_getStorageAt</code>（或 go-ethereum 的 <code>StorageAt</code>）即可读出余额。</p><p>要独立验证，就调用 <code>eth_getProof</code> 拿到默克尔证明，再用可信区块头里的 <code>stateRoot</code> 逐层校验：状态树到账户的 <code>storageRoot</code>，再到存储槽。</p>"]])}
${checklist(["能画出执行层、共识层、验证者客户端的分工，并说出 Engine API 的三个核心方法。", "能说出客户端占比小于 1/3、1/3 到 2/3、大于 2/3 时出 bug 的不同后果。", "能写出 mapping 键的存储槽位计算方法，并读出对应的值。", "做过对比 latest 和 finalized 区块号的查询，并能解释两者的差值。", "能按时间顺序列出 Merge、Shapella、Dencun、Pectra、Fusaka 的关键变化。"])}
${terms([
  ['执行层', 'Execution Layer', '负责执行交易、维护状态、提供 JSON-RPC 的以太坊客户端层'],
  ['共识层', 'Consensus Layer', '运行 PoS、分叉选择与最终性的客户端层（信标链）'],
  ['Engine API', 'Engine API', '共识层驱动执行层验证和构建区块的鉴权接口'],
  ['客户端多样性', 'Client Diversity', '让多个独立实现分担网络，避免单一 bug 影响全网'],
  ['世界状态', 'World State', '地址到账户数据的全局映射'],
  ['默克尔帕特里夏树', 'Merkle Patricia Trie', '以太坊用来组织状态并生成根哈希的数据结构'],
  ['提议者', 'Proposer', '在某个 slot 被选中提出区块的验证者'],
  ['构建者', 'Builder', '专门排列交易、构建高收益区块并向提议者出价的角色'],
  ['MEV-Boost', 'MEV-Boost', '让提议者从中继获取构建者区块的开源中间件']
])}
` });

CUR = 'm05-3';
addCh({ id: 'm05-3', nav: 'PoS 深入', title: 'M04.3 PoS 深入：验证者的一生、奖惩与质押方式', desc: '成为验证者、履职、被罚没、退出提款，以及各种质押方式的风险', html: `
<h1>M04.3 PoS 深入：验证者的一生、奖惩与质押方式</h1>
${meta(['走完验证者的完整生命周期：存款、激活、履职、退出、提款。', '计算奖励与惩罚，识别会被罚没的行为，解释不活跃泄漏。', '比较独立质押、质押池、流动性质押、再质押的收益与风险，并设计防双签的运维方案。'], '<a href="#m05-2">M04.2 以太坊架构</a>', ['finality'])}
${beginner(`<p><strong>质押（Staking）</strong>：把 ETH 锁进协议作为保证金，换取出块和投票的资格。作恶会被扣钱。</p>
<p><strong>证明（Attestation）</strong>：验证者对“哪个区块是链头、哪个检查点有效”的签名投票。</p>
<p><strong>检查点（Checkpoint）</strong>：每个 epoch 的第一个 slot 对应的区块，最终性以检查点为单位推进。</p>
<p><strong>罚没（Slashing）</strong>：验证者签了互相矛盾的消息，协议强制扣除部分质押并把它踢出。</p>
<p><strong>有效余额（Effective Balance）</strong>：协议计算奖励和投票权重使用的余额，按整数 ETH 取值，变化有缓冲。</p>`)}

<h2>1. 一句话理解</h2>
${one('PoS 用押金代替算力：诚实干活赚奖励，偷懒小罚，作恶重罚。最终性的安全来自“推翻它要烧掉至少 1/3 的押金”。')}
${call('analogy', `<p>验证者像缴了保证金的陪审员。每轮案件（slot）随机选一位起草判决（提议），其他人在规定时间内投票（证明）。按时投票有津贴；缺席扣一点津贴；同一案件签两份相反的判决书，保证金被没收，并被永久除名。</p>
<p>类比的局限：陪审员可以解释理由；协议只看签名。即使你是因为运维失误（同一把密钥跑在两台机器上）签了两份，也会被罚没。</p>`)}
${art('一图看懂：验证者押 32 ETH，按时干活有奖励，缺席小罚，作恶重罚', 660, 352, [
  S.text(105, 32, '你的验证者', { size: 13, b: 1, anchor: 'middle' }),
  S.text(330, 32, '做了什么', { size: 13, b: 1, anchor: 'middle' }),
  S.text(555, 32, '协议怎么处理（示例）', { size: 13, b: 1, anchor: 'middle' }),
  S.box(10, 46, 190, 254, { k: 'key', icon: 'person', t: '验证者', s: '押金 32 ETH\n签名密钥\n提款凭证 0x01\n\n每 epoch 证明 1 次\n随机被选中提议区块', ss: 12.5 }),
  S.box(235, 46, 190, 70, { k: 'ok', icon: 'check', t: '按时证明、提议', s: '投三票：source target head' }),
  S.box(235, 146, 190, 70, { k: 'warn', icon: 'clock', t: '离线缺席', s: '没投出 source target 票' }),
  S.box(235, 246, 190, 54, { k: 'risk', icon: 'warn', t: '签两份矛盾消息', s: '双重提议 双重投票 环绕投票', ss: 11.5 }),
  S.box(460, 46, 190, 70, { k: 'ok', t: '领奖励', s: '共识 + 执行层收入\n年化约 3%', mono: 0 }),
  S.box(460, 146, 190, 70, { k: 'warn', t: '小额惩罚', s: '约等于少拿的那份奖励\n网络正常时代价很小' }),
  S.box(460, 246, 190, 54, { k: 'risk', t: '罚没并踢出', s: '约 36 天后强制退出', ss: 11.5 }),
  S.arrow(202, 81, 233, 81),
  S.arrow(202, 181, 233, 181),
  S.arrow(202, 273, 233, 273),
  S.arrow(427, 81, 458, 81),
  S.arrow(427, 181, 458, 181),
  S.arrow(427, 273, 458, 273),
  S.text(330, 334, '偶尔离线几乎不亏；只有协同作恶才会被罚到几乎全部押金', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '左边是你押下的东西，中间是你做的事，右边是协议的反应；三行从上到下由好到坏。'],
  ['key', '罚没不需要恶意，运维失误也算：同一把密钥在两台机器上同时运行就会双签。'],
  ['limit', '押金只管诚实投票，不管运维是否可靠：丢了防罚没数据库同样会被罚。'],
  ['risk', '数字是示例：年化约 3%，小额惩罚随时间和网络状态变化；罚没金额取决于同期被罚的总质押。']
], '验证者押 32 ETH，按时履职获得奖励，离线缺席受到小额惩罚，签署矛盾消息则被罚没并强制退出', 'm05-3')}

${recall('<p><a href="#m01-3">M01.3 共识机制</a> 第 4 节已经讲过 PoS 的骨架：12 秒一个 slot、32 个 slot 一个 epoch、LMD-GHOST 选链头、Casper FFG 约 2 个 epoch 最终确定、罚没条件。本篇从“一个验证者”的视角往下讲：它怎样加入、每天做什么、怎样拿奖励和受罚、怎样退出。</p>')}
<h2>2. 验证者的一生</h2>
${mm('验证者生命周期状态机', `
stateDiagram-v2
  state "存款已提交" as Deposited
  state "激活排队" as Pending
  state "在线履职" as Active
  state "已被罚没" as Slashed
  state "退出排队" as Exiting
  state "已退出 等待可提款" as Exited
  state "已提款" as Withdrawn
  [*] --> Deposited: 向存款合约转入 ≥ 32 ETH
  Deposited --> Pending: 共识层处理存款
  Pending --> Active: 轮到激活名额
  Active --> Exiting: 自愿退出 或 余额过低
  Active --> Slashed: 双重提议 或 双重投票 或 环绕投票
  Slashed --> Exited: 约 36 天后强制退出
  Exiting --> Exited: 轮到退出名额
  Exited --> Withdrawn: 约 27 小时后 提款扫描转出
  Withdrawn --> [*]
`, [
  ['flow', '存款 → 排队 → 履职 → 退出 → 提款。激活和退出都要排队，速度受“流失上限（churn limit）”控制。'],
  ['key', '排队的目的：限制验证者集合的变化速度，让攻击者无法在短时间内大量进出、绕开罚没。'],
  ['fail', '在排队期间你的 ETH 不产生奖励，也不能取回。市场剧烈波动时，退出队列可能长达数周。'],
  ['risk', '被罚没后，验证者要等约 36 天才能退出。这期间还会叠加“相关性罚金”，同时期被罚的人越多，罚得越重。']
])}
<h3>2.1 存款与激活</h3>
${steps(['用 staking-deposit-cli（以太坊基金会提供）或其他工具离线生成验证者密钥和存款数据 deposit_data.json。', '在存款合约 <code>0x00000000219ab540356cBB839Cbe05303d7705Fa</code> 中存入 32 ETH（通过官方 Launchpad 网页操作，避免钓鱼网站）。', '共识层读取存款事件。Pectra（EIP-6110）之后，存款直接从执行层区块中读取，等待时间从约 12 小时缩短到约十几分钟到几十分钟（主要等存款所在区块最终确定）。', '进入激活队列。Pectra 之后流失上限按 ETH 计算（示例：每个 epoch 最多激活约 256 ETH 的质押）。', '激活后，验证者开始被分配职责。'])}
${call('info', `<p><strong>提款凭证（Withdrawal Credentials）</strong> 决定提款去哪里：<code>0x00</code> 是旧式 BLS 凭证（必须先转换才能提款）；<code>0x01</code> 指向一个执行层地址；<code>0x02</code>（Pectra 引入）是“复利型”，有效余额可以在 32 到 2,048 ETH 之间自动增长。凭证设定后只能升级，不能改到别的地址。生成密钥时务必核对提款地址。</p>`)}
<h3>2.2 三项职责</h3>
${tbl(['职责', '频率', '内容', '奖励权重（满分 64）'], [
  ['证明（Attestation）', '每个 epoch 一次', '投三票：源检查点（source）、目标检查点（target）、链头（head）', 'source 14 · target 26 · head 14'],
  ['提议（Proposal）', '随机，概率 ∝ 有效余额', '提出一个区块，打包证明和交易', '8（另得执行层小费与 MEV）'],
  ['同步委员会（Sync Committee）', '512 人，每 256 个 epoch（约 27 小时）轮换', '每个 slot 签名链头，供轻客户端使用', '2（被选中期间收入很高）']
])}
<p>验证者被分成多个委员会，每个 slot 一个委员会投票，部分成员被选为<strong>聚合者（Aggregator）</strong>，把同票的 BLS 签名合成一个，减少网络负担。</p>

<h2>3. 奖励、惩罚与罚没</h2>
<h3>3.1 奖励从哪来</h3>
<p>共识层奖励由协议新发行。基础奖励与 <code>有效余额 / √(全网总质押)</code> 成正比，所以全网质押越多，每个验证者的年化越低。执行层收入来自交易小费和 MEV，由提议者获得。</p>
<p><strong>算一算（示例）</strong>：假设全网质押 3,400 万 ETH，共识层年化约 2.8%。</p>
${steps(['单个 32 ETH 验证者一年共识层收入：32 × 2.8% ≈ 0.90 ETH。', '全网约 106 万个验证者（3,400 万 ÷ 32），每年约 262 万个 slot（365 × 24 × 3600 ÷ 12）。每个验证者平均每年提议约 262 万 ÷ 106 万 ≈ 2.5 个区块。', '假设每个区块的小费 + MEV 平均 0.05 ETH，执行层年收入约 2.5 × 0.05 = 0.125 ETH。', '合计约 1.03 ETH，年化约 3.2%。注意：提议次数服从随机分布，小型质押者某一年可能一个块都没出。'])}
<h3>3.2 惩罚（不是罚没）</h3>
<p>错过证明：扣掉大约等于“本该得到”的 source 和 target 奖励（head 投票错过不扣）。所以离线一天的损失约等于一天的收入。<strong>只要网络正常最终确定，偶尔离线的代价很小</strong>，不要为了 100% 在线去冒双签风险。</p>
<h3>3.3 罚没条件</h3>
${tbl(['罚没行为', '定义', '典型原因'], [
  ['双重提议（Double Proposal）', '同一个 slot 签名两个不同的区块', '同一把密钥同时跑在主备两台机器上'],
  ['双重投票（Double Vote）', '对同一个目标 epoch 签名两个不同的证明', '同上；或迁移时没有导入防罚没数据库'],
  ['环绕投票（Surround Vote）', '一次投票的 source→target 区间完全包住另一次投票的区间', '客户端 bug；或多数派客户端确认错误链后试图切回']
])}
${mm('环绕投票：为什么它等于“说谎”', `
flowchart LR
  V1["投票 1<br/>source = 2 · target = 3"] --> X{"区间 2→3<br/>被区间 1→4 包住"}
  V2["投票 2<br/>source = 1 · target = 4"] --> X
  X --> R["矛盾：投票 2 说 1 到 4 之间没有新的已证明检查点<br/>投票 1 说 2 和 3 是连续证明"]
  R --> SL["罚没：任何人提交两条签名作为证据"]
  SL --> W["举报者获得少量奖励"]
`, [
  ['flow', '任何节点发现同一验证者的两条矛盾签名，都可以打包成罚没证据提交到链上。'],
  ['key', 'Casper FFG 的安全证明依赖这两条规则：要最终确定两条冲突的链，至少 1/3 质押必须违反其中一条，因而可被罚没。'],
  ['fail', '防罚没数据库（slashing protection DB）记录你签过的每个 source/target。丢失或没迁移它，换机器后就可能签出矛盾消息。'],
  ['risk', '罚没不需要恶意。2021 年以来的大多数罚没事件，都来自运维失误，例如主备同时在线、同一密钥跑在两个客户端里。' + cite('Consensys：理解以太坊质押中的罚没', 'https://consensys.com/blog/understanding-slashing-in-ethereum-staking-its-importance-and-consequences')]
])}
<p><strong>罚没的三部分代价</strong>（Pectra 之后的参数）：</p>
${steps(['<strong>初始罚金</strong>：有效余额的 1/4,096。32 ETH 约 0.0078 ETH。', '<strong>相关性罚金</strong>：在罚没后第 18 天左右扣除，金额 ≈ 有效余额 × min(1, 3 × 前后 36 天内被罚没的总质押 ÷ 全网质押)。', '<strong>强制退出</strong>：约 36 天内持续扣除证明惩罚，然后被踢出，永远不能用这把密钥重新加入。'])}
<p><strong>算一算（示例）</strong>：全网质押 3,400 万 ETH。</p>
${steps(['你单独因为主备双开被罚没：相关性罚金 ≈ 32 × 3 × 32 ÷ 34,000,000 ≈ 0.00009 ETH，几乎为 0。总损失主要是 36 天的离线惩罚，约 0.1 ETH。', '一家质押服务商的 34 万 ETH（1%）同时被罚：32 × 3 × 1% = 0.96 ETH，每个验证者损失约 1 ETH。', '1/3 质押同时被罚（协同攻击）：3 × 1/3 = 1，每个验证者的有效余额被全部扣光。', '结论：罚没设计惩罚的是“协同作恶”，而不是孤立事故。这也是不要把验证者集中在同一服务商、同一客户端的原因。'])}

<h2>4. 不活跃泄漏：网络如何自救</h2>
<p>如果连续超过 4 个 epoch 无法最终确定，协议进入<strong>不活跃泄漏（Inactivity Leak）</strong>：</p>
${steps(['每个没有正确投出 target 票的验证者，“不活跃分数”逐 epoch 增加。', '扣罚金额与“不活跃分数 × 有效余额”成正比，所以离线越久，扣得越快（随时间近似二次增长）。', '在线验证者在泄漏期间不得奖励，但也不被扣。', '离线一方的质押占比不断下降，直到在线质押重新超过 2/3，网络恢复最终确定，泄漏停止。'])}
<p>先做实验：把离线比例设为 45%，点“自动运行”，观察在线质押占比曲线如何爬过 2/3 门槛。再把作恶比例设为 34%、离线设为 0，观察 1/3 少数派如何阻止最终性。实验中的泄漏速度为教学示例，真实协议更慢（需要数天到数周）。</p>
${lab('finality')}
${call('deep', `<p>为什么需要泄漏？假设网络分裂成两半，各 50%。没有泄漏，两边都永远无法最终确定。有了泄漏，每一边都在扣“另一边”的质押，几周后各自恢复最终确定——此时可能出现两条都被最终确定的链，需要社会层协调。这就是 PoS 选择“可用性优先、最终性靠泄漏恢复”的代价。</p>`)}

<h2>5. 退出与提款</h2>
${tbl(['类型', '触发方式', '到账'], [
  ['部分提款（自动）', '0x01 凭证：余额超过 32 ETH 的部分；0x02 凭证：超过 2,048 ETH 的部分', '协议按验证者索引循环扫描，每个区块最多处理 16 笔，全网一轮约数天'],
  ['全额提款', '先自愿退出（验证者密钥签名 VoluntaryExit；Pectra 后也可由提款地址通过 EIP-7002 触发）', '退出队列 + 约 256 个 epoch（约 27 小时）后进入扫描'],
  ['被罚没退出', '协议强制', '约 36 天后可提款']
])}

<h2>6. 质押方式与风险</h2>
${mm('四种质押方式的资金与信任路径', `
flowchart TB
  ETH["你的 ETH"] --> SOLO["独立质押<br/>自己跑节点 32 ETH 起"]
  ETH --> POOL["去中心化质押池<br/>例如 Rocket Pool 节点运营者"]
  ETH --> LST["流动性质押<br/>例如 Lido 存 ETH 得 stETH"]
  ETH --> CEX["交易所质押<br/>托管型"]
  LST --> DEFI["stETH 进入 DeFi<br/>抵押 借贷 LP"]
  LST --> RS["再质押<br/>例如 EigenLayer"]
  SOLO --> RS
  RS --> AVS["为其他服务 AVS 提供安全<br/>额外收益 + 额外罚没条件"]
`, [
  ['flow', '越往下，收益来源越多，同时叠加的信任方和合约越多。'],
  ['risk', '流动性质押代币（LST）在二级市场可能折价。2022 年 6 月提款尚未开放时，stETH 一度跌到约 0.93–0.94 ETH（折价约 6%–7%，各方数据略有差异），加杠杆的仓位被清算。' + cite('CoinShares：Lido stETH 脱锚分析（2022-06）', 'https://coinshares.com/corp/insights/research-data/is-the-decoupling-of-lidos-staked-eth-another-stablecoin-collapse/')],
  ['risk', '再质押把同一份质押暴露给多套罚没规则。一个 AVS 的 bug 可能导致你的 ETH 被罚没。'],
  ['key', '单一协议控制超过 1/3 质押，可以阻止最终性；超过 2/3 可以最终确定任意链。质押集中度是以太坊的系统性风险。']
])}
${tbl(['方式', '门槛', '你持有密钥？', '主要风险', '适合谁'], [
  ['独立质押（Solo）', '32 ETH + 硬件 + 运维能力', '签名密钥和提款都由你控制', '运维失误、罚没、离线', '技术能力强、追求去中心化'],
  ['质押即服务（SaaS）', '32 ETH', '提款地址是你的，签名密钥在服务商', '服务商作恶或失误导致罚没', '有 ETH 但不想运维的机构'],
  ['去中心化质押池', '少量 ETH 即可（存入获得 rETH 等）；节点运营者需更少押金', '否', '合约漏洞、运营者表现', '小额用户'],
  ['流动性质押（Lido 等）', '任意金额，得到 stETH / wstETH', '否', '合约漏洞、折价、治理集中', '需要流动性、参与 DeFi'],
  ['再质押（EigenLayer 等）', '原生 ETH 或 LST', '视方式而定', '额外罚没条件、合约复杂度、流动性', '能评估 AVS 风险的用户'],
  ['交易所质押', '任意金额', '否（托管）', '交易所倒闭、冻结、监管', '只用交易所的普通用户']
])}
${call('info', `<p>stETH 是“余额自动增长（rebasing）”代币：你的余额每天变多。很多 DeFi 协议无法正确处理变化的余额，所以常用 wstETH（包装后余额不变，兑换比例上升）。集成时要看清楚协议用的是哪一种。</p>`)}

<h3>6.1 LST 的记账：shares 与兑换率</h3>
<p>流动性质押代币（LST）要回答一个问题：<strong>奖励怎么分给持有人？</strong>以 Lido 的 stETH 为例，合约内部不直接记“你有多少 stETH”，而是记<strong>份额（shares）</strong>。你的 stETH 余额是用份额按当前比例换算出来的：</p>
${one('stETH 余额 = 你的 shares × 池内 ETH 总量 ÷ 全部 shares')}
<p>预言机每天把共识层的验证者余额汇报给合约，“池内 ETH 总量”随之变化，所有持有人的 stETH 余额同时变化（rebase）。奖励为负时（例如罚没或离线），余额也可能下降。wstETH 是为 DeFi 准备的包装版：它的数量等于 shares 的数量，<strong>余额不变，单价上升</strong>。</p>
${mm('stETH 与 wstETH 怎么反映奖励', `
flowchart LR
  A["用户存入 ETH"] --> B["Lido 池：总 ETH 与总 shares"]
  B --> C["按当前比例铸造 shares<br/>stETH 余额由 shares 换算"]
  D["预言机每日汇报共识层余额"] --> E["池内 ETH 总量变化"]
  E --> C
  C -->|"wrap"| F["wstETH：数量等于 shares<br/>余额不变"]
  F --> G["stEthPerToken 上升<br/>单个 wstETH 能换更多 stETH"]
`, [
  ['flow', '奖励只改变“池内 ETH 总量”，不改变 shares。stETH 余额跟着变；wstETH 余额不变，兑换率变。'],
  ['fail', '协议把 stETH 余额当成固定数值记账，一天后余额变了，账与实际不符。用 wstETH，或每次读取最新兑换。'],
  ['risk', '协议内的兑换率不等于市场价格。stETH 在二级市场可能折价（见上文 2022 年的例子），用它做抵押时，估值要用带折价的市场价预言机。'],
  ['key', '处理 LST 时先问：它是 rebase（余额变）还是 wrapped（余额不变、汇率变）。']
])}
<p><strong>算一算（示例）：</strong>池里共有 1,000,000 shares，对应 1,000,000 ETH，即 1 share = 1 ETH。Alice 持有 100 shares，也就是 100 stETH。</p>
${steps([
  '一天后，奖励让池内 ETH 总量变成 1,000,100（示例，日增 0.01%），shares 总数不变。',
  'Alice 的 stETH 余额 = 100 × 1,000,100 ÷ 1,000,000 = 100.01 stETH，凭空多了 0.01，这就是 rebase。',
  '如果 Alice 把 100 stETH 包装成 wstETH，她得到 100 wstETH（数量等于 shares）。一天后她仍有 100 wstETH，但 stEthPerToken 变成 1.0001，价值 100 × 1.0001 = 100.01 stETH。'
])}
${code('SOLIDITY', `
interface IWstETH {
    function balanceOf(address) external view returns (uint256);
    function stEthPerToken() external view returns (uint256);          // 每个 wstETH 对应多少 stETH，18 位精度
}

// 估算某用户持有的 wstETH 相当于多少 stETH（1 stETH 约 1 ETH 只是协议内兑换率，不是市场价）
function wstValueInStEth(IWstETH wst, address user) external view returns (uint256) {
    return wst.balanceOf(user) * wst.stEthPerToken() / 1e18;           // 先乘后除，保留精度
}
`)}
<p>取回队列、折价、LST 作抵押品以及再质押的风险层，见 <a href="#m02-63">M08.4 流动性质押与再质押</a>。</p>
<h3>6.2 再质押：角色、委托与提款延迟</h3>
<p>再质押（Restaking）让同一份质押资产为多个服务提供安全。以 EigenLayer 为例，涉及三个角色：</p>
${tbl(['角色', '做什么', '承担什么风险'], [
  ['再质押者（Restaker）', '把原生 ETH 或 LST 存入 EigenLayer，并<strong>委托</strong>给一个运营者', '被委托的运营者作恶或失误时，委托给他的那部分资产可能被罚没'],
  ['运营者（Operator）', '运行节点，选择为哪些 AVS 提供服务', '违反某个 AVS 的规则会被该 AVS 罚没'],
  ['AVS（主动验证服务）', '需要“经济安全”的链下或链上服务，例如数据可用性、预言机、跨链验证', '自己制定规则、自己写罚没合约；设计不当会连累所有参与者']
])}
${mm('再质押的资金与权力路径', `
flowchart TB
  R["再质押者<br/>存入 ETH 或 LST"] --> M["EigenLayer 合约<br/>记录存款与委托"]
  R -->|"委托（不转移托管）"| O["运营者"]
  O -->|"选择加入"| V1["AVS 甲"]
  O -->|"选择加入"| V2["AVS 乙"]
  V1 -->|"违反规则"| S["罚没：扣减运营者及其委托者的质押"]
  R -->|"提款：先排队，等待延迟期"| W["取回资产"]
`, [
  ['flow', '委托只转移“投票和履约的权力”，不转移资产的所有权。资产仍在 EigenLayer 的合约里。'],
  ['risk', '风险叠加：Lido 的合约风险 + EigenLayer 的合约风险 + 运营者风险 + 每个 AVS 的罚没规则风险。'],
  ['fail', '提款不是立即到账：需要先发起排队，等待延迟期结束，目的是让 AVS 有时间应对安全性下降。'],
  ['limit', '具体的罚没规则、延迟期长度等参数由协议和各 AVS 决定，并会随升级变化，以官方文档为准。']
])}
${exq([
  ['为什么用 wstETH 做 DeFi 抵押，通常比用 stETH 更容易集成？', '<p>stETH 的余额会每天变化，协议记下的数字会和实际不符。wstETH 的余额不变，奖励体现在兑换率上，协议只需要在需要估值时读一次兑换率。</p>'],
  ['同一份 ETH 先质押到 Lido，再把 stETH 再质押，风险是简单相加吗？', '<p>不是简单相加，而是<strong>叠加</strong>：任何一层出问题，都可能让你损失本金；而且各层的罚没、折价、提款延迟会相互放大，在市场恐慌时尤其明显。</p>']
])}
<p class="muted small">资料来源：<a href="https://docs.lido.fi/guides/lido-tokens-integration-guide/" target="_blank" rel="noopener noreferrer">Lido 代币集成指南</a>、<a href="https://docs.lido.fi/contracts/wsteth" target="_blank" rel="noopener noreferrer">Lido wstETH 文档</a>、<a href="https://docs.eigencloud.xyz/eigenlayer/restakers/concepts/overview" target="_blank" rel="noopener noreferrer">EigenLayer 再质押概览</a>。协议参数会变化，请以官方文档为准。</p>

<h2>7. 验证者运维：工程实战</h2>
${steps(['<strong>客户端</strong>：执行层 + 共识层 + 验证者客户端；优先少数派组合。硬件示例：8 核 CPU、32 GB 内存、4 TB NVMe SSD、25 Mbps 以上稳定带宽。', '<strong>密钥分离</strong>：签名密钥在线（热），提款地址用硬件钱包或多签（冷）。助记词离线保存，永不上服务器。', '<strong>防双签</strong>：同一时刻只允许一个实例持有签名密钥；开启 doppelganger 检测（启动后先观察 2–3 个 epoch，确认网络上没有同一密钥在签名）；迁移时导出并导入 EIP-3076 格式的防罚没数据。', '<strong>远程签名器</strong>：用 Web3Signer 集中保管密钥并内置防罚没数据库，验证者客户端只发签名请求。', '<strong>分布式验证者（DVT）</strong>：Obol、SSV 等方案把一把验证者密钥拆成门限分片，由多个运营者共同签名，单机宕机不离线，单个运营者也无法双签。', '<strong>监控与告警</strong>：同步状态、对等节点数、证明命中率、错过的提议、余额变化、磁盘剩余。'])}
<p>验证者客户端内部的防罚没检查逻辑可以概括为下面的 Go 代码（简化示例，生产请使用客户端自带实现）：</p>
${code('GO', `
package slashprot

import (
	"errors"
	"sync"
)

// 每个验证者公钥签过的证明记录（来自本地数据库）
type Att struct{ Source, Target uint64 }

type DB struct {
	mu   sync.Mutex
	atts map[string][]Att    // pubkey -> 已签证明
	prop map[string]uint64   // pubkey -> 已签提议的最高 slot
}

var ErrSlashable = errors.New("拒绝签名：会被罚没")

// CheckAndRecordAttestation：先检查，再落盘，最后才允许签名
func (d *DB) CheckAndRecordAttestation(pk string, a Att) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	for _, old := range d.atts[pk] {
		if old.Target == a.Target {
			return ErrSlashable // 双重投票：同一 target epoch 签第二次
		}
		if old.Source < a.Source && a.Target < old.Target {
			return ErrSlashable // 新投票被旧投票环绕
		}
		if a.Source < old.Source && old.Target < a.Target {
			return ErrSlashable // 新投票环绕旧投票
		}
	}
	d.atts[pk] = append(d.atts[pk], a) // 生产中必须 fsync 到磁盘后再签名
	return nil
}

func (d *DB) CheckAndRecordProposal(pk string, slot uint64) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	if last, ok := d.prop[pk]; ok && slot <= last {
		return ErrSlashable // 同一 slot 或更早的 slot 不再签提议
	}
	d.prop[pk] = slot
	return nil
}
`)}
<p>Prometheus 告警规则示例（指标名以你使用的客户端为准，这里用通用命名）：</p>
${code('BASH', `
# prometheus-rules.yml（示例）
groups:
- name: validator
  rules:
  - alert: BeaconNotSynced
    expr: beacon_head_slot_lag > 4          # 落后超过 4 个 slot
    for: 5m
  - alert: LowPeers
    expr: libp2p_peers < 20
    for: 10m
  - alert: AttestationMissRate
    expr: rate(validator_attestation_missed_total[1h]) / rate(validator_attestation_total[1h]) > 0.05
    for: 30m
  - alert: DiskAlmostFull
    expr: node_filesystem_avail_bytes{mountpoint="/data"} / node_filesystem_size_bytes{mountpoint="/data"} < 0.15
    for: 15m
`)}
${tryit(`<p>在 beaconcha.in（以太坊信标链浏览器）上查看一个真实验证者：</p>
<ol><li>打开 beaconcha.in，在首页随便点开一个最近的 slot，再点击它的提议者索引号。</li>
<li>记录该验证者的状态（Active）、有效余额、提款凭证前缀（0x01 或 0x02）。</li>
<li>打开 “Attestations” 标签，找出是否有错过（Missed）的证明。</li>
<li>在站内的 “Slashings” 页面查看最近的罚没事件，判断是双重提议还是证明违规。</li></ol>
<p>预期结果：你能读懂验证者页面上的每个字段，并说明罚没事件属于哪一类。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['同一签名密钥只在一个实例运行', '主备同时在线是罚没的首要原因', '部署脚本加互斥锁；开启 doppelganger 检测并查看启动日志'],
  ['防罚没数据库随密钥一起迁移', '缺失历史记录会签出矛盾投票', '迁移流程中强制导出 / 导入 EIP-3076 JSON'],
  ['提款地址为冷钱包或多签', '签名密钥泄露时资金仍安全', '在浏览器核对提款凭证指向的地址'],
  ['使用少数派客户端', '多数派 bug 时避免一起被罚', '对照客户端分布统计'],
  ['证明命中率告警', '持续离线会累积惩罚', 'Prometheus 告警阈值例如漏签率 > 5% 持续 30 分钟'],
  ['评估 LST 与再质押的合约风险', '折价和额外罚没会造成损失', '阅读审计报告与 AVS 罚没条件，设置持仓上限']
])}

${mistakes([
  ['为了 100% 在线，应该同时跑主备两个验证者实例。', '主备同时在线会双签被罚没。偶尔离线只损失少量奖励，远比罚没便宜。'],
  ['被罚没就会失去全部 32 ETH。', '孤立事故的罚没损失通常很小；只有大量验证者同时被罚，相关性罚金才会扣光余额。'],
  ['质押的 ETH 随时可以取回。', '退出要排队，之后还有约 27 小时的延迟；罚没后要等约 36 天。'],
  ['stETH 永远等于 1 ETH。', 'stETH 在二级市场可能折价，2022 年 6 月曾折价约 6%–7%。' + cite('CoinShares：Lido stETH 脱锚分析（2022-06）', 'https://coinshares.com/corp/insights/research-data/is-the-decoupling-of-lidos-staked-eth-another-stablecoin-collapse/') + '赎回要走协议的退出队列。'],
  ['再质押是“免费”的额外收益。', '再质押给你的 ETH 增加了额外的罚没条件和合约风险。']
])}
${recap(['成为验证者：存款合约存入 32 ETH，排队激活；Pectra 后有效余额上限可达 2,048 ETH（0x02 凭证）。', '职责是证明（每 epoch）、提议（随机）、同步委员会（轮换）；奖励与 1/√总质押成正比。', '罚没三种行为：双重提议、双重投票、环绕投票；相关性罚金惩罚协同作恶。', '无法最终确定超过 4 个 epoch 时启动不活跃泄漏，扣减离线者质押直至在线超过 2/3。', '质押方式越“方便”，叠加的信任方和合约越多；再质押增加额外罚没风险。', '运维核心是防双签：单实例、doppelganger 检测、防罚没数据库、远程签名器或 DVT。'])}
${quiz([
  { q: '以下哪种行为会被罚没？', o: ['验证者离线 3 天', '同一个 slot 签名了两个不同的区块', '错过了链头（head）投票', '提款到了交易所地址'], a: 1, why: '解析：双重提议是罚没条件。离线只会被普通惩罚；错过 head 投票不扣钱；提款地址与罚没无关。' },
  { q: '全网有 1/3 质押在同一时期被罚没，单个被罚验证者的相关性罚金大约是？', o: ['几乎为 0', '约 1 ETH', '约 1/3 有效余额', '全部有效余额'], a: 3, why: '解析：相关性罚金 ≈ 有效余额 × min(1, 3 × 1/3) = 全部。孤立事故才几乎为 0。' },
  { q: '不活跃泄漏的作用是？', o: ['在线质押不足 2/3 时，逐步扣减不投票者的质押，让网络恢复最终确定', '奖励一直在线的验证者', '增加 ETH 发行量', '惩罚双重投票'], a: 0, why: '解析：泄漏只在无法最终确定时启动，目的是恢复 2/3 在线比例。它不额外奖励在线者，也和罚没是两套机制。' },
  { q: '运维团队要把验证者从机器 A 迁移到机器 B。最安全的做法是？', o: ['先在 B 上启动，确认正常后再关 A', 'A 和 B 同时运行一天做对比', '先停 A 并确认停止，导出防罚没数据导入 B，等待至少 2 个 epoch 后在 B 启动并开启 doppelganger 检测', '直接复制密钥文件到 B 并启动'], a: 2, why: '解析：任何时刻只能有一个实例签名，且历史签名记录必须迁移。前两项会造成双签；直接复制缺少防罚没数据。' },
  { q: '为什么 Lido 等协议的质押占比被社区密切关注？', o: ['因为占比高会导致 ETH 增发', '因为单一协议超过 1/3 可阻止最终性，超过 2/3 可最终确定任意链', '因为它会让 Gas 上涨', '因为占比高会让 stETH 不能转账'], a: 1, why: '解析：质押集中会放大单点的治理与运维风险。与增发、Gas、转账功能无直接关系。' }
])}
${checklist([
  '能用 shares 公式手算 stETH 余额在奖励前后的变化。',
  '能解释 wstETH 为什么“余额不变、单价上升”，并说出集成时该用哪种。',
  '能说出再质押中三类角色各自承担的风险，以及风险为什么会叠加。'
])}
${terms([
  ['证明', 'Attestation', '验证者对链头和检查点的签名投票'],
  ['检查点', 'Checkpoint', '每个 epoch 第一个 slot 的区块，最终性的推进单位'],
  ['环绕投票', 'Surround Vote', '一次投票的 source-target 区间严格包含另一次投票区间的罚没行为'],
  ['相关性罚金', 'Correlation Penalty', '按同时期被罚没总质押比例计算的额外罚金'],
  ['不活跃泄漏', 'Inactivity Leak', '长期无法最终确定时逐步扣减不投票者质押的机制'],
  ['提款凭证', 'Withdrawal Credentials', '决定验证者资金提取目的地与类型的字段（0x00/0x01/0x02）'],
  ['流动性质押代币', 'Liquid Staking Token', '代表已质押 ETH 并可在 DeFi 中流通的代币，例如 stETH'],
  ['再质押', 'Restaking', '把已质押的 ETH 再次承诺给其他服务以获取额外收益的机制'],
  ['防罚没数据库', 'Slashing Protection DB', '记录已签名消息、阻止签出矛盾消息的本地数据库'],
  ['分布式验证者', 'Distributed Validator Technology', '用门限签名把一个验证者分给多个节点共同运行的技术']
])}
` });
})();
