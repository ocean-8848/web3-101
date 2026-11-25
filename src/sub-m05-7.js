/* ---------- M06 多链生态：m05-64 Move 链 · m05-65 Cosmos 与 IBC ｜ M12 链上数据与取证：m05-66 Dune 与 SQL · m05-67 链上取证 ---------- */
(() => {
CUR = 'm05-64';
addCh({ id: 'm05-64', nav: 'Move 链', title: 'M06.9 Move 链：Sui 与 Aptos', desc: '资源不能复制也不能丢：Move 的能力系统、Sui 对象模型与 Aptos 并行执行', html: `
<h1>M06.9 Move 链：Sui 与 Aptos</h1>
${meta(['用 copy、drop、key、store 四种能力解释 Move 为什么能在语言层面防止“凭空复制资产”和“资产丢失”。', '说清 Sui 的独占对象、共享对象、不可变对象分别走哪条执行路径，以及 PTB 为什么能把多步操作合成一笔原子交易。', '对比 Aptos 的“账户下存资源 + Block-STM 并行”与 EVM、Solana 的状态模型，并在 Sui 本地网络上发布一个 Move 模块。'], '前置：<a href="#m05-1">M04.1 公链全景</a>、<a href="#m05-11">M06.6 Solana 概念</a>、<a href="#m02-1">M02.1 智能合约与 EVM</a>')}
${beginner(`<p><strong>Move</strong>：一种智能合约语言，最早由 Meta（原 Facebook）的 Diem 项目设计。现在 Sui 和 Aptos 两条公链使用它的两个方言。</p>
<p><strong>结构体（struct）</strong>：把几个字段打包成一个自定义类型，例如“一枚徽章 = 编号 + 等级”。</p>
<p><strong>能力（ability）</strong>：写在结构体类型上的标签，规定这个类型的值能不能被复制、丢弃、存进链上。</p>
<p><strong>对象（object）</strong>：Sui 上的一切状态单位。每个对象有全局唯一 ID、版本号和所有者。</p>
<p><strong>并行执行（parallel execution）</strong>：多个 CPU 核同时执行同一个区块里的多笔交易，结果必须和按顺序执行完全一样。</p>`)}

<h2>1. 一句话理解</h2>
${one('Move 把资产写成“不能复制、不能随手丢掉、只能移动”的资源类型，由编译器和字节码校验器强制执行；Sui 把状态切成一个个有主人的对象，只碰自己对象的交易不用全局排队；Aptos 把资源存在账户下面，用 Block-STM 先乐观并行、冲突再重算。')}
${call('analogy', `<p>EVM 的 ERC-20 像银行的一本总账：你的余额只是账本里的一个数字，转账就是改两个数字，写错一个加减号就可能凭空多出钱。Move 的资源像实体钞票：钞票只能从一个口袋拿到另一个口袋，不能复印，也不能扔进垃圾桶后当没发生。</p>
<p>比喻的局限：Move 只保证“钞票”这个类型不被复制或丢弃，<strong>不保证你写的数学是对的</strong>。2025 年 Cetus 被盗就发生在一段整数溢出检查里，见第 6 节。</p>`)}
${art('一图看懂：资产不能复制也不能丢，对象按所有权分路', 660, 302, [
  S.zone(10, 30, 316, 226, { t: '编译器强制：Badge has key, store' }),
  S.zone(346, 30, 304, 226, { t: 'Sui：按所有权走不同路径' }),
  S.box(24, 60, 140, 66, { k: 'risk', icon: 'cross', t: 'copy', s: '不给：防增发', mono: 1 }),
  S.box(172, 60, 140, 66, { k: 'risk', icon: 'cross', t: 'drop', s: '不给：不丢失', mono: 1 }),
  S.box(24, 136, 140, 66, { k: 'ok', icon: 'check', t: 'key', s: '链上独立对象', mono: 1 }),
  S.box(172, 136, 140, 66, { k: 'ok', icon: 'check', t: 'store', s: '可转让', mono: 1 }),
  S.text(168, 232, '没有 copy 和 drop：只能移动，不能复印或随手扔', { size: 12, anchor: 'middle', dim: 1, mw: 276 }),
  S.box(360, 60, 276, 52, { k: 'ok', icon: 'person', t: '独占对象', s: '只碰自己的：快速路径，不等全局排序' }),
  S.box(360, 120, 276, 52, { k: 'warn', icon: 'users', t: '共享对象', s: '共识排序：延迟更高，热门对象会排队' }),
  S.box(360, 180, 276, 52, { k: 'tint', icon: 'lock', t: '不可变对象', s: '任何人只读：可以同时读' }),
  S.text(330, 286, '语言层：资产不能复制也不能丢；链层：只碰自己对象的交易不用全局排队', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['key', '四个能力就是四张许可证。资产类型不给 copy 和 drop，编译器就拒绝复制和随手丢弃。'],
  ['flow', 'Sui 里带 key 的结构体就是对象，所有权类型决定交易走快速路径还是共识排序。'],
  ['risk', '热门共享对象（例如大池子）是排队点。DeFi 交易多半碰共享对象，享受不到快速路径。'],
  ['limit', '这些只保护“类型不被复制或丢弃”，不保证你写的数学是对的。Aptos 则把资源存在账户下，用 Block-STM 并行。']
], '左边是 Move 的四种能力：资产类型不给 copy 和 drop，给 key 和 store。右边是 Sui 的三种对象所有权：独占对象走快速路径，共享对象走共识排序，不可变对象任何人只读。', 'm05-64')}

<h2>2. Move 的核心：资源与四种能力</h2>
${recall('<p><a href="#m05-1">M04.1 公链全景</a> 第 3.6 节已经用一张表对比过 Aptos 与 Sui 的共识和最终性。本篇不重复共识，只讲 Move 语言和两条链的状态模型、执行模型。</p>')}
<p>在 Solidity 里，代币余额是 <code>mapping(address =&gt; uint256)</code> 里的一个整数。整数可以随意复制、相加、覆盖，安全全靠开发者写对逻辑。Move 换了一个思路：给每个类型声明它“能做什么”。没有声明的事，编译器直接拒绝。${cite('The Move Book：Abilities 介绍', 'https://move-book.com/move-basics/abilities-introduction')}</p>
${tbl(['能力', '允许做什么', '资产类型通常怎么选'], [
  ['<code>copy</code>', '值可以被复制（隐式或用 <code>copy</code> 关键字）', '<strong>不给</strong>。币和 NFT 被复制就等于增发'],
  ['<code>drop</code>', '值可以被丢弃：赋给未使用变量、离开作用域时自动销毁', '<strong>不给</strong>。没有 drop 的值必须被存起来、转走或显式拆开，不会“悄悄丢失”'],
  ['<code>key</code>', '值可以作为顶层记录存进链上全局存储。在 Sui 上，带 key 的结构体就是对象，第一个字段必须是 <code>id: UID</code>', '需要独立存在、能被查到的资产要给'],
  ['<code>store</code>', '值可以被放进其他存储在链上的结构体里', '想让它能被自由转让、放进容器时给']
])}
${code('MOVE', `
// Sui Move（2024 版）：一个“徽章”对象和一个“热土豆”凭证
module hello::badge {
    // 有 key + store：是对象，可以被任何人用 public_transfer 转让
    // 没有 copy、没有 drop：不能复制，也不能被随手丢弃
    public struct Badge has key, store {
        id: UID,
        level: u8,
    }

    // 没有任何能力的“热土豆”（hot potato）：
    // 既不能存、也不能丢，创建它的那笔交易必须在结束前把它交回给 finish()
    public struct Receipt { amount: u64 }

    public fun mint(level: u8, ctx: &mut TxContext): Badge {
        Badge { id: object::new(ctx), level }
    }

    public fun start(amount: u64): Receipt { Receipt { amount } }

    public fun finish(r: Receipt) {
        let Receipt { amount: _ } = r; // 显式拆开，才算“用掉”
    }
}
`)}
<p>“热土豆”是 Move 特有的模式：闪电贷合约把一个没有能力的凭证交给借款人，借款人在同一笔交易里不还款就拿不到 <code>finish</code> 的调用机会，凭证无法丢弃，交易无法通过校验。EVM 要靠“回调结束后检查余额”实现同样的约束（对比 <a href="#m02-11">M05.3 借贷协议深入</a> 里的闪电贷）。</p>
${call('info', '<p>Move 的检查发生在两层：编译器检查源代码；链上的<strong>字节码校验器（bytecode verifier）</strong>在发布模块时再检查一遍。所以绕过编译器、手写字节码也不能复制一个没有 copy 能力的值。</p>')}

<h2>3. Sui：一切都是对象</h2>
<p>Sui 不用“账户 → 存储槽”的结构。链上状态是一个个<strong>对象</strong>，每个对象有 ID、版本号和所有权类型。所有权类型决定交易走哪条路径：${cite('Sui 文档：Object Ownership', 'https://docs.sui.io/concepts/object-ownership')}</p>
${tbl(['所有权类型', '谁能用', '版本怎么确定', '典型场景'], [
  ['地址独占（address-owned）', '只有所有者地址签名的交易', '发送方在交易里直接写出对象版本，不等共识分配，走<strong>快速路径（fastpath）</strong>', '个人钱包里的币、NFT、游戏道具'],
  ['共享（shared）', '任何地址（再受 Move 代码约束）', '由<strong>共识</strong>排序后分配版本，延迟更高，但允许并发访问', 'AMM 池子、订单簿、计数器'],
  ['不可变（immutable）', '任何人只读', '冻结后版本不再变化，任意多笔交易可同时读', '已发布的包、配置常量'],
  ['被包装（wrapped）', '只能通过外层对象访问', '跟随外层对象', '把道具放进背包对象'],
  ['党派对象（party）', '单个地址拥有，但由共识排序', '共识', '需要排序保证的个人对象']
])}
${mm('Sui 交易按所触碰的对象分流', `
flowchart LR
  TX["用户签名的交易<br/>列出要用的对象及版本"] --> Q{"是否触碰共享对象"}
  Q -->|"否 只用自己的独占对象"| FP["快速路径<br/>无需等待全局排序"]
  Q -->|"是 例如 AMM 池子"| CS["共识排序<br/>为共享对象分配版本"]
  FP --> EX["执行 Move 代码"]
  CS --> EX
  EX --> EF["交易效果<br/>对象新版本 + 事件 + Gas"]
  EF --> CK["写入检查点"]
  class FP ok
  class CS warn
`, [
  ['flow', '交易在提交时就声明了要用哪些对象。系统据此判断能否跳过全局排序。'],
  ['key', '两笔交易只要不碰同一个对象，就互不影响，可以同时执行。这是 Sui 并行的来源，和 Solana“提前声明账户”是同一类思想。'],
  ['fail', '热门共享对象（例如一个大池子）会成为排队点：所有碰它的交易都要经过共识，并按顺序写它。'],
  ['limit', '“独占对象走快速路径”只对简单转账、个人资产操作有利。DeFi 交易大多碰共享对象，享受不到这个好处。'],
  ['risk', '同一个独占对象（尤其是 Gas 币）被两个并发程序同时使用，会造成版本冲突、交易失败。后端发交易要为每个并发任务准备单独的 Gas 币。']
])}
<h3>3.1 可编程交易块（PTB）</h3>
<p>Sui 上每一笔用户交易都是一个<strong>可编程交易块（Programmable Transaction Block，PTB）</strong>：一串命令，前一个命令的输出可以直接作为后一个命令的输入。命令类型有 <code>SplitCoins</code>、<code>MergeCoins</code>、<code>TransferObjects</code>、<code>MoveCall</code>、<code>MakeMoveVec</code>、<code>Publish</code>、<code>Upgrade</code>。整个块是原子的：一个命令失败，全部效果都不生效。PTB 不支持循环，需要循环的逻辑要写进 Move 包。${cite('Sui 文档：Programmable Transaction Blocks', 'https://docs.sui.io/concepts/transactions/prog-txn-blocks')}</p>
<p><strong>算一算（示例）</strong>：用户要“从 10 SUI 里拆出 2 SUI → 在池子里换成 USDC → 把 USDC 和一枚 NFT 一起转给朋友”。</p>
${steps([
  'EVM 的常见做法：先 approve，再 swap，再分别转 USDC 和 NFT，共 4 笔交易、4 次签名。中途任何一步失败，前面几步已经生效，用户处于“换了一半”的状态。也可以专门部署一个路由合约把它们合成一笔，但那要额外开发和审计。',
  'Sui 的做法：一个 PTB 写 3 条命令：<code>SplitCoins(gas, [2 SUI])</code> → <code>MoveCall(pool::swap, 拆出的币)</code> → <code>TransferObjects([USDC, NFT], 朋友)</code>。1 次签名、1 笔交易。',
  '结论：PTB 把“前端拼流程”变成“链上原子执行”。交易数从 4 降到 1，失败只有“全成功”或“全没发生”两种结果。'
])}

<h2>4. Aptos：资源放在账户下，Block-STM 并行</h2>
<p>Aptos 保留了“账户”的概念。带 <code>key</code> 能力的结构体是<strong>资源</strong>，存放在某个地址的全局存储下；只带 <code>store</code> 的结构体只能嵌在资源里。例如 <code>Coin</code> 存在 <code>CoinStore</code> 这个资源里。定义类型的模块控制字段，别的模块不能直接改私有字段。这和以太坊“每个合约拥有自己私有存储”的方式不同。${cite('Aptos 文档：Resources', 'https://aptos.dev/network/blockchain/resources')}</p>
${code('MOVE', `
// Aptos Move：每个用户在自己的地址下存一个计数器资源
module my_addr::counter {
    use std::signer;

    struct Counter has key { value: u64 }

    // move_to：把资源发布到签名者自己的地址下
    public entry fun init(account: &signer) {
        move_to(account, Counter { value: 0 });
    }

    // acquires 声明本函数会借用全局存储里的 Counter
    public entry fun increment(account: &signer) acquires Counter {
        let c = borrow_global_mut<Counter>(signer::address_of(account));
        c.value = c.value + 1;
    }
}
`)}
<p>Aptos 文档还指出：把每个用户的数据放在各自账户（或各自的对象地址）下，并行效果更好；所有人都写同一个全局资源，写入就会被串行化。这条设计原则和 Sui 的“热门共享对象是排队点”完全一致。</p>
<p><strong>Block-STM</strong> 是 Aptos 的并行执行引擎，基于软件事务内存（Software Transactional Memory）的思想：区块里的交易有一个预设顺序，执行器先<strong>乐观地</strong>并行执行所有交易，记录每笔读了什么、写了什么；再校验，发现某笔交易读到了“排在它前面的交易后来改掉的值”，就重新执行它。论文报告在 32 线程下，Aptos 基准测试最高约 17 万 TPS，比顺序执行快约 17 倍；高冲突负载下约 8 万 TPS。${cite('Block-STM 论文（arXiv:2203.06871）', 'https://arxiv.org/abs/2203.06871')}</p>
${steps2('Block-STM 处理一个区块的四步', [
  { t: '预设顺序', d: '区块内交易排好序 T1…Tn。最终结果必须等于按这个顺序逐笔执行的结果。' },
  { t: '乐观并行执行', d: '多线程同时执行，不加锁。每笔交易记录读集（读了哪些值、来自哪个版本）和写集。', kind: 'key' },
  { t: '校验', d: '检查每笔交易的读集：读到的值是否仍是“排在它前面的最新写入”。不是就标记失效。' },
  { t: '重新执行', d: '只重算失效的交易及受它影响的后续交易，直到全部通过校验后提交。', kind: 'warn' }
], [
  ['flow', '开发者不需要声明读写哪些数据。并行是执行器自动发现的，这一点和 Solana、Sui 的“提前声明”不同。'],
  ['fail', '冲突越多，重算越多。所有交易都写同一个热门资源时，性能退化接近顺序执行。'],
  ['key', '结果是确定的：无论有多少线程，所有验证者对同一区块算出相同的状态。']
])}
<p><strong>算一算（示例）</strong>：一个区块有 8 笔转账，4 个线程。只有 T3 和 T6 都改账户 X 的余额。</p>
${steps([
  '第一轮：8 笔并行执行，按 4 线程算约需 2 个“时间片”。',
  '校验：T6 读到的 X 余额是 T3 写入之前的旧值，T6 失效；其他 7 笔通过。',
  '第二轮：只重算 T6，1 个时间片。总执行次数 9 次，总耗时约 3 个时间片。',
  '对比顺序执行：8 个时间片。加速约 8 / 3 ≈ 2.7 倍。冲突对越多，这个倍数越低。'
])}

<h2>5. 四种状态模型对比</h2>
${recall('<p>Solana 的“程序无状态、数据放账户、交易先声明账户”在 <a href="#m05-11">M06.6 Solana 概念</a> 讲过，这里只把它放进对比。</p>')}
${compare('EVM、Solana、Sui、Aptos：状态放在哪里、并行从哪来', [
  { name: 'EVM', tag: '合约私有存储', kind: 'info', points: ['余额是合约 mapping 里的整数', '交易不声明读写集合', '主流实现顺序执行', '资产安全靠开发者逻辑'] },
  { name: 'Solana', tag: '账户 + 无状态程序', points: ['数据放在独立账户里', '交易提前声明要读写的账户', '运行时按账户冲突并行调度', '账户校验是安全第一课'] },
  { name: 'Sui', tag: '对象模型', kind: 'key', points: ['状态是带 ID 与所有者的对象', '交易列出对象及版本', '独占对象走快速路径，共享对象走共识', '资产是没有 copy/drop 的 Move 类型'] },
  { name: 'Aptos', tag: '账户下的资源', kind: 'key', points: ['资源存放在地址的全局存储下', '交易不需要声明读写集合', 'Block-STM 乐观并行、冲突重算', '同样使用 Move 能力系统'] }
], [
  ['flow', '从左到右看“谁负责发现并行”：EVM 不并行，Solana 和 Sui 靠交易声明，Aptos 靠执行器自动检测。'],
  ['key', '三条高性能链殊途同归：把状态切细，避免所有交易都写同一块数据。'],
  ['limit', '这张对比只讲状态与执行模型。共识、费用和生态的差异见 M04.1。'],
  ['risk', '从 EVM 迁移来的团队最常犯的错：把所有用户数据放进一个全局共享对象或全局资源，结果失去并行能力。']
])}
${tbl(['对照点', 'Sui Move', 'Aptos Move'], [
  ['全局存储操作', '没有 <code>move_to</code> / <code>borrow_global</code>；对象通过 <code>transfer::transfer</code>、<code>share_object</code>、<code>freeze_object</code> 改变所有权', '用 <code>move_to</code>、<code>borrow_global</code>、<code>borrow_global_mut</code>、<code>move_from</code> 操作地址下的资源'],
  ['入口函数', '交易通过 PTB 调用 public 函数', '交易调用 <code>entry</code> 函数'],
  ['资产标准', '<code>Coin&lt;T&gt;</code> 是对象', '早期 Coin 标准；新资产多用 Fungible Asset 与 Object'],
  ['CLI', '<code>sui move</code>、<code>sui client</code>', '<code>aptos move</code>']
])}

<h2>6. 安全：语言保护什么，不保护什么</h2>
<p>Move 的能力系统消灭了一类 bug：复制资产、丢失资产、伪造别的模块的类型。它<strong>不能</strong>消灭以下几类：</p>
${steps([
  '<strong>算术与精度错误</strong>：溢出检查写错、取整方向错，Move 照样执行。',
  '<strong>访问控制错误</strong>：本该只有管理员能调用的函数写成了 public。Sui 常用“能力对象”（例如 <code>AdminCap</code>）做权限：谁持有这个对象，谁就能调用。忘记要求传入 AdminCap，等于把管理员权限公开。',
  '<strong>共享对象的业务逻辑错误</strong>：池子、金库是共享对象，任何人都能在交易里引用它们，逻辑必须自己防御。',
  '<strong>升级权限</strong>：Sui 发布包时会返回一个 <code>UpgradeCap</code>。谁持有它，谁就能升级这个包。'
])}
${cases([
  ['Cetus：整数溢出检查写错，约 2.23 亿美元被盗', '2025-05-22', '<p>Cetus 是 Sui 上最大的集中流动性 DEX 之一。攻击者利用开源数学库 inter_mate 中 <code>checked_shlw</code> 函数的溢出检查错误：它按 256 位上限校验，而本该按 192 位校验。攻击者用极少的代币换到了巨额流动性份额，约 30 分钟内抽走约 2.23 亿美元，其中约 6,000 万美元换成 USDC 后跨到以太坊。</p><p>事后 Sui 验证者投票拒绝处理攻击者地址的交易，投票超过总质押的 33% 后，约 1.62 亿美元被“冻结”在 Sui 上；之后社区治理投票通过，把这部分资金转回。这次冻结也引发了“验证者能否审查交易”的中心化争议。</p><p>启示：Move 的资源安全不覆盖数学库；依赖的第三方库同样要审计。验证者层面的冻结是一次性的社会共识行为，不是协议保证。资金追踪与冻结的一般方法见 <a href="#m05-67">M12.5 链上取证与资金追踪</a>。</p>', [['The Block：Cetus 称开源库缺陷导致 2.23 亿美元被盗', 'https://www.theblock.co/post/355795/sui-dex-cetus-open-source-library-flaw-smart-contract-223-million-usd-exploit'], ['The Block：Sui 社区投票通过追回被冻结资金', 'https://www.theblock.co/post/356347/sui-community-passes-governance-vote-to-recover-stolen-cetus-funds-blocked-by-validators-in-223m-heist']]]
], 'h3')}

<h2>7. 动手：在 Sui 本地网络发布第一个模块</h2>
${tryit(`<p><strong>目标：</strong>写一个共享计数器，发布到本地网络（localnet），再用 PTB 调用它。需要先按 Sui 官方文档安装 <code>sui</code> CLI。${cite('Sui 文档：本地网络', 'https://docs.sui.io/guides/developer/getting-started/local-network')}</p>
${code('BASH', `
# 1) 启动带水龙头的本地网络（另开一个终端运行；--force-regenesis 每次都从新创世开始）
RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis

# 2) 配置并切换到本地环境，领测试币
sui client new-env --alias local --rpc http://127.0.0.1:9000
sui client switch --env local
sui client faucet
sui client gas            # 约 1 分钟后应看到若干个 Gas 币对象

# 3) 新建 Move 包
sui move new hello
cd hello
`)}
<p>把 <code>sources/hello.move</code> 换成下面的代码：</p>
${code('MOVE', `
module hello::counter {
    // 共享对象：任何人都能 increment
    public struct Counter has key {
        id: UID,
        owner: address,
        value: u64,
    }

    public fun create(ctx: &mut TxContext) {
        let c = Counter { id: object::new(ctx), owner: ctx.sender(), value: 0 };
        transfer::share_object(c); // 交出所有权，变成共享对象
    }

    public fun increment(c: &mut Counter) {
        c.value = c.value + 1;
    }
}
`)}
${code('BASH', `
# 4) 编译、测试、发布
sui move build
sui move test
sui client publish          # 旧版 CLI 需要加 --gas-budget 100000000
# 输出的 Object Changes 里记下 Published 的 PackageID，以及 UpgradeCap 对象

# 5) 调用：创建计数器，再用 PTB 加一
export PKG=0x你的包ID
sui client call --package $PKG --module counter --function create
# 输出里找到类型为 ...::counter::Counter 的共享对象 ID
export CTR=0x计数器对象ID
sui client ptb --move-call $PKG::counter::increment @$CTR
sui client object $CTR      # 查看 value 字段变成 1，version 增加
`)}
<p>预期结果：<code>sui client object</code> 显示 Owner 为 Shared，<code>value</code> 为 1。再练一步：把 <code>share_object</code> 改成 <code>transfer::transfer(c, ctx.sender())</code>，重新发布，观察 Owner 变成你的地址，以及别的地址无法再调用 increment。也可以在 devnet / testnet 上做同样的步骤，只需切换环境并从官方水龙头领币。</p>`)}
${call('warn', '<p>发布后返回的 <code>UpgradeCap</code> 是这个包的升级权限。生产环境要把它转给多签或时间锁，或者调用 <code>make_immutable</code> 让包永远不可升级。把 UpgradeCap 留在一个热钱包里，等于把所有用户资金的控制权交给这把私钥。</p>')}

${mistakes([
  ['Move 写的合约不会被黑。', 'Move 只防止复制、丢弃、伪造资源。算术、权限、业务逻辑错误照样会丢钱，Cetus 就是数学库溢出检查写错。'],
  ['Sui 所有交易都走快速路径，所以 DeFi 也一样快。', '只有只碰独占对象的交易走快速路径。AMM 池子、订单簿是共享对象，要经过共识排序。'],
  ['Aptos 和 Sui 用同一种 Move，代码可以直接搬。', '两者是不同方言：Aptos 用 move_to 与 borrow_global 操作账户下的资源，Sui 用对象和 transfer 模块，没有全局存储操作。'],
  ['Block-STM 需要开发者声明读写集合。', 'Block-STM 自动检测冲突：先乐观并行，再校验并重算失效交易。需要提前声明的是 Solana 和 Sui。'],
  ['把所有用户数据放进一个全局对象最简单，也没坏处。', '一个热门共享对象或全局资源会把所有写交易串行化，失去并行能力。用户数据应放在各自的对象或地址下。']
])}
${recap([
  'Move 用 copy、drop、key、store 四种能力约束类型；资产类型不给 copy 和 drop，所以不能被复制或悄悄丢失。',
  '没有任何能力的“热土豆”结构体能强制同一笔交易内完成某个流程，例如闪电贷还款。',
  'Sui 的状态是对象：独占对象走快速路径，共享对象经共识排序，不可变对象可任意并发读。',
  'PTB 把多条命令合成一笔原子交易，前一条命令的输出可直接作为下一条的输入。',
  'Aptos 把资源存在地址下，Block-STM 乐观并行、冲突重算；结果与按预设顺序执行一致。',
  '语言安全不等于协议安全：数学库、权限对象、UpgradeCap 都要单独审查。'
])}
${quiz([
  { q: '一个代表“代币”的 Move 结构体，最不应该拥有哪种能力？', o: ['key', 'store', 'copy', '以上都应该有'], a: 2, why: '有 copy 就能复制值，等于凭空增发。key 和 store 让它能存进链上、能被嵌套或转让，是资产常用的能力。' },
  { q: 'Sui 上 Alice 把自己钱包里的一枚 NFT 转给 Bob。这笔交易通常走哪条路径？', o: ['必须等全局共识排序', '快速路径：只碰 Alice 的独占对象', '必须先把 NFT 变成共享对象', '由 Bob 签名确认后才能执行'], a: 1, why: '只涉及发送方独占对象的交易，发送方直接写出对象版本，不需要共识分配版本。共享对象才需要共识。' },
  { q: '关于 Block-STM，哪项说法正确？', o: ['交易必须提前声明读写的账户', '所有交易加锁后顺序执行', '先乐观并行执行，校验发现读到过期值的交易再重算', '不同线程数会得到不同的状态'], a: 2, why: 'Block-STM 不要求声明读写集合，它记录读写、校验并重算失效交易，结果确定，与线程数无关。提前声明是 Solana 和 Sui 的做法。' },
  { q: 'Sui 的一个 PTB 里第 3 条命令失败了，会怎样？', o: ['前 2 条命令的效果保留', '整个 PTB 的效果都不生效', '只有失败的命令被跳过', '由验证者投票决定'], a: 1, why: 'PTB 是原子的：任何一条命令失败，整笔交易的效果都不生效（Gas 照常扣除）。' },
  { q: 'Cetus 2025 年事件给 Move 开发者最重要的启示是？', o: ['Move 的资源模型有漏洞', '应该改用 Solidity', '验证者一定会冻结被盗资金', '语言保证不覆盖数学库和业务逻辑，依赖库同样要审计'], a: 3, why: '漏洞在开源数学库的溢出检查，不在 Move 的资源规则。验证者冻结是一次性社会共识行为，不是协议保证。' }
])}
${exercises([
  ['你要在 Sui 上做一个“每个用户一份积分”的应用。方案 A：一个共享对象里放 <code>Table&lt;address, u64&gt;</code>；方案 B：给每个用户发一个独占的 Points 对象。比较两者的并发性能和权限风险。', '<p>方案 A 所有加分交易都写同一个共享对象，必须经共识排序且互相冲突，高峰期会排队；好处是管理员可以集中查询、统一修改。方案 B 每个用户的交易只碰自己的对象，可以走快速路径、互不冲突；但“加分”必须由有权限的一方完成，通常让用户在 PTB 里同时传入自己的 Points 对象和一个证明（例如管理员签发的凭证或活动的共享对象），防止用户自己给自己加分。积分要不要 store 能力也要想清：给了 store 就能被自由转让。</p>'],
  ['写出一个 Move 闪电贷的类型设计，说明它怎样保证借款人必须在同一笔交易里还款。', '<p>定义 <code>public struct FlashReceipt { amount: u64 }</code>，不给任何能力。<code>borrow</code> 返回借出的 <code>Coin</code> 和一个 FlashReceipt；<code>repay(receipt, coin)</code> 检查 coin 的金额 ≥ amount + 手续费，然后拆开 receipt。因为 receipt 不能存、不能丢、不能复制，交易结束时它若还存在，字节码校验就不通过，整笔交易失败。所以借款人只能在同一个 PTB 里调用 repay。</p>'],
  ['（算一算）Block-STM 区块里有 100 笔交易，其中 20 笔都给同一个热门资源加 1，其余 80 笔互不冲突。估算最坏情况下需要的执行次数，并解释为什么热门资源会拖慢并行。', '<p>80 笔无冲突交易各执行 1 次。20 笔冲突交易如果全部在第一轮并行执行，校验后只有排在最前面的一笔有效，其余 19 笔要重算；最坏情况下每轮只多确认一笔，总执行次数约 20 + 19 + … + 1 = 210 次，加上 80 次共约 290 次，而顺序执行只需 100 次。实际实现会通过依赖估计减少无效重算，但热门资源仍然迫使这 20 笔交易基本按顺序完成。这就是“把用户数据拆开存”的原因。</p>']
])}
${checklist([
  '能说出 copy、drop、key、store 各允许什么，并为一个资产类型选对能力。',
  '能解释 Sui 独占对象、共享对象、不可变对象分别走哪条路径。',
  '能用一个 PTB 把拆币、调用、转账合成一笔交易，并说明它的原子性。',
  '能画出 Block-STM 的四步，并解释冲突为什么会降低加速比。',
  '能在 Sui localnet 上完成 move new、build、test、publish、call 全流程。',
  '能说出发布后 UpgradeCap 的风险和三种处理方式。'
])}
${terms([
  ['Move 语言', 'Move', '以资源为核心、由字节码校验器强制类型规则的智能合约语言，用于 Sui 和 Aptos。'],
  ['能力', 'Ability', '写在 Move 类型上的标签，包括 copy、drop、key、store，决定值能否复制、丢弃、存储。'],
  ['资源', 'Resource', '不能复制、不能隐式丢弃、只能移动的值；在 Aptos 上特指存放在地址下、带 key 的结构体。'],
  ['热土豆模式', 'Hot potato', '没有任何能力的结构体，强制调用方在同一笔交易内把它交给指定函数处理。'],
  ['独占对象', 'Address-owned object', 'Sui 上由单个地址拥有的对象，交易可走不经全局排序的快速路径。'],
  ['共享对象', 'Shared object', 'Sui 上任何地址都能在交易中使用的对象，版本由共识分配。'],
  ['可编程交易块', 'Programmable Transaction Block (PTB)', 'Sui 的交易格式：一串可传递结果的命令，整体原子执行。'],
  ['Block-STM', 'Block-STM', 'Aptos 的并行执行引擎：按预设顺序乐观并行执行，校验后重算冲突交易。'],
  ['升级权限对象', 'UpgradeCap', 'Sui 发布包时返回的对象，持有者可以升级该包。']
])}
` });

CUR = 'm05-65';
addCh({ id: 'm05-65', nav: 'Cosmos 与 IBC', title: 'M06.10 Cosmos SDK 与 IBC', desc: '应用链怎么搭、IBC 怎样用轻客户端跨链，以及它和普通跨链桥的信任差别', html: `
<h1>M06.10 Cosmos SDK 与 IBC</h1>
${meta(['说清“应用链”的取舍：为什么 dYdX 这类项目要自己做一条链，代价是什么。', '画出 CometBFT、ABCI、Cosmos SDK 模块三层结构，并说出常用模块的职责。', '按“发送 → 中继 → 证明 → 确认或超时”的顺序讲清 IBC 一个数据包的生命周期，解释 ICS-20 的托管、铸造和 ibc/ 前缀代币。'], '前置：<a href="#m01-3">M01.3 共识机制</a>、<a href="#m05-1">M04.1 公链全景</a>')}
${beginner(`<p><strong>应用链（app-chain）</strong>：只为一个应用服务的区块链。规则、手续费、出块参数都按这个应用定制。</p>
<p><strong>轻客户端（light client）</strong>：不下载完整区块、只跟踪区块头和验证者签名，就能验证“某条数据确实在那条链上”的程序。</p>
<p><strong>中继者（relayer）</strong>：链下运行的程序，把一条链上的数据包和证明搬到另一条链上。</p>
<p><strong>默克尔证明（Merkle proof）</strong>：证明某个键值存在（或不存在）于某个状态根之下的一串哈希。原理见 <a href="#m01-2">M01.2 默克尔树与轻节点</a>。</p>
<p><strong>托管（escrow）</strong>：代币被锁在一个模块账户里，不能被普通转账动用。</p>`)}

<h2>1. 一句话理解</h2>
${one('Cosmos 的思路是“每个应用一条链”：用 CometBFT 做共识、Cosmos SDK 拼业务模块；链和链之间用 IBC 通信，每条链在自己的状态里运行对方的轻客户端，自己验证对方的默克尔证明，中继者只负责搬运，不需要被信任。')}
${call('analogy', `<p>以太坊像一座大商场，所有店铺共用一套保安、电梯和收银规则。Cosmos 像一片独立小镇：每个店铺自己建楼、自己雇保安、自己定营业时间。小镇之间的快递（IBC）有个特点：收件方自己核对寄件方的公章（轻客户端验证），快递员（中继者）只能送、不能改，改了公章就对不上。</p>
<p>比喻的局限：自己雇保安很贵，保安少的小镇容易被攻破。应用链的安全取决于它自己的验证者和质押价值，这正是“链间安全”要解决的问题。</p>`)}
${art('一图看懂：每条链自己验证对方，中继者只负责搬运', 660, 282, [
  S.zone(10, 32, 230, 174, { t: 'Cosmos Hub（源链）' }),
  S.zone(420, 32, 230, 174, { t: 'Osmosis（目标链）' }),
  S.box(24, 62, 202, 52, { k: 'tint', icon: 'lock', t: '托管 1 ATOM', s: 'transfer 模块账户' }),
  S.box(24, 138, 202, 52, { k: 'info', icon: 'shield', t: 'Osmosis 轻客户端', s: '验证对方区块头' }),
  S.box(434, 62, 202, 52, { k: 'ok', icon: 'coin', t: '铸造凭证币', s: 'ibc/27394F…' }),
  S.box(434, 138, 202, 52, { k: 'key', icon: 'shield', t: 'Hub 轻客户端', s: '验默克尔证明，才铸币' }),
  S.box(253, 62, 154, 52, { k: 'idle', dash: 1, icon: 'bot', t: '中继者', s: '只搬运不被信任' }),
  S.arrow(226, 88, 251, 88),
  S.arrow(409, 88, 434, 88),
  S.arrow(535, 138, 535, 116, { k: 'key' }),
  S.text(330, 152, '改了证明\n对方验不过', { size: 11.5, anchor: 'middle', dim: 1, mw: 120 }),
  S.text(330, 238, '多签桥信任 M 个签名者；IBC 只信任对方链本身。\n示例：1 ATOM 经 channel-0 到 Osmosis，哈希取自第 5 节', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '源链托管代币并发出数据包，中继者搬运数据包和证明，目标链验证后铸造凭证币。'],
  ['key', '验证发生在目标链自己的状态里：它运行着对方的轻客户端，自己核对默克尔证明。'],
  ['risk', '对方链若有超过 2/3 质押合谋，能签出虚假区块头，IBC 看不出来。'],
  ['limit', '同一个币走不同路径，ibc/ 哈希就不同，不能 1:1 互换，只能沿原路径退回。']
], '左边源链 Cosmos Hub 托管一枚 ATOM 并运行 Osmosis 的轻客户端。中间的中继者只搬运数据包和证明。右边目标链 Osmosis 运行 Hub 的轻客户端，验证证明后铸造以 ibc 开头的凭证币。', 'm05-65')}

<h2>2. 应用链论点：为什么自己做一条链</h2>
${recall('<p>Tendermint（现名 CometBFT）的“提议 → 预投票 → 预提交”两阶段投票和即时最终性，在 <a href="#m01-3">M01.3 共识机制</a> 第 5 节讲过。本篇直接使用这个结论：一个区块被提交后就不会回滚，超过 1/3 验证者故障时链会停而不会分叉。</p>')}
${compare('部署在通用链上 vs 做一条应用链', [
  { name: '通用链上的合约', tag: '以太坊 L1 / L2', kind: 'info', points: ['直接继承底层链的安全', '和其他协议同链组合，流动性集中', '与所有应用争抢区块空间，Gas 由市场决定', '不能改共识、手续费、出块规则'] },
  { name: '应用链', tag: 'Cosmos SDK 链', kind: 'key', points: ['可定制：手续费代币、出块时间、交易排序、内存撮合', '区块空间独享，不受别的应用拥堵影响', '必须自己招募验证者、自己承担安全', '流动性和用户要通过跨链引入'] }
], [
  ['key', '应用链用“主权”换“安全与流动性”。业务对吞吐、排序或费用模型有特殊要求时，这个交换才划算。'],
  ['risk', '小市值应用链的质押总价值低，攻击者买下超过 1/3 或 2/3 的质押权就能停链或作恶。'],
  ['limit', 'L2 也在提供“专属区块空间”（见 M04.4），所以今天选应用链的理由更多是定制共识层或执行层。']
])}
<p>典型例子是 dYdX v4：它把永续合约交易所做成一条独立的 Cosmos SDK 链，验证者在内存里维护订单簿（不提交到共识），只把撮合结果写进区块提议。这种“链下订单簿 + 链上结算”的设计在通用智能合约链上很难实现。${cite('dYdX 文档：架构概览', 'https://docs.dydx.xyz/concepts/architecture/overview')} 永续合约机制本身见 <a href="#m08-7">M11.7 永续合约入门</a>。</p>

<h2>3. 技术栈：CometBFT + ABCI + Cosmos SDK</h2>
${layers('一条 Cosmos SDK 链的三层', [
  { name: '应用层：Cosmos SDK 模块', sub: '业务状态机', chips: ['x/auth 账户与签名', 'x/bank 转账', 'x/staking 质押', 'x/slashing 罚没', 'x/gov 治理', 'x/upgrade 升级', 'ibc 跨链'], kind: 'key' },
  { name: 'ABCI 接口', sub: '共识与应用之间的标准接口', chips: ['检查交易', '提议与处理区块', '执行交易', '提交状态'] },
  { name: '共识与网络层：CometBFT', sub: 'BFT 状态机复制', chips: ['P2P 广播', '内存池', '提议与投票', '即时最终性'] }
], [
  ['flow', 'CometBFT 只管“所有节点对交易顺序达成一致”，不懂交易内容；交易内容由上层应用通过 ABCI 执行。'],
  ['key', '这种分层让开发者只写业务模块，不用自己实现共识。CometBFT 官方把自己定义为对任意确定性状态机做拜占庭容错复制的平台。' + cite('CometBFT 文档', 'https://docs.cosmos.network/cometbft')],
  ['fail', '应用层必须完全确定：用了浮点数、本地时间、遍历无序 map，不同节点算出不同状态根，链会停。'],
  ['risk', '模块之间通过 keeper 互相调用。给某个模块错误授予铸币或转账权限，是 Cosmos 链常见的高危漏洞。']
], ['ABCI 调用', '共识确认后执行'])}
<p>Cosmos SDK 自称是“构建应用专用区块链的开源框架”。${cite('Cosmos SDK 文档：概览', 'https://docs.cosmos.network/sdk/next/learn/intro/overview')} 开发者用 Go 写模块，每个模块包含：消息类型（Msg，用户发起的操作）、keeper（读写本模块状态的对象）、查询服务、创世状态。一笔交易里可以包含多条 Msg，按顺序执行，任何一条失败则整笔回滚。</p>
${tbl(['模块', '职责', '和以太坊的对应物'], [
  ['<code>x/auth</code>', '账户、序号（nonce）、签名校验、手续费扣除', '协议层的 EOA 与 nonce'],
  ['<code>x/bank</code>', '多币种余额与转账，原生支持任意 denom', '没有直接对应；ERC-20 需要每个代币一个合约'],
  ['<code>x/staking</code> / <code>x/slashing</code> / <code>x/distribution</code>', '委托、验证者集合、作恶罚没、奖励分配', '信标链的质押与罚没（见 M04.3）'],
  ['<code>x/gov</code> / <code>x/upgrade</code>', '链上提案、投票；按提案在指定高度升级', '以太坊靠社区协调硬分叉，没有链上治理'],
  ['<code>ibc</code>（ibc-go）', '轻客户端、连接、通道、数据包；ICS-20 转账应用', '没有原生对应；靠第三方桥']
])}

<h2>4. IBC：两条链互相运行对方的轻客户端</h2>
<p><strong>IBC（Inter-Blockchain Communication）</strong>分两层：下层是<strong>传输层</strong>，负责“证明一个数据包确实在对方链上被提交了”；上层是<strong>应用层</strong>，例如 ICS-20 代币转账、跨链账户。传输层的关键对象：</p>
${steps([
  '<strong>客户端（client）</strong>：链 B 上运行的“链 A 轻客户端”，保存链 A 的验证者集合和已验证的区块头（含状态根）。',
  '<strong>连接（connection）与通道（channel）</strong>：经典 IBC 通过握手在两个客户端之上建立连接，再在连接上为某个应用建立通道（如 <code>transfer</code> 端口的 <code>channel-0</code>）。',
  '<strong>数据包（packet）</strong>：包含序号、源与目标标识、超时时间和应用数据。源链只在状态里写一个“承诺”（数据包内容的哈希）。',
  '<strong>中继者</strong>：读取源链上的承诺和默克尔证明，提交给目标链。目标链用自己保存的源链客户端校验证明。'
])}
<p>官方文档强调：中继者只影响<strong>活性</strong>（包裹会不会被送到），不影响<strong>安全</strong>；它改动包内任何内容，证明就对不上。双方都不信任中继者，也不直接相信对方的说法。${cite('IBC 文档：How IBC works', 'https://ibcprotocol.dev/docs/ibc/02-how-ibc-works/01-overview')}</p>
${mm('一个 IBC 数据包的生命周期', `
sequenceDiagram
  participant A as 链 A 源链
  participant R as 中继者
  participant B as 链 B 目标链
  A->>A: 用户发送 MsgTransfer 写入数据包承诺 序号 42
  R->>A: 读取承诺和默克尔证明
  R->>B: 先更新链 B 上的 A 轻客户端 提交新区块头
  R->>B: MsgRecvPacket 数据包加证明
  B->>B: 用 A 的状态根验证证明 执行应用逻辑 写入回执和确认
  R->>B: 读取确认和证明
  R->>A: MsgAcknowledgement
  A->>A: 验证后删除承诺 成功则结束 失败则退款
  Note over A,B: 若超时前未送达 中继者在 A 上提交 MsgTimeout 并证明 B 上没有回执 A 退款
`, [
  ['flow', '每一步都是“提交数据 + 证明”，接收方用自己保存的对方轻客户端校验。没有任何一方签名“担保”。'],
  ['key', '一个数据包只有两种结局：被送达（随后确认）或超时（随后退款）。送达的包不会再超时，超时的包也不会再被送达。'],
  ['fail', '中继者全部停工时，包裹不会丢，但会一直停在半路，直到超时退款。这是活性问题，不是资金安全问题。'],
  ['risk', '安全的前提是轻客户端和证明校验代码没有漏洞，并且源链共识本身诚实（超过 2/3 质押诚实）。'],
  ['limit', '轻客户端要求对方链有快速、确定的最终性。概率最终性的链（如比特币）不能直接接入经典 IBC。']
])}
${call('info', `<p><strong>经典 IBC 与 IBC v2</strong>：ibc-go v10 起增加了 IBC v2 的转账栈，链需要单独接入。${cite('ibc-go 迁移指南：v8.1 到 v10', 'https://ibcprotocol.dev/docs/ibc-go/latest/migrations/v8_1-to-v10')} 新版文档把连接描述为“一对互相镜像的客户端”，数据包直接写明源与目标客户端标识，省去了经典 IBC 的连接、通道握手，目标之一是更容易接入以太坊等非 Cosmos 链。本篇以经典 IBC 讲解，因为目前大部分通道仍是它。</p>`)}
<p><strong>算一算（示例）</strong>：轻客户端为什么会“过期”。</p>
${steps([
  '轻客户端信任一组验证者，是因为它们质押着资金，作恶会被罚没。但验证者解绑后就不怕罚没了。',
  '所以轻客户端设置<strong>信任期（trusting period）</strong>，必须短于对方链的解绑期。假设对方链解绑期 21 天，常见配置是取约 2/3，即 14 天 ' + tag('惯例') + '。',
  '如果 14 天内没有任何中继者提交新的区块头，客户端过期，通道上的转账全部卡住。恢复需要链上治理提案替换客户端。',
  '工程结论：运营方要监控“客户端最后更新时间”，在例如第 7 天还没更新时告警（阈值为示例），并准备备用中继者。'
])}

<h2>5. ICS-20：跨链转账的托管与铸造</h2>
<p>ICS-20 是 IBC 上的同质化代币转账标准。数据包里有 5 个字段：<code>denom</code>、<code>amount</code>、<code>sender</code>、<code>receiver</code>、<code>memo</code>，用 JSON 编码。资产的处理分两种情况：${cite('ICS-20 规范', 'https://github.com/cosmos/ibc/blob/main/spec/app/ics-020-fungible-token-transfer/README.md')}</p>
${tbl(['情况', '判断方式', '发送链做什么', '接收链做什么'], [
  ['源区（代币第一次离开原生链）', 'denom 不带“本端口/本通道”前缀', '把代币<strong>托管</strong>在 transfer 模块账户', '<strong>铸造</strong>凭证代币，denom 加上前缀 <code>transfer/channel-x/</code>'],
  ['汇区（凭证代币回家）', 'denom 带有本端口/本通道前缀', '<strong>销毁</strong>凭证代币', '去掉最后一段前缀，<strong>释放</strong>托管的原生代币'],
  ['超时或错误确认', '—', '源区退回托管的代币；汇区重新铸造凭证还给发送者', '不做任何事']
])}
<p>凭证代币在链上显示为 <code>ibc/</code> 加一串十六进制哈希。哈希的输入就是完整路径。<strong>算一算</strong>：ATOM 从 Cosmos Hub 经过 Osmosis 一侧的 <code>channel-0</code> 到达 Osmosis，路径是 <code>transfer/channel-0/uatom</code>。</p>
${code('BASH', `
echo -n "transfer/channel-0/uatom" | shasum -a 256
# 27394fb092d2eccd56123c74f36e4c1f926001ceada9ca97ea622b25f41e5eb2
# 转成大写，加 ibc/ 前缀，就是 Osmosis 上 ATOM 的 denom：
# ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2
`)}
${call('warn', '<p><strong>同一个币，不同路径就是不同的币。</strong>ATOM 经过 Osmosis 再到链 C，和直接从 Hub 到链 C，得到的是两个不同的 <code>ibc/</code> 哈希，不能 1:1 互换，也只能沿原路径退回。交易所和钱包做充值时，必须按完整的 denom（而不是代币符号）判断资产，否则会把假冒或路径不同的凭证当成真 ATOM 入账。</p>')}
${code('BASH', `
# 用 gaiad 从 Cosmos Hub 发起一次 ICS-20 转账（通道号为示例，以浏览器或 chain-registry 为准）
gaiad tx ibc-transfer transfer transfer channel-141 osmo1接收地址 1000000uatom \\
  --from mykey --chain-id cosmoshub-4 --gas auto --fees 5000uatom

# 本地用 Hermes 中继者在两条测试链之间建立 transfer 通道
hermes create channel --a-chain ibc-0 --b-chain ibc-1 \\
  --a-port transfer --b-port transfer --new-client-connection
`)}

<h2>6. IBC 与普通跨链桥：信任从哪里来</h2>
${recall('<p>跨链桥的四种验证模型（外部多签、乐观、轻客户端、ZK）和 Ronin、Wormhole、Nomad 三起事故，在 <a href="#m05-8">M06.12 跨链桥</a> 里详细讲过。IBC 是其中“轻客户端验证”的代表，本节只比较它和多签桥的信任差别。</p>')}
${compare('多签桥 vs IBC：谁说了算', [
  { name: '多签 / MPC 桥', tag: '外部验证', kind: 'risk', points: ['M of N 个签名者证明“链 A 发生了某事件”', '安全 = 签名者多数诚实且私钥安全', '拿到 M 把私钥即可伪造任意提款', '接入任何链都容易，速度快'] },
  { name: 'IBC', tag: '轻客户端验证', kind: 'key', points: ['链 B 自己验证链 A 的区块头和默克尔证明', '安全 = 链 A 共识诚实 + 验证代码无漏洞', '中继者作恶只能拖延，不能伪造', '要求对方链有确定最终性，接入异构链成本高'] }
], [
  ['key', 'IBC 没有额外的信任方，信任最小化到“对方链本身”。所以它常被当作“信任最小化跨链”的样板。'],
  ['risk', '对方链的验证者若有超过 2/3 质押合谋，可以签出虚假区块头，IBC 无法识别。连接到一条小市值链，就继承了它的弱点。'],
  ['fail', '证明校验代码本身也会出错，见下面两起案例。'],
  ['limit', '跨不同类型的链时，要在目标链上验证源链的签名算法和证明格式，Gas 与开发成本都高。']
])}
${cases([
  ['Dragonberry：ICS-23 证明库漏洞（未造成损失）', '2022-10', '<p>Cosmos 团队在审计 IBC 时发现，IBC 使用的默克尔证明库 ICS-23 可以被构造出虚假的“不存在证明”，在某些链的实现中可升级为 ICS-20 转账双花：让协议同时认为一笔转账成功又失败。团队私下协调各链验证者升级，补丁随 Cosmos SDK v0.45.9 发布，没有资金损失。</p><p>启示：轻客户端模型的安全上限，是证明校验代码的正确性。</p>', [['Cosmos 论坛：Dragonberry 与 Elderflower 漏洞复盘', 'https://forum.cosmos.network/t/cosmos-sdk-ibc-vulnerability-retrospective-security-advisories-dragonberry-and-elderflower-october-2022/8735'], ['Cosmos 论坛：IBC 安全公告 Dragonberry', 'https://forum.cosmos.network/t/ibc-security-advisory-dragonberry/7702']]],
  ['BNB Chain Token Hub：伪造 IAVL 证明铸出 200 万 BNB', '2022-10-06', '<p>BNB Beacon Chain 与 BNB Smart Chain 之间的跨链合约用 IAVL 默克尔证明（Cosmos 系常用的树结构）校验跨链消息。攻击者利用证明校验的缺陷，伪造证明，两次各铸造 100 万 BNB。BNB Chain 随后协调验证者暂停链并升级，实际被转出的资金远少于铸造量。</p><p>启示：“用证明代替签名”不等于自动安全；证明格式的每个字段都要严格校验。</p>', [['Immunefi：Binance Bridge 攻击分析', 'https://immunefi.com/blog/bug-fix-reviews/hack-analysis-binance-bridge-october-2022/'], ['SlowMist：BNB 跨链桥攻击分析', 'https://slowmist.medium.com/slowmist-an-analysis-of-the-attack-on-bnb-cross-chain-bridge-f7411f33bb2']]]
], 'h3')}

<h2>7. 共享安全：链间安全与网状安全（简述）</h2>
<p>应用链最大的短板是“自己的安全自己买”。Cosmos 生态有两条补救思路：</p>
${tbl(['方案', '做法', '代价'], [
  ['链间安全（Interchain Security，ICS）', '提供者链（如 Cosmos Hub）的验证者同时为消费者链出块；消费者链上作恶的证据通过 IBC 传回提供者链执行罚没。后来的“部分集合安全”（Partial Set Security）允许验证者自愿选择是否加入某条消费者链' + cite('Interchain Security 文档', 'https://cosmos.github.io/interchain-security/'), '消费者链要向提供者链的验证者付费；主权降低；验证者运维负担增加'],
  ['网状安全（Mesh Security）' + tag('待核实'), '设想多条链互相用质押代币为对方提供安全，而不是单向“大链保小链”', '设计更复杂，截至本文资料仍以提案和实验为主，生产使用情况请以项目官方资料为准']
])}
<p>以太坊生态的对应思路是“再质押”（restaking）和 L2 直接继承 L1 安全。比较这些方案时，看三个问题：谁在出块、作恶证据怎样传回、罚没的资产价值有多大。</p>

${tryit(`<p><strong>动手练习：</strong>在区块浏览器里追踪一次真实的 IBC 转账，并亲手算出凭证代币的 denom。</p>
${steps([
  '打开 Mintscan（mintscan.io），进入 Cosmos Hub，在交易列表里筛选类型为 <code>MsgTransfer</code> 的交易，选一笔发往 Osmosis 的 ATOM 转账。',
  '在交易详情里记下：<code>source_channel</code>、<code>sequence</code>（数据包序号）、<code>timeout_timestamp</code>，以及事件 <code>send_packet</code> 的内容。',
  '切换到 Osmosis，用同一个 sequence 和目标通道找到对应的 <code>MsgRecvPacket</code>；注意这笔交易由中继者地址签名，而不是用户。再回到 Hub 找到 <code>MsgAcknowledgement</code>。',
  '用本篇第 5 节的 shasum 命令计算 <code>transfer/目标通道/uatom</code> 的哈希，和接收地址余额里 ATOM 的 <code>ibc/</code> denom 对比。'
])}
<p>预期结果：你能指出同一个数据包在两条链上的三笔交易（发送、接收、确认），说出每一笔是谁签名的，并验证 denom 哈希一致。进阶：在本地用 Hermes 和两条测试链跑通一次转账，然后停掉 Hermes、设置很短的超时，观察 <code>MsgTimeout</code> 退款。</p>`)}

${mistakes([
  ['IBC 的中继者像多签桥的签名者，必须被信任。', '中继者只搬运数据和证明。改动任何内容，目标链的轻客户端校验就会失败。中继者作恶最多导致延迟。'],
  ['IBC 转账不可能出安全问题。', 'IBC 的安全依赖对方链共识诚实和证明校验代码正确。Dragonberry 和 BNB Token Hub 事件都出在证明校验层。'],
  ['链 C 上的两种 ibc/ ATOM 是同一种币。', '凭证代币的 denom 由完整路径决定。路径不同就是不同资产，只能沿原路径退回。'],
  ['中继者都停了，转账的钱就丢了。', '数据包会在超时后由任何人提交超时证明，源链把托管的代币退回发送者。资金卡住但不丢。'],
  ['做应用链就自动获得高性能和安全。', '应用链获得的是定制能力和独享区块空间；安全要靠自己的验证者和质押价值，小链很容易被低成本攻击。']
])}
${recap([
  '应用链用主权换安全与流动性：可定制共识、费用、排序，但要自己承担验证者和安全。',
  'Cosmos 链三层：CometBFT 负责共识与网络，ABCI 是接口，Cosmos SDK 模块实现业务状态机。',
  'IBC 让每条链运行对方的轻客户端，用默克尔证明验证数据包；中继者只影响活性。',
  '数据包要么送达并确认，要么超时并退款；轻客户端的信任期必须短于对方链解绑期，过期要靠治理恢复。',
  'ICS-20 在源区托管、在接收链铸造凭证；凭证 denom 是完整路径的哈希，不同路径是不同资产。',
  '与多签桥相比，IBC 的信任最小化到对方链共识本身，但证明校验代码的漏洞同样致命。'
])}
${quiz([
  { q: 'IBC 中一个中继者把数据包里的金额从 1 ATOM 改成 1,000 ATOM 后提交，会发生什么？', o: ['目标链照常铸造 1,000 ATOM 凭证', '目标链用源链轻客户端校验证明失败，拒绝这笔提交', '源链会罚没中继者的质押', '需要其他中继者投票'], a: 1, why: '目标链用自己保存的源链状态根校验数据包承诺，内容被改动后证明不成立。中继者不需要质押，也没有投票。' },
  { q: '用户的 IBC 转账因为中继者长时间离线，一直没送达。最终结果是？', o: ['资金永久丢失', '目标链自动铸造', '超时后提交超时证明，源链把代币退回发送者', '只能找中继者运营方赔偿'], a: 2, why: '超时机制保证包裹不会永远悬空：证明目标链上没有回执后，源链退款。' },
  { q: '在 ICS-20 中，原生代币第一次从链 A 发往链 B，链 A 怎样处理这批代币？', o: ['销毁', '托管在 transfer 模块账户', '直接转给中继者', '发送给链 B 的验证者多签'], a: 1, why: '源区发送时托管原生代币，接收链铸造凭证；凭证回家时才在汇区销毁并在源链释放。' },
  { q: '下面哪项<strong>不是</strong>做应用链的典型理由？', o: ['定制手续费代币与出块参数', '独享区块空间', '自动继承以太坊的安全', '实现链下内存撮合等定制排序'], a: 2, why: 'Cosmos 应用链默认要自己负责安全，不会自动继承以太坊或其他链的安全。前三项以外的都是常见理由。' },
  { q: '轻客户端的信任期为什么必须短于对方链的解绑期？', o: ['为了节省 Gas', '超过解绑期的验证者已取回质押，不再怕罚没，签名不可信', '因为区块头会被删除', '因为 ICS-20 要求'], a: 1, why: '轻客户端信任验证者签名，是因为作恶可被罚没。验证者解绑后作恶无代价，所以信任必须在解绑期内被刷新。' }
])}
${exercises([
  ['交易所要支持“用户从 Osmosis 把 ATOM 充值到我们的 Cosmos Hub 地址”，也支持“充值 Osmosis 上的 ATOM 凭证”。入账逻辑应该按什么字段识别资产？列出至少三条风控检查。', '<p>按完整 denom 识别：Hub 上原生 ATOM 是 <code>uatom</code>；凭证资产要用 <code>ibc/哈希</code> 并维护一张“denom → 路径 → 资产”白名单，路径可以通过链上 denom trace 查询核对。风控：① 只接受白名单内的 denom 和路径；② 等交易所在区块提交后再入账（CometBFT 链一个区块即最终，但仍要处理节点回放和查询一致性）；③ 校验 memo 或子地址与用户匹配；④ 监控对应 IBC 客户端是否接近过期、通道是否被关闭，异常时暂停该资产充提。</p>'],
  ['（算一算）你的应用链质押总价值 4,000 万美元，验证者质押均匀分布。攻击者想让链停止出块，至少要控制多少质押？想签出能骗过 IBC 轻客户端的虚假区块头呢？', '<p>停链：控制超过 1/3 的质押拒绝投票即可，约 1,333 万美元以上。签出有效的虚假区块头：需要超过 2/3 质押签名，约 2,667 万美元以上。如果这条链通过 IBC 托管了价值 1 亿美元的外部资产，攻击收益高于成本，安全不足。结论：IBC 接入的风险敞口要和对方链的质押价值匹配，可以设置单通道转账限额。</p>'],
  ['解释为什么比特币不能直接通过经典 IBC 连接 Cosmos 链，有哪些替代方式？', '<p>经典 IBC 需要对方链有确定的最终性和可被轻客户端高效验证的状态证明。比特币是 PoW 概率最终性，没有通用的状态承诺，难以写成 IBC 轻客户端。替代方式：多签或门限签名托管桥（信任外部签名者）、由跨链网络中继的 BTC 跨链方案，或者在 ZK 证明成熟后用证明验证比特币区块头。比特币本身的结构见 <a href="#m05-60">M06.1 比特币：UTXO 与脚本</a>。</p>']
])}
${checklist([
  '能解释应用链的收益与代价，并举出一个应用链案例。',
  '能画出 CometBFT、ABCI、Cosmos SDK 三层，说出 5 个常用模块的职责。',
  '能画出 IBC 数据包从发送到确认或超时的全过程，说出每一步谁签名、谁验证。',
  '能计算一个 ibc/ 凭证代币的 denom，并解释不同路径为什么是不同资产。',
  '能说清 IBC 与多签桥在信任假设上的差别，以及 IBC 仍可能出错的地方。',
  '能为交易所设计 IBC 资产的入账识别规则与监控告警。'
])}
${terms([
  ['应用链', 'App-chain', '只为一个应用服务、可定制共识与费用参数的区块链。'],
  ['CometBFT', 'CometBFT', '原名 Tendermint Core 的 BFT 共识与网络引擎，为任意确定性状态机提供复制。'],
  ['ABCI', 'Application Blockchain Interface', 'CometBFT 与上层应用之间的标准接口。'],
  ['Cosmos SDK', 'Cosmos SDK', '用 Go 编写应用专用区块链的模块化框架。'],
  ['IBC', 'Inter-Blockchain Communication', '基于轻客户端和默克尔证明的跨链通信协议。'],
  ['中继者', 'Relayer', '在链之间搬运数据包与证明的链下程序，只影响活性，不需要被信任。'],
  ['ICS-20', 'ICS-20 Fungible Token Transfer', 'IBC 上的同质化代币转账标准：源区托管、接收链铸造凭证。'],
  ['信任期', 'Trusting period', '轻客户端在没有新区块头时仍信任当前验证者集合的期限，必须短于解绑期。'],
  ['链间安全', 'Interchain Security', '提供者链的验证者为消费者链出块，并通过 IBC 执行罚没的共享安全方案。']
])}
` });

CUR = 'm05-66';
addCh({ id: 'm05-66', nav: 'Dune 与链上 SQL', title: 'M12.4 链上数据分析：Dune 与 SQL', desc: '从原始日志到解码表和 Spellbook，用 DuneSQL 算日活、成交量、留存与集中度', html: `
<h1>M12.4 链上数据分析：Dune 与 SQL</h1>
${meta(['区分原始表、解码表、精选表（Spellbook），并用 SQL 手工解码一条 ERC-20 Transfer 日志。', '用 DuneSQL 写出日活、成交量、周留存、前 10 大持有者占比四类查询。', '识别精度、刷量、重复计数、数据延迟四类常见错误，并做出一个可复现的仪表盘。'], '前置：<a href="#m05-9">M04.10 数据基础设施</a>、<a href="#m02-5">M02.5 ERC-20 与授权</a>')}
${beginner(`<p><strong>SQL</strong>：查询表格数据的语言。<code>SELECT</code> 选列、<code>FROM</code> 指表、<code>WHERE</code> 过滤、<code>GROUP BY</code> 分组汇总。</p>
<p><strong>日志（log）/ 事件（event）</strong>：合约执行时写进交易回执的记录，例如 ERC-20 的 <code>Transfer(from, to, value)</code>。它不改变状态，但最适合用来做分析。</p>
<p><strong>topic</strong>：日志的索引字段。<code>topic0</code> 是事件签名的哈希，后面的 topic 放带 <code>indexed</code> 的参数，其余参数放在 <code>data</code> 里。</p>
<p><strong>ABI</strong>：合约接口描述，告诉解析器每个事件有哪些字段、什么类型。</p>
<p><strong>仪表盘（dashboard）</strong>：把多个查询结果做成图表，放在一个页面里。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上分析就是对公开账本做 SQL：节点数据先被整理成原始表，再按 ABI 解码成事件表，再由社区汇总成跨协议的精选表；分析师在上面算指标，但必须自己处理精度、刷量、重复计数和数据延迟。')}
${call('analogy', `<p>原始表像超市的收银小票原件：每一张都在，但写的是商品条码。解码表像把条码翻译成商品名。精选表像总部的销售日报：把所有分店的数据按统一口径汇总好。分析师大多看日报，但要知道日报的口径，必要时回去翻小票。</p>
<p>比喻的局限：链上“小票”谁都能打印。机器人和刷量者可以制造大量真实但没有经济意义的交易，日报不会自动替你剔除。</p>`)}
${art('一图看懂：同一笔转账的三种样子，越往下越好用', 660, 346, [
  S.box(10, 36, 400, 64, { k: 'info', icon: 'db', t: 'logs', tag: '原始表', s: 'topic0 + data：一串十六进制', mono: 1 }),
  S.arrow(210, 102, 210, 134, { label: 'ABI 解码' }),
  S.box(10, 136, 400, 64, { k: 'info', icon: 'doc', t: 'evt_Transfer', tag: '解码表', s: 'from · to · value = 1000000', mono: 1 }),
  S.arrow(210, 202, 210, 234, { label: 'Spellbook' }),
  S.box(10, 236, 400, 64, { k: 'key', icon: 'chart', t: 'tokens.transfers', tag: '精选表', s: 'amount = 1.00 USDC（除以 10^6）', mono: 1 }),
  S.box(440, 36, 210, 64, { k: 'idle', dash: 1, t: '最接近事实', s: '机器好读，人难读' }),
  S.box(440, 136, 210, 64, { k: 'idle', dash: 1, t: '要有 ABI', s: '合约没提交就没有' }),
  S.box(440, 236, 210, 64, { k: 'warn', t: '口径是模型算的', s: '重要结论回原始表复核' }),
  S.text(330, 330, '同一笔转账（示例：1 USDC，6 位小数）。延迟：原始表分钟级，精选表按小时刷新', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '原始表按 ABI 解码成事件表，再由 Spellbook 汇总成跨协议的精选表。'],
  ['key', '分析师大多查精选表，但要知道它的口径，必要时回到原始表翻“小票”。'],
  ['fail', '合约没提交 ABI 就没有解码表；新协议没被收录，就不在 dex.trades 里。'],
  ['risk', '精度要自己除（1000000 才是 1 USDC）；刷量、重复计数和数据延迟也要自己处理。']
], '三层表从上到下：原始表 logs 是一串十六进制，解码表 evt_Transfer 有 from、to、value 字段，精选表 tokens.transfers 给出带精度的金额。右侧注明每层的特点和风险。', 'm05-66')}

<h2>2. 数据分三层：原始、解码、精选</h2>
${recall('<p>“链上数据三层”、The Graph 子图和自建索引器，以及“Dune 适合分析、不适合线上业务”的结论，已在 <a href="#m05-9">M04.10 数据基础设施</a> 讲过；那篇还给过两条入门查询（USDC 每日转账、WETH 日均价）。本篇在此基础上讲表的来源、查询方法和数据陷阱。</p>')}
${mm('从节点到仪表盘：Dune 的数据分层', `
flowchart LR
  N["全节点<br/>区块 交易 回执 trace"] --> RAW["原始表<br/>ethereum.transactions<br/>ethereum.logs<br/>ethereum.traces"]
  RAW -->|"按已提交的 ABI 解码"| DEC["解码表<br/>项目名_链.合约_evt_事件<br/>如 erc20_ethereum.evt_Transfer"]
  DEC -->|"Spellbook 社区模型<br/>统一口径 跨协议"| CUR["精选表<br/>dex.trades<br/>tokens.transfers<br/>prices.usd"]
  CUR --> Q["你的查询"]
  DEC --> Q
  RAW --> Q
  Q --> DB["仪表盘与 API"]
  class CUR key
`, [
  ['flow', '越往右越好用、越快，但离原始事实越远。精选表的每一列都是某个模型的计算结果。'],
  ['key', 'Dune 文档的说法：原始数据在链上最终确定后几分钟内到达；精选数据集按小时刷新。' + cite('Dune 文档：数据目录概览', 'https://docs.dune.com/data-catalog/overview')],
  ['fail', '合约没有提交 ABI，就没有解码表；新协议还没被 Spellbook 收录，就不在 dex.trades 里。这时只能回原始表自己解码。'],
  ['limit', '分钟到小时级的延迟意味着 Dune 不能用于实时风控或充值入账。'],
  ['risk', '精选表的建模逻辑可能有 bug 或口径变化。重要结论要用原始表抽样复核。']
])}
<p>精选表由开源项目 <strong>Spellbook</strong> 维护，用 dbt 模型从解码表生成。${cite('Spellbook（GitHub）', 'https://github.com/duneanalytics/spellbook')} 最常用的两张：</p>
${tbl(['表', '一行代表什么', '常用列'], [
  ['<code>dex.trades</code>', '某个 DEX 池子里的一次兑换（一跳）', '<code>blockchain</code>、<code>project</code>、<code>version</code>、<code>block_date</code>、<code>block_time</code>、<code>token_bought_symbol</code>、<code>token_sold_symbol</code>、<code>token_bought_amount</code>、<code>amount_usd</code>、<code>taker</code>、<code>tx_from</code>、<code>tx_hash</code>、<code>evt_index</code>' + cite('Dune 文档：dex.trades', 'https://docs.dune.com/data-catalog/curated/dex-trades/evm/dex-trades')],
  ['<code>tokens.transfers</code>', '一次代币转账，EVM 链上同时包含原生币转账和 ERC-20 Transfer', '<code>blockchain</code>、<code>block_date</code>、<code>block_time</code>、<code>contract_address</code>、<code>"from"</code>、<code>"to"</code>、<code>amount</code>、<code>amount_usd</code>、<code>symbol</code>' + cite('Dune 文档：Token Transfers', 'https://docs.dune.com/data-catalog/curated/token-transfers/overview')],
  ['<code>dex_aggregator.trades</code>', '经聚合器路由的一次完整兑换', '一行对应 <code>dex.trades</code> 里的一行或多行']
])}

<h2>3. DuneSQL 基础与手工解码</h2>
<p>Dune 的查询引擎 DuneSQL 是 Trino 的分支，函数和语法基本遵循 Trino。${cite('Dune 文档：Query Engine 概览', 'https://docs.dune.com/query-engine/overview')} 有三点和普通 SQL 不同：</p>
${steps([
  '地址和哈希是 <code>varbinary</code> 类型，直接写十六进制字面量 <code>0xa0b8…</code>，<strong>不加引号</strong>。加了引号就变成字符串，匹配不到任何行。',
  '<code>from</code>、<code>to</code> 是 SQL 关键字，作列名时要写成 <code>"from"</code>、<code>"to"</code>。',
  '先按分区列过滤：<code>blockchain</code>、<code>block_date</code> 或 <code>block_time</code>。不加时间条件会扫全历史，又慢又耗额度。'
])}
<p>下面直接从原始表 <code>ethereum.logs</code> 解码 USDC 的 Transfer。<code>topic0</code> 是 <code>keccak256("Transfer(address,address,uint256)")</code>；<code>from</code> 和 <code>to</code> 是 indexed 参数，各占一个 32 字节的 topic，地址在后 20 字节；<code>value</code> 在 <code>data</code> 里。${cite('Dune 文档：Varbinary 函数', 'https://docs.dune.com/query-engine/Functions-and-operators/varbinary')}</p>
${code('SQL', `
-- 手工解码：最近 1 小时 USDC 的 Transfer 日志
SELECT
  block_time,
  tx_hash,
  varbinary_substring(topic1, 13, 20)              AS sender,    -- 32 字节取后 20 字节
  varbinary_substring(topic2, 13, 20)              AS receiver,
  CAST(varbinary_to_uint256(data) AS double) / 1e6 AS amount_usdc -- USDC 是 6 位小数
FROM ethereum.logs
WHERE contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
  AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
  AND block_time > now() - interval '1' hour
LIMIT 100;
`)}
${exq([['为什么取地址用 varbinary_substring(topic1, 13, 20)？', '<p>topic 固定 32 字节，地址只有 20 字节，ABI 编码时在左边补 12 字节的 0。所以从第 13 个字节（Trino 下标从 1 开始）开始取 20 字节，就是地址本身。</p>']])}

<h2>4. 四类常用指标</h2>
<h3>4.1 日活与成交量</h3>
${code('SQL', `
-- 某 DEX 过去 30 天：每日活跃交易地址数与美元成交量
SELECT
  block_date                AS day,
  count(DISTINCT tx_from)   AS active_traders,  -- 用发起交易的 EOA，而不是 taker（taker 常是路由合约）
  sum(amount_usd)           AS volume_usd
FROM dex.trades
WHERE blockchain = 'ethereum'
  AND project = 'uniswap'
  AND block_date >= current_date - interval '30' day
GROUP BY 1
ORDER BY 1;
`)}
<h3>4.2 周留存（cohort）</h3>
${code('SQL', `
-- 按“首次交易所在周”分组，看之后第 N 周还活跃的地址数
WITH weekly AS (
  SELECT DISTINCT tx_from AS trader, date_trunc('week', block_time) AS wk
  FROM dex.trades
  WHERE blockchain = 'base'
    AND block_time >= now() - interval '90' day
),
first_seen AS (
  SELECT trader, min(wk) AS cohort FROM weekly GROUP BY 1
)
SELECT
  f.cohort,
  date_diff('week', f.cohort, w.wk) AS week_n,
  count(DISTINCT w.trader)          AS traders
FROM first_seen f
JOIN weekly w ON w.trader = f.trader
GROUP BY 1, 2
ORDER BY 1, 2;
`)}
${call('info', '<p>这个查询只看最近 90 天，所以第一周的“新用户”里混着 90 天前就来过的老用户（左截断）。严谨做法是先在更长的历史里算出每个地址的首次时间，再筛选首次落在观察窗口内的地址。</p>')}
<h3>4.3 持有集中度</h3>
${code('SQL', `
-- 某代币前 10 大地址的持有占比（用全部转账的净流入估算余额）
WITH flows AS (
  SELECT "to" AS holder, CAST(value AS double) AS amt
  FROM erc20_ethereum.evt_Transfer WHERE contract_address = 0x你的代币地址
  UNION ALL
  SELECT "from" AS holder, -CAST(value AS double) AS amt
  FROM erc20_ethereum.evt_Transfer WHERE contract_address = 0x你的代币地址
),
bal AS (
  SELECT holder, sum(amt) AS b FROM flows
  WHERE holder <> 0x0000000000000000000000000000000000000000  -- 排除铸造/销毁用的零地址
  GROUP BY 1 HAVING sum(amt) > 0
),
ranked AS (
  SELECT holder, b, row_number() OVER (ORDER BY b DESC) AS rk FROM bal
)
SELECT sum(b) FILTER (WHERE rk <= 10) / sum(b) AS top10_share FROM ranked;
`)}
<p>结果出来后要逐个看前 10 名是谁：交易所热钱包、跨链桥托管合约、流动性池、团队锁仓合约都会排进前列，它们不是“巨鲸”。真实的集中度分析要用地址标签（Dune 有 labels 数据集）剔除或单独标注这些合约，然后再下结论。</p>

<h2>5. 四个陷阱</h2>
${tbl(['陷阱', '现象', '怎么防'], [
  ['精度（decimals）', '原始 <code>value</code> 是整数。USDC 除以 10<sup>6</sup>，WETH 除以 10<sup>18</sup>；除错位数，金额差 10<sup>12</sup> 倍', '用精选表的 <code>amount</code> 列，或 JOIN 代币元数据表取 decimals；结果和区块浏览器抽样对比'],
  ['刷量（wash trading）', '同一控制者在自己的地址之间反复买卖，抬高成交量和“活跃用户”', '按资金来源聚类：卖方和买方由同一地址出资就可疑；看成交是否净流入；对比手续费收入与成交量的比例'],
  ['重复计数', '多跳兑换在 <code>dex.trades</code> 里是多行；聚合器成交又在 <code>dex_aggregator.trades</code> 里再记一次', '算“用户成交量”时按 <code>tx_hash</code> 去重或只取首跳；不要把两张表的成交量相加'],
  ['延迟与重组', '最新区块的数据还没到或还会变；精选表按小时刷新', '仪表盘排除最近 1–2 小时，或标注“数据截至”；实时业务用自建索引器（见 <a href="#m01-8">M01.8 索引器工程</a>）']
])}
<p><strong>算一算（示例）</strong>：用户通过聚合器用 100 万 USDC 买 PEPE，路由是 USDC → WETH → PEPE 两跳。</p>
${steps([
  '<code>dex.trades</code> 记 2 行：USDC→WETH 约 100 万美元，WETH→PEPE 约 100 万美元（忽略手续费）。直接 <code>sum(amount_usd)</code> 得到 <strong>200 万</strong>。',
  '<code>dex_aggregator.trades</code> 再记 1 行 100 万。分析师把两张表的成交量相加，得到 <strong>300 万</strong>。',
  '用户真实的交易规模是 <strong>100 万</strong>。上面两种算法分别高估 2 倍和 3 倍。',
  '口径说明：“DEX 池子总成交量”算 200 万是对的，因为两个池子确实各成交了 100 万；“用户需求量”算 100 万才对。<strong>先定口径，再写 SQL。</strong>'
])}
<p>刷量的规模可以很大。Chainalysis 2022 年对 NFT 市场的研究，把“卖给由卖方自己出资的地址”视为刷量信号，发现 262 个地址各自这样卖出超过 25 次。${cite('Blockworks：Chainalysis 关于 NFT 刷量的研究', 'https://blockworks.co/news/wash-trading-which-inflates-nft-prices-growing-area-of-concern-for-traders')} 它用的“资金来源”方法，就是下一篇讲的地址聚类；NFT 市场的刷量与版税规则见 <a href="#m09-7">M14.6 NFT 市场、版税与 Memecoin 发行</a>。</p>

<h2>6. 仪表盘与替代平台</h2>
${steps2('做一个可复现的仪表盘', [
  { t: '定问题与口径', d: '写清指标定义：成交量算池子还是算用户？活跃用户按 tx_from 还是 taker？排除哪些地址？' },
  { t: '写查询并抽样复核', d: '随机挑 3 笔交易，和区块浏览器逐字段核对金额与地址。', kind: 'key' },
  { t: '参数化', d: '把链、代币地址、时间窗口做成查询参数，方便复用。' },
  { t: '可视化并标注', d: '每张图写数据截至时间、口径说明和已知局限。', kind: 'warn' },
  { t: '定期刷新与监控', d: '设置刷新频率；口径变化（例如 Spellbook 模型更新）时在看板上注明。' }
], [
  ['key', '没有口径说明的链上数据图，读者无法判断它是否可信。'],
  ['fail', '最常见的错：不复核就发布。一位小数错就是 10<sup>12</sup> 倍。'],
  ['limit', '仪表盘适合研究和运营复盘，不适合需要秒级响应的业务。']
])}
${tbl(['平台', '形态', '适合'], [
  ['Dune', '浏览器里写 DuneSQL，社区查询与看板可复制；有 API', '研究、运营复盘、公开看板'],
  ['Flipside', '2025 年 7 月起关闭分析 Studio、看板和 API，核心数据继续通过 Snowflake 提供' + cite('Flipside：弃用 Studio、Dashboards、API 公告', 'https://docs.flipsidecrypto.xyz/support/product-special-releases/2025/2025-06-20-or-deprecating-studio-dashboards-api-sdk'), '已有 Snowflake 环境的团队'],
  ['Allium', '把数据直接共享到 Snowflake、BigQuery 等数据仓库，另有 SQL 浏览器和低延迟 API' + cite('Allium 文档', 'https://docs.allium.so/'), '企业把链上数据并入自己的数仓'],
  ['Goldsky', '托管子图与数据流水线，把链上数据推送到你自己的数据库' + cite('Goldsky 文档', 'https://docs.goldsky.com/'), '应用后端需要较低延迟的数据'],
  ['Google BigQuery 公共数据集', '2018 年起提供以太坊公共数据集（后称 crypto_ethereum），按天更新' + cite('Google Cloud：Ethereum in BigQuery', 'https://cloud.google.com/blog/products/data-analytics/ethereum-bigquery-public-dataset-smart-contract-analytics'), '已在 GCP 上、需要大规模批处理的团队']
])}

${tryit(`<p><strong>动手练习：</strong>在 Dune 上做一个“某代币过去 30 天”迷你看板（注册免费账号即可）。</p>
${steps([
  '新建查询，粘贴第 3 节的手工解码 SQL，把合约地址换成你选的代币（例如 USDT <code>0xdac17f958d2ee523a2206206994597c13d831ec7</code>，同样是 6 位小数），运行并抽查 3 笔：复制 tx_hash 到 Etherscan，核对金额和地址。',
  '改写成按天汇总：转账笔数、去重发送地址数、总金额。再用 <code>tokens.transfers</code> 写一遍同样的指标，比较两者是否一致；如不一致，找出原因（例如精选表的口径或刷新延迟）。',
  '运行 4.3 节的集中度查询，查出前 10 名地址，用 Etherscan 标签判断哪些是交易所、桥或合约。',
  '把三个结果做成图表，放进一个看板，在文字组件里写清口径和“数据截至时间”。'
])}
<p>预期结果：一个有 3 张图、带口径说明的看板；你能解释两种算法的差异，以及前 10 名里哪些不是“巨鲸”。</p>`)}

${mistakes([
  ['精选表就是事实，不用复核。', '精选表是 Spellbook 模型的计算结果，可能有口径差异或 bug。关键数字要用原始表或区块浏览器抽样复核。'],
  ['地址写成带引号的字符串 ‘0xabc’ 也能查。', 'DuneSQL 里地址是 varbinary，要写不带引号的 0x 字面量；带引号变成字符串，匹配不到。'],
  ['dex.trades 的 amount_usd 求和就是用户交易量。', '多跳兑换一笔交易会有多行；加上聚合器表还会重复。要先定口径，再按 tx_hash 去重或只取首跳。'],
  ['活跃地址数等于用户数。', '一个人可以有很多地址，机器人和刷量者会制造大量地址。地址数只是用户数的上限估计。'],
  ['Dune 数据是实时的，可以拿来做风控。', '原始数据在最终确定后几分钟才到，精选表按小时刷新。实时业务要用自建索引器。']
])}
${recap([
  'Dune 数据分三层：原始表、按 ABI 解码的事件表、Spellbook 维护的跨协议精选表。',
  'DuneSQL 基于 Trino：地址是不加引号的 varbinary 字面量，from/to 要加双引号，先按分区列过滤。',
  '手工解码 Transfer：topic0 是事件签名哈希，地址取 topic 的后 20 字节，金额在 data 里并按 decimals 换算。',
  '日活、成交量、留存、集中度是四类基础指标；集中度要剔除交易所、桥、池子等合约地址。',
  '四个陷阱：精度、刷量、重复计数、延迟与重组。先写口径，再写 SQL，最后抽样复核。'
])}
${quiz([
  { q: '在 DuneSQL 里按合约地址过滤，正确写法是？', o: ['WHERE contract_address = ‘0xa0b8...’（带引号）', 'WHERE contract_address = 0xa0b8...', 'WHERE contract_address LIKE ‘%a0b8%’', 'WHERE lower(contract_address) = ‘a0b8...’'], a: 1, why: '地址是 varbinary，用不带引号的 0x 十六进制字面量。带引号是字符串，类型不匹配。' },
  { q: '原始 Transfer 日志的 value 是 2500000000，代币是 USDC。实际金额是多少？', o: ['2,500,000,000 USDC', '2.5 USDC', '2,500 USDC', '0.0000000025 USDC'], a: 2, why: 'USDC 有 6 位小数：2,500,000,000 / 10^6 = 2,500。按 18 位小数换算会得到 0.0000000025。' },
  { q: '一笔 USDC → WETH → PEPE 的聚合器兑换，在 dex.trades 里通常有几行？', o: ['2 行，每一跳一行', '1 行', '3 行', '0 行，只在聚合器表里'], a: 0, why: 'dex.trades 一行代表一个池子里的一次兑换，两跳就是两行。聚合器表另记一行完整兑换。' },
  { q: '下面哪一条最能说明一组交易可能是刷量？', o: ['交易发生在周末', '买方地址的资金由卖方地址提供', '交易金额是整数', '使用了聚合器'], a: 1, why: '“卖给自己出资的地址”是常用的刷量信号：资金在同一控制者内部循环。其他三项都不能单独说明问题。' },
  { q: '为什么 Dune 不适合交易所的充值入账？', o: ['Dune 不收录以太坊', 'SQL 不能处理大数字', '数据有分钟到小时级延迟，且不处理你的确认数与重组逻辑', 'Dune 的数据不公开'], a: 2, why: '入账需要实时、按确认数处理重组的数据管道，应使用自建索引器。Dune 适合分析与复盘。' }
])}
${exercises([
  ['运营同事说“上个月我们协议的日活涨了 3 倍”。你会用哪些查询来验证这个增长是否真实？', '<p>① 把日活按 tx_from 和 taker 两种口径各算一遍，看是否一致；② 看新地址的 Gas 资金来源，如果大量新地址由少数几个地址出资，可能是女巫或刷量；③ 看人均成交额和手续费收入，刷量常表现为成交量和地址数暴涨、手续费收入和净流入不涨；④ 看留存：真实用户第 2、3 周仍有一定比例活跃，刷量地址通常只活跃一次；⑤ 排查是否有空投或积分活动驱动。</p>'],
  ['某个新 DEX 没被 Spellbook 收录，也没有提交 ABI。你怎样统计它的每日成交量？', '<p>从 <code>ethereum.logs</code> 按它的池子合约地址过滤，找到兑换事件的 topic0（在 Etherscan 的事件页或源码里计算 keccak256 签名），用 varbinary 函数解码 data 里的数量字段，再 JOIN 价格表换算美元，按天汇总。也可以向 Dune 提交合约 ABI 让它生成解码表，或向 Spellbook 提 PR 把它加入 dex.trades。</p>'],
  ['（算一算）你算出某代币前 10 名地址占比 72%。其中第 1 名是交易所热钱包（30%），第 2 名是跨链桥托管合约（15%），第 3 名是 Uniswap 池子（8%）。剔除这三个后，剩余 7 个地址占剩余流通量的比例是多少？', '<p>前 10 名合计 72%，剔除 30% + 15% + 8% = 53%，剩余 7 个地址合计 19%。剩余流通量为 100% − 53% = 47%。19% / 47% ≈ <strong>40.4%</strong>。结论：真实的“巨鲸集中度”约 40%，而不是 72%；但交易所钱包背后也可能是少数大户，需要结合交易所披露判断。</p>']
])}
${checklist([
  '能说出原始表、解码表、精选表的区别和各自的延迟。',
  '能用 ethereum.logs 手工解码一条 ERC-20 Transfer。',
  '能写出日活、成交量、周留存、持有集中度四类查询。',
  '能说明多跳和聚合器造成的重复计数，并按口径修正。',
  '能做出一个带口径说明、经过抽样复核的 Dune 看板。'
])}
${terms([
  ['原始表', 'Raw tables', '直接从节点数据整理的区块、交易、日志、trace 表。'],
  ['解码表', 'Decoded tables', '按合约 ABI 把日志与调用解析成字段的表。'],
  ['精选表', 'Curated tables / Spellbook', '社区或平台维护的跨协议统一口径表，如 dex.trades、tokens.transfers。'],
  ['DuneSQL', 'DuneSQL', 'Dune 基于 Trino 的查询引擎方言。'],
  ['事件签名哈希', 'topic0', '事件签名字符串的 keccak256 哈希，用来识别日志属于哪种事件。'],
  ['刷量', 'Wash trading', '同一控制者在自有地址之间买卖，制造虚假成交量。'],
  ['留存分析', 'Cohort retention', '按首次使用时间分组，统计之后各期仍活跃的比例。'],
  ['重复计数', 'Double counting', '同一笔经济活动在多行或多张表里被重复累加。']
])}
` });

CUR = 'm05-67';
addCh({ id: 'm05-67', nav: '链上取证', title: 'M12.5 链上取证与资金追踪', desc: '地址聚类、穿越 DEX 与跨链桥、标签与工具、冻结窗口，以及取证的边界', html: `
<h1>M12.5 链上取证与资金追踪</h1>
${meta(['说出三条经典地址聚类启发式（共同输入、找零识别、充值地址复用），并为每一跳追踪给出置信度。', '按“DEX 兑换、跨链桥、混币器、交易所”四类节点，说明资金穿过它们时用什么证据继续追。', '列出资金仍可被冻结的位置（稳定币发行方、交易所、协议暂停、验证者），并用一个真实案例说明冻结窗口为什么以小时计。'], '前置：<a href="#m05-66">M12.4 链上数据分析</a>、<a href="#m05-8">M06.12 跨链桥</a>', ['trace'])}
${beginner(`<p><strong>资金追踪（fund tracing）</strong>：沿着链上转账一跳一跳找出被盗或可疑资金去了哪里。</p>
<p><strong>跳（hop）</strong>：资金从一个地址到下一个地址的一次移动。</p>
<p><strong>聚类（clustering）</strong>：根据行为规律，推断多个地址属于同一个控制者，把它们合成一个“簇”。</p>
<p><strong>标签（label）</strong>：把地址和现实实体对应起来，例如“某交易所热钱包”“某桥合约”“某次攻击的攻击者”。</p>
<p><strong>冻结（freeze）</strong>：由有权限的一方（稳定币发行方、交易所等）让某地址或账户里的资产不能再移动。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上取证是用公开账本做侦查：转账本身是确定的事实，难的是判断“哪些地址属于同一个人”和“资金穿过 DEX、桥、混币器后变成了哪一笔”；每一跳的推断都有置信度，追踪的价值在于赶在资金离开可冻结的位置之前通知能冻结它的人。')}
${call('analogy', `<p>追踪资金像追踪一辆车：在高速公路上（普通转账），每个收费站都拍了照，路线清清楚楚；进了大型停车场（混币器），同型号的车一起开进开出，你只能猜哪一辆是它；车开到港口要上船（交易所），这时通知港口扣车最有效。</p>
<p>比喻的局限：链上的“照片”永久公开，任何人都能查，所以取证也可能被滥用来跟踪普通人。第 7 节讲边界。</p>`)}
${art('一图看懂：资金一跳一跳走，冻结要赶在离开之前', 660, 280, [
  S.text(10, 28, '资金路径与每一跳的置信度（示例）', { size: 13, b: 1 }),
  S.box(10, 44, 108, 62, { k: 'tint', icon: 'wallet', t: '受害地址', s: '被盗前' }),
  S.box(142, 44, 108, 62, { k: 'risk', icon: 'bot', t: '攻击者', s: '转账 1.00' }),
  S.box(274, 44, 108, 62, { k: 'tint', icon: 'chart', t: 'DEX 兑换', s: '事件 0.98' }),
  S.box(406, 44, 108, 62, { k: 'tint', icon: 'link', t: '跨链桥', s: '时间 0.75' }),
  S.box(538, 44, 108, 62, { k: 'tint', icon: 'bank', t: '交易所', s: '归集 0.95' }),
  S.arrow(120, 75, 140, 75),
  S.arrow(252, 75, 272, 75),
  S.arrow(384, 75, 404, 75),
  S.arrow(516, 75, 536, 75),
  S.box(10, 144, 108, 62, { k: 'key', icon: 'clock', t: '冻结窗口', s: '以小时计' }),
  S.box(142, 144, 108, 62, { k: 'ok', icon: 'shield', t: '币方冻结', s: 'USDT 等' }),
  S.box(274, 144, 240, 62, { k: 'risk', dash: 1, icon: 'warn', t: '混币器 / 无 KYC 兑换', s: '置信度 0.25，追踪中断' }),
  S.box(538, 144, 108, 62, { k: 'ok', icon: 'bank', t: '冻结账户', s: '交易哈希' }),
  S.arrow(196, 108, 196, 142, { k: 'ok' }),
  S.arrow(328, 108, 328, 142, { k: 'risk', dash: 1 }),
  S.arrow(592, 108, 592, 142, { k: 'ok' }),
  S.text(330, 238, '整体置信度 = 1.00 × 0.98 × 0.75 × 0.95 ≈ 0.70（示例）\n经混币器后约 0.17，不足以单独作为冻结依据', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '上排是资金路径，每一跳都有证据强弱不同的置信度，连乘得到整体置信度。'],
  ['key', '追踪的价值是赶在资金离开可冻结的位置之前，通知能冻结它的人。'],
  ['risk', '攻击者通常先把稳定币换成 ETH，再换成 BTC，混币器会让链上追踪中断。'],
  ['limit', '冻结要对方愿意配合并有法律依据；去中心化协议通常无法针对单个用户冻结。']
], '上排是被盗资金依次经过受害地址、攻击者、DEX、跨链桥和交易所，每一跳标出置信度。下排是可以冻结的位置：稳定币发行方和交易所，红色虚线框是混币器，会让追踪中断。', 'm05-67')}

<h2>2. 聚类启发式：哪些地址属于同一个人</h2>
${recall('<p>比特币的 UTXO 模型（输入、输出、找零）见 <a href="#m05-60">M06.1 比特币：UTXO 与脚本</a>；以太坊的账户模型和交易结构见 <a href="#m01-4">M01.4 交易全解</a>。本节只讲从这两种模型里推断“同一控制者”的方法。</p>')}
${tbl(['启发式', '适用模型', '逻辑', '常见误判', '置信度（示例）'], [
  ['共同输入所有权（common-input-ownership）', 'UTXO', '一笔交易的多个输入需要各自签名，通常由同一个钱包一起签，所以这些输入地址属于同一控制者', 'CoinJoin 等协作交易故意把多人输入放进同一笔交易', '高；遇到 CoinJoin 特征时作废'],
  ['找零识别（change detection）', 'UTXO', '支付通常有一个“付给对方”和一个“找零给自己”的输出。新出现的、只用一次的地址、或金额不是整数的输出，更可能是找零', '钱包实现不同；用户故意制造整数找零', '中'],
  ['充值地址复用（deposit-address reuse）', '账户', '交易所给每个用户一个专属充值地址，再统一归集到热钱包。多个地址都往同一个充值地址转钱，它们大概率属于同一用户', '共享账户、代付、地址被别人当作收款地址使用', '中到高'],
  ['共同 Gas 资助者', '账户', '新地址的第一笔 ETH（用来付 Gas）来自同一个地址', '水龙头、交易所提币、批量转账服务', '中'],
  ['行为指纹', '两者', '固定的交易时间段、Gas 设置、调用同一套合约的顺序', '使用同一个钱包软件的人行为相似', '低，只做辅助']
])}
<p>前两条来自比特币早期研究：Meiklejohn 等人在 2013 年用“共同输入”和“找零地址”两条启发式，把大量比特币地址聚成实体簇，并通过与真实服务交互来打标签。${cite('Meiklejohn 等：A Fistful of Bitcoins（2013）', 'https://smeiklej.com/files/imc13.pdf')} 以太坊没有 UTXO，这两条用不上；Victor 在 2020 年提出基于充值地址、空投多次参与、代币授权的启发式，并发现充值地址启发式最有效。${cite('Victor：Address Clustering Heuristics for Ethereum（FC 2020）', 'https://link.springer.com/doi/10.1007/978-3-030-51280-4_33')}</p>
${mm('充值地址复用：从交易所归集行为反推同一用户', `
flowchart LR
  U1["地址 X"] -->|"转入"| D["充值地址 D<br/>交易所分配给某一个用户"]
  U2["地址 Y"] -->|"转入"| D
  U3["地址 Z"] -->|"转入"| D
  D -->|"归集"| HOT["交易所热钱包<br/>已有公开标签"]
  HOT --> CEX["交易所内部账户<br/>链上不可见"]
  class D key
  class CEX warn
`, [
  ['flow', '先从“归集”行为识别出 D 是充值地址：D 收到多笔转入后，会把余额整笔转给一个已标注的交易所热钱包。'],
  ['key', '充值地址只属于一个交易所用户，所以 X、Y、Z 大概率由同一人控制，并且交易所知道这个人是谁（KYC 资料）。'],
  ['fail', '如果有人把别人的充值地址当成收款地址（例如 OTC 交易对手直接打到对方充值地址），会把两个人误聚成一簇。'],
  ['risk', '一旦误聚，无辜者可能被列入风险名单。置信度不够时，标签要写“可能关联”，不能写“确认”。'],
  ['limit', '资金进入交易所之后，链上看不到内部流转；后续只能由交易所根据执法或受害方请求配合。']
])}

<h2>3. 资金穿过四类节点时怎么继续追</h2>
${tbl(['节点', '链上留下什么', '继续追的方法', '典型置信度'], [
  ['DEX 兑换', '同一笔交易里：代币 A 转入池子、Swap 事件、代币 B 转回（或转给指定接收者）', '解码 Swap 事件和同交易内的 Transfer，按 recipient 继续追。输入输出在同一笔交易里，几乎确定', '很高'],
  ['跨链桥', '源链锁定/销毁事件，目标链铸造/释放事件，通常带消息 ID 或 nonce', '用桥的消息 ID 匹配两条链上的事件；没有 ID 时用“金额 − 手续费 + 时间窗口”匹配', '有 ID 时高；只凭金额时间时中'],
  ['跨链兑换协议（如 THORChain）', '入金交易带 memo，格式为 <code>SWAP:资产:目标地址:…</code>，目标地址写在 memo 里' + cite('THORChain 开发文档：Memos', 'https://dev.thorchain.org/concepts/memos.html'), '解析 memo 得到目标链地址，再在目标链上找出金交易', '高'],
  ['混币器', '固定面额的存入和取出，存取之间没有链上联系', '只能做概率推断：时间相近、面额组合、取出地址的 Gas 来源、取出后又与旧地址汇合', '低'],
  ['交易所', '转入一个充值地址，随后被归集', '识别充值地址，联系交易所；链上追踪到此为止', '链上终点，链下继续']
])}
<p>把每一跳的置信度连乘，就得到“这笔资金最终在这里”的整体置信度。<strong>算一算（示例）</strong>：</p>
${steps([
  '受害地址 → 攻击者：直接转账，置信度 1.00。',
  '攻击者 → DEX 兑换 → 新地址：同一笔交易的 Swap 事件，0.98。',
  '新地址 → 跨链桥 → 目标链地址：只能按金额和时间匹配，0.75。',
  '目标链地址 → 交易所充值地址：充值地址归集识别，0.95。',
  '整体：1.00 × 0.98 × 0.75 × 0.95 ≈ <strong>0.70</strong>。如果中间再经过一次混币器（0.25），整体降到约 0.17，已经不足以单独作为冻结依据。',
  '工程结论：报告里每一跳都写明证据和置信度，弱的一跳要找额外证据（例如桥的消息 ID、交易所内部记录）来补强，而不是直接跳过。'
])}
${call('info', '<p>“污点”（taint）计算还有口径问题：资金和干净资金混在一个地址后，再转出的钱算多少是赃款？常见口径有“全部算污点”（poison）、“按比例”（haircut）、“先进先出”（FIFO）。不同口径得到的冻结金额不同，报告里要写明用了哪一种。</p>')}

<h2>4. 动手追一遍：交互实验</h2>
<p>先保持默认值，逐个点击每一跳，读证据，再选你认为正确的启发式，看置信度怎么变化。然后拖动“响应时间”，观察每个冻结点从“可冻结”变成“已错过”的时刻。</p>
${lab('trace')}
<p>做完后回答：响应时间从 0.4 小时拖到 1 小时，哪一笔 USDT 失去了冻结机会？为什么“忽略那笔 0.0001 ETH 入账”也是一步正确的追踪？</p>

<h2>5. 标签来源与工具</h2>
${tbl(['来源', '内容', '注意'], [
  ['区块浏览器（Etherscan 等）', '交易所热钱包、知名合约、钓鱼与攻击者地址的公开标签', '标签覆盖有限；攻击者标签多由安全团队或用户报告'],
  ['项目方与安全团队公告', '攻击者地址、被盗金额、事件时间线', '早期数字常被修正，以最新公告为准'],
  ['执法机构公告', '例如 FBI 公布的攻击者地址清单，并要求服务方拦截' + cite('FBI IC3：关于 Bybit 被盗的公告（2025-02-26）', 'https://www.ic3.gov/PSA/2025/PSA250226'), '具有法律与合规含义，交易所通常据此屏蔽'],
  ['自己交互', '向某服务充值或提币，记录它使用的地址', '研究者最早就是这样给交易所打标签的']
])}
${tbl(['工具', '定位'], [
  ['Etherscan / 各链浏览器', '查单笔交易、事件、内部交易和公开标签；免费'],
  ['Arkham', '实体标签与资金流可视化，面向公众的情报平台'],
  ['Breadcrumbs', '可视化的资金流图与地址调查'],
  ['MetaSleuth（BlockSec）', '多链资金流追踪与调查图' + cite('MetaSleuth', 'https://metasleuth.io/')],
  ['Chainalysis Reactor（商业）', '面向执法与合规团队的调查平台，用图谱跨多链追踪 swap、桥和混币器，并关联现实实体' + cite('Chainalysis Reactor', 'https://www.chainalysis.com/product/reactor/')],
  ['Dune / 自建 SQL', '批量分析：例如找出所有由同一地址出资 Gas 的新地址（见 <a href="#m05-66">M12.4</a>）']
])}

<h2>6. 冻结：哪里还能拦住钱</h2>
${mm('被盗资金的去向与可冻结点', `
flowchart LR
  HK["攻击发生"] --> ATT["攻击者地址"]
  ATT --> STB["仍是 USDT 或 USDC"]
  ATT --> LST["质押衍生品<br/>如 cmETH"]
  ATT --> NAT["原生 ETH 或 BTC"]
  STB -->|"发行方黑名单"| F1["可冻结"]:::ok
  LST -->|"协议提款延迟期内暂停"| F2["可冻结"]:::ok
  NAT --> DEX["DEX 与跨链兑换"]
  DEX --> MIX["混币器 或 无 KYC 兑换服务"]:::risk
  DEX --> EX["合规交易所 OTC"]
  EX -->|"交易所冻结账户"| F3["可冻结"]:::ok
  MIX --> DARK["追踪中断"]:::risk
`, [
  ['flow', '攻击者的第一步几乎总是把可冻结资产换成不可冻结资产：稳定币换 ETH，再把 ETH 换成 BTC。'],
  ['key', '冻结机会集中在前几个小时：稳定币还没换掉、提款延迟期还没过、资金刚到交易所还没被提走。'],
  ['risk', '原生 ETH 和 BTC 没有中心化的冻结开关；混币器和无 KYC 兑换服务会让追踪中断。'],
  ['limit', '冻结需要对方愿意配合并有法律依据。去中心化协议通常无法、也不应该针对单个用户冻结。'],
  ['fail', '通知太慢或证据不足，交易所可能来不及处理或拒绝处理。']
])}
${tbl(['冻结方', '机制', '要点'], [
  ['USDT 发行方 Tether', '合约里的 <code>addBlackList</code> 让地址无法转出；<code>destroyBlackFunds</code> 销毁已列入黑名单地址的余额', '据 BlockSec 统计，2025 年在以太坊和 Tron 上共冻结约 12.6 亿美元 USDT，涉及 4,163 个地址' + cite('BlockSec：2025 年 USDT 黑名单统计', 'https://blocksec.com/blog/1-26-billion-frozen-usdt-blacklisting-on-ethereum-and-tron-in-2025') + '（Tron 上的冻结与 T3 联盟见 <a href="#m05-68">M06.11 Tron 与 TON</a>）'],
  ['USDC 发行方 Circle', '合约里的 <code>blacklist</code> / <code>unBlacklist</code>，由 blacklister 角色调用；转账函数带 <code>notBlacklisted</code> 检查' + cite('Circle stablecoin-evm：Blacklistable.sol', 'https://github.com/circlefin/stablecoin-evm/blob/master/contracts/v1/Blacklistable.sol'), '通常依据法律要求或执法请求'],
  ['中心化交易所', '冻结充值账户、拒绝提币', '需要尽快提供交易哈希、地址和追踪链路'],
  ['协议本身', '有提款延迟期或暂停开关的协议，可以在窗口内暂停', '例如 Bybit 事件中 mETH 协议利用 8 小时提款延迟追回 15,000 枚 cmETH' + cite('The Block：mETH 追回 4,300 万美元，Tether 冻结 18.1 万 USDT', 'https://www.theblock.co/post/342840/meth-protocol-announces-43-million-recovery-from-bybit-hack-while-tether-freezes-181000')],
  ['验证者', '验证者协调拒绝处理某些地址的交易', '极少发生且有中心化争议，例如 Sui 上的 Cetus 事件（见 <a href="#m05-64">M06.9</a>）']
])}

<h3>6.1 案例走读：Bybit 被盗资金的洗钱路径</h3>
<p>2025 年 2 月 21 日，交易所 Bybit 的以太坊冷钱包被盗，FBI 估计约 15 亿美元，并归因于朝鲜黑客（FBI 称其为 TraderTraitor）。${cite('FBI IC3：关于 Bybit 被盗的公告（2025-02-26）', 'https://www.ic3.gov/PSA/2025/PSA250226')} 事后调查指出，攻击者先入侵了 Safe{Wallet} 一名开发者的电脑，把恶意代码放进 Safe 的 AWS S3 存储，签名者浏览器加载后，代码在签名时篡改了交易内容。${cite('The Block：攻击者疑似入侵 Safe 开发者电脑', 'https://www.theblock.co/post/343530/lazarus-appears-to-compromise-safe-developer-machine-in-lead-up-to-1-5-billion-bybit-hack-report')} 资金路径按安全公司和 Bybit 的公开数据整理如下：</p>
${steps([
  '<strong>拆分</strong>：两小时内，资金被分到 50 个钱包，每个约 1 万 ETH；这些钱包在之后 9 天内被逐个清空。' + cite('Elliptic：Bybit 被盗资金追踪', 'https://www.elliptic.co/blog/bybit-hack-largest-in-history'),
  '<strong>换掉可冻结资产</strong>：被盗的 stETH、cmETH 等代币几分钟内就在 DEX 上换成 ETH。Tether 冻结了 18.1 万 USDT；mETH 协议利用提款延迟追回 15,000 枚 cmETH。',
  '<strong>跨链换成 BTC</strong>：大部分 ETH 通过基于 THORChain 的服务换成比特币；另有一部分经过不做 KYC 的兑换服务 eXch。' + cite('TRM Labs：Bybit 洗钱进入下一阶段', 'https://www.trmlabs.com/resources/blog/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering'),
  '<strong>分散与混币</strong>：3 月 20 日 Bybit 披露，约 44 万 ETH 换成了 12,836 BTC，分散到 9,117 个钱包；部分 BTC 进入 Wasabi、CryptoMixer 等混币服务。' + cite('Cointelegraph：Bybit 称 88% 被盗资金仍可追踪', 'https://cointelegraph.com/news/bybit-1-4b-hack-88-percent-traceable-lazarus-group'),
  '<strong>追踪结果</strong>：同一披露给出 88.87% 仍可追踪、7.59% 已“消失”、3.54% 已冻结。3 月 4 日时“消失”的 20% 中，经 eXch 的约 16% 被认为无法追踪。' + cite('The Block：Bybit CEO 称 20% 被盗资金已“消失”', 'https://www.theblock.co/post/344384/bybit-ceo-says-20-from-1-4-billion-theft-has-gone-dark-as-hackers-swap-to-bitcoin')
])}
<p><strong>算一算（示例）</strong>：按约 14 亿美元计，3.54% 冻结约 <strong>4,960 万美元</strong>；88.87% 可追踪约 12.4 亿美元。“可追踪”不等于“可追回”：钱分散在 9,000 多个 BTC 地址上，没有中心化冻结开关，只有当某一笔流入合规交易所或 OTC 时才有机会拦截。这个案例同时说明了三件事：前几小时是冻结窗口；跨链兑换的 memo 让追踪可以继续；无 KYC 兑换服务和混币器是追踪真正的断点。</p>

<h2>7. 局限、隐私与伦理</h2>
${steps([
  '<strong>启发式会出错。</strong>聚类是推断，不是证据。把概率写成事实，会让无辜地址被冻结或被公开指认。报告里要标置信度和反例。',
  '<strong>隐私是正当需求。</strong>大多数使用隐私工具的人不是罪犯：工资、捐款、商业付款都不想被公开。美国财政部 2022 年制裁 Tornado Cash，2025 年 3 月 21 日又将其移出制裁名单。' + cite('美国财政部：Tornado Cash 解除制裁', 'https://home.treasury.gov/news/press-releases/sb0057') + ' 隐私协议与合规的边界见 <a href="#m10-5">M07.5 隐私协议与合规边界</a>。',
  '<strong>不要人肉公开个人身份。</strong>把地址和真实个人对应起来，属于高敏感行为。研究者应只交给执法机构或受害方的法律顾问，不在社交媒体公开。',
  '<strong>遵守法律程序。</strong>冻结与追回通常需要法律依据。交易所的 KYC、制裁筛查与可疑交易报告见 <a href="#m11-2">M12.2 KYC、AML 与制裁筛查</a>。本篇不是法律建议。'
])}

${tryit(`<p><strong>动手练习：</strong>用 Etherscan 追一段真实的公开路径（只做阅读，不与任何地址交互）。</p>
${steps([
  '在 FBI 的 Bybit 公告或安全公司的报告里，任选一个公开的攻击者以太坊地址，在 Etherscan 打开它。',
  '在 Transactions 和 Token Transfers 标签里找出它最早收到的资金来自哪里，以及它最先把资金转给了谁；记录每一跳的交易哈希。',
  '找到一笔 DEX 兑换：打开交易详情的 Logs，指出 Swap 事件和换出代币的接收地址。',
  '找到一笔转往 THORChain 路由或桥合约的交易，查看 Input Data 或 memo，判断目标链和目标地址是否可见。',
  '把你追到的 4–6 跳画成一张表：每一跳的证据、你用的启发式、你给的置信度，以及“这一跳时资金是否仍可冻结”。'
])}
<p>预期结果：一张带置信度的追踪表；你能指出路径上哪一跳最弱、为什么，以及冻结窗口在哪一跳之后关闭。</p>`)}

${mistakes([
  ['链上所有转账都公开，所以资金一定能追到底。', '普通转账确定可查，但混币器、无 KYC 兑换和交易所内部账本会让链上追踪中断，只能做概率推断或依靠链下配合。'],
  ['聚类结果就是证据。', '聚类是启发式推断，有误判。报告要给每一跳标置信度和证据，弱的一跳要找额外证据补强。'],
  ['发现被盗后慢慢分析，最后再通知各方。', '攻击者通常几分钟内就把可冻结资产换掉。应先把攻击者地址同步给稳定币发行方、交易所和安全社区，再深入分析。'],
  ['“可追踪”就等于“能追回”。', 'Bybit 披露约 89% 可追踪，但只有约 3.5% 被冻结。追回要求资金停在能被冻结的地方。'],
  ['用过隐私工具的地址都是犯罪地址。', '隐私是正当需求，相关法律也在变化。风险评分可以把它作为一个信号，但不能单独据此定性。']
])}
${recap([
  '共同输入和找零识别适用于 UTXO；充值地址复用、共同 Gas 资助者适用于账户模型；它们都是带置信度的推断。',
  'DEX 兑换和带消息 ID 的跨链桥可以高置信度继续追；混币器只能做概率推断；交易所是链上追踪的终点。',
  '每一跳的置信度连乘得到整体置信度，报告要写明证据、口径和弱点。',
  '冻结点：稳定币发行方黑名单、交易所账户、协议的延迟期或暂停开关；窗口通常只有几个小时。',
  'Bybit 案例：拆分到 50 个钱包 → 换掉可冻结代币 → 经 THORChain 等换成 BTC → 分散与混币；约 89% 可追踪，约 3.5% 被冻结。',
  '取证有隐私和法律边界：不把推断当事实，不公开个人身份，通过法律程序处理冻结。'
])}
${quiz([
  { q: '以太坊上，地址 X、Y、Z 都向同一个地址 D 转账，D 随后把余额整笔转给某交易所的热钱包。最合理的推断是？', o: ['D 是攻击者', 'X、Y、Z 很可能属于同一个交易所用户', 'X、Y、Z 都是交易所的热钱包', '无法得出任何推断'], a: 1, why: '这是充值地址复用启发式：D 是交易所分配给某个用户的充值地址，多个地址往里转钱，大概率是同一用户。但仍可能误判，需要标置信度。' },
  { q: '资金穿过哪一类节点时，链上追踪的置信度通常最低？', o: ['同一交易内的 DEX 兑换', '带消息 ID 的跨链桥', '固定面额的混币池', '向交易所充值地址转账'], a: 2, why: '混币池的存入和取出之间没有链上联系，只能用时间、面额、Gas 来源做概率推断。' },
  { q: '攻击发生后，哪一项最可能在几小时内冻结部分被盗资金？', o: ['向以太坊基金会申请回滚', '通知稳定币发行方和交易所拉黑攻击者地址', '在社交媒体上公布攻击者地址', '等待攻击者主动归还'], a: 1, why: 'USDT、USDC 发行方可以拉黑地址，交易所可以冻结充值账户。以太坊不会为单次攻击回滚，公开地址本身不能冻结资金。' },
  { q: '四跳追踪的置信度分别是 1.00、0.98、0.75、0.95，整体置信度约为？', o: ['0.70', '0.92', '0.75', '3.68'], a: 0, why: '各跳置信度连乘：1.00 × 0.98 × 0.75 × 0.95 ≈ 0.70。最弱的一跳决定了整体上限。' },
  { q: '关于 Bybit 事件，下列哪项最能说明“可追踪不等于可追回”？', o: ['资金全部进入了混币器', '攻击者主动归还了资金', '约 89% 仍可追踪，但只有约 3.5% 被冻结', 'Bybit 没有公布任何数据'], a: 2, why: '大部分资金换成 BTC 并分散到数千个地址，链上看得见但没有冻结开关，只有流入可配合的机构时才有机会拦截。' }
])}
${exercises([
  ['你是一家交易所的合规工程师。安全社区公布了一次攻击的攻击者地址，你的系统应自动做哪些事？', '<p>① 把攻击者地址及其高置信度关联地址加入风险名单；② 对过去和未来进入本所的资金做多跳回溯（例如回溯 3–5 跳），命中则暂停入账并人工复核；③ 冻结相关用户账户的提币，保留证据；④ 按法律要求向监管或执法机构报告；⑤ 对低置信度关联只做增强审查，不直接冻结，避免误伤。</p>'],
  ['某攻击者把 500 万 USDC 留在原地址 6 小时没动，同时把 ETH 换成 BTC。为什么 USDC 很可能能被冻结？你应该怎样提交冻结请求？', '<p>USDC 合约有 blacklist 功能，只要资金还在 USDC 形态，发行方就能让该地址无法转出。攻击者把它留着，可能是来不及兑换或在等待流动性。请求要尽快：附上攻击交易哈希、攻击者地址、从受害地址到该地址的完整追踪链路、受害方身份与联系人，最好由受害项目方、交易所或执法机构通过发行方公布的渠道提交。</p>'],
  ['（算一算）一笔资金被拆成 4 份，各 25 万美元：A 份留在 USDT；B 份经 DEX 换成 ETH 后进入交易所；C 份经桥到另一条链（只能按金额时间匹配，置信度 0.7）后进入交易所；D 份进入混币器。假设 A、B 份所在机构都配合，C 份所在交易所要求置信度至少 0.8 才冻结。最多能冻结多少？', '<p>A 份：发行方可冻结，25 万。B 份：DEX 兑换高置信度，到交易所后可冻结，25 万。C 份：整体置信度不超过 0.7，低于 0.8 的门槛，需要先补强证据（例如桥的消息 ID 或交易所内部记录），否则冻结不了。D 份：混币后追踪中断。最多冻结 <strong>50 万美元</strong>；补强 C 份证据后可达 75 万。</p>']
])}
${checklist([
  '能说出三条经典聚类启发式的逻辑、适用模型和常见误判。',
  '能解释资金穿过 DEX、跨链桥、跨链兑换、混币器、交易所时分别用什么证据继续追。',
  '能为一条多跳路径逐跳标置信度，并算出整体置信度。',
  '能列出至少四类冻结方及其机制，并说明为什么窗口以小时计。',
  '能用 Etherscan 独立追踪一段公开攻击路径，写出带证据的追踪表。',
  '能说出链上取证的隐私与法律边界。'
])}
${terms([
  ['资金追踪', 'Fund tracing', '沿链上转账逐跳确定资金去向的分析。'],
  ['地址聚类', 'Address clustering', '根据行为规律推断多个地址属于同一控制者。'],
  ['共同输入所有权启发式', 'Common-input-ownership heuristic', 'UTXO 交易的多个输入通常属于同一控制者的假设。'],
  ['找零识别', 'Change detection', '在 UTXO 交易的输出中识别出付给自己的找零输出。'],
  ['充值地址复用启发式', 'Deposit-address reuse heuristic', '多个地址向同一交易所充值地址转账时，推断它们属于同一用户。'],
  ['污点分析', 'Taint analysis', '计算混合后的资金中有多少来自可疑来源的方法，口径有 poison、haircut、FIFO 等。'],
  ['冻结', 'Freeze / Blacklist', '有权限的一方让地址或账户中的资产不能再移动。'],
  ['混币器', 'Mixer', '把多人的资金按固定面额混合后再取出，切断链上存取关联的服务。']
])}
` });
})();
