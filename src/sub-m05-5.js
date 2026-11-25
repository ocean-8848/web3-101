/* ---------- M04 子文章（5）：m05-11 Solana 概念 · m05-12 Solana 动手 ---------- */
(() => {
CUR = 'm05-11';
addCh({ id: 'm05-11', nav: 'Solana 概念', title: 'M06.6 Solana 概念：账户模型、交易与 PDA（对照 EVM）', desc: '程序无状态、状态放账户、交易先声明账户：看懂 Solana 与以太坊的根本差异', html: `
<h1>M06.6 Solana 概念：账户模型、交易与 PDA（对照 EVM）</h1>
${meta(['说清“程序无状态、数据存在独立账户里”的含义，并算出一个账户需要的租金押金。', '画出一笔 Solana 交易的结构，解释为什么必须提前声明所有账户，以及这为什么带来并行。', '解释 PDA 是什么、怎么派生、为什么程序能“代签”，并对照 EVM 列出 8 条关键差异。'], '前置：<a href="#m05-1">M04.1 公链全景</a>、<a href="#m02-1">M02.1 智能合约与 EVM</a>')}
${beginner(`<p><strong>Solana</strong>：一条高吞吐的公链，约每 400 毫秒一个区块（slot）。开发语言以 Rust 为主。</p>
<p><strong>lamport</strong>：SOL 的最小单位，1 SOL = 10<sup>9</sup> lamports，相当于以太坊的 wei。</p>
<p><strong>账户（Account）</strong>：链上的一块“带标签的存储”。在 Solana 里，钱包、程序、代币余额、业务数据<strong>全部</strong>是账户。</p>
<p><strong>程序（Program）</strong>：Solana 对“智能合约”的叫法。它只有代码，<strong>自己不存业务数据</strong>。</p>
<p><strong>指令（Instruction）</strong>：一次对程序的调用：调用哪个程序、涉及哪些账户、带什么数据。一笔交易里可以有多条指令。</p>`)}

<h2>1. 一句话理解</h2>
${one('Solana 把“代码”和“数据”分开：程序只有代码，数据放在独立的账户里；每笔交易必须提前声明要读写哪些账户，所以互不冲突的交易可以同时执行。')}
${call('analogy', `<p>以太坊像“每个店铺自带账本”：合约把代码和账本锁在同一个房间里。Solana 像“一个公共档案室”：店员（程序）只带着操作手册上岗，所有账本（账户）放在档案室的柜子里，每个柜子写着“归哪个店员管”。办事前要先告诉门卫要翻哪几个柜子，门卫就能让不翻同一个柜子的人同时办事。</p>
<p>比喻的局限：真实档案室里的柜子不会因为“押金不够”被回收，而 Solana 账户要存入租金押金才能保留。</p>`)}
${art('一图看懂：程序只有代码，数据放在账户里，owner 决定谁能改', 660, 340, [
  S.zone(250, 28, 400, 130, { t: '数据账户：用户甲的计数器' }),
  S.zone(250, 172, 400, 130, { t: '数据账户：用户乙的计数器' }),
  S.box(10, 44, 190, 96, { k: 'key', icon: 'code', t: '计数器程序', s: 'executable = true\n只有代码，没有数据' }),
  S.box(10, 196, 190, 76, { k: 'info', icon: 'wallet', t: '用户钱包账户', s: 'owner = 系统程序\n签名发起交易' }),
  S.pill(264, 58, 170, 28, 'lamports：押金', { k: 'idle' }),
  S.pill(446, 58, 192, 28, 'data：count = 7', { k: 'info' }),
  S.pill(264, 96, 374, 34, 'owner = 计数器程序：只有它能改 data', { k: 'key', b: 1 }),
  S.pill(264, 202, 170, 28, 'lamports：押金', { k: 'idle' }),
  S.pill(446, 202, 192, 28, 'data：count = 3', { k: 'info' }),
  S.pill(264, 240, 374, 34, 'owner = 计数器程序：只有它能改 data', { k: 'key', b: 1 }),
  S.arrow(248, 100, 202, 92, { k: 'key' }),
  S.arrow(248, 252, 202, 126, { k: 'key' }),
  S.arrow(105, 194, 105, 142, { label: '调用' }),
  S.text(330, 326, '一个程序（代码）管理成千上万个数据账户；count 的数值只是示例', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '用户钱包签名发起交易，交易指向计数器程序；程序去读写属于它的数据账户，每个用户一个。'],
  ['key', 'owner 决定“谁能改这个账户的 data”。别的程序即使拿到这个账户，也不能直接写它。'],
  ['risk', '传入了 owner 不对或不属于该用户的账户，而程序没校验，就会读写到不该碰的数据。这是 Solana 上最常见的一类漏洞。'],
  ['limit', '账户要存入押金才能保留，大小创建时就要定好，所以数据结构要提前设计。']
], '一个计数器程序账户只存代码，用户甲和用户乙各有一个数据账户，里面有押金和计数，owner 字段都指向计数器程序，只有它能修改数据', 'm05-11')}

<h2>2. 一切皆账户</h2>
<p>每个账户都有同样的五个字段：</p>
${tbl(['字段', '含义', '备注'], [
  ['<code>lamports</code>', '账户里的余额', '余额低于“租金豁免线”时，账户不能长期保留'],
  ['<code>data</code>', '一段字节数据', '程序账户存字节码；数据账户存业务状态，格式由所属程序决定'],
  ['<code>owner</code>', '<strong>谁有权修改这个账户的 data</strong>', '指向某个程序的地址。只有 owner 程序能改 data 和扣减 lamports'],
  ['<code>executable</code>', '是否是程序账户', 'true 表示里面存的是可执行代码'],
  ['<code>rent_epoch</code>', '租金相关的历史字段', '现在的账户基本都靠“押金达到豁免线”来保留']
])}
${mm('程序与数据账户的关系', `
flowchart TB
  W["用户钱包账户<br/>owner 是系统程序"] -->|"签名发起交易"| TX["交易"]
  TX --> P["计数器程序账户<br/>executable 为 true<br/>只存代码"]
  TX --> D1["用户甲的计数器数据账户<br/>owner 是计数器程序"]
  TX --> D2["用户乙的计数器数据账户<br/>owner 是计数器程序"]
  P -->|"有权修改"| D1
  P -->|"有权修改"| D2
  SYS["系统程序"] -->|"创建账户 转账"| W
`, [
  ['flow', '一个程序可以管理成千上万个数据账户。每个用户或每个业务对象通常对应一个独立的数据账户。'],
  ['key', '<code>owner</code> 决定“谁能改”。别的程序即使拿到了这个账户，也不能直接写它的 data。'],
  ['fail', '传入了错误的账户（例如别人的数据账户，或 owner 不对的账户），而程序没校验，就会读写到不该碰的数据，这是 Solana 上最常见的一类漏洞。'],
  ['limit', '账户大小在创建时通常就要确定，之后扩容有限制，所以数据结构要提前设计。']
])}
<h3>2.1 租金押金：账户不是免费的</h3>
<p>以太坊里写存储花的是一次性 Gas，数据永久保留。Solana 要求账户存入一笔<strong>租金豁免押金</strong>才能保留。公式：<strong>(128 + 数据字节数) × 6,960 lamports</strong>。账户关闭时押金退还给你。</p>
<p><strong>算一算（示例）：</strong></p>
${steps([
  '空账户（数据 0 字节）：128 × 6,960 = 890,880 lamports ≈ 0.00089 SOL。',
  '一个 165 字节的代币账户：(128 + 165) × 6,960 = 293 × 6,960 = 2,039,280 lamports ≈ 0.00204 SOL。',
  '一个 8 字节“鉴别码”加 40 字节数据的计数器账户：(128 + 48) × 6,960 = 1,224,960 lamports ≈ 0.00122 SOL。'
])}
${call('info', '<p>租金费率由网络参数决定，以 Solana 官方文档的 Rent 页面为准。关键直觉：<strong>数据越大，押金越多；押金可退，不是手续费。</strong>所以给每个用户建一个账户的设计，要把“用户付押金”算进产品成本里。</p>')}

<h2>3. 交易与指令</h2>
${mm('一笔 Solana 交易的结构', `
flowchart TB
  TX["交易"] --> SIG["签名列表<br/>每个必须签名的账户一个签名"]
  TX --> MSG["消息 Message"]
  MSG --> HDR["头部<br/>需要签名的数量 只读的数量"]
  MSG --> KEYS["账户地址列表<br/>本笔交易会碰的全部账户"]
  MSG --> BH["最近区块哈希<br/>约 1 到 2 分钟后过期"]
  MSG --> INS["指令列表"]
  INS --> I1["指令 1<br/>程序 ID + 用到的账户序号 + 指令数据"]
  INS --> I2["指令 2 ……"]
`, [
  ['flow', '所有指令用到的账户，都先列在 Message 的地址列表里，指令里只写“列表中的第几个”。'],
  ['key', '提前声明账户，并标注“只读”或“可写”。运行时系统据此判断哪些交易会冲突，不冲突的并行执行。'],
  ['fail', '最近区块哈希过期，交易会被拒绝（常见报错：Blockhash not found）。需要重新取哈希、重新签名、重新发送。'],
  ['limit', '一笔交易的大小有上限（常用值约 1,232 字节），所以一笔交易里能带的账户和指令数量有限。']
])}
<ul>
  <li><strong>原子性</strong>：一笔交易里的多条指令要么全部成功，要么全部回滚，和以太坊的交易类似。</li>
  <li><strong>费用</strong>：基础费每个签名 5,000 lamports；可以另付“优先费”让交易更容易被打包。计算量用<strong>计算单元（CU）</strong>计量，每条指令默认上限约 200,000 CU，整笔交易最多约 1,400,000 CU。</li>
  <li><strong>确认</strong>：有 processed、confirmed、finalized 三个级别，对应“刚被执行”“被多数验证者投票”“不可回滚”。</li>
</ul>
<p><strong>算一算（示例）：</strong>转 1 SOL 给朋友。交易只有 1 个签名：基础费 = 1 × 5,000 = 5,000 lamports = 0.000005 SOL。若加 1,000 micro-lamports 每 CU 的优先费，并设置 CU 上限 200,000，则优先费 = 200,000 × 1,000 ÷ 1,000,000 = 200 lamports，总费用 5,200 lamports。</p>
${mm('为什么提前声明账户能并行', `
flowchart LR
  A["交易甲<br/>写账户 X 读账户 Z"] --> S["调度器检查账户冲突"]
  B["交易乙<br/>写账户 Y 读账户 Z"] --> S
  C["交易丙<br/>写账户 X"] --> S
  S -->|"甲和乙不冲突：并行"| P["同时执行甲与乙"]
  S -->|"丙与甲都写 X：排队"| Q["丙在甲之后执行"]
`, [
  ['flow', '多个交易可以同时读同一个账户，但同一时刻只能有一个交易写它。'],
  ['risk', '所有人都去写同一个热点账户（例如一个全局计数器），会让交易排队，吞吐降到串行。设计程序时要把状态拆分到多个账户。'],
  ['key', '“账户是并行的单位”：这是 Solana 高吞吐的核心设计，也是写 Solana 程序时最重要的建模原则。']
])}

<h2>4. PDA：由程序“拥有”的地址</h2>
<p>普通账户的地址是一个公钥，对应一把私钥，有私钥才能签名。<strong>PDA（Program Derived Address，程序派生地址）</strong>是用“程序 ID + 一组种子（seeds）”算出来的地址，它被刻意选在椭圆曲线之外，<strong>没有任何私钥</strong>。</p>
${mm('PDA 的派生与代签', `
flowchart LR
  S["种子 seeds<br/>例如 counter 加用户公钥"] --> F["find_program_address"]
  P["程序 ID"] --> F
  F --> R["PDA 地址 + bump<br/>从 255 向下找第一个落在曲线外的值"]
  R --> U["程序用 invoke_signed<br/>附上种子和 bump 为 PDA 代签"]
`, [
  ['flow', '同样的程序 ID 和种子，永远派生出同一个 PDA。客户端和程序都能独立算出它，不需要保存映射表。'],
  ['key', '因为没有私钥，只有派生它的程序能“代签”，别人无法伪造。这让程序可以安全地托管资产、创建账户。'],
  ['risk', '使用<strong>规范 bump</strong>（找到的第一个有效值）。允许任意 bump，可能让同一组种子对应多个 PDA，造成校验被绕过。'],
  ['limit', '种子数量和每个种子的长度有上限（最多 16 个种子，每个最多 32 字节）。']
])}
${tbl(['用途', '种子例子', '说明'], [
  ['每个用户一个数据账户', '<code>["profile", 用户公钥]</code>', '用户地址即可找到他的数据账户，不需要额外索引'],
  ['程序托管的金库', '<code>["vault", 池 ID]</code>', '金库的“所有者”是 PDA，资金只能按程序规则转出'],
  ['关联代币账户（ATA）', '<code>[钱包, 代币程序, 代币 mint]</code>', '每个钱包对每种代币有一个固定地址的代币账户，见 <a href="#m05-12">M06.7</a>']
])}
${call('info', '<p>类比以太坊：PDA 有点像 CREATE2 算出的地址——“地址可预测”。区别是 PDA 没有私钥，只能由派生它的程序操作；而 CREATE2 的合约有代码，自己就是主体。</p>')}

<h2>5. 与 EVM 的对照</h2>
${tbl(['维度', '以太坊 EVM', 'Solana'], [
  ['代码与数据', '合约把代码和存储放在一起', '程序只有代码；数据在独立账户里，由 owner 字段指向程序'],
  ['调用时涉及的状态', '合约运行时隐式读写自己的存储', '交易必须提前列出所有会碰的账户，并标注读或写'],
  ['并行', '交易顺序执行', '账户不冲突的交易并行执行'],
  ['存储成本', '写存储付一次性 Gas', '账户存租金豁免押金，关闭可退'],
  ['手续费', 'Gas 价格 × Gas 用量，随拥堵浮动', '每个签名 5,000 lamports 基础费 + 可选优先费；有计算单元上限'],
  ['代币', '每种代币是一个合约，自己记余额', '共用一个代币程序；每种代币一个 mint 账户，每个持有人一个代币账户'],
  ['权限与签名', 'msg.sender；合约账户没有私钥', '指令里每个账户标注是否签名；PDA 由程序代签'],
  ['升级', '需要代理模式', '程序默认可升级，由“升级权限”控制，可以放弃它让程序不可变'],
  ['语言与工具', 'Solidity、Foundry', 'Rust、Anchor 框架、Solana CLI']
])}
<p>另一类非 EVM 设计是 Move 链（Aptos、Sui）的资源与对象模型，见 <a href="#m05-64">M06.9 Move 链</a>。</p>

<h2>6. 账户校验：Solana 程序安全的第一课</h2>
<p>因为调用方决定传哪些账户，<strong>程序必须逐个检查传进来的账户</strong>。EVM 里不存在这类问题，因为合约读写的是自己的存储。</p>
${tbl(['检查项', '不检查会怎样', 'Anchor 里的写法'], [
  ['该签名的账户是否真的签了名', '任何人都能冒充管理员调用', '<code>Signer&lt;\'info&gt;</code> 类型，或 <code>#[account(signer)]</code>'],
  ['账户的 owner 是不是预期程序', '攻击者传一个格式相似但 owner 是自己程序的假账户', '<code>Account&lt;\'info, T&gt;</code> 自动检查 owner'],
  ['账户类型是否正确（鉴别码）', '把“管理员配置”账户当成“用户账户”读', 'Anchor 在每个账户前加 8 字节鉴别码并自动校验'],
  ['PDA 是否由预期种子派生', '用别人的账户替代自己的', '<code>seeds = […], bump</code> 约束'],
  ['字段间的关系', '把 A 用户的凭证配上 B 用户的金库', '<code>has_one = authority</code>、<code>constraint = …</code>'],
  ['是否被重复初始化', '已有数据被覆盖', '<code>init</code> 只能用于不存在的账户；谨慎使用 <code>init_if_needed</code>']
])}
${call('risk', '<p>2022 年 2 月的 Wormhole 事件，根因就是 Solana 端的程序在验证签名时，没有检查传入的“系统指令账户”是不是真正的系统账户，攻击者用伪造的账户绕过了签名校验。事件复盘见 <a href="#m05-8">M06.12 跨链桥</a>，技术分析见 <a href="https://www.certik.com/blog/wormhole-bridge-exploit-incident-analysis" target="_blank" rel="noopener noreferrer">CertiK 的事件分析</a>。启示：<strong>只要是调用方传进来的账户，就不能默认它是真的。</strong></p>')}

${tryit(`<p><strong>动手练习：</strong>在浏览器里读一读链上的账户。</p>
${steps([
  '打开 Solana Explorer（explorer.solana.com），切换到 Devnet。',
  '搜索系统程序地址 <code>11111111111111111111111111111111</code>，看它的 owner 和 executable 字段。',
  '随便打开一个钱包地址，观察 Owner 是 System Program，Balance 以 SOL 显示（1 SOL = 10<sup>9</sup> lamports）。',
  '再打开一笔交易，找到“Account Inputs”：每个账户旁标着是否签名、是否可写，对照本文第 3 节的交易结构。'
])}
<p>预期结果：你能指出这笔交易里谁签了名、哪些账户被写入。</p>`)}

${mistakes([
  ['Solana 程序像以太坊合约一样，自己保存状态。', '程序只有代码；状态存在独立账户里，由 owner 字段指向程序。'],
  ['租金押金是一次性手续费，花掉就没了。', '押金存在账户里，关闭账户时退还。它是“占用链上空间”的保证金。'],
  ['PDA 有私钥，只是别人不知道。', 'PDA 在曲线之外，不存在私钥。只有派生它的程序能通过 invoke_signed 代签。'],
  ['传进来的账户，程序可以默认是真的。', '账户由调用方指定，必须校验 owner、签名、类型、种子和字段关系。'],
  ['Solana 快，所以怎么设计状态都行。', '所有交易都写同一个热点账户会串行。要把状态拆到多个账户，才能并行。']
])}
${recap([
  'Solana 把代码和数据分开：程序无状态，数据在独立账户里，owner 字段决定谁能改。',
  '账户要存租金豁免押金：(128 + 字节数) × 6,960 lamports，关闭可退。',
  '交易必须提前声明账户并标注读写，运行时据此并行执行不冲突的交易。',
  'PDA 由程序 ID 和种子派生，没有私钥，由程序代签，用来托管资产和给用户建账户。',
  '调用方决定传哪些账户，程序必须校验：签名、owner、类型、种子、字段关系。'
])}
${quiz([
  { q: '在 Solana 里，谁有权修改一个数据账户的 data？', o: ['任何签名了的钱包', '账户 owner 字段指向的程序', '部署该程序的人', '验证者'], a: 1, why: 'owner 字段决定哪个程序能修改 data 和扣减 lamports。其他账户即使被传入，也不能直接写它。' },
  { q: '一个 165 字节的账户，租金豁免押金约是多少 lamports？', o: ['890,880', '1,224,960', '2,039,280', '5,000'], a: 2, why: '(128 + 165) × 6,960 = 2,039,280 lamports。890,880 是空账户；5,000 是单个签名的基础费，与押金无关。' },
  { q: '为什么 Solana 要求交易提前列出所有会碰的账户？', o: ['为了让交易更便宜', '为了让运行时判断冲突，并行执行互不冲突的交易', '为了防止重放攻击', '为了减少签名数量'], a: 1, why: '提前声明读写集合，调度器才能判断哪些交易互相冲突。不冲突的并行，冲突的排队。' },
  { q: 'PDA 为什么“没有私钥”也能让程序操作它？', o: ['程序偷偷保存了私钥', '运行时允许派生它的程序用种子和 bump 代签（invoke_signed）', 'PDA 不需要任何签名', '验证者替它签名'], a: 1, why: '运行时验证“种子加程序 ID 确实派生出这个地址”，就接受该程序为它代签。别的程序无法伪造。' },
  { q: '下面哪一项最可能造成“账户替换”类漏洞？', o: ['使用了 u64 存余额', '没有校验传入账户的 owner 和种子', '交易里放了多条指令', '给账户存了太多押金'], a: 1, why: '账户由调用方指定。不校验 owner、种子和字段关系，攻击者就能传入自己构造的账户。' }
])}
${exercises([
  ['为什么“给每个用户建一个账户”的设计，要把押金成本算进产品里？', '<p>每个账户都要存租金豁免押金。如果一个用户账户占 176 字节，押金约 0.00122 SOL。用户量大时，押金总额不小。常见做法是由用户自己付押金，或在用户不再需要时关闭账户把押金退回。</p>'],
  ['一个全局排行榜程序，所有用户的每次得分都写同一个“排行榜账户”。会遇到什么问题，怎么改？', '<p>所有交易都写同一个账户，只能串行执行，吞吐降到最低。改法：每个用户写自己的得分账户，排行榜由链下索引器汇总，或定期由一个管理交易把结果汇总到排行榜账户。</p>']
])}
${checklist([
  '能说出账户的五个字段，并解释 owner 字段的作用。',
  '能手算任意大小账户的租金豁免押金。',
  '能画出一笔交易的结构，并解释为什么提前声明账户能并行。',
  '能说明 PDA 是什么、怎么派生、为什么能代签。',
  '能列出至少 4 项账户校验，并说出每一项防的是什么。'
])}
${terms([
  ['程序', 'Program', 'Solana 上只含代码、不含业务状态的智能合约。'],
  ['账户', 'Account', 'Solana 上统一的存储单元：余额、数据、owner、是否可执行。'],
  ['lamport', 'Lamport', 'SOL 的最小单位，1 SOL = 10^9 lamports。'],
  ['租金豁免', 'Rent exemption', '账户存入足够押金后可以长期保留，关闭账户时退还。'],
  ['指令', 'Instruction', '对某个程序的一次调用：程序 ID、涉及的账户、指令数据。'],
  ['计算单元', 'Compute unit (CU)', '衡量一笔交易计算量的单位，有每笔交易的上限。'],
  ['PDA', 'Program Derived Address', '由程序 ID 和种子派生、没有私钥的地址，只有该程序能代签。'],
  ['bump', 'Bump seed', '让派生地址落在椭圆曲线之外的附加字节，规范值是从 255 往下找到的第一个。'],
  ['鉴别码', 'Discriminator', 'Anchor 在账户数据前加的 8 字节标识，用来区分账户类型。']
])}
` });

CUR = 'm05-12';
addCh({ id: 'm05-12', nav: 'Solana 动手', title: 'M06.7 Solana 动手：用 Anchor 写程序、测试、部署并发行 SPL Token', desc: '写一个 PDA 计数器、本地测试、部署到 devnet，再用命令行和脚本发行一个代币', html: `
<h1>M06.7 Solana 动手：用 Anchor 写程序、测试、部署并发行 SPL Token</h1>
${meta(['用 Anchor 写出一个带 PDA 和权限检查的计数器程序，并读懂每个账户约束的含义。', '在本地验证节点上测试，部署到 devnet，并用 TypeScript 调用它、读取账户数据。', '解释 mint、代币账户和关联代币账户（ATA）的关系，并用命令行与脚本发行一个 SPL Token。'], '前置：<a href="#m05-11">M06.6 Solana 概念</a>、<a href="#m05-75">M06.5 Rust 快速入门</a>')}
${beginner(`<p><strong>Anchor</strong>：Solana 最常用的 Rust 开发框架。它帮你自动完成账户校验、数据序列化，并生成 TypeScript 调用库。</p>
<p><strong>Solana CLI</strong>：命令行工具，用来管理钱包、领测试币、部署程序。</p>
<p><strong>devnet</strong>：Solana 的开发测试网，测试币免费领取，没有价值。</p>
<p><strong>SPL Token</strong>：Solana 的代币标准程序。所有代币共用这一个程序，不需要每种代币单独写合约。</p>
<p><strong>IDL</strong>：接口描述文件，相当于 ABI。Anchor 编译后会生成，客户端靠它知道怎么调用程序。</p>`)}

<h2>1. 一句话理解</h2>
${one('Anchor 把“账户校验”写成声明：你在结构体上用约束说明每个账户必须满足什么条件，框架在指令执行前替你检查，业务代码只写“检查通过之后做什么”。')}
${call('analogy', `<p>像机场安检：你不用在登机口一个个核对乘客，而是先在安检口按清单统一检查（账户约束），通过的人才进登机口（指令函数）。</p>
<p>比喻的局限：安检清单要自己写对。少写一项约束，漏洞就在那里，框架不会替你想到所有业务规则。</p>`)}
${art('一图看懂：一个计数器账户 = PDA 地址 + 48 字节数据 + 可退押金', 660, 332, [
  S.box(10, 52, 170, 48, { k: 'tint', t: '"counter"', s: '固定字符串（seed）', mono: 1 }),
  S.box(10, 112, 170, 48, { k: 'tint', t: '用户公钥', s: 'user.key()（seed）' }),
  S.box(10, 172, 170, 48, { k: 'tint', t: '程序 ID', s: 'declare_id!' }),
  S.pill(248, 32, 174, 26, 'find_program_address', { k: 'idle' }),
  S.box(248, 70, 174, 112, { k: 'key', icon: 'key', t: 'PDA 地址', s: '没有私钥\n只有本程序能代签\n同样输入得到同一地址', ik: 'key' }),
  S.box(486, 70, 164, 112, { k: 'info', t: 'Counter 账户', s: '地址 = PDA\nowner = 计数器程序\n押金 0.00122 SOL' }),
  S.text(10, 246, '账户 data 共 8 + 32 + 8 = 48 字节', { size: 12.5, dim: 1, b: 1 }),
  S.box(10, 254, 100, 50, { k: 'idle', dash: 1, t: '鉴别码', s: '8 字节' }),
  S.box(114, 254, 409, 50, { k: 'info', t: 'authority', s: '32 字节 · 只有这把公钥能给计数器加一' }),
  S.box(527, 254, 123, 50, { k: 'ok', t: 'count', s: '8 字节 · u64', mono: 1 }),
  S.arrow(182, 76, 246, 100), S.arrow(182, 136, 246, 126), S.arrow(182, 196, 246, 152),
  S.arrow(424, 126, 484, 126),
  S.arrow(568, 184, 568, 252),
  S.text(330, 324, '押金 = (128 + 48) × 6,960 = 1,224,960 lamports ≈ 0.00122 SOL，账户关闭时退还（示例）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '固定字符串、用户公钥和程序 ID 一起算出 PDA 地址。每个用户的地址都能被客户端和程序独立算出来，不需要保存映射表。'],
  ['key', 'PDA 没有私钥，只有派生它的程序能代签。Counter 账户的 owner 是计数器程序，所以只有它能改 data。'],
  ['risk', '少写 has_one，别人可以拿自己的签名去加别人的计数器；少写 seeds，可以传入任何同类型账户。'],
  ['limit', '账户大小在创建时定死：8 字节鉴别码 + 32 + 8 = 48 字节，数据越大押金越多，押金可退但不是手续费。']
], '三个种子（固定字符串、用户公钥、程序 ID）算出 PDA 地址；该地址上的 Counter 账户共 48 字节数据，依次是鉴别码、authority 公钥和 count 计数，押金约 0.00122 SOL', 'm05-12')}

<h2>2. 准备环境</h2>
${code('BASH', `
# 1. 安装 Rust 与 Solana CLI、Anchor 版本管理器（具体安装命令以官方文档为准）
rustc --version && solana --version && anchor --version

# 2. 创建钱包并切到 devnet，领取测试币
solana-keygen new --outfile ~/.config/solana/id.json     # 生成开发钱包，记下助记词，只用于学习
solana config set --url devnet
solana airdrop 2                                          # 领 2 个测试 SOL（限流时稍后重试）
solana balance

# 3. 创建 Anchor 项目
anchor init counter && cd counter
`)}
${call('warn', '<p>开发钱包只用于测试网，<strong>不要往里面放真实资产</strong>，也不要把 <code>id.json</code> 提交到 Git。下面的示例基于 Anchor 0.30 及以上版本，更早的版本在账户传参上写法略有不同。</p>')}

<h2>3. 第一个程序：PDA 计数器</h2>
<p>需求：每个用户有自己的计数器，只有本人能加一，溢出时报错。计数器账户用 PDA，种子是固定字符串加用户公钥。</p>
${code('RUST', `
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");   // 占位：运行 anchor keys sync 后会替换成你自己的程序 ID

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let c = &mut ctx.accounts.counter;
        c.authority = ctx.accounts.user.key();
        c.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let c = &mut ctx.accounts.counter;
        c.count = c.count.checked_add(1).ok_or(CounterError::Overflow)?;   // 检查溢出，而不是静默回绕
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,                                          // 创建新账户
        payer = user,                                  // 押金由 user 支付
        space = 8 + Counter::INIT_SPACE,               // 8 字节鉴别码 + 数据大小
        seeds = [b"counter", user.key().as_ref()],     // PDA 种子：固定字符串 + 用户公钥
        bump                                           // Anchor 自动找规范 bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,                           // 必须签名；mut 因为要扣押金
    pub system_program: Program<'info, System>,        // 创建账户要调用系统程序
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,                                           // 要写入
        seeds = [b"counter", authority.key().as_ref()],
        bump,
        has_one = authority                            // counter.authority 必须等于传入的 authority
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub authority: Pubkey,   // 32 字节
    pub count: u64,          // 8 字节
}

#[error_code]
pub enum CounterError {
    #[msg("计数溢出")]
    Overflow,
}
`)}
${mm('一次 increment 调用：Anchor 在你的代码之前做了什么', `
flowchart TB
  C["客户端发送交易<br/>指令 increment + 账户列表"] --> D["Anchor 分发<br/>按指令前 8 字节鉴别码找到函数"]
  D --> V1["检查 authority 是否签名"]
  V1 --> V2["检查 counter 账户 owner 是本程序<br/>且前 8 字节鉴别码是 Counter"]
  V2 --> V3["按种子重新派生 PDA，必须等于传入地址"]
  V3 --> V4["检查 counter.authority 等于 authority"]
  V4 --> H["全部通过后才执行 increment 函数体"]
  V1 -->|"任何一项失败"| ERR["交易失败并返回 Anchor 错误码"]
  V2 --> ERR
  V3 --> ERR
  V4 --> ERR
`, [
  ['flow', '约束检查发生在函数体之前。函数体里拿到的 <code>ctx.accounts.counter</code> 已经通过了全部声明的校验。'],
  ['fail', '少写 <code>has_one</code>：别的用户可以传入自己的签名，去增加别人的计数器。少写 <code>seeds</code>：可以传入任何同类型账户。'],
  ['key', '每一条约束对应 <a href="#m05-11">M06.6</a> 第 6 节账户校验清单里的一项。'],
  ['limit', '约束只能表达“账户之间的静态关系”。余额够不够、时间窗口对不对这类业务规则，还要自己在函数体里检查。']
])}
${tbl(['约束 / 类型', '含义', '防什么'], [
  ['<code>Signer</code>', '该账户必须在交易里签名', '冒充'],
  ['<code>Account&lt;T&gt;</code>', '账户 owner 是本程序，且鉴别码匹配类型 T', '传入假账户、类型混淆'],
  ['<code>init</code> + <code>payer</code> + <code>space</code>', '创建账户、谁付押金、分配多少字节', '重复初始化、空间不足'],
  ['<code>seeds</code> + <code>bump</code>', '地址必须是由这些种子派生出的 PDA', '账户替换'],
  ['<code>has_one = x</code>', '账户内字段 x 必须等于同名的传入账户', '把 A 的凭证配 B 的数据'],
  ['<code>mut</code>', '账户可写', '——（标注可写，让运行时能判断并行）']
])}
<p><strong>算一算（示例）：</strong>计数器账户的数据：鉴别码 8 + authority 32 + count 8 = 48 字节。押金 = (128 + 48) × 6,960 = 1,224,960 lamports ≈ 0.00122 SOL，由 <code>payer</code> 支付。</p>

<h2>4. 测试、部署与调用</h2>
${code('TYPESCRIPT', `
// tests/counter.ts —— 运行 anchor test 会自动启动本地验证节点、部署并执行测试
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import { assert } from "chai";

describe("counter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Counter as Program<Counter>;
  const user = provider.wallet.publicKey;

  // 客户端自己派生 PDA：种子必须和程序里完全一致
  const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), user.toBuffer()],
    program.programId
  );

  it("初始化并加一", async () => {
    // Anchor 0.30 及以上会自动推导 PDA、签名者和系统程序；更早版本需要在 accounts 里手动传入
    await program.methods.initialize().rpc();
    await program.methods.increment().rpc();
    const acc = await program.account.counter.fetch(counterPda);
    assert.equal(acc.count.toNumber(), 1);
    assert.equal(acc.authority.toBase58(), user.toBase58());
  });

  it("别人不能加我的计数器", async () => {
    const other = anchor.web3.Keypair.generate();
    let failed = false;
    try {
      await program.methods.increment()
        .accountsPartial({ counter: counterPda, authority: other.publicKey })
        .signers([other]).rpc();
    } catch (e) { failed = true; }
    assert.isTrue(failed);       // seeds 或 has_one 约束会拒绝
  });
});
`)}
${code('BASH', `
anchor build                                  # 编译程序，生成 IDL 与 TypeScript 类型到 target/
anchor keys sync                              # 把 declare_id 同步成 target 里生成的程序密钥
anchor test                                   # 本地验证节点上跑测试

