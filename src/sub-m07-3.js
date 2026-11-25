/* ---------- M03 子文章（3/4）：交易状态与 UX、前端安全、性能与工程化 ---------- */
(() => {
CUR = 'm07-7';
addCh({ id: 'm07-7', nav: '交易状态与 UX', title: 'M03.7 交易状态与 UX：从“转圈圈”到可预期的反馈', desc: '为交易的每个状态写对文案、按钮和反馈，处理替换、取消、长时任务与无障碍。', html: `
<h1>M03.7 交易状态与 UX：从“转圈圈”到可预期的反馈</h1>
${meta(['为交易状态机的每个状态设计文案、按钮状态和下一步操作。', '正确处理交易加速、取消和长时间任务（跨链）的后台追踪。', '展示 Gas 费、空状态、加载与错误，并满足基本的可访问性要求。'], '<a href="#m07-5">M03.5 写合约</a>', ['txlife'])}
${beginner(`<p><strong>UX（用户体验）</strong>：用户使用产品时的整体感受：能不能看懂、会不会犯错、等待时是否安心。</p>
<p><strong>Toast（轻提示）</strong>：屏幕角落弹出、几秒后自动消失的小通知。</p>
<p><strong>区块浏览器（Block Explorer）</strong>：查看链上交易和地址的网站，例如 Etherscan、Basescan。</p>
<p><strong>内存池（Mempool）</strong>：已广播、还没被打包的交易排队的地方。</p>
<p><strong>可访问性（Accessibility，a11y）</strong>：让使用屏幕阅读器、键盘或有色觉障碍的用户也能正常使用产品。</p>`)}

<h2>1. 一句话理解</h2>
${one('好的交易 UX 让用户在任何时刻都知道三件事：现在处于哪一步、还要等多久、我下一步能做什么。')}
${call('analogy', `<p>外卖 App 的订单页面就是好榜样：“商家已接单 → 骑手已取餐 → 距你 1.2 公里 → 已送达”。每一步都有文案、预计时间、可以联系谁。如果页面只显示一个转圈圈，你会忍不住重复下单。</p>
<p>类比的局限：外卖可以退款。链上交易一旦打包就无法撤回；而且“已送达”（打包）之后还可能因为链重组“退回途中”。</p>`)}
${art('一图看懂：主路径五步，每个分支都要有出口', 660, 312, [
  S.box(10, 40, 112, 62, { k: 'tint', t: '可提交', s: '“兑换”可点\n显示预估 Gas' }),
  S.box(142, 40, 112, 62, { k: 'tint', t: '等待签名', s: '请在钱包确认\n按钮禁用' }),
  S.box(274, 40, 112, 62, { k: 'key', t: '待打包', s: '已发送 2–15 秒\n浏览器链接' }),
  S.box(406, 40, 112, 62, { k: 'ok', t: '已打包', s: '兑换成功\n再来一笔' }),
  S.box(538, 40, 112, 62, { k: 'tint', t: '已最终确定', s: '大额 · 跨链\n才等这一步' }),
  S.arrow(124, 71, 140, 71),
  S.arrow(256, 71, 272, 71),
  S.arrow(388, 71, 404, 71),
  S.arrow(520, 71, 536, 71),
  S.arrow(198, 104, 198, 196, { k: 'warn', dash: 1 }),
  S.arrow(330, 104, 330, 196, { k: 'warn', dash: 1 }),
  S.arrow(344, 104, 462, 196, { k: 'risk', dash: 1 }),
  S.arrow(358, 104, 594, 196, { k: 'risk', dash: 1 }),
  S.box(142, 198, 112, 66, { k: 'warn', t: '拒签 4001', s: '回到可提交\n不当成错误' }),
  S.box(274, 198, 112, 66, { k: 'warn', t: '已替换', s: '追踪新 hash\n不报错' }),
  S.box(406, 198, 112, 66, { k: 'risk', t: '执行失败', s: 'Gas 已扣\n说明原因 + 重试' }),
  S.box(538, 198, 112, 66, { k: 'risk', t: '已丢弃', s: '提示重新提交\n建议提高 Gas' }),
  S.text(330, 298, '界面永远不该停在“处理中”：每个状态都告诉用户在哪一步、要等多久、能做什么', { size: 13, anchor: 'middle', mw: 640 })
], [ ['flow', '主路径是：可提交、等待签名、待打包、已打包、已最终确定；每个状态下方是它对应的界面文案。'], ['key', '“待打包”是用户最容易焦虑的一步，要有预计时间和区块浏览器链接，不能只转圈。'], ['fail', '最常见的 bug：只处理成功和失败，漏了替换和丢弃，界面永远停在“处理中”。'], ['limit', '前端关闭后状态机就停了，待处理交易要持久化，重开页面时恢复追踪。'] ], '交易状态主路径为可提交、等待签名、待打包、已打包、已最终确定；分支有拒签、已替换、执行失败、已丢弃，每个分支都有对应界面和出口', 'm07-7')}

<h2>2. 状态机复习与每个状态的 UI 规范</h2>
${mm('交易状态机（前端视角）', `
stateDiagram-v2
  state "可提交" as Ready
  state "等待签名" as Signing
  state "待打包" as Pending
  state "已替换" as Replaced
  state "已打包" as Mined
  state "已最终确定" as Final
  state "执行失败" as Reverted
  state "已丢弃" as Dropped
  [*] --> Ready
  Ready --> Signing: 点击提交 模拟通过
  Signing --> Ready: 拒签 4001
  Signing --> Pending: 得到 txHash
  Pending --> Replaced: 同 nonce 新交易
  Replaced --> Pending: 追踪新 hash
  Pending --> Mined: status success
  Pending --> Reverted: status reverted
  Pending --> Dropped: 长时间不在内存池
  Dropped --> Ready: 提示重新提交
  Mined --> Pending: 链重组
  Mined --> Final: 达到 finalized
  Reverted --> Ready: 修改参数重试
  Final --> [*]
`, [
  ['flow', '主路径：可提交 → 等待签名 → 待打包 → 已打包 → 已最终确定。其余是分支，每个分支都要有出口。'],
  ['fail', '最常见的 bug：只处理成功和失败，没有处理替换和丢弃，界面永远停在“处理中”。'],
  ['key', '“已打包”对小额操作就够了；大额、跨链、交易所入账要等“已最终确定”（以太坊约 13 分钟）。'],
  ['limit', '前端关闭后状态机就停了。需要持久化待处理交易，重新打开时恢复追踪。']
])}
${tbl(['状态', '主文案（示例）', '按钮', '附加信息'], [
  ['可提交', '—', '“兑换”（可点）', '预估 Gas 费、最少收到'],
  ['等待签名', '“请在钱包中确认”', '禁用 + 加载动画', '提示“没看到弹窗？打开钱包扩展”'],
  ['拒签（4001）', '不提示，或灰字“已取消”', '恢复“兑换”（可点）', '不当成错误，不上报'],
  ['待打包', '“交易已发送，通常 2–15 秒”', '禁用', 'txHash 缩写 + 区块浏览器链接'],
  ['已替换', 'repriced：“交易已加速，正在追踪新交易”；cancelled：“操作已取消”；replaced：“交易已被替换，请核对结果”', '禁用（cancelled 后恢复可点）', '更新链接为新 hash，不报错'],
  ['已打包', '“兑换成功”', '“再来一笔”', '实际收到数量（从回执日志解析）'],
  ['已最终确定', '“已最终确定”', '—', '大额或跨链场景展示'],
  ['执行失败', '“交易失败：价格变动超过滑点”', '“重试”', '说明 Gas 已扣，链接到浏览器'],
  ['已丢弃', '“交易长时间未被打包，可能已被丢弃”', '“重新提交”', '建议提高 Gas']
])}
<p>先打开下面的实验，按顶部“试一试”的顺序触发事件；每一步对照上表，看右侧 DApp 预览的文案和按钮是否符合规范。重点观察“加速”和“链重组”两步。</p>
${lab('txlife')}

<h2>3. Toast、进度与区块浏览器链接</h2>
${code('TYPESCRIPT', `
// src/hooks/useTxToast.ts —— 一笔交易一个 Toast，状态变化时原地更新，不要堆叠多个
import { useWaitForTransactionReceipt, useChainId, useConfig } from 'wagmi'
import { useEffect } from 'react'
import { toast } from 'sonner'                      // 任意 Toast 库均可

export function useTxToast(hash?: \`0x\${string}\`, label = '交易') {
  const chainId = useChainId()
  const chain = useConfig().chains.find(c => c.id === chainId)
  const url = hash && chain?.blockExplorers ? chain.blockExplorers.default.url + '/tx/' + hash : undefined

  const rc = useWaitForTransactionReceipt({
    hash,
    onReplaced: r => {                              // reason: 'replaced' | 'repriced' | 'cancelled'
      if (r.reason === 'repriced') toast.info(label + '已加速，正在追踪新交易', { id: hash })
      else if (r.reason === 'cancelled') toast.info(label + '已在钱包中取消', { id: hash })        // 用户主动取消，不用失败样式
      else toast.warning(label + '已被另一笔同 nonce 交易替换，请核对结果', { id: hash })    // replaced：内容已变，不能说成“加速”
    },
  })

  useEffect(() => {
    if (!hash) return
    if (rc.isLoading) toast.loading(label + '确认中…', { id: hash, description: url, duration: Infinity })
    if (rc.data?.status === 'success') toast.success(label + '成功', { id: hash, description: url })
    if (rc.data?.status === 'reverted') toast.error(label + '执行失败，Gas 已扣除', { id: hash, description: url })
  }, [hash, rc.isLoading, rc.data?.status]) // eslint-disable-line react-hooks/exhaustive-deps
}
`)}
<p>区块浏览器链接的地址来自 viem 链定义的 <code>blockExplorers.default.url</code>，不要手写域名拼接，避免切链后链接指向错误的浏览器。</p>

<h2>4. 交易替换与取消</h2>
<p>同一地址的交易按 <strong>nonce</strong> 顺序执行。用户在钱包点“加速”，钱包会用<strong>相同 nonce、更高费用</strong>重新签一笔交易；点“取消”，钱包发一笔相同 nonce、给自己转 0 ETH 的交易。哪一笔先被打包，另一笔就作废（nonce 原理见 <a href="#m03-6">M08.6 Nonce 管理</a>）。</p>
${mm('加速与取消如何替换原交易', `
flowchart LR
  T0["原交易 A<br/>nonce 7 · 小费 1 gwei"] --> MP["内存池"]
  SP["加速：交易 A′<br/>nonce 7 · 小费 2 gwei<br/>内容相同"] --> MP
  CA["取消：交易 C<br/>nonce 7 · 给自己转 0<br/>小费更高"] --> MP
  MP -->|"出块者选费用高的"| BK["区块中只有<br/>一笔 nonce 7"]
  BK --> R1["A′ 打包：reason = repriced"]
  BK --> R2["C 打包：reason = cancelled"]
  BK --> R3["其他同 nonce 交易：reason = replaced"]
`, [
  ['flow', 'viem 的 waitForTransactionReceipt 在原 hash 长时间找不到时，会按发送者和 nonce 查找替换交易，并通过 onReplaced 回调告诉你结果。'],
  ['key', 'repriced（仅改费用）当作成功继续追踪；cancelled 要告诉用户“操作已取消”，不要显示失败。'],
  ['fail', '只盯原 hash 的实现会永远显示“处理中”。'],
  ['limit', '替换要求新交易的费用至少比原交易高约 10%（节点的替换规则，具体以客户端配置为准）。']
])}

<h2>5. 长时任务：跨链与后台追踪</h2>
<p>跨链、L2 提款到 L1、意图（intent）订单等任务可能持续几分钟到 7 天。用户会关闭页面、换设备。前端状态机必须<strong>可持久化、可恢复</strong>。</p>
${steps(['用户提交源链交易后，立即把 <code>{ id, kind, srcChainId, srcHash, createdAt, status }</code> 写入 localStorage，并（如有后端）POST 到服务器。', '页面加载时读取所有未完成任务，逐个恢复追踪：源链回执 → 跨链消息 ID → 目标链交易。', '后端用索引服务或桥的 API 持续追踪，状态变化时推送（WebSocket、邮件、Telegram）。', '任务列表页展示每个任务的阶段进度、预计剩余时间和两条链的浏览器链接。', '任务完成或超时后归档；超时任务给出人工处理入口（例如“在桥的官网手动领取”）。'])}
${code('SQL', `
-- 后端追踪表（示例）
CREATE TABLE tracked_tasks (
  id           UUID PRIMARY KEY,
  address      CHAR(42) NOT NULL,
  kind         TEXT NOT NULL,              -- 'bridge' | 'withdraw' | 'swap'
  src_chain_id INTEGER NOT NULL,
  src_tx_hash  CHAR(66) NOT NULL,
  dst_chain_id INTEGER,
  dst_tx_hash  CHAR(66),
  stage        TEXT NOT NULL,              -- 'src_pending' | 'src_confirmed' | 'relaying' | 'dst_confirmed' | 'failed'
  eta_at       TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (src_chain_id, src_tx_hash)
);
CREATE INDEX idx_tasks_addr_stage ON tracked_tasks(address, stage);
`)}

<h2>6. Gas 费展示、空状态与可访问性</h2>
<h3>算一算：一笔兑换要付多少 Gas 费（示例）</h3>
${steps(['estimateGas 返回 150,000；为避免估算不足，前端乘 1.2 作为 gas 上限：180,000。', 'estimateFeesPerGas 返回 maxFeePerGas = 30 gwei，maxPriorityFeePerGas = 1 gwei；当前 baseFee = 18 gwei。', '最高可能费用 = 180,000 × 30 gwei = 5,400,000 gwei = 0.0054 ETH。', '预计实际费用 = 150,000 × (18 + 1) gwei = 2,850,000 gwei = 0.00285 ETH。', '按 3,000 美元/ETH：显示“预计 $8.55，最高 $16.20”。只显示最高值会吓跑用户，只显示预计值会让余额不足的用户签名失败。'])}
${call('info', `<p>在 OP Stack、Arbitrum 等 L2 上，总费用 = L2 执行费 + L1 数据费。只用 estimateGas × gasPrice 会低估。viem 为 OP Stack 链提供 <code>estimateTotalFee</code> 等扩展动作；其他 L2 以其官方文档为准。</p>`)}
${tbl(['界面状态', '错误做法', '正确做法'], [
  ['加载中', '显示 0 或空白', '骨架屏，保持布局不跳动'],
  ['未连接', '整页空白', '展示公开数据 + “连接钱包查看你的仓位”'],
  ['空数据', '“暂无数据”', '说明原因并给出下一步：“你还没有交易记录，去兑换”'],
  ['错误', '弹出原始错误栈', '一句话原因 + 重试按钮；详细信息折叠'],
  ['部分失败', '整体报错', '展示成功部分，失败项单独标注']
])}
${tbl(['可访问性要求', '做法'], [
  ['状态变化要被读屏软件读出', '状态区域加 <code>aria-live="polite"</code>；错误用 <code>role="alert"</code>'],
  ['不只靠颜色', '成功/失败同时用图标和文字，色觉障碍用户也能区分'],
  ['键盘可操作', '所有按钮可 Tab 聚焦，弹窗打开时焦点进入、关闭时回到触发按钮'],
  ['按钮禁用要说明原因', '<code>aria-disabled</code> + 旁边文字“余额不足”'],
  ['尊重减少动画偏好', '<code>prefers-reduced-motion</code> 时关闭旋转动画'],
  ['地址可读', '缩写显示 + 完整地址的 title 与复制按钮']
])}
${tryit(`<p>在测试网体验替换交易：</p>${steps(['在 MetaMask 切到 Sepolia（本练习用钱包自带的“加速”按钮，不需要手动设 nonce）。', '给自己转 0.001 ETH，把小费设得很低，让它停在待处理。', '在活动列表中点击“加速”。', '在 Sepolia Etherscan 打开原交易 hash，预期看到“Replaced”或“Dropped & Replaced”提示，并指向新交易。', '思考：如果你的 DApp 只追踪原 hash，用户会看到什么？'])}`)}

${mistakes([
  ['交易“转圈圈”就够了，用户会等。', '没有阶段和预计时间，用户会重复提交或以为卡死。每个状态都要有文案和下一步。'],
  ['加速后原 hash 失败，应提示交易失败。', '加速是替换，不是失败。追踪新 hash，reason 为 repriced 时按成功流程继续。'],
  ['已打包就等于最终完成。', '链重组可能让交易回到内存池。大额与跨链要等最终确定。'],
  ['Gas 费只显示最高值最安全。', '最高值常是实际费用的两倍，会误导用户。同时显示预计值和最高值。']
])}
${recap([
  '每个交易状态都要定义：主文案、按钮状态、附加信息、出口。',
  '用一个 Toast 原地更新整笔交易的进度，附上来自链定义的浏览器链接。',
  '加速 = 同 nonce 更高费用；取消 = 同 nonce 给自己转 0。用 onReplaced 区分 repriced、cancelled、replaced。',
  '长时任务要持久化到 localStorage 和后端，页面重开后恢复追踪。',
  'Gas 费同时显示预计和最高；空、加载、错误分开设计；用 aria-live 和非颜色信号保证可访问性。'
])}
${quiz([
  { q: '用户在钱包点了“加速”，viem 的 onReplaced 返回 reason = repriced。前端应该？', o: ['显示交易失败', '继续按成功流程追踪新交易的回执', '要求用户重新提交', '断开钱包'], a: 1, why: 'repriced 表示只改了费用的同一笔操作，追踪新交易即可。cancelled 才表示操作被取消。' },
  { q: '一笔交易 estimateGas 为 100,000，baseFee 10 gwei，小费 2 gwei。预计费用是多少 ETH？', o: ['0.001', '0.0012', '0.012', '0.00012'], a: 1, why: '100,000 × 12 gwei = 1,200,000 gwei = 0.0012 ETH。' },
  { q: '跨链转账需要 20 分钟，用户中途关闭了页面。最好的设计是？', o: ['提示用户不要关闭页面', '任务写入 localStorage 和后端，重开时恢复追踪，并可推送通知', '关闭页面后任务自动失败', '让用户自己去区块浏览器查'], a: 1, why: '长时任务必须可持久化、可恢复。要求用户不关页面不现实。' },
  { q: '下面哪项最符合可访问性要求？', o: ['成功用绿色、失败用红色，不加文字', '状态区加 aria-live，成功/失败同时有图标和文字', '禁用按钮不说明原因', '只支持鼠标操作'], a: 1, why: 'aria-live 让读屏软件播报状态变化；图标加文字不依赖颜色。其他选项都会排斥部分用户。' }
])}
${exercises([["（示例）estimateGas 返回 200,000，前端乘 1.2 作为 gas 上限。maxFeePerGas = 25 gwei，baseFee = 15 gwei，小费 2 gwei，ETH 按 2,500 美元。界面应显示多少？", "<p>gas 上限 = 240,000。最高费用 = 240,000 × 25 gwei = 6,000,000 gwei = 0.006 ETH，约 15 美元。预计费用 = 200,000 × (15 + 2) gwei = 3,400,000 gwei = 0.0034 ETH，约 8.5 美元。界面显示“预计 $8.50，最高 $15.00”，两个值都要给。</p>"], ["设计一个跨链任务的持久化与恢复方案：提交时存什么、页面重开时做什么、完成或超时后怎么办？", "<p>提交源链交易后，立即把 <code>{ id, kind, srcChainId, srcHash, createdAt, status }</code> 写入 localStorage，有后端时也提交到服务器。页面加载时读取未完成任务，按源链回执、跨链消息、目标链交易的顺序恢复追踪。后端持续追踪并推送状态变化。完成或超时后归档，超时任务给出人工处理入口。</p>"], ["一笔小额兑换和一笔交易所入账，分别应该在“已打包”还是“已最终确定”时提示完成？为什么？", "<p>小额操作到“已打包”就够了。大额、跨链、交易所入账要等“已最终确定”，以太坊约 13 分钟。原因是链重组可能让已打包的交易回到内存池。状态机里要保留“已打包 → 待打包”这条分支。</p>"]])}
${checklist(["能为交易状态机的每个状态写出主文案、按钮状态、附加信息和出口。", "能用 useWaitForTransactionReceipt 的 onReplaced 区分 repriced、cancelled 和 replaced。", "能用一个 Toast 原地更新整笔交易的进度，并用链定义的 blockExplorers 生成浏览器链接。", "能把跨链等长时任务持久化到 localStorage 和后端，并在页面重开后恢复追踪。", "能同时展示预计和最高 Gas 费，并用 aria-live 和 role=alert 播报状态变化。"])}
${terms([
  ['交易替换', 'Transaction Replacement', '用相同 nonce、更高费用的新交易取代待处理交易'],
  ['取消交易', 'Cancel Transaction', '用相同 nonce 给自己转 0 ETH 的替换交易'],
  ['已丢弃', 'Dropped', '交易长时间未打包并从内存池中消失'],
  ['Toast', 'Toast Notification', '自动消失的轻提示'],
  ['aria-live', 'ARIA Live Region', '让读屏软件自动播报内容变化的属性'],
  ['L1 数据费', 'L1 Data Fee', 'Rollup 把交易数据发布到 L1 的成本，计入 L2 总费用']
])}
` });

CUR = 'm07-8';
addCh({ id: 'm07-8', nav: '前端安全', title: 'M03.8 前端安全：供应链、域名劫持、前端篡改与防护', desc: '从 Ledger Connect Kit 和 Bybit 事件学威胁模型，落地 SRI、CSP、IPFS 与发布流程。', html: `
<h1>M03.8 前端安全：供应链、域名劫持、前端篡改与防护</h1>
${meta(['画出 DApp 前端的威胁模型，说出五类攻击的入口和真实案例。', '配置依赖锁定、SRI、CSP、IPFS 部署，并实现地址校验和合约地址校验。', '制定一份可执行的安全发布流程清单。'], '<a href="#m07-6">M03.6 签名与登录</a>、<a href="#m00-6">M00.6 安全第一课</a>')}
${beginner(`<p><strong>供应链攻击（Supply Chain Attack）</strong>：不直接攻击你，而是攻击你依赖的第三方代码包，让恶意代码随依赖进入你的网站。</p>
<p><strong>DNS（域名系统）</strong>：把域名翻译成服务器 IP 的系统。DNS 被篡改，用户输入正确域名也会打开假网站。</p>
<p><strong>XSS（跨站脚本）</strong>：攻击者设法让自己的 JavaScript 在你的网页里执行。</p>
<p><strong>CSP（内容安全策略）</strong>：服务器告诉浏览器“本页只允许从哪些地方加载脚本、连接哪些服务器”的响应头。</p>
<p><strong>哈希（Hash）</strong>：文件的“指纹”。文件改动一个字节，哈希就完全不同（见 <a href="#m00-2">M00.2 哈希函数</a>）。</p>`)}

<h2>1. 一句话理解</h2>
${one('合约再安全，前端被篡改也会丢钱：用户信任的是“这个网页让我签的东西”。前端安全的目标是保证用户签名的内容就是他以为的内容。')}
${call('analogy', `<p>合约是银行金库，前端是银行大厅的柜台。金库再坚固，如果有人把柜台上的收款二维码换成自己的，客户还是会把钱转给骗子。</p>
<p>类比的局限：银行大厅有保安和监控。DApp 前端是静态文件，被替换后可能几个小时都没人发现。</p>`)}
${art('一图看懂：代码到浏览器要过五道关，任何一环被换，用户签的就是攻击者的内容', 660, 296, [
  S.box(10, 40, 88, 62, { k: 'tint', t: 'npm', s: '依赖包' }),
  S.box(120, 40, 88, 62, { k: 'tint', t: '开发机', s: '与 CI' }),
  S.box(230, 40, 88, 62, { k: 'tint', t: '托管', s: '线上' }),
  S.box(340, 40, 88, 62, { k: 'tint', t: '域名', s: 'DNS' }),
  S.box(450, 40, 88, 62, { k: 'key', t: '浏览器', s: '代码在此跑' }),
  S.box(560, 40, 88, 62, { k: 'ok', t: '钱包', s: '用户签名' }),
  S.arrow(99, 71, 118, 71),
  S.arrow(209, 71, 228, 71),
  S.arrow(319, 71, 338, 71),
  S.arrow(429, 71, 448, 71),
  S.arrow(539, 71, 558, 71),
  S.arrow(54, 168, 54, 106, { k: 'risk', dash: 1 }),
  S.arrow(164, 168, 164, 106, { k: 'risk', dash: 1 }),
  S.arrow(274, 168, 274, 106, { k: 'risk', dash: 1 }),
  S.arrow(384, 168, 384, 106, { k: 'risk', dash: 1 }),
  S.arrow(494, 168, 494, 106, { k: 'risk', dash: 1 }),
  S.arrow(604, 168, 604, 106, { k: 'ok', dash: 1 }),
  S.box(10, 170, 88, 66, { k: 'risk', t: '① 投毒', s: 'Ledger 2023\nConnect Kit' }),
  S.box(120, 170, 88, 66, { k: 'risk', t: '② 入侵', s: 'Bybit 2025\n入口：开发机' }),
  S.box(230, 170, 88, 66, { k: 'risk', t: '③ 被替换', s: 'BadgerDAO\n2021' }),
  S.box(340, 170, 88, 66, { k: 'risk', t: '④ 劫持', s: 'Curve 2022\nBalancer' }),
  S.box(450, 170, 88, 66, { k: 'risk', t: '⑤ XSS', s: '恶意第三方\n脚本' }),
  S.box(560, 170, 88, 66, { k: 'ok', t: '最后防线', s: '看清再签\n硬件钱包核对' }),
  S.text(330, 272, '浏览器里跑的是什么代码，用户并不知道；每一环都要有对应防护', { size: 13, anchor: 'middle', mw: 620 })
], [ ['flow', '代码从依赖、开发机、托管、域名一路走到浏览器，最后才轮到钱包签名。'], ['risk', '五个红框是五个入口，下面写的是公开报道过的真实事件；任何一个得手，浏览器执行的就是攻击者的代码。'], ['key', '浏览器是攻击真正生效的地方：恶意代码能替换收款地址、spender 或签名内容。'], ['limit', '钱包是最后一道防线，但用户常常看不懂签名内容，所以前端要在签名前先解释清楚。'] ], '代码依次经过 npm 依赖、开发机与 CI、托管、域名 DNS、浏览器到达钱包，五个环节各有一类攻击入口，钱包是最后一道防线', 'm07-8')}

<h2>2. 威胁模型</h2>
${mm('DApp 前端威胁模型', `
flowchart TB
  NPM["npm 依赖"] --> DEV["开发者电脑<br/>与 CI"]
  DEV --> BUILD["构建产物 JS"]
  BUILD --> HOST["托管 S3 / Vercel / IPFS"]
  DNS["域名与 DNS"] --> HOST
  HOST --> BR["用户浏览器"]
  TP["第三方脚本<br/>统计 · 客服 · CDN"] --> BR
  BR --> WAL["钱包签名"]
  A1["① 依赖投毒"] -.-> NPM
  A2["② 开发机或 CI 被入侵"] -.-> DEV
  A3["③ 托管文件被替换"] -.-> HOST
  A4["④ DNS 劫持"] -.-> DNS
  A5["⑤ XSS 与恶意第三方脚本"] -.-> BR
  A5 -.-> TP
`, [
  ['flow', '依赖先进入开发机与 CI，再经过构建、托管、DNS 到达浏览器（与上面总图的顺序一致），任何一环被篡改，最终在浏览器执行的都是攻击者的代码。'],
  ['risk', '恶意代码最常见的动作：替换交易的收款地址或 spender；弹出伪造的授权请求；替换签名内容。'],
  ['key', '防护要分层：每一环都有对应手段，没有一个手段能单独解决问题。'],
  ['limit', '钱包是最后一道防线，但用户常常不看或看不懂签名内容。']
])}
${tbl(['事件', '年份', '攻击入口', '损失量级（公开报道）'], [
  ['BadgerDAO 前端注入', '2021 年 12 月', '攻击者利用 Cloudflare 账户问题取得未经授权的 API Key，经 Cloudflare Workers 向页面注入脚本，诱导用户无限授权', '约 1.2 亿美元（各方估算 1.2–1.3 亿美元不等）' + cite('CoinDesk：BadgerDAO 公布被盗细节', 'https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m')],
  ['Curve Finance DNS 劫持', '2022 年 8 月', '域名服务商 DNS 被篡改，指向克隆站', '约 57 万美元' + cite('The Block：Curve Finance 前端被劫持', 'https://www.theblock.co/post/162604/curve-finance-resolves-hack-from-earlier-today')],
  ['Ledger Connect Kit 投毒', '2023 年 12 月', '前员工的 npm 账号被钓鱼，恶意版本注入钱包抽干脚本，影响所有使用该连接库的 DApp 约 5 小时' + cite('Ledger：Connect Kit 安全事件报告', 'https://www.ledger.com/blog/security-incident-report'), '约 60 万美元（媒体估算）' + cite('BleepingComputer：Ledger 供应链攻击', 'https://www.bleepingcomputer.com/news/security/ledger-dapp-supply-chain-attack-steals-600k-from-crypto-wallets/')],
  ['Balancer DNS 劫持', '2023 年 9 月', '社会工程攻击域名注册商', '约 24 万美元（PeckShield 估算）' + cite('The Block：Balancer 遭 DNS 攻击', 'https://www.theblock.co/post/251970/balancer-dns-attack-frontend')],
  ['Bybit 冷钱包被盗', '2025 年 2 月', 'Safe{Wallet} 开发者电脑被入侵，托管在云存储上的前端 JS 被注入只针对 Bybit 的恶意代码。签名人看到正常界面，实际签署了修改钱包合约逻辑的交易', '约 15 亿美元（史上最大加密货币盗窃之一）' + cite('The Block：Safe 开发者电脑被入侵导致 Bybit 被盗', 'https://www.theblock.co/post/343530/lazarus-appears-to-compromise-safe-developer-machine-in-lead-up-to-1-5-billion-bybit-hack-report')],
  ['npm 常用包被劫持', '2025 年 9 月', 'chalk、debug 等高下载量包的维护者账号被钓鱼，恶意版本在浏览器里拦截钱包请求并替换收款地址' + cite('Check Point：2025 年 9 月 npm 供应链攻击', 'https://blog.checkpoint.com/crypto/the-great-npm-heist-september-2025/'), '发现和下架较快，公开报道中未见大额损失']
])}
${call('warn', `<p>Bybit 事件的教训：<strong>多签也会被前端攻破</strong>。所有签名人使用同一个被篡改的网页，看到同样被伪造的信息。大额操作必须用独立渠道核对原始交易数据（例如在硬件钱包屏幕上核对 calldata 哈希，或用另一套工具独立解码）。</p>`)}

<h2>3. 防护一：依赖、SRI 与 CSP</h2>
${steps(['<strong>锁版本</strong>：package.json 用精确版本（不加 ^ ~），提交 lockfile，CI 用 <code>npm ci</code>（严格按 lockfile 安装）。', '<strong>审查更新</strong>：依赖升级走单独 PR，评审 lockfile 差异；新包检查维护者、下载量、发布时间；对新发布不足数天的版本保持观望。', '<strong>禁用安装脚本</strong>：<code>npm ci --ignore-scripts</code>，只对确实需要的包放行。', '<strong>自动扫描</strong>：<code>npm audit</code>、GitHub Dependabot 或供应链扫描工具接入 CI。', '<strong>最小依赖</strong>：能用 viem 自带工具解决的，不额外引入小包。'])}
<p><strong>SRI（子资源完整性）</strong>：给外部脚本加上哈希，浏览器下载后核对，哈希不符就拒绝执行。</p>
${code('BASH', `
# 生成 SRI 哈希
openssl dgst -sha384 -binary vendor.js | openssl base64 -A
# 在 HTML 中使用（CDN 文件被篡改时浏览器拒绝执行）
# 注意：下方 CSP 是 script-src 'self'，要从 CDN 加载就必须把 https://cdn.example.com 加进 script-src；
# 更推荐把 vendor.js 自托管到同源，SRI 主要用于确实无法自托管的外部脚本
# <script src="https://cdn.example.com/vendor.js"
#         integrity="sha384-（上面输出的值）" crossorigin="anonymous"></script>
`)}
${code('TYPESCRIPT', `
// next.config.ts —— 设置安全响应头（CSP 白名单按项目实际调整，示例）
const csp = [
  "default-src 'self'",
  "script-src 'self'",                               // 只允许同源脚本；需要内联时用 nonce，确需外部 CDN 时显式加域名并配 SRI
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https://base-mainnet.g.alchemy.com https://api.example.com wss://relay.walletconnect.com wss://relay.walletconnect.org https://*.walletconnect.com",
  "frame-src https://verify.walletconnect.com",
  "frame-ancestors 'none'",                          // 禁止被 iframe 嵌入，防点击劫持
  "base-uri 'self'", "form-action 'self'",
].join('; ')

export default {
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }]
  },
}
`)}
${call('info', `<p>CSP 的 <code>connect-src</code> 是 DApp 的关键：即使恶意脚本混进来，它也无法把数据发往白名单之外的服务器。WalletConnect 等服务需要的域名以其官方文档为准，上线前在浏览器控制台检查有没有被 CSP 拦截的请求。</p>`)}

<h2>4. 防护二：IPFS 部署、签名前解释、地址校验</h2>
<p><strong>IPFS 部署</strong>：把构建产物上传 IPFS，得到<strong>内容标识符 CID</strong>（内容哈希）。内容变，CID 就变。把 CID 写入 ENS 域名的 contenthash，用户通过 eth.limo 等网关或支持 IPFS 的浏览器访问。任何人都能重新构建并比对 CID，确认前端没被篡改（CIDv0 与 CIDv1 的区别、为什么同一文件可能得到不同 CID，见 <a href="#m09-3">M14.3 去中心化存储与 DePIN</a>）。</p>
${mm('签名前的交易解释流程', `
flowchart LR
  REQ["前端构造交易<br/>to · data · value"] --> DEC["用 ABI 解码 calldata<br/>函数名 + 参数"]
  DEC --> CHK{"to 与 spender<br/>在白名单？"}
  CHK -->|"否"| BLOCK["阻止并告警"]
  CHK -->|"是"| SIM["模拟执行<br/>得到资产变化"]
  SIM --> SHOW["人话展示<br/>你将付出 · 你将收到 · 授权给谁"]
  SHOW --> SIGN["用户在钱包签名"]
`, [
  ['flow', '前端在交给钱包之前，先自己解码和模拟，把“资产变化”展示给用户。'],
  ['key', '白名单检查放在前端代码里，并且白名单本身要硬编码在构建产物中，不从远程加载。'],
  ['limit', '如果前端本身已被篡改，这些检查也可能被删除。所以还需要钱包侧的模拟和硬件钱包核对。'],
  ['risk', '只展示“函数名”不够。approve 的 spender 和金额才是风险所在。']
])}
${code('TYPESCRIPT', `
import { getAddress, isAddressEqual, keccak256 } from 'viem'

// 1. 地址校验和（EIP-55）：大小写混合编码了校验信息，手抄错一位会被发现
getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
// → '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

// 2. 合约地址按链硬编码，不从 URL 参数或远程配置读取
export const ADDRESSES = {
  8453: { router: getAddress('0x2626664c2603336E57B271c5C0b26F421741e481'), usdc: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') },
} as const

// 3. 完整比对，不只看前后几位
export const sameAddr = (a: string, b: string) => isAddressEqual(a as \`0x\${string}\`, b as \`0x\${string}\`)

// 4. 启动时校验链上代码哈希（非代理合约），防止配置被替换成恶意合约
export async function verifyCode(client: any, addr: \`0x\${string}\`, expectedCodeHash: \`0x\${string}\`) {
  const code = await client.getCode({ address: addr })
  if (!code || keccak256(code) !== expectedCodeHash) throw new Error('合约代码不匹配：' + addr)
}
`)}
<h3>算一算：为什么“只看前 4 位和后 4 位”不安全（示例）</h3>
${steps(['地址是 40 个十六进制字符。固定前 4 位和后 4 位，共 8 个字符。', '随机生成一个地址正好匹配的概率是 1 / 16<sup>8</sup> = 1 / 4,294,967,296。', '一块消费级 GPU 每秒可尝试数亿个地址（示例：5 × 10<sup>8</sup> 次/秒）。', '期望时间 = 4.29 × 10<sup>9</sup> ÷ 5 × 10<sup>8</sup> ≈ 8.6 秒。', '结论：攻击者几秒钟就能造出“前后相同”的假地址，这就是<strong>地址投毒</strong>。必须完整比对 40 个字符，或用 isAddressEqual。'])}

<h2>5. 安全发布流程</h2>
${steps(['代码合并需要至少 1 名评审；涉及合约地址、ABI、CSP、依赖的改动需要 2 名评审。', 'CI 在隔离环境用 <code>npm ci --ignore-scripts</code> 构建，开发者电脑不直接部署生产。', '构建可复现：固定 Node 版本与依赖版本，同一 commit 两次构建产物哈希一致。', '记录产物哈希（或 IPFS CID），发布到公开渠道（GitHub Release），供第三方比对。', '部署凭证（云存储、DNS、Vercel Token）最小权限、硬件密钥二次验证、定期轮换。', 'DNS 开启注册商锁（Registrar Lock）和 DNSSEC，域名服务商账号开启硬件密钥登录。', '线上监控：定时拉取线上 JS 计算哈希，与发布记录比对，不一致立即告警。', '应急预案：发现篡改后 15 分钟内下线或切到 IPFS 版本，通过官方社交账号通知用户撤销授权。'])}
${tryit(`<p>检查一个真实 DApp 的安全头：</p>${steps(['在终端运行 <code>curl -sI https://app.uniswap.org | grep -i -E "content-security|strict-transport|x-frame|referrer"</code>。', '记录它设置了哪些安全响应头。', '在浏览器打开该站，F12 → Network，刷新页面，观察 JS 文件来自哪些域名。', '预期结果：能看到 HSTS 等安全头；把观察到的外部域名和它的 CSP 白名单对照。'])}`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['依赖精确版本 + lockfile + npm ci', '防投毒版本自动进入', 'CI 日志显示 npm ci；lockfile 改动有评审记录'],
  ['严格 CSP（connect-src 白名单）', '限制恶意脚本外传和加载', 'securityheaders 类工具评分；控制台无违规'],
  ['外部脚本全部 SRI 或自托管', '防 CDN 被篡改', '构建产物中外部 script 均有 integrity'],
  ['合约地址硬编码 + 校验和 + 代码哈希校验', '防配置被替换', '单元测试 + 启动校验'],
  ['签名前解码与模拟展示', '让用户看清授权内容', 'E2E：approve 弹窗前出现 spender 与金额'],
  ['线上产物哈希监控', '尽早发现篡改', '每 5 分钟比对一次，不一致触发告警（示例）'],
  ['DNS 注册商锁 + DNSSEC + 硬件密钥', '防域名劫持', '注册商后台截图审计']
])}

${mistakes([
  ['合约审计过了，前端就无所谓。', '前端被篡改可以让用户把钱签给攻击者，合约完全按规则执行。'],
  ['用了多签就不怕前端攻击。', 'Bybit 事件中所有签名人看到的是同一个被篡改的界面。要独立核对原始交易数据。'],
  ['比对地址前几位和后几位就够了。', '攻击者几秒钟就能生成前后相同的假地址。必须完整比对。'],
  ['IPFS 部署就绝对安全。', 'IPFS 保证内容与 CID 对应，但用户可能访问被篡改的 ENS 记录或钓鱼网关。仍需公开 CID 并监控。']
])}
${recap([
  '前端威胁五类：依赖投毒、开发机/CI 入侵、托管文件替换、DNS 劫持、XSS 与恶意第三方脚本。',
  '每个入口都有真实案例：① 依赖投毒——2023 Ledger Connect Kit、2025 年 9 月 npm 包劫持；② 开发机入侵——2025 Bybit（入口是 Safe 开发机，被改的是托管 JS）；③ 托管内容被替换——2021 BadgerDAO（经 Cloudflare Workers 注入脚本）；④ DNS 劫持——2022 Curve、2023 Balancer；⑤ 恶意脚本——上述事件最终都表现为浏览器里执行了攻击者的脚本。',
  '依赖：精确版本、lockfile、npm ci、禁用安装脚本、更新评审；外部脚本用 SRI；用严格 CSP 限制 connect-src。',
  '签名前解码与模拟；地址用校验和并完整比对；合约地址硬编码并校验代码哈希。',
  '发布流程：评审、CI 隔离构建、可复现、公开哈希、DNS 加固、线上哈希监控、应急预案。'
])}
${quiz([
  { q: '恶意脚本混入页面后，哪项配置最能阻止它把用户数据发到攻击者服务器？', o: ['HSTS', 'CSP 的 connect-src 白名单', 'Referrer-Policy', '把按钮颜色改成红色'], a: 1, why: 'connect-src 限制 fetch/WebSocket 等连接的目标。HSTS 强制 HTTPS，Referrer-Policy 控制来源头，都不能阻止外传。' },
  { q: '2025 年 Bybit 事件中，攻击者主要篡改了哪一环？', o: ['以太坊共识层', 'Safe 合约代码', 'Safe{Wallet} 托管的前端 JS', 'Bybit 的 DNS'], a: 2, why: '攻击者入侵开发者电脑后，向托管在云存储上的 Safe 前端 JS 注入针对 Bybit 的恶意代码。入口是开发机（总图 ②），被篡改的是托管的 JS（总图 ③ 那一环）。合约本身没有漏洞。' },
  { q: '固定地址前 4 位和后 4 位，随机匹配的概率是？', o: ['1/65,536', '1/16,777,216', '1/4,294,967,296', '1/2<sup>160</sup>'], a: 2, why: '8 个十六进制字符，16<sup>8</sup> = 4,294,967,296。GPU 几秒钟就能碰撞出来。' },
  { q: '下面哪个做法能让第三方验证你的前端没有被篡改？', o: ['在页面写“本站安全”', '构建可复现，并公开产物哈希或 IPFS CID', '使用更复杂的混淆', '关闭开发者工具'], a: 1, why: '可复现构建 + 公开哈希让任何人都能独立比对。声明和混淆不能提供可验证的保证。' }
])}
${exercises([["（示例）如果用户比对地址的前 6 位和后 6 位，攻击者每秒尝试 5 × 10^8 个地址，期望多久能造出一个匹配的假地址？结论是什么？", "<p>固定 12 个十六进制字符，概率是 1 / 16^12 = 1 / 281,474,976,710,656。期望时间约 2.81 × 10^14 ÷ 5 × 10^8 ≈ 562,950 秒，约 6.5 天。这对专门的攻击者仍然可行。所以必须完整比对 40 个字符，或用 <code>isAddressEqual</code>。</p>"], ["线上监控告警：线上 JS 的哈希与发布记录不一致。写出你的应急步骤，以及平时要做哪些准备才能发现它。", "<p>发现篡改后，15 分钟内下线或切到 IPFS 版本。通过官方社交账号通知用户撤销授权。平时要做到构建可复现，并把产物哈希或 IPFS CID 发布到公开渠道。再定时拉取线上 JS 计算哈希，与发布记录比对，不一致立即告警。</p>"], ["为什么路由合约等地址要按链硬编码在构建产物里，而不是从 URL 参数或远程配置读取？还可以加哪一道校验？", "<p>URL 参数和远程配置都可以被攻击者控制，替换后用户会把钱签给恶意合约。硬编码并用 <code>getAddress</code> 保存为校验和格式，能防止配置被替换和手抄出错。对非代理合约，还可以在启动时用 <code>getCode</code> 读取链上代码，比对 keccak256 代码哈希，不一致就报错。</p>"]])}
${checklist(["能画出前端威胁模型，说出五类攻击入口，并各举一个真实案例。", "能配置精确版本、lockfile、npm ci --ignore-scripts 的依赖策略。", "能为外部脚本生成 SRI 哈希，并写出带 connect-src 白名单的 CSP。", "能用 getAddress 和 isAddressEqual 做地址校验和完整比对。", "能列出包含评审、隔离构建、可复现、公开哈希、DNS 加固和线上哈希监控的发布流程。"])}
${terms([
  ['供应链攻击', 'Supply Chain Attack', '通过篡改依赖或构建环境把恶意代码带进产品的攻击'],
  ['SRI', 'Subresource Integrity', '浏览器校验外部资源哈希的机制'],
  ['CSP', 'Content Security Policy', '限制页面可加载与连接的来源的响应头'],
  ['DNS 劫持', 'DNS Hijacking', '篡改域名解析，把用户引到假网站'],
  ['XSS', 'Cross-Site Scripting', '让攻击者脚本在目标网页中执行的漏洞'],
  ['CID', 'Content Identifier', 'IPFS 中由内容哈希生成的标识符'],
  ['EIP-55', 'Mixed-case Checksum Address', '用大小写编码校验信息的地址格式'],
  ['地址投毒', 'Address Poisoning', '用前后字符相同的假地址诱导用户转错账']
])}
` });

CUR = 'm07-9';
addCh({ id: 'm07-9', nav: '性能与工程化', title: 'M03.9 性能与工程化：数据层、缓存、测试、CI/CD 与监控', desc: '让 DApp 快、稳、可测、可观测：缓存策略、包体积、anvil E2E、埋点告警与国际化。', html: `
<h1>M03.9 性能与工程化：数据层、缓存、测试、CI/CD 与监控</h1>
${meta(['设计 DApp 的数据层与 TanStack Query 缓存策略，并控制包体积。', '用 vitest、组件测试和 Playwright + anvil 搭建三层测试。', '配置 CI/CD 预览环境、前端监控指标与告警，以及国际化。'], '<a href="#m07-3">M03.3 读合约</a>、<a href="#m07-7">M03.7 交易状态与 UX</a>')}
${beginner(`<p><strong>包体积（Bundle Size）</strong>：用户首次打开网站要下载的 JS 大小。越大越慢，手机上尤其明显。</p>
<p><strong>单元测试（Unit Test）</strong>：测试一个函数是否正确。<strong>E2E 测试（端到端）</strong>：用程序控制真实浏览器，从用户角度走一遍流程。</p>
<p><strong>anvil</strong>：Foundry 提供的本地以太坊节点，可以“分叉”主网状态在本地运行（见 <a href="#m02-4">M02.4 开发工具链</a>）。</p>
<p><strong>CI/CD（持续集成/持续部署）</strong>：每次提交代码自动测试、构建、部署的流水线。</p>
<p><strong>埋点（Instrumentation）</strong>：在代码里记录关键事件和指标，用于监控和分析。</p>`)}

<h2>1. 一句话理解</h2>
${one('工程化的目标是：数据从最便宜的地方取，缓存在最合适的层，每次改动自动在“真实的链”上测一遍，上线后出问题第一时间知道。')}
${call('analogy', `<p>开一家连锁餐厅：中央厨房预制半成品（索引服务），门店冰箱放常用食材（缓存），新菜上市前在试营业门店先做一轮（预览环境 + E2E），每桌的等待时间和退菜率都有记录（监控）。</p>
<p>类比的局限：餐厅食材不会“回滚”。链上数据会因重组回滚，缓存和索引都要能处理。</p>`)}
${art('一图看懂：三类数据走三条路，统一缓存在 TanStack Query', 660, 292, [
  S.box(230, 30, 200, 44, { k: 'tint', icon: 'code', t: 'React 组件', s: '只管显示' }),
  S.box(110, 108, 440, 54, { k: 'key', icon: 'db', t: 'TanStack Query 缓存', s: '浏览器内存 · 去重 · 按区块失效' }),
  S.arrow(330, 76, 330, 106),
  S.arrow(110, 164, 110, 204, { label: '当前状态' }),
  S.arrow(330, 164, 330, 204, { label: '历史 · 列表' }),
  S.arrow(550, 164, 550, 204, { label: '价格 · 配置' }),
  S.box(10, 206, 200, 56, { k: 'info', icon: 'link', t: 'RPC + multicall', s: '最新，但最贵', tag: '实时' }),
  S.box(230, 206, 200, 56, { k: 'info', icon: 'db', t: '索引服务', s: 'GraphQL · 按条件查', tag: '有延迟' }),
  S.box(450, 206, 200, 56, { k: 'ok', icon: 'cloud', t: '后端 + CDN', s: 'REST · 所有人相同', tag: '可缓存' }),
  S.text(330, 284, '数据从最便宜的地方取；链上会重组，缓存和索引都要能回滚', { size: 13, anchor: 'middle', mw: 620 })
], [ ['flow', '当前状态走 RPC，历史和列表走索引服务，价格和代币列表走带 CDN 的后端；三条路都先过同一层缓存。'], ['key', 'TanStack Query 是统一的前端缓存层，wagmi Hook 和自己写的 useQuery 共享同一个 QueryClient。'], ['fail', '索引服务有延迟，刚完成的交易可能不在列表里，要把本地待确认交易合并进来。'], ['limit', 'CDN 缓存只适合所有人都一样的数据，不能缓存用户私有数据。'] ], 'React 组件通过 TanStack Query 缓存层取数据，当前状态来自 RPC，历史和列表来自索引服务，价格和配置来自带 CDN 的后端', 'm07-9')}

<h2>2. 数据层与缓存策略</h2>
${mm('DApp 数据层分工', `
flowchart LR
  UI["React 组件"] --> TQ["TanStack Query 缓存<br/>浏览器内存"]
  TQ -->|"当前状态"| RPC["RPC<br/>multicall"]
  TQ -->|"历史 · 列表 · 聚合"| GQL["索引服务<br/>GraphQL"]
  TQ -->|"价格 · 代币列表 · 报价"| API["后端 REST<br/>CDN 缓存"]
  API --> CDN["CDN<br/>s-maxage · stale-while-revalidate"]
  GQL --> DB[("索引数据库")]
  DB -.->|"扫块"| RPC
`, [
  ['flow', '三类数据三条路：当前状态走 RPC，历史和列表走索引，价格和静态配置走带 CDN 缓存的 REST。'],
  ['key', 'TanStack Query 是统一的前端缓存层。wagmi Hook 和自己写的 useQuery 共享同一个 QueryClient。'],
  ['fail', '索引服务延迟时，刚完成的交易不在列表中。要把本地待确认交易合并展示。'],
  ['limit', 'CDN 缓存适合所有用户相同的数据（价格、代币列表），不适合用户私有数据。']
])}
${tbl(['参数', '含义', 'DApp 建议值（示例）'], [
  ['queryKey', '缓存的键，必须包含所有影响结果的变量', '包含 chainId、地址、合约、参数'],
  ['staleTime', '多久内视为新鲜、不重新请求', '静态 Infinity；余额 10s；价格按上图走后端 REST 时与 CDN 的 s-maxage 对齐（例如 15s），只有直接读链上池子时才设 0、随新区块刷新'],
  ['gcTime', '不再使用的缓存保留多久（v5 名称，旧名 cacheTime）', '默认 5 分钟即可'],
  ['refetchOnWindowFocus', '切回页面时是否刷新', '余额、仓位开启；静态数据关闭'],
  ['placeholderData: keepPreviousData', '参数变化时先显示旧数据', '报价、分页列表，避免闪烁'],
  ['retry', '失败重试次数', 'RPC 读 2 次；用户拒签 0 次']
])}
${code('TYPESCRIPT', `
// 分页加载交易历史：后端 /api/history 代为查询索引服务（GraphQL），前端只调这个 REST 接口，
// 结果由 TanStack Query 缓存（这样 API Key 和查询语句留在服务器，前端也方便换索引服务）
import { useInfiniteQuery } from '@tanstack/react-query'

export function useSwapHistory(address?: string, chainId?: number) {
  return useInfiniteQuery({
    queryKey: ['swapHistory', chainId, address],
    enabled: !!address,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const res = await fetch(\`/api/history?chain=\${chainId}&addr=\${address}&cursor=\${pageParam ?? ''}\`)
      if (!res.ok) throw new Error('history ' + res.status)
      return res.json() as Promise<{ items: SwapItem[]; next: string | null }>
    },
    getNextPageParam: last => last.next,            // 游标分页，比 offset 更稳定
    staleTime: 15_000,
  })
}
`)}

<h2>3. SSR/SSG 与包体积优化</h2>
<p>SSR 能让首屏更快、SEO 更好，但服务器不知道用户的钱包。原则：<strong>公开数据在服务器预取，钱包相关数据在客户端获取</strong>。TanStack Query 支持在服务端组件里 prefetch，再用 <code>HydrationBoundary</code> + <code>dehydrate</code> 把缓存交给浏览器。</p>
${code('TYPESCRIPT', `
// 动态加载钱包弹窗：首屏不下载钱包库，用户点击“连接”后才加载
import dynamic from 'next/dynamic'
const ConnectModal = dynamic(() => import('@/features/wallet/ConnectModal'), {
  ssr: false,                                        // 钱包 UI 只在浏览器运行
  loading: () => <button disabled>加载中…</button>,
})

// viem 按需引入：只导入用到的函数和链，打包器会摇掉其余部分
import { formatUnits } from 'viem'
import { base } from 'viem/chains'

// next.config.ts：对大型库启用按需导入优化，并用 @next/bundle-analyzer 查看体积
// experimental: { optimizePackageImports: ['@reown/appkit', 'lodash-es'] }
`)}
<h3>算一算：动态加载钱包库能省多少（示例）</h3>
${steps(['假设首屏 JS 共 600 KB（gzip 后），其中钱包连接库和 WalletConnect 依赖约 250 KB。', '4G 网络有效下载速度按 1.5 MB/s 计：600 KB 约 0.40 秒，去掉 250 KB 后 350 KB 约 0.23 秒。', '解析与执行 JS 在中端手机上约 1 ms/KB：600 KB 约 600 ms，350 KB 约 350 ms。', '合计首屏可交互时间从约 1.0 秒降到约 0.58 秒，快了约 42%。', '代价：用户第一次点击“连接”时多等约 0.3 秒，可在鼠标悬停按钮时预加载来抵消。'])}

<h2>4. 测试：单元、组件、E2E</h2>
${mm('三层测试金字塔', `
flowchart TB
  E2E["E2E：Playwright + anvil 分叉主网<br/>连接 · 授权 · 兑换 全流程<br/>数量少 · 最慢 · 最真实"]
  CMP["组件测试：Testing Library + wagmi mock 连接器<br/>按钮状态 · 错误文案"]
  UNIT["单元测试：vitest<br/>金额格式化 · 滑点 · 错误解析<br/>数量多 · 毫秒级"]
  UNIT --> CMP --> E2E
`, [
  ['flow', '底层测纯函数，中层测组件在不同钱包状态下的表现，顶层在真实链状态上走完整流程。'],
  ['key', 'anvil --fork-url 把主网状态复制到本地：真实的 Uniswap 池子、真实的 USDC 合约，但交易免费、可回滚。'],
  ['fail', 'E2E 依赖外部 RPC 分叉，网络抖动会导致不稳定。固定 fork 区块号并缓存，可以让结果可复现。'],
  ['limit', 'mock 连接器跳过了真实钱包弹窗。钱包本身的交互只能用 Synpress 等工具驱动真实扩展，或人工测试。']
])}
${code('TYPESCRIPT', `
// 单元测试：src/lib/format.test.ts（vitest）
import { describe, it, expect } from 'vitest'
import { formatAmount, minOut } from './format'

describe('formatAmount', () => {
  it('向下截断，不四舍五入', () => expect(formatAmount(1234567891n, 6, 2)).toBe('1,234.56'))
  it('极小值显示小于号', () => expect(formatAmount(300n, 18, 6)).toBe('< 0.000001'))
})
describe('minOut', () => {
  it('0.5% 滑点', () => expect(minOut(1_000_000n, 50n)).toBe(995_000n))
})

// wagmi 测试配置：用 mock 连接器模拟“已连接的钱包”，连接本地 anvil
import { createConfig, http } from 'wagmi'
import { mock } from 'wagmi/connectors'
import { foundry } from 'wagmi/chains'
export const testConfig = createConfig({
  chains: [foundry],
  connectors: [mock({ accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'] })], // anvil 默认账户 0
  transports: { [foundry.id]: http('http://127.0.0.1:8545') },
})
`)}
${code('BASH', `
# E2E：启动分叉主网的本地链（固定区块号保证可复现）
anvil --fork-url $MAINNET_RPC --fork-block-number 21000000 --chain-id 31337 &
# 给测试账户充 USDC：模拟一个大户地址并转账（cast 命令）
cast rpc anvil_impersonateAccount $USDC_WHALE
cast send $USDC "transfer(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 10000000000 \\
  --from $USDC_WHALE --unlocked --rpc-url http://127.0.0.1:8545
# 以测试模式启动前端（NEXT_PUBLIC_E2E=1 时使用 testConfig），运行 Playwright
NEXT_PUBLIC_E2E=1 npx playwright test
`)}

<h2>5. CI/CD、监控与国际化</h2>
${code('YAML', `
# .github/workflows/ci.yml（示例）
name: ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci --ignore-scripts
      - run: npm run lint && npm run typecheck
      - run: npx vitest run
      - uses: foundry-rs/foundry-toolchain@v1
      - run: anvil --fork-url \${{ secrets.MAINNET_RPC }} --fork-block-number 21000000 &
      - run: npx playwright install --with-deps chromium && npm run build && npx playwright test
# 预览环境：Vercel 等平台为每个 PR 生成独立 URL，评审人在测试网上点一遍
`)}
${tbl(['指标名（示例）', '含义', '告警阈值（示例）'], [
  ['<code>rpc_request_error_rate</code>', 'RPC 请求失败比例（按链、按服务商）', '5 分钟内 &gt; 5%'],
  ['<code>rpc_latency_p95_ms</code>', 'RPC 请求 P95 延迟', '&gt; 1,500 ms 持续 10 分钟'],
  ['<code>wallet_connect_success_rate</code>', '点击连接到连接成功的比例', '&lt; 80%（排除用户拒绝）'],
  ['<code>tx_user_rejected_total</code>', '用户拒签次数', '只看趋势，不告警'],
  ['<code>tx_reverted_rate</code>', '已上链交易中 revert 的比例', '&gt; 2%'],
  ['<code>tx_simulation_failed_total</code>', '模拟失败次数（按错误名）', '某错误名 1 小时内突增 5 倍'],
  ['<code>js_error_rate</code>', '前端未捕获异常（Sentry 等）', '新版本发布后 &gt; 1% 会话']
])}
${call('info', `<p>埋点时不要上报完整钱包地址与金额等可关联身份的数据，或至少做哈希处理并在隐私政策中说明。错误上报前过滤签名、消息原文等敏感字段。</p>`)}
<p><strong>国际化（i18n）</strong>：文案用 next-intl 等库按语言加载；数字、日期用 <code>Intl.NumberFormat</code>、<code>Intl.DateTimeFormat</code> 按语言格式化（例如德语用逗号作小数点）；不要拼接句子（“你将收到 ” + x + “ USDC”），而是用带占位符的整句模板；交易状态文案、错误文案全部进入翻译文件。</p>
${tryit(`<p>给 M03.1 的项目加上第一组测试：</p>${steps(['运行 <code>npm i -D vitest</code>，在 package.json 加脚本 <code>"test": "vitest"</code>。', '把 M03.4 的 formatAmount 放到 src/lib/format.ts，复制上面的单元测试。', '运行 <code>npm test</code>，预期 3 个用例通过。', '安装 Foundry（<code>curl -L https://foundry.paradigm.xyz | bash</code>，然后 <code>foundryup</code>），运行 <code>anvil</code>，预期看到 10 个带 10000 ETH 的测试账户。'])}`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['queryKey 包含 chainId 与地址', '切链/切账户后不显示旧数据', '组件测试：切换 mock 账户后数据刷新'],
  ['钱包库动态加载', '缩短首屏时间', 'bundle-analyzer 报告首屏不含钱包库'],
  ['CI 跑单元 + E2E（分叉固定区块）', '每次改动都在真实合约上验证', 'PR 检查全绿才能合并'],
  ['每个 PR 有预览环境', '评审人能实际操作', 'PR 页面有预览链接'],
  ['RPC、钱包、交易三类指标与告警', '出问题第一时间知道', '演练：屏蔽 RPC 后 5 分钟内收到告警'],
  ['全部文案与数字格式国际化', '多语言用户不误读金额', '切换到 de-DE，小数点显示为逗号']
])}

${mistakes([
  ['缓存越久越好，能省 RPC。', '余额、价格缓存太久会显示错误数据。按数据变化频率分别设置 staleTime。'],
  ['E2E 测试必须连真实 MetaMask。', '多数流程用 wagmi mock 连接器 + anvil 即可覆盖；真实钱包交互另用 Synpress 或人工测试。'],
  ['用户拒签多说明产品有问题，要告警。', '拒签是正常行为，只看趋势。revert 率和模拟失败率才是告警指标。'],
  ['SSR 能让钱包数据首屏就显示。', '服务器不知道用户钱包状态（cookie 恢复的只有连接信息）。余额等链上数据仍在客户端获取。']
])}
${recap([
  '当前状态走 RPC，历史走索引服务，价格和静态配置走 CDN 缓存的 REST，统一由 TanStack Query 缓存。',
  'queryKey 要包含 chainId 和地址；staleTime 按数据变化频率设置。',
  '钱包库动态加载、viem 按需引入，首屏可交互时间可明显缩短。',
  '三层测试：vitest 单元、mock 连接器组件测试、Playwright + anvil 分叉主网 E2E。',
  'CI 跑全部测试，每个 PR 有预览环境；监控 RPC 失败率、连接成功率、revert 率并设告警；文案与数字全部国际化。'
])}
${quiz([
  { q: '代币的 symbol 和 decimals 最合适的 staleTime 是？', o: ['0', '10 秒', 'Infinity', '每个区块刷新'], a: 2, why: 'symbol 和 decimals 几乎不变，读一次即可。频繁刷新只会浪费 RPC。' },
  { q: '为什么 E2E 测试推荐 anvil --fork-url 并固定 --fork-block-number？', o: ['让测试连接真实主网发交易', '在本地复制真实合约状态，交易免费，且每次从同一状态开始，结果可复现', '让 anvil 更快启动', '因为 Playwright 要求'], a: 1, why: '分叉提供真实的池子和代币合约；固定区块号让价格、余额等状态每次相同，测试可复现。' },
  { q: '下面哪个指标最适合设置告警？', o: ['用户拒签次数', '已上链交易的 revert 比例', '页面访问量', '连接按钮点击次数'], a: 1, why: 'revert 率升高通常意味着合约、报价或滑点逻辑有问题。拒签是用户选择，访问量和点击数是业务指标。' },
  { q: '想让首屏不下载钱包连接库，应该？', o: ['用 next/dynamic 动态导入钱包弹窗并设 ssr: false', '把钱包库放进 layout.tsx', '把所有组件改成服务端组件', '删除 WalletConnect'], a: 0, why: '动态导入让钱包库在用户需要时才加载。放进 layout 会进入首屏；服务端组件无法使用钱包；删除功能不是优化。' }
])}
${exercises([["（示例）首屏 JS 共 800 KB（gzip），其中钱包库 300 KB。下载速度 2 MB/s，解析执行约 1 ms/KB。动态加载钱包库后，首屏可交互时间从多少降到多少？", "<p>加载前：下载 800 KB 约 0.4 秒，执行约 800 ms，合计约 1.2 秒。加载后剩 500 KB：下载约 0.25 秒，执行约 500 ms，合计约 0.75 秒。快了约 37.5%。代价是用户第一次点“连接”时要多等一会儿，可以在悬停按钮时预加载。</p>"], ["设计一个读取多个代币余额的查询：queryKey 包含什么？staleTime、refetchOnWindowFocus、retry 怎么设？", "<p>queryKey 必须包含所有影响结果的变量：chainId、账户地址、代币合约地址。这样切链或切账户后不会显示旧数据。余额 staleTime 约 10 秒，交易确认后 invalidate。refetchOnWindowFocus 开启。RPC 读失败重试 2 次。</p>"], ["做国际化时，为什么不能写“你将收到 ” + x + “ USDC”这样的拼接？金额应怎样按语言格式化？", "<p>不同语言的语序不同，拼接出来的句子无法正确翻译。应使用带占位符的整句模板，并把交易状态和错误文案都放进翻译文件。数字和日期用 <code>Intl.NumberFormat</code> 和 <code>Intl.DateTimeFormat</code> 按语言格式化，例如德语用逗号作小数点。</p>"]])}
${checklist(["能按当前状态、历史列表、价格与静态配置三类数据，分别分配 RPC、索引服务和 CDN 缓存的 REST。", "能为 queryKey、staleTime、gcTime、placeholderData 选出合理配置。", "能用 next/dynamic 和 ssr: false 动态加载钱包库，并估算首屏收益。", "能用 vitest、wagmi mock 连接器和 Playwright + anvil 分叉主网搭出三层测试。", "能定义 RPC 失败率、连接成功率、revert 率等监控指标和告警阈值。"])}
${terms([
  ['包体积', 'Bundle Size', '用户需要下载的 JavaScript 总大小'],
  ['queryKey', 'Query Key', 'TanStack Query 中标识一份缓存的键'],
  ['gcTime', 'Garbage Collection Time', '未使用的缓存被清除前保留的时长'],
  ['分叉', 'Fork', '在本地复制某条链某一区块的状态并继续运行'],
  ['mock 连接器', 'Mock Connector', 'wagmi 提供的模拟钱包，用于测试'],
  ['预览环境', 'Preview Deployment', '为每个 PR 自动部署的临时环境'],
  ['国际化', 'Internationalization (i18n)', '让产品支持多语言与本地格式的工程']
])}
` });
})();
