/* ---------- M04 子文章（四）实战 ---------- */
(() => {
CUR = 'm05-10';
addCh({ id: 'm05-10', nav: '实战·设计：RPC 网关', title: 'M04.8 实战·设计：高可用 RPC 网关与节点监控', desc: '项目目标、需求拆解、系统架构、技术选型、数据模型与接口设计', html: `
<h1>M04.8 实战·设计：高可用 RPC 网关与节点监控</h1>
${meta(['设计一个多上游（自建节点 + 2 家服务商）的以太坊 JSON-RPC 网关，并写出验收标准。', '用 Go 实现健康检查、方法级路由、粘滞会话、重试与熔断、分级缓存、限流与计量。', '为网关和节点设计 Prometheus 指标、Grafana 面板、告警规则、压测与部署方案。'], '<a href="#m05-6">M04.6 节点运维与 RPC</a>、<a href="#m05-2">M04.2 以太坊架构</a>、<a href="#m01">M01 区块链基础</a>')}
${beginner(`<p><strong>JSON-RPC</strong>：应用和节点“对话”的格式。应用发一个 JSON，例如 <code>{"method":"eth_blockNumber"}</code>，节点回一个 JSON 结果。</p>
<p><strong>上游（Upstream）</strong>：网关背后真正回答问题的节点。可以是你自己跑的 Geth，也可以是 Alchemy、Infura、QuickNode 这类服务商。</p>
<p><strong>网关（Gateway）</strong>：站在应用和上游之间的一层程序。应用只认识网关，网关决定把请求转给哪个上游。</p>
<p><strong>熔断（Circuit Breaker）</strong>：上游连续出错时，网关暂时不再把请求发给它，过一会再试探。像家里的空气开关。</p>
<p><strong>重组（Reorg）</strong>：链头附近的几个区块被另一组区块替换。刚查到的“最新区块”可能过几秒就变了。</p>
<p><strong>P99 延迟</strong>：把所有请求按耗时排序，第 99% 位置的耗时。它衡量“最慢的那批用户”的体验。</p>`)}

<h2>1. 一句话理解</h2>
${one('RPC 网关把多个不可靠的节点组合成一个可靠的服务：它挑选健康的上游、缓存不会变的数据、拦住滥用的流量，并且让你随时看见每个节点的状态。')}
${call('analogy', `<p>网关像一家医院的分诊台。病人（请求）进门后，分诊台看病情（方法类型）分到不同科室（上游）。某个医生请假（节点宕机），分诊台把病人转到别的医生。常见问题（历史区块）直接给打印好的说明书（缓存），不必排队。</p>
<p>类比的局限：医生之间会交接病历，而不同上游之间没有共享状态。你刚在 A 节点发出的交易，B 节点可能还没看到。这正是“粘滞会话”要解决的问题。</p>`)}
${art('一图看懂：RPC 网关像分诊台，应用只认识它，它决定这次问哪个上游', 660, 372, [
  S.zone(150, 24, 290, 276, { t: 'rpcgw 网关' }),
  S.box(10, 119, 120, 90, { k: 'tint', t: '应用', s: '钱包后端\nDApp 前端\n充值监听' }),
  S.box(170, 56, 210, 60, { k: 'tint', icon: 'lock', t: '鉴权 + 限流', s: '无效 Key 或超额\n直接拒绝' }),
  S.box(170, 140, 210, 60, { k: 'info', icon: 'db', t: '缓存', s: '命中：直接返回\n不打扰上游' }),
  S.box(170, 224, 210, 60, { k: 'key', icon: 'bolt', t: '路由 + 熔断', s: '挑健康的上游\n出错换下一个' }),
  S.box(490, 56, 160, 60, { k: 'ok', t: '自建节点', s: 'Geth + Lighthouse', tag: '首选' }),
  S.box(490, 140, 160, 60, { k: 'ok', t: '服务商 A', s: '备用' }),
  S.box(490, 224, 160, 60, { k: 'risk', dash: 1, t: '服务商 B', s: '连续出错：已熔断' }),
  S.box(150, 322, 500, 36, { k: 'info', dash: 1, t: '健康检查器：每 2 秒探测各上游，更新“健康表”' }),
  S.route([[132, 164], [146, 164], [146, 86], [168, 86]], { k: 'plain' }),
  S.arrow(275, 118, 275, 138), S.arrow(275, 202, 275, 222),
  S.arrow(382, 236, 488, 92), S.arrow(382, 254, 488, 170), S.arrow(382, 254, 488, 254),
  S.arrow(275, 322, 275, 286, { k: 'info', dash: 1 }), S.arrow(570, 322, 570, 286, { k: 'info', dash: 1 })
], [
  ['flow', '请求先过鉴权限流，再查缓存；没命中才由路由器在健康的上游里挑一个，失败时换下一个重试。'],
  ['key', '应用只认识网关。上游宕机、换服务商，应用不需要改任何配置。'],
  ['risk', '被熔断的上游暂时不接请求；三个上游全断时，网关选落后最少的那个继续服务，并发出告警。'],
  ['limit', '健康检查器独立运行，转发路径只读它写好的“健康表”，所以不增加延迟。网关自己也要部署多个实例，否则它就是单点。']
], '应用的请求进入 rpcgw 网关，依次经过鉴权限流、缓存、路由熔断，再转发给自建节点或服务商；健康检查器持续探测上游', 'm05-10')}

<h2>2. 项目目标与验收标准</h2>
<p>本项目交付一个生产可用的 RPC 网关 <code>rpcgw</code>，以及配套的节点监控。下面的数字都是<strong>示例</strong>，你可以按业务调整。</p>
${tbl(['类别', '验收标准（示例）', '怎么验证'], [
  ['功能', '支持 HTTP JSON-RPC（含批量请求）与 WebSocket 订阅转发', '集成测试：单请求、批量 100 条、eth_subscribe newHeads'],
  ['功能', '3 个上游：自建 Geth+Lighthouse、服务商 A、服务商 B', '配置文件加载，/admin/upstreams 显示 3 个上游'],
  ['可用性', '任一上游宕机，对外可用性 ≥ 99.95%（月）', '故障注入：kill 自建节点，错误率不超过 0.05%'],
  ['延迟', '缓存命中 P99 ≤ 5 ms；未命中 P99 ≤ 上游 P99 + 10 ms', 'k6 压测报告'],
  ['吞吐', '单实例 ≥ 3,000 RPS（读请求，50% 缓存命中）', 'k6 恒定到达率压测 10 分钟'],
  ['正确性', '不返回落后链头超过 3 个区块的 latest 数据', '一致性测试：对比 3 个上游的 eth_blockNumber'],
  ['安全', '管理方法（admin_*、debug_*、personal_*）一律拒绝；API Key 鉴权；按 Key 限流', '安全测试用例清单（第 9 节）'],
  ['成本', '服务商请求量比直连减少 ≥ 40%（缓存 + 自建优先）', 'Grafana“上游请求量”面板对比']
])}

<h2>3. 需求拆解与用户故事</h2>
${steps([
  '作为<strong>钱包后端</strong>，我发送 <code>eth_sendRawTransaction</code> 后，紧接着查 <code>eth_getTransactionReceipt</code>，我希望两次请求落在同一个上游，避免“交易消失”。',
  '作为<strong>充值监听服务</strong>（见 <a href="#m01">M01</a>），我按区块号批量拉日志，我希望历史区块走缓存，速度快而且不消耗服务商额度。',
  '作为<strong>前端 DApp</strong>，我高频调用 <code>eth_blockNumber</code> 和 <code>eth_call</code>，我希望 P99 稳定在 100 ms 内。',
  '作为<strong>运维 SRE</strong>，我希望自建节点同步落后、磁盘快满、对等节点过少时收到告警，并且能在 Grafana 上看到每个上游的错误率和延迟。',
  '作为<strong>平台管理员</strong>，我给每个内部团队发 API Key，按 Key 限流并按月统计用量，用于成本分摊。',
  '作为<strong>安全负责人</strong>，我要求任何外部请求都不能调用 <code>admin_addPeer</code>、<code>debug_traceTransaction</code> 等危险或昂贵方法，除非 Key 有明确授权。'
])}
${call('info', `<p>需求里最容易漏掉的是<strong>写请求的语义</strong>。读请求失败可以换个上游再试；写请求（发交易）重试时必须保证“同一笔交易发多次不会造成多次扣款”。以太坊交易由 nonce 保证幂等：同一笔已签名交易（同哈希）重复广播，最多被打包一次。但网关仍要正确处理“已知交易”类错误，不能把它当失败报给用户。</p>`)}

<h2>4. 系统架构、调用链与状态机</h2>
<p>先看一个请求在网关内部怎么走。</p>
${mm('rpcgw 请求路径：从应用到上游', `
flowchart LR
  C["钱包后端 / DApp 前端 / 充值监听"] --> LB["L4 负载均衡<br/>K8s Service / 云 LB"]
  subgraph GWIN["rpcgw 实例（至少 2 个，跨可用区）"]
    AUTH["鉴权 + 限流<br/>API Key"] --> PARSE["解析 + 方法白名单"]
    PARSE --> CACHE{"缓存命中？"}
    CACHE -->|"未命中"| ROUTE["路由器<br/>读写分离 · 方法级 · 粘滞"]
    ROUTE --> CB["熔断 + 重试"]
  end
  LB --> AUTH
  CACHE -->|"命中"| RESP["返回"]
  CB --> U1["自建节点<br/>Geth + Lighthouse"]
  CB --> U2["服务商 A"]
  CB --> U3["服务商 B"]
`, [
  ['flow', '请求依次经过鉴权限流、解析白名单、缓存、路由、熔断重试，最后到达上游。命中缓存的请求直接返回，不会碰上游。'],
  ['limit', '网关不能让一个落后的上游变快。它只能少用这个上游。三个上游同时落后时（例如全网最终性延迟），网关也无能为力。'],
  ['risk', '网关本身成为单点：至少部署 2 个实例跨可用区，配置和密钥不能写进镜像。']
])}

<p>再看网关旁边的共享存储、监控和健康检查。</p>
${mm('rpcgw 周边：共享存储、健康检查与监控', `
flowchart LR
  GW["rpcgw 实例"] --> R[("Redis<br/>共享缓存 · 限流计数 · 粘滞表")]
  GW --> PG[("PostgreSQL<br/>API Key · 用量")]
  GW --> PM["Prometheus"]
  NE["node_exporter + Geth metrics"] --> PM
  PM --> GF["Grafana + Alertmanager"]
  HC["健康检查器<br/>每 2 秒探测"] --> UP["三个上游"]
  HC -->|"更新健康表"| GW
`, [
  ['flow', '热数据（缓存、限流计数、粘滞表）放 Redis，冷数据（API Key、用量）放 PostgreSQL；指标由 Prometheus 采集，Grafana 展示，Alertmanager 告警。'],
  ['key', '健康检查和请求转发分离：转发路径只读“当前健康表”，不做同步探测，所以不增加延迟。'],
  ['fail', '如果 Redis 不可用，网关退化为本地内存缓存和本地限流，粘滞会话失效但服务不中断。']
])}

<p>下面是一次“发交易后查回执”的关键调用链。注意网关如何用粘滞会话保证两次请求落在同一个上游。</p>
${mm('关键调用链：发交易 + 查回执', `
sequenceDiagram
  participant W as 钱包后端
  participant G as rpcgw
  participant R as Redis
  participant A as 服务商 A
  participant S as 自建节点
  W->>G: eth_sendRawTransaction（Key=wallet）
  G->>G: 鉴权 限流 方法属于写类
  G->>S: 转发到写优先上游
  S-->>G: 返回 txHash
  G->>R: 记录 粘滞 key=txHash 到 自建节点 TTL 120 秒
  G->>A: 异步再广播一次（提高传播）
  G-->>W: txHash
  W->>G: eth_getTransactionReceipt(txHash)
  G->>R: 查粘滞表
  R-->>G: 自建节点
  G->>S: 转发
  S-->>G: null（尚未打包）
  G-->>W: null 不缓存
`, [
  ['flow', '写请求先发到“写优先”上游（自建节点，交易不经第三方），成功后再异步广播到服务商，提高被打包的速度。'],
  ['key', '粘滞表以交易哈希为键。之后同一哈希的回执查询都路由到同一个上游。'],
  ['fail', '异步再广播可能返回「already known」或「nonce too low」。这两类错误说明交易已在池中或已打包，网关只记录指标，不报错。'],
  ['risk', '如果把交易发给不可信上游，对方能看到交易内容并抢跑（见 <a href="#m05-7">M04.7 MEV</a>）。对 MEV 敏感的交易应走私有交易池上游。']
])}

<p>每个上游都有一个熔断器。熔断器的状态机如下：</p>
${mm('上游熔断器状态机', `
stateDiagram-v2
  state "闭合：正常转发" as Closed
  state "断开：拒绝转发" as Open
  state "半开：放行少量试探" as HalfOpen
  [*] --> Closed
  Closed --> Open: 窗口内错误率超过 50% 且请求数至少 20
  Closed --> Open: 健康检查判定落后超过 5 个区块
  Open --> HalfOpen: 冷却 30 秒后
  HalfOpen --> Closed: 连续 5 次试探成功
  HalfOpen --> Open: 任一试探失败
`, [
  ['flow', '闭合态正常转发；错误率或落后超过阈值就断开；冷却后半开，只放行少量请求试探。'],
  ['key', '“最少请求数”防止低流量时 1 次失败就熔断（1/1 = 100% 错误率）。'],
  ['fail', '冷却时间太短会反复抖动（flapping）；太长会浪费一个已经恢复的上游。用指标 rpcgw_breaker_transitions_total 观察抖动。'],
  ['limit', '三个上游都断开时，网关要有兜底策略：选落后最少的那个继续服务，并发出 P1 告警，而不是全部拒绝。']
])}

<h2>5. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['网关语言', 'Go 1.22+', 'Rust、Node.js', '标准库 net/http 足够快；goroutine 适合大量并发 I/O；团队已在 M01 用 Go'],
  ['反向代理', '自写 JSON-RPC 转发（解析 method）', 'httputil.ReverseProxy、Nginx', 'ReverseProxy 不理解 JSON-RPC 方法，无法做方法级路由和缓存'],
  ['限流', 'golang.org/x/time/rate（本地）+ Redis 计数（全局）', 'Envoy 限流服务', '令牌桶简单可靠；Redis 保证多实例共享配额'],
  ['缓存', '本地 LRU（hashicorp/golang-lru/v2）+ Redis', '只用 Redis', '本地缓存命中只需微秒；Redis 让多实例共享'],
  ['指标', 'prometheus/client_golang', 'OpenTelemetry', '生态成熟，Grafana 原生支持；后续可加 OTel 追踪'],
  ['存储', 'PostgreSQL', 'MySQL', 'API Key 和用量数据量小，需要事务和聚合查询'],
  ['自建节点', 'Geth + Lighthouse（快照同步）', 'Nethermind + Teku、Reth', '资料最多；客户端多样性要求下可换成少数派组合（见 <a href="#m05-2">M04.2</a>）'],
  ['服务商', '两家不同公司', '只用一家', '避免单一服务商故障或封禁导致全挂'],
  ['压测', 'k6', 'vegeta、wrk', '脚本可读，支持恒定到达率和阈值断言'],
  ['部署', 'Kubernetes + Helm', 'Docker Compose + systemd', '多副本、滚动升级、HPA；小团队可先用 Compose']
])}

<h2>6. 数据模型</h2>
<p>网关的热数据（缓存、限流计数、粘滞表）放 Redis；冷数据（API Key、套餐、每日用量）放 PostgreSQL。</p>
${code('SQL', `
-- API Key 表：只存哈希，不存明文
CREATE TABLE api_keys (
  id            BIGSERIAL PRIMARY KEY,
  key_prefix    VARCHAR(12)  NOT NULL,            -- 例如 rk_live_ab12，便于排查
  key_hash      CHAR(64)     NOT NULL UNIQUE,     -- SHA-256(明文 Key)
  team          VARCHAR(64)  NOT NULL,
  plan          VARCHAR(32)  NOT NULL DEFAULT 'standard',
  rps_limit     INT          NOT NULL DEFAULT 50,  -- 每秒请求上限
  daily_quota   BIGINT       NOT NULL DEFAULT 5000000, -- 每日计算单位上限
  allow_methods TEXT[]       NOT NULL DEFAULT '{}',    -- 额外授权的方法，如 debug_traceTransaction
  allow_write   BOOLEAN      NOT NULL DEFAULT FALSE,   -- 是否允许 eth_sendRawTransaction
  status        VARCHAR(16)  NOT NULL DEFAULT 'active', -- active / disabled
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ
);

-- 方法权重：不同方法消耗不同“计算单位”（CU）
CREATE TABLE method_weights (
  method   VARCHAR(64) PRIMARY KEY,
  cu       INT NOT NULL            -- 例如 eth_blockNumber=1, eth_call=5, eth_getLogs=20
);

-- 每日用量：网关每分钟把 Redis 计数刷到这里（UPSERT）
CREATE TABLE usage_daily (
  key_id     BIGINT      NOT NULL REFERENCES api_keys(id),
  day        DATE        NOT NULL,
  method     VARCHAR(64) NOT NULL,
  requests   BIGINT      NOT NULL DEFAULT 0,
  cu         BIGINT      NOT NULL DEFAULT 0,
  errors     BIGINT      NOT NULL DEFAULT 0,
  cache_hits BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (key_id, day, method)
);

-- 上游事件：熔断、恢复、手工摘除，用于事故复盘
CREATE TABLE upstream_events (
  id         BIGSERIAL PRIMARY KEY,
  upstream   VARCHAR(32) NOT NULL,
  event      VARCHAR(32) NOT NULL,   -- open / half_open / closed / drain
  reason     TEXT,
  head_lag   INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_upstream_events_time ON upstream_events (created_at DESC);
`)}
${tbl(['Redis 键', '内容', 'TTL（示例）'], [
  ['<code>c:{chain}:{hash(method+params)}</code>', '缓存的响应 JSON', '不可变数据 24 小时；latest 类 1–2 秒'],
  ['<code>rl:{keyId}:{unixSec}</code>', '该 Key 本秒请求数（INCR）', '2 秒'],
  ['<code>q:{keyId}:{yyyymmdd}</code>', '该 Key 当日 CU 累计（INCRBY）', '48 小时'],
  ['<code>st:tx:{txHash}</code> / <code>st:addr:{from}</code>', '粘滞的上游名', '120 秒']
])}

<h2>7. 接口设计</h2>
${tbl(['接口', '方法', '说明'], [
  ['<code>/v1/{chain}</code>', 'POST', 'JSON-RPC 入口，支持单个与批量。Key 放在请求头 <code>X-Api-Key</code>，不要放 URL（会进日志）'],
  ['<code>/v1/{chain}/ws</code>', 'GET → WebSocket', '订阅转发：eth_subscribe newHeads / logs'],
  ['<code>/healthz</code>', 'GET', '存活探针：进程活着就返回 200'],
  ['<code>/readyz</code>', 'GET', '就绪探针：至少 1 个上游健康才返回 200'],
  ['<code>/metrics</code>', 'GET', 'Prometheus 指标，只在内网端口暴露'],
  ['<code>/admin/upstreams</code>', 'GET / POST', '查看上游健康表；手工摘除（drain）或恢复。只在内网 + mTLS']
])}
<p>错误码沿用 JSON-RPC 规范：<code>-32600</code> 无效请求、<code>-32601</code> 方法不存在（含被禁止）、<code>-32005</code> 超出限制（EIP-1474 定义的 Limit exceeded，不属于 JSON-RPC 2.0 标准码，多家服务商用它表示限流）。网关加一个响应头 <code>X-Upstream</code>，方便排查请求落到了哪个上游。</p>

${recap([
  '网关 = 鉴权限流 → 方法分类 → 缓存 → 路由 → 熔断重试 → 上游；健康检查独立运行，转发路径只读健康表。',
  '健康分由落后块数、错误率、延迟组成；熔断器有闭合、断开、半开三态，并设最少请求数防误判。'
])}
${quiz([
  { q: '熔断器为什么要设置“窗口内最少请求数”（例如 20）？', o: ['减少内存占用', '防止低流量时一次失败就触发 100% 错误率而误熔断', '让熔断更快发生', '为了兼容 Prometheus'], a: 1, why: '解析：只有 1 个请求且失败时错误率是 100%。设最少请求数让统计有意义。其他选项与该设计无关。' },
  { q: '以下哪种请求最适合重试到另一个上游？', o: ['eth_call 返回 execution reverted', 'eth_sendRawTransaction 返回 insufficient funds', 'eth_getBlockByNumber 返回 header not found（上游还没同步到该块）', 'eth_estimateGas 返回 nonce too low'], a: 2, why: '解析：header not found 是节点侧的同步问题，换一个已同步的上游即可成功。A、B、D 是确定性的业务结果，换上游结果相同。' }
])}
${exercises([["计算题（示例）：验收标准要求网关月可用性不低于 99.95%。一个 30 天的月份里，网关最多可以不可用多少分钟？", "<p>30 天 = 30 × 24 × 60 = 43,200 分钟。允许不可用比例 = 0.05%。</p><p>最多不可用：43,200 × 0.0005 = <strong>21.6 分钟</strong>。所以任一上游宕机都不能让网关整体停服，必须靠多上游和自动切换。</p>"], ["计算题（示例）：熔断器规则为“窗口内请求数至少 20 且错误率超过 50% 就断开，冷却 30 秒后半开，连续 5 次成功才闭合”。上游 A 在窗口内有 15 次请求、12 次失败；上游 B 有 25 次请求、14 次失败。分别会怎样？", "<p>上游 A：请求数 15 小于 20，不满足最少请求数，<strong>不断开</strong>。这条规则防止低流量时误判。</p><p>上游 B：14 ÷ 25 = 56%，大于 50%，且请求数满足，<strong>断开</strong>。30 秒后进入半开，放行少量试探。连续 5 次成功则闭合，任一次失败则回到断开。</p>"], ["思考题：为什么本项目不用 Nginx 或 httputil.ReverseProxy 直接做反向代理，而是自写 JSON-RPC 转发？", "<p>ReverseProxy 和 Nginx 不理解 JSON-RPC 的方法名。它们无法按方法分类做路由、缓存和黑名单。</p><p>它们也不知道每个上游落后多少个区块。落后节点会让用户看到“交易消失”。自写转发能解析 method，再做读写分离、粘滞会话和方法级缓存。</p>"]])}
${checklist(["能为 RPC 网关写出功能、可用性、延迟、正确性、安全、成本六类验收标准。", "能画出鉴权限流、方法白名单、缓存、路由、熔断重试的请求流水线。", "能解释粘滞会话为什么以交易哈希为键，以及它解决了什么问题。", "能画出熔断器闭合、断开、半开三态及转换条件。", "能设计 api_keys、method_weights、usage_daily 三张表，并说明 Key 为什么只存哈希。"])}
${call('info', '<p>设计到此完成。下一篇 <a href="#m05-50">M04.9 实战·实现</a> 讲核心代码、测试策略、部署运维、安全清单与里程碑。</p>', '下一篇')}
` });

CUR = 'm05-50';
addCh({ id: 'm05-50', nav: '实战·实现：RPC 网关', title: 'M04.9 实战·实现：高可用 RPC 网关与节点监控', desc: '核心代码、测试策略、部署运维、安全清单、里程碑与扩展方向', html: `
<h1>M04.9 实战·实现：高可用 RPC 网关与节点监控</h1>
${meta(['按上篇的设计，读懂并能复现本项目的核心代码。', '为项目制定测试策略：单元、集成、模糊与故障注入。', '完成部署、监控与安全清单，并按里程碑交付。'], '前置：<a href="#m05-10">M04.8 实战·设计</a>')}
${call('info', '<p>本篇是项目的下篇。架构图、数据模型和接口定义都在<a href="#m05-10">上篇</a>，读代码时可以对照着看。</p>')}

<h2>8. 核心代码</h2>
${art('一图看懂：gw 包里 8 个部件，Forward 是总指挥', 660, 352, [
  S.zone(10, 24, 640, 192, { t: '请求路径：每个请求都经过' }),
  S.zone(10, 232, 640, 104, { t: '后台协程：定时运行，只更新上游状态' }),
  S.box(24, 54, 132, 60, { k: 'tint', t: 'Auth / Meter', s: '§8.7\n鉴权·限流·计量', mono: 1 }),
  S.box(184, 54, 132, 60, { k: 'tint', t: 'Classify', s: '§8.1\n方法分类', mono: 1 }),
  S.box(344, 54, 132, 60, { k: 'key', t: 'Forward', s: '§8.5\n转发·重试·幂等', mono: 1 }),
  S.box(504, 54, 132, 60, { k: 'tint', t: 'Router.Pick', s: '§8.4\n挑出候选上游', mono: 1 }),
  S.box(24, 142, 292, 62, { k: 'idle', dash: 1, t: 'Gateway 结构体', s: '5 个方法都挂在它上面：Auth、Meter、\nForward、TTL、CheckConsistency', mono: 1 }),
  S.box(344, 142, 132, 60, { k: 'info', t: 'TTL', s: '§8.6\n缓存存多久', mono: 1 }),
  S.box(504, 142, 132, 60, { k: 'ok', t: 'Upstream', s: 'Breaker · Score()\n§8.2 §8.3', mono: 1 }),
  S.box(314, 260, 162, 60, { k: 'info', t: 'CheckConsistency', s: '§8.8\n比对各上游的区块哈希', mono: 1 }),
  S.box(504, 260, 132, 60, { k: 'info', t: 'HealthLoop', s: '§8.2\n每 2 秒探测落后', mono: 1 }),
  S.text(24, 286, '后台只写状态：落后块数、熔断、可疑标记\n转发路径只读这些状态，不做同步探测', { size: 12, dim: 1, mw: 270 }),
  S.arrow(158, 84, 182, 84), S.arrow(318, 84, 342, 84), S.arrow(478, 84, 502, 84),
  S.arrow(410, 116, 410, 140), S.arrow(570, 116, 570, 140),
  S.arrow(570, 260, 570, 204, { k: 'info', dash: 1 }),
  S.route([[476, 290], [490, 290], [490, 172], [502, 172]], { k: 'info', dash: 1 })
], [
  ['flow', '一个请求的顺序：Auth 鉴权限流，Classify 判断方法类别，Forward 调用 Router.Pick 取候选上游，逐个尝试，成功后由 TTL 决定结果缓存多久。'],
  ['key', 'Forward 是总指挥：它决定重试几次、什么错误换上游、写请求怎样保证幂等。其他部件只回答一个小问题。'],
  ['fail', 'Upstream 的健康分（Score）由落后块数、错误率、延迟和熔断器状态合成；熔断中的上游 Score 为 -1，Pick 直接跳过。'],
  ['limit', 'HealthLoop 和 CheckConsistency 在后台协程里运行，只写状态；它们出问题不会拖慢转发，但会让健康表变旧。']
], 'gw 包由八个部件组成：请求路径上有 Auth 和 Meter、Classify、Forward、Router.Pick、TTL 和 Upstream，后台有 HealthLoop 与 CheckConsistency 更新上游状态', 'm05-50')}
<h3>8.1 方法分类：路由和缓存的基础</h3>
<p>网关先把每个方法分成几类。分类决定它去哪个上游、能不能缓存、能不能重试。</p>
${tbl(['类别', '方法举例', '路由', '缓存', '重试'], [
  ['写', 'eth_sendRawTransaction', '写优先上游（自建 / 私有池），再异步广播', '不缓存', '只在“确定没送达”时换上游；已知交易错误视为成功'],
  ['按哈希读', 'eth_getTransactionByHash、eth_getBlockByHash', '任意健康上游；有粘滞先走粘滞', '结果非 null 时长缓存', '可以'],
  ['按区块号读', 'eth_getBlockByNumber(0x…)、eth_getLogs(固定范围)', '任意健康上游', '区块号 ≤ 链头 − 64 时长缓存', '可以'],
  ['latest 读', 'eth_blockNumber、eth_call(latest)、eth_getBalance(latest)', '健康分最高的上游', '1–2 秒短缓存', '可以'],
  ['重型', 'debug_traceTransaction、eth_getLogs(大范围)', '归档/追踪能力上游', '可长缓存（已最终确定）', '可以，限并发'],
  ['禁止', 'admin_*、personal_*、miner_*、engine_*', '直接拒绝', '—', '—']
])}
${code('GO', `
package gw

import "strings"

type Class int

const (
	ClassWrite Class = iota
	ClassByHash
	ClassByNumber
	ClassLatest
	ClassHeavy
	ClassDenied
)

var exact = map[string]Class{
	"eth_sendRawTransaction":    ClassWrite,
	"eth_getTransactionByHash":  ClassByHash,
	"eth_getTransactionReceipt": ClassByHash,
	"eth_getBlockByHash":        ClassByHash,
	"eth_getBlockByNumber":      ClassByNumber,
	"eth_getLogs":               ClassByNumber,
	"debug_traceTransaction":    ClassHeavy,
}

// Classify 按方法名分类；未知方法默认按 latest 读处理
func Classify(method string) Class {
	for _, p := range []string{"admin_", "personal_", "miner_", "engine_"} {
		if strings.HasPrefix(method, p) {
			return ClassDenied // 管理与共识接口，任何 Key 都不能调用
		}
	}
	if c, ok := exact[method]; ok {
		return c
	}
	return ClassLatest
}
`)}

<h3>8.2 上游与健康检查</h3>
<p>健康检查器每 2 秒并发询问所有上游的 <code>eth_blockNumber</code>，算出“全局链头”（所有健康上游的最大值），再算每个上游的落后块数。结合滑动窗口内的错误率和延迟，得到一个健康分。</p>
${code('GO', `
package gw

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
	"sync/atomic"
	"time"
)

type Upstream struct {
	Name     string
	URL      string
	Weight   int            // 配置的基础权重，自建节点更高
	Client   *http.Client
	head     atomic.Uint64  // 最近一次探测到的区块高度
	lag      atomic.Int64   // 落后全局链头的块数
	latEWMA  atomic.Int64   // 指数加权平均延迟（微秒）
	Breaker  *Breaker
	Stats    *Window        // 60 秒滑动窗口：请求数、错误数
}

type rpcReq struct {
	JSONRPC string \`json:"jsonrpc"\`
	ID      any    \`json:"id"\`
	Method  string \`json:"method"\`
	Params  []any  \`json:"params"\`
}

type rpcResp struct {
	JSONRPC string          \`json:"jsonrpc"\`
	ID      any             \`json:"id"\`
	Result  json.RawMessage \`json:"result,omitempty"\`
	Error   *rpcErr         \`json:"error,omitempty"\`
}

type rpcErr struct {
	Code    int    \`json:"code"\`
	Message string \`json:"message"\`
}

// probe 查询一个上游的区块高度并记录延迟
func (u *Upstream) probe(ctx context.Context) (uint64, error) {
	body, _ := json.Marshal(rpcReq{JSONRPC: "2.0", ID: 1, Method: "eth_blockNumber", Params: []any{}})
	req, _ := http.NewRequestWithContext(ctx, "POST", u.URL, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	t0 := time.Now()
	res, err := u.Client.Do(req)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()
	var r rpcResp
	if err := json.NewDecoder(res.Body).Decode(&r); err != nil || r.Error != nil {
		return 0, errBadProbe
	}
	var hex string
	_ = json.Unmarshal(r.Result, &hex)
	h, err := strconv.ParseUint(hex[2:], 16, 64) // 去掉 0x 前缀
	u.observeLatency(time.Since(t0))
	return h, err
}

// HealthLoop 周期性探测全部上游，更新落后块数和熔断器
func HealthLoop(ctx context.Context, ups []*Upstream, every time.Duration, maxLag int64) {
	tk := time.NewTicker(every)
	defer tk.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-tk.C:
		}
		var wg sync.WaitGroup
		heads := make([]uint64, len(ups))
		for i, u := range ups {
			wg.Add(1)
			go func(i int, u *Upstream) {
				defer wg.Done()
				c, cancel := context.WithTimeout(ctx, 1500*time.Millisecond)
				defer cancel()
				if h, err := u.probe(c); err == nil {
					heads[i] = h
					u.head.Store(h)
				} else {
					u.Breaker.Fail() // 探测失败也计入熔断
				}
			}(i, u)
		}
		wg.Wait()
		var top uint64
		for _, h := range heads {
			if h > top {
				top = h
			}
		}
		for i, u := range ups {
			lag := int64(top) - int64(heads[i])
			u.lag.Store(lag)
			metricHeadLag.WithLabelValues(u.Name).Set(float64(lag))
			if heads[i] == 0 || lag > maxLag {
				u.Breaker.ForceOpen("head_lag") // 落后太多：不再接收 latest 请求
			}
		}
		globalHead.Store(top)
	}
}

// Score 健康分：越高越好。落后、错误率、延迟都会扣分
func (u *Upstream) Score() float64 {
	if !u.Breaker.Allow() {
		return -1
	}
	s := float64(u.Weight)
	s -= 20 * float64(u.lag.Load())                // 每落后 1 块扣 20 分
	s -= 200 * u.Stats.ErrorRate()                  // 错误率 10% 扣 20 分
	s -= float64(u.latEWMA.Load()) / 1000 / 10      // 每 10 ms 扣 1 分
	return s
}
`)}
${call('deep', `<p>为什么用“所有健康上游的最大高度”做全局链头？因为单个上游可能卡住。只要有一个上游前进，其他上游的落后量就能算出来。代价是：如果某个上游返回了一个<strong>错误的、过高的</strong>高度，会让其他上游全部看起来“落后”。生产中可以取第二大值，或要求高度领先者在下一轮被另一上游确认。</p>`)}

<h3>8.3 熔断器</h3>
${code('GO', `
package gw

import (
	"sync"
	"time"
)

type state int

const (
	closed state = iota
	open
	halfOpen
)

type Breaker struct {
	mu        sync.Mutex
	st        state
	openedAt  time.Time
	okInHalf  int
	cooldown  time.Duration // 例如 30 秒
	needOK    int           // 半开转闭合需要的连续成功次数，例如 5
	win       *Window
	onChange  func(from, to state, reason string)
}

// Allow 判断是否可以向该上游发请求
func (b *Breaker) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.st == open && time.Since(b.openedAt) >= b.cooldown {
		b.set(halfOpen, "cooldown")
	}
	return b.st != open
}

func (b *Breaker) Success() {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.st == halfOpen {
		b.okInHalf++
		if b.okInHalf >= b.needOK {
			b.set(closed, "probe_ok")
		}
	}
}

func (b *Breaker) Fail() {
	b.mu.Lock()
	defer b.mu.Unlock()
	switch b.st {
	case halfOpen:
		b.set(open, "probe_fail")
	case closed:
		// 至少 20 个请求且错误率超过 50% 才断开，避免低流量误判
		if b.win.Total() >= 20 && b.win.ErrorRate() > 0.5 {
			b.set(open, "error_rate")
		}
	}
}

func (b *Breaker) ForceOpen(reason string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.st != open {
		b.set(open, reason)
	}
}

func (b *Breaker) set(to state, reason string) {
	from := b.st
	b.st, b.okInHalf = to, 0
	if to == open {
		b.openedAt = time.Now()
	}
	if b.onChange != nil {
		go b.onChange(from, to, reason) // 写指标与 upstream_events 表，不阻塞
	}
}
`)}

<h3>8.4 路由：读写分离、方法级、粘滞</h3>
${code('GO', `
package gw

import (
	"context"
	"sort"
)

type Router struct {
	All      []*Upstream
	WritePri []*Upstream // 写优先：自建节点、私有交易池
	Heavy    []*Upstream // 支持 debug_/trace_ 的上游
	Sticky   StickyStore // Redis 实现：Get/Set(key, upstreamName, ttl)
}

// Pick 返回按优先级排序的候选上游列表，调用方按顺序尝试
func (r *Router) Pick(ctx context.Context, cls Class, stickyKey string) []*Upstream {
	var pool []*Upstream
	switch cls {
	case ClassWrite:
		pool = r.WritePri
	case ClassHeavy:
		pool = r.Heavy
	default:
		pool = r.All
	}
	cands := make([]*Upstream, 0, len(pool))
	for _, u := range pool {
		if u.Score() >= 0 { // 熔断中的上游 Score 为 -1
			cands = append(cands, u)
		}
	}
	sort.Slice(cands, func(i, j int) bool { return cands[i].Score() > cands[j].Score() })

	// 粘滞：同一 txHash 或同一发送地址，优先使用上次的上游
	if stickyKey != "" {
		if name, ok := r.Sticky.Get(ctx, stickyKey); ok {
			for i, u := range cands {
				if u.Name == name {
					cands[0], cands[i] = cands[i], cands[0]
					break
				}
			}
		}
	}
	if len(cands) == 0 {
		return r.leastLagFallback(pool) // 全部熔断：兜底选落后最少的
	}
	return cands
}
`)}

<h3>8.5 转发、重试与写请求的幂等处理</h3>
${code('GO', `
package gw

import (
	"context"
	"errors"
	"strings"
	"time"
)

var errNoUpstream = errors.New("no upstream available")

// 这些错误说明交易已经在内存池或已上链：对写请求来说等同成功
func alreadyKnown(e *rpcErr) bool {
	if e == nil {
		return false
	}
	m := strings.ToLower(e.Message)
	return strings.Contains(m, "already known") || strings.Contains(m, "known transaction")
}

// Forward 依次尝试候选上游，最多 maxTry 次
func (g *Gateway) Forward(ctx context.Context, req rpcReq, cls Class, stickyKey string) (*rpcResp, string, error) {
	cands := g.Router.Pick(ctx, cls, stickyKey)
	maxTry := 3
	if cls == ClassWrite {
		maxTry = 2 // 写请求少重试：同一签名交易重复广播是安全的，但没必要放大流量
	}
	var lastErr error
	for i := 0; i < len(cands) && i < maxTry; i++ {
		u := cands[i]
		c, cancel := context.WithTimeout(ctx, g.timeoutFor(cls)) // 例如 latest 3 秒，heavy 30 秒
		t0 := time.Now()
		resp, err := u.Call(c, req)
		cancel()
		metricUpstreamLatency.WithLabelValues(u.Name, req.Method).Observe(time.Since(t0).Seconds())

		switch {
		case err != nil: // 网络错误、超时、HTTP 5xx/429
			u.Breaker.Fail()
			u.Stats.Add(false)
			metricRetries.WithLabelValues(u.Name, req.Method).Inc()
			lastErr = err
			continue
		case cls == ClassWrite && alreadyKnown(resp.Error):
			u.Breaker.Success()
			return g.okTxHash(req), u.Name, nil // 返回本地算出的交易哈希
		case resp.Error != nil && resp.Error.Code == -32000 && isNodeSide(resp.Error):
			// 节点侧错误（如 header not found：上游还没同步到该块），换上游
			u.Stats.Add(false)
			lastErr = errors.New(resp.Error.Message)
			continue
		default:
			// 业务错误（如 execution reverted）是正常结果，不重试、不扣分
			u.Breaker.Success()
			u.Stats.Add(true)
			if cls == ClassWrite && resp.Error == nil {
				g.afterWrite(ctx, req, resp, u) // 写粘滞表 + 异步广播到其他上游
			}
			return resp, u.Name, nil
		}
	}
	if lastErr == nil {
		lastErr = errNoUpstream
	}
	return nil, "", lastErr
}
`)}
${call('warn', `<p><strong>不要重试业务错误。</strong><code>execution reverted</code>、<code>nonce too low</code>、<code>insufficient funds</code> 是确定性的结果，换哪个上游都一样。重试只会放大流量、拖慢响应。</p>
<p><strong>写请求超时不等于失败。</strong>上游可能已经收到并广播了交易，只是响应丢了。网关应返回交易哈希（由签名交易的 RLP 字节计算 keccak256 得到），让客户端用回执查询确认结果，而不是让客户端重新签一笔新 nonce 的交易。</p>`)}

<h3>8.6 缓存：按“会不会变”分级</h3>
<p>缓存规则只有一条：<strong>只有确定不会变的数据才能长缓存。</strong>链头附近的区块可能因重组被替换，所以“按区块号”的结果只有在足够深（例如链头 − 64，约 2 个 epoch，此时通常已最终确定）时才长缓存。</p>
${code('GO', `
package gw

import "time"

// TTL 根据方法、参数和当前链头决定缓存时间；0 表示不缓存
func (g *Gateway) TTL(req rpcReq, cls Class, resp *rpcResp) time.Duration {
	if resp.Error != nil || string(resp.Result) == "null" {
		return 0 // 错误和 null（例如回执还没出来）永不缓存
	}
	head := globalHead.Load()
	switch cls {
	case ClassByHash:
		return 24 * time.Hour // 哈希唯一对应内容；被重组掉的交易会返回 null，上面已排除
	case ClassByNumber:
		n, tag := blockParam(req) // 解析 "0x1234" 或 "latest"/"safe"/"finalized"
		if tag != "" {
			return time.Second // 标签类参数含义会变
		}
		if n+64 <= head { // 深度足够：视为不可变
			return 24 * time.Hour
		}
		return 0 // 重组窗口内不缓存
	case ClassLatest:
		if req.Method == "eth_chainId" || req.Method == "net_version" {
			return time.Hour
		}
		return 1500 * time.Millisecond // 小于一个 slot（12 秒），保证新鲜
	case ClassHeavy:
		return 24 * time.Hour
	}
	return 0
}
`)}
${call('analogy', `<p>算一算（示例）：DApp 前端有 2,000 个在线用户，每人每 4 秒调用一次 <code>eth_blockNumber</code>，即 500 RPS。</p>
<ol><li>不缓存：上游收到 500 RPS，一天 500 × 86,400 = 43,200,000 次。</li>
<li>缓存 1.5 秒、2 个网关实例：每个实例每 1.5 秒最多回源 1 次，两个实例合计 2 / 1.5 ≈ 1.33 RPS。</li>
<li>回源比例 = 1.33 / 500 ≈ 0.27%，命中率约 99.7%。一天回源约 115,000 次，节省约 4,300 万次服务商请求。</li>
<li>代价：用户看到的区块号最多旧 1.5 秒，远小于 12 秒出块间隔，可以接受。</li></ol>`, '算一算')}

<h3>8.7 鉴权、限流与计量</h3>
${code('GO', `
package gw

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"sync"

	"golang.org/x/time/rate"
)

type KeyInfo struct {
	ID         int64
	Team       string
	RPS        int
	DailyQuota int64
	AllowWrite bool
	Extra      map[string]bool // 额外授权的方法
}

type Limiter struct {
	mu   sync.Mutex
	per  map[int64]*rate.Limiter // 每个 Key 一个本地令牌桶
}

func (l *Limiter) get(k *KeyInfo) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()
	lim, ok := l.per[k.ID]
	if !ok {
		// 每个网关实例分到 RPS/实例数，突发容量 2 倍
		share := float64(k.RPS) / float64(instanceCount())
		lim = rate.NewLimiter(rate.Limit(share), int(2*share)+1)
		l.per[k.ID] = lim
	}
	return lim
}

// Auth 中间件：校验 Key、限流、检查当日配额
func (g *Gateway) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := r.Header.Get("X-Api-Key")
		sum := sha256.Sum256([]byte(raw))
		k, ok := g.Keys.Lookup(hex.EncodeToString(sum[:])) // 本地缓存 60 秒，未命中查 PostgreSQL
		if raw == "" || !ok {
			writeRPCError(w, nil, -32600, "invalid api key")
			return
		}
		if !g.Limiter.get(k).Allow() {
			metricRateLimited.WithLabelValues(k.Team).Inc()
			w.Header().Set("Retry-After", "1")
			writeRPCError(w, nil, -32005, "rate limit exceeded")
			return
		}
		if g.Quota.Used(r.Context(), k.ID) >= k.DailyQuota { // Redis 读 q:{id}:{day}
			writeRPCError(w, nil, -32005, "daily quota exceeded")
			return
		}
		next.ServeHTTP(w, r.WithContext(withKey(r.Context(), k)))
	})
}

// Meter 在请求完成后累加计算单位；每分钟由后台任务刷入 usage_daily
func (g *Gateway) Meter(k *KeyInfo, method string, hit bool, failed bool) {
	cu := g.Weights.CU(method) // eth_blockNumber=1, eth_call=5, eth_getLogs=20（示例）
	g.Quota.Incr(k.ID, method, cu, hit, failed)
	metricCU.WithLabelValues(k.Team, method).Add(float64(cu))
}
`)}
<p>计量按“计算单位（CU）”而不是请求数，因为 <code>eth_getLogs</code> 一次可能比 <code>eth_blockNumber</code> 贵几十倍。批量请求按其中每条子请求分别计量和限流，否则攻击者可以把 1,000 条请求塞进一个批量里绕过限流。</p>

<h3>8.8 响应一致性校验</h3>
<p>服务商也会出错：返回过期数据、错误的分叉、甚至被劫持的结果。网关用两种手段发现它们：</p>
${steps([
  '<strong>链头哈希比对（后台）</strong>：健康检查每 10 秒取各上游在同一高度（全局链头 − 2）的区块哈希。哈希不一致的上游计入 <code>rpcgw_consistency_mismatch_total</code>，连续 3 次不一致就熔断并告警。',
  '<strong>抽样双读（在线）</strong>：对 1% 的长缓存候选请求（例如 eth_getBlockByNumber 深度区块），同时请求两个上游，比较结果哈希。不一致时不写缓存，记录事件。',
  '<strong>写缓存前校验</strong>：长缓存的数据一旦写错会被服务 24 小时。所以长缓存只接受“熔断器闭合且最近无不一致”的上游的结果。'
])}
${code('GO', `
// CheckConsistency 比较各上游在同一高度的区块哈希
func (g *Gateway) CheckConsistency(ctx context.Context) {
	h := globalHead.Load() - 2 // 留 2 个块的传播余量
	votes := map[string][]string{} // 区块哈希 -> 上游名列表
	for _, u := range g.Router.All {
		if hash, err := u.BlockHash(ctx, h); err == nil {
			votes[hash] = append(votes[hash], u.Name)
		}
	}
	if len(votes) <= 1 {
		return // 全部一致
	}
	// 多数派视为正确；少数派计入不一致
	var major string
	for hash, names := range votes {
		if major == "" || len(names) > len(votes[major]) {
			major = hash
		}
	}
	for hash, names := range votes {
		if hash != major {
			for _, n := range names {
				metricMismatch.WithLabelValues(n).Inc()
				g.markSuspect(n, h, hash, major)
			}
		}
	}
}
`)}

<h3>8.9 配置</h3>
${code('BASH', `
# config.yaml（示例）。服务商 URL 中的密钥通过环境变量注入，不写进文件
listen: ":8545"
admin_listen: "127.0.0.1:9100"      # /metrics 与 /admin 只在内网
chain: ethereum
health:
  interval: 2s
  max_head_lag: 5                    # 落后超过 5 块熔断
  consistency_interval: 10s
breaker:
  window: 60s
  min_requests: 20
  error_rate: 0.5
  cooldown: 30s
  half_open_success: 5
cache:
  local_lru_entries: 200000
  redis_addr: "redis:6379"
  latest_ttl: 1500ms
  immutable_ttl: 24h
  reorg_depth: 64
timeouts:
  latest: 3s
  heavy: 30s
  write: 5s
upstreams:
  - name: self
    url: "http://geth.internal:8545"
    weight: 100
    roles: [read, write, heavy]
  - name: provider_a
    url: "\${PROVIDER_A_URL}"
    weight: 80
    roles: [read, write]
  - name: provider_b
    url: "\${PROVIDER_B_URL}"
    weight: 70
    roles: [read, heavy]
`)}

<h2>9. 测试策略</h2>
${tbl(['层级', '测试用例（示例）', '通过标准'], [
  ['单元', 'Classify：admin_peers 返回 ClassDenied；eth_getLogs 返回 ClassByNumber', '表驱动测试全部通过'],
  ['单元', 'TTL：区块号 = 链头 − 10 返回 0；链头 − 100 返回 24h；结果 null 返回 0', '同上'],
  ['单元', '熔断器：19 次失败不断开；20 次中 11 次失败断开；冷却后半开；半开失败回到断开', '状态序列与预期一致'],
  ['单元', '写请求遇到 already known 返回交易哈希而非错误', '同上'],
  ['集成', '用 httptest 起 3 个假上游，一个延迟 2 秒、一个返回 500、一个正常', '所有请求成功，X-Upstream 均为正常上游'],
  ['集成', '发交易后查回执，两次 X-Upstream 相同（粘滞）', '100 次全部相同'],
  ['集成', '批量请求 100 条，其中 3 条为禁止方法', '97 条正常返回，3 条返回 -32601，顺序和 id 对应'],
  ['模糊', 'go test -fuzz 输入任意 JSON 字节', '不 panic，不泄露上游 URL'],
  ['压测', 'k6 恒定 3,000 RPS 10 分钟，方法比例按生产日志', 'P99 达标，错误率 &lt; 0.1%'],
  ['故障注入', '压测中 kill 自建节点；用 tc 给服务商 A 加 500 ms 延迟；Redis 重启', '错误率峰值 &lt; 1% 且 30 秒内恢复'],
  ['安全', '无 Key、错 Key、超额、调用 debug_ 未授权、URL 中带 Key', '全部被拒绝且日志中无明文 Key']
])}
${code('TYPESCRIPT', `
// k6 压测脚本 load.js（示例）：k6 run load.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    steady: { executor: 'constant-arrival-rate', rate: 3000, timeUnit: '1s',
              duration: '10m', preAllocatedVUs: 500, maxVUs: 2000 },
  },
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(99)<150'],
  },
};

// 方法比例来自生产日志抽样
const calls = [
  ['eth_blockNumber', [], 40],
  ['eth_getBlockByNumber', ['0x1312D00', false], 25], // 固定历史区块，测缓存
  ['eth_call', [{ to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', data: '0x18160ddd' }, 'latest'], 25],
  ['eth_getBalance', ['0x0000000000000000000000000000000000000000', 'latest'], 10],
];
const bag = calls.flatMap(([m, p, w]) => Array(w).fill([m, p]));

export default function () {
  const [method, params] = bag[Math.floor(Math.random() * bag.length)];
  const res = http.post(__ENV.GW_URL, JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    { headers: { 'Content-Type': 'application/json', 'X-Api-Key': __ENV.GW_KEY } });
  check(res, { 'no rpc error': r => r.status === 200 && !r.json('error') });
}
`)}
${call('info', `<p>压测不要直接打服务商：你会烧掉额度，还可能违反对方服务条款。压测环境把服务商替换成“回放上游”（返回录制的响应、注入可控延迟），只对自建节点做真实压测。</p>`)}

<h2>10. 部署与运维</h2>
<h3>10.1 部署</h3>
${art('一图看懂：部署后，流量、热数据、冷数据和监控各在哪里', 660, 372, [
  S.zone(130, 24, 220, 336, { t: 'K8s 集群' }),
  S.zone(380, 24, 270, 130, { t: '数据层：网关读写' }),
  S.zone(380, 176, 270, 184, { t: '上游节点' }),
  S.box(10, 52, 100, 74, { k: 'tint', t: '客户端', s: 'DApp 钱包\n充值监听' }),
  S.box(144, 52, 192, 74, { k: 'key', t: 'rpcgw × 3', s: '跨可用区 · 滚动升级\n:8545 RPC · :9100 指标' }),
  S.box(144, 180, 192, 48, { k: 'info', t: 'Prometheus', s: '拉取网关与节点指标' }),
  S.box(144, 288, 192, 48, { k: 'info', t: 'Grafana 面板', s: 'Alertmanager 告警' }),
  S.box(392, 50, 118, 86, { k: 'info', t: 'Redis', s: '共享缓存\n限流计数\n粘滞表' }),
  S.box(522, 50, 118, 86, { k: 'info', t: 'PostgreSQL', s: 'API Key 哈希\n每日用量' }),
  S.box(392, 202, 246, 44, { k: 'ok', t: '自建节点', s: 'StatefulSet / 独立物理机', tag: '首选' }),
  S.box(392, 256, 246, 44, { k: 'idle', dash: 1, t: '服务商 A', s: '外部 · URL 来自 Secret' }),
  S.box(392, 310, 246, 44, { k: 'idle', dash: 1, t: '服务商 B', s: '外部 · URL 来自 Secret' }),
  S.arrow(112, 89, 142, 89),
  S.arrow(338, 89, 378, 89, { both: 1 }),
  S.route([[338, 112], [364, 112], [364, 226], [390, 226]]),
  S.route([[364, 150], [364, 276], [390, 276]]),
  S.route([[364, 150], [364, 330], [390, 330]]),
  S.arrow(240, 180, 240, 128, { k: 'info', dash: 1 }),
  S.arrow(240, 230, 240, 286, { k: 'info', dash: 1 })
], [
  ['flow', '客户端只访问 rpcgw；网关读写 Redis 和 PostgreSQL，再把请求转发给自建节点或服务商。'],
  ['key', '网关本身无状态：缓存、限流计数、粘滞表在 Redis，API Key 和用量在 PostgreSQL，所以副本可以随意增减和滚动升级。'],
  ['risk', '/metrics 和 :9100 只在内网暴露；服务商 URL 里的密钥来自 Secret，不写进镜像。'],
  ['limit', '自建节点不放进网关的 Deployment：它是有状态服务，用 StatefulSet 加本地 NVMe 或独立物理机。']
], '部署图：客户端访问 K8s 集群里的三个 rpcgw 副本，网关读写 Redis 与 PostgreSQL，并转发给自建节点和两家服务商；Prometheus 拉取指标，Grafana 和 Alertmanager 展示与告警', 'm05-50')}
${code('BASH', `
# Dockerfile（多阶段构建，最终镜像只含二进制）
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /rpcgw ./cmd/rpcgw

FROM gcr.io/distroless/static:nonroot
COPY --from=build /rpcgw /rpcgw
USER nonroot
ENTRYPOINT ["/rpcgw", "-config", "/etc/rpcgw/config.yaml"]
`)}
${code('BASH', `
# k8s/deployment.yaml 片段（示例）
apiVersion: apps/v1
kind: Deployment
metadata: { name: rpcgw }
spec:
  replicas: 3
  strategy: { rollingUpdate: { maxUnavailable: 0, maxSurge: 1 } }
  template:
    spec:
      topologySpreadConstraints:          # 副本分散到不同可用区
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector: { matchLabels: { app: rpcgw } }
      containers:
        - name: rpcgw
          image: registry.example.com/rpcgw:1.4.2
          ports: [{ containerPort: 8545 }, { containerPort: 9100 }]
          envFrom: [{ secretRef: { name: rpcgw-providers } }]   # PROVIDER_A_URL 等
          readinessProbe: { httpGet: { path: /readyz, port: 9100 }, periodSeconds: 5 }
          livenessProbe:  { httpGet: { path: /healthz, port: 9100 }, periodSeconds: 10 }
          resources: { requests: { cpu: "1", memory: 1Gi }, limits: { memory: 2Gi } }
`)}
<p>自建节点不放进同一个 Deployment。节点是有状态服务，用 StatefulSet + 本地 NVMe 或独立物理机，详见 <a href="#m05-6">M04.6</a>。CI/CD 流程：PR 跑单元测试和 <code>go vet</code>、<code>golangci-lint</code>；合并后构建镜像并签名；先发布到预发环境跑 10 分钟回放压测；再在生产灰度 1 个副本 30 分钟，观察错误率无上升后全量。</p>
<h3>10.2 Prometheus 指标</h3>
${tbl(['指标名', '类型', '标签', '用途'], [
  ['<code>rpcgw_requests_total</code>', 'Counter', 'method, status, team', '请求量与错误率'],
  ['<code>rpcgw_request_duration_seconds</code>', 'Histogram', 'method, cache', '对外延迟（区分命中与未命中）'],
  ['<code>rpcgw_upstream_request_duration_seconds</code>', 'Histogram', 'upstream, method', '每个上游的延迟'],
  ['<code>rpcgw_upstream_errors_total</code>', 'Counter', 'upstream, kind', '超时、5xx、429、节点侧错误'],
  ['<code>rpcgw_upstream_head_lag_blocks</code>', 'Gauge', 'upstream', '落后全局链头的块数'],
  ['<code>rpcgw_breaker_state</code>', 'Gauge', 'upstream', '0 闭合、1 半开、2 断开'],
  ['<code>rpcgw_breaker_transitions_total</code>', 'Counter', 'upstream, to', '熔断抖动'],
  ['<code>rpcgw_cache_hits_total</code> / <code>_misses_total</code>', 'Counter', 'class', '缓存命中率'],
  ['<code>rpcgw_rate_limited_total</code>', 'Counter', 'team', '被限流的请求'],
  ['<code>rpcgw_cu_total</code>', 'Counter', 'team, method', '计量与成本'],
  ['<code>rpcgw_consistency_mismatch_total</code>', 'Counter', 'upstream', '数据不一致'],
  ['<code>chain_head_block</code>（Geth 自带）、<code>p2p_peers</code>', 'Gauge', '—', '自建节点同步与对等节点数'],
  ['<code>node_filesystem_avail_bytes</code>（node_exporter）', 'Gauge', 'mountpoint', '节点磁盘剩余']
])}
<p>Geth 用 <code>--metrics --metrics.addr 127.0.0.1 --metrics.port 6060</code> 暴露指标，抓取路径为 <code>/debug/metrics/prometheus</code>。Lighthouse 用 <code>--metrics</code> 暴露（默认端口 5054）。</p>
<h3>10.3 Grafana 面板设计</h3>
${tbl(['行', '面板', '查询（PromQL 示例）'], [
  ['总览', '对外 QPS、错误率、P99', '<code>sum(rate(rpcgw_requests_total[1m]))</code>；<code>histogram_quantile(0.99, sum by (le) (rate(rpcgw_request_duration_seconds_bucket[5m])))</code>'],
  ['总览', '缓存命中率', '<code>sum(rate(rpcgw_cache_hits_total[5m])) / (sum(rate(rpcgw_cache_hits_total[5m])) + sum(rate(rpcgw_cache_misses_total[5m])))</code>'],
  ['上游', '每上游落后块数（折线）与熔断状态（状态时间线）', '<code>rpcgw_upstream_head_lag_blocks</code>；<code>rpcgw_breaker_state</code>'],
  ['上游', '每上游 P99 与错误率', '<code>histogram_quantile(0.99, sum by (le, upstream) (rate(rpcgw_upstream_request_duration_seconds_bucket[5m])))</code>'],
  ['方法', 'Top 10 方法耗时与 CU', '<code>topk(10, sum by (method) (rate(rpcgw_cu_total[1h])))</code>'],
  ['租户', '每团队请求、限流次数、当日 CU', '<code>sum by (team) (rate(rpcgw_rate_limited_total[5m]))</code>'],
  ['节点', '自建节点链头、对等节点数、磁盘剩余、CPU/IO', '<code>p2p_peers</code>；<code>node_filesystem_avail_bytes{mountpoint="/data"}</code>']
])}
<h3>10.4 告警规则</h3>
${code('BASH', `
# alerts.yaml（Prometheus 告警规则示例，阈值按业务调整）
groups:
  - name: rpcgw
    rules:
      - alert: RpcgwHighErrorRate
        expr: sum(rate(rpcgw_requests_total{status="error"}[5m])) / sum(rate(rpcgw_requests_total[5m])) > 0.01
        for: 5m
        labels: { severity: page }
        annotations: { summary: "网关对外错误率超过 1%" }
      - alert: RpcgwHighLatency
        expr: histogram_quantile(0.99, sum by (le) (rate(rpcgw_request_duration_seconds_bucket[5m]))) > 0.5
        for: 10m
        labels: { severity: ticket }
      - alert: UpstreamLagging
        expr: rpcgw_upstream_head_lag_blocks > 5
        for: 3m
        labels: { severity: ticket }
        annotations: { summary: "上游 {{ $labels.upstream }} 落后 {{ $value }} 个区块" }
      - alert: AllUpstreamsDown
        expr: min(rpcgw_breaker_state) == 2
        for: 1m
        labels: { severity: page }
      - alert: UpstreamInconsistent
        expr: increase(rpcgw_consistency_mismatch_total[10m]) >= 3
        labels: { severity: page }
  - name: node
    rules:
      - alert: NodeLowPeers
        expr: p2p_peers < 10
        for: 10m
        labels: { severity: ticket }
      - alert: NodeDiskFilling
        expr: predict_linear(node_filesystem_avail_bytes{mountpoint="/data"}[6h], 3 * 86400) < 0
        labels: { severity: ticket }
        annotations: { summary: "按当前速度，节点磁盘 3 天内写满" }
`)}
${call('warn', `<p>密钥管理：服务商 URL 里通常带着账户密钥，泄露后别人可以烧光你的额度。把它们放 Kubernetes Secret（最好接入 Vault 或云 KMS），日志中对 URL 做脱敏，按季度轮换。</p>`)}

<h2>11. 安全清单与威胁模型</h2>
${tbl(['威胁', '攻击方式', '防护', '怎么验证'], [
  ['管理接口暴露', '调用 admin_addPeer、personal_unlockAccount', '方法黑名单 + 自建节点只开 eth,net,web3 命名空间（<code>--http.api</code>）', '安全测试用例'],
  ['资源耗尽（DoS）', 'eth_getLogs 查 100 万个区块；debug_trace 大交易', '限制 getLogs 区块范围（例如 ≤ 2,000）、重型方法独立并发池与超时、CU 计量', '压测重型方法，其他方法 P99 不受影响'],
  ['批量绕过限流', '一个 HTTP 请求塞 10,000 条', '批量上限（例如 100 条）+ 按子请求计量', '集成测试'],
  ['Key 泄露', 'Key 写在前端代码或 URL', 'Key 放请求头；前端用单独低额度 Key + Origin 白名单；只存哈希', '代码扫描 + 日志检查'],
  ['缓存投毒', '某上游返回错误数据被长缓存', '一致性校验、长缓存只收可信上游结果、可按前缀清缓存', '故障注入：假上游返回错误哈希'],
  ['交易被窥探抢跑', '写请求经过第三方服务商', '敏感交易走私有交易池上游（<a href="#m05-7">M04.7</a>）', '配置审计'],
  ['上游审查', '服务商拒绝广播某些交易', '写请求多路广播；自建节点兜底', '监控写请求的上游错误分布'],
  ['内网横向', '攻击者进入集群访问 /admin', 'admin 端口仅 127.0.0.1 或 mTLS；NetworkPolicy', '渗透测试']
])}

${mm('RPC 网关的交付顺序：先能转发，再谈可靠', `
flowchart LR
  W1["第 1 周<br/>单上游转发与请求解析"]
  W2["第 2 周<br/>多上游、健康检查与熔断"]
  W3["第 3 周<br/>读写分离与重试策略"]
  W4["第 4 周<br/>两级缓存与重组保护"]
  W5["第 5 周<br/>鉴权、限流、计量与监控"]
  W6["第 6 周<br/>压测、故障演练与灰度上线"]
  W1 --> W2 --> W3 --> W4 --> W5 --> W6
  class W1 key
  class W6 ok
`, [
  ['flow', '每一周都在上一周可运行的网关上叠加一层能力；任何一周结束时都能演示。'],
  ['key', '每周结束都要有可演示的交付物，而不是“写了一部分代码”。'],
  ['limit', '6 周是单人或小团队的示例节奏，实际以团队规模和验收标准调整。']
])}
<h2>12. 里程碑计划（6 周）</h2>
${tbl(['周', '目标', '交付物'], [
  ['第 1 周', '骨架与单上游转发', 'JSON-RPC 解析（含批量）、方法分类与黑名单、转发到自建节点；/healthz；单元测试'],
  ['第 2 周', '多上游与健康检查', '3 个上游、健康检查循环、健康分、熔断器状态机、故障转移集成测试'],
  ['第 3 周', '路由与写请求', '读写分离、方法级路由、Redis 粘滞会话、重试策略、already known 处理、异步多路广播'],
  ['第 4 周', '缓存与一致性', '本地 LRU + Redis 两级缓存、TTL 规则、重组深度保护、链头哈希比对、抽样双读'],
  ['第 5 周', '鉴权、限流、计量与监控', 'API Key 表、令牌桶 + Redis 配额、CU 计量入库、全部 Prometheus 指标、Grafana 面板 JSON、告警规则'],
  ['第 6 周', '压测、故障演练与上线', 'k6 报告、故障注入记录、Helm Chart、运行手册（Runbook）、灰度上线与复盘文档']
])}

<h2>13. 扩展方向与面试/作品集要点</h2>
${steps([
  '<strong>多链</strong>：同一网关支持以太坊、Arbitrum、Base 等；注意 L2 的 safe/finalized 语义和重组深度不同（见 <a href="#m05-5">M04.5</a>）。',
  '<strong>WebSocket 订阅高可用</strong>：上游断线后自动重订阅，并用 newHeads 的父哈希检测漏块与重组。',
  '<strong>智能 getLogs</strong>：把大范围查询切成小段并发拉取，结果按区块号合并；或接入索引服务（见 <a href="#m05-9">M04.27</a>）。',
  '<strong>分布式追踪</strong>：接入 OpenTelemetry，一条请求从网关到上游的全链路耗时可视化。',
  '<strong>成本优化</strong>：按服务商价格和剩余额度动态调整权重。'
])}
${call('info', `<p>作品集展示建议：一页架构图 + 一张 Grafana 截图（演示 kill 自建节点后流量自动切走） + k6 报告 + README 写清“我做了哪些取舍”。面试常见追问：① 为什么不能缓存 latest 区块很久？② 写请求超时你怎么处理？③ 三个上游返回不同的区块哈希时你信谁？④ 批量请求怎么限流？这四个问题本篇都给了答案。</p>`)}

${mistakes([
  ['用 Nginx 轮询多个节点就是高可用', 'Nginx 不懂 JSON-RPC，不知道节点落后多少块，也不能做方法级路由和缓存。落后节点会让用户看到“交易消失”。'],
  ['所有请求失败都可以换上游重试', '只有网络错误和节点侧错误才重试。execution reverted、nonce too low 是确定结果，重试只会放大流量。'],
  ['按区块号的查询都可以长缓存', '链头附近的区块可能被重组替换。只有深度足够（例如链头 − 64 以下，或已最终确定）才长缓存。'],
  ['写请求超时就是失败，让用户重新发', '交易可能已被广播。应返回交易哈希并查询回执；重签新交易可能导致重复支付。'],
  ['服务商返回的数据一定正确', '服务商也会落后、分叉或出错。需要多上游比对链头哈希，长缓存只接受可信结果。']
])}
${recap([
  '网关 = 鉴权限流 → 方法分类 → 缓存 → 路由 → 熔断重试 → 上游；健康检查独立运行，转发路径只读健康表。',
  '健康分由落后块数、错误率、延迟组成；熔断器有闭合、断开、半开三态，并设最少请求数防误判。',
  '写请求走可信上游、粘滞会话、已知交易视为成功；业务错误不重试。',
  '缓存按“会不会变”分级：哈希类长缓存、深度区块长缓存、latest 短缓存、null 与错误不缓存。',
  '限流按 Key 和计算单位，批量请求逐条计量；指标、面板、告警与压测共同证明验收标准。'
])}
${quiz([
  { q: '网关收到 <code>eth_getBlockByNumber("0x10")</code>，此时链头是 0x30（相差 32 块），重组保护深度配置为 64。应该怎么缓存？', o: ['缓存 24 小时', '不缓存（或只缓存很短时间）', '永久缓存', '缓存 1 小时'], a: 1, why: '解析：该区块距链头只有 32 块，小于 64 的保护深度，仍可能被重组替换，所以不长缓存。A、C、D 都可能把被替换的旧区块服务给用户。' },
  { q: '写请求转发到上游后返回错误 “already known”。网关应该？', o: ['向客户端报错，让其重签', '换一个上游继续重试 5 次', '视为成功，返回交易哈希', '熔断该上游'], a: 2, why: '解析：already known 表示该交易已在节点内存池中，对广播来说等同成功。A 可能导致重复支付；B 放大流量；D 误伤健康上游。' },
  { q: '三个上游在同一高度返回的区块哈希为 X、X、Y。网关合理的处理是？', o: ['立即全部熔断', '以多数派 X 为准，记录返回 Y 的上游不一致，连续多次则熔断并告警', '以最快返回的为准', '忽略，不影响业务'], a: 1, why: '解析：多数派投票加连续计数，既能发现异常上游，又避免一次传播延迟造成误判。A 过度反应；C 没有依据；D 会让缓存被错误数据污染。' }
])}
${exercises([["计算题（示例）：DApp 有 1,000 个在线用户，每人每 2 秒调用一次 eth_blockNumber。latest 类缓存 1 秒，部署 3 个网关实例。回源比例和缓存命中率各是多少？一天回源多少次？", "<p>请求量：1,000 ÷ 2 = 500 RPS。每个实例每秒最多回源 1 次，3 个实例合计 3 RPS。</p><p>回源比例 = 3 ÷ 500 = 0.6%，命中率约 <strong>99.4%</strong>。一天回源 3 × 86,400 = <strong>259,200 次</strong>，而不缓存是 500 × 86,400 = 43,200,000 次。用户看到的区块号最多旧 1 秒，可以接受。</p>"], ["计算题（示例）：按文中健康分公式（基础权重 − 20 × 落后块数 − 200 × 错误率 − 延迟毫秒 ÷ 10）比较两个上游。自建节点：权重 100、落后 2 块、错误率 5%、延迟 80 ms。服务商 A：权重 80、落后 0 块、错误率 1%、延迟 150 ms。路由会优先选谁？", "<p>自建节点：100 − 40 − 10 − 8 = <strong>42</strong>。</p><p>服务商 A：80 − 0 − 2 − 15 = <strong>63</strong>。</p><p>服务商 A 分数更高，路由优先选它。落后块数扣分最重，所以一个落后的高权重节点也会被排到后面。</p>"], ["计算题（示例）：某 Key 的 RPS 上限是 50，部署 2 个网关实例。按文中本地令牌桶的写法，每个实例的速率和突发容量是多少？一个批量请求塞了 100 条子请求，并按子请求逐条限流，大约会发生什么？", "<p>每个实例分到 50 ÷ 2 = 25 RPS，突发容量 = int(2 × 25) + 1 = <strong>51</strong>。</p><p>令牌桶满时，前约 51 条子请求通过，其余约 49 条被拒绝并返回 -32005（忽略处理期间补充的少量令牌）。如果按整个批量只算 1 次，攻击者就能用批量绕过限流。</p>"]])}
${checklist(["能写出 Classify 函数，把方法分成写、按哈希读、按区块号读、latest、重型、禁止六类。", "能用健康分公式比较多个上游，并说出落后、错误率、延迟各自怎么扣分。", "能说出缓存 TTL 规则：错误和 null 不缓存，距链头不足 64 块的区块不长缓存。", "能解释写请求遇到 already known 为什么视为成功，以及写请求超时该怎么处理。", "能为网关写出 Prometheus 指标和告警规则，并用故障注入验证告警会触发。"])}
${terms([
  ['RPC 网关', 'RPC Gateway', '位于应用与节点之间，负责路由、缓存、限流和监控的代理服务'],
  ['上游', 'Upstream', '网关背后实际处理请求的节点或服务商'],
  ['健康分', 'Health Score', '综合落后块数、错误率、延迟给上游打的分，用于路由排序'],
  ['熔断器', 'Circuit Breaker', '在上游持续出错时暂停向其转发、冷却后试探恢复的保护机制'],
  ['粘滞会话', 'Sticky Session', '把相关请求（如同一交易哈希）固定路由到同一上游'],
  ['计算单位', 'Compute Unit, CU', '按方法开销加权的计量单位，用于限流与计费'],
  ['重组深度', 'Reorg Depth', '认为区块不会再被替换所需的距链头块数'],
  ['P99 延迟', 'P99 Latency', '99% 请求都不超过的耗时，用来衡量尾部体验']
])}
` });
})();
