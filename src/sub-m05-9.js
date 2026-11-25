/* ---------- M04 公链（9）：m05-69 预言机与链下自动化 & m05-70 Solana 生产级工程 ---------- */
(() => {
CUR = 'm05-69';
addCh({ id: 'm05-69', nav: '预言机与链下自动化', title: 'M04.11 预言机与链下自动化工程：Push/Pull、VRF、OEV 与 Keeper', desc: 'Chainlink 推模式与 Pyth/RedStone 拉模式对比、L2 排序器宕机检测、VRF、OEV 与去中心化 Keeper 架构', html: `
<h1>M04.11 预言机与链下自动化工程：Push/Pull、VRF、OEV 与 Keeper</h1>
${meta([
  '对比 Push（Chainlink）与 Pull（Pyth/RedStone）预言机的数据流、延迟、Gas 归属与适用场景。',
  '写出生产级价格校验代码，包含陈旧度检查、负值/零值检查与 L2 排序器宕机宽限期校验。',
  '解释 VRF 可验证随机数与 OEV（预言机可提取价值）的机理及协议截留方案。',
  '设计去中心化 Keeper / Automation 任务，解决链上合约无法自触发与抢跑博弈问题。'
], '前置：<a href="#m05-9">M04.10 数据基础设施</a>、<a href="#m02-8">M02.9 合约安全 II</a>', ['oracle'])}
${beginner(`<p><strong>预言机（Oracle）</strong>：把链外世界的数据（如 ETH/USD 价格、随机数、比赛结果）安全搬运到智能合约里的桥梁。智能合约自己无法发 HTTP 请求。</p>
<p><strong>心跳（Heartbeat）与偏差阈值（Deviation Threshold）</strong>：推模式预言机更新链上价格的两个触发条件——例如“每 1 小时至少更一次，或价格波动超过 0.5% 立刻更新”。</p>
<p><strong>Keeper / Automation</strong>：链上合约像一台不会自己按开关的机器，需要链下机器人定期检查条件并在满足时发交易触发清算、复投或结算。</p>`)}

<h2>1. 一句话理解</h2>
${one('预言机解决“合约看不见链外数据”，Keeper 解决“合约不会自己定闹钟”；生产环境接入预言机绝不是读一个数字那么简单，而是围绕延迟、新鲜度、L2 宕机和价格操纵设计多层校验防线。')}
${call('analogy', `<p>Push 预言机像挂在交易所大厅的电子大屏，运营商定期刷新价格，所有人免费抬头看；Pull 预言机像机场值机柜台的登机牌，价格由签名机构实时签好放在链下，谁要下单交易，谁顺手把最新签名带进合约验真并付一点验签 Gas。</p>
<p>比喻的局限：现实中电子屏坏了大家肉眼能看出来，但合约里如果没写“超过心跳时间就拒绝交易”和“L2 排序器刚恢复要冷静 1 小时”，套利机器人会在第一秒按旧价格搬空协议资金。</p>`)}
${art('一图看懂：Push 推模式 vs Pull 拉模式预言机数据流', 660, 320, [
  S.zone(15, 18, 630, 118, { t: 'Push 推模式（如 Chainlink Price Feeds）', k: 'info' }),
  S.box(30, 48, 150, 70, { k: 'info', icon: 'globe', t: '多家数据源', s: 'CEX / DEX 聚合\n节点网络签名' }),
  S.box(245, 48, 165, 70, { k: 'key', icon: 'db', t: '链上 Feed 合约', s: '超偏差或超心跳\n主动写链（节点付 Gas）' }),
  S.box(475, 48, 155, 70, { k: 'ok', icon: 'code', t: 'DeFi 协议', s: '同步只读\nlatestRoundData()' }),
  S.arrow(182, 83, 243, 83),
  S.arrow(412, 83, 473, 83),
  S.zone(15, 152, 630, 124, { t: 'Pull 拉模式（如 Pyth / RedStone）', k: 'warn' }),
  S.box(30, 184, 150, 74, { k: 'warn', icon: 'server', t: '链下签名网络', s: '亚秒级持续签名\n不上链省 Gas' }),
  S.box(245, 184, 165, 74, { k: 'info', icon: 'person', t: '用户 / 机器人', s: '下单时顺手拉取\n把价格证明塞进 calldata' }),
  S.box(475, 184, 155, 74, { k: 'ok', icon: 'shield', t: '目标合约验签', s: '验签通过即用\n用户付 Gas' }),
  S.arrow(182, 221, 243, 221),
  S.arrow(412, 221, 473, 221),
  S.text(330, 302, '选型核心：低频稳健借贷常用 Push，高频永续/期权多用 Pull；复杂协议常做主备双源', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['flow', 'Push 模式由预言机网络持续为链上更新买单；Pull 模式只在真正成交时由交易发起方顺带把签名价格带上链。'],
  ['key', 'Pull 模式可以实现 400ms 级别高频报价且覆盖上千种长尾资产，因为不交易就不花链上 Gas。'],
  ['risk', '无论 Push 还是 Pull，都必须检查时间戳新鲜度、价格非负，并在 L2 上叠加排序器状态检查。']
], '上方展示 Push 推模式由节点主动更新链上 Feed 合约供 DeFi 同步读取；下方展示 Pull 拉模式由链下持续签名、用户下单时携带价格证明进合约验签', 'm05-69')}

<h2>2. Push、Pull 与链上 TWAP 工程对比</h2>
${tbl(['维度', 'Push 模式（Chainlink 等）', 'Pull 模式（Pyth / RedStone）', '链上 TWAP（Uniswap V3 等）'], [
  ['<strong>更新频率</strong>', '偏差 0.1%–1% 或心跳 1h–24h', '亚秒级链下签发，按需上链', '随区块时间加权平滑更新'],
  ['<strong>Gas 谁承担</strong>', '预言机网络 / 协议赞助', '发起交易的用户或清算机器人；除 Gas 外可能还要付更新费（如 Pyth 先调 <code>getUpdateFee</code>，再随 <code>updatePriceFeeds</code> 附上 ETH），费用规则以各家文档为准', '读取方付少量历史观测槽 Gas'],
  ['<strong>接口侵入性</strong>', '极低（只读 <code>view</code> 函数）', '需改写入口函数接收 <code>bytes[] updateData</code>', '只读，无需额外参数'],
  ['<strong>典型风险</strong>', '网络拥堵时喂价滞后、L2 排序器宕机后陈旧报价', '用户可挑对自己最有利的近期有效签名（需严格限制过期秒数）', '低流动性池子易被多块操纵；剧烈暴跌时滞后严重'],
  ['<strong>最佳场景</strong>', '主流资产借贷、抵押稳定币', '永续合约、期权、高频衍生品与长尾币', '作为主预言机的熔断校验辅助源']
])}
<p>应用见：用即时价格当预言机被闪电贷操纵的攻击推演见 <a href="#m02-8">M02.9 合约安全 II</a>；借贷清算如何依赖喂价见 <a href="#m02-11">M05.3 借贷协议深入</a>；“谁来宣布比赛结果”这类非价格数据的乐观预言机结算见 <a href="#m08-4">M11.4 结算与预言机</a>。</p>

<h2>3. 生产级价格校验与 L2 排序器宕机防线</h2>
<p>在 Arbitrum、Optimism、Base 等 Rollup 上（见 <a href="#m05-5">M04.5 Rollup 深入</a>），如果排序器（Sequencer）宕机 2 小时后突然恢复，恢复瞬间链上价格仍停留在 2 小时前，普通用户还没来得及补仓，机器人就能瞬间以旧价发起清算或无风险套利。因此 L2 协议<strong>必须接入 Sequencer Uptime Feed 并设置恢复后的宽限期（如 3,600 秒）</strong>。</p>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    );
}

contract SafeOracleConsumer {
    AggregatorV3Interface public immutable priceFeed;
    AggregatorV3Interface public immutable sequencerFeed; // L2 排序器状态源
    uint256 public constant MAX_STALENESS = 3600;         // 心跳上限（示例：1 小时）
    uint256 public constant GRACE_PERIOD = 3600;          // 排序器恢复后宽限期（示例：1 小时）
    // 业务合理区间（自己的熔断器）。多数 Chainlink 价格源已不再使用聚合器的 minAnswer/maxAnswer，
    // 不能指望它们兜底，所以在自己的合约里设上下限
    int256 public immutable minPrice;
    int256 public immutable maxPrice;

    error SequencerDown();
    error SequencerFeedNotReady();
    error GracePeriodNotOver();
    error InvalidPrice();
    error StalePrice();
    error PriceOutOfRange();

    constructor(address _priceFeed, address _sequencerFeed, int256 _minPrice, int256 _maxPrice) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        sequencerFeed = AggregatorV3Interface(_sequencerFeed);
        minPrice = _minPrice;
        maxPrice = _maxPrice;
    }

    function getSafePrice() external view returns (uint256) {
        // 1. 检查 L2 排序器是否在线且已过宽限期
        if (address(sequencerFeed) != address(0)) {
            (, int256 seqStatus, uint256 startedAt,,) = sequencerFeed.latestRoundData();
            // startedAt == 0：状态源还没初始化（官方文档说明只在 Arbitrum 上可能出现）。
            // 不拦住的话，下面 block.timestamp - 0 会远大于宽限期，检查被直接绕过
            if (startedAt == 0) revert SequencerFeedNotReady();
            if (seqStatus != 0) revert SequencerDown(); // 0 = 在线, 1 = 宕机
            if (block.timestamp - startedAt <= GRACE_PERIOD) revert GracePeriodNotOver();
        }
        // 2. 读取价格并做完整防御校验
        // answeredInRound 在官方接口文档中已标为 Deprecated，不再拿它判断过期
        (, int256 answer,, uint256 updatedAt,) = priceFeed.latestRoundData();
        if (answer <= 0) revert InvalidPrice();
        if (updatedAt == 0 || block.timestamp - updatedAt > MAX_STALENESS) revert StalePrice();
        if (answer < minPrice || answer > maxPrice) revert PriceOutOfRange(); // 触发后暂停业务、人工介入
        return uint256(answer);
    }
}
`)}
${call('info', `<p><strong>两处常见旧写法要更新（截至 2026 年 11 月，以 Chainlink 官方文档为准）。</strong>① 很多旧教程用 <code>answeredInRound &lt; roundId</code> 判断过期。官方 API 文档已把 <code>answeredInRound</code> 标为 Deprecated，判断过期要看 <code>updatedAt</code> 与心跳。② 很多旧教程让你比对聚合器的 <code>minAnswer</code>/<code>maxAnswer</code>（LUNA 事件里价格卡在 minAnswer 下限）。官方文档说明这组值在多数价格源上已不再使用。接入前先查你用的价格源是否还设了上下限；没有就像上面一样，在自己的合约里设业务合理区间。来源：docs.chain.link/data-feeds/api-reference、docs.chain.link/data-feeds/l2-sequencer-feeds。</p>`)}
<p>用下面的交互实验调整价格波动、偏差阈值与 L2 排序器恢复时间，观察不同参数下何时会出现套利窗口。</p>
${lab('oracle')}

<h2>4. VRF 可验证随机数与 OEV 预言机价值捕获</h2>
<ul>
<li><strong>VRF（Verifiable Random Function）</strong>：区块链是确定性状态机，绝不能用 <code>block.timestamp</code> 或 <code>blockhash</code> 生成抽奖或盲盒随机数（验证者可操纵或挑区块）。VRF 采用“请求-回调”两笔交易：合约发请求 → 链下节点用私钥对种子算出随机数与密码学证明 → 链上验证合约验真后再回调业务合约。完整的 VRF 时序图与消费者合约代码见 <a href="#m05-9">M04.10 数据基础设施</a> §5.1。</li>
<li><strong>OEV（Oracle Extractable Value）</strong>：MEV 的重要子类（见 <a href="#m05-7">M04.7 MEV</a>）。当抵押品下跌触发借贷清算时，谁先打包到预言机更新交易之后，谁就赚走 5%–10% 的清算奖金。传统模式下这笔钱大部分流向了区块构建者和验证者。OEV 方案让清算搜索者为“紧跟价格更新执行清算的权利”竞拍，再把大部分拍卖收入返还给借贷协议。例如 Chainlink SVR（Smart Value Recapture）2024 年 12 月推出，2025 年 3 月起在 Aave 以太坊主网启用；API3 等预言机也有自己的 OEV 拍卖方案。这类产品的名称、架构和分成比例变化很快，截至 2026 年 11 月的情况以各家官方文档为准。</li>
</ul>

<h2>5. 链下自动化：去中心化 Keeper 与防抢跑</h2>
<p>借贷清算、收益金库定时复投（Harvest）、限价单触发都需要外部账号发交易。生产环境有三种常见做法：</p>
<ol>
<li><strong>自建机器人</strong>：团队自己跑脚本监听条件并发交易。完全可控，但要自己做多活、RPC 备份和 Gas 管理，单点宕机就会漏执行。</li>
<li><strong>去中心化 Keeper 网络</strong>：合约暴露 <code>checkUpkeep</code> / <code>performUpkeep</code>，由 Chainlink Automation、Gelato 这类网络的节点模拟和执行（下图）。</li>
<li><strong>无许可激励</strong>：函数对任何人开放，执行者拿奖励（例如清算奖金、复投分成）。搜索者会互相竞争，但奖励要覆盖 Gas，且要防抢跑。</li>
</ol>
${mm('去中心化 Keeper / Automation 执行流程', `
flowchart LR
  C["目标协议合约<br/>暴露 checkUpkeep 视图"] -->|"链下节点每块模拟"| K["Keeper 网络<br/>Chainlink Automation / Gelato"]
  K -->|"条件满足"| TX["发交易调用 performUpkeep"]
  TX --> C
  C -->|"链上二次复核条件<br/>防重放与防抢跑"| OK["执行复投/结算并付 Gas 补贴"]
`, [
  ['flow', '链下网络不断免费模拟调用 view 函数检查触发条件，只有返回 true 时才花 Gas 上链执行。'],
  ['risk', '不要盲信 checkUpkeep 传进来的 calldata！performUpkeep 必须在链上重新校验全部前置条件。'],
  ['key', '高价值任务（如大额清算）可以做成“无许可竞争 + 激励”，而风控暂停或参数调整应限定白名单 Keeper。']
])}

<h2>6. 生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['校验 <code>answer > 0</code>、<code>updatedAt</code> 与心跳超时', '防止预言机停更或返回异常零值导致误清算', '在 Foundry 中用 <code>vm.warp</code> 快进超时，确认合约 revert'],
  ['在自己的合约里设价格合理区间（自定义熔断）', '旧聚合器的 minAnswer 下限曾让报价卡死（LUNA 事件）；而多数价格源现在已不再使用 minAnswer/maxAnswer，不能指望它们兜底', '先查所用价格源是否设了上下限；单测：mock 价格超出 minPrice/maxPrice 时必须 revert 并暂停借贷'],
  ['L2 排序器状态源未初始化（startedAt == 0）时拒绝', '否则宽限期检查被绕过', '单测：mock startedAt = 0，确认 revert'],
  ['L2 接入 Sequencer Uptime Feed + 宽限期', '避免排序器恢复瞬间用户来不及补仓而被抢清算', '模拟 sequencerFeed 返回 1 或刚恢复 60 秒，验证清算被拒绝'],
  ['主备预言机或偏差熔断（如 Push + TWAP）', '单源故障或被操纵时自动进入保护模式', '设定主备偏差超过 3%–5% 自动告警并暂停大额借出']
])}

