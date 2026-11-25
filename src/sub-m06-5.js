/* ---------- M13 Agent（新增）：m06-60 AI × Crypto 全景 ---------- */
(() => {
CUR = 'm06-60';
addCh({ id: 'm06-60', nav: 'AI × Crypto 全景', title: 'M13.8 AI × Crypto 全景：去中心化算力、可验证推理与 Agent 经济', desc: '五层地图、验证一次推理的工程设计，以及怎样判断一个项目', html: `
<h1>M13.8 AI × Crypto 全景：去中心化算力、可验证推理与 Agent 经济</h1>
${meta(['把 AI × Crypto 分成五层，说出每层卖什么、怎样防作弊、链做了什么。', '设计“验证一次推理结果”：哈希承诺、TEE 证明验证流程、挑战窗口，并算出挑战窗口的经济账。', '用清单判断一个项目是否真的需要区块链，识别三种常见失败模式。'], '前置：<a href="#m06-7">M13.6 Agent 支付</a>、<a href="#m10-1">M07.1 零知识证明直觉</a>、<a href="#m10-6">M07.6 MPC、FHE 与 TEE</a>')}
${beginner(`<p><strong>推理（Inference）</strong>：用训练好的模型回答一次问题。<strong>训练（Training）</strong>：用数据调整模型参数，成本高得多。<strong>子网（Subnet）</strong>：Bittensor 中自己定义任务和评分的独立赛场。</p>
<p><strong>可验证推理（Verifiable inference）</strong>：让调用方能检查“结果确实由指定模型算出”，而不是服务商随便编的。</p>
`)}

<h2>1. 一句话理解</h2>
${one('AI × Crypto 不是“给 AI 加一个币”。区块链在这里只擅长四件事：验证、结算、协调、记录所有权；不需要这四件事的环节，上链只会增加成本。')}
${call('analogy', `<p>像一个“众包厨房”：任何人带灶具来接单（算力市场）；排名和奖金决定谁炒得好（激励网络）；顾客确认端上来的就是点的菜（可验证推理）；机器人顾客扫码付款并留下口碑（Agent 经济）；菜谱归谁要有人登记（数据所有权）。</p>
<p><strong>类比的局限</strong>：真厨房有店长盯着；链上只有规则，规则写得不好，最先出现的是刷单，不是好菜。</p>`)}
${art('一图看懂：五层 AI × Crypto，链只做验证、结算、协调、所有权', 660, 330, [
  S.text(175, 24, 'AI 的五层', { size: 13.5, b: 1, anchor: 'middle' }),
  S.text(535, 24, '链真正需要做的事', { size: 13.5, b: 1, anchor: 'middle' }),
  S.box(10, 40, 330, 44, { k: 'info', icon: 'cpu', t: '① 算力市场', s: 'Render · Akash · io.net' }),
  S.box(10, 94, 330, 44, { k: 'info', icon: 'bot', t: '② 训练与推理网络', s: 'Bittensor · Gensyn · Prime' }),
  S.box(10, 148, 330, 44, { k: 'ok', icon: 'shield', t: '③ 可验证推理', s: 'zkML · opML · TEE' }),
  S.box(10, 202, 330, 44, { k: 'info', icon: 'wallet', t: '④ Agent 经济', s: '身份、信誉、按次付费' }),
  S.box(10, 256, 330, 44, { k: 'info', icon: 'doc', t: '⑤ 数据与模型', s: '出处、授权、所有权记录' }),
  S.box(420, 40, 230, 260, { k: 'key', icon: 'link', t: '验证 · 结算\n协调 · 所有权', s: '不需要这四件事的环节\n留在链下更便宜\n（GPU 本身不在链上）' }),
  S.arrow(342, 62, 418, 120), S.arrow(342, 116, 418, 140), S.arrow(342, 170, 418, 170), S.arrow(342, 224, 418, 200), S.arrow(342, 278, 418, 220),
  S.text(330, 322, '第③层是其余四层的信任底座：没有验证，其他层只是在“信任服务商”', { size: 12.5, anchor: 'middle', mw: 640 })
], [
  ['flow', '左边是 AI 栈的五个环节，右边是链能提供的服务；每个环节只用到其中一两项。'],
  ['key', '第③层决定前两层能不能真的去中心化：买家没法检查结果，就只能信任服务商。'],
  ['risk', '许多项目把“用了代币”当成“需要区块链”。代币是激励手段，不是需求证明。'],
  ['limit', 'GPU 计算、模型权重、训练数据都太大，不会放到链上；链上只放哈希、证明、支付和规则。']
], '左侧五层 AI 栈依次连到右侧链提供的验证、结算、协调和所有权四类服务', 'm06-60')}
<p>本篇是地图，不是投资建议；市场信息注明来源和“截至”日期，不预测价格。Agent 基础到典型应用见 <a href="#m06-1">M13.1</a> 至 <a href="#m06-8">M13.7</a>。</p>

<h2>2. 第①层：去中心化算力市场</h2>
<p>这一层卖“GPU 时间”。以下为截至 2026 年公开资料的做法，价格与参数以官方为准。</p>
${tbl(['项目', '供给怎样验证', '怎样定价和付费'], [
  ['Render（渲染起家，另有 AI 与通用计算节点网络）', '算力网络的奖励按在线时长和工作时长计算，与渲染节点分开' + cite('Render RNP-019：Render Compute Network（2025-03-31，状态 Implemented）', 'https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-019.md'), '提案按 GPU 型号动态定价，示例 RTX 4090 每小时 0.35 美元；客户付美元或 RENDER，任务后 95% 额度买入 RENDER 销毁，5% 给 OTOY'],
  ['Akash（通用云，GPU 为卖点）', '订单按属性匹配服务商；硬件是否如实申报，主要靠属性审计和租户自查 ' + tag('推断'), '租户发订单，服务商竞价，租户选中后创建租约；租约按区块（约 6 秒）从托管余额付给服务商' + cite('Akash 文档：Providers & Leases', 'https://akash.network/docs/learn/core-concepts/providers-leases/')],
  ['io.net（聚合 GPU 集群）', '每台设备每小时跑一次工作量证明，验证 GPU 真实且算力、显存与申报一致；失败的设备不能被租用，也拿不到奖励' + cite('io.net 文档：Proof of Work', 'https://io.net/docs/guides/workers/proof-of-work'), '按小时计费，价格见官方当前页面']
])}
<h3>2.1 算一算（示例）</h3>
${steps([
  'Render：奖励公式 10 × 倍率 × 工作小时 ÷ 168。倍率 1.8098、工作 100 小时：10 × 1.8098 × 100 ÷ 168 ≈ <strong>10.77 RENDER</strong>。参考价 0.35 美元每小时，满载一周客户付费约 <strong>58.8 美元</strong>。节点收入 = 客户付费 + 代币奖励（补贴），先看第一项。',
  'Akash：出价 10,000 uact 每区块（约 6 秒），一个月约 432,000 块，合 <strong>4,320 ACT</strong>（1 ACT = 10<sup>6</sup> uact），与文档示例一致。'
])}
${call('info', '<p>买家买的是“GPU 时间”，不是“正确的结果”。渲染结果能用眼睛检查，AI 推理结果不能。要把算力市场变成可信的推理服务，需要第③层。DePIN 的通用结构见 <a href="#m09-3">M14.3</a>。</p>')}

<h2>3. 第②层：去中心化训练与推理网络</h2>
<h3>3.1 Bittensor：子网与激励机制</h3>
<p>每个子网由所有者定义任务和评分；<strong>矿工</strong>产出结果；<strong>验证者</strong>给矿工打分并把权重写上链；Yuma 共识把所有验证者的权重合成每个矿工的收益。</p>
${mm('Bittensor 一个子网的激励循环', `
flowchart LR
  O["子网所有者<br/>定义任务与评分"] --> M["矿工<br/>产出结果"]
  M --> V["验证者<br/>打分"]
  V -->|"提交权重"| Y["Yuma 共识<br/>质押加权取中位<br/>超出共识的权重被削减"]
  Y --> E["排放分配<br/>默认 18% 所有者<br/>41% 矿工<br/>41% 验证者及质押者"]
  E -.->|"收益吸引更多矿工"| M
`, [
  ['flow', '任务和评分都在链下；链上只记录权重并分配排放。'],
  ['key', 'Yuma 共识取质押加权中位数：单个验证者给某矿工打得过高，会被削减到共识水平，用来抑制合谋。'],
  ['risk', '评分规则由所有者设计；有漏洞，矿工就针对漏洞优化，而不是做有用的事。'],
  ['limit', '谁的权重算数由质押决定，质押越集中，越容易被少数人左右。']
])}
<p>官方文档：默认按 18% 所有者、41% 矿工、41% 验证者及其质押者分配，所有者可在范围内调整（矿工至少 33%）；共识权重是“获得至少 kappa（默认约 0.5）活跃质押支持的最高权重”；各子网分到的排放取决于子网代币价格的移动平均（dTAO，2025 年 2 月上线）。${cite('Bittensor 文档：Emissions', 'https://www.bittensor.com/docs/concepts/emissions')}参数由治理设定，以链上当前值为准。</p>
<p>一篇预印本分析了 2023 年 3 月至 2025 年 2 月 64 个子网的链上事件：前 1% 的钱包持有的质押中位数约 90%；质押与奖励相关性高（验证者 0.80 至 0.95），表现与奖励相关性弱（矿工约 0.10 至 0.30）。${cite('Lui & Sun：Bittensor 实证分析（arXiv:2507.02951，作者来自同行业公司）', 'https://arxiv.org/html/2507.02951v1')}规律：<strong>谁评分，谁掌握分配权；评分权按质押分配，就会向大户集中。</strong></p>
<h3>3.2 Gensyn 与 Prime Intellect：分布式训练</h3>
<ul>
<li><strong>Prime Intellect</strong>（低带宽协同训练）：INTELLECT-1 为 100 亿参数、1 万亿 token，3 个大洲、最多 14 个节点、30 个独立算力提供方，通信量约为传统数据并行的四百分之一。${cite('INTELLECT-1 Technical Report（arXiv:2412.01152）', 'https://arxiv.org/abs/2412.01152v1')}这证明“能协同训练”，不等于“能防恶意节点”。</li>
<li><strong>Gensyn</strong>（验证不可信节点的训练）：Verde 出现分歧时二分定位第一个分歧的步骤和算子，仲裁者只重算这一个算子；RepOps 让常见算子跨硬件逐位一致；前提是至少一个验证者诚实。${cite('Gensyn：Verde', 'https://www.gensyn.ai/research/verde-a-verification-system-for-machine-learning-over-untrusted-nodes')}主网与代币进度各来源说法不一，本篇不引用 ${tag('待核实')}。</li>
</ul>
<p><strong>为什么要逐位一致</strong>：浮点加法不满足结合律，不同 GPU 的求和顺序会让最后几位不同，“重算再比较”会把诚实节点误判成作弊；第 5.3 节的乐观验证依赖同一件事。</p>
<p><strong>到底什么被去中心化了？</strong>算力供给和结算是；任务与评分规则通常仍由子网所有者或项目方决定，这是最常被忽略的中心点。</p>

<h2>4. 第③层：可验证推理</h2>
<p>买家要确认：模型对、输入没被改、输出是真算的。零知识证明见 <a href="#m10-1">M07.1</a>、<a href="#m10-2">M07.2</a>，TEE 与远程证明见 <a href="#m10-6">M07.6</a>；这里只比较取舍。</p>
${compare('三条验证路线', [
  { name: 'zkML', tag: '数学', kind: 'ok', points: ['信任：数学与电路', '成本：证明比原计算慢几个数量级', '延迟：等证明生成', '代表：EZKL（Halo2，输入 ONNX）'] },
  { name: 'opML', tag: '博弈', kind: 'key', points: ['信任：至少一个诚实挑战者', '成本：接近原计算', '延迟：等挑战窗口结束才终局', '前提：重算必须可复现'] },
  { name: 'TEE', tag: '硬件', kind: 'warn', points: ['信任：芯片厂商与物理安全', '成本：接近原生，GPU 也有机密计算', '延迟：几乎无', '风险：证明密钥被提取可伪造报告'] }
], [
  ['key', '选择依据是“愿意信任什么”：数学、经济博弈、硬件厂商。'],
  ['risk', 'TEE 的已知攻击（SGX.Fail、TEE.Fail）见 <a href="#m10-6">M07.6</a> 第 5.2 节。'],
  ['limit', '三者证明的都是“指定模型对指定输入的运算”，不证明模型好，也不证明训练数据合法。']
])}
<p>EZKL 文档描述的流程：输入 ONNX 模型，生成电路，生成证明，持验证密钥者即可验证。${cite('EZKL 文档', 'https://docs.ezkl.xyz/')}opML 论文（2024 年 1 月）用欺诈证明代替零知识证明，终局确认发生在挑战窗口结束后${cite('opML（arXiv:2401.17555）', 'https://arxiv.org/pdf/2401.17555')}；窗口长度各资料说法不一（几分钟的设想到数天），以实际合约参数为准 ${tag('待核实')}。</p>
<p><strong>zkML 开销（作者本机实测，示例）</strong>：ezkl 23.0.5 跑一个 4 输入、4×2 矩阵、ReLU 的极小模型，证明密钥约 138 MB，验证密钥约 67 KB，证明约 18 KB。10 个权重已需上百 MB 密钥，亿级参数的 LLM 仍是研究课题。</p>

<h2>5. 工程：验证一次推理结果</h2>
<p>实际系统分级组合：所有调用带<strong>签名回执</strong>；关键调用要求 <strong>TEE 证明</strong>；可疑或高价值调用开放<strong>挑战窗口</strong>。</p>
<h3>5.1 哈希承诺与回执</h3>
${code('TYPESCRIPT', `import { keccak256, toHex, encodeAbiParameters, parseAbiParameters } from 'viem';
// 三个哈希 + 确定性参数（seed）+ nonce，换任何一项都是另一份回执
const receiptHash = keccak256(encodeAbiParameters(
  parseAbiParameters('bytes32 modelHash, bytes32 inputHash, bytes32 outputHash, uint64 seed, uint256 nonce'),
  [keccak256(toHex(weightsBytes)), keccak256(toHex(requestJson)), keccak256(toHex(responseText)), 42n, nonce]));
const signature = await providerAccount.signMessage({ message: { raw: receiptHash } });`)}
<p>签名回执让服务商<strong>无法抵赖</strong>，但不证明结果为真。</p>
<h3>5.2 TEE 证明的验证流程</h3>
<p>服务商把推理放进 TEE（如 Intel TDX 机密虚拟机，加 NVIDIA 机密计算 GPU），并把 <code>receiptHash</code> 写进报价的“报告数据”字段。验证方：</p>
${steps2('验证 TEE 报价（quote）', [
  { t: '① 验签名链', d: '追到芯片厂商根证书，确认是真 CPU。', kind: 'key' },
  { t: '② 取 collateral 并查 TCB 等级', d: '固件与微码过旧的平台直接拒绝。', kind: 'risk' },
  { t: '③ 比对度量值', d: '必须等于你审计、可复现构建的镜像哈希。' },
  { t: '④ 比对报告数据', d: '必须等于你自己重算的 receiptHash。' },
  { t: '⑤ 验 GPU 证明', d: '经 NVIDIA 的 NRAS 或本地验证器确认驱动与固件。' },
  { t: '⑥ 签发结论', d: '写成自己的凭证或链上记录。', kind: 'ok' }
], [
  ['key', '③ 证明“运行的是这份代码”，④ 证明“这份回执由它生成”，缺一不可。'],
  ['fail', 'Intel 指南：collateral 目前约 30 天到期；生产环境不允许运行时临时向 Intel PCS 取，必须经 PCCS 等缓存。' + cite('Intel TDX Enabling Guide：Infrastructure Setup', 'https://cc-enabling.trustedservices.intel.com/intel-tdx-enabling-guide/02/infrastructure_setup/')],
  ['limit', 'NVIDIA 证明套件含 NRAS、RIM 服务和 OCSP 服务，字段以官方文档为准。' + cite('NVIDIA Attestation Suite 文档', 'https://docs.nvidia.com/attestation/index.html')]
])}
<h3>5.3 挑战窗口（乐观验证）</h3>
<p>服务商提交回执并抵押保证金；窗口内任何人可按同样输入和种子重算，输出哈希不一致就挑战，成立则罚没保证金并奖励挑战者；窗口结束无人挑战则最终确认。最小骨架（教学用，未审计，裁决逻辑省略）：</p>
<p>合约只需三个函数：<code>submit(receiptHash)</code> 收保证金并记录时间；<code>challenge(receiptHash)</code> 在窗口内把回执标为争议，进入单步重算仲裁；<code>finalize(receiptHash)</code> 在窗口过后、无争议时退还保证金。裁决逻辑（链上单步重算或预言机）是工程难点，此处不展开。</p>
<h3>5.4 算一算：保证金够不够（示例）</h3>
${steps([
  '一次推理收费 0.05 美元；换成便宜小模型作弊，每次省 0.04 美元。',
  '挑战者重算一次成本 0.02 美元；协议抽 1% 服务费资助审计：0.05 × 1% = 0.0005 美元每次调用。审计比例 p 满足 p × 0.02 ≤ 0.0005，得 p ≤ <strong>2.5%</strong>。',
  '被证实的作弊罚没 20 美元：期望罚款 = 2.5% × 20 = 0.5 美元每次，是收益 0.04 的 <strong>12.5 倍</strong>，作弊不划算。',
  '若罚没只有 1 美元，期望罚款 0.025 &lt; 0.04，设计失效：<strong>罚没与审计比例要一起设计。</strong>'
])}
${call('warn', '<p>前提有三个：重算能逐位复现（LLM 采样、GPU 求和顺序会破坏它，需固定种子和内核或可复现算子）、挑战者真的在监控、窗口内资金被锁住。</p>')}

<h2>6. 第④层：Agent 经济</h2>
${recall('<p>Agent 之间要先“找到对方、判断可信”再付钱。<a href="#m06-7">M13.6</a> 已提过 ERC-8004；ENS 与 EAS 等通用身份工具见 <a href="#m09-1">M14.1</a>。这里只补它与“可验证推理”的连接点。</p>')}
<h3>6.1 身份与信誉：ERC-8004</h3>
<p>ERC-8004（Trustless Agents）2025 年 8 月 13 日提出；作者 2026 年 11 月 22 日查看 EIP 页面，状态仍是 <strong>Draft</strong>。${cite('ERC-8004: Trustless Agents（EIP 页面）', 'https://eips.ethereum.org/EIPS/eip-8004')}三个注册表：</p>
<ul>
<li><strong>身份</strong>：每个 Agent 一个 ERC-721（register()、setAgentURI()、setAgentWallet()）；端点和信任模型写在链下的注册文件里。</li>
<li><strong>信誉</strong>：调用方用 giveFeedback()、revokeFeedback()、appendResponse() 打分；详细反馈与聚合在链下。</li>
<li><strong>验证</strong>：validationRequest()、validationResponse() 返回 0 至 100 分；重算、zkML、TEE 等方法不在注册表内。</li>
</ul>
<p><strong>验证注册表只是登记簿</strong>，真正验证的是第③层的手段。信誉可以被刷（一个人造几十个地址互相打分），只统计“真实付过费的调用方”的反馈是合理的防御方向 ${tag('推断')}，不要把原始平均分当可信度。</p>
<h3>6.2 按次付费：卖推理服务的单位经济（示例）</h3>
<p>x402 的 402 流程、EIP-3009 与预算闸门见 <a href="#m06-7">M13.6</a>。卖方账本：</p>
<p>价格 0.004 USDC（402 响应写 4000，USDC 为 6 位小数）。成本：GPU 每小时 2 美元、服务 1,667 次，每次 0.0012 美元；结算 Gas 每笔 0.002 美元、每 500 次批量一次，每次 0.000004 美元；平台费 1% 即 0.00004 美元；TEE 与回执摊销 0.0001 美元。毛利 = 0.004 − 0.0012 − 0.000004 − 0.00004 − 0.0001 ≈ <strong>0.00266 美元，约 66%</strong>。</p>
<p>流程：客户端收到 402 后预算检查并签授权；服务商验证后推理，回执哈希放进响应头，支付批量结算。高价值调用把支付放进托管合约，验证回执后才释放；低价调用按 2.5% 抽查，靠第 5.4 节的罚没约束；评价连同支付凭证写入信誉注册表，便于过滤。</p>

<h2>7. 第⑤层：数据与模型所有权</h2>
<p>链能“登记”和“结算”，不能阻止复制。</p>
<p><strong>数据出处</strong>：把数据集哈希和时间戳上链，用 EAS 记录谁何时声明了什么（<a href="#m09-1">M14.1</a>），证明不了数据真实或合法。<strong>内容真伪</strong>：可结合 C2PA 内容凭证；C2PA 清单是防篡改的签名声明，不保证内容准确或签名者诚实。${cite('C2PA Technical Specification 2.2', 'https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html')}<strong>数据市场与模型</strong>：可以按次授权、收款、分账、登记权重哈希与许可（<a href="#m09-7">M14.6</a>）；但买家拿到数据或权重就能复制，“所有权”只是一条声明。</p>

<h2>8. 诚实评估：哪些问题真的需要区块链</h2>
<p><strong>需要</strong>：陌生人之间的自动结算（无账号、全球、可编程）；登记所有权与许可（公共、不依赖一家公司）；评分可信时的多方协调；为验证提供公共的挑战与罚没场所。<strong>不需要</strong>：运行模型、存数据与权重（链下进行，链上放哈希）；“用代币付费”本身（稳定币足以结算）。</p>
<h3>8.1 评估清单</h3>
${steps([
  '<strong>去掉代币，产品还成立吗？</strong>换成稳定币，用户还愿意用吗。',
  '<strong>真实付费占多少？</strong>例如每周排放 10,000 个代币、每个 0.5 美元，价值 5,000 美元；客户付费 400 美元，覆盖率 8%（示例，虚构）。',
  '<strong>结果怎么验证，验证者是谁，谁定义任务和评分？</strong>答案是“我们自己”，该点就是中心化的。',
  '<strong>作弊的成本与收益？</strong>用 5.4 节方法算一次；质押是否集中，读链上数据。',
  '<strong>能否独立复现？</strong>开源、可复现构建、公开链上数据三项齐备才算可核查。'
])}
<h3>8.2 常见失败模式</h3>
<ul>
<li><strong>补贴出来的需求</strong>：用量靠奖励买来，奖励停则归零。看付费收入占比。</li>
<li><strong>无法验证的承诺</strong>：宣称“可信推理”，却没有验证机制，或验证者就是项目方。问：我怎样自己检查一次结果。</li>
<li><strong>先发币后做产品</strong>：代币先上线，需求排在后面；评分被刷时，质押大户决定分配。</li>
</ul>
${tryit(`<p>用 EZKL 在本机生成并验证一个真实的零知识推理证明，再篡改证明看它失败。作者 2026 年 11 月 22 日在 macOS、Python 3.12 上用下列版本跑通；EZKL 的 Python API 随版本变化大，请固定版本。</p>
${steps([
  '<code>python3 -m venv v &amp;&amp; v/bin/pip install ezkl==23.0.5 onnx numpy</code>',
  '保存下面的 <code>run.py</code>，运行 <code>v/bin/python run.py</code>。首次运行联网下载 SRS（参考串），约几十秒，并生成约 138 MB 的 <code>pk.key</code>。',
  '预期依次打印 gen_settings、calibrate_settings、compile_circuit、get_srs、gen_witness、setup、prove、verify，值均为 True。',
  'witness.json 的 outputs 是小端十六进制字段元素，按 2<sup>26</sup> 缩放：第一个输出除以 2<sup>26</sup> 约 0.72，与手算 0.2×0.5+0.4×1+0.1×0.5+0.7×0.1+0.1 = 0.72 吻合。',
  '把 proof.json 里 instances 的一个字节改掉，再调用 <code>ezkl.verify</code>，预期抛错（本机为 “The constraint system is not satisfied”）。'
])}
${code('PYTHON', `import asyncio, inspect, json
import numpy as np, onnx, ezkl
from onnx import helper, TensorProto, numpy_helper as nh

W = nh.from_array(np.array([[0.5,-1],[1,0.25],[-0.5,0.75],[0.1,0.2]], dtype=np.float32), 'W')
B = nh.from_array(np.array([0.1,-0.1], dtype=np.float32), 'B')
g = helper.make_graph(
    [helper.make_node('MatMul',['x','W'],['m']), helper.make_node('Add',['m','B'],['a']), helper.make_node('Relu',['a'],['y'])],
    'g', [helper.make_tensor_value_info('x',TensorProto.FLOAT,[1,4])],
    [helper.make_tensor_value_info('y',TensorProto.FLOAT,[1,2])], [W,B])
m = helper.make_model(g, opset_imports=[helper.make_opsetid('',13)]); m.ir_version = 8
onnx.save(m, 'network.onnx')
json.dump({'input_data': [[0.2, 0.4, -0.1, 0.7]]}, open('input.json', 'w'))

async def call(f, *a):                 # 有的函数同步，有的异步
    r = f(*a)
    return await r if inspect.isawaitable(r) else r

async def main():
    steps = [(ezkl.gen_settings, 'network.onnx', 'settings.json'),
             (ezkl.calibrate_settings, 'input.json', 'network.onnx', 'settings.json', 'resources'),
             (ezkl.compile_circuit, 'network.onnx', 'network.ezkl', 'settings.json'),
             (ezkl.get_srs, 'settings.json'),
             (ezkl.gen_witness, 'input.json', 'network.ezkl', 'witness.json'),
             (ezkl.setup, 'network.ezkl', 'vk.key', 'pk.key'),
             (ezkl.prove, 'witness.json', 'network.ezkl', 'pk.key', 'proof.json'),
             (ezkl.verify, 'proof.json', 'settings.json', 'vk.key')]
    for f, *a in steps:
        print(f.__name__, bool(await call(f, *a)))
asyncio.run(main())`)}
<p>思考：证明里模型权重是固定的（param visibility 为 Fixed）。服务商偷偷换了模型，验证密钥还能通过吗？</p>`)}

${mistakes([
  ['链上的 AI 就是模型跑在链上。', '模型和 GPU 在链下，链上只有承诺、证明、支付和规则。'],
  ['用了代币，就说明需要区块链。', '代币是激励工具。先换成稳定币，看产品是否成立。'],
  ['ERC-8004 信誉分越高越可信。', '信誉可被刷，标准仍是 Draft；看谁打的分、是否付过费。']
])}
${recap([
  'AI × Crypto 分五层；链只提供验证、结算、协调、所有权记录，GPU 计算和数据留在链下。',
  '算力市场卖“GPU 时间”，不保证结果正确。',
  'Bittensor 靠验证者打分和 Yuma 共识分配排放，评分权随质押集中；Verde 与 DiLoCo 分别解决训练验证和通信。',
  '可验证推理三条路线信任不同：数学（zkML）、博弈（opML）、硬件厂商（TEE）；落地分级组合回执、TEE 证明、挑战窗口。',
  '判断项目：去掉代币是否成立、付费占多少、怎样验证、谁评分、作弊成本与收益。'
])}
${quiz([
  { q: '下面哪个环节最不需要放到区块链上？', o: ['大模型的矩阵运算', '陌生 Agent 之间的按次付费', '推理回执的挑战与罚没', '数据集的哈希登记'], a: 0, why: 'GPU 计算量太大，只能在链下。B 是结算，C 是协调与验证，D 是所有权记录，都适合链。' },
  { q: '把回执哈希放进 TEE 报告数据字段的目的是：', o: ['给报告加密', '降低 Gas', '证明这份回执由这台 TEE 中的这份代码生成', '让 Intel 读取用户数据'], a: 2, why: '度量值证明运行的是哪份代码，报告数据把一次具体结果绑定到这份证明。其他选项与它无关。' },
  { q: '乐观验证里，保证金与审计比例的正确关系是：', o: ['保证金够大就不需要审计', '审计比例越高越好，与成本无关', '没有挑战者系统也安全', '期望罚款（审计比例 × 罚没）要明显高于作弊收益，且审计费用要有来源'], a: 3, why: '没人审计，罚没不会发生；审计要花钱，需要费用资助。A、C 忽略挑战者，B 忽略成本。' },
  { q: '某项目每周排放价值 5,000 美元，客户付费 400 美元。最合理的判断：', o: ['需求强劲，应加大排放', '覆盖率约 8%，需求主要靠补贴，要看补贴停止后还剩多少', '代币价格会上涨', '一定是骗局'], a: 1, why: '400 ÷ 5,000 = 8%。只能说需求被补贴主导；不能据此断定欺诈，也不能预测价格。' }
])}
${exercises([
  ['计算题（示例）：Render 公式 10 × 倍率 × 工作小时 ÷ 168。倍率 1.5、工作 84 小时，奖励是多少？', '<p>10 × 1.5 × 84 ÷ 168 = <strong>7.5 RENDER</strong>。</p>'],
  ['计算题（示例）：5.4 节中罚没改为 10 美元，审计比例至少多少才能让期望罚款超过作弊收益 0.04 美元？', '<p>p × 10 &gt; 0.04，p &gt; <strong>0.4%</strong>。罚没越大，所需审计比例越低。</p>'],
  ['设计题：服务单次收费 2 美元，输出是研究报告，选什么验证手段？', '<p>签名回执 + TEE 证明，支付进托管合约，24 小时内可争议。zkML 对大模型不现实；纯重算在输出非确定时会误判。</p>']
])}
${checklist([
  '能画出五层地图，说出每层卖什么、链做了什么。',
  '能说出 Render、Akash、io.net 在定价与供给验证上的差异，并指出它们都不保证结果正确。',
  '能解释 Bittensor 的子网、矿工、验证者、Yuma 共识和默认排放比例，以及质押集中的风险。',
  '能比较 zkML、opML、TEE，并设计回执、TEE 证明、挑战窗口三级验证。',
  '能用清单评估项目，识别补贴需求、无法验证的承诺和先发币后做产品。'
])}
${terms([
  ['可验证推理', 'Verifiable Inference', '让调用方能检查结果确由指定模型对指定输入算出的机制'],
  ['zkML', 'Zero-Knowledge ML', '用零知识证明证明一次模型推理的正确性'],
  ['opML', 'Optimistic ML', '默认结果正确，在挑战窗口内允许重算和挑战的验证方式'],
  ['Yuma 共识', 'Yuma Consensus', 'Bittensor 把验证者权重合成矿工收益的算法，质押加权取中位并削减超出共识的权重'],
  ['ERC-8004', 'Trustless Agents', '提议中的 Agent 身份、信誉与验证注册表标准（Draft）']
])}
` });
})();
