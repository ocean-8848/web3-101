/* ---------- M02 智能合约（4）：m02-66 可升级合约与代理架构 ---------- */
(() => {
CUR = 'm02-66';
addCh({ id: 'm02-66', nav: '可升级合约与代理架构', title: 'M02.11 可升级合约与代理架构：Transparent、UUPS、Diamond 与 ERC-7201', desc: 'delegatecall、四种代理模式对比、存储槽冲突与 ERC-7201、CREATE2 与 EIP-1167、Permit2 架构', html: `
<h1>M02.11 可升级合约与代理架构：Transparent、UUPS、Diamond 与 ERC-7201</h1>
${meta([
  '用 delegatecall 上下文规则解释“数据留在代理、代码在逻辑合约”的执行机制。',
  '对比 Transparent、UUPS、Beacon 与 Diamond 四种代理模式的调用链、Gas 成本与适用场景。',
  '定位升级引起的存储槽冲突，并用 EIP-1967 固定槽位与 ERC-7201 命名空间彻底隔离存储。',
  '计算 CREATE2 确定性地址与 EIP-1167 最小代理的部署成本，落地生产级合约升级安全清单。'
], '前置：<a href="#m02-1">M02.1 智能合约与 EVM</a>、<a href="#m02-6">M02.7 Gas 与存储优化</a>、<a href="#m02-8">M02.9 合约安全 II</a>', ['proxy'])}
${beginner(`<p><strong>不可变性（Immutability）</strong>：合约字节码一旦部署到以太坊地址就无法直接改写。所谓“升级”，本质是保留对外地址和数据，把内部指向的代码地址换成一个新部署的合约。</p>
<p><strong>代理合约（Proxy）</strong>：用户始终交互的固定地址，里面存着所有余额和状态变量，但不写具体业务逻辑。</p>
<p><strong>实现合约（Implementation）</strong>：只存放业务逻辑代码的合约，升级时只需部署一份新实现并修改代理里的指针。</p>
<p><strong>delegatecall</strong>：EVM 的一种特殊调用指令——借用另一个合约的代码，但在<strong>当前代理合约的存储和上下文</strong>里执行。</p>`)}

<h2>1. 一句话理解</h2>
${one('可升级合约不是修改链上旧字节码，而是把“存数据的壳（Proxy）”和“写逻辑的脑（Implementation）”拆开：用户永远调用 Proxy，Proxy 通过 delegatecall 借用 Implementation 的代码读写自己的存储槽；升级只需把 Proxy 里的实现地址指向新部署的合约。')}
${call('analogy', `<p>代理模式就像餐厅的“前台招牌 + 厨师外包”：顾客（用户）永远只认门口的招牌和账本（Proxy 地址与存储），后厨做菜的流程由聘请的厨师团队（Implementation）执行。换菜单时不用拆店重开，只要把后厨换成新厨师团队即可。</p>
<p>比喻的局限：如果新厨师把 1 号货架当成盐、把 2 号货架当成糖，而老账本里 1 号货架原本放的是糖，整桌菜就会当场翻车——这就是以太坊升级里最致命的“存储槽冲突”。</p>`)}
${art('一图看懂：delegatecall 让“代码在新合约，数据留在代理”', 660, 320, [
  S.zone(15, 20, 630, 240, { t: '一次代理调用的上下文边界', k: 'tint' }),
  S.box(30, 95, 130, 86, { k: 'info', icon: 'person', t: '用户 / DApp', s: '永远调用固定\nProxy 地址' }),
  S.box(215, 52, 185, 176, { k: 'key', icon: 'db', t: 'Proxy 代理合约', s: '保存全部状态槽：\nSlot 0: balance\nSlot 1: owner\nEIP-1967: implAddr', tag: '数据在此' }),
  S.box(460, 52, 170, 76, { k: 'ok', icon: 'code', t: 'Impl V1（旧）', s: '只提供字节码\n自身存储为空' }),
  S.box(460, 152, 170, 76, { k: 'warn', icon: 'code', t: 'Impl V2（新）', s: '升级后指向 V2\n必须兼容旧槽位' }),
  S.arrow(162, 138, 213, 138),
  S.arrow(402, 95, 458, 95, { k: 'plain', dash: 1 }),
  S.arrow(402, 188, 458, 188, { k: 'warn' }),
  S.text(330, 294, 'delegatecall 保留 msg.sender 与 msg.value，读写全部落在 Proxy 的存储槽', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['flow', '用户调用 Proxy 的 fallback()，Proxy 用 delegatecall 把 calldata 原样转发给当前指向的实现合约。'],
  ['key', '实现合约本身的存储一直是空的；真正改变的是 Proxy 合约上的 Slot 0、Slot 1 等状态。'],
  ['risk', '若 Proxy 与 Implementation 共用普通 Slot 0，或 V2 打乱了 V1 的变量顺序，就会把地址读成数字或覆盖管理员权限。'],
  ['limit', '实现合约里的 constructor 只在部署瞬间跑在实现合约自己的存储里，不会写入 Proxy；必须改用 initialize()。']
], '用户调用 Proxy 合约，Proxy 通过 delegatecall 借用 V1 或 V2 实现合约的代码，但全部状态读写都留在 Proxy 自身存储槽中', 'm02-66')}

<h2>2. 四种主流代理架构对比</h2>
<p>同样基于 <code>delegatecall</code>，工程上围绕“谁有权升级、升级逻辑放哪、能否多实例共享、合约超过 24 KB 怎么办”演化出四种标准模式：</p>
${tbl(['代理模式', '升级入口位置', '多实例批量升级', '适用场景', '主要缺点与注意'], [
  ['<strong>Transparent Proxy</strong>（EIP-1967）', '在 Proxy 内部（由独立 ProxyAdmin 合约调用）', '否（逐个升级）', '权限隔离严格、传统 DeFi 协议', '每次调用需检查调用者是否为 admin，略增 Gas；需额外部署 ProxyAdmin'],
  ['<strong>UUPS</strong>（EIP-1822）', '在 Implementation 内部（继承 UUPSUpgradeable）', '否（逐个升级）', '当前 OpenZeppelin 官方首选，部署便宜、调用省 Gas', '如果新版本忘了包含升级逻辑或误删权限，合约将永久锁死无法再升级'],
  ['<strong>Beacon Proxy</strong>', '集中存放在一个 Beacon 合约里', '是（改一次 Beacon，成千上万个代理同时升级）', '工厂模式批量生成的金库、池子、NFT 代理', '每次调用多一次对 Beacon 的 staticcall 查实现地址，略增执行 Gas'],
  ['<strong>Diamond</strong>（EIP-2535）', '通过 diamondCut() 按函数选择器路由到多个 Facet', '按模块热插拔', '超大型协议（突破 EVM 24,576 字节合约大小上限）', '复杂度高，存储隔离与审计难度显著上升，中小协议不建议盲用']
])}
${mm('UUPS 与 Beacon Proxy 调用路径对比', `
flowchart LR
  U["用户调用"] --> P1["UUPS Proxy<br/>直接读 EIP-1967 槽"]
  P1 -->|"delegatecall"| I1["Impl 合约<br/>含 upgradeToAndCall"]
  U2["用户调用"] --> P2["Beacon Proxy"]
  P2 -->|"staticcall 查地址"| B["UpgradeableBeacon"]
  B -->|"返回 impl 地址"| P2
  P2 -->|"delegatecall"| I2["共享 Impl 合约"]
`, [
  ['flow', 'UUPS 只需一次存储读取即可跳转；Beacon Proxy 每次都要先问 Beacon 当前实现地址在哪。'],
  ['key', '如果你要用工厂部署 1,000 个用户金库并希望未来一键修复漏洞，选 Beacon Proxy；单体核心协议优先 UUPS。'],
  ['risk', 'UUPS 的实现合约必须在构造函数中调用 _disableInitializers()，否则攻击者可能直接初始化实现合约并尝试破坏。']
])}

<h2>3. 存储槽冲突、EIP-1967 与 ERC-7201 命名空间</h2>
<p>EVM 不保存变量名，只认 32 字节的槽位编号（详见 <a href="#m02-6">M02.7 Gas 与存储优化</a>）。代理升级时有两类经典冲突：</p>
<ul>
<li><strong>代理与实现冲突</strong>：如果 Proxy 把 <code>address implementation</code> 存在 Slot 0，而实现合约把 <code>address owner</code> 也存在 Slot 0，用户一调 <code>setOwner</code> 就把实现地址改写了。<strong>解法（EIP-1967）</strong>：把代理自身的元数据放到伪随机哈希槽位，例如实现地址固定存于 <code>bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)</code>，与顺序变量永不碰撞。</li>
<li><strong>V1 与 V2 布局冲突</strong>：V2 在 V1 原有变量中间插入新字段、改变变量类型宽度，或更改多继承父合约顺序，都会导致后面所有变量整体错位。</li>
</ul>
<h3>3.1 从 __gap 到 ERC-7201 命名空间存储</h3>
<p>早期 OpenZeppelin 用 <code>uint256[50] private __gap;</code> 预留空槽，但多继承和 Diamond 模块化下极易算错数量。<strong>ERC-7201（Namespaced Storage Layout）</strong>成为现代标准：把每个模块的状态打包成一个 <code>struct</code>，通过自定义命名空间字符串哈希定位到独立槽位，彻底与 Slot 0 脱钩。</p>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VaultV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:storage-location erc7201:myprotocol.storage.Vault
    struct VaultStorage {
        uint256 totalAssets;
        uint256 feeBps;
        mapping(address => uint256) balances;
    }

    // keccak256(abi.encode(uint256(keccak256("myprotocol.storage.Vault")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant VAULT_STORAGE_LOCATION =
        0x7a4e6c9f9e1d2f1c3d8b4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f00; // 示例常量，上线前用工具精确计算

    function _getVaultStorage() private pure returns (VaultStorage storage $) {
        assembly {
            $.slot := VAULT_STORAGE_LOCATION
        }
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // 锁定实现合约自身，防止被直接 initialize
    }

    function initialize(address initialOwner, uint256 feeBps_) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        _getVaultStorage().feeBps = feeBps_;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
`)}
<p>下面打开交互实验，亲手切换四种升级方式，观察 Slot 0–3 的十六进制内容如何错位或安全隔离。</p>
${lab('proxy')}

<h2>4. CREATE2、最小代理（EIP-1167）与 Permit2 基础设施</h2>
<p>除了“可升级”，生产合约工程还有三类高频底层模式，经常和代理配合出现：</p>
<ul>
<li><strong>CREATE2 确定性部署</strong>：普通 <code>CREATE</code> 的合约地址由 <code>(部署者地址, nonce)</code> 决定，多链部署很难拿到相同地址。<code>CREATE2</code> 使用 <code>keccak256(0xff ++ deployer ++ salt ++ keccak256(init_code))[12:]</code>，让你在合约还没上链前就能提前算出反事实地址（Counterfactual Address），广泛用于多链同址部署与智能合约钱包（见 <a href="#m06-5">M08.8 账户抽象深入</a>）。</li>
<li><strong>EIP-1167 最小代理（Minimal Proxy / Clone）</strong>：如果工厂合约要给每个交易对或用户部署一份逻辑完全相同的不可升级副本，每次完整部署 10 KB 字节码极贵。EIP-1167 只部署一段 <strong>45 字节</strong>的极简转发字节码，硬编码把全部调用 <code>delegatecall</code> 给单一模板实现。</li>
<li><strong>Permit2 统一授权</strong>：传统 ERC-20 要给每个新协议单独发一笔 <code>approve</code> 交易，而且旧代币（如 USDT）不支持 EIP-2612。Uniswap 开源的 <strong>Permit2</strong> 部署在多链相同地址上：用户只需对 Permit2 授权一次，此后任意协议都通过带过期时间的签名按需划扣，既兼容旧代币又支持批量撤销（详见 <a href="#m02-5">M02.5 ERC-20 与授权</a>）。</li>
</ul>
${call('deep', `<p><strong>算一算：工厂部署 500 个金库的 Gas 对比（示例）</strong><br/>
假设单个完整金库合约部署需 1,500,000 Gas；使用 EIP-1167 Clone 只需部署 1 次模板（1,500,000 Gas）+ 500 次最小代理（每次约 45,000 Gas）。<br/>
• 直接部署 500 次：500 × 1,500,000 = <strong>750,000,000 Gas</strong>。<br/>
• EIP-1167 Clone：1,500,000 + 500 × 45,000 = <strong>24,000,000 Gas</strong>，节省约 <strong>96.8%</strong> 的部署成本。<br/>
代价：每次调用 Clone 会多花一次 <code>DELEGATECALL</code> 转发开销（EIP-2929 之后，访问模板地址热访问约 100 Gas、冷访问约 2,600 Gas，另加复制 calldata 和返回数据的少量开销）。</p>`)}

<h2>5. 生产环境升级清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['实现合约构造函数调用 <code>_disableInitializers()</code>', '防止攻击者直接初始化裸实现合约并接管权限', 'Foundry 测试直接对 impl 地址调 initialize() 必须 revert'],
  ['CI 接入存储布局兼容性检查', '人工肉眼核对极易漏看继承顺序或打包槽位变化', '运行 <code>forge inspect Contract storage-layout</code> 或 OpenZeppelin Upgrades 插件自动比对 V1/V2'],
  ['升级权限交给「多签 + 时间锁」', '单私钥升级等同于中心化后门，一旦泄露协议归零', '检查 owner / ProxyAdmin 是否为 TimelockController，且 proposer 为 Safe 多签（见 <a href="#m03-4">M08.4 多签钱包</a>）'],
  ['升级后状态冒烟与 Fork 回归测试', '验证旧用户余额、授权、未结算仓位在 V2 下读数完全一致', '在主网 Fork 上模拟执行 upgradeToAndCall 后重跑全套不变量测试'],
  ['新版本保留升级能力（UUPS）', 'UUPS 误删升级入口会导致永久不可升级', '升级前在 Fork 环境验证 V2 仍能继续升级到哑合约 V3']
])}

