/* ---------- M01 区块链基础 & Go 后端 ---------- */
CUR = 'm01';
addCh({ id: 'm01', code: 'M01', group: 'core', nav: '区块链基础 & Go 后端', title: 'M01 区块链基础 & Go 后端', html: `
<h1>M01 区块链基础 & Go 后端</h1>
${meta(['解释哈希、默克尔树、共识如何让账本难以篡改。', '说清 UTXO 和账户模型的差别，走完一笔交易的生命周期。', '设计一个能处理链重组的 Go 区块索引器。'], '<a href="#m00">M00 Web3 是什么</a>', ['hashchain', 'confirm'])}

<h2>1. 一句话理解</h2>
${one('区块链 = 用哈希串起来的区块 + 让陌生人对“下一个区块”达成一致的共识规则。')}
${call('analogy', `<p>想象一本多人共享的流水账，每一页的页脚写着“上一页内容的指纹”。如果有人偷偷改了第 5 页，第 5 页的指纹就变了，第 6 页页脚的记录就对不上，后面每一页都对不上。</p>
<p>要让篡改不被发现，他必须重写第 5 页之后的所有页，而且要比全网所有诚实记账人写得更快。这就是 PoW 的安全来源。</p>`)}

<h2>2. 三个密码学积木</h2>
<h3>2.1 哈希函数</h3>
<p>哈希函数（Hash Function）把任意长度的输入变成固定长度的输出。比特币和以太坊都依赖它的三个性质：</p>
${tbl(['性质', '含义', '在区块链中的作用'], [
  ['确定性', '同样的输入永远得到同样的输出', '任何节点都能独立验证区块'],
  ['雪崩效应', '输入改 1 位，输出约一半位改变', '改动无法“微调”隐藏'],
  ['单向性', '从输出无法反推输入', 'PoW 只能靠暴力尝试 nonce']
])}
<h3>2.2 默克尔树</h3>
<p>默克尔树（Merkle Tree）把一个区块里的所有交易两两哈希，最后得到一个根哈希（Merkle Root）。区块头只存这个根。</p>
${mm('默克尔树：用 log₂(n) 个哈希证明一笔交易在区块里', `
flowchart TB
  R["Merkle Root<br/>写入区块头"]
  H12["H(1+2)"] --> R
  H34["H(3+4)"] --> R
  H1["H(Tx1)"] --> H12
  H2["H(Tx2)"] --> H12
  H3["H(Tx3)"] --> H34
  H4["H(Tx4)"] --> H34
  T1["Tx1"] --> H1
  T2["Tx2"] --> H2
  T3["Tx3 ← 要证明它"] --> H3
  T4["Tx4"] --> H4
  style T3 stroke-width:3px
  style H4 stroke-dasharray: 5 5
  style H12 stroke-dasharray: 5 5
`, [
  ['flow', '要证明 Tx3 在区块里，只需提供 H(Tx4) 和 H(1+2) 两个哈希（虚线框）。验证者自己算出根，和区块头对比。'],
  ['key', '轻节点（例如手机钱包）只下载区块头，靠默克尔证明验证交易。这叫 SPV。'],
  ['limit', '默克尔证明只能证明“交易存在”，不能证明“交易不存在”。证明不存在需要排序树或其他结构。']
])}
<h3>2.3 数字签名</h3>
<p>比特币和以太坊使用椭圆曲线签名 ECDSA（曲线 secp256k1）。私钥签名，公钥验证。任何人都能验证签名，但只有私钥持有人能生成签名。以太坊的地址是公钥 Keccak-256 哈希的后 20 字节。</p>

<h2>3. 共识：谁来写下一个区块</h2>
${tbl(['维度', '工作量证明 PoW（比特币）', '权益证明 PoS（以太坊）'], [
  ['谁出块', '最先算出合格哈希的矿工', '被随机选中的验证者（质押 32 ETH）'],
  ['攻击成本', '控制 > 50% 算力', '控制 > 1/3 质押可阻止最终性；> 2/3 可最终确定错误链'],
  ['惩罚', '浪费电费', '罚没（Slashing）质押的 ETH'],
  ['最终性', '概率性：确认数越多越安全', '经济最终性：约 2 个 epoch（约 12.8 分钟）'],
  ['出块间隔', '约 10 分钟', '12 秒（一个 slot）']
])}
<p>PoS 的最终性在 M04 有交互实验。本章先看 PoW 的核心：挖矿就是不停改 nonce，直到区块哈希满足难度要求。</p>
${lab('hashchain')}

<h2>4. 两种账本模型：UTXO 与账户</h2>
${mm('UTXO 模型 vs 账户模型', `
flowchart LR
  subgraph U["UTXO 模型（比特币）"]
    I1["输入：UTXO 0.7 BTC"] --> T["交易"]
    I2["输入：UTXO 0.5 BTC"] --> T
    T --> O1["输出：给 Bob 1.0 BTC"]
    T --> O2["输出：找零 0.19 BTC"]
    T -.-> F["差额 0.01 = 矿工费"]
  end
  subgraph A["账户模型（以太坊）"]
    S1["Alice 余额 5 ETH<br/>nonce 7"] -->|"转 1 ETH"| S2["Alice 余额 3.99 ETH<br/>nonce 8"]
    S3["Bob 余额 2 ETH"] --> S4["Bob 余额 3 ETH"]
  end
`, [
  ['flow', 'UTXO：每笔交易消费旧“硬币”，产出新“硬币”。余额 = 你所有未花费输出之和。'],
  ['flow', '账户：链上直接存余额。每个账户有 nonce，nonce 每笔交易加 1。'],
  ['fail', '账户模型的 nonce 必须连续。如果 nonce 7 卡住，nonce 8、9 都会卡住。这是钱包后端最常见的故障。见 M08。'],
  ['limit', 'UTXO 天然并行、隐私更好；账户模型更适合智能合约。']
])}

<h2>5. 交易生命周期和链重组</h2>
${mm('一笔以太坊交易的状态', `
stateDiagram-v2
  state "已签名" as Signed
  state "内存池" as Pool
  state "被替换" as Replaced
  state "丢弃" as Dropped
  state "已打包" as Included
  state "已确认 N 个区块" as Confirmed
  state "已最终确定" as Final
  [*] --> Signed
  Signed --> Pool: 广播到节点
  Pool --> Replaced: 同 nonce 更高费用
  Pool --> Dropped: 费用过低或超时
  Pool --> Included: 出块者选中
  Included --> Pool: 链重组（区块被孤立）
  Included --> Confirmed: 后续区块堆叠
  Confirmed --> Final: PoS 2 个 epoch
  Final --> [*]
  Replaced --> [*]
  Dropped --> [*]
`, [
  ['key', '“已打包”不是终点。链重组（Reorg）会把交易退回内存池，甚至让它消失。'],
  ['fail', '如果后端在“已打包”时就给用户入账，重组后就会出现“链上没收到，账本已入账”。'],
  ['risk', '攻击者利用重组做双花：先在交易所充值并提走其他币，再用私下挖的更长链抹掉充值交易。']
])}
<p>为什么交易所要等 N 个确认？因为攻击者重写 N 个区块的成功率随 N 指数下降。下面的实验用中本聪白皮书第 11 节的公式计算这个概率。</p>
${lab('confirm')}

<h2>6. Go 后端：区块索引器</h2>
<p>几乎所有 Web3 后端（钱包、交易所、浏览器、数据平台）都需要一个<strong>索引器（Indexer）</strong>：它扫描区块，把关心的事件写进数据库。Go 是这个领域的主流语言：go-ethereum（Geth）本身就是 Go 写的，<code>ethclient</code> 可以直接复用。</p>
${mm('索引器架构：扫块、解析、处理重组、入库', `
flowchart LR
  RPC["RPC 节点<br/>eth_getBlockByNumber<br/>eth_getLogs"] --> F["Fetcher<br/>按高度拉块"]
  F --> RC{"父哈希<br/>与库中一致？"}
  RC -->|"是"| P["Parser<br/>解码 Transfer 事件"]
  RC -->|"否：发生重组"| RB["Rollback<br/>回退到共同祖先"]
  RB --> F
  P --> DB[("PostgreSQL<br/>blocks / transfers")]
  DB --> CF["Confirmer<br/>确认数 ≥ N 才推送"]
  CF --> MQ[["Kafka<br/>deposit.confirmed"]]
  MQ --> BIZ["业务服务<br/>钱包 / 账本"]
`, [
  ['flow', '数据从 RPC 进入，经过“父哈希校验”这一道门。只有链连续时才解析和入库。'],
  ['fail', '最常见的三个故障：RPC 节点落后或返回不一致数据；漏块（扫描跳号）；重组未回退。'],
  ['key', '入库 ≠ 通知业务。只有确认数达到阈值，Confirmer 才发出 deposit.confirmed 事件。'],
  ['limit', '单 RPC 节点是单点。生产环境至少接入 2 家节点服务，并交叉校验区块哈希。']
])}
<p>核心循环的 Go 代码（简化版，省略错误重试）：</p>
${code('GO', `
func (ix *Indexer) Run(ctx context.Context) error {
    next := ix.store.LastHeight() + 1
    for {
        head, err := ix.client.BlockNumber(ctx)
        if err != nil { return err }
        if next > head { time.Sleep(2 * time.Second); continue }

        blk, err := ix.client.BlockByNumber(ctx, big.NewInt(int64(next)))
        if err != nil { return err }

        // 1. 检查父哈希。不一致说明发生了重组。
        if prev := ix.store.HashAt(next - 1); prev != (common.Hash{}) && blk.ParentHash() != prev {
            next = ix.rollback(ctx, next-1) // 回退到共同祖先，返回下一个要扫的高度
            continue
        }

        // 2. 在一个数据库事务里写入区块和事件，保证幂等。
        if err := ix.store.SaveBlock(ctx, blk, ix.parseTransfers(blk)); err != nil { return err }

        // 3. 把 head - N 之前的事件标记为已确认，并发出消息。
        ix.confirmUpTo(ctx, head-ix.confirmations)
        next++
    }
}
`)}
${call('deep', `<p><strong>幂等（Idempotency）</strong>：同一个区块被处理两次，结果必须和处理一次一样。做法：用 <code>(tx_hash, log_index)</code> 做唯一键；入账时用 <code>INSERT ... ON CONFLICT DO NOTHING</code>。</p>
<p><strong>回退</strong>：从当前高度往回找，直到库里的区块哈希等于链上同高度的区块哈希。删除（或标记作废）之后的所有记录。如果被删的记录已经通知过业务，要发出“撤销”事件。</p>`)}

<h2>7. 故障与边界</h2>
${tbl(['故障', '现象', '根因', '防护'], [
  ['重组未处理', '用户余额多出来，链上没有', '只看区块高度，不比对父哈希', '父哈希校验 + 确认数阈值'],
  ['漏块', '某些充值永远不到账', '并发扫块时跳过了失败的高度', '按高度顺序推进；定时全量对账'],
  ['RPC 数据不一致', '同一高度两次请求结果不同', '负载均衡后面的节点进度不同', '固定节点会话；交叉校验'],
  ['重复入账', '一笔充值入账两次', '重启后重新扫描，缺少唯一键', '(tx_hash, log_index) 唯一约束'],
  ['事件解码错误', '金额差 10^12 倍', '代币精度（decimals）按 18 处理，但 USDT 是 6', '从合约读 decimals 并缓存']
])}

${terms([
  ['哈希函数', 'Hash Function', '把任意输入映射为固定长度输出的单向函数'],
  ['默克尔树', 'Merkle Tree', '两两哈希构成的树，根哈希代表全部叶子'],
  ['工作量证明', 'PoW, Proof of Work', '通过消耗算力竞争出块权的共识'],
  ['权益证明', 'PoS, Proof of Stake', '通过质押资产获得出块和投票权的共识'],
  ['UTXO', 'Unspent Transaction Output', '未花费的交易输出，比特币的记账单位'],
  ['Nonce（账户）', 'Account Nonce', '账户已发送交易的计数，保证交易顺序和不可重放'],
  ['链重组', 'Reorg', '节点切换到另一条更长或更重的链，部分区块被孤立'],
  ['确认数', 'Confirmations', '交易所在区块之后又产生的区块数 + 1'],
  ['索引器', 'Indexer', '扫描链上数据并写入可查询数据库的服务'],
  ['幂等', 'Idempotency', '同一操作执行多次，结果与执行一次相同']
])}
${qs(['在<a href="#lab-confirm">确认数实验</a>中，把攻击者算力调到 30%。要让成功率低于 0.1%，需要多少个确认？为什么算力达到 50% 时确认数完全无效？', '你的索引器在高度 100 发现父哈希不一致。写出回退的步骤。', '为什么用 <code>(tx_hash, log_index)</code> 做唯一键，而不是只用 <code>tx_hash</code>？'])}
` });

