/* ---------- M02 子文章（a-3）：m02-5 代币标准 · m02-6 Gas 与存储优化 ---------- */
(() => {
CUR = 'm02-5';
addCh({ id: 'm02-5', nav: 'ERC-20 与授权', title: 'M02.5 ERC-20 与授权：接口、授权风险、permit 与非标准代币', desc: 'ERC-20 的余额表与授权表、三类授权风险、permit，以及集成 USDT 等非标准代币的坑', html: `
<h1>M02.5 ERC-20 与授权：接口、授权风险、permit 与非标准代币</h1>
${meta(['说出 ERC-20 的全部函数和事件，解释 decimals 和 approve / transferFrom 授权模型。', '识别无限授权、approve 竞态、钓鱼授权的风险，并会用 permit 和撤销授权降低风险。', '用 OpenZeppelin 写并测试一个 ERC-20，安全地集成 USDT、手续费代币和 rebase 代币。NFT 与代币发行见 <a href="#m02-50">M02.6</a>。'], '<a href="#m02-3">M02.3 Solidity 基础 II</a>、<a href="#m02-4">M02.4 开发工具链</a>', ['erc20'])}
${beginner(`<p><strong>代币（Token）</strong>：在一个合约里记账的数字资产。你“拥有 100 USDC”，实际是 USDC 合约的余额表里，你的地址对应 100 × 10⁶。</p>
<p><strong>ERC</strong>：以太坊征求意见（Ethereum Request for Comments），社区约定的接口标准。ERC-20 是同质化代币标准，ERC-721 是 NFT 标准。</p>
<p><strong>同质化（Fungible）</strong>：每一份都一样、可以互换，比如一张 100 元钞票换另一张。<strong>非同质化（Non-Fungible）</strong>：每一份都独一无二，比如演唱会的座位号。</p>
<p><strong>授权（Approve / Allowance）</strong>：你允许另一个地址（通常是合约）从你的余额里最多转走多少代币。</p>
<p><strong>钓鱼（Phishing）</strong>：伪装成正常网站，诱导你签名一笔把资产或授权交给攻击者的交易。</p>`)}

<h2>1. 一句话理解</h2>
${one('ERC-20 代币就是一个合约里的余额表 + 一张授权表：transfer 由主人自己转，transferFrom 由被授权的合约代转，授权额度就是你暴露给对方的风险上限。')}
${call('analogy', `<p>余额表像银行账户；授权像你签给某家公司的“代扣协议”：水电公司每月可以从你账户扣最多 500 元。你不用每次都去柜台，但如果你把代扣协议签给了骗子，骗子也能扣。</p>
<p>“无限授权”就是代扣协议上写“金额不限、永久有效”。省事，但对方一旦出问题，你的整个账户都暴露。</p>
<p>比喻的局限：银行代扣可以打电话冻结、事后追回；链上授权必须你自己发交易撤销，被转走的钱基本追不回来。</p>`)}
${art('一图看懂：ERC-20 = 合约里两张表，授权表决定别人能动你多少', 660, 300, [
  S.zone(190, 30, 280, 200, { t: '链上 · USDC 代币合约' }),
  S.box(10, 70, 100, 70, { k: 'tint', icon: 'person', t: 'Alice' }),
  S.box(206, 58, 248, 70, { k: 'info', icon: 'db', t: '余额表 balanceOf', s: 'Alice：1,000 USDC\nDEX：0', mono: 1 }),
  S.box(206, 148, 248, 70, { k: 'key', icon: 'lock', t: '授权表 allowance', s: 'Alice 对 DEX：1,000\n用多少，扣多少', mono: 1 }),
  S.box(550, 100, 100, 70, { k: 'idle', dash: 1, icon: 'server', t: 'DEX', s: '合约' }),
  S.arrow(112, 95, 204, 95, { label: 'transfer' }),
  S.arrow(112, 120, 204, 175, { k: 'key', label: 'approve' }),
  S.arrow(548, 95, 456, 95, { label: 'transferFrom' }),
  S.arrow(548, 130, 456, 175, { k: 'key', label: '先查额度' }),
  S.text(330, 270, '数字均为示例：DEX 最多只能动用授权表里那一格；无限授权 = 把那一格写成最大值', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '主人自己转用 transfer；合约想代转，必须先有 approve，再由合约调 transferFrom。'],
  ['key', 'allowance 是你暴露给对方的风险上限：approve 是覆盖，不是累加。'],
  ['risk', '无限授权或钓鱼授权下，对方不需要你的私钥就能转走额度内的全部余额。'],
  ['limit', '授权必须自己发交易撤销（approve 0），被转走的钱基本追不回。']
], 'Alice 自己用 transfer 改余额表，用 approve 在授权表写额度；DEX 用 transferFrom 先查授权额度，再从余额表代转', 'm02-5')}

<h2>2. ERC-20 全部接口</h2>
${code('SOLIDITY', `
interface IERC20 {
    // ---- 事件 ----
    event Transfer(address indexed from, address indexed to, uint256 value);     // 铸造时 from = 0，销毁时 to = 0
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // ---- 查询 ----
    function totalSupply() external view returns (uint256);                     // 总供应量
    function balanceOf(address account) external view returns (uint256);        // 某地址余额
    function allowance(address owner, address spender) external view returns (uint256); // 授权额度

    // ---- 修改 ----
    function transfer(address to, uint256 value) external returns (bool);       // 主人自己转
    function approve(address spender, uint256 value) external returns (bool);   // 设置授权（覆盖，不是累加）
    function transferFrom(address from, address to, uint256 value) external returns (bool); // 被授权方代转
}

interface IERC20Metadata is IERC20 {   // 元数据：标准中是可选的，但几乎所有代币都实现
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}
`)}
<h3>2.1 decimals：链上只有整数</h3>
<p><code>decimals</code> 只影响“显示”，不影响合约计算。合约里所有数量都是最小单位的整数。</p>
${tbl(['代币', 'decimals（以太坊主网）', '1 个代币在链上的整数'], [
  ['ETH（原生币，非 ERC-20）', '18', '1,000,000,000,000,000,000 wei'],
  ['DAI', '18', '10¹⁸'],
  ['USDC / USDT', '6', '1,000,000'],
  ['WBTC', '8', '100,000,000']
])}
<p><strong>算一算（示例）</strong>：用户在界面输入“转 2.5 USDC”。</p>
${steps(['查询 decimals = 6。', '链上数量 = 2.5 × 10⁶ = 2,500,000。', '如果前端误按 18 位处理：2.5 × 10¹⁸，比用户余额大 10¹² 倍，交易 revert；反过来，把 18 位代币按 6 位处理，会只转出预期的一万亿分之一。', '结论：每个代币都要读取 decimals，不能假设 18。前端精度处理见 <a href="#m07">M03</a>。'])}

<h2>3. 授权模型：approve + transferFrom</h2>
<p>合约无法“主动拿走”你的代币，也收不到 ERC-20 转账通知（ERC-20 没有回调）。所以和 DEX、借贷协议交互需要两步：先 approve，再让合约调用 transferFrom。</p>
${mm('在 DEX 上用 USDC 兑换 ETH 的两笔交易', `
sequenceDiagram
  autonumber
  participant A as Alice 钱包
  participant T as USDC 合约
  participant D as DEX 合约
  A->>T: 交易 1：approve(DEX, 1000)
  T->>T: allowance[Alice][DEX] = 1000
  T-->>A: emit Approval(Alice, DEX, 1000)
  A->>D: 交易 2：swap(1000 USDC)
  D->>T: transferFrom(Alice, DEX, 1000)
  T->>T: 检查 allowance ≥ 1000 且 余额 ≥ 1000
  T->>T: allowance 减 1000，余额从 Alice 移到 DEX
  T-->>D: emit Transfer(Alice, DEX, 1000)
  D->>A: 转出 ETH
`, [
  ['flow', 'Alice 的签名只发生在两笔交易的发起时；transferFrom 由 DEX 合约调用，msg.sender 是 DEX。'],
  ['key', 'approve 是覆盖语义：approve(DEX, 500) 不是“加 500”，而是“改成 500”。'],
  ['fail', 'allowance 不足或余额不足时 transferFrom revert，整个 swap 回滚。OpenZeppelin v5 的错误是 ERC20InsufficientAllowance / ERC20InsufficientBalance。'],
  ['risk', '授权在 swap 结束后仍然有效（除非用完）。DEX 合约若被攻破，剩余授权额度内的资金都有风险。']
])}
<p>现在动手：先让 DEX 超额扣款，观察 revert；再模拟误签钓鱼授权，观察攻击者如何在没有私钥的情况下转走全部余额；最后用 approve 0 撤销。</p>
${lab('erc20')}
<p>做完实验，你应该观察到三件事：① 授权额度是被授权方能动用的上限；② 无限授权（<code>type(uint256).max</code>）在 OpenZeppelin 实现中不会递减；③ 撤销只能阻止未来的转账，不能追回已转走的资金。</p>
<h3>3.1 三类授权风险</h3>
${tbl(['风险', '原理', '防护'], [
  ['无限授权', '为了省 Gas 授权 MAX；协议合约被攻破或被恶意升级时，你的全部余额暴露。2021 年 11–12 月 Badger DAO 前端被注入恶意授权请求（授权给攻击者地址），损失约 1.2 亿美元' + cite('Rekt：Badger', 'https://rekt.news/badger-rekt/'), '按需授权；定期在 revoke.cash 或 Etherscan Token Approval 页面检查并撤销'],
  ['钓鱼授权', '假网站让你签 approve 或 permit，spender 是攻击者', '钱包签名前看清 spender 地址和金额；对“领取空投”保持警惕；见 <a href="#m00-6">M00.6 安全第一课</a>'],
  ['approve 竞态', 'Alice 把对 Bob 的授权从 100 改成 50；Bob 看到交易后抢先用掉 100，等改成 50 后再用 50，共转走 150', '先 approve(0) 再设新值；或用 increaseAllowance 类函数；协议侧用 permit 一次性授权']
])}
${mm('approve 竞态：改小授权反而被多转', `
sequenceDiagram
  participant A as Alice
  participant M as 内存池
  participant B as Bob（被授权方）
  participant T as 代币合约
  Note over T: allowance[Alice][Bob] = 100
  A->>M: approve(Bob, 50)（想改小）
  B->>M: 监听到后，用更高小费发 transferFrom(Alice, Bob, 100)
  M->>T: Bob 的交易先上链：转走 100，allowance = 0
  M->>T: Alice 的交易上链：allowance = 50
  B->>T: transferFrom(Alice, Bob, 50)
  Note over A,T: Bob 共转走 150，超过 Alice 的任何一次授权
`, [
  ['flow', '根因是 approve 直接覆盖旧值，不检查旧值是否已被使用。'],
  ['risk', '只有在被授权方本身不可信时才构成威胁，但 ERC-20 标准文档专门提示了这一点。'],
  ['key', 'OpenZeppelin v4 提供 increaseAllowance / decreaseAllowance；v5 从 ERC20 中移除了它们。集成方可用 SafeERC20 的 safeIncreaseAllowance / forceApprove。'],
  ['limit', '主网 USDT 的 approve 要求：当前授权非 0 时，不能直接改成另一个非 0 值，必须先归零。']
])}
<h3>3.2 EIP-2612 permit：用签名代替 approve 交易</h3>
<p>permit 让用户在链下签一条 EIP-712 结构化消息，任何人（通常是协议合约）把签名提交上链，代币合约验证签名后设置授权。用户省掉一笔 approve 交易，也可以在同一笔交易中“授权 + 使用”。</p>
${code('SOLIDITY', `
// EIP-2612 新增的三个函数
function permit(address owner, address spender, uint256 value, uint256 deadline,
                uint8 v, bytes32 r, bytes32 s) external;
function nonces(address owner) external view returns (uint256);   // 防重放：每用一次签名 +1
function DOMAIN_SEPARATOR() external view returns (bytes32);      // 绑定链 ID 和合约地址，防跨链重放
`)}
${call('warn', '<p>permit 签名不花 Gas、不弹出交易确认，只弹出“签名请求”，所以钓鱼网站特别喜欢它。签名内容里有 spender、value、deadline：看到陌生 spender 或巨大 value 立刻拒绝。签名细节见 <a href="#m07">M03 Web3 大前端</a>的签名部分。</p>')}
<p>并非所有代币都支持 permit（主网 USDT 不支持；USDC 支持）。Uniswap 推出的 <strong>Permit2</strong> 合约为任意 ERC-20 提供统一的签名授权：用户对 Permit2 做一次授权，之后各协议通过 Permit2 的签名授权扣款，并可设置过期时间。USDC 还支持另一种签名转账 EIP-3009（<code>transferWithAuthorization</code>），常用于商户收款，见 <a href="#m09-4">M13.4 RWA 与链上支付</a>。</p>

<h2>4. 用 OpenZeppelin 写一个 ERC-20 并测试</h2>
${code('SOLIDITY', `
// src/MyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Permit, Ownable {
    uint256 public constant CAP = 10_000_000 * 1e18;   // 供应上限 1000 万枚
    error CapExceeded(uint256 newSupply, uint256 cap);

    constructor(address owner_)
        ERC20("My Token", "MTK")         // 名称、符号；decimals 默认 18
        ERC20Permit("My Token")          // EIP-712 域名称，与 name 保持一致
        Ownable(owner_)
    {
        _mint(owner_, 1_000_000 * 1e18); // 初始铸造 100 万枚给 owner
    }

    function mint(address to, uint256 amount) external onlyOwner {
        uint256 s = totalSupply() + amount;
        if (s > CAP) revert CapExceeded(s, CAP);
        _mint(to, amount);               // 触发 Transfer(address(0), to, amount)
    }
}
`)}
${code('SOLIDITY', `
// test/MyToken.t.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract MyTokenTest is Test {
    MyToken t;
    address owner = makeAddr("owner");
    address dex   = makeAddr("dex");
    address bob   = makeAddr("bob");
    uint256 alicePk = 0xA11CE;               // 测试用私钥
    address alice;

    function setUp() public {
        alice = vm.addr(alicePk);
        t = new MyToken(owner);
        vm.prank(owner);
        t.transfer(alice, 1_000e18);
    }

    function test_ApproveAndTransferFrom() public {
        vm.prank(alice);
        t.approve(dex, 300e18);
        vm.prank(dex);
        t.transferFrom(alice, dex, 200e18);
        assertEq(t.balanceOf(dex), 200e18);
        assertEq(t.allowance(alice, dex), 100e18);   // 额度递减
    }

    function test_RevertWhen_OverAllowance() public {
        vm.prank(alice);
        t.approve(dex, 300e18);
        vm.expectRevert(abi.encodeWithSelector(
            IERC20Errors.ERC20InsufficientAllowance.selector, dex, 300e18, 500e18));
        vm.prank(dex);
        t.transferFrom(alice, dex, 500e18);
    }

    function test_InfiniteApprovalDoesNotDecrease() public {
        vm.prank(alice);
        t.approve(dex, type(uint256).max);
        vm.prank(dex);
        t.transferFrom(alice, dex, 500e18);
        assertEq(t.allowance(alice, dex), type(uint256).max);
    }

    function test_Permit() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 structHash = keccak256(abi.encode(
            keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
            alice, bob, 50e18, t.nonces(alice), deadline));
        bytes32 digest = keccak256(abi.encodePacked("\\x19\\x01", t.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePk, digest);   // 链下签名
        t.permit(alice, bob, 50e18, deadline, v, r, s);              // 任何人都可以提交
        assertEq(t.allowance(alice, bob), 50e18);
        assertEq(t.nonces(alice), 1);
    }

    function testFuzz_TransferConservesSupply(uint256 amt) public {
        amt = bound(amt, 0, 1_000e18);
        uint256 supply = t.totalSupply();
        vm.prank(alice);
        t.transfer(bob, amt);
        assertEq(t.balanceOf(alice) + t.balanceOf(bob), 1_000e18);
        assertEq(t.totalSupply(), supply);           // 转账不改变总量
    }
}
`)}

<h2>5. 非标准代币：集成方的坑</h2>
${mm('集成任意 ERC-20 时要防的五类行为', `
flowchart TB
  P["你的协议<br/>收取用户代币"] --> Q1{"transfer 返回 bool？"}
  Q1 -->|"不返回（主网 USDT）"| F1["直接 IERC20 调用解码失败 revert<br/>→ 用 SafeERC20"]
  P --> Q2{"转账扣手续费？"}
  Q2 -->|"是"| F2["实际到账 < 参数 amount<br/>→ 用余额差记账"]
  P --> Q3{"余额会自动变化？"}
  Q3 -->|"rebase（如 stETH）"| F3["记账的余额与实际不符<br/>→ 改用包装版（如 wstETH）或份额记账"]
  P --> Q4{"有回调钩子？"}
  Q4 -->|"ERC-777 等"| F4["转账中回调攻击者<br/>→ nonReentrant + CEI"]
  P --> Q5{"可冻结 / 可暂停 / 可升级？"}
  Q5 -->|"USDC、USDT"| F5["某地址被拉黑后转账 revert<br/>→ 不要让单个转账失败卡死整个流程"]
`, [
  ['flow', '协议对每种代币都要回答这五个问题，并在白名单文档里记录。'],
  ['risk', '2020 年 4 月 Uniswap V1 的 imBTC 池和 Lendf.Me 都因 ERC-777 回调被重入攻击，Lendf.Me 损失约 2,500 万美元。' + cite('imToken：关于 Uniswap 与 Lendf.Me 重入攻击', 'https://medium.com/imtoken/about-recent-uniswap-and-lendf-me-reentrancy-attacks-7cebe834cb3') + cite('Quantstamp：dForce 攻击者如何用重入盗走 2,500 万美元', 'https://quantstamp.com/blog/how-the-dforce-hacker-used-reentrancy-to-steal-25-million')],
  ['fail', '用 amount 参数直接记账的协议，遇到手续费代币会出现“账上有、实际没有”，最后一个提款的人取不出钱。'],
  ['key', '最稳妥的做法：只接入经过评估的代币白名单，而不是“任意 ERC-20”。'],
  ['limit', '可升级代币（如 USDC 使用代理）今天是标准的，明天可能改变行为。集成方需要持续监控升级事件。']
])}
${code('SOLIDITY', `
using SafeERC20 for IERC20;

/// 兼容 USDT（不返回 bool）和手续费代币（实际到账少于 amount）
function deposit(IERC20 token, uint256 amount) external nonReentrant {
    uint256 before = token.balanceOf(address(this));
    token.safeTransferFrom(msg.sender, address(this), amount);
    uint256 received = token.balanceOf(address(this)) - before;   // 以实际到账为准
    shares[msg.sender][address(token)] += received;
    emit Deposited(msg.sender, address(token), amount, received);
}

/// 给 USDT 这类“非 0 改非 0 会 revert”的代币设置授权
function approveRouter(IERC20 token, address router, uint256 amount) internal {
    token.forceApprove(router, amount);   // OZ v5：失败时先归零再设置
}
`)}
<p><strong>算一算（示例）</strong>：某代币每次转账扣 2% 手续费。用户 deposit(1,000)。</p>
${steps(['用户发出 1,000，合约实际收到 1,000 × 98% = 980。', '错误做法：shares += 1,000。合约账面欠用户 1,000，实际只有 980，缺口 20。', '100 个用户各存 1,000 后，账面 100,000，实际 98,000；最后提款的用户最多有 2,000 取不出来。', '正确做法：shares += received = 980，账实相符。'])}

${tryit(`<p><strong>检查你自己的授权</strong></p>
<ol><li>打开 etherscan.io/tokenapprovalchecker（或 revoke.cash），连接你的钱包或输入地址（只读，不需要签名）。</li>
<li>查看列表：每一行是一个 (代币, spender, 额度)。标记显示 Unlimited 的条目。</li>
<li>对你不再使用的协议，点 Revoke，钱包会弹出 <code>approve(spender, 0)</code> 交易；确认 spender 地址后签名（需要少量 Gas）。</li>
<li>在 Sepolia 上可以先练习：用 <a href="#m02-4">M02.4</a> 的方法部署本篇 MyToken，approve 一个地址，再用 <code>cast call 代币地址 "allowance(address,address)(uint256)" 你的地址 spender --rpc-url $RPC</code> 确认额度。</li></ol>
<p>预期结果：你知道自己的哪些代币对哪些合约有授权，并撤销了不需要的授权。</p>`)}

${mistakes([
  ['approve(DEX, 500) 会在原有额度上增加 500。', 'approve 是覆盖：额度直接变成 500。'],
  ['代币在我钱包里，所以别人动不了。', '代币永远在代币合约的余额表里。你签过授权的地址可以在额度内用 transferFrom 转走，不需要你的私钥。'],
  ['所有 ERC-20 都是 18 位小数、transfer 都返回 true。', 'USDC / USDT 是 6 位；主网 USDT 的 transfer 不返回值。集成时读取 decimals 并使用 SafeERC20。'],
  ['撤销授权可以追回被盗的代币。', '撤销只阻止未来的 transferFrom。已经转走的代币无法通过撤销追回。'],
  ['签名（permit）不花 Gas，所以没有风险。', 'permit 签名的效果等同于 approve。签给攻击者，攻击者提交签名后就能转走资金。']
])}
${recap([
  'ERC-20 = 6 个函数 + 2 个事件 + 可选元数据；数量都是最小单位整数，decimals 只用于显示。',
  'approve 覆盖设置授权，transferFrom 在额度内代转；授权额度就是风险上限。',
  '无限授权、钓鱼授权、approve 竞态是三类主要风险；定期撤销，签名前看清 spender。',
  'EIP-2612 permit 用签名设置授权；Permit2 为所有代币提供统一签名授权。',
  '集成任意代币要防：不返回 bool、手续费、rebase、回调钩子、黑名单；用 SafeERC20 + 余额差记账 + 白名单。'
])}
${quiz([
  { q: 'Alice 当前对 DEX 的授权是 300，她调用 approve(DEX, 200)。之后授权额度是？', o: ['500', '100', '300', '200'], a: 3, why: 'approve 是覆盖语义，额度直接设为 200。' },
  { q: 'Alice 给攻击者签了无限授权，下面哪个操作能<strong>阻止攻击者以后</strong>转走她新收到的代币？', o: ['更换钱包密码', 'approve(攻击者, 0)', '把代币转给自己', '等待授权自动过期'], a: 1, why: '授权在链上，与钱包密码无关；ERC-20 授权没有自动过期；approve 0 才能撤销。已转走的资金无法追回。' },
  { q: '你的协议直接用 IERC20(usdt).transferFrom(...) 调用主网 USDT，结果会怎样？', o: ['调用 revert，因为 USDT 不返回 bool，ABI 解码失败', '正常成功', '静默失败但不 revert', 'USDT 会被冻结'], a: 0, why: 'IERC20 接口期望返回 bool，USDT 不返回数据，Solidity 0.8 的返回值解码检查会使调用 revert。用 SafeERC20 的 safeTransferFrom 解决。' }
])}
${exercises([["计算题：某代币每次转账扣 1% 手续费（示例）。协议直接用参数 amount 记账。20 个用户各 deposit 5,000。账面和实际余额各是多少？缺口多大？", "<p>每个用户发出 5,000，合约实际收到 5,000 × 99% = 4,950。</p><p>账面合计 20 × 5,000 = 100,000；实际合计 20 × 4,950 = 99,000；缺口 1,000。最后提款的用户取不出钱。</p><p>修复：用转账前后的余额差 <code>received</code> 记账。</p>"], ["思考题：Alice 想把对 Bob 的授权从 200 改成 80（示例）。如果 Bob 不可信，他最多能转走多少？Alice 应该怎么改授权？", "<p>Bob 看到 Alice 的 approve 交易后，可以抢先用掉 200。Alice 的交易上链后额度变成 80，Bob 再用掉 80，共 280。</p><p>更安全的做法：先 <code>approve(Bob, 0)</code>，用 <code>allowance</code> 确认旧额度是否已被使用，再设新值。集成方合约可以用 SafeERC20 的 <code>forceApprove</code> 或 <code>safeIncreaseAllowance</code>。</p>"], ["设计题：钱包弹出一个 permit 签名请求。签名前你要逐项检查哪些字段？各自防什么？", "<p><strong>spender</strong>：必须是你要使用的协议，陌生地址立刻拒绝。<strong>value</strong>：只授权需要的数量，巨大的值等于无限授权。<strong>deadline</strong>：截止时间不要过长。</p><p>签名还绑定了 <code>nonces</code> 和 <code>DOMAIN_SEPARATOR</code>：nonce 防止同一签名被重放，域分隔符把签名绑定到这条链和这个代币合约。permit 不花 Gas，但效果等同于 approve。</p>"]])}
${checklist([
  '能说出 ERC-20 的 6 个函数和 2 个事件，并解释 decimals。',
  '在 revoke.cash 或 Etherscan 查过自己的授权，并撤销了一个不需要的授权。'
])}
${terms([
  ['ERC-20', 'ERC-20', '同质化代币接口标准：余额、转账、授权'],
  ['小数位', 'decimals', '代币显示时的小数位数，链上数量 = 显示数量 × 10^decimals'],
  ['授权额度', 'Allowance', 'owner 允许 spender 通过 transferFrom 转走的最大数量'],
  ['无限授权', 'Infinite Approval', '把授权额度设为 uint256 最大值，以省去后续授权交易'],
  ['许可签名', 'Permit (EIP-2612)', '用链下 EIP-712 签名设置 ERC-20 授权的扩展'],
  ['手续费代币', 'Fee-on-Transfer Token', '转账时扣除一部分数量，实际到账少于参数的代币'],
  ['弹性供应代币', 'Rebase Token', '持有人余额按规则自动增减的代币，如 stETH'],
  ['安全转账库', 'SafeERC20', 'OpenZeppelin 库，兼容不返回 bool 等非标准 ERC-20 行为']
])}
` });

