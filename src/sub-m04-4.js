/* ---------- M09 子文章（4）：m04-10 实战 ---------- */
(() => {

CUR = 'm04-10';
addCh({ id: 'm04-10', nav: '实战·设计：迷你 CEX', title: 'M09.11 实战·设计：迷你 CEX（撮合 + 账本 + 充提）', desc: '项目目标、需求拆解、系统架构、技术选型、数据模型与接口设计', html: `
<h1>M09.11 实战·设计：迷你 CEX（撮合 + 账本 + 充提）</h1>
${meta(['把 M09 的全部知识组装成一个可运行的迷你交易所：7 个 Go 服务、Kafka、PostgreSQL、Redis。', '写出撮合核心、账本冻结与结算事务、幂等消费三段关键代码，并用确定性回放和不变量测试证明它们正确。', '按 6 周里程碑交付，并能在面试中讲清架构取舍。'], '<a href="#m04-3">M09.4 账本设计</a>、<a href="#m04-4">M09.5 订单与撮合</a>、<a href="#m04-5">M09.6 清算结算</a>、<a href="#m04-6">M09.7 充值提币</a>、<a href="#m04-7">M09.8 行情系统</a>', ['orderbook', 'ledger'])}
${beginner(`<p><b>微服务（Microservice）</b>：把一个大系统拆成多个小程序，每个负责一件事，通过网络通信。</p>
<p><b>Kafka</b>：一个分布式消息日志。生产者把消息追加到主题（Topic）的分区（Partition），消费者按顺序读取，并记录读到哪里（Offset）。</p>
<p><b>docker-compose</b>：用一个 YAML 文件描述多个容器，一条命令全部启动，适合本地开发。</p>
<p><b>K8s（Kubernetes）</b>：生产环境的容器编排平台，负责部署、扩容、故障重启。</p>
<p><b>压测（Load Test）</b>：用工具模拟大量请求，测量系统的吞吐和延迟。</p>`)}

<h2>1. 一句话理解</h2>
${one('迷你 CEX 是一个“麻雀虽小、五脏俱全”的交易所：用户注册、拿 API Key、充值（模拟或测试网）、下限价/市价单、撮合、结算、看 K 线和深度、申请提币并人工审批。它的核心承诺只有两条：撮合可重放，账本永远平。')}
${call('analogy', `<p>这个项目像开一家真实的小餐馆，而不是画一张餐馆设计图。菜单少（只有一个交易对 BTC/USDT），但后厨（撮合）、收银（账本）、进货出货（充提）、监控摄像头（监控对账）一样都不能少。</p>
<p>类比的局限：小餐馆可以先手写账；交易所从第一天起就必须用双分录和幂等，否则后面无法补救。</p>`)}
${art('一图看懂：迷你 CEX 的 7 个服务，同步只到“冻结”，其余全异步', 660, 350, [
  S.zone(10, 26, 640, 112, { t: '同步路径：用户在等响应', k: 'tint' }),
  S.box(20, 56, 137, 66, { k: 'tint', icon: 'globe', t: 'gateway', s: '验签 · 限流', mono: 1 }),
  S.box(181, 56, 137, 66, { k: 'tint', icon: 'doc', t: 'order', s: '校验 · 风控', mono: 1 }),
  S.box(342, 56, 137, 66, { k: 'key', icon: 'db', t: 'ledger', s: '只有它写余额', mono: 1 }),
  S.box(503, 56, 137, 66, { k: 'tint', icon: 'wallet', t: 'wallet', s: '充值 · 提币', mono: 1 }),
  S.arrow(159, 89, 179, 89), S.arrow(320, 89, 340, 89), S.arrow(501, 89, 481, 89),
  S.box(10, 164, 640, 36, { k: 'info', icon: 'link', t: 'Kafka：orders.cmd → match.events', mono: 1 }),
  S.arrow(249, 140, 249, 162),
  S.zone(10, 224, 640, 100, { t: '异步路径：撮合之后', k: 'tint' }),
  S.box(20, 250, 190, 60, { k: 'tint', icon: 'cpu', t: 'matching', s: '单线程 · 可重放', mono: 1 }),
  S.box(235, 250, 190, 60, { k: 'tint', icon: 'gear', t: 'settlement', s: '成交 → 账本分录', mono: 1 }),
  S.box(450, 250, 190, 60, { k: 'tint', icon: 'chart', t: 'market-data', s: 'K 线 · 深度', mono: 1 }),
  S.arrow(115, 202, 115, 248), S.arrow(330, 202, 330, 248), S.arrow(545, 202, 545, 248),
  S.text(330, 342, '核心承诺：撮合可重放，账本永远平', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '同步路径只到“网关 → 订单 → 账本冻结”，响应立刻返回；撮合、结算、行情全部通过 Kafka 异步完成。'],
  ['key', '只有 ledger 服务能写余额表，其他服务都通过它带业务单号记账。'],
  ['fail', 'Kafka 不可用时，订单服务应拒绝新单并解冻，而不是先返回成功。'],
  ['limit', '本项目只有一个交易对、一个撮合实例（带冷备），不做账本分片。']
], '七个服务分成同步路径（gateway、order、ledger、wallet）和经 Kafka 的异步路径（matching、settlement、market-data）', 'm04-10')}

<h2>2. 项目目标与验收标准</h2>
${tbl(['类别', '验收标准（示例）'], [
  ['功能：账户', '邮箱注册登录（JWT）；创建/删除 API Key，权限 READ / TRADE / WITHDRAW，可绑定 IP 白名单'],
  ['功能：充值', '模式 A：管理后台模拟充值；模式 B：监听 Sepolia（或当时推荐的应用测试网）的 ERC-20 转账，12 确认后入账。截至 2026-11 Sepolia 仍在运行，社区已在讨论替换与下线，以以太坊基金会公告为准'],
  ['功能：交易', '交易对 BTC/USDT；限价单（GTC / IOC / FOK / Post-only）与市价单；撤单'],
  ['功能：结算', '成交后双方余额实时更新；Maker 0.08%、Taker 0.1% 手续费'],
  ['功能：行情', 'WebSocket 推送 1m/5m/1h K 线、20 档深度（快照 + 增量 + seq）、逐笔成交、Ticker'],
  ['功能：提币', '申请 → 冻结 → 风控 → 人工审批 → 模拟签名广播 → 确认扣减；审批（REVIEW）拒绝 → REFUNDED 解冻退回；广播失败 → FAILED → REFUNDED 解冻退回'],
  ['性能', '撮合单交易对 ≥ 5 万命令/秒；下单 API P99 < 20 ms（不含网络）；结算延迟 P99 < 200 ms'],
  ['可靠性', '撮合进程被 kill 后 10 秒内恢复，订单簿与 kill 前一致；结算重复投递不重复记账'],
  ['正确性', '任意时刻每种资产：用户 + 平台 = 充值 − 提币；每个 ledger_txn 借贷平衡；回放输出与原输出字节一致'],
  ['安全', 'API 签名 HMAC-SHA256 + recvWindow；提币需要 2FA（TOTP）+ 白名单地址；所有密钥来自环境变量或密钥管理服务']
])}

<h2>3. 需求拆解与用户故事</h2>
${tbl(['编号', '用户故事', '负责服务', '验收要点'], [
  ['US-1', '作为新用户，我能注册、登录、开启 TOTP 2FA', 'gateway', '密码 bcrypt 存储；登录失败 5 次锁定 15 分钟'],
  ['US-2', '作为量化用户，我能创建只读或交易权限的 API Key', 'gateway', 'Secret 只显示一次；KMS 加密存储'],
  ['US-3', '作为用户，我充值后能看到“确认中 n/12”并最终到账', 'wallet → ledger', '幂等键 chain+txHash+logIndex'],
  ['US-4', '作为交易者，我能下限价单和市价单并撤单', 'order → matching', '余额不足被拒；冻结额正确'],
  ['US-5', '作为交易者，我成交后立刻看到余额变化和成交明细', 'settlement → ledger', '手续费正确；价格改善部分解冻'],
  ['US-6', '作为看盘用户，我能实时看到 K 线和深度', 'market-data', '断线重连后深度正确'],
  ['US-7', '作为用户，我能申请提币；作为管理员，我能审批', 'wallet', '先冻结后签名；拒绝后解冻'],
  ['US-8', '作为运维，我能看到对账报告和告警', '全部', '不变量违反 1 分钟内告警']
])}

<h2>4. 系统架构、调用链与状态机</h2>
${mm('迷你 CEX 架构（1/2）：同步路径与数据存储', `
flowchart TB
  CL["Web 前端 / API 客户端"] --> GW["gateway<br/>REST + WebSocket<br/>JWT · HMAC · 限流"]
  GW -->|"gRPC"| ORD["order<br/>校验 · 风控 · 落库"]
  GW -->|"gRPC"| WAL["wallet<br/>充值 · 提币 · 审批"]
  GW -->|"gRPC 查询"| LED["ledger<br/>双分录 · 冻结"]
  ORD -->|"gRPC 冻结"| LED
  ORD -->|"orders.cmd"| K[["Kafka"]]
  WAL -->|"gRPC 入账 / 冻结"| LED
  WAL --> CHAIN[("Sepolia 等测试网<br/>或模拟器")]
  LED --> PG[("PostgreSQL<br/>ledger 库")]
  ORD --> PG2[("PostgreSQL<br/>order 库")]
`, [
  ['flow', '同步路径只有“网关 → 订单 → 账本冻结”，然后把命令写进 Kafka 就返回；撮合之后全部异步（见下一张图）。'],
  ['key', '只有 ledger 服务写余额表。其他服务都通过 gRPC 带业务单号请求记账。'],
  ['fail', 'Kafka 不可用时，订单服务无法投递命令：应拒绝新单（并解冻），而不是先返回成功。']
])}
${mm('迷你 CEX 架构（2/2）：异步路径与行情', `
flowchart LR
  ORD["order"] -->|"orders.cmd"| K[["Kafka"]]
  K -->|"orders.cmd"| ME["matching<br/>单线程内存撮合"]
  ME -->|"match.events"| K
  ME --> SNAP[("快照文件<br/>本地卷 / S3")]
  K -->|"match.events"| SET["settlement<br/>清算 · 记账"]
  SET -->|"gRPC Post"| LED["ledger"]
  K -->|"match.events"| MD["market-data<br/>K 线 · 深度 · Ticker"]
  MD --> RD[("Redis<br/>快照 · Pub/Sub")]
  RD --> GW["gateway"]
`, [
  ['flow', '撮合引擎从 orders.cmd 读命令，把成交和订单变化写成 match.events；settlement 记账，market-data 算行情，通过 Kafka 解耦。'],
  ['limit', '为降低复杂度，本项目用单个交易对、单个撮合实例 + 冷备，不做账本分片。']
])}
${mm('关键调用链：下单 → 撮合 → 结算 → 推送', `
sequenceDiagram
  autonumber
  participant C as 客户端
  participant G as gateway
  participant O as order
  participant L as ledger
  participant K as Kafka
  participant M as matching
  participant S as settlement
  participant D as market-data
  C->>G: POST /api/v1/order 带 HMAC 签名
  G->>G: 验签 recvWindow 限流
  G->>O: PlaceOrder uid clientOrderId
  O->>O: 校验精度 价格保护 幂等
  O->>L: Freeze biz=ORDER_FREEZE 订单号
  L-->>O: 冻结成功
  O->>K: 写 orders.cmd 新订单
  O-->>C: 返回 orderId 状态 NEW
  K->>M: 按分区顺序消费
  M->>M: 撮合并分配 seq
  M->>K: 写 match.events 成交与订单更新
  K->>S: 消费成交
  S->>L: Post biz=TRADE 成交号
  K->>D: 消费成交与深度变化
  D-->>C: WebSocket 推送 成交 K 线 深度
`, [
  ['flow', '客户端在第 8 步就拿到响应；成交和余额变化随后通过 WebSocket 推送。'],
  ['key', '第 5 步冻结和第 7 步投递之间若崩溃，会出现“已冻结、未进撮合”。用订单表状态 + 定时补偿任务处理：超时未投递的订单重新投递或解冻。'],
  ['fail', '第 13 步失败时 settlement 不提交 offset，持续重试；账本幂等保证不重复。'],
  ['risk', '第 2 步验签必须在任何业务逻辑之前，否则未认证请求可以消耗冻结和撮合资源。']
])}
${mm('核心状态机：订单与冻结动作', `
stateDiagram-v2
  state "待冻结 Pending" as Pending
  state "已提交 New" as New
  state "部分成交 Partial" as Partial
  state "完全成交 Filled" as Filled
  state "已撤销 Canceled" as Canceled
  state "拒绝 Rejected" as Rejected
  [*] --> Pending: 订单落库
  Pending --> Rejected: 冻结失败
  Pending --> New: 冻结成功并投递 orders.cmd
  New --> Partial: 成交事件 结算扣减部分冻结
  New --> Filled: 成交事件 扣减并解冻价格改善差额
  Partial --> Filled: 成交事件 扣减并解冻剩余差额
  New --> Canceled: 撤单事件或 IOC 市价剩余撤销 解冻全部剩余
  Partial --> Canceled: 撤单事件或 IOC 市价剩余撤销 解冻剩余
  New --> Rejected: 撮合拒绝 Post-only 或 FOK 解冻
  Filled --> [*]
  Canceled --> [*]
  Rejected --> [*]
`, [
  ['key', '每个终态都对应一次“剩余冻结归零”的账本动作。IOC、市价单未成交的部分在撮合时直接撤销，同样解冻。对账检查：终态订单的 remaining_frozen 必须为 0。'],
  ['flow', '状态由 match.events 驱动，order 服务消费事件更新订单表，settlement 消费同一事件记账。'],
  ['fail', 'order 服务和 settlement 服务消费进度不同，用户可能先看到“已成交”再看到余额变化。前端以账本推送为准。'],
  ['limit', '本项目不实现条件单（止损、止盈、OCO），作为扩展方向。']
])}

<h2>5. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['语言', 'Go 1.22+', 'Rust、Java', '并发模型简单，生态覆盖 Kafka、gRPC、PostgreSQL；招聘面广'],
  ['服务通信', 'gRPC（google.golang.org/grpc）', 'HTTP JSON', '强类型 protobuf 接口，内部调用延迟低'],
  ['消息', 'Kafka（客户端 segmentio/kafka-go）', 'NATS JetStream、Redpanda', '分区内有序、持久化、可重放，适合事件溯源'],
  ['数据库', 'PostgreSQL 16（驱动 jackc/pgx v5）', 'MySQL 8', 'NUMERIC 精确小数、事务语义清晰、ON CONFLICT 简化幂等'],
  ['缓存/推送', 'Redis 7', 'NATS', '深度快照缓存、Pub/Sub 给网关扇出、限流计数'],
  ['定点数', 'shopspring/decimal', 'int64 最小单位', '业务层可读性好；撮合内部仍用 int64'],
  ['订单簿', 'emirpasic/gods 红黑树 + container/list', '自研跳表', '库成熟，复杂度清晰'],
  ['链交互', 'go-ethereum ethclient', 'JSON-RPC 手写', '见 <a href="#m01">M01</a>，订阅日志与读回执'],
  ['监控', 'Prometheus + Grafana + OpenTelemetry', 'Datadog', '开源标准，指标与链路追踪统一'],
  ['部署', 'docker-compose → Kubernetes', 'Nomad', '本地一键启动；生产标准化']
])}

<h2>6. 数据模型（PostgreSQL DDL）</h2>
${code('SQL', `
-- ===== gateway 库 =====
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,              -- bcrypt
  totp_secret   BYTEA,                              -- KMS 加密后的密文
  status        SMALLINT NOT NULL DEFAULT 1,        -- 1 正常 2 冻结
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE api_keys (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  api_key       VARCHAR(64) NOT NULL UNIQUE,
  secret_enc    BYTEA NOT NULL,                     -- HMAC Secret 的 KMS 密文
  scopes        TEXT[] NOT NULL,                    -- {READ,TRADE,WITHDRAW}
  ip_whitelist  INET[],
  revoked       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== ledger 库 =====
CREATE TABLE account_balance (
  user_id    BIGINT NOT NULL,                       -- 1 = 平台手续费账户，2 = 舍入差异账户
  asset      VARCHAR(16) NOT NULL,
  available  NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (available >= 0),
  frozen     NUMERIC(36,18) NOT NULL DEFAULT 0 CHECK (frozen >= 0),
  version    BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, asset)
);
CREATE TABLE ledger_txn (
  id         BIGSERIAL PRIMARY KEY,
  biz_type   VARCHAR(32) NOT NULL,                  -- DEPOSIT ORDER_FREEZE ORDER_UNFREEZE TRADE WITHDRAW_FREEZE WITHDRAW_DONE WITHDRAW_REFUND
  biz_id     VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (biz_type, biz_id)
);
CREATE TABLE ledger_entry (
  id            BIGSERIAL PRIMARY KEY,
  txn_id        BIGINT NOT NULL REFERENCES ledger_txn(id),
  user_id       BIGINT NOT NULL,
  asset         VARCHAR(16) NOT NULL,
  bucket        SMALLINT NOT NULL,                  -- 1 available 2 frozen 3 external(托管资产)
  direction     SMALLINT NOT NULL,                  -- 1 借 2 贷
  amount        NUMERIC(36,18) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(36,18),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON ledger_entry (user_id, asset, id);
CREATE TABLE asset_external (                       -- 外部充值/提币累计，用于全局不变量
  asset       VARCHAR(16) PRIMARY KEY,
  deposited   NUMERIC(36,18) NOT NULL DEFAULT 0,
  withdrawn   NUMERIC(36,18) NOT NULL DEFAULT 0
);
CREATE TABLE outbox (
  id         BIGSERIAL PRIMARY KEY,
  topic      VARCHAR(64) NOT NULL,
  msg_key    VARCHAR(64) NOT NULL,
  payload    JSONB NOT NULL,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON outbox (id) WHERE sent_at IS NULL;

-- ===== order 库 =====
CREATE TABLE orders (
  id               BIGINT PRIMARY KEY,               -- 雪花 ID
  user_id          BIGINT NOT NULL,
  client_order_id  VARCHAR(64) NOT NULL,
  symbol           VARCHAR(16) NOT NULL,
  side             SMALLINT NOT NULL,                -- 1 买 2 卖
  type             SMALLINT NOT NULL,                -- 1 限价 2 市价
  tif              SMALLINT NOT NULL,                -- 1 GTC 2 IOC 3 FOK 4 POST_ONLY
  price            NUMERIC(36,18),
  quantity         NUMERIC(36,18) NOT NULL,
  quote_qty        NUMERIC(36,18),                   -- 市价买单按金额下单时使用
  executed_qty     NUMERIC(36,18) NOT NULL DEFAULT 0,
  cum_quote        NUMERIC(36,18) NOT NULL DEFAULT 0,
  frozen_amount    NUMERIC(36,18) NOT NULL,          -- 下单时冻结额
  remaining_frozen NUMERIC(36,18) NOT NULL,          -- 终态时必须为 0
  status           SMALLINT NOT NULL,                -- 0 PENDING 1 NEW 2 PARTIAL 3 FILLED 4 CANCELED 5 REJECTED
  last_seq         BIGINT NOT NULL DEFAULT 0,        -- 已应用的撮合事件序号，防乱序
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_order_id)
);
CREATE INDEX ON orders (user_id, status);
CREATE TABLE trades (
  trade_id        BIGINT PRIMARY KEY,                -- 撮合引擎分配
  seq             BIGINT NOT NULL UNIQUE,
  symbol          VARCHAR(16) NOT NULL,
  price           NUMERIC(36,18) NOT NULL,
  qty             NUMERIC(36,18) NOT NULL,
  taker_order_id  BIGINT NOT NULL,
  maker_order_id  BIGINT NOT NULL,
  taker_side      SMALLINT NOT NULL,
  taker_fee       NUMERIC(36,18) NOT NULL,
  maker_fee       NUMERIC(36,18) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL
);

-- ===== wallet 库 =====
CREATE TABLE deposit_address (
  user_id BIGINT NOT NULL, chain VARCHAR(16) NOT NULL, address VARCHAR(64) NOT NULL UNIQUE,
  hd_path VARCHAR(64) NOT NULL, PRIMARY KEY (user_id, chain)
);
CREATE TABLE deposits (
  id         BIGSERIAL PRIMARY KEY,
  chain      VARCHAR(16) NOT NULL,
  tx_hash    VARCHAR(80) NOT NULL,
  log_index  INT NOT NULL,
  user_id    BIGINT NOT NULL,
  asset      VARCHAR(16) NOT NULL,
  amount     NUMERIC(36,18) NOT NULL,
  block_num  BIGINT NOT NULL,
  block_hash VARCHAR(80) NOT NULL,
  confs      INT NOT NULL DEFAULT 0,
  status     SMALLINT NOT NULL,                      -- 1 SEEN 2 CONFIRMING 3 CREDITED 4 ORPHANED
  UNIQUE (chain, tx_hash, log_index)
);
CREATE TABLE withdrawals (
  id          BIGINT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  asset       VARCHAR(16) NOT NULL,
  chain       VARCHAR(16) NOT NULL,
  to_address  VARCHAR(64) NOT NULL,
  amount      NUMERIC(36,18) NOT NULL,
  fee         NUMERIC(36,18) NOT NULL,
  status      SMALLINT NOT NULL,                     -- 1 REQUESTED 2 FROZEN 3 REVIEW 4 APPROVED 5 BROADCAST 6 DONE 7 FAILED 8 REFUNDED
                                                     -- REVIEW 拒绝 → 8；BROADCAST 失败 → 7 → 8（解冻退回）
  risk_score  INT,
  approved_by BIGINT,
  tx_hash     VARCHAR(80),
  nonce       BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== 所有消费者共用：幂等消费表 =====
CREATE TABLE consumed_events (
  consumer   VARCHAR(32) NOT NULL,
  event_id   VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer, event_id)
);
`)}

<h2>7. 接口设计</h2>
<h3>7.1 REST（对外）</h3>
${tbl(['方法与路径', '鉴权', '说明'], [
  ['POST /api/v1/auth/register、/login', '无 / 密码 + TOTP', '返回 JWT（有效期 15 分钟）与刷新令牌'],
  ['POST /api/v1/apikeys、DELETE /api/v1/apikeys/{id}', 'JWT', '创建返回 apiKey + secret（仅此一次）'],
  ['GET /api/v1/account/balances', 'HMAC，READ', '返回各资产 available / frozen'],
  ['GET /api/v1/deposit/address?chain=sepolia', 'HMAC，READ', '返回或分配充值地址'],
  ['POST /api/v1/order', 'HMAC，TRADE', '下单，参数见下例'],
  ['DELETE /api/v1/order?orderId= 或 clientOrderId=', 'HMAC，TRADE', '撤单，幂等'],
  ['GET /api/v1/openOrders、/api/v1/myTrades', 'HMAC，READ', '当前挂单与成交明细'],
  ['POST /api/v1/withdraw', 'HMAC，WITHDRAW + TOTP', '提币申请，地址必须在白名单'],
  ['POST /admin/withdraw/{id}/approve 或 /reject', '管理员 JWT + 双人', '审批'],
  ['GET /api/v1/depth?limit=20、/api/v1/klines?interval=1m', '公开', '行情 REST，带 lastSeq']
])}
${code('JSON', `
// POST /api/v1/order?symbol=BTCUSDT&side=BUY&type=LIMIT&timeInForce=GTC
//      &price=60000.00&quantity=0.010&clientOrderId=bot-0001
//      &timestamp=1761213600000&recvWindow=5000&signature=<hex>
// 请求头 X-API-KEY: <apiKey>
// 响应：
{
  "orderId": 178234991230001,
  "clientOrderId": "bot-0001",
  "symbol": "BTCUSDT",
  "status": "NEW",
  "price": "60000.00",
  "origQty": "0.010",
  "executedQty": "0",
  "frozen": { "asset": "USDT", "amount": "600.00" }
}
// 错误：{ "code": 2010, "msg": "insufficient balance" }
`)}
<h3>7.2 WebSocket（对外）</h3>
${code('JSON', `
// 订阅
{ "op": "sub", "id": 1, "args": ["trade.BTCUSDT", "depth20.BTCUSDT", "kline.1m.BTCUSDT", "ticker.BTCUSDT"] }
// 私有频道需先鉴权：{ "op": "auth", "apiKey": "...", "ts": 1761213600000, "sign": "<HMAC(ts)>" }
{ "op": "sub", "id": 2, "args": ["user.orders", "user.balances"] }

// 深度增量
{ "ch": "depth20.BTCUSDT", "type": "delta", "firstSeq": 501, "lastSeq": 503,
  "bids": [["59990.00", "1.250"]], "asks": [["60010.00", "0"]], "ts": 1761213600123 }
// K 线
{ "ch": "kline.1m.BTCUSDT", "t": 1761213600000, "o": "60000", "h": "60120", "l": "59950",
  "c": "60050", "v": "2.0", "closed": false }
// 余额变动（私有）
{ "ch": "user.balances", "asset": "USDT", "available": "4400.00", "frozen": "600.00", "bizType": "ORDER_FREEZE", "ledgerTxn": 9921 }
`)}
<h3>7.3 Kafka 主题与事件</h3>
${tbl(['主题', '分区键', '生产者 → 消费者', '内容'], [
  ['orders.cmd', 'symbol', 'order → matching', 'NewOrder / CancelOrder 命令，含 orderId、ts（由 order 服务写入）'],
  ['match.events', 'symbol', 'matching → settlement、order、market-data', 'Trade、OrderAccepted、OrderCanceled、OrderRejected、BookDelta，带全局 seq'],
  ['ledger.events', 'user_id', 'ledger（outbox）→ gateway 推送', 'BalanceChanged'],
  ['wallet.events', 'user_id', 'wallet → 通知', 'DepositSeen、DepositCredited、WithdrawStatusChanged']
])}

${recap([
  '迷你 CEX = gateway + order + matching + ledger + settlement + wallet + market-data，Kafka 串起异步链路，只有 ledger 写余额。',
  '同步路径只到“冻结 + 投递”；撮合、结算、行情全部异步，靠 seq、幂等和 outbox 保证一致。'
])}
${quiz([
  { q: '订单服务冻结成功后、写入 orders.cmd 之前崩溃。正确的补偿是？', o: ['什么都不做，冻结会自动释放', '定时任务扫描超时的 PENDING 订单：重新投递或解冻并标记拒绝', '直接删除订单记录', '让撮合引擎去查账本'], a: 1, why: '冻结不会自动释放；删除订单会留下无主冻结；撮合不访问账本。补偿任务基于订单表状态处理。' },
  { q: '压测时账本写入 TPS 上不去，锁等待集中在 user_id = 1。最可能的原因和对策是？', o: ['网络慢，增加带宽', 'Kafka 分区太少，增加分区', '平台手续费账户是热点，拆成多个子账户分桶入账', '撮合太快，限制撮合速度'], a: 2, why: 'user_id = 1 是手续费账户，每笔成交都要更新它，形成行锁热点。分桶分散竞争。其余选项与行锁无关。' }
])}
${exercises([["计算题（示例）：用户 USDT 可用 5,000。他下 GTC 限价买单 0.02 BTC @ 61,000，随后以 Maker 价 60,900 完全成交。写出下单后和终态时 USDT 余额的变化。", "<p>下单冻结 = 0.02 × 61,000 = 1,220 USDT。冻结后 available = 3,780，frozen = 1,220，biz = ORDER_FREEZE:订单号。</p><p>成交扣减冻结 = 0.02 × 60,900 = 1,218 USDT。剩余冻结 2 USDT 是价格改善差额。</p><p>订单进入完全成交终态时解冻 2 USDT：available = 3,782，frozen = 0。此时 remaining_frozen 必须为 0。</p>"], ["思考题：Kafka 不可用时，订单服务为什么要拒绝新单并解冻，而不是先返回成功？", "<p>返回成功意味着承诺订单已进入撮合。命令投递不出去，订单永远不会成交，用户的钱却一直被冻结。</p><p>拒绝并解冻让订单状态和账本保持一致。</p><p>如果冻结后、投递前崩溃，由补偿任务扫描超时的 PENDING 订单，重新投递或解冻。</p>"], ["设计题：为迷你 CEX 的各类账本业务和订单请求列出幂等键。", "<p>充值：<code>DEPOSIT</code> + 链:txHash:logIndex，deposits 表另有 (chain, tx_hash, log_index) 唯一约束。</p><p>下单冻结和终态解冻：<code>ORDER_FREEZE</code> / <code>ORDER_UNFREEZE</code> + orderId。成交结算：<code>TRADE</code> + trade_id。提币：<code>WITHDRAW_FREEZE</code>、<code>WITHDRAW_DONE</code>、<code>WITHDRAW_REFUND</code> + 提币单号。</p><p>下单请求本身用 orders 表的 (user_id, client_order_id) 唯一约束；消费者用 consumed_events 表的 (consumer, event_id) 主键去重。</p>"]])}
${checklist(["能画出迷你 CEX 的 7 个服务和 Kafka 主题，并指出只有 ledger 写余额表。", "能说出同步路径和异步路径的分界点：冻结成功并投递 orders.cmd。", "能为订单状态机的每个终态写出对应的“剩余冻结归零”账本动作。", "能为每类业务写出 biz_type 和 biz_id 组成的幂等键。", "能读懂并写出 orders、trades、deposits、withdrawals 表的关键唯一约束。"])}
${call('info', '<p>设计到此完成。下一篇 <a href="#m04-50">M09.12 实战·实现</a> 讲核心代码、测试策略、部署运维、安全清单与里程碑。</p>', '下一篇')}
` });

CUR = 'm04-50';
addCh({ id: 'm04-50', nav: '实战·实现：迷你 CEX', title: 'M09.12 实战·实现：迷你 CEX（撮合 + 账本 + 充提）', desc: '核心代码、测试策略、部署运维、安全清单、里程碑与扩展方向', html: `
<h1>M09.12 实战·实现：迷你 CEX（撮合 + 账本 + 充提）</h1>
${meta(['按上篇的设计，读懂并能复现本项目的核心代码。', '为项目制定测试策略：单元、集成、模糊与故障注入。', '完成部署、监控与安全清单，并按里程碑交付。'], '前置：<a href="#m04-10">M09.11 实战·设计</a>')}
${call('info', '<p>本篇是项目的下篇。架构图、数据模型和接口定义都在<a href="#m04-10">上篇</a>，读代码时可以对照着看。</p>')}
${art('一图看懂：核心代码 4 块，只有 Ledger.Post 写余额', 660, 330, [
  S.box(10, 40, 200, 96, { k: 'tint', icon: 'cpu', t: 'matching · Engine', s: 'Run 读 orders.cmd\napply 单线程撮合\n定期快照', mono: 1 }),
  S.box(250, 70, 130, 36, { k: 'info', t: 'match.events', mono: 1 }),
  S.arrow(212, 88, 248, 88),
  S.box(430, 20, 220, 56, { k: 'tint', icon: 'doc', t: 'order · OrderSvc', s: 'Handle 幂等消费', mono: 1 }),
  S.box(430, 98, 220, 44, { k: 'tint', icon: 'gear', t: 'settlement', s: '成交 → SettleLegs', mono: 1 }),
  S.arrow(382, 84, 428, 56), S.arrow(382, 98, 428, 118),
  S.box(430, 184, 220, 96, { k: 'key', icon: 'db', t: 'ledger · Ledger.Post', s: 'FreezeLegs / SettleLegs\n→ checkBalanced\n→ 同一事务写流水和余额', mono: 1 }),
  S.arrow(540, 144, 540, 182),
  S.box(10, 190, 200, 80, { k: 'tint', icon: 'wallet', t: 'wallet · Wallet', s: 'scan 扫块\n确认后入账', mono: 1 }),
  S.arrow(212, 232, 428, 232, { label: '入账 Post' }),
  S.text(330, 312, '结构为示意（以正文代码为准）；order 冻结时也调用 ledger', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', 'matching 把成交写进 match.events；order 和 settlement 各自消费它，settlement 把成交变成分录交给 ledger。'],
  ['key', '所有人都通过 Ledger.Post 记账；它先 checkBalanced，再在同一事务里写流水和改余额。'],
  ['fail', 'OrderSvc.Handle 和结算都要幂等：同一事件重复消费不能记两次。'],
  ['limit', '图是代码结构示意，函数名取自本篇 8.1 至 8.4 节，具体文件布局以你的实现为准。']
], '撮合引擎写出成交事件，订单服务和结算服务消费，结算服务与钱包都通过账本的 Post 函数记账', 'm04-50')}

<h2>8. 核心代码</h2>
<h3>8.1 撮合引擎主循环（确定性 + 快照）</h3>
<p>订单簿数据结构和 <code>Submit / Cancel</code> 沿用 <a href="#m04-4">M09.5</a> 的实现。这里给出包住它的主循环：从 Kafka 读命令、单线程处理、写出事件、定期快照。</p>
${code('GO', `
type Command struct {
	Kind    string \`json:"kind"\` // NEW | CANCEL
	OrderID int64  \`json:"orderId"\`
	UserID  int64  \`json:"userId"\`
	Side    Side   \`json:"side"\`
	Price   int64  \`json:"price"\` // 整数 tick
	Qty     int64  \`json:"qty"\`   // 整数 lot
	TIF     string \`json:"tif"\`
	Market  bool   \`json:"market"\`
	TS      int64  \`json:"ts"\` // 由 order 服务写入；引擎内部从不读系统时钟
}

type Engine struct {
	book     *Book
	inOffset int64 // 已处理到的输入 offset，写进快照；冷启动（无快照）时初始化为 -1，否则 offset 0 的第一条命令会被跳过
	out      *kafka.Writer
	snapEvery int64
}

// Run 是唯一处理命令的 goroutine：确定性的前提
func (e *Engine) Run(ctx context.Context, r *kafka.Reader) error {
	for {
		m, err := r.FetchMessage(ctx)
		if err != nil {
			return err
		}
		if m.Offset <= e.inOffset { // 从快照恢复后，跳过已处理的命令
			continue
		}
		var c Command
		if err := json.Unmarshal(m.Value, &c); err != nil {
			return fmt.Errorf("bad command at offset %d: %w", m.Offset, err) // 停机：输入损坏不能跳过
		}
		events := e.apply(c) // 纯函数式处理：只依赖 book 状态与命令
		if err := e.out.WriteMessages(ctx, events...); err != nil {
			return err // 写不出去就停：宁可停，不可丢
		}
		e.inOffset = m.Offset
		if e.inOffset%e.snapEvery == 0 {
			if err := e.snapshot(); err != nil { // 序列化 book + inOffset + seq
				return err
			}
		}
		_ = r.CommitMessages(ctx, m) // 位点只是加速；真正的恢复点在快照里
	}
}

func (e *Engine) apply(c Command) []kafka.Message {
	switch c.Kind {
	case "CANCEL":
		left := e.book.Cancel(c.OrderID)
		return encode(OrderCanceled{OrderID: c.OrderID, Remaining: left, TS: c.TS, Seq: e.book.NextSeq()})
	case "NEW":
		o := &Order{ID: c.OrderID, UserID: c.UserID, Side: c.Side, Price: c.Price, Qty: c.Qty, Market: c.Market}
		if c.TIF == "POST_ONLY" && e.book.WouldCross(o) {
			return encode(OrderRejected{OrderID: o.ID, Reason: "post-only would cross", Seq: e.book.NextSeq()})
		}
		if c.TIF == "FOK" && !e.book.CanFill(o) {
			return encode(OrderRejected{OrderID: o.ID, Reason: "fok cannot fill", Seq: e.book.NextSeq()})
		}
		trades := e.book.Submit(o) // 价格优先、时间优先
		msgs := encodeTrades(trades, c.TS)
		if o.Qty > 0 && (o.Market || c.TIF == "IOC") {
			e.book.Cancel(o.ID) // IOC / 市价剩余部分不挂单
			msgs = append(msgs, encode(OrderCanceled{OrderID: o.ID, Remaining: o.Qty, TS: c.TS, Seq: e.book.NextSeq()})...)
		}
		return msgs
	}
	return nil
}
`)}
${call('info', `<p>注意 IOC 的写法：M09.5 的 <code>Submit</code> 会把限价剩余部分挂单，所以 IOC 订单在 <code>Submit</code> 之后立即 <code>Cancel</code>。更干净的做法是给 <code>Submit</code> 加一个参数“剩余是否挂单”。<code>WouldCross</code> 和 <code>CanFill</code> 是两个只读函数：前者比较最优对手价，后者沿对手方累加数量直到满足或越过限价。快照恢复时 <code>seq</code> 也必须一起恢复，否则回放输出的序号会不同。</p>`)}

<h3>8.2 账本：下单冻结与成交结算事务</h3>
${code('GO', `
// Leg 描述一个账户桶的变化；DeltaAvail / DeltaFrozen 可正可负
type Leg struct {
	UserID      int64
	Asset       string
	DeltaAvail  decimal.Decimal
	DeltaFrozen decimal.Decimal
}

// Freeze：下单冻结。biz = ORDER_FREEZE:orderId
func FreezeLegs(uid int64, asset string, amt decimal.Decimal) []Leg {
	return []Leg{{UserID: uid, Asset: asset, DeltaAvail: amt.Neg(), DeltaFrozen: amt}}
}

// SettleLegs：一笔成交的完整分录（taker 买入为例，手续费从收到的资产中扣）
func SettleLegs(t Trade, buyer, seller Party) []Leg {
	quote := t.Price.Mul(t.Qty)                              // 成交额
	buyFee := t.Qty.Mul(buyer.FeeRate).RoundUp(8)            // 买方手续费（BTC）
	sellFee := quote.Mul(seller.FeeRate).RoundUp(6)          // 卖方手续费（USDT）
	return []Leg{
		{UserID: buyer.UID, Asset: "USDT", DeltaFrozen: quote.Neg()},              // 买方冻结 USDT 扣减
		{UserID: seller.UID, Asset: "USDT", DeltaAvail: quote.Sub(sellFee)},       // 卖方收 USDT
		{UserID: FeeAccount, Asset: "USDT", DeltaAvail: sellFee},                  // 平台收 USDT 手续费
		{UserID: seller.UID, Asset: "BTC", DeltaFrozen: t.Qty.Neg()},              // 卖方冻结 BTC 扣减
		{UserID: buyer.UID, Asset: "BTC", DeltaAvail: t.Qty.Sub(buyFee)},          // 买方收 BTC
		{UserID: FeeAccount, Asset: "BTC", DeltaAvail: buyFee},                    // 平台收 BTC 手续费
	}
}

// checkBalanced：除充值/提币外，每种资产的变化之和必须为 0（钱只在账户间移动）
func checkBalanced(legs []Leg) error {
	sum := map[string]decimal.Decimal{}
	for _, l := range legs {
		sum[l.Asset] = sum[l.Asset].Add(l.DeltaAvail).Add(l.DeltaFrozen)
	}
	for a, s := range sum {
		if !s.IsZero() {
			return fmt.Errorf("unbalanced %s: %s", a, s)
		}
	}
	return nil
}

func (l *Ledger) Post(ctx context.Context, bizType, bizID string, legs []Leg) (dup bool, err error) {
	if bizType != "DEPOSIT" && bizType != "WITHDRAW_DONE" {
		if err := checkBalanced(legs); err != nil {
			return false, err
		}
	}
	sort.Slice(legs, func(i, j int) bool { // 固定加锁顺序，避免死锁
		if legs[i].UserID != legs[j].UserID {
			return legs[i].UserID < legs[j].UserID
		}
		return legs[i].Asset < legs[j].Asset
	})
	err = pgx.BeginFunc(ctx, l.db, func(tx pgx.Tx) error {
		var txnID int64
		e := tx.QueryRow(ctx, \`INSERT INTO ledger_txn (biz_type, biz_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING RETURNING id\`, bizType, bizID).Scan(&txnID)
		if errors.Is(e, pgx.ErrNoRows) {
			dup = true // 幂等：已经记过
			return nil
		} else if e != nil {
			return e
		}
		for _, g := range legs {
			tag, e := tx.Exec(ctx, \`UPDATE account_balance
				SET available = available + $3, frozen = frozen + $4, version = version + 1, updated_at = now()
				WHERE user_id = $1 AND asset = $2 AND available + $3 >= 0 AND frozen + $4 >= 0\`,
				g.UserID, g.Asset, g.DeltaAvail, g.DeltaFrozen)
			if e != nil {
				return e
			}
			if tag.RowsAffected() == 0 {
				return ErrInsufficient // 回滚整笔
			}
			if e := insertEntries(ctx, tx, txnID, g); e != nil { // 每个非零 Delta 写一条借或贷分录
				return e
			}
		}
		return insertOutbox(ctx, tx, "ledger.events", legs, txnID) // 同一事务写 outbox
	})
	return dup, err
}
`)}
<p>说明：<code>account_balance</code> 行需要预先创建（开户时为每个资产插入 0 余额行，或在 Post 中先 <code>INSERT … ON CONFLICT DO NOTHING</code>）。shopspring/decimal 实现了 <code>driver.Valuer</code>，可以直接作为 pgx 参数传给 NUMERIC 列。</p>

<h3>8.3 幂等消费：订单服务消费 match.events</h3>
${code('GO', `
// 订单服务更新订单状态。消费记录与业务更新在同一事务：效果上恰好一次
func (s *OrderSvc) Handle(ctx context.Context, ev MatchEvent) error {
	return pgx.BeginFunc(ctx, s.db, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx, \`INSERT INTO consumed_events (consumer, event_id)
			VALUES ('order', $1) ON CONFLICT DO NOTHING\`, ev.ID())
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return nil // 处理过了，直接跳过
		}
		switch e := ev.(type) {
		case *TradeEvent:
			for _, side := range []struct{ id int64; qty, quote decimal.Decimal }{
				{e.TakerOrderID, e.Qty, e.Qty.Mul(e.Price)},
				{e.MakerOrderID, e.Qty, e.Qty.Mul(e.Price)},
			} {
				// last_seq 防乱序：只接受比已应用序号更新的事件
				if _, err := tx.Exec(ctx, \`UPDATE orders SET
					executed_qty = executed_qty + $2, cum_quote = cum_quote + $3,
					status = CASE WHEN executed_qty + $2 >= quantity THEN 3 ELSE 2 END,
					last_seq = $4, updated_at = now()
					WHERE id = $1 AND last_seq < $4\`, side.id, side.qty, side.quote, e.Seq); err != nil {
					return err
				}
			}
		case *OrderCanceledEvent:
			if _, err := tx.Exec(ctx, \`UPDATE orders SET status = 4, last_seq = $2, updated_at = now()
				WHERE id = $1 AND status IN (1, 2) AND last_seq < $2\`, e.OrderID, e.Seq); err != nil {
				return err
			}
		}
		return nil
	})
}
`)}
${call('deep', `<p>订单终态时的“解冻剩余冻结额”由 settlement 服务负责：它消费 OrderCanceled 和“完全成交”事件，计算 <code>remaining_frozen</code> 并调用 ledger 解冻（biz = ORDER_UNFREEZE:orderId）。把“解冻”放在一个服务里，避免 order 和 settlement 都去解冻导致重复。biz_id 唯一保证即使重复消费也只解冻一次。</p>`)}

<h3>8.4 充值（模拟器与测试网）</h3>
${code('GO', `
// 测试网模式：用 go-ethereum 过滤 ERC-20 Transfer 事件
var transferSig = crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))

func (w *Wallet) scan(ctx context.Context, from, to uint64) error {
	logs, err := w.eth.FilterLogs(ctx, ethereum.FilterQuery{
		FromBlock: new(big.Int).SetUint64(from),
		ToBlock:   new(big.Int).SetUint64(to),
		Addresses: []common.Address{w.tokenAddr}, // 只认白名单合约，防假币
		Topics:    [][]common.Hash{{transferSig}},
	})
	if err != nil {
		return err
	}
	for _, lg := range logs {
		toAddr := common.BytesToAddress(lg.Topics[2].Bytes())
		uid, ok := w.addrToUser[toAddr]
		if !ok || lg.Removed { // Removed = true 表示该日志因重组被移除
			continue
		}
		amt := decimal.NewFromBigInt(new(big.Int).SetBytes(lg.Data), -int32(w.decimals))
		_, err := w.db.Exec(ctx, \`INSERT INTO deposits
			(chain, tx_hash, log_index, user_id, asset, amount, block_num, block_hash, status)
			VALUES ('sepolia', $1, $2, $3, 'USDT', $4, $5, $6, 1)
			ON CONFLICT (chain, tx_hash, log_index) DO NOTHING\`,
			lg.TxHash.Hex(), lg.Index, uid, amt, lg.BlockNumber, lg.BlockHash.Hex())
		if err != nil {
			return err
		}
	}
	return nil
}
// 另一个循环：对 status=1/2 的记录更新确认数，校验 block_hash 仍在主链，
// 达到 12 确认后调用 ledger.Post("DEPOSIT", chain+":"+txHash+":"+logIndex, ...)。
// 模拟模式：管理后台直接插入一条 deposits 记录并走同样的确认流程，便于演示。
`)}

<h2>9. 测试策略</h2>
${tbl(['类型', '用例（示例）', '通过标准'], [
  ['单元：撮合', '价格优先、时间优先、部分成交、跨多档、撤单后档位删除、IOC、FOK、Post-only、市价深度不足', '成交序列与手算一致'],
  ['单元：账本', '冻结不足拒绝、重复 biz_id、借贷不平拒绝、18 位小数、舍入 fee + net = gross', '断言余额与分录'],
  ['确定性回放', '录制 100 万条随机命令 → 运行两次 → 比较输出；从中间快照恢复 → 比较输出', '字节级一致'],
  ['不变量（属性测试）', '随机生成充值、下单、撤单、成交、提币序列，每步后检查不变量', '全部资产差额为 0'],
  ['集成', 'docker-compose 起全套，走完 US-1 到 US-7', '端到端脚本全部通过'],
  ['模糊测试', 'Go 原生 fuzz：随机命令喂给 Book，断言买一 < 卖一、档位总量 = 订单剩余量之和', '无 panic、无断言失败'],
  ['故障注入', 'kill matching / settlement / ledger；断开 Kafka；PG 主从切换', '恢复后余额与订单一致，无重复记账'],
  ['压测', 'ghz 压 gRPC 下单；k6 压 REST 与 WebSocket；撮合基准测试', '达到第 2 节性能指标']
])}
${code('GO', `
// 确定性回放测试：同一输入两次运行 + 快照恢复，输出必须完全一致
func TestReplayDeterminism(t *testing.T) {
	cmds := genCommands(rand.New(rand.NewSource(42)), 1_000_000) // 固定种子
	run := func(cmds []Command, b *Book) []byte {
		var buf bytes.Buffer
		e := &Engine{book: b}
		for _, c := range cmds {
			for _, m := range e.apply(c) {
				buf.Write(m.Value)
			}
		}
		return buf.Bytes()
	}
	a := run(cmds, NewBook())
	b := run(cmds, NewBook())
	if !bytes.Equal(a, b) {
		t.Fatal("non-deterministic output")
	}
	// 快照恢复：前一半运行后快照，从快照继续后一半
	half := len(cmds) / 2
	b1 := NewBook()
	prefix := run(cmds[:half], b1)
	snap := b1.Snapshot()
	suffix := run(cmds[half:], RestoreBook(snap))
	if !bytes.Equal(a, append(prefix, suffix...)) {
		t.Fatal("snapshot restore diverged")
	}
}

func BenchmarkSubmit(b *testing.B) {
	cmds := genCommands(rand.New(rand.NewSource(1)), b.N)
	e := &Engine{book: NewBook()}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		e.apply(cmds[i])
	}
}
`)}
${code('SQL', `
-- 账本不变量检查（集成测试与线上对账共用）
-- ① 全局：用户 + 平台 = 外部充值 − 外部提币
SELECT b.asset,
       SUM(b.available + b.frozen)            AS ledger_total,
       MAX(x.deposited - x.withdrawn)         AS external_net,
       SUM(b.available + b.frozen) - MAX(x.deposited - x.withdrawn) AS diff
FROM account_balance b JOIN asset_external x USING (asset)
GROUP BY b.asset HAVING SUM(b.available + b.frozen) <> MAX(x.deposited - x.withdrawn);

-- ② 每笔内部业务借贷平衡（充值、提币完成除外：它们一侧是外部托管资产）
SELECT t.id, e.asset,
       SUM(CASE WHEN e.direction = 1 THEN e.amount ELSE -e.amount END) AS net
FROM ledger_txn t JOIN ledger_entry e ON e.txn_id = t.id
WHERE t.biz_type NOT IN ('DEPOSIT', 'WITHDRAW_DONE')
GROUP BY t.id, e.asset HAVING SUM(CASE WHEN e.direction = 1 THEN e.amount ELSE -e.amount END) <> 0;
-- 期望两条查询都返回 0 行
`)}
<p><b>算一算（示例，压测目标换算）</b>：目标 1,000 个活跃量化用户，每人每秒 20 条命令（下单 + 撤单），撤单占 80%。</p>
${steps(['总命令速率 = 1,000 × 20 = 20,000 条/秒，低于撮合目标 5 万/秒，余量 2.5 倍。', '下单速率 = 20,000 × 20% = 4,000 单/秒，每单一次账本冻结：账本写入 ≥ 4,000 TPS。', '假设成交率 30%：成交 1,200 笔/秒，每笔一次结算事务（6 个 Leg）：再加 1,200 TPS。', '账本总写入约 5,200 事务/秒，超过单行热点承受能力：平台手续费账户需要分桶（见 <a href="#m04-3">M09.4</a>）。'])}
<p>动手前回顾：在 <a href="#lab-ledger">账本实验</a>中打开“注入 bug”，你看到的就是不变量查询 ① 会抓到的问题；在 <a href="#lab-orderbook">撮合实验</a>中连续提交随机订单，就是回放测试的输入。</p>

<h2>10. 部署与运维</h2>
${art('一图看懂：数据存在哪里，谁读谁写', 660, 376, [
  S.zone(5, 24, 200, 316, { t: '进程（docker-compose）', k: 'tint' }),
  S.zone(345, 24, 310, 316, { t: '数据与外部', k: 'tint' }),
  S.box(15, 52, 180, 44, { k: 'tint', icon: 'gear', t: 'ledger · order', s: '写余额 · 订单', mono: 1 }),
  S.box(15, 108, 180, 44, { k: 'tint', icon: 'cpu', t: 'matching', s: '撮合状态', mono: 1 }),
  S.box(15, 164, 180, 44, { k: 'tint', icon: 'server', t: '各服务', s: '命令与事件', mono: 1 }),
  S.box(15, 220, 180, 44, { k: 'tint', icon: 'chart', t: 'market-data', s: 'gateway 来读', mono: 1 }),
  S.box(15, 276, 180, 44, { k: 'tint', icon: 'wallet', t: 'wallet', s: '扫块 · 广播', mono: 1 }),
  S.box(360, 52, 280, 44, { k: 'key', icon: 'db', t: 'PostgreSQL', s: 'ledger 库 · order 库' }),
  S.box(360, 108, 280, 44, { k: 'tint', icon: 'file', t: '快照文件', s: '本地卷 / S3' }),
  S.box(360, 164, 280, 44, { k: 'info', icon: 'link', t: 'Kafka', s: 'orders.cmd · match.events' }),
  S.box(360, 220, 280, 44, { k: 'tint', icon: 'bolt', t: 'Redis', s: '快照 · Pub/Sub' }),
  S.box(360, 276, 280, 44, { k: 'idle', dash: 1, icon: 'globe', t: 'Sepolia 测试网', s: '或模拟器' }),
  S.arrow(197, 74, 358, 74, { label: '读写' }), S.arrow(197, 130, 358, 130, { label: '定期快照' }),
  S.arrow(197, 186, 358, 186, { both: 1, label: '发布与消费' }), S.arrow(197, 242, 358, 242, { label: '写快照' }),
  S.arrow(197, 298, 358, 298, { both: 1, label: '扫块与广播' }),
  S.text(330, 366, '只有 ledger 写余额库；撮合状态可由快照加日志重放恢复', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '服务之间不共享内存：命令和事件走 Kafka，余额和订单落 PostgreSQL，行情最新值放 Redis。'],
  ['key', '撮合内存状态不是真相来源：它由定期快照加 Kafka 日志重放得到。'],
  ['risk', '真实密钥和钱包私钥不放镜像和 Git，放 KMS 或 Vault（见本篇第 10 节 K8s 迁移要点）。'],
  ['limit', '本地用 docker-compose，链端是 Sepolia 测试网或模拟器；生产会换成托管服务。以太坊基金会曾公布 Sepolia 的预计支持期并计划推出替代网，使用前请确认当前推荐的测试网（截至 2026-11 Sepolia 仍在运行，以官方公告为准）。']
], '各服务进程与 PostgreSQL、快照文件、Kafka、Redis 和链的读写关系', 'm04-50')}
${code('YAML', `
# docker-compose.yml（本地开发，示例；密码仅用于本地）
services:
  postgres:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: dev, POSTGRES_DB: minicex }
    ports: ["5432:5432"]
    volumes: ["./deploy/sql:/docker-entrypoint-initdb.d"]   # 启动时执行 DDL
  redis:
    image: redis:7
    ports: ["6379:6379"]
  kafka:
    image: apache/kafka:3.7.0                                # 官方镜像；bitnami/kafka 带版本号的镜像自 2025 年起不再免费提供
    environment:
      KAFKA_NODE_ID: "1"
      KAFKA_PROCESS_ROLES: "broker,controller"               # KRaft 模式，无需 ZooKeeper
      KAFKA_LISTENERS: "PLAINTEXT://:9092,CONTROLLER://:9093"
      KAFKA_ADVERTISED_LISTENERS: "PLAINTEXT://kafka:9092"   # 只供容器内服务访问；宿主机客户端需另加 EXTERNAL://localhost:29092 监听器
      KAFKA_CONTROLLER_QUORUM_VOTERS: "1@kafka:9093"
      KAFKA_CONTROLLER_LISTENER_NAMES: "CONTROLLER"
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: "CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT"
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: "1"
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: "1"
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: "1"
    ports: ["9092:9092"]
  ledger:     { build: ./services/ledger,     depends_on: [postgres], environment: { PG_DSN: "postgres://postgres:dev@postgres/minicex" } }
  order:      { build: ./services/order,      depends_on: [postgres, kafka, ledger] }
  matching:   { build: ./services/matching,   depends_on: [kafka], volumes: ["./data/snap:/snap"] }
  settlement: { build: ./services/settlement, depends_on: [kafka, ledger] }
  market-data:{ build: ./services/marketdata, depends_on: [kafka, redis] }
  wallet:     { build: ./services/wallet,     depends_on: [postgres, ledger], environment: { WALLET_MODE: "mock" } }
  gateway:    { build: ./services/gateway,    depends_on: [order, ledger, wallet, redis], ports: ["8080:8080"] }
  prometheus: { image: prom/prometheus, ports: ["9090:9090"], volumes: ["./deploy/prometheus.yml:/etc/prometheus/prometheus.yml"] }
  grafana:    { image: grafana/grafana, ports: ["3000:3000"] }
`)}
${tbl(['K8s 迁移要点', '做法'], [
  ['无状态服务', 'gateway、order、settlement、market-data、wallet 用 Deployment + HPA；就绪探针检查依赖连通'],
  ['撮合', 'StatefulSet，2 副本（主 + 热备），用 Lease 对象（client-go leaderelection）选主；快照存 PVC 或对象存储'],
  ['账本数据库', '托管 PostgreSQL（同步从库）或 CloudNativePG / Patroni；禁止与应用同节点'],
  ['Kafka', 'Strimzi Operator 或托管服务；replication.factor=3、min.insync.replicas=2、生产者 acks=all'],
  ['密钥', 'API Secret 加密密钥、JWT 签名密钥、钱包密钥放 KMS / Vault，通过 CSI 或启动时拉取；不进镜像、不进 Git'],
  ['CI/CD', 'GitHub Actions：lint（golangci-lint）→ 单元 + 回放测试 → 构建镜像 → 预发部署 → 集成测试 → 手动批准 → 灰度'],
  ['发布顺序', '先 ledger（兼容旧请求）→ settlement → order → matching（低峰期、先备后主）→ gateway']
])}
${tbl(['监控指标（示例名）', '含义', '告警阈值（示例）'], [
  ['ledger_invariant_diff{asset}', '全局不变量差额', '≠ 0 立即 P0，自动暂停提币'],
  ['matching_cmd_latency_seconds', '命令处理耗时直方图', 'P99 > 1 ms 持续 5 分钟'],
  ['matching_input_lag', '撮合消费 orders.cmd 的积压', '> 10,000 条'],
  ['settlement_lag_seconds', '成交时间到记账完成', 'P99 > 1 秒'],
  ['settlement_retry_total', '结算重试次数', '1 分钟内 > 100'],
  ['outbox_unsent', '未发送的 outbox 行数', '> 10,000 或最老 > 30 秒'],
  ['order_pending_stuck', 'PENDING 超过 30 秒的订单数', '> 0'],
  ['ws_connections / ws_dropped_slow', '连接数 / 因慢被断开数', '断开率 > 1%'],
  ['withdraw_review_queue', '待人工审批提币数', '> 50 或最老 > 30 分钟'],
  ['deposit_confirming_age', '确认中充值最大等待时间', '> 30 分钟（节点可能落后）']
])}

<h2>11. 安全清单与威胁模型</h2>
${tbl(['威胁（STRIDE 分类）', '场景', '防护', '验证'], [
  ['仿冒 Spoofing', 'API Key 泄露后被冒用', '最小权限、IP 白名单、HMAC + recvWindow、异常地理位置告警', '用错误 IP 调用期望 401'],
  ['篡改 Tampering', '请求参数被中间人改价', '签名覆盖全部参数；全站 TLS', '改一个参数期望签名失败'],
  ['抵赖 Repudiation', '用户否认下过单', '请求日志含签名与 IP；订单事件可追溯', '审计抽查'],
  ['信息泄露 Information Disclosure', '日志中打印 Secret 或 TOTP', '日志脱敏中间件；Secret 只存密文', 'grep 日志无敏感字段'],
  ['拒绝服务 DoS', '刷下单撤单、WebSocket 连接耗尽', '令牌桶限流、每 IP 连接上限、订单数上限', 'k6 超限期望 429'],
  ['权限提升 Elevation', '普通用户调用管理员审批接口', '管理接口独立域名 + 内网 + 双人审批 + RBAC', '越权测试'],
  ['资金：超卖', '并发下单使用同一笔余额', '账本条件更新 + CHECK 约束', '并发 100 单测试'],
  ['资金：重复入账', '充值通知重放', '(chain, tx_hash, log_index) 唯一 + biz 唯一', '重放测试'],
  ['资金：假充值', '假代币合约', '合约地址白名单；Removed 日志忽略', '测试网部署假币验证不入账'],
  ['资金：提币重放', '同一提币单签名广播两次', '状态机 + 同 nonce 替换', '故障注入'],
  ['内部作恶', '运维直接改余额表', '应用账号无 UPDATE 余额表之外权限；DBA 操作审计；不变量告警', '每日快照对账']
])}

${mm('迷你 CEX 的交付顺序：先账本，后撮合', `
flowchart LR
  W1["第 1 周<br/>账本：Post 幂等与不变量"]
  W2["第 2 周<br/>撮合引擎：订单簿、快照与回放"]
  W3["第 3 周<br/>订单与结算：冻结、补偿、outbox"]
  W4["第 4 周<br/>网关与行情：鉴权、限流、WebSocket"]
  W5["第 5 周<br/>充值提币：状态机与对账"]
  W6["第 6 周<br/>压测、故障演练与上线"]
  W1 --> W2 --> W3 --> W4 --> W5 --> W6
  class W1 key
  class W6 ok
`, [
  ['flow', '账本是所有服务唯一能改余额的地方，所以第一周先把它做对；撮合、结算、行情都依赖它。'],
  ['key', '每周结束都要有可演示的交付物，而不是“写了一部分代码”。'],
  ['limit', '6 周是单人或小团队的示例节奏，实际以团队规模和验收标准调整。']
])}
<h2>12. 里程碑计划（6 周）</h2>
${tbl(['周', '目标', '交付物'], [
  ['第 1 周', '骨架与账本', 'monorepo（services/、proto/、deploy/）；docker-compose；ledger 服务 + DDL；Post 幂等与不变量单元测试'],
  ['第 2 周', '撮合引擎', 'Book（限价、市价、撤单、IOC、FOK、Post-only）；Engine 主循环；快照与恢复；回放测试 + 基准测试报告'],
  ['第 3 周', '订单与结算', 'order 服务（冻结、投递、补偿任务）；settlement（手续费、解冻、outbox）；端到端下单成交'],
  ['第 4 周', '网关与行情', 'gateway（注册登录、TOTP、API Key、HMAC、限流）；market-data（K 线、深度 seq、Ticker）；WebSocket 推送；简易前端页面'],
  ['第 5 周', '充值提币', 'wallet 模拟模式 + Sepolia 测试网模式；提币状态机与管理员审批；对账任务'],
  ['第 6 周', '质量与上线演练', '压测报告（达标或给出瓶颈分析）；故障注入演练记录；Grafana 看板与告警规则；K8s 清单；README 与架构文档；演示视频']
])}

<h2>13. 扩展方向与面试 / 作品集要点</h2>
${tbl(['扩展方向', '涉及知识'], [
  ['条件单：止损、止盈、OCO', '触发服务、价格源、与撮合的交互（<a href="#m04-1">M09.2</a>）'],
  ['多交易对与撮合分片', '按 symbol 分区、每分片一个撮合实例、交易对迁移'],
  ['账本分片', '按 user_id 分片、跨分片结算与中间清算账户（<a href="#m04-9">M09.10</a>）'],
  ['储备金证明', '每日生成默克尔求和树（Merkle Sum Tree）与用户验证页面（<a href="#m04-8">M09.9</a>、<a href="#lab-por">PoR 实验</a>）'],
  ['MPC 签名与多链钱包', '<a href="#m03">M08 钱包</a>'],
  ['永续合约', '保证金、资金费率、强平（<a href="#m08">M11</a>）']
])}
${steps(['<b>讲清一个取舍</b>：为什么撮合单线程？答：确定性和时间优先；并行发生在交易对之间；用回放测试证明确定性。', '<b>讲清一个不变量</b>：账本如何保证不多不少？答：双分录 + 每笔借贷平衡 + biz 唯一 + 余额非负约束 + 全局不变量对账，并展示不变量查询和告警截图。', '<b>讲清一次故障</b>：kill settlement 后发生了什么？答：offset 未提交 → 重新消费 → 账本幂等去重 → 余额正确，展示故障注入记录。', '<b>给出数字</b>：撮合基准（命令/秒、P99）、端到端延迟、压测时的瓶颈和你做的优化（如手续费账户分桶）。', '<b>作品集材料</b>：GitHub 仓库（README 含架构图）、一键启动脚本、演示视频（下单 → 成交 → K 线 → 提币审批）、压测与故障演练报告。'])}

${tryit(`<p>用两天时间完成一个“最小闭环”，验证你能把本模块串起来：</p>
<ol><li>只用一个 Go 进程，内嵌 M09.5 的 Book 和一个内存版账本（map + 互斥锁，接口与 Post 相同）。</li>
<li>实现 HTTP 接口：充值（模拟）、下限价单（先冻结）、撤单（解冻）、查询余额。</li>
<li>成交后按第 8.2 节的 SettleLegs 记账，手续费 0.1%。</li>
<li>写一个脚本随机发 1 万个请求，结束后断言：每种资产用户 + 平台 = 累计充值；所有挂单冻结额之和 = 账本 frozen 之和。</li>
<li>预期结果：断言通过。然后把单进程拆成 order、matching、ledger 三个服务，中间加 Kafka，重复同样的断言。</li></ol>`)}

${mistakes([
  ['先把功能做完，账本的幂等和不变量以后再补。', '账本错误会污染所有历史数据，事后无法修复。幂等、借贷平衡和不变量测试必须从第一周开始。'],
  ['用 Kafka offset 作为撮合恢复点就够了。', 'offset 提交和订单簿状态不是原子的。恢复点应保存在快照里（订单簿 + 已处理 offset + seq），offset 提交只是加速。'],
  ['所有服务都直接读写同一个数据库最简单。', '只有 ledger 能写余额表。共享写权限会让任何服务的 bug 都变成资金问题，也无法做独立对账。'],
  ['压测只看撮合引擎的 TPS。', '瓶颈通常在账本写入（热点账户）、Kafka 往返和网关。要做端到端压测并定位瓶颈。']
])}
${recap(['迷你 CEX = gateway + order + matching + ledger + settlement + wallet + market-data，Kafka 串起异步链路，只有 ledger 写余额。', '同步路径只到“冻结 + 投递”；撮合、结算、行情全部异步，靠 seq、幂等和 outbox 保证一致。', '撮合：单线程、命令带时间戳、快照含 offset 与 seq；用回放测试证明确定性。', '账本：Leg 模型 + 借贷平衡检查 + biz 唯一 + 条件更新；不变量查询同时用于测试和线上告警。', '6 周交付：账本 → 撮合 → 订单结算 → 网关行情 → 充提 → 压测演练与文档。'])}
${quiz([
  { q: '撮合引擎从快照恢复后，为什么要跳过 offset ≤ 快照中 inOffset 的命令？', o: ['这些命令已经包含在快照的订单簿状态里，再处理会重复', '这些命令格式过期', 'Kafka 要求这样做', '为了提高吞吐'], a: 0, why: '快照记录了截至 inOffset 的状态。重复处理会重复成交或重复挂单。与格式、Kafka 规则、吞吐无关。' },
  { q: '下列哪项最能证明撮合引擎是确定性的？', o: ['代码评审通过', '线上运行一周没出错', '单元测试覆盖率 90%', '同一输入运行两次以及从快照恢复后，输出字节级一致'], a: 3, why: '确定性需要直接比较多次运行的输出。评审、稳定运行和覆盖率都不能证明输出完全一致。' }
])}
${exercises([["计算题（示例）：2,000 个活跃量化用户，每人每秒 10 条命令，撤单占 70%，成交率 25%。估算撮合命令速率和账本写入事务数。", "<p>总命令速率 = 2,000 × 10 = 20,000 条/秒，低于撮合目标 5 万/秒。</p><p>下单速率 = 20,000 × 30% = 6,000 单/秒，每单一次冻结事务。成交 = 6,000 × 25% = 1,500 笔/秒，每笔一次结算事务。</p><p>账本总写入约 7,500 事务/秒。每笔成交都更新平台手续费账户，需要分桶入账。</p>"], ["思考题：撮合主循环遇到无法解析的命令时，为什么选择停机，而不是跳过这条继续处理？", "<p>撮合的正确性依赖“同样的输入、同样的顺序”。跳过一条命令，订单簿状态就和输入日志不再对应。</p><p>被跳过的可能是一张已冻结资金的订单或一次撤单，跳过会让账本和订单簿不一致。</p><p>所以原则是“宁可停，不可丢”：先停机修复输入问题，再从快照和日志恢复。</p>"], ["计算题（示例）：用 SettleLegs 处理一笔成交 0.01 BTC @ 60,000。买方费率 0.1%，卖方费率 0.08%。列出 6 个 Leg，并说明 checkBalanced 如何通过。", "<p>成交额 = 600 USDT。买方手续费 = 0.01 × 0.1% = 0.00001 BTC；卖方手续费 = 600 × 0.08% = 0.48 USDT。</p><p>USDT：买方 DeltaFrozen −600，卖方 DeltaAvail +599.52，手续费账户 +0.48，合计 0。</p><p>BTC：卖方 DeltaFrozen −0.01，买方 DeltaAvail +0.00999，手续费账户 +0.00001，合计 0。两种资产变化之和都为 0，检查通过。</p>"]])}
${checklist(["能说明撮合快照里为什么必须同时保存订单簿、已处理 offset 和 seq。", "能写出一笔成交的 SettleLegs，并用 checkBalanced 验证每种资产变化之和为 0。", "做过确定性回放测试：同一输入运行两次、从中间快照恢复，比较输出字节级一致。", "能写出全局不变量和逐笔借贷平衡两条对账 SQL，并说明期望返回 0 行。", "能为迷你 CEX 列出 STRIDE 威胁和资金类威胁的防护与验证方法。"])}
${terms([
  ['微服务', 'Microservice', '把系统拆成独立部署、通过网络通信的小服务'],
  ['主题 / 分区 / 位点', 'Topic / Partition / Offset', 'Kafka 中消息的分类、有序子日志和读取位置'],
  ['补偿任务', 'Compensation Job', '定期发现并修复中间状态的后台任务'],
  ['属性测试', 'Property-based Testing', '随机生成大量输入并检查不变量是否始终成立的测试方法'],
  ['威胁模型', 'Threat Model', '系统性列出攻击者、攻击面与防护措施的分析'],
  ['选主', 'Leader Election', '多个副本中选出唯一主节点的机制']
])}
` });

})();