${exercises([
  ['某 L2 借贷协议接入了 ETH/USD Push 预言机（心跳 1 小时，偏差 0.5%）。若开发团队忘记接入 Sequencer Uptime Feed，排序器宕机 90 分钟期间现货跌了 15%，恢复后第一秒会发生什么？', '<p>排序器刚恢复时，预言机更新交易与海量清算机器人会同时涌入。若旧价刚好未超宽松心跳，机器人可能按旧价借出超额资产；若预言机立刻更新了 -15% 的新价，正常用户在宕机期间根本无法充值补仓，会在恢复第一秒被直接清算，引发协议声誉与坏账风险。</p>'],
  ['为什么说「Pull 模式预言机」更适合 50 倍杠杆的链上永续合约，而不是 Push 模式？', '<p>50 倍杠杆下 2% 的波动就触发强平。Push 模式 0.5% 偏差加链上打包延迟会制造巨大的“前置抢跑（Latency Arbitrage）”空间，让套利者看着 CEX 价格打爆永续协议流动性池；Pull 模式把亚秒级签名直接塞进开平仓交易，大幅压缩延迟套利窗口。</p>']
])}
${checklist([
  '能说出 Push、Pull 与 TWAP 三类预言机的核心取舍与适用协议类型。',
  '能手写出安全读价函数：排序器状态源已初始化、排序器在线、宽限期已过、价格大于 0、未过期、在业务合理区间内。',
  '能解释为什么链上不能用区块哈希做抽奖，以及 VRF 的两阶段回调流程。',
  '能为自动化任务设计链下 check + 链上二次复核的 Keeper 接口。'
])}
${mistakes([
  ['只要用了 Chainlink，直接读 latestAnswer() 就绝对安全', '必须用 latestRoundData() 同时检查 updatedAt 新鲜度、answer > 0、L2 排序器状态，并在自己的合约里设业务合理区间（多数价格源已不再使用 minAnswer/maxAnswer）。'],
  ['Pull 预言机因为链下签发，所以比 Push 不安全', 'Pull 预言机同样由多节点门限签名或聚合签名背书并在链上验签，安全边界取决于验证者集合与价格过期窗口，而不是推拉形态。'],
  ['Keeper 脚本跑在自己一台云服务器上就够了', '单点服务器宕机、RPC 断线或 Gas 估算偏低都会导致清算延迟引发穿仓；核心任务应采用去中心化 Keeper 网络或自建多活备份。']
])}
${recap([
  'Push 适合低频稳健借贷，Pull 适合高频衍生品与长尾资产，TWAP 适合做交叉校验辅助源。',
  '安全接入预言机必备：非负校验、心跳新鲜度、自设的业务合理区间与 L2 排序器宽限期；不再依赖已弃用的 answeredInRound。',
  'VRF 提供可验证链上随机性；OEV 通过拍卖清算优先权把原本流失的 MEV 返还给协议。',
  '去中心化 Keeper 解决链上自触发难题，且 performUpkeep 必须在链上复核全部安全条件。'
])}
${quiz([
  { q: '在 L2 借贷协议中接入 Sequencer Uptime Feed 并设置 1 小时宽限期（Grace Period）的主要目的是什么？', o: ['降低每次读取预言机的 Gas 费', '在排序器宕机恢复后给借款人留出补仓或还款的时间窗口，防止恢复瞬间被不公平清算', '提高 L2 的出块速度', '替代价格预言机直接提供 ETH 价格'], a: 1, why: '排序器宕机期间用户无法发送补仓交易，恢复后设置宽限期可避免用户在恢复第一秒就被清算机器人打爆。' },
  { q: '对比 Push（Chainlink）与 Pull（Pyth）预言机，下列哪项描述准确？', o: ['Push 模式由每笔交易的用户承担喂价 Gas', 'Pull 模式可以亚秒级更新且不交易不花链上 Gas，由调用方在交易中附带签名证明上链验签', 'Pull 模式不需要合约修改任何函数签名', 'Push 模式完全不存在陈旧报价风险'], a: 1, why: 'Pull 模式在链下高频签发，仅在用户交互时随交易带入 calldata 验签，因此能以极低成本覆盖高频率和多资产。' },
  { q: '为什么不能用 keccak256(abi.encodePacked(block.timestamp, block.prevrandao)) 来做高价值链上抽奖？', o: ['Solidity 编译器不支持该写法', '出块验证者可以提前算出结果，并通过放弃出块或调整交易顺序来操纵中奖结果', '计算该哈希的 Gas 费太高', '不同节点算出的哈希不一致'], a: 1, why: '区块属性对出块者并非不可预测，高价值奖池会激励验证者通过选择性出块操纵随机数，应使用 VRF。' },
  { q: '关于 OEV（预言机可提取价值），下列哪项最准确？', o: ['它是预言机节点收取的固定月费', '它指围绕预言机价格更新触发清算或套利产生的 MEV，协议可通过 OEV 拍卖将这部分收益回流给自身', '它只存在于比特币网络', '它是一种替代 ERC-20 的代币标准'], a: 1, why: '预言机更新往往直接触发高额清算奖金，OEV 机制通过拍卖价格更新后的首笔执行权，把价值返还给协议与用户。' }
])}
${terms([
  ['推模式预言机', 'Push Oracle', '由链下节点网络按心跳或价格偏差阈值主动把最新价格写入链上合约的预言机架构。'],
  ['拉模式预言机', 'Pull Oracle', '链下高频签发价格证明，由用户在发起交易时按需附带证明到链上验签使用的架构。'],
  ['排序器在线源', 'Sequencer Uptime Feed', 'L2 上用于查询 Rollup 排序器当前在线状态及最近恢复时间戳的专用预言机。'],
  ['可验证随机函数', 'VRF (Verifiable Random Function)', '能同时输出随机数及其密码学证明的算法，使合约可验证随机数未被篡改。'],
  ['OEV', 'Oracle Extractable Value', '因预言机价格更新而产生的 MEV（主要是借贷清算收益）。'],
  ['Keeper / Automation', 'Decentralized Keeper Network', '监听链上条件并在满足时自动提交交易触发合约执行的去中心化机器人网络。']
])}
` });

CUR = 'm05-70';
addCh({ id: 'm05-70', nav: 'Solana 生产级工程', title: 'M06.8 Solana 生产级工程：CU、优先费、ALT、Token-2022 与 Jito MEV', desc: '计算单元与优先费策略、地址查找表 ALT、Token-2022 扩展、Jito Bundles、Yellowstone gRPC 索引与多语言后端对照', html: `
<h1>M06.8 Solana 生产级工程：CU、优先费、ALT、Token-2022 与 Jito MEV</h1>
${meta([
  '精确计算并设置 Solana 交易的 Compute Unit（CU）上限与微灯优先费，避免交易在拥堵期丢单或白交高费。',
  '用版本化交易与地址查找表（ALT）突破单笔交易 1,232 字节与账户数量上限。',
  '掌握 Token-2022 的核心扩展（转账费、转账钩子、保密转账）与接入风险。',
  '理解 Jito Bundles 原子捆绑、Yellowstone gRPC 流式索引，并在 Go / Rust / TypeScript 间做好 Web3 后端技术选型。'
], '前置：<a href="#m05-11">M06.6 Solana 概念</a>、<a href="#m05-12">M06.7 Solana 动手</a>、<a href="#m01-8">M01.8 索引器工程</a>')}
${beginner(`<p><strong>计算单元（Compute Unit，CU）</strong>：Solana 上的“计算量刻度”，类似以太坊的 Gas，但按固定单笔上限与局部热点费用市场计费。</p>
<p><strong>地址查找表（Address Lookup Table，ALT）</strong>：把常用的 32 字节公钥提前存进一张链上表里，发交易时只需写 1 字节的下标，大幅压缩交易体积。</p>
<p><strong>Jito Bundle</strong>：把最多 5 笔交易打包成一个原子组合，附带小费发给运行 Jito 客户端的验证者，要么全部按顺序上链，要么全部不上链。</p>`)}

