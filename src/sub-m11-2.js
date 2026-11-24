/* ---------- M07 合规与监管（2）：m11-4 法域 · m11-5 税务 · m11-6 ★ 实战 ---------- */
(() => {
CUR = 'm11-4';
addCh({ id: 'm11-4', nav: '主要法域', title: 'M07.4 主要法域：美国、欧盟、香港、新加坡等', desc: '各法域的监管机构、牌照类型、稳定币规则，以及它们对产品的影响', html: `
<h1>M07.4 主要法域：美国、欧盟、香港、新加坡等</h1>
${meta(['用“法律 → 监管机构 → 牌照 → 产品规则”四个问题读懂任何一个法域的加密监管框架。', '说出美国、欧盟、香港、新加坡各自的主要监管机构、牌照类型和稳定币规则，以及截至 2026 年的关键日期。', '把“能不能上架这个代币、能不能做质押、能不能服务某地用户”翻译成产品需求和工程开关（地域限制、产品白名单）。'], '前置：<a href="#m11-1">M07.1 合规全景</a>、<a href="#m11-2">M07.2 KYC、AML 与制裁筛查</a>、<a href="#m02-9">M08.1 稳定币</a>')}
${beginner(`<p><strong>法域（Jurisdiction）</strong>：一套法律生效的地理和法律范围，例如“美国联邦”“纽约州”“欧盟”“香港”。同一个国家里也可能有多个法域。</p>
<p><strong>牌照（Licence）</strong>：监管机构发给企业的许可。没有牌照就做受监管的业务，通常是违法行为。</p>
<p><strong>VASP / CASP</strong>：虚拟资产服务提供商（Virtual Asset Service Provider，FATF 的叫法）；加密资产服务提供商（Crypto-Asset Service Provider，欧盟 MiCA 的叫法）。交易所、托管方、经纪商都属于这一类。</p>
<p><strong>证券（Security）与商品（Commodity）</strong>：美国法律里两类不同的资产。是证券，主要归 SEC 管；是商品，衍生品和欺诈问题主要归 CFTC 管。</p>
<p><strong>护照（Passporting）</strong>：在欧盟一个成员国拿到牌照后，通知后即可在其他成员国提供服务的机制。</p>
<p><strong>过渡期（Transitional period）</strong>：新法生效后给存量企业的缓冲时间。过渡期结束，没拿到新牌照的企业必须停止服务。</p>`)}
${call('info', '<p><strong>本篇是框架知识，不是法律意见。</strong>监管变化很快，文中日期和状态都以“截至 2026 年公开资料”为准。做具体业务决定前，请查阅监管机构原文并咨询持牌律师。</p>')}

<h2>1. 一句话理解</h2>
${one('每个法域都回答同样四个问题：哪部法律管、哪个机构管、要拿什么牌照、拿了牌照之后产品要守哪些规则。工程师要做的，是把这四个答案翻译成系统里的“地域开关 + 产品白名单 + 规则参数”。')}
${call('analogy', `<p>法域像不同国家的驾照制度。美国是“联邦一张 + 各州各一张”，还分轿车和货车（证券和商品）两套考官；欧盟是“在一个成员国考过，全欧盟都能开”；香港和新加坡是“城市只有一个考官，但考得很严”。你造的车（产品）要在哪里上路，就要满足哪里的规则。</p>
<p>比喻的局限：驾照只管司机；加密牌照还管你的资产托管方式、能卖哪些币、怎么做广告、怎么报告可疑交易。</p>`)}
${art('一图看懂：各法域的监管骨架：谁管、发什么牌照、有什么特点', 660, 362, [
  S.box(10, 36, 148, 54, { k: 'info', icon: 'flag', t: '美国', s: '联邦 + 州两层' }),
  S.box(174, 36, 148, 54, { k: 'info', icon: 'flag', t: '欧盟', s: 'MiCA 一部条例' }),
  S.box(338, 36, 148, 54, { k: 'info', icon: 'flag', t: '香港', s: '两个监管者' }),
  S.box(502, 36, 148, 54, { k: 'info', icon: 'flag', t: '新加坡', s: 'MAS 一个机构' }),
  S.box(10, 100, 148, 196, { k: 'tint' }),
  S.box(174, 100, 148, 196, { k: 'tint' }),
  S.box(338, 100, 148, 196, { k: 'tint' }),
  S.box(502, 100, 148, 196, { k: 'tint' }),
  S.text(22, 122, '谁管', { size: 11.5, b: 1, dim: 1 }),
  S.text(22, 140, 'FinCEN · SEC\nCFTC · 各州', { size: 12.5, mw: 124 }),
  S.text(22, 186, '牌照', { size: 11.5, b: 1, dim: 1 }),
  S.text(22, 204, 'MSB 注册 + 州牌照\n纽约 BitLicense', { size: 12.5, mw: 124 }),
  S.text(22, 250, '特点', { size: 11.5, b: 1, dim: 1 }),
  S.text(22, 268, '逐州判断\n证券、商品两套', { size: 12.5, mw: 124 }),
  S.text(186, 122, '谁管', { size: 11.5, b: 1, dim: 1 }),
  S.text(186, 140, 'ESMA · EBA\n成员国主管机构', { size: 12.5, mw: 124 }),
  S.text(186, 186, '牌照', { size: 11.5, b: 1, dim: 1 }),
  S.text(186, 204, 'CASP 授权', { size: 12.5, mw: 124 }),
  S.text(186, 250, '特点', { size: 11.5, b: 1, dim: 1 }),
  S.text(186, 268, '一国授权\n全欧盟通行（护照）', { size: 12.5, mw: 124 }),
  S.text(350, 122, '谁管', { size: 11.5, b: 1, dim: 1 }),
  S.text(350, 140, 'SFC 管平台\nHKMA 管稳定币', { size: 12.5, mw: 124 }),
  S.text(350, 186, '牌照', { size: 11.5, b: 1, dim: 1 }),
  S.text(350, 204, 'VATP 牌照', { size: 12.5, mw: 124 }),
  S.text(350, 250, '特点', { size: 11.5, b: 1, dim: 1 }),
  S.text(350, 268, '发行稳定币\n须 HKMA 牌照', { size: 12.5, mw: 124 }),
  S.text(514, 122, '谁管', { size: 11.5, b: 1, dim: 1 }),
  S.text(514, 140, 'MAS', { size: 12.5, mw: 124 }),
  S.text(514, 186, '牌照', { size: 11.5, b: 1, dim: 1 }),
  S.text(514, 204, 'DPT 服务牌照\n兑换 / SPI / MPI', { size: 12.5, mw: 124 }),
  S.text(514, 250, '特点', { size: 11.5, b: 1, dim: 1 }),
  S.text(514, 268, '只服务境外客户\n也要 DTSP 牌照', { size: 12.5, mw: 124 }),
  S.pill(40, 316, 580, 32, '工程上翻译成同一个模型：（用户法域 × 产品 × 资产）→ 允许 / 禁止 / 需额外步骤', { k: 'key' })
], [
  ['flow', '读法：先看谁管，再看要哪张牌照，最后看有什么特点。每个法域都在回答这三个问题。'],
  ['key', '不管框架多不同，工程上都落到同一个模型：（用户法域 × 产品 × 资产）得出允许、禁止或需额外步骤。'],
  ['risk', '美国“服务美国用户”实际是逐州判断；只看 IP 做地域限制容易被绕过，监管更看重 KYC 居住地和是否主动营销。'],
  ['limit', '图只画框架，生效日期和过渡期（截至 2026 年公开资料）见各节，具体业务要不要牌照由律师判断。']
], '四列分别是美国、欧盟、香港、新加坡，每列写明谁管、要什么牌照、有什么特点；底部说明工程上把它们翻译成（用户法域 × 产品 × 资产）到允许、禁止或额外步骤的规则表。', 'm11-4')}
${recall('<p>VASP 的定义、FATF 标准与“为什么开发者要懂合规”见 <a href="#m11-1">M07.1 合规全景</a>；KYC、AML、制裁筛查的具体做法见 <a href="#m11-2">M07.2</a>；旅行规则见 <a href="#m11-3">M07.3</a>。本篇只比较各法域的框架和对产品的影响。</p>')}

<h2>2. 读懂一个法域：四个问题</h2>
${layers('一个法域的监管框架分四层', [
  { name: '法律', sub: '议会或立法机构通过', chips: ['MiCA（欧盟条例）', 'GENIUS 法案（美国）', '《稳定币条例》（香港）', 'PS Act / FSMA（新加坡）'] },
  { name: '监管机构', sub: '执行法律、发牌照、查处违规', chips: ['SEC / CFTC / FinCEN / 州监管', 'ESMA / EBA / 成员国主管机构', 'SFC / HKMA', 'MAS'], kind: 'key' },
  { name: '牌照类型', sub: '按业务分：交易、托管、发行、支付', chips: ['MSB + 州牌照', 'CASP', 'VATP 牌照', 'DPT 服务牌照'] },
  { name: '产品规则', sub: '拿到牌照后每天要守的规则', chips: ['上币审查', '客户资产隔离', '营销限制', 'KYC / 旅行规则', '稳定币准入'], kind: 'risk' }
], [
  ['flow', '从上往下读：法律授权机构，机构发放牌照，牌照附带产品规则。工程需求主要来自最下面一层。'],
  ['key', '同一部法律可能由多个机构分工执行。美国最典型：一个代币是不是证券，决定了 SEC 还是 CFTC 主导。'],
  ['limit', '法律文本之下还有大量指引、通函、问答（FAQ）。它们不一定有法律效力，但监管机构会按它们检查。'],
  ['risk', '只看法律名字会漏掉过渡期和生效日。一个系统在 A 日合规，过渡期结束后的 B 日可能就违规。']
], ['授权', '发放', '附带'])}

<h2>3. 美国：联邦 + 州的双层结构</h2>
<p>美国没有一部统一的加密法。截至 2026 年公开资料，框架由下面几块拼成：</p>
${tbl(['层面', '机构 / 法律', '管什么', '对产品的含义'], [
  ['联邦反洗钱', 'FinCEN（金融犯罪执法网络），依据《银行保密法》', '接收和转移可兑换虚拟货币的业务通常属于货币服务业务（MSB）中的货币转移商，要注册并建立反洗钱计划' + cite('FinCEN：FIN-2019-G001 可兑换虚拟货币指引', 'https://www.fincen.gov/sites/default/files/2019-05/FinCEN%20CVC%20Guidance%20FINAL.pdf'), '托管钱包、交易所要做 KYC、可疑交易报告、记录保存'],
  ['州', '各州货币转移牌照（MTL）；纽约州 NYDFS 的 BitLicense（23 NYCRR Part 200）', '在某州为该州居民提供转移或托管服务，通常要该州牌照；纽约有专门的虚拟货币牌照' + cite('NYDFS：Virtual Currency Businesses', 'https://www.dfs.ny.gov/virtual_currency_businesses'), '“服务美国用户”实际是“逐州判断”，系统要能按州做地域开关'],
  ['证券', 'SEC（证券交易委员会）', '属于证券的代币及其交易、发行、经纪', '上币前要做“是否证券”的法律评估'],
  ['商品与衍生品', 'CFTC（商品期货交易委员会）', '数字商品的期货、杠杆和融资交易，以及商品市场欺诈', '杠杆、永续、期货类产品面向美国用户受限'],
  ['稳定币', 'GENIUS 法案，联邦银行监管机构（OCC 等）实施', '支付型稳定币的发行主体、储备、赎回', '可上架、可支持的美元稳定币范围会随实施规则变化']
])}
<p>2025–2026 年的几个关键变化（截至 2026 年公开资料）：</p>
${steps([
  '<strong>GENIUS 法案</strong>：2025 年 7 月 18 日签署，建立支付型稳定币的联邦框架。' + cite('白宫：GENIUS 法案签署说明', 'https://www.whitehouse.gov/fact-sheets/2025/07/fact-sheet-president-donald-j-trump-signs-genius-act-into-law/') + '法案在“签署后 18 个月（2027 年 1 月 18 日）”与“主要监管机构发布最终实施规则后 120 天”中较早的日期生效。' + cite('Morgan Lewis：GENIUS Act 解读', 'https://www.morganlewis.com/pubs/2025/07/genius-act-passes-in-us-congress-a-breakdown-of-the-landmark-stablecoin-law') + 'OCC 于 2026 年 3 月发布实施规则提案。' + cite('OCC：GENIUS 法案实施规则提案（新闻稿）', 'https://occ.gov/news-issuances/news-releases/2026/nr-occ-2026-9.html'),
  '<strong>SEC 质押声明</strong>：2025 年 5 月，SEC 公司金融部工作人员声明，特定的协议质押（自己质押、自托管委托、部分托管质押）不构成证券发行；流动性质押、再质押不在声明范围内。工作人员声明不具法律约束力。' + cite('DLA Piper：SEC staff concludes protocol staking activities…', 'https://www.dlapiper.com/en/insights/publications/2025/06/sec-staff-concludes-protocol-staking-activities'),
  '<strong>SEC / CFTC 联合声明</strong>：2025 年 9 月 2 日，两机构工作人员表示，已注册的交易所（SEC 的全国性证券交易所、CFTC 的指定合约市场等）并不被禁止撮合特定现货加密资产产品。' + cite('SEC：SEC-CFTC 工作人员联合声明', 'https://www.sec.gov/newsroom/press-releases/2025-110-sec-cftc-staff-issue-joint-statement-trading-certain-spot-crypto-asset-products'),
  '<strong>SEC 解释性发布</strong>：2026 年 3 月，SEC 发布关于加密资产分类的解释，分为数字商品、数字收藏品、数字工具、稳定币和数字证券五类，CFTC 表示将保持一致。' + cite('Orrick：SEC Issues Interpretive Guidance on Crypto Asset Classification', 'https://www.orrick.com/en/Insights/2026/04/SEC-Issues-Interpretive-Guidance-on-Crypto-Asset-Classification'),
  '<strong>市场结构法案（CLARITY）</strong>：众议院 2025 年 7 月通过；参议院 2026 年 9 月 15 日程序性投票未达 60 票，截至 2026 年 10 月处于搁置状态。' + cite('Orrick：The CLARITY Act Stalls in the Senate', 'https://www.orrick.com/Insights/2026/10/The-CLARITY-Act-Stalls-in-the-Senate-Whats-Next-for-Digital-Asset-Regulation')
])}
${call('info', '<p>工作人员声明（staff statement）、解释性发布、法律三者效力不同。前两者可能被后来的委员会修改，也可能被法院推翻。产品设计时，把依赖这类文件的功能做成<strong>可快速关闭</strong>的开关。</p>')}

<h2>4. 欧盟：MiCA 一部条例 + 护照</h2>
<p>欧盟的《加密资产市场条例》（MiCA，Regulation (EU) 2023/1114）直接适用于所有成员国。${cite('EUR-Lex：Regulation (EU) 2023/1114 (MiCA)', 'https://eur-lex.europa.eu/eli/reg/2023/1114/oj')}它把加密资产分成三类，分别管：</p>
${tbl(['类别', '是什么', '谁能发行 / 提供', '适用日期'], [
  ['EMT 电子货币代币', '锚定单一法币的代币（例如欧元或美元稳定币）', '只能由信贷机构或电子货币机构发行，并要发布白皮书', '2024-06-30 起' + cite('EBA：Asset-referenced and e-money tokens (MiCA)', 'https://www.eba.europa.eu/regulation-and-policy/asset-referenced-and-e-money-tokens-mica')],
  ['ART 资产参考代币', '锚定一篮子资产、多种货币或商品的代币', '要获得成员国主管机构授权；重要的 ART 由 EBA 直接监管', '2024-06-30 起'],
  ['其他加密资产', '不属于上面两类、也不属于金融工具的代币', '发行和上架要有合规白皮书', '2024-12-30 起'],
  ['CASP 服务', '托管、交易平台、兑换、执行订单、转账服务等', '要获得 CASP 授权，之后可护照到其他成员国', '2024-12-30 起；成员国过渡期最长到 2026-07-01']
])}
<p>过渡期已经结束：ESMA 声明，2026 年 7 月 1 日之后，未获 MiCA 授权仍向欧盟客户提供加密资产服务的实体违反欧盟法律，应已执行有序退出计划。${cite('ESMA：Public Statement — MiCA transitional period ends', 'https://www.esma.europa.eu/sites/default/files/2026-06/ESMA75-113276571-1710_Public_Statement_MiCA_transitional_period_ends.pdf')}同时，欧盟《资金转移条例》（TFR，Regulation (EU) 2023/1113）自 2024 年 12 月 30 日起把旅行规则扩展到加密资产转账。${cite('EUR-Lex：Regulation (EU) 2023/1113 (TFR)', 'https://eur-lex.europa.eu/eli/reg/2023/1113/oj/eng')}</p>
${mm('欧盟：从一个成员国授权到全欧盟服务', `
flowchart LR
  A["企业"] -->|"申请 CASP 授权"| NCA["成员国主管机构<br/>例如法国 AMF"]
  NCA -->|"授权"| R["ESMA 登记册"]
  NCA -->|"护照通知"| O["其他成员国<br/>直接提供服务"]
  A --> W["上架代币"]
  W --> C1{"是 EMT / ART 吗"}
  C1 -->|"是"| C2{"发行方已获授权"}
  C2 -->|"否"| X["不能向欧盟客户提供"]:::risk
  C2 -->|"是"| OK["可以上架"]:::ok
  C1 -->|"否"| WP["要有合规白皮书"] --> OK
`, [
  ['flow', '授权在一个成员国完成，ESMA 登记册公开可查；护照让同一张授权覆盖整个欧盟。'],
  ['key', '稳定币是上币决策里最容易出错的一类：锚定单一法币的币按 EMT 管，发行方必须是持牌信贷机构或电子货币机构。'],
  ['fail', '过渡期结束后还在服务欧盟客户的未授权平台，要按退出计划处理存量客户，不能“先跑着再说”。'],
  ['limit', 'MiCA 不覆盖已经属于金融工具的代币（那归 MiFID II），也不直接覆盖完全去中心化、没有中介的服务。边界要逐案判断。']
])}

<h2>5. 香港：SFC 管平台，HKMA 管稳定币</h2>
${tbl(['事项', '内容（截至 2026 年公开资料）'], [
  ['交易平台', '自 2023 年 6 月 1 日起，在香港经营或向香港投资者主动推广的中心化虚拟资产交易平台（VATP）须获 SFC 发牌；交易证券型代币还需 SFO 下的牌照。' + cite('SFC：VATP 新发牌制度实施通函', 'https://apps.sfc.hk/edistributionWeb/api/circular/list-content/circular/doc?lang=EN&amp=&refNo=23EC28') + 'SFC 网站公开了持牌平台名单（2026 年 10 月更新时列出 13 家）。' + cite('SFC：持牌虚拟资产交易平台名单', 'https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms')],
  ['零售与上币', '持牌平台可以服务零售投资者，但要遵守 SFC 的投资者保护和上币审查要求'],
  ['质押', '2025 年 4 月起，持牌平台经 SFC 事先批准可提供质押服务，并要保持对提取机制的控制、事先向客户披露条款。' + cite('Baker McKenzie：HKMA and SFC guidance on staking', 'https://insightplus.bakermckenzie.com/bm/banking-finance_1/hong-kong-hkma-and-sfcs-guidance-on-staking-of-virtual-assets')],
  ['稳定币', '《稳定币条例》（第 656 章）2025 年 8 月 1 日生效：在香港发行法币稳定币、或在境外发行锚定港元的稳定币，须获 HKMA 牌照。' + cite('HKMA：稳定币发行人监管制度', 'https://www.hkma.gov.hk/eng/key-functions/international-financial-centre/stablecoin-issuers') + 'HKMA 于 2026 年 4 月向首批两家机构发出牌照。' + cite('HKMA Insight：受监管稳定币生态的发展（2026-04）', 'https://www.hkma.gov.hk/eng/news-and-media/insight/2026/04/20260410/')]
])}

<h2>6. 新加坡：MAS 一个监管机构，三张相关牌照</h2>
${tbl(['事项', '内容（截至 2026 年公开资料）'], [
  ['DPT 服务', '《支付服务法》（PS Act）把数字支付代币（DPT）服务列为受监管支付服务，牌照分货币兑换、标准支付机构（SPI）、主要支付机构（MPI）三类。' + cite('MAS：Payment Services Act', 'https://www.mas.gov.sg/regulation/acts/payment-services-act')],
  ['DTSP', '《金融服务与市场法》（FSMA）第 9 部分 2025 年 6 月 30 日生效：在新加坡设立、只服务境外客户的数字代币服务提供商也须持牌；MAS 表示门槛很高、一般不会发牌，未持牌者须在该日前停止相关业务。' + cite('MAS：澄清 DTSP 监管制度（2025-06-06）', 'https://www.mas.gov.sg/news/media-releases/2025/mas-clarifies-regulatory-regime-for-digital-token-service-providers')],
  ['稳定币', 'MAS 2023 年 8 月公布单一货币稳定币（SCS）框架，适用于在新加坡发行、锚定新元或 G10 货币的稳定币；只有符合要求的才能称为“MAS 监管稳定币”。' + cite('MAS：Finalises Stablecoin Regulatory Framework（2023）', 'https://www.mas.gov.sg/news/media-releases/2023/mas-finalises-stablecoin-regulatory-framework') + '2026 年 9 月 MAS 就修订 PS Act 以落实该框架发布征询。' + cite('MAS：就稳定币框架立法修订征询（2026）', 'https://www.mas.gov.sg/news/media-releases/2026/mas-consults-on-legislative-amendments-to-implement-stablecoin-regulatory-framework')]
])}

<h2>7. 其他常被问到的法域</h2>
<ul>
  <li><strong>日本</strong>：加密资产交易业者长期在《资金结算法》下向金融厅（FSA）登记。2026 年 7 月，国会通过修订，把加密资产纳入《金融商品交易法》框架，并引入内幕交易禁止等规则；具体施行日期以官方公告为准。${cite('The Block：Japan passes key bill recognizing crypto as financial product（2026-07）', 'https://www.theblock.co/news/regulation/2026-07-15-japan-passes-key-bill-408361')}</li>
  <li><strong>阿联酋（迪拜）</strong>：迪拜虚拟资产监管局（VARA）依据 2022 年第 4 号法律设立，按“活动”发牌（例如经纪交易、托管、交易所服务），每类活动有对应的规则手册；DIFC 金融区不在其范围内。${cite('VARA Rulebooks', 'https://rulebooks.vara.ae/entiresection/17')}</li>
</ul>

<h2>8. 对比与产品决策</h2>
${tbl(['维度', '美国', '欧盟', '香港', '新加坡'], [
  ['主要监管机构', 'FinCEN、SEC、CFTC、各州、OCC 等', 'ESMA、EBA、成员国主管机构', 'SFC（平台）、HKMA（稳定币）', 'MAS'],
  ['交易 / 托管牌照', 'MSB 注册 + 州 MTL（纽约 BitLicense）；证券类另需 SEC 体系', 'CASP 授权，可护照', 'VATP 牌照', 'DPT 服务牌照（MPI）；境外业务另受 DTSP 规则'],
  ['稳定币', 'GENIUS 法案，实施规则制定中', 'EMT / ART，2024-06-30 起', '《稳定币条例》，2025-08-01 起', 'SCS 框架，立法修订征询中'],
  ['质押', 'SEC 工作人员声明覆盖部分协议质押', '视服务性质（托管、收益产品）判断', '持牌平台经事先批准可提供', '以 MAS 对具体服务的要求为准'],
  ['关键时间点', 'GENIUS 最晚 2027-01-18 生效；市场结构法案搁置', 'CASP 过渡期 2026-07-01 结束', '首批稳定币牌照 2026-04', 'DTSP 2025-06-30 生效']
])}
${compare('同一个产品问题，在不同法域的“问法”', [
  { name: '能不能上架代币 X', tag: '上币', kind: 'key', points: ['美国：X 是否证券？平台是否有对应注册？', '欧盟：X 是 EMT / ART 吗？发行方授权了吗？有白皮书吗？', '香港：是否通过 SFC 要求的上币审查？面向零售吗？', '工程：每个代币带“允许法域”列表'] },
  { name: '能不能提供质押', tag: '收益', kind: 'warn', points: ['是自托管协议质押，还是平台代客操作？', '流动性质押、再质押是否被排除在声明之外？', '香港需事先批准', '工程：质押功能按法域独立开关'] },
  { name: '能不能服务 Y 地用户', tag: '地域', kind: 'risk', points: ['Y 地是否要求本地牌照？', '是否主动营销到 Y 地？', 'Y 地是否受制裁？', '工程：按 KYC 居住地 + IP + 设备综合判断'] }
], [
  ['key', '三个问题最后都落到同一个工程模型：<strong>（用户法域 × 产品 × 资产）→ 允许 / 禁止 / 需额外步骤</strong>。'],
  ['flow', '法务团队给出规则表，工程团队把它做成配置，由合规引擎在下单、充值、提币时检查（见 <a href="#m11-6">M07.6 实战</a>）。'],
  ['risk', '只看 IP 做地域限制很容易被绕过；监管更看重 KYC 居住地和是否主动营销。'],
  ['limit', '这张对比只描述框架。具体业务是否需要牌照，要由律师按事实判断。']
])}
<p><strong>算一算（示例）：</strong>一家平台的用户居住地分布为：美国 30%、欧盟 25%、香港 10%、新加坡 5%、其他 30%。平台只持有欧盟 CASP 授权和香港 VATP 牌照。假设“其他”地区中，有 10 个百分点来自要求本地牌照的法域，另有 2 个百分点来自受全面制裁的地区。</p>
${steps([
  '有牌照覆盖的用户：欧盟 25% + 香港 10% = <strong>35%</strong>。',
  '必须停止服务的用户：美国 30% + 新加坡 5%（未持牌）+ 要求本地牌照的 10% + 受制裁地区 2% = <strong>47%</strong>。',
  '剩下 30% − 12% = <strong>18%</strong> 的用户所在法域没有明确要求本地牌照，但要由法务逐个确认。',
  '结论：地域开关不是边角功能。在这个示例里，它直接决定接近一半用户的去留，必须有数据、有审计、能回滚。'
])}
${tryit(`<p><strong>动手练习：</strong>在官方登记册里查一家交易所的牌照状态。</p>
${steps([
  '打开 SFC 的“持牌虚拟资产交易平台名单”页面，记下名单更新时间和平台数量。',
  '打开 ESMA 的 MiCA 页面，找到临时 CASP 登记册（interim MiCA register）的下载链接，用表格软件打开，筛选你选定的一家交易所。',
  '在 MAS 的金融机构名录（Financial Institutions Directory）里搜索同一家交易所，看它持有哪类牌照。',
  '把结果填进一张表：交易所 / 法域 / 牌照类型 / 登记日期 / 来源链接。'
])}
<p>预期结果：你会发现同一家交易所在不同法域往往由<strong>不同的法律实体</strong>持牌。这就是为什么系统里要记录“用户由哪个实体服务”。</p>`)}
${mistakes([
  ['拿到一个国家的牌照，就能服务全球用户。', '牌照只在发牌法域有效。欧盟护照也只覆盖欧盟成员国。'],
  ['美国有一部统一的加密法。', '截至 2026 年公开资料，美国由 FinCEN、州牌照、SEC、CFTC 和 GENIUS 法案多块拼成；市场结构法案在参议院搁置。'],
  ['MiCA 过渡期还没结束，可以先服务欧盟客户。', 'ESMA 声明过渡期最晚于 2026 年 7 月 1 日结束，之后未授权提供服务违反欧盟法律。'],
  ['SEC 工作人员说质押不是证券，所以所有质押产品都没问题。', '声明只覆盖特定协议质押，排除了流动性质押和再质押，且不具法律约束力。'],
  ['地域限制看 IP 就够了。', '监管更看重 KYC 居住地、营销对象和实际服务事实，IP 只是辅助信号。']
])}
${recap([
  '读任何法域都问四个问题：法律、监管机构、牌照、产品规则。',
  '美国是联邦 + 州的双层结构：FinCEN MSB、州 MTL / BitLicense、SEC 与 CFTC 分工；GENIUS 法案最晚 2027-01-18 生效。',
  '欧盟 MiCA：EMT / ART 2024-06-30 起，CASP 2024-12-30 起，过渡期 2026-07-01 结束；授权可护照。',
  '香港：SFC 管 VATP（含质押事先批准），HKMA 管稳定币发行（2025-08-01 生效）；新加坡：MAS 管 DPT、DTSP（2025-06-30）和 SCS 框架。',
  '产品层面统一建模为（用户法域 × 产品 × 资产）→ 允许 / 禁止 / 需额外步骤，由合规引擎执行。'
])}
${quiz([
  { q: '在欧盟，一个锚定单一法币的稳定币属于 MiCA 的哪一类？', o: ['ART 资产参考代币', '其他加密资产', 'EMT 电子货币代币', '金融工具'], a: 2, why: '锚定单一官方货币的是 EMT，发行方必须是信贷机构或电子货币机构。ART 锚定一篮子资产或多种货币。' },
  { q: '截至 2026 年公开资料，美国 GENIUS 法案的生效日如何确定？', o: ['签署当日生效', '签署后 18 个月与最终实施规则发布后 120 天中较早者', '市场结构法案通过后生效', '由各州自行决定'], a: 1, why: '法案规定生效日为 2027 年 1 月 18 日与主要监管机构发布最终规则后 120 天中较早的一个。' },
  { q: '新加坡 FSMA 第 9 部分（DTSP）最主要影响哪类企业？', o: ['在新加坡设立、只服务境外客户的数字代币服务商', '只做软件开发的公司', '持有 PS Act 牌照的本地交易所', '发行治理代币的协议'], a: 0, why: 'MAS 澄清 DTSP 制度针对只服务境外客户的提供商，并表示一般不会发牌；已持 PS Act 等牌照者不受影响。' },
  { q: '香港持牌 VATP 想提供质押服务，按 2025 年 SFC 指引需要什么？', o: ['不需要任何手续', '向 HKMA 申请稳定币牌照', '只要在官网披露即可', '事先获得 SFC 批准，并满足控制提取机制、披露条款等条件'], a: 3, why: 'SFC 2025 年 4 月的通函要求持牌平台事先获批，并保持对提取机制的控制、事先确认条款。' },
  { q: '下面哪项最能说明“地域限制不能只看 IP”？', o: ['IP 查询太慢', '监管看重 KYC 居住地和营销对象，IP 容易被代理改变', 'IP 地址不属于个人数据', '所有国家都禁止看 IP'], a: 1, why: 'IP 是辅助信号，可以被 VPN 改变；法域判断主要基于 KYC 居住地、国籍和实际服务事实。' }
])}
${exercises([
  ['你的平台计划上架一个由美国公司发行的美元稳定币，面向欧盟用户。列出你要向法务确认的三个问题。', '<p>① 这个代币在 MiCA 下是否属于 EMT？② 发行方（或其欧盟实体）是否已获欧盟信贷机构或电子货币机构授权，并发布了白皮书？③ 平台的 CASP 授权范围是否覆盖该服务（例如兑换、托管）？任何一项答案为否，就不能向欧盟用户提供该代币的相关服务。</p>'],
  ['把“香港用户可以质押 ETH，美国纽约用户不可以”翻译成一条配置。', '<p>例如：<code>{ "product": "staking", "asset": "ETH", "allow": ["HK"], "deny": ["US-NY"], "requires": ["sfc_staking_approval"], "version": 3 }</code>。配置要版本化，并记录谁批准、依据哪份法律意见。</p>'],
  ['为什么同一家交易所在不同法域用不同的法律实体持牌？这对数据模型有什么影响？', '<p>牌照通常要求本地设立、本地资本和本地负责人，所以集团会在每个法域设立实体。数据模型要给每个账户记录“服务实体”和“适用规则集”，报表、审计、客户资产隔离都按实体分开。</p>']
])}
${checklist([
  '能用四个问题拆解一个陌生法域的加密监管框架。',
  '能说出美国、欧盟、香港、新加坡的主要监管机构和牌照名称。',
  '能说出 MiCA 三个适用日期和 GENIUS 法案生效规则。',
  '能在官方登记册里查到一家交易所的牌照状态。',
  '能把一条法域规则写成（法域 × 产品 × 资产）配置。'
])}
${terms([
  ['法域', 'Jurisdiction', '一套法律适用的地理和法律范围。'],
  ['货币服务业务', 'Money Services Business (MSB)', '美国 FinCEN 规则下的一类业务，包含货币转移商，需注册并建立反洗钱计划。'],
  ['BitLicense', 'BitLicense (23 NYCRR Part 200)', '纽约州金融服务局发放的虚拟货币业务牌照。'],
  ['加密资产服务提供商', 'CASP', 'MiCA 下提供托管、交易平台、兑换等服务、需获授权的实体。'],
  ['电子货币代币', 'E-Money Token (EMT)', 'MiCA 下锚定单一法币的加密资产。'],
  ['资产参考代币', 'Asset-Referenced Token (ART)', 'MiCA 下锚定一篮子资产或多种货币的加密资产。'],
  ['虚拟资产交易平台', 'VATP', '香港 SFC 发牌监管的中心化虚拟资产交易平台。'],
  ['数字代币服务提供商', 'DTSP', '新加坡 FSMA 第 9 部分规管的、主要服务境外客户的数字代币服务商。']
])}
` });

CUR = 'm11-5';
addCh({ id: 'm11-5', nav: '税务与会计', title: 'M07.5 税务与会计：成本基础、事件与报表', desc: '应税事件、成本基础方法、信息申报与成本基础账本的工程实现', html: `
<h1>M07.5 税务与会计：成本基础、事件与报表</h1>
${meta(['区分常见的链上行为哪些在公开指引里被视为“处置”或“收入”，哪些不是。', '用 FIFO、指定批次、平均成本三种方法算出同一组交易的已实现损益，并解释差异。', '设计一个成本基础账本：交易分类、价格来源、批次（lot）数据模型和对账流程，并说清 1099-DA、CARF、DAC8 对平台数据的要求。'], '前置：<a href="#m11-1">M07.1 合规全景</a>、<a href="#m04-3">M10.4 账本设计</a>')}
${beginner(`<p><strong>应税事件（Taxable event）</strong>：按税法会产生纳税义务的行为，例如卖出、兑换、收到报酬。</p>
<p><strong>处置（Disposal）</strong>：把资产卖掉、换掉、花掉或送人。处置时要计算收益或损失。</p>
<p><strong>成本基础（Cost basis）</strong>：你取得一份资产时付出的成本，通常包括买价和相关手续费。处置所得减成本基础，就是已实现损益。</p>
<p><strong>公允价值（Fair market value，FMV）</strong>：某个时刻资产在市场上的合理价格。收到代币当作收入时，通常按当时的公允价值计。</p>
<p><strong>批次（Lot）</strong>：一次取得的一组同种资产，带有自己的数量、成本和取得时间。</p>
<p><strong>信息申报（Information reporting）</strong>：由平台（经纪商）把用户交易数据报给税务机关，例如美国的 1099-DA 表。</p>`)}
${call('info', '<p><strong>本篇不是税务建议。</strong>文中引用的是美国 IRS、英国 HMRC、OECD 和欧盟委员会公开的指引，用来说明概念和工程需求。个人或公司如何申报，请咨询所在法域的持牌税务专业人士。数字截至 2026 年公开资料。</p>')}

<h2>1. 一句话理解</h2>
${one('税务的核心是两件事：识别“什么时候发生了处置或收入”，以及“这份资产当初花了多少钱”。平台工程要做的，是把每一笔链上和账内流水分类、配上可信的价格，并按规定的方法匹配批次，最后生成可审计的报表。')}
${call('analogy', `<p>想象一家杂货店的仓库。每批进货都贴一张标签：数量、进价、日期。卖出一部分货时，要决定“这次卖的是哪一批”：先进的那批（FIFO）、指定的那批，还是所有货的平均进价。选法不同，利润就不同，但总利润在全部卖完后是一样的。</p>
<p>比喻的局限：链上还有“货自己生出小货”（质押奖励）、“一箱换另一箱”（币币兑换）、“搬到自己另一个仓库”（钱包间转账）这类情况，每一种的税务处理都要单独判断。</p>`)}
${art('一图看懂：成本基础像仓库里的批次，卖出时“卖哪一批”决定利润（示例）', 660, 304, [
  S.text(110, 24, '仓库里的批次', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(330, 24, '一次卖出', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(550, 24, '三种匹配方法，三个答案', { size: 13.5, b: 1, anchor: 'middle' }),
  S.box(10, 44, 200, 58, { k: 'info', t: '批次 A · 2 ETH', s: '单价 2,000 · 成本 4,000\n1 月 5 日买入' }),
  S.box(10, 114, 200, 58, { k: 'info', t: '批次 B · 1 ETH', s: '单价 3,000 · 成本 3,000\n3 月 10 日买入' }),
  S.box(10, 184, 200, 58, { k: 'warn', t: '批次 C · 0.1 ETH', s: '单价 2,500 · 成本 250\n质押奖励，已计入收入' }),
  S.box(265, 88, 130, 110, { k: 'key', t: '卖出 2.5 ETH', s: '单价 3,200\n共 8,000' }),
  S.arrow(212, 73, 263, 118),
  S.arrow(212, 143, 263, 143),
  S.arrow(212, 213, 263, 168),
  S.box(450, 44, 200, 58, { k: 'tint', t: 'FIFO 先进先出', s: 'A 的 2 个 + B 的 0.5 个\n成本 5,500 → 收益 2,500' }),
  S.box(450, 114, 200, 58, { k: 'tint', t: '指定批次', s: '先用 B、C，再用 A 补足\n成本 6,050 → 收益 1,950' }),
  S.box(450, 184, 200, 58, { k: 'tint', t: '平均成本', s: '总成本 7,250 ÷ 3.1 个\n收益约 2,153' }),
  S.arrow(397, 118, 448, 73),
  S.arrow(397, 143, 448, 143),
  S.arrow(397, 168, 448, 213),
  S.text(330, 282, '三种方法的收益不同，但全部卖完后总收益相同：方法只改变收益落在哪一年', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['flow', '每次买入或收到奖励，都在仓库里新增一个批次；卖出时，按所选方法决定从哪些批次出库。'],
  ['key', '同一笔卖出，方法不同，已实现收益就不同：先进先出 2,500，指定批次 1,950，平均成本约 2,153。'],
  ['risk', '质押奖励收到时已按公允价值计入收入，它同时成为批次 C 的成本；成本记成 0 会重复缴税。'],
  ['limit', '方法由法域规则决定，有的允许选择，有的强制，系统要把“方法”做成按法域配置的参数。']
], '左边是三个批次 A、B、C，中间是一次卖出 2.5 个 ETH，右边是先进先出、指定批次、平均成本三种方法各得出的成本和收益，数字均为示例。', 'm11-5')}

<h2>2. 应税事件：哪些行为算处置或收入</h2>
<p>各法域细节不同，但公开指引里有很多共同点。下表按 IRS 和 HMRC 的公开说明整理：</p>
${tbl(['行为', 'IRS（美国）公开说明', 'HMRC（英国）公开说明', '工程上记为'], [
  ['用法币卖出代币', '属于需要申报的数字资产交易' + cite('IRS：Digital assets', 'https://www.irs.gov/filing/digital-assets'), '处置' + cite('HMRC：CRYPTO22100 应税事件', 'https://www.gov.uk/hmrc-internal-manuals/cryptoassets-manual/crypto22100'), 'DISPOSAL'],
  ['一种代币换另一种代币', '属于需要申报的交易', '处置', 'DISPOSAL + ACQUISITION（两条）'],
  ['用代币支付商品或服务', '属于需要申报的交易', '处置', 'DISPOSAL'],
  ['收到质押奖励', '获得“支配和控制”时按公允价值计入收入' + cite('IRS：Rev. Rul. 2023-14（质押奖励）', 'https://www.irs.gov/pub/irs-drop/rr-23-14.pdf'), '按相关所得规则判断', 'INCOME + ACQUISITION'],
  ['硬分叉后的空投、挖矿收入、劳务报酬', '属于需要申报的收入', '按相关所得规则判断', 'INCOME + ACQUISITION'],
  ['用法币买入代币、只持有', '本身不需要报告交易', '不是处置', 'ACQUISITION'],
  ['在自己控制的钱包之间转移', '不是交易（除非用代币支付手续费）', '不是处置', 'TRANSFER（成本基础随资产移动）'],
  ['赠送他人', '另有赠与规则', '一般视为处置（配偶等除外）', 'DISPOSAL 或 GIFT，需人工确认']
])}
${mm('交易分类：一条流水怎么变成税务事件', `
flowchart TB
  RAW["原始流水<br/>链上交易 · 账内成交 · 充提"] --> OWN{"对手方是自己的<br/>另一个地址吗"}
  OWN -->|"是"| TR["TRANSFER<br/>成本基础跟随"]
  OWN -->|"否"| DIR{"资产流入还是流出"}
  DIR -->|"流出"| OUT{"换回了什么"}
  OUT -->|"法币或代币或商品"| DISP["DISPOSAL<br/>计算损益"]:::key
  OUT -->|"什么都没有"| GIFT["GIFT 或 LOSS<br/>人工确认"]:::warn
  DIR -->|"流入"| IN{"付出了什么"}
  IN -->|"法币或代币"| ACQ["ACQUISITION<br/>新建批次"]
  IN -->|"没有付出"| INC["INCOME<br/>奖励 · 空投 · 报酬"]:::key
  INC --> ACQ2["同时新建批次<br/>成本 = 收入金额"]
`, [
  ['flow', '每条流水先判断是不是“自己转给自己”，再看方向和对价。一笔币币兑换会同时产生一条 DISPOSAL 和一条 ACQUISITION。'],
  ['key', '收入类事件（奖励、空投）同时新建一个批次，成本基础等于计入收入的公允价值，避免以后卖出时重复计税。'],
  ['fail', '“自己的地址”识别错误是最常见的错误来源：把转到自己冷钱包误判为处置，会凭空产生收益。'],
  ['limit', 'DeFi 操作（加流动性、借贷、包装代币）在很多法域没有明确规则，系统只能标记为“需人工判断”，不能自动下结论。']
])}

<h2>3. 成本基础方法：同一组交易，三种答案</h2>
${compare('三种常见的批次匹配方法', [
  { name: 'FIFO 先进先出', tag: '最常见的默认', kind: 'info', points: ['卖出时先匹配最早取得的批次', '规则简单，容易审计', '价格长期上涨时，通常匹配到低成本批次，收益更高'] },
  { name: '指定批次', tag: 'Specific ID', kind: 'key', points: ['卖出时明确指定匹配哪一批', '要在处置时或之前做好记录', '美国从 2025 年起按钱包或账户分别追踪成本基础' + cite('IRS：Rev. Proc. 2024-28', 'https://irs.gov/pub/irs-drop/rp-24-28.pdf')] },
  { name: '平均 / 池化', tag: '英国 s104 池', kind: 'warn', points: ['同种代币的成本合并成一个池，按平均成本出库', '英国先按“同日规则”，再按“30 天规则”，剩余进入 s104 池' + cite('HMRC：CRYPTO22200 池化规则', 'https://gov.uk/hmrc-internal-manuals/cryptoassets-manual/crypto22200'), '不是所有法域都允许'] }
], [
  ['key', '方法由法域规则决定，有的允许选择，有的强制。系统要把“方法”做成按用户法域配置的参数，而不是写死。'],
  ['flow', '三种方法用同一份批次数据，只是出库顺序不同。数据模型对了，换方法只是换一个匹配函数。'],
  ['risk', '中途换方法可能需要满足特定条件。系统要记录每次计算用的方法和版本。']
])}
<p><strong>算一算（示例）：</strong>某用户依次进行了下面的交易（价格已含手续费，单位美元）：</p>
${tbl(['日期', '行为', '数量', '单价', '金额'], [
  ['1 月 5 日', '买入 ETH（批次 A）', '2', '2,000', '4,000'],
  ['3 月 10 日', '买入 ETH（批次 B）', '1', '3,000', '3,000'],
  ['5 月 1 日', '收到质押奖励（批次 C，按当时公允价值计收入）', '0.1', '2,500', '250'],
  ['8 月 20 日', '卖出 ETH', '2.5', '3,200', '8,000']
])}
${steps([
  '<strong>FIFO：</strong>先匹配批次 A 的 2 个（成本 4,000），再匹配批次 B 的 0.5 个（成本 1,500）。成本合计 5,500，已实现收益 = 8,000 − 5,500 = <strong>2,500</strong>。剩余：B 0.5 个 + C 0.1 个。',
  '<strong>指定批次（先指定 B 和 C，再用 A 补足）：</strong>B 1 个（3,000）+ C 0.1 个（250）+ A 1.4 个（2,800），成本合计 6,050，已实现收益 = 8,000 − 6,050 = <strong>1,950</strong>。剩余：A 0.6 个。',
  '<strong>平均成本：</strong>总成本 4,000 + 3,000 + 250 = 7,250，总数量 3.1，平均成本 ≈ 2,338.71。卖出 2.5 个的成本 ≈ 5,846.77，已实现收益 ≈ <strong>2,153.23</strong>。',
  '另外：5 月 1 日的质押奖励在收到时已计入收入 250。这 250 同时成为批次 C 的成本，所以卖出时不会重复计税。',
  '检查：三种方法下，“匹配成本 + 剩余批次成本”都等于总成本 7,250（FIFO：5,500 + 1,750；指定批次：6,050 + 1,200；平均：5,846.77 + 1,403.23）。所以方法只改变收益落在哪一年，全部卖完后的总收益相同。'
])}
${exq([['如果把 5 月 1 日的质押奖励错误地记成成本为 0 的批次，会发生什么？', '<p>收到奖励时已经按 250 计入收入；如果批次成本记为 0，以后卖出这 0.1 个时，会再把 250 算作收益，相当于同一笔钱缴两次税。成本基础账本必须让“收入金额 = 新批次成本”。</p>']])}

<h2>4. 信息申报：平台要交哪些数据</h2>
${layers('从平台到税务机关的信息流', [
  { name: '平台账本与链上数据', sub: '交易、充提、奖励、价格', chips: ['用户 ID', '税务居民身份', '成交明细', '成本基础'] },
  { name: '平台申报', sub: '按法域生成报表', chips: ['美国 1099-DA', '欧盟 DAC8', 'CARF 参与法域'], kind: 'key' },
  { name: '税务机关', sub: '接收、比对', chips: ['IRS', '成员国税务机关', '其他 CARF 法域'] },
  { name: '跨境交换', sub: '机关之间自动交换', chips: ['DAC8：首个年度 2026，交换不晚于 2027-09-30', 'CARF：多数承诺法域 2027 起交换'], kind: 'risk' }
], [
  ['flow', '平台按用户的税务居民身份决定报给哪个机关；机关之间再按 CARF / DAC8 自动交换。'],
  ['key', '税务居民身份的自我声明（self-certification）是 KYC 流程的一部分，开户时就要采集。'],
  ['risk', '报表数据和用户自己申报的数据不一致，用户会收到税务机关的问询。平台的成本基础错误会直接变成用户的麻烦。']
], ['生成', '提交', '交换'])}
${tbl(['制度', '要点（截至 2026 年公开资料）'], [
  ['美国 Form 1099-DA', '托管型经纪商自 2025 年 1 月 1 日起的交易报告总收入（gross proceeds），自 2026 年 1 月 1 日起的部分交易还要报告成本基础。' + cite('IRS：经纪商数字资产报告最终规则', 'https://www.irs.gov/newsroom/final-regulations-and-related-IRS-guidance-for-reporting-by-brokers-on-sales-and-exchanges-of-digital-assets') + '“覆盖证券”（covered security）指 2025 年之后在托管账户中取得并一直持有的资产，其成本基础必须报告；合格稳定币年度总收入不超过 10,000 美元、特定 NFT 不超过 600 美元可适用最低限额规则。' + cite('IRS：Instructions for Form 1099-DA', 'https://www.irs.gov/instructions/i1099da')],
  ['美国 DeFi 经纪商规则', '针对非托管（DeFi）经纪商的报告规则已于 2025 年 4 月 10 日经国会审查法案（H.J.Res.25）废除。' + cite('众议院筹款委员会：H.J.Res.25 签署', 'https://waysandmeans.house.gov/2025/04/10/president-trump-signs-ways-means-resolution-overturning-biden-administrations-burdensome-irs-defi-broker-rule')],
  ['OECD CARF', 'OECD 2023 年发布《加密资产报告框架》，规定加密资产服务商收集用户税务居民信息和交易数据，供各国自动交换。' + cite('OECD：CARF 与 CRS 2023 年更新', 'https://www.oecd.org/en/publications/2023/06/international-standards-for-automatic-exchange-of-information-in-tax-matters_ab3a23bc/full-report.html') + '截至 2025 年 11 月，75 个法域作出承诺，多数计划自 2027 年开始交换。' + cite('OECD 全球论坛：新德里会议新闻（2025）', 'https://www.oecd.org/en/networks/global-forum-tax-transparency/news-events/2025/international-community-meets-in-new-delhi-to-reflect-on-latest-advances-in-global-tax-transparency.html')],
  ['欧盟 DAC8', '成员国须于 2025 年 12 月 31 日前转化，2026 年 1 月 1 日起适用；首个报告年度为 2026 年，相关信息交换不晚于 2027 年 9 月 30 日。' + cite('欧盟委员会：DAC8', 'https://taxation-customs.ec.europa.eu/taxation/tax-transparency-cooperation/administrative-co-operation-and-mutual-assistance/directive-administrative-cooperation-dac/dac8_en')]
])}

<h2>5. 工程：成本基础账本</h2>
${mm('成本基础流水线', `
flowchart LR
  SRC["数据源<br/>账内成交 · 链上索引 · 充提"] --> NORM["标准化<br/>统一时间 · 精度 · 资产 ID"]
  NORM --> CLS["分类器<br/>TRANSFER · DISPOSAL<br/>ACQUISITION · INCOME"]
  PX["价格服务<br/>多源 · 带时间戳"] --> VAL["估值<br/>每条事件配公允价值"]
  CLS --> VAL
  VAL --> LOT["批次引擎<br/>按法域方法匹配"]
  LOT --> GL[("损益明细<br/>disposal_match")]
  GL --> RPT["报表<br/>1099-DA · DAC8"]
  GL --> REC["对账<br/>批次余额 = 账户余额"]:::key
  REC -->|"不平"| Q["异常队列<br/>人工处理"]:::risk
`, [
  ['flow', '流水先标准化，再分类、估值、匹配批次，最后生成报表。每一步的输出都落库，便于重算。'],
  ['key', '对账规则：每个用户每种资产的“未出库批次数量之和”必须等于账户余额。不平就不能出报表。'],
  ['fail', '价格缺失（新币、小币、链上无流动性）是第二大错误来源。要记录价格来源和置信度，缺价进人工队列。'],
  ['limit', '平台只能看到用户在本平台的数据。用户从外部转入的资产，平台通常不知道原始成本，只能标记为“成本未知”。']
])}
${code('SQL', `
-- 税务事件：每条流水分类后的结果（金额单位：资产最小单位；法币用 NUMERIC）
CREATE TABLE tax_event (
  id            BIGINT PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  asset         VARCHAR(32) NOT NULL,        -- 例如 ETH、USDC
  kind          VARCHAR(16) NOT NULL,        -- ACQUISITION / DISPOSAL / INCOME / TRANSFER
  qty           NUMERIC(38, 18) NOT NULL,
  fmv_usd       NUMERIC(20, 2),              -- 公允价值；TRANSFER 可为空
  price_source  VARCHAR(64),                 -- 例如 internal_trade、vendor_a_vwap_1m
  occurred_at   TIMESTAMP NOT NULL,
  source_ref    VARCHAR(128) NOT NULL,       -- 账内成交号或 链ID:交易哈希:日志序号
  needs_review  BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (source_ref, kind, asset)           -- 幂等：重放不会重复入账
);

-- 批次：每次取得一行，remaining 随出库减少
CREATE TABLE tax_lot (
  id            BIGINT PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  asset         VARCHAR(32) NOT NULL,
  wallet_id     BIGINT NOT NULL,             -- 按钱包 / 账户分别追踪
  acquired_at   TIMESTAMP NOT NULL,
  qty           NUMERIC(38, 18) NOT NULL,
  remaining     NUMERIC(38, 18) NOT NULL,
  cost_usd      NUMERIC(20, 2),              -- 为空表示成本未知（外部转入）
  origin_event  BIGINT NOT NULL REFERENCES tax_event(id)
);
CREATE INDEX idx_lot_open ON tax_lot (user_id, asset, wallet_id, acquired_at);

-- 匹配结果：一次处置可能匹配多个批次
CREATE TABLE disposal_match (
  disposal_event BIGINT NOT NULL REFERENCES tax_event(id),
  lot_id         BIGINT NOT NULL REFERENCES tax_lot(id),
  qty            NUMERIC(38, 18) NOT NULL,
  cost_usd       NUMERIC(20, 2),
  proceeds_usd   NUMERIC(20, 2) NOT NULL,
  method         VARCHAR(16) NOT NULL,       -- FIFO / SPEC_ID / POOL
  rule_version   INT NOT NULL,               -- 计算规则版本，便于重算和审计
  PRIMARY KEY (disposal_event, lot_id)
);
`)}
${code('GO', `
package lots

import (
	"errors"
	"sort"

	"github.com/shopspring/decimal"
)

type Lot struct {
	ID         int64
	AcquiredAt int64           // Unix 秒
	Remaining  decimal.Decimal // 剩余数量
	CostPerU   decimal.Decimal // 单位成本（美元）
}

type Match struct {
	LotID int64
	Qty   decimal.Decimal
	Cost  decimal.Decimal
}

var ErrInsufficient = errors.New("批次余额不足：账本与账户余额不一致，转人工对账")

// MatchFIFO 按取得时间从早到晚出库。lots 会被原地修改 Remaining。
func MatchFIFO(lots []*Lot, sellQty decimal.Decimal) ([]Match, error) {
	sort.Slice(lots, func(i, j int) bool { return lots[i].AcquiredAt < lots[j].AcquiredAt })
	need := sellQty
	var out []Match
	for _, l := range lots {
		if need.IsZero() {
			break
		}
		if l.Remaining.IsZero() {
			continue
		}
		take := decimal.Min(need, l.Remaining)
		out = append(out, Match{LotID: l.ID, Qty: take, Cost: take.Mul(l.CostPerU)})
		l.Remaining = l.Remaining.Sub(take)
		need = need.Sub(take)
	}
	if need.IsPositive() {
		return nil, ErrInsufficient // 不允许“卖出比持有多”，这通常意味着漏了一条取得记录
	}
	return out, nil
}
`)}
<p>工程要点：</p>
<ul>
  <li><strong>用十进制，不用浮点。</strong>代币有 18 位小数，浮点误差会让对账永远不平（精度问题见 <a href="#m07-4">M03.4 单位与精度</a>）。</li>
  <li><strong>可重算。</strong>规则、价格源、分类结果都会被修正。批次引擎要能从某一天开始整段重算，并保留旧结果供比对。</li>
  <li><strong>价格要有出处。</strong>账内成交优先用成交价；链上事件用带时间戳的多源价格（例如 1 分钟成交量加权价），记录来源和偏差。</li>
  <li><strong>对账三条线</strong>：批次余额 = 账户余额；处置事件数量 = 匹配数量之和；报表汇总 = 明细汇总。思路与 <a href="#m04-8">M10.9 风控、对账与储备金证明</a> 相同。</li>
</ul>

<h2>6. 企业会计：简要了解</h2>
<p>税务和会计是两套规则。税务关心“交多少税”，会计关心“财务报表怎么反映资产”。美国 FASB 的 ASU 2023-08 要求范围内的加密资产按公允价值计量，变动计入当期净利润，适用于 2024 年 12 月 15 日之后开始的财年，允许提前采用。${cite('Deloitte DART：FASB Issues Final Standard on Crypto Assets', 'https://dart.deloitte.com/USDART/home/publications/deloitte/heads-up/2023/fasb-issues-asu-crypto-assets')}对工程的影响：财务系统要能在每个报告期末取到可信的公允价值，并保留价格快照供审计。其他会计准则（例如 IFRS）的处理不同，以所适用准则为准。</p>
${tryit(`<p><strong>动手练习：</strong>用自己的测试地址生成一份 FIFO 损益表。</p>
${steps([
  '在 Etherscan 打开一个你控制的测试网或主网地址，点击交易列表下方的“Download Page Data”导出 CSV（主网需登录）。',
  '在表格软件里给每一行标注 kind：ACQUISITION / DISPOSAL / TRANSFER / INCOME。转给自己另一个地址的标为 TRANSFER。',
  '为每一行填上当时的美元价格，并写明价格来源（例如某交易所的日收盘价）。',
  '用上面的 MatchFIFO 逻辑（或表格公式）算出每次处置的成本和收益，再检查“剩余批次数量 = 当前余额”。'
])}
<p>预期结果：你会得到一张能对平的损益表，并亲身体会到“自己地址识别”和“缺价”是最花时间的两步。</p>`)}
${mistakes([
  ['币换币不卖成法币，就不算处置。', 'IRS 和 HMRC 的公开指引都把一种代币换另一种代币列为需要申报的交易或处置。'],
  ['在自己的钱包之间转账也要算收益。', '转给自己控制的地址不是处置，成本基础随资产移动；但用代币付的手续费可能单独处理。'],
  ['质押奖励卖出时才需要考虑税务。', 'IRS Rev. Rul. 2023-14 认为在获得支配和控制时按公允价值计入收入；奖励批次的成本应等于该收入额。'],
  ['平台发了 1099-DA，用户就不用自己算了。', 'IRS 说明无论是否收到 1099-DA，纳税人都要报告全部数字资产收入和损益；平台看不到外部转入资产的成本。'],
  ['成本基础方法可以随便选。', '方法由法域规则决定，有的强制（例如英国的同日、30 天和 s104 池规则），有的允许在条件下选择。']
])}
${recap([
  '处置（卖出、兑换、支付）计算损益；收入（质押奖励、空投、报酬）按公允价值计入，并同时新建批次。',
  '成本基础方法（FIFO、指定批次、平均 / 池化）只改变收益在年度间的分布，由法域规则决定能用哪种。',
  '美国 1099-DA：2025 年起报总收入，2026 年起对覆盖证券（covered security）报成本基础；DeFi 经纪商规则已于 2025 年废除。',
  'CARF 和 DAC8 让平台按用户税务居民身份采集并申报数据；DAC8 自 2026-01-01 适用。',
  '工程核心：分类、可追溯的价格、批次数据模型、可重算、三条对账线。'
])}
${quiz([
  { q: '按本篇示例（买 2 个 @2,000、1 个 @3,000、奖励 0.1 个 @2,500，卖 2.5 个 @3,200），FIFO 下的已实现收益是多少？', o: ['1,950', '2,153.23', '2,500', '8,000'], a: 2, why: 'FIFO 匹配 A 的 2 个（4,000）和 B 的 0.5 个（1,500），成本 5,500，收益 8,000 − 5,500 = 2,500。1,950 是示例中的指定批次结果，2,153.23 是平均成本结果。' },
  { q: '下面哪一项在 IRS 和 HMRC 公开指引中都<strong>不</strong>被视为处置或需申报的交易？', o: ['用 ETH 换 USDC', '在自己控制的两个钱包之间转移 ETH（不用代币付费）', '用 BTC 买咖啡', '把 ETH 卖成美元'], a: 1, why: '自己控制的地址之间转移不是处置。其余三项都是处置。' },
  { q: '为什么质押奖励批次的成本基础应等于收到时计入收入的金额？', o: ['为了避免以后卖出时对同一笔价值重复计税', '因为税法规定奖励成本为 0', '因为奖励不能卖出', '为了少报收入'], a: 0, why: '收到时已经按公允价值计入收入，这部分价值就是取得成本；记为 0 会在卖出时再算一次。' },
  { q: '欧盟 DAC8 的首个报告年度是哪一年？', o: ['2024', '2025', '2027', '2026'], a: 3, why: '欧盟委员会说明 DAC8 自 2026 年 1 月 1 日起适用，首个报告年度为 2026 年，交换不晚于 2027 年 9 月 30 日。' }
])}
${exercises([
  ['用户从外部钱包转入 1 BTC，平台不知道成本。卖出时系统应该怎么处理？', '<p>在 tax_lot 里把 cost_usd 记为空（成本未知），卖出时照常记录总收入，在报表中按规则标注“成本未提供”（例如 1099-DA 的非覆盖证券可不报成本）。同时在用户界面提示用户自行补充成本记录，并保留补充记录的审计日志。</p>'],
  ['价格服务在某分钟没有某个小币的报价。列出三种处理办法及取舍。', '<p>① 用最近一分钟的价格并标注偏移，简单但可能失真；② 用链上 DEX 的成交价换算，覆盖面广但易被操纵，需设流动性下限；③ 进入人工队列，准确但慢。生产上通常按资产流动性分级：主流币用 ①，长尾币用 ② 加置信度，低置信度转 ③。</p>'],
  ['为什么批次引擎要保存 rule_version？', '<p>规则（分类、价格源、方法）会被修正。保存版本后，可以只重算受影响的区间，并向审计和用户解释“同一笔交易为什么前后两次结果不同”。没有版本，就无法证明报表的来源。</p>']
])}
${checklist([
  '能把一条链上流水分类为 TRANSFER、DISPOSAL、ACQUISITION 或 INCOME。',
  '能用 FIFO、指定批次、平均成本三种方法手算同一组交易的损益。',
  '能说出 1099-DA、CARF、DAC8 各自的要点和关键日期。',
  '能写出 tax_event、tax_lot、disposal_match 三张表并解释每个字段。',
  '能列出成本基础账本的三条对账线。'
])}
${terms([
  ['应税事件', 'Taxable event', '按税法会产生纳税义务的行为，例如处置或取得收入。'],
  ['处置', 'Disposal', '卖出、兑换、花费或赠送资产，需要计算损益。'],
  ['成本基础', 'Cost basis', '取得资产的成本，处置所得减成本基础即为已实现损益。'],
  ['公允价值', 'Fair market value (FMV)', '某时刻资产的合理市场价格。'],
  ['批次', 'Tax lot', '一次取得的一组同种资产，带数量、成本和取得时间。'],
  ['先进先出', 'FIFO', '处置时先匹配最早取得批次的方法。'],
  ['1099-DA', 'Form 1099-DA', '美国经纪商向 IRS 报告用户数字资产处置的表格。'],
  ['加密资产报告框架', 'CARF', 'OECD 制定的加密资产税务信息采集和自动交换标准。'],
  ['DAC8', 'DAC8', '欧盟第八次修订的行政合作指令，把加密资产纳入税务信息自动交换。']
])}
` });

CUR = 'm11-6';
addCh({ id: 'm11-6', nav: '★ 实战：合规引擎', title: 'M07.6 ★ 实战：合规引擎（KYT 评分 + 旅行规则 + 地域限制）', desc: '为交易所或钱包设计并实现充提筛查、规则引擎、旅行规则与案件管理', html: `
<h1>M07.6 ★ 实战：合规引擎（KYT 评分 + 旅行规则 + 地域限制）</h1>
${meta(['设计一个可交付的合规服务：充值与提币筛查流水线、规则引擎、旅行规则消息交换、地域限制、案件管理与审计日志。', '写出数据模型（SQL DDL）、接口定义和 Go 规则求值代码，并给出测试用例清单。', '为合规系统做威胁模型（数据泄露、内部滥用、规避模式），并制定 4–6 周里程碑。'], '前置：<a href="#m11-2">M07.2 KYC、AML 与制裁筛查</a>、<a href="#m11-3">M07.3 旅行规则</a>、<a href="#m11-4">M07.4 主要法域</a>、<a href="#m04-6">M10.7 充值提币与冷热钱包</a>')}
${beginner(`<p><strong>KYT（Know Your Transaction，了解你的交易）</strong>：用链上分析给一个地址或一笔交易打风险分，判断资金是否与制裁、黑客、诈骗、混币器等相关。</p>
<p><strong>风险暴露（Exposure）</strong>：一笔资金有多少比例直接或间接来自某类风险来源。“直接”是对手方就是风险地址；“间接”是隔了几跳。</p>
<p><strong>SDN 名单</strong>：美国 OFAC（海外资产控制办公室）的特别指定国民名单。部分条目包含数字货币地址。</p>
<p><strong>旅行规则（Travel Rule）</strong>：VASP 之间转账时，要随资金一起传递发起人和受益人信息。</p>
<p><strong>案件（Case）</strong>：一次需要人工审核的合规事件，有负责人、证据、决定和时限。</p>
<p><strong>误报率（False positive rate）</strong>：被系统拦下、但人工审核后确认没问题的比例。</p>`)}
${call('info', '<p><strong>本项目是工程练习，不是合规方案或法律意见。</strong>阈值、法域规则和名单来源都是示例，真实系统要由合规负责人和律师确定。本篇只在高层次描述规避模式，用于设计防御。</p>')}

<h2>1. 一句话理解</h2>
${one('合规引擎是一个“在钱动之前做决定”的服务：充值入账前、提币签名前，它收集地址风险、用户画像、法域规则和旅行规则状态，输出“放行 / 人工审核 / 拒绝 / 冻结”，并把每一个决定和证据写进不可篡改的审计日志。')}
${call('analogy', `<p>它像机场的安检加海关。安检（KYT 和制裁筛查）检查你带的东西有没有违禁品；海关（地域和法域规则）检查你能不能去目的地；随行的申报单（旅行规则消息）要和对方机场交接；可疑的旅客被带到单独的房间（案件管理），每一次检查都有记录（审计日志）。</p>
<p>比喻的局限：机场可以让旅客等很久；交易所的用户期望几秒到几分钟内完成提币，所以引擎要快，而且外部服务出故障时要有安全的降级策略。</p>`)}
${art('一图看懂：合规引擎在“钱动之前”收集证据、给出四种决定，并留下不可改的记录', 660, 352, [
  S.text(80, 34, '业务系统', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(265, 34, '合规引擎', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(545, 34, '四种决定', { size: 13.5, b: 1, anchor: 'middle' }),
  S.box(10, 62, 140, 50, { k: 'tint', t: '充值服务', s: '入账前评估' }),
  S.box(10, 122, 140, 50, { k: 'tint', t: '提币服务', s: '签名前评估' }),
  S.box(190, 50, 150, 122, { k: 'tint', t: '特征聚合', s: 'KYT 地址风险\n名单（OFAC SDN）\n用户画像 · 地域\n旅行规则状态' }),
  S.arrow(152, 87, 188, 87),
  S.arrow(152, 147, 188, 147),
  S.arrow(265, 174, 265, 194),
  S.box(190, 196, 150, 66, { k: 'key', t: '规则引擎', s: '版本化规则集\n最严格者胜' }),
  S.line(342, 229, 392, 229),
  S.line(392, 73, 392, 229),
  S.box(440, 50, 210, 46, { k: 'tint', t: '放行 PASS', s: '继续入账或签名' }),
  S.box(440, 106, 210, 46, { k: 'warn', t: '人工审核 REVIEW', s: '进入案件管理' }),
  S.box(440, 162, 210, 46, { k: 'risk', t: '拒绝 REJECT', s: '不放行，钱不动' }),
  S.box(440, 218, 210, 46, { k: 'risk', t: '冻结 FREEZE', s: '如命中制裁名单' }),
  S.arrow(392, 73, 438, 73), S.arrow(392, 129, 438, 129), S.arrow(392, 185, 438, 185), S.arrow(392, 241, 438, 241),
  S.arrow(265, 264, 265, 294),
  S.box(10, 296, 640, 46, { k: 'tint', icon: 'db', t: '审计日志：只追加 · 哈希链', s: '每个决定连同命中的规则、特征快照、规则版本一起记录' })
], [
  ['flow', '业务系统在入账前、签名前同步调用引擎；引擎聚合证据，规则引擎给出一个决定，同时写入审计日志。'],
  ['key', '规则引擎只做“决定”，不直接动钱；动钱的仍然是提币状态机，它按决定进入下一个状态。'],
  ['risk', '决定按“最严格者胜”合并：FREEZE > REJECT > REVIEW > PASS，一条命中制裁的规则就能压过其他放行信号。'],
  ['limit', '本架构针对托管型平台；外部服务（KYT、对手方 VASP）会超时，降级策略要写进规则，不能“全部放行”。']
], '左边是充值服务和提币服务，在动钱之前调用合规引擎；引擎先聚合 KYT 风险、名单、用户画像、地域和旅行规则状态，再由规则引擎给出放行、人工审核、拒绝或冻结，每个决定写入只追加的审计日志。', 'm11-6')}
${recall('<p>充值扫块入账、提币状态机、冷热钱包分层见 <a href="#m04-6">M10.7 充值提币与冷热钱包</a>；通用风控规则引擎（事件 → 特征 → 规则 → 决策）见 <a href="#m04-8">M10.9 风控、对账与储备金证明</a>；资金追踪方法见 <a href="#m05-67">M04.13 链上取证与资金追踪</a>；IVMS101 与旅行规则协议见 <a href="#m11-3">M07.3 旅行规则</a>。本篇把它们组合成一个专门的合规服务。</p>')}

<h2>2. 项目目标与验收标准</h2>
${tbl(['类别', '验收标准（示例）'], [
  ['功能', '充值：入账前完成地址筛查和规则评估；提币：签名前完成筛查、旅行规则交换和地域检查'],
  ['功能', '规则：阈值、法域、名单可配置、可版本化、可灰度；每次决策记录命中规则和特征快照'],
  ['功能', '案件：人工审核队列、四眼审批（两人确认）、SLA 计时、可疑交易报告草稿导出'],
  ['延迟', '同步评估 P99 ≤ 300 ms（不含外部 KYT 调用）；含外部调用 P99 ≤ 1.5 s'],
  ['吞吐', '峰值 500 次评估 / 秒，可水平扩展'],
  ['可用性', '99.95%；KYT 供应商不可用时按降级策略运行，不能“全部放行”'],
  ['名单时效', 'OFAC SDN 等名单发布后 ≤ 1 小时内生效，并有生效记录'],
  ['审计', '审计日志只追加、带哈希链；任何决定可在 ≤ 5 分钟内还原当时的输入和规则版本'],
  ['安全', '个人数据字段级加密；查看 KYC 原件需要理由并留痕']
])}

<h2>3. 需求拆解与用户故事</h2>
${steps([
  '作为<strong>用户</strong>，我提币到另一家交易所时，系统自动完成旅行规则信息交换，不需要我重复填写对方信息（只确认受益人姓名）。',
  '作为<strong>用户</strong>，我从自托管钱包充值超过阈值时，系统引导我证明地址归属（例如签名一段消息），而不是直接冻结。',
  '作为<strong>合规分析师</strong>，我打开一个案件时，能看到地址风险分、暴露路径、用户历史、命中的规则和建议动作。',
  '作为<strong>合规负责人</strong>，我能在不发版的情况下调整阈值，变更经第二人批准，并能回滚。',
  '作为<strong>审计师</strong>，我能导出某一天某个用户的全部决策记录，并验证日志没有被改过。',
  '作为<strong>工程师</strong>，名单更新失败或 KYT 超时会触发告警，系统按预设策略降级。'
])}

<h2>4. 系统架构</h2>
${mm('合规引擎总体架构（1/2）：输入、特征与规则', `
flowchart TB
  subgraph BIZ["业务系统"]
    DEP["充值服务<br/>扫块入账"]
    WD["提币服务<br/>状态机"]
    ACC["账户与 KYC"]
  end
  subgraph CE["合规引擎"]
    API["评估 API<br/>evaluate"]
    FEAT["特征聚合"]
    RULE["规则引擎<br/>版本化规则集"]:::key
    GEO["地域判定"]
  end
  KYT["KYT 供应商<br/>地址风险分"]
  LIST[("名单库<br/>OFAC SDN · 内部黑名单")]
  DEC["决策<br/>放行 · 人工审核 · 拒绝 · 冻结"]
  DEP --> API
  WD --> API
  ACC --> FEAT
  API --> FEAT
  KYT --> FEAT
  LIST --> FEAT
  GEO --> FEAT
  FEAT --> RULE
  RULE --> DEC
`, [
  ['flow', '充值和提币服务在关键节点同步调用 evaluate；引擎聚合 KYT、名单、用户画像和地域，交给规则引擎决策。'],
  ['key', '规则引擎只做“决定”，不直接动钱。动钱的仍然是提币状态机，它根据决策进入下一个状态（见 <a href="#m04-6">M10.7</a>）。'],
  ['fail', 'KYT 供应商是外部依赖，会超时或不可用。降级策略写在规则里，例如“KYT 不可用且金额 ≥ 阈值 → 人工审核”。'],
  ['limit', '本架构针对托管型平台。非托管钱包只能做前端提示和地址筛查，不能代替用户做旅行规则。']
])}
${mm('合规引擎总体架构（2/2）：旅行规则、案件与审计', `
flowchart TB
  WD["提币服务"] --> TR["旅行规则网关<br/>IVMS101"]
  TR <-->|"加密传输"| CP["对手方 VASP"]
  TR -->|"旅行规则状态"| FEAT["特征聚合"]
  FEAT --> RULE["规则引擎"]:::key
  RULE -->|"需人工"| CASE["案件管理"]
  RULE --> AUD[("审计日志<br/>只追加 · 哈希链")]:::risk
  CASE --> AUD
`, [
  ['flow', '提币服务通过旅行规则网关与对手方 VASP 交换信息；对方的回应作为“旅行规则状态”回到特征聚合，再交给规则引擎。'],
  ['fail', '对手方 VASP 是外部依赖，会超时或不响应。降级策略同样写在规则里，具体做法见 <a href="#m11-3">M07.3</a>。'],
  ['risk', '审计日志和 KYC 数据是最敏感的两块：前者被改就失去证明力，后者泄露就是重大事故。']
])}
${mm('提币调用链：筛查 → 旅行规则 → 决策 → 签名', `
sequenceDiagram
  participant U as 用户
  participant W as 提币服务
  participant C as 合规引擎
  participant K as KYT 供应商
  participant T as 旅行规则网关
  participant V as 对手方 VASP
  U->>W: 提交提币 地址和金额
  W->>C: evaluate 阶段 pre_check
  C->>K: 查询目标地址风险
  K-->>C: 风险分和类别
  C-->>W: 需要旅行规则 目标属于某 VASP
  W->>T: 发送 IVMS101 发起人和受益人信息
  T->>V: 加密传输
  V-->>T: 受益人姓名匹配 接受
  T-->>C: 旅行规则状态 ACCEPTED
  W->>C: evaluate 阶段 final
  C-->>W: 决策 PASS 附规则版本
  W->>W: 进入签名和广播
`, [
  ['flow', '提币分两次评估：pre_check 决定要不要做旅行规则，final 在旅行规则完成后给出最终决定。'],
  ['key', '旅行规则在<strong>转账之前</strong>完成：对方拒绝或受益人不匹配，就不签名，钱不会离开平台。'],
  ['fail', '对手方 VASP 不响应时，按法域规则决定：等待、转人工，或在允许的情况下先转账、事后补发（各法域要求不同，见 <a href="#m11-3">M07.3</a>）。'],
  ['limit', '目标地址属于哪个 VASP，依赖 KYT 供应商的地址归属数据或旅行规则网络的地址发现，可能不准确。']
])}
${mm('案件状态机', `
stateDiagram-v2
  state "已创建 Open" as Open
  state "已分配 Assigned" as Assigned
  state "调查中 Investigating" as Investigating
  state "待复核 PendingApproval" as PendingApproval
  state "已放行 Released" as Released
  state "已拒绝 Rejected" as Rejected
  state "已上报 Reported" as Reported
  [*] --> Open
  Open --> Assigned: 分配给分析师
  Assigned --> Investigating: 开始调查
  Investigating --> PendingApproval: 提出建议
  PendingApproval --> Investigating: 复核人退回
  PendingApproval --> Released: 第二人批准放行
  PendingApproval --> Rejected: 第二人批准拒绝
  Rejected --> Reported: 需要报告时生成报告草稿
  Released --> [*]
  Reported --> [*]
  Rejected --> [*]
`, [
  ['key', '“提出建议”的人和“批准”的人必须不同（四眼原则），系统强制校验，不靠流程约定。'],
  ['flow', '每次状态变化写一条审计记录：谁、何时、理由、附件哈希。'],
  ['fail', '案件超过 SLA 未处理要升级告警；资金冻结期间用户会投诉，需要客服话术和时限。'],
  ['risk', '分析师可以看到大量个人数据，这是内部滥用的主要入口（见第 10 节威胁模型）。']
])}

<h2>5. 技术选型</h2>
${tbl(['组件', '选型（示例）', '备选', '理由'], [
  ['服务语言', 'Go', 'Java / Rust', '与前面钱包、交易所模块一致；并发和部署简单'],
  ['主数据库', 'PostgreSQL', 'MySQL', '事务、JSONB 存特征快照、行级安全'],
  ['缓存', 'Redis', '本地 LRU', '地址风险分短期缓存、名单布隆过滤器、计数器'],
  ['消息', 'Kafka', 'NATS', '决策事件下游消费（报表、监控、数据仓库）'],
  ['规则表达', '自研 JSON 条件树', 'CEL（Common Expression Language）/ OPA', 'JSON 便于后台编辑和审计；复杂场景可换 CEL'],
  ['KYT', '商业链上分析供应商 API', '自建图分析', '覆盖面和地址归属数据难以自建；内部名单作为补充'],
  ['旅行规则', '接入一个或多个旅行规则网络（TRP、TRISA 等）', '自建点对点', '对手方覆盖取决于网络；消息格式统一用 IVMS101' + cite('interVASP：IVMS 101 标准', 'https://intervasp.org/')],
  ['审计日志', 'PostgreSQL 只追加表 + 哈希链 + 定期锚定到对象存储（WORM）', '专用账本数据库', '实现简单，可独立验证'],
  ['密钥与加密', 'KMS 信封加密', 'HashiCorp Vault', '个人数据字段级加密，密钥轮换']
])}

<h2>6. 数据模型</h2>
${code('SQL', `
-- 名单条目：OFAC SDN 中的数字货币地址、内部黑名单、白名单等
CREATE TABLE watchlist_entry (
  id           BIGINT PRIMARY KEY,
  list_name    VARCHAR(32) NOT NULL,      -- OFAC_SDN / INTERNAL_BLOCK / INTERNAL_ALLOW
  chain        VARCHAR(16) NOT NULL,      -- ETH / BTC / TRX ...
  address      VARCHAR(128) NOT NULL,     -- 统一小写；BTC 保持原样
  ref          VARCHAR(128),              -- 例如 SDN 条目编号
  added_at     TIMESTAMP NOT NULL,
  removed_at   TIMESTAMP,                 -- 名单会删除条目，保留历史而不是物理删除
  list_version VARCHAR(64) NOT NULL,      -- 来源文件的发布日期或哈希
  UNIQUE (list_name, chain, address, list_version)
);
CREATE INDEX idx_watch_addr ON watchlist_entry (chain, address) WHERE removed_at IS NULL;

-- 地址风险缓存：来自 KYT 供应商
CREATE TABLE address_risk (
  chain        VARCHAR(16) NOT NULL,
  address      VARCHAR(128) NOT NULL,
  score        INT NOT NULL,              -- 0-100，越高越危险（供应商分数归一化后）
  categories   JSONB NOT NULL,            -- 例如 [{"cat":"sanctions","direct":true,"pct":0.0}]
  owner_vasp   VARCHAR(64),               -- 地址归属的 VASP（若已知）
  vendor       VARCHAR(32) NOT NULL,
  fetched_at   TIMESTAMP NOT NULL,
  PRIMARY KEY (chain, address, vendor)
);

-- 规则集：整套版本化发布
CREATE TABLE rule_set (
  version      INT PRIMARY KEY,
  body         JSONB NOT NULL,            -- 规则列表
  status       VARCHAR(16) NOT NULL,      -- DRAFT / APPROVED / ACTIVE / RETIRED
  created_by   VARCHAR(64) NOT NULL,
  approved_by  VARCHAR(64),               -- 必须与 created_by 不同
  activated_at TIMESTAMP,
  CHECK (approved_by IS NULL OR approved_by <> created_by)
);

-- 每次评估的决策
CREATE TABLE decision (
  id           BIGINT PRIMARY KEY,
  subject_type VARCHAR(16) NOT NULL,      -- DEPOSIT / WITHDRAWAL
  subject_id   VARCHAR(64) NOT NULL,      -- 充值或提币单号
  stage        VARCHAR(16) NOT NULL,      -- pre_check / final
  user_id      BIGINT NOT NULL,
  result       VARCHAR(16) NOT NULL,      -- PASS / REVIEW / REJECT / FREEZE
  rule_version INT NOT NULL REFERENCES rule_set(version),
  hits         JSONB NOT NULL,            -- 命中的规则 ID 和原因
  features     JSONB NOT NULL,            -- 特征快照（不含明文个人数据）
  created_at   TIMESTAMP NOT NULL,
  UNIQUE (subject_type, subject_id, stage) -- 幂等
);

-- 旅行规则消息
CREATE TABLE travel_rule_msg (
  id            BIGINT PRIMARY KEY,
  withdrawal_id VARCHAR(64) NOT NULL,
  direction     VARCHAR(8) NOT NULL,      -- OUT / IN
  counterparty  VARCHAR(64),              -- 对手方 VASP 标识
  protocol      VARCHAR(16) NOT NULL,     -- TRP / TRISA / ...
  payload_enc   BYTEA NOT NULL,           -- IVMS101 载荷，KMS 信封加密
  status        VARCHAR(16) NOT NULL,     -- SENT / ACCEPTED / REJECTED / TIMEOUT / UNHOSTED
  updated_at    TIMESTAMP NOT NULL
);

-- 案件与审计日志
CREATE TABLE compliance_case (
  id           BIGINT PRIMARY KEY,
  decision_id  BIGINT NOT NULL REFERENCES decision(id),
  state        VARCHAR(20) NOT NULL,
  assignee     VARCHAR(64),
  proposer     VARCHAR(64),
  approver     VARCHAR(64),
  sla_due_at   TIMESTAMP NOT NULL,
  CHECK (approver IS NULL OR approver <> proposer)
);

CREATE TABLE audit_log (
  seq          BIGINT PRIMARY KEY,        -- 单调递增
  actor        VARCHAR(64) NOT NULL,      -- 用户、服务或分析师
  action       VARCHAR(64) NOT NULL,      -- decision.create / case.approve / pii.view ...
  object_ref   VARCHAR(128) NOT NULL,
  detail       JSONB NOT NULL,
  prev_hash    CHAR(64) NOT NULL,
  hash         CHAR(64) NOT NULL,         -- sha256(prev_hash || 本行内容)
  created_at   TIMESTAMP NOT NULL
);
-- 数据库账号层面只授予 audit_log 的 INSERT 和 SELECT，不授予 UPDATE / DELETE
`)}

<h2>7. 接口设计</h2>
${code('JSON', `
// POST /v1/compliance/evaluate
{
  "subject_type": "WITHDRAWAL",
  "subject_id": "wd_20261122_000123",
  "stage": "pre_check",
  "user_id": 88001,
  "chain": "ETH",
  "asset": "USDC",
  "amount": "12500.00",
  "amount_usd": "12500.00",
  "to_address": "0xabc...def",
  "context": { "ip_country": "SG", "device_id": "d-77" }
}

// 200 OK
{
  "decision_id": 9000123,
  "result": "REVIEW",
  "rule_version": 42,
  "hits": [
    { "rule": "TR_REQUIRED_VASP", "action": "TRAVEL_RULE", "reason": "目标地址归属其他 VASP，金额超过本法域阈值" },
    { "rule": "KYT_HIGH_INDIRECT", "action": "REVIEW", "reason": "间接暴露于高风险类别 ≥ 阈值" }
  ],
  "required_steps": ["travel_rule_out"],
  "case_id": 5501
}
`)}
${tbl(['接口', '说明'], [
  ['<code>POST /v1/compliance/evaluate</code>', '同步评估；按 (subject_type, subject_id, stage) 幂等'],
  ['<code>POST /v1/travel-rule/outbound</code>', '为某提币发起旅行规则消息；返回消息 ID 和状态'],
  ['<code>POST /v1/travel-rule/inbound</code>', '接收对手方消息（由旅行规则网络回调），与待入账的充值匹配'],
  ['<code>POST /v1/address-ownership/proofs</code>', '用户为自托管地址提交签名证明（例如 EIP-191 签名消息）'],
  ['<code>GET /v1/cases?state=Open</code> / <code>POST /v1/cases/{id}/transition</code>', '案件查询与状态流转；transition 校验四眼原则'],
  ['<code>POST /v1/rulesets</code> / <code>POST /v1/rulesets/{v}/approve</code> / <code>/activate</code>', '规则集草稿、批准、激活；激活支持按用户百分比灰度'],
  ['事件 <code>compliance.decision.v1</code>', 'Kafka 主题；下游报表、监控、数据仓库消费']
])}

<h2>8. 核心代码</h2>
${art('一图看懂：代码结构：features 备料，rules 判决，audit 留痕', 660, 300, [
  S.text(100, 28, '注入的依赖（接口）', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(340, 28, '核心包', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(570, 28, '输出', { size: 13.5, b: 1, anchor: 'middle' }),
  S.box(10, 46, 180, 56, { k: 'idle', dash: 1, t: 'KYTClient', s: '地址风险（外部供应商）', mono: 1, ts: 13 }),
  S.box(10, 118, 180, 56, { k: 'idle', dash: 1, t: 'Watchlist', s: '名单匹配', mono: 1, ts: 13 }),
  S.box(10, 190, 180, 56, { k: 'idle', dash: 1, t: 'Policy', s: '阈值与法域参数', mono: 1, ts: 13 }),
  S.box(240, 46, 200, 84, { k: 'tint', t: 'features.Build()', s: '归一化地址，汇总 KYT、\n名单、画像、地域\n返回特征 map', mono: 1, ts: 13 }),
  S.box(240, 170, 200, 84, { k: 'key', t: 'rules.Evaluate(rs, f)', s: 'RuleSetV42 · Cond 条件树\n返回 Result{Action, Hits}', mono: 1, ts: 13 }),
  S.arrow(192, 74, 238, 80), S.arrow(192, 146, 238, 100), S.arrow(192, 218, 238, 118),
  S.arrow(340, 132, 340, 168, { label: '特征' }),
  S.box(490, 46, 160, 84, { k: 'tint', t: 'audit.Hash(Entry)', s: 'PrevHash 串成链\nVerify 校验', mono: 1, ts: 13 }),
  S.box(490, 170, 160, 84, { k: 'tint', t: '调用方', s: '提币服务按 Action\n放行 / 审核 / 拒绝 / 冻结', ts: 13 }),
  S.route([[442, 190], [466, 190], [466, 88], [488, 88]]),
  S.arrow(442, 232, 488, 232),
  S.text(330, 286, '规则集是数据，存库并版本化；代码里不出现具体国家代码和阈值', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '依赖通过接口注入：features.Build 汇总证据，rules.Evaluate 求值，结果既交给调用方，也写入 audit 哈希链。'],
  ['key', 'rules 包只认特征 map 和规则，不认识 KYT 供应商，所以换供应商、换规则集都不用改求值代码。'],
  ['risk', '审计记录用 sha256(prev_hash ‖ …) 串起来，Verify 能找出被改过的位置。'],
  ['limit', '图中包名和函数名取自本篇核心代码；目录布局以你自己的仓库为准。']
], '三列：左边是注入的三个接口 KYTClient、Watchlist、Policy；中间 features.Build 汇总特征，rules.Evaluate 求值得出决定；右边决定交给调用方，并通过 audit 包写入哈希链。', 'm11-6')}
<h3>8.1 规则与求值</h3>
<p>规则是一棵条件树：叶子比较某个特征，内部节点用 all / any 组合。决策按“最严格者胜”合并：FREEZE &gt; REJECT &gt; REVIEW &gt; PASS。</p>
${code('GO', `
package rules

import (
	"fmt"
	"strings"
)

type Action int

const (
	Pass Action = iota
	Review
	Reject
	Freeze
)

func (a Action) String() string { return [...]string{"PASS", "REVIEW", "REJECT", "FREEZE"}[a] }

// Cond 是条件树的一个节点：要么是叶子（Feature/Op/Value），要么是 All/Any 组合
type Cond struct {
	All     []Cond
	Any     []Cond
	Feature string
	Op      string // eq / neq / gte / lte / in
	Value   any
}

type Rule struct {
	ID       string
	Priority int
	When     Cond
	Action   Action
	Steps    []string // 额外步骤，例如 "travel_rule_out"
	Reason   string
}

type Features map[string]any

type Hit struct {
	RuleID string
	Action Action
	Reason string
}

type Result struct {
	Action Action
	Hits   []Hit
	Steps  []string
}

// Evaluate 执行全部规则，合并为最严格的动作。缺失的特征视为“不满足”，
// 但缺失本身也可以被规则检查（例如 kyt.available == false）。
func Evaluate(rs []Rule, f Features) (Result, error) {
	res := Result{Action: Pass}
	for _, r := range rs {
		ok, err := match(r.When, f)
		if err != nil {
			return Result{}, fmt.Errorf("rule %s: %w", r.ID, err)
		}
		if !ok {
			continue
		}
		res.Hits = append(res.Hits, Hit{RuleID: r.ID, Action: r.Action, Reason: r.Reason})
		res.Steps = append(res.Steps, r.Steps...)
		if r.Action > res.Action {
			res.Action = r.Action // 最严格者胜
		}
	}
	return res, nil
}

func match(c Cond, f Features) (bool, error) {
	switch {
	case len(c.All) > 0:
		for _, x := range c.All {
			ok, err := match(x, f)
			if err != nil || !ok {
				return false, err
			}
		}
		return true, nil
	case len(c.Any) > 0:
		for _, x := range c.Any {
			ok, err := match(x, f)
			if err != nil {
				return false, err
			}
			if ok {
				return true, nil
			}
		}
		return false, nil
	}
	v, present := f[c.Feature]
	if !present {
		return false, nil
	}
	switch c.Op {
	case "eq":
		return fmt.Sprint(v) == fmt.Sprint(c.Value), nil
	case "neq":
		return fmt.Sprint(v) != fmt.Sprint(c.Value), nil
	case "gte", "lte":
		a, ok1 := toFloat(v)
		b, ok2 := toFloat(c.Value)
		if !ok1 || !ok2 {
			return false, fmt.Errorf("feature %s 不是数字", c.Feature)
		}
		if c.Op == "gte" {
			return a >= b, nil
		}
		return a <= b, nil
	case "in":
		list, ok := c.Value.([]string)
		if !ok {
			return false, fmt.Errorf("in 需要字符串列表")
		}
		s := strings.ToUpper(fmt.Sprint(v))
		for _, x := range list {
			if s == strings.ToUpper(x) {
				return true, nil
			}
		}
		return false, nil
	}
	return false, fmt.Errorf("未知操作符 %s", c.Op)
}

func toFloat(v any) (float64, bool) {
	switch n := v.(type) {
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	case float64:
		return n, true
	}
	return 0, false
}
`)}
${call('info', '<p>金额比较在示例里用了 float64，只用于“是否超过阈值”的判断。入账、扣款等金额计算必须用十进制类型（见 <a href="#m07-4">M03.4 单位与精度</a>）。生产中可以把金额特征统一换算成整数美分再比较。</p>')}
<h3>8.2 规则集示例</h3>
${code('GO', `
// 规则集 v42（示例阈值，真实数值由合规负责人确定）
var RuleSetV42 = []Rule{
	{ID: "SANCTIONS_DIRECT", Priority: 1000, Action: Freeze, Reason: "地址命中制裁名单",
		When: Cond{Any: []Cond{
			{Feature: "addr.on_ofac_sdn", Op: "eq", Value: true},
			{Feature: "addr.on_internal_block", Op: "eq", Value: true},
		}}},
	{ID: "GEO_SANCTIONED_REGION", Priority: 900, Action: Reject, Reason: "用户居住地或访问地属于受全面制裁地区",
		When: Cond{Any: []Cond{
			{Feature: "user.residence", Op: "in", Value: []string{"CU", "IR", "KP"}}, // 示例，按最新名单配置
			{Feature: "ctx.ip_region_blocked", Op: "eq", Value: true},
		}}},
	{ID: "PRODUCT_NOT_ALLOWED", Priority: 800, Action: Reject, Reason: "该资产或产品不对用户所在法域开放",
		When: Cond{Feature: "policy.asset_allowed", Op: "eq", Value: false}},
	{ID: "KYT_HIGH_DIRECT", Priority: 700, Action: Reject, Reason: "直接暴露于高风险类别",
		When: Cond{All: []Cond{
			{Feature: "kyt.score", Op: "gte", Value: 90},
			{Feature: "kyt.direct_high_risk", Op: "eq", Value: true},
		}}},
	{ID: "KYT_HIGH_INDIRECT", Priority: 600, Action: Review, Reason: "间接暴露于高风险类别 ≥ 阈值",
		When: Cond{Feature: "kyt.indirect_high_risk_pct", Op: "gte", Value: 0.10}},
	{ID: "KYT_UNAVAILABLE_LARGE", Priority: 500, Action: Review, Reason: "KYT 不可用且金额较大，降级为人工",
		When: Cond{All: []Cond{
			{Feature: "kyt.available", Op: "eq", Value: false},
			{Feature: "tx.amount_usd", Op: "gte", Value: 1000},
		}}},
	{ID: "TR_REQUIRED_VASP", Priority: 400, Action: Pass, Steps: []string{"travel_rule_out"},
		Reason: "目标地址归属其他 VASP，金额超过本法域阈值",
		When: Cond{All: []Cond{
			{Feature: "addr.owner_is_vasp", Op: "eq", Value: true},
			{Feature: "tx.over_tr_threshold", Op: "eq", Value: true},
		}}},
	{ID: "UNHOSTED_OWNERSHIP", Priority: 300, Action: Review, Steps: []string{"ownership_proof"},
		Reason: "自托管地址、金额超过验证阈值、尚无归属证明",
		When: Cond{All: []Cond{
			{Feature: "addr.owner_is_vasp", Op: "eq", Value: false},
			{Feature: "tx.over_unhosted_threshold", Op: "eq", Value: true},
			{Feature: "addr.ownership_proven", Op: "eq", Value: false},
		}}},
}
`)}
<p>阈值从哪来：FATF 标准允许各国对旅行规则设置 USD/EUR 1,000 的最低门槛；${cite('Ropes & Gray：Regulating the Illicit Use of Virtual Assets（FATF 2021 指引解读）', 'https://www.ropesgray.com/en/newsroom/alerts/2022/january/regulating-the-illicit-use-of-virtual-assets-what-to-look-for-in-2022')}欧盟 TFR 对 CASP 之间的加密资产转账不设门槛，并要求在与自托管地址之间超过 1,000 欧元的转账中核实地址是否由客户拥有或控制。${cite('EUR-Lex：Regulation (EU) 2023/1113 (TFR)', 'https://eur-lex.europa.eu/eli/reg/2023/1113/oj/eng')}所以 <code>tx.over_tr_threshold</code> 和 <code>tx.over_unhosted_threshold</code> 不是常量，而是由“服务实体 + 法域”决定的特征。</p>

<h3>8.3 特征聚合与名单匹配</h3>
${code('GO', `
package features

import (
	"context"
	"strings"
	"time"
)

type KYTClient interface {
	// AddressRisk 返回归一化后的风险数据；实现内部负责超时与重试
	AddressRisk(ctx context.Context, chain, addr string) (Risk, error)
}

type Risk struct {
	Score           int
	DirectHighRisk  bool
	IndirectHighPct float64
	OwnerVASP       string
}

type Watchlist interface {
	Contains(list, chain, addr string) bool // 内存中的集合 + 布隆过滤器，按版本原子替换
}

type Input struct {
	Chain, Addr, Residence, ServiceEntity string
	AmountUSD                             float64
}

func Build(ctx context.Context, in Input, k KYTClient, wl Watchlist, pol Policy) map[string]any {
	addr := normalize(in.Chain, in.Addr)
	f := map[string]any{
		"addr.on_ofac_sdn":      wl.Contains("OFAC_SDN", in.Chain, addr),
		"addr.on_internal_block": wl.Contains("INTERNAL_BLOCK", in.Chain, addr),
		"user.residence":        in.Residence,
		"tx.amount_usd":         in.AmountUSD,
		"tx.over_tr_threshold":  in.AmountUSD >= pol.TravelRuleThreshold(in.ServiceEntity),
		"tx.over_unhosted_threshold": in.AmountUSD > pol.UnhostedThreshold(in.ServiceEntity),
	}
	// 外部调用设置独立超时；失败时不抛错，而是写入 kyt.available=false 交给规则决定
	kctx, cancel := context.WithTimeout(ctx, 800*time.Millisecond)
	defer cancel()
	r, err := k.AddressRisk(kctx, in.Chain, addr)
	if err != nil {
		f["kyt.available"] = false
		return f
	}
	f["kyt.available"] = true
	f["kyt.score"] = r.Score
	f["kyt.direct_high_risk"] = r.DirectHighRisk
	f["kyt.indirect_high_risk_pct"] = r.IndirectHighPct
	f["addr.owner_is_vasp"] = r.OwnerVASP != ""
	return f
}

// normalize：EVM 地址统一小写后比较，避免大小写校验和导致漏匹配
func normalize(chain, a string) string {
	if chain == "ETH" || chain == "BSC" || chain == "POLYGON" {
		return strings.ToLower(a)
	}
	return a
}

type Policy interface {
	TravelRuleThreshold(entity string) float64
	UnhostedThreshold(entity string) float64
}
`)}
<p>名单来源：OFAC 可能在 SDN 条目中列出数字货币地址，但明确说明这些地址“不太可能是完整的”，持有被制裁方财产的人应冻结并报告。${cite('OFAC：FAQ 562', 'https://ofac.treasury.gov/faqs/562')}OFAC 网站的名单搜索工具不支持按数字货币地址查询，所以要下载名单文件并自行解析。${cite('OFAC：FAQ 594', 'https://ofac.treasury.gov/faqs/594')}名单也会删除条目：例如 2025 年 3 月 21 日，财政部将 Tornado Cash 及相关地址移出 SDN 名单。${cite('美国财政部：Tornado Cash Delisting', 'https://home.treasury.gov/news/press-releases/sb0057')}所以名单表要保留 added_at / removed_at 和版本，而不是覆盖写。</p>
${call('warn', `<p>只依赖 SDN 上列出的地址是不够的。被制裁实体会更换地址（例如 2025 年 8 月 OFAC 再次制裁 Garantex 并制裁其后继平台 Grinex${cite('美国财政部：制裁 Garantex 与 Grinex（2025-08-14）', 'https://home.treasury.gov/news/press-releases/sb0225')}），所以要叠加 KYT 供应商的归属数据和间接暴露分析。地域方面，受全面制裁的国家和地区以 OFAC 当前公布为准，例如叙利亚制裁计划已于 2025 年 6 月 30 日的行政令后终止。${cite('OFAC：Changes to Syria Sanctions Program', 'https://ofac.treasury.gov/sanctions-programs-and-country-information/syria-sanctions-inactive-and-archived')}地域列表要配置化，不能写死在代码里。</p>`)}

<h3>8.4 审计日志哈希链</h3>
${code('GO', `
package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
)

type Entry struct {
	Seq      int64
	Actor    string
	Action   string
	Object   string
	Detail   json.RawMessage
	PrevHash string
}

// Hash 计算本条记录的哈希：sha256(prev_hash || seq || actor || action || object || detail)
// 任何一条被改，后面所有 hash 都对不上；定期把最新 hash 写入 WORM 存储作为锚点。
func Hash(e Entry) string {
	h := sha256.New()
	h.Write([]byte(e.PrevHash))
	b, _ := json.Marshal([]any{e.Seq, e.Actor, e.Action, e.Object, e.Detail})
	h.Write(b)
	return hex.EncodeToString(h.Sum(nil))
}

// Verify 从某个已知锚点开始逐条验证
func Verify(anchor string, es []Entry, hashes []string) (int, bool) {
	prev := anchor
	for i, e := range es {
		if e.PrevHash != prev || Hash(e) != hashes[i] {
			return i, false // 返回第一条不一致的位置
		}
		prev = hashes[i]
	}
	return len(es), true
}
`)}
<p><strong>算一算（示例）：</strong>估算审核团队规模。每天 40,000 笔提币，规则把 2% 送进人工审核。</p>
${steps([
  '每天进入审核的案件：40,000 × 2% = <strong>800</strong> 件。',
  '人工确认其中 760 件无问题、40 件拒绝或上报。误报率 = 760 ÷ 800 = <strong>95%</strong>（审核队列里的误报比例；合规系统里这个比例很高是常见现象，目标是在不漏报的前提下降低）。',
  '每件平均处理 6 分钟：800 × 6 = 4,800 分钟 = <strong>80 小时</strong>人工 / 天。按每人每天有效 6 小时，需要约 <strong>14 人</strong>。',
  '如果把 KYT_HIGH_INDIRECT 的阈值从 10% 调到 15%，审核比例降到 1.2%：40,000 × 1.2% = 480 件，需要 480 × 6 ÷ 60 ÷ 6 ≈ <strong>8 人</strong>。',
  '结论：调阈值直接影响人力成本，但也可能漏掉真实风险。所以阈值变更必须走“回测 + 第二人批准 + 灰度”，并在变更后监控上报数量是否异常下降。'
])}

<h2>9. 测试策略</h2>
${tbl(['层级', '用例（示例）'], [
  ['单元', '条件树：all / any 嵌套、缺失特征、未知操作符报错；动作合并“最严格者胜”；四眼校验 proposer ≠ approver'],
  ['单元', '地址规范化：EVM 大小写混合地址能命中小写名单；BTC 地址不被错误改写'],
  ['名单', '解析 OFAC 名单文件：新增、删除、同一地址多条目；版本原子切换（切换期间不出现“空名单”）'],
  ['集成', '提币全链路：pre_check → 旅行规则 ACCEPTED → final PASS → 签名；对手方 REJECTED → 不签名'],
  ['集成', '充值：入账前命中 SDN → 资金进入隔离账户、生成案件，不进入用户可用余额'],
  ['降级', 'KYT 超时：小额按规则放行并记录 kyt.available=false；大额进入人工；不允许“全部放行”'],
  ['回测', '用过去 90 天的真实特征快照重放新规则集，比较 PASS / REVIEW / REJECT 分布差异，超过阈值需额外审批'],
  ['压测', '500 次 / 秒持续 30 分钟，P99 满足验收标准；名单 10 万条时匹配仍为 O(1)'],
  ['安全', '分析师账号越权访问其他案件 → 拒绝并留痕；直接 UPDATE audit_log → 数据库拒绝；哈希链篡改可被 Verify 发现']
])}
${tryit(`<p><strong>动手练习：</strong>用真实名单文件测试你的名单解析器。</p>
${steps([
  '在 OFAC 的 Sanctions List Service 页面下载 SDN 名单文件（XML 格式）。',
  '写一个小脚本，提取所有“Digital Currency Address”类特征，按币种分组统计数量。',
  '把结果导入 watchlist_entry 表，list_version 记为文件发布日期。',
  '在 Etherscan 上打开其中一个 ETH 地址（只查看，不交互），确认你的规范化逻辑能匹配浏览器上显示的大小写形式。',
  '用上面的 Evaluate 写一个单元测试：输入这个地址，期望结果为 FREEZE，命中 SANCTIONS_DIRECT。'
])}
<p>预期结果：你得到按币种分组的地址数量，以及一个通过的单元测试。注意：这些地址只用于测试筛查，不要向它们发送任何资产。</p>`)}

<h2>10. 部署运维与安全</h2>
<h3>10.1 环境与配置</h3>
<ul>
  <li><strong>环境</strong>：开发、预发、生产三套；预发接 KYT 供应商的沙箱和旅行规则网络的测试网。</li>
  <li><strong>配置</strong>：规则集、法域阈值、地域列表全部存库并版本化；代码里不出现具体国家代码和阈值。</li>
  <li><strong>密钥</strong>：KYT API 密钥、旅行规则网络证书放在 KMS / Vault，按服务身份发放，定期轮换。</li>
  <li><strong>名单同步</strong>：定时任务拉取名单，校验签名或哈希，写入新版本后原子切换；失败时保留旧版本并告警。</li>
</ul>
<h3>10.2 监控指标与告警（示例）</h3>
${tbl(['指标', '含义', '告警阈值（示例）'], [
  ['<code>compliance_eval_latency_seconds</code>', '评估延迟直方图', 'P99 &gt; 1.5 s 持续 5 分钟'],
  ['<code>compliance_decision_total{result}</code>', '各类决策数量', 'REVIEW 比例较 7 日均值 ±50%'],
  ['<code>kyt_vendor_errors_total</code>', 'KYT 调用失败', '错误率 &gt; 5% 持续 3 分钟'],
  ['<code>watchlist_age_seconds</code>', '当前名单版本距上次成功同步', '&gt; 3600 秒'],
  ['<code>travel_rule_pending</code>', '等待对手方回复的消息数', '单条等待 &gt; 30 分钟'],
  ['<code>case_sla_breach_total</code>', '超过 SLA 的案件', '&gt; 0 即通知值班负责人'],
  ['<code>case_false_positive_ratio</code>', '审核后放行比例（按周）', '用于调参，不直接告警'],
  ['<code>audit_chain_verify_failures</code>', '哈希链校验失败', '&gt; 0 立即升级为安全事件']
])}
<h3>10.3 威胁模型</h3>
${tbl(['威胁', '例子', '防御'], [
  ['数据泄露', 'KYC 证件、旅行规则载荷被批量导出', '字段级加密；最小化存储（决策表只存特征，不存明文）；导出需审批；数据外泄检测'],
  ['内部滥用', '分析师查询名人账户、私自放行关联人的提币', '查看个人数据要填写理由并写审计日志；四眼审批；案件随机分配；定期抽查访问日志'],
  ['规则篡改', '有权限的人悄悄把阈值调高', '规则集需第二人批准；变更自动通知合规负责人；回测差异超限需额外审批'],
  ['审计日志篡改', '删除某条不利记录', '数据库账号无 UPDATE / DELETE；哈希链；定期锚定到 WORM 存储'],
  ['规避模式（高层次）', '把大额拆成多笔小额、通过多跳中转稀释暴露、频繁更换地址、借用他人账户', '按用户和时间窗聚合金额；使用间接暴露而非只看直接对手方；行为与设备关联分析；这些模式由规则和人工共同识别'],
  ['供应商风险', 'KYT 供应商宕机、数据错误或被攻击', '超时降级规则；多供应商比对关键地址；内部名单兜底'],
  ['旅行规则伪造', '冒充对手方 VASP 发送消息', '网络层双向 TLS 证书和对手方身份校验；只接受已登记对手方']
])}

<h2>11. 里程碑计划（6 周示例）</h2>
${tbl(['周', '交付物'], [
  ['第 1 周', '需求与法域规则表（与合规负责人确认）；数据模型 DDL；evaluate API 骨架；规则条件树与单元测试'],
  ['第 2 周', 'OFAC 名单解析与原子切换；内部黑白名单后台；地址规范化；KYT 供应商适配器（含沙箱、超时、缓存）'],
  ['第 3 周', '接入充值与提币状态机：充值隔离账户、提币 pre_check / final 两阶段；降级规则；集成测试'],
  ['第 4 周', '旅行规则网关：IVMS101 组装与校验、出站 / 入站、自托管地址归属证明；与测试网对手方联调'],
  ['第 5 周', '案件管理：状态机、四眼审批、SLA；审计日志哈希链与校验任务；个人数据访问留痕'],
  ['第 6 周', '规则集版本化、回测、灰度；监控面板与告警；压测和故障注入；运行手册与演示']
])}

<h2>12. 扩展方向与作品集要点</h2>
<ul>
  <li><strong>扩展</strong>：多供应商 KYT 融合打分；基于图的内部暴露计算（见 <a href="#m05-67">M04.13 链上取证与资金追踪</a>）；可疑交易报告的结构化导出；按服务实体的多租户隔离；用 CEL 替换自研条件树。</li>
  <li><strong>上线</strong>：灰度、监控、密钥管理与应急手册的完整做法见 <a href="#m12-4">M14.4 上线与应急</a>。</li>
  <li><strong>与其他项目组合</strong>：把本引擎接到 <a href="#m04-10">M10.11 实战·设计：迷你 CEX</a> 或 <a href="#m03-9">M09.10 实战·设计：托管钱包服务</a> 的提币流程里，演示“命中名单 → 冻结 → 案件 → 审批”的完整链路。</li>
  <li><strong>面试要点</strong>：说清为什么旅行规则要在签名前完成；为什么 KYT 超时不能全部放行；如何证明审计日志没被改；阈值调整如何平衡误报与漏报；如何防止内部人员滥用数据。</li>
</ul>

${mistakes([
  ['只要地址不在 SDN 名单上就可以放行。', 'OFAC 说明名单中的地址不太可能完整；还要看 KYT 归属、间接暴露和内部名单。'],
  ['KYT 供应商超时时，为了用户体验应全部放行。', '降级策略应按金额和风险分级：小额可放行并标记，大额转人工。'],
  ['旅行规则可以在链上转账之后慢慢补。', '多数情况下应在签名前完成交换；是否允许事后补发由法域规则决定，要配置化。'],
  ['合规规则写在代码里最安全。', '规则会频繁调整，应版本化存储、第二人批准、可回测、可灰度、可回滚。'],
  ['审计日志放在普通表里就够了。', '需要只追加权限、哈希链和外部锚定，否则无法证明没有被修改。']
])}
${recap([
  '合规引擎在钱动之前做决定：充值入账前、提币签名前，输出 PASS / REVIEW / REJECT / FREEZE。',
  '特征来自名单（OFAC SDN、内部名单）、KYT 风险分、用户法域和旅行规则状态；规则版本化、最严格者胜。',
  '旅行规则消息用 IVMS101，在签名前完成；阈值按服务实体和法域配置。',
  '案件管理强制四眼原则和 SLA；审计日志只追加、哈希链、外部锚定。',
  '威胁模型重点：数据泄露、内部滥用、规则篡改、规避模式和供应商风险。'
])}
${quiz([
  { q: '提币流程中，旅行规则消息交换最合适的时机是？', o: ['链上确认之后', '签名之前，作为 pre_check 与 final 之间的步骤', '用户注册时', '月底批量发送'], a: 1, why: '在签名前完成，对方拒绝或受益人不匹配时，资金还没离开平台。' },
  { q: '规则引擎同时命中 REVIEW 和 FREEZE 两条规则，最终决策是？', o: ['PASS', 'REVIEW', 'REJECT', 'FREEZE'], a: 3, why: '按“最严格者胜”合并：FREEZE > REJECT > REVIEW > PASS。' },
  { q: 'KYT 供应商连续超时，下面哪种降级策略最合理？', o: ['按金额分级：小额放行并标记，大额转人工', '全部放行，事后补查', '全部拒绝并冻结所有用户', '关闭合规引擎'], a: 0, why: '全部放行会让风险资金通过；全部拒绝会让业务停摆。按金额分级并留痕是常见做法。' },
  { q: '为什么 watchlist_entry 表要保留 removed_at 而不是直接删除行？', o: ['节省存储空间', '数据库不支持删除', '名单会删除条目（例如 2025 年 Tornado Cash 被移出），需要还原任一时刻的名单状态用于审计', '为了提高查询速度'], a: 2, why: '审计时要证明“当时”的决定基于“当时”的名单版本，所以要保留历史。' },
  { q: '下面哪项<strong>不能</strong>有效防止分析师滥用个人数据？', o: ['查看个人数据需填写理由并留痕', '案件随机分配', '定期抽查访问日志', '给所有分析师开放数据库只读账号以便提高效率'], a: 3, why: '直接数据库访问绕过了理由填写和审计留痕，是内部滥用的主要入口。' }
])}
${exercises([
  ['一个用户在 1 小时内向同一个外部地址发起 9 笔 999 美元的提币，每笔都低于你配置的 1,000 美元旅行规则门槛。你的规则引擎应如何识别？', '<p>增加一个按“用户 + 目标地址 + 时间窗”聚合金额的特征，例如 <code>tx.sum_usd_to_addr_24h</code>，规则检查聚合值是否超过门槛。FATF 相关指引也提到为防止拆分，关联转账应合并计算。命中后要求旅行规则或转人工，并在案件里展示拆分模式。</p>'],
  ['充值入账前命中 SDN 地址。写出资金和账户应发生的状态变化。', '<p>① 充值不进入用户可用余额，记入隔离（冻结）科目；② 生成 FREEZE 决策和案件，记录名单版本和条目编号；③ 合规人员按程序处理冻结和向监管报告的义务（OFAC FAQ 562 提到冻结和报告）；④ 用户界面只显示“处理中”，不透露具体原因，避免提示规避；⑤ 全过程写审计日志。</p>'],
  ['合规负责人想把 KYT_HIGH_INDIRECT 阈值从 10% 改到 15%。列出上线前必须完成的步骤。', '<p>① 在 DRAFT 规则集里修改；② 用过去 90 天特征快照回测，比较 REVIEW 数量和历史上报案件的命中情况（是否会漏掉已确认的风险）；③ 第二人批准；④ 按 10% 用户灰度一周；⑤ 监控上报数量与误报率；⑥ 全量激活，保留一键回滚到旧版本。</p>'],
  ['为什么决策表只存“特征快照”而不存 KYC 明文？', '<p>决策表会被大量系统和人员读取（监控、报表、回测）。只存特征（例如 residence=SG、kyt.score=72）足以复现决策，又避免个人数据扩散。确需查看原件时，通过受控接口按理由访问，并写审计日志。</p>']
])}
${checklist([
  '能画出合规引擎架构图，并说清它与充值、提币状态机的边界。',
  '能写出 watchlist_entry、decision、compliance_case、audit_log 的 DDL。',
  '能实现条件树规则求值，并写出“最严格者胜”的单元测试。',
  '能设计 KYT 超时和对手方 VASP 不响应时的降级策略。',
  '能为合规系统列出至少五类威胁及对应防御。',
  '能用误报率和处理时长估算审核团队规模。'
])}
${terms([
  ['了解你的交易', 'KYT (Know Your Transaction)', '用链上分析给地址或交易打风险分的做法。'],
  ['风险暴露', 'Exposure', '资金直接或间接来自某类风险来源的比例。'],
  ['特别指定国民名单', 'SDN List', 'OFAC 公布的制裁对象名单，部分条目包含数字货币地址。'],
  ['四眼原则', 'Four-eyes principle', '关键操作必须由两个不同的人分别提出和批准。'],
  ['误报率', 'False positive rate', '被拦截但审核后确认无问题的比例。'],
  ['哈希链', 'Hash chain', '每条记录包含上一条的哈希，任何修改都会被发现。'],
  ['降级策略', 'Degradation policy', '外部依赖不可用时系统按预设规则运行的方式。']
])}
` });
})();