/* ---------- M02 智能合约开发 ---------- */
CUR = 'm02';
addCh({ id: 'm02', code: 'M02', group: 'core', nav: '智能合约开发', title: 'M02 智能合约开发：EVM、Solidity 与合约安全', html: `
<h1>M02 智能合约开发：EVM、Solidity 与合约安全</h1>
${meta(['说清 EVM 如何执行合约、Gas 如何计费、存储为什么贵。', '识别重入、预言机操纵、权限失控三类高危漏洞。', '按工具链完成一个合约从编写、测试到部署的全过程，并做上线前安全自查（系统的审计方法见选修篇 <a href="#m02-62">M02.10</a>）。'], '<a href="#m01">M01 区块链基础</a>')}

<h2>1. 一句话理解</h2>
${one('智能合约是部署在链上、任何人都能调用、谁也不能私自修改的程序。本模块教你写它、测它、守住它；用合约搭出来的金融协议（DeFi）在 <a href="#m13">M05 DeFi 协议</a>。')}
${call('analogy', `<p>智能合约像一台自动售货机。投币、按按钮、出货，规则写死在机器里，没有店员。</p>
<p>比喻的局限：售货机坏了可以找厂家；合约有漏洞，资金被转走后通常追不回来。</p>`)}

<h2>2. EVM：合约怎么运行</h2>
${mm('一次合约调用的执行路径', `
sequenceDiagram
  autonumber
  participant U as 用户钱包
  participant N as 节点 EVM
  participant C as Token 合约
  participant S as 合约存储
  U->>N: 发送交易 to=合约 data=transfer(bob,100)
  N->>N: 校验签名、nonce、余额是否够付 Gas 上限
  N->>C: 加载字节码，按函数选择器跳转
  C->>S: SLOAD 读取 balances[alice]
  C->>C: require(余额 >= 100)
  C->>S: SSTORE 写 balances[alice] 和 balances[bob]
  C-->>N: emit Transfer 事件（写入日志）
  N-->>U: 回执 status=1 gasUsed=51234
`, [
  ['flow', '交易的 data 字段前 4 字节是函数选择器（函数签名的 Keccak 哈希前 4 字节），后面是 ABI 编码的参数。'],
  ['key', '存储读写最贵：SSTORE 把 0 改成非 0 基础要 20,000 Gas，本交易首次（冷）访问该槽再加 2,100，共约 22,100 Gas（见 <a href="#m02-6">M02.7</a>），而一次加法只要 3 Gas。所以合约设计要尽量少写存储。'],
  ['fail', '如果 require 失败，整笔交易回滚（Revert），状态不变，但已消耗的 Gas 不退。'],
  ['limit', '合约不能主动执行。它只在被交易调用时运行。定时任务需要外部 Keeper 触发。']
])}
${code('SOLIDITY', `
// 最小可用的代币余额转账（教学用，省略事件与授权）
contract MiniToken {
    mapping(address => uint256) public balanceOf;

    function transfer(address to, uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;   // 先改状态
        balanceOf[to] += amount;
    }
}
`)}

<h2>3. 三类高危漏洞</h2>
<h3>3.1 重入攻击</h3>
${mm('重入攻击：在余额清零之前再次调用提款', `
sequenceDiagram
  participant A as 攻击合约
  participant V as 有漏洞的金库
  A->>V: withdraw()
  V->>V: 读 balance[A] = 1 ETH
  V->>A: call 转出 1 ETH（触发 A 的 receive）
  A->>V: receive 中再次调用 withdraw()
  V->>V: balance[A] 仍是 1 ETH
  V->>A: 再转 1 ETH
  Note over A,V: 循环直到金库被掏空
  V->>V: 最后才执行 balance[A] = 0
`, [
  ['risk', '根因：先转账，后改状态。外部调用把控制权交给了攻击者。2016 年 6 月 The DAO 因此被转走超过 360 万 ETH。' + cite('CoinDesk：Understanding The DAO Attack（2016）', 'https://www.coindesk.com/learn/2016/06/25/understanding-the-dao-attack/')],
  ['key', '防护：检查-生效-交互（Checks-Effects-Interactions）顺序；加重入锁（ReentrancyGuard）。']
])}
<h3>3.2 预言机操纵</h3>
<p>预言机（Oracle）把链外价格送进链上。如果借贷协议直接读某个 DEX 池子的即时价格，攻击者可以用闪电贷（Flash Loan）在一笔交易里砸盘、借款、还款。防护：使用 Chainlink 等聚合预言机，或使用时间加权平均价格（TWAP）。</p>
<h3>3.3 权限失控</h3>
<p>很多合约有管理员函数（升级、暂停、改参数）。如果管理员私钥被盗，“去中心化协议”会瞬间变成攻击者的提款机。防护：多签 + 时间锁（Timelock）。见 M08。</p>

<h2>4. 故障与边界</h2>
${tbl(['事件（年份）', '类型', '因果链'], [
  ['The DAO（2016）', '重入', '先转账后记账 → 递归提款 → 超过 360 万 ETH 被转走 → 以太坊硬分叉' + cite('CoinDesk：Understanding The DAO Attack（2016）', 'https://www.coindesk.com/learn/2016/06/25/understanding-the-dao-attack/')],
  ['bZx（2020）', '预言机操纵', '闪电贷砸盘 → 借贷协议读到错误价格 → 超额借款' + cite('The Block：bZx 再遭攻击（2020-02-18）', 'https://www.theblock.co/news/defi/2020-02-18-bzx-attacked-again-645k-in-eth-estimated-to-be-lost-56207')],
  ['Euler（2023）', '逻辑漏洞', 'donateToReserves 函数缺少健康检查 → 构造坏账仓位 → 约 1.97 亿美元损失（攻击者后来归还了全部可追回资金）' + cite('The Block：Euler 攻击者归还全部可追回资金', 'https://theblock.co/post/224705/euler-hacker-returns-funds')]
])}
${call('warn', '<p>审计不等于安全。审计只覆盖审计时的代码和审计员想到的场景。上线前至少做到：单元测试 + 模糊测试（Foundry fuzz）+ 外部审计 + 漏洞赏金 + 管理权限多签和时间锁。</p>')}

${terms([
  ['智能合约', 'Smart Contract', '部署在链上、按代码规则执行的程序'],
  ['EVM', 'Ethereum Virtual Machine', '以太坊执行合约字节码的虚拟机'],
  ['Gas', 'Gas', '衡量计算和存储消耗的单位，用户按 Gas 付费'],
  ['重入', 'Reentrancy', '外部调用在状态更新前再次进入同一函数'],
  ['闪电贷', 'Flash Loan', '在同一笔交易内借出并归还的无抵押贷款'],
  ['预言机', 'Oracle', '把链外数据写入链上的服务']
])}
${call('info', '<p>本模块在公共基础部分：EVM、Solidity、工具链、代币标准和合约安全 I 所有方向必修；Gas 优化标为选修（上线前再读），合约安全 II 和审计方法标为选修（做合约开发或安全审计时读）。学完后，去 <a href="#m13">M05 DeFi 协议</a> 看这些合约怎样组合成稳定币、AMM 和借贷。</p>')}
` });
