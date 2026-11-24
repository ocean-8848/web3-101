/* ---------- M01 子文章（1/5）：区块结构、默克尔树、共识 ---------- */
(() => {
CUR = 'm01-1';
addCh({ id: 'm01-1', nav: '区块结构', title: 'M01.1 区块结构：区块头里的每一个字段', desc: '逐字段拆开比特币与以太坊区块头，学会在浏览器上读真实区块。', html: `
<h1>M01.1 区块结构：区块头里的每一个字段</h1>
${meta(['逐一说出比特币区块头 6 个字段的含义和长度。', '读懂以太坊区块头的主要字段，知道 stateRoot、receiptsRoot、baseFeePerGas 的作用。', '在区块浏览器上对照真实区块，区分区块高度和区块哈希。'], '<a href="#m01">M01 模块总览</a>（建议先学 <a href="#m00">M00</a> 里的哈希函数）', ['hashchain'])}
${beginner(`<p><strong>区块（Block）</strong>：一批交易打成的“包”，加上一个描述这个包的“封面”。</p>
<p><strong>区块头（Block Header）</strong>：就是那个“封面”。它很小（比特币固定 80 字节），但它用哈希锁住了包里的全部内容。</p>
<p><strong>哈希（Hash）</strong>：把任意数据变成固定长度“指纹”的函数。数据改 1 位，指纹完全不同。</p>
<p><strong>区块高度（Block Height）</strong>：区块在链上的序号。第一个区块高度是 0。</p>
<p><strong>Gas</strong>：以太坊里衡量“计算工作量”的单位。每个操作消耗固定数量的 gas。</p>
<p><strong>根哈希（Root Hash）</strong>：把很多数据两两哈希、最后剩下的一个哈希。它代表全部数据。下一篇详细讲。</p>`)}

<h2>1. 一句话理解</h2>
${one('区块 = 区块头（封面：父哈希 + 内容指纹 + 时间 + 共识参数）+ 区块体（交易列表）。区块哈希只对区块头求哈希，但区块头里的根哈希锁住了全部交易。')}
${call('analogy', `<p>把区块想成一个快递箱。箱子里是交易（区块体），箱子外贴着一张快递单（区块头）。快递单上写着：上一个箱子的单号（父哈希）、箱内物品清单的指纹（默克尔根）、封箱时间（时间戳）、封箱难度（bits）。</p>
<p>任何人只要看快递单就能检查箱子有没有被调包：重新算一遍箱内物品的指纹，和单上写的对比。</p>
<p><strong>类比的局限</strong>：现实快递单可以撕掉重贴；区块头不能，因为下一个区块的快递单写着这张单的哈希。改一张单，后面所有单都要改。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m01-1"><div class="mmd-title"><span>一图看懂：区块怎样用哈希串成链</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 230" role="img" aria-label="每个区块记录上一个区块的哈希"><rect x="20" y="30" width="200" height="160" rx="10" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="120" y="56" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">区块 N−1</text><rect x="34" y="70" width="172" height="26" rx="6" fill="var(--tint)" stroke="var(--rule)" stroke-width="1.5"/><text x="42" y="88" font-size="11.5" text-anchor="start" fill="var(--ink)">prevHash: 上一块的哈希</text><rect x="34" y="102" width="172" height="26" rx="6" fill="var(--tint)" stroke="var(--rule)" stroke-width="1.5"/><text x="42" y="120" font-size="11.5" text-anchor="start" fill="var(--ink)">stateRoot · 时间戳 …</text><rect x="34" y="134" width="172" height="42" rx="6" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="42" y="152" font-size="11.5" text-anchor="start" fill="var(--ink)">交易列表</text><text x="42" y="168" font-size="11" text-anchor="start" fill="var(--ink-2)">→ 汇总成 txRoot</text><rect x="280" y="30" width="200" height="160" rx="10" fill="var(--paper)" stroke="var(--accent)" stroke-width="1.5"/><text x="380" y="56" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">区块 N</text><rect x="294" y="70" width="172" height="26" rx="6" fill="var(--tint)" stroke="var(--rule)" stroke-width="1.5"/><text x="302" y="88" font-size="11.5" text-anchor="start" fill="var(--ink)">prevHash: 上一块的哈希</text><rect x="294" y="102" width="172" height="26" rx="6" fill="var(--tint)" stroke="var(--rule)" stroke-width="1.5"/><text x="302" y="120" font-size="11.5" text-anchor="start" fill="var(--ink)">stateRoot · 时间戳 …</text><rect x="294" y="134" width="172" height="42" rx="6" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="302" y="152" font-size="11.5" text-anchor="start" fill="var(--ink)">交易列表</text><text x="302" y="168" font-size="11" text-anchor="start" fill="var(--ink-2)">→ 汇总成 txRoot</text><rect x="540" y="30" width="200" height="160" rx="10" fill="var(--paper)" stroke="var(--accent)" stroke-width="1.5"/><text x="640" y="56" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">区块 N+1</text><rect x="554" y="70" width="172" height="26" rx="6" fill="var(--tint)" stroke="var(--rule)" stroke-width="1.5"/><text x="562" y="88" font-size="11.5" text-anchor="start" fill="var(--ink)">prevHash: 上一块的哈希</text><rect x="554" y="102" width="172" height="26" rx="6" fill="var(--tint)" stroke="var(--rule)" stroke-width="1.5"/><text x="562" y="120" font-size="11.5" text-anchor="start" fill="var(--ink)">stateRoot · 时间戳 …</text><rect x="554" y="134" width="172" height="42" rx="6" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="562" y="152" font-size="11.5" text-anchor="start" fill="var(--ink)">交易列表</text><text x="562" y="168" font-size="11" text-anchor="start" fill="var(--ink-2)">→ 汇总成 txRoot</text><line x1="294" y1="83" x2="222" y2="83" stroke="var(--accent)" stroke-width="2"/><path d="M222.0 83.0 L229.2 79.5 L229.2 86.5 z" fill="var(--accent)"/><line x1="554" y1="83" x2="482" y2="83" stroke="var(--accent)" stroke-width="2"/><path d="M482.0 83.0 L489.2 79.5 L489.2 86.5 z" fill="var(--accent)"/><text x="120" y="214" font-size="12" text-anchor="middle" fill="var(--risk)">改动这里一个字节……</text><text x="380" y="214" font-size="12" text-anchor="middle" fill="var(--risk)">它的哈希就变了，N 记录的 prevHash 对不上</text><text x="640" y="214" font-size="12" text-anchor="middle" fill="var(--risk)">后面每一块都要重算</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>每个区块头都写着上一块的哈希，箭头从新块指回旧块。</span></li><li><span class="chip risk">风险</span><span>篡改历史区块，会让它之后所有区块的 prevHash 失效；要让链重新有效，必须重算并让全网接受后面所有区块。</span></li><li><span class="chip key">关键</span><span>这就是“越早的区块越难改”：确认数越多，改写成本越高。</span></li></ul></figcaption></figure>

<h2>2. 比特币区块头：80 字节，6 个字段</h2>
<p>比特币区块头固定 80 字节。矿工挖矿时反复对这 80 字节做两次 SHA-256（记作 SHA256d），直到结果小于目标值。下表按字段在区块头中的顺序排列。</p>
${tbl(['字段', '长度', '含义', '谁来定 / 怎么变'], [
  ['<code>version</code> 版本号', '4 字节', '区块遵守的规则版本。现在也用某些位给软分叉投票（BIP9）。', '矿工设置'],
  ['<code>prevHash</code> 父区块哈希', '32 字节', '上一个区块头的 SHA256d 哈希。它把区块串成链。', '由上一个区块决定，不能自选'],
  ['<code>merkleRoot</code> 默克尔根', '32 字节', '本区块所有交易的默克尔树根。改任意一笔交易，根就变。', '由交易列表算出'],
  ['<code>timestamp</code> 时间戳', '4 字节', 'Unix 秒数。必须大于前 11 个区块时间的中位数，且不能比节点本地时间超前 2 小时以上。', '矿工设置，有容差'],
  ['<code>bits</code> 难度目标', '4 字节', '目标值的压缩写法。区块哈希必须小于这个目标。', '每 2016 个区块按规则调整'],
  ['<code>nonce</code> 随机数', '4 字节', '矿工反复修改的计数器。唯一作用是改变区块头哈希。', '矿工暴力尝试']
])}
${mm('比特币区块：区块头锁住区块体，父哈希锁住历史', `
flowchart LR
  subgraph P["区块 N-1"]
    PH["区块头 80 字节"]
  end
  subgraph B["区块 N"]
    direction TB
    V["version"]
    PV["prevHash"]
    MR["merkleRoot"]
    TS["timestamp"]
    BT["bits"]
    NC["nonce"]
    BODY["区块体<br/>交易 1（coinbase）<br/>交易 2 … 交易 n"]
  end
  PH -->|"SHA256d 结果写入"| PV
  BODY -->|"两两哈希得到"| MR
  B -->|"SHA256d(区块头) 小于目标"| OK["区块有效"]
`, [
  ['flow', '父区块头的哈希写进 prevHash；交易列表的哈希树根写进 merkleRoot。两条箭头一起保证“历史不可改、内容不可改”。'],
  ['key', '区块哈希只对 80 字节的区块头求值。因为头里有 merkleRoot，所以交易也被间接锁住。'],
  ['fail', '改动区块体里任意一笔交易：merkleRoot 变化 → 区块头哈希变化 → 不再小于目标 → 区块无效，而且下一个区块的 prevHash 对不上。'],
  ['limit', 'nonce 只有 4 字节（约 43 亿种取值）。现代矿机几秒就能试完，所以矿工还会修改 coinbase 交易里的 extraNonce，从而改变 merkleRoot。']
])}
<h3>2.1 bits：目标值的压缩写法</h3>
<p><code>bits</code> 用 4 字节表示一个 256 位的目标值。第 1 个字节是“指数”，后 3 个字节是“系数”。公式：目标值 = 系数 × 256<sup>(指数 − 3)</sup>。</p>
<p><strong>算一算（示例：创世块的 bits = 0x1d00ffff）</strong></p>
${steps([
  '拆分：指数 = 0x1d = 29；系数 = 0x00ffff。',
  '代入：目标值 = 0xffff × 256<sup>26</sup>。',
  '写成 64 位十六进制：<code>0x00000000ffff0000…0000</code>（前面 8 个 0，后面补满）。',
  '含义：区块哈希的前 32 位必须全是 0。平均要试 2<sup>32</sup> ≈ 43 亿次才能挖出一个块。',
  '“难度（difficulty）”= 创世目标 ÷ 当前目标。创世块难度定义为 1。'
])}
<h3>2.2 难度调整</h3>
<p>比特币希望平均 10 分钟出一个块。每 2016 个区块（约 2 周），节点按下面规则重新计算目标值：</p>
${code('BASH', `
新目标 = 旧目标 × (最近 2016 个区块实际用时 ÷ 1,209,600 秒)
# 1,209,600 秒 = 14 天。调整幅度被限制在 1/4 到 4 倍之间。
`)}
<p><strong>算一算（示例）</strong>：最近 2016 个块只用了 12 天。新目标 = 旧目标 × 12/14 ≈ 旧目标 × 0.857。目标变小，难度变为原来的 14/12 ≈ 1.167 倍，也就是上升约 16.7%。</p>
<h3>2.3 创世块（Genesis Block）</h3>
<p>创世块是高度 0 的区块。它没有父区块，所以 <code>prevHash</code> 是 32 个全 0 字节。比特币创世块的公开数据如下：</p>
${tbl(['字段', '值'], [
  ['区块哈希', '<code>000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f</code>'],
  ['timestamp', '1231006505（2009-01-03 18:15:05 UTC）'],
  ['bits', '0x1d00ffff'],
  ['nonce', '2083236893'],
  ['merkleRoot', '<code>4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b</code>'],
  ['特点', 'coinbase 里写着当天《泰晤士报》的头条标题；50 BTC 奖励在代码层面无法花费']
])}
${call('info', `<p><strong>字节序陷阱</strong>：比特币内部按小端序（little-endian）存储哈希，浏览器显示时会把字节反转。所以你看到的区块哈希以一串 0 开头，而原始字节是以 0 结尾。自己写解析程序时，要先确认用的是哪种顺序。</p>`)}

<h2>3. 以太坊区块头：更多字段，因为要记录“状态”</h2>
<p>比特币只记“谁给谁转了多少”。以太坊还要记录每个账户的余额、合约代码和合约存储，这些合起来叫<strong>世界状态（World State）</strong>。所以以太坊区块头除了交易根，还有状态根和回执根。区块哈希 = Keccak-256(RLP 编码的区块头)。</p>
${tbl(['字段', '含义', '新手要记住的点'], [
  ['<code>parentHash</code>', '父区块头的哈希', '作用和比特币的 prevHash 一样'],
  ['<code>stateRoot</code>', '执行完本区块全部交易后，世界状态树的根', '一个 32 字节的值代表所有账户的余额和存储'],
  ['<code>transactionsRoot</code>', '本区块交易列表的树根', '用于证明“这笔交易在这个区块里”'],
  ['<code>receiptsRoot</code>', '本区块所有交易回执的树根', '回执里有成功/失败状态和事件日志'],
  ['<code>logsBloom</code>', '256 字节（2048 位）的布隆过滤器', '快速判断区块里“可能有”某合约或某事件；会误报，不会漏报'],
  ['<code>number</code>', '区块高度', '创世块是 0'],
  ['<code>gasLimit</code>', '本区块允许消耗的 gas 上限', '出块者每块只能在父块基础上调整 1/1024'],
  ['<code>gasUsed</code>', '本区块实际消耗的 gas', '决定下一块的 baseFee 涨还是跌'],
  ['<code>baseFeePerGas</code>', '每单位 gas 的基础费（EIP-1559，2021 年伦敦升级引入）', '这部分费用被销毁，不给出块者'],
  ['<code>timestamp</code>', '出块时间（Unix 秒）', 'PoS 下每个 slot 12 秒，时间戳必须对应 slot'],
  ['<code>miner</code>（feeRecipient）', '接收小费的地址', '合并后由验证者指定'],
  ['<code>extraData</code>', '最多 32 字节的自定义数据', '常见内容是构建者名字'],
  ['<code>mixHash</code>（prevRandao）', '合并后存放信标链提供的随机数', 'PoW 时代是挖矿用的字段'],
  ['<code>difficulty</code> / <code>nonce</code>', 'PoW 遗留字段', '合并后固定为 0'],
  ['<code>withdrawalsRoot</code>', '本区块质押提款列表的树根（2023 年上海升级）', '提款不是交易，单独记录'],
  ['<code>blobGasUsed</code> / <code>excessBlobGas</code>', 'Blob 数据的用量与累计超额（2024 年 Dencun 升级）', '决定 blob 费用'],
  ['<code>parentBeaconBlockRoot</code>', '父信标区块根（EIP-4788）', '让合约能验证共识层数据']
])}
${mm('以太坊区块：三棵树的根写进区块头', `
flowchart TB
  subgraph HD["区块头（RLP 编码后做 Keccak-256 = 区块哈希）"]
    PH["parentHash"]
    SR["stateRoot"]
    TR["transactionsRoot"]
    RR["receiptsRoot"]
    LB["logsBloom"]
    GAS["number / gasLimit / gasUsed<br/>baseFeePerGas / timestamp"]
  end
  subgraph BD["区块体"]
    TX["交易列表"]
    WD["提款列表"]
  end
  TX -->|"构建交易树"| TR
  TX -->|"逐笔执行"| EX["EVM 执行"]
  EX -->|"产生回执与日志"| RC["回执列表"]
  RC -->|"构建回执树"| RR
  RC -->|"合并所有日志地址与 topic"| LB
  EX -->|"更新账户余额与存储"| ST["世界状态"]
  ST -->|"状态树根"| SR
`, [
  ['flow', '交易进 EVM 执行，产出两样东西：新的世界状态（→ stateRoot）和回执（→ receiptsRoot、logsBloom）。'],
  ['key', '任何节点都能重新执行交易，算出同样的三个根。根不一致，区块就被拒绝。这就是“不信任，去验证”。'],
  ['fail', '同一笔交易在不同客户端里执行结果不同（客户端 bug），会导致 stateRoot 不一致，网络分叉。历史上多次出现过客户端共识 bug。'],
  ['limit', 'logsBloom 会误报。索引器不能只看 Bloom，还要拉取真实日志确认。']
])}
<h3>3.1 区块体与 Gas 上限</h3>
<p>以太坊区块体包含：交易列表、叔块列表（合并后永远为空）、提款列表。以太坊不按字节限制区块大小，而是按 gas 限制：区块里所有交易消耗的 gas 之和不能超过 <code>gasLimit</code>。</p>
${tbl(['对比项', '比特币', '以太坊'], [
  ['容量限制方式', '区块权重 ≤ 400 万 weight units（2017 年隔离见证后）', 'gasUsed ≤ gasLimit'],
  ['当前上限（截至 2026 年公开资料）', '约 1–4 MB，取决于交易类型', 'gasLimit 在 2025 年由验证者多次上调（3,000 万 → 3,600 万（2 月）→ 4,500 万（7 月）→ 6,000 万（11 月））' + cite('The Block：以太坊 gas limit 达到 4,500 万（2025-07）', 'https://www.theblock.co/news/ecosystems/2025-07-22-ethereum-hits-45-million-block-gas-limit-363763') + cite('The Block：以太坊 gas limit 提高到 6,000 万（2025-11）', 'https://www.theblock.co/news/ecosystems/2025-11-27-ethereum-block-gas-limit-fusaka-380687')],
  ['谁能调整', '需要共识规则变更（分叉）', '出块者每块最多调 1/1024，长期看验证者投票'],
  ['目标利用率', '无', 'gasLimit 的一半；用多了 baseFee 上涨']
])}
<p><strong>算一算（示例：baseFee 怎么变）</strong>：设 gasLimit = 6,000 万，则目标 = 3,000 万。当前 baseFee = 10 gwei，本块 gasUsed = 4,500 万。</p>
${steps([
  '超出目标的比例 = (4,500 万 − 3,000 万) ÷ 3,000 万 = 0.5。',
  '调整幅度 = 0.5 × 1/8 = 6.25%（单块最多 ±12.5%）。',
  '下一块 baseFee = 10 × 1.0625 = 10.625 gwei。',
  '如果区块满了（gasUsed = 6,000 万），下一块涨 12.5%；如果区块空了，跌 12.5%。'
])}
<p>想动手调参数，可以看 <a href="#lab-eip1559">EIP-1559 费用实验</a>。</p>

<h2>4. 区块高度 vs 区块哈希</h2>
<p>新手最常犯的错误：把“高度”当成区块的唯一标识。高度只是序号；哈希才是身份证。</p>
${tbl(['', '区块高度（number）', '区块哈希（hash）'], [
  ['是什么', '从 0 开始的序号', '区块头的哈希值'],
  ['唯一吗', '不唯一。重组时同一高度会出现两个不同区块', '唯一。不同内容几乎不可能有同一哈希'],
  ['会变吗', '同一高度上的区块可能被替换', '哈希一旦算出就固定，区块被孤立后哈希依然存在'],
  ['适合做什么', '扫块游标、计算确认数', '数据库主键、判断是否发生重组']
])}
${mm('同一高度、两个区块：为什么要存哈希', `
flowchart LR
  A["高度 100<br/>hash 0xaa…"] --> B1["高度 101<br/>hash 0xb1…"]
  A --> B2["高度 101<br/>hash 0xb2…"]
  B2 --> C2["高度 102<br/>parentHash 0xb2…"]
  B1 -.->|"被孤立"| X["不再属于主链"]
`, [
  ['flow', '两个出块者几乎同时在高度 101 出块。网络暂时分成两派。'],
  ['key', '高度 102 的区块指向 0xb2…，所以 0xb2… 胜出。0xb1… 被孤立（orphan / uncle）。'],
  ['risk', '如果你的数据库只用高度做主键，就会把 0xb1… 里的交易当成有效充值。<a href="#m01-8">M01.8 索引器工程</a>详细讲回滚算法。']
])}
<p>用 JSON-RPC 读一个区块头时，返回值大致如下（字段值为示例，已截断）：</p>
${code('JSON', `
{
  "number": "0x1312d00",
  "hash": "0x9f1c…",
  "parentHash": "0x4b2a…",
  "stateRoot": "0x7d3e…",
  "transactionsRoot": "0x1a8c…",
  "receiptsRoot": "0x5e0f…",
  "logsBloom": "0x0020…（512 个十六进制字符）",
  "gasLimit": "0x2160ec0",
  "gasUsed": "0x10b0760",
  "baseFeePerGas": "0x2540be400",
  "timestamp": "0x6720a1b3",
  "miner": "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
  "transactions": ["0x…", "0x…"]
}
`)}
<p>所有数字都是十六进制。例如 <code>0x1312d00</code> = 20,000,000（高度两千万）；<code>0x2540be400</code> = 10,000,000,000 wei = 10 gwei。<a href="#m01-5">M01.5</a> 会系统讲换算。</p>

<h2>5. 在浏览器上对照真实区块</h2>
${tryit(`<ol>
<li>打开 mempool.space，搜索比特币创世块哈希 <code>000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f</code>。找到 Timestamp、Bits、Nonce、Merkle root 四个值，和上面表格对比。<strong>预期</strong>：完全一致。</li>
<li>点进高度 1 的区块，找到它的 Previous block hash。<strong>预期</strong>：等于创世块哈希。</li>
<li>打开 etherscan.io，搜索区块 <code>15537394</code>（2022 年 9 月以太坊“合并”后的第一个 PoS 区块）。找到 Fee Recipient、Gas Used、Gas Limit、Base Fee Per Gas、Burnt Fees。<strong>预期</strong>：Burnt Fees ≈ Base Fee Per Gas × Gas Used。</li>
<li>再打开最新的区块，点 “More Details”，找到 Parent Hash、StateRoot、Withdrawals Root。点击 Parent Hash，确认它跳到高度减 1 的区块。</li>
</ol>`)}
<p>想直观感受“改一笔交易会让后面全部失效”，做下面的实验：先点“全部挖矿”，再修改区块 #2 的数据，观察后续区块变红。</p>
${lab('hashchain')}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['数据库用区块哈希做主键，高度只做索引', '同一高度可能有多个区块', '查看 DDL：<code>blocks.hash</code> 是唯一键'],
  ['每个新区块都校验 parentHash', '这是发现重组的唯一可靠信号', '构造一个父哈希不一致的测试块，看是否触发回滚'],
  ['数字字段用大整数类型', 'gas、wei、baseFee 会超过 64 位浮点精度', 'Go 用 <code>*big.Int</code>，SQL 用 <code>NUMERIC(78,0)</code>'],
  ['时间戳不当作精确时间', '比特币时间戳有约 2 小时容差', '业务时间用本地接收时间 + 区块时间两列'],
  ['不依赖 logsBloom 下结论', 'Bloom 会误报', '命中后必须拉取真实日志']
])}

${mistakes([
  ['区块哈希是对整个区块（包括所有交易）做哈希。', '区块哈希只对区块头求值。交易通过区块头里的默克尔根被间接锁定。'],
  ['区块高度可以唯一标识一个区块。', '重组时同一高度会有不同区块。唯一标识是区块哈希。'],
  ['nonce 是“挖矿答案”，有固定的正确值。', 'nonce 只是一个可变计数器。任何让哈希小于目标的 nonce 都可以，同一区块可能有多个合格 nonce。'],
  ['以太坊区块大小按字节限制。', '以太坊按 gasLimit 限制计算量，没有比特币那样的字节权重上限（另有协议层的 RLP 大小保护上限）。'],
  ['baseFee 给了出块者。', 'baseFee 被销毁。出块者只得到小费（priority fee）。']
])}
${recap([
  '比特币区块头 80 字节：version、prevHash、merkleRoot、timestamp、bits、nonce。',
  '区块哈希 = 对区块头做哈希；默克尔根把交易锁进区块头；父哈希把区块锁成链。',
  'bits 是目标值的压缩写法；每 2016 块按实际用时调整难度，幅度限制在 4 倍以内。',
  '以太坊区块头多了 stateRoot、receiptsRoot、logsBloom、gasLimit、baseFeePerGas 等字段，用来记录状态和费用。',
  '高度是序号，哈希是身份证。数据库主键用哈希，并对每个块校验 parentHash。'
])}
${quiz([
  { q: '比特币区块头中，哪个字段把当前区块和上一个区块连起来？', o: ['merkleRoot', 'prevHash', 'bits', 'nonce'], a: 1, why: 'prevHash 存的是上一个区块头的哈希。merkleRoot 锁住本块交易；bits 是难度目标；nonce 是挖矿计数器。' },
  { q: '最近 2016 个比特币区块用了 28 天。下一次调整后难度怎样变化？', o: ['上升约 2 倍', '不变', '下降为原来的一半', '下降为原来的 1/4'], a: 2, why: '新目标 = 旧目标 × 28/14 = 2 倍，目标变大意味着难度减半。调整幅度在 1/4 到 4 倍之内，所以不会被截断。' },
  { q: 'gasLimit = 6,000 万，baseFee = 20 gwei，本块 gasUsed = 6,000 万。下一块 baseFee 是多少？', o: ['20 gwei', '17.5 gwei', '40 gwei', '22.5 gwei'], a: 3, why: '区块满载，超出目标 100%，调整幅度 = 1 × 1/8 = 12.5%。20 × 1.125 = 22.5 gwei。' },
  { q: '你的索引器用什么判断“发生了重组”？', o: ['新区块的 parentHash 不等于库中上一高度的区块哈希', '新区块的高度小于库中最高高度', '新区块的 gasUsed 为 0', '新区块的时间戳比上一块早'], a: 0, why: '父哈希不连续是重组的直接证据。高度、gasUsed 和时间戳都不能可靠说明链发生了切换。' }
])}
${exercises([["计算题（示例）：某区块的 bits = 0x1c00ffff。写出目标值的计算式，并求它的难度。", "<p>指数 = 0x1c = 28，系数 = 0xffff。目标值 = 0xffff × 256^(28 − 3) = 0xffff × 256²⁵。创世目标是 0xffff × 256²⁶。难度 = 创世目标 ÷ 当前目标 = 256。</p>"], ["计算题（示例）：gasLimit = 6,000 万，当前 baseFee = 20 gwei，本块 gasUsed = 1,500 万。下一块的 baseFee 是多少？", "<p>目标 = gasLimit 的一半 = 3,000 万。偏离比例 = (1,500 万 − 3,000 万) ÷ 3,000 万 = −0.5。调整幅度 = −0.5 × 1/8 = −6.25%。下一块 baseFee = 20 × (1 − 0.0625) = 18.75 gwei。</p>"], ["设计题：为索引器设计 blocks 表的关键约束。哪个字段做唯一键？高度怎么用？每个新区块要做什么检查？", "<p>区块哈希做唯一键，因为重组时同一高度会有不同区块。高度只做索引，用于扫块游标和计算确认数。每个新区块都要校验 parentHash 等于库中上一高度的哈希，对不上就是重组。gas、wei 等数字字段用大整数类型，例如 SQL 的 NUMERIC(78,0)。</p>"]])}
${checklist(["能按顺序说出比特币区块头 6 个字段及其长度。", "能从 bits 值手算目标值和难度。", "能手算 EIP-1559 下一块的 baseFee。", "在 Etherscan 上对照过真实区块的 Parent Hash、Gas Used、Base Fee Per Gas 和 Burnt Fees。", "能说明数据库为什么用区块哈希做唯一键，并对每个块校验 parentHash。"])}
${terms([
  ['区块头', 'Block Header', '区块的元数据，包含父哈希、内容根哈希、时间和共识参数'],
  ['区块体', 'Block Body', '区块中的交易列表（以太坊还有提款列表）'],
  ['父哈希', 'Parent Hash / prevHash', '上一个区块头的哈希，把区块连成链'],
  ['难度目标', 'Target / bits', 'PoW 中区块哈希必须小于的数值；bits 是它的压缩写法'],
  ['创世块', 'Genesis Block', '高度为 0、没有父区块的第一个区块'],
  ['世界状态', 'World State', '以太坊所有账户的余额、nonce、代码和存储的集合'],
  ['状态根', 'State Root', '世界状态树的根哈希，写在以太坊区块头中'],
  ['布隆过滤器', 'Bloom Filter', '能快速判断“可能包含”的概率数据结构，会误报不会漏报'],
  ['区块 Gas 上限', 'Block Gas Limit', '一个以太坊区块内所有交易可消耗 gas 的总上限']
])}
` });

CUR = 'm01-2';
addCh({ id: 'm01-2', nav: '默克尔树与轻节点', title: 'M01.2 默克尔树与轻节点：用几个哈希证明一笔交易', desc: '亲手构建默克尔树、生成和验证证明，理解 SPV、MPT 与空投白名单。', html: `
<h1>M01.2 默克尔树与轻节点：用几个哈希证明一笔交易</h1>
${meta(['手工构建 4 叶和 8 叶默克尔树，处理奇数叶子。', '生成并验证默克尔证明，说出证明长度为什么是 log₂(n)。', '用 Solidity 的 MerkleProof 实现空投白名单校验，并理解 SPV 和 MPT。'], '<a href="#m01-1">M01.1 区块结构</a>', ['merkle'])}
${beginner(`<p><strong>叶子（Leaf）</strong>：树最底层的节点。在区块里，每个叶子是一笔交易的哈希。</p>
<p><strong>兄弟节点（Sibling）</strong>：和你一起被合并哈希的那个节点。左边节点的兄弟在右边，反之亦然。</p>
<p><strong>证明（Proof）</strong>：从叶子走到根时需要的所有兄弟哈希。拿到它，就能自己算出根。</p>
<p><strong>轻节点（Light Client）</strong>：只下载区块头、不下载全部交易的节点。手机钱包常用这种方式。</p>
<p><strong>白名单（Allowlist）</strong>：允许领取空投或参与活动的地址列表。</p>`)}

<h2>1. 一句话理解</h2>
${one('默克尔树把 n 个数据两两哈希，压缩成 1 个 32 字节的根；要证明某个数据在里面，只需要 log₂(n) 个兄弟哈希。')}
${call('analogy', `<p>想象一场 8 人淘汰赛。每轮两两比赛，胜者进入下一轮，最后剩下冠军（根）。你想证明“选手 3 参加了比赛”，不用拿出全部对阵表，只要拿出：第 1 轮他的对手、第 2 轮他那组对手的胜者、决赛的对手。3 个名字就够了。</p>
<p><strong>类比的局限</strong>：淘汰赛只有一个胜者往上走；默克尔树是把两个哈希“合并”成新哈希往上走，两边的信息都被保留在结果里。</p>`)}
${art('一图看懂：默克尔树把一堆交易压成 1 个根，证明只需几个兄弟', 660, 335, [
  S.text(245, 22, '4 笔交易的树（哈希只列前 8 位）', { size: 12, dim: 1, anchor: 'middle' }),
  S.box(125, 34, 240, 52, { k: 'info', t: '根 773bc304…', s: 'SHA-256(H12 ‖ H34)', mono: 1 }),
  S.box(44, 128, 160, 52, { k: 'ok', t: 'H12 兄弟', s: 'f8f28ede = 哈希(H1‖H2)', mono: 1 }),
  S.box(286, 128, 160, 52, { k: 'info', t: 'H34', s: '850cf301 = 哈希(H3‖H4)', mono: 1 }),
  S.box(10, 222, 107, 52, { k: 'idle', dash: 1, t: 'H1', s: '709b55bd', mono: 1 }),
  S.box(131, 222, 107, 52, { k: 'idle', dash: 1, t: 'H2', s: '27ca64c0', mono: 1 }),
  S.box(252, 222, 107, 52, { k: 'key', t: 'H3 要证明', s: '1f3cb18e', mono: 1 }),
  S.box(373, 222, 107, 52, { k: 'ok', t: 'H4 兄弟', s: '41b637cf', mono: 1 }),
  S.arrow(124, 130, 190, 88, { k: 'plain' }),
  S.arrow(366, 130, 300, 88, { k: 'plain' }),
  S.arrow(63, 220, 63, 182, { k: 'plain' }),
  S.arrow(184, 220, 184, 182, { k: 'plain' }),
  S.arrow(305, 220, 330, 182, { k: 'plain' }),
  S.arrow(426, 220, 400, 182, { k: 'plain' }),
  S.box(510, 34, 140, 52, { k: 'info', icon: 'block', t: '区块头', s: '只存这个根' }),
  S.arrow(367, 60, 508, 60, { k: 'info', label: '写进区块头' }),
  S.text(580, 140, '轻节点验证 tx3\n只拿区块头\n再要 2 个兄弟', { size: 12, dim: 1, anchor: 'middle', mw: 130 }),
  S.text(330, 312, '证明长度 = ⌈log₂ n⌉：8 笔交易只要 3 个兄弟，1000 笔也只要 10 个（示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '从下往上两两哈希，每层减半，直到只剩 1 个根；区块头只存这 32 字节。'],
  ['key', '证明 tx3：只要 H4 和 H12 两个兄弟，自己算出根，再和区块头里的根对比。'],
  ['fail', '兄弟在左还是在右必须记清，顺序错了算出的根就错。'],
  ['limit', '默克尔证明只能证明“在树里”，不能证明“不在树里”。']
], '4 个叶子的默克尔树：H1 到 H4 两两哈希得到 H12、H34，再得到写进区块头的根；证明交易 3 只需要兄弟 H4 和 H12', 'm01-2')}

<h2>2. 构建默克尔树：一步一步</h2>
${steps([
  '对每笔交易求哈希，得到叶子哈希 H1、H2、…、Hn。',
  '从左到右两两配对：父节点 = Hash(左 ‖ 右)，“‖”表示拼接。',
  '如果这一层节点数是奇数：比特币的做法是<strong>复制最后一个节点</strong>，和自己配对。',
  '重复第 2–3 步，直到只剩 1 个节点。这个节点就是默克尔根。',
  '把根写进区块头。'
])}
${mm('8 个叶子的默克尔树：每层减半，3 层到根', `
flowchart LR
  L["8 个叶子<br/>H1 … H8"] -->|"两两哈希"| M1["4 个节点<br/>H(12) H(34) H(56) H(78)"]
  M1 -->|"两两哈希"| M2["2 个节点<br/>H(1-4) H(5-8)"]
  M2 -->|"两两哈希"| R["根 Root<br/>32 字节"]
  class R key
`, [
  ['key', '8 个叶子，树高 3，证明长度 3。n 个叶子，证明长度 = ⌈log₂ n⌉。'],
  ['flow', '每一层把节点数减半：8 → 4 → 2 → 1，最后的根写进区块头。']
])}
${mm('证明 Tx3：只需 3 个兄弟哈希', `
flowchart TB
  L3["H3 ← 要证明"] --> A2["H(34)"]
  L4["兄弟 H4（在右）"] -.-> A2
  A2 --> A["H(1-4)"]
  A1["兄弟 H(12)（在左）"] -.-> A
  A --> R["根 Root"]
  B["兄弟 H(5-8)（在右）"] -.-> R
  style L3 stroke-width:3px
`, [
  ['flow', '计算路径：H3 → H(34) → H(1-4) → 根。每上一层需要一个兄弟：H4、H(12)、H(5-8)（虚线）。'],
  ['fail', '兄弟在左还是在右必须记清楚。Hash(A‖B) ≠ Hash(B‖A)。顺序错了，算出的根就错。'],
  ['limit', '默克尔证明只能证明“某数据在树里”，不能证明“某数据不在树里”。']
])}
<h3>2.1 算一算：4 个叶子（示例）</h3>
<p>为了教学，本篇和下面的实验都用这个约定：叶子 = SHA-256(交易文本)；父节点 = SHA-256(左哈希的十六进制字符串 + 右哈希的十六进制字符串)。比特币实际做法是对原始字节拼接后做两次 SHA-256，原理相同。</p>
${tbl(['节点', '计算', '结果（前 16 位）'], [
  ['H1', 'SHA-256("tx1")', '<code>709b55bd3da0f5a8…</code>'],
  ['H2', 'SHA-256("tx2")', '<code>27ca64c092a959c7…</code>'],
  ['H3', 'SHA-256("tx3")', '<code>1f3cb18e896256d7…</code>'],
  ['H4', 'SHA-256("tx4")', '<code>41b637cfd9eb3e2f…</code>'],
  ['H12', 'SHA-256(H1 ‖ H2)', '<code>f8f28ede97956703…</code>'],
  ['H34', 'SHA-256(H3 ‖ H4)', '<code>850cf301915d09eb…</code>'],
  ['根', 'SHA-256(H12 ‖ H34)', '<code>773bc304a3b0a626…</code>']
])}
<p><strong>证明 tx3</strong>：证明 = [ (H4, 在右), (H12, 在左) ]。验证者手里只有“tx3”和根：</p>
${steps([
  '算 H3 = SHA-256("tx3") = 1f3cb18e…',
  '第 1 个兄弟 H4 在右：算 SHA-256(H3 ‖ H4) = 850cf301…（得到 H34）。',
  '第 2 个兄弟 H12 在左：算 SHA-256(H12 ‖ H34) = 773bc304…',
  '和区块头里的根对比：相等 → tx3 在这个区块里。'
])}
<p><strong>奇数叶子（示例：只有 tx1、tx2、tx3）</strong>：第一层是 H1、H2、H3，共 3 个。复制 H3，得到 H33 = SHA-256(H3 ‖ H3) = d2cd3d59…；根 = SHA-256(H12 ‖ H33) = fbf8b59f…</p>
${call('deep', `<p><strong>复制最后一个节点的坑（CVE-2012-2459）</strong>：因为最后一个叶子被复制，交易列表 [tx1, tx2, tx3] 和 [tx1, tx2, tx3, tx3] 算出同一个根。攻击者可以构造一个“重复交易”的无效区块，让节点误把同一个根标记为无效。比特币客户端后来增加了专门检查。自己设计默克尔树时，更安全的做法是：奇数时把最后一个节点直接提升到上一层，或在叶子和内部节点前加不同前缀（RFC 6962 的做法）。</p>`)}

<h2>3. 交互实验：构建、证明、篡改</h2>
<p>先做：点击任意叶子（例如第 3 个），观察高亮的兄弟节点和计算路径，然后点“验证证明”。再做：修改任意一个叶子的文本，观察根哈希变化，再次点“验证证明”，看旧证明失败。最后拖动下方滑块，比较“下载证明”和“下载全部数据”的差距。</p>
${lab('merkle')}

<h2>4. SPV 轻节点：只下区块头也能验证付款</h2>
<p>中本聪在比特币白皮书第 8 节提出<strong>简化支付验证（SPV, Simplified Payment Verification）</strong>：轻节点只下载区块头链，需要验证某笔付款时，向全节点要这笔交易的默克尔证明。</p>
${mm('SPV 验证流程', `
sequenceDiagram
  participant W as 手机钱包（轻节点）
  participant F as 全节点
  W->>F: 同步全部区块头（每个 80 字节）
  W->>W: 校验每个头的 PoW 和 prevHash 连续
  W->>F: 请求交易 T 的默克尔证明
  F-->>W: 返回 T、所在区块哈希、兄弟哈希列表
  W->>W: 用证明算出根，对比该区块头的 merkleRoot
  W->>W: 统计该区块之后的区块数，作为确认数
`, [
  ['flow', '轻节点信任的是“最多工作量的区块头链”，不是某个全节点。全节点无法伪造证明，因为根写在有 PoW 的区块头里。'],
  ['fail', '全节点可以<strong>隐瞒</strong>交易：它说“没有这笔交易”，轻节点无法反驳。所以 SPV 要连接多个节点。'],
  ['limit', 'SPV 只能证明交易被打包，不能验证交易本身是否合规（例如是否双花了更早的输出）。它假设多数算力诚实。'],
  ['risk', '攻击者如果短期控制多数算力，可以给轻节点喂一条伪造的更长链。大额收款要等更多确认。']
])}
<p><strong>算一算（示例：下载量对比）</strong></p>
${steps([
  '比特币每天约 144 个区块。一年区块头 = 144 × 365 × 80 字节 ≈ 4.2 MB。',
  '假设一个区块有 4,000 笔交易。证明长度 = ⌈log₂ 4000⌉ = 12 个哈希 = 12 × 32 = 384 字节。',
  '对比：下载整个区块约 1–2 MB。证明只有它的约 1/3000。'
])}

<h2>5. 以太坊的默克尔帕特里夏树（MPT）</h2>
<p>比特币的默克尔树只需要证明“交易在列表里”。以太坊还要证明“账户 X 的余额是 Y”，而且每个区块都有大量账户被修改。所以以太坊用了<strong>默克尔帕特里夏树（MPT, Merkle Patricia Trie）</strong>：一种按键查找的树，每个节点也带哈希。</p>
${tbl(['特性', '普通默克尔树', 'MPT'], [
  ['按什么组织', '叶子顺序', '键（key）的十六进制路径，每层最多 16 个分叉'],
  ['能否按键查找', '不能', '能：沿着 keccak256(地址) 的每一位往下走'],
  ['局部更新', '修改一个叶子要重算路径', '同样只重算从叶子到根的路径，其他子树复用'],
  ['节点类型', '只有一种', '分支节点（16 路 + 值）、扩展节点（压缩公共前缀）、叶子节点'],
  ['以太坊用在哪', '—', '状态树、每个合约的存储树、交易树、回执树']
])}
${mm('以太坊状态根的直观结构', `
flowchart TB
  H["区块头 stateRoot"] --> S["状态树（MPT）<br/>键 = keccak256(地址)"]
  S --> A1["账户 Alice<br/>nonce, balance<br/>storageRoot 空, codeHash 空"]
  S --> A2["合约 USDC<br/>nonce, balance<br/>storageRoot, codeHash"]
  A2 --> ST["存储树（MPT）<br/>键 = keccak256(槽位)"]
  ST --> V1["槽位：Bob 的余额"]
  ST --> V2["槽位：总供应量"]
  A2 --> CODE["合约字节码<br/>按 codeHash 存储"]
`, [
  ['flow', '账户 = [nonce, balance, storageRoot, codeHash] 四个字段。合约账户的 storageRoot 指向它自己的存储树。'],
  ['key', '任何一个账户的任何一个存储槽变化，都会让 stateRoot 变化。一个 32 字节的值代表整个以太坊的状态。'],
  ['limit', 'MPT 证明较大（每层分支节点最多 16 个哈希，约数 KB）。社区研究用 Verkle 树等结构缩小证明，截至 2026 年尚未上线主网。'],
  ['fail', '状态树很大，随机读写多，全节点磁盘 IO 是主要瓶颈。这也是节点需要 NVMe SSD 的原因。']
])}
<p>实践中，你可以用 JSON-RPC 方法 <code>eth_getProof</code>（EIP-1186）获取某账户及其存储槽的 MPT 证明，再对照区块头的 stateRoot 验证。跨链桥和轻客户端都依赖这个能力。</p>

<h2>6. 应用：空投白名单与储备金证明</h2>
<h3>6.1 空投白名单</h3>
<p>项目方要给 10 万个地址空投代币。如果把 10 万个地址都写进合约存储，部署成本极高（每个新存储槽写入约 2 万 gas）。默克尔方案只在合约里存 1 个根：</p>
${mm('默克尔空投：链下建树，链上只存根', `
flowchart LR
  L["名单 CSV<br/>地址 + 数量"] --> T["链下脚本建树"]
  T --> RT["根 root"]
  T --> PF["每个地址的证明<br/>发布到网站或 IPFS"]
  RT --> C["合约 MerkleDistributor<br/>只存 root"]
  U["用户"] -->|"claim(数量, 证明)"| C
  PF --> U
  C -->|"校验通过并标记已领"| TK["转出代币"]
`, [
  ['flow', '项目方链下计算根并写入合约。用户领取时提交自己的数量和证明，合约现场验证。'],
  ['key', '合约存储从 10 万条变成 1 个 bytes32。验证成本 ≈ 证明长度 × 一次 keccak256，约 17 层 × 几十 gas。'],
  ['risk', '必须记录“已领取”。否则同一个证明可以反复领取。'],
  ['fail', '链下脚本和合约的叶子编码规则必须完全一致（abi.encode 还是 encodePacked、是否双重哈希、兄弟是否排序），否则所有证明都验证失败。']
])}
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MerkleAirdrop {
    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;      // 链下计算好的根
    mapping(address => bool) public claimed;  // 防止重复领取

    constructor(IERC20 _token, bytes32 _root) {
        token = _token;
        merkleRoot = _root;
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        require(!claimed[msg.sender], "already claimed");
        // 叶子编码与 OpenZeppelin StandardMerkleTree（JS 库）一致：
        // 先 abi.encode，再做两次 keccak256，防止“第二原像”攻击
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "invalid proof");
        claimed[msg.sender] = true;            // 先改状态，再转账
        require(token.transfer(msg.sender, amount), "transfer failed");
    }
}
`)}
${call('info', `<p><strong>OpenZeppelin 的 MerkleProof 对兄弟对做排序哈希</strong>：每一步计算 Hash(min(a,b) ‖ max(a,b))。所以证明里不需要记录“左还是右”。链下必须用同样规则建树，推荐直接用 <code>@openzeppelin/merkle-tree</code> 的 <code>StandardMerkleTree.of(values, ["address", "uint256"])</code>。</p>
<p><strong>为什么叶子要双重哈希</strong>：叶子和内部节点都是 32 字节。如果叶子只哈希一次，攻击者可能把一个内部节点（64 字节拼接的结果）伪装成叶子提交。双重哈希让叶子和内部节点的“形状”不同。</p>`)}
<p>白名单证明会暴露你是哪片叶子；想证明“我在名单里”又不暴露是谁，见 <a href="#m10-7">M06.7 实战：成员证明</a> 和 <a href="#lab-zkmember">匿名成员证明实验</a>。</p>
<h3>6.2 储备金证明（Proof of Reserves）</h3>
<p>2022 年 11 月 FTX 倒闭后，Binance、OKX 等多家交易所宣布公布基于默克尔树的储备金证明。${cite('The Block：中心化交易所争相证明储备（2022-11）', 'https://www.theblock.co/post/185873/centralized-exchanges-are-scrambling-in-attempts-to-prove-their-reserves')}基本做法：</p>
${steps([
  '交易所把每个用户的（用户 ID 哈希, 余额）作为叶子，构建<strong>默克尔求和树（Merkle Sum Tree）</strong>：每个内部节点同时记录哈希和子节点余额之和。',
  '公布根哈希和根上的总负债。',
  '每个用户拿到自己的证明，验证自己的余额被计入总负债。',
  '交易所另外证明链上地址的控制权和总资产（例如用这些地址签名一条消息）。',
  '对比：链上资产 ≥ 默克尔树总负债 → 足额储备。'
])}
${call('warn', `<p>储备金证明有明确局限：它只证明某一时刻的快照；不证明交易所没有链下负债；余额为负的账户会被藏起来（求和树需要零知识证明约束“每个叶子 ≥ 0”）。所以它是必要条件，不是充分条件。<a href="#m04-8">M10.9 风控对账与储备金证明</a>会做完整设计。</p>`)}
${tryit(`<ol>
<li>在本地新建目录，运行 <code>npm i @openzeppelin/merkle-tree</code>。</li>
<li>写一个脚本：<code>const t = StandardMerkleTree.of([["0x1111111111111111111111111111111111111111","100"],["0x2222222222222222222222222222222222222222","200"]], ["address","uint256"]); console.log(t.root); console.log(t.getProof(0));</code></li>
<li>运行 <code>node</code> 执行脚本。<strong>预期</strong>：输出一个 0x 开头的根，以及一个只含 1 个哈希的证明数组（2 个叶子，证明长度 1）。</li>
<li>再调用 <code>t.verify(0, t.getProof(0))</code>，<strong>预期</strong>：返回 true。把数量改成 "101" 再验证，<strong>预期</strong>：false。</li>
</ol>`)}

${mistakes([
  ['默克尔证明可以证明某笔交易“不在”区块里。', '普通默克尔树只能证明存在。证明不存在需要排序树（相邻两叶夹住目标）或稀疏默克尔树。'],
  ['证明长度和叶子数量成正比。', '证明长度 = ⌈log₂ n⌉。叶子从 1,000 增加到 100 万，证明只从 10 个哈希增加到 20 个。'],
  ['轻节点相信给它数据的那个全节点。', '轻节点相信有工作量的区块头链。全节点不能伪造证明，但可以隐瞒数据，所以要连接多个节点。'],
  ['链下建树随便用什么编码，合约能验证就行。', '链下与合约的叶子编码、哈希函数、兄弟排序规则必须逐字节一致，否则全部验证失败。'],
  ['储备金证明能证明交易所完全没问题。', '它只证明快照时刻的负债被计入，不能证明没有链下负债，也不能单独阻止挪用。']
])}
${recap([
  '构建：叶子哈希 → 两两拼接再哈希 → 直到剩一个根；奇数层比特币复制最后一个节点。',
  '证明 = 从叶子到根路上的兄弟哈希，长度 ⌈log₂ n⌉；验证 = 用证明重新算根并对比。',
  'SPV 轻节点只下载区块头，用默克尔证明验证交易被打包；它能防伪造，不能防隐瞒。',
  '以太坊用 MPT 组织状态，账户 = [nonce, balance, storageRoot, codeHash]；stateRoot 代表全部状态。',
  '空投白名单：链上只存根，用户提交证明，合约记录已领取；叶子编码要与链下一致。'
])}
${quiz([
  { q: '一棵默克尔树有 1,048,576（2²⁰）个叶子。证明一个叶子需要多少个兄弟哈希？', o: ['1,048,576', '1,024', '20', '10'], a: 2, why: '证明长度 = log₂(2²⁰) = 20。1,024 是 √n，和默克尔树无关。' },
  { q: '比特币构建默克尔树时，某一层有 5 个节点。下一层有几个节点？', o: ['3 个（最后一个节点复制后和自己配对）', '2 个（最后一个节点丢弃）', '5 个', '4 个'], a: 0, why: '5 个节点复制最后一个变成 6 个，两两配对得到 3 个。比特币不丢弃节点。' },
  { q: '空投合约只校验了默克尔证明，没有记录 claimed。会发生什么？', o: ['证明会失效', '同一地址可以用同一证明反复领取，直到合约代币被领空', '合约无法部署', '没有影响，证明只能用一次'], a: 1, why: '默克尔证明是静态数据，可以重复提交。必须用 mapping 或位图记录已领取。' },
  { q: '关于 SPV 轻节点，哪个说法正确？', o: ['它会下载并执行所有交易', '它只信任连接的第一个全节点', '它能证明交易不存在', '它只下载区块头，用默克尔证明确认交易被打包'], a: 3, why: 'SPV 只同步区块头并校验工作量，通过默克尔证明确认交易在某个区块里。它不执行交易，也不能证明不存在。' }
])}
${exercises([["计算题（示例）：比特币某区块只有 5 笔交易。按比特币规则建树，每一层各有几个节点？证明其中一笔交易需要几个兄弟哈希？", "<p>第 0 层 5 个叶子，奇数，复制最后一个变成 6 个，得到第 1 层 3 个节点。第 1 层仍是奇数，复制后变 4 个，得到第 2 层 2 个节点。第 3 层是根。树高 3，证明长度 = ⌈log₂ 5⌉ = 3 个兄弟哈希。</p>"], ["计算题（示例）：项目方要给 100 万个地址空投。每个默克尔证明有多少个哈希、多少字节？如果改为把每个地址写进合约存储，大约要多少 gas？", "<p>证明长度 = ⌈log₂ 1,000,000⌉ = 20 个哈希（2²⁰ = 1,048,576）。字节数 = 20 × 32 = 640 字节。每个新存储槽写入约 2 万 gas，100 万个槽约 200 亿 gas。默克尔方案只存 1 个 bytes32 根。</p>"], ["思考题：一家交易所公布了储备金证明，你验证了自己的余额在默克尔求和树里。这能说明交易所足额储备吗？", "<p>不能完全说明。它只证明某一时刻的快照。它不证明交易所没有链下负债。余额为负的账户可能被藏起来，需要零知识证明约束每个叶子 ≥ 0。交易所还要另外证明链上资产 ≥ 总负债。所以它是必要条件，不是充分条件。</p>"]])}
${checklist(["能手工构建 4 叶默克尔树，并按比特币规则处理奇数叶子。", "能用兄弟哈希列表验证一条默克尔证明，并记清左右顺序。", "能手算 n 个叶子的证明长度。", "能写出带 claimed 记录、叶子双重哈希的 Merkle 空投 claim 函数。", "能说出 SPV 轻节点能防什么、不能防什么。"])}
${terms([
  ['默克尔树', 'Merkle Tree', '把数据两两哈希、最终得到一个根哈希的二叉树'],
  ['默克尔根', 'Merkle Root', '默克尔树最顶端的哈希，代表全部叶子'],
  ['默克尔证明', 'Merkle Proof', '从叶子到根路径上的兄弟哈希列表'],
  ['简化支付验证', 'SPV, Simplified Payment Verification', '只用区块头和默克尔证明验证交易被打包的方法'],
  ['轻节点', 'Light Client', '只同步区块头、按需请求证明的节点'],
  ['默克尔帕特里夏树', 'MPT, Merkle Patricia Trie', '以太坊使用的按键查找、每个节点带哈希的 16 叉树'],
  ['默克尔求和树', 'Merkle Sum Tree', '内部节点同时记录哈希与子节点数值之和，用于储备金证明'],
  ['储备金证明', 'Proof of Reserves', '交易所证明链上资产不少于用户负债的方法']
])}
` });

