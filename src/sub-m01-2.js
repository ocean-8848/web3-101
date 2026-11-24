/* ---------- M01 子文章（2/5）：交易全解、节点与 JSON-RPC ---------- */
(() => {
CUR = 'm01-4';
addCh({ id: 'm01-4', nav: '交易全解', title: 'M01.4 交易全解：字段、编码、签名、交易池与回执', desc: '逐字段拆解以太坊四类交易，逐字节解码一笔 ERC-20 转账。', html: `
<h1>M01.4 交易全解：字段、编码、签名、交易池与回执</h1>
${meta(['说出 legacy、type 1、type 2、type 3 交易的字段差别，并计算 EIP-1559 实际手续费。', '理解 RLP 编码、交易签名和 EIP-155 防重放。', '读懂交易回执和事件日志，逐字节解码一笔 ERC-20 转账的 input data。'], '<a href="#m01-1">M01.1 区块结构</a>、<a href="#m00-3">M00.3 公钥私钥与数字签名</a>', ['txlife', 'eip1559'])}
${beginner(`<p><strong>交易（Transaction）</strong>：由私钥签名的一条指令，例如“从我的账户转 1 ETH 给 Bob”或“调用某合约的某函数”。</p>
<p><strong>wei / gwei</strong>：ETH 的最小单位是 wei。1 ETH = 10<sup>18</sup> wei；1 gwei = 10<sup>9</sup> wei。手续费单价通常用 gwei 表示。</p>
<p><strong>交易池（Mempool）</strong>：节点内存里“已收到、还没打包”的交易集合。</p>
<p><strong>回执（Receipt）</strong>：交易执行后节点生成的结果记录：成功还是失败、用了多少 gas、产生了哪些事件。</p>
<p><strong>事件（Event / Log）</strong>：合约执行时写下的“日志”，例如 ERC-20 的 Transfer。链下程序靠它知道发生了什么。</p>
<p><strong>ABI</strong>：合约的“接口说明书”，规定函数参数和返回值怎么编码成字节。</p>`)}

<h2>1. 一句话理解</h2>
${one('一笔以太坊交易 = “我是谁的第几笔（nonce）、发给谁（to）、带多少钱（value）、要做什么（data）、最多付多少费（gas 字段）、在哪条链（chainId）”+ 私钥签名（v、r、s）。')}
${call('analogy', `<p>交易像一张银行支票。nonce 是支票编号（每张只能用一次，必须按顺序）；to 是收款人；value 是金额；data 是附言里的指令（“请把 100 USDT 转给 Bob”）；gas 字段是你愿意付的手续费上限；chainId 写明是哪家银行；签名是你的亲笔签字。</p>
<p><strong>类比的局限</strong>：支票签了可以撤回；交易一旦被打包就无法撤回。在打包前，你只能用同一编号、更高手续费的新交易“顶替”它。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m01-4"><div class="mmd-title"><span>一图看懂：一笔交易从字段到广播</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 225" role="img" aria-label="交易字段经编码、哈希、签名后成为原始交易"><g transform="translate(20,40)"><rect x="0" y="0" width="110" height="130" rx="10" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><path d="M80 0 v22 h30" fill="none" stroke="var(--info)"/><text x="14" y="30" font-size="14" text-anchor="start" fill="var(--ink)" font-weight="700">交易字段</text><text x="14" y="54" font-size="11" text-anchor="start" fill="var(--ink-2)" font-family="ui-monospace,Menlo,monospace">chainId 1</text><text x="14" y="71" font-size="11" text-anchor="start" fill="var(--ink-2)" font-family="ui-monospace,Menlo,monospace">nonce 7</text><text x="14" y="88" font-size="11" text-anchor="start" fill="var(--ink-2)" font-family="ui-monospace,Menlo,monospace">to 0xAb…</text><text x="14" y="105" font-size="11" text-anchor="start" fill="var(--ink-2)" font-family="ui-monospace,Menlo,monospace">value 1 ETH</text><text x="14" y="122" font-size="11" text-anchor="start" fill="var(--ink-2)" font-family="ui-monospace,Menlo,monospace">data 0x</text></g><line x1="136" y1="105" x2="186" y2="105" stroke="var(--ink-2)" stroke-width="2"/><path d="M186.0 105.0 L178.8 108.5 L178.8 101.5 z" fill="var(--ink-2)"/><g transform="translate(192,55)"><path d="M0 0 h120 l-40 60 v40 h-40 v-40z" fill="var(--tint)" stroke="var(--ink-2)" stroke-width="1.5"/><text x="60" y="26" font-size="13" text-anchor="middle" fill="var(--ink)" font-weight="700">RLP + Keccak</text><text x="60" y="88" font-size="11" text-anchor="middle" fill="var(--ink-2)">32 字节</text></g><line x1="318" y1="105" x2="368" y2="105" stroke="var(--ink-2)" stroke-width="2"/><path d="M368.0 105.0 L360.8 108.5 L360.8 101.5 z" fill="var(--ink-2)"/><g transform="translate(372,50)"><rect x="0" y="0" width="130" height="110" rx="12" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><g fill="none" stroke="var(--risk)" stroke-width="3"><circle cx="26" cy="40" r="9"/><path d="M35 40 h26 v8 M47 40 v6"/></g><text x="65" y="80" font-size="13" text-anchor="middle" fill="var(--ink)" font-weight="700">私钥签名</text><text x="65" y="98" font-size="11" text-anchor="middle" fill="var(--ink-2)">yParity · r · s</text></g><line x1="508" y1="105" x2="558" y2="105" stroke="var(--ink-2)" stroke-width="2"/><path d="M558.0 105.0 L550.8 108.5 L550.8 101.5 z" fill="var(--ink-2)"/><g transform="translate(562,60)"><rect x="0" y="0" width="120" height="86" rx="8" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><path d="M0 8 l60 40 l60 -40" fill="none" stroke="var(--ok)" stroke-width="2"/><text x="60" y="76" font-size="11" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">0x02f8…</text></g><path d="M686 103 q40 0 52 -40" fill="none" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="5 4"/><line x1="733" y1="70" x2="738" y2="62" stroke="var(--ink-2)" stroke-width="2"/><path d="M738.0 62.0 L737.1 70.0 L731.2 66.3 z" fill="var(--ink-2)"/><text x="712" y="44" font-size="12" text-anchor="middle" fill="var(--ink-2)">广播</text><text x="380" y="205" font-size="12.5" text-anchor="middle" fill="var(--ink-2)">私钥只在红色这一步出现；签好的交易（绿色信封）可以交给任何节点广播</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>字段 → RLP 编码并加类型字节 → 哈希得到签名对象 → 私钥签名 → 组装成原始交易 → 广播。</span></li><li><span class="chip key">关键</span><span>交易哈希在签名完成时就确定了，不需要等上链。</span></li><li><span class="chip risk">风险</span><span>签好的原始交易谁拿到都能广播，所以“签了但没发”的交易也要当成已经公开。</span></li></ul></figcaption></figure>

<h2>2. 四种交易类型与字段</h2>
<p>2021 年起，以太坊用 <strong>EIP-2718 类型化交易信封</strong>：交易 = 1 个类型字节 + 该类型的编码内容。旧交易没有类型字节，称为 legacy（类型 0）。</p>
${tbl(['类型', '引入', '核心变化', '典型用途'], [
  ['0 legacy', '创世起', '单一 gasPrice；EIP-155 后把 chainId 编进 v', '老钱包、部分 L2'],
  ['1 EIP-2930', '2021 柏林升级', '增加 accessList（预声明要访问的地址和存储槽）', '少量需要降低冷访问成本的调用'],
  ['2 EIP-1559', '2021 伦敦升级', 'gasPrice 拆成 maxFeePerGas 与 maxPriorityFeePerGas', '当前主流，钱包默认'],
  ['3 EIP-4844', '2024 Dencun 升级', '携带 blob 数据（每个 128 KB），增加 maxFeePerBlobGas、blobVersionedHashes', 'Rollup 向 L1 发布数据'],
  ['4 EIP-7702', '2025 Pectra 升级', '增加 authorizationList，让普通账户设置代码委托（持续有效，直到被替换或清除）', '账户抽象，见 <a href="#m06-5">M09.8</a>']
])}
<h3>2.1 字段逐一讲解（以 type 2 为主）</h3>
${tbl(['字段', '类型', '含义', '常见坑'], [
  ['<code>chainId</code>', '整数', '链编号。以太坊主网 1，Sepolia 测试网 11155111', '写错链 → 交易在目标链上无效'],
  ['<code>nonce</code>', '整数', '发送者已发出的交易数，从 0 开始，每笔 +1', '必须连续。跳号的交易会卡在交易池'],
  ['<code>maxPriorityFeePerGas</code>', 'wei', '愿意付给出块者的每 gas 小费上限', '太低时可能长时间不被打包'],
  ['<code>maxFeePerGas</code>', 'wei', '愿意付的每 gas 总价上限（基础费 + 小费）', '低于当前 baseFee 时交易无法打包'],
  ['<code>gas</code>（gasLimit）', '整数', '本交易最多能消耗的 gas', '太低 → out of gas 失败，已消耗的费用不退'],
  ['<code>to</code>', '20 字节地址或空', '接收方。为空表示创建合约', '地址写错，资产无法找回'],
  ['<code>value</code>', 'wei', '附带转账的 ETH 数量', '转 ERC-20 时 value 通常为 0'],
  ['<code>data</code>（input）', '字节', '调用合约时的函数选择器 + 参数；创建合约时是字节码', '普通转账为空 <code>0x</code>'],
  ['<code>accessList</code>', '列表', '预声明访问的地址和存储槽（type 1/2/3 都有）', '一般留空'],
  ['<code>v</code>/<code>yParity</code>, <code>r</code>, <code>s</code>', '签名', 'ECDSA 签名的三个部分；r、s 各 32 字节', '由钱包生成，不要手动改']
])}
<h3>2.2 EIP-1559 的实际费用</h3>
<p>实际每 gas 价格 = min(maxFeePerGas, baseFeePerGas + maxPriorityFeePerGas)。其中 baseFee 部分被销毁，小费部分给出块者。</p>
<p><strong>算一算（示例）</strong>：一笔 ETH 转账，gasUsed = 21,000。当前 baseFee = 10 gwei，你设置 maxPriorityFee = 2 gwei，maxFee = 30 gwei。</p>
${steps([
  '实际单价 = min(30, 10 + 2) = 12 gwei。',
  '总手续费 = 21,000 × 12 = 252,000 gwei = 0.000252 ETH。',
  '销毁 = 21,000 × 10 = 210,000 gwei；给出块者 = 21,000 × 2 = 42,000 gwei。',
  '你预留的上限是 21,000 × 30 = 630,000 gwei，差额不会被扣。但账户余额必须 ≥ value + gas × maxFee，否则节点直接拒绝交易。'
])}
<p>动手调参数：<a href="#lab-eip1559">EIP-1559 实验</a>。</p>

<h2>3. 从字段到上链：编码、签名、哈希</h2>
${mm('一笔 type 2 交易的诞生', `
flowchart LR
  F["填字段<br/>chainId, nonce, fee, gas<br/>to, value, data"] --> E["RLP 编码字段列表"]
  E --> P["前面加类型字节 0x02"]
  P --> K["Keccak-256<br/>得到签名哈希"]
  K --> S["私钥 ECDSA 签名<br/>得到 yParity, r, s"]
  S --> E2["RLP 编码 字段 + 签名<br/>再加 0x02 前缀"]
  E2 --> RAW["原始交易 raw tx<br/>0x02f8…"]
  RAW --> H["Keccak-256(raw tx)<br/>= 交易哈希"]
  RAW --> B["eth_sendRawTransaction 广播"]
`, [
  ['flow', '签名的对象是“类型字节 + RLP(未签名字段)”的哈希；广播的是“类型字节 + RLP(全部字段 + 签名)”。'],
  ['key', '交易哈希 = Keccak-256(原始交易字节)。签名完成那一刻，交易哈希就确定了，不需要等上链。'],
  ['fail', '签名时用的 chainId、nonce 和广播时对不上，节点会拒绝交易，或交易在别的链上被重放。'],
  ['risk', '原始交易一旦泄露，任何人都能替你广播它。这无法改金额，但可以抢在你“改主意”之前把它送上链。']
])}
<h3>3.1 RLP 编码直观</h3>
<p><strong>RLP（Recursive Length Prefix，递归长度前缀）</strong>是以太坊的序列化格式。它只认两种东西：字节串和列表。规则是“先写长度，再写内容”：</p>
${tbl(['数据', '规则', '编码结果'], [
  ['单字节 0x00–0x7f', '原样输出', '<code>0x09</code> → <code>09</code>'],
  ['空字节串（也表示整数 0）', '0x80', '<code>80</code>'],
  ['0–55 字节的字节串', '0x80 + 长度，然后内容', '"dog" → <code>83 64 6f 67</code>'],
  ['整数 1024', '先转成最短大端字节 04 00', '<code>82 04 00</code>'],
  ['空列表', '0xc0', '<code>c0</code>'],
  ['总长 0–55 字节的列表', '0xc0 + 总长，然后各元素编码', '["cat","dog"] → <code>c8 83 63 61 74 83 64 6f 67</code>'],
  ['超过 55 字节', '前缀 0xb7/0xf7 + “长度的长度”，再写长度', '原始交易常以 <code>02 f8</code> 或 <code>02 f9</code> 开头']
])}
<p><strong>读法</strong>：看到 <code>c8</code>，知道“这是一个列表，内容 8 字节”；看到 <code>83</code>，知道“这是一个 3 字节的串”。整数必须用最短形式，不能有前导 0。</p>
<h3>3.2 签名与 EIP-155 防重放</h3>
<p>2016 年以太坊和以太坊经典（ETC）分叉后，两条链的地址和私钥完全相同。一笔在 ETH 上签名的交易，可以原样拿到 ETC 上广播，这叫<strong>重放攻击（Replay Attack）</strong>。</p>
<p><strong>EIP-155</strong> 的解决方法：把 chainId 放进签名内容。legacy 交易的 v = chainId × 2 + 35 或 36。<strong>算一算</strong>：主网 chainId = 1，v = 37 或 38；Sepolia chainId = 11155111，v = 22310257 或 22310258。类型化交易（type 1–4）直接把 chainId 作为第一个字段，签名里的 yParity 只取 0 或 1。</p>
${call('info', `<p><strong>验证签名时不需要发送者地址。</strong>节点用 (签名哈希, v, r, s) 恢复出公钥，再算出地址（公钥 Keccak-256 的后 20 字节）。所以交易里没有 from 字段。RPC 返回的 from 是节点恢复出来的。</p>`)}

<h2>4. 交易池：等待、替换与丢弃</h2>
${mm('交易在节点交易池中的状态', `
stateDiagram-v2
  state "排队 queued（nonce 有缺口）" as Queued
  state "待打包 pending（可执行）" as Pending
  state "已打包" as Included
  state "被替换" as Replaced
  state "被丢弃" as Dropped
  [*] --> Queued: nonce 大于账户当前 nonce
  [*] --> Pending: nonce 等于账户当前 nonce
  Queued --> Pending: 缺口被补上
  Pending --> Included: 出块者选中
  Pending --> Replaced: 同 nonce 新交易费用高出至少 10％
  Pending --> Dropped: 池满被挤出或费用低于 baseFee 过久
  Queued --> Dropped: 存活时间到期
  Included --> Pending: 区块被重组
  Included --> [*]
  Replaced --> [*]
  Dropped --> [*]
`, [
  ['flow', 'nonce 连续的交易进入 pending，可以被打包；nonce 有缺口的交易进入 queued，等前面的交易出现。'],
  ['key', '替换规则（以 Geth 默认值为例）：同一发送者、同一 nonce，新交易的 maxFee 和 maxPriorityFee 都要比旧交易高至少 10%。blob 交易要求更高（100%）。'],
  ['fail', '常见卡单：nonce 5 的费用设太低一直不打包，nonce 6、7 全部排队。解决：用 nonce 5 发一笔费用更高的替换交易。'],
  ['limit', '每个节点的交易池独立。你的交易在节点 A 里，不代表它在出块者的节点里。'],
  ['risk', '公开交易池里的交易能被所有人看到，可能被抢跑或夹击。见 <a href="#m05-7">M04.7 MEV</a>。']
])}
${steps([
  '<strong>加速</strong>：用同一 nonce、相同内容、提高费用（至少 +10%）重新签名并广播。',
  '<strong>取消</strong>：用同一 nonce 给自己转 0 ETH，费用提高至少 10%。取消成功后原交易作废。',
  '<strong>不能做</strong>：已经打包的交易无法取消或加速。'
])}
<p>交易从签名到最终确定的完整过程，可以在 <a href="#lab-txlife">交易生命周期实验</a>中逐步观察。</p>

<h2>5. 回执与事件日志</h2>
<p>交易被打包后，节点生成回执。回执的关键字段：</p>
${tbl(['字段', '含义', '工程用途'], [
  ['<code>status</code>', '0x1 成功，0x0 失败（回滚）', '<strong>必须检查</strong>。失败的交易也会上链、也扣手续费'],
  ['<code>gasUsed</code>', '本交易实际消耗的 gas', '对账手续费'],
  ['<code>effectiveGasPrice</code>', '实际每 gas 价格', '手续费 = gasUsed × effectiveGasPrice'],
  ['<code>cumulativeGasUsed</code>', '区块内到本交易为止累计 gas', '一般不用'],
  ['<code>logs</code>', '事件日志数组', '充值识别、业务状态同步'],
  ['<code>contractAddress</code>', '创建合约时的新地址', '部署脚本记录地址'],
  ['<code>blockHash</code> / <code>blockNumber</code>', '所在区块', '计算确认数，检测重组']
])}
<p>每条日志有 <code>address</code>（哪个合约发出）、<code>topics</code>（最多 4 个 32 字节）、<code>data</code>（其余数据）。规则：</p>
${steps([
  '<code>topics[0]</code> = 事件签名的 Keccak-256。ERC-20 Transfer 是 <code>keccak256("Transfer(address,address,uint256)")</code> = <code>0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef</code>。',
  '标记为 <code>indexed</code> 的参数依次放进 topics[1]、topics[2]、topics[3]。地址左侧补 0 到 32 字节。',
  '没有 indexed 的参数按 ABI 编码放进 data。',
  '按 topic 过滤很便宜（节点有索引）；按 data 内容过滤，只能拉下来自己筛。'
])}

<h2>6. 逐字节解码一笔 ERC-20 转账（示例）</h2>
<p>假设 Alice 调用 USDT 合约，给 <code>0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed</code> 转 100 USDT。USDT 的 decimals = 6，所以链上数值 = 100 × 10<sup>6</sup> = 100,000,000 = <code>0x5f5e100</code>。交易的 input data 共 68 字节：</p>
${code('BASH', `
0xa9059cbb
  000000000000000000000000 5aaeb6053f3e94c9b9a09f33669435e7ef1beaed
  00000000000000000000000000000000000000000000000000000000 05f5e100
`)}
${tbl(['字节范围', '内容', '解释'], [
  ['0–3', '<code>a9059cbb</code>', '函数选择器 = keccak256("transfer(address,uint256)") 的前 4 字节'],
  ['4–15', '12 个 <code>00</code>', '地址只有 20 字节，ABI 规定左侧补 0 到 32 字节'],
  ['16–35', '<code>5aaeb6…beaed</code>', '参数 1：收款地址 to'],
  ['36–63', '28 个 <code>00</code>', '数字左侧补 0'],
  ['64–67', '<code>05f5e100</code>', '参数 2：amount = 100,000,000 → 除以 10⁶ = 100 USDT']
])}
<p>这笔交易的 <code>to</code> 是 USDT 合约地址，<code>value</code> 是 0。收款人只出现在 data 里。执行成功后，回执中有一条日志：</p>
${code('JSON', `
{
  "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "topics": [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x000000000000000000000000<Alice 的地址 20 字节>",
    "0x0000000000000000000000005aaeb6053f3e94c9b9a09f33669435e7ef1beaed"
  ],
  "data": "0x0000000000000000000000000000000000000000000000000000000005f5e100",
  "logIndex": "0x3c",
  "removed": false
}
`)}
<p><strong>算一算（示例：calldata 的 gas）</strong>：EIP-2028 规定 calldata 每个零字节 4 gas、非零字节 16 gas。上面 68 字节中，零字节 = 12 + 29 = 41 个，非零字节 = 4 + 20 + 3 = 27 个。calldata 成本 = 41 × 4 + 27 × 16 = 164 + 432 = 596 gas。再加基础成本 21,000 和合约执行成本，一笔 ERC-20 转账通常消耗 4–6.5 万 gas。</p>
${call('warn', `<p><strong>三个会丢钱的识别错误</strong>：① 只看 tx.to == 你的地址来识别 USDT 充值——错，ERC-20 的 tx.to 是代币合约，收款人在日志里。② 不检查日志的 <code>address</code>——攻击者可以部署假的“USDT”合约，发出一模一样的 Transfer 事件。必须用合约地址白名单。③ 不检查 receipt.status——失败交易不产生日志，但 ETH 直接转账失败时 value 也不会到账。</p>`)}
${tryit(`<ol>
<li>在 etherscan.io 打开 USDT 合约 <code>0xdAC17F958D2ee523a2206206994597C13D831ec7</code>，点开任意一笔 Method 为 “Transfer” 的交易。</li>
<li>在 “Input Data” 处点 “View Input As → Original”。<strong>预期</strong>：以 <code>0xa9059cbb</code> 开头，后跟两个 64 字符的参数。</li>
<li>把第二个参数（金额）复制到计算器，十六进制转十进制后除以 10⁶。<strong>预期</strong>：等于页面上显示的转账数量。</li>
<li>切到 “Logs” 标签页，核对 topics[0] 是否为 <code>0xddf252ad…</code>，topics[2] 是否为收款地址。</li>
</ol>`)}

${mistakes([
  ['交易里有 from 字段。', '交易里没有 from。节点从签名恢复出发送者地址。'],
  ['maxFeePerGas 就是实际支付的单价。', '实际单价 = min(maxFee, baseFee + maxPriorityFee)。maxFee 只是上限。'],
  ['交易上链就代表成功。', '失败交易也会上链并扣手续费。必须检查回执 status = 1。'],
  ['ERC-20 转账的 to 是收款人。', 'tx.to 是代币合约地址。收款人在 input data 和 Transfer 日志的 topics[2] 里。'],
  ['交易发出后可以撤回。', '打包前只能用同 nonce 更高费用的交易替换；打包后无法撤回。']
])}
${recap([
  '交易类型：0 legacy、1 accessList、2 EIP-1559（主流）、3 blob、4 EIP-7702；类型字节写在最前面。',
  '实际单价 = min(maxFee, baseFee + tip)；baseFee 销毁，tip 给出块者。',
  '签名对象是 RLP 编码后的哈希；EIP-155 把 chainId 放进签名防止跨链重放；交易哈希在签名后就确定。',
  '交易池分 pending 与 queued；同 nonce 费用高 10% 以上可替换；nonce 缺口会卡住后续交易。',
  '回执 status 必须检查；Transfer 日志 topics[0] 是事件签名，topics[1]、topics[2] 是 from、to，data 是金额。'
])}
${quiz([
  { q: 'baseFee = 40 gwei，你设置 maxFee = 45 gwei、maxPriorityFee = 10 gwei。实际每 gas 支付多少？', o: ['50 gwei', '45 gwei', '40 gwei', '10 gwei'], a: 1, why: 'min(45, 40 + 10) = 45。小费实际只得到 5 gwei。如果设置成 50，可能因为 maxFee 被截断而得不到期望的小费。' },
  { q: 'ERC-20 转账 input data 的前 4 字节 0xa9059cbb 是什么？', o: ['代币合约地址的前缀', '收款人地址的校验和', '函数 transfer(address,uint256) 的选择器', 'chainId 的编码'], a: 2, why: '函数选择器 = keccak256(函数签名) 的前 4 字节。后面依次是 32 字节的地址和 32 字节的金额。' },
  { q: '你的账户 nonce 当前为 5。你发出了 nonce 6 和 7 的交易，但没有发 nonce 5。会怎样？', o: ['nonce 6、7 停在 queued，直到 nonce 5 出现', '节点自动把 6 改成 5', '6 和 7 正常打包', '6、7 立即被网络拒绝并扣费'], a: 0, why: 'nonce 必须连续。有缺口时后续交易进入 queued 等待，不会被打包，也不会扣费；超过存活时间会被丢弃。' },
  { q: '识别 USDT 充值时，以下哪项检查是必须的？', o: ['tx.to 等于用户充值地址', 'tx.value 大于 0', 'logsBloom 命中即可入账', 'log.address 等于官方 USDT 合约地址，且 topics[2] 是用户地址'], a: 3, why: '必须校验发出事件的合约地址，防止假币；收款人在 topics[2]。ERC-20 转账的 tx.to 是合约、value 为 0；Bloom 会误报。' }
])}
${exercises([["计算题（示例）：一笔合约调用 gasUsed = 60,000。baseFee = 25 gwei，你设置 maxPriorityFee = 3 gwei、maxFee = 26 gwei。求实际单价、总手续费、销毁额和出块者实际拿到的小费。", "<p>实际单价 = min(26, 25 + 3) = 26 gwei。总手续费 = 60,000 × 26 = 1,560,000 gwei = 0.00156 ETH。销毁 = 60,000 × 25 = 1,500,000 gwei。出块者小费 = 60,000 × 1 = 60,000 gwei。小费被 maxFee 截断，只拿到 1 gwei 而不是 3 gwei。</p>"], ["计算题（示例）：用 RLP 编码以下数据：整数 0；字节串 \"dog\"；只含一个元素 \"dog\" 的列表。", "<p>整数 0 等于空字节串，编码为 <code>80</code>。\"dog\" 是 3 字节串，编码为 <code>83 64 6f 67</code>。列表的内容就是上面 4 字节，总长 4，前缀 0xc0 + 4，编码为 <code>c4 83 64 6f 67</code>。</p>"], ["思考题：为什么交易签名完成那一刻，交易哈希就已经确定？如果原始交易被别人拿到，会有什么风险？", "<p>交易哈希 = Keccak-256(原始交易字节)，原始交易包含全部字段和签名。签名完成后这些字节就固定了，不需要等上链。别人拿到原始交易，无法修改金额或收款人。但他可以替你广播它，抢在你“改主意”之前把它送上链。</p>"]])}
${checklist(["能说出 type 0 到 type 4 交易各自的核心变化。", "能按 min(maxFee, baseFee + tip) 手算实际单价、销毁额和小费。", "能手工 RLP 编码短字节串、整数和短列表。", "能逐字节解码 ERC-20 transfer 的 input data。", "能读懂回执的 status 和 logs，并从 Transfer 日志取出 from、to 和金额。"])}
${terms([
  ['类型化交易', 'Typed Transaction (EIP-2718)', '以 1 字节类型开头的交易格式'],
  ['小费', 'Priority Fee / Tip', '交易付给出块者的每 gas 费用'],
  ['RLP 编码', 'Recursive Length Prefix', '以太坊用于序列化字节串和列表的编码'],
  ['重放攻击', 'Replay Attack', '把一条链上的已签名交易拿到另一条链上广播'],
  ['函数选择器', 'Function Selector', '函数签名 Keccak-256 的前 4 字节，标识要调用的函数'],
  ['交易回执', 'Transaction Receipt', '交易执行结果：状态、gas 用量、日志等'],
  ['主题', 'Topic', '日志中可被索引的 32 字节字段，topics[0] 为事件签名'],
  ['交易替换', 'Transaction Replacement', '用同 nonce、更高费用的新交易顶替交易池中的旧交易']
])}
` });

CUR = 'm01-5';
addCh({ id: 'm01-5', nav: '节点与 JSON-RPC', title: 'M01.5 节点与 JSON-RPC：用 curl 和区块链对话', desc: '认识全节点、归档节点、轻节点，亲手用 curl 调通 7 个核心 RPC 方法。', html: `
<h1>M01.5 节点与 JSON-RPC：用 curl 和区块链对话</h1>
${meta(['区分全节点、归档节点、轻节点，知道各自能回答什么问题。', '用 curl 调用 eth_blockNumber、eth_getBalance、eth_call、eth_getLogs 等方法，读懂返回值。', '正确使用 block tag、WebSocket 订阅，并处理限流、超时、重试。'], '<a href="#m01-4">M01.4 交易全解</a>')}
${beginner(`<p><strong>RPC（Remote Procedure Call，远程过程调用）</strong>：像调用本地函数一样调用另一台机器上的函数。</p>
<p><strong>JSON-RPC</strong>：用 JSON 格式描述“调用哪个方法、传什么参数”的 RPC 协议。以太坊节点都支持它。</p>
<p><strong>curl</strong>：命令行里发送 HTTP 请求的工具，macOS 和 Linux 自带。</p>
<p><strong>十六进制（Hex）</strong>：以 16 为基数的数字写法，以 <code>0x</code> 开头。0x10 = 16。</p>
<p><strong>WebSocket</strong>：一条一直保持连接的通道，服务器可以主动推消息给你。</p>
<p><strong>RPC 服务商</strong>：替你运行节点、按请求量收费的公司（例如 Infura、Alchemy、QuickNode）。</p>`)}

<h2>1. 一句话理解</h2>
${one('节点保存并验证链上数据；JSON-RPC 是你向节点提问的标准语言。后端读链、发交易，最终都是一条条 JSON-RPC 请求。')}
${call('analogy', `<p>节点像图书馆，JSON-RPC 像借书单。你在单子上写“我要查第 2000 万号区块”（method + params），图书管理员按编号（id）把结果交给你。全节点图书馆只保留最近的“当前版本”，归档节点图书馆保留每一天的历史版本，轻节点只有目录卡片。</p>
<p><strong>类比的局限</strong>：图书馆说的你一般会信；节点返回的数据可能错误或落后。重要数据要用多个节点交叉校验。</p>`)}
${art('一图看懂：节点 = 执行层 + 共识层，后端只对执行层说 JSON-RPC', 660, 332, [
  S.zone(220, 26, 260, 216, { t: '一个以太坊节点（合并之后）' }),
  S.box(10, 58, 120, 70, { k: 'info', icon: 'server', t: '你的后端', s: 'curl / SDK' }),
  S.box(236, 58, 228, 70, { k: 'key', icon: 'cpu', t: '执行层客户端', s: 'Geth · Reth · 端口 8545\n交易执行 + 状态' }),
  S.box(236, 164, 228, 66, { k: 'tint', icon: 'check', t: '共识层客户端', s: 'Lighthouse · Prysm\nPoS 共识' }),
  S.box(520, 161, 130, 72, { k: 'info', icon: 'globe', t: 'P2P 网络', s: '其他节点' }),
  S.arrow(132, 93, 234, 93, { k: 'key', both: 1, label: 'JSON-RPC' }),
  S.arrow(350, 130, 350, 162, { both: 1 }),
  S.text(362, 150, 'Engine API · JWT', { size: 11.5, dim: 1 }),
  S.arrow(466, 197, 518, 197, { both: 1 }),
  S.text(10, 266, '节点按“保存多少历史”分三类，能回答的问题不同：', { size: 13, b: 1 }),
  ...(() => { const c = S.cols(10, 640, 3, 20); return [
    S.box(c[0].x, 278, c[0].w, 46, { k: 'tint', t: '全节点 Full', s: '最近状态 · 查最新余额' }),
    S.box(c[1].x, 278, c[1].w, 46, { k: 'tint', t: '归档节点 Archive', s: '每个历史高度 · 可查历史' }),
    S.box(c[2].x, 278, c[2].w, 46, { k: 'tint', dash: 1, t: '轻节点 Light', s: '区块头 + 证明 · 依赖他人' })
  ]; })()
], [
  ['key', '只有执行层对外提供 JSON-RPC（默认端口 8545）。共识层只通过 Engine API（JWT 认证）和执行层对话，后端不直接碰它。'],
  ['flow', '后端每一次读链、发交易，都是一条 JSON 请求发给执行层，再带着 result 或 error 回来。'],
  ['limit', '全节点只保留最近一段状态，查很久以前的余额会报 missing trie node，这类请求要发给归档节点。'],
  ['risk', '节点返回的数据可能落后或错误，重要数据要用多个节点交叉校验。']
], '一个以太坊节点由执行层和共识层两个程序组成，后端通过 JSON-RPC 只和执行层对话；节点分全节点、归档节点、轻节点三类', 'm01-5')}

<h2>2. 节点类型</h2>
<p>2022 年合并之后，一个以太坊节点由两个程序组成：<strong>执行层客户端</strong>（Geth、Nethermind、Besu、Erigon、Reth，负责交易执行和状态）和<strong>共识层客户端</strong>（Prysm、Lighthouse、Teku、Nimbus、Lodestar，负责 PoS 共识）。两者用 Engine API 通信，用 JWT 密钥认证。JSON-RPC 由执行层客户端提供，默认端口 8545。</p>
${tbl(['类型', '保存什么', '能回答', '不能回答', '资源（示例）'], [
  ['全节点 Full', '全部区块；最近一段状态（例如最近 128 个区块）', '最新余额、最新合约状态、交易与回执', '很久以前某区块时的余额（会报 missing trie node）', '2 TB 以上 NVMe SSD'],
  ['归档节点 Archive', '每个历史区块的完整状态', '任意历史高度的余额和 eth_call', '—', '数倍于全节点，取决于客户端'],
  ['轻节点 Light', '区块头 + 按需请求证明', '用证明验证的余额（例如 Helios 这类轻客户端）', '大批量查询；依赖别的全节点提供数据', '很小，可跑在浏览器或手机']
])}
${mm('后端如何接入节点', `
flowchart LR
  APP["你的后端服务"] -->|"HTTP JSON-RPC"| GW["RPC 网关<br/>限流、路由、缓存"]
  APP -->|"WebSocket 订阅"| GW
  GW --> N1["自建全节点<br/>执行层 + 共识层"]
  GW --> N2["服务商 A"]
  GW --> N3["服务商 B（归档）"]
  N1 <-->|"P2P 网络"| NET["以太坊网络"]
  N2 <--> NET
  N3 <--> NET
`, [
  ['flow', '后端不直接绑死一个节点，而是经过网关。网关负责负载均衡、失败切换、按方法路由（历史查询发给归档节点）。'],
  ['fail', '负载均衡后的多个节点进度不同：同一请求两次可能返回不同高度。扫块时要固定节点或做高度对齐。'],
  ['limit', '公共免费 RPC 有严格限流，不适合生产。'],
  ['key', '生产环境至少 2 个独立数据源，关键数据（区块哈希）交叉校验。<a href="#m05-6">M04.6 节点运维与 RPC</a> 会深入。']
])}

<h2>3. JSON-RPC 协议格式</h2>
${code('JSON', `
// 请求
{ "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] }
// 成功响应：id 与请求相同
{ "jsonrpc": "2.0", "id": 1, "result": "0x1312d00" }
// 错误响应
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32602, "message": "invalid argument 0: hex string without 0x prefix" } }
`)}
${tbl(['错误码', '含义', '处理'], [
  ['-32700', 'JSON 解析失败', '检查请求体'],
  ['-32600', '请求格式无效', '检查 jsonrpc、method 字段'],
  ['-32601', '方法不存在', '节点未开启该命名空间，或服务商不支持'],
  ['-32602', '参数无效', '常见原因：十六进制缺 0x、有前导 0'],
  ['-32603', '内部错误', '可重试'],
  ['-32000 等', '服务器错误，消息里有原因', '例如 nonce too low、insufficient funds、header not found'],
  ['HTTP 429', '超出限流', '退避后重试，或升级套餐']
])}
${call('info', `<p><strong>两种十六进制</strong>：① <strong>数量（QUANTITY）</strong>：最短形式，不能有前导 0，零写成 <code>0x0</code>。例如高度写 <code>0x1312d00</code>，不能写 <code>0x01312d00</code>。② <strong>数据（DATA）</strong>：固定长度字节，偶数个字符，例如地址、哈希、calldata。</p>`)}

<h2>4. 七个核心方法：完整 curl 示例</h2>
<p>先设置环境变量。下面用的是公共节点，返回值均为<strong>示例</strong>（你的结果会不同）。</p>
${code('BASH', `
export RPC=https://ethereum-rpc.publicnode.com
# 通用写法：-s 静默，-X POST，-H 指定 JSON，--data 放请求体
`)}
<h3>4.1 eth_blockNumber：当前最新高度</h3>
${code('BASH', `
curl -s -X POST $RPC -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
# 返回（示例）：{"jsonrpc":"2.0","id":1,"result":"0x1312d00"}
printf "%d\\n" 0x1312d00     # → 20000000
`)}
<h3>4.2 eth_getBalance：查 ETH 余额</h3>
${code('BASH', `
curl -s -X POST $RPC -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","id":2,"method":"eth_getBalance","params":["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","latest"]}'
# 返回（示例）：{"jsonrpc":"2.0","id":2,"result":"0x1bc16d674ec80000"}
`)}
<p><strong>算一算</strong>：<code>0x1bc16d674ec80000</code> = 2,000,000,000,000,000,000 wei。除以 10<sup>18</sup> = <strong>2 ETH</strong>。超过 2<sup>63</sup> 的大数不能用 printf 换算，用 Foundry 的 <code>cast to-dec</code> 和 <code>cast from-wei</code>，或在 Go 里用 <code>big.Int</code>。</p>
<h3>4.3 eth_getBlockByNumber：读区块</h3>
${code('BASH', `
# 第二个参数 false 只返回交易哈希；true 返回完整交易对象
curl -s -X POST $RPC -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","id":3,"method":"eth_getBlockByNumber","params":["0x1312d00",false]}'
# 返回（示例，截断）：
# {"jsonrpc":"2.0","id":3,"result":{"number":"0x1312d00","hash":"0x…","parentHash":"0x…",
#   "baseFeePerGas":"0x2540be400","gasUsed":"0x10b0760","timestamp":"0x…","transactions":["0x…"]}}
`)}
<h3>4.4 eth_getTransactionReceipt：读回执</h3>
${code('BASH', `
curl -s -X POST $RPC -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","id":4,"method":"eth_getTransactionReceipt","params":["0x<交易哈希 64 个十六进制字符>"]}'
# 返回（示例，截断）：
# {"result":{"status":"0x1","blockNumber":"0x1312d00","gasUsed":"0xb411",
#   "effectiveGasPrice":"0x2cb417800","logs":[{"address":"0xdac1…","topics":["0xddf252ad…","0x…","0x…"],"data":"0x…05f5e100"}]}}
# 交易还没打包时 result 为 null
`)}
<h3>4.5 eth_call：只读调用合约（不上链、不花钱）</h3>
${code('BASH', `
# 查询某地址的 USDC 余额：data = balanceOf 选择器 0x70a08231 + 32 字节地址
curl -s -X POST $RPC -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","id":5,"method":"eth_call","params":[{"to":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","data":"0x70a08231000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045"},"latest"]}'
# 返回（示例）：{"result":"0x0000000000000000000000000000000000000000000000000000000005f5e100"}
# 0x5f5e100 = 100000000，USDC decimals = 6 → 100 USDC
`)}
<h3>4.6 eth_getLogs：按条件拉事件</h3>
${code('BASH', `
# 拉 10 个区块内、转入某地址的 USDC Transfer 事件
# topics 按位置匹配：[事件签名, from（null = 任意）, to]
curl -s -X POST $RPC -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","id":6,"method":"eth_getLogs","params":[{
    "fromBlock":"0x1312d00","toBlock":"0x1312d09",
    "address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              null,
              "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045"]}]}'
# 返回：日志数组，每条含 address、topics、data、blockNumber、blockHash、transactionHash、logIndex、removed
`)}
<h3>4.7 eth_sendRawTransaction：广播已签名交易</h3>
${code('BASH', `
curl -s -X POST $RPC -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","id":7,"method":"eth_sendRawTransaction","params":["0x02f8…（钱包或 cast mktx 生成的原始交易）"]}'
# 成功（示例）：{"result":"0x<交易哈希>"}   ← 只表示节点接收，不表示上链
# 常见错误：nonce too low / replacement transaction underpriced /
#          insufficient funds for gas * price + value / already known
`)}
${mm('一次读链请求的完整调用链', `
sequenceDiagram
  participant B as 后端服务
  participant G as RPC 网关
  participant N as 节点
  B->>G: POST eth_getLogs（fromBlock 到 toBlock）
  G->>G: 检查限流配额和区块范围
  G->>N: 转发请求
  N->>N: 用 Bloom 和日志索引筛选
  N-->>G: 返回日志数组
  G-->>B: 200 OK + result
  B->>B: 校验 blockHash 与本地区块一致
  Note over B,N: 超时或 429 时按指数退避重试
`, [
  ['flow', '请求先经过网关限流，再由节点用 Bloom 过滤和索引找日志。'],
  ['fail', '区块范围太大时，服务商会报错（例如“query returned more than 10000 results”）或超时。要分段查询。'],
  ['key', '拿到日志后要核对 blockHash。若区块已被重组，同一高度的哈希会变化。'],
  ['limit', 'eth_getLogs 只能按 address 和 topics 过滤，不能按 data 里的金额过滤。']
])}

<h2>5. Block tag：latest、safe、finalized、pending</h2>
${tbl(['标签', '含义', '可能被重组吗', '适合'], [
  ['<code>latest</code>', '节点看到的最新区块', '可能（通常 1–2 块）', '展示、预估、小额实时业务'],
  ['<code>safe</code>', '已获得多数投票、被视为安全的区块（justified）', '极少，需要大规模攻击', '中等金额入账'],
  ['<code>finalized</code>', '已最终确定的区块，约落后 2 个 epoch', '撤销需要罚没至少 1/3 质押', '大额入账、对账、跨链'],
  ['<code>pending</code>', '节点本地正在构建的“下一个块”', '是', '查询 nonce（含交易池中的交易）'],
  ['<code>earliest</code>', '创世块', '否', '很少使用']
])}
<p><strong>算一算（示例）</strong>：一个 epoch = 32 × 12 秒 = 384 秒。finalized 一般落后 latest 约 2–3 个 epoch，即 64–96 个区块、约 12.8–19.2 分钟。</p>
${call('warn', `<p><strong>查 nonce 要用 pending</strong>：<code>eth_getTransactionCount(addr, "pending")</code> 包含交易池里还没打包的交易；用 "latest" 会拿到已打包的数量，连续发交易时会产生重复 nonce。<a href="#m03-6">M09.6 Nonce 管理</a>详细讲。</p>`)}

<h2>6. WebSocket 订阅</h2>
${code('BASH', `
# 用 wscat（npm i -g wscat）连接 WebSocket 端点
wscat -c wss://ethereum-rpc.publicnode.com
> {"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newHeads"]}
< {"jsonrpc":"2.0","id":1,"result":"0x9ce59a13059e417087c02d3236a0b1cc"}
< {"jsonrpc":"2.0","method":"eth_subscription","params":{"subscription":"0x9ce5…","result":{"number":"0x1312d01","hash":"0x…","parentHash":"0x…"}}}

# 订阅某合约的 Transfer 事件
> {"jsonrpc":"2.0","id":2,"method":"eth_subscribe","params":["logs",{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]}]}
# 发生重组时，节点会把已推送过的日志再推一次，并带 "removed": true
`)}
${call('warn', `<p><strong>订阅不可靠，不能单独用于入账。</strong>WebSocket 断线期间的事件会丢失，节点不会补发。正确做法：订阅只当“有新块了”的提醒，真正的数据用按高度拉取（eth_getBlockByNumber / eth_getLogs）+ 游标保证不漏。断线重连后，从游标处补拉。</p>`)}

<h2>7. 限流、超时、重试</h2>
${steps([
  '<strong>超时</strong>：每个请求设置超时（示例：普通读 5 秒，eth_getLogs 15 秒）。不设超时，一个卡住的请求会拖住整个扫块循环。',
  '<strong>重试</strong>：只对网络错误、5xx、429、-32603 重试；参数错误（-32602）不重试。用指数退避加随机抖动：等待 = min(上限, 基数 × 2<sup>次数</sup>) × (0.5–1.5 的随机数)。',
  '<strong>幂等</strong>：读请求天然幂等；<code>eth_sendRawTransaction</code> 重试同一个原始交易也安全，重复时节点返回 already known。',
  '<strong>批量</strong>：JSON-RPC 支持把多个请求放进一个 JSON 数组一次发送，减少往返。服务商通常限制单批数量（示例：每批 ≤ 100）。',
  '<strong>限流</strong>：客户端自己做令牌桶，别等服务商返回 429。按方法计费的服务商中，eth_getLogs 和 trace 类方法通常更贵。',
  '<strong>熔断</strong>：某个节点连续失败超过阈值（示例：30 秒内错误率 &gt; 20%），暂时摘除，切到备用节点。'
])}
${tryit(`<ol>
<li>打开终端，执行 4.1 节的 eth_blockNumber 命令，用 <code>printf "%d\\n"</code> 换算成十进制。<strong>预期</strong>：和 etherscan.io 首页显示的最新区块相差不超过几个块。</li>
<li>执行 4.5 节的 eth_call，把地址换成你自己的测试地址（去掉 0x、补到 64 位）。<strong>预期</strong>：没有 USDC 时返回 64 个 0。</li>
<li>把 eth_getLogs 的区块范围扩大到 100,000 个块。<strong>预期</strong>：返回范围过大或结果过多的错误，体会为什么要分段。</li>
<li>发一个批量请求：<code>--data '[{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]},{"jsonrpc":"2.0","id":2,"method":"eth_chainId","params":[]}]'</code>。<strong>预期</strong>：返回一个数组，eth_chainId 结果为 <code>0x1</code>。</li>
</ol>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['至少 2 个独立 RPC 源', '单节点会落后、宕机或返回错误数据', '关闭其中一个，服务仍正常'],
  ['每个请求有超时和重试上限', '防止扫块循环卡死', '用故障注入让节点延迟 30 秒，观察是否超时切换'],
  ['历史查询路由到归档节点', '全节点查不到旧状态', '请求 100 万块前的余额，确认不报 missing trie node'],
  ['eth_getLogs 分段且有上限', '大范围查询会失败或很贵', '代码里有 maxRange 配置'],
  ['WebSocket 只做提醒', '订阅断线会丢事件', '断开 WS 5 分钟，重连后数据无缺失'],
  ['监控 RPC 错误率和延迟', '提前发现服务商故障', '指标 rpc_request_errors_total、rpc_request_duration_seconds 有告警']
])}
${mistakes([
  ['eth_sendRawTransaction 返回哈希就代表交易成功。', '它只表示节点接收了交易。要轮询回执，检查 status，并等待足够确认。'],
  ['全节点能查任意历史高度的余额。', '全节点只保留最近一段状态。历史状态查询需要归档节点。'],
  ['WebSocket 订阅能保证每个事件都收到。', '断线期间的事件会丢失。必须用按高度拉取 + 游标兜底。'],
  ['十六进制数可以随便补 0。', 'QUANTITY 类型不能有前导 0（零写 0x0）；DATA 类型必须是偶数个字符。'],
  ['latest 的数据就是最终的。', 'latest 可能被重组。重要业务用 safe 或 finalized。']
])}
${recap([
  '节点 = 执行层 + 共识层客户端；全节点存最近状态，归档节点存全部历史状态，轻节点只存区块头。',
  'JSON-RPC 请求含 jsonrpc、id、method、params；响应含 result 或 error。',
  '七个核心方法：eth_blockNumber、eth_getBalance、eth_getBlockByNumber、eth_getTransactionReceipt、eth_call、eth_getLogs、eth_sendRawTransaction。',
  '数值都是十六进制 wei；1 ETH = 10¹⁸ wei；大数用 big.Int 或 cast 换算。',
  'block tag：latest 可能重组，safe 较安全，finalized 最终；查 nonce 用 pending。',
  '订阅只做提醒；请求要有超时、指数退避重试、限流、熔断和多源。'
])}
${quiz([
  { q: 'eth_getBalance 返回 "0xde0b6b3a7640000"。这是多少 ETH？', o: ['0.1 ETH', '1 ETH', '10 ETH', '1000 ETH'], a: 1, why: '0xde0b6b3a7640000 = 10¹⁸ wei = 1 ETH。这是最常见的数字之一，值得记住。' },
  { q: '你要查询 2018 年某区块时某地址的余额，应该用什么节点？', o: ['轻节点', '任意全节点', '归档节点', 'WebSocket 订阅'], a: 2, why: '全节点只保留最近一段状态，查旧状态会报 missing trie node。归档节点保存所有历史状态。' },
  { q: '交易所要为 50 万美元的 USDC 充值入账，应该以哪个 block tag 为准？', o: ['finalized', 'latest', 'pending', 'earliest'], a: 0, why: '大额入账应等最终确定，撤销 finalized 区块需要罚没至少 1/3 质押。latest 和 pending 可能被重组或替换。' },
  { q: '关于 WebSocket 订阅 logs，哪个说法正确？', o: ['断线后节点会补发丢失的事件', '订阅的事件永远不会被撤回', '订阅比 eth_getLogs 更适合做对账', '重组时节点会再次推送该日志并标记 removed: true'], a: 3, why: '重组时节点推送 removed: true 的日志。断线期间的事件不会补发，所以对账要靠按高度拉取。' }
])}
${exercises([["计算题（示例）：eth_getBalance 返回 <code>0x29a2241af62c0000</code>；对 USDC 合约 eth_call balanceOf 返回的值是 <code>0x5f5e100</code>（左侧补 0）。分别换算成多少 ETH 和多少 USDC？", "<p>0x29a2241af62c0000 = 3,000,000,000,000,000,000 wei。除以 10¹⁸，等于 3 ETH。0x5f5e100 = 100,000,000，USDC decimals = 6，等于 100 USDC。超过 2⁶³ 的数不要用 printf 换算，用 cast 或 big.Int。</p>"], ["设计题（示例）：为后端的 RPC 客户端写一条重试规则。哪些错误重试、哪些不重试？基数 0.5 秒、上限 8 秒时，第 3 次重试等多久？", "<p>重试：网络错误、5xx、HTTP 429、-32603。不重试：参数错误 -32602。等待 = min(上限, 基数 × 2^次数) × (0.5–1.5 的随机数)。第 3 次：min(8, 0.5 × 2³) = 4 秒，乘以随机系数后在 2–6 秒之间。</p>"], ["思考题：后端连续发多笔交易时，为什么查 nonce 要用 <code>eth_getTransactionCount(addr, \"pending\")</code>，而不是 \"latest\"？", "<p>\"latest\" 只统计已打包的交易数。\"pending\" 还包含交易池里还没打包的交易。连续发交易时，前一笔可能还在交易池里。用 \"latest\" 会拿到相同的 nonce，产生重复 nonce。</p>"]])}
${checklist(["能说出全节点、归档节点、轻节点各自能回答和不能回答的问题。", "做过用 curl 调通 eth_blockNumber、eth_getBalance、eth_call 和 eth_getLogs。", "能把 RPC 返回的十六进制 wei 换算成 ETH 或代币数量。", "能为不同金额的业务选择 latest、safe 或 finalized，并用 pending 查 nonce。", "能为 RPC 调用设计超时、指数退避重试、限流和熔断规则。"])}
${terms([
  ['JSON-RPC', 'JSON Remote Procedure Call', '以 JSON 描述方法和参数的远程调用协议'],
  ['全节点', 'Full Node', '保存全部区块并验证，只保留最近状态的节点'],
  ['归档节点', 'Archive Node', '保存每个历史区块完整状态的节点'],
  ['执行层客户端', 'Execution Client', '执行交易、维护状态、提供 JSON-RPC 的程序，如 Geth'],
  ['共识层客户端', 'Consensus Client', '负责 PoS 共识的程序，如 Lighthouse、Prysm'],
  ['区块标签', 'Block Tag', 'latest、safe、finalized、pending 等表示区块位置的关键字'],
  ['指数退避', 'Exponential Backoff', '失败后等待时间按指数增长的重试策略'],
  ['熔断', 'Circuit Breaker', '依赖故障率过高时暂时停止调用它的保护机制']
])}
` });
})();