CUR = 'm02-50';
addCh({ id: 'm02-50', nav: 'NFT 与代币发行', title: 'M02.6 NFT 与代币发行：ERC-721/1155、NFT 市场与线性释放', desc: 'NFT 标准与元数据、批量铸造、不托管的 NFT 市场，以及代币分配、IDO 与悬崖期释放', html: `
<h1>M02.6 NFT 与代币发行：ERC-721/1155、NFT 市场与线性释放</h1>
${meta(['区分 ERC-721 与 ERC-1155，读懂 tokenURI 元数据，并用 OpenZeppelin v5 写出可付费铸造的 NFT。', '解释 ERC721A 为什么批量铸造便宜，读懂一个不托管的 NFTMarket 合约，并指出重入防护的位置。', '设计一份代币分配表，算出 IDO 超额认购的分配结果，手算悬崖期加线性释放的可领取数量。'], '前置：<a href="#m02-5">M02.5 ERC-20 与授权</a>')}
${beginner(`<p><strong>NFT（非同质化代币）</strong>：每一枚都有唯一编号（tokenId）的代币，例如门票、头像、域名。</p>
<p><strong>元数据（Metadata）</strong>：描述一枚 NFT 的名称、图片、属性的 JSON 文件，通常放在链外，链上只存它的地址。</p>
<p><strong>IPFS</strong>：按内容哈希寻址的去中心化文件网络。内容不变，地址就不变。</p>
<p><strong>setApprovalForAll</strong>：一次授权某个地址动用你在某个 NFT 合约里的<strong>全部</strong> NFT。市场合约靠它代你转移 NFT。</p>
<p><strong>线性释放（Vesting）</strong>：代币不是一次性给你，而是随时间按比例逐步解锁。</p>`)}

<h2>1. 一句话理解</h2>
${one('NFT 合约只在链上记“哪个 tokenId 归谁”，图片和属性放在链外；市场合约不持有 NFT，只持有“代为转移”的授权；代币发行的关键不是写合约，而是“发给谁、什么时候能卖”。')}
${call('analogy', `<p>NFT 像演唱会门票：票面编号（tokenId）唯一，座位信息印在票上（元数据）。NFT 市场像票务寄卖平台：你不用把票交给平台，只要授权平台“有人付钱时代你过户”。代币发行像公司的股权激励：团队和投资人的股份要分几年逐步兑现，防止拿到就卖。</p>
<p>比喻的局限：门票丢了可以挂失补办；链上授权一旦被滥用、NFT 一旦被转走，没有人能替你撤回。</p>`)}
${art('一图看懂：NFT 链上只记“谁拥有”，图片在链外，市场只持有授权', 660, 330, [
  S.zone(10, 30, 380, 250, { t: '链上' }),
  S.zone(430, 30, 220, 250, { t: '链外' }),
  S.box(26, 58, 348, 84, { k: 'key', icon: 'block', t: 'NFT 合约（ERC-721）', s: 'ownerOf(42) = Alice\ntokenURI(42) = ipfs://…', mono: 1 }),
  S.box(26, 190, 348, 72, { k: 'info', icon: 'bank', t: 'NFTMarket 市场合约', s: '不持有 NFT，只持有授权\nsetApprovalForAll(市场)' }),
  S.box(446, 58, 188, 84, { k: 'info', icon: 'doc', t: '元数据 JSON', s: 'name · attributes\nimage → ipfs://', mono: 1 }),
  S.box(446, 190, 188, 72, { k: 'idle', dash: 1, icon: 'globe', t: '图片文件', s: 'IPFS · 需要 pin' }),
  S.arrow(200, 188, 200, 144, { k: 'key', label: '成交：过户' }),
  S.arrow(376, 100, 444, 100, { label: 'tokenURI' }),
  S.arrow(540, 144, 540, 188, { label: 'image' }),
  S.text(330, 312, '链外服务器关掉后，NFT 归属还在，但图片会消失：元数据最好放 IPFS 并 pin', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['key', '链上只有一张“tokenId → 拥有者”的表和一个 tokenURI 指针；图片和属性都在链外。'],
  ['flow', '市场不收 NFT：卖家授权后，买家付款时市场代为 safeTransferFrom 过户。'],
  ['risk', 'setApprovalForAll 授权的是该合约里你的全部 NFT，钓鱼最常骗你签这一笔。'],
  ['limit', '示例 tokenId 和地址仅作演示；tokenURI 指向中心化服务器时，NFT 图片没有保障。']
], 'NFT 合约在链上记录 tokenId 的拥有者和 tokenURI；元数据与图片在链外；市场合约只持有代为过户的授权', 'm02-50')}

<h2>2. ERC-721 与 ERC-1155</h2>
${tbl(['对比项', 'ERC-20', 'ERC-721（NFT）', 'ERC-1155（多代币）'], [
  ['每个 id 的数量', '只有一种代币，数量任意', '每个 tokenId 只有 1 个', '每个 id 数量任意（可同质也可唯一）'],
  ['核心查询', '<code>balanceOf(owner)</code>', '<code>ownerOf(tokenId)</code>、<code>balanceOf(owner)</code>', '<code>balanceOf(owner, id)</code>、<code>balanceOfBatch</code>'],
  ['转账', 'transfer / transferFrom', 'transferFrom / safeTransferFrom', 'safeTransferFrom / safeBatchTransferFrom'],
  ['授权', '按金额 approve', '单个 <code>approve(to, tokenId)</code> + 全部 <code>setApprovalForAll</code>', '只有 <code>setApprovalForAll</code>'],
  ['接收回调', '无', '<code>onERC721Received</code>（safe 转账时）', '<code>onERC1155Received</code> / <code>onERC1155BatchReceived</code>'],
  ['事件', 'Transfer、Approval', 'Transfer、Approval、ApprovalForAll', 'TransferSingle、TransferBatch、ApprovalForAll、URI'],
  ['元数据', 'name、symbol、decimals', '<code>tokenURI(tokenId)</code>', '<code>uri(id)</code>，可含 {id} 占位符'],
  ['典型用途', '稳定币、治理币', '头像、门票、域名', '游戏道具、批量发放的凭证']
])}
<p>ERC-721 的 <code>tokenURI</code> 返回一个 URL（常见 <code>ipfs://…</code> 或 https），指向下面格式的 JSON：</p>
${code('JSON', `
{
  "name": "Handbook Badge #42",
  "description": "完成 M02 学习的纪念徽章",
  "image": "ipfs://bafybeigdyr.../42.png",
  "attributes": [
    { "trait_type": "Module", "value": "M02" },
    { "trait_type": "Level", "value": 3 }
  ]
}
`)}
${call('info', '<p>NFT 合约通常只在链上记录“谁拥有哪个 tokenId”，图片和描述放在链外。如果 tokenURI 指向中心化服务器，服务器关闭后 NFT 图片会消失。IPFS + 固定（pin）服务或完全链上 SVG 更持久（各存储方案对比见 <a href="#m09-3">M13.3 去中心化存储与 DePIN</a>）。不可转让的 NFT（灵魂绑定代币，ERC-5192）见 <a href="#m09-1">M13.1 链上身份</a> 第 6 节，用它发凭证的实战见 <a href="#m09-6">M13.7 实战：凭证与声誉</a>。</p>')}
${call('warn', '<p><code>setApprovalForAll(operator, true)</code> 一次授权某个地址动用你在该合约中的<strong>全部</strong> NFT。NFT 钓鱼最常见的手法就是诱导签这一笔。safeTransferFrom 会回调接收合约，也是重入入口（见 <a href="#m02-7">M02.8 合约安全 I</a>）。</p>')}

<h2>3. 铸造一个 NFT：OpenZeppelin v5 最小实现</h2>
<p>下面的合约开放付费铸造：每枚 0.01 ETH，总量 1,000 枚。<code>tokenURI</code> 由基础地址加 tokenId 拼成，例如 <code>ipfs://CID/42</code>。</p>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Badge is ERC721, Ownable {
    uint256 public nextId;
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant PRICE = 0.01 ether;
    string private _base;

    error SoldOut();
    error WrongPayment();

    constructor(string memory base) ERC721("Handbook Badge", "HBB") Ownable(msg.sender) {
        _base = base;
    }

    function mint() external payable {
        if (nextId >= MAX_SUPPLY) revert SoldOut();
        if (msg.value != PRICE) revert WrongPayment();
        _safeMint(msg.sender, nextId++);             // nextId++ 先自增，再回调接收方：防重入读到旧值
    }

    function _baseURI() internal view override returns (string memory) { return _base; }

    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "send failed");
    }
}
`)}
${call('warn', '<p>元数据地址要在铸造前确定。常见翻车：先铸造、后“揭示”时才换 <code>baseURI</code>，如果这个函数权限过大，项目方可以随时把所有 NFT 的图片换掉。揭示逻辑要写成一次性、可审计，并在合约里公开承诺。</p>')}
<h2>4. ERC721A：批量铸造为什么便宜</h2>
<p>标准 ERC-721 每铸一枚，就要为这个 tokenId 新写一个“所有者”存储槽。一次铸 5 枚，就是 5 个新槽。<strong>ERC721A</strong>（由 Azuki 团队提出的实现）利用“tokenId 连续”这个前提：一次批量铸造只在<strong>这批的第一枚</strong>上记录所有者，后面几枚的所有者靠“向前找最近一条记录”推出来。</p>
${mm('ERC721 与 ERC721A 铸造 5 枚的存储写入', `
flowchart LR
  subgraph S1["标准 ERC721"]
    A1["tokenId 0 → 所有者"] --- A2["tokenId 1 → 所有者"] --- A3["tokenId 2 → 所有者"] --- A4["tokenId 3 → 所有者"] --- A5["tokenId 4 → 所有者"]
  end
  subgraph S2["ERC721A"]
    B1["tokenId 0 → 所有者（只记这一条）"] -.-> B2["tokenId 1 到 4：向前找最近的记录"]
  end
`, [
  ['flow', 'ERC721A 对地址的余额和已铸数量打包进一个槽，批量铸造只多写常数个槽，和数量几乎无关。'],
  ['fail', '转让批次中间的 tokenId 时，要先把“隐含的所有者”显式写下来，这次转让会更贵：成本被推迟到了第一次转让。'],
  ['limit', 'tokenId 必须从起始值连续递增；不支持任意编号的铸造。'],
  ['key', '只有“一次铸多枚”的场景才值得用 ERC721A；一次只铸 1 枚时，优势很小。']
])}
<p><strong>算一算（示例）：</strong>只计存储和事件，忽略 21,000 基础费等其他开销。按 <a href="#m02-6">M02.7</a> 的规则，新槽首次写入约 22,100 Gas（冷访问加 0→非 0）。Transfer 事件约 1,756 Gas（示例，同 <a href="#m02-1">M02.1</a>）。</p>
${steps([
  '标准 ERC-721 铸 5 枚：5 个所有者新槽 5 × 22,100 = 110,500；用户余额槽首次写 22,100，之后 4 次重复写约 100 × 4 = 400；5 个事件约 8,780。合计约 141,780 Gas。',
  'ERC721A 铸 5 枚：1 个所有者槽 22,100；1 个地址数据槽（余额和已铸数量打包）22,100；更新“下一个 tokenId”的计数约 5,000；5 个事件约 8,780。合计约 57,980 Gas。',
  '结论：批量越大，差距越明显；批量等于 1 时，两者几乎相同。'
])}
${code('SOLIDITY', `
import "erc721a/contracts/ERC721A.sol";

contract BatchBadge is ERC721A {
    constructor() ERC721A("Batch Badge", "BBG") {}

    function mint(uint256 quantity) external payable {
        require(quantity <= 5, "max 5");         // 限制单次数量，避免转让时扫描过长
        _mint(msg.sender, quantity);             // 注意：_mint 不回调接收方，需要时用 _safeMint
    }

    function _startTokenId() internal pure override returns (uint256) { return 1; }   // 从 1 开始，避免 0 号
}
`)}
<h2>5. NFTMarket：定价出售合约</h2>
<p>市场合约的核心问题是：<strong>NFT 还在卖家钱包里时，市场凭什么能转走它？</strong>答案是<strong>授权</strong>。卖家先对市场做 <code>approve</code> 或 <code>setApprovalForAll</code>，市场在买家付款时调用 <code>safeTransferFrom(卖家, 买家, id)</code>。这叫“不托管上架”，卖家随时可以取消，也不用把 NFT 先转出去。</p>
${mm('一次购买的完整调用', `
sequenceDiagram
  participant S as 卖家
  participant M as 市场合约
  participant N as NFT 合约
  participant B as 买家
  S->>N: setApprovalForAll(市场, true)
  S->>M: list(NFT, id, 价格)
  M->>N: ownerOf 与授权检查
  B->>M: buy(NFT, id) 并附带 ETH
  M->>M: 先删除上架记录
  M->>N: safeTransferFrom(卖家, 买家, id)
  M->>S: 转出价款减去手续费
  M->>M: 手续费转给协议
`, [
  ['flow', '市场不持有 NFT，只持有“代为转移的权限”。上架记录里只存卖家和价格。'],
  ['fail', '卖家上架后又把 NFT 转给别人：<code>buy</code> 时 <code>safeTransferFrom</code> 失败，整笔回滚，买家的 ETH 不会损失。'],
  ['risk', '<code>setApprovalForAll</code> 把该合约下全部 NFT 的转移权交给市场。市场合约本身出漏洞，所有授权过的用户都有风险。'],
  ['key', '先删除上架记录，再转 NFT，最后转钱：这是检查-生效-交互顺序，并配 <code>nonReentrant</code>。']
])}
${code('SOLIDITY', `
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    struct Listing { address seller; uint96 price; }       // 20 + 12 = 32 字节，一个槽
    mapping(address => mapping(uint256 => Listing)) public listings;
    uint256 public constant FEE_BPS = 250;                 // 2.5%
    address public immutable feeTo;

    error NotOwner(); error NotApproved(); error NotListed(); error WrongPayment(); error SendFailed();
    event Listed(address indexed nft, uint256 indexed id, address indexed seller, uint256 price);
    event Cancelled(address indexed nft, uint256 indexed id);
    event Sold(address indexed nft, uint256 indexed id, address indexed buyer, uint256 price);

    constructor(address feeTo_) { feeTo = feeTo_; }

    function list(IERC721 nft, uint256 id, uint96 price) external {
        if (nft.ownerOf(id) != msg.sender) revert NotOwner();
        if (!nft.isApprovedForAll(msg.sender, address(this)) && nft.getApproved(id) != address(this)) revert NotApproved();
        listings[address(nft)][id] = Listing(msg.sender, price);
        emit Listed(address(nft), id, msg.sender, price);
    }

    function cancel(IERC721 nft, uint256 id) external {
        if (listings[address(nft)][id].seller != msg.sender) revert NotOwner();
        delete listings[address(nft)][id];
        emit Cancelled(address(nft), id);
    }

    function buy(IERC721 nft, uint256 id) external payable nonReentrant {
        Listing memory l = listings[address(nft)][id];
        if (l.seller == address(0)) revert NotListed();
        if (msg.value != l.price) revert WrongPayment();
        delete listings[address(nft)][id];                 // 1. 先改状态
        nft.safeTransferFrom(l.seller, msg.sender, id);    // 2. 转 NFT（卖家已不是所有者则回滚）
        uint256 fee = msg.value * FEE_BPS / 10_000;
        _send(feeTo, fee);                                 // 3. 最后转钱
        _send(l.seller, msg.value - fee);
        emit Sold(address(nft), id, msg.sender, msg.value);
    }

    function _send(address to, uint256 amt) private {
        (bool ok, ) = payable(to).call{value: amt}("");
        if (!ok) revert SendFailed();
    }
}
`)}
<p><strong>算一算（示例）：</strong>一枚 NFT 标价 2 ETH，手续费率 250 基点。手续费 = 2 × 250 / 10,000 = 0.05 ETH，卖家实收 1.95 ETH。如果合约把 <code>price</code> 存成 <code>uint96</code>，最大约 7.9 × 10<sup>28</sup> wei，远大于任何现实价格，还能和 <code>seller</code> 打包进一个槽。</p>
${tbl(['设计选择', '做法 A', '做法 B', '取舍'], [
  ['NFT 是否托管', '不托管：卖家保留 NFT，只授权', '托管：上架时转入市场合约', 'A 对卖家友好但会出现“过期上架”；B 不会过期，但卖家要多一笔转账，且市场合约持有大量资产，更危险'],
  ['挂单方式', '链上存挂单（上面的写法）', '链下签名订单（如 Seaport 的做法），成交时才上链', '链下挂单免 Gas、可批量，但需要签名校验和取消机制'],
  ['版税', '合约内不处理', '读取 EIP-2981 的 <code>royaltyInfo</code> 并分账', 'EIP-2981 只是“查询接口”，不强制执行，是否支付由市场决定（版税强制的演变见 <a href="#m09-7">M13.6 NFT 市场、版税与 Memecoin 发行</a>）']
])}
${exq([
  ['为什么 <code>buy</code> 里要先 <code>delete listings[…]</code>，再转 NFT？', '<p><code>safeTransferFrom</code> 会回调接收方合约。如果记录还在，接收方可以在回调里再次调用 <code>buy</code> 重复成交同一挂单。先删除记录，再外部调用，重入时挂单已不存在。</p>'],
  ['卖家上架后把 NFT 转走，买家会损失钱吗？', '<p>不会。<code>buy</code> 里 <code>safeTransferFrom</code> 失败会让整笔交易回滚，买家的 ETH 随之退回。损失的只是 Gas。前端应在展示挂单前检查所有权，减少这类失败。</p>']
])}

