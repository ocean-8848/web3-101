/* ---------- M11 更多应用赛道（3）：m09-7 NFT 市场、版税与 Memecoin 发行 ---------- */
(() => {
CUR = 'm09-7';
addCh({ id: 'm09-7', nav: 'NFT 市场与 Memecoin', title: 'M11.6 NFT 市场、版税与 Memecoin 发行：签名订单、联合曲线与防坑清单', desc: 'NFT 订单怎样签名与成交，版税为什么收不到，联合曲线发币怎样运作，买币前怎样自查', html: `
<h1>M11.6 NFT 市场、版税与 Memecoin 发行：签名订单、联合曲线与防坑清单</h1>
${meta(['说出 Seaport 订单的主要字段（offerer、zone、offer、consideration、orderType 等），解释“链下签名、链上成交”和聚合器、出价池的作用，并用 SQL 找出可疑的对敲交易。', '解释 ERC-2981 为什么只是“查询接口”，讲清运营商过滤、可选版税、ERC-721C 等链上强制方案的时间线与局限，并读出一个真实合集的版税设置。', '用恒定乘积公式算出联合曲线发币的买入量、毕业市值和创作者清仓的价格冲击，并按清单检查一个新代币的权限、税率、流动性和持仓。'], '前置：<a href="#m02-50">M02.6 NFT 与代币发行</a>、<a href="#m07-6">M03.6 签名与登录</a>、<a href="#m02-5">M02.5 ERC-20 与授权</a>', ['bondcurve'])}
${beginner(`<p><strong>订单簿（Order book）</strong>：把想买的价格和想卖的价格排成两列的清单。NFT 市场的订单簿通常存在平台自己的服务器上，而不是链上。</p>
<p><strong>版税（Royalty）</strong>：NFT 每次二级市场转手时，按成交价抽一部分给创作者，例如 5%。</p>
<p><strong>联合曲线（Bonding curve）</strong>：一条由公式决定“买得越多，单价越高”的曲线，合约自己当对手方，不需要先有人挂单。</p>
<p><strong>Rug（拉地毯）</strong>：项目方收完钱后抽走流动性或抛售代币，价格归零。<strong>Honeypot（蜜罐）</strong>：只能买、不能卖的代币。</p>
<p><strong>狙击（Sniping）</strong>：用程序在代币刚创建的同一个区块里抢先买入，再卖给后来的人。</p>`)}

<h2>1. 一句话理解</h2>
${one('NFT 市场把“挂单”做成一张可以离线签名的订单，成交时才上链；版税是订单里的一行转账，写不写取决于市场；Memecoin 发行把“做市”交给一条公式曲线，任何人都能发币，所以风险从“买错项目”变成了“买到陷阱”。')}
${call('analogy', `<p>NFT 市场像<strong>拍卖行的委托单</strong>：你在委托单上签字，写明“有人付到这个价，就把这件藏品过户给他，其中 5% 付给原作者”。拍卖行把单子贴在墙上（订单簿），买家照单付款，法院（合约）当场核对签名并执行。Memecoin 发行像<strong>自动售货机</strong>：投一枚币出一份货，货越少价越高；机器里装满后，货物和钱一起搬进大市场。</p>
<p>比喻的局限：墙上的单子可能已经过期，合约会拒绝；售货机里的货是谁装的、有没有留后门，机器本身不会告诉你。</p>`)}
${art('一图看懂：订单在链下签名，成交在链上结算，版税只是订单里的一行', 660, 310, [
  S.zone(10, 28, 230, 226, { t: '链下（市场服务器）', k: 'idle' }),
  S.zone(262, 28, 388, 226, { t: '链上（Seaport 合约）', k: 'info' }),
  S.box(24, 56, 202, 52, { k: 'warn', icon: 'person', t: '卖家', s: '签名一次，不花 Gas' }),
  S.box(24, 140, 202, 82, { k: 'key', icon: 'doc', t: '签名订单', s: 'offer：我的 NFT\nconsideration：价款 +\n版税 + 平台费' }),
  S.arrow(125, 110, 125, 138, { label: '签名' }),
  S.box(278, 56, 170, 56, { k: 'tint', icon: 'code', t: 'Seaport', s: '验签 · 查有效期' }),
  S.box(278, 160, 170, 52, { k: 'info', icon: 'person', t: '买家', s: '提交订单并付款' }),
  S.box(482, 50, 156, 44, { k: 'ok', icon: 'block', t: 'NFT → 买家' }),
  S.box(482, 106, 156, 44, { k: 'ok', icon: 'coin', t: '价款 → 卖家' }),
  S.box(482, 162, 156, 44, { k: 'warn', icon: 'coin', t: '版税、费 → 收款人' }),
  S.arrow(228, 160, 276, 98),
  S.arrow(363, 158, 363, 114),
  S.arrow(450, 76, 480, 72), S.arrow(450, 90, 480, 126), S.arrow(450, 102, 480, 182),
  S.text(330, 286, '版税能不能收到，取决于订单里有没有写这一行（示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '卖家只签名、不上链；买家提交订单时，Seaport 一次性完成验签、转 NFT 和分账。'],
  ['key', '“consideration”里有几行收款，成交时就付几笔：版税和平台费都是其中的普通条目。'],
  ['risk', '签名等于授权。一张被钓鱼签下的订单可以把你的 NFT 以 0 价成交，见 M03.6。'],
  ['limit', '订单在链下，所以取消要么上链（花 Gas），要么靠短有效期。']
], '卖家在链下签署订单，买家在链上提交，Seaport 合约验签后同时转移 NFT、价款和版税。', 'm09-7')}

<h2>2. NFT 市场的订单模型</h2>
${recall('<p>ERC-721 / 1155 的区别、元数据、批量铸造，以及一个把挂单存在链上的不托管市场合约，见 <a href="#m02-50">M02.6 NFT 与代币发行</a>。那篇的对照表里提到“链下签名订单更省 Gas”。本节展开这条路线，不重复合约写法。</p>')}
<p>链上存挂单的市场要为每次上架、改价、下架付 Gas。主流市场改用<strong>链下订单、链上成交</strong>：卖家用 EIP-712 签一张订单（签名机制见 <a href="#m07-6">M03.6</a>），市场把它放进自己的订单簿；有人愿意成交时，把订单和签名提交给合约，合约验签、检查条件、完成转账。Seaport 是 OpenSea 在 2022 年推出的开源协议，OpenSea 称在其平台上创建或成交的订单都使用 Seaport${cite('OpenSea 文档：Seaport', 'https://docs.opensea.io/docs/seaport')}。下面的字段以 Seaport 文档为准${cite('Seaport 文档（GitHub）', 'https://github.com/ProjectOpenSea/seaport/blob/main/docs/SeaportDocumentation.md')}：</p>
${tbl(['字段', '含义', '工程上要注意'], [
  ['offerer', '提供 offer 的账户，必须批准这张订单', '签名人必须就是它（或合约签名 ERC-1271）'],
  ['offer[]', '卖家愿意交出的东西：itemType、token、identifierOrCriteria、startAmount、endAmount', '起止数量不同就是荷兰拍或英式拍的价格曲线'],
  ['consideration[]', '卖家要收到的东西，每一条带 recipient', '价款、版税、平台费都写在这里，各自一个收款人'],
  ['orderType', 'FULL / PARTIAL（能否部分成交）× OPEN / RESTRICTED（任何人可成交，还是必须经过 zone），另有 CONTRACT', 'RESTRICTED 订单要求 zone 同意才能成交'],
  ['zone、zoneHash', '可选的第二个账户：可以取消订单；对 RESTRICTED 订单，成交前后由它校验', '是链上附加规则的挂载点，OpenSea 用它做版税强制，见第 4 节'],
  ['startTime、endTime', '订单有效期', '有效期越短，越不依赖“取消”'],
  ['salt、conduitKey', '随机数；指定用哪个 conduit 搬运代币（即你授权给了谁）', '你 approve 的是 conduit，不是每个市场合约'],
  ['counter', '必须等于 offerer 当前的 counter', '链上 <code>incrementCounter()</code> 一次作废该账户所有旧订单']
])}
<p>成交入口有几个：<code>fulfillBasicOrder</code>（最省 Gas，只支持“一个 NFT 换 ETH 或一种 ERC-20”这类简单结构）、<code>fulfillOrder</code>、<code>fulfillAdvancedOrder</code>（可部分成交、可用“条件”订单，例如“该合集任意一枚”的集合出价）、<code>fulfillAvailableOrders</code>（批量扫货，跳过失效订单）、<code>matchOrders</code>（用显式的 fulfillment 把多张订单撮合，例如一张卖单配一张买单）。</p>
${code('TYPESCRIPT', `
// 一张“卖 1 枚 NFT，收 1 ETH，其中 5% 给创作者（平台费同理，再加一行）”的订单参数（字段名见 Seaport 文档）。
// 实际开发用 @opensea/seaport-js 的 createOrder，这里只展示结构。金额单位 wei，地址为占位。
const order = {
  offerer: seller,
  zone: '0x0000000000000000000000000000000000000000',
  offer: [{ itemType: 2, token: nft, identifierOrCriteria: 42n, startAmount: 1n, endAmount: 1n }], // 2 = ERC721
  consideration: [
    { itemType: 0, token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: 0n,
      startAmount: 925000000000000000n, endAmount: 925000000000000000n, recipient: seller },       // 0.925 ETH 给卖家
    { itemType: 0, token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: 0n,
      startAmount: 50000000000000000n, endAmount: 50000000000000000n, recipient: creator },        // 版税 5%
  ],
  orderType: 0,            // FULL_OPEN
  startTime: now, endTime: now + 7n * 86400n,
  zoneHash: '0x' + '00'.repeat(32), salt: randomSalt, conduitKey: '0x' + '00'.repeat(32),
  totalOriginalConsiderationItems: 2, counter
}
`)}
<p><strong>算一算（示例）：</strong>标价 1 ETH，版税 5%，平台费 2.5%：卖家实收 1 − 0.05 − 0.025 = 0.925 ETH。如果某个市场允许买家把版税改成 0，卖家实收变为 0.975 ETH，创作者收 0。这就是下一节“版税之争”的全部经济学。</p>
${call('warn', '<p>订单签名的危险在 <code>consideration</code>：它写着“你会收到什么”。钓鱼订单把价款设成 0 或把收款人换成攻击者。签名前要读 offer 和 consideration，不是只看“签名请求”四个字。</p>')}

<h3>聚合器、出价池与对敲</h3>
<p><strong>聚合器</strong>把多个市场的订单簿合到一个界面，用户一次扫货，交易路由到各市场的合约。Blur 是典型：它的<strong>出价池（Bid Pool）</strong>用积分奖励挂在地板价附近、且持续时间长的集合出价，让买盘变厚${tag('待核实')}（出价池规则的官方文档本次未能访问，以上按多篇二级资料归纳）。2023 年 5 月 Blur 又上线点对点 NFT 借贷 Blend${cite('Blockworks：Blur 推出 Blend', 'https://blockworks.co/news/blur-nft-lending')}。</p>
${call('info', '<p>时间敏感：据 The Block 2026-10-12 报道，Blur 宣布将在 2026 年 11 月关闭前端，Blend 在 2026-11-12 停止撮合新贷款；链上市场协议继续运行；Blur 的月成交量从 2023 年 3 月约 14.3 亿美元的峰值降到 2026 年 3 月不足 700 万美元' + cite('The Block：Blur 将关闭前端', 'https://www.theblock.co/post/418363/blur-nft-marketplace-shutting-down-frontend-blend') + '。这个例子说明：靠代币激励养出来的交易量，激励一停就会消失。</p>')}
<p><strong>对敲（Wash trading）</strong>是自己卖给自己，制造虚假成交量。动机有两种：抬高“地板价”和“成交记录”，或者刷市场的代币奖励。学术研究（以太坊 NFT 市场，截至 2022 年 1 月）发现 5.66% 的合集存在对敲，估计虚假成交额约 34.1 亿美元；利用奖励计划的对敲更赚钱，在 LooksRare 上平均每次成功操作获利约 105.5 万美元，而靠转卖抬价的对敲约一半亏钱${cite('La Morgia 等：A Game of NFTs（arXiv:2212.01225）', 'https://arxiv.org/abs/2212.01225')}。</p>
<p>最朴素的检测是找“来回倒手”：同一枚 NFT，A 卖给 B，不久 B 又卖给 A。下面是 Dune 上的写法（<code>nft.trades</code> 的列名以 Dune 当前的 schema 为准，使用前先在数据浏览器里确认；Dune 与 SQL 见 <a href="#m05-66">M04.28 Dune 与链上 SQL</a>）：</p>
${code('SQL', `
-- 7 天内同一枚 NFT 在两个地址之间来回成交
SELECT a.nft_contract_address, a.token_id, a.seller AS addr1, a.buyer AS addr2,
       a.block_time AS t1, b.block_time AS t2, a.amount_usd AS p1, b.amount_usd AS p2
FROM nft.trades a
JOIN nft.trades b
  ON  a.blockchain = b.blockchain
  AND a.nft_contract_address = b.nft_contract_address
  AND a.token_id = b.token_id
  AND a.buyer  = b.seller
  AND a.seller = b.buyer
  AND b.block_time > a.block_time
  AND b.block_time < a.block_time + interval '7' day
WHERE a.block_time > now() - interval '30' day
LIMIT 100
`)}
<p>这只能抓到最简单的两方互刷。更隐蔽的做法是多地址成环，或由同一个资金来源（见 <a href="#m05-67">M04.29 链上取证</a>）给买方充值。常用的补充信号：买卖双方的 Gas 资金来自同一地址；成交价远高于同合集的其他成交；同一钱包反复在同一合集同一价位成交；奖励期结束后成交量骤降。</p>

<h2>3. 版税：一个“建议”怎样变成了“可选”</h2>
<p><strong>ERC-2981</strong>只定义一个查询函数：<code>royaltyInfo(tokenId, salePrice)</code> 返回 <code>(receiver, royaltyAmount)</code>。规范说明版税支付是“自愿”的，因为 <code>transferFrom</code> 并不总意味着发生了一次销售；支持该标准的市场“应该”实现转账版税的方法，没有实现的市场则不会付${cite('EIP-2981：NFT Royalty Standard', 'https://eips.ethereum.org/EIPS/eip-2981')}。也就是说，<strong>合约能告诉你该付多少，但没有任何机制拦着你不付</strong>。接口检测用 ERC-165：<code>supportsInterface(0x2a55205a)</code>。</p>
<p>2022 年下半年，市场开始竞争“谁收得更便宜”：Magic Eden 在 2022-10-15 宣布版税可选${cite('The Block：Magic Eden 选择可选版税', 'https://www.theblock.co/news/web3/2022-10-15-solana-nft-platform-magic-eden-opts-for-optional-royalty-payments-177414')}；X2Y2 等相继调整，同年 11 月的梳理见${cite('The Block：NFT 版税的来龙去脉', 'https://www.theblock.co/news/web3/2022-11-12-nft-royalties-the-story-so-far-185497')}；据报道 Blur 对无法使用过滤器的合集执行 0.5% 的最低版税${cite('Blockworks：Blur 与 OpenSea 版税之争', 'https://blockworks.co/news/blur-opensea-royalties-nft-creators')}。OpenSea 的应对是<strong>运营商过滤器（Operator Filter Registry）</strong>：合集合约在转移前检查调用者，把不付版税的市场合约列入黑名单。但过滤器要靠整个生态自愿接入，Blur 等市场通过自己的合约路径绕开。2023-08-17 OpenSea 宣布：从 8 月 31 日起停用过滤器、新合集的创作者费改为可选；已启用过滤器的合集强制到次年 2 月 29 日${cite('The Block：OpenSea 停用版税强制工具', 'https://www.theblock.co/post/246095/opensea-disables-royalty-enforcement-tool-makes-creator-fees-optional')}。</p>
${tbl(['方案', '怎样强制', '局限'], [
  ['ERC-2981', '链上声明收款人和比例', '只是查询接口，不阻止任何转账'],
  ['运营商过滤器（已退役）', '合约拒绝黑名单合约来转移', '要靠全生态配合；用户可以通过钱包到钱包转账、包装合约绕开；OpenSea 已于 2023 年宣布停用'],
  ['ERC-721C 等转移验证器（Limit Break）', '合集合约在每次转移前调用独立的“转移验证器”，由创作者设置白名单或安全等级' + cite('Limit Break：ERC721-C 介绍', 'https://medium.com/limit-break/introducing-erc721-c-a-new-standard-for-enforceable-on-chain-programmable-royalties-defaa127410'), '合约必须一开始就按该标准写；白名单谁来管、能不能升级是新的信任问题；绕开白名单的路径要持续堵'],
  ['OpenSea 的 Seaport hook', '对 ERC-721C / 1155-C 代币，用 RESTRICTED 订单 + SignedZone 校验，并要求成交时附带 SIP-7 的 extraData' + cite('OpenSea 文档：Creator Fee Enforcement（2026-08-17 更新）', 'https://docs.opensea.io/docs/creator-fee-enforcement'), '只在 OpenSea 这条路径上生效；别的市场可以不走这条路径，除非转移验证器把它们拒之门外'],
  ['Solana pNFT', '代币账户永远冻结，转移必须经过 Token Metadata 程序，并由规则集（Rule Set）允许或拒绝程序' + cite('Metaplex 文档：Programmable NFTs', 'https://metaplex.com/docs/token-metadata/pnfts'), '文档称 Token Metadata 已是旧程序，新项目推荐 Core；规则集同样依赖谁来维护名单']
])}
<p>结论：<strong>版税能被强制的程度，等于转移被限制的程度</strong>。限制越强，NFT 越不自由，也越难被 DeFi 协议和其他市场接入。创作者要在“收益”和“流动性”之间选；买家和开发者要意识到：<strong>不要假设版税一定会付，也不要把 <code>royaltyInfo</code> 当成已发生的收入</strong>。</p>

<h3>ERC-1155 与代币绑定账户 ERC-6551</h3>
<p>ERC-1155 在一个合约里放多种代币，每个 id 有数量，适合游戏道具和批量发放，基础见 M02.6。<strong>ERC-6551</strong>给每一枚 NFT 配一个自己的智能合约账户：账户地址由注册表合约用 CREATE2 根据实现地址、盐、链 ID、NFT 合约和 tokenId 算出，NFT 的持有人控制这个账户，现有 NFT 合约不用改${cite('EIP-6551：Non-fungible Token Bound Accounts', 'https://eips.ethereum.org/EIPS/eip-6551')}。于是一个角色 NFT 可以“拥有”装备、代币和历史记录，转让角色就连同账户里的资产一起转走。注意两点：该 EIP 页面标注为“Review”状态；买一个“带装备”的 NFT 前，要查它的绑定账户里到底有什么，也要提防卖家在成交前把里面的资产转走。</p>

<h2>4. Memecoin 发行：联合曲线</h2>
<p>传统发币要先建池、注入流动性、再宣传。<strong>联合曲线发射台</strong>（pump.fun 是代表）把这一步压缩成一次点击：创建代币，合约立即按一条曲线出售，买入的人把钱付给曲线，价格自动上升；曲线售罄后，剩余代币和累计的资金被迁入 AMM 池，转为普通交易。</p>
<p>pump.fun 的公开文档给出了初始参数（截至 2026-11 查阅，官方可能调整，使用前请重读）${cite('pump-fun/pump-public-docs：Pump 程序说明', 'https://github.com/pump-fun/pump-public-docs/blob/main/docs/PUMP_PROGRAM_README.md')}：</p>
${tbl(['参数', '取值', '含义'], [
  ['总供应', '10 亿枚（6 位小数）', '代币的总量'],
  ['初始虚拟 SOL 储备 vS', '30 SOL', '只用来定价，不是真实资金'],
  ['初始虚拟代币储备 vT', '10.73 亿枚', '大于总供应，同样只用来定价'],
  ['初始真实代币储备', '7.931 亿枚', '曲线上真正可卖的量，其余约 2.069 亿枚留给迁移后的池子'],
  ['手续费', '买卖各 1%（文档中的 fee_basis_points = 100）', '另有按币种的创作者费字段，请以最新文档为准'],
  ['毕业条件', '真实代币储备卖光，complete 置为 true', '曲线内没有币可卖了'],
  ['迁移', '迁入 PumpSwap（AMM），LP 代币被销毁；迁移是无许可的', '2025-03-20 起迁移目的地为 PumpSwap，早期文章写的 Raydium 已过时']
])}
<p>定价公式就是 <a href="#m02-10">AMM</a> 里的恒定乘积：<code>vS × vT = k</code>。买入时，净投入 <code>Δs</code> 推高 <code>vS</code>，<code>vT</code> 按 <code>k / vS</code> 缩小，差额就是买到的币。</p>
<p>例如买入净 1 SOL：<code>vS = 31</code>，<code>vT = 32,190 / 31 ≈ 10.387</code> 亿，买到约 3,428 万枚，占总供应 3.43%，之后价格约 2.98×10<sup>-8</sup> SOL。</p>
<p><strong>算一算（示例）：</strong>初始价格 = 30 / 10.73 亿 ≈ 2.8×10<sup>-8</sup> SOL，市值 = 价格 × 10 亿 ≈ 28 SOL。真实储备卖出 7.931 亿枚后，<code>vT = 10.73 − 7.931 = 2.799</code> 亿，<code>vS = k / vT = 32,190 / 279.9 ≈ 115 SOL</code>，也就是真实流入 115 − 30 = <strong>85 SOL</strong>（不计手续费）。毕业时市值 = 115 / 2.799 亿 × 10 亿 ≈ 411 SOL，是起点的约 14.7 倍；SOL 按 150 美元（示例）算，起点约 4,200 美元，毕业约 6.2 万美元。一些教程说“约 55 SOL 触发毕业”，是把虚拟的 30 SOL 也算作了买入；按上面的公式，真实资金约 85 SOL。</p>
${mm('一次联合曲线发币的生命周期', `
flowchart LR
  A["创作者创建代币<br/>一笔交易"] --> B["创作者首买<br/>常与创建同块"]
  B --> C["曲线内交易<br/>买贵卖便宜"]
  C --> D{"真实代币<br/>卖光？"}
  D -- 否 --> C
  D -- 是 --> E["complete = true"]
  E --> F["迁入 AMM 池<br/>LP 被销毁"]
  F --> G["池内自由交易"]
  B -.-> H["狙击者同块买入"]:::risk
  C -.-> I["创作者或大户卖出"]:::risk
`, [
  ['flow', '创建、首买、曲线交易、毕业、迁移是一条线；毕业之前价格完全由公式决定，不需要对手方。'],
  ['key', '毕业不等于项目有价值，只表示曲线内的币被买完了。'],
  ['risk', '首买和同块狙击决定了最早的持仓分布；曲线内的卖出只是按公式付款，先卖的人拿走后来者的钱。'],
  ['limit', '迁移后价格由池子深度决定，约 85 SOL 的真实储备对应的深度很浅，大额卖出冲击很大。']
])}
${lab('bondcurve')}
<h3>Base / EVM 上的对应做法，以及公平发射与狙击</h3>
<p>EVM 链上有两类：一类是<strong>联合曲线合约</strong>（逻辑与上面类似，毕业后迁入 Uniswap 一类的池）；另一类是<strong>工厂合约一次完成发币、建池、锁仓</strong>。Base 上的 Clanker 属于后者：它的 v4 文档中，工厂合约触发建池，LP 位置由 LpLocker 合约放置，LP 手续费归集到 ClankerFeeLocker 供收款人领取，还有让创作者把一部分代币锁一段时间的 Vault 扩展${cite('Clanker 文档：v4 核心合约', 'https://clanker.gitbook.io/clanker-documentation/core-contracts/v4.0.0')}。这类设计的价值在于：<strong>流动性在建池时就被合约接管，创作者没有 LP 代币可抽走</strong>。</p>
<p><strong>公平发射</strong>的含义是：没有预挖、没有白名单、所有人在同一条规则下买入。但“公平”只在规则层面，抢不抢得到取决于速度：同一区块里，程序化狙击者可以排在普通用户之前，创作者也可以用多个新钱包“捆绑买入”，从外面看像是很多不同的买家。所以持仓分布要看<strong>资金来源</strong>，不是只数地址个数。</p>

<h2>5. Rug 与蜜罐：常见套路与自查清单</h2>
${cases([
  ['SQUID（“鱿鱼游戏”代币）', '2021-10 至 11',
   '<p>代币借热播剧营销，在 PancakeSwap 上涨到数千美元，随后大量用户报告无法卖出（项目方称为“反砸盘机制”，即蜜罐），2021-11-01 项目方抽走资金、价格归零；各媒体估计的损失在 280 万至 340 万美元之间。官网错字、虚构的团队介绍是当时就有的红旗。</p>',
   [['CoinDesk：Squid Game 代币崩盘', 'https://www.coindesk.com/markets/2021/11/01/squid-game-token-crashes-developers-say-theyve-left-the-project/'], ['Cointelegraph：Squid Game 骗局崩盘', 'https://cointelegraph.com/news/game-over-squid-game-inspired-crypto-scam-collapses-as-price-crashes-from-2-8k-to-zero']]]
])}
<p>套路可以归成四类，每一类都有可检查的链上证据：</p>
${tbl(['套路', '怎么运作', '检查什么（EVM）', '检查什么（Solana）'], [
  ['增发（Mint）', '创作者随时铸新币，卖给买家', '合约里的 mint 函数；owner 是不是还在', '代币的 Mint authority 是否已撤销'],
  ['隐藏税 / 限卖', '卖出税 99%，或只允许白名单卖，或限制一次卖出比例', '模拟卖出；看 sell_tax、cannot_sell_all', '看是否使用了 Token-2022 的转账费用等扩展'],
  ['冻结 / 黑名单', '创作者把你的地址拉黑，转账失败', 'blacklist、transfer pause 一类函数', 'Freeze authority 是否已撤销'],
  ['撤池（Rug pull）', '创作者持有 LP 代币，随时把池子抽干', '池子的 LP 代币在谁手里：销毁地址、锁仓合约，还是创作者钱包', '迁移后 LP 是否被销毁（pump.fun 文档称迁移后销毁 LP）'],
  ['合约可升级', '代理合约，实现可以被替换成恶意版本', '是否是代理合约；谁有升级权限', '程序是否可升级、升级权限是谁']
])}
<p>EVM 上可以用扫描器做第一轮筛选。GoPlus 的接口里有 <code>is_honeypot</code>、<code>buy_tax</code>、<code>sell_tax</code>、<code>is_mintable</code>、<code>owner_address</code>、<code>can_take_back_ownership</code>、<code>hidden_owner</code>、<code>lp_holders[].is_locked</code>、<code>is_open_source</code>、<code>is_proxy</code> 等字段${cite('GoPlus 文档：Token Security 返回字段', 'https://docs.gopluslabs.io/reference/response-details')}：</p>
${code('BASH', `
# 以太坊主网（chain_id=1）；把地址换成待查代币，返回的 result 以地址小写为键
curl -s "https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0xTOKEN" | jq '.result[]
  | {is_honeypot, buy_tax, sell_tax, is_mintable, owner_address, hidden_owner, can_take_back_ownership, is_proxy, is_open_source}'

# Solana：直接读代币的权限（Mint authority / Freeze authority 应为 (not set)）
spl-token display <MINT_ADDRESS>
`)}
${call('warn', '<p>扫描器给的是<strong>已知模式</strong>的提示，不是安全证明。没通过只说明“值得更警惕”，通过也可能是新型陷阱；合约未开源时，很多字段会返回空值或被忽略。蜜罐检测最终要靠模拟卖出和读合约。</p>')}
${mm('买币前的自查流程', `
flowchart TD
  A["拿到代币地址"] --> B["Etherscan / Solscan<br/>看创建者与合约"]
  B --> C{"权限已放弃？<br/>mint / freeze / owner"}
  C -- 否 --> X["放弃或极小仓位"]:::risk
  C -- 是 --> D{"LP 锁定或销毁？"}
  D -- 否 --> X
  D -- 是 --> E{"扫描器 + 模拟卖出<br/>税率和卖出正常？"}
  E -- 否 --> X
  E -- 是 --> F{"前 10 持仓占比<br/>资金来源分散？"}
  F -- 否 --> X
  F -- 是 --> G["仍属高风险，只用亏得起的钱"]:::warn
`, [
  ['flow', '四道关依次是权限、流动性、税率与卖出、持仓与资金来源，任何一道不过就停。'],
  ['key', '“全部通过”的终点仍然是“高风险”，因为 Memecoin 的价格没有基本面支撑。'],
  ['risk', '创作者用多个新钱包捆绑买入，会让前 10 持仓看起来分散。要追资金来源。'],
  ['limit', '这些检查发现不了“创作者自己慢慢抛售”，这需要持续看创作者钱包。']
])}

<h2>6. 合规一段话</h2>
<p>是否构成证券、发币者与平台有哪些义务，随法域和事实而不同。美国 SEC 公司融资部的工作人员在 2025-02-27 发布声明，认为其所描述的那类 meme coin 交易不涉及证券的发售与销售；该声明只代表员工意见，不是委员会规则，不覆盖带有承诺、用 meme 名义包装的证券，也不排除其他机构按欺诈追责${cite('SEC 公司融资部工作人员声明：Meme Coins', 'https://www.sec.gov/newsroom/speeches-statements/staff-statement-meme-coins')}。合规的基本框架见 <a href="#m11-1">M05.1 合规全景</a>，不同法域的差别见 <a href="#m11-4">M05.4 主要法域</a>。以上不是法律意见；你打算在产品里提供发币或交易功能时，应当找当地律师。</p>

${tryit(`<p><strong>两个小时：查一个真实合集的版税，再解剖一个新代币。</strong></p>
${steps([
  '选一个以太坊 NFT 合集的合约地址（在 OpenSea 或 Etherscan 上找，建议选已验证的）。运行：<code>cast call &lt;NFT&gt; "supportsInterface(bytes4)(bool)" 0x2a55205a --rpc-url $RPC</code>，预期返回 <code>true</code> 表示实现了 ERC-2981。',
  '再运行 <code>cast call &lt;NFT&gt; "royaltyInfo(uint256,uint256)(address,uint256)" 1 10000 --rpc-url $RPC</code>。第二个参数 10000 让返回的数量直接等于基点（例如 500 = 5%）。记下收款人是普通地址还是分账合约。',
  '在 OpenSea 或该合集的挂单页看它显示的“创作者费”，比较与链上读出的是否一致；合约页的 Read Contract 里找有没有 <code>setTransferValidator</code> / <code>getTransferValidator</code>，判断它是否使用了转移验证器。',
  '在 Solscan 或 pump.fun 的列表里选一个近期创建的联合曲线代币，记下代币地址。先看代币页：Mint authority、Freeze authority 是否为空；再看创作者钱包：创建前后的转入转出、是否同时在多个代币上出现。',
  '在 Holders 页列出前 10 个持有人：哪些是曲线或池子，哪些是个人；再点最大的 3 个个人地址，看它们的第一笔资金从哪里来、是否来自同一地址。把结论写成一段话：你会买吗？为什么？',
  '进阶：对一个 EVM 新币，运行第 5 节的 curl，把返回字段逐项对照合约页确认。'
])}`)}

${mistakes([
  ['ERC-2981 已经保证了创作者收到版税。', '它只是“告诉你该付多少”的查询接口，规范本身称支付是自愿的。是否支付由成交的市场和转移限制决定。'],
  ['订单签名不花 Gas，所以没有风险。', '签名等于授权成交。钓鱼订单会把你的 NFT 以 0 价卖掉；要读 offer 与 consideration。'],
  ['成交量大就说明 NFT 有价值。', '对敲和奖励计划会制造虚假成交量；Blur 的月成交量从峰值降到极低就是证据。'],
  ['联合曲线毕业意味着项目安全。', '毕业只是曲线内的币卖完了。池子很浅，创作者和早期大户仍可以砸盘。'],
  ['扫描器显示安全就可以买。', '扫描器只认已知模式，且合约未开源时多数字段失效。仍要看权限、LP、持仓和资金来源。']
])}
${recap([
  'NFT 订单在链下签名、链上成交；Seaport 订单由 offerer、offer、consideration、orderType、zone 等字段组成，版税和平台费是 consideration 里的普通条目。',
  '聚合器合并订单簿，出价池用积分激励出价；激励一停，成交量会消失；对敲可用“来回倒手”的 SQL 初筛，但要结合资金来源。',
  'ERC-2981 只是查询接口；运营商过滤器已退役；ERC-721C、Seaport hook、pNFT 是强制方案，代价是转移自由度和新的信任点。',
  '联合曲线靠恒定乘积定价，pump.fun 的初始参数是 30 SOL、10.73 亿枚虚拟储备、7.931 亿枚可卖，真实流入约 85 SOL 时毕业。',
  'Rug 与蜜罐的证据在链上：权限、LP、税率、持仓和资金来源；检查通过仍是高风险。',
  '合规：SEC 员工声明有明确边界，不是法律意见。'
])}
${quiz([
  { q: '一张 Seaport 订单的 <code>consideration</code> 数组里有三条收款：卖家、创作者、平台。成交时发生什么？', o: ['只付第一条，其余作废', '三条各自转给自己的 recipient，一起成功或一起失败', '创作者那条由合约自动忽略', '三条按比例平分'], a: 1, why: 'consideration 的每一条都有自己的 recipient，成交是原子的，要么全付，要么整笔回滚。' },
  { q: '为什么 ERC-2981 不能保证创作者收到版税？', o: ['函数需要付费才能调用', '只能在 Solana 使用', '规范只提供查询，支付是否发生由市场决定', '版税比例不能超过 1%'], a: 2, why: 'royaltyInfo 只返回收款人和金额，转账本身没有被强制。' },
  { q: '用 pump.fun 的初始参数（vS = 30 SOL，vT = 10.73 亿枚），投入净 1 SOL 约买到多少？', o: ['约 3,430 万枚，占总供应 3.43%', '约 1 亿枚', '约 100 万枚', '约 10 亿枚'], a: 0, why: 'vS 变为 31，vT = 32,190 / 31 ≈ 10.38 亿，差额约 3,428 万；扣 1% 手续费后略少，同量级。' },
  { q: '以下哪项最能说明代币“不能随意被抽走流动性”？', o: ['官网写着“安全”', 'LP 代币已销毁，或锁在可信的锁仓合约', '前 10 个地址占 5%', '扫描器没有任何输出'], a: 1, why: '撤池需要持有 LP 代币。销毁或锁仓后，创作者没有可抽走的凭证。' },
  { q: '同一枚 NFT，A 卖给 B，三天后 B 又以更高价卖给 A。最合理的第一反应是？', o: ['说明它很热门', '这是正常价格发现', '怀疑对敲，继续查两个地址的资金来源和同合集其他成交', '直接判定犯罪'], a: 2, why: '来回倒手是对敲的典型信号，但只是线索，需要结合资金来源和其他成交才能下结论。' }
])}
${exercises([
  ['一张订单标价 2 ETH，版税 5%、平台费 2.5%。卖家实收多少？如果买家在不支持版税的市场成交，创作者少收多少？', '<p>卖家实收 2 × (1 − 0.05 − 0.025) = 1.85 ETH。若版税被取消，创作者少收 2 × 5% = 0.1 ETH，卖家实收变成 2 × 0.975 = 1.95 ETH（示例）。</p>'],
  ['计算题（示例）：创作者首买 5 SOL（净 4.95），随后散户净投入 30 SOL。创作者清仓，价格变化多少？', '<p>首买后 vS = 34.95，vT = 32,190 / 34.95 ≈ 921.0 M，创作者持有约 152.0 M 枚（约 15.2%）。散户后 vS = 64.95，vT ≈ 495.6 M，价格 1.31×10<sup>-7</sup> SOL。创作者卖回 152.0 M 枚：vT′ = 647.6 M，vS′ = 32,190 / 647.6 ≈ 49.7，价格 7.68×10<sup>-8</sup>，下跌约 41%；他取走约 15.2 SOL（毛），成本 5 SOL，净赚约 10 SOL，散户承担了这部分亏损。</p>'],
  ['一个新币：mint 已撤销、LP 销毁、扫描器无告警，但前三个钱包各占 12%，且都由同一个地址在创建后同一区块充值。你怎么判断？', '<p>三个钱包由同一来源在同一区块充值，是捆绑买入。三者合计 36%，实际等于一个地址控制 36%，可以随时砸盘。前面的检查通过，不能抵消这个风险：应放弃，或把它当作高度操纵的标的。</p>']
])}
${checklist([
  '能画出一张 Seaport 订单，指出 offer、consideration、zone、orderType 各自的作用，并说出版税写在哪里。',
  '能解释 ERC-2981、运营商过滤器、ERC-721C、Seaport hook、pNFT 各自强制到什么程度和有什么代价。',
  '能写一条 SQL 找出 NFT 来回倒手，并列出至少三个补充的对敲信号。',
  '能用恒定乘积公式算出联合曲线的买入量、毕业市值，以及创作者清仓的价格冲击。',
  '能按“权限、LP、税率与卖出、持仓与资金来源”检查一个新币，并说明扫描器的盲区。',
  '能说清合规一段话的边界：SEC 员工声明的范围，以及为什么这不是法律意见。'
])}
${terms([
  ['订单簿', 'Order book', '想买和想卖的价格清单；NFT 市场常把它放在链下。'],
  ['区域合约', 'Zone', 'Seaport 订单可选的校验账户，可取消订单，并校验 RESTRICTED 订单。'],
  ['聚合器', 'Aggregator', '把多个市场的订单合到一处并路由成交的界面或合约。'],
  ['对敲', 'Wash trading', '自己与自己成交，制造虚假成交量或骗取奖励。'],
  ['版税', 'Royalty', '二级市场成交时按比例付给创作者的费用。'],
  ['转移验证器', 'Transfer validator', '合集合约在转移前调用的独立合约，用来限制谁能转移。'],
  ['代币绑定账户', 'Token-bound account (ERC-6551)', '为每枚 NFT 派生出的智能合约账户，由 NFT 持有人控制。'],
  ['联合曲线', 'Bonding curve', '由公式决定价格的代币买卖曲线，合约自己当对手方。'],
  ['毕业', 'Graduation', '曲线内的代币售罄，剩余资产迁入 AMM 池。'],
  ['蜜罐', 'Honeypot', '只能买入、不能卖出的代币。'],
  ['狙击', 'Sniping', '用程序在代币创建的同一区块抢先买入。']
])}
` });

})();
