/* ---------- M02 子文章（m02b-1）：合约安全 I / II ---------- */
(() => {
CUR = 'm02-7';
addCh({ id: 'm02-7', nav: '合约安全 I', title: 'M02.8 合约安全 I：重入、权限、精度、外部调用与拒绝服务', desc: '六类最常见漏洞：每类给漏洞代码、攻击步骤和修复代码', html: `
<h1>M02.8 合约安全 I：重入、权限、精度、外部调用与拒绝服务</h1>
${meta(['按 SWC / OWASP 清单给漏洞分类，并说出每类的根因。', '说清重入的根因，并用 CEI 和 ReentrancyGuard 两种方式修复。', '审查一段合约时，能找出权限、精度、返回值、无界循环四类问题。'], '<a href="#m02-3">M02.3 Solidity 基础 II</a>、<a href="#m02-5">M02.5 ERC-20 与授权</a>', ['reentrancy'])}
${beginner(`<p><strong>外部调用（External Call）</strong>：合约 A 调用合约 B 的函数，或给 B 转 ETH。调用期间，控制权交给 B，B 的代码想做什么都可以。</p>
<p><strong>receive / fallback 函数</strong>：合约收到 ETH 时自动执行的函数。攻击者把恶意逻辑写在这里。</p>
<p><strong>回滚（Revert）</strong>：交易执行失败，本次所有状态修改都撤销，像“这笔交易从没发生过”。</p>
<p><strong>修饰器（Modifier）</strong>：写在函数声明上的检查，例如 <code>onlyOwner</code>，在函数体之前运行。</p>
<p><strong>EOA</strong>（Externally Owned Account，外部账户）：由私钥控制的普通钱包地址。合约账户没有私钥，由代码控制。</p>`)}

<h2>1. 一句话理解</h2>
${one('合约漏洞 = 代码允许了作者没想到的执行顺序或调用者。攻击者不“破解”什么，他只是按规则调用你的函数。')}
${call('analogy', `<p>合约像一台无人值守的 ATM，所有人都能看到它的电路图（源码公开），而且可以在一秒内对它按一万次按钮。只要电路图里有一处“先吐钱、后扣余额”，就会有人把它搬空。</p>
<p>比喻的局限：ATM 被搬空可以报警、追回；链上资金被转走后，通常无法回滚，也找不到可以起诉的“银行”。</p>`)}
${art('一图看懂：先转账后记账，攻击者就能在回调里重复取钱', 660, 370, [
  S.zone(10, 30, 310, 300, { t: '漏洞版：先转账，后记账', k: 'risk' }),
  S.zone(340, 30, 310, 300, { t: '修复版（CEI）：先记账，后转账', k: 'ok' }),
  S.box(36, 58, 258, 50, { k: 'tint', t: '① 检查通过', s: '读到 balances = 1 ETH' }),
  S.box(36, 132, 258, 50, { k: 'risk', t: '② 转出 1 ETH', s: '控制权交给攻击者 receive()' }),
  S.box(36, 206, 258, 50, { k: 'risk', t: '③ 回调再取', s: '余额还没清零，回到 ① 再来' }),
  S.box(36, 280, 258, 40, { k: 'risk', t: '投入 1 ETH，取走 11 ETH', mono: 1 }),
  S.box(366, 58, 258, 50, { k: 'tint', t: '① 检查通过', s: '读到 balances = 1 ETH' }),
  S.box(366, 132, 258, 50, { k: 'key', t: '② 先清零', s: 'balances = 0（Effects）' }),
  S.box(366, 206, 258, 50, { k: 'ok', t: '③ 再转账', s: '回调再取：余额 0，revert' }),
  S.box(366, 280, 258, 40, { k: 'ok', t: '攻击失败，资金安全' }),
  S.arrow(165, 110, 165, 130, { k: 'risk' }),
  S.arrow(165, 184, 165, 204, { k: 'risk' }),
  S.arrow(165, 258, 165, 278, { k: 'risk' }),
  S.arrow(495, 110, 495, 130, { k: 'ok' }),
  S.arrow(495, 184, 495, 204, { k: 'ok' }),
  S.arrow(495, 258, 495, 278, { k: 'ok' }),
  S.text(330, 356, '示例：金库原有他人 10 ETH，攻击者存入 1 ETH；两版代码只差第 ② 步的位置', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['key', '漏洞只差一行的位置：先把余额清零，再把控制权交出去。'],
  ['flow', '左边每次回调都看到旧余额 1，所以能循环取款，直到金库被取空。'],
  ['risk', '外部调用会把控制权交给对方，对方的代码想做什么都可以。'],
  ['limit', '这张图只讲重入；访问控制、精度、返回值、拒绝服务见下面各节。']
], '左边先转账后记账，攻击者在回调里重复取款，投入 1 ETH 取走 11 ETH；右边先清零再转账，回调时余额为 0，攻击失败', 'm02-7')}

<h2>2. 漏洞分类总览：先建立地图</h2>
<p><strong>SWC</strong>（Smart Contract Weakness Classification，智能合约弱点分类）是早期社区维护的漏洞编号表，例如 SWC-107 是重入。它从 2020 年起基本停止更新，但编号仍被审计报告和工具（Slither、Mythril）引用。${cite('SWC Registry（页面注明 2020 年后未再系统更新）', 'https://swcregistry.io/')}<strong>OWASP Smart Contract Top 10</strong> 是更新的常见风险清单，按真实损失统计排序。两者覆盖的类别大体一致。</p>
${tbl(['类别', 'SWC 编号（示例）', '根因一句话', '本手册位置'], [
  ['重入', 'SWC-107', '外部调用发生在状态更新之前', '本篇第 3 节'],
  ['访问控制', 'SWC-105 / 106 / 115', '敏感函数没限制调用者，或用错身份判断', '本篇第 4 节'],
  ['整数与精度', 'SWC-101', '溢出、截断、单位不一致', '本篇第 5 节'],
  ['未检查返回值', 'SWC-104', '低级调用失败了，代码却当作成功', '本篇第 6 节'],
  ['拒绝服务', 'SWC-113 / 128', '一个失败或一个超长循环卡住全体', '本篇第 6 节'],
  ['交易顺序依赖 / MEV', 'SWC-114', '结果取决于谁先上链', '<a href="#m02-8">M02.9</a>'],
  ['签名重放', 'SWC-117 / 121', '同一签名被用两次或在别的链上使用', '<a href="#m02-8">M02.9</a>'],
  ['预言机操纵', '无（较新类别）', '价格来源能在一笔交易内被推动', '<a href="#m02-8">M02.9</a>'],
  ['代理与升级', 'SWC-112（delegatecall）', '存储冲突、未初始化实现合约', '<a href="#m02-8">M02.9</a>']
])}
${mm('攻击面地图：攻击者能从哪里进入你的合约', `
flowchart LR
  ATK["攻击者"] -->|"调用公开函数"| F["你的合约<br/>external / public 函数"]
  ATK -->|"在回调中再次进入"| CB["receive / fallback<br/>ERC777 / ERC721 钩子"]
  F -->|"外部调用交出控制权"| CB
  CB -->|"重入"| F
  F -->|"读取价格"| OR["预言机 / DEX 池子"]
  ATK -->|"闪电贷推动价格"| OR
  F -->|"转代币"| TK["非标准 ERC-20<br/>无返回值 / 收手续费"]
  ADM["管理员私钥"] -->|"升级 / 改参数 / 铸币"| F
  ATK -.->|"钓鱼 / 盗私钥"| ADM
`, [
  ['flow', '攻击者只有三条路：直接调用函数、在你交出控制权时回调、影响你读取的外部数据。'],
  ['risk', '管理员私钥是单点：它被盗，等于所有函数都“没有权限检查”。'],
  ['key', '审计时，先列出每一个 external 调用点和每一个外部数据源，再逐个问：如果对方是恶意的，会发生什么？'],
  ['limit', '这张图只覆盖合约本身。前端被篡改、DNS 劫持、用户被钓鱼签名也会丢钱，见 <a href="#m07">M03</a>。']
])}

<h2>3. 重入：最经典的漏洞</h2>
<p><strong>重入（Reentrancy）</strong>：合约在完成状态更新之前调用外部地址，外部地址在回调里再次调用这个合约，看到的是“旧状态”。2016 年 6 月 The DAO 因此被转走约 360 万 ETH，直接导致以太坊在同年 7 月硬分叉出 ETH 和 ETC。${cite('ethereum.org：以太坊分叉历史（DAO 分叉）', 'https://ethereum.org/en/ethereum-forks/')}</p>
<h3>3.1 单函数重入：漏洞代码 → 攻击步骤 → 修复</h3>
${code('SOLIDITY', `
// ❌ 有漏洞的金库：先转账，后记账
contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "no balance");
        (bool ok, ) = msg.sender.call{value: amount}(""); // ① 交出控制权
        require(ok, "send failed");
        balances[msg.sender] = 0;                         // ② 太晚了
    }
}

// 攻击合约
contract Attacker {
    VulnerableVault public immutable vault;
    constructor(VulnerableVault v) { vault = v; }

    function attack() external payable {
        vault.deposit{value: 1 ether}();
        vault.withdraw();
    }

    // 每收到一次 ETH，就再取一次，直到金库不足 1 ETH
    receive() external payable {
        if (address(vault).balance >= 1 ether) vault.withdraw();
    }
}
`)}
${steps([
  '金库里有其他用户的 10 ETH。攻击者调用 <code>attack()</code>，存入 1 ETH，金库共 11 ETH。',
  '攻击合约调用 <code>withdraw()</code>。金库读到 <code>balances[攻击者] = 1</code>，检查通过。',
  '金库用 <code>call</code> 转出 1 ETH。攻击合约的 <code>receive()</code> 被触发。',
  '<code>receive()</code> 再次调用 <code>withdraw()</code>。此时第 ② 行还没执行，余额仍是 1，检查再次通过。',
  '循环 11 次，金库余额降到 0。调用栈逐层返回，每层都执行 <code>balances = 0</code>，交易成功。',
  '结果：攻击者投入 1 ETH，拿走 11 ETH。其他用户损失 10 ETH。'
])}
${code('SOLIDITY', `
// ✅ 修复 A：CEI 顺序（Checks → Effects → Interactions）
function withdraw() external {
    uint256 amount = balances[msg.sender];          // Checks：检查
    require(amount > 0, "no balance");
    balances[msg.sender] = 0;                       // Effects：先改状态
    (bool ok, ) = msg.sender.call{value: amount}(""); // Interactions：最后交互
    require(ok, "send failed");
}

// ✅ 修复 B：重入锁（OpenZeppelin v5 路径）
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SafeVault is ReentrancyGuard {
    mapping(address => uint256) public balances;
    function withdraw() external nonReentrant {     // 第二次进入直接 revert
        uint256 amount = balances[msg.sender];
        require(amount > 0, "no balance");
        balances[msg.sender] = 0;                   // 生产代码两者一起用
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send failed");
    }
}
`)}

${call('info', `<p>如果把第 ② 行写成 <code>balances[msg.sender] -= amount</code>，在 Solidity 0.8 中，调用栈返回时第二层会下溢并 revert，整笔攻击失败。这是“碰巧安全”，不要依赖它：跨函数重入和只读重入照样成立。</p>`)}

<h3>3.2 跨函数重入与只读重入</h3>
${mm('三种重入的区别', `
flowchart TB
  subgraph S1["单函数重入"]
    A1["withdraw 转账中"] -->|"回调"| A2["再次进入 withdraw"]
  end
  subgraph S2["跨函数重入"]
    B1["withdraw 转账中<br/>余额尚未清零"] -->|"回调"| B2["进入 transfer<br/>把旧余额转给同伙"]
  end
  subgraph S3["只读重入"]
    C1["池子 A 移除流动性中<br/>储备已变、份额未更新"] -->|"回调"| C2["协议 B 调用 A 的 view 函数<br/>读到错误价格"]
    C2 --> C3["B 按错误价格放贷或清算"]
  end
`, [
  ['flow', '三者共同点：外部调用发生时，合约状态处于“一半新、一半旧”的中间态。'],
  ['fail', '跨函数重入：只给 withdraw 加锁、不给 transfer 加锁，锁就失效。OpenZeppelin 的锁是合约级的，所有带 nonReentrant 的函数共用一把锁。'],
  ['risk', '只读重入：受害者是“读价格的协议 B”，而 A 本身没有损失。2022–2023 年多起事件读取 Curve 池的 get_virtual_price 被利用，损失在数十万到数百万美元量级，例如 2023 年 2 月 dForce 损失约 360 万美元。' + cite('ChainSecurity：Curve LP 预言机操纵（只读重入）复盘', 'https://chainsecurity.com/curve-lp-oracle-manipulation-post-mortem') + cite('The Block：dForce 因重入攻击损失 360 万美元', 'https://www.theblock.co/post/210518/dforce-protocol-drained-of-3-6-million-in-reentrancy-attack')],
  ['key', '修复只读重入：B 在读价格前检查 A 是否处于锁定状态；或 A 让 view 函数在锁定时 revert。']
])}
${code('SOLIDITY', `
// ❌ 跨函数重入：withdraw 有锁，transfer 没锁
function transfer(address to, uint256 amt) external {
    require(balances[msg.sender] >= amt);
    balances[msg.sender] -= amt;
    balances[to] += amt;
}
// 攻击：在 withdraw 的回调里调用 transfer(同伙, 1 ether)。
// withdraw 结束时把攻击者余额清零，但同伙已经拿到 1 ether 记账余额。
// ✅ 修复：所有读写 balances 的外部函数都加 nonReentrant，并且全部遵守 CEI。
`)}
${call('warn', `<p>以下操作都会交出控制权：<code>call{value:}</code>、调用任何外部合约、ERC-777 的 <code>tokensReceived</code> 钩子、ERC-721 / ERC-1155 的 <code>safeTransfer</code> 回调（<code>onERC721Received</code>）。“我只是转了个 NFT”也可能被重入。</p>`)}

<h3>3.x 亲手验证：重入调用栈</h3>
<p>先选“有漏洞”版本自动执行，数一数攻击者重入了几层。再切换到两种修复版本，观察第二次进入时在哪一行被拦下。</p>
${lab('reentrancy')}

<h2>4. 访问控制失误：谁都能按的按钮</h2>
<h3>4.1 未保护的初始化函数</h3>
<p>可升级合约不能用构造函数，改用 <code>initialize()</code>。如果任何人都能调用它，第一个调用者就成为 owner。2017 年 7 月，Parity 多签钱包的初始化函数可被重复调用，约 15.3 万 ETH 被盗；${cite('OpenZeppelin：On the Parity Wallet Multisig Hack', 'https://www.openzeppelin.com/news/on-the-parity-wallet-multisig-hack-405a8c12e8f7')}同年 11 月，有人对 Parity 的库合约调用初始化并执行自毁，各方估计超过 50 万 ETH 被永久冻结。${cite('OpenZeppelin：Parity Wallet Hack Reloaded', 'https://www.openzeppelin.com/news/parity-wallet-hack-reloaded')}</p>
${code('SOLIDITY', `
// ❌ 任何人都能调用，并且能调用多次
function initialize(address _owner) external {
    owner = _owner;
}

// ✅ 使用 OpenZeppelin Initializable
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
contract Vault is Initializable {
    address public owner;
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }        // 锁死实现合约本身
    function initialize(address _owner) external initializer { // 只能执行一次
        owner = _owner;
    }
}
// 部署脚本必须在同一笔交易里“部署代理 + 调用 initialize”，不给抢跑留窗口。
`)}
<h3>4.2 用 tx.origin 做身份判断</h3>
<p><code>tx.origin</code> 是发起整笔交易的 EOA；<code>msg.sender</code> 是直接调用当前函数的地址。用 <code>tx.origin</code> 判断权限，会被钓鱼合约利用。</p>
${steps([
  '受害者钱包合约写了 <code>require(tx.origin == owner)</code>。',
  '攻击者部署一个“领空投”合约，诱导 owner 调用它。',
  '“领空投”合约在内部调用 <code>wallet.withdrawAll(攻击者)</code>。',
  '这次调用的 <code>tx.origin</code> 仍是 owner，检查通过，资金转给攻击者。',
  '修复：一律用 <code>msg.sender</code> 判断权限。<code>tx.origin</code> 只在极少数场景（例如禁止合约调用）使用，并且要知道账户抽象钱包会让这种判断失效。'
])}
<h3>4.3 权限过大与缺失修饰器</h3>
<p>常见形态：① 设置价格、铸币、提走资金的函数忘了写 <code>onlyOwner</code>；② 一个 EOA 同时拥有升级、铸币、暂停、提款全部权限；③ 管理员可以无上限修改手续费或把用户资金转走。2022 年 3 月，Ronin 跨链桥的 9 个验证者密钥中有 5 个被攻破（4 个属于 Sky Mavis，另 1 个是 Axie DAO 授权 Sky Mavis 代签的节点），被盗 173,600 ETH 和 2,550 万 USDC，按当时价格约 6 亿多美元，根因就是权限集中。${cite('The Block：Ronin 被盗约 6 亿美元', 'https://www.theblock.co/post/139761/axie-infinitys-ethereum-sidechain-ronin-hit-by-600-million-exploit')}</p>
${code('SOLIDITY', `
// ✅ 按职责拆分角色，并给参数加上限
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
contract FeeVault is AccessControl {
    bytes32 public constant FEE_MANAGER = keccak256("FEE_MANAGER");
    uint256 public constant MAX_FEE_BPS = 500;      // 硬上限 5%，管理员也改不了
    uint256 public feeBps;

    constructor(address timelock) {
        _grantRole(DEFAULT_ADMIN_ROLE, timelock);   // 超级权限交给时间锁 + 多签
    }
    function setFee(uint256 bps) external onlyRole(FEE_MANAGER) {
        require(bps <= MAX_FEE_BPS, "fee too high");
        feeBps = bps;
    }
}
`)}

<h2>5. 整数与精度：数字也会骗人</h2>
<h3>5.1 溢出（Solidity 0.8 之前）</h3>
<p>Solidity 0.8 之前，<code>uint256</code> 加乘溢出会“绕回”到 0 附近，不报错。2018 年 4 月 BeautyChain（BEC）代币的 <code>batchTransfer</code> 计算 <code>amount = 人数 × 每人金额</code>，攻击者让每人金额为 2<sup>255</sup>、人数为 2，乘积溢出为 0，通过余额检查，凭空铸出天量代币。${cite('PeckShield：batchOverflow（CVE-2018-10299）', 'https://peckshield.medium.com/alert-new-batchoverflow-bug-in-multiple-erc20-smart-contracts-cve-2018-10299-511067db6536')}0.8 起算术默认检查溢出并 revert，但有三个例外仍要当心：</p>
${steps([
  '<code>unchecked { }</code> 块里的算术不检查溢出。只在你能证明不会溢出时使用（例如循环计数器）。',
  '类型强转不检查：<code>uint8(300)</code> 结果是 44。用 OpenZeppelin <code>SafeCast.toUint8()</code>。',
  '内联汇编（assembly）里的算术不检查。'
])}
<h3>5.2 除法截断与先乘后除</h3>
<p>EVM 没有小数，整数除法直接丢掉余数。顺序写错，结果可能变成 0。</p>
<p><strong>算一算（示例）：</strong>协议收 0.3% 手续费，写成 <code>fee = amount * 30 / 10000</code>。</p>
${steps([
  '用户兑换 <code>amount = 333</code>（最小单位）。<code>333 × 30 = 9,990</code>，<code>9,990 / 10,000 = 0</code>。手续费为 0。',
  '攻击者把一笔大交易拆成很多笔 333 的小交易，全程免手续费（在 Gas 便宜的 L2 上这真的划算）。',
  '另一种错误：奖励写成 <code>(userStake / totalStake) * pool</code>。设 <code>userStake = 5×10<sup>17</sup></code>，<code>totalStake = 10<sup>18</sup></code>，先除得 0，再乘还是 0。用户应得一半奖励，实际得 0。',
  '正确写法：<code>userStake * pool / totalStake</code>，先乘后除。乘法可能溢出时用 <code>Math.mulDiv(a, b, c)</code>（512 位中间结果）。'
])}
<h3>5.3 精度单位不一致与舍入方向</h3>
<p>USDC 和 USDT 在以太坊上是 6 位小数，DAI 和 WETH 是 18 位，Chainlink 的 USD 价格源通常是 8 位。把 1,000 USDC（<code>1000×10<sup>6</sup></code>）当作 18 位小数计算，它的价值会被低估 10<sup>12</sup> 倍。</p>
${code('SOLIDITY', `
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// 把任意代币数量统一换算成 18 位小数的 USD 价值
function usdValue(address token, uint256 amount, uint256 price, uint8 priceDecimals)
    internal view returns (uint256)
{
    uint8 d = IERC20Metadata(token).decimals();           // USDC = 6，WETH = 18
    // value = amount × price × 10^18 / (10^d × 10^priceDecimals)
    return Math.mulDiv(amount * price, 1e18, 10 ** (uint256(d) + priceDecimals));
}

