/* ---------- M02 子文章（a-1）：m02-1 智能合约与 EVM · m02-2 Solidity 基础 I ---------- */
(() => {
CUR = 'm02-1';
addCh({ id: 'm02-1', nav: '智能合约与 EVM', title: 'M02.1 智能合约与 EVM：链上程序如何被执行', desc: '合约是什么、EVM 栈机器、部署与调用全流程、Gas 与回滚', html: `
<h1>M02.1 智能合约与 EVM：链上程序如何被执行</h1>
${meta(['说清智能合约能做什么、不能做什么，以及合约账户和外部账户的区别。', '画出 EVM 的四个数据区（栈、内存、存储、calldata），并解释一笔交易调用合约的完整执行流程。', '计算 CREATE / CREATE2 地址的输入，估算一笔调用的 Gas 费用，理解回滚和升级。'], '<a href="#m01">M01 区块链基础</a>（交易、区块、Gas 的概念）')}
${beginner(`<p><strong>虚拟机（Virtual Machine）</strong>：用软件模拟出来的一台“电脑”。以太坊的每个节点都运行同一台虚拟机，所以同样的输入在所有节点得到同样的输出。</p>
<p><strong>字节码（Bytecode）</strong>：程序编译后的机器指令，是一串十六进制数字，例如 <code>0x6080604052…</code>。人读不懂，虚拟机读得懂。</p>
<p><strong>栈（Stack）</strong>：一种“后进先出”的数据结构。像一摞盘子：只能从最上面放，也只能从最上面拿。</p>
<p><strong>Gas</strong>：执行每条指令要付的“燃料”。指令越复杂、存储越多，消耗的 Gas 越多。用户按 Gas 数量 × Gas 价格付手续费。</p>
<p><strong>回滚（Revert）</strong>：执行中途出错时，撤销这笔交易对状态的所有修改，像什么都没发生过一样（但手续费照付）。</p>`)}

<h2>1. 一句话理解</h2>
${one('智能合约是一段存放在以太坊上的字节码。任何人发交易调用它，全网节点都用 EVM 一条一条执行指令，得到相同的结果并写入账本。')}
${call('analogy', `<p>把以太坊想成一座城市共享的“公共计算器”。合约是刻在计算器里的一个固定程序：谁都能按按钮，结果所有人都看得见，没人能偷偷改程序。</p>
<p>每按一次按钮要投币（Gas），按的步骤越多，投的币越多。如果中途出错，计算器把屏幕恢复原样，但投进去的币不退。</p>
<p>比喻的局限：真实的计算器自己会动；合约<strong>不会自己运行</strong>，它只在有人发交易时被动执行，也不能主动上网取数据。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m02-1"><div class="mmd-title"><span>一图看懂：EVM 的四个数据区</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 268" role="img" aria-label="EVM 的栈、内存、calldata 和存储"><rect x="300" y="95" width="160" height="70" rx="35" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><text x="380" y="128" font-size="16" text-anchor="middle" fill="var(--ink)" font-weight="700">EVM 执行</text><text x="380" y="148" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">逐条运行字节码</text><rect x="20" y="20" width="220" height="70" rx="10" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="130" y="44" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">栈 Stack</text><text x="130" y="64" font-size="11.5" text-anchor="middle" fill="var(--ink)">最多 1024 项 · 每项 32 字节</text><text x="130" y="81" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">运算的“草稿区”，最便宜</text><rect x="520" y="20" width="220" height="70" rx="10" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="630" y="44" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">内存 Memory</text><text x="630" y="64" font-size="11.5" text-anchor="middle" fill="var(--ink)">本次调用内有效</text><text x="630" y="81" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">按字节寻址，用完即清空</text><rect x="20" y="170" width="220" height="70" rx="10" fill="var(--tint)" stroke="var(--ink-2)" stroke-width="1.5"/><text x="130" y="194" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">calldata</text><text x="130" y="214" font-size="11.5" text-anchor="middle" fill="var(--ink)">调用时传入 · 只读</text><text x="130" y="231" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">函数选择器 + 参数</text><rect x="520" y="170" width="220" height="70" rx="10" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="1.5"/><text x="630" y="194" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">存储 Storage</text><text x="630" y="214" font-size="11.5" text-anchor="middle" fill="var(--ink)">永久保存在链上</text><text x="630" y="231" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">写一个新槽约 2 万 Gas，最贵</text><line x1="240" y1="62" x2="300" y2="110" stroke="var(--ink-2)" stroke-width="2"/><line x1="520" y1="62" x2="460" y2="110" stroke="var(--ink-2)" stroke-width="2"/><line x1="240" y1="200" x2="300" y2="152" stroke="var(--ink-2)" stroke-width="2"/><line x1="520" y1="200" x2="460" y2="152" stroke="var(--ink-2)" stroke-width="2"/><text x="380" y="258" font-size="12.5" text-anchor="middle" fill="var(--ink-2)">同一个变量放在哪个区域，决定了它活多久、花多少 Gas</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>执行时，EVM 从 calldata 读入参数，在栈和内存里计算，需要长期保留的结果写入存储。</span></li><li><span class="chip key">关键</span><span>存储是唯一跨交易保留的区域，也是最贵的区域；优化 Gas 的核心就是少写存储。</span></li><li><span class="chip limit">局限</span><span>栈只有 1024 项，局部变量太多会触发“stack too deep”编译错误。</span></li></ul></figcaption></figure>

<h2>2. 合约能做什么，不能做什么</h2>
<p>智能合约（Smart Contract）是部署在区块链上、按代码规则自动执行的程序。它有自己的地址、自己的余额和自己的存储。</p>
${tbl(['能做', '不能做（以及替代方案）'], [
  ['保管资产：持有 ETH 和代币，按规则放款', '主动定时执行 → 需要外部机器人（Keeper）发交易触发'],
  ['记账：维护余额表、订单、投票记录', '直接读取链外数据（价格、天气） → 需要预言机（Oracle）写入链上'],
  ['调用其他合约：组合成 DeFi 乐高', '产生真正的随机数 → 需要 VRF 等可验证随机数服务'],
  ['发出事件（Event）：让链外程序监听', '保密数据：链上一切公开可读，private 变量也能被读出'],
  ['强制执行规则：没有人能绕过代码', '修改已部署的代码 → 只能通过代理（Proxy）模式“升级”']
])}
<h3>2.1 两类账户</h3>
${tbl(['对比项', '外部账户 EOA', '合约账户 CA'], [
  ['英文', 'Externally Owned Account', 'Contract Account'],
  ['谁控制', '私钥持有人', '代码逻辑'],
  ['有无代码', '无（EIP-7702 允许 EOA 设置代码委托，见下方说明）', '有，部署后固定'],
  ['能否主动发起交易', '能，交易必须由 EOA 签名发起', '不能，只能在被调用时再调用别人'],
  ['地址来源', '公钥的 Keccak-256 哈希后 20 字节', '由部署者地址 + nonce 或 salt 计算'],
  ['nonce 含义', '已发送的交易数', '已创建的合约数']
])}
${call('info', '<p>2025 年以太坊 Pectra 升级引入 EIP-7702：EOA 可以签名授权，把自己的代码“指向”某个合约，从而获得批量调用、代付 Gas 等能力。这模糊了两类账户的边界，详见 <a href="#m06">M10 Agent & Web3</a> 中的账户抽象部分。本篇按经典模型讲解。</p>')}

<h2>3. EVM：一台 256 位的栈机器</h2>
<p>以太坊虚拟机（EVM, Ethereum Virtual Machine）是执行合约字节码的虚拟机。它是<strong>栈机器（Stack Machine）</strong>：指令从栈顶取操作数，把结果压回栈顶。每个栈元素是 256 位（32 字节）的“字”（Word）。</p>
${mm('EVM 执行一笔调用时可以访问的数据区', `
flowchart LR
  TX["交易<br/>to / value / data"] --> CD["calldata<br/>只读输入参数"]
  CD --> ST["栈 Stack<br/>最多 1024 个 32 字节元素"]
  ST <--> MEM["内存 Memory<br/>按字节寻址，调用结束清空"]
  ST <--> STO[("存储 Storage<br/>2²⁵⁶ 个 32 字节槽，永久保存")]
  ST --> LOG["日志 Logs<br/>事件，合约自己读不到"]
  ST --> RET["返回数据<br/>returndata"]
  CODE["字节码 Code<br/>只读"] --> PC["程序计数器 PC"]
  PC --> ST
`, [
  ['flow', '输入从 calldata 进入，计算在栈上进行，临时数据放内存，需要永久保存的写存储，给链外看的写日志。'],
  ['key', '存储是唯一跨交易保留的数据区，也是最贵的：首次写一个槽约 20,000 Gas，而一次 ADD 只要 3 Gas。'],
  ['limit', '栈深度上限 1024，且指令只能直接访问栈顶 16 个元素。局部变量太多时编译器报错 Stack too deep。'],
  ['fail', '内存按使用量收费，费用随大小二次增长。在内存里开超大数组会让 Gas 爆炸。'],
  ['risk', '日志和存储都公开。把密码、私钥写进合约等于公开发布。']
])}
${tbl(['数据区', '生命周期', '可写', '成本（示例）', 'Solidity 中对应'], [
  ['栈 Stack', '单条指令之间', '是', '极低（约 2–3 Gas）', '值类型局部变量'],
  ['内存 Memory', '本次外部调用', '是', '低，按字线性 + 二次增长', '<code>memory</code> 变量'],
  ['存储 Storage', '永久', '是', '高：冷读 2,100，新写 20,000', '状态变量'],
  ['calldata', '本次调用', '否', '交易发送时按字节付费', '<code>calldata</code> 参数'],
  ['代码 Code', '永久', '否', '部署时每字节 200 Gas', '<code>constant</code> / <code>immutable</code>']
])}
<h3>3.1 字节码与操作码</h3>
<p>Solidity 源码由编译器 solc 编译成字节码。字节码中每个字节对应一个<strong>操作码（Opcode）</strong>，例如 <code>0x01</code> 是 ADD，<code>0x55</code> 是 SSTORE。几乎所有 Solidity 合约的字节码都以 <code>6080604052</code> 开头：</p>
${code('BASH', `
60 80   PUSH1 0x80   # 把 0x80 压栈
60 40   PUSH1 0x40   # 把 0x40 压栈
52      MSTORE       # memory[0x40] = 0x80
# 含义：初始化“空闲内存指针”，告诉后续代码从内存地址 0x80 开始分配
`)}
<p>调用合约时，交易的 data 字段前 4 字节是<strong>函数选择器（Function Selector）</strong>：函数签名字符串的 Keccak-256 哈希的前 4 字节。例如 <code>transfer(address,uint256)</code> 的选择器是 <code>0xa9059cbb</code>。合约开头有一段“分发器”代码，比较选择器后跳到对应函数。参数按 ABI（应用二进制接口）规则编码，每个参数占 32 字节。</p>

<h2>4. 部署：creation code 与 runtime code</h2>
<p>部署合约是一笔特殊交易：<code>to</code> 字段为空，<code>data</code> 字段是<strong>创建代码（creation code，也叫 initcode）</strong>。EVM 执行创建代码，创建代码运行构造函数，最后把<strong>运行时代码（runtime code）</strong>返回。节点把返回的运行时代码存到新地址上。以后每次调用执行的都是运行时代码。</p>
${mm('部署一个合约的过程', `
sequenceDiagram
  autonumber
  participant D as 部署者 EOA
  participant N as 节点 EVM
  participant A as 新合约地址
  D->>N: 交易 to=空 data=creation code + 构造参数
  N->>N: 计算新地址 = f(部署者, nonce)
  N->>A: 创建空账户，转入 value
  N->>N: 执行 creation code（运行 constructor）
  N->>N: constructor 写入初始状态变量
  N->>A: RETURN runtime code，按字节收存储费
  A-->>D: 回执 contractAddress=新地址
`, [
  ['flow', '构造函数只在部署时运行一次，它的代码不会保存到链上。'],
  ['key', '运行时代码大小上限 24,576 字节（EIP-170），创建代码上限 49,152 字节（EIP-3860）。超过上限部署失败。'],
  ['fail', '构造函数 revert，整个部署失败，地址上不会留下代码，但部署者的 nonce 仍然增加。'],
  ['limit', 'immutable 变量在构造函数中赋值后被直接写入运行时代码，所以读取它不需要 SLOAD。']
])}
<h3>4.1 新合约的地址怎么算</h3>
${tbl(['方式', '地址公式', '特点'], [
  ['CREATE', '<code>keccak256(rlp([sender, nonce]))</code> 的后 20 字节', '地址依赖部署者的 nonce，顺序变了地址就变'],
  ['CREATE2', '<code>keccak256(0xff ++ sender ++ salt ++ keccak256(initcode))</code> 的后 20 字节', '部署前就能算出地址；同一 sender + salt + initcode 在任何 EVM 链上地址相同']
])}
<p>CREATE2（EIP-1014）常用于：Uniswap 交易对地址可预测、智能合约钱包“先给地址收款、后部署”、多链部署同一地址。</p>
${call('warn', '<p>CREATE2 的地址只取决于 initcode 的哈希。如果 initcode 能在部署时读取外部可变状态，同一地址可能部署出不同逻辑的合约。集成方不能只因为“地址可预测”就信任一个尚未部署的地址。</p>')}

<h3>4.2 工厂：批量部署与地址预测</h3>
<p>很多协议需要“一键创建一个新合约”：Uniswap 为每个交易对创建一个池，Safe 为每个用户创建一个钱包。负责创建的合约叫<strong>工厂（Factory）</strong>。如果每次都把完整字节码重新部署一遍，成本很高。常用办法是只部署一个很小的<strong>克隆（Clone，EIP-1167 最小代理）</strong>：它只有 45 字节，把所有调用 delegatecall 给同一个“实现合约”。</p>
${mm('工厂用克隆批量创建钱包', `
sequenceDiagram
  participant U as 用户
  participant F as 工厂合约
  participant C as 新克隆（45 字节）
  participant I as 实现合约（只部署一次）
  U->>F: create(owner, salt)
  F->>C: CREATE2 部署克隆，指向实现地址
  F->>C: initialize(owner)
  C-->>F: 初始化完成
  F-->>U: 返回克隆地址
  U->>C: 之后的每次调用
  C->>I: DELEGATECALL 转发
  I-->>C: 在克隆的存储上执行并返回
`, [
  ['flow', '克隆本身没有业务代码。每次调用都转发给实现合约，但读写的是<strong>克隆自己的存储</strong>。'],
  ['fail', '克隆的存储是空的，必须立刻 <code>initialize</code>。如果创建和初始化不在同一笔交易，别人可以抢先初始化并接管。'],
  ['limit', '克隆不能单独升级：实现地址写死在字节码里。需要批量升级时，改用 Beacon 代理（见 <a href="#m02-8">M02.9</a>）。'],
  ['risk', '实现合约不能留有可被外部触发的 selfdestruct，否则所有克隆会一起失效。']
])}
${tbl(['方式', '部署的代码大小', '地址由什么决定', '典型用途'], [
  ['<code>new C()</code>（CREATE）', '完整字节码', '工厂地址 + 工厂 nonce', '数量少、逻辑各不相同的合约'],
  ['<code>new C{salt: s}()</code>（CREATE2）', '完整字节码', '工厂地址 + salt + initcode 哈希', '需要提前知道地址（见 4.1）'],
  ['克隆 <code>Clones.clone</code>', '45 字节', '工厂 nonce；<code>cloneDeterministic</code> 用 salt', '成千上万个同样逻辑的钱包、池、金库'],
  ['CREATE3（如 Solady、Solmate 的库）', '完整字节码', '只由工厂地址 + salt 决定，<strong>与 initcode 无关</strong>', '多链同地址，且各链合约版本可以不同']
])}
<p><strong>算一算（示例）：</strong>部署后，EVM 按每字节 200 Gas 收取“存代码费”。一个 24,576 字节的大合约，仅存代码就要 24,576 × 200 = 4,915,200 Gas。一个 45 字节的克隆只要 45 × 200 = 9,000 Gas，约为前者的 1/546。批量创建越多，节省越明显。</p>
<p>CREATE3 的做法是两步：先用 CREATE2 部署一个<strong>固定的</strong>小代理（它的 initcode 永远一样，所以地址只取决于工厂和 salt），再让这个小代理用 CREATE（nonce = 1）部署真正的合约。这样即使你在不同的链上改了合约代码，只要用同一个工厂和 salt，地址仍然相同。</p>
${code('SOLIDITY', `
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

interface IWallet { function initialize(address owner) external; }

contract WalletFactory {
    address public immutable implementation;      // 实现合约，只部署一次
    event Created(address indexed owner, address wallet);

    constructor(address impl) { implementation = impl; }

    function create(address owner, bytes32 salt) external returns (address w) {
        // 把 owner 混进 salt：别人无法抢注你的地址
        bytes32 s = keccak256(abi.encode(owner, salt));
        w = Clones.cloneDeterministic(implementation, s);
        IWallet(w).initialize(owner);             // 同一笔交易内初始化
        emit Created(owner, w);
    }

    function predict(address owner, bytes32 salt) external view returns (address) {
        bytes32 s = keccak256(abi.encode(owner, salt));
        return Clones.predictDeterministicAddress(implementation, s, address(this));
    }
}
`)}
${exq([
  ['为什么工厂里“创建克隆”和“初始化”必须在同一笔交易？', '<p>克隆刚创建时存储为空，任何人都可以调用 <code>initialize</code>。如果两步分开，攻击者会在中间抢先初始化，把自己设为 owner。同一笔交易内完成，就没有这个窗口。</p>'],
  ['钱包地址要“先收款、后部署”，应该用哪种方式？', '<p>用 <code>cloneDeterministic</code>（CREATE2）或 CREATE3。它们让地址在部署前就能算出，用户可以先向该地址转账，等需要时再创建。</p>']
])}

<h2>5. 一次调用的完整执行流程</h2>
${mm('交易调用合约：从签名到回执', `
flowchart TB
  S["1 用户签名交易<br/>to=合约 data=选择器+参数"] --> V{"2 节点校验<br/>签名 / nonce / 余额 ≥ gasLimit × 最高单价"}
  V -->|"不通过"| DROP["丢弃，不上链，不收费"]
  V -->|"通过"| PRE["3 预扣 Gas 费，nonce + 1<br/>扣 21000 基础 Gas + calldata Gas"]
  PRE --> RUN["4 EVM 执行运行时代码<br/>分发器按选择器跳转"]
  RUN --> SUB["5 可能调用其他合约<br/>CALL / DELEGATECALL / STATICCALL"]
  SUB --> OK{"6 是否出错或 Gas 耗尽"}
  OK -->|"正常结束"| COMMIT["7a 提交状态修改<br/>写入日志，status=1"]
  OK -->|"REVERT 或 Out of Gas"| RB["7b 撤销本次全部状态修改<br/>status=0"]
  COMMIT --> FEE["8 结算：按实际 gasUsed 收费<br/>退还未用 Gas"]
  RB --> FEE
`, [
  ['flow', '校验失败的交易不会进入区块，所以不收费。进入区块后，无论成功或失败，都按已用 Gas 收费。'],
  ['key', '回滚是“全有或全无”：一笔交易里的所有状态修改要么全部生效，要么全部撤销。这叫原子性（Atomicity）。'],
  ['fail', 'Out of Gas 会消耗掉 gasLimit 内的全部 Gas。REVERT 指令会退还剩余 Gas。'],
  ['risk', '外部调用把执行权交给另一个合约。对方可以回调你的合约，这是重入攻击的入口，见 <a href="#m02-3">M02.3</a> 和 M02 总览。'],
  ['limit', 'EIP-150 规定：调用子合约时最多转发剩余 Gas 的 63/64，防止无限递归。']
])}
<h3>5.1 Gas 计量：算一算</h3>
<p><strong>示例：</strong>Alice 调用 <code>transfer(bob, 100)</code>。calldata 共 68 字节：选择器 4 字节 + 地址 32 字节 + 金额 32 字节。calldata 收费规则：零字节 4 Gas，非零字节 16 Gas。</p>
${steps([
  '选择器 <code>a9 05 9c bb</code>：4 个非零字节 × 16 = 64 Gas。',
  '地址参数：12 个填充零字节 × 4 = 48；20 个地址字节（假设都非零）× 16 = 320。合计 368 Gas。',
  '金额 100 = <code>0x64</code>：31 个零字节 × 4 = 124；1 个非零字节 × 16 = 16。合计 140 Gas。',
  'calldata 合计 64 + 368 + 140 = 572 Gas；加上基础费 21,000，执行前已经花了 21,572 Gas。',
  '执行部分（示例）：冷读两个余额槽 2 × 2,100 = 4,200；改写 Alice 余额（非零→非零）2,900；Bob 余额从 0 写成非零 20,000；Transfer 事件约 1,756；其他指令约 1,000。合计约 29,856 Gas。',
  '总 gasUsed ≈ 21,572 + 29,856 = 51,428 Gas。若 baseFee = 20 gwei、小费 = 1 gwei，手续费 = 51,428 × 21 gwei = 1,079,988 gwei ≈ 0.00108 ETH。'
])}
${call('info', '<p>上面的执行部分是按 EIP-2929 / EIP-2200 规则手算的近似值。真实数值用 <code>forge test --gas-report</code> 或区块浏览器回执查看（见 <a href="#m02-4">M02.4</a>、<a href="#m02-6">M02.7</a>）。2025 年 Pectra 升级的 EIP-7623 还提高了“数据量大、计算少”交易的 calldata 底价，普通调用基本不受影响。</p>')}

<h3>5.2 三种底层调用：call、staticcall、delegatecall</h3>
<p>写 <code>token.balanceOf(a)</code> 这类“高级调用”时，编译器会替你选好指令。需要自己拼数据时，就用底层调用。三者区别在于<strong>在谁的存储上执行</strong>，以及<strong>被调用方眼里的 msg.sender 是谁</strong>。</p>
${tbl(['', 'call', 'staticcall', 'delegatecall'], [
  ['执行谁的代码', '对方', '对方', '对方'],
  ['读写谁的存储', '对方', '对方（只读）', '<strong>调用者自己</strong>'],
  ['对方看到的 msg.sender', '调用合约', '调用合约', '<strong>原始调用者，保持不变</strong>'],
  ['能否附带 ETH', '能', '不能', '不能新增，沿用原 msg.value'],
  ['能否改状态', '能', '不能，改状态会 revert', '能，改的是调用者的存储'],
  ['典型用途', '转账、调用外部合约', '只读查询（view / pure 的外部调用就是它）', '代理转发、external 库']
])}
${mm('call 与 delegatecall 的区别', `
sequenceDiagram
  participant U as 用户
  participant A as 合约 A
  participant B as 合约 B
  U->>A: 调用 f
  A->>B: CALL：用 B 的代码和 B 的存储
  Note over B: msg.sender 是 A，写入 B 的存储
  B-->>A: 返回
  A->>B: DELEGATECALL：借 B 的代码，用 A 的存储
  Note over A,B: msg.sender 仍是 U，写入 A 的存储
  B-->>A: 返回
`, [
  ['flow', 'delegatecall 像“借一段程序来，在自己家里运行”：代码是 B 的，数据和余额是 A 的。'],
  ['fail', '代码按“槽号”读写存储，不看变量名。A 和 B 的变量顺序不一致时，B 的函数会写错 A 的槽。'],
  ['risk', '对不可信地址做 delegatecall 等于把自己的存储和资金交给对方的代码。目标地址不能由用户指定。'],
  ['key', '底层调用返回 <code>(bool ok, bytes ret)</code>。<strong>不检查 ok 就会把失败当成功</strong>。']
])}
${code('SOLIDITY', `
contract Logic {
    uint256 public number;                       // 槽 0
    function setNumber(uint256 n) external { number = n; }
}

contract Proxy {
    address public owner;                        // 槽 0：和 Logic.number 是同一个槽
    address public logic;                        // 槽 1
    constructor(address l) { owner = msg.sender; logic = l; }

    function setNumber(uint256 n) external {
        (bool ok, bytes memory ret) = logic.delegatecall(abi.encodeCall(Logic.setNumber, (n)));
        if (!ok) { assembly { revert(add(ret, 32), mload(ret)) } }   // 把对方的错误原样抛出
    }
}
`)}
<p><strong>算一算（示例）：</strong>调用 <code>Proxy.setNumber(7)</code>。Logic 的代码执行“把 7 写入槽 0”，但在 delegatecall 下写的是 Proxy 的存储。Proxy 的槽 0 是 <code>owner</code>，于是 owner 被改成地址 <code>0x0000…0007</code>。这就是“存储布局必须一致”的原因，升级相关的完整规则见 <a href="#m02-8">M02.9</a>。</p>
${call('warn', '<p>对没有代码的地址做底层 <code>call</code>，EVM 返回 <code>ok = true</code>：没有代码，也就没有失败。向“拼错的合约地址”发调用会悄悄成功。推荐用 OpenZeppelin 的 <code>Address.functionCall</code>，它会检查目标有代码并在失败时抛出原错误。</p>')}
${exq([
  ['<code>staticcall</code> 的目标函数里写了存储，会发生什么？', '<p>该调用 revert，<code>staticcall</code> 返回 <code>ok = false</code>。静态上下文禁止一切状态修改，包括写存储、发事件、转 ETH。</p>'],
  ['为什么说“delegatecall 的目标地址不能由用户传入”？', '<p>用户可以传入一个恶意合约，里面写 <code>selfdestruct</code> 或直接改 owner 槽。delegatecall 会在你的存储上执行这些代码，等于让对方接管你的合约。</p>']
])}

<h2>6. 回滚语义与“不可变”</h2>
<h3>6.1 回滚的四种来源</h3>
${tbl(['来源', '触发方式', '剩余 Gas', '错误数据'], [
  ['require / revert', '条件不满足，执行 REVERT 指令', '退还', '<code>Error(string)</code> 或自定义错误'],
  ['assert / 算术溢出 / 越界', 'Solidity 0.8 起用 REVERT 抛出', '退还', '<code>Panic(uint256)</code>，例如 0x11 表示溢出'],
  ['Out of Gas', 'Gas 用完', '全部耗尽', '无'],
  ['INVALID 操作码 0xfe', '执行到无效指令', '全部耗尽', '无（0.8 之前的 assert 用它）']
])}
<p>子调用失败时，只撤销子调用内部的修改。调用方用低级 <code>call</code> 可以拿到 <code>false</code> 并继续执行；用高级调用（<code>token.transfer(...)</code>）则会把错误继续向上抛，整笔交易回滚。</p>
<h3>6.2 合约不可变与升级</h3>
<p>合约部署后，运行时代码不能修改。这是“代码即法律”的基础，也意味着 bug 无法打补丁。工程上用<strong>代理模式（Proxy Pattern）</strong>实现升级：</p>
${mm('代理升级：地址不变，逻辑可换', `
flowchart LR
  U["用户"] -->|"调用"| P["代理合约 Proxy<br/>保存全部状态<br/>保存实现地址"]
  P -->|"DELEGATECALL<br/>用代理的存储执行"| L1["实现合约 V1"]
  P -.->|"管理员升级后"| L2["实现合约 V2"]
  ADM["管理员<br/>多签 + 时间锁"] -->|"upgradeTo(V2)"| P
`, [
  ['flow', 'DELEGATECALL 借用实现合约的代码，但读写代理合约自己的存储。用户始终和代理地址交互。'],
  ['risk', '升级权限 = 改写全部逻辑的权限。管理员私钥被盗，攻击者可以换成“全部转给我”的实现。必须用多签 + 时间锁。'],
  ['fail', '新版本改变了状态变量顺序，会导致存储槽错位，数据被错误解读。OpenZeppelin Upgrades 插件可以检查布局。'],
  ['key', '常见标准：EIP-1967 规定实现地址存放的固定槽位；Transparent Proxy 与 UUPS 是两种主流实现。']
])}
${call('info', '<p>SELFDESTRUCT 曾经可以删除合约。2024 年 Cancun 升级（EIP-6780）后，它只在“同一笔交易内创建并销毁”时才真正删除代码，其他情况下只转走 ETH。新代码不要依赖 SELFDESTRUCT。</p>')}
${tryit(`<p><strong>在 Etherscan 上观察一次合约调用</strong></p>
<ol><li>打开 sepolia.etherscan.io，搜索任意 USDC 或测试代币的合约地址，进入 Transactions 列表，点开一笔 Transfer 交易。</li>
<li>查看 <strong>Input Data</strong>：点击 “Decode Input Data”，确认前 4 字节是 <code>0xa9059cbb</code>，后面是收款地址和金额。</li>
<li>查看 <strong>Gas Limit & Usage</strong>：记录 gasUsed，与本篇 5.1 的估算对比（预期在 3 万到 6 万之间）。</li>
<li>切到合约页面的 <strong>Contract → Code</strong>：找到 “Deployed Bytecode”，确认它以 <code>6080604052</code> 开头（Vyper 编写的合约例外）。</li></ol>
<p>预期结果：你能说清这笔交易的选择器、参数、gasUsed，以及字节码的开头含义。</p>`)}

${mistakes([
  ['合约会自己定时运行，比如每天自动发利息。', '合约只在被交易调用时执行。“每天发利息”要么由用户领取时按时间计算，要么由外部 Keeper 发交易触发。'],
  ['private 变量别人看不到。', 'private 只限制其他合约调用。任何人都能用 <code>eth_getStorageAt</code> 读出存储槽的原始数据。'],
  ['交易失败就不收手续费。', '交易进入区块后失败（status=0），已消耗的 Gas 照样收费。只有校验阶段就被拒绝的交易不收费。'],
  ['合约部署后绝对不能改。', '代码本身不能改，但代理模式可以替换逻辑。使用一个协议前，要检查它是否可升级、谁有升级权限。'],
  ['Gas 越高执行越快。', 'Gas 数量由代码决定；Gas 单价（小费）影响打包优先级。执行速度对所有交易一样。']
])}
${recap([
  '合约是存在链上的字节码，有地址、余额和存储，只能被交易被动触发，不能主动访问链外世界。',
  'EVM 是 256 位栈机器：栈做计算、内存放临时数据、存储永久保存且最贵、calldata 只读。',
  '部署时执行 creation code，返回并保存 runtime code。CREATE 地址依赖 nonce，CREATE2 地址依赖 salt 和 initcode 哈希。',
  '一笔交易是原子的：出错就撤销全部状态修改，但已用 Gas 照付。',
  '合约代码不可变，升级靠代理 + DELEGATECALL，升级权限必须由多签和时间锁控制。'
])}
${quiz([
  { q: '下面哪一项是合约<strong>做不到</strong>的？', o: ['持有 ETH 并按规则转出', '调用另一个合约的函数', '每天 0 点自动执行一次结算', '发出事件供链外监听'], a: 2, why: '合约没有定时器，只能被交易触发。定时任务需要 Keeper 发交易。其余三项都是合约的基本能力。' },
  { q: 'EVM 中哪个数据区的数据在交易结束后仍然保留？', o: ['存储 Storage', '栈 Stack', '内存 Memory', 'calldata'], a: 0, why: '只有存储永久保留。栈和内存在调用结束后清空，calldata 只是本次交易的输入。' },
  { q: '同一个部署者用 CREATE2、相同 salt、相同 initcode，在两条 EVM 链上部署，地址会怎样？', o: ['一定不同，因为链 ID 不同', '取决于部署者的 nonce', '每次随机', '相同'], a: 3, why: 'CREATE2 地址 = keccak256(0xff ++ sender ++ salt ++ keccak256(initcode)) 后 20 字节，不含链 ID 和 nonce，所以相同。' },
  { q: '一笔交易执行到一半 require 失败，结果是？', o: ['已执行部分保留，只撤销失败那一步', '全部状态修改撤销，已用 Gas 照付，剩余 Gas 退还', '全部撤销，Gas 全部退还', '交易卡在内存池等待重试'], a: 1, why: 'REVERT 撤销全部状态修改并退还剩余 Gas，但已消耗的 Gas 不退。交易已上链，不会回到内存池。' }
])}
${checklist([
  '能说出 CREATE、CREATE2、克隆、CREATE3 的地址分别由什么决定。',
  '能解释为什么克隆必须在创建的同一笔交易里初始化。',
  '能说出 call、staticcall、delegatecall 在存储和 msg.sender 上的区别。',
  '在 Remix 里复现过 Proxy 的 owner 被 delegatecall 改写的例子。'
])}
${terms([
  ['以太坊虚拟机', 'EVM, Ethereum Virtual Machine', '所有节点用来执行合约字节码的 256 位栈机器'],
  ['操作码', 'Opcode', '字节码中的单条指令，例如 ADD、SLOAD、SSTORE'],
  ['函数选择器', 'Function Selector', '函数签名 Keccak-256 哈希的前 4 字节，用于定位被调用的函数'],
  ['外部账户', 'EOA, Externally Owned Account', '由私钥控制、能发起交易的账户'],
  ['合约账户', 'Contract Account', '由代码控制、只能被调用的账户'],
  ['创建代码', 'Creation Code / Initcode', '部署时执行一次，运行构造函数并返回运行时代码'],
  ['运行时代码', 'Runtime Code', '保存在合约地址上、每次调用都执行的代码'],
  ['CREATE2', 'CREATE2', '用 salt 和 initcode 哈希确定地址的部署指令（EIP-1014）'],
  ['代理模式', 'Proxy Pattern', '用 DELEGATECALL 把调用转发给可替换的实现合约，实现升级'],
  ['原子性', 'Atomicity', '交易内的修改要么全部生效，要么全部撤销']
])}
` });

CUR = 'm02-2';
addCh({ id: 'm02-2', nav: 'Solidity 基础 I', title: 'M02.2 Solidity 基础 I：类型、函数与第一个合约', desc: '用 Remix 写出并部署链上留言板，掌握类型、数据位置与事件', html: `
<h1>M02.2 Solidity 基础 I：类型、函数与第一个合约</h1>
${meta(['在 Remix 中编写、编译、部署并调用一个合约。', '正确选择值类型、引用类型和数据位置（storage / memory / calldata）。', '用可见性、view / pure、msg.sender 和事件写出一个完整的链上留言板。'], '<a href="#m02-1">M02.1 智能合约与 EVM</a>')}
${beginner(`<p><strong>Solidity</strong>：以太坊上最常用的合约编程语言，语法像 JavaScript 和 C++ 的混合。文件后缀 <code>.sol</code>。</p>
<p><strong>编译器（Compiler）</strong>：把 Solidity 源码翻译成 EVM 字节码的程序，叫 solc。不同版本的 solc 语法规则不同。</p>
<p><strong>状态变量（State Variable）</strong>：写在合约里、函数外的变量。它的值保存在链上存储中，永久保留。</p>
<p><strong>ABI</strong>：应用二进制接口（Application Binary Interface）。一份 JSON，描述合约有哪些函数、参数类型和事件，前端和脚本靠它调用合约。</p>
<p><strong>测试网（Testnet）</strong>：和主网规则相同、但代币没有价值的网络，例如 Sepolia。用来练习和测试。</p>`)}

<h2>1. 一句话理解</h2>
${one('一个 Solidity 合约 = 一组状态变量（存在链上的数据） + 一组函数（读写这些数据的规则） + 一组事件（通知链外的广播）。')}
${call('analogy', `<p>把合约想成一个公开的“共享表格 + 规则手册”。状态变量是表格的列，函数是“谁可以在什么条件下改哪一格”的规则，事件是每次修改后贴在公告栏上的通知。</p>
<p>比喻的局限：普通表格可以由管理员随意改；合约表格只能通过函数改，规则一旦部署就固定。</p>`)}
${art('一图看懂：合约 = 共享表格（状态变量）+ 规则手册（函数）+ 公告栏（事件）', 660, 320, [
  S.zone(140, 30, 350, 246, { t: '链上 · MessageBoard 合约' }),
  S.box(10, 100, 110, 70, { k: 'tint', icon: 'person', t: '调用者', s: '任何地址' }),
  S.box(156, 58, 318, 80, { k: 'key', icon: 'code', t: '函数：谁能改哪一格', s: 'post() · like() · hide()\ngetMessage() 只读，免费', mono: 1 }),
  S.box(156, 168, 318, 90, { k: 'info', icon: 'db', t: '状态变量：共享表格', s: 'Message[] messages\nmapping postCount · liked\nowner · MAX_LEN = 280', mono: 1 }),
  S.box(550, 100, 100, 70, { k: 'idle', dash: 1, icon: 'globe', t: '前端', s: '监听事件' }),
  S.arrow(122, 135, 154, 98),
  S.arrow(315, 140, 315, 166, { k: 'key' }),
  S.arrow(476, 98, 548, 130, { label: '事件' }),
  S.text(330, 302, 'private 不等于保密：链上数据人人能读；要改状态，只能走函数', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '调用者只能通过函数改状态变量；每次改完用 emit 发出事件，前端靠事件知道发生了什么。'],
  ['key', '规则写在函数里：post 检查长度 1 到 280，like 每人每条只能点一次，hide 只有 owner 能调。'],
  ['risk', '函数是唯一入口：漏掉一个权限检查，等于给所有人开了一格表格的写权限。'],
  ['limit', '部署后规则固定；事件只通知链外，合约自己读不到事件。']
], '一个调用者通过函数读写合约里的状态变量，合约再用事件通知链外前端', 'm02-2')}

<h2>2. 开发环境：Remix 与合约骨架</h2>
<p>Remix（remix.ethereum.org）是浏览器里的合约 IDE，不用安装任何东西。它内置编译器、一个本地模拟链（Remix VM）和调试器。入门用 Remix，工程项目用 Foundry（见 <a href="#m02-4">M02.4 开发工具链</a>）。</p>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT          // 第 1 行：开源许可证标识，缺少时编译器给出警告
pragma solidity ^0.8.24;                 // 编译器版本：0.8.24 及以上、0.9.0 以下

import "./Other.sol";                    // 导入其他文件（可选）

contract Hello {                         // 合约，类似其他语言的 class
    string public greeting = "hi";       // 状态变量：存在链上存储

    function setGreeting(string calldata g) external {  // 函数：修改状态
        greeting = g;
    }
}
`)}
${tbl(['写法', '含义', '建议'], [
  ['<code>pragma solidity ^0.8.24;</code>', '允许 0.8.24 ≤ 版本 < 0.9.0', '学习和应用代码常用'],
  ['<code>pragma solidity 0.8.24;</code>', '只允许 0.8.24', '生产合约推荐锁定版本，保证审计的字节码可复现'],
  ['<code>pragma solidity >=0.8.0 <0.9.0;</code>', '范围写法', '库代码常用，兼容更多使用者']
])}

<h2>3. 类型系统</h2>
<h3>3.1 值类型：赋值时复制</h3>
${tbl(['类型', '取值 / 说明', '默认值', '示例'], [
  ['<code>bool</code>', 'true / false', 'false', '<code>bool public paused;</code>'],
  ['<code>uint8</code> … <code>uint256</code>', '无符号整数，位宽按 8 递增；<code>uint</code> = <code>uint256</code>', '0', 'uint8 最大 255；uint256 最大约 1.16 × 10⁷⁷'],
  ['<code>int8</code> … <code>int256</code>', '有符号整数', '0', 'int8 范围 −128 到 127'],
  ['<code>address</code>', '20 字节地址；有 <code>.balance</code>', '<code>address(0)</code>', '<code>address owner;</code>'],
  ['<code>address payable</code>', '可以接收 ETH 的地址，多了 <code>.transfer</code> / <code>.send</code>', '<code>address(0)</code>', '<code>payable(msg.sender)</code>'],
  ['<code>bytes1</code> … <code>bytes32</code>', '定长字节数组', '全 0', '哈希值常用 <code>bytes32</code>'],
  ['<code>enum</code>', '自定义枚举，底层是 uint8', '第一个成员', '<code>enum Status { Open, Closed }</code>']
])}
${call('info', '<p>Solidity 没有小数（浮点数）。金额一律用“最小单位的整数”表示：1 ETH = 10¹⁸ wei；1 USDC = 10⁶ 最小单位。计算比例时先乘后除，例如 <code>amount * 30 / 10000</code> 表示 0.3%。前端换算见 <a href="#m07">M03 Web3 大前端</a>。</p>')}
<p><strong>算一算（示例）</strong>：手续费率 0.3%，用户转入 1,234 wei。</p>
${steps(['先乘后除：1234 × 30 / 10000 = 37020 / 10000 = 3（整数除法向零取整，3.702 → 3）。', '如果先除后乘：1234 / 10000 × 30 = 0 × 30 = 0，手续费完全丢失。', '结论：整数除法会截断，先乘后除才能保留精度；同时要确认乘法结果不会超过 uint256 上限。'])}
<h3>3.2 引用类型与数据位置</h3>
${tbl(['类型', '说明', '注意'], [
  ['数组 <code>T[]</code> / <code>T[N]</code>', '动态长度或固定长度；有 <code>.length</code>、<code>.push()</code>、<code>.pop()</code>', 'storage 数组可以 push；memory 数组创建后长度固定'],
  ['<code>mapping(K => V)</code>', '键值表；任何键都“存在”，未写过的键返回默认值', '不能遍历，不能取长度，只能存在 storage'],
  ['<code>struct</code>', '把多个字段打包成一个自定义类型', '可以嵌套 mapping（此时只能在 storage 中）'],
  ['<code>string</code> / <code>bytes</code>', '动态长度字节串', '比较内容要用 <code>keccak256(bytes(a)) == keccak256(bytes(b))</code>']
])}
<p>引用类型必须标明<strong>数据位置（Data Location）</strong>：</p>
${mm('三种数据位置：赋值时发生什么', `
flowchart LR
  CD["calldata<br/>外部调用的输入，只读"] -->|"赋值给 memory：复制"| M["memory<br/>本次调用的临时副本"]
  S[("storage<br/>链上永久存储")] -->|"赋值给 memory：复制"| M
  S -->|"storage 引用：不复制<br/>修改即写链"| SR["storage 指针<br/>Item storage it = items[i]"]
  M -->|"赋值给状态变量：复制并写链"| S
`, [
  ['flow', 'storage 指针直接指向链上数据，改它就是改状态；memory 是副本，改了不影响链上数据。'],
  ['fail', '常见 bug：写 <code>Item memory it = items[i]; it.done = true;</code>，以为改了状态，实际只改了副本。'],
  ['key', '外部函数的只读数组 / 字符串参数优先用 calldata：不复制，最省 Gas。'],
  ['limit', 'mapping 不能放在 memory 中，也不能作为外部函数参数。']
])}

<h3>3.3 容易踩的四个细节</h3>
${tbl(['细节', '现象', '怎么做'], [
  ['显式缩小转换会静默截断', '<code>uint8(v)</code> 只保留低 8 位：v = 300 时结果是 300 − 256 = 44，不 revert（溢出检查只管运算，不管转换）', '用 OpenZeppelin 的 <code>SafeCast.toUint8(v)</code>，越界就 revert'],
  ['<code>bytes(s).length</code> 是字节数', 'string 是 UTF-8：<code>"你好"</code> 的长度是 6，不是 2', '限制长度时按字节数设上限，别按“字数”理解'],
  ['<code>delete arr[i]</code> 不会缩短数组', '只把第 i 项置为默认值 0，长度不变，后面的元素不会前移', '不关心顺序时：<code>arr[i] = arr[arr.length - 1]; arr.pop();</code>（交换后弹出，O(1)）'],
  ['mapping 不能遍历', '没有键列表，也没有长度', '需要遍历时另存一个键数组加 <code>bool</code> 登记表；只需要统计时，用事件交给链下汇总']
])}
${call('warn', '<p>在链上遍历一个会不断变长的键数组，Gas 会随人数增长，最终超过区块上限，函数永久失败（拒绝服务）。链上只做 O(1) 的事，统计和列表交给索引器。</p>')}

<h2>4. 函数：可见性、状态可变性与全局变量</h2>
${tbl(['可见性', '谁能调用', '典型用途'], [
  ['<code>public</code>', '外部 + 本合约 + 子合约', '对外接口；public 状态变量会自动生成同名 getter'],
  ['<code>external</code>', '只能外部调用（内部要用 <code>this.f()</code>）', '只给外部用的接口，参数可用 calldata'],
  ['<code>internal</code>', '本合约 + 子合约', '内部工具函数；状态变量默认是 internal'],
  ['<code>private</code>', '只有本合约', '不希望子合约覆盖或调用的细节']
])}
${tbl(['状态可变性', '规则', '调用成本'], [
  ['<code>view</code>', '只读状态，不能修改', '链外 eth_call 调用免费；被交易内部调用时照常计 Gas'],
  ['<code>pure</code>', '不读也不写状态，只用参数计算', '同上'],
  ['<code>payable</code>', '可以接收 ETH（msg.value > 0）', '未标 payable 的函数收到 ETH 会 revert'],
  ['（不写）', '可以修改状态', '必须发交易，付 Gas']
])}
${tbl(['全局变量', '含义', '注意'], [
  ['<code>msg.sender</code>', '直接调用者的地址（EOA 或合约）', '权限判断用它，不要用 <code>tx.origin</code>'],
  ['<code>msg.value</code>', '本次调用附带的 ETH 数量（wei）', '只在 payable 函数中可以非 0'],
  ['<code>block.timestamp</code>', '当前区块时间戳（秒）', '精度是区块级（以太坊约 12 秒），不能当随机数'],
  ['<code>block.number</code>', '当前区块高度', 'L2 上含义可能不同，要查对应链文档'],
  ['<code>tx.origin</code>', '交易最初的签名 EOA', '用于鉴权会被钓鱼合约利用']
])}
<h3>4.1 事件 event / emit</h3>
<p>事件（Event）是合约写入交易日志的结构化数据。合约自己读不到日志，但链外程序（前端、索引器）可以按条件过滤。最多 3 个参数可以标记 <code>indexed</code>，它们进入 topics，可以被高效筛选；其余参数进入 data。</p>
${mm('事件从合约到前端的流转', `
sequenceDiagram
  participant U as 用户
  participant C as 留言板合约
  participant N as 节点
  participant I as 索引器或前端
  U->>C: post(“你好”)
  C->>C: 写存储 messages.push
  C->>N: emit Posted(id, author, text)
  N->>N: 写入回执 logs：topic0=事件签名哈希
  I->>N: eth_getLogs 过滤 topic2=作者地址
  N-->>I: 返回匹配的日志
  I->>I: ABI 解码，更新页面或数据库
`, [
  ['flow', 'topic0 = keccak256(“Posted(uint256,address,string)”)，topic1、topic2 是两个 indexed 参数，text 放在 data。'],
  ['key', '事件比存储便宜很多：每个 topic 375 Gas，每字节 data 8 Gas。只给链外看的数据用事件。'],
  ['fail', '交易回滚时事件也被撤销。链发生重组时，前端看到的日志可能消失，索引器要处理重组（见 <a href="#m01">M01</a>）。'],
  ['limit', 'indexed 的 string / bytes 只保存哈希，无法从 topic 还原原文。']
])}

<h3>4.2 ABI 编码：calldata 长什么样</h3>
<p>调用合约时，交易的 data 由两部分拼成：<strong>4 字节选择器 + 参数区</strong>。参数区按“32 字节一个字”排列。固定大小的类型（<code>uint256</code>、<code>address</code>、<code>bool</code>）直接占一个字；动态类型（<code>string</code>、<code>bytes</code>、数组）先占一个<strong>偏移量</strong>字，真正的内容放在参数区末尾。</p>
${code('BASH', `
# transfer(0x1111…1111, 100) 的 calldata（共 68 字节）
a9059cbb                                                          # 选择器：keccak256("transfer(address,uint256)") 前 4 字节
0000000000000000000000001111111111111111111111111111111111111111   # 字 0：地址，左侧补 12 个零字节
0000000000000000000000000000000000000000000000000000000000000064   # 字 1：100 的十六进制是 0x64，大端对齐
`)}
${code('BASH', `
# 用 cast 复现
cast sig "transfer(address,uint256)"                                # 得到选择器 0xa9059cbb
cast calldata "transfer(address,uint256)" 0x1111111111111111111111111111111111111111 100
cast abi-encode "f(uint256,string)" 1 hi                           # 只编码参数区，不含选择器
`)}
<p>动态类型的例子：参数区 <code>f(1, "hi")</code> 有 4 个字。字 0 是 <code>1</code>；字 1 是偏移量 <code>0x40</code>（内容从第 64 字节开始）；字 2 是字符串长度 <code>2</code>；字 3 是内容 <code>0x6869</code>，右侧补零到 32 字节。</p>
${lab('abi')}
<h3>4.3 abi.encode 与 abi.encodePacked</h3>
${tbl(['写法', '规则', '用途与风险'], [
  ['<code>abi.encode(a, b)</code>', '每个值补齐到 32 字节，动态类型带偏移和长度', '哈希、签名、跨合约传参的首选，没有歧义'],
  ['<code>abi.encodePacked(a, b)</code>', '不补零，直接拼接', '更省，但<strong>可能产生碰撞</strong>：<code>("a", "bc")</code> 与 <code>("ab", "c")</code> 拼出同样的字节串 “abc”，哈希相同'],
  ['<code>abi.encodeCall(f, (x))</code>', '按函数签名检查参数类型后编码', '拼底层调用数据时优先用，编译器帮你查类型'],
  ['<code>abi.encodeWithSignature("f(uint256)", x)</code>', '运行时用字符串算选择器', '签名拼错编译器发现不了']
])}
${call('risk', '<p>把多个动态类型（string、bytes、数组）用 <code>encodePacked</code> 拼起来再取哈希，攻击者可以挪动边界构造出相同的哈希，绕过校验。需要哈希多个值时用 <code>abi.encode</code>。</p>')}
${exq([
  ['<code>transfer(address,uint256)</code> 的 calldata 为什么是 68 字节？', '<p>4 字节选择器 + 2 个参数 × 32 字节 = 68 字节。地址只有 20 字节，但 ABI 把它左补 12 个零字节，补齐到一个字。</p>'],
  ['把 amount 从 100 改成 256，calldata 哪里变了？', '<p>只有最后一个字变化：0x64 变成 0x100。选择器和地址字都不变。可以用上面的实验验证。</p>']
])}

<h2>5. 完整示例：链上留言板</h2>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title 链上留言板：任何人都能留言，作者可以点赞计数
contract MessageBoard {
    // ---- 类型定义 ----
    enum Status { Active, Hidden }              // 枚举：留言状态

    struct Message {                            // 结构体：一条留言
        address author;                         // 作者地址（20 字节）
        uint64  createdAt;                      // 时间戳；uint64 足够，可与 author 打包进同一槽
        Status  status;                         // 1 字节，同样打包
        uint256 likes;                          // 点赞数
        string  text;                           // 正文（动态长度）
    }

    // ---- 状态变量 ----
    address public immutable owner;             // 部署者，构造后不可改，读取不花 SLOAD
    uint256 public constant MAX_LEN = 280;      // 常量：编译期写死
    Message[] private messages;                 // 全部留言
    mapping(address => uint256) public postCount;               // 每个地址发了多少条
    mapping(uint256 => mapping(address => bool)) public liked;  // 某条留言是否被某人点过赞

    // ---- 事件 ----
    event Posted(uint256 indexed id, address indexed author, string text);
    event Liked(uint256 indexed id, address indexed by, uint256 totalLikes);
    event Hidden(uint256 indexed id);

    constructor() {
        owner = msg.sender;                     // 记录部署者
    }

    /// 发一条留言；text 用 calldata：只读、不复制
    function post(string calldata text) external returns (uint256 id) {
        uint256 len = bytes(text).length;
        require(len > 0 && len <= MAX_LEN, "length 1-280");
        id = messages.length;                   // 新留言的编号 = 当前数组长度
        messages.push(Message({
            author: msg.sender,
            createdAt: uint64(block.timestamp),
            status: Status.Active,
            likes: 0,
            text: text
        }));
        postCount[msg.sender] += 1;
        emit Posted(id, msg.sender, text);
    }

    /// 点赞：每人对每条留言只能点一次
    function like(uint256 id) external {
        require(id < messages.length, "no such id");
        require(!liked[id][msg.sender], "already liked");
        liked[id][msg.sender] = true;
        Message storage m = messages[id];       // storage 指针：修改直接写链
        m.likes += 1;
        emit Liked(id, msg.sender, m.likes);
    }

    /// 管理员隐藏违规留言（数据仍在链上，只是标记）
    function hide(uint256 id) external {
        require(msg.sender == owner, "not owner");
        require(id < messages.length, "no such id");
        messages[id].status = Status.Hidden;
        emit Hidden(id);
    }

    /// 读取单条留言：view，链外调用免费
    function getMessage(uint256 id) external view returns (Message memory) {
        require(id < messages.length, "no such id");
        return messages[id];                    // 从 storage 复制到 memory 返回
    }

    function total() external view returns (uint256) {
        return messages.length;
    }
}
`)}
<p>逐段解释关键设计：</p>
${steps([
  '<strong>类型选择</strong>：<code>createdAt</code> 用 uint64 而不是 uint256。uint64 秒级时间戳可以用到约公元 5850 亿年，足够；它和 20 字节的 author、1 字节的 status 一共 29 字节，可以打包进同一个 32 字节存储槽，省 Gas（原理见 <a href="#m02-6">M02.7</a>）。',
  '<strong>immutable 与 constant</strong>：owner 在构造函数中赋值后写进字节码；MAX_LEN 编译时写死。两者读取都不访问存储。',
  '<strong>private 不等于保密</strong>：messages 标 private 只是不生成 getter，数据仍可从链上读出。',
  '<strong>嵌套 mapping</strong>：<code>liked[id][addr]</code> 记录点赞，查询是 O(1)，不需要遍历数组。',
  '<strong>storage 指针</strong>：<code>Message storage m</code> 让 <code>m.likes += 1</code> 直接修改链上数据。若写成 memory，点赞数不会增加。',
  '<strong>事件</strong>：id 和 author 标 indexed，前端可以“只看某人的留言”；正文放 data。',
  '<strong>没有分页函数</strong>：“返回全部留言”的函数会随数组增长而越来越贵，前端应按 id 逐条读取或用索引器（见 <a href="#m02-6">M02.7</a> 无界循环）。'
])}
<h3>5.1 在 Remix 中部署和调用</h3>
${steps([
  '打开 remix.ethereum.org，在 File Explorer 的 contracts 文件夹新建 <code>MessageBoard.sol</code>，粘贴上面的代码。',
  '左侧点 “Solidity Compiler”，Compiler 选 0.8.24 或更高，点 “Compile MessageBoard.sol”。看到绿色对勾表示成功。',
  '左侧点 “Deploy & Run Transactions”，Environment 选 “Remix VM”（本地模拟链，自带 100 ETH 测试账户）。',
  '点橙色 “Deploy”。下方 Deployed Contracts 出现合约实例；终端打印部署交易和 gas。',
  '展开实例，在 <code>post</code> 输入框填 <code>"你好，链上世界"</code>（字符串要带双引号），点 post。终端显示交易成功；点击日志可以看到 Posted 事件。',
  '点蓝色按钮 <code>total</code> 返回 1；在 <code>getMessage</code> 填 0，查看返回的结构体。蓝色按钮是 view 函数，不产生交易。',
  '在 Account 下拉框换一个账户，调用 <code>like(0)</code> 成功；再调用一次，终端显示 revert “already liked”。',
  '用非部署者账户调用 <code>hide(0)</code>，预期 revert “not owner”。'
])}
${tryit(`<p><strong>部署到 Sepolia 测试网</strong></p>
<ol><li>在 MetaMask 中切换到 Sepolia 网络，从任一公开水龙头（Faucet）领取少量测试 ETH。</li>
<li>Remix 的 Environment 改选 “Injected Provider - MetaMask”，确认账户和网络显示为 Sepolia。</li>
<li>点 Deploy，在 MetaMask 弹窗中确认。等待约 12–30 秒，终端出现合约地址。</li>
<li>复制地址到 sepolia.etherscan.io 搜索，在 Events 标签页查看你发布留言后产生的 Posted 日志。</li></ol>
<p>预期结果：Etherscan 上能看到部署交易、post 交易和对应事件；topic1 是留言 id，topic2 是你的地址（左侧补零到 32 字节）。</p>`)}

${mistakes([
  ['memory 变量修改后会自动保存到链上。', 'memory 是临时副本。要修改状态，必须写状态变量或使用 storage 指针。'],
  ['mapping 可以用 for 循环遍历，也能取长度。', 'mapping 不记录有哪些键。需要遍历时另存一个键数组，或交给链外索引器。'],
  ['view 函数永远免费。', '链外 eth_call 调用 view 函数不花钱；但在一笔交易内部被调用时，它的指令照常计 Gas。'],
  ['用 tx.origin 判断调用者更安全。', 'tx.origin 是最初签名人。用户被诱导调用恶意合约时，恶意合约再调用你的合约，tx.origin 仍是用户，鉴权被绕过。用 msg.sender。'],
  ['uint8 一定比 uint256 省 Gas。', 'EVM 按 32 字节处理。单独的 uint8 局部变量还要额外截断指令。只有在存储中和其他小变量打包时才省 Gas。']
])}
${recap([
  '合约骨架：SPDX 许可证、pragma 版本、contract 块；生产代码锁定编译器版本。',
  '值类型赋值即复制；引用类型（数组、mapping、struct、string）要标数据位置 storage / memory / calldata。',
  '可见性 public / external / internal / private 控制谁能调用；view / pure 声明不改状态；payable 才能收 ETH。',
  '权限判断用 msg.sender；block.timestamp 只有区块级精度且不能当随机数。',
  '事件写进日志，便宜、可被链外过滤，最多 3 个 indexed 参数；合约自己读不到事件。'
])}
${quiz([
  { q: '下面哪种写法会让点赞数<strong>真正</strong>写入链上？', o: ['Message memory m = messages[id]; m.likes += 1;', 'Message storage m = messages[id]; m.likes += 1;', 'Message calldata m = messages[id]; m.likes += 1;', 'uint256 x = messages[id].likes; x += 1;'], a: 1, why: 'storage 指针直接引用链上数据。memory 和局部变量都是副本；calldata 是只读的，而且不能指向存储。' },
  { q: '<code>mapping(address => uint256) balances;</code> 查询一个从未写入的地址，结果是？', o: ['revert', '返回 address(0)', '返回 0', '编译失败'], a: 2, why: 'mapping 中所有键都“存在”，未写入的键返回值类型的默认值，uint256 的默认值是 0。' },
  { q: '一个事件最多能有几个 indexed 参数（非匿名事件）？', o: ['3', '1', '4', '不限'], a: 0, why: '非匿名事件的 topic0 被事件签名哈希占用，剩下最多 3 个 topic 给 indexed 参数。匿名事件可以有 4 个。' },
  { q: '在合约里计算 0.3% 手续费，下面哪个最正确？', o: ['amount / 10000 * 30', 'amount * 0.003', 'amount * 30 / 10000', 'amount / 333'], a: 2, why: 'Solidity 没有小数，amount * 0.003 无法编译；先除后乘会截断丢失精度；amount / 333 是近似值。先乘后除最准确。' }
])}
${checklist([
  '能解释 uint8(300) 为什么等于 44，以及怎样让它改成 revert。',
  '能用交换后弹出删除数组元素，并说明代价。',
  '能手写 transfer(address,uint256) 的 68 字节 calldata，并说出每个字的含义。',
  '能说出 abi.encodePacked 的碰撞风险，并知道哈希多个值该用 abi.encode。'
])}
${terms([
  ['状态变量', 'State Variable', '定义在函数外、保存在链上存储的变量'],
  ['数据位置', 'Data Location', '引用类型存放的位置：storage、memory 或 calldata'],
  ['可见性', 'Visibility', '控制函数或变量能被谁访问：public / external / internal / private'],
  ['视图函数', 'View Function', '只读取状态、不修改状态的函数'],
  ['纯函数', 'Pure Function', '既不读也不写状态、只依赖参数的函数'],
  ['事件', 'Event', '写入交易日志的结构化数据，供链外程序过滤和读取'],
  ['索引参数', 'Indexed Parameter', '进入日志 topics、可以被高效过滤的事件参数'],
  ['应用二进制接口', 'ABI, Application Binary Interface', '描述合约函数、参数和事件编码方式的接口规范'],
  ['Remix', 'Remix IDE', '浏览器中的 Solidity 开发、部署与调试环境']
])}
` });
})();
