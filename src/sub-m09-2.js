/* ---------- M11 Web3 应用赛道（2）：m09-4 RWA 与支付 · m09-5 GameFi · m09-6 ★ 实战 ---------- */
(() => {
CUR = 'm09-4';
addCh({ id: 'm09-4', nav: 'RWA 与链上支付', title: 'M11.4 RWA 与链上支付：代币化国债、许可型代币与稳定币收款', desc: '现实资产怎样变成链上代币，谁能持有；商户怎样用稳定币收款和跨境结算', html: `
<h1>M11.4 RWA 与链上支付：代币化国债、许可型代币与稳定币收款</h1>
${meta(['画出一只代币化国债基金从链下资产、SPV / 基金、过户代理到链上代币的四层结构，并说清代币持有人真正拥有的是什么。', '说清 ERC-3643 的身份登记、合规模块和强制转账，写出一个带白名单检查的转账钩子，并用 NAV / 储备金预言机约束铸造。', '设计一条稳定币商户收款链路：发票、EIP-3009 签名授权、代付 Gas、到账确认，并比较跨境结算和出入金的成本结构。'], '前置：<a href="#m02-9">M06.1 稳定币</a>、<a href="#m02-5">M02.5 ERC-20 与授权</a>、<a href="#m09-1">M11.1 链上身份</a>')}
${beginner(`<p><strong>RWA（现实世界资产，Real-World Assets）</strong>：在链下真实存在的资产，例如美国国债、货币基金份额、贷款、房产、黄金。把它们的所有权或收益权记成链上代币，叫<strong>代币化（Tokenization）</strong>。</p>
<p><strong>SPV（特殊目的载体，Special Purpose Vehicle）</strong>：为了持有一类资产而专门设立的公司或信托。它和发起机构在法律上隔离，发起机构破产时，SPV 里的资产不被拿去还债。</p>
<p><strong>NAV（资产净值，Net Asset Value）</strong>：基金总资产减去负债，再除以份额数，得到每一份值多少钱。</p>
<p><strong>过户代理（Transfer Agent）</strong>：替基金或证券发行人维护“谁持有多少份”这本官方名册的机构。</p>
<p><strong>许可型代币（Permissioned Token）</strong>：只有通过身份审核、在白名单里的地址才能持有和接收的代币。</p>
<p><strong>出入金（On-ramp / Off-ramp）</strong>：把银行里的法币换成链上稳定币叫入金，反过来叫出金。</p>`)}

<h2>1. 一句话理解</h2>
${one('RWA 代币是一张“链上凭证”：资产本身仍在银行、托管行和法律合同里，代币只记录谁拥有对它的权利，所以它必须带上身份白名单、转账规则和价格预言机；链上支付则把稳定币当作结算工具，商户签一张发票，用户签一条授权，几秒内完成跨境到账。')}
${call('analogy', `<p>RWA 代币像仓库开出的<strong>提货单</strong>：货在仓库里，提货单可以在人与人之间转手。仓库只认登记过的客户；提货单丢了，仓库可以作废旧单、补开新单；仓库每天公布库存，证明单子背后有货。</p>
<p>比喻的局限：提货单通常认“单”不认“人”，而许可型代币反过来，<strong>先认人再认单</strong>。没有通过审核的地址，即使拿到私钥签了转账，合约也会拒绝。</p>`)}
${art('一图看懂：RWA 代币是链上提货单，货和名册在链下', 660, 336, [
  S.zone(10, 28, 290, 262, { t: '链下：资产和法律名册', k: 'warn' }),
  S.zone(360, 28, 290, 262, { t: '链上：代币和规则', k: 'info' }),
  S.box(24, 58, 262, 52, { k: 'idle', icon: 'bank', t: '真正的资产', s: '托管行里的美国国债' }),
  S.box(24, 138, 262, 76, { k: 'ok', icon: 'doc', t: '过户代理的份额名册', s: '法律上谁持有，以它为准\n对不上链上余额也一样' }),
  S.box(24, 232, 262, 44, { k: 'idle', dash: 1, icon: 'person', t: '投资者 KYC / AML 审核', s: '' }),
  S.box(374, 58, 262, 52, { k: 'info', icon: 'chart', t: '预言机报 NAV', s: '净值由管理人在链下算' }),
  S.box(374, 138, 262, 76, { k: 'key', icon: 'coin', t: '链上代币（提货单）', s: '每次转账先查白名单\n发行方可冻结、强制转账' }),
  S.box(374, 232, 262, 44, { k: 'ok', icon: 'shield', t: '白名单：未审核地址转不了', s: '' }),
  S.arrow(112, 112, 112, 136, { k: 'plain' }),
  S.arrow(288, 176, 372, 176, { k: 'plain', both: 1 }),
  S.text(330, 166, '余额 ＝ 名册', { size: 11.5, anchor: 'middle', dim: 1 }),
  S.arrow(505, 112, 505, 136, { k: 'info', dash: 1 }),
  S.text(330, 322, '代币 ＝ 对基金份额的权利：先认人，再认单', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '资金进基金买国债，过户代理在名册登记份额，同时给通过审核的地址铸造代币。'],
  ['key', '法律效力来自基金合同和名册，不来自智能合约本身。'],
  ['risk', '托管行、过户代理、发行方任一环节出问题，代币都会受影响，链上透明消除不了链下风险。'],
  ['limit', '没过审核的地址即使有私钥也转不了；赎回通常只对白名单机构开放。']
], '左侧链下有国债资产、过户代理名册和投资者审核；右侧链上有代币、白名单和预言机净值；名册余额与链上代币余额对应。', 'm09-4')}

<h2>2. RWA 全景：哪些资产在上链，规模多大</h2>
<p>上链的现实资产主要有五类：<strong>美国国债与货币基金</strong>（BUIDL、BENJI、USDY）、<strong>私募信贷</strong>（Maple、Centrifuge 等平台上的贷款池，风险在借款人违约和链下催收）、<strong>房地产</strong>（SPV 股权，流动性最差）、<strong>大宗商品</strong>（金库黄金的提取权）和<strong>代币化股票 / 基金</strong>（受证券法限制最多）。</p>
<p>截至 2026-11-22，rwa.xyz 统计的链上 RWA（不含稳定币）中，能在钱包之间转移的“distributed”资产约 409 亿美元，只在链上登记、不能自由转移的“represented”资产约 4,514 亿美元，持有地址约 587 万个${cite('rwa.xyz：RWA 总览（2026-11-22）', 'https://app.rwa.xyz/')}。其中代币化美国国债约 141 亿美元、123 个产品；单个产品中，Ondo USDY 约 23.7 亿美元，BlackRock BUIDL 约 15.5 亿美元，Franklin BENJI 约 13.9 亿美元${cite('rwa.xyz：代币化美国国债（2026-11-22）', 'https://app.rwa.xyz/treasuries')}。代币化信贷的 distributed 部分约 82 亿美元${cite('rwa.xyz：代币化信贷（2026-11-22）', 'https://app.rwa.xyz/private-credit')}。同一天，稳定币总量约 2,732 亿美元，是 RWA 的六倍多。这些数字每天变化，引用时请写日期。</p>
${call('info', '<p>“represented”的规模大，不代表链上有那么多可交易资产。大部分是机构把已有的登记簿镜像到链上，持有人不能像转 USDC 那样把它转给任何人。看 RWA 数据时，先问口径：<strong>能不能在钱包之间自由转移？</strong></p>')}
<p>三个代表产品，三种结构：</p>
${tbl(['产品', '结构', '关键事实'], [
  ['BlackRock BUIDL', '基金份额，ERC-20 代币', '2024-03-20 在以太坊推出；Securitize 担任过户代理和代币化平台；BNY Mellon 担任托管行和管理人；初始最低投资 500 万美元；目标每枚 1 美元，收益按月以新代币发放' + cite('BlackRock 新闻稿：BUIDL 在以太坊推出', 'https://www.nasdaq.com/press-release/blackrock-launches-its-first-tokenized-fund-buidl-on-the-ethereum-network-2024-03-20')],
  ['Franklin BENJI（FOBXX）', '美国注册的货币基金，1 份 = 1 BENJI', '官方称它是第一只用公链作为官方份额登记系统的美国注册共同基金；从 Stellar 起步，后来扩展到 Polygon、Arbitrum 等链' + cite('Franklin Templeton：BENJI 五周年', 'https://www.franklintempleton.com/press-releases/news-room/2026/franklin-templeton-stellar-development-foundation-mark-five-years-of-benji-the-first-u.s.-registered-tokenized-money-market-fund')],
  ['Ondo USDY', '由 Ondo USDY LLC 发行的代币化票据（2025-12 起并入 Ondo 的 Stocks 体系）', '按 Regulation S 第 902 条定义的美国人以及多个法域的居民被禁止认购、取得或赎回；另一些法域只允许专业投资者；美元赎回只通过电汇到非美国银行账户' + cite('Ondo 文档：USDY Eligibility', 'https://docs.ondo.finance/general-access-products/usdy/eligibility') + cite('Ondo 文档：USDY Basics', 'https://docs.ondo.finance/general-access-products/usdy/basics')]
])}

<h2>3. 法律结构：代币背后是一串合同</h2>
${layers('一只代币化国债基金的四层结构', [
  { name: '链下资产', sub: '真正产生收益的东西', chips: ['美国短期国债', '回购协议', '现金'], kind: 'l1' },
  { name: '基金 / SPV', sub: '法律上的持有人，与发起机构破产隔离', chips: ['基金合同', '托管行', '审计师'] },
  { name: '过户代理', sub: '维护官方份额名册，执行 KYC / AML', chips: ['投资者审核', '认购赎回', '名册 = 链上余额'], kind: 'key' },
  { name: '链上代币', sub: '名册的链上表示', chips: ['白名单', '冻结 / 强制转账', '预言机 NAV'], kind: 'risk' }
], [
  ['flow', '资金从投资者银行账户进入基金，基金买国债；过户代理在名册上登记份额，同时在链上给投资者地址铸造代币。'],
  ['key', '代币持有人拥有的是“对基金份额的权利”，法律效力来自基金合同和过户代理的名册，不来自智能合约本身。'],
  ['fail', '链上余额和法律名册不一致时，以法律名册为准。所以发行方必须保留冻结、强制转账、补发的权力。'],
  ['risk', '托管行、过户代理、发行方任一环节出问题（操作失误、破产、被制裁），代币都会受影响。链上的透明度不能消除这些链下风险。'],
  ['limit', '赎回通常只对白名单内的机构开放，并走银行转账，不能像 AMM 一样随时卖出。']
], ['买入并托管', '登记份额', '链上镜像'])}
<p>这个结构带来三条工程约束：</p>
${steps([
  '<strong>转账要先认人。</strong>证券法规定谁可以买（例如合格投资者、非美国人），所以每次转账都要检查收款方是否通过审核。',
  '<strong>发行方保留管理权。</strong>投资者丢了私钥、法院冻结资产、名册更正，都要求发行方能冻结地址、强制转账、给新地址补发。这和 DeFi 的“不可没收”理念相反，但它是合规资产的前提。',
  '<strong>价格来自链下。</strong>基金的 NAV 由基金管理人每日计算，链上合约只能通过预言机读取。'
])}
${call('warn', '<p>把 RWA 代币放进 DeFi（作为借贷抵押品、AMM 流动性）之前，要确认三件事：池子合约地址是否在白名单里（否则存不进去）；发行方冻结或强制转账时，你的协议会不会出现坏账；赎回暂停时，清算人能不能卖掉抵押品。这些都是 DeFi 协议接 RWA 时真实要回答的问题。</p>')}

<h2>4. 许可型代币标准：ERC-3643（T-REX）</h2>
<p><strong>ERC-3643</strong> 是以太坊上已定稿（Final）的许可型代币标准。它由 Tokeny 的 T-REX（Token for Regulated EXchanges）方案发展而来，保持 ERC-20 接口，但每次转账前都要做两道检查${cite('ERC-3643：T-REX 许可型代币标准', 'https://eips.ethereum.org/EIPS/eip-3643')}：</p>
${tbl(['合约', '职责', '关键函数'], [
  ['Token', 'ERC-20 兼容的证券代币，外加冻结、暂停、铸造、销毁、恢复', '<code>forcedTransfer</code>、<code>setAddressFrozen</code>、<code>freezePartialTokens</code>、<code>recoveryAddress</code>'],
  ['Identity Registry', '把钱包地址、链上身份（ONCHAINID）和国家代码对应起来', '<code>isVerified(address)</code>：收款方是否登记、是否持有所需声明'],
  ['Compliance', '发行规则：持有人数上限、单人持有上限、国家限制', '<code>canTransfer(from, to, amount)</code>'],
  ['Trusted Issuers / Claim Topics Registry', '哪些机构签发的哪些声明（例如“KYC 通过”“合格投资者”）被认可', '增删可信签发方和必需的声明类型']
])}
${mm('ERC-3643 一次 transfer 的检查顺序', `
flowchart TB
  A["用户调用 transfer to amount"] --> B{"代币暂停？<br/>发送方被冻结？"}
  B -->|"是"| X["回滚"]:::risk
  B -->|"否"| C{"可用余额够？<br/>扣除已冻结部分"}
  C -->|"否"| X
  C -->|"是"| D{"IdentityRegistry.isVerified to"}
  D -->|"未登记或声明不全"| X
  D -->|"通过"| E{"Compliance.canTransfer"}
  E -->|"超过人数或单人上限"| X
  E -->|"通过"| F["更新余额"]:::ok
  F --> G["Compliance.transferred 更新统计"]
`, [
  ['flow', '先查代币自身状态，再查收款方身份，最后查发行规则。三关全过才改余额。'],
  ['key', '身份检查看的是<strong>收款方</strong>。发送方已经持有代币，说明它当初通过了审核；但发送方可能被冻结。'],
  ['fail', '集成方最常见的失败：把代币转给一个没在白名单里的合约（例如新的金库合约），交易直接回滚。'],
  ['limit', 'forcedTransfer 只要求收款方通过身份检查，可以跳过 Compliance 规则。它是给发行方代理人处理法律事件用的。']
])}
<p>下面是一个教学版“转账钩子”：在 OpenZeppelin v5 的 ERC-20 上重写 <code>_update</code>，所有铸造、转账、销毁都会经过它。真实项目应直接使用 ERC-3643 的参考实现，而不是自己写。</p>
${code('SOLIDITY', `
// 教学版：只演示“转账钩子”。真实项目请用 ERC-3643 参考实现。
contract PermissionedFundToken is ERC20, AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE"); // 过户代理
    mapping(address => bool) public verified; // 真实系统里是 IdentityRegistry.isVerified
    mapping(address => bool) public frozen;
    error NotVerified(address who);
    error Frozen(address who);

    constructor(address agent) ERC20("Demo Treasury Fund", "DTF") { _grantRole(AGENT_ROLE, agent); }

    function setVerified(address who, bool ok) external onlyRole(AGENT_ROLE) { verified[who] = ok; }
    function setFrozen(address who, bool f) external onlyRole(AGENT_ROLE) { frozen[who] = f; }

    // OpenZeppelin v5：mint（from = 0）、burn（to = 0）、transfer 都经过 _update
    function _update(address from, address to, uint256 amt) internal override {
        if (to != address(0) && !verified[to]) revert NotVerified(to); // 收款方必须通过审核
        if (from != address(0) && frozen[from]) revert Frozen(from);   // 被冻结的地址不能转出
        super._update(from, to, amt);
    }
}
`)}
<p>注意这个钩子对 DeFi 的影响：用户把代币存进借贷池时，收款方是池子合约。池子没被登记，存入就回滚，报错 NotVerified。解决办法只能是让发行方审查并登记池子，不能绕过检查。</p>

<h2>5. 预言机：NAV 与储备金证明</h2>
<p>链上合约不知道基金今天值多少钱，也不知道托管行里是否真的有资产。两类预言机数据解决这两个问题：</p>
${tbl(['数据', '回答什么问题', '用在哪里'], [
  ['NAV（每份净值）', '1 份基金现在值多少美元', '认购时算给多少份；赎回时算付多少钱；借贷协议算抵押品价值'],
  ['储备金证明（Proof of Reserve，PoR）', '托管的资产是否 ≥ 已发行代币', '铸造前检查；储备不足时暂停铸造并告警'],
  ['AUM（管理资产规模）', '基金总规模', '风险敞口统计、协议上限']
])}
<p>Chainlink 把这类数据归入 SmartData：PoR 数据源的读法和价格数据源相同，但答案的单位可能是盎司或代币数量；NAV 通过 NAVLink 提供${cite('Chainlink 文档：SmartData', 'https://docs.chain.link/data-feeds/smartdata')}。官方文档的 Secure Mint 策略建议：每次铸造前读取 PoR，确保铸造后的总供应量不超过储备，并让“过期阈值”匹配数据源的心跳间隔${cite('Chainlink 文档：SecureMintPolicy', 'https://docs.chain.link/ace/reference/policy-library/secure-mint-policy')}。CEX 用默克尔树证明储备的做法见 <a href="#m04-8">M08.9 风控对账与储备金证明</a>。</p>
<p>铸造合约的检查顺序：① 调用 PoR 数据源的 <code>latestRoundData()</code>；② 答案 ≤ 0 或 <code>block.timestamp - updatedAt</code> 超过阈值，拒绝；③ 把数据源精度和代币精度统一（精度弄错会让检查形同虚设）；④ 铸造后的总供应量大于储备，拒绝并告警。读取方式与价格预言机相同，见 <a href="#m05-9">M04.27 数据基础设施</a>。</p>
${call('info', '<p>PoR 不是审计。Chainlink 文档提醒：链下储备数据可能来自第三方审计师、托管行，也可能来自发行方自报，自报数据风险更高；NAV 和 PoR 数据源通常只有单一数据提供方。读这类数据时，要在风控里记录“数据由谁提供”。</p>')}
<p><strong>算一算（示例）：</strong>一只代币化基金按 NAV 认购，并按日计提收益。</p>
${steps([
  '基金总资产 100,200,000 美元，负债 0，已发行 100,000,000 份。NAV = 100,200,000 ÷ 100,000,000 = <strong>1.002 美元 / 份</strong>。',
  '投资者用 1,000,000 USDC 认购。应得份额 = 1,000,000 ÷ 1.002 ≈ <strong>998,004 份</strong>（向下取整，零头留在基金里，对其他持有人公平）。',
  '另一类基金把每份固定为 1 美元，用“发新代币”的方式发收益（BUIDL 即按月发放新代币）。某投资者持有 10,000,000 份，年化收益 5%，按 365 天日计提：每天应计 10,000,000 × 5% ÷ 365 ≈ <strong>1,369.86 份</strong>，月底一次性铸给他。',
  '如果预言机 NAV 停在 1.002 三天没更新，而真实 NAV 已经到 1.0025，每认购 100 万美元就多给约 499 份。所以认购合约必须检查 NAV 的更新时间。'
])}

<h2>6. 链上支付：商户收款、代付 Gas 与跨境结算</h2>
${recall('<p>稳定币的三种设计、USDC / USDT 的储备与黑名单、6 位精度和非标准返回值，见 <a href="#m02-9">M06.1 稳定币</a>。<code>approve</code> + <code>transferFrom</code> 和 EIP-2612 <code>permit</code> 见 <a href="#m02-5">M02.5 ERC-20 与授权</a>。AI Agent 用 HTTP 402 + EIP-3009 自动付费（x402）见 <a href="#m06-7">M10.6 Agent 支付</a>。本节只讲“人向商户付款”的工程设计。</p>')}
${compare('三种让用户付稳定币的方式', [
  { name: 'approve + transferFrom', tag: '两笔交易', kind: 'info', points: ['用户先发 approve，再由商户合约扣款', '用户需要持有原生币付 Gas', '常见“无限授权”风险', '所有 ERC-20 都支持'] },
  { name: 'EIP-2612 permit', tag: '签名授权 + 一笔交易', kind: '', points: ['用户离线签名授权额度', '商户在同一笔交易里 permit + transferFrom', '授权和扣款分开，仍有额度残留', 'USDC 支持，USDT（以太坊）不支持'] },
  { name: 'EIP-3009 transferWithAuthorization', tag: '签名即转账', kind: 'key', points: ['用户签“从我转 X 给收款方”', '任何人可提交，提交者付 Gas', '随机 bytes32 nonce，可并行、不留授权', 'USDC 支持；被合约处理时用 receiveWithAuthorization 防抢跑'] }
], [
  ['flow', '三种方式最终都调用代币合约改余额，区别在于谁发交易、谁付 Gas、授权是否残留。'],
  ['key', '收款场景首选 EIP-3009：签名里写死收款方、金额和有效期，没有残留授权，用户不需要持有 ETH。'],
  ['risk', 'EIP-3009 规范指出：如果收款方是一个合约，攻击者可以从内存池抢先提交 transferWithAuthorization，让钱到了合约但合约逻辑没执行。合约收款要用 receiveWithAuthorization，它要求调用者就是收款方。' + cite('EIP-3009：Transfer With Authorization', 'https://eips.ethereum.org/EIPS/eip-3009')],
  ['limit', '只适用于实现了这些扩展的代币。其他代币需要 Permit2 或智能账户 + Paymaster 方案（见 M07.8）。']
])}
${mm('稳定币商户收款：发票 → 签名 → 代付提交 → 到账', `
sequenceDiagram
  participant U as 用户钱包
  participant F as 商户前端
  participant B as 收款后端
  participant R as 代付中继
  participant T as USDC 合约
  participant I as 索引器
  F->>B: 创建订单 金额 29.90 USD
  B-->>F: 发票 invoiceId 收款地址 金额 有效期 15 分钟
  F->>U: 请求签名 TransferWithAuthorization
  U-->>F: EIP-712 签名 nonce 由 invoiceId 派生
  F->>B: 提交签名
  B->>B: 校验签名 金额 收款方 有效期
  B->>R: 请求上链
  R->>T: transferWithAuthorization 中继付 Gas
  T-->>I: Transfer 事件 AuthorizationUsed 事件
  I->>B: 确认到账 达到确认数
  B-->>F: 订单已支付 发 webhook
`, [
  ['flow', '用户只签一次 EIP-712 签名；中继付 Gas 并提交；后端根据链上事件把订单标记为已支付。'],
  ['key', 'nonce 用 keccak256(invoiceId) 派生。同一张发票的签名只能用一次，重复提交在合约层就会失败，天然防止重复扣款。'],
  ['fail', '有效期（validBefore）过了还没上链，签名作废，订单要重新开票。中继必须监控 Gas 价格，避免卡单。'],
  ['risk', '前端被篡改时，签名里的收款地址可能被换成攻击者地址。后端要在提交前再次校验收款方等于发票里的地址。'],
  ['limit', '订单以“链上事件 + 确认数”为准，不以前端回调为准。L2 上还要考虑排序器确认和 L1 最终性的区别。']
])}
<p>下面用 viem 签一张 EIP-3009 授权。代币合约的 EIP-712 域（name、version）在不同链上可能不同，所以运行时从合约读取，不要硬编码。</p>
${code('TYPESCRIPT', `
import { createPublicClient, createWalletClient, custom, http, keccak256, toHex, parseUnits, erc20Abi, parseAbi } from 'viem'
import { base } from 'viem/chains'

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base 主网 USDC，集成前务必核对官方地址
const pub = createPublicClient({ chain: base, transport: http() })
const wallet = createWalletClient({ chain: base, transport: custom((window as any).ethereum) })

export async function signInvoice(inv: { id: string; payTo: \`0x\${string}\`; amount: string; expiresAt: number }) {
  const [from] = await wallet.requestAddresses()
  // 1. EIP-712 域从合约读取，不同链上的 name / version 可能不同
  const name = await pub.readContract({ address: USDC, abi: erc20Abi, functionName: 'name' })
  const version = await pub.readContract({ address: USDC, abi: parseAbi(['function version() view returns (string)']), functionName: 'version' })
  // 2. 发票号派生 nonce：同一张发票只能付一次
  const message = {
    from, to: inv.payTo,
    value: parseUnits(inv.amount, 6),        // USDC 6 位小数
    validAfter: 0n, validBefore: BigInt(inv.expiresAt),
    nonce: keccak256(toHex('invoice:' + inv.id)),
  }
  // 3. 用户只签名，不上链、不花 Gas；签名交给后端复核后由中继提交
  const signature = await wallet.signTypedData({
    account: from,
    domain: { name, version, chainId: base.id, verifyingContract: USDC },
    types: { TransferWithAuthorization: [
      { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' },
    ] },
    primaryType: 'TransferWithAuthorization',
    message,
  })
  return { message, signature }
}
`)}
<p>行业里的真实落地：Visa 在 2023-09-05 宣布把 USDC 结算扩展到 Solana，并与收单机构 Worldpay、Nuvei 试点用 USDC 向它们结算${cite('Circle / Visa 新闻稿：Visa 扩展稳定币结算', 'https://www.circle.com/pressroom/visa-expands-stablecoin-settlement-capabilities-to-merchant-acquirers')}；Stripe 在 2024 年 10 月让美国商户接受以太坊、Solana、Polygon 上的 USDC 付款，商户收到的是美元${cite('The Block：Stripe 恢复加密支付', 'https://www.theblock.co/post/320404/stripe-crypto-payments')}。按 Stripe 文档，稳定币付款以商户本地法币入账，退款以稳定币退回用户原钱包，没有银行卡那种拒付（chargeback）${cite('Stripe 文档：Stablecoin payments', 'https://docs.stripe.com/crypto/stablecoins')}。Stripe 还在 2025 年完成对稳定币基础设施公司 Bridge 的收购${cite('Stripe：完成收购 Bridge', 'https://stripe.com/newsroom/news/stripe-completes-bridge-acquisition')}。这说明一个趋势：用户和商户看到的是“美元付款”，稳定币在中间当结算层。</p>
<p>一条跨境稳定币链路有五个环节：<strong>入金</strong>（服务商做 KYC，银行卡入金有拒付风险，所以手续费高）→ <strong>链上转账</strong>（选低费用链，确认数按金额分级）→ <strong>跨境</strong>（超过门槛的转账要按旅行规则携带双方信息，见 <a href="#m11-3">M05.3 旅行规则</a>）→ <strong>出金</strong>（需要当地持牌机构，汇率点差和到账时间是主要成本）→ <strong>对账</strong>（订单、链上 txHash、银行流水三方核对）。</p>
<p><strong>算一算（示例）：</strong>从 A 国向 B 国汇 1,000 美元，比较两种路径的成本结构（费率是讲解用的假设，真实数字因国家和服务商差异很大）。</p>
${steps([
  '传统电汇：汇款手续费 25 美元 + 汇率点差 2%（20 美元）= 45 美元，到账 2–3 个工作日。收款方得到 955 美元等值。',
  '稳定币路径：入金 1%（10 美元）→ L2 链上转账约 0.01 美元 → 出金 1%（约 9.90 美元）。合计约 19.91 美元，链上部分几秒，出金取决于当地银行。',
  '结论：省下的主要是汇率点差和中间行费用，链上 Gas 几乎可以忽略；瓶颈在两端的出入金和合规。'
])}
${call('warn', '<p>链上支付和 RWA 都涉及证券法、支付牌照、反洗钱和制裁规则。本篇只介绍技术框架，不构成法律意见。上线前要由律师确认你所在法域的要求，相关框架见 <a href="#m11-2">M05.2 KYC、AML 与制裁筛查</a> 和 <a href="#m11-4">M05.4 主要法域</a>。</p>')}

${tryit(`<p><strong>动手练习：</strong>在区块浏览器里观察一个许可型 RWA 代币，再读一次 USDC 的 EIP-3009 状态。</p>
${steps([
  '打开 rwa.xyz 的 BUIDL 资产页（app.rwa.xyz/assets/BUIDL），找到以太坊上的合约地址（以 <code>0x7712</code> 开头，请以页面和 Etherscan 显示为准）。',
  '在 Etherscan 打开该地址。看页面是否标注为代理合约；进入 Holders 标签，数一数持有地址有多少，和 USDC 的持有人数比较。',
  '进入 Contract → Read as Proxy，找出与白名单、冻结、发行方权限有关的读取函数，记录函数名。',
  '打开 Base 主网 USDC 合约（地址见 Circle 官方文档），在 Read as Proxy 里找到 <code>authorizationState</code>，输入任意地址和一个随机 bytes32，预期返回 false（未使用）。',
  '再调用 <code>version</code> 和 <code>name</code>，记下 EIP-712 域的两个值，和上面代码里的读取逻辑对照。'
])}
<p>预期结果：你能说出 BUIDL 和 USDC 在“谁能持有”上的差别，并能找到 EIP-3009 防重放的链上状态。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['集成 RWA 前，确认你的合约地址已被发行方登记', '否则存入、转出都会回滚', '在测试网或分叉环境用真实代币做一次存入和取出'],
  ['处理冻结和强制转账事件', '发行方可以不经你同意改变你合约里的余额', '监听 Frozen / ForcedTransfer 类事件；对账任务每天比对内部账和 balanceOf'],
  ['NAV / PoR 读数检查更新时间和精度', '过期或精度错误会让认购、抵押估值出错', '分叉测试：喂过期数据时拒绝认购；单元测试覆盖不同 decimals'],
  ['收款用发票派生 nonce，并在后端复核收款方', '防止重复扣款和前端篡改', '同一签名提交两次，第二次失败；改动收款方的签名被后端拒绝'],
  ['订单以链上事件和确认数为准', '前端回调可以伪造，L2 有重组和排序器风险', '模拟重组后订单状态能回退'],
  ['出入金服务商和旅行规则数据留档', '合规检查和争议处理需要', '抽查订单能追溯到 KYC 记录和链上 txHash']
])}

${mistakes([
  ['持有 RWA 代币就等于直接拥有国债。', '代币代表的是对基金份额或票据的权利，法律效力来自基金合同和过户代理的名册；中间有托管行、SPV、发行方多层主体。'],
  ['RWA 代币和 USDC 一样，谁都能收。', '许可型代币每次转账都检查收款方身份。没有登记的地址，包括 DeFi 合约，都收不了。'],
  ['发行方能冻结和强制转账，说明这个代币设计有问题。', '对证券类资产，这是法律要求：法院命令、私钥丢失补发、名册更正都需要它。要评估的是这些权力由谁掌握、有没有审批和记录。'],
  ['PoR 数据源证明了资产安全。', 'PoR 只说明某个数据提供方报告的储备数字，常是单一来源，可能是发行方自报。它不能替代审计和法律保障。'],
  ['用稳定币跨境支付，费用就是 Gas。', 'Gas 通常可以忽略，主要成本在两端的出入金、汇率点差和合规。']
])}
${recap([
  'RWA 是链下资产的链上凭证，规模要看口径：能在钱包间自由转移的 distributed 远小于只在链上登记的 represented。',
  '代币化基金的四层：链下资产 → 基金 / SPV → 过户代理名册 → 链上代币，法律效力在前三层。',
  'ERC-3643 在转账前检查收款方身份（isVerified）和发行规则（canTransfer），并提供冻结、强制转账和恢复。',
  'NAV 和 PoR 通过预言机上链；铸造和认购前都要检查数据更新时间和精度。',
  '商户收款首选 EIP-3009：签名写死收款方和金额，nonce 由发票号派生，中继代付 Gas，订单以链上事件为准。',
  '跨境稳定币支付省在点差和中间行费用，瓶颈在出入金和合规。'
])}
${quiz([
  { q: 'ERC-3643 的代币在 transfer 时，身份检查主要针对谁？', o: ['发送方', '收款方', '交易的 Gas 付款人', '区块提议者'], a: 1, why: 'IdentityRegistry.isVerified 检查收款方是否登记并持有所需声明。发送方已经持有代币，只检查是否被冻结。' },
  { q: '为什么商户收款时建议用发票号派生 EIP-3009 的 nonce？', o: ['让签名更短', '降低 Gas', '同一张发票的签名只能被使用一次，防止重复扣款', '让 USDC 价格稳定'], a: 2, why: 'EIP-3009 的 nonce 是 bytes32，用过即失效。用发票号派生，同一张发票的第二次提交在合约层失败。' },
  { q: '收款方是一个处理存款逻辑的合约时，应该用哪个函数？', o: ['receiveWithAuthorization', 'transferWithAuthorization', 'approve', 'permit'], a: 0, why: 'receiveWithAuthorization 要求调用者就是收款方，防止攻击者抢先提交 transferWithAuthorization 导致钱到了但合约逻辑没执行。' },
  { q: '一只基金 NAV 为 1.002 美元，用 1,000,000 USDC 认购，应得约多少份？', o: ['1,002,000', '1,000,000', '999,000', '998,004'], a: 3, why: '1,000,000 ÷ 1.002 ≈ 998,004，向下取整。' },
  { q: '关于 rwa.xyz 统计的 represented 资产，哪项说法正确？', o: ['它们和稳定币一样可以自由转账', '它们在链上登记，但不能在钱包之间自由转移', '它们是已经违约的贷款', '它们不包含任何真实资产'], a: 1, why: 'rwa.xyz 区分 distributed（可在钱包间转移）和 represented（只在链上登记）。看规模时要先看口径。' }
])}
${exercises([
  ['你的借贷协议想接受一只许可型国债代币作抵押。列出你要和发行方确认的四个问题。', '<p>① 池子合约和清算人地址能否被登记为合格持有人；② 发行方冻结或强制转走池子里的代币时，协议如何处理坏账；③ 赎回暂停时，清算人怎么变现；④ NAV 数据源由谁提供、多久更新，过期时协议怎么停用该抵押品。</p>'],
  ['某收款系统把发票 nonce 设为“用户地址 + 当前时间戳”的哈希。会有什么问题？', '<p>同一张发票可以被签多次（时间戳不同，nonce 不同），用户可能被重复扣款，后端也难以把签名和发票一一对应。nonce 应只由发票号派生，并在数据库给发票号加唯一约束。</p>'],
  ['一只“每份固定 1 美元、按月发新代币”的基金，月中有人卖出全部份额。买方和卖方谁拿到这个月已计提的收益？你在协议里要怎么处理？', '<p>取决于发行方的计提规则，常见是按每日持仓记录计提，月底发给每日的持有人，卖方拿到卖出前的部分。协议持有这类代币时，要按发行方规则记账，不能只看月底余额，否则会把收益错分给后来存入的用户。</p>']
])}
${checklist([
  '能画出代币化基金的四层结构，并说清法律效力在哪一层。',
  '能列出 ERC-3643 的核心合约（Token、身份登记、合规模块、可信签发方）和 isVerified、canTransfer、forcedTransfer 的作用。',
  '能写出带白名单和冻结检查的 _update 钩子，并解释 DeFi 集成为何会因此回滚。',
  '能写出铸造前读取 PoR 并检查更新时间和精度的代码。',
  '能用 viem 签一张 EIP-3009 发票授权，并说清 nonce、有效期和代付 Gas 的设计。',
  '能比较电汇和稳定币跨境支付的成本结构，并指出合规环节。'
])}
${terms([
  ['现实世界资产', 'Real-World Assets (RWA)', '链下真实存在、通过代币在链上表示所有权或收益权的资产。'],
  ['特殊目的载体', 'Special Purpose Vehicle (SPV)', '为持有特定资产设立、与发起机构破产隔离的法律实体。'],
  ['资产净值', 'Net Asset Value (NAV)', '基金总资产减负债后除以份额数，即每份的价值。'],
  ['过户代理', 'Transfer Agent', '替发行人维护官方持有人名册、处理认购赎回的机构。'],
  ['许可型代币', 'Permissioned token', '只有通过身份审核的地址才能持有和接收的代币。'],
  ['ERC-3643', 'T-REX', '带身份登记、合规模块、冻结和强制转账的许可型代币标准。'],
  ['储备金证明', 'Proof of Reserve (PoR)', '把托管资产数量上链，供合约检查发行量是否有足够储备。'],
  ['签名授权转账', 'EIP-3009 transferWithAuthorization', '持有人离线签署转账，由任意第三方提交上链的代币扩展。'],
  ['出入金', 'On-ramp / Off-ramp', '法币与链上稳定币之间的兑换通道。']
])}
` });

CUR = 'm09-5';
addCh({ id: 'm09-5', nav: 'GameFi 与链上游戏', title: 'M11.5 GameFi 与链上游戏：资产上链、全链游戏、应用链与 P2E 经济', desc: '游戏里什么该上链；MUD 与 Dojo；游戏应用链与 L3；Axie 的兴衰；会话密钥与防作弊', html: `
<h1>M11.5 GameFi 与链上游戏：资产上链、全链游戏、应用链与 P2E 经济</h1>
${meta(['按“资产上链 / 混合 / 全链”三种架构，判断一个游戏的哪些部分应该上链，并用 Gas 数字说明为什么游戏常用应用链或 L3。', '用 MUD 写出一张表和一个 System，说清全链游戏和“自治世界”的数据模型。', '用产出与消耗（faucet / sink）复盘 Axie Infinity 的兴衰，并为链上游戏设计会话密钥、随机数和防作弊方案。'], '前置：<a href="#m02-50">M02.6 NFT 与代币发行</a>、<a href="#m06-5">M07.8 账户抽象深入</a>、<a href="#m05-4">M04.4 扩容路线</a>')}
${beginner(`<p><strong>GameFi</strong>：Game + Finance，游戏里的道具、货币或收益和链上代币挂钩。</p>
<p><strong>边玩边赚（Play-to-Earn，P2E）</strong>：玩家通过游戏行为获得可以在市场上卖钱的代币或 NFT。</p>
<p><strong>全链游戏（Fully On-chain Game）</strong>：游戏的状态和规则都写在智能合约里，前端只是一个“看链上数据的窗口”。</p>
<p><strong>自治世界（Autonomous World）</strong>：一种全链游戏理念：世界的规则在链上，开发团队消失后它仍能运行，任何人都能在上面扩展新玩法。</p>
<p><strong>应用链（App-chain）/ L3</strong>：只为一个应用或一类应用服务的链。L3 是建在 L2 之上、把数据结算到 L2 的链。</p>
<p><strong>会话密钥（Session Key）</strong>：一把临时的、只授予有限权限的密钥，让玩家不用每一步都弹钱包确认。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上游戏的核心问题是“什么必须可信”：玩家真正拥有、需要自由交易的东西（资产）上链；需要每秒几十次响应的东西（动画、物理、匹配）留在链下；只有当“规则本身也要无需信任”时，才把逻辑也搬上链，这时就需要便宜的应用链、会话密钥和可验证随机数。')}
${call('analogy', `<p>传统网游像<strong>游乐园</strong>：门票、奖品、规则都归园方，园方关门你的奖品就没了。资产上链的游戏像游乐园发了<strong>可以带出园区的奖券</strong>，在园外也能交易。全链游戏更像一副<strong>公开规则的棋盘</strong>：棋盘和规则摆在广场上，谁都能来下，谁都能在旁边加一块新棋盘。</p>
<p>比喻的局限：奖券能带出园区，不代表它有价值。奖券的价值取决于有没有人想进园玩，这正是 P2E 经济最容易出问题的地方。</p>`)}
${art('一图看懂：要可信、要交易的上链，要快的留在链下', 660, 318, [
  S.zone(10, 28, 300, 236, { t: '链上：要可信、要自由交易', k: 'ok' }),
  S.zone(350, 28, 300, 236, { t: '链下：要每秒几十次响应', k: 'tint' }),
  S.box(24, 56, 272, 58, { k: 'key', icon: 'block', t: '角色 · 道具 · 土地', s: 'NFT，玩家真正拥有' }),
  S.box(24, 126, 272, 50, { k: 'ok', icon: 'coin', t: '游戏币', s: 'ERC-20，要先设计产出和消耗' }),
  S.box(24, 188, 272, 58, { k: 'ok', icon: 'hash', t: '开箱 · 合成', s: '合约 + 可验证随机数' }),
  S.box(364, 56, 272, 58, { k: 'tint', icon: 'gear', t: '动画 · 物理 · 匹配', s: '服务器和客户端' }),
  S.box(364, 126, 272, 50, { k: 'tint', icon: 'chart', t: '排行榜 · 赛季结算', s: '链下算，结果上链发奖' }),
  S.box(364, 188, 272, 58, { k: 'risk', icon: 'warn', t: '信任点：服务器改数值', s: '资产上链不等于去中心化' }),
  S.arrow(362, 151, 298, 151, { k: 'plain' }),
  S.text(330, 140, '发奖', { size: 11.5, anchor: 'middle', dim: 1 }),
  S.text(330, 296, '全链游戏把规则也搬上链：任何人能加玩法，代价是每一步都要 Gas', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '服务器照常跑游戏；开箱这类容易被质疑作弊的环节放进合约；赛季结果用签名或 Merkle 根上链发奖。'],
  ['key', '判断标准：游戏方单方面修改会让玩家受损的东西，就值得上链。'],
  ['risk', '逻辑还在服务器上时，游戏方仍可通过改掉落率、改数值影响资产价值。'],
  ['limit', '链上数据全部公开，隐藏信息要用承诺或零知识证明。']
], '左侧链上放资产、游戏币和开箱合成，右侧链下放实时动作和排行榜结算，排行榜结果上链发奖；服务器改数值是剩余的信任点。', 'm09-5')}

<h2>2. 什么该上链：资产与逻辑</h2>
${compare('三种链上游戏架构', [
  { name: '资产上链', tag: '最常见', kind: 'info', points: ['角色、皮肤、土地是 NFT（ERC-721 / ERC-1155）', '货币是 ERC-20', '战斗、匹配在游戏服务器上', '服务器关了，资产还在，但可能没用'] },
  { name: '混合', tag: '服务器结算上链', kind: '', points: ['服务器跑逻辑，定期把结果或状态根上链', '关键操作（开箱、合成、交易）在合约里', '可以用签名或证明让结果可审计', '玩家仍需信任服务器的计算'] },
  { name: '全链', tag: '状态 + 规则都在链上', kind: 'key', points: ['每一步操作是一笔交易', '任何人都能写新客户端、新机器人、新玩法', '每步都花 Gas、要等出块', '隐私（迷雾、手牌）需要零知识证明'] }
], [
  ['flow', '从左到右，上链的部分越来越多：先是资产，再是关键操作，最后是全部规则。'],
  ['key', '判断标准：如果某个东西被游戏方单方面修改会让玩家受损（资产数量、稀有度、交易），它就值得上链。'],
  ['limit', '链上所有数据公开。卡牌游戏的手牌、策略游戏的迷雾，必须用承诺或零知识证明隐藏（见 <a href="#m10-1">M04.10 零知识证明直觉</a>）。'],
  ['risk', '资产上链但逻辑在服务器上时，游戏方仍可以通过改掉落率、改数值来改变资产价值。“上链”不等于“去中心化”。']
])}
${tbl(['游戏元素', '建议位置', '理由'], [
  ['角色、道具、土地的所有权', '链上 NFT', '玩家要能自由交易、转出游戏'],
  ['游戏内货币', '链上 ERC-20 或链下积分', '要能交易就上链，但要先设计好产出和消耗'],
  ['开箱、合成、稀有度', '链上合约 + 可验证随机数', '最容易被质疑作弊的地方'],
  ['实时动作、物理、动画', '链下客户端 / 服务器', '出块间隔是秒级，做不了 60 帧'],
  ['排行榜、赛季奖励', '链下计算，结果签名上链或用 Merkle 根发放', '计算量大，但发奖要可审计']
])}

<h2>3. 全链游戏与自治世界：MUD 和 Dojo</h2>
<p>全链游戏的早期代表是 <strong>Dark Forest</strong>：2020 年 8 月在以太坊测试网上发布，用 zkSNARK 实现“战争迷雾”，玩家提交证明说明自己的隐藏操作符合规则，而不暴露位置${cite('Naavik：Dark Forest 深度分析', 'https://naavik.co/deep-dives/dark-forest-beacon-of-light/')}。写这类游戏时，开发者发现自己反复在做同样的事：设计存储、写索引器、让前端和链上状态同步。于是出现了专门的框架。</p>
${tbl(['框架', '链与语言', '核心思路'], [
  ['MUD（Lattice）', 'EVM，Solidity + TypeScript', '状态放在标准化的“表”里（Store）；逻辑写成 System，注册到一个 World 合约；自带无代码索引器和客户端同步，客户端只需要一个以太坊节点' + cite('MUD 文档：Introduction', 'https://mud.dev/introduction')],
  ['Dojo', 'Starknet 生态，Cairo', '面向“可证明”游戏和自治世界的工具链，基于可生成零知识证明的 Cairo 语言；包含本地排序器、索引器和部署工具' + cite('Dojo：GitHub README', 'https://github.com/dojoengine/dojo')]
])}
${mm('MUD 的数据流：一次 move 从点击到画面更新', `
flowchart LR
  P["玩家点击 移动"] --> C["客户端<br/>调用 World"]
  C --> W["World 合约<br/>路由到 System"]:::key
  W --> S["MoveSystem<br/>校验规则"]
  S --> T["Store 表<br/>Position 更新"]
  T --> E["Store 事件<br/>StoreSetRecord"]
  E --> IDX["索引器<br/>同步全部表"]
  IDX --> UI["客户端本地状态<br/>画面重绘"]
  E -.->|"也可直接订阅"| UI
`, [
  ['flow', 'System 只写表；表的每次变化都发出标准事件；索引器和客户端按事件重建出和链上一致的状态。'],
  ['key', '因为数据格式标准化，第三方可以不经开发团队同意，写自己的 System 读取或扩展同一个 World。这就是“自治世界”的技术基础。'],
  ['fail', '规则写错（例如没检查移动距离），所有人都能利用。全链游戏的 bug 等同于合约漏洞，要按合约安全的标准测试和审计。'],
  ['limit', '每次移动都是一笔交易，延迟至少是一个出块时间。快节奏游戏不适合全链。']
])}
${code('TYPESCRIPT', `
// packages/contracts/mud.config.ts：声明表结构，MUD 会生成 Solidity 读写库
import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "app",
  tables: {
    Position: {
      schema: { player: "address", x: "int32", y: "int32" },
      key: ["player"],            // 以玩家地址为主键
    },
  },
});
`)}
${code('SOLIDITY', `
// packages/contracts/src/systems/MoveSystem.sol
pragma solidity >=0.8.24;
import { System } from "@latticexyz/world/src/System.sol";
import { Position } from "../codegen/index.sol"; // 由 mud.config.ts 生成

contract MoveSystem is System {
  function move(int32 x, int32 y) public {
    address player = _msgSender();                 // World 转发调用，用 _msgSender 而不是 msg.sender
    (int32 ox, int32 oy) = Position.get(player);
    int32 dx = x > ox ? x - ox : ox - x;
    int32 dy = y > oy ? y - oy : oy - y;
    require(dx + dy <= 1, "one step at a time");  // 规则在链上：每次只能走一格
    Position.set(player, x, y);
  }
}
`)}

<h2>4. 应用链与 L3：为什么游戏要自己的链</h2>
<p><strong>算一算（示例）：</strong>一个全链小游戏有 10,000 名日活玩家，每人每天 200 次操作。</p>
${steps([
  '每天交易数 = 10,000 × 200 = <strong>2,000,000 笔</strong>。以太坊主网约每 12 秒一个区块，一天约 7,200 个区块，平均每块要装下约 278 笔游戏交易，还要和所有其他应用抢空间。',
  '假设主网一笔简单操作 0.50 美元：每天 2,000,000 × 0.50 = <strong>100 万美元</strong>。没有玩家会为“走一步”付 5 毛钱。',
  '假设通用 L2 上一笔 0.002 美元：每天 4,000 美元，可以由游戏方用 Paymaster 代付。',
  '假设专用 L3 / 应用链上一笔 0.0001 美元：每天 200 美元，而且不会因为别的应用火爆而拥堵。'
])}
${layers('游戏常见的链层次', [
  { name: '以太坊 L1', sub: '最终结算与数据可用性', chips: ['最高安全', '最贵'], kind: 'l1' },
  { name: '通用 L2', sub: 'Arbitrum、Base、OP 等', chips: ['便宜', '和 DeFi 共享流动性', '高峰期仍会拥堵'], kind: 'l2' },
  { name: '游戏 L3 / 应用链', sub: '例如基于 Arbitrum Orbit、OP Stack 的专用链', chips: ['可定制 Gas 代币', '可免 Gas', '流动性被隔离', '桥接风险'], kind: 'key' }
], [
  ['flow', 'L3 把交易数据结算到 L2，L2 再结算到 L1。每加一层，成本更低，但安全依赖链更长。'],
  ['risk', '应用链需要跨链桥把资产搬进搬出，桥是被攻击最多的环节。Axie 的 Ronin 桥就是例子（见下文和 <a href="#m05-8">M04.26 跨链桥</a>）。'],
  ['limit', '应用链上的资产和 DeFi 主流动性隔离：玩家想把道具卖成 USDC，需要先跨链。'],
  ['key', '选型问题不是“哪条链最快”，而是“谁来保证这条链的安全”：独立验证者集合、L2 的欺诈证明或有效性证明，还是一个中心化排序器。']
], ['结算', '结算'])}
<p>两个真实例子：Axie Infinity 的开发商 Sky Mavis 在 2021 年为它建了独立侧链 Ronin，2025-08 宣布转为以太坊 L2${cite('The Block：Ronin 将转为以太坊 L2', 'https://www.theblock.co/post/367152/ethereum-is-back-ronin-chain-to-transition-into-layer-2-citing-network-security-scalability-and-success')}，并在 2026-05-12 通过硬分叉迁移到基于 OP Stack 的 L2，用 EigenDA 做数据可用性${cite('crypto.news：Ronin L2 硬分叉完成', 'https://crypto.news/ronin-l2-hard-fork-completes-as-gaming-chain-returns/')}。Offchain Labs 支持的 Xai 在 2023-06 被宣布为基于 Arbitrum Orbit 的游戏 L3${cite('The Block：游戏 L3 Xai 将在 Arbitrum 上线', 'https://www.theblock.co/post/234647/gaming-focused-layer-3-xai-arbitrum-launch')}。从侧链转 L2 的理由之一是：付给以太坊的数据可用性费用，比用代币奖励自己的验证者更便宜，而且安全性更高。Rollup 的安全模型见 <a href="#m05-5">M04.5 Rollup 深入</a>。</p>

<h2>5. P2E 经济：Axie Infinity 的兴衰</h2>
${mm('P2E 经济的循环：谁在付钱', `
flowchart LR
  N["新玩家<br/>买入角色 NFT"] -->|"付 ETH / USDC"| OLD["老玩家 / 公会<br/>卖出角色"]
  OLD --> PLAY["玩游戏<br/>产出代币 SLP"]
  PLAY --> SELL["在市场卖出 SLP"]:::risk
  PLAY --> BREED["繁殖新角色<br/>消耗 SLP 和 AXS"]
  BREED --> N
  SELL --> PRICE["SLP 价格"]
  BREED -.->|"消耗越多 价格越稳"| PRICE
`, [
  ['flow', '玩家赚的钱，最终来自后来进场买角色的新玩家，以及愿意买 SLP 去繁殖的人。'],
  ['risk', '如果产出（faucet）大于消耗（sink），代币持续贬值；新玩家增速一慢，整个循环反转。'],
  ['key', '健康的游戏经济要有“不为了赚钱也愿意花钱”的玩家，即游戏本身好玩。'],
  ['limit', '图是简化模型。真实经济还有治理代币、市场手续费、公会分成等环节。']
])}
${cases([
  ['Axie Infinity：P2E 的繁荣与收缩', '2021–2022', '<p>2021 年 Axie 成为 P2E 的代表，许多玩家通过“奖学金”模式借用公会的角色打金。按 The Block 的统计，Axie 的 NFT 月销售额在 2021 年 8 月超过 8.48 亿美元，2022 年 4 月只有 1,940 万美元，下降 98%；日活玩家从 2021 年 11 月的 250 万降到 2022 年 4 月的 120 万。为了抑制 SLP 通胀，Sky Mavis 鼓励玩家质押 SLP 换取 RON，并取消了每天最多可赚 75 SLP 的日常任务和冒险模式奖励，但效果有限。</p><p>启示：代币产出和消耗的平衡，比单纯的“边玩边赚”更重要；当收益来自新玩家的资金时，增长放缓就会引发价格螺旋下跌。代币经济设计见 <a href="#m02-60">M06.6 代币经济设计</a>。</p>', [['The Block：The decline of Axie Infinity', 'https://www.theblock.co/post/146915/the-decline-of-axie-infinity']]],
  ['Ronin 桥被盗', '2022-03', '<p>Ronin 桥 9 个验证者中有 5 个私钥被攻击者控制，约 6.25 亿美元的 ETH 和 USDC 被盗。它发生在 Axie 经济收缩期间，进一步打击了玩家信心。完整复盘见 <a href="#m05-8">M04.26 跨链桥</a>。</p>', [['The Block：Ronin 侧链遭 6 亿美元攻击', 'https://www.theblock.co/post/139761/axie-infinitys-ethereum-sidechain-ronin-hit-by-600-million-exploit']]]
], 'h3')}
<p><strong>算一算（示例）：</strong>检查一个代币的产出和消耗是否平衡。</p>
${steps([
  '产出：10,000 名玩家，每人每天赚 75 枚代币，每天产出 750,000 枚。',
  '消耗：每次繁殖消耗 600 枚。要抵消产出，每天需要 750,000 ÷ 600 = <strong>1,250 次繁殖</strong>。',
  '如果每天只有 500 次繁殖，净增 750,000 − 300,000 = 450,000 枚。这些代币大多会被卖出，价格持续下跌。',
  '再假设每次繁殖出来的新角色必须卖给新玩家才有意义：每天要有约 1,250 名新玩家进场。新玩家增长停下的那一天，消耗就跟着下降。'
])}

<h2>6. 体验与公平：会话密钥、随机数与防作弊</h2>
${recall('<p>ERC-4337 智能账户、Paymaster 代付 Gas 和会话密钥的实现细节见 <a href="#m06-5">M07.8 账户抽象深入</a>；Chainlink VRF 的请求和回调流程见 <a href="#m05-9">M04.27 数据基础设施</a>。本节只讲它们在游戏里的用法。</p>')}
${mm('会话密钥：一次授权，后续操作不再弹钱包', `
sequenceDiagram
  participant P as 玩家
  participant W as 主钱包
  participant G as 游戏客户端
  participant A as 智能账户
  participant PM as Paymaster
  P->>W: 进入游戏 授权会话
  W->>A: 安装会话密钥 只能调用 MoveSystem 有效 24 小时 上限 500 次
  G->>G: 本地生成会话私钥 保存在浏览器
  loop 每一步操作
    G->>A: 会话密钥签名的 UserOperation
    A->>A: 校验目标合约 函数 有效期 次数
    PM-->>A: 游戏方代付 Gas
  end
  P->>W: 退出或过期 撤销会话
`, [
  ['flow', '主钱包只在开始时签一次；之后每一步由客户端里的会话密钥签名，Paymaster 代付 Gas，玩家感觉不到“上链”。'],
  ['risk', '会话私钥存在浏览器里，可能被恶意插件读取。所以权限要窄：只能调用游戏合约、不能转走 NFT 和代币、有效期短。'],
  ['key', '权限范围由智能账户的验证逻辑在链上强制执行，不是靠客户端自觉。'],
  ['limit', 'Paymaster 代付会被机器人滥用，要按账户、按天设上限。']
])}
${tbl(['作弊方式', '为什么链上游戏容易出现', '对策'], [
  ['预测随机数', '用 block.timestamp、prevrandao 生成的“随机数”可以被出块者影响，也能被同一交易里的合约预先计算', '用 VRF；或用承诺-揭示（commit-reveal）：先提交哈希，过几个区块后揭示'],
  ['看到结果再决定', '开箱结果在同一笔交易里可见，攻击合约可以“结果不好就回滚”', '请求随机数和使用随机数分成两笔交易；禁止合约账户调用或检查调用来源'],
  ['抢跑（Front-running）', '内存池里的操作公开，别人可以抢先占位或抢资源', '用私有交易通道、批量结算，或在 L3 上用先到先服务排序（见 <a href="#m05-7">M04.7 MEV</a>）'],
  ['机器人与多开（女巫）', '链上无法区分人和脚本，P2E 收益让脚本有利可图', '奖励与真人凭证挂钩（例如链上身份证明，见 <a href="#m09-1">M11.1 链上身份</a>），收益递减，限制单账户产出'],
  ['客户端篡改', '全链游戏的前端开源、可改', '所有规则都在合约里校验；客户端只负责显示']
])}

${tryit(`<p><strong>动手练习：</strong>在本机跑一个 MUD 全链小游戏，并加上“每次只能走一格”的规则。</p>
${steps([
  '安装 Node.js 18+、pnpm 和 Foundry。运行 <code>pnpm create mud@latest my-game</code>，模板选 <code>vanilla</code> 或 <code>react</code>。',
  '进入目录，运行 <code>pnpm install</code>，再运行 <code>pnpm dev</code>。它会启动本地 anvil 链、部署 World，并打开前端。点按钮，观察计数器变化。',
  '把上面的 Position 表加进 <code>packages/contracts/mud.config.ts</code>，新建 <code>MoveSystem.sol</code>。保存后 MUD 会自动重新生成代码并部署。',
  '在 MUD Dev Tools（前端里的调试面板）里找到 Position 表，调用 <code>move</code> 走一格，观察表里的值；再尝试一次走两格，预期交易回滚，报错 one step at a time。'
])}
<p>预期结果：你能指出状态存在哪张表、规则在哪个 System 里执行，以及前端是怎么知道状态变了的。</p>`)}

${mistakes([
  ['道具做成 NFT，游戏就去中心化了。', '如果掉落率、数值、玩法都在服务器上，游戏方仍能单方面改变 NFT 的价值。资产上链只解决了“所有权”问题。'],
  ['P2E 的收益来自游戏本身。', '在多数 P2E 设计里，玩家卖出的代币由其他玩家买单。新玩家增长放缓，收益就会下降。'],
  ['全链游戏可以做成任何类型。', '每步操作都要上链、所有数据公开，适合回合制、策略、模拟类游戏；快节奏和隐藏信息类游戏要配合链下计算或零知识证明。'],
  ['用 block.timestamp 或 prevrandao 生成随机数就够了。', '这些值可被出块者影响，或被同一交易内的合约提前算出。关键随机数要用 VRF 或承诺-揭示。'],
  ['游戏应用链更快更便宜，所以更好。', '应用链还带来流动性隔离和跨链桥风险。Ronin 桥事件就是代价。']
])}
${recap([
  '判断上链的标准：被游戏方单方面修改会损害玩家的东西才值得上链；实时交互留在链下。',
  '全链游戏把状态和规则放进合约；MUD 用 World、System、Store 表和自动索引让第三方可以扩展同一个世界，Dojo 在 Starknet 生态用 Cairo 做可证明的游戏。',
  '游戏交易量大，主网成本不可承受，所以常用 L2、L3 或应用链，但要接受桥接风险和流动性隔离。',
  'Axie 的兴衰说明：代币的产出必须被消耗抵消，收益不能只靠新玩家资金。',
  '会话密钥 + Paymaster 让玩家不用每步签名和付 Gas；随机数用 VRF 或承诺-揭示；规则全部在合约里校验。'
])}
${quiz([
  { q: '以下哪个游戏元素最<strong>不</strong>适合放在链上执行？', o: ['道具所有权', '开箱稀有度', '每秒 60 帧的角色物理碰撞', '赛季奖励发放'], a: 2, why: '出块间隔是秒级，实时物理只能在客户端或服务器上算。其他三项都和资产价值有关，值得上链或可审计。' },
  { q: 'MUD 里，第三方为什么能在不经开发团队同意的情况下扩展一个 World？', o: ['MUD 没有权限控制', '状态存在标准化的表里，任何人都能读取并部署新的 System 与之交互', 'MUD 会自动复制合约', '所有 World 都由 Lattice 托管'], a: 1, why: 'Store 的表结构和事件是标准化的，第三方可以读取全部状态，并在权限允许的命名空间里注册自己的 System。' },
  { q: '某游戏每天产出 750,000 枚代币，每次繁殖消耗 600 枚。每天至少需要多少次繁殖才能不增发？', o: ['600', '7,500', '450,000', '1,250'], a: 3, why: '750,000 ÷ 600 = 1,250。少于这个次数，代币供应就会净增加。' },
  { q: '游戏里给会话密钥授权时，下面哪项限制最重要？', o: ['会话密钥只能调用游戏合约的指定函数，且不能转出资产', '密钥长度更长', '会话密钥必须存在服务器上', '会话密钥永不过期'], a: 0, why: '会话私钥在客户端，可能泄露；权限窄（指定合约和函数、不可转资产、有时限）才能限制泄露后的损失。' },
  { q: '为什么“请求随机数”和“使用随机数”要分成两笔交易？', o: ['节省 Gas', '让区块更快', '让攻击合约无法在看到结果后回滚整笔交易', 'VRF 只支持两笔交易'], a: 2, why: '如果在同一笔交易里拿到并使用结果，攻击合约可以“结果不好就 revert”，反复尝试直到抽到好结果。' }
])}
${exercises([
  ['你在设计一个链上卡牌游戏。哪些数据必须隐藏？你会怎么在链上隐藏它们？', '<p>玩家的手牌和牌库顺序必须隐藏。做法：开局时每个玩家提交牌库的承诺（哈希）；出牌时揭示一张牌并证明它属于之前的承诺；更强的方案用零知识证明证明“我的出牌合法”而不暴露其他手牌。洗牌的随机数用 VRF 或多方承诺-揭示生成。</p>'],
  ['一个游戏打算部署自己的 L3，并让玩家从 Base 把 USDC 桥进来买道具。列出你要向团队提的三个风险问题。', '<p>① 桥由谁验证：L3 的欺诈证明 / 有效性证明是否已上线，还是由少数多签控制；② 排序器宕机或作恶时，玩家能否强制提款回 L2；③ 桥合约是否可升级、升级权在谁手里、有没有时间锁和资金上限。</p>'],
  ['把 Axie 的 SLP 问题换成一个你自己设计的游戏货币。写出两个产出项和三个消耗项，并说明哪个消耗不依赖新玩家。', '<p>示例：产出——完成每日关卡、赛季排名奖励。消耗——升级装备、修理耐久、参加锦标赛门票。修理耐久和锦标赛门票是老玩家为了继续玩、为了竞技而产生的消耗，不依赖新玩家进场，是更健康的消耗。</p>']
])}
${checklist([
  '能按资产上链 / 混合 / 全链三种架构，给一个游戏的各元素分配位置并说明理由。',
  '能用 MUD 定义一张表并写一个带规则校验的 System，在本地跑起来。',
  '能用交易数 × 单笔费用算出主网、L2、L3 的每日成本，并说出应用链的两个代价。',
  '能用产出与消耗复盘 Axie，并说出 Ronin 桥事件的根因在哪篇文章里。',
  '能为游戏设计会话密钥的权限范围，并说出三种链上作弊方式和对策。'
])}
${terms([
  ['边玩边赚', 'Play-to-Earn (P2E)', '玩家通过游戏行为获得可在市场出售的代币或 NFT 的模式。'],
  ['全链游戏', 'Fully on-chain game', '状态和规则都在智能合约里的游戏，前端只负责显示。'],
  ['自治世界', 'Autonomous World', '规则在链上、开发团队离开后仍可运行、任何人可扩展的全链世界。'],
  ['MUD', 'MUD', 'Lattice 开发的 EVM 全链应用框架，用 World、System 和标准化表管理状态。'],
  ['Dojo', 'Dojo', '基于 Cairo、面向可证明游戏和自治世界的开发工具链。'],
  ['应用链', 'App-chain', '只为一个或一类应用服务、可定制费用和规则的区块链。'],
  ['产出与消耗', 'Faucet / Sink', '游戏经济里增加代币供应和减少代币供应的机制。'],
  ['承诺-揭示', 'Commit-reveal', '先提交数据的哈希，之后再公开原文，防止他人提前看到或事后修改。']
])}
` });

CUR = 'm09-6';
addCh({ id: 'm09-6', nav: '★ 实战：凭证与声誉', title: 'M11.7 ★ 实战：链上凭证与声誉 DApp（EAS + ENS + 灵魂绑定徽章）', desc: '机构签发 EAS 凭证，用户用 ENS 展示声誉档案，凭证决定访问权限', html: `
<h1>M11.7 ★ 实战：链上凭证与声誉 DApp（EAS + ENS + 灵魂绑定徽章）</h1>
${meta(['设计一套 EAS 凭证 schema、一个校验签发方并自动发放灵魂绑定徽章的 Resolver 合约，以及一个幂等的签发服务。', '用 viem 解析 ENS 档案、用 EAS GraphQL 读取凭证，组合成声誉主页，并按凭证控制页面和合约的访问。', '为项目写出测试清单、部署与监控方案、威胁模型（含隐私与撤销），并按 5 周里程碑交付。'], '前置：<a href="#m09-1">M11.1 链上身份：ENS、DID、可验证凭证与 EAS</a>、<a href="#m02-50">M02.6 NFT 与代币发行</a>、<a href="#m07-6">M03.6 签名与登录</a>')}
${beginner(`<p><strong>凭证 / 证明（Attestation）</strong>：某个签发方（attester）对某个对象（recipient）做出的一条带签名的声明，例如“地址 0xA 完成了 Solidity 入门课，成绩 92”。</p>
<p><strong>EAS（以太坊证明服务，Ethereum Attestation Service）</strong>：一套开源合约，提供两件事：登记凭证格式的 SchemaRegistry，和签发、撤销凭证的 EAS 合约。</p>
<p><strong>Schema</strong>：凭证的数据格式，例如 <code>string courseId, uint8 score</code>。每个 schema 注册后得到一个唯一的 UID。</p>
<p><strong>Resolver（解析器合约）</strong>：注册 schema 时可以指定的合约。每次有人用这个 schema 签发或撤销凭证，EAS 都会先调用它；它返回 false，签发就失败。</p>
<p><strong>灵魂绑定代币（Soulbound Token，SBT）</strong>：不能转让的 NFT。ERC-5192 规定了最小接口：<code>locked(tokenId)</code> 返回 true 表示不可转让。</p>
<p><strong>ENS（以太坊域名服务）</strong>：把 <code>alice.eth</code> 这样的名字和地址、头像、社交账号等文本记录对应起来。</p>`)}
${one('这个项目让一个组织（培训机构、开源社区、DAO）把“谁完成了什么、贡献了什么”签发成 EAS 凭证；Resolver 合约在链上把关“只有登记过的签发方才能签”，并自动给收款人铸造一枚不可转让的徽章；前端把凭证和 ENS 档案拼成一个可验证的声誉主页，并用凭证决定谁能进入某个页面或调用某个合约。')}
${call('analogy', `<p>像一张<strong>电子毕业证 + 校徽 + 门禁卡</strong>：学校教务处（签发服务）在公共登记册（EAS）上写下“某人毕业”，登记册只接受教务处盖章的条目（Resolver）；毕业生自动收到一枚别不下来的校徽（SBT）；校友会门禁（访问控制）扫一下登记册就知道放不放行。</p>
<p>比喻的局限：公共登记册任何人都能读。成绩、姓名这类隐私不能直接写上去，要用哈希、链下凭证或 Merkle 树只公开必要的部分。</p>`)}
${art('一图看懂：只有登记过的签发方能签，签完自动发一枚不可转让的徽章', 660, 326, [
  S.box(10, 36, 210, 46, { k: 'warn', icon: 'key', t: '签发方', s: '私钥在 KMS 里' }),
  S.box(10, 112, 210, 150, { k: 'info', left: 1, icon: 'doc', t: 'EAS 凭证', s: 'schema：课程成绩\nattester：签发方地址\nrecipient：0x1111…\n数据：成绩 85（示例）\n撤销与过期时间' }),
  S.box(262, 36, 180, 226, { k: 'key', left: 1, icon: 'shield', t: 'CredResolver', s: 'EAS 写入前先问它\n① 签发方在白名单\n② 不带 ETH\n③ 成绩不超过 100\n④ 成绩达 60 才发徽章\n\n任一项为 false\n整条凭证作废', mono: 1 }),
  S.box(490, 36, 160, 46, { k: 'tint', icon: 'person', t: '收款人', s: '0x1111…', mono: 1 }),
  S.box(490, 112, 160, 110, { k: 'ok', icon: 'lock', t: 'CredBadge', s: 'ERC-5192\n只能铸造和销毁\n不能转让', mono: 1 }),
  S.arrow(115, 84, 115, 110, { k: 'plain' }),
  S.arrow(222, 187, 260, 187, { k: 'plain' }),
  S.arrow(444, 167, 488, 167, { k: 'plain' }),
  S.arrow(570, 110, 570, 84, { k: 'plain' }),
  S.text(330, 290, '凭证被撤销时，Resolver 同步销毁这枚徽章', { size: 12.5, anchor: 'middle', dim: 1 }),
  S.text(330, 314, '谁能签由链上白名单决定，不由签发服务决定（成绩数字为示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '签发方签一条 EAS 凭证；EAS 先调用 Resolver 把关；通过后收款人得到一枚徽章。'],
  ['key', '信任边界在 Resolver：即使签发服务被攻破，攻击者也只能用已登记的签发方地址签发。'],
  ['fail', 'Resolver 返回 false 或回滚，凭证不会写入，徽章也不会铸造。'],
  ['limit', '凭证和徽章都公开可读，成绩姓名等隐私不要直接写进数据里。']
], '签发方签出一条 EAS 凭证，EAS 调用 CredResolver 做四项检查，通过后 CredBadge 给收款人铸造一枚不可转让的徽章。', 'm09-6')}
${recall('<p>DID、可验证凭证、EAS 的基本概念和 ENS 的解析原理见 <a href="#m09-1">M11.1 链上身份</a>。ERC-721 的铸造见 <a href="#m02-50">M02.6 NFT 与代币发行</a>；“用钱包签名登录”（SIWE）见 <a href="#m07-6">M03.6 签名与登录</a>。本篇只讲把它们组装成一个可交付的项目。</p>')}

<h2>1. 项目目标与验收标准</h2>
<p>项目代号 <strong>CredBoard</strong>。部署在 Base Sepolia 测试网（EAS 在 Base 和 Base Sepolia 上是预部署合约：EAS 地址 <code>0x4200…0021</code>，SchemaRegistry 地址 <code>0x4200…0020</code>）${cite('EAS 合约仓库：部署地址', 'https://github.com/ethereum-attestation-service/eas-contracts')}；ENS 在以太坊主网（或 Sepolia）解析。</p>
${tbl(['类别', '验收标准（示例）'], [
  ['功能', '组织管理员能登记 / 移除签发方；签发方能对单个或批量（≤ 100 条）地址签发“课程完成”和“贡献”两种凭证；签发方能撤销；Resolver 拒绝非登记签发方的凭证'],
  ['徽章', '成绩 ≥ 60 的课程凭证自动铸造一枚 ERC-5192 灵魂绑定徽章；凭证被撤销时徽章同步销毁；任何转让都回滚'],
  ['档案', '输入地址或 ENS 名，页面展示 ENS 头像与文本记录、全部有效凭证、徽章、按签发方分组的积分'],
  ['访问控制', '持有指定 schema 且未撤销、未过期、签发方可信的凭证，才能访问 /members 页面和调用 <code>CredGate.enter()</code>'],
  ['性能', '档案页 P95 首屏 < 1.5 秒（有缓存）；签发 API P95 < 300 毫秒（只入队，不等上链）；签发到链上确认 P95 < 60 秒'],
  ['可靠性', '同一请求重复提交不会产生第二条凭证；签发服务重启后能续跑未完成任务；索引延迟 > 2 分钟告警'],
  ['安全与隐私', '链上不出现姓名、邮箱、成绩以外的个人信息；证据只存加盐哈希；签发私钥不在应用服务器明文出现']
])}

<h2>2. 需求拆解与用户故事</h2>
${tbl(['角色', '用户故事', '验收要点'], [
  ['组织管理员', '我要登记哪些地址可以代表组织签发凭证，并在有人离职时立即撤权', '链上 <code>setIssuer</code> 事件；撤权后该地址新签发的凭证被 Resolver 拒绝'],
  ['课程运营', '我要在学员结课后批量签发凭证，不想逐个弹钱包', '后台上传名单 → 签发服务排队上链；失败可重试；每条记录有 UID 和 txHash'],
  ['学员', '我要一个链接展示我的学习和贡献记录，别人能自己验证真假', '/u/alice.eth 页面；每条凭证可点开到 easscan 查看原始记录'],
  ['学员（隐私）', '我不想让所有人看到我的分数', '可选择链下凭证：签名后只给我，我决定给谁看'],
  ['合作方', '我要只让完成某门课的人进入我们的内测群 / 领取空投', '调用 <code>CredGate</code> 或 /api/gate 校验；结果包含失败原因'],
  ['审计 / 运营', '我要知道每条凭证是谁、在什么时候、基于什么证据签发的', '数据库保存请求、审批人、证据哈希、txHash；可按证据 ID 反查']
])}

<h2>3. 系统架构、关键调用链与状态机</h2>
${mm('CredBoard 系统架构', `
flowchart LR
  subgraph OFF["链下"]
    ADM["管理后台<br/>Next.js"] --> API["签发 API<br/>Node + Fastify"]
    API --> DB[("PostgreSQL<br/>请求 · 任务 · 审计")]
    API --> Q["任务队列"]
    Q --> WK["签发 Worker<br/>EAS SDK"]
    WK --> KMS["签名服务<br/>KMS / HSM"]:::key
    WEB["用户前端<br/>Next.js + viem"] --> GQL["EAS GraphQL<br/>或自建索引"]
    WEB --> ENSR["ENS 解析<br/>L1 RPC"]
  end
  subgraph ON["Base Sepolia"]
    EAS["EAS 合约"] --> RES["CredResolver<br/>签发方白名单"]:::key
    RES --> SBT["CredBadge<br/>ERC-5192"]
    GATE["CredGate<br/>访问控制"] --> EAS
  end
  WK -->|"attest / revoke"| EAS
  EAS -.->|"事件"| GQL
  WEB --> GATE
`, [
  ['flow', '签发是写路径：后台 → API 入库 → 队列 → Worker 调 EAS → EAS 调 Resolver → Resolver 铸徽章。展示是读路径：前端读 ENS 和 GraphQL。'],
  ['key', '信任边界在 Resolver：即使签发服务被攻破，攻击者也只能用已登记的签发方地址签发；移除签发方后立即失效。'],
  ['fail', 'GraphQL 索引延迟或宕机时，档案页显示旧数据。访问控制这类关键判断要直接读链（getAttestation），不能只信索引。'],
  ['risk', '签发私钥是最高价值资产。它在 KMS 里，Worker 只能请求签名，不能导出私钥。'],
  ['limit', '本架构的签发方集中在一个组织。跨组织互认凭证需要信任注册表或多签发方策略（见第 12 节）。']
])}
${mm('一次课程凭证签发的调用链', `
sequenceDiagram
  participant O as 课程运营
  participant A as 签发 API
  participant D as 数据库
  participant W as Worker
  participant K as KMS
  participant E as EAS
  participant R as CredResolver
  participant B as CredBadge
  O->>A: POST /issuances 名单与证据
  A->>D: 插入请求 唯一键防重复
  A-->>O: 202 已受理 返回 requestId
  W->>D: 取待处理任务 加锁
  W->>K: 签名 attest 交易
  W->>E: attest schema recipient data
  E->>R: onAttest 校验签发方与数据
  R->>B: 成绩达标则 mintFor recipient uid
  R-->>E: 返回 true
  E-->>W: Attested 事件 含 UID
  W->>D: 写入 UID txHash 状态 CONFIRMED
`, [
  ['flow', 'API 只入库并立即返回 202，上链由 Worker 异步完成，所以签发 API 的延迟和链上拥堵无关。'],
  ['key', 'Resolver 在 EAS 内部同步执行：它返回 false 或回滚，整条凭证都不会被写入，徽章也不会铸造。'],
  ['fail', 'Worker 发出交易后崩溃：重启后先按 nonce 和 txHash 查询链上结果，再决定是否重发，否则可能重复签发。'],
  ['risk', '数据库唯一键是幂等的第一道防线；链上无法阻止同一签发方对同一地址签两条相同凭证。']
])}
${mm('凭证生命周期', `
stateDiagram-v2
  state "已受理" as Received
  state "排队中" as Queued
  state "已提交" as Submitted
  state "已确认" as Confirmed
  state "签发失败" as Failed
  state "已撤销" as Revoked
  state "已过期" as Expired
  state "链下已签" as Offchain
  [*] --> Received
  Received --> Queued: 校验通过
  Received --> Offchain: 用户选择链下凭证
  Queued --> Submitted: Worker 发出交易
  Submitted --> Confirmed: 达到确认数
  Submitted --> Queued: 交易被替换或超时
  Submitted --> Failed: Resolver 拒绝
  Failed --> Queued: 人工修复后重试
  Confirmed --> Revoked: 签发方撤销
  Confirmed --> Expired: 到达 expirationTime
  Offchain --> Revoked: revokeOffchain
`, [
  ['flow', '链上凭证走 已受理 → 排队 → 已提交 → 已确认；链下凭证签名后直接交给用户。'],
  ['key', '“已撤销”和“已过期”在链上都能查到：revocationTime 不为 0，或 expirationTime 已过。验证方每次都要检查这两项。'],
  ['fail', 'Resolver 拒绝通常是签发方被移除或数据格式错误，重试前必须先修复原因，不能自动无限重试。'],
  ['limit', '链下凭证的撤销要靠签发方调用 revokeOffchain 把 UID 记上链，验证方必须主动去查。']
])}

<h2>4. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['凭证协议', 'EAS', 'W3C VC + DID、自写 NFT 合约', 'EAS 合约开源、在多条链上部署，自带 schema 注册、撤销、链下凭证和浏览器（easscan）'],
  ['链', 'Base Sepolia → Base', 'Optimism、Arbitrum', 'EAS 在 OP Stack 链上是预部署合约；费用低，适合批量签发'],
  ['合约框架', 'Foundry + OpenZeppelin v5', 'Hardhat', '测试快，支持分叉测试与模糊测试（见 <a href="#m02-4">M02.4 开发工具链</a>）'],
  ['签发服务', 'Node.js + EAS SDK + ethers v6', 'Go + abigen', 'EAS 官方 SDK 基于 ethers v6，提供 SchemaEncoder、链下签名与校验'],
  ['前端', 'Next.js + viem + wagmi', 'Vite + React', 'viem 自带 ENS 动作（getEnsName、getEnsAvatar、getEnsText）'],
  ['索引', 'EAS 官方 GraphQL（起步）→ 自建索引', 'The Graph、Ponder', '起步零运维；关键业务要能脱离第三方（见 <a href="#m01-8">M01.8 索引器工程</a>）'],
  ['密钥', '云 KMS（secp256k1）', 'Safe 多签 + 提案', '签发频繁，KMS 能自动化并留审计；管理员权限放在 Safe 多签上'],
  ['证据存储', '私有对象存储 + 链上加盐哈希', 'IPFS（见 <a href="#m09-3">M11.3</a>）', '证据可能含个人信息，不能公开存储']
])}

<h2>5. 数据模型</h2>
<p><strong>链上 schema（两条）：</strong></p>
${tbl(['名称', 'schema 字符串', '可撤销', 'Resolver'], [
  ['CourseCompletion', '<code>string courseId,uint8 score,uint64 completedAt,bytes32 evidenceHash</code>', '是', 'CredResolver'],
  ['Contribution', '<code>string project,string role,uint32 points,bytes32 evidenceHash</code>', '是', 'CredResolver']
])}
<p>设计原则：字段只放验证方需要的最少信息；<code>evidenceHash = keccak256(salt ‖ 证据 JSON)</code>，证据原文和盐留在组织的私有存储里，需要时出示给审计方核对；不放姓名和邮箱。</p>
${code('SQL', `
CREATE TABLE issuance_requests (
  id              BIGSERIAL PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,       -- schema + recipient + courseId，防重复签发
  schema_uid      VARCHAR(66) NOT NULL,
  recipient       VARCHAR(42) NOT NULL,
  payload         JSONB NOT NULL,             -- 编码前的字段值
  evidence_id     TEXT NOT NULL,              -- 证据原文在私有存储里的 ID
  evidence_salt   VARCHAR(66) NOT NULL,
  mode            TEXT NOT NULL CHECK (mode IN ('ONCHAIN', 'OFFCHAIN')),
  status          TEXT NOT NULL DEFAULT 'RECEIVED',
  issuer          VARCHAR(42) NOT NULL,       -- 与链上 isIssuer 对应，链上为准
  approved_by     TEXT NOT NULL,
  tx_hash         VARCHAR(66),
  attestation_uid VARCHAR(66) UNIQUE,
  last_error      TEXT,
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_req_status ON issuance_requests (status, updated_at);
-- 另有 issuers（地址、KMS 密钥 ID）、revocations（UID、原因、操作人）、profile_cache（可由链上重建）三张表
`)}

<h2>6. 接口设计</h2>
${tbl(['接口', '请求', '响应 / 说明'], [
  ['<code>POST /api/issuances</code>', '{ schema, recipient, fields, evidenceId, mode, idempotencyKey }，需管理员会话', '202 { requestId, status }；重复的 idempotencyKey 返回原记录'],
  ['<code>GET /api/issuances/:id</code>', '—', '{ status, attestationUid, txHash, lastError }'],
  ['<code>POST /api/revocations</code>', '{ attestationUid, reason }', '202；Worker 调用 EAS.revoke'],
  ['<code>GET /api/profile/:nameOrAddress</code>', 'alice.eth 或 0x 地址', '{ address, ens: { name, avatar, texts }, attestations: [...], badges: [...], score }'],
  ['<code>GET /api/gate?resource=members</code>', 'SIWE 会话中的地址', '{ allowed, reason, attestationUid }'],
  ['合约 <code>CredResolver.setIssuer(address,bool)</code>', 'onlyOwner（Safe 多签）', '事件 IssuerSet(issuer, active)'],
  ['合约 <code>CredGate.enter(bytes32 uid)</code>', '调用者提供自己的凭证 UID', '校验通过发出 Entered(user, uid)'],
  ['链上事件', 'EAS：Attested(recipient, attester, uid, schemaUID)、Revoked(...)', '索引器以此为准更新档案']
])}

<h2>7. 核心代码</h2>
${art('代码结构：链下三个文件，链上四个合约，谁调用谁', 660, 330, [
  S.zone(10, 26, 220, 262, { t: '链下 · TypeScript', k: 'tint' }),
  S.zone(290, 26, 360, 262, { t: '链上 · Base Sepolia', k: 'info' }),
  S.box(24, 60, 192, 50, { k: 'tint', t: 'gate/route.ts', s: 'GET /api/gate · 7.6', mono: 1 }),
  S.box(24, 142, 192, 50, { k: 'tint', t: 'worker.ts', s: 'processOne() · 7.4', mono: 1 }),
  S.box(24, 224, 192, 50, { k: 'tint', t: 'profile.ts', s: 'loadProfile() · 7.5', mono: 1 }),
  S.box(314, 60, 130, 50, { k: 'info', t: 'CredGate', s: 'check() · 7.3', mono: 1 }),
  S.box(314, 142, 130, 50, { k: 'idle', dash: 1, t: 'EAS 合约', s: '外部，已部署', mono: 1 }),
  S.box(314, 224, 130, 50, { k: 'idle', dash: 1, t: 'EAS GraphQL', s: '加上 ENS 解析', mono: 1 }),
  S.box(506, 142, 130, 50, { k: 'key', t: 'CredResolver', s: 'onAttest · 7.1', mono: 1 }),
  S.box(506, 224, 130, 50, { k: 'ok', t: 'CredBadge', s: 'mintFor · 7.2', mono: 1 }),
  S.arrow(218, 85, 312, 85, { k: 'plain', label: 'check' }),
  S.arrow(218, 167, 312, 167, { k: 'plain', label: 'attest' }),
  S.arrow(218, 249, 312, 249, { k: 'info', dash: 1, label: '只读' }),
  S.arrow(379, 112, 379, 140, { k: 'plain' }),
  S.arrow(446, 167, 504, 167, { k: 'plain', label: 'onAttest' }),
  S.arrow(571, 194, 571, 222, { k: 'plain' }),
  S.text(330, 316, '签发：worker → EAS → CredResolver → CredBadge；校验：route → CredGate → EAS', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '写路径（签发）：worker.ts 调 EAS，EAS 调 CredResolver，CredResolver 调 CredBadge 铸徽章。'],
  ['key', '读路径（校验）：route.ts 调 CredGate，CredGate 直接读 EAS 并向 CredResolver 查签发方，不依赖索引。'],
  ['limit', 'profile.ts 只读 GraphQL 和 ENS 做展示，延迟或宕机不影响访问控制。']
], '链下 route.ts、worker.ts、profile.ts 三个文件，分别调用链上的 CredGate、EAS 和 EAS GraphQL；EAS 调 CredResolver，CredResolver 调 CredBadge。', 'm09-6')}
<h3>7.1 CredResolver：签发方白名单 + 自动发徽章</h3>
<p>继承 EAS 合约库里的 <code>SchemaResolver</code>，实现 <code>onAttest</code> 和 <code>onRevoke</code>。基类已经保证这两个函数只会被 EAS 合约调用${cite('EAS 合约：SchemaResolver.sol', 'https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/resolver/SchemaResolver.sol')}。</p>
${code('SOLIDITY', `
import {SchemaResolver} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import {IEAS, Attestation} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICredBadge { function mintFor(address to, bytes32 uid) external; function burnFor(bytes32 uid) external; }

contract CredResolver is SchemaResolver, Ownable {
    ICredBadge public immutable badge;
    bytes32 public courseSchema;               // schema UID 依赖本合约地址，注册后再写入
    mapping(address => bool) public isIssuer;
    event IssuerSet(address indexed issuer, bool active);

    constructor(IEAS eas, ICredBadge b, address owner) SchemaResolver(eas) Ownable(owner) { badge = b; }

    function setIssuer(address i, bool on) external onlyOwner { isIssuer[i] = on; emit IssuerSet(i, on); }
    function setCourseSchema(bytes32 uid) external onlyOwner { courseSchema = uid; }

    // EAS 写入凭证前调用；返回 false 则整条凭证签发失败
    function onAttest(Attestation calldata a, uint256 value) internal override returns (bool) {
        if (value != 0 || !isIssuer[a.attester] || a.recipient == address(0)) return false;
        if (a.schema == courseSchema) {
            (, uint8 score, , ) = abi.decode(a.data, (string, uint8, uint64, bytes32));
            if (score > 100) return false;
            if (score >= 60) badge.mintFor(a.recipient, a.uid);   // 及格线 60（示例）
        }
        return true;
    }

    // 撤销时同步销毁徽章；“只有原签发方能撤销”由 EAS 保证
    function onRevoke(Attestation calldata a, uint256) internal override returns (bool) {
        if (a.schema == courseSchema) badge.burnFor(a.uid);
        return true;
    }
}
`)}
${call('info', '<p>schema UID 由 schema 字符串、resolver 地址和 revocable 三者计算得出，所以顺序是：先部署徽章和 Resolver → 用 Resolver 地址注册 schema → 把得到的 UID 写回 <code>setCourseSchema</code>。另外注意：EAS 只允许<strong>原签发方</strong>撤销凭证。签发方离职被移除后，它签过的凭证仍需要原地址撤销，所以签发方地址要由组织控制（KMS），不能是员工个人钱包。</p>')}

<h3>7.2 CredBadge：ERC-5192 灵魂绑定徽章</h3>
${code('SOLIDITY', `
contract CredBadge is ERC721 {
    event Locked(uint256 tokenId);                         // ERC-5192 事件
    error Soulbound();
    address public immutable resolver;
    uint256 private nextId = 1;
    mapping(bytes32 => uint256) public tokenOfAttestation; // 凭证 UID → 徽章 ID

    constructor(address r) ERC721("CredBoard Badge", "CRED") { resolver = r; }

    function mintFor(address to, bytes32 uid) external {
        require(msg.sender == resolver);
        tokenOfAttestation[uid] = nextId;
        _mint(to, nextId);          // 用 _mint 而不是 _safeMint：不回调接收方，避免签发中被重入
        emit Locked(nextId++);
    }
    function burnFor(bytes32 uid) external {
        require(msg.sender == resolver);
        uint256 id = tokenOfAttestation[uid];
        if (id != 0) { delete tokenOfAttestation[uid]; _burn(id); }
    }
    function locked(uint256 id) external view returns (bool) { _requireOwned(id); return true; }

    // 只允许铸造（from = 0）和销毁（to = 0），任何转让都回滚
    function _update(address to, uint256 id, address auth) internal override returns (address) {
        if (_ownerOf(id) != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, id, auth);
    }
    function supportsInterface(bytes4 i) public view override returns (bool) {
        return i == 0xb45a3c0e || super.supportsInterface(i);  // ERC-5192 接口 ID
    }
}
`)}
<p>ERC-5192 只要求 <code>locked()</code>、<code>Locked</code> / <code>Unlocked</code> 事件和接口 ID <code>0xb45a3c0e</code>，并规定锁定的 token 在转让时必须回滚${cite('ERC-5192：Minimal Soulbound NFTs', 'https://eips.ethereum.org/EIPS/eip-5192')}。这里有一个“鸡和蛋”问题：Resolver 构造时要徽章地址，徽章构造时要 Resolver 地址。部署脚本可以先用 CREATE2 或 nonce 预测 Resolver 地址，也可以把徽章的 resolver 改为一次性 setter。</p>

<h3>7.3 CredGate：链上访问控制</h3>
${code('SOLIDITY', `
// CredGate.check(user, uid)：五项检查缺一不可
Attestation memory a = eas.getAttestation(uid);
if (a.schema != requiredSchema) return (false, "wrong schema");      // ① schema 对
if (a.recipient != user) return (false, "not yours");                // ② 发给调用者，防止拿别人的 UID
if (!resolver.isIssuer(a.attester)) return (false, "untrusted");     // ③ 签发方可信
if (a.revocationTime != 0) return (false, "revoked");                // ④ 未撤销
if (a.expirationTime != 0 && a.expirationTime <= block.timestamp) return (false, "expired"); // ⑤ 未过期
return (true, "");
`)}
${call('warn', '<p>只检查“凭证存在”是最常见的漏洞：任何人都能用任意 schema 签发凭证。验证时必须同时检查 <strong>schema、接收人、签发方、撤销时间、过期时间</strong>五项，少一项就能被绕过。<code>isAttestationValid(uid)</code> 只说明 UID 存在，不检查其他四项。</p>')}

<h3>7.4 签发 Worker：幂等上链</h3>
<p>EAS SDK 基于 ethers v6。新版 SDK 的 <code>attest()</code> 先构造交易，调用 <code>wait()</code> 时才发送并等待回执，返回新凭证的 UID${cite('EAS SDK README', 'https://github.com/ethereum-attestation-service/eas-sdk')}。</p>
${code('TYPESCRIPT', `
import { EAS, SchemaEncoder, NO_EXPIRATION, ZERO_BYTES32 } from '@ethereum-attestation-service/eas-sdk'
import { ethers } from 'ethers'
import { db } from './db'            // PostgreSQL 访问封装
import { kmsSigner } from './kms'    // 返回 ethers Signer，私钥留在 KMS

const eas = new EAS('0x4200000000000000000000000000000000000021') // Base / Base Sepolia 预部署
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const enc = new SchemaEncoder('string courseId,uint8 score,uint64 completedAt,bytes32 evidenceHash')

export async function processOne() {
  const job = await db.claimNext()                 // SELECT ... FOR UPDATE SKIP LOCKED
  if (!job) return
  if (job.txHash) {                                // 崩溃恢复：先查链上，不要重发
    const rc = await provider.getTransactionReceipt(job.txHash)
    if (rc?.status === 1) return db.confirmFromReceipt(job.id, rc)
  }
  eas.connect(await kmsSigner(job.issuer, provider))
  const f = job.payload
  const data = enc.encodeData([
    { name: 'courseId', value: f.courseId, type: 'string' },
    { name: 'score', value: f.score, type: 'uint8' },
    { name: 'completedAt', value: BigInt(f.completedAt), type: 'uint64' },
    { name: 'evidenceHash', value: ethers.keccak256(ethers.concat([job.evidenceSalt, ethers.toUtf8Bytes(f.evidenceJson)])), type: 'bytes32' },
  ])
  try {
    const tx = await eas.attest({ schema: job.schemaUid,
      data: { recipient: job.recipient, expirationTime: NO_EXPIRATION, revocable: true, refUID: ZERO_BYTES32, data } })
    const uid = await tx.wait(2)                   // 发送并等 2 个确认，返回凭证 UID
    await db.confirm(job.id, { uid, txHash: tx.receipt!.hash })
  } catch (e: any) {
    // Resolver 拒绝属于永久失败，不自动重试；网络错误回到队列
    await db.fail(job.id, String(e?.message).slice(0, 500), /InvalidAttestation/.test(String(e?.message)))
  }
}
`)}
<p>链下凭证用同一个编码器：<code>const offchain = await eas.getOffchain()</code>，再调用 <code>offchain.signOffchainAttestation({...}, signer)</code>，把返回的签名对象交给用户保存；验证方用 <code>verifyOffchainAttestationSignature</code> 校验签名，并查询链上是否被 <code>revokeOffchain</code> 撤销。</p>

<h3>7.5 声誉档案：ENS + EAS GraphQL</h3>
${code('TYPESCRIPT', `
import { createPublicClient, http, getAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const l1 = createPublicClient({ chain: mainnet, transport: http(process.env.L1_RPC) })

export async function loadProfile(addr: string, schemaIds: string[], trusted: string[]) {
  const address = getAddress(addr)
  // 1. 反向解析后再正向解析：名字必须指回同一地址，否则不展示
  const name = await l1.getEnsName({ address })
  const ok = !!name && (await l1.getEnsAddress({ name: normalize(name) })) === address
  const ens = ok ? {
    name,
    avatar: await l1.getEnsAvatar({ name: normalize(name!) }),
    github: await l1.getEnsText({ name: normalize(name!), key: 'com.github' }),
  } : null
  // 2. EAS GraphQL：指定 schema、未撤销、发给该地址
  const query = 'query P($r: String!, $s: [String!]) { attestations(where: { recipient: { equals: $r }, schemaId: { in: $s }, revoked: { equals: false } }) { id attester time expirationTime decodedDataJson } }'
  const res = await fetch('https://base-sepolia.easscan.org/graphql', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { r: address, s: schemaIds } }),
  }).then(r => r.json())
  // 3. 只采信可信签发方（比较前统一大小写）
  const items = res.data.attestations.filter((a: any) => trusted.includes(getAddress(a.attester)))
  return { address, ens, attestations: items }
}
`)}
<p>EAS 浏览器为各条链提供 GraphQL 接口（例如 base-sepolia.easscan.org/graphql），可以按 recipient、schemaId、revoked 过滤。档案页可以用它起步，但 7.3 的访问控制必须直接读合约。</p>

<h3>7.6 页面访问控制（Next.js Route Handler）</h3>
<p><code>app/api/gate/route.ts</code> 做三步：① 从 SIWE 会话取出已登录地址（未登录返回 401）；② 用 viem 的 <code>readContract</code> 调用 <code>CredGate.check(session.address, uid)</code>；③ 通过返回 200 和 <code>{ allowed: true }</code>，否则返回 403 和失败原因。地址只取自会话，绝不取自请求参数。</p>

<h2>8. 测试策略</h2>
${tbl(['层次', '用例（节选）', '工具'], [
  ['合约单元', '非签发方 attest 被拒；签发方 attest 成功且分数 ≥ 60 时铸徽章；分数 59 不铸；分数 101 被拒；撤销后徽章销毁；徽章 transferFrom 回滚；supportsInterface(0xb45a3c0e) 为 true', 'Foundry（在 setUp 里部署 SchemaRegistry 与 EAS）'],
  ['合约模糊', '任意分数、任意接收人、任意签发方组合下：徽章数量 = 有效且达标的凭证数；CredGate.check 与手写判定一致', 'forge 模糊测试 + 不变量测试'],
  ['分叉测试', '在 Base Sepolia 分叉上使用真实的预部署 EAS，完成注册 schema → 签发 → 撤销', 'anvil --fork-url'],
  ['服务集成', '同一 idempotencyKey 提交 10 次只产生 1 条凭证；Worker 在发交易后被杀，重启不重复签发；RPC 返回 5xx 时重试并告警', 'Testcontainers（PostgreSQL）+ anvil'],
  ['前端', 'ENS 反向解析与正向不一致时不显示名字；撤销的凭证不显示；GraphQL 超时显示降级提示', 'Playwright + 模拟接口'],
  ['安全', '用别人的 UID 调 enter 被拒；用自建 schema 签一条同名凭证被拒；签发方被移除后其新凭证被拒', 'Foundry + 红队清单'],
  ['压测', '批量签发 1,000 条：队列吞吐、链上确认时间、失败率', 'k6 调用 API + 链上监控']
])}
<p>合约测试的 setUp 顺序：部署 SchemaRegistry → 部署 EAS（构造参数为 registry）→ 部署徽章与 Resolver → 注册 schema → 登记签发方。关键断言：签发后 <code>badge.balanceOf(alice) == 1</code>；<code>vm.expectRevert(CredBadge.Soulbound.selector)</code> 后转让；撤销后余额回到 0。</p>

<h2>9. 部署与运维</h2>
${steps([
  '<strong>环境：</strong>local（anvil + 本地 EAS 部署）→ staging（Base Sepolia，测试 schema）→ production（Base 主网，正式 schema）。三套环境的 schema UID、合约地址、签发方地址分开配置。',
  '<strong>部署顺序：</strong>预测 Resolver 地址 → 部署 CredBadge → 部署 CredResolver（owner = Safe 多签）→ 用 SchemaRegistry 注册两条 schema → <code>setCourseSchema</code> → 部署 CredGate → Safe 提案 <code>setIssuer</code>。全部写成 forge script，地址输出到 deployments/&lt;chain&gt;.json。',
  '<strong>CI/CD：</strong>每个 PR 跑 forge test、slither、前端单测；合并到 main 部署 staging；打 tag 后人工审批部署 production。合约部署后在区块浏览器验证源码。',
  '<strong>密钥：</strong>管理员权限只在 Safe 多签（2/3 或 3/5）；签发方私钥在 KMS，Worker 的云身份只有“签名”权限；轮换签发方时先登记新地址、再移除旧地址（旧地址保留用于撤销）。企业密钥体系见 <a href="#m03-8">M07.9 企业钱包系统设计</a>。',
  '<strong>配置：</strong>可信签发方列表以链上 isIssuer 为准，前端和 API 启动时读取并缓存 5 分钟（示例）。'
])}
${tbl(['指标', '含义', '告警阈值（示例）'], [
  ['issuance_queue_depth', '待上链任务数', '> 500 持续 10 分钟'],
  ['issuance_confirm_seconds_p95', '入队到确认的时间', '> 120 秒'],
  ['issuance_failed_total', '永久失败数', '5 分钟内 > 5 条'],
  ['issuer_gas_balance_eth', '签发方地址余额', '< 0.05 ETH'],
  ['indexer_lag_seconds', 'GraphQL 最新凭证时间与链上最新事件的差', '> 120 秒'],
  ['issuer_set_events', '链上签发方变更', '任何一次变更都通知安全频道'],
  ['unexpected_attester_total', '用本项目 schema 但签发方不在白名单的签发尝试（被拒）', '> 0 即调查']
])}

<h2>10. 安全清单与威胁模型</h2>
${tbl(['威胁', '攻击路径', '影响', '缓解'], [
  ['伪造凭证', '攻击者用自己的地址或自建 schema 签一条看起来一样的凭证', '冒充学员或贡献者', 'Resolver 白名单；验证方检查 schema UID 和签发方，不按 schema 名字判断'],
  ['签发私钥泄露', 'Worker 主机被入侵', '批量签发假凭证', '私钥在 KMS；按签发方设每小时上限；异常签发量告警；Safe 立即 setIssuer(false) 并撤销可疑凭证'],
  ['管理员权限滥用', '单人控制 owner', '登记恶意签发方', 'owner 为 Safe 多签 + 链上事件告警；可加时间锁'],
  ['重放他人凭证', '把别人的 UID 提交给 CredGate', '越权访问', '检查 recipient == msg.sender；页面访问用 SIWE 会话中的地址'],
  ['撤销不生效', '验证方只读缓存或索引', '已撤销的人仍能进入', '关键判断直接读 getAttestation；缓存 TTL 短；订阅 Revoked 事件清缓存'],
  ['ENS 冒充', '攻击者把反向记录设成别人的名字', '档案页显示错误身份', '反向解析后再正向解析校验；名字只作展示，权限只认地址'],
  ['隐私泄露', '在 data 里写入成绩、姓名、邮箱', '永久公开、无法删除', '最小字段；证据只存加盐哈希；敏感凭证用链下凭证或 SDK 的 PrivateData（加盐 Merkle 树，只公开根，按需披露单个字段）' + cite('EAS SDK：private-data.ts', 'https://github.com/ethereum-attestation-service/eas-sdk/blob/master/src/private-data.ts')],
  ['女巫刷声誉', '一人多地址刷贡献积分', '声誉失真', '积分只来自可信签发方；贡献凭证需要人工审批；跨地址关联由签发方在链下 KYC 处理（如需要）'],
  ['徽章合约重入', '铸造回调到恶意接收合约', '签发流程被打断', '用 _mint 而不是 _safeMint；Resolver 不持有资金']
])}
${call('warn', '<p>链上数据永久公开，撤销只是“标记无效”，原始数据仍可从历史区块读出。在 GDPR 等隐私法规下，个人数据上链可能带来合规问题（见 <a href="#m11-4">M05.4 主要法域</a>）。默认把个人信息留在链下，只把哈希或承诺上链。本篇不构成法律意见。</p>')}

<h2>11. 里程碑计划（5 周）</h2>
${tbl(['周', '交付物', '完成标准'], [
  ['第 1 周', 'schema 设计文档、CredBadge 与 CredResolver 合约、Foundry 单测', '单测覆盖第 8 节合约单元用例；本地 anvil 上能完成签发与撤销'],
  ['第 2 周', 'CredGate、部署脚本、Base Sepolia 部署与源码验证、Safe 管理', 'easscan 上能看到两条 schema 和测试凭证；setIssuer 通过 Safe 执行'],
  ['第 3 周', '签发 API、Worker、PostgreSQL、KMS 签名、批量签发与撤销', '幂等与崩溃恢复测试通过；1,000 条批量签发失败率 < 1%（示例）'],
  ['第 4 周', 'Next.js 前端：档案页（ENS + 凭证 + 徽章）、SIWE 登录、/members 访问控制', 'Playwright 用例通过；移动端 375px 可用'],
  ['第 5 周', '链下凭证与隐私模式、监控告警、威胁模型复核、演示视频与 README', '第 9 节指标上线并能触发；第 10 节每条威胁有对应测试或运维动作']
])}

<h2>12. 扩展方向与面试 / 作品集要点</h2>
${tbl(['扩展方向', '做法'], [
  ['跨组织互认', '建一个“可信签发方注册表”合约，由多个组织共同治理；验证方按注册表判断'],
  ['声誉评分', '按签发方权重 × 凭证类型 × 时间衰减计算分数，链下计算，定期把 Merkle 根上链供合约读取'],
  ['零知识出示', '用户证明“我持有某签发方的凭证且分数 ≥ 80”而不暴露地址和分数（见 <a href="#m10-7">M04.16 Merkle 成员证明</a>）'],
  ['链上社交', '把凭证展示到 Farcaster / Lens 档案，或作为社交图谱的信任信号（见 <a href="#m09-2">M11.2 链上社交</a>）'],
  ['空投与治理', '按凭证发放空投、计算 DAO 投票权重（见 <a href="#m02-61">M06.7 DAO 治理与运营</a>）'],
  ['多链', '同一组织在多条 L2 上签发，用索引器合并档案']
])}
<p><strong>面试时讲清楚这五点：</strong></p>
${steps([
  '为什么把签发方校验放在 Resolver 而不是只放在后端：后端被攻破时，链上规则仍然成立。',
  '验证凭证的五项检查（schema、接收人、签发方、撤销、过期），以及 isAttestationValid 为什么不够。',
  '幂等设计：数据库唯一键 + 发送前记录 + 崩溃后按 txHash 查链。',
  '隐私：链上只放最少字段和加盐哈希；链下凭证和 PrivateData 的取舍；撤销不等于删除。',
  '运维：签发方私钥在 KMS、管理员在 Safe、签发量和签发方变更都有告警。'
])}

${tryit(`<p><strong>最小可运行版本（一个下午）：</strong>不写代码，先在 easscan 上走通“注册 schema → 签发 → 查询 → 撤销”。</p>
${steps([
  '在钱包里切到 Base Sepolia，从官方水龙头领一点测试 ETH。',
  '打开 base-sepolia.easscan.org，进入 Schemas → Create Schema，填入 <code>string courseId,uint8 score,uint64 completedAt,bytes32 evidenceHash</code>，Resolver 留空，勾选 Revocable，提交，记下 schema UID。',
  '在该 schema 页面点 Attest with Schema，接收人填你的另一个地址，courseId 填 <code>sol-101</code>，score 填 92，提交。记下凭证 UID。',
  '在终端运行下面的 curl（把 SCHEMA_UID 换成你的），预期在返回的 decodedDataJson 里看到 sol-101 和 92：<br/><code>curl -s -X POST https://base-sepolia.easscan.org/graphql -H "content-type: application/json" -d &#39;{"query":"{ attestations(take: 5, where: { schemaId: { equals: \\"SCHEMA_UID\\" } }) { id attester recipient revoked decodedDataJson } }"}&#39;</code>',
  '回到凭证页面点 Revoke。再运行一次 curl，预期 revoked 变为 true。',
  '进阶：用 Foundry 部署本篇的 CredBadge 和 CredResolver，重新注册一条带 Resolver 的 schema，用一个未登记的地址签发，预期交易失败。'
])}`)}

${mistakes([
  ['凭证存在就说明可信。', '任何人都能用任意 schema 签发凭证。必须检查 schema UID、接收人、签发方、撤销时间和过期时间。'],
  ['撤销凭证会从链上删除它。', '撤销只是写入 revocationTime，原始数据仍在历史里。个人信息从一开始就不能上链。'],
  ['ENS 反向解析出的名字就是这个地址的名字。', '任何人都能把反向记录设成任意名字。要再正向解析，确认名字指回同一地址；权限只认地址。'],
  ['签发方被移除后，它签过的凭证可以由管理员撤销。', 'EAS 只允许原签发方撤销。签发方地址要由组织长期控制，移除后仍保留撤销能力。'],
  ['档案页和访问控制都用 GraphQL 就够了。', '索引可能延迟或宕机。展示可以用索引，访问控制必须直接读合约。']
])}
${recap([
  'CredBoard 由 EAS（凭证）、CredResolver（签发方白名单 + 徽章联动）、CredBadge（ERC-5192）、CredGate（访问控制）、签发服务和 Next.js 前端组成。',
  'Resolver 在 EAS 内部同步执行，返回 false 就拒绝整条凭证；这是“即使后端被攻破，规则仍成立”的关键。',
  '验证凭证要查五项：schema、接收人、签发方、撤销、过期。',
  '签发服务用唯一键、发送前记录和按 txHash 查链实现幂等；私钥在 KMS，管理员在 Safe。',
  '隐私默认链下：最少字段、加盐哈希、链下凭证、PrivateData；撤销不等于删除。',
  '5 周交付：合约 → 部署 → 服务 → 前端 → 隐私与运维。'
])}
${quiz([
  { q: 'CredGate 只调用 <code>isAttestationValid(uid)</code> 判断是否放行，会有什么问题？', o: ['没有问题', 'Gas 太高', '它只说明 UID 存在，攻击者可以用自建 schema 或别人的 UID 通过', '它会修改凭证状态'], a: 2, why: 'isAttestationValid 只检查 UID 是否存在。还必须检查 schema、接收人、签发方、撤销和过期。' },
  { q: 'Resolver 的 onAttest 返回 false 时会发生什么？', o: ['整条凭证签发失败，交易回滚', '凭证写入但标记为无效', '凭证写入，只是不铸徽章', 'EAS 会自动重试'], a: 0, why: 'EAS 在写入前调用 Resolver，返回 false 时 EAS 回滚，凭证和徽章都不会产生。' },
  { q: '签发方 A 已被 setIssuer(false) 移除。它以前签过的一条凭证需要撤销，谁能撤销？', o: ['合约 owner', '任何签发方', '凭证接收人', '签发方 A 的地址'], a: 3, why: 'EAS 只允许原签发方撤销。所以签发方地址必须由组织长期控制，不能是员工个人钱包。' },
  { q: '档案页显示 ENS 名字前，为什么要做一次正向解析？', o: ['为了获取头像', '反向记录可以被设成任意名字，正向解析确认名字确实指回这个地址', 'viem 要求这样调用', '为了节省 RPC 请求'], a: 1, why: '反向记录由地址持有人自己设置，可能冒用别人的名字。正向解析结果与地址一致，才说明这个名字属于该地址。' },
  { q: '以下哪项<strong>最不</strong>适合直接写进链上凭证的 data？', o: ['课程 ID', '学员邮箱', '证据的加盐哈希', '完成时间'], a: 1, why: '邮箱是个人信息，上链后永久公开且无法删除。其他三项是验证方需要的最小信息。' }
])}
${exercises([
  ['组织想让凭证在 1 年后自动失效，学员需要重新考核。你要改哪些地方？', '<p>签发时把 expirationTime 设为签发时间 + 365 天；CredGate 和档案页已经检查过期，不用改；Resolver 可以加一条检查：课程凭证的 expirationTime 不能为 0 且不能超过 400 天，防止签发方忘记设置；徽章要么在过期后由运营批量撤销对应凭证以销毁，要么在 locked 之外增加一个“是否有效”的查询，前端据此显示灰色。</p>'],
  ['签发 Worker 发出交易后进程被杀，数据库里状态是 SUBMITTING、有 txHash。重启后应该怎么做？', '<p>先用 txHash 查回执：成功则从回执的 Attested 事件里解析 UID，标记 CONFIRMED；失败则看错误原因，Resolver 拒绝就标 FAILED，否则回到 QUEUED；查不到回执且该 nonce 已被其他交易使用，说明交易被替换，按替换交易的结果处理；仍在内存池中则等待或加价替换。绝不能直接再发一笔新的 attest。</p>'],
  ['计算题（示例）：一次 attest（含 Resolver 和铸徽章）消耗 250,000 Gas，Base 上 Gas 价格 0.01 gwei，ETH 价格 3,000 美元。签发 10,000 条的 L2 执行费是多少？', '<p>每条 = 250,000 × 0.01 gwei = 2,500 gwei = 0.0000025 ETH ≈ 0.0075 美元。10,000 条 ≈ <strong>75 美元</strong>。另外还有 L1 数据费，随 L1 拥堵变化，要在测试网实测后留出余量。</p>']
])}
${checklist([
  '能写出带签发方白名单、分数校验和徽章联动的 CredResolver，并解释 schema UID 与 Resolver 地址的依赖顺序。',
  '能实现 ERC-5192 徽章，并用测试证明它不能转让、撤销后会销毁。',
  '能写出检查五项条件的 CredGate，并说清 isAttestationValid 为什么不够。',
  '能实现幂等的签发 Worker，并处理“发出交易后崩溃”的恢复。',
  '能用 viem 解析并校验 ENS 档案，用 EAS GraphQL 读取凭证。',
  '能讲清本项目的隐私设计和 5 条以上威胁及缓解措施。'
])}
${terms([
  ['凭证', 'Attestation', '签发方对接收人做出的、带签名并可撤销的结构化声明。'],
  ['Schema UID', 'Schema UID', '由 schema 字符串、resolver 地址和是否可撤销计算出的唯一标识。'],
  ['解析器合约', 'Schema Resolver', '在 EAS 签发和撤销凭证时被调用、可以拒绝凭证的合约。'],
  ['链下凭证', 'Offchain attestation', '只做 EIP-712 签名、不上链的凭证，由持有人保存和出示。'],
  ['灵魂绑定代币', 'Soulbound Token (ERC-5192)', '不可转让的 NFT，用 locked() 表示锁定状态。'],
  ['正向验证', 'Forward verification', '反向解析出名字后，再用名字正向解析，确认指回同一地址。'],
  ['幂等键', 'Idempotency key', '让同一请求多次提交只产生一次效果的唯一标识。']
])}
` });

})();