// 舍入方向：永远对协议有利。
// 用户存入时算份额 → 向下取整；用户取出时算要扣的份额 → 向上取整。
uint256 sharesOut = Math.mulDiv(assets, totalShares, totalAssets, Math.Rounding.Floor);
uint256 sharesIn  = Math.mulDiv(assets, totalShares, totalAssets, Math.Rounding.Ceil);
`)}
${call('deep', `<p>ERC-4626 金库的“首位存款人通胀攻击”就是精度问题：攻击者先存 1 wei 拿到 1 份额，再直接转入大量资产“捐赠”给金库，让每份额极贵；下一位存款人的份额被向下取整成 0。OpenZeppelin v5 的 ERC4626 用“虚拟份额与虚拟资产偏移（decimals offset）”缓解这个问题；在自己的金库里复现并防御它，见 <a href="#m12-2">M12.2 设计：收益金库</a> 第 5 节。</p>`)}

<h2>6. 不安全的外部调用与拒绝服务</h2>
<h3>6.1 不检查返回值</h3>
${tbl(['写法', '失败时的行为', '风险'], [
  ['<code>addr.send(x)</code>', '返回 false，不 revert', '代码继续执行，状态已改，钱没到'],
  ['<code>addr.transfer(x)</code>', 'revert；只转发 2300 Gas', '收款方是多签或智能钱包时会失败'],
  ['<code>addr.call{value:x}("")</code>', '返回 (false, data)', '必须手动检查 ok；转发全部 Gas，要防重入'],
  ['<code>token.transfer(to, x)</code>', '有的代币返回 false；USDT 不返回任何值', '忽略返回值 = 静默失败；按 bool 解码 USDT 会直接 revert'],
  ['<code>SafeERC20.safeTransfer</code>', '统一 revert', '推荐：兼容无返回值代币，并检查目标有代码']
])}
${code('SOLIDITY', `
// ❌ 忽略返回值：转账失败也会把订单标记为已支付
token.transfer(seller, price);
order.paid = true;

