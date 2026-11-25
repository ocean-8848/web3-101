/* ---------- M01 子文章（4/5）：索引器工程 ---------- */
(() => {
CUR = 'm01-8';
addCh({ id: 'm01-8', nav: '索引器工程', title: 'M01.8 索引器工程：顺序推进、重组回滚、幂等与对账', desc: '设计生产级区块索引器：游标、找共同祖先、唯一键、确认策略、DDL 与监控。', html: `
<h1>M01.8 索引器工程：顺序推进、重组回滚、幂等与对账</h1>
${meta(['画出 Fetcher / Parser / Store / Confirmer 架构，并说明每层的职责和失败处理。', '实现“找共同祖先”的重组回滚算法，用唯一键保证幂等。', '设计表结构、确认数策略、多 RPC 校验、回填对账和监控告警。'], '<a href="#m01-7">M01.7 用 go-ethereum 读链</a>', ['reorg', 'confirm'])}
${beginner(`<p><strong>索引器（Indexer）</strong>：持续扫描区块、把关心的数据（例如转账事件）整理进数据库的后台服务。区块浏览器、钱包、交易所都离不开它。</p>
<p><strong>游标（Cursor）</strong>：记录“已经处理到哪个高度、那个区块的哈希是什么”的一行数据。重启后从游标继续。</p>
<p><strong>重组（Reorg）</strong>：节点发现另一条分叉更重或获得更多投票，于是切换过去，原来链尾的几个区块被抛弃。</p>
<p><strong>共同祖先（Common Ancestor）</strong>：旧链和新链分叉前最后一个相同的区块。</p>
<p><strong>幂等（Idempotency）</strong>：同一操作执行多次，结果和执行一次相同。</p>
<p><strong>对账（Reconciliation）</strong>：用另一种独立方式重新计算结果，和已有数据比对，找出差异。</p>`)}

<h2>1. 一句话理解</h2>
${one('索引器 = 按高度顺序推进的循环：拉块 → 校验父哈希 → 解析 → 在一个事务里写库并移动游标；父哈希对不上就回退到共同祖先重来。')}
${call('analogy', `<p>索引器像一个抄账员，把银行的流水逐页抄进公司账本。每抄一页，他先核对“这页写的上一页编号”和自己账本最后一页是否一致。有一天银行说“最近两页作废，以新的两页为准”，抄账员就要撕掉自己账本的最后两页，并通知财务：“这两页里已经付过的款，要追回。”</p>
<p><strong>类比的局限</strong>：银行会主动通知作废；区块链不会。索引器只能靠“父哈希对不上”自己发现。</p>`)}
${art('一图看懂：索引器按高度一块一块推进，区块 + 事件 + 游标同进同退', 660, 330, [
  S.zone(250, 142, 272, 126, { t: '同一个数据库事务', k: 'key' }),
  ...(() => { const c = S.cols(10, 640, 5, 24); return [
    S.box(c[0].x, 40, c[0].w, 72, { k: 'info', t: 'RPC 节点', s: '区块头\n+ 日志' }),
    S.box(c[1].x, 40, c[1].w, 72, { k: 'tint', t: 'Fetcher', s: '按高度拉取\n超时重试' }),
    S.box(c[2].x, 40, c[2].w, 72, { k: 'tint', t: 'Parser', s: '按 ABI 解码\n白名单过滤' }),
    S.box(c[3].x, 40, c[3].w, 72, { k: 'key', t: 'Store', s: '原子地写\n移动游标' }),
    S.box(c[4].x, 40, c[4].w, 72, { k: 'ok', t: 'Confirmer', s: '确认数达标\n才发事件' }),
    S.arrow(c[0].x + c[0].w + 2, 76, c[1].x - 2, 76),
    S.arrow(c[1].x + c[1].w + 2, 76, c[2].x - 2, 76),
    S.arrow(c[2].x + c[2].w + 2, 76, c[3].x - 2, 76),
    S.arrow(c[3].x + c[3].w + 2, 76, c[4].x - 2, 76)
  ]; })(),
  S.arrow(462, 114, 462, 140, { k: 'key' }),
  S.box(258, 172, 80, 56, { k: 'info', t: '区块', s: '高度\n哈希' }),
  S.box(346, 172, 80, 56, { k: 'info', t: '事件', s: '解码后' }),
  S.box(434, 172, 80, 56, { k: 'key', t: '游标', s: '已处理\n高度' }),
  S.box(10, 170, 226, 70, { k: 'risk', icon: 'warn', t: '父哈希对不上 = 发生重组', s: '回退到共同祖先，再重新拉块' }),
  S.arrow(120, 168, 120, 114, { k: 'risk', dash: 1 }),
  S.text(330, 304, '三样东西一起写入、一起回滚：崩溃后既不重复，也不漏数据', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '拉块 → 校验父哈希 → 解析 → 一个事务里写库并移动游标 → 确认数达标后才通知下游。'],
  ['key', '“区块 + 事件 + 游标”必须在同一个数据库事务里提交，否则崩溃时会重复或漏数据。'],
  ['risk', '链不会通知你重组。只有“父哈希对不上”这个信号，发现后回退到共同祖先重来。'],
  ['fail', '最危险的三个故障：漏块（跳号）、重组未回滚、重复处理。']
], '索引器由 Fetcher、Parser、Store、Confirmer 四个角色按高度顺序推进，Store 在同一个事务里写入区块、事件和游标，父哈希不一致时回滚到共同祖先', 'm01-8')}

<h2>2. 架构：四个角色</h2>
${mm('索引器架构：Fetcher → Parser → Store → Confirmer', `
flowchart LR
  subgraph SRC["数据源"]
    R1["RPC 主"]
    R2["RPC 备"]
  end
  F["Fetcher<br/>按高度拉区块头与日志<br/>超时、重试、限流"] --> C{"父哈希<br/>等于游标哈希？"}
  R1 --> F
  R2 -.->|"交叉校验区块哈希"| F
  C -->|"否"| RB["Reorg Handler<br/>找共同祖先并回滚"]
  RB --> F
  C -->|"是"| P["Parser<br/>按 ABI 解码事件<br/>合约白名单过滤"]
  P --> S["Store<br/>一个事务：区块 + 事件 + 游标"]
  S --> DB[("PostgreSQL")]
  DB --> CF["Confirmer<br/>确认数达标后发事件"]
  CF --> MQ[["Kafka / 回调"]]
  DB --> REC["Reconciler<br/>回填与对账"]
  REC -.->|"差异告警"| AL["告警"]
`, [
  ['flow', 'Fetcher 只管“拿到正确的数据”；Parser 只管“看懂数据”；Store 只管“原子地写”；Confirmer 只管“什么时候算数”。'],
  ['key', '“区块 + 事件 + 游标”必须在同一个数据库事务里提交。否则进程在中间崩溃，会出现“事件写了、游标没动”（重复）或“游标动了、事件没写”（漏数据）。'],
  ['fail', '最危险的三个故障：漏块（跳号）、重组未回滚、重复处理。本篇每一节都在防这三件事。'],
  ['limit', '单个顺序循环吞吐有限。追历史时用并发回填（第 7 节），追上链头后切回顺序模式。']
])}
${tbl(['组件', '输入', '输出', '失败时'], [
  ['Fetcher', '高度 h', '区块头 + 该块日志（按 blockHash 查询）', '超时重试；节点落后则换源；连续失败告警'],
  ['Reorg Handler', '父哈希不一致的信号', '共同祖先高度 a', '超过最大深度（示例 64）就停止推进并告警，人工介入'],
  ['Parser', '原始日志', '结构化事件（from、to、amount…）', '解码失败的日志记入死信表，不阻塞主流程'],
  ['Store', '区块 + 事件', '数据库行 + 新游标', '事务回滚，下一轮重试同一高度'],
  ['Confirmer', '链头高度', 'confirmed 事件', '消息投递失败由 outbox 重发'],
  ['Reconciler', '历史区间', '差异报告', '只报告和补数据，不改已确认数据']
])}
<p>用现成框架 Ponder 实现同样职责（它内部处理游标和重组）的例子见 <a href="#m12-3">M15.3 实现：合约与前后端</a> 第 7 节。</p>

<h2>3. 按高度顺序推进与游标</h2>
${steps([
  '读游标 (height, hash)。首次启动时，游标设为“部署高度 − 1”或运营指定的起点。',
  '读链头 head。如果 height ≥ head（或 height ≥ head − lag，lag 为可选的安全滞后），休眠 2–4 秒后重来。',
  '拉高度 height + 1 的区块头 hdr。',
  '如果 hdr.parentHash ≠ 游标 hash：进入重组处理（第 4 节），本轮结束。',
  '用 <code>eth_getLogs({blockHash: hdr.hash})</code> 拉这个块的日志。按区块哈希查询（EIP-234）保证日志属于这个块，而不是同高度的另一个分叉块。',
  '解析日志，在一个事务里写入 blocks、transfers，并把游标更新为 (height + 1, hdr.hash)。',
  '调用 Confirmer，把达到确认数的事件标记为已确认并发消息。'
])}
${call('warn', `<p><strong>不要用“fromBlock / toBlock 按高度范围”拉链头附近的日志。</strong>负载均衡后面的节点可能处在不同分叉上：你拿到的区块头来自分叉 A，日志却来自分叉 B。链头附近一律按 blockHash 查询；只有在 finalized 之前的历史区间回填时，才用范围查询提速。</p>`)}

<h2>4. 重组检测与回滚：找共同祖先</h2>
${mm('找共同祖先：逐块向回比较本地哈希与链上哈希', `
flowchart TB
  S["发现：新块 parentHash 不等于游标哈希"] --> I["h = 游标高度"]
  I --> L{"本地 hash(h)<br/>等于链上 hash(h)？"}
  L -->|"相等"| A["共同祖先 = h"]
  L -->|"不等"| D{"已回退深度<br/>超过上限？"}
  D -->|"否"| M["h = h - 1"]
  M --> L
  D -->|"是"| STOP["停止推进<br/>严重告警，人工处理"]
  A --> TX["一个事务：<br/>删除高度大于 h 的区块（事件级联删除）<br/>相关的未确认充值记录标记 orphaned<br/>已确认充值记录标记 reverted 并发撤销事件<br/>游标回到 h"]
  TX --> NEXT["从 h + 1 继续扫描新分叉"]
`, [
  ['flow', '从游标高度往回走，每步比较“本地存的哈希”和“链上现在这个高度的哈希”，第一个相等的高度就是共同祖先。'],
  ['key', '回滚和游标移动在同一事务里完成。回滚后从 h+1 重新扫描，新分叉上的事件会被正常写入。'],
  ['fail', '如果链上查询本身落在另一个落后节点上，可能误判祖先。回滚过程要固定使用同一个 RPC 源。'],
  ['risk', '原始区块和事件行直接删除（见第 6 节 DDL 的级联删除）；orphaned / reverted 标记打在业务记录（如充值）上，保留审计痕迹。已确认（已入账）的充值被回滚，是资金事故。要发撤销事件、冻结相关账户并告警。阈值设对了，这种情况应几乎不发生。']
])}
${code('GO', `
// findAncestor 从本地最高块往回找，直到本地哈希等于链上同高度哈希。
func (s *Scanner) findAncestor(ctx context.Context, from uint64) (uint64, error) {
	for h := from; h > 0 && from-h <= s.MaxReorg; h-- {
		local, ok, err := s.Store.BlockHash(ctx, h)
		if err != nil {
			return 0, err
		}
		if !ok {
			return h, nil // 早于本地最早记录（例如刚启动），视为共同祖先
		}
		remote, err := s.Chain.HeaderByNumber(ctx, new(big.Int).SetUint64(h))
		if err != nil {
			return 0, err
		}
		if remote.Hash() == local {
			return h, nil
		}
	}
	return 0, ErrReorgTooDeep // 超过最大深度：宁可停下，也不要猜
}
`)}
<p><strong>算一算（示例）</strong>：本地游标在高度 1,005，哈希 0xe5。新块 1,006 的父哈希是 0xf5。</p>
${steps([
  'h = 1,005：本地 0xe5，链上 0xf5，不等。',
  'h = 1,004：本地 0xd4，链上 0xf4，不等。',
  'h = 1,003：本地 0xc3，链上 0xc3，相等 → 共同祖先 = 1,003。',
  '回滚：删除本地 1,004、1,005 两个区块及其事件；游标回到 (1,003, 0xc3)；重组深度 = 2。',
  '下一轮从 1,004 开始，扫描新分叉的 0xf4、0xf5、1,006。'
])}
<p>先在实验里感受确认数和重组的关系：把确认数阈值 N 设为 1，连续出几个块后点“发生 3 块深度重组”，观察“已入账后又被回滚”的事故计数；再把 N 调到 6，重复同样操作。实验面板自带的提示用 N = 0 / 3 / 6 三档，本文的动手练习（第 8 节末）用 N = 1 / 6 两档，结论相同：重组深度达到或超过 N 时，已入账的充值会被回滚。</p>
${lab('reorg')}

<h2>5. 幂等：唯一键与事务</h2>
<p>索引器一定会重复处理同一个块：进程崩溃后重启、回滚后重扫、回填任务和实时任务重叠。所以每一次写入都必须幂等。</p>
${tbl(['数据', '唯一键', '原因'], [
  ['区块', '(chain_id, number) 主键 + (chain_id, hash) 唯一', '主表只保留主链，一个高度一行；哈希唯一防止串链'],
  ['交易', '(chain_id, tx_hash)', '交易哈希全局唯一（同一交易重组后可能进入另一个块，回滚时删除旧行再插入）'],
  ['事件（日志）', '(chain_id, block_hash, log_index)', 'log_index 是日志在整个区块里的序号。同一交易被重新打包后，log_index 可能变化'],
  ['业务记录（如充值）', '(chain_id, tx_hash, log_index) 上的部分唯一索引，只约束“活”状态', '防止重复扫描造成重复入账；被孤立的历史行不占唯一键'],
  ['账本流水', '(业务记录 id, 流水类型)', '每笔记录最多一次入账、一次冲正，由数据库保证']
])}
${call('info', `<p><strong>为什么不能只用 tx_hash 做事件唯一键</strong>：一笔交易可以产生多条 Transfer 日志（例如批量转账合约一次给 50 个地址转币，或一次兑换同时发出多条 Transfer）。只用 tx_hash，会把同一交易里的第 2–50 笔当成重复数据丢掉。</p>`)}
${code('GO', `
// SaveBlock：区块、事件、游标在一个事务里。重复执行结果相同。
func (s *PgStore) SaveBlock(ctx context.Context, hdr *types.Header, evs []Transfer) error {
	return pgx.BeginFunc(ctx, s.DB, func(tx pgx.Tx) error {
		n, h := int64(hdr.Number.Uint64()), hdr.Hash().Bytes()
		if _, err := tx.Exec(ctx, \`INSERT INTO blocks(chain_id, number, hash, parent_hash, block_time)
			VALUES ($1,$2,$3,$4,to_timestamp($5)) ON CONFLICT DO NOTHING\`,
			s.ChainID, n, h, hdr.ParentHash.Bytes(), int64(hdr.Time)); err != nil {
			return err
		}
		for _, e := range evs {
			if _, err := tx.Exec(ctx, \`INSERT INTO transfers(chain_id, block_hash, log_index, block_number,
				tx_hash, token, from_addr, to_addr, amount)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::numeric) ON CONFLICT DO NOTHING\`,
				s.ChainID, h, e.LogIndex, n, e.TxHash.Bytes(), e.Token.Bytes(),
				e.From.Bytes(), e.To.Bytes(), e.Amount.String()); err != nil {
				return err
			}
		}
		_, err := tx.Exec(ctx, \`UPDATE cursors SET height=$2, block_hash=$3, updated_at=now()
			WHERE chain_id=$1 AND name='transfers'\`, s.ChainID, n, h)
		return err
	})
}
`)}

<h2>6. 数据库表设计（DDL）</h2>
${code('BASH', `
-- PostgreSQL。金额用 NUMERIC(78,0)：uint256 最大值有 78 位十进制数字。
-- 哈希和地址用 BYTEA（32 / 20 字节），比存十六进制字符串省一半空间。

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

CREATE TABLE transactions (
  chain_id     BIGINT        NOT NULL,
  tx_hash      BYTEA         NOT NULL,
  block_number BIGINT        NOT NULL,
  block_hash   BYTEA         NOT NULL,
  tx_index     INT           NOT NULL,
  from_addr    BYTEA         NOT NULL,
  to_addr      BYTEA,                      -- 创建合约时为 NULL
  value        NUMERIC(78,0) NOT NULL,
  status       SMALLINT      NOT NULL,     -- 回执 status：1 成功，0 失败
  gas_used     BIGINT        NOT NULL,
  PRIMARY KEY (chain_id, tx_hash),
  FOREIGN KEY (chain_id, block_number) REFERENCES blocks(chain_id, number) ON DELETE CASCADE
);

CREATE TABLE transfers (
  chain_id     BIGINT        NOT NULL,
  block_hash   BYTEA         NOT NULL,
  log_index    INT           NOT NULL,
  block_number BIGINT        NOT NULL,
  tx_hash      BYTEA         NOT NULL,
  token        BYTEA         NOT NULL,     -- 代币合约地址
  from_addr    BYTEA         NOT NULL,
  to_addr      BYTEA         NOT NULL,
  amount       NUMERIC(78,0) NOT NULL,
  PRIMARY KEY (chain_id, block_hash, log_index),
  FOREIGN KEY (chain_id, block_number) REFERENCES blocks(chain_id, number) ON DELETE CASCADE
);
CREATE INDEX idx_transfers_to   ON transfers(chain_id, to_addr, block_number);
CREATE INDEX idx_transfers_from ON transfers(chain_id, from_addr, block_number);
CREATE INDEX idx_transfers_tx   ON transfers(chain_id, tx_hash);

CREATE TABLE cursors (
  chain_id   BIGINT NOT NULL,
  name       TEXT   NOT NULL,              -- 每个任务一个游标：transfers、deposits、backfill-2024…
  height     BIGINT NOT NULL,
  block_hash BYTEA  NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, name)
);

-- 回滚：删除祖先之后的区块，transactions 和 transfers 通过 ON DELETE CASCADE 一起删除
-- DELETE FROM blocks WHERE chain_id = $1 AND number > $2;
`)}
${tbl(['设计点', '选择', '理由'], [
  ['主链表 vs 全部分叉', 'blocks 只存主链，回滚时删除', '查询简单；被孤立的数据如需审计，删除前复制到 orphaned_blocks 表'],
  ['外键级联删除', 'ON DELETE CASCADE', '回滚只需删除 blocks，子表自动清理，不会遗漏'],
  ['数据量大时', '按 block_number 范围分区（示例：每 100 万块一个分区）', '旧分区可以只读、压缩、归档'],
  ['十六进制展示', "查询时 <code>'0x' || encode(hash, 'hex')</code>", '存储用二进制，展示时再转换']
])}

<h2>7. 确认数策略、多 RPC 校验、回填与对账</h2>
<h3>7.1 确认数：按链、按金额</h3>
<p>Tron、TON 的最终性与确认策略见 <a href="#m05-68">M06.11 Tron 与 TON</a>。</p>
${tbl(['链（示例）', '最终性类型', '小额', '大额'], [
  ['比特币', '概率最终性', '1–3 个确认', '6 个确认以上'],
  ['以太坊 L1', 'PoS 经济最终性', 'safe 标签', 'finalized（约 64–96 个块）'],
  ['BFT 链（CometBFT 等）', '确定最终性', '1 个块', '1 个块 + 风控延迟'],
  ['小市值 PoW 链', '概率最终性，算力可租', '数十个确认', '数百个确认，或人工审核'],
  ['L2 Rollup', '取决于排序器和 L1 结算', '排序器确认', '对应 L1 批次 finalized，见 <a href="#m05-5">M04.5</a>']
])}
<p><strong>算一算（示例）</strong>：一笔充值在高度 1,000 被打包。确认数定义为“链头高度 − 交易所在高度 + 1”。链头到 1,011 时，确认数 = 1,011 − 1,000 + 1 = 12，小额充值可以入账；大额充值要等该块进入 finalized。在<a href="#lab-confirm">确认数实验</a>中可以看到，确认数越多，被推翻的概率指数下降。</p>
<h3>7.2 多 RPC 交叉校验</h3>
${steps([
  '主源负责扫描；备源独立读取同一高度的区块哈希。',
  '对“已到达确认阈值”的高度做比对：两源哈希一致才允许 Confirmer 入账。',
  '不一致时：暂停该链的入账（扫描可以继续），触发告警，等两源收敛或人工确认。',
  '定期比较两源的链头高度，落后超过阈值（示例：5 个块）的源从路由中摘除。'
])}
<h3>7.3 回填与全量对账</h3>
${mm('实时扫描、回填、对账三条线并行', `
flowchart TB
  subgraph RT["实时线"]
    RT1["游标 transfers"] --> RT2["顺序扫描链头附近"]
  end
  subgraph BF["回填线"]
    BF1["游标 backfill"] --> BF2["按范围并发 eth_getLogs<br/>只处理 finalized 之前的区间"]
  end
  subgraph RC["对账线（每日）"]
    RC1["选取昨天的区块区间"] --> RC2["用备源重新拉取事件<br/>计算条数与金额汇总"]
    RC2 --> RC3{"与库中一致？"}
    RC3 -->|"是"| OK["记录对账通过"]
    RC3 -->|"否"| DIFF["输出差异明细并告警"]
  end
  BF2 --> DB[("transfers")]
  RT2 --> DB
  DB --> RC3
`, [
  ['flow', '实时线保证低延迟；回填线补历史或新增合约；对账线用独立数据源验证结果。三者用不同游标，互不干扰。'],
  ['key', '回填只处理已 finalized 的区间，所以可以放心用高度范围查询和并发，不用处理重组。'],
  ['fail', '回填区间和实时区间重叠时会重复写入。唯一键 + ON CONFLICT DO NOTHING 让重叠无害。'],
  ['limit', '事件级对账只能证明“日志都收齐了”。资产级对账还要比较地址余额：Σ(转入) − Σ(转出) 是否等于 balanceOf（需要归档节点查历史余额）。']
])}

<h2>8. 监控指标与告警</h2>
${tbl(['指标名（Prometheus 示例）', '含义', '告警阈值（示例）'], [
  ['<code>indexer_head_lag_blocks</code>', '链头高度 − 游标高度', '以太坊 &gt; 10 持续 2 分钟：警告；&gt; 50：严重'],
  ['<code>indexer_last_block_age_seconds</code>', '最近处理的区块距今多久', '&gt; 120 秒：严重（可能卡死）'],
  ['<code>rpc_request_errors_total{method,provider}</code>', 'RPC 错误计数', '5 分钟错误率 &gt; 5%：警告'],
  ['<code>rpc_request_duration_seconds</code>', 'RPC 延迟直方图', 'P99 &gt; 3 秒：警告'],
  ['<code>indexer_reorg_total</code> / <code>indexer_reorg_depth</code>', '重组次数与深度', '深度 ≥ 3：警告；深度 ≥ 确认阈值：严重'],
  ['<code>indexer_reverted_after_confirm_total</code>', '已确认后被回滚的事件数', '&gt; 0：立即严重告警（资金事故）'],
  ['<code>indexer_rpc_hash_mismatch_total</code>', '多源区块哈希不一致次数', '&gt; 0：警告，并暂停入账'],
  ['<code>indexer_reconcile_diff_total</code>', '每日对账差异条数', '&gt; 0：严重']
])}
${tryit(`<ol>
<li>在<a href="#lab-reorg">重组实验</a>中，把 N 设为 1，点“出一个新块”10 次，然后点“发生 3 块深度重组”。<strong>预期</strong>：出现“已入账后又被回滚”的事故。</li>
<li>把 N 设为 6，点“重置”，重复同样操作。<strong>预期</strong>：重组只影响待确认的充值，事故数为 0。</li>
<li>用 M01.7 的 Go 程序，给 HeaderByNumber 循环加上“父哈希校验”：连续读取 20 个区块头，检查每个块的 ParentHash 是否等于上一个块的 Hash()。<strong>预期</strong>：全部相等（主网上 finalized 之前偶尔会遇到 1 块重组）。</li>
</ol>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['区块、事件、游标同一事务提交', '防止崩溃后重复或漏数据', '在事务中途 kill -9，重启后数据一致'],
  ['每个块校验 parentHash', '唯一可靠的重组信号', '用假链测试注入 1 块和 3 块重组'],
  ['链头附近按 blockHash 拉日志', '防止区块头和日志来自不同分叉', '代码审查：实时线不用 fromBlock/toBlock'],
  ['最大重组深度保护', '超深重组意味着数据源异常或链出事故', '注入 100 块重组，进程停止推进并告警'],
  ['事件唯一键含 log_index', '同一交易多条日志', '批量转账交易产生多条记录'],
  ['合约白名单', '防假币事件', '假合约发出的 Transfer 不入库'],
  ['多源哈希校验后才确认', '防单点数据错误', '让备源返回不同哈希，入账暂停'],
  ['每日对账', '发现漏块和解析错误', '人为删除一条记录，次日对账报差异']
])}
${mistakes([
  ['只用高度判断是否处理过某个块。', '同一高度可能有不同区块。用 (高度, 哈希) 判断，并校验父哈希。'],
  ['并发拉块后谁先回来先写谁，速度最快。', '乱序写入会破坏游标和重组检测。并发拉取可以，写库必须按高度顺序。'],
  ['WebSocket 推送的日志直接入库就够了。', '断线会丢、重组会撤回。实时数据以按高度拉取为准，订阅只做唤醒。'],
  ['重组只会回滚 1 个块，写死回退 1 块即可。', '重组深度不固定。用找共同祖先算法，并设置最大深度保护。'],
  ['事件用 tx_hash 做唯一键。', '一笔交易可以有多条日志。事件表用 (chain_id, block_hash, log_index)。(tx_hash, log_index) 跨重组不稳定（交易被重新打包后 log_index 可能变），只适合配合“只约束活状态”的部分唯一索引用在业务记录上。']
])}
${recap([
  '四个角色：Fetcher 拿数据、Parser 解码、Store 原子写入、Confirmer 决定何时算数；另有 Reconciler 对账。',
  '顺序推进：读游标 → 拉 h+1 → 校验父哈希 → 按 blockHash 拉日志 → 一个事务写区块、事件、游标。',
  '重组回滚：逐块向回比较本地和链上哈希，找到共同祖先，一个事务删除其后数据并移动游标；超过最大深度就停。',
  '幂等靠唯一键 + ON CONFLICT DO NOTHING；事件唯一键必须包含 log_index。',
  '确认数按链类型和金额分档；入账前用多个 RPC 交叉校验区块哈希。',
  '监控落后高度、RPC 错误率、重组次数与深度、确认后回滚数、对账差异。'
])}
${quiz([
  { q: '本地游标在高度 500（哈希 0xaa）。新块 501 的父哈希是 0xbb。本地 499 的哈希等于链上 499 的哈希。重组深度是多少？', o: ['0', '2', '1', '无法确定'], a: 2, why: '共同祖先是 499，需要回滚的只有本地的 500 这 1 个块，所以深度为 1。' },
  { q: '为什么区块、事件和游标要在同一个数据库事务里提交？', o: ['防止进程中途崩溃导致重复处理或漏数据', '为了让查询更快', '因为 PostgreSQL 要求这样做', '为了减少 RPC 调用'], a: 0, why: '分开提交时，崩溃可能留下“事件已写、游标未动”或“游标已动、事件未写”的中间状态。同一事务保证要么全成功、要么全不发生。' },
  { q: '链头附近拉日志，最安全的查询方式是什么？', o: ['fromBlock = toBlock = 高度', '订阅 logs 后直接入库', '一次拉最近 1,000 个块', '按 blockHash 查询'], a: 3, why: '按 blockHash 查询保证日志属于你校验过的那个区块。按高度查询时，负载均衡后的节点可能返回另一个分叉的日志。' },
  { q: '指标 indexer_reverted_after_confirm_total 从 0 变成 1。说明什么？', o: ['RPC 节点限流', '有已确认（可能已入账）的事件被重组回滚，需要立即处理', '回填任务完成', '对账通过'], a: 1, why: '确认后被回滚意味着确认阈值不足或链发生了异常深度重组，属于资金事故，要立即告警并追查。' }
])}
${exercises([["计算题（示例）：本地游标在高度 2,010。新块 2,011 的父哈希和游标哈希不一致。向回比较时，2,010、2,009、2,008 的本地哈希都和链上不同，2,007 相同。共同祖先、重组深度各是多少？回滚后做什么？", "<p>共同祖先 = 2,007。重组深度 = 2,010 − 2,007 = 3。在一个事务里删除 2,008–2,010 的区块和事件，游标回到 (2,007, 该块哈希)。下一轮从 2,008 开始扫描新分叉。</p>"], ["计算题（示例）：一笔大额充值在高度 5,000 被打包，规则要求 64 个确认。确认数定义为“链头高度 − 交易所在高度 + 1”。链头到哪个高度时可以入账？", "<p>64 = head − 5,000 + 1，所以 head = 5,063。链头到 5,063 时确认数达标。以太坊 12 秒一块，从打包起约等 63 × 12 = 756 秒。</p>"], ["思考题：回填线为什么只处理已 finalized 的区间？这样做带来什么好处？", "<p>finalized 之前的区块不会再重组。回填线因此不需要处理重组，可以放心用高度范围查询和并发提速。如果回填区间和实时区间重叠，唯一键加 ON CONFLICT DO NOTHING 让重复写入无害。</p>"]])}
${checklist(["能画出 Fetcher、Parser、Store、Confirmer 架构，并说出每层失败时的处理。", "能写出找共同祖先的回滚函数，并加上最大深度保护。", "能为区块、事件、业务记录设计幂等唯一键，并说明事件唯一键为什么要含 log_index。", "能在一个数据库事务里写入区块、事件和游标。", "能列出索引器的关键监控指标和告警阈值。"])}
${terms([
  ['游标', 'Cursor', '记录已处理到的高度和区块哈希的持久化状态'],
  ['共同祖先', 'Common Ancestor', '旧链与新链分叉前最后一个相同的区块'],
  ['重组深度', 'Reorg Depth', '重组时被抛弃的本地区块数量'],
  ['回填', 'Backfill', '批量补扫历史区间数据的任务'],
  ['对账', 'Reconciliation', '用独立方法重新计算并与已有数据比对'],
  ['死信表', 'Dead Letter Table', '存放处理失败、需要人工排查的数据'],
  ['落后高度', 'Head Lag', '链头高度与索引器游标高度之差']
])}
` });
})();