# 部署到 devnet（钱包里需要有测试 SOL，部署要存放程序代码，需要足够的押金）
anchor deploy --provider.cluster devnet
solana program show <程序 ID> --url devnet     # 查看程序账户：owner、升级权限、大小
`)}
${tbl(['报错', '含义', '怎么查'], [
  ['<code>AccountNotInitialized</code>（3012）', '传入的账户还没有被 init', '先调用 initialize；检查 PDA 种子是否一致'],
  ['<code>ConstraintSeeds</code>（2006）', '传入地址不是按声明的种子派生出的 PDA', '对照程序里的 seeds 和客户端的派生代码，字节要完全相同'],
  ['<code>ConstraintHasOne</code>（2001）', 'has_one 字段与传入账户不一致', '检查谁在签名，以及账户里存的 authority'],
  ['<code>custom program error: 0x1770</code>', '第一个自定义错误（6000 号），本例是 Overflow', '自定义错误从 6000 开始依次编号：0x1770 即 6000'],
  ['<code>Blockhash not found</code>', '交易用的最近区块哈希已过期', '重新获取哈希、签名、发送']
])}
${call('info', '<p>程序部署后默认仍可升级：升级权限在你的钱包手里。上线主网前要决定：交给多签管理，还是放弃升级权限让程序不可变。升级权限等同于修改全部业务规则的权力，和以太坊里的代理管理员一样重要。</p>')}

<h2>5. 用脚本读写链：web3.js 基础</h2>
${code('TYPESCRIPT', `
// 使用 @solana/web3.js 1.x。新一代 SDK（@solana/kit）的接口完全不同，学习时先确认你用的是哪一套
import { Connection, Keypair, PublicKey, SystemProgram, Transaction,
         sendAndConfirmTransaction, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// 读：余额与账户信息
const addr = new PublicKey("替换成一个 devnet 地址");
const lamports = await connection.getBalance(addr);
console.log("余额 SOL:", lamports / LAMPORTS_PER_SOL);
const info = await connection.getAccountInfo(addr);
console.log("owner:", info?.owner.toBase58(), "数据长度:", info?.data.length);

// 写：转账 0.01 SOL（payer 是你的 Keypair，从文件读取，不要写进代码）
async function send(payer: Keypair, to: PublicKey) {
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: to, lamports: 0.01 * LAMPORTS_PER_SOL })
  );
  return await sendAndConfirmTransaction(connection, tx, [payer]);   // 内部会取最近区块哈希并签名
}
`)}
<p>注意：<code>0.01 * LAMPORTS_PER_SOL</code> 在 JavaScript 中是浮点数乘法，示例里恰好是整数 10,000,000。金额较复杂时，用整数运算或 <code>BigInt</code>，避免浮点误差。</p>

<h2>6. 发行一个 SPL Token</h2>
<p>以太坊里，每种代币是一个合约，自己记余额。Solana 里所有代币共用<strong>同一个代币程序</strong>，用账户区分：</p>
${mm('SPL Token 的三类账户', `
flowchart TB
  MINT["Mint 账户（代币本身）<br/>总供应量 小数位 铸币权限 冻结权限"]
  TP["代币程序<br/>所有代币共用"]
  TA1["代币账户：甲持有该币<br/>记余额，owner 字段是甲"]
  TA2["代币账户：乙持有该币"]
  W1["甲的钱包"] -->|"拥有"| TA1
  W2["乙的钱包"] -->|"拥有"| TA2
  TP -->|"管理"| MINT
  TP -->|"管理"| TA1
  TP -->|"管理"| TA2
  MINT -.->|"mint 字段指向"| TA1