// ✅ 使用 SafeERC20
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;

order.paid = true;                          // Effects
IERC20(token).safeTransfer(seller, price);  // Interactions：失败则整笔回滚
`)}
<p>另外两种危险的外部调用：① <strong>任意调用</strong>：合约执行 <code>target.call(data)</code>，而 target 和 data 由用户传入。攻击者让 target = 某代币、data = <code>transferFrom(受害者, 攻击者, 余额)</code>，就能花掉用户授权给这个合约的额度。② <strong>delegatecall 到不可信地址</strong>：被调用代码在你的存储上下文里执行，可以改写 owner 甚至自毁。修复：目标地址用白名单，禁止用户控制 delegatecall 目标。</p>
<h3>6.2 拒绝服务（DoS）</h3>
${mm('push 支付 vs pull 支付', `
flowchart LR
  subgraph P1["push：合约主动给每个人打款"]
    L1["for 循环遍历 N 个用户"] --> T1["逐个转账"]
    T1 -->|"某个收款合约 revert"| X1["整笔交易失败<br/>所有人都收不到"]
    L1 -->|"N 太大"| X2["超过区块 Gas 上限<br/>永远无法执行"]
  end
  subgraph P2["pull：记账后让用户自己领"]
    L2["只更新 owed 映射"] --> U2["用户调用 claim"]
    U2 --> OK2["一个人失败只影响他自己"]
  end
`, [
  ['flow', 'push 模式下，合约在一笔交易里完成所有转账；pull 模式下，合约只记账，转账由每个用户分别发起。'],
  ['fail', '无界循环：数组随用户增长，终有一天单笔交易的 Gas 超过区块上限，函数永久卡死，资金被锁。'],
  ['risk', '恶意收款方：攻击者用一个 receive() 里永远 revert 的合约参与，让依赖 push 退款的合约无法继续（经典的“King of the Ether”类问题）。'],
  ['key', '规则：不要在一个交易里给未知数量的地址转账。改用 pull，或分页处理（每次处理固定条数并记录游标）。']
])}
${code('SOLIDITY', `
// ❌ 拍卖：出价更高时退款给上一位，上一位是恶意合约就永远卡住
function bid() external payable {
    require(msg.value > highestBid);
    payable(highestBidder).transfer(highestBid); // 对方 revert → 无人能再出价
    highestBidder = msg.sender;
    highestBid = msg.value;
}

