/* ---------- M03 子文章（1/4）：技术栈、连接钱包、读合约 ---------- */
(() => {
CUR = 'm07-1';
addCh({ id: 'm07-1', nav: 'DApp 技术栈', title: 'M03.1 DApp 技术栈：从 React 到 wagmi 的分层与选型', desc: '补齐 React/Next.js 最小知识，看懂 DApp 五层结构，搭好第一个 wagmi 项目。', html: `
<h1>M03.1 DApp 技术栈：从 React 到 wagmi 的分层与选型</h1>
${meta(['用自己的话解释 React 组件、状态、Hook 和 Next.js 的服务端渲染。', '画出 DApp 的五层结构，说出每层用什么库、会出什么错。', '用 create-next-app + wagmi + viem 搭出可连接钱包的项目骨架。'], '<a href="#m07">M03 模块总览</a>、<a href="#m00-4">M00.4 第一次使用钱包</a>')}
${beginner(`<p><strong>前端（Frontend）</strong>：运行在用户浏览器里的那部分程序，负责画界面、响应点击。</p>
<p><strong>组件（Component）</strong>：一块可复用的界面，例如“按钮”“余额卡片”。在 React 里，组件就是一个返回界面的函数。</p>
<p><strong>状态（State）</strong>：界面要记住的数据，例如“当前选中的代币”。状态一变，界面自动重画。</p>
<p><strong>npm 包（Package）</strong>：别人写好、发布到 npm 仓库的代码库。<code>npm install viem</code> 就是把 viem 下载进项目。</p>
<p><strong>RPC 节点</strong>：替你读写区块链的服务器。前端通过它查询余额、发送交易（见 <a href="#m01-5">M01.5 节点与 JSON-RPC</a>）。</p>
<p><strong>钱包（Wallet）</strong>：保管私钥、替用户签名的软件，例如 MetaMask、Rabby。</p>`)}

<h2>1. 一句话理解</h2>
${one('DApp 前端 = 一个普通的 React 网站 + 一层“钱包连接” + 一层“链交互”。网站负责界面，钱包负责签名，链负责记账。')}
${call('analogy', `<p>把 DApp 想成一家“自助银行网点”。网点的装修和指示牌是 React 界面；门口的身份核验机是钱包连接层；柜台后面连着总行系统的专线是链交互层（RPC）；墙上的历史流水大屏来自数据层（索引服务）。</p>
<p>类比的局限：真实银行网点能替你操作账户。DApp 网点<strong>不能</strong>。每一笔动钱的操作，都必须你自己在钱包里签字。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m07-1"><div class="mmd-title"><span>一图看懂：DApp 的四个部件</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 266" role="img" aria-label="DApp 前端、钱包、RPC 节点、区块链与可选后端"><rect x="20" y="20" width="330" height="210" rx="12" fill="var(--paper)" stroke="var(--ink-2)" stroke-width="1.5"/><rect x="20" y="20" width="330" height="26" rx="12" fill="var(--tint)"/><circle cx="38" cy="33" r="5" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1"/><circle cx="54" cy="33" r="5" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="1"/><text x="190" y="38" font-size="12" text-anchor="middle" fill="var(--ink-2)">浏览器</text><rect x="40" y="62" width="190" height="150" rx="10" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="135" y="88" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">前端 DApp</text><text x="135" y="110" font-size="11.5" text-anchor="middle" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">React + wagmi + viem</text><text x="135" y="136" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">读余额、报价、状态</text><text x="135" y="156" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">组装交易、展示结果</text><rect x="250" y="62" width="86" height="150" rx="10" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="1.5"/><g fill="none" stroke="var(--warn)" stroke-width="3"><circle cx="268" cy="110" r="9"/><path d="M277 110 h26 v8 M289 110 v6"/></g><text x="293" y="150" font-size="13" text-anchor="middle" fill="var(--ink)" font-weight="700">钱包</text><text x="293" y="170" font-size="11" text-anchor="middle" fill="var(--ink-2)">持有私钥</text><text x="293" y="186" font-size="11" text-anchor="middle" fill="var(--ink-2)">确认并签名</text><line x1="230" y1="120" x2="250" y2="120" stroke="var(--warn)" stroke-width="2"/><path d="M250.0 120.0 L242.8 123.5 L242.8 116.5 z" fill="var(--warn)"/><rect x="450" y="40" width="130" height="70" rx="10" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="515" y="70" font-size="14" text-anchor="middle" fill="var(--ink)" font-weight="700">RPC 节点</text><text x="515" y="92" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">读状态 · 收交易</text><rect x="630" y="40" width="110" height="190" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><text x="685" y="120" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">区块链</text><text x="685" y="142" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">合约与状态</text><rect x="450" y="160" width="130" height="70" rx="10" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="515" y="190" font-size="13" text-anchor="middle" fill="var(--ink)" font-weight="700">后端（可选）</text><text x="515" y="211" font-size="11.5" text-anchor="middle" fill="var(--ink-2)">索引 · 历史 · 列表</text><line x1="350" y1="70" x2="446" y2="70" stroke="var(--ink-2)" stroke-width="2"/><path d="M446.0 70.0 L438.8 73.5 L438.8 66.5 z" fill="var(--ink-2)"/><text x="398" y="62" font-size="11.5" text-anchor="middle" fill="var(--ink)">① 读</text><line x1="350" y1="100" x2="446" y2="90" stroke="var(--warn)" stroke-width="2"/><path d="M446.0 90.0 L439.2 94.2 L438.5 87.3 z" fill="var(--warn)"/><text x="398" y="112" font-size="11" text-anchor="middle" fill="var(--warn)">③ 广播已签名交易</text><line x1="580" y1="75" x2="626" y2="75" stroke="var(--ink-2)" stroke-width="2"/><path d="M626.0 75.0 L618.8 78.5 L618.8 71.5 z" fill="var(--ink-2)"/><line x1="630" y1="195" x2="584" y2="195" stroke="var(--ink-2)" stroke-width="2"/><path d="M584.0 195.0 L591.2 191.5 L591.2 198.5 z" fill="var(--ink-2)"/><line x1="450" y1="195" x2="354" y2="195" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="5 4"/><path d="M354.0 195.0 L361.2 191.5 L361.2 198.5 z" fill="var(--ink-2)"/><text x="398" y="188" font-size="11" text-anchor="middle" fill="var(--ink)">④ 查历史</text><text x="380" y="254" font-size="12.5" text-anchor="middle" fill="var(--ink-2)">② 写操作先交给钱包签名；前端和后端都碰不到私钥</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>读：前端直接通过 RPC 读链上状态。写：前端组装交易，交给钱包签名，再通过 RPC 广播。</span></li><li><span class="chip key">关键</span><span>私钥只在钱包里。前端被篡改时，最后一道防线是用户在钱包里看清楚要签什么。</span></li><li><span class="chip limit">局限</span><span>链上数据不适合复杂查询（历史记录、排行），这部分交给索引器或后端。</span></li></ul></figcaption></figure>

<h2>2. 给零基础读者的 Web2 前端最小知识</h2>
<p>写 DApp 之前，你需要四个 Web2 概念：组件、状态、Hook、路由与渲染方式。下面每个概念只讲够用的部分。</p>
<h3>2.1 组件与 props</h3>
<p>React 组件是一个函数。它接收参数 <strong>props（属性）</strong>，返回一段类似 HTML 的 <strong>JSX</strong>。父组件把数据通过 props 传给子组件，数据只能从上往下流。</p>
<h3>2.2 状态与 Hook</h3>
<p><strong>Hook（钩子）</strong>是名字以 <code>use</code> 开头的函数，让组件拥有状态或副作用。最常用的三个：</p>
${tbl(['Hook', '作用', 'DApp 里的例子'], [
  ['<code>useState</code>', '保存一个会变化的值，变化时重画组件', '输入框里的兑换金额'],
  ['<code>useEffect</code>', '组件渲染后执行副作用（订阅、定时器）', '监听钱包的 accountsChanged 事件'],
  ['<code>useMemo</code>', '缓存计算结果，依赖不变就不重算', '把 bigint 余额格式化成字符串'],
  ['自定义 Hook', '把多个 Hook 组合成可复用逻辑', '<code>useTokenBalance(token)</code>'],
  ['wagmi Hook', 'wagmi 提供的现成 Hook，内部用 TanStack Query 缓存', '<code>useAccount</code>、<code>useReadContract</code>']
])}
${code('TYPESCRIPT', `
'use client'                       // Next.js：声明这是“客户端组件”，可以用状态和浏览器 API
import { useState } from 'react'

// 一个组件：接收 props.symbol，内部保存金额状态
export function AmountInput({ symbol }: { symbol: string }) {
  const [amount, setAmount] = useState('')          // 状态：用户输入（永远先存字符串）
  return (
    <label>
      金额（{symbol}）
      <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" />
    </label>
  )
}
`)}
<h3>2.3 Next.js 路由与渲染方式</h3>
<p><strong>Next.js</strong> 是基于 React 的全栈框架。它的 <strong>App Router（应用路由）</strong>用文件夹表示网址：<code>app/swap/page.tsx</code> 对应 <code>/swap</code>，<code>app/layout.tsx</code> 是所有页面共享的外壳。</p>
<p>Next.js 默认把组件当作 <strong>服务端组件（Server Component）</strong>：它在服务器上运行，不能用 <code>useState</code>，也拿不到 <code>window</code>。钱包只存在于浏览器，所以所有用到钱包的组件都必须在文件顶部写 <code>'use client'</code>。</p>
${tbl(['渲染方式', '页面何时生成', '适合 DApp 的哪部分', '注意'], [
  ['SSG 静态生成', '构建时生成一次', '落地页、文档、代币列表', '可以部署到 IPFS'],
  ['SSR 服务端渲染', '每次请求时在服务器生成', '需要 SEO 的项目页、分享卡片', '服务器不知道用户钱包状态'],
  ['CSR 客户端渲染', '浏览器下载 JS 后生成', '连接钱包后的交互界面', '首屏慢，要做加载态'],
  ['混合（推荐）', '外壳 SSR/SSG，钱包部分 CSR', '大多数 DApp', '处理好“水合”不一致，见 <a href="#m07-2">M03.2</a>']
])}
${call('info', `<p><strong>水合（Hydration）</strong>：服务器先发来一份 HTML，浏览器再把 React 逻辑“接上去”。如果服务器渲染的是“未连接”，浏览器第一次渲染却是“已连接 0x9f…”，React 会报水合不一致错误。DApp 新手几乎都会遇到这个问题。</p>`)}

<h2>3. DApp 的五层结构</h2>
${mm('DApp 前端分层', `
flowchart TB
  subgraph L1["① UI 层"]
    UI["React 组件<br/>页面 · 表单 · Toast"]
  end
  subgraph L2["② 钱包连接层"]
    CK["连接弹窗<br/>RainbowKit / AppKit"] --> WG["wagmi connectors<br/>injected · walletConnect"]
  end
  subgraph L3["③ 链交互层"]
    VM["viem<br/>编码 ABI · 发 RPC"] --> RPC["RPC 节点<br/>Alchemy / Infura / 自建"]
  end
  subgraph L4["④ 数据与索引层"]
    IDX["The Graph / Ponder<br/>自建索引器"]
  end
  subgraph L5["⑤ 后端（可选）"]
    BE["SIWE 会话 · 报价代理<br/>风控 · 通知"]
  end
  UI --> CK
  UI -->|"读状态"| VM
  WG -->|"EIP-1193 签名请求"| WAL["用户钱包"]
  WAL -->|"广播"| RPC
  UI -->|"历史 · 列表"| IDX
  UI --> BE
  IDX --> RPC
`, [
  ['flow', '读操作：UI → viem → RPC。写操作：UI → wagmi → 钱包签名 → RPC 广播。历史数据：UI → 索引服务。'],
  ['key', '钱包连接层和链交互层是 DApp 独有的两层。其他三层和普通网站相同。'],
  ['fail', 'RPC 限流或宕机时，所有余额显示为 0 或加载失败。生产环境要配置多个 RPC 做故障转移。'],
  ['limit', '没有后端时，前端无法做登录会话、推送通知、跨设备的交易历史。'],
  ['risk', '每一层都依赖 npm 包。任何一个包被投毒，都能篡改交易参数（见 <a href="#m07-8">M03.8 前端安全</a>）。']
])}
${tbl(['层', '职责', '常用库', '典型故障'], [
  ['UI 层', '界面、表单校验、状态展示', 'React、Next.js、Tailwind、shadcn/ui', '金额显示精度错误、按钮可重复点击'],
  ['钱包连接层', '发现钱包、连接、切链、监听账户变化', 'wagmi、RainbowKit、ConnectKit、Reown AppKit', '多钱包冲突、刷新后断开、移动端无法唤起'],
  ['链交互层', 'ABI 编码、读合约、模拟、发交易、等回执', 'viem（或 ethers）', 'RPC 限流、Gas 估算失败、revert'],
  ['数据与索引层', '事件历史、列表、排行、统计', 'The Graph、Ponder、Goldsky、自建（<a href="#m01-8">M01.8</a>）', '索引延迟、链重组导致数据回滚'],
  ['后端（可选）', '登录会话、报价代理、隐藏 API Key', 'Next.js Route Handlers、Go 服务', '会话劫持、API Key 泄露']
])}

<h2>4. 库选型对比</h2>
<p>2026 年主流组合是 <strong>viem + wagmi + TanStack Query + 一个连接弹窗库</strong>。下表比较各层的候选。</p>
${tbl(['维度', 'ethers.js v6', 'viem 2.x'], [
  ['定位', '老牌全功能库，面向对象 API', '轻量、函数式、TypeScript 优先'],
  ['类型推导', '需要 TypeChain 额外生成类型', 'ABI 写成 <code>as const</code> 即可推导函数名、参数、返回值'],
  ['大整数', '原生 bigint（v6 起）', '原生 bigint'],
  ['包体积', '较大', '可按需引入，tree-shaking 友好'],
  ['和 wagmi 配合', 'wagmi 2.x 不再基于 ethers', 'wagmi 2.x 的底层就是 viem'],
  ['适合', '维护老项目、后端脚本', '新项目首选']
])}
${tbl(['连接弹窗库', '维护方', '特点', '适合'], [
  ['RainbowKit', 'Rainbow', '设计精致，开箱即用，基于 wagmi', '面向 C 端的 DeFi / NFT 项目'],
  ['ConnectKit', 'Family', '主题定制灵活，基于 wagmi', '重视品牌视觉的项目'],
  ['Reown AppKit', 'Reown（原 WalletConnect 团队）', '内置 WalletConnect、邮箱/社交登录、多链（EVM、Solana 等）', '需要多链或社交登录的项目'],
  ['Web3Modal', '同上', '<strong>AppKit 的旧名</strong>。2024 年 9 月 WalletConnect 公司更名为 Reown，@web3modal 包随之由 @reown/appkit 取代' + cite('Reown：WalletConnect is now Reown', 'https://reown.com/blog/walletconnect-is-now-reown') + cite('Reown 文档：WalletConnect 旧包弃用计划', 'https://docs.reown.com/advanced/walletconnect-deprecations'), '老项目迁移时会看到这个名字'],
  ['自己写', '你', '只用 wagmi 的 <code>useConnect</code>，体积最小', '内部工具、极简 UI']
])}
${mm('如何选择连接方案', `
flowchart TD
  Q1{"需要邮箱或社交登录？"} -->|"是"| A1["Reown AppKit<br/>或 Privy / Dynamic"]
  Q1 -->|"否"| Q2{"需要非 EVM 链？"}
  Q2 -->|"是"| A1
  Q2 -->|"否"| Q3{"重视品牌定制？"}
  Q3 -->|"是"| A2["ConnectKit<br/>或自写 UI"]
  Q3 -->|"否"| A3["RainbowKit"]
`, [
  ['key', '这几个库都建立在 wagmi 之上。你学会 wagmi Hook，换弹窗库只需要改几行配置。'],
  ['limit', '弹窗库会显著增加包体积。可以用动态导入延迟加载，见 <a href="#m07-9">M03.9</a>。'],
  ['risk', '弹窗库本身是供应链风险点。2023 年 12 月 Ledger Connect Kit 被投毒就是这一层。' + cite('Ledger：Connect Kit 安全事件报告', 'https://www.ledger.com/blog/security-incident-report')]
])}

<h2>5. 项目脚手架</h2>
${steps(['用 create-next-app 创建项目，选择 TypeScript、App Router、ESLint。', '安装 wagmi、viem、TanStack Query。', '在 Reown Cloud（cloud.reown.com）申请 WalletConnect 的 projectId，写入 <code>.env.local</code>。', '写 <code>wagmi.ts</code> 配置：链、连接器、RPC。', '写 <code>providers.tsx</code>：用 WagmiProvider 和 QueryClientProvider 包住应用。', '在 <code>layout.tsx</code> 里使用 Providers，然后写第一个连接按钮。'])}
${code('BASH', `
npx create-next-app@latest my-dapp --typescript --app --eslint
cd my-dapp
npm install wagmi viem@2.x @tanstack/react-query
echo "NEXT_PUBLIC_WC_PROJECT_ID=你的projectId" >> .env.local
echo "NEXT_PUBLIC_RPC_BASE=https://base-mainnet.g.alchemy.com/v2/你的key" >> .env.local
`)}
${code('TYPESCRIPT', `
// src/lib/wagmi.ts —— 整个 DApp 的链与钱包配置
import { http, createConfig, cookieStorage, createStorage, fallback } from 'wagmi'
import { mainnet, base, sepolia } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base, mainnet, sepolia],             // 第一条链是默认链
  connectors: [
    injected(),                                  // 浏览器插件钱包（自动支持 EIP-6963 多钱包发现）
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
    coinbaseWallet({ appName: 'My DApp' }),
  ],
  transports: {
    // fallback：第一个 RPC 失败时自动切到下一个
    [base.id]: fallback([http(process.env.NEXT_PUBLIC_RPC_BASE), http()]),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,                                     // Next.js 服务端渲染必须打开
  storage: createStorage({ storage: cookieStorage }), // 用 cookie 记住连接状态，避免水合闪烁
})

declare module 'wagmi' {                         // 注册类型，让所有 Hook 知道有哪些链
  interface Register { config: typeof config }
}
`)}
${code('TYPESCRIPT', `
// src/app/providers.tsx
'use client'
import { WagmiProvider, type State } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { config } from '@/lib/wagmi'

export function Providers({ children, initialState }: { children: React.ReactNode; initialState?: State }) {
  const [queryClient] = useState(() => new QueryClient())   // 每个浏览器会话一个缓存实例
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

// src/app/layout.tsx （服务端组件）
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { config } from '@/lib/wagmi'
import { Providers } from './providers'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 从 cookie 恢复连接状态，服务器和浏览器第一次渲染一致
  const initialState = cookieToInitialState(config, (await headers()).get('cookie'))
  return (
    <html lang="zh-CN"><body><Providers initialState={initialState}>{children}</Providers></body></html>
  )
}
`)}
<h3>算一算：为什么链交互层要尽早考虑 RPC 用量（示例）</h3>
<p>一个资产页展示 20 种代币，每种读 3 个值（余额、授权额度、价格），每个新区块刷新一次。Base 出块约 2 秒。</p>
${steps(['不合并请求：每次刷新 20 × 3 = 60 个 RPC 调用。', '每分钟刷新 60 ÷ 2 = 30 次，单个用户每分钟 60 × 30 = 1,800 次调用。', '1,000 个在线用户：每分钟 1,800,000 次，约每秒 30,000 次。这会超过大多数 RPC 套餐的限额。', '用 multicall 合并后：每次刷新 1 个调用，同样条件下每秒约 500 次。', '再把刷新间隔放宽到 12 秒：每秒约 83 次。结论：合并请求和刷新策略是架构问题，不是优化细节（详见 <a href="#m07-3">M03.3</a>）。'])}

<h2>6. 推荐目录结构</h2>
${code('BASH', `
my-dapp/
├─ src/
│  ├─ app/                    # Next.js 路由：每个文件夹一个页面
│  │  ├─ layout.tsx           # 根布局：Providers、字体、全局样式
│  │  ├─ page.tsx             # 首页（可 SSG）
│  │  ├─ swap/page.tsx        # /swap 交互页（内部是客户端组件）
│  │  └─ api/                 # Route Handlers：SIWE、报价代理
│  ├─ components/             # 纯 UI 组件：Button、TokenSelect、TxToast
│  ├─ features/               # 按业务分：swap/、portfolio/，含组件 + hooks
│  ├─ hooks/                  # 通用 Hook：useTokenBalance、useTxTracker
│  ├─ lib/
│  │  ├─ wagmi.ts             # wagmi 配置
│  │  ├─ format.ts            # 金额格式化（bigint → 字符串）
│  │  └─ errors.ts            # 错误解析：把 viem 错误翻译成用户文案
│  ├─ abi/                    # ABI 常量（as const），按合约一个文件
│  └─ constants/addresses.ts  # 各链合约地址：硬编码 + 校验和格式
├─ e2e/                       # Playwright 端到端测试
├─ .env.local                 # 只放 NEXT_PUBLIC_ 公开变量和本地密钥，不提交
└─ wagmi.config.ts            # @wagmi/cli 配置：从合约生成类型安全的 ABI
`)}
${call('warn', `<p>以 <code>NEXT_PUBLIC_</code> 开头的环境变量会被打包进浏览器 JS，任何人都能看到。RPC Key 放在这里就是公开的。生产环境要在 RPC 服务商后台设置“允许的来源域名”，或者把 RPC 请求转发到自己的后端代理。</p>`)}
${tryit(`<p>搭出你的第一个 DApp 骨架：</p>${steps(['按第 5 节的命令创建项目并安装依赖。', '在 <code>app/page.tsx</code> 写一个客户端组件，用 <code>useConnect</code> 列出 <code>connectors</code> 并渲染按钮（代码见 <a href="#m07-2">M03.2</a>）。', '运行 <code>npm run dev</code>，打开 http://localhost:3000，点击 Injected 按钮连接 MetaMask。', '预期结果：页面显示你的地址；刷新页面后仍然显示已连接，且控制台没有 Hydration 报错。'])}`)}

<h2>生产环境清单</h2>
${tbl(['检查项', '为什么', '怎么验证'], [
  ['wagmi 配置 <code>ssr: true</code> + cookieStorage', '避免刷新后闪烁和水合错误', '刷新页面，控制台无 Hydration 警告'],
  ['每条链至少 2 个 RPC（fallback）', '单个 RPC 故障不影响用户', '在 DevTools 屏蔽主 RPC 域名，页面仍可读余额'],
  ['依赖精确锁版本，提交 lockfile', '防止自动升级到被投毒版本', 'CI 使用 <code>npm ci</code>，lockfile 变更需评审'],
  ['RPC Key 设置来源域名白名单', 'NEXT_PUBLIC_ 变量是公开的', '用 curl 从其他来源调用应被拒绝'],
  ['合约地址集中在 constants，按 chainId 索引', '防止切链后调用错误地址', '单元测试遍历每条链的地址都非零且为校验和格式']
])}

${mistakes([
  ['DApp 前端需要保存用户私钥才能发交易。', '前端永远不碰私钥。前端构造交易，钱包签名。'],
  ['所有组件都加 <code>“use client”</code> 最省事。', '只有用到状态、事件或钱包的组件才需要。其余保持服务端组件，首屏更快、包更小。'],
  ['ethers 和 viem 混着用没关系。', '两套库的类型和大整数处理方式不同，混用增加体积和出错概率。新项目统一用 viem。'],
  ['Web3Modal 和 Reown AppKit 是两个竞争产品。', 'Web3Modal 是 AppKit 的旧名，同一个团队维护。'],
  ['有了 RPC 就不需要索引服务。', 'RPC 适合读“当前状态”。历史列表、排行、统计要靠索引服务。']
])}
${recap([
  'React 组件是返回 JSX 的函数；状态变化会触发重画；Hook 以 use 开头。',
  'Next.js App Router 默认是服务端组件；用到钱包的组件必须声明 use client。',
  'DApp 五层：UI、钱包连接、链交互、数据索引、可选后端。钱包连接和链交互是 Web3 独有的两层。',
  '新项目首选 viem + wagmi + TanStack Query，再按需求选 RainbowKit、ConnectKit 或 Reown AppKit。',
  'wagmi 配置要打开 ssr 并用 cookieStorage；RPC 要有 fallback；NEXT_PUBLIC_ 变量是公开的。'
])}
${quiz([
  { q: '在 Next.js App Router 里，一个调用 <code>useAccount()</code> 的组件没有写 use client，会发生什么？', o: ['正常运行，Next.js 会自动处理', '构建或运行时报错，因为服务端组件不能使用 Hook', '只在生产环境报错', '组件会被渲染两次'], a: 1, why: '服务端组件在服务器运行，不能使用 React Hook，也拿不到浏览器钱包。必须在文件顶部声明 use client。其他选项都忽略了这条规则。' },
  { q: '下面哪一层负责“把函数名和参数编码成 calldata 并发给 RPC”？', o: ['UI 层', '钱包连接层', '数据与索引层', '链交互层'], a: 3, why: '链交互层（viem）负责 ABI 编码和 RPC 通信。钱包连接层负责发现和连接钱包；索引层负责历史数据。' },
  { q: '为什么 wagmi 配置里推荐 <code>storage: createStorage({ storage: cookieStorage })</code>？', o: ['cookie 比 localStorage 更安全，能保存私钥', '服务器能读到 cookie，从而在 SSR 时渲染出与浏览器一致的连接状态', 'cookie 可以加快 RPC 请求', 'WalletConnect 只支持 cookie'], a: 1, why: '服务器读不到 localStorage，但能从请求头读 cookie。cookieToInitialState 用它恢复状态，避免水合不一致。任何存储都不应该保存私钥。' },
  { q: '团队要做一个支持邮箱登录和 Solana 的多链 DApp，连接层最合适的是？', o: ['Reown AppKit', '只用 injected 连接器', 'ethers.js', 'RainbowKit 默认配置'], a: 0, why: 'AppKit 内置社交/邮箱登录和多链支持。injected 只连插件钱包；ethers 是链交互库不是连接层；RainbowKit 主要面向 EVM 钱包。' }
])}
${exercises([["一个页面上半部分是需要 SEO 的项目介绍，下半部分是连接钱包后的兑换表单。在 Next.js App Router 里，你会怎样分配渲染方式和 use client？", "<p>外壳和介绍部分用 SSR 或 SSG，保持服务端组件。只有兑换表单这类用到状态、事件或钱包的组件，才在文件顶部写 <code>'use client'</code>。这样首屏更快，包也更小。钱包部分在浏览器里渲染，要处理好水合一致，例如用 cookieStorage 恢复连接状态。</p>"], ["（示例）资产页展示 10 种代币，每种读 2 个值，Base 上每 2 秒刷新一次。单个用户每分钟发多少个 RPC 调用？用 multicall 合并后呢？500 个在线用户时，合并前后每秒各是多少？", "<p>不合并：每次刷新 10 × 2 = 20 个调用，每分钟刷新 30 次，单个用户每分钟 600 次。合并后每次刷新 1 个调用，每分钟 30 次。500 个用户合并前每分钟 300,000 次，约每秒 5,000 次；合并后每分钟 15,000 次，约每秒 250 次。合并请求和刷新策略要在架构阶段就决定。</p>"], ["团队把 RPC Key 写在 <code>NEXT_PUBLIC_RPC_BASE</code> 里。这有什么问题？你会怎样配置才能上生产？", "<p>以 <code>NEXT_PUBLIC_</code> 开头的变量会被打包进浏览器 JS，任何人都能看到这个 Key。要在 RPC 服务商后台设置允许的来源域名，或者把 RPC 请求转发到自己的后端代理。同时每条链至少配置 2 个 RPC，用 <code>fallback</code> 做故障转移。</p>"]])}
${checklist(["能画出 DApp 五层结构，并说出每层的常用库和典型故障。", "能用 create-next-app、wagmi、viem 和 TanStack Query 搭出项目骨架，并用 WagmiProvider 和 QueryClientProvider 包住应用。", "能判断哪些组件必须写 use client，哪些应保持服务端组件。", "能在 wagmi 配置里打开 ssr、使用 cookieStorage，并用 fallback 为每条链配置多个 RPC。", "能按是否需要社交登录、多链和品牌定制，选出合适的连接弹窗库。"])}
${terms([
  ['组件', 'Component', '返回界面片段的函数，可组合、可复用'],
  ['Hook', 'React Hook', '以 use 开头、让组件拥有状态或副作用的函数'],
  ['服务端组件', 'Server Component', '只在服务器运行的 React 组件，不能用状态和浏览器 API'],
  ['水合', 'Hydration', '浏览器把 React 逻辑接到服务器生成的 HTML 上的过程'],
  ['SSR / SSG / CSR', 'Server-Side Rendering / Static Site Generation / Client-Side Rendering', '页面在请求时、构建时或浏览器里生成的三种方式'],
  ['wagmi', 'wagmi', '基于 viem 和 TanStack Query 的 React Hooks 库'],
  ['TanStack Query', 'TanStack Query', '管理异步数据请求、缓存与刷新的库，wagmi 的缓存层'],
  ['Reown AppKit', 'Reown AppKit', 'Reown 维护的钱包连接 UI 套件，前身是 Web3Modal']
])}
` });

CUR = 'm07-2';
addCh({ id: 'm07-2', nav: '连接钱包', title: 'M03.2 连接钱包：EIP-1193、EIP-6963、WalletConnect 与 wagmi', desc: '从 window.ethereum 讲到多钱包发现、扫码连接、切链和 SSR 水合。', html: `
<h1>M03.2 连接钱包：EIP-1193、EIP-6963、WalletConnect 与 wagmi</h1>
${meta(['说清 EIP-1193 的 request 方法、三个核心事件和常见错误码。', '解释 EIP-6963 解决了什么问题，以及 WalletConnect v2 的配对、中继、会话流程。', '用 wagmi 实现连接、断开、切链、添加网络，并处理刷新重连与移动端。'], '<a href="#m07-1">M03.1 DApp 技术栈</a>')}
${beginner(`<p><strong>浏览器扩展（Extension）</strong>：装在浏览器里的小程序。MetaMask、Rabby 都是扩展钱包。</p>
<p><strong>注入（Injection）</strong>：扩展在每个网页里自动放一个 JavaScript 对象，网页可以调用它。这个对象叫 <strong>Provider（提供者）</strong>。</p>
<p><strong>事件（Event）</strong>：对象主动通知网页“某件事发生了”，例如“用户切换了账户”。</p>
<p><strong>chainId（链 ID）</strong>：区分不同链的数字。以太坊主网 1，Base 8453，Arbitrum One 42161。</p>
<p><strong>深链（Deep Link）</strong>：一种能直接打开手机 App 指定页面的链接。</p>`)}

<h2>1. 一句话理解</h2>
${one('连接钱包 = 网页找到钱包对象 → 请求用户授权查看地址 → 记住连接 → 持续监听账户和网络的变化。')}
${call('analogy', `<p>连接钱包像在酒店前台登记：你出示身份证（授权地址），前台记下你的房号（连接状态）。之后你换房（切账户）或换楼（切网络），前台必须立刻更新记录，否则会把账单送错房间。</p>
<p>类比的局限：酒店前台可以扣你押金。DApp 连接钱包后<strong>只能看到地址</strong>，每次动钱仍要你签字。</p>`)}
${art('一图看懂：连接钱包只交出地址，私钥一直留在钱包里', 660, 262, [
  S.box(10, 36, 170, 84, { k: 'info', icon: 'globe', t: 'DApp 网页', s: 'wagmi + viem\n只拿到地址与链' }),
  S.box(245, 36, 170, 84, { k: 'key', icon: 'link', t: 'Provider 接口', s: 'request() + 事件', tag: 'EIP-1193' }),
  S.box(480, 36, 170, 84, { k: 'warn', icon: 'wallet', t: '钱包', s: '私钥不出钱包\n每次动钱要你确认' }),
  S.arrow(182, 78, 243, 78, { both: 1 }),
  S.arrow(417, 78, 478, 78, { both: 1 }),
  S.text(330, 154, '网页找到钱包的三种方式', { size: 12, dim: 1, anchor: 'middle' }),
  S.box(10, 168, 196, 46, { k: 'idle', t: '注入式', s: 'window.ethereum', mono: 1 }),
  S.box(232, 168, 196, 46, { k: 'idle', t: 'EIP-6963', s: '多个钱包同时发现' }),
  S.box(454, 168, 196, 46, { k: 'idle', t: 'WalletConnect v2', s: '手机钱包扫码' }),
  S.text(330, 246, '连接后：网页只看到地址和链，转账仍要钱包弹窗里的你签字', { size: 13, anchor: 'middle', mw: 620 })
], [ ['flow', '网页不直接碰钱包，只通过统一的 Provider 接口发 request，并监听账户、链变化的事件。'], ['key', '连接只授权“可以看到这个地址”，不等于授权转账；每一次动钱仍要钱包弹窗确认。'], ['fail', '没有监听 accountsChanged 和 chainChanged，用户在钱包里切账户后，界面会显示错的地址。'], ['limit', '三种发现方式最终都落到同一个接口；生产里交给 wagmi 处理。'] ], 'DApp 网页通过 EIP-1193 Provider 接口与钱包通信，钱包持有私钥，网页只拿到地址；网页可通过注入、EIP-6963 或 WalletConnect 找到钱包', 'm07-2')}

<h2>2. 注入式钱包与 EIP-1193</h2>
<p><strong>EIP-1193（以太坊 Provider JavaScript API）</strong>规定了钱包对象的统一形状：一个 <code>request</code> 方法，加上一组事件。MetaMask 把这个对象放在 <code>window.ethereum</code>。</p>
${code('TYPESCRIPT', `
// 不用任何库，直接和注入式钱包对话（理解原理用，生产请用 wagmi）
const eth = (window as any).ethereum
if (!eth) throw new Error('没有检测到钱包扩展')

// 1. 请求授权：弹出钱包窗口，用户同意后返回地址数组
const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })

// 2. 查询当前链：返回十六进制字符串，例如 '0x2105'（= 8453，Base）
const chainIdHex: string = await eth.request({ method: 'eth_chainId' })

// 3. 监听三个核心事件
eth.on('accountsChanged', (accs: string[]) => {
  // 用户切换账户，或在钱包里断开本站（此时 accs 为空数组）
  if (accs.length === 0) console.log('已断开')
})
eth.on('chainChanged', (id: string) => { console.log('新链', parseInt(id, 16)) })
eth.on('disconnect', (err: { code: number }) => { console.log('钱包与所有链断开', err.code) })
`)}
${tbl(['方法', '作用', '会弹窗吗'], [
  ['<code>eth_requestAccounts</code>', '请求连接，返回授权地址', '首次会'],
  ['<code>eth_accounts</code>', '查询已授权地址，未授权返回空数组', '不会'],
  ['<code>eth_chainId</code>', '查询当前链 ID（十六进制）', '不会'],
  ['<code>wallet_switchEthereumChain</code>', '请求切换到已知链', '会'],
  ['<code>wallet_addEthereumChain</code>', '请求添加新链（名称、RPC、浏览器、原生币）', '会'],
  ['<code>wallet_watchAsset</code>', '请求把代币加入钱包资产列表', '会'],
  ['<code>personal_sign</code> / <code>eth_signTypedData_v4</code>', '签消息 / 签结构化数据（见 <a href="#m07-6">M03.6</a>）', '会'],
  ['<code>eth_sendTransaction</code>', '签名并广播交易', '会']
])}
${tbl(['错误码', '含义', '前端应该怎么做'], [
  ['4001', '用户拒绝请求', '安静恢复按钮状态，不弹红色报错'],
  ['4100', '未授权（没连接就请求）', '先调用 eth_requestAccounts'],
  ['4200', '钱包不支持该方法', '降级方案，或提示换钱包'],
  ['4900 / 4901', '钱包断开所有链 / 断开当前链', '显示“连接已断开”，提供重连'],
  ['4902', '钱包不认识这条链（MetaMask 在切链时返回）', '改为调用 wallet_addEthereumChain'],
  ['-32002', '已有一个相同请求在等待（MetaMask）', '提示“请打开钱包处理待确认请求”']
])}
<h3>算一算：chainId 的十六进制换算（示例）</h3>
<p>EIP-1193 里 chainId 用十六进制字符串传递。把 Base 的 8453 换成十六进制：</p>
${steps(['8453 ÷ 4096（16³）= 2，余 261。第一位是 2。', '261 ÷ 256（16²）= 1，余 5。第二位是 1。', '5 ÷ 16 = 0，余 5。第三位是 0，第四位是 5。', '结果：<code>0x2105</code>。反过来 <code>parseInt("0x2105", 16) === 8453</code>。同理 Arbitrum 42161 = <code>0xa4b1</code>。'])}

<h2>3. EIP-6963：多钱包发现</h2>
<p>早期所有扩展都抢着写 <code>window.ethereum</code>。用户同时装了 MetaMask 和 Rabby，后加载的会覆盖先加载的，网页只能看到一个。<strong>EIP-6963（多注入提供者发现）</strong>改用事件广播：每个钱包各自“举手报到”，网页把它们全部列出来。</p>
${mm('EIP-6963 发现流程', `
sequenceDiagram
  participant D as DApp 网页
  participant M as MetaMask 扩展
  participant R as Rabby 扩展
  D->>D: 监听 eip6963:announceProvider
  D->>M: 广播 eip6963:requestProvider
  D->>R: 广播 eip6963:requestProvider
  M-->>D: announce 包含 info 与 provider
  R-->>D: announce 包含 info 与 provider
  D->>D: 按 rdns 去重 并渲染钱包列表
  D->>R: 用户选 Rabby 后 调用 provider.request
`, [
  ['flow', '网页先监听，再广播请求。钱包加载完成时也会主动 announce 一次，所以先后顺序不影响结果。'],
  ['key', 'info 包含 uuid、name、icon（data URI）、rdns（反向域名，例如 io.metamask）。用 rdns 识别钱包。'],
  ['limit', '只适用于浏览器扩展。手机上的独立钱包 App 仍要靠 WalletConnect 或钱包内置浏览器。'],
  ['risk', 'icon 是钱包提供的图片。渲染时只当作 img 的 src，不要当作 HTML 插入，避免注入。']
])}
${code('TYPESCRIPT', `
type Info = { uuid: string; name: string; icon: string; rdns: string }
const found = new Map<string, { info: Info; provider: any }>()

window.addEventListener('eip6963:announceProvider', (e: any) => {
  found.set(e.detail.info.rdns, e.detail)        // 按 rdns 去重
})
window.dispatchEvent(new Event('eip6963:requestProvider'))
// wagmi 的 injected() 连接器默认已实现这一套，useConnect().connectors 里会出现每个钱包
`)}

<h2>4. WalletConnect v2：手机钱包怎么连电脑网页</h2>
<p>手机钱包 App 无法往电脑浏览器里注入对象。<strong>WalletConnect</strong> 用一台<strong>中继服务器（Relay）</strong>转发加密消息：网页和钱包都连到中继，但中继看不懂内容。</p>
${mm('WalletConnect v2 连接流程', `
sequenceDiagram
  participant D as DApp 网页
  participant RL as 中继服务器
  participant W as 手机钱包
  D->>D: 生成 pairing topic 与对称密钥
  D->>RL: 订阅 pairing topic
  D->>W: 展示二维码 wc URI 或移动端深链
  W->>RL: 扫码后订阅同一 topic
  D->>W: 经中继发送 session proposal 含所需链和方法
  W->>W: 用户查看并批准 namespaces
  W->>D: 经中继返回 session settle 和授权账户
  Note over D,W: 双方用新协商的会话密钥加密之后的所有消息
  D->>W: 请求 eth_sendTransaction
  W->>D: 返回 txHash
`, [
  ['flow', '二维码里是 wc: 开头的配对 URI，包含 topic、中继协议和对称密钥。扫码 = 把密钥安全地交给手机。'],
  ['key', '配对（Pairing）和会话（Session）是两层。一个配对可以承载多次会话；会话规定可用的链、方法、事件（namespaces）。'],
  ['fail', '中继不可达或 projectId 无效时，二维码扫了没反应。检查 projectId 和 CSP 的 connect-src 是否放行中继域名。'],
  ['limit', '会话有有效期（默认约 7 天，可续期）。过期后用户需要重新扫码。'],
  ['risk', '中继看不到明文，但钓鱼网站同样能生成合法二维码。WalletConnect 不保证对方网站可信，钱包会展示请求方域名，用户要核对。']
])}
<p><strong>移动端深链</strong>：用户在手机浏览器打开 DApp 时没法扫自己屏幕上的二维码。连接库会把 wc URI 拼进钱包的深链或通用链接（Universal Link），点击后直接跳到钱包 App 批准，再跳回浏览器。</p>

<h2>5. 用 wagmi 实现连接、切链与添加网络</h2>
${code('TYPESCRIPT', `
'use client'
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from 'wagmi'
import { base } from 'wagmi/chains'

export function WalletPanel() {
  const { address, status, chain } = useAccount()   // status: connecting | reconnecting | connected | disconnected
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: switching } = useSwitchChain()
  const chainId = useChainId()                        // 未连接时返回配置里的默认链

  if (status === 'reconnecting') return <p>正在恢复连接…</p>
  if (status !== 'connected')
    return (
      <div>
        {connectors.map(c => (                        // 含 EIP-6963 发现的每个扩展钱包
          <button key={c.uid} disabled={isPending} onClick={() => connect({ connector: c })}>
            {c.name}
          </button>
        ))}
        {error && error.name !== 'UserRejectedRequestError' && <p role="alert">{error.message}</p>}
      </div>
    )

  // chain 为 undefined：钱包所在链不在 config.chains 里
  const wrong = !chain || chain.id !== base.id
  return (
    <div>
      <p>{address?.slice(0, 6)}…{address?.slice(-4)}（{chain?.name ?? '不支持的网络'}）</p>
      {wrong && (
        <button disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
          切换到 Base
        </button>
      )}
      <button onClick={() => disconnect()}>断开</button>
    </div>
  )
}
`)}
<p><code>switchChain</code> 内部先调用 <code>wallet_switchEthereumChain</code>；如果钱包返回 4902（不认识这条链），wagmi 会用 <code>config.chains</code> 里的链信息自动调用 <code>wallet_addEthereumChain</code>。不用 wagmi 时要自己写：</p>
${code('TYPESCRIPT', `
async function ensureBase(eth: any) {
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] })
  } catch (e: any) {
    if (e.code !== 4902) throw e                          // 只有“未知链”才走添加流程
    await eth.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x2105', chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org'],
      }],
    })
  }
}
`)}
${call('warn', `<p>永远不要假设“用户连接时在哪条链，之后就一直在哪条链”。用户可以随时在钱包里切链。发交易前必须再次检查 chainId；wagmi 的 <code>writeContract</code> 可以传 <code>chainId</code> 参数，链不匹配时会报错而不是发到错误的链上。</p>`)}

<h2>6. 断线重连、SSR 水合与移动端</h2>
${mm('wagmi 连接状态机', `
stateDiagram-v2
  state "未连接" as Disconnected
  state "连接中" as Connecting
  state "已连接" as Connected
  state "恢复中" as Reconnecting
  [*] --> Reconnecting: 页面加载且存储里有上次连接
  [*] --> Disconnected: 无存储记录
  Reconnecting --> Connected: eth_accounts 返回地址
  Reconnecting --> Disconnected: 钱包已撤销授权
  Disconnected --> Connecting: 用户点击连接
  Connecting --> Connected: 用户批准
  Connecting --> Disconnected: 用户拒绝 4001
  Connected --> Connected: accountsChanged 或 chainChanged
  Connected --> Disconnected: 用户断开或账户列表为空
`, [
  ['flow', '刷新页面时 wagmi 读存储里的上次连接器，静默调用 eth_accounts（不弹窗）恢复连接。'],
  ['fail', '在 Reconnecting 阶段把 UI 渲染成“未连接”，用户会看到按钮闪一下。把 reconnecting 当作加载态处理。'],
  ['key', '账户变化不是断开：同一会话里换了地址，所有依赖地址的查询都要重新请求，wagmi 的 queryKey 包含地址，会自动处理。'],
  ['limit', '用户在钱包里撤销了站点授权，DApp 只能在下一次请求时发现。']
])}
<p><strong>SSR 水合问题</strong>的三种解法，按推荐程度排序：</p>
${steps(['<strong>cookieStorage + cookieToInitialState</strong>（M03.1 的配置）：服务器读 cookie 知道上次连接的地址，首屏就渲染一致。', '<strong>挂载后再渲染钱包部分</strong>：用 <code>useEffect</code> 设置 mounted 标记，挂载前显示骨架屏。简单但首屏看不到地址。', '<strong>动态导入并关闭 SSR</strong>：<code>dynamic(() => import("./Wallet"), { ssr: false })</code>。适合整块钱包 UI。'])}
${tbl(['移动端场景', '问题', '做法'], [
  ['手机系统浏览器（Safari / Chrome）', '没有扩展，window.ethereum 不存在', '只展示 WalletConnect 和“在钱包 App 中打开”'],
  ['钱包内置浏览器（MetaMask App 内）', '会注入 provider，行为接近桌面', '用 injected 连接器即可，检测到注入时优先显示'],
  ['从浏览器跳到钱包再跳回', '页面可能被系统挂起，WebSocket 断开', '回到前台（visibilitychange）时重新查询交易状态'],
  ['小屏幕', '地址、金额、按钮挤在一起', '地址缩写 + 复制按钮；主按钮放底部拇指区；不依赖 hover']
])}
${tryit(`<p>观察 EIP-1193 事件：</p>${steps(['在装了 MetaMask 的浏览器打开任意网页，按 F12 打开控制台。', '输入 <code>await ethereum.request({ method: "eth_chainId" })</code>，记下结果（例如 0x1）。', '输入 <code>ethereum.on("chainChanged", id => console.log("chain", parseInt(id, 16)))</code>。', '在 MetaMask 里切到另一条网络。预期：控制台打印新链的十进制 ID。', '再输入 <code>window.addEventListener("eip6963:announceProvider", e => console.log(e.detail.info))</code> 和 <code>window.dispatchEvent(new Event("eip6963:requestProvider"))</code>。预期：每个已安装的钱包打印一条 info，包含 rdns。'])}`)}

${mistakes([
  ['用户拒绝连接是错误，要弹出红色提示。', '4001 是用户的正常选择。恢复按钮即可，最多显示一行灰色提示。'],
  ['只检查一次 chainId 就够了。', '用户随时能切链。每次发交易前都要确认链匹配，并监听 chainChanged。'],
  ['WalletConnect 的中继服务器能看到交易内容。', '消息端到端加密，中继只转发密文。但它不能证明对方网站可信。'],
  ['EIP-6963 之后就不需要 WalletConnect 了。', 'EIP-6963 只解决浏览器扩展冲突。手机独立钱包仍然需要 WalletConnect。'],
  ['刷新后显示未连接，说明连接丢了。', '多数情况是 reconnecting 阶段被渲染成未连接。用 cookieStorage 并把 reconnecting 当加载态。']
])}
${recap([
  'EIP-1193 = 一个 request 方法 + accountsChanged、chainChanged、disconnect 三个核心事件。',
  '错误码 4001 是用户拒绝，4902 是未知链（改用 wallet_addEthereumChain），-32002 是请求已在等待。',
  'EIP-6963 用事件广播让多个扩展钱包同时被发现，按 rdns 识别。',
  'WalletConnect v2 通过中继转发加密消息：配对传密钥，会话定义链与方法，移动端用深链跳转。',
  'wagmi 的 useConnect、useAccount、useSwitchChain 覆盖连接与切链；cookieStorage 解决刷新和水合问题。'
])}
${quiz([
  { q: '用户在 MetaMask 里切到了 Polygon，你的 DApp 只支持 Base。<code>useAccount()</code> 返回的 <code>chain</code> 是什么？', o: ['Polygon 的链对象', 'undefined，因为该链不在 config.chains 中', 'Base 的链对象', '抛出异常'], a: 1, why: 'wagmi 只认识 config.chains 中的链。钱包所在链不在其中时 chain 为 undefined（chainId 仍是实际值）。据此显示“不支持的网络”。' },
  { q: '调用 <code>wallet_switchEthereumChain</code> 返回错误码 4902，正确处理是？', o: ['告诉用户钱包坏了', '重试 3 次', '调用 wallet_addEthereumChain 添加该链', '刷新页面'], a: 2, why: '4902 表示钱包不认识该链。添加链（提供名称、RPC、浏览器、原生币信息）后钱包通常会自动切过去。' },
  { q: 'EIP-6963 主要解决什么问题？', o: ['多个扩展钱包争抢 window.ethereum，网页只能看到一个', '手机钱包无法连接电脑网页', '交易签名不安全', 'RPC 节点限流'], a: 0, why: 'EIP-6963 让每个扩展通过事件独立报到。手机连接是 WalletConnect 的职责；签名安全和 RPC 限流与它无关。' },
  { q: 'WalletConnect 二维码中的 wc URI 最关键的作用是？', o: ['包含用户私钥', '把配对 topic 和对称密钥交给手机钱包，建立加密通道', '直接发送交易', '注册 projectId'], a: 1, why: 'URI 携带 topic、中继协议和对称密钥。私钥永远不离开钱包；交易在会话建立后才发送；projectId 是 DApp 在 Reown Cloud 申请的。' }
])}
${exercises([["（示例）用户在钱包里切链后，<code>chainChanged</code> 事件返回 <code>'0x89'</code>。它对应的十进制 chainId 是多少？你的 DApp 只配置了 Base，界面应该怎么做？", "<p>0x89 = 8 × 16 + 9 = 137，可以用 <code>parseInt('0x89', 16)</code> 验证。这条链不在 <code>config.chains</code> 里，所以 <code>useAccount</code> 返回的 <code>chain</code> 为 undefined。界面应显示“不支持的网络”，并提供调用 <code>switchChain({ chainId: base.id })</code> 的“切换到 Base”按钮。</p>"], ["设计连接与切链按钮对三个错误码的反应：4001、-32002、4902。每种情况下，按钮和提示各应该怎样变化？", "<p>4001 是用户拒绝。安静恢复按钮状态，不弹红色报错。-32002 表示已有相同请求在等待，提示“请打开钱包处理待确认请求”。4902 表示钱包不认识这条链，改为调用 <code>wallet_addEthereumChain</code> 添加该链；用 wagmi 的 <code>switchChain</code> 时它会自动处理。</p>"], ["用户在手机 Safari 里打开你的 DApp，连接列表里没有任何扩展钱包。为什么？你应该提供哪些连接方式？", "<p>手机系统浏览器没有扩展，<code>window.ethereum</code> 不存在。EIP-6963 也只适用于浏览器扩展。应只展示 WalletConnect 和“在钱包 App 中打开”。连接库会把 wc URI 拼进钱包深链，跳到钱包批准后再跳回。用户回到前台时（visibilitychange）要重新查询交易状态。</p>"]])}
${checklist(["能直接用 eth_requestAccounts、eth_chainId 和 accountsChanged、chainChanged、disconnect 三个事件与注入式钱包交互。", "能用 EIP-6963 事件发现多个扩展钱包，并按 rdns 去重。", "能说出 WalletConnect v2 中配对、会话和中继各自的作用。", "能用 useConnect、useAccount、useDisconnect、useSwitchChain 实现连接、断开和切链，并把 reconnecting 当作加载态。", "能按 4001、4902、-32002 错误码写出对应的前端处理。"])}
${terms([
  ['EIP-1193', 'Ethereum Provider JavaScript API', '钱包向网页暴露 request 方法和事件的标准'],
  ['Provider', 'Provider', '钱包注入网页、实现 EIP-1193 的 JS 对象'],
  ['EIP-6963', 'Multi Injected Provider Discovery', '用事件广播发现多个扩展钱包的标准'],
  ['rdns', 'Reverse DNS', '反向域名形式的钱包标识，例如 io.metamask'],
  ['WalletConnect', 'WalletConnect v2', '通过中继服务器转发加密消息连接钱包与 DApp 的协议'],
  ['中继', 'Relay', '只转发密文、看不到内容的消息服务器'],
  ['会话', 'Session', 'WalletConnect 中定义授权链、方法、事件且有有效期的连接'],
  ['连接器', 'Connector', 'wagmi 中适配某类钱包（injected、walletConnect 等）的模块']
])}
` });

CUR = 'm07-3';
addCh({ id: 'm07-3', nav: '读合约', title: 'M03.3 读合约：ABI、multicall、刷新策略与事件日志', desc: '看懂 ABI 和函数选择器，用 wagmi 高效读链，知道何时该交给索引服务。', html: `
<h1>M03.3 读合约：ABI、multicall、刷新策略与事件日志</h1>
${meta(['看懂 ABI 的 JSON 结构，手算一次 calldata 的组成。', '用 useReadContract、useReadContracts 和 multicall 读链，并设计刷新策略。', '分页读取事件日志，判断哪些数据必须交给索引服务。'], '<a href="#m07-1">M03.1 DApp 技术栈</a>、<a href="#m02-1">M02.1 智能合约与 EVM</a>')}
${beginner(`<p><strong>ABI（应用二进制接口）</strong>：合约的“说明书”，列出有哪些函数、参数类型、返回值类型。前端靠它把调用翻译成字节。</p>
<p><strong>eth_call</strong>：一个 JSON-RPC 方法。节点在本地执行合约函数并返回结果，不上链、不花 Gas。</p>
<p><strong>事件日志（Event Log）</strong>：合约执行时写进交易回执的记录，例如“A 转给 B 100 USDC”。合约自己读不到，链下可以查询。</p>
<p><strong>缓存（Cache）</strong>：把查过的结果暂存起来，短时间内再次需要时直接用，不重新请求。</p>
<p><strong>索引服务（Indexer）</strong>：持续扫描区块、把事件整理进数据库的服务，方便按条件查询历史。</p>`)}

<h2>1. 一句话理解</h2>
${one('读合约 = 用 ABI 把“函数名 + 参数”编码成字节，通过 eth_call 让节点执行，再用 ABI 把返回字节解码成 JS 值。')}
${call('analogy', `<p>ABI 像餐厅的点菜编号表。你说“宫保鸡丁，微辣”（函数名 + 参数），服务员写成“A07-2”（编码）交给后厨（节点）；菜端回来（返回字节），你再对照菜单认出这是什么菜（解码）。</p>
<p>类比的局限：后厨只能告诉你“现在”的菜单状态。想知道“上个月每天卖了几份”，要去查账本，这就是事件日志和索引服务的工作。</p>`)}
${art('一图看懂：读合约 = 编码成字节，节点执行，再解码回来', 660, 300, [
  S.text(451, 26, 'calldata：共 36 字节', { size: 12, dim: 1, anchor: 'middle' }),
  S.box(10, 40, 180, 60, { k: 'info', icon: 'code', t: 'balanceOf(地址)', s: '你在代码里写的调用' }),
  S.arrow(192, 70, 250, 70, { label: 'ABI 编码' }),
  S.box(252, 40, 124, 60, { k: 'key', t: '0x70a08231', s: '选择器 4 字节', mono: 1 }),
  S.box(386, 40, 264, 60, { k: 'info', t: '0x000…d8da…6045', s: '参数 32 字节：地址左补 0', mono: 1 }),
  S.arrow(314, 102, 314, 168),
  S.box(252, 170, 190, 60, { k: 'tint', icon: 'server', t: '节点执行 eth_call', s: '不上链 · 不花 Gas' }),
  S.arrow(250, 200, 162, 200, { label: '返回字节' }),
  S.box(10, 170, 150, 60, { k: 'ok', t: '1 USDC', s: '解码 0x…0f4240' }),
  S.box(470, 170, 180, 60, { k: 'idle', dash: 1, t: '历史要另外查', s: '事件日志 · 索引服务' }),
  S.text(330, 276, '余额 1,000,000 ÷ 10^6 = 1 USDC（示例）；ABI 编码和解码用的是同一张翻译表', { size: 13, anchor: 'middle', mw: 620 })
], [ ['flow', '函数名和参数先被 ABI 编码成 calldata，交给节点 eth_call 执行，返回的字节再用 ABI 解码成 JS 值。'], ['key', '前 4 字节是函数选择器（函数签名哈希的前 4 字节），后面是每个参数补齐到 32 字节。'], ['fail', '用错的 ABI 解码，不会报错，只会读出错的数字；代理合约尤其要用对 ABI。'], ['limit', 'eth_call 只能看“现在”的状态；要知道过去发生了什么，得读事件日志。'] ], '把 balanceOf 调用用 ABI 编码成 36 字节 calldata，由节点用 eth_call 执行，返回 32 字节再解码成 1 USDC；历史数据要查事件日志', 'm07-3')}

<h2>2. ABI 与函数选择器</h2>
${code('JSON', `
[
  {
    "type": "function",
    "name": "balanceOf",
    "stateMutability": "view",
    "inputs":  [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "",        "type": "uint256" }]
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from",  "type": "address", "indexed": true },
      { "name": "to",    "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InsufficientBalance",
    "inputs": [
      { "name": "sender", "type": "address" },
      { "name": "balance", "type": "uint256" },
      { "name": "needed", "type": "uint256" }
    ]
  }
]
`)}
${tbl(['字段', '含义'], [
  ['type', 'function、event、error、constructor、receive、fallback'],
  ['stateMutability', 'view / pure（只读，可用 eth_call）；nonpayable / payable（要发交易）'],
  ['inputs / outputs', '参数与返回值的名称和 Solidity 类型'],
  ['indexed', '事件参数是否进入 topics，进入后可按它过滤日志（最多 3 个）']
])}
<p><strong>函数选择器（Function Selector）</strong>是函数签名的 Keccak-256 哈希的前 4 字节。签名去掉参数名和空格：<code>balanceOf(address)</code>。</p>
<h3>算一算：一次 balanceOf 调用的 calldata（示例）</h3>
${steps(['签名字符串 <code>balanceOf(address)</code> 做 keccak256，取前 4 字节：<code>0x70a08231</code>。', '参数是地址 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045（20 字节），左侧补 0 到 32 字节。', 'calldata = 4 字节选择器 + 32 字节参数 = 36 字节，即 2 + 72 个十六进制字符。', '返回值是 32 字节的 uint256。若返回 0x…0f4240，换成十进制是 1,000,000；USDC 有 6 位小数，所以余额是 1 USDC（单位换算见 <a href="#m07-4">M03.4</a>）。'])}
${code('BASH', `
# 直接用 curl 发 eth_call（data = 选择器 + 补齐后的地址）
curl -s https://ethereum-rpc.publicnode.com -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"eth_call",
  "params":[{"to":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
             "data":"0x70a08231000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045"},"latest"]}'
# Foundry 的 cast 可以帮你编码和解码：
cast sig "balanceOf(address)"          # 0x70a08231
cast call 0xA0b8...eB48 "balanceOf(address)(uint256)" 0xd8dA...6045 --rpc-url $RPC
`)}
${call('info', `<p>两个不同函数的选择器可能相同（4 字节只有约 43 亿种取值），这叫<strong>选择器冲突</strong>。正常合约编译器会拒绝同一合约内的冲突，但代理合约与实现合约之间可能冲突。前端只需要知道：解码时要用正确的 ABI。</p>`)}

<h2>3. 用 wagmi 读合约：单个、批量与 multicall</h2>
${code('TYPESCRIPT', `
// src/abi/erc20.ts —— 写成 as const，TypeScript 才能推导出函数名、参数、返回值类型
export const erc20Abi = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const
// 实际项目可直接 import { erc20Abi } from 'viem'

// 单个读取
import { useReadContract, useReadContracts, useAccount } from 'wagmi'

export function useUsdcBalance() {
  const { address } = useAccount()
  return useReadContract({
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base 上的 USDC
    abi: erc20Abi,
    functionName: 'balanceOf',           // 写错名字 → 编译期报错
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 10_000 },  // 未连接时不请求；10 秒内视为新鲜
  })                                      // data 的类型被推导为 bigint | undefined
}

// 批量读取：wagmi 默认用 multicall 合并成一次 eth_call
export function useTokenInfo(token: \`0x\${string}\`, owner?: \`0x\${string}\`) {
  return useReadContracts({
    allowFailure: false,                 // 任意一个失败则整体报错；true 时逐条返回 { status, result }
    contracts: [
      { address: token, abi: erc20Abi, functionName: 'symbol' },
      { address: token, abi: erc20Abi, functionName: 'decimals' },
      { address: token, abi: erc20Abi, functionName: 'balanceOf', args: [owner!] },
    ],
    query: { enabled: !!owner },
  })                                      // data 类型：readonly [string, number, bigint]
}
`)}
${mm('multicall 如何合并请求', `
flowchart LR
  subgraph B1["不合并：3 次往返"]
    C1["symbol()"] --> R1["RPC"]
    C2["decimals()"] --> R1
    C3["balanceOf()"] --> R1
  end
  subgraph B2["合并：1 次往返"]
    AG["aggregate3<br/>打包 3 个调用"] --> R2["RPC"] --> MC["Multicall3 合约<br/>0xcA11…CA11"]
    MC --> T1["逐个调用目标合约"]
    T1 --> RET["返回 3 个结果<br/>含各自成功标志"]
  end
`, [
  ['flow', 'Multicall3 合约在链上逐个调用目标函数，把结果打包返回。整个过程仍是一次 eth_call，不花 Gas。'],
  ['key', 'Multicall3 在绝大多数 EVM 链上部署在同一地址 0xcA11bde05977b3631167028862bE2a173976CA11，viem 的链定义里已经内置。'],
  ['fail', '单次 multicall 打包过多调用会超出节点的 Gas 上限或响应大小限制。viem 默认按批次大小自动拆分。'],
  ['limit', '所有结果来自同一个区块，保证一致性；但无法读取“历史区块”以外的事件数据。']
])}
<p>除了 multicall，viem 还有两种合并方式：<code>createPublicClient({ batch: { multicall: true } })</code> 自动合并同一时刻的 readContract；<code>http(url, { batch: true })</code> 把多个 JSON-RPC 请求合成一个 HTTP 请求（JSON-RPC Batch）。</p>

<h2>4. 刷新策略：什么时候重新读</h2>
<p>wagmi 的每个读 Hook 背后都是一个 TanStack Query 查询。三个参数决定刷新行为：<strong>staleTime</strong>（多久后数据算“过期”）、<strong>refetchInterval</strong>（固定间隔刷新）、<strong>失效（invalidate）</strong>（事件触发时主动刷新）。</p>
${code('TYPESCRIPT', `
import { useBlockNumber, useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useLiveBalance(args: Parameters<typeof useReadContract>[0]) {
  const queryClient = useQueryClient()
  const { data: blockNumber } = useBlockNumber({ watch: true })   // 订阅新区块
  const result = useReadContract(args)

  useEffect(() => {
    // 每个新区块让余额查询失效 → 自动重新请求
    queryClient.invalidateQueries({ queryKey: result.queryKey })
  }, [blockNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  return result
}
`)}
${tbl(['数据类型', '变化频率', '推荐策略（示例）'], [
  ['代币 symbol、decimals', '几乎不变', '<code>staleTime: Infinity</code>，只读一次'],
  ['用户余额、授权额度', '用户交易后变化', '交易确认后 invalidate；另加 <code>staleTime: 10s</code>'],
  ['池子价格、报价', '每个区块都可能变', '<code>useBlockNumber({ watch: true })</code> 驱动，或 <code>refetchInterval</code> 等于出块时间'],
  ['页面切到后台', '用户看不见', 'TanStack Query 默认在窗口不可见时暂停 refetchInterval'],
  ['历史记录、排行', '追加为主', '走索引服务 + 分页，不在前端轮询 RPC']
])}
${call('warn', `<p>在每个组件里各自写 <code>useBlockNumber({ watch: true })</code> 不会重复订阅（wagmi 会共享查询），但每个新区块让 50 个查询同时失效，就是 50 个 RPC 请求。把高频刷新集中在少数关键数据上，其余用 staleTime。</p>`)}

<h2>5. 读事件日志与分页</h2>
<p><code>eth_getLogs</code> 按“合约地址 + 事件签名 + indexed 参数 + 区块范围”过滤日志。节点通常限制单次查询的区块范围或返回条数（不同服务商的限制不同，例如单次 2,000 至 10,000 个区块，以服务商文档为准）。所以要分页。</p>
${code('TYPESCRIPT', `
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_URL) })
const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

// 按区块范围分页拉取某地址收到的 USDC 转账
export async function fetchIncoming(token: \`0x\${string}\`, to: \`0x\${string}\`, fromBlock: bigint, toBlock: bigint) {
  const STEP = 5_000n                          // 每页区块数（示例），按 RPC 服务商限制调整
  const all = []
  for (let start = fromBlock; start <= toBlock; start += STEP) {
    const end = start + STEP - 1n > toBlock ? toBlock : start + STEP - 1n
    const logs = await client.getLogs({
      address: token, event: transferEvent,
      args: { to },                            // 只匹配 indexed 参数 to
      fromBlock: start, toBlock: end,
    })
    all.push(...logs)                          // logs[i].args.value 已解码为 bigint
  }
  return all
}
// 实时监听新事件：wagmi 的 useWatchContractEvent({ address, abi, eventName: 'Transfer', onLogs })
`)}
${mm('为什么列表和历史数据要交给索引服务', `
flowchart TB
  Q["用户打开“我的交易历史”"] --> D{"数据从哪来？"}
  D -->|"前端直接 getLogs"| P1["扫描 0 到最新区块<br/>数千次分页请求"]
  P1 --> X1["慢：数十秒以上<br/>RPC 限流<br/>无法排序和统计"]
  D -->|"索引服务"| I1["后台持续扫块<br/>写入数据库"]
  I1 --> I2["GraphQL / REST<br/>分页 · 排序 · 聚合"]
  I2 --> OK["毫秒级返回"]
  I1 -.->|"处理链重组"| RB["回滚已入库数据"]
`, [
  ['flow', '索引服务把“扫描全部历史”这件重活提前在后台做完，前端只做数据库查询。'],
  ['fail', '前端直接扫历史会被 RPC 限流，用户看到长时间转圈或部分数据缺失。'],
  ['limit', '索引服务有延迟（通常数秒）。刚确认的交易可能还没进列表，前端要合并“本地待确认交易”。'],
  ['risk', '索引服务是中心化组件，数据可能出错。涉及资金的判断（例如能否提现）仍要以链上 eth_call 为准。'],
  ['key', '规则：当前状态读 RPC，历史与列表读索引（自建方法见 <a href="#m01-8">M01.8 索引器工程</a>）。']
])}

<h2>6. 错误、空状态与类型安全</h2>
${tbl(['情况', '现象', 'UI 处理'], [
  ['未连接钱包', '<code>address</code> 为 undefined', '<code>enabled: false</code>，显示“连接钱包查看余额”'],
  ['加载中', '<code>isPending</code> 为 true', '骨架屏，不显示 0（0 会让用户以为钱没了）'],
  ['RPC 错误', '<code>isError</code>，error 为 HttpRequestError', '显示“网络繁忙，点击重试”，保留上一次数据'],
  ['合约不存在于当前链', 'ContractFunctionZeroDataError（返回空数据）', '检查 chainId 和地址配置'],
  ['函数 revert', 'ContractFunctionRevertedError', '解析 errorName 并翻译（见 <a href="#m07-5">M03.5</a>）'],
  ['余额确实为 0', '<code>data === 0n</code>', '显示 0 并引导“去获取代币”']
])}
<p>类型安全来自 <strong>abitype</strong>：ABI 写成 <code>as const</code> 后，TypeScript 能推导出 <code>functionName</code> 只能是哪几个字符串、<code>args</code> 的元组类型、<code>data</code> 的返回类型。大项目可用 <code>@wagmi/cli</code> 从 Foundry 产物或 Etherscan 自动生成 ABI 文件，避免手抄出错。</p>
${tryit(`<p>不写代码也能“读合约”：</p>${steps(['打开 Etherscan，搜索 USDC 合约地址 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48。', '进入 Contract → Read as Proxy，找到 balanceOf，填入任意地址，点击 Query。', '预期：返回一个整数。除以 10^6 就是 USDC 数量。', '再打开 Contract → Code 页底部的 Contract ABI，找到 balanceOf 的 JSON，和第 2 节对照。', '选做：安装 Foundry，运行 <code>cast sig &quot;transfer(address,uint256)&quot;</code>，预期输出 0xa9059cbb。'])}`)}

${mistakes([
  ['读合约也要付 Gas。', 'view/pure 函数通过 eth_call 在节点本地执行，不上链、不花 Gas。'],
  ['加载中时显示余额 0 没关系。', '用户会以为资产丢了。加载中要显示骨架屏，只有确认是 0 才显示 0。'],
  ['想要交易历史，就从创世区块开始 getLogs。', '会被 RPC 限流且极慢。历史与列表交给索引服务。'],
  ['ABI 用 JSON 文件导入也能获得类型推导。', '直接 import JSON 得不到字面量类型。需要写成 as const 的 TS 常量或用 @wagmi/cli 生成。'],
  ['每个数据都用 watch 区块刷新最实时。', '会把 RPC 请求放大几十倍。只对价格等关键数据高频刷新。']
])}
${recap([
  'ABI 描述函数、事件、错误；函数选择器是签名 keccak256 的前 4 字节。',
  'useReadContract 读单个值；useReadContracts 默认用 Multicall3 合并为一次 eth_call。',
  '刷新策略三件套：staleTime、refetchInterval、交易确认后 invalidate；高频刷新只给关键数据。',
  'getLogs 要按区块范围分页；历史、列表、统计交给索引服务。',
  '加载、错误、空值要分开展示；ABI 写成 as const 获得端到端类型安全。'
])}
${quiz([
  { q: '<code>transfer(address,uint256)</code> 调用的 calldata 长度是多少字节？', o: ['36', '64', '68', '72'], a: 2, why: '4 字节选择器 + 两个 32 字节参数 = 68 字节。36 字节是只有一个参数（如 balanceOf）的情况。' },
  { q: 'useReadContracts 读取 30 个代币余额时，默认会发出几次 eth_call？', o: ['30 次', '通常 1 次（Multicall3 合并），超出批次大小时拆分为少数几次', '0 次，因为有缓存', '60 次'], a: 1, why: 'wagmi 默认通过 Multicall3 合并调用，只有批次过大时才拆分。首次读取没有缓存。' },
  { q: '“我的历史订单”页面最合适的数据来源是？', o: ['前端每次从创世区块 getLogs', '每个区块调用一次 eth_call', '索引服务（GraphQL/REST）分页查询，并合并本地待确认交易', '让用户自己去区块浏览器看'], a: 2, why: '历史数据交给索引服务；索引有延迟，所以要合并本地待确认交易。前端扫全量日志会被限流且极慢。' },
  { q: '为什么推荐把 ABI 写成 <code>as const</code>？', o: ['让文件更小', '让 TypeScript 推导出精确的函数名、参数和返回类型', '让运行速度更快', '让 ABI 可以修改'], a: 1, why: 'as const 保留字面量类型，abitype 据此推导类型。它不影响体积和运行速度，反而让 ABI 变成只读。' }
])}
${exercises([["（示例）调用 <code>transferFrom(address,address,uint256)</code> 的 calldata 有多少字节、多少个十六进制字符（不含 0x）？另一次 balanceOf 调用返回 <code>0x…1e8480</code>，按 USDC 的 6 位小数是多少？", "<p>calldata = 4 字节选择器 + 3 个 32 字节参数 = 100 字节，即 200 个十六进制字符。0x1e8480 = 1,048,576 + 917,504 + 32,768 + 1,024 + 128 = 2,000,000。除以 10^6，余额是 2 USDC。</p>"], ["（示例）你要用 getLogs 拉取区块 1,000,000 到 1,099,999 的 Transfer 事件，每页 5,000 个区块。要发几次请求？如果用户要看“全部历史”，你会怎么做？", "<p>这个范围共 100,000 个区块，100,000 ÷ 5,000 = 20 次请求。全部历史要从很早的区块扫起，会发出数千次分页请求，很慢且容易被 RPC 限流。历史与列表应交给索引服务分页查询，并合并本地待确认交易。</p>"], ["为一个资产页设计刷新策略：代币 symbol 与 decimals、用户余额与授权额度、池子报价。分别用什么参数？", "<p>symbol 和 decimals 几乎不变，用 <code>staleTime: Infinity</code>，只读一次。余额和授权额度在交易确认后 invalidate，另加约 10 秒的 staleTime。报价每个区块都可能变，用 <code>useBlockNumber({ watch: true })</code> 驱动失效，或把 refetchInterval 设为出块时间。高频刷新只给少数关键数据。</p>"]])}
${checklist(["能说出函数选择器是签名 keccak256 的前 4 字节，并手算一次 calldata 的长度。", "能用 useReadContract 和 useReadContracts 读链，并说明 Multicall3 怎样把多个调用合并成一次 eth_call。", "能按数据变化频率设置 staleTime、refetchInterval 和交易确认后的 invalidate。", "能用 getLogs 按区块范围分页读取事件，并判断哪些数据要交给索引服务。", "能区分加载中、RPC 错误、未连接和真实 0 余额，并分别设计 UI。"])}
${terms([
  ['ABI', 'Application Binary Interface', '描述合约函数、事件、错误及其类型的 JSON 接口说明'],
  ['函数选择器', 'Function Selector', '函数签名 keccak256 哈希的前 4 字节，用于路由调用'],
  ['calldata', 'Call Data', '发给合约的输入字节：选择器 + ABI 编码后的参数'],
  ['eth_call', 'eth_call', '让节点本地执行合约函数并返回结果的只读 RPC 方法'],
  ['Multicall3', 'Multicall3', '把多个只读调用打包成一次调用的通用合约'],
  ['staleTime', 'Stale Time', 'TanStack Query 中数据被视为新鲜的时长'],
  ['事件日志', 'Event Log', '合约写入交易回执、可被链下按 topic 过滤查询的记录'],
  ['abitype', 'abitype', '从 as const ABI 推导 TypeScript 类型的库，viem 与 wagmi 的类型基础']
])}
` });
})();