`, [
  ['flow', 'Mint 记录“这种币的总量和规则”；每个持有人在每种币上有一个自己的代币账户，记录余额。'],
  ['key', '<strong>关联代币账户（ATA）</strong>是 PDA：由“钱包、代币程序、mint”派生。只要知道钱包和 mint，就能算出对方的代币账户地址。'],
  ['risk', 'mint 的“铸币权限”如果留在个人钱包里，持有者可以无限增发。发行后应转给多签或程序 PDA，或者直接放弃。'],
  ['limit', '每个代币账户都要存租金押金：165 字节的账户约 0.00204 SOL。首次给别人转某种币时，通常要为对方创建 ATA。']
])}
${code('BASH', `
spl-token create-token --decimals 6              # 创建 mint，输出 mint 地址；6 位小数，像 USDC 一样
spl-token create-account <MINT>                  # 为自己创建这个币的代币账户（ATA）
spl-token mint <MINT> 1000                       # 铸造 1000 枚到自己的账户
spl-token balance <MINT>
spl-token transfer <MINT> 10 <对方钱包地址> --fund-recipient   # 转 10 枚；对方没有 ATA 时由你付押金创建
spl-token authorize <MINT> mint --disable        # 放弃铸币权限：总量从此固定，不可逆
`)}
<p><strong>算一算（示例）：</strong>小数位是 6。链上记录的是最小单位的整数：<code>1000</code> 枚 = 1000 × 10<sup>6</sup> = 1,000,000,000 最小单位。转 10 枚 = 转 10,000,000 最小单位。和以太坊的 decimals 概念完全一致。</p>
${code('TYPESCRIPT', `
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