CUR = 'm01-3';
addCh({ id: 'm01-3', nav: '共识机制', title: 'M01.3 共识机制：陌生人如何对下一个区块达成一致', desc: '从拜占庭将军到 PoW、PoS、BFT，理解容错比例与两种最终性。', html: `
<h1>M01.3 共识机制：陌生人如何对下一个区块达成一致</h1>
${meta(['解释拜占庭容错和 f &lt; n/3 的来源。', '说清 PoW、PoS、BFT 三类共识的出块、分叉选择、惩罚和最终性。', '根据链的最终性类型，为充值业务选择确认策略。'], '<a href="#m01-1">M01.1 区块结构</a>', ['confirm'])}
${beginner(`<p><strong>共识（Consensus）</strong>：一群互不信任的节点，对“账本下一页写什么”达成同一结论的规则。</p>
<p><strong>节点（Node）</strong>：运行区块链软件、保存账本副本的电脑。</p>
<p><strong>分叉（Fork）</strong>：同一高度出现两个或更多区块，链暂时分成几条。</p>
<p><strong>最终性（Finality）</strong>：一笔交易“再也不会被撤销”的程度。</p>
<p><strong>质押（Staking）</strong>：把代币锁进协议作为保证金。作恶会被扣掉。</p>
<p><strong>算力（Hashrate）</strong>：每秒能计算多少次哈希，代表 PoW 中的“投票权”。</p>`)}

<h2>1. 一句话理解</h2>
${one('共识机制回答两个问题：谁有权写下一个区块（出块权），以及链分叉时大家跟哪条（分叉选择）。答案决定了攻击成本和最终性。')}
${call('analogy', `<p>一个班级用一本共享的记账本。PoW 像“谁先解出一道超难的数学题谁来记”；PoS 像“按押金多少抽签决定谁来记，记错了押金没收”；BFT 像“班委开会，三分之二以上举手同意才写入，写入后永不修改”。</p>
<p><strong>类比的局限</strong>：真实网络有延迟、有掉线、有人同时向不同人说不同的话。共识算法的难点全在这些细节里。</p>`)}
${art('一图看懂：共识回答两个问题，谁出块，分叉时跟哪条链', 660, 285, [
  S.text(330, 26, '陌生人怎样对“下一个区块”达成一致？三种常见答案', { size: 13.5, b: 1, anchor: 'middle', mw: 620 }),
  S.box(10, 44, 200, 140, { k: 'info', icon: 'cpu', tag: '比特币', left: 1, t: 'PoW 工作量证明', s: '出块：先算出哈希者\n分叉：累计工作量最大\n最终：概率性，等确认\n边界：诚实算力 > 50%' }),
  S.box(230, 44, 200, 140, { k: 'key', icon: 'coin', tag: '以太坊', left: 1, t: 'PoS 权益证明', s: '出块：按质押随机抽\n分叉：LMD-GHOST\n最终：约 2 个 epoch\n边界：作恶 ≥1/3 被罚' }),
  S.box(450, 44, 200, 140, { k: 'info', icon: 'users', tag: 'Cosmos', left: 1, t: 'BFT 投票', s: '出块：轮流提议\n分叉：没有，提交即定论\n最终：提交即最终\n边界：恶意节点 < 1/3' }),
  S.arrow(30, 214, 630, 214, { k: 'warn', label: '最终性：概率性 → 经济最终性 → 确定最终性' }),
  S.text(330, 262, '区别在于：攻击要花多少钱，以及交易多久才算“不会再变”', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '三种机制都要回答同样的两个问题：出块权凭什么给谁，分叉时大家跟哪一条。'],
  ['key', '以太坊用 PoS：finalized 之后要撤销区块，至少 1/3 质押会被罚没，所以叫经济最终性。'],
  ['risk', 'PoW 的最终性是概率性的：确认数越多越安全，但攻击者有足够算力时仍可能重组。'],
  ['limit', 'BFT 追求即时最终性，代价是验证者不能太多，恶意节点必须少于 1/3。']
], '三种共识的对比：PoW 凭算力出块，PoS 凭质押出块，BFT 靠投票；最终性从概率性到经济最终性再到确定最终性', 'm01-3')}

<h2>2. 拜占庭将军问题与容错比例</h2>
<p>1982 年，Lamport 等人提出<strong>拜占庭将军问题（Byzantine Generals Problem）</strong>：几位将军围城，只能靠信使通信，其中有叛徒会发假消息。忠诚的将军如何对“进攻还是撤退”达成一致？在区块链里，“叛徒”就是会撒谎、会给不同节点发不同消息的恶意节点，这种故障叫<strong>拜占庭故障</strong>。</p>
<p>经典结论：在有投票的 BFT 协议中，n 个节点最多容忍 f 个拜占庭节点，必须满足 <strong>n ≥ 3f + 1，即 f &lt; n/3</strong>。</p>
${mm('为什么需要 2f+1 票：两个法定人数必然有诚实节点重叠', `
flowchart LR
  subgraph N["n = 4 个节点，f = 1"]
    A["A 诚实"]
    B["B 诚实"]
    C["C 诚实"]
    D["D 恶意"]
  end
  Q1["法定人数 Q1<br/>A, B, D 同意区块 X"]
  Q2["法定人数 Q2<br/>B, C, D 同意区块 Y"]
  A --> Q1
  B --> Q1
  D --> Q1
  B --> Q2
  C --> Q2
  D --> Q2
  Q1 --> O["重叠：B 和 D<br/>B 诚实，不会给 X、Y 同时投票<br/>所以 Q2 凑不齐"]
  Q2 --> O
`, [
  ['flow', '每个决定需要 2f+1 = 3 票。任意两组 3 票在 4 个节点里至少重叠 2 个，其中至少 1 个诚实。'],
  ['key', '诚实节点不会给两个冲突区块投票，所以两个冲突决定不可能同时凑齐法定人数。这就是安全性。'],
  ['fail', '如果恶意节点达到 f ≥ n/3，它们可以和两组诚实节点分别组成法定人数，确认两个冲突区块。'],
  ['limit', '必须知道“n 是多少”。BFT 适合验证者集合已知的系统；比特币不知道总共有多少矿工，所以用 PoW 绕开这个问题。']
])}
<p><strong>算一算（示例）</strong>：一条 BFT 链有 100 个验证者（每人权重相同）。</p>
${steps([
  '最多容忍 f：100 ≥ 3f + 1 → f ≤ 33。',
  '确认一个区块需要的票数：超过 2/3，即至少 67 票。',
  '攻击者控制 34 个验证者：凑不齐 67 票确认坏区块，但可以拒绝投票，让诚实的 66 票也凑不够——链停止出块（失去活性）。',
  '攻击者控制 67 个验证者：可以单独确认任何区块（失去安全性）。'
])}

<h2>3. 工作量证明（PoW）</h2>
${mm('PoW 出块与分叉选择流程', `
flowchart TB
  S["收集交易池里的交易"] --> H["组装区块头<br/>prevHash = 当前最重链顶端"]
  H --> T{"SHA256d(区块头)<br/>小于目标？"}
  T -->|"否：nonce 加 1"| H
  T -->|"是"| B["广播新区块"]
  B --> V["其他节点验证<br/>PoW、交易、父哈希"]
  V --> C{"新区块让某条链<br/>累计工作量最大？"}
  C -->|"是"| SW["切换到这条链<br/>可能触发重组"]
  C -->|"否"| KEEP["存为侧链区块"]
  SW --> S
  KEEP --> S
`, [
  ['flow', '矿工不断改 nonce 求哈希；找到合格哈希就广播。其他节点验证后，跟随“累计工作量最大”的链。'],
  ['key', '规则常被叫作“最长链”，严格说是<strong>最重链（most cumulative work）</strong>：比较总工作量，而不是区块数。否则攻击者可以用低难度区块造一条更长的链。'],
  ['fail', '两个矿工几乎同时出块时会产生短暂分叉。下一个区块决定胜负，输的一方的区块被孤立，其中的交易回到交易池。'],
  ['risk', '控制超过 50% 算力的攻击者，迟早能造出比诚实链更重的私链，撤销已确认的交易（51% 攻击）。']
])}
<h3>3.1 51% 攻击怎么做</h3>
${steps([
  '攻击者在交易所充值 1,000 个币，同时在私下挖一条不包含这笔充值的链。',
  '交易所等到 N 个确认后入账。攻击者把币换成别的资产并提走。',
  '攻击者的私链因为算力更大而追上并超过公链，他把私链广播出去。',
  '全网按最重链规则切换到私链。充值交易消失，攻击者拿回原来的 1,000 个币。'
])}
<p>真实事件：2018 年 5 月 Bitcoin Gold 遭遇 51% 攻击，攻击者在多家交易所双花，涉及金额约 1,800 万美元。${cite('BleepingComputer：Bitcoin Gold 双花攻击（2018-05）', 'https://www.bleepingcomputer.com/news/security/hacker-makes-over-18-million-in-double-spend-attack-on-bitcoin-gold-network/')}2020 年 8 月 Ethereum Classic 一个月内发生三次深度重组：8 月 1 日 3,693 个区块、8 月 6 日约 4,000 个区块、8 月 29 日超过 7,000 个区块（第一次的起因各方说法不一，后两次被普遍认定为 51% 攻击）。${cite('The Block：ETC 一个月内第三次遭 51% 攻击', 'https://www.theblock.co/news/ecosystems/2020-08-31-ethereum-classic-etc-third-51-attack-76431')}小算力的 PoW 链可以从算力市场租到足够算力，攻击成本很低。</p>
<p>下面的实验用白皮书第 11 节的公式，计算攻击者落后 z 个区块时追上的概率。先把算力设为 10%、确认数 6，记下概率；再拉到 30%，找出让概率低于 0.1% 的确认数；最后拉到 50%，观察确认数完全失效。</p>
${lab('confirm')}

<h2>4. 权益证明（PoS）：以太坊的做法</h2>
<p>2022 年 9 月，以太坊通过“合并（The Merge）”从 PoW 切换到 PoS。新规则下：</p>
${tbl(['概念', '以太坊参数（截至 2026 年公开资料）', '说明'], [
  ['验证者（Validator）', '每个至少质押 32 ETH（Pectra 升级后单个验证者有效余额上限提高到 2,048 ETH）', '负责出块和投票'],
  ['时隙（slot）', '12 秒', '每个 slot 随机选 1 个验证者出块'],
  ['纪元（epoch）', '32 个 slot = 6.4 分钟', '每个 epoch 内所有验证者各投票一次'],
  ['分叉选择', 'LMD-GHOST', '选择获得最新投票权重最多的分支'],
  ['最终性', 'Casper FFG', '检查点获得 2/3 质押投票后“合理化（justified）”，再下一个检查点合理化后“最终确定（finalized）”，通常约 2 个 epoch ≈ 12.8 分钟'],
  ['罚没（Slashing）', '同一 slot 签两个区块；同一 epoch 投两个冲突票；“环绕投票”', '扣除部分质押并强制退出；同期被罚没的人越多，扣得越多']
])}
${mm('以太坊 PoS 一个 epoch 内发生什么', `
sequenceDiagram
  participant R as 随机数 RANDAO
  participant P as 本 slot 出块者
  participant C as 委员会验证者
  participant N as 全网节点
  R->>P: 按质押权重随机选中
  P->>N: 广播区块（slot 内前 4 秒）
  C->>N: 投票 attestation：头部投票 + 检查点投票
  N->>N: LMD-GHOST 选出链头
  N->>N: 检查点获得 2/3 票 → justified
  N->>N: 下一个检查点也 justified → 上一个 finalized
`, [
  ['flow', '每个 slot：1 人出块，一个委员会投票。每个 epoch：全部验证者轮一遍投票。'],
  ['key', 'finalized 之后的区块要被撤销，至少 1/3 的质押会被罚没。这叫<strong>经济最终性</strong>：撤销要付出数十亿美元级别的代价。'],
  ['fail', '如果超过 1/3 验证者离线，链会继续出块但无法最终确定。协议会启动“不活跃泄漏（inactivity leak）”，逐步扣除离线者质押，直到在线者重新超过 2/3。'],
  ['limit', '未最终确定的区块仍可能重组。工程上要区分 latest、safe、finalized 三种区块标签。见 <a href="#m01-5">M01.5</a>。']
])}

<h2>5. BFT 类共识：Tendermint 与即时最终性</h2>
<p>Cosmos 生态使用的 Tendermint（现名 CometBFT）是经典的 BFT 共识。一个高度可能有多轮（round），每轮三步：</p>
${mm('Tendermint 一轮：提议 → 预投票 → 预提交 → 提交', `
stateDiagram-v2
  state "提议 Propose" as Propose
  state "预投票 Prevote" as Prevote
  state "预提交 Precommit" as Precommit
  state "提交 Commit" as Commit
  state "下一轮 NextRound" as NextRound
  [*] --> Propose
  Propose --> Prevote: 收到提议或超时
  Prevote --> Precommit: 收到超过 2/3 预投票
  Prevote --> NextRound: 超时未凑齐
  Precommit --> Commit: 收到超过 2/3 预提交
  Precommit --> NextRound: 超时未凑齐
  NextRound --> Propose: 换下一个提议者
  Commit --> [*]
`, [
  ['flow', '两阶段投票：第一阶段（prevote）确认“大家看到的是同一个提议”；第二阶段（precommit）确认“大家都知道大家看到了同一个提议”。'],
  ['key', '区块一旦提交就是<strong>确定最终性</strong>：协议层面不会重组。前提是恶意权重 &lt; 1/3。'],
  ['fail', '超过 1/3 验证者离线或网络分区时，链会停止出块（宁可停，不可错）。2022 年 6 月，Cosmos 生态的 Osmosis 在发现流动性池漏洞后由验证者协调停链，恢复出块同样要等超过 2/3 权重重新上线。' + cite('CoinDesk：Osmosis 因潜在漏洞停链（2022-06-08）', 'https://www.coindesk.com/business/2022/06/08/osmosis-chain-halted-amid-possible-5m-exploit')],
  ['limit', '每轮所有验证者要互相广播投票，消息量随验证者数量平方增长，所以验证者通常控制在 100–200 个左右。' + tag('惯例')]
])}
<p>即时最终性也是 Cosmos 链之间能用 IBC 互相运行轻客户端的前提，见 <a href="#m05-65">M05.9 Cosmos 与 IBC</a>。</p>

<h2>6. 概率最终性 vs 确定最终性</h2>
${tbl(['维度', 'PoW（比特币）', 'PoS（以太坊）', 'BFT（Tendermint/CometBFT）'], [
  ['出块权', '算力竞争', '按质押随机抽选', '按质押轮流提议'],
  ['分叉选择', '最重链', 'LMD-GHOST + Casper FFG', '不分叉：凑齐 2/3 才提交'],
  ['容错', '诚实算力 &gt; 50%', '恶意质押 &lt; 1/3 保证最终性', '恶意权重 &lt; 1/3'],
  ['最终性', '概率性：确认越多越安全', '约 12.8 分钟后经济最终性', '1 个区块即确定（秒级）'],
  ['故障时', '继续出块，可能深度重组', '继续出块，最终性延迟', '停止出块'],
  ['作恶惩罚', '浪费电费和机器', '罚没质押', '罚没质押（取决于链的实现）'],
  ['充值确认建议（示例）', '大额 3–6 个确认', '小额 safe，大额 finalized', '1 个区块（再加业务风控）']
])}
${call('warn', `<p><strong>确认数要按链、按金额配置。</strong>同样“6 个确认”，在比特币上很安全，在算力很小的 PoW 链上，按 Crypto51 用 NiceHash 租价估算，1 小时攻击成本可能只有几百美元甚至更低。${cite('Crypto51：PoW 链 51% 攻击成本估算', 'https://www.crypto51.app/')}上线新链前，先查它的共识类型、最终性和历史重组深度。</p>`)}
${tryit(`<ol>
<li>打开 beaconcha.in，查看最新的 epoch。找到 “Finalized” 和 “Justified” 状态。<strong>预期</strong>：最新 finalized 的 epoch 比当前 epoch 落后约 2 个。</li>
<li>用公开 RPC 执行 <code>curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["finalized",false],"id":1}' https://ethereum-rpc.publicnode.com</code>，记下返回的 number；再把 "finalized" 换成 "latest"。<strong>预期</strong>：两者相差约 64–96 个区块。</li>
<li>在<a href="#lab-confirm">确认数实验</a>里，把算力设为 25%，找出成功率低于 0.1% 需要的确认数。</li>
</ol>`)}

${mistakes([
  ['比特币是“最长链”规则，比较区块数量。', '比较的是累计工作量（最重链）。低难度的长链赢不了高难度的短链。'],
  ['PoS 链出块后马上就不可逆。', '以太坊只有 finalized 后才有经济最终性，约 12.8 分钟；之前的区块仍可能重组。'],
  ['BFT 能容忍一半节点作恶。', '投票型 BFT 只能容忍少于 1/3 的拜占庭节点。'],
  ['确认数越多越好，所有链都用 6 个。', '确认数取决于链的共识与安全预算。BFT 链 1 个块即最终；小 PoW 链 6 个确认也可能不够。'],
  ['51% 攻击可以偷走任何人的币。', '51% 攻击能撤销和重排交易（双花），不能伪造别人的签名，也不能凭空转走别人的币。']
])}
${recap([
  '拜占庭容错要求 n ≥ 3f + 1；法定人数 2f+1 保证两个冲突决定不能同时成立。',
  'PoW：算力竞争出块，跟随累计工作量最大的链；超过 50% 算力可以做双花。',
  '以太坊 PoS：12 秒一个 slot，32 个 slot 一个 epoch；约 2 个 epoch 后 finalized，撤销需要罚没至少 1/3 质押。',
  'Tendermint：提议、预投票、预提交两阶段投票，提交即最终；故障时停链而不是分叉。',
  '概率最终性靠确认数，确定最终性靠投票；充值确认策略要按链类型和金额设定。'
])}
${quiz([
  { q: '一条 BFT 链有 31 个权重相同的验证者。最多能容忍几个拜占庭节点？', o: ['15', '10', '20', '30'], a: 1, why: 'n ≥ 3f + 1 → 31 ≥ 3f + 1 → f ≤ 10。15 是“少于一半”的错误直觉。' },
  { q: '以太坊超过 1/3 的验证者突然离线。会发生什么？', o: ['链立即停止出块', '在线验证者被罚没', '链继续出块但无法最终确定，离线者质押逐步被扣除', '所有已最终确定的区块被回滚'], a: 2, why: '以太坊优先保证活性：继续出块但 finality 停滞，并通过不活跃泄漏让在线者重新超过 2/3。BFT 链（如 Tendermint）才会停链。' },
  { q: '为什么 PoW 的分叉选择要比较累计工作量，而不是区块数量？', o: ['防止攻击者用低难度区块造一条更长的假链', '因为区块数量无法统计', '为了让出块更快', '为了降低手续费'], a: 0, why: '如果比较数量，攻击者可以伪造一段低难度但更长的链。比较总工作量，伪造成本等于真实算力成本。' },
  { q: 'Tendermint 在一个高度上提交区块，需要满足什么条件？', o: ['提议者签名即可', '超过一半验证者预投票', '后面再出 6 个区块', '收到超过 2/3 权重的预提交（precommit）'], a: 3, why: '两阶段投票的第二阶段需要超过 2/3 预提交，才进入 Commit。提交后即确定最终。' }
])}
${exercises([["计算题（示例）：一条 BFT 链有 50 个权重相同的验证者。最多容忍几个拜占庭节点？确认一个区块至少要几票？攻击者控制 17 个验证者时会怎样？", "<p>50 ≥ 3f + 1，得 f ≤ 16。确认需要超过 2/3，即至少 34 票。攻击者有 17 个验证者，凑不齐 34 票确认坏区块。但他们拒绝投票后，诚实的 33 票也不够，链停止出块，失去活性。</p>"], ["思考题：为什么 Tendermint（CometBFT）这类链的验证者数量通常只有 100–200 个左右？", "<p>每一轮里，所有验证者要互相广播预投票和预提交。消息量随验证者数量的平方增长。验证者太多，网络开销会拖慢出块。BFT 还要求事先知道验证者集合，所以适合成员已知、数量有限的系统。</p>"], ["设计题：一家交易所要同时支持比特币、以太坊 L1 和一条 CometBFT 链的充值。请按链的最终性类型给出小额和大额的确认策略。", "<p>比特币是概率最终性：小额 1–3 个确认，大额 6 个以上。以太坊 L1 是 PoS 经济最终性：小额用 safe 或约 12 个块，大额等 finalized。CometBFT 链是确定最终性：1 个区块即可，大额再加业务风控延迟。上线前要查这条链的共识类型和历史重组深度。</p>"]])}
${checklist(["能从 n ≥ 3f + 1 推出给定验证者数的容错上限和法定票数。", "能说清 PoW、PoS、BFT 在出块权、分叉选择和故障表现上的区别。", "能讲出 51% 攻击的四个步骤，以及它不能做什么。", "做过用 RPC 对比 finalized 和 latest 区块号。", "能按链的最终性类型和金额给出充值确认策略。"])}
${terms([
  ['拜占庭容错', 'BFT, Byzantine Fault Tolerance', '在部分节点任意作恶的情况下仍能达成一致的能力'],
  ['法定人数', 'Quorum', '做出决定所需的最少投票权重，BFT 中为超过 2/3'],
  ['最重链规则', 'Heaviest Chain Rule', 'PoW 节点跟随累计工作量最大的链'],
  ['51% 攻击', '51% Attack', '控制多数算力或质押，重写区块以实现双花'],
  ['验证者', 'Validator', 'PoS 中质押代币、负责出块和投票的参与者'],
  ['罚没', 'Slashing', '对签署冲突消息的验证者扣除质押的惩罚'],
  ['纪元', 'Epoch', '以太坊中 32 个 slot 组成的周期，约 6.4 分钟'],
  ['概率最终性', 'Probabilistic Finality', '撤销概率随确认数指数下降，但永不为零'],
  ['确定最终性', 'Deterministic Finality', '协议保证提交后不会被撤销（前提是恶意权重少于 1/3）'],
  ['活性', 'Liveness', '系统能持续出块、处理新交易的性质']
])}
` });
})();