${exercises([
  ['如果把一个已上线的 ERC-20 合约的 <code>uint8 decimals</code> 直接改为 <code>uint256 decimals</code>，且它原本和 <code>address owner</code> 打包在同一个 Slot 0 里，升级后会发生什么？', '<p><code>uint256</code> 会独占整个 Slot 0，原本跟在后面的变量全部顺延到下一个槽位。结果 V2 读取 Slot 0 时会把旧的 owner 地址高位字节一起当成 decimals 读出天文数字，而后续变量的读取全部错位。</p>'],
  ['为什么说「能升级的合约」在安全模型上引入了新的信任假设？工程上如何降低用户对“项目方作恶升级”的担忧？', '<p>因为管理员可以把逻辑替换成转走全部资金的恶意合约。工程上常用三道防线：① 升级权限放入多签（如 3/5 或 4/7）+ 48 小时以上 Timelock，给用户逃生窗口；② 配合链上监控在队列提案进入 Timelock 瞬间自动告警；③ 核心模块稳定后永久放弃升级权（renounceOwnership）或仅允许不可变部署。</p>']
])}
${checklist([
  '能手画出 Proxy 与 Implementation 之间 delegatecall 的上下文与存储流向。',
  '能根据业务形态在 Transparent、UUPS、Beacon、Diamond 与 EIP-1167 Clone 之间做出选型。',
  '能用 ERC-7201 写出命名空间存储结构，并说出 EIP-1967 解决的问题。',
  '能在 Foundry 中导出 storage-layout 并验证 V1→V2 升级无槽位冲突。'
])}
${mistakes([
  ['实现合约里的 constructor 会初始化代理合约的状态', 'constructor 字节码只在部署实现合约时执行一次，写入的是实现合约自身存储，Proxy 读不到。必须使用 initializer 修饰的 initialize() 函数。'],
  ['只要不删旧变量，在结构体或合约里随便加新变量都安全', '在旧变量中间插入、改变类型宽度、或把 struct 放进非末尾的数组中再扩展字段，都会导致槽位错位。只有末尾追加或使用独立 ERC-7201 命名空间才安全。'],
  ['EIP-1167 最小代理也能随时升级逻辑', '标准 EIP-1167 字节码把实现地址写死在字节码里，创建后不可升级。需要批量可升级应使用 Beacon Proxy。'],
  ['Diamond 模式是最先进的，所有项目都该用', 'Diamond 显著增加存储管理、区块浏览器验证与安全审计的复杂度；绝大多数未超 24 KB 限制的协议应优先选 UUPS。']
])}
${recap([
  '代理模式通过 delegatecall 将“持久存储（Proxy）”与“可替换逻辑（Implementation）”解耦。',
  '单体协议首选 UUPS，多实例统一升级选 Beacon，超大型协议才考虑 Diamond，大量不可升级副本选 EIP-1167 Clone。',
  'EIP-1967 解决代理与实现的槽位碰撞；ERC-7201 用命名空间哈希槽位解决多版本、多继承的存储布局冲突。',
  'CREATE2 实现多链同址与反事实地址预计算；Permit2 用统一授权合约优化旧代币与多协议交互体验。',
  '生产升级必须具备三件套：_disableInitializers()、CI 存储布局自动比对、多签加时间锁治理。'
])}
${quiz([
  { q: '用户 Alice 调用 Proxy，Proxy 通过 delegatecall 调用 Impl 中的 transfer 函数。在 Impl 执行时，msg.sender 和被修改的存储分别属于谁？', o: ['msg.sender 是 Proxy，存储属于 Impl', 'msg.sender 是 Alice，存储属于 Proxy', 'msg.sender 是 Alice，存储属于 Impl', 'msg.sender 是 Proxy，存储属于 Proxy'], a: 1, why: 'delegatecall 保持外部调用者（Alice）和 msg.value 不变，借用 Impl 的代码，但所有 SLOAD/SSTORE 操作都落在 Proxy 的存储空间。' },
  { q: '为什么 OpenZeppelin 要求 UUPS 实现合约在 constructor 里调用 _disableInitializers()？', o: ['为了节省每次交易的 Gas', '防止攻击者直接调用实现合约的 initialize() 接管实现合约自身权限', 'Solidity 编译器强制语法要求', '为了让 Proxy 自动继承 constructor 里的变量'], a: 1, why: '未锁定的实现合约可能被外部抢先初始化，若合约含自毁或 delegatecall 危险路径，会威胁整个代理体系安全。' },
  { q: '一个协议要通过工厂为 2,000 个用户各自部署一个金库，并希望未来只需发一笔交易就能让 2,000 个金库全部升级到 V2。应选哪种架构？', o: ['EIP-1167 Minimal Proxy', 'Transparent Proxy', 'Beacon Proxy', '普通 CREATE2 部署'], a: 2, why: 'Beacon Proxy 的所有代理实例都从同一个 Beacon 合约读取实现地址，更新 Beacon 一次即可批量升级全部实例。EIP-1167 不可升级。' },
  { q: '关于 ERC-7201 命名空间存储，下列哪项说法正确？', o: ['它把变量按声明顺序紧挨着排在 Slot 0 之后', '它通过命名空间字符串哈希定位独立结构体槽位，降低升级与多继承时的槽位冲突风险', '它只能用在 Diamond 模式中，不能用于 UUPS', '它能消除代理调用的 delegatecall 开销'], a: 1, why: 'ERC-7201 将模块状态封装为 struct 并映射到由命名空间派生的伪随机槽位，与 UUPS、Transparent、Diamond 都兼容。' }
])}
${terms([
  ['delegatecall', 'Delegate Call', 'EVM 调用指令：执行目标地址的代码，但沿用当前合约的存储、余额与 msg.sender。'],
  ['透明代理', 'Transparent Proxy', '在代理合约内部按调用者身份分流“管理升级”与“业务转发”的代理模式。'],
  ['UUPS', 'Universal Upgradeable Proxy Standard', 'EIP-1822 定义的代理模式，将升级逻辑放在实现合约内以降低代理体积与调用 Gas。'],
  ['信标代理', 'Beacon Proxy', '多个代理实例共享同一个 Beacon 合约指向的实现地址，支持一键批量升级。'],
  ['存储槽冲突', 'Storage Collision', '代理与实现或新旧版本合约对同一存储槽赋予不同含义，导致状态数据错乱或被覆盖。'],
  ['ERC-7201', 'Namespaced Storage Layout', '通过命名空间哈希为结构体分配独立起始槽位的标准，用于安全隔离可升级合约存储。'],
  ['最小代理', 'EIP-1167 Minimal Proxy (Clone)', '仅 45 字节的不可升级转发字节码，用于极低 Gas 批量复制同逻辑合约。'],
  ['CREATE2', 'Deterministic Deployment', '按 deployer、salt 和 init_code 哈希确定合约地址的部署指令，支持部署前预计算地址。']
])}
` });
})();
