/* ---------- M01 子文章（5/5）：★ 实战 链上充值监听与入账服务 ---------- */
(() => {
CUR = 'm01-9';
addCh({ id: 'm01-9', nav: '实战·设计：充值入账服务', title: 'M01.9 实战·设计：链上充值监听与入账服务（Go）', desc: '项目目标、需求拆解、系统架构、技术选型、数据模型与接口设计', html: `
<h1>M01.9 实战·设计：链上充值监听与入账服务（Go）</h1>
${meta(['独立设计一个支持 ETH 与 ERC-20（USDT/USDC）的充值服务：地址池、扫块、事件解析、重组处理、确认数。', '用 PostgreSQL + 事务性发件箱实现幂等入账，并通过 Kafka 和 HTTP 回调可靠通知业务方。', '写出包含模拟重组的测试，完成 Docker 部署、监控告警和安全清单，按 6 周里程碑交付。'], '<a href="#m01-8">M01.8 索引器工程</a>、<a href="#m01-7">M01.7 用 go-ethereum 读链</a>、<a href="#m01-4">M01.4 交易全解</a>', ['reorg'])}
${beginner(`<p><strong>充值（Deposit）</strong>：用户把链上资产转进平台分配给他的地址，平台识别后给他的平台账户加余额。</p>
<p><strong>入账（Credit）</strong>：在平台内部账本上给用户记一笔增加。入账之后用户就能交易或提币，所以入账必须“只发生一次、而且链上真的到账”。</p>
<p><strong>地址池（Address Pool）</strong>：预先生成好的一批充值地址，用户注册或首次充值时分配一个。</p>
<p><strong>事务性发件箱（Transactional Outbox）</strong>：把“要发出去的消息”和业务数据写在同一个数据库事务里，再由后台进程投递。它保证“数据改了，消息一定会发”。</p>
<p><strong>回调（Webhook）</strong>：服务主动向业务方的 HTTP 地址发送通知。</p>
<p><strong>冲正（Reversal）</strong>：用一笔反向流水抵消之前的错误入账，而不是直接删除记录。</p>`)}

<h2>1. 一句话理解</h2>
${one('充值服务 = 地址池 + 索引器（扫块、解析、重组回滚）+ 确认器（按金额分档）+ 幂等账本 + 可靠通知。它的唯一目标：链上真到账的钱，平台恰好入账一次。')}
${call('analogy', `<p>想象公司前台代收快递：每个员工有专属收件编号（充值地址）。前台每 12 秒查一次快递柜（扫块），看到写着某员工编号的包裹先登记“待签收”（pending）；包裹在柜子里放满一段时间、确认不会被快递公司收回（确认数达标），才在员工名下记“已签收”（credited），并发消息通知他（Kafka/回调）。</p>
<p><strong>类比的局限</strong>：现实中快递公司不会把已放进柜子的包裹“变没”；区块链会（重组）。所以“登记”和“签收”必须分开，而且签收后被收回时要能冲正。</p>`)}
${art('一图看懂：链上转账先登记 pending，确认数达标才入账一次', 660, 326, [
  S.zone(10, 30, 150, 212, { t: '链上' }),
  S.zone(188, 30, 304, 212, { t: '充值服务（Go）' }),
  S.zone(518, 30, 132, 212, { t: '业务方' }),
  S.box(22, 62, 126, 52, { k: 'info', icon: 'person', t: '用户钱包', s: '转 100 USDT' }),
  S.box(22, 160, 126, 56, { k: 'info', icon: 'wallet', t: '充值地址', s: '地址池分配' }),
  S.arrow(85, 116, 85, 158),
  S.box(202, 62, 122, 58, { k: 'tint', t: 'Scanner', s: '发现 → pending' }),
  S.box(356, 62, 122, 58, { k: 'ok', t: 'Confirmer', s: '确认数达标\n→ credited' }),
  S.arrow(326, 91, 354, 91),
  S.box(202, 158, 276, 64, { k: 'key', icon: 'db', t: 'PostgreSQL', s: '唯一事实来源\ndeposits · ledger_entries · outbox' }),
  S.arrow(263, 122, 263, 156),
  S.arrow(417, 122, 417, 156),
  S.route([[150, 188], [170, 188], [170, 91], [200, 91]], { k: 'info' }),
  S.box(530, 62, 108, 58, { k: 'tint', t: '账户服务', s: '去重后\n加余额' }),
  S.box(530, 158, 108, 64, { k: 'tint', t: 'Kafka', s: 'deposit.events' }),
  S.arrow(480, 190, 528, 190),
  S.arrow(584, 156, 584, 122),
  S.pill(130, 254, 400, 28, '服务不碰私钥：私钥在钱包系统（HSM / MPC）里', { k: 'warn' }),
  S.text(330, 310, '链上真到账的钱，平台恰好入账一次（100 USDT 为示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '用户转账到充值地址 → Scanner 扫块发现并登记 pending → Confirmer 在确认数达标后改为 credited，同时写账本和 outbox → Relay 投递 Kafka → 账户服务加余额。'],
  ['key', '“登记”和“入账”是两步：pending 不加余额，credited 才加。所有状态变化先落库，再由 outbox 异步通知。'],
  ['risk', '服务只存地址和派生序号，不碰私钥。'],
  ['fail', '入账后仍被重组会变成 reverted，需要冲正和人工处理。']
], '用户转账到充值地址，充值服务的 Scanner 登记待确认记录，Confirmer 在确认数达标后入账并写账本与发件箱，再经 Kafka 通知账户服务', 'm01-9')}

<h2>2. 项目目标与验收标准</h2>
${tbl(['类别', '验收标准（示例数字）', '验证方式'], [
  ['功能：资产', '支持以太坊主网 ETH、USDT、USDC；新增 ERC-20 只改配置不改代码', '配置新增测试代币后能识别充值'],
  ['功能：地址', '每个用户每条链一个固定充值地址；地址池空闲量低于阈值告警', '并发 1,000 次分配请求，无重复分配'],
  ['功能：识别', '识别 EOA 直接转 ETH、ERC-20 Transfer；忽略失败交易、假币、0 金额转账', '测试用例全部通过'],
  ['正确性', '对账差异 0；重复入账 0；漏入账 0', '每日对账任务 + 模拟重组测试'],
  ['延迟', '交易打包后 P95 ≤ 15 秒内出现 pending 记录；确认数达标后 P95 ≤ 10 秒入账并发出事件', '指标 deposit_detect_latency_seconds、deposit_credit_latency_seconds'],
  ['吞吐', '单链每块处理 ≥ 2,000 笔匹配转账；地址池 ≥ 100 万个地址', '压测：回放主网高峰区块 + 合成地址'],
  ['可用性', '月可用性 99.9%（停机 ≤ 43 分钟）；单个 RPC 源故障时自动切换', '故障演练'],
  ['安全', '服务不持有任何私钥；回调带 HMAC 签名；所有密钥来自密钥管理系统', '安全评审 + 渗透测试']
])}

<h2>3. 需求拆解与用户故事</h2>
${tbl(['角色', '用户故事', '验收要点'], [
  ['用户', '我想拿到一个固定的充值地址，转账后能在 App 里看到“确认中 3/12”。', 'GET /v1/deposits 返回确认进度'],
  ['用户', '我转了 USDT，到账后马上能交易。', '确认数达标后 10 秒内余额可用'],
  ['业务后端（账户服务）', '我要订阅“已入账”“已撤销”事件，按 deposit_id 去重处理。', 'Kafka 事件含唯一 deposit_id，至少一次投递'],
  ['外部商户（不接 Kafka）', '我要 HTTP 回调，并能验证回调真的来自平台。', 'X-Signature HMAC 校验；失败按退避重试 24 小时'],
  ['运维', '我要知道扫块是否落后、RPC 是否异常、有没有重组。', 'Grafana 面板 + 告警规则'],
  ['财务', '我要每天核对“链上收到的”和“账本入账的”是否一致。', '每日对账报表，差异为 0'],
  ['风控', '大额充值要等最终确定；入账后被撤销要立刻冻结用户。', '金额分档确认；deposit.reverted 事件触发冻结']
])}
<p><strong>不在本期范围</strong>：归集（把充值地址里的钱转到热钱包）、提币、多链（BTC、Tron、L2）。这些在 <a href="#m03-8">M07.9 企业钱包系统设计</a> 和 <a href="#m04-6">M08.7 充值提币与冷热钱包</a> 中展开。设计时为它们留好接口。</p>

<h2>4. 系统架构、调用链与状态机</h2>
${mm('充值服务架构（上）：发现与确认', `
flowchart LR
  subgraph EXT["外部"]
    U["用户 App"]
    RPC1["RPC 主"]
    RPC2["RPC 备"]
  end
  subgraph SVC["充值服务（Go）"]
    API["API 服务<br/>分配地址、查询充值"]
    AB["地址簿<br/>内存 map，5 秒增量刷新"]
    SC["Scanner<br/>扫块、解析、重组回滚"]
    CF["Confirmer<br/>金额分档确认、入账"]
    RC["Reconciler<br/>每日对账"]
  end
  DB[("PostgreSQL<br/>addresses、blocks、deposits<br/>ledger、outbox")]
  U --> API
  API --> DB
  DB --> AB
  AB --> SC
  RPC1 --> SC
  SC --> DB
  DB --> CF
  RPC2 -.->|"哈希校验"| CF
  RC --> DB
  RPC2 --> RC
`, [
  ['flow', '用户通过 API 领到地址，地址簿定期从数据库刷新；Scanner 从主 RPC 读链，写 blocks 和 deposits；备 RPC 用来校验哈希和每日对账。'],
  ['fail', '两个 Scanner 实例同时运行会互相回滚、重复写入。用 PostgreSQL 咨询锁（advisory lock）保证每条链只有一个活跃 Scanner。'],
  ['limit', '本架构按“每条链一个顺序扫描器”设计，单链吞吐受 RPC 往返限制。以太坊 12 秒一块，余量充足。'],
  ['risk', '服务不碰私钥。地址池只存地址和派生序号，私钥在钱包系统（HSM / MPC）里。']
])}
${mm('充值服务架构（下）：入账与通知', `
flowchart LR
  CF["Confirmer<br/>金额分档确认、入账"]
  DB[("PostgreSQL<br/>deposits、ledger<br/>outbox")]
  RL["Outbox Relay"]
  WH["Webhook Worker"]
  K[["Kafka<br/>deposit.events"]]
  ACC["账户服务"]
  M["商户回调地址"]
  CF -->|"同一事务：credited + 账本 + outbox"| DB
  DB --> RL
  RL --> K
  K --> ACC
  DB --> WH
  WH --> M
`, [
  ['flow', 'Confirmer 在同一数据库里把达标的充值改为 credited，同时写账本和 outbox；Relay 把 outbox 投递到 Kafka，Webhook Worker 回调商户。'],
  ['key', '所有状态变化都先落库，再由 outbox 异步通知。数据库是唯一事实来源，消息系统宕机不会丢事件。'],
  ['fail', 'Relay 发送 Kafka 成功但标记 sent_at 前崩溃：消息会再发一次（至少一次语义），消费方必须按 deposit_id 去重。']
])}
${mm('一笔 USDT 充值的完整调用链', `
sequenceDiagram
  participant U as 用户钱包
  participant CH as 以太坊
  participant SC as Scanner
  participant DB as PostgreSQL
  participant CF as Confirmer
  participant RL as Relay
  participant K as Kafka
  participant AC as 账户服务
  U->>CH: transfer(充值地址, 100 USDT)
  CH-->>CH: 打包进高度 h
  SC->>CH: eth_getBlockByNumber(h) 与 eth_getLogs(blockHash)
  SC->>SC: 校验父哈希、合约白名单、topics[2] 命中地址簿
  SC->>DB: 事务写 block、deposit(pending)、游标
  loop 每个新区块
    CF->>DB: 查询确认数达标的 pending
  end
  CF->>DB: 事务改为 credited、写 ledger credit、写 outbox
  RL->>DB: 读取未发送 outbox（SKIP LOCKED）
  RL->>K: 发送 deposit.credited
  RL->>DB: 标记 sent_at
  K-->>AC: 消费事件，按 deposit_id 去重后加余额
`, [
  ['flow', '从链上打包到账户服务加余额，经过 3 个数据库事务：发现（pending）、入账（credited + ledger + outbox）、投递标记。'],
  ['key', '每一步都可以安全重试：发现靠部分唯一索引去重，入账靠 ledger (deposit_id, kind) 唯一约束，投递靠消费方按 deposit_id 去重。'],
  ['fail', 'Relay 发送 Kafka 成功但标记 sent_at 前崩溃：消息会再发一次。这是“至少一次”语义，消费方必须幂等。'],
  ['limit', 'Kafka 只保证同一分区内有序。用 tx_hash 作为消息键，同一笔充值的 credited 与 reverted 进入同一分区，顺序不乱。']
])}
${mm('充值记录状态机', `
stateDiagram-v2
  state "待确认 pending" as Pending
  state "已入账 credited" as Credited
  state "已孤立 orphaned" as Orphaned
  state "已撤销 reverted" as Reverted
  [*] --> Pending: Scanner 发现
  Pending --> Credited: 确认数达标且多源哈希一致
  Pending --> Orphaned: 所在区块被重组
  Credited --> Reverted: 确认后仍被重组（事故）
  Orphaned --> [*]
  Credited --> [*]
  Reverted --> [*]
`, [
  ['flow', '正常路径只有 pending → credited。orphaned 无资金影响；reverted 是事故，需要冲正和人工处理。'],
  ['key', '同一交易被重新打包时，会在新区块里产生一条新的 pending 记录。旧的 orphaned 记录保留做审计，不占用唯一键。'],
  ['risk', 'Reverted 一旦出现，用户可能已经把入账的钱交易或提走了。风控要立即冻结账户，并按事故流程处理。'],
  ['limit', '状态只前进不后退。任何“修正”都通过新记录或冲正流水完成，便于审计。']
])}

<h2>5. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['语言', 'Go 1.22+', 'Rust、Java', '生态里 go-ethereum 可直接复用；并发简单；单二进制部署'],
  ['链交互', 'go-ethereum ethclient', '自写 JSON-RPC 客户端', '类型完整，支持批量与订阅，社区维护活跃'],
  ['数据库', 'PostgreSQL 16', 'MySQL 8', '部分唯一索引、可写 CTE、SKIP LOCKED、NUMERIC(78,0)、咨询锁，都是本项目的关键能力'],
  ['DB 驱动', 'pgx v5（pgxpool）', 'database/sql + lib/pq', '性能好，原生支持 PostgreSQL 类型与 BeginFunc'],
  ['消息', 'Kafka（segmentio/kafka-go）', 'RabbitMQ、NATS', '持久化、分区有序、可回放，适合账务事件'],
  ['通知兜底', 'HTTP 回调 + HMAC', 'gRPC 推送', '外部商户接入门槛最低'],
  ['RPC', '2 家服务商 + 1 个自建节点', '只用 1 家服务商', '交叉校验与故障切换，见 <a href="#m05-6">M04.6</a>'],
  ['监控', 'Prometheus + Grafana + Alertmanager', '云厂商监控', '标准指标格式，告警规则可版本化'],
  ['部署', 'Docker + Kubernetes', '虚拟机 + systemd', '滚动发布、密钥注入、健康检查'],
  ['密钥', 'Vault / 云 KMS + K8s Secret', '环境变量明文', '密钥轮换与审计']
])}

<h2>6. 数据模型（PostgreSQL DDL）</h2>
<p>以下 DDL 已在 PostgreSQL 16 上执行通过。金额一律 NUMERIC(78,0)，哈希与地址一律 BYTEA。</p>
${code('BASH', `
-- 地址池：预生成的充值地址（只存地址和派生路径，不存私钥）
CREATE TABLE deposit_addresses (
  id            BIGSERIAL PRIMARY KEY,
  chain_id      BIGINT      NOT NULL,
  address       BYTEA       NOT NULL,              -- 20 字节
  derive_index  BIGINT      NOT NULL,              -- HD 派生序号 m/44'/60'/0'/0/i
  user_id       BIGINT,                            -- NULL = 空闲
  assigned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chain_id, address),
  UNIQUE (chain_id, derive_index)
);
CREATE UNIQUE INDEX uq_addr_user ON deposit_addresses(chain_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_addr_free ON deposit_addresses(chain_id, id) WHERE user_id IS NULL;

-- 资产配置：合约白名单 + 精度 + 确认规则
CREATE TABLE tokens (
  chain_id      BIGINT  NOT NULL,
  symbol        TEXT    NOT NULL,
  contract      BYTEA,                              -- ETH 为 NULL
  decimals      INT     NOT NULL,
  min_deposit   NUMERIC(78,0) NOT NULL DEFAULT 0,   -- 低于此值不入账（防粉尘）
  confirm_rules JSONB   NOT NULL,                   -- [{"min":"0","conf":12},{"min":"10000000000","conf":64}]
  enabled       BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (chain_id, symbol)
);

-- 已扫描的区块（只保留主链；重组时删除祖先之后的行）
CREATE TABLE blocks (
  chain_id    BIGINT      NOT NULL,
  number      BIGINT      NOT NULL,
  hash        BYTEA       NOT NULL,
  parent_hash BYTEA       NOT NULL,
  block_time  TIMESTAMPTZ NOT NULL,
  scanned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, number),
  UNIQUE (chain_id, hash)
);

-- 游标：每条链、每个任务一行
CREATE TABLE cursors (
  chain_id   BIGINT NOT NULL,
  name       TEXT   NOT NULL,
  height     BIGINT NOT NULL,
  block_hash BYTEA  NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, name)
);

-- 充值记录：pending → credited；pending → orphaned；credited → reverted
CREATE TABLE deposits (
  id            BIGSERIAL PRIMARY KEY,
  chain_id      BIGINT        NOT NULL,
  tx_hash       BYTEA         NOT NULL,
  log_index     INT           NOT NULL,             -- 原生 ETH 为 -1
  block_number  BIGINT        NOT NULL,
  block_hash    BYTEA         NOT NULL,
  token         TEXT          NOT NULL,
  from_addr     BYTEA         NOT NULL,
  to_addr       BYTEA         NOT NULL,
  amount        NUMERIC(78,0) NOT NULL CHECK (amount > 0),
  user_id       BIGINT        NOT NULL,
  required_conf INT           NOT NULL,
  status        TEXT          NOT NULL CHECK (status IN ('pending','credited','orphaned','reverted')),
  detected_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  credited_at   TIMESTAMPTZ
);
-- 幂等：同一 (tx_hash, log_index) 只能有一条“活”记录；被孤立或撤销的历史记录不占用唯一键
CREATE UNIQUE INDEX uq_deposit_live ON deposits(chain_id, tx_hash, log_index)
  WHERE status IN ('pending','credited');
CREATE INDEX idx_deposit_pending ON deposits(chain_id, block_number) WHERE status = 'pending';
CREATE INDEX idx_deposit_user ON deposits(user_id, detected_at DESC);

-- 账本流水：每笔充值最多一条 credit、一条 reverse（数据库层面的幂等保证）
CREATE TABLE ledger_entries (
  id         BIGSERIAL PRIMARY KEY,
  deposit_id BIGINT        NOT NULL REFERENCES deposits(id),
  user_id    BIGINT        NOT NULL,
  token      TEXT          NOT NULL,
  amount     NUMERIC(78,0) NOT NULL,                -- 冲正为负数
  kind       TEXT          NOT NULL CHECK (kind IN ('credit','reverse')),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (deposit_id, kind)
);

-- 事务性发件箱：和业务数据同一事务写入，再由 Relay 投递到 Kafka
CREATE TABLE outbox (
  id         BIGSERIAL PRIMARY KEY,
  topic      TEXT        NOT NULL,
  msg_key    TEXT        NOT NULL,
  payload    JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at    TIMESTAMPTZ
);
CREATE INDEX idx_outbox_unsent ON outbox(id) WHERE sent_at IS NULL;

-- HTTP 回调投递记录（给不接 Kafka 的业务方）
CREATE TABLE webhook_deliveries (
  id          BIGSERIAL PRIMARY KEY,
  outbox_id   BIGINT      NOT NULL REFERENCES outbox(id),
  endpoint    TEXT        NOT NULL,
  attempts    INT         NOT NULL DEFAULT 0,
  next_try_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_status INT,
  done        BOOLEAN     NOT NULL DEFAULT false,
  UNIQUE (outbox_id, endpoint)
);
`)}
${call('info', `<p><strong>为什么 deposits 的唯一键是“部分唯一索引”</strong>：交易 T 在区块 A 中被发现（pending），A 被重组后 T 重新进入区块 B。旧记录变为 orphaned，新记录要能插入。如果用普通唯一键 (tx_hash, log_index)，新记录会和旧记录冲突而被丢弃，导致漏入账。部分唯一索引只约束 pending 和 credited 两种“活”状态，既防重复扫描，又允许重组后重新记录。</p>`)}
<h3>6.1 地址分配（并发安全）</h3>
${code('BASH', `
-- 已分配则直接返回（幂等）
SELECT address FROM deposit_addresses WHERE chain_id = $1 AND user_id = $2;

-- 未分配则从空闲地址中领取一个；SKIP LOCKED 让并发请求各拿各的，不互相等待
UPDATE deposit_addresses SET user_id = $2, assigned_at = now()
WHERE id = (
  SELECT id FROM deposit_addresses
  WHERE chain_id = $1 AND user_id IS NULL
  ORDER BY id LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING address;
-- 同一用户的两个并发请求：第二个会违反 uq_addr_user，捕获唯一约束错误后重新执行第一条 SELECT
`)}
<p>地址由钱包系统离线生成：用扩展公钥（xpub）按 BIP-32 派生 <code>m/44'/60'/0'/0/i</code>，只把地址和序号 i 导入地址池。私钥永远不进入充值服务。派生原理见 <a href="#m03-2">M07.2 助记词与 HD 钱包</a>。</p>

<h2>7. 接口设计</h2>
<h3>7.1 REST API</h3>
${tbl(['方法与路径', '请求', '响应', '说明'], [
  ['<code>POST /v1/deposit-addresses</code>', '<code>{"user_id":42,"chain":"ethereum"}</code>', '<code>{"address":"0x…","chain_id":1}</code>', '幂等：同一用户重复调用返回同一地址'],
  ['<code>GET /v1/deposits?user_id=42&amp;status=pending&amp;cursor=…</code>', '—', '<code>{"items":[…],"next_cursor":"…"}</code>', '游标分页；每条含 confirmations 与 required_conf'],
  ['<code>GET /v1/deposits/{id}</code>', '—', '单条充值详情', '供客服查询'],
  ['<code>POST /v1/admin/rescan</code>', '<code>{"from":19000000,"to":19000100}</code>', '<code>{"job_id":"…"}</code>', '运维补扫；只写入新记录，不改已入账记录；需要管理员权限与审计']
])}
<h3>7.2 Kafka 事件（topic：deposit.events，key：tx_hash）</h3>
${code('JSON', `
{
  "type": "deposit.credited",
  "deposit_id": 10086,
  "user_id": 42,
  "chain_id": 1,
  "token": "USDT",
  "amount": "100000000",
  "decimals": 6,
  "tx_hash": "0x9f1c…",
  "log_index": 61,
  "block_number": 21000000,
  "confirmations": 12,
  "occurred_at": "2026-10-23T08:00:00Z"
}
`)}
<p>事件类型：<code>deposit.detected</code>（可选，用于展示“确认中”）、<code>deposit.credited</code>、<code>deposit.reverted</code>。消费方规则：用 <code>deposit_id + type</code> 去重；金额是字符串形式的整数，配合 decimals 换算，禁止用浮点数解析。</p>
<h3>7.3 HTTP 回调</h3>
${steps([
  '请求：<code>POST</code> 商户地址，正文与 Kafka 事件相同。',
  '请求头：<code>X-Timestamp</code>（Unix 秒）和 <code>X-Signature</code> = hex(HMAC-SHA256(商户密钥, 时间戳 + "." + 正文))。',
  '商户校验：重新计算签名并做常量时间比较；拒绝时间戳与当前时间相差超过 5 分钟的请求（防重放）。',
  '成功：商户返回 2xx。失败：按 10 秒、30 秒、1 分钟、5 分钟、30 分钟……退避重试，最长 24 小时，之后进入人工队列。'
])}

${recap([
  '目标：链上真到账的钱恰好入账一次；用具体数字定义延迟、吞吐、可用性和正确性验收标准。',
  '架构：地址池 + Scanner（顺序扫块、按 blockHash 拉日志、找共同祖先回滚）+ Confirmer（金额分档、多源校验）+ outbox 通知。',
  '数据：deposits 部分唯一索引防重复且允许重组后重新记录；ledger (deposit_id, kind) 唯一保证最多一次入账和一次冲正。'
])}
${quiz([
  { q: '充值记录的唯一约束为什么用“只约束 pending 和 credited 的部分唯一索引”？', o: ['为了提高查询速度', '让重组后同一交易能在新区块重新记录，同时防止重复扫描', '因为 PostgreSQL 不支持普通唯一键', '为了节省磁盘'], a: 1, why: '普通唯一键会让重新打包的交易与旧的 orphaned 记录冲突而被丢弃，造成漏入账。部分唯一索引只约束活状态，兼顾去重与重组。' },
  { q: '为什么同一条链只能有一个 Scanner 实例在扫块？', o: ['两个实例会互相回滚、重复写游标，导致数据错乱', 'go-ethereum 不支持多实例', '为了节省 RPC 费用', 'PostgreSQL 只允许一个连接'], a: 0, why: '两个实例各自推进和回滚同一个游标会产生竞态。用 pg_try_advisory_lock 保证单活，其他副本待命。' }
])}
${exercises([["思考题：Kafka 事件为什么用 tx_hash 作为消息键？", "<p>Kafka 只保证同一分区内有序。用 tx_hash 做键，同一笔充值的所有事件进入同一个分区。这样 deposit.credited 和 deposit.reverted 的顺序不会乱。消费方仍要按 deposit_id + type 去重。</p>"], ["设计题（示例）：要新增 DAI（decimals = 18）。规则是小额 12 个确认，金额 ≥ 1 万 DAI 要 64 个确认。写出 tokens 表的 confirm_rules 值。", "<p>1 万 DAI = 10⁴ × 10¹⁸ = 10²² 个最小单位。值写成：<code>[{\"min\":\"0\",\"conf\":12},{\"min\":\"10000000000000000000000\",\"conf\":64}]</code>。金额用字符串整数，不用浮点数。新增代币只改配置，不改代码。</p>"], ["计算题（示例）：如果把月可用性目标从 99.9% 提高到 99.95%，按 30 天计算，每月最多允许停机多少分钟？", "<p>30 天 = 30 × 24 × 60 = 43,200 分钟。不可用比例 = 0.05%。允许停机 = 43,200 × 0.0005 = 21.6 分钟。比 99.9% 的约 43 分钟少一半，需要更快的故障切换。</p>"]])}
${checklist(["能为充值服务写出验收标准，并给延迟、吞吐、可用性定出具体数字。", "能画出地址池、Scanner、Confirmer、Outbox Relay 的架构和一笔充值的调用链。", "能说出充值记录的四种状态，以及每个转移的触发条件。", "能写出用 FOR UPDATE SKIP LOCKED 并发安全分配地址的 SQL。", "能设计带 HMAC 签名和 5 分钟时间戳窗口的回调接口。"])}
${call('info', '<p>设计到此完成。下一篇 <a href="#m01-50">M01.10 实战·实现</a> 讲核心代码、测试策略、部署运维、安全清单与里程碑。</p>', '下一篇')}
` });

CUR = 'm01-50';
addCh({ id: 'm01-50', nav: '实战·实现：充值入账服务', title: 'M01.10 实战·实现：链上充值监听与入账服务（Go）', desc: '核心代码、测试策略、部署运维、安全清单、里程碑与扩展方向', html: `
<h1>M01.10 实战·实现：链上充值监听与入账服务（Go）</h1>
${meta(['按上篇的设计，读懂并能复现本项目的核心代码。', '为项目制定测试策略：单元、集成、模糊与故障注入。', '完成部署、监控与安全清单，并按里程碑交付。'], '前置：<a href="#m01-9">M01.9 实战·设计</a>')}
${call('info', '<p>本篇是项目的下篇。架构图、数据模型和接口定义都在<a href="#m01-9">上篇</a>，读代码时可以对照着看。</p>')}

<h2>8. 核心代码</h2>
<p>以下代码来自一个可编译的工程（go-ethereum v1.17、pgx v5、kafka-go），已通过 <code>go vet</code> 和包含模拟重组的单元测试与 PostgreSQL 集成测试。为节省篇幅，省略了配置加载和 HTTP API。</p>
${art('代码结构：main.go 组装三个零件，接口隔开具体实现', 660, 336, [
  S.box(170, 14, 320, 50, { k: 'key', mono: 1, icon: 'code', t: 'cmd/depsvc/main.go', s: '组装依赖，用 errgroup 启动 3 个 goroutine' }),
  ...(() => { const c = S.cols(10, 640, 3, 40); return [
    S.box(c[0].x, 118, c[0].w, 62, { k: 'tint', mono: 1, t: 'AddressBook', s: 'Lookup(addr)\n每 5 秒从库刷新' }),
    S.box(c[1].x, 118, c[1].w, 62, { k: 'key', mono: 1, t: 'Scanner.Step()', s: '重组检测 → 收集充值\n→ 落库 → 确认入账' }),
    S.box(c[2].x, 118, c[2].w, 62, { k: 'tint', mono: 1, t: 'Relay.Once()', s: '读 outbox → 发 Kafka\n至少一次投递' }),
    S.box(c[0].x, 238, c[0].w, 62, { k: 'info', mono: 1, t: 'Chain 接口', s: 'ethclient（生产）\nfakeChain（测试）' }),
    S.box(c[1].x, 238, c[1].w, 62, { k: 'info', mono: 1, t: 'Store 接口', s: 'PgStore，每个方法\n一个数据库事务' }),
    S.box(c[2].x, 238, c[2].w, 62, { k: 'idle', mono: 1, dash: 1, t: 'kafka.Writer', s: 'topic deposit.events\nkey 为 tx_hash' }),
    S.arrow(c[1].x + c[1].w / 2, 182, c[1].x + c[1].w / 2, 236, { k: 'key' }),
    S.arrow(c[1].x + 40, 182, c[0].x + c[0].w - 30, 236),
    S.arrow(c[2].x + c[2].w / 2, 182, c[2].x + c[2].w / 2, 236),
    S.arrow(c[1].x - 2, 149, c[0].x + c[0].w + 2, 149, { dash: 1 })
  ]; })(),
  S.arrow(250, 66, 103, 116),
  S.arrow(330, 66, 330, 116),
  S.arrow(410, 66, 557, 116),
  S.text(330, 326, '接口让 Scanner 不依赖具体实现：测试里把 Chain 换成 fakeChain，就能模拟重组', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', 'main.go 创建 Scanner、AddressBook 和 Relay，三者并发运行；任何一个返回错误，errgroup 取消 ctx，全部退出。'],
  ['key', 'Scanner.Step 一次只处理一个高度，所有数据库写入都经过 Store 接口，每个方法内部是一个事务。'],
  ['fail', '收到 SIGTERM 时 ctx 被取消，goroutine 优雅退出；游标在数据库里，重启不丢进度。'],
  ['limit', '为节省篇幅，配置加载和 HTTP API 没有在代码里展示。']
], 'main.go 组装 AddressBook、Scanner 和 Relay 三个并发零件，Scanner 通过 Chain 接口读链、通过 Store 接口写库，Relay 把 outbox 发到 Kafka', 'm01-50')}
<h3>8.1 核心类型与接口</h3>
${code('GO', `
package deposit

import (
	"context"
	"errors"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
)

var (
	TransferSig     = crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
	ErrReorgTooDeep = errors.New("reorg deeper than max_reorg_depth")
)

// ConfirmRule：金额 ≥ MinAmount 时需要 Confirmations 个确认。
type ConfirmRule struct {
	MinAmount     *big.Int
	Confirmations uint64
}

// Token 描述一种可充值资产。ETH 的 Contract 为零地址。
type Token struct {
	Symbol   string
	Contract common.Address
	Decimals int
	Rules    []ConfirmRule // 按 MinAmount 从小到大排序
}

// RequiredConfirmations 按金额分档返回所需确认数（金额越大，确认越多）。
func (t Token) RequiredConfirmations(amount *big.Int) uint64 {
	need := uint64(1)
	for _, r := range t.Rules {
		if amount.Cmp(r.MinAmount) >= 0 {
			need = r.Confirmations
		}
	}
	return need
}

// Deposit 是一笔识别出的充值。原生 ETH 的 LogIndex 固定为 -1。
type Deposit struct {
	ChainID      int64
	TxHash       common.Hash
	LogIndex     int
	BlockNumber  uint64
	BlockHash    common.Hash
	Token        string
	From, To     common.Address
	Amount       *big.Int
	UserID       int64
	RequiredConf uint64
}

// Chain 是扫块需要的最小 RPC 接口。*ethclient.Client 天然满足它，测试时用假实现替换。
type Chain interface {
	BlockNumber(ctx context.Context) (uint64, error)
	HeaderByNumber(ctx context.Context, number *big.Int) (*types.Header, error)
	BlockByNumber(ctx context.Context, number *big.Int) (*types.Block, error)
	FilterLogs(ctx context.Context, q ethereum.FilterQuery) ([]types.Log, error)
	TransactionReceipt(ctx context.Context, txHash common.Hash) (*types.Receipt, error)
}

// Store 抽象持久化。每个方法内部是一个数据库事务。
type Store interface {
	Cursor(ctx context.Context) (height uint64, hash common.Hash, err error)
	BlockHash(ctx context.Context, height uint64) (common.Hash, bool, error)
	SaveBlock(ctx context.Context, hdr *types.Header, deps []Deposit) error
	Rollback(ctx context.Context, ancestor uint64) (reverted []Deposit, err error)
	ConfirmUpTo(ctx context.Context, head uint64) (credited int, err error)
}

// AddressBook 判断地址是否属于某个用户（内存集合，定期从数据库刷新）。
type AddressBook interface {
	Lookup(addr common.Address) (userID int64, ok bool)
}
`)}
<h3>8.2 Scanner：一步处理一个高度</h3>
${code('GO', `
// Step 处理一个高度：检测重组 → 收集充值 → 落库 → 推进确认。
func (s *Scanner) Step(ctx context.Context) (bool, error) {
	cur, curHash, err := s.Store.Cursor(ctx)
	if err != nil {
		return false, fmt.Errorf("cursor: %w", err)
	}
	head, err := s.Chain.BlockNumber(ctx)
	if err != nil {
		return false, fmt.Errorf("head: %w", err)
	}
	if cur >= head {
		return false, nil // 已追上链头，调用方休眠后重试
	}
	next := cur + 1
	hdr, err := s.Chain.HeaderByNumber(ctx, new(big.Int).SetUint64(next))
	if err != nil {
		return false, fmt.Errorf("header %d: %w", next, err)
	}
	// 1. 父哈希不连续 = 发生重组
	if curHash != (common.Hash{}) && hdr.ParentHash != curHash {
		anc, err := s.findAncestor(ctx, cur) // 实现见 M01.8
		if err != nil {
			return false, err // 超过最大深度：停止推进并告警，等人工处理
		}
		reverted, err := s.Store.Rollback(ctx, anc)
		if err != nil {
			return false, fmt.Errorf("rollback to %d: %w", anc, err)
		}
		slog.Warn("reorg handled", "from", cur, "ancestor", anc, "depth", cur-anc, "reverted_credited", len(reverted))
		return true, nil
	}
	// 2. 收集本块充值
	deps, err := s.collect(ctx, hdr)
	if err != nil {
		return false, err
	}
	// 3. 区块 + 充值 + 游标在同一事务里写入
	if err := s.Store.SaveBlock(ctx, hdr, deps); err != nil {
		return false, fmt.Errorf("save %d: %w", next, err)
	}
	// 4. 达到确认数的充值入账并写 outbox
	if _, err := s.Store.ConfirmUpTo(ctx, head); err != nil {
		return false, fmt.Errorf("confirm: %w", err)
	}
	return true, nil
}
`)}
<h3>8.3 识别 ERC-20 与原生 ETH 充值</h3>
${code('GO', `
func (s *Scanner) collect(ctx context.Context, hdr *types.Header) ([]Deposit, error) {
	var out []Deposit
	bh := hdr.Hash()

	// A. ERC-20：按区块哈希查日志，保证日志和这个区块一致（EIP-234）
	addrs := make([]common.Address, 0, len(s.Tokens))
	for a := range s.Tokens {
		addrs = append(addrs, a)
	}
	logs, err := s.Chain.FilterLogs(ctx, ethereum.FilterQuery{
		BlockHash: &bh,
		Addresses: addrs,                          // 只要白名单合约
		Topics:    [][]common.Hash{{TransferSig}}, // 只要 Transfer 事件
	})
	if err != nil {
		return nil, fmt.Errorf("logs %d: %w", hdr.Number, err)
	}
	for _, lg := range logs {
		tok, ok := s.Tokens[lg.Address] // 再次校验合约白名单
		if !ok || lg.Removed || len(lg.Topics) != 3 || len(lg.Data) != 32 {
			continue
		}
		to := common.BytesToAddress(lg.Topics[2].Bytes())
		uid, ok := s.Book.Lookup(to)
		if !ok {
			continue
		}
		amt := new(big.Int).SetBytes(lg.Data)
		if amt.Sign() == 0 {
			continue // 0 金额转账：常见的“地址投毒”手法，直接忽略
		}
		out = append(out, Deposit{
			ChainID: s.ChainID, TxHash: lg.TxHash, LogIndex: int(lg.Index),
			BlockNumber: lg.BlockNumber, BlockHash: lg.BlockHash, Token: tok.Symbol,
			From: common.BytesToAddress(lg.Topics[1].Bytes()), To: to, Amount: amt,
			UserID: uid, RequiredConf: tok.RequiredConfirmations(amt),
		})
	}

	// B. 原生 ETH：遍历区块交易，找 to 属于地址池且 value > 0 的交易
	blk, err := s.Chain.BlockByNumber(ctx, hdr.Number)
	if err != nil {
		return nil, fmt.Errorf("block %d: %w", hdr.Number, err)
	}
	if blk.Hash() != bh { // 负载均衡后的节点给了另一个分叉的块
		return nil, fmt.Errorf("block %d: hash mismatch, retry", hdr.Number)
	}
	for _, tx := range blk.Transactions() {
		if tx.To() == nil || tx.Value().Sign() == 0 {
			continue
		}
		uid, ok := s.Book.Lookup(*tx.To())
		if !ok {
			continue
		}
		rc, err := s.Chain.TransactionReceipt(ctx, tx.Hash())
		if err != nil {
			return nil, fmt.Errorf("receipt %s: %w", tx.Hash(), err)
		}
		if rc.Status != types.ReceiptStatusSuccessful || rc.BlockHash != bh {
			continue // 失败交易不转账；回执来自别的分叉也跳过
		}
		from, err := types.Sender(s.signer, tx) // 从签名恢复发送者
		if err != nil {
			return nil, err
		}
		out = append(out, Deposit{
			ChainID: s.ChainID, TxHash: tx.Hash(), LogIndex: -1,
			BlockNumber: hdr.Number.Uint64(), BlockHash: bh, Token: s.ETH.Symbol,
			From: from, To: *tx.To(), Amount: tx.Value(), UserID: uid,
			RequiredConf: s.ETH.RequiredConfirmations(tx.Value()),
		})
	}
	return out, nil
}
`)}
${call('warn', `<p><strong>合约内部转 ETH 看不到</strong>：如果用户从交易所提币或通过多签钱包、智能合约钱包给你的充值地址转 ETH，这笔 ETH 是“合约内部调用”转出的，交易的 to 是合约而不是你的地址，上面的循环识别不到。三种处理方式：① 用 <code>debug_traceBlockByNumber</code>（callTracer）或 <code>trace_block</code> 追踪内部调用（需要支持 trace 的节点，成本更高）；② 归集时对比地址余额与已入账总额，差额走人工补账流程；③ 在充值页面明确提示。生产系统一般 ① + ② 同时做。</p>`)}
<h3>8.4 入账：确认数达标 → credited + 账本 + outbox（一个事务）</h3>
${code('GO', `
// ConfirmUpTo：确认数达标的 pending 充值 → credited，同时写账本流水和 outbox（同一事务）。
func (s *PgStore) ConfirmUpTo(ctx context.Context, head uint64) (int, error) {
	var n int
	err := pgx.BeginFunc(ctx, s.DB, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx, \`
WITH c AS (
  UPDATE deposits SET status='credited', credited_at=now()
  WHERE chain_id=$1 AND status='pending' AND $2 - block_number + 1 >= required_conf
  RETURNING id, user_id, token, amount, tx_hash, log_index, block_number
), l AS (
  INSERT INTO ledger_entries(deposit_id, user_id, token, amount, kind)
  SELECT id, user_id, token, amount, 'credit' FROM c
  ON CONFLICT (deposit_id, kind) DO NOTHING
)
INSERT INTO outbox(topic, msg_key, payload)
SELECT 'deposit.events', encode(tx_hash,'hex'),
       json_build_object('type','deposit.credited','deposit_id',id,'user_id',user_id,
         'token',token,'amount',amount::text,'tx_hash','0x'||encode(tx_hash,'hex'),
         'log_index',log_index,'block_number',block_number)
FROM c\`, s.ChainID, int64(head))
		n = int(tag.RowsAffected())
		return err
	})
	return n, err
}
`)}
<p>生产版本在这一步之前还要做<strong>多源哈希校验</strong>：对将要入账的每个 block_number，用备用 RPC 读取同高度区块哈希，与 deposits.block_hash 比较，不一致就跳过本轮并告警（见 <a href="#m01-8">M01.8</a> 第 7.2 节）。</p>
<h3>8.5 重组回滚：orphaned 与 reverted</h3>
${code('GO', `
// Rollback：删除祖先之后的区块；未入账的充值标记 orphaned；已入账的标记 reverted 并冲正。
func (s *PgStore) Rollback(ctx context.Context, anc uint64) ([]Deposit, error) {
	var reverted []Deposit
	err := pgx.BeginFunc(ctx, s.DB, func(tx pgx.Tx) error {
		rows, err := tx.Query(ctx, \`
UPDATE deposits SET status = CASE WHEN status='credited' THEN 'reverted' ELSE 'orphaned' END
WHERE chain_id=$1 AND block_number > $2 AND status IN ('pending','credited')
RETURNING id, status, user_id, token, amount::text, tx_hash\`, s.ChainID, int64(anc))
		if err != nil {
			return err
		}
		type rv struct {
			id, uid    int64
			token, amt string
			txh        []byte
		}
		var rvs []rv
		for rows.Next() {
			var id, uid int64
			var st, tok, amt string
			var txh []byte
			if err := rows.Scan(&id, &st, &uid, &tok, &amt, &txh); err != nil {
				return err
			}
			if st == "reverted" {
				rvs = append(rvs, rv{id, uid, tok, amt, txh})
			}
		}
		if err := rows.Err(); err != nil {
			return err
		}
		for _, r := range rvs {
			// 冲正流水（负数）+ 撤销事件；风控系统收到后冻结或追回
			if _, err := tx.Exec(ctx, \`INSERT INTO ledger_entries(deposit_id, user_id, token, amount, kind)
				VALUES ($1,$2,$3,-($4::numeric),'reverse') ON CONFLICT (deposit_id, kind) DO NOTHING\`,
				r.id, r.uid, r.token, r.amt); err != nil {
				return err
			}
			if _, err := tx.Exec(ctx, \`INSERT INTO outbox(topic, msg_key, payload)
				VALUES ('deposit.events', encode($2::bytea,'hex'),
				json_build_object('type','deposit.reverted','deposit_id',$1::bigint,'user_id',$3::bigint,'amount',$4::text))\`,
				r.id, r.txh, r.uid, r.amt); err != nil {
				return err
			}
			amt, _ := new(big.Int).SetString(r.amt, 10)
			reverted = append(reverted, Deposit{UserID: r.uid, Token: r.token, Amount: amt, TxHash: common.BytesToHash(r.txh)})
		}
		if _, err := tx.Exec(ctx, \`DELETE FROM blocks WHERE chain_id=$1 AND number > $2\`, s.ChainID, int64(anc)); err != nil {
			return err
		}
		_, err = tx.Exec(ctx, \`UPDATE cursors SET height=$2,
			block_hash=(SELECT hash FROM blocks WHERE chain_id=$1 AND number=$2), updated_at=now()
			WHERE chain_id=$1 AND name='deposit'\`, s.ChainID, int64(anc))
		return err
	})
	return reverted, err
}
`)}
<h3>8.6 Outbox Relay 与回调签名</h3>
${code('GO', `
// Relay 把 outbox 里未发送的消息发到 Kafka。至少一次投递：消费方按 deposit_id 去重。
func (r *Relay) Once(ctx context.Context) (int, error) {
	sent := 0
	err := pgx.BeginFunc(ctx, r.DB, func(tx pgx.Tx) error {
		rows, err := tx.Query(ctx, \`SELECT id, msg_key, payload::text FROM outbox
			WHERE sent_at IS NULL ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED\`)
		if err != nil {
			return err
		}
		var ids []int64
		var msgs []kafka.Message
		for rows.Next() {
			var id int64
			var key, payload string
			if err := rows.Scan(&id, &key, &payload); err != nil {
				return err
			}
			ids = append(ids, id)
			msgs = append(msgs, kafka.Message{Key: []byte(key), Value: []byte(payload)})
		}
		if err := rows.Err(); err != nil || len(msgs) == 0 {
			return err
		}
		if err := r.Writer.WriteMessages(ctx, msgs...); err != nil {
			return err // 事务回滚，下次重发
		}
		_, err = tx.Exec(ctx, \`UPDATE outbox SET sent_at=now() WHERE id = ANY($1)\`, ids)
		sent = len(ids)
		return err
	})
	return sent, err
}

// SignWebhook 生成回调签名：HMAC-SHA256(secret, timestamp + "." + body)。
func SignWebhook(secret []byte, ts int64, body []byte) string {
	m := hmac.New(sha256.New, secret)
	m.Write([]byte(strconv.FormatInt(ts, 10) + "."))
	m.Write(body)
	return hex.EncodeToString(m.Sum(nil))
}
`)}
<h3>8.7 组装：main.go</h3>
${code('GO', `
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop() // 收到 SIGTERM：取消 ctx，所有 goroutine 优雅退出

	db, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	client, err := ethclient.DialContext(ctx, os.Getenv("RPC_URL"))
	if err != nil {
		log.Fatal(err)
	}
	chainID, err := client.ChainID(ctx)
	if err != nil || chainID.Int64() != 1 {
		log.Fatalf("unexpected chain id %v err %v", chainID, err) // 防止连错链
	}

	usdt := common.HexToAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7")
	usdc := common.HexToAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
	stable := []deposit.ConfirmRule{
		{MinAmount: big.NewInt(0), Confirmations: 12},                 // 示例：小额 12 个确认
		{MinAmount: big.NewInt(10_000 * 1_000_000), Confirmations: 64}, // 示例：≥ 1 万美元接近 finalized
	}
	book := &deposit.PgAddressBook{DB: db, ChainID: 1}
	if err := book.Refresh(ctx); err != nil {
		log.Fatal(err)
	}
	sc := &deposit.Scanner{
		Chain: client, Store: &deposit.PgStore{DB: db, ChainID: 1}, Book: book,
		ChainID: 1, MaxReorg: 64, Poll: 3 * time.Second,
		ETH: deposit.Token{Symbol: "ETH", Decimals: 18, Rules: []deposit.ConfirmRule{
			{MinAmount: big.NewInt(0), Confirmations: 12},
			{MinAmount: new(big.Int).Mul(big.NewInt(5), big.NewInt(1e18)), Confirmations: 64}, // ≥ 5 ETH
		}},
		Tokens: map[common.Address]deposit.Token{
			usdt: {Symbol: "USDT", Contract: usdt, Decimals: 6, Rules: stable},
			usdc: {Symbol: "USDC", Contract: usdc, Decimals: 6, Rules: stable},
		},
	}
	relay := &deposit.Relay{DB: db, Writer: &kafka.Writer{
		Addr: kafka.TCP(strings.Split(os.Getenv("KAFKA_BROKERS"), ",")...), Topic: "deposit.events",
		Balancer: &kafka.Hash{}, RequiredAcks: kafka.RequireAll, // 按 key 分区，全副本确认
	}}

	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error { book.Loop(ctx, 5*time.Second); return nil })
	g.Go(func() error { return sc.Run(ctx) })
	g.Go(func() error {
		for ctx.Err() == nil {
			if n, err := relay.Once(ctx); err != nil || n == 0 {
				time.Sleep(time.Second)
			}
		}
		return nil
	})
	if err := g.Wait(); err != nil && ctx.Err() == nil {
		log.Fatal(err)
	}
}
`)}
<p><strong>单实例保证</strong>：多副本部署时，Scanner 启动前执行 <code>SELECT pg_try_advisory_lock(1)</code>（每条链一个锁号），拿到锁的副本才扫描，其他副本只跑 API 和 Relay。持锁连接断开时锁自动释放，备用副本接管。</p>
<p><strong>算一算（示例：入账延迟）</strong>：小额 USDT 规则是 12 个确认。交易在高度 h 打包，链头到 h + 11 时确认数 = 12。以太坊 12 秒一块：等待 11 × 12 = 132 秒；加上扫描轮询（≤ 3 秒）和 Relay 轮询（≤ 1 秒），用户约 2 分 16 秒后到账。大额规则 64 个确认：63 × 12 = 756 秒 ≈ 12.6 分钟。</p>

<h2>9. 测试策略</h2>
${tbl(['层级', '内容', '工具'], [
  ['单元', '金额分档确认、Transfer 解码、假币过滤、0 金额过滤、ETH 失败交易过滤', 'go test，表驱动'],
  ['重组模拟', '假链 fakeChain 随时替换分叉：入账前重组 → orphaned；入账后重组 → reverted；同一交易重新打包 → 新记录', 'go test + 内存 Store'],
  ['集成', 'PgStore 的事务、部分唯一索引、可写 CTE、冲正流水', 'Docker 启动 PostgreSQL（testcontainers-go）'],
  ['链上集成', '本地链发 ETH 与 ERC-20 转账；用快照回滚制造真实重组', 'Foundry anvil：<code>evm_snapshot</code> / <code>evm_revert</code> 后重新出块'],
  ['模糊', '任意 topics / data 组合不 panic，不产生负数或 0 金额记录', '<code>go test -fuzz=FuzzCollect</code>'],
  ['压测', '每块 2,000 笔匹配转账、100 万地址的地址簿查找', '回放主网区块 + 合成地址'],
  ['故障注入', '事务中途 kill -9、RPC 返回旧数据、Kafka 宕机 10 分钟、数据库主从切换', 'toxiproxy、chaos 工具']
])}
<p>下面的测试用假链模拟“确认数太小，入账后被重组”的事故场景（完整假链与内存 Store 约 150 行，此处只展示关键部分）：</p>
${code('GO', `
// fakeChain：可以随时替换某个高度之后的分叉，用来模拟重组。
type fakeChain struct {
	headers []*types.Header            // 下标 = 高度
	logs    map[common.Hash][]types.Log // 按区块哈希
}

// mine 在链尾追加一个块；fork 标签让不同分叉同高度的哈希不同；dep 为 true 时块里有 100 USDT 充值。
func (c *fakeChain) mine(fork string, dep bool) {
	p := c.headers[len(c.headers)-1]
	h := &types.Header{Number: big.NewInt(int64(len(c.headers))), ParentHash: p.Hash(), Extra: []byte(fork)}
	c.headers = append(c.headers, h)
	if dep {
		amt := common.LeftPadBytes(big.NewInt(100_000_000).Bytes(), 32)
		c.logs[h.Hash()] = []types.Log{{
			Address: usdt, Topics: []common.Hash{TransferSig, common.BytesToHash(common.HexToAddress("0xbeef").Bytes()), common.BytesToHash(user.Bytes())},
			Data: amt, BlockNumber: h.Number.Uint64(), BlockHash: h.Hash(), TxHash: common.HexToHash("0x01"), Index: 0,
		}}
	}
}

// reorg 砍掉最后 depth 个块（之后再用 mine 接上新分叉）。
func (c *fakeChain) reorg(depth int) { c.headers = c.headers[:len(c.headers)-depth] }

// 确认数过小：先入账，后被重组，状态变为 reverted。
func TestReorgAfterCredit(t *testing.T) {
	c := newFakeChain()
	c.mine("a", false)
	c.mine("a", true) // 高度 2：充值
	c.mine("a", false)
	s := newMemStore(c.headers[0])
	sc := newScanner(c, s, 1) // 只要 1 个确认
	drain(t, sc)
	if s.deps[0].status != "credited" {
		t.Fatalf("want credited, got %s", s.deps[0].status)
	}
	c.reorg(2) // 砍掉高度 2、3
	c.mine("b", false)
	c.mine("b", false)
	c.mine("b", false) // 新分叉更长，且不含这笔充值（双花）
	drain(t, sc)
	if got := s.deps[0].status; got != "reverted" {
		t.Fatalf("want reverted, got %s", got)
	}
}

// 确认数足够：重组发生在入账之前，只会 orphaned，没有事故。
func TestReorgBeforeCredit(t *testing.T) {
	c := newFakeChain()
	c.mine("a", false)
	c.mine("a", false)
	c.mine("a", true) // 高度 3：充值
	c.mine("a", false)
	s := newMemStore(c.headers[0])
	sc := newScanner(c, s, 6)
	drain(t, sc)
	c.reorg(2)
	for i := 0; i < 4; i++ {
		c.mine("b", false)
	}
	drain(t, sc)
	if got := s.deps[0].status; got != "orphaned" {
		t.Fatalf("want orphaned, got %s", got)
	}
}
`)}
${steps([
  '<strong>测试用例清单</strong>：① USDT 100 → pending → 12 块后 credited；② 假 USDT 合约同签名事件 → 忽略；③ 0 金额 Transfer → 忽略；④ ETH 转账回执 status = 0 → 忽略；⑤ ERC-721 Transfer（4 个 topic）→ 忽略；⑥ 同一块扫描两次 → 1 条记录；⑦ 入账前 1 块重组 → orphaned；⑧ 入账后 3 块重组 → reverted + 冲正 + deposit.reverted；⑨ 同一交易重组后进入新块 → 新 pending，最终只入账一次；⑩ 重组深度 &gt; MaxReorg → 停止推进并报错；⑪ Kafka 不可用 → outbox 积压，恢复后全部投递；⑫ 回调签名错误或过期 → 商户拒绝。',
  '<strong>链上集成测试做法</strong>：启动 anvil → 部署测试 ERC-20 → 调用 <code>evm_snapshot</code> → 转账给充值地址并出块 → 等 Scanner 记录 pending → <code>evm_revert</code> 回到快照 → 不含该转账地出 3 个块 → 断言记录变为 orphaned。'
])}

<h2>10. 部署与运维</h2>
${art('数据流与部署：一个进程、一个数据库，单活 Scanner', 660, 330, [
  S.zone(10, 30, 120, 226, { t: '链上' }),
  S.zone(166, 30, 260, 226, { t: '进程 depsvc（Go，Docker）' }),
  S.zone(462, 30, 188, 226, { t: '数据层' }),
  S.box(20, 66, 100, 52, { k: 'info', t: 'RPC', s: '主 + 备' }),
  S.box(180, 66, 232, 52, { k: 'key', mono: 1, t: 'Scanner（单活）', s: '持有 advisory lock 的副本' }),
  S.box(180, 136, 232, 48, { k: 'tint', mono: 1, t: 'AddressBook', s: '内存 map · 5 秒刷新' }),
  S.box(180, 204, 232, 40, { k: 'tint', mono: 1, t: 'Relay', s: '轮询 outbox · 每秒一次' }),
  S.box(478, 66, 156, 112, { k: 'key', t: 'PostgreSQL', s: 'blocks · cursors\ndeposits · outbox\nledger_entries' }),
  S.box(478, 198, 156, 48, { k: 'tint', t: 'Kafka', s: 'deposit.events' }),
  S.arrow(122, 92, 178, 92),
  S.arrow(414, 92, 476, 92, { k: 'key' }),
  S.arrow(476, 150, 414, 158, { dash: 1 }),
  S.arrow(476, 180, 414, 212, { dash: 1 }),
  S.arrow(414, 224, 476, 224),
  S.pill(130, 270, 400, 28, '多副本时只有拿到 advisory lock 的副本扫描，其他副本只跑 API 和 Relay', { k: 'warn' }),
  S.text(330, 318, '游标存在数据库里，重启或切换副本都不丢进度', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', 'Scanner 从 RPC 读链，把区块、充值和游标写进 PostgreSQL；AddressBook 从库里刷新地址；Relay 读 outbox 发往 Kafka。'],
  ['key', '进程不保存业务状态：状态全在数据库，进程可以随时重启或滚动发布。'],
  ['risk', '密钥（RPC key、数据库密码、Kafka 凭证、回调密钥）不写进配置文件，由环境变量注入，来源是 Vault 或 K8s Secret。'],
  ['fail', '持锁连接断开时锁自动释放，备用副本接管；Scanner 不能出现两个活跃实例。']
], '一个 depsvc 进程内运行 Scanner、AddressBook 和 Relay，Scanner 读 RPC 并写 PostgreSQL，Relay 把 outbox 发到 Kafka，Scanner 通过咨询锁保持单活', 'm01-50')}
${code('BASH', `
# Dockerfile：多阶段构建，最终镜像只有一个静态二进制
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/depsvc ./cmd/depsvc

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/depsvc /depsvc
USER nonroot
EXPOSE 8080 9090
ENTRYPOINT ["/depsvc"]
`)}
${code('BASH', `
# config.yaml（示例）。密钥不写在文件里，由环境变量注入，环境变量来自 Vault / K8s Secret
chain:
  id: 1
  rpc_primary_env: RPC_URL            # 主 RPC 地址（含 API key，属于密钥）
  rpc_backup_env: RPC_BACKUP_URL
  poll_interval: 3s
  max_reorg_depth: 64
  start_height: 21000000              # 首次启动起点
tokens:
  - { symbol: ETH,  decimals: 18, rules: [{min: "0", conf: 12}, {min: "5000000000000000000", conf: 64}] }
  - { symbol: USDT, contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6,
      rules: [{min: "0", conf: 12}, {min: "10000000000", conf: 64}] }
  - { symbol: USDC, contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6,
      rules: [{min: "0", conf: 12}, {min: "10000000000", conf: 64}] }
kafka:
  brokers_env: KAFKA_BROKERS
  topic: deposit.events
webhook:
  secret_env: WEBHOOK_SECRET
  max_retry_duration: 24h
`)}
${steps([
  '<strong>环境</strong>：dev（anvil 本地链）→ staging（Sepolia 测试网 + 测试代币）→ prod（主网）。每个环境独立数据库、独立 Kafka topic。',
  '<strong>CI/CD</strong>：PR 触发 gofmt 检查、go vet、golangci-lint、单元测试、-race、集成测试（PostgreSQL 容器）；合并后构建镜像并打 git sha 标签；数据库迁移用 golang-migrate 单独执行，先迁移后发布。',
  '<strong>密钥</strong>：RPC key、数据库密码、Kafka 凭证、回调密钥全部来自 Vault 或云 KMS；按季度轮换；回调密钥支持新旧两把同时有效的过渡期。',
  '<strong>数据库</strong>：主从 + 自动故障切换；每日全量备份 + WAL 归档，演练恢复；deposits 与 ledger_entries 只允许服务账号 INSERT/UPDATE，禁止 DELETE。',
  '<strong>发布</strong>：Scanner 依赖咨询锁保持单活，滚动发布时旧副本释放锁、新副本接管；游标在数据库里，重启不丢进度。'
])}
${tbl(['指标（示例）', '含义', '告警规则（示例）'], [
  ['<code>deposit_head_lag_blocks</code>', '链头 − 游标', '&gt; 10 持续 2 分钟：P2；&gt; 50：P1'],
  ['<code>deposit_detect_latency_seconds</code>', '区块时间到 pending 的延迟', 'P95 &gt; 30 秒：P2'],
  ['<code>deposit_credit_latency_seconds</code>', '达标到 credited 的延迟', 'P95 &gt; 60 秒：P2'],
  ['<code>deposit_reorg_total</code>、<code>deposit_reorg_depth</code>', '重组次数与深度', '深度 ≥ 3：P2'],
  ['<code>deposit_reverted_total</code>', '入账后撤销', '&gt; 0：P1，立即电话通知'],
  ['<code>outbox_unsent</code>', '未投递消息数', '&gt; 1,000 或最老一条 &gt; 5 分钟：P2'],
  ['<code>webhook_failures_total</code>', '回调失败次数', '单商户 10 分钟失败率 &gt; 50%：P3，通知商户'],
  ['<code>address_pool_free</code>', '空闲地址数', '&lt; 1 万：P3，触发补充生成'],
  ['<code>rpc_errors_total{provider}</code>', 'RPC 错误', '5 分钟错误率 &gt; 5%：P2，自动切换'],
  ['<code>reconcile_diff_total</code>', '每日对账差异', '&gt; 0：P1']
])}

<h2>11. 安全清单与威胁模型</h2>
${tbl(['威胁', '攻击方式', '影响', '防护'], [
  ['假币充值', '部署名为 USDT 的合约，给充值地址转“假 USDT”', '凭空入账', '只认合约地址白名单；按 log.Address 识别，绝不按 symbol 或 name'],
  ['重组双花', '充值后用私链或深度重组抹掉交易', '入账后链上没钱', '金额分档确认；大额等 finalized；reverted 时冻结账户'],
  ['RPC 欺骗', '被入侵或出错的 RPC 返回伪造区块或日志', '错误入账', '多源区块哈希校验；自建节点做最终裁决'],
  ['失败交易', 'ETH 转账 status = 0，但交易 value 字段不为 0', '错误入账', '检查回执 status 和 blockHash'],
  ['地址投毒', '0 金额或微小金额转账，地址前后几位模仿用户常用地址', '用户误把钱转给攻击者', '0 金额忽略；min_deposit 过滤粉尘；前端完整展示地址'],
  ['回调伪造与重放', '冒充平台向商户发回调，或重发旧回调', '商户错误加款', 'HMAC 签名 + 时间戳 5 分钟窗口；商户按 deposit_id 去重'],
  ['重复入账', '重扫、重启、消息重复', '多加余额', '部分唯一索引 + ledger (deposit_id, kind) 唯一 + 消费方幂等'],
  ['内部人员篡改', '直接改数据库余额或状态', '资金损失', '账本只追加不删除；最小权限；审计日志；每日对账'],
  ['密钥泄露', 'RPC key、回调密钥、数据库密码泄露', '被冒充或数据被改', 'KMS 管理、轮换、只读副本给分析用'],
  ['内部转账漏识别', '合约钱包转入 ETH', '用户投诉、资金滞留', 'trace 识别 + 余额对账 + 人工补账流程']
])}
${call('risk', `<p><strong>最重要的三条</strong>：① 合约地址白名单；② 入账前确认数达标且回执 status = 1；③ 每一层都幂等。历史上多家交易所和支付服务因为“按代币名识别”“没检查交易状态”“重放回调”“小链确认数不足被 51% 攻击”等问题被盗或产生坏账（例如 2019 年 1 月 Coinbase 检测到 ETC 深度重组中的多笔双花，2018 年 Bitcoin Gold 攻击者在多家交易所双花）。${cite('Coinbase：Deep Chain Reorganization Detected on Ethereum Classic', 'https://medium.com/the-coinbase-blog/ethereum-classic-etc-is-currently-being-51-attacked-33be13ce32de')}${cite('BleepingComputer：Bitcoin Gold 双花攻击（2018-05）', 'https://www.bleepingcomputer.com/news/security/hacker-makes-over-18-million-in-double-spend-attack-on-bitcoin-gold-network/')}这些都是本清单直接防住的问题。</p>`)}

<h2>12. 里程碑计划（6 周）</h2>
${tbl(['周', '目标', '交付物'], [
  ['第 1 周', '环境与数据模型', 'Go 工程骨架、DDL 与迁移、地址池导入工具、配置加载、CI 流水线'],
  ['第 2 周', '扫块与解析', 'Scanner 顺序推进、ERC-20 与 ETH 识别、合约白名单、单元测试'],
  ['第 3 周', '重组与幂等', '找共同祖先、Rollback、部分唯一索引、假链重组测试、PostgreSQL 集成测试'],
  ['第 4 周', '确认、入账与通知', '金额分档确认、多源哈希校验、ledger、outbox、Kafka Relay、HTTP 回调与重试'],
  ['第 5 周', 'API、监控、对账', 'REST API、Prometheus 指标、Grafana 面板、告警规则、每日对账任务'],
  ['第 6 周', '压测、演练、上线', '压测报告、故障演练记录（kill -9、RPC 故障、Kafka 宕机、模拟重组）、Sepolia 端到端验收、上线手册']
])}
${mm('6 周交付的依赖关系', `
flowchart LR
  W1["第 1 周<br/>骨架与 DDL"] --> W2["第 2 周<br/>扫块与解析"]
  W2 --> W3["第 3 周<br/>重组与幂等"]
  W3 --> W4["第 4 周<br/>确认、入账、通知"]
  W1 --> W5["第 5 周<br/>API、监控、对账"]
  W4 --> W5
  W5 --> W6["第 6 周<br/>压测、演练、上线"]
`, [
  ['flow', '扫块 → 重组 → 入账是主线，必须串行完成；API 和监控可以从第 1 周起并行准备。'],
  ['key', '第 3 周的重组测试是质量关键点：没有它，后面所有入账逻辑都不可信。'],
  ['fail', '常见延期原因：低估了 ETH 内部转账识别和对账的工作量。提前和业务方确认范围。'],
  ['limit', '6 周只覆盖以太坊单链。多链按“链适配器”接口扩展，每条新链约 1–2 周。']
])}
<h3>扩展方向</h3>
${steps([
  '<strong>多链</strong>：抽象 ChainAdapter 接口（扫块、解析、最终性判断），接入 BTC（UTXO 模型）、Tron、Solana、L2（以 L1 批次最终性为准）；Tron 的账户与费用模型见 <a href="#m05-68">M04.25 Tron 与 TON</a>。',
  '<strong>归集</strong>：充值入账后，把地址里的钱汇总到热钱包；ERC-20 归集需要先给地址补 gas，或使用 EIP-7702 / 合约钱包方案。见 <a href="#m03-8">M07.9</a>。',
  '<strong>内部转账识别</strong>：接入 trace 节点，用 callTracer 识别合约内部转 ETH。',
  '<strong>风控</strong>：对接链上地址风险评分（制裁名单、混币器来源），高风险充值进入人工审核。',
  '<strong>储备金证明</strong>：用充值记录与地址余额生成默克尔求和树，见 <a href="#m01-2">M01.2</a> 和 <a href="#m04-8">M08.9</a>。'
])}
<h3>面试与作品集要点</h3>
${steps([
  '能画出架构图，并解释“区块 + 充值 + 游标同一事务”“入账 + 账本 + outbox 同一事务”的原因。',
  '能现场写出找共同祖先的回滚算法，并说出最大深度保护的意义。',
  '能解释为什么用部分唯一索引，而不是普通唯一键，以及 (tx_hash, log_index) 与 (block_hash, log_index) 的区别。',
  '能说出至少 5 条安全措施：合约白名单、回执 status、金额分档确认、多源校验、HMAC 回调。',
  '作品集：GitHub 仓库（含 README 架构图、docker-compose 一键启动 PostgreSQL + Kafka + anvil、重组测试、Grafana 截图）+ 一篇技术博客讲重组处理。'
])}
${tryit(`<ol>
<li>用 docker-compose 启动 PostgreSQL 16，执行第 6 节 DDL。<strong>预期</strong>：全部 CREATE 成功。</li>
<li>插入 3 个地址到 deposit_addresses，用第 6.1 节 SQL 为 user_id = 42 分配地址，执行两次。<strong>预期</strong>：两次返回同一个地址。</li>
<li>启动 anvil，部署一个测试 ERC-20，把 Scanner 的 RPC 指向 <code>http://127.0.0.1:8545</code>、Tokens 指向测试合约。给已分配地址转 100 个代币，连续出 12 个块（<code>cast rpc anvil_mine 12</code>）。<strong>预期</strong>：deposits 出现一条 credited 记录，outbox 出现一条 deposit.credited。</li>
<li>在<a href="#lab-reorg">重组实验</a>中，找出让“已入账后又被回滚”事故数保持为 0 的最小 N，并解释它与本项目 12 个确认的关系。</li>
</ol>`)}

${lab('reorg')}

${mistakes([
  ['用户转账交易一上链就可以入账。', '上链的块可能被重组。按链与金额等待确认数，大额等 finalized。'],
  ['识别 USDT 充值看代币名或 symbol 就行。', '任何人都能部署同名合约。只认合约地址白名单。'],
  ['入账成功后再发 Kafka 消息即可。', '两步之间崩溃会丢消息。用事务性发件箱：入账与消息在同一事务写入，再异步投递。'],
  ['Kafka 保证只投递一次，消费方不用去重。', '本架构是至少一次投递。消费方必须按 deposit_id + type 去重。'],
  ['重组时直接删除充值记录最干净。', '删除会丢审计线索，已入账的还需要冲正。用状态 orphaned / reverted + 冲正流水。']
])}
${recap([
  '目标：链上真到账的钱恰好入账一次；用具体数字定义延迟、吞吐、可用性和正确性验收标准。',
  '架构：地址池 + Scanner（顺序扫块、按 blockHash 拉日志、找共同祖先回滚）+ Confirmer（金额分档、多源校验）+ outbox 通知。',
  '数据：deposits 部分唯一索引防重复且允许重组后重新记录；ledger (deposit_id, kind) 唯一保证最多一次入账和一次冲正。',
  '识别规则：合约白名单、3 个 topic、金额大于 0、ETH 回执 status = 1；合约内部转 ETH 需要 trace 或对账兜底。',
  '工程：咨询锁单活、Docker distroless、密钥来自 KMS、Prometheus 指标与分级告警、每日对账。',
  '测试：假链模拟入账前与入账后重组，PostgreSQL 集成测试，anvil 快照回滚，模糊与故障注入。'
])}
${quiz([
  { q: 'Relay 把消息写入 Kafka 成功后、更新 sent_at 前进程崩溃。结果是什么？', o: ['消息丢失', '数据库损坏', '消息会被再发一次，消费方需要按 deposit_id 去重', 'Kafka 自动去重，不会重复'], a: 2, why: '事务回滚，sent_at 仍为空，下次 Relay 会重发。这是至少一次语义，所以消费方必须幂等。' },
  { q: '用户从某交易所提币，给充值地址转了 1 ETH，但服务没识别到。最可能的原因是什么？', o: ['这是合约内部调用转出的 ETH，交易的 to 不是充值地址', 'ETH 需要 64 个确认', '地址簿没刷新', 'RPC 节点限流'], a: 0, why: '很多交易所和合约钱包通过合约批量转账，ETH 来自内部调用。只扫描交易 to 字段识别不到，需要 trace 或余额对账兜底。' },
  { q: '某笔 USDT 充值已 credited，随后发生了比确认阈值更深的重组，交易消失。系统应该怎么做？', o: ['什么都不做', '删除充值记录和账本流水', '把游标拨回 0 重新扫描', '标记 reverted，写入负数冲正流水，发出 deposit.reverted 事件并触发冻结与告警'], a: 3, why: '账本只追加不删除。冲正流水保留审计线索，撤销事件通知账户服务和风控，同时 P1 告警进入事故流程。' }
])}
${exercises([["计算题（示例）：ETH 的确认规则是：金额 ≥ 0 要 12 个确认，金额 ≥ 5 ETH 要 64 个确认。一笔恰好 5 ETH 的充值需要几个确认？如果规则改成 20 个确认，用户大约多久到账？", "<p>RequiredConfirmations 用 <code>amount.Cmp(r.MinAmount) &gt;= 0</code> 判断，恰好 5 ETH 命中第二档，需要 64 个确认。20 个确认时，要等 19 个新块：19 × 12 = 228 秒。加上扫描轮询（≤ 3 秒）和 Relay 轮询（≤ 1 秒），约 232 秒，即 3 分 52 秒。</p>"], ["思考题：ConfirmUpTo 为什么把“改为 credited”“写账本流水”“写 outbox”放在同一个事务里？", "<p>三步分开执行时，中间崩溃会留下不一致的状态。例如已改为 credited 但没写流水，或者入账了却没有通知消息。同一事务保证三件事要么全成功，要么全不发生。ledger 的 (deposit_id, kind) 唯一约束再保证重复执行也只入账一次。</p>"], ["设计题：用本文的 fakeChain 写一个测试，验证“同一交易重组后进入新块，最终只入账一次”。写出步骤和断言。", "<p>步骤：mine(\"a\", false)，再 mine(\"a\", true) 放入充值；用 6 个确认的 Scanner 扫描，断言记录是 pending。然后 reorg(1)，mine(\"b\", true) 让同一 TxHash 进入新块，再 mine 足够多的块并扫描。断言：旧记录是 orphaned，新记录是 credited，账本只有一条 credit 流水。</p>"]])}
${checklist(["能读懂 Scanner.Step 的四步：检测重组、收集充值、落库、推进确认。", "能说出识别充值时要跳过的情况：非白名单合约、topic 数不为 3、0 金额、回执失败、回执来自别的分叉。", "能解释 Rollback 怎样把 pending 标为 orphaned、把 credited 标为 reverted，并写冲正流水和撤销事件。", "做过用假链或 anvil 快照模拟入账前与入账后的重组测试。", "能列出部署时的密钥管理、咨询锁单活、监控指标和分级告警。"])}
${terms([
  ['充值地址池', 'Deposit Address Pool', '预先派生、按需分配给用户的充值地址集合'],
  ['事务性发件箱', 'Transactional Outbox', '把待发消息与业务数据写在同一事务，再异步投递的模式'],
  ['冲正', 'Reversal', '用反向流水抵消错误入账，而不删除原记录'],
  ['部分唯一索引', 'Partial Unique Index', '只对满足条件的行生效的唯一约束'],
  ['咨询锁', 'Advisory Lock', 'PostgreSQL 提供的应用级锁，用于保证单实例运行'],
  ['至少一次投递', 'At-least-once Delivery', '消息保证送达但可能重复，需要消费方幂等'],
  ['归集', 'Sweeping', '把分散在充值地址里的资产汇总到热钱包的操作']
])}
` });
})();
