/* ---------- M09 子文章（四）：★ 实战 企业级多链托管钱包服务 ---------- */
(() => {
CUR = 'm03-9';
addCh({ id: 'm03-9', nav: '★ 实战·设计：托管钱包服务', title: 'M09.10 实战·设计：企业级多链托管钱包服务', desc: '项目目标、需求拆解、系统架构、技术选型、数据模型与接口设计', html: `
<h1>M09.10 实战·设计：企业级多链托管钱包服务</h1>
${meta(['按企业标准拆解一个多链托管钱包：地址、充值、归集、提币、签名、对账、运营后台。', '写出 PostgreSQL 表结构、gRPC/REST 接口、Go 核心实现（链适配器、扫描器、提币状态机、签名策略）。', '制定测试（含故障注入）、K8s 部署、监控告警、威胁模型与 6 周里程碑。'], '<a href="#m03-8">M09.9 企业钱包系统设计</a>、<a href="#m03-6">M09.6 Nonce 管理</a>、<a href="#m03-7">M09.7 Gas 策略</a>', ['nonce', 'hdpath'])}
${beginner(`<p><strong>托管钱包服务（Custodial Wallet Service）</strong>：替业务方保管链上资产、负责收款和付款的后台系统。业务方只调用接口，不接触私钥。</p>
<p><strong>链适配器（Chain Adapter）</strong>：把每条链的差异（地址格式、交易结构、费用模型）封装在统一接口后面的模块。</p>
<p><strong>重组（Reorg）</strong>：区块链短暂分叉后，节点切换到另一条更长或更重的链，原来看到的最新几个区块被替换。</p>
<p><strong>故障注入（Fault Injection）</strong>：在测试中故意制造故障（断网、超时、数据错误），验证系统能否正确处理。</p>
<p><strong>gRPC</strong>：Google 开源的远程调用框架，用 .proto 文件定义接口，自动生成多种语言的客户端和服务端代码。</p>`)}

<h2>1. 一句话理解</h2>
${one('本项目交付一个“链上资金后台”：业务方调一个接口拿到充值地址，充值到账自动通知；调一个接口发起提币，系统完成风控、审批、MPC/HSM 签名、nonce 与 Gas 管理、加速和对账。先把 ETH + ERC-20 做到生产级，再按接口扩展 BTC、Tron。')}
${call('analogy', `<p>把它想成一家“银行的清算后台”，业务方是前台柜员。柜员只说“给客户开户”“给客户付 500 元”，后台负责开户号、入账、押运现金、审批大额、盖章、出账、日终对账。柜员看不到金库钥匙。</p>
<p>类比的局限：银行出错可以冲正；链上付错款一般无法追回。所以本项目的每个设计都围绕一个原则：<strong>宁可慢、宁可拒绝，也不能付错、付重</strong>。</p>`)}
${art('一图看懂：业务方只发请求，私钥只留在签名域', 660, 366, [
  S.box(10, 110, 120, 70, { k: 'tint', icon: 'server', t: '业务后端', s: '没有私钥' }),
  S.zone(160, 20, 270, 232, { t: '钱包核心域 · 无私钥', k: 'info' }),
  S.box(176, 52, 238, 52, { k: 'info', mono: 1, t: 'withdraw-svc', s: '状态机 · 风控 · 审批' }),
  S.box(176, 124, 238, 52, { k: 'tint', mono: 1, t: 'wallet-api', s: '鉴权 · 幂等 · 限流' }),
  S.box(176, 190, 238, 52, { k: 'tint', mono: 1, t: 'deposit · sweeper · recon', s: '充值 · 归集 · 对账' }),
  S.zone(470, 20, 180, 232, { t: '签名域 · 私钥在此', k: 'warn' }),
  S.box(482, 60, 156, 64, { k: 'key', icon: 'shield', mono: 1, t: 'signer-gateway', s: '自己再校验一遍' }),
  S.box(482, 160, 156, 64, { k: 'warn', icon: 'key', t: 'MPC 节点', s: '分片 · 或 HSM' }),
  S.arrow(132, 150, 174, 150),
  S.arrow(416, 78, 480, 92, { k: 'warn', label: '审批凭证' }),
  S.arrow(560, 126, 560, 158, { k: 'warn' }),
  S.text(70, 206, '收到充值 / 提币\n事件通知', { size: 11, anchor: 'middle', dim: 1 }),
  S.arrow(295, 254, 295, 286),
  S.box(160, 288, 270, 44, { k: 'idle', dash: 1, icon: 'globe', t: '区块链（经 RPC 网关）', s: '' }),
  S.text(330, 356, '业务方只能发请求；签名域独立校验，宁可拒绝也不付错', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '业务后端只和 wallet-api 说话；提币请求经风控、审批后，才带着审批凭证去签名域。签好的交易回到核心域广播。'],
  ['key', '私钥只在签名域，那里没有公网出口。核心域被攻破，攻击者仍拿不到私钥。'],
  ['risk', '签名域不信任核心域给的描述，自己解码交易，核对收款地址、金额和审批凭证后才签名。'],
  ['limit', '图中省略了数据库、消息队列和运营后台，它们在下面的架构图和数据模型里补齐。']
], '业务后端调用钱包核心域，核心域没有私钥，提币要带审批凭证交给独立的签名域，签名域里有网关和 MPC 节点', 'm03-9')}

<h2>2. 项目目标与验收标准</h2>
${tbl(['类别', '验收标准（示例值）', '验证方法'], [
  ['功能：地址', '按 (业务方, 用户, 链) 分配唯一充值地址；服务器只持有 xpub', '集成测试 + 代码扫描无私钥'],
  ['功能：充值', 'ETH 与白名单 ERC-20 充值在 12 个确认后入账；重组自动回滚未确认记录', 'Sepolia 端到端 + Anvil 重组测试'],
  ['功能：归集', '余额价值 ≥ 20 × 归集成本时归集；ERC-20 自动补 Gas', '测试网批量充值后自动归集'],
  ['功能：提币', '风控 + 多级审批 + MPC/HSM 签名 + nonce 管理 + 自动加速；requestId 幂等', '并发重放测试零重复'],
  ['功能：对账', '每小时按固定高度做链上 / 钱包库 / 业务账本三方对账', '人为制造差异，10 分钟内告警'],
  ['吞吐', '提币峰值 20 笔/秒（多热钱包地址并行）；充值扫描跟上主网出块无积压', 'k6 压测 + 主网回放'],
  ['延迟', '已批准提币到广播 P99 &lt; 5 秒；确认后入账通知 P99 &lt; 30 秒', 'Prometheus 直方图'],
  ['可用性', 'API 99.9%；签名服务 99.5%；单节点故障不影响提币', '混沌测试：随机杀 Pod'],
  ['正确性', '重复打款 0；资金差异 0；nonce 冲突 0', '对账报告 + 故障注入'],
  ['安全', '私钥不出签名域；签名服务独立策略校验；所有资金操作可审计', '渗透测试 + 威胁模型评审']
])}

<h2>3. 需求拆解与用户故事</h2>
${steps([
  '作为<strong>业务方后端</strong>，我调用 CreateAddress 为用户获取 ETH 充值地址，同一用户重复调用返回同一地址。',
  '作为<strong>业务方后端</strong>，我订阅 deposit.confirmed 事件，收到后给用户加余额；若收到 deposit.reverted，扣回未达确认的记录。',
  '作为<strong>业务方后端</strong>，我用 requestId 调用 CreateWithdrawal；网络超时后重试同一 requestId，不会重复打款。',
  '作为<strong>风控专员</strong>，我在后台看到命中规则的提币，查看 KYT 评分、用户历史后批准或拒绝。',
  '作为<strong>财务</strong>，我每天查看三方对账报告和 Gas 成本报表；热钱包低于水位时发起补充申请。',
  '作为<strong>值班工程师</strong>，我在卡单、签名超时、对账差异时收到告警，并能在后台手动加速或取消某笔交易。',
  '作为<strong>安全负责人</strong>，我能导出任意时间段的审计日志，并验证日志未被篡改。',
  '作为<strong>架构师</strong>，我新增一条链（BTC 或 Tron）时，只需实现链适配器接口，不改动提币状态机。'
])}

<h2>4. 系统架构</h2>
${mm('托管钱包服务架构', `
flowchart TB
  APP["业务后端"]
  subgraph CORE["钱包核心域（K8s 命名空间 wallet）"]
    API["wallet-api<br/>gRPC · REST · 鉴权 · 幂等"]
    IN["充值链路<br/>address-svc 派生地址<br/>scanner 每链一个实例<br/>deposit-svc 确认 入账 回滚"]
    OUT["提币链路<br/>withdraw-svc 状态机 nonce gas<br/>risk-svc 规则 KYT 审批<br/>sweeper 归集 补 Gas"]
    OPS["运营与对账<br/>recon-svc 三方对账<br/>admin-api 运营后台"]
  end
  subgraph SIGND["签名域（独立集群，无公网）"]
    SGW["signer-gateway<br/>策略引擎 · 二次校验"]
    MPC["MPC 节点 A B 或 HSM"]
  end
  DATA[("PostgreSQL · Redis · Kafka")]
  RPC["RPC 网关<br/>多供应商"]
  APP --> API
  API --> IN
  API --> OUT
  OUT -->|"mTLS + 审批凭证"| SGW
  SGW --> MPC
  IN --> RPC
  OUT --> RPC
  OPS --> RPC
  CORE --> DATA
  DATA -->|"充值与提币事件"| APP
  class SGW,MPC risk
  class API key
`, [
  ['flow', '入口：业务方只访问 wallet-api。出口：只有 withdraw-svc 和 sweeper 能向签名域发请求，且必须带审批凭证。'],
  ['key', '签名域是独立集群和独立网络，只开放一个 gRPC 端口给核心域，没有公网出口，运维账号与核心域分离。'],
  ['fail', 'RPC 网关聚合多家节点供应商。单一供应商故障时自动切换；数据不一致时以多数结果为准。'],
  ['risk', 'wallet-api 被攻破时，攻击者只能提交提币请求，仍要经过风控和签名域独立策略校验。'],
  ['limit', '本项目只覆盖托管与资金流转，不包含业务方的用户账户体系与撮合（见 M10）。']
])}
${mm('关键调用链：一笔 ERC-20 提币', `
sequenceDiagram
  autonumber
  participant B as 业务后端
  participant A as wallet-api
  participant W as withdraw-svc
  participant R as risk-svc
  participant N as nonce 分配器
  participant S as signer-gateway
  participant M as MPC 节点
  participant C as RPC 网关
  B->>A: CreateWithdrawal requestId USDT 5000
  A->>A: 幂等检查 插入 withdrawal 状态 RECEIVED
  A-->>B: 返回 withdrawalId 状态 RECEIVED
  W->>R: 风控评估 白名单 限额 KYT
  R-->>W: 需要 1 级人工审批
  R->>R: 审批人批准 生成审批凭证
  W->>N: 分配 nonce 热钱包地址 2
  N-->>W: nonce 1873
  W->>W: 构造交易 估算 gas 选择 standard 档
  W->>S: SignRequest 交易 审批凭证
  S->>S: 解码交易 校验凭证 白名单 限额
  S->>M: 协同签名 digest
  M-->>S: 签名 r s v
  S-->>W: raw transaction
  W->>W: 落库 raw 和 tx_hash 状态 SIGNED
  W->>C: eth_sendRawTransaction
  W->>W: 状态 BROADCAST 发布事件
  C-->>W: 回执 status 1 达到确认数
  W-->>B: 事件 withdrawal.confirmed
`, [
  ['flow', 'API 只负责“接单”，立即返回。后续步骤由 withdraw-svc 异步推进，每一步都是数据库条件更新。'],
  ['key', '签名网关自己解码交易字节，核对 to、金额、代币合约与审批凭证中的内容一致，不信任 withdraw-svc 给的描述字段。'],
  ['fail', '第 14 步签名超时：状态停在 SIGNING，重试时用同一 nonce 和同一交易内容重新请求签名，不分配新 nonce。'],
  ['fail', '第 16 步广播失败：raw 已落库，重播同一笔，幂等安全。'],
  ['risk', '审批凭证必须绑定交易摘要（金额、地址、链、nonce 无关的业务 ID），防止一份凭证被用于其他交易。']
])}
${mm('提币状态机（上）：接单、风控、审批到签名', `
stateDiagram-v2
  state "已接收" as RECEIVED
  state "风控中" as RISK
  state "待审批" as PENDING_APPROVAL
  state "已批准" as APPROVED
  state "签名中" as SIGNING
  state "已签名" as SIGNED
  state "已拒绝" as REJECTED
  state "人工处理" as MANUAL
  [*] --> RECEIVED
  RECEIVED --> RISK
  RISK --> APPROVED: 自动通过
  RISK --> PENDING_APPROVAL: 命中审批规则
  RISK --> REJECTED: 命中拒绝规则
  PENDING_APPROVAL --> APPROVED: 审批完成
  PENDING_APPROVAL --> REJECTED: 审批拒绝
  APPROVED --> SIGNING: 分配 nonce
  SIGNING --> SIGNED: 签名成功 落库 raw
  SIGNING --> MANUAL: 签名多次超时
  REJECTED --> [*]
`, [
  ['flow', '正常路径：RECEIVED → RISK → APPROVED → SIGNING → SIGNED。风控可以直接通过，也可以转人工审批，或直接拒绝。'],
  ['key', '审批通过才会分配 nonce 并进入签名；被拒绝的提币是终态，不会占用 nonce。'],
  ['fail', '签名多次超时进入 MANUAL，由人工处理。下一张图从 SIGNED 继续。']
])}
${mm('提币状态机（下）：从签名到上链', `
stateDiagram-v2
  state "已签名" as SIGNED
  state "已广播" as BROADCAST
  state "已确认" as CONFIRMED
  state "链上失败" as FAILED
  state "人工处理" as MANUAL
  [*] --> SIGNED
  SIGNED --> BROADCAST: 广播
  BROADCAST --> BROADCAST: 加速替换 新 tx_hash
  BROADCAST --> CONFIRMED: 任一 tx_hash 达到确认数
  BROADCAST --> FAILED: 回执 status 0
  BROADCAST --> MANUAL: 达到加速上限
  FAILED --> MANUAL
  CONFIRMED --> [*]
`, [
  ['flow', '正常路径：SIGNED → BROADCAST → CONFIRMED。卡单时在 BROADCAST 内加速替换，同一 nonce 可以有多个 tx_hash。'],
  ['key', 'SIGNED 之后不允许回到 APPROVED 重新分配 nonce。只能重播、加速或在 MANUAL 中由人取消。'],
  ['fail', 'FAILED（status 0）时 Gas 已经扣除，nonce 已消耗。是否重试由人工判断，重试会创建新的链上交易。'],
  ['risk', 'MANUAL 状态的任何操作（取消、重试）都需要两人审批并写审计日志。']
])}

<h2>5. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['语言', 'Go 1.22+', 'Rust、Java', 'go-ethereum 原生库、并发模型简单、团队普及'],
  ['EVM 交互', 'go-ethereum ethclient', 'web3 网关 SDK', '类型完整，签名与 RLP 实现经过长期验证'],
  ['HD 派生', 'btcutil/hdkeychain + go-bip39', '自研', '成熟实现，避免自写密码学'],
  ['数据库', 'PostgreSQL 16', 'MySQL 8', '事务、行锁、部分索引、NUMERIC 精确金额'],
  ['锁与缓存', 'Redis 7', 'etcd', 'nonce 锁与费用缓存；正确性由数据库兜底'],
  ['消息队列', 'Kafka', 'NATS JetStream、RabbitMQ', '充值事件需要持久化、可重放、按分区有序'],
  ['签名', 'MPC（自建 2-of-3 或供应商）+ 云 HSM 备选', '纯 HSM、Safe', '多链通用、可重分片；HSM 满足部分合规场景'],
  ['RPC', '自建节点 + 2 家供应商，经网关聚合', '单一供应商', '避免单点，交叉校验数据'],
  ['接口', 'gRPC（内部）+ REST（运营后台）', '纯 REST', 'gRPC 强类型、性能好；REST 便于前端'],
  ['部署', 'Kubernetes + Argo CD', '虚拟机 + Ansible', '声明式部署、滚动升级、NetworkPolicy 隔离'],
  ['观测', 'Prometheus + Grafana + Loki + OpenTelemetry', 'Datadog', '开源、可私有化，指标与链路统一'],
  ['密钥配置', 'Vault / 云 KMS', '环境变量', '动态凭证、审计、轮换']
])}

<h2>6. 数据模型（PostgreSQL DDL）</h2>
${art('一图看懂：数据存在哪里，谁读谁写', 660, 342, [
  S.zone(226, 20, 252, 284, { t: 'PostgreSQL · 唯一真相', k: 'info' }),
  S.box(10, 44, 170, 48, { k: 'tint', mono: 1, t: 'scanner · deposit', s: '充值扫描与入账' }),
  S.box(10, 108, 170, 48, { k: 'warn', mono: 1, t: 'withdraw-svc', s: '提币状态机' }),
  S.box(10, 172, 170, 48, { k: 'tint', mono: 1, t: 'sweeper · recon', s: '归集与对账' }),
  S.box(242, 48, 220, 48, { k: 'info', mono: 1, t: 'deposit', s: 'deposit_address' }),
  S.box(242, 112, 220, 48, { k: 'key', mono: 1, t: 'withdrawal', s: 'chain_tx · approval' }),
  S.box(242, 176, 220, 48, { k: 'info', mono: 1, t: 'sweep_task', s: 'recon_report · hot_address' }),
  S.box(242, 240, 220, 48, { k: 'idle', mono: 1, t: 'audit_log', s: '只追加' }),
  S.arrow(182, 68, 240, 72, { both: 1 }),
  S.arrow(182, 132, 240, 136, { both: 1, k: 'warn' }),
  S.arrow(182, 196, 240, 200, { both: 1 }),
  S.box(510, 44, 140, 52, { k: 'ok', icon: 'mail', t: 'Kafka', s: '充值 / 提币事件' }),
  S.arrow(464, 72, 508, 70, { k: 'ok' }),
  S.box(510, 124, 140, 52, { k: 'tint', icon: 'server', t: '业务后端', s: '订阅事件' }),
  S.arrow(580, 98, 580, 122, { k: 'ok' }),
  S.box(510, 208, 140, 62, { k: 'idle', dash: 1, icon: 'cpu', t: 'Redis', s: '锁 · 费用缓存\n丢了不丢账' }),
  S.text(330, 328, 'PostgreSQL 记账本；Redis 只做加速，正确性由数据库兜底', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '各服务只和数据库读写，状态变化落库后再发 Kafka 事件，业务后端通过事件得知充值和提币结果。'],
  ['key', 'withdrawal 和 chain_tx 是提币的真相：状态推进靠数据库条件更新，防止并发重复。'],
  ['fail', 'Redis 挂了只会变慢，不会丢账；nonce 的正确性最终由数据库约束保证。'],
  ['limit', '这里只画主要的表，完整字段见下面的 DDL。']
], '三类服务读写 PostgreSQL 里的充值、提币、归集对账和审计表，事件通过 Kafka 通知业务后端，Redis 仅作锁与缓存', 'm03-9')}
${code('SQL', `
-- 金额统一用 NUMERIC(78,0) 存最小单位（wei / sat / sun），禁止浮点
CREATE TABLE asset (
  id            SERIAL PRIMARY KEY,
  chain         TEXT NOT NULL,                 -- eth / btc / tron
  symbol        TEXT NOT NULL,                 -- ETH / USDT
  contract      TEXT,                          -- 原生币为空
  decimals      INT  NOT NULL,
  confirmations INT  NOT NULL,                 -- 入账所需确认数
  min_deposit   NUMERIC(78,0) NOT NULL DEFAULT 0,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (chain, contract)
);

CREATE TABLE xpub_config (
  id         SERIAL PRIMARY KEY,
  chain      TEXT NOT NULL,
  path       TEXT NOT NULL,                    -- m/44'/60'/0'
  xpub_ref   TEXT NOT NULL,                    -- Vault 中的引用，不存明文
  next_index INT  NOT NULL DEFAULT 0
);

CREATE TABLE deposit_address (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  BIGINT NOT NULL,                  -- 业务方
  user_ref   TEXT   NOT NULL,                  -- 业务方用户 ID
  chain      TEXT   NOT NULL,
  xpub_id    INT    NOT NULL REFERENCES xpub_config(id),
  path_index INT    NOT NULL,
  address    TEXT   NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_ref, chain),
  UNIQUE (xpub_id, path_index),
  UNIQUE (chain, address)
);

CREATE TABLE deposit (
  id           BIGSERIAL PRIMARY KEY,
  chain        TEXT NOT NULL,
  asset_id     INT  NOT NULL REFERENCES asset(id),
  tx_hash      TEXT NOT NULL,
  log_index    INT  NOT NULL DEFAULT -1,       -- 原生币为 -1
  block_number BIGINT NOT NULL,
  block_hash   TEXT NOT NULL,
  to_address   TEXT NOT NULL,
  amount       NUMERIC(78,0) NOT NULL,
  status       TEXT NOT NULL,                  -- seen / confirmed / credited / reverted
  kyt_score    INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chain, tx_hash, log_index)           -- 防止重复入账
);

CREATE TABLE hot_address (
  chain      TEXT NOT NULL,
  address    TEXT NOT NULL,
  key_ref    TEXT NOT NULL,                    -- 签名域中的密钥 ID
  next_nonce BIGINT NOT NULL DEFAULT 0,
  lane       TEXT NOT NULL DEFAULT 'normal',
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (chain, address)
);

CREATE TABLE withdrawal (
  id           BIGSERIAL PRIMARY KEY,
  tenant_id    BIGINT NOT NULL,
  request_id   TEXT   NOT NULL,                -- 幂等键
  asset_id     INT    NOT NULL REFERENCES asset(id),
  to_address   TEXT   NOT NULL,
  amount       NUMERIC(78,0) NOT NULL,
  status       TEXT   NOT NULL,
  tier         TEXT   NOT NULL DEFAULT 'standard',
  from_address TEXT,
  nonce        BIGINT,
  risk_result  JSONB,
  version      INT    NOT NULL DEFAULT 0,      -- 乐观锁
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, request_id)
);

-- 一笔提币可能有多次链上尝试（加速、取消）
CREATE TABLE chain_tx (
  id            BIGSERIAL PRIMARY KEY,
  withdrawal_id BIGINT REFERENCES withdrawal(id),
  purpose       TEXT NOT NULL,                 -- withdraw / sweep / gas_topup / fill / cancel
  chain         TEXT NOT NULL,
  from_address  TEXT NOT NULL,
  nonce         BIGINT,
  tx_hash       TEXT NOT NULL UNIQUE,
  raw_tx        BYTEA NOT NULL,
  max_fee       NUMERIC(78,0),
  tip           NUMERIC(78,0),
  attempt       INT  NOT NULL,
  status        TEXT NOT NULL,                 -- signed / broadcast / mined / replaced / failed
  block_number  BIGINT,
  gas_used      BIGINT,
  fee_paid      NUMERIC(78,0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chain_tx_open ON chain_tx (chain, from_address, nonce) WHERE status IN ('signed','broadcast');

CREATE TABLE approval (
  id            BIGSERIAL PRIMARY KEY,
  withdrawal_id BIGINT NOT NULL REFERENCES withdrawal(id),
  level         INT    NOT NULL,
  approver      TEXT   NOT NULL,
  decision      TEXT   NOT NULL,               -- approve / reject
  signature     BYTEA  NOT NULL,               -- 审批人对提币摘要的 Ed25519 签名
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (withdrawal_id, level, approver)
);

CREATE TABLE sweep_task (
  id          BIGSERIAL PRIMARY KEY,
  address     TEXT NOT NULL,
  asset_id    INT  NOT NULL,
  amount      NUMERIC(78,0) NOT NULL,
  status      TEXT NOT NULL,                   -- planned / gas_sent / sweeping / done / skipped
  gas_tx_id   BIGINT, sweep_tx_id BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recon_report (
  id           BIGSERIAL PRIMARY KEY,
  chain        TEXT NOT NULL,
  asset_id     INT  NOT NULL,
  block_number BIGINT NOT NULL,
  onchain      NUMERIC(78,0) NOT NULL,
  wallet_db    NUMERIC(78,0) NOT NULL,
  biz_ledger   NUMERIC(78,0) NOT NULL,
  in_transit   NUMERIC(78,0) NOT NULL,
  diff         NUMERIC(78,0) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 审计日志：只追加，prev_hash 形成哈希链
CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  target     TEXT NOT NULL,
  payload    JSONB NOT NULL,
  prev_hash  BYTEA NOT NULL,
  hash       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE UPDATE, DELETE ON audit_log FROM wallet_app;
`)}
${call('info', `<p>表设计的三个关键约束：<code>deposit (chain, tx_hash, log_index)</code> 唯一防重复入账；<code>withdrawal (tenant_id, request_id)</code> 唯一实现幂等；<code>chain_tx</code> 记录同一 nonce 的所有尝试，任何一个上链都能匹配回原提币。</p>`)}

<h2>7. 接口设计</h2>
${code('PROTOBUF', `
syntax = "proto3";
package wallet.v1;

service WalletService {
  rpc CreateAddress(CreateAddressReq) returns (Address);          // 幂等：同一用户同一链返回同一地址
  rpc CreateWithdrawal(CreateWithdrawalReq) returns (Withdrawal); // 幂等：同一 request_id 返回同一记录
  rpc GetWithdrawal(GetWithdrawalReq) returns (Withdrawal);
  rpc ListDeposits(ListDepositsReq) returns (ListDepositsResp);
}

message CreateAddressReq { string user_ref = 1; string chain = 2; }
message Address { string chain = 1; string address = 2; string memo = 3; }

message CreateWithdrawalReq {
  string request_id = 1;   // 业务方生成的幂等键
  string chain      = 2;   // eth
  string asset      = 3;   // ETH / USDT
  string to_address = 4;
  string amount     = 5;   // 最小单位的十进制字符串，避免浮点
  string tier       = 6;   // slow / standard / fast
}
message Withdrawal {
  int64  id = 1; string request_id = 2; string status = 3;
  string tx_hash = 4; int64 confirmations = 5; string fee_paid = 6;
}
message GetWithdrawalReq { int64 id = 1; string request_id = 2; }
message ListDepositsReq { string user_ref = 1; string chain = 2; int64 since_id = 3; int32 limit = 4; }
message Deposit { int64 id = 1; string tx_hash = 2; string asset = 3; string amount = 4; string status = 5; int64 confirmations = 6; }
message ListDepositsResp { repeated Deposit items = 1; }

// 签名域对内唯一接口
service SignerService {
  rpc Sign(SignReq) returns (SignResp);
}
message SignReq {
  string key_ref        = 1;
  string chain          = 2;
  bytes  unsigned_tx    = 3;   // 未签名交易字节，签名域自行解码与校验
  string purpose        = 4;   // withdraw / sweep / gas_topup / fill / cancel
  int64  withdrawal_id  = 5;
  repeated bytes approvals = 6; // 审批凭证
}
message SignResp { bytes raw_tx = 1; string tx_hash = 2; }
`)}
${tbl(['REST（运营后台）', '方法', '说明', '权限'], [
  ['/admin/withdrawals?status=PENDING_APPROVAL', 'GET', '待审批列表，含 KYT 与用户历史', '风控专员'],
  ['/admin/withdrawals/{id}/approve', 'POST', '提交审批（客户端用审批人密钥签名摘要）', '风控专员，按级别'],
  ['/admin/withdrawals/{id}/speedup', 'POST', '手动加速，参数 maxFeeGwei', '值班工程师 + 第二人确认'],
  ['/admin/withdrawals/{id}/cancel', 'POST', '同 nonce 0 转账取消', '两人审批'],
  ['/admin/rebalance', 'POST', '冷热温调拨申请', '财务发起，多人审批'],
  ['/admin/recon/reports', 'GET', '三方对账报告', '财务、审计'],
  ['/admin/audit/export', 'GET', '导出审计日志与哈希链校验结果', '安全负责人']
])}
${tbl(['Kafka 主题', '生产者', '消息关键字段', '消费者'], [
  ['wallet.deposit.seen', 'scanner', 'chain, tx_hash, log_index, block_number, block_hash, to, amount', 'deposit-svc'],
  ['wallet.deposit.confirmed', 'deposit-svc', 'deposit_id, user_ref, asset, amount, confirmations', '业务后端'],
  ['wallet.deposit.reverted', 'deposit-svc', 'deposit_id, reason = reorg', '业务后端'],
  ['wallet.withdrawal.status', 'withdraw-svc', 'withdrawal_id, request_id, status, tx_hash', '业务后端、通知'],
  ['wallet.chain.reorg', 'scanner', 'chain, fork_height, old_hash, new_hash', 'deposit-svc、告警']
])}

${recap([
  '验收标准用数字写清：吞吐、延迟、可用性、零重复打款、零资金差异。',
  '架构核心：业务只接触 wallet-api；签名域独立集群、独立策略、独立审计。',
  '数据库三个关键唯一约束：充值 (chain, tx_hash, log_index)、提币 (tenant, request_id)、nonce 记录。',
  '链适配器接口让 BTC、Tron 扩展不影响状态机与签名域。'
])}
${quiz([
  { q: '为什么 deposit 表要对 (chain, tx_hash, log_index) 建唯一约束？', o: ['提高查询速度', '一笔交易可能含多个代币转账事件，同时防止扫描重放导致重复入账', '区块链要求', '节省存储'], a: 1, why: 'log_index 区分同一交易中的多个 Transfer 事件；唯一约束让扫描器重跑同一区块时不会重复入账。' },
  { q: '新增 Tron 支持时，按本项目设计需要修改哪些部分？', o: ['提币状态机和签名网关全部重写', '主要实现 Tron 链适配器并补充签名域对 Tron 交易的解码校验', '只修改数据库', '不需要任何修改'], a: 1, why: '链差异封装在适配器中；签名域需要能解码并校验 Tron 交易格式，状态机保持不变。' }
])}
${exercises([["提币状态机规定 SIGNED 之后不允许回到 APPROVED 重新分配 nonce。如果允许，会出现什么问题？", "<p>SIGNED 意味着已有一笔用某个 nonce 签好的 raw 交易，它随时可能被广播并上链。回到 APPROVED 重新分配 nonce，就会再签一笔内容相同、nonce 不同的交易，两笔都可能上链，造成重复打款。正确做法只有重播、加速，或在 MANUAL 中由两人审批后取消。</p>"], ["数据模型里有三个关键唯一约束。分别写出它们，并说出各自防止什么问题。", "<p><code>deposit (chain, tx_hash, log_index)</code>：一笔交易可含多个 Transfer 事件，扫描器重跑同一区块时不会重复入账。<code>withdrawal (tenant_id, request_id)</code>：业务方超时重试同一 request_id 时，只产生一笔提币。<code>chain_tx</code> 记录同一 nonce 的所有尝试，<code>tx_hash</code> 唯一，任何一笔上链都能匹配回原提币。</p>"], ["设计一个新链（例如 Tron）的接入方案：哪些部分要新写，哪些部分不应改动？", "<p>新写 Tron 链适配器：地址派生与校验、扫描区块、构造交易（ref_block 与 expiration）、组装签名、广播、回执和余额查询。签名域要补充对 Tron 交易的解码和校验。提币状态机、wallet-api 接口、审批流不应改动。这是“链差异封装在适配器中”的设计目标。</p>"]])}
${checklist(["能用数字写出托管钱包服务的验收标准：吞吐、延迟、可用性、零重复打款、零资金差异。", "能画出核心域与签名域的架构，说明哪些服务能向签名域发请求、要带什么凭证。", "能复述一笔 ERC-20 提币的完整调用链，并指出签名超时和广播失败时的恢复方式。", "能写出 deposit、withdrawal、chain_tx、approval、audit_log 五张表的关键字段和约束。", "能设计 CreateWithdrawal 接口，用最小单位十进制字符串表示金额，用 request_id 实现幂等。"])}
${call('info', '<p>设计到此完成。下一篇 <a href="#m03-50">M09.11 实战·实现</a> 讲核心代码、测试策略、部署运维、安全清单与里程碑。</p>', '下一篇')}
` });

CUR = 'm03-50';
addCh({ id: 'm03-50', nav: '★ 实战·实现：托管钱包服务', title: 'M09.11 实战·实现：企业级多链托管钱包服务', desc: '核心代码、测试策略、部署运维、安全清单、里程碑与扩展方向', html: `
<h1>M09.11 实战·实现：企业级多链托管钱包服务</h1>
${meta(['按上篇的设计，读懂并能复现本项目的核心代码。', '为项目制定测试策略：单元、集成、模糊与故障注入。', '完成部署、监控与安全清单，并按里程碑交付。'], '前置：<a href="#m03-9">M09.10 实战·设计</a>')}
${call('info', '<p>本篇是项目的下篇。架构图、数据模型和接口定义都在<a href="#m03-9">上篇</a>，读代码时可以对照着看。</p>')}
${art('一图看懂：代码以 chain.Adapter 接口为中心，新增链只写适配器', 660, 372, [
  S.box(10, 52, 190, 56, { k: 'info', mono: 1, t: 'Scanner.step', s: '8.2 充值扫描 · 重组回滚' }),
  S.box(235, 52, 190, 56, { k: 'info', mono: 1, t: 'Worker.signAndSend', s: '8.3 状态推进 · Repo.transit' }),
  S.zone(450, 22, 210, 108, { t: '签名域 · 独立进程', k: 'warn' }),
  S.box(460, 52, 190, 56, { k: 'warn', mono: 1, t: 'Gateway.Sign', s: '8.4 策略引擎 · 二次校验' }),
  S.arrow(427, 80, 458, 80, { k: 'warn' }),
  S.box(130, 170, 400, 72, { k: 'key', mono: 1, t: 'chain.Adapter 接口', s: 'BuildTransfer · Assemble · Broadcast · ScanBlock …\nRegister / Get 注册表' }),
  S.arrow(105, 110, 190, 168), S.arrow(330, 110, 330, 168),
  S.box(130, 286, 190, 56, { k: 'ok', mono: 1, t: 'evm.Adapter', s: 'ETH + ERC-20 · 已实现' }),
  S.box(340, 286, 190, 56, { k: 'idle', dash: 1, mono: 1, t: 'btc / tron', s: '第 6 周后再写' }),
  S.arrow(225, 244, 225, 284, { k: 'ok' }),
  S.arrow(435, 244, 435, 284, { k: 'idle', dash: 1 }),
  S.text(330, 362, '新增一条链：只实现 Adapter 并 Register，状态机与签名域不用改', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '扫描器和提币 Worker 都只调用 chain.Adapter，不关心具体是哪条链；Worker 把待签名交易交给签名域。'],
  ['key', '链差异（地址、交易结构、费用）全部藏在 Adapter 后面，EVM 先做，BTC 与 Tron 只留接口。'],
  ['risk', 'Gateway.Sign 在独立进程里，自己解码交易再校验，不信任 Worker 给的描述。'],
  ['limit', '图中只列了本节的核心函数；数据库表和接口定义在上篇 M09.10。']
], '代码结构图：扫描器和提币 Worker 依赖 chain.Adapter 接口，evm 适配器已实现，btc 和 tron 预留，签名网关在独立的签名域', 'm03-50')}

<h2>8. 核心代码</h2>
<h3>8.1 链适配器：EVM 先行，BTC/Tron 预留</h3>
${code('GO', `
package chain

import (
    "context"
    "math/big"
)

// UnsignedTx 是链无关的“待签名交易”。Digest 交给签名域，Payload 用于签名后组装。
type UnsignedTx struct {
    Chain   string
    Digest  [][]byte // EVM 1 个；BTC 每个输入 1 个
    Payload []byte   // 链相关的序列化数据
    Nonce   *uint64  // EVM / 有 nonce 的链
}

type Transfer struct {
    From, To     string
    Asset        Asset    // 含合约地址与精度
    Amount       *big.Int // 最小单位
    Nonce        *uint64
    FeeTier      string
}

type Adapter interface {
    Name() string
    DeriveAddress(xpub string, index uint32) (string, error)
    ValidateAddress(addr string) error
    LatestHeight(ctx context.Context) (uint64, error)
    ScanBlock(ctx context.Context, height uint64, watch AddressSet) (*BlockResult, error)
    BuildTransfer(ctx context.Context, t Transfer) (*UnsignedTx, error)
    Assemble(u *UnsignedTx, sigs [][]byte) (raw []byte, txHash string, err error)
    Broadcast(ctx context.Context, raw []byte) error
    Receipt(ctx context.Context, txHash string) (*Receipt, error)
    Balance(ctx context.Context, addr string, asset Asset, height uint64) (*big.Int, error)
}

// 注册表：新增链只需实现 Adapter 并注册
var registry = map[string]Adapter{}

func Register(a Adapter) { registry[a.Name()] = a }
func Get(name string) Adapter { return registry[name] }

// BTC：UTXO 选币 + 找零 + PSBT，BuildTransfer 内部完成选币；Nonce 为 nil。
// Tron：交易含 ref_block 与 expiration，费用为带宽和能量；Nonce 为 nil。
// 这两条链在第 6 周之后实现，状态机与签名域无需修改。
`)}
${code('GO', `
package evm

// BuildTransfer：ETH 或 ERC-20 转账，返回待签名摘要
func (a *Adapter) BuildTransfer(ctx context.Context, t chain.Transfer) (*chain.UnsignedTx, error) {
    to := common.HexToAddress(t.To)
    var (
        txTo  = to
        value = t.Amount
        data  []byte
    )
    if t.Asset.Contract != "" { // ERC-20：to 改成代币合约，金额编码进 data
        txTo = common.HexToAddress(t.Asset.Contract)
        value = big.NewInt(0)
        var err error
        data, err = erc20ABI.Pack("transfer", to, t.Amount)
        if err != nil {
            return nil, err
        }
    }
    fee := a.fees.Get(t.FeeTier) // 来自 M09.7 的费用估算器缓存
    gas := uint64(21000)
    if len(data) > 0 {
        est, err := a.rpc.EstimateGas(ctx, ethereum.CallMsg{
            From: common.HexToAddress(t.From), To: &txTo, Value: value, Data: data,
        })
        if err != nil {
            return nil, fmt.Errorf("估算失败，交易会回滚: %w", err) // 不发送
        }
        gas = min(est*13/10, t.Asset.GasCap) // 缓冲 30%，并受代币配置上限约束
    }
    tx := types.NewTx(&types.DynamicFeeTx{
        ChainID: a.chainID, Nonce: *t.Nonce,
        GasTipCap: fee.Tip, GasFeeCap: fee.MaxFee, Gas: gas,
        To: &txTo, Value: value, Data: data,
    })
    payload, _ := tx.MarshalBinary() // 未签名交易字节
    digest := a.signer.Hash(tx)
    return &chain.UnsignedTx{Chain: "eth", Digest: [][]byte{digest.Bytes()}, Payload: payload, Nonce: t.Nonce}, nil
}

// Assemble：把 65 字节签名装回交易，并验证能恢复出 from
func (a *Adapter) Assemble(u *chain.UnsignedTx, sigs [][]byte) ([]byte, string, error) {
    var tx types.Transaction
    if err := tx.UnmarshalBinary(u.Payload); err != nil {
        return nil, "", err
    }
    signed, err := tx.WithSignature(a.signer, sigs[0])
    if err != nil {
        return nil, "", err
    }
    if _, err := types.Sender(a.signer, signed); err != nil {
        return nil, "", fmt.Errorf("签名无法恢复发送方: %w", err)
    }
    raw, _ := signed.MarshalBinary()
    return raw, signed.Hash().Hex(), nil
}
`)}

<h3>8.2 充值扫描与重组处理</h3>
${code('GO', `
// Scanner：逐块推进，校验父哈希发现重组；ERC-20 通过 Transfer 事件识别
var transferTopic = crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))

func (s *Scanner) step(ctx context.Context) error {
    cur := s.cursor.Load(ctx, s.chain) // 已处理到的高度与区块哈希
    head, err := s.rpc.BlockNumber(ctx)
    if err != nil || cur.Height >= head {
        return err
    }
    h := cur.Height + 1
    blk, err := s.rpc.BlockByNumber(ctx, new(big.Int).SetUint64(h))
    if err != nil {
        return err
    }
    if blk.ParentHash() != cur.Hash { // 父哈希对不上：发生重组
        return s.rollback(ctx, cur.Height)
    }
    var found []Deposit
    // 原生 ETH：遍历交易，to 属于监听集合（合约内部转账需 trace 接口，另行处理）
    for _, tx := range blk.Transactions() {
        if tx.To() != nil && s.watch.Has(*tx.To()) && tx.Value().Sign() > 0 {
            found = append(found, Deposit{TxHash: tx.Hash(), LogIndex: -1, To: *tx.To(), Amount: tx.Value()})
        }
    }
    // ERC-20：只查白名单代币合约的 Transfer 事件
    logs, err := s.rpc.FilterLogs(ctx, ethereum.FilterQuery{
        BlockHash: ptr(blk.Hash()), Addresses: s.tokenContracts, Topics: [][]common.Hash{{transferTopic}},
    })
    if err != nil {
        return err
    }
    for _, lg := range logs {
        to := common.BytesToAddress(lg.Topics[2].Bytes())
        if s.watch.Has(to) {
            found = append(found, Deposit{TxHash: lg.TxHash, LogIndex: int(lg.Index), To: to,
                Token: lg.Address, Amount: new(big.Int).SetBytes(lg.Data)})
        }
    }
    // 同一事务：写入充值（唯一键去重）+ 推进游标；然后发 Kafka（outbox 模式保证不丢）
    return s.store.SaveBlock(ctx, s.chain, h, blk.Hash(), found)
}

// rollback：回退游标一层并把该高度上未入账的充值标记为 reverted
func (s *Scanner) rollback(ctx context.Context, height uint64) error {
    n, credited, err := s.store.RevertHeight(ctx, s.chain, height)
    if err != nil {
        return err
    }
    if credited > 0 { // 已入账的充值被重组：确认数配置不足，必须人工介入
        s.alert.Critical("reorg reverted credited deposits", height, credited)
    }
    s.metrics.Reorgs.Inc()
    log.Printf("重组：回退高度 %d，撤销 %d 条充值", height, n)
    return nil // 下一轮从 height-1 重新校验，逐层回退直到找到共同祖先
}
`)}

<h3>8.3 提币状态推进（条件更新防并发）</h3>
${code('GO', `
// transit：只有当前状态匹配才推进，返回 false 表示被其他 worker 抢先
func (r *Repo) transit(ctx context.Context, id int64, from, to string, set map[string]any) (bool, error) {
    q := "UPDATE withdrawal SET status = $1, version = version + 1, updated_at = now()"
    args := []any{to}
    for k, v := range set { // k 来自代码常量，不来自用户输入
        args = append(args, v)
        q += fmt.Sprintf(", %s = $%d", k, len(args))
    }
    args = append(args, id, from)
    q += fmt.Sprintf(" WHERE id = $%d AND status = $%d", len(args)-1, len(args))
    tag, err := r.db.Exec(ctx, q, args...)
    return tag.RowsAffected() == 1, err
}

func (w *Worker) signAndSend(ctx context.Context, wd *Withdrawal) error {
    // 1. APPROVED → SIGNING：分配 nonce（M09.6 的分配器），写回提币记录
    if wd.Status == "APPROVED" {
        from := w.pickHotAddress(wd)             // 按 lane 与余额选地址
        nonce, err := w.nonces.Allocate(ctx, "eth", from, wd.ID)
        if err != nil {
            return err
        }
        ok, err := w.repo.transit(ctx, wd.ID, "APPROVED", "SIGNING",
            map[string]any{"from_address": from, "nonce": nonce})
        if err != nil || !ok {
            return err // 被抢先或失败：nonce 由空洞检测器回收填补
        }
        wd.FromAddress, wd.Nonce, wd.Status = from, &nonce, "SIGNING"
    }
    // 2. SIGNING：构造 → 请求签名（超时可重试，nonce 与内容不变）
    utx, err := w.adapter.BuildTransfer(ctx, wd.ToTransfer())
    if err != nil {
        return w.toManual(ctx, wd, err)
    }
    sctx, cancel := context.WithTimeout(ctx, 15*time.Second)
    defer cancel()
    resp, err := w.signer.Sign(sctx, &signerpb.SignReq{
        KeyRef: w.keyRef(wd.FromAddress), Chain: "eth", UnsignedTx: utx.Payload,
        Purpose: "withdraw", WithdrawalId: wd.ID, Approvals: w.repo.Approvals(ctx, wd.ID),
    })
    if err != nil {
        w.metrics.SignErrors.Inc()
        return err // 保持 SIGNING，由重试调度器指数退避，超过 5 次转 MANUAL
    }
    // 3. 先落库 raw，再广播
    if err := w.repo.SaveSigned(ctx, wd.ID, resp.RawTx, resp.TxHash); err != nil {
        return err
    }
    if err := w.adapter.Broadcast(ctx, resp.RawTx); err != nil {
        w.log.Warn("广播失败，稍后重播", "tx", resp.TxHash, "err", err)
        return nil // 状态 SIGNED，重播任务会处理
    }
    _, err = w.repo.transit(ctx, wd.ID, "SIGNED", "BROADCAST", nil)
    return err
}
`)}

<h3>8.4 签名域策略引擎</h3>
${code('GO', `
// signer-gateway：不信任调用方，自己解码交易并逐项校验
func (g *Gateway) Sign(ctx context.Context, req *signerpb.SignReq) (*signerpb.SignResp, error) {
    var tx types.Transaction
    if err := tx.UnmarshalBinary(req.UnsignedTx); err != nil {
        return nil, status.Error(codes.InvalidArgument, "无法解码交易")
    }
    if tx.ChainId().Cmp(g.chainID) != 0 {
        return nil, status.Error(codes.PermissionDenied, "chainId 不匹配")
    }
    dest, amount, token, err := decodeTransfer(&tx) // 识别 ETH 或 ERC-20 transfer，其余 data 一律拒绝
    if err != nil {
        return nil, status.Error(codes.PermissionDenied, err.Error())
    }
    switch req.Purpose {
    case "withdraw":
        wd, err := g.ledger.LoadApproved(ctx, req.WithdrawalId) // 签名域自己的只读副本
        if err != nil || !wd.Matches(dest, token, amount) {
            return nil, status.Error(codes.PermissionDenied, "交易与已批准提币不一致")
        }
        if err := g.verifyApprovals(wd, req.Approvals); err != nil { // 校验审批人 Ed25519 签名与级别
            return nil, status.Error(codes.PermissionDenied, err.Error())
        }
        if err := g.limits.Consume(ctx, token, amount); err != nil { // 签名域独立的小时 / 日限额
            return nil, status.Error(codes.ResourceExhausted, err.Error())
        }
    case "sweep", "rebalance_out":
        if !g.policy.IsInternalHot(dest) { // 归集和上调只能去固定地址
            return nil, status.Error(codes.PermissionDenied, "目标不是内部热 / 温钱包")
        }
    case "fill", "cancel":
        if dest != g.addrOf(req.KeyRef) || amount.Sign() != 0 { // 只能 0 转给自己
            return nil, status.Error(codes.PermissionDenied, "填洞或取消必须是 0 转账给自己")
        }
    default:
        return nil, status.Error(codes.PermissionDenied, "未知用途")
    }
    if !g.signLog.ReserveOnce(ctx, req.KeyRef, tx.Nonce(), tx.Hash()) { // 同 nonce 只允许费用更高的替换
        return nil, status.Error(codes.AlreadyExists, "该 nonce 已有不兼容的签名")
    }
    signer := types.LatestSignerForChainID(g.chainID)
    sig, err := g.mpc.Sign(ctx, req.KeyRef, signer.Hash(&tx).Bytes()) // MPC 或 HSM，返回 r||s||v
    if err != nil {
        return nil, status.Error(codes.Unavailable, "签名后端超时")
    }
    signed, err := tx.WithSignature(signer, sig)
    if err != nil {
        return nil, err
    }
    raw, _ := signed.MarshalBinary()
    g.audit.Append(ctx, "sign", req.KeyRef, map[string]any{"purpose": req.Purpose, "tx": signed.Hash().Hex(), "to": dest.Hex(), "amount": amount.String()})
    return &signerpb.SignResp{RawTx: raw, TxHash: signed.Hash().Hex()}, nil
}
`)}

<h3>8.5 加速、归集、对账（要点）</h3>
<ul>
<li><strong>加速任务</strong>：每个区块扫描 <code>chain_tx</code> 中 status = broadcast 的最早 nonce，按 M09.7 状态机判定卡单，费用 ×1.2 且 ≥ 1.5 × 当前 base，生成新 chain_tx（attempt + 1）后签名广播；最多 5 次，超过转 MANUAL。</li>
<li><strong>回执匹配</strong>：对同一 (from, nonce) 的所有 tx_hash 查询回执；任意一个 mined 即把其余标记 replaced，并按实际上链的那笔更新提币（金额为 0 的取消交易上链时，提币状态回到人工处理）。</li>
<li><strong>归集任务</strong>：每 10 分钟汇总已入账的充值地址余额，计算 价值 ÷ 成本 ≥ 20 的地址；ERC-20 先建 gas_topup 交易，确认后再建 sweep 交易；Gas 价格高于配置上限时跳过本轮。</li>
<li><strong>对账任务</strong>：每小时取 <code>safe</code> 高度（最新 − 确认数），查询全部托管地址余额（用 Multicall3 合约批量查 ERC-20 余额），与钱包库、业务账本比对，写入 <code>recon_report</code>；差异 &gt; 阈值时告警并打开“提币熔断”开关。</li>
</ul>
<p>回顾这两个实验有助于理解实现：nonce 实验对应 8.3 与加速任务；HD 路径实验对应地址服务（只持 xpub）。</p>
${lab('nonce')}

<h2>9. 测试策略</h2>
${tbl(['层级', '工具', '用例（节选）', '通过标准'], [
  ['单元', 'go test、testify', '金额精度转换；ERC-20 data 编码；签名策略各分支；状态机非法跳转被拒', '覆盖率 ≥ 80%，策略引擎 100% 分支'],
  ['集成', 'testcontainers（PostgreSQL、Redis、Kafka）+ Anvil 本地链', '充值 → 确认 → 入账；提币全流程；并发 100 个同 requestId 只产生 1 笔', '全部通过，无重复记录'],
  ['模糊', 'Go fuzzing（go test -fuzz）', 'decodeTransfer 输入任意字节；地址校验；金额字符串解析', '无 panic，非法输入全部拒绝'],
  ['属性', 'rapid 等属性测试库', '任意操作序列后：已分配 nonce 连续、无重复；钱包库余额 = 入账 − 出账 − 手续费', '不变量始终成立'],
  ['压测', 'k6、ghz（gRPC）', '提币 20 笔/秒持续 30 分钟；充值扫描回放 1 万个区块', 'P99 达标，无积压'],
  ['端到端', 'Sepolia 测试网', '真实充值 ETH / 测试 USDC，归集，提币，加速，取消', '链上结果与数据库一致，对账差异 0'],
  ['故障注入', 'Toxiproxy、Chaos Mesh、Anvil 快照', '见下表', '无重复打款、无资金差异、告警按时触发']
])}
${tbl(['故障注入场景', '注入方法', '预期行为'], [
  ['RPC 超时 / 返回 5xx', 'Toxiproxy 给主 RPC 加 10 秒延迟或断开', 'RPC 网关切换备用供应商；扫描器暂停不跳块；提币广播重试'],
  ['RPC 返回错误数据', '代理篡改 eth_getBlockByNumber 返回的 baseFee', '费用估算器交叉校验发现异常，使用上次值并告警'],
  ['签名超时', 'MPC 节点 B 网络隔离 60 秒', '提币停在 SIGNING，指数退避重试；恢复后用同一 nonce 签名成功；超过 5 次转 MANUAL'],
  ['签名后、广播前崩溃', '在 SaveSigned 之后 kill -9 进程', '重启后重播同一 raw，不产生新签名'],
  ['链重组', 'Anvil：evm_snapshot → 挖 3 块含充值 → evm_revert → 挖 4 块不含充值', '扫描器检测父哈希不符，回退并发出 deposit.reverted，未达确认的充值不入账'],
  ['nonce 空洞', '直接把 hot_address.next_nonce 加 1', '空洞检测器 60 秒内发出填洞交易，后续提币恢复'],
  ['Gas 暴涨', 'Anvil 设置极高 baseFee（anvil_setNextBlockBaseFeePerGas）', '加速达到封顶后转人工，告警触发'],
  ['数据库主从切换', 'Chaos Mesh 杀主库 Pod', '短暂报错后恢复；无状态重复推进']
])}

<h2>10. 部署与运维</h2>
${mm('部署拓扑与网络隔离', `
flowchart LR
  subgraph PUB["公网边界"]
    WAF["WAF 与 API 网关<br/>业务方 mTLS"]
  end
  subgraph K1["集群 1 钱包核心 VPC A"]
    NS1["命名空间 wallet<br/>api scanner withdraw sweeper recon"]
    NS2["命名空间 admin<br/>运营后台 仅 VPN"]
    DB1[("PostgreSQL 主从")]
  end
  subgraph K2["集群 2 签名域 VPC B 无公网出口"]
    SG["signer-gateway"]
    MA["MPC 节点 A<br/>TEE"]
  end
  subgraph DC["自建机房"]
    MB["MPC 节点 B<br/>HSM 封装分片"]
  end
  subgraph NODE["节点层"]
    N1["自建节点"]
    N2["供应商 1"]
    N3["供应商 2"]
  end
  WAF --> NS1
  NS1 -->|"仅 gRPC 9443 mTLS"| SG
  SG --> MA
  MA <-->|"专线"| MB
  NS1 --> N1
  NS1 --> N2
  NS1 --> N3
  NS1 --> DB1
`, [
  ['flow', '业务流量经 WAF 进入核心集群；核心集群只能通过一个端口访问签名域；签名域不访问公网。'],
  ['key', '两个集群使用不同云账号、不同运维人员。攻破核心集群的运维权限，拿不到签名域的任何权限。'],
  ['fail', '专线中断会让 2-of-2 签名停止。可配置第三个分片（审批人手机或备用机房）形成 2-of-3。'],
  ['risk', '运营后台只能通过 VPN + 硬件密钥（FIDO2）登录，后台账号是社工攻击的首要目标。']
])}
${steps([
  '<strong>环境</strong>：dev（Anvil）→ staging（Sepolia，真实 MPC 测试分片）→ prod（主网）。三套环境密钥完全独立。',
  '<strong>CI/CD</strong>：GitHub Actions 运行单元、集成、模糊测试（每次 PR 限时 2 分钟）→ 构建镜像并签名（cosign）→ Argo CD 同步。签名域镜像需要安全负责人审批才能发布。',
  '<strong>配置</strong>：链参数、确认数、费用档位、限额放在 Git 管理的配置仓库；限额和白名单类配置变更需两人 Review，并同步写审计日志。',
  '<strong>密钥</strong>：数据库凭证、mTLS 证书由 Vault 动态签发并自动轮换；MPC 分片与 HSM 凭证不进入 K8s Secret。',
  '<strong>发布策略</strong>：withdraw-svc 滚动升级前先“排空”：停止领取新任务，等待进行中的签名完成。'
])}
${tbl(['指标（示例名）', '含义', '告警阈值（示例）', '级别'], [
  ['wallet_hot_balance_usd{chain,address}', '热钱包余额', '低于目标 50% 或高于 150%', 'P2'],
  ['wallet_withdrawal_pending{status}', '各状态待处理提币数', 'PENDING_APPROVAL > 50 或 SIGNING > 10 持续 5 分钟', 'P2'],
  ['wallet_withdrawal_oldest_age_seconds{status}', '最老待处理提币年龄', 'BROADCAST 状态 > 15 分钟', 'P1'],
  ['wallet_nonce_gap', 'latest 到本地最大 nonce 之间的空洞数', '> 0 持续 2 分钟', 'P1'],
  ['wallet_tx_stuck_total', '卡单判定次数', '1 小时 > 20', 'P2'],
  ['wallet_scanner_lag_blocks{chain}', '扫描落后区块数', '> 20', 'P1'],
  ['wallet_reorg_depth{chain}', '重组深度', '≥ 3；任何已入账记录被回滚为 P0', 'P1 / P0'],
  ['wallet_recon_diff_ratio{chain,asset}', '对账差异比例', '> 0.01% 自动熔断提币', 'P0'],
  ['wallet_signer_latency_seconds', '签名耗时直方图', 'P99 > 10 秒', 'P2'],
  ['wallet_signer_denied_total{reason}', '签名域拒绝次数', '任何“与已批准提币不一致”', 'P0（可能入侵）']
])}

<h2>11. 安全清单与威胁模型</h2>
${tbl(['威胁', '攻击路径', '影响', '缓解措施'], [
  ['外部伪造提币', '盗用业务方 API 凭证提交提币', '资金被提走', 'mTLS + 请求签名；业务方级限额；新地址冷却期；KYT'],
  ['核心域被入侵', '利用依赖漏洞拿到 withdraw-svc 权限，伪造“已批准”', '资金被提走', '签名域独立读取审批记录并校验审批人签名；签名域独立限额'],
  ['内部人员作恶', '运营人员修改白名单或限额', '资金被提走', '配置变更两人审批；审计日志哈希链；职责分离'],
  ['签名域被入侵', '攻破 MPC 节点 A', '若只拿到 1 个分片则无法签名', '分片在不同信任域；定期密钥刷新；节点 TEE 与远程证明'],
  ['供应链攻击', '恶意依赖或镜像', '后门签名', '依赖锁定与审计；镜像签名验证；签名域最小依赖'],
  ['RPC 数据欺骗', '恶意节点返回伪造充值', '虚假入账', '多节点交叉验证；按区块哈希读取；大额充值二次确认'],
  ['重组 / 双花', '低确认数充值后重组', '入账后资金消失', '按资产设置确认数；重组监控；已入账回滚告警 P0'],
  ['地址投毒', '运营复制了相似地址', '资金转错', '只从白名单选择；地址全文比对；相似度规则'],
  ['重复打款', '重试逻辑重新签名', '多付', '幂等键；先落库后广播；同 nonce 签名记录'],
  ['DoS', '大量小额提币耗尽 Gas 与 nonce', '服务不可用', '最小提币额；按业务方限流；手续费覆盖成本']
])}
${call('warn', `<p><strong>最重要的一条</strong>：签名域必须假设核心域已经被攻破。它只相信三样东西：自己解码出的交易字节、自己读取的审批记录（含审批人密码学签名）、自己维护的限额计数器。</p>`)}

<h2>12. 里程碑计划（6 周）</h2>
${tbl(['周', '目标', '交付物', '验收'], [
  ['第 1 周', '骨架与数据模型', '仓库结构、DDL 与迁移、链适配器接口、EVM 适配器（构造、组装、广播）、Anvil 集成测试环境', '本地脚本完成一笔 ETH 转账并落库'],
  ['第 2 周', '地址与充值', 'address-svc（xpub 派生）、scanner（含重组回退）、deposit-svc、Kafka 事件与 outbox', 'Sepolia 充值 ETH 和 ERC-20 正确入账；Anvil 重组测试通过'],
  ['第 3 周', '提币主流程', 'wallet-api 幂等、提币状态机、nonce 分配器、费用估算器、本地软件签名器（仅 dev）', '并发 100 次同 requestId 只产生 1 笔；Sepolia 提币成功'],
  ['第 4 周', '签名域与风控', 'signer-gateway 策略引擎、MPC/HSM 对接、risk-svc 规则、审批流与审批凭证', '伪造请求被签名域拒绝；人工审批全流程打通'],
  ['第 5 周', '运维闭环', '加速与取消、空洞检测、归集与补 Gas、三方对账、运营后台 API、审计日志哈希链', '故障注入清单全部通过'],
  ['第 6 周', '上线准备', 'K8s 部署与 NetworkPolicy、监控告警面板、压测报告、威胁模型评审、运行手册', '压测达标；演练“签名节点宕机”和“对账差异”应急流程']
])}

<h2>13. 扩展方向与面试 / 作品集要点</h2>
<ul>
<li><strong>扩展 BTC</strong>：实现 UTXO 选币（分支定界算法）、PSBT、RBF 加速；地址用 BIP-84 xpub 派生（基础见 <a href="#m05-60">M05.4 比特币 UTXO 与脚本</a>、<a href="#m05-61">M05.5 SegWit·Taproot·PSBT</a>，可先在 <a href="#lab-utxo">UTXO 选币实验</a> 里试）。</li>
<li><strong>扩展 Tron</strong>：TRC-20 转账、能量与带宽管理（质押 TRX 或租赁能量），ref_block 与 expiration 处理。</li>
<li><strong>L2 支持</strong>：OP Stack 与 Arbitrum 的费用估算器（含 L1 数据费），提款跨链桥状态跟踪。</li>
<li><strong>账户抽象</strong>：用 ERC-4337 或 EIP-7702 实现批量提币与 Gas 代付（见 <a href="#m06-5">M09.8</a>）。</li>
<li><strong>储备金证明</strong>：基于对账数据生成默克尔树负债证明（见 <a href="#m04-8">M10.9</a>）。</li>
</ul>
<p><strong>下一步：毕业项目</strong>。把钱包、合约、前后端和运维串成一个完整作品，见 <a href="#m12">M14 综合毕业项目</a>。</p>
${tbl(['面试常问', '回答要点'], [
  ['如何保证不重复打款？', '幂等键唯一约束；状态机条件更新；先落库 raw 再广播；同 nonce 签名记录；替换后监听所有 tx_hash'],
  ['nonce 卡住怎么办？', '区分低费用、空洞、被丢弃；加速 / 取消 / 填洞 / 重播；多地址并行降低影响'],
  ['如何处理重组？', '父哈希校验、回退游标、未达确认的充值撤销、确认数按资产配置、已入账回滚 P0 告警'],
  ['签名服务如何防止被滥用？', '网络隔离、mTLS、独立解码交易、独立审批校验与限额、用途白名单、审计'],
  ['MPC 和多签怎么选？', '高频多链用 MPC；低频大额透明用多签；比较单点、链上可见性、更换成本、实现风险']
])}
<p>作品集建议：公开仓库包含架构图、DDL、核心代码、故障注入测试录屏和 Sepolia 上的真实交易哈希；README 写清“威胁模型”和“我做了哪些取舍”。</p>

${tryit(`<p>最小可运行练习（1 天）：① 启动 <code>anvil</code>（Foundry 自带本地链），它会打印 10 个测试账户。② 用 M09.2 的代码从 Anvil 默认助记词（<code>test test test test test test test test test test test junk</code>）派生 m/44′/60′/0′/0/0，确认地址等于 Anvil 打印的第一个账户 <code>0xf39F…2266</code>。③ 用本文 DDL 建表，写一个只含 RECEIVED → APPROVED → SIGNED → BROADCAST → CONFIRMED 的简化 worker，用本地私钥签名，完成一笔提币并在 <code>chain_tx</code> 中看到 raw_tx 与 tx_hash。④ 执行 <code>cast rpc evm_snapshot</code>、发一笔充值、<code>cast rpc evm_revert</code>，验证你的扫描器能发现重组。</p>`)}

${mistakes([
  ['先把多链都接上，再补安全', '先把一条链做到生产级（幂等、签名域、对账、故障注入），再按适配器接口扩展。安全设计无法事后补齐。'],
  ['签名服务只要放在内网就安全', '内网不等于可信。签名域必须独立解码交易、独立校验审批与限额，并假设调用方已被攻破。'],
  ['测试网跑通就能上线', '还要压测、故障注入、重组测试、威胁模型评审和应急演练。主网的拥堵和重组形态与测试网不同。'],
  ['对账每天做一次就够了', '自动提币系统应每小时甚至更频繁对账，差异超过阈值立即熔断，限制损失窗口。']
])}
${recap([
  '验收标准用数字写清：吞吐、延迟、可用性、零重复打款、零资金差异。',
  '架构核心：业务只接触 wallet-api；签名域独立集群、独立策略、独立审计。',
  '数据库三个关键唯一约束：充值 (chain, tx_hash, log_index)、提币 (tenant, request_id)、nonce 记录。',
  '链适配器接口让 BTC、Tron 扩展不影响状态机与签名域。',
  '测试必须包含故障注入：RPC 失败、签名超时、崩溃重启、重组、空洞、Gas 暴涨。',
  '6 周节奏：骨架 → 充值 → 提币 → 签名风控 → 运维闭环 → 上线准备。'
])}
${quiz([
  { q: '签名网关收到一个提币签名请求，交易解码后的收款地址与已批准提币记录中的地址不同。它应该怎么做？', o: ['按交易签名，因为调用方已经通过风控', '拒绝签名，并触发高优先级告警', '修改交易中的地址后签名', '先签名，事后人工复核'], a: 1, why: '签名域假设调用方可能被攻破。交易内容与审批记录不一致是入侵信号，必须拒绝并告警。' },
  { q: '提币服务在保存 raw 交易之后、广播之前崩溃。重启后正确做法是？', o: ['重新分配 nonce 并签一笔新交易', '用已保存的 raw 交易重新广播', '把提币标记为失败', '通知用户重新提交'], a: 1, why: '同一笔已签名交易可以安全地重复广播，链上最多执行一次，不会重复打款。' },
  { q: '用 Anvil 的 evm_snapshot / evm_revert 主要用来测试什么？', o: ['签名超时', '链重组时扫描器的回退逻辑', 'Gas 估算精度', '数据库主从切换'], a: 1, why: '回滚快照再挖出不同的区块，相同高度出现不同区块哈希，模拟了重组。' }
])}
${exercises([["签名网关“必须假设核心域已经被攻破”。它只相信哪三样东西？各自对应代码里的哪类检查？", "<p>第一，自己解码出的交易字节：校验 chainId，识别 ETH 或 ERC-20 transfer，其余 data 一律拒绝。第二，自己读取的审批记录：比对收款地址、代币和金额，并校验审批人的 Ed25519 签名与级别。第三，自己维护的限额计数器：签名域独立的小时和日限额。此外，同一 nonce 只允许费用更高的兼容替换。</p>"], ["设计一个故障注入用例，验证扫描器能正确处理链重组。写出注入方法和预期行为。", "<p>注入方法：在 Anvil 上执行 <code>evm_snapshot</code>，挖 3 个含充值的区块，再执行 <code>evm_revert</code>，挖 4 个不含充值的区块。预期行为：扫描器发现新区块的父哈希与游标记录不符，逐层回退游标。未达确认的充值标记为 reverted，并发出 <code>deposit.reverted</code>。若有已入账记录被回滚，触发 P0 告警。</p>"], ["（示例）对账任务取 safe 高度 = 最新高度 − 确认数。最新高度是 21,000,000，确认数 12。对账应使用哪个高度？为什么不用最新高度？", "<p>safe 高度 = 21,000,000 − 12 = <strong>20,999,988</strong>。最新的几个区块可能因重组被替换，用它们对账会产生假差异。三方都按同一固定高度取数，避免时间差误报。差异超过阈值时告警并打开提币熔断开关。</p>"]])}
${checklist(["能读懂链适配器接口，说明 BTC 和 Tron 的 Nonce 为什么为 nil。", "能解释扫描器如何用父哈希发现重组，以及已入账充值被回滚时为什么要人工介入。", "能说明 transit 函数的条件更新如何防止两个 worker 重复推进同一笔提币。", "能列出至少 5 个故障注入场景及预期行为，例如签名后广播前崩溃、nonce 空洞、Gas 暴涨。", "做过最小练习：用 Anvil 默认助记词派生出第一个账户地址，并跑通一笔简化提币。"])}
${terms([
  ['托管钱包服务', 'Custodial Wallet Service', '替业务方保管链上资产并处理收付款的后台系统'],
  ['链适配器', 'Chain Adapter', '封装单条链交易构造、签名组装、广播与扫描的模块'],
  ['签名域', 'Signing Domain', '与核心业务隔离、持有或协调密钥并独立校验策略的环境'],
  ['审批凭证', 'Approval Attestation', '审批人用自己的密钥对提币摘要的签名，供签名域验证'],
  ['Outbox 模式', 'Transactional Outbox', '把事件与业务数据写在同一数据库事务中，再异步发送到消息队列'],
  ['提币熔断', 'Withdrawal Circuit Breaker', '检测到异常时自动暂停所有自动提币的开关'],
  ['故障注入', 'Fault Injection', '在测试中主动制造故障以验证系统容错能力']
])}
` });
})();
