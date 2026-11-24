/* ---------- M04 子文章（三）---------- */
(() => {
CUR = 'm05-7';
addCh({ id: 'm05-7', nav: 'MEV', title: 'M04.7 MEV：交易排序里的隐形税', desc: 'MEV 从哪来、三明治怎么夹你、PBS 与私有交易池怎么防。', html: `
<h1>M04.7 MEV：交易排序里的隐形税</h1>
${meta(['列出 MEV 的四种主要来源，并用恒定乘积公式逐步算出一次三明治攻击。', '画出 PBS / MEV-Boost 的完整流程：搜索者 → 构建者 → 中继 → 提议者。', '为钱包、DApp 或交易后端设计 MEV 防护：滑点、私有交易池、订单流拍卖、批量拍卖。'], '<a href="#m05-2">M04.2 以太坊架构</a>、<a href="#m02">M02 智能合约开发</a>、<a href="#m13">M08 DeFi 协议</a>（AMM 部分）', ['sandwich'])}
${beginner(`<p><strong>内存池（Mempool）</strong>：节点里“已广播、还没上链”的交易等候区。公开内存池里的交易，任何人都能看到。</p>
<p><strong>滑点容忍度（Slippage Tolerance）</strong>：你在 DEX 下单时允许的“最差成交价”和报价的偏离比例。超过它，交易自动失败（revert）。</p>
<p><strong>抢跑（Front-running）</strong>：看到别人的交易后，抢先把自己的交易排在它前面。</p>
<p><strong>搜索者（Searcher）</strong>：写程序寻找 MEV 机会的人或机器人。</p>
<p><strong>构建者（Builder）</strong>：把交易排序、打包成完整区块的专业角色。<strong>提议者（Proposer）</strong>：本 slot 被选中出块的验证者。</p>`)}

<h2>1. 一句话理解</h2>
${one('谁能决定区块里交易的顺序，谁就能从顺序中赚钱。MEV（Maximal Extractable Value，最大可提取价值）就是这部分“排序收益”。')}
${call('analogy', `<p>想象一个只有一个窗口的二手车拍卖行。你在门口大声说：“我要以不高于 31 万的价格买那辆车。”一个黄牛听到后，抢先 30 万买下，再 30.9 万卖给你。你仍在你的上限之内，所以你“同意”了这笔交易，但你多付了 9 千。</p>
<p>类比的局限：现实中黄牛要承担持有风险；链上三明治在<strong>同一个区块里原子完成</strong>，攻击者几乎没有价格风险，只要排序权在手。</p>`)}
${art('一图看懂：公开内存池里的 swap 会被夹击，私有通道能避开', 660, 300, [
  S.zone(6, 10, 648, 124, { t: '攻击路径：交易公开，排序被别人决定', k: 'risk' }),
  S.zone(6, 146, 648, 124, { t: '防护路径：交易不进公开内存池', k: 'ok' }),
  S.box(16, 54, 120, 66, { k: 'info', icon: 'person', t: '你的 swap', s: '3 万 USDC' }),
  S.box(166, 54, 140, 66, { k: 'risk', icon: 'eye', t: '公开内存池', s: '所有人可见' }),
  S.box(336, 54, 150, 66, { k: 'risk', icon: 'bot', t: '机器人夹击', s: '前买 15,000 USDC\n你之后再卖出', ss: 11.5 }),
  S.box(516, 54, 130, 66, { k: 'risk', t: '你少拿约 293 USDC', s: '机器人毛利约 299', ss: 11.5 }),
  S.box(16, 190, 120, 66, { k: 'info', icon: 'person', t: '你的 swap', s: '3 万 USDC' }),
  S.box(166, 190, 140, 66, { k: 'ok', icon: 'lock', t: '私有 RPC', s: '需信任通道运营方', ss: 11.5 }),
  S.box(336, 190, 150, 66, { k: 'ok', icon: 'block', t: '构建者直接打包', s: '没人能提前看到' }),
  S.box(516, 190, 130, 66, { k: 'ok', t: '按报价成交', s: '得到 9.9010 ETH', mono: 1 }),
  S.arrow(138, 87, 164, 87),
  S.arrow(308, 87, 334, 87),
  S.arrow(488, 87, 514, 87),
  S.arrow(138, 223, 164, 223),
  S.arrow(308, 223, 334, 223),
  S.arrow(488, 223, 514, 223),
  S.text(330, 290, '示例：池子 1,000 ETH / 3,000,000 USDC，滑点 1%，不含手续费', { size: 12, dim: 1, anchor: 'middle', mw: 620 })
], [
  ['flow', '上面一行是攻击者看到你的交易再夹击；下面一行是交易直送构建者，没有人能插队。'],
  ['key', 'MEV 成立要两个条件：交易上链前被人看到，并且别人能决定顺序；去掉任何一个，三明治做不成。'],
  ['risk', '你的滑点容忍度就是机器人能拿走的上限：滑点 1% 时最多损失约 1% 成交额。'],
  ['limit', '私有通道不是万能：要信任运营方不泄露、不自己抢跑。']
], '上方是攻击路径：用户交易进入公开内存池，被机器人前后夹击；下方是防护路径：经私有 RPC 直接交给构建者，按原报价成交', 'm05-7')}

<h2>2. MEV 从哪来：四种主要来源</h2>
<p>MEV 最早叫“矿工可提取价值（Miner Extractable Value）”。以太坊转为 PoS 后，出块者变成验证者，名字改为“最大可提取价值”。MEV 的根源只有一条：<strong>区块内交易顺序可以被出块方任意决定，而 DeFi 交易的结果依赖顺序。</strong></p>
${tbl(['类型', '怎么赚钱', '对用户是好是坏'], [
  ['套利（Arbitrage）', '同一资产在两个 DEX 价格不同：在便宜处买、贵处卖。常用“尾随（back-run）”：紧跟一笔大额交易之后修复价格。', '中性偏好：让各池价格保持一致'],
  ['清算（Liquidation）', '借贷协议中抵押率跌破阈值的仓位可被清算，清算人获得奖励（例如 5%–10% 折扣）。机器人抢着第一个清算。', '必要：保证协议不坏账'],
  ['三明治（Sandwich）', '在受害者买单前先买、之后卖，利用受害者推高的价格获利。', '有害：直接从用户身上抽取'],
  ['JIT 流动性（Just-In-Time）', '在 Uniswap v3 这类集中流动性池中，看到大额交易后在同一区块内：先加入极窄区间流动性 → 大额交易成交 → 立刻撤出，赚走大部分手续费。', '对交易者中性，对普通 LP 有害：手续费被抢'],
  ['其他', 'NFT 抢铸、预言机更新尾随、跨域（CEX-DEX）套利、长尾 token 狙击。', '视情况']
])}
${mm('MEV 的产生路径：从你的交易到别人的利润', `
flowchart LR
  U["用户签名 swap 交易"] --> PM["公开内存池<br/>所有人可见"]
  PM --> S["搜索者机器人<br/>模拟每笔待上链交易"]
  S -->|"发现机会"| BUN["交易包 Bundle<br/>前置交易 + 用户交易 + 后置交易"]
  BUN --> B["构建者<br/>拼出价值最高的区块"]
  B --> P["提议者签名出块"]
  P --> C[("区块上链<br/>利润按出价分配")]
  U -.->|"私有通道"| PRIV["私有 RPC<br/>不进入公开内存池"]
  PRIV --> B
`, [
  ['flow', '交易进入公开内存池后，搜索者用本地 EVM 模拟它对池子价格的影响，然后打包成 bundle 交给构建者。'],
  ['key', 'MEV 存在的前提是“交易在上链前被别人看到，且别人能决定顺序”。去掉任一条件，三明治就做不成。'],
  ['risk', '用户的损失 = 搜索者利润 + 支付给构建者/提议者的费用 + Gas。三方都在分你多付的钱。'],
  ['limit', '私有通道（虚线）能挡住三明治，但你要信任通道运营方不泄露、不自己抢跑。']
])}

<h2>3. 三明治攻击：逐步算一遍</h2>
<p>我们用恒定乘积 AMM（x·y = k）。手续费设为 0，方便看清机制（真实池子有 0.3% 手续费，攻击者利润会略少）。</p>
${call('info', `<p><strong>算一算（示例）</strong>：池子有 1,000 ETH 和 3,000,000 USDC，k = 3×10⁹，现价 3,000 USDC/ETH。你要用 30,000 USDC 买 ETH，滑点容忍度 1%。</p>`)}
${steps([
  '<strong>无攻击时你能拿到多少</strong>：新 USDC 储备 = 3,030,000；新 ETH 储备 = 3×10⁹ ÷ 3,030,000 = 990.0990；你得到 1,000 − 990.0990 = <strong>9.9010 ETH</strong>。这就是前端给你的报价。',
  '<strong>你的最低接受量</strong>：9.9010 × (1 − 1%) = <strong>9.8020 ETH</strong>。合约里写成 <code>amountOutMin = 9.8020 ETH</code>。',
  '<strong>第 1 步 机器人先买</strong>：机器人投入 15,000 USDC。USDC 储备 = 3,015,000；ETH 储备 = 3×10⁹ ÷ 3,015,000 = 995.0249；机器人得到 <strong>4.9751 ETH</strong>。价格变为 3,015,000 ÷ 995.0249 ≈ <strong>3,030.08</strong>。',
  '<strong>第 2 步 你的买单成交</strong>：USDC 储备 = 3,045,000；ETH 储备 = 3×10⁹ ÷ 3,045,000 = 985.2217；你得到 995.0249 − 985.2217 = <strong>9.8032 ETH</strong>。9.8032 ≥ 9.8020，交易<strong>没有失败</strong>。价格变为 ≈ <strong>3,090.68</strong>。',
  '<strong>第 3 步 机器人卖出</strong>：机器人卖回 4.9751 ETH。ETH 储备 = 990.1968；USDC 储备 = 3×10⁹ ÷ 990.1968 = 3,029,700.76；机器人得到 3,045,000 − 3,029,700.76 = <strong>15,299.24 USDC</strong>。价格回到 ≈ <strong>3,059.70</strong>。',
  '<strong>结算</strong>：机器人毛利 = 15,299.24 − 15,000 = <strong>299.24 USDC</strong>。扣掉两笔交易的 Gas 和给构建者的小费（示例合计 40 USDC），净利约 259 USDC。你少拿 9.9010 − 9.8032 = <strong>0.0978 ETH</strong>，约 293 USDC。'
])}
<p>规律：机器人会把前置金额<strong>推到恰好让你的交易不失败的边界</strong>。你的滑点容忍度就是机器人能拿走的上限。滑点 1% 时，你最多损失约 1% 的成交额；滑点 5% 时，最多损失约 5%。</p>
<p><strong>先做什么</strong>：在下面的实验里保持默认（池子 1,000 ETH、买单 30,000 USDC、滑点 1%），核对上面的数字。<strong>再观察什么</strong>：① 把滑点拉到 5%，看机器人利润放大几倍；② 把滑点拉到 0.1%，看利润是否低于 Gas 成本、攻击是否“不划算”；③ 打开“使用私有交易池”，确认三步执行消失。</p>
${lab('sandwich')}
<p>做完实验你应该发现：滑点不是越小越好。滑点太小，正常的价格波动（别人的交易先成交）也会让你的交易失败，你白付 Gas。实务上：主流大池子用 0.1%–0.5%；小池子或波动大的 token 才放宽，同时必须配合私有交易池。</p>

<h2>4. PBS 与 MEV-Boost：MEV 的“产业链”</h2>
<p>如果每个验证者都自己寻找 MEV，大机构凭技术优势会赚得更多，导致质押越来越集中。为此以太坊社区推出 <strong>PBS（Proposer-Builder Separation，提议者-构建者分离）</strong>：提议者只负责“选最高出价的区块并签名”，构建区块的复杂工作交给专业构建者。目前 PBS 由协议外的中间件 <strong>MEV-Boost</strong>（Flashbots 开发，2022 年 The Merge 起运行）实现；协议内 PBS（ePBS，EIP-7732）仍在研究和推进中。公开研究估算，2023 年 10 月到 2024 年 3 月约 90% 的以太坊区块经由 MEV-Boost 产生，而且少数几家构建者产出了大部分区块。${cite('arXiv：Who Wins Ethereum Block Building Auctions and Why?', 'https://arxiv.org/abs/2407.13931')}</p>
${mm('MEV-Boost 一个 slot 内的调用链', `
sequenceDiagram
  participant SR as 搜索者
  participant BD as 构建者
  participant RL as 中继 Relay
  participant MB as MEV-Boost
  participant PR as 提议者 验证者
  SR->>BD: 提交 bundle 和出价
  BD->>BD: 合并公开交易与 bundle 拼出最优区块
  BD->>RL: 提交完整区块与给提议者的报价
  RL->>RL: 校验区块有效与报价真实
  PR->>MB: 轮到我出块 请求区块头
  MB->>RL: 向多个中继询价
  RL-->>MB: 返回最高报价的区块头 不含交易内容
  MB-->>PR: 选出最高报价
  PR->>RL: 对区块头签名 盲签
  RL-->>PR: 公开完整区块并广播
`, [
  ['flow', '搜索者 → 构建者 → 中继 → 提议者。每一层通过竞价把大部分 MEV 往下一层传递，最终多数利润流向提议者（质押者）。'],
  ['key', '提议者签的是“区块头”，签名前看不到交易内容（盲签）。这防止提议者偷看并窃取构建者的 MEV 策略。'],
  ['risk', '中继是被信任的第三方：提议者信任它会公开区块，构建者信任它不偷策略。中继故障会导致提议者错过出块。'],
  ['fail', '如果所有中继都无响应，MEV-Boost 会回退到验证者本地构建区块，链不会停。'],
  ['limit', '少数几家构建者产出了大部分区块，构建者市场高度集中，可能被用来审查交易。']
])}
${tbl(['角色', '收入来源', '主要风险'], [
  ['搜索者', 'MEV 机会利润减去出价', '激烈竞争，利润大部分被出价拿走'],
  ['构建者', 'bundle 出价 + 优先费 − 付给提议者的报价', '需要独家订单流才能赢'],
  ['中继', '通常不直接收费（公共物品）', '运维成本、法律合规压力'],
  ['提议者', '中继报价（MEV 收入）+ 共识奖励', '依赖中继诚实；选择中继涉及审查问题']
])}

<h2>5. 防护：用户、钱包、协议三层</h2>
<h3>5.1 私有交易池与订单流拍卖</h3>
<p><strong>私有交易池（Private Mempool / Private RPC）</strong>把交易直接发给构建者，不进入公开内存池。常见服务：<strong>Flashbots Protect</strong>（RPC 地址 <code>https://rpc.flashbots.net</code>）、<strong>MEV Blocker</strong>（CoW 等团队 2023 年推出）。</p>
<p><strong>订单流拍卖（OFA, Order Flow Auction）</strong>更进一步：私有通道允许搜索者对你的交易做“尾随套利”（无害），但必须竞价，把大部分收益作为 <strong>MEV 回扣（MEV Rebate）</strong>返还给你。Flashbots 的 MEV-Share 和 MEV Blocker 都采用这种思路。</p>
${code('TYPESCRIPT', `
// 用 viem 通过 Flashbots Protect 私有 RPC 发送 swap，避免进入公开内存池
import { createWalletClient, http, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.PK as \`0x\${string}\`);
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http('https://rpc.flashbots.net'), // 私有通道：交易只交给构建者
});

// minOut 一定要用链上实时报价计算，不要写死
function minOut(quote: bigint, slippageBps: bigint): bigint {
  return quote * (10000n - slippageBps) / 10000n; // 50 bps = 0.5%
}

const quote = parseUnits('9.9010', 18);
console.log('amountOutMin =', minOut(quote, 50n));
// await client.writeContract({ address: ROUTER, abi, functionName: 'swapExactTokensForTokens',
//   args: [amountIn, minOut(quote, 50n), path, account.address, deadline] });
`)}
${call('warn', `<p>私有通道不是万能的：① 交易如果长时间没被打包，一些服务会在超时后<strong>回退到公开内存池</strong>，要看清服务条款；② 你必须信任运营方；③ 设置了 99% 滑点的交易，进了私有池也可能被其他方式利用。滑点上限永远是最后一道防线。</p>`)}
<p>用可信执行环境（TEE）降低对构建者信任的尝试（SUAVE、BuilderNet）见 <a href="#m10-6">M06.6 MPC、FHE 与 TEE</a>。</p>
<h3>5.2 应用层防护</h3>
${tbl(['手段', '原理', '代表'], [
  ['合理的 amountOutMin + deadline', '限制最差成交价和有效期，过期交易作废', 'Uniswap Router 参数'],
  ['批量拍卖（Batch Auction）', '一段时间内的订单统一结算，同一批次内所有人成交价相同，排序不再有意义；还能让买卖双方直接撮合（CoW，需求巧合）', 'CoW Protocol'],
  ['意图（Intent）', '用户只签“我想用 X 换至少 Y”，由求解者（Solver）竞争执行，求解者承担 MEV 风险', 'UniswapX、CoW、1inch Fusion'],
  ['拆单 / TWAP', '把大单拆成多笔小单，每笔价格影响小，夹的利润低于 Gas', '聚合器 TWAP 订单'],
  ['预言机价格校验', '成交价偏离预言机价格过多时拒绝', '协议自定义检查']
])}
<h3>5.3 MEV 对各方的影响</h3>
${tbl(['对象', '负面影响', '正面/中性影响'], [
  ['普通用户', '被三明治、成交价变差；Gas 竞价抬高费用', '套利让各 DEX 价格一致'],
  ['验证者', 'MEV 收入不均，激励中心化', 'MEV-Boost 让独立验证者也能拿到 MEV 收入'],
  ['协议', 'LP 被 JIT 抢手续费；被套利者“刮”走价值（LVR）', '清算机器人保证借贷协议偿付能力'],
  ['以太坊整体', '构建者和中继集中，有审查风险', 'PBS 把复杂度移出验证者']
])}
${tryit(`<p>① 打开 <a href="https://eigenphi.io" target="_blank" rel="noopener">EigenPhi</a> 或 libMEV 这类 MEV 数据网站，找一笔最近的“Sandwich”记录。② 记下三笔交易（前置、受害者、后置）在同一区块内的位置序号，确认它们相邻。③ 在 Etherscan 打开受害者交易，查看 Input Data 中的 <code>amountOutMin</code>，用实际成交量计算他设置的滑点。预期结果：受害者实际得到的数量非常接近 amountOutMin。④ 在你的钱包（例如 MetaMask）里添加一个自定义网络，RPC 填 Flashbots Protect，以后的 swap 走私有通道。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['默认滑点 ≤ 0.5%，大于 2% 弹窗二次确认', '滑点就是被夹上限', '前端单测：设置 5% 必须出现警告'],
  ['后端交易默认走私有 RPC', '避免策略和订单被抢跑', '抓包确认未发往公开节点；对比 txpool'],
  ['amountOutMin 由服务端实时报价计算', '写死或用缓存报价会失效或被夹', '注入过期报价，交易应失败'],
  ['设置 deadline（例如 now + 120 秒）', '防止交易被扣住到价格最差时再打包', '模拟延迟上链，交易 revert'],
  ['监控实际成交价 vs 报价偏差', '发现被夹的交易', '指标 swap_execution_shortfall_bps，P95 > 30 bps 告警（示例）']
])}

${mistakes([
  ['滑点设得越大，交易越容易成功，所以越大越好', '滑点越大，机器人能抽走的越多。三明治会把你推到滑点边界。'],
  ['MEV 都是坏的', '套利和清算维持价格一致和协议偿付能力。有害的主要是三明治这类直接从用户身上抽取的形式。'],
  ['用了私有 RPC 就不需要滑点保护', '私有通道可能回退到公开池，运营方也需要信任。amountOutMin 是合约层的硬保证。'],
  ['MEV-Boost 是以太坊协议的一部分', 'MEV-Boost 是验证者自愿运行的协议外中间件。协议内 PBS（ePBS）仍在推进中。']
])}
${recap([
  'MEV 来自“交易可见 + 顺序可控”，主要形态：套利、清算、三明治、JIT 流动性。',
  '三明治攻击：机器人买 → 你买 → 机器人卖，机器人把你推到滑点边界。',
  'PBS / MEV-Boost：搜索者 → 构建者 → 中继 → 提议者，提议者盲签区块头。',
  '用户防护：合理滑点 + deadline + 私有交易池；进阶用订单流拍卖拿回扣。',
  '协议防护：批量拍卖、意图与求解者、拆单、预言机校验。'
])}
${quiz([
  { q: '池子 1,000 ETH / 3,000,000 USDC（无手续费）。不受攻击时 30,000 USDC 能买到约多少 ETH？', o: ['10.000 ETH', '9.9010 ETH', '9.8020 ETH', '9.0909 ETH'], a: 1, why: '3×10⁹ ÷ 3,030,000 = 990.099，1,000 − 990.099 = 9.9010。10 ETH 忽略了价格影响；9.8020 是 1% 滑点下的最低接受量。' },
  { q: '在 MEV-Boost 流程中，提议者签名时能看到什么？', o: ['完整交易列表', '搜索者的 bundle', '构建者私钥', '只有区块头和报价'], a: 3, why: '提议者盲签区块头，签名后中继才公开完整区块。这样提议者无法窃取构建者的排序策略。' },
  { q: '下面哪种 MEV 通常被认为对 DeFi 有益？', o: ['清算', '三明治', '抢跑 NFT 铸造', 'JIT 抢 LP 手续费'], a: 0, why: '清算保证借贷协议不出现坏账。三明治直接伤害用户；JIT 抢走普通 LP 的手续费。' },
  { q: 'CoW Protocol 的批量拍卖为什么能抵御三明治？', o: ['它把交易加密', '它不收手续费', '同一批次内同一交易对成交价统一，排序不影响价格', '它只在 L2 上运行'], a: 2, why: '统一清算价意味着在批次内“插队”拿不到更好价格，三明治失去意义。' }
])}
${exercises([["计算题（示例）：池子有 1,000 ETH 和 3,000,000 USDC（无手续费）。你用 60,000 USDC 买 ETH，滑点 2%。机器人先投入 30,000 USDC 买入，你的交易会失败吗？机器人毛利多少？", "<p>无攻击时你得到 1,000 − 3×10⁹ ÷ 3,060,000 ≈ 19.6078 ETH，最低接受量 ≈ 19.2157 ETH。</p><p>机器人先买：ETH 储备变为 990.0990，机器人得到 9.9010 ETH。你成交后 ETH 储备变为 970.8738，你得到 ≈ 19.2252 ETH，仍不低于 19.2157，交易<strong>不会失败</strong>。</p><p>机器人卖回 9.9010 ETH，得到约 31,193.77 USDC，毛利约 <strong>1,193.77 USDC</strong>。你少拿约 0.3826 ETH，约 1,148 USDC。滑点越大，机器人能拿走的越多。</p>"], ["思考题：JIT 流动性对交易者和普通 LP 分别有什么影响？为什么？", "<p>JIT 机器人在大额交易前加入极窄区间的流动性，交易成交后立刻撤出。</p><p>对交易者基本中性，因为成交照常进行。对普通 LP 有害，因为这笔大额交易的大部分手续费被机器人赚走了。</p>"], ["设计题：为交易后端设计一个“被夹检测”监控指标和告警规则。", "<p>指标示例：<code>swap_execution_shortfall_bps</code> = (报价数量 − 实际成交数量) ÷ 报价数量 × 10,000。</p><p>告警示例：P95 大于 30 bps 时告警。配合默认滑点不超过 0.5%、后端交易走私有 RPC、<code>amountOutMin</code> 由服务端实时报价计算，可以及时发现被夹的交易。</p>"]])}
${checklist(["能列出套利、清算、三明治、JIT 流动性四种 MEV 来源，并判断各自对用户是好是坏。", "能用 x·y = k 逐步算出一次三明治攻击中受害者的损失和机器人的毛利。", "能画出搜索者、构建者、中继、提议者的 MEV-Boost 调用链，并解释盲签。", "能按 bps 计算 amountOutMin，并为交易设置 deadline。", "在钱包里添加过私有 RPC，并能说出私有交易池的局限。"])}
${terms([
  ['最大可提取价值', 'MEV, Maximal Extractable Value', '出块方通过安排区块内交易顺序获得的额外收益'],
  ['三明治攻击', 'Sandwich Attack', '在受害者交易前后各插一笔交易，利用其价格影响获利'],
  ['JIT 流动性', 'Just-In-Time Liquidity', '在大额交易前加入、交易后撤出的集中流动性，用来抢手续费'],
  ['提议者-构建者分离', 'PBS, Proposer-Builder Separation', '让专业构建者造区块、提议者只选最高出价区块的设计'],
  ['中继', 'Relay', 'MEV-Boost 中连接构建者与提议者、托管区块内容的可信中间方'],
  ['交易包', 'Bundle', '搜索者提交的、需按顺序原子执行的一组交易'],
  ['私有交易池', 'Private Mempool', '把交易直接交给构建者、不公开广播的通道'],
  ['订单流拍卖', 'OFA, Order Flow Auction', '让搜索者竞价获得用户订单的执行权，并把收益返还用户'],
  ['意图', 'Intent', '用户只声明期望结果，由求解者竞争完成执行的交易方式']
])}
` });

CUR = 'm05-8';
addCh({ id: 'm05-8', nav: '跨链桥', title: 'M05.11 跨链桥：验证模型、资产模型与重大事故', desc: '四种验证模型、三种资产模型、三大桥事故因果链与集成清单。', html: `
<h1>M05.11 跨链桥：验证模型、资产模型与重大事故</h1>
${meta(['说清“链 B 怎么知道链 A 上发生了什么”，并比较多签/MPC、乐观、轻客户端、ZK 四种验证模型。', '区分锁定-铸造、销毁-释放、流动性网络三种资产模型及各自风险。', '复盘 Ronin、Wormhole、Nomad 三起事故，并写出一份桥接集成的工程与风险清单。'], '<a href="#m05-4">M04.4 扩容路线</a>、<a href="#m05-5">M04.5 Rollup 深入</a>')}
${beginner(`<p><strong>跨链（Cross-chain）</strong>：把资产或消息从一条区块链转到另一条。两条链互相看不见对方的状态。</p>
<p><strong>包装资产（Wrapped Asset）</strong>：链 B 上发行的“欠条”代币，承诺 1:1 兑换链 A 上锁定的原生资产，例如以太坊上的 WBTC。</p>
<p><strong>轻客户端（Light Client）</strong>：只下载区块头、用密码学证明验证数据的节点，比全节点轻得多。</p>
<p><strong>多签（Multisig）/ MPC</strong>：需要 N 个签名者中至少 M 个同意才能执行操作。详见 <a href="#m03">M09 钱包</a>。</p>
<p><strong>中继者（Relayer）</strong>：在两条链之间搬运消息和证明的链下程序。</p>`)}

<h2>1. 一句话理解</h2>
${one('区块链之间不能直接通信。跨链桥的本质是一个“见证人”：它告诉链 B“链 A 上确实发生了某件事”。桥有多安全，取决于这个见证人有多可信。')}
${call('analogy', `<p>你在上海的银行存了 100 万，想在纽约用。银行不会把现金空运过去，而是让纽约分行“相信”上海分行的记账，给你开同等额度。跨链桥就是这条“分行之间的信任链路”：可以是几个经理签字（多签），可以是公示期内没人反对就生效（乐观），也可以是纽约分行自己核对上海的账本（轻客户端）。</p>
<p>类比的局限：银行有法律和央行兜底；跨链桥被攻破后，通常没有任何人兜底，包装资产可能直接归零。</p>`)}
${art('一图看懂：跨链桥 = 链 A 锁定资产，见证人作证，链 B 铸造包装资产', 660, 326, [
  S.zone(10, 14, 190, 210, { t: '链 A（源链）' }),
  S.zone(460, 14, 190, 210, { t: '链 B（目标链）' }),
  S.box(25, 56, 160, 56, { k: 'info', icon: 'person', t: '用户', s: '存入 100 ETH' }),
  S.box(25, 148, 160, 62, { k: 'warn', icon: 'lock', t: '锁仓合约', s: '100 ETH 被锁住' }),
  S.box(245, 70, 170, 100, { k: 'key', icon: 'eye', t: '见证人（验证层）', s: '告诉链 B：\n确实锁了 100 ETH', ss: 11.5 }),
  S.box(475, 56, 160, 56, { k: 'info', icon: 'code', t: '铸造合约', s: '收到证明才铸造' }),
  S.box(475, 148, 160, 62, { k: 'ok', icon: 'coin', t: '100 个 wETH', s: '包装资产' }),
  S.arrow(105, 114, 105, 146),
  S.arrow(187, 176, 243, 140, { label: '事件' }),
  S.arrow(417, 120, 473, 90, { k: 'key', label: '证明' }),
  S.arrow(555, 114, 555, 146),
  S.text(330, 192, '多签 · 乐观 · 轻客户端 · ZK', { size: 12, dim: 1, anchor: 'middle' }),
  S.route([[555, 212], [555, 252], [105, 252], [105, 212]], { k: 'risk', dash: 1, label: '1 : 1 兑付：锁仓被盗，wETH 就归零' }),
  S.text(330, 304, '桥有多安全，取决于见证人有多可信：它是最弱的一环', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '链 A 锁资产，见证人把这件事告诉链 B，链 B 才铸造等量的包装资产；回程反过来销毁、释放。'],
  ['key', '四种验证模型只在中间一格不同：多签、乐观、轻客户端、ZK。'],
  ['risk', '锁仓合约里是大笔真金白银，包装资产的价值完全靠它兑付；被攻破时通常没有人兜底。'],
  ['limit', '示例数字只说明比例；真实桥还有链下组件和消息编码，环节比单链协议多。']
], '用户在链 A 的锁仓合约锁定 ETH，见证人向链 B 证明此事，链 B 的铸造合约铸造等量包装资产，包装资产靠锁仓兑付', 'm05-8')}

<h2>2. 为什么需要跨链，为什么它最危险</h2>
<p>多链格局下，用户资产分散在以太坊、各 L2、Solana、BNB Chain 等链上（见 <a href="#m05-1">M04.1 公链全景</a>）。用户需要把资产转到手续费低或机会多的链；协议需要跨链治理、跨链消息和统一流动性。</p>
<p>但桥合约里锁着大量资产，同时依赖链下组件、多条链的合约和复杂的消息编码。历史上加密行业单次损失最大的攻击中，桥占了很大比例。原因：<strong>桥的安全 = 最弱一环的安全</strong>，而它的环节比任何单链协议都多。</p>

<h2>3. 四种验证模型</h2>
${mm('四种验证模型：谁来证明“链 A 发生了这件事”', `
flowchart TB
  EV["链 A 事件<br/>用户锁定 100 ETH"] --> M1["外部验证：多签 / MPC<br/>M of N 签名者签字"]
  EV --> M2["乐观验证<br/>中继提交 + 挑战期"]
  EV --> M3["轻客户端验证<br/>链 B 合约校验链 A 区块头和共识签名"]
  EV --> M4["ZK 验证<br/>链下生成共识证明 链 B 合约验证"]
  M1 --> TB["链 B 执行<br/>铸造 / 释放 / 调用"]
  M2 --> TB
  M3 --> TB
  M4 --> TB
`, [
  ['flow', '四种模型的区别只在中间这一层：链 B 依据什么相信链 A 的事件。'],
  ['risk', '外部验证：拿到 M 把私钥就能伪造任意事件。Ronin 正是这样被攻破。'],
  ['key', '乐观验证只要求“至少一个诚实观察者”在挑战期内报警；轻客户端和 ZK 的信任降到“源链共识本身”。'],
  ['limit', '轻客户端在异构链上很贵（要在链 B 上验证链 A 的签名算法）；ZK 证明生成成本高、电路本身也可能有漏洞（SNARK 与 STARK 的原理与取舍见 <a href="#m10-2">M06.2 SNARK 与 STARK</a>）。']
])}
${tbl(['模型', '信任假设', '延迟', '成本', '代表'], [
  ['外部验证（多签/MPC/守护者）', 'M of N 签名者中多数诚实且私钥安全', '分钟级', '低', 'Wormhole（19 个守护者，13 个签名生效）、早期 Ronin、Multichain'],
  ['乐观验证', '挑战期内至少 1 个诚实观察者', '30 分钟到数天（挑战期）', '低', 'Nomad、Across（基于 UMA 乐观预言机）、Rollup 官方桥'],
  ['轻客户端', '源链共识诚实 + 实现无漏洞', '源链最终性时间', '同构链低，异构链高', 'IBC（Cosmos）'],
  ['ZK 证明', '源链共识诚实 + 电路与验证合约无漏洞', '证明生成时间（分钟级）', '证明生成高', 'ZK 轻客户端类桥、ZK Rollup 官方桥']
])}
${call('info', `<p>Rollup 的官方桥（L2 → L1 提款）和普通跨链桥不同：它由 L1 合约直接验证 L2 的状态根（欺诈证明或有效性证明），信任来源就是 L1 本身。所以官方桥最安全但最慢，见 <a href="#m05-5">M04.5 Rollup 深入</a>。比特币 L2 与各类 BTC 跨链资产“谁控制被锁的 BTC”的对比见 <a href="#m05-63">M05.7 铭文 Runes 与 L2</a> 第 5 节。</p>`)}

<h2>4. 三种资产模型与跨链消息</h2>
${tbl(['模型', '流程', '风险'], [
  ['锁定-铸造（Lock-Mint）', '链 A 锁定原生资产 → 链 B 铸造包装资产。回程：链 B 销毁 → 链 A 释放', '链 A 的锁仓合约是蜜罐；包装资产可能被无限增发'],
  ['销毁-铸造（Burn-Mint）', '资产发行方在每条链都有铸造权：源链销毁 → 目标链铸造原生版本（如 Circle CCTP 跨链 USDC）', '依赖发行方的签名服务；无包装资产碎片化'],
  ['流动性网络（Liquidity Network）', '目标链上已有做市商/流动性池，直接用原生资产付给用户，事后在源链结算（如 Across、Stargate、Hop）', '快且拿到原生资产；流动性不足时失败；做市商承担结算风险']
])}
<p>任务中的“销毁-释放”就是锁定-铸造的回程：用户在链 B 销毁包装资产，桥在链 A 释放原生资产。</p>
<p><strong>跨链消息协议</strong>把“资产转移”推广为“任意消息”：链 A 的合约可以调用链 B 的合约。</p>
${tbl(['协议', '验证方式（概述）', '特点'], [
  ['LayerZero', 'v2 中应用自选一组 DVN（去中心化验证网络）验证消息，执行器（Executor）在目标链投递', '安全配置由应用决定：选得弱，就弱'],
  ['Wormhole', '19 个守护者（Guardian）观察源链，签发 VAA（已验证动作批准），13/19 签名生效', '覆盖链多，含 Solana 等非 EVM 链'],
  ['Chainlink CCIP', 'Chainlink 预言机网络提交消息，另有独立的风险管理网络监控并可暂停', '内置速率限制，面向机构'],
  ['IBC', '两条链互相运行对方的轻客户端，中继者只搬运数据不被信任', 'Cosmos 生态标准，需要即时最终性的链（详见 <a href="#m05-65">M05.9 Cosmos 与 IBC</a>）']
])}
${mm('一次锁定-铸造跨链的生命周期', `
stateDiagram-v2
  state "源链已锁定" as Locked
  state "等待源链最终性" as Finalizing
  state "验证中" as Verifying
  state "目标链已铸造" as Minted
  state "失败待退款" as Refund
  [*] --> Locked: 用户调用 lock
  Locked --> Finalizing: 事件被观察到
  Finalizing --> Verifying: 达到确认数
  Verifying --> Minted: 签名或证明通过
  Verifying --> Refund: 超时或证明无效
  Finalizing --> Refund: 源链重组 交易消失
  Minted --> [*]
  Refund --> [*]
`, [
  ['flow', '每笔跨链转账都是一个状态机。后端要为每个状态持久化记录，并能从任意状态恢复。'],
  ['fail', '源链发生重组，锁定交易消失，但目标链已铸造，就产生“无锚定的包装资产”。所以必须等源链最终性。'],
  ['risk', '目标链合约若不记录“已处理的消息 ID”，同一消息可被重放，重复铸造。'],
  ['key', '状态机要有超时和退款分支，否则用户资金会永久卡在“验证中”。']
])}

<h3>4.1 接收端的三道检查</h3>
<p>跨链消息协议负责“把消息送到”，但<strong>消息该不该信，由你的接收合约决定</strong>。无论用 LayerZero、CCIP 还是别的协议，接收函数里都要做三道检查：</p>
${mm('接收跨链消息时的三道检查', `
flowchart TB
  IN["消息到达接收合约"] --> C1{"调用者是协议入口吗<br/>Endpoint 或 Router"}
  C1 -->|"否"| X["拒绝"]
  C1 -->|"是"| C2{"源链和源合约在白名单里吗"}
  C2 -->|"否"| X
  C2 -->|"是"| C3{"这条消息处理过吗"}
  C3 -->|"是"| X
  C3 -->|"否"| DO["先标记已处理，再执行业务逻辑"]
`, [
  ['flow', '第一道防“假调用者”，第二道防“假发送者”，第三道防“重放”。'],
  ['fail', '只检查第一道：任何人都可以在源链部署一个自己的合约，向你的接收合约发消息，伪造“已锁定”并让你铸币。'],
  ['risk', '接收函数里做复杂、可能 revert 的逻辑，会让消息卡在“待重试”状态。关键逻辑要简单，失败时要有可恢复的路径。'],
  ['key', '“白名单里的源合约”要由管理员（多签 + 时间锁）维护，修改它等同于改变信任根。']
])}
${tbl(['检查项', 'LayerZero v2（OApp）', 'Chainlink CCIP（CCIPReceiver）'], [
  ['谁能调用', '只有 Endpoint 能调用 <code>lzReceive</code>，内部转给 <code>_lzReceive</code>', '只有 Router 能调用 <code>ccipReceive</code>，内部转给 <code>_ccipReceive</code>'],
  ['源信息', '<code>Origin</code> 结构：源链 <code>srcEid</code>、发送者 <code>sender</code>、序号 <code>nonce</code>；用 <code>peers</code> 映射限制可信对端', '<code>Any2EVMMessage</code>：<code>sourceChainSelector</code>、<code>sender</code>（编码后的地址）；需要自己维护白名单'],
  ['消息标识', '<code>guid</code>，协议内带按路径的序号', '<code>messageId</code>']
])}
${code('SOLIDITY', `
// 框架无关的示意：真实协议的函数名和参数不同，三道检查的逻辑相同
abstract contract CrossChainReceiver {
    address public immutable endpoint;                       // 协议入口：Endpoint 或 Router
    mapping(uint32 => bytes32) public trustedPeer;           // 源链 ID 对应的可信源合约
    mapping(bytes32 => bool) public processed;               // 已处理的消息 ID

    error NotEndpoint(); error UntrustedSource(); error AlreadyProcessed();
    event Received(bytes32 indexed id, uint32 srcChain, address to, uint256 amount);

    constructor(address endpoint_) { endpoint = endpoint_; }

    function onMessage(uint32 srcChain, bytes32 srcSender, bytes32 msgId, bytes calldata payload) external {
        if (msg.sender != endpoint) revert NotEndpoint();                  // 1. 调用者
        if (trustedPeer[srcChain] != srcSender) revert UntrustedSource();  // 2. 来源
        if (processed[msgId]) revert AlreadyProcessed();                   // 3. 重放
        processed[msgId] = true;                                           // 先记账
        (address to, uint256 amount) = abi.decode(payload, (address, uint256));
        _mintTo(to, amount);                                               // 再执行业务
        emit Received(msgId, srcChain, to, amount);
    }

    function _mintTo(address to, uint256 amount) internal virtual;
}
`)}
${exq([
  ['为什么“调用者是 Endpoint”还不够，还要检查源合约？', '<p>Endpoint 会转发<strong>任何人</strong>从源链发来的消息。攻击者可以在源链部署自己的合约，发出看起来格式正确的消息。只有白名单里的源合约发来的消息，才代表“真正的锁仓合约确认过”。</p>'],
  ['已处理的消息 ID 为什么要“先标记、再执行”？', '<p>防止业务逻辑里发生重入或回调，让同一条消息被处理两次。先标记，再执行，同样遵循检查-生效-交互。</p>']
])}

<h2>5. 三大事故：因果链复盘</h2>
${mm('三起 2022 年桥事故的因果链', `
flowchart LR
  subgraph R["Ronin 2022 年 3 月 约 6.25 亿美元"]
    R1["9 个验证者 阈值 5"] --> R2["4 个由同一公司运营<br/>另有 1 个临时授权未撤销"]
    R2 --> R3["社会工程拿到 5 把私钥"] --> R4["伪造提款<br/>6 天后才发现"]
  end
  subgraph W["Wormhole 2022 年 2 月 约 3.2 亿美元"]
    W1["Solana 合约用已弃用函数<br/>未校验系统账户地址"] --> W2["攻击者传入伪造账户<br/>绕过守护者签名验证"] --> W3["凭空铸造约 12 万 wETH"]
  end
  subgraph N["Nomad 2022 年 8 月 约 1.9 亿美元"]
    N1["升级时把可信根初始化为 0x00"] --> N2["任何未证明的消息<br/>都被视为已证明"] --> N3["复制攻击交易改地址<br/>数百人跟风提取"]
  end
`, [
  ['risk', 'Ronin：信任集中 + 权限未回收。门限签名的安全只等于 M 个签名者的独立性（Ronin 作为游戏应用链的背景见 <a href="#m09-5">M13.5 GameFi 与链上游戏</a>）。' + cite('The Block：Axie Infinity’s Ethereum sidechain Ronin hit by $600 million exploit（2022-03-29）', 'https://www.theblock.co/post/139761/axie-infinitys-ethereum-sidechain-ronin-hit-by-600-million-exploit')],
  ['fail', 'Wormhole：签名验证逻辑有一个输入未校验，整个守护者网络被绕过。密码学没被破，代码被破。' + cite('CertiK：Wormhole 跨链桥攻击分析', 'https://www.certik.com/blog/wormhole-bridge-exploit-incident-analysis')],
  ['fail', 'Nomad：一次例行升级的初始化参数错误，让“证明”失效。攻击交易公开后，任何人复制就能提款。' + cite('Nomad 官方：桥攻击根因分析', 'https://medium.com/nomad-xyz-blog/nomad-bridge-hack-root-cause-analysis-875ad2e5aacd')],
  ['key', '三起事故没有一起是“破解了加密算法”。全是密钥管理、输入校验、升级流程问题。'],
  ['limit', '事后 Jump Crypto 补足了 Wormhole 的缺口，Sky Mavis 也补偿了 Ronin 用户。这不是协议保证，不能指望。']
])}
${call('info', `<p><strong>算一算（示例）</strong>：一个多签桥 9 个签名者、阈值 5。假设每个签名者独立被攻破的概率是 2%，攻击者需要攻破至少 5 个，概率约为 C(9,5)×0.02⁵×0.98⁴ ≈ 126 × 3.2×10⁻⁹ × 0.922 ≈ <strong>3.7×10⁻⁷</strong>，看起来极小。但如果 4 个签名者由同一公司运营（共享运维、共享网络），攻破这家公司就等于一次拿到 4 把，只需再拿 1 把：概率变为 0.02 × (1 − 0.98⁵) ≈ 0.02 × 0.096 ≈ <strong>1.9×10⁻³</strong>，高了约 5,000 倍。<strong>签名者不独立时，门限数字没有意义。</strong></p>`)}

<h2>6. 工程实践：集成桥的后端与合约</h2>
<p>如果你的业务需要跨链（例如交易所跨链充提、DApp 多链部署），后端要把每笔跨链转账当作状态机管理。</p>
${code('BASH', `
-- 跨链转账记录表（PostgreSQL 示例）
CREATE TABLE bridge_transfers (
  id              BIGSERIAL PRIMARY KEY,
  message_id      TEXT UNIQUE NOT NULL,      -- 桥协议的消息 ID，用于幂等
  src_chain_id    INT NOT NULL,
  dst_chain_id    INT NOT NULL,
  src_tx_hash     TEXT NOT NULL,
  dst_tx_hash     TEXT,
  token           TEXT NOT NULL,
  amount          NUMERIC(78,0) NOT NULL,    -- 最小单位整数
  sender          TEXT NOT NULL,
  recipient       TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('LOCKED','FINALIZING','VERIFYING','MINTED','REFUND')),
  src_block       BIGINT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_bridge_status ON bridge_transfers(status, updated_at);
`)}
${code('SOLIDITY', `
// 目标链接收端：防重放 + 每日限额 + 可暂停（简化示例，验证逻辑省略）
pragma solidity ^0.8.24;
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IMintable { function mint(address to, uint256 amt) external; }

contract BridgeReceiver is Pausable, Ownable {
    IMintable public immutable token;
    mapping(bytes32 => bool) public processed;   // 已处理消息，防重放
    uint256 public dailyLimit;                   // 每日最大铸造量
    uint256 public mintedToday;
    uint256 public dayStart;

    constructor(IMintable t, uint256 limit) Ownable(msg.sender) { token = t; dailyLimit = limit; dayStart = block.timestamp; }

    function receiveMessage(bytes32 id, address to, uint256 amt, bytes calldata proof) external whenNotPaused {
        require(!processed[id], "replayed");
        require(_verify(id, to, amt, proof), "bad proof");   // 多签 / 轻客户端 / ZK 验证
        if (block.timestamp >= dayStart + 1 days) { dayStart = block.timestamp; mintedToday = 0; }
        require(mintedToday + amt <= dailyLimit, "rate limited");
        processed[id] = true;                                // 先改状态，再外部调用
        mintedToday += amt;
        token.mint(to, amt);
    }
    function pause() external onlyOwner { _pause(); }
    function _verify(bytes32, address, uint256, bytes calldata) internal view returns (bool) { return true; /* 占位 */ }
}
`)}
${tryit(`<p>① 打开 <a href="https://l2beat.com/bridges" target="_blank" rel="noopener">L2BEAT 的 Bridges 页面</a>，挑两座桥，记录它们的验证方式（Validated by）和可升级性。② 在 <a href="https://rekt.news/leaderboard" target="_blank" rel="noopener">rekt.news 排行榜</a> 中数一数前 10 名里有几起是桥事故。③ 用一个测试网桥（例如 Sepolia → 某 L2 测试网的官方桥）转 0.01 测试 ETH，分别记下源链交易哈希、目标链到账交易哈希和耗时。预期：官方存款几分钟到账；从乐观 Rollup 提款回 L1 需要等挑战期。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['弄清所用桥的验证模型和签名者集合', '安全上限由它决定', '阅读文档与 L2BEAT 评估，写进风险评审'],
  ['等待源链最终性后再入账', '防重组导致无锚定资产', '在测试网模拟重组，记录不应入账'],
  ['按 message_id 幂等处理', '防重放和重复入账', '同一消息重复投递两次，余额只增加一次'],
  ['单笔与每日限额 + 大额人工审核', '限制单次事故损失', '超限交易进入人工队列'],
  ['监控桥合约暂停、升级、签名者变更事件', '事故往往先有异常治理操作', '订阅事件，告警到值班'],
  ['包装资产风险敞口上限', '桥被攻破时包装资产可能归零', '每日报表：各包装资产占总资产比例 < 阈值（示例 10%）']
])}

${mistakes([
  ['包装资产和原生资产一样安全', '包装资产是桥的欠条。桥被攻破，欠条可能归零，例如被盗后脱锚的包装币。'],
  ['签名者越多越安全', '签名者不独立（同一公司、同一云）时，数量没有意义。看独立性和密钥管理。'],
  ['用了 ZK 就绝对安全', 'ZK 只保证“证明正确则结论正确”。电路、验证合约、升级权限都可能有漏洞。'],
  ['跨链消息到了就完成了', '还要处理目标链执行失败、Gas 不足、超时退款。跨链是异步的，没有原子性。']
])}
${recap([
  '跨链桥的核心问题：链 B 如何相信链 A 的事件。答案决定安全性。',
  '四种验证模型：外部多签/MPC（便宜、信任最强）、乐观（1 个诚实观察者）、轻客户端、ZK（信任源链共识）。',
  '三种资产模型：锁定-铸造（回程销毁-释放）、发行方销毁-铸造、流动性网络。',
  'Ronin、Wormhole、Nomad 的根因是密钥集中、输入未校验、升级初始化错误，不是密码学被破。',
  '集成时：等最终性、按消息 ID 幂等、限额、监控治理事件、控制包装资产敞口。'
])}
${quiz([
  { q: 'Nomad 桥 2022 年被攻击的直接原因是什么？', o: ['守护者私钥被盗', '升级时可信根被初始化为 0x00，任何消息都被视为已证明', 'Solana 合约未校验系统账户', '轻客户端被 51% 攻击'], a: 1, why: 'Nomad 的问题是升级初始化错误。A 是 Ronin；C 是 Wormhole；D 没有发生。' },
  { q: '乐观验证桥的安全假设是？', o: ['多数签名者诚实', '源链永不重组', '中继者不会宕机', '挑战期内至少有一个诚实观察者提出挑战'], a: 3, why: '乐观模型默认消息有效，只要有一个诚实方在挑战期内证明欺诈即可阻止。代价是需要等待挑战期。' },
  { q: '用户希望在目标链拿到原生 USDC 而不是包装币，并且由发行方背书。最合适的模型是？', o: ['发行方的销毁-铸造（如 CCTP）', '锁定-铸造', '多签桥', '流动性网络一定更好'], a: 0, why: '发行方在各链有铸造权，源链销毁、目标链铸造原生 USDC，不产生包装资产。' },
  { q: '目标链桥合约中 processed[id] 映射的作用是？', o: ['记录手续费', '统计每日限额', '防止同一消息被重放导致重复铸造', '保存签名者列表'], a: 2, why: '每条消息只能处理一次。缺少这项检查，攻击者可以重复提交同一个有效证明。' }
])}
${checklist([
  '能画出接收跨链消息时的三道检查，并说出每一道防的是什么攻击。',
  '能说出 LayerZero v2 与 CCIP 中“源信息”和“消息标识”分别对应哪个字段。'
])}
${terms([
  ['跨链桥', 'Bridge', '在两条区块链之间转移资产或传递消息的协议'],
  ['包装资产', 'Wrapped Asset', '在目标链上发行、承诺 1:1 兑换源链锁定资产的代币'],
  ['锁定-铸造', 'Lock-and-Mint', '源链锁定原生资产、目标链铸造包装资产的模型'],
  ['流动性网络', 'Liquidity Network', '目标链用已有流动性直接支付用户、事后结算的跨链模型'],
  ['乐观验证', 'Optimistic Verification', '默认消息有效、挑战期内可被欺诈证明推翻的验证方式'],
  ['守护者', 'Guardian', 'Wormhole 中观察源链并为消息签名的验证节点'],
  ['VAA', 'Verified Action Approval', 'Wormhole 中由足够多守护者签名的跨链消息'],
  ['DVN', 'Decentralized Verifier Network', 'LayerZero v2 中由应用选择的消息验证者'],
  ['IBC', 'Inter-Blockchain Communication', 'Cosmos 生态基于轻客户端的跨链通信标准']
])}
` });

CUR = 'm05-9';
addCh({ id: 'm05-9', nav: '数据基础设施', title: 'M04.10 数据基础设施：索引、分析、预言机与去中心化存储', desc: '链上数据三层、The Graph、Dune、Chainlink/Pyth、IPFS/Arweave。', html: `
<h1>M04.10 数据基础设施：索引、分析、预言机与去中心化存储</h1>
${meta(['画出链上数据的三层结构（原始节点数据 → 索引 → 分析），并为业务选择 The Graph、自建索引或数据仓库。', '解释推送式（Chainlink）与拉取式（Pyth）预言机的架构，写出带过期检查的价格读取代码。', '说清 IPFS、Arweave、Filecoin 的差别，避开 NFT 元数据存储的常见坑。'], '<a href="#m05-6">M04.6 节点运维与 RPC</a>、<a href="#m01">M01 区块链基础 & Go 后端</a>（索引器部分）')}
${beginner(`<p><strong>索引（Index）</strong>：把杂乱的原始数据整理成能快速查询的结构，就像书后的索引页。</p>
<p><strong>事件日志（Event Log）</strong>：合约执行时用 <code>emit</code> 写出的记录，例如 ERC-20 的 Transfer 事件。它是链下系统读取合约行为的主要入口。</p>
<p><strong>预言机（Oracle）</strong>：把链外数据（如 ETH 的美元价格）送上链的服务。合约自己不能访问互联网。</p>
<p><strong>内容寻址（Content Addressing）</strong>：用文件内容的哈希作为地址。内容变了，地址就变了。</p>
<p><strong>GraphQL</strong>：一种查询语言，客户端写明要哪些字段，服务端只返回这些字段。</p>`)}

<h2>1. 一句话理解</h2>
${one('链上数据“写得进、读不好”：节点只擅长按区块和地址查当前状态。所有“按条件查历史”“做报表”“喂链外数据”“存大文件”的需求，都要靠链下的数据基础设施。')}
${call('analogy', `<p>区块链像一本只能追加、按页码排列的流水账。想知道“张三去年一共收了多少钱”，你得从第一页翻到最后一页。索引服务是给流水账做的分类目录；数据仓库是会计做的报表；预言机是往账本里抄写外面世界的汇率；去中心化存储是账本旁边的档案柜，账本里只写档案编号。</p>
<p>类比的局限：目录和报表是别人做的，可能出错或滞后。<strong>只有链上数据本身是权威的</strong>，涉及资金的判断要能回到链上核对。</p>`)}
${art('一图看懂：链上只有权威原始数据，查询、报表、价格和文件都靠链下配套', 660, 346, [
  S.zone(150, 14, 500, 200, { t: '链下：派生数据，可以从链上重建' }),
  S.box(10, 54, 120, 76, { k: 'key', icon: 'block', t: '区块链', s: '权威数据' }),
  S.box(165, 54, 110, 76, { k: 'info', icon: 'server', t: '节点 RPC', s: '按块查' }),
  S.box(305, 54, 150, 76, { k: 'info', icon: 'db', t: '索引器', s: 'The Graph / 自建\n按条件查事件', ss: 11.5 }),
  S.box(485, 54, 150, 76, { k: 'ok', icon: 'phone', t: 'DApp / API', s: '前端 · 后端' }),
  S.box(305, 146, 150, 56, { k: 'info', icon: 'chart', t: '数据仓库', s: 'Dune · SQL' }),
  S.box(485, 146, 150, 56, { k: 'ok', icon: 'doc', t: '报表 · 风控', s: '分钟到小时延迟', ss: 11.5 }),
  S.box(10, 252, 200, 56, { k: 'warn', icon: 'eye', t: '预言机', s: '把链外价格写上链' }),
  S.box(450, 252, 200, 56, { k: 'idle', dash: 1, icon: 'cloud', t: '去中心化存储', s: '链上只存哈希 CID' }),
  S.arrow(132, 92, 163, 92),
  S.arrow(277, 92, 303, 92),
  S.arrow(457, 92, 483, 92),
  S.arrow(457, 174, 483, 174),
  S.route([[220, 132], [220, 174], [303, 174]]),
  S.arrow(70, 250, 70, 132, { k: 'warn', label: '写价格' }),
  S.text(330, 336, '只有链上数据是权威：索引和报表可能滞后，涉及资金要回到链上核对', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '从左往右：链上原始数据经节点读出，再被索引、汇总，变成前端能直接用的接口或报表。'],
  ['key', '只有区块链是权威；其余都是派生的，设计时要保证删掉索引库后能从链上完整重建。'],
  ['fail', '索引层滞后链头，链重组时必须回滚；前端余额可能比链上晚几个区块。'],
  ['limit', '合约无法访问 API，价格要靠预言机写上链；大文件放在链外存储，链上只留哈希。']
], '区块链的数据经节点 RPC 读出，由索引器和数据仓库加工成接口与报表；预言机把链外价格写上链，大文件放在去中心化存储里', 'm05-9')}

<h2>2. 链上数据的三层</h2>
${mm('链上数据三层架构', `
flowchart TB
  subgraph L1["第一层 原始数据"]
    N["节点 JSON-RPC<br/>eth_getBlockByNumber · eth_getLogs"]
    AR["归档节点<br/>任意历史区块的状态"]
  end
  subgraph L2["第二层 索引"]
    TG["The Graph 子图<br/>GraphQL"]
    SELF["自建索引器<br/>Go + PostgreSQL"]
  end
  subgraph L3["第三层 分析"]
    DW["数据仓库<br/>Dune · BigQuery · ClickHouse"]
    BI["仪表盘 · 报表 · 风控"]
  end
  N --> TG
  N --> SELF
  AR --> SELF
  N --> DW
  TG --> APP["DApp 前端 / 后端 API"]
  SELF --> APP
  DW --> BI
`, [
  ['flow', '原始数据从节点出发，经过解码、过滤、聚合，变成业务能直接查询的表或 API。'],
  ['fail', '索引层滞后于链头：前端显示的余额可能比链上晚几个区块。重组时索引层必须回滚。'],
  ['limit', 'eth_getLogs 一次可查的区块范围被节点或服务商限制（例如 2,000–10,000 个区块，示例），历史回填必须分段。'],
  ['key', '第一层是权威数据源；第二、三层是派生数据，可以重建。设计时保证“删掉索引库能从链上完整重建”。']
])}
${tbl(['方案', '适合', '延迟', '成本与运维', '主要风险'], [
  ['直接调 RPC', '查单个余额、单笔交易', '实时', '低', '复杂查询做不了'],
  ['The Graph 子图', 'DApp 前端按条件查合约事件', '秒到分钟', '写子图即可，按查询付费', '索引者滞后；AssemblyScript 能力有限'],
  ['自建索引器', '交易所充值、风控、高定制业务', '秒级，可控', '要自己运维节点、数据库、重组处理', '重组与回填逻辑出错'],
  ['数据仓库（Dune 等）', '研究、运营报表、临时分析', '分钟到小时', 'SQL 即可', '不适合在线业务；数据非实时']
])}

<h2>3. 索引：The Graph 与自建</h2>
<p><strong>The Graph</strong> 是去中心化索引协议。开发者写一个<strong>子图（Subgraph）</strong>：声明监听哪个合约的哪些事件，以及如何把事件转换成实体。索引者（Indexer）运行子图并对外提供 GraphQL 查询。子图包含三个文件：</p>
${steps(['<code>subgraph.yaml</code>：数据源清单，写合约地址、起始区块、事件与处理函数的映射。', '<code>schema.graphql</code>：定义实体（表）结构。', '<code>src/mapping.ts</code>：用 AssemblyScript 写的事件处理函数，把事件写成实体。'])}
${code('TYPESCRIPT', `
// schema.graphql 中定义：type Transfer @entity(immutable: true) { id: Bytes! from: Bytes! to: Bytes! value: BigInt! block: BigInt! }
// src/mapping.ts —— 由 graph codegen 生成类型后编写
import { Transfer as TransferEvent } from '../generated/USDC/ERC20';
import { Transfer } from '../generated/schema';

export function handleTransfer(event: TransferEvent): void {
  // 用 交易哈希 + 日志序号 作为唯一 ID，天然幂等
  const id = event.transaction.hash.concatI32(event.logIndex.toI32());
  const t = new Transfer(id);
  t.from = event.params.from;
  t.to = event.params.to;
  t.value = event.params.value;
  t.block = event.block.number;
  t.save();
}
`)}
<p>把上面三个文件串起来的是 <code>subgraph.yaml</code>，再用命令行生成、构建、部署：</p>
${code('YAML', `
# subgraph.yaml
specVersion: 1.0.0
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: USDC
    network: mainnet
    source:
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
      abi: ERC20
      startBlock: 6082465              # 合约部署所在区块（到 Etherscan 查）；从这里开始索引，越准越省时间
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: [Transfer]
      abis:
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
      file: ./src/mapping.ts
`)}
${code('BASH', `
graph init                      # 按提示生成项目骨架
graph codegen                   # 根据 schema 和 ABI 生成 AssemblyScript 类型
graph build                     # 编译成 WASM
graph auth <你的 deploy key>      # 登录 Subgraph Studio
graph deploy <子图名>            # 部署；之后在 Studio 里试查询，再发布到去中心化网络
`)}
${call('info', '<p>具体的 <code>specVersion</code>、<code>apiVersion</code> 和部署命令随 graph-cli 版本变化，以 The Graph 官方文档为准。排错的第一步永远是看索引状态：同步到哪个区块、有没有处理函数报错。</p>')}
<p>查询时前端发 GraphQL：<code>{ transfers(first: 5, orderBy: block, orderDirection: desc) { from to value } }</code>。</p>
<p><strong>自建索引器</strong>在 <a href="#m01">M01</a> 的索引器工程部分详细讲过。核心要点回顾：① 用 <code>eth_getLogs</code> 分段回填历史；② 订阅新区块并保存每个区块的哈希；③ 发现父哈希不匹配就回滚到分叉点（重组处理）；④ 用“交易哈希 + 日志序号”做唯一键保证幂等；⑤ 只把“已达到确认数”的数据交给资金相关业务。</p>

<h2>4. 分析：数据仓库与 SQL</h2>
<p><strong>Dune</strong> 这类平台把全链数据解码成 SQL 表，你可以直接写 SQL 做分析并生成仪表盘。表通常分三类：原始表（如 <code>ethereum.transactions</code>）、按 ABI 解码的事件表（如 <code>erc20_ethereum.evt_Transfer</code>）、社区维护的抽象表（如 <code>dex.trades</code>）。</p>
${code('BASH', `
-- Dune SQL 示例：过去 7 天每天的 USDC 转账笔数与总额（USDC 6 位小数）
SELECT
  date_trunc('day', evt_block_time) AS day,
  count(*)                          AS transfers,
  sum(value) / 1e6                  AS volume_usdc
FROM erc20_ethereum.evt_Transfer
WHERE contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
  AND evt_block_time > now() - interval '7' day
GROUP BY 1
ORDER BY 1;
`)}
<p>再看一个把“链上事件”和“价格表”拼起来的例子。Dune 有专门的价格表 <code>prices.usd</code>，按分钟记录代币的美元价格：</p>
${code('SQL', `
-- Dune SQL 示例：过去 7 天 WETH 的日均美元价格
SELECT
  date_trunc('day', minute) AS day,
  avg(price)                AS avg_price_usd
FROM prices.usd
WHERE blockchain = 'ethereum'
  AND symbol = 'WETH'
  AND minute > now() - interval '7' day
GROUP BY 1
ORDER BY 1;
`)}
<p>写 Dune 查询的三条经验：① 优先用“已解码”的表（如 <code>erc20_ethereum.evt_Transfer</code>），不要一上来扫原始表；② 一定带上时间或区块范围的过滤条件，否则查询又慢又耗额度；③ 金额要按代币的 decimals 换算（USDC 是 10<sup>6</sup>，WETH 是 10<sup>18</sup>）。</p>
<p>从表结构、常用查询模式到做一个完整仪表盘，见 <a href="#m05-66">M04.12 Dune 与链上 SQL</a>。</p>
${call('info', `<p>企业自建数据仓库的常见做法：自建索引器把解码后的事件写入 Kafka，再落到 ClickHouse / BigQuery。在线业务读 PostgreSQL（强一致、可回滚），分析读列式仓库（大批量聚合快）。两者职责不要混用。</p>`)}

<h2>5. 预言机：把链外价格送上链</h2>
<p>预言机在应用里的两个典型用法：RWA 的 NAV 与储备金数据源见 <a href="#m09-4">M13.4 RWA 与链上支付</a>，链游用 VRF 开箱抽卡见 <a href="#m09-5">M13.5 GameFi 与链上游戏</a>。</p>
<p>借贷、永续合约、稳定币都需要价格。合约无法访问 API，只能读取预言机写在链上的数据。两种主流架构：</p>
${mm('推送式（Chainlink）与拉取式（Pyth）对比', `
flowchart LR
  subgraph PUSH["推送式 Chainlink Data Feeds"]
    EX1["多家交易所与数据商"] --> NODES["预言机节点网络<br/>链下 OCR 聚合签名"]
    NODES -->|"偏差超阈值 或 心跳到期"| AGG["链上聚合合约<br/>latestRoundData"]
    AGG --> D1["DeFi 合约直接读"]
  end
  subgraph PULL["拉取式 Pyth"]
    PUB["一手发布者<br/>交易所 做市商"] --> PN["Pythnet 聚合<br/>价格 + 置信区间"]
    PN --> HER["Hermes 服务<br/>链下获取签名价格"]
    HER -->|"用户随交易附带更新数据"| PC["目标链 Pyth 合约<br/>updatePriceFeeds"]
    PC --> D2["DeFi 合约读最新价"]
  end
`, [
  ['flow', '推送式：预言机主动把价格写上链，谁都能免费读。拉取式：用户在需要时把签名价格带进交易，自己付更新费用。'],
  ['key', '推送式的更新规则 = 偏差阈值（如价格变化超过 0.5%）或心跳（如每 3,600 秒，示例），两者先到先更新。'],
  ['risk', '推送式在两次更新之间价格可能过时；合约必须检查 updatedAt，否则可能用旧价格放贷或清算。'],
  ['fail', '拉取式中如果没人提交更新，链上价格就停在旧值。合约要用 getPriceNoOlderThan 限制最大年龄。'],
  ['limit', '任何预言机都无法防止“源头价格被操纵”。低流动性代币的价格最容易被操纵。']
])}
${call('info', `<p><strong>算一算（示例）</strong>：某 ETH/USD 喂价偏差阈值 0.5%，心跳 3,600 秒。上次更新价格 3,000 美元。① 10 分钟后市场价 3,012 美元，变化 0.4% &lt; 0.5%，<strong>不更新</strong>，链上仍是 3,000。② 15 分钟时市场价 3,016 美元，变化 0.533% &gt; 0.5%，<strong>触发更新</strong>。③ 如果价格一直在 ±0.5% 内波动，60 分钟心跳到期时也会更新。结论：链上价格与市场价最大偏差约等于偏差阈值，借贷协议的清算线要留出这部分缓冲。</p>`)}
${code('SOLIDITY', `
// 读取 Chainlink 价格：必须做过期与合法性检查
pragma solidity ^0.8.24;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract PriceReader {
    AggregatorV3Interface public immutable feed;
    uint256 public constant MAX_AGE = 3600 + 600; // 心跳 + 10 分钟缓冲（示例）

    constructor(address f) { feed = AggregatorV3Interface(f); }

    function ethUsd() public view returns (uint256 price, uint8 decimals) {
        (uint80 roundId, int256 answer, , uint256 updatedAt, uint80 answeredInRound) = feed.latestRoundData();
        require(answer > 0, "bad price");                         // 价格必须为正
        require(updatedAt != 0 && block.timestamp - updatedAt <= MAX_AGE, "stale price"); // 不能过期
        require(answeredInRound >= roundId, "stale round");
        return (uint256(answer), feed.decimals());                // ETH/USD 通常 8 位小数
    }
}
`)}
${code('TYPESCRIPT', `
// Pyth 拉取式：先从 Hermes 取更新数据，再随交易提交
// 1) GET https://hermes.pyth.network/v2/updates/price/latest?ids[]=<ETH/USD 价格 ID>
// 2) 合约侧（Solidity 伪代码）：
//    uint fee = pyth.getUpdateFee(updateData);
//    pyth.updatePriceFeeds{value: fee}(updateData);
//    PythStructs.Price memory p = pyth.getPriceNoOlderThan(ETH_USD_ID, 60); // 最多 60 秒旧
//    // p.price × 10^p.expo 为价格，p.conf 为置信区间；conf 过大时应拒绝交易
`)}

<h3>5.1 链上随机数：Chainlink VRF</h3>
<p>合约里没有真正的随机数。<code>block.timestamp</code>、<code>prevrandao</code> 这类“看起来随机”的值，出块者可以在一定范围内影响，抽奖、开箱、NFT 稀有度如果用它们，就可能被操纵。<strong>VRF（可验证随机函数）</strong>的做法：随机数由链下节点生成，同时附带一个<strong>密码学证明</strong>；链上合约先验证证明，再把随机数交给你的合约。证明通过，就说明节点没有挑选结果。</p>
${mm('一次 VRF 请求的完整流程', `
sequenceDiagram
  participant U as 用户
  participant C as 你的合约
  participant V as VRF Coordinator
  participant N as 链下 VRF 节点
  U->>C: draw
  C->>V: requestRandomWords 得到 requestId
  Note over V,N: 等待若干个区块确认
  N->>N: 用私钥生成随机数和证明
  N->>V: fulfill 提交随机数与证明
  V->>V: 链上验证证明
  V->>C: 回调 fulfillRandomWords
  C->>C: 用随机数决定结果
`, [
  ['flow', '请求和结果在两笔不同的交易里：先请求，过几个区块后由协议回调结果。'],
  ['fail', '回调里如果 revert 或用光 callbackGasLimit，这次随机数的交付就失败了。回调要尽量短，只存结果。'],
  ['risk', '请求之后、结果回来之前，用户不能还能“取消、转移、改选”。否则用户可以等看到结果再决定，随机数就失去意义。'],
  ['key', '请求确认数越多，越能抵御区块重组带来的操纵，但等待时间越长。']
])}
${code('SOLIDITY', `
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract Lottery is VRFConsumerBaseV2Plus {
    uint256 public immutable subId;            // 订阅 ID：在 Chainlink 控制台创建并充值，再把本合约加为消费者
    bytes32 public immutable keyHash;          // 选择使用哪个 VRF 节点配置（不同链不同）
    mapping(uint256 => address) public requester;
    mapping(uint256 => uint256) public result; // requestId 对应 0 到 99 的结果

    constructor(address coordinator, uint256 subId_, bytes32 keyHash_) VRFConsumerBaseV2Plus(coordinator) {
        subId = subId_; keyHash = keyHash_;
    }

    function draw() external returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash, subId: subId,
                requestConfirmations: 3,       // 等 3 个区块确认
                callbackGasLimit: 200_000,     // 回调最多用的 Gas，要够写存储，又别设太大
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );
        requester[requestId] = msg.sender;     // 记录这次请求属于谁
    }

    // 注意：函数签名要与你所用 @chainlink/contracts 版本里的基类一致
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        result[requestId] = randomWords[0] % 100;   // 取值 0 到 99；回调里只存结果，不做转账等复杂操作
    }
}
`)}
<p><strong>算一算（示例）：</strong>随机数是 256 位整数，对 100 取余得到 0 到 99。256 位整数的取值空间远大于 100，取余带来的偏差可以忽略不计。如果随机数是 <code>…8723</code>（结尾 8723），则 <code>8723 % 100 = 23</code>，只看最后两位。</p>
<h3>5.2 链外计算：Chainlink Functions</h3>
<p>价格喂价只能提供“标准数据”。如果合约需要调用任意 HTTP 接口（天气、体育比分、你自己的评分服务），就用 <strong>Chainlink Functions</strong>：你在请求里带上一段 JavaScript，预言机网络（DON）中的多个节点各自运行它，结果聚合后回调给你的合约。</p>
${mm('Chainlink Functions 请求流程', `
sequenceDiagram
  participant C as 你的合约
  participant R as Functions Router
  participant D as DON 节点们
  participant A as 外部 API
  C->>R: 发送请求 JS 源码与参数 并预留订阅费用
  R->>D: 请求事件
  D->>A: 各节点各自执行 JS 并调用 API
  A-->>D: 返回数据
  D->>D: 聚合结果 达成共识
  D->>R: 提交 response 或 err
  R->>C: 回调 fulfillRequest
`, [
  ['flow', '链上只发“请求”和收“结果”。真正的 HTTP 调用和计算发生在链下节点里。'],
  ['fail', '外部 API 超时、返回格式变化或脚本报错，会得到 <code>err</code> 而不是 <code>response</code>。回调要同时处理两种情况。'],
  ['limit', '执行时间、返回数据大小、每个订阅的消费者数量等都有上限，以官方 Service Limits 页面为准。'],
  ['risk', '多个节点读同一个 API，只能防“节点作假”，不能防“API 本身被篡改或下线”。关键数据要多源交叉验证。']
])}
${code('SOLIDITY', `
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract TempReader is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;
    uint64 public immutable subId;             // Functions 订阅 ID
    bytes32 public immutable donId;            // 目标 DON 的 ID（按链查官方文档）
    uint32 public constant GAS_LIMIT = 300_000;
    bytes32 public lastId; bytes public lastResponse; bytes public lastError;

    constructor(address router, uint64 subId_, bytes32 donId_) FunctionsClient(router) {
        subId = subId_; donId = donId_;
    }

    // 生产环境必须限制谁能发请求，否则任何人都能消耗你的订阅余额
    function request(string memory source, string[] memory args) external returns (bytes32) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args);
        lastId = _sendRequest(req.encodeCBOR(), subId, GAS_LIMIT, donId);
        return lastId;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (requestId != lastId) return;       // 只接受自己发出的最近一次请求
        lastResponse = response;               // 成功时 response 有值
        lastError = err;                       // 失败时 err 有值，两者不会同时出现
    }
}
`)}
${code('JAVASCRIPT', `
// 传给 request 的 source：在 DON 的沙箱里运行，args[0] 是城市名
const res = await Functions.makeHttpRequest({ url: 'https://api.example.com/temp?city=' + args[0] });
if (res.error) throw Error('request failed');
return Functions.encodeInt256(Math.round(res.data.temp * 100));   // 温度乘 100，转整数返回
`)}
${tbl(['需求', '用什么', '为什么'], [
  ['要一个公平的随机数', 'VRF', '带证明，出块者和节点都不能挑结果'],
  ['要标准资产价格', 'Data Feeds（上一节）', '多源聚合，已被大量协议使用'],
  ['要调用任意 API 或做链外计算', 'Functions', '灵活，但数据源可信度要自己评估'],
  ['要按时间或条件自动触发合约', 'Automation（见 <a href="#m02-1">M02.1</a> 的“不能做”表）', '合约自己不会运行，需要外部触发']
])}
${exq([
  ['为什么用 <code>block.prevrandao</code> 抽奖不安全？', '<p>出块者能在一定范围内影响这个值（例如选择是否出块），当奖金足够大时，就有动机操纵。VRF 的随机数带证明，且在请求之后才生成，用户和出块者都无法预先知道或挑选。</p>'],
  ['VRF 请求和回调之间，合约必须做什么限制？', '<p>锁住与这次请求相关的状态：不允许取消、转移或重新选择。否则用户可以在结果出来之前观察并撤出，让抽奖变成“只赢不输”。</p>']
])}
<p class="muted small">资料来源：<a href="https://docs.chain.link/vrf/v2-5/getting-started" target="_blank" rel="noopener noreferrer">Chainlink VRF v2.5 入门</a>、<a href="https://docs.chain.link/chainlink-functions/api-reference/functions-client" target="_blank" rel="noopener noreferrer">Chainlink Functions：FunctionsClient 参考</a>。合约库的路径和函数签名随版本变化，以官方文档和你所用的 <code>@chainlink/contracts</code> 版本为准。</p>

<h2>6. 去中心化存储与 NFT 元数据</h2>
<p>本节只讲 NFT 元数据怎么存；Filecoin、Arweave、DePIN 的激励机制和 CID 版本细节见 <a href="#m09-3">M13.3 去中心化存储与 DePIN</a>。</p>
<p>链上存储非常贵（写 1 个 32 字节存储槽约 2 万 gas）。图片、视频、JSON 元数据都放链下，链上只存一个指针。</p>
${tbl(['方案', '原理', '持久性', '典型用途'], [
  ['IPFS', '内容寻址：文件哈希生成 CID，任何节点都能提供。节点只保存自己“固定（pin）”的内容', '没人固定就会消失。需要固定服务或自己运行节点', 'NFT 元数据、前端静态文件'],
  ['Arweave', '一次付费，费用进入捐赠基金，激励矿工长期存储（设计目标约 200 年）', '设计为永久', '永久归档、NFT 媒体'],
  ['Filecoin', '存储市场：用户与存储提供者签订按期限的存储交易，用复制证明和时空证明验证仍在保存', '按合约期限，到期需续约', '大规模冷存储'],
  ['中心化 HTTPS / 云存储', '普通服务器', '取决于公司是否续费', '不推荐作为 NFT 唯一存储']
])}
${mm('NFT 元数据的引用链与断点', `
flowchart LR
  C["NFT 合约<br/>tokenURI(42)"] -->|"返回"| U["ipfs://CID1/42.json"]
  U --> J["元数据 JSON<br/>name · description · image"]
  J -->|"image 字段"| IMG["ipfs://CID2/42.png"]
  U -.->|"如果写成网关 URL"| GW["https://某网关/ipfs/CID1/42.json"]
  GW -.-> X["网关下线 = 链接失效"]
  J -.->|"如果没人 pin"| Y["内容无法获取 NFT 显示空白"]
`, [
  ['flow', '链上 tokenURI → 元数据 JSON → 媒体文件，三段引用都必须长期可用。'],
  ['fail', '最常见断点：把某个网关的 HTTPS 地址写死到合约或 JSON 中；网关下线后所有图片失效。'],
  ['risk', '如果 tokenURI 指向项目方服务器，项目方可以随时修改或删除元数据，“你的 NFT”可能变成另一张图。'],
  ['key', '用 ipfs:// 协议地址而非网关地址；至少两家固定服务 + 自建节点 pin；重要项目额外上 Arweave。']
])}
${steps([
  '把图片目录上传到 IPFS，得到目录 CID2。',
  '生成每个 token 的 JSON，<code>image</code> 写 <code>ipfs://CID2/&lt;id&gt;.png</code>，上传得到目录 CID1。',
  '在至少两个固定服务和自己的 IPFS 节点上 pin CID1 和 CID2。',
  '合约 <code>baseURI</code> 设为 <code>ipfs://CID1/</code>；元数据确定后放弃修改权限（或通过 ERC-4906 的 MetadataUpdate 事件通知市场）。',
  '用多个公共网关抽查访问，并写定时任务检查 CID 可用性。'
])}
${tryit(`<p>① 在 <a href="https://thegraph.com/explorer" target="_blank" rel="noopener">The Graph Explorer</a> 打开一个 Uniswap 子图，在 Playground 中执行 <code>{ pools(first: 3, orderBy: totalValueLockedUSD, orderDirection: desc) { id token0 { symbol } token1 { symbol } } }</code>，预期返回 TVL 前三的池子。② 在 <a href="https://data.chain.link" target="_blank" rel="noopener">data.chain.link</a> 查看以太坊主网 ETH/USD 喂价页面，记录它的 Deviation threshold 和 Heartbeat。③ 在 Etherscan 打开任意一个知名 NFT 合约，在 Read Contract 里调用 <code>tokenURI(1)</code>，判断它指向 IPFS、Arweave 还是 HTTPS 服务器。</p>`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['索引器能处理重组并从链上完整重建', '派生数据会出错', '删库重建后与线上数据比对一致'],
  ['资金业务只用已确认数据', '未确认数据可能被回滚', '代码审查：入账查询带确认数条件'],
  ['预言机读取做过期、非零、置信区间检查', '过时或异常价格导致错误清算', '单测：mock updatedAt 过旧时必须 revert'],
  ['关键价格有备用源与熔断', '单一预言机故障', '主源暂停时切换备用源或暂停业务'],
  ['NFT 元数据用 ipfs:// 并多处 pin', '网关与固定服务都会下线', '定时任务检查 CID 在 3 个网关可访问'],
  ['索引延迟监控', '前端显示过时数据', '指标 indexer_head_lag_blocks > 10 告警（示例）']
])}

${mistakes([
  ['上传到 IPFS 就永久保存了', 'IPFS 只是寻址协议。没有节点固定的内容会被回收，需要固定服务或 Arweave/Filecoin。'],
  ['预言机价格就是实时市场价', '推送式预言机按偏差阈值和心跳更新，两次更新之间链上价格可能落后。'],
  ['Dune 的数据可以直接驱动线上业务', '数据仓库有分钟到小时级延迟，适合分析，不适合充值入账或风控实时决策。'],
  ['索引数据库是权威数据', '索引是链上数据的派生副本，可能因 bug 或重组出错。资金判断要能回到链上核对。']
])}
${recap([
  '链上数据三层：原始节点数据（权威）→ 索引（The Graph / 自建）→ 分析（数据仓库）。',
  '子图 = subgraph.yaml + schema.graphql + mapping；自建索引的关键是重组处理和幂等。',
  '推送式预言机按偏差阈值或心跳更新；拉取式由用户随交易提交签名价格。都必须检查过期。',
  'IPFS 内容寻址但需要固定；Arweave 一次付费永久存储；Filecoin 按期限存储合约。',
  'NFT 元数据用 ipfs:// 地址、多处固定，不要写死网关 URL 或指向项目方服务器。'
])}
${quiz([
  { q: '喂价偏差阈值 0.5%、心跳 1 小时。上次价格 3,000，20 分钟后市场价 3,010。链上价格是？', o: ['3,010，实时更新', '3,000，因为变化约 0.33% 未达阈值且心跳未到', '0，价格过期', '3,015，预言机会预测'], a: 1, why: '3,010 / 3,000 − 1 ≈ 0.33% < 0.5%，心跳也没到，所以不更新。' },
  { q: '关于 IPFS，下面哪个说法正确？', o: ['上传后全网永久保存', '同一文件每次上传得到不同 CID', 'CID 由服务器随机分配', '内容改变后 CID 也会改变'], a: 3, why: 'CID 由内容哈希生成，内容变了 CID 就变。IPFS 不保证持久，需要 pin。' },
  { q: '交易所要实时识别用户充值并入账，最合适的数据方案是？', o: ['自建索引器 + 确认数检查 + 重组处理', 'Dune SQL 每小时跑一次', '前端直接读 The Graph', '读 NFT 元数据'], a: 0, why: '资金业务需要低延迟、可控、可回滚的数据，自建索引器最合适。Dune 延迟高；前端读子图不适合做账务。' },
  { q: 'Pyth 拉取式预言机中，链上价格何时更新？', o: ['每个区块自动更新', '只在心跳到期时', '有人随交易提交 Hermes 签名的更新数据时', '由 Chainlink 节点推送'], a: 2, why: '拉取式由使用者把签名价格带进交易并付更新费。没人提交，价格就不变，所以要用 getPriceNoOlderThan 限制年龄。' }
])}
${checklist([
  '能写出一个子图的 subgraph.yaml，并说出 startBlock 应该填什么。',
  '能写一条 Dune 查询，用已解码的事件表加价格表算出每日美元成交额。',
  '能画出 VRF 请求到回调的时序，并说出请求之后合约必须锁住什么。',
  '能说出 Functions 的数据来源风险，以及它和 Data Feeds 的使用场景区别。'
])}
${terms([
  ['子图', 'Subgraph', 'The Graph 中定义“监听哪些事件、如何存成实体”的索引配置'],
  ['索引者', 'Indexer', '运行子图并提供查询服务的节点运营者'],
  ['数据仓库', 'Data Warehouse', '为大批量分析查询优化的列式数据库'],
  ['偏差阈值', 'Deviation Threshold', '价格变化超过该比例时预言机触发链上更新'],
  ['心跳', 'Heartbeat', '价格不变时预言机强制更新的最大时间间隔'],
  ['拉取式预言机', 'Pull Oracle', '由使用者在交易中提交签名价格来更新链上值的预言机'],
  ['内容标识符', 'CID, Content Identifier', 'IPFS 中由内容哈希生成的文件地址'],
  ['固定', 'Pinning', '让 IPFS 节点长期保存某个 CID 的内容、不被回收'],
  ['永久存储', 'Permanent Storage', 'Arweave 一次付费、设计为长期保存数据的存储模式']
])}
` });
})();
