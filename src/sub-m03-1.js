/* ---------- M08 子文章（一）：钱包分类、HD 钱包、交易签名 ---------- */
(() => {
CUR = 'm03-1';
addCh({ id: 'm03-1', nav: '钱包分类全景', title: 'M08.1 钱包分类全景：热、冷、托管与智能合约钱包', desc: '按联网方式、控制权、载体、账户类型给钱包分类，并学会企业选型。', html: `
<h1>M08.1 钱包分类全景：热、冷、托管与智能合约钱包</h1>
${meta(['用 4 个维度（联网、控制权、载体、账户类型）给任何一个钱包分类。', '说清 EOA 与智能合约钱包（Safe、ERC-4337）的区别和各自适用场景。', '为交易所、托管机构、支付公司、项目方金库分别选出合理的钱包组合。'], '<a href="#m03">M08 模块总览</a>、<a href="#m00-3">M00.3 公钥私钥与数字签名</a>')}
${beginner(`<p><strong>私钥（Private Key）</strong>：一个 256 位的随机数。谁拿到它，谁就能动用对应地址里的资产。</p>
<p><strong>地址（Address）</strong>：由公钥计算出来的一串字符，像银行账号，可以公开给别人收款。</p>
<p><strong>签名（Signature）</strong>：用私钥对一笔交易生成的“电子印章”。链上节点用公钥验证印章真伪，但看不到私钥。</p>
<p><strong>托管（Custody）</strong>：谁替你保管私钥。自己保管叫“自托管”，交给公司保管叫“托管”。</p>
<p><strong>智能合约（Smart Contract）</strong>：部署在链上、按代码自动执行的程序。合约本身也可以当钱包用。</p>`)}

<h2>1. 一句话理解</h2>
${one('钱包不存币，币永远记在链上的账本里。钱包只做两件事：保管私钥，用私钥签名。所有钱包分类，本质上都是在回答“私钥放在哪、谁能用、怎么用”。')}
${call('analogy', `<p>把链上资产想成存在银行里的钱，私钥是取款印章：</p>
<ul><li><strong>热钱包</strong>：印章放在柜台抽屉里，随时能盖，但小偷也容易拿到。</li>
<li><strong>冷钱包</strong>：印章锁在保险柜里，每次用都要开柜，慢但安全。</li>
<li><strong>托管钱包</strong>：印章交给银行保管，你只有一个网银账号。</li>
<li><strong>多签钱包</strong>：取款需要三个合伙人里两个人一起盖章。</li></ul>
<p>类比的局限：银行可以冻结、撤销转账；区块链上签名后的交易一旦确认，任何人都不能撤销。</p>`)}
${art('一图看懂：钱包不存币，只按“私钥放哪、谁掌管”分类', 660, 372, [
  S.box(10, 10, 640, 52, { k: 'info', icon: 'block', t: '链上账本：币永远记在这里', s: '钱包不存币，只保管私钥，并用私钥签名' }),
  S.text(225, 84, '你自己持有私钥（非托管）', { size: 13, b: 1, anchor: 'middle' }),
  S.text(525, 84, '机构替你保管（托管）', { size: 13, b: 1, anchor: 'middle' }),
  S.pill(10, 118, 76, 30, '热 · 联网', { k: 'warn' }),
  S.pill(10, 212, 76, 30, '冷 · 离线', { k: 'plain' }),
  S.box(100, 96, 250, 76, { k: 'warn', icon: 'phone', t: '手机 / 浏览器钱包', s: 'MetaMask · 私钥在联网设备' }),
  S.box(100, 190, 250, 76, { k: 'key', icon: 'shield', t: '硬件钱包', s: 'Ledger · 私钥不出芯片' }),
  S.box(400, 96, 250, 76, { k: 'info', icon: 'bank', t: '交易所账户', s: '余额是数据库里的一行记录' }),
  S.box(400, 190, 250, 76, { k: 'info', icon: 'lock', t: '机构冷库', s: 'BitGo 等 · 离线保管' }),
  S.box(10, 288, 310, 52, { k: 'tint', icon: 'users', t: '半托管：MPC 分片 / 多签', s: '用户与机构各持一部分' }),
  S.box(340, 288, 310, 52, { k: 'tint', icon: 'code', t: '合约钱包：Safe', s: '规则写在链上代码，不是一把私钥' }),
  S.text(330, 364, '托管回答“信任谁”，冷热回答“攻击面多大”', { size: 13, anchor: 'middle' })
], [
  ['flow', '横着看是“谁持有私钥”，竖着看是“私钥是否联网”；每个格子是一类典型钱包。'],
  ['key', '4 个格子只是在回答“私钥放哪、谁能用”，币始终在链上。硬件钱包把私钥锁在芯片里，签名在芯片内完成。'],
  ['risk', '托管格子里的“余额”只是机构数据库的记录。机构出事，用户资产受损。'],
  ['limit', '冷热不是绝对的：硬件钱包接上电脑签名时，请求来自联网设备。底部两类是另外两个维度（控制方式、账户类型）。']
], '2 乘 2 的钱包分类：横向是非托管与托管，纵向是热与冷，底部是半托管和合约钱包，所有币都记在链上账本', 'm03-1')}

<h2>2. 四个分类维度</h2>
<p>市面上的钱包名字五花八门。用下面 4 个维度去看，任何钱包都能准确定位。</p>
${mm('钱包分类的四个维度', `
flowchart TB
  W["一个钱包"] --> D1["维度 1：是否联网"]
  W --> D2["维度 2：谁控制私钥"]
  W --> D3["维度 3：私钥存在什么载体"]
  W --> D4["维度 4：链上账户类型"]
  D1 --> H["热钱包<br/>私钥所在设备联网"]
  D1 --> C["冷钱包<br/>私钥从不接触网络"]
  D2 --> NC["非托管<br/>用户自己持有"]
  D2 --> CU["托管<br/>机构持有"]
  D2 --> SC["半托管<br/>用户与机构各持一部分"]
  D3 --> SW["软件钱包"]
  D3 --> HW["硬件钱包"]
  D3 --> PW["纸钱包 / 金属板"]
  D4 --> EOA["EOA 外部账户<br/>一把私钥"]
  D4 --> SCW["智能合约钱包<br/>规则写在代码里"]
`, [
  ['flow', '四个维度互相独立。例子：Ledger 是“冷 + 非托管 + 硬件 + EOA”；Safe 加硬件钱包签名者是“冷 + 非托管 + 硬件 + 合约钱包”。'],
  ['key', '“托管/非托管”回答信任谁；“冷/热”回答攻击面有多大。两者不要混为一谈。'],
  ['limit', '冷热不是绝对的。硬件钱包接上电脑签名的那一刻，签名请求来自联网设备，界面可能被篡改。'],
  ['risk', '分类不能代替流程。再“冷”的钱包，签名者看不懂自己签了什么，也会丢钱。']
])}

<h3>2.1 热钱包与冷钱包</h3>
<p><strong>热钱包（Hot Wallet）</strong>：私钥所在的设备连着互联网。手机 App、浏览器插件、服务器上的签名程序都属于热钱包。优点是快，可以全自动签名；缺点是只要设备被入侵，私钥就可能被读走。</p>
<p><strong>冷钱包（Cold Wallet）</strong>：私钥生成和签名都在一台从不联网的设备里完成。交易数据通过二维码、U 盘或 USB 线（只传数据）进出。优点是远程攻击者拿不到私钥；缺点是每次签名都需要人工操作，速度慢。</p>
<p>企业常用第三层：<strong>温钱包（Warm Wallet）</strong>。私钥离线或分片保管，但签名流程半自动，例如多签或 MPC 加人工审批。</p>

<h3>2.2 托管、非托管、半托管</h3>
${tbl(['类型', '私钥在谁手里', '用户丢了密码', '机构跑路或被盗', '典型产品'], [
  ['托管（Custodial）', '机构', '机构可以帮你找回账户', '用户资产受损', '交易所账户、Coinbase Custody、BitGo 托管'],
  ['非托管（Non-custodial）', '用户', '没有助记词就永久丢失', '不影响用户', 'MetaMask、Ledger、Trust Wallet'],
  ['半托管（Semi-custodial）', '用户和机构各持一部分（分片或多签的一把钥匙）', '可以凭机构那一份 + 备份恢复', '机构单方面无法动钱', 'MPC 钱包 App（2-of-3 分片）、带恢复钥匙的多签']
])}
<p>托管还是非托管，也决定了你是否会被视为需要牌照和 KYC 的服务商，见 <a href="#m11-1">M12.1 合规全景</a>。</p>
${call('info', `<p>交易所账户里的“余额”只是交易所数据库里的一行记录，不是你链上地址里的币。行话叫 <em>Not your keys, not your coins</em>（私钥不在你手里，币就不是你的）。2022 年 11 月 FTX 先暂停加密资产提币、随后申请破产，用户的账户余额无法提取，就是这个原因。${cite('CoinDesk：FTX 暂停所有加密资产提币', 'https://www.coindesk.com/business/2022/11/08/ftx-exchange-halts-all-crypto-withdrawals')}</p>`)}

<h3>2.3 软件钱包、硬件钱包、纸钱包</h3>
<ul>
<li><strong>软件钱包</strong>：私钥加密后存在手机或电脑的文件里，用户输入密码时解密到内存中签名。风险来自恶意软件、剪贴板劫持、假冒 App。</li>
<li><strong>硬件钱包（Hardware Wallet）</strong>：私钥存在专用芯片里。很多产品使用<strong>安全芯片（Secure Element，SE）</strong>，它能抵抗物理拆解和侧信道攻击。签名在芯片里完成，私钥从不离开设备。电脑只负责把“待签数据”送进去，再把“签名”拿回来，这叫<strong>离线签名</strong>。设备屏幕显示交易内容，用户按物理按键确认。</li>
<li><strong>纸钱包（Paper Wallet）/ 金属助记词板</strong>：把私钥或助记词写在纸上或刻在钢板上。它只是“备份介质”，不能签名。要花钱时必须把私钥导入某个软件，导入那一刻它就变成了热钱包。</li>
</ul>
${mm('硬件钱包离线签名的数据流', `
sequenceDiagram
  participant U as 用户
  participant APP as 电脑上的钱包软件
  participant HW as 硬件钱包安全芯片
  participant RPC as 区块链节点
  APP->>RPC: 查询 nonce、gas、余额
  APP->>APP: 构造未签名交易
  APP->>HW: 发送待签名交易（USB 或二维码）
  HW->>U: 屏幕显示收款地址和金额
  U->>HW: 按键确认
  HW->>HW: 芯片内用私钥签名
  HW-->>APP: 返回签名 v r s
  APP->>RPC: 广播已签名交易
`, [
  ['flow', '私钥只在安全芯片里出现。电脑上的软件只能拿到签名结果。'],
  ['risk', '如果设备屏幕只显示一串看不懂的十六进制数据（盲签，Blind Signing），用户等于在空白支票上签字。'],
  ['fail', '电脑软件被篡改时，它可以把收款地址换成攻击者地址。用户必须在硬件屏幕上核对地址，而不是在电脑屏幕上核对。'],
  ['key', '硬件钱包防的是“远程偷私钥”，不防“诱骗你签错交易”。']
])}

<h2>3. EOA 与智能合约钱包</h2>
<p>以太坊上有两种账户：</p>
<ul>
<li><strong>外部账户（EOA，Externally Owned Account）</strong>：由一把私钥控制。私钥签名 = 账户同意。规则写死在协议里：一个签名、按 nonce 顺序执行、用 ETH 付 Gas。</li>
<li><strong>智能合约钱包（Smart Contract Wallet）</strong>：账户本身是一个合约。“什么情况下允许转账”由合约代码决定，可以要求多个签名、设置每日限额、加时间锁、换掉丢失的密钥。</li>
</ul>
${tbl(['对比项', 'EOA', 'Safe 多签', 'ERC-4337 智能账户'], [
  ['控制方式', '1 把私钥', 'm-of-n 个所有者签名', '合约里的任意验证逻辑（单签、多签、Passkey、会话密钥）'],
  ['私钥丢失', '资产永久丢失', '剩余所有者 ≥ 门限即可换人', '可以设计社交恢复'],
  ['创建成本', '免费（离线生成）', '需要部署代理合约，付一次 Gas', '首次使用时部署，可由 Paymaster 代付'],
  ['Gas 支付', '必须持有原生币', '执行者付 Gas', 'Paymaster 可代付或用 ERC-20 付'],
  ['多链', '同一私钥在所有 EVM 链地址相同', '每条链单独部署', '每条链单独部署'],
  ['非 EVM 链', '各链有对应的单签账户', '不支持', '不支持']
])}
<p><strong>ERC-4337（账户抽象）</strong>：2023 年 3 月上线以太坊主网的标准，不修改共识层。用户签的不是交易，而是一个 <code>UserOperation</code>；打包者（Bundler）把多个 UserOperation 打包，提交给全链统一的 <code>EntryPoint</code> 合约，由它调用每个智能账户的验证函数。详细内容见 <a href="#m06-5">M08.8 账户抽象深入</a>。</p>
${call('deep', `<p><strong>EIP-7702</strong>：2025 年 5 月以太坊 Pectra 升级引入。${cite('Ethereum Foundation：Pectra 主网公告', 'https://blog.ethereum.org/2025/04/23/pectra-mainnet')}它允许 EOA 通过签名把自己的代码“委托”给一个合约实现，使 EOA 获得智能账户的能力（批量调用、代付 Gas）；委托会一直有效，直到被替换或清除。企业钱包要注意：签署一个恶意的 7702 授权，等于把账户控制权交出去。</p>`)}

<h2>4. 企业场景：谁用什么</h2>
<p>企业钱包不是选“一种”钱包，而是按资金用途组合多种钱包。下表是行业常见做法（示例，不同机构差异较大）。</p>
${tbl(['企业类型', '核心需求', '常见组合', '关键控制'], [
  ['中心化交易所', '每天上万笔充提，7×24 自动化', '充值地址：xpub 派生的 EOA；热钱包：MPC 或 HSM；冷钱包：离线多签或 HSM', '热钱包余额上限、提币风控、冷热调拨审批'],
  ['托管机构', '替客户保管大额资产，满足审计和监管', 'HSM（FIPS 140-2/140-3 认证）或 MPC，多地分布；客户独立子账户', '多人审批、职责分离、SOC 2 审计'],
  ['支付公司', '收款多、出款稳定，成本敏感', 'xpub 派生收款地址 + 定时归集；出款热钱包 MPC；常用稳定币', '归集 Gas 成本、出款白名单、KYT 检查'],
  ['项目方金库 / DAO', '金额大、频率低、要求透明', 'Safe 多签（签名者使用硬件钱包），配合时间锁和角色模块', '签名者分散、交易模拟、链上公示'],
  ['个人 / 小团队', '简单、自主', '硬件钱包 + 金属助记词备份；日常小额用软件钱包', '助记词离线备份，分开存放']
])}
<h3>4.1 选型决策图</h3>
${mm('企业钱包选型决策', `
flowchart TB
  Q1{"需要自动化签名吗？<br/>每天 > 50 笔"} -->|"是"| Q2{"需要支持<br/>非 EVM 链吗？"}
  Q1 -->|"否"| Q4{"金额大且需要<br/>链上透明吗？"}
  Q2 -->|"是"| MPC["MPC 热钱包<br/>多链通用"]
  Q2 -->|"否"| Q3{"有合规要求<br/>必须用认证硬件吗？"}
  Q3 -->|"是"| HSM["HSM / 云 KMS 签名"]
  Q3 -->|"否"| MPC2["MPC 或 HSM<br/>二选一"]
  Q4 -->|"是"| SAFE["Safe 多签<br/>+ 硬件钱包签名者"]
  Q4 -->|"否"| Q5{"愿意把私钥<br/>交给第三方吗？"}
  Q5 -->|"是"| CUST["合规托管机构"]
  Q5 -->|"否"| COLD["冷钱包<br/>硬件 + 离线备份"]
`, [
  ['flow', '先问“自动化程度”，再问“链的覆盖面”和“透明度要求”。'],
  ['key', '交易所和支付公司偏向 MPC/HSM（自动化 + 多链）；项目金库偏向 Safe（透明 + 低频）。'],
  ['limit', '这是起点而不是结论。真实选型还要看团队能力、预算、保险和监管要求。'],
  ['risk', '无论选哪种，签名前都要做交易解析和模拟。工具再好，也挡不住“签了看不懂的交易”。']
])}

<h3>4.2 算一算：热钱包该放多少钱（示例）</h3>
<p>一家交易所日均提币 1,200 万美元，峰值日是均值的 2.5 倍。热钱包每 4 小时从温钱包补充一次。</p>
${steps(['峰值日提币 = 1,200 万 × 2.5 = 3,000 万美元。', '每小时峰值提币 = 3,000 万 ÷ 24 = 125 万美元。', '一个补充周期（4 小时）需要 = 125 万 × 4 = 500 万美元。', '加 50% 安全余量：500 万 × 1.5 = 750 万美元。', '结论：热钱包目标余额约 750 万美元。若交易所总资产 5 亿美元，热钱包占比 = 750 ÷ 50,000 = 1.5%。被盗时最大损失被限制在 750 万美元以内。'])}

${tryit(`<p>① 打开 <a href="https://etherscan.io" target="_blank" rel="noopener">etherscan.io</a>，搜索任意一个你知道的交易所热钱包标签（例如在搜索框输入 “Binance”），查看它的地址类型：页面顶部写 “Address” 的是 EOA，写 “Contract” 的是合约。② 打开 <a href="https://app.safe.global" target="_blank" rel="noopener">app.safe.global</a>，不要连接钱包，只阅读创建流程，记下它要求你设置的两个参数（所有者列表、门限）。③ 预期结果：你能说出“交易所热钱包通常是 EOA（背后是 MPC 或 HSM），DAO 金库通常是 Safe 合约”。</p>`)}

${mistakes([
  ['硬件钱包里存着币', '币在链上。硬件钱包里只存私钥，设备丢了，用助记词在新设备上恢复，币还在。'],
  ['冷钱包绝对安全', '冷钱包防远程窃取私钥，但防不了“签名者被骗签错交易”。2025 年 2 月 Bybit 冷钱包被盗约 15 亿美元就是这个原因。' + cite('FBI 公告：朝鲜对 Bybit 约 15 亿美元盗窃负责', 'https://www.ic3.gov/PSA/2025/PSA250226')],
  ['交易所账户就是我的钱包', '交易所账户是托管账户，余额是交易所的负债记录。交易所破产或冻结时，你无法自行动用。'],
  ['智能合约钱包一定比 EOA 安全', '合约钱包增加了规则能力，也增加了合约漏洞和升级风险。安全取决于实现质量和运营流程。'],
  ['纸钱包是一种可以长期使用的钱包', '纸钱包只是备份。每次花钱都要把私钥导入软件，导入后应视为已暴露，剩余资金要转到新地址。']
])}
${recap([
  '钱包只保管私钥并签名，资产记录在链上。',
  '冷/热看攻击面，托管/非托管看信任谁，两个维度独立。',
  'EOA 由一把私钥控制；合约钱包（Safe、ERC-4337）把规则写进代码，可以多签、限额、恢复。',
  '企业按资金用途组合：充值地址 + 热钱包（MPC/HSM）+ 温钱包 + 冷钱包（多签/HSM）。',
  '热钱包余额要按峰值提币速度和补充周期计算，用来限制最大损失。'
])}
${quiz([
  { q: '一个 MPC 钱包 App：用户手机持有 1 个分片，服务商持有 1 个分片，用户另有 1 个云备份分片，任意 2 个可签名。它属于哪一类？', o: ['托管钱包', '半托管钱包', '纸钱包', '冷钱包'], a: 1, why: '用户和机构各持一部分，机构单方面不能动钱，用户也能凭两份分片恢复，这是半托管。它在线签名，所以也不是冷钱包。' },
  { q: '下面哪一项是智能合约钱包相对 EOA 的真实优势？', o: ['不需要任何 Gas', '在所有区块链上地址都相同', '可以在丢失一把密钥后通过规则更换密钥', '不可能被盗'], a: 2, why: '合约钱包可以写入恢复规则。它仍然需要 Gas（可以由他人代付），每条链要单独部署，而且也有被盗风险。' },
  { q: 'DAO 金库每月只有几笔大额支出，社区要求能公开查看谁批准了哪笔支出。最合适的方案是？', o: ['Safe 多签 + 硬件钱包签名者', '服务器上的单私钥热钱包', '交易所账户', '纸钱包'], a: 0, why: 'Safe 的所有者、门限、每笔交易的签名都在链上可查，适合低频大额且要求透明的场景。' },
  { q: '用户在电脑上看到收款地址正确，于是在硬件钱包上直接按了确认，没看硬件屏幕。这样做的风险是？', o: ['没有风险，硬件钱包会自动纠错', '电脑软件可能被篡改，真实地址只显示在硬件屏幕上', '硬件钱包会泄露私钥', '交易会被链拒绝'], a: 1, why: '硬件钱包的安全假设是“电脑不可信”。只有硬件屏幕上显示的内容才是芯片真正要签的内容。' }
])}
${exercises([["（示例）一家交易所日均提币 800 万美元，峰值日是均值的 3 倍。热钱包每 6 小时从温钱包补充一次，安全余量 50%。热钱包目标余额是多少？若总资产 3 亿美元，热钱包占比多少？", "<p>峰值日提币 = 800 万 × 3 = 2,400 万美元。每小时峰值 = 2,400 万 ÷ 24 = 100 万美元。一个补充周期需要 100 万 × 6 = 600 万美元。加 50% 余量：600 万 × 1.5 = <strong>900 万美元</strong>。占比 = 900 ÷ 30,000 = <strong>3%</strong>，被盗时最大损失被限制在 900 万美元以内。</p>"], ["一个团队说：“我们的金库用硬件钱包签名，所以是冷钱包，绝对安全。”这句话错在哪里？", "<p>冷热只回答攻击面大小，不回答签名者签了什么。硬件钱包防的是远程偷私钥，不防诱骗你签错交易。签名请求来自联网电脑，电脑软件可能被篡改。如果设备只显示十六进制数据（盲签），签名者等于在空白支票上签字。Bybit 冷钱包被盗约 15 亿美元就是这种情况。</p>"], ["用四个维度给“支付公司的出款热钱包”分类，并说出它最需要的关键控制。", "<p>按文中常见组合：出款热钱包用 MPC，属于<strong>热</strong>（自动签名、设备联网）、由企业自己控制密钥、密钥材料在软件或专用设备里、链上表现为 <strong>EOA</strong>。关键控制是出款白名单、KYT 检查和热钱包余额上限。收款侧用 xpub 派生地址并定时归集。</p>"]])}
${checklist(["能用联网、控制权、载体、账户类型四个维度，给任意一个钱包产品分类。", "能说清托管、非托管、半托管三者在“用户丢密码”和“机构被盗”时的不同后果。", "能列出 EOA、Safe 多签、ERC-4337 智能账户在私钥丢失、Gas 支付、多链上的区别。", "能按峰值提币速度、补充周期和安全余量，算出热钱包目标余额和占比。", "在 Etherscan 上查过一个交易所热钱包，判断出它是 EOA 还是合约。"])}
${terms([
  ['热钱包', 'Hot Wallet', '私钥所在设备联网的钱包，速度快、攻击面大'],
  ['冷钱包', 'Cold Wallet', '私钥生成和签名都在不联网设备上完成的钱包'],
  ['温钱包', 'Warm Wallet', '介于冷热之间，离线或分片保管、半自动签名的钱包'],
  ['托管', 'Custodial', '由机构持有私钥，用户只持有账户'],
  ['半托管', 'Semi-custodial', '用户和机构各持部分密钥材料，任何一方单独不能动钱'],
  ['安全芯片', 'Secure Element', '能抵抗物理攻击、在芯片内完成签名的专用芯片'],
  ['外部账户', 'EOA, Externally Owned Account', '由一把私钥直接控制的以太坊账户'],
  ['智能合约钱包', 'Smart Contract Wallet', '由合约代码决定授权规则的账户'],
  ['盲签', 'Blind Signing', '设备无法解析交易内容，用户在看不懂的情况下签名']
])}
` });

CUR = 'm03-2';
addCh({ id: 'm03-2', nav: '助记词与 HD 钱包', title: 'M08.2 助记词与 HD 钱包：从 12 个单词到无数个地址', desc: '一步步拆解 BIP-39/32/44：熵、校验位、种子、硬化派生、xpub。', html: `
<h1>M08.2 助记词与 HD 钱包：从 12 个单词到无数个地址</h1>
${meta(['手算 BIP-39 校验位，说清 12 个单词如何编码 128 位熵。', '解释 BIP-32 主私钥、链码、普通派生与硬化派生的区别，以及 xpub 泄露风险。', '读懂 BIP-44 路径每一层，设计“服务器只持 xpub”的充值地址生成架构。'], '<a href="#m03-1">M08.1 钱包分类全景</a>、<a href="#m00-2">M00.2 哈希函数</a>', ['hdpath'])}
${beginner(`<p><strong>熵（Entropy）</strong>：一串真随机的二进制位。熵越多，越难被猜中。</p>
<p><strong>哈希（Hash）</strong>：把任意数据变成固定长度“指纹”的函数，例如 SHA-256 输出 256 位。</p>
<p><strong>HMAC</strong>：带密钥的哈希。同样的数据，用不同密钥算出不同结果。</p>
<p><strong>派生（Derivation）</strong>：按固定算法，从一个密钥算出另一个密钥。算法确定，所以结果可重现。</p>
<p><strong>位（bit）</strong>：二进制的一位，0 或 1。8 位 = 1 字节。</p>`)}

<h2>1. 一句话理解</h2>
${one('HD 钱包用一个随机种子，按“路径”算出一棵密钥树。备份 12 个单词，就备份了整棵树里所有地址的私钥。')}
${call('analogy', `<p>把种子想成一把“万能母钥匙”，把路径想成门牌号：<code>m/44′/60′/0′/0/7</code> 就是“以太坊小区 0 号楼 0 单元 7 号房”。锁匠（派生算法）只要拿到母钥匙和门牌号，就能配出这间房的钥匙，配多少次结果都一样。</p>
<p>类比的局限：现实中丢了一把房门钥匙，母钥匙仍安全；在 HD 钱包的“普通派生”里，一把子钥匙加上公开的楼栋图纸（xpub），可以反推出母钥匙。第 4 节会讲为什么。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m03-2"><div class="mmd-title"><span>一图看懂：一棵 HD 钱包派生树</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 240" role="img" aria-label="从种子到以太坊地址的 BIP-44 派生路径"><rect x="30" y="95" width="84" height="54" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="72" y="119" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">种子 seed</text><text x="72" y="138" font-size="11" text-anchor="middle" fill="var(--ink-2)"></text><rect x="150" y="95" width="84" height="54" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="192" y="119" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700" font-family="ui-monospace,Menlo,monospace">m</text><text x="192" y="138" font-size="11" text-anchor="middle" fill="var(--ink-2)">主私钥</text><line x1="114" y1="122" x2="148" y2="122" stroke="var(--risk)" stroke-width="2"/><path d="M148.0 122.0 L140.8 125.5 L140.8 118.5 z" fill="var(--risk)"/><rect x="250" y="95" width="84" height="54" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="292" y="119" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700" font-family="ui-monospace,Menlo,monospace">44'</text><text x="292" y="138" font-size="11" text-anchor="middle" fill="var(--ink-2)">用途</text><line x1="234" y1="122" x2="248" y2="122" stroke="var(--risk)" stroke-width="2"/><path d="M248.0 122.0 L240.8 125.5 L240.8 118.5 z" fill="var(--risk)"/><rect x="350" y="95" width="84" height="54" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="392" y="119" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700" font-family="ui-monospace,Menlo,monospace">60'</text><text x="392" y="138" font-size="11" text-anchor="middle" fill="var(--ink-2)">以太坊</text><line x1="334" y1="122" x2="348" y2="122" stroke="var(--risk)" stroke-width="2"/><path d="M348.0 122.0 L340.8 125.5 L340.8 118.5 z" fill="var(--risk)"/><rect x="450" y="95" width="84" height="54" rx="8" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="492" y="119" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700" font-family="ui-monospace,Menlo,monospace">0'</text><text x="492" y="138" font-size="11" text-anchor="middle" fill="var(--ink-2)">账户</text><line x1="434" y1="122" x2="448" y2="122" stroke="var(--risk)" stroke-width="2"/><path d="M448.0 122.0 L440.8 125.5 L440.8 118.5 z" fill="var(--risk)"/><rect x="560" y="20" width="190" height="210" rx="12" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5" stroke-dasharray="6 4"/><text x="655" y="42" font-size="12" text-anchor="middle" fill="var(--info)" font-weight="700">xpub 能派生的范围</text><rect x="574" y="95" width="70" height="54" rx="8" fill="var(--paper)" stroke="var(--info)" stroke-width="1.5"/><text x="609" y="119" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700" font-family="ui-monospace,Menlo,monospace">0</text><text x="609" y="138" font-size="11" text-anchor="middle" fill="var(--ink-2)">收款链</text><line x1="534" y1="122" x2="572" y2="122" stroke="var(--info)" stroke-width="2"/><path d="M572.0 122.0 L564.8 125.5 L564.8 118.5 z" fill="var(--info)"/><rect x="668" y="42" width="72" height="36" rx="8" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="704" y="65" font-size="12" text-anchor="middle" fill="var(--ink)" font-weight="700">地址 0</text><line x1="644" y1="122" x2="666" y2="60" stroke="var(--ok)" stroke-width="1.5"/><path d="M666.0 60.0 L666.9 68.0 L660.3 65.6 z" fill="var(--ok)"/><rect x="668" y="104" width="72" height="36" rx="8" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="704" y="127" font-size="12" text-anchor="middle" fill="var(--ink)" font-weight="700">地址 1</text><line x1="644" y1="122" x2="666" y2="122" stroke="var(--ok)" stroke-width="1.5"/><path d="M666.0 122.0 L658.8 125.5 L658.8 118.5 z" fill="var(--ok)"/><rect x="668" y="166" width="72" height="36" rx="8" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="704" y="189" font-size="12" text-anchor="middle" fill="var(--ink)" font-weight="700">地址 2</text><line x1="644" y1="122" x2="666" y2="184" stroke="var(--ok)" stroke-width="1.5"/><path d="M666.0 184.0 L660.3 178.4 L666.9 176.0 z" fill="var(--ok)"/><text x="270" y="186" font-size="12" text-anchor="middle" fill="var(--risk)">带 ' 的是硬化派生：必须有私钥才能往下算</text><text x="270" y="206" font-size="12" text-anchor="middle" fill="var(--ink-2)">m/44'/60'/0'/0/0 就是这条路径上的第一个地址</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>从种子开始，每一层用上一层的密钥和序号算出下一层，最后得到无数个地址。</span></li><li><span class="chip key">关键</span><span>红色是硬化派生，需要私钥；蓝框内是普通派生，只要账户层的 xpub 就能算出所有收款地址。</span></li><li><span class="chip risk">风险</span><span>xpub 加上任意一个子私钥泄露，就能反推出账户层私钥。所以子私钥永远不离开签名服务。</span></li></ul></figcaption></figure>

<h2>2. BIP-39：从熵到助记词，再到种子</h2>
${mm('BIP-39 全流程', `
flowchart LR
  R["随机数生成器"] --> E["熵 ENT<br/>128 位"]
  E -->|"SHA-256 取前 ENT/32 位"| CS["校验位 CS<br/>4 位"]
  E --> J["拼接 132 位"]
  CS --> J
  J -->|"每 11 位一组"| W["12 个索引<br/>0–2047"]
  W -->|"查 2048 词表"| M["12 个单词"]
  M -->|"PBKDF2-HMAC-SHA512<br/>2048 轮"| S["种子 Seed<br/>512 位"]
  P["可选密码 passphrase"] -->|"盐 = mnemonic + 密码"| S
`, [
  ['flow', '熵 → 加校验位 → 切成 11 位一组 → 查表得单词 → 单词 + 密码 → 种子。'],
  ['key', '2048 = 2 的 11 次方，所以每个单词正好携带 11 位信息。'],
  ['fail', '抄错一个单词，校验位大概率对不上，钱包会提示“助记词无效”。但校验位只有 4 位，有 1/16 概率错误的助记词也能通过校验。'],
  ['risk', '密码（passphrase）不同，种子就完全不同，且没有“密码错误”提示，钱包只会显示一个空钱包。忘记密码 = 资产丢失。']
])}
${tbl(['熵长度 ENT', '校验位 CS = ENT/32', '总位数', '单词数 = 总位数/11'], [
  ['128', '4', '132', '12'],
  ['160', '5', '165', '15'],
  ['192', '6', '198', '18'],
  ['224', '7', '231', '21'],
  ['256', '8', '264', '24']
])}

<h3>2.1 算一算：校验位怎么得到（示例）</h3>
<p>用 BIP-39 官方测试向量里最简单的一个：熵是 16 个全零字节（128 位全 0）。</p>
${steps([
  '熵 = <code>00000000 00000000 … 00000000</code>（128 个 0）。',
  '计算 SHA-256(熵) = <code>374708ff…</code>。第一个十六进制字符是 <code>3</code>，二进制为 <code>0011</code>。',
  '128 ÷ 32 = 4，取哈希的前 4 位 <code>0011</code> 作为校验位。',
  '拼接：128 个 0 + <code>0011</code> = 132 位。',
  '每 11 位一组，共 12 组。前 11 组全是 0，索引 = 0，对应词表第 0 个词 <code>abandon</code>。',
  '第 12 组 = 7 个 0 + <code>0011</code> = <code>00000000011</code> = 十进制 3，对应词表第 3 个词 <code>about</code>（0 abandon，1 ability，2 able，3 about）。',
  '结果：<code>abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about</code>。'
])}
<p>这组助记词公开在全世界的测试代码里，<strong>任何人都知道它的私钥</strong>。它派生出的以太坊地址 <code>m/44′/60′/0′/0/0</code> 是 <code>0x9858EfFD232B4033E47d90003D41EC34EcaEda94</code>。只在测试中使用，永远不要往里转真钱。</p>

<h3>2.2 从助记词到种子</h3>
<p>种子 = PBKDF2(口令 = 助记词 UTF-8 NFKD 规范化后的字符串，盐 = <code>"mnemonic" + passphrase</code>，迭代 2048 次，HMAC-SHA512，输出 64 字节)。迭代 2048 次的目的：让暴力猜测每次尝试都更慢。</p>
${call('warn', `<p><strong>助记词强度来自熵，不来自单词。</strong>自己“想” 12 个单词、用掷骰子以外的“随机”方法、用网页在线生成，都可能导致熵不足或泄露。128 位真随机熵约有 3.4 × 10³⁸ 种可能，无法暴力破解；人脑挑选的单词组合远远达不到这个数量。</p>`)}

<h2>3. BIP-32：主私钥、链码与子密钥派生</h2>
<p>BIP-32 定义了“分层确定性钱包”（HD Wallet）。第一步从种子得到主密钥：</p>
${steps([
  'I = HMAC-SHA512(Key = <code>"Bitcoin seed"</code>, Data = 种子)，输出 512 位。',
  '左 256 位 I<sub>L</sub> = <strong>主私钥</strong> m。',
  '右 256 位 I<sub>R</sub> = <strong>主链码（Chain Code）</strong>。链码是额外的 256 位熵，参与每一次派生，防止只凭公钥就能推出所有子公钥。'
])}
<p><strong>扩展私钥 xprv</strong> = (私钥, 链码)；<strong>扩展公钥 xpub</strong> = (公钥, 链码)。两者都用 Base58Check 编码，主网分别以 <code>xprv</code>、<code>xpub</code> 开头。</p>

<h3>3.1 普通派生与硬化派生</h3>
<p>每个子密钥有一个 32 位索引 i。i &lt; 2³¹ 是<strong>普通派生（Normal）</strong>；i ≥ 2³¹ 是<strong>硬化派生（Hardened）</strong>，写成 <code>i′</code> 或 <code>i'</code>，例如 <code>44′</code> = 2³¹ + 44。</p>
${mm('普通派生 vs 硬化派生的输入', `
flowchart TB
  subgraph N["普通派生 i 小于 2^31"]
    NP["父公钥 K"] --> NH["HMAC-SHA512<br/>Key = 父链码"]
    NI["索引 i"] --> NH
    NH --> NL["左 256 位 IL"]
    NL -->|"子私钥 = 父私钥 + IL"| NC["子私钥"]
    NL -->|"子公钥 = 父公钥 + IL×G"| NCP["子公钥<br/>只用 xpub 就能算"]
  end
  subgraph HD["硬化派生 i 大于等于 2^31"]
    HP["父私钥 k"] --> HH["HMAC-SHA512<br/>Key = 父链码"]
    HI["索引 i"] --> HH
    HH --> HL["左 256 位 IL"]
    HL -->|"子私钥 = 父私钥 + IL"| HC["子私钥<br/>必须有父私钥"]
  end
`, [
  ['flow', '两种派生的区别只在 HMAC 的输入：普通派生输入父公钥，硬化派生输入父私钥。'],
  ['key', '普通派生的好处：只持有 xpub 的服务器也能算出所有子公钥和地址。这是交易所充值地址方案的基础。'],
  ['risk', '普通派生下，IL 只依赖公开信息（xpub + i）。攻击者拿到 xpub 和任意一个子私钥，计算 父私钥 = 子私钥 − IL，整棵子树失守。'],
  ['limit', '硬化派生的子公钥不能从 xpub 算出。所以 xpub 只能放在“硬化层”之下。']
])}
${tbl(['对比项', '普通派生', '硬化派生'], [
  ['索引范围', '0 到 2³¹−1', '2³¹ 到 2³²−1（写作 0′、1′…）'],
  ['HMAC 输入', '父公钥 + 索引', '0x00 + 父私钥 + 索引'],
  ['只有 xpub 能否派生子公钥', '能', '不能'],
  ['xpub + 子私钥泄露', '可以反推父私钥', '不能反推'],
  ['典型用途', '路径最后两层（change、index）', '路径前三层（purpose、coin_type、account）']
])}

<h2>4. BIP-44：路径每一层的含义</h2>
<p>BIP-44 规定了一条 5 层路径：<code>m / purpose′ / coin_type′ / account′ / change / address_index</code>。</p>
${tbl(['层', '示例值', '是否硬化', '含义'], [
  ['purpose', '44′', '是', '固定为 44，表示遵循 BIP-44 结构。比特币其他地址类型用 49′、84′、86′'],
  ['coin_type', '0′ / 60′ / 195′ / 501′', '是', '币种编号，由 SLIP-44 登记。BTC = 0，测试网 = 1，ETH = 60，TRON = 195，SOL = 501'],
  ['account', '0′', '是', '账户序号。企业可以按业务线或客户划分 account'],
  ['change', '0 / 1', '否', '0 = 外部链（收款地址），1 = 内部链（比特币找零地址）。以太坊通常只用 0'],
  ['address_index', '0, 1, 2 …', '否', '地址序号，从 0 递增']
])}
${call('info', `<p>不同钱包对同一助记词可能用不同路径。MetaMask 用 <code>m/44′/60′/0′/0/i</code>（变 index）；Ledger Live 的以太坊账户用 <code>m/44′/60′/i′/0/0</code>（变 account）。Solana 使用 Ed25519 曲线，按 SLIP-0010 只支持硬化派生，常见路径是 <code>m/44′/501′/i′/0′</code>。导入助记词后“余额为 0”，多数是路径不同，不是币丢了。</p>`)}

<h3>4.1 比特币的 BIP-49/84/86</h3>
${tbl(['标准', '路径', '地址类型', '地址前缀', '扩展公钥前缀'], [
  ['BIP-44', 'm/44′/0′/0′', 'P2PKH 传统地址', '1…', 'xpub'],
  ['BIP-49', 'm/49′/0′/0′', 'P2SH 包裹的隔离见证 P2SH-P2WPKH', '3…', 'ypub（SLIP-132）'],
  ['BIP-84', 'm/84′/0′/0′', '原生隔离见证 P2WPKH', 'bc1q…', 'zpub（SLIP-132）'],
  ['BIP-86', 'm/86′/0′/0′', 'Taproot 单签 P2TR', 'bc1p…', 'xpub（无专用前缀）']
])}
<p>新系统接入比特币，优先使用 BIP-84 或 BIP-86：交易体积更小，手续费更低。</p>

<h3>4.2 动手调路径</h3>
<p>先选“ETH”，把 index 从 0 拖到 5，观察地址变化；再打开“只持有 xpub 的服务器”开关，看它能做什么、不能做什么；最后读底部的风险说明。</p>
${lab('hdpath')}

<h2>5. 工程实战：交易所用 xpub 生成充值地址</h2>
${mm('xpub 充值地址架构', `
flowchart LR
  subgraph OFF["离线环境 冷"]
    MN["助记词 / 种子<br/>保险柜 + 分片备份"] --> AX["派生 m/44′/60′/0′<br/>导出账户 xpub"]
  end
  AX -->|"只导出 xpub"| ADDR["地址服务<br/>在线"]
  ADDR -->|"派生 0/i"| DB["地址表<br/>user_id ↔ index ↔ address"]
  DB --> SCAN["充值扫描器<br/>监听这些地址"]
  SCAN --> SWEEP["归集服务<br/>需要签名"]
  SWEEP -->|"签名请求"| SIGN["签名服务<br/>HSM / MPC 持有私钥"]
`, [
  ['flow', '私钥留在离线环境或签名服务内。在线的地址服务只有 xpub，它负责给每个用户分配新地址。'],
  ['key', '地址服务被攻破时，攻击者只能看到地址列表（隐私泄露），不能转走资金。'],
  ['risk', '如果签名服务把某个充值地址的子私钥导出给了其他系统，而地址服务的 xpub 也泄露，攻击者可推出账户私钥，所有充值地址失守。子私钥永远不能离开签名服务。'],
  ['fail', 'index 分配必须持久化且唯一。两个用户拿到同一个 index，充值会记错账。用数据库序列或唯一约束保证。'],
  ['limit', 'xpub 本身也是隐私数据：拿到它就能关联你所有地址，看到全部余额。']
])}
<h3>5.1 Go 代码：生成助记词、派生地址、只用 xpub 派生</h3>
${code('GO', `
package main

import (
    "fmt"
    "log"

    "github.com/btcsuite/btcd/btcutil/hdkeychain"
    "github.com/btcsuite/btcd/chaincfg"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/tyler-smith/go-bip39"
)

const H = hdkeychain.HardenedKeyStart // 2^31

func main() {
    // 1. 生成 128 位熵 → 12 个单词（生产环境只在离线机器上做这一步）
    entropy, _ := bip39.NewEntropy(128)
    mnemonic, _ := bip39.NewMnemonic(entropy)
    if !bip39.IsMnemonicValid(mnemonic) {
        log.Fatal("助记词校验失败")
    }

    // 2. 助记词 + 可选密码 → 64 字节种子
    seed := bip39.NewSeed(mnemonic, "") // 第二个参数是 passphrase

    // 3. 种子 → 主扩展私钥（HMAC-SHA512, key = "Bitcoin seed"）
    master, err := hdkeychain.NewMaster(seed, &chaincfg.MainNetParams)
    if err != nil {
        log.Fatal(err)
    }

    // 4. 硬化派生到账户层 m/44'/60'/0'
    acct := master
    for _, i := range []uint32{H + 44, H + 60, H + 0} {
        if acct, err = acct.Derive(i); err != nil {
            log.Fatal(err)
        }
    }

    // 5. 导出账户 xpub：交给在线地址服务
    acctPub, _ := acct.Neuter()
    xpub := acctPub.String()
    fmt.Println("account xpub:", xpub)

    // 6. 在线服务：只用 xpub 派生 m/44'/60'/0'/0/i 的地址
    pubOnly, _ := hdkeychain.NewKeyFromString(xpub)
    external, _ := pubOnly.Derive(0) // change = 0，普通派生
    for i := uint32(0); i < 3; i++ {
        child, _ := external.Derive(i)
        pk, _ := child.ECPubKey()
        addr := crypto.PubkeyToAddress(*pk.ToECDSA())
        fmt.Printf("m/44'/60'/0'/0/%d  %s\\n", i, addr.Hex())
    }

    // 7. 对比：如果对 xpub 做硬化派生，会返回错误
    if _, err := pubOnly.Derive(H + 1); err != nil {
        fmt.Println("xpub 不能做硬化派生:", err)
    }
}
`)}
<p>说明：<code>hdkeychain</code> 在 btcutil v1.1 起把旧方法 <code>Child</code> 改名为 <code>Derive</code>。<code>ECPubKey()</code> 返回 btcec v2 公钥，用 <code>ToECDSA()</code> 转成 Go 标准库类型，再交给 go-ethereum 计算地址（Keccak-256 后取 20 字节）。</p>

<h3>5.2 地址表设计（示例）</h3>
${code('SQL', `
-- PostgreSQL：每条链、每个账户 xpub 下的 index 唯一
CREATE TABLE deposit_address (
  id            BIGSERIAL PRIMARY KEY,
  chain         TEXT    NOT NULL,          -- eth / btc / tron
  xpub_id       INT     NOT NULL,          -- 指向 xpub 配置表，不直接存 xpub 明文
  path_index    INT     NOT NULL,          -- address_index
  address       TEXT    NOT NULL,
  user_id       BIGINT  NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chain, xpub_id, path_index),
  UNIQUE (chain, address)
);
`)}
${call('warn', `<p><strong>间隙限制（Gap Limit）</strong>：BIP-44 建议钱包恢复时，连续 20 个未使用地址后就停止扫描。交易所一次预生成上万个地址，用普通钱包软件恢复时会“看不到”后面的资金。企业系统必须自己记录已分配的最大 index，恢复时按记录扫描。</p>`)}

${tryit(`<p>① 下载 Ian Coleman 的 BIP39 工具网页（github.com/iancoleman/bip39 的 Releases 里有单文件 <code>bip39-standalone.html</code>），<strong>断网后</strong>在浏览器打开。② 粘贴测试助记词 <code>abandon</code> ×11 + <code>about</code>，币种选 ETH。③ 预期结果：Derived Addresses 表第一行路径 <code>m/44'/60'/0'/0/0</code>，地址 <code>0x9858EfFD232B4033E47d90003D41EC34EcaEda94</code>。④ 在 BIP39 Passphrase 输入任意字符，观察所有地址全部改变。注意：永远不要在联网网页上输入真实助记词。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['熵来自硬件随机数或 HSM', '弱随机数导致私钥可预测', '审查生成代码与设备；禁止使用 math/rand'],
  ['种子生成在离线环境完成', '在线生成可能被恶意软件截获', '生成机器无网卡或已物理断网，有操作录像'],
  ['在线服务只持有账户层 xpub', '地址服务被攻破也不会丢钱', '代码与配置中搜索不到 xprv 或助记词'],
  ['子私钥从不导出签名服务', '防止“xpub + 子私钥”反推', '签名服务只提供 Sign 接口，没有 Export 接口'],
  ['path_index 唯一且持久化', '防止两个用户共享地址', '数据库唯一约束 + 并发压测'],
  ['助记词分片备份并异地存放', '单点丢失或被盗', '定期演练用备份恢复，并比对 xpub']
])}
${mistakes([
  ['助记词的单词是随便选的', '单词由熵决定，最后一个单词含校验位。自己挑选的单词组合多数无法通过校验，且熵不足。'],
  ['加了 passphrase 输错会提示错误', '任何 passphrase 都能生成一个有效种子。输错只会打开一个空钱包，没有任何提示。'],
  ['xpub 是公钥，可以随便公开', 'xpub 会暴露全部地址和余额；配合任意一个非硬化子私钥还能推出父私钥。'],
  ['同一助记词在不同钱包里地址一样', '只有派生路径相同时才一样。不同钱包的默认路径可能不同。'],
  ['HD 钱包每个地址都要单独备份', '只需备份助记词（和 passphrase）。所有地址都可以重新派生。']
])}
${recap([
  'BIP-39：128 位熵 + 4 位校验 = 132 位 = 12 个单词；单词 + passphrase 经 PBKDF2 得到 512 位种子。',
  'BIP-32：种子经 HMAC-SHA512 得到主私钥和链码；子密钥按索引派生，≥ 2³¹ 为硬化派生。',
  '普通派生允许“只用 xpub 生成地址”；代价是 xpub + 子私钥可推出父私钥。',
  'BIP-44 路径 m/purpose′/coin′/account′/change/index，币种号由 SLIP-44 登记。',
  '交易所架构：离线派生账户 xpub，在线服务用 xpub 分配充值地址，签名服务独立持有私钥。'
])}
${quiz([
  { q: '256 位熵对应多少个助记词单词？', o: ['12', '18', '24', '32'], a: 2, why: '校验位 = 256/32 = 8 位，总共 264 位，264 ÷ 11 = 24 个单词。' },
  { q: '攻击者拿到了账户层 xpub（m/44′/60′/0′ 的扩展公钥）和地址 m/44′/60′/0′/0/5 的私钥。他能做什么？', o: ['什么都做不了', '只能动用第 5 个地址', '可以推出 m/44′/60′/0′/0 的私钥，进而控制整个外部链的所有地址', '可以推出主私钥 m'], a: 2, why: 'change 层和 index 层是普通派生，可以逐层反推到 m/44′/60′/0′/0 甚至 account 层私钥。但 account 层以上是硬化派生，推不到主私钥 m。' },
  { q: '为什么 BIP-44 路径的前三层使用硬化派生？', o: ['硬化派生速度更快', '把可能泄露的风险隔离在账户层以下，单个账户失守不影响其他币种和账户', '硬化派生生成的地址更短', '比特币协议强制要求'], a: 1, why: '硬化派生切断了“公钥 + 子私钥 → 父私钥”的推导链。即使某个账户整体失守，也推不到其他 account 或 coin_type。' },
  { q: '用户把同一组助记词导入另一个钱包，余额显示为 0。最可能的原因是？', o: ['币被盗了', '两个钱包使用了不同的派生路径', '助记词过期了', '链上数据丢失'], a: 1, why: '不同钱包的默认路径可能不同（例如变 index 还是变 account）。切换路径或手动指定路径，通常就能找回地址。' },
  { q: '比特币原生隔离见证地址（bc1q 开头）对应哪个标准的路径？', o: ['BIP-44', 'BIP-49', 'BIP-86', 'BIP-84'], a: 3, why: 'BIP-84 定义 m/84′/0′/0′ 用于 P2WPKH 原生隔离见证。BIP-49 是 3 开头的嵌套隔离见证，BIP-86 是 bc1p 开头的 Taproot。' }
])}
${exercises([["（示例）熵长度分别为 160 位和 192 位时，校验位有几位？总共多少位？对应多少个单词？", "<p>校验位 = ENT ÷ 32。160 位：校验位 5 位，总位数 165，单词数 165 ÷ 11 = <strong>15</strong>。192 位：校验位 6 位，总位数 198，单词数 198 ÷ 11 = <strong>18</strong>。每个单词携带 11 位，因为词表有 2048 = 2 的 11 次方个词。</p>"], ["地址服务只持有账户层 xpub。签名服务某天把一个充值地址的子私钥导出给了运维脚本，脚本被泄露，xpub 也被泄露。会发生什么？怎样从设计上避免？", "<p>change 层和 index 层是普通派生，IL 只依赖 xpub 和索引。攻击者算出 父私钥 = 子私钥 − IL，可以逐层推到账户层私钥，所有充值地址失守。硬化层以上推不到主私钥 m。避免方法：子私钥永远不离开签名服务，签名服务只提供 Sign 接口，没有 Export 接口。</p>"], ["交易所预生成了 5 万个充值地址，后来想用普通钱包软件导入助记词核对余额，却发现大部分资金“不见了”。原因是什么？企业系统该怎么做？", "<p>原因是间隙限制（Gap Limit）：钱包恢复时遇到连续 20 个未使用地址就停止扫描，后面的地址不会被派生。资金还在链上，只是没被扫描到。企业系统要持久化已分配的最大 path_index，恢复时按记录派生和扫描，而不是依赖普通钱包的默认行为。</p>"]])}
${checklist(["能从熵长度算出校验位、总位数和单词数，并手算全零熵得到 abandon ×11 + about。", "能说清普通派生与硬化派生在 HMAC 输入上的区别，以及 xpub + 子私钥泄露的后果。", "能写出 BIP-44 路径五层的含义，并说出 BTC、ETH、TRON、SOL 的 coin_type。", "能设计一张充值地址表，用唯一约束保证 index 和地址不被重复分配。", "在断网环境下用测试助记词派生过 m/44'/60'/0'/0/0，并观察 passphrase 改变后地址全部变化。"])}
${terms([
  ['熵', 'Entropy', '生成助记词的真随机二进制数据，长度 128–256 位'],
  ['BIP-39', 'Mnemonic Code', '把熵编码成单词并派生种子的标准'],
  ['种子', 'Seed', '助记词经 PBKDF2 得到的 512 位数据，是 HD 钱包的根'],
  ['链码', 'Chain Code', '与密钥配对、参与派生的 256 位附加熵'],
  ['扩展公钥', 'xpub, Extended Public Key', '公钥 + 链码，可派生非硬化子公钥'],
  ['扩展私钥', 'xprv, Extended Private Key', '私钥 + 链码，可派生全部子私钥'],
  ['硬化派生', 'Hardened Derivation', '索引 ≥ 2³¹、需要父私钥才能进行的派生'],
  ['派生路径', 'Derivation Path', '描述密钥在 HD 树中位置的字符串，如 m/44′/60′/0′/0/0'],
  ['SLIP-44', 'SLIP-0044', '登记各币种 coin_type 编号的列表'],
  ['间隙限制', 'Gap Limit', '恢复钱包时连续未使用地址达到该数量就停止扫描，默认 20']
])}
` });

CUR = 'm03-3';
addCh({ id: 'm03-3', nav: '交易签名与广播', title: 'M08.3 交易签名与广播：从参数到 raw transaction', desc: '逐个参数构造 EIP-1559 交易，签名、序列化、离线签名并广播。', html: `
<h1>M08.3 交易签名与广播：从参数到 raw transaction</h1>
${meta(['说出一笔 EIP-1559 交易每个字段从哪里来（nonce、gas、费用、chainId）。', '解释签名哈希、secp256k1 签名、v/r/s、EIP-155 防重放，并用 go-ethereum 完成签名与广播。', '设计“冷机器签名、热机器广播”的离线签名流程，了解比特币、Solana、Tron 的差异。'], '<a href="#m03-2">M08.2 助记词与 HD 钱包</a>、<a href="#m01-4">M01.4 交易全解</a>')}
${beginner(`<p><strong>交易（Transaction）</strong>：一条“由某地址发起、要求链改变状态”的指令，例如转账或调用合约。</p>
<p><strong>Gas</strong>：以太坊衡量计算量的单位。一笔普通 ETH 转账固定消耗 21,000 gas。</p>
<p><strong>gwei</strong>：ETH 的小单位，1 gwei = 10⁻⁹ ETH。Gas 价格通常用 gwei 表示。</p>
<p><strong>RLP</strong>：以太坊的二进制编码格式（Recursive Length Prefix），把列表和字节串压成一串字节。</p>
<p><strong>广播（Broadcast）</strong>：把签好的交易发给节点，节点再转发给全网，等待被打包。</p>
<p><strong>secp256k1</strong>：比特币和以太坊使用的椭圆曲线，私钥签名、公钥验签都在这条曲线上计算。</p>`)}

<h2>1. 一句话理解</h2>
${one('发一笔交易分四步：查参数 → 组装 → 用私钥签名 → 序列化后广播。只有“签名”这一步需要私钥，所以它可以和其他三步放在不同的机器上。')}
${call('analogy', `<p>像寄一张支票：先填好收款人、金额、支票号（nonce）、邮费（gas）和“只在中国银行有效”（chainId），然后签字，最后装进信封寄出。签字的人不需要自己去邮局。</p>
<p>类比的局限：纸质支票可以挂失作废；链上交易一旦打包，只能再发一笔反向交易，不能撤销。</p>`)}
${art('一图看懂：发一笔交易，只有签名这一步需要私钥', 660, 330, [
  S.zone(0, 8, 660, 128, { t: '联网机器 · 不碰私钥', k: 'info' }),
  S.box(20, 44, 180, 64, { k: 'info', icon: 'globe', t: '① 查参数', s: 'nonce · gas · chainId' }),
  S.box(240, 44, 180, 64, { k: 'info', icon: 'doc', t: '② 组装', s: '未签名交易 + 摘要' }),
  S.box(460, 44, 180, 64, { k: 'info', icon: 'bolt', t: '④ 广播', s: 'raw tx 发给节点' }),
  S.zone(150, 176, 360, 108, { t: '离线机器 · 私钥在这里', k: 'warn' }),
  S.box(180, 204, 300, 64, { k: 'key', icon: 'key', t: '③ 用私钥签名', s: '得到 v · r · s，序列化成 raw tx' }),
  S.arrow(202, 76, 238, 76),
  S.arrow(330, 110, 330, 202, { k: 'warn', label: '二维码 / U 盘' }),
  S.route([[482, 236], [550, 236], [550, 110]], { k: 'warn', label: '带回 raw' }),
  S.text(330, 316, '4 步里只有第 ③ 步碰私钥，所以它可以单独放到一台不联网的机器上', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '联网机器查参数、组装、广播；待签数据通过二维码或 U 盘送到离线机器，签完再带回来。'],
  ['key', '签名只需要私钥和待签数据，不需要网络。这就是“冷机器签、热机器播”。'],
  ['risk', '联网机器可能被篡改收款地址。离线机器要自己解析原始字节再显示，不能只信联网机器给的摘要文字。'],
  ['fail', '离线签名耗时较长，期间 baseFee 可能涨过 maxFee 导致卡单，准备参数时 maxFee 要留余量。']
], '联网机器完成查参数、组装和广播，只有签名一步在离线机器上用私钥完成，数据通过二维码或 U 盘往返', 'm03-3')}

<h2>2. 构造 EIP-1559 交易：每个字段从哪里来</h2>
<p>EIP-1559 交易也叫“类型 2 交易”（type 0x02）。每个字段的含义和“实际单价 = min(maxFee, baseFee + 小费)”的费用公式见 <a href="#m01-4">M01.4 交易全解</a>第 2 节；下表多出两列，回答后端签名服务最关心的问题：每个值从哪里取。</p>
${tbl(['字段', '含义', '怎么得到', 'JSON-RPC / go-ethereum'], [
  ['chainId', '链编号，防止跨链重放', '配置文件写死，启动时用 RPC 校验一致', '<code>eth_chainId</code> / <code>client.ChainID</code>'],
  ['nonce', '该地址发出的第几笔交易，从 0 开始', '企业系统由 Nonce 管理器分配（见 M08.6）；个人钱包查 pending 计数', '<code>eth_getTransactionCount(addr, "pending")</code> / <code>PendingNonceAt</code>'],
  ['maxPriorityFeePerGas', '给出块者的小费上限', '取近期区块小费分位数，或节点建议值', '<code>eth_maxPriorityFeePerGas</code> / <code>SuggestGasTipCap</code>'],
  ['maxFeePerGas', '愿意支付的每 gas 总价上限', '常用：2 × 下一块基础费 + 小费', '<code>eth_getBlockByNumber("latest")</code> 的 baseFeePerGas'],
  ['gas（gasLimit）', '最多消耗多少 gas', 'ETH 转账固定 21,000；合约调用用估算值 × 缓冲系数', '<code>eth_estimateGas</code> / <code>EstimateGas</code>'],
  ['to', '收款地址或合约地址', '业务请求；必须校验格式和校验和（EIP-55）', '—'],
  ['value', '转账的 ETH 数量，单位 wei', '业务请求，十进制金额 × 10¹⁸', '—'],
  ['data', '合约调用数据', 'ERC-20 转账 = 函数选择器 <code>0xa9059cbb</code> + 参数 ABI 编码', '<code>abi.Pack("transfer", to, amount)</code>'],
  ['accessList', '预声明要访问的地址和存储槽', '通常为空', '—']
])}

<h3>2.1 算一算：一笔 ERC-20 转账的费用（示例）</h3>
${steps([
  '查到下一块基础费 baseFee = 18 gwei，节点建议小费 tip = 1.5 gwei。',
  'maxFeePerGas = 2 × 18 + 1.5 = 37.5 gwei。',
  'eth_estimateGas 返回 51,234；乘以缓冲 1.2，gasLimit = 61,481（向上取整）。',
  '最坏情况预留 = 61,481 × 37.5 gwei = 2,305,537.5 gwei ≈ 0.002306 ETH。账户 ETH 余额必须 ≥ 这个值，否则节点直接拒绝。',
  '实际扣费 = 实际消耗 gas × (baseFee + tip)。假设实际用了 51,234 gas、打包时 baseFee 仍为 18：51,234 × 19.5 = 999,063 gwei ≈ 0.000999 ETH。',
  '差额自动退回。其中 51,234 × 18 gwei 被销毁，51,234 × 1.5 gwei 给出块者。'
])}

<h2>3. 签名：哈希、secp256k1、v/r/s</h2>
${recall('<p><a href="#m01-4">M01.4 交易全解</a> 第 3 节已经画过完整流程：签名的对象是 <code>Keccak-256(0x02 ‖ RLP(未签名字段))</code>；签名得到 yParity、r、s；再把字段和签名一起 RLP 编码，前面加 0x02，就是可广播的 raw transaction。节点从签名恢复公钥、算出地址，所以交易里没有 from 字段。本节只补企业签名服务需要额外注意的三件事：随机数 k、v 值、low-s。</p>')}
${call('risk', '<p>同一个 nonce 签两笔不同的交易，两笔都是有效交易，谁先被打包谁生效。签名服务必须在签名前锁定 nonce，拒绝对同一 nonce 签出第二笔内容不同的交易（替换交易除外，且要走审批）。nonce 管理见 <a href="#m03-6">M08.6</a>。</p>')}
<h3>3.1 ECDSA 签名在做什么</h3>
<p>椭圆曲线数字签名算法（ECDSA）的输入是 32 字节哈希 z 和私钥 d，输出两个 32 字节整数 r 和 s：</p>
${steps([
  '选一个一次性随机数 k（现代实现按 RFC 6979 从私钥和哈希确定性地算出 k，避免随机数出错）。',
  '计算曲线点 R = k × G，取 R 的 x 坐标作为 r。',
  '计算 s = k⁻¹ × (z + r × d) mod n。',
  '为了让验证者能从签名“恢复”公钥，额外给出 1 位恢复标识 recid（0 或 1），表示 R 的 y 坐标奇偶。'
])}
${call('warn', '<p><strong>k 重复 = 私钥泄露。</strong>用同一个 k 签两条不同消息，任何人都能用两组 (r, s) 解出私钥。真实案例见 <a href="#m00-3">M00.3</a> 第 5 节（索尼 PS3）。企业钱包只用经过审计的签名库，绝不自己实现 ECDSA。</p>')}
<h3>3.2 v 值与 low-s</h3>
${recall('<p>v 的取值规则（legacy 交易的 27/28、EIP-155 的 <code>chainId × 2 + 35 + recid</code>、类型化交易的 yParity 0/1）见 <a href="#m01-4">M01.4</a> 第 3.2 节。企业签名服务通常只签类型 2 交易，所以只需要处理 yParity。</p>')}
<p>另外，以太坊要求 s 位于曲线阶 n 的低半部分（EIP-2，low-s），防止“签名延展性”：同一签名可以改写成 (r, n − s) 仍然有效。用云 KMS 或 HSM 签名时，返回的 s 可能是高位，需要自己转换为 n − s 并翻转 recid。</p>

<h2>4. go-ethereum 代码：构造、签名、广播</h2>
${code('GO', `
package wallet

import (
    "context"
    "crypto/ecdsa"
    "math/big"

    "github.com/ethereum/go-ethereum"
    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/core/types"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/ethereum/go-ethereum/ethclient"
)

// SendETH 构造并发送一笔 EIP-1559 转账。生产环境中 nonce 由 Nonce 管理器传入。
func SendETH(ctx context.Context, rpcURL string, key *ecdsa.PrivateKey,
    to common.Address, amountWei *big.Int) (common.Hash, error) {

    client, err := ethclient.DialContext(ctx, rpcURL)
    if err != nil {
        return common.Hash{}, err
    }
    defer client.Close()

    from := crypto.PubkeyToAddress(key.PublicKey)

    // 1. chainId：防止跨链重放
    chainID, err := client.ChainID(ctx)
    if err != nil {
        return common.Hash{}, err
    }
    // 2. nonce：个人钱包查 pending；企业系统请改用 Nonce 管理器
    nonce, err := client.PendingNonceAt(ctx, from)
    if err != nil {
        return common.Hash{}, err
    }
    // 3. 费用：tip 用节点建议值，feeCap = 2 × baseFee + tip
    tip, err := client.SuggestGasTipCap(ctx)
    if err != nil {
        return common.Hash{}, err
    }
    head, err := client.HeaderByNumber(ctx, nil)
    if err != nil {
        return common.Hash{}, err
    }
    feeCap := new(big.Int).Add(new(big.Int).Mul(head.BaseFee, big.NewInt(2)), tip)

    // 4. gas：估算后加 20% 缓冲（纯 ETH 转账结果就是 21000）
    gas, err := client.EstimateGas(ctx, ethereum.CallMsg{
        From: from, To: &to, Value: amountWei,
    })
    if err != nil {
        return common.Hash{}, err
    }
    if gas > 21000 {
        gas = gas * 12 / 10
    }

    // 5. 组装类型 2 交易
    tx := types.NewTx(&types.DynamicFeeTx{
        ChainID:   chainID,
        Nonce:     nonce,
        GasTipCap: tip,
        GasFeeCap: feeCap,
        Gas:       gas,
        To:        &to,
        Value:     amountWei,
        Data:      nil,
    })

    // 6. 签名：LatestSignerForChainID 会选择支持 1559 的签名器
    signer := types.LatestSignerForChainID(chainID)
    signed, err := types.SignTx(tx, signer, key)
    if err != nil {
        return common.Hash{}, err
    }

    // 7. 广播。返回 nil 只表示节点接受，不表示已上链
    if err := client.SendTransaction(ctx, signed); err != nil {
        return common.Hash{}, err
    }
    return signed.Hash(), nil
}
`)}
<p>企业系统里私钥不在业务进程内。签名服务（HSM、KMS、MPC）只接收 32 字节哈希，返回 65 字节签名。go-ethereum 支持“先算哈希、再装签名”：</p>
${code('GO', `
// 外部签名：签名服务只看到哈希，业务进程看不到私钥
signer := types.LatestSignerForChainID(chainID)
digest := signer.Hash(tx)                 // 0x02 || RLP(...) 的 Keccak-256
sig, err := remoteSigner.Sign(ctx, keyID, digest.Bytes()) // 返回 r(32) || s(32) || v(1)，v 为 0/1
if err != nil {
    return err
}
signed, err := tx.WithSignature(signer, sig)
if err != nil {
    return err
}
raw, _ := signed.MarshalBinary()          // raw transaction 字节，可存档或交给广播机
_ = raw
`)}

<h2>5. 离线签名：冷机器签，热机器播</h2>
${mm('离线签名流程', `
sequenceDiagram
  participant OP as 运营人员
  participant HOT as 联网机器
  participant COLD as 离线签名机
  participant NET as 区块链网络
  OP->>HOT: 发起转账请求
  HOT->>NET: 查询 nonce 余额 baseFee chainId
  HOT->>HOT: 构造未签名交易 并生成摘要
  HOT->>COLD: 二维码或 U 盘传入未签名交易
  COLD->>COLD: 独立解析并显示 to value nonce fee
  OP->>COLD: 双人核对后确认
  COLD->>COLD: 用私钥签名
  COLD->>HOT: 二维码传回 raw transaction
  HOT->>HOT: 解码 raw 交易 再次核对字段
  HOT->>NET: eth_sendRawTransaction
  NET-->>HOT: 返回交易哈希
`, [
  ['flow', '离线机只做“解析 + 显示 + 签名”。所有需要联网查询的参数都在联网机器上准备好。'],
  ['fail', '离线签名耗时较长，期间 baseFee 可能上涨超过 maxFee，交易卡住。准备参数时 maxFee 要留更大余量。'],
  ['risk', '联网机器可能被篡改，把收款地址换掉。离线机必须自己解析原始字节并显示，不能信任联网机器给的“摘要文字”。'],
  ['key', '签名机只认数据，不认人：双人核对、操作录像、签名机密封存放，都是流程的一部分。']
])}
<p>离线签名的工具链：go-ethereum 的 <code>clef</code> 可作为外部签名器；硬件钱包、Keystone 等二维码钱包、HSM 都能承担离线签名角色。文件格式上，以太坊直接传 raw transaction 的十六进制；比特币使用 PSBT（BIP-174，部分签名比特币交易）。</p>

<h2>6. 多链差异</h2>
<h3>6.1 比特币：UTXO 模型</h3>
<p>比特币没有“账户余额”，只有一个个<strong>未花费输出（UTXO，Unspent Transaction Output）</strong>，像钱包里面额不同的纸币。一笔交易“花掉”若干 UTXO（输入），产生新的 UTXO（输出）。</p>
${mm('比特币交易：选币、找零、手续费', `
flowchart LR
  U1["UTXO A<br/>0.30 BTC"] --> TX["交易"]
  U2["UTXO B<br/>0.25 BTC"] --> TX
  TX --> O1["输出 1：收款人<br/>0.50 BTC"]
  TX --> O2["输出 2：找零地址<br/>0.04986 BTC<br/>路径 change = 1"]
  TX -.->|"输入 − 输出"| FEE["手续费 0.00014 BTC<br/>归矿工"]
`, [
  ['flow', '输入合计 0.55 BTC，收款 0.50，手续费 = 输入 − 输出。找零必须显式写成一个输出，发回自己的找零地址。'],
  ['risk', '忘记写找零输出，剩下的 0.04986 BTC 全部变成手续费送给矿工。'],
  ['key', '手续费按交易体积（vbyte）计价，与金额无关。输入越多，体积越大，费用越高。'],
  ['limit', '比特币没有 nonce。同一 UTXO 只能被花一次，替换交易靠 RBF（BIP-125）或 CPFP（子交易付费）。UTXO 与脚本见 <a href="#m05-60">M06.1 比特币 UTXO 与脚本</a>，PSBT 与 Taproot 见 <a href="#m05-61">M06.2 SegWit·Taproot·PSBT</a>。']
])}
<p><strong>算一算（示例）</strong>：2 个 P2WPKH 输入、2 个 P2WPKH 输出，交易体积约 10.5 + 2 × 68 + 2 × 31 ≈ 209 vB。费率 67 sat/vB 时，手续费 = 209 × 67 ≈ 14,000 sat = 0.00014 BTC。选币算法的目标：凑够金额、少用输入、尽量不产生小于“粉尘阈值”的找零（P2WPKH 约 294 sat）。</p>

<h3>6.2 Solana 与 Tron</h3>
${tbl(['对比项', '以太坊', 'Solana', 'Tron'], [
  ['签名曲线', 'secp256k1', 'Ed25519', 'secp256k1（与以太坊相同私钥可用）'],
  ['防重放机制', '账户 nonce 递增', '交易包含近期区块哈希 recent blockhash，约 150 个区块后过期', '交易包含引用区块 ref_block 和过期时间 expiration'],
  ['离线签名', '随时可签，nonce 固定即可', 'blockhash 很快过期，离线签名要用 Durable Nonce 账户', 'expiration 默认较短，离线签名要设置足够的过期时间'],
  ['费用模型', 'gas × (baseFee + tip)', '每签名基础费 + 计算单元优先费', '带宽 Bandwidth + 能量 Energy，可质押 TRX 获得'],
  ['代币转账', 'ERC-20 合约调用', 'SPL Token，收款方需要关联代币账户 ATA', 'TRC-20 合约调用，需要足够能量'],
  ['地址格式', '0x + 40 位十六进制', 'Base58 公钥，32 字节', 'Base58Check，以 T 开头']
])}
${call('info', `<p>多链钱包的设计原则：把“构造交易”和“签名”拆开。签名层只关心曲线（secp256k1 / Ed25519）和哈希；每条链实现自己的“交易构造器”和“广播器”。M08.10 实战会按这个接口设计。</p>`)}

${tryit(`<p>① 在 Sepolia 测试网领取测试 ETH（搜索 “Sepolia faucet”）。② 用上面的 <code>SendETH</code> 代码，把 RPC 换成任意 Sepolia 公共节点，给自己另一个地址转 0.001 ETH。③ 复制返回的交易哈希，到 sepolia.etherscan.io 查询，点击 “Click to show more”，确认 Txn Type 显示 <code>2 (EIP-1559)</code>，并核对 Max Fee、Max Priority Fee、Nonce 与代码中的值一致。④ 用 curl 调用 <code>eth_getTransactionByHash</code>，在返回中找到 <code>v</code>（yParity）、<code>r</code>、<code>s</code> 三个字段。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['启动时校验 RPC 的 chainId 与配置一致', '连错网络会把主网交易发到测试网或反之', '启动自检失败即退出'],
  ['签名前独立解码交易并比对业务请求', '防止构造层被篡改', '签名服务记录解码后的 to、value、nonce'],
  ['同一 (地址, nonce) 只签一次', '重复签名导致不可控的替换', '签名记录表唯一约束'],
  ['外部签名统一 low-s 并验证可恢复出 from', 'KMS/HSM 返回的签名格式不一', '签名后用 types.Sender 恢复地址比对'],
  ['raw transaction 广播前落库', '广播超时也能重发同一笔，避免重复签新交易', '交易表有 raw_tx 与 tx_hash 字段'],
  ['广播到多个节点', '单节点可能丢弃交易', '广播器配置 ≥ 2 个独立供应商']
])}
${mistakes([
  ['SendTransaction 返回成功就代表转账成功', '它只代表节点接收了交易。必须等待回执（receipt）且 status = 1，并达到确认数。'],
  ['交易里有 from 字段', 'EIP-1559 交易没有 from。发送方由签名恢复得出。'],
  ['gasLimit 设得越大越安全', 'gasLimit 只是上限，但余额必须覆盖 gasLimit × maxFee；设太大会导致余额不足被拒，也会掩盖合约异常。'],
  ['比特币交易会自动找零', '找零必须显式写成输出。漏掉找零，差额全部成为手续费。'],
  ['同一个私钥在 Solana 和以太坊上通用', 'Solana 用 Ed25519，以太坊用 secp256k1，曲线不同，私钥格式和地址算法都不同。']
])}
${recap([
  '类型 2 交易字段：chainId、nonce、maxPriorityFeePerGas、maxFeePerGas、gas、to、value、data、accessList。',
  '签名对象是 Keccak-256(0x02 || RLP(字段))；签名输出 r、s 和恢复位，节点据此恢复 from。',
  'EIP-155 把 chainId 编进签名，防止跨链重放；类型 2 交易的 chainId 是独立字段。',
  '签名可以和构造、广播分离：冷机器签名，热机器广播，签名服务只接收哈希。',
  '比特币按 UTXO 选币并显式找零；Solana 用 recent blockhash，Tron 用 ref_block + expiration 防重放。'
])}
${quiz([
  { q: '以太坊主网（chainId = 1）上一笔 legacy + EIP-155 交易，recid = 1，v 等于多少？', o: ['27', '28', '37', '38'], a: 3, why: 'v = chainId × 2 + 35 + recid = 1 × 2 + 35 + 1 = 38。27/28 是 EIP-155 之前的取值。' },
  { q: '节点如何知道一笔 EIP-1559 交易是谁发的？', o: ['交易里的 from 字段', '从签名和签名哈希恢复出公钥，再计算地址', '查询发送节点的 IP', '由出块者指定'], a: 1, why: '交易不含 from。ECDSA 签名加恢复位可以恢复出唯一公钥，地址由公钥哈希得出。' },
  { q: '离线签名一笔 Solana 交易，签好后 10 分钟才广播，被节点拒绝。最可能的原因是？', o: ['recent blockhash 已过期，应改用 Durable Nonce', 'nonce 太小', 'gasLimit 不足', 'Ed25519 签名有效期只有 1 分钟'], a: 0, why: 'Solana 交易引用的 recent blockhash 大约 150 个区块（约 1 分钟量级）后失效。离线场景使用 Durable Nonce 账户替代 blockhash。' },
  { q: '一笔比特币交易：输入 1.0 BTC，输出给收款人 0.6 BTC，没有其他输出。结果是什么？', o: ['剩余 0.4 BTC 自动退回', '交易无效被拒绝', '0.4 BTC 全部成为手续费', '0.4 BTC 被冻结'], a: 2, why: '比特币手续费 = 输入 − 输出。没有找零输出时，差额全部给矿工。部分钱包会对异常高手续费发出警告，但协议不会阻止。' }
])}
${exercises([["（示例）下一块 baseFee = 30 gwei，建议小费 2 gwei。一笔 ERC-20 转账 eth_estimateGas 返回 60,000，缓冲系数 1.2。求 maxFeePerGas、gasLimit、最坏情况预留费用；若实际消耗 60,000 gas、打包时 baseFee 仍为 30，实际扣费多少？", "<p>maxFeePerGas = 2 × 30 + 2 = <strong>62 gwei</strong>。gasLimit = 60,000 × 1.2 = <strong>72,000</strong>。最坏预留 = 72,000 × 62 = 4,464,000 gwei ≈ <strong>0.004464 ETH</strong>，余额不足节点会拒收。实际扣费 = 60,000 × (30 + 2) = 1,920,000 gwei = <strong>0.00192 ETH</strong>。其中 60,000 × 30 gwei = 0.0018 ETH 被销毁，0.00012 ETH 给出块者。</p>"], ["（示例）比特币交易：输入 0.30 BTC 和 0.25 BTC 两个 P2WPKH UTXO，给收款人 0.50 BTC，体积约 209 vB，费率 20 sat/vB。手续费多少？找零输出应写多少？", "<p>手续费 = 209 × 20 = 4,180 sat = 0.0000418 BTC。找零 = 0.55 − 0.50 − 0.0000418 = <strong>0.0499582 BTC</strong>，必须显式写成一个输出，发回找零地址。漏掉找零，剩余 0.05 BTC 全部变成手续费。</p>"], ["在“冷机器签名、热机器广播”流程里，为什么离线机必须自己解析原始交易字节并显示，而不能显示联网机器传来的摘要文字？", "<p>联网机器可能被篡改，它可以把收款地址换掉，却在摘要里写原来的地址。离线机只有自己从原始字节解出 to、value、nonce、fee，显示的才是它真正要签的内容。签名后联网机器解码 raw 交易再核对一次，形成双向校验。</p>"]])}
${checklist(["能说出 EIP-1559 交易每个字段的来源，以及对应的 JSON-RPC 方法。", "能计算一笔交易的 maxFee、gasLimit、最坏预留和实际扣费，并区分销毁部分和小费部分。", "能解释 k 重复为什么泄露私钥，以及 KMS/HSM 签名后为什么要做 low-s 转换。", "能画出离线签名的时序：联网机查参数、离线机解析并签名、联网机核对后广播。", "在 Sepolia 上发过一笔类型 2 交易，并在返回数据中找到 v、r、s 三个字段。"])}
${terms([
  ['类型 2 交易', 'EIP-1559 / DynamicFeeTx', '使用 maxFeePerGas 和 maxPriorityFeePerGas 的交易格式'],
  ['原始交易', 'Raw Transaction', '签名后经编码、可直接广播的交易字节'],
  ['ECDSA', 'Elliptic Curve Digital Signature Algorithm', '基于椭圆曲线的数字签名算法'],
  ['恢复位', 'Recovery ID / yParity', '帮助从签名恢复公钥的 1 位标识'],
  ['EIP-155', 'Replay Protection', '把 chainId 编进签名以防跨链重放'],
  ['UTXO', 'Unspent Transaction Output', '比特币中尚未被花费的交易输出'],
  ['PSBT', 'Partially Signed Bitcoin Transaction, BIP-174', '在多方之间传递待签比特币交易的格式'],
  ['Durable Nonce', 'Solana Durable Nonce', 'Solana 中替代 recent blockhash、支持离线签名的机制']
])}
` });
})();
