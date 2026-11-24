/* ---------- M13 Web3 应用赛道（1）：总览 m09 · m09-1 身份 · m09-2 社交 · m09-3 存储与 DePIN ---------- */
(() => {
CUR = 'm09';
addCh({ id: 'm09', nav: '更多应用赛道', title: 'M13 更多应用赛道：身份、社交、存储、RWA 与游戏', html: `
<h1>M13 更多应用赛道：身份、社交、存储、RWA 与游戏</h1>
${meta(['说出六个应用赛道（身份、社交、存储与 DePIN、RWA 与支付、游戏、NFT 市场与 Memecoin）各自要解决的问题，以及它们依赖哪些基础设施。', '为一个应用想法判断：哪些数据必须上链，哪些放链下，信任落在谁身上。', '按本模块的顺序，做出一个“链上凭证与声誉”DApp，并能讲清它用到的每一块积木。'], '<a href="#m02">M02 智能合约开发</a>、<a href="#m13">M08 DeFi 协议</a>、<a href="#m07">M03 Web3 大前端</a>')}

<h2>1. 一句话理解</h2>
${one('学完合约（M02）和前端（M03），你已经会“造零件”。本模块回答下一个问题：这些零件能拼出什么产品？我们看六个赛道，每个赛道都拆成三层：用户看到什么、协议怎么设计、底下依赖哪些链和服务。')}
${call('analogy', `<p>公链和基础设施像一座城市的道路、水和电。合约和钱包像建筑材料。应用赛道是城市里的店铺：身份是“户籍和证件”，社交是“广场和信箱”，存储是“仓库”，RWA 和支付是“银行和收银台”，游戏是“游乐场”。</p>
<p>类比的局限：城市的店铺由政府发牌照；Web3 的大多数协议无需许可，任何人都能开店，所以“谁来背书、谁来担责”要在设计里写清楚。</p>`)}

<h2>2. 本模块讲什么，不讲什么</h2>
<p>手册里已经有三个模块专门讲金融类应用。本模块<strong>不重复</strong>它们，只在需要时链接：</p>
${tbl(['主题', '在哪里讲', '本模块怎么处理'], [
  ['ERC-20、NFT、稳定币、AMM、借贷', '<a href="#m02">M02 智能合约开发</a>、<a href="#m13">M08 DeFi 协议</a>（例如 <a href="#m02-50">M02.6 NFT 与代币发行</a>、<a href="#m02-9">M08.1 稳定币</a>）', '直接使用，不再解释原理'],
  ['中心化与去中心化交易所', '<a href="#m04">M10 交易所：CEX 与 DEX</a>', '只在 RWA 二级流动性处引用'],
  ['预测市场、永续合约', '<a href="#m08">M11 预测市场与衍生品</a>', '不涉及'],
  ['Agent 支付、账户抽象', '<a href="#m06-7">M12.6 Agent 支付</a>、<a href="#m06-5">M09.8 账户抽象深入</a>', '支付与游戏的免 Gas 体验处引用'],
  ['零知识证明', '<a href="#m10-1">M06.1 零知识证明直觉</a>', '身份的隐私方案处引用']
])}

<h2>3. 一张图：赛道和它们依赖的基础设施</h2>
${mm('六个应用赛道依赖哪些基础设施', `
flowchart LR
  subgraph APP["应用赛道（本模块）"]
    ID["M13.1 身份<br/>ENS · DID · EAS"]
    SO["M13.2 社交<br/>Farcaster · Lens"]
    ST["M13.3 存储与 DePIN<br/>IPFS · Filecoin · Helium"]
    RWA["M13.4 RWA 与支付<br/>代币化国债 · 稳定币"]
    GM["M13.5 游戏<br/>资产 · 状态 · 经济"]
    NF["M13.6 NFT 市场与 Memecoin<br/>Seaport · 版税 · 联合曲线"]
  end
  subgraph INF["已学过的基础设施"]
    SIG["签名与登录<br/>M03.6"]
    TOK["代币与 NFT 标准<br/>M02.5 · M02.6"]
    L2["L2 与数据可用性<br/>M04.4 · M04.5"]
    OR["预言机与索引<br/>M04.10"]
    AA["账户抽象<br/>M09.8"]
  end
  ID --> SIG
  ID --> TOK
  SO --> ID
  SO --> L2
  ST --> OR
  RWA --> TOK
  RWA --> OR
  GM --> TOK
  NF --> TOK
  NF --> SIG
  GM --> AA
  GM --> L2
`, [
  ['flow', '箭头表示“依赖”。社交依赖身份（账户和名字），游戏依赖代币标准、L2 和账户抽象。'],
  ['key', '身份是其他赛道的地基：社交要知道“谁发的帖”，RWA 要知道“谁有资格持有”，游戏要知道“谁拥有这件装备”。所以本模块从身份开始。'],
  ['limit', '图只画主要依赖。真实项目还会用到跨链桥、钱包 SDK、合规服务等。'],
  ['risk', '每个赛道都有一个“链下信任点”：ENS 链下名字依赖网关，社交数据依赖链下网络，RWA 依赖托管人和法律文件，DePIN 依赖硬件的真实性。设计时先找出它。']
])}
${tbl(['赛道', '核心问题', '代表协议（示例）', '上链的是什么', '文章'], [
  ['身份', '“这个地址是谁、别人怎样为它作证”', 'ENS、W3C DID/VC、EAS、World ID', '名字记录、证明（attestation）或它的哈希', '<a href="#m09-1">M13.1</a>'],
  ['社交', '“我的关注关系和帖子能不能带走”', 'Farcaster、Lens', '账户、密钥、存储租金；帖子多在链下网络', '<a href="#m09-2">M13.2</a>'],
  ['存储与 DePIN', '“大文件放哪里；怎样用代币激励真实硬件”', 'IPFS、Filecoin、Arweave、Helium、Render', '存储证明、奖励结算；文件本身在链下', '<a href="#m09-3">M13.3</a>'],
  ['RWA 与支付', '“现实资产怎样上链，谁能持有；商户怎样收稳定币”', '代币化国债基金、稳定币收款', '份额代币、白名单、转账记录', '<a href="#m09-4">M13.4</a>'],
  ['游戏', '“哪些游戏状态值得上链，经济怎样不崩”', '链上资产游戏、全链游戏', '资产所有权，部分或全部游戏状态', '<a href="#m09-5">M13.5</a>'],
  ['NFT 市场与发行', '“NFT 怎样撮合成交，版税能不能强制；Meme 币怎样发行、怎样防被割”', 'Seaport、Blur、联合曲线发射台', '签名订单、版税设置、曲线池', '<a href="#m09-7">M13.6</a>']
])}

<h2>4. 阅读顺序与文章关系</h2>
${steps([
  '<a href="#m09-1">M13.1 链上身份</a>：ENS 解析、DID 与可验证凭证、EAS 证明、灵魂绑定代币、人格证明。后面每篇都会用到“地址 + 名字 + 证明”。',
  '<a href="#m09-2">M13.2 链上社交</a>：用 Farcaster 和 Lens 看“账户上链、内容在链下网络”的混合架构，以及 2026 年两个协议的治理变化。',
  '<a href="#m09-3">M13.3 去中心化存储与 DePIN</a>：内容寻址、Filecoin 与 Arweave 的保证、数据可用性和长期存储的区别、DePIN 的单位经济。',
  '<a href="#m09-4">M13.4 RWA 与链上支付</a>：许可型代币、代币化国债、稳定币收款与结算。',
  '<a href="#m09-5">M13.5 GameFi 与链上游戏</a>：资产上链、全链游戏、游戏经济与常见崩盘方式。',
  '<a href="#m09-7">M13.6 NFT 市场、版税与 Memecoin 发行</a>：签名订单和 Seaport、版税之争、联合曲线发射台，以及买币前的检查清单。',
  '<a href="#m09-6">M13.7 ★ 实战：链上凭证与声誉 DApp</a>：用 EAS 签发凭证，用 ENS 显示身份，把证明元数据放到 IPFS，再做一个声誉分查询前端。'
])}
${call('info', '<p>M13.1–M13.3 可以按顺序读；M13.4、M13.5、M13.6 相互独立，可以按兴趣先读其中一篇。动手做 M13.7 之前，至少读完 M13.1 和 M13.3。</p>')}

<h2>5. 学完能做什么</h2>
<ul>
  <li>给 DApp 加上 ENS 名字显示和正确的反向解析校验。</li>
  <li>设计一个 EAS schema，签发链上或链下证明，并在合约里用 resolver 限制签发者。</li>
  <li>读 Farcaster 数据，或做一个在 Farcaster 客户端里运行的 Mini App。</li>
  <li>为 NFT、前端或证明文件选择存储方案，并写出可用性监控。</li>
  <li>用“需求收入 / 代币排放”这类指标，评估一个 DePIN 或游戏项目的经济是否可持续。</li>
  <li>读懂一笔 Seaport 成交的签名订单，并给一个 Memecoin 做买前检查。</li>
</ul>
<p><strong>前置知识：</strong>能读写简单的 Solidity 合约（<a href="#m02-3">M02.3 Solidity 基础 II</a>），会用 viem 或 wagmi 读写合约（<a href="#m07-3">M03.3 读合约</a>、<a href="#m07-5">M03.5 写合约</a>），理解签名登录（<a href="#m07-6">M03.6 签名与登录</a>）。</p>
` });

CUR = 'm09-1';
addCh({ id: 'm09-1', nav: '链上身份', title: 'M13.1 链上身份：ENS、DID、可验证凭证与 EAS', desc: '名字怎样解析到地址，别人怎样为你作证，以及人格证明的隐私代价', html: `
<h1>M13.1 链上身份：ENS、DID、可验证凭证与 EAS</h1>
${meta(['画出 ENS 从名字到地址的解析流程（namehash → 注册表 → 解析器，含 CCIP-Read 链下名字），并正确实现“主名称”的双向校验。', '区分 DID、可验证凭证（VC）、EAS 证明和灵魂绑定代币（SBT）四种身份积木，并为一个场景选型。', '用 EAS SDK 注册 schema、签发链上和链下证明；说出 World ID、Human Passport 这类人格证明的隐私代价。'], '<a href="#m07-6">M03.6 签名与登录</a>、<a href="#m02-50">M02.6 NFT 与代币发行</a>')}
${beginner(`<p><strong>解析（Resolve）</strong>：把人能读的名字换成机器要用的数据，例如把 <code>vitalik.eth</code> 换成一个地址。</p>
<p><strong>声明 / 证明（Claim / Attestation）</strong>：某人用签名说“关于某主体，某件事为真”，例如“这个地址完成了课程 A”。</p>
<p><strong>签发者、持有者、验证者（Issuer / Holder / Verifier）</strong>：写证明的人、拿着证明的人、检查证明的人。</p>
<p><strong>女巫攻击（Sybil attack）</strong>：一个人控制很多账户，假装成很多人，用来多领空投或操纵投票。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上身份不是一张“身份证”，而是一组积木：地址是根；ENS 给地址一个人能读的名字；可验证凭证和 EAS 证明让别人用签名为你作证；灵魂绑定代币把证明固定在一个地址上；人格证明回答“这是不是一个独立的真人”。')}
${call('analogy', `<p>地址像门牌号，ENS 像门口的姓名牌，凭证像别人写给你的推荐信（信上有签名），灵魂绑定代币像刻在门上、搬不走的奖牌，人格证明像“这户只住着一个真人”的证明。</p>
<p>类比的局限：现实中门牌号由政府分配，丢了能补办；链上地址由私钥控制，私钥丢了，挂在这个地址上的名字、奖牌和推荐信都很难找回。</p>`)}
${art('一图看懂：地址是根，名字、证明、徽章、真人证明都挂在它上面', 660, 322, [
  S.box(10, 36, 200, 236, { k: 'key', icon: 'key', t: '地址（根）', s: '0x1111…（示例）\nEOA 或智能合约账户\n私钥或多签控制它', mono: 0 }),
  S.box(262, 36, 388, 50, { k: 'info', icon: 'globe', left: 1, t: '名字 · ENS', s: 'alice.eth ↔ 0x1111…，要双向校验' }),
  S.box(262, 100, 388, 50, { k: 'info', icon: 'doc', left: 1, t: '证明 · EAS 凭证', s: '签发方签名：某人完成了某门课程' }),
  S.box(262, 164, 388, 50, { k: 'info', icon: 'lock', left: 1, t: '徽章 · SBT（ERC-5192）', s: 'locked 为 true，不可转让' }),
  S.box(262, 228, 388, 44, { k: 'idle', dash: 1, icon: 'person', left: 1, t: '真人证明 · World ID 等', s: '可选：证明是独立的真人' }),
  S.arrow(212, 61, 260, 61, { k: 'plain' }),
  S.arrow(212, 125, 260, 125, { k: 'plain' }),
  S.arrow(212, 189, 260, 189, { k: 'plain' }),
  S.arrow(212, 250, 260, 250, { k: 'plain', dash: 1 }),
  S.text(330, 304, '私钥丢了，挂在这个地址上的名字、证明和徽章都跟着难找回', { size: 13.5, anchor: 'middle', k: 'risk', mw: 620 })
], [
  ['flow', '身份不是一张证件，而是一个地址加上别人给它的各种记录。应用读取时，先认地址，再读名字、证明和徽章。'],
  ['key', '地址是根。所有积木都只是“指向这个地址的记录”，换一个地址就是另一个身份。'],
  ['risk', '根丢了，上面的都危险。重要身份应放在多签或带恢复机制的智能账户上。'],
  ['limit', '真人证明是可选的一层，用来防女巫（一人开很多号），但各方案都有取舍。']
], '左边是一个地址，右边四条记录指向它：ENS 名字、EAS 凭证、不可转让的 SBT 徽章和可选的真人证明。', 'm09-1')}

<h2>2. 身份积木全景</h2>
${recall('<p>“用钱包签名登录网站”（Sign-In with Ethereum，SIWE，ERC-4361）以及 EIP-1271 合约钱包验签，已经在 <a href="#m07-6">M03.6 签名与登录</a> 完整讲过。本篇不重复登录流程，只讲登录之后“这个地址是谁、有哪些证明”。</p>')}
${layers('链上身份的五层积木', [
  { name: '根：密钥与账户', sub: 'EOA 或智能合约账户', chips: ['私钥', '多签', '社交恢复（M09.8）'], kind: 'l1' },
  { name: '名字', sub: '人能读的标识符', chips: ['ENS 名字', '子名称', '反向记录'] },
  { name: '声明与凭证', sub: '别人为你作证', chips: ['W3C VC', 'EAS 证明', 'SBT（ERC-5192）'], kind: 'key' },
  { name: '人格证明', sub: '是不是一个独立真人', chips: ['World ID', 'Human Passport'], kind: 'risk' },
  { name: '应用', sub: '读取以上各层', chips: ['SIWE 登录', '空投资格', '治理投票权', '声誉分'] }
], [
  ['flow', '应用从下往上读：先确认地址（登录），再读名字，再读这个地址收到了哪些证明，必要时再要求人格证明。'],
  ['key', '每一层都可以单独替换。例如不用 ENS 也能用 EAS；不用 SBT 也能用可撤销的 EAS 证明。'],
  ['risk', '根层丢失（私钥泄露或丢失）会让上面所有层失效。所以重要身份应放在可恢复的账户上，例如多签或带恢复机制的智能账户。'],
], ['给地址起名', '别人为它作证', '证明是真人', '应用读取'])}

<h2>3. ENS：名字怎样解析到地址</h2>
<p><strong>以太坊域名服务（Ethereum Name Service，ENS）</strong>把 <code>alice.eth</code> 这样的名字映射到地址、其他链的地址、文本记录（头像、推特）和内容哈希（IPFS 网站）。它有三个核心概念：</p>
<ul>
  <li><strong>namehash</strong>：把名字转成一个 32 字节的 <code>node</code>。算法从右往左递归：<code>node = keccak256(父 node ‖ keccak256(标签))</code>，根 node 是 32 个零字节。合约里只认 node，不认字符串。</li>
  <li><strong>注册表（Registry）</strong>：记录每个 node 的所有者和它的<strong>解析器（Resolver）</strong>地址。</li>
  <li><strong>解析器</strong>：真正存放记录的合约，提供 <code>addr(node)</code>、<code>text(node, key)</code>、<code>contenthash(node)</code> 等函数。</li>
</ul>
<p>ENS 官方文档要求应用通过 <strong>Universal Resolver</strong> 做一次调用：它在内部沿注册表层级找到负责的解析器，处理通配符解析（ENSIP-10）和 CCIP-Read，并返回记录。应用不应写死某个名字的解析器${cite('ENS 文档：Resolution', 'https://docs.ens.domains/resolution')}。viem、ethers 这类库的 ENS 函数已经走这条路径。</p>
${mm('一次 ENS 正向解析（含链下名字分支）', `
sequenceDiagram
  participant A as 应用
  participant U as Universal Resolver
  participant R as 注册表
  participant S as 解析器
  participant G as 链下网关
  A->>U: resolve 名字 alice.eth 和 addr 调用
  U->>R: 按 namehash 逐级查找解析器
  R-->>U: 返回解析器地址
  U->>S: 调用 addr
  alt 链上名字
    S-->>U: 返回地址
  else 链下名字 CCIP-Read
    S-->>U: 抛出 OffchainLookup 错误 带网关 URL
    U-->>A: 把错误交给客户端
    A->>G: HTTP 请求网关
    G-->>A: 返回签名后的结果
    A->>U: 调用回调函数 附带网关结果
    U->>S: 回调中校验签名或证明
    S-->>U: 返回地址
  end
  U-->>A: 地址
`, [
  ['flow', '链上名字：一次 eth_call 就拿到结果。链下名字：合约先“拒绝”并告诉客户端去哪个网关取数据，客户端取回后再调一次回调函数。'],
  ['key', 'CCIP-Read（EIP-3668）的错误签名是 <code>OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)</code>。客户端必须检查 sender 等于被调用的合约。'],
  ['fail', '网关宕机：链下名字解析失败，应用应显示原始地址，不能显示空白或旧缓存。'],
  ['risk', '链下名字的信任落在“回调里怎样校验网关数据”。只校验一个网关签名，等于信任网关的私钥；用 L2 状态证明校验，信任落在 L2 上。'],
])}
<p>CCIP-Read 是 EIP-3668 定义的通用模式，状态为 Final${cite('EIP-3668: CCIP Read', 'https://eips.ethereum.org/EIPS/eip-3668')}。ENS 用它支持两类“链下名字”：放在 L2 上的名字，以及放在公司数据库里、免 Gas 发放的子名称（例如给每个用户发 <code>用户名.app.eth</code>）。</p>

<h3>反向记录与主名称：必须双向校验</h3>
<p>正向解析是“名字 → 地址”。显示用户名时需要反向：“地址 → 名字”。ENS 把地址编码成 <code>&lt;地址&gt;.addr.reverse</code> 下的一个名字，它的 name 记录给出一个<strong>候选</strong>主名称。任何人都能把自己地址的反向记录写成 <code>vitalik.eth</code>，所以应用必须再做一次正向解析：候选名字解析出的地址等于原地址，才能显示这个名字；否则显示地址${cite('ENS 文档：Resolution', 'https://docs.ens.domains/resolution')}。</p>
${code('TYPESCRIPT', `
import { createPublicClient, http, isAddressEqual } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({ chain: mainnet, transport: http(process.env.RPC_URL) })

// 反向得到候选名字，再正向复核；normalize 按 ENSIP-15 规范化，防同形字符
export async function displayName(address: \`0x\${string}\`) {
  const name = await client.getEnsName({ address })
  if (!name) return address
  const back = await client.getEnsAddress({ name: normalize(name) })
  return back && isAddressEqual(back, address) ? name : address
}
`)}
${call('warn', '<p>不要把 ENS 名字当作“已验证身份”。名字可以过期后被别人重新注册，也可以被所有者改指向。转账确认页要同时显示名字和完整地址，大额转账前让用户核对地址（见 <a href="#m07-8">M03.8 前端安全</a>）。</p>')}

<h3>2026 年的变化：ENSv2 留在以太坊 L1</h3>
<p>ENS Labs 原计划把 ENSv2 放到自己的 L2（Namechain），2026 年 2 月 6 日宣布取消，理由之一是过去一年 ENS 注册的 Gas 成本下降约 99%${cite('ENS Labs：ENS is staying on Ethereum（2026-02-06）', 'https://ens.domains/blog/post/ens-staying-on-ethereum')}。2026 年 10 月 27 日 ENSv2 在以太坊主网上线，每个名字可以有自己的注册表，已有名字继续可用${cite('ENS Labs：ENSv2 Is Live on Mainnet（2026-10-27）', 'https://www.ens.domains/blog/post/ensv2-live-on-mainnet')}。开发者要做的只有一条：<strong>通过 Universal Resolver 和主流库解析，不直接读 v1 注册表合约</strong>。</p>
<p><strong>算一算（示例）：</strong>一个应用要给 100,000 个用户每人发一个子名称。</p>
${steps([
  '链上发放：假设每个子名称约 100,000 Gas（假设值 ' + tag('推断') + '），Gas 价格 1 gwei，ETH 3,000 美元：单个 0.0001 ETH ≈ 0.30 美元，总计约 30,000 美元。',
  '链下发放（CCIP-Read）：子名称存在应用数据库里，链上只部署一个解析器，发放成本接近 0。',
  '代价：名字的真实性取决于网关和签名密钥；应用关闭，名字也失效。'
])}

<h2>4. DID 与可验证凭证：W3C 标准</h2>
<p><strong>去中心化标识符（Decentralized Identifier，DID）</strong>是 W3C 标准。DID Core 1.0 在 2022 年 7 月 19 日成为 W3C 推荐标准；1.1 版在 2026 年 3 月发布为候选推荐${cite('W3C：DID Core v1.0', 'https://www.w3.org/TR/did-core/')}${cite('W3C：DIDs v1.1 Candidate Recommendation（2026-03-05）', 'https://www.w3.org/TR/2026/CR-did-1.1-20260305')}。格式是 <code>did:方法:方法内标识符</code>，例如 <code>did:pkh:eip155:1:0xabc…</code>（直接用区块链地址）、<code>did:web:example.com</code>（用域名托管）、<code>did:ethr:0xabc…</code>（以太坊注册表）。每个 DID 解析出一份 <strong>DID 文档</strong>，里面列出公钥（verificationMethod）、哪个公钥可用于登录（authentication）以及服务端点（service）。</p>
<p><strong>可验证凭证（Verifiable Credential，VC）</strong>是 W3C 定义的“带签名的声明”格式。VC 2.0 系列规范在 2025 年 5 月成为 W3C 推荐标准，模型是签发者、持有者、验证者三方${cite('W3C：Verifiable Credentials 2.0 成为推荐标准（2025-05）', 'https://www.w3.org/press-releases/2025/verifiable-credentials-2-0')}。一个 VC 的主要字段：<code>@context</code>、<code>type</code>（例如 <code>CourseCompletionCredential</code>）、<code>issuer</code>（签发者的 DID）、<code>validFrom</code>、<code>credentialSubject</code>（主体的 DID 和声明内容，例如课程与成绩）、<code>proof</code>（签发者的签名）。</p>
<p>VC 的关键特点：<strong>默认不上链</strong>。持有者把 VC 存在自己的钱包里，需要时出示给验证者；验证者解析签发者的 DID，取出公钥验签。这比“把所有证明公开在链上”更保护隐私，但验证者要多做一步：检查签发者是否可信、凭证是否被撤销。</p>

<h2>5. EAS：以太坊上的通用证明层</h2>
<p><strong>以太坊证明服务（Ethereum Attestation Service，EAS）</strong>是一个开源、无需许可的证明协议。它只有两个核心合约：<code>SchemaRegistry</code>（登记证明的数据格式）和 <code>EAS</code>（签发、撤销证明）${cite('EAS 合约仓库与部署地址', 'https://github.com/ethereum-attestation-service/eas-contracts')}。</p>
${steps([
  '<strong>注册 schema</strong>：用类似 ABI 的字符串描述字段，例如 <code>string course, uint8 grade</code>。注册时还要指定一个可选的 resolver 合约和“是否可撤销”。schema UID 由 schema 字符串、resolver 地址和 revocable 三者哈希得到，所以同样三项只能注册一次。',
  '<strong>签发证明</strong>：签发者（attester）调用 <code>attest</code>，传入 schema UID、接收者（recipient）、过期时间、是否可撤销、引用的另一条证明（refUID）和 ABI 编码后的数据。合约返回一个证明 UID。',
  '<strong>撤销</strong>：如果 schema 可撤销，签发者可以调用 <code>revoke</code>。证明不会被删除，只会记录撤销时间。',
  '<strong>验证</strong>：任何人按 UID 读取证明，检查 schema、签发者、是否过期、是否撤销。'
])}
${compare('链上证明与链下证明', [
  { name: '链上证明', tag: 'attest 交易', kind: 'key', points: ['数据写入 EAS 合约，任何合约都能直接读取', '每条证明要付 Gas', '公开、永久可见，撤销只加标记', '适合：合约要据此放权（例如白名单、投票权）'] },
  { name: '链下证明', tag: 'EIP-712 签名', kind: 'info', points: ['签发者对证明数据签名，文件可放在任何地方（IPFS、数据库）', '免 Gas，可批量发', '持有者决定给谁看，隐私更好', '可选：把证明的 UID 在链上打时间戳；撤销也可以上链登记'] }
], [
  ['flow', '链下证明的验证在客户端完成：用 EIP-712 恢复签名者地址，再与可信签发者列表比对。'],
  ['key', '选型规则：合约要读它，就上链；只给人或后端看，就链下。'],
  ['risk', '链上证明公开永久。不要把姓名、邮箱、成绩明细等个人数据直接写进链上证明，只写哈希或分级结果。'],
])}
<p>EAS 在以太坊主网的合约地址是 <code>0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587</code>；在 OP Mainnet 和 Base 上是 OP Stack 预部署合约 <code>0x4200000000000000000000000000000000000021</code>，SchemaRegistry 是 <code>…0020</code>${cite('EAS 合约仓库与部署地址', 'https://github.com/ethereum-attestation-service/eas-contracts')}。下面用官方 SDK 在 Sepolia 上签发一条链上证明和一条链下证明${cite('EAS SDK 仓库 README', 'https://github.com/ethereum-attestation-service/eas-sdk')}：</p>
${code('TYPESCRIPT', `
// npm install @ethereum-attestation-service/eas-sdk ethers
import { EAS, SchemaEncoder, NO_EXPIRATION } from '@ethereum-attestation-service/eas-sdk'
import { ethers } from 'ethers'

const signer = new ethers.Wallet(process.env.ISSUER_KEY!, new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC)) // 测试私钥
const eas = new EAS('0xC2679fBD37d54388Ce493F1DB75320D236e1815e') // Sepolia
eas.connect(signer)

const schema = process.env.SCHEMA_UID! // 已注册的 'string course, uint8 grade'
const data = new SchemaEncoder('string course, uint8 grade').encodeData([
  { name: 'course', value: 'Web3 101 M13', type: 'string' },
  { name: 'grade', value: 90, type: 'uint8' },
])
const recipient = '0x1111111111111111111111111111111111111111'

// 1) 链上：发交易，确认后得到证明 UID
const tx = await eas.attest({ schema, data: { recipient, expirationTime: NO_EXPIRATION, revocable: true, data } })
const uid = await tx.wait()

// 2) 链下：只签名（EIP-712），不发交易
const offchain = await eas.getOffchain()
const att = await offchain.signOffchainAttestation({
  recipient, expirationTime: NO_EXPIRATION, time: BigInt(Math.floor(Date.now() / 1000)),
  revocable: true, schema, refUID: ethers.ZeroHash, data,
}, signer)
// 验证方：先验签，再查签发者是否在可信名单里
offchain.verifyOffchainAttestationSignature(await signer.getAddress(), att)
`)}
<p><strong>Resolver：在链上限制谁能签发。</strong>注册 schema 时可以绑定一个 resolver 合约。EAS 在每次签发和撤销时回调它，返回 false 交易就回滚。做法是继承 EAS 仓库里的 <code>SchemaResolver</code>，覆盖 <code>onAttest(Attestation calldata a, uint256 value)</code>，写一行 <code>return a.attester == academy;</code>，就只有学院多签能签发这个 schema 的证明。resolver 还能收费、检查数据字段、在签发时顺带铸造代币。</p>
${mm('一条 EAS 证明的生命周期', `
stateDiagram-v2
  state "链下已签名" as Signed
  state "链上有效" as Active
  state "已撤销" as Revoked
  state "已过期" as Expired
  [*] --> Signed: 签发者 EIP-712 签名
  [*] --> Active: attest 交易
  Signed --> Signed: 可选 链上时间戳
  Signed --> Revoked: revokeOffchain 登记
  Active --> Revoked: revoke 仅限可撤销 schema
  Active --> Expired: 超过 expirationTime
  Revoked --> [*]
  Expired --> [*]
`, [
  ['flow', '证明从不被删除。“撤销”和“过期”都是读取时检查的状态，验证方必须检查这两个字段。'],
  ['fail', '常见漏洞：验证代码只检查“证明存在、schema 对”，没有检查签发者、撤销时间和过期时间。'],
  ['key', '不可撤销的 schema 一旦签错就无法纠正。凭证类场景通常选可撤销。'],
])}

<h2>6. 灵魂绑定代币：ERC-5192</h2>
<p><strong>灵魂绑定代币（Soulbound Token，SBT）</strong>是不能转让的 NFT。ERC-5192 是最小接口，状态为 Final：在 ERC-721 基础上增加 <code>locked(tokenId)</code> 函数和 <code>Locked</code> / <code>Unlocked</code> 事件；<code>locked</code> 返回 true 时，所有转让函数必须回滚；接口 ID 是 <code>0xb45a3c0e</code>${cite('ERC-5192: Minimal Soulbound NFTs', 'https://eips.ethereum.org/EIPS/eip-5192')}。</p>
${code('SOLIDITY', `
// OpenZeppelin v5 的 ERC721：铸造、转让、销毁都经过 _update
contract CourseBadge is ERC721, Ownable, IERC5192 {
    error Soulbound();

    function issue(address to, uint256 id) external onlyOwner {
        _safeMint(to, id);
        emit Locked(id); // 铸造即锁定，要发出 Locked
    }

    function locked(uint256 id) external view returns (bool) { _requireOwned(id); return true; }

    // 只放行铸造（from = 0）和销毁（to = 0），其他转让一律回滚
    function _update(address to, uint256 id, address auth) internal override returns (address) {
        address from = _ownerOf(id);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, id, auth);
    }
}
`)}
<p>完整实现还要让 <code>supportsInterface</code> 对 <code>0xb45a3c0e</code> 返回 true，并给签发者一个 <code>_burn</code> 收回入口。SBT 和可撤销 EAS 证明能表达同一件事（“这个地址完成了课程”）。区别在于：SBT 是 NFT，钱包和 NFT 市场能直接显示；EAS 证明格式更灵活，支持链下、过期、撤销和引用。SBT 的两个硬伤要在设计里处理：<strong>换钱包</strong>（私钥丢失后，签发者只能销毁旧的再给新地址补发）和<strong>隐私</strong>（证明永远公开挂在地址上）。</p>

<h2>7. 人格证明：抗女巫的代价</h2>
<p><strong>人格证明（Proof of Personhood）</strong>要回答“这个账户背后是不是一个独立的真人”。它用于空投、一人一票、反机器人。两类代表方案：</p>
${tbl(['方案', '怎么证明', '抗女巫强度', '隐私与排除代价'], [
  ['World ID（World / Tools for Humanity）', '专用设备 Orb 扫描虹膜，生成唯一性凭证；应用侧用零知识证明（见 <a href="#m10-1">M06.1</a>）证明“我是已验证的人”，不暴露是谁', '强：一个人只能注册一次', '采集生物特征。多国监管机构已暂停或叫停：例如肯尼亚高等法院在 2025 年 5 月裁定其须在 7 天内删除在当地收集的生物特征数据' + cite('Decrypt：肯尼亚法院命令删除生物特征数据（2025-05-06）', 'https://decrypt.co/318029/kenyan-court-orders-sam-altmans-crypto-project-delete-bi-user-data') + '；需要到线下 Orb 网点'],
  ['Human Passport（原 Gitcoin Passport）', '收集多种“戳记”（stamps）：社交账号、链上历史、手机号、证件或生物特征等，按权重算出一个分数', '中：分数可被刷，但成本随戳记数量上升', '把多个账号关联到一个地址，有关联暴露风险；没有这些账号的人分数低。2025 年 2 月被 Holonym 收购并改名' + cite('Biometric Update：Holonym 收购 Gitcoin Passport（2025-02）', 'https://www.biometricupdate.com/202502/holonym-acquires-gitcoin-passport-in-proof-of-personhood-expansion')]
])}
<p>World 自称截至 2026 年 4 月已在 160 个国家验证超过 1,800 万人；同一报道列出了巴西、西班牙、葡萄牙、香港、德国、印度尼西亚、菲律宾、泰国等地的叫停或限制措施${cite('Rest of World：World 的合作与各国监管（2026-04-27）', 'https://restofworld.org/2026/sam-altman-worldcoin-zoom-tinder-partnerships/')}。工程上的结论：</p>
${steps([
  '先问“错放一个机器人的损失有多大”：小额活动用行为评分即可，一人一票的治理才值得用强人格证明。',
  '只接收“是否通过”的结果或零知识证明，不保存生物特征和原始证件；并提供替代路径，避免排除没有 Orb 网点或社交账号的人。',
  '上线前做合规评估（见 <a href="#m11-2">M07.2 KYC、AML 与制裁筛查</a>）。本文不构成法律意见。'
])}

${tryit(`<p><strong>动手练习：</strong>解析一个 ENS 名字，再在测试网签发一条证明。</p>
${steps([
  '安装 Foundry 后运行 <code>cast resolve-name vitalik.eth --rpc-url https://ethereum-rpc.publicnode.com</code>，记下地址；再运行 <code>cast lookup-address &lt;上一步的地址&gt; --rpc-url …</code>，确认反向解析回同一个名字。',
  '打开 <a href="https://sepolia.easscan.org" target="_blank" rel="noopener">sepolia.easscan.org</a>，连接测试钱包，用 “Create Schema” 注册 <code>string course, uint8 grade</code>（可撤销）。',
  '在这个 schema 下签发一条链下证明（Offchain）和一条链上证明（Onchain），接收者填你自己的另一个测试地址。',
  '在 easscan 上打开链上证明，找到 UID、attester、revocable、expirationTime；然后撤销它，刷新后确认 revocationTime 不再是 0。'
])}
<p>预期结果：你能说出链上证明和链下证明在 easscan 上的显示区别，并解释撤销后证明为什么还在。</p>`)}

${exercises([
  ['一个 DApp 用 <code>getEnsName</code> 拿到名字就直接显示，没有再做正向解析。攻击者能怎样利用？', '<p>攻击者把自己地址的反向记录设成一个知名名字（例如某交易所的名字）。DApp 在排行榜、聊天或收款页上把攻击者地址显示成这个知名名字，诱导用户转账或信任。修复：显示前正向解析候选名字，结果等于原地址才显示；不一致就显示地址。</p>'],
  ['你要给“完成 M13 课程”的学员发证明。合约要据此开放一个高级频道的门票领取。选 EAS 链上证明、EAS 链下证明还是 SBT？写出理由。', '<p>选 <strong>EAS 链上证明</strong>（或 SBT）。门票合约要在链上读取证明来判断资格，链下证明合约读不到。EAS 链上证明比 SBT 多了过期、撤销和 refUID，且可以用 resolver 限制只有学院多签能签发。为保护隐私，数据里只写课程编号和“通过”，不写分数明细和姓名。</p>'],
  ['为什么说 SBT 的“不可转让”同时是优点和缺点？给出一个补救设计。', '<p>优点：证明不能被买卖，地址的声誉不能直接出售。缺点：私钥丢失或想换钱包时，证明也跟着丢。补救：签发者保留 burn 权限，用户用新地址重新验证后，签发者销毁旧 SBT 并补发到新地址；或把 SBT 发给可恢复的智能账户，而不是 EOA。</p>']
])}
${checklist([
  '能画出 ENS 正向解析的时序，包括 CCIP-Read 链下分支。',
  '能写出带双向校验的 displayName 函数。',
  '能说出 DID、VC、EAS 证明、SBT 分别解决什么问题。',
  '能在 Sepolia 注册 schema 并签发链上、链下证明，并撤销一条。',
  '能写一个只允许指定签发者的 EAS resolver 合约。',
  '能比较 World ID 和 Human Passport 的抗女巫强度与隐私代价。'
])}
${mistakes([
  ['反向记录指向某个名字，就说明这个地址拥有这个名字。', '任何人都能把反向记录写成任意名字。必须正向解析候选名字，结果等于原地址才可信。'],
  ['链上证明能删除，所以写个人数据没关系。', '撤销只是加一个时间标记，原数据永远在链上。个人数据只能写哈希或放链下证明。'],
  ['验证 EAS 证明只要查 UID 存在。', '还要检查 schema、签发者、revocationTime 和 expirationTime。缺任何一项都可能被伪造或过期证明绕过。'],
  ['人格证明越强越好。', '强人格证明的代价是采集敏感数据并排除部分人群。应按“错放一个机器人的损失”选择强度，并提供替代路径。']
])}
${recap([
  '链上身份是积木：地址（根）→ ENS 名字 → 凭证与证明（VC、EAS、SBT）→ 人格证明 → 应用。',
  'ENS 用 namehash、注册表和解析器解析名字；链下名字用 EIP-3668 CCIP-Read；应用应通过 Universal Resolver 和主流库解析。',
  '主名称必须双向校验：反向得到候选名字，正向解析回原地址才显示。',
  'ENSv2 于 2026 年 10 月在以太坊 L1 上线，Namechain 计划已取消。',
  'EAS 只有 SchemaRegistry 和 EAS 两个核心合约；合约要读就用链上证明，只给人看就用链下证明；用 resolver 限制签发者。',
  'SBT（ERC-5192）不可转让，要设计补发；人格证明要在抗女巫强度、隐私和包容性之间取舍。'
])}
${quiz([
  { q: '应用通过 ENS 解析一个链下名字时，解析器合约第一步通常会怎样？', o: ['直接返回地址', '抛出 OffchainLookup 错误，告诉客户端去哪个网关取数据', '要求用户签名', '把请求转发到 L1 注册表'], a: 1, why: 'EIP-3668 规定合约用 OffchainLookup 错误告诉客户端网关地址和回调函数。' },
  { q: '下面哪种做法能防止“反向记录冒充知名名字”？', o: ['只显示名字的前 6 个字符', '缓存名字 24 小时', '把候选名字再正向解析，结果等于原地址才显示', '要求名字以 .eth 结尾'], a: 2, why: '反向记录任何人都能写；正向解析回原地址，才证明名字所有者把它指向了这个地址。' },
  { q: '一个合约要根据“用户是否完成课程”放行操作，证明应选哪种？', o: ['W3C VC，存在用户钱包里', 'EAS 链下证明', 'EAS 链上证明', '一封签名邮件'], a: 2, why: '合约只能读链上状态。VC 和链下证明默认不上链，合约读不到；链上证明可以被合约直接查询。' },
  { q: 'ERC-5192 规定，当 locked(tokenId) 返回 true 时：', o: ['所有转让函数必须回滚', 'token 只能转给合约地址', 'token 每年自动销毁', 'token 只能在 L2 上转让'], a: 0, why: 'ERC-5192 要求锁定状态下所有 ERC-721 转让函数都必须 throw。铸造和销毁不属于“在两个账户之间转让”。' },
  { q: '关于人格证明，下面哪项说法最准确？', o: ['World ID 不涉及任何个人数据', 'Human Passport 的分数不可能被刷', '强度越高，通常隐私代价和排除代价越大，要按场景选择', '人格证明已经被所有国家允许'], a: 2, why: 'World ID 采集虹膜数据并在多国受限；Passport 分数可以刷。强度要按场景损失选择。' }
])}
${terms([
  ['以太坊域名服务', 'ENS, Ethereum Name Service', '把人能读的名字映射到地址、文本记录和内容哈希的协议。'],
  ['链下读取', 'CCIP-Read (EIP-3668)', '合约用 OffchainLookup 错误让客户端去链下网关取数据，再在回调里校验的模式。'],
  ['去中心化标识符', 'DID, Decentralized Identifier', 'W3C 标准的标识符，格式 did:方法:标识符，可解析出含公钥的 DID 文档。'],
  ['可验证凭证', 'Verifiable Credential (VC)', 'W3C 定义的带签名声明，涉及签发者、持有者、验证者三方。'],
  ['证明', 'Attestation (EAS)', '签发者按某个 schema 对接收者做出的签名声明，可上链或链下。'],
  ['灵魂绑定代币', 'Soulbound Token (ERC-5192)', '锁定后不能转让的 NFT，用来表示不应买卖的资格或成就。'],
  ['人格证明', 'Proof of Personhood', '证明一个账户背后是独立真人的机制，用于抗女巫攻击。']
])}
` });

CUR = 'm09-2';
addCh({ id: 'm09-2', nav: '链上社交', title: 'M13.2 链上社交：Farcaster、Lens 与社交图谱', desc: '账户上链、内容放链下网络：社交图谱怎样归用户所有，以及垃圾号与变现', html: `
<h1>M13.2 链上社交：Farcaster、Lens 与社交图谱</h1>
${meta(['画出 Farcaster 的混合架构：OP Mainnet 上的 IdRegistry、KeyRegistry、StorageRegistry，加上链下的 Snapchain 网络，并说清每类操作放在哪一层。', '对比 Farcaster 与 Lens（Lens Chain + v3 原语）在数据存放、账户模型和扩展方式上的差别，并解释 2026 年两个协议易主对“用户拥有数据”的意义。', '用 Snapchain HTTP API 读取 cast，写出最小 Mini App 的接入步骤，并为一个社交应用设计防垃圾号和变现方案。'], '<a href="#m09-1">M13.1 链上身份</a>、<a href="#m07-2">M03.2 连接钱包</a>')}
${beginner(`<p><strong>社交图谱（Social graph）</strong>：谁关注了谁、谁和谁互动过的关系网。</p>
<p><strong>客户端（Client）</strong>：用户实际打开的 App。同一个协议可以有很多个客户端，就像同一个邮件协议有很多邮箱 App。</p>
<p><strong>fid</strong>：Farcaster ID，每个 Farcaster 账户的唯一编号，记录在链上合约里。</p>
<p><strong>cast</strong>：Farcaster 上的一条帖子。</p>
<p><strong>应用密钥（App key / Signer）</strong>：一把 Ed25519 密钥，用户授权给某个客户端，客户端用它替用户签名发帖，不需要每次都弹出钱包。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上社交把“账户和授权”放到链上，把“帖子、点赞、关注”放到一个专门的链下网络里。任何客户端都能读写同一份数据，所以用户换 App 时，关注者和历史帖子跟着账户走。')}
${call('analogy', `<p>传统社交平台像一家公司自建的商场：你的店面、顾客名单都属于商场。链上社交像电子邮件：邮箱地址（账户）归你，邮件协议是公开的，你可以从一个邮箱 App 换到另一个，联系人不丢。</p>
<p>类比的局限：邮件没有统一的“谁关注谁”数据；链上社交把关注关系也做成协议的一部分，但内容审核、推荐算法仍然由每个客户端自己决定。</p>`)}
${art('一图看懂：身份和授权放链上，帖子点赞放链下', 660, 330, [
  S.zone(10, 28, 290, 250, { t: '链上 · OP Mainnet 合约', k: 'info' }),
  S.zone(360, 28, 290, 250, { t: '链下 · 消息网络', k: 'key' }),
  S.box(24, 56, 262, 58, { k: 'info', icon: 'person', t: 'IdRegistry', s: '账户 fid ↔ 托管地址', mono: 1 }),
  S.box(24, 128, 262, 58, { k: 'info', icon: 'key', t: 'KeyRegistry', s: '登记应用公钥', mono: 1 }),
  S.box(24, 200, 262, 58, { k: 'info', icon: 'db', t: 'StorageRegistry', s: '付 ETH 租存储额度', mono: 1 }),
  S.box(374, 56, 262, 58, { k: 'idle', dash: 1, icon: 'phone', t: '客户端 App', s: '持有应用密钥，代你签名' }),
  S.box(374, 150, 262, 108, { k: 'key', icon: 'server', t: 'Snapchain 节点', s: '存帖子 · 点赞 · 关注\n查密钥与额度才接受\n额度满了会裁剪旧消息' }),
  S.arrow(505, 116, 505, 148, { k: 'plain' }),
  S.text(515, 137, '签名消息', { size: 11.5, dim: 1 }),
  S.arrow(372, 190, 288, 190, { k: 'info', dash: 1 }),
  S.text(330, 178, '读事件', { size: 11.5, anchor: 'middle', dim: 1 }),
  S.text(330, 314, '钱包只在注册、授权密钥、租存储时签链上交易；日常发帖不再打扰钱包', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '客户端用应用密钥签名消息，直接发给 Snapchain；节点读链上事件，确认这把密钥属于这个账户。'],
  ['key', '链上只放少量“必须全局一致”的东西：账户、授权的密钥、存储额度。'],
  ['fail', '存储额度用完，旧消息会被裁剪，不是永久保存。'],
  ['limit', '协议开放不等于使用分散：多数用户仍通过少数客户端和数据服务商访问。']
], '左侧链上三个合约分别管账户、应用密钥和存储额度；右侧客户端签名消息发给链下的 Snapchain 节点，节点向链上读取事件做校验。', 'm09-2')}

<h2>2. 为什么不把所有帖子都放到链上</h2>
<p>“用户拥有的社交图谱”需要两样东西：账户不归平台控制；数据能被任何人读取和验证。最直接的办法是全部上链，但成本太高。</p>
<p><strong>算一算（示例）：</strong>把一条 300 字节的帖子写进以太坊 L1 合约存储。</p>
${steps([
  '300 字节需要 ⌈300 ÷ 32⌉ = 10 个存储槽。每个新槽 SSTORE 约 20,000 Gas，共约 200,000 Gas。',
  'Gas 价格 1 gwei、ETH 3,000 美元时：200,000 × 1 gwei = 0.0002 ETH ≈ 0.60 美元一条。',
  '一个日均 100 万条帖子的网络：每天约 60 万美元，还没算点赞和关注。',
  '结论：社交数据量大、单条价值低，只能把“必须全局一致且涉及安全”的少量操作上链，其余放进专门的链下网络，用签名保证真实。'
])}
${recall('<p>L2 和数据可用性层把执行和数据成本降低了很多（见 <a href="#m05-4">M04.4 扩容路线</a>、<a href="#m05-5">M04.5 Rollup 深入</a>）。Lens 选择自建 L2，Farcaster 选择“少量合约 + 链下网络”，是同一问题的两种解法。</p>')}

<h2>3. Farcaster 架构：链上身份，链下数据</h2>
<p>Farcaster 官方文档的描述是：身份放链上，数据放链下。链上部分是部署在 <strong>OP Mainnet</strong> 上的合约；链下部分是叫 <strong>Snapchain</strong> 的点对点服务器网络，保存用户数据${cite('Farcaster 文档：Architecture', 'https://docs.farcaster.xyz/learn/architecture/overview')}。三个合约的职责如下${cite('Farcaster 文档：Contracts', 'https://docs.farcaster.xyz/learn/architecture/contracts')}：</p>
${tbl(['合约（OP Mainnet）', '做什么'], [
  ['<strong>IdRegistry</strong>', '注册、转让、恢复账户。每个账户是一个编号 fid，归属一个以太坊地址（托管地址）；一个地址同时只能拥有一个账户；可以设置恢复地址'],
  ['<strong>KeyRegistry</strong>', '账户把 Ed25519 应用密钥授权给客户端，客户端用它代表账户发消息；密钥可随时增删'],
  ['<strong>StorageRegistry</strong>', '账户用 ETH 租用存储空间。价格以美元设定，用 Chainlink 预言机换算成 ETH']
])}
<p>发帖、点赞、关注、改头像这些高频操作都不上链。它们是用应用密钥签名的消息，类型包括 CastAdd、ReactionAdd、LinkAdd（关注）、UserDataAdd、VerificationAddEthAddress（把一个以太坊地址关联到账户）等；cast 正文最长 1024 字节；消息时间戳是从 2021-01-01 00:00:00 UTC 起算的秒数${cite('Farcaster 协议规范', 'https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md')}。</p>
${mm('Farcaster 的两层：链上授权，链下消息', `
flowchart TB
  W["用户钱包<br/>托管地址"] -->|"注册 fid"| IDR["IdRegistry"]
  W -->|"授权应用密钥"| KR["KeyRegistry"]
  W -->|"付 ETH 租存储"| SR["StorageRegistry"]
  subgraph OP["OP Mainnet 合约"]
    IDR
    KR
    SR
  end
  C["客户端 App<br/>持有 Ed25519 应用密钥"] -->|"签名消息 CastAdd 等"| SN["Snapchain 网络<br/>验证并存储消息"]
  SN -.->|"读取链上事件<br/>fid · 密钥 · 存储额度"| OP
  SN --> R1["其他客户端"]
  SN --> R2["数据服务 API<br/>例如 Neynar"]
`, [
  ['flow', '钱包只在注册、授权密钥、租存储时签链上交易。日常发帖由客户端用应用密钥签名，直接发到 Snapchain。'],
  ['key', 'Snapchain 节点收到消息后检查：签名密钥是否在 KeyRegistry 里登记给这个 fid；账户是否还有存储额度。两项都通过才接受。'],
  ['fail', '存储额度用完：旧消息会被裁剪（pruned），不是永久保存。要长期保留数据，客户端或用户要自己归档。'],
  ['risk', '应用密钥泄露：攻击者能以你的名义发帖，但拿不走 fid。用托管地址在 KeyRegistry 删除这把密钥即可止损。托管地址的私钥泄露才会丢账户，所以要设置恢复地址。'],
  ['limit', '多数用户通过少数客户端和数据服务商访问网络。协议开放不等于使用分散。']
])}
<p><strong>Snapchain</strong> 于 2025 年上线主网，取代了早期叫 Hub 的同步网络。它是“类区块链”的数据层：消息被排序进区块，节点之间达成共识，官方声称可处理每秒 1 万笔以上交易，旧数据会定期裁剪${cite('The Block：Farcaster 上线 Snapchain（2025-03-21）', 'https://theblock.co/post/347606/decentralized-social-media-protocol-farcaster-launches-blockchain-like-data-layer-snapchain')}。</p>
${mm('客户端获得发帖权限的流程', `
sequenceDiagram
  participant U as 用户钱包
  participant C as 客户端
  participant K as KeyRegistry
  participant S as Snapchain
  C->>C: 生成 Ed25519 密钥对
  C->>U: 请求授权 显示密钥和用途
  U->>K: 签名交易 把公钥登记到自己的 fid
  K-->>S: 节点同步到 KeyAdded 事件
  C->>S: 用私钥签名 CastAdd 消息
  S->>S: 检查公钥属于该 fid 且存储额度足够
  S-->>C: 接受 并广播给其他节点
`, [
  ['flow', '钱包只签一次授权。之后客户端每次发帖都不打扰钱包，体验接近传统 App。'],
  ['risk', '授权界面要清楚显示“哪个客户端、能做什么”。用户给了恶意客户端密钥，它可以持续以用户名义发帖，直到密钥被删除。'],
  ['key', '这和 <a href="#m06-5">M09.8 账户抽象深入</a> 里会话密钥的思路相同：用一次高权限签名，换一把低权限、可撤销的日常密钥。']
])}

<h3>Mini Apps：在信息流里运行的网页应用</h3>
<p>Farcaster 早期的 Frames 是“一张图 + 几个按钮”。第二版 Frames v2 后来改名为 <strong>Mini Apps</strong>，两者是同一套技术${cite('Farcaster Mini Apps FAQ', 'https://miniapps.farcaster.xyz/docs/guides/faq')}。Mini App 是一个普通网页：客户端在信息流里展示它的预览卡片，用户点开后在客户端内打开，并可以调用客户端提供的钱包和用户信息。接入三步${cite('Mini Apps 规范', 'https://miniapps.farcaster.xyz/docs/specification')}${cite('Mini Apps 入门', 'https://miniapps.farcaster.xyz/docs/getting-started')}：</p>
${steps([
  '页面 <code>&lt;head&gt;</code> 放 <code>fc:miniapp</code> 元标签，内容是 JSON：<code>version</code>、3:2 比例的 <code>imageUrl</code>、<code>button.title</code> 和 <code>button.action</code>（类型、名称、启动页）。',
  '域名下提供 <code>/.well-known/farcaster.json</code> 清单，其中 <code>accountAssociation</code> 用账户签名证明“这个域名属于某个 fid”。',
  '页面加载完成后调用 SDK 的 <code>ready()</code>，否则用户会一直看到启动画面。'
])}
${code('TYPESCRIPT', `
// npm install @farcaster/miniapp-sdk
import { sdk } from '@farcaster/miniapp-sdk'

// 页面渲染完成后通知客户端隐藏启动画面
await sdk.actions.ready()
`)}

<h2>4. Lens：自建 L2 与模块化原语</h2>
<p>Lens 走了另一条路：把社交数据放到一条专用链上。<strong>Lens Chain</strong> 主网于 2025 年 4 月 4 日上线，基于 ZKsync 技术栈，用 Avail 做数据可用性层（因此属于 validium，数据不在以太坊 L1 上），可以用 GHO 稳定币付 Gas；上线时从 Polygon 上的 Lens V2 迁移了约 125 GB 数据${cite('The Block：Lens Chain 主网上线（2025-04-04）', 'https://www.theblock.co/post/349582/socialfi-protocol-lens-releases-lens-chain-mainnet-with-avail-da-and-zksync-tech')}${cite('Blockworks：Lens 主网上线', 'https://blockworks.co/news/lens-mainnet-l2-socialfi-launch')}。Lens v3 把社交功能拆成可组合的原语：账户（Accounts）、用户名（Usernames）、关系图（Graphs）、信息流（Feeds）、群组（Groups），每个原语都可以挂自定义规则（Rules），用来做付费关注、门槛群组等${cite('Lens 文档：Lens Chain', 'https://lens.xyz/docs/chain')}。</p>
${compare('Farcaster 与 Lens 的设计取舍', [
  { name: 'Farcaster', tag: '少量合约 + 链下网络', kind: 'info', points: ['账户、密钥、存储租金在 OP Mainnet', '帖子和关系在 Snapchain，按存储额度裁剪', '扩展方式：Mini Apps（网页）', '合约能读的社交数据很少', '协议简单，数据吞吐高'] },
  { name: 'Lens', tag: '专用 L2 + 原语', kind: 'key', points: ['账户是智能合约账户，社交数据在 Lens Chain 上', '数据可用性在 Avail（validium）', '扩展方式：给原语挂规则合约', '合约可以直接读关注关系、群组成员', '开发更灵活，链本身是额外的信任与运维依赖'] }
], [
  ['flow', 'Farcaster 的数据验证靠“签名 + 链上密钥登记”；Lens 的数据验证靠 L2 的状态和证明。'],
  ['key', '想让合约根据社交关系做决定（例如“关注者才能领取”），Lens 的模型更直接；只要可移植的内容和高吞吐，Farcaster 的模型更便宜。'],
  ['risk', 'Lens 数据可用性依赖 Avail，不是以太坊 L1；Farcaster 内容依赖 Snapchain 节点保留数据，存储额度到期会被裁剪。']
])}

<h3>2026 年：两个协议都换了主人</h3>
<p>2026 年 1 月，基础设施公司 Neynar 从 Merkle Manufactory 收购 Farcaster，范围包括协议合约、Farcaster App 和 Clanker；创始团队表示协议不会关闭，并计划向风险投资人退还约 1.8 亿美元${cite('The Block：Neynar 收购 Farcaster（2026-01-21）', 'https://www.theblock.co/news/deals/2026-01-21-haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app-386549')}。同月，Mask Network 从 Aave 方面接手 Lens 的运营管理，Aave 保留顾问角色${cite('The Block：Mask Network 接手 Lens', 'https://www.theblock.co/amp/post/386293/mask-network-takes-over-lens-protocol-with-goal-to-build-products-people-actually-use')}。2026 年 10 月，Balaji Srinivasan 的 Network School 又从 Neynar 收购 Farcaster，并要求用户接受一份“社交智能合约”式的社区规则；不接受的用户在主 App 里只能只读，他们的密钥、资金、关注者和历史帖子会迁移到另一个客户端${cite('The Block：Network School 收购 Farcaster（2026-10-15）', 'https://www.theblock.co/news/ecosystems/2026-10-15-network-school-acquires-farcaster-from-neynar-418720')}。</p>
${call('info', '<p>这是“用户拥有社交图谱”的一次真实检验：<strong>主 App 换了规则，账户和关注关系仍能被带到别的客户端</strong>，因为它们属于链上 fid 和链下网络，而不属于某个 App 的数据库。反过来也要看到：协议合约、主要客户端和数据服务集中在少数公司手里，规则变化对大多数用户的影响仍然很大。</p>')}

<h2>5. 垃圾号、女巫与变现</h2>
${tbl(['问题', '常见手段', '代价'], [
  ['批量注册垃圾号', '注册和存储要付费（Farcaster 的存储租金）；新账户限流', '提高了真人用户的门槛'],
  ['机器人刷互动', '账户质量分（看互动网络、账户年龄）；要求人格证明（见 <a href="#m09-1">M13.1</a>）', '分数不透明，可能误伤新用户；人格证明有隐私代价'],
  ['刷空投和激励', '奖励按“被高质量账户互动”加权，而不是按发帖数量', '规则越复杂，越难解释给用户'],
  ['违法与骚扰内容', '协议层不删数据，由每个客户端做内容审核和屏蔽', '同一条内容在不同客户端可见性不同']
])}
<p>变现方式主要有：打赏和付费订阅（创作者直接收代币或稳定币）、付费频道或门槛群组（Lens 的规则合约很适合）、Mini App 内的交易和支付、以及创作者代币发行。代币发行要先读 <a href="#m02-60">M08.6 代币经济设计</a>：发币不是收入，只是把未来收入预支给市场。</p>

${tryit(`<p><strong>动手练习：</strong>读取一个账户最近的 cast，并把时间戳转换成日期。</p>
${steps([
  '方式 A（自建节点）：按 Snapchain 文档运行一个节点，然后执行 <code>curl "http://127.0.0.1:3381/v1/castsByFid?fid=3&pageSize=5&reverse=true"</code>。返回的 <code>messages</code> 里，每条有 <code>data.fid</code>、<code>data.timestamp</code>、<code>data.castAddBody.text</code>。',
  '方式 B（托管 API）：在 Neynar 申请测试 API Key，执行 <code>curl "https://api.neynar.com/v2/farcaster/feed/user/casts/?fid=3&limit=5" -H "x-api-key: 你的Key"</code>。',
  '把方式 A 拿到的 <code>data.timestamp</code> 加上 1,609,459,200（2021-01-01 的 Unix 秒数），再转成日期，和客户端里显示的发帖时间比对。',
  '在 OP Mainnet 的区块浏览器里打开 IdRegistry 合约，用 Read Contract 调用 <code>custodyOf(3)</code>，看这个 fid 的托管地址。'
])}
<p>预期结果：你能说出一条 cast 的作者 fid、签名密钥和时间，并解释为什么它不需要上链也能被验证。</p>`)}
${exq([['（示例）Snapchain 返回 <code>data.timestamp = 150000000</code>。这条 cast 大约发在哪一年？', '<p>150,000,000 + 1,609,459,200 = 1,759,459,200（Unix 秒）。1,759,459,200 ÷ 31,557,600（每年秒数）≈ 55.75 年，从 1970 年算起约为 2025 年 10 月。</p>']])}

${exercises([
  ['你的客户端想做“只有关注我超过 30 天的人才能领取空投”。在 Farcaster 和 Lens 上分别怎么实现？', '<p><strong>Farcaster</strong>：关注关系在链下，合约读不到。做法是后端从 Snapchain 读取 LinkAdd 消息和时间，生成名单，再用 Merkle 根或 EAS 证明上链（见 <a href="#m09-1">M13.1</a>），合约按证明发放。<strong>Lens</strong>：关注关系在 Lens Chain 的 Graph 原语里，可以在规则合约或领取合约里直接查询；“超过 30 天”需要读取关注时间，或由规则在关注时记录。</p>'],
  ['用户报告“我的账号在发奇怪的帖子”，但钱包没有签过任何交易。最可能的原因是什么？怎样止损？', '<p>最可能是某个客户端持有的应用密钥泄露，或用户授权了恶意客户端。止损：用托管地址在 KeyRegistry 删除这把应用密钥，删除后用它签的新消息不再被网络接受。之后检查所有已授权的密钥，只保留在用的客户端。托管地址本身没有泄露，账户 fid 不受影响。</p>'],
  ['某社交协议的主 App 修改了社区规则。哪些东西能跟着你走，哪些不能？', '<p>能带走：链上账户（fid 或 Lens 账户）、用户名、关注关系和网络里保存的帖子，以及授权给其他客户端的能力。带不走：主 App 自己的推荐算法、私信（若存在中心化服务器）、App 内的积分、以及已被裁剪的旧数据。前提是有其他可用的客户端和数据服务。</p>']
])}
${checklist([
  '能画出 Farcaster 三个链上合约和 Snapchain 的关系，并说出每个合约的职责。',
  '能解释应用密钥授权流程，以及密钥泄露和托管地址泄露的区别。',
  '能用 Snapchain HTTP API 或 Neynar API 读出一个 fid 的 cast，并换算时间戳。',
  '能说出 Mini App 接入的三个必要步骤。',
  '能对比 Farcaster 与 Lens 的数据存放位置和扩展方式。',
  '能为社交应用列出至少三种防垃圾号手段及其代价。'
])}
${mistakes([
  ['链上社交就是每条帖子都上链。', 'Farcaster 只把账户、密钥和存储租金放到 OP Mainnet；帖子在 Snapchain。Lens 放在专用 L2，数据可用性在 Avail。'],
  ['Farcaster 的帖子会被永久保存。', 'Snapchain 按账户的存储额度保存数据，超出或到期会裁剪旧消息。长期保存要自己归档。'],
  ['应用密钥泄露就会丢失账户。', '应用密钥只能发消息。用托管地址删除密钥即可止损；托管地址泄露才会丢账户。'],
  ['协议开放，就不会受单一公司影响。', '2026 年 Farcaster 两次易主、Lens 换了运营方。协议数据可迁移，但主要客户端和数据服务仍高度集中。']
])}
${recap([
  '全部上链太贵：一条 300 字节帖子写 L1 存储约 0.60 美元（示例），所以链上社交采用混合架构。',
  'Farcaster：IdRegistry、KeyRegistry、StorageRegistry 在 OP Mainnet；消息由应用密钥签名，存储在 Snapchain，按额度裁剪。',
  'Mini Apps（原 Frames v2）是在客户端内运行的网页，需要 fc:miniapp 元标签、farcaster.json 清单和 ready() 调用。',
  'Lens：专用 L2（ZKsync 技术栈 + Avail），v3 原语加规则合约，合约能直接读社交关系。',
  '2026 年两个协议都换了运营方；账户和关系可以迁移到其他客户端，这是“用户拥有图谱”的价值，也暴露了客户端集中的风险。'
])}
${quiz([
  { q: 'Farcaster 用户发一条 cast，需要做什么？', o: ['钱包签一笔 OP Mainnet 交易', '客户端用已登记的应用密钥签名，发到 Snapchain', '把帖子写入 StorageRegistry', '支付一笔 ETH 手续费'], a: 1, why: '日常消息不上链。客户端用 KeyRegistry 里登记过的 Ed25519 密钥签名，Snapchain 节点验签后接受。' },
  { q: '哪个合约负责“把发帖权限授权给客户端”？', o: ['IdRegistry', 'StorageRegistry', 'EAS', 'KeyRegistry'], a: 3, why: 'KeyRegistry 记录每个 fid 授权了哪些应用密钥。IdRegistry 管账户归属，StorageRegistry 管存储租金。' },
  { q: '关于 Lens Chain，下面哪项正确？', o: ['基于 ZKsync 技术栈，数据可用性用 Avail', '是 OP Stack 链，数据发到以太坊 blob', '是比特币侧链', '不支持智能合约'], a: 0, why: '2025 年 4 月上线的 Lens Chain 基于 ZKsync 技术栈，使用 Avail 作为数据可用性层，属于 validium。' },
  { q: 'Mini App 加载完成后忘了调用 sdk.actions.ready()，会出现什么现象？', o: ['帖子无法发送', '用户一直看到启动画面', '钱包被断开', '清单签名失效'], a: 1, why: '官方入门文档说明，不调用 ready() 客户端不会隐藏启动画面，用户会看到无限加载。' },
  { q: '为什么说 2026 年 Farcaster 易主是对“用户拥有社交图谱”的检验？', o: ['因为新主人删除了所有帖子', '因为不接受新规则的用户，其账户和关注关系可以迁到其他客户端', '因为协议改成了中心化数据库', '因为所有用户都必须重新注册'], a: 1, why: 'The Block 报道，不接受新规则的用户在主 App 里只读，其密钥、关注者和历史帖子会迁移到另一个客户端。这依赖账户在链上、数据在开放网络里。' }
])}
${terms([
  ['社交图谱', 'Social graph', '用户之间关注与互动关系构成的网络。'],
  ['Farcaster ID', 'fid', 'IdRegistry 给每个 Farcaster 账户分配的唯一编号，归属一个托管地址。'],
  ['应用密钥', 'App key / Signer', '用户在 KeyRegistry 授权给客户端的 Ed25519 密钥，用来代表用户签名消息。'],
  ['托管地址', 'Custody address', '拥有某个 fid 的以太坊地址，可增删应用密钥、转让账户。'],
  ['Snapchain', 'Snapchain', 'Farcaster 的链下点对点数据网络，排序、验证并保存用户消息。'],
  ['Mini App', 'Mini App (原 Frames v2)', '在 Farcaster 客户端内打开、可调用客户端钱包的网页应用。'],
  ['Validium', 'Validium', '执行在链下、用有效性证明结算，但数据可用性不在以太坊 L1 的扩容方案。'],
  ['裁剪', 'Pruning', '网络按存储额度删除旧消息，只保留最近的数据。']
])}
` });

CUR = 'm09-3';
addCh({ id: 'm09-3', nav: '去中心化存储与 DePIN', title: 'M13.3 去中心化存储与 DePIN', desc: '内容寻址、Filecoin 与 Arweave 各保证什么，以及用代币激励真实硬件的单位经济', html: `
<h1>M13.3 去中心化存储与 DePIN</h1>
${meta(['用内容寻址解释 CID 的结构和 pin 的作用，并说清 Filecoin（存储交易、PoRep / PoSt、PDP）和 Arweave（一次付费 + 捐赠基金）各保证什么、不保证什么。', '区分数据可用性和长期存储，为 Rollup 数据、NFT 元数据、前端文件和证明文件选对存储层。', '画出 DePIN 的激励飞轮，用“需求收入 ÷ 代币排放”和硬件回本周期判断一个项目的需求是否真实。'], '<a href="#m05-9">M04.10 数据基础设施</a>、<a href="#m05-4">M04.4 扩容路线</a>', ['cid'])}
${beginner(`<p><strong>内容寻址（Content addressing）</strong>：用内容的哈希当地址。内容变了，地址就变。对比“位置寻址”：URL 指向某台服务器上的某个路径，服务器可以随时换掉内容。</p>
<p><strong>固定（Pin）</strong>：让一个 IPFS 节点长期保存某份内容，不被垃圾回收清掉。</p>
<p><strong>存储提供者（Storage Provider，SP）</strong>：在 Filecoin 上出租硬盘、按合约保存数据并定期提交证明的节点运营者。</p>
<p><strong>DePIN</strong>：去中心化物理基础设施网络（Decentralized Physical Infrastructure Network），用代币奖励个人或公司提供真实硬件：硬盘、无线热点、GPU。</p>
<p><strong>单位经济（Unit economics）</strong>：一台设备或一个用户的收入减成本，决定生意能否自己养活自己。</p>`)}

<h2>1. 一句话理解</h2>
${one('去中心化存储先用内容哈希解决“拿到的是不是那份数据”（IPFS），再用经济激励解决“有没有人一直保存它”（Filecoin 按期合约、Arweave 一次付费）。DePIN 把同样的思路推广到硬盘以外的硬件：用代币换供给，用证明防作弊，用真实付费需求撑起代币价值。')}
${call('analogy', `<p>位置寻址像“三楼第二个书架第五本”：管理员换了书，你也不知道。内容寻址像按书的“指纹”找书：任何图书馆给你的书，只要指纹对得上就是那本。可是指纹不负责让书存在，书要有人愿意保管，这就是 pin 和存储激励。</p>
<p>类比的局限：书的指纹需要人去比对；IPFS 客户端会自动重新计算哈希并比对，但通过普通 HTTPS 网关访问时，校验是网关替你做的，你在信任网关。</p>`)}
${art('一图看懂：CID 只证明“是那份”，有没有人存要靠另外的保管方式', 660, 326, [
  S.box(10, 36, 180, 64, { k: 'tint', icon: 'file', t: '文件', s: 'photo.png（示例）' }),
  S.box(230, 36, 180, 64, { k: 'key', icon: 'hash', t: 'CID', s: '内容哈希，改一字就变', mono: 1 }),
  S.box(450, 36, 200, 64, { k: 'info', icon: 'check', t: '取回时重算哈希', s: '对不上就丢弃' }),
  S.arrow(192, 68, 228, 68, { k: 'plain' }),
  S.arrow(412, 68, 448, 68, { k: 'plain' }),
  S.zone(10, 124, 640, 164, { t: '谁来保管？CID 不管，要另外选', k: 'warn' }),
  S.box(24, 156, 196, 100, { k: 'warn', icon: 'server', t: 'pin 节点', s: '自己或固定服务\n停付或关机就可能消失' }),
  S.box(232, 156, 196, 100, { k: 'info', icon: 'clock', t: 'Filecoin', s: '有期限的合约\n持续提交证明\n到期要续约' }),
  S.box(440, 156, 196, 100, { k: 'info', icon: 'lock', t: 'Arweave', s: '一次付费\n设计目标 200 年\n不能删除' }),
  S.text(330, 312, 'DePIN 把同样思路推到硬件：用代币换供给，用证明防作弊', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '文件按内容算出 CID；以后无论从哪个节点或网关取回，客户端重算哈希就知道是不是原文件。'],
  ['key', 'CID 保证完整性，不保证可用性。没有人保存，CID 再正确也取不到。'],
  ['risk', '通过普通网关访问时，是网关替你校验，你在信任网关。要自己校验，就用本地节点。'],
  ['limit', 'Arweave 不能删除，隐私数据先加密，或者根本不要上传。']
], '文件算出 CID，取回时重算哈希校验；下方三种保管方式分别是 pin 节点、Filecoin 有期限合约和 Arweave 一次付费永久存储。', 'm09-3')}

<h2>2. 内容寻址：CID 和 pin</h2>
${recall('<p>IPFS、Arweave、Filecoin 的一张对比表，以及 NFT 元数据“tokenURI → JSON → 图片”的引用链和发布步骤，在 <a href="#m05-9">M04.10 数据基础设施</a> 第 6 节讲过。本篇讲它们背后的机制，以及 M04.10 没有展开的保证边界和 DePIN。</p>')}
<p>IPFS 的 <strong>CID（内容标识符）</strong>由四部分组成：multibase（字符串编码，只在文本形式里出现）、版本号、multicodec（内容该怎样解释）、multihash（哈希算法 + 摘要，默认 sha2-256）。46 个字符、以 <code>Qm</code> 开头的是 CIDv0；CIDv1 默认用 base32，常见前缀 <code>bafy…</code> 或 <code>bafk…</code>${cite('IPFS 文档：Content addressing and CIDs', 'https://docs.ipfs.tech/concepts/content-addressing/')}。</p>
${call('info', '<p>同一个文件<strong>不一定</strong>得到同一个 CID。分块大小、DAG 结构、编解码器、CID 版本和哈希算法任何一项不同，CID 都不同' + cite('IPFS 文档：Content addressing and CIDs', 'https://docs.ipfs.tech/concepts/content-addressing/') + '。所以“本地算出的 CID 和链上记录的对不上”时，先检查上传参数，不要急着认定被篡改。</p>')}
${mm('一个文件从上传到被验证地取回', `
flowchart LR
  F["文件"] -->|"按块切分 默认 256 KiB"| CH["数据块"]
  CH -->|"每块哈希 组成 Merkle DAG"| ROOT["根 CID"]
  ROOT -->|"pin 并对外宣告"| N1["自己的节点"]
  ROOT -->|"远程 pin"| N2["固定服务"]
  N1 --> DHT["内容路由<br/>谁有这个 CID"]
  N2 --> DHT
  U["下载者"] -->|"按 CID 查询"| DHT
  U -->|"取回数据块"| N2
  U --> V{"重新计算哈希<br/>与 CID 一致"}
  V -->|"是"| OK["接受"]
  V -->|"否"| BAD["丢弃 换节点"]
`, [
  ['flow', '大文件被切块，每块有自己的哈希，根 CID 指向整棵 Merkle DAG。下载者可以从多个节点并行取块，每块单独校验。'],
  ['key', 'CID 只保证完整性，不保证可用性。没有任何节点 pin，内容就取不到。'],
  ['fail', '常见故障：只在本地节点 pin，节点关机后内容消失；固定服务欠费后停止 pin。'],
  ['risk', '经过普通 HTTPS 网关访问时，是网关在替你校验。网关被攻击或作恶，可以返回别的内容。要自己校验，就用本地节点，或用支持可验证检索的方式取回原始数据块。']
])}
<p>下面的实验用真实算法计算 CIDv1：版本 <code>0x01</code> + raw 编解码 <code>0x55</code> + sha2-256 多哈希，再做 base32 编码。对小于一个分块的文件，这通常与 <code>ipfs add --cid-version=1</code> 的结果一致。先看“原始内容”的 CID，再改一个字符。</p>
${lab('cid')}
<p>观察要点：只改一个字符，CID 整体改变；网关返回的内容只要不同，客户端就能发现。这正是 NFT 元数据要写 <code>ipfs://CID</code> 而不是某个服务器 URL 的原因。</p>

<h2>3. Filecoin 与 Arweave：谁来保证“一直有人存”</h2>
<p><strong>Filecoin</strong> 是一个存储市场。用户和存储提供者签订有期限的存储交易，SP 抵押 FIL 作为保证金，并持续提交两类证明${cite('Filecoin 文档：Proofs', 'https://docs.filecoin.io/basics/the-blockchain/proofs')}：</p>
<ul>
  <li><strong>复制证明（Proof of Replication，PoRep）</strong>：数据放进扇区后被“封装”成唯一编码，证明 SP 确实存了一份独立副本。编码依赖数据、SP 和封装时间，不能挪给别人或别的时间用。</li>
  <li><strong>时空证明（Proof of Spacetime，PoSt）</strong>：WindowPoSt 按分区持续审计，每个分区要在证明周期里自己的 30 分钟窗口内交证明；交不上，SP 会被罚没抵押、降低算力。WinningPoSt 用于选出块者。</li>
</ul>
${mm('一笔 Filecoin 存储交易的状态', `
stateDiagram-v2
  state "交易提议" as Proposed
  state "链上发布" as Published
  state "封装中 PoRep" as Sealing
  state "有效 持续 WindowPoSt" as Active
  state "故障 罚没" as Faulted
  state "到期" as Expired
  [*] --> Proposed: 用户选 SP 谈价格和期限
  Proposed --> Published: 交易上链 双方锁定资金和抵押
  Published --> Sealing: SP 把数据放进扇区并封装
  Sealing --> Active: 提交复制证明
  Active --> Active: 每个证明周期按时提交 PoSt
  Active --> Faulted: 漏交证明
  Faulted --> Active: 恢复并补交
  Active --> Expired: 期限结束
  Expired --> [*]: 不续约则 SP 可删除数据
`, [
  ['flow', '链上只记录交易和证明，数据本身在 SP 的硬盘上。'],
  ['key', 'PoRep 和 PoSt 证明“数据还在硬盘上”，不证明“你随时能快速取回”。检索要另外谈，或选用热存储服务。'],
  ['fail', '交易到期不续约，SP 可以删除数据。生产系统要监控到期时间并自动续约。'],
  ['limit', '封装很耗时，Filecoin 传统交易适合冷数据，不适合频繁更新。']
])}
<p>为补上“随时可取”的缺口，Filecoin Onchain Cloud 于 2026 年 3 月 26 日上线主网：用<strong>数据持有证明（Proof of Data Possession，PDP）</strong>每 24 小时在链上校验一次热数据，用 Filecoin Pay 合约按 epoch 结算，证明停止时付款自动停止${cite('Filecoin 博客：Filecoin Onchain Cloud is live on mainnet', 'https://filecoin.io/blog/filecoin-onchain-cloud-is-live-on-mainnet')}。网络规模方面，2025 年第三季度承诺容量约 3.0 EiB，利用率 36%，有效交易中的数据约 1,110 PiB${cite('Messari / Blockworks：State of Filecoin Q3 2025（2025-11-13）', 'https://app.blockworks.com/report/state-of-filecoin-q3-2025')}。这组数字说明供给远大于付费需求，后面讲 DePIN 时会再用到。</p>
<p><strong>Arweave</strong> 走“一次付费、永久存储”。上传时一次性付 AR：一部分覆盖 200 年的存储成本，其余进入捐赠基金，用收益支付以后的存储；模型假设存储成本每年下降 0.5%，下降越快，资金能支撑越久${cite('ar.io：What is Arweave', 'https://ar.io/articles/what-is-arweave/')}。</p>
${compare('三种存储方案的保证边界', [
  { name: 'IPFS', tag: '寻址与传输协议', kind: 'info', points: ['保证：拿到的内容与 CID 一致', '不保证：有人保存', '持久性靠自己或固定服务 pin', '适合：分发、去重、前端'] },
  { name: 'Filecoin', tag: '有期限的存储市场', kind: 'key', points: ['保证：SP 在合约期内持续证明数据在', '不保证：到期后仍在；传统交易不保证快速检索', '到期要续约，要监控', '适合：大规模冷存储、归档；热数据用 PDP 服务'] },
  { name: 'Arweave', tag: '一次付费永久存储', kind: 'warn', points: ['设计目标：至少 200 年', '依赖：成本持续下降的假设和 AR 的价值', '不能删除', '适合：要永久公开的数据，如 NFT 媒体、存档'] }
], [
  ['key', '生产常用组合：内容用 CID 引用，同时 pin 在两家固定服务和自建节点，重要数据再存一份到 Filecoin 或 Arweave。'],
  ['risk', 'Arweave 不能删除。个人数据、密钥、需要合规删除的数据，绝对不能上传。'],
  ['limit', '三者都不提供访问控制。私密数据要先加密，密钥另行管理。']
])}

<h2>4. 数据可用性不是长期存储</h2>
<p>新手常把“数据可用性（Data Availability，DA）”和“存储”混为一谈。DA 只保证：数据在一段时间内被公开发布、任何人都能下载并验证 Rollup 的状态。它不承诺长期保存。</p>
${recall('<p>DA 的原理、EIP-4844 的 blob 和 Rollup 怎样把数据发到 L1，见 <a href="#m05-4">M04.4 扩容路线</a> 和 <a href="#m05-5">M04.5 Rollup 深入</a>。这里只给选型结论。</p>')}
${tbl(['层', '保证什么', '保存多久', '典型数据'], [
  ['以太坊 blob（DA）', '数据被发布，挑战期和同步期内可取', '约 18 天后节点可删除', 'Rollup 交易批次'],
  ['专用 DA 层（Celestia、Avail 等）', '同上，安全性来自该层自己的共识', '按该层规则', 'Rollup / validium 数据（例如 Lens Chain 用 Avail）'],
  ['合约存储 / calldata', '永久，任何合约能读', '永久', '小而关键的数据：哈希、CID、所有权'],
  ['IPFS + pin / Filecoin / Arweave', '见上一节', '按 pin、合约或一次付费', '图片、JSON、前端、证明文件']
])}
<p>NFT 元数据在 M04.10 之外还要注意四个坑：</p>
${steps([
  '<strong>可改的 baseURI</strong>：合约所有者能随时把 <code>baseURI</code> 换成别的 CID。要么在铸造完成后放弃修改权限，要么用时间锁和多签，并用 ERC-4906 事件公开每次修改。',
  '<strong>把网关域名写进 JSON</strong>：<code>image</code> 写成 <code>https://某网关/ipfs/…</code>，网关下线图就没了。一律写 <code>ipfs://</code> 或 <code>ar://</code>。',
  '<strong>只 pin 了 JSON，没 pin 图片</strong>：元数据能打开，图片 404。目录 CID 和媒体 CID 都要 pin，并定时抽查。',
  '<strong>链上 SVG 也有代价</strong>：把图片直接写进合约（<code>data:</code> URI）最持久，但每个字节都要付 Gas，适合几 KB 以内的生成艺术或徽章。'
])}

<h2>5. DePIN：用代币激励真实硬件</h2>
<p>DePIN 的共同结构是“供给方拿代币奖励提供硬件，需求方付钱使用服务，协议用证明防止作弊”。三类代表项目：</p>
${tbl(['项目', '硬件供给', '工作证明（防作弊）', '需求方怎样付费'], [
  ['Filecoin', '硬盘', 'PoRep、PoSt、PDP', '按存储交易付 FIL，或通过服务商付费'],
  ['Helium', '无线热点（LoRaWAN、移动网络）', '覆盖证明（Proof of Coverage）和经验证的数据流量', '燃烧 HNT 换取 Data Credit（DC）；1 DC 固定为 0.00001 美元，DC 不可转让' + cite('Helium 文档：Data Credit', 'https://docs.helium.com/tokens/data-credit/')],
  ['Render', 'GPU', '渲染任务完成后的日志与结算', '按法币或等值 RENDER 付费，完成后燃烧 RENDER；节点按递减排放表每个 epoch 领奖励' + cite('Render Network：Burn Mint Equilibrium', 'https://know.rendernetwork.com/basics/burn-mint-equilibrium') + '（算力类 DePIN 与 AI 的关系见 <a href="#m06-60">M12.8 AI × Crypto 全景</a>）']
])}
${mm('DePIN 的激励飞轮与断点', `
flowchart LR
  T["代币排放<br/>奖励供给方"] --> S["更多硬件上线"]
  S --> Q["覆盖更广 价格更低"]
  Q --> D["真实需求方付费"]
  D -->|"燃烧或回购代币"| P["代币需求增加"]
  P --> T
  S -.->|"只为挖币"| FAKE["虚假硬件 刷流量"]:::risk
  T -.->|"排放大于需求"| SELL["供给方持续卖币"]:::risk
  SELL -.-> DROP["币价下跌 奖励缩水"]:::risk
  DROP -.-> S
`, [
  ['flow', '健康的飞轮：需求方付的钱（燃烧或回购）逐步替代代币排放，成为供给方收入的主要来源。'],
  ['fail', '早期几乎所有收入来自排放。排放递减而需求没跟上，供给方回本周期拉长，硬件开始下线。'],
  ['risk', '工作证明越弱，虚假供给越多：伪造位置的热点、自己给自己刷流量。证明机制是 DePIN 的安全核心。'],
  ['key', '看一个 DePIN 项目，第一眼看“需求方真实付费 ÷ 代币排放价值”这个比例和它的趋势，而不是硬件数量。']
])}
<p>Helium 在 2023 年 4 月 18 日把网络迁移到 Solana，热点以 NFT 形式存在于 Solana 上${cite('Helium 文档：Solana 迁移', 'https://docs.helium.com/solana')}。按 Helium 官方披露，2026 年 5 月网络日均传输约 128 TB 数据，2026 年一季度日活用户约 340 万；2026 年 6 月 2 日 Helium Mobile 业务被 Noble Mobile 收购，Helium 团队转向运营商基础设施平台${cite('Helium：Network snapshot', 'https://www.helium.com/snapshot')}。这些是项目方自报数据，评估时要和链上 DC 燃烧数据交叉核对。</p>
<p><strong>算一算（示例）：</strong>一个热点的回本周期，以及网络层面的“需求覆盖率”。数字都是假设。</p>
${steps([
  '设备价格 400 美元；每月代币奖励按当前币价值 12 美元；电费和网络费每月 4 美元。月净收入 = 12 − 4 = 8 美元，回本 = 400 ÷ 8 = 50 个月。',
  '如果排放每两年减半、币价不变：第 25 个月起奖励变成 6 美元，净收入 2 美元。前 24 个月回收 8 × 24 = 192 美元，剩下 208 美元要再等 104 个月，总回本约 128 个月，超过设备寿命。',
  '网络层面：某季度需求方燃烧代币价值 300 万美元，同期排放给供给方的代币价值 3,000 万美元。需求覆盖率 = 300 ÷ 3,000 = 10%。',
  '结论：覆盖率 10% 意味着供给方 90% 的收入来自新发行的代币，最终由二级市场买家承担。覆盖率持续上升才说明需求真实；只有硬件数量上升没有意义。'
])}
${call('warn', '<p>购买 DePIN 硬件“挖矿”之前，按上面的方法算回本周期，并考虑币价下跌、排放减半和设备折旧。本文不构成投资建议。</p>')}
${tbl(['尽调问题', '为什么问', '去哪里看'], [
  ['需求方是谁，付了多少钱', '区分真实需求和刷量', '链上燃烧 / 支付合约、项目季度报告、第三方研究'],
  ['工作证明能不能伪造', '虚假供给会稀释真实供给方', '协议文档、审计报告、历史作弊事件'],
  ['排放表和解锁计划', '决定未来卖压', '代币经济文档（见 <a href="#m02-60">M08.6 代币经济设计</a>）'],
  ['不用代币，服务是否有竞争力', '补贴结束后用户会不会走', '对比同类中心化服务的价格和质量']
])}

${tryit(`<p><strong>动手练习：</strong>自己算一个 CID，并检查一个 NFT 的存储方式。</p>
${steps([
  '安装 Kubo（IPFS 官方 Go 实现），运行 <code>ipfs init</code> 和 <code>ipfs daemon</code>。',
  '执行 <code>echo -n hello &gt; a.txt</code>，再执行 <code>ipfs add --cid-version=1 a.txt</code>。把得到的 CID 和上方实验里输入 <code>hello</code> 时的 CID 比对，预期相同（<code>bafkrei…</code> 开头）。',
  '执行 <code>ipfs add a.txt</code>（默认 CIDv0），看到 <code>Qm…</code> 开头的另一个 CID；再执行 <code>ipfs cid base32 &lt;Qm…&gt;</code>，观察 v0 转成 v1 后的样子，并想一想为什么它和上一步的不一样（提示：编解码器）。',
  '在 Etherscan 打开一个 NFT 合约，调用 <code>tokenURI(1)</code>。判断它是 <code>ipfs://</code>、<code>ar://</code>、<code>data:</code> 还是 HTTPS；如果是 IPFS，用 <code>ipfs cat &lt;CID&gt;</code> 取回 JSON，再检查 <code>image</code> 字段的写法。'
])}
<p>预期结果：你能解释同一份内容为什么会有两个不同的 CID，并给这个 NFT 的存储方式打一个风险等级。</p>`)}

${exercises([
  ['一个 DApp 的证明文件（JSON）放在 IPFS，链上只存它的 CID。用户反馈“链接打不开”。列出排查顺序。', '<p>① 用多个公共网关和自己的节点访问这个 CID，区分“个别网关故障”和“全网没人提供”。② 查自己的 pin 列表和固定服务状态（是否欠费、是否误删）。③ 确认链上存的 CID 和上传时得到的 CID 一致（版本、编码是否混用）。④ 如果全网都取不到，从备份重新上传：内容相同、参数相同，CID 就相同，链上记录不用改。⑤ 补上定时可用性检查和告警。</p>'],
  ['为什么 Rollup 的交易数据放在 blob 里就够了，而 NFT 图片不能只放在 blob 里？', '<p>Rollup 数据只需要在挑战期和同步期内可下载，之后状态已经确定，节点可以删除 blob（约 18 天后）。NFT 图片需要多年后仍能打开，blob 不保证长期保存，所以要放在 IPFS + pin、Filecoin 或 Arweave 上。</p>'],
  ['（示例）某 DePIN 项目一年硬件数量增长 5 倍，需求方付费从 100 万美元增长到 120 万美元，排放价值从 1,000 万美元增长到 2,000 万美元。你怎样评价？', '<p>需求覆盖率从 100 ÷ 1,000 = 10% 降到 120 ÷ 2,000 = 6%。硬件增长主要由排放驱动，真实需求几乎没增长，每台设备的真实收入反而下降。这是飞轮“供给过剩”的信号：一旦排放减少或币价下跌，供给方会大量退出。</p>']
])}
${checklist([
  '能说出 CID 的四个组成部分，并解释同一文件为什么可能有不同 CID。',
  '能区分“完整性”（CID 保证）和“可用性”（pin、存储合约保证）。',
  '能画出 Filecoin 存储交易的状态，并说出 PoRep、PoSt、PDP 各证明什么。',
  '能为 Rollup 数据、NFT 媒体、前端文件、个人数据各选一种存储方式并说明理由。',
  '能用回本周期和需求覆盖率评估一个 DePIN 项目。'
])}
${mistakes([
  ['文件上传到 IPFS 就永久保存了。', 'IPFS 只是寻址和传输协议。没有节点 pin，内容会被回收；长期保存要用固定服务、Filecoin 或 Arweave。'],
  ['通过 HTTPS 网关访问 IPFS 内容同样不可篡改。', '普通网关替你做了校验，你在信任网关。要自己校验，用本地节点或可验证检索。'],
  ['Filecoin 的证明保证我随时能取回数据。', 'PoRep / PoSt 证明数据在硬盘上；检索速度要另外约定，或使用 PDP 热存储服务。'],
  ['数据可用性层就是存储层。', 'DA 只保证一段时间内可下载。以太坊 blob 约 18 天后可被删除。'],
  ['DePIN 的硬件越多，项目越健康。', '要看需求方真实付费能否覆盖代币排放。供给增长而需求不增长，是补贴驱动的泡沫。']
])}
${recap([
  'CID = multibase + 版本 + multicodec + multihash；内容变 CID 就变；同一文件因上传参数不同可能有不同 CID。',
  'CID 保证完整性，pin 和存储激励保证可用性；普通网关访问时你在信任网关。',
  'Filecoin：有期限的存储交易，PoRep 证明独立副本，WindowPoSt 持续审计；2026 年上线的 PDP 服务每 24 小时校验热数据。',
  'Arweave：一次付费，200 年成本 + 捐赠基金，依赖成本下降假设，不能删除。',
  'DA 不是长期存储；NFT 元数据要防可改 baseURI、网关 URL、漏 pin 媒体。',
  'DePIN 看“需求付费 ÷ 排放”与回本周期，工作证明的强度决定虚假供给的多少。'
])}
${quiz([
  { q: '关于 CID，下面哪项正确？', o: ['同一个文件在任何设置下 CID 都相同', 'CID 由服务器随机分配', '分块大小或 CID 版本不同，CID 也会不同', 'CID 保证内容永远可以取回'], a: 2, why: 'IPFS 文档说明 CID 还取决于分块、DAG 结构、编解码器、版本和哈希算法。CID 只保证完整性，不保证可用性。' },
  { q: 'Filecoin 的 WindowPoSt 主要用来证明什么？', o: ['存储提供者在合约期内持续保存着数据', '用户已经付款', '数据可以在 1 秒内取回', '数据已经加密'], a: 0, why: 'WindowPoSt 按分区持续审计存储；漏交会被罚没抵押。它不涉及付款、检索速度或加密。' },
  { q: '以下哪类数据最不应该上传到 Arweave？', o: ['开源项目的发布包', 'NFT 的公开图片', '用户的身份证照片', '公开的研究数据集'], a: 2, why: 'Arweave 设计为永久存储且不能删除。个人敏感数据一旦上传就无法撤回，还可能违反数据保护法规。' },
  { q: '某 DePIN 项目需求方付费 50 万美元，同期排放价值 1,000 万美元。需求覆盖率是多少？', o: ['50%', '20%', '0.5%', '5%'], a: 3, why: '覆盖率 = 50 ÷ 1,000 = 5%。供给方 95% 的收入来自新发行代币。' },
  { q: 'Rollup 把交易数据放进以太坊 blob 后，下面哪项说法正确？', o: ['blob 永久保存在所有节点上', 'blob 保证一段时间内可下载，之后节点可以删除', 'blob 等同于 IPFS pin', 'blob 里的数据合约可以直接读取'], a: 1, why: 'blob 是数据可用性方案，约 18 天后可被删除；合约只能读取 blob 的承诺（版本化哈希），读不到内容本身。' }
])}
${terms([
  ['内容标识符', 'CID, Content Identifier', '由多重编码前缀和内容哈希组成的 IPFS 地址。'],
  ['多重哈希', 'Multihash', '在摘要前写明哈希算法和长度的格式，让 CID 可以更换哈希算法。'],
  ['复制证明', 'PoRep, Proof of Replication', '证明存储提供者把数据封装成一份唯一独立副本的证明。'],
  ['时空证明', 'PoSt, Proof of Spacetime', '证明存储提供者在一段时间内持续保存数据的证明，分 WindowPoSt 和 WinningPoSt。'],
  ['数据持有证明', 'PDP, Proof of Data Possession', 'Filecoin 热存储服务使用的定期链上校验，证明数据仍可被访问。'],
  ['存储捐赠基金', 'Storage endowment', 'Arweave 用上传费的一部分建立的基金，用收益支付未来的存储成本。'],
  ['去中心化物理基础设施网络', 'DePIN', '用代币奖励个人或公司提供真实硬件服务的网络。'],
  ['覆盖证明', 'Proof of Coverage', 'Helium 用来验证热点确实在声明位置提供无线覆盖的机制。'],
  ['燃烧铸造均衡', 'Burn-and-Mint Equilibrium', '需求方燃烧代币换取服务、供给方按排放获得代币的经济模型。']
])}
` });
})();