<h2>6. 代币发行：分配、IDO 与线性释放</h2>
<p>写完 ERC-20 合约只是第一步。真正的难点是<strong>怎么把代币发给谁、什么时候能卖</strong>。这一节只讲机制，不涉及任何具体项目的评价；FDV、解锁抛压与价值捕获等经济设计见 <a href="#m02-60">M08.6 代币经济设计</a>。</p>
${tbl(['分配对象', '占比（示例）', '常见释放方式', '设计目的'], [
  ['团队', '15%', '1 年悬崖期，之后 3 年线性释放', '让团队与长期价值绑定'],
  ['投资人', '20%', '6 个月悬崖期，之后 2 年线性释放', '避免上线即抛售'],
  ['社区与生态', '40%', '按激励计划逐月发放', '用户增长、流动性挖矿'],
  ['公开发售（IDO）', '10%', '上线时解锁部分，其余线性释放', '公平分发、获得启动资金'],
  ['流动性与储备', '15%', '一部分建池，其余多签管理', '保证二级市场可交易']
])}
${mm('LaunchPad 公开发售（IDO）的典型流程', `
flowchart LR
  A["项目方存入待售代币"] --> B["认购期<br/>用户用稳定币认购"]
  B --> C{"总认购额是否超过硬顶"}
  C -->|"没超过"| D["按认购额全额分配"]
  C -->|"超过"| E["按比例分配<br/>多出的稳定币退还"]
  D --> F["上线时解锁一部分"]
  E --> F
  F --> G["其余按线性释放<br/>用户自己 claim"]
`, [
  ['flow', '资金先进入发售合约，结束后项目方提走募集款，用户再领取代币和退款。'],
  ['fail', '认购合约出漏洞或管理员能随意改价格、白名单，会让用户的稳定币被锁或被盗。'],
  ['risk', '锁仓合约如果可升级、或 owner 能提走锁仓代币，“锁仓”就名存实亡。'],
  ['key', '用户看的不是白皮书，而是合约：谁能增发、谁能改释放计划、锁仓能否被提前取出。']
])}
<p><strong>算一算（示例）：</strong>硬顶 100,000 USDC，代币价格 0.05 USDC。实际认购了 400,000 USDC，超额 4 倍。</p>
${steps([
  '分配比例 = 100,000 / 400,000 = 25%。',
  '某用户认购 1,000 USDC：实际成交 1,000 × 25% = 250 USDC，退还 750 USDC。',
  '获得代币 = 250 / 0.05 = 5,000 枚。'
])}
<h3>6.1 线性释放与悬崖期</h3>
<p><strong>悬崖期（Cliff）</strong>内一枚也不能领。悬崖期结束的那一刻，按已过时间的比例<strong>一次性解锁</strong>；之后继续线性增加。公式：已解锁 = 总量 × (当前时间 − 起点) ÷ 总时长，悬崖期前为 0，总时长之后为总量。可领取 = 已解锁 − 已领取。</p>
<p><strong>算一算（示例）：</strong>某团队地址共 1,200,000 枚，从上线日起线性释放 48 个月，悬崖期 12 个月。</p>
${steps([
  '第 6 个月：悬崖期未过，已解锁 0。',
  '第 12 个月：悬崖结束，已解锁 1,200,000 × 12 ÷ 48 = 300,000，一次性可领 300,000。',
  '第 24 个月：已解锁 1,200,000 × 24 ÷ 48 = 600,000；若之前已领 300,000，现在可领 300,000。',
  '第 48 个月及以后：全部 1,200,000 解锁。'
])}
${code('SOLIDITY', `
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LinearVesting {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable cliffEnd;
    uint64 public immutable duration;
    uint256 public released;

    constructor(IERC20 t, address b, uint64 s, uint64 cliffSeconds, uint64 dur) {
        token = t; beneficiary = b; start = s; cliffEnd = s + cliffSeconds; duration = dur;
    }

    function vested(uint64 ts) public view returns (uint256) {
        uint256 total = token.balanceOf(address(this)) + released;    // 总量 = 剩余 + 已领
        if (ts < cliffEnd) return 0;
        if (ts >= start + duration) return total;
        return total * (ts - start) / duration;                        // 先乘后除
    }

    function release() external {
        uint256 amount = vested(uint64(block.timestamp)) - released;
        released += amount;                                            // 先记账
        token.safeTransfer(beneficiary, amount);                       // 后转账
    }
}
`)}
${call('info', '<p>生产环境不必自己写：OpenZeppelin 提供 <code>VestingWallet</code>（线性释放，可接收 ETH 和任意 ERC-20），其扩展版本支持悬崖期。自己写时，重点审查“总量怎么计算”和“谁能改参数”。</p>')}
${exq([
  ['为什么释放合约要把 <code>released</code> 单独记账，而不是直接看合约余额？', '<p>余额会随着领取减少，也可能被人额外转入。用“剩余 + 已领取”还原总量，再减去已领取得到可领额度，才能保证每个时间点的解锁量只和时间有关，与领取顺序无关。</p>'],
  ['代币发行方为什么要公开“增发权限”的持有者？', '<p>谁能增发，谁就能稀释所有持有人。可以增发的合约必须说明权限归谁（最好是多签加时间锁）以及增发上限。否则发售期的“总量”承诺没有意义。</p>']
])}

