/* ---------- M03 Web3 大前端（5）：m07-60 Web3 移动端原生开发 ---------- */
(() => {
CUR = 'm07-60';
addCh({ id: 'm07-60', nav: 'Web3 移动端原生开发', title: 'M03.12 Web3 移动端原生开发：WalletConnect v2、MWA、安全存储与商店合规', desc: 'iOS/Android/React Native 原生接链方案、WalletConnect v2 深度链接与会话保活、Solana MWA、Keychain/Keystore 与商店审核红线', html: `
<h1>M03.12 Web3 移动端原生开发：WalletConnect v2、MWA、安全存储与商店合规</h1>
${meta([
  '解释移动端原生 App 与桌面浏览器 DApp 的核心架构差异：没有 window.ethereum、跨 App 跳转与后台挂起断连。',
  '掌握 WalletConnect v2（Reown AppKit）在 iOS/Android 上的 Universal Link 深度链接、会话恢复与断线重连设计。',
  '理解 Solana Mobile Stack（MWA）在安卓本地进程间通信（IPC）上的低延迟签名优势。',
  '落实移动端私钥/分片的硬件安全区（Secure Enclave / StrongBox）存储规范，避开 App Store 与 Google Play 的加密审核拒审红线。'
], '前置：<a href="#m07-2">M03.2 连接钱包</a>、<a href="#m07-8">M03.8 前端安全</a>、<a href="#m03-60">M08.12 嵌入式钱包与 Passkey</a>')}
${beginner(`<p><strong>深度链接（Deep Link / Universal Link）</strong>：在手机上点一下 App 里的“去钱包签名”，自动拉起 MetaMask 或 Phantom App 并跳到确认弹窗的技术通道。</p>
<p><strong>MWA（Mobile Wallet Adapter）</strong>：Solana 移动端推出的本地协议。它不需要经过远端中继服务器，而是通过手机本地 WebSocket 直接在 DApp 和钱包 App 之间高速传交易签名。</p>
<p><strong>Secure Enclave / StrongBox</strong>：iPhone 与旗舰 Android 手机主板上的独立安全芯片。锁在这里的密钥连操作系统内核和越狱脚本也无法直接明文导出。如果创建密钥时设置了生物识别访问策略，之后每次使用都要过面容或指纹（这是开发者选的策略，不是芯片强制）。</p>`)}

<h2>1. 一句话理解</h2>
${one('桌面端 Web3 是“同一个浏览器里插个插件”，移动端 Web3 是“两个互相隔离的沙盒 App 反复来回跳转”；做好移动端 DApp 核心攻克三件事：跨 App 拉起与后台断线恢复、硬件安全芯片存密钥，以及不踩苹果/谷歌应用商店的抽成与合规红线。')}
${call('analogy', `<p>桌面端连钱包像在同一张办公桌上把报销单递给旁边的财务盖章；移动端连外部钱包像你得先坐电梯去 5 楼财务室（Deep Link 跳钱包 App），盖完章再坐电梯回 3 楼（切回 DApp）——如果中途电梯停电（系统杀后台回收了 WebSocket），你回来时发现刚才的表单状态全丢了。</p>
<p>比喻的局限：这也是为什么新一代消费级移动 DApp 越来越多地采用“内嵌钱包 + FaceID Passkey”（见 <a href="#m03-60">M08.12</a>），直接在自家 App 里一步搞定签名，彻底省掉跨 App 跳转。</p>`)}
${art('一图看懂：移动端原生 App 连接外部钱包 vs 内置嵌入式钱包', 660, 320, [
  S.zone(15, 18, 305, 240, { t: '模式 A：外链钱包（WalletConnect v2 / MWA）', k: 'info' }),
  S.box(28, 52, 278, 52, { k: 'info', icon: 'phone', t: '原生 DApp（iOS / Android / RN）', s: '发签名请求 → 触发 Universal Link 拉起钱包' }),
  S.box(28, 124, 278, 52, { k: 'warn', icon: 'cloud', t: 'WC v2 Relay 中继（或 MWA 本地 IPC）', s: '端到端加密传参；App 切后台极易断连' }),
  S.box(28, 196, 278, 50, { k: 'ok', icon: 'wallet', t: '外部钱包 App（MetaMask / Phantom）', s: '用户确认签名 → 返回结果并切回 DApp' }),
  S.arrow(167, 106, 167, 122), S.arrow(167, 178, 167, 194),
  S.zone(340, 18, 305, 240, { t: '模式 B：内置自托管 / 嵌入式钱包', k: 'ok' }),
  S.box(354, 52, 278, 52, { k: 'ok', icon: 'phone', t: 'App 内直接弹窗（零跳出）', s: '类似 Apple Pay 的原生底部签名抽屉' }),
  S.box(354, 124, 278, 52, { k: 'key', icon: 'lock', t: 'iOS Keychain / Android Keystore', s: '受 Secure Enclave / StrongBox 硬件保护' }),
  S.box(354, 196, 278, 50, { k: 'info', icon: 'shield', t: 'FaceID / 指纹解锁直接签名上链', s: '无中继延迟，少一次跨 App 跳转' }),
  S.arrow(493, 106, 493, 122), S.arrow(493, 178, 493, 194),
  S.text(330, 294, '工程选型：面向加密老手保留 WC v2 / MWA；面向大众消费级 App 优先内置安全芯片/嵌入式钱包', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['flow', '左侧展示跨 App 跳转与加密中继链路；右侧展示 App 内直接调用硬件安全芯片的无缝体验。'],
  ['fail', '模式 A 在 iOS 上最常见的 Bug 是用户切到钱包确认后，原 DApp 进程被 iOS 挂起断开 WebSocket，收不到签名回包。'],
  ['risk', '模式 B 如果错误地把助记词或分片存在普通 AsyncStorage / SharedPreferences 明文里，Root/越狱设备一秒即可偷走资产。']
], '左侧展示移动端外链钱包通过深度链接与中继通信，右侧展示App内置钱包直接调用手机安全芯片完成本地生物识别签名', 'm07-60')}

<h2>2. WalletConnect v2 移动端踩坑与保活机制</h2>
<p>在 React Native、Flutter、Swift 和 Kotlin 里接入 WalletConnect v2（Reown AppKit），有三个桌面端不会遇到的特有工程问题：</p>
${mm('移动端 WalletConnect v2 跨 App 签名与后台重连时序', `
sequenceDiagram
  participant D as 原生 DApp
  participant R as WC v2 Relay 中继
  participant W as 外部钱包 App
  D->>R: 加密发送 eth_sendTransaction 请求
  D->>W: 打开 Universal Link 拉起钱包前台
  Note over D: iOS 进后台几秒内挂起 DApp，申请后台任务最多延长到约 30 秒
  W->>R: 收到请求并展示签名弹窗
  W->>R: 用户确认后回传签名结果
  W->>D: 用户手动或自动切回 DApp
  D->>R: 监听 AppState 回到 active 立即重连并拉取离线回包
`, [
  ['flow', 'WC v2 Relay 会暂存离线消息，DApp 回到前台必须立刻触发重连并拉取挂起的响应，绝不能假设 WebSocket 一直在线。'],
  ['key', '优先使用 HTTPS Universal Links（iOS）与 App Links（Android），而不是自定义 URL Scheme（如 metamask://），防止恶意 App 抢注同名 Scheme 劫持签名请求。']
])}
<ul>
<li><strong>Solana MWA 对比</strong>：在 Android 生态（包括 Solana Seeker 等硬件设备），MWA 直接通过本地回环端口建立加密会话，不经过外网 Relay，延迟极低且支持批量多交易授权；在 iOS 上则仍需结合 WalletConnect 或深度链接适配。</li>
</ul>

<h2>3. 移动端密钥存储安全规范</h2>
${tbl(['存储位置', '安全等级', '是否允许存放私钥/助记词/分片', '工程实践'], [
  ['<strong>AsyncStorage / SharedPreferences / UserDefaults</strong>', '极低（明文文件，备份或越狱直接可读）', '<strong>严禁存放任何密钥</strong>', '只存主题、语言、非敏感缓存'],
  ['<strong>iOS Keychain / Android Keystore 加密 + DataStore</strong>', '高（绑定系统加密与生物识别访问策略）', '允许存加密分片或临时会话密钥', 'iOS：设 <code>kSecAttrAccessibleWhenUnlockedThisDeviceOnly</code>（不随备份迁移到其他设备），并保持 <code>kSecAttrSynchronizable</code> 为 false（不进 iCloud 钥匙串同步）。Android：Jetpack 的 EncryptedSharedPreferences（security-crypto）已于 2025 年弃用，新项目改用 Keystore 密钥自行加密后存入 DataStore'],
  ['<strong>Secure Enclave（iOS）/ StrongBox（Android）</strong>', '<strong>最高（硬件隔离芯片，私钥不出芯片）</strong>', '推荐直接生成 P-256 Passkey 或加密主密钥的包装密钥', '配合 FaceID / BiometricPrompt 触发单次硬件签名']
])}

<h2>4. App Store 与 Google Play 加密应用审核红线</h2>
<p>大量 Web3 团队把产品写完却在提审阶段被苹果或谷歌反复拒审，甚至直接下架。提审前必须对照四大核心规则：</p>
${tbl(['审核维度', 'App Store（Apple 3.1.1 / 3.1.5）', 'Google Play 区块链内容政策', '合规落地建议'], [
  ['<strong>数字商品与 NFT 交易抽成</strong>', '不得引导绕过 IAP 购买解锁 App 内功能的数字商品；展示/铸造 NFT 不可用外部按钮解锁隐藏特权', '允许交易链上 NFT，但须明确披露，严禁以赌博/开盲盒概率误导', '把“链上纯资产转账/DEX 交易”与“App 内虚拟道具付费”彻底解耦'],
  ['<strong>交易所与托管钱包资质</strong>', '仅允许在持有合法牌照的国家和地区上架加密交易所类 App', '托管钱包/交易所须声明合规资质与地区限制', '纯自托管钱包在审核说明中明确提供“无后台私钥接触”架构证明与演示录屏'],
  ['<strong>挖矿与后台耗电</strong>', '严禁在设备本地执行 PoW 挖矿', '严禁设备端本地挖矿（允许远程矿池监控 App）', 'App 内绝不嵌入任何本地算力挖矿逻辑'],
  ['<strong>审核测试账号与演示</strong>', '审核员不懂助记词，经常因连不上钱包直接拒审', '同左，要求可完整走通核心交互', '提供测试网模式、预置测试币演示账号及清晰英文操作录屏']
])}

${exercises([
  ['你在 iOS 原生 App 里用自定义 URL Scheme（<code>mywallet://sign?...</code>）唤起外部钱包，安全审计为什么把它标为中危漏洞？', '<p>iOS 和 Android 上任意第三方恶意 App 都可以声明注册同一个自定义 URL Scheme，引发 Scheme 劫持（点击后跳转到假钱包钓鱼）。应改用绑定了域名证书校验（<code>apple-app-site-association</code> / <code>assetlinks.json</code>）的 HTTPS Universal Links / App Links。</p>'],
  ['如果一款 React Native 自托管钱包把用户助记词存进了默认配置的 iOS Keychain 且未加 <code>ThisDeviceOnly</code> 标志，换新手机或开启 iCloud 备份时会带来什么隐患？', '<p>未设置 <code>ThisDeviceOnly</code> 时，密钥可能被随整机备份上传到云端或迁移到他人电脑的 iTunes 备份中，扩大私钥暴露面。自托管主密钥应强制锁定本机硬件区，并由用户自主决定加密云恢复或离线抄写。</p>']
])}
${checklist([
  '能处理移动端 App 切后台挂起导致的 WalletConnect WebSocket 断连与前台恢复拉包。',
  '在跨 App 唤起中使用 Universal Links / App Links 替代容易被劫持的自定义 URL Scheme。',
  '严禁把私钥/分片写入明文存储，严格使用 Secure Enclave / StrongBox + ThisDeviceOnly 策略。',
  '上架 App Store / Google Play 前完成非托管声明、NFT/IAP 边界排查与测试网审核演示准备。'
])}
${mistakes([
  ['把桌面端 wagmi 网页套一层 WebView 打包成 App，体验就和原生一样了', '套壳 WebView 经常在 iOS 出现 Universal Link 跳转失效、Passkey 权限受限、键盘遮挡和审核以“4.2 最小功能集”被拒的问题。'],
  ['在 React Native 里用 AsyncStorage 存加密后的助记词就够安全了', '如果加密用的固定密钥硬编码在 JS Bundle 里，逆向拆包几分钟就能还原明文；密钥必须由系统级 Keychain/Keystore 硬件保护。'],
  ['苹果商店全面禁止所有 Web3 和加密货币 App', '苹果允许自托管钱包、合规持牌交易所与合规 NFT 展示工具上架，真正触发拒审的通常是绕过内购抽成、缺乏地区牌照或未提供可用测试流程。']
])}
${recap([
  '移动端原生 Web3 面临无注入插件、跨 App 跳转与后台挂起断连三大挑战。',
  '外链钱包推荐 WalletConnect v2（Universal Links + 回到前台重连）与安卓端 Solana MWA；消费级 App 优先内置安全芯片/嵌入式钱包。',
  '密钥存储必须落入 iOS Keychain / Secure Enclave 与 Android StrongBox，并禁用不安全云同步。',
  '提前对齐 App Store 3.1.1/3.1.5 与 Google Play 政策，规避内购红线、明文挖矿与审核心跳卡死。'
])}
${quiz([
  { q: '为什么移动端 DApp 唤起外部钱包时，推荐使用 HTTPS Universal Links / App Links 而不是自定义 URL Scheme（如 <code>wallet://</code>）？', o: ['自定义 Scheme 不能传递参数', '自定义 Scheme 可被手机上其他恶意 App 抢注劫持，而 Universal Links 绑定了域名证书归属校验，更安全', 'iOS 完全不支持自定义 Scheme', 'Universal Links 不需要网络就能自动广播交易'], a: 1, why: 'Universal Links 通过服务器上的 apple-app-site-association 文件校验归属，防止恶意软件冒充钱包拦截跳转。' },
  { q: '用户在 iOS 原生 DApp 点击通过 WalletConnect v2 签名并跳转到钱包 App，1 分钟后切回 DApp 却一直转圈收不到签名结果，最常见的原因是？', o: ['以太坊主网停机了', '原 DApp 切入后台后被 iOS 挂起断开了 Relay WebSocket，回到前台时未监听 AppState 主动重连拉取离线消息', 'iPhone 不支持椭圆曲线签名', 'WalletConnect 只能在电脑上用'], a: 1, why: '移动操作系统会迅速冻结后台应用的网络连接，必须在应用回到 active 状态时主动触发会话重连。' },
  { q: '在移动端自托管钱包开发中，存放用户加密密钥材料最安全的位置是？', o: ['React Native 的 AsyncStorage', '写死在前端环境变量 .env 文件里', 'iOS Secure Enclave / Keychain（设置 ThisDeviceOnly）与 Android StrongBox Keystore', '手机相册的隐藏文件夹'], a: 2, why: '硬件安全芯片与系统级安全存储区能结合生物识别防提取，且 ThisDeviceOnly 可避免明文或密钥随非预期备份外泄。' },
  { q: '向 Apple App Store 提交一款自托管 Web3 钱包 App 时，以下哪种做法最容易直接导致拒审？', o: ['提供测试网演示账号和审核操作视频', '在 App 内引导用户跳转到外部网页用加密货币购买解锁 App 高级订阅功能以绕过苹果内购（IAP）', '清晰声明非托管架构并支持生物识别', '集成 EIP-6963 / WalletConnect'], a: 1, why: '绕过 App Store 内购机制解锁 App 内部数字功能直接违反 Apple 审核指南 3.1.1，是 Web3 应用最常见的拒审原因。' }
])}
${terms([
  ['深度链接', 'Universal Links / App Links', '绑定 HTTPS 域名归属验证的安全跨 App 跳转机制，用于防 URL Scheme 劫持。'],
  ['MWA', 'Solana Mobile Wallet Adapter', 'Solana 移动端协议，允许安卓本地 DApp 与钱包通过本地加密通道低延迟交互。'],
  ['硬件安全芯片', 'Secure Enclave / StrongBox', 'iOS 与 Android 手机中独立于主 CPU 的加密协处理器，用于生成和保护不可导出的私钥。'],
  ['应用内购买', 'IAP (In-App Purchase)', '苹果与谷歌应用商店要求用于购买 App 内部虚拟数字商品与订阅服务的官方结算通道。']
])}
` });
})();
