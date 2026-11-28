/* ---------- 公链模块 · 零知识与隐私计算（1）：m10-1..m10-4（原 m10 总览已并入 ch-c.js 的 m05 总览） ---------- */
(() => {

/* ===================== m10-1 零知识证明直觉 ===================== */
CUR = 'm10-1';
addCh({ id: 'm10-1', nav: '零知识证明直觉', title: 'M07.1 零知识证明直觉：完备性、可靠性与零知识', desc: '阿里巴巴山洞、色盲朋友、承诺与 Schnorr：用小数字看懂零知识证明', html: `
<h1>M07.1 零知识证明直觉：完备性、可靠性与零知识</h1>
${meta(['用阿里巴巴山洞和色盲朋友两个故事，说清完备性、可靠性、零知识三条性质。', '区分“陈述”和“见证”，并能把一个日常需求（如“我满 18 岁”）改写成陈述 + 见证。', '用小数字手算一轮 Schnorr 身份识别，并解释 Fiat–Shamir 怎样把它变成非交互证明。'], '前置：<a href="#m00-2">M00.2 哈希函数</a>、<a href="#m00-3">M00.3 公钥私钥与签名</a>')}
${beginner(`<p><strong>证明者（Prover）</strong>：手里有秘密、想让别人相信某件事的一方。</p>
<p><strong>验证者（Verifier）</strong>：检查证明、决定接受还是拒绝的一方。在链上，验证者通常是一个合约。</p>
<p><strong>陈述（Statement）</strong>：要证明的那句话，例如“我知道一个数，它的哈希是 0xab…”。陈述是公开的。</p>
<p><strong>见证（Witness）</strong>：让陈述成立的秘密，例如那个数本身。见证只有证明者知道。</p>
<p><strong>承诺（Commitment）</strong>：先把一个值“锁进信封”交出去，之后再打开。别人现在看不到内容，你以后也不能偷换。</p>
<p><strong>模运算（mod）</strong>：除法取余数。例如 17 mod 5 = 2。本篇的小数字例子全部用它。</p>`)}

<h2>1. 一句话理解</h2>
${one('零知识证明是一种对话或一段数据：它让验证者确信“陈述为真”，但验证者除了“为真”这一个比特之外，什么也学不到。')}
${call('analogy', `<p>你想证明自己能解开一个魔方，但不想教别人解法。你让朋友打乱魔方，然后背过身去还原，再转回来给他看。朋友确信你会解，但他没看到任何一步。</p>
<p>比喻的局限：朋友只看一次，你可能碰巧蒙对。真实协议要么重复很多轮，要么用数学让“蒙对”的概率小到可以忽略。</p>`)}
${art('一图看懂：证明者交出“证据”，验证者只学到“为真”', 660, 312, [
  S.zone(10, 30, 210, 240, { t: '证明者：持有秘密' }),
  S.zone(440, 30, 210, 240, { t: '验证者：只看公开' }),
  S.box(24, 60, 182, 50, { k: 'warn', icon: 'key', t: '见证 x = 6', s: '私钥，永不发送', mono: 1 }),
  S.box(454, 60, 182, 50, { k: 'info', icon: 'doc', t: '公开 y = 18', s: '公钥 2^6 mod 23', mono: 1 }),
  S.box(24, 128, 182, 118, { k: 'tint', icon: 'person', t: '证明者的回答', s: '① 选 r = 4，算 t = 16\n③ s = (4 + 2×6) mod 11\n   = 5', left: 1 }),
  S.box(454, 128, 182, 118, { k: 'key', icon: 'check', t: '验证者', s: '② 随机选 c = 2\n④ 验算 2^5 = 9\n   16 × 18^2 = 9，通过', left: 1 }),
  S.arrow(208, 152, 452, 152, { label: '① 承诺 t = 16' }),
  S.arrow(452, 190, 208, 190, { label: '② 挑战 c = 2' }),
  S.arrow(208, 228, 452, 228, { label: '③ 回应 s = 5' }),
  S.text(330, 296, '验证者只见 t、c、s 和 y：s 里混了随机数 r，算不出 x（示例，p = 23）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '三步往返：承诺 t、挑战 c、回应 s。数字取自第 5 节的手算例子，真实系统用 256 位的数。'],
  ['key', '私钥 x 只在左边，箭头上传的只有 t、c、s。验证者靠一个等式确认“证明者知道 x”。'],
  ['risk', '随机数 r 每轮必须全新。重用 r 回答两个不同的 c，别人就能算出 x。'],
  ['limit', '这是交互式版本，验证者必须在线。上链要用 Fiat–Shamir 把 c 换成哈希。']
], '左边证明者持有私钥 x 等于 6，右边验证者只看到公开的 y 等于 18。证明者发出承诺 t，验证者回挑战 c，证明者再回应 s，验证者用一个等式检查通过，但算不出 x。', 'm10-1')}

<h2>2. 三条性质：完备、可靠、零知识</h2>
<p>零知识证明的概念由 Goldwasser、Micali、Rackoff 在 1985 年前后提出。任何零知识证明都必须同时满足三条性质${cite('ethereum.org：Zero-knowledge proofs', 'https://ethereum.org/en/zero-knowledge-proofs/')}：</p>
${tbl(['性质', '英文', '一句话', '违反了会怎样'], [
  ['完备性', 'Completeness', '陈述为真、双方都诚实时，验证者一定接受', '诚实用户的证明被拒绝，系统不可用'],
  ['可靠性', 'Soundness', '陈述为假时，作弊的证明者几乎不可能让验证者接受', '有人伪造证明：凭空铸币、冒领空投'],
  ['零知识', 'Zero-knowledge', '验证者除了“陈述为真”，学不到见证的任何信息', '秘密泄露：暴露你是名单里的哪一个人']
])}
${call('info', '<p>可靠性对链上最重要：它保护的是资金。零知识性保护的是隐私。很多 ZK Rollup 只需要可靠性和“证明很小”，并不需要零知识性。</p>')}

<h3>2.1 阿里巴巴山洞</h3>
<p>这个故事来自 1989 年 CRYPTO 会议的论文《怎样向孩子解释零知识协议》${cite('Quisquater 等：How to Explain Zero-Knowledge Protocols to Your Children（CRYPTO 89）', 'https://link.springer.com/chapter/10.1007/0-387-34805-0_60')}。山洞是一个环形，入口分成左右两条路，两条路在深处被一扇魔法门隔开。只有知道咒语的人能打开这扇门。</p>
${mm('阿里巴巴山洞：一轮协议', `
sequenceDiagram
  participant P as 证明者 Peggy
  participant V as 验证者 Victor
  P->>P: 随机选左路或右路走进去
  Note over V: Victor 在洞口，看不到 Peggy 选了哪条路
  V->>P: 随机喊 从左边出来 或 从右边出来
  P->>P: 需要时用咒语开门 穿到另一侧
  P->>V: 从 Victor 指定的一侧走出
  V->>V: 方向对就记一次通过 不对就拒绝
`, [
  ['flow', '顺序是固定的：先承诺（走进某条路），再收到随机挑战（喊哪边），最后回应（从哪边出来）。'],
  ['key', '知道咒语的 Peggy 每轮都能 100% 从正确一侧出来，这就是完备性。'],
  ['fail', '不知道咒语的人每轮只有 1/2 的机会碰巧走对路，所以要重复很多轮，这就是可靠性的来源。'],
  ['limit', 'Victor 全程只看到 Peggy 从某一侧出来，没听到咒语，这就是零知识性。但如果 Victor 把过程录像给别人看，别人无法相信：录像可以剪辑伪造。']
])}
<p><strong>算一算（示例）：</strong>作弊者每轮蒙对的概率是 1/2。</p>
${steps([
  '1 轮：作弊成功概率 1/2 = 50%。',
  '10 轮：(1/2)<sup>10</sup> = 1/1024 ≈ 0.098%。',
  '20 轮：(1/2)<sup>20</sup> = 1/1,048,576 ≈ 0.000095%，约百万分之一。',
  '40 轮：(1/2)<sup>40</sup> ≈ 9.1 × 10<sup>-13</sup>。',
  '结论：可靠性不是“绝对不可能作弊”，而是“作弊概率随轮数指数下降”。真实证明系统把这个概率压到约 2<sup>-100</sup> 甚至 2<sup>-128</sup>。'
])}

<h3>2.2 色盲朋友与两个球</h3>
<p>你的朋友是红绿色盲。你手里有一个红球和一个绿球，外形完全相同。你想证明“这两个球颜色不同”，但不想告诉他哪个是红的。</p>
${steps([
  '朋友把两个球放在背后，随机决定“交换”或“不交换”，然后拿出来给你看。',
  '你说出他有没有交换。你能看见颜色，所以每次都答对。',
  '如果两个球颜色其实相同，你只能猜，每轮答对概率 1/2。',
  '重复 20 轮都答对，朋友就有约百万分之一的把握排除“你在蒙”。',
  '朋友始终不知道哪个球是红的：他只学到“你每次都答对了”。'
])}
${call('deep', '<p><strong>怎样严格定义“学不到任何东西”？</strong>密码学用“模拟器（Simulator）”来定义：如果存在一个<strong>不知道见证</strong>的程序，能生成和真实对话看起来一样的对话记录，那么真实对话就没有泄露见证。山洞故事里，模拟器就是“剪辑录像”：只保留 Peggy 碰巧走对的片段。这也解释了为什么交互式证明的录像不能说服第三方。</p>')}

<h2>3. 陈述与见证：把需求写成可证明的句子</h2>
<p>使用 ZK 的第一步，是把业务需求改写成“公开的陈述 + 私密的见证”。陈述里的公开数据叫<strong>公开输入（public input）</strong>，验证者能看到；见证里的数据叫<strong>私有输入（private input）</strong>。</p>
${tbl(['日常需求', '陈述（公开）', '见证（私密）'], [
  ['我知道某个密码', '我知道 x，使 hash(x) = h；公开 h', 'x'],
  ['我是白名单成员，但不说是谁', '我知道一个叶子和路径，使它们算出默克尔根 R；公开 R', '叶子（我的身份承诺）和默克尔路径'],
  ['我满 18 岁', '某机构签发的凭证里，生日 ≤ 今天 − 18 年；公开机构公钥和今天日期', '凭证全文和签名'],
  ['这批交易执行正确', '从旧状态根 S0 执行交易批次 B，得到新状态根 S1；公开 S0、S1、B 的承诺', '中间状态、每一步执行轨迹'],
  ['我拥有这个账户', '我知道 x，使 g<sup>x</sup> = y；公开 y', '私钥 x']
])}
<p>默克尔成员证明的结构见 <a href="#m01-2">M01.2 默克尔树与轻节点</a>。在 <a href="#m10-7">M07.7 实战</a> 里，你会把第二行写成真正的电路。</p>
${exq([['“我余额大于 100 USDC”能直接写成陈述吗？公开输入应该是什么？', '<p>不能只写“余额 &gt; 100”，验证者不知道“余额”指什么。要写成：在某个公开的状态根 R 下，我知道一个账户条目和默克尔路径，条目的余额字段 &gt; 100，并且我知道这个账户的私钥。公开输入是 R 和阈值 100；见证是账户条目、路径和私钥。</p>']])}

<h2>4. 承诺：先锁信封，再开信封</h2>
${recall('<p>哈希函数单向、抗碰撞，用哈希做“先提交、后揭示”的承诺，在 <a href="#m00-2">M00.2 哈希函数</a> 里讲过。这里只补充它在零知识证明里的角色。</p>')}
<p>一个承诺方案有两条性质：<strong>隐藏性（Hiding）</strong>，别人从承诺里看不出值；<strong>绑定性（Binding）</strong>，你打开时不能换成另一个值。最简单的做法是 <code>C = hash(值 ‖ 随机盐)</code>。盐不能省：值的可能性很少时（例如投票只有“赞成/反对”），别人可以把两个值都算一遍，对比得出你的选择。</p>
${mm('承诺在零知识证明里的位置', `
flowchart LR
  A["① 承诺<br/>证明者先固定自己的随机选择"] --> B["② 挑战<br/>验证者给出随机数"]
  B --> C["③ 回应<br/>证明者用见证算出回答"]
  C --> D{"④ 验证<br/>回答和承诺、挑战一致吗"}
  D -->|"一致"| OK["接受"]:::ok
  D -->|"不一致"| NO["拒绝"]:::risk
`, [
  ['flow', '几乎所有交互式零知识协议都是这三步：承诺 → 挑战 → 回应。山洞里的“走进某条路”就是承诺。'],
  ['key', '顺序不能颠倒。证明者如果先知道挑战，再决定承诺，就能作弊。'],
  ['risk', '挑战必须真的随机、不可预测。挑战可以被证明者预测或操控时，可靠性直接失效。'],
  ['limit', 'SNARK 内部用的是更强的“多项式承诺”，在 M07.2 讲。思想相同：先锁定，后抽查。']
])}

<h2>5. 手算一轮 Schnorr 身份识别</h2>
<p>Schnorr 协议证明“我知道私钥 x，使 y = g<sup>x</sup> mod p”，但不透露 x。它是很多签名方案（包括比特币 Taproot 用的 Schnorr 签名）的基础。签名的原理见 <a href="#m00-3">M00.3 公钥私钥与签名</a>。</p>
<p><strong>算一算（示例，数字极小，只用于教学，真实系统用 256 位的数）：</strong>取 p = 23，g = 2。2 的 11 次方 mod 23 = 1，所以指数按 q = 11 取余。</p>
${steps([
  '<strong>密钥</strong>：私钥 x = 6。公钥 y = 2<sup>6</sup> mod 23 = 64 mod 23 = <strong>18</strong>。公开 (p, g, y)。',
  '<strong>① 承诺</strong>：证明者随机选 r = 4，计算 t = 2<sup>4</sup> mod 23 = <strong>16</strong>，把 t 发给验证者。',
  '<strong>② 挑战</strong>：验证者随机选 c = 2，发给证明者。',
  '<strong>③ 回应</strong>：证明者计算 s = (r + c·x) mod 11 = (4 + 12) mod 11 = <strong>5</strong>，发给验证者。',
  '<strong>④ 验证</strong>：左边 g<sup>s</sup> = 2<sup>5</sup> mod 23 = 32 mod 23 = <strong>9</strong>。右边 t · y<sup>c</sup> = 16 × 18<sup>2</sup> mod 23。18<sup>2</sup> = 324，324 mod 23 = 2；16 × 2 = 32，32 mod 23 = <strong>9</strong>。两边相等，接受。'
])}
<p>为什么验证者学不到 x？他只看到 t = 16、c = 2、s = 5。s 里混进了随机数 r，而 r 被 t 锁住但没有公开。只要 r 每次都是新的随机数，(t, c, s) 看起来就是随机的。</p>
${call('warn', '<p><strong>随机数 r 绝对不能重复使用。</strong>用同一个 r 回答两个不同挑战 c1、c2，得到 s1、s2，任何人都能算出 x = (s1 − s2) / (c1 − c2) mod q。ECDSA 和 Schnorr 签名里的随机数重用会泄露私钥，原理相同。</p>')}
${exq([['在上面的例子里，如果证明者第二次又用 r = 4，挑战换成 c = 3，s 是多少？攻击者怎样算出 x？', '<p>s2 = (4 + 3×6) mod 11 = 22 mod 11 = 0。已知 s1 = 5、c1 = 2，s2 = 0、c2 = 3：s1 − s2 = 5，c1 − c2 = −1 ≡ 10 (mod 11)。x = 5 × 10<sup>-1</sup> mod 11。10 的逆元是 10（10×10 = 100 = 9×11 + 1），所以 x = 50 mod 11 = 6。私钥被还原。</p>']])}

<h2>6. 从交互到非交互：Fiat–Shamir 变换</h2>
<p>交互式证明有两个问题：验证者必须在线，并且录像不能说服第三方。区块链上的合约不能“在线和你聊天”，而且所有人都要能检查同一个证明。1986 年 Fiat 和 Shamir 提出一个办法：<strong>用哈希代替验证者出挑战</strong>${cite('Fiat、Shamir：How To Prove Yourself（CRYPTO 86）', 'https://www.doi.org/10.1007/3-540-47721-7_12')}。</p>
${steps2('交互式 vs 非交互式（Fiat–Shamir）', [
  { t: '交互式：证明者发承诺 t', d: '验证者此时还没出挑战' },
  { t: '交互式：验证者随机出 c', d: '必须在线；证明者无法预测' },
  { t: '非交互：c = hash(公开参数, 陈述, t)', d: '证明者自己算挑战，但改 t 就会改 c', kind: 'key' },
  { t: '非交互：证明 = (t, s)', d: '任何人、任何时间都能重新算 c 并验证', kind: 'ok' }
], [
  ['flow', '哈希把“验证者的随机性”替换成“对承诺的哈希”。证明者想先选 c 再凑 t，就要找哈希原像，做不到。'],
  ['key', '变成非交互后，证明就是一段数据：可以放进交易、存进合约、转发给任何人。SNARK 和 STARK 都依赖这一步。'],
  ['risk', '哈希里必须包含<strong>所有</strong>公开输入。漏掉公开输入，攻击者可以先选好证明再改公开输入，伪造证明。'],
  ['limit', 'Fiat–Shamir 的安全性分析依赖“随机预言机模型”：假设哈希函数像真随机函数一样。这是一个被广泛接受的假设，不是定理。']
])}
${cases([
  ['Frozen Heart：多个证明系统实现的 Fiat–Shamir 漏洞', '2022-04', '<p>Trail of Bits 公开披露一类漏洞，命名为 Frozen Heart（伪造零知识证明）。共同原因是：实现 Fiat–Shamir 时，计算挑战的哈希没有包含全部公开值。受影响的实现包括 Bulletproofs 论文推荐的做法，以及若干 PLONK 实现（包括 iden3 的 snarkjs、ConsenSys 的 gnark、Dusk Network 的 plonk）。攻击者可以为不成立的陈述伪造证明，即破坏可靠性。相关库在披露前已修复。</p><p>启示：用成熟库，不要自己拼 Fiat–Shamir；升级到修复后的版本；审计时检查“挑战哈希的输入是否覆盖全部公开输入”。</p>', [['Trail of Bits 披露（第 1 部分）', 'https://blog.trailofbits.com/2022/04/13/part-1-coordinated-disclosure-of-vulnerabilities-affecting-girault-bulletproofs-and-plonk/'], ['Trail of Bits：PlonK 中的 Frozen Heart', 'https://blog.trailofbits.com/2022/04/18/the-frozen-heart-vulnerability-in-plonk/']]]
], 'h3')}

${tryit(`<p><strong>动手练习：</strong>用 Node.js 跑一遍 Schnorr 的交互版和 Fiat–Shamir 版。</p>
${steps([
  '新建文件 <code>schnorr.js</code>，粘贴下面的代码。它只用 Node 自带的 <code>crypto</code> 模块。',
  '运行 <code>node schnorr.js</code>。预期输出两行 <code>true</code>：交互版和非交互版都验证通过。',
  '把 <code>x</code> 改成 7 但不改公钥 <code>y</code>，再运行。预期输出 <code>false</code>：不知道正确私钥的人无法通过。注意：Fiat–Shamir 版的挑战 c = 哈希 mod 11，有约 1/11 的概率恰好为 0，此时 s = r，x 不起作用，这一行也会输出 <code>true</code>；多跑几次就能看到。交互版的 c 取 1–10，不会出现这种情况。真实系统的挑战空间约 2<sup>256</sup>，碰巧的概率可以忽略。',
  '把第二次证明的 <code>r</code> 固定成和第一次一样，用第 5 节的公式还原 x。'
])}
${code('JS', `
// 教学用小参数：p = 23, g = 2, 指数模 q = 11。真实系统用 256 位椭圆曲线。
const crypto = require('crypto');
const p = 23n, g = 2n, q = 11n;
const modpow = (b, e, m) => { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; };
const rand = () => BigInt(crypto.randomInt(1, Number(q)));

const x = 6n;                 // 私钥（见证）
const y = modpow(g, x, p);    // 公钥（陈述的一部分）= 18

// 交互版：验证者随机出挑战 c
let r = rand(), t = modpow(g, r, p);
let c = rand();
let s = (r + c * x) % q;
console.log(modpow(g, s, p) === t * modpow(y, c, p) % p);

// Fiat–Shamir 版：c = hash(g, y, t) mod q，证明者自己算，任何人都能复算
r = rand(); t = modpow(g, r, p);
const h = crypto.createHash('sha256').update([g, y, t].join(',')).digest('hex');
c = BigInt('0x' + h) % q;
s = (r + c * x) % q;
console.log(modpow(g, s, p) === t * modpow(y, c, p) % p);
`)}
<p>预期结果：你能解释为什么 Fiat–Shamir 版的哈希里必须包含 <code>y</code> 和 <code>t</code>。</p>`)}

${exercises([
  ['一个“证明”系统让证明者先看到挑战，再选择承诺。三条性质中哪一条被破坏？举例说明作弊方法。', '<p>破坏的是可靠性。以 Schnorr 为例：作弊者先拿到 c，随便选一个 s，再算 t = g<sup>s</sup> · y<sup>-c</sup> mod p。这组 (t, c, s) 一定能通过验证，而作弊者根本不知道 x。山洞里等价于“先听到要从哪边出来，再决定走哪条路”。</p>'],
  ['为什么阿里巴巴山洞协议的录像不能说服没在现场的第三方？这和区块链有什么关系？', '<p>录像可以剪辑：一个不知道咒语的人和合谋的“验证者”提前约好喊哪边，或者只保留碰巧走对的片段。第三方无法区分。区块链需要“任何人都能检查”的证明，所以必须用 Fiat–Shamir 等方法变成非交互证明，挑战由哈希决定，谁也不能事先约定。</p>'],
  ['把“我是 DAO 的成员，我要投票，但不暴露我是谁，也不能投两次”拆成陈述和见证。', '<p>陈述：我知道一个秘密 s 和一条默克尔路径，使 hash(s) 是成员树（根 R 公开）里的一个叶子；并且我公开的 nullifier 等于 hash(s, 提案 ID)。见证：s 和默克尔路径。nullifier 让合约记录“这个人已投票”，但无法反推出是哪个叶子。完整实现见 <a href="#m10-7">M07.7</a>。</p>'],
  ['“作弊概率 2<sup>-128</sup>”和“作弊概率 0”在工程上有区别吗？', '<p>工程上视为相同：2<sup>-128</sup> 相当于一次就猜中一把 128 位随机密钥。但它依赖密码学假设（例如离散对数难、哈希像随机函数）。假设被打破（例如未来的量子计算机破解离散对数），概率就不再成立。所以要关注所用系统的安全假设，而不是只看数字。</p>']
])}
${checklist([
  '能用山洞或色盲朋友的故事，分别指出完备性、可靠性、零知识性体现在哪一步。',
  '能把一个业务需求写成“公开输入 + 见证”。',
  '能手算一轮 Schnorr 协议，并说出 r 重用为什么会泄露私钥。',
  '能解释 Fiat–Shamir 变换做了什么，以及挑战哈希必须包含哪些内容。',
  '能说出 Frozen Heart 漏洞的根本原因。'
])}
${mistakes([
  ['零知识证明就是加密。', '加密是“只有持钥人能读”；零知识证明是“不读也能确信某件事为真”。两者常一起用，但不是一回事。'],
  ['可靠性意味着绝对不可能作弊。', '可靠性是“作弊概率可以忽略”，例如 2<sup>-128</sup>，并且依赖密码学假设。'],
  ['所有 ZK Rollup 都保护隐私。', '多数 ZK Rollup 公开发布交易数据，用的是证明的简洁性，不是零知识性。'],
  ['有了 ZK 证明，输入数据就一定是真的。', 'ZK 只证明“从这些输入按电路规则能得出结论”。输入来源（预言机、签发机构）要另外保证。'],
  ['Fiat–Shamir 的哈希里放一部分数据就够了。', '必须包含全部公开输入和承诺，否则会出现 Frozen Heart 类伪造。']
])}
${recap([
  '零知识证明的三条性质：完备性（真话能通过）、可靠性（假话几乎通不过）、零知识（不泄露见证）。',
  '交互式协议的骨架是“承诺 → 挑战 → 回应”，作弊概率随轮数指数下降。',
  '使用 ZK 的第一步，是把需求写成“公开的陈述 + 私密的见证”。',
  'Schnorr 协议证明“我知道私钥”；随机数 r 重用会直接泄露私钥。',
  'Fiat–Shamir 用哈希代替验证者出挑战，让证明变成可上链的一段数据；哈希必须覆盖全部公开输入。'
])}
${quiz([
  { q: '作弊者每轮有 1/2 概率通过，重复 10 轮全部通过的概率约是多少？', o: ['1/20', '1/100', '1/1024', '1/2'], a: 2, why: '(1/2)<sup>10</sup> = 1/1024。概率是相乘，不是相加，所以每多一轮，作弊概率减半。' },
  { q: '在“我知道 x 使 hash(x) = h”这个证明里，哪一项是见证？', o: ['h', 'x', 'hash 函数', '验证合约地址'], a: 1, why: 'x 是只有证明者知道、让陈述成立的秘密。h 和哈希函数是公开的陈述部分。' },
  { q: '验证者“除了陈述为真，学不到任何东西”，对应哪条性质？', o: ['完备性', '可靠性', '简洁性', '零知识性'], a: 3, why: '零知识性保护见证不泄露。完备性关心诚实证明能通过，可靠性关心假证明通不过，简洁性关心证明大小和验证速度。' },
  { q: 'Fiat–Shamir 变换的作用是什么？', o: ['把交互式证明变成非交互式证明', '让证明更小', '去掉可信设置', '加密见证'], a: 0, why: '它用哈希承诺内容来生成挑战，去掉了在线验证者。它本身不减小证明、不涉及可信设置，也不加密。' },
  { q: 'Schnorr 协议里，同一个随机数 r 被用于两次不同挑战，会怎样？', o: ['两次证明都失效', '没有影响', '任何人都能算出私钥 x', '只泄露公钥'], a: 2, why: '两条方程 s1 = r + c1·x、s2 = r + c2·x 相减，r 被消掉，x = (s1 − s2)/(c1 − c2)。' }
])}
${terms([
  ['零知识证明', 'Zero-knowledge proof (ZKP)', '让验证者确信陈述为真、但学不到见证任何信息的证明。'],
  ['证明者', 'Prover', '持有见证、生成证明的一方。'],
  ['验证者', 'Verifier', '检查证明并决定接受或拒绝的一方，链上通常是合约。'],
  ['陈述', 'Statement', '要证明的公开命题，包含公开输入。'],
  ['见证', 'Witness', '让陈述成立的秘密数据，即私有输入。'],
  ['完备性', 'Completeness', '陈述为真且双方诚实时，验证一定通过。'],
  ['可靠性', 'Soundness', '陈述为假时，作弊者通过验证的概率可以忽略。'],
  ['承诺', 'Commitment', '先锁定一个值、之后再揭示的方案，具有隐藏性和绑定性。'],
  ['Fiat–Shamir 变换', 'Fiat–Shamir transform', '用哈希代替验证者生成挑战，把交互式证明变成非交互式证明。'],
  ['模拟器', 'Simulator', '不知道见证却能生成“看起来一样”的对话记录的程序，用于定义零知识性。']
])}
` });

/* ===================== m10-2 SNARK 与 STARK ===================== */
CUR = 'm10-2';
addCh({ id: 'm10-2', nav: 'SNARK 与 STARK', title: 'M07.2 SNARK 与 STARK：电路、承诺与可信设置', desc: '从程序到电路再到多项式：Groth16、PLONK、STARK 的取舍', html: `
<h1>M07.2 SNARK 与 STARK：电路、承诺与可信设置</h1>
${meta(['把一个小程序（x³ + x + 5 = 35）拍平成算术电路和 R1CS 约束，并说出 PLONKish 电路多了什么。', '用“多项式 + 随机抽查”解释证明为什么能很小，并比较 KZG 和 FRI 两种多项式承诺。', '用一张表比较 Groth16、PLONK、STARK 的证明大小、验证 Gas、可信设置和抗量子性，并说出递归和 zkVM 解决什么问题。'], '前置：<a href="#m10-1">M07.1 零知识证明直觉</a>')}
${beginner(`<p><strong>SNARK</strong>：Succinct Non-interactive ARgument of Knowledge，简洁的非交互知识论证。“简洁”指证明很小、验证很快。</p>
<p><strong>STARK</strong>：Scalable Transparent ARgument of Knowledge，可扩展的透明知识论证。“透明”指不需要可信设置。</p>
<p><strong>有限域（Finite field）</strong>：一组数加上“取模”的加减乘除。例如模 23 的世界里只有 0 到 22。电路里所有的数都在一个很大的有限域里。</p>
<p><strong>算术电路（Arithmetic circuit）</strong>：只由加法门和乘法门组成的计算图。</p>
<p><strong>约束（Constraint）</strong>：一条必须成立的等式，例如 a × b = c。电路就是一组约束。</p>
<p><strong>可信设置（Trusted setup）</strong>：在使用前生成公共参数的仪式。参数生成过程中的秘密如果泄露，有人就能伪造证明。</p>`)}

<h2>1. 一句话理解</h2>
${one('SNARK 和 STARK 都把“程序执行正确”翻译成“一组多项式满足某个等式”，然后只在随机点抽查这个等式。区别在于怎样承诺多项式：SNARK 常用椭圆曲线（证明小、常需可信设置），STARK 用哈希（证明大、无需可信设置、抗量子）。')}
${call('analogy', `<p>老师要检查一本 1,000 页的作业有没有抄错。逐页检查太慢。办法是：学生先把整本作业封进一个保险箱（承诺），老师随机说出几个页码，学生只打开这几页。只要作业里有一处错误，经过特殊编码后，错误会“扩散”到大量页面上，随机抽几页就有极高概率撞上。</p>
<p>比喻的局限：真实系统抽查的不是“页”，而是多项式在随机点的取值；“错误扩散”来自多项式的数学性质。</p>`)}
${art('一图看懂：程序变成多项式等式，只抽查几个点', 660, 336, [
  S.box(10, 40, 142, 78, { k: 'info', icon: 'code', t: '程序', s: 'x³ + x + 5 = 35\n秘密 x = 3', mono: 1 }),
  S.box(176, 40, 142, 78, { k: 'info', icon: 'gear', t: '电路', s: '3 条约束（2 次乘法）\nx·x = sym_1 …' }),
  S.box(342, 40, 142, 78, { k: 'key', icon: 'hash', t: '多项式', s: '约束合成\n一个等式' }),
  S.box(508, 40, 142, 78, { k: 'ok', icon: 'check', t: '随机抽查', s: '只验几个点\n错处被放大' }),
  S.arrow(154, 79, 174, 79),
  S.arrow(320, 79, 340, 79),
  S.arrow(486, 79, 506, 79),
  S.zone(10, 146, 640, 150, { t: '怎样承诺这个多项式？两条路' }),
  S.arrow(413, 120, 413, 144, { k: 'key' }),
  S.box(24, 176, 300, 106, { k: 'info', icon: 'lock', t: 'SNARK：椭圆曲线（KZG）', s: '证明很小：Groth16 约 256 字节\n链上验证便宜\n常需可信设置，不抗量子' }),
  S.box(336, 176, 300, 106, { k: 'ok', icon: 'hash', t: 'STARK：哈希（FRI）', s: '证明较大：几十到几百 KB\n无需可信设置\n只依赖哈希，被认为抗量子' }),
  S.text(330, 322, '共同点：把“执行正确”变成“多项式等式”，随机点抽查。差别只在怎样承诺（示例：x = 3）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '从左到右：程序拍平成电路，电路的所有约束合成一个多项式等式，验证者只在随机点抽查。'],
  ['key', '多项式让错误“扩散”到几乎每个点，所以抽查几个点就够，证明才能很小。'],
  ['limit', 'SNARK 证明小但常要可信设置；STARK 不要设置、抗量子，但证明大很多。'],
  ['risk', '可信设置的秘密如果泄露，有人就能伪造证明。STARK 没有这个问题。']
], '程序拍平成电路，电路约束合成一个多项式等式，验证者只在随机点抽查。多项式有两种承诺方式：SNARK 用椭圆曲线，证明小但常需可信设置；STARK 用哈希，证明大但不需要可信设置。', 'm10-2')}

<h2>2. 从程序到电路：拍平与 R1CS</h2>
<p>证明系统看不懂 if、for、函数调用。它只认识“加法”和“乘法”。所以第一步，是把程序拍平成每行最多一个运算的形式。下面用 Vitalik 经典文章里的例子：证明“我知道 x，使 x³ + x + 5 = 35”${cite('Vitalik Buterin：Quadratic Arithmetic Programs: from Zero to Hero', 'https://vitalik.eth.limo/general/2016/12/10/qap.html')}。</p>
${steps([
  '原程序：<code>out = x**3 + x + 5</code>，公开 out = 35，秘密 x = 3。',
  '拍平：<code>sym_1 = x * x</code>；<code>y = sym_1 * x</code>；<code>sym_2 = y + x</code>；<code>out = sym_2 + 5</code>。',
  '变量向量（含常数 1）：<code>[one, x, out, sym_1, y]</code>。<code>sym_2</code> 不单独列出：下表第 3 行把 <code>sym_2 = y + x</code> 和 <code>out = sym_2 + 5</code> 合并成一条线性约束。如果向量里保留 sym_2 却没有约束用到它，它就能取任意值，这正是下文说的“漏约束”。',
  '见证向量（示例）：<code>[1, 3, 35, 9, 27]</code>。验证：3×3 = 9，9×3 = 27，27+3+5 = 35。'
])}
<p><strong>R1CS（Rank-1 Constraint System，秩一约束系统）</strong>把每一行写成 <code>(A·w) × (B·w) = (C·w)</code> 的形式，其中 w 是见证向量，A、B、C 是系数。加法可以并进线性组合里，所以<strong>只有乘法会产生新约束</strong>。</p>
${tbl(['约束', 'A·w', 'B·w', 'C·w', '代入 w 检查'], [
  ['1', 'x', 'x', 'sym_1', '3 × 3 = 9 ✓'],
  ['2', 'sym_1', 'x', 'y', '9 × 3 = 27 ✓'],
  ['3', 'y + x + 5·one', 'one', 'out', '(27 + 3 + 5) × 1 = 35 ✓']
])}
<p>上面三条约束就是一个最小的电路。真实的 zkEVM 电路有上亿条约束。约束数越多，证明者越慢，所以电路设计的核心工程目标是“少约束”。</p>
<p><strong>PLONKish 电路</strong>不用 R1CS，而用一张表格：每一行是一个“门”，门的类型由选择器决定（加法门、乘法门、或自定义门）；不同格子之间的相等关系由“复制约束（copy constraint）”保证。它还支持两种重要优化：<strong>自定义门</strong>（一行完成一个复杂运算，例如一轮哈希）和<strong>查找表（lookup）</strong>（证明“这个值在某张预先算好的表里”，适合范围检查和位运算）。</p>
${mm('从程序到证明的流水线', `
flowchart LR
  P["程序 / 业务规则"] --> F["拍平<br/>每行一个运算"]
  F --> C["算术电路<br/>R1CS 或 PLONKish 表格"]
  C --> W["见证生成<br/>代入秘密 算出所有中间值"]
  C --> Q["编码成多项式<br/>约束成立 ⇔ 多项式等式成立"]
  W --> Q
  Q --> K["多项式承诺<br/>KZG 或 FRI"]
  K --> FS["Fiat–Shamir<br/>随机点由哈希决定"]
  FS --> PR["证明 π"]:::key
  PR --> V["验证者<br/>检查承诺在随机点的打开值"]
`, [
  ['flow', '电路只需写一次；每次证明都要重新生成见证、重新计算多项式和承诺。'],
  ['key', '“约束成立”和“某个多项式等式成立”是等价的，这是所有 SNARK/STARK 的共同核心。'],
  ['fail', '电路如果漏写约束，见证可以取“非法但满足剩余约束”的值，证明照样通过。这是最常见的 ZK 漏洞，见 M07.3。'],
  ['limit', '电路的大小在编译时固定。循环次数、数组长度都必须有上限，所以 ZK 程序没有“任意长度的循环”。']
])}

<h2>3. 为什么证明能很小：多项式与随机抽查</h2>
<p>关键事实：两个不同的 d 次多项式，最多在 d 个点上取值相同。所以在一个很大的有限域里随机挑一个点 r，如果 P(r) = Q(r)，那么 P 和 Q 几乎一定是同一个多项式（这叫 Schwartz–Zippel 引理）。</p>
<p><strong>算一算（示例）：</strong>电路有 100 万条约束，多项式次数 d ≈ 10<sup>6</sup>；有限域大小约 2<sup>254</sup>（BN254 曲线的标量域）。</p>
${steps([
  '作弊者构造的错误多项式和正确多项式最多在 d = 10<sup>6</sup> ≈ 2<sup>20</sup> 个点相同。',
  '随机点 r 恰好落在这些点上的概率 ≤ 2<sup>20</sup> / 2<sup>254</sup> = 2<sup>-234</sup>。',
  '结论：只检查一个点，就能以几乎 100% 的把握确认 100 万条约束全部成立。证明只需要包含“多项式在 r 点的值”和“这个值确实来自承诺的多项式”的证据。'
])}
<p>剩下的问题是：怎样让证明者<strong>先锁定多项式</strong>，再告诉他 r？这就是<strong>多项式承诺（Polynomial Commitment）</strong>。</p>
${compare('两种主流多项式承诺', [
  { name: 'KZG', tag: '椭圆曲线 + 配对', kind: 'info', points: ['承诺是一个曲线点（几十字节）', '打开证明也是一个曲线点，大小固定', '需要可信设置生成的参数（SRS）', '依赖椭圆曲线难题，不抗量子', '用于 PLONK 系列、以太坊 EIP-4844 blob'] },
  { name: 'FRI', tag: '哈希 + 默克尔树', kind: 'ok', points: ['把多项式取值放进默克尔树，承诺是树根', '打开时给出多条默克尔路径，证明较大', '无需可信设置（透明）', '只依赖哈希，被认为抗量子', '用于 STARK、Plonky2/3、多种 zkVM'] }
], [
  ['key', 'SNARK 和 STARK 的大部分差异，来自底层选了哪种多项式承诺。'],
  ['flow', 'FRI 的默克尔路径就是 M01.2 讲的默克尔证明：路径越多，证明越大，但验证只需要哈希。'],
  ['limit', '以太坊 EIP-4844 用 KZG 承诺 blob 数据，这是 KZG 在协议层的直接应用。'],
  ['risk', 'KZG 的可信设置秘密一旦泄露，攻击者能伪造打开证明。下一节讲怎样降低这个风险。']
])}
<p>EIP-4844 规定每个 blob 用 KZG 承诺表示，交易里引用的是承诺的哈希（versioned hash）${cite('EIP-4844：Shard Blob Transactions', 'https://eips.ethereum.org/EIPS/eip-4844')}。</p>

<h2>4. 可信设置与“万人仪式”</h2>
<p>Groth16 和 KZG 需要一组形如 g, g<sup>τ</sup>, g<sup>τ²</sup>, …, g<sup>τⁿ</sup> 的公共参数。τ（tau）是一个秘密数，被称为<strong>有毒废料（toxic waste）</strong>：谁知道 τ，谁就能伪造证明。解决办法是多方仪式：每个参与者把自己的秘密“乘进去”，然后销毁。只要有一个人真的销毁了秘密，最终的 τ 就没人知道。这叫 <strong>1-of-N 诚实假设</strong>${cite('ZKProof：Setup Ceremonies', 'https://zkproof.org/2021/06/30/setup-ceremonies/')}。</p>
${steps2('一次两阶段可信设置', [
  { t: '阶段 1：Powers of Tau', d: '与电路无关；生成 τ 的各次幂；可供任意不超过规模上限的电路复用' },
  { t: '参与者依次贡献', d: '每人用自己的随机数更新参数，然后销毁随机数' },
  { t: '随机信标（可选）', d: '用未来某个公开随机值收尾，防止最后一个人操纵' },
  { t: '阶段 2：电路专用', d: 'Groth16 需要；把阶段 1 结果转成某个电路专用的密钥（zkey）', kind: 'warn' },
  { t: '公开转录与验证', d: '任何人都能验证每一步贡献都正确地叠加在前一步之上', kind: 'ok' }
], [
  ['key', '安全性只需要一个诚实参与者。所以参与者越多、越独立，越可信。'],
  ['flow', '阶段 1 的结果可以被很多项目复用。PLONK 只需要阶段 1（通用设置），Groth16 还需要每个电路做一次阶段 2。'],
  ['risk', '电路一改，Groth16 就要重做阶段 2。开发阶段用“一个人贡献”的测试参数没问题，上主网前必须做公开的多方阶段 2。'],
  ['limit', 'STARK 没有这一步：它的参数全部来自公开的哈希函数。']
])}
${tbl(['仪式', '时间', '规模', '用途'], [
  ['Zcash Sprout', '2016', '6 名参与者，需事先指定' + cite('ZKProof：Setup Ceremonies', 'https://zkproof.org/2021/06/30/setup-ceremonies/'), 'Zcash 初版屏蔽交易'],
  ['Zcash Powers of Tau（阶段 1）+ Sapling MPC（阶段 2）', '2017–2018', '阶段 1 约 90 名个人或团队' + cite('CoinDesk：Zcash Completes Powers of Tau Privacy Ceremony（2018-04-13）', 'https://www.coindesk.com/markets/2018/04/13/zcash-completes-powers-of-tau-privacy-ceremony'), 'Zcash Sapling 升级'],
  ['以太坊 KZG 仪式', '2023-01-13 至 2023-08-08（208 天）', '141,416 次贡献' + cite('Ethereum Foundation：KZG Ceremony 总结', 'https://blog.ethereum.org/2024/01/23/kzg-wrap'), 'EIP-4844 的 KZG 参数']
])}
${call('info', '<p>以太坊 KZG 仪式的规则：用 GitHub 账号或 2023-01-13 前至少发过 4 笔交易的以太坊地址参与，以提高伪造大量身份的成本' + cite('Ethereum Foundation：Announcing the KZG Ceremony', 'https://blog.ethereum.org/2023/01/16/announcing-kzg-ceremony') + '。贡献人数多不等于“独立的人”多，但 1-of-N 假设只要求其中一个诚实。</p>')}

<h2>5. Groth16、PLONK、STARK 怎么选</h2>
${tbl(['维度', 'Groth16', 'PLONK（KZG）', 'STARK（FRI）'], [
  ['提出', '2016' + cite('Groth：On the Size of Pairing-based Non-interactive Arguments', 'https://eprint.iacr.org/2016/260'), '2019' + cite('Gabizon 等：PLONK', 'https://eprint.iacr.org/2019/953'), '2018' + cite('Ben-Sasson 等：Scalable, transparent, and post-quantum secure computational integrity', 'https://eprint.iacr.org/2018/046')],
  ['证明大小', '3 个群元素，256 字节（BN254 未压缩）', '约 868 字节（SP1 的封装证明）', '与计算规模相关，常见几十到几百 KB'],
  ['链上验证 Gas', '约 20–27 万' + cite('SP1 文档：Proof Types', 'https://docs.succinct.xyz/docs/sp1/generating-proofs/proof-types'), '约 30 万', '远高于 SNARK，常先包装成 SNARK 再上链 ' + tag('推断')],
  ['可信设置', '每个电路一次（阶段 1 + 阶段 2）', '通用，一次设置供所有电路', '不需要'],
  ['抗量子', '否（椭圆曲线）', '否（KZG 依赖椭圆曲线）', '被认为抗量子（只依赖哈希）' + cite('ethereum.org：Zero-knowledge proofs', 'https://ethereum.org/en/zero-knowledge-proofs/')],
  ['证明者速度', '快，但电路改动成本高', '中等，自定义门和查找表可大幅优化', '大规模计算时快，适合 zkVM'],
  ['典型使用', 'Zcash Sapling、Tornado 类电路、Circom 入门', 'Aztec、很多 PLONKish 电路、zkVM 的最终包装', 'Starknet、RISC Zero、SP1 内部']
])}
<p>证明大小和 Gas 来自 SP1 文档对其封装证明的说明（截至 2026 年公开资料）。单个 Groth16 验证的成本主要是配对检查：EIP-1108 规定配对检查 34,000 × k + 45,000 Gas，snarkjs 导出的 Groth16 验证合约做一次 4 对配对检查${cite('EIP-1108：Reduce alt_bn128 precompile gas costs', 'https://eips.ethereum.org/EIPS/eip-1108')}。M07.3 会逐项计算。</p>
${call('warn', '<p>“抗量子”只针对证明系统本身。一个 STARK 证明如果最后被包装成 Groth16 再上链，整条链路就继承了 Groth16 的椭圆曲线假设。</p>')}

<h2>6. 递归、折叠与 zkVM</h2>
<p><strong>递归证明（Recursion）</strong>：把“验证一个证明”本身写成电路，再为它生成证明。这样 1,000 个证明可以合并成 1 个，链上只验证一次。<strong>聚合（Aggregation）</strong>是递归的常见用法。<strong>折叠（Folding）</strong>是一种更便宜的递归：它不在每一步完整验证上一个证明，而是把两个“待证明的实例”合并成一个，最后只证明一次。Nova 是代表方案${cite('Kothapalli 等：Nova（IACR ePrint 2021/370）', 'https://eprint.iacr.org/2021/370')}。</p>
<p><strong>zkVM（零知识虚拟机）</strong>：不为每个程序手写电路，而是为一个通用指令集（例如 RISC-V）写一次电路。开发者用 Rust 等普通语言写程序，编译成该指令集，zkVM 证明“这段程序被正确执行”。SP1 证明为 RISC-V 编译的程序，支持 Rust、C、C++${cite('SP1 文档：Introduction', 'https://docs.succinct.xyz/docs/sp1/introduction')}；RISC Zero 的 zkVM 证明任意 Rust 代码的正确执行${cite('RISC Zero 文档：zkVM Overview', 'https://dev.risczero.com/api/zkvm/')}。</p>
${layers('一个 zkVM 证明怎样上链', [
  { name: 'Rust 程序', sub: '开发者写的普通代码', chips: ['读输入', '计算', '输出公开结果'] },
  { name: 'RISC-V 执行轨迹', sub: 'zkVM 执行并记录每条指令', chips: ['寄存器', '内存', '系统调用'] },
  { name: 'STARK 分片证明', sub: '轨迹太长时切片分别证明', chips: ['FRI 承诺', '可并行 GPU'], kind: 'l2' },
  { name: '递归压缩', sub: '把多个分片证明合并成一个', chips: ['常数大小 STARK'], kind: 'l2' },
  { name: 'SNARK 包装', sub: 'Groth16 或 PLONK', chips: ['约 260–868 字节', '约 27–30 万 Gas'], kind: 'key' },
  { name: '链上验证合约', sub: 'verifyProof(programId, publicValues, proof)', chips: ['以太坊或任意 EVM 链'], kind: 'risk' }
], [
  ['flow', '大规模证明在链下用 STARK 做（快、透明），最后一步包装成 SNARK（小、便宜）给链上验证。SP1 的文档把 Groth16 列为推荐的上链证明类型。'],
  ['key', 'zkVM 把“写电路”变成“写普通程序”，开发门槛大幅降低，代价是证明比手写电路慢。'],
  ['risk', 'zkVM 本身的电路很大，bug 也更难发现。程序 ID（程序哈希）必须在合约里固定，否则攻击者可以证明另一个程序。']
], ['执行', '证明', '合并', '包装', '提交'])}

${tryit(`<p><strong>动手练习：</strong>用 snarkjs 自己跑一次“迷你可信设置”，并查看 x³ + x + 5 电路的约束。</p>
${steps([
  '安装：<code>npm install -g snarkjs</code>，再按 <a href="#m10-3">M07.3</a> 第 2 节安装 circom 2。',
  '运行下面第一段命令：创建一个 2<sup>8</sup> 规模的 Powers of Tau，做两次贡献，再验证。预期最后一行输出 <code>Powers Of tau file OK!</code>。',
  '保存第二段 circom 代码为 <code>cubic.circom</code>，编译，再运行 <code>snarkjs r1cs info</code> 和 <code>snarkjs r1cs print</code>。预期显示 2 条非线性约束：加法被并进线性组合，只有两次乘法产生约束。',
  '对比第 2 节的手写 R1CS：手写版有 3 条，是因为第 3 条约束只是把加法“乘以 1”。'
])}
${code('BASH', `
snarkjs powersoftau new bn128 8 pot8_0000.ptau -v
snarkjs powersoftau contribute pot8_0000.ptau pot8_0001.ptau --name="Alice" -v -e="alice random text"
snarkjs powersoftau contribute pot8_0001.ptau pot8_0002.ptau --name="Bob" -v -e="bob random text"
snarkjs powersoftau verify pot8_0002.ptau
`)}
${code('BASH', `
cat > cubic.circom <<'EOF'
pragma circom 2.1.6;
template Cubic() {
    signal input x;          // 私有输入
    signal output out;       // 公开输出
    signal sq;
    sq <== x * x;            // 约束 1
    out <== sq * x + x + 5;  // 约束 2（加法不产生新约束）
}
component main = Cubic();
EOF
circom cubic.circom --r1cs --sym
snarkjs r1cs info cubic.r1cs
snarkjs r1cs print cubic.r1cs cubic.sym
`)}`)}

${exercises([
  ['把 out = x⁴ 拍平，最少需要几条乘法约束？', '<p>2 条：a = x × x，out = a × a。直接写 x×x×x×x 要 3 次乘法。电路优化的第一课就是重写计算顺序减少乘法。</p>'],
  ['一个团队说：“我们用 Groth16，可信设置是我们 CTO 一个人在笔记本上做的。”你会提出什么问题？', '<p>阶段 2 只有一个贡献者，如果他保留了随机数（或电脑被入侵），就能伪造任意证明，例如凭空提款。应要求：公开多方阶段 2（多名独立参与者），公开转录文件供验证，并说明阶段 1 用的是哪个公开仪式。或者换用通用设置的 PLONK / 透明的 STARK。</p>'],
  ['什么情况下你会选 STARK 而不是 Groth16？', '<p>计算规模很大（例如证明整段 VM 执行）、电路经常变化、不想依赖可信设置、关心抗量子时选 STARK。需要链上验证便宜时，常见做法是 STARK 证明后再包装成 Groth16，两者结合。</p>']
])}
${checklist([
  '能把一个小算式拍平，并写出它的 R1CS 约束表。',
  '能用 Schwartz–Zippel 的思路解释“为什么随机抽一个点就够了”。',
  '能说出 KZG 和 FRI 的三点区别：大小、可信设置、抗量子。',
  '能讲清 Powers of Tau 的 1-of-N 诚实假设，并举出以太坊 KZG 仪式的规模。',
  '能用对比表为一个项目在 Groth16、PLONK、STARK 中做选择。',
  '能画出 zkVM 证明从 Rust 程序到链上验证的分层流程。'
])}
${mistakes([
  ['SNARK 都需要可信设置。', 'Groth16 每个电路都要；PLONK 只需一次通用设置；也有不需要可信设置的 SNARK（如基于 IPA 或 FRI 的方案）。'],
  ['STARK 比 SNARK 全面更好。', 'STARK 透明、抗量子、大规模证明快，但证明大、链上验证贵。很多系统两者结合。'],
  ['可信设置的参与者都要诚实。', '只需要一个参与者诚实地销毁秘密（1-of-N）。'],
  ['用了 zkVM 就不会有电路漏洞。', 'zkVM 本身是一个巨大的电路，它的漏洞会影响所有程序；合约还必须绑定程序 ID 和公开输入。']
])}
${recap([
  '程序先拍平成算术电路；R1CS 每条约束形如 (A·w)×(B·w)=(C·w)，只有乘法产生约束。',
  '约束成立等价于多项式等式成立；在大有限域里随机抽一个点检查，作弊成功概率可以忽略。',
  '多项式承诺决定了系统性格：KZG 小、需可信设置；FRI 大、透明、抗量子。',
  '可信设置用多方仪式，只要一人诚实就安全；以太坊 KZG 仪式收集了 141,416 次贡献。',
  'Groth16 证明最小、验证最便宜；PLONK 用通用设置；STARK 无需设置；递归和 zkVM 把它们组合起来。'
])}
${quiz([
  { q: '在 R1CS 中，计算 out = a×b + c + 7 至少产生几条约束？', o: ['0', '1', '2', '3'], a: 1, why: '只有一次乘法 a×b 需要约束；加 c 和加 7 都可以并进线性组合，写成 a × b = out − c − 7。' },
  { q: '以下哪项是 STARK 相比 Groth16 的优势？', o: ['证明更小', '链上验证更便宜', '不需要可信设置', '证明生成一定更快'], a: 2, why: 'STARK 是透明的，只依赖哈希，不需要可信设置。它的证明更大、链上验证更贵；生成速度取决于规模和实现。' },
  { q: '可信设置的 1-of-N 诚实假设是什么意思？', o: ['N 个人里只要有 1 个人诚实销毁秘密就安全', '必须所有人都诚实', '超过一半的人诚实即可', '只有 1 个人参与'], a: 0, why: '每个贡献都在前一个基础上叠加随机数，只要有一个随机数没人知道，最终的 τ 就没人知道。' },
  { q: '为什么在随机点检查一次多项式等式就足够？', o: ['因为多项式都是线性的', '两个不同的低次多项式在大域里只在极少点上相等', '因为验证者会检查所有点', '因为哈希函数抗碰撞'], a: 1, why: '不同的 d 次多项式最多在 d 个点相等，域大小约 2<sup>254</sup> 时，随机点碰巧相等的概率可以忽略。' },
  { q: 'zkVM 常见的上链方式是哪一种？', o: ['直接把 RISC-V 轨迹提交到 L1', '链下 STARK 证明，递归压缩后包装成 SNARK 上链', '只在链下验证，不上链', '把 Rust 源码部署成合约'], a: 1, why: 'STARK 适合大规模证明，SNARK 适合便宜的链上验证，所以常见做法是 STARK → 递归 → Groth16/PLONK 包装。' }
])}
${terms([
  ['算术电路', 'Arithmetic circuit', '只由有限域上的加法门和乘法门组成的计算表示。'],
  ['R1CS', 'Rank-1 Constraint System', '每条约束形如 (A·w)×(B·w)=(C·w) 的约束系统，Groth16 和 Circom 使用。'],
  ['PLONKish', 'PLONKish arithmetization', '用表格行表示门、用复制约束连接格子的电路表示，支持自定义门和查找表。'],
  ['查找表', 'Lookup argument', '证明某个值属于一张预先确定的表，常用于范围检查和位运算。'],
  ['多项式承诺', 'Polynomial commitment', '先锁定一个多项式、之后在指定点打开并证明取值正确的方案。'],
  ['KZG 承诺', 'KZG commitment', '基于椭圆曲线配对的多项式承诺，大小固定，需要可信设置。'],
  ['FRI', 'Fast Reed–Solomon IOP of Proximity', '基于哈希和默克尔树的低次性测试，STARK 的核心，无需可信设置。'],
  ['可信设置', 'Trusted setup', '多方生成证明系统公共参数的仪式，只要一人诚实就安全。'],
  ['有毒废料', 'Toxic waste', '可信设置中必须销毁的秘密随机数，泄露后可伪造证明。'],
  ['zkVM', 'Zero-knowledge virtual machine', '为通用指令集一次性写好电路、可证明任意程序执行的系统。']
])}
` });

/* ===================== m10-3 第一个电路：Circom 到链上验证 ===================== */
CUR = 'm10-3';
addCh({ id: 'm10-3', nav: '第一个电路 Circom', title: 'M07.3 第一个电路：Circom 到链上验证', desc: '写电路、算见证、Groth16 证明，再用 Foundry 调用链上验证合约', html: `
<h1>M07.3 第一个电路：Circom 到链上验证</h1>
${meta(['用 circom 2 写出乘法电路和 Poseidon 哈希原像电路，并说出编译产物 .r1cs、.wasm、.zkey 各是什么。', '用 snarkjs 完成 Groth16 的设置、证明、验证，导出 Solidity 验证合约，并在 Foundry 测试里调用 verifyProof。', '识别 <code>&lt;--</code> 造成的欠约束漏洞，算出一次链上验证的 Gas，并说出证明必须绑定哪些公开输入。'], '前置：<a href="#m10-2">M07.2 SNARK 与 STARK</a>、<a href="#m02-4">M02.4 开发工具链</a>')}
${beginner(`<p><strong>Circom</strong>：iden3 团队开发的电路描述语言。你用它写约束，编译器把它变成 R1CS 和见证生成程序。</p>
<p><strong>snarkjs</strong>：JavaScript 写的证明工具，负责可信设置、生成证明、验证证明、导出 Solidity 验证合约。</p>
<p><strong>信号（signal）</strong>：Circom 里的变量。分为 <code>input</code>、<code>output</code> 和中间信号。信号的值在见证里，约束作用在信号上。</p>
<p><strong>模板（template）</strong>：可复用的电路模块，类似函数。<code>component main</code> 是整个电路的入口。</p>
<p><strong>Poseidon</strong>：一种为 ZK 电路设计的哈希函数。在电路里它比 SHA-256 和 Keccak 少很多约束。</p>
<p><strong>zkey</strong>：Groth16 电路专用的证明密钥文件，由可信设置阶段 2 生成。</p>`)}

<h2>1. 一句话理解</h2>
${one('Circom 电路 = 一组约束。你给出私有输入，程序算出所有信号（见证）；snarkjs 用 zkey 生成一个 256 字节的证明（BN254 未压缩：A 64 + B 128 + C 64 字节）；链上合约用 verifyProof 检查证明和公开输入。')}
${call('analogy', `<p>电路像一张填空试卷，约束是阅卷规则。见证是你填好的答案。证明是一个“答案全部符合规则”的封条。验证合约只检查封条和你公开的几个格子，看不到其余答案。</p>
<p>比喻的局限：阅卷规则如果漏写一条，“乱填”的答案也会被判对。电路漏写约束是最常见、也最危险的错误。</p>`)}
${art('一图看懂：只有证明和公开输入上链，私有输入不出本地', 660, 312, [
  S.zone(10, 32, 420, 240, { t: '链下：你的电脑' }),
  S.zone(440, 32, 210, 240, { t: '链上：所有人可见' }),
  S.box(22, 62, 116, 58, { k: 'info', icon: 'code', t: '电路源码', s: '写约束' }),
  S.box(162, 62, 116, 58, { k: 'info', icon: 'key', t: '证明密钥', s: 'final.zkey' }),
  S.box(308, 62, 116, 58, { k: 'warn', icon: 'lock', t: '私有输入', s: 'x 只留本地' }),
  S.arrow(140, 91, 160, 91),
  S.box(308, 168, 116, 70, { k: 'key', icon: 'doc', t: '证明 π', s: '256 字节\n+ 公开输入' }),
  S.arrow(236, 122, 310, 168),
  S.arrow(366, 122, 366, 166),
  S.arrow(426, 203, 452, 203),
  S.box(454, 62, 182, 58, { k: 'idle', dash: 1, icon: 'eye', t: '任何人', s: '看得到 π 和 h' }),
  S.box(454, 152, 182, 102, { k: 'ok', icon: 'shield', t: '验证合约', s: 'verifyProof(π, h)\n返回 true / false' }),
  S.text(330, 296, '上链的只有证明 π 和公开输入 h；私有输入 x 永远不出本地（示例：哈希原像电路）', { size: 13, anchor: 'middle', mw: 620 })
], [
  ['flow', '电路经编译和设置得到证明密钥；证明密钥加私有输入，生成 256 字节的证明。'],
  ['key', '链上合约只检查证明和公开输入。私有输入 x 不出现在任何要上链的文件里。'],
  ['risk', '电路少写一条约束，乱填的答案也能通过验证。这是最常见、最危险的错误。'],
  ['limit', '验证合约只能确认“符合电路里的规则”，不能确认规则本身写对了。']
], '左边是你的电脑：电路源码、证明密钥和只留本地的私有输入，合起来生成 256 字节的证明。右边是链上：任何人只能看到证明和公开输入，验证合约用 verifyProof 检查并返回对错。', 'm10-3')}

<h2>2. 环境与文件流水线</h2>
<p>circom 2 用 Rust 编写，从源码安装；snarkjs 通过 npm 安装${cite('iden3/circom 仓库', 'https://github.com/iden3/circom')}${cite('iden3/snarkjs README', 'https://github.com/iden3/snarkjs')}。</p>
<p>安装步骤：先装 Rust 工具链，再 <code>git clone https://github.com/iden3/circom.git</code>，在目录里运行 <code>cargo build --release</code> 和 <code>cargo install --path circom</code>；然后 <code>npm install -g snarkjs</code>，在项目目录里 <code>npm install circomlib circomlibjs</code>。Foundry 的安装见 <a href="#m02-4">M02.4</a>。</p>
${mm('一个 Groth16 电路从源码到链上的文件流', `
flowchart TB
  SRC["preimage.circom<br/>电路源码"] -->|"circom 编译"| R1CS["preimage.r1cs<br/>约束系统"]
  SRC -->|"circom 编译"| WASM["preimage_js/preimage.wasm<br/>见证生成器"]
  IN["input.json<br/>私有输入 + 公开输入"] --> WIT["witness.wtns<br/>全部信号的值"]
  WASM --> WIT
  PTAU["pot12_final.ptau<br/>阶段 1 公共参数"] --> ZK["preimage_final.zkey<br/>阶段 2 证明密钥"]:::warn
  R1CS --> ZK
  ZK --> PRF["proof.json + public.json"]
  WIT --> PRF
  ZK --> VK["verification_key.json"]
  ZK --> SOL["Verifier.sol<br/>Groth16Verifier 合约"]:::key
  PRF --> CALL["verifyProof 调用参数"]
  CALL --> SOL
`, [
  ['flow', '左侧每次证明都要重跑（输入 → 见证 → 证明）；右侧只在电路变化时重做（r1cs → zkey → 验证合约）。'],
  ['key', '验证合约里硬编码了验证密钥。电路改一个字符，就要重新生成 zkey 和验证合约，并重新部署。'],
  ['risk', 'zkey 来自可信设置阶段 2。教学时一个人贡献即可；上主网的 zkey 必须做多方贡献并公开转录。']
])}

<h2>3. 第一个电路：乘法器</h2>
<p>先写最小的电路：证明“我知道两个数 a 和 b，它们的乘积是 c”，公开 c。这是 circom 官方文档的入门例子。</p>
${code('BASH', `
cat > multiplier.circom <<'EOF'
pragma circom 2.1.6;
template Multiplier() {
    signal input a;  signal input b;   // 私有输入
    signal output c;                   // 输出信号默认公开
    c <== a * b;                       // 赋值并约束
}
component main = Multiplier();
EOF
circom multiplier.circom --r1cs --wasm --sym
snarkjs r1cs info multiplier.r1cs      # 预期：1 条约束
`)}
<p>这个陈述没有意义：任何人都能写出 33 = 1 × 33。真实电路要让陈述“只有知道秘密的人才能证明”，下一个例子用哈希原像做到这一点。</p>

<h2>4. 有意义的电路：Poseidon 哈希原像</h2>
<p>陈述：“我知道 x，使 Poseidon(x) = h”，公开 h。这正是 <a href="#m10-1">M07.1</a> 里“我知道某个密码”的需求，也是匿名成员证明的基础构件。</p>
${code('BASH', `
cat > preimage.circom <<'EOF'
pragma circom 2.1.6;
include "circomlib/circuits/poseidon.circom";

template Preimage() {
    signal input x;          // 私有：原像（秘密）
    signal input h;          // 公开：哈希值
    component hasher = Poseidon(1);
    hasher.inputs[0] <== x;
    h === hasher.out;        // 只加约束：h 必须等于 Poseidon(x)
}

// 只有 h 是公开输入；x 留在见证里
component main {public [h]} = Preimage();
EOF

# -l 指定 include 的搜索路径
circom preimage.circom --r1cs --wasm --sym -l node_modules
snarkjs r1cs info preimage.r1cs
`)}
<p>公开输入 h 要用同样的 Poseidon 实现算出来。circomlibjs 提供与 circomlib 电路一致的 JS 实现：</p>
${code('JS', `
// make_input.js：生成 input.json
const { buildPoseidon } = require('circomlibjs');
const fs = require('fs');
(async () => {
  const poseidon = await buildPoseidon();
  const x = 123456789n;                       // 示例秘密
  const h = poseidon.F.toString(poseidon([x])); // 十进制字符串
  fs.writeFileSync('input.json', JSON.stringify({ x: x.toString(), h }));
  console.log('h =', h);
})();
`)}

<h2>5. Groth16：设置、证明、验证</h2>
<p>下面的命令按 snarkjs README 的顺序执行。<code>2^12</code> 的 Powers of Tau 足够容纳几千条约束的电路。</p>
${code('BASH', `
node make_input.js
node preimage_js/generate_witness.js preimage_js/preimage.wasm input.json witness.wtns

# 阶段 1（教学用；生产可复用公开仪式的 .ptau）
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="first" -v -e="random text 1"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# 阶段 2（电路专用）
snarkjs groth16 setup preimage.r1cs pot12_final.ptau preimage_0000.zkey
snarkjs zkey contribute preimage_0000.zkey preimage_final.zkey --name="dev" -v -e="random text 2"
snarkjs zkey export verificationkey preimage_final.zkey verification_key.json

# 证明与链下验证
snarkjs groth16 prove preimage_final.zkey witness.wtns proof.json public.json
snarkjs groth16 verify verification_key.json public.json proof.json   # 预期：OK!

# 导出 Solidity 验证合约和调用参数
snarkjs zkey export solidityverifier preimage_final.zkey Verifier.sol
snarkjs zkey export soliditycalldata public.json proof.json
`)}
<p><code>public.json</code> 里只有 h；<code>proof.json</code> 里是三个曲线点 A、B、C（字段名 pi_a、pi_b、pi_c）。x 不出现在任何输出文件里。</p>

<h2>6. 在 Foundry 里调用 verifyProof</h2>
<p>snarkjs 导出的合约名为 <code>Groth16Verifier</code>，核心函数是 <code>verifyProof(uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint[N] _pubSignals) returns (bool)</code>，N 是公开输入个数（本例 N = 1）。<code>soliditycalldata</code> 输出的参数已经按合约需要的顺序排好（包括 B 点坐标的交换），所以不要自己从 proof.json 手动拼。</p>
${code('JS', `
// to_json.js：把 soliditycalldata 的输出转成 Foundry 能读的 JSON
const snarkjs = require('snarkjs');
const fs = require('fs');
(async () => {
  const proof = JSON.parse(fs.readFileSync('proof.json'));
  const pub = JSON.parse(fs.readFileSync('public.json'));
  const s = await snarkjs.groth16.exportSolidityCallData(proof, pub);
  const [a, b, c, input] = JSON.parse('[' + s + ']');
  fs.writeFileSync('calldata.json', JSON.stringify({ a, b0: b[0], b1: b[1], c, input }));
})();
`)}
${code('SOLIDITY', `
// test/Verifier.t.sol；foundry.toml 需要 fs_permissions = [{ access = "read", path = "./" }]
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Groth16Verifier} from "../src/Verifier.sol";

contract VerifierTest is Test {
    Groth16Verifier verifier;
    uint256[2] pA; uint256[2][2] pB; uint256[2] pC; uint256[1] pub;

    function setUp() public {
        verifier = new Groth16Verifier();
        string memory j = vm.readFile("calldata.json");
        uint256[] memory a = vm.parseJsonUintArray(j, ".a");
        uint256[] memory b0 = vm.parseJsonUintArray(j, ".b0");
        uint256[] memory b1 = vm.parseJsonUintArray(j, ".b1");
        uint256[] memory c = vm.parseJsonUintArray(j, ".c");
        uint256[] memory input = vm.parseJsonUintArray(j, ".input");
        pA = [a[0], a[1]];
        pB = [[b0[0], b0[1]], [b1[0], b1[1]]];
        pC = [c[0], c[1]];
        pub = [input[0]];
    }

    function test_ValidProof() public view {
        assertTrue(verifier.verifyProof(pA, pB, pC, pub)); // forge test --gas-report 查看 Gas
    }

    function test_WrongPublicInputFails() public view {
        uint256[1] memory bad = [pub[0] + 1];   // 换一个哈希值
        assertFalse(verifier.verifyProof(pA, pB, pC, bad));
    }
}
`)}
${call('warn', '<p>verifyProof 只回答“证明对这组公开输入成立吗”。业务合约还要自己检查：公开输入是否等于期望值（例如登记过的哈希）、证明有没有被用过、证明是否绑定了调用者。否则别人可以从内存池复制你的证明抢先提交。</p>')}
<p><strong>算一算（示例）：</strong>一次 Groth16 链上验证要多少 Gas？Horizen Labs 的拆解：配对检查 181,000（EIP-1108：34,000 × 4 + 45,000）、交易基础费 21,000、256 字节证明的 calldata 约 4,096、合约其他开销约 1,600，固定部分约 207,700；每多一个公开输入约 +7,160${cite('Horizen Labs：The True Cost of ZK Verification', 'https://www.horizenlabs.io/blog/zk-analysis-the-true-cost-of-zk-verification')}${cite('EIP-1108', 'https://eips.ethereum.org/EIPS/eip-1108')}。</p>
${steps([
  '本例 1 个公开输入：207,700 + 7,160 × 1 ≈ <strong>214,860 Gas</strong>（整笔交易）。',
  '假设 Gas 价格 10 gwei（示例）：214,860 × 10 gwei = 2,148,600 gwei ≈ <strong>0.00215 ETH</strong>。',
  '假设 ETH = 3,000 美元（示例）：约 <strong>6.4 美元</strong>。',
  '如果把 nullifier、接收地址、默克尔根都作为公开输入（共 4 个）：207,700 + 7,160 × 4 ≈ 236,340 Gas。公开输入多一个，成本只涨约 3%。',
  '对比：在 L2 上同样的验证 Gas 数不变，但 Gas 单价低得多。Foundry 的 gas report 只统计合约调用本身，不含 21,000 基础费。'
])}

<h2>7. 最常见的坑：欠约束（under-constrained）</h2>
<p>Circom 有三个容易混淆的运算符：<code>&lt;==</code> 赋值并加约束；<code>===</code> 只加约束；<code>&lt;--</code> <strong>只赋值、不加约束</strong>。官方文档明确警告：<code>&lt;--</code> 是用 circom 写出有漏洞 ZK 协议的最常见原因，只在表达式无法写成算术约束时使用，并且必须另外用 <code>===</code> 补上约束${cite('circom 文档：Signals & Constraints', 'https://github.com/iden3/circom/blob/master/mkdocs/docs/circom-language/signals.md')}。</p>
${compare('IsZero：错误写法与正确写法', [
  { name: '错误：只赋值', tag: '欠约束', kind: 'risk', points: ['<code>out &lt;-- in == 0 ? 1 : 0;</code>', '见证生成器算出正确值', '但没有任何约束绑定 out 和 in', '恶意证明者可以自己改 out，证明照样通过'] },
  { name: '正确：circomlib 的 IsZero', tag: '提示 + 约束', kind: 'ok', points: ['<code>inv &lt;-- in != 0 ? 1/in : 0;</code>（除法不能直接约束，先给提示）', '<code>out &lt;== -in * inv + 1;</code>', '<code>in * out === 0;</code>', '两条约束保证 out 只能是正确值'] }
], [
  ['key', '规则：每一个用 <code>&lt;--</code> 赋值的信号，都要有 <code>===</code> 或 <code>&lt;==</code> 约束把它和输入绑死。'],
  ['fail', '欠约束电路在正常测试里完全正常：诚实的见证生成器总是算对。只有“手工篡改见证”的测试才能发现问题。'],
  ['risk', '后果是可靠性被破坏：攻击者能为假陈述生成有效证明，例如伪造默克尔根、重复提款。'],
  ['limit', '在 in = 0 时，inv 可以是任意值，但约束仍然迫使 out = 1；这种“提示值不唯一但结果唯一”是允许的。']
])}
${tbl(['坑', '后果', '怎样避免'], [
  ['用 <code>&lt;--</code> 或 <code>=</code> 而没有补约束', '输出可被任意篡改', '默认用 <code>&lt;==</code>；用静态分析工具 Circomspect 扫描' + cite('Trail of Bits：It pays to be Circomspect', 'https://blog.trailofbits.com/2022/09/15/it-pays-to-be-circomspect/')],
  ['比较器输入没做位数检查', 'LessThan 在输入超过 n 位时结果错误（Dark Forest v0.3 的真实漏洞' + cite('0xPARC zk-bug-tracker', 'https://github.com/0xPARC/zk-bug-tracker') + '）', '对输入先用 <code>Num2Bits(n)</code> 约束位数'],
  ['公开输入超出有限域', '两个不同的 uint256 在域里是同一个数，可能重复使用', '合约里检查公开输入 &lt; 标量域模数。snarkjs 导出的 Groth16Verifier 已在 verifyProof 里对每个公开输入做 checkField（≥ r 直接返回 false）；手写或其他工具生成的验证器、以及业务合约自己用这些值做映射键时仍要检查'],
  ['证明不绑定调用者', '内存池里的证明被他人抢先提交', '把接收地址作为公开输入（即使电路里只做平方等“空约束”）'],
  ['证明可重复使用', '同一证明领取多次', '公开 nullifier，合约记录已使用'],
  ['生产用单人 zkey', '持有阶段 2 随机数的人能伪造证明', '多方阶段 2 并公开转录']
])}
${cases([
  ['circomlib MiMC：输出只赋值未约束（影响 Tornado Cash 电路）', '2019-10', '<p>circomlib 的 MiMC 哈希模板里，一个输出用普通赋值 <code>=</code> 而不是 <code>&lt;==</code>，因此没有约束。Tornado Cash 的电路使用了这个哈希。攻击者理论上可以伪造默克尔根，从合约中提走别人的存款。漏洞由安全研究员发现并修复，修复方法就是把赋值改成 <code>&lt;==</code>。Trail of Bits 后来指出，他们的静态分析工具 Circomspect 能在部署前发现这类问题。</p>', [['0xPARC zk-bug-tracker', 'https://github.com/0xPARC/zk-bug-tracker'], ['Trail of Bits：It pays to be Circomspect', 'https://blog.trailofbits.com/2022/09/15/it-pays-to-be-circomspect/']]]
], 'h3')}

${tryit(`<p><strong>动手练习：</strong>完整跑通第 4–6 节，再亲手制造一个欠约束漏洞。</p>
${steps([
  '按第 4、5 节生成 <code>proof.json</code>，确认 <code>snarkjs groth16 verify</code> 输出 <code>OK!</code>。',
  '<code>forge init</code> 一个项目，把 <code>Verifier.sol</code> 放进 <code>src/</code>，运行 <code>node to_json.js</code>，把测试放进 <code>test/</code>，运行 <code>forge test -vv</code>。预期两个测试都通过，用 <code>forge test --gas-report</code> 查看 verifyProof 的 Gas（约 20 万量级）。',
  '把 <code>preimage.circom</code> 里的 <code>h === hasher.out;</code> 删掉，重新编译、设置、证明。然后在 input.json 里把 h 改成任意数（例如 "42"），重新生成见证和证明。预期：证明照样通过验证。这就是欠约束：电路不再约束 h。',
  '恢复约束，再试一次，预期见证生成阶段直接报错（约束不满足）。',
  '选做：安装 Circomspect，对一个用 <code>&lt;--</code> 的电路运行它，观察警告。'
])}`)}

${exercises([
  ['乘法器电路里把 <code>c &lt;== a * b</code> 改成 <code>c &lt;-- a * b</code>，会发生什么？', '<p>电路里不再有任何约束。见证生成器依旧算出 c = a×b，正常测试都通过；但恶意证明者可以把见证里的 c 改成任意值，生成的证明照样有效。<code>snarkjs r1cs info</code> 会显示约束数为 0，这是一个很好的自检信号。</p>'],
  ['一个空投合约只检查 <code>verifier.verifyProof(...)</code> 返回 true 就转账给 msg.sender。列出至少三个漏洞。', '<p>① 没检查公开输入是否等于合约登记的默克尔根，攻击者用自己构造的树证明；② 没有 nullifier，同一证明可以反复领取；③ 证明没绑定接收地址，别人从内存池复制证明抢先领取；④ 没检查公开输入是否小于标量域模数。</p>'],
  ['电路有 5 个公开输入，按本文的 Gas 模型，链上验证大约多少 Gas？如果 Gas 价格是 2 gwei（示例）呢？', '<p>207,700 + 7,160 × 5 = 243,500 Gas。2 gwei 时为 487,000 gwei ≈ 0.000487 ETH。</p>']
])}
${checklist([
  '能安装 circom 2 和 snarkjs，并编译一个电路。',
  '能独立跑通 Groth16 的设置、证明、验证三步。',
  '能导出 Solidity 验证合约，并在 Foundry 测试里调用 verifyProof。',
  '能指出电路里每个 <code>&lt;--</code> 是否有对应的约束。',
  '能列出业务合约在 verifyProof 之外必须做的三项检查。',
  '能用固定成本 + 每个公开输入的成本估算验证 Gas。'
])}
${mistakes([
  ['测试都通过了，电路就是安全的。', '诚实的见证生成器总能算对。欠约束只有篡改见证的负面测试或静态分析才能发现。'],
  ['<code>&lt;--</code> 和 <code>&lt;==</code> 只是写法不同。', '<code>&lt;--</code> 不产生约束，是 circom 漏洞的最常见来源。'],
  ['verifyProof 返回 true 就可以放款。', '还要检查公开输入的值、防止重放（nullifier）、绑定调用者。']
])}
${recap([
  'Circom 用信号和约束描述电路；编译产出 .r1cs（约束）和 .wasm（见证生成器）。',
  'Groth16 流程：Powers of Tau → 电路专用 zkey → 证明 → 验证；验证合约由 zkey 导出。',
  'Foundry 测试里用 soliditycalldata 的参数调用 verifyProof，并写“改公开输入必须失败”的负面测试。',
  '<code>&lt;--</code> 只赋值不约束，是欠约束漏洞的主要来源；用 <code>&lt;==</code>、补 <code>===</code>、用 Circomspect 扫描。',
  '一次 Groth16 验证约 21 万 Gas（1 个公开输入），每多一个公开输入约 +7 千。'
])}
${quiz([
  { q: 'Circom 中哪个运算符“只赋值、不加约束”？', o: ['<code>&lt;==</code>', '<code>===</code>', '<code>&lt;--</code>', '<code>==</code>'], a: 2, why: '<code>&lt;--</code> 只在见证生成时赋值，不进入 R1CS。<code>&lt;==</code> 赋值并约束，<code>===</code> 只约束，<code>==</code> 是比较表达式。' },
  { q: '为什么要把接收地址作为公开输入放进证明？', o: ['让证明更小', '防止别人复制证明抢先提交', '减少约束数量', '让验证更便宜'], a: 1, why: '证明绑定了接收地址后，抢跑者改地址会让证明失效。不绑定时，内存池里的证明可以被任何人复制。' },
  { q: '按本文模型，3 个公开输入的 Groth16 验证约多少 Gas？', o: ['约 23 万', '约 21 万', '约 50 万', '约 2.1 万'], a: 0, why: '207,700 + 7,160 × 3 = 229,180，约 23 万。' },
  { q: 'circomlib MiMC 漏洞的根本原因是？', o: ['哈希函数被破解', '可信设置泄露', '一个输出用普通赋值而没有约束', 'Solidity 重入'], a: 2, why: '输出用 <code>=</code> 赋值，没有约束，证明者可以篡改哈希输出。修复是改成 <code>&lt;==</code>。' }
])}
${terms([
  ['Circom', 'Circom', 'iden3 开发的电路描述语言，编译成 R1CS 和见证生成器。'],
  ['snarkjs', 'snarkjs', '用于可信设置、Groth16/PLONK 证明和导出 Solidity 验证合约的 JS 工具。'],
  ['信号', 'Signal', 'Circom 中的电路变量，值保存在见证里，约束作用在信号上。'],
  ['欠约束', 'Under-constrained', '电路的约束不足以唯一确定某些信号，允许恶意见证通过验证。'],
  ['Poseidon', 'Poseidon hash', '为算术电路设计的哈希函数，约束数远少于 SHA-256/Keccak。'],
  ['证明密钥', 'Proving key (zkey)', 'Groth16 电路专用的参数文件，生成证明和导出验证合约都需要它。']
])}
` });

/* ===================== m10-4 zkEVM 与 ZK Rollup ===================== */
CUR = 'm10-4';
addCh({ id: 'm10-4', nav: 'zkEVM 与 ZK Rollup', title: 'M07.4 zkEVM 与 ZK Rollup', desc: '状态转换怎样被证明、zkEVM 的四种类型、主要项目与证明者市场', html: `
<h1>M07.4 zkEVM 与 ZK Rollup</h1>
${meta(['说清 ZK Rollup 的证明“证明了什么”：公开输入、私有见证和 L1 验证合约的分工。', '用 Vitalik 的 zkEVM 类型 1–4 给 zkSync、Scroll、Linea、Starknet 等项目定位，并说出兼容性与证明速度的取舍。', '估算一批交易的证明成本分摊，说出实时证明和证明者市场的现状与风险。'], '前置：<a href="#m10-2">M07.2 SNARK 与 STARK</a>、<a href="#m05-5">M04.5 Rollup 深入</a>')}
${beginner(`<p><strong>状态根（State root）</strong>：把所有账户余额、合约存储压缩成的一个哈希值。状态变了，根就变。</p>
<p><strong>状态转换（State transition）</strong>：从旧状态根，执行一批交易，得到新状态根。</p>
<p><strong>zkEVM</strong>：能为“EVM 执行一批交易”生成零知识证明的系统。</p>
<p><strong>证明者（Prover）</strong>：在 Rollup 里专门负责生成证明的服务，通常运行在 GPU 集群上。</p>
<p><strong>有效性证明（Validity proof）</strong>：证明“新状态根计算正确”的 SNARK/STARK 证明。ZK Rollup 用它代替乐观 Rollup 的挑战期。</p>`)}

<h2>1. 一句话理解</h2>
${one('ZK Rollup 把“L1 重新执行所有 L2 交易”换成“L1 验证一个证明：从旧状态根执行这批交易，确实得到新状态根”。zkEVM 是让这个证明覆盖完整 EVM 语义的电路或虚拟机。')}
${call('analogy', `<p>乐观 Rollup 像一家公司的账本：默认可信，7 天内任何人可以举报做假账。ZK Rollup 像每份账本都附上一份会计师事务所的审计报告，而且报告可以用数学方法几秒钟核对真伪，不用等举报期。</p>
<p>比喻的局限：审计报告只证明“按规则算对了”。如果“规则”（电路）本身写错了，或者事务所（升级权限持有者）能改规则，报告也帮不了你。</p>`)}
${art('一图看懂：L1 不再重放交易，只验一个证明', 660, 300, [
  S.zone(10, 32, 300, 196, { t: 'L2 / 链下' }),
  S.zone(350, 32, 300, 196, { t: 'L1（以太坊）' }),
  S.box(24, 62, 272, 56, { k: 'info', icon: 'server', t: '排序器', s: '执行一批交易：S0 → S1' }),
  S.box(24, 148, 272, 70, { k: 'info', icon: 'cpu', t: '证明者（zkEVM）', s: '见证：执行轨迹、默克尔路径\n只有证明者知道' }),
  S.box(364, 62, 272, 56, { k: 'tint', icon: 'block', t: 'Rollup 合约', s: '记录数据承诺和状态根' }),
  S.box(364, 148, 272, 70, { k: 'key', icon: 'shield', t: '验证合约', s: '公开输入：S0、S1、数据承诺\n只验证，不重放交易' }),
  S.arrow(160, 120, 160, 146),
  S.arrow(298, 90, 362, 90, { label: 'commit' }),
  S.arrow(298, 183, 362, 183, { k: 'key', label: '证明 π' }),
  S.arrow(500, 146, 500, 120, { k: 'ok' }),
  S.box(10, 244, 640, 44, { k: 'risk', dash: 1, icon: 'warn', t: '证明只保证“按规则算对”', s: '规则（电路）写错、升级权限过大，证明也挡不住', left: 1 })
], [
  ['flow', '排序器执行批次，证明者生成证明，L1 先收到批次承诺，再收到证明。'],
  ['key', '验证合约的公开输入取自已提交的批次，证明和 L1 上的数据绑在一起。'],
  ['limit', '见证（执行轨迹）只在证明者手里；L1 只验证，不重新执行每笔交易。'],
  ['risk', '证明保证的是“按电路规则算对”。电路漏洞和升级权限不在它的保证里。']
], '左边 L2：排序器执行一批交易，从旧状态根 S0 得到新状态根 S1，证明者用执行轨迹生成证明。右边 L1：Rollup 合约记录批次承诺，验证合约用公开输入检查证明。底部提醒：规则写错或升级权限过大，证明也挡不住。', 'm10-4')}

<h2>2. ZK Rollup 证明的到底是什么</h2>
${recall('<p>排序器、批次、数据发布到 L1、强制包含、L2BEAT 安全阶段，以及“电路 + 证明者 + 验证合约”三部件，在 <a href="#m05-5">M04.5 Rollup 深入</a> 里讲过。本节只把“证明”这一环拆开。</p>')}
<p>用 <a href="#m10-1">M07.1</a> 的语言，ZK Rollup 的陈述是：</p>
${tbl(['部分', '内容', '谁能看到'], [
  ['公开输入', '旧状态根 S0、新状态根 S1、这批交易数据的承诺（例如 blob 的 versioned hash）、L1→L2 消息队列的哈希、L2→L1 提款消息的根', 'L1 合约和所有人'],
  ['见证', '每笔交易的执行轨迹、读写过的账户和存储槽、它们在旧状态树里的默克尔路径', '只有证明者'],
  ['电路检查', '① 交易数据和承诺一致；② 每笔交易签名、nonce、余额合法；③ 按 EVM 规则执行；④ 默克尔路径从 S0 推出 S1', '—']
])}
<p>第 ① 条很关键：如果证明不约束“执行的交易就是发布到 L1 的那批数据”，排序器可以执行一批交易、发布另一批数据。</p>
${mm('一个 ZK Rollup 批次的生命周期（ZKsync 风格）', `
sequenceDiagram
  participant S as 排序器
  participant P as 证明者集群
  participant L1 as L1 Rollup 合约
  participant V as L1 验证合约
  S->>S: 执行交易 生成 L2 区块和批次
  S->>L1: commitBatches 提交数据承诺和新状态根
  S->>P: 发送批次和执行轨迹
  P->>P: 生成分片 STARK 证明 递归压缩 包装成 SNARK
  P->>L1: proveBatches 提交证明
  L1->>V: 验证证明 公开输入取自已提交的批次
  V-->>L1: 有效
  L1->>L1: executeBatches 最终确定状态根 开放提款
`, [
  ['flow', '三步：提交（commit）→ 证明（prove）→ 执行（execute）。ZKsync 的 L1 合约用这三个函数名，其他项目的名称不同，但结构类似。'],
  ['key', '验证合约读取的公开输入来自“已提交的批次”，而不是证明者随便填的值。这把证明和 L1 上的数据绑定在一起。'],
  ['fail', '证明者宕机或证明失败时，批次停在“已提交、未证明”，提款无法完成，但资金不会被错误转走。'],
  ['risk', '多数项目在 execute 之前还设置了执行延迟，或保留安全委员会的紧急权限。这些权限能绕过证明，是真实的信任假设。']
])}
<p>上面三个阶段的函数名来自 ZKsync 的 L1 合约文档${cite('ZKsync L1 合约文档（Code4rena 2024-03 审计仓库）', 'https://github.com/code-423n4/2024-03-zksync/blob/main/docs/Smart%20contract%20Section/L1%20smart%20contracts.md')}。</p>

<h2>3. zkEVM 的四种类型</h2>
<p>2022 年 Vitalik 按“与以太坊的兼容程度”把 zkEVM 分成类型 1 到 4。越接近类型 1，兼容性越好、证明越慢；越接近类型 4，证明越快、兼容性越差${cite('Vitalik Buterin：The different types of ZK-EVMs（2022-08）', 'https://vitalik.eth.limo/general/2022/08/04/zkevm.html')}。</p>
${tbl(['类型', '定义', '优点', '代价', '原文举例（2022）'], [
  ['类型 1', '完全等价以太坊，连哈希、状态树、预编译都不改', '能直接证明以太坊 L1 区块，复用执行客户端', '证明最慢', 'PSE 等团队的 ZK-EVM 社区版'],
  ['类型 2', 'EVM 内部完全等价，外部结构可改（例如状态树改用 Poseidon）', '应用基本不改即可部署', '依赖 Keccak 历史证明的工具可能失效', 'Scroll、Polygon 的目标'],
  ['类型 2.5', '同类型 2，但提高难证明操作的 Gas', '最坏情况证明时间大幅改善', '硬编码 Gas 的应用可能出问题', '—'],
  ['类型 3', '几乎等价，去掉部分难证明的特性（如部分预编译）', '更容易实现、证明更快', '部分应用需要改写', '当时的 Scroll、Polygon'],
  ['类型 4', '把 Solidity/Vyper 源码编译到为 ZK 设计的语言，不证明 EVM 字节码', '证明最快、成本最低', '合约地址可能不同、手写字节码难支持、EVM 调试工具不通用', 'ZKsync；Nethermind Warp（Solidity → Cairo）']
])}
${call('info', '<p>类型是“设计光谱上的位置”，不是永久标签。原文就预测项目会随时间向类型 2/1 移动。判断一个项目今天属于哪类，要看它最新的文档和 L2BEAT 页面，不要只看 2022 年的分类。</p>')}
${compare('兼容性与证明成本的取舍', [
  { name: '靠近类型 1', tag: '兼容优先', kind: 'info', points: ['证明真正的以太坊语义', 'Keccak、MPT 状态树在电路里很贵', '未来可用于证明 L1 本身', '方向：以太坊 L1 zkEVM'] },
  { name: '靠近类型 4', tag: '性能优先', kind: 'warn', points: ['自定义虚拟机和电路友好哈希', '证明快、成本低', '要测试编译器差异和地址推导差异', '方向：ZKsync、Starknet（非 EVM）'] }
], [
  ['key', '取舍的本质：EVM 不是为 ZK 设计的。越忠实地证明它，电路越大。'],
  ['risk', '类型 3/4 的“细微差异”是真实的安全风险：同一份 Solidity 代码在两条链上行为可能不同。部署前要在目标链上完整跑测试。'],
  ['limit', 'zkVM（M07.2）提供了第三条路：用 RISC-V zkVM 证明一个以太坊执行客户端（例如 Rust 写的 reth），兼容性来自“直接证明客户端代码”。']
])}

<h2>4. 主要项目（截至 2026 年公开资料）</h2>
${tbl(['项目', '关键事实', '证明与执行环境'], [
  ['ZKsync Era', '2023-03-24 主网 Alpha 向所有用户开放，当时被称为以太坊上第一个公开的 zkEVM' + cite('The Block：zkSync Era first zkEVM goes live（2023-03-24）', 'https://www.theblock.co/post/222596/zksync-era-first-zkevm-goes-live-in-major-development-for-ethereum'), 'Vitalik 2022 年归为类型 4：Solidity 编译到自有虚拟机 EraVM。2025-10 的 Atlas 升级引入 ZKsync OS（Rust 编写）和 Airbender（RISC-V）证明器，计划逐步取代 EraVM；当前类型以最新文档为准' + cite('The Block：ZKsync launches Atlas upgrade（2025-10-07）', 'https://www.theblock.co/post/373407/zksync-launches-atlas-upgrade-support-enterprise-institutional-blockchains') + cite('ZKsync 文档：ZKsync OS', 'https://docs.zksync.io/zksync-network/zksync-os')],
  ['Starknet', '不是 EVM：合约用 Cairo 编写，Cairo 被定位为“编写可证明程序的语言”' + cite('The Cairo Book', 'https://www.starknet.io/cairo-book/'), 'STARK 证明，由 StarkWare 的共享证明服务 SHARP 生成并递归聚合，新一代证明器 S-two 于 2025-11 上线主网，取代 Stone 证明全部区块' + cite('Starknet 文档：SHARP', 'https://docs.starknet.io/architecture/sharp/')],
  ['Scroll', '2023-10-17 宣布主网上线，走字节码级兼容路线' + cite('The Block：Scroll confirms mainnet launch（2023-10-17）', 'https://www.theblock.co/post/257919/scroll-official-mainnet-launch'), '字节码级 zkEVM；2025-04 的 Euclid 升级改用基于 OpenVM（RISC-V zkVM）的证明器，状态树由 zktrie 改为 MPT，向类型 1 靠拢'],
  ['Linea', 'Consensys 于 2023-07-11 发布主网 Alpha' + cite('The Block：Consensys launches Linea（2023-07-11）', 'https://www.theblock.co/post/238865/consensys-linea-layer-2'), '官方称完全兼容 EVM 字节码'],
  ['Polygon zkEVM', '2025-06-11 宣布在 2026 年停止 Mainnet Beta，原因包括 EIP-4844 支持延迟、ZK 计数器限制让部分 DeFi 交易不可行' + cite('Polygon 论坛：Sunsetting Polygon zkEVM Mainnet Beta in 2026', 'https://forum.polygon.technology/t/sunsetting-polygon-zkevm-mainnet-beta-in-2026/21020') + '；排序器已于 2026-07-03 停止。钱包（EOA）里的资产可经领取界面在以太坊取回，界面开放至 2027-12-31；锁在 DeFi、多签或第三方桥合约里的资产无法经领取界面取回，需找对应协议' + cite('Polygon：Polygon zkEVM', 'https://polygon.technology/polygon-zkevm') + cite('Polygon 论坛：Sunset — Claim Your Funds', 'https://forum.polygon.technology/t/polygon-zkevm-mainnet-beta-sunset-claim-your-funds/21856'), '类型 2/3 方向的 zkEVM；停运是一个“ZK Rollup 也会关停”的真实案例']
])}
${call('warn', '<p>Polygon zkEVM 的停运公告特别提醒：锁在 DeFi 合约里的资产不能自动迁移，用户必须在停运前自己取出并桥回；排序器停止后，这类资产也不能经领取界面取回。选择 L2 时，除了看证明系统，还要看项目的长期运营承诺和退出通道。</p>')}

<h2>5. 证明成本、实时证明与证明者市场</h2>
<p>ZK Rollup 的链上成本（数据 + 验证）在 <a href="#m05-5">M04.5</a> 讲过。ZK 特有的是<strong>链下证明成本</strong>：GPU 时间、电费、运维。它由整批交易分摊。</p>
<p><strong>算一算（示例，数字为假设）：</strong></p>
${steps([
  '一个批次 5,000 笔交易。证明它需要 8 块 GPU 运行 3 分钟，GPU 租金 2 美元/卡/小时。证明成本 = 8 × 2 × 3/60 = <strong>0.8 美元</strong>。',
  '链上验证约 30 万 Gas（包装后的 SNARK），Gas 价格 5 gwei、ETH 3,000 美元：300,000 × 5 gwei = 0.0015 ETH = <strong>4.5 美元</strong>。',
  '每笔交易分摊：(0.8 + 4.5) / 5,000 ≈ <strong>0.00106 美元</strong>，约 0.1 美分。',
  '如果批次只有 50 笔交易：(0.8 × 50/5000 + 4.5) / 50 ≈ 0.09 美元。验证成本是固定的，<strong>交易少时每笔分摊急剧上升</strong>，这就是低活跃度 ZK 链的成本压力。',
  '结论：证明成本随交易量线性增长，验证成本是固定开销。规模越大，ZK Rollup 越划算。'
])}
<p><strong>实时证明（real-time proving）</strong>指在一个以太坊 slot（12 秒）内为一个 L1 区块生成证明。以太坊基金会 2025-07 给出的定义是：主网区块 P99 延迟 ≤ 10 秒，本地硬件成本 ≤ 10 万美元，功耗 ≤ 10 kW${cite('Ethereum Foundation：Shipping an L1 zkEVM #1: Realtime Proving（2025-07-10）', 'https://blog.ethereum.org/2025/07/10/realtime-proving')}。2025-12 的后续文章称，证明延迟已从 16 分钟降到 16 秒，成本下降 45 倍，zkVM 已能在目标硬件上 10 秒内证明 99% 的以太坊区块；下一阶段重点转向安全性：中间里程碑是 2026 年 5 月底达到 100 位可证明安全（以 EF 的 soundcalc 工具估算），最终目标是 2026 年底达到 128 位可证明安全${cite('Ethereum Foundation：zkEVM Security Foundations（2025-12-18）', 'https://blog.ethereum.org/2025/12/18/zkevm-security-foundations')}。Succinct 在 2025-11-18 报告其 SP1 Hypercube 用 16 块 RTX 5090 在 12 秒内证明了 99.7% 的抽样 L1 区块（样本 954 个）${cite('Succinct：SP1 Hypercube Achieves Real Time Proving with 16 GPUs', 'https://blog.succinct.xyz/real-time-proving-16-gpus/')}，这是项目方自报数据。</p>
<p><strong>证明者市场（prover market）</strong>把“生成证明”变成可以外包、竞价的服务：应用提交证明请求，独立证明者竞争完成。Succinct Prover Network 于 2025-08-05 上线主网${cite('The Block：Succinct launches decentralized prover network on mainnet', 'https://www.theblock.co/post/365606/succinct-mainnet-prove-token')}；RISC Zero 孵化的 Boundless 于 2025-09 宣布主网上线，用“可验证工作量证明（PoVW）”激励证明者，证明者需要质押代币作为抵押${cite('Boundless：Mainnet is live（2025-09-14）', 'https://boundlessfdn.org/blog/mainnet-is-live')}。</p>
${layers('证明者市场的分层', [
  { name: '需求方', sub: 'Rollup、跨链桥、协处理器应用', chips: ['提交程序 ID + 输入', '出价与截止时间'] },
  { name: '市场 / 撮合层', sub: '链上合约或链下撮合 + 链上结算', chips: ['竞价', '质押与罚没', '超时重派'], kind: 'key' },
  { name: '证明者', sub: '独立运营的 GPU 集群', chips: ['zkVM（SP1、RISC Zero 等）', '递归与包装'] },
  { name: '链上验证', sub: '验证合约', chips: ['固定程序 ID', '检查公开输出'], kind: 'risk' }
], [
  ['flow', '需求方只关心“在截止时间前拿到有效证明”；证明者用质押担保按时交付。'],
  ['key', '证明的正确性由验证合约保证，市场只影响“活性”（能否按时拿到证明）和价格，不影响可靠性。'],
  ['risk', '证明者集中在少数大集群时，存在审查和宕机风险；Rollup 应保留“任何人都能当证明者”的回退路径。']
], ['请求', '分派', '提交'])}

<h2>6. 和乐观 Rollup 比：ZK 一侧的真实风险</h2>
<p>两类 Rollup 的完整对比表在 <a href="#m05-5">M04.5</a>。这里只补 ZK 一侧容易被忽略的风险：</p>
${tbl(['风险', '说明', '缓解'], [
  ['电路 / zkVM 漏洞', '欠约束或证明系统实现错误，能让错误状态根通过验证（M07.3 的漏洞放大到 zkEVM 规模）', '多次审计、形式化验证、漏洞赏金；多证明系统（multi-proof）互相校验'],
  ['验证合约可升级', '升级权限持有者可以换掉验证合约，绕过所有密码学保证', '升级时间锁、安全委员会门槛、看 L2BEAT 的阶段评级'],
  ['证明者单点', '只有官方证明者时，它停机，提款就停', '开放证明者、证明者市场、超时后允许任何人证明'],
  ['与 EVM 的行为差异', '类型 3/4 中部分操作码、预编译、Gas 计量不同', '在目标链上完整测试，不假设“部署到 L1 能跑就一定能跑”'],
  ['密码学假设', 'SNARK 包装依赖椭圆曲线，不抗量子；可信设置依赖 1-of-N', '关注项目的证明系统路线图和以太坊 128 位安全目标']
])}

${tryit(`<p><strong>动手练习：</strong>在区块浏览器和 L2BEAT 上，亲眼看一个 ZK Rollup 的“提交—证明—执行”。</p>
${steps([
  '打开 L2BEAT，进入 ZKsync Era（或 Scroll、Linea）的项目页，找到 “Proof system” 和 “Upgrades & Governance” 两部分，记下：用的是什么证明系统、验证合约地址、升级权限由谁持有、有无时间锁。',
  '在 Etherscan 打开该项目的 L1 Rollup 合约（地址见 L2BEAT 或官方文档），进入交易列表。找到函数名为 commitBatches / proveBatches / executeBatches（或项目自己的等价名称）的交易。',
  '对比同一批次的提交时间和证明时间，算出“提交到证明”的间隔。',
  '打开一笔证明交易，看 Gas Used。它通常在几十万 Gas 量级，和批次里的交易数无关。',
  '选做：打开 ethproofs.org，查看不同 zkVM 证明以太坊 L1 区块的耗时和成本。'
])}
<p>预期结果：你能说出这个 Rollup 的“证明延迟”、单次验证 Gas，以及谁能绕过证明升级合约。</p>`)}

${exercises([
  ['ZK Rollup 的电路如果不检查“执行的交易 = 发布到 L1 的数据”，会出现什么问题？', '<p>排序器可以执行一批交易并给出正确证明，却在 L1 发布另一批数据（或不完整数据）。其他人无法用 L1 数据重建状态，等于发生了数据扣留，用户无法自证余额、无法强制退出。所以数据承诺必须是证明的公开输入。</p>'],
  ['一个团队说他们是“类型 1 zkEVM，完全兼容”，你会用哪三个问题核实？', '<p>① 状态树是否仍是以太坊的 Merkle Patricia Trie + Keccak？② 所有预编译（包括 BN254 配对、modexp、KZG 点评估）是否都被证明？③ 能否直接证明以太坊主网区块并公开结果（例如在 ethproofs 上）？任何一项答“否”，就不是类型 1。</p>'],
  ['按第 5 节的模型，如果 Gas 价格从 5 gwei 涨到 50 gwei，5,000 笔交易批次的每笔成本变成多少？', '<p>验证成本变为 0.015 ETH = 45 美元；总成本 45.8 美元；每笔约 0.00916 美元。验证 Gas 价格对 ZK Rollup 成本影响很大，所以项目会根据 L1 Gas 价格动态调整批次大小或聚合多个批次的证明。</p>'],
  ['证明者市场能否替代 Rollup 的去中心化排序器？', '<p>不能。证明者市场解决“谁来生成证明”，只影响活性和成本；排序器决定“交易顺序和是否纳入”，影响审查和 MEV。两者是不同的去中心化问题。</p>']
])}
${checklist([
  '能列出 ZK Rollup 证明的公开输入，并解释为什么数据承诺必须在其中。',
  '能画出“提交—证明—执行”三阶段的时序图。',
  '能用 zkEVM 类型 1–4 定位一个项目，并说出它的兼容性代价。',
  '能估算一个批次的证明成本和每笔交易的分摊。',
  '能在 L2BEAT 和 Etherscan 上找到一个 ZK Rollup 的验证合约和升级权限。'
])}
${mistakes([
  ['ZK Rollup 没有任何信任假设。', '验证合约可升级、安全委员会、单一证明者都是信任假设；电路漏洞也会让错误状态通过。'],
  ['所有 zkEVM 都和以太坊 100% 兼容。', '类型 2–4 都有不同程度的差异，类型 4 甚至不证明 EVM 字节码。'],
  ['Starknet 是 zkEVM。', 'Starknet 用 Cairo 虚拟机，不执行 EVM 字节码；它是 ZK Rollup，但不是 zkEVM。'],
  ['交易越少，ZK Rollup 越便宜。', '验证成本固定，交易越少每笔分摊越高。'],
  ['证明者市场让 Rollup 更“正确”。', '正确性来自验证合约；市场只改善活性和价格。']
])}
${recap([
  'ZK Rollup 证明“从 S0 执行这批（已发布的）交易得到 S1”；数据承诺必须是公开输入。',
  '典型 L1 流程是提交 → 证明 → 执行；验证合约读取已提交的批次作为公开输入。',
  'zkEVM 类型 1–4：越接近 1 越兼容、证明越慢；越接近 4 越快、差异越大。',
  '主要项目：ZKsync Era（2023-03）、Linea（2023-07）、Scroll（2023-10）、Starknet（Cairo + STARK）；Polygon zkEVM 已于 2026-07 停运。',
  '实时证明已在 2025 年达到以太坊基金会的延迟目标，重点转向安全性；证明者市场改善活性和成本，不改变可靠性来源。'
])}
${quiz([
  { q: '哪一项<strong>不</strong>应该是 ZK Rollup 证明的公开输入？', o: ['旧状态根', '新状态根', '每笔交易的完整执行轨迹', '交易数据的承诺'], a: 2, why: '执行轨迹是见证，只有证明者需要；它很大，也不需要公开。前三项是验证者必须看到、用来绑定 L1 状态和数据的公开输入。' },
  { q: '按 Vitalik 的分类，“把 Solidity 编译到 ZK 友好语言、不证明 EVM 字节码”属于哪一类？', o: ['类型 1', '类型 2', '类型 3', '类型 4'], a: 3, why: '类型 4 是“高级语言等价”，证明最快但兼容性最差。' },
  { q: '关于 Starknet，哪一项正确？', o: ['它是类型 1 zkEVM', '它的合约用 Cairo 编写，使用 STARK 证明', '它是乐观 Rollup', '它不需要证明'], a: 1, why: 'Starknet 用 Cairo 和 STARK，不执行 EVM 字节码。' },
  { q: '一个批次的验证成本固定 4.5 美元，证明成本每笔 0.0002 美元。批次从 5,000 笔降到 100 笔，每笔成本大约变成？', o: ['几乎不变', '约 0.045 美元', '约 0.45 美元', '约 0.0009 美元'], a: 1, why: '4.5 / 100 + 0.0002 ≈ 0.045 美元，验证成本的分摊占主导。' },
  { q: '证明者市场主要改善什么？', o: ['证明生成的活性和价格', '证明的可靠性', '交易排序的公平性', 'EVM 兼容性'], a: 0, why: '可靠性来自验证合约；市场让更多证明者竞争，提高按时拿到证明的概率并压低价格。交易排序是排序器的问题。' }
])}
${terms([
  ['zkEVM', 'zkEVM', '能为 EVM 执行生成有效性证明的电路或虚拟机。'],
  ['有效性证明', 'Validity proof', '证明新状态根由旧状态根和一批交易正确计算得出的 SNARK/STARK 证明。'],
  ['状态转换', 'State transition', '从旧状态执行一批交易得到新状态的过程。'],
  ['zkEVM 类型', 'zkEVM types 1–4', 'Vitalik 提出的按以太坊兼容程度划分的分类。'],
  ['实时证明', 'Real-time proving', '在一个 slot 内为一个 L1 区块生成证明的能力。'],
  ['证明者市场', 'Prover market', '应用提交证明请求、独立证明者竞争完成并获得报酬的网络。'],
  ['多证明系统', 'Multi-proof', '用多个独立的证明系统同时证明同一状态转换，降低单个实现漏洞的风险。'],
  ['Cairo', 'Cairo', 'Starknet 使用的编写可证明程序的语言。']
])}
` });

})();