${tryit(`<p><strong>动手练习：</strong>在 Sepolia 上发行并核对一枚 NFT。</p>
${steps([
  '用 <a href="#m02-4">M02.4</a> 的 Foundry 流程部署第 3 节的 <code>Badge</code> 合约，构造参数传一个以 <code>/</code> 结尾的 IPFS 地址。',
  '调用 <code>mint()</code> 并附带 0.01 测试 ETH，铸造 tokenId 0。',
  '在 Sepolia Etherscan 打开合约的 Read Contract，调用 <code>ownerOf(0)</code> 和 <code>tokenURI(0)</code>，确认所有者和元数据地址。',
  '不附带 ETH 再调用一次 <code>mint()</code>，确认交易因 <code>WrongPayment</code> 回滚。'
])}
<p>预期结果：你能说出 tokenURI 是由“基础地址 + tokenId”拼出来的，并理解元数据为什么存在链外。</p>`)}

${mistakes([
  ['NFT 的图片存在链上。', '大多数 NFT 只在链上存 tokenURI，图片和属性在链外。链外存储失效，图片就会消失。'],
  ['ERC721A 在任何情况下都比 ERC-721 便宜。', '它把成本推迟到了第一次转让。只铸 1 枚时差别很小，批次中间的 NFT 第一次转让还会更贵。'],
  ['NFT 上架后，市场合约就拥有了我的 NFT。', '不托管的市场只拿到授权，NFT 仍在你的钱包里；但授权本身就是风险，不用的市场要撤销授权。'],
  ['锁仓合约写着“锁仓”，代币就一定锁住了。', '要看合约：是否可升级、owner 能否提走、释放参数能否被修改。'],
  ['悬崖期结束后，代币才开始从 0 慢慢释放。', '悬崖期结束时，会一次性解锁“从起点到当前时间”按比例累计的部分，之后继续线性增加。']
])}
${recap([
  'ERC-721 每个 tokenId 唯一；ERC-1155 一个合约管理多种代币并支持批量转账；元数据通常在链外，用 IPFS 更持久。',
  'OpenZeppelin v5 写 NFT：限制总量、校验付款、<code>_safeMint</code> 前先更新计数，<code>_baseURI</code> 决定元数据地址。',
  'ERC721A 利用连续 tokenId，批量铸造只写常数个槽；代价是批次中间的 NFT 第一次转让更贵。',
  '不托管的 NFT 市场靠授权代转；购买函数按“删挂单 → 转 NFT → 转钱”的顺序并加重入锁。',
  '代币发行看分配和释放：超额认购按比例分配并退款；悬崖期内为 0，结束时一次性解锁累计部分，之后线性增加。'
])}
${quiz([
  { q: '一个合约要发行 100 种游戏道具，其中金币可以有很多份，宝剑每把独一无二，最合适的标准是？', o: ['ERC-20', 'ERC-721', 'ERC-1155', 'EIP-2612'], a: 2, why: 'ERC-1155 在一个合约中管理多个 id，每个 id 可以是同质（金币）或数量为 1（宝剑），还支持批量转账省 Gas。' },
  { q: 'NFTMarket 的 <code>buy</code> 函数里，为什么要先删除挂单记录，再调用 <code>safeTransferFrom</code>？', o: ['为了节省 Gas', '因为 safeTransferFrom 会回调接收方，先删除可以防止重入重复成交', '因为卖家要求先删', '为了让事件顺序正确'], a: 1, why: 'safeTransferFrom 会调用接收方的 onERC721Received。若挂单还在，接收方可在回调里再次 buy。先改状态再外部调用，就是检查-生效-交互。' },
  { q: '硬顶 100,000 USDC，实际认购 500,000 USDC。某用户认购 2,000 USDC，最终成交多少？', o: ['2,000 USDC', '500 USDC', '400 USDC', '100 USDC'], a: 2, why: '分配比例 = 100,000 ÷ 500,000 = 20%，成交 2,000 × 20% = 400 USDC，其余 1,600 USDC 退还。' },
  { q: '总量 1,200,000 枚，48 个月线性释放，悬崖期 12 个月。第 36 个月时已解锁多少？', o: ['300,000', '600,000', '900,000', '1,200,000'], a: 2, why: '悬崖期已过，按时间比例：1,200,000 × 36 ÷ 48 = 900,000。' }
])}
${checklist([
  '能说出 ERC-721 与 ERC-1155 在授权和回调上的区别。',
  '用 OpenZeppelin v5 部署过一个可铸造的 NFT，并在区块浏览器里看到 tokenURI。',
  '能解释 ERC721A 为什么批量铸造便宜、第一次转让为什么更贵。',
  '能读懂一个 NFTMarket 合约的上架、取消、购买流程，并说出重入防护的位置。',
  '能手算悬崖期加线性释放在任意月份的可领取数量。'
])}
${terms([
  ['ERC-721', 'ERC-721', '非同质化代币（NFT）标准，每个 tokenId 唯一'],
  ['ERC-1155', 'ERC-1155', '一个合约管理多种同质或非同质代币、支持批量操作的标准'],
  ['ERC721A', 'ERC721A', '利用连续 tokenId，批量铸造只写常数个存储槽的 ERC-721 实现'],
  ['悬崖期', 'Cliff', '代币释放计划中，一个都不能领取的初始时段，结束时一次性解锁已累计的部分'],
  ['线性释放', 'Linear Vesting', '解锁量随时间按比例连续增加的释放方式'],
  ['元数据', 'Metadata', '描述 NFT 名称、图片、属性的 JSON，通常存放在链外。'],
  ['不托管上架', 'Non-custodial listing', '卖家保留 NFT，只把转移权授权给市场合约的上架方式。']
])}
` });

CUR = 'm02-6';
addCh({ id: 'm02-6', nav: 'Gas 与存储优化', title: 'M02.7 Gas 与存储优化：从存储槽到 gas-report', desc: '存储槽打包、冷热访问、退款、循环陷阱，以及用 gas-report 量化优化', html: `
<h1>M02.7 Gas 与存储优化：从存储槽到 gas-report</h1>
${meta(['画出合约的存储槽布局，用变量打包减少 SSTORE 次数。', '按 EIP-2929 / EIP-3529 规则手算 SLOAD、SSTORE 的冷热成本与清零退款。', '识别无界循环 DoS，用 calldata、immutable、自定义错误、缓存等手段优化，并用 forge test --gas-report 量化对比。'], '<a href="#m02-1">M02.1 智能合约与 EVM</a>、<a href="#m02-4">M02.4 开发工具链</a>')}
${beginner(`<p><strong>存储槽（Storage Slot）</strong>：合约存储被分成很多个 32 字节的格子，编号从 0 开始。状态变量按声明顺序放进这些格子。</p>
<p><strong>SLOAD / SSTORE</strong>：读取 / 写入一个存储槽的操作码，是合约里最贵的常用指令。</p>
<p><strong>冷访问 / 热访问（Cold / Warm）</strong>：一笔交易里第一次访问某个槽叫“冷”，要额外付费；之后再访问同一个槽叫“热”，很便宜。</p>
<p><strong>区块 Gas 上限（Block Gas Limit）</strong>：一个区块里所有交易加起来最多能用的 Gas。一笔交易用的 Gas 不能超过它。</p>
<p><strong>DoS</strong>：拒绝服务（Denial of Service），让一个功能无法被正常使用。</p>`)}