// ✅ pull 模式：只记账，让对方自己取
mapping(address => uint256) public pendingReturns;
function bid() external payable {
    require(msg.value > highestBid);
    pendingReturns[highestBidder] += highestBid;
    highestBidder = msg.sender;
    highestBid = msg.value;
}
function withdrawRefund() external nonReentrant {
    uint256 amt = pendingReturns[msg.sender];
    pendingReturns[msg.sender] = 0;             // CEI
    (bool ok, ) = msg.sender.call{value: amt}("");
    require(ok);
}
`)}
${call('warn', `<p>不要写 <code>require(address(this).balance == totalDeposits)</code> 这种严格相等。任何人都能通过 <code>selfdestruct</code> 或作为区块受益人强行给合约塞 ETH，让等式永远不成立，函数永久失效。用内部记账变量，不要依赖实际余额。</p>`)}
${tryit(`<p>在 Remix（remix.ethereum.org）复现重入：</p>
<ol><li>新建文件，粘贴第 3.1 节的 <code>VulnerableVault</code> 和 <code>Attacker</code>，编译器选 0.8.x。</li>
<li>环境选 “Remix VM”。用账户 1 部署金库，用账户 2、3 各调用 <code>deposit</code> 存入 5 ETH（在 VALUE 栏填 5 Ether）。</li>
<li>用账户 4 部署 <code>Attacker</code>，构造参数填金库地址。VALUE 填 1 Ether，调用 <code>attack()</code>。</li>
<li>预期结果：金库余额（用 <code>balances</code> 或在 Remix 左侧看合约余额）变为 0，Attacker 合约余额为 11 ETH。</li>
<li>把 <code>withdraw</code> 改成 CEI 顺序，重复步骤，预期 <code>attack()</code> 后金库仍有 10 ETH。</li></ol>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['所有外部调用都在状态更新之后（CEI）', '防止所有形态的重入', '人工逐个标注 external 调用点；Slither 检测器 reentrancy-*'],
  ['涉及资金的外部函数加 nonReentrant', 'CEI 写漏时的第二道防线', 'grep 所有 external 函数，确认修饰器'],
  ['初始化函数有 initializer，实现合约构造函数调用 _disableInitializers', '防止抢先初始化和实现合约被接管', 'Foundry 测试：第二次调用 initialize 必须 revert'],
  ['权限判断只用 msg.sender，角色最小化', '防钓鱼和单点失控', '列出权限矩阵（角色 × 函数），审查每一项'],
  ['代币转账全部用 SafeERC20', '兼容 USDT 类无返回值代币', '用 USDT 主网分叉做集成测试'],
  ['先乘后除，舍入方向对协议有利', '防止截断为 0 和精度套利', '模糊测试极小值（1 wei）和极大值'],
  ['没有遍历无界数组的转账循环', '防止 Gas 上限导致的永久 DoS', '压测 N = 10,000 时的 Gas 消耗']
])}
${mistakes([
  ['Solidity 0.8 以后就不会有整数问题了。', '0.8 只检查加减乘溢出。unchecked 块、类型强转、除法截断、精度单位错误仍然存在。'],
  ['用了 ReentrancyGuard 就不用管调用顺序。', '锁只保护本合约带修饰器的函数。只读重入攻击的是读取你状态的其他协议。CEI 和锁要一起用。'],
  ['transfer() 只给 2300 Gas，所以最安全。', '2300 Gas 让多签和智能合约钱包无法收款，而且 Gas 价格调整可能让它失效。推荐 call + 检查返回值 + 防重入。'],
  ['代码经过审计，就没有漏洞了。', '审计是抽样检查，覆盖审计时的代码和审计员想到的场景。上线后的升级、新集成、参数变化都会引入新风险。']
])}
${recap([
  '漏洞的本质：代码允许了作者没想到的调用顺序或调用者。先画攻击面，再逐点审查。',
  '重入有三种：单函数、跨函数、只读。防护 = CEI 顺序 + nonReentrant 锁 + 检查被读协议的锁状态。',
  '访问控制：初始化用 initializer 并锁死实现合约；只用 msg.sender；角色拆分 + 参数硬上限 + 多签和时间锁。',
  '精度：先乘后除，用 mulDiv，统一小数位，舍入方向对协议有利；SafeCast 防强转截断。',
  '外部调用用 SafeERC20 并检查返回值；资金分发用 pull 模式，避免无界循环。'
])}
${quiz([
  { q: '下列哪段 withdraw 逻辑能抵御单函数重入（不使用锁）？', o: ['转账 → 检查余额 → 余额清零', '检查余额 → 转账 → 余额清零', '检查余额 → 余额清零 → 转账', '余额清零 → 转账 → 检查余额'], a: 2, why: 'CEI：先检查，再改状态，最后外部交互。B 是经典漏洞写法；A 和 D 的检查位置错误，D 清零后再检查必然失败。' },
  { q: '钱包合约用 <code>require(tx.origin == owner)</code> 判断权限。攻击者最可能怎么做？', o: ['暴力破解 owner 私钥', '诱导 owner 调用一个恶意合约，由它转调钱包', '发送一笔 Gas 很高的交易抢先执行', '修改区块时间戳'], a: 1, why: 'tx.origin 在整条调用链里都是 owner，恶意合约转调时检查依然通过。其他选项与 tx.origin 无关。' },
  { q: '<code>reward = userStake / totalStake * pool</code>，userStake = 5e17，totalStake = 1e18，pool = 1000e18。结果是多少？', o: ['500e18', '0', '1000e18', '交易 revert'], a: 1, why: '5e17 / 1e18 整数除法等于 0，再乘 pool 仍是 0。应先乘后除得到 500e18。0.8 不会因为截断 revert。' },
  { q: '一个合约在 for 循环里给所有持币人转账。下面哪一项不是它的风险？', o: ['持币人增多后超过区块 Gas 上限', '某个收款合约 revert 导致全体失败', '转账被只读重入改变价格', '循环成本随人数线性增长'], a: 2, why: '只读重入指外部协议在中间态读取 view 函数，与这个循环的 DoS 问题无关。A、B、D 都是 push 支付的典型风险。' },
  { q: '为什么推荐 SafeERC20 而不是直接调用 <code>token.transfer</code>？', o: ['SafeERC20 转账更省 Gas', 'SafeERC20 能处理不返回 bool 的代币，并在返回 false 时 revert', 'SafeERC20 能防止所有重入', 'SafeERC20 会自动做 CEI 排序'], a: 1, why: 'USDT 等代币的 transfer 没有返回值，有的代币失败时返回 false。SafeERC20 统一处理。它不省 Gas，也不负责重入防护和调用顺序。' }
])}
${exercises([["计算题：VulnerableVault 里有其他用户的 6 ETH（示例）。攻击合约存入 2 ETH，receive() 的条件改为“金库余额 ≥ 2 ETH 时再取一次”。攻击合约一共取几次？最终拿走多少？净赚多少？", "<p>存入后金库共 8 ETH。每次取 2 ETH：8 → 6 → 4 → 2 → 0。</p><p>前三次转账后余额都 ≥ 2 ETH，receive() 继续重入；第四次后余额为 0，停止。共取 4 次，拿走 8 ETH，扣除投入的 2 ETH，净赚 6 ETH。其他用户的 6 ETH 全部损失。</p>"], ["计算题：手续费写成 <code>fee = amount * 30 / 10000</code>。amount 最小为多少时，手续费才至少为 1 个最小单位？怎样改写让小额交易也付费？", "<p>需要 amount × 30 ≥ 10,000。333 × 30 = 9,990，结果为 0；334 × 30 = 10,020，结果为 1。所以 amount 至少为 334。</p><p>改写：舍入方向要对协议有利。手续费用向上取整，例如 <code>Math.mulDiv(amount, 30, 10000, Math.Rounding.Ceil)</code>。这样拆单也无法免费。</p>"], ["设计题：一个可升级合约使用 Initializable。写出验证它“不能被抢先初始化或重复初始化”的测试要点。", "<p>第一，部署代理并在同一笔交易里调用 <code>initialize</code>，断言 owner 正确。</p><p>第二，再次调用 <code>initialize</code>，用 <code>vm.expectRevert()</code> 断言回滚。</p><p>第三，直接对实现合约调用 <code>initialize</code>，也必须回滚。这证明构造函数里的 <code>_disableInitializers()</code> 生效。</p>"]])}
${checklist(["能指出一段 withdraw 代码里外部调用与状态更新的先后，并改成 CEI 顺序。", "在 Remix 里复现过重入攻击，并验证改成 CEI 后金库余额不再被搬空。", "能用先乘后除和 Math.mulDiv 改写会截断为 0 的奖励或手续费公式。", "能把循环里的 push 退款改成 pendingReturns 记账加 withdrawRefund 的拉取模式。", "能区分单函数、跨函数和只读重入，并说出各自的修复方式。"])}
${terms([
  ['重入', 'Reentrancy', '外部调用期间，被调用方再次进入原合约并利用未更新的状态'],
  ['检查-生效-交互', 'Checks-Effects-Interactions, CEI', '先校验、再改状态、最后外部调用的代码顺序'],
  ['重入锁', 'ReentrancyGuard', '用一个状态变量阻止函数在执行期间被再次进入的修饰器'],
  ['只读重入', 'Read-only Reentrancy', '外部协议在中间态调用 view 函数并读到错误数据'],
  ['SWC', 'Smart Contract Weakness Classification', '智能合约漏洞编号表，例如 SWC-107 为重入'],
  ['初始化函数', 'Initializer', '可升级合约中替代构造函数、只能执行一次的设置函数'],
  ['拉取支付', 'Pull Payment', '合约只记账，由收款人自己发起提款的模式'],
  ['拒绝服务', 'Denial of Service, DoS', '让合约函数永久无法执行的攻击'],
  ['SafeERC20', 'SafeERC20', 'OpenZeppelin 提供的兼容非标准代币的安全转账库']
])}
` });

CUR = 'm02-8';
addCh({ id: 'm02-8', nav: '合约安全 II', title: 'M02.9 合约安全 II：预言机、闪电贷、MEV、签名、升级、治理与审计', desc: '协议级攻击与工程防线：从漏洞到审计、赏金和应急响应', html: `
<h1>M02.9 合约安全 II：预言机、闪电贷、MEV、签名、升级、治理与审计</h1>
${meta(['画出一次闪电贷价格操纵攻击的完整资金流，并给出 TWAP / Chainlink 防护代码。', '用 EIP-712 + nonce + deadline 写出不可重放的签名校验；说清三种代理模式的差别和存储冲突。', '为一个协议制定审计流程、上线安全清单和事件应急预案。'], '<a href="#m02-7">M02.8 合约安全 I</a>、<a href="#m02-10">M06.2 AMM 深入</a>（可并行阅读）')}
${beginner(`<p><strong>预言机（Oracle）</strong>：把链外数据（例如 ETH 的美元价格）写到链上，让合约读取的服务。</p>
<p><strong>闪电贷（Flash Loan）</strong>：在同一笔交易里借出并归还的贷款，不需要抵押；交易结束前没还，整笔交易回滚。</p>
<p><strong>内存池（Mempool）</strong>：交易广播后、上链前停留的“候车室”，所有人都能看到里面的交易。</p>
<p><strong>代理合约（Proxy）</strong>：用户调用的地址固定不变，它把调用转发给可替换的“实现合约”，从而实现升级。</p>
<p><strong>多签（Multisig）</strong>：需要 N 个密钥中的 M 个签名才能执行的钱包，例如 3/5。见 <a href="#m03">M07</a>。</p>`)}