// payer：付费并作为铸币权限的 Keypair（测试用）；connection 同上
const mint = await createMint(connection, payer, payer.publicKey, null, 6);    // 铸币权限、冻结权限（null 表示无）、小数位
const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
await mintTo(connection, payer, mint, ata.address, payer, 1_000 * 10 ** 6);    // 1000 枚 = 1000 × 10^6 最小单位
console.log("mint:", mint.toBase58(), "我的代币账户:", ata.address.toBase58());
`)}
${call('info', '<p>要让<strong>程序自己</strong>铸币或转出代币（例如奖励发放、金库提款）：把 mint 的铸币权限，或代币账户的 owner，设为程序的 PDA，再让程序用 PDA 代签去调用代币程序（Anchor 里用 <code>anchor_spl</code> 加 <code>CpiContext::new_with_signer</code>）。这是 PDA 最典型的用途，对应以太坊里“合约持有资产”。</p>')}

${tryit(`<p><strong>动手练习：</strong>在 devnet 上完成“发币到转账”。</p>
${steps([
  '按第 2 节准备钱包并领测试 SOL。',
  '用第 6 节的命令创建 6 位小数的代币，铸造 1000 枚。',
  '用 <code>solana-keygen new --outfile friend.json</code> 生成第二个钱包，用 <code>solana-keygen pubkey friend.json</code> 取地址。',
  '用 <code>spl-token transfer</code> 转 10 枚给它，并加 <code>--fund-recipient</code>。',
  '在 Solana Explorer（Devnet）打开 mint 地址，核对供应量；再打开对方的 ATA，核对 10 枚余额。',
  '用 <code>spl-token authorize &lt;MINT&gt; mint --disable</code> 放弃铸币权限，再尝试铸造一次，确认失败。'
])}
<p>预期结果：转账成功，对方地址下出现一个新的代币账户；放弃铸币权限后，再铸造会报错。</p>`)}

${mistakes([
  ['Anchor 自动保证程序安全，不用再检查。', 'Anchor 只执行你声明的约束。少写一条，就少一道防线；业务规则（余额、时间窗口）要自己检查。'],
  ['<code>space</code> 只要写数据大小。', '要加上 8 字节鉴别码：<code>8 + Counter::INIT_SPACE</code>。少了这 8 字节，账户装不下数据。'],
  ['客户端派生 PDA 时，种子可以随便写。', '种子的内容、顺序、字节编码都必须和程序里完全一致，差一个字节就是另一个地址。'],
  ['发完币就结束了，铸币权限放着没关系。', '铸币权限等于“增发权”。不需要继续增发，就放弃；需要，就交给多签或程序 PDA，并公开说明。'],
  ['给别人转币，对方的代币账户一定已经存在。', '对方没有 ATA 时转账会失败，需要先创建，并由某一方支付押金。']
])}
${recap([
  'Anchor 用约束声明账户校验：Signer、Account、seeds 与 bump、has_one、init 与 space，函数体之前就检查完毕。',
  '计数器账户的空间是 8 字节鉴别码加数据；押金 = (128 + 字节数) × 6,960 lamports。',
  '本地用 anchor test 验证，部署用 anchor deploy；报错看 Anchor 错误码，自定义错误从 6000 开始。',
  '所有代币共用一个代币程序：mint 记规则，每个持有人一个代币账户，ATA 是由钱包和 mint 派生的 PDA。',
  '铸币权限要么放弃，要么交给多签或 PDA；升级权限同理。'
])}
${quiz([
  { q: '<code>space = 8 + Counter::INIT_SPACE</code> 里的 8 是什么？', o: ['版本号', 'Anchor 的账户类型鉴别码', '程序 ID 的长度', '押金的倍数'], a: 1, why: 'Anchor 在每个账户数据前放 8 字节鉴别码，用来区分账户类型并在读取时校验。' },
  { q: '攻击者传入自己的签名，想给别人的计数器加一。哪条约束会拒绝它？', o: ['<code>mut</code>', '<code>has_one = authority</code> 与 <code>seeds</code>', '<code>payer = user</code>', '<code>Program&lt;System&gt;</code>'], a: 1, why: '计数器 PDA 的种子含 authority 公钥，且 has_one 要求账户里存的 authority 等于传入的签名者，两者都会失败。' },
  { q: '为什么客户端要用 <code>findProgramAddressSync</code> 自己派生计数器地址？', o: ['因为链上查不到', '因为 PDA 由程序 ID 和种子确定，客户端可以独立算出，不需要保存映射', '因为需要私钥', '因为要付更少手续费'], a: 1, why: 'PDA 是确定性的：同样的程序 ID 和种子永远得到同一个地址，客户端和程序各自算出的结果一致。' },
  { q: '一个 6 位小数的代币，转账 2.5 枚，链上转的最小单位数量是多少？', o: ['25', '2,500', '2,500,000', '2,500,000,000'], a: 2, why: '2.5 × 10^6 = 2,500,000 最小单位。链上只有整数，小数位只用于显示。' },
  { q: '发行代币后，想保证“总量永远固定”，应该怎么做？', o: ['把 mint 地址删掉', '放弃（禁用）铸币权限', '把代币全部转到一个账户', '关闭钱包'], a: 1, why: '禁用铸币权限后，没有任何人能再铸造，总量固定且不可逆。其他做法都不能阻止有权限者继续增发。' }
])}
${exercises([
  ['给计数器增加 <code>decrement</code> 指令，要求不能减到 0 以下，并写测试。', '<p>用 <code>checked_sub(1).ok_or(CounterError::Underflow)?</code>，并新增错误枚举项。账户约束与 increment 相同（seeds、bump、has_one）。测试：初始化后连续 decrement 一次应失败，错误码是 6001（第二个自定义错误）。</p>'],
  ['如果把 <code>increment</code> 里的 <code>has_one = authority</code> 删掉，但保留 seeds，还有风险吗？', '<p>在这个设计里，seeds 里含 authority 的公钥，传入的账户必须是由该公钥派生出的 PDA；再加上 authority 必须签名，攻击者无法替别人的计数器签名。风险较小，但 has_one 是明确表达“账户里存的所有者必须匹配”的第二道防线，建议保留。如果种子里不含 authority，删掉 has_one 就会立即出现越权。</p>']
])}
${checklist([
  '在本地用 anchor test 跑通了计数器测试，并故意让一个越权测试失败。',
  '把程序部署到 devnet，并用 solana program show 看到程序账户信息。',
  '在 devnet 发行过一个 SPL Token，并向另一个钱包转账。',
  '能说出 mint、代币账户、ATA 三者的关系，以及铸币权限的风险。'
])}
${terms([
  ['Anchor', 'Anchor', 'Solana 的 Rust 开发框架，自动处理账户校验和序列化。'],
  ['IDL', 'Interface Definition Language', 'Anchor 生成的接口描述，客户端据此调用程序，作用类似 ABI。'],
  ['账户约束', 'Account constraint', '在 Accounts 结构体上声明的校验条件，如 seeds、has_one、init。'],
  ['SPL Token', 'SPL Token', 'Solana 的通用代币程序，所有代币共用。'],
  ['Mint 账户', 'Mint account', '记录代币总量、小数位、铸币权限的账户。'],
  ['代币账户', 'Token account', '记录某个持有人某种代币余额的账户。'],
  ['关联代币账户', 'Associated Token Account (ATA)', '由钱包地址、代币程序和 mint 派生出的标准代币账户地址。'],
  ['升级权限', 'Upgrade authority', '有权升级程序代码的地址；放弃后程序不可变。']
])}
` });
})();