<h2>1. 一句话理解</h2>
${one('Gas 优化的核心是少碰存储：能打包就打包，能缓存就缓存，能用事件就不用存储，能放进字节码（constant / immutable）就不放进存储；同时绝不为了省 Gas 牺牲安全和可读性。')}
${call('analogy', `<p>把存储想成银行保险柜，内存是你的书桌，栈是你的手。每次开保险柜都要排队（冷访问 2,100 Gas），同一天第二次开就快很多（热访问 100 Gas）。往一个空格子里放新东西最贵（20,000 Gas），像租一个新格子。</p>
<p>优化就是：一次把要用的东西从保险柜拿到书桌（缓存到内存变量），算完再一次性放回去；小物件尽量塞进同一个格子（变量打包）。</p>
<p>比喻的局限：银行柜子按天收费；EVM 的冷热状态只在<strong>一笔交易</strong>内有效，下一笔交易又从“冷”开始。</p>`)}
${art('一图看懂：存储按 32 字节一格收费，小变量挤进同一格更省', 660, 330, [
  S.text(10, 28, '布局差：3 个槽', { size: 14, b: 1, k: 'risk' }),
  S.text(350, 28, '布局好：2 个槽', { size: 14, b: 1, k: 'ok' }),
  S.text(10, 78, '槽 0', { size: 12, dim: 1 }),
  S.text(10, 138, '槽 1', { size: 12, dim: 1 }),
  S.text(10, 198, '槽 2', { size: 12, dim: 1 }),
  S.text(350, 78, '槽 0', { size: 12, dim: 1 }),
  S.text(350, 138, '槽 1', { size: 12, dim: 1 }),
  S.box(50, 54, 126, 44, { k: 'info', t: 'a · uint128', mono: 1 }),
  S.box(184, 54, 126, 44, { k: 'idle', dash: 1, t: '空 16 字节' }),
  S.box(50, 114, 260, 44, { k: 'info', t: 'b · uint256', mono: 1 }),
  S.box(50, 174, 126, 44, { k: 'info', t: 'c · uint128', mono: 1 }),
  S.box(184, 174, 126, 44, { k: 'idle', dash: 1, t: '空 16 字节' }),
  S.box(390, 54, 126, 44, { k: 'info', t: 'a · uint128', mono: 1 }),
  S.box(524, 54, 126, 44, { k: 'key', t: 'c · uint128', mono: 1 }),
  S.box(390, 114, 260, 44, { k: 'info', t: 'b · uint256', mono: 1 }),
  S.pill(50, 240, 260, 32, '3 × 22,100 = 66,300 Gas', { k: 'risk', b: 1 }),
  S.pill(390, 240, 260, 32, '2 × 22,100 = 44,200 Gas', { k: 'ok', b: 1 }),
  S.text(330, 304, '首次写入一个槽 ≈ 20,000 + 2,100 = 22,100 Gas（示例）；声明顺序一换，少用一格', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['key', '一个槽 32 字节；变量按声明顺序放入，当前槽剩余空间放得下才共用，放不下就开新槽。'],
  ['flow', '把 c 挪到 a 旁边，就和 a 共用槽 0，b 独占槽 1，总共少写一个槽。'],
  ['limit', '只有“一起读写”的变量打包才有收益；总是分开写的变量打包反而多出位运算。'],
  ['risk', '可升级合约不能改已有变量的顺序和类型，否则槽错位，数据被读错。']
], '左边布局差用 3 个槽，右边把两个 uint128 打包进同一个槽，只用 2 个槽，写入成本从 66,300 降到 44,200 Gas', 'm02-6')}

<h2>2. 存储槽布局与变量打包</h2>
<p>规则：状态变量按声明顺序依次放入 32 字节的槽；如果下一个变量在当前槽剩余空间放得下，就和前一个变量共用一个槽（低位对齐）；struct 和数组总是从新槽开始；<code>constant</code> 和 <code>immutable</code> 不占存储槽。</p>
${code('SOLIDITY', `
// 布局差：3 个槽
contract Bad {
    uint128 a;     // 槽 0（16 字节）
    uint256 b;     // 放不进槽 0 剩余的 16 字节 → 槽 1
    uint128 c;     // 槽 2
}

// 布局好：2 个槽
contract Good {
    uint128 a;     // 槽 0 低 16 字节
    uint128 c;     // 槽 0 高 16 字节（打包）
    uint256 b;     // 槽 1
}

// 常见的紧凑打包：地址 20 字节 + uint64 8 字节 + bool 1 字节 = 29 字节，一个槽
struct Position {
    address owner;      // 20
    uint64  openedAt;   // 8
    bool    active;     // 1
    uint256 size;       // 新槽
}
`)}
${mm('动态类型在存储中的位置', `
flowchart LR
  S0["槽 0：uint128 a + uint128 c"] --- S1["槽 1：uint256 b"]
  S1 --- S2["槽 2：mapping balances<br/>本槽为空，只占位"]
  S2 --- S3["槽 3：uint256[] list<br/>本槽存长度"]
  S2 -.->|"balances[k] 位于"| MK["keccak256(k ++ 2)"]
  S3 -.->|"list[i] 位于"| AK["keccak256(3) + i"]
`, [
  ['flow', 'mapping 的值散列到 keccak256(键 ++ 槽号) 的位置；动态数组的元素从 keccak256(槽号) 开始连续存放。'],
  ['key', '用 <code>forge inspect 合约名 storage-layout</code> 可以打印每个变量的槽号和偏移量。'],
  ['risk', '可升级合约（代理）新版本不能改变已有变量的顺序和类型，否则槽错位，数据被错误解读。'],
  ['limit', '打包只在“一起读写”的变量之间有收益。如果打包的两个变量总是分开写，反而多出位运算和掩码指令。']
])}
<p><strong>算一算（示例）</strong>：在一笔新交易里首次写入一个 struct 的全部字段（每个槽都从 0 变为非 0，冷访问）。</p>
${steps(['每个槽首次写入成本 = 20,000（0→非 0）+ 2,100（冷访问）= 22,100 Gas。', 'Bad 布局 3 个槽：3 × 22,100 = 66,300 Gas。', 'Good 布局 2 个槽：2 × 22,100 = 44,200 Gas。', '节省 22,100 Gas，约 33%。按 20 gwei、ETH = 3,000 美元（示例）：22,100 × 20 × 10⁻⁹ × 3,000 ≈ 1.33 美元 / 次。'])}

<p>下面的实验用真实的 keccak256 算出 mapping、嵌套 mapping 和动态数组元素的槽位，并生成对应的 <code>cast storage</code> 命令，可以对照上图验证公式。</p>
${lab('slot')}

<h2>3. SLOAD / SSTORE 的成本规则</h2>
${tbl(['操作', '冷（本交易首次访问）', '热（再次访问）', '规则来源'], [
  ['SLOAD 读槽', '2,100', '100', 'EIP-2929（2021 Berlin）'],
  ['访问外部账户（BALANCE、EXTCODESIZE、CALL 等）', '2,600', '100', 'EIP-2929'],
  ['SSTORE 0 → 非 0', '20,000 + 2,100', '20,000', 'EIP-2200 + EIP-2929'],
  ['SSTORE 非 0 → 另一个非 0', '2,900 + 2,100', '2,900', '同上'],
  ['SSTORE 写入相同值（无变化）', '100 + 2,100', '100', '同上'],
  ['SSTORE 非 0 → 0（清零）', '2,900 + 2,100，退款 4,800', '2,900，退款 4,800', 'EIP-3529（2021 London）'],
  ['TSTORE / TLOAD 瞬态存储', '100', '100', 'EIP-1153（2024 Cancun），交易结束自动清空']
])}
${call('info', '<p>EIP-3529 之后，退款总额最多为本交易 gasUsed 的 1/5。退款在交易结束时结算，不能用来“预支”执行中的 Gas。旧的 GasToken 利用退款套利的方式因此失效。</p>')}
<p><strong>算一算（示例）</strong>：一笔提款交易执行到最后，未计退款的 gasUsed = 30,000，其中把用户余额槽从非 0 清零（退款 4,800）。</p>
${steps(['退款上限 = 30,000 / 5 = 6,000。', '实际退款 = min(4,800, 6,000) = 4,800。', '最终计费 gasUsed = 30,000 − 4,800 = 25,200。', '如果同一笔交易还清零了第二个槽，退款合计 9,600，但被上限截断为 6,000，最终 24,000。'])}
${mm('一笔交易内同一个槽的冷热变化', `
stateDiagram-v2
  state "冷：未访问" as Cold
  state "热：已访问" as Warm
  state "交易结束" as Done
  [*] --> Cold
  Cold --> Warm: 首次 SLOAD 2100 或 SSTORE 加 2100
  Warm --> Warm: 再次 SLOAD 100 或 SSTORE 按值变化计费
  Warm --> Done: 交易结束
  Cold --> Done: 交易结束
  Done --> [*]
`, [
  ['flow', '每笔交易开始时，除了交易本身涉及的地址和访问列表中的槽，其余槽都是冷的。'],
  ['key', '同一笔交易里反复读同一个槽，第二次起只要 100 Gas。但把它缓存到局部变量只要约 3 Gas，仍然更省。'],
  ['limit', 'EIP-2930 访问列表（Access List）可以在交易中预先声明要访问的地址和槽，预付较低费用，但只在少数场景下划算。'],
  ['fail', '跨交易的缓存不存在：下一笔交易所有槽又是冷的。']
])}

<h2>4. 常用优化手段</h2>
${tbl(['手段', '做法', '省多少（示例量级）', '注意'], [
  ['constant / immutable', '编译期常量用 constant；构造时确定的值用 immutable', '每次读取省 2,100（冷 SLOAD）', 'immutable 不能在构造函数之外修改'],
  ['calldata 参数', '外部函数的只读数组 / 字符串用 calldata', '省去复制到内存的成本，数组越大省得越多', '需要修改参数时才用 memory'],
  ['缓存存储变量', '循环前 <code>uint256 len = arr.length;</code>，结果先累加到局部变量，最后写一次', '每次迭代省 100 以上', '缓存后要确认中途不会被外部调用修改'],
  ['自定义错误', '<code>revert Err()</code> 代替 <code>require(..., "string")</code>', '部署省字节码；回滚时省数十到数百 Gas', '—'],
  ['事件代替存储', '只给链外看的历史数据只 emit，不写存储', '32 字节数据：存储约 22,100 vs 日志约 256 + topic 费用', '合约自己读不到事件'],
  ['短路求值', '<code>cond1 && cond2</code> 把便宜或更可能为 false 的条件放前面', '跳过后面的 SLOAD 或外部调用', '保证语义不变'],
  ['变量打包', '一起读写的小变量相邻声明', '每少一个槽省一次 SSTORE / SLOAD', '见第 2 节'],
  ['瞬态存储', '同一交易内的临时标志（如重入锁）用 transient（Solidity 0.8.28+）', '重入锁从约 5,000（存储读写）降到约 300（3 次瞬态读写）', '链需支持 Cancun；L2 要确认']
])}
<h3>4.1 循环与无界数组：DoS 陷阱</h3>
${mm('无界循环如何让函数永久失效', `
flowchart TB
  A["设计：rewardAll() 遍历所有持有人发奖励"] --> B["持有人数量随时间增长"]
  B --> C["每个持有人：冷 SSTORE 约 22,100 Gas"]
  C --> D{"总 Gas > 区块 Gas 上限？"}
  D -->|"否"| OK["暂时能执行，但越来越贵"]
  D -->|"是"| DEAD["函数永远无法执行<br/>资金被锁死"]
  ATK["攻击者用大量小额地址<br/>撑大数组"] --> B
  DEAD --> FIX["修复：拉取模式 Pull<br/>每人自己 claim()"]
`, [
  ['flow', '函数的 Gas 随数组长度线性增长，而数组长度由外部用户决定。'],
  ['risk', '攻击者可以低成本添加大量条目，让关键函数（发奖、清算、提款）超过区块 Gas 上限。'],
  ['key', '推送（Push）改为拉取（Pull）：合约只记录每人应得数额，由用户自己调用 claim 领取，每次调用的 Gas 固定。'],
  ['limit', '如果必须批量处理，提供分页参数（start, count），每次只处理有限条目。']
])}
<p><strong>算一算（示例）</strong>：区块 Gas 上限按 3,000 万计算（示例值；以太坊主网在 2025 年后已多次上调，以实时区块为准），每个持有人发奖励约 25,000 Gas（冷 SSTORE + 其他指令）。</p>
${steps(['单笔交易最多处理 30,000,000 / 25,000 = 1,200 个持有人（还没扣 21,000 基础费）。', '实际上一笔交易很难吃满整个区块，按一半计算只能处理约 600 人。', '持有人超过这个数量，rewardAll 永远无法成功执行。'])}
<h3>4.2 优化前后对比（forge test --gas-report）</h3>
${code('SOLIDITY', `
// src/Rewards.sol —— 同一功能的两个版本
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract RewardsNaive {
    address public owner;                     // 存储变量：每次读取都要 SLOAD
    uint256 public rate = 5;
    uint256[] public stakes;
    uint256 public total;

    constructor() { owner = msg.sender; }

    function addStakes(uint256[] memory xs) external {    // memory：复制整个数组
        require(msg.sender == owner, "not owner");         // 字符串错误
        for (uint256 i = 0; i < xs.length; i++) stakes.push(xs[i]);
    }

    function accrue() external {
        for (uint256 i = 0; i < stakes.length; i++) {      // 每次迭代读 stakes.length
            total += stakes[i] * rate / 100;               // 每次迭代读写 total、读 rate
        }
    }
}

contract RewardsOpt {
    address public immutable owner;           // immutable：读取不访问存储
    uint256 public constant RATE = 5;         // constant：编译期写入字节码
    uint256[] public stakes;
    uint256 public total;
    error NotOwner();

    constructor() { owner = msg.sender; }

    function addStakes(uint256[] calldata xs) external {  // calldata：不复制
        if (msg.sender != owner) revert NotOwner();       // 自定义错误
        uint256 n = xs.length;
        for (uint256 i; i < n; ) {
            stakes.push(xs[i]);
            unchecked { ++i; }
        }
    }

    function accrue() external {
        uint256 n = stakes.length;            // 缓存长度：1 次 SLOAD
        uint256 acc;                          // 局部累加：栈上运算
        for (uint256 i; i < n; ) {
            acc += stakes[i] * RATE / 100;
            unchecked { ++i; }
        }
        total += acc;                         // 只写 1 次存储
    }
}
`)}
${code('BASH', `
forge test --match-contract RewardsGasTest --gas-report
# 输出是一张表：每个函数的 min / avg / median / max Gas 和调用次数
# 再配合 forge snapshot 生成 .gas-snapshot 基线，后续 PR 用 forge snapshot --diff 查看变化
`)}
<p><strong>算一算（示例，只统计存储相关指令，便于手算；真实数字以你本机的 gas-report 为准）</strong>：stakes 有 10 个元素，total 初始非 0，调用 accrue 一次。</p>
${tbl(['项目', 'Naive 版本', 'Opt 版本'], [
  ['读 stakes.length', '11 次：冷 2,100 + 10 × 热 100 = 3,100', '1 次冷：2,100'],
  ['读 stakes[i]', '10 × 冷 2,100 = 21,000', '10 × 冷 2,100 = 21,000'],
  ['读 rate', '冷 2,100 + 9 × 100 = 3,000', '0（constant）'],
  ['读 total', '冷 2,100 + 9 × 100 = 3,000', '冷 2,100'],
  ['写 total', '10 次：首次 2,900 + 后 9 次“脏槽”写 9 × 100 = 3,800', '1 次：2,900'],
  ['合计（存储部分）', '33,900', '28,100'],
  ['节省', '—', '5,800 Gas，约 17%（另有循环和溢出检查指令的节省）']
])}
${call('info', '<p>为什么 Naive 版本后 9 次写 total 只要 100？EIP-2200 规定：同一笔交易内，一个槽被修改过一次后就成为“脏槽”（dirty slot），之后再写它只按 100 计费。所以“在循环里反复写同一个存储变量”的代价比直觉小，真正的大头是每个元素的冷读。直觉常常估错，这正是要用 gas-report 实测、而不是凭感觉优化的原因。</p>')}

<h2>5. 原则：不要为省 Gas 牺牲安全</h2>
${mm('优化决策流程', `
flowchart TB
  S["想做一项 Gas 优化"] --> M{"gas-report 显示这是热点？"}
  M -->|"否"| NO["不做：收益太小"]
  M -->|"是"| SAFE{"会去掉检查或增加复杂度？<br/>unchecked、内联汇编、跳过校验"}
  SAFE -->|"否"| DO["做：写测试证明行为不变"]
  SAFE -->|"是"| PROOF{"能用测试 + 不变量 + 审计证明安全？"}
  PROOF -->|"否"| NO
  PROOF -->|"是"| DO2["谨慎做：注释写清假设<br/>纳入审计范围"]
  DO --> SNAP["forge snapshot 记录基线"]
  DO2 --> SNAP
`, [
  ['flow', '先测量，再优化；优化后用快照防止回退。'],
  ['risk', '内联汇编（assembly）绕过类型检查和溢出检查，是审计中高危问题的高发区。'],
  ['key', '用户为一次调用多付 2,000 Gas 约等于几美分（示例）；一个漏洞的损失可能是全部资金。'],
  ['limit', 'L2 上执行 Gas 便宜，主要成本是 L1 数据费（calldata / blob），优化重点应转向压缩输入数据。']
])}
<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['没有随用户数增长的循环', '防止区块 Gas 上限 DoS', '代码审查 + 用大数组做压力测试'],
  ['一起读写的状态变量已打包', '减少 SSTORE / SLOAD', '<code>forge inspect 合约名 storage-layout</code>'],
  ['常量用 constant / immutable', '避免无意义的 SLOAD', 'Slither 的 constable-states / immutable-states 检测'],
  ['错误使用自定义错误', '降低部署和回滚成本', '搜索代码中 require 带字符串的地方'],
  ['gas-report 与 snapshot 纳入 CI', '量化优化效果、防止回退', 'CI 运行 <code>forge snapshot --check</code>'],
  ['所有 unchecked / assembly 都有注释和测试', '确保优化没有破坏安全', '审计清单逐项确认']
])}
${tryit(`<p><strong>亲手测一次 Gas 差异</strong></p>
<ol><li>在 <a href="#m02-4">M02.4</a> 创建的 Foundry 项目里新建 <code>src/Rewards.sol</code>，粘贴上面两个合约。</li>
<li>新建 <code>test/RewardsGas.t.sol</code>：在 setUp 中部署两个合约，各自 addStakes 一个长度 10 的数组；写 <code>test_Naive()</code> 和 <code>test_Opt()</code> 分别调用 accrue。</li>
<li>运行 <code>forge test --match-contract RewardsGasTest --gas-report</code>，对比两个合约 accrue 的 avg 列。</li>
<li>把数组长度改为 100，再运行一次。预期：Opt 版本仍然更省，差距随长度增大；记录你实测的数字，并与第 4.2 节的手算表对比，解释差异来源（脏槽写入、循环指令开销）。</li></ol>`)}

