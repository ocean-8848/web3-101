/* ---------- M04 零知识证明与隐私（2）：m10-5 隐私协议 · m10-6 MPC/FHE/TEE · m10-7 ★ 实战 ---------- */
(() => {
CUR = 'm10-5';
addCh({ id: 'm10-5', nav: '隐私协议与合规', title: 'M06.5 隐私协议与合规边界：从 Zcash、Tornado Cash 到 Privacy Pools', desc: '屏蔽池、混币器、隐私池与隐身地址怎么工作，制裁与判决划出了哪些边界', html: `
<h1>M06.5 隐私协议与合规边界：从 Zcash、Tornado Cash 到 Privacy Pools</h1>
${meta(['用“承诺、Merkle 树、nullifier、提款证明”四个部件，讲清 Zcash 屏蔽池和 Tornado Cash 怎样切断存款与取款的链接。', '按时间线说出 Tornado Cash 从 2022 年被制裁、2024 年第五巡回法院判决、2025 年被移出制裁名单到开发者刑事案的关键节点，并说清每一步的法律范围。', '比较 Privacy Pools、Railgun、Aztec 和隐身地址（ERC-5564）的设计，判断一个隐私功能“该做”还是“不该做”。'], '前置：<a href="#m10-1">M06.1 零知识证明直觉</a>、<a href="#m10-3">M06.3 第一个电路：Circom 到链上验证</a>')}
${beginner(`<p><strong>承诺（Commitment）</strong>：把一个秘密值和随机数一起哈希，得到一个公开的“封口信封”。别人看不到里面的值，你以后也不能改口。</p>
<p><strong>Nullifier（作废标记）</strong>：从秘密派生出的一个值。花掉一笔隐私资金时公开它，合约记下来，同一笔钱就不能再花第二次。别人无法从 nullifier 反推是哪一笔存款。</p>
<p><strong>匿名集（Anonymity set）</strong>：观察者无法区分的候选人集合。匿名集越大，越难猜出“取款的人是谁”。</p>
<p><strong>制裁（Sanctions）</strong>：政府禁止本国人与特定个人、实体或财产做交易的法律措施。美国由财政部下属的 OFAC（外国资产控制办公室）执行。</p>
<p><strong>隐身地址（Stealth address）</strong>：收款人每次收款都用一个新的一次性地址，旁观者无法把这些地址和收款人的公开身份联系起来。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上隐私协议用同一套部件工作：存款时只公开一个承诺，把它放进 Merkle 树；取款时用零知识证明说“我知道树里某个承诺的秘密”，并公开一个 nullifier 防止重复取款。技术能切断链接，法律决定谁可以用、谁可以运营、开发者要承担什么。')}
${call('analogy', `<p>想象一个大衣帽间。存衣服时你只拿到一个号码牌的“指纹”，指纹贴在公告墙上。取衣服时你证明“我手里有墙上某一张指纹对应的号码牌”，但不说是哪一张；你交出的号码牌会被打孔作废。衣帽间里存的人越多，越难猜出你是谁。</p>
<p>比喻的局限：真实的衣帽间有服务员，他能记住你的脸。链上协议没有服务员，但有你的 IP、存取时间、金额和 Gas 付款地址，这些都会泄露你。</p>`)}
${art('一图看懂：存款只公开承诺，取款只公开证明，两者之间没有可见的联系', 660, 320, [
  S.text(112, 24, '存款：你只公开承诺', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(328, 24, '链上合约', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(545, 24, '取款：你只公开证明', { size: 13.5, b: 1, anchor: 'middle' }),
  S.box(10, 40, 205, 66, { k: 'warn', icon: 'key', t: '秘密', s: 'nullifier + secret\n只留在你本地' }),
  S.box(10, 140, 205, 66, { k: 'tint', t: '承诺 commitment', s: 'Pedersen(nullifier‖secret)\n像封口信封，不能改口' }),
  S.arrow(112, 108, 112, 138),
  S.box(245, 40, 165, 112, { k: 'tint', icon: 'block', t: 'Merkle 树', s: '叶子是所有存款的承诺\n你的只是其中一片\n链上只存根' }),
  S.box(245, 180, 165, 76, { k: 'risk', t: '已用 nullifier 表', s: '见过一次就拒绝\n同一笔钱不能取两次' }),
  S.route([[217, 173], [231, 173], [231, 96], [243, 96]]),
  S.box(440, 40, 210, 80, { k: 'key', icon: 'shield', t: '零知识证明', s: '我知道树里某个\n承诺的秘密' }),
  S.box(440, 150, 210, 106, { k: 'info', t: '公开信号', s: 'root 根\nnullifierHash 作废标记\n收款地址 · 中继 · 手续费' }),
  S.arrow(438, 80, 412, 80),
  S.arrow(438, 218, 412, 218),
  S.text(330, 296, '存款地址与取款地址之间，唯一的联系是一个不指明“是哪片叶子”的证明', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '存款时只有承诺进树；取款时合约核对证明、检查根，再记下 nullifier。两次操作之间没有可见的链接。'],
  ['key', 'nullifier 由秘密派生，公开后合约就能拒绝重复取款，旁观者却无法由它反推出是哪一笔存款。'],
  ['risk', '匿名集不等于树的容量。存完马上取、取到旧地址、用旧地址付 Gas、IP 泄露，都能把“2,000 选 1”缩成“1 选 1”。'],
  ['limit', '协议只切断链接，不判断谁来用。诚实用户和黑客共用一个匿名集，是 Tornado Cash 惹上制裁的根源（见第 5、6 节）。']
], '左侧：秘密算出承诺并放进链上的 Merkle 树；右侧：取款时用零知识证明说明知道树里某个承诺的秘密，并公开 nullifier；合约记下已用的 nullifier，防止重复取款。', 'm10-5')}

<h2>2. 为什么公链需要隐私，又为什么隐私难</h2>
${recall('<p>公链的每一笔转账都公开、永久保存，任何人都能用区块浏览器追踪资金流向。追踪方法在 <a href="#m05-67">M04.13 链上取证与资金追踪</a> 里展开；本篇反过来讲：协议怎样让追踪变难，以及法律怎样限制这种能力。</p>')}
<p>透明账本对审计有利，但对普通用户不友好：你给咖啡店付一次款，店主就能看到你的全部余额和历史。所以隐私需求是真实的。下表列出“隐私”在链上通常指哪几件事。</p>
${tbl(['要隐藏的内容', '例子', '典型技术'], [
  ['发送方与接收方的链接', '谁给谁转了钱', '屏蔽池、混币器（Tornado Cash）、Privacy Pools'],
  ['接收方身份', '捐款地址不暴露收款人的主地址', '隐身地址（ERC-5564）'],
  ['金额', '工资、交易规模', 'Zcash 屏蔽交易、Railgun、Aztec、FHE 代币（见 <a href="#m10-6">M06.6</a>）'],
  ['合约状态与逻辑输入', '投标价、投票内容', 'Aztec 私有函数、FHE、TEE（见 <a href="#m10-6">M06.6</a>）']
])}
<p>隐私可能在四层泄露：<strong>密码学层</strong>（电路漏洞、可信设置）、<strong>协议层</strong>（匿名集太小、非固定面额）、<strong>使用习惯层</strong>（存完马上取、取到旧地址、用同一地址付 Gas）、<strong>网络层</strong>（IP、浏览器指纹、中继日志）。零知识证明只保护第一层，最常见的去匿名化发生在后两层。用自己的旧地址付 Gas 去取款，等于在链上签名“这笔取款是我”，这就是中继（Relayer）存在的原因。</p>

<h2>3. Zcash：协议层内置的屏蔽池</h2>
<p>Zcash 是一条独立的公链，它把隐私写进了协议本身。Zcash 有两类地址：<strong>透明地址</strong>的工作方式和比特币一样，完全公开；<strong>屏蔽地址</strong>的资金存放在<strong>屏蔽池（Shielded pool）</strong>里。屏蔽交易在链上只留下三样东西：新票据的承诺、被花掉票据的 nullifier、一个零知识证明。金额、发送方和接收方都不公开。</p>
${steps([
  '<strong>票据（Note）</strong>：一笔屏蔽资金。它包含金额、接收方地址和随机数，链上只保存它的承诺。',
  '<strong>花费</strong>：花一张票据时，钱包证明“我拥有某张已存在的票据，输入金额等于输出金额”，并公开这张票据的 nullifier。',
  '<strong>查看密钥（Viewing key）</strong>：用户可以把它交给审计方或税务顾问，让对方只读地看到自己的屏蔽交易，而不给出花钱的权限。这是“选择性披露”的早期形态。'
])}
<p>Zcash 的屏蔽池有三代：Sprout、Sapling 和 Orchard。Sprout 和 Sapling 使用 Groth16 证明，需要可信设置；2022 年 5 月 31 日激活的 NU5 升级引入了 Orchard 池，它使用 Halo 2 证明系统，不再需要可信设置${cite('Electric Coin Co.：NU5 activates on mainnet, eliminating trusted setup', 'https://electriccoin.co/blog/nu5-activates-on-mainnet-eliminating-trusted-setup-and-launching-a-new-era-for-zcash')}。可信设置和 Groth16 的关系见 <a href="#m10-2">M06.2 SNARK 与 STARK</a>。</p>

<h2>4. Tornado Cash：以太坊上的混币合约</h2>
<p>Tornado Cash 是一组以太坊智能合约。和 Zcash 不同，它不是一条链，而是在公开的 EVM 上用零知识证明实现“存进去、过一段时间、从另一个地址取出来”。下面的细节来自它公开的源代码 tornado-core${cite('GitHub：tornadocash/tornado-core', 'https://github.com/tornadocash/tornado-core')}。</p>
${steps2('Tornado Cash 的存款与取款', [
  { t: '① 生成秘密', d: '浏览器随机生成 nullifier 和 secret 两个 31 字节的随机数，打包成一张“存款凭据”，用户自己保存。' },
  { t: '② 存款', d: '计算承诺 commitment = Pedersen(nullifier ‖ secret)，连同固定面额的 ETH 一起发给合约。', kind: 'key' },
  { t: '③ 进树', d: '合约把承诺插入一棵 20 层的 Merkle 树（节点哈希用 MiMC），并更新根。' },
  { t: '④ 等待', d: '其他人继续存款，匿名集变大。用户等待越久、存款越多，越难被匹配。' },
  { t: '⑤ 取款证明', d: '用户在本地生成 zk-SNARK：我知道树里某个承诺的 nullifier 和 secret；公开 nullifierHash = Pedersen(nullifier)，以及收款地址、中继地址和手续费。', kind: 'key' },
  { t: '⑥ 合约检查', d: '根在最近 30 个根之内；nullifierHash 没用过；证明有效。通过后记下 nullifierHash 并转账。', kind: 'risk' }
], [
  ['flow', '存款地址和取款地址之间唯一的“联系”是一个零知识证明，而证明不透露用的是哪个承诺。'],
  ['key', '收款地址、中继地址、手续费是证明的公开输入。别人在内存池里复制这份证明、改掉收款地址，证明就会失效。这是防抢跑的关键设计。'],
  ['risk', '合约只接受最近 30 个根。用户在根更新很快的时候生成证明，提交时根可能已经过期，需要重新生成。'],
  ['limit', '固定面额（例如 1 ETH、10 ETH）是为了防止按金额匹配。如果每个池子允许任意金额，匿名集会碎成很多小块。']
])}
<p>注意：<code>recipient</code>、<code>relayer</code>、<code>fee</code>、<code>refund</code> 在电路里不参与计算，只各做一次平方约束，目的就是把它们绑进证明。<a href="#m10-7">M06.7 实战</a> 会照搬这个做法。</p>
<p><strong>算一算（示例）：匿名集到底有多大？</strong></p>
${steps([
  '容量：20 层的 Merkle 树最多放 2<sup>20</sup> = 1,048,576 个承诺。容量不等于匿名集。',
  '假设某个 10 ETH 池子到你取款时一共有 2,000 笔存款，其中 1,400 笔已经取走。观察者只能把你的取款对应到“还没取走的存款”上吗？不是。nullifier 不暴露是哪一笔，所以理论上 2,000 笔都是候选。',
  '现实中观察者会用启发式规则缩小范围（示例）：你在存款后 10 分钟内取款，而这 10 分钟里只有 4 笔存款进入池子 → 候选从 2,000 缩到 4。',
  '如果取款地址又和其中一个存款地址在同一天与同一个交易所账户交互过 → 候选缩到 1。',
  '结论：协议给的是“最多 2,000 选 1”，用户习惯可能把它降到“1 选 1”。取证方的方法见 <a href="#m05-67">M04.13 链上取证与资金追踪</a>。'
])}
${call('warn', '<p>零知识电路本身也会出错。2019 年，安全研究者在 Tornado Cash 使用的 MiMC 哈希电路里发现一个缺陷：代码只给输出赋值，没有加约束，攻击者理论上可以伪造 Merkle 根取款。团队随后修复并迁移了合约。这类“只赋值不约束”的漏洞见 Trail of Bits 的分析' + cite('Trail of Bits：It pays to be Circomspect', 'https://blog.trailofbits.com/2022/09/15/it-pays-to-be-circomspect/') + '，<a href="#m10-7">M06.7</a> 的威胁模型会再讲。</p>')}

<h2>5. 制裁、判决与刑事案：一条时间线</h2>
${call('warn', '<p><strong>本节不是法律建议。</strong>下面只描述公开的政府文件和法院判决。不同国家的规则不同；同一国家的判决也只在特定范围内有效。做任何隐私相关产品之前，先咨询有资质的律师。合规框架见 <a href="#m11-1">M07.1 合规全景</a> 和 <a href="#m11-2">M07.2 KYC、AML 与制裁筛查</a>。</p>')}
${mm('Tornado Cash 的法律时间线（截至 2026 年公开资料）', `
flowchart TB
  A["2022-08-08<br/>OFAC 把 Tornado Cash 列入 SDN 制裁名单"]:::risk --> B["2022 起诉 · 2023 一审<br/>Van Loon 诉财政部<br/>一审支持政府"]
  B --> C["2024-11-26<br/>第五巡回法院：不可变智能合约<br/>不是 IEEPA 意义上的财产"]:::key
  C --> D["2025-03-21<br/>财政部宣布解除对 Tornado Cash 的制裁"]:::ok
  A --> E["2023<br/>开发者 Roman Storm 被起诉"]
  E --> F["2025-08-06<br/>陪审团：无牌汇款共谋罪成立<br/>洗钱与违反制裁两项未达成一致"]:::warn
  F --> G["2026<br/>检方申请重审未决罪名<br/>重审日期延后"]
`, [
  ['flow', '两条线并行：左边是“合约能不能被制裁”（民事/行政），右边是“开发者有没有犯罪”（刑事）。'],
  ['key', '第五巡回法院只回答了一个窄问题：不可变的智能合约不是 IEEPA 下可以被冻结的“财产”。它没有说“隐私协议都合法”。'],
  ['risk', '解除制裁之后，开发者的刑事案仍在继续。“合约不能被制裁”和“运营者不承担责任”是两件事。'],
  ['limit', '图中只有美国。欧盟等其他法域有自己的规则，见下文。']
])}
<p>每个节点的原始来源如下：</p>
<ul>
  <li><strong>2022 年 8 月 8 日</strong>：美国财政部宣布制裁 Tornado Cash，称它自 2019 年以来被用于洗钱的虚拟货币超过 70 亿美元，其中包括朝鲜黑客组织 Lazarus Group 盗取的 4.55 亿美元以上${cite('美国财政部：U.S. Treasury Sanctions Notorious Virtual Currency Mixer Tornado Cash（2022-08-08）', 'https://home.treasury.gov/news/press-releases/jy0916')}。</li>
  <li><strong>2024 年 11 月 26 日</strong>：美国联邦第五巡回上诉法院在 Van Loon v. Department of the Treasury 案中判定，Tornado Cash 的不可变智能合约不是 IEEPA（《国际紧急经济权力法》）所说的“财产”，OFAC 冻结它们超出了法定权限${cite('美国第五巡回上诉法院：Van Loon v. Department of the Treasury, No. 23-50669', 'https://www.ca5.uscourts.gov/Opinions/pub/23/23-50669-CV0.pdf')}。</li>
  <li><strong>2025 年 3 月 21 日</strong>：财政部宣布解除对 Tornado Cash 的经济制裁，同时表示仍然高度关注朝鲜的黑客与洗钱活动${cite('美国财政部：Tornado Cash Delisting（2025-03-21）', 'https://home.treasury.gov/news/press-releases/sb0057')}。</li>
  <li><strong>2025 年 8 月 6 日</strong>：纽约联邦法院的陪审团认定开发者 Roman Storm 共谋经营无牌汇款业务罪名成立，对共谋洗钱和共谋违反制裁两项罪名未能达成一致${cite('The Block：Tornado Cash creator Roman Storm found guilty on money transmitting charge', 'https://www.theblock.co/post/364948/tornado-cash-creator-roman-storm-found-guilty-on-money-transmitting-charge-but-not-guilty-on-sanctions-charge-inner-city-press')}。2026 年检方申请重审未决罪名；据 2026 年 8 月的报道，重审被延后到 2027 年 4 月${cite('Decrypt：Roman Storm’s Tornado Cash retrial pushed to April 2027', 'https://decrypt.co/376577/roman-storms-tornado-cash-retrial-pushed-to-april-2027')}。</li>
</ul>
<p>美国以外，欧盟的反洗钱条例（Regulation (EU) 2024/1624，AMLR）第 79 条禁止信贷机构、金融机构和加密资产服务商保有匿名账户，包括通过“增强匿名性的币种”实现匿名的账户；条例从 2027 年 7 月 10 日起适用${cite('EUR-Lex：Regulation (EU) 2024/1624', 'https://eur-lex.europa.eu/eli/reg/2024/1624/oj')}${cite('Springlex：AMLR Article 79 条文', 'https://www.springlex.eu/en/packages/aml/amlr-regulation/article-79/')}。这条规则约束的是服务商，不是个人持有者；它直接影响交易所能否上架隐私币和接收混币资金。各法域的细节见 <a href="#m11-4">M07.4 主要法域</a>。</p>

<h2>6. 合规友好的隐私设计</h2>
<p>Tornado Cash 的问题不是“用了零知识证明”，而是“诚实用户和黑客在同一个匿名集里，诚实用户无法证明自己和黑客无关”。2023 年起出现的新设计都在回答同一个问题：怎样在保留隐私的同时，让诚实用户能主动证明自己干净。</p>
${compare('四种隐私方案', [
  { name: 'Privacy Pools', tag: '关联集证明', kind: 'key', points: ['取款时额外证明：我的存款属于某个“关联集”', '关联集由 ASP（关联集提供方）维护，例如排除已知黑客存款', '诚实用户可以证明“我不在黑名单里”，不暴露是哪笔存款', '0xbow 于 2025 年在以太坊主网上线'] },
  { name: 'Railgun', tag: 'EVM 上的屏蔽余额', kind: 'info', points: ['资金进入合约后变成加密的 UTXO 式票据', '可以在屏蔽状态下与 DeFi 交互', 'PPOI：证明代币不在列表提供方的标记数据集里', '运行在以太坊等多条 EVM 链上'] },
  { name: 'Aztec', tag: '隐私 L2', kind: 'info', points: ['一条以太坊二层网络，合约可以有私有函数和私有状态', '用户在本地生成证明，链上只看到承诺与 nullifier', '可编程隐私，不只是转账', '2025 年 11 月上线 Ignition 主网阶段'] },
  { name: '隐身地址', tag: 'ERC-5564', kind: '', points: ['只隐藏“收款人是谁”', '不隐藏金额，也不切断发送方', '无需新合约托管资金，钱包层即可实现', '适合捐款、工资、商户收款'] }
], [
  ['key', 'Privacy Pools 和 Railgun PPOI 的思路一致：让用户主动出示“清白证明”，而不是交出全部交易历史。'],
  ['risk', '关联集由谁维护、按什么标准、能否撤销，决定了这个“清白”有多可信，也带来了新的中心化点。'],
  ['limit', '隐身地址不是混币：发送方地址和金额依然公开，取证方仍可以从资金来源追踪。']
])}
<h3>6.1 Privacy Pools：关联集</h3>
<p>Privacy Pools 来自 Vitalik Buterin、Jacob Illum、Matthias Nadler、Fabian Schär 和 Ameen Soleimani 2023 年的论文《Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium》${cite('Buterin 等：Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium', 'https://doi.org/10.1016/j.bcra.2023.100176')}。核心想法是在 Tornado Cash 式的证明里多加一条陈述：</p>
${steps([
  '普通证明：我的存款在“全部存款”这棵树里。',
  'Privacy Pools 证明：我的存款在“全部存款”树里，<strong>并且</strong>也在“关联集”这棵树里。关联集是全部存款的一个子集，例如“去掉所有来自已知被盗资金的存款”。',
  '诚实用户选择一个干净的关联集出示证明；黑客的存款不在任何干净的关联集里，于是被“分离”出来。论文把这种状态叫做分离均衡（separating equilibrium）。'
])}
<p>0xbow 团队按这个设计做的 Privacy Pools 于 2025 年 3 月 31 日在以太坊主网上线。它的 ASP 在存款进入关联集之前审查每笔存款，也可以事后撤销已批准的存款${cite('The Block：0xbow unveils Privacy Pools', 'https://www.theblock.co/post/348959/privacy-pools-vitalik-buterin')}${cite('L2BEAT：Privacy Pools', 'https://l2beat.com/privacy/projects/privacy-pools')}。被拒绝的用户仍然可以“公开退出”：把钱原路取回到存款地址，只是不能匿名取款。</p>
<h3>6.2 Railgun 与 Aztec</h3>
<p>Railgun 的资金以加密票据的形式保存在合约的 Merkle 树里，每次花费都是一个 zk-SNARK 证明。它的 Private Proofs of Innocence（PPOI）是一层独立的检查：代币进入屏蔽系统时开始，证明这些代币不在列表提供方标记的数据集里，并在后续交互中一路携带${cite('Railgun 文档：Private Proofs of Innocence', 'https://docs.railgun.org/wiki/assurance/private-proofs-of-innocence')}。</p>
<p>Aztec 是以太坊上的隐私二层网络。它的合约可以同时有公开函数和私有函数，私有函数在用户本地执行并生成证明。Aztec 于 2025 年 11 月 19 日在以太坊主网启动 Ignition Chain，第一阶段主要验证去中心化出块和治理，功能分阶段开放${cite('The Block：Aztec launches privacy-focused L2 Ignition Chain on mainnet', 'https://www.theblock.co/post/379592/aztec-launches-ignition-chain-mainnet')}。Rollup 的基本原理见 <a href="#m05-5">M04.5 Rollup 深入</a>，zkEVM 见 <a href="#m10-4">M06.4</a>。</p>
<h3>6.3 隐身地址（ERC-5564）</h3>
<p>ERC-5564 是一个已定稿（Final）的标准${cite('EIP 文档：ERC-5564 Stealth Addresses', 'https://eips.ethereum.org/EIPS/eip-5564')}。收款人公开一个<strong>隐身元地址</strong>（包含“花费公钥”和“查看公钥”），可以登记在 ERC-6538 注册表里。付款流程如下：</p>
${steps([
  '付款人生成一个临时私钥，用它和收款人的查看公钥算出共享秘密，再哈希。',
  '付款人用“哈希后的共享秘密 × 生成元 + 花费公钥”得到一个新公钥，由它推出一次性的隐身地址，把钱转到这个地址。',
  '付款人调用单例合约 ERC5564Announcer（地址 <code>0x55649E01B5Df198D18D95b5cc5051630cfD45564</code>），发出 <code>Announcement</code> 事件，里面有临时公钥和元数据。元数据第一个字节是<strong>查看标签（view tag）</strong>：哈希后共享秘密的第一个字节。',
  '收款人扫描所有 Announcement，用自己的查看私钥算出共享秘密。查看标签不匹配就跳过（约 255/256 的公告在这一步被排除）；匹配再做完整计算，确认地址属于自己，并算出花费私钥。'
])}


<h2>7. 开发者的边界：该做什么，不该做什么</h2>
${tbl(['方向', '建议', '理由'], [
  ['给自己的应用加选择性披露（查看密钥、证明某个属性）', '可以做，优先做', '保护用户数据，同时保留审计路径。成员证明、年龄证明、资格证明都属于这一类（见 <a href="#m10-7">M06.7 实战</a>）'],
  ['隐身地址收款、私密投票、匿名空投', '可以做，评估滥用场景', '隐藏的是身份关联，而不是资金来源；仍要对入金做制裁筛查'],
  ['接入隐私池的合规机制（关联集、PPOI）', '可以做，写清 ASP 的规则与治理', '让诚实用户能证明清白；ASP 的标准、撤销权和数据来源要公开'],
  ['运营一个接收任意资金、任意金额的混币服务，并收取手续费', '先咨询律师，多数情况下不要做', 'Storm 案显示，运营者可能被按无牌汇款等罪名起诉；欧盟 AMLR 限制服务商处理匿名资金'],
  ['帮用户规避制裁筛查、设计“过检测”路径', '不做', '这是协助违法，不是隐私保护'],
  ['在中继或前端记录 IP 与取款地址的对应关系', '不做（或最小化并公开说明）', '日志会抵消协议给的隐私']
])}
${mm('上线一个隐私功能前的判断流程', `
flowchart TB
  Q1{"功能隐藏的是什么？"} -->|"身份关联 / 属性"| Q2{"资金是否进入<br/>你控制的池子？"}
  Q1 -->|"资金来源"| R1["高风险：先做法律评估<br/>设计关联集或清白证明"]:::risk
  Q2 -->|"否"| OK1["较低风险：做制裁筛查与<br/>滥用评估后可上线"]:::ok
  Q2 -->|"是"| Q3{"你是否收费、<br/>能否升级或冻结？"}
  Q3 -->|"是"| R2["你可能被视为运营者<br/>按金融服务的标准评估"]:::warn
  Q3 -->|"否，合约不可变"| R3["仍需评估：前端、中继、<br/>治理和你的地域"]:::warn
`, [
  ['flow', '先问“隐藏的是什么”，再问“谁控制资金”，最后问“谁能改代码、谁收钱”。'],
  ['key', '控制权和收费是判断“运营者”的关键线索；不可变合约降低了风险，但前端、中继、治理仍然是你在运营。'],
  ['limit', '这张图是工程上的初筛，不是法律结论。每个法域的答案可能不同。'],
  ['risk', '只要涉及第三方资金的匿名化，就把法律评估放在写代码之前。']
])}
${tryit(`<p><strong>动手练习：</strong>在区块浏览器里读一条隐身地址付款公告（只读，不需要转账）。</p>
${steps([
  '在 Etherscan 打开 ERC5564Announcer 合约：<code>0x55649E01B5Df198D18D95b5cc5051630cfD45564</code>。',
  '进入 Events 标签，找一条 <code>Announcement</code> 事件。读出 schemeId（1 表示 secp256k1）、stealthAddress、caller、ephemeralPubKey 和 metadata。',
  '记下 metadata 的第一个字节，它就是查看标签。打开 stealthAddress，看它收到了什么资产，以及之后是否有转出。',
  '思考：caller 是谁？如果付款人用自己的主地址调用 announce，观察者能知道什么？'
])}
<p>预期结果：你能指出一条公告里每个字段的含义，并说清隐身地址隐藏了什么（收款人身份），没隐藏什么（发送方、金额、caller）。</p>`)}
${exercises([
  ['Tornado Cash 的取款证明把 recipient 和 fee 作为公开输入。如果去掉它们，攻击者可以怎样做？', '<p>攻击者在内存池里看到别人的取款交易，复制其中的证明、根和 nullifierHash，把收款地址换成自己的，再用更高的 Gas 抢先上链。证明仍然有效，因为它没有绑定收款地址；合约记下 nullifierHash，原用户的交易随后失败。绑定公开输入后，改动任何一个字段都会让证明验证失败。抢跑原理见 <a href="#m05-7">M04.7 MEV</a>。</p>'],
  ['用一句话区分 Van Loon 案和 Storm 案分别回答了什么问题。', '<p>Van Loon 案回答“OFAC 能不能把不可变智能合约当作财产来制裁”（第五巡回法院：不能）；Storm 案回答“开发并运营这个服务的人是否犯罪”（陪审团认定无牌汇款共谋成立，另两项未决）。前者是行政权限问题，后者是个人刑事责任问题。</p>'],
  ['Privacy Pools 的 ASP 拒绝了你的存款。你还能把钱拿回来吗？这个设计有什么代价？', '<p>可以通过“公开退出”把资金取回原存款地址，只是不能匿名取款。代价是 ASP 成为一个有权决定谁能获得隐私的中心化角色；它的审查标准、数据来源和撤销权需要透明和可问责，否则会出现误伤或审查。</p>']
])}
${checklist([
  '能画出“承诺 → Merkle 树 → 取款证明 → nullifier”的流程，并说出每一步公开了什么。',
  '能解释为什么取款证明要绑定收款地址、中继地址和手续费。',
  '能按时间线复述 2022 制裁、2024 判决、2025 解除制裁和 Storm 案，并说明各自的法律范围。',
  '能说出 Privacy Pools、Railgun PPOI、Aztec、隐身地址各自隐藏什么、不隐藏什么。',
  '能在 Etherscan 上读懂一条 ERC-5564 Announcement 事件。',
  '能用判断流程给一个隐私功能做初步风险分级，并知道哪一步必须找律师。'
])}
${mistakes([
  ['零知识证明保证了完全匿名。', '证明只保护密码学层。存取时间、金额、Gas 付款地址、IP 和取款后的去向都可能暴露身份。'],
  ['第五巡回法院判决说明混币服务在美国合法。', '判决只认定不可变智能合约不是 IEEPA 下可冻结的财产。开发者的刑事案在判决和解除制裁之后仍在继续。'],
  ['隐身地址就是混币器。', '隐身地址只隐藏收款人身份，发送方和金额依然公开，也不切断资金来源。'],
  ['合约不可升级，我作为开发者就没有任何责任。', '前端、中继、治理、收费都可能让你被视为运营者。是否承担责任要按所在法域评估。']
])}
${recap([
  '隐私协议的四个部件：承诺、Merkle 树、nullifier、零知识证明；Zcash 在协议层实现，Tornado Cash 在 EVM 合约里实现。',
  '取款证明要把收款地址、中继和手续费作为公开输入绑定进去，防止证明被复制抢跑。',
  '匿名集的理论大小常被用户习惯（时间、金额、地址复用、网络层）缩小到很小。',
  '美国时间线：2022 制裁 → 2024 第五巡回判决不可变合约不是财产 → 2025 解除制裁；开发者刑事案独立进行。欧盟 AMLR 从 2027 年 7 月起限制服务商处理匿名资金。',
  'Privacy Pools、Railgun PPOI 用“清白证明”分离诚实用户；Aztec 提供可编程隐私；ERC-5564 只隐藏收款人。',
  '开发者优先做选择性披露类功能；运营接收第三方资金的匿名化服务前必须做法律评估。本篇不是法律建议。'
])}
${quiz([
  { q: 'Tornado Cash 取款时，合约用什么防止同一笔存款被取两次？', o: ['检查存款地址', '记录已用的 nullifierHash', '要求取款人签名', '限制每个地址只能取一次'], a: 1, why: '每笔存款的 nullifier 唯一，取款时公开它的哈希，合约记下后不再接受相同值。存款地址在取款时根本不出现，所以 A、D 做不到。' },
  { q: '为什么 Tornado Cash 的电路要对 recipient、fee 这些“用不到”的输入做平方约束？', o: ['为了让证明更短', '为了加快验证', '为了把它们绑定进证明，防止被篡改后重放', '这是 Circom 的语法要求'], a: 2, why: '没有约束的公开输入可以被任意替换而证明仍然有效。平方约束把它们绑进证明，改动即失效。' },
  { q: '2024 年 11 月第五巡回法院在 Van Loon 案中的核心结论是？', o: ['Tornado Cash 的开发者无罪', '所有隐私协议都合法', '不可变智能合约不是 IEEPA 下 OFAC 可冻结的财产', 'OFAC 无权制裁任何加密项目'], a: 2, why: '判决范围很窄，只涉及不可变智能合约是否属于“财产”。它没有处理开发者刑事责任，也没有一般性地评价隐私协议。' },
  { q: '关于 ERC-5564 隐身地址，下面哪项正确？', o: ['它隐藏转账金额', '它让收款人每次用一次性地址收款，查看标签帮助快速过滤公告', '它需要一个托管资金的混币合约', '它切断了发送方和资金来源的联系'], a: 1, why: '隐身地址只隐藏收款人身份。金额和发送方仍公开，资金也直接到一次性地址，不经过托管池。' },
  { q: 'Privacy Pools 中的“关联集”起什么作用？', o: ['让用户证明自己的存款属于某个被认可的子集，从而与已知非法存款分离', '保存每个用户的身份信息', '加快 Merkle 树更新', '决定池子的面额'], a: 0, why: '用户额外证明存款在 ASP 维护的关联集里，不暴露是哪一笔。关联集不保存身份信息。' }
])}
${terms([
  ['屏蔽池', 'Shielded pool', 'Zcash 中金额、发送方和接收方都加密、只公开承诺与 nullifier 的资金池。'],
  ['查看密钥', 'Viewing key', '只能查看屏蔽交易、不能花费资金的密钥，用于选择性披露。'],
  ['匿名集', 'Anonymity set', '观察者无法区分的候选者集合，决定隐私强度。'],
  ['混币器', 'Mixer', '把多人的资金汇集后再分发，以切断存取链接的服务或合约。'],
  ['根历史', 'Root history', '合约记住的最近若干个 Merkle 根，允许用户基于稍旧的根生成证明。'],
  ['关联集', 'Association set', 'Privacy Pools 中由 ASP 维护的存款子集，用户证明自己的存款属于它。'],
  ['关联集提供方', 'ASP, Association Set Provider', '审查存款、维护关联集并可撤销批准的角色。'],
  ['清白证明', 'Proof of innocence', '证明资金不属于某个被标记集合、但不暴露交易细节的零知识证明。'],
  ['隐身地址', 'Stealth address', '付款人为收款人临时推导的一次性地址，外人无法关联到收款人公开身份。'],
  ['查看标签', 'View tag', 'ERC-5564 公告元数据的第一个字节，让收款人快速跳过不属于自己的公告。']
])}
` });

CUR = 'm10-6';
addCh({ id: 'm10-6', nav: 'MPC、FHE 与 TEE', title: 'M06.6 MPC、FHE 与 TEE：另外三种隐私计算', desc: '多方计算、全同态加密、可信执行环境各信任什么、多快、在 Web3 里用在哪', html: `
<h1>M06.6 MPC、FHE 与 TEE：另外三种隐私计算</h1>
${meta(['用一句话说出 MPC、FHE、TEE 各自“在谁手里计算、信任什么”，并和零知识证明做对比。', '读懂 Zama FHEVM 的架构（宿主链、协处理器、ACL、KMS、网关），写出一个加密计数器的关键代码。', '说出 TEE 在 Web3 里的用途（BuilderNet、Secret Network）和已公开的攻击（SGX.Fail、TEE.Fail），并按场景选择技术组合。'], '前置：<a href="#m10-1">M06.1 零知识证明直觉</a>、<a href="#m03-5">M09.5 MPC 与门限签名</a>')}
${beginner(`<p><strong>隐私计算（Privacy-enhancing computation）</strong>：在不暴露原始数据的前提下，对数据做计算的一类技术的总称。</p>
<p><strong>多方安全计算（MPC, Multi-Party Computation）</strong>：几方各持一部分秘密，一起算出结果，任何一方都看不到别人的输入。</p>
<p><strong>全同态加密（FHE, Fully Homomorphic Encryption）</strong>：一种加密方式，可以直接在密文上做加法和乘法，解密后得到的结果和在明文上计算一样。</p>
<p><strong>可信执行环境（TEE, Trusted Execution Environment）</strong>：CPU 里一块被硬件隔离的区域。操作系统和云厂商的管理员都看不到里面的内存。</p>
<p><strong>远程证明（Remote attestation）</strong>：TEE 用芯片里的密钥签一份报告，证明“我是真硬件，正在运行这份代码”。</p>`)}

<h2>1. 一句话理解</h2>
${one('零知识证明让你“证明一件事而不暴露数据”；MPC 让“几个人一起算、谁也看不到别人的数据”；FHE 让“别人在密文上替你算”；TEE 让“在一个连机器主人都看不到的硬件保险箱里算”。前三种信任数学和参与方的不合谋，TEE 信任芯片厂商和物理安全。')}
${call('analogy', `<p>四个人要算平均工资但不想公开自己的工资。<strong>ZK</strong>：每人公开一个证明“我的工资在 1 万到 5 万之间”，但不说具体数。<strong>MPC</strong>：每人把工资拆成几张随机纸条分给别人，大家把手里纸条加起来，最后合并出总和。<strong>FHE</strong>：每人把工资锁进透明的手套箱交给会计，会计隔着手套箱做加法，只有拿钥匙的人能打开结果。<strong>TEE</strong>：大家把工资交给一个关在封闭房间里的会计，房间由制造商担保“没人能偷看”。</p>
<p>比喻的局限：真实的 MPC 和 FHE 都有大量网络通信或计算开销；真实的 TEE 房间曾多次被人从墙缝里偷看（见第 5 节）。</p>`)}
${art('一图看懂：四种隐私计算，区别在“谁能看到明文、你要信任谁”', 660, 350, [
  S.box(10, 36, 148, 54, { k: 'info', icon: 'shield', t: 'ZK', s: '证明，不暴露' }),
  S.box(174, 36, 148, 54, { k: 'info', icon: 'users', t: 'MPC', s: '大家一起算' }),
  S.box(338, 36, 148, 54, { k: 'info', icon: 'lock', t: 'FHE', s: '在密文上算' }),
  S.box(502, 36, 148, 54, { k: 'risk', icon: 'cpu', t: 'TEE', s: '硬件保险箱' }),
  S.box(10, 100, 148, 196, { k: 'tint' }),
  S.box(174, 100, 148, 196, { k: 'tint' }),
  S.box(338, 100, 148, 196, { k: 'tint' }),
  S.box(502, 100, 148, 196, { k: 'risk', dash: 1 }),
  S.text(22, 122, '谁看到明文', { size: 11.5, b: 1, dim: 1 }),
  S.text(22, 140, '只有证明者', { size: 12.5, mw: 124 }),
  S.text(22, 186, '信任谁', { size: 11.5, b: 1, dim: 1 }),
  S.text(22, 204, '数学\n部分需可信设置', { size: 12.5, mw: 124 }),
  S.text(22, 250, '最坏情况', { size: 11.5, b: 1, k: 'risk' }),
  S.text(22, 268, '电路漏洞\n伪造证明', { size: 12.5, mw: 124 }),
  S.text(186, 122, '谁看到明文', { size: 11.5, b: 1, dim: 1 }),
  S.text(186, 140, '没人看到\n完整输入', { size: 12.5, mw: 124 }),
  S.text(186, 186, '信任谁', { size: 11.5, b: 1, dim: 1 }),
  S.text(186, 204, '不超过门限数的\n参与方不合谋', { size: 12.5, mw: 124 }),
  S.text(186, 250, '最坏情况', { size: 11.5, b: 1, k: 'risk' }),
  S.text(186, 268, '门限数量的\n节点合谋', { size: 12.5, mw: 124 }),
  S.text(350, 122, '谁看到明文', { size: 11.5, b: 1, dim: 1 }),
  S.text(350, 140, '没人看到\n除非解密', { size: 12.5, mw: 124 }),
  S.text(350, 186, '信任谁', { size: 11.5, b: 1, dim: 1 }),
  S.text(350, 204, '数学\n解密密钥保管方', { size: 12.5, mw: 124 }),
  S.text(350, 250, '最坏情况', { size: 11.5, b: 1, k: 'risk' }),
  S.text(350, 268, '解密密钥\n泄露', { size: 12.5, mw: 124 }),
  S.text(514, 122, '谁看到明文', { size: 11.5, b: 1, dim: 1 }),
  S.text(514, 140, 'TEE 内部\n的代码', { size: 12.5, mw: 124 }),
  S.text(514, 186, '信任谁', { size: 11.5, b: 1, dim: 1 }),
  S.text(514, 204, '芯片厂商\n固件 · 物理安全', { size: 12.5, mw: 124 }),
  S.text(514, 250, '最坏情况', { size: 11.5, b: 1, k: 'risk' }),
  S.text(514, 268, '硬件漏洞\n提取数据和密钥', { size: 12.5, mw: 124 }),
  S.text(336, 330, '它们常组合使用：MPC 保管 FHE 的解密密钥 · TEE 跑 MPC 节点 · ZK 证明计算正确', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['key', 'TEE 是四种里唯一在计算时数据以明文存在的方案，它信任的不是数学，而是芯片厂商和物理安全。'],
  ['flow', 'ZK 解决“验证”；MPC、FHE、TEE 解决“在私有数据上计算”，分别信任参与方不合谋、数学加密钥保管方、硬件。'],
  ['risk', '每一列最下面是“出事时长什么样”：选型时先问最坏情况能不能接受，再问快不快。'],
  ['limit', '一张图只能比较信任假设，性能和成本的对比见第 6 节的表格和决策流程。']
], '四列分别是 ZK、MPC、FHE、TEE，每列写明谁能看到明文、信任什么、最坏情况是什么；TEE 是唯一计算时数据以明文存在的方案。', 'm10-6')}

<h2>2. 四种技术先放在一起看</h2>
<p>一句话区分：<strong>ZK</strong> 解决“验证”，证明者知道全部数据，验证者什么都不知道；<strong>MPC</strong>、<strong>FHE</strong>、<strong>TEE</strong> 解决“在私有数据上计算”，分别信任“参与方不合谋”“数学与解密密钥保管方”“芯片厂商与物理安全”。TEE 是唯一一个在计算时数据以明文存在的方案。它们经常组合使用：用 MPC 保管 FHE 的解密密钥，用 TEE 跑 MPC 节点，用 ZK 证明计算正确。第 6 节给出完整对比表。</p>

<h2>3. MPC：钱包之外还能做什么</h2>
${recall('<p>MPC 在钱包里的用法——秘密分享、分布式密钥生成（DKG）、门限 ECDSA 签名、密钥刷新——在 <a href="#m03-5">M09.5 MPC 与门限签名</a> 里已经完整讲过，企业钱包里的部署见 <a href="#m03-8">M09.9 企业钱包系统设计</a>。本节只讲 MPC 作为“通用隐私计算”的一面。</p>')}
<p>MPC 有两大类构造：一类基于<strong>秘密分享</strong>，把每个输入拆成多份，各方在分片上做运算；另一类基于<strong>混淆电路（Garbled circuits）</strong>，一方把函数加密成一张“查表电路”，另一方在不知道表内容的情况下求值。门限签名就是第一类的一个特例：要计算的函数是“签名”。</p>
<p><strong>算一算（示例）：三方用加法秘密分享算平均工资。</strong>为了好算，用模 1000 的整数（单位：百元）。</p>
${steps([
  'A 的工资 120，拆成 3 个随机数：(500, 300, 320)，三数之和 1120 ≡ 120（mod 1000）。B 的工资 90，拆成 (210, 640, 240)，和 1090 ≡ 90。C 的工资 150，拆成 (700, 100, 350)，和 1150 ≡ 150。',
  '每人把第 1 份给 A、第 2 份给 B、第 3 份给 C（自己留自己那份）。单独一份是均匀随机数，看不出任何信息。',
  'A 把收到的第 1 份相加：500 + 210 + 700 = 1410 ≡ 410。B：300 + 640 + 100 = 1040 ≡ 40。C：320 + 240 + 350 = 910。',
  '三人公开各自的部分和：410 + 40 + 910 = 1360 ≡ 360（mod 1000）。总工资 = 360，平均 = 120。三人都没看到别人的工资。',
  '代价：每个输入都要发给其他两方，通信量随参与方数量增长；乘法比加法难得多，需要额外的交互轮次。'
])}
<p>Web3 里 MPC 的用途：钱包与托管（最成熟）、FHE 网络的门限解密（见下一节 Zama KMS）、跨链桥和预言机的门限签名委员会。它的信任假设始终是“不超过门限数量的节点合谋”；如果节点由同一家公司运营，这个假设就变弱了。桥的委员会被攻破的案例见 <a href="#m05-8">M05.11 跨链桥</a>。</p>

<h2>4. FHE：在密文上运行智能合约</h2>
<p>FHE 的密文里带有“噪声”。每做一次运算，噪声都会增长；噪声太大，解密就会出错。<strong>自举（Bootstrapping）</strong>是一种在不解密的情况下“清洗”噪声的操作，它让无限次运算成为可能，也是 FHE 慢的主要原因。</p>
<p>把 FHE 用到区块链上，还要解决一个问题：<strong>谁持有解密密钥？</strong>如果一个人持有，他就能看到所有人的数据。Zama 的 FHEVM 给出的答案是把密钥交给一个门限 MPC 网络。下面的架构来自 Zama 协议的 litepaper${cite('Zama：Zama Protocol Litepaper', 'https://docs.zama.org/protocol/zama-protocol-litepaper')}。</p>
${mm('Zama FHEVM：一次加密加法的流程', `
flowchart LR
  U["用户<br/>本地加密输入<br/>附带输入证明"] --> HC["宿主链上的合约<br/>调用 FHE.add"]
  HC -->|"只发事件<br/>密文是句柄"| CP["协处理器<br/>真正执行 FHE 运算"]
  CP -->|"存密文结果"| CP
  HC --> ACL["ACL 合约<br/>谁能用 谁能解密"]
  ACL --> GW["网关<br/>专用 Arbitrum rollup"]
  GW --> KMS["KMS<br/>门限 MPC 节点<br/>运行在 Nitro Enclave"]:::key
  KMS -->|"授权后门限解密"| U
`, [
  ['flow', '宿主链（例如以太坊）上不做 FHE 运算，合约里的密文只是句柄（指针），真正的计算在协处理器里，多个协处理器的结果按多数一致。'],
  ['key', '解密密钥被拆分到 KMS 节点。litepaper 写的是 13 个节点、2/3 多数，节点运行在 AWS Nitro Enclaves 里：这是 FHE + MPC + TEE 的组合。'],
  ['risk', 'ACL 写错就会把密文的解密权授予错误的人。FHE 合约里的访问控制和普通合约里的权限一样关键。'],
  ['limit', '公开解密请求本身是公开的：谁在什么时候请求解密，链上可见。']
])}
${code('SOLIDITY', `
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

// 摘自 Zama 官方 fhevm-hardhat-template 的 FHECounter.sol（结构相同，注释为本书所加）
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract FHECounter is ZamaEthereumConfig {
    euint32 private _count; // 加密的计数器：链上只存一个句柄

    function getCount() external view returns (euint32) {
        return _count; // 返回的是密文句柄，不是数字
    }

    // inputEuint32 是用户在本地加密的输入，inputProof 证明这个密文格式正确、由调用者生成
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 v = FHE.fromExternal(inputEuint32, inputProof); // 校验并导入外部密文
        _count = FHE.add(_count, v);                            // 密文加法：合约看不到明文
        FHE.allowThis(_count);                                  // 允许本合约以后继续使用这个密文
        FHE.allow(_count, msg.sender);                          // 允许调用者申请解密
    }
}
`)}
<p>写 FHE 合约时，思维方式要变：<strong>不能对密文做 if 判断</strong>，因为 if 需要知道明文。比较的结果是一个加密布尔值 <code>ebool</code>，分支要用 <code>FHE.select(cond, a, b)</code> 同时算出两边再选择。例如“余额不足就转 0”是用 select 实现的，而不是 revert——revert 会泄露“余额不足”这一信息。</p>
<p><strong>性能（截至 2026 年公开资料）：</strong>Zama 的 litepaper 写明当前基于 CPU 的吞吐量是每条链 0.2 到 20 多 TPS，计划在 2026 年底前改用 GPU，并以专用 FHE 芯片为长期方向${cite('Zama：Zama Protocol Litepaper', 'https://docs.zama.org/protocol/zama-protocol-litepaper')}。对比：普通 EVM 链的 TPS 至少高一到两个数量级。所以 FHE 适合“值得付高价的隐私”，例如密封竞价、机密代币余额、私密投票，不适合高频交易。</p>

<h2>5. TEE：最快、也最依赖硬件的方案</h2>
<p>主流 TEE 有三类：Intel SGX（进程级飞地 enclave）、Intel TDX 和 AMD SEV-SNP（整台虚拟机级别的“机密虚拟机”），以及 AWS Nitro Enclaves（云厂商提供的隔离环境）。它们的共同点是：数据进入隔离区后以明文运算，内存在离开 CPU 时被加密；外部通过远程证明确认里面运行的是哪份代码。</p>
${steps2('TEE 远程证明的信任链', [
  { t: '① 芯片出厂', d: '厂商在芯片里写入密钥，并为它签发证书。' },
  { t: '② 加载代码', d: 'TEE 启动时测量（哈希）加载的代码和配置，得到一个“度量值”。' },
  { t: '③ 签发报告', d: '芯片用出厂密钥签名：度量值 + 用户提供的随机数 + TEE 内生成的公钥。', kind: 'key' },
  { t: '④ 外部验证', d: '用户检查签名链到厂商根证书，检查度量值等于自己审计过的代码构建结果。' },
  { t: '⑤ 建立通道', d: '用户用报告里的公钥加密数据发给 TEE。只有这份代码能解密。', kind: 'risk' }
], [
  ['key', '远程证明的价值在于“度量值 = 你审计过的代码”。如果代码不开源或构建不可复现，证明只能说明“它是某个 TEE”，说明不了“它在做什么”。'],
  ['risk', '整条链的根是芯片厂商的密钥。厂商密钥或某颗芯片的证明密钥泄露，攻击者就能伪造“真 TEE”的报告。'],
  ['fail', '厂商发布安全更新后，旧固件的报告应当被拒绝。应用要跟踪 TCB（可信计算基）状态，否则仍会接受有漏洞的节点。']
])}
<p>TEE 在可验证 AI 推理中的用法见 <a href="#m06-60">M12.8 AI × Crypto 全景</a> 第 4 节。</p>
<h3>5.1 Web3 里的 TEE</h3>
<ul>
  <li><strong>私有订单流与区块构建。</strong>Flashbots 在 2022 年提出 SUAVE，目标是一个加密的、去中心化的内存池和区块构建网络${cite('Flashbots：The Future of MEV is SUAVE', 'https://writings.flashbots.net/the-future-of-mev-is-suave')}。2024 年 11 月 18 日，Flashbots、Beaverbuild 和 Nethermind 联合推出 BuilderNet：每个运营者在 TEE 里运行区块构建实例，订单流提供方在发送加密订单流之前验证这些实例${cite('BuilderNet：Introducing BuilderNet', 'https://buildernet.org/blog/introducing-buildernet')}。MEV 的背景见 <a href="#m05-7">M04.7 MEV</a>。</li>
  <li><strong>机密智能合约。</strong>Secret Network 用 SGX 运行加密状态的合约，网络的“共识种子”是所有私密交易的主密钥。</li>
  <li><strong>托管与密钥服务。</strong>MPC 节点放在 TEE 里（见 <a href="#m03-5">M09.5</a> 的部署图），FHE 的 KMS 节点也放在 Nitro Enclave 里。这里 TEE 是“第二道防线”，不是唯一防线。</li>
</ul>
<h3>5.2 已公开的 TEE 攻击</h3>
${cases([
  ['SGX.Fail：提取 Secret Network 的共识种子', '2022', '<p>多所大学的研究者利用 2022 年 8 月 9 日公开的 xAPIC 和 MMIO 漏洞，在一台购买来的、仍未修补的机器上运行 Secret Network 节点，从密封存储中提取出主网和测试网的共识种子。拿到种子就能事后解密过去的私密交易。研究者对主网种子只发布了签名的证明，随后销毁密钥材料。Secret Network 于 2022 年 10 月 4 日冻结新节点注册。链的完整性和资金没有受损，但过去交易的隐私无法完全保证。</p><p>启示：TEE 的漏洞一旦公开，到所有节点完成修补之间有一个窗口；隐私是“可以被事后破解”的。</p>', [['SGX.Fail 项目页', 'https://sgx.fail/']]],
  ['TEE.Fail：用 DDR5 内存总线插桩攻破 TDX 与 SEV-SNP', '2025', '<p>研究者在 DDR5 内存条和主板之间加了一个插桩设备，成本不到 1,000 美元。由于 Intel 和 AMD 的内存加密使用确定性的 AES-XTS 模式，相同明文得到相同密文，攻击者可以比较密文推断数据。他们从 Intel 的 Provisioning Certification Enclave 中提取了证明密钥，可以伪造 SGX 和 TDX 的远程证明报告；在 AMD SEV-SNP 虚拟机里提取了 OpenSSL 的签名私钥。项目页还分析了对 BuilderNet 的影响：一个恶意运营者可以获得配置秘密、解密机密订单流。Intel 和 AMD 都表示物理攻击不在它们的威胁模型之内。</p><p>启示：TEE 防的是“机器上的其他软件和远程管理员”，不防“能碰到机器的人”。在 Web3 里，运营节点的人往往就是潜在攻击者。</p>', [['TEE.Fail 项目页', 'https://tee.fail/'], ['The Hacker News 报道', 'https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html']]]
], 'h3')}

<h2>6. 选型：一张对比表和一个决策流程</h2>
${tbl(['维度', 'ZK', 'MPC', 'FHE', 'TEE'], [
  ['谁看到明文', '只有证明者', '没有人看到完整输入', '没有人（除非解密）', 'TEE 内部的代码'],
  ['主要信任假设', '数学；部分方案需可信设置', '不超过门限数量的参与方合谋', '数学 + 解密密钥保管方', '芯片厂商、固件、物理安全'],
  ['性能瓶颈', '证明生成（秒到分钟级）', '网络轮次与带宽', '密文运算与自举', '接近原生，侧信道防护有开销'],
  ['能否让多方共享状态', '不能直接（每人只能证明自己的数据）', '能，但参与方固定', '能：任何人都可以在密文上计算', '能'],
  ['链上验证', '便宜：验证一个证明', '通常输出一个签名或结果', '依赖解密网络', '验证远程证明报告'],
  ['Web3 典型用途', 'Rollup、隐私支付、成员证明', '托管钱包、门限签名、门限解密', '机密代币、密封竞价、私密投票', '私有订单流、区块构建、密钥服务'],
  ['最坏情况', '电路漏洞导致伪造证明', '门限数量节点合谋', '解密密钥泄露', '硬件漏洞导致数据和密钥被提取']
])}
${mm('按需求选择隐私计算技术', `
flowchart TB
  S{"要做的是？"} -->|"证明我的数据满足条件"| ZK["ZK<br/>成员证明 年龄证明 Rollup"]:::ok
  S -->|"在别人的私有数据上计算"| Q2{"参与方固定<br/>且数量少？"}
  Q2 -->|"是"| MPC["MPC<br/>联合计算 门限签名"]:::ok
  Q2 -->|"否，任何人都要能参与"| Q3{"能接受<br/>高延迟与高成本？"}
  Q3 -->|"是"| FHE["FHE<br/>机密代币 密封竞价"]:::ok
  Q3 -->|"否，要接近原生速度"| TEE["TEE<br/>订单流 区块构建"]:::warn
  TEE --> MIX["加防线：MPC 分散密钥<br/>ZK 证明结果 多厂商硬件"]:::key
`, [
  ['flow', '先区分“证明”和“计算”；计算再按参与方是否固定、性能要求高低来分。'],
  ['key', '选 TEE 时默认补一道防线：密钥用 MPC 分散，关键结果用 ZK 或多数一致校验，避免单一硬件漏洞导致全部失守。'],
  ['limit', '真实系统经常是组合：Zama 是 FHE + MPC + TEE，BuilderNet 是 TEE + 多运营者。'],
  ['risk', '只用 TEE 保护长期秘密（例如共识主密钥），一旦被提取就无法补救，SGX.Fail 就是例子。']
])}
${tryit(`<p><strong>动手练习：</strong>在本地跑通一个 FHE 合约（使用 Zama 官方 Hardhat 模板，本地模拟模式不需要真实网络）。</p>
${steps([
  '准备 Node.js 20 或更高版本。运行 <code>git clone https://github.com/zama-ai/fhevm-hardhat-template</code>，进入目录后运行 <code>npm install</code>。',
  '运行 <code>npm run compile</code> 编译，再运行 <code>npm run test</code>。测试在本地模拟环境里加密输入、调用 increment、再解密结果。',
  '打开 <code>contracts/FHECounter.sol</code>，找到 FHE.fromExternal、FHE.add、FHE.allowThis、FHE.allow 四个调用，对照本篇的注释理解每一步。',
  '尝试修改：删掉 <code>FHE.allow(_count, msg.sender)</code> 再跑测试，观察解密那一步失败。这就是 ACL 的作用。'
])}
<p>预期结果：测试通过；删掉 allow 后，测试在解密时报错。你能说出“密文句柄”和“谁有权解密”分别在哪里管理。</p>`)}
${exercises([
  ['一个链上密封竞价拍卖：10,000 人出价，出价在结束前必须保密，结束后公布最高价。你会选 ZK、MPC、FHE 还是 TEE？说明理由和代价。', '<p>参与方多且不固定，任何人都要能提交，排除少数固定参与方的 MPC。FHE 适合：出价加密上链，合约在密文上比较得出最高价，结束后门限解密。代价是成本高、延迟高。若对速度要求高，可以用 TEE，但要接受硬件信任，并用多运营者和远程证明降低风险。ZK 单独做不到：每个出价者只能证明自己的出价合规，不能在别人的出价上计算最大值（除非有一方看到全部明文再证明结果）。</p>'],
  ['为什么在 FHE 合约里“余额不足就 revert”会泄露信息？应该怎么写？', '<p>revert 是公开可见的：观察者看到交易失败，就知道发送方余额小于转账额，这是从密文里泄露出来的一比特信息。应该用 <code>FHE.le</code> 得到加密布尔值，再用 <code>FHE.select</code> 选择“转账额”或“0”，让交易总是成功，外人无法区分。</p>'],
  ['BuilderNet 的节点都运行在 TDX 里。TEE.Fail 之后，你作为订单流提供方要额外检查什么？', '<p>检查节点运营者是否可信、硬件放在哪里（谁有物理接触）、远程证明是否用最新 TCB 状态、是否有多运营者和多厂商硬件分散风险；评估订单流泄露后的最坏损失，敏感订单可以考虑其他保护方式。</p>']
])}
${checklist([
  '能用一句话分别说出 ZK、MPC、FHE、TEE 各自信任什么。',
  '能手算一个三方加法秘密分享的求和例子。',
  '能画出 Zama FHEVM 的宿主链、协处理器、ACL、网关、KMS 的关系。',
  '能解释 FHE 合约里为什么要用 select 而不是 if/revert。',
  '能说出 SGX.Fail 和 TEE.Fail 各提取了什么，以及对 Web3 项目的影响。',
  '能用决策流程为一个具体需求选出技术组合并说明代价。'
])}
${mistakes([
  ['TEE 和 FHE 一样安全，只是更快。', 'TEE 里数据以明文运算，安全依赖硬件和厂商；FHE 的计算方始终只见到密文。两者的信任假设完全不同。'],
  ['FHE 合约里所有数据都对所有人保密，包括合约开发者。', '谁能解密由 ACL 决定。开发者写错 FHE.allow，就会把解密权给错误的人。'],
  ['MPC 钱包就是 MPC 的全部用途。', '门限签名只是 MPC 的一个特例。MPC 还能做联合统计、门限解密、私有集合求交等通用计算。'],
  ['有了远程证明，就能信任 TEE 里的程序。', '远程证明只说明“某份代码运行在某种 TEE 里”。代码是否开源可复现、硬件是否有已知漏洞、谁能物理接触机器，都要另外判断。'],
  ['ZK 能替代其他三种技术。', 'ZK 擅长证明自己的数据满足条件，但不能直接在多人的私有数据上计算共享状态。']
])}
${recap([
  'ZK 解决“证明”，MPC、FHE、TEE 解决“在私有数据上计算”；真实系统常常组合使用。',
  'MPC 信任“不超过门限数量的参与方合谋”，钱包是它最成熟的用途，详见 M09.5。',
  'FHE 在密文上计算，最大问题是性能和解密密钥保管；Zama 用门限 MPC 的 KMS 保管密钥，并用 ACL 管理解密权。',
  'TEE 接近原生速度，但信任芯片厂商和物理安全；SGX.Fail 和 TEE.Fail 都提取出了关键密钥。',
  '选型先看“证明还是计算”，再看参与方是否固定、性能要求；选 TEE 时默认加 MPC 或 ZK 的第二道防线。'
])}
${quiz([
  { q: '下面哪种技术在计算时数据以明文形式存在于某处？', o: ['FHE', 'TEE', 'MPC（加法秘密分享）', 'ZK 的验证者一侧'], a: 1, why: 'TEE 在隔离区内以明文运算，只在内存离开 CPU 时加密。FHE 始终是密文；MPC 每方只有随机分片；ZK 验证者看不到明文。' },
  { q: '三方加法秘密分享求和：三人公开的部分和是 410、40、910（模 1000）。总和是？', o: ['1360', '360', '120', '无法计算'], a: 1, why: '410 + 40 + 910 = 1360，模 1000 得 360。120 是平均值，不是总和。' },
  { q: '在 Zama FHEVM 里，谁保管全局解密密钥？', o: ['部署合约的开发者', '协处理器', '一组运行门限 MPC 的 KMS 节点', '每个用户各自保管'], a: 2, why: 'litepaper 描述 KMS 是运行门限 MPC 的节点集合，任何单一方都没有完整密钥。协处理器只做密文运算。' },
  { q: 'TEE.Fail 攻击需要什么条件？', o: ['只需远程访问云服务器', '物理接触机器，在 DDR5 内存总线上加插桩设备', '用户泄露私钥', '修改智能合约'], a: 1, why: 'TEE.Fail 是物理攻击：在内存条和主板之间插入设备，利用确定性内存加密推断数据。它不需要远程漏洞。' },
  { q: 'FHE 合约里为什么不应该在“余额不足”时 revert？', o: ['revert 消耗太多 Gas', 'FHE 不支持 revert', '交易失败本身公开可见，会泄露余额与金额的大小关系', 'revert 会让密文损坏'], a: 2, why: '失败或成功是公开信息，相当于泄露了一比特明文比较结果。应当用 select 让交易总是成功。' }
])}
${terms([
  ['多方安全计算', 'MPC, Multi-Party Computation', '多方在不暴露各自输入的情况下共同计算一个函数的技术。'],
  ['混淆电路', 'Garbled circuits', '一种双方 MPC 构造：一方把函数加密成查表电路，另一方在不知道内容的情况下求值。'],
  ['全同态加密', 'FHE, Fully Homomorphic Encryption', '支持在密文上做任意加法和乘法的加密方式。'],
  ['自举', 'Bootstrapping', '在不解密的情况下降低 FHE 密文噪声，使计算可以继续的操作。'],
  ['协处理器', 'Coprocessor', '在链下执行重计算（如 FHE 运算）、把结果交回链上的组件。'],
  ['可信执行环境', 'TEE, Trusted Execution Environment', 'CPU 提供的硬件隔离区，外部软件和管理员看不到其中内存。'],
  ['远程证明', 'Remote attestation', 'TEE 用芯片密钥签名的报告，证明它运行着特定度量值的代码。'],
  ['可信计算基', 'TCB, Trusted Computing Base', '系统安全所依赖的全部硬件、固件和软件；厂商据此标记节点是否已修补。']
])}
` });

CUR = 'm10-7';
addCh({ id: 'm10-7', nav: '★ 实战：成员证明', title: 'M06.7 ★ 实战：Merkle 成员证明（匿名领取 / 投票）', desc: '身份承诺 + Poseidon Merkle 组 + nullifier，从电路、合约、浏览器证明到中继', html: `
<h1>M06.7 ★ 实战：Merkle 成员证明（匿名领取 / 投票）</h1>
${meta(['设计并实现一个 Semaphore 式的匿名领取 / 投票系统：身份承诺、Poseidon Merkle 组、nullifier、Circom 电路、Solidity 验证与领取合约、浏览器端 snarkjs 证明、Gas 中继。', '按威胁模型逐条防御：证明被抢跑、nullifier 复用、根历史窗口、电路欠约束、可信设置、域溢出、匿名集过小。', '写出测试清单和 4–6 周的里程碑，并知道生产环境什么时候应该直接用 Semaphore V4。'], '前置：<a href="#m10-3">M06.3 第一个电路：Circom 到链上验证</a>、<a href="#m10-5">M06.5 隐私协议与合规边界</a>、<a href="#m01-2">M01.2 默克尔树与轻节点</a>', ['zkmember'])}
${beginner(`<p><strong>身份承诺（Identity commitment）</strong>：成员的秘密 secret 的哈希。它可以公开放进组里，别人不能从它反推 secret。</p>
<p><strong>组（Group）</strong>：所有身份承诺作为叶子组成的一棵 Merkle 树。链上只需要记住它的根。</p>
<p><strong>scope（作用域）</strong>：一次活动的标识，例如“空投第 1 轮”或“提案 42”。同一个人在同一个 scope 里只能行动一次。</p>
<p><strong>Poseidon</strong>：一种专门为零知识电路设计的哈希函数。在电路里它的约束数量比 SHA-256 或 Keccak 少得多。</p>
<p><strong>中继（Relayer）</strong>：替用户把交易发上链、垫付 Gas 的服务。用户不用拿自己的有钱地址付 Gas，避免暴露身份。</p>`)}

<h2>1. 一句话理解</h2>
${one('每个成员在本地保存一个 secret，把它的哈希（身份承诺）交给组；行动时，成员在浏览器里生成一个零知识证明：“我知道组里某个承诺的 secret”，同时公开 nullifier = Poseidon(scope, secret)。合约检查证明和根，并记住 nullifier：同一个 scope 里同一个人第二次出现就会被拒绝，但没人知道他是谁。')}
${call('analogy', `<p>公司年会抽奖：每个员工有一张只有自己知道号码的工牌，人事部只公布“工牌号码的指纹清单”。领奖时你在一个黑箱里证明“我的工牌指纹在清单上”，再交出一张这次活动专用的兑奖券。兑奖券由你的工牌号码和活动名一起算出，同一个人在同一个活动里只能算出同一张券，所以领不了第二次；换一个活动，券就不同。</p>
<p>比喻的局限：黑箱是数学证明，不需要信任任何人；但“谁能进清单”仍然由人事部（组管理员）决定，这是系统里需要监督的地方。</p>`)}
${art('一图看懂：成员证明 = 私有的 secret 与路径，对上公开的树根，再公开一个 nullifier', 660, 330, [
  S.text(185, 24, '组：一棵 Merkle 树（示意：4 个成员）', { size: 13.5, b: 1, anchor: 'middle' }),
  S.line(185, 76, 105, 110), S.line(185, 76, 265, 110),
  S.line(105, 150, 50, 184), S.line(105, 150, 140, 184),
  S.line(265, 150, 230, 184), S.line(265, 150, 320, 184),
  S.box(130, 36, 110, 40, { k: 'tint', t: '根 root', ts: 13 }),
  S.box(50, 110, 110, 40, { k: 'info', t: '哈希', ts: 13 }),
  S.box(210, 110, 110, 40, { k: 'tint', t: '哈希', ts: 13 }),
  S.box(10, 184, 80, 40, { k: 'tint', t: '承诺 1', ts: 12 }),
  S.box(100, 184, 80, 40, { k: 'tint', t: '承诺 2', ts: 12 }),
  S.box(190, 184, 80, 40, { k: 'key', t: '我的承诺', ts: 12 }),
  S.box(280, 184, 80, 40, { k: 'info', t: '承诺 4', ts: 12 }),
  S.text(185, 252, '强调色 = 我的叶子 = Poseidon(secret)\n蓝色 = 路径上的兄弟节点，是私有输入\n真实项目深度 20，可容纳 1,048,576 个成员', { size: 12, anchor: 'middle', dim: 1, mw: 350 }),
  S.box(395, 36, 255, 78, { k: 'warn', icon: 'lock', t: '私有输入：不出浏览器', s: 'secret\n兄弟节点 siblings · 左右方向' }),
  S.arrow(522, 116, 522, 146),
  S.box(395, 148, 255, 60, { k: 'key', icon: 'shield', t: '零知识证明', s: '我的叶子能算回这个根' }),
  S.arrow(522, 210, 522, 240),
  S.box(395, 242, 255, 62, { k: 'info', icon: 'eye', t: '公开信号：合约看得见', s: 'root · nullifier · scope · message' }),
  S.text(330, 322, 'nullifier = Poseidon(scope, secret)：同一人在同一 scope 只算得出同一个值', { size: 13, anchor: 'middle', mw: 630, mono: 0 })
], [
  ['flow', '成员在浏览器里用 secret 和认证路径算出根，生成证明；合约只拿到根、nullifier、scope 和 message。'],
  ['key', 'secret 与路径永远不出浏览器；公开的 nullifier 让合约认出“同一个人第二次来”，却不知道他是谁。'],
  ['risk', '谁能进组由管理员决定：组服务加入假成员，就能多领。公开成员列表、时间锁就是用来复核这一点的。'],
  ['limit', '换一个 scope，同一个 secret 算出的 nullifier 就不同，所以不同活动之间互不关联。']
], '左侧是一棵 Merkle 树，我的承诺是其中一片叶子；右侧上方是只在浏览器里的私有输入，中间是零知识证明，下方是合约能看到的公开信号：根、nullifier、scope 和 message。', 'm10-7')}

<h2>2. 项目目标与验收标准</h2>
<p>我们要做的产品：一个<strong>匿名空投 + 匿名投票</strong>的通用组件。管理员维护一个成员组（例如活动参与者、DAO 成员、持有某个凭证的人），成员可以在不暴露身份的情况下领取代币或投票，每个 scope 一人一次。</p>
${tbl(['类别', '验收标准（示例）', '怎么验证'], [
  ['功能', '成员能领取 / 投票；非成员被拒绝；同一 scope 第二次被拒绝；不同 scope 互不影响', 'Foundry 测试 + 浏览器端到端测试'],
  ['隐私', '链上和中继日志都无法把领取交易对应到某个身份承诺；领取地址可以是全新地址', '审查事件字段、中继日志字段；做一次“取证演练”'],
  ['性能', '深度 20 的组（约 100 万成员），桌面浏览器生成证明 ≤ 10 秒，手机 ≤ 30 秒', '在 3 台设备上测 20 次取 P95'],
  ['成本', '链上 claim 一次的 Gas ≤ 35 万（Groth16 验证 + 存储 nullifier + 转账）', 'forge test --gas-report'],
  ['可用性', '中继可用性 ≥ 99.5%；中继宕机时用户能自己直接提交', '健康检查 + 降级路径演练'],
  ['安全', '电路通过 circomspect 静态检查无高危；合约通过 Slither；全部威胁模型条目有测试', 'CI 报告']
])}

<h2>3. 需求拆解与用户故事</h2>
${steps([
  '作为成员，我在网页里点“生成身份”，浏览器生成 secret 并只保存在本地；我把身份承诺提交给组管理员（或通过凭证自动加入）。',
  '作为管理员，我把新成员的承诺加入组，发布新的根和完整成员列表，任何人都能复核根。',
  '作为成员，我在活动页面输入一个全新的收款地址，浏览器生成证明；我选择通过中继提交，不需要这个地址里有 ETH。',
  '作为审计者，我能根据公开的成员列表重建 Merkle 根，确认管理员没有偷偷加入假成员。'
])}

<h2>4. 系统架构、调用链与状态机</h2>
${mm('系统架构', `
flowchart LR
  subgraph B["用户浏览器"]
    ID["身份模块<br/>生成并保存 secret"]
    PV["证明模块<br/>snarkjs + wasm + zkey"]
  end
  subgraph S["链下服务"]
    GS["组服务<br/>成员列表 与 Merkle 树"]
    RL["中继<br/>校验证明 垫付 Gas"]:::key
    IX["索引器<br/>监听 RootAdded 与 Claimed"]
  end
  subgraph C["链上合约"]
    AC["AnonClaim<br/>根历史 nullifier 表"]:::key
    VF["Groth16Verifier<br/>snarkjs 生成"]
    TK["奖励代币 或 投票计数"]
  end
  ID -->|"身份承诺"| GS
  GS -->|"成员列表 与 路径"| PV
  GS -->|"addRoot"| AC
  PV -->|"证明 与 公开信号"| RL
  RL -->|"claim 交易"| AC
  PV -.->|"降级：用户自己提交"| AC
  AC --> VF
  AC --> TK
  AC --> IX
  IX --> GS
`, [
  ['flow', 'secret 从不离开浏览器。组服务只知道身份承诺；中继只知道证明和收款地址；合约只知道根和 nullifier。'],
  ['key', '组服务可以是中心化的，因为任何人都能用公开的成员列表复核根。中继也可以是中心化的，因为它改不了证明绑定的收款地址。'],
  ['risk', '组服务能加入假成员（给自己多领）；中继能拒绝服务或记录 IP。前者用公开成员列表和时间锁防，后者用降级路径和日志策略防。'],
  ['limit', '本项目的组由管理员维护根。若要完全无需信任管理员，就用链上增量 Merkle 树（Semaphore 的做法），代价是每次加成员都要付 Gas。']
])}
${mm('一次匿名领取的调用链', `
sequenceDiagram
  participant U as 用户浏览器
  participant G as 组服务
  participant R as 中继
  participant A as AnonClaim 合约
  participant V as Verifier
  U->>G: 请求我的叶子路径 只发送叶子序号或下载整棵树
  G-->>U: siblings 与 pathIndices 与当前 root
  U->>U: 计算 nullifier 并生成 Groth16 证明
  U->>R: POST 证明 root nullifier recipient
  R->>R: 本地验证证明 查 nullifier 未使用 模拟交易
  R->>A: claim 交易 由中继付 Gas
  A->>A: 检查 root 在历史内 nullifier 未使用
  A->>V: verifyProof 公开信号含 root nullifier scope recipient
  V-->>A: true
  A->>A: 记录 nullifier 然后发放奖励
  A-->>R: 事件 Claimed
  R-->>U: 交易哈希
`, [
  ['flow', '用户请求路径时只暴露“叶子序号”也会泄露身份。更好的做法是下载整个成员列表在本地建树（100 万个 32 字节叶子约 32 MB，可分片或用快照）。'],
  ['key', 'recipient 是证明的公开输入。中继或内存池里的任何人修改 recipient，验证都会失败。'],
  ['fail', 'root 在用户生成证明后被新根挤出历史窗口，交易会失败；前端要提示重新生成证明。'],
  ['risk', '中继在“本地验证”这一步能看到 nullifier 和 recipient，但看不到 secret。中继若同时记录用户 IP，就能把 IP 和 recipient 关联起来。']
])}
${mm('一个 nullifier 的状态机', `
stateDiagram-v2
  state "未出现" as Unseen
  state "中继排队中" as Pending
  state "链上已使用" as Used
  state "失败可重试" as Failed
  [*] --> Unseen
  Unseen --> Pending: 中继接收并通过本地验证
  Pending --> Used: claim 交易成功
  Pending --> Failed: 根过期或交易回滚
  Failed --> Pending: 用户用新根重新生成证明
  Unseen --> Used: 用户绕过中继直接提交
  Used --> [*]
`, [
  ['key', 'Used 是终态：合约里的 nullifierUsed 一旦为 true，永远不会回到 false。'],
  ['fail', '中继要把 Pending 的 nullifier 锁住，防止同一个证明被重复提交浪费 Gas；但不能把它当作“已使用”，最终以链上为准。'],
  ['limit', '同一用户在同一 scope 只能有一个 nullifier；换收款地址重新生成证明，nullifier 不变，仍会被拒绝。']
])}

<h2>5. 先动手：看清证明“说的是什么数据”</h2>
<p>写代码之前，先在实验里把所有数据摊开看一遍。实验用 SHA-256 代替 Poseidon，这样不需要任何库；结构和真实系统一样。先做：选中一个成员，看 3 个兄弟节点怎样把叶子算回根。再观察：同一 scope 第二次领取被拒绝，换一个 scope 就允许；改一个叶子，根立刻改变。</p>
${lab('zkmember')}
<p><strong>算一算（示例）：树要多深、证明多大？</strong></p>
${steps([
  '成员上限 100 万：2<sup>20</sup> = 1,048,576 ≥ 1,000,000，所以深度取 20。每条认证路径有 20 个兄弟节点。',
  '约束数量估算：电路的主要成本是哈希。Poseidon(2) 在 circomlib 里约 240 个约束 ' + tag('推断') + '，20 层路径约 4,800，加上身份承诺和 nullifier 两次哈希，总数约 5,500 个约束。用 SHA-256 做同样的事，每次哈希约 3 万个约束，总数会超过 60 万。',
  'Groth16 的可信设置需要 2 的幂个约束的 Powers of Tau 文件：5,500 &lt; 2<sup>13</sup> = 8,192，用 13 次方（或更大）的 ptau 文件即可。',
  '证明大小固定：Groth16 证明是 3 个椭圆曲线点（a、b、c），以太坊上的 calldata 是 8 个 256 位整数 = 256 字节，与组大小无关。',
  '公开信号 4 个：root、nullifier、scope、message。合约验证一次 Groth16 的成本主要是配对运算，与公开信号数量线性相关，具体 Gas 以 forge 报告为准。'
])}

<h2>6. 技术选型</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['电路语言', 'Circom 2', 'Noir、Halo2', '与 snarkjs、circomlib 生态配套；M06.3 已学过'],
  ['证明系统', 'Groth16（snarkjs）', 'PLONK、fflonk', '证明最小、链上验证最便宜；代价是每个电路要做一次 phase 2 可信设置'],
  ['哈希', 'Poseidon（circomlib + poseidon-lite）', 'MiMC、SHA-256', '电路里约束最少；链下 JS 和电路必须用同一实现和同一参数'],
  ['组结构', '固定深度 20 的 Merkle 树，空叶子为 0', 'LeanIMT（Semaphore V4）', '固定深度最容易理解和测试；LeanIMT 深度可变、链上插入更省'],
  ['合约框架', 'Foundry', 'Hardhat', '测试快、内置模糊测试和 Gas 报告，见 <a href="#m02-4">M02.4 开发工具链</a>'],
  ['前端', 'TypeScript + viem + snarkjs（浏览器）', 'ethers', '与 M03 前端模块一致，见 <a href="#m07-2">M03.2 连接钱包</a>'],
  ['中继', 'Node.js + viem + PostgreSQL', 'OpenZeppelin Defender 之类的托管中继', '逻辑简单，需要自己控制日志策略'],
  ['生产替代', 'Semaphore V4', '自研', '已审计、有链上组管理和根有效期；学习用自研，上线优先用库']
])}

<h2>7. 数据模型</h2>
<p><strong>合约存储：</strong>verifier、token、scope、amount、admin 都是 immutable；<code>roots[30]</code> + <code>rootIndex</code> 组成根的环形缓冲区；<code>rootAddedAt</code> 记录每个根的加入时间（用于旧根有效期）；<code>nullifierUsed</code> 记录已用的 nullifier。完整定义见第 9.3 节。</p>
<p><strong>链下数据库（组服务 + 中继）：</strong></p>
${code('SQL', `
-- 组成员：只存身份承诺，绝不存 secret
CREATE TABLE members (
  leaf_index  INT PRIMARY KEY,
  commitment  NUMERIC(78,0) NOT NULL UNIQUE,
  added_at    TIMESTAMP NOT NULL DEFAULT now()
);
-- 每个根对应一个成员列表快照，供任何人复核
CREATE TABLE roots (
  root          NUMERIC(78,0) PRIMARY KEY,
  member_count  INT NOT NULL,
  snapshot_cid  VARCHAR(80) NOT NULL
);
-- 中继任务：nullifier 做主键，天然去重；不存 IP 和请求头
CREATE TABLE relay_jobs (
  nullifier  NUMERIC(78,0) PRIMARY KEY,
  recipient  VARCHAR(42) NOT NULL,
  status     VARCHAR(16) NOT NULL,   -- pending / sent / used / failed
  tx_hash    VARCHAR(66)
);
`)}

<h2>8. 接口设计</h2>
${tbl(['接口', '定义', '说明'], [
  ['合约 <code>addRoot(uint256 root)</code>', 'onlyAdmin，发出 <code>RootAdded(root)</code>', 'admin 设为“多签 + 时间锁”合约，给社区留出复核时间'],
  ['合约 <code>claim(uint256 root, uint256 nullifier, address recipient, uint256[2] a, uint256[2][2] b, uint256[2] c)</code>', '任何人可调用', '中继或用户本人提交；成功发出 <code>Claimed(nullifier, recipient)</code>'],
  ['HTTP <code>GET /group/snapshot</code>', '返回最新根与成员列表快照地址', '浏览器下载全部成员在本地建树，不暴露自己是哪片叶子'],
  ['HTTP <code>POST /relay</code>', 'body：root、nullifier、recipient、proof、publicSignals', '返回 jobId；重复 nullifier 返回 409']
])}

<h2>9. 核心代码</h2>
${art('一图看懂：本项目的文件怎样串起来：电路 → 验证合约 → 浏览器与中继', 660, 300, [
  S.zone(10, 30, 200, 232, { t: '编译期（一次性）' }),
  S.zone(230, 30, 200, 232, { t: '链上' }),
  S.zone(450, 30, 200, 232, { t: '链下：浏览器与中继' }),
  S.box(16, 62, 188, 72, { k: 'tint', t: 'anon_claim.circom', s: 'AnonClaim(20) 电路\nPoseidon + Merkle 路径', mono: 1, ts: 12 }),
  S.box(16, 170, 188, 72, { k: 'tint', t: 'anon_claim_final.zkey', s: 'phase 2 可信设置\n2–3 人贡献随机数', mono: 1, ts: 12 }),
  S.box(236, 62, 188, 72, { k: 'idle', dash: 1, t: 'Groth16Verifier.sol', s: 'snarkjs 自动导出\nverifyProof(a, b, c, pub)', mono: 1, ts: 12 }),
  S.box(236, 170, 188, 72, { k: 'key', t: 'AnonClaim', s: 'claim · addRoot\nroots[30] · nullifierUsed', mono: 1, ts: 13 }),
  S.box(456, 62, 188, 72, { k: 'tint', t: 'proveClaim()', s: 'buildPath() 建树取路径\n浏览器里加载 wasm + zkey', mono: 1, ts: 13 }),
  S.box(456, 170, 188, 72, { k: 'tint', t: '中继 POST /relay', s: '五步检查后 writeContract\n垫付 Gas', ts: 13 }),
  S.arrow(110, 136, 110, 168),
  S.route([[204, 206], [220, 206], [220, 98], [234, 98]], { dash: 1 }),
  S.arrow(330, 168, 330, 136),
  S.arrow(550, 136, 550, 168),
  S.arrow(454, 206, 426, 206),
  S.text(330, 286, '改了电路，就必须重做 phase 2 可信设置，并重新部署验证合约', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '编译电路 → 可信设置得到 zkey → 导出验证合约；运行时浏览器用 zkey 生成证明，经中继调用 AnonClaim.claim。'],
  ['key', 'AnonClaim 只做两件事：检查根在历史里、nullifier 没用过；证明本身交给 Groth16Verifier。'],
  ['risk', 'zkey 要在前端加载时校验哈希，防止被替换成别人生成的文件。'],
  ['limit', 'Groth16Verifier.sol 是生成物，不要手改；电路一变，它和 zkey 都要重新生成。']
], '三列依次是编译期、链上、链下。anon_claim.circom 经可信设置得到 zkey，导出 Groth16Verifier.sol；AnonClaim 合约调用它；浏览器里的 proveClaim 生成证明，交给中继，中继调用 AnonClaim。', 'm10-7')}
<h3>9.1 Circom 电路</h3>
<p>依赖：circom 2.x 编译器、<code>npm install circomlib snarkjs</code>。编译：<code>circom anon_claim.circom --r1cs --wasm --sym -l node_modules</code>；<code>snarkjs r1cs info anon_claim.r1cs</code> 查看约束数量。</p>
${code('CIRCOM', `
pragma circom 2.1.6;
include "circomlib/circuits/poseidon.circom";

// 固定深度的 Merkle 成员检查：叶子 + 路径 => 根
template MerkleInclusion(DEPTH) {
    signal input leaf;
    signal input siblings[DEPTH];
    signal input pathIndices[DEPTH];   // 0：当前节点在左；1：当前节点在右
    signal output root;

    signal cur[DEPTH + 1];
    signal left[DEPTH];
    signal right[DEPTH];
    component h[DEPTH];
    cur[0] <== leaf;

    for (var i = 0; i < DEPTH; i++) {
        // 关键约束：pathIndices 必须是 0 或 1。漏掉这一行，攻击者可以填别的数，伪造路径
        pathIndices[i] * (pathIndices[i] - 1) === 0;
        left[i]  <== cur[i] + pathIndices[i] * (siblings[i] - cur[i]);
        right[i] <== siblings[i] + pathIndices[i] * (cur[i] - siblings[i]);
        h[i] = Poseidon(2);
        h[i].inputs[0] <== left[i];
        h[i].inputs[1] <== right[i];
        cur[i + 1] <== h[i].out;
    }
    root <== cur[DEPTH];
}

template AnonClaim(DEPTH) {
    signal input secret;                 // 私有：成员秘密
    signal input siblings[DEPTH];        // 私有：认证路径
    signal input pathIndices[DEPTH];     // 私有：左右方向
    signal input scope;                  // 公开：活动标识
    signal input message;                // 公开：收款地址或投票选项
    signal output root;                  // 公开：组的根
    signal output nullifier;             // 公开：作废标记

    // 身份承诺 = Poseidon(secret)（Semaphore V4 用公钥哈希，这里简化）
    component idc = Poseidon(1);
    idc.inputs[0] <== secret;

    component tree = MerkleInclusion(DEPTH);
    tree.leaf <== idc.out;
    for (var i = 0; i < DEPTH; i++) {
        tree.siblings[i] <== siblings[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    root <== tree.root;

    // nullifier = Poseidon(scope, secret)：同一人同一 scope 唯一，不同 scope 互不关联
    component nf = Poseidon(2);
    nf.inputs[0] <== scope;
    nf.inputs[1] <== secret;
    nullifier <== nf.out;

    // 把 message 绑进证明：不参与计算，但加一个约束，改动 message 证明就失效
    signal messageSquare;
    messageSquare <== message * message;
}

// snarkjs 的公开信号顺序：先输出，再公开输入 => [root, nullifier, scope, message]
component main { public [scope, message] } = AnonClaim(20);
`)}
${call('warn', '<p>电路里只能用 <code>&lt;==</code>（赋值并约束）或 <code>===</code>（约束），不要用 <code>&lt;--</code>（只赋值）去计算会影响安全的信号。<code>&lt;--</code> 算出的值不受约束，恶意证明者可以填任意值。2019 年 Tornado Cash 的 MiMC 电路缺陷就是这一类“只赋值不约束”的问题' + cite('Trail of Bits：It pays to be Circomspect', 'https://blog.trailofbits.com/2022/09/15/it-pays-to-be-circomspect/') + '。用 circomspect 静态检查能发现大部分此类问题。</p>')}
<h3>9.2 可信设置与导出验证合约</h3>
${code('BASH', `
# phase 1：使用公开仪式产生的 Powers of Tau 文件（下载官方 ptau，不要自己生成用于生产）
# phase 2：为本电路做专用设置，至少 2–3 个独立参与者贡献随机数
snarkjs groth16 setup anon_claim.r1cs pot14_final.ptau anon_claim_0000.zkey
snarkjs zkey contribute anon_claim_0000.zkey anon_claim_0001.zkey --name="contributor 1" -v
snarkjs zkey contribute anon_claim_0001.zkey anon_claim_final.zkey --name="contributor 2" -v
snarkjs zkey verify anon_claim.r1cs pot14_final.ptau anon_claim_final.zkey
snarkjs zkey export verificationkey anon_claim_final.zkey verification_key.json
snarkjs zkey export solidityverifier anon_claim_final.zkey contracts/Groth16Verifier.sol
`)}
<h3>9.3 Solidity：领取合约</h3>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IGroth16Verifier { // snarkjs 导出，4 个公开信号
    function verifyProof(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[4] calldata pub)
        external view returns (bool);
}

contract AnonClaim {
    using SafeERC20 for IERC20;
    uint256 internal constant SNARK_FIELD = // BN254 标量域大小
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint8 public constant ROOT_HISTORY = 30;
    uint64 public constant ROOT_TTL = 7 days;      // 旧根有效期（示例）

    IGroth16Verifier public immutable verifier;
    IERC20 public immutable token;
    uint256 public immutable scope;                // 一个合约一个 scope，调用方不能自选
    uint256 public immutable amount;
    address public immutable admin;                // 建议：多签 + 时间锁合约

    uint256[30] public roots;
    uint8 public rootIndex;
    mapping(uint256 => uint64) public rootAddedAt;
    mapping(uint256 => bool) public nullifierUsed;

    event RootAdded(uint256 indexed root);
    event Claimed(uint256 indexed nullifier, address indexed recipient);
    error NotAdmin(); error UnknownRoot(); error NullifierUsed(); error InvalidProof(); error NotInField();

    constructor(IGroth16Verifier v, IERC20 t, string memory scopeName, uint256 amt, address adm) {
        verifier = v; token = t; amount = amt; admin = adm;
        scope = uint256(keccak256(bytes(scopeName))) >> 8; // 右移 8 位，保证小于 SNARK_FIELD
    }

    function addRoot(uint256 root) external {
        if (msg.sender != admin) revert NotAdmin();
        if (root >= SNARK_FIELD) revert NotInField();
        rootIndex = uint8((rootIndex + 1) % ROOT_HISTORY);
        roots[rootIndex] = root;                   // 环形缓冲区：最老的根被挤出
        rootAddedAt[root] = uint64(block.timestamp);
        emit RootAdded(root);
    }

    function isKnownRoot(uint256 root) public view returns (bool) {
        if (root == 0) return false;
        for (uint8 i = 0; i < ROOT_HISTORY; i++) {
            if (roots[i] == root) // 最新根永远有效；旧根只在 TTL 内有效
                return i == rootIndex || block.timestamp <= rootAddedAt[root] + ROOT_TTL;
        }
        return false;
    }

    function claim(uint256 root, uint256 nullifier, address recipient,
                   uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c) external {
        if (!isKnownRoot(root)) revert UnknownRoot();
        if (nullifier >= SNARK_FIELD) revert NotInField();   // 防止 n 与 n + p 被当成两个键
        if (nullifierUsed[nullifier]) revert NullifierUsed();
        // 顺序必须与电路一致：[root, nullifier, scope, message]
        uint256[4] memory pub = [root, nullifier, scope, uint256(uint160(recipient))];
        if (!verifier.verifyProof(a, b, c, pub)) revert InvalidProof();
        nullifierUsed[nullifier] = true;                     // 先写状态，再转账
        emit Claimed(nullifier, recipient);
        token.safeTransfer(recipient, amount);
    }
}
`)}
<p>投票版本只改最后两行：message 改成“选项编号”（或 Poseidon(提案号, 选项)），合约里把 <code>votes[option]++</code> 代替转账。投票时 scope 用提案号，所以每个提案一人一票。</p>
<h3>9.4 TypeScript：浏览器里建树与生成证明</h3>
${code('TYPESCRIPT', `
import * as snarkjs from "snarkjs";
import { poseidon1, poseidon2 } from "poseidon-lite";   // 与 circomlib Poseidon 参数一致

const DEPTH = 20;

// 1) 身份：secret = 31 字节随机数，只存本设备（生产中加密存 IndexedDB 并提示备份）
export const commitmentOf = (secret: bigint) => poseidon1([secret]);

// 2) 固定深度的稀疏 Merkle 树：空位用每层的“零哈希”填充，和电路一致
function zeroHashes(): bigint[] {
  const z = [0n];
  for (let i = 1; i <= DEPTH; i++) z.push(poseidon2([z[i - 1], z[i - 1]]));
  return z;
}
export function buildPath(leaves: bigint[], index: number) {
  const z = zeroHashes();
  let level = leaves.slice();
  const siblings: bigint[] = [], pathIndices: number[] = [];
  for (let d = 0; d < DEPTH; d++) {
    const isRight = index & 1;
    const sib = isRight ? level[index - 1] : (level[index + 1] ?? z[d]);
    siblings.push(sib);
    pathIndices.push(isRight);
    const next: bigint[] = [];
    for (let j = 0; j < Math.ceil(level.length / 2); j++) {
      next.push(poseidon2([level[2 * j], level[2 * j + 1] ?? z[d]]));
    }
    level = next.length ? next : [z[d + 1]];
    index >>= 1;
  }
  return { root: level[0], siblings, pathIndices };
}

// 3) 生成证明：成员列表整份下载到本地，不向服务器透露自己的叶子序号
export async function proveClaim(secret: bigint, members: bigint[], scope: bigint, recipient: \`0x\${string}\`) {
  const index = members.indexOf(commitmentOf(secret));
  if (index < 0) throw new Error("你不在这个组里");
  const { root, siblings, pathIndices } = buildPath(members, index);
  const message = BigInt(recipient);                         // 地址 160 位，小于域大小
  const input = {
    secret: secret.toString(), scope: scope.toString(), message: message.toString(),
    siblings: siblings.map(String), pathIndices: pathIndices.map(String),
  };
  // wasm 与 zkey 由前端静态托管；zkey 文件要校验哈希，防止被替换
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, "/zk/anon_claim.wasm", "/zk/anon_claim_final.zkey");
  // publicSignals = [root, nullifier, scope, message]
  if (BigInt(publicSignals[0]) !== root) throw new Error("本地根与电路输出不一致");
  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const [a, b, c] = JSON.parse("[" + calldata + "]");
  return { a, b, c, root, nullifier: BigInt(publicSignals[1]), recipient };
}
`)}
${call('info', '<p>证明生成很耗 CPU。把 <code>fullProve</code> 放进 Web Worker，主线程只显示进度；zkey 文件可能有几 MB 到几十 MB，要用 CDN 缓存并校验 SHA-256。私钥和 secret 的存储风险与 XSS 防护见 <a href="#m07-8">M03.8 前端安全</a>。</p>')}
<h3>9.5 中继</h3>
<p>中继用 viem 连接 RPC，收到 <code>POST /relay</code> 后按顺序做五件事，任何一步失败都直接返回错误、不花 Gas：</p>
${steps([
  '<strong>公开信号自洽：</strong>把 publicSignals 解析成 [root, nullifier, scope, message]，检查 message 等于请求里的 recipient，scope 等于合约里的 scope。',
  '<strong>链下验证：</strong>调用 <code>snarkjs.groth16.verify(vKey, publicSignals, proof)</code>，便宜地挡掉垃圾请求。',
  '<strong>去重：</strong>向 relay_jobs 插入以 nullifier 为主键的记录，冲突即返回 409；再用 <code>readContract</code> 查链上 <code>nullifierUsed</code>。',
  '<strong>模拟：</strong>用 <code>exportSolidityCallData</code> 得到 a、b、c，调用 <code>simulateContract</code> 模拟 claim，确认不会回滚。',
  '<strong>发送：</strong><code>writeContract(request)</code> 返回交易哈希，任务状态改为 sent；索引器看到 Claimed 事件后改为 used。'
])}
<p>中继的 Gas 由项目方（空投方）承担，所以用户不需要任何 ETH。若要让用户付中继费，就把 <code>relayer</code> 和 <code>fee</code> 也作为公开输入绑进电路，和 Tornado Cash 一样。中继的私钥管理和 Nonce 处理见 <a href="#m03-6">M09.6 Nonce 管理</a>。</p>
<h3>9.6 生产选项：Semaphore V4</h3>
<p>本项目的结构和 Semaphore 一致。Semaphore V4 规范里，身份承诺是 Poseidon(公钥 x, 公钥 y)（公钥在 Baby Jubjub 曲线上），nullifier = Poseidon(scope, secret)，组是用 Poseidon 的 LeanIMT 树；电路的公开输入是 message 和 scope，输出是 merkleRoot 和 nullifier${cite('Semaphore V4 规范（zkspecs）', 'https://github.com/zkspecs/zkspecs/blob/main/specs/3-semaphore-v4/README.md')}。链上合约提供 <code>createGroup</code>、<code>addMember</code>、<code>addMembers</code>、<code>validateProof(groupId, proof)</code>，并内置“根已过期”“nullifier 重复使用”等检查，组可以设置旧根的有效期${cite('Semaphore 源码：ISemaphore.sol', 'https://github.com/semaphore-protocol/semaphore/blob/main/packages/contracts/contracts/interfaces/ISemaphore.sol')}。</p>
<p>对应的 SDK 用法是：<code>new Identity()</code> 生成身份，<code>new Group([commitment, …])</code> 建组，<code>generateProof(identity, group, message, scope)</code> 生成证明，<code>verifyProof(proof)</code> 链下验证；链上调用 <code>semaphore.validateProof(groupId, proof)</code>。包名是 <code>@semaphore-protocol/identity</code>、<code>/group</code>、<code>/proof</code>，截至 2026 年 npm 上为 4.x 版本。</p>
<p>这些调用方式来自 Semaphore 官方文档${cite('Semaphore 文档：Proofs', 'https://docs.semaphore.pse.dev/guides/proofs')}。上线前请核对你安装的版本的 API 和已部署合约地址。</p>

<h2>10. 测试策略</h2>
${tbl(['层级', '用例', '工具'], [
  ['电路单元', '合法成员通过；非成员无法生成见证；pathIndices 填 2 失败；改 message 后验证失败（另用 circomspect 做静态检查）', 'circom_tester'],
  ['电路一致性', 'JS 的 poseidon-lite 与电路 Poseidon 对 100 组随机输入输出相同；JS 建树的根等于电路输出的根', 'Mocha / Vitest'],
  ['合约单元', '未知根被拒；过期旧根被拒；nullifier 重复被拒；nullifier ≥ 域大小被拒；恶意改 recipient 被拒；时间锁未到不能激活根', 'Foundry（用预先生成的证明作为 fixture）'],
  ['合约模糊', '随机 root、nullifier、证明字节：除 fixture 外全部回滚，且 nullifierUsed 不变', 'forge fuzz + invariant'],
  ['集成', '浏览器生成证明 → 中继 → 本地链 anvil → Claimed 事件 → 索引器入库', 'Playwright + anvil'],
  ['抢跑', '在 anvil 里截获 claim 交易，改 recipient 重发：必须失败', 'Foundry 脚本'],
  ['压测', '中继 50 RPS 提交（含 30% 重复 nullifier）：重复请求全部 409，无重复上链', 'k6'],
  ['故障注入', 'RPC 超时、中继重启、证明生成期间根更新：用户能看懂提示并重试', '混沌脚本']
])}

<h2>11. 部署与运维</h2>
${steps([
  '<strong>环境：</strong>本地 anvil → Sepolia → 主网或 L2（L2 上验证更便宜）。',
  '<strong>CI/CD：</strong>每次提交运行电路编译、circomspect、Foundry 测试、Slither。电路有任何改动，都必须重新做 phase 2 可信设置并重新部署验证合约。把 zkey 的哈希写进仓库，前端加载时校验。',
  '<strong>密钥：</strong>管理员用多签（见 <a href="#m03-4">M09.4 多签钱包</a>）；中继热钱包只放够几天用的 Gas，余额低于阈值告警并由冷钱包补充。',
  '<strong>监控指标（示例）：</strong><code>relay_requests_total{status}</code>、<code>relay_proof_invalid_ratio</code>（> 20% 告警，可能是攻击或前端 bug）、<code>relay_wallet_balance_eth</code>（低于 0.2 ETH 告警）、<code>claim_tx_revert_ratio</code>（> 5% 告警）、<code>root_age_seconds</code>（接近 ROOT_TTL 告警）。',
  '<strong>日志策略：</strong>网关层不记录 IP 与请求体；应用日志只记 nullifier 前 8 位和状态。把日志策略写进隐私说明并对外公开。'
])}

<h2>12. 安全清单与威胁模型</h2>
${tbl(['威胁', '攻击方式', '防御', '验证方法'], [
  ['证明被抢跑', '在内存池复制证明，改收款地址后抢先上链', 'recipient 作为公开输入（message）绑进证明；合约用 msg 数据重建公开信号', '抢跑测试用例'],
  ['nullifier 复用', '同一人多次领取', 'nullifierUsed 映射；scope 固定在合约里，调用方不能自选', '重复领取测试'],
  ['跨活动关联', '同一 nullifier 在多个活动出现，把行为串起来', 'nullifier 包含 scope；不同活动必须用不同 scope', '检查各合约 scope 互不相同'],
  ['域溢出 / 别名', '提交 nullifier + p，绕过“已使用”检查', '所有公开信号检查 &lt; SNARK_FIELD；snarkjs 导出的验证合约也做域检查', '提交 n + p 的测试'],
  ['根历史窗口', '被移出组的人继续用旧根证明；或根更新太快导致正常用户失败', '旧根 TTL；环形缓冲区大小与加成员频率匹配', '时间推进测试'],
  ['电路欠约束', 'pathIndices 非 0/1、&lt;-- 未约束信号，导致伪造路径或 nullifier', '布尔约束；只用 &lt;== 和 ===；circomspect；外部电路审计', '负面见证测试'],
  ['可信设置被操纵', 'phase 2 唯一参与者保留了有毒废料，可伪造证明', '多方独立贡献；公开贡献记录；或改用无需逐电路设置的方案', 'snarkjs zkey verify'],
  ['管理员加入假成员', '管理员把自己控制的承诺加进组，多领奖励', '公开成员列表快照；新根时间锁；多签管理员', '独立脚本复核根'],
  ['匿名集太小', '组只有 10 个人，靠时间和金额就能猜出是谁', '设置最小成员数才开放领取；提示用户延迟领取', '上线检查项'],
  ['网络层去匿名', '中继或 RPC 记录 IP 与 recipient', '日志策略；允许用户自建中继或直接提交；建议使用隐私网络', '日志审计'],
  ['secret 泄露', 'XSS、恶意浏览器扩展读取本地存储', 'CSP、依赖锁定、secret 加密存储与备份提示', '前端安全扫描']
])}
${call('warn', '<p><strong>合规边界：</strong>本项目隐藏的是“组内哪一个成员在行动”，不是资金来源；奖励由项目方发放，不汇集第三方资金，所以不属于混币服务。上线前仍要对收款地址做制裁筛查，并确认你所在法域对空投和投票的要求。见 <a href="#m10-5">M06.5 隐私协议与合规边界</a> 和 <a href="#m11-2">M07.2 KYC、AML 与制裁筛查</a>。本书内容不是法律建议。</p>')}

<h2>13. 里程碑计划（5 周示例）</h2>
${tbl(['周', '目标', '交付物'], [
  ['第 1 周', '电路与离线证明', 'anon_claim.circom；约束数报告；JS 与电路一致性测试；circomspect 无高危'],
  ['第 2 周', '合约与可信设置', 'Groth16Verifier.sol、AnonClaim.sol；多人 phase 2 记录；Foundry 单元 + 模糊测试；Gas 报告'],
  ['第 3 周', '浏览器端', '身份生成与备份；下载成员快照建树；Web Worker 证明；手机与桌面性能测试表'],
  ['第 4 周', '中继与组服务', 'POST /relay、GET /group/snapshot；PostgreSQL 表；去重与模拟；日志策略文档；监控面板'],
  ['第 5 周', '测试网上线与安全复盘', 'Sepolia 部署；抢跑、根过期、故障注入演练报告；威胁模型逐条打勾；投票版本演示'],
  ['可选第 6 周', '迁移到 Semaphore V4', '用 Semaphore 合约与 SDK 替换自研部分，对比 Gas 与开发量']
])}

<h2>14. 扩展方向与作品集要点</h2>
<ul>
  <li><strong>与凭证结合：</strong>成员资格来自链上凭证或 EAS 证明（见 <a href="#m09-1">M13.1 链上身份</a>），实现“持有凭证的人匿名投票”。</li>
  <li><strong>关联集：</strong>参考 <a href="#m10-5">M06.5</a> 的 Privacy Pools，在成员证明之外再证明“我也在某个子集里”。</li>
  <li><strong>反女巫：</strong>成员证明只保证“一个承诺一次”。一个人有多个承诺就能多领，所以入组环节要有独立的身份或凭证检查。</li>
  <li><strong>面试要点：</strong>能讲清为什么 nullifier 要包含 scope、为什么 recipient 要绑进证明、根历史窗口的权衡、你做了哪些负面测试来防欠约束。</li>
</ul>
${tryit(`<p><strong>动手练习：</strong>用 circom 和 snarkjs 跑通一个深度为 2 的迷你版本（4 个成员）。</p>
${steps([
  '把本篇电路最后一行改成 <code>AnonClaim(2)</code>，运行 <code>circom anon_claim.circom --r1cs --wasm -l node_modules</code>，再运行 <code>snarkjs r1cs info anon_claim.r1cs</code>，记下约束数量。',
  '用 poseidon-lite 算出 4 个 secret 的身份承诺，用 buildPath（把 DEPTH 改为 2）得到第 3 个成员的路径，写成 input.json。',
  '运行 <code>snarkjs groth16 setup</code> 和一次 <code>zkey contribute</code>（测试用 ptau 可以下载小规模的官方文件），再运行 <code>snarkjs groth16 fullprove input.json anon_claim_js/anon_claim.wasm anon_claim_final.zkey proof.json public.json</code>。',
  '运行 <code>snarkjs groth16 verify verification_key.json public.json proof.json</code>，预期输出 OK。',
  '把 public.json 里的第 4 个值（message）改掉一位，再验证：预期失败。把 input.json 里一个 pathIndices 改成 2，重新生成见证：预期失败。'
])}
<p>预期结果：你亲手确认了三件事：合法证明通过；公开输入被绑定；路径方向被约束。</p>`)}
${exercises([
  ['如果 nullifier 只用 Poseidon(secret)，不包含 scope，会出现什么问题？', '<p>同一个人在所有活动里的 nullifier 都相同：第一，他领过一次空投后，所有后续活动都会把他当作“已领取”；第二，观察者可以把同一个 nullifier 在不同活动里的行为串起来，逐步缩小他的身份范围。包含 scope 后，每个活动的 nullifier 互不相关。</p>'],
  ['ROOT_HISTORY 设为 1（只接受最新根）有什么问题？设为 1,000 又有什么问题？', '<p>设为 1：每次加入新成员，所有正在生成或已提交的证明都会失效，用户体验很差，还可能被人用“频繁加成员”的方式拒绝服务。设为 1,000 且没有 TTL：被移出组的人可以长期用旧根证明成员资格；isKnownRoot 的循环也更耗 Gas。合理做法是中等大小的环形缓冲区加旧根 TTL。</p>'],
  ['攻击者提交的 nullifier 等于 n + p（p 是域大小），合约没有做范围检查，会发生什么？', '<p>在电路的域里 n + p 和 n 是同一个元素，验证合约做模运算后证明仍可能通过；但 Solidity 映射把 n 和 n + p 当作两个不同的键，于是同一个人可以领两次。所以合约要检查所有公开信号小于域大小（snarkjs 导出的验证合约也会检查）。</p>']
])}
${checklist([
  '能画出系统架构图，并说出 secret、身份承诺、nullifier、recipient 分别出现在哪些组件里。',
  '能写出 MerkleInclusion 电路，并解释 pathIndices 布尔约束和 message 平方约束的作用。',
  '能完成多方 phase 2 设置，导出验证合约，并在 Foundry 里用 fixture 测试 claim。',
  '能在浏览器里用 snarkjs 生成证明，并通过中继提交到测试网。',
  '能逐条讲解威胁模型中的 11 个威胁，并为每一条写出至少一个测试。',
  '能说出什么时候应直接使用 Semaphore V4，以及它的 API 和本项目的对应关系。'
])}
${mistakes([
  ['零知识证明会隐藏收款地址。', 'recipient 是公开输入，链上可见。隐藏的是“组内哪个成员”。收款地址要用新地址，并通过中继提交。'],
  ['同一个人换一个收款地址就能再领一次。', 'nullifier 只由 secret 和 scope 决定，与收款地址无关，换地址后 nullifier 不变，仍被拒绝。'],
  ['电路里用 &lt;-- 计算中间值更方便，没有关系。', '&lt;-- 只赋值不约束，恶意证明者可以填任意值。影响安全的信号必须用 &lt;== 或 ===。'],
  ['链上只存根就够了，成员列表不用公开。', '不公开成员列表，没人能复核根，管理员可以偷偷加入假成员。'],
  ['成员证明能防女巫攻击。', '它只保证“一个承诺一次”。一个人拿到多个承诺就能多次行动，反女巫要在入组环节解决。']
])}
${recap([
  '三件套：身份承诺 = Poseidon(secret) 放进 Merkle 组；证明“我知道组里某个承诺的 secret”；公开 nullifier = Poseidon(scope, secret) 防止同一 scope 重复。',
  '电路关键约束：pathIndices 必须是 0/1；message（收款地址或投票选项）用平方约束绑进证明；全部用 &lt;== 和 ===。',
  '合约关键检查：根在历史窗口且未过期；nullifier 小于域大小且未使用；公开信号顺序与电路一致；先写状态再转账。',
  '浏览器端下载完整成员列表在本地建树；中继垫付 Gas，改不了绑定的收款地址；日志不记录 IP。',
  '威胁模型覆盖抢跑、nullifier 复用、根窗口、欠约束、可信设置、域溢出、匿名集、网络层和管理员作恶；生产环境优先用 Semaphore V4。'
])}
${quiz([
  { q: '在本项目中，为什么同一个人换一个新收款地址后仍然不能在同一轮再领一次？', o: ['合约记录了他的旧地址', 'nullifier 只由 secret 和 scope 决定，与收款地址无关', '中继记住了他的 IP', '证明里包含他的身份承诺'], a: 1, why: 'nullifier = Poseidon(scope, secret)。换收款地址只改变 message，nullifier 不变，合约查表即拒绝。证明并不公开身份承诺。' },
  { q: '电路里的 <code>pathIndices[i] * (pathIndices[i] - 1) === 0</code> 起什么作用？', o: ['让证明更短', '约束 pathIndices 只能是 0 或 1，防止伪造路径', '计算 nullifier', '把 message 绑进证明'], a: 1, why: '没有这条约束，pathIndices 可以取任意域元素，选择公式会产生非预期的左右组合，攻击者可能借此算出指定的根。' },
  { q: '合约对 nullifier 做 <code>nullifier &lt; SNARK_FIELD</code> 检查，防的是什么？', o: ['Gas 过高', '重入攻击', 'n 与 n + p 在电路里相同、在映射里不同造成的重复领取', '根过期'], a: 2, why: '域元素的别名问题：验证可能接受 n + p，但映射把它当新键。范围检查把每个 nullifier 限制为唯一表示。' },
  { q: '下面哪项<strong>不是</strong>中继能做到的事？', o: ['拒绝为某些请求付 Gas', '记录请求者的 IP', '把证明里的收款地址改成自己的', '延迟提交交易'], a: 2, why: '收款地址是证明的公开输入，改动后验证失败。中继能审查、能记录、能拖延，所以要有日志策略和降级路径。' },
  { q: '根历史窗口设置过长且没有 TTL，主要风险是？', o: ['新成员无法加入', '被移出组的人可以长期用旧根证明成员资格', '证明会变大', 'nullifier 会重复'], a: 1, why: '旧根里仍包含被移出的成员。窗口越长、没有 TTL，他们能证明的时间越久。Semaphore 用根有效期解决这个问题。' }
])}
${terms([
  ['身份承诺', 'Identity commitment', '成员 secret 的哈希，作为 Merkle 组的叶子公开。'],
  ['作用域', 'Scope', '一次活动的标识，参与计算 nullifier，使同一人在同一活动只能行动一次。'],
  ['认证路径', 'Authentication path', '从叶子到根所需的全部兄弟节点及左右方向。'],
  ['欠约束', 'Under-constrained circuit', '电路缺少必要约束，导致恶意证明者可以构造不应成立的证明。'],
  ['公开信号', 'Public signals', 'Groth16 证明中验证者可见的输入与输出，顺序必须与电路一致。'],
  ['Poseidon', 'Poseidon hash', '为零知识电路设计、约束数量很少的哈希函数。'],
  ['Semaphore', 'Semaphore', '以太坊上的匿名信号协议，提供身份、组、证明的库和合约。']
])}
` });
})();
