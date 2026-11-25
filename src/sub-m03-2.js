/* ---------- M08 子文章（二）：多签、MPC、Nonce 管理 ---------- */
(() => {
CUR = 'm03-4';
addCh({ id: 'm03-4', nav: '多签钱包', title: 'M08.4 多签钱包：Safe 架构、签名流程与运营安全', desc: '拆解 Safe 合约与 EIP-712 签名，复盘 Bybit 事件，给出多签运营清单。', html: `
<h1>M08.4 多签钱包：Safe 架构、签名流程与运营安全</h1>
${meta(['画出 Safe 的代理 + 单例架构，说清 owners、threshold、nonce、模块、守卫各自的作用。', '走完一笔多签交易的生命周期，并能计算 EIP-712 SafeTx 哈希。', '根据 2025 年 Bybit 等事件，制定多签运营流程与最佳实践清单。'], '<a href="#m03-3">M08.3 交易签名与广播</a>、<a href="#m02-1">M02.1 智能合约与 EVM</a>', ['threshold'])}
${beginner(`<p><strong>多签（Multisig）</strong>：一个账户需要 n 个持有人里至少 m 个签名才能转账，写作 m-of-n，例如 2-of-3。</p>
<p><strong>代理合约（Proxy）</strong>：一个很小的合约，自己不写业务逻辑，把所有调用转交给另一个“实现合约”执行，但数据存在代理自己身上。</p>
<p><strong>delegatecall</strong>：EVM 的一种调用方式：执行别人的代码，但读写的是“我自己”的存储。代理合约靠它工作，它也是最危险的操作之一。</p>
<p><strong>EIP-712</strong>：结构化数据签名标准。钱包能把要签的内容按字段显示出来，而不是一串看不懂的哈希。</p>
<p><strong>门限（Threshold）</strong>：多签里需要的最少签名数 m。</p>`)}

<h2>1. 一句话理解</h2>
${one('Safe 多签是一个智能合约账户：它把“谁是主人、需要几个人同意”存在链上，每笔交易收集够 m 个签名后，由合约自己检查并执行。')}
${call('analogy', `<p>像公司的银行对公账户：开户时登记 3 位授权签字人，规定“任意 2 人签字才能付款”。每张付款单都有连续编号（nonce），银行柜员（合约）逐个核对签字后才放款。</p>
<p>类比的局限：银行柜员会看付款单上写的是什么；Safe 合约只核对签名是否有效，不判断这笔交易“合不合理”。签字人签了恶意内容，合约照样执行。</p>`)}
${art('一图看懂：Safe 是链上合约账户，凑够 m 个所有者签名才放行', 660, 330, [
  S.text(85, 20, '3 个所有者', { size: 13, b: 1, anchor: 'middle' }),
  S.box(10, 44, 150, 52, { k: 'ok', icon: 'person', t: '所有者 A', s: '已签名' }),
  S.box(10, 108, 150, 52, { k: 'ok', icon: 'person', t: '所有者 B', s: '已签名' }),
  S.box(10, 172, 150, 52, { k: 'idle', dash: 1, icon: 'person', t: '所有者 C', s: '没签，也够了' }),
  S.zone(240, 26, 240, 246, { t: 'Safe 代理合约 · 链上', k: 'info' }),
  S.box(256, 48, 208, 42, { k: 'tint', mono: 1, t: 'owners', s: 'A · B · C' }),
  S.box(256, 102, 208, 42, { k: 'key', mono: 1, t: 'threshold = 2', s: '2-of-3，凑够才放行' }),
  S.box(256, 156, 208, 42, { k: 'tint', mono: 1, t: 'nonce = 7', s: '每执行一笔 +1' }),
  S.box(256, 212, 208, 46, { k: 'warn', icon: 'wallet', t: '金库资产', s: 'ETH · USDT' }),
  S.arrow(162, 70, 238, 70, { k: 'ok' }), S.arrow(162, 134, 238, 134, { k: 'ok' }), S.arrow(162, 198, 238, 198, { k: 'idle', dash: 1 }),
  S.box(530, 82, 120, 76, { k: 'idle', dash: 1, icon: 'code', t: 'Safe 单例', s: '逻辑代码\n只部署一次' }),
  S.arrow(482, 120, 528, 120, { dash: 1 }),
  S.text(590, 176, 'delegatecall', { size: 11, anchor: 'middle', dim: 1 }),
  S.text(330, 306, '2-of-3：任意 2 个签名 → 合约检查通过 → 才转出资产（示例）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '每个所有者各自签同一笔交易（EIP-712）。签名收够 threshold 个，合约检查后才执行。'],
  ['key', '合约里只存三样东西：owners、threshold、nonce。执行逻辑放在共用的单例合约里，代理通过 delegatecall 借用。'],
  ['risk', '合约只核对签名是否有效，不判断交易内容是否合理。签字人没看清就签，照样放行（Bybit 事件）。'],
  ['limit', '本图没画模块（Module）和守卫（Guard）。模块可以绕过签名，启用前要格外小心。']
], '三个所有者里两人签名后，Safe 代理合约检查门限并动用金库资产，代码逻辑放在共用的单例合约里', 'm03-4')}

<h2>2. Safe 合约架构</h2>
<p>Safe（原名 Gnosis Safe）是以太坊生态使用最广的多签合约，据 Safe 基金会 2026 年第一季度报告，Safe 智能账户持有的资产约 352 亿美元，账户数约 6,100 万。${cite('Safe 基金会：2026 年第一季度报告', 'https://safefoundation.org/blog/safe-q1-2026-quarterly-report')}它的结构如下（Safe 与 ERC-4337、EIP-7702 的关系见 <a href="#m06-5">M08.8 账户抽象深入</a>）：</p>
${mm('Safe 代理 + 单例架构', `
flowchart TB
  F["SafeProxyFactory<br/>CREATE2 部署代理"] -->|"createProxyWithNonce"| P1["Safe 代理 A<br/>存储：owners threshold nonce"]
  F --> P2["Safe 代理 B<br/>另一个金库"]
  P1 -->|"delegatecall"| S["Safe 单例合约<br/>所有逻辑代码 只部署一次"]
  P2 -->|"delegatecall"| S
  P1 --> M["模块 Module<br/>可绕过签名直接执行"]
  P1 --> G["守卫 Guard<br/>执行前后检查"]
  P1 --> FH["回退处理器<br/>Fallback Handler"]
  O1["所有者 1"] -.->|"签名"| P1
  O2["所有者 2"] -.->|"签名"| P1
  O3["所有者 3"] -.->|"签名"| P1
`, [
  ['flow', '每个 Safe 是一个很小的代理合约，存储槽 0 记录单例地址。所有调用通过 delegatecall 执行单例的代码，但读写代理自己的存储。'],
  ['key', '单例只部署一次，每个新 Safe 只需部署一个代理，部署成本低。CREATE2 让同一参数在不同链上得到相同地址。'],
  ['risk', '谁能改写存储槽 0，谁就能把整个 Safe 的逻辑换成自己的代码。Bybit 事件中攻击者正是通过一笔 delegatecall 交易改写了它。'],
  ['risk', '模块可以调用 execTransactionFromModule，完全绕过签名检查。启用一个恶意或有漏洞的模块 = 交出金库。'],
  ['limit', 'Safe 只能部署在支持 EVM 合约的链上，比特币、Solana 需要各自的多签方案（比特币的 P2WSH / Taproot 多签与 PSBT 协作签名见 <a href="#m05-61">M06.2 SegWit·Taproot·PSBT</a>）。']
])}
${tbl(['组件', '作用', '如何修改', '风险提示'], [
  ['owners', '所有者列表，合约内用链表存储（哨兵地址 0x1）', 'addOwnerWithThreshold / removeOwner / swapOwner，必须通过 Safe 自身交易', '换人操作本身也要 m 个签名'],
  ['threshold', '门限 m，1 ≤ m ≤ owners 数量', 'changeThreshold', '门限 1 等于单签'],
  ['nonce', 'Safe 自己的交易序号，每执行一笔 +1', '执行交易时自动递增', '和 EOA 的 nonce 是两回事；同 nonce 只能执行一笔'],
  ['模块 Module', '扩展功能：定时支付、角色权限、社交恢复', 'enableModule / disableModule', '模块执行不需要所有者签名'],
  ['守卫 Guard', '每笔交易执行前后调用 checkTransaction / checkAfterExecution', 'setGuard', '守卫有 bug 会让 Safe 无法执行任何交易'],
  ['回退处理器', '处理 Safe 未实现的调用，如 EIP-1271 签名验证、接收 NFT 回调', 'setFallbackHandler', '指向恶意合约会带来风险']
])}

<h2>3. 一笔多签交易的生命周期</h2>
${mm('提议 → 收集签名 → 执行', `
sequenceDiagram
  participant A as 提议人 所有者1
  participant UI as Safe 前端
  participant TS as 交易服务 链下
  participant B as 所有者2 硬件钱包
  participant SAFE as Safe 合约
  A->>UI: 填写 to value data
  UI->>UI: 读取 Safe nonce 计算 safeTxHash
  A->>UI: 用 EIP-712 签名 safeTxHash
  UI->>TS: 提交交易数据和签名1
  B->>TS: 拉取待签交易
  B->>B: 本地独立重算 safeTxHash 并模拟
  B->>TS: 提交签名2
  A->>SAFE: execTransaction 附带签名1和签名2
  SAFE->>SAFE: checkSignatures 验证 2 个签名
  SAFE->>SAFE: nonce 加 1 然后执行调用
`, [
  ['flow', '签名收集在链下完成，不花 Gas。只有最后一步 execTransaction 上链，执行者付 Gas，执行者可以是任何人。'],
  ['key', '交易服务（Safe Transaction Service）只是“公告板”，不持有任何密钥。它被篡改时最多给你看错误的数据，所以每个签名者都必须在本地独立重算哈希。'],
  ['fail', '同一个 Safe nonce 上有两笔待签交易，先执行的生效，另一笔作废。'],
  ['risk', 'operation = 1（DelegateCall）的交易会以 Safe 的身份执行目标合约代码，可以改写所有者、单例地址。除非明确需要，签名者应拒绝任何 delegatecall。']
])}
<p><code>execTransaction</code> 的参数：<code>to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, signatures</code>。<code>signatures</code> 是多个 65 字节签名的拼接，必须<strong>按所有者地址从小到大排序</strong>，合约用这个顺序防止同一个所有者被计数两次。</p>

<h3>3.1 EIP-712 SafeTx 哈希怎么算</h3>
${steps([
  'domainSeparator = keccak256(abi.encode(DOMAIN_TYPEHASH, chainId, safe地址))，其中 DOMAIN_TYPEHASH = keccak256("EIP712Domain(uint256 chainId,address verifyingContract)") = <code>0x47e79534…469218</code>。chainId 和 Safe 地址进入哈希，签名不能跨链、跨 Safe 重放。',
  'structHash = keccak256(abi.encode(SAFE_TX_TYPEHASH, to, value, keccak256(data), operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, nonce))，其中 SAFE_TX_TYPEHASH = <code>0xbb8310d4…1286d8</code>。',
  'safeTxHash = keccak256(0x19 ‖ 0x01 ‖ domainSeparator ‖ structHash)。',
  '每个所有者对 safeTxHash 签名。硬件钱包如果支持 EIP-712 解析，会显示 to、value、operation 等字段；不支持时只显示两个哈希，签名者必须在另一台独立设备上重算并比对。'
])}
${code('GO', `
// 独立计算 Safe 交易哈希：签名者在本地比对，不信任前端
import (
    "math/big"

    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/crypto"
)

var (
    domainTypeHash = crypto.Keccak256([]byte("EIP712Domain(uint256 chainId,address verifyingContract)"))
    safeTxTypeHash = crypto.Keccak256([]byte("SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"))
)

func word(b []byte) []byte      { return common.LeftPadBytes(b, 32) }
func u256(x *big.Int) []byte     { return word(x.Bytes()) }
func addr(a common.Address) []byte { return word(a.Bytes()) }

type SafeTx struct {
    To, GasToken, RefundReceiver          common.Address
    Value, SafeTxGas, BaseGas, GasPrice   *big.Int
    Nonce                                 *big.Int
    Data                                  []byte
    Operation                             uint8 // 0 = Call, 1 = DelegateCall
}

func SafeTxHash(chainID *big.Int, safe common.Address, t SafeTx) common.Hash {
    domain := crypto.Keccak256(domainTypeHash, u256(chainID), addr(safe))
    st := crypto.Keccak256(
        safeTxTypeHash, addr(t.To), u256(t.Value), crypto.Keccak256(t.Data),
        word([]byte{t.Operation}), u256(t.SafeTxGas), u256(t.BaseGas), u256(t.GasPrice),
        addr(t.GasToken), addr(t.RefundReceiver), u256(t.Nonce),
    )
    return common.BytesToHash(crypto.Keccak256([]byte{0x19, 0x01}, domain, st))
}
`)}
<p>结果应与 Safe 合约的 <code>getTransactionHash(...)</code> 返回值一致。运营中可以把这段代码做成离线小工具：签名者在独立电脑上输入交易参数，比对硬件钱包屏幕上显示的哈希。</p>

<h2>4. 风险案例：签名者被骗签名</h2>
<p>多签的密码学很少被攻破。近几年的大额损失几乎都来自“签名者签了自己没看懂的交易”。</p>
${tbl(['时间', '事件', '损失量级', '攻击方式'], [
  ['2024 年 7 月', 'WazirX（印度交易所）', '约 2.3 亿美元', '据 WazirX 初步报告，多签签名者看到的界面（Liminal 托管平台）与实际交易内容不一致，签署了修改合约逻辑的交易；WazirX 与 Liminal 对责任归属各执一词' + cite('TechCrunch：WazirX 确认 2.3 亿美元安全事件', 'https://techcrunch.com/2024/07/18/indias-wazirx-confirms-security-breach-after-230-million-suspicious-transfer') + cite('CoinDesk：WazirX 与 Liminal 互相指责', 'https://www.coindesk.com/business/2024/07/19/wazirx-liminal-custody-blame-each-other-as-230m-crypto-exploit-leaves-customers-stranded')],
  ['2024 年 10 月', 'Radiant Capital（借贷协议）', '约 5,000 万美元', '至少 3 名开发者设备被植入恶意软件，硬件钱包签署了伪装成正常操作的转移所有权交易' + cite('Radiant Capital 官方复盘', 'https://medium.com/@RadiantCapital/radiant-post-mortem-fecd6cd38081')],
  ['2025 年 2 月', 'Bybit（交易所）冷钱包', '约 15 亿美元（约 40 万 ETH 及衍生品）', 'Safe{Wallet} 前端代码被篡改，签名者签了一笔 delegatecall 交易' + cite('Bybit 官方事件时间线', 'https://www.bybit.com/en/learn/this-week-in-bybit/bybit-security-incident-timeline') + cite('Safe 生态基金会声明', 'https://safefoundation.org/blog/safe-ecosystem-foundation-statement')],
])}
${mm('2025 年 Bybit 事件攻击链', `
flowchart TB
  A1["攻击者入侵 Safe 前端开发者电脑"] --> A2["向 Safe 前端的 JS 文件注入恶意代码<br/>只针对 Bybit 的 Safe 地址生效"]
  A2 --> A3["Bybit 运营发起一次常规冷转热调拨"]
  A3 --> A4["前端显示正常的转账<br/>实际构造 delegatecall 交易"]
  A4 --> A5["签名者用硬件钱包签名<br/>设备只显示哈希 盲签"]
  A5 --> A6["Safe 执行 delegatecall<br/>攻击合约改写存储槽 0"]
  A6 --> A7["Safe 单例被替换为攻击者合约"]
  A7 --> A8["攻击者调用自己的函数<br/>转走全部 ETH 和代币"]
`, [
  ['flow', '攻击没有破解任何私钥，也没有利用 Safe 合约漏洞。它篡改了签名者“看到的东西”。' + cite('Safe 生态基金会声明', 'https://safefoundation.org/blog/safe-ecosystem-foundation-statement') + cite('BlockSec：Bybit 事件技术分析', 'https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history')],
  ['fail', '第一个能拦截的点：交易的 operation = 1（DelegateCall），目标是陌生合约。普通调拨不应出现 delegatecall。'],
  ['fail', '第二个能拦截的点：签名者在独立设备上重算 safeTxHash，会发现与硬件钱包显示的不一致。'],
  ['risk', '恶意代码只对特定地址生效，其他用户和测试环境看不到异常。“我昨天用着还好”不能证明今天安全。'],
  ['key', 'FBI 将该事件归因于朝鲜（FBI 称之为 TraderTraitor，属 Lazarus 相关组织）。' + cite('FBI 公告：朝鲜对 Bybit 约 15 亿美元盗窃负责', 'https://www.ic3.gov/PSA/2025/PSA250226') + '国家级攻击者会花数月准备，流程必须假设前端、电脑、网络都可能被攻破。']
])}

<h2>5. 运营流程：时间锁、角色分离、签名者管理</h2>
<h3>5.1 谁持有密钥</h3>
<ul>
<li><strong>签名者独立</strong>：每个签名者使用独立的硬件钱包，硬件钱包只用于签名，不用于日常浏览。</li>
<li><strong>地理分布</strong>：签名者分布在不同城市或国家，避免一次物理事件（火灾、绑架、司法扣押）同时影响 m 个人。</li>
<li><strong>角色分布</strong>：不要让 m 个签名者都向同一个人汇报。例如 3-of-5：CEO、CFO、CTO、外部顾问、托管机构各 1 把。</li>
<li><strong>备份</strong>：每把钥匙的助记词离线备份，与硬件钱包分开存放；门限设计要满足“丢 n − m 把仍能动用”。</li>
</ul>
<p>用下面的实验感受门限选择：切换到“链上多签（Safe）”，比较 2-of-3 和 3-of-5 能容忍的丢失数和被盗数。</p>
${lab('threshold')}
<h3>5.2 时间锁与角色分离</h3>
${mm('金库权限分层（示例）', `
flowchart LR
  subgraph L1["日常运营"]
    R1["Roles 模块<br/>只允许向白名单地址转 USDC<br/>单笔不超过 5 万"]
  end
  subgraph L2["常规支出"]
    S1["Safe 3-of-5<br/>任意交易"]
  end
  subgraph L3["高危操作"]
    T1["时间锁 48 小时<br/>改所有者 升级合约 启用模块"]
  end
  OPS["运营热钱包 EOA"] --> R1
  R1 --> SAFE["金库 Safe"]
  S1 --> SAFE
  S1 -->|"排队"| T1
  T1 -->|"延迟到期后执行"| SAFE
  MON["监控机器人"] -.->|"发现异常 告警并取消"| T1
`, [
  ['flow', '把权限按风险分层：小额例行操作走受限角色，常规支出走多签，改变权限的操作再加时间锁。'],
  ['key', '时间锁的价值是“给人反应时间”：48 小时内社区或监控发现异常交易，可以由另一组签名者取消。'],
  ['limit', '时间锁会拖慢紧急操作（如漏洞修复）。常见做法是设一个“只能暂停、不能转账”的紧急角色。'],
  ['risk', '角色模块配置错误（例如允许任意 data）会变成后门。模块配置变更本身必须走最高级别审批。']
])}
<p>常用组件：Zodiac Roles Modifier（按地址、函数、参数限制权限）、Zodiac Delay Modifier（时间锁模块）、OpenZeppelin TimelockController（合约管理员时间锁）。</p>

<h3>5.3 算一算：门限与风险（示例）</h3>
${steps([
  '3-of-5 多签：可容忍丢失 = 5 − 3 = 2 把，可容忍被盗 = 3 − 1 = 2 把。',
  '假设每个签名者一年内设备被攻破的概率独立为 5%。攻击者需要同时攻破 3 个：概率 ≈ C(5,3) × 0.05³ × 0.95² = 10 × 0.000125 × 0.9025 ≈ 0.11%。',
  '对比 2-of-3：需要攻破 2 个，概率 ≈ C(3,2) × 0.05² × 0.95 + 0.05³ = 0.007125 + 0.000125 ≈ 0.73%。',
  '结论：3-of-5 被盗概率约为 2-of-3 的 1/6。但这个计算假设“独立”。如果所有签名者都用同一个被篡改的前端（Bybit 情形），概率不再独立，门限的保护大幅下降。'
])}

${tryit(`<p>① 在 Sepolia 测试网打开 app.safe.global，用两个测试钱包创建一个 2-of-2 Safe。② 发起一笔 0.001 ETH 转账，签名时在钱包弹窗里找到 <code>operation</code>、<code>nonce</code>、<code>safeTxHash</code>。③ 用第二个钱包确认并执行。④ 在 sepolia.etherscan.io 打开这个 Safe 地址，找到 <code>ExecutionSuccess</code> 事件，确认其中的 txHash 与你签名时看到的 safeTxHash 一致。⑤ 进阶：用上面的 Go 代码离线计算同一笔交易的哈希并比对。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['签名者使用独立硬件钱包，并开启 EIP-712 解析', '防止盲签', '抽查签名记录，确认设备屏幕显示了字段'],
  ['签名前在独立设备重算 safeTxHash', '防止前端被篡改', '签名 SOP 中有比对截图或记录'],
  ['默认拒绝 operation = 1（DelegateCall）', 'delegatecall 可以改写 Safe 存储', '守卫合约拦截，或签名工具高亮警告'],
  ['签名前做交易模拟（如 Tenderly）', '看到余额和存储的真实变化', '模拟结果附在审批单中'],
  ['高危操作加时间锁，监控队列', '给人反应时间', '告警机器人订阅时间锁事件'],
  ['定期审计 owners、threshold、modules、guard', '发现未授权变更', '每日脚本比对链上配置与基线']
])}
${mistakes([
  ['多签合约安全，所以多签金库就安全', '合约只检查签名数量。近年大额损失来自签名者被骗签名，而不是合约漏洞。'],
  ['硬件钱包签名就不会被骗', '硬件钱包只显示它能解析的内容。显示哈希时，用户无法判断交易内容。'],
  ['Safe 交易服务保管着签名，所以它被黑了会丢钱', '交易服务不持有私钥。它被黑的风险是展示错误数据，所以签名者要独立校验。'],
  ['门限越高越安全', '门限过高时，丢失几把钥匙就会冻结资金。门限要同时考虑丢失和被盗。'],
  ['启用模块和普通交易一样', '模块可以绕过签名直接执行任意交易，启用模块是最高风险操作之一。']
])}
${recap([
  'Safe = 代理 + 单例：代理存数据，单例存代码，存储槽 0 指向单例。',
  '链上状态：owners、threshold、nonce、modules、guard；签名在链下收集，最后一次性 execTransaction。',
  'safeTxHash 是 EIP-712 哈希，包含 chainId、Safe 地址和 nonce，防止重放。',
  'Bybit 事件：前端被篡改 + 盲签 + delegatecall，约 15 亿美元损失，合约本身没有漏洞。',
  '运营要点：签名者独立分布、本地重算哈希、拒绝 delegatecall、交易模拟、时间锁与角色分层。'
])}
${quiz([
  { q: 'Safe 代理合约通过什么方式执行单例合约的代码？', o: ['call', 'staticcall', 'delegatecall', 'selfdestruct'], a: 2, why: 'delegatecall 让代理执行单例的代码，同时读写代理自己的存储。这也是 delegatecall 交易能改写 Safe 存储的原因。' },
  { q: '下列哪项操作不需要满足 Safe 门限签名就能执行交易？', o: ['execTransaction', '已启用模块调用 execTransactionFromModule', 'changeThreshold', 'swapOwner'], a: 1, why: '已启用的模块可以直接执行交易，不检查所有者签名。其余三项都必须通过满足门限的 execTransaction 执行。' },
  { q: 'Bybit 事件中，哪个检查最可能在签名前发现异常？', o: ['检查 Gas 价格', '检查交易的 operation 字段为 1（DelegateCall），并在独立设备重算 safeTxHash', '检查区块高度', '检查 ETH 价格'], a: 1, why: '恶意交易使用 delegatecall 调用攻击合约，前端显示的内容是假的。独立重算哈希和检查 operation 能发现不一致。' },
  { q: '为什么 safeTxHash 中包含 chainId 和 Safe 地址？', o: ['为了节省 Gas', '防止同一个签名在其他链或其他 Safe 上被重放', '让交易更快被打包', '为了兼容比特币'], a: 1, why: 'domainSeparator 绑定 chainId 和 verifyingContract（Safe 地址），签名只对这条链上的这个 Safe 有效。' }
])}
${exercises([["（示例）一个 Safe 设置为 4-of-7。它最多能容忍丢失几把钥匙？最多能容忍几把被盗而资金仍安全？", "<p>可容忍丢失 = 7 − 4 = <strong>3 把</strong>：剩下 4 把仍达到门限。可容忍被盗 = 4 − 1 = <strong>3 把</strong>：攻击者凑不够 4 个签名。注意这个结论假设签名者相互独立。所有签名者使用同一个被篡改的前端时，门限保护会大幅下降。</p>"], ["为什么 execTransaction 的 signatures 必须按所有者地址从小到大排序？如果不要求排序会有什么风险？", "<p>合约按排序后的顺序逐个校验签名，并要求地址严格递增。这样同一个所有者的签名不能被计数两次。不要求排序时，攻击者可能把一个所有者的签名重复拼接，凑出假的“m 个签名”。</p>"], ["为一个 3-of-5 金库设计签名前的检查步骤，要求能拦住 Bybit 那类攻击。", "<p>第一步：检查 <code>operation</code>，默认拒绝 1（DelegateCall），普通调拨不应出现它。第二步：在独立设备上用交易参数重算 safeTxHash，与硬件钱包屏幕显示的值比对。第三步：做交易模拟，看余额和存储的真实变化，把结果附在审批单中。第四步：改所有者、启用模块等高危操作走时间锁，由监控机器人订阅队列事件。</p>"]])}
${checklist(["能画出 Safe 的代理 + 单例架构，说明存储槽 0 和 delegatecall 的作用。", "能说出 owners、threshold、nonce、模块、守卫、回退处理器各自如何修改、有什么风险。", "能写出 safeTxHash 的三步计算，并解释 chainId 和 Safe 地址为什么进入哈希。", "能复述 Bybit 事件攻击链，并指出两个可以在签名前拦截的点。", "在 Sepolia 上创建过 2-of-2 Safe，并确认 ExecutionSuccess 事件中的哈希与签名时看到的 safeTxHash 一致。"])}
${terms([
  ['Safe', 'Safe (formerly Gnosis Safe)', '以太坊生态最常用的多签智能合约账户'],
  ['单例合约', 'Singleton', '所有 Safe 代理共享的逻辑实现合约'],
  ['safeTxHash', 'Safe Transaction Hash', 'Safe 交易的 EIP-712 哈希，所有者对它签名'],
  ['模块', 'Module', '被 Safe 授权、可以不经签名直接执行交易的合约'],
  ['守卫', 'Guard', '在每笔 Safe 交易执行前后做额外检查的合约'],
  ['时间锁', 'Timelock', '交易排队后必须等待固定时间才能执行的机制'],
  ['交易服务', 'Safe Transaction Service', '链下收集和展示待签名 Safe 交易的服务'],
  ['DelegateCall 操作', 'Operation = 1', '以 Safe 身份执行目标合约代码的交易类型']
])}
` });

CUR = 'm03-5';
addCh({ id: 'm03-5', nav: 'MPC 与门限签名', title: 'M08.5 MPC 与门限签名：私钥从不完整出现', desc: '从秘密分享到 DKG、门限 ECDSA、密钥刷新，再到节点部署与已知漏洞。', html: `
<h1>M08.5 MPC 与门限签名：私钥从不完整出现</h1>
${meta(['用 Shamir 秘密分享和加法分享的数字例子，解释“分片”是什么。', '描述 DKG、门限 ECDSA 签名、密钥刷新的流程，说出 GG20、CMP、DKLs、FROST 的定位。', '对比 MPC、多签、HSM，设计 MPC 节点部署架构并识别已知漏洞类型。'], '<a href="#m03-4">M08.4 多签钱包</a>、<a href="#m03-3">M08.3 交易签名与广播</a>', ['threshold'])}
${beginner(`<p><strong>MPC（Multi-Party Computation，多方安全计算）</strong>：多个参与方一起算出一个结果，但每一方都看不到别人的输入。</p>
<p><strong>分片（Share）</strong>：私钥被“拆”成的一部分。单个分片看起来就是随机数，不泄露私钥的任何信息。</p>
<p><strong>门限（Threshold）</strong>：t-of-n 表示 n 个分片里任意 t 个合作就能签名。</p>
<p><strong>多项式（Polynomial）</strong>：形如 f(x) = a₀ + a₁x 的式子。两点确定一条直线，这是 Shamir 分享的核心直觉。</p>
<p><strong>零知识证明（Zero-Knowledge Proof）</strong>：证明“我按规则做了”，但不泄露具体数据。MPC 协议靠它防止参与方作弊。</p>`)}

<h2>1. 一句话理解</h2>
${one('MPC 钱包把私钥拆成多个分片放在不同地方。签名时各方按协议交换消息，共同算出一个标准签名。私钥在生成、使用、备份的任何时刻都不完整出现。')}
${call('analogy', `<p>像一张藏宝图被撕成 3 片，交给 3 个人，规定任意 2 片拼起来才能找到宝藏。MPC 更进一步：2 个人不需要真的把碎片拼在一起，他们各自在自己的碎片上做计算，交换计算结果，就能直接挖出宝藏，谁也没见过完整的地图。</p>
<p>类比的局限：藏宝图碎片可以复印；MPC 分片可以“刷新”，刷新后旧碎片全部作废，而宝藏地址（公钥和链上地址）不变。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m03-5"><div class="mmd-title"><span>一图看懂：多签与 MPC 的区别</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 250" role="img" aria-label="多签与 MPC 门限签名对比"><rect x="10" y="10" width="365" height="230" rx="10" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="192" y="34" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">多签（如 Safe 2/3）</text><rect x="40" y="50" width="80" height="50" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><g fill="none" stroke="var(--risk)" stroke-width="3"><circle cx="56" cy="68" r="9"/><path d="M65 68 h26 v8 M77 68 v6"/></g><text x="80" y="94" font-size="10.5" text-anchor="middle" fill="var(--ink)">完整私钥 1</text><rect x="140" y="50" width="80" height="50" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><g fill="none" stroke="var(--risk)" stroke-width="3"><circle cx="156" cy="68" r="9"/><path d="M165 68 h26 v8 M177 68 v6"/></g><text x="180" y="94" font-size="10.5" text-anchor="middle" fill="var(--ink)">完整私钥 2</text><rect x="240" y="50" width="80" height="50" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><g fill="none" stroke="var(--risk)" stroke-width="3"><circle cx="256" cy="68" r="9"/><path d="M265 68 h26 v8 M277 68 v6"/></g><text x="280" y="94" font-size="10.5" text-anchor="middle" fill="var(--ink)">完整私钥 3</text><line x1="80" y1="102" x2="160" y2="150" stroke="var(--ink-2)" stroke-width="2"/><path d="M160.0 150.0 L152.0 149.3 L155.6 143.3 z" fill="var(--ink-2)"/><line x1="180" y1="102" x2="180" y2="150" stroke="var(--ink-2)" stroke-width="2"/><path d="M180.0 150.0 L176.5 142.8 L183.5 142.8 z" fill="var(--ink-2)"/><text x="250" y="132" font-size="11" text-anchor="middle" fill="var(--ink-2)">各自签名</text><rect x="100" y="152" width="180" height="46" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><text x="190" y="172" font-size="12.5" text-anchor="middle" fill="var(--ink)" font-weight="700">链上合约验证</text><text x="190" y="189" font-size="11" text-anchor="middle" fill="var(--ink)">数够 2 个签名才执行</text><text x="192" y="226" font-size="12" text-anchor="middle" fill="var(--ink-2)">链上能看到多个签名和规则</text><rect x="385" y="10" width="365" height="230" rx="10" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="567" y="34" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">MPC 门限签名（2/3）</text><rect x="415" y="50" width="80" height="50" rx="8" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="455" y="72" font-size="12" text-anchor="middle" fill="var(--ink)" font-weight="700">分片 1</text><text x="455" y="90" font-size="10.5" text-anchor="middle" fill="var(--ink-2)">不是私钥</text><rect x="515" y="50" width="80" height="50" rx="8" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="555" y="72" font-size="12" text-anchor="middle" fill="var(--ink)" font-weight="700">分片 2</text><text x="555" y="90" font-size="10.5" text-anchor="middle" fill="var(--ink-2)">不是私钥</text><rect x="615" y="50" width="80" height="50" rx="8" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="655" y="72" font-size="12" text-anchor="middle" fill="var(--ink)" font-weight="700">分片 3</text><text x="655" y="90" font-size="10.5" text-anchor="middle" fill="var(--ink-2)">不是私钥</text><line x1="455" y1="102" x2="540" y2="150" stroke="var(--ink-2)" stroke-width="2"/><path d="M540.0 150.0 L532.0 149.5 L535.4 143.4 z" fill="var(--ink-2)"/><line x1="555" y1="102" x2="555" y2="150" stroke="var(--ink-2)" stroke-width="2"/><path d="M555.0 150.0 L551.5 142.8 L558.5 142.8 z" fill="var(--ink-2)"/><text x="626" y="132" font-size="11" text-anchor="middle" fill="var(--ink-2)">多方协同计算</text><rect x="475" y="152" width="180" height="46" rx="8" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="565" y="172" font-size="12.5" text-anchor="middle" fill="var(--ink)" font-weight="700">一个普通签名</text><text x="565" y="189" font-size="11" text-anchor="middle" fill="var(--ink)">链上看起来像普通账户</text><text x="567" y="226" font-size="12" text-anchor="middle" fill="var(--ink-2)">完整私钥从来没有在任何地方出现过</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>多签：多把完整私钥各签一次，由链上合约数签名。MPC：多个分片一起计算，直接产出一个普通签名。</span></li><li><span class="chip key">关键</span><span>多签的规则在链上、透明但只适用于支持合约的链；MPC 在链下完成，适用于任何链，但规则不在链上公开。</span></li><li><span class="chip risk">风险</span><span>MPC 的安全依赖实现质量：分片刷新、通信协议出错都会削弱安全性。</span></li></ul></figcaption></figure>

<h2>2. 秘密分享：分片是怎么来的</h2>
<h3>2.1 Shamir 秘密分享（算一算，示例）</h3>
<p>目标：秘密 s = 1234，做 2-of-3 分享。</p>
${steps([
  '随机选一条直线 f(x) = 1234 + 166x。截距 f(0) 就是秘密，斜率 166 是随机数。',
  '给 3 个人各发一个点：分片 1 = f(1) = 1400，分片 2 = f(2) = 1566，分片 3 = f(3) = 1732。',
  '只拿到 1 个点（例如 1400）：过这个点的直线有无数条，截距可以是任何数，秘密完全未知。',
  '拿到 2 个点 (1, 1400) 和 (3, 1732)：斜率 = (1732 − 1400) ÷ (3 − 1) = 166，截距 = 1400 − 166 × 1 = 1234。秘密恢复。',
  '推广：t-of-n 用 t − 1 次多项式，任意 t 个点用拉格朗日插值恢复 f(0)。真实系统在一个大素数的有限域里计算，而不是普通整数。'
])}
<h3>2.2 加法分享</h3>
<p>更简单的 n-of-n 方案：私钥 x = x₁ + x₂ + x₃（mod n）。例子：x = 100，三个分片可以是 37、81、−18（模运算下为正数）。三个人都参与才能凑出 x。很多 MPC 协议在签名时会把 Shamir 分片临时转换成加法分片，方便计算。</p>
${call('warn', `<p><strong>“Shamir 分享私钥”不等于 MPC。</strong>有些产品把一把现成的私钥用 Shamir 拆开备份，签名时再把分片拼回完整私钥。拼回的那一刻，私钥完整出现在一台机器的内存里，单点风险回来了。真正的 MPC 钱包：私钥由 DKG 分布式生成，签名由协议完成，任何时刻都不重组。</p>`)}

<h2>3. 分布式密钥生成与门限签名</h2>
<h3>3.1 DKG：没有人见过完整私钥</h3>
${mm('分布式密钥生成 DKG（2-of-3 直观流程）', `
sequenceDiagram
  participant P1 as 节点1
  participant P2 as 节点2
  participant P3 as 节点3
  P1->>P1: 生成随机数 a1 和多项式 f1
  P2->>P2: 生成随机数 a2 和多项式 f2
  P3->>P3: 生成随机数 a3 和多项式 f3
  P1->>P2: 私密发送 f1 在点2的值 并广播承诺
  P1->>P3: 私密发送 f1 在点3的值 并广播承诺
  P2->>P1: 同样发送 f2 的点值和承诺
  P3->>P1: 同样发送 f3 的点值和承诺
  P1->>P1: 校验收到的点值与承诺一致
  P1->>P1: 自己的分片 = 收到的点值求和
  P1-->>P3: 广播公钥分量 a1 乘 G
  P3->>P3: 全体公钥 = 各公钥分量之和
`, [
  ['flow', '每个节点贡献一个随机数。总私钥 = a1 + a2 + a3，但没有任何一方知道全部三个数，所以没有人知道总私钥。'],
  ['key', '公钥可以公开计算：各方广播 aᵢ × G，相加就是总公钥，由此得出链上地址。'],
  ['fail', '承诺（Commitment）和校验步骤防止某个节点发送不一致的数据。缺少校验时，恶意节点可以让其他人得到错误分片。'],
  ['limit', '真实协议（如 Pedersen DKG、Feldman VSS）还要处理掉线、超时、作恶节点识别，这里只画了主线。']
])}
<h3>3.2 门限 ECDSA 为什么难</h3>
<p>回忆 ECDSA：s = k⁻¹ × (z + r × d)。分片下 d 和 k 都是“拆开的”。加法容易（各自相加），但 <strong>k⁻¹ × d</strong> 是两个秘密的乘积和逆元，不能各算各的。协议需要专门的子协议把“乘法分享”转成“加法分享”（MtA，Multiplicative-to-Additive），常用 Paillier 同态加密或不经意传输（OT）实现，并附带零知识证明防止作弊。</p>
${mm('门限 ECDSA 签名的多轮流程（直观）', `
flowchart TB
  REQ["签名请求<br/>消息哈希 z"] --> PRE["预签名阶段 可离线提前做<br/>各方生成 k 的分片 交换加密数据"]
  PRE --> MTA["MtA 子协议<br/>把 k 与 d 的乘积转成加法分片<br/>附零知识证明"]
  MTA --> R["联合计算 R = k × G<br/>得到 r"]
  R --> ON["在线阶段<br/>各方算出 s 的分片"]
  ON --> AGG["聚合 s = 各分片之和"]
  AGG --> VER["用总公钥验证 r s<br/>失败则定位作恶方"]
  VER --> OUT["输出 1 个标准 ECDSA 签名"]
`, [
  ['flow', '大部分计算在预签名阶段完成，与具体消息无关；拿到消息后只需 1 轮左右的在线通信。'],
  ['key', '输出是一个普通的 secp256k1 签名，链上无法分辨它来自 MPC 还是单私钥。'],
  ['risk', '零知识证明缺失或实现错误时，恶意参与方可以在若干次签名后提取其他人的分片。2023 年的 BitForge 就是这一类。'],
  ['fail', '预签名数据只能使用一次。重复使用同一份预签名，相当于 k 重复，会直接泄露私钥。']
])}
<h3>3.3 协议名称速查</h3>
${tbl(['协议', '年份', '签名类型', '特点'], [
  ['Lindell17', '2017', 'ECDSA 2-of-2', '两方协议，结构简单；常用于“用户 + 服务商”钱包'],
  ['GG18 / GG20', '2018 / 2020', 'ECDSA t-of-n', 'Gennaro 与 Goldfeder 提出；GG20 支持预签名和识别作恶方；开源实现广泛（如 tss-lib）'],
  ['CGGMP21（CMP）', '2020–2021', 'ECDSA t-of-n', '支持预签名后 1 轮在线签名、可识别中止、主动安全（密钥刷新）；Fireblocks 的 MPC-CMP 基于此'],
  ['DKLs（DKLs19 / DKLs23）', '2019 / 2023', 'ECDSA', '基于不经意传输（OT），不用 Paillier，计算快'],
  ['FROST', '2020', 'Schnorr / EdDSA', '两轮门限 Schnorr；适用于 Ed25519（Solana）和比特币 Taproot']
])}

<h2>4. 密钥刷新、重分片与部署架构</h2>
<p><strong>密钥刷新（Key Refresh / Proactive Refresh）</strong>：各方共同生成一组“和为 0”的随机数，加到各自分片上。总私钥不变、公钥和地址不变，但每个分片都变成新值。攻击者周一偷走分片 1，周三偷走分片 2，只要中间做过刷新，两个分片属于不同“纪元”，拼不出私钥。</p>
<p><strong>重分片（Resharing）</strong>：改变 t 或 n，例如从 2-of-3 变成 3-of-5，或撤销离职员工手里的分片。地址保持不变，不需要转移资金。</p>
${mm('MPC 节点部署架构（示例：2-of-3）', `
flowchart LR
  subgraph CLOUD["云端 节点 A"]
    A["MPC 节点 A<br/>运行在可信执行环境 TEE<br/>分片加密存于 KMS"]
  end
  subgraph IDC["自建机房 节点 B"]
    B["MPC 节点 B<br/>分片由 HSM 封装<br/>只允许内网访问"]
  end
  subgraph MOBILE["审批人手机 节点 C"]
    C["MPC 共签 App<br/>分片存于手机安全区<br/>生物识别后参与签名"]
  end
  WS["钱包服务"] -->|"签名请求 + 审批凭证"| A
  A <-->|"mTLS 协议消息"| B
  A <-->|"中继 协议消息"| C
  BK["离线备份<br/>分片加密后存保险柜"] -.->|"灾备恢复"| B
`, [
  ['flow', '三个分片放在三种不同的信任域：云厂商、自有机房、个人设备。攻击者需要同时攻破两种完全不同的环境。'],
  ['key', '自动化提币可以设计成“A + B”签名；大额或人工审批走“A + C”或“B + C”。门限组合本身就是审批规则。'],
  ['fail', '节点间网络中断，签名停止。监控要覆盖每个节点的在线状态和协议轮次超时。'],
  ['risk', '如果三个节点运行同一份代码、由同一个运维账号管理，攻击者攻破运维账号就等于攻破全部节点。信任域要真正独立。'],
  ['limit', '备份分片也是分片。备份管理不严，等于凭空多了一个可被盗的节点。']
])}
${tbl(['对比项', 'MPC 门限签名', '链上多签（Safe）', 'HSM'], [
  ['单点故障', '无（t ≥ 2）', '无（m ≥ 2）', '设备本身是单点，靠集群和备份'],
  ['链上表现', '普通单签地址', '合约地址，签名者公开', '普通单签地址'],
  ['多链支持', '支持所有使用 ECDSA / EdDSA 的链', '仅支持合约链，每链部署', '取决于设备支持的曲线'],
  ['Gas 成本', '与单签相同', '更高（合约验证签名）', '与单签相同'],
  ['更换参与者', '重分片，地址不变', '链上交易换 owner', '重新生成密钥需转移资金'],
  ['审计透明度', '链下日志，外部看不到', '链上完全可查', '设备日志'],
  ['实现复杂度', '高，协议与实现都可能有漏洞', '低，合约成熟', '中，依赖厂商'],
  ['合规认证', '较新，部分机构接受', '开源审计', 'FIPS 140-2/140-3 等认证成熟']
])}
<p>MPC 与 TEE 在钱包之外的用途（隐私计算、区块构建），以及全同态加密（FHE），见 <a href="#m10-6">M07.6 MPC、FHE 与 TEE</a>。</p>

<h2>5. 已知漏洞与事故</h2>
${tbl(['类型', '事件 / 年份', '原理', '防护'], [
  ['缺失零知识证明', 'BitForge，Fireblocks 2023 年 8 月披露（CVE-2023-33241 等）' + cite('Fireblocks：GG18/GG20 Paillier 密钥漏洞技术报告', 'https://www.fireblocks.com/blog/gg18-and-gg20-paillier-key-vulnerability-technical-report') + cite('NVD：CVE-2023-33241', 'https://nvd.nist.gov/vuln/detail/CVE-2023-33241'), 'GG18/GG20 实现没有证明 Paillier 模数结构正确，恶意方经过少量签名即可提取他人分片', '使用修复后的库；协议实现必须经过专业审计'],
  ['证明参数不足', 'TSSHOCK，Verichains 2023 年披露' + cite('Verichains：TSSHOCK', 'https://verichains.io/tsshock/'), '部分 tss-lib 分支的离散对数证明安全参数不足，可被伪造', '升级依赖，检查证明迭代次数'],
  ['预签名重用 / 随机数问题', '多个实现中出现过', '同一 k 被用于两次签名，私钥可解出', '预签名一次性使用，数据库标记已消耗'],
  ['运营中心化', 'Multichain 跨链桥，2023 年 7 月，约 1.26 亿美元（首轮异常流出）' + cite('The Block：Multichain 约 1.26 亿美元资产异常流出', 'https://www.theblock.co/post/238299/multichain-warning-outflow'), '据项目方事后声明，MPC 节点服务器运行在 CEO 个人云账户下，负责人被带走后团队失去访问权，资金随后异常转出' + cite('Blockworks：Multichain 创始人及家属掌握全部密钥', 'https://blockworks.co/news/multichain-founder-family-arrested'), '分片由独立主体持有；定期证明分片分布']
])}
${call('info', `<p>MPC 的安全 = 协议安全 × 实现安全 × 运营安全。协议论文正确，不代表某个开源库实现正确；库实现正确，不代表分片真的分布在相互独立的人和机器上。</p>`)}
${tryit(`<p>① 打开本手册的门限实验，选择“MPC 门限签名”，设 n = 3、m = 2。② 把“服务器 A”标记为被盗：结论应提示“重新分片，让被盗分片失效，地址不变”。③ 切换到“链上多签”，对比提示变成“转移资金或更换签名者”。④ 再阅读开源库 <code>bnb-chain/tss-lib</code> 的 README，找到它支持的协议名称（GG18/GG20 相关），对照本文第 3.3 节。</p>`)}
${lab('threshold')}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['使用经过审计且已修复 2023 年漏洞的 MPC 库或供应商', 'BitForge 类漏洞可提取分片', '审计报告 + 依赖版本核对'],
  ['分片位于不同信任域（云、机房、设备）', '避免一次入侵拿到 t 个分片', '架构评审 + 权限矩阵'],
  ['每季度执行密钥刷新，人员变动时立即重分片', '缩短被盗分片的有效期', '刷新日志与公钥不变校验'],
  ['预签名数据一次性使用', '重复使用等于 k 重复', '数据库唯一约束 + 告警'],
  ['签名节点独立校验审批凭证和策略', '钱包服务被攻破时仍能拦截', '渗透测试：伪造请求应被拒绝'],
  ['定期演练用备份分片恢复', '确认备份可用', '恢复后公钥一致，且能签测试交易']
])}
${mistakes([
  ['MPC 就是把私钥用 Shamir 拆开存', '把私钥拆开备份、使用时拼回，是秘密分享而非 MPC。MPC 签名时私钥从不重组。'],
  ['MPC 协议有数学证明，所以不会有漏洞', '2023 年 BitForge、TSSHOCK 都是实现层漏洞。协议安全不等于库安全。'],
  ['MPC 地址泄露一个分片就要换地址', '执行密钥刷新或重分片即可让旧分片作废，地址不变。'],
  ['MPC 比多签全面更好', 'MPC 链上不透明、实现复杂；多签透明、成熟。金库常用多签，高频多链业务常用 MPC。']
])}
${recap([
  'Shamir：t − 1 次多项式，t 个点恢复截距；加法分享：分片之和等于秘密。',
  'DKG 让各方共同生成私钥，没有任何一方见过完整私钥；公钥由各方公钥分量相加得到。',
  '门限 ECDSA 难在 k⁻¹ × d 的乘法，需要 MtA 子协议和零知识证明；输出是标准签名。',
  'GG18/GG20、CMP、DKLs 用于 ECDSA，FROST 用于 Schnorr/EdDSA。',
  '密钥刷新让旧分片作废、地址不变；分片必须分布在独立信任域。',
  '主要风险：实现漏洞（BitForge）、预签名重用、运营中心化（Multichain）。'
])}
${quiz([
  { q: '2-of-3 Shamir 分享，分片 (1, 50) 和 (2, 70)。秘密是多少？', o: ['20', '30', '50', '70'], a: 1, why: '斜率 = (70 − 50) ÷ (2 − 1) = 20，截距 = 50 − 20 × 1 = 30。' },
  { q: '密钥刷新完成后，下列哪项保持不变？', o: ['每个参与方的分片值', '公钥和链上地址', '预签名数据', '参与方之间的会话密钥'], a: 1, why: '刷新给每个分片加上和为 0 的随机数，总私钥不变，所以公钥和地址不变，分片全部更新。' },
  { q: '为什么门限 ECDSA 比门限 Schnorr 更复杂？', o: ['ECDSA 签名更长', 'ECDSA 公式含 k 的逆元与私钥的乘积，不能直接对分片做线性运算', 'ECDSA 不支持多方', 'Schnorr 不需要随机数'], a: 1, why: 'Schnorr 签名对私钥是线性的，分片可以直接相加；ECDSA 中 k⁻¹ × d 是非线性的，需要 MtA 子协议。' },
  { q: '一家交易所要支持比特币、以太坊、Tron、Solana 的热钱包自动提币，并希望员工离职时不换地址。最合适的方案是？', o: ['每条链各部署一个 Safe', 'MPC 门限签名', '纸钱包', '单台服务器存放明文私钥'], a: 1, why: 'MPC 支持所有 ECDSA/EdDSA 链，并可通过重分片撤销离职员工的分片而不更换地址。Safe 只适用于 EVM 链。' },
  { q: 'BitForge 漏洞的根本原因属于哪一类？', o: ['助记词泄露', '实现缺少必要的零知识证明', '区块链分叉', 'Gas 费过高'], a: 1, why: '受影响实现没有验证 Paillier 密钥的正确性证明，恶意参与方可借此提取其他方的分片。' }
])}
${exercises([["（示例）2-of-3 Shamir 分享，你拿到分片 (1, 500) 和 (4, 1100)。秘密是多少？请验证。", "<p>斜率 = (1100 − 500) ÷ (4 − 1) = 200。截距 = 500 − 200 × 1 = <strong>300</strong>，秘密 s = 300。验证：f(1) = 300 + 200 = 500，f(4) = 300 + 800 = 1100，两点都在直线上。真实系统在大素数有限域里计算。</p>"], ["攻击者周一偷走 MPC 分片 1，周三偷走分片 2，门限是 2-of-3。周二团队做过一次密钥刷新。攻击者能签名吗？为什么？", "<p>不能。刷新时各方共同生成一组和为 0 的随机数，加到各自分片上。总私钥、公钥和地址不变，但所有分片都换成新值。周一的分片属于旧纪元，周三的分片属于新纪元，两者拼不出私钥。所以要定期刷新，并在人员变动时立即重分片。</p>"], ["一家公司用 2-of-3 MPC：节点 A 在云端 TEE，节点 B 在自建机房 HSM，节点 C 在审批人手机。设计自动提币和大额提币分别用哪两个节点，并指出最容易被忽视的风险。", "<p>自动小额提币用 <strong>A + B</strong>，无需人工。大额或人工审批走 <strong>A + C</strong> 或 <strong>B + C</strong>，门限组合本身就是审批规则。最容易被忽视的风险：三个节点运行同一份代码、由同一个运维账号管理，攻破这个账号就等于攻破全部节点。另外，离线备份分片也是分片，管理不严等于多了一个可被盗的节点。</p>"]])}
${checklist(["能用两个 Shamir 分片手算出秘密，并说明为什么一个分片不泄露任何信息。", "能区分“Shamir 拆私钥备份”和真正的 MPC 钱包，说出前者的单点风险。", "能解释门限 ECDSA 难在 k⁻¹ × d，以及 MtA 子协议和零知识证明的作用。", "能说出 GG18/GG20、CMP、DKLs、FROST 各自适用的签名类型。", "能从单点故障、链上表现、更换参与者、审计透明度四方面对比 MPC、Safe 和 HSM。"])}
${terms([
  ['秘密分享', 'Secret Sharing', '把秘密拆成多个分片，满足门限才能恢复的方案'],
  ['Shamir 秘密分享', 'Shamir Secret Sharing', '基于多项式插值的 t-of-n 秘密分享'],
  ['分布式密钥生成', 'DKG, Distributed Key Generation', '多方共同生成密钥，无人知道完整私钥'],
  ['门限签名', 'TSS, Threshold Signature Scheme', 't 个分片协作生成一个标准签名'],
  ['MtA', 'Multiplicative-to-Additive', '把两方秘密的乘积转换为加法分享的子协议'],
  ['预签名', 'Presignature', '与消息无关、可提前计算、只能使用一次的签名中间数据'],
  ['密钥刷新', 'Key Refresh', '更新所有分片但保持公钥不变的操作'],
  ['重分片', 'Resharing', '改变门限参数或参与方，同时保持公钥不变'],
  ['可信执行环境', 'TEE, Trusted Execution Environment', 'CPU 提供的隔离执行区，如 Intel SGX、AWS Nitro Enclaves']
])}
` });

CUR = 'm03-6';
addCh({ id: 'm03-6', nav: 'Nonce 管理', title: 'M08.6 Nonce 管理：为什么企业钱包会卡单', desc: '理解 pending/latest、空洞与替换交易，设计数据库 + Redis 的 nonce 分配器。', html: `
<h1>M08.6 Nonce 管理：为什么企业钱包会卡单</h1>
${meta(['说清 nonce 规则、pending 与 latest 的区别，以及卡单的 4 种原因。', '用同 nonce 替换交易完成加速和取消，检测并填补 nonce 空洞。', '实现基于 PostgreSQL + Redis 锁的 nonce 分配器，并处理服务重启恢复。'], '<a href="#m03-3">M08.3 交易签名与广播</a>', ['nonce'])}
${beginner(`<p><strong>Nonce</strong>：账户发出的交易序号，从 0 开始，每笔 +1。以太坊用它保证交易按顺序执行、不被重放。</p>
<p><strong>内存池（Mempool / Txpool）</strong>：节点暂存“已收到、未打包”交易的地方。</p>
<p><strong>卡单（Stuck Transaction）</strong>：交易长时间停在内存池里不被打包。</p>
<p><strong>替换交易（Replacement）</strong>：用相同 nonce、更高费用的新交易顶替旧交易。</p>
<p><strong>分布式锁（Distributed Lock）</strong>：多台服务器之间保证“同一时刻只有一个进程做某件事”的机制。</p>`)}

<h2>1. 一句话理解</h2>
${one('以太坊账户的交易必须按 nonce 0、1、2… 一个不差地上链。前面一笔卡住或缺失，后面的全部排队等待。企业钱包每天发几千笔交易，nonce 管理决定了它会不会“堵车”。')}
${call('analogy', `<p>像银行叫号：叫到 43 号，43 号人不在（缺失）或者材料不全（费用太低），44、45、46 号就算到了也只能等。解决办法：43 号补齐材料（加速），或者让 43 号直接办一个“空业务”（取消），队伍才能继续前进。</p>
<p>类比的局限：银行可以跳号；以太坊协议不允许跳过任何 nonce。</p>`)}
${art('一图看懂：nonce 像叫号，一个卡住，后面全部排队', 660, 296, [
  S.pill(175, 8, 120, 26, 'latest = 42', { k: 'ok' }),
  S.pill(454, 8, 120, 26, 'pending = 45', { k: 'risk' }),
  S.arrow(235, 36, 235, 60, { k: 'ok' }), S.arrow(514, 36, 514, 60, { k: 'risk' }),
  S.box(10, 62, 78, 70, { k: 'ok', mono: 1, t: '40', s: '已上链' }),
  S.box(103, 62, 78, 70, { k: 'ok', mono: 1, t: '41', s: '已上链' }),
  S.box(196, 62, 78, 70, { k: 'ok', mono: 1, t: '42', s: '可打包' }),
  S.box(289, 62, 78, 70, { k: 'risk', mono: 1, t: '43', s: '费用过低', tag: '卡住' }),
  S.box(382, 62, 78, 70, { k: 'idle', mono: 1, t: '44', s: '被 43 堵住' }),
  S.box(475, 62, 78, 70, { k: 'risk', dash: 1, mono: 1, t: '45', s: '缺失 · 空洞' }),
  S.box(568, 62, 78, 70, { k: 'idle', mono: 1, t: '46', s: '永远排队' }),
  S.box(10, 192, 215, 52, { k: 'key', icon: 'db', t: '真相来源：自己的数据库', s: 'latest 用来对账' }),
  S.box(250, 192, 156, 52, { k: 'ok', icon: 'bolt', t: '加速', s: '费用 ≥ +10%' }),
  S.box(436, 192, 156, 52, { k: 'ok', icon: 'check', t: '填洞', s: '补发一笔 nonce 45' }),
  S.arrow(328, 190, 328, 134, { k: 'ok' }), S.arrow(514, 190, 514, 134, { k: 'ok' }),
  S.text(330, 276, '示例：nonce 必须 40、41、42 一个不差地上链', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', 'latest 指向第一个还没上链的 nonce；pending 指向内存池里第一个断开的位置。'],
  ['fail', '43 费用太低，44 即使费用够也打不进去；45 缺失（签名失败、广播丢失），46 就一直排队。'],
  ['key', '修法只有两种：同 nonce 提高费用（加速或取消），或给空洞补发一笔交易。'],
  ['risk', '把 pending 当成下一个可用 nonce 且不落库，节点切换后可能重复分配 nonce。']
], '一排 nonce 从 40 到 46，43 因费用过低卡住，44 被堵，45 缺失形成空洞，46 排队，修复方式是加速和填洞', 'm03-6')}

<h2>2. Nonce 规则与 pending / latest</h2>
${tbl(['情况', '节点行为', '常见报错'], [
  ['交易 nonce = 账户当前 nonce', '可执行，进入 pending 队列，等待打包', '—'],
  ['交易 nonce 大于当前 nonce', '不可执行，进入 queued 队列，等前面的 nonce 补齐', '—（交易“消失”在 queued 里）'],
  ['交易 nonce 小于当前 nonce', '直接拒绝', '<code>nonce too low</code>'],
  ['同 nonce、费用提高不足 10%', '拒绝替换', '<code>replacement transaction underpriced</code>'],
  ['同 nonce、maxFee 和小费都提高 ≥ 10%', '替换旧交易', '—']
])}
<p><code>eth_getTransactionCount(addr, "latest")</code> 返回<strong>已上链</strong>的交易数，也就是下一笔应使用的 nonce。<code>eth_getTransactionCount(addr, "pending")</code> 再加上该节点内存池里连续可执行的交易数。两者的差 = 正在排队的交易数。</p>
${mm('一个地址的 nonce 状态', `
flowchart LR
  C40["nonce 40<br/>已上链"] --> C41["nonce 41<br/>已上链"]
  C41 --> P42["nonce 42<br/>pending 可打包"]
  P42 --> P43["nonce 43<br/>pending 但费用过低"]
  P43 --> Q44["nonce 44<br/>被 43 阻塞"]
  Q44 --> GAP["nonce 45<br/>缺失 空洞"]
  GAP --> Q46["nonce 46<br/>queued 永远等待"]
  L["latest = 42"] -.-> P42
  PD["pending = 45"] -.-> GAP
`, [
  ['flow', 'latest 指向第一个未上链的 nonce；pending 指向内存池里第一个“断开”的位置。'],
  ['fail', 'nonce 43 费用低于基础费，44 即使费用足够也打不进去。这是最常见的卡单。'],
  ['fail', 'nonce 45 缺失（签名失败、广播丢失、节点重启丢弃），46 进入 queued，永远不会被打包。'],
  ['risk', '如果系统把 pending 当成“下一个可用 nonce”且不落库，节点切换后 pending 值可能变小，导致重复分配 nonce。'],
  ['key', '企业系统的真相来源是自己的数据库，链上 latest 用来对账，pending 只作参考。']
])}
${call('info', `<p>节点内存池有容量限制。以 geth 为例，默认每个账户最多保留 16 笔可执行交易（txpool.accountslots）和 64 笔排队交易（txpool.accountqueue），全局满时会驱逐低价交易（截至 2026 年公开资料，不同版本和客户端可能不同）。一个热钱包同时挂几百笔 pending 交易，部分交易会被节点悄悄丢弃。</p>`)}

<h2>3. 为什么企业钱包会卡单</h2>
${steps([
  '<strong>费用过低</strong>：交易发出后基础费上涨，maxFee 低于基础费，交易停在内存池。',
  '<strong>nonce 空洞</strong>：nonce 已分配，但签名失败、程序崩溃或广播失败，这个 nonce 没有任何交易。',
  '<strong>交易被丢弃</strong>：节点内存池满、节点重启、广播只发给了一个节点，交易从网络中消失。',
  '<strong>并发冲突</strong>：两个进程拿到同一个 nonce，后签的交易替换前一笔，或被拒绝，业务状态与链上不一致。'
])}

<h3>3.1 分配策略</h3>
${tbl(['策略', '做法', '优点', '缺点'], [
  ['单地址串行', '一个热钱包地址，全局锁内依次分配', '简单，余额集中', '一笔卡住全部卡住；吞吐受限'],
  ['多地址并行', 'N 个热钱包地址，每个地址独立 nonce 序列，请求按哈希或负载分配', '一个地址卡住只影响 1/N；吞吐 ×N', '余额分散，需要在地址间调拨'],
  ['按优先级分道', '大额/紧急提币走专用地址，普通提币走另一组地址', '紧急交易不被普通交易阻塞', '地址管理更复杂'],
  ['批量合并', '多个小额提币合并成一笔批量转账', '节省 nonce 和 Gas', '一笔失败影响整批']
])}

<h2>4. 加速、取消、填洞</h2>
<h3>4.1 算一算：加速和取消（示例）</h3>
${steps([
  '原交易：nonce 43，maxFeePerGas = 30 gwei，maxPriorityFeePerGas = 1 gwei，卡住。当前基础费 = 38 gwei。',
  '替换规则：新 maxFee ≥ 30 × 1.1 = 33 gwei，新小费 ≥ 1 × 1.1 = 1.1 gwei。',
  '33 gwei 仍低于基础费 38，加速后还会卡。所以实际取 max(33, 2 × 38 + 2) = 78 gwei，小费取 max(1.1, 2) = 2 gwei。',
  '加速：同 nonce 43、同收款人和金额，费用换成 78 / 2 gwei，重新签名广播。',
  '取消：同 nonce 43，to = 自己的地址，value = 0，gas = 21,000，费用同样 78 / 2 gwei。最多花费 21,000 × 78 gwei = 0.001638 ETH。',
  '取消后原提币没有发生，业务状态要回到“待发送”，重新分配一个新 nonce。'
])}
${call('warn', `<p><strong>替换不是保证。</strong>广播替换交易时，原交易可能刚好已经被打包。结果只有一个会上链：原交易或新交易。系统必须同时监听这两个交易哈希，以链上实际结果为准更新状态，绝不能在替换后立刻把原交易标记为失败并重新发起提币，否则会重复打款。</p>`)}
<h3>4.2 空洞检测与填补</h3>
${steps([
  '每 30 秒读取链上 latest nonce L 和数据库已分配的最大 nonce M。',
  '对 L 到 M 之间的每个 nonce，查数据库记录：没有记录或状态为 allocated（未签名）超过 2 分钟 → 视为空洞。',
  '有 raw transaction 但链上查不到（<code>eth_getTransactionByHash</code> 返回 null）→ 交易被丢弃，用原 raw 重新广播。',
  '没有 raw transaction → 构造一笔 0 ETH 转给自己的填洞交易，用这个 nonce 签名广播。',
  '原业务请求回到待发送队列，重新分配 nonce。'
])}
<p>先在下面的实验里重现这些问题：先点“模拟出块”观察阻塞，再分别尝试加速、取消、制造空洞和自动填洞，注意“节点 pending nonce”和“本地已分配到”两个数字的差距。</p>
${lab('nonce')}

<h2>5. 工程实现：数据库 + Redis 锁</h2>
${mm('nonce 分配与发送流程', `
sequenceDiagram
  participant W as 提币 Worker
  participant R as Redis 锁
  participant DB as PostgreSQL
  participant S as 签名服务
  participant N as 节点
  W->>R: SET lock:nonce:addr token NX PX 5000
  R-->>W: 获得锁
  W->>DB: 事务内 next_nonce 加 1 并返回旧值
  W->>DB: 插入 nonce 记录 状态 allocated
  W->>R: 比较 token 后释放锁
  W->>S: 请求签名 附 nonce
  S-->>W: 返回 raw transaction
  W->>DB: 保存 raw 和 tx_hash 状态 signed
  W->>N: 广播 eth_sendRawTransaction
  W->>DB: 状态 broadcast
  N-->>W: 回执 由监听服务更新为 confirmed
`, [
  ['flow', '锁只保护“分配 nonce 并落库”这一小段。签名和广播在锁外进行，避免长时间占锁。'],
  ['key', '数据库是事实来源：hot_address.next_nonce 记录下一个可分配值，nonce 表的唯一约束是最后一道防线。'],
  ['fail', 'Redis 锁过期而进程还在执行时，可能出现两个持锁者。数据库行锁和唯一约束保证即使锁失效也不会重复分配。'],
  ['fail', '签名失败后 nonce 已经被分配，必须由空洞检测器补上，否则后续交易全部卡住。'],
  ['risk', '先广播后落库，进程在中间崩溃，重启后不知道交易已发出，可能重复签名新交易造成重复打款。顺序必须是：先落库 raw，再广播。']
])}
${code('SQL', `
-- 热钱包地址：next_nonce 是下一个可分配的 nonce
CREATE TABLE hot_address (
  chain        TEXT    NOT NULL,
  address      TEXT    NOT NULL,
  next_nonce   BIGINT  NOT NULL,
  lane         TEXT    NOT NULL DEFAULT 'normal',  -- normal / urgent
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (chain, address)
);

-- 每个 nonce 一条记录：同一地址同一 nonce 只能有一个“当前”业务归属
CREATE TABLE nonce_slot (
  chain        TEXT    NOT NULL,
  address      TEXT    NOT NULL,
  nonce        BIGINT  NOT NULL,
  withdraw_id  BIGINT,                 -- 填洞交易为空
  kind         TEXT    NOT NULL,       -- pay / cancel / fill
  status       TEXT    NOT NULL,       -- allocated / signed / broadcast / confirmed / replaced
  raw_tx       BYTEA,
  tx_hash      TEXT,
  max_fee_gwei NUMERIC,
  attempts     INT     NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chain, address, nonce)
);
CREATE INDEX nonce_slot_pending ON nonce_slot (status, updated_at) WHERE status <> 'confirmed';
`)}
${code('GO', `
// NonceAllocator：Redis 锁降低争用，PostgreSQL 行锁 + 主键保证正确性
type NonceAllocator struct {
    db  *pgxpool.Pool
    rdb *redis.Client
}

var unlockScript = redis.NewScript(\`
if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end
return 0\`)

func (a *NonceAllocator) Allocate(ctx context.Context, chain, addr string, withdrawID int64) (uint64, error) {
    key := "lock:nonce:" + chain + ":" + addr
    token := uuid.NewString()
    ok, err := a.rdb.SetNX(ctx, key, token, 5*time.Second).Result()
    if err != nil || !ok {
        return 0, fmt.Errorf("nonce 锁繁忙: %w", err)
    }
    defer unlockScript.Run(context.Background(), a.rdb, []string{key}, token)

    tx, err := a.db.Begin(ctx)
    if err != nil {
        return 0, err
    }
    defer tx.Rollback(ctx)

    var n uint64
    // 行锁：即使 Redis 锁失效，并发事务也会在这里排队
    err = tx.QueryRow(ctx, \`
        UPDATE hot_address SET next_nonce = next_nonce + 1
        WHERE chain = $1 AND address = $2 AND enabled
        RETURNING next_nonce - 1\`, chain, addr).Scan(&n)
    if err != nil {
        return 0, err
    }
    // 主键 (chain, address, nonce) 冲突即说明分配逻辑出错，事务回滚
    _, err = tx.Exec(ctx, \`
        INSERT INTO nonce_slot (chain, address, nonce, withdraw_id, kind, status)
        VALUES ($1, $2, $3, $4, 'pay', 'allocated')\`, chain, addr, n, withdrawID)
    if err != nil {
        return 0, err
    }
    return n, tx.Commit(ctx)
}
`)}
<h3>5.1 重启恢复</h3>
${steps([
  '服务启动时先不接新请求，对每个热钱包地址读取链上 latest L 和 pending P。',
  '读取数据库 next_nonce D。如果 D &lt; L（链上已用过更大的 nonce，例如有人手工转账），把 D 设为 L，并告警“存在系统外交易”。',
  'status = signed 或 broadcast 且 nonce ≥ L 的记录：用保存的 raw_tx 重新广播（重复广播同一笔是安全的）。',
  'status = allocated 且没有 raw_tx 的记录：重新走签名；若原业务已取消，改为填洞交易。',
  'nonce &lt; L 但状态不是 confirmed 的记录：查询回执，确认是原交易还是替换交易上链，更新业务状态。',
  '全部对齐后再开始接收新请求。'
])}

${tryit(`<p>① 用 curl 查询任意活跃地址的两种 nonce：<code>curl -s -X POST https://ethereum-rpc.publicnode.com -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionCount","params":["0x地址","latest"]}'</code>，再把 latest 换成 pending。② 预期：普通地址两者相等；交易所热钱包在繁忙时 pending 往往大于 latest。③ 在 Sepolia 上用 M08.3 的代码发一笔 maxFee = 1 gwei 的交易（可能卡住），再用相同 nonce、maxFee 提高 10% 以上发一笔给自己 0 ETH 的交易，在浏览器中观察原交易显示 “Dropped &amp; Replaced”。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['nonce 只由分配器分配，禁止业务代码调用 PendingNonceAt 发交易', '多处分配必然冲突', '代码扫描；热钱包地址只在签名服务中可用'],
  ['先持久化 raw_tx，再广播', '崩溃后可安全重播', '故障注入：广播前杀进程，重启后不重复签新交易'],
  ['监控 pending − latest 和最老待确认交易年龄', '提前发现卡单', '告警阈值示例：差值 > 20 或最老交易 > 10 分钟'],
  ['空洞检测器每 30 秒运行', '空洞会阻塞全部后续交易', '测试网故意跳过一个 nonce，验证自动填洞'],
  ['替换后同时监听新旧 tx_hash', '防止重复打款', '集成测试：原交易先上链时业务状态正确'],
  ['广播到 ≥ 2 个独立节点供应商', '单节点丢弃交易', '日志显示多个节点返回结果']
])}
${mistakes([
  ['每次发交易前调用 PendingNonceAt 就够了', '并发请求会拿到相同的 pending 值；节点切换后 pending 可能回退。企业系统必须自己分配并持久化。'],
  ['加速就是把费用提高 1 gwei', '替换要求 maxFee 和小费都至少提高 10%，而且新费用要高于当前基础费，否则替换后仍会卡住。'],
  ['发出取消交易后，原提币一定没发生', '原交易可能先被打包。以链上实际上链的那笔为准。'],
  ['nonce 跳过一个没关系，后面的会先执行', '以太坊严格按 nonce 顺序执行，缺失的 nonce 会让后续交易永远排队。'],
  ['Redis 锁足够保证 nonce 唯一', 'Redis 锁可能因过期、主从切换失效。必须用数据库行锁和唯一约束兜底。']
])}
${recap([
  'nonce 从 0 开始严格连续；latest = 已上链数，pending = 加上内存池连续交易数。',
  '卡单 4 原因：费用过低、空洞、交易被丢弃、并发冲突。',
  '加速和取消都用同 nonce，maxFee 和小费均提高 ≥ 10%，并高于当前基础费。',
  '空洞用 0 ETH 自转交易填补；被丢弃的交易用保存的 raw 重播。',
  '分配器：Redis 锁减少争用，数据库行锁 + 主键保证唯一；先落库后广播；重启先对账再接单。'
])}
${quiz([
  { q: '某地址 latest = 100，pending = 103。这说明什么？', o: ['该地址已经发出 103 笔交易并全部上链', '内存池里有 nonce 100、101、102 三笔连续交易等待打包', 'nonce 103 已经上链', '该地址有 3 个空洞'], a: 1, why: 'latest = 100 表示 0–99 已上链；pending = 103 表示节点内存池里有连续的 100、101、102。' },
  { q: '原交易 maxFee = 50 gwei、小费 2 gwei。下面哪组替换费用会被 geth 默认规则接受？', o: ['maxFee 54，小费 2', 'maxFee 55，小费 2.2', 'maxFee 52，小费 3', 'maxFee 60，小费 2.1'], a: 1, why: '两者都必须提高至少 10%：maxFee ≥ 55，小费 ≥ 2.2。只有 B 同时满足。' },
  { q: '提币服务在“签名完成、广播之前”崩溃。正确的设计应该怎样恢复？', o: ['重新分配一个新 nonce 再签一笔', '用数据库中已保存的 raw transaction 重新广播', '放弃这笔提币', '等待用户投诉'], a: 1, why: '先落库 raw_tx 再广播，重启后重播同一笔交易是幂等的，不会重复打款。' },
  { q: '为什么建议企业热钱包使用多个地址并行发交易？', o: ['多个地址 Gas 更便宜', '一个地址卡单只影响该地址的交易，并且总吞吐提高', '节点要求必须这样做', '可以跳过 nonce 规则'], a: 1, why: '每个地址有独立的 nonce 序列，互不阻塞。代价是余额分散，需要调拨。' }
])}
${exercises([["（示例）nonce 88 的交易 maxFee = 20 gwei、小费 1.5 gwei，已卡住。当前基础费 25 gwei。按文中规则，加速应使用什么费用？取消交易最多花多少 ETH？", "<p>替换最低要求：maxFee ≥ 20 × 1.1 = 22 gwei，小费 ≥ 1.5 × 1.1 = 1.65 gwei。22 仍低于基础费 25，替换后还会卡。所以取 maxFee = max(22, 2 × 25 + 2) = <strong>52 gwei</strong>，小费 = max(1.65, 2) = <strong>2 gwei</strong>。取消交易 gas = 21,000，最多花费 21,000 × 52 gwei = <strong>0.001092 ETH</strong>。</p>"], ["（示例）某热钱包链上 latest = 200，pending = 200，而数据库已分配到 nonce 205，nonce 200 到 204 的记录都没有 raw_tx 且状态为 allocated 超过 10 分钟。这是什么情况？怎么处理？", "<p>这是 nonce 空洞：200 到 204 已分配，但没有任何交易进入内存池，后续 nonce 全部会排队。处理方法：对每个空洞 nonce 构造一笔 0 ETH 转给自己的填洞交易并签名广播；原业务请求回到待发送队列，重新分配新 nonce。有 raw_tx 但链上查不到的记录，则直接重播保存的 raw。</p>"], ["为什么 nonce 分配器同时用 Redis 锁和 PostgreSQL 行锁加主键？只用其中一个会怎样？", "<p>Redis 锁只用来减少争用，它可能因过期或主从切换失效，出现两个持锁者。数据库行锁让并发事务在 UPDATE 上排队，主键 (chain, address, nonce) 是最后一道防线。只用 Redis 会在锁失效时重复分配 nonce。只用数据库也正确，但高并发时争用更多。</p>"]])}
${checklist(["能说清 latest 与 pending 的区别，并从两者的差判断有多少笔交易在排队。", "能列出卡单的 4 种原因：费用过低、空洞、交易被丢弃、并发冲突。", "能按“两项各提高 10% 且高于当前基础费”的规则，算出加速和取消交易的费用。", "能写出 nonce 分配的顺序：加锁、行锁递增、插入记录、释放锁、签名、先落库 raw 再广播。", "能复述服务重启时的对账步骤，并说明为什么全部对齐后才接新请求。"])}
${terms([
  ['Nonce', 'Account Nonce', '账户已发送交易的计数，决定交易执行顺序'],
  ['latest / pending', 'Block Tag', '查询 nonce 时，前者只计已上链交易，后者包含内存池连续交易'],
  ['排队交易', 'Queued Transaction', 'nonce 不连续、暂时无法执行的内存池交易'],
  ['替换交易', 'Replacement Transaction', '相同 nonce、费用提高后用于顶替旧交易'],
  ['加速', 'Speed Up', '同 nonce、同内容、更高费用的替换'],
  ['取消', 'Cancel', '同 nonce、0 金额转给自己的替换'],
  ['空洞', 'Nonce Gap', '已分配但没有任何交易的 nonce，会阻塞后续交易'],
  ['分布式锁', 'Distributed Lock', '多进程间互斥执行临界区的机制']
])}
` });
})();
