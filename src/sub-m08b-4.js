/* ---------- M09 子文章（b-4）：★ 实战：二元预测市场 ---------- */
(() => {
CUR = 'm08-11';
addCh({ id: 'm08-11', nav: '实战·设计：二元预测市场', title: 'M09.11 实战·设计：二元预测市场（合约 + 撮合 + 结算 + 前端）', desc: '项目目标、需求拆解、系统架构、技术选型、数据模型与接口设计', html: `
<h1>M09.11 实战·设计：二元预测市场（合约 + 撮合 + 结算 + 前端）</h1>
${meta(['设计一个非托管的二元预测市场：ERC-1155 条件代币、EIP-712 签名订单、链下撮合链上结算、乐观预言机式结算。', '写出四个核心合约、撮合服务、前端下单流程的关键代码，并用 Foundry 不变量测试守住“抵押品 = 未赎回完整集合”。', '给出数据表、接口、部署、监控、安全与合规清单，按 6 周里程碑交付。'], '<a href="#m08-1">M09.1 预测市场入门</a>、<a href="#m08-4">M09.4 结算与预言机</a>、<a href="#m08-5">M09.5 Polymarket 架构</a>、<a href="#m02-50">M02.6 NFT 与代币发行</a>（ERC-1155）、<a href="#m07-6">M03.6 签名与登录</a>')}
${beginner(`<p><strong>条件代币（Conditional Token）</strong>：只有在某个条件成立时才值钱的代币。“YES 份额”在事件发生时兑 1 USDC，否则兑 0。</p>
<p><strong>ERC-1155</strong>：一种代币标准，一个合约里可以有很多种代币，每种用一个 tokenId 区分。适合“每个市场两种份额”的场景。</p>
<p><strong>完整集合（Complete Set）</strong>：1 YES + 1 NO。无论结果如何，它都值 1 USDC。</p>
<p><strong>EIP-712</strong>：以太坊的结构化数据签名标准。钱包会把订单字段逐项显示给用户，用户签名后，任何人都能在链上验证“这个订单确实是他签的”。</p>
<p><strong>非托管（Non-Custodial）</strong>：平台从不持有用户的资金。资金一直在用户钱包或规则透明的合约里，平台无法挪用。</p>
<p><strong>挑战期（Liveness / Challenge Period）</strong>：结果被提议后，留给任何人提出异议的一段时间。</p>`)}

<h2>1. 一句话理解</h2>
${one('用户把 USDC 拆成 YES + NO 份额；买卖双方签名的订单由链下撮合服务配对，再由链上交易所合约原子交换；事件结束后，结果经“提议 → 挑战期 → 必要时多签仲裁”确定，赢方份额 1:1 兑回 USDC。')}
${call('analogy', `<p>这像一个公证处保管的对赌：公证处（条件代币合约）收下 1 元，开出两张票“下雨兑 1 元”和“不下雨兑 1 元”。你可以把任意一张票卖给别人。票面上的买卖由一个撮合员（撮合服务）帮你找对手，但每次换票都要双方亲笔签名，撮合员拿不走钱。到了日子，一个人报告“下雨了”并押上保证金；如果没人反对，结果生效；有人反对，就交给仲裁小组。</p>
<p>类比的局限：真实公证处可以人工纠错；链上合约一旦部署，规则只能按代码执行。所以本项目的每条规则都要写进合约并经过测试。</p>`)}
${art('一图看懂：三个角色各自能做什么、不能做什么，资金只在链上合约里', 660, 360, [
  S.zone(396, 24, 254, 298, { t: '链上合约（资金只在这里）' }),
  S.box(10, 54, 262, 64, { k: 'warn', icon: 'server', t: '运营方（撮合服务）', s: '只能提交双方签过名的成交\n不能改价，不能动资金' }),
  S.box(10, 148, 262, 64, { k: 'key', icon: 'person', t: '用户', s: '签名下单，自己 split / redeem\n随时链上撤单' }),
  S.box(10, 242, 262, 64, { k: 'warn', icon: 'users', t: '仲裁多签 Safe 2/3', s: '只在有争议时裁决结果\n碰不到份额和 USDC' }),
  S.box(412, 54, 222, 64, { k: 'tint', t: 'Exchange', s: '验签 · 原子交换', mono: 1 }),
  S.box(412, 148, 222, 64, { k: 'ok', icon: 'lock', t: 'ConditionalTokens', s: '托管 USDC，管理份额', mono: 1 }),
  S.box(412, 242, 222, 64, { k: 'tint', t: 'OptimisticResolver', s: '提议 · 挑战 · 仲裁', mono: 1 }),
  S.arrow(274, 86, 410, 86, { k: 'warn', label: 'matchOrders' }),
  S.arrow(274, 180, 410, 180, { k: 'key', label: 'split / redeem' }),
  S.arrow(274, 274, 410, 274, { k: 'warn', label: 'arbitrate' }),
  S.arrow(523, 120, 523, 146, { k: 'plain' }), S.arrow(523, 240, 523, 214, { k: 'plain' }),
  S.text(330, 346, '运营方能审查、能延迟，但拿不走一分钱；用户随时可以绕开它直接上链退出', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '左边是三种角色，右边是合约；箭头上是该角色能调用的入口。Exchange 和 Resolver 最终都只通过 ConditionalTokens 动份额和 USDC。'],
  ['key', '用户的权限最大：签名下单、拆分、赎回、撤单，都不需要经过运营方。'],
  ['risk', '运营方可以不撮合某人的订单或延迟结算，这是链下撮合要用信任换速度的代价。'],
  ['limit', '多签仲裁是简化设计；生产环境可以换成 UMA 乐观预言机，接口保持可替换。']
], '三个角色：运营方撮合服务只能提交双方签过名的成交到 Exchange 合约；用户可以直接对 ConditionalTokens 拆分合并赎回并链上撤单；仲裁多签只能在争议时通过 OptimisticResolver 裁决结果。资金只存在链上合约里。', 'm08-11')}

<h2>2. 项目目标与验收标准</h2>
${tbl(['类别', '验收标准（示例）'], [
  ['功能', '管理员创建二元市场；用户 split / merge / redeem；用户签名限价单买卖 YES/NO；撮合后链上结算；结果提议、挑战、仲裁、赎回全流程可用'],
  ['非托管', '撮合服务宕机或作恶时，用户仍能链上撤单、merge、结算后 redeem，资金不依赖运营方'],
  ['吞吐', '单市场持续 300 单/秒下单，撮合引擎内处理 P99 < 10 ms'],
  ['延迟', '下单 API P99 < 150 ms；成交到链上确认，在 L2 上 P95 < 10 秒'],
  ['可用性', '下单 API 月可用性 99.9%；链上结算失败自动重试并告警'],
  ['安全', '合约 100% 分支覆盖关键路径；不变量测试 ≥ 10,000 次调用无失败；上线前完成外部审计']
])}

<h2>3. 需求拆解与用户故事</h2>
${steps([
  '作为<strong>市场创建者</strong>，我能填写问题、结算规则、截止时间，创建一个市场，并在链上看到 MarketCreated 事件。',
  '作为<strong>交易者</strong>，我能连接钱包、授权 USDC，把 100 USDC 拆成 100 YES + 100 NO。',
  '作为<strong>交易者</strong>，我能以 0.62 的价格挂单买 50 YES；成交后 YES 直接到我的钱包。',
  '作为<strong>交易者</strong>，我能撤单；撮合服务不响应时，我能在链上撤单或提升 nonce 使所有旧单失效。',
  '作为<strong>提议者</strong>，截止时间后我能押保证金提议结果；挑战期满后结果生效，保证金退回。',
  '作为<strong>挑战者</strong>，我能在挑战期内押保证金发起争议；多签仲裁后，正确的一方拿回两份保证金。',
  '作为<strong>赢方持有人</strong>，结算后我能 redeem，每份赢方份额兑 1 USDC；结果为“无效”时每份兑 0.5 USDC。',
  '作为<strong>运维</strong>，我能看到撮合延迟、结算失败、抵押品对账差额等指标并收到告警。'
])}

<h2>4. 系统架构、调用链与状态机</h2>
${mm('系统架构：链下撮合 + 链上结算', `
flowchart LR
  subgraph FE["前端 Next.js + wagmi"]
    UI["市场页 / 下单 / 持仓"]
  end
  subgraph OFF["链下服务"]
    API["API 网关<br/>REST + WebSocket"]
    ME["撮合引擎<br/>每市场单线程"]
    ST["结算器<br/>提交 matchOrders"]
    IDX["索引器<br/>监听合约事件"]
    DB[("PostgreSQL")]
    MON["监控告警"]
  end
  subgraph ON["链上合约 L2"]
    MF["MarketFactory"]
    CT["ConditionalTokens<br/>ERC-1155 + USDC 托管"]
    EX["Exchange<br/>EIP-712 订单结算"]
    RS["OptimisticResolver<br/>提议 / 挑战 / 仲裁"]
    MS["多签仲裁 Safe"]
  end
  UI -->|"签名订单"| API
  UI -->|"split / merge / redeem / 撤单"| CT
  API --> ME
  ME --> DB
  ME --> ST
  ST -->|"运营方账户"| EX
  EX --> CT
  MF --> CT
  RS --> CT
  MS --> RS
  CT -.->|"事件"| IDX
  EX -.->|"事件"| IDX
  IDX --> DB
  DB --> MON
`, [
  ['flow', '资金只在用户钱包和 ConditionalTokens 之间流动；Exchange 在一笔交易内把买方 USDC 和卖方份额原子交换。'],
  ['key', '撮合在链下（快、免 Gas），结算在链上（可信）。运营方只能提交“双方都签过名”的成交，无法伪造订单。'],
  ['fail', '结算交易可能因为用户余额或授权不足而回滚。结算器要识别失败的订单，撤销它并把对手方订单放回订单簿。'],
  ['risk', '运营方可以审查（不撮合某人的订单）或延迟结算，但拿不走资金。用户可以绕开运营方直接与合约交互退出。'],
  ['limit', '订单簿不在链上，用户需要信任撮合的公平性（价格时间优先）。可以公开撮合日志供审计作为补偿。']
])}
${mm('关键调用链：下单到链上成交', `
sequenceDiagram
  participant U as 用户钱包
  participant F as 前端
  participant A as API
  participant M as 撮合引擎
  participant S as 结算器
  participant E as Exchange 合约
  participant I as 索引器
  U->>F: 输入 买 50 YES 价格 0.62
  F->>U: 请求 EIP-712 签名
  U-->>F: 返回签名
  F->>A: POST 订单与签名
  A->>A: 验签 查余额与授权 校验 nonce
  A->>M: 订单入队
  M->>M: 价格时间优先撮合
  M-->>A: 成交列表 剩余挂单
  A-->>F: 返回 订单哈希与状态
  M->>S: 成交入结算队列
  S->>E: matchOrders 两张签名订单 与 成交数量
  E->>E: 验签 记录已成交量 转 USDC 转份额
  E-->>I: 事件 OrderFilled
  I-->>F: WebSocket 推送 成交已上链
`, [
  ['flow', '用户只做一次签名；撮合结果先“软确认”给用户，链上确认后再“硬确认”。'],
  ['fail', '软确认和硬确认之间如果链上回滚，前端要把成交状态改回并提示；这就是为什么要区分 matched 和 confirmed。'],
  ['key', '合约用 filled[订单哈希] 记录已成交量，同一张订单不会被超额成交。']
])}
${mm('核心状态机：市场生命周期', `
stateDiagram-v2
  state "已创建" as Created
  state "交易中" as Trading
  state "已截止" as Closed
  state "已提议" as Proposed
  state "争议中" as Disputed
  state "已结算" as Resolved
  [*] --> Created
  Created --> Trading: 上架并开放下单
  Trading --> Closed: 到达截止时间
  Closed --> Proposed: 提议结果并质押保证金
  Proposed --> Resolved: 挑战期满且无人挑战
  Proposed --> Disputed: 挑战者质押保证金
  Disputed --> Resolved: 多签仲裁给出结果
  Resolved --> [*]
`, [
  ['key', '只有 Resolved 之后才能 redeem；split 只在 Resolved 之前允许；merge 任何时候都允许（完整集合永远值 1 USDC）。'],
  ['fail', '如果截止后无人提议，市场会卡在 Closed。运营方要有“兜底提议者”机器人，并对超时未提议的市场告警。'],
  ['risk', '仲裁多签是本简化方案的信任点。生产环境可以升级为代币投票（例如 UMA 的 DVM）或更大的仲裁委员会。']
])}

<h2>5. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['链', 'Base 或 Arbitrum（L2）', 'Polygon PoS、以太坊主网', '低 Gas、原生 USDC、EVM 工具链完整；主网 Gas 太贵不适合高频结算'],
  ['抵押品', 'USDC（6 位小数）', 'DAI、USDT', '流动性最好；注意 Circle 可冻结地址'],
  ['份额', 'ERC-1155 条件代币（自写简化版）', 'Gnosis Conditional Tokens Framework', '学习目的自写；生产可直接用经审计的 CTF'],
  ['订单', 'EIP-712 签名限价单', '链上挂单', '挂撤单免 Gas，签名可在链上验证'],
  ['撮合服务', 'TypeScript（Node.js 20）+ viem', 'Go', '与前端共享类型和 ABI；单市场单线程足够；对延迟要求极高时换 Go'],
  ['数据库', 'PostgreSQL 16', 'MySQL', 'NUMERIC 精度、事务、JSONB'],
  ['前端', 'Next.js（App Router）+ wagmi v2 + viem', 'Vite + ethers', '生态最成熟，与 M03 技术栈一致'],
  ['仲裁', 'Safe 多签 2/3', 'UMA 乐观预言机', '简化实现；接口保持可替换']
])}

<h2>6. 数据模型</h2>
<h3>6.1 合约存储</h3>
<p>合约存储见第 8 节代码：ConditionalTokens 的 <code>markets</code>、<code>collateralOf</code> 和 ERC-1155 余额/总量；Exchange 的 <code>filled</code>、<code>cancelled</code>、<code>minNonce</code>；OptimisticResolver 的 <code>requests</code>。tokenId = keccak256(marketId, outcome)。</p>
<h3>6.2 链下数据表（DDL）</h3>
${code('SQL', `
CREATE TABLE markets (
  market_id BYTEA PRIMARY KEY, -- 32 字节，与链上一致
  question TEXT NOT NULL,
  rules TEXT NOT NULL, -- 结算规则全文与数据源
  close_time TIMESTAMPTZ NOT NULL,
  yes_token_id NUMERIC(78,0) NOT NULL,
  no_token_id NUMERIC(78,0) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'created', -- created/trading/closed/proposed/disputed/resolved
  outcome SMALLINT, -- 0 YES / 1 NO / 2 INVALID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  order_hash BYTEA PRIMARY KEY,
  maker BYTEA NOT NULL, -- 20 字节地址
  token_id NUMERIC(78,0) NOT NULL,
  side SMALLINT NOT NULL, -- 0 买 / 1 卖
  price BIGINT NOT NULL CHECK (price > 0 AND price < 1000000), -- 单位：1e-6 USDC
  amount NUMERIC(38,0) NOT NULL, -- 份额，6 位小数的整数表示
  filled NUMERIC(38,0) NOT NULL DEFAULT 0,
  nonce BIGINT NOT NULL,
  expiry TIMESTAMPTZ NOT NULL,
  signature BYTEA NOT NULL,
  raw JSONB NOT NULL, -- 原始签名订单，结算时原样提交
  status VARCHAR(16) NOT NULL DEFAULT 'open', -- open/partial/filled/cancelled/expired/invalid
  seq BIGSERIAL, -- 时间优先的序号
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_book ON orders (token_id, side, price, seq) WHERE status IN ('open','partial');
CREATE INDEX idx_orders_maker ON orders (maker, status);

CREATE TABLE fills (
  fill_id BIGSERIAL PRIMARY KEY,
  token_id NUMERIC(78,0) NOT NULL,
  taker_hash BYTEA NOT NULL REFERENCES orders(order_hash),
  maker_hash BYTEA NOT NULL REFERENCES orders(order_hash),
  price BIGINT NOT NULL,
  shares NUMERIC(38,0) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'matched', -- matched/submitted/confirmed/failed
  tx_hash BYTEA,
  block_number BIGINT,
  fail_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fills_status ON fills (status, fill_id);

-- 另有 chain_cursor(name, block_number, block_hash) 记录索引器扫描断点，用于断点续扫和重组检测
`)}

<h2>7. 接口设计</h2>
<h3>7.1 合约函数与事件</h3>
${tbl(['合约', '函数', '事件'], [
  ['ConditionalTokens', '<code>split(marketId, amount)</code> · <code>merge(marketId, amount)</code> · <code>redeem(marketId)</code> · <code>positionId(marketId, outcome)</code>', 'Split · Merge · PayoutReported · Redeemed'],
  ['MarketFactory', '<code>createMarket(question, rules, closeTime)</code>（仅 CREATOR 角色）', 'MarketCreated'],
  ['Exchange', '<code>matchOrders(taker, takerSig, maker, makerSig, shares)</code>（仅运营方）· <code>cancel(order)</code> · <code>setMinNonce(n)</code>', 'OrderFilled · OrderCancelled'],
  ['OptimisticResolver', '<code>propose(marketId, outcome)</code> · <code>dispute(marketId)</code> · <code>settle(marketId)</code> · <code>arbitrate(marketId, outcome)</code>（仅多签）', 'Proposed · Disputed · Settled']
])}
<h3>7.2 REST 与 WebSocket</h3>
${tbl(['方法', '路径', '说明'], [
  ['GET', '/v1/markets?status=trading', '市场列表'],
  ['GET', '/v1/markets/:marketId', '市场详情、规则、YES/NO tokenId、最新价'],
  ['GET', '/v1/book/:tokenId?depth=20', '聚合订单簿：bids/asks 的 [价格, 数量]'],
  ['POST', '/v1/orders', '提交签名订单：{ order, signature }，返回 orderHash、状态、即时成交'],
  ['DELETE', '/v1/orders/:orderHash', '撤单：需附 EIP-712 签名的撤单消息'],
  ['GET', '/v1/orders?maker=0x…&status=open', '我的订单'],
  ['GET', '/v1/trades?tokenId=…', '成交记录（含链上状态）'],
  ['WS', 'book:{tokenId} · trades:{tokenId} · user:{address}', '增量订单簿、成交、个人订单状态（user 频道需 SIWE 登录）']
])}
<p>POST /v1/orders 的请求体就是 8.3 节 Order 结构的 JSON（所有 uint 用十进制字符串表示）加上 65 字节签名。</p>

${recap([
  '份额层：ERC-1155 条件代币，split 存 1 USDC 铸 1 YES + 1 NO，merge 反向，redeem 按赔付比例兑付。',
  '交易层：EIP-712 签名限价单，链下价格时间优先撮合，链上 matchOrders 原子交换，filled 和 nonce 防重放、防超额。',
  '结算层：提议 + 保证金 → 挑战期 → 争议升级多签仲裁 → reportPayout。'
])}
${quiz([
  { q: '用户 split 了 100 USDC，又把 40 YES 卖给别人。此时他 merge 最多能取回多少 USDC？', o: ['100', '40', '140', '60'], a: 3, why: '他还有 60 YES 和 100 NO，merge 需要成对销毁，最多 60 对，取回 60 USDC。' },
  { q: '本架构中，撮合服务（运营方）能做到哪件事？', o: ['拒绝或延迟撮合某个用户的订单', '在用户不签名的情况下卖出他的 YES', '把合约里的 USDC 转给自己', '修改已签名订单的价格'], a: 0, why: '合约只接受双方签名的订单，价格被签名保护，资金不经过运营方。运营方能做的是审查和延迟。' }
])}
${exercises([["思考题（示例）：前端把 0.62 的价格编码成 <code>price = 620000</code>。为什么订单表要求价格严格大于 0 且小于 1,000,000？", "<p>价格单位是 1e-6 USDC，1,000,000 代表 1 USDC。一份份额最多兑付 1 USDC，以 1 或更高的价格买入没有意义。价格为 0 也没有意义。合约的检查要求 <code>price</code> 大于 0 且小于 <code>ONE</code>，数据库的 CHECK 约束与它一致，非法订单在入库时就被拒绝。</p>"], ["设计题：一个市场处于 Disputed 状态。用户想做 split、merge、redeem，哪些能成功？如果截止后一直没人提议，系统会怎样？怎样兜底？", "<p>split 只在 Resolved 之前允许，所以能成功。merge 任何时候都允许，因为完整集合永远值 1 USDC。redeem 必须等到 Resolved，现在会失败。截止后无人提议时，市场会卡在 Closed。运营方要运行兜底提议者机器人，并对截止超过 1 小时仍未提议的市场告警。</p>"], ["思考题：撮合引擎已经把成交推给用户，但链上 matchOrders 回滚了。系统应该怎样处理？为什么成交表要区分 matched 和 confirmed？", "<p>撮合结果只是软确认，链上确认后才是硬确认。回滚通常因为一方余额或授权不足。结算器要找出责任方，把该订单标记为 invalid 并移出订单簿，再恢复对手方订单的剩余数量。前端把成交状态改回并提示用户。区分 matched 和 confirmed，才能准确表示“已撮合但未上链”这段状态。</p>"]])}
${checklist(["能画出“链下撮合 + 链上结算”的架构图，并说出运营方能做和不能做的事。", "能写出市场生命周期状态机，并标出每个状态下 split、merge、redeem 是否允许。", "能为订单表和成交表设计 status 字段，并说明 matched 与 confirmed 的区别。", "能列出 ConditionalTokens、MarketFactory、Exchange、OptimisticResolver 的主要函数和事件。", "能把一条用户故事改写成可验证的验收标准。"])}
${call('info', '<p>设计到此完成。下一篇 <a href="#m08-50">M09.12 实战·实现</a> 讲核心代码、测试策略、部署运维、安全清单与里程碑。</p>', '下一篇')}
` });

CUR = 'm08-50';
addCh({ id: 'm08-50', nav: '实战·实现：二元预测市场', title: 'M09.12 实战·实现：二元预测市场（合约 + 撮合 + 结算 + 前端）', desc: '核心代码、测试策略、部署运维、安全清单、里程碑与扩展方向', html: `
<h1>M09.12 实战·实现：二元预测市场（合约 + 撮合 + 结算 + 前端）</h1>
${meta(['按上篇的设计，读懂并能复现本项目的核心代码。', '为项目制定测试策略：单元、集成、模糊与故障注入。', '完成部署、监控与安全清单，并按里程碑交付。'], '前置：<a href="#m08-11">M09.11 实战·设计</a>')}
${call('info', '<p>本篇是项目的下篇。架构图、数据模型和接口定义都在<a href="#m08-11">上篇</a>，读代码时可以对照着看。</p>')}
${art('一图看懂：四个合约、一个撮合服务、一个前端怎样分工', 660, 362, [
  S.zone(10, 24, 220, 300, { t: '链下与本地' }),
  S.zone(280, 24, 370, 300, { t: '链上合约（Solidity · L2）' }),
  S.box(22, 52, 196, 66, { k: 'idle', t: 'script/Deploy.s.sol', s: '部署顺序：\nCT → Resolver → Factory', mono: 1, ts: 12 }),
  S.box(22, 146, 196, 66, { k: 'info', t: 'web/ 前端（Next.js）', s: 'useBuy()：签名下单\n共享 eip712.ts' }),
  S.box(22, 240, 196, 66, { k: 'info', t: 'matcher/ 撮合服务', s: 'OrderBook.submit()\nsettle(fill)' }),
  S.arrow(120, 214, 120, 238, { k: 'plain' }),
  S.box(294, 52, 150, 66, { k: 'tint', t: 'MarketFactory', s: 'createMarket()', mono: 1, ts: 12 }),
  S.box(458, 52, 178, 66, { k: 'tint', t: 'OptimisticResolver', s: 'propose · dispute\nsettle · arbitrate', mono: 1, ts: 12 }),
  S.box(294, 146, 342, 66, { k: 'key', t: 'ConditionalTokens', s: 'split · merge · redeem · reportPayout', mono: 1 }),
  S.box(294, 240, 342, 66, { k: 'tint', t: 'Exchange', s: 'matchOrders：验签，原子交换 USDC 与份额', mono: 1, tag: '仅运营方' }),
  S.arrow(369, 120, 369, 144, { k: 'plain' }), S.arrow(547, 120, 547, 144, { k: 'plain' }), S.arrow(465, 238, 465, 214, { k: 'plain' }),
  S.arrow(220, 85, 292, 85, { k: 'plain', label: '部署' }),
  S.arrow(220, 179, 292, 179, { k: 'key', label: '直接调用', ls: 11 }),
  S.arrow(220, 273, 292, 273, { k: 'plain', label: '提交成交', ls: 11 }),
  S.text(330, 346, '运营方只调用 Exchange.matchOrders；用户可直接调用 ConditionalTokens 退出', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '前端签名订单发给撮合服务；撮合服务的结算器调用 Exchange.matchOrders；Exchange 再通过 ConditionalTokens 转移份额。'],
  ['key', 'ConditionalTokens 是唯一托管 USDC 的合约；Factory 和 Resolver 只能通过它登记市场、写入结算结果。'],
  ['risk', 'Exchange 的 matchOrders 只允许运营方调用，但每笔成交都必须带双方签名。'],
  ['limit', '部署有先后依赖：先 ConditionalTokens，再 Resolver，最后 Factory 并调用 ct.setFactory。']
], '代码结构：前端 web 签名订单交给撮合服务 matcher，撮合服务调用 Exchange 的 matchOrders；前端也可以直接调用 ConditionalTokens。MarketFactory 和 OptimisticResolver 通过 ConditionalTokens 登记市场和写入结算结果；部署脚本按顺序部署。', 'm08-50')}

<h2>8. 核心代码</h2>
${art('一图看懂：数据存在哪里，谁读谁写', 660, 384, [
  S.zone(10, 24, 120, 170, { t: '浏览器' }),
  S.zone(170, 24, 270, 260, { t: '链下服务' }),
  S.zone(500, 24, 150, 260, { t: '链上 L2' }),
  S.box(22, 56, 96, 96, { k: 'warn', t: '钱包', s: '私钥自己管\n签名订单' }),
  S.box(186, 54, 238, 52, { k: 'info', t: 'API + 撮合引擎', s: '内存订单簿 · 单线程' }),
  S.box(186, 134, 238, 52, { k: 'key', icon: 'db', t: 'PostgreSQL', s: 'orders · fills · 先落库再确认', mono: 1 }),
  S.box(186, 214, 112, 52, { k: 'info', t: '索引器', s: '读事件 · 对账' }),
  S.box(312, 214, 112, 52, { k: 'info', t: '结算器', s: '模拟后上链' }),
  S.box(512, 54, 126, 212, { k: 'ok', icon: 'block', t: '合约状态', s: 'filled\ncancelled\nminNonce\nmarkets\ncollateralOf\nrequests', mono: 1 }),
  S.arrow(120, 90, 184, 80, { k: 'warn', label: '签名订单', ls: 11 }),
  S.arrow(305, 108, 305, 132, { k: 'plain' }),
  S.arrow(368, 188, 368, 212, { k: 'plain' }),
  S.arrow(242, 212, 242, 188, { k: 'info', dash: 1 }),
  S.arrow(426, 240, 510, 240, { k: 'plain', label: 'matchOrders', ls: 11 }),
  S.route([[560, 268], [560, 308], [242, 308], [242, 268]], { k: 'info', dash: 1, label: '链上事件', ls: 11 }),
  S.route([[75, 154], [75, 336], [600, 336], [600, 268]], { k: 'ok', dash: 1, label: '直接上链：split / merge / redeem / 撤单', ls: 11, lx: -120 }),
  S.text(330, 372, '链下只有数据库是持久的；链上状态是最终依据，索引器负责把两边对上', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '订单先在 API 落库，再进内存订单簿撮合；成交写入 fills 表，结算器按顺序模拟并上链；索引器读链上事件回写数据库。'],
  ['key', '撮合进程重启后，可以靠数据库里的 orders 和 fills 恢复内存订单簿，所以必须先落库再确认。'],
  ['fail', '结算交易回滚时，要把失败订单标记为 invalid，对手方订单放回订单簿。'],
  ['risk', '数据库与链上状态不一致时以链上为准，对账不平要告警。']
], '数据存放位置：钱包在浏览器签名订单；链下服务里 API 与撮合引擎持有内存订单簿，PostgreSQL 保存订单和成交，结算器调用链上合约，索引器读取链上事件对账；用户也可以直接调用链上合约。', 'm08-50')}
<h3>8.1 条件代币：split / merge / redeem</h3>
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ConditionalTokens is ERC1155Supply, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    struct Market { address resolver; uint64 closeTime; bool resolved; uint32[2] payout; } // YES 赢 [1,0]，NO 赢 [0,1]，无效 [1,1]

    IERC20 public immutable collateral;                 // USDC，6 位小数：1 份 = 1e6 单位 = 1 USDC
    address public factory;
    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => uint256) public collateralOf;    // 每个市场锁定的 USDC
    event Split(bytes32 indexed marketId, address indexed user, uint256 amount);
    event PayoutReported(bytes32 indexed marketId, uint32[2] payout);

    constructor(IERC20 usdc) ERC1155("") Ownable(msg.sender) { collateral = usdc; }
    function setFactory(address f) external onlyOwner { factory = f; }

    function positionId(bytes32 marketId, uint8 outcome) public pure returns (uint256) {
        return uint256(keccak256(abi.encode(marketId, outcome)));
    }
    function _ids(bytes32 m) internal pure returns (uint256[] memory a) {
        a = new uint256[](2); a[0] = positionId(m, 0); a[1] = positionId(m, 1);
    }
    function _two(uint256 x, uint256 y) internal pure returns (uint256[] memory a) {
        a = new uint256[](2); a[0] = x; a[1] = y;
    }

    function prepareMarket(bytes32 marketId, address resolver, uint64 closeTime) external {
        require(msg.sender == factory && markets[marketId].resolver == address(0), "denied");
        (markets[marketId].resolver, markets[marketId].closeTime) = (resolver, closeTime);
    }

    function split(bytes32 marketId, uint256 amount) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.resolver != address(0) && !m.resolved && amount > 0, "not active");
        collateral.safeTransferFrom(msg.sender, address(this), amount);     // 1. 先收钱
        collateralOf[marketId] += amount;                                   // 2. 再记账
        _mintBatch(msg.sender, _ids(marketId), _two(amount, amount), "");   // 3. 最后铸币（会回调接收方）
        emit Split(marketId, msg.sender, amount);
    }

    function merge(bytes32 marketId, uint256 amount) external nonReentrant {
        _burnBatch(msg.sender, _ids(marketId), _two(amount, amount));      // 余额不足会回滚
        collateralOf[marketId] -= amount;
        collateral.safeTransfer(msg.sender, amount);
    }

    function reportPayout(bytes32 marketId, uint32[2] calldata p) external {
        Market storage m = markets[marketId];
        require(msg.sender == m.resolver && !m.resolved && uint256(p[0]) + p[1] > 0, "denied");
        (m.payout, m.resolved) = (p, true);
        emit PayoutReported(marketId, p);
    }

    /// 赔付 = (YES 余额 × p0 + NO 余额 × p1) / (p0 + p1)，向下取整：合约永远不欠钱
    function redeem(bytes32 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.resolved, "not resolved");
        uint256[] memory ids = _ids(marketId);
        uint256 b0 = balanceOf(msg.sender, ids[0]);
        uint256 b1 = balanceOf(msg.sender, ids[1]);
        uint256 pay = (b0 * m.payout[0] + b1 * m.payout[1]) / (uint256(m.payout[0]) + m.payout[1]);
        _burnBatch(msg.sender, ids, _two(b0, b1));
        collateralOf[marketId] -= pay;
        collateral.safeTransfer(msg.sender, pay);
    }
}
`)}
${call('info', `<p>为什么 YES/NO 份额能“凭空”有价格？因为它们只能通过 split 成对产生，每对背后锁着 1 USDC。如果 YES 0.65 + NO 0.40 = 1.05，套利者就 split 1 USDC 再把两边卖掉，赚 0.05，于是两者价格之和被拉回 1 附近。见 <a href="#m08-2">M09.2 交易与套利</a>。生产版本还要为 merge、redeem 发出事件。</p>`)}
<h3>8.2 市场工厂与乐观结算</h3>
<p><strong>MarketFactory</strong> 很简单：持有 CREATOR 角色的账户调用 <code>createMarket(question, rules, closeTime)</code>，工厂用 <code>keccak256(abi.encode(block.chainid, address(this), nonce++, question))</code> 生成 marketId，依次调用 <code>ct.prepareMarket(marketId, resolver, closeTime)</code> 和 <code>resolver.register(marketId, closeTime)</code>，再发出 MarketCreated 事件（事件里带上规则全文，供索引器入库）。下面是结算器的核心：</p>
${code('SOLIDITY', `
contract OptimisticResolver {
    using SafeERC20 for IERC20;
    enum State { None, Open, Proposed, Disputed, Settled }
    struct Req { State state; uint8 outcome; uint64 closeTime; uint64 proposedAt; address proposer; address disputer; }

    IERC20 public immutable bondToken;                   // USDC
    ICT public immutable ct;                             // 只需 reportPayout 接口
    address public immutable factory;
    address public immutable arbitrator;                 // Safe 多签
    uint256 public constant BOND = 500e6;                // 500 USDC（示例）
    uint64 public constant LIVENESS = 2 hours;           // 挑战期（示例）
    mapping(bytes32 => Req) public requests;

    function register(bytes32 id, uint64 closeTime) external {
        require(msg.sender == factory);
        requests[id] = Req(State.Open, 0, closeTime, 0, address(0), address(0));
    }

    function propose(bytes32 id, uint8 outcome) external {   // outcome：0 YES，1 NO，2 无效
        Req storage r = requests[id];
        require(r.state == State.Open && block.timestamp >= r.closeTime && outcome <= 2);
        bondToken.safeTransferFrom(msg.sender, address(this), BOND);
        (r.state, r.outcome, r.proposer, r.proposedAt) = (State.Proposed, outcome, msg.sender, uint64(block.timestamp));
    }

    function dispute(bytes32 id) external {
        Req storage r = requests[id];
        require(r.state == State.Proposed && block.timestamp < r.proposedAt + LIVENESS);
        bondToken.safeTransferFrom(msg.sender, address(this), BOND);
        (r.state, r.disputer) = (State.Disputed, msg.sender);
    }

    function settle(bytes32 id) external {                // 挑战期满且无争议：任何人可调用
        Req storage r = requests[id];
        require(r.state == State.Proposed && block.timestamp >= r.proposedAt + LIVENESS);
        _finalize(id, r, r.outcome, r.proposer, BOND);
    }

    function arbitrate(bytes32 id, uint8 outcome) external { // 争议升级：多签裁决，赢方拿回两份保证金
        Req storage r = requests[id];
        require(msg.sender == arbitrator && r.state == State.Disputed && outcome <= 2);
        _finalize(id, r, outcome, outcome == r.outcome ? r.proposer : r.disputer, 2 * BOND);
    }

    function _finalize(bytes32 id, Req storage r, uint8 o, address to, uint256 amt) internal {
        (r.state, r.outcome) = (State.Settled, o);          // 先改状态（CEI）
        uint32[2] memory p = o == 0 ? [uint32(1), 0] : o == 1 ? [uint32(0), 1] : [uint32(1), 1];
        ct.reportPayout(id, p);
        bondToken.safeTransfer(to, amt);
    }
}
`)}
<p>说明：工厂和结算器互相引用。部署时先部署 ConditionalTokens，再用 <code>vm.computeCreateAddress</code> 预算工厂地址传给结算器构造函数，最后部署工厂并调用 <code>ct.setFactory</code>。生产版本应为每个状态变化发出事件，并给 require 加上错误信息。</p>

<h3>8.3 交易所：EIP-712 签名订单结算</h3>
${code('SOLIDITY', `
// 导入：EIP712、SignatureChecker、SafeERC20、IERC1155、Math、ReentrancyGuard（均来自 OpenZeppelin v5）
contract Exchange is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;
    struct Order {
        uint256 salt; address maker; uint256 tokenId;
        uint8 side;      // 0 买 1 卖
        uint256 price;   // 每份价格，1e6 = 1 USDC
        uint256 amount;  // 份额，1e6 = 1 份
        uint64 expiry; uint64 nonce;
        uint16 feeBps;   // 作为 taker 时愿意支付的最高费率
    }
    bytes32 public constant ORDER_TYPEHASH = keccak256("Order(uint256 salt,address maker,uint256 tokenId,uint8 side,uint256 price,uint256 amount,uint64 expiry,uint64 nonce,uint16 feeBps)");
    uint256 public constant ONE = 1e6;
    IERC20 public immutable usdc;
    IERC1155 public immutable ct;
    address public immutable operator;   // 撮合服务的结算账户
    address public immutable treasury;
    mapping(bytes32 => uint256) public filled;
    mapping(bytes32 => bool) public cancelled;
    mapping(address => uint64) public minNonce;
    event OrderFilled(bytes32 indexed takerHash, bytes32 indexed makerHash, uint256 price, uint256 shares);

    constructor(IERC20 u, IERC1155 c, address op, address t) EIP712("BinaryExchange", "1") {
        (usdc, ct, operator, treasury) = (u, c, op, t);
    }

    function hashOrder(Order calldata o) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(ORDER_TYPEHASH, o.salt, o.maker, o.tokenId,
            o.side, o.price, o.amount, o.expiry, o.nonce, o.feeBps)));
    }

    function _check(Order calldata o, bytes calldata sig) internal view returns (bytes32 h) {
        h = hashOrder(o);
        require(SignatureChecker.isValidSignatureNow(o.maker, h, sig), "bad sig"); // EOA 与 ERC-1271 合约钱包
        require(block.timestamp < o.expiry && o.nonce >= minNonce[o.maker] && !cancelled[h], "dead");
        require(o.price > 0 && o.price < ONE && o.side <= 1 && o.feeBps <= 1000, "bad order");
    }

    function matchOrders(Order calldata taker, bytes calldata takerSig,
                         Order calldata maker, bytes calldata makerSig, uint256 shares) external nonReentrant {
        require(msg.sender == operator, "only operator");
        bytes32 ht = _check(taker, takerSig);
        bytes32 hm = _check(maker, makerSig);
        require(taker.tokenId == maker.tokenId && taker.side != maker.side, "mismatch");
        require(filled[ht] + shares <= taker.amount && filled[hm] + shares <= maker.amount, "overfill");
        bool tb = taker.side == 0;                                   // taker 是否为买方
        require(tb ? taker.price >= maker.price : maker.price >= taker.price, "not crossed");
        (address buyer, address seller) = tb ? (taker.maker, maker.maker) : (maker.maker, taker.maker);

        filled[ht] += shares;                                        // 先记账（CEI）
        filled[hm] += shares;
        uint256 cost = Math.mulDiv(shares, maker.price, ONE, Math.Rounding.Ceil); // 按挂单价成交，买方向上取整
        uint256 fee = cost * taker.feeBps / 10_000;                  // 只收 taker 手续费
        usdc.safeTransferFrom(buyer, seller, tb ? cost : cost - fee);
        if (fee > 0) usdc.safeTransferFrom(buyer, treasury, fee);
        ct.safeTransferFrom(seller, buyer, taker.tokenId, shares, ""); // 卖方需 setApprovalForAll
        emit OrderFilled(ht, hm, maker.price, shares);
    }

    function cancel(Order calldata o) external { require(msg.sender == o.maker); cancelled[hashOrder(o)] = true; }
    function setMinNonce(uint64 n) external { require(n > minNonce[msg.sender]); minNonce[msg.sender] = n; } // 批量作废旧单
}
`)}
${call('deep', `<p>本合约只实现“买单 vs 卖单”。Polymarket 的 CTF Exchange 还支持：① “买 YES + 买 NO”价格之和 ≥ 1 时，收两方 USDC 调用 split 铸出一对份额分给双方（铸造撮合）；② “卖 YES + 卖 NO”价格之和 ≤ 1 时调用 merge（合并撮合）。这让 YES 和 NO 两本订单簿共享流动性，交易所需继承 ERC1155Holder。见 <a href="#m08-5">M09.5 Polymarket 架构</a>。</p>`)}

<h3>8.4 撮合服务（TypeScript）</h3>
<p>EIP-712 的 domain 和 types 放在一个共享文件 <code>eip712.ts</code> 里，撮合服务和前端共用，字段顺序与合约中的 ORDER_TYPEHASH 完全一致。验签用 viem 的 <code>publicClient.verifyTypedData</code>，它同时支持 EOA 与 ERC-1271 合约钱包。</p>
${code('TYPESCRIPT', `
import { createPublicClient, createWalletClient, http, type Hex } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { domain, type Order } from './eip712';
import { exchangeAbi } from './abis';

export type Resting = { hash: Hex; order: Order; sig: Hex; remaining: bigint };
export type Fill = { taker: Resting; maker: Resting; shares: bigint; price: bigint };

// 每个 tokenId 一个订单簿实例，由单线程事件队列驱动，天然无并发冲突
export class OrderBook {
  bids: Resting[] = []; // 价格降序，同价先到先得
  asks: Resting[] = []; // 价格升序，同价先到先得

  submit(r: Resting): Fill[] {
    const fills: Fill[] = [];
    const isBuy = r.order.side === 0;
    const book = isBuy ? this.asks : this.bids;
    while (r.remaining > 0n && book.length > 0) {
      const top = book[0];
      const crossed = isBuy ? r.order.price >= top.order.price : r.order.price <= top.order.price;
      if (!crossed) break;
      const shares = r.remaining < top.remaining ? r.remaining : top.remaining;
      fills.push({ taker: r, maker: top, shares, price: top.order.price }); // 按挂单方价格成交
      r.remaining -= shares;
      top.remaining -= shares;
      if (top.remaining === 0n) book.shift();
    }
    if (r.remaining > 0n) {             // 剩余挂单：插到同价位已有订单之后（时间优先）
      const list = isBuy ? this.bids : this.asks;
      const better = (x: Resting) => (isBuy ? r.order.price > x.order.price : r.order.price < x.order.price);
      const i = list.findIndex(better);
      list.splice(i < 0 ? list.length : i, 0, r);
    }
    return fills;
  }
}

// 结算器：单一运营方账户串行提交，避免 nonce 冲突；生产环境用 KMS 签名替代私钥
const pub = createPublicClient({ chain: baseSepolia, transport: http(process.env.RPC_URL) });
const op = privateKeyToAccount(process.env.OPERATOR_KEY as Hex);
const wallet = createWalletClient({ account: op, chain: baseSepolia, transport: http(process.env.RPC_URL) });

export async function settle(f: Fill): Promise<Hex> {
  const { request } = await pub.simulateContract({ // 先模拟：余额或授权不足在这里报错，不浪费 Gas
    account: op, address: domain.verifyingContract, abi: exchangeAbi, functionName: 'matchOrders',
    args: [f.taker.order, f.taker.sig, f.maker.order, f.maker.sig, f.shares],
  });
  const hash = await wallet.writeContract(request);
  const rcpt = await pub.waitForTransactionReceipt({ hash });
  if (rcpt.status !== 'success') throw new Error('settlement reverted');
  return hash;
}
`)}
<p>撮合服务的关键流程：</p>
${steps([
  '<strong>入口校验</strong>：验签；检查 expiry、nonce ≥ minNonce；买单检查 USDC 余额与授权，卖单检查份额余额与 isApprovedForAll；扣减“链下冻结额度”，防止同一笔余额挂出多张超额订单。',
  '<strong>先落库再确认</strong>：订单写入 orders 表（带 seq）成功后才进入内存订单簿；成交写入 fills 表（status = matched）成功后才推送给用户。进程重启时按 seq 从数据库重建订单簿。',
  '<strong>结算</strong>：结算器按 fill_id 顺序取 matched 记录，simulate → 发送 → 等回执，更新为 confirmed 或 failed。',
  '<strong>失败处理</strong>：simulate 失败时找出责任方（余额/授权不足的一方），把该订单标记为 invalid 并从订单簿移除；对手方订单恢复剩余数量重新挂单。',
  '<strong>链上对账</strong>：索引器读取 OrderFilled 事件，校验每笔 confirmed 的 fill 都有对应事件，且链上 filled[hash] 与数据库 filled 一致。'
])}

<h3>8.5 前端：签名下单（Next.js + wagmi）</h3>
${code('TYPESCRIPT', `
'use client';
import { useAccount, useSignTypedData } from 'wagmi';
import { parseUnits } from 'viem';
import { domain, types } from '@/lib/eip712';            // 与撮合服务共享同一份定义

export function useBuy(tokenId: bigint) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  return async (priceStr: string, sharesStr: string) => {
    if (!address) throw new Error('请先连接钱包');
    const order = {
      salt: BigInt(Date.now()), maker: address, tokenId, side: 0,
      price: parseUnits(priceStr, 6),                     // 0.62 → 620000
      amount: parseUnits(sharesStr, 6),                   // 50 → 50000000
      expiry: BigInt(Math.floor(Date.now() / 1000) + 86400), nonce: 0n, feeBps: 20,
    } as const;
    const signature = await signTypedDataAsync({ domain, types, primaryType: 'Order', message: order });
    const res = await fetch('/api/v1/orders', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order, signature }, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();                                    // { orderHash, status, fills }
  };
}
`)}
<p>首次买入前，前端用 <code>useWriteContract</code> 调 USDC 的 <code>approve(exchange, 金额)</code>；首次卖出前调 ConditionalTokens 的 <code>setApprovalForAll(exchange, true)</code>。split、merge、redeem 都由前端直接调用合约，不经过运营方。</p>
${tbl(['页面', '内容', '关键交互'], [
  ['/', '市场列表：问题、YES 价格（隐含概率）、成交量、截止时间', '按状态与分类筛选'],
  ['/market/[id]', '规则全文、价格走势、YES/NO 订单簿、下单表单、我的挂单', '签名下单、撤单、split/merge'],
  ['/portfolio', '持仓、未实现盈亏、已结算待赎回', 'redeem、链上撤单（setMinNonce）'],
  ['/admin', '创建市场、提议结果、查看争议', '仅 CREATOR 角色与提议机器人使用']
])}
${call('warn', `<p>前端必须把 EIP-712 签名的每个字段翻译成人话：“以 0.62 USDC/份 买入 50 份 YES（市场：……），有效期至……”。钓鱼网站常诱导用户签一个看不懂的结构化消息。签名安全见 <a href="#m07-8">M03.8 前端安全</a>。</p>`)}

<h2>9. 测试策略</h2>
${tbl(['层级', '工具', '用例（示例）'], [
  ['合约单元', 'Foundry', 'split 余额正确；merge 余额不足回滚；未结算 redeem 回滚；三种赔付；非 resolver 上报回滚'],
  ['交易所单元', 'Foundry', '坏签名、过期、低 nonce、已撤单、超额、不交叉均回滚；部分成交；手续费与取整'],
  ['结算器单元', 'Foundry + vm.warp', '截止前提议、挑战期内 settle、挑战期后 dispute 均回滚；仲裁后保证金归属'],
  ['不变量', 'Foundry invariant', '抵押品 = 未赎回完整集合；USDC 余额 = Σ collateralOf；订单 filled ≤ amount'],
  ['撮合服务', 'Vitest', '价格优先、时间优先、部分成交、撤单、重启后从数据库重建与原状态一致'],
  ['集成', 'Anvil + 撮合服务 + 前端 E2E（Playwright）', '下单 → 撮合 → 上链 → 索引器推送；结算回滚后订单被标记 invalid'],
  ['压测', 'k6', '单市场 300 单/秒持续 10 分钟，撮合 P99 < 10 ms，无订单丢失'],
  ['故障注入', '杀进程 / 断 RPC / 断数据库', '撮合服务崩溃重启后无重复结算；RPC 断开时结算队列积压并告警，恢复后补交']
])}
${code('SOLIDITY', `
// test/Invariant.t.sol —— 抵押品 = 未赎回完整集合
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {ConditionalTokens} from "../src/ConditionalTokens.sol";

// MockUSDC：6 位小数、带 mint 的 ERC20（略）

contract Handler is Test {
    ConditionalTokens public ct;
    MockUSDC public usdc;
    bytes32 public market;
    address[3] public actors;

    constructor(ConditionalTokens _ct, MockUSDC _u, bytes32 _m) {
        ct = _ct; usdc = _u; market = _m;
        actors = [makeAddr("a"), makeAddr("b"), makeAddr("c")];
    }

    function split(uint256 who, uint256 amt) external {
        address a = actors[who % 3];
        amt = bound(amt, 1, 1e12);
        usdc.mint(a, amt);
        vm.startPrank(a);
        usdc.approve(address(ct), amt);
        ct.split(market, amt);
        vm.stopPrank();
    }

    function merge(uint256 who, uint256 amt) external {
        address a = actors[who % 3];
        uint256 y = ct.balanceOf(a, ct.positionId(market, 0));
        uint256 n = ct.balanceOf(a, ct.positionId(market, 1));
        uint256 maxAmt = y < n ? y : n;
        if (maxAmt == 0) return;
        amt = bound(amt, 1, maxAmt);
        vm.prank(a);
        ct.merge(market, amt);
    }

    // 只转 YES：模拟二级市场交易，让持仓分布变得不对称
    function transferYes(uint256 from, uint256 to, uint256 amt) external {
        address f = actors[from % 3];
        uint256 id = ct.positionId(market, 0);
        uint256 bal = ct.balanceOf(f, id);
        if (bal == 0) return;
        amt = bound(amt, 1, bal);
        vm.prank(f);
        ct.safeTransferFrom(f, actors[to % 3], id, amt, "");
    }
}

contract InvariantTest is StdInvariant, Test {
    ConditionalTokens ct;
    MockUSDC usdc;
    Handler h;
    bytes32 constant M = keccak256("market-1");

    function setUp() public {
        usdc = new MockUSDC();
        ct = new ConditionalTokens(usdc);
        ct.setFactory(address(this));
        ct.prepareMarket(M, address(this), uint64(block.timestamp + 1 days));
        h = new Handler(ct, usdc, M);
        targetContract(address(h));
    }

    function invariant_collateralEqualsCompleteSets() public view {
        uint256 yes = ct.totalSupply(ct.positionId(M, 0));
        uint256 no = ct.totalSupply(ct.positionId(M, 1));
        assertEq(yes, no, "YES supply != NO supply");
        assertEq(ct.collateralOf(M), yes, "collateral != complete sets");
        assertEq(usdc.balanceOf(address(ct)), ct.collateralOf(M), "USDC balance mismatch");
    }
}
`)}
<p>结算后的不变量要改写：设赔付为 [p0, p1]，必须始终满足 collateralOf ≥ (YES 总量 × p0 + NO 总量 × p1) ÷ (p0 + p1)。在 Handler 中加入 resolve 和 redeem 动作即可覆盖。运行：<code>forge test --match-contract InvariantTest -vv</code>，在 foundry.toml 中设置 <code>[invariant] runs = 256, depth = 64</code>（示例）。</p>

<h2>10. 部署与运维</h2>
${steps([
  '<strong>环境</strong>：local（Anvil）→ testnet（Base Sepolia，MockUSDC 或 Circle 测试 USDC）→ mainnet。每个环境独立的合约地址、数据库和密钥。',
  '<strong>CI/CD</strong>：合约 PR 必须通过 forge fmt、forge test（含不变量）、Slither 静态分析；服务 PR 通过 lint、Vitest、集成测试；合并后自动构建镜像部署到 testnet，主网部署需要人工审批。',
  '<strong>密钥</strong>：部署者用 Foundry keystore（<code>cast wallet import</code>），不把私钥写进环境变量；运营方结算账户用云 KMS 签名，只存够几天的 Gas；合约管理员和仲裁者都是 Safe 多签。',
  '<strong>配置</strong>：链 ID、合约地址、RPC（主备两个供应商）、确认数、手续费率、挑战期参数全部进配置中心，变更有审计记录。'
])}
${code('BASH', `
# 1. 导入部署者密钥到 Foundry keystore（交互式输入，不留在 shell 历史）
cast wallet import deployer --interactive

# 2. 运行测试（含不变量）
forge test -vv

# 3. 部署到 Base Sepolia 并在区块浏览器验证源码
forge script script/Deploy.s.sol \\
  --rpc-url "$BASE_SEPOLIA_RPC" --account deployer --broadcast --verify

# 4. 核对部署结果：读取 ConditionalTokens 的 factory 是否已设置
cast call "$CT_ADDRESS" "factory()(address)" --rpc-url "$BASE_SEPOLIA_RPC"
`)}
${tbl(['指标', '含义', '告警阈值（示例）'], [
  ['match_latency_ms', '订单进入撮合到产出结果', 'P99 > 20 ms 持续 5 分钟'],
  ['settlement_queue_depth', '等待上链的成交数', '> 200 或最老一笔等待 > 60 秒'],
  ['settlement_revert_total', '结算失败次数', '5 分钟内 > 5'],
  ['operator_gas_balance', '运营方账户 ETH 余额', '< 预计 24 小时消耗'],
  ['collateral_diff', 'USDC 余额 − Σ collateralOf', '≠ 0 立即告警（P0）'],
  ['markets_unproposed', '截止超过 1 小时仍无人提议的市场数', '> 0'],
])}
${tryit(`<p>动手练习：在本地跑通最小闭环。</p>
<ol><li><code>forge init pm && cd pm && forge install OpenZeppelin/openzeppelin-contracts</code>，在 remappings 中加入 <code>@openzeppelin/=lib/openzeppelin-contracts/</code>。</li>
<li>把 8.1 的 ConditionalTokens 和第 9 节的不变量测试放进 src/ 和 test/，运行 <code>forge test --match-contract InvariantTest</code>。预期：invariant_collateralEqualsCompleteSets 通过。</li>
<li>故意在 merge 中删掉 <code>collateralOf[marketId] -= amount;</code> 再运行。预期：不变量测试失败，并给出一条导致失败的调用序列。</li>
<li>恢复代码，启动 <code>anvil</code>，用 cast 调用 split，然后 <code>cast call</code> 查询 YES 余额。</li></ol>`)}

<h2>11. 安全清单与威胁模型</h2>
${tbl(['威胁', '攻击方式', '防护'], [
  ['运营方作恶', '伪造成交、挪用资金', '合约只接受双方签名订单；资金不经过运营方；用户可链上撤单、merge、redeem'],
  ['运营方审查', '拒绝撮合某些用户', '公开撮合日志；提供链上直接 split/merge 退出路径；长期可引入多撮合者'],
  ['签名重放', '同一订单跨链或跨合约重放', 'EIP-712 domain 含 chainId 和 verifyingContract；filled 记录已成交量'],
  ['超额成交', '同一订单被多次成交', 'filled[hash] + shares ≤ amount 检查，先记账后转账'],
  ['重入', 'ERC-1155 接收回调重入 split/merge/redeem', 'nonReentrant + 检查-生效-交互（CEI）顺序'],
  ['舍入', '利用取整差薅羊毛', '买方付款向上取整、赎回向下取整，合约永远不欠钱；不变量测试守护'],
  ['错误结算', '提议错误结果', '保证金 + 挑战期 + 多签仲裁；规则文本写清数据源和边界情况'],
  ['仲裁者被攻破', '多签私钥泄露或串通', '多签 2/3 以上、签名人分散、硬件钱包；关键操作加时间锁并公开'],
  ['规则歧义', '问题措辞含糊导致争议', '规则模板：数据源、时区、截止时间、“无效”条件；上线前人工审核'],
])}
<h3>11.1 合规清单</h3>
${steps([
  '<strong>地域限制</strong>：预测市场在很多国家和地区被视为博彩或衍生品。按 IP 和 KYC 结果屏蔽受限地区，并在服务条款中写明。',
  '<strong>美国</strong>：事件合约受 CFTC 监管。Kalshi 是 CFTC 指定合约市场（DCM）；Polymarket 在 2022 年与 CFTC 和解（罚款 140 万美元）并屏蔽了美国用户' + cite('CFTC：Polymarket 和解新闻稿', 'https://www.cftc.gov/PressRoom/PressReleases/8478-22') + '；2025 年通过收购持牌交易所 QCEX 寻求重返美国。没有牌照不要向美国用户提供服务。',
  '<strong>制裁筛查</strong>：对钱包地址做制裁名单筛查（例如 OFAC SDN 名单），命中则拒绝服务。',
  '<strong>市场内容</strong>：不上线涉及暴力、可被参与者直接操纵结果的事件（例如个人行为）。',
  '<strong>风险披露</strong>：明确告知合约风险、结算争议风险、抵押品风险。本项目是学习项目，上线真实资金前必须咨询律师并完成审计。'
])}

${mm('预测市场的交付顺序：先合约，再链下，最后前端', `
flowchart LR
  W1["第 1 周<br/>条件代币与市场工厂"]
  W2["第 2 周<br/>交易所合约与结算器"]
  W3["第 3 周<br/>链下撮合服务"]
  W4["第 4 周<br/>索引器与前端下单"]
  W5["第 5 周<br/>持仓、赎回与端到端集成"]
  W6["第 6 周<br/>压测、监控与威胁模型"]
  W1 --> W2 --> W3 --> W4 --> W5 --> W6
  class W1 key
  class W6 ok
`, [
  ['flow', '合约在第 2 周结束前全部测试通过，因为撮合服务和前端都依赖合约接口；接口一旦变更，后面全部返工。'],
  ['key', '每周结束都要有可演示的交付物，而不是“写了一部分代码”。'],
  ['limit', '6 周是单人或小团队的示例节奏，实际以团队规模和验收标准调整。']
])}
<h2>12. 里程碑计划（6 周）</h2>
${tbl(['周', '目标', '交付物'], [
  ['第 1 周', '合约 I：条件代币与工厂', 'ConditionalTokens、MarketFactory、单元测试、不变量测试通过'],
  ['第 2 周', '合约 II：交易所与结算器', 'Exchange（EIP-712、撤单、手续费）、OptimisticResolver、全部合约测试 + Slither 无高危'],
  ['第 3 周', '撮合服务', 'API（REST + WS）、订单簿、数据库 DDL、结算器、重启重建；Vitest 覆盖撮合规则'],
  ['第 4 周', '索引器与前端 I', '索引器（事件入库、对账）；前端市场列表、市场页、签名下单'],
  ['第 5 周', '前端 II 与集成', 'split/merge/redeem、持仓页、管理页；Anvil 端到端测试；Base Sepolia 部署'],
  ['第 6 周', '压测、监控与安全', 'k6 压测报告、Grafana 看板与告警、故障注入报告、威胁模型文档、演示视频']
])}

<h2>13. 扩展方向与面试/作品集要点</h2>
${steps([
  '<strong>铸造/合并撮合</strong>：实现 8.3 中提到的 YES 买单 + NO 买单撮合，让两本订单簿共享流动性。',
  '<strong>真实乐观预言机</strong>：把 OptimisticResolver 替换为 UMA 乐观预言机，比较两者的信任假设。',
  '<strong>冷启动流动性</strong>：新市场用 LMSR 做市商兜底（见 <a href="#lab-lmsr">LMSR 实验</a>），订单簿成熟后关闭。',
  '<strong>多结果市场</strong>：用 N 个二元市场 + “互斥”约束表示多选项事件。',
  '<strong>Gas 优化</strong>：批量结算多笔成交；使用 Permit2 或 EIP-2612 免去单独的 approve 交易。'
])}
${call('info', `<p>面试时讲清三件事最加分：① 为什么非托管（签名订单 + 原子结算，运营方只能审查不能挪用）；② 你如何证明系统不会凭空多出或丢失 USDC（不变量测试 + 链上链下对账指标）；③ 结算争议如何处理（保证金、挑战期、仲裁，以及多签作为信任点的局限）。作品集附上：合约地址（测试网）、测试覆盖率报告、压测报告、架构图、一段 3 分钟演示视频。</p>`)}
${mistakes([
  ['链下撮合就是中心化交易所，用户资金不安全。', '本架构中资金一直在用户钱包或合约里，结算需要双方签名，运营方无法挪用；它只能审查或延迟。'],
  ['YES 份额是平台发行的，平台可以随意增发。', 'YES 只能通过 split 和 NO 成对铸出，每对背后锁定 1 USDC，不变量测试保证这一点。'],
  ['乐观预言机不需要人参与。', '它默认接受提议，但依赖有人监督并在出错时挑战；争议最终仍要由仲裁者（本项目为多签）决定。'],
  ['撮合成功就等于交易完成。', '撮合只是软确认；链上结算可能因余额或授权不足回滚，前端和数据库必须区分 matched 与 confirmed。']
])}
${recap([
  '份额层：ERC-1155 条件代币，split 存 1 USDC 铸 1 YES + 1 NO，merge 反向，redeem 按赔付比例兑付。',
  '交易层：EIP-712 签名限价单，链下价格时间优先撮合，链上 matchOrders 原子交换，filled 和 nonce 防重放、防超额。',
  '结算层：提议 + 保证金 → 挑战期 → 争议升级多签仲裁 → reportPayout。',
  '核心不变量：结算前 USDC = YES 总量 = NO 总量；结算后 USDC ≥ 可兑付总额。',
  '工程层：先落库再确认、结算先 simulate、链上链下对账、KMS 与多签管理密钥、按指标告警。',
  '合规：地域限制、制裁筛查、风险披露；无牌照不向受限地区用户提供服务。'
])}
${quiz([
  { q: '市场结算为“无效”，赔付 [1, 1]。某用户持有 30 YES、10 NO，redeem 能拿到多少 USDC？', o: ['30', '40', '20', '10'], a: 2, why: '赔付 = (30 × 1 + 10 × 1) ÷ 2 = 20 USDC。每份无论 YES 还是 NO 都兑 0.5。' },
  { q: 'Foundry 不变量测试中，下面哪个断言表达了“抵押品 = 未赎回完整集合”（结算前）？', o: ['YES 总量 > NO 总量', 'collateralOf = YES 总量 = NO 总量，且 USDC 余额 = collateralOf', 'USDC 余额 = YES 总量 + NO 总量', '每个用户 YES 余额 = NO 余额'], a: 1, why: '每个完整集合锁定 1 USDC。C 多算了一倍；D 不成立，用户可以只转 YES。' }
])}
${exercises([["计算题（示例）：按 Exchange 合约的规则，maker 挂单价 <code>price = 620000</code>，成交 50 份（<code>shares = 50000000</code>），taker 的 <code>feeBps = 20</code>。分别算出 taker 是买方和 taker 是卖方时，买方付款、卖方到账和手续费。", "<p>cost = 50,000,000 × 620,000 ÷ 1,000,000 = 31,000,000，即 31 USDC。fee = 31,000,000 × 20 ÷ 10,000 = 62,000，即 0.062 USDC。taker 是买方时：买方付给卖方 31 USDC，另付 0.062 USDC 给 treasury，合计 31.062。taker 是卖方时：买方付给卖方 30.938 USDC，再付 0.062 给 treasury，合计 31，卖方承担手续费。</p>"], ["设计题：市场结算后，“抵押品 = 未赎回完整集合”不再成立。写出结算后的不变量，并说明 Handler 要加哪些动作。", "<p>设赔付为 [p0, p1]，必须始终满足 <code>collateralOf ≥ (YES 总量 × p0 + NO 总量 × p1) ÷ (p0 + p1)</code>。redeem 向下取整，所以用“大于等于”，合约永远不欠钱。Handler 要加入 resolve（随机选一种赔付并上报）和 redeem（随机选一个参与者赎回）两个动作。原有的 split、merge、transferYes 继续保留。</p>"], ["思考题：结算器为什么每次都先 simulate 再发送交易？simulate 失败后应该做什么？", "<p>simulate 能在发送前发现余额或授权不足，不浪费 Gas。失败时，先找出责任方，把它的订单标记为 invalid 并移出订单簿。对手方订单恢复剩余数量，重新挂单。成交记录更新为 failed 并写入原因。之后由索引器对账，确认每笔 confirmed 的成交都有对应的 OrderFilled 事件。</p>"]])}
${checklist(["在本地用 Foundry 跑通不变量测试，并删掉 merge 中的一行记账代码，看到测试失败。", "能按 matchOrders 的取整和手续费规则，算出买方付款、卖方到账和手续费。", "能写出结算后的不变量，并在 Handler 中加入 resolve 和 redeem 动作。", "能说出撮合服务“先落库再确认”和“结算先 simulate”各自防止什么问题。", "能对照威胁模型表，为签名重放、超额成交、重入各说出一条防护措施。"])}
${terms([
  ['条件代币', 'Conditional Token', '只在特定结果发生时可兑付的代币'],
  ['完整集合', 'Complete Set', '每个结果各一份的组合，恒等于 1 单位抵押品'],
  ['拆分 / 合并 / 赎回', 'Split / Merge / Redeem', '抵押品换完整集合、完整集合换抵押品、结算后按赔付兑付'],
  ['签名订单', 'Signed Order', '用户用 EIP-712 签名、可在链上验证的限价单'],
  ['链下撮合链上结算', 'Off-chain Matching, On-chain Settlement', '撮合在服务器完成，资产交换在合约中原子执行'],
  ['挑战期', 'Liveness Period', '提议结果后允许发起争议的时间窗口'],
  ['不变量测试', 'Invariant Testing', '随机调用序列下检查系统性质始终成立的测试方法'],
  ['运营方', 'Operator', '有权向交易所合约提交撮合结果的账户']
])}
` });
})();
