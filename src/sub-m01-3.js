/* ---------- M01 子文章（3/5）：Go 快速入门、用 go-ethereum 读链 ---------- */
(() => {
CUR = 'm01-6';
addCh({ id: 'm01-6', nav: 'Go 快速入门', title: 'M01.6 Go 快速入门：写 Web3 后端需要的全部基础', desc: '从安装到并发、大整数和表驱动测试，每段代码都能直接运行。', html: `
<h1>M01.6 Go 快速入门：写 Web3 后端需要的全部基础</h1>
${meta(['安装 Go，用 go mod 创建项目，掌握变量、结构体、方法、接口、切片、map。', '按 Go 惯例处理错误，用 goroutine、channel、select、context、errgroup 写并发代码。', '用 math/big 处理链上金额，用表驱动测试验证代码。'], '<a href="#m01-5">M01.5 节点与 JSON-RPC</a>（会一点任意编程语言即可）')}
${beginner(`<p><strong>编译型语言</strong>：代码先被编译成可执行文件再运行。Go 编译出一个独立二进制文件，部署时不需要安装运行环境。</p>
<p><strong>模块（module）</strong>：Go 项目的依赖管理单位，由 <code>go.mod</code> 文件描述。</p>
<p><strong>包（package）</strong>：同一目录下的一组 Go 文件。首字母大写的名字可以被其他包使用。</p>
<p><strong>goroutine</strong>：Go 的轻量级线程。启动成本很低，一个程序可以同时运行成千上万个。</p>
<p><strong>channel</strong>：goroutine 之间传递数据的管道。</p>
<p><strong>指针（pointer）</strong>：保存变量内存地址的值。<code>*T</code> 表示“指向 T 的指针”，<code>&amp;x</code> 表示“取 x 的地址”。</p>`)}

<h2>1. 一句话理解</h2>
${one('Go = 简单的语法 + 显式的错误处理 + 内置并发 + 单文件部署。以太坊使用占比最高的执行层客户端之一 Geth 就是 Go 写的，所以 Go 是链上后端的首选语言之一。' + cite('clientdiversity.org：以太坊客户端分布', 'https://clientdiversity.org/'))}
${call('analogy', `<p>如果 Python 是一把瑞士军刀（什么都能做，但大项目里容易乱），Go 就是一套标准化的工具箱：工具种类少，但每件都结实，所有人用法一样。团队里新人读老代码几乎没有障碍。</p>
<p><strong>类比的局限</strong>：Go 的“少”也意味着要多写代码，例如每个错误都要手动检查。这是有意的取舍：错误路径清清楚楚。</p>`)}
${art('一图看懂：Go 后端 = 几个小包，编译成一个二进制', 660, 330, [
  S.zone(10, 28, 190, 220, { t: '源码（一个模块）' }),
  S.box(20, 56, 170, 46, { k: 'tint', mono: 1, t: 'cmd/…/main.go', s: '入口：组装依赖、启动' }),
  S.box(20, 120, 170, 46, { k: 'tint', mono: 1, t: 'internal/…', s: 'scanner · parser · store' }),
  S.box(20, 184, 170, 46, { k: 'warn', mono: 1, t: 'go.mod · go.sum', s: '依赖版本 + 哈希锁定' }),
  S.box(228, 111, 110, 64, { k: 'key', t: 'go build', s: '静态编译' }),
  S.box(370, 111, 120, 64, { k: 'ok', t: '单个二进制', s: '无需运行时' }),
  S.box(522, 111, 128, 64, { k: 'info', t: '任意服务器', s: 'Docker 镜像\n几十 MB' }),
  S.arrow(202, 143, 226, 143),
  S.arrow(340, 143, 368, 143),
  S.arrow(492, 143, 520, 143),
  S.text(330, 286, '语法简单 · 错误显式检查 · 内置并发 · 部署只拷一个文件', { size: 13.5, anchor: 'middle', mw: 620 }),
  S.text(330, 308, '测试与静态检查：go test ./... 和 go vet ./... 通过后才编译发布', { size: 12, dim: 1, anchor: 'middle', mw: 620 })
], [
  ['flow', '源码按 package 分层；依赖由 go.mod 声明、go.sum 校验哈希；go build 产出一个静态二进制，再装进镜像部署。'],
  ['key', '产物只有一个文件，镜像可以做到几十 MB，启动只要毫秒级。'],
  ['fail', 'go.sum 没提交到仓库，CI 会报 missing go.sum entry。go.mod 和 go.sum 要一起提交。'],
  ['limit', 'cmd/ 只做组装，业务逻辑放 internal/（外部模块无法导入）；包按职责拆，不建 models/、utils/ 这种大杂烩。']
], 'Go 项目的源码、go.mod 与 go.sum 经 go build 编译成单个二进制文件，再装进 Docker 镜像部署到服务器', 'm01-6')}

<h2>2. 安装与第一个项目</h2>
${steps([
  '安装：macOS 运行 <code>brew install go</code>；Windows / Linux 从 go.dev/dl 下载安装包。',
  '验证：运行 <code>go version</code>，输出类似 <code>go version go1.2x.x</code>。本篇代码要求 Go 1.22 及以上（循环变量每次迭代独立）。',
  '建项目：<code>mkdir gointro &amp;&amp; cd gointro &amp;&amp; go mod init example.com/gointro</code>，生成 go.mod。',
  '加依赖：<code>go get golang.org/x/sync/errgroup</code>，go.mod 和 go.sum 自动更新。',
  '常用命令：<code>go run .</code> 运行；<code>go build</code> 编译；<code>go test ./...</code> 测试；<code>go vet ./...</code> 静态检查；<code>gofmt -w .</code> 格式化；<code>go mod tidy</code> 整理依赖。'
])}
${mm('Go 项目从源码到部署', `
flowchart LR
  SRC["源码 .go<br/>多个 package"] --> MOD["go.mod / go.sum<br/>依赖版本锁定"]
  MOD --> B["go build<br/>静态编译"]
  B --> BIN["单个二进制文件"]
  BIN --> D["Docker 镜像<br/>distroless 或 alpine"]
  SRC --> T["go test ./...<br/>go vet ./..."]
  T -->|"通过"| B
  T -->|"失败"| FIX["修复后重来"]
`, [
  ['flow', '依赖由 go.mod 声明、go.sum 校验哈希，保证任何机器编译出相同的程序。'],
  ['key', '产物是一个二进制文件。镜像可以做到几十 MB，启动只要毫秒级。'],
  ['fail', 'go.sum 没提交到仓库，CI 会报 missing go.sum entry。提交 go.mod 和 go.sum 两个文件。'],
  ['limit', '交叉编译要设 GOOS/GOARCH；用到 cgo 的依赖（例如部分加密库）交叉编译更麻烦。']
])}

<h2>3. 基本语法：变量、结构体、方法、接口、切片、map</h2>
<p>下面是一个完整的 main.go。它用一个“代币转账”的例子展示全部基础语法，可以直接 <code>go run .</code>（需要第 6 节的 units 包）。</p>
${code('GO', `
package main

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"sync"
	"time"

	"example.com/gointro/units"
)

// Transfer 表示一笔代币转账。字段首字母大写 = 包外可见。
// 结构体标签（反引号里的内容）控制 JSON 字段名。
type Transfer struct {
	TxHash   string   \`json:"tx_hash"\`
	To       string   \`json:"to"\`
	Amount   *big.Int \`json:"amount"\` // 链上整数，永远不用 float64
	Decimals int      \`json:"decimals"\`
}

// Human 是 Transfer 的方法（值接收者：只读，不修改 t）。
func (t Transfer) Human() string { return units.FormatUnits(t.Amount, t.Decimals) }

// Notifier 是接口：任何实现了 Notify 方法的类型都自动满足它，不需要显式声明。
type Notifier interface {
	Notify(ctx context.Context, t Transfer) error
}

type LogNotifier struct{ sent int }

// Notify 用指针接收者，因为要修改 sent。
func (n *LogNotifier) Notify(ctx context.Context, t Transfer) error {
	n.sent++
	fmt.Printf("notify %s -> %s %s\\n", t.TxHash, t.To, t.Human())
	return nil
}

// ErrNotFound 是“哨兵错误”，调用方用 errors.Is 判断。
var ErrNotFound = errors.New("not found")

func findTransfer(m map[string]Transfer, hash string) (Transfer, error) {
	t, ok := m[hash] // map 查找：ok 表示键是否存在
	if !ok {
		return Transfer{}, fmt.Errorf("find %s: %w", hash, ErrNotFound) // %w 包装错误
	}
	return t, nil
}

// slowRPC 模拟一个很慢的 RPC 调用，并尊重 ctx 的取消。
func slowRPC(ctx context.Context, d time.Duration) (uint64, error) {
	select {
	case <-time.After(d):
		return 20000000, nil
	case <-ctx.Done():
		return 0, ctx.Err()
	}
}

func main() {
	// 1. 切片（可变长数组）与 map（哈希表）
	list := []Transfer{
		{TxHash: "0xaa", To: "0x01", Amount: big.NewInt(1500000), Decimals: 6},
		{TxHash: "0xbb", To: "0x02", Amount: big.NewInt(250000000), Decimals: 6},
	}
	byHash := make(map[string]Transfer, len(list))
	for _, t := range list {
		byHash[t.TxHash] = t
	}

	// 2. 接口：变量 n 的静态类型是接口，实际值是 *LogNotifier
	var n Notifier = &LogNotifier{}
	for _, t := range list {
		if err := n.Notify(context.Background(), t); err != nil {
			fmt.Println("notify failed:", err)
		}
	}

	// 3. 错误处理：包装后仍能用 errors.Is 识别
	if _, err := findTransfer(byHash, "0xcc"); errors.Is(err, ErrNotFound) {
		fmt.Println("error:", err) // error: find 0xcc: not found
	}

	// 4. context 超时 + select：100 毫秒后放弃
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel() // defer：函数返回前执行，用来释放资源
	if _, err := slowRPC(ctx, time.Second); err != nil {
		fmt.Println("rpc:", err) // rpc: context deadline exceeded
	}

	// 5. goroutine + channel + WaitGroup：并发处理 5 个高度
	results := make(chan string, 5) // 带缓冲的 channel
	var wg sync.WaitGroup
	for h := 100; h < 105; h++ {
		wg.Add(1)
		go func(h int) {
			defer wg.Done()
			results <- fmt.Sprintf("block %d done", h)
		}(h)
	}
	wg.Wait()      // 等全部 goroutine 结束
	close(results) // 关闭后 range 才会结束
	for r := range results {
		fmt.Println(r) // 输出顺序不固定
	}

	// 6. 为什么不用 float64
	f := float64(1e18) + 1
	fmt.Println("float64 1e18+1 == 1e18 ?", f == 1e18) // true：1 wei 丢了
	w, _ := new(big.Int).SetString("1000000000000000001", 10)
	fmt.Println("big.Int:", w.String()) // 1000000000000000001，精确
}
`)}
${tbl(['语法点', '写法', '要点'], [
  ['变量', '<code>var x int = 1</code> 或 <code>x := 1</code>', '<code>:=</code> 只能在函数内用；未赋值的变量有“零值”（0、""、nil）'],
  ['结构体', '<code>type T struct { A int }</code>', '没有类和继承；用组合（嵌入结构体）复用'],
  ['方法', '<code>func (t T) M()</code> / <code>func (t *T) M()</code>', '要修改接收者或结构体很大时用指针接收者'],
  ['接口', '<code>type I interface { M() }</code>', '隐式实现；接口要小（1–3 个方法），便于测试时替换'],
  ['切片', '<code>s := []int{1,2}; s = append(s, 3)</code>', 'append 可能分配新底层数组，一定要接收返回值'],
  ['map', '<code>m := map[string]int{}</code>', '读不存在的键返回零值；<strong>并发读写会崩溃</strong>，需要加锁或用 sync.Map'],
  ['指针', '<code>p := &amp;x; *p = 2</code>', 'big.Int 一般以 <code>*big.Int</code> 传递']
])}

<h2>4. 错误处理惯例</h2>
${steps([
  '函数把 error 作为最后一个返回值。调用后立刻检查：<code>if err != nil { return ..., err }</code>。',
  '向上返回时用 <code>fmt.Errorf("做什么: %w", err)</code> 加上下文，形成错误链：<code>save block 100: insert: connection refused</code>。',
  '用 <code>errors.Is(err, ErrNotFound)</code> 判断哨兵错误；用 <code>errors.As(err, &amp;target)</code> 取出特定类型的错误。',
  '不要用 panic 处理业务错误。panic 只用于“程序员错误”（不可能发生的情况）。',
  '同一个错误只处理一次：要么记录日志，要么向上返回，不要两样都做，否则日志里重复出现。'
])}
${call('warn', `<p><strong>忽略错误会丢钱。</strong><code>bal, _ := client.BalanceAt(...)</code> 在 RPC 失败时返回 nil 或 0。如果你据此判断“用户没钱”或“充值为 0”，就会出错。Web3 后端里，每个 <code>_</code> 丢弃的 error 都要有充分理由。</p>`)}

<h2>5. 并发：goroutine、channel、select、context、errgroup</h2>
${mm('索引器里典型的并发结构', `
flowchart LR
  CTX["根 context<br/>收到 SIGTERM 时取消"] --> F1["fetcher goroutine 1"]
  CTX --> F2["fetcher goroutine 2"]
  CTX --> F3["fetcher goroutine 3"]
  F1 -->|"chan Block"| P["parser goroutine"]
  F2 -->|"chan Block"| P
  F3 -->|"chan Block"| P
  P -->|"chan Batch"| W["writer goroutine<br/>按高度顺序写库"]
  W --> DB[("PostgreSQL")]
  EG["errgroup<br/>任一失败则全部取消"] -.-> F1
  EG -.-> P
  EG -.-> W
`, [
  ['flow', '多个 fetcher 并发拉块，经 channel 交给 parser，再交给单个 writer 按顺序写库。'],
  ['key', 'context 贯穿全部 goroutine。取消根 context，所有 goroutine 都能退出，实现优雅停机。'],
  ['fail', 'goroutine 泄漏：goroutine 阻塞在没人读的 channel 上，永远不退出。每个 goroutine 都要有退出路径（ctx.Done()）。'],
  ['limit', '并发拉块会乱序到达。写库必须按高度排序，否则游标和重组检测都会出错。']
])}
${tbl(['工具', '用途', '典型代码'], [
  ['goroutine', '并发执行函数', '<code>go work(ctx)</code>'],
  ['channel', '在 goroutine 间传数据，天然同步', '<code>ch := make(chan Block, 16); ch &lt;- b; b := &lt;-ch</code>'],
  ['select', '同时等多个 channel，谁先到处理谁', '<code>select { case b := &lt;-ch: … case &lt;-ctx.Done(): return }</code>'],
  ['context', '传递取消信号和超时', '<code>ctx, cancel := context.WithTimeout(ctx, 5*time.Second)</code>'],
  ['sync.WaitGroup', '等一组 goroutine 结束', '<code>wg.Add(1); go func(){ defer wg.Done() }(); wg.Wait()</code>'],
  ['errgroup', '等一组 goroutine，任一出错就取消其他，并返回第一个错误；可限制并发数', '见下方代码'],
  ['sync.Mutex', '保护共享变量', '<code>mu.Lock(); defer mu.Unlock()</code>']
])}
${code('GO', `
package main

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"
)

// fetchBlock 模拟拉块：高度 107 会失败。
func fetchBlock(ctx context.Context, h uint64) (string, error) {
	if h == 107 {
		return "", fmt.Errorf("block %d: rpc timeout", h)
	}
	return fmt.Sprintf("0xhash%d", h), nil
}

func main() {
	g, ctx := errgroup.WithContext(context.Background())
	g.SetLimit(4) // 最多 4 个并发请求，保护 RPC 配额
	hashes := make([]string, 10)
	for i := range hashes {
		h := uint64(100 + i)
		g.Go(func() error { // Go 1.22+：i 和 h 每次迭代都是新变量
			s, err := fetchBlock(ctx, h)
			if err != nil {
				return err // 第一个错误会取消 ctx，其他 goroutine 应尽快退出
			}
			hashes[i] = s // 每个 goroutine 写不同下标，不需要加锁
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		fmt.Println("first error:", err) // first error: block 107: rpc timeout
	}
}
`)}

<h2>6. math/big：为什么不能用 float64</h2>
<p>以太坊金额是 256 位无符号整数（uint256），单位是 wei。float64 只有 53 位有效二进制位，约 15–16 位十进制有效数字。1 ETH = 10<sup>18</sup> wei，已经是 19 位数字。</p>
<p><strong>算一算（示例）</strong></p>
${steps([
  '2<sup>53</sup> = 9,007,199,254,740,992 ≈ 9.007 × 10<sup>15</sup>。超过这个数，float64 不能精确表示每个整数。',
  '1 ETH = 10<sup>18</sup> wei，是 2<sup>53</sup> 的约 111 倍。在这个量级，相邻两个 float64 之间相差 128 wei。',
  '所以 float64(10<sup>18</sup>) + 1 == 10<sup>18</sup> 为 true，1 wei 直接消失。',
  'uint256 最大值约 1.16 × 10<sup>77</sup>，连 int64（最大约 9.2 × 10<sup>18</sup>）都放不下 10 ETH 以上的 wei 数。必须用 <code>*big.Int</code>。'
])}
<p>下面的 units 包把链上整数和人类可读小数互相换算，是后端最常用的工具函数：</p>
${code('GO', `
// 文件：units/units.go
// Package units 在链上整数和人类可读小数之间换算。
package units

import (
	"errors"
	"fmt"
	"math/big"
	"strings"
)

var ErrBadAmount = errors.New("units: bad amount")

// FormatUnits 把链上整数转成小数字符串。例：(1500000, 6) → "1.5"
func FormatUnits(v *big.Int, decimals int) string {
	neg := v.Sign() < 0
	abs := new(big.Int).Abs(v)
	base := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals)), nil)
	q, r := new(big.Int).QuoRem(abs, base, new(big.Int)) // 商和余数
	s := q.String()
	if r.Sign() != 0 {
		frac := fmt.Sprintf("%0*s", decimals, r.String()) // 左侧补 0 到 decimals 位
		s += "." + strings.TrimRight(frac, "0")
	}
	if neg {
		s = "-" + s
	}
	return s
}

// ParseUnits 把小数字符串转成链上整数。例：("1.5", 6) → 1500000
func ParseUnits(s string, decimals int) (*big.Int, error) {
	intPart, frac, _ := strings.Cut(strings.TrimSpace(s), ".")
	if len(frac) > decimals {
		return nil, fmt.Errorf("%w: too many decimals in %q", ErrBadAmount, s)
	}
	frac += strings.Repeat("0", decimals-len(frac))
	v, ok := new(big.Int).SetString(intPart+frac, 10)
	if !ok || intPart == "" {
		return nil, fmt.Errorf("%w: %q", ErrBadAmount, s)
	}
	return v, nil
}
`)}
${call('info', `<p><strong>big.Int 的三个坑</strong>：① 运算结果写进接收者：<code>z.Add(x, y)</code> 会修改 z，所以常写 <code>new(big.Int).Add(x, y)</code>。② 不要复制值：<code>a := *b</code> 会共享底层数组，用 <code>new(big.Int).Set(b)</code>。③ 比较用 <code>x.Cmp(y)</code>，不能用 <code>==</code>（那是比较指针）。数据库里用 <code>NUMERIC(78,0)</code> 存 uint256。</p>`)}

<h2>7. 项目目录结构</h2>
${code('BASH', `
indexer/
├── cmd/
│   └── indexer/
│       └── main.go          # 入口：读配置、组装依赖、启动、优雅停机
├── internal/                # 只允许本模块导入，外部无法引用
│   ├── config/              # 配置结构体与加载（环境变量 / YAML）
│   ├── chain/               # RPC 客户端封装：重试、超时、多源
│   ├── scanner/             # 扫块、重组检测、游标
│   ├── parser/              # 事件解码
│   ├── store/               # 数据库访问（PostgreSQL）
│   └── notify/              # Kafka / HTTP 回调
├── pkg/
│   └── units/               # 可被其他项目复用的工具包
├── migrations/              # SQL 迁移文件 0001_init.up.sql …
├── configs/                 # 配置样例 config.example.yaml
├── Dockerfile
├── Makefile
├── go.mod
└── go.sum
`)}
<p>原则：<code>cmd/</code> 只做组装，业务逻辑放 <code>internal/</code>；包按“职责”拆分，不按“类型”拆分（不要建 models/、utils/ 这种大杂烩）；依赖通过接口注入，方便测试时换成假实现。</p>

<h2>8. 单元测试与表驱动测试</h2>
<p>Go 测试文件以 <code>_test.go</code> 结尾，测试函数以 <code>Test</code> 开头。<strong>表驱动测试（Table-Driven Test）</strong>把多组输入和期望输出写成一张表，用一个循环跑完。新增用例只需加一行。</p>
${code('GO', `
// 文件：units/units_test.go
package units

import (
	"errors"
	"math/big"
	"testing"
)

func TestParseUnits(t *testing.T) {
	cases := []struct {
		name     string
		in       string
		decimals int
		want     string // 期望的整数（十进制字符串）
		wantErr  error
	}{
		{"整数", "100", 6, "100000000", nil},
		{"小数", "1.5", 6, "1500000", nil},
		{"18 位精度", "0.000000000000000001", 18, "1", nil},
		{"超过精度", "1.1234567", 6, "", ErrBadAmount},
		{"非法字符", "abc", 18, "", ErrBadAmount},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) { // 子测试：失败时显示用例名
			got, err := ParseUnits(tc.in, tc.decimals)
			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Fatalf("want error %v, got %v", tc.wantErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.String() != tc.want {
				t.Fatalf("got %s, want %s", got, tc.want)
			}
		})
	}
}

func TestFormatUnits(t *testing.T) {
	v, _ := new(big.Int).SetString("123456789012345678901", 10)
	if got := FormatUnits(v, 18); got != "123.456789012345678901" {
		t.Fatalf("got %s", got)
	}
	if got := FormatUnits(big.NewInt(1500000), 6); got != "1.5" {
		t.Fatalf("got %s", got)
	}
}
`)}
${steps([
  '运行全部测试：<code>go test ./...</code>，预期输出 <code>ok  example.com/gointro/units</code>。',
  '看详细输出：<code>go test -v ./units</code>，每个子测试显示 PASS。',
  '检查数据竞争：<code>go test -race ./...</code>。并发代码一定要跑。',
  '看覆盖率：<code>go test -cover ./...</code>。'
])}
${tryit(`<ol>
<li>按第 2 节建项目 <code>example.com/gointro</code>，把第 6 节代码存为 <code>units/units.go</code>，第 8 节代码存为 <code>units/units_test.go</code>，第 3 节代码存为 <code>main.go</code>。</li>
<li>运行 <code>go test ./...</code>。<strong>预期</strong>：<code>ok</code>。</li>
<li>运行 <code>go run .</code>。<strong>预期</strong>：最后两行是 <code>float64 1e18+1 == 1e18 ? true</code> 和 <code>big.Int: 1000000000000000001</code>。</li>
<li>给 TestParseUnits 加一个用例：<code>{"负数", "-1", 6, "-1000000", nil}</code>，运行测试。观察它是否通过，再想想充值系统该不该接受负数，修改 ParseUnits 让它返回 ErrBadAmount。</li>
</ol>`)}

${mistakes([
  ['金额用 float64 存，显示时四舍五入就行。', 'float64 在 10¹⁸ 量级每步相差 128 wei，计算一开始就错了。金额全程用 *big.Int，数据库用 NUMERIC(78,0)。'],
  ['err 太多，用 _ 忽略掉一些无所谓。', 'RPC 失败时返回的零值会被当成真实数据。每个错误都要处理或向上返回。'],
  ['开 1,000 个 goroutine 同时拉块最快。', '会触发 RPC 限流、耗尽连接。用 errgroup.SetLimit 或信号量控制并发。'],
  ['map 可以在多个 goroutine 里随便读写。', '并发读写 map 会让程序直接崩溃（fatal error）。用 sync.Mutex 保护或用 channel 串行化。'],
  ['big.Int 可以用 == 比较。', '== 比较的是指针地址。数值比较用 x.Cmp(y) == 0。']
])}
${recap([
  'go mod init 建项目；go run / build / test / vet / gofmt 是日常命令；提交 go.mod 和 go.sum。',
  '结构体 + 方法 + 小接口代替类和继承；切片 append 要接收返回值；map 不能并发写。',
  '错误作为最后一个返回值，立刻检查，用 %w 包装，用 errors.Is / As 判断。',
  '并发三件套：goroutine + channel + select；用 context 传取消和超时；用 errgroup 管理一组任务并限制并发。',
  '链上金额用 *big.Int；float64 超过 2⁵³ 就丢精度。',
  '测试文件 _test.go；表驱动测试 + 子测试；并发代码跑 -race。'
])}
${quiz([
  { q: '以下哪段代码能正确判断两个 *big.Int 金额相等？', o: ['a == b', 'a.Cmp(b) == 0', 'a.String() > b.String()', 'float64(a.Int64()) == float64(b.Int64())'], a: 1, why: 'Cmp 返回 -1、0、1。== 比较的是指针；字符串比较按字典序；转 Int64 会溢出、转 float64 会丢精度。' },
  { q: '一个 goroutine 执行 ch &lt;- v，但没有任何 goroutine 读取这个无缓冲 channel。会发生什么？', o: ['v 被丢弃，程序继续', '程序立即 panic', '这个 goroutine 永远阻塞，造成泄漏', 'channel 自动扩容'], a: 2, why: '无缓冲 channel 的发送要等接收方。没有接收方就一直阻塞，这就是 goroutine 泄漏。应配合 select 和 ctx.Done() 提供退出路径。' },
  { q: '用 errgroup.WithContext 启动 10 个任务，第 3 个返回错误。会发生什么？', o: ['返回的 ctx 被取消，g.Wait() 返回第一个错误', '其他 9 个任务被强制终止', '程序崩溃', 'g.Wait() 返回 nil'], a: 0, why: '第一个错误会取消派生 ctx。其他任务需要自己检查 ctx 才能尽快退出；Go 不能强制终止 goroutine。Wait 返回第一个非 nil 错误。' },
  { q: '为什么 Go 测试推荐表驱动写法？', o: ['运行速度更快', '可以跳过编译', '只有这样才能测并发', '用例集中在一张表里，新增用例只加一行，失败时能看到用例名'], a: 3, why: '表驱动测试让输入输出一目了然，配合 t.Run 子测试能精确定位失败用例。它和速度、编译、并发测试无关。' }
])}
${exercises([["计算题（示例）：按本文的 units 包，<code>FormatUnits(1234500, 6)</code> 返回什么？<code>ParseUnits(\"0.05\", 18)</code> 返回的整数是多少？", "<p>FormatUnits：1234500 除以 10⁶，商 1，余数 234500。余数补到 6 位是 \"234500\"，去掉末尾 0 得 \"2345\"，结果是 \"1.2345\"。ParseUnits：整数部分 \"0\"，小数部分 \"05\" 补 16 个 0 到 18 位。结果是 5 × 10¹⁶，即 50000000000000000。</p>"], ["思考题：索引器用多个 fetcher goroutine 并发拉块，再交给一个 writer 写库。为什么 writer 必须按高度顺序写，而不是谁先到写谁？", "<p>并发拉取的区块会乱序到达。游标记录的是“处理到哪个高度、哈希是什么”。重组检测要比较新块的父哈希和上一高度的哈希。乱序写入会让游标跳号，也会让父哈希校验失效。所以拉取可以并发，写库必须串行、按高度排序。</p>"], ["设计题：给 TestParseUnits 再加 3 个用例：空字符串、\".5\"、前后带空格的 \" 2 \"（decimals 都是 6）。按本文的 ParseUnits 实现，写出每个用例的期望结果。", "<p>空字符串：intPart 为空，返回 ErrBadAmount。\".5\"：intPart 为空，也返回 ErrBadAmount。\" 2 \"：先 TrimSpace 得 \"2\"，结果 \"2000000\"。表里写成 <code>{\"前导小数点\", \".5\", 6, \"\", ErrBadAmount}</code> 这样的行即可。</p>"]])}
${checklist(["能用 go mod init、go get、go test、go vet 建立并检查一个项目。", "能按 Go 惯例返回错误、用 %w 包装，并用 errors.Is 判断哨兵错误。", "能用 errgroup.SetLimit 写出限制并发的拉取代码，并给每个 goroutine 留退出路径。", "能用 *big.Int 和 FormatUnits / ParseUnits 在链上整数与小数之间换算。", "做过写表驱动测试，并用 -race 运行。"])}
${terms([
  ['Go 模块', 'Go Module', '由 go.mod 描述的依赖管理单元'],
  ['goroutine', 'Goroutine', 'Go 运行时调度的轻量级线程'],
  ['通道', 'Channel', 'goroutine 之间传递数据并同步的管道'],
  ['上下文', 'Context', '在调用链中传递取消信号、超时和请求范围值的对象'],
  ['错误组', 'errgroup', '管理一组 goroutine、传播第一个错误并可限制并发的工具包'],
  ['哨兵错误', 'Sentinel Error', '预先定义的错误变量，调用方用 errors.Is 判断'],
  ['大整数', 'big.Int', 'Go 标准库中任意精度的整数类型'],
  ['表驱动测试', 'Table-Driven Test', '把多组输入和期望输出写成表格并循环执行的测试写法']
])}
` });

CUR = 'm01-7';
addCh({ id: 'm01-7', nav: '用 go-ethereum 读链', title: 'M01.7 用 go-ethereum 读链：余额、区块、回执、事件与订阅', desc: '用 ethclient 和 abigen 读链，解码 Transfer 事件，处理订阅断线与并发。', html: `
<h1>M01.7 用 go-ethereum 读链：余额、区块、回执、事件与订阅</h1>
${meta(['用 ethclient 连接节点，读取余额、区块头和交易回执。', '用 abigen 生成合约绑定，调用 ERC-20 的 balanceOf 和 decimals，并用 FilterLogs 解码 Transfer 事件。', '实现带断线重连的订阅、批量请求和并发控制。'], '<a href="#m01-6">M01.6 Go 快速入门</a>、<a href="#m01-5">M01.5 节点与 JSON-RPC</a>')}
${beginner(`<p><strong>go-ethereum（Geth）</strong>：以太坊官方的 Go 实现。除了节点程序，它还提供可以直接导入的 Go 库。</p>
<p><strong>ethclient</strong>：go-ethereum 里的 RPC 客户端包，把 JSON-RPC 方法包装成 Go 函数。</p>
<p><strong>ABI（Application Binary Interface）</strong>：合约函数和事件的“说明书”，JSON 格式，编译合约时生成。</p>
<p><strong>abigen</strong>：go-ethereum 自带的代码生成工具，把 ABI 转成类型安全的 Go 代码。</p>
<p><strong>绑定（Binding）</strong>：abigen 生成的 Go 代码，让你像调用本地方法一样调用合约。</p>`)}

<h2>1. 一句话理解</h2>
${one('ethclient 把 JSON-RPC 变成 Go 函数，abi 包负责编码和解码合约数据，abigen 把这两件事生成成类型安全的代码。读链后端就是这三样工具的组合。')}
${call('analogy', `<p>如果 JSON-RPC 是一门外语，ethclient 就是翻译官：你用 Go 说“查余额”，它翻译成 <code>eth_getBalance</code> 发出去，再把十六进制回答翻译回 <code>*big.Int</code>。abigen 则是为某个合约专门编的“常用语手册”，连参数类型都帮你检查好。</p>
<p><strong>类比的局限</strong>：翻译官不会替你判断对方说的是不是真话。节点返回落后或错误的数据时，ethclient 照单全收。</p>`)}
${art('一图看懂：ethclient 是 Go 与 JSON-RPC 之间的翻译官', 660, 332, [
  S.box(10, 56, 140, 84, { k: 'info', t: 'Go 程序', s: 'uint64\n*big.Int' }),
  S.box(260, 56, 140, 84, { k: 'key', t: 'ethclient', s: '翻译官\nGo ↔ RPC' }),
  S.box(510, 56, 140, 84, { k: 'info', t: 'RPC 节点', s: '十六进制\nJSON' }),
  S.arrow(152, 98, 258, 98, { both: 1, label: 'BalanceAt' }),
  S.arrow(402, 98, 508, 98, { both: 1, label: 'eth_getBalance' }),
  S.box(10, 194, 390, 66, { k: 'tint', t: 'abi 包 / abigen', s: '把合约函数与事件翻译成 calldata 和 Go 结构体\nabigen 生成类型安全的绑定代码' }),
  S.arrow(80, 142, 80, 192, { both: 1 }),
  S.arrow(330, 142, 330, 192, { both: 1 }),
  S.box(510, 194, 140, 66, { k: 'risk', t: '节点可能说错', s: '落后或错误\n照单全收' }),
  S.arrow(580, 142, 580, 192, { k: 'risk', dash: 1 }),
  S.text(330, 304, '每个 ethclient 调用 = 一次 JSON-RPC 往返；十六进制与大整数的转换由它完成', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', 'Go 说 BalanceAt，ethclient 译成 eth_getBalance 发给节点，再把十六进制回答译回 *big.Int。'],
  ['key', 'abi 包和 abigen 负责合约这一层：参数编码成 calldata，返回值和事件日志解码成 Go 类型。'],
  ['risk', 'ethclient 不判断真假：节点返回落后或错误的数据，它照单全收。'],
  ['fail', '每个调用都可能超时或失败：所有调用都传带超时的 ctx，并检查 err。']
], 'Go 程序通过 ethclient 与 RPC 节点交换 JSON-RPC 请求，abi 与 abigen 负责合约数据的编码和解码，节点返回的数据本身需要自行校验', 'm01-7')}

<h2>2. 连接节点，读余额、区块头与回执</h2>
${steps([
  '建项目：<code>go mod init example.com/readchain</code>。',
  '加依赖：<code>go get github.com/ethereum/go-ethereum golang.org/x/sync/errgroup</code>，再运行 <code>go mod tidy</code>。',
  '准备 RPC 地址：<code>export RPC_URL=https://ethereum-rpc.publicnode.com</code>（生产环境用付费节点或自建节点）。'
])}
${tbl(['ethclient 方法', '对应 JSON-RPC', '返回'], [
  ['<code>DialContext(ctx, url)</code>', '建立 HTTP 或 WebSocket 连接', '<code>*ethclient.Client</code>'],
  ['<code>ChainID(ctx)</code>', 'eth_chainId', '<code>*big.Int</code>'],
  ['<code>BlockNumber(ctx)</code>', 'eth_blockNumber', '<code>uint64</code>'],
  ['<code>BalanceAt(ctx, addr, nil)</code>', 'eth_getBalance（nil = latest）', '<code>*big.Int</code>（wei）'],
  ['<code>HeaderByNumber(ctx, n)</code>', 'eth_getBlockByNumber(n, false)', '<code>*types.Header</code>'],
  ['<code>BlockByNumber(ctx, n)</code>', 'eth_getBlockByNumber(n, true)', '<code>*types.Block</code>（含交易）'],
  ['<code>TransactionReceipt(ctx, hash)</code>', 'eth_getTransactionReceipt', '<code>*types.Receipt</code>；未打包返回 ethereum.NotFound'],
  ['<code>CallContract(ctx, msg, nil)</code>', 'eth_call', '<code>[]byte</code>（ABI 编码的返回值）'],
  ['<code>FilterLogs(ctx, q)</code>', 'eth_getLogs', '<code>[]types.Log</code>'],
  ['<code>SubscribeNewHead(ctx, ch)</code>', 'eth_subscribe newHeads（只能用 WS）', '<code>ethereum.Subscription</code>']
])}
${mm('读链程序的调用链', `
sequenceDiagram
  participant M as main.go
  participant E as ethclient
  participant N as RPC 节点
  M->>E: DialContext(ctx, RPC_URL)
  M->>E: BlockNumber(ctx)
  E->>N: eth_blockNumber
  N-->>E: 十六进制高度
  E-->>M: uint64
  M->>E: FilterLogs(USDC, Transfer topic)
  E->>N: eth_getLogs
  N-->>E: 日志数组
  E-->>M: []types.Log
  M->>M: 解码 topics 与 data
  M->>E: TransactionReceipt(txHash)
  E->>N: eth_getTransactionReceipt
  N-->>M: status、gasUsed、logs
`, [
  ['flow', '每个 ethclient 调用都对应一次 JSON-RPC 往返。往返次数决定了程序速度和 RPC 账单。'],
  ['fail', '每个调用都可能超时或失败。所有调用都传入带超时的 ctx，并检查 err。'],
  ['key', '十六进制和大整数转换由 ethclient 完成，你拿到的是 uint64、*big.Int、common.Hash 等 Go 类型。'],
  ['limit', 'BlockByNumber 要解析区块里的全部交易。遇到客户端库还不认识的新交易类型时会报错，扫块时优先用 HeaderByNumber + FilterLogs。']
])}

<h2>3. 完整可运行的示例程序</h2>
<p>下面的程序在以太坊主网上依次完成：读链 ID 和高度、读 ETH 余额、读最新区块头、调用 USDC 的 decimals 和 balanceOf、拉取 Transfer 事件并解码、读一笔交易回执、批量请求 4 个区块头、限制并发拉 10 个区块头。它用 go-ethereum v1.17 编译并实际运行通过。</p>
${code('GO', `
package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"golang.org/x/sync/errgroup"
)

// 只包含需要的 3 个条目的最小 ERC-20 ABI
const erc20ABI = \`[
 {"type":"function","name":"balanceOf","stateMutability":"view","inputs":[{"name":"a","type":"address"}],"outputs":[{"type":"uint256"}]},
 {"type":"function","name":"decimals","stateMutability":"view","inputs":[],"outputs":[{"type":"uint8"}]},
 {"type":"event","name":"Transfer","anonymous":false,"inputs":[
   {"indexed":true,"name":"from","type":"address"},
   {"indexed":true,"name":"to","type":"address"},
   {"indexed":false,"name":"value","type":"uint256"}]}
]\`

var (
	usdc        = common.HexToAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
	holder      = common.HexToAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
	transferSig = crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)")) // 0xddf252ad…
)

func main() {
	rpcURL := os.Getenv("RPC_URL")
	if rpcURL == "" {
		rpcURL = "https://ethereum-rpc.publicnode.com"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	client, err := ethclient.DialContext(ctx, rpcURL)
	if err != nil {
		log.Fatalf("dial: %v", err)
	}
	defer client.Close()

	// 1. 链 ID 与最新高度：先确认连的是哪条链
	chainID, err := client.ChainID(ctx)
	must(err)
	head, err := client.BlockNumber(ctx)
	must(err)
	fmt.Println("chainId:", chainID, "head:", head)

	// 2. ETH 余额（单位 wei）
	bal, err := client.BalanceAt(ctx, holder, nil) // nil = latest
	must(err)
	fmt.Println("ETH balance (wei):", bal)

	// 3. 区块头
	hdr, err := client.HeaderByNumber(ctx, new(big.Int).SetUint64(head))
	must(err)
	fmt.Println("header:", hdr.Number, hdr.Hash().Hex(), "baseFee:", hdr.BaseFee, "gasUsed:", hdr.GasUsed)

	// 4. 手工 ABI 调用 ERC-20：decimals 与 balanceOf
	parsed, err := abi.JSON(strings.NewReader(erc20ABI))
	must(err)
	dec, err := callUint(ctx, client, parsed, usdc, "decimals")
	must(err)
	b, err := callUint(ctx, client, parsed, usdc, "balanceOf", holder)
	must(err)
	fmt.Println("USDC decimals:", dec, "balance:", b)

	// 5. FilterLogs：拉取一个区块内 USDC 的 Transfer 事件
	q := ethereum.FilterQuery{
		FromBlock: new(big.Int).SetUint64(head - 5),
		ToBlock:   new(big.Int).SetUint64(head - 5),
		Addresses: []common.Address{usdc},
		Topics:    [][]common.Hash{{transferSig}}, // 位置 0 = 事件签名
	}
	logs, err := client.FilterLogs(ctx, q)
	must(err)
	for i, lg := range logs {
		if i >= 3 {
			break
		}
		ev, err := decodeTransfer(parsed, lg)
		must(err)
		fmt.Printf("Transfer %s -> %s value=%s tx=%s idx=%d\\n", ev.From.Hex(), ev.To.Hex(), ev.Value, lg.TxHash.Hex(), lg.Index)
		if i == 0 { // 6. 读这笔交易的回执
			rc, err := client.TransactionReceipt(ctx, lg.TxHash)
			must(err)
			fmt.Println("receipt status:", rc.Status, "gasUsed:", rc.GasUsed, "logs:", len(rc.Logs))
		}
	}

	// 7. 批量请求：一次 HTTP 往返拿 4 个区块头
	hs, err := batchHeaders(ctx, client.Client(), head-3, head)
	must(err)
	for _, h := range hs {
		fmt.Println("batch:", h.Number, h.Hash().Hex())
	}
	// 8. 限制并发：最多 4 个请求同时进行
	hashes, err := fetchHashes(ctx, client, head-9, head, 4)
	must(err)
	fmt.Println("concurrent:", len(hashes))
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

// callUint 打包调用数据 → eth_call → 解包返回值。
func callUint(ctx context.Context, c *ethclient.Client, a abi.ABI, to common.Address, method string, args ...interface{}) (*big.Int, error) {
	data, err := a.Pack(method, args...) // 4 字节选择器 + 参数
	if err != nil {
		return nil, err
	}
	out, err := c.CallContract(ctx, ethereum.CallMsg{To: &to, Data: data}, nil)
	if err != nil {
		return nil, err
	}
	vals, err := a.Unpack(method, out)
	if err != nil {
		return nil, err
	}
	switch v := vals[0].(type) {
	case *big.Int:
		return v, nil
	case uint8:
		return big.NewInt(int64(v)), nil
	}
	return nil, fmt.Errorf("unexpected type %T", vals[0])
}

type TransferEvent struct {
	From  common.Address
	To    common.Address
	Value *big.Int
}

// decodeTransfer：indexed 参数在 topics，非 indexed 参数在 data。
func decodeTransfer(a abi.ABI, lg types.Log) (*TransferEvent, error) {
	if len(lg.Topics) != 3 || lg.Topics[0] != transferSig {
		return nil, fmt.Errorf("not a Transfer log") // ERC-721 的 Transfer 有 4 个 topic，要排除
	}
	ev := &TransferEvent{
		From: common.BytesToAddress(lg.Topics[1].Bytes()), // 取 32 字节的后 20 字节
		To:   common.BytesToAddress(lg.Topics[2].Bytes()),
	}
	if err := a.UnpackIntoInterface(ev, "Transfer", lg.Data); err != nil { // 只填 Value
		return nil, err
	}
	return ev, nil
}

// batchHeaders 用 JSON-RPC 批量请求一次取多个区块头。
func batchHeaders(ctx context.Context, rc *rpc.Client, from, to uint64) ([]*types.Header, error) {
	n := int(to - from + 1)
	heads := make([]*types.Header, n)
	elems := make([]rpc.BatchElem, n)
	for i := 0; i < n; i++ {
		heads[i] = new(types.Header)
		elems[i] = rpc.BatchElem{
			Method: "eth_getBlockByNumber",
			Args:   []interface{}{hexutil.EncodeUint64(from + uint64(i)), false},
			Result: heads[i],
		}
	}
	if err := rc.BatchCallContext(ctx, elems); err != nil {
		return nil, err // 整批失败（网络错误）
	}
	for i, e := range elems {
		if e.Error != nil { // 单个元素失败要逐个检查
			return nil, fmt.Errorf("block %d: %w", from+uint64(i), e.Error)
		}
	}
	return heads, nil
}

// fetchHashes 并发拉区块头，最多 limit 个请求同时进行。
func fetchHashes(ctx context.Context, c *ethclient.Client, from, to uint64, limit int) ([]common.Hash, error) {
	out := make([]common.Hash, to-from+1)
	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(limit)
	for h := from; h <= to; h++ {
		g.Go(func() error {
			hdr, err := c.HeaderByNumber(ctx, new(big.Int).SetUint64(h))
			if err != nil {
				return fmt.Errorf("header %d: %w", h, err)
			}
			out[h-from] = hdr.Hash()
			return nil
		})
	}
	return out, g.Wait()
}
`)}
<p>运行 <code>go run .</code> 的输出类似下面（数值为示例，每次不同）：</p>
${code('BASH', `
chainId: 1 head: 26256032
ETH balance (wei): 5773252986299759339
header: 26256032 0x6a8a… baseFee: 196929626 gasUsed: 59942949
USDC decimals: 6 balance: 38192124
Transfer 0x0000…8A90 -> 0x0000…fad4 value=61457 tx=0x0bc3… idx=0
receipt status: 1 gasUsed: 247447 logs: 7
batch: 26256029 0xdca7…
…
concurrent: 10
`)}

<h2>4. abigen：生成类型安全的合约绑定</h2>
<p>手写 Pack / Unpack 容易写错方法名和类型。abigen 根据 ABI 生成 Go 代码，编译期就能发现错误。</p>
${steps([
  '安装：<code>go install github.com/ethereum/go-ethereum/cmd/abigen@latest</code>（版本与 go.mod 中的 go-ethereum 保持一致）。',
  '准备 ABI：从 Etherscan 合约页的 “Contract ABI” 复制，或用 <code>forge inspect ERC20 abi</code>、<code>solc --abi</code> 导出，存为 <code>erc20.abi</code>。',
  '生成：<code>abigen --abi erc20.abi --pkg erc20 --type ERC20 --out erc20/erc20.go</code>。',
  '生成的文件包含：<code>NewERC20</code> 构造函数、每个 view 函数一个方法、每个事件一个 Filter 方法和 Watch 方法。不要手改生成的文件，ABI 变了就重新生成。'
])}
${code('GO', `
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"

	"example.com/readchain/erc20" // abigen 生成的包
)

func main() {
	ctx := context.Background()
	c, err := ethclient.DialContext(ctx, "https://ethereum-rpc.publicnode.com")
	if err != nil {
		log.Fatal(err)
	}
	usdt, err := erc20.NewERC20(common.HexToAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"), c)
	if err != nil {
		log.Fatal(err)
	}
	opts := &bind.CallOpts{Context: ctx} // 可设置 BlockNumber 查询历史状态（需要归档节点）
	dec, err := usdt.Decimals(opts)
	if err != nil {
		log.Fatal(err)
	}
	bal, err := usdt.BalanceOf(opts, common.HexToAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("decimals:", dec, "raw balance:", bal) // decimals: 6

	// 生成的事件过滤器：自动拼 topics、自动解码
	head, _ := c.BlockNumber(ctx)
	end := head - 3
	it, err := usdt.FilterTransfer(&bind.FilterOpts{Start: head - 3, End: &end, Context: ctx}, nil, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer it.Close()
	for it.Next() {
		e := it.Event // *erc20.ERC20Transfer
		fmt.Println(e.From.Hex(), "->", e.To.Hex(), e.Value, e.Raw.TxHash.Hex(), e.Raw.Index)
	}
	if err := it.Error(); err != nil {
		log.Fatal(err)
	}
}
`)}
${call('info', `<p><strong>decimals 要读、要缓存</strong>：USDT 和 USDC 是 6 位，WETH、DAI 是 18 位。把 6 位精度的代币按 18 位处理，金额差 10<sup>12</sup> 倍。decimals 在合约部署后通常不变，启动时读一次存进缓存或配置即可。另外，USDT 的 <code>transfer</code> 不返回 bool，不完全符合 ERC-20 标准；读链不受影响，但写合约时要用 SafeERC20 一类的封装。</p>`)}

<h2>5. 事件解码：topics 与 data</h2>
${mm('一条 Transfer 日志如何被解码', `
flowchart LR
  LG["types.Log"] --> AD["Address<br/>代币合约地址"]
  LG --> T0["Topics[0]<br/>0xddf252ad…"]
  LG --> T1["Topics[1]<br/>from，左补 0 到 32 字节"]
  LG --> T2["Topics[2]<br/>to，左补 0 到 32 字节"]
  LG --> DT["Data<br/>value，32 字节大端整数"]
  AD -->|"在白名单里？"| CHK{"校验"}
  T0 -->|"等于 Transfer 签名？"| CHK
  CHK -->|"是"| DEC["BytesToAddress 取后 20 字节<br/>new(big.Int).SetBytes(Data)"]
  CHK -->|"否"| DROP["丢弃"]
  DEC --> EV["TransferEvent{From, To, Value}"]
`, [
  ['flow', 'indexed 参数在 topics，按顺序排列；非 indexed 参数按 ABI 编码放在 data。'],
  ['risk', '先校验 Address（合约白名单）再解码。任何人都能部署合约发出同样签名的 Transfer 事件。'],
  ['fail', 'ERC-721 的 Transfer 事件签名与 ERC-20 相同，但 tokenId 也是 indexed，共 4 个 topic。按 topic 数量区分，否则解码出错或 panic。'],
  ['key', '唯一标识一条日志用 (TxHash, Index)。Index 是日志在整个区块里的序号，不是在交易里的序号。']
])}

<h2>6. 订阅与断线重连</h2>
<p><code>SubscribeNewHead</code> 和 <code>SubscribeFilterLogs</code> 只能在 WebSocket（或 IPC）连接上使用。连接会因为网络抖动、节点重启、服务商空闲超时而断开。断开时 <code>sub.Err()</code> 会收到错误。下面的函数在断开后按指数退避重连：</p>
${code('GO', `
// watchHeads 订阅新区块头，断线后指数退避重连（1s, 2s, 4s … 最多约 30s）。
// onHead 只用来“唤醒”扫块循环；真正的数据仍按高度拉取，避免断线期间漏块。
func watchHeads(ctx context.Context, wsURL string, onHead func(*types.Header)) {
	backoff := time.Second
	for ctx.Err() == nil {
		err := func() error {
			c, err := ethclient.DialContext(ctx, wsURL) // wss://…
			if err != nil {
				return err
			}
			defer c.Close()
			ch := make(chan *types.Header, 16)
			sub, err := c.SubscribeNewHead(ctx, ch)
			if err != nil {
				return err
			}
			defer sub.Unsubscribe()
			backoff = time.Second // 连接成功，重置退避
			for {
				select {
				case h := <-ch:
					onHead(h)
				case err := <-sub.Err(): // 连接断开
					return err
				case <-ctx.Done():
					return ctx.Err()
				}
			}
		}()
		log.Printf("subscription ended: %v, retry in %s", err, backoff)
		select {
		case <-time.After(backoff):
		case <-ctx.Done():
			return
		}
		if backoff < 30*time.Second {
			backoff *= 2
		}
	}
}
`)}
<p><code>SubscribeFilterLogs(ctx, query, ch)</code> 的用法相同，channel 类型是 <code>chan types.Log</code>。收到 <code>Removed == true</code> 的日志，说明它所在的区块被重组掉了，必须撤销对应处理。</p>
${mm('订阅 + 轮询的双保险', `
stateDiagram-v2
  state "已连接 订阅中" as Subscribed
  state "断线 退避等待" as Backoff
  state "按游标补拉" as CatchUp
  state "轮询兜底" as Polling
  [*] --> Subscribed
  Subscribed --> Backoff: sub.Err 收到错误
  Backoff --> CatchUp: 重连成功
  CatchUp --> Subscribed: 追到链头
  Backoff --> Polling: 连续失败超过阈值
  Polling --> CatchUp: WebSocket 恢复
`, [
  ['flow', '正常时订阅只负责“叫醒”；断线后先退避重连，重连成功后从数据库游标补拉缺失的区块。'],
  ['fail', '只依赖订阅：断线 3 分钟就丢 15 个区块的事件，而且没有任何报错。'],
  ['key', '数据完整性由“游标 + 按高度拉取”保证，订阅只用来降低延迟。'],
  ['limit', '轮询间隔太短会浪费 RPC 配额；太长会增加延迟。以太坊 12 秒出块，轮询 2–4 秒是常见取值（示例）。']
])}

<h2>7. 批量请求与并发控制</h2>
${tbl(['手段', '适用场景', '注意'], [
  ['JSON-RPC 批量（BatchCallContext）', '一次取多个区块头、多个回执、多个余额', '单批数量受服务商限制；要逐个检查 BatchElem.Error'],
  ['errgroup.SetLimit', '并发拉取多个高度', '并发数按 RPC 配额定（示例：4–16）；结果按下标写入，保持顺序'],
  ['令牌桶限流（golang.org/x/time/rate）', '控制每秒请求数', '<code>limiter.Wait(ctx)</code> 放在每个请求之前'],
  ['eth_getLogs 按范围分段', '回填历史事件', '范围过大时二分缩小；记录每段完成状态，支持断点续传'],
  ['eth_getBlockReceipts', '一次取整个区块的回执', '很多节点支持，但不是所有服务商都开放；不支持时退回逐笔查询']
])}
<p><strong>算一算（示例）</strong>：回填 10 万个区块。逐个请求、单次往返 100 毫秒：100,000 × 0.1 = 10,000 秒 ≈ 2.8 小时。每批 50 个、并发 8：往返次数 = 100,000 ÷ 50 = 2,000 批，耗时 ≈ 2,000 × 0.15 秒 ÷ 8 ≈ 38 秒（假设批量请求单次 150 毫秒且服务商不限流）。实际受限流约束，要按配额调小。</p>
${tryit(`<ol>
<li>按第 2 节建项目，把第 3 节程序存为 main.go，执行 <code>go mod tidy</code> 再 <code>go run .</code>。<strong>预期</strong>：输出 chainId: 1 和一串 Transfer 事件。</li>
<li>把 RPC_URL 换成 Sepolia 测试网的公共节点（例如 <code>https://ethereum-sepolia-rpc.publicnode.com</code>）。<strong>预期</strong>：chainId 变为 11155111；USDC 地址在 Sepolia 上没有合约，callUint 报错或返回空——这正说明合约地址必须按链配置。</li>
<li>用第 4 节的步骤生成 erc20 绑定，查询 USDT 的 decimals。<strong>预期</strong>：6。</li>
<li>把 fetchHashes 的并发上限改成 64，范围改成 500 个区块，观察是否出现 429 或超时错误。</li>
</ol>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['启动时校验 chainId', '防止配置错误连到别的链', '配错 RPC 时进程拒绝启动'],
  ['所有调用带超时 ctx', '防止单个请求卡死', '用代理注入 30 秒延迟，观察超时日志'],
  ['事件先校验合约地址再解码', '防止假币事件', '测试里构造假合约地址的 Transfer，确认被丢弃'],
  ['按 topic 数量区分 ERC-20 与 ERC-721', '签名相同，结构不同', '单测覆盖 3 个和 4 个 topic 的日志'],
  ['订阅断线自动重连并补拉', 'WS 断线会静默丢数据', '手动断网 1 分钟，恢复后无缺块'],
  ['并发数和 QPS 可配置', '不同服务商配额不同', '配置项 rpc.max_concurrency、rpc.qps']
])}
${mistakes([
  ['WebSocket 订阅收到了所有事件，不需要再拉。', '断线期间的事件会丢失且不报错。订阅只做唤醒，数据靠游标按高度拉取。'],
  ['所有 ERC-20 都是 18 位精度。', 'USDT、USDC 是 6 位。decimals 必须从合约读取并缓存。'],
  ['Transfer 事件签名对就是真的代币转账。', '任何合约都能发出同签名事件。必须校验 log.Address 在白名单内。'],
  ['批量请求成功，里面每个结果都成功。', '批量整体成功不代表每个元素成功，要逐个检查 BatchElem.Error。'],
  ['并发越高回填越快。', '超过服务商配额会触发 429，重试反而更慢。按配额设置并发和 QPS。']
])}
${recap([
  'ethclient 把 JSON-RPC 包装成 Go 函数：BlockNumber、BalanceAt、HeaderByNumber、TransactionReceipt、CallContract、FilterLogs。',
  'abi 包负责 Pack / Unpack；abigen 生成类型安全的绑定，包含 view 方法和事件 Filter。',
  'Transfer 解码：topics[1]、topics[2] 取后 20 字节得到地址，data 是金额；先校验合约地址和 topic 数量。',
  '订阅只能走 WebSocket，必须断线重连 + 游标补拉；Removed 为 true 的日志要撤销处理。',
  '用批量请求减少往返，用 errgroup.SetLimit 和令牌桶控制并发与 QPS。'
])}
${quiz([
  { q: '用 FilterLogs 拿到一条日志，Topics 有 4 个元素，Topics[0] 等于 Transfer 签名。它最可能是什么？', o: ['ERC-20 Transfer', 'ERC-721 Transfer（tokenId 也是 indexed）', '一条无效日志', 'ETH 原生转账'], a: 1, why: 'ERC-721 的 Transfer(from, to, tokenId) 三个参数都是 indexed，加上签名共 4 个 topic。ERC-20 只有 3 个 topic；ETH 原生转账不产生日志。' },
  { q: '调用 TransactionReceipt 时返回 ethereum.NotFound。最合理的解释是什么？', o: ['交易失败了', '交易被永久删除', '交易还没被打包（或节点尚未同步到）', 'RPC 节点坏了'], a: 2, why: '未打包的交易没有回执。失败的交易有回执，只是 status = 0。应该稍后重试，并设置总等待上限。' },
  { q: '订阅 SubscribeFilterLogs 时收到一条 Removed = true 的日志。应该怎么做？', o: ['撤销之前对这条日志所做的处理（例如回滚未确认的充值记录）', '忽略它', '再次入账', '重启程序'], a: 0, why: 'Removed = true 表示该日志所在区块被重组掉了。之前基于它做的处理必须撤销。' },
  { q: '批量请求 50 个区块头，BatchCallContext 返回 nil。下一步应该做什么？', o: ['直接使用全部结果', '重新发送整批', '把结果按倒序排列', '逐个检查每个 BatchElem.Error'], a: 3, why: 'BatchCallContext 返回 nil 只说明网络往返成功；单个元素可能失败，必须逐个检查 Error。' }
])}
${exercises([["计算题（示例）：要回填 5 万个区块头。逐个请求、每次往返 100 毫秒需要多久？改为每批 100 个、并发 5、每批 200 毫秒呢（假设不限流）？", "<p>逐个请求：50,000 × 0.1 = 5,000 秒，约 83 分钟。批量：50,000 ÷ 100 = 500 批。耗时 ≈ 500 × 0.2 ÷ 5 = 20 秒。实际要按服务商配额调小并发和批量大小。</p>"], ["思考题：扫块时为什么优先用 HeaderByNumber 加 FilterLogs，而不是 BlockByNumber？", "<p>BlockByNumber 要解析区块里的全部交易。遇到客户端库还不认识的新交易类型时，它会报错。HeaderByNumber 只取区块头，FilterLogs 只取关心的日志，数据量也更小。只有确实需要交易内容时才拉完整区块。</p>"], ["设计题：写一个函数签名，用来判断一条日志是不是要处理的 ERC-20 转账，并列出函数内要检查的条件。", "<p>签名示例：<code>func isERC20Transfer(lg types.Log, whitelist map[common.Address]bool) bool</code>。检查：<code>lg.Address</code> 在合约白名单里；<code>len(lg.Topics) == 3</code>，排除 4 个 topic 的 ERC-721；<code>lg.Topics[0]</code> 等于 Transfer 签名；<code>lg.Removed</code> 为 false。先校验地址，再解码。</p>"]])}
${checklist(["能说出常用 ethclient 方法对应的 JSON-RPC 方法。", "能用 abi.Pack / Unpack 或 abigen 绑定调用 balanceOf 和 decimals。", "能从 Transfer 日志的 topics 和 data 解码出 from、to、value，并先校验合约地址和 topic 数量。", "能写出断线后指数退避重连、并按游标补拉的订阅代码。", "能用批量请求和 errgroup 控制回填的往返次数与并发。"])}
${terms([
  ['go-ethereum', 'Geth', '以太坊官方 Go 实现，同时提供可导入的 Go 库'],
  ['ethclient', 'ethclient', 'go-ethereum 中把 JSON-RPC 包装为 Go 方法的客户端包'],
  ['应用二进制接口', 'ABI, Application Binary Interface', '描述合约函数与事件编码方式的 JSON 规范'],
  ['合约绑定', 'Contract Binding', 'abigen 根据 ABI 生成的类型安全 Go 代码'],
  ['批量请求', 'Batch Request', '把多个 JSON-RPC 请求放进一个数组一次发送'],
  ['订阅', 'Subscription', '通过 WebSocket 让节点主动推送新区块或日志'],
  ['令牌桶', 'Token Bucket', '按固定速率发放令牌以限制请求速率的算法']
])}
` });
})();
