/* ---------- M11 子文章（m08a 第 1 部分）：预测市场入门 ---------- */
(() => {
CUR = 'm08-1';
addCh({ id: 'm08-1', nav: '预测市场入门', title: 'M11.1 预测市场入门：把观点变成价格', desc: '份额、赔付、价格≈概率、历史演进、用途与局限，一篇讲透', html: `
<h1>M11.1 预测市场入门：把观点变成价格</h1>
${meta(['用期望值解释“价格≈概率”，并能算出一笔预测市场交易的期望盈亏。', '区分二元市场、多结果市场、标量市场，并说出各自的赔付规则。', '说出预测市场与博彩的区别、四类主要局限，以及平台的核心数据模型。'], '<a href="#m08">M11 模块总览</a>、<a href="#m02">M02 智能合约开发</a>、<a href="#m13">M08 DeFi 协议</a>（了解代币与稳定币即可）')}
${beginner(`<p><strong>事件（Event）</strong>：一个未来会有明确答案的问题，例如“某城市 2026 年 12 月 31 日前的日最高气温会超过 40°C 吗？”。</p>
<p><strong>份额（Share）</strong>：一张“条件兑付券”。规则写明：如果某个结果发生，每份兑付 1 单位抵押品；不发生，兑付 0。</p>
<p><strong>抵押品（Collateral）</strong>：市场里用来买卖和兑付的资产。链上预测市场通常用 <strong>USDC</strong>（一种与美元 1:1 挂钩的稳定币）。</p>
<p><strong>期望值（Expected Value, EV）</strong>：把每种结果的收益乘以它发生的概率，再相加。它表示“重复很多次后的平均收益”。</p>
<p><strong>结算（Resolution）</strong>：事件有了答案后，由规则指定的一方（预言机）公布结果，合约按结果兑付份额。</p>`)}

<h2>1. 一句话理解</h2>
${one('预测市场是一种交易“事件结果份额”的市场：结果发生的份额兑付 1，否则兑付 0；所以份额的价格就是市场对这个结果发生概率的共识估计。')}
${call('analogy', `<p>把它想成一张“天气兑奖券”：券面写着“如果明天下雨，凭券领 1 元”。如果很多人愿意花 0.70 元买这张券，又有很多人愿意以 0.70 元卖出，那么市场整体认为“明天下雨”的概率约是 70%。</p>
<p><strong>类比的局限</strong>：真实的兑奖券由发行方承诺兑付；预测市场的兑付靠合约托管的抵押品和预言机给出的结果。如果预言机给错结果，券就兑错了。另外，价格还受手续费、资金成本和流动性影响，不完全等于概率。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m08-1"><div class="mmd-title"><span>一图看懂：一个完整集合与两种结局</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 240" role="img" aria-label="1 USDC 拆分为 1 YES 和 1 NO，以及结算时的兑付"><rect x="20" y="70" width="120" height="70" rx="10" fill="var(--tint)" stroke="var(--ink-2)" stroke-width="1.5"/><text x="80" y="100" font-size="16" text-anchor="middle" fill="var(--ink)" font-weight="700">1 USDC</text><text x="80" y="122" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">抵押品</text><line x1="144" y1="105" x2="214" y2="70" stroke="var(--ink-2)" stroke-width="2"/><path d="M214.0 70.0 L209.1 76.3 L206.0 70.1 z" fill="var(--ink-2)"/><line x1="144" y1="105" x2="214" y2="140" stroke="var(--ink-2)" stroke-width="2"/><path d="M214.0 140.0 L206.0 139.9 L209.1 133.7 z" fill="var(--ink-2)"/><text x="180" y="92" font-size="11.5" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">split</text><rect x="218" y="40" width="130" height="54" rx="10" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="283" y="64" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">1 YES</text><text x="283" y="83" font-size="11.5" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">市价 0.62</text><rect x="218" y="116" width="130" height="54" rx="10" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="283" y="140" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">1 NO</text><text x="283" y="159" font-size="11.5" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">市价 0.38</text><text x="283" y="196" font-size="12" text-anchor="middle" fill="var(--accent)" font-weight="700">0.62 + 0.38 = 1：两边价格之和锚定 1</text><rect x="420" y="26" width="320" height="70" rx="10" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="580" y="52" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">结果为“是”</text><text x="580" y="76" font-size="12" text-anchor="middle" fill="var(--ink)">每个 YES 兑付 1 USDC，NO 归零</text><rect x="420" y="110" width="320" height="70" rx="10" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="580" y="136" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">结果为“否”</text><text x="580" y="160" font-size="12" text-anchor="middle" fill="var(--ink)">每个 NO 兑付 1 USDC，YES 归零</text><line x1="352" y1="67" x2="416" y2="61" stroke="var(--ok)" stroke-width="2"/><path d="M416.0 61.0 L409.2 65.1 L408.5 58.2 z" fill="var(--ok)"/><line x1="352" y1="143" x2="416" y2="145" stroke="var(--risk)" stroke-width="2"/><path d="M416.0 145.0 L408.7 148.3 L408.9 141.3 z" fill="var(--risk)"/><text x="380" y="226" font-size="12.5" text-anchor="middle" fill="var(--ink-2)">YES 的价格 0.62，可以理解为市场认为“是”的概率约 62%</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>任何人都能用 1 USDC 铸造 1 YES + 1 NO（split），也能把一对 YES + NO 合并换回 1 USDC（merge）。</span></li><li><span class="chip key">关键</span><span>因为一对份额永远值 1 USDC，YES 与 NO 的价格之和会被套利拉回 1，价格就能读成概率。</span></li><li><span class="chip limit">局限</span><span>“价格 = 概率”只是近似：手续费、资金占用成本和流动性都会让价格偏离真实概率。</span></li></ul></figcaption></figure>

<h2>2. 份额、赔付与三种市场类型</h2>
<p>每个预测市场都由三样东西定义：<strong>问题</strong>（问什么）、<strong>结果集合</strong>（可能的答案）、<strong>结算规则</strong>（谁、在何时、依据什么数据源判定答案）。根据结果集合的形状，市场分成三类。</p>
${tbl(['类型', '结果集合', '赔付规则', '示例'], [
  ['二元市场（Binary）', 'YES / NO 两个互斥结果', '赢的一方每份兑 1，输的一方兑 0', '“某央行 2026 年 12 月会议是否降息？”'],
  ['多结果市场（Categorical / Multi-outcome）', 'N 个互斥结果，恰好一个为真', '为真的结果每份兑 1，其余兑 0', '“哪支球队赢得某联赛冠军？”（20 个选项）'],
  ['标量市场（Scalar）', '一个数值区间 [下限, 上限]', 'LONG 份额兑 (实际值 − 下限)/(上限 − 下限)，SHORT 兑剩余部分，两者合计 1', '“某月 CPI 同比读数”，区间 [2%, 4%]']
])}
<p><strong>算一算（示例）</strong>：标量市场区间 [2%, 4%]，结算值为 3.5%。LONG 每份兑付 (3.5 − 2) / (4 − 2) = 0.75 USDC，SHORT 每份兑付 0.25 USDC。结算值超出区间时按边界截断：4.6% 按 4% 算，LONG 兑 1，SHORT 兑 0。</p>
${mm('一个二元市场里资金和份额怎样流动', `
flowchart LR
  U1["交易者甲<br/>看好 YES"] -->|"付 0.62 USDC"| EX["市场<br/>订单簿 或 AMM"]
  U2["交易者乙<br/>看好 NO"] -->|"付 0.38 USDC"| EX
  EX -->|"合计 1 USDC 锁入"| ESC["托管合约<br/>每 1 USDC 对应 1 YES + 1 NO"]
  ESC -->|"1 份 YES"| U1
  ESC -->|"1 份 NO"| U2
  OR["预言机<br/>公布结果"] --> ESC
  ESC -->|"结果为 YES：甲兑 1 USDC"| U1
  ESC -->|"结果为 NO：乙兑 1 USDC"| U2
`, [
  ['flow', '甲和乙的钱一起锁进托管合约。1 USDC 正好支持 1 YES + 1 NO，因此无论结果如何，合约总能足额兑付。'],
  ['key', '平台不需要“坐庄”。赢家拿到的钱来自输家，不来自平台。'],
  ['fail', '如果预言机公布错误结果，合约会把钱兑给错误的一方。合约无法自己判断现实世界。'],
  ['risk', '托管合约有漏洞时，全部抵押品都有风险。这是链上预测市场最大的技术风险。']
])}
${call('info', `<p>“1 YES + 1 NO = 1 USDC”叫<strong>完整集合（Complete Set）</strong>。它是整个预测市场的会计基础，也是套利的基础。<a href="#m08-2">M11.2 交易与套利</a>会逐步展开。</p>`)}

<h2>3. 为什么价格≈概率</h2>
<h3>3.1 期望值论证</h3>
<p>设你认为某事件发生的概率是 <em>q</em>，YES 份额的市场价格是 <em>p</em>。买 1 份 YES：</p>
${steps(['事件发生（概率 <em>q</em>）：你收到 1，净赚 1 − <em>p</em>。', '事件不发生（概率 1 − <em>q</em>）：你收到 0，净亏 <em>p</em>。', '期望收益 EV = <em>q</em>·(1 − <em>p</em>) − (1 − <em>q</em>)·<em>p</em> = <em>q</em> − <em>p</em>。'])}
<p>结论：只要你的概率 <em>q</em> 高于价格 <em>p</em>，买 YES 的期望收益为正；低于价格，卖 YES（或买 NO）的期望收益为正。每个交易者都按自己的 <em>q</em> 买卖，价格会移动到“再买或再卖都无利可图”的位置。这个位置就是市场参与者概率的加权共识。</p>
<p><strong>算一算（示例）</strong>：YES 价格 0.62。你研究后认为概率是 0.70。</p>
${steps(['每份 EV = 0.70 − 0.62 = 0.08 USDC。', '买 1,000 份，成本 620 USDC，期望收益 80 USDC，期望回报率 80 / 620 ≈ 12.9%。', '最坏情况：事件不发生，亏损全部 620 USDC。期望为正不等于这一次一定赚钱。', '如果另一位交易者认为概率是 0.55，他会卖出。两人的买卖共同把价格推向两人观点之间。'])}
${mm('价格如何收敛到共识概率', `
flowchart TB
  P["当前价格 p = 0.62"] --> Q1{"交易者的估计 q"}
  Q1 -->|"q > p，例如 0.70"| B["买 YES<br/>价格上升"]
  Q1 -->|"q < p，例如 0.55"| S["卖 YES 或买 NO<br/>价格下降"]
  B --> E["新价格"]
  S --> E
  E --> N{"还有人认为<br/>q ≠ p 且愿意下注？"}
  N -->|"是"| Q1
  N -->|"否"| C["价格 ≈ 加权共识概率<br/>权重 = 资金量 × 信心"]
`, [
  ['flow', '新信息出现（例如一份新民调）时，交易者更新 q，循环重新开始，价格快速反映新信息。'],
  ['key', '权重是“愿意押上的资金”，不是人数。一个资金大、信息准的交易者比一千个随意下注的人影响更大。'],
  ['limit', '如果有信息的人没有资金、或者受地域限制不能参与，价格就无法反映他们的信息。'],
  ['risk', '资金大但信息差的交易者也能把价格推离真实概率。这种偏离会吸引有信息的人反向交易，但需要时间和资金。']
])}
<h3>3.2 价格不完全等于概率的四个原因</h3>
${tbl(['原因', '机制', '对价格的影响（示例）'], [
  ['买卖价差', 'YES 买一 0.60、卖一 0.64，你只能看到一个区间', '只能说概率约 60%–64%，通常取中间价 0.62'],
  ['手续费', '交易要付手续费，小偏差不值得纠正', '价格可以在“无套利带”内偏离'],
  ['资金的时间价值', '买 YES 要先付钱，等到结算才兑付', '1 年后结算、概率 95%、无风险利率 5%：合理价格 ≈ 0.95 / 1.05 ≈ 0.905'],
  ['风险偏好与长尾偏差', '人们偏爱低价“彩票型”结果', '概率 1% 的冷门结果常常卖到 0.02–0.03']
])}

<h2>4. 群体智慧、历史与参与者</h2>
<h3>4.1 群体智慧与信息聚合</h3>
<p><strong>群体智慧（Wisdom of Crowds）</strong>指：许多独立的估计取平均，误差会互相抵消，结果常常比单个专家更准。预测市场在此基础上多了两点：<strong>用钱加权</strong>（信心越强押得越多），以及<strong>持续更新</strong>（新信息一出现就有人交易）。经济学家哈耶克（F. A. Hayek）1945 年提出：价格是把分散在每个人头脑里的信息汇总起来的机制。预测市场把这个机制用在“事件概率”上。</p>
${call('info', `<p>信息聚合有前提：参与者的信息要<strong>相互独立</strong>、要<strong>有激励说真话</strong>（亏钱就是惩罚）、市场要<strong>有足够流动性</strong>。三者缺一，价格就可能被少数人或羊群效应带偏。</p>`)}
<h3>4.2 发展历史</h3>
${tbl(['年份', '平台', '特点', '结局 / 现状'], [
  ['1988 年起', 'Iowa Electronic Markets（IEM）', '爱荷华大学的学术研究市场，真钱小额交易（单个参与者在每个子市场上限 500 美元），主要做选举市场', '在美国 CFTC 工作人员的“不采取行动函”（no-action letter，1992、1993 年）下运营，至今被用于学术研究' + cite('CFTC：2008 年事件合约概念公告（述及 IEM 不采取行动函）', 'https://www.cftc.gov/LawRegulation/FederalRegister/e8-9981.html')],
  ['2000 年代初', 'Intrade（总部在爱尔兰）', '面向全球的商业预测市场，选举和时事合约很知名', '2012 年 11 月美国商品期货交易委员会（CFTC）起诉其向美国用户提供场外期权交易' + cite('CFTC：起诉 Intrade 新闻稿', 'https://www.cftc.gov/PressRoom/PressReleases/6423-12') + '；2013 年 3 月以财务问题为由停止全部交易' + cite('NPR：Intrade 停止交易', 'https://www.npr.org/sections/thetwo-way/2013/03/11/174002267/add-its-own-demise-to-intrades-list-of-blown-calls')],
  ['2015 年众筹，2018 年主网', 'Augur', '以太坊上的去中心化预测市场，用 REP 代币持有人报告和争议结果', '2018 年 7 月主网上线' + cite('Augur 官方：Augur Launches', 'https://medium.com/@AugurProject/augur-launches-794fa7f88c6a') + '，证明了“链上结算 + 去中心化裁决”可行，但用户体验和 Gas 成本限制了规模'],
  ['2020 年起', 'Polymarket', '链下订单簿撮合 + Polygon 链上结算，USDC 抵押，UMA 乐观预言机结算', '2022 年 1 月与 CFTC 和解（罚款 140 万美元）并屏蔽美国用户' + cite('CFTC：Polymarket 和解新闻稿', 'https://www.cftc.gov/PressRoom/PressReleases/8478-22') + '；2024 年美国总统大选主市场成交量约 36 亿美元' + cite('Decrypt：Polymarket 结算美国大选市场', 'https://decrypt.co/290374/polymarket-donald-trump-us-presidential-election') + '；2025 年 7 月宣布收购持牌交易所 QCEX，寻求合规进入美国' + cite('The Block：Polymarket 收购 QCEX', 'https://www.theblock.co/post/363623/polymarket-plans-to-re-enter-us-with-acquisition-of-derivatives-exchange-qcex') + '（截至 2026 年公开资料）'],
  ['2021 年上线', 'Kalshi', '美国 CFTC 批准的指定合约市场（DCM，2020 年 11 月获批），法币入金，受监管' + cite('CFTC：Kalshi 获指定合约市场资格', 'https://www.cftc.gov/PressRoom/PressReleases/8302-20'), '2024 年 9 月在与 CFTC 的诉讼中获胜后上线选举合约' + cite('Axios：法院允许 Kalshi 上线选举合约', 'https://www.axios.com/2024/09/12/betting-elections-predictions-market-cftc-kalshi') + '；体育类合约与部分州的博彩监管存在争议（截至 2026 年公开资料）']
])}
<p>详细的链上架构见 <a href="#m08-5">M11.5 Polymarket 架构拆解</a>；Augur 的去中心化裁决见 <a href="#m08-4">M11.4 结算与预言机</a>。</p>
<h3>4.3 参与者类型</h3>
${tbl(['参与者', '动机', '对市场的作用'], [
  ['信息交易者（Informed Trader）', '拥有更准的信息或模型，赚取 q − p', '把价格推向真实概率，是价格准确的来源'],
  ['做市商（Market Maker）', '赚买卖价差和平台奖励', '提供流动性，让别人随时能成交'],
  ['套利者（Arbitrageur）', '赚完整集合、跨平台、相关市场的价差', '让 YES + NO ≈ 1、让不同市场之间价格一致'],
  ['对冲者（Hedger）', '用市场对冲现实风险（例如政策变化对业务的影响）', '愿意付“保险费”，给信息交易者提供利润来源'],
  ['娱乐型交易者（Noise Trader）', '支持某一方、凑热闹', '提供对手盘；他们的亏损是信息交易者的收入']
])}

<h2>5. 与博彩的区别、用途与局限</h2>
<h3>5.1 与博彩的区别</h3>
${tbl(['维度', '传统博彩（庄家模式）', '预测市场（交易所模式）'], [
  ['对手方', '庄家', '其他交易者'],
  ['赔率 / 价格谁定', '庄家设定，内含利润（抽水）', '买卖双方的订单决定'],
  ['平台收入', '赔率中的抽水，赢家多了庄家亏', '交易手续费，与结果无关'],
  ['能否中途退出', '通常不能，或只能按庄家报价“提前结算”', '随时在市场上卖出份额'],
  ['赢家是否被限制', '常见：长期赢钱的账户被限额', '不限：赢家越多价格越准'],
  ['价格的信息含义', '赔率含庄家利润和风险管理，概率含义弱', '价格本身就是概率估计，可被引用']
])}
${call('warn', `<p>监管机构不一定接受这种区分。很多国家和地区把预测市场视为赌博或未注册的衍生品交易。参与或搭建平台前，必须确认所在地法律。本手册不构成法律或投资建议。</p>`)}
<h3>5.2 用途</h3>
${steps(['<strong>预测与决策参考</strong>：媒体和研究者引用市场概率作为参考指标。', '<strong>对冲</strong>：企业或个人对冲政策、天气、赛事结果等风险。', '<strong>公司内部预测市场</strong>：员工交易“项目能否按期上线”，管理层获得比汇报更真实的信号。', '<strong>机制设计实验</strong>：例如“未来治理”（Futarchy）思路——用市场价格评估一项政策的效果。'])}
<h3>5.3 局限</h3>
${tbl(['局限', '具体表现', '缓解方式'], [
  ['流动性不足', '冷门市场价差大，几百美元就能推动价格', '自动做市商（<a href="#m08-3">M11.3</a>）、做市激励'],
  ['操纵', '大户刻意推高价格制造舆论（价格本身成为宣传）', '深度越大操纵越贵；操纵制造的偏离会被套利者吃掉'],
  ['监管', '地域屏蔽、KYC 要求、合约类型受限', '持牌运营或严格地域限制'],
  ['长期市场的资金成本', '资金锁定到结算日，概率被系统性压低', '抵押品生息、缩短市场期限'],
  ['结算风险', '规则含糊、预言机出错或被操纵', '规则写清数据源和边界情况（<a href="#m08-4">M11.4</a>）'],
  ['道德风险', '能影响结果的人下注（内幕交易）', '禁止相关方参与、监控异常交易']
])}
<p><strong>算一算（示例）：长期市场的资金成本</strong>。一个市场 2 年后结算，你认为 YES 概率 80%，可以选择把钱放在年化 5% 的稳健收益产品里。</p>
${steps(['2 年后 1 USDC 的现值 = 1 / 1.05² ≈ 0.907。', 'YES 份额的合理价格 ≈ 0.80 × 0.907 ≈ 0.726。', '如果市场价格是 0.75，按概率看你“应该卖”（0.75 < 0.80），按资金成本看价格反而偏高（0.75 > 0.726）。', '结论：长期市场的价格要先折现，再解读为概率。'])}

<h2>6. 工程层：一个预测市场平台的核心数据模型</h2>
<p>从工程角度，预测市场平台至少要管理五类对象：<strong>事件</strong>（Event，一组相关市场）、<strong>市场</strong>（Market，一个问题）、<strong>结果</strong>（Outcome，每个结果对应一种份额代币）、<strong>订单与成交</strong>、<strong>结算记录</strong>。下面是一份简化的表结构（PostgreSQL，示例）。</p>
${code('SQL', `
-- 市场：一个问题 + 结算规则
CREATE TABLE markets (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,           -- URL 友好名
  question        TEXT NOT NULL,                  -- 问题原文
  rules           TEXT NOT NULL,                  -- 结算规则全文：数据源、截止时间、边界情况
  market_type     TEXT NOT NULL CHECK (market_type IN ('binary','categorical','scalar')),
  scalar_low      NUMERIC(38,18),                 -- 仅标量市场
  scalar_high     NUMERIC(38,18),
  collateral      TEXT NOT NULL DEFAULT 'USDC',
  close_time      TIMESTAMPTZ NOT NULL,           -- 停止交易时间
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('draft','open','closed','proposed','disputed','resolved','voided')),
  condition_id    BYTEA,                          -- 链上条件 ID（见 M11.5）
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 结果：每个结果对应链上一个份额代币
CREATE TABLE outcomes (
  market_id       BIGINT NOT NULL REFERENCES markets(id),
  idx             SMALLINT NOT NULL,              -- 0 = YES / 结果 A ...
  label           TEXT NOT NULL,
  token_id        NUMERIC(78,0),                  -- ERC-1155 positionId（uint256）
  payout_num      NUMERIC(38,18),                 -- 结算后的兑付比例，未结算为 NULL
  PRIMARY KEY (market_id, idx)
);

-- 价格快照：用于图表和“隐含概率”展示
CREATE TABLE price_ticks (
  market_id       BIGINT NOT NULL,
  idx             SMALLINT NOT NULL,
  ts              TIMESTAMPTZ NOT NULL,
  best_bid        NUMERIC(10,4),
  best_ask        NUMERIC(10,4),
  mid             NUMERIC(10,4),
  PRIMARY KEY (market_id, idx, ts)
);
`)}
<p>前端展示“隐含概率”时，要处理价差和多结果归一化。下面是一段可直接运行的 TypeScript：</p>
${code('TYPESCRIPT', `
type Quote = { bid: number | null; ask: number | null; last: number | null };

// 隐含概率：优先用中间价；价差过大时退回最近成交价
export function impliedProb(q: Quote, maxSpread = 0.10): number | null {
  if (q.bid !== null && q.ask !== null && q.ask - q.bid <= maxSpread) {
    return (q.bid + q.ask) / 2;
  }
  return q.last; // 价差太大，中间价没有意义
}

// 多结果市场：把各结果概率归一化，使总和为 1
export function normalize(probs: number[]): number[] {
  const s = probs.reduce((a, b) => a + b, 0);
  return s > 0 ? probs.map(p => p / s) : probs;
}

// 期望值：你的概率 q，买入价 p（含手续费率 fee）
export function evPerShare(q: number, p: number, fee = 0): number {
  return q * 1 - p * (1 + fee);
}

console.log(impliedProb({ bid: 0.60, ask: 0.64, last: 0.61 })); // 0.62
console.log(normalize([0.40, 0.35, 0.30]));                        // 约 [0.381, 0.333, 0.286]
console.log(evPerShare(0.70, 0.62));                                // 约 0.08
`)}
${call('deep', `<p>为什么 <code>maxSpread</code> 要做成配置？冷门市场的买一可能是 0.05、卖一是 0.95，中间价 0.50 毫无信息量。生产系统通常在价差超过阈值（示例：0.10）时显示最近成交价，并在界面上标注“流动性低”。</p>`)}
${tryit(`<p><strong>任务：读懂一个真实市场的规则。</strong></p>
<ol><li>打开任意一个公开的预测市场网站（例如 Polymarket 或 Kalshi 的公开页面，只浏览，不需要注册或入金）。</li>
<li>选一个二元市场，找到“Rules / 规则”部分，抄下三项：数据源、截止时间、边界情况（例如“如果事件被推迟怎么办”）。</li>
<li>记录 YES 买一价和卖一价，算中间价和价差。</li>
<li>预期结果：你能写出“市场认为概率约为 X%，误差范围 ±Y%”，并指出至少一条可能引发争议的规则措辞。</li></ol>`)}
${mistakes([
  ['价格 0.90 表示这件事一定会发生', '价格 0.90 表示市场认为概率约 90%。剩下 10% 的情况真实存在，买 YES 的人会在这 10% 里亏光本金。'],
  ['预测市场的平台是庄家，赢家的钱来自平台', '在交易所模式下，赢家的钱来自输家，平台只收手续费。平台做市（AMM）时才承担有限风险。'],
  ['期望值为正就应该全仓买入', '期望值为正只说明平均能赚。单次结果是二元的，全仓可能一次亏光。仓位要按资金管理规则控制。'],
  ['所有市场的价格都可以直接当概率用', '要先看价差、流动性和结算期限。价差大的冷门市场、两年后才结算的市场，价格都需要修正后才能解读。']
])}
${recap([
  '份额规则：结果发生兑 1，不发生兑 0。1 YES + 1 NO 永远对应 1 USDC 抵押品。',
  '期望值 EV = q − p：你的概率高于价格就买，低于就卖。所有人的交易把价格推向加权共识概率。',
  '三种市场：二元、多结果（恰好一个为真）、标量（按区间线性兑付）。',
  '价格偏离概率的来源：价差、手续费、资金时间价值、长尾偏差。',
  '与博彩的核心区别：对手方是其他交易者，平台收手续费而不是赚赔率差；但监管上不一定被区别对待。',
  '平台核心数据模型：市场、结果（份额代币）、价格快照、订单成交、结算记录。'
])}
${quiz([
  { q: 'YES 价格 0.40，你认为事件发生的概率是 0.55。不考虑手续费，买 1 份 YES 的期望收益是多少？', o: ['0.40 USDC', '0.15 USDC', '0.55 USDC', '−0.15 USDC'], a: 1, why: 'EV = q − p = 0.55 − 0.40 = 0.15。0.40 是成本，0.55 是期望兑付，两者之差才是期望收益。' },
  { q: '标量市场区间 [100, 200]，结算值为 130。LONG 份额每份兑付多少？', o: ['0.30', '0.70', '1.30', '0'], a: 0, why: '(130 − 100) / (200 − 100) = 0.30。SHORT 兑 0.70，两者合计 1。' },
  { q: '下面哪一项最能说明预测市场与传统庄家博彩的区别？', o: ['预测市场不需要抵押品', '预测市场的结果不需要预言机', '预测市场的对手方是其他交易者，平台收入与结果无关', '预测市场一定不受监管'], a: 2, why: '交易所模式下平台只收手续费。预测市场需要抵押品和预言机，并且在很多地区受到监管。' },
  { q: '一个 1 年后结算的市场，你确信概率是 95%，无风险年利率 5%。哪个价格最接近合理价格？', o: ['0.95', '1.00', '0.85', '0.905'], a: 3, why: '要折现：0.95 / 1.05 ≈ 0.905。这就是长期市场的概率被系统性压低的原因。' }
])}
${exercises([["计算题（示例）：一个标量市场的区间是 [1,000, 3,000]，结算值为 1,600。你持有 200 份 LONG 和 100 份 SHORT。你能兑付多少 USDC？如果结算值是 3,500 呢？", "<p>LONG 每份兑 (1,600 − 1,000) ÷ (3,000 − 1,000) = <strong>0.30</strong>，SHORT 每份兑 0.70。合计 200 × 0.30 + 100 × 0.70 = 60 + 70 = <strong>130 USDC</strong>。结算值 3,500 超出区间，按上限 3,000 截断：LONG 兑 1，SHORT 兑 0，你得到 200 USDC。</p>"], ["思考题：为什么说“1 YES + 1 NO 对应 1 USDC”让平台不需要坐庄？这种设计把风险转移到了哪里？", "<p>每卖出一对 YES 和 NO，托管合约就锁入 1 USDC。不论结果如何，合约都能足额兑付赢的一方。赢家的钱来自输家，平台只收手续费，收入与结果无关。剩下的风险集中在两处：预言机给出错误结果，以及托管合约本身有漏洞。</p>"], ["计算题（示例）：一个市场 1 年后结算。你估计 YES 概率为 0.60。YES 卖一 0.55，手续费率 1%。稳健收益年化 5%。先不考虑时间价值算每份期望收益，再用折现判断这个价格是否仍低于合理价格。", "<p>按 <code>evPerShare</code> 的写法：EV = 0.60 − 0.55 × 1.01 = 0.60 − 0.5555 = <strong>0.0445 USDC</strong>。考虑时间价值，合理价格 ≈ 0.60 ÷ 1.05 ≈ <strong>0.571</strong>。含手续费的成本 0.5555 仍低于 0.571，所以按你的估计期望值仍为正。但单次结果是二元的：事件不发生时，你亏掉全部成本。</p>"]])}
${checklist(["能用 EV = q − p 算出一笔交易的每份期望收益，并说出最坏情况下的亏损。", "能写出二元、多结果、标量三种市场的赔付规则，并手算标量市场 LONG 和 SHORT 的兑付。", "能说出价格偏离概率的四个原因，并用折现修正长期市场的价格。", "能用买一卖一中间价估算隐含概率，并在价差过大时改用最近成交价。", "能从对手方和平台收入两个角度，说出预测市场与庄家博彩的区别。"])}
${terms([
  ['预测市场', 'Prediction Market', '交易事件结果份额的市场，价格反映市场对概率的共识'],
  ['份额', 'Share / Outcome Token', '结果发生兑付 1 单位抵押品、否则兑付 0 的代币'],
  ['二元市场', 'Binary Market', '只有 YES 和 NO 两个互斥结果的市场'],
  ['多结果市场', 'Categorical Market', '有 N 个互斥结果、恰好一个为真的市场'],
  ['标量市场', 'Scalar Market', '按结算数值在区间内的位置线性兑付 LONG / SHORT 的市场'],
  ['隐含概率', 'Implied Probability', '从份额价格推出的概率，通常取买卖中间价'],
  ['期望值', 'Expected Value', '各结果收益乘以概率后的总和'],
  ['信息聚合', 'Information Aggregation', '价格把分散在众多参与者中的信息汇总成一个数字'],
  ['群体智慧', 'Wisdom of Crowds', '许多独立估计的平均值往往比单个估计更准的现象']
])}
` });
})();
