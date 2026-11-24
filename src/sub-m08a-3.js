/* ---------- M11 子文章（m08a 第 3 部分）：做市机制 ---------- */
(() => {
CUR = 'm08-3';
addCh({ id: 'm08-3', nav: '做市机制', title: 'M11.3 做市机制：订单簿、LMSR 与固定乘积做市', desc: '没有对手方怎么交易？推导 LMSR，拆解 FPMM，学会选参数 b', html: `
<h1>M11.3 做市机制：订单簿、LMSR 与固定乘积做市</h1>
${meta(['说出订单簿模式的流动性来源和冷启动问题。', '从成本函数推导出 LMSR 的价格函数和最大亏损 b·ln n，并完成二元与多结果的数值计算。', '解释 FPMM 的买入流程，比较三种机制，并按补贴预算选择参数 b。'], '<a href="#m08-2">M11.2 交易与套利</a>；建议先做 <a href="#lab-amm">AMM 实验</a>', ['lmsr'])}
${beginner(`<p><strong>流动性（Liquidity）</strong>：你想买或卖时，能不能马上以接近当前价格成交。流动性好 = 买卖方便、价格不容易被推动。</p>
<p><strong>做市商（Market Maker）</strong>：随时报出买价和卖价、等别人来成交的一方。可以是人、机构，也可以是一段算法（自动做市商，AMM）。</p>
<p><strong>自动做市商（Automated Market Maker, AMM）</strong>：用一个数学公式决定价格的合约。你和公式交易，不需要另一个人。</p>
<p><strong>成本函数（Cost Function）</strong>：一个函数 C(q)，输入“市场已售出的各种份额数量”，输出“做市商累计收到的钱”。买入的花费 = C(买入后) − C(买入前)。</p>
<p><strong>自然对数 ln 和 e</strong>：e ≈ 2.718；ln 是以 e 为底的对数，ln(e^x) = x。本篇只需要会用计算器算它们。</p>`)}

<h2>1. 一句话理解</h2>
${one('订单簿靠“人”提供流动性，冷门市场会没人报价；LMSR 和 FPMM 用公式永远报价，代价是做市方要拿出一笔补贴或资金承担有上限的亏损。')}
${call('analogy', `<p>订单簿像一个集市：买家和卖家自己来摆摊，人多才热闹，新开的集市可能一个摊位都没有。LMSR 像一个“永远营业的兑换窗口”：窗口按公式报价，卖出越多的东西越贵；窗口老板事先准备好一笔最多亏这么多的预算。</p>
<p><strong>类比的局限</strong>：兑换窗口的老板在 LMSR 里不需要判断行情，公式自动调价；但它的预算一定会在“结果揭晓时”结算，市场越偏离初始价格，老板越可能亏到上限。</p>`)}
${art('一图看懂：没有对手方时，订单簿靠人、LMSR 靠补贴、FPMM 靠资金池', 660, 340, [
  S.box(10, 34, 200, 62, { k: 'info', icon: 'users', t: '订单簿 CLOB', s: '人挂单，人接单' }),
  S.box(230, 34, 200, 62, { k: 'key', icon: 'scale', t: 'LMSR', s: '公式报价，做市方出补贴' }),
  S.box(450, 34, 200, 62, { k: 'info', icon: 'db', t: 'FPMM', s: '资金池报价，LP 出资金' }),
  S.text(330, 122, '买一笔看看（示例）', { size: 12, dim: 1, anchor: 'middle' }),
  S.box(10, 132, 200, 76, { k: 'idle', dash: 1, t: '冷启动难', s: '没人挂单就没有价格\n靠流动性奖励吸引' }),
  S.box(230, 132, 200, 76, { k: 'key', t: '买 100 份 YES 付 62.01', s: 'b = 100：0.50 → 0.731', ts: 13 }),
  S.box(450, 132, 200, 76, { k: 'info', t: '付 10 USDC 得 19.09 YES', s: '池 100+100：0.50 → 0.548', ts: 13 }),
  S.text(330, 234, '做市方最坏亏多少', { size: 12, dim: 1, anchor: 'middle' }),
  S.box(10, 244, 200, 56, { k: 'idle', dash: 1, t: '各做市商自担', s: '平台不持仓' }),
  S.box(230, 244, 200, 56, { k: 'warn', t: '最多亏 b·ln n ≈ 69.3', s: '有严格上限，补贴预先存好', ts: 13 }),
  S.box(450, 244, 200, 56, { k: 'risk', t: '接近 LP 投入的全部', s: '手续费是唯一补偿', ts: 13 }),
  S.text(330, 328, '谁出钱，谁就承担亏损：订单簿是做市商，LMSR 是补贴预算，FPMM 是 LP', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '三列是三种“谁在对面接单”的办法；每列同一个例子：买一笔，价格被推到哪里，做市方最坏亏多少。'],
  ['key', 'LMSR 的价格由公式决定，上线就有报价；代价是做市方预先拿出一笔补贴，最多亏 b·ln n。'],
  ['risk', 'FPMM 的 LP 在结果揭晓时可能只剩下输方份额，亏损接近全部投入。'],
  ['limit', '订单簿没有补贴也没有公式，冷门市场可能一个报价都没有。']
], '三种做市方式对比：订单簿由做市商挂单，冷启动困难；LMSR 用公式报价，最大亏损为 b 乘 ln n；FPMM 用资金池报价，LP 最大亏损接近全部投入。', 'm08-3')}

<h2>2. 订单簿模式</h2>
<p><strong>中央限价订单簿（Central Limit Order Book, CLOB）</strong>：交易者挂出“限价单”（指定价格和数量）。撮合引擎按“价格优先、时间优先”把能成交的买单和卖单配对。原理见 <a href="#lab-orderbook">订单簿实验</a>。</p>
${tbl(['问题', '订单簿的表现'], [
  ['流动性从哪来', '做市商和普通挂单者。平台常用“流动性奖励”（按挂单量和贴近中间价的程度发奖励）吸引做市商'],
  ['价格怎么定', '最近成交价、买一卖一中间价'],
  ['平台风险', '平台不持仓，没有方向风险'],
  ['优势', '资本效率高；专业做市商可以报很窄的价差'],
  ['劣势', '冷启动难；长尾市场无人报价；撮合通常在链下，需要信任撮合方']
])}
${mm('订单簿的冷启动困境', `
flowchart LR
  N["新市场上线"] --> E["订单簿为空"]
  E --> NT["交易者看到无报价<br/>离开"]
  NT --> NM["没有成交量<br/>做市商不愿进场"]
  NM --> E
  E -.->|"打破循环"| R1["平台流动性奖励"]
  E -.->|"打破循环"| R2["平台自营做市"]
  E -.->|"打破循环"| R3["换用 AMM<br/>LMSR 或 FPMM"]
`, [
  ['fail', '没有报价 → 没有交易 → 没有做市商，形成负循环。预测市场的长尾问题比加密货币更严重，因为每个问题都是一个独立市场。'],
  ['flow', '三种破局方式：补贴做市商、平台自己做市、用公式做市。'],
  ['key', '成熟平台常常混合使用：热门市场靠订单簿，冷门市场靠 AMM 或奖励。'],
  ['limit', '流动性奖励会吸引“刷量”行为：挂单只为拿奖励，一有风险就撤单。']
])}

<h2>3. LMSR：推导与计算</h2>
<p><strong>对数市场评分规则（Logarithmic Market Scoring Rule, LMSR）</strong>由经济学家 Robin Hanson 在 2003 年前后提出。${cite('Hanson (2003) Combinatorial Information Market Design', 'https://ideas.repec.org/a/spr/infosf/v5y2003i1d10.1023_a1022058209073.html')}它的核心是一个成本函数。</p>
<h3>3.1 成本函数</h3>
<p>设市场有 n 个结果，q<sub>i</sub> 是结果 i 已售出的份额数，b > 0 是流动性参数：</p>
${one('C(q) = b · ln( e^(q₁/b) + e^(q₂/b) + … + e^(qₙ/b) )')}
${steps(['交易者买入 Δ 份结果 i：q<sub>i</sub> 变成 q<sub>i</sub> + Δ。', '交易者付款 = C(买入后) − C(买入前)。', '卖出就是 Δ 为负，交易者收回 C(卖出前) − C(卖出后)。', '结算时，做市商对每份赢方份额支付 1。'])}
<h3>3.2 价格函数</h3>
<p>瞬时价格是成本函数对 q<sub>i</sub> 的偏导数（再买“无穷小的一份”要付多少钱）：</p>
${one('p_i = ∂C/∂q_i = e^(q_i/b) / Σ_j e^(q_j/b)')}
<p>这个式子叫 softmax。它保证两件事：每个价格都在 0 到 1 之间；所有价格之和恒等于 1。所以价格天然可以解读为概率。二元市场里它简化为 p<sub>YES</sub> = 1 / (1 + e^((q<sub>NO</sub> − q<sub>YES</sub>)/b))。</p>
<h3>3.3 最大亏损 = b · ln n</h3>
${steps(['初始 q 全为 0，C(0) = b · ln n（n 个 e^0 = 1 相加）。', '到结算时，做市商累计收入 = C(q) − C(0)。', '若结果 i 为真，做市商支付 q<sub>i</sub>。亏损 = q<sub>i</sub> − C(q) + C(0)。', '因为对数里的和至少包含 e^(q<sub>i</sub>/b) 这一项，所以 C(q) ≥ b · ln e^(q<sub>i</sub>/b) = q<sub>i</sub>。', '代入得：亏损 ≤ C(0) = b · ln n。不管交易者怎么买，做市商最多亏 b · ln n。'])}
${mm('LMSR 的内部逻辑', `
flowchart TB
  Q["已售份额向量 q"] --> C["成本函数<br/>C = b·ln Σ e^(q_i/b)"]
  C -->|"求偏导"| P["价格 p_i = softmax<br/>每个在 0~1，合计为 1"]
  T["交易者买 Δ 份结果 i"] --> Q2["q_i 增加 Δ"]
  Q2 --> PAY["付款 = C(新) − C(旧)"]
  Q2 --> P2["p_i 上升，其他结果价格下降"]
  B["参数 b"] --> C
  B --> L["最大亏损 = b·ln n<br/>做市商的补贴预算"]
`, [
  ['flow', '所有逻辑只依赖一个状态：已售份额向量 q。合约只需存 n 个数字。'],
  ['key', 'b 同时决定两件事：价格的“硬度”和做市商的最大亏损。深度和风险无法分开调。'],
  ['limit', 'b 固定不变时，市场成交量再大，深度也不会增加（LS-LMSR 等变体尝试解决这一点）。'],
  ['risk', '链上实现要算 e^x 和 ln。定点数精度和溢出处理不当，会被套利者利用舍入误差。']
])}
<h3>3.4 数值例子</h3>
<p><strong>算一算（示例一：二元市场，b = 100）</strong></p>
${steps(['初始：C(0,0) = 100 · ln 2 ≈ 69.31，YES = NO = 0.50。', '买 100 份 YES：C(100,0) = 100 · ln(e¹ + 1) = 100 · ln 3.7183 ≈ 131.33。', '花费 = 131.33 − 69.31 ≈ 62.01 USDC（用未取整的值计算），均价 0.620。', '新价格 YES = e / (e + 1) ≈ 0.731。', '如果结算为 YES：做市商收 62.01、付 100，亏 37.99，小于上限 100 · ln 2 ≈ 69.31。'])}
<p><strong>算一算（示例二：把价格推到 0.90 要花多少）</strong>。二元市场里，q<sub>NO</sub> = 0 时 YES 价格 p 对应 q<sub>YES</sub> = b · ln(p / (1 − p))。</p>
${steps(['b = 100，p = 0.90：q<sub>YES</sub> = 100 · ln 9 ≈ 219.7 份。', '此时 C = 100 · ln(9 + 1) = 100 · ln 10 ≈ 230.26。', '花费 = 230.26 − 69.31 = 160.95 USDC。', '结论：在 b = 100 的市场里，约 161 USDC 就能把价格从 0.50 推到 0.90。b 太小的市场容易被操纵。'])}
<p><strong>算一算（示例三：三结果市场，b = 100）</strong></p>
${steps(['初始：C = 100 · ln 3 ≈ 109.86，三个价格都是 1/3。', '买 50 份结果 A：C = 100 · ln(e^0.5 + 2) = 100 · ln 3.6487 ≈ 129.44。', '花费 = 129.44 − 109.86 = 19.58 USDC。', '新价格：A = 1.6487 / 3.6487 ≈ 0.452；B = C = 1 / 3.6487 ≈ 0.274。合计 1.000。', '最大亏损 = 100 · ln 3 ≈ 109.86，比二元市场的 69.31 大：结果越多，补贴越多。'])}
${lab('lmsr')}
<p><strong>实验怎么做</strong>：先用 b = 100 买 100 份 YES，核对示例一的 0.731 和 62.01；再把 b 调到 1,000 重复，观察价格几乎不动、最大亏损变成 693；最后连续买 YES 到 0.95 再结算为 YES，确认做市商亏损没有超过 b·ln 2。</p>
<h3>3.5 参数 b 怎么选</h3>
<p>两种思路（示例）：</p>
${steps(['<strong>按预算定 b</strong>：平台愿意为这个市场最多补贴 B<sub>max</sub> USDC，则 b = B<sub>max</sub> / ln n。补贴 1,000 USDC 的二元市场：b = 1,000 / 0.693 ≈ 1,443。', '<strong>按深度定 b</strong>：希望 Q 份的单笔交易把价格从 0.50 最多推到 0.55。需要 Q ≤ b · ln(0.55/0.45) ≈ 0.2007 · b。Q = 1,000 时 b ≈ 4,983，最大亏损 ≈ 3,454 USDC。', '<strong>两者取较小值</strong>，预算不够时接受更浅的深度，或者在界面上提示“流动性低”。'])}
${call('deep', `<p><strong>液体敏感 LMSR（Liquidity-Sensitive LMSR, LS-LMSR）</strong>：Othman 等人在 2010 年提出${cite('Othman et al. (2010) A Practical Liquidity-Sensitive Automated Market Maker', 'https://aminer.org/pub/5390aa7620f70186a0eab8df/a-practical-liquidity-sensitive-automated-market-maker')}，让 b 随已售份额总量增长。好处是成交量大时市场自动变深，并且做市商可能盈利；代价是价格之和略大于 1（隐含手续费），实现更复杂。</p>`)}

<h2>4. CPMM / FPMM：固定乘积做市</h2>
<p><strong>固定乘积做市商（Fixed Product Market Maker, FPMM）</strong>是 Gnosis 团队为条件代币设计的 AMM，曾用于 Omen 等预测市场。它和 Uniswap 的恒定乘积（CPMM，x · y = k，见 <a href="#m02-10">M08.2 AMM 深入</a>）同源，但池子里存的是各结果的份额，而不是两种代币。</p>
${steps(['<strong>添加流动性</strong>：LP 存入 F USDC，合约拆分成 F 份 YES + F 份 NO 放入池子，初始价格 0.50 / 0.50。', '<strong>买入 YES</strong>：交易者付 x USDC → 合约先拆分成 x YES + x NO 加入池子 → 再从池子取出若干 YES 给交易者，使“各结果余额的乘积”保持不变。', '<strong>价格</strong>：二元市场 p<sub>YES</sub> = n<sub>NO</sub> / (n<sub>YES</sub> + n<sub>NO</sub>)。池子里 YES 越少，YES 越贵。', '<strong>手续费</strong>：从投入金额里扣一部分留给 LP。', '<strong>结算</strong>：池子剩余的份额按结果兑付，归 LP 所有。'])}
<p><strong>算一算（示例：池子 100 YES + 100 NO，不计手续费，买入 10 USDC 的 YES）</strong></p>
${steps(['不变量 k = 100 × 100 = 10,000。', '10 USDC 拆分成 10 YES + 10 NO 加入池子：池子变为 110 YES + 110 NO。', '保持乘积不变：YES 余额 y 满足 y × 110 = 10,000，y ≈ 90.91。', '交易者得到 110 − 90.91 = 19.09 份 YES，均价 10 / 19.09 ≈ 0.524。', '新价格 YES = 110 / (90.91 + 110) ≈ 0.548。'])}
${mm('FPMM 买入 YES 的步骤', `
sequenceDiagram
  participant U as 交易者
  participant F as FPMM 合约
  participant CT as 条件代币合约
  U->>F: buy 投入 10 USDC 选择 YES
  F->>F: 扣除手续费留给 LP
  F->>CT: splitPosition 10 USDC
  CT-->>F: 10 YES 和 10 NO
  F->>F: 池子变为 110 YES 和 110 NO
  F->>F: 按乘积不变算出可取出 19.09 YES
  F-->>U: 转出 19.09 YES
  Note over F: 池子剩 90.91 YES 和 110 NO
`, [
  ['flow', '交易者的 USDC 并不直接“换”成 YES，而是先铸造完整集合，再用池子里的份额交换。'],
  ['key', '池子总是持有“不受欢迎”的那一边更多。结果揭晓时，如果大众押对了，池子剩下的多是归零份额，LP 亏损。'],
  ['risk', 'LP 的最大亏损接近其投入的全部资金（池子只剩输方份额）。手续费是唯一补偿。'],
  ['limit', '价格影响取决于池子大小。小池子里几十 USDC 就能推动价格。']
])}
<h3>4.1 三种机制对比</h3>
${tbl(['维度', '订单簿（CLOB）', 'LMSR', 'FPMM'], [
  ['流动性来源', '做市商与挂单者', '做市方的补贴预算（b·ln n）', 'LP 存入的资金'],
  ['冷启动', '困难', '上线即有报价', '有人存入资金后即有报价'],
  ['做市方最大亏损', '各做市商自担', '有严格上限 b·ln n', '接近 LP 投入的全部资金'],
  ['价格影响', '取决于挂单深度', '由 b 决定，固定', '由池子大小决定，随资金增加'],
  ['链上计算', '撮合多在链下', '需要 exp / ln，计算较贵', '只需乘除，便宜'],
  ['多结果支持', '每个结果一本簿', '天然支持，价格之和恒为 1', '支持，价格公式更复杂'],
  ['典型使用（公开资料）', 'Polymarket（当前）、Kalshi', '学术与企业内部市场、早期 Gnosis', 'Omen；Polymarket 早期也用过 AMM'],
  ['适合场景', '热门、高成交量市场', '平台补贴的冷门市场', '去中心化、无许可创建的市场']
])}

<h2>5. 工程层：实现 LMSR</h2>
<p>直接计算 e^(q/b) 很容易溢出（q/b = 800 时双精度浮点数就会变成无穷大）。生产代码用 <strong>log-sum-exp 技巧</strong>：先减去最大值再求指数。下面的 TypeScript 可以直接运行：</p>
${code('TYPESCRIPT', `
// 数值稳定的 log-sum-exp：ln(Σ e^x_i)
function lse(xs: number[]): number {
  const m = Math.max(...xs);
  return m + Math.log(xs.reduce((s, x) => s + Math.exp(x - m), 0));
}

export class LMSR {
  constructor(public b: number, public q: number[]) {}
  cost(q = this.q): number { return this.b * lse(q.map(x => x / this.b)); }
  prices(): number[] {
    const z = this.q.map(x => x / this.b), m = Math.max(...z);
    const e = z.map(x => Math.exp(x - m)), s = e.reduce((a, c) => a + c, 0);
    return e.map(x => x / s);
  }
  // 买 delta 份结果 i 的报价（不改状态）
  quoteBuy(i: number, delta: number): number {
    const nq = [...this.q]; nq[i] += delta;
    return this.cost(nq) - this.cost();
  }
  // 给定预算 usd，二分查找最多能买多少份结果 i
  sharesForBudget(i: number, usd: number): number {
    let lo = 0, hi = usd * 1000;                  // 价格 > 0.001 时足够
    for (let k = 0; k < 80; k++) {
      const mid = (lo + hi) / 2;
      this.quoteBuy(i, mid) > usd ? (hi = mid) : (lo = mid);
    }
    return lo;
  }
  maxLoss(): number { return this.b * Math.log(this.q.length); }
}

const m = new LMSR(100, [0, 0]);
console.log(m.quoteBuy(0, 100).toFixed(2));        // 62.01
console.log(m.sharesForBudget(0, 62.01).toFixed(1)); // 约 100.0
console.log(m.maxLoss().toFixed(2));               // 69.31
`)}
<p>在链上实现时要额外注意三件事：</p>
${steps(['<strong>定点数学库</strong>：Solidity 没有浮点数。常用 PRBMath 等库提供 18 位小数的定点 exp 与 ln。exp 的输入有上限，必须先做 log-sum-exp 平移。', '<strong>舍入方向</strong>：交易者付款向上取整，交易者收款向下取整，让误差永远有利于做市方，避免“买卖循环刷舍入误差”。', '<strong>预算资金</strong>：创建市场时把 b·ln n 的补贴预先存进合约，保证最坏情况也能足额兑付。'])}
${code('SOLIDITY', `
// 示意：二元 LMSR 的成本函数（依赖 PRBMath v4 的 SD59x18 定点类型）
// 生产使用前必须做精度测试、模糊测试和审计
pragma solidity ^0.8.20;
import { SD59x18, sd, exp, ln } from "@prb/math/src/SD59x18.sol";

library LMSRMath {
    // C = b * ln(e^(qY/b) + e^(qN/b))，用 log-sum-exp 防止 exp 溢出
    function cost(SD59x18 qY, SD59x18 qN, SD59x18 b) internal pure returns (SD59x18) {
        SD59x18 a = qY.div(b);
        SD59x18 c = qN.div(b);
        SD59x18 m = a.gt(c) ? a : c;
        SD59x18 s = exp(a.sub(m)).add(exp(c.sub(m)));
        return b.mul(m.add(ln(s)));
    }
}
`)}
${tbl(['生产检查项', '为什么', '怎么验证'], [
  ['补贴资金已预存', '最坏情况需要支付 b·ln n', '部署脚本断言合约余额 ≥ b·ln n'],
  ['舍入方向有利于做市方', '防止循环买卖套取舍入误差', '模糊测试：随机买卖后卖回，交易者不能净赚'],
  ['exp 输入有界', '定点 exp 有最大输入', '单元测试极端 q 值（q/b = 100、−100）'],
  ['价格之和 = 1', '实现错误会制造集合套利', '每笔交易后断言 Σp 与 1 的误差 < 1e-12'],
  ['b 的修改权限', '中途改 b 会改变所有人的价格', 'b 设为不可变，或只允许在无持仓时修改']
])}
${tryit(`<p><strong>任务：用本地 Node.js 验证 LMSR 的三个性质。</strong></p>
<ol><li>把上面的 TypeScript 保存为 <code>lmsr.ts</code>，运行 <code>npx tsx lmsr.ts</code>（或删去类型标注后用 <code>node</code> 运行）。</li>
<li>加一段循环：随机买入 1,000 次（随机结果、随机数量），每次检查价格之和与 1 的误差。</li>
<li>结束时分别假设每个结果为真，计算做市商亏损 = q<sub>i</sub> − (C(q) − C(0))。</li>
<li>预期结果：价格之和误差小于 1e-12；任何结果下的亏损都不超过 <code>maxLoss()</code>。</li></ol>`)}
${mistakes([
  ['LMSR 做市商一定亏钱', 'LMSR 最多亏 b·ln n，但不一定亏。如果交易者在两个方向来回交易，做市商可能小赚。它的设计目标是“用有限补贴换取信息”。'],
  ['b 越大越好', 'b 越大，深度越好，但最大亏损同比例增加。b 要和补贴预算匹配。'],
  ['FPMM 的 LP 只有无常损失，不会大亏', '预测市场结算时，一方份额归零。池子剩下的多是输方份额时，LP 会损失大部分本金。'],
  ['订单簿一定比 AMM 好', '订单簿在热门市场更高效，但冷门市场常常没有报价。AMM 保证永远可以成交。']
])}
${recap([
  '订单簿靠人提供流动性，冷启动和长尾市场是主要难题。',
  'LMSR：C(q) = b·ln Σe^(q_i/b)，价格是 softmax，合计恒为 1。',
  'LMSR 最大亏损 = b·ln n，可以证明：C(q) ≥ q_i。',
  'FPMM：先铸造完整集合，再按乘积不变取出份额；LP 承担结算时的方向损失。',
  '选 b：按预算 b = B/ln n，或按目标深度反推，取较小值。',
  '链上实现要做 log-sum-exp 平移、舍入有利于做市方、预存补贴。'
])}
${quiz([
  { q: '一个 4 结果的 LMSR 市场，b = 200。做市商的最大亏损约是多少？', o: ['138.6 USDC', '200 USDC', '277.3 USDC', '800 USDC'], a: 2, why: 'b·ln n = 200 × ln 4 ≈ 200 × 1.386 = 277.3。138.6 是二元市场的值（ln 2）。' },
  { q: 'LMSR 的价格函数为什么保证所有结果价格之和为 1？', o: ['因为价格是 softmax：每项除以同一个总和', '因为 b 等于 1', '因为做市商每次交易后手动调整', '因为订单簿撮合'], a: 0, why: 'p_i = e^(q_i/b) / Σ e^(q_j/b)，分母相同，所有分子加起来正好等于分母。' },
  { q: 'FPMM 池子 100 YES + 100 NO，不计手续费，投入 10 USDC 买 YES。交易者得到约多少 YES？', o: ['10 份', '19.09 份', '20 份', '9.09 份'], a: 1, why: '10 USDC 先拆成 10 YES + 10 NO，池子变 110 / 110；YES 余额降到 10,000 / 110 ≈ 90.91，取出 110 − 90.91 ≈ 19.09。' },
  { q: '平台愿意为一个二元市场最多补贴 500 USDC。按预算法，b 最大约是多少？', o: ['500', '250', '346', '721'], a: 3, why: 'b = 500 / ln 2 ≈ 500 / 0.693 ≈ 721。' }
])}
${exercises([["计算题（示例）：一个二元 LMSR 市场，b = 50，初始 q 全为 0。买入 50 份 YES 要花多少？新价格是多少？做市商最大亏损是多少？", "<p>C(0,0) = 50 · ln 2 ≈ 34.66。C(50,0) = 50 · ln(e + 1) ≈ 50 × 1.3133 ≈ 65.66。花费 ≈ 65.66 − 34.66 = <strong>31.01 USDC</strong>。新价格 YES = e / (e + 1) ≈ <strong>0.731</strong>。最大亏损 = b · ln 2 ≈ 34.66。q/b 的比值与 b = 100 买 100 份时相同，所以价格相同，花费正好减半。</p>"], ["计算题（示例）：FPMM 池子有 100 YES + 100 NO，不计手续费。交易者投入 25 USDC 买 YES。他得到多少 YES？均价和新价格各是多少？", "<p>不变量 k = 100 × 100 = 10,000。25 USDC 拆成 25 YES + 25 NO，池子变为 125 YES + 125 NO。YES 余额 y 满足 y × 125 = 10,000，y = 80。交易者得到 125 − 80 = <strong>45 份 YES</strong>，均价 25 ÷ 45 ≈ 0.556。新价格 YES = 125 ÷ (80 + 125) ≈ <strong>0.610</strong>。</p>"], ["设计题（示例）：平台为一个二元市场最多补贴 2,000 USDC，并希望单笔 1,000 份的交易把价格从 0.50 最多推到 0.55。按两种思路选 b，并说明最终取值。", "<p>按预算：b = 2,000 ÷ ln 2 ≈ 2,885。按深度：需要 b ≈ 1,000 ÷ 0.2007 ≈ 4,983，对应最大亏损约 3,454 USDC，超出预算。两者取较小值，<strong>b ≈ 2,885</strong>。此时单笔不超过约 0.2007 × 2,885 ≈ 579 份，价格才不超过 0.55。界面上应提示“流动性低”。</p>"]])}
${checklist(["能从成本函数求偏导得到 softmax 价格，并解释所有价格之和为何恒为 1。", "能用 C(买入后) − C(买入前) 手算二元或三结果 LMSR 的买入花费。", "能证明 LMSR 做市商最大亏损为 b·ln n，并按补贴预算反推 b。", "能手算 FPMM 买入后交易者得到的份额、均价和新价格。", "能说出链上实现 LMSR 的三条要求：log-sum-exp 平移、舍入有利于做市方、预存补贴。"])}
${terms([
  ['中央限价订单簿', 'CLOB, Central Limit Order Book', '按价格优先、时间优先撮合限价单的交易机制'],
  ['自动做市商', 'AMM, Automated Market Maker', '用公式自动报价、与交易者直接成交的合约'],
  ['对数市场评分规则', 'LMSR', '以 C = b·ln Σe^(q/b) 为成本函数的预测市场做市算法'],
  ['成本函数', 'Cost Function', '把已售份额映射为做市商累计收入的函数，交易花费为前后差值'],
  ['流动性参数', 'Liquidity Parameter b', 'LMSR 中决定价格敏感度和最大亏损的参数'],
  ['固定乘积做市商', 'FPMM, Fixed Product Market Maker', '保持池中各结果份额余额乘积不变的预测市场 AMM'],
  ['冷启动', 'Cold Start', '新市场没有报价和成交量、难以吸引参与者的问题'],
  ['log-sum-exp', 'Log-Sum-Exp Trick', '先减去最大值再求指数，避免数值溢出的计算技巧']
])}
` });
})();