<h2>1. 一句话理解</h2>
${one('学会写 Anchor 计数器只是 Solana 的起点；真正在主网跑高并发 DeFi、钱包或交易机器人，核心拼的是五件事：精准估算 CU 与优先费、用 ALT 压缩大交易、适配 Token-2022 扩展、通过 Jito 控制上链顺序，以及用 Yellowstone gRPC 替代慢速轮询。')}
${call('analogy', `<p>Solana 发交易像往一趟 400 毫秒发一班的高铁上塞行李：每件行李严格限重 1,232 字节（单交易 UDP 包上限）；如果你带了 40 个地址箱子根本塞不下，就得先把地址存进车站寄存柜（ALT），车票上只写柜号。高峰期想抢到头等舱座位，得先称重报准体积（SetComputeUnitLimit），再按体积付合理的加急费（SetComputeUnitPrice）。</p>
<p>比喻的局限：Solana 没有全局统一 Mempool，交易会直接转发给当前和即将出块的 Leader 验证者；如果区块高度（blockhash）过期约 60–90 秒还没上链，交易会静默失效，必须重签重发。</p>`)}
${art('一图看懂：Solana 生产级交易上链与数据闭环', 660, 320, [
  S.zone(15, 18, 630, 140, { t: '写链：构造高效且能稳定落地的生产交易', k: 'info' }),
  S.box(28, 52, 140, 84, { k: 'info', icon: 'gear', t: '1. 模拟估 CU', s: 'simulateTransaction\n按实耗×1.15设上限' }),
  S.box(196, 52, 140, 84, { k: 'key', icon: 'bolt', t: '2. 优先费 + ALT', s: '按热点账户定单价\nALT 压缩 32B→1B' }),
  S.box(364, 52, 130, 84, { k: 'warn', icon: 'shield', t: '3. 路由发送', s: 'SWQOS 通道\n或 Jito Bundle' }),
  S.box(522, 52, 110, 84, { k: 'ok', icon: 'block', t: '4. Leader 出块', s: '400ms Slot\n并发执行' }),
  S.arrow(170, 94, 194, 94), S.arrow(338, 94, 362, 94), S.arrow(496, 94, 520, 94),
  S.zone(15, 174, 630, 102, { t: '读链：高吞吐流式索引（替代传统 RPC 轮询）', k: 'ok' }),
  S.box(40, 204, 170, 56, { k: 'ok', icon: 'server', t: '验证者 Geyser 插件', s: '内存级实时捕获账户变更' }),
  S.box(265, 204, 165, 56, { k: 'key', icon: 'bolt', t: 'Yellowstone gRPC', s: '低延迟推送流（ms 级）' }),
  S.box(485, 204, 140, 56, { k: 'info', icon: 'db', t: '业务索引库', s: '按 slot 确认与回滚' }),
  S.arrow(212, 232, 263, 232, { label: '推送' }), S.arrow(432, 232, 483, 232, { label: '入库' }),
  S.text(330, 302, 'Solana 工程关键：局部费用市场 + 无全局内存池 + 流式推送索引', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['flow', '上半区是生产发交易四步闭环；下半区是用 Geyser + Yellowstone gRPC 取代低效的 JSON-RPC 轮询。'],
  ['key', '在 Solana 上，不模拟直接按默认 200,000 CU 发交易，既浪费优先费又容易因抢占过多区块配额被排到后面。'],
  ['risk', '忘记设置过期重发与确认级别（processed / confirmed / finalized），会导致重复下单或误把分叉槽当成已入账。']
], '上方展示 Solana 交易经由模拟估 CU、附加优先费与 ALT、通过 SWQOS 或 Jito Bundle 发给 Leader 出块；下方展示通过 Geyser 与 Yellowstone gRPC 实时推送至业务索引库', 'm05-70')}

<h2>2. CU 预算、优先费与局部费用市场</h2>
<p>Solana 每笔交易的基础签名为 5,000 lamports（0.000005 SOL），默认每条指令分配 200,000 CU（单笔交易上限 1,400,000 CU）。拥堵时是否能进块，取决于<strong>优先费（Priority Fee）</strong>：</p>
<p><code>优先费（lamports） = ceil(ComputeUnitLimit × ComputeUnitPrice_microLamports / 1,000,000)</code></p>
${call('deep', `<p><strong>算一算：为什么“紧设 CU 上限”能省一半以上优先费？（示例）</strong><br/>
假设某笔 DEX 兑换实际只需 80,000 CU，当前热门池子需要 <code>ComputeUnitPrice = 500,000 microLamports/CU</code> 才能进块。<br/>
• 偷懒用默认 200,000 CU：优先费 = 200,000 × 500,000 / 1,000,000 = <strong>100,000 lamports</strong>（0.0001 SOL），且调度器认为你很占地方。<br/>
• 先模拟实测 80,000 CU，加 15% 余量设为 92,000 CU：优先费 = 92,000 × 500,000 / 1,000,000 = <strong>46,000 lamports</strong>，费用直降 <strong>54%</strong>，打包优先级反而更高。</p>`)}
<p><strong>局部费用市场（Local Fee Market）</strong>：与以太坊全网共用一个 Base Fee 不同，Solana 的单个写锁账户有独立 CU 上限。某个 Memecoin 池子爆火时，只会推高读写该池子账户的优先费，普通 USDC 转账费用几乎不受影响。</p>

<h2>3. 版本化交易与地址查找表（ALT）</h2>
<p>Solana 单笔交易最大 <strong>1,232 字节</strong>（适配单帧 IPv6 MTU，减少分片丢包）。每个账户地址占 32 字节，传统 Legacy 交易最多只能塞约 30 个账户——但一笔 Jupiter 跨多池路由兑换轻松涉及 50–80 个账户。</p>
<ul>
<li><strong>Versioned Transaction（v0）</strong>：引入 <strong>Address Lookup Table（ALT）</strong>。协议或聚合器提前把常用池子与程序地址写入链上 ALT 账户；v0 交易只需引用 ALT 地址 + 每个账户的 <strong>1 字节索引</strong>，把单笔交易支持的账户数扩展到 200+，同时体积大幅缩小。</li>
<li><strong>工程注意</strong>：新建或扩展 ALT 后，需等至少 1 个 slot 激活才能在交易中引用；ALT 只能压缩非签名账户，交易签名者地址仍需占 32 字节。</li>
</ul>

<h2>4. Token-2022 扩展与集成风险</h2>
<p>旧版 SPL Token 程序功能固定。新一代 <strong>Token-2022（Token Extensions）</strong>在同一标准内原生提供可插拔扩展，无需每个项目重造一套合约：</p>
${tbl(['扩展能力', '作用与业务场景', '钱包 / DEX / 交易所接入坑点'], [
  ['<strong>Transfer Fee</strong>（转账税）', '每笔转账自动扣留一定比例手续费，原生支持税收代币与 RWA 收费', '交易所充值必须按<strong>实际到账净额</strong>入账，绝不能按发送额记账'],
  ['<strong>Transfer Hook</strong>（转账钩子）', '每次转账自动 CPI 调用自定义合约（如白名单 KYC 检查、版税强制执行）', '钩子合约可能消耗大量 CU 甚至故意 revert，导致资产无法正常归集或被蜜罐卡死'],
  ['<strong>Permanent Delegate</strong>（永久委托）', '发行方可随时无视持有人签名转移或销毁任意地址余额（适合合规稳定币/RWA）', 'DeFi 借贷与 DEX 上架前必须检查该字段，否则抵押品可能被发行方直接划走'],
  ['<strong>Confidential Transfer</strong>（保密转账）', '用零知识证明隐藏转账金额（但仍保留地址可见，可配审计密钥）', '索引器无法直接从明文余额解析金额，需单独识别处理']
])}

<h2>5. Jito Bundles、SWQOS 与 Yellowstone gRPC 索引</h2>
<ul>
<li><strong>SWQOS（Stake-Weighted Quality of Service）</strong>：Solana 为防垃圾交易洪泛，按节点质押权重分配发往 Leader 的带宽配额。生产环境不要把交易发给无质押的免费公共 RPC，而应使用带 SWQOS 通道的专业 RPC 或自建质押节点。</li>
<li><strong>Jito Bundles 与 Solana MEV</strong>：Solana 绝大多数验证者运行 Jito 客户端。通过 Jito Block Engine 发送 Bundle（最多 5 笔交易 + 1 笔给 Jito Tip 账户的小费），可保证<strong>原子执行</strong>与<strong>防三明治夹击</strong>（例如把“套利 + 付小费”绑在一起，失败不扣小费）。</li>
<li><strong>Yellowstone gRPC（Dragon’s Mouth）</strong>：Solana 每秒数千笔交易，传统 HTTP <code>getBlock</code> 轮询极易落后。生产索引器直接对接验证者 <strong>Geyser 插件</strong>暴露的 Yellowstone gRPC 流，按程序 ID 或账户过滤订阅毫秒级更新，并区分 <code>processed</code>（乐观预展示）、<code>confirmed</code>（约 2/3 质押投票，适合多数实时展示）与 <code>finalized</code>（约 31+ 槽不可逆，适合交易所充值入账）。</li>
</ul>

${mm('Solana 生产交易上链与块高过期重发流程', `
flowchart LR
  A["1. 模拟交易<br/>测出实耗 CU"] --> B["2. 设 CU 上限与优先费<br/>附加 ALT 与 recentBlockhash"]
  B --> C["3. 经 SWQOS 或 Jito<br/>发给当前 Leader"]
  C --> D{"90 秒内是否<br/>confirmed?"}
  D -->|"是"| E["等 finalized 后入账"]
  D -->|"否（blockhash 过期）"| F["换新 blockhash 并提价重发"]
  F --> C
`, [
  ['flow', 'Solana 没有长期驻留的全局内存池，超过 lastValidBlockHeight 后旧交易自动作废，必须由发送端主动重签重发。'],
  ['key', '重发前务必确认旧 blockhash 确实过期，避免重复下单导致双倍扣款。'],
  ['risk', '资金入账必须以 finalized 为准，避免 processed 阶段被跳过造成假入账。']
])}

<h2>6. 多语言 Web3 后端生态对照（Go / Rust / TypeScript）</h2>
<p>本手册 M01 与 M09 的后端实战以 Go 为主，但在多链生产团队中，Go、Rust、TypeScript 各有明显主场，建议按团队场景选型：</p>
${tbl(['语言', '核心 Web3 生态库', '核心优势', '最适合的 Web3 后端场景'], [
  ['<strong>Go</strong>', '<code>go-ethereum</code>、<code>cosmos-sdk</code>、<code>solana-go</code>', '并发模型简单、部署单二进制、与交易所/托管/微服务体系天然契合', 'CEX 撮合与账本、多链托管钱包、EVM 索引器与充提监听、RPC 网关'],
  ['<strong>Rust</strong>', '<code>Alloy</code>（新一代 EVM 库）、<code>Reth</code>、<code>Anchor</code> / <code>solana-sdk</code>、<code>Sui</code>', '零 GC 抖动、内存安全、与 Solana/Reth/ZK 证明器同语言零跨界成本', '高频 MEV 搜索者、Solana/Move 链上程序与高性能索引器、ZK Prover 与自研客户端'],
  ['<strong>TypeScript</strong>', '<code>viem</code>、<code>wagmi</code>、<code>@solana/kit</code>（原 web3.js v2）、<code>@ton/ton</code>', '与前端共享 ABI/IDL 与类型定义，SDK 更新最快、开发迭代极快', 'DApp BFF 层、AI Agent 工具服务（MCP）、中小规模自动化 Keeper 与脚本']
])}

${exercises([
  ['一笔 Solana DEX 兑换交易在模拟时报错“Transaction too large: 1380 > 1232”，最标准的工程解法是什么？', '<p>将交易升级为 Versioned Transaction（v0），并把池子、代币 Mint、SPL Program 等非签名公共账户收入 Address Lookup Table（ALT），用 1 字节索引替换 32 字节完整公钥。</p>'],
  ['交易所计划上线一个基于 Token-2022 发行的 RWA 代币，安全评审必须额外检查哪三个扩展字段？', '<p>① <code>PermanentDelegate</code>（发行方能否强行划走交易所冷热钱包资产）；② <code>TransferFee</code>（充提与归集时是否会扣税导致对账差额）；③ <code>TransferHook</code>（是否包含自定义白名单/黑名单逻辑导致提币或归集失败）。</p>']
])}
${checklist([
  '发 Solana 交易前先模拟实测 CU，并按热点账户动态估算优先费。',
  '能使用 v0 交易与 ALT 处理多跳复杂指令，理解 1,232 字节限制来源。',
  '知道 Token-2022 的转账税、转账钩子与永久委托对钱包/交易所的工程影响。',
  '理解 Jito Bundle 原子性、SWQOS 与 Yellowstone gRPC 的确认级别区分。',
  '能结合业务特点在 Go、Rust、TypeScript Web3 后端栈中做出合理选型。'
])}
${mistakes([
  ['Solana 交易只要签完广播出去，放着不管早晚会打包', '每笔交易绑定一个 recentBlockhash，约 60–90 秒后过期作废；拥堵期需要监听状态并在过期前用新 blockhash 和更高优先费重发。'],
  ['Token-2022 只是 SPL Token 的小版本升级，可以复用旧代码直接入账', 'Token-2022 使用完全不同的 Program ID，且带 TransferFee 或 TransferHook 的代币会直接破坏按固定金额入账的旧逻辑。'],
  ['看到 processed 状态就可以给用户入账了', 'processed 仅代表单个节点执行过，极易被跳过或分叉；资金入账必须等 finalized（或按风控策略至少 confirmed + 延迟复核）。']
])}
${recap([
  '精准估算 CU 上限 + 动态优先费是 Solana 生产交易降低成本并提升上链率的核心。',
  'v0 版本化交易配合 ALT 地址查找表解决 1,232 字节与多账户瓶颈。',
  'Token-2022 引入原生扩展，集成前必须审计 TransferFee、TransferHook 与 PermanentDelegate。',
  'SWQOS 与 Jito Bundles 解决发交易的稳定性与原子性，Yellowstone gRPC 解决高吞吐实时索引。',
  'Web3 后端多语言选型：Go 主打交易所/钱包/微服务，Rust 主打高频 MEV/Solana/底层客户端，TS 主打 BFF/Agent/快速迭代。'
])}
${quiz([
  { q: '为什么在 Solana 上把 ComputeUnitLimit 设得比实际消耗大很多（例如实际用 5 万却留默认 20 万）反而有害？', o: ['会导致交易必然执行失败', '不仅按上限多付优先费，还会让调度器高估你占用的区块配额从而降低打包优先级', 'Solana 不允许手动设置 CU 上限', '会触发账户租金扣除'], a: 1, why: '优先费按 CU 上限乘以单价计算，虚高的 CU 上限会多花钱且降低单位 CU 收益排序。' },
  { q: 'Address Lookup Table（ALT）解决的核心工程问题是什么？', o: ['替代私钥进行交易签名', '突破单笔交易 1,232 字节限制，用 1 字节下标压缩 32 字节公钥以支持更多账户', '降低合约存储租金到零', '自动把 SOL 兑换为 USDC'], a: 1, why: 'ALT 将常用账户预先存储在链上表中，v0 交易通过 1 字节索引引用，大幅减少交易体积。' },
  { q: '接入 Token-2022 代币时，以下哪个扩展意味着发行方可以不经用户签名直接转移或销毁热钱包中的代币？', o: ['TransferFee', 'MetadataPointer', 'PermanentDelegate', 'ImmutableOwner'], a: 2, why: 'PermanentDelegate 赋予指定地址对所有代币账户的永久转移与销毁权限，常见于合规 RWA 或受监管稳定币，DeFi/CEX 需谨慎评估。' },
  { q: '交易所监听 Solana 充值入账时，最稳妥的做法是监听哪个确认级别？', o: ['processed', 'finalized', '只看广播成功回执', '只需检查本地签名通过'], a: 1, why: 'processed 甚至 confirmed 在极端网络分叉下仍有回退可能；交易所资金入账应以 finalized（已达超级多数不可逆确认）为准。' }
])}
${terms([
  ['计算单元', 'Compute Unit (CU)', 'Solana 衡量单笔交易计算消耗的单位，对应以太坊的 Gas 概念。'],
  ['局部费用市场', 'Local Fee Market', 'Solana 按具体写锁账户隔离拥堵与优先费竞价的机制，避免单一热点拖垮全网费用。'],
  ['地址查找表', 'Address Lookup Table (ALT)', '链上公钥索引表，允许 v0 版本化交易用 1 字节下标引用 32 字节账户地址。'],
  ['Token-2022', 'Token Extensions Program', 'Solana 新一代代币程序，原生支持转账税、转账钩子、永久委托与保密转账等扩展。'],
  ['Jito Bundle', 'Jito Atomic Bundle', '最多 5 笔交易的原子打包通道，支持按序执行与防抢跑小费拍卖。'],
  ['Yellowstone gRPC', 'Geyser gRPC Stream', '基于 Solana 验证者 Geyser 插件的高吞吐、毫秒级流式链上数据订阅协议。']
])}
` });
})();
