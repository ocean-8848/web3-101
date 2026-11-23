/* ---------- M03 子文章（2/4）：单位与精度、写合约、签名与登录 ---------- */
(() => {
CUR = 'm07-4';
addCh({ id: 'm07-4', nav: '单位与精度', title: 'M03.4 单位与精度：wei、decimals、bigint 与金额显示', desc: '为什么金额不能用 number，怎样用 bigint 和定点数把每一分钱算对。', html: `
<h1>M03.4 单位与精度：wei、decimals、bigint 与金额显示</h1>
${meta(['在 wei、gwei、ether 之间换算，说出 USDC、WBTC、多数代币的 decimals。', '解释 JS number 为什么会算错钱，掌握 bigint 的运算和截断规则。', '用 parseUnits/formatUnits 和定点数方法正确计算、显示金额，并选对舍入方向。'], '<a href="#m07-3">M03.3 读合约</a>、<a href="#m02-5">M02.5 ERC-20 与授权</a>', ['units'])}
${beginner(`<p><strong>最小单位</strong>：链上只存整数。1 ETH 在链上记作 10<sup>18</sup> 个 wei，就像 1 元记作 100 分。</p>
<p><strong>decimals（小数位数）</strong>：代币合约告诉前端“链上整数要除以 10 的几次方才是人看的数量”。</p>
<p><strong>浮点数（Floating Point）</strong>：计算机表示小数的一种近似方法。它很快，但不能精确表示 0.1 这样的数。</p>
<p><strong>bigint</strong>：JavaScript 的任意精度整数类型，写法是数字后加 n，例如 <code>10n ** 18n</code>。</p>
<p><strong>定点数（Fixed Point）</strong>：用“整数 + 约定的小数位数”表示小数。链上金额全部是定点数。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上只有整数。前端的工作是：输入时把人类小数精确地变成整数（parseUnits），显示时把整数精确地变回小数（formatUnits），中间全程用 bigint。')}
${call('analogy', `<p>银行系统从不存“12.34 元”，它存“1234 分”。所有加减乘除都在“分”上算，只有打印回单时才加上小数点。链上金额也一样，只是“分”的位数由每个代币自己决定：ETH 是 18 位，USDC 是 6 位。</p>
<p>类比的局限：人民币的最小单位全国统一。代币的 decimals 各不相同，同一个“1”在不同代币里代表的链上整数可以相差 10<sup>12</sup> 倍。</p>`)}
${art('一图看懂：链上只有整数，小数点只在屏幕上出现', 660, 300, [
  S.zone(232, 30, 196, 110, { t: '计算与链上：只有 bigint 整数', k: 'info' }),
  S.box(10, 56, 120, 66, { k: 'tint', t: '输入框 1.5', s: '保存为字符串' }),
  S.box(242, 62, 176, 66, { k: 'key', t: 'bigint', s: '1500000000000000000n', mono: 1 }),
  S.box(530, 56, 120, 66, { k: 'tint', t: '屏幕显示 1.5', s: '舍入只在这里' }),
  S.arrow(132, 90, 240, 90, { label: 'parseUnits' }),
  S.arrow(420, 90, 528, 90, { label: 'formatUnits' }),
  S.text(330, 172, '同样是“1 个”，不同代币的链上整数不同（decimals 由代币自己决定）', { size: 12.5, anchor: 'middle', mw: 620 }),
  S.box(10, 184, 200, 50, { k: 'idle', t: 'ETH · 18 位', s: '1,000,000,000,000,000,000', mono: 1 }),
  S.box(230, 184, 200, 50, { k: 'risk', t: 'USDC · 6 位', s: '1,000,000', mono: 1 }),
  S.box(450, 184, 200, 50, { k: 'idle', t: 'WBTC · 8 位', s: '100,000,000', mono: 1 }),
  S.text(330, 278, '全程 bigint：用 Number 会丢精度，写死 decimals 会差 10^12 倍', { size: 13, anchor: 'middle', mw: 620 })
], [ ['flow', '输入的字符串用 parseUnits 变成 bigint，所有计算都在整数上做，最后一步才用 formatUnits 变回小数显示。'], ['key', '“小数点”只存在于输入和显示两端；中间的金额永远是整数。'], ['risk', '任何一步经过 Number 或 parseFloat 都可能丢精度；USDC 按 18 位当成 6 位，金额会差 10^12 倍。'], ['limit', 'decimals 要从链上读或取自可信代币列表，不能凭名字猜。'] ], '输入字符串通过 parseUnits 变成 bigint，在链上和计算中只用整数，显示时用 formatUnits 变回小数；ETH、USDC、WBTC 的 decimals 分别是 18、6、8', 'm07-4')}

<h2>2. 单位体系：wei、gwei、ether 与代币 decimals</h2>
${tbl(['单位', '等于多少 wei', '常见用途'], [
  ['wei', '1', '链上存储与计算的最小单位'],
  ['gwei', '10<sup>9</sup>', 'Gas 价格，例如 baseFee 0.05 gwei'],
  ['ether', '10<sup>18</sup>', '人类可读的 ETH 数量']
])}
${tbl(['代币', 'decimals', '1 个代币的链上整数', '备注'], [
  ['ETH / WETH', '18', '1,000,000,000,000,000,000', '原生币固定 18'],
  ['USDC / USDT', '6', '1,000,000', '多数链上都是 6，但 BNB Chain 上的桥接版本是 18（以合约为准）'],
  ['WBTC', '8', '100,000,000', '与比特币的 satoshi 对齐'],
  ['DAI、UNI、多数 ERC-20', '18', '10<sup>18</sup>', 'OpenZeppelin ERC20 默认 18'],
  ['任意代币', '读合约 <code>decimals()</code>', '—', '<strong>永远从链上读或从可信代币列表取，不要硬猜</strong>']
])}
${call('warn', `<p>同名代币在不同链上 decimals 可能不同。按“USDC 就是 6 位”写死，在某条链上会显示错 10<sup>12</sup> 倍。代币配置要以 <code>(chainId, address)</code> 为键，decimals 从合约读取并缓存。</p>`)}

<h2>3. 为什么不能用 JavaScript number</h2>
<p>JS 的 <code>number</code> 是 IEEE 754 双精度浮点数：53 位有效二进制位。它有两个致命问题。</p>
${steps(['<strong>整数超过 2<sup>53</sup> 就不精确。</strong>2<sup>53</sup> = 9,007,199,254,740,992，约 0.009 ETH 对应的 wei 数。<code>Number("12345678901234567890")</code> 得到 12345678901234567000，末尾几位被吞掉。', '<strong>十进制小数无法精确表示。</strong><code>0.1 + 0.2</code> 得到 0.30000000000000004；<code>1.1 * 3</code> 得到 3.3000000000000003。', '<strong>误差会被放大。</strong>把 3.3000000000000003 乘 10<sup>6</sup> 再取整，有时得到多 1 或少 1 的链上整数；对 18 位代币，误差更明显。'])}
${mm('金额在前端的正确流转路径', `
flowchart LR
  IN["用户输入<br/>字符串 1.5"] -->|"校验格式与位数"| PU["parseUnits<br/>字符串 → bigint"]
  PU --> CALC["bigint 运算<br/>加减乘除 · 比较"]
  CHAIN["合约返回<br/>bigint"] --> CALC
  CALC -->|"交易参数"| TX["writeContract"]
  CALC --> FU["formatUnits<br/>bigint → 字符串"]
  FU --> DISP["显示格式化<br/>千分位 · 舍入"]
  IN -.->|"禁止"| NUM["Number / parseFloat"]
  NUM -.-> BAD["精度丢失"]
`, [
  ['flow', '输入框的值永远先保存为字符串，直接交给 parseUnits；链上返回的是 bigint；两者在 bigint 世界里汇合。'],
  ['fail', '任何一步经过 Number 或 parseFloat，都可能引入误差，最终交易金额和用户看到的不一致。'],
  ['key', '只有“显示”这一步可以做舍入，而且舍入只影响展示文本，不影响交易参数。'],
  ['limit', 'bigint 不能和 number 混算（会抛 TypeError），也不能直接 JSON.stringify，需要自己转成字符串。']
])}

<h2>4. bigint 运算规则与 parseUnits / formatUnits</h2>
${tbl(['规则', '例子', '结果'], [
  ['字面量加 n', '<code>10n ** 18n</code>', '1000000000000000000n'],
  ['不能和 number 混算', '<code>1n + 1</code>', 'TypeError'],
  ['除法向零截断', '<code>7n / 2n</code>', '3n（小数部分直接丢弃）'],
  ['负数也向零截断', '<code>-7n / 2n</code>', '-3n'],
  ['比较可以混用', '<code>1n &lt; 2</code>', 'true'],
  ['JSON 不支持', '<code>JSON.stringify({ a: 1n })</code>', 'TypeError，先 <code>.toString()</code>']
])}
${code('TYPESCRIPT', `
import { parseUnits, formatUnits, parseEther, formatEther, parseGwei, formatGwei } from 'viem'

parseUnits('1234.567891', 6)     // 1234567891n          （USDC）
formatUnits(1234567891n, 6)      // '1234.567891'
parseEther('0.05')               // 50000000000000000n   （= parseUnits(x, 18)）
formatEther(10n ** 18n)          // '1'
parseGwei('0.05')                // 50000000n wei
formatGwei(30_000_000_000n)      // '30'

// 原理：parseUnits 只做字符串拼接，不经过浮点数
function myParseUnits(s: string, d: number): bigint {
  if (!/^\\d+(\\.\\d*)?$/.test(s)) throw new Error('格式错误')
  const [i, f = ''] = s.split('.')
  if (f.length > d) throw new Error(\`最多 \${d} 位小数\`)   // 生产建议：直接拒绝，而不是悄悄舍入
  return BigInt(i + f.padEnd(d, '0'))
}
`)}
${call('info', `<p>不同库对“小数位超过 decimals”的处理不同：ethers v6 的 <code>parseUnits</code> 直接抛错；viem 的 <code>parseUnits</code> 会对多出的位做四舍五入。不要依赖库的默认行为，在输入框层面就限制位数。</p>`)}
<p>先打开下面的实验，保持默认的 1234.567891 和 USDC，观察链上整数和十六进制；再切换到 ETH，看 gwei 一栏；最后点“错误 decimals”区域，看差了多少倍。</p>
${lab('units')}
<p>做完实验，你应该观察到：① 把 USDC 当 18 位解析，链上整数大 10<sup>12</sup> 倍；② 输入超过 decimals 的位数会被截断；③ number 计算的 1.1 × 3 与 bigint 结果不一致。</p>

<h2>5. 金额显示与舍入方向</h2>
<p>显示金额有三个要求：可读（千分位、合适的位数）、不误导（舍入方向对用户保守）、可核对（hover 或展开能看到完整值）。</p>
${mm('显示金额时如何选择舍入方向', `
flowchart TD
  S["要显示一个 bigint 金额"] --> Q1{"这个数是用户<br/>“拥有或将收到”的？"}
  Q1 -->|"是：余额 · 最少收到"| DOWN["向下截断<br/>宁可少显示"]
  Q1 -->|"否"| Q2{"是用户<br/>“要付出”的？"}
  Q2 -->|"是：支付额 · Gas · 手续费"| UP["向上取整<br/>宁可多显示"]
  Q2 -->|"否：价格 · 汇率"| SIG["保留有效数字<br/>标注“约”"]
  DOWN --> TINY{"结果显示为 0<br/>但原值大于 0？"}
  TINY -->|"是"| LT["显示 小于 0.000001"]
  TINY -->|"否"| OUT["输出文本"]
  UP --> OUT
  SIG --> OUT
`, [
  ['key', '舍入只改变显示文本。交易参数永远使用未经舍入的原始 bigint。'],
  ['fail', '余额向上舍入：界面显示 1.24，实际只有 1.2345，用户点“最大”后交易失败。'],
  ['risk', '“最少收到”向上舍入等于向用户承诺了拿不到的数量，会引发客诉甚至法律风险。'],
  ['limit', '价格类数字没有“对用户保守”的方向，用有效数字加“约”字表达即可。']
])}
${tbl(['场景', '舍入方向', '理由'], [
  ['“你的余额”', '向下', '显示多了，用户点“最大”会失败'],
  ['“你将收到（至少）”', '向下', '不承诺用户拿不到的数'],
  ['“你需要支付”', '向上', '不让用户低估成本'],
  ['手续费、Gas 估算', '向上', '宁可多估，避免余额不足'],
  ['极小值，例如 0.0000003', '显示“&lt; 0.000001”', '避免显示成 0 让用户误以为没有']
])}
${code('TYPESCRIPT', `
import { formatUnits } from 'viem'

// 把 bigint 金额格式化为显示文本：先截断到 maxFrac 位（向下），再加千分位
export function formatAmount(raw: bigint, decimals: number, maxFrac = 6, locale = 'zh-CN') {
  const s = formatUnits(raw, decimals)                    // 精确的十进制字符串
  const [i, f = ''] = s.split('.')
  const cut = f.slice(0, maxFrac).replace(/0+$/, '')      // 向下截断 + 去尾零
  if (raw > 0n && BigInt(i) === 0n && cut === '') return '< 0.' + '0'.repeat(maxFrac - 1) + '1'
  const intPart = new Intl.NumberFormat(locale).format(BigInt(i))  // Intl 支持直接格式化 bigint
  return cut ? intPart + '.' + cut : intPart
}

formatAmount(1234567891n, 6, 2)        // '1,234.56'（不是 1,234.57）
formatAmount(300n, 18, 6)              // '< 0.000001'
`)}

<h2>6. 价格与金额计算：定点数方法</h2>
<p>价格本身也是定点数。例如 Chainlink 的 ETH/USD 价格通常带 8 位小数：价格 3,456.78 美元在链上是 345678000000。计算“1.5 ETH 值多少 USDC”，要把三个精度对齐。</p>
<h3>算一算：1.5 ETH 按 3,456.78 美元换算成 USDC（示例）</h3>
${steps(['数量：1.5 ETH = 1,500,000,000,000,000,000（18 位）。', '价格：3,456.78 × 10<sup>8</sup> = 345,678,000,000（8 位）。', '相乘：1.5×10<sup>18</sup> × 345,678,000,000 = 5.18517 × 10<sup>29</sup>，此时精度是 18 + 8 = 26 位。', '目标是 USDC 的 6 位，所以除以 10<sup>26−6</sup> = 10<sup>20</sup>：得到 5,185,170,000。', '显示：5,185,170,000 ÷ 10<sup>6</sup> = 5,185.17 USDC。核对：1.5 × 3,456.78 = 5,185.17 ✓。'])}
${code('TYPESCRIPT', `
// 先乘后除，保留精度；除法截断的方向就是舍入方向
export function quoteValue(amount: bigint, amountDec: number, price: bigint, priceDec: number, outDec: number) {
  const scale = 10n ** BigInt(amountDec + priceDec - outDec)
  return (amount * price) / scale                     // 向下取整：对“你将收到”保守
}
export function mulDivUp(a: bigint, b: bigint, d: bigint) {
  return (a * b + d - 1n) / d                          // 向上取整：用于“你需要支付”
}

// 滑点下限：amountOutMin = quote × (10000 − bps) / 10000，用基点（bps）避免小数
export const minOut = (quote: bigint, slippageBps: bigint) => (quote * (10_000n - slippageBps)) / 10_000n
minOut(5_185_170_000n, 50n)   // 0.5% 滑点 → 5159244150n（= 5,159.244150 USDC）
`)}
${call('warn', `<p><strong>先除后乘会丢精度。</strong><code>(amount / scale) * price</code> 会在第一步把小数全部截掉。规则：所有乘法做完再做一次除法。合约里同样如此（Solidity 的 mulDiv）。</p>`)}
${tryit(`<p>在浏览器控制台验证精度陷阱：</p>${steps(['按 F12 打开控制台，输入 <code>0.1 + 0.2</code>，预期 0.30000000000000004。', '输入 <code>Number("12345678901234567890")</code>，预期 12345678901234567000。', '输入 <code>1.1 * 3</code>，预期 3.3000000000000003。', '输入 <code>11n * 3n * 10n ** 5n</code>，预期 3300000n，即 3.3 USDC 的精确链上整数。', '输入 <code>7n / 2n</code>，预期 3n，体会截断。'])}`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['金额状态全程是 string 或 bigint', '避免浮点误差', 'ESLint 规则或代码审查：金额相关代码不出现 Number()/parseFloat'],
  ['decimals 按 (chainId, address) 从链上读取', '同名代币在不同链精度不同', '单元测试覆盖 6、8、18 位代币'],
  ['输入框限制小数位不超过 decimals', '防止静默舍入', 'E2E：输入 7 位小数的 USDC 被拒绝'],
  ['舍入方向按场景区分', '不误导用户', '快照测试：余额向下、支付向上'],
  ['bigint 序列化统一处理', 'JSON.stringify 会抛错', '接口层测试含 bigint 的对象']
])}

${mistakes([
  ['金额不大时用 number 没问题。', '误差与金额大小无关：0.1 + 0.2 就已出错；18 位代币的链上整数很快超过 2<sup>53</sup>。'],
  ['所有稳定币都是 6 位。', 'decimals 由合约决定，同名代币在不同链上可能是 18 位。必须读合约。'],
  ['显示时四舍五入最公平。', '余额和“至少收到”应向下，支付应向上。四舍五入会让“最大”按钮失败。'],
  ['先除后乘和先乘后除结果一样。', '整数除法会截断，先除会丢掉全部小数。所有乘法完成后再除一次。']
])}
${recap([
  '1 ether = 10<sup>18</sup> wei，1 gwei = 10<sup>9</sup> wei；USDC 通常 6 位，WBTC 8 位，多数代币 18 位，以合约为准。',
  'JS number 只有 53 位有效精度且十进制小数不精确，不能用于金额。',
  'bigint 除法向零截断，不能与 number 混算，不能直接 JSON 序列化。',
  '输入用 parseUnits，显示用 formatUnits，舍入只发生在显示层且方向要对用户保守。',
  '价格计算用定点数：先乘后除，用基点表示滑点和费率。'
])}
${quiz([
  { q: '用户在 USDC（6 位）输入框里输入 2.5，正确的链上整数是？', o: ['2.5', '2500000n', '2500000000000000000n', '25n'], a: 1, why: '2.5 × 10<sup>6</sup> = 2,500,000。2500000000000000000n 是按 18 位解析的结果，大了 10<sup>12</sup> 倍。' },
  { q: '<code>-7n / 2n</code> 的结果是？', o: ['-4n', '-3.5', '-3n', 'TypeError'], a: 2, why: 'bigint 除法向零截断，-3.5 截断为 -3n。不是向下取整（-4n），也不会得到小数。' },
  { q: '用户余额是 1.2345678 USDC 的链上值（实际 6 位：1234567n），界面保留 2 位小数，应显示？', o: ['1.24', '1.23', '1.2345', '1'], a: 1, why: '余额要向下截断，显示 1.23。显示 1.24 会让用户点击“最大”时余额不足。' },
  { q: '下面哪个写法计算“amount 乘以价格再缩放”最安全？', o: ['<code>(amount * price) / scale</code>', '<code>(amount / scale) * price</code>', '<code>Number(amount) * Number(price) / Number(scale)</code>', '<code>parseFloat(formatUnits(amount, 18)) * 3456.78</code>'], a: 0, why: '先乘后除保留精度。先除会截断小数；转成 Number 或 parseFloat 会引入浮点误差。' },
  { q: '为什么说把 USDC 按 18 位解析会“差 10<sup>12</sup> 倍”？', o: ['因为 18 − 6 = 12，链上整数多乘了 10<sup>12</sup>', '因为 USDC 有 12 位小数', '因为 gwei 是 10<sup>12</sup>', '因为浮点误差'], a: 0, why: '解析时乘的是 10<sup>18</sup> 而不是 10<sup>6</sup>，相差 10<sup>12</sup>。gwei 是 10<sup>9</sup>；这与浮点误差无关。' }
])}
${exercises([["（示例）用户在 WBTC（8 位）输入框里输入 0.0125。正确的链上整数是多少？如果代码误按 18 位解析，会差多少倍？", "<p>0.0125 × 10^8 = 1,250,000，即 <code>parseUnits('0.0125', 8)</code> 返回 1250000n。按 18 位解析得到 12,500,000,000,000,000。两者相差 10^(18−8) = 10^10 倍。所以 decimals 必须从合约读取。</p>"], ["（示例）报价是 2,500,000,000（2,500 USDC），滑点 30 bps，最少收到是多少？另有一笔 0.3% 的手续费，按 1,234,567（链上整数）计算，向下和向上取整各是多少，显示给用户时用哪个？", "<p>minOut = 2,500,000,000 × 9,970 ÷ 10,000 = 2,492,500,000，即 2,492.5 USDC。手续费 = 1,234,567 × 30 ÷ 10,000 = 3,703.701。向下截断得 3,703，<code>mulDivUp</code> 向上得 3,704。手续费是用户要付出的数，应向上取整，显示 3,704。</p>"], ["你想把一份含 bigint 的报价对象存进 localStorage，<code>JSON.stringify</code> 直接报错。为什么？应该怎样存取？", "<p>bigint 不能直接被 JSON 序列化，会抛 TypeError。存储前把每个 bigint 字段转成字符串，例如 <code>amount.toString()</code>。读取后再用 <code>BigInt(str)</code> 还原。全程不要经过 Number，否则会丢精度。</p>"]])}
${checklist(["能在 wei、gwei、ether 之间换算，并说出 USDC、WBTC 和多数 ERC-20 的常见 decimals。", "能用 parseUnits 和 formatUnits 在输入字符串与链上 bigint 之间换算。", "能按场景选舍入方向：余额和最少收到向下，支付和 Gas 向上。", "能用先乘后除和基点写出价格换算与 minOut 计算。", "能以 (chainId, address) 为键从链上读取并缓存 decimals。"])}
${terms([
  ['wei', 'wei', 'ETH 的最小单位，1 ETH = 10^18 wei'],
  ['gwei', 'gigawei', '10^9 wei，常用于表示 Gas 价格'],
  ['decimals', 'Decimals', '代币链上整数与人类数量之间的小数位数'],
  ['bigint', 'BigInt', 'JavaScript 的任意精度整数类型'],
  ['定点数', 'Fixed-Point Number', '用整数加约定小数位表示小数的方法'],
  ['基点', 'Basis Point (bps)', '万分之一，50 bps = 0.5%'],
  ['parseUnits / formatUnits', 'parseUnits / formatUnits', 'viem 中字符串与链上整数互相转换的函数']
])}
` });

CUR = 'm07-5';
addCh({ id: 'm07-5', nav: '写合约', title: 'M03.5 写合约：模拟、发送、确认与错误处理', desc: '从参数校验到回执刷新的完整写流程，approve 与 Permit，错误解析与乐观更新。', html: `
<h1>M03.5 写合约：模拟、发送、确认与错误处理</h1>
${meta(['按“校验 → 模拟 → 发送 → 等待回执 → 刷新”实现一次完整的合约写入。', '实现 approve + 操作的两步流程和 Permit 一步流程，并说出各自的风险。', '把用户拒签、revert、自定义错误、余额不足、Gas 估算失败翻译成用户能懂的文案。'], '<a href="#m07-3">M03.3 读合约</a>、<a href="#m07-4">M03.4 单位与精度</a>')}
${beginner(`<p><strong>交易（Transaction）</strong>：改变链上状态的请求，需要签名、花 Gas、等待打包（见 <a href="#m01-4">M01.4 交易全解</a>）。</p>
<p><strong>模拟（Simulation）</strong>：在节点上“预演”一次交易，看会不会失败，但不真正上链。</p>
<p><strong>回执（Receipt）</strong>：交易打包后的结果，<code>status</code> 为 success 表示成功，reverted 表示执行失败。</p>
<p><strong>revert（回滚）</strong>：合约检查不通过时主动中止执行，所有状态改动撤销，但已消耗的 Gas 不退。</p>
<p><strong>授权（Allowance）</strong>：你允许某个合约从你的地址转走某代币的最大数量。</p>`)}

<h2>1. 一句话理解</h2>
${one('写合约 = 先在本地预演确认能成功，再请钱包签名发送，然后盯着回执，最后刷新受影响的数据。任何一步失败，都要给用户一个能理解、能行动的提示。')}
${call('analogy', `<p>寄挂号信：先在柜台核对地址和邮资（模拟），然后签字寄出（签名发送），拿到挂号单号（txHash），再查物流直到签收（等待回执），最后在你的账本上记一笔（刷新数据）。</p>
<p>类比的局限：挂号信寄丢了邮局会赔。交易 revert 时 Gas 照扣，没有人赔。所以“柜台核对”这一步在 Web3 更重要。</p>`)}
${art('一图看懂：先在链下预演，再签名上链，最后盯着回执', 660, 292, [
  S.zone(10, 30, 248, 122, { t: '链下 · 不花钱，可反复试', k: 'ok' }),
  S.zone(270, 30, 246, 122, { t: '链上 · 打包后 Gas 照扣', k: 'risk' }),
  S.box(18, 70, 100, 70, { k: 'tint', t: '校验', s: '金额 · 余额\n链 ID' }),
  S.box(148, 70, 100, 70, { k: 'key', t: '模拟', s: 'eth_call\n估 Gas' }),
  S.box(278, 70, 100, 70, { k: 'warn', t: '签名', s: '钱包弹窗\n你确认' }),
  S.box(408, 70, 100, 70, { k: 'info', t: '等回执', s: 'txHash\n追踪状态' }),
  S.box(538, 70, 100, 70, { k: 'ok', t: '刷新', s: '余额 授权\n历史' }),
  S.arrow(120, 105, 146, 105),
  S.arrow(250, 105, 276, 105),
  S.arrow(380, 105, 406, 105),
  S.arrow(510, 105, 536, 105),
  S.text(68, 176, '填错在这里拦', { size: 11.5, dim: 1, anchor: 'middle', mw: 110 }),
  S.text(198, 176, 'revert 原因在这里\n暴露，不花 Gas', { size: 11.5, dim: 1, anchor: 'middle', mw: 120 }),
  S.text(328, 176, '拒签 4001\n是正常分支', { size: 11.5, dim: 1, anchor: 'middle', mw: 110 }),
  S.text(458, 176, 'reverted：\nGas 照扣', { size: 11.5, dim: 1, anchor: 'middle', mw: 110 }),
  S.text(588, 176, '受影响的数据\n一起刷新', { size: 11.5, dim: 1, anchor: 'middle', mw: 110 }),
  S.text(330, 262, '能在链下失败的，就不要拿真金白银去试', { size: 13.5, anchor: 'middle', mw: 620 })
], [ ['flow', '五步顺序固定：校验、模拟、签名、等回执、刷新；前两步在链下，签名之后才会花钱。'], ['key', '模拟是写合约最值钱的一步：它让会失败的交易在花 Gas 之前就失败。'], ['fail', '交易上链后 revert，Gas 照扣；所以回执状态必须看 success 还是 reverted，不能只看“已打包”。'], ['limit', '用户拒签不是错误，不要弹红色报错。'] ], '写合约分五步：链下校验与模拟不花钱，钱包签名后上链，等待回执并刷新数据；上链后失败 Gas 仍会被扣', 'm07-5')}

<h2>2. 完整写流程</h2>
${mm('一次合约写入的调用链', `
sequenceDiagram
  participant U as 用户
  participant F as 前端
  participant R as RPC 节点
  participant W as 钱包
  U->>F: 输入金额并点击提交
  F->>F: 1 参数校验 金额 余额 链 ID
  F->>R: 2 simulateContract 即 eth_call 加估算 Gas
  R-->>F: 成功返回 request 或 revert 原因
  F->>W: 3 writeContract 发送 request
  W->>U: 弹窗展示交易详情
  U->>W: 确认签名
  W->>R: 广播已签名交易
  W-->>F: 返回 txHash
  F->>R: 4 waitForTransactionReceipt 轮询
  R-->>F: 回执 status 与 logs
  F->>F: 5 invalidate 相关查询 并提示结果
`, [
  ['flow', '模拟在弹钱包之前进行。模拟失败就不弹钱包，用户不会为必然失败的交易付 Gas。'],
  ['fail', '模拟成功不等于上链成功：模拟和打包之间状态可能变化（价格变动、他人抢先），仍可能 revert。'],
  ['key', 'txHash 返回只代表“已广播”，不代表成功。必须等回执并检查 status。'],
  ['risk', '钱包弹窗是用户最后一道防线。前端要保证传给钱包的地址和金额与界面显示一致。']
])}
${code('TYPESCRIPT', `
'use client'
import { useSimulateContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { erc20Abi, parseUnits, isAddress } from 'viem'
import { useEffect, useState } from 'react'

export function TransferForm({ token, decimals, balance }: { token: \`0x\${string}\`; decimals: number; balance: bigint }) {
  const { address, chainId } = useAccount()
  const [to, setTo] = useState('')
  const [amountStr, setAmountStr] = useState('')

  // 1. 参数校验：任何一项不通过，就不模拟、不允许提交
  let amount: bigint | undefined
  try { amount = amountStr ? parseUnits(amountStr, decimals) : undefined } catch { amount = undefined }
  const valid = !!address && isAddress(to) && !!amount && amount > 0n && amount <= balance

  // 2. 模拟：参数变化时自动重新模拟；data.request 可直接交给 writeContract
  const sim = useSimulateContract({
    address: token, abi: erc20Abi, functionName: 'transfer',
    args: valid ? [to as \`0x\${string}\`, amount!] : undefined,
    chainId,                                   // 链不匹配时报错，而不是发到错链
    query: { enabled: valid },
  })

  // 3. 发送
  const write = useWriteContract()
  // 4. 等待回执
  const receipt = useWaitForTransactionReceipt({ hash: write.data, confirmations: 1 })

  // 5. 成功后刷新所有读查询（也可以只 invalidate 余额的 queryKey）
  const qc = useQueryClient()
  useEffect(() => { if (receipt.isSuccess) qc.invalidateQueries() }, [receipt.isSuccess, qc])

  const busy = write.isPending || receipt.isLoading
  return (
    <form onSubmit={e => { e.preventDefault(); if (sim.data) write.writeContract(sim.data.request) }}>
      {/* 输入框省略 */}
      <button disabled={!sim.data || busy}>
        {write.isPending ? '请在钱包中确认…' : receipt.isLoading ? '交易确认中…' : '转账'}
      </button>
      {sim.error && <p role="alert">{explainError(sim.error)}</p>}
      {write.error && <p role="alert">{explainError(write.error)}</p>}
      {receipt.data?.status === 'reverted' && <p role="alert">交易已上链但执行失败，Gas 已扣除。</p>}
    </form>
  )
}
`)}

<h2>3. approve + 操作，与 Permit 一步流程</h2>
<p>合约不能直接从你的地址拿走 ERC-20 代币。你要先调用代币的 <code>approve(spender, amount)</code> 授权，目标合约再调用 <code>transferFrom</code>。这就是“两步流程”。</p>
${mm('授权与操作的状态机', `
stateDiagram-v2
  state "读取 allowance" as Check
  state "需要授权" as NeedApprove
  state "授权签名中" as ApproveSign
  state "授权确认中" as ApprovePending
  state "可执行操作" as Ready
  state "操作签名中" as ActionSign
  state "操作确认中" as ActionPending
  state "完成" as Done
  [*] --> Check
  Check --> Ready: allowance 足够
  Check --> NeedApprove: allowance 不足
  NeedApprove --> ApproveSign: 点击授权
  ApproveSign --> NeedApprove: 用户拒签
  ApproveSign --> ApprovePending: 返回 txHash
  ApprovePending --> Check: 回执成功后重读 allowance
  Ready --> ActionSign: 点击执行
  ActionSign --> Ready: 用户拒签
  ActionSign --> ActionPending: 返回 txHash
  ActionPending --> Done: 回执成功
  ActionPending --> Ready: revert 后可重试
  Done --> [*]
`, [
  ['flow', '授权确认后要重新读取 allowance，不要假设授权一定成功。'],
  ['key', '按钮文案随状态变化：“授权 USDC” → “授权确认中” → “兑换”。用户要清楚自己在第几步。'],
  ['risk', '默认无限授权（2<sup>256</sup>−1）省一次交易，但合约被攻破时用户全部余额都暴露。默认授权本次金额，把无限授权作为可选项。'],
  ['fail', 'USDT 等少数代币要求先把授权改为 0 才能改成新值，否则 approve 会 revert。']
])}
<p><strong>Permit（EIP-2612）</strong>让用户签一条链下消息代替 approve 交易。目标合约在同一笔交易里先调用 <code>permit(owner, spender, value, deadline, v, r, s)</code>，再 <code>transferFrom</code>。用户只发一笔交易。</p>
${code('TYPESCRIPT', `
import { useSignTypedData, useReadContract } from 'wagmi'
import { parseSignature } from 'viem'

// 读取 permit 所需的 nonce（每签一次 +1，防重放）
const { data: nonce } = useReadContract({ address: token, abi: permitAbi, functionName: 'nonces', args: [owner] })
const { signTypedDataAsync } = useSignTypedData()

async function permitAndDeposit(amount: bigint) {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)   // 20 分钟后过期，不要设很远
  const signature = await signTypedDataAsync({
    domain: { name: tokenName, version: '1', chainId, verifyingContract: token }, // version 以代币合约为准
    types: { Permit: [
      { name: 'owner', type: 'address' }, { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' } ] },
    primaryType: 'Permit',
    message: { owner, spender: vault, value: amount, nonce: nonce!, deadline },
  })
  const { v, r, s } = parseSignature(signature)
  // 目标合约提供 depositWithPermit 之类的函数（示例），一笔交易完成授权 + 存入
  await writeContractAsync({ address: vault, abi: vaultAbi, functionName: 'depositWithPermit', args: [amount, deadline, Number(v), r, s] })
}
`)}
${tbl(['方案', '交易数', '适用', '风险'], [
  ['approve 精确金额 + 操作', '2', '所有 ERC-20', '最安全，但每次都要授权'],
  ['approve 无限 + 操作', '首次 2，之后 1', '所有 ERC-20', '合约被攻破时全部余额暴露'],
  ['EIP-2612 Permit', '1', '实现了 permit 的代币（USDC、DAI 等）', '签名可被钓鱼网站滥用，见 <a href="#m07-6">M03.6</a>'],
  ['Permit2', '首次 approve Permit2，之后每次签名', '任意 ERC-20，Uniswap 等采用', '一次签名可授权多个代币，钓鱼危害大'],
  ['EIP-5792 批量调用', '用户确认 1 次', '支持的钱包（智能账户）', '依赖钱包支持，需降级方案']
])}
<h3>算一算：两步流程与 Permit 的 Gas 成本（示例）</h3>
${steps(['假设 approve 约 46,000 Gas，存入操作约 120,000 Gas，带 permit 的存入约 160,000 Gas。', '有效 Gas 价格 = baseFee 20 gwei + 小费 1 gwei = 21 gwei。', '两步：(46,000 + 120,000) × 21 gwei = 3,486,000 gwei = 0.003486 ETH。按 3,000 美元/ETH 约 10.46 美元。', 'Permit：160,000 × 21 gwei = 3,360,000 gwei = 0.00336 ETH，约 10.08 美元。', '结论：Gas 只省约 4%，但用户少等一次确认、少点一次按钮。体验收益大于费用收益。'])}

<h2>4. 错误解析：把异常翻译成人话</h2>
<p>viem 的错误都继承自 <code>BaseError</code>，并且层层包装。用 <code>error.walk()</code> 找到最内层的具体错误类型。</p>
${code('TYPESCRIPT', `
// src/lib/errors.ts
import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError,
         InsufficientFundsError, EstimateGasExecutionError } from 'viem'

const CUSTOM: Record<string, (args: readonly unknown[]) => string> = {
  ERC20InsufficientBalance: () => '代币余额不足',
  ERC20InsufficientAllowance: () => '授权额度不足，请先授权',
  TooLittleReceived: () => '价格变动超过滑点设置，请刷新报价或调高滑点',
}

export function explainError(err: unknown): string {
  if (!(err instanceof BaseError)) return '未知错误，请重试'
  if (err.walk(e => e instanceof UserRejectedRequestError)) return ''      // 4001：不提示
  if (err.walk(e => e instanceof InsufficientFundsError)) return 'ETH 不足以支付 Gas 费'
  const rev = err.walk(e => e instanceof ContractFunctionRevertedError)
  if (rev instanceof ContractFunctionRevertedError) {
    const name = rev.data?.errorName                    // 自定义错误名（需要 ABI 里有 error 定义）
    if (name && CUSTOM[name]) return CUSTOM[name](rev.data?.args ?? [])
    if (rev.reason) return '合约拒绝：' + rev.reason      // require(cond, 'reason') 的字符串
    return '合约执行失败'
  }
  if (err.walk(e => e instanceof EstimateGasExecutionError)) return 'Gas 估算失败：这笔交易很可能会失败'
  return err.shortMessage                               // viem 提供的一行摘要
}
`)}
${tbl(['错误', '常见原因', '用户文案（示例）', '前端动作'], [
  ['UserRejectedRequestError（4001）', '用户在钱包点了拒绝', '不显示，或灰字“已取消”', '恢复按钮'],
  ['ContractFunctionRevertedError + errorName', '自定义错误，例如余额不足、滑点超限', '按错误名翻译', '引导修改参数'],
  ['ContractFunctionRevertedError + reason', 'require 字符串', '“合约拒绝：…”', '展示原因'],
  ['InsufficientFundsError', '原生币不够付 金额 + Gas', '“ETH 不足以支付 Gas 费”', '显示所需金额与跨链入口'],
  ['EstimateGasExecutionError', '估算阶段执行失败', '“这笔交易很可能会失败”', '禁止提交，展示原因'],
  ['HttpRequestError / 超时', 'RPC 故障', '“网络繁忙，请稍后重试”', '自动切换 fallback RPC'],
  ['ChainMismatchError', '钱包链与目标链不一致', '“请切换到 Base”', '提供切链按钮']
])}
${call('info', `<p>自定义错误（<code>error InsufficientBalance(uint256 need)</code>）在 revert 数据里只有 4 字节选择器 + 参数。前端 ABI 里没有这个 error 定义，就只能看到一串十六进制。把合约的 error 定义一起放进 ABI，或用 <code>decodeErrorResult({ abi, data })</code> 手动解码。</p>`)}

<h2>5. 乐观更新、回滚与批量调用</h2>
<p><strong>乐观更新（Optimistic Update）</strong>：交易发出后，先假设它会成功，立刻更新界面；如果最终失败，再回滚。它让界面感觉更快，但要谨慎使用。</p>
${code('TYPESCRIPT', `
// 用 TanStack Query 做乐观更新：先改缓存，失败再恢复
async function optimisticTransfer(amount: bigint, balanceKey: readonly unknown[]) {
  await qc.cancelQueries({ queryKey: balanceKey })               // 防止旧请求覆盖乐观值
  const prev = qc.getQueryData<bigint>(balanceKey)
  qc.setQueryData<bigint>(balanceKey, old => (old ?? 0n) - amount)   // 立刻扣减显示
  try {
    const hash = await writeContractAsync(sim.data!.request)
    const rc = await waitForTransactionReceipt(config, { hash })
    if (rc.status !== 'success') throw new Error('reverted')
  } catch (e) {
    qc.setQueryData(balanceKey, prev)                             // 回滚到原值
    throw e
  } finally {
    qc.invalidateQueries({ queryKey: balanceKey })                // 最终以链上为准
  }
}
`)}
${tbl(['适合乐观更新', '不适合乐观更新'], [
  ['点赞、关注等链上社交操作', '大额转账、提现'],
  ['已模拟成功的小额转账余额', '依赖价格的兑换结果（实际成交数量未知）'],
  ['待办列表里加一条“待确认”记录', '跨链操作（目标链结果要等很久）']
])}
<p><strong>EIP-5792 批量调用</strong>：钱包新增 <code>wallet_sendCalls</code> 方法，DApp 一次提交多个调用（例如 approve + swap），用户只确认一次。智能合约钱包可以原子执行。配套方法有 <code>wallet_getCapabilities</code>（查询钱包支持什么）和 <code>wallet_getCallsStatus</code>（查询结果）。viem 提供 <code>walletClient.sendCalls</code>，wagmi 2.x 提供 <code>useSendCalls</code>、<code>useCallsStatus</code>、<code>useCapabilities</code>（早期版本在 <code>wagmi/experimental</code> 导出）。</p>
${code('TYPESCRIPT', `
import { useSendCalls, useCapabilities } from 'wagmi'
import { encodeFunctionData, erc20Abi } from 'viem'

const { data: caps } = useCapabilities()            // 不支持的钱包会报错，此时降级为两步流程
const { sendCalls } = useSendCalls()

sendCalls({
  calls: [
    { to: USDC, data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [ROUTER, amount] }) },
    { to: ROUTER, data: encodeFunctionData({ abi: routerAbi, functionName: 'swap', args: [/* … */] }) },
  ],
})
`)}
${tryit(`<p>在测试网完成一次完整写流程：</p>${steps(['在 MetaMask 切到 Sepolia，从水龙头领取测试 ETH。', '打开 Remix（remix.ethereum.org），部署一个 OpenZeppelin ERC20 合约，给自己铸造 1,000 个代币。', '用 M03.1 的项目，把第 2 节的 TransferForm 接上这个代币地址。', '输入超过余额的金额：预期按钮禁用。输入正常金额点击转账，在钱包里点拒绝：预期按钮恢复、无红色报错。', '再次提交并确认：预期出现“交易确认中”，约 12 秒后余额自动刷新。'])}`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['所有写操作先 simulate', '避免用户为必然失败的交易付 Gas', '代码审查：writeContract 只接收 simulate 的 request'],
  ['提交按钮在签名和确认期间禁用', '防止重复提交', 'E2E 连点两次只产生一笔交易'],
  ['授权默认精确金额', '降低合约被攻破时的损失', 'UI 测试：默认值等于本次金额'],
  ['ABI 包含全部自定义 error', '让 revert 原因可读', '单元测试：每个 error 都有中文文案'],
  ['回执 status 必须检查', '已打包不等于成功', '用 anvil 构造 revert 交易，UI 显示失败'],
  ['埋点：签名拒绝率、revert 率', '发现体验问题和合约问题', '仪表盘按错误类型分组（见 <a href="#m07-9">M03.9</a>）']
])}

${mistakes([
  ['拿到 txHash 就可以显示成功。', 'txHash 只代表已广播。必须等回执且 status 为 success。'],
  ['模拟成功，上链就一定成功。', '模拟到打包之间状态会变（价格、余额、他人交易），仍可能 revert。'],
  ['用户拒签是错误，要上报 Sentry。', '4001 是正常行为，应单独计数，不当作错误告警。'],
  ['无限授权是行业标准，没有风险。', '无限授权让合约漏洞的损失扩大到全部余额。默认精确授权更安全。'],
  ['Permit 适用于所有 ERC-20。', '只有实现了 EIP-2612 的代币支持。其他代币要用 approve 或 Permit2。']
])}
${recap([
  '写流程五步：参数校验、simulateContract、writeContract、waitForTransactionReceipt、invalidate 刷新。',
  'wagmi 对应 useSimulateContract、useWriteContract、useWaitForTransactionReceipt。',
  'ERC-20 需要 approve + 操作；Permit 用签名省掉 approve 交易；默认精确授权。',
  '用 BaseError.walk 找到具体错误类型；4001 不报错；自定义错误要在 ABI 里定义才能解码。',
  '乐观更新要能回滚，最终以链上为准；EIP-5792 wallet_sendCalls 让多个调用只确认一次。'
])}
${quiz([
  { q: '为什么要在 writeContract 之前调用 simulateContract？', o: ['让交易更便宜', '提前发现 revert，避免弹钱包和浪费 Gas，并得到可直接发送的 request', 'simulate 会自动签名', '钱包要求必须先 simulate'], a: 1, why: '模拟用 eth_call 预演交易，失败就不弹钱包。它不改变 Gas 价格，也不签名，钱包没有这个要求。' },
  { q: '回执的 status 是 reverted，下列说法正确的是？', o: ['交易没有上链', '交易上链了，状态改动全部撤销，Gas 已扣除', '交易会自动重试', '用户的代币已经转出'], a: 1, why: 'revert 的交易被打包进区块，执行失败，状态回滚，但消耗的 Gas 不退。' },
  { q: '用户在钱包弹窗里点了“拒绝”，前端最佳处理是？', o: ['弹出红色错误框并上报 Sentry', '自动重新发起请求', '恢复按钮为可点击，不显示错误或只显示灰色“已取消”', '断开钱包连接'], a: 2, why: '拒签（4001）是用户的选择。自动重试会骚扰用户，断开连接不合理，也不应当作错误告警。' },
  { q: 'revert 数据只显示一串 0x 开头的十六进制，最可能的原因是？', o: ['RPC 节点故障', '前端 ABI 里没有该合约的自定义 error 定义', '交易被替换', '用户余额不足'], a: 1, why: '自定义错误编码为选择器 + 参数，ABI 中有对应 error 定义才能解码为名称。' }
])}
${exercises([["（示例）approve 约 50,000 Gas，存入约 150,000 Gas，带 permit 的存入约 190,000 Gas，有效 Gas 价格 10 gwei。两种方案各花多少 ETH？按 3,000 美元/ETH，Permit 省了多少？", "<p>两步：(50,000 + 150,000) × 10 gwei = 2,000,000 gwei = 0.002 ETH，约 6 美元。Permit：190,000 × 10 gwei = 1,900,000 gwei = 0.0019 ETH，约 5.7 美元。只省 0.0001 ETH（约 5%）。主要收益是用户少等一次确认、少点一次按钮。</p>"], ["设计一个 <code>useApproveThenAct</code> Hook：它应该返回哪些状态和方法？授权完成后要做什么？", "<p>可以返回当前步骤（读取 allowance、需要授权、授权签名中、授权确认中、可执行、操作签名中、操作确认中、完成），以及 <code>approve()</code> 和 <code>execute()</code> 两个方法。授权回执成功后要重新读取 allowance，不要假设授权一定成功。默认授权本次精确金额。对 USDT 这类代币，要先把授权改为 0 再改成新值。</p>"], ["为什么转账余额可以做乐观更新，而兑换结果不适合？写出乐观更新必须包含的三个动作。", "<p>已模拟成功的小额转账，扣减数量是确定的。兑换的实际成交数量依赖价格，交易发出时还不知道。乐观更新要做三件事：先 <code>cancelQueries</code> 防止旧请求覆盖，再 <code>setQueryData</code> 改缓存，失败时恢复原值。最后在 finally 里 invalidate，以链上为准。</p>"]])}
${checklist(["能按参数校验、模拟、发送、等待回执、刷新五步实现一次合约写入。", "能用 useSimulateContract、useWriteContract、useWaitForTransactionReceipt 串起写流程，并检查回执 status。", "能实现 approve 加操作的两步流程，并说出无限授权和 Permit 各自的风险。", "能用 BaseError.walk 把拒签、revert、自定义错误、余额不足翻译成用户文案。", "能用 TanStack Query 写出可回滚的乐观更新。"])}
${terms([
  ['模拟', 'Simulation', '用 eth_call 预演交易以检测是否会失败'],
  ['回执', 'Transaction Receipt', '交易打包后的结果，含 status、gasUsed、logs'],
  ['授权', 'Allowance / approve', '允许某地址代你转走某代币的最大数量'],
  ['Permit', 'EIP-2612 Permit', '用链下签名代替 approve 交易的授权方式'],
  ['自定义错误', 'Custom Error', 'Solidity 中用 error 声明、带参数的 revert 原因'],
  ['乐观更新', 'Optimistic Update', '先假设成功更新界面，失败后回滚'],
  ['EIP-5792', 'Wallet Call API', '钱包批量调用标准，核心方法 wallet_sendCalls']
])}
` });

CUR = 'm07-6';
addCh({ id: 'm07-6', nav: '签名与登录', title: 'M03.6 签名与登录：SIWE、EIP-712、Permit 风险与后端验签', desc: '实现“用以太坊登录”，读懂 EIP-712 签名请求，识别钓鱼签名。', html: `
<h1>M03.6 签名与登录：SIWE、EIP-712、Permit 风险与后端验签</h1>
${meta(['实现完整的 SIWE 登录：nonce、消息、签名、后端验证、会话。', '读懂 EIP-712 的 domain、types、primaryType、message，并说出 Permit/Permit2 签名能让别人做什么。', '在后端用 viem 验证 EOA 和合约钱包（ERC-1271）的签名，并识别钓鱼签名。'], '<a href="#m00-3">M00.3 公钥私钥与数字签名</a>、<a href="#m07-5">M03.5 写合约</a>', ['eip712'])}
${beginner(`<p><strong>数字签名（Digital Signature）</strong>：用私钥对一段数据生成的证明。任何人用地址就能验证“这段数据确实是这个地址的主人签的”。</p>
<p><strong>nonce（一次性随机数）</strong>：只用一次的随机字符串，防止别人拿旧签名重复使用（重放攻击）。</p>
<p><strong>会话（Session）</strong>：登录成功后服务器发给浏览器的凭证（通常放在 Cookie 里），之后的请求靠它识别你。</p>
<p><strong>EOA（外部账户）</strong>：由私钥控制的普通钱包地址。<strong>合约钱包</strong>：由合约代码控制的地址，例如 Safe 多签。</p>
<p><strong>钓鱼（Phishing）</strong>：伪装成正规网站，诱导你签名或转账的骗局。</p>`)}

<h2>1. 一句话理解</h2>
${one('签名不上链、不花 Gas，但它是一张“你亲笔签字的纸条”。登录签名只证明“我是这个地址”；授权签名（Permit）可以让别人转走你的钱。')}
${call('analogy', `<p>SIWE 登录像在前台签到簿上签名：前台给你一张写着今天日期和流水号的签到单（nonce），你签字，前台对照你的签名样本确认是你，然后发你一张访客卡（会话 Cookie）。</p>
<p>Permit 签名像签一张空白授权委托书：上面写着“允许某某从我账户取走不超过 X 元，有效期到某天”。签名本身不动钱，但持有委托书的人随时可以去取。</p>`)}
${art('一图看懂：同一个签名动作，内容决定它是登录还是授权', 660, 312, [
  S.box(10, 40, 290, 136, { k: 'ok', icon: 'check', t: 'SIWE 登录消息', s: 'domain：你访问的网站\naddress：你的地址\nnonce：后端发的一次性随机数\n有效期：几分钟', left: 1 }),
  S.box(360, 40, 290, 136, { k: 'risk', icon: 'warn', t: 'Permit 授权签名', s: 'owner：你的地址\nspender：被授权的对方\nvalue：额度（可以是“无限”）\ndeadline：有效期', left: 1 }),
  S.icon('key', 330, 96, 30, 'warn'),
  S.text(330, 132, '同一把私钥', { size: 11.5, dim: 1, anchor: 'middle', mw: 56 }),
  S.arrow(155, 178, 155, 208),
  S.arrow(505, 178, 505, 208),
  S.box(10, 210, 290, 52, { k: 'ok', t: '只证明：我控制这个地址', s: '不上链 · 不花 Gas · 不动钱' }),
  S.box(360, 210, 290, 52, { k: 'risk', t: '等于一张授权委托书', s: '对方可转走 value 以内的币' }),
  S.text(330, 296, '签之前先看清：这是“登录”，还是“授权”', { size: 13.5, anchor: 'middle', mw: 620 })
], [ ['flow', '登录：后端给 nonce，你签名，后端验签后发会话 Cookie。授权：你签一份写明额度和期限的委托。'], ['key', '签名本身不动钱，也不花 Gas；危险在于签的内容是什么。'], ['risk', 'Permit 一旦被钓鱼站拿到，对方不需要再问你，就能在有效期内转走额度内的代币。'], ['limit', 'SIWE 只证明“你控制这个地址”，不代表任何权限。'] ], '左边是 SIWE 登录消息，只证明你控制地址；右边是 Permit 授权签名，等于授权委托书，对方可转走额度内的币，两者都由同一把私钥签名', 'm07-6')}

<h2>2. personal_sign 与 SIWE 登录</h2>
<p><code>personal_sign</code> 对一段文本签名。钱包会在文本前加前缀 <code>\\x19Ethereum Signed Message:\\n</code> + 文本长度，再做 keccak256 后签名（EIP-191）。前缀保证这段签名不可能被当作一笔交易使用。</p>
<p><strong>SIWE（Sign-In with Ethereum，EIP-4361）</strong>规定了登录消息的格式，让钱包能识别它是登录请求并展示域名。</p>
${code('BASH', `
app.example.com wants you to sign in with your Ethereum account:
0x9f3aB8C1d2E4F5a6B7c8D9e0F1a2B3c4D5e6c21d

登录 Example DApp。此签名不会发起交易，也不会花费 Gas。

URI: https://app.example.com
Version: 1
Chain ID: 8453
Nonce: 8f3k2LqZ9wPx1aB7
Issued At: 2026-10-23T08:00:00.000Z
Expiration Time: 2026-10-23T08:10:00.000Z
`)}
${tbl(['字段', '作用', '后端要校验什么'], [
  ['domain（第一行）', '请求登录的域名', '必须等于本站域名，防止钓鱼站转用签名'],
  ['address', '登录地址（EIP-55 校验和格式）', '与签名恢复出的地址一致'],
  ['statement', '给人看的说明', '可选'],
  ['URI / Version / Chain ID', '资源地址、版本（固定 1）、链', 'Chain ID 用于合约钱包验签'],
  ['Nonce', '服务器生成的一次性随机数', '存在、未使用、未过期，用后立即作废'],
  ['Issued At / Expiration Time', '签发时间与过期时间', '当前时间在有效期内']
])}
${mm('SIWE 完整登录流程', `
sequenceDiagram
  participant U as 用户
  participant F as 前端
  participant B as 后端
  participant W as 钱包
  F->>B: GET /api/auth/nonce
  B->>B: 生成随机 nonce 存入数据库 10 分钟过期
  B-->>F: 返回 nonce
  F->>F: createSiweMessage 拼出登录消息
  F->>W: personal_sign 请求签名
  W->>U: 展示域名与消息
  U->>W: 确认
  W-->>F: 返回 signature
  F->>B: POST /api/auth/verify 带 message 与 signature
  B->>B: 校验域名 nonce 有效期 并验签
  B->>B: 作废 nonce 创建会话
  B-->>F: Set-Cookie httpOnly Secure SameSite
  F->>B: 之后的请求自动携带 Cookie
`, [
  ['flow', 'nonce 由后端生成并保存，前端只是转交。后端验签成功后立刻作废 nonce。'],
  ['fail', '前端自己生成 nonce，后端无法判断是否重放；后端不校验域名，钓鱼站拿到的签名可以登录本站。'],
  ['key', '会话 Cookie 用 httpOnly（JS 读不到）+ Secure + SameSite=Lax，防止 XSS 偷会话和 CSRF。'],
  ['limit', 'SIWE 只证明“控制这个地址”，不代表任何权限。权限判断（是否管理员、是否持有 NFT）要另外查；登录之后的 ENS、SBT、可验证凭证等链上身份见 <a href="#m09-1">M11.1 链上身份</a>。'],
  ['risk', '用户切换钱包账户后，前端要检测 accountsChanged 并登出，否则界面地址和会话地址不一致。']
])}
${code('TYPESCRIPT', `
// 前端：src/features/auth/useSiweLogin.ts
import { createSiweMessage } from 'viem/siwe'
import { useAccount, useSignMessage } from 'wagmi'

export function useSiweLogin() {
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()
  return async () => {
    const { nonce } = await fetch('/api/auth/nonce').then(r => r.json())
    const message = createSiweMessage({
      domain: window.location.host, address: address!, chainId: chainId!,
      uri: window.location.origin, version: '1', nonce,
      statement: '登录 Example DApp。此签名不会发起交易，也不会花费 Gas。',
      expirationTime: new Date(Date.now() + 10 * 60_000),
    })
    const signature = await signMessageAsync({ message })
    const res = await fetch('/api/auth/verify', { method: 'POST', body: JSON.stringify({ message, signature }) })
    if (!res.ok) throw new Error('登录失败')
  }
}

// 后端：src/app/api/auth/verify/route.ts（Next.js Route Handler）
import { parseSiweMessage } from 'viem/siwe'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) })

export async function POST(req: Request) {
  const { message, signature } = await req.json()
  const fields = parseSiweMessage(message)
  const ok = await client.verifySiweMessage({
    message, signature,
    domain: 'app.example.com',                  // 校验域名
    nonce: fields.nonce,                         // 同时校验有效期（默认用当前时间）
  })                                             // 内部支持 EOA 与 ERC-1271/6492 合约钱包
  if (!ok || !(await consumeNonce(fields.nonce!))) return new Response('invalid', { status: 401 })
  const sid = await createSession(fields.address!)        // 写 sessions 表
  return new Response('ok', { headers: { 'Set-Cookie': \`sid=\${sid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400\` } })
}
`)}
${code('SQL', `
-- nonce 与会话表（PostgreSQL 示例）
CREATE TABLE siwe_nonces (
  nonce       TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ                 -- 非空表示已使用
);
-- 原子作废：只有未使用且未过期的 nonce 才能更新成功（防并发重放）
-- UPDATE siwe_nonces SET used_at = now() WHERE nonce = $1 AND used_at IS NULL AND expires_at > now();

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,           -- 随机 128 位以上
  address     CHAR(42) NOT NULL,          -- 校验和格式地址
  chain_id    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);
CREATE INDEX idx_sessions_address ON sessions(address);
`)}

<h3>2.1 EIP-191：签名前缀的三个版本</h3>
<p>EIP-191 规定：所有“签名消息”都要以固定前缀字节 <code>0x19</code> 开头。以 <code>0x19</code> 开头的数据，永远不会是合法的 RLP 编码交易，所以一个消息签名不可能被当成交易广播。第二个字节是“版本”：</p>
${tbl(['版本字节', '格式', '用途'], [
  ['<code>0x00</code>', '<code>0x19 0x00 ‖ 验证者地址 ‖ 数据</code>', '指定“由哪个合约来验证”的数据，较少使用'],
  ['<code>0x01</code>', '<code>0x19 0x01 ‖ domainSeparator ‖ hashStruct</code>', 'EIP-712 结构化数据签名（见下一节）'],
  ['<code>0x45</code>（字母 E）', '<code>0x19 “Ethereum Signed Message:\\n” ‖ 长度 ‖ 消息</code>', '<code>personal_sign</code>：给任意文本签名']
])}
<p>合约验证 <code>personal_sign</code> 签名时，要自己加上同样的前缀再恢复地址。OpenZeppelin v5 已封装好：</p>
${code('SOLIDITY', `
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

function verify(address user, uint256 amount, uint256 nonce, bytes calldata sig) public view returns (bool) {
    // 先对业务数据取哈希：把 链 ID、本合约地址、nonce 都放进去，防跨链和重放
    bytes32 h = keccak256(abi.encode(block.chainid, address(this), user, amount, nonce));
    // 再加上 EIP-191 的前缀（对 32 字节哈希签名时，前缀里的长度是 32）
    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(h);
    return ECDSA.recover(digest, sig) == user;       // recover 会拒绝可塑签名和零地址
}
`)}
${call('warn', '<p>签名里没有 nonce、链 ID 或合约地址，同一个签名可以被反复提交，或在另一条链、另一个合约上重放。<code>personal_sign</code> 的前缀只保证“它不是交易”，<strong>不提供任何重放保护</strong>。</p>')}
${exq([
  ['为什么钱包要给 <code>personal_sign</code> 的消息加前缀？', '<p>防止诱导用户“签一段文字”，实际那段数据恰好是一笔合法交易。以 <code>0x19</code> 开头的数据不可能是有效交易，所以加了前缀的签名无法被当成交易广播。</p>'],
  ['EIP-712 的签名为什么以 <code>0x19 0x01</code> 开头？', '<p>它属于 EIP-191 的版本 <code>0x01</code>：<code>0x19 0x01 ‖ domainSeparator ‖ hashStruct</code>。<code>0x19</code> 保证不会被当成交易，<code>domainSeparator</code> 绑定了链和合约，防止跨域重放。</p>']
])}

<h2>3. EIP-712：结构化数据签名</h2>
${recall('<p>合约侧怎样验证 EIP-712 签名、怎样用 nonce、chainId、verifyingContract、deadline 防五类重放，见 <a href="#m02-8">M02.9 合约安全 II</a> 第 4 节。本节只讲前端怎样构造和发起签名，以及钱包展示给用户的是什么。</p>')}
<p>personal_sign 签的是一段文本，合约很难解析。<strong>EIP-712</strong> 让钱包签一份“带类型的结构体”，钱包能逐字段展示，合约能按同样规则重新计算哈希并验证。</p>
${tbl(['部分', '作用', '例子'], [
  ['domain', '签名的“适用范围”，防止跨合约、跨链重放', 'name、version、chainId、verifyingContract'],
  ['types', '结构体字段定义', '<code>Permit: [owner, spender, value, nonce, deadline]</code>'],
  ['primaryType', '要签的顶层结构体名', '<code>Permit</code>'],
  ['message', '具体字段值', 'spender = 0xRouter…，value = 1000000']
])}
${mm('EIP-712 哈希如何计算', `
flowchart TB
  DOM["domain<br/>name · version · chainId · verifyingContract"] --> DS["domainSeparator<br/>= hashStruct(domain)"]
  TY["types + primaryType"] --> TH["typeHash<br/>= keccak256(类型字符串)"]
  MSG["message 字段值"] --> HS["hashStruct(message)<br/>= keccak256(typeHash ‖ 各字段编码)"]
  TH --> HS
  DS --> FIN["digest = keccak256(0x19 0x01 ‖ domainSeparator ‖ hashStruct)"]
  HS --> FIN
  FIN --> SIG["私钥签名 → 65 字节 r s v"]
  SIG --> VER["合约 ecrecover(digest, v, r, s)<br/>得到 owner 地址"]
`, [
  ['flow', '钱包和合约用同样的规则独立算出 digest。只要任何字段不同，验签就失败。'],
  ['key', 'domain 里的 chainId 和 verifyingContract 把签名锁定在某条链的某个合约上。'],
  ['risk', '钱包会展示 message 字段，但大多数用户看不懂 spender 是谁、value 有多大。这就是钓鱼签名得手的原因。'],
  ['limit', '签名本身没有“撤销”按钮。撤销要靠 deadline 过期，或在链上消耗 nonce（再发一笔交易）。']
])}
${code('TYPESCRIPT', `
import { useSignTypedData } from 'wagmi'
const { signTypedDataAsync } = useSignTypedData()

// 一个链下订单示例（自定义类型）
const signature = await signTypedDataAsync({
  domain: { name: 'MyExchange', version: '1', chainId: 8453, verifyingContract: '0x1111111111111111111111111111111111111111' },
  types: {
    Order: [
      { name: 'maker', type: 'address' }, { name: 'sellToken', type: 'address' },
      { name: 'sellAmount', type: 'uint256' }, { name: 'buyToken', type: 'address' },
      { name: 'buyAmount', type: 'uint256' }, { name: 'expiry', type: 'uint64' },
    ],
  },                                   // 不需要写 EIP712Domain，viem 会根据 domain 自动推导
  primaryType: 'Order',
  message: { maker, sellToken: USDC, sellAmount: 1_000_000_000n, buyToken: WETH, buyAmount: 300_000_000_000_000_000n, expiry: 1798000000n },
})
`)}

<h2>4. Permit / Permit2 签名的内容与风险</h2>
${tbl(['签名类型', '关键字段', '签名后对方能做什么'], [
  ['EIP-2612 Permit', 'owner、spender、value、nonce、deadline', 'spender 在 deadline 前提交签名，获得 value 额度，再 transferFrom 转走'],
  ['Permit2 PermitSingle / PermitBatch', 'details[{token, amount, expiration, nonce}]、spender、sigDeadline', '对一个或多个代币授权，到 expiration 前都有效'],
  ['Permit2 SignatureTransfer', 'permitted{token, amount}、spender、nonce、deadline', '一次性转账，用完即失效'],
  ['Seaport 类 NFT 挂单', 'offer（你给出的 NFT）、consideration（你要收到的对价）', '任何人支付 consideration 即可拿走 NFT；对价为 0 等于白送']
])}
<p>Seaport 订单的签名与成交流程见 <a href="#m09-7">M11.6 NFT 市场、版税与 Memecoin 发行</a>。</p>
<p>体验下面的实验：依次切换 4 个预置请求，对照左侧原始 JSON 和右侧“人话翻译”，找出每个请求的红旗。再把“当前网络”切到 Base，看 chainId 不匹配的提示。</p>
${lab('eip712')}
<h3>算一算：无限额度到底有多大（示例）</h3>
${steps(['uint256 最大值 = 2<sup>256</sup> − 1 ≈ 1.158 × 10<sup>77</sup>。', '按 USDC 6 位小数换算：1.158 × 10<sup>77</sup> ÷ 10<sup>6</sup> ≈ 1.158 × 10<sup>71</sup> 个 USDC。', 'USDC 流通量约为 10<sup>10</sup>–10<sup>11</sup> 量级（截至 2026 年为数百亿美元）。' + cite('Circle：USDC 透明度页面', 'https://www.circle.com/transparency') + '无限额度比全世界的 USDC 还多约 60 个数量级。', '结论：value = 2<sup>256</sup> − 1 的意思就是“我的这种代币，你全部可以拿走，现在和将来”。'])}
${call('warn', `<p><strong>钓鱼签名识别清单：</strong>① 网站域名与官方不一致；② 签名类型是 Permit/Permit2/Order，而你只是想“登录”或“领空投”；③ spender 是未验证的陌生地址；④ value 是巨大数字或 deadline/expiration 在多年以后；⑤ NFT 挂单的 consideration 为 0 或接收人不是你；⑥ domain 的 chainId 与当前网络不一致；⑦ 网站催促“限时、马上签”。任何一条命中，都先拒绝，再核对。</p>`)}

<h2>5. 后端验签：EOA 与合约钱包</h2>
<p>EOA 的签名可以用 ecrecover 从签名恢复出地址。<strong>合约钱包（Safe、智能账户）</strong>没有私钥，验签要调用它的 <code>isValidSignature(bytes32 hash, bytes signature)</code>，返回魔术值 <code>0x1626ba7e</code> 表示有效，这就是 <strong>ERC-1271</strong>。还没部署的智能账户用 <strong>ERC-6492</strong> 包装签名。</p>
${code('TYPESCRIPT', `
import { verifyMessage, verifyTypedData, createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// 1. 独立函数：只做 ECDSA 恢复，只适用于 EOA，不需要网络
const okEoa = await verifyMessage({ address, message, signature })

// 2. Public Client Action：先尝试 EOA，必要时调用合约 isValidSignature（ERC-1271），并支持 ERC-6492
const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) })
const okAny = await client.verifyMessage({ address, message, signature })
const okTyped = await client.verifyTypedData({ address, domain, types, primaryType: 'Order', message: order, signature })
// 后端统一用 client.verifyMessage / verifyTypedData，否则 Safe 用户永远登录失败
`)}
${tbl(['验证方式', '支持 EOA', '支持合约钱包', '需要 RPC'], [
  ['viem 独立函数 verifyMessage / verifyTypedData', '是', '否', '否'],
  ['publicClient.verifyMessage / verifyTypedData', '是', '是（ERC-1271、ERC-6492）', '是'],
  ['publicClient.verifySiweMessage', '是', '是', '是，并额外校验 SIWE 字段']
])}
${tryit(`<p>亲手签一条 SIWE 消息并验证：</p>${steps(['在任意网页的控制台，用 M03.2 的方法拿到地址 <code>addr</code>。', '执行 <code>await ethereum.request({ method: "personal_sign", params: ["0x" + [...new TextEncoder().encode("hello")].map(b => b.toString(16).padStart(2, "0")).join(""), addr] })</code>。', '观察钱包弹窗：它显示的是明文 hello，并提示这是签名请求，没有 Gas 费。', '把返回的 signature 复制到本地 Node 脚本，用 viem 的 <code>verifyMessage({ address: addr, message: "hello", signature })</code> 验证。预期输出 true；把 message 改成 hello2，预期 false。'])}`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['nonce 由后端生成、一次性、10 分钟过期', '防重放', '同一签名提交两次，第二次返回 401'],
  ['校验 SIWE 的 domain 与有效期', '防止钓鱼站转用签名', '伪造 domain 的消息被拒绝'],
  ['后端用 publicClient 验签', '支持 Safe 等合约钱包', '用 Safe 账户完成一次登录'],
  ['会话 Cookie：httpOnly、Secure、SameSite', '防 XSS 窃取与 CSRF', '浏览器 document.cookie 读不到 sid'],
  ['accountsChanged 时登出', '界面地址与会话一致', 'E2E 切换账户后需重新登录'],
  ['Permit 的 deadline 设为分钟级', '缩短签名被滥用的窗口', '代码审查：deadline ≤ 30 分钟']
])}

${mistakes([
  ['签名不花 Gas，所以签名没有风险。', 'Permit、Permit2、NFT 挂单签名可以被他人提交上链，转走你的资产。'],
  ['SIWE 登录成功就说明用户是管理员。', 'SIWE 只证明控制这个地址。权限要另外根据地址查询。'],
  ['用 ecrecover 验签能覆盖所有用户。', '合约钱包没有私钥，要用 ERC-1271 isValidSignature。用 publicClient.verifyMessage。'],
  ['nonce 可以由前端随机生成。', '后端无法确认它是否用过，签名可以被重放。nonce 必须由后端发放并作废。'],
  ['签过的 Permit 可以在钱包里撤销。', '签名无法撤销。只能等 deadline 过期，或发链上交易消耗 nonce / 将授权改为 0。']
])}
${recap([
  'personal_sign 加 EIP-191 前缀，SIWE（EIP-4361）规定登录消息格式：domain、address、nonce、有效期等。',
  'SIWE 流程：后端发 nonce → 前端拼消息 → 钱包签名 → 后端验签并作废 nonce → httpOnly 会话 Cookie。',
  'EIP-712 = domain + types + primaryType + message；digest = keccak256(0x1901 ‖ domainSeparator ‖ hashStruct)。',
  'Permit/Permit2/挂单签名能让他人转走资产；红旗：无限额度、未知 spender、超长期限、对价为 0、chainId 不匹配。',
  '后端用 publicClient.verifyMessage / verifyTypedData / verifySiweMessage，支持 ERC-1271 合约钱包。'
])}
${quiz([
  { q: 'SIWE 后端校验中，哪一项能防止“钓鱼网站拿到用户签名后登录正规网站”？', o: ['校验 Chain ID', '校验消息中的 domain 等于本站域名', '校验签名长度为 65 字节', '校验 statement 文案'], a: 1, why: '钓鱼站生成的消息 domain 是钓鱼站域名。后端要求 domain 等于本站，这类签名就无法使用。其他项不能阻止跨站转用。' },
  { q: '一条 EIP-712 签名请求：primaryType 是 Permit，spender 为未知地址，value = 2<sup>256</sup>−1，deadline 在 2286 年。正确做法是？', o: ['签，反正不花 Gas', '拒绝', '签完马上去撤销', '先签再看情况'], a: 1, why: '这是典型的钓鱼授权：未知 spender + 无限额度 + 超长期限。签名无法撤销，签后对方可随时转走该代币。' },
  { q: '用户使用 Safe 多签钱包登录，后端用 viem 独立函数 verifyMessage 验签总是失败。原因是？', o: ['Safe 不支持签名', '独立函数只做 ECDSA 恢复，合约钱包需要通过 RPC 调用 ERC-1271 isValidSignature', 'nonce 过期', 'Safe 的地址不是校验和格式'], a: 1, why: '合约钱包没有私钥，签名有效性由合约的 isValidSignature 判断。应使用 publicClient.verifyMessage。' },
  { q: 'EIP-712 domain 中的 verifyingContract 字段主要作用是？', o: ['指定 Gas 支付方', '把签名限定在某个合约上，防止被其他合约重放', '指定签名者地址', '让钱包显示合约图标'], a: 1, why: 'domain 把签名绑定到特定链和合约。换一个合约，domainSeparator 不同，签名就无效。' }
])}
${checklist(["能实现 SIWE 登录全流程：后端发 nonce、前端拼消息、钱包签名、后端验签并作废 nonce、下发会话 Cookie。", "能读懂 EIP-712 请求的 domain、types、primaryType、message，并说出 Permit 签名后对方能做什么。", "能用钓鱼签名清单识别无限额度、陌生 spender、超长期限、对价为 0、chainId 不匹配等红旗。", "能在后端用 publicClient.verifyMessage、verifyTypedData 或 verifySiweMessage 验证 EOA 和 ERC-1271 合约钱包的签名。", "能为会话 Cookie 设置 httpOnly、Secure、SameSite，并在 accountsChanged 时登出。"])}
${terms([
  ['SIWE', 'Sign-In with Ethereum (EIP-4361)', '用以太坊地址签名登录的消息格式标准'],
  ['EIP-191', 'Signed Data Standard', '签名数据加前缀的规范，personal_sign 使用其 0x45 版本'],
  ['EIP-712', 'Typed Structured Data Hashing and Signing', '对带类型的结构化数据签名的标准'],
  ['domainSeparator', 'Domain Separator', '由 domain 字段计算的哈希，隔离不同链和合约的签名'],
  ['Permit2', 'Permit2', 'Uniswap 推出的通用签名授权合约，适用于任意 ERC-20'],
  ['ERC-1271', 'Standard Signature Validation Method for Contracts', '合约钱包通过 isValidSignature 验证签名的标准'],
  ['ERC-6492', 'Signature Validation for Predeploy Contracts', '为尚未部署的合约钱包验证签名的包装格式'],
  ['重放攻击', 'Replay Attack', '把旧的有效签名再次提交以重复获得授权的攻击']
])}
` });
})();