${mistakes([
  ['uint8 一定比 uint256 省 Gas。', 'EVM 字长 32 字节。单独的小类型变量需要额外的掩码指令，反而更贵；只有在存储中打包时才省。'],
  ['所有 Gas 优化都值得做。', '先用 gas-report 找热点。为省几十 Gas 引入 unchecked 或汇编，增加的审计风险远大于收益。'],
  ['view 函数里写循环没关系，反正免费。', '链外调用免费，但 RPC 节点对 eth_call 也有 Gas 上限；被其他合约在交易中调用时照常计费。'],
  ['清零存储能赚回大量 Gas。', '清零退款 4,800，且退款不超过 gasUsed 的 1/5。它不能让交易变成负成本。'],
  ['同一笔交易里多读几次存储无所谓。', '热读也要 100 Gas；在循环中累计起来很可观。缓存到局部变量只要约 3 Gas。']
])}
${recap([
  '状态变量按声明顺序放入 32 字节槽，小变量相邻可打包；constant / immutable 不占槽。',
  'EIP-2929：冷 SLOAD 2,100、热 100；SSTORE 0→非 0 为 20,000，非 0→非 0 为 2,900，冷访问再加 2,100。',
  'EIP-3529：清零退款 4,800，退款上限为 gasUsed 的 1/5。',
  '无界循环会让函数超过区块 Gas 上限而永久失效；用拉取模式或分页。',
  '常用手段：calldata、缓存存储变量、自定义错误、事件代替存储、短路求值、瞬态存储。',
  '先测量（gas-report / snapshot）再优化；不为省 Gas 牺牲安全和可读性。'
])}
${quiz([
  { q: '下面哪个声明顺序占用的存储槽最少？', o: ['uint128 a; uint256 b; uint128 c;', 'uint128 a; uint128 c; uint256 b;', 'uint256 b; uint128 a; bool x; uint128 c;', 'bool x; uint256 b; bool y;'], a: 1, why: 'B：a 和 c 共用槽 0，b 占槽 1，共 2 个槽。A 需要 3 个；C 中 a 和 x 共用一个槽，c 放不下要新槽，共 3 个；D 中两个 bool 被 uint256 隔开，共 3 个。' },
  { q: '一笔交易中第一次把一个值为 0 的存储槽写成 5，成本约是？', o: ['2,900', '100', '22,100', '4,800'], a: 2, why: '0→非 0 为 20,000，加上首次访问的冷访问费 2,100，共 22,100。2,900 是非 0→非 0；4,800 是清零退款。' },
  { q: '一个合约在 distribute() 中遍历所有用户发放奖励，用户可以自由注册。最主要的风险是？', o: ['用户数增长后函数超过区块 Gas 上限，永久无法执行', '奖励计算精度丢失', '事件太多导致日志溢出', 'Solidity 不支持循环'], a: 0, why: '无界循环的 Gas 随用户数线性增长，攻击者还可以注册大量地址加速这一过程。应改为用户自己 claim 的拉取模式。' },
  { q: '交易未计退款时 gasUsed = 40,000，清零了 3 个槽（每个退款 4,800）。最终计费 gasUsed 是？', o: ['25,600', '35,200', '40,000', '32,000'], a: 3, why: '退款总额 14,400，但上限是 40,000 / 5 = 8,000，所以最终 40,000 − 8,000 = 32,000。' }
])}
${exercises([["计算题：struct 字段顺序为 address owner、uint64 openedAt、bool active、uint256 size。有人把它改成 address owner、uint256 size、uint64 openedAt、bool active。在新交易里首次写入全部字段（每个槽都从 0 变为非 0），两种顺序各要多少 Gas？（示例）", "<p>原顺序：owner、openedAt、active 共 29 字节，打包进一个槽；size 占一个槽。共 2 个槽，2 × 22,100 = 44,200 Gas。</p><p>新顺序：owner 占槽 0，size 放不进剩余 12 字节，占槽 1；openedAt 和 active 占槽 2。共 3 个槽，3 × 22,100 = 66,300 Gas。</p><p>改顺序后每次多花 22,100 Gas。</p>"], ["计算题：一笔交易未计退款的 gasUsed 为 50,000（示例），其中清零了 2 个存储槽。最终计费 gasUsed 是多少？", "<p>退款合计 2 × 4,800 = 9,600。</p><p>退款上限为 gasUsed 的 1/5：50,000 / 5 = 10,000。9,600 没有超过上限，全额退还。</p><p>最终计费 50,000 − 9,600 = 40,400。</p>"], ["设计题：合约里的 rewardAll() 遍历所有持有人发奖励。把它改成拉取模式，写出主要的状态变量和函数。", "<p>状态变量：<code>mapping(address => uint256) owed</code>，只记录每人应得数额。发奖逻辑只更新 owed，不转账。</p><p>新增 <code>claim()</code>：读出 <code>owed[msg.sender]</code>，先清零，再转账。每次调用只处理一个人，Gas 固定，不再随持有人数增长。如果必须批量处理，就加分页参数 (start, count)。</p>"]])}
${checklist(["能用 forge inspect 合约名 storage-layout 读出变量槽号，并调整声明顺序减少槽数。", "能按 EIP-2929 和 EIP-3529 手算一笔交易中 SLOAD、SSTORE 的 Gas 和清零退款上限。", "能识别 Gas 随用户数增长的循环，并改写成拉取模式或分页处理。", "能用 forge test --gas-report 对比同一函数优化前后的 Gas，并用 forge snapshot 记录基线。"])}
${terms([
  ['存储槽', 'Storage Slot', '合约存储中 32 字节的单元，从 0 开始编号'],
  ['变量打包', 'Variable Packing', '把多个小于 32 字节的相邻变量放进同一个存储槽'],
  ['冷 / 热访问', 'Cold / Warm Access', '一笔交易内首次 / 再次访问某个地址或存储槽，计费不同（EIP-2929）'],
  ['Gas 退款', 'Gas Refund', '清零存储槽时返还的 Gas，上限为 gasUsed 的 1/5（EIP-3529）'],
  ['瞬态存储', 'Transient Storage', '只在一笔交易内有效、交易结束自动清空的存储（EIP-1153）'],
  ['区块 Gas 上限', 'Block Gas Limit', '一个区块中所有交易可消耗 Gas 的总上限'],
  ['拉取模式', 'Pull Pattern', '由用户自己领取应得资金，而不是合约批量推送'],
  ['Gas 报告', 'Gas Report', 'forge test --gas-report 输出的每个函数 Gas 统计表']
])}
` });
})();
