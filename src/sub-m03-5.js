/* ---------- M08 钱包（5）：m03-60 嵌入式钱包与 Passkey ---------- */
(() => {
CUR = 'm03-60';
addCh({ id: 'm03-60', nav: '嵌入式钱包与 Passkey', title: 'M08.12 嵌入式钱包与 Passkey：WebAuthn、RIP-7212 与无助记词体验', desc: 'Privy/Turnkey 嵌入式钱包的 Shamir 分片与 TEE 架构、Passkey/WebAuthn 与 RIP-7212 P-256 链上验签、账号恢复与托管边界', html: `
<h1>M08.12 嵌入式钱包与 Passkey：WebAuthn、RIP-7212 与无助记词体验</h1>
${meta([
  '拆解嵌入式钱包（Embedded Wallet）消除“安装插件 + 抄 12 个助记词”门槛的两条技术路线：Shamir/MPC 分片 vs TEE 隔离执行。',
  '理解 Passkey（WebAuthn / FIDO2）为何使用 secp256r1（P-256）曲线，以及 RIP-7212 预编译合约如何把链上验签 Gas 压低百倍。',
  '对比 Privy、Turnkey、Dynamic 等主流方案的信任边界、导出私钥能力与防厂商锁定策略。',
  '为 C 端消费级 DApp 设计兼具“Web2 登录丝滑体验”与“自托管安全底线”的账号恢复与会话方案。'
], '前置：<a href="#m03-1">M08.1 钱包分类全景</a>、<a href="#m03-5">M08.5 MPC 与门限签名</a>、<a href="#m06-5">M08.8 账户抽象深入</a>')}
${beginner(`<p><strong>嵌入式钱包（Embedded Wallet）</strong>：直接内嵌在 App 或网页里的钱包。用户用邮箱、手机号、Google 账号或 FaceID 一键登录，后台在几秒内静默生成链上地址，全程不弹 MetaMask 插件也不逼用户抄助记词。</p>
<p><strong>Passkey（通行密钥）</strong>：苹果、谷歌、微软联合推广的无密码标准（基于 WebAuthn/FIDO2），私钥生成并锁死在手机安全芯片（Secure Enclave）里，靠指纹或面容解锁签名。</p>
<p><strong>RIP-7212</strong>：以太坊 L2 广泛采纳的 Rollup 改进提案，在预编译地址 <code>0x100</code> 提供原生 P-256（secp256r1）曲线验签，让智能合约钱包能极低成本直接验证手机 Passkey 签名。</p>`)}

<h2>1. 一句话理解</h2>
${one('嵌入式钱包用“社交/邮箱登录 + 分片或 TEE 安全屋”把助记词藏进后台，Passkey 用手机硬件芯片直接签名并借由 RIP-7212 在链上验真——两者结合账户抽象（ERC-4337 / EIP-7702），让 Web3 应用终于拥有和 Web2 App 一样的首屏转化体验。')}
${call('analogy', `<p>传统助记词钱包像发给每个新顾客一把机械保险柜钥匙和一张手写密码纸，丢了纸钱就永远没了；嵌入式钱包像高端酒店的“人脸识别 + 电子房卡”：前台（服务商）手里只有半把验证凭证，手机芯片里锁着另半把，刷脸就能进门，而且真的换手机了还能走多因素认证重配房卡。</p>
<p>比喻的局限：一旦“登录方式”绑定了邮箱、手机号或某家钱包 SDK，就必须回答两个尖锐问题——“服务商跑路或倒闭了，用户还能把资产导出来吗？”以及“用户邮箱被盗了，黑客会不会顺手转空钱包？”</p>`)}
${art('一图看懂：嵌入式钱包的两条主流密钥架构与 Passkey 链上验签', 660, 320, [
  S.zone(15, 18, 305, 150, { t: '路线 A：分片 / MPC（如 Privy / Web3Auth）', k: 'info' }),
  S.box(28, 50, 128, 52, { k: 'info', icon: 'phone', t: '设备分片', s: '存浏览器 / App 本地' }),
  S.box(178, 50, 128, 52, { k: 'warn', icon: 'cloud', t: '鉴权分片', s: 'OAuth/短信验真下发' }),
  S.box(28, 112, 278, 44, { k: 'key', t: '客户端隔离 iframe 内临时重组（2/3 门限）', s: '签完立刻从内存销毁，支持导出完整私钥' }),
  S.zone(340, 18, 305, 150, { t: '路线 B：TEE 隔离执行（如 Turnkey）', k: 'ok' }),
  S.box(354, 50, 130, 52, { k: 'ok', icon: 'key', t: '用户 Passkey', s: '手机安全芯片签名' }),
  S.box(504, 50, 128, 52, { k: 'key', icon: 'shield', t: 'AWS Nitro TEE', s: '硬件加密飞地验策略' }),
  S.box(354, 112, 278, 44, { k: 'info', t: '私钥永不离开 TEE 飞地，运营商也看不到明文', s: '支持策略引擎 + 审计日志 + 异步导出' }),
  S.box(25, 194, 610, 74, { k: 'ok', icon: 'bolt', t: '路线 C：纯链上 Passkey 智能合约钱包（ERC-4337 + RIP-7212 预编译 0x100）', s: '无需托管任何 secp256k1 私钥！手机 Passkey 直接签 UserOp，智能合约调 0x100 预编译低 Gas 验 P-256 签名' }),
  S.text(330, 298, '选型核心：看重跨链兼容（含非 EVM/Solana）选分片或 TEE；纯 EVM 极致去中心化选 Passkey 智能账户', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['flow', '三条路线都让用户告别抄写 12 个助记词，但私钥存在哪里、谁能协助恢复完全不同。'],
  ['key', '路线 A 与 B 生成标准 secp256k1 / Ed25519 地址，天然兼容比特币、以太坊与 Solana；路线 C 依赖智能合约钱包与链上 P-256 验签。'],
  ['risk', '若路线 A 把“设备分片”和“邮箱登录恢复分片”都放在同一台未加 PIN 的手机上，手机解锁即等同资产暴露。']
], '对比三种无助记词架构：左上是客户端分片重组，右上是 Passkey 鉴权加 AWS Nitro TEE 飞地签名，下方是 ERC-4337 加 RIP-7212 预编译纯链上 Passkey 验签', 'm03-60')}

<h2>2. 三种无助记词架构深度对比</h2>
${tbl(['维度', 'Shamir / MPC 分片嵌入式钱包', 'TEE 硬件飞地签名（如 Turnkey）', '纯链上 Passkey 智能合约钱包'], [
  ['<strong>底层密码学</strong>', 'Shamir 秘密共享（2/3）或门限 MPC，产出标准 EOA 私钥', '私钥生存在 AWS Nitro 等 TEE 飞地内，外部用 Passkey/API 鉴权触发签名', '手机芯片生成 P-256（secp256r1）密钥对，合约链上直接验签'],
  ['<strong>多链兼容性</strong>', '极强（可同时派生 EVM、Solana、BTC 地址）', '极强（飞地内支持任意曲线签名）', '仅支持具备账户抽象与 P-256 验签的 EVM 链（L2 / 支持 RIP-7212 链）'],
  ['<strong>单笔验签成本</strong>', '与普通 EOA 完全相同', '与普通 EOA 完全相同', '接入 RIP-7212 预编译后仅约 3,450 Gas（纯 Solidity 验签需 20–30 万 Gas）'],
  ['<strong>防厂商锁定</strong>', '允许用户在隔离 iframe 导出明文私钥迁移至 MetaMask', '支持加密信道导出私钥到用户本地', '完全去中心化，即使前端关停仍可直接调用链上合约操作'],
  ['<strong>核心风险点</strong>', '前端域名/iframe 供应链攻击、单点社交账号被盗', 'TEE 硬件侧信道漏洞与飞地代码远程证明（Attestation）校验', '换生态丢 Passkey（如 iOS 换安卓未备份）且未配守护者时可能锁死']
])}

<h2>3. 为什么 RIP-7212 是 Passkey 钱包的分水岭？</h2>
${recall('<p>以太坊用 <strong>secp256k1</strong> 曲线（见 <a href="#m00-3">M00.3</a>），手机安全芯片与 WebAuthn 只原生支持 <strong>secp256r1（P-256）</strong>，所以 Passkey 只能做智能账户的签名者。纯 Solidity 验一次 P-256 签名要 20–30 万 Gas；RIP-7212 在预编译地址 <code>0x100</code> 提供 <code>P256VERIFY</code>，约 3,450 Gas，多条主流 L2 已支持（以太坊侧对应 EIP-7951）。WebAuthn 签名在 <code>validateUserOp</code> 里怎样逐项校验（challenge、authenticatorData 标志）以及设备丢失的恢复设计，见 <a href="#m06-5">M08.8 账户抽象深入</a>第 6 节。</p>')}
<p>本节只看它对产品选型的意义：有了低成本链上验签，“刷 FaceID 直接发交易”的纯链上 Passkey 钱包才真正可用，这正是上表第三列方案成立的前提。</p>

${mm('Passkey + RIP-7212 智能合约钱包验签流程', `
sequenceDiagram
  participant U as 用户（FaceID）
  participant S as 手机安全芯片（P-256）
  participant B as Bundler 节点
  participant W as 智能合约钱包
  participant P as RIP-7212 预编译 0x100
  U->>S: 生物识别授权交易
  S-->>B: 生成 P-256 签名并提交 UserOp
  B->>W: EntryPoint 调用 validateUserOp
  W->>P: staticcall 验证 P-256 签名（约 3450 Gas）
  P-->>W: 返回验证通过
  W-->>B: 执行目标合约调用
`, [
  ['flow', '手机硬件芯片直接签出 P-256 签名，智能合约钱包调用 0x100 预编译低成本验签，全程无助记词。'],
  ['limit', '仅在支持 RIP-7212 预编译的链上才具备 ~3,450 Gas 的超低验签成本。']
])}

<h2>4. 嵌入式钱包接入与安全防御清单</h2>
<p>使用嵌入式钱包 SDK（如 Privy、Dynamic、Turnkey）时，DApp 自身的前端安全直接关系到用户资产。必须守住四条底线：</p>
${tbl(['检查项', '为什么', '怎么落地'], [
  ['<strong>独立域名隔离 iframe + 严格 CSP</strong>', '防止 DApp 主站被 XSS 注入后窃取嵌入式钱包内存里的临时分片或签名权限', '确认钱包 SDK 在独立安全源（Origin）的 iframe 中渲染签名确认框，主站配置严格 CSP（见 <a href="#m07-8">M03.8 前端安全</a>）'],
  ['<strong>大额操作强制二次确认 + 策略限额</strong>', '避免社交账号 cookie 泄露导致静默签名转空钱包', '设置单笔与单日限额；超过阈值必须触发 Passkey/MFA 二次生物认证'],
  ['<strong>提供清晰的「私钥导出 / 逃生舱」入口</strong>', '让用户真正拥有自托管权，并满足合规层面对“非托管”的界定', '在设置页保留受 MFA 保护的私钥导出或转移至硬件钱包向导'],
  ['<strong>跨平台账号恢复方案</strong>', '用户丢手机或从 iPhone 换到 Android 时，iCloud 同步的 Passkey 无法直接跨生态读取', '组合两种以上恢复途径：Passkey + 邮箱/社交恢复 + 可选冷备份恢复码或社交守护者']
])}

${exercises([
  ['某面向全球消费级用户的游戏 DApp 计划部署在 Solana 和 Base 两条链上，希望新用户 10 秒内用 Google 账号注册并领到第一个链上道具。应该选纯 Passkey 智能合约钱包，还是基于分片/TEE 的嵌入式钱包？', '<p>优先选基于分片或 TEE 的嵌入式钱包（再配合 Base 侧的 Gas 赞助 Paymaster）。因为纯 Passkey 智能合约钱包依赖 EVM 账户抽象与 RIP-7212，无法直接覆盖 Solana 的 Ed25519 账户体系；而分片/TEE 方案可一套登录态同时派生 EVM 与 Solana 地址。</p>'],
  ['为什么说「把嵌入式钱包的恢复密码直接明文存在项目方自己的数据库里」是极度危险的设计？', '<p>这会让原本的非托管/半托管架构退化为事实上的中心化托管钱包：一旦项目方数据库被拖库或内部员工作恶，所有用户钱包会被一锅端，同时还可能触发严格的 VASP 托管牌照合规义务（见 <a href="#m11-1">M12.1 合规全景</a>）。</p>']
])}
${checklist([
  '能清晰区分 Shamir/MPC 分片、TEE 飞地与纯链上 Passkey 三种无助记词钱包的底层机制。',
  '能解释 secp256k1 与 secp256r1（P-256）的差异，以及 RIP-7212 预编译合约的关键价值。',
  '知道跨生态换机（iOS ↔ Android）对 Passkey 恢复的影响与工程兜底方案。',
  '能在 C 端 DApp 中落实 iframe 隔离、消费限额、二次确认与私钥导出逃生舱。'
])}
${mistakes([
  ['用了嵌入式钱包，DApp 就算完全“去中心化自托管”了', '要看密钥分片或 TEE 恢复策略是否能脱离服务商独立导出；若没有逃生舱或服务商握有多数分片，本质仍是中心化托管。'],
  ['Passkey 钱包不需要备份，永远不会丢', '如果只在单台设备本地存了 Passkey 且关闭了云同步（或换了不同手机系统），又没配置第二把 Passkey 或守护者，账号照样会永久锁死。'],
  ['所有 EVM 链都天然支持极低 Gas 的 Passkey 验签', '只有部署了 RIP-7212（0x100 预编译）的链才具备 ~3,450 Gas 的原生 P-256 验签；在不支持的链上需要回退到纯 Solidity 验签，Gas 会暴涨近百倍。']
])}
${recap([
  '嵌入式钱包消除插件与助记词门槛，主流分为“Shamir/MPC 分片”与“TEE 硬件飞地”两条跨链通用路线。',
  'Passkey（WebAuthn）基于手机安全芯片与 P-256 曲线；RIP-7212 预编译把链上验签成本压低近百倍，打通纯链上智能账户体验。',
  '消费级钱包设计必须平衡便捷与安全：独立 iframe 隔离、交易限额二次确认、跨平台恢复机制与私钥导出逃生舱缺一不可。'
])}
${quiz([
  { q: '为什么手机自带的 Passkey（WebAuthn）在没有 RIP-7212 预编译合约的 EVM 链上直接做链上验签非常昂贵？', o: ['手机芯片算力不够', '以太坊原生预编译只支持 secp256k1，而 Passkey 使用 secp256r1（P-256），用纯 Solidity 实现椭圆曲线运算需耗费数十万 Gas', 'Passkey 必须通过比特币网络广播', '浏览器不允许网页调用 Passkey'], a: 1, why: 'P-256 曲线参数与以太坊默认 ecrecover 不同，缺少原生预编译时只能靠 EVM 字节码软计算，Gas 成本极高；RIP-7212 将其降至约 3,450 Gas。' },
  { q: '对比 Shamir 分片嵌入式钱包与 AWS Nitro TEE 飞地签名钱包，后者的核心特点是什么？', o: ['私钥永远拆成 12 个英文单词给用户手抄', '私钥生成与签名都在受硬件加密隔离的飞地内完成，连云厂商和钱包运营商也无法读取明文，外部凭 Passkey/策略触发签名', '只能在以太坊主网使用，不支持 Solana', '不需要任何网络即可在链上结算'], a: 1, why: 'TEE 方案通过硬件隔离与远程证明保障私钥不离开飞地，并可内置细粒度风控策略引擎。' },
  { q: '在 DApp 中集成嵌入式钱包时，为了防止前端 XSS 攻击静默盗走用户资产，最关键的两项防护是什么？', o: ['把私钥放进 localStorage 明文保存', '钱包签名运行在独立域名的隔离 iframe 中，并对大额或异常转账强制要求 Passkey/MFA 二次确认', '关闭所有 HTTPS 证书校验', '取消单日消费限额'], a: 1, why: '独立 Origin iframe 利用浏览器同源策略隔离主站 JS，再配合策略限额与二次生物认证可有效阻断静默盗刷。' },
  { q: '纯链上 Passkey 智能合约钱包用户如果从 iPhone 换到 Android 手机且未提前配置多恢复途径，最可能遇到什么问题？', o: ['链上余额会被自动清零', '仅绑定在 Apple iCloud 钥匙串里的 Passkey 无法直接在新安卓机上使用，可能导致暂时无法签名控制账号', '以太坊地址会随机改变', 'Gas 费会变成原来的 10 倍'], a: 1, why: 'Passkey 云同步通常绑定操作系统生态（iCloud / Google 密码管理器），因此生产钱包应引导用户绑定多设备或配置社交/邮箱恢复守护者。' }
])}
${terms([
  ['嵌入式钱包', 'Embedded Wallet', '直接内嵌于应用内部、通过邮箱/社交/Passkey 无感创建与管理的非插件形态钱包。'],
  ['通行密钥', 'Passkey (WebAuthn / FIDO2)', '基于设备安全芯片与生物识别的无密码公私钥认证标准，底层采用 P-256 曲线。'],
  ['RIP-7212', 'Rollup Improvement Proposal 7212', '在预编译地址 0x100 提供原生 secp256r1（P-256）签名验证的标准，大幅降低 Passkey 钱包验签 Gas。'],
  ['安全飞地', 'TEE (Trusted Execution Environment)', '如 AWS Nitro Enclaves 提供的硬件级内存加密隔离区，用于保护密钥免受宿主机与运维人员窃取。'],
  ['逃生舱 / 私钥导出', 'Key Export / Escape Hatch', '允许嵌入式钱包用户在脱离原应用或 SDK 服务商后，仍能独立接管并转移链上资产的机制。']
])}
` });
})();
