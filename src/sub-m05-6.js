/* ---------- M06 多链生态（比特币）：m05-60 UTXO 与脚本 · m05-61 SegWit/Taproot/PSBT · m05-62 闪电网络 · m05-63 铭文、Runes 与比特币 L2 ---------- */
(() => {
CUR = 'm05-60';
addCh({ id: 'm05-60', nav: '比特币 UTXO 与脚本', title: 'M06.1 比特币：UTXO、交易结构与脚本', desc: '逐字段拆开比特币交易，看懂输出类型、手续费、RBF 和选币找零', html: `
<h1>M06.1 比特币：UTXO、交易结构与脚本</h1>
${meta(['逐字段说出一笔比特币交易的结构（version、输入、输出、witness、nLockTime、nSequence），并解释 txid 和 wtxid 的区别。', '认出 P2PKH、P2SH、P2WPKH、P2WSH、P2TR 五种标准输出，说出它们的锁定脚本、地址前缀和输入体积。', '按 sat/vB 手算手续费，用 RBF 或 CPFP 加速卡住的交易，并比较三种选币策略对手续费、找零和隐私的影响。'], '前置：<a href="#m05-1">M04.1 公链全景</a>、<a href="#m03-3">M08.3 交易签名与广播</a>', ['utxo'])}
${beginner(`<p><strong>聪（satoshi，sat）</strong>：比特币的最小单位。1 BTC = 100,000,000 sat。链上所有金额都用整数 sat 表示。</p>
<p><strong>输出点（outpoint）</strong>：一个 UTXO 的“门牌号”，写作 <code>txid:vout</code>，即“哪笔交易的第几个输出”。</p>
<p><strong>脚本（Script）</strong>：比特币自带的一种小型栈式语言。每个输出都写一段“锁”，花它的人要提供能打开这把锁的“钥匙”。</p>
<p><strong>虚拟字节（vbyte，vB）</strong>：比特币按交易“体积”收手续费。SegWit 之后，签名数据打折计算，折算后的体积单位叫 vB。</p>
<p><strong>内存池（mempool）</strong>：每个节点内存里“已广播、未上链”的交易集合。矿工从里面挑交易打包。</p>`)}

<h2>1. 一句话理解</h2>
${one('比特币交易不改“余额”，而是<strong>整枚消耗</strong>旧的未花费输出（UTXO），再创建新的 UTXO；每个输出带一段脚本当作锁，手续费等于“输入合计 − 输出合计”，按交易体积（sat/vB）竞价。')}
${call('analogy', `<p>UTXO 像钱包里面额不同的纸币。付 70 元，你掏出一张 50 元和一张 20 元，或者一张 100 元再收 30 元找零。纸币不能撕开用，只能整张交出去、再拿回找零。每张纸币上还印着一把小锁（脚本），只有对得上钥匙（签名）的人才能花。</p>
<p>比喻的局限：现实中找零是收银员给你；比特币里找零要<strong>你自己写进交易</strong>。忘了写，差额全部变成手续费送给矿工。</p>`)}
${art('一图看懂：UTXO 像纸币，整张花掉，再找零', 660, 320, [
  S.text(110, 24, '花之前：你的 3 个 UTXO', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(330, 24, '一笔交易', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(550, 24, '花之后：新生成的 UTXO', { size: 13.5, b: 1, anchor: 'middle' }),
  S.box(10, 40, 200, 56, { k: 'warn', icon: 'lock', t: '0.5 BTC', s: '输入 1 · 整张花掉', tag: '选中', mono: 1 }),
  S.box(10, 104, 200, 56, { k: 'warn', icon: 'lock', t: '0.3 BTC', s: '输入 2 · 整张花掉', tag: '选中', mono: 1 }),
  S.box(10, 168, 200, 56, { k: 'idle', dash: 1, icon: 'lock', t: '0.08 BTC', s: '没用到 · 原样留着', mono: 1 }),
  S.box(265, 56, 130, 140, { k: 'tint', t: '验证每把锁的签名', s: '输入合计 0.8 BTC\n旧 UTXO 从此作废' }),
  S.arrow(212, 68, 262, 110), S.arrow(212, 132, 262, 132),
  S.box(450, 40, 200, 56, { k: 'ok', icon: 'lock', t: '0.7 BTC', s: '输出 1 · 锁给收款人', tag: '新', mono: 1 }),
  S.box(450, 104, 200, 56, { k: 'info', icon: 'lock', t: '0.0998 BTC', s: '输出 2 · 找零，锁回自己', tag: '新', mono: 1 }),
  S.box(450, 168, 200, 56, { k: 'risk', t: '0.0002 BTC', s: '手续费 · 不是输出，归矿工', r: 28, mono: 1 }),
  S.arrow(397, 100, 447, 68), S.arrow(397, 128, 447, 132), S.arrow(397, 160, 447, 192, { dash: 1 }),
  S.route([[652, 132], [658, 132], [658, 262], [110, 262], [110, 228]], { k: 'info', dash: 1, label: '找零回到钱包，成为一个新的 UTXO' }),
  S.text(330, 304, '输入 0.5 + 0.3 ＝ 输出 0.7 + 找零 0.0998 + 手续费 0.0002（示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '钱包先挑出够付的 UTXO 当输入；交易把它们整张花掉，再生成新的 UTXO：一个给收款人，一个找零给自己。'],
  ['key', 'UTXO 不能只花一部分。“余额”只是钱包把所有属于你的 UTXO 加起来的结果，链上没有“账户余额”这个字段。'],
  ['risk', '手续费 = 输入合计 − 输出合计。忘了写找零输出，多出来的钱会全部变成手续费。'],
  ['limit', '每个 UTXO 上的小锁是一段脚本。能提供对应签名的人才能花它，详见本篇第 4 节。']
], '两个旧的 UTXO 作为输入被整张花掉，交易生成给收款人的新 UTXO 和找零，差额是手续费', 'm05-60')}

<h2>2. UTXO 模型：和账户模型差在哪里</h2>
${recall('<p>UTXO 的基本概念（输入整枚消耗、找零输出、余额 = 你所有 UTXO 之和）在 <a href="#m05-1">M04.1 公链全景</a> 第 3.1 节讲过；一笔“两个输入、两个输出”的手续费算法在 <a href="#m03-3">M08.3 交易签名与广播</a> 第 6.1 节讲过。以太坊交易的 nonce、gas 和回执见 <a href="#m01-4">M01.4 交易全解</a>。本篇只讲这些文章没有展开的部分：交易字节结构、脚本、内存池规则和选币算法。</p>')}
${compare('UTXO 模型与账户模型：工程上的差异', [
  { name: '比特币 UTXO', tag: '状态 = 未花费输出集合', kind: 'key', points: ['防双花：同一个 outpoint 只能被花一次', '没有 nonce；交易之间靠“花的是哪个输出”排序', '余额要自己汇总：扫描属于你的全部 UTXO', '交易无效就不会上链，不存在“失败但扣费”', '一个钱包有很多地址，找零地址默认每次换新'] },
  { name: '以太坊账户', tag: '状态 = 地址 → 余额/存储', kind: 'info', points: ['防双花：账户 nonce 严格递增', 'nonce 卡住会阻塞后面所有交易', '余额直接读一个字段', '交易可以上链但执行失败（revert），仍扣 Gas', '通常一个地址长期使用'] }
], [
  ['flow', 'UTXO 交易的输入互不依赖，节点可以并行验证；账户交易要按 nonce 顺序执行。'],
  ['key', '比特币“替换交易”的方法是：用另一笔交易花掉同一个 outpoint。以太坊是用同一个 nonce 重发。'],
  ['risk', '充值系统用“地址余额变化”判断入账，在 UTXO 链上会漏账或重复入账。要以“txid:vout”为幂等键（见 <a href="#m04-6">M09.7 充值提币与冷热钱包</a>）。'],
  ['limit', 'UTXO 模型适合表达“谁能花这笔钱”，很难表达复杂的共享状态（例如 AMM 池子）。这是比特币没有原生 DeFi 的根本原因之一。']
])}

<h2>3. 交易结构：逐字段拆开</h2>
<p>一笔 SegWit 交易按下面顺序序列化。数字字段一律<strong>小端序</strong>。</p>
${tbl(['字段', '长度', '含义'], [
  ['<code>version</code>', '4 字节', '交易版本。版本 ≥ 2 才启用相对时间锁（BIP68）；版本 3 是 Bitcoin Core 28.0 起的 TRUC 交易' + cite('Bitcoin Core 28.0 发布说明', 'https://bitcoincore.org/en/releases/28.0/')],
  ['<code>marker</code> + <code>flag</code>', '2 字节', '固定为 <code>00 01</code>，表示后面带见证数据（只有 SegWit 交易有）'],
  ['输入个数 + 输入列表 <code>vin[]</code>', '变长', '每个输入 = 上一笔交易的 <code>txid</code>（32 字节）+ <code>vout</code>（4 字节）+ <code>scriptSig</code> + <code>nSequence</code>（4 字节）'],
  ['输出个数 + 输出列表 <code>vout[]</code>', '变长', '每个输出 = 金额 <code>value</code>（8 字节，单位 sat）+ 锁定脚本 <code>scriptPubKey</code>'],
  ['<code>witness</code>', '变长', '每个输入一组见证数据（签名、公钥、脚本）。SegWit 输入的 scriptSig 为空，签名放在这里'],
  ['<code>nLockTime</code>', '4 字节', '绝对时间锁。小于 500,000,000 表示区块高度，否则表示 Unix 时间戳；0 表示不锁']
])}
${mm('一笔交易怎样引用和创建 UTXO', `
flowchart LR
  subgraph P["之前的交易（已上链）"]
    PA["tx A 的输出 #1<br/>80,000 sat<br/>锁：Alice 的公钥哈希"]
    PB["tx B 的输出 #0<br/>30,000 sat<br/>锁：Alice 的公钥哈希"]
  end
  subgraph T["新交易 tx C"]
    I0["输入 0：A:1<br/>nSequence"]
    I1["输入 1：B:0<br/>nSequence"]
    W["witness：签名 + 公钥"]
    O0["输出 0：100,000 sat<br/>锁：Bob"]:::key
    O1["输出 1：找零 8,580 sat<br/>锁：Alice 新地址"]
  end
  PA --> I0
  PB --> I1
  W -.->|"解锁"| I0
  W -.->|"解锁"| I1
  T -.->|"110,000 − 108,580"| FEE["手续费 1,420 sat"]:::warn
`, [
  ['flow', '输入只写“引用哪个旧输出”，不写金额。验证节点要去 UTXO 集合里查出这个输出的金额和锁定脚本。'],
  ['key', '手续费没有专门字段，等于输入金额合计减输出金额合计。硬件钱包要知道每个输入的金额才能显示手续费，这正是 PSBT 要携带 UTXO 信息的原因（见 <a href="#m05-61">M06.2</a>）。'],
  ['fail', '引用一个已经被花掉或不存在的输出，节点直接拒绝这笔交易（missing inputs）。'],
  ['risk', '找零金额写错或漏写找零输出，差额就变成手续费，链上没有撤回机制。']
])}
<p><strong>txid 与 wtxid。</strong>txid 是“不含 witness 的序列化”做两次 SHA-256；wtxid 包含 witness。因为签名不进入 txid，第三方改动签名编码不会改变 txid。这就是 SegWit 修复的<strong>交易延展性（malleability）</strong>${cite('BIP141：Segregated Witness', 'https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki')}。细节见 <a href="#m05-61">M06.2 SegWit、Taproot 与 PSBT</a>。</p>
<p><strong>nSequence 的三种用途：</strong></p>
${steps([
  '<code>0xffffffff</code>：最终值。所有输入都是这个值时，nLockTime 不生效。',
  '小于 <code>0xfffffffe</code>：按 BIP125 表示“允许被替换”（RBF 信号）' + cite('BIP125：Opt-in Full Replace-by-Fee', 'https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki') + '。',
  '交易版本 ≥ 2 且最高位为 0 时：低位表示<strong>相对时间锁</strong>（BIP68），即“被引用的输出上链后再过 N 个区块才能花”。闪电网络的惩罚窗口就靠它。'
])}
${call('info', '<p>coinbase 交易（区块里第一笔、给矿工发奖励的交易）没有真实输入。它创建的输出要等 <strong>100 个区块</strong>之后才能花，这叫 coinbase 成熟期。在 regtest 里先挖 101 个块，就是为了让第一笔奖励可以花。</p>')}

<h2>4. 脚本与标准输出类型</h2>
<p>Script 是基于栈的语言，没有循环，故意不图灵完备。验证一个输入时，节点把“解锁数据”和“锁定脚本”合在一起执行；最后栈顶为真，输入才有效。以最早的 P2PKH 为例：</p>
${steps2('P2PKH 的验证过程', [
  { t: '锁定脚本', d: '<code>OP_DUP OP_HASH160 &lt;公钥哈希 20 字节&gt; OP_EQUALVERIFY OP_CHECKSIG</code>' },
  { t: '解锁数据', d: 'scriptSig = <code>&lt;签名&gt; &lt;公钥&gt;</code>，先压栈' },
  { t: '复制并哈希公钥', d: 'OP_DUP 复制公钥，OP_HASH160 算出 RIPEMD160(SHA256(公钥))' },
  { t: '比对哈希', d: 'OP_EQUALVERIFY：与锁里的 20 字节不相等就立即失败', kind: 'warn' },
  { t: '验证签名', d: 'OP_CHECKSIG 用公钥验证签名覆盖的交易摘要，成功则压入 true', kind: 'key' }
], [
  ['flow', '锁里只放公钥哈希，花费时才公开公钥。地址就是这 20 字节哈希加上版本和校验码的编码结果。'],
  ['key', '签名覆盖的是“交易摘要”（sighash），不是整笔原始字节。签名类型 SIGHASH_ALL 覆盖全部输入和输出。'],
  ['limit', 'Script 只能检查签名、哈希、时间锁等条件，不能读取别的 UTXO 或链上状态。']
])}
${tbl(['类型', '地址前缀', '锁定脚本（scriptPubKey）', '花费时提供', '输入约多大', 'BIP'], [
  ['P2PKH', '<code>1…</code>', '<code>OP_DUP OP_HASH160 &lt;20B&gt; OP_EQUALVERIFY OP_CHECKSIG</code>', 'scriptSig：签名 + 公钥', '148 vB', '（早期）'],
  ['P2SH', '<code>3…</code>', '<code>OP_HASH160 &lt;脚本哈希 20B&gt; OP_EQUAL</code>', 'scriptSig：解锁数据 + 完整赎回脚本', '取决于脚本', 'BIP16'],
  ['P2WPKH', '<code>bc1q…</code>（42 字符）', '<code>OP_0 &lt;20B&gt;</code>', 'witness：签名 + 公钥', '68 vB', 'BIP141 / 173'],
  ['P2WSH', '<code>bc1q…</code>（62 字符）', '<code>OP_0 &lt;脚本 SHA256 32B&gt;</code>', 'witness：解锁数据 + 见证脚本', '取决于脚本', 'BIP141'],
  ['P2TR', '<code>bc1p…</code>', '<code>OP_1 &lt;调整后公钥 32B&gt;</code>', 'witness：一个 Schnorr 签名（密钥路径）', '57.5 vB', 'BIP341 / 350']
])}
<p>表中的输入体积来自 Bitcoin Optech 的交易体积计算器${cite('Bitcoin Optech：交易体积计算器', 'https://bitcoinops.org/en/tools/calc-size/')}；输出体积：P2PKH 34 vB、P2WPKH 31 vB、P2TR 43 vB。P2TR 的密钥路径和脚本路径在 <a href="#m05-61">M06.2</a> 详细讲${cite('BIP341：Taproot', 'https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki')}。</p>
<p><strong>算一算（示例）</strong>：一个输入、两个输出（付给对方的 P2WPKH 输出 + 自己的找零输出），费率 12 sat/vB。</p>
${steps([
  '钱包用 P2TR：体积 ≈ 10.5（交易开销）+ 57.5（输入）+ 31（收款输出）+ 43（找零输出）= <strong>142 vB</strong>，手续费 = 142 × 12 = <strong>1,704 sat</strong>。',
  '钱包用 P2PKH：体积 ≈ 10 + 148 + 31 + 34 = <strong>223 vB</strong>，手续费 = 223 × 12 = <strong>2,676 sat</strong>。',
  '结论：同一笔转账，旧地址类型多付约 57% 手续费。输入越多，差距越大。企业钱包新建地址应默认用 P2WPKH 或 P2TR（派生路径见 <a href="#m03-2">M08.2 助记词与 HD 钱包</a>）。'
])}

<h2>5. 手续费、内存池与确认</h2>
<p>节点收到交易后先检查<strong>共识规则</strong>（签名有效、输入存在、金额不超支），再检查本节点的<strong>中继策略（policy）</strong>：费率是否高于最低中继费率、输出是否是粉尘、交易是否是“标准”格式。策略不是共识，不同节点可以配置不同；但大多数节点使用 Bitcoin Core 默认值。例如 Bitcoin Core 30.0 把默认最低中继费率降到 0.1 sat/vB${cite('Bitcoin Core 30.0 发布说明', 'https://bitcoincore.org/en/releases/30.0/')}；粉尘阈值在默认 dust 费率下为 P2WPKH 294 sat、非 SegWit 输出 546 sat${cite('Bitcoin Core 源码：policy.cpp GetDustThreshold', 'https://github.com/bitcoin/bitcoin/blob/master/src/policy/policy.cpp')}。</p>
${mm('一笔比特币交易的状态', `
stateDiagram-v2
  state "已签名未广播" as Signed
  state "在内存池中" as Mempool
  state "被替换 RBF" as Replaced
  state "被逐出或过期" as Evicted
  state "1 次确认" as Conf1
  state "6 次以上确认" as Deep
  [*] --> Signed
  Signed --> Mempool: 广播并通过策略检查
  Mempool --> Replaced: 更高费的冲突交易
  Mempool --> Evicted: 费率太低且内存池满
  Mempool --> Conf1: 被矿工打包
  Conf1 --> Mempool: 区块被重组
  Conf1 --> Deep: 后续区块叠加
  Evicted --> Mempool: 重新广播或 CPFP
  Deep --> [*]
`, [
  ['flow', '交易从内存池进入区块。每多一个后续区块，就多一次确认。'],
  ['fail', '内存池满时，节点逐出费率最低的交易。被逐出不等于失败：交易仍然有效，任何人都能重新广播它。'],
  ['risk', '1 次确认的交易仍可能因为区块重组回到内存池，甚至被冲突交易替换。大额入账要等更多确认（常用 6 次，' + tag('惯例') + '）。'],
  ['key', '“没上链”只能在原输入被另一笔已确认交易花掉之后，才能判定为最终失败。']
])}
<h3>5.1 卡住了怎么办：RBF 与 CPFP</h3>
${tbl(['方法', '谁来做', '怎么做', '条件'], [
  ['RBF（Replace-by-Fee）', '发送方', '重新签一笔花<strong>同样输入</strong>、手续费更高的交易，替换原交易', '新交易的总手续费 ≥ 原交易，并额外支付自己体积的中继费（BIP125 规则）。Bitcoin Core 28.0 起默认 full-RBF：不再要求原交易发出 RBF 信号' + cite('Bitcoin Core 28.0 发布说明', 'https://bitcoincore.org/en/releases/28.0/')],
  ['CPFP（Child Pays For Parent）', '收款方或找零方', '花掉卡住交易的某个输出，给子交易付高费；矿工按“父 + 子”的总费率打包', '你必须控制卡住交易的一个输出（收款或找零）'],
  ['包中继 / TRUC', '协议层', 'Bitcoin Core 28.0 起支持“一父一子”包中继，父交易费率可以低于最低中继费率；版本 3 交易有更严格的拓扑限制，让替换更可靠', '主要用于闪电网络等预签名交易的场景']
])}
<p><strong>算一算（示例）</strong>：一笔 142 vB 的交易以 5 sat/vB（710 sat）广播后卡住，现在市场费率是 20 sat/vB。</p>
${steps([
  'RBF：新交易同样 142 vB，按 20 sat/vB 付 2,840 sat。2,840 ≥ 710 + 142 × 0.1，满足替换规则。多花 2,130 sat。',
  'CPFP：子交易花掉找零输出，体积 110 vB。父子总体积 252 vB，要达到 20 sat/vB 需要总费 5,040 sat。父交易已付 710，子交易要付 5,040 − 710 = <strong>4,330 sat</strong>（子交易自身费率约 39 sat/vB）。',
  '结论：能 RBF 时更省钱；只有收款方或无法重签时才用 CPFP。'
])}
${call('warn', '<p>收款方<strong>不要把未确认交易当作已到账</strong>。full-RBF 默认开启后，付款方可以随时用一笔花同样输入的交易把钱转回自己。商户和交易所的入账逻辑必须以确认数为准。</p>')}

<h2>6. 选币与找零</h2>
<p>钱包付款时要从自己的 UTXO 里挑出一组，叫<strong>选币（coin selection）</strong>。它同时影响三件事：这次的手续费、以后的手续费（留下多少碎 UTXO）、隐私（找零输出暴露你的余额结构）。</p>
${tbl(['策略', '做法', '优点', '缺点'], [
  ['最大优先', '按金额从大到小选，够了就停', '输入最少，本次手续费最低', '小 UTXO 越积越多，费率高时变成“不经济”'],
  ['最小优先', '按金额从小到大选', '顺便整理碎片', '本次输入多，费率高时很贵'],
  ['分支定界（BnB）', '搜索一组输入，使合计正好覆盖“金额 + 手续费”，多出的零头小于“建一个找零输出的成本”', '不产生找零：省一个输出，隐私更好', '不一定能找到；找不到要回退到其他算法'],
  ['随机单抽（SRD）等', '随机选，直到够', '让 UTXO 使用模式不易被识别', '结果不稳定，需要和其他算法比较']
])}
<p>Bitcoin Core 钱包会同时运行多种算法（BnB、Knapsack、SRD，27.0 起还有 CoinGrinder${cite('Bitcoin Core 27.0 发布说明', 'https://bitcoincore.org/en/releases/27.0/')}），再用一个“浪费（waste）”指标选出最优结果。“浪费”考虑两部分：现在多付的输入费用，以及找零带来的成本或被并入手续费的零头。</p>
<p>先做实验：保持默认值，在三种策略之间切换，看输入个数、手续费和找零怎样变化。然后把费率拉到 150 sat/vB，观察哪个 UTXO 变成“不经济”。</p>
${lab('utxo')}
<p>你应该看到：精确匹配找到“850,000 + 152,000 + 4,000”这一组，不需要找零；最大优先只用一个 1,200,000 的输入，但要找零约 19.7 万 sat；费率很高时，4,000 sat 的 UTXO 的“有效价值”（金额减去花它的手续费）变成负数，钱包应该跳过它。</p>
${call('deep', '<p><strong>找零与隐私</strong>：区块链分析常用“找零启发式”识别哪个输出是找零，例如“金额不是整数的那个”“地址类型和输入相同的那个”。所以：找零地址每次用新的（HD 钱包内部链 change = 1）；找零输出的地址类型尽量和收款输出一致；不要把来源不同的 UTXO 随意合并（共同输入启发式会认为它们属于同一个人）。链上取证怎样利用这些规律，见 <a href="#m05-67">M12.5 链上取证与资金追踪</a>。</p>')}

<h2>7. 工程层：用 bitcoin-cli 看清每个字段</h2>
${code('BASH', `
# 读一笔交易（不在钱包里的已确认交易，需要节点开启 -txindex）
bitcoin-cli getrawtransaction <txid> true      # vin / vout / vsize / weight
bitcoin-cli decoderawtransaction <hex>         # 解码一段原始交易

# 钱包里的 UTXO：选币的原材料
bitcoin-cli -rpcwallet=hot listunspent 1        # 至少 1 次确认的 UTXO

# 费率估计：6 个区块内确认，返回 BTC/kvB（乘 100,000 得到 sat/vB）
bitcoin-cli estimatesmartfee 6

# 内存池里的一笔交易：vsize、手续费、祖先和后代
bitcoin-cli getmempoolentry <txid>
bitcoin-cli getmempoolinfo                      # mempoolminfee：当前最低入池费率

# 广播前先检查能否进入内存池（不会真的广播）
bitcoin-cli testmempoolaccept '["<signed_hex>"]'

# 钱包内加速：RBF
bitcoin-cli -rpcwallet=hot bumpfee <txid> '{"fee_rate": 20}'   # 单位 sat/vB
`)}
${tbl(['生产环境检查项', '为什么', '怎么验证'], [
  ['入账幂等键用 <code>txid:vout</code>', '一笔交易可能给你多个输出', '构造一笔给同一地址两个输出的交易，确认入账两条'],
  ['入账只看确认数，不看内存池', 'full-RBF 下未确认交易可被替换', '在 regtest 里用 RBF 替换一笔未确认付款，确认系统不入账'],
  ['提币前做费率上限检查', '费率估计异常或单位换算错误（BTC/kvB 与 sat/vB 差 10 万倍）会烧掉大量手续费', '单测：手续费 > 金额的 X%（示例 5%）时拒绝签名'],
  ['定期整理 UTXO', '高费率时小 UTXO 变成不经济', '监控“UTXO 数量”和“有效价值 < 0 的 UTXO 数”，在低费率时段合并'],
  ['跟踪提币以 outpoint 是否被花为准', 'txid 可能因替换而变化', '对账脚本按输入 outpoint 查询状态，而不是只按 txid']
])}

${tryit(`<p><strong>动手练习：</strong>在 mempool.space 上读一笔真实交易。</p>
${steps([
  '打开 mempool.space，点开首页任意一个最新区块，再点开其中一笔有 2 个以上输出的交易。',
  '记下：输入个数和每个输入的地址类型（页面会标 P2WPKH、P2TR 等）、输出个数、交易的 vsize、Fee 和 Fee rate（sat/vB）。',
  '验证公式：手续费 = 输入金额合计 − 输出金额合计；费率 = 手续费 ÷ vsize。',
  '猜哪个输出是找零：看金额是否是整数、地址类型是否和输入相同。',
  '展开交易详情，找到 RBF 标记和每个输入的 nSequence；检查 nLockTime 是否为 0 或一个接近当前高度的值（很多钱包把 nLockTime 设为当前高度，防止“抢费”式重组）。'
])}
<p>预期结果：你手算的手续费和费率与页面一致（允许小数舍入），并能说出这笔交易用了哪几种输出类型。</p>`)}

${exercises([
  ['（示例）钱包有 3 个 P2WPKH UTXO：600,000、250,000、9,000 sat。要付 820,000 sat，费率 30 sat/vB，收款输出和找零输出都是 P2WPKH。用最大优先选币，手续费和找零各多少？', '<p>先选 600,000：不够。再选 250,000，合计 850,000。带找零的体积 = 10.5 + 2 × 68 + 31 + 31 = 208.5 → 209 vB，手续费 = 209 × 30 = 6,270 sat。找零 = 850,000 − 820,000 − 6,270 = 23,730 sat，大于粉尘阈值 294，保留找零输出。</p>'],
  ['同一钱包里那个 9,000 sat 的 UTXO，在费率 150 sat/vB 时还值得花吗？', '<p>花一个 P2WPKH 输入要 68 vB × 150 = 10,200 sat，比它本身的 9,000 sat 还多。它的有效价值为负，钱包应跳过它，等费率低时再合并。</p>'],
  ['一笔付款的所有输入 nSequence 都是 0xffffffff，nLockTime = 900,000。这笔交易什么时候能上链？', '<p>马上就能上链：所有输入都是最终值时，nLockTime 不生效。要让时间锁生效，至少一个输入的 nSequence 必须小于 0xffffffff。</p>']
])}
${checklist([
  '能按顺序说出 SegWit 交易的序列化字段，并解释 txid 与 wtxid 的区别。',
  '能写出 P2PKH 的锁定脚本并逐步讲出它的验证过程。',
  '能根据地址前缀认出五种标准输出类型，并估算交易 vsize。',
  '能分别用 RBF 和 CPFP 手算加速一笔交易需要多少手续费。',
  '在 UTXO 实验里比较过三种选币策略，能说出精确匹配为什么不产生找零。',
  '在 mempool.space 上手算核对过一笔真实交易的手续费和费率。'
])}
${mistakes([
  ['比特币地址里有“余额”，转账就是改余额。', '链上只有 UTXO。地址余额是钱包或浏览器把属于这个地址的 UTXO 加起来得到的。'],
  ['手续费写在交易的某个字段里。', '没有手续费字段。手续费 = 输入合计 − 输出合计，所以漏写找零会把差额全给矿工。'],
  ['手续费和转账金额成正比。', '手续费按交易体积（vB）收，和金额无关。输入越多、地址类型越旧，交易越大。'],
  ['交易被内存池逐出就是失败了，可以退款。', '被逐出的交易仍然有效，可以被任何人重新广播。原输入被别的已确认交易花掉，才算最终失败。']
])}
${recap([
  '比特币交易整枚消耗旧 UTXO、创建新 UTXO；outpoint（txid:vout）是 UTXO 的唯一标识，也是入账幂等键。',
  '交易由 version、输入、输出、witness、nLockTime 组成；txid 不含 witness，所以 SegWit 修复了延展性。',
  '五种标准输出：P2PKH（1）、P2SH（3）、P2WPKH 与 P2WSH（bc1q）、P2TR（bc1p）；新地址类型的输入更小、手续费更低。',
  '手续费 = 输入 − 输出，按 sat/vB 竞价；卡住的交易用 RBF（发送方）或 CPFP（收款方）加速；未确认交易不能当到账。',
  '选币要兼顾本次手续费、未来手续费和隐私；精确匹配可以省掉找零输出。'
])}
${quiz([
  { q: '比特币交易的手续费怎样确定？', o: ['交易里有 fee 字段', '输入金额合计减去输出金额合计', '按转账金额的固定比例', '矿工打包后自己填写'], a: 1, why: '比特币没有手续费字段，差额就是手续费。所以必须显式写找零输出。比例收费和矿工填写都不对。' },
  { q: '下面哪种锁定脚本对应 bc1p 开头的地址？', o: ['OP_0 &lt;20 字节&gt;', 'OP_HASH160 &lt;20 字节&gt; OP_EQUAL', 'OP_DUP OP_HASH160 &lt;20 字节&gt; OP_EQUALVERIFY OP_CHECKSIG', 'OP_1 &lt;32 字节&gt;'], a: 3, why: 'bc1p 是见证版本 1 的 Taproot 输出，锁定脚本为 OP_1 加 32 字节调整后公钥。A 是 P2WPKH（bc1q），B 是 P2SH（3 开头），C 是 P2PKH（1 开头）。' },
  { q: '你是收款方，一笔付给你的交易费率太低卡住了。你能自己做什么？', o: ['用 RBF 替换它', '没有办法，只能等', '花掉这笔交易给你的输出，发一笔高费率子交易（CPFP）', '让节点删除这笔交易'], a: 2, why: '收款方控制自己的输出，可以用 CPFP 让矿工按父子总费率打包。RBF 需要重签原交易的输入，只有发送方能做。' },
  { q: '为什么入账系统不能把“内存池里看到的交易”当作已到账？', o: ['内存池里的交易金额是假的', '未确认交易可以被花同样输入的另一笔交易替换', '内存池交易没有签名', '内存池只保存 10 分钟'], a: 1, why: 'Bitcoin Core 28.0 起默认 full-RBF，付款方可以用冲突交易把钱转回自己。金额和签名本身是真实的，问题在于还没有最终性。' },
  { q: '费率 100 sat/vB 时，一个 5,000 sat 的 P2WPKH UTXO 为什么“不经济”？', o: ['它低于粉尘阈值 294 sat', '花它要 68 vB × 100 = 6,800 sat，超过它自己的价值', 'P2WPKH 不能和别的类型一起花', '小 UTXO 会被节点拒绝'], a: 1, why: '有效价值 = 金额 − 花它的手续费 = 5,000 − 6,800 &lt; 0。它高于粉尘阈值，所以不是粉尘规则的问题，而是在当前费率下不划算。' }
])}
${terms([
  ['未花费交易输出', 'UTXO', '尚未被任何交易花掉的输出，比特币状态的基本单位'],
  ['输出点', 'Outpoint', '用 txid:vout 唯一标识一个输出'],
  ['锁定脚本', 'scriptPubKey', '写在输出里的花费条件'],
  ['见证数据', 'Witness', 'SegWit 输入的签名等解锁数据，不计入 txid'],
  ['虚拟字节', 'vbyte (vB)', '交易权重除以 4，手续费按它计价'],
  ['绝对时间锁', 'nLockTime', '交易在某个高度或时间之前不能上链'],
  ['手续费替换', 'Replace-by-Fee (RBF)', '用花同样输入、手续费更高的交易替换原交易'],
  ['子为父付费', 'Child Pays For Parent (CPFP)', '用高费率子交易带动低费率父交易被打包'],
  ['粉尘', 'Dust', '金额低于花费成本阈值、默认不被中继的输出'],
  ['选币', 'Coin selection', '从钱包 UTXO 中挑选输入并决定是否找零的过程']
])}
` });

CUR = 'm05-61';
addCh({ id: 'm05-61', nav: 'SegWit·Taproot·PSBT', title: 'M06.2 SegWit、Taproot 与 PSBT', desc: '看懂权重单位、Schnorr 与 MAST，用 PSBT 在 regtest 走完多方签名流程', html: `
<h1>M06.2 SegWit、Taproot 与 PSBT</h1>
${meta(['用权重单位（WU）算出一笔 SegWit 交易的 vsize，并说清 SegWit 怎样修复交易延展性。', '画出 Taproot 输出的结构，区分密钥路径和脚本路径，说出 Schnorr 签名带来的密钥聚合与隐私好处。', '按 BIP174 的角色走完一次 PSBT 流程（创建 → 更新 → 签名 → 合并 → 最终化 → 提取），并在 bitcoin-cli regtest 上实际跑通。'], '前置：<a href="#m05-60">M06.1 比特币：UTXO、交易结构与脚本</a>、<a href="#m03-4">M08.4 多签钱包</a>')}
${beginner(`<p><strong>软分叉（Soft fork）</strong>：只收紧规则的协议升级。旧节点不升级也能继续跟随新链，只是看不懂新功能。SegWit 和 Taproot 都是软分叉。</p>
<p><strong>权重单位（Weight Unit，WU）</strong>：SegWit 之后衡量交易大小的单位。普通字节每字节算 4 WU，见证字节每字节算 1 WU。</p>
<p><strong>Schnorr 签名</strong>：一种比 ECDSA 更简单的签名算法。多个签名或公钥可以“加”在一起，变成一个。</p>
<p><strong>MAST（默克尔化抽象语法树）</strong>：把多个花费条件放进一棵默克尔树，花费时只公开用到的那一个。</p>
<p><strong>PSBT（部分签名比特币交易）</strong>：一种文件格式，让未签完的交易在钱包、硬件设备和多个签名人之间传递。</p>
<p><strong>描述符（Descriptor）</strong>：用一行文本完整描述“钱包能生成哪些地址、怎样签名”，例如 <code>wpkh([指纹/84h/0h/0h]xpub…/0/*)</code>。</p>`)}

<h2>1. 一句话理解</h2>
${one('SegWit 把签名搬出 txid 并打折计费，修复了延展性；Taproot 让任意复杂的花费条件在链上看起来都像一个普通单签；PSBT 是让多台设备、多个人协同签一笔比特币交易的标准文件格式。')}
${call('analogy', `<p>SegWit 像把合同的“签字页”从正文里拆出来：合同编号只按正文算，签字页怎么排版都不改编号，而且签字页按优惠价收存档费。Taproot 像一个保险箱：日常大家一起用一把总钥匙开门（密钥路径）；吵架时才打开抽屉里某一份应急预案（脚本路径），其他预案永远不用公开。PSBT 像一份在会签人之间传阅的审批单，每人只填自己那一栏。</p>
<p>比喻的局限：审批单可以被人偷改。PSBT 本身不防篡改，每个签名人都必须自己核对输出地址和金额。</p>`)}
${art('一图看懂：SegWit 管计费，Taproot 管隐私，PSBT 管协同签名', 660, 332, [
  S.text(110, 24, 'SegWit：签名拆出来，打折收', { size: 13.5, b: 1, anchor: 'middle', mw: 196 }),
  S.text(330, 24, 'Taproot：一个公钥藏一棵树', { size: 13.5, b: 1, anchor: 'middle', mw: 196 }),
  S.text(550, 24, 'PSBT：在多人之间传阅', { size: 13.5, b: 1, anchor: 'middle', mw: 196 }),
  S.box(10, 40, 200, 52, { k: 'info', t: '非见证 113 字节', s: '每字节 ×4 = 452 WU' }),
  S.text(110, 110, '+', { size: 18, b: 1, anchor: 'middle' }),
  S.box(10, 116, 200, 72, { k: 'ok', t: '见证（签名）110 字节', s: '每字节 ×1 = 110 WU' }),
  S.arrow(110, 190, 110, 214),
  S.box(10, 216, 200, 64, { k: 'tint', t: '562 WU ÷ 4 = 141 vB', s: '比旧算法少约 37%\n（1 入 2 出 P2WPKH）', mono: 1 }),
  S.box(230, 40, 200, 52, { k: 'warn', t: '内部公钥 P', s: '可以聚合多人公钥' }),
  S.text(330, 110, '+', { size: 18, b: 1, anchor: 'middle' }),
  S.box(230, 116, 200, 72, { k: 'info', t: '脚本树 3 个叶子', s: 'A 2-of-2 · B 单签+1 年\nC 恢复钥+2 年' }),
  S.arrow(330, 190, 330, 214),
  S.box(230, 216, 200, 64, { k: 'key', t: 'Q：链上只有 32 字节', s: '日常 1 个签名（密钥路径）\n吵架亮 1 个叶子（脚本路径）' }),
  S.box(450, 40, 200, 52, { k: 'info', t: 'PSBT 文件', s: '未签完的交易 + 说明' }),
  S.arrow(550, 93, 550, 115),
  S.box(450, 116, 200, 72, { k: 'info', t: '谁都可以接力', s: '创建 → 更新 → 签名\n→ 合并 → 最终化\n→ 提取' }),
  S.arrow(550, 190, 550, 214),
  S.box(450, 216, 200, 64, { k: 'warn', t: '最后提取成普通交易', s: '签前必须自己核对地址金额\n（PSBT 本身不防篡改）' }),
  S.text(330, 316, '三个升级：SegWit 改计费，Taproot 藏复杂条件，PSBT 让多人协同签名（数字为示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '三列各自独立：SegWit 把签名挪到见证区并打折；Taproot 把公钥和脚本树合成一个输出公钥；PSBT 是未签完的交易在各方之间传递的文件格式。'],
  ['key', 'Taproot 的输出只有一个 32 字节的 Q。合作时只出一个签名，链上看起来像普通单签；出争议才亮出一个叶子，其他叶子永远隐藏。'],
  ['risk', 'PSBT 不防篡改。每个签名人在签之前，都要自己核对输出地址和金额。'],
  ['limit', 'SegWit 让区块上限变成权重 4,000,000 WU：见证字节只按 1 计，其他字节按 4 计，所以体积是权重除以 4。']
], '三列示意图：SegWit 把非见证数据和见证数据按 4 比 1 计算权重；Taproot 把内部公钥和脚本树合成一个输出公钥；PSBT 在多方之间传阅，最后提取成普通交易', 'm05-61')}

<h2>2. SegWit：见证隔离与权重</h2>
${recall('<p>txid、wtxid、witness 字段的位置和 P2WPKH / P2WSH 输出格式在 <a href="#m05-60">M06.1</a> 第 3–4 节讲过。<a href="#m04-9">M09.10 高可用与事故复盘</a> 里提到的“用 txHash 跟踪提币不可靠”，根源就是 SegWit 之前的延展性。</p>')}
<p>SegWit（BIP141）2017 年 8 月锁定并激活${cite('Bitcoin Magazine：The Long Road to SegWit（2017-08-23）', 'https://bitcoinmagazine.com/technical/the-long-road-to-segwit-how-bitcoins-biggest-protocol-upgrade-became-reality')}。它解决了三个问题：</p>
${steps([
  '<strong>延展性</strong>：签名不再参与 txid 计算。第三方改动签名编码，txid 不变。闪电网络这类“先签好子交易、再广播父交易”的协议因此才可靠。',
  '<strong>容量</strong>：区块上限从“1 MB”改为“权重 ≤ 4,000,000 WU”。权重 = 非见证字节 × 4 + 见证字节 × 1；vsize = 权重 ÷ 4（向上取整）' + cite('BIP141：Segregated Witness', 'https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki') + '。',
  '<strong>签名摘要</strong>：BIP143 定义了新的签名摘要算法。签名覆盖每个输入的金额，离线设备可以确认手续费没有被篡改；同时消除了旧算法在大交易上“平方级哈希”的问题' + cite('BIP143：Transaction Signature Verification for Version 0 Witness Program', 'https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki') + '。'
])}
<p><strong>算一算（示例）</strong>：1 个 P2WPKH 输入、2 个 P2WPKH 输出。</p>
${steps([
  '非见证字节：version 4 + 输入个数 1 + 输入 41（txid 32 + vout 4 + 空 scriptSig 长度 1 + nSequence 4）+ 输出个数 1 + 输出 2 × 31 + nLockTime 4 = <strong>113 字节</strong>。',
  '见证字节：marker + flag 2 + 元素个数 1 + 签名约 73（长度 1 + 72）+ 公钥 34（长度 1 + 33）= <strong>110 字节</strong>。',
  '权重 = 113 × 4 + 110 × 1 = 562 WU；vsize = 562 ÷ 4 = 140.5 → <strong>141 vB</strong>。',
  '如果见证也按 4 倍计（相当于旧交易），权重 = 223 × 4 = 892 WU，即 223 vB。SegWit 让这笔交易的计费体积减少约 37%。'
])}

<h2>3. Taproot：Schnorr、密钥路径与脚本路径</h2>
<p>Taproot 由三份 BIP 组成：BIP340（Schnorr 签名）、BIP341（Taproot 输出与花费规则）、BIP342（Tapscript 脚本规则）。它在区块高度 709,632（2021 年 11 月 14 日）激活${cite('The Block：Bitcoin’s Taproot upgrade is activated（2021-11-14）', 'https://www.theblock.co/linked/124276/bitcoin-taproot-activated')}。</p>
${mm('Taproot 输出：一个内部公钥 + 一棵脚本树', `
flowchart TB
  P["内部公钥 P<br/>（可以是多人聚合的公钥）"]:::key
  subgraph TREE["脚本树（MAST）"]
    L1["叶子 A<br/>2-of-2：Alice + 托管方"]
    L2["叶子 B<br/>Alice 单签 + 等待 1 年"]
    L3["叶子 C<br/>恢复密钥 + 等待 2 年"]
    N1["分支哈希"]
    R["默克尔根 m"]
    L1 --> N1
    L2 --> N1
    N1 --> R
    L3 --> R
  end
  P --> TW["调整值 t = H(P ‖ m)"]
  R --> TW
  TW --> Q["输出公钥 Q = P + t·G<br/>锁定脚本 OP_1 加 32 字节 Q<br/>地址 bc1p…"]:::ok
  Q --> KP["密钥路径：一个 Schnorr 签名"]:::ok
  Q --> SP["脚本路径：叶子脚本 + 控制块 + 满足脚本的数据"]:::warn
`, [
  ['flow', '链上输出只有 32 字节的 Q。没人能从 Q 看出里面有没有脚本树、有几个叶子。'],
  ['key', '密钥路径：持有 P 对应私钥（或多人聚合后）直接签一个 64 字节签名。链上看起来和普通单签完全一样。'],
  ['limit', '脚本路径要公开被用到的那个叶子、内部公钥和默克尔路径（控制块长度 33 + 32 × 深度字节），其他叶子保持隐藏' + cite('BIP341：Taproot', 'https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki') + '。'],
  ['risk', '如果内部公钥 P 没有人知道私钥却声称“只能走脚本路径”，要用 BIP341 推荐的“无人知道私钥的点”构造 P，否则某个设计者可能偷偷保留密钥路径。']
])}
${compare('密钥路径与脚本路径', [
  { name: '密钥路径（key path）', tag: '日常、合作情况', kind: 'ok', points: ['witness 只有一个 Schnorr 签名（64 或 65 字节）', '输入约 57.5 vB，比 P2WPKH 还小', '多签可以先用 MuSig2（BIP327）或 FROST 把多把公钥聚合成一把', '链上无法区分单签和多签，隐私最好'] },
  { name: '脚本路径（script path）', tag: '争议、恢复、超时', kind: 'warn', points: ['公开一个叶子脚本 + 控制块 + 满足脚本的签名', '只暴露用到的那一个条件', 'Tapscript 用 OP_CHECKSIGADD 实现门限，替代旧的 OP_CHECKMULTISIG', '比密钥路径大，仍比把所有条件都写进 P2WSH 小'] }
], [
  ['key', '好的 Taproot 设计让 99% 的花费走密钥路径；脚本路径是“出事时的预案”。'],
  ['flow', '企业场景：内部公钥 = 多个签名方的聚合公钥；脚本树里放“部分签名人 + 时间锁”的恢复条件。'],
  ['limit', 'MuSig2 是 n-of-n 聚合；要做 t-of-n 门限且只出一个签名，需要 FROST 这类门限 Schnorr 协议（见 <a href="#m03-5">M08.5 MPC 与门限签名</a>）。']
])}
<p><strong>算一算（示例）</strong>：一个 2-of-3 多签输入的计费体积。</p>
${steps([
  'P2WSH 2-of-3（OP_CHECKMULTISIG）：见证 = 元素个数 1 + 空元素 1 + 两个签名各约 73 + 见证脚本 1 + 105 ≈ 254 字节；非见证部分 41 字节。权重 = 41 × 4 + 254 = 418 WU，约 <strong>104.5 vB</strong>。',
  'P2TR 密钥路径（三方用 FROST 产生一个门限签名）：约 <strong>57.5 vB</strong>。',
  '结论：每个输入少约 45%。一个每天发 2,000 笔提币、每笔平均 2 个输入的交易所，在 20 sat/vB 时每天少付约 2,000 × 2 × 47 × 20 ≈ 376 万 sat（约 0.0376 BTC）。代价是签名系统更复杂。'
])}

<h2>4. PSBT：让多方安全地协同签名</h2>
<p>离线设备签名需要两类它自己不知道的信息：被花的 UTXO 的金额和脚本（用来算签名摘要和手续费），以及每个公钥的派生路径（用来找到对应私钥）。PSBT 把这些信息和未签交易一起打包。它由 BIP174 定义，文件以魔数 <code>70 73 62 74 ff</code>（ASCII 的 “psbt” 加 0xff）开头${cite('BIP174：Partially Signed Bitcoin Transaction Format', 'https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki')}。BIP370（PSBT 版本 2）允许在创建之后再添加输入和输出，并增加了“构造者”角色${cite('BIP370：PSBT Version 2', 'https://github.com/bitcoin/bips/blob/master/bip-0370.mediawiki')}。</p>
${steps2('BIP174 定义的六个角色', [
  { t: '创建者 Creator', d: '写入未签交易（输入只有 outpoint，输出写好地址和金额）' },
  { t: '更新者 Updater', d: '补上每个输入的 UTXO 信息、赎回/见证脚本、BIP32 派生路径', kind: 'key' },
  { t: '签名者 Signer', d: '核对输出与手续费后，为自己能签的输入添加部分签名', kind: 'warn' },
  { t: '合并者 Combiner', d: '把多份各带一部分签名的 PSBT 合成一份' },
  { t: '最终化者 Input Finalizer', d: '签名够了，把签名组装成最终 scriptSig / witness' },
  { t: '提取者 Transaction Extractor', d: '输出可以广播的完整原始交易', kind: 'ok' }
], [
  ['flow', '同一个程序可以担任多个角色。Bitcoin Core 的 walletprocesspsbt 同时做更新和签名。'],
  ['risk', '签名者是最后一道防线。硬件钱包必须在自己的屏幕上显示收款地址、金额和手续费，并校验找零地址确实属于本钱包（通过 PSBT 里的派生路径重新推导）。'],
  ['key', '因为 SegWit 签名覆盖输入金额，签名者能确认手续费没被篡改。PSBT 仍会携带完整的前序交易（非见证 UTXO）以防特定攻击。']
])}
${mm('企业 2-of-3 冷钱包：一次 PSBT 提币', `
sequenceDiagram
  participant S as 提币服务（只有 xpub）
  participant R as 风控与审批
  participant H1 as 硬件钱包 1
  participant H2 as 硬件钱包 2
  participant N as 比特币节点
  S->>S: 选币 并 创建 PSBT（创建者 + 更新者）
  S->>R: 提交 PSBT 和业务单号
  R->>R: 解码 PSBT 核对地址 金额 费率上限
  R->>H1: 分发 PSBT（二维码或 SD 卡）
  R->>H2: 分发同一份 PSBT
  H1-->>R: 返回带签名 1 的 PSBT
  H2-->>R: 返回带签名 2 的 PSBT
  R->>S: 两份 PSBT
  S->>S: 合并 最终化 提取原始交易
  S->>N: testmempoolaccept 然后 sendrawtransaction
`, [
  ['flow', '在线服务只持有 xpub 和描述符，能创建 PSBT 但不能签名。私钥只在两台不联网的硬件钱包里。'],
  ['key', '风控在分发前独立解码 PSBT（decodepsbt），而不是相信提币服务给的“摘要文字”。'],
  ['risk', '两台硬件钱包都要自己显示并核对输出。如果只有一台核对，攻击者攻破另一端的显示即可替换地址（与 <a href="#m03-4">M08.4</a> 里 Bybit 事件的“签名界面被篡改”同类）。'],
  ['limit', 'PSBT 只解决“格式”问题，不解决审批流、权限和密钥备份。这些是企业钱包系统的工作（见 <a href="#m03-8">M08.9 企业钱包系统设计</a>）。']
])}
${call('info', '<p><strong>和以太坊多签对比</strong>：Safe 多签是一个合约，签名门限写在合约存储里，链上能看到它是多签（见 <a href="#m03-4">M08.4</a>）。比特币多签写在输出脚本里：P2WSH 花费时公开全部公钥和脚本；P2TR 密钥路径下，链上只看到一个签名。MPC 钱包则在链下合成一个普通签名（见 <a href="#m03-5">M08.5</a>）。</p>')}

<h2>5. 描述符：把“钱包是什么”写成一行文本</h2>
<p>只备份助记词，不足以恢复多签钱包：你还需要其他签名人的 xpub、门限、脚本类型和派生路径。<strong>输出脚本描述符</strong>把这些写成一行文本，末尾带 8 个字符的校验和${cite('BIP380：Output Script Descriptors General Operation', 'https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki')}。</p>
${tbl(['描述符', '含义', 'BIP'], [
  ['<code>wpkh([d34db33f/84h/0h/0h]xpub…/0/*)</code>', '单签 P2WPKH，外部链地址；方括号内是主密钥指纹和派生路径', 'BIP382'],
  ['<code>wsh(sortedmulti(2,[fp1/48h/0h/0h/2h]xpub1/0/*,[fp2/…]xpub2/0/*,[fp3/…]xpub3/0/*))</code>', '2-of-3 P2WSH 多签，公钥按字典序排序', 'BIP382 / 383'],
  ['<code>tr(xpubK/0/*)</code>', 'Taproot 单签（密钥路径）', 'BIP386'],
  ['<code>tr(K,{pk(A),and_v(v:pk(B),older(52560))})</code>', 'Taproot：内部密钥 K + 两个叶子（A 单签；B 单签且等待 52,560 个区块）', 'BIP386 + Miniscript']
])}
${call('warn', '<p>多签钱包的备份 = 每人的助记词 + <strong>完整描述符</strong>（含所有 xpub、指纹、路径、门限）。丢了描述符，即使凑齐 2 份助记词，也可能因为不知道第三把 xpub 而无法重建地址、找不到资金。描述符不含私钥，但会暴露全部地址，要当作敏感数据保管。</p>')}

<h2>6. 动手：在 regtest 上走完一次 PSBT</h2>
<p>regtest 是本地私有测试链：你自己出块，不需要真钱。下面的命令按 BIP174 的角色顺序执行，需要 Bitcoin Core 和 jq。</p>
${code('BASH', `
# 0. 启动本地 regtest 节点，建两个钱包
bitcoind -regtest -daemon -fallbackfee=0.0002
bitcoin-cli -regtest createwallet alice
bitcoin-cli -regtest createwallet bob
A=$(bitcoin-cli -regtest -rpcwallet=alice getnewaddress "" bech32m)   # P2TR 地址 bcrt1p…
bitcoin-cli -regtest generatetoaddress 101 $A        # 挖 101 块：第 1 块的奖励过了 100 块成熟期
B=$(bitcoin-cli -regtest -rpcwallet=bob getnewaddress "" bech32)       # P2WPKH 地址 bcrt1q…
CHG=$(bitcoin-cli -regtest -rpcwallet=alice getrawchangeaddress bech32m)

# 1. 创建者：手动指定输入和输出（找零必须自己写；50 − 10 − 39.9999 = 0.0001 BTC 手续费）
TXID=$(bitcoin-cli -regtest -rpcwallet=alice listunspent | jq -r '.[0].txid')
VOUT=$(bitcoin-cli -regtest -rpcwallet=alice listunspent | jq -r '.[0].vout')
PSBT=$(bitcoin-cli -regtest createpsbt "[{\\"txid\\":\\"$TXID\\",\\"vout\\":$VOUT}]" "[{\\"$B\\":10},{\\"$CHG\\":39.9999}]")
bitcoin-cli -regtest decodepsbt $PSBT | jq '.inputs'   # 输入里还没有 UTXO 信息

# 2. 更新者 + 签名者：补 UTXO 和派生路径并签名，最后一个参数 false 表示先不最终化
SIGNED=$(bitcoin-cli -regtest -rpcwallet=alice walletprocesspsbt $PSBT true "ALL" true false | jq -r '.psbt')
bitcoin-cli -regtest analyzepsbt $SIGNED              # 看 next 字段：finalizer；还能看到估算的 vsize 和费率

# 3. 最终化者 + 提取者，然后广播
HEX=$(bitcoin-cli -regtest finalizepsbt $SIGNED | jq -r '.hex')
bitcoin-cli -regtest testmempoolaccept "[\\"$HEX\\"]"
bitcoin-cli -regtest sendrawtransaction $HEX
bitcoin-cli -regtest generatetoaddress 1 $A
bitcoin-cli -regtest -rpcwallet=bob getbalance        # 预期 10.00000000

# 多签场景：每个签名人各自 walletprocesspsbt，再用 combinepsbt 合并
# bitcoin-cli -regtest combinepsbt '["<psbt_签名人1>", "<psbt_签名人2>"]'
# 让钱包自动选币和找零：walletcreatefundedpsbt '[]' '[{"<地址>":1}]' 0 '{"fee_rate":10}'
`)}
${tryit(`<p><strong>动手练习：</strong>按上面的命令在 regtest 上完成一次 PSBT 转账，然后做三个观察。</p>
${steps([
  '对比 <code>decodepsbt $PSBT</code> 和 <code>decodepsbt $SIGNED</code>：签名后输入里多了 <code>witness_utxo</code>、<code>taproot_bip32_derivs</code> 和 <code>taproot_key_path_sig</code>。',
  '执行 <code>bitcoin-cli -regtest -rpcwallet=alice listdescriptors</code>，找到以 <code>tr(</code> 开头的描述符和末尾 <code>#</code> 后的校验和。',
  '故意把第 1 步的找零写成 39 BTC（漏掉 0.9999），再走一遍。观察 <code>analyzepsbt</code> 显示的手续费和 <code>testmempoolaccept</code> 的结果（Bitcoin Core 默认拒绝费率过高的交易，报 max-fee-exceeded）。'
])}
<p>预期结果：bob 余额 10 BTC；你能指出 PSBT 在每一步多了哪些字段；第 3 步体会到“漏写找零 = 巨额手续费”，以及 maxfeerate 这道保护。</p>`)}

${exercises([
  ['（示例）一笔交易非见证部分 200 字节、见证部分 300 字节。它的权重和 vsize 各是多少？如果全部按非见证字节计费又是多少？', '<p>权重 = 200 × 4 + 300 = 1,100 WU，vsize = 275 vB。全部按非见证计：500 × 4 = 2,000 WU = 500 vB。SegWit 让它便宜 45%。</p>'],
  ['托管方设计 Taproot 地址：日常由客户和托管方 2-of-2 签名；托管方失联 6 个月后，客户可以用自己的密钥 + 恢复密钥取回。内部公钥和脚本树分别放什么？', '<p>内部公钥 = 客户和托管方用 MuSig2 聚合的公钥（日常走密钥路径，链上像单签）。脚本树放一个叶子：客户密钥 + 恢复密钥签名，且 <code>older(26280)</code>（约 6 个月，按每块 10 分钟估算）。如果还要防止客户单方面作恶，可以再加托管方 + 恢复密钥的叶子。</p>'],
  ['为什么在线提币服务只持有 xpub，也能创建出硬件钱包可以签名的 PSBT？', '<p>xpub 可以派生出所有地址和公钥。服务用描述符知道地址属于哪条路径，把 UTXO 信息和 BIP32 派生路径写进 PSBT（更新者角色）。硬件钱包收到后按路径派生出私钥签名，私钥从不离开设备。</p>'],
  ['列出硬件钱包在签一份 PSBT 前必须自己检查的 4 件事。', '<p>① 每个输出的地址和金额（在设备屏幕显示）；② 手续费 = 输入合计 − 输出合计，且不超过上限；③ 找零输出的派生路径能推导出该地址，确认找零真的回到本钱包；④ 多签时，PSBT 里的其他 xpub 与设备注册过的钱包描述符一致。</p>']
])}
${checklist([
  '能用“非见证 × 4 + 见证 × 1”算出一笔交易的权重和 vsize。',
  '能画出 Taproot 的 P、脚本树、t、Q 之间的关系，并说出密钥路径和脚本路径各公开什么。',
  '能按顺序说出 BIP174 的六个角色，并说出 Bitcoin Core 里对应的 RPC。',
  '在 regtest 上用 createpsbt → walletprocesspsbt → finalizepsbt → sendrawtransaction 完成过一次转账。',
  '能写出一个 2-of-3 wsh(sortedmulti(...)) 描述符，并说明多签备份为什么必须包含描述符。'
])}
${mistakes([
  ['SegWit 只是把区块从 1 MB 扩大到 4 MB。', '上限是 400 万权重单位。只有见证数据打折。实际区块字节数取决于见证数据占比，通常明显小于 4 MB。'],
  ['Taproot 地址一定比 P2WPKH 便宜。', 'P2TR 输入更小（57.5 vs 68 vB），但输出更大（43 vs 31 vB）。只收不花的场景，P2TR 反而略贵。'],
  ['走脚本路径会暴露整棵脚本树。', '只公开被用到的叶子和默克尔路径，其他叶子保持隐藏。'],
  ['PSBT 是签过名的，所以不会被篡改。', 'PSBT 在签名前可以被任意修改。每个签名者必须独立核对输出、手续费和找零。'],
  ['多签钱包只要备份各人的助记词就够了。', '还要备份完整描述符：其他人的 xpub、指纹、路径和门限。']
])}
${recap([
  'SegWit：签名移出 txid，修复延展性；权重 = 非见证 × 4 + 见证 × 1，区块 ≤ 400 万 WU；BIP143 签名覆盖输入金额。',
  'Taproot：Q = P + H(P‖m)·G；密钥路径一个 Schnorr 签名、像单签；脚本路径只公开用到的叶子。2021 年 11 月在 709,632 块激活。',
  'Schnorr 支持 MuSig2 与 FROST，把多签变成一个签名，省空间也提升隐私。',
  'PSBT（BIP174 / 370）把未签交易、UTXO 信息和派生路径打包，按创建、更新、签名、合并、最终化、提取的角色流转。',
  '描述符（BIP380+）是钱包的完整说明书；多签备份必须包含它。'
])}
${quiz([
  { q: '一笔交易非见证 150 字节、见证 120 字节，vsize 是多少？', o: ['270 vB', '180 vB', '150 vB', '1,080 vB'], a: 1, why: '权重 = 150 × 4 + 120 = 720 WU，vsize = 720 ÷ 4 = 180 vB。270 是原始字节数，1,080 是全部按 4 倍计的权重。' },
  { q: 'Taproot 密钥路径花费时，链上 witness 里有什么？', o: ['全部叶子脚本', '内部公钥和默克尔根', '一个 Schnorr 签名', '每个签名人的签名'], a: 2, why: '密钥路径只需要一个 64 或 65 字节的 Schnorr 签名，对 Q 验证。多签通过 MuSig2 或 FROST 在链下合成这一个签名。' },
  { q: '在 BIP174 中，哪个角色负责补上 UTXO 信息和 BIP32 派生路径？', o: ['创建者', '合并者', '提取者', '更新者'], a: 3, why: '更新者（Updater）添加签名所需的上下文。创建者只写未签交易，合并者合并签名，提取者输出最终交易。' },
  { q: 'SegWit 为什么让闪电网络变得可靠？', o: ['签名不进 txid，预签的子交易引用的父 txid 不会被第三方改变', '区块变大了', '它加入了 Schnorr 签名', '它降低了最低中继费率'], a: 0, why: '闪电通道要在注资交易广播前签好退款和承诺交易，它们引用注资交易的 txid。延展性修复后这个 txid 不会被改掉。Schnorr 是 Taproot 引入的。' },
  { q: '下面哪条 Bitcoin Core RPC 不能直接完成“签名”这一步？', o: ['walletprocesspsbt', 'finalizepsbt', 'signrawtransactionwithwallet', 'walletcreatefundedpsbt 之后再 walletprocesspsbt'], a: 1, why: 'finalizepsbt 只把已有签名组装成最终 witness 并提取交易，不会签名。walletprocesspsbt 和 signrawtransactionwithwallet 都会用钱包私钥签名。' }
])}
${terms([
  ['隔离见证', 'Segregated Witness (SegWit)', '把签名等见证数据移出 txid 计算并打折计费的软分叉（BIP141）'],
  ['权重单位', 'Weight Unit (WU)', '非见证字节 × 4 + 见证字节 × 1；区块上限 400 万 WU'],
  ['交易延展性', 'Transaction malleability', '不改变交易含义却能改变 txid 的问题'],
  ['Schnorr 签名', 'Schnorr signature (BIP340)', 'Taproot 使用的签名算法，支持线性聚合'],
  ['密钥路径', 'Key path spend', '用一个对输出公钥 Q 的签名花费 Taproot 输出'],
  ['脚本路径', 'Script path spend', '公开一个叶子脚本和控制块来花费 Taproot 输出'],
  ['默克尔化脚本树', 'MAST', '把多个花费条件放在默克尔树里，只公开用到的那个'],
  ['部分签名比特币交易', 'PSBT (BIP174 / BIP370)', '在多方之间传递待签交易及其签名上下文的格式'],
  ['输出脚本描述符', 'Output script descriptor (BIP380)', '描述钱包脚本类型、密钥和派生路径的一行文本']
])}
` });

CUR = 'm05-62';
addCh({ id: 'm05-62', nav: '闪电网络', title: 'M06.3 闪电网络：支付通道与路由', desc: '注资、承诺交易、撤销惩罚、HTLC 多跳路由与流动性，一次讲透', html: `
<h1>M06.3 闪电网络：支付通道与路由</h1>
${meta(['画出一条闪电通道的生命周期：注资交易、承诺交易、余额更新、撤销旧状态、合作关闭与强制关闭。', '解释 HTLC 怎样让一笔付款安全地经过多个互不信任的节点，并按每跳手续费和过期高度反推每段金额。', '说出入站 / 出站流动性、LSP、瞭望塔的作用，列出闪电网络常见的失败模式和应对办法。'], '前置：<a href="#m05-61">M06.2 SegWit、Taproot 与 PSBT</a>、<a href="#m05-4">M04.4 扩容路线</a>', ['lnchan'])}
${beginner(`<p><strong>支付通道（Payment channel）</strong>：两个人在链上锁一笔钱，之后在链下反复改写“这笔钱怎么分”，最后才把结果上链。</p>
<p><strong>承诺交易（Commitment transaction）</strong>：一笔双方都签好、但暂时不广播的交易，写着当前余额分配。谁想退出，就广播它。</p>
<p><strong>HTLC（哈希时间锁合约）</strong>：一种条件付款：“谁能出示某个秘密值 r，就能领钱；过了某个区块高度还没人领，钱退回”。</p>
<p><strong>流动性（Liquidity）</strong>：通道里你这一侧能发出去的钱叫出站流动性；对方那一侧、能流向你的钱叫入站流动性。</p>
<p><strong>毫聪（millisatoshi，msat）</strong>：闪电网络内部记账单位，1 sat = 1,000 msat。链上不能表示 msat，只在通道内部使用。</p>`)}

<h2>1. 一句话理解</h2>
${one('闪电网络把“每笔付款都上链”改成“两个人开一条通道，链下互签余额更新”；旧状态用撤销密钥 + 惩罚机制作废，多跳付款用 HTLC（同一个哈希锁 + 逐跳递减的时间锁）串起来，中间节点无法偷钱。')}
${call('analogy', `<p>通道像两个人合开的一个记账本：开户时一起存钱进银行保险箱（注资交易），之后每次互相付款只在本子上改数字，并且双方签字。想散伙时，拿最新一页去银行取钱。如果有人拿旧的一页去取，另一方可以出示“这页已作废”的凭证，把保险箱里的钱全拿走作为惩罚。</p>
<p>比喻的局限：现实中银行会帮你核对哪页是最新的；比特币链上没有人核对，<strong>你必须自己（或委托瞭望塔）盯着链</strong>，在时间窗口内发出惩罚交易。</p>`)}
${art('一图看懂：闪电通道 = 链上一把 2-of-2 锁 + 链下不断改写的余额表', 660, 372, [
  S.zone(10, 24, 640, 110, { t: '比特币链上：只出现两次' }),
  S.zone(10, 180, 640, 160, { t: '链下：只有 Alice 和 Bob 看得到' }),
  S.box(24, 56, 120, 62, { k: 'tint', t: '开通道', s: '1 笔链上交易' }),
  S.box(168, 56, 324, 62, { k: 'key', icon: 'lock', t: '注资输出：1,000,000 sat', s: '2-of-2 多签锁，双方都签才能动' }),
  S.box(516, 56, 120, 62, { k: 'tint', t: '关通道', s: '1 笔链上交易' }),
  S.box(24, 212, 150, 112, { k: 'tint', icon: 'person', t: 'Alice', s: '持有最新签好的\n承诺交易' }),
  S.box(206, 212, 248, 48, { k: 'ok', t: '状态 #9 · 最新', s: 'Alice 300,000 | Bob 700,000', mono: 1 }),
  S.box(206, 268, 248, 56, { k: 'risk', dash: 1, t: '状态 #5 · 已撤销', s: 'Alice 800,000 | Bob 200,000\n谁广播它，谁被惩罚', mono: 1 }),
  S.box(486, 212, 150, 112, { k: 'tint', icon: 'person', t: 'Bob', s: '持有最新签好的\n承诺交易' }),
  S.arrow(146, 87, 166, 87), S.arrow(494, 87, 514, 87),
  S.arrow(330, 120, 330, 210, { label: '总额固定' }),
  S.arrow(176, 236, 204, 236, { both: 1 }), S.arrow(456, 236, 484, 236, { both: 1 }),
  S.text(330, 360, '中间无数次付款都只改写余额表，只有开、关通道上链（金额为示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '开通道时双方把 1,000,000 sat 锁进一个 2-of-2 输出；之后每次付款只是双方签一份新的余额分配，不上链。'],
  ['key', '余额表每次更新，都会作废上一个状态。通道里的总额始终是 1,000,000 sat，变的只是 Alice 和 Bob 各占多少。'],
  ['risk', '谁广播已撤销的旧状态，对方可以用撤销密钥拿走他的那份余额。你离线又没有瞭望塔时，对方可能趁机广播旧状态。'],
  ['limit', '通道只连接两个人。给没有直接通道的人付款，要靠 HTLC 经多个节点转发，见本篇第 3 节。']
], '比特币链上只有开通道和关通道两笔交易，中间是一个 1,000,000 聪的两方多签输出；链下 Alice 和 Bob 反复签新的余额分配，最新状态是 Alice 300,000、Bob 700,000，旧状态已被撤销', 'm05-62')}

<h2>2. 一条通道的生命周期</h2>
${recall('<p>状态通道的一般概念、它在扩容路线中的位置，在 <a href="#m05-4">M04.4 扩容路线</a> 里讲过；比特币为什么选择“小区块 + 链下扩容”，见 <a href="#m05-1">M04.1 公链全景</a> 第 3.1 节。本篇讲闪电网络的具体协议。</p>')}
<p>闪电网络由 Joseph Poon 和 Thaddeus Dryja 在白皮书中提出（2016 年 1 月的 0.5.9.2 版草稿）${cite('Poon、Dryja：The Bitcoin Lightning Network（草稿 0.5.9.2，2016-01-14）', 'https://lightning.network/lightning-network-paper.pdf')}。今天各家实现（LND、Core Lightning、Eclair、LDK）遵循同一套 BOLT 规范互通。</p>
${mm('通道状态机', `
stateDiagram-v2
  state "协商开通道" as Nego
  state "注资交易待确认" as Funding
  state "通道可用" as Open
  state "合作关闭" as Coop
  state "强制关闭" as Force
  state "等待自身延迟" as Delay
  state "惩罚：拿走全部资金" as Penalty
  [*] --> Nego
  Nego --> Funding: 先签好退款用的承诺交易 再广播注资
  Funding --> Open: 注资达到确认数
  Open --> Open: 付款 签新承诺 交出旧撤销密钥
  Open --> Coop: 双方签一笔最终分配交易
  Open --> Force: 一方单独广播最新承诺交易
  Force --> Delay: 广播方自己的输出被相对时间锁锁住
  Delay --> [*]: 时间锁到期 领取
  Open --> Penalty: 一方广播了已撤销的旧承诺
  Penalty --> [*]
  Coop --> [*]
`, [
  ['flow', '注资交易把双方的钱放进一个 2-of-2 多签输出。所有承诺交易都花这一个输出。'],
  ['key', '“先签退款，再广播注资”：如果对方在注资后消失，你手里已有签好的承诺交易，可以单方面取回资金。这依赖 SegWit 修复的延展性。'],
  ['risk', '强制关闭时，广播方自己的那份余额要等 to_self_delay 个区块（相对时间锁）才能花。这段时间就是对方发现作弊并惩罚的窗口。'],
  ['fail', '合作关闭最便宜、最快；强制关闭要付更多链上手续费，资金被锁一段时间，在途 HTLC 也要分别上链结算。']
])}
<h3>2.1 撤销与惩罚：为什么不敢广播旧状态</h3>
${steps([
  '每个承诺交易里，<strong>广播方自己的输出</strong>有两条花费路径：① 等 to_self_delay 个区块后，自己签名领取；② 用“撤销私钥”立即领取。',
  '撤销私钥由双方的秘密合成。每次签下新状态，你都把<strong>上一状态的撤销秘密</strong>交给对方。此后你若广播旧状态，对方手里正好有那把撤销私钥。',
  '对方在 to_self_delay 窗口内广播<strong>惩罚交易</strong>，拿走你的那份余额。也就是说，作弊者损失通道里属于自己的全部资金。',
  '对方输出（to_remote）没有延迟。惩罚机制只惩罚“广播旧状态的人”。'
])}
<p><strong>算一算（示例）</strong>：容量 1,000,000 sat。状态 #5 是 Alice 800,000 / Bob 200,000；现在最新状态 #9 是 Alice 300,000 / Bob 700,000。</p>
${steps([
  'Alice 作弊广播 #5：她希望拿回 800,000。她的输出被锁 144 个区块（to_self_delay 示例值，约 1 天）。',
  'Bob 的节点（或瞭望塔）发现 #5 已被撤销，用撤销私钥广播惩罚交易，拿走 Alice 的 800,000，加上自己的 200,000，共 1,000,000 sat（减去链上手续费）。',
  'Alice 比诚实关闭多损失 300,000 sat。前提是 Bob 在 144 个区块内在线或有瞭望塔。'
])}

<h2>3. HTLC 与多跳路由</h2>
<p>Alice 和 Dave 之间没有直接通道，但 Alice → Bob → Carol → Dave 有一条路径。Dave 生成随机秘密 r，把 <code>payment_hash = SHA256(r)</code> 放进发票。每一跳都锁定一个 HTLC：“出示 r 就付款，否则到期退回”。</p>
${mm('一次三跳付款：锁定与领取', `
sequenceDiagram
  participant A as Alice
  participant B as Bob
  participant C as Carol
  participant D as Dave
  D->>A: 发票 含 payment_hash 和金额 80000 sat
  A->>B: HTLC 80123 sat 到期高度 +98
  B->>C: HTLC 80081 sat 到期高度 +58
  C->>D: HTLC 80000 sat 到期高度 +18
  D-->>C: 出示 r 领取 80000
  C-->>B: 用同一个 r 领取 80081
  B-->>A: 用同一个 r 领取 80123
  Note over A,D: A 拿到 r 作为付款证明
`, [
  ['flow', '锁定从发送方向终点推进；领取从终点向发送方回传。每一跳都用同一个 payment_hash，所以 r 一旦公开，上游每一跳都能领钱。'],
  ['key', '到期高度向上游递增（+18、+58、+98）。差值叫 cltv_expiry_delta。Carol 在下游被领走钱之后，还有 40 个区块的时间去领上游的钱，不会被“夹在中间”。'],
  ['fail', '任意一跳余额不足、节点离线或手续费不对，这一跳返回错误，上游 HTLC 被取消，资金退回。付款要么整体成功，要么整体失败。'],
  ['risk', '如果 Carol 下游已经被领走、她却离线错过了上游的到期高度，Bob 可以把 HTLC 退回给自己，Carol 亏钱。转发节点必须保持在线。'],
  ['limit', '图中金额和到期高度是示例；手续费策略和 cltv_expiry_delta 由每个节点自己公布。']
])}
<p>发送方用<strong>洋葱路由</strong>（BOLT4）把每一跳要转多少、过期高度是多少，分层加密给对应节点。每个中间节点只知道上一跳和下一跳，不知道自己在路径中的位置，也不知道最终收款人。</p>
<p><strong>算一算（示例）</strong>：每个转发节点收费 = 基础费 + 金额 × 费率（百万分比，ppm）。Carol：1 sat + 1,000 ppm；Bob：1 sat + 500 ppm。Dave 要收 80,000 sat。</p>
${steps([
  '从终点往回算。Carol 要转给 Dave 80,000 sat，她收费 1 + 80,000 × 1,000 ÷ 1,000,000 = 1 + 80 = <strong>81 sat</strong>。所以 Bob 要转给 Carol 80,081 sat。',
  'Bob 收费 1 + 80,081 × 500 ÷ 1,000,000 ≈ 1 + 40.04 → 向上取整 <strong>42 sat</strong>。Alice 转给 Bob 80,123 sat。',
  'Alice 总共付出 80,123 sat，总手续费 123 sat，约 0.15%。',
  '对比链上：同期链上一笔 141 vB 的交易在 10 sat/vB 时要 1,410 sat。小额付款走闪电网络便宜一个数量级以上；但开、关通道各要一笔链上交易。'
])}

<h2>4. 流动性：容量够，不等于能付</h2>
<p>通道容量是两侧余额之和。<strong>你能发出的钱 = 你这一侧的余额</strong>（再扣除对方要求的通道保证金，通常约为容量的 1%，${tag('惯例')}）。新用户开一条通道，钱全在自己这侧：只能付，不能收。商户正相反：需要别人向自己方向的余额，即<strong>入站流动性</strong>。</p>
<p>先做实验：上半部分双向付款，看余额条和承诺交易编号怎样变化；下半部分把 C → D 方向的余额拉低，看付款在哪一跳失败。</p>
${lab('lnchan')}
<p>你应该看到：通道容量从不改变，只有余额在两侧移动；每次付款都让一个旧状态作废。路由失败时错误一路退回发送方，没有人亏钱，但发送方事先看不到别人通道里的余额分布，只能“试错 + 换路”。</p>
${tbl(['问题', '原因', '常见解法'], [
  ['新钱包收不了款', '没有入站流动性', '向 LSP（闪电服务商）购买入站通道；或 LSP 在第一笔收款时即时开通道（JIT 通道）'],
  ['商户入站流动性用完', '收款都积在自己这侧', '把余额通过“循环再平衡”或“潜水换出（submarine swap，链下余额换链上 BTC）”推回对方一侧'],
  ['大额付款失败', '单条路径没有足够余额', '多路径付款（MPP）：把一笔付款拆成几份走不同路径，收款方收齐后才公开 r'],
  ['通道需要扩容或取钱', '关通道再开要两笔链上交易', 'splicing：用一笔链上交易在不关闭通道的情况下增减容量（各实现支持程度不同）']
])}

<h2>5. 发票：BOLT11 格式</h2>
<p>收款方生成一张发票（invoice），付款方扫码支付。BOLT11 发票是 bech32 编码的字符串${cite('BOLT #11：Invoice Protocol for Lightning Payments', 'https://github.com/lightning/bolts/blob/master/11-payment-encoding.md')}：</p>
${tbl(['部分', '例子', '含义'], [
  ['前缀', '<code>lnbc</code> / <code>lntb</code> / <code>lnbcrt</code>', '主网 / 测试网 / regtest'],
  ['金额', '<code>2500u</code>', '以 BTC 为单位再乘倍率：m = 0.001，u = 0.000001，n = 10⁻⁹，p = 10⁻¹²。2500u = 0.0025 BTC = 250,000 sat'],
  ['<code>p</code> 字段', '256 位', 'payment_hash，必须且只有一个'],
  ['<code>s</code> 字段', '256 位', 'payment_secret，防止中间节点探测收款人'],
  ['<code>d</code> 字段', '“1 杯咖啡”', '描述（或用 <code>h</code> 放描述的哈希）'],
  ['<code>x</code> 字段', '秒数', '有效期，省略时默认 3,600 秒（1 小时）'],
  ['<code>r</code> 字段', '节点 + 通道 + 费率', '私有通道的路由提示'],
  ['签名', '65 字节', '收款节点的 secp256k1 签名；付款方可从签名恢复收款节点公钥']
])}
${call('info', '<p>BOLT11 发票是<strong>一次性</strong>的：同一个 payment_hash 只能付一次，过期就作废。需要可重复使用的收款码时，看 BOLT12 offers 或 LNURL、Lightning Address 这类方案（各钱包支持程度不同）。</p>')}

<h2>6. 瞭望塔、LSP 与失败模式</h2>
${layers('一个手机闪电钱包背后的角色', [
  { name: '用户钱包', sub: '持有通道私钥，可能经常离线', chips: ['扫码付款', '生成发票', '备份通道状态'] },
  { name: 'LSP（闪电服务商）', sub: '用户的对手方节点', chips: ['提供入站流动性', 'JIT 通道', '代为寻路'], kind: 'key' },
  { name: '瞭望塔 Watchtower', sub: '代你盯链', chips: ['保存加密的惩罚交易', '发现旧状态就广播'] },
  { name: '闪电网络', sub: '公开通道图', chips: ['路由节点', '手续费市场'] },
  { name: '比特币主链', sub: '最终裁判', chips: ['注资', '关闭', '惩罚', 'HTLC 结算'], kind: 'l1' }
], [
  ['flow', '日常付款只在上面三层流转；出现争议或关闭通道时才落到主链。'],
  ['risk', '用户离线超过 to_self_delay 又没有瞭望塔，对方可以广播旧状态而不受惩罚。'],
  ['key', '瞭望塔只拿到“发现某笔交易时才能解密”的惩罚数据，平时看不到你的余额和付款记录。'],
  ['limit', '很多“闪电钱包”其实是托管钱包：服务商替你持有通道，你只有一个账户余额。它用起来最简单，但服务商可以冻结或挪用你的钱。']
], ['依赖', '委托', '寻路', '结算'])}
${tbl(['失败模式', '现象', '应对'], [
  ['路由失败', '付款报 no route 或 temporary_channel_failure', '多路径付款、换 LSP、降低单笔金额'],
  ['强制关闭遇上高费率', '承诺交易预先签好的手续费不够，迟迟不确认', 'anchor 输出：关闭时用 CPFP 临时加费（见 <a href="#m05-60">M06.1</a> 的 CPFP）'],
  ['HTLC 卡住', '付款显示“进行中”，资金被锁到到期高度', '等待超时退款；节点运维要监控在途 HTLC 数量'],
  ['通道阻塞（jamming）', '攻击者发出永不完成的 HTLC，占满通道的 HTLC 槽位或流动性', '限制单通道在途 HTLC 数、对可疑对手方降级'],
  ['丢失通道状态', '手机丢失或数据库回滚，用旧状态重启会被惩罚', '用静态通道备份（SCB）请对方强制关闭；绝不能从旧数据库直接恢复'],
  ['托管风险', '托管型钱包服务商跑路或被监管冻结', '大额资金用自托管；了解钱包是否托管']
])}
${call('warn', '<p>闪电节点的数据库不能像普通服务那样“从昨天的备份恢复”。旧数据库里是已撤销的状态，一旦广播就会被惩罚。正确做法是用实现提供的静态通道备份让对方关闭通道，资金回到链上后再重建。</p>')}

<h2>7. 工程层：LND 常用命令</h2>
${code('BASH', `
# 查看节点和通道
lncli getinfo
lncli listchannels                       # local_balance / remote_balance 就是出站 / 入站流动性

# 开通道：向对方节点出资 1,000,000 sat（会广播一笔注资交易）
lncli openchannel --node_key <对方公钥> --local_amt 1000000

# 收款：生成一张 50,000 sat 的发票
lncli addinvoice --amt 50000 --memo "coffee"
lncli decodepayreq <bolt11 发票>          # 解出金额、payment_hash、过期时间、路由提示

# 付款与寻路
lncli queryroutes --dest <收款节点公钥> --amt 80000   # 看路径、每跳手续费和到期高度
lncli payinvoice <bolt11 发票>

# 关通道：默认合作关闭；对方离线时加 --force
lncli closechannel --funding_txid <注资 txid> --output_index 0
`)}
${tryit(`<p><strong>动手练习：</strong>用 Polar（Lightning Labs 出品的本地闪电网络沙盒，内置 bitcoind regtest）搭一个四节点网络。</p>
${steps([
  '安装 Polar，新建网络：4 个 LND 节点（Alice、Bob、Carol、Dave）+ 1 个 bitcoind。启动网络。',
  '开三条通道：Alice → Bob、Bob → Carol、Carol → Dave，每条 1,000,000 sat。Polar 会自动挖块确认注资交易。',
  '在 Dave 上生成 80,000 sat 发票，在 Alice 上付款。打开 Alice 的终端，运行 <code>lncli listpayments</code>，读出 fee 和 htlcs 里的路径。',
  '在 Carol 上把她对 Dave 的通道余额通过付款转给 Dave，直到 Carol 侧不足 80,000。再让 Alice 付一张同额发票，观察错误信息。',
  '选做：在 Polar 里停掉 Bob，在 Alice 上对 Alice–Bob 通道执行强制关闭，挖块并观察 Alice 的资金何时可用（to_self_delay）。'
])}
<p>预期结果：第一次付款成功，手续费等于 Bob 和 Carol 公布的费率之和；第二次付款在 Carol 处失败并返回 temporary_channel_failure；强制关闭后资金要等若干区块才回到 Alice 的链上钱包。</p>`)}

${exercises([
  ['（示例）Carol 公布：基础费 0 sat、费率 2,000 ppm、cltv_expiry_delta = 80。Bob 公布：基础费 1 sat、费率 100 ppm、delta = 40。Dave 要收 200,000 sat，最终 HTLC 的到期为当前高度 + 18。求每一跳金额和到期高度。', '<p>Carol 收费 200,000 × 0.002 = 400 sat，Bob → Carol 的 HTLC = 200,400 sat，到期 = +18 + 80 = +98。Bob 收费 1 + 200,400 × 0.0001 ≈ 21.04 → 22 sat（向上取整），Alice → Bob = 200,422 sat，到期 = +98 + 40 = +138。总手续费 422 sat。</p>'],
  ['商户每天收款 3,000,000 sat，只有一条容量 5,000,000、自己出资的通道。第一天会发生什么？怎么解决？', '<p>通道里钱全在商户一侧，入站流动性为 0，第一笔收款就失败。解决：向 LSP 购买入站通道（对方出资）；或定期用潜水换出把收到的余额换成链上 BTC，让余额回到对方一侧。</p>'],
  ['为什么上游的到期高度必须比下游晚？如果反过来会怎样？', '<p>转发节点要在下游被领走钱之后，用拿到的 r 去上游领钱。上游先到期的话，上游可以先把 HTLC 退回给自己，下游再用 r 领走转发节点的钱，转发节点白白亏掉这笔金额。</p>'],
  ['一位运维同学准备从昨晚的数据库快照恢复崩溃的 LND 节点。你会怎么劝阻？', '<p>快照里的通道状态可能已被撤销。节点一启动就可能广播旧承诺交易，对方用撤销私钥拿走全部资金。正确做法：用静态通道备份（channel.backup）恢复，让对方强制关闭通道，资金回到链上后重建节点。</p>']
])}
${checklist([
  '能画出通道从注资到合作关闭、强制关闭、惩罚的状态图。',
  '能解释撤销秘密在每次更新时怎样交换，以及作弊者损失多少。',
  '能按“基础费 + ppm”从终点反推一条三跳路径的每跳金额和到期高度。',
  '在 lnchan 实验里复现了“容量够但方向余额不够”导致的路由失败。',
  '能读懂一张 BOLT11 发票的前缀、金额、payment_hash 和有效期。',
  '能说出至少 4 种闪电网络失败模式和对应的运维措施。'
])}
${mistakes([
  ['闪电网络是一条新的区块链。', '它是建立在比特币上的通道网络。开、关通道和争议处理都用普通比特币交易。'],
  ['通道容量 1 BTC，就能收 1 BTC。', '能收多少取决于对方那一侧的余额（入站流动性），不是容量。'],
  ['中间路由节点可以扣下付款。', 'HTLC 保证：中间节点只有在下游拿到 r 后才能领上游的钱，扣钱只会让自己的 HTLC 超时退回。'],
  ['手机钱包离线很久也没关系。', '离线超过 to_self_delay 且没有瞭望塔，对方可能广播旧状态而不被惩罚。'],
  ['节点坏了就从备份数据库恢复。', '旧数据库包含已撤销状态，广播会被惩罚。用静态通道备份让对方关闭通道。']
])}
${recap([
  '通道 = 一个 2-of-2 注资输出 + 不断更新的承诺交易；先签退款再广播注资。',
  '每次更新交出旧状态的撤销秘密；广播旧状态会在 to_self_delay 窗口内被对方没收全部资金。',
  'HTLC 用同一个 payment_hash 串起多跳；到期高度向上游递增，r 原路回传完成付款。',
  '能付多少看出站余额，能收多少看入站余额；LSP、MPP、潜水换出、splicing 用来管理流动性。',
  'BOLT11 发票一次性、默认 1 小时有效；运维要防强制关闭费率、HTLC 卡住、通道阻塞和错误恢复。'
])}
${quiz([
  { q: 'Alice 广播了一个已被撤销的旧承诺交易。Bob 在时间窗口内能做什么？', o: ['什么也做不了，旧状态有效', '只能拿回自己的那份', '用撤销私钥拿走 Alice 那份，等于拿走通道全部资金', '请矿工拒绝打包'], a: 2, why: 'Alice 的输出可被撤销私钥立即花费，Bob 拿走它，再加上自己本来的输出。矿工不判断状态新旧。' },
  { q: '三跳路径 A → B → C → D 中，哪一段 HTLC 的到期高度最晚？', o: ['A → B', 'B → C', 'C → D', '三段相同'], a: 0, why: '到期高度向上游递增，给每个转发节点留出领取上游资金的时间。所以离发送方最近的一段最晚到期。' },
  { q: '一家咖啡店刚用自己的 0.05 BTC 开了一条通道，顾客却付不进来。最可能的原因是？', o: ['通道容量太小', '咖啡店没有入站流动性', '顾客的发票过期', 'BOLT11 不支持小额'], a: 1, why: '自己出资的通道，余额全在自己这侧，对方侧为 0，没有可流向自己的余额。容量足够付咖啡。发票由咖啡店生成，不是顾客。' },
  { q: '发票里的 lnbc1500n 表示多少？', o: ['1,500 sat', '150 sat', '15 sat', '0.15 sat'], a: 1, why: 'n = 10⁻⁹ BTC。1,500 × 10⁻⁹ BTC = 1.5 × 10⁻⁶ BTC = 150 sat。' },
  { q: '瞭望塔的作用是？', o: ['帮你寻路', '保管你的通道私钥', '替你提供入站流动性', '在你离线时发现对方广播旧状态并代为广播惩罚交易'], a: 3, why: '瞭望塔保存加密的惩罚数据，只在看到对应旧交易时才能解密并广播。它不持有私钥。寻路和流动性是 LSP 的工作。' }
])}
${terms([
  ['支付通道', 'Payment channel', '双方在链上锁定资金、链下更新余额的结构'],
  ['注资交易', 'Funding transaction', '把双方资金放入 2-of-2 多签输出、开启通道的链上交易'],
  ['承诺交易', 'Commitment transaction', '双方已签、可随时广播、记录当前余额分配的交易'],
  ['撤销密钥', 'Revocation key', '让对方惩罚旧状态广播者的密钥，每次更新时交出'],
  ['哈希时间锁合约', 'HTLC', '出示哈希原像即可领取、超时则退回的条件输出'],
  ['自身延迟', 'to_self_delay', '强制关闭时广播方领取自己余额前必须等待的区块数'],
  ['入站流动性', 'Inbound liquidity', '通道中对方一侧、可以流向你的余额'],
  ['闪电服务商', 'Lightning Service Provider (LSP)', '为用户提供通道、流动性和寻路的服务方'],
  ['瞭望塔', 'Watchtower', '代离线用户监控链上旧状态并广播惩罚交易的服务'],
  ['多路径付款', 'Multi-path payment (MPP)', '把一笔付款拆成多份走不同路径的方法']
])}
` });

CUR = 'm05-63';
addCh({ id: 'm05-63', nav: '铭文 Runes 与 L2', title: 'M06.4 铭文、Runes 与比特币 L2', desc: 'Ordinals、BRC-20、Runes 怎样占用区块空间；比特币 L2 各自谁能动你的钱', html: `
<h1>M06.4 铭文、Runes 与比特币 L2</h1>
${meta(['说清 Ordinals 铭文、BRC-20、Runes 各自把数据放在交易的哪里、状态由谁维护，以及它们怎样影响手续费和区块空间。', '为交易所或钱包列出处理铭文 / Runes UTXO 的工程规则，避免把资产当手续费烧掉。', '用“谁能偷走、谁能冻结、怎样退出”三个问题评估闪电网络、Liquid、Rootstock、Stacks、BitVM 类桥和 Babylon 质押的信任模型。'], '前置：<a href="#m05-61">M06.2 SegWit、Taproot 与 PSBT</a>、<a href="#m05-62">M06.3 闪电网络</a>、<a href="#m05-8">M06.12 跨链桥</a>')}
${beginner(`<p><strong>序数（Ordinal）</strong>：给每一个聪编一个序号的约定。它不是协议规则，只是一种“怎么数”的方法，靠索引器软件计算。</p>
<p><strong>铭文（Inscription）</strong>：把任意数据（图片、文本、JSON）写进交易见证里，并约定它“属于”某一个聪。</p>
<p><strong>索引器（Indexer）</strong>：读取全部区块、按某个协议规则算出“谁拥有什么”的链下程序。BRC-20 和 Runes 的余额都由索引器计算，比特币节点并不理解它们。</p>
<p><strong>侧链（Sidechain）</strong>：一条独立的链，用某种“锚定”把 BTC 锁在比特币上、在侧链上发等量代币。</p>
<p><strong>锚定（Peg）</strong>：BTC 进入（peg-in）和退出（peg-out）另一个系统的机制。谁控制被锁的 BTC，是评估一切 L2 的核心问题。</p>`)}

<h2>1. 一句话理解</h2>
${one('铭文和 Runes 是“比特币节点不理解、由链下索引器解释”的数据约定，它们抢占区块空间、推高手续费；比特币 L2 的本质区别在于<strong>被锁在比特币上的 BTC 由谁控制</strong>：通道双方、联盟多签、HSM 签名组、1-of-n 诚实的挑战机制，还是你自己的时间锁脚本。')}
${call('analogy', `<p>铭文像在一张纸币上用隐形墨水写字：银行（比特币节点）只认纸币面额，看不见字；但有一群人约定“谁拿着这张写了字的纸币，谁就拥有那幅画”。比特币 L2 像把现金存进不同的保管箱：有的箱子只要你和对方两把钥匙（闪电），有的箱子由 15 个保管员里 11 个说了算（Liquid），有的箱子其实一直在你名下、只是加了一把定时锁（Babylon 质押）。</p>
<p>比喻的局限：隐形墨水的字不占纸币空间；铭文却实实在在占用区块空间，每个人的转账都要和它竞价。</p>`)}
${art('一图看懂：铭文和 Runes 的资产由链下索引器解释，比特币节点并不理解', 660, 360, [
  S.zone(10, 24, 640, 128, { t: '比特币链上：节点只校验签名、金额和脚本' }),
  S.zone(10, 186, 640, 96, { t: '链下：索引器按约定读区块，算出谁拥有什么' }),
  S.box(24, 56, 190, 76, { k: 'warn', t: '铭文 Ordinals', s: '内容放在 witness\n按 1 WU / 字节计费' }),
  S.box(235, 56, 190, 76, { k: 'warn', t: 'BRC-20', s: '铭文里写一段 JSON\n余额由索引器算' }),
  S.box(446, 56, 190, 76, { k: 'warn', t: 'Runes', s: 'runestone 放在\nOP_RETURN 输出' }),
  S.box(24, 218, 612, 52, { k: 'key', icon: 'cpu', t: '索引器（链下程序）', s: '读全部区块，按各自规则算：铭文归属、BRC-20 余额、Runes 余额' }),
  S.box(24, 300, 612, 44, { k: 'risk', t: '交易所和钱包：充值要双索引器对账，选币要避开带铭文的 UTXO' }),
  S.arrow(119, 134, 119, 216), S.arrow(330, 134, 330, 216, { label: '节点不理解' }), S.arrow(541, 134, 541, 216),
  S.arrow(330, 272, 330, 298)
], [
  ['flow', '三种数据都只是被写进比特币交易里；索引器读完区块后，才算出“铭文 #N 属于谁”“某个 Rune 余额多少”。'],
  ['key', '余额和归属不是比特币共识的一部分。链上只保证数据被记录，不保证解释正确。'],
  ['risk', '不同索引器版本可能算出不同余额；不懂铭文的钱包选币时，可能把带铭文的 UTXO 当零钱花掉或当手续费付给矿工。'],
  ['limit', '比特币脚本读不到 Rune 余额，所以不能写“用 Rune 抵押借 BTC”这类原生合约，需要索引器或 L2 参与。']
], '铭文、BRC-20 和 Runes 的数据分别放在 witness、铭文里的 JSON 和 OP_RETURN 输出里；比特币节点不理解它们，由链下索引器读区块算出谁拥有什么，交易所和钱包要双索引器对账', 'm05-63')}

<h2>2. Ordinals 与铭文：数据放在哪里</h2>
${recall('<p>Taproot 的脚本路径、见证数据按 1 WU / 字节打折计费，在 <a href="#m05-61">M06.2</a> 讲过；UTXO 和选币在 <a href="#m05-60">M06.1</a> 讲过。铭文正是利用了这两点。</p>')}
<p>2023 年 1 月，Casey Rodarmor 在比特币主网发布了 Ordinals 协议${cite('Cointelegraph：Ordinals protocol sparks debate（2023-01-30）', 'https://cointelegraph.com/news/ordinals-protocol-sparks-debate-over-nft-s-place-in-the-bitcoin-ecosystem')}。到 2023 年 2 月 16 日，已有约 12.25 万个铭文（Dune 数据）${cite('TechCrunch：Ordinals creator views his creation as digital artifacts（2023-02-16）', 'https://techcrunch.com/2023/02/16/ordinals-creator-views-his-bitcoin-centric-creation-as-digital-artifacts-not-just-nfts')}。铭文内容放在 Taproot 脚本路径的脚本里，用 <code>OP_FALSE OP_IF … OP_ENDIF</code> 包起来（这段代码永远不执行），所以要分两步：先“提交”一个含内容的 Taproot 输出，再“揭示”花掉它${cite('Ordinals 官方文档：Inscriptions', 'https://docs.ordinals.com/inscriptions.html')}。</p>
${mm('铭文的提交与揭示', `
flowchart LR
  U["钱包 UTXO<br/>50,000 sat"] --> C["提交交易<br/>创建一个 P2TR 输出<br/>脚本树里藏着内容"]
  C --> TO["P2TR 输出<br/>bc1p…（外表普通）"]
  TO --> R["揭示交易<br/>走脚本路径花掉它<br/>witness 里公开内容"]:::key
  R --> O["输出 0：一个小额输出<br/>铭文绑定的那个聪"]:::warn
  R --> CH["找零"]
  O -.->|"索引器按序数规则<br/>跟踪这个聪的去向"| IDX["Ordinals 索引器<br/>铭文 #N 属于谁"]
`, [
  ['flow', '比特币节点只把揭示交易当作一笔普通的 Taproot 脚本路径花费。内容的“归属”完全由索引器按序数规则推算。'],
  ['key', '内容在 witness 里，按 1 WU / 字节计费，比放在普通字段便宜 4 倍。这是铭文能流行的经济原因。'],
  ['risk', '铭文绑定在某个 UTXO 的某个聪上。不懂铭文的钱包选币时可能把这个 UTXO 当普通零钱花掉，甚至当手续费付给矿工，铭文就转给了别人。'],
  ['limit', '每个数据压栈最多 520 字节，大内容要拆成多段；单笔交易仍受标准交易体积上限约束。']
])}
<p><strong>算一算（示例）</strong>：铭刻一张 40 KB（40,000 字节）的图片，费率 20 sat/vB。</p>
${steps([
  '放在 witness：40,000 字节 × 1 WU = 40,000 WU = 10,000 vB，手续费约 10,000 × 20 = <strong>200,000 sat</strong>（另加交易其他部分，几百 vB）。',
  '假如放在非见证字段：40,000 × 4 = 160,000 WU = 40,000 vB，手续费约 <strong>800,000 sat</strong>。',
  '一个区块 400 万 WU。这一张图就占了 1% 的区块权重，相当于约 70 笔普通单输入 P2WPKH 转账（每笔约 141 vB）。'
])}

<h2>3. BRC-20 与 Runes：比特币上的同质化代币</h2>
<p><strong>BRC-20</strong> 由化名开发者 Domo 在 2023 年 3 月推出，作者本人称它是一个实验${cite('Decrypt：People are minting BRC-20 meme coins on Bitcoin via Ordinals（2023-03-10）', 'https://decrypt.co/123123/people-are-minting-brc-20-meme-coins-on-bitcoin-via-ordinals')}。它用铭文写入一段 JSON（<code>deploy</code>、<code>mint</code>、<code>transfer</code> 三种操作），代币余额完全由链下索引器解释。一次转账要先铭刻一个 transfer 铭文、再把它发出去，至少两笔链上交易，还会留下很多小 UTXO。</p>
<p><strong>Runes</strong> 在 2024 年 4 月 20 日第四次减半的区块 840,000 上线${cite('Cointelegraph：Bitcoin halving users spend record on block space（2024-04-20）', 'https://cointelegraph.com/news/bitcoin-halving-users-spend-record-millions-block-space-runes-rare-satoshis')}。它把指令（runestone）放进一个以 <code>OP_RETURN OP_13</code> 开头的输出；余额记在 UTXO 上，用 edict（指令）决定输入里的 Rune 怎样分配到各个输出；格式错误的 runestone（cenotaph）会烧掉输入里的 Rune${cite('Ordinals 官方文档：Runes', 'https://docs.ordinals.com/runes.html')}。</p>
${compare('三种“代币”放在哪里、谁来解释', [
  { name: 'BRC-20', tag: '铭文里的 JSON', kind: 'warn', points: ['数据在 witness（铭文）', '余额是账户式的，由索引器维护', '转账 = 铭刻 transfer + 发送，至少两笔交易', '不同索引器实现不一致时，余额可能不同'] },
  { name: 'Runes', tag: 'OP_RETURN 里的 runestone', kind: 'key', points: ['数据在 OP_RETURN 输出，体积小', '余额跟着 UTXO 走，符合比特币原生模型', '一笔交易可以把 Rune 分给多个输出', '仍需索引器解释；比特币节点不校验 Rune 余额'] },
  { name: 'ERC-20（对照）', tag: '合约存储', kind: 'info', points: ['余额在合约存储里，由 EVM 执行规则保证', '所有节点对余额有共识', '可以被其他合约直接调用（DeFi 可组合）', '见 <a href="#m02-5">M02.5 代币标准</a>'] }
], [
  ['key', 'BRC-20 和 Runes 的余额不是比特币共识的一部分。“链上”只保证数据被记录，不保证解释正确。'],
  ['risk', '交易所充值要用和发行方一致的索引器版本，并和第二个独立索引器对账，否则可能入账不存在的代币。'],
  ['limit', '比特币脚本不能读取 Rune 余额，所以不能写“用 Rune 抵押借 BTC”这类原生合约；需要索引器或 L2 参与。']
])}

<h2>4. 对手续费和区块空间的影响</h2>
${steps([
  '减半区块 840,000（2024-04-20）中，用户支付手续费约 37.67 BTC，矿工 ViaBTC 加上 3.125 BTC 补贴共获得约 40.7 BTC' + cite('Cointelegraph：Bitcoin halving users spend record on block space（2024-04-20）', 'https://cointelegraph.com/news/bitcoin-halving-users-spend-record-millions-block-space-runes-rare-satoshis') + '。手续费约是区块补贴的 12 倍。',
  'Runes 上线第一周带来超过 1.35 亿美元的比特币交易手续费；三周后铸造和新钱包数量明显回落，日手续费在 12 天里只有两天超过 100 万美元' + cite('The Block：Three weeks after its blockbuster launch, Runes faces declining activity（2024-05-11）', 'https://www.theblock.co/amp/post/293921/three-weeks-after-its-blockbuster-launch-runes-faces-declining-activity') + '。',
  '争议持续：一方认为铭文是付费使用区块空间、帮助矿工在补贴减少后维持收入；另一方认为它挤占支付交易、增加全节点存储。Bitcoin Core 30.0（2025-10）把默认 <code>-datacarriersize</code> 提高到 100,000 字节，并允许一笔交易有多个 OP_RETURN 输出，节点运营者可以改回 83 字节' + cite('Bitcoin Core 30.0 发布说明', 'https://bitcoincore.org/en/releases/30.0/') + '。这是中继策略，不是共识规则。'
])}
${call('warn', '<p><strong>对普通支付业务的含义</strong>：铸造热潮期间，费率可以在几个区块内上涨一个数量级。提币服务的费率估计要设上限和告警；用户侧要提供 RBF 加速；不要在热潮期间做 UTXO 整理。参见 <a href="#m05-60">M06.1</a> 第 5 节。</p>')}
${tbl(['钱包 / 交易所工程规则', '为什么', '怎么做'], [
  ['选币前排除带铭文或 Rune 的 UTXO', '否则会把资产当零钱花掉或付给矿工', '充值地址收到的 UTXO 先过索引器打标签；被标记的 UTXO 只能被专门的转账流程使用'],
  ['铭文 UTXO 的金额不要动', '铭文绑定在具体的聪上，拆分可能把它转进找零或手续费', '发送铭文时把它所在的 UTXO 作为第一个输入、不拆分它的金额，并确认铭文所在的聪按先进先出规则落在收款输出上'],
  ['Runes 转账校验 runestone', '格式错误会变成 cenotaph，输入的 Rune 全部烧掉', '用官方 ord 或经过审计的库构造交易，并在 regtest 上回放'],
  ['双索引器对账', '索引器版本差异会导致余额不同', '每日用两个独立索引器比对热钱包的铭文和 Rune 余额']
])}

<h2>5. 比特币 L2：先问“谁控制被锁的 BTC”</h2>
${recall('<p>桥的四种验证模型（外部验证者、乐观、轻客户端、ZK）和资产模型在 <a href="#m05-8">M06.12 跨链桥</a> 里讲过；以太坊 Rollup 的数据可用性和退出机制在 <a href="#m05-5">M04.5 Rollup 深入</a> 里讲过。比特币脚本不能验证另一条链的状态，所以大多数比特币 L2 的“桥”比以太坊 Rollup 更依赖人或硬件。</p>')}
${tbl(['方案', '被锁 BTC 由谁控制', '谁能偷走 / 冻结', '怎样退出'], [
  ['闪电网络（<a href="#m05-62">M06.3</a>）', '通道双方的 2-of-2 多签，加时间锁', '没人能单方面偷；你离线且无瞭望塔时，对方可能广播旧状态。对方不配合时资金被锁到时间锁到期', '合作关闭或强制关闭，随时可单方面退出'],
  ['Liquid（侧链）', '15 个功能节点（functionary）的 11-of-15 多签，密钥在 HSM 里；资金停摆 4,032 个区块（约 28 天）后，Blockstream 持有的应急密钥可以动用' + cite('Blockstream 帮助中心：How does the Liquid Federation’s multisig work?', 'https://help.blockstream.com/liquid-network/faqs/how-does-the-liquid-federations-multisig-work'), '11 个功能节点合谋可偷走或冻结；联盟长期停摆时应急密钥持有人可动用', '由联盟签名 peg-out；联盟不签就出不去'],
  ['Rootstock（侧链，EVM）', 'PowPeg：多签私钥在 PowHSM 硬件里，HSM 只在看到足够累积工作量时签名；比特币矿工合并挖矿' + cite('Rootstock 官方文档：PowPeg', 'https://dev.rootstock.io/concepts/powpeg/'), '需要同时攻破足够多的 PowHSM，或同时控制大量合并挖矿算力', 'peg-out 由桥合约发起、HSM 签名；peg-in 要等 100 个比特币区块'],
  ['Stacks + sBTC', 'sBTC 的 BTC 存在一个 Taproot 多签地址，由社区选出的签名者集合控制，初始 15 个' + cite('Stacks 官方文档：sBTC', 'https://docs.stacks.co/concepts/sbtc'), '签名者达到门限即可动用；签名者集合可以轮换', '向签名者请求提款；签名者不签就出不去'],
  ['BitVM 类桥（BitVM2）', '预签的交易图 + 运营者垫付；一次性设置阶段只需 1-of-n 诚实' + cite('Linus 等：Bridging Bitcoin to Second Layers via BitVM2（IACR ePrint 2025/1158）', 'https://eprint.iacr.org/2025/1158'), '设置阶段全部参与者都作恶时可偷；运行阶段任何人都能挑战错误的提款声明', '运营者先垫付再向桥报销；错误报销可被挑战并罚没'],
  ['Babylon 比特币质押', '你自己：BTC 锁在自托管的质押脚本里，到期或解绑后取回；第一阶段最长约 64,000 个区块，解绑等待 1,008 个区块' + cite('Babylon Labs：Phased launch of Babylon Bitcoin Staking（2024-08）', 'https://babylonlabs.io/blog/babylon-bitcoin-staking-mainnet-launch-phase-1'), '没人能拿走你的 BTC；第一阶段没有罚没。后续接入 PoS 链后，你委托的节点作恶可能导致你的部分 BTC 被罚没', '时间锁到期或主动解绑，用自己的密钥取回']
])}
<p>其他背景：Stacks 的 Nakamoto 升级在 2024 年 10 月 29 日激活，为 sBTC 打基础${cite('CoinDesk（经 Yahoo Finance 转载）：Stacks activates Nakamoto upgrade（2024-10-29）', 'https://finance.yahoo.com/news/stacks-prominent-bitcoin-layer-2-131735968.html')}；Babylon 第一阶段主网在 2024 年 8 月 22 日上线，初始总质押上限 1,000 BTC${cite('The Block：Babylon launches phase one of its self-custodial bitcoin staking mainnet（2024-08-22）', 'https://www.theblock.co/post/312665/babylon-launches-phase-one-of-its-self-custodial-bitcoin-staking-mainnnet')}；BitVM 最早由 Robin Linus 在 2023 年提出：不改共识规则，把计算放到链下，只在争议时上链验证欺诈证明${cite('Robin Linus：BitVM: Compute Anything on Bitcoin', 'https://bitvm.org/bitvm.pdf')}。</p>
${mm('按“谁控制 BTC”给比特币 L2 分类', `
flowchart TB
  Q["被锁的 BTC 由谁控制？"]:::key
  Q --> S["你自己<br/>时间锁 + 你的密钥"]:::ok
  Q --> T["你和对手方<br/>2-of-2 + 惩罚"]:::ok
  Q --> M["1-of-n 诚实<br/>预签交易 + 挑战"]
  Q --> F["联盟或签名者门限<br/>t-of-n 多签"]:::warn
  Q --> H["HSM 硬件签名组<br/>+ 合并挖矿"]:::warn
  S --> S1["Babylon 质押"]
  T --> T1["闪电网络"]
  M --> M1["BitVM2 类桥"]
  F --> F1["Liquid 11-of-15"]
  F --> F2["sBTC 签名者"]
  H --> H1["Rootstock PowPeg"]
`, [
  ['flow', '从上到下，信任假设越来越强：从“只信数学和自己在线”，到“信大多数签名者不合谋”。'],
  ['key', '“L2”这个标签不说明安全性。同样叫 L2，有的你能单方面退出，有的必须等签名者批准。'],
  ['risk', '联盟或签名者模型下，门限签名者合谋、被监管要求冻结或私钥被盗，都可能让你的 BTC 出不来。'],
  ['limit', '分类只看锚定。L2 自己的出块、数据可用性、合约升级权限也要分别评估。']
])}
${call('info', '<p><strong>评估一个比特币 L2 的五个问题</strong>：① 被锁的 BTC 在什么脚本里，谁有钥匙？② 签名者都不配合时，我能不能单方面取回？要等多久？③ 有没有可以升级合约或更换签名者的管理员密钥？④ L2 的交易数据存在哪里，节点停止服务后我能否证明自己的余额？⑤ 是否有公开审计和事故记录？这和 <a href="#m05-8">M06.12</a> 的桥集成清单是同一套思路。</p>')}

${tryit(`<p><strong>动手练习：</strong>在区块浏览器上亲眼看到铭文、Runes 和减半区块。</p>
${steps([
  '打开 mempool.space，搜索区块高度 <code>840000</code>。记下区块的 Total fees、Subsidy 和交易数，验证“手续费约为补贴的 12 倍”。',
  '在这个区块里点开一笔带 <code>OP_RETURN</code> 输出的交易，展开输出脚本，看到以 <code>OP_RETURN OP_PUSHNUM_13</code> 开头的数据，这就是 runestone。',
  '打开 ordinals.com，任选一个图片铭文，记下它的 inscription id（形如 <code>&lt;揭示 txid&gt;i0</code>）。回到 mempool.space 打开这笔揭示交易，对比 vsize 和 weight：weight 远大于 vsize × 1 的部分来自 witness 里的图片数据。',
  '在 mempool.space 的 Mining 或 Graphs 页面，查看最近一年的平均费率走势，找出费率异常高的时段，再去新闻里查当时发生了什么。'
])}
<p>预期结果：你能指出 runestone 所在的输出、铭文内容所在的 witness，并能用 weight / vsize 解释“为什么图片铭文比同等大小的普通数据便宜”。</p>`)}

${exercises([
  ['（示例）一个 Runes 铸造交易的 vsize 是 150 vB。铸造热潮时费率 300 sat/vB，平时 10 sat/vB。两种情况下手续费各是多少？对同一时段要发一笔 141 vB 普通提币的交易所意味着什么？', '<p>热潮：150 × 300 = 45,000 sat；平时：1,500 sat。交易所的提币在热潮中也要按约 300 sat/vB 竞价，一笔要约 42,300 sat。交易所应提高提币手续费或延后批量提币，并对费率设上限和告警。</p>'],
  ['用户把一个带铭文的 UTXO 充进了只支持 BTC 的交易所热钱包。下一次归集时可能发生什么？怎样预防？', '<p>归集程序把它当普通 UTXO 花掉，铭文绑定的聪被转进归集地址的某个输出甚至变成手续费，铭文实际转给矿工或混入大额 UTXO，难以找回。预防：充值时用索引器给 UTXO 打标签，带铭文 / Rune 的 UTXO 冻结不参与选币，并走人工处理流程。</p>'],
  ['把 Liquid、sBTC 和闪电网络按“我能否在所有其他人都不配合时单方面取回 BTC”排序，并说明理由。', '<p>闪电网络能：强制关闭后等时间锁即可。Liquid 和 sBTC 都不能：peg-out 需要联盟或签名者达到门限签名（Liquid 只有在长期停摆后由应急密钥处理，那也不是你自己的钥匙）。所以闪电网络 &gt; Liquid ≈ sBTC。</p>'],
  ['为什么说 BRC-20 的余额“不在比特币共识里”？这对交易所意味着什么？', '<p>比特币节点只验证交易的签名和 UTXO，不解析铭文 JSON。BRC-20 余额由索引器按规则推算，不同实现可能得出不同结果。交易所必须选定索引器版本、跟踪规则更新，并用第二个索引器对账。</p>']
])}
${checklist([
  '能说出铭文、BRC-20、Runes 的数据分别在交易的哪个部分（witness、witness、OP_RETURN）。',
  '能用权重算出一张图片铭文的手续费，并解释见证折扣的作用。',
  '能为钱包写出“带铭文 / Rune 的 UTXO 不参与选币”的工程规则。',
  '能用一张表说出 6 种比特币 L2 方案的 BTC 控制方、偷 / 冻结风险和退出方式。',
  '在 mempool.space 上找到过区块 840,000 的手续费和一个 runestone 输出。'
])}
${mistakes([
  ['铭文和 Runes 是比特币协议的一部分。', '它们是索引器的约定。比特币节点只把它们当作普通交易，不验证所谓余额或归属。'],
  ['铭文存在“链下”，不占区块空间。', '铭文内容存在 witness 里，是区块的一部分，占用权重、参与手续费竞价。'],
  ['只要叫比特币 L2，就继承比特币的安全性。', '大多数方案的 BTC 由联盟多签、签名者集合或 HSM 控制。要逐个问“谁能偷、谁能冻结、怎样退出”。'],
  ['Babylon 质押要把 BTC 交给别人。', 'BTC 锁在自托管脚本里，用户用自己的密钥取回；风险来自未来可能的罚没条件。'],
  ['BitVM 让比特币可以执行任意智能合约，而且无需信任。', 'BitVM 只在争议时上链验证，桥的设置阶段仍需要 1-of-n 诚实假设，运营者还要垫付流动性。']
])}
${recap([
  'Ordinals 给聪编号；铭文用提交 + 揭示两笔交易，把内容放在 Taproot 脚本路径的 witness 里，享受见证折扣。',
  'BRC-20 用铭文 JSON、账户式余额；Runes 用 OP_RETURN runestone、余额跟着 UTXO 走；两者都靠索引器解释。',
  '减半区块 840,000 的手续费约 37.67 BTC，是补贴的约 12 倍；热潮会推高所有用户的费率，提币服务要设上限和告警。',
  '钱包和交易所要给 UTXO 打标签，带铭文 / Rune 的 UTXO 不参与普通选币。',
  '评估比特币 L2 的核心问题是“谁控制被锁的 BTC”：从自托管时间锁、2-of-2 通道、1-of-n 挑战，到 t-of-n 联盟与 HSM 签名组。'
])}
${quiz([
  { q: 'Runes 协议把转账指令放在交易的哪里？', o: ['Taproot witness 里的铭文', '以 OP_RETURN OP_13 开头的输出', 'nLockTime 字段', '链下数据库'], a: 1, why: 'runestone 在 OP_RETURN 输出里。BRC-20 和铭文才用 witness。比特币节点不解释 runestone，由索引器解释。' },
  { q: '为什么同样大小的数据，放在铭文里比放在普通交易字段里便宜？', o: ['矿工给铭文打折', '铭文不需要手续费', 'witness 数据每字节只算 1 WU，非见证数据算 4 WU', '铭文被压缩了'], a: 2, why: 'SegWit 的权重规则让见证字节按 1/4 计费。铭文利用 Taproot 脚本路径把内容放进 witness。' },
  { q: 'Liquid 联盟中至少多少个功能节点合谋，才能动用被锁的 BTC？', o: ['1 个', '8 个', '15 个', '11 个'], a: 3, why: 'Liquid 使用 11-of-15 多签。长期停摆超过时间锁后，Blockstream 持有的应急密钥也能动用资金。' },
  { q: '下面哪种方案，用户在所有其他参与者都不配合时，仍能用自己的密钥取回 BTC？', o: ['Babylon 质押（时间锁到期后）', 'sBTC', 'Liquid', '托管型闪电钱包'], a: 0, why: 'Babylon 的 BTC 锁在用户自己的质押脚本里，到期后用户自己签名取回。sBTC 和 Liquid 需要签名者门限，托管型钱包由服务商控制。' },
  { q: '交易所热钱包归集时把一个带铭文的 UTXO 当零钱花掉了。问题的根源是什么？', o: ['比特币节点拒绝了交易', '选币程序不知道这个 UTXO 带有索引器层面的资产', '铭文过期了', 'RBF 替换了交易'], a: 1, why: '比特币协议不知道铭文。只有钱包接入索引器并给 UTXO 打标签，选币才能避开它。交易本身是有效的，节点不会拒绝。' }
])}
${terms([
  ['序数理论', 'Ordinal theory', '按挖出顺序给每个聪编号、并按先进先出规则跟踪其去向的约定'],
  ['铭文', 'Inscription', '写在 Taproot 脚本路径 witness 里、约定归属于某个聪的任意数据'],
  ['BRC-20', 'BRC-20', '用铭文 JSON 实现的实验性同质化代币约定，余额由索引器维护'],
  ['符文', 'Runes', '用 OP_RETURN runestone 记录指令、余额跟随 UTXO 的同质化代币协议'],
  ['Runestone', 'Runestone', 'Runes 协议放在 OP_RETURN 输出里的指令数据'],
  ['侧链', 'Sidechain', '通过锚定机制使用 BTC 的独立区块链，例如 Liquid、Rootstock'],
  ['功能节点', 'Functionary', 'Liquid 联盟中持有多签密钥、负责出块和 peg-out 的成员'],
  ['合并挖矿', 'Merged mining', '矿工用同一份工作量同时为比特币和另一条链出块'],
  ['存在性诚实', 'Existential honesty (1-of-n)', '只要 n 个参与者中有 1 个诚实，系统就安全的假设']
])}
` });
})();
