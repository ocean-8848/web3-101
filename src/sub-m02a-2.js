/* ---------- M02 子文章（a-2）：m02-3 Solidity 基础 II · m02-4 开发工具链 ---------- */
(() => {
CUR = 'm02-3';
addCh({ id: 'm02-3', nav: 'Solidity 基础 II', title: 'M02.3 Solidity 基础 II：权限、继承、错误处理与收发 ETH', desc: 'modifier、继承、自定义错误、payable 与安全转账，写出带权限的金库', html: `
<h1>M02.3 Solidity 基础 II：权限、继承、错误处理与收发 ETH</h1>
${meta(['用 modifier、构造函数、继承、interface 和 abstract 组织合约代码。', '在 require、revert 自定义错误、assert 之间正确选择，并安全地收发 ETH。', '基于 OpenZeppelin 写出一个带角色权限、暂停和重入保护的金库合约。'], '<a href="#m02-2">M02.2 Solidity 基础 I</a>')}
${beginner(`<p><strong>修饰器（Modifier）</strong>：贴在函数上的“前置检查”，例如“只有管理员能调用”。写一次，多处复用。</p>
<p><strong>继承（Inheritance）</strong>：子合约自动获得父合约的变量和函数，像“在模板上加功能”。</p>
<p><strong>接口（Interface）</strong>：只声明函数名和参数、不写实现的“说明书”。知道接口就能调用别人的合约。</p>
<p><strong>OpenZeppelin</strong>：最常用的开源合约库，提供经过审计的代币、权限、安全组件。</p>
<p><strong>重入（Reentrancy）</strong>：你的合约在转账时把控制权交给对方，对方趁机再次调用你的合约。</p>`)}

<h2>1. 一句话理解</h2>
${one('写合约像建银行金库：modifier 是门禁，继承是复用标准图纸，错误处理是报警器，收发 ETH 是出纳窗口；每一处都要先检查、再记账、最后放款。')}
${call('analogy', `<p>想象一家银行。门禁卡（modifier）决定谁能进哪间房；总行的标准规章（父合约）被每个分行继承，分行可以改写其中允许改写的条款（virtual / override）；出纳员（withdraw 函数）必须先在账本上扣款，再把现金递出窗口。</p>
<p>比喻的局限：银行出错可以人工冲正；合约一旦把钱转走，没有人能撤回。</p>`)}
${art('一图看懂：Vault 继承三套现成“门禁”，每个函数先过门，再记账', 660, 350, [
  S.box(10, 34, 193, 64, { k: 'tint', icon: 'lock', t: 'AccessControl', s: '角色：谁能按哪个钮', mono: 1 }),
  S.box(233, 34, 193, 64, { k: 'tint', icon: 'bolt', t: 'Pausable', s: '紧急暂停开关', mono: 1 }),
  S.box(456, 34, 194, 64, { k: 'tint', icon: 'shield', t: 'ReentrancyGuard', s: '防回调重入', mono: 1 }),
  S.box(10, 142, 640, 70, { k: 'key', icon: 'bank', t: 'contract Vault is 上面三个', s: 'deposit · withdraw · setDailyLimit · pause · unpause', mono: 1 }),
  S.box(10, 252, 300, 64, { k: 'info', icon: 'person', t: '普通用户', s: 'deposit / withdraw\n过 whenNotPaused 与 nonReentrant' }),
  S.box(350, 252, 300, 64, { k: 'warn', icon: 'key', t: '管理员角色', s: 'PAUSER → pause · ADMIN → unpause\nTREASURER → 调整每日限额' }),
  S.arrow(106, 100, 106, 140),
  S.arrow(330, 100, 330, 140),
  S.arrow(553, 100, 553, 140),
  S.arrow(160, 214, 160, 250),
  S.arrow(500, 214, 500, 250),
  S.text(330, 342, '每个函数：先检查（门禁）→ 再改账 → 最后转账（Checks-Effects-Interactions）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['key', '继承 = 复用：权限、暂停、防重入都用 OpenZeppelin 现成实现，Vault 只写自己的业务。'],
  ['flow', '普通用户的存取款要先过暂停开关和重入锁；管理动作要先过角色检查。'],
  ['risk', '管理员角色是单点：建议由多签地址持有，而不是一个人的钱包。'],
  ['limit', '修饰器只是“进门前的检查”，函数体里先改账再转账的顺序仍要自己写对。']
], 'Vault 合约继承 AccessControl、Pausable、ReentrancyGuard，普通用户与管理员角色各自通过不同的检查调用它的函数', 'm02-3')}

<h2>2. 组织代码：modifier、构造函数、继承</h2>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract Owned {                       // abstract：不能直接部署
    address public owner;
    error NotOwner(address caller);             // 自定义错误

    constructor(address initialOwner) {         // 构造函数：部署时运行一次
        owner = initialOwner;
    }

    modifier onlyOwner() {                      // 修饰器
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;                                      // 这里插入被修饰函数的函数体
    }

    function fee() public view virtual returns (uint256);  // 没有实现 → 合约必须 abstract
}

interface IPriceFeed {                          // 接口：只有声明
    function latestPrice() external view returns (uint256);
}

contract Shop is Owned {                        // 继承
    IPriceFeed public feed;

    constructor(address feed_) Owned(msg.sender) {   // 调用父构造函数
        feed = IPriceFeed(feed_);
    }

    function fee() public pure override returns (uint256) {  // 实现父合约的 virtual 函数
        return 30;                              // 0.3%，单位：基点
    }

    function setFeed(address f) external onlyOwner {
        feed = IPriceFeed(f);
    }

    function quote(uint256 qty) external view returns (uint256) {
        return qty * feed.latestPrice();        // 通过接口调用外部合约
    }
}
`)}
${tbl(['概念', '关键字', '规则'], [
  ['修饰器', '<code>modifier</code> / <code>_;</code>', '<code>_;</code> 代表原函数体；多个修饰器按书写顺序从左到右嵌套执行'],
  ['构造函数', '<code>constructor</code>', '只在部署时执行；可以是 payable；父合约构造参数在继承列表或子构造函数头部传入'],
  ['可覆盖', '<code>virtual</code> / <code>override</code>', '父函数标 virtual 才能被覆盖；子函数必须写 override；多重继承同名函数写 <code>override(A, B)</code>'],
  ['调用父实现', '<code>super.f()</code>', '按 C3 线性化顺序调用“下一个”父合约的实现'],
  ['接口', '<code>interface</code>', '函数全部 external、无实现、无状态变量、无构造函数'],
  ['抽象合约', '<code>abstract contract</code>', '可以有实现也可以缺实现；不能部署，只能被继承']
])}
${mm('多重继承的解析顺序（C3 线性化）', `
flowchart BT
  V["Vault（最终合约）<br/>is AccessControl, Pausable, ReentrancyGuard"] --> RG["ReentrancyGuard"]
  V --> PA["Pausable"]
  V --> AC["AccessControl"]
  AC --> ERC165["ERC165"]
  AC --> CTX["Context"]
  PA --> CTX
`, [
  ['flow', 'Solidity 按继承列表从右到左确定优先级：写在最右边的父合约“最接近”子合约。super 调用沿这个顺序向上走。'],
  ['key', '继承列表要从“最基础”写到“最具体”。顺序写反时编译器报 Linearization of inheritance graph impossible。'],
  ['fail', '两个父合约有同名函数时，子合约必须显式 override(A, B)，否则编译失败。'],
  ['limit', '继承层级过深会让审计变难。生产代码倾向浅继承 + 组合。']
])}

<h2>3. 错误处理与 Gas</h2>
${tbl(['写法', '何时用', '回滚数据', 'Gas 特点'], [
  ['<code>require(cond, "msg")</code>', '检查输入和外部条件', '<code>Error(string)</code>', '字符串存进字节码，部署和回滚都更贵'],
  ['<code>if (!cond) revert MyError(a, b);</code>', '同上，推荐', '4 字节选择器 + 参数', '最省；还能带参数便于排错'],
  ['<code>require(cond, MyError(a))</code>', '同上（0.8.26 引入且仅 via-IR，0.8.27 起默认编译管线也支持）', '同自定义错误', '写法更短'],
  ['<code>assert(cond)</code>', '检查“理论上永远成立”的内部不变量', '<code>Panic(0x01)</code>', '0.8 起同样退还剩余 Gas']
])}
<p>编译器自动插入的 Panic 码：<code>0x01</code> assert 失败；<code>0x11</code> 算术溢出；<code>0x12</code> 除以 0；<code>0x32</code> 数组越界；<code>0x41</code> 内存分配过大。看到 Panic 说明代码有 bug，而不是用户输入错误。</p>
${call('info', `<p>调用方捕获外部错误用 <code>try / catch</code>：</p>`)}
${code('SOLIDITY', `
try feed.latestPrice() returns (uint256 p) {
    price = p;
} catch Error(string memory reason) {     // require / revert("...") 的错误
    emit FeedFailed(reason);
} catch Panic(uint256 code) {             // assert、溢出等
    emit FeedPanic(code);
} catch (bytes memory data) {             // 自定义错误或其他
    emit FeedRaw(data);
}
`)}
<h3>3.1 Solidity 0.8 的溢出检查与 unchecked</h3>
<p>0.8.0 之前，<code>uint8 x = 255; x + 1</code> 会静默变成 0（回绕），历史上导致过代币被凭空增发的漏洞。0.8.0 起，所有加减乘默认检查溢出，溢出时以 <code>Panic(0x11)</code> 回滚。确定不会溢出时，可以用 <code>unchecked { }</code> 跳过检查省 Gas：</p>
${code('SOLIDITY', `
for (uint256 i = 0; i < n; ) {
    // ... 循环体
    unchecked { ++i; }   // i < n 已保证不会溢出，手动跳过检查
}

// 0.8.22 起，写在 for 头部的简单计数器（i < n 且 ++i）由编译器自动省略溢出检查，不必再手写 unchecked：
for (uint256 i = 0; i < n; ++i) {
    // ... 循环体
}
`)}
${call('warn', '<p>unchecked 只用于你能证明不会溢出的地方，例如循环计数器、已经比较过大小的减法。不要在余额、价格计算里使用。省下的约 30–40 Gas 远不值得一次漏洞。</p>')}

<h2>4. 收发 ETH：payable、receive、fallback</h2>
${mm('合约收到一笔调用时，选择哪个函数', `
flowchart TB
  IN["收到调用"] --> D{"calldata 为空？"}
  D -->|"是"| R{"有 receive()？"}
  R -->|"有"| RECV["执行 receive()"]
  R -->|"无"| FB1{"有 payable fallback()？"}
  FB1 -->|"有"| FALL["执行 fallback()"]
  FB1 -->|"无"| REV["revert：拒收 ETH"]
  D -->|"否"| M{"选择器匹配某个函数？"}
  M -->|"是"| FN{"带 ETH 且函数非 payable？"}
  FN -->|"是"| REV
  FN -->|"否"| RUN["执行该函数"]
  M -->|"否"| FB2{"有 fallback()？"}
  FB2 -->|"有"| FBP{"带 ETH 且 fallback 非 payable？"}
  FBP -->|"是"| REV
  FBP -->|"否"| FALL
  FB2 -->|"无"| REV
`, [
  ['flow', '纯转账（data 为空）走 receive；data 不匹配任何函数走 fallback。代理合约就是用 fallback 转发所有调用。'],
  ['fail', '没有 receive 也没有 payable fallback 的合约，用普通转账给它发 ETH 会失败。'],
  ['risk', '合约余额可以被强制增加（例如 SELFDESTRUCT 转入、作为出块奖励地址），不会触发 receive。不要用 address(this).balance 做关键判断。'],
  ['key', 'receive 必须是 external payable，不能有参数和返回值。']
])}
${tbl(['发送方式', '转发 Gas', '失败时', '建议'], [
  ['<code>to.transfer(amt)</code>', '固定 2,300', '自动 revert', '不推荐：接收方是合约钱包时 2,300 Gas 可能不够，转账永久失败'],
  ['<code>to.send(amt)</code>', '固定 2,300', '返回 false', '不推荐：同上，而且容易忘记检查返回值'],
  ['<code>(bool ok, ) = to.call{value: amt}("")</code>', '默认转发全部剩余 Gas', '返回 false', '推荐：必须检查 ok，并配合“先记账后转账”+ 重入锁']
])}
${code('SOLIDITY', `
// 推荐写法：检查 - 生效 - 交互（Checks-Effects-Interactions）
function withdraw(uint256 amount) external nonReentrant {
    uint256 bal = balances[msg.sender];
    if (amount > bal) revert Insufficient(bal, amount);     // 1. 检查
    balances[msg.sender] = bal - amount;                    // 2. 生效：先扣账
    (bool ok, ) = payable(msg.sender).call{value: amount}(""); // 3. 交互：最后转账
    if (!ok) revert TransferFailed();
}
// OpenZeppelin 的 Address.sendValue(payable(to), amount) 封装了同样的逻辑
`)}
<p>重入攻击的完整原理和攻防实验在 <a href="#m02-7">M02.8 合约安全 I</a>。</p>

${cases([
  ['transfer() 的 2300 Gas 限制与伊斯坦布尔升级', '2019 年',
   '<p>很多合约用 <code>transfer()</code> 给地址转 ETH，默认接收方只会做很少的事。2019 年的伊斯坦布尔硬分叉包含 EIP-1884，把读存储（SLOAD）的 Gas 从 200 提高到 800。一些接收方的 fallback 原本刚好能在 2,300 Gas 内跑完，涨价后就会超限，转账随之失败。</p><p>安全社区因此建议：不要再依赖 <code>transfer()</code> 和 <code>send()</code>，改用 <code>call</code>，同时用检查-生效-交互顺序或重入锁防重入。启示：<strong>EVM 的 Gas 价格会随硬分叉变化，代码不应该依赖某个固定的 Gas 数量。</strong></p>',
   [['ConsenSys Diligence：Stop Using Solidity’s transfer() Now', 'https://diligence.consensys.io/blog/2019/09/stop-using-soliditys-transfer-now'], ['ChainSecurity：Istanbul 硬分叉 EIP 与 Gas 成本变化', 'https://chainsecurity.com/istanbul-hardfork-eips-increasing-gas-costs-and-more/']]]
], 'h3')}

<h2>5. 库与 OpenZeppelin</h2>
<p><strong>库（library）</strong>是一段可复用的函数集合，没有自己的状态变量，不能收 ETH。<code>using L for T;</code> 让类型 T 的变量可以像调用方法一样调用库函数。</p>
${code('SOLIDITY', `
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Pay {
    using SafeERC20 for IERC20;                 // 给 IERC20 类型“挂上”库函数
    function pull(IERC20 token, uint256 amt) external {
        token.safeTransferFrom(msg.sender, address(this), amt);  // 兼容不返回 bool 的代币（如 USDT）
    }
}
`)}
${tbl(['OpenZeppelin 组件（v5）', '导入路径', '作用'], [
  ['Ownable', '<code>access/Ownable.sol</code>', '单一所有者；v5 构造函数必须传 initialOwner'],
  ['AccessControl', '<code>access/AccessControl.sol</code>', '多角色权限：grantRole / revokeRole / onlyRole'],
  ['ReentrancyGuard', '<code>utils/ReentrancyGuard.sol</code>', 'nonReentrant 修饰器，阻止重入'],
  ['Pausable', '<code>utils/Pausable.sol</code>', 'whenNotPaused 修饰器，紧急暂停'],
  ['SafeERC20', '<code>token/ERC20/utils/SafeERC20.sol</code>', '安全地调用非标准 ERC-20'],
  ['ERC20 / ERC721 / ERC1155', '<code>token/…</code>', '代币标准实现，见 <a href="#m02-5">M02.5</a>（ERC-20）和 <a href="#m02-50">M02.6</a>（NFT）']
])}
${call('info', '<p>OpenZeppelin v4 到 v5 有不兼容修改：部分文件路径从 <code>security/</code> 移到 <code>utils/</code>；错误改用自定义错误；Ownable 构造函数需要参数。复制网上旧代码时先确认版本。</p>')}

<h2>6. 完整示例：带权限的 ETH 金库</h2>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice 用户存取 ETH；每人每天有提款上限；管理员可暂停；资金管理员可调整上限
contract Vault is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant PAUSER_ROLE   = keccak256("PAUSER_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    uint256 public dailyLimit;                              // 每人每天可提上限（wei）
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public withdrawnToday;
    mapping(address => uint256) public dayIndex;            // 记录 withdrawnToday 属于哪一天

    error ZeroAmount();
    error Insufficient(uint256 balance, uint256 requested);
    error OverDailyLimit(uint256 remaining, uint256 requested);
    error TransferFailed();
    error UnknownCall();

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DailyLimitChanged(uint256 oldLimit, uint256 newLimit);

    constructor(address admin, uint256 limit) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);              // 管理员（建议是多签地址）
        _grantRole(PAUSER_ROLE, admin);
        dailyLimit = limit;
    }

    function deposit() public payable whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        balanceOf[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    receive() external payable { deposit(); }               // 直接转账也算存款
    fallback() external payable { revert UnknownCall(); }   // 拒绝未知调用

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        uint256 bal = balanceOf[msg.sender];
        if (amount > bal) revert Insufficient(bal, amount);

        uint256 today = block.timestamp / 1 days;           // 按 UTC 日切分
        if (dayIndex[msg.sender] != today) {                // 新的一天：重置计数
            dayIndex[msg.sender] = today;
            withdrawnToday[msg.sender] = 0;
        }
        uint256 used = withdrawnToday[msg.sender];
        if (used + amount > dailyLimit) {
            // dailyLimit 可能被下调到低于 used：此时直接相减会下溢触发 Panic(0x11)，所以先判断
            uint256 remaining = used >= dailyLimit ? 0 : dailyLimit - used;
            revert OverDailyLimit(remaining, amount);
        }

        // Effects：先改账
        balanceOf[msg.sender] = bal - amount;
        withdrawnToday[msg.sender] = used + amount;
        // Interactions：最后转账
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    function setDailyLimit(uint256 limit) external onlyRole(TREASURER_ROLE) {
        emit DailyLimitChanged(dailyLimit, limit);
        dailyLimit = limit;
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
`)}
${mm('金库的权限与资金流', `
flowchart LR
  U["普通用户"] -->|"deposit / receive"| V[("Vault 合约<br/>balanceOf 账本")]
  V -->|"withdraw：检查余额与日限额<br/>先扣账再转账"| U
  ADM["DEFAULT_ADMIN_ROLE<br/>多签"] -->|"grantRole / revokeRole / unpause"| V
  P["PAUSER_ROLE<br/>值班监控机器人"] -->|"pause"| V
  T["TREASURER_ROLE"] -->|"setDailyLimit"| V
`, [
  ['flow', '用户只能动自己的余额；管理角色不能直接转走用户资金，只能调参数和暂停。'],
  ['key', '权限分离：暂停权给反应快的监控账户，恢复权留给多签，避免单点被盗后“暂停-恢复”被滥用。'],
  ['risk', 'DEFAULT_ADMIN_ROLE 能给任何人授予任何角色，等于最高权限。它必须是多签 + 时间锁，绝不能是开发者的个人 EOA。'],
  ['fail', '暂停期间用户无法提款。暂停是双刃剑：要在文档中公开谁能暂停、多久必须恢复。']
])}
<p><strong>算一算（示例）</strong>：dailyLimit = 5 ETH。Bob 余额 8 ETH，今天已经提了 3 ETH，现在申请提 3 ETH。</p>
${steps(['余额检查：3 ≤ 8，通过。', '日限额检查：已用 3 + 申请 3 = 6 > 5，不通过。', '回滚数据：<code>OverDailyLimit(remaining = 5 − 3 = 2 ETH, requested = 3 ETH)</code>，前端可以直接提示“今天最多还能提 2 ETH”。', '第二天 <code>block.timestamp / 1 days</code> 加 1，计数重置，Bob 可以再提最多 5 ETH。'])}
${tryit(`<p><strong>在 Remix 中测试金库</strong></p>
<ol><li>在 Remix 新建 <code>Vault.sol</code> 粘贴代码。Remix 会自动从 npm 解析 <code>@openzeppelin/contracts</code> 导入。</li>
<li>用 Remix VM 部署：admin 填当前账户地址，limit 填 <code>5000000000000000000</code>（5 ETH）。</li>
<li>在 VALUE 输入 8 Ether，调用 deposit。然后调用 withdraw(3 ETH 对应的 wei) 两次。</li>
<li>预期：第二次 revert，终端显示 OverDailyLimit 及参数。再用另一个账户调用 pause，预期 revert（缺少 PAUSER_ROLE），错误为 AccessControlUnauthorizedAccount。</li></ol>`)}

${mistakes([
  ['transfer 只转 2,300 Gas，所以最安全。', '2,300 Gas 的限制会让合约钱包（多签、AA 钱包）收不到钱。推荐 call + 检查返回值 + 先记账后转账 + 重入锁。'],
  ['用 require 写字符串错误信息没有成本。', '错误字符串被编进字节码，增加部署成本，回滚时也更贵。生产代码用自定义错误。'],
  ['unchecked 能省很多 Gas，应该到处用。', '每次省几十 Gas，但去掉了溢出保护。只在可证明安全的计数器上使用。'],
  ['onlyOwner 就够了，权限设计很简单。', '单一 owner 是单点故障。企业级合约要角色分离、多签持有管理员、关键操作加时间锁。'],
  ['assert 和 require 可以互换。', 'require 检查外部输入；assert 只检查内部不变量。assert 失败意味着代码有 bug，审计工具和模糊测试会专门寻找能触发它的输入。']
])}
${recap([
  'modifier 复用前置检查；构造函数只执行一次；virtual / override 控制覆盖；interface 描述外部合约；abstract 不能部署。',
  '优先用自定义错误 revert，省 Gas 且带参数；assert 只用于内部不变量；Panic 码说明代码有 bug。',
  '0.8 起整数运算自动检查溢出；unchecked 只用于可证明安全的地方。',
  '收 ETH 需要 payable / receive；发 ETH 用 call 并检查返回值，遵守检查-生效-交互顺序并加 nonReentrant。',
  '复用 OpenZeppelin 的 AccessControl、Pausable、ReentrancyGuard、SafeERC20，注意 v4 与 v5 的差异。'
])}
${quiz([
  { q: '下列哪种发送 ETH 的写法最推荐？', o: ['payable(to).transfer(amt)', '(bool ok, ) = payable(to).call{value: amt}(""); if (!ok) revert TransferFailed();', 'payable(to).send(amt);', 'selfdestruct(payable(to))'], a: 1, why: 'call 转发足够 Gas，兼容合约钱包，并且检查了返回值。transfer / send 固定 2,300 Gas；send 还忽略了返回值；selfdestruct 不是转账手段。' },
  { q: '合约只有 receive()，没有 fallback()。有人发来一笔带 ETH、data 为 0x12345678 的调用（不匹配任何函数），结果？', o: ['执行 receive()', 'ETH 被接收但什么也不执行', '编译器自动生成 fallback 处理', 'revert'], a: 3, why: 'data 不为空时不会走 receive；不匹配任何函数且没有 fallback，调用 revert。' },
  { q: 'Solidity 0.8.24 中，<code>uint8 x = 255; x += 1;</code> 会怎样？', o: ['x 变成 0', 'x 变成 256', '以 Panic(0x11) 回滚', '编译失败'], a: 2, why: '0.8 起默认检查溢出，溢出时 Panic(0x11)。只有放在 unchecked 块中才会回绕成 0。' },
  { q: '在金库合约中，最应该交给多签 + 时间锁的角色是？', o: ['DEFAULT_ADMIN_ROLE', '普通存款用户', 'PAUSER_ROLE', '任何调用 deposit 的人'], a: 0, why: 'DEFAULT_ADMIN_ROLE 能授予和撤销所有角色，是最高权限。PAUSER_ROLE 需要快速反应，通常给监控机器人。' }
])}
${exercises([["计算题：金库的 dailyLimit 设为 4 ETH（示例）。Carol 余额 6 ETH，今天已经提了 1 ETH。她先申请提 3 ETH，再申请提 1 ETH。两次结果分别是什么？", "<p>第一次：余额检查 3 ≤ 6 通过；日限额检查 1 + 3 = 4，不大于 4，通过。Carol 余额变为 3 ETH，今日已提 4 ETH。</p><p>第二次：余额检查 1 ≤ 3 通过；日限额检查 4 + 1 = 5 > 4，不通过。交易回滚，错误为 <code>OverDailyLimit(remaining = 0, requested = 1 ETH)</code>。第二天计数重置后她才能继续提。</p>"], ["思考题：一个合约没有 <code>receive()</code>，只有 <code>payable fallback()</code>。有人向它发送一笔 data 为空的纯 ETH 转账。会执行哪个函数？如果 fallback 不是 payable，结果又会怎样？", "<p>calldata 为空时，EVM 先找 <code>receive()</code>。没有 receive，就看是否有 payable fallback。这里有，所以执行 <code>fallback()</code>，ETH 被接收。</p><p>如果 fallback 不是 payable，合约无法接收这笔 ETH，调用 revert。</p>"], ["设计题：文中的 Vault 部署后，有人发现 <code>setDailyLimit</code> 谁都调用不了。原因是什么？应该由谁、用什么调用修复？", "<p>构造函数只授予了 <code>DEFAULT_ADMIN_ROLE</code> 和 <code>PAUSER_ROLE</code>，没有任何地址持有 <code>TREASURER_ROLE</code>。所以 <code>onlyRole(TREASURER_ROLE)</code> 对所有人都失败。</p><p>修复：由持有 <code>DEFAULT_ADMIN_ROLE</code> 的多签调用 <code>grantRole(TREASURER_ROLE, 资金管理员地址)</code>。这样调参数的权限和最高权限保持分离。</p>"]])}
${checklist(["能写出带自定义错误的 modifier，并说清 _; 在函数体中的位置含义。", "能根据 calldata 是否为空、有无 receive 或 payable fallback，判断一笔调用进入哪个函数。", "能用 call 发送 ETH 并检查返回值，按检查-生效-交互顺序写出 withdraw。", "在 Remix 里部署过带 AccessControl、Pausable、ReentrancyGuard 的金库，并触发过 OverDailyLimit 回滚。", "能说出 Panic 0x01、0x11、0x12 各自对应的错误原因。"])}
${terms([
  ['修饰器', 'Modifier', '附加在函数上的可复用前置或后置逻辑'],
  ['虚函数 / 覆盖', 'virtual / override', '父合约允许被改写的函数，以及子合约中改写它的声明'],
  ['接口', 'Interface', '只声明外部函数、不含实现的合约类型'],
  ['抽象合约', 'Abstract Contract', '含未实现函数或不打算直接部署的合约'],
  ['自定义错误', 'Custom Error', '用 error 声明、以 4 字节选择器编码的回滚原因'],
  ['恐慌错误', 'Panic', '编译器插入的检查失败时抛出的错误，带错误码'],
  ['接收函数', 'receive()', 'calldata 为空时接收 ETH 的特殊函数'],
  ['回退函数', 'fallback()', '调用不匹配任何函数时执行的特殊函数'],
  ['检查-生效-交互', 'Checks-Effects-Interactions', '先校验、再更新状态、最后外部调用的编码顺序'],
  ['库', 'Library', '无状态、可复用的函数集合，可用 using for 挂到类型上']
])}
` });

CUR = 'm02-4';
addCh({ id: 'm02-4', nav: '开发工具链', title: 'M02.4 开发工具链：Foundry 测试、部署、验证与 CI', desc: '用 Foundry 完成测试、模糊/不变量测试、fork、部署验证与 CI', html: `
<h1>M02.4 开发工具链：Foundry 测试、部署、验证与 CI</h1>
${meta(['比较 Remix、Foundry、Hardhat，并为项目选择工具。', '用 Foundry 写单元测试、模糊测试、不变量测试和主网 fork 测试。', '用 forge script 部署、在 Etherscan 验证、用 cast 调试，并把测试和 Slither 接入 CI。'], '<a href="#m02-3">M02.3 Solidity 基础 II</a>')}
${beginner(`<p><strong>命令行（CLI）</strong>：在终端里输入命令操作程序。Foundry 全部通过命令行使用。</p>
<p><strong>单元测试（Unit Test）</strong>：针对单个函数写的自动化检查，“输入 X，期望输出 Y”。</p>
<p><strong>模糊测试（Fuzz Testing）</strong>：让工具自动生成成百上千个随机输入，寻找让代码出错的情况。</p>
<p><strong>Fork（分叉）</strong>：把主网某个区块的状态“复制”到本地，在本地对真实的合约和余额做实验，不花真钱。</p>
<p><strong>CI（持续集成）</strong>：每次提交代码时，服务器自动运行编译、测试和检查。</p>`)}

<h2>1. 一句话理解</h2>
${one('合约一旦部署就难以修改，所以“测试—部署—验证”流水线是合约工程的生命线：Foundry 负责写测试和部署，cast 负责和链交互，Slither 负责静态找错，CI 保证每次修改都被检查。')}
${call('analogy', `<p>造飞机：Remix 是纸面草图；Foundry 是风洞和试飞场——单元测试是检查每个零件，模糊测试是用各种极端天气轰炸，不变量测试是确认“无论怎么飞，机翼都不会掉”；fork 测试是在真实机场的复制品上试飞。</p>
<p>比喻的局限：风洞再多也不能证明飞机绝对安全。测试只能发现 bug，不能证明没有 bug，所以还需要审计和形式化验证。</p>`)}
${art('一图看懂：上线前连过四道测试关，再部署、验证源码', 660, 340, [
  S.zone(10, 30, 640, 150, { t: 'forge test：本地 anvil 或主网 fork 上运行' }),
  S.box(24, 60, 140, 104, { k: 'info', t: '单元测试', s: 'test_*\n一个输入对不对', mono: 1 }),
  S.box(188, 60, 140, 104, { k: 'info', t: '模糊测试', s: 'testFuzz_*\n随机输入也对吗', mono: 1 }),
  S.box(352, 60, 140, 104, { k: 'key', t: '不变量测试', s: 'invariant_*\n任意操作序列后\n规则仍成立', mono: 1 }),
  S.box(516, 60, 120, 104, { k: 'info', t: 'fork 测试', s: '真实主网状态\nvm.createSelectFork', mono: 1 }),
  S.box(10, 222, 173, 64, { k: 'info', icon: 'check', t: 'CI 绿灯', s: 'forge test + slither' }),
  S.box(243, 222, 173, 64, { k: 'warn', icon: 'key', t: '部署', s: '--broadcast\n私钥放 keystore', mono: 1 }),
  S.box(476, 222, 174, 64, { k: 'info', icon: 'doc', t: '验证源码', s: '--verify · Etherscan', mono: 1 }),
  S.arrow(96, 182, 96, 220),
  S.arrow(185, 254, 241, 254),
  S.arrow(418, 254, 474, 254),
  S.text(330, 322, '测试只能发现 bug，不能证明没有 bug：上线前还需要审计', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '四种测试都用 forge test 跑，全部通过、CI 变绿，才进入部署和验证。'],
  ['key', '不变量测试最强：它不挑输入，而是问“无论怎么调用，偿付能力这类规则会不会被破坏”。'],
  ['risk', '部署私钥不要写进命令行或 .env 明文，用加密 keystore 或硬件钱包。'],
  ['limit', 'fork 测试依赖外部 RPC，固定区块号才能复现；免费节点有限流。']
], '四种测试依次通过后，CI 变绿，再用 forge script 部署，并在 Etherscan 验证源码', 'm02-4')}

<h2>2. 三种工具怎么选</h2>
${tbl(['维度', 'Remix', 'Foundry', 'Hardhat'], [
  ['形态', '浏览器 IDE', 'Rust 写的命令行工具集：forge / cast / anvil / chisel', 'Node.js 框架 + 插件生态'],
  ['测试语言', '基础单测插件', 'Solidity', 'TypeScript / JavaScript（Hardhat 3 起也支持 Solidity 测试）'],
  ['速度', '—', '很快（编译和测试并行）', '较慢于 Foundry'],
  ['模糊 / 不变量测试', '无', '内置', '需要插件或外部工具'],
  ['适合', '学习、快速验证片段', '合约开发主力、审计、安全研究', '与前端 / TS 工具链深度整合的团队'],
  ['本地链', 'Remix VM', 'anvil', 'Hardhat Network']
])}
<p>本手册的工程示例以 Foundry 为主。两者可以共存：合约和测试用 Foundry，部署脚本或前端集成用 TypeScript。</p>
${mm('Foundry 工具集各自负责什么', `
flowchart LR
  DEV["开发者"] --> FORGE["forge<br/>编译 / 测试 / 部署脚本 / 验证"]
  DEV --> CAST["cast<br/>命令行读写链、编码解码"]
  DEV --> ANVIL["anvil<br/>本地节点，可 fork 主网"]
  DEV --> CHISEL["chisel<br/>Solidity 交互式 REPL"]
  FORGE -->|"--rpc-url"| ANVIL
  CAST -->|"--rpc-url"| ANVIL
  FORGE -->|"--broadcast"| NET["测试网 / 主网 RPC"]
  FORGE -->|"--verify"| SCAN["Etherscan 验证 API"]
`, [
  ['flow', '开发时 forge 和 cast 连接本地 anvil；发布时连接真实网络 RPC，并把源码提交给 Etherscan 验证。'],
  ['key', 'forge 管“代码”，cast 管“链”，anvil 管“本地环境”。'],
  ['risk', '部署私钥不要写进命令行参数或 .env 明文。用 cast wallet 加密 keystore 或硬件钱包。'],
  ['limit', 'anvil fork 依赖外部 RPC；免费 RPC 有限流，大量 fork 测试需要付费节点或本地缓存。']
])}

<h2>3. Foundry 项目与单元测试</h2>
${code('BASH', `
# 安装（macOS / Linux）
curl -L https://foundry.paradigm.xyz | bash
foundryup                                   # 安装或更新 forge / cast / anvil / chisel

# 初始化项目
forge init vault-project && cd vault-project
forge install OpenZeppelin/openzeppelin-contracts   # 依赖装到 lib/ 目录
forge build                                 # 编译，产物在 out/
forge test -vvv                             # 运行测试；v 越多输出越详细（-vvvv 显示调用栈）
`)}
${code('BASH', `
vault-project/
├── foundry.toml        # 配置：编译器版本、优化器、RPC 别名
├── src/Vault.sol       # 合约
├── test/Vault.t.sol    # 测试（文件名以 .t.sol 结尾）
├── script/Deploy.s.sol # 部署脚本
└── lib/                # 依赖（forge-std、openzeppelin-contracts）
`)}
${code('BASH', `
# foundry.toml 示例
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200
remappings = ["@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/"]

[fuzz]
runs = 1000              # 每个模糊测试随机运行 1000 次

[invariant]
runs = 256
depth = 50               # 每轮随机调用 50 次

[rpc_endpoints]
mainnet = "\${MAINNET_RPC_URL}"
sepolia = "\${SEPOLIA_RPC_URL}"
`)}
<p>下面测试 <a href="#m02-3">M02.3</a> 中的 Vault 合约：</p>
${code('SOLIDITY', `
// test/Vault.t.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";

contract VaultTest is Test {
    Vault vault;
    address admin = makeAddr("admin");      // 生成带标签的确定性地址
    address bob   = makeAddr("bob");

    event Withdrawn(address indexed user, uint256 amount);

    function setUp() public {               // 每个测试函数运行前都会执行
        vault = new Vault(admin, 5 ether);
        vm.deal(bob, 10 ether);             // 作弊码：直接设置 bob 的 ETH 余额
    }

    function test_DepositAndWithdraw() public {
        vm.prank(bob);                      // 下一次调用的 msg.sender = bob
        vault.deposit{value: 8 ether}();
        assertEq(vault.balanceOf(bob), 8 ether);

        vm.expectEmit(true, false, false, true);   // 检查 topic1 和 data
        emit Withdrawn(bob, 3 ether);
        vm.prank(bob);
        vault.withdraw(3 ether);
        assertEq(bob.balance, 5 ether);     // 10 - 8 + 3
    }

    function test_RevertWhen_OverDailyLimit() public {
        vm.startPrank(bob);                 // 之后所有调用都以 bob 身份，直到 stopPrank
        vault.deposit{value: 8 ether}();
        vault.withdraw(3 ether);
        vm.expectRevert(abi.encodeWithSelector(Vault.OverDailyLimit.selector, 2 ether, 3 ether));
        vault.withdraw(3 ether);
        vm.stopPrank();
    }

    function test_LimitResetsNextDay() public {
        vm.startPrank(bob);
        vault.deposit{value: 8 ether}();
        vault.withdraw(5 ether);
        vm.warp(block.timestamp + 1 days);  // 作弊码：把区块时间往后拨一天
        vault.withdraw(3 ether);            // 新的一天，可以再提
        vm.stopPrank();
        assertEq(vault.balanceOf(bob), 0);
    }

    function test_RevertWhen_NonPauserPauses() public {
        vm.expectRevert();                  // 不关心具体错误时可以不带参数
        vm.prank(bob);
        vault.pause();
    }
}
`)}
${tbl(['作弊码（Cheatcode）', '作用'], [
  ['<code>vm.prank(a)</code> / <code>vm.startPrank(a)</code>', '把下一次 / 之后所有调用的 msg.sender 设为 a'],
  ['<code>vm.deal(a, amt)</code>', '设置地址 a 的 ETH 余额；ERC-20 用 forge-std 的 <code>deal(token, a, amt)</code>'],
  ['<code>vm.warp(t)</code> / <code>vm.roll(n)</code>', '设置 block.timestamp / block.number'],
  ['<code>vm.expectRevert(data)</code>', '断言下一次调用以指定错误回滚'],
  ['<code>vm.expectEmit(...)</code>', '断言下一次调用发出指定事件'],
  ['<code>makeAddr("x")</code>', '生成带标签的测试地址，调用栈里显示名字'],
  ['<code>bound(x, lo, hi)</code>', '把模糊输入映射到区间内（比 vm.assume 丢弃输入更高效）'],
  ['<code>vm.store(a, slot, v)</code> / <code>vm.load(a, slot)</code>', '直接写 / 读合约 a 的存储槽；配合 <a href="#lab-slot">存储槽计算器</a> 构造特殊状态'],
  ['<code>vm.mockCall(a, data, ret)</code>', '让对 a 的某个调用返回指定数据，用来模拟预言机、外部协议的各种返回值'],
  ['<code>vm.expectCall(a, data)</code>', '断言下一次调用期间，确实调用了 a 的指定函数'],
  ['<code>vm.createSelectFork(url, block)</code>', '创建并切换到指定区块的 fork；<code>vm.createFork</code> + <code>vm.selectFork</code> 可在多条链之间切换']
])}

<h2>4. 模糊测试、不变量测试与 fork 测试</h2>
<h3>4.1 模糊测试</h3>
<p>测试函数带参数时，forge 自动生成随机输入运行多次（默认 256 次，可配置）。发现失败时，forge 会“缩小”（shrink）输入，给出最简反例。</p>
${code('SOLIDITY', `
function testFuzz_WithdrawNeverExceedsBalance(uint256 dep, uint256 amt) public {
    dep = bound(dep, 1, 10 ether);          // 存款限定在 1 wei 到 10 ETH
    amt = bound(amt, 1, 20 ether);
    vm.startPrank(bob);
    vault.deposit{value: dep}();
    if (amt > dep || amt > 5 ether) {
        vm.expectRevert();                  // 超过余额或日限额必须回滚
        vault.withdraw(amt);
    } else {
        vault.withdraw(amt);
        assertEq(vault.balanceOf(bob), dep - amt);
    }
    vm.stopPrank();
}
`)}
<h3>4.2 不变量测试</h3>
<p>不变量（Invariant）是“无论按什么顺序调用什么函数，都必须成立”的性质。例如：合约 ETH 余额 ≥ 所有用户 balanceOf 之和（偿付能力）。forge 会随机组合调用 Handler 合约的函数，每轮之后检查不变量。下面的代码检查两条：<code>invariant_Solvent</code> 就是这条偿付能力；<code>invariant_MatchesGhost</code> 用测试侧的“幽灵变量”记一本账，要求合约余额恰好等于“存入总额 − 提取总额”，能发现多转、少转 ETH 的 bug。</p>
${code('SOLIDITY', `
// test/VaultInvariant.t.sol
contract Handler is Test {
    Vault public vault;
    address[] public actors;
    uint256 public ghostDeposited;          // “幽灵变量”：测试侧记账，用来和合约对比
    uint256 public ghostWithdrawn;

    constructor(Vault v) {
        vault = v;
        for (uint256 i; i < 3; i++) actors.push(makeAddr(string(abi.encode(i))));
    }
    function deposit(uint256 who, uint256 amt) external {
        address a = actors[bound(who, 0, 2)];
        amt = bound(amt, 1, 100 ether);
        vm.deal(a, amt);
        vm.prank(a);
        vault.deposit{value: amt}();
        ghostDeposited += amt;
    }
    function withdraw(uint256 who, uint256 amt) external {
        address a = actors[bound(who, 0, 2)];
        uint256 bal = vault.balanceOf(a);
        if (bal == 0) return;
        amt = bound(amt, 1, bal < 5 ether ? bal : 5 ether);
        vm.prank(a);
        try vault.withdraw(amt) { ghostWithdrawn += amt; } catch {}
    }
}

contract VaultInvariantTest is Test {
    Vault vault; Handler handler;
    function setUp() public {
        vault = new Vault(address(this), 5 ether);
        handler = new Handler(vault);
        targetContract(address(handler));   // 只随机调用 Handler 的函数
    }
    // 不变量 1（正文定义的偿付能力）：合约 ETH 余额 ≥ 所有用户 balanceOf 之和
    function invariant_Solvent() public view {
        uint256 sum;
        for (uint256 i; i < 3; i++) sum += vault.balanceOf(handler.actors(i));
        assertGe(address(vault).balance, sum);
    }
    // 不变量 2（记账对得上）：合约 ETH 余额 == 测试侧幽灵账（存入总额 − 提取总额）
    function invariant_MatchesGhost() public view {
        assertEq(address(vault).balance, handler.ghostDeposited() - handler.ghostWithdrawn());
    }
}
`)}
${call('info', '<p>不变量测试里，Handler 的函数被随机调用，很多调用会因为前置条件不满足而 revert。配置项 <code>fail_on_revert</code> 决定这类 revert 是否算测试失败：设为 <code>false</code>（常用）时，revert 的调用被忽略，重点检查不变量；设为 <code>true</code> 时，每次 revert 都视为失败，适合要求“Handler 永不 revert”的严格场景。用 <code>targetSelector</code> 可以只让某几个函数参与随机调用。</p>')}
<h3>4.3 主网 fork 测试</h3>
${code('SOLIDITY', `
contract ForkTest is Test {
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;  // 以太坊主网 USDC
    function setUp() public {
        vm.createSelectFork("mainnet", 21_000_000);   // 固定区块号，结果可复现、可缓存
    }
    function test_ReadRealUSDC() public view {
        (bool ok, bytes memory d) = USDC.staticcall(abi.encodeWithSignature("decimals()"));
        assertTrue(ok);
        assertEq(abi.decode(d, (uint8)), 6);
    }
}
`)}
${code('BASH', `
export MAINNET_RPC_URL=https://你的节点服务商地址
forge test --match-contract ForkTest -vvv           # 只跑 fork 测试
forge test --fork-url $MAINNET_RPC_URL              # 也可以让所有测试在 fork 上运行
anvil --fork-url $MAINNET_RPC_URL                   # 启动本地 fork 节点，供前端联调
`)}
${mm('测试金字塔：每层发现什么问题', `
flowchart BT
  U["单元测试<br/>每个函数的正常与异常路径"] --> F["模糊测试<br/>随机输入找边界值 bug"]
  F --> I["不变量测试<br/>随机调用序列找状态机 bug"]
  I --> K["fork 测试<br/>与真实协议、真实代币集成"]
  K --> A["审计 + 形式化验证 + 漏洞赏金"]
`, [
  ['flow', '越往上越接近真实环境、成本越高、数量越少。'],
  ['key', '不变量测试最能发现“单个函数都对、组合起来错”的漏洞，DeFi 项目必须有。'],
  ['fail', 'fork 测试不固定区块号时，链上状态每次不同，测试结果会漂移。'],
  ['limit', '覆盖率 100% 不代表安全：覆盖率只说明代码被执行过，不说明断言写对了。']
])}

<h2>5. 部署、验证与 cast</h2>
${code('SOLIDITY', `
// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Vault} from "../src/Vault.sol";

contract Deploy is Script {
    function run() external returns (Vault v) {
        address admin = vm.envAddress("VAULT_ADMIN");   // 从环境变量读取多签地址
        vm.startBroadcast();                            // 之后的调用会被签名并广播
        v = new Vault(admin, 5 ether);
        vm.stopBroadcast();
        console.log("Vault deployed at", address(v));
    }
}
`)}
${code('BASH', `
# 1. 把部署私钥导入加密 keystore（交互输入私钥和密码，不留在 shell 历史）
cast wallet import deployer --interactive

# 2. 先在本地 anvil 演练
anvil &
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --account deployer --broadcast

# 3. 部署到 Sepolia 并自动验证源码
export VAULT_ADMIN=0x你的多签地址
export ETHERSCAN_API_KEY=你的key
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --account deployer --broadcast --verify

# 4. 已部署合约补做验证（构造参数需 ABI 编码）
forge verify-contract 0x合约地址 src/Vault.sol:Vault --chain sepolia --constructor-args $(cast abi-encode "constructor(address,uint256)" $VAULT_ADMIN 5000000000000000000)
`)}
<p>部署记录保存在 <code>broadcast/</code> 目录（含交易哈希和合约地址），应提交到仓库作为审计证据。</p>
${tbl(['cast 命令', '用途'], [
  ['<code>cast block-number --rpc-url $RPC</code>', '查看最新区块高度'],
  ['<code>cast balance 0x… --ether --rpc-url $RPC</code>', '查询 ETH 余额（以 ETH 为单位显示）'],
  ['<code>cast call 0xToken "balanceOf(address)(uint256)" 0xUser --rpc-url $RPC</code>', '只读调用，括号里第二组是返回类型'],
  ['<code>cast send 0xVault "withdraw(uint256)" 1000 --account deployer --rpc-url $RPC</code>', '签名并发送交易'],
  ['<code>cast sig "transfer(address,uint256)"</code>', '计算函数选择器，输出 0xa9059cbb'],
  ['<code>cast keccak "Transfer(address,address,uint256)"</code>', '计算事件 topic0'],
  ['<code>cast calldata "transfer(address,uint256)" 0xBob 100</code>', '生成调用数据'],
  ['<code>cast storage 0xContract 0 --rpc-url $RPC</code>', '读取存储槽 0 的原始值（private 变量也能读）'],
  ['<code>cast receipt 0xTxHash --rpc-url $RPC</code>', '查看交易回执、gasUsed、日志'],
  ['<code>cast run 0xTxHash --rpc-url $RPC</code>', '在本地重放一笔历史交易并打印调用栈，排查失败原因'],
  ['<code>cast to-wei 1.5 ether</code> / <code>cast from-wei 1500000000000000000</code>', '单位换算']
])}

<h2>6. 静态分析、Gas 报告与 CI</h2>
<p>本篇只讲 Foundry 自带的测试和 Slither 基本用法；Echidna、Medusa、Halmos、Certora 和 Slither 打印器等审计工具见 <a href="#m02-62">M02.10 审计方法与工具链</a>。</p>
${code('BASH', `
# Slither：Trail of Bits 的静态分析器（需要 Python 3）
pip3 install slither-analyzer
slither .                                   # 在 Foundry 项目根目录运行
slither . --filter-paths "lib|test"         # 忽略依赖和测试目录

# 其他常用检查
forge fmt --check                           # 代码格式
forge coverage --report summary             # 覆盖率
forge test --gas-report                     # 每个函数的 Gas 统计（见 M02.7）
forge snapshot                              # 生成 .gas-snapshot，CI 中对比 Gas 回归
`)}
${code('BASH', `
# .github/workflows/test.yml
name: contracts
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive              # forge install 的依赖是 git 子模块
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge fmt --check
      - run: forge build --sizes             # 同时检查合约大小是否超过 24KB
      - run: forge test -vvv
        env:
          MAINNET_RPC_URL: \${{ secrets.MAINNET_RPC_URL }}
      - run: forge snapshot --check          # Gas 比基线变化时失败
  slither:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: crytic/slither-action@v0.4.2
        with:
          fail-on: high                      # 发现高危问题时让 CI 失败
`)}
${mm('从提交到上线的合约流水线', `
flowchart LR
  PR["提交 PR"] --> CI["CI：fmt / build / test<br/>fuzz / invariant / fork"]
  CI --> SL["Slither 静态分析"]
  SL --> RV["人工代码评审"]
  RV --> AU["外部审计（重大版本）"]
  AU --> TN["测试网部署 + 验证<br/>演练升级与暂停"]
  TN --> MN["主网部署<br/>多签执行"]
  MN --> MON["监控：事件、余额、权限变更告警"]
  CI -->|"失败"| PR
  SL -->|"高危"| PR
`, [
  ['flow', '每一步失败都打回 PR。主网部署前必须在测试网完整演练一次，包括管理操作。'],
  ['key', 'broadcast 记录、验证后的源码、审计报告三者要能对应到同一个 commit。'],
  ['risk', 'CI 中的 RPC key、Etherscan key 放 Secrets；部署私钥永远不进 CI，主网部署由多签人工确认。'],
  ['limit', 'Slither 会有误报，需要人工确认；它也发现不了业务逻辑错误。']
])}
<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['编译器版本锁定、优化器参数固定', '保证源码可复现出链上字节码', 'Etherscan 验证通过'],
  ['单元 + 模糊 + 不变量测试全部通过', '覆盖输入边界和调用序列', 'CI 绿灯；fuzz runs ≥ 1000（示例）'],
  ['Slither 无未处理的高 / 中危', '自动发现常见漏洞模式', 'CI 报告 + 人工确认记录'],
  ['部署私钥使用 keystore 或硬件钱包', '防止私钥泄露', '检查脚本中没有 --private-key 明文'],
  ['管理员地址是多签', '避免单点控制', '链上读取 hasRole / owner，确认是多签合约'],
  ['合约已在区块浏览器验证', '用户和审计方能核对源码', 'Etherscan 显示绿色 Verified'],
  ['Gas 快照纳入 CI', '防止性能回归', 'forge snapshot --check 通过']
])}
${tryit(`<p><strong>15 分钟跑通 Foundry</strong></p>
<ol><li>执行第 3 节的安装和 <code>forge init</code> 命令，运行 <code>forge test</code>，预期默认的 Counter 测试全部 PASS。</li>
<li>把 <a href="#m02-3">M02.3</a> 的 Vault 放进 <code>src/</code>，把本篇单元测试放进 <code>test/</code>，运行 <code>forge test -vvv</code>，预期 4 个测试通过。</li>
<li>故意把 Vault 中 <code>balanceOf[msg.sender] = bal - amount;</code> 改成 <code>bal + amount</code>，再运行测试和不变量测试，预期测试失败并给出反例。</li>
<li>运行 <code>cast sig "withdraw(uint256)"</code>，记下输出的选择器，用 <code>cast calldata "withdraw(uint256)" 1</code> 确认它出现在调用数据开头。</li></ol>`)}

${mistakes([
  ['测试覆盖率 100% 就安全了。', '覆盖率只说明每行被执行过。断言写错、缺少不变量、经济攻击都不会被覆盖率发现。'],
  ['把私钥写进 .env，用 --private-key 传参最方便。', '明文私钥会进入 shell 历史、日志或被误提交。用 cast wallet keystore、硬件钱包，主网用多签。'],
  ['fork 测试不用固定区块号。', '不固定区块，链上状态每次都变，测试不可复现，也无法利用 RPC 缓存。'],
  ['Slither 没报错就没漏洞。', '静态分析只能识别已知模式。业务逻辑、权限设计、经济模型仍需人工审查和审计。']
])}
${recap([
  'Remix 学习，Foundry 做主力开发和测试，Hardhat 适合 TS 生态深度整合；可以混用。',
  'Foundry 测试用 Solidity 编写：setUp 准备环境，作弊码 prank / deal / warp / expectRevert 控制场景。',
  '模糊测试找边界输入，不变量测试找调用序列问题，fork 测试验证与真实协议的集成。',
  'forge script + keystore 部署，--verify 自动验证源码；cast 负责查询、发送、编码和重放交易。',
  'CI 中跑 fmt、build、test、snapshot 和 Slither；部署私钥不进 CI，主网操作走多签。'
])}
${quiz([
  { q: '想测试“第二天提款额度会重置”，应该用哪个作弊码？', o: ['vm.deal', 'vm.prank', 'vm.expectRevert', 'vm.warp'], a: 3, why: 'vm.warp 修改 block.timestamp。deal 改余额，prank 改调用者，expectRevert 断言回滚。' },
  { q: '下面哪类测试最适合发现“单个函数都正确、但特定调用顺序会让合约资不抵债”的问题？', o: ['不变量测试', '单元测试', '格式检查', 'Gas 快照'], a: 0, why: '不变量测试随机组合调用序列，并在每轮后检查全局性质（如偿付能力）。' },
  { q: '部署到主网时，私钥最佳做法是？', o: ['写在 foundry.toml 中', '用 --private-key 参数传入', '使用加密 keystore 或硬件钱包，管理权限交给多签', '放进 CI 的环境变量自动部署'], a: 2, why: '明文私钥容易泄露。keystore 加密存储；硬件钱包私钥不出设备；管理权限交给多签降低单点风险。' },
  { q: '<code>cast sig "transfer(address,uint256)"</code> 输出什么？', o: ['事件的 topic0', '函数选择器 0xa9059cbb', '合约地址', '交易哈希'], a: 1, why: 'cast sig 计算函数签名 Keccak-256 的前 4 字节，即函数选择器。事件 topic0 用 cast keccak 计算完整 32 字节哈希。' }
])}
${exercises([["设计题：为 Vault 写一个模糊测试，验证“任意金额存款后，balanceOf 等于存入金额”。存款范围限定在 1 wei 到 10 ETH。写出测试函数的关键语句。", "<p>函数带一个参数，forge 会自动生成随机输入：<code>function testFuzz_DepositRecorded(uint256 dep) public</code>。</p><p>先用 <code>dep = bound(dep, 1, 10 ether);</code> 限定输入。再 <code>vm.deal(bob, dep);</code> 给 bob 余额，<code>vm.prank(bob);</code> 后调用 <code>vault.deposit{value: dep}();</code>。最后 <code>assertEq(vault.balanceOf(bob), dep);</code>。</p><p>用 bound 而不是 vm.assume，可以避免大量输入被丢弃。</p>"], ["思考题：不变量测试的 Handler 里，withdraw 把 amt 限定在“余额和 5 ETH 中较小的那个”。为什么要这样限定？", "<p>Vault 的日限额是 5 ETH，提款也不能超过余额。超出范围的调用一定 revert。</p><p>在 <code>fail_on_revert = false</code> 时，这些 revert 会被忽略，但它们浪费了每轮的调用深度，状态几乎不变。把输入限定在有效范围内，随机调用才能真正改变状态，不变量检查才有意义。</p>"], ["动手题：测试网上一笔对 Vault 的 withdraw 交易失败了。用 cast 排查，列出你的步骤。", "<p>第一步：<code>cast receipt 交易哈希 --rpc-url $RPC</code>，确认状态和 gasUsed。</p><p>第二步：<code>cast run 交易哈希 --rpc-url $RPC</code>，在本地重放并打印调用栈，找到回滚的位置和错误。</p><p>第三步：用 <code>cast call</code> 读取 <code>balanceOf</code> 和 <code>withdrawnToday</code>，核对是余额不足还是超过日限额。</p>"]])}
${checklist(["能用 forge init、forge install 和 forge test -vvv 跑通一个 Foundry 项目。", "能用 vm.prank、vm.deal、vm.warp 和 vm.expectRevert 写出覆盖正常与异常路径的单元测试。", "能写出带 Handler 和幽灵变量的不变量测试，并用 targetContract 限定随机调用的目标。", "能用 cast wallet keystore 和 forge script --broadcast --verify 部署并验证合约。", "能写出运行 fmt、build、test、snapshot 和 Slither 的 CI 工作流。"])}
${terms([
  ['Foundry', 'Foundry', 'Rust 编写的以太坊合约开发工具集：forge、cast、anvil、chisel'],
  ['作弊码', 'Cheatcode', 'Foundry 测试中修改链环境的特殊函数，如 vm.prank、vm.warp'],
  ['模糊测试', 'Fuzz Testing', '自动生成大量随机输入来寻找失败用例的测试方法'],
  ['不变量测试', 'Invariant Testing', '随机调用序列后检查全局性质始终成立的测试方法'],
  ['分叉测试', 'Fork Testing', '在本地复制某个区块的链上状态进行测试'],
  ['合约验证', 'Contract Verification', '把源码和编译参数提交给区块浏览器，证明与链上字节码一致'],
  ['静态分析', 'Static Analysis', '不运行代码、通过分析源码发现潜在问题的方法'],
  ['持续集成', 'CI, Continuous Integration', '每次提交自动运行构建、测试和检查的流程']
])}
` });
})();
