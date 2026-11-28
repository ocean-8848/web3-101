/* ---------- M09 子文章（2）：m04-4 ~ m04-6 ---------- */
(() => {

CUR = 'm04-4';
addCh({ id: 'm04-4', nav: '订单与撮合', title: 'M09.5 订单与撮合：状态机、订单簿数据结构与撮合引擎', desc: '订单状态机、价格档位 + FIFO 队列、Go 撮合实现、事件溯源与主备切换。', html: `
<h1>M09.5 订单与撮合：状态机、订单簿数据结构与撮合引擎</h1>
${meta(['画出订单状态机，说出每个状态转换由谁触发。', '设计订单簿数据结构（价格档位 + FIFO 队列 + 撤单索引），并写出撮合算法。', '解释单线程确定性、事件溯源、快照 + 日志重放和主备切换如何让撮合引擎可恢复。'], '<a href="#m04-1">M09.2 交易所业务入门</a>、<a href="#m04-3">M09.4 账本设计</a>', ['orderbook'])}
${beginner(`<p><b>状态机（State Machine）</b>：一个对象只能处在有限个状态之一，只能按规定的路线从一个状态变到另一个状态。订单就是一个状态机。</p>
<p><b>队列（Queue）/ FIFO</b>：先进先出（First In First Out）的排队结构，像超市收银台。</p>
<p><b>红黑树 / 跳表</b>：两种能保持元素有序、并且插入删除都很快（O(log n)）的数据结构。</p>
<p><b>O(1) / O(log n)</b>：算法复杂度写法。O(1) 表示操作耗时和数据量无关；O(log n) 表示数据翻倍，耗时只多一步。</p>
<p><b>确定性（Determinism）</b>：同样的输入、同样的顺序，永远得到同样的输出。</p>
<p><b>事件溯源（Event Sourcing）</b>：不直接保存“当前状态”，而是保存“发生过的所有事件”。当前状态可以从事件重新算出来。</p>`)}

<h2>1. 一句话理解</h2>
${one('撮合引擎是一个单线程、全内存、确定性的程序：它按顺序读入订单命令，按“价格优先、时间优先”配对，输出成交事件。它不碰钱；它的全部状态可以从输入日志重新算出来。')}
${call('analogy', `<p>撮合引擎像一个只有一个窗口的拍卖师。所有出价写在纸条上，按到达顺序排成一队递给他。他一次只看一张纸条，对照黑板上的报价表决定成交还是写上黑板。只要把纸条按同样顺序再递一遍，黑板最后的样子一定相同。</p>
<p>类比的局限：真实引擎每秒处理几十万到上百万张“纸条”，而且要考虑撤单、自成交防护、条件单触发等规则。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m04-4"><div class="mmd-title"><span>一图看懂：订单簿与一笔市价单的成交</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 248" role="img" aria-label="订单簿买卖盘与市价单逐档成交"><text x="160" y="26" font-size="13" text-anchor="middle" fill="var(--risk)" font-weight="700">卖单（asks）</text><text x="160" y="234" font-size="13" text-anchor="middle" fill="var(--ok)" font-weight="700">买单（bids）</text><rect x="200" y="38" width="120" height="20" rx="3" fill="var(--risk-soft)" stroke="var(--risk)"/><text x="190" y="53" font-size="12" text-anchor="end" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">100.30</text><text x="326.0" y="53" font-size="11.5" text-anchor="start" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">2.0</text><rect x="200" y="64" width="90" height="20" rx="3" fill="var(--risk-soft)" stroke="var(--risk)"/><text x="190" y="79" font-size="12" text-anchor="end" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">100.20</text><text x="296.0" y="79" font-size="11.5" text-anchor="start" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">1.5</text><rect x="200" y="90" width="48" height="20" rx="3" fill="var(--risk-soft)" stroke="var(--risk)"/><text x="190" y="105" font-size="12" text-anchor="end" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">100.10</text><text x="254.0" y="105" font-size="11.5" text-anchor="start" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">0.8</text><text x="140" y="132" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">价差 0.10</text><rect x="200" y="140" width="72" height="20" rx="3" fill="var(--ok-soft)" stroke="var(--ok)"/><text x="190" y="155" font-size="12" text-anchor="end" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">100.00</text><text x="278.0" y="155" font-size="11.5" text-anchor="start" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">1.2</text><rect x="200" y="166" width="150" height="20" rx="3" fill="var(--ok-soft)" stroke="var(--ok)"/><text x="190" y="181" font-size="12" text-anchor="end" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">99.90</text><text x="356.0" y="181" font-size="11.5" text-anchor="start" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">2.5</text><rect x="200" y="192" width="180" height="20" rx="3" fill="var(--ok-soft)" stroke="var(--ok)"/><text x="190" y="207" font-size="12" text-anchor="end" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">99.80</text><text x="386.0" y="207" font-size="11.5" text-anchor="start" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">3.0</text><rect x="198" y="88" width="52" height="24" rx="4" fill="none" stroke="var(--warn)" stroke-width="2.5"/><rect x="198" y="62" width="76" height="24" rx="4" fill="none" stroke="var(--warn)" stroke-width="2.5" stroke-dasharray="4 3"/><rect x="450" y="40" width="290" height="150" rx="10" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="1.5"/><text x="595" y="66" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">来了一笔市价买单：2.0</text><text x="470" y="94" font-size="12.5" text-anchor="start" fill="var(--ink)">① 先吃最便宜的卖单：100.10 × 0.8</text><text x="470" y="118" font-size="12.5" text-anchor="start" fill="var(--ink)">② 不够，再吃下一档：100.20 × 1.2</text><text x="470" y="146" font-size="12.5" text-anchor="start" fill="var(--ink)">均价 = (80.08 + 120.24) ÷ 2</text><text x="470" y="170" font-size="12.5" text-anchor="start" fill="var(--ink)" font-weight="700">= 100.16，比最优价贵 0.06</text><line x1="445" y1="100" x2="280" y2="100" stroke="var(--warn)" stroke-width="2"/><path d="M280.0 100.0 L287.2 96.5 L287.2 103.5 z" fill="var(--warn)"/></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>撮合按价格优先：市价买单从最低的卖价开始吃，一档不够就吃下一档。</span></li><li><span class="chip key">关键</span><span>成交均价取决于盘口厚度；盘口越薄，大单的滑点越大。</span></li><li><span class="chip limit">局限</span><span>图中数字是示例。真实撮合还要按时间优先处理同价位的多张订单。</span></li></ul></figcaption></figure>

<h2>2. 订单状态机</h2>
${mm('订单状态机', `
stateDiagram-v2
  state "新建 New" as New
  state "已接受 Accepted" as Accepted
  state "部分成交 PartiallyFilled" as Partial
  state "完全成交 Filled" as Filled
  state "已撤销 Canceled" as Canceled
  state "拒绝 Rejected" as Rejected
  [*] --> New: 网关收到请求
  New --> Rejected: 参数错误或风控拒绝或余额不足
  New --> Accepted: 账本冻结成功并送入撮合
  Accepted --> Partial: 成交一部分
  Accepted --> Filled: 一次成交全部
  Partial --> Partial: 继续成交
  Partial --> Filled: 剩余全部成交
  Accepted --> Canceled: 用户撤单或 IOC 剩余撤销
  Partial --> Canceled: 撤销剩余部分
  Accepted --> Rejected: Post-only 会成交或 FOK 不能全成交
  Filled --> [*]
  Canceled --> [*]
  Rejected --> [*]
`, [
  ['flow', '订单服务负责 New → Accepted/Rejected；撮合引擎负责成交与撤单相关的转换。'],
  ['key', '终态只有三个：完全成交、已撤销、拒绝。进入终态后不能再变化，冻结余额必须在进入终态时全部处理完（扣完或解冻）。有的交易所还有“已过期（EXPIRED）”终态：IOC / FOK 的剩余部分、因自成交防护被撤的订单记为过期，而不是撤销或拒绝。命名不同、语义相同，以各交易所文档为准。'],
  ['fail', '“部分成交后撤销”最容易出错：已成交部分要结算，未成交部分要解冻。两件事分别由成交事件和撤单事件驱动。'],
  ['limit', '有的交易所把“部分成交后撤销”单独列为一种状态（PARTIALLY_CANCELED）。命名不同，语义相同。']
])}
${tbl(['字段', '含义', '示例'], [
  ['order_id', '系统生成的全局唯一 ID（常用雪花算法 Snowflake）', '178234991230001'],
  ['client_order_id', '客户端传入的幂等号', 'bot-20261023-0001'],
  ['symbol / side / type / tif', '交易对、方向、类型、有效期', 'BTCUSDT / BUY / LIMIT / GTC'],
  ['price / orig_qty', '委托价格与委托数量（定点数）', '60000.00 / 0.50000'],
  ['executed_qty / cum_quote', '累计成交数量与成交额', '0.20000 / 12000.00'],
  ['status', '状态机当前状态', 'PARTIALLY_FILLED'],
  ['seq', '撮合引擎分配的序列号，决定处理顺序', '88812001']
])}

<h2>3. 订单簿数据结构</h2>
<p>订单簿要同时支持四种操作，而且都要快：</p>
${steps(['找到最优价格（买一或卖一）：每次撮合都要用。', '按价格插入新档位：限价单挂单时用。', '同一价格内按时间顺序取出：保证时间优先。', '按订单 ID 撤单：撤单量通常远多于成交量（做市商不停改价）。'])}
${mm('订单簿内存结构：有序价格档位 + FIFO 队列 + 撤单索引', `
flowchart LR
  subgraph ASK["卖方：价格升序（红黑树或跳表）"]
    A1["60,100<br/>总量 0.8"] --> A2["60,150<br/>总量 1.2"] --> A3["60,200<br/>总量 2.0"]
  end
  subgraph Q["60,100 档位内的 FIFO 双向链表"]
    O1["#101 0.3"] --> O2["#105 0.4"] --> O3["#112 0.1"]
  end
  A1 --> O1
  IDX[("撤单索引<br/>哈希表 order_id → 链表节点")] -.->|"O(1) 定位"| O2
  NEW["新卖单 60,100"] -->|"追加到队尾"| O3
`, [
  ['flow', '新订单先按价格找到档位（O(log n)），再追加到该档位队尾（O(1)）。'],
  ['key', '撤单索引直接指向链表节点，双向链表删除节点是 O(1)。不用遍历整个档位。'],
  ['fail', '撤单后如果档位变空，必须同时从价格树中删掉该档位，否则“最优价格”会指向空档位。'],
  ['limit', '这张图只画了卖方。买方结构相同，只是价格降序。']
])}
${tbl(['价格档位结构', '找最优价', '插入新档位', '优点', '缺点'], [
  ['红黑树 / AVL 树', 'O(log n)（可缓存最左节点为 O(1)）', 'O(log n)', '通用，库成熟', '指针多，缓存不友好'],
  ['跳表 Skip List', 'O(1)（头节点）', '平均 O(log n)', '实现简单，便于并发读', '内存开销偏大'],
  ['数组（按 tick 下标）', 'O(1)（维护最优指针）', 'O(1)', '极快，缓存友好', '价格范围必须有限；稀疏时浪费内存'],
  ['有序数组 + 二分', 'O(1)', 'O(n) 移动元素', '档位少时很快', '档位多时插入慢']
])}
${call('info', `<p>价格和数量在撮合引擎里一律用整数：价格 = 实际价格 ÷ tickSize，数量 = 实际数量 ÷ stepSize。例如 tickSize = 0.01 时，60,000.00 存为 6,000,000。整数比较快，而且没有浮点误差。</p>`)}

<h2>4. 撮合算法：伪代码与 Go 实现</h2>
${code('伪代码', `
# 伪代码：处理一张新订单 taker
function submit(taker):
    book_opp = (taker.side == BUY) ? asks : bids      # 对手方
    while taker.qty > 0 and book_opp 非空:
        level = book_opp.best()                        # 最优档位
        if taker 是限价单 and 价格不交叉(taker.price, level.price):
            break
        for maker in level.queue (从队首开始):        # 时间优先
            if maker.user == taker.user: 按自成交防护规则处理
            q = min(taker.qty, maker.qty)
            成交价 = level.price                        # 取 Maker 价格
            输出 Trade(taker, maker, 成交价, q)
            taker.qty -= q ; maker.qty -= q
            if maker.qty == 0: 从队列和撤单索引中删除 maker
            if taker.qty == 0: break
        if level.queue 为空: 从 book_opp 删除 level
    if taker.qty > 0:
        if taker.tif == GTC and 限价单: 挂入本方订单簿
        else: 输出 Canceled(taker, 剩余数量)
`)}
${code('GO', `
package matching

import (
	"container/list"

	"github.com/emirpasic/gods/trees/redblacktree"
	"github.com/emirpasic/gods/utils"
)

type Side int8

const (
	Buy  Side = 1
	Sell Side = 2
)

type Order struct {
	ID, UserID int64
	Side       Side
	Price      int64 // 整数 tick；市价单忽略
	Qty        int64 // 剩余数量，整数 lot
	Market     bool
}

type Level struct {
	Price  int64
	Total  int64      // 档位总量，用于深度推送
	Orders *list.List // FIFO 双向链表，元素为 *Order
}

type Trade struct {
	Seq              uint64
	TakerID, MakerID int64
	Price, Qty       int64
	TakerSide        Side
}

type Book struct {
	bids, asks *redblacktree.Tree     // key: price(int64) → *Level
	index      map[int64]*list.Element // order_id → 链表节点，O(1) 撤单
	levelOf    map[int64]*Level
	seq        uint64 // 单调递增序列号，保证输出可重放比对
}

func NewBook() *Book {
	return &Book{
		bids:    redblacktree.NewWith(func(a, b interface{}) int { return -utils.Int64Comparator(a, b) }), // 降序
		asks:    redblacktree.NewWith(utils.Int64Comparator),                                           // 升序
		index:   map[int64]*list.Element{},
		levelOf: map[int64]*Level{},
	}
}

func crosses(o *Order, levelPrice int64) bool {
	if o.Market {
		return true
	}
	if o.Side == Buy {
		return levelPrice <= o.Price
	}
	return levelPrice >= o.Price
}

// 示例简化：未实现 tif（IOC / FOK）、自成交防护（STP）与剩余撤销事件，市价单剩余直接丢弃；完整逻辑以伪代码为准。
// Submit 只能被单线程调用。返回成交列表；未成交的限价剩余部分挂入订单簿。
func (b *Book) Submit(o *Order) []Trade {
	opp := b.asks
	if o.Side == Sell {
		opp = b.bids
	}
	var trades []Trade
	for o.Qty > 0 && !opp.Empty() {
		lv := opp.Left().Value.(*Level) // 最优档位
		if !crosses(o, lv.Price) {
			break
		}
		for e := lv.Orders.Front(); e != nil && o.Qty > 0; {
			m := e.Value.(*Order)
			q := min(o.Qty, m.Qty)
			o.Qty -= q
			m.Qty -= q
			lv.Total -= q
			b.seq++
			trades = append(trades, Trade{Seq: b.seq, TakerID: o.ID, MakerID: m.ID, Price: lv.Price, Qty: q, TakerSide: o.Side})
			next := e.Next()
			if m.Qty == 0 { // Maker 完全成交：移出队列和索引
				lv.Orders.Remove(e)
				delete(b.index, m.ID)
				delete(b.levelOf, m.ID)
			}
			e = next
		}
		if lv.Orders.Len() == 0 {
			opp.Remove(lv.Price)
		}
	}
	if o.Qty > 0 && !o.Market {
		b.rest(o)
	}
	return trades
}

func (b *Book) rest(o *Order) {
	tree := b.bids
	if o.Side == Sell {
		tree = b.asks
	}
	var lv *Level
	if v, ok := tree.Get(o.Price); ok {
		lv = v.(*Level)
	} else {
		lv = &Level{Price: o.Price, Orders: list.New()}
		tree.Put(o.Price, lv)
	}
	b.index[o.ID] = lv.Orders.PushBack(o) // 追加到队尾：时间优先
	b.levelOf[o.ID] = lv
	lv.Total += o.Qty
}

// Cancel 返回被撤销的剩余数量；订单不存在（已成交或已撤）返回 0
func (b *Book) Cancel(id int64) int64 {
	e, ok := b.index[id]
	if !ok {
		return 0
	}
	o, lv := e.Value.(*Order), b.levelOf[id]
	lv.Orders.Remove(e)
	lv.Total -= o.Qty
	delete(b.index, id)
	delete(b.levelOf, id)
	if lv.Orders.Len() == 0 {
		if o.Side == Buy {
			b.bids.Remove(lv.Price)
		} else {
			b.asks.Remove(lv.Price)
		}
	}
	return o.Qty
}
`)}
<p>先在实验里提交“市价买 3 BTC”，对照上面的 <code>Submit</code> 循环：外层 for 每次取一个最优档位，内层 for 按队列顺序吃单。再提交一张不交叉的限价单，看它走 <code>rest</code> 分支成为新挂单。</p>
${lab('orderbook')}
<p><b>算一算（示例）</b>：卖方 60,100 档有三张单：#101 0.3、#105 0.4、#112 0.1。新买单限价 60,100、数量 0.5。</p>
${steps(['取最优卖档 60,100，买价 ≥ 60,100，价格交叉。', '队首 #101：成交 min(0.5, 0.3) = 0.3，#101 完全成交并移除；买单剩 0.2。', '下一张 #105：成交 min(0.2, 0.4) = 0.2；#105 剩 0.2，留在原位置（时间优先不变）；买单剩 0。', '输出 2 笔成交，价格都是 60,100；档位总量从 0.8 变为 0.3。'])}

<h2>5. 单线程确定性、事件溯源与主备切换</h2>
<p>为什么不用多线程？同一个交易对的订单必须严格排序处理，否则“谁先谁后”不确定，时间优先就失去意义。多线程加锁的开销也比单线程纯内存计算大。所以业界通常<b>一个交易对一个线程</b>（或一个线程负责若干交易对），不同交易对之间并行。LMAX Disruptor 是这种“单线程业务逻辑 + 无锁环形队列”架构的代表。</p>
${mm('撮合引擎：定序输入 → 单线程撮合 → 事件输出 → 快照与重放', `
flowchart LR
  OS["订单服务<br/>已冻结的订单"] --> SEQ["定序器<br/>分配全局 seq"]
  SEQ --> LOG[("输入日志<br/>Kafka 分区或 WAL")]
  LOG --> ME["撮合主节点<br/>单线程内存订单簿"]
  LOG --> BK["撮合备节点<br/>同样消费同样日志"]
  ME --> OUT[("输出事件<br/>成交 · 撤单 · 订单更新")]
  ME --> SNAP[("定期快照<br/>订单簿 + 最后 seq")]
  OUT --> SETT["清算结算"]
  OUT --> MD["行情服务"]
  SNAP -.->|"重启时加载"| ME
`, [
  ['flow', '输入先持久化再撮合。任何节点都可以从“快照 + 快照之后的输入日志”重建出完全相同的订单簿。'],
  ['key', '备节点消费同一份输入日志，内存状态和主节点一致，但不对外输出。主节点故障时，备节点从最后已输出的 seq 之后接管。'],
  ['fail', '撮合逻辑里出现任何不确定因素（读当前时间、遍历 Go map、随机数、浮点数），重放结果就会和原来不同。'],
  ['risk', '主备同时认为自己是主（脑裂）会输出两份成交。必须用租约（如 etcd lease）或单写者分区保证同一时刻只有一个主。']
])}
${steps(['<b>定序</b>：每条命令（下单、撤单）在进入撮合前获得唯一递增的 seq，并写入持久日志。', '<b>撮合</b>：引擎按 seq 顺序逐条处理；时间戳由定序器写入命令，引擎内部不读系统时钟。', '<b>输出</b>：每条输出事件带上输入 seq 和输出序号，下游据此去重和检测缺口。', '<b>快照</b>：每 N 条命令或每 M 秒（示例：每 100 万条或 60 秒），把订单簿序列化保存，记录“截至 seq = S”。', '<b>恢复</b>：加载最近快照，从 seq = S + 1 开始重放日志，直到追上最新位置，再开始对外服务。', '<b>主备切换</b>：备节点获得租约后，先确认已处理到主节点最后输出的 seq，再接管输出。'])}
${call('deep', `<p>确定性回放测试是撮合引擎最重要的测试：把生产一天的输入日志在测试环境重放，输出的成交序列逐条和生产输出比对，必须完全一致（字节级）。任何不一致都说明引擎里有不确定因素。见 <a href="#m04-10">M09.11 实战</a>的测试部分。</p>`)}
${tbl(['性能指标', '含义', '参考目标（示例）'], [
  ['吞吐 TPS', '每秒处理的命令数（单交易对）', '10 万 – 100 万'],
  ['撮合延迟', '命令进入引擎到输出事件', 'P99 < 100 微秒'],
  ['端到端延迟', 'API 收到请求到返回下单结果', 'P99 < 10 毫秒'],
  ['恢复时间 RTO', '主节点故障到备节点接管', '< 10 秒'],
  ['数据丢失 RPO', '故障时丢失的已确认命令', '0（输入先持久化）']
])}

<h2>6. 工程细节：自成交防护、撮合与账本的边界</h2>
${tbl(['话题', '规则', '为什么'], [
  ['自成交防护 STP', '同一用户（或同一组账户）的买单和卖单相遇时，撤销新单、撤销旧单或两者都撤（三种策略，示例）', '防止刷量和意外的自买自卖'],
  ['先冻结后撮合', '订单服务调用账本冻结成功后，才把订单送入撮合', '撮合引擎不查余额，保证速度'],
  ['撮合不写账本', '撮合只输出成交事件，结算服务消费事件后记账', '撮合必须快且无外部依赖'],
  ['价格保护', '市价单成交价偏离最新价超过阈值（示例 5%）的部分撤销', '防止深度薄时被打穿'],
  ['交易对暂停', '引擎支持“只撤不下”和“全部暂停”状态', '异常行情和上新时使用']
])}

${tryit(`<p>本地运行上面的 Go 撮合代码：</p>
<ol><li>新建目录，执行 <code>go mod init demo && go get github.com/emirpasic/gods</code>（Go 1.21 及以上，代码用了内置 min）。</li>
<li>把撮合代码保存为 <code>matching/book.go</code>，写一个 <code>main.go</code>：挂三张卖单（60100×3、60105×4、60110×1，单位 lot），再提交一张买单 60105×5。</li>
<li>预期结果：输出 2 笔成交：(60100, 3)、(60105, 2)；卖方 60105 档剩 2，60110 档剩 1。</li>
<li>调用 <code>Cancel</code> 撤掉 60110 那张单，再打印卖方最优档位，确认仍是 60105。</li></ol>`)}

${mistakes([
  ['撮合引擎越多线程越快。', '同一交易对必须串行处理才能保证时间优先和确定性。并行发生在不同交易对之间。'],
  ['撮合时要检查用户余额。', '余额在下单前由账本冻结。撮合引擎只依赖订单本身，不访问外部服务。'],
  ['撤单只要从数组里找到订单删掉。', '大规模撤单必须用 order_id → 节点的索引实现 O(1) 定位，否则撤单会拖慢整个引擎。'],
  ['主节点宕机后备节点直接接管就行。', '必须先确认备节点处理到的 seq 不落后于主节点最后输出的 seq，并且用租约防止脑裂。']
])}
${recap(['订单状态机：新建 → 已接受 → 部分成交 → 完全成交 / 已撤销 / 拒绝；终态时冻结必须处理完。', '订单簿 = 有序价格档位（树/跳表/数组）+ 档位内 FIFO 队列 + 撤单哈希索引。', '撮合规则：价格优先、时间优先、成交价取 Maker 价格。', '单线程 + 内存 + 定序输入日志 = 确定性；快照 + 日志重放 = 可恢复。', '主备消费同一日志，靠租约防脑裂；撮合不碰钱，只输出事件。'])}
${quiz([
  { q: '撮合引擎内部为什么不能直接调用 time.Now()？', o: ['time.Now() 太慢', '重放时时间不同，会导致输出和原来不一致', 'Go 不允许在撮合中使用时间', '时间只能由数据库提供'], a: 1, why: '确定性要求同样输入产生同样输出。时间应由定序器写入命令。速度和语言限制不是原因。' },
  { q: '订单簿中撤单要做到 O(1)，关键是？', o: ['把订单簿存进数据库', '每次撤单重建订单簿', '用跳表代替红黑树', '用哈希表把 order_id 映射到双向链表节点'], a: 3, why: '哈希表 O(1) 找到节点，双向链表 O(1) 删除节点。跳表只影响找价格档位的速度。' },
  { q: '一张限价买单部分成交后被用户撤销，账本需要？', o: ['已成交部分按成交事件结算，未成交部分解冻', '全部解冻', '全部扣减', '不做处理，等待日终'], a: 0, why: '成交事件驱动扣减与入账，撤单事件驱动解冻剩余冻结。B 会让已成交部分不付钱；C 会多扣钱。' },
  { q: '主备撮合节点同时对外输出成交，最可能的原因是？', o: ['快照太大', '撤单索引失效', '脑裂：缺少租约或单写者机制', '价格精度不对'], a: 2, why: '两个节点都认为自己是主，就会都输出。需要分布式租约保证唯一主。其余选项不会造成双份输出。' }
])}
${exercises([["计算题（示例）：卖方 60,100 档有 #201 0.5、#204 0.2；60,120 档有 #209 1.0。新买单是 GTC 限价 60,110，数量 1.0。写出撮合结果和订单簿的变化。", "<p>最优卖档 60,100 ≤ 60,110，价格交叉。队首 #201 成交 0.5，#204 成交 0.2，两张都完全成交并移除。买单剩 0.3。</p><p>60,100 档变空，从价格树中删除。下一档 60,120 > 60,110，不交叉，停止撮合。</p><p>输出 2 笔成交，价格都是 60,100。剩余 0.3 是 GTC 限价单，挂入买方订单簿，成为 60,110 的新买一。</p>"], ["思考题：撮合代码里遍历 Go map 来决定先处理哪张订单，会破坏什么？", "<p>Go map 的遍历顺序是随机的。同样的输入在两次运行中可能得到不同的处理顺序和不同的成交。</p><p>这破坏了确定性。快照 + 日志重放得到的订单簿会和原来不同，备节点状态也会和主节点不一致。</p><p>撮合内部只能依赖按 seq 排好的命令和有序的数据结构。</p>"], ["设计题（示例）：撮合节点在快照“截至 seq = 1,000,000”之后又处理到 seq = 1,000,350 时崩溃。写出恢复步骤。", "<p>第一步：加载最近快照，得到 seq = 1,000,000 时的订单簿。</p><p>第二步：从输入日志的 seq = 1,000,001 开始重放，共 350 条命令，直到追上最新位置。</p><p>第三步：下游按输出事件里的 seq 去重，因为崩溃前可能已输出过部分事件。追上之后再对外服务。</p>"]])}
${checklist(["能画出订单状态机，并说出每个转换由订单服务还是撮合引擎触发。", "能设计“有序价格档位 + FIFO 双向链表 + 撤单哈希索引”的订单簿，并说出各操作的复杂度。", "能按价格优先、时间优先手工推演一张限价单的撮合结果。", "能列出破坏撮合确定性的因素：读系统时钟、遍历 map、随机数、浮点数。", "能说出主备切换前必须确认的两件事：备节点 seq 不落后、旧主已失去租约。"])}
${terms([
  ['订单状态机', 'Order State Machine', '订单在新建、成交、撤销、拒绝等状态间的合法转换规则'],
  ['价格档位', 'Price Level', '订单簿中同一价格的所有订单的集合'],
  ['价格优先时间优先', 'Price-Time Priority', '先比价格，同价按到达时间排序的撮合规则'],
  ['撮合引擎', 'Matching Engine', '在内存中维护订单簿并产生成交的程序'],
  ['定序器', 'Sequencer', '为输入命令分配唯一递增序号的组件'],
  ['事件溯源', 'Event Sourcing', '保存事件序列而非状态，状态由重放事件得到'],
  ['快照', 'Snapshot', '某个序号时刻的完整状态副本，用于加速恢复'],
  ['自成交防护', 'Self-Trade Prevention, STP', '阻止同一用户的买卖单相互成交的规则'],
  ['脑裂', 'Split Brain', '集群中多个节点同时认为自己是主节点的故障']
])}
` });

CUR = 'm04-5';
addCh({ id: 'm04-5', nav: '清算结算与手续费', title: 'M09.6 清算结算与手续费：从成交回报到账本分录', desc: '成交回报如何变成分录：双方手续费、平台币抵扣、幂等重试、outbox、精度舍入与返佣。', html: `
<h1>M09.6 清算结算与手续费：从成交回报到账本分录</h1>
${meta(['把一笔成交回报完整映射成账本分录，包括双方手续费和平台币抵扣。', '设计幂等、可重试的结算消费者，并用 outbox 模式保证账本与消息的一致性。', '说出手续费精度与舍入规则、返佣计算和日终结算报表的内容。'], '<a href="#m04-3">M09.4 账本设计</a>、<a href="#m04-4">M09.5 订单与撮合</a>', ['ledger'])}
${beginner(`<p><b>清算（Clearing）</b>：算清楚每一方该收多少、该付多少、手续费多少。</p>
<p><b>结算（Settlement）</b>：把清算结果真正记到账上，钱从一方转到另一方。在 CEX 里，结算就是写账本分录。</p>
<p><b>成交回报（Execution Report / Trade Event）</b>：撮合引擎输出的一条消息：“订单 A 和订单 B 以价格 P 成交了数量 Q”。</p>
<p><b>消息队列（Message Queue）</b>：服务之间传递消息的中间件，例如 Kafka。发送方写入，接收方按顺序读取。</p>
<p><b>舍入（Rounding）</b>：把多位小数变成规定位数，例如向上取整（Round Up）或向下取整（Round Down）。</p>`)}

<h2>1. 一句话理解</h2>
${one('结算服务把撮合引擎的每一条成交回报，翻译成一组借贷平衡的账本分录：买方付计价币、卖方付基础币、双方各付手续费，平台手续费账户收钱。它必须幂等、可重试、不丢不重。')}
${call('analogy', `<p>撮合引擎像足球比赛的裁判，只宣布比分；结算服务像财务部，根据比分发奖金、扣罚款、给经纪人分成。裁判不碰钱。财务部可以晚几秒发，但绝对不能发两次，也不能漏发。</p>
<p>类比的局限：财务部发错钱可以追回；交易所结算错一笔，用户可能已经把钱提走了。所以结算必须在提币之前完成且正确。</p>`)}
${art('一图看懂：一条成交回报，翻成一组借贷平衡的账本分录', 660, 330, [
  S.box(10, 80, 170, 100, { k: 'info', icon: 'doc', t: '成交回报', s: 'Alice 买 0.15 BTC\n@ 61,234.56\n卖方 Bob' }),
  S.box(230, 80, 140, 100, { k: 'key', icon: 'gear', t: '结算服务', s: '借贷平衡\n幂等 · 可重试' }),
  S.box(420, 22, 230, 56, { k: 'info', icon: 'person', t: 'Alice（Taker 买）', s: '实收 0.14985 BTC', mono: 1 }),
  S.box(420, 98, 230, 56, { k: 'info', icon: 'person', t: 'Bob（Maker 卖）', s: '实收 9,177.835852 USDT', mono: 1 }),
  S.box(420, 174, 230, 56, { k: 'tint', icon: 'bank', t: '平台手续费账户', s: '0.00015 BTC + 7.348148 USDT', mono: 1 }),
  S.box(230, 216, 140, 52, { k: 'warn', icon: 'check', t: '幂等键', s: 'trade_id 9001', mono: 1 }),
  S.arrow(182, 130, 228, 130),
  S.arrow(372, 100, 418, 56), S.arrow(372, 130, 418, 126), S.arrow(372, 160, 418, 198),
  S.arrow(300, 182, 300, 214, { k: 'warn' }),
  S.text(330, 306, '成交额 9,185.184 USDT；费率 Taker 0.1%，Maker 0.08%（示例）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '结算服务读一条成交回报，算出双方实收和手续费，写成一组分录。借贷必须平衡。'],
  ['key', '手续费从各自收到的那一边扣：Alice 收 BTC 扣 BTC，Bob 收 USDT 扣 USDT，都进平台手续费账户。'],
  ['fail', '消息会重试，所以用 trade_id 做幂等键：同一条回报只记一次，不能漏也不能重。'],
  ['limit', '图中的数字和费率是示例，舍入规则（向上取整到 6 位）见正文第 4 节。']
], '一条成交回报经结算服务变成买方卖方实收和平台手续费三组分录，用成交号保证只记一次', 'm04-5')}

<h2>2. 一笔成交回报到账本分录的完整映射</h2>
<p>成交回报（示例）：<code>{trade_id: 9001, symbol: BTCUSDT, price: 61234.56, qty: 0.15, taker: 买方 Alice(订单 A), maker: 卖方 Bob(订单 B)}</code>。费率（示例）：Taker 0.1%，Maker 0.08%。</p>
<p><b>算一算（示例）</b>：</p>
${steps(['成交额 = 0.15 × 61,234.56 = 9,185.184 USDT。', 'Alice 是 Taker 买方。她收到 BTC，手续费从收到的 BTC 里扣：0.15 × 0.1% = 0.00015 BTC。Alice 实收 0.14985 BTC。', 'Bob 是 Maker 卖方。他收到 USDT，手续费 = 9,185.184 × 0.08% = 7.3481472 USDT。按“手续费向上取整到 6 位小数”（示例规则）得 7.348148 USDT。Bob 实收 9,185.184 − 7.348148 = 9,177.835852 USDT。', 'Alice 下单时按限价冻结了 USDT。成交扣减冻结 9,185.184 USDT。如果她的限价高于成交价，多冻结的差额在订单终态时解冻（见下一段）。', 'Bob 下单时冻结了 0.15 BTC，成交扣减冻结 0.15 BTC。'])}
${tbl(['分录', '借（减少负债 / 增加资产）', '贷（增加负债 / 收入）', '金额'], [
  ['USDT 腿', 'Alice·USDT·冻结', 'Bob·USDT·可用', '9,177.835852'],
  ['USDT 腿', '（同上一行借方，合计 9,185.184）', '平台手续费·USDT', '7.348148'],
  ['BTC 腿', 'Bob·BTC·冻结', 'Alice·BTC·可用', '0.14985'],
  ['BTC 腿', '（同上一行借方，合计 0.15）', '平台手续费·BTC', '0.00015']
])}
<p>检查：USDT 借 9,185.184 = 贷 9,177.835852 + 7.348148 ✓；BTC 借 0.15 = 贷 0.14985 + 0.00015 ✓。</p>
${call('info', `<p><b>限价买单的“价格改善”</b>：Alice 限价 61,300 买 0.15，冻结 9,195 USDT；实际以 Maker 价 61,234.56 成交，只花 9,185.184。差额 9.816 USDT 在订单进入终态（完全成交或撤销）时一次性解冻。很多交易所对买单按“限价 × 数量”冻结，所以结算服务必须跟踪每张订单的“剩余冻结额”。</p>`)}
<h3>2.1 平台币抵扣手续费</h3>
<p>Alice 开启平台币抵扣（示例：平台币 PTC 价格 600 USDT，抵扣打 75 折）。Taker 手续费原本是 0.00015 BTC：</p>
${steps(['手续费折算 USDT = 0.00015 × 61,234.56 = 9.185184 USDT。', '打 75 折 = 6.888888 USDT。', '折算 PTC = 6.888888 ÷ 600 = 0.01148148 PTC（向上取整到 8 位）。', '分录变化：Alice 实收完整 0.15 BTC；另写一组分录“借 Alice·PTC·可用 0.01148148 / 贷 平台手续费·PTC 0.01148148”。', '如果 Alice 的 PTC 余额不足，退回到“从收到的币中扣费”的默认方式。'])}
${mm('成交回报 → 清算计算 → 账本分录', `
flowchart TB
  T["成交回报 trade_id=9001<br/>价格 · 数量 · Taker · Maker"] --> F["费率查询<br/>用户 VIP 等级 · 做市协议"]
  F --> C["清算计算<br/>成交额 · 双方手续费 · 舍入"]
  C --> D{"Taker 开启<br/>平台币抵扣且余额足够？"}
  D -->|"是"| E1["手续费改为 PTC<br/>Taker 实收全额"]
  D -->|"否"| E2["手续费从收到的币中扣"]
  E1 --> L["生成分录组<br/>biz_id = TRADE:9001"]
  E2 --> L
  L --> P["账本 Post<br/>单事务 + 唯一键"]
  P --> R["订单剩余冻结检查<br/>终态时解冻差额"]
  P --> EV["余额变动事件<br/>推送给用户"]
`, [
  ['flow', '一条成交回报 → 一个业务单（TRADE:trade_id）→ 一组借贷平衡的分录，在账本里一个事务提交。'],
  ['key', '费率必须在“成交时刻”确定并写入结算记录。用户之后升级 VIP 不影响已成交订单。'],
  ['fail', '平台币价格取值时刻不一致（例如用了 1 分钟前的价格）会导致抵扣金额争议。要固定取价规则并记录所用价格。'],
  ['risk', '如果结算按“订单”而不是按“成交”去重，同一订单的多笔成交可能只记了第一笔。']
])}

<h2>3. 结算幂等、重试与异步一致性</h2>
<p>撮合输出写入 Kafka，结算服务消费。消费者会遇到三种情况：消息重复（按“先处理后提交位点”消费时，Kafka 是至少一次投递）、处理中崩溃、账本暂时不可用。对策：</p>
${steps(['<b>幂等键</b>：用 trade_id 作为 biz_id。账本唯一约束保证同一成交只记一次。', '<b>先处理后提交位点</b>：账本事务提交成功后，才提交 Kafka offset。崩溃后会重新消费，靠幂等键去重。', '<b>无限重试 + 告警</b>：成交不能撤回，结算失败只能重试。连续失败超过阈值（示例 1 分钟）告警，人工介入。', '<b>按用户或交易对分区保序</b>：同一交易对的成交在同一分区，避免先结算后发生的成交。', '<b>缺口检测</b>：成交带连续序号，消费者发现序号跳跃就报警。'])}
${code('GO', `
// 结算消费者：至少一次投递 + 账本幂等 = 效果上恰好一次
func (s *Settler) Run(ctx context.Context) error {
	for {
		msg, err := s.reader.FetchMessage(ctx) // github.com/segmentio/kafka-go
		if err != nil {
			return err
		}
		var t TradeEvent
		if err := json.Unmarshal(msg.Value, &t); err != nil {
			s.deadLetter(msg) // 格式错误：进死信队列并告警，不能卡住分区
			_ = s.reader.CommitMessages(ctx, msg)
			continue
		}
		if t.Seq != s.lastSeq+1 && s.lastSeq != 0 {
			s.alert("trade seq gap", s.lastSeq, t.Seq) // 序号缺口：可能丢消息
		}
		legs := s.clear(t) // 计算双方手续费并生成分录
		for attempt := 0; ; attempt++ {
			err = s.ledger.Post(ctx, "TRADE", strconv.FormatUint(t.TradeID, 10), legs)
			if err == nil {
				break
			}
			s.metrics.SettleRetry.Inc()
			time.Sleep(backoff(attempt)) // 指数退避，上限 5 秒（示例）
		}
		s.lastSeq = t.Seq
		if err := s.reader.CommitMessages(ctx, msg); err != nil { // 账本成功后才提交位点
			return err
		}
	}
}
`)}
<h3>3.1 Outbox 模式与事务消息</h3>
<p>账本记账成功后要发“余额变动”消息给推送服务、风控服务。问题：先写库再发消息，发消息前崩溃就丢消息；先发消息再写库，写库失败就发了假消息。<b>事务性发件箱（Transactional Outbox）</b>解决这个问题：</p>
${mm('Outbox 模式：业务数据与待发消息在同一事务', `
sequenceDiagram
  autonumber
  participant S as 结算服务
  participant DB as 账本数据库
  participant R as Outbox 转发器
  participant K as Kafka
  participant P as 推送与风控
  S->>DB: BEGIN
  S->>DB: 写流水并更新余额
  S->>DB: 插入 outbox 表 余额变动事件
  S->>DB: COMMIT
  R->>DB: 轮询或 CDC 读取未发送事件
  R->>K: 发送事件
  K-->>R: ack
  R->>DB: 标记已发送
  K->>P: 消费者按事件 ID 去重
`, [
  ['flow', '余额和待发事件在同一个数据库事务里，要么都有，要么都没有。'],
  ['key', '转发器可能重复发送（发完还没标记就崩溃），所以下游必须按事件 ID 去重。'],
  ['fail', '转发器停摆时，事件积压在 outbox 表里不会丢；恢复后补发。监控 outbox 未发送数量。'],
  ['limit', 'Outbox 带来秒级以内的延迟；对强实时场景可以用 CDC（如 Debezium 读 PostgreSQL WAL）降低延迟。']
])}
${call('deep', `<p>另一种方案是消息中间件提供的“事务消息”（例如 RocketMQ 的半消息机制：先发半消息，本地事务提交后再确认投递，中间件会回查事务状态）。Kafka 的事务（transactional producer）保证“写多个分区 + 提交消费位点”的原子性，但它不包含你的 PostgreSQL 写入。所以“数据库 + Kafka”组合下，outbox 是最常用的做法。</p>`)}

<h2>4. 手续费精度与舍入规则</h2>
${tbl(['项目', '常见规则（示例）', '原因'], [
  ['内部计算精度', '任意精度的十进制数（如 Go 的 shopspring/decimal），除法时显式指定精度（如 <code>DivRound(x, 18)</code>；它默认只保留 16 位）', '避免中间结果丢精度'],
  ['手续费舍入', '向上取整到币种精度', '平台不少收；单笔差额 < 1 个最小单位'],
  ['用户实收舍入', '向下取整，差额归入手续费或舍入账户', '保证借贷平衡，不凭空造钱'],
  ['舍入顺序', '先算手续费并舍入，再用“成交额 − 手续费”得实收', '保证“实收 + 手续费 = 成交额”精确成立'],
  ['最小手续费', '小于 1 个最小单位时按 1 个最小单位收或免收（策略二选一）', '防止 0 手续费刷单'],
  ['舍入差异账户', '所有舍入误差记入专门账户', '对账时可解释每一分差额']
])}
${code('GO', `
import "github.com/shopspring/decimal"

// calcFee 返回（手续费，实收），保证 fee + net == gross
func calcFee(gross decimal.Decimal, rate decimal.Decimal, precision int32) (fee, net decimal.Decimal) {
	fee = gross.Mul(rate).RoundUp(precision) // 手续费向上取整
	net = gross.Sub(fee)                     // 实收用减法得到，天然平衡
	return
}
// 例：gross = 9185.184, rate = 0.0008, precision = 6
// fee = 7.348148, net = 9177.835852
`)}

<h2>5. 返佣、邀请与日终结算报表</h2>
<p>邀请返佣（Referral Rebate）：被邀请人每付一笔手续费，邀请人得到一定比例（示例 20%）。返佣来自平台手续费收入，所以分录是“借 平台手续费 / 贷 邀请人可用”。</p>
<p><b>算一算（示例）</b>：被邀请人今天付了 50 USDT 和 0.002 BTC 手续费，返佣比例 20%。</p>
${steps(['USDT 返佣 = 50 × 20% = 10 USDT；BTC 返佣 = 0.002 × 20% = 0.0004 BTC。', '分录：借 平台手续费·USDT 10 / 贷 邀请人·USDT·可用 10；BTC 同理。', '返佣通常按小时或按日批量发放，biz_id = REBATE:邀请人:日期，保证重跑不重复发。'])}
${tbl(['日终报表（示例）', '内容', '用途'], [
  ['成交汇总', '每个交易对成交笔数、成交量、成交额', '运营与监管报送'],
  ['手续费收入', '按币种、按 Maker/Taker、按 VIP 等级的手续费', '财务确认收入'],
  ['返佣支出', '按邀请人、按币种', '成本核算'],
  ['用户资产变动', '期初 + 充值 − 提币 ± 交易 − 手续费 = 期末', '对账与审计'],
  ['舍入差异', '舍入账户当日变动', '解释差额'],
  ['结算延迟', '成交时间到记账时间的分布（P50 / P99）', '系统健康度']
])}

<p>回到 <a href="#lab-ledger">账本实验</a>：完成一次“挂单 → 撮合”，在流水表里找到 TRD 开头的业务单号，核对 USDT 腿和 BTC 腿各自借贷相等，以及手续费账户收到的 6 USDT 和 0.0001 BTC。</p>

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['结算幂等键 = trade_id', '按“先处理后提交位点”消费时 Kafka 至少一次投递', '同一批成交重放两次，余额不变'],
  ['账本成功后才提交 offset', '防止丢成交', '在 Post 之后、Commit 之前 kill 进程，重启后余额正确'],
  ['成交序号缺口告警', '尽早发现丢消息', '人为跳过一条消息，期望告警'],
  ['费率快照写入结算记录', '事后可解释', '抽查结算记录含 fee_rate 与 vip_level'],
  ['outbox 积压监控', '转发器故障时及时发现', '告警阈值：未发送 > 1 万条或最老 > 30 秒（示例）'],
  ['结算延迟监控', '延迟大时用户看到“成交了但余额没变”', '告警阈值：P99 > 1 秒（示例）']
])}

${tryit(`<p>用 Go 验证舍入规则：</p>
<ol><li><code>go get github.com/shopspring/decimal</code>，把上面的 <code>calcFee</code> 写进 <code>main.go</code>。</li>
<li>输入 gross = 9185.184、rate = 0.0008、precision = 6，打印 fee 和 net。预期 7.348148 和 9177.835852。</li>
<li>循环 10,000 次随机生成 gross 和 rate，断言 <code>fee.Add(net).Equal(gross)</code> 始终为 true。</li>
<li>把计算改成 float64 再跑一次，统计有多少次断言失败。</li></ol>`)}

${mistakes([
  ['撮合成功后直接在撮合引擎里改余额最快。', '撮合引擎必须无外部依赖。记账由结算服务异步完成，靠幂等保证正确。'],
  ['手续费和实收分别四舍五入就行。', '分别舍入会让“手续费 + 实收 ≠ 成交额”，账本不平。例：成交额 1,234.5675，费率 0.1%，精度 6 位，分别四舍五入得 1.234568 + 1,233.332933 = 1,234.567501，多出 0.000001。先舍入手续费，再用减法得实收：1,234.5675 − 1.234568 = 1,233.332932，相加正好等于成交额。'],
  ['用 Kafka 事务就能保证数据库和消息一致。', 'Kafka 事务只覆盖 Kafka 内部。数据库写入和发消息的一致性要用 outbox 或事务消息。'],
  ['结算失败就把成交撤回。', '成交已经推送给用户和行情，不能撤回。结算只能重试直到成功，必要时人工处理。']
])}
${recap(['一条成交 = 一个业务单 = 两条腿（计价币、基础币）+ 双方手续费，借贷各自平衡。', '平台币抵扣：按固定取价规则把手续费折算成平台币，Taker 实收全额。', '结算可靠性：trade_id 幂等 + 先记账后提交位点 + 无限重试 + 序号缺口检测。', 'Outbox：余额与待发事件同一事务，转发器补发，下游去重。', '舍入：手续费向上取整，实收用减法；舍入差异单独记账；返佣从手续费账户支出。'])}
${quiz([
  { q: 'Taker 买方未开启平台币抵扣，他的手续费通常从哪里扣？', o: ['从他冻结的 USDT 里额外扣', '从卖方收到的 USDT 里扣', '从他收到的 BTC 里扣', '月底统一扣'], a: 2, why: '常见规则是从“收到的资产”里扣手续费，买方收到 BTC。卖方的手续费才从卖方收到的 USDT 里扣。' },
  { q: '结算消费者在账本记账成功后、提交 Kafka offset 前崩溃。重启后会怎样？', o: ['重新消费这条成交，账本唯一键拦截，余额不会重复', '这条成交丢失', '余额被记两次', 'Kafka 自动跳过这条消息'], a: 0, why: 'offset 未提交，所以会重新消费；幂等键保证不会重复记账。这正是“先处理后提交”的设计目的。' },
  { q: 'gross = 100.0000005，费率 0.1%，精度 6 位。正确的 fee 和 net 是？', o: ['fee = 0.1，net = 99.9', 'fee = 0.100001，net = 99.8999995，按 6 位精度向下取整为 99.899999，差额 0.0000005 入舍入账户', 'fee = 0，net = 100.0000005', 'fee = 0.1000000005，net = 99.9'], a: 1, why: '0.1000000005 向上取整到 6 位是 0.100001；实收用减法得到。A 和 D 不满足 fee + net = gross 或违反精度规则；C 漏收手续费。' },
  { q: 'outbox 转发器重复发送了同一个余额变动事件。正确的处理方式是？', o: ['禁止转发器重试', '在数据库中删除 outbox 表', '改为先发消息再写库', '下游消费者按事件 ID 去重'], a: 3, why: 'Outbox 保证“至少一次”，下游去重得到“效果上恰好一次”。禁止重试会丢消息；先发后写会发假消息。' }
])}
${exercises([["计算题（示例）：成交 0.2 BTC @ 50,000。Taker 买方 Alice 费率 0.1%，Maker 卖方 Bob 费率 0.08%，手续费都从收到的币里扣。Alice 下单限价 50,100。写出分录和需要解冻的金额。", "<p>成交额 = 0.2 × 50,000 = 10,000 USDT。Alice 手续费 = 0.2 × 0.1% = 0.0002 BTC，实收 0.1998 BTC。Bob 手续费 = 10,000 × 0.08% = 8 USDT，实收 9,992 USDT。</p><p>USDT 腿：借 Alice·USDT·冻结 10,000；贷 Bob·USDT·可用 9,992 和 平台手续费·USDT 8。BTC 腿：借 Bob·BTC·冻结 0.2；贷 Alice·BTC·可用 0.1998 和 平台手续费·BTC 0.0002。</p><p>Alice 按限价冻结 0.2 × 50,100 = 10,020 USDT。价格改善差额 20 USDT 在订单进入终态时解冻。</p>"], ["思考题：结算消费者如果先提交 Kafka offset、再调用账本记账，会出什么问题？", "<p>提交 offset 之后、记账之前进程崩溃，重启后会从新 offset 开始消费。这条成交不会再被读到，账本永远漏记。</p><p>正确顺序是账本事务成功后才提交 offset。崩溃时最多重复消费，由 trade_id 幂等键去重。</p>"], ["计算题（示例）：gross = 1,234.5678 USDT，费率 0.1%，币种精度 6 位。按本文的舍入规则算出 fee 和 net。", "<p>先算手续费：1,234.5678 × 0.1% = 1.2345678。向上取整到 6 位得 <code>fee = 1.234568</code>。</p><p>再用减法得实收：<code>net = 1,234.5678 − 1.234568 = 1,233.333232</code>。</p><p>检查：1.234568 + 1,233.333232 = 1,234.5678，fee + net = gross 精确成立。</p>"]])}
${checklist(["能把一条成交回报映射成两条腿和双方手续费的全部分录，并验证借贷平衡。", "能算出限价买单的价格改善差额，并说出它在何时解冻。", "能说明“trade_id 幂等 + 先记账后提交位点”如何得到效果上恰好一次的结算。", "能画出 outbox 模式的时序，并说出下游为什么必须按事件 ID 去重。", "能按“手续费向上取整、实收用减法”算出一笔成交的 fee 和 net。"])}
${terms([
  ['清算', 'Clearing', '计算交易各方应收应付和费用的过程'],
  ['结算', 'Settlement', '把清算结果实际记入账户的过程'],
  ['成交回报', 'Execution Report', '撮合引擎输出的成交事件'],
  ['事务性发件箱', 'Transactional Outbox', '把待发消息与业务数据写在同一事务、再异步转发的模式'],
  ['变更数据捕获', 'CDC, Change Data Capture', '读取数据库日志获取数据变更的技术'],
  ['死信队列', 'Dead Letter Queue', '存放无法正常处理的消息的队列'],
  ['价格改善', 'Price Improvement', '实际成交价优于委托价的部分'],
  ['返佣', 'Rebate', '按比例返还给邀请人或做市商的手续费']
])}
` });

CUR = 'm04-6';
addCh({ id: 'm04-6', nav: '充值提币与冷热钱包', title: 'M09.7 充值提币与冷热钱包：链上资金进出的全流程', desc: '充值扫块入账、提币状态机、内部转账、冷热温分层调度、多链上新与常见事故。', html: `
<h1>M09.7 充值提币与冷热钱包：链上资金进出的全流程</h1>
${meta(['画出充值链路（地址分配 → 扫块 → 确认数 → 入账 → 通知）和提币状态机。', '设计冷、温、热钱包分层和资金调度规则。', '列出假充值、重组、错链等常见事故及防护措施。'], '<a href="#m04-3">M09.4 账本设计</a>、<a href="#m03">M08 钱包</a>')}
${beginner(`<p><b>充值地址（Deposit Address）</b>：交易所分配给你的链上收款地址。你转到这里的币，交易所会记到你的账上。</p>
<p><b>扫块（Block Scanning）</b>：程序一个区块一个区块地读取链上数据，找出转给交易所地址的交易。</p>
<p><b>确认数（Confirmations）</b>：这笔交易所在的区块之后，又产生了多少个区块。确认数越多，交易被撤销（重组）的概率越小。见 <a href="#lab-confirm">确认数实验</a>。</p>
<p><b>热钱包 / 冷钱包（Hot / Cold Wallet）</b>：热钱包私钥在联网服务器上，能自动签名；冷钱包私钥离线保存，签名需要人工流程。</p>
<p><b>归集（Sweeping）</b>：把分散在成千上万个用户充值地址里的币，转到少数几个交易所主地址。</p>`)}

<h2>1. 一句话理解</h2>
${one('充值是“链上看到钱 → 等足确认 → 账本入账”；提币是“账本先冻结 → 风控审批 → 签名广播 → 链上确认 → 账本扣减”。账本永远比链上更保守：入账要等确认，出账要先冻结。')}
${call('analogy', `<p>充值像银行收支票：支票到了先显示“待清算”，等对方银行确认才能用。提币像大额取款：柜员先把钱从你的账户里圈出来，主管审批签字，再从金库拿钱。金库分三层：柜台抽屉（热钱包，少量现金）、后台保险柜（温钱包）、地下金库（冷钱包，大量现金，开一次很麻烦）。</p>
<p>类比的局限：银行支票被拒付可以追讨；链上转账一旦确认，交易所没有任何办法撤回。</p>`)}
${art('一图看懂：冷、温、热三层钱包，钱越多越离线', 660, 330, [
  S.text(270, 30, '占总资产比例（示例）', { size: 12, dim: 1 }),
  S.box(10, 46, 230, 56, { k: 'risk', icon: 'bolt', t: '热钱包 Hot', s: '在线自动签名 · 日常提币' }),
  S.box(10, 132, 230, 56, { k: 'warn', icon: 'server', t: '温钱包 Warm', s: 'MPC / 多签 · 1–2 人审批' }),
  S.box(10, 218, 230, 56, { k: 'ok', icon: 'lock', t: '冷钱包 Cold', s: '离线签名 · 多人到场' }),
  S.arrow(125, 104, 125, 130, { both: 1 }), S.arrow(125, 190, 125, 216, { both: 1 }),
  S.box(270, 54, 16, 40, { k: 'risk' }), S.text(298, 80, '2%–5%', { size: 13, b: 1 }),
  S.box(270, 140, 30, 40, { k: 'warn' }), S.text(312, 166, '5%–10%', { size: 13, b: 1 }),
  S.box(270, 226, 380, 40, { k: 'ok', t: '85%–93%', mono: 1 }),
  S.text(330, 310, '被盗时，热钱包最多损失它那一小部分；大部分钱从不联网', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '充值先归集到热钱包；热钱包超上限就转温、再转冷；提币需求大时反方向补充。'],
  ['key', '热钱包只放能应付未来几小时提币的钱，这样被盗时损失有上限。'],
  ['fail', '热钱包余额不足时提币会排队，调度服务要按历史提币量提前补充。'],
  ['limit', '比例是示例，各家交易所自己定；冷钱包取钱需要多人到场的人工仪式，所以慢。']
], '三层钱包从热到冷：热钱包占比最小但在线自动签名，冷钱包占比最大但离线人工签名', 'm04-6')}

<h2>2. 充值链路</h2>
${mm('充值链路：从链上交易到用户到账', `
sequenceDiagram
  autonumber
  participant U as 用户
  participant W as 钱包服务
  participant N as 节点或索引器
  participant L as 账本
  participant P as 推送
  U->>W: 请求 USDT-ERC20 充值地址
  W-->>U: 返回专属地址 0xAbc（HD 派生）
  U->>N: 从外部钱包转账到 0xAbc
  N->>W: 扫块发现转账 记录 txHash 与 logIndex
  W->>W: 校验合约地址 金额 状态 写入 deposit 表
  W->>P: 推送 确认中 1/12
  N->>W: 新区块 确认数增加
  W->>W: 检查该块哈希仍在主链上
  W->>L: 确认数达到阈值 入账 biz_id=链+txHash+logIndex
  L-->>W: 入账成功
  W->>P: 推送 充值到账
`, [
  ['flow', '地址分配 → 扫块发现 → 校验 → 等待确认 → 入账 → 通知。每一步都有数据库状态。'],
  ['key', '幂等键用“链 ID + 交易哈希 + 日志序号（或 UTXO 的 vout）”。一笔交易里可能有多笔转账，只用 txHash 不够。'],
  ['fail', '重组（Reorg）：已发现的交易所在区块被替换。扫块器必须比较父哈希，发现分叉就回滚未入账的记录。见 <a href="#m01">M01</a>。'],
  ['risk', '假充值：攻击者部署一个同名“USDT”合约给你转账。必须校验代币合约地址在白名单里，而不是看代币名称。']
])}
${tbl(['步骤', '要点', '数据库状态（示例）'], [
  ['地址分配', '账户模型链（ETH）每用户一个 HD 派生地址；需要 memo/tag 的链（如 XRP、TON 的部分场景）用“共享地址 + 用户标签”', 'address(user_id, chain, addr, path)'],
  ['扫块', '按高度顺序处理；记录每个块的哈希和父哈希；节点多源校验', 'scan_cursor(chain, height, hash)'],
  ['识别', '原生币看 to 地址；ERC-20 看 Transfer 事件；UTXO 链看输出脚本；比特币还要先给带铭文或 Rune 的 UTXO 打标签，避免归集时当零钱花掉（见 <a href="#m05-63">M06.4 铭文 Runes 与 L2</a>）', 'deposit(status=SEEN)'],
  ['确认', '按链和金额设置阈值；达到前每块更新确认数', 'deposit(status=CONFIRMING, confs)'],
  ['入账', '调账本 Post，幂等', 'deposit(status=CREDITED)'],
  ['通知', '推送、邮件；风控可对大额充值做“入账但限制提币”', 'notify_log']
])}
<p><b>算一算（示例）</b>：交易所对 ETH 充值按金额分级设置确认数：小于 10 ETH 等 12 个区块，大于等于 10 ETH 等 64 个区块（约两个 epoch，接近最终性）。以太坊每块 12 秒。</p>
${steps(['用户充值 3 ETH：12 × 12 秒 = 144 秒 ≈ 2.4 分钟到账。', '用户充值 50 ETH：64 × 12 秒 = 768 秒 ≈ 12.8 分钟到账（按没有空 slot 估算；实际到最终性通常要 13–19 分钟，以链上状态为准）。', '比特币平均 10 分钟一个块，等 3 个确认 ≈ 30 分钟（示例阈值）。', '确认数阈值是示例，各交易所按链的安全性和资产价值自行设定，并在充值页面公布。'])}

<h2>3. 提币链路与状态机</h2>
${mm('提币状态机', `
stateDiagram-v2
  state "已申请 Requested" as Requested
  state "已冻结 Frozen" as Frozen
  state "风控审核 RiskReview" as RiskReview
  state "人工审批 Approval" as Approval
  state "签名中 Signing" as Signing
  state "已广播 Broadcast" as Broadcast
  state "链上确认 Confirmed" as Confirmed
  state "已完成 Done" as Done
  state "失败 Failed" as Failed
  state "已解冻 Refunded" as Refunded
  [*] --> Requested: 用户提交并通过 2FA
  Requested --> Frozen: 账本冻结金额加手续费
  Requested --> Failed: 余额不足
  Frozen --> RiskReview: 规则引擎评分
  RiskReview --> Signing: 低风险自动通过
  RiskReview --> Approval: 中高风险或大额
  Approval --> Signing: 审批通过
  Approval --> Failed: 审批拒绝
  RiskReview --> Failed: 命中黑名单
  Signing --> Broadcast: 热钱包签名并广播
  Broadcast --> Broadcast: 未打包则加价替换
  Broadcast --> Confirmed: 达到确认数
  Broadcast --> Failed: 链上执行失败
  Confirmed --> Done: 账本从冻结扣减
  Failed --> Refunded: 解冻退回可用
  Done --> [*]
  Refunded --> [*]
`, [
  ['flow', '账本操作只出现在两头：开始时冻结，结束时“扣减”或“解冻”。中间的风控、签名、广播都不碰账本。'],
  ['key', '必须先冻结再签名。如果先签名广播再扣账，并发请求可以超额提走。'],
  ['fail', '“已广播”状态最难处理：交易可能卡在内存池、被替换或丢失。不能简单判为失败并解冻，否则如果原交易后来上链，就会双重支付。'],
  ['risk', '只有在确认原交易的 nonce 已被另一笔交易占用（或 UTXO 已被花费）后，才能判定失败并解冻。nonce 管理见 <a href="#m03">M08</a>。']
])}
${steps(['<b>申请</b>：校验地址格式、网络、最小提币额、2FA、白名单（见 <a href="#m04-2">M09.3</a>）。', '<b>冻结</b>：账本冻结“提币金额 + 网络手续费”，biz_id = WITHDRAW:提币单号。', '<b>风控</b>：KYC 限额、地址画像、行为异常、KYT 筛查（见 <a href="#m04-8">M09.9</a>；合规规则引擎的实现见 <a href="#m11-6">M12.8 实战：合规引擎</a>）。', '<b>审批</b>：超过阈值进入人工审批，大额需要多人审批（四眼原则）。', '<b>签名</b>：钱包服务构造交易，调用签名服务（HSM/MPC）签名。', '<b>广播</b>：发到多个节点；记录 txHash；监控打包，超时按规则加价替换（同 nonce）。', '<b>确认</b>：达到确认数后，账本从冻结扣减；推送“提币成功”。', '<b>失败</b>：链上执行失败或审批拒绝，账本解冻退回可用。'])}

<h2>4. 内部转账与冷热温分层</h2>
<p><b>内部转账</b>：用户 A 提币的目标地址恰好是同一交易所用户 B 的充值地址。交易所可以不上链，直接在账本里记“A 冻结扣减 / B 可用入账”，免网络手续费、秒到账。注意：内部转账同样要过风控和合规检查，并在提币记录里标明“内部转账”，没有链上 txHash。</p>
${mm('冷、温、热钱包分层与资金调度', `
flowchart TB
  DEP["用户充值地址<br/>成千上万个"] -->|"归集"| HOT["热钱包<br/>在线自动签名<br/>持有 2%–5%（示例）"]
  HOT -->|"高于上限：自动转出"| WARM["温钱包<br/>多签或 MPC<br/>半自动审批"]
  WARM -->|"热钱包低于下限：补充"| HOT
  WARM -->|"高于上限：人工转出"| COLD["冷钱包<br/>离线签名<br/>持有 85%–93%（示例）"]
  COLD -->|"大额补充：多人离线仪式"| WARM
  HOT -->|"日常提币"| OUT["用户提币地址"]
  MON["调度服务<br/>水位监控"] -.->|"读余额 · 预测提币量"| HOT
  MON -.-> WARM
`, [
  ['flow', '钱的方向：充值地址 → 热钱包 → 温钱包 → 冷钱包；提币需求大时反向补充。'],
  ['key', '热钱包只放“足够应付未来若干小时提币”的钱。被盗时损失有上限。'],
  ['fail', '热钱包余额不足时，提币排队。调度服务要根据历史提币量预测，提前从温钱包补充。'],
  ['risk', '归集交易需要充值地址里有 Gas。给成千上万个地址打 Gas 本身是成本和攻击面；可以用合约钱包或 EIP-7702 等方案优化（选读）。']
])}
${tbl(['层级', '私钥形态', '签名方式', '持有比例（示例）', '调度规则（示例）'], [
  ['热钱包', 'HSM / MPC 在线分片', '全自动', '2%–5%', '余额高于目标水位的 120%（上限）时转出到温钱包；低于目标水位的 50%（下限）时请求补充'],
  ['温钱包', 'MPC 或多签，部分分片在审批人手里', '半自动，需 1–2 人审批', '5%–10%', '高于上限时转冷；每日最多补热 N 次'],
  ['冷钱包', '离线设备、多地保管、多签', '人工仪式，多人到场', '85%–93%', '每周或按需操作，需要高管和安全团队共同授权']
])}
<p><b>算一算（示例）</b>：过去 30 天 BTC 日均提币 300 BTC，最高单日 900 BTC。交易所希望热钱包能覆盖 6 小时的峰值提币量，并保留 50% 余量。</p>
${steps(['峰值每小时提币 = 900 ÷ 24 = 37.5 BTC。', '6 小时需要 = 37.5 × 6 = 225 BTC。', '加 50% 余量：热钱包目标水位 = 225 × 1.5 ≈ 338 BTC。', '若交易所总共托管 20,000 BTC，热钱包占比 ≈ 338 ÷ 20,000 ≈ 1.7%。低于上表的常见区间 2%–5%，说明这个币提币需求小；水位按实际需求定，不必硬套区间。'])}

<h2>5. 多链、代币上新与常见事故</h2>
<h3>5.1 代币上新流程</h3>
${steps(['<b>技术评估</b>：链类型（EVM、UTXO、其他）、确认规则、代币合约是否可升级、是否有黑名单/暂停/手续费转账（fee-on-transfer）等特殊逻辑。', '<b>节点接入</b>：自建至少两个节点（不同客户端或不同供应商），配置扫块器。', '<b>参数配置</b>：合约地址白名单、精度（decimals）、最小充提额、确认数、提币手续费、热钱包水位。', '<b>测试</b>：测试网完整走一遍充值、归集、提币；主网小额实测。', '<b>上线顺序</b>：先开充值（积累深度），再开交易，最后开提币；每一步都可以单独开关。'])}
<h3>5.2 常见事故与防护</h3>
${tbl(['事故', '原因', '防护'], [
  ['假币充值', '同名代币合约、或伪造的事件日志', '只认白名单合约地址；从交易回执读事件并校验 emitter 地址'],
  ['假成功充值', '交易回执 status = 0（执行失败）但日志被误读，或某些链节点 / 第三方回调推送了未成功或未上链的交易通知', '必须检查回执状态和最终余额变化'],
  ['重组导致双花', '确认数不足就入账', '按链与金额设置确认数；扫块器检测父哈希变化'],
  ['错链 / 漏 memo', '用户选错网络或没填标签', '充值页面强提示；建立人工找回流程（可能收费或无法找回）'],
  ['重复提币', '广播超时后重新创建交易，原交易后来也上链', '同一提币单复用同一 nonce；状态机禁止“已广播”直接失败'],
  ['热钱包被盗', '服务器入侵、密钥泄露', 'MPC/HSM、热钱包限额、提币速率限制、异常时自动熔断'],
  ['地址投毒', '攻击者发送 0 金额转账，伪造与常用地址首尾相同的地址', '提币地址白名单；界面显示完整地址；运营不从历史记录复制地址']
])}
${call('warn', `<p>提币相关的 bug 会直接丢钱，而且不可逆。上线任何提币相关改动前，至少要做三件事：测试网完整回归、主网小额灰度、准备好一键暂停提币的开关。</p>`)}

${tryit(`<p>在区块浏览器上追踪一笔“充值”需要检查的字段：</p>
<ol><li>打开 <code>etherscan.io</code>，搜索 USDT 合约地址 <code>0xdAC17F958D2ee523a2206206994597C13D831ec7</code>，进入 Token Transfers 标签，点开任意一笔转账的交易哈希。</li>
<li>记录：Status（是否 Success）、Block（区块高度）、Block Confirmations（确认数）。</li>
<li>点 Logs 标签，找到 Transfer 事件：确认事件的 Address 正是 USDT 合约地址，记下它的 log index。</li>
<li>预期结果：你能写出这笔转账的幂等键“1 + txHash + logIndex”，并说出它如果是充值，按 12 确认的规则是否已可入账。</li></ol>`)}

${mistakes([
  ['链上看到交易就能给用户入账。', '要等确认数达到阈值，并校验回执状态和代币合约地址。否则会被重组和假币攻击。'],
  ['提币广播后很久没上链，就判失败并退款。', '原交易可能稍后上链。必须确认 nonce 已被占用或 UTXO 已被花费，才能判定失败。'],
  ['冷钱包越多越安全，热钱包越少越好。', '热钱包太少会导致提币排队、体验差，还会让冷钱包操作变频繁、增加人为风险。要按提币量预测设水位。'],
  ['内部转账不上链，所以不需要风控。', '内部转账同样是资金离开用户账户，必须过风控、限额和合规检查。']
])}
${recap(['充值：HD 地址分配 → 扫块（防重组）→ 校验合约与回执 → 等确认 → 幂等入账（链+txHash+logIndex）。', '提币：先冻结 → 风控 → 审批 → 签名 → 广播 → 确认 → 扣减；失败才解冻。', '“已广播”不能直接判失败：确认 nonce 或 UTXO 状态后才能解冻。', '冷温热分层：热钱包只放几小时峰值提币量；调度服务按水位自动补充和转出。', '上新先评估合约特殊逻辑，按“充值 → 交易 → 提币”顺序开放。'])}
${quiz([
  { q: 'ERC-20 充值的幂等键为什么不能只用 txHash？', o: ['txHash 会变化', '一笔交易里可能包含多笔 Transfer 事件', 'txHash 太长', '数据库不支持哈希字符串'], a: 1, why: '批量转账合约可以在一笔交易里给多个地址转账。需要加上 logIndex 才能唯一标识。txHash 在交易打包后不会变化。' },
  { q: '提币流程中，账本冻结应该发生在？', o: ['签名之前', '广播之后', '链上确认之后', '用户收到币之后'], a: 0, why: '先冻结才能防止并发提币超额。广播后或确认后才扣账，中间窗口里同一笔钱可以被再次提走。' },
  { q: '某提币交易广播 30 分钟仍未打包。最安全的做法是？', o: ['立即判失败并解冻', '用新 nonce 再发一笔', '删除提币记录', '用同一 nonce、更高手续费替换，并持续跟踪直到该 nonce 上链'], a: 3, why: '同 nonce 替换保证最多只有一笔上链。新 nonce 会导致两笔都可能上链；直接解冻可能造成双重支付。' },
  { q: '热钱包目标水位主要根据什么设定？', o: ['交易所总资产的固定 50%', '冷钱包的数量', '预测的未来若干小时提币峰值加余量', '用户人数'], a: 2, why: '热钱包要覆盖短期提币需求，同时限制被盗损失。固定大比例风险过高；冷钱包数量和用户人数不直接决定提币需求。' }
])}
${exercises([["计算题（示例）：过去 30 天 ETH 最高单日提币 1,200 ETH。交易所希望热钱包覆盖 4 小时峰值提币，并保留 50% 余量。总托管 15,000 ETH。热钱包目标水位和占比是多少？", "<p>峰值每小时提币 = 1,200 ÷ 24 = 50 ETH。4 小时需要 = 50 × 4 = 200 ETH。</p><p>加 50% 余量：目标水位 = 200 × 1.5 = 300 ETH。</p><p>占比 = 300 ÷ 15,000 = 2%。热钱包只放足够应付短期提币的钱，被盗时损失有上限。</p>"], ["思考题：新代币上线为什么按“先开充值、再开交易、最后开提币”的顺序？", "<p>先开充值，让用户把币转进来，积累交易深度。</p><p>再开交易，此时订单簿已有挂单，价格不容易被打穿。</p><p>提币最后开，因为提币出错会直接丢钱且不可逆。每一步都能单独开关，出问题时可以只关闭某一环。</p>"], ["设计题：为 deposit 表设计状态流转，并说明扫块器发现重组时如何处理。", "<p>状态按 SEEN → CONFIRMING → CREDITED 流转。SEEN 表示扫块发现转账；CONFIRMING 期间每个新区块更新确认数；达到阈值后调用账本入账，变为 CREDITED。</p><p>扫块器记录每个块的哈希和父哈希。发现父哈希变化（分叉）时，回滚尚未入账的记录，把它们标为孤块状态，不入账。</p><p>入账幂等键用“链 ID + txHash + logIndex”，重新扫到同一笔转账也不会重复入账。</p>"]])}
${checklist(["能画出充值链路：地址分配、扫块、校验、等确认、幂等入账、通知。", "能写出 ERC-20 充值的幂等键，并说出为什么要校验代币合约地址白名单。", "能画出提币状态机，并指出账本只在开始冻结、结束扣减或解冻时出现。", "能按提币峰值预测算出热钱包目标水位。", "能列出假币充值、重组、错链、重复提币、地址投毒的原因和防护。"])}
${terms([
  ['充值地址', 'Deposit Address', '交易所分配给用户的专属链上收款地址'],
  ['扫块', 'Block Scanning', '逐块读取链上数据识别相关交易'],
  ['归集', 'Sweeping', '把分散地址中的资产汇总到主地址'],
  ['热钱包', 'Hot Wallet', '私钥在线、可自动签名的钱包'],
  ['温钱包', 'Warm Wallet', '介于冷热之间、需要部分人工审批的钱包'],
  ['冷钱包', 'Cold Wallet', '私钥离线保存、签名需人工流程的钱包'],
  ['内部转账', 'Internal Transfer', '同一交易所用户间不上链、只记账本的转账'],
  ['重组', 'Reorg', '链上已有区块被另一条更长或更重的链替换'],
  ['地址投毒', 'Address Poisoning', '用相似地址的垃圾转账诱导用户复制错误地址的攻击']
])}
` });

})();