<h2>1. 一句话理解</h2>
${one('M02.8 的漏洞出在“一个函数写错了”；本篇的攻击出在“协议依赖的外部世界被操纵了”：价格、交易顺序、签名、升级权限和投票权。')}
${call('analogy', `<p>一家当铺按“门口小摊的报价”给黄金估价。有人先花大钱把小摊的金价抬高一倍，然后马上来当铺抵押黄金借钱，再把小摊价格放回原位。当铺没有算错，它信错了报价来源。闪电贷让这个“先抬价、再借钱、再还原”的过程在 12 秒内、零本金完成。</p>
<p>比喻的局限：现实中抬价要真金白银；链上闪电贷借来的钱在同一笔交易里归还，攻击者只付手续费和 Gas。</p>`)}
${art('一图看懂：协议信了能被一笔交易推动的价格，就会被借光', 660, 330, [
  S.box(10, 44, 180, 76, { k: 'info', icon: 'bank', t: '借贷协议', s: '按池子即时价\n给抵押品估值' }),
  S.box(240, 44, 180, 76, { k: 'key', icon: 'chart', t: 'DEX 池 ETH/USDC', s: '即时价\n3,000 → 6,000', mono: 1 }),
  S.box(470, 44, 180, 76, { k: 'risk', icon: 'person', t: '攻击者', s: '闪电贷借 124 万 USDC\n同一笔交易还清' }),
  S.box(10, 170, 410, 70, { k: 'ok', icon: 'shield', t: 'Chainlink 聚合价 / 足够长的 TWAP', s: '一笔交易内推不动，价格仍约 3,000' }),
  S.box(470, 170, 180, 70, { k: 'risk', icon: 'warn', t: '多借出的钱 = 坏账', s: '292.9 ETH 被估 175.7 万\n实值约 87.9 万（示例）' }),
  S.arrow(468, 82, 422, 82, { k: 'risk', label: '推价' }),
  S.arrow(238, 82, 192, 82, { label: '读价' }),
  S.arrow(560, 122, 560, 168, { k: 'risk', label: '借走' }),
  S.arrow(100, 168, 100, 122, { k: 'ok', label: '改读安全价' }),
  S.text(330, 288, '攻击者几乎没有本金风险：借钱、推价、借款、还价、还款都在一笔交易里（价格与金额均为示例）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '闪电贷借来大笔稳定币，把池子价格推高；借贷协议读到被推高的价格，给抵押品多估值。'],
  ['key', '协议没有算错，是信错了价格来源：DEX 即时价能在一笔交易内被改变。'],
  ['risk', '损失由协议和其他存款人承担，攻击者只付手续费和 Gas。'],
  ['limit', 'TWAP 要足够长，多区块持续操纵仍可能；Chainlink 要检查新鲜度和正数。']
], '攻击者用闪电贷把 DEX 池价格从 3000 推到 6000，借贷协议按被推高的价格估值导致坏账；改用 Chainlink 或 TWAP 就读不到被推动的价格', 'm02-8')}

<h2>2. 预言机操纵与闪电贷</h2>
<h3>2.1 为什么 DEX 即时价格不能当预言机</h3>
<p>AMM 池子的即时价格（spot price）= 两种代币储备的比值，见 <a href="#m02-10">M06.2</a>。任何人只要在池子里大额交易，就能在同一笔交易中改变这个比值。</p>
<p><strong>算一算（示例）：</strong>池子有 1,000 ETH 和 3,000,000 USDC，即时价格 3,000。攻击者想把价格推到 6,000。</p>
${steps([
  '恒定乘积 k = 1,000 × 3,000,000 = 3×10<sup>9</sup>。目标价格 y/x = 6,000，且 x·y = k。',
  '解得 x = √(k / 6000) = √500,000 ≈ 707.1 ETH，y = 6000 × 707.1 ≈ 4,242,641 USDC。',
  '攻击者需要投入 4,242,641 − 3,000,000 ≈ 1,242,641 USDC，换出 1,000 − 707.1 ≈ 292.9 ETH（不计手续费）。',
  '这 124 万 USDC 用闪电贷借来。假设某借贷协议按池子即时价格给 ETH 估值，攻击者手里 292.9 ETH 被估成 175.7 万美元，而市场价只值约 87.9 万美元。',
  '攻击者抵押这些 ETH 借出远超其真实价值的稳定币，再反向交易把池价复原、归还闪电贷。差额就是协议的坏账。'
])}
${mm('真实事件因果图：2020 年 10 月 Harvest Finance（约 2,400 万至 3,400 万美元）', `
flowchart TB
  FL["① 闪电贷借入数千万美元稳定币"] --> SW1["② 在 Curve 稳定币池大额兑换<br/>池内 USDC/USDT 比例偏离"]
  SW1 --> PR["③ Harvest 金库按 Curve 池状态<br/>计算每份额价值，读到偏低价格"]
  PR --> DEP["④ 以偏低价格存入 USDC<br/>拿到更多金库份额"]
  DEP --> SW2["⑤ 反向兑换，Curve 池恢复"]
  SW2 --> WD["⑥ 份额价值回升，赎回更多 USDC"]
  WD --> RP["⑦ 归还闪电贷 + 手续费"]
  RP --> LOOP{"利润 > 成本？"}
  LOOP -->|"是，重复多轮"| SW1
  LOOP -->|"结束"| OUT["利润换成 renBTC 跨链转走"]
  WD -.->|"差额来自"| VIC["金库其他存款人"]
`, [
  ['flow', '资金流闭环：借 → 推价 → 按错价存 → 复原 → 按正价取 → 还。全部在一笔或几笔交易内完成，攻击者几乎没有本金风险。'],
  ['risk', '根因：金库用“能在一笔交易内被推动的价格”计算份额。损失由其他存款人承担。'],
  ['fail', '协议当时有价格偏离检查，但阈值相对每轮可获利空间仍然太宽，攻击者把每轮偏离控制在阈值以内并多次重复。损失金额各方估算不一：多数报道约 2,400 万美元，The Block 统计约 3,380 万美元，攻击者事后退回约 250 万美元。' + cite('Harvest Finance：Flashloan Economic Attack Post-Mortem', 'https://medium.com/harvest-finance/harvest-flashloan-economic-attack-post-mortem-3cf900d65217') + cite('The Block：Harvest Finance 被盗 3,380 万美元并退回 250 万美元', 'https://www.theblock.co/post/82292/defi-protocol-harvest-finance-exploited')],
  ['key', '防护：份额和抵押估值使用不可在单笔交易内操纵的价格（Chainlink 聚合价、足够长的 TWAP），并对存取款设置同块限制或偏离熔断。']
])}
<h3>2.2 防护：TWAP 与 Chainlink</h3>
<p><strong>TWAP</strong>（Time-Weighted Average Price，时间加权平均价格）：把一段时间内每一秒的价格取平均。Uniswap V2 每个区块的第一次交互会把“价格 × 经过秒数”累加到 <code>price0CumulativeLast</code>；用两个时间点的累加值之差除以时间差，就得到这段时间的平均价格。操纵 30 分钟 TWAP，需要连续 30 分钟把价格维持在偏离位置，成本远高于单笔闪电贷。V3 用 <code>observe()</code> 提供同类累加器（基于 tick）。</p>
${code('SOLIDITY', `
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 安全读取 Chainlink 价格：检查正数、新鲜度、轮次
function getPrice(AggregatorV3Interface feed, uint256 maxDelay) internal view returns (uint256) {
    (uint80 roundId, int256 answer, , uint256 updatedAt, uint80 answeredInRound) = feed.latestRoundData();
    require(answer > 0, "bad price");
    require(updatedAt != 0 && block.timestamp - updatedAt <= maxDelay, "stale price"); // 例如心跳 3600 秒 + 余量
    require(answeredInRound >= roundId, "stale round");
    return uint256(answer); // 注意：USD 价格源通常为 8 位小数，用 feed.decimals() 读取
}
// L2 上还要检查 Sequencer Uptime Feed：排序器宕机刚恢复时，暂停清算一段宽限期。
`)}
${tbl(['价格来源', '单笔交易可操纵', '延迟', '适用'], [
  ['DEX 即时价格', '是', '无', '只能用于展示，不能用于估值'],
  ['DEX TWAP（例如 30 分钟）', '否；但多区块持续操纵可能', '高（价格跟随慢）', '流动性深的池子；长尾资产'],
  ['Chainlink 聚合价', '否', '按心跳与偏离阈值更新', '主流资产的借贷、清算、衍生品'],
  ['多源取中位数 + 偏离熔断', '否', '中', '大型协议的生产方案']
])}
${call('info', `<p>闪电贷本身不是漏洞。它把“需要很多本金才能做的攻击”变成“任何人都能做的攻击”。设计协议时，默认攻击者在一笔交易内拥有无限资金。</p>`)}

<h2>3. 前置交易、三明治与 commit-reveal</h2>
<p><strong>MEV</strong>（Maximal Extractable Value，最大可提取价值）：区块构建者通过插入、排序、剔除交易能获得的额外收益。<strong>前置交易（Front-running）</strong>：看到你在内存池里的交易后，抢在你前面执行。<strong>三明治攻击（Sandwich）</strong>：在你的兑换前买入、在你之后卖出，赚你推高价格的差价。逐步计算和防护方案见 <a href="#m05-7">M04.7 MEV</a>。</p>
${mm('三明治攻击的时序', `
sequenceDiagram
  participant U as 用户
  participant M as 内存池
  participant B as MEV 机器人
  participant P as AMM 池子
  U->>M: 广播 用 30000 USDC 买 ETH，滑点 3%
  B->>M: 发现这笔交易，计算可获利空间
  B->>P: ① 抢先买入 ETH（更高优先费，排在前面）
  U->>P: ② 用户成交，价格已被抬高，接近滑点上限
  B->>P: ③ 立即卖出 ETH，赚取差价
  Note over U,P: 用户多付的钱 ≈ 机器人利润 + 手续费
`, [
  ['flow', '同一个区块内三笔交易按 ①②③ 顺序排列。机器人利润上限由用户设置的滑点决定。'],
  ['key', '用户侧防护：设置较小的 amountOutMin（滑点）和 deadline；使用私有交易通道（例如 Flashbots Protect 类 RPC）；走带批量拍卖的聚合器。'],
  ['limit', '合约无法看到内存池，也无法阻止排序。合约能做的是：强制要求调用方传入最小输出和截止时间。'],
  ['risk', '滑点设成 50% 或 amountOutMin = 0，等于把差价全部送给机器人。']
])}
<p>对于“先提交的人吃亏”的场景（拍卖出价、链上猜谜、域名注册），用 <strong>commit-reveal（提交-揭示）</strong>：第一阶段只提交答案的哈希，第二阶段再公开答案和随机盐。</p>
${code('SOLIDITY', `
// commit-reveal：ENS 注册就采用这种两阶段流程
mapping(address => bytes32) public commits;
mapping(address => uint256) public commitTime;
uint256 public constant MIN_DELAY = 1 minutes;

function commit(bytes32 h) external {            // h = keccak256(abi.encode(answer, salt, msg.sender))
    commits[msg.sender] = h;
    commitTime[msg.sender] = block.timestamp;
}

function reveal(uint256 answer, bytes32 salt) external {
    require(block.timestamp >= commitTime[msg.sender] + MIN_DELAY, "too early");
    require(keccak256(abi.encode(answer, salt, msg.sender)) == commits[msg.sender], "bad reveal");
    delete commits[msg.sender];
    // ... 处理 answer
}
// 哈希里包含 msg.sender：别人复制你的 commit 也无法替你揭示。
`)}

<h2>4. 签名重放与 EIP-712</h2>
<p>很多协议支持“链下签名、链上执行”，例如 ERC-20 的 <code>permit</code>（EIP-2612）。如果签名的消息里缺少约束，同一个签名可以被执行多次，或者被拿到另一条链、另一个合约上执行，这叫<strong>签名重放（Signature Replay）</strong>。</p>
${tbl(['重放类型', '缺少什么', '修复'], [
  ['同合约重复执行', 'nonce', '每个签名者维护递增 nonce，执行后 +1'],
  ['跨链重放（例如硬分叉后两条链）', 'chainId', 'EIP-712 域分隔符包含 chainId，并在链 ID 变化时重新计算'],
  ['跨合约重放（同一套代码部署两次）', 'verifyingContract', '域分隔符包含合约地址'],
  ['过期签名被延迟使用', 'deadline', '消息包含截止时间'],
  ['签名可塑性（s 值翻转得到第二个有效签名）', '对 s 的范围检查', '使用 OpenZeppelin ECDSA.recover，不直接用 ecrecover']
])}
${code('SOLIDITY', `
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract Voucher is EIP712, Nonces {
    // 类型哈希：结构体定义的字符串必须和前端签名时完全一致
    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address to,uint256 amount,uint256 nonce,uint256 deadline)");
    address public immutable signer;

    // 域分隔符 = hash(name, version, chainId, verifyingContract)，由 EIP712 自动管理
    constructor(address _signer) EIP712("Voucher", "1") { signer = _signer; }

    function claim(address to, uint256 amount, uint256 deadline, bytes calldata sig) external {
        require(block.timestamp <= deadline, "expired");
        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, to, amount, _useNonce(to), deadline));
        bytes32 digest = _hashTypedDataV4(structHash);        // 0x1901 ‖ domainSeparator ‖ structHash
        require(ECDSA.recover(digest, sig) == signer, "bad sig"); // 拒绝可塑签名和零地址
        // ... 发放 amount 给 to
    }
}
`)}
${call('warn', `<p>不要让用户签“看不懂的十六进制”。EIP-712 的价值之一是钱包能把结构体字段逐项展示给用户。钓鱼网站常诱导用户签 <code>permit</code> 或 Permit2 授权，一个签名就能转走全部代币。前端侧防护见 <a href="#m07">M03</a>。</p>`)}

<h2>5. 代理升级：存储冲突与未初始化</h2>
<p>代理合约用 <code>delegatecall</code> 执行实现合约的代码，但读写的是<strong>代理自己的存储</strong>。所以“升级”= 把代理里记录的实现地址换掉，数据留在代理里。实现地址存放在 EIP-1967 规定的固定槽位（由 <code>keccak256("eip1967.proxy.implementation") − 1</code> 计算），避免和业务变量冲突。</p>
${compare('三种代理模式的结构', [
  { name: 'Transparent 透明代理', kind: 'info', points: ['用户调用代理，代理 delegatecall 到实现合约', '升级逻辑在代理里，只有 ProxyAdmin 能升级', '管理员地址不能调用业务函数'] },
  { name: 'UUPS', kind: 'key', points: ['代理只负责转发，最省 Gas', '升级函数 upgradeToAndCall 写在实现合约里', '新版本忘了带升级函数，就再也无法升级'] },
  { name: 'Beacon 信标', kind: 'ok', points: ['很多代理都去问同一个信标“实现在哪”', '升级信标一次，所有代理同时换实现', '适合工厂批量部署的同类合约'] }
], [
  ['flow', '三种模式中，用户都调用代理地址，代码来自实现合约，数据存在代理里。'],
  ['key', 'Transparent：升级逻辑在代理里，管理员地址不能调用业务函数，调用路径清晰但每次调用多一次判断。UUPS：升级逻辑在实现合约里，代理更省 Gas，但新版本忘了继承 UUPSUpgradeable 就再也无法升级。Beacon：一次升级让成百上千个代理同时换实现，适合工厂批量部署。'],
  ['risk', '升级权限 = 全部资金的控制权。升级函数必须由多签 + 时间锁控制。'],
  ['fail', '新版本改变了已有变量的顺序或类型，会读到错位的数据（存储冲突）。']
])}
${code('SOLIDITY', `
// ❌ 存储冲突：V2 在已有变量前面插入了新变量
contract VaultV1 { address owner; uint256 totalDeposits; }
contract VaultV2 { uint256 fee; address owner; uint256 totalDeposits; }
// 升级后，V2 的 fee 读到原来 owner 所在的槽位 0，owner 读到 totalDeposits 的槽位 1。数据全部错位。

// ✅ 规则：只在末尾追加变量；或使用 ERC-7201 命名空间存储（OpenZeppelin v5 的做法）
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VaultV1u is UUPSUpgradeable, OwnableUpgradeable {
    uint256 public totalDeposits;
    uint256[49] private __gap;   // 预留槽位：V2 新增变量时从这里“借”，并把 49 相应减小
    // OpenZeppelin v5 自身的父合约使用 ERC-7201 命名空间存储，不会和你的变量冲突

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }   // 防止有人直接初始化实现合约并接管

    function initialize(address owner_) external initializer {
        __Ownable_init(owner_);
    }
    function _authorizeUpgrade(address) internal override onlyOwner {} // owner 应为时间锁
}
`)}
<p><strong>未初始化的实现合约</strong>：实现合约本身也是一个链上合约。如果它没有在构造函数里锁死初始化，攻击者可以直接对实现合约调用 <code>initialize</code> 成为它的 owner。在 UUPS 模式下，攻击者再让实现合约 delegatecall 到一个执行 <code>selfdestruct</code> 的合约，所有代理就指向一个空地址，资金被永久锁死（这是 2024 年 Cancun 升级之前的行为，之后 SELFDESTRUCT 不再删除代码，但未初始化的实现合约仍可能被恶意升级）。2021 年 9 月 OpenZeppelin 披露并修复了 UUPS 实现合约的这类问题；${cite('OpenZeppelin：UUPSUpgradeable Vulnerability Post-mortem', 'https://forum.openzeppelin.com/t/uupsupgradeable-vulnerability-post-mortem/15680')}2022 年 2 月白帽向 Wormhole 报告同类问题，Wormhole 随后支付了 1,000 万美元赏金。${cite('Immunefi：Wormhole Uninitialized Proxy Bugfix Review', 'https://immunefi.com/blog/bug-fix-reviews/wormhole-uninitialized-proxy-bugfix-review/')}</p>
${call('info', `<p>工具：用 <code>@openzeppelin/upgrades-core</code>（Hardhat / Foundry 插件 openzeppelin-foundry-upgrades）在升级前自动比较新旧存储布局；用 <code>forge inspect 合约名 storageLayout</code> 查看槽位。</p>`)}

${cases([
  ['Parity 多签钱包库被“自毁”，大量资金被冻结', '2017 年 11 月',
   '<p>Parity 的多签钱包把大部分逻辑放在一个共享的“库合约”里，每个钱包通过 delegatecall 使用它。这个库合约本身没有被初始化，任何人都可以调用初始化函数成为 owner。2017 年 11 月，一名用户这样做了，随后调用了库里的自毁函数，库代码从链上消失。依赖它的钱包全部指向一个空地址，里面的资金再也无法转出。</p><p>各来源估算的冻结金额不同，从数十万到约 100 万 ETH 不等，Parity 自己也说这些数字属于推测。启示：<strong>被 delegatecall 的实现合约必须自己锁死初始化，且不能留有自毁入口。</strong>2024 年坎昆升级的 EIP-6780 之后，<code>selfdestruct</code> 在以太坊主网不再删除已部署合约的代码（同一笔交易内创建的合约除外），这类“杀库”攻击在主网已不可行，但“未初始化的实现合约”仍是审计清单上的固定检查项。</p>',
   [['Parity：A Postmortem on the Parity Multi-Sig Library Self-Destruct', 'https://medium.com/paritytech/a-postmortem-on-the-parity-multi-sig-library-self-destruct-63daca3a4cf7'], ['TechCrunch：A major vulnerability has frozen hundreds of millions of dollars of ethereum', 'https://techcrunch.com/2017/11/07/a-major-vulnerability-has-frozen-hundreds-of-millions-of-dollars-of-ethereum']]]
], 'h3')}

<h2>6. 治理攻击、审计流程与事件应急</h2>
<h3>6.1 治理攻击</h3>
<p>链上治理按代币数量投票。如果“投票权 = 当前余额”，攻击者就能用闪电贷临时借到多数票。2022 年 4 月，Beanstalk 被攻击者用闪电贷取得超过 2/3 投票权，通过紧急提案（emergencyCommit）执行恶意代码，协议损失约 1.8 亿美元，攻击者实际获利约 7,600 万至 8,000 万美元。${cite('Beanstalk：Governance Exploit 官方说明', 'https://bean.money/blog/beanstalk-governance-exploit')}${cite('The Block：Beanstalk 损失约 1.82 亿美元', 'https://www.theblock.co/linked/142272/security')}</p>
${steps([
  '投票权快照：用 OpenZeppelin <code>ERC20Votes</code> 的 <code>getPastVotes(account, 提案创建时的区块)</code>，提案创建后买入的代币无效。',
  '投票延迟（votingDelay）和投票期（votingPeriod）：给社区发现恶意提案的时间。',
  '时间锁（TimelockController）：提案通过后再等待 24–72 小时（示例）才能执行，用户可以先撤资。',
  '法定人数（quorum）和提案门槛：防止低参与度时被少数票通过。',
  '紧急权限只能“暂停”，不能“转走资金”。'
])}
${mm('链上治理（Governor）的提案生命周期', `
stateDiagram-v2
  [*] --> Pending : 提案创建
  Pending --> Active : 投票延迟结束
  Active --> Defeated : 未达法定人数或反对更多
  Active --> Succeeded : 达到法定人数且赞成更多
  Succeeded --> Queued : 进入时间锁
  Queued --> Executed : 延迟期满后执行
  Queued --> Expired : 超过宽限期未执行
  Pending --> Canceled : 提案人或守护者取消
`, [
  ['flow', '提案按“延迟 → 投票 → 排队 → 执行”前进。排队期就是时间锁，社区可以在这期间发现问题、撤资或取消。'],
  ['fail', '赞成多于反对但没达到法定人数，提案失败。投票人没“委托”，投票权不会生效（见下）。'],
  ['key', '投票权用快照：只认提案创建时刻的持仓。提案之后买入的代币不能投这一票。'],
  ['risk', '时间锁的管理员权限必须交给治理合约，而不是某个人，否则治理形同虚设。']
])}
<p><strong>算一算（示例）：</strong>代币总量 10,000,000，法定人数 4%，即 400,000 票。投票结束时：赞成 600,000，反对 200,000，弃权 100,000。</p>
${steps([
  'OpenZeppelin 的 GovernorCountingSimple 把<strong>赞成与弃权</strong>都计入法定人数：600,000 + 100,000 = 700,000 ≥ 400,000，达到。',
  '通过条件：赞成 > 反对，即 600,000 > 200,000，成立。提案 Succeeded，进入排队。',
  '若时间锁延迟为 2 天，则 2 天后任何人都可以调用 execute 执行提案。'
])}
${code('SOLIDITY', `
// 治理代币：必须用 ERC20Votes 才有“快照”能力
contract GovToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("Gov", "GOV") ERC20Permit("Gov") { _mint(msg.sender, 10_000_000e18); }
    function nonces(address o) public view override(ERC20Permit, Nonces) returns (uint256) { return super.nonces(o); }
    function _update(address f, address t, uint256 v) internal override(ERC20, ERC20Votes) { super._update(f, t, v); }
}

// 持币人必须先委托（可委托给自己），投票权才会被记录
// token.delegate(msg.sender);

// 治理合约（用 OpenZeppelin Wizard 生成并按需调整，还需要 override 若干函数）
contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes,
                        GovernorVotesQuorumFraction, GovernorTimelockControl {
    constructor(IVotes token, TimelockController timelock)
        Governor("MyGovernor")
        GovernorSettings(7200 /* 延迟：约 1 天（12 秒一块） */, 50400 /* 投票期：约 7 天 */, 100_000e18 /* 提案门槛 */)
        GovernorVotes(token)
        GovernorVotesQuorumFraction(4)                      // 法定人数 4%
        GovernorTimelockControl(timelock)
    {}
    // ……其余必须的 override（state、proposalNeedsQueuing、_queueOperations、_executeOperations、_cancel、_executor 等）
}
`)}
${tbl(['', '链上治理（Governor）', '链下投票（Snapshot）'], [
  ['投票方式', '每票一笔交易，花 Gas', '用 EIP-712 签名投票，免 Gas'],
  ['结果能否自动执行', '能：经时间锁后合约直接执行', '默认不能：只是社区意向；需要多签执行，或用 SafeSnap / oSnap 这类插件把结果接到链上；注意 UMA 已于 2025-12-15 停止支持 oSnap' + cite('UMA 文档：oSnap', 'https://docs.uma.xyz/developers/osnap')],
  ['防闪电贷', '用区块快照，提案后买入无效', '用快照区块的持仓，同样不受之后买入影响'],
  ['适合', '决定“合约参数、资金划拨”这类需要强制执行的事', '信号投票、低成本的社区意见征集']
])}
${call('warn', '<p>新手最常见的坑：代币转进来后“投票权是 0”。<code>ERC20Votes</code> 默认不给任何人投票权，必须先 <code>delegate</code>（可以委托给自己）。很多空投用户因此“有币无票”。DAO 的提案流程、委托与金库运营见 <a href="#m02-61">M06.7 DAO 治理与运营</a>。</p>')}
${exq([
  ['为什么“提案创建后买入的代币不能投这一票”能防闪电贷？', '<p>闪电贷借到的代币只存在于一笔交易内。投票权按“提案创建时的区块”快照计算，借入的代币在那个区块并不属于攻击者，所以借来的票数不会被记录。</p>'],
  ['时间锁（Timelock）给用户提供了什么保护？', '<p>一段可观察的窗口。恶意或错误的提案通过后，不能立刻执行；用户可以先撤资，守护者也有时间取消。没有时间锁，通过即执行，用户没有任何反应时间。</p>']
])}

<h3>6.2 审计流程</h3>
${mm('从代码冻结到上线的安全流程', `
flowchart LR
  A["① 范围定义<br/>冻结 commit 哈希<br/>文档与威胁模型"] --> B["② 内部自查<br/>单元 / 模糊 / 不变量测试<br/>覆盖率报告"]
  B --> C["③ 自动化工具<br/>Slither / Aderyn<br/>Echidna / Medusa"]
  C --> D["④ 人工审阅<br/>逐行 + 业务逻辑<br/>经济攻击建模"]
  D --> E["⑤ 报告分级<br/>Critical / High<br/>Medium / Low / Info"]
  E --> F["⑥ 修复 + 复审<br/>审计方确认每个修复"]
  F --> G["⑦ 上线<br/>赏金计划 + 监控<br/>限额逐步放开"]
  G -->|"任何代码变更"| A
`, [
  ['flow', '审计输入是一个固定的 commit 哈希。审计后改过的代码不在审计范围内，必须复审。'],
  ['key', '严重度通常按“影响 × 可能性”划分：Critical 指资金可被直接盗取或永久冻结；High 指在一定条件下损失资金；Medium 指功能失效或有条件的价值损失；Low / Info 指最佳实践与代码质量。' + tag('惯例')],
  ['limit', '工具擅长发现模式化问题（重入、未检查返回值），不擅长发现业务逻辑和经济攻击。人工审阅不可替代。'],
  ['risk', '只审计一次、之后频繁升级的协议，风险等于没有审计。']
])}
${tbl(['环节', '常用工具 / 平台', '产出'], [
  ['静态分析', 'Slither、Aderyn、Solhint', '检测器告警列表（需人工过滤误报）'],
  ['模糊与不变量测试', 'Foundry fuzz / invariant、Echidna、Medusa', '违反不变量的最小复现序列'],
  ['形式化验证', 'Certora、Halmos、Kontrol', '对关键性质的数学证明或反例'],
  ['人工审计', '专业审计公司；竞赛平台 Code4rena、Sherlock、Cantina', '分级报告与修复建议'],
  ['漏洞赏金', 'Immunefi 等平台', '上线后持续接收白帽报告；常见做法是 Critical 赏金按受影响资金比例设定并设上限']
])}
<h3>6.3 事件应急：暂停、多签、时间锁</h3>
${mm('事件响应状态机', `
stateDiagram-v2
  state "正常运行" as Normal
  state "告警触发" as Alert
  state "暂停" as Paused
  state "调查与修复" as Fix
  state "时间锁排队" as Queued
  state "恢复运行" as Resumed
  state "复盘公告" as Post
  [*] --> Normal
  Normal --> Alert: 监控发现异常流出
  Alert --> Normal: 确认误报
  Alert --> Paused: 守护者多签调用 pause
  Paused --> Fix: 组建作战室 定位根因
  Fix --> Queued: 提交升级或参数修复
  Queued --> Resumed: 时间锁到期 执行
  Resumed --> Post: 发布事故报告
  Post --> [*]
`, [
  ['flow', '暂停由低门槛的守护者多签（例如 2/4）立即执行；修复由高门槛的治理多签加时间锁执行。两种权限分开。'],
  ['key', '暂停权限只能停，不能转钱。即使守护者密钥被盗，最坏结果是协议暂停，而不是资金被盗。'],
  ['fail', '常见失误：暂停开关覆盖不全（只暂停存款，忘了暂停借款和清算）；作战室联系方式过期；签名人分布在同一时区，凌晨无人响应。'],
  ['limit', '暂停只能阻止后续交易，已经上链的损失无法回滚。速度决定损失大小。']
])}
${tryit(`<p>用 Slither 扫描一个合约：</p>
<ol><li>安装：<code>pip install slither-analyzer</code>（需要 Python 3.8+ 和 solc，或在 Foundry 项目中直接运行）。</li>
<li>在 Foundry 项目根目录运行 <code>slither .</code>。</li>
<li>把 <a href="#m02-7">M02.8</a> 的 <code>VulnerableVault</code> 放进 <code>src/</code> 再扫描一次。</li>
<li>预期结果：输出包含 <code>reentrancy-eth</code> 告警，指向 <code>withdraw()</code> 中 call 之后的状态写入。</li>
<li>改成 CEI 后重新扫描，该告警消失。</li></ol>`)}
<p>完整的审计方法、工具链（Slither 打印器、Echidna、Medusa、Halmos、Certora）和应急预案模板见 <a href="#m02-62">M02.10 审计方法与工具链</a>，ZK 电路特有的欠约束漏洞见 <a href="#m10-3">M04.12 第一个电路 Circom</a>。</p>

<h2>生产环境清单（上线安全清单）</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['估值只用 Chainlink 或足够长的 TWAP，并检查新鲜度', '防止闪电贷价格操纵', '分叉测试：在同一交易内大额兑换，协议估值不变'],
  ['所有价格敏感函数要求 minOut 和 deadline', '限制三明治和延迟执行损失', '单元测试：minOut 不满足时 revert'],
  ['签名包含 EIP-712 域、nonce、deadline，用 ECDSA.recover', '防止重放和可塑性', '测试同一签名第二次提交必须 revert'],
  ['实现合约构造函数调用 _disableInitializers；升级前比对存储布局', '防接管与存储冲突', 'openzeppelin-foundry-upgrades 校验通过'],
  ['升级与参数修改：多签 + 时间锁；暂停：独立守护者多签', '权限分级', '链上查询 owner / 角色持有人和 Timelock 延迟'],
  ['治理投票权按快照计算，提案有投票延迟和时间锁', '防闪电贷治理攻击', '测试：提案创建后获得的代币投票无效'],
  ['外部审计完成，所有 Critical / High 已修复并复审', '审计闭环', '审计报告附带修复 commit 哈希'],
  ['赏金计划上线，监控告警和作战室演练过', '持续发现与快速响应', '每季度一次桌面演练，记录响应时间'],
  ['TVL 上限逐步放开', '限制未知漏洞的爆炸半径', '合约内置 cap，治理逐级调高']
])}
${mistakes([
  ['闪电贷是漏洞，禁止闪电贷就安全了。', '闪电贷只是放大器。即使没有闪电贷，资金充足的攻击者也能操纵即时价格。修复点是价格来源，不是资金来源。'],
  ['用 TWAP 就绝对安全。', 'TWAP 抗单笔操纵，但在流动性浅的池子里，持续多个区块的操纵仍然可能，而且 TWAP 在剧烈行情中滞后，会导致该清算未清算。'],
  ['签名里放了 nonce 就不会被重放。', '还需要 chainId 和 verifyingContract（EIP-712 域分隔符），否则签名可以在其他链或同代码的其他部署上使用。'],
  ['可升级合约更安全，因为出错可以修。', '升级权限本身是最大的风险点。升级还会引入存储冲突和未初始化问题。是否可升级要按资金规模和治理成熟度权衡。']
])}
${recap([
  '估值不能用单笔交易可推动的价格。用 Chainlink（检查新鲜度）、长 TWAP 或多源中位数，并假设攻击者拥有无限闪电贷资金。',
  'MEV：合约强制 minOut + deadline；需要公平顺序的场景用 commit-reveal；用户侧用私有交易通道。',
  '签名防重放 = EIP-712 域分隔符（chainId、合约地址）+ nonce + deadline + ECDSA.recover。',
  '代理升级：只在末尾追加变量或用 ERC-7201；实现合约 _disableInitializers；升级权限交给多签 + 时间锁。',
  '治理按快照计票；审计是“范围 → 工具 → 人工 → 分级 → 复审”的闭环；上线后靠赏金、监控、暂停和时间锁兜底。'
])}
${quiz([
  { q: '某借贷协议直接读取 Uniswap 池子的即时价格给抵押品估值。最直接的攻击是什么？', o: ['签名重放', '闪电贷推高池价后超额借款', '整数溢出', '存储冲突'], a: 1, why: '即时价格能在同一笔交易内被大额兑换推动，攻击者借闪电贷推价、按虚高估值借款、再复原。其他选项与价格来源无关。' },
  { q: 'EIP-712 域分隔符中的 chainId 主要防止什么？', o: ['同一合约内同一签名被提交两次', '签名在另一条链上被重放', '签名的 s 值被翻转', '交易被三明治攻击'], a: 1, why: 'chainId 把签名绑定到一条链。同合约重复提交由 nonce 防止；s 值翻转由 ECDSA 库检查；三明治与签名无关。' },
  { q: 'UUPS 代理相比 Transparent 代理，最需要额外注意的风险是？', o: ['新实现合约如果没有升级函数，代理将永远无法再升级', '管理员无法调用业务函数', '每次调用多一次管理员判断，Gas 更高', '不支持 delegatecall'], a: 0, why: 'UUPS 的升级逻辑在实现合约中，升级到不含 upgradeToAndCall 的版本会“砖化”。B、C 是 Transparent 的特征；D 错误，所有代理都基于 delegatecall。' },
  { q: '哪一项最能防御“闪电贷借票”式治理攻击？', o: ['提高提案门槛到 1% 代币', '按提案创建时区块的快照计算投票权', '把投票期缩短到 1 小时', '允许紧急提案立即执行'], a: 1, why: '快照让提案创建后借来的代币没有投票权。A 门槛可以被闪电贷满足；C 和 D 反而缩短了社区反应时间。' }
])}
${checklist(["能用恒定乘积公式算出把池子即时价格推到目标值所需的投入量。", "能写出检查 answer 大于 0、updatedAt 新鲜度和 answeredInRound 的 Chainlink 价格读取函数。", "能用 EIP712、Nonces 和 ECDSA.recover 写出带 deadline、不可重放的签名校验。", "能在升级前比对新旧存储布局，并在实现合约构造函数中调用 _disableInitializers。", "在 Foundry 项目里用 Slither 扫描过 VulnerableVault，看到 reentrancy-eth 告警，并在改成 CEI 后确认它消失。"])}
${terms([
  ['时间加权平均价格', 'TWAP', '一段时间内价格按秒加权的平均值，抗单笔操纵'],
  ['价格操纵', 'Price Manipulation', '通过大额交易临时改变协议所读价格以获利'],
  ['最大可提取价值', 'MEV, Maximal Extractable Value', '通过交易排序、插入、剔除获得的额外收益'],
  ['三明治攻击', 'Sandwich Attack', '在目标交易前后各插入一笔交易赚取价差'],
  ['提交-揭示', 'Commit-Reveal', '先提交哈希、后公开原文的两阶段防抢跑方案'],
  ['域分隔符', 'Domain Separator', 'EIP-712 中把签名绑定到特定协议、版本、链和合约的哈希'],
  ['签名重放', 'Signature Replay', '同一签名被重复使用或在其他上下文中使用'],
  ['存储冲突', 'Storage Collision', '升级前后变量布局不一致导致数据错位'],
  ['时间锁', 'Timelock', '操作提交后必须等待固定时长才能执行的合约'],
  ['漏洞赏金', 'Bug Bounty', '向报告漏洞的白帽支付奖励的长期计划']
])}
` });
})();
