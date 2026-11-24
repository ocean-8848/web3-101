/* ---------- M04 公链（8）：m05-68 Tron 与 TON ---------- */
(() => {
CUR = 'm05-68';
addCh({ id: 'm05-68', nav: 'Tron 与 TON', title: 'M05.10 Tron 与 TON：USDT 的主战场与 Telegram 生态', desc: 'Tron 的 Bandwidth/Energy 资源模型，TON 的异步消息与 Jetton，以及充值监听的坑', html: `
<h1>M05.10 Tron 与 TON：USDT 的主战场与 Telegram 生态</h1>
${meta(['说出 Tron 为什么是 USDT 的主战场，并用 Bandwidth + Energy 算出一笔 TRC-20 转账的费用。', '列出 TVM 与 EVM 的差别，判断 Solidity 移植到 Tron 要改什么。', '解释 TON 的 Actor 异步消息、bounce 与 Jetton，并能验证一笔 Jetton 转账。', '为交易所设计 Tron 与 TON 的充值监听规则。'], '前置：<a href="#m05-1">M04.1 公链全景</a>、<a href="#m05-11">M05.1 Solana 概念</a>、<a href="#m01-8">M01.8 索引器工程</a>')}
${beginner(`<p><strong>TRC-20</strong>：Tron 上的同质化代币标准，接口和以太坊 ERC-20 几乎一样。USDT 在 Tron 上就是一个 TRC-20 合约。</p>
<p><strong>超级代表（Super Representative，SR）</strong>：Tron 的出块节点。TRX 持有者投票选出 27 个 SR 轮流出块。</p>
<p><strong>Jetton</strong>：TON 上的同质化代币标准（TEP-74），对应以太坊的 ERC-20，但结构不同：每个持有人有自己的一个钱包合约。</p>
`)}

<h2>1. 一句话理解</h2>
${one('Tron 是“把 USDT 当主业”的 EVM 风格链：转账几乎不要自己持有 TRX，靠质押 TRX 换来的 Bandwidth 和 Energy 额度付费；TON 是“为 Telegram 十亿用户设计”的 Actor 链：合约之间只发异步消息，Jetton 每人一个钱包合约，充值要追整棵交易树。')}
${call('analogy', `<p>Tron 像高速公路的月票：先押一笔保证金（质押 TRX）换每天免费通行额度；额度用完照样能上路，但要现金买票（烧 TRX）。TON 像快递网络：你不能直接冲进仓库取货，只能寄一个包裹过去，对方处理后再寄回执，包裹可能被退回。</p>
<p>比喻的局限：月票额度每天自动恢复，保证金还能取回；而 TON 的“快递”没有客服，退回的包裹要自己写代码识别。</p>`)}
${art('一图看懂：同样是转 USDT，三条链各有各的“过路费”规则', 660, 320, [
  S.text(330, 22, '同一种美元稳定币，换一条链就换一套费用、地址和确认规则', { size: 13.5, b: 1, anchor: 'middle', mw: 640 }),
  S.box(10, 40, 200, 120, { k: 'key', icon: 'bolt', t: 'Tron', s: 'Bandwidth + Energy\n质押 TRX 换额度\n不够就烧 TRX', tag: '上半篇' }),
  S.box(230, 40, 200, 120, { k: 'info', icon: 'cloud', t: 'TON', s: 'Jetton：每人一个钱包合约\n异步消息，失败可退回\n气费 + 存储费', tag: '下半篇' }),
  S.box(450, 40, 200, 120, { k: 'idle', dash: 1, icon: 'globe', t: 'EVM 链', s: 'gas = 用量 × 单价\nEIP-1559 基础费\n账户 nonce 排序', tag: '已讲' }),
  S.arrow(110, 162, 200, 212), S.arrow(330, 162, 330, 212), S.arrow(550, 162, 460, 212),
  S.box(130, 214, 400, 56, { k: 'warn', icon: 'bank', t: 'Tether 发行的 USDT 合约', s: '每条链一份合约，发行方都能冻结地址' }),
  S.text(330, 304, '换链 ＝ 换地址格式、费用模型和确认规则；面值不变，风险不同', { size: 13, anchor: 'middle', mw: 640 })
], [
  ['flow', '用户的 USDT 在哪条链上，就按哪条链的规则付费、等确认；三条链上的 USDT 是三份独立账本。'],
  ['key', 'Tron 的费用靠“质押换额度”，TON 的费用来自“消息在多个合约间跳转”，都不是 EVM 的单一 gas 价格。'],
  ['risk', '选错链转账、验错合约地址，是交易所和钱包最常见的入账事故。'],
  ['limit', '图中不含 Solana，见 <a href="#m05-11">M05.1 Solana 概念</a>；EVM 的费用机制见 <a href="#m05-2">M04.2</a>。']
], 'Tron、TON、EVM 三条链各自的费用模型，都指向 Tether 发行的 USDT 合约，发行方可在每条链上冻结地址', 'm05-68')}

<h2>2. Tron：为什么它是 USDT 的主战场</h2>
<p>Tron 的位置很特别：不是 DeFi 最繁荣的链，却承载了大量稳定币的真实支付。三组数据（都带日期）：</p>
<ul>
<li><strong>存量份额</strong>：${cite('DefiLlama：USDT 分链流通量', 'https://defillama.com/stablecoin/tether')}的接口在 2026-11-22 显示，USDT 总流通约 1,745 亿美元，Tron 约 915 亿（52.4%），以太坊约 660 亿（37.8%）。这是我用聚合接口当天算出的，Tether 官网的分链数字由前端加载，未能抓取。</li>
<li><strong>交易所充值</strong>：不少交易所把 Tron 作为 USDT 的首选充值网络${tag('惯例')}，具体占比没有可靠公开口径，本书不写数字。</li>
<li><strong>执法协作</strong>：Tron、Tether 和 TRM Labs 在 2024 年成立 T3 金融犯罪小组，据 The Block 报道，截至 2026 年 5 月累计冻结超 4.5 亿美元${cite('The Block：T3 FCU 冻结超 4.5 亿美元', 'https://www.theblock.co/post/401252/tether-tron-trm-labs-freeze-over-450-million-in-illicit-crypto-assets')}，数字出自联盟公告，未经审计。</li>
</ul>
${call('info', '<p>“Tron 上的 USDT 多”和“Tron 上的交易多”是两件事。不同统计口径（按供应、按转账笔数、按转账金额、只算 USDT 还是所有稳定币）给出的份额差别很大。引用时一定写清口径和日期。</p>')}

<h3>2.1 共识：27 个超级代表</h3>
<p>Tron 用委托权益证明（DPoS）。TRX 持有者质押后获得 TRON Power（投票权），投票给 SR 候选人；得票最高的 27 个成为 SR，每 6 小时重新排名一次。每个 SR 出一个块可得 8 TRX，另有每块 128 TRX 的投票奖励分给前 127 名候选人${cite('Tron 开发者文档：Super Representatives', 'https://developers.tron.network/docs/super-representatives')}。区块间隔约 3 秒。我用 TronGrid 在 2026-11-22 取到最新块高 88,217,196 与固化块高 88,217,177，相差 19 块，约 57 秒，对应“约 2/3 的 SR 已确认”才算<strong>固化（solidified）</strong>。</p>
<h2>3. 资源模型：Bandwidth + Energy 取代 gas</h2>
<p>Tron 没有“gas 价格竞价”。每笔交易消耗两种资源：</p>
${tbl(['资源', '付什么', '免费额度', '质押份额公式', '额度不够时烧 TRX'], [
  ['Bandwidth（带宽）', '交易的字节数（序列化后大小，另加固定开销）', '每个已激活账户每天 600，24 小时内逐步恢复', '质押 TRX / 全网带宽质押总量 × 43,200,000,000', '1,000 sun / 带宽（0.001 TRX）'],
  ['Energy（能量）', '合约执行的指令成本之和（TVM）', '没有', '质押 TRX / 全网能量质押总量 × 180,000,000,000', '100 sun / Energy（0.0001 TRX），受 fee_limit 约束']
])}
<p>以上参数来自开发者文档${cite('Tron 开发者文档：Bandwidth 与 Energy', 'https://developers.tron.network/docs/bandwidth-and-energy')}和我在 2026-11-22 调用 <code>wallet/getchainparameters</code> 得到的链上值：<code>getTransactionFee</code> = 1000，<code>getEnergyFee</code> = 100，<code>getFreeNetLimit</code> = 600，<code>getUnfreezeDelayDays</code> = 14。这些参数由 SR 投票修改，写代码时应读链参数，不要写死。</p>
<h3>3.1 Stake 2.0、委托与能量租赁</h3>
<ul>
<li><strong>质押</strong>：用 <code>FreezeBalanceV2</code> 冻结 TRX，选择换 BANDWIDTH 或 ENERGY；用 <code>UnfreezeBalanceV2</code> 发起解质押，等待期过后用 <code>WithdrawExpireUnfreeze</code> 取回。等待期由链参数 <code>getUnfreezeDelayDays</code> 决定，当前为 14 天（上面的实测值）。</li>
<li><strong>委托</strong>：用 <code>DelegateResourceContract</code> 把自己的资源额度借给别的地址，对方不用质押也能用，可附锁定期。</li>
<li><strong>能量租赁</strong>：有人把质押得来的 Energy 委托出租，价格由市场决定，本书不列平台和价格；风险是要信任出租方，租期内额度可能被收回。</li>
<li><strong>动态能量模型</strong>：热门合约在一个维护周期内用量超过阈值，下一周期的 Energy 单价系数会上调；链上 <code>getAllowDynamicEnergy</code> 当前为 1。交易回执里的 <code>energy_penalty_total</code> 字段就是这部分附加成本（见 TIP-491 的说明）。</li>
</ul>
${call('deep', `<p><strong>算一算（示例）</strong>：我在 2026-11-22 用 TronGrid 查了 USDT 合约的一笔转账，回执显示 <code>energy_usage_total</code> = 64,285，<code>net_fee</code> = 345,000 sun。含义：这笔转账共用 64,285 点 Energy 和 345 点 Bandwidth；发送方 Energy 由质押额度覆盖，只因没有带宽额度而烧了 345,000 sun = 0.345 TRX。若 Energy 也要靠烧，则 64,285 × 100 sun = 6,428,500 sun ≈ 6.43 TRX。可见“有无 Energy 额度”可以让同一笔转账的成本相差 18 倍以上。</p>`)}

<h2>4. TVM 与 EVM：移植 Solidity 会踩什么坑</h2>
<p>TVM 在字节码层面兼容大部分 EVM，Solidity 合约稍作调整就能部署。差别主要在这些地方：${cite('Tron 开发者文档：TVM vs EVM', 'https://developers.tron.network/docs/tvm-vs-evm')}</p>
${tbl(['方面', 'EVM（以太坊）', 'TVM（Tron）', '对开发者的影响'], [
  ['地址', '20 字节，十六进制 0x…', '链上是 21 字节，前缀 0x41；对外用 Base58Check，34 个字符，以 T 开头', '后端要同时处理两种格式；虚拟机内仍是 20 字节'],
  ['手续费', 'gas × 价格，EIP-1559 基础费 + 小费', 'Energy / Bandwidth，价格由 SR 投票设定；<code>GASPRICE</code> 和 <code>BASEFEE</code> 都返回 energyPrice，没有小费竞价', '不能用“加小费加速”；要预估 Energy 设置 fee_limit'],
  ['重放保护', '账户 nonce', '没有 nonce；交易引用近期区块（TAPOS），默认 60 秒过期', '不存在 nonce 卡死；但过期的交易要重新签'],
  ['CREATE2', '前缀 0xff', '前缀 0x41，公式 keccak256(0x41 ++ 地址 ++ salt ++ keccak256(init_code))[12:]', '照搬以太坊的地址预计算会算错'],
  ['TRX 转入合约', '任何转入都触发 receive/fallback', '普通 <code>TransferContract</code> 不触发合约；只有 <code>TriggerSmartContract</code> 带 callValue 才触发', '“收款合约”别指望收到裸转账时执行逻辑'],
  ['执行限制', '只受 gas 约束', '另有 80 ms 单笔执行时限、3 MiB 内存上限（<code>OUT_OF_TIME</code>，见 <a href="https://developers.tron.network/docs/tvm">TVM 文档</a>）', '重计算合约可能在 Tron 上莫名失败'],
])}
${call('warn', '<p>地址格式是后端最常见的 bug 来源。EVM 工具链给你的是 <code>0x…</code>，Tron 的 API 有时返回 <code>41…</code>（42 位十六进制），有时返回 <code>T…</code>。TronGrid 的事件接口返回的是 <code>0x</code> 加 20 字节。转换规则：在 20 字节前面加 <code>41</code>，再做 Base58Check（对 21 字节做两次 SHA-256 取前 4 字节作校验码）。用 TronWeb 的 <code>TronWeb.address.fromHex()</code> 即可，不要自己拼。</p>')}
<h3>4.1 地址激活</h3>
<p>新密钥算出的 Tron 地址在“激活”前，节点和浏览器查不到这个账户。激活办法：已激活账户向它转 TRX 或 TRC-10，转账方付创建费，主网当前 1 TRX${cite('Tron 开发者文档：Account', 'https://developers.tron.network/docs/account')}。USDT 余额记在合约存储里，我推断它不依赖账户是否激活${tag('推断')}，但归集时地址里没有 TRX 或 Energy 就发不出 USDT（见第 7 节）。</p>
<p><strong>USDT 黑名单</strong>：Tether 可冻结地址。据 BlockSec 统计，2025 年在以太坊和 Tron 上共冻结约 12.6 亿美元 USDT${cite('BlockSec：2025 年 USDT 黑名单统计', 'https://blocksec.com/blog/1-26-billion-frozen-usdt-blacklisting-on-ethereum-and-tron-in-2025')}。机制见 <a href="#m02-9">M08.1 稳定币</a>，追踪见 <a href="#m05-67">M04.13 链上取证</a>。对充值系统：入账后到归集前，资金可能被冻结，要查黑名单并保留对账流程。</p>

<h2>5. TON：为 Telegram 设计的 Actor 链</h2>
<p>TON（The Open Network）最初由 Telegram 团队设计，后来由社区接手。它和 EVM 链的结构差异很大，要重新建立三个概念：分片结构、Actor 异步消息、cell 数据结构。</p>
<ul>
<li><strong>主链（workchain -1）</strong>：存验证者集合、链配置，并记录各分片最新块哈希，是确认锚点。</li>
<li><strong>基础工作链（workchain 0）</strong>：绝大多数账户和合约所在。账户按地址前缀分配到<strong>分片</strong>，负载高时分裂、低时合并（动态分片）${cite('TON 文档：分片', 'https://docs.ton.org/foundations/shards')}。</li>
<li><strong>每个账户就是一个 Actor</strong>：有自己的余额、代码和数据；官方支付文档称交易被主链块引用后即不可逆，主链约每 400 毫秒一块${cite('TON 文档：支付处理', 'https://docs.ton.org/applications/payments/overview')}。</li>
</ul>
<h3>5.1 Actor 模型：消息、bounce 与交易树</h3>
<p>EVM 里合约 A 可以同步调用合约 B，拿到返回值，失败时整笔交易一起回滚。TON 不这样做：合约 A 只能<strong>发一条内部消息</strong>给 B，B 在后续某个块里处理，再可能发消息回来。每条消息被处理时产生一笔交易，所有由同一个外部消息引发的交易构成一棵<strong>交易树（trace）</strong>${cite('TON 文档：Messages', 'https://docs.ton.org/foundations/messages/overview')}。</p>
<ul>
<li>每个账户自己的交易按逻辑时间 <code>lt</code> 严格递增排成一条链。</li>
<li><strong>没有跨合约原子回滚</strong>：A 发出的消息处理失败时，A 已经提交的状态不会自动撤销。</li>
<li><strong>bounce</strong>：消息带 bounce 标志，目标合约处理失败时，系统会把消息“退回”给发送方，并扣掉费用。发送方合约必须写代码识别被退回的消息并恢复自己的状态，否则会出现“钱扣了、事没办成”。</li>
</ul>
${call('warn', '<p>TON 的“原子性”只存在于单个合约的单笔交易内。写多合约流程（比如先扣余额、再通知别的合约）时，要把“对方失败”当作常态来设计，并处理 bounce。这是从 Solidity 转 TON 的开发者最需要改变的习惯。</p>')}
<h3>5.2 Cell、BoC 与地址</h3>
<p>TON 的一切数据，包括合约代码、合约状态、消息体、区块，都是 <strong>cell</strong> 组成的树：一个 cell 最多存一小段数据位并引用若干个子 cell。cell 图序列化后叫<strong>BoC（Bag of Cells）</strong>，是传输和存储的标准格式${cite('TON 文档：基础概述', 'https://docs.ton.org/foundations/overview')}。读者不需要手写 cell，但要知道：链上看到的 <code>te6cc…</code> 开头的 base64 字符串就是 BoC，比如转账附言（comment）就存在这里。</p>
<p>地址有两种写法：原始格式 <code>workchain:hash</code>（如 <code>0:23303D…</code>），和“用户友好格式”——36 字节（1 字节标志 + 1 字节工作链 + 32 字节账户 ID + 2 字节 CRC16 校验）的 base64 编码，共 48 个字符${cite('TON 文档：地址格式', 'https://docs.ton.org/foundations/addresses/formats')}。标志位决定前缀：</p>
<p>前缀 <code>EQ…</code> 是可退回（bounceable），发给带逻辑的合约；<code>UQ…</code> 是不可退回，发给钱包，因为收款钱包可能还没部署，用 EQ 地址消息会被退回；<code>kQ…</code>、<code>0Q…</code> 仅测试网，主网应用必须拒绝。</p>
<p><strong>同一个账户的 EQ 和 UQ 写法不同，比对地址要先解析成原始格式，不能比字符串。</strong></p>

<h3>5.3 Jetton：每人一个钱包合约</h3>
<p>TON 的同质化代币标准是 TEP-74：一个 <strong>Jetton Master</strong> 合约记录总量和元数据，每个持有人有自己的 <strong>Jetton Wallet</strong> 合约，余额存在这个钱包合约里${cite('TON 文档：Jettons 概述', 'https://docs.ton.org/contracts/standard/tokens/jettons/overview')}。转账是三方消息：</p>
${mm('一笔 Jetton 转账的消息序列', `
sequenceDiagram
  participant U as 发送方钱包
  participant SW as 发送方 Jetton 钱包
  participant RW as 收款方 Jetton 钱包
  participant R as 收款方钱包
  U->>SW: transfer（金额 目标 转发TON）
  SW->>RW: internal_transfer（扣自己余额后发出）
  RW->>R: transfer_notification（转发TON大于0时）
  RW->>U: excesses（退回多余的TON）
`, [
  ['flow', '发送方只和自己的 Jetton 钱包说话；真正的余额加减发生在两个 Jetton 钱包合约之间。'],
  ['fail', '任何一环失败（比如收款方 Jetton 钱包处理失败），消息被退回，发送方 Jetton 钱包要自己把余额加回去。'],
  ['risk', 'transfer_notification 是普通消息，任何合约都能伪造一条“假通知”。必须验证它的发送者是预期的 Jetton 钱包。']
])}
<p>操作码来自标准：<code>transfer</code> 是 <code>0x0f8a7ea5</code>，<code>transfer_notification</code> 是 <code>0x7362d09c</code>，<code>internal_transfer</code> 是 <code>0x178d4519</code>（标准只建议了这个格式，实现可以不同），<code>excesses</code> 是 <code>0xd53276db</code>${cite('TEP-74：Jetton 标准', 'https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md')}。转账里的 <code>forward_ton_amount</code> 大于 0，收款方钱包才会发 transfer_notification；附言（memo）放在 <code>forward_payload</code> 里，以 32 位全 0 的操作码开头再接文字${cite('TON 文档：转 Jetton', 'https://docs.ton.org/contracts/standard/tokens/jettons/transfer')}。</p>
<h3>5.4 语言、费用与 Telegram 生态</h3>
<ul>
<li><strong>语言</strong>：官方文档把 <strong>Tolk</strong> 称为“推荐的智能合约语言”，FunC 列为遗留语言${cite('TON 文档：Tolk 概述', 'https://docs.ton.org/tolk/overview')}；Tact 官方站标注“已弃用，请学习 Tolk”${cite('Tact 官方文档', 'https://docs.tact-lang.org/')}。</li>
<li><strong>费用</strong>：gas + 消息转发费 + 动作费 + <strong>存储费</strong>。存储费按账户占用的位数和 cell 数乘以时间，从合约余额扣${cite('TON 文档：交易费用', 'https://docs.ton.org/foundations/fees')}。当前单价在配置参数里由验证者投票修改，我没有找到可引用的数值，本书不写价格。长期不用的合约也要有人付存储费。</li>
<li><strong>Mini Apps 与 TON Connect</strong>：Mini Apps 是 Telegram 内的网页应用，链上操作走 TON Connect（会话端到端加密，dApp 拿不到私钥）。官方提醒：Mini Apps 内销售数字商品要用 Telegram Stars，TON Connect 只用于平台政策允许的交互${cite('TON 文档：TON Connect', 'https://docs.ton.org/applications/ton-connect/overview')}。钱包知识见 <a href="#m03-1">M09.1 钱包分类全景</a>。</li>
</ul>

<h2>6. 四条链对照：EVM / Tron / TON / Solana</h2>
${tbl(['维度', 'EVM（以太坊）', 'Tron', 'TON', 'Solana'], [
  ['账户模型', '账户 + 合约存储', '账户 + 合约存储（类 EVM）', '每个账户就是一个 Actor，状态在 cell 里', '程序无状态，数据放在独立账户，见 <a href="#m05-11">M05.1</a>'],
  ['执行方式', '同步调用，整笔原子', '同步调用，整笔原子，另有 80 ms 时限', '异步消息，交易树，跨合约不原子', '并行执行，账户读写集提前声明'],
  ['费用', 'gas × 价格，EIP-1559', 'Bandwidth + Energy，质押换额度，不够烧 TRX', 'gas + 转发费 + 存储费', '基础费 + 优先费，见 M05.1'],
  ['确认', '约 2 个 epoch 最终确定，见 <a href="#m05-3">M04.3</a>', '约 19 块（实测约 57 秒）固化', '主链块引用后最终确定，约 1 秒（官方）', '见 M05.1'],
  ['代币标准', 'ERC-20，余额在合约 mapping 里', 'TRC-20（接口同 ERC-20），另有 TRC-10', 'Jetton：每人一个钱包合约', 'SPL Token：每人一个 token 账户'],
  ['典型用途', 'DeFi、NFT、L2 生态', 'USDT 支付、交易所充提', 'Telegram 小程序、游戏、支付', '高频交易、消费应用']
])}
<p>这张表里 Solana 一列只做对照，细节不再重复。要点：EVM 与 Tron 的差别在费用与地址；Tron 到 TON 是执行模型的根本不同。</p>

<h2>7. 工程：在 Tron 上监听充值</h2>
<p>充值系统的通用架构（地址池、入账状态机、归集）在 <a href="#m04-6">M10.7 充值提币与冷热钱包</a>，扫块与幂等在 <a href="#m01-8">M01.8 索引器工程</a>，这里只讲 Tron 特有的部分。</p>
${mm('Tron 充值监听：从事件到入账', `
flowchart LR
  A["TronGrid 事件接口<br/>USDT 合约 Transfer"] --> B{"合约地址等于<br/>官方 USDT?"}
  B -->|"否"| X["丢弃或告警<br/>疑似假币"]
  B -->|"是"| C{"to 在我们的<br/>地址集合?"}
  C -->|"否"| Y["忽略"]
  C -->|"是"| D["记待确认<br/>txid 加 event_index 唯一"]
  D --> E{"块已固化<br/>且交易 SUCCESS?"}
  E -->|"是"| F["入账"]
  E -->|"否"| D
`, [
  ['flow', '以合约事件为准而不是交易的 to 字段：用户可能通过合约、多签或聚合器间接转账。'],
  ['fail', '交易上链但执行失败（OUT_OF_ENERGY、REVERT）也会出现在区块里，必须检查 contractRet 是 SUCCESS。'],
  ['risk', '任何人都能部署一个符号为 USDT 的 TRC-20 合约并向你的地址“转账”。只认合约地址，不认符号。']
])}
<h3>7.1 监听步骤</h3>
${steps([
  '<strong>只认合约地址</strong>：USDT 的 TRC-20 合约地址是 <code>TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</code>（我在 2026-11-22 查到该合约的 Transfer 事件和转账交易，但上线前应以 Tether 官方公布的地址为准，不要只信本文）。',
  '<strong>读 Transfer 事件</strong>：用 TronGrid 的 <code>/v1/contracts/{地址}/events</code>，加 <code>event_name=Transfer</code> 和 <code>only_confirmed=true</code>，用返回的 <code>fingerprint</code> 翻页。',
  '<strong>等固化</strong>：<code>only_confirmed=true</code> 只返回已固化块里的事件；自建全节点时用 <code>walletsolidity</code> 接口族。普通块到固化块约 19 块。',
  '<strong>幂等入账</strong>：唯一键用 (交易 ID, 事件序号)；USDT 在 Tron 上是 6 位小数，value = 148000000 表示 148 USDT；入账前后各查一次黑名单。'
])}
${call('warn', `<p><strong>能量陷阱</strong>：USDT 归集（从充值地址转到热钱包）需要充值地址自己有 Energy 和 Bandwidth，否则要烧 TRX。常见做法是先向充值地址转少量 TRX 或把质押的 Energy 委托过去，再归集。每个充值地址都垫 TRX 会产生“灰尘”残留，量大时要算成本，用委托或租赁往往更划算。同时，多数充值地址是新地址，我推断首次收到 USDT 时合约写入新存储槽会多耗 Energy${tag('推断')}，成本估算要留余量，而且 fee_limit 要设够。</p>`)}
${call('info', '<p>固化之前区块仍可能被替换。把“确认状态”写进入账状态机，而不是收到事件就入账。</p>')}

<h2>8. 工程：在 TON 上监听充值</h2>
<p>TON 充值有两处和 EVM 完全不同：<strong>要追交易树</strong>，以及<strong>用 memo 还是用独立地址区分用户</strong>。</p>
<h3>8.1 原生 TON 与 Jetton 的区别</h3>
<ul>
<li><strong>原生 TON 币</strong>：普通外部转账，在收款账户上产生一笔入站交易，看它的 <code>in_msg</code> 即可。</li>
<li><strong>Jetton（含 USDT）</strong>：钱到的是你的<strong>Jetton 钱包合约</strong>，不是你的主钱包。要先用 Jetton Master 的 <code>get_wallet_address</code> 算出你的主钱包对应的 Jetton 钱包地址，再监听它，或者监听你主钱包收到的 transfer_notification${cite('TON 文档：查找 Jetton 钱包', 'https://docs.ton.org/contracts/standard/tokens/jettons/find')}。</li>
</ul>
<h3>8.2 Memo 还是独立地址</h3>
<p><strong>共用地址 + memo</strong>：所有用户转到同一地址，在 comment（Jetton 放 forward_payload）里写用户编号。热钱包少，但用户漏填或填错 memo 时资金无法对应，要有人工认领或退回流程。<strong>每用户独立地址</strong>：归属明确，但归集要付 gas 与存储费，每个地址还要有自己的 Jetton 钱包合约。</p>
<p>官方对支付处理的建议是：定期轮询新区块、过滤自己的地址、解析金额与附言、确认最终性后再更新账务，并配合 webhook 和定期对账补漏${cite('TON 文档：支付处理', 'https://docs.ton.org/applications/payments/overview')}。上线前要决定“memo 缺失”的处理流程（人工认领或退回）。</p>
<h3>8.3 验证一笔 Jetton 转账</h3>
<p>下面的规则是我根据 TEP-74 的消息结构推出的工程做法${tag('推断')}：</p>
${steps([
  '<strong>白名单 Jetton Master</strong>：只认已核对过的 Master 地址。USDT 的 Master 在 2026-11-22 通过 Toncenter 查到的是 <code>EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs</code>，精度 6，元数据 URI 指向 tether.to；上线前以 Tether 官方公告核对。',
  '<strong>算出自己的 Jetton 钱包</strong>：调用 Master 的 <code>get_wallet_address(你的主钱包地址)</code>，结果作为“唯一合法收款合约”。',
  '<strong>验证通知的发送者</strong>：收到 transfer_notification 时，检查这条消息的<strong>来源地址等于上一步算出的 Jetton 钱包</strong>。来源不同就是伪造。',
  '<strong>检查交易没有 aborted</strong>：Toncenter v3 的 <code>jetton/transfers</code> 返回里有 <code>transaction_aborted</code> 字段，为 true 的不能入账。',
  '<strong>确认最终性</strong>：等交易被主链块引用后再入账；附言在 <code>decoded_forward_payload.comment</code>。'
])}
${code('TYPESCRIPT', `
import { TonClient } from '@ton/ton';
import { Address, beginCell } from '@ton/core';

const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
const MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'); // 上线前核对
const OWNER = Address.parse(process.env.DEPOSIT_WALLET!);

// 向 Jetton Master 询问：这个主钱包对应的 Jetton 钱包合约是哪个
async function myJettonWallet(): Promise<Address> {
  const r = await client.runMethod(MASTER, 'get_wallet_address', [
    { type: 'slice', cell: beginCell().storeAddress(OWNER).endCell() },
  ]);
  return r.stack.readAddress();
}

// 比较地址：用 equals（解析后比原始格式），不要比较字符串
function isFromMyWallet(sender: Address, mine: Address) {
  return sender.equals(mine);
}
`)}
<p>Toncenter API v3 可以按 Master 过滤查询 Jetton 转账（<code>/api/v3/jetton/transfers?jetton_master=…</code>），返回来源与目标 Jetton 钱包、附言、<code>transaction_aborted</code> 和 <code>trace_id</code>。我在 2026-11-22 读到该 USDT Jetton 钱包的接口类型是 <code>jetton_wallet_governed</code>，说明合约带发行方治理（冻结）能力；Master 的 <code>total_supply</code> 除以 10^6 约 14.3 亿美元，远小于 Tron（该接口数字未经第三方核对）。</p>
${tryit(`<p><strong>目标：</strong>用公开接口取到一笔真实的 TRC-20 USDT 转账和一笔 TON 上的 USDT Jetton 转账，再到浏览器里核对。下面的接口调用我都在 2026-11-22 实际运行过；浏览器页面的链接格式是各浏览器的公开约定，页面布局以你看到的为准。</p>
<p><strong>A. Tron</strong></p>
<ol>
<li>终端运行：<code>curl -s "https://api.trongrid.io/v1/contracts/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t/events?event_name=Transfer&amp;only_confirmed=true&amp;limit=1"</code>。记下返回里的 <code>transaction_id</code>、<code>result.from</code>、<code>result.to</code>、<code>result.value</code>。</li>
<li>运行 <code>curl -s -X POST https://api.trongrid.io/wallet/gettransactioninfobyid -d '{"value":"你的txid"}'</code>。读 <code>receipt.energy_usage_total</code>、<code>receipt.net_fee</code>、<code>receipt.result</code>，计算如果 Energy 全靠烧，要多少 TRX（用量 × 100 sun ÷ 10^6）。</li>
<li>打开 <code>https://tronscan.org/#/transaction/你的txid</code>，核对金额、发送方、接收方、能量和带宽消耗是否与接口一致。</li>
</ol>
<p><strong>B. TON</strong></p>
<ol>
<li>终端运行：<code>curl -s "https://toncenter.com/api/v3/jetton/transfers?jetton_master=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&amp;limit=1&amp;sort=desc"</code>。</li>
<li>记下 <code>transaction_hash</code>（base64），转成十六进制：<code>echo 'base64值' | base64 -d | xxd -p -c 64</code>。</li>
<li>打开 <code>https://tonviewer.com/transaction/十六进制哈希</code>，查看这笔交易的消息列表，找出 transfer、internal_transfer、transfer_notification 各出现在哪一笔交易里。</li>
</ol>
<p>预期：Tron 一笔交易 = 一条 Transfer 事件；TON 一次转账 = 一棵多笔交易的树。</p>`)}

<h2>9. 合规视角：Tron 上的 USDT 资金流</h2>
<p>Tron 上 USDT 体量大，既是支付通道，也是执法关注对象。交易所和托管方要在入账前做地址制裁筛查与风险评分（<a href="#m11-2">M07.2 KYC、AML 与制裁筛查</a>），并在转账时按旅行规则交换发送方、接收方信息（<a href="#m11-3">M07.3 旅行规则</a>）。技术细节：名单地址要把 Base58 与十六进制归一化后再比对。本节不构成法律意见。</p>
${exercises([
  ['（算一算）某充值地址有 0 点 Energy 额度，向热钱包转一笔 USDT 实际消耗 65,000 Energy 和 345 Bandwidth（带宽也要烧）。用 100 sun/Energy 和 1,000 sun/Bandwidth 算要烧多少 TRX。若租到 65,000 Energy，要烧多少？', '<p>Energy：65,000 × 100 = 6,500,000 sun = 6.5 TRX；Bandwidth：345 × 1,000 = 345,000 sun = 0.345 TRX；合计 6.845 TRX。租到 Energy 后只烧带宽 0.345 TRX，再加上租赁费用，是否划算取决于租金价格。</p>'],
  ['一份以太坊 Solidity 合约用 <code>address(this)</code> 做 CREATE2 工厂并预测子合约地址，移植到 Tron 要改什么？', '<p>Tron 的 CREATE2 前缀是 0x41 而不是 0xff，预测地址的公式要改；虚拟机内地址仍是 20 字节，但 Base58 展示地址需转换；还要检查 80 ms 时限、没有 nonce 对重放逻辑的影响，以及 Energy 与 fee_limit。</p>'],
  ['TON 上某合约收到一条“transfer_notification”，金额 1,000,000 USDT，来源地址不是你算出的 Jetton 钱包。应该入账吗？', '<p>不应该。transfer_notification 是普通消息，任何合约都可以构造。只有来源等于 Jetton Master 对你的主钱包算出的 Jetton 钱包，才可信。</p>']
])}
${checklist([
  '能解释 Tron 的 Bandwidth 与 Energy 各付什么，并算出一笔 TRC-20 转账烧多少 TRX。',
  '能说出 TVM 与 EVM 在地址、CREATE2、nonce、EIP-1559 上的差别。',
  '能解释 TON 的 Actor 异步消息和 bounce，并画出 Jetton 转账的消息序列。',
  '能写出验证 Jetton 转账的规则：白名单 Master、算 Jetton 钱包、验证通知来源、检查 aborted。',
  '能为交易所设计 Tron 与 TON 的充值确认与假币识别规则。'
])}
${mistakes([
  ['Tron 转 USDT 不需要 TRX', '额度不够时要烧 TRX。没有质押或租赁 Energy 的地址，一笔 USDT 转账可能烧掉几个 TRX。'],
  ['看到符号是 USDT 就入账', '假币合约可以起任何符号。Tron 认合约地址，TON 认 Jetton Master 与 Jetton 钱包来源。'],
  ['TON 的转账和以太坊一样是一笔交易', 'TON 一次转账是一棵交易树，最终性、失败与退回都要沿树分析。'],
  ['TON 合约放着不管也不会出问题', '合约要持续付存储费，余额耗尽会被冻结或删除。']
])}
${recap([
  'Tron 是 USDT 转账和交易所充值的主战场，2026-11-22 聚合数据显示它承载约 52% 的 USDT 供应；引用份额必须写清口径和日期。',
  'Tron 用 Bandwidth + Energy 付费：质押 TRX 换额度，不够烧 TRX（当前 1,000 sun/带宽，100 sun/Energy）。',
  'TVM 与 EVM 差别集中在地址格式、CREATE2 前缀、无 nonce、无 EIP-1559、执行时限与 TRX 转入合约的行为。',
  'TON 是 Actor 链：主链 + 工作链 + 动态分片；合约只发异步消息，失败靠 bounce 退回。',
  'Jetton 每人一个钱包合约：验证转账要白名单 Master、算 Jetton 钱包、验证通知来源并检查 aborted。',
  '充值监听：Tron 只认 USDT 合约地址并等固化；TON 追交易树并等主链确认，memo 缺失要有处理流程。'
])}
${quiz([
  { q: '一个 Tron 账户没有任何质押，向外转一笔 TRC-20 USDT，它的手续费怎么付？', o: ['免费，Tron 不收费', 'Bandwidth 和 Energy 不够的部分烧 TRX', '必须先付一笔小费才能被打包', '手续费由收款方承担'], a: 1, why: 'Tron 按资源计费，免费 600 Bandwidth 通常不够一笔 USDT 转账，Energy 没有免费额度。缺口用 TRX 按链参数单价烧掉。没有小费竞价，也不由收款方付。' },
  { q: '为什么 Tron 充值监听要“以合约事件为准”，而不是看交易的 to 字段？', o: ['to 字段总是空的', '事件比交易更快', 'to 字段不能被查询', 'TRC-20 转账的 to 是合约地址，真实收款人在 Transfer 事件里'], a: 3, why: '调用 USDT 合约的交易，交易的 to 是合约地址，收款人和金额在 Transfer 事件的参数里。' },
  { q: '在 TON 上，transfer_notification 能证明“你确实收到了 USDT”吗？', o: ['能，它由系统生成', '能，只要金额正确', '不能单独证明，必须验证来源是你的 Jetton 钱包合约', '不能，Jetton 没有通知'], a: 2, why: '通知是普通内部消息，任何合约都可以构造；只有来源等于 Jetton Master 算出的你的 Jetton 钱包才可信。' },
  { q: '向一个尚未部署的 TON 钱包转账，用哪种地址更稳妥？', o: ['EQ 开头的可退回地址', 'UQ 开头的不可退回地址', '测试网地址', '随便哪种都一样，因为 bounce 标志不影响结果'], a: 1, why: '官方建议钱包用非可退回地址，这样即使目标尚未初始化，资金也能先记入账户。EQ 地址会让消息在目标未初始化时被退回。' }
])}
${terms([
  ['超级代表', 'Super Representative', 'Tron 中由 TRX 持有者投票选出的 27 个出块节点。'],
  ['Bandwidth / Energy', 'Bandwidth / Energy', 'Tron 的两种资源：Bandwidth 付交易字节，Energy 付合约执行；不够时按 sun（1 TRX = 1,000,000 sun）烧 TRX。'],
  ['固化块', 'Solidified block', 'Tron 中已获得约 2/3 超级代表确认、可视为最终的块。'],
  ['Actor 模型', 'Actor model', 'TON 中每个合约只通过异步消息通信的执行模型。'],
  ['bounce', 'Bounce', 'TON 中消息处理失败时把消息退回发送方的机制。'],
  ['Cell / BoC', 'Cell / Bag of Cells', 'TON 的基本数据单元，及其序列化格式。'],
  ['Jetton', 'Jetton (TEP-74)', 'TON 的同质化代币标准，由 Master 合约加每人一个 Jetton 钱包合约组成。'],
])}
` });
})();
