/* ---------- M00 子文章（3/3）：★ m00-7 学习路线与作品集规划 ---------- */
(() => {

CUR = 'm00-7';
addCh({ id: 'm00-7', nav: '★ 学习路线与作品集', title: 'M00.7 ★ 能力成长项目：Web3 学习路线与作品集规划', desc: '岗位地图、技能矩阵、12–24 周计划、9 个实战项目组成的作品集与面试准备。', html: `
<h1>M00.7 ★ 能力成长项目：Web3 学习路线与作品集规划</h1>
${meta(['根据 Web3 岗位地图和技能矩阵，选定自己的目标方向。', '制定一份 12–24 周、每周都有可验证产出的学习计划，并搭好开发环境。', '把本手册 9 个实战项目组织成一份能拿去面试的作品集，掌握读白皮书、审计报告、源码的方法和面试要点。'], '<a href="#m00-1">M00.1</a> 至 <a href="#m00-6">M00.6</a>')}
${beginner(`<p><strong>作品集（Portfolio）</strong>：一组能公开展示你能力的项目，通常是 GitHub 仓库 + 说明文档 + 演示视频或在线地址。</p>
<p><strong>技能矩阵（Skill Matrix）</strong>：一张表，行是技能，列是岗位，格子里写这个岗位对这个技能的要求程度。</p>
<p><strong>里程碑（Milestone）</strong>：计划中的一个检查点，到这个时间必须交付某个具体成果。</p>
<p><strong>CI（Continuous Integration，持续集成）</strong>：每次提交代码，自动运行编译和测试的流程，例如 GitHub Actions。</p>
<p><strong>审计报告（Audit Report）</strong>：安全公司检查智能合约后发布的漏洞清单和修复建议。</p>`)}
${call('info', `<p>本篇是 M00 的“实战”篇。M01–M09 的实战项目是一个软件系统；本篇的“项目”是<strong>你自己的能力成长系统</strong>：输入是时间和本手册，输出是一份可验证的作品集。所以本篇按实战项目的 12 段结构组织：目标、需求、架构、选型、数据模型、接口、代码、测试、运维、安全、里程碑、扩展。</p>`)}

<h2>1. 一句话理解</h2>
${one('选一个岗位方向，按周交付可运行的代码，把 9 个实战项目做成一份带测试、带文档、带复盘的作品集。面试官看的是你交付过什么，不是你读过什么。')}
${call('analogy', `<p>学 Web3 像学开车：看再多驾驶教程，也不如每周上路练几小时。作品集就是你的“驾驶记录”：开过哪些路（项目）、遇到过什么情况（故障和修复）、有没有违章（测试和审计）。</p>
<p>类比的局限：开车的规则几十年不变；Web3 的工具和协议每年都在变。所以计划里必须留出“跟踪变化”的时间。</p>`)}
${art('一图看懂：作品集是一个总仓库，每个项目都长得一样', 660, 340, [
  S.box(150, 28, 360, 56, { k: 'key', icon: 'code', t: 'my-web3-portfolio/', s: 'README.md · portfolio.json · ci.yml', mono: 1 }),
  S.box(10, 128, 200, 52, { k: 'info', icon: 'file', t: 'deposit-watcher/', s: 'M01.9 · Go', mono: 1 }),
  S.box(230, 128, 200, 52, { k: 'info', icon: 'file', t: 'staking-protocol/', s: 'M06.9 · Solidity', mono: 1 }),
  S.box(450, 128, 200, 52, { k: 'idle', dash: 1, icon: 'file', t: '你的主线项目/', s: '再加一个相邻线项目', mono: 1 }),
  S.arrow(250, 86, 110, 126, { k: 'plain' }),
  S.arrow(330, 86, 330, 126, { k: 'plain' }),
  S.arrow(410, 86, 550, 126, { k: 'plain' }),
  S.zone(10, 204, 640, 92, { t: '每个项目固定有同样四样东西' }),
  S.box(22, 230, 143, 52, { k: 'ok', t: 'README.md', s: '固定 7 段', mono: 1 }),
  S.box(181, 230, 143, 52, { k: 'ok', t: 'Makefile', s: 'make demo 一键跑', mono: 1 }),
  S.box(340, 230, 143, 52, { k: 'ok', t: 'security.md', s: '威胁模型', mono: 1 }),
  S.box(499, 230, 143, 52, { k: 'ok', t: '测试 + CI', s: '覆盖率 ≥ 80%', mono: 1 }),
  S.text(330, 324, '面试官 5 分钟：读 README，跑 make demo，看测试与威胁模型（数字为示例）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['key', '总仓库只是目录和清单；真正的证据在每个项目里：能一条命令跑起来、有测试、有威胁模型。'],
  ['flow', '面试官打开仓库，通常只停留几分钟，所以每个项目遵守同一套“接口”，几秒钟就能找到想看的东西。'],
  ['limit', '不需要做完 9 个：选一条主线做深 2 个，再从相邻线做 1 个。']
], '作品集总仓库包含多个项目，每个项目都有相同的 README、Makefile、安全文档和测试与持续集成', 'm00-7')}

<h2>2. 项目目标与验收标准</h2>
<p>把“学会 Web3”改写成可以打勾的验收标准（数字为示例，按你的时间调整）：</p>
${tbl(['类别', '验收标准（示例）', '怎么证明'], [
  ['功能：作品', '完成至少 3 个实战项目（主方向 2 个 + 相邻方向 1 个），每个都能一条命令启动', 'README 中的 <code>make demo</code> 或 <code>docker compose up</code> 可复现'],
  ['功能：广度', '读完 M00–M09 全部模块总览，自测题全部答对', '左侧目录显示模块进度'],
  ['质量：测试', '每个项目核心模块测试覆盖率 ≥ 80%；合约项目含模糊测试和不变量测试', 'CI 徽章 + 覆盖率报告'],
  ['质量：性能', '后端项目给出压测数据，例如充值监听服务 ≥ 500 TPS 入账、P99 延迟 &lt; 200 ms', '压测脚本和结果截图放在仓库 docs/ 下'],
  ['安全', '每个合约项目附一份自审报告（按审计报告格式），每个后端项目附威胁模型', 'docs/security.md'],
  ['表达', '每个项目一篇复盘文章（≥ 1,500 字），讲清设计取舍和踩过的坑', '博客或仓库 docs/'],
  ['节奏', '连续 12–24 周，每周至少 1 次有意义的提交和 1 段学习日志', 'GitHub 提交记录']
])}

<h2>3. 需求拆解：岗位地图与技能矩阵</h2>
<p>先写用户故事。本项目有两个“用户”：你自己，和面试官。</p>
${steps([
  '作为学习者，我希望每周知道读什么、写什么、交付什么，以便不在信息海洋里迷路。',
  '作为求职者，我希望有 2–3 个能当场演示的项目，以便面试时用事实证明能力。',
  '作为面试官，我希望 5 分钟内看懂候选人的项目做了什么、难点在哪、怎么验证正确，以便判断是否进入下一轮。',
  '作为面试官，我希望看到候选人处理过失败场景（重组、并发、攻击），以便判断能否上生产。'
])}
${tbl(['岗位', '日常工作', '核心技能', '对应模块', '代表作品'], [
  ['Web3 后端（Go/Java）', '索引器、充值提币、链上数据服务', 'Go、数据库、消息队列、JSON-RPC、重组处理', '<a href="#m01">M01</a> <a href="#m03">M07</a> <a href="#m05">M04</a>', '<a href="#m01-9">充值监听入账服务</a>'],
  ['智能合约工程师', '编写、测试、部署合约', 'Solidity、Foundry、EVM、DeFi 机制、安全模式', '<a href="#m02">M02</a> <a href="#m08">M09</a>', '<a href="#m02-12">质押挖矿协议</a>'],
  ['钱包工程师', '签名服务、多签、MPC、Gas 与 nonce 管理', '密码学基础、HD 钱包、KMS/HSM、并发', '<a href="#m03">M07</a>', '<a href="#m03-9">多链托管钱包</a>'],
  ['交易所工程师', 'CEX：撮合、账本、风控、冷热钱包；DEX：报价路由、聚合器', '高并发、低延迟、复式记账、对账、AMM 数学', '<a href="#m04">M08</a>', '<a href="#m04-10">迷你 CEX</a> 或 <a href="#m04-77">DEX 聚合器后端</a>'],
  ['基础设施 / 节点工程师', '节点运维、RPC 网关、监控', 'Linux、Kubernetes、Prometheus、客户端架构', '<a href="#m05">M04</a>', '<a href="#m05-10">高可用 RPC 网关</a>'],
  ['Web3 前端', 'DApp 界面、钱包连接、交易状态', 'TypeScript、React、wagmi、viem、EIP-712', '<a href="#m07">M03</a>', '<a href="#m07-10">DEX 兑换前端</a>'],
  ['安全工程师 / 审计', '审计合约、应急响应', 'EVM 底层、漏洞模式、模糊测试、形式化思维', '<a href="#m02">M02</a> 全部安全篇', '自审报告 + 竞赛审计记录'],
  ['研究员', '机制设计、数据分析、协议研究', '经济学、统计、SQL、Python', '<a href="#m02">M02</a> <a href="#m08">M09</a>', '研究报告 + Dune 看板'],
  ['AI Agent 工程师', '让 AI 代理安全地读写链', 'LLM 工具调用、MCP、账户抽象、策略引擎', '<a href="#m06">M10</a>', '<a href="#m06-9">链上交易 Agent</a>']
])}
<p>技能矩阵（★ 越多要求越高；3★ = 能独立设计和排障）：</p>
${tbl(['技能', '后端', '合约', '钱包', '交易所', '基础设施', '前端', '安全', 'Agent'], [
  ['区块链基础（交易、区块、共识）', '★★★', '★★★', '★★★', '★★', '★★★', '★★', '★★★', '★★'],
  ['密码学（哈希、签名、HD）', '★★', '★★', '★★★', '★★', '★', '★★', '★★★', '★★'],
  ['Solidity / EVM', '★', '★★★', '★★', '★', '★', '★★', '★★★', '★★'],
  ['Go / 后端工程', '★★★', '★', '★★★', '★★★', '★★★', '★', '★', '★★'],
  ['TypeScript / 前端', '★', '★★', '★', '★', '★', '★★★', '★', '★★'],
  ['数据库与一致性', '★★★', '★', '★★', '★★★', '★★', '★', '★', '★'],
  ['DeFi 机制', '★', '★★★', '★', '★★', '★', '★★', '★★★', '★★'],
  ['安全与威胁建模', '★★', '★★★', '★★★', '★★★', '★★', '★★', '★★★', '★★★'],
  ['运维与监控', '★★', '★', '★★', '★★', '★★★', '★', '★', '★']
])}

<h2>4. 系统架构：作品集怎样组成</h2>
${mm('9 个实战项目组成的作品集', `
flowchart TB
  P0["M00.7 学习路线<br/>作品集总仓库与博客"]
  subgraph BE["后端与资金系统线"]
    P1["M01.9 充值监听入账服务"]
    P3["M07.10 多链托管钱包"]
    P4["M08.11 迷你 CEX"]
    P5["M04.8 高可用 RPC 网关"]
  end
  subgraph SC["链上开发线"]
    P2["M06.9 质押挖矿协议"]
    P8["M09.11 二元预测市场"]
  end
  subgraph PX["产品与智能线"]
    P7["M03.10 DEX 兑换前端"]
    P6["M10.9 链上交易 Agent"]
  end
  P0 --> BE
  P0 --> SC
  P0 --> PX
  P5 -->|"为其他服务提供 RPC"| P1
  P1 -->|"入账事件"| P4
  P3 -->|"签名与提币"| P4
  P2 -->|"合约 ABI"| P7
  P2 -->|"复用测试与审计方法"| P8
  P3 -->|"签名服务"| P6
`, [
  ['flow', '项目之间可以真实对接：RPC 网关服务于充值监听，充值监听把入账事件推给迷你 CEX，托管钱包为 CEX 和 Agent 提供签名。'],
  ['key', '不需要做完 9 个。选一条主线做深 2 个，再从相邻线做 1 个，面试时就能讲出“系统之间怎么配合”。'],
  ['limit', '9 个项目全部做到生产级，需要远超 24 周。作品集追求的是深度和可验证，而不是数量。'],
  ['risk', '只照抄手册代码、不改动、不写测试的项目，面试中一问细节就会暴露。每个项目至少加一个自己的扩展功能。']
])}
<p>做完主线项目后，可以用 <a href="#m12">M12 综合毕业项目</a> 把合约、前后端和上线运维串成一个完整产品。</p>
${mm('每周学习闭环', `
sequenceDiagram
  participant Me as 你
  participant HB as 本手册
  participant Lab as 交互实验
  participant Repo as GitHub 仓库
  participant CI as CI 流水线
  participant Peer as 同伴或社区
  Me->>HB: 周一 读 2 到 3 篇子文章
  Me->>Lab: 做文中实验 记录现象
  Me->>Repo: 周二到周四 写代码 写测试
  Repo->>CI: 每次推送 自动编译和测试
  CI-->>Me: 失败则当天修复
  Me->>Repo: 周五 写周报与复盘
  Me->>Peer: 周末 分享文章 请求代码评审
  Peer-->>Me: 反馈 进入下周计划
`, [
  ['flow', '输入（阅读、实验）→ 加工（代码、测试）→ 输出（复盘、分享）→ 反馈，每周转一圈。'],
  ['fail', '最常见的失败是“只读不写”：连续两周没有提交，计划就会中断。用 CI 和周报强制每周有产出。'],
  ['key', '写复盘比写代码更能暴露理解漏洞：讲不清楚的地方，就是没学会的地方。']
])}
${mm('单项技能的成长状态机', `
stateDiagram-v2
  state "未接触" as None
  state "能看懂" as Read
  state "能复现" as Repro
  state "能独立实现" as Build
  state "能生产交付" as Prod
  state "能指导他人" as Teach
  [*] --> None
  None --> Read: 读文章 做自测
  Read --> Repro: 跟着代码跑通
  Repro --> Build: 不看答案改需求重写
  Build --> Prod: 加测试 监控 故障处理
  Prod --> Teach: 写文章 做评审
  Build --> Repro: 卡住时回到示例
  Teach --> [*]
`, [
  ['key', '面试要求的通常是“能独立实现”；企业级岗位要求“能生产交付”：测试、监控、故障处理都做过。'],
  ['fail', '很多人停在“能复现”：代码能跑，但换个需求就不会写。检验方法是关掉示例，从空目录重写。'],
  ['flow', '每项技能独立推进。用第 6 节的数据表记录每项技能当前所处的状态。']
])}

<h2>5. 技术选型与开发环境搭建清单</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['Node.js', 'LTS 版本，用 nvm 管理（截至 2026 年为 22 或 24 LTS）', 'fnm、Volta', '前端、脚本、viem/ethers 都依赖 Node'],
  ['包管理器', 'pnpm', 'npm、yarn', '安装快、磁盘占用小、锁文件稳定'],
  ['Go', '官方最新稳定版（go.dev/dl）', '—', 'go-ethereum 生态、后端项目主语言'],
  ['合约工具链', 'Foundry（forge、cast、anvil）', 'Hardhat', '用 Solidity 写测试，模糊测试内置，速度快'],
  ['本地链', 'anvil', 'Hardhat Network', '一条命令启动本地以太坊，可分叉主网'],
  ['钱包', '独立浏览器配置文件 + MetaMask/Rabby，只放测试币', '—', '开发钱包与资产钱包物理隔离'],
  ['RPC', 'Alchemy / Infura 免费额度 + 本地 anvil', '公共 RPC、自建节点', '稳定、有日志；公共 RPC 只用于临时测试'],
  ['容器', 'Docker + Docker Compose', 'Podman', '一条命令启动数据库、队列、节点'],
  ['数据库', 'PostgreSQL + Redis', 'MySQL', '后端项目的账本、缓存、队列'],
  ['编辑器', 'VS Code + Go、Solidity 扩展', 'GoLand、Cursor', '免费、插件生态完善'],
  ['版本控制与 CI', 'Git + GitHub + GitHub Actions', 'GitLab CI', '作品集公开展示的标准平台']
])}
${code('BASH', `
# 1) Node.js（用 nvm 安装 LTS）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts && corepack enable && pnpm -v

# 2) Go：从 https://go.dev/dl 下载安装包，然后验证
go version

# 3) Foundry：安装 foundryup，再安装 forge / cast / anvil
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version && cast --version && anvil --version

# 4) Docker：安装 Docker Desktop 或 Docker Engine，然后验证
docker run --rm hello-world

# 5) RPC：在服务商控制台创建 Sepolia 端点，写入 .env（不要提交到 Git）
echo 'RPC_URL=https://你的-sepolia-端点' >> .env
echo '.env' >> .gitignore
cast block-number --rpc-url "$(grep RPC_URL .env | cut -d= -f2-)"

# 6) 本地链：启动后默认在 127.0.0.1:8545，附带 10 个预充值测试账户
anvil
`)}
${call('warn', `<p>开发环境里的私钥只能是测试私钥。anvil 打印的默认账户私钥全世界都知道，<strong>绝不能</strong>在主网使用。把真实资产钱包和开发钱包放在不同的浏览器配置文件里。</p>`)}

<h2>6. 数据模型：学习记录与作品集元数据</h2>
<p>用一张小数据库（或一个电子表格）管理你的成长。下面的表结构也是一个很好的 SQL 练习：</p>
${code('SQL', `
-- 技能：每项技能当前处于状态机的哪个状态
CREATE TABLE skills (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(64) UNIQUE NOT NULL,          -- 例如 'Solidity 重入防护'
  module      VARCHAR(8)  NOT NULL,                 -- 例如 'm02'
  level       VARCHAR(16) NOT NULL DEFAULT 'none'   -- none/read/repro/build/prod/teach
              CHECK (level IN ('none','read','repro','build','prod','teach')),
  evidence    TEXT,                                 -- 证明链接：提交、测试、文章
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 每周日志：计划与实际产出
CREATE TABLE weekly_logs (
  week_no     INT PRIMARY KEY,                      -- 第几周，1..24
  plan        TEXT NOT NULL,
  delivered   TEXT,                                 -- 实际交付物
  hours       NUMERIC(4,1) NOT NULL DEFAULT 0,      -- 投入小时数
  blockers    TEXT,                                 -- 卡点
  commit_url  TEXT
);
-- 作品集项目
CREATE TABLE projects (
  id          SERIAL PRIMARY KEY,
  article_id  VARCHAR(8) NOT NULL,                  -- 例如 'm01-9'
  repo_url    TEXT NOT NULL,
  status      VARCHAR(16) NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo','building','tested','documented','showcased')),
  coverage    NUMERIC(5,2),                         -- 测试覆盖率 %
  extension   TEXT                                  -- 你在手册基础上加的扩展功能
);
-- 查询示例：哪些技能还停留在“能看懂”以下？
SELECT module, name FROM skills WHERE level IN ('none','read') ORDER BY module;
`)}

<h2>7. 接口设计：作品集仓库约定</h2>
<p>面试官打开你的仓库，平均只停留几分钟。所以每个项目仓库都遵守同一套“接口”：同样的目录结构、同样的命令、同样的 README 段落。</p>
${code('BASH', `
my-web3-portfolio/
├── README.md              # 总览：岗位方向、项目列表、每个项目一句话 + 演示链接
├── portfolio.json         # 机器可读的项目清单（见下方 JSON）
├── deposit-watcher/       # M01.9 充值监听入账服务（Go）
│   ├── README.md          # 固定 7 段：目标 / 架构图 / 快速开始 / 设计取舍 / 测试 / 压测结果 / 已知限制
│   ├── Makefile           # 固定命令：make dev / make test / make lint / make demo
│   ├── docs/security.md   # 威胁模型与安全清单
│   └── ...
├── staking-protocol/      # M06.9 质押挖矿协议（Solidity + Foundry）
│   ├── audit/self-audit.md
│   └── ...
└── .github/workflows/ci.yml
`)}
${code('JSON', `
{
  "owner": "your-github-id",
  "track": "backend",
  "projects": [
    {
      "id": "deposit-watcher",
      "article": "m01-9",
      "summary": "监听 ERC-20 充值，处理链重组，幂等入账",
      "stack": ["Go", "PostgreSQL", "Redis", "go-ethereum"],
      "demo": "make demo",
      "metrics": { "coverage": 84.2, "tps": 650, "p99_ms": 120 },
      "extension": "支持多链与动态确认数",
      "writeup": "https://your-blog.example/deposit-watcher"
    }
  ]
}
`)}

<h2>8. 核心代码：环境验证三件套</h2>
<p>环境搭好后，用三段最小代码验证 Go、Solidity、TypeScript 三条工具链都能工作。它们也是 M01、M02、M03 的起点。</p>
${code('GO', `
// main.go —— 用 go-ethereum 读取链 ID 和最新区块号
// 运行：go mod init hello && go get github.com/ethereum/go-ethereum && RPC_URL=... go run .
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second) // 所有 RPC 调用都要设超时
	defer cancel()

	client, err := ethclient.DialContext(ctx, os.Getenv("RPC_URL"))
	if err != nil {
		log.Fatalf("连接 RPC 失败: %v", err)
	}
	chainID, err := client.ChainID(ctx) // Sepolia 应为 11155111
	if err != nil {
		log.Fatal(err)
	}
	head, err := client.BlockNumber(ctx)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("chainId=%s 最新区块=%d\\n", chainID, head)
}
`)}
${code('SOLIDITY', `
// test/Counter.t.sol —— forge init 生成的模板项目里，加一条自己的模糊测试
// 运行：forge init hello && cd hello && forge test -vv
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter counter;

    function setUp() public {
        counter = new Counter();
        counter.setNumber(0);
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    // 模糊测试：forge 自动生成数百个随机 x
    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
`)}
${code('TYPESCRIPT', `
// index.ts —— 用 viem 读取 Sepolia 最新区块和某地址余额
// 运行：pnpm add viem tsx && RPC_URL=... ADDR=0x... pnpm tsx index.ts
import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';

const client = createPublicClient({ chain: sepolia, transport: http(process.env.RPC_URL) });

async function main() {
  const block = await client.getBlock();                 // 默认最新区块
  const bal = await client.getBalance({ address: process.env.ADDR as \`0x\${string}\` });
  console.log(\`区块 \${block.number} 含 \${block.transactions.length} 笔交易\`);
  console.log(\`余额 \${formatEther(bal)} SepoliaETH\`);
}
main().catch((e) => { console.error(e); process.exit(1); });
`)}

<h2>9. 测试策略：怎样证明你真的学会了</h2>
${tbl(['层级', '对作品集项目', '对你自己'], [
  ['单元测试', '每个函数的正常、边界、错误输入', '每篇文章的自测题全部答对'],
  ['集成测试', '服务 + 数据库 + 本地链（anvil）一起跑', '把两个模块的知识用在一个项目里（例如钱包 + 账本）'],
  ['模糊 / 不变量测试', '合约：总供应量守恒、余额不为负', '换一组参数重做实验，预测结果后再验证'],
  ['压测', '记录 TPS、P99 延迟、资源占用', '限时 45 分钟，从空目录重写一个核心模块'],
  ['故障注入', '断开 RPC、制造链重组、数据库主从切换', '模拟面试：让同伴追问“如果这里失败会怎样”']
])}
<p>测试用例清单（以充值监听服务为例，其他项目照此格式写）：</p>
${steps([
  '正常充值：1 笔 ERC-20 Transfer 到达确认数后入账 1 次。',
  '重复事件：同一笔日志被拉取 2 次，只入账 1 次（幂等）。',
  '链重组：已记录但未确认的交易所在区块被替换，记录被回滚。',
  'RPC 故障：主节点超时，自动切换备用节点，不漏块。',
  '精度：decimals = 6 和 decimals = 18 的代币金额都正确。',
  '压力：每秒 500 笔事件持续 10 分钟，无积压、无重复入账。'
])}

<h2>10. 部署与运维：让作品集“活着”</h2>
${code('YAML', `
# .github/workflows/ci.yml —— 每次推送自动运行 Go 和 Foundry 测试
name: ci
on: [push, pull_request]
jobs:
  go:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: deposit-watcher } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: stable }
      - run: go vet ./... && go test -race -coverprofile=cover.out ./...
  contracts:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: staking-protocol } }
    steps:
      - uses: actions/checkout@v4
        with: { submodules: recursive }
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge fmt --check && forge test -vv
        env:
          RPC_URL: \${{ secrets.SEPOLIA_RPC_URL }}   # 密钥放在仓库 Secrets，不写进代码
`)}
${tbl(['运维项', '做法（示例）', '为什么'], [
  ['密钥管理', 'RPC 密钥、测试私钥只放 .env 和 CI Secrets；提交前用 gitleaks 扫描', '公开仓库泄露密钥会被机器人秒级利用'],
  ['可复现', '固定依赖版本（go.sum、pnpm-lock.yaml、foundry.toml 里的 solc 版本）', '面试官半年后打开仍能运行'],
  ['在线演示', '前端部署到静态托管；后端录 3 分钟演示视频', '面试官不一定愿意本地运行'],
  ['可观测性', '后端项目暴露 Prometheus 指标，例如 <code>deposit_lag_blocks</code>，告警阈值示例：落后 &gt; 20 块', '展示你有生产意识'],
  ['维护', '每季度升级一次依赖，修复 CI', '红色 CI 徽章是减分项']
])}

<h2>11. 安全清单与威胁模型</h2>
${mm('学习者与开发者面临的威胁', `
flowchart LR
  ME["你：开发机 + 钱包 + GitHub"]
  T1["假招聘方<br/>让你运行“面试作业”仓库"] -->|"恶意依赖窃取钱包"| ME
  T2["恶意 npm / VS Code 扩展"] -->|"读取私钥与 .env"| ME
  T3["公开仓库误提交私钥"] -->|"机器人秒级盗取"| ME
  T4["假教程 / 假空投任务"] -->|"诱导签名授权"| ME
  ME --> D1["防御：虚拟机或容器运行陌生代码"]
  ME --> D2["防御：开发钱包只放测试币"]
  ME --> D3["防御：gitleaks + .gitignore"]
  ME --> D4["防御：只信官方文档与官方仓库"]
`, [
  ['risk', '2023 年起，多家安全公司报告冒充招聘方的攻击：以“技术面试作业”为名，让候选人克隆并运行仓库，依赖里的恶意脚本窃取浏览器钱包数据和私钥。' + cite('Palo Alto Unit 42：Contagious Interview 与 Wagemole（2023-11）', 'https://unit42.paloaltonetworks.com/two-campaigns-by-north-korea-bad-actors-target-job-hunters/') + '软件开发者和 Web3 求职者是重点目标。'],
  ['fail', '在装有真实资产钱包的电脑上运行陌生仓库的 <code>npm install</code>，安装脚本就可能执行恶意代码。'],
  ['key', '陌生代码一律放在虚拟机、容器或云端临时环境运行；开发机上不放真实资产。'],
  ['limit', '没有任何单一措施能防住全部威胁。隔离（设备、钱包、浏览器配置文件）是最有效的总原则。']
])}
${tbl(['检查项', '为什么', '怎么验证'], [
  ['开发钱包与资产钱包分开（不同浏览器配置文件或不同设备）', '开发环境暴露面大', '开发配置文件里的钱包余额只有测试币'],
  ['陌生仓库在容器 / 虚拟机中运行', '防恶意依赖', '检查 package.json 的 preinstall/postinstall 脚本'],
  ['提交前扫描密钥', '防私钥、RPC 密钥泄露', '本地 pre-commit 钩子运行 gitleaks'],
  ['只从官方渠道安装工具', '防假冒工具和扩展', '安装命令来自官方文档，扩展发布者已认证'],
  ['合约项目附自审报告', '展示安全意识', 'audit/self-audit.md 按严重程度列出问题与修复']
])}

<h2>12. 里程碑计划：24 周路线（可压缩为 12 周）</h2>
<p>标准路线每周投入约 10–15 小时（示例）。有后端经验的读者可走 12 周快速路线：把相邻两周合并，跳过已掌握的编程基础。</p>
${tbl(['周', '主题', '阅读', '本周产出'], [
  ['1', 'Web3 全景与信任模型', '<a href="#m00">M00</a> 全部', '钱包 + Sepolia 交易；写一篇“我的第一笔交易”'],
  ['2', '开发环境与安全', '<a href="#m00-6">M00.6</a>、本篇', '环境三件套跑通；作品集总仓库建好，CI 变绿'],
  ['3', '区块、交易、共识', '<a href="#m01">M01</a> 前半', '用 cast 和 curl 查询区块、交易、回执'],
  ['4', 'Go 与读链', '<a href="#m01">M01</a> 后半', 'Go 程序订阅新区块并解析 Transfer 事件'],
  ['5', '索引器工程', '<a href="#m01">M01</a> 索引器篇', '索引器写入 PostgreSQL，处理重组'],
  ['6', '实战 1', '<a href="#m01-9">M01.9</a>', '充值监听服务 v1 + 测试 + README'],
  ['7', '智能合约入门', '<a href="#m02">M02</a> 前 4 篇', '在 Remix 与 Foundry 部署第一个合约'],
  ['8', '代币与 Gas', '<a href="#m02">M02</a> 代币、Gas 篇', '自己的 ERC-20 + 完整测试'],
  ['9', '合约安全', '<a href="#m02">M02</a> 安全篇', '完成 3 个漏洞复现（重入、权限、价格操纵）'],
  ['10', 'DeFi 机制', '<a href="#m13">M06</a> 稳定币、AMM、借贷篇', '用 Foundry 分叉主网，调用真实 DEX'],
  ['11–12', '实战 2', '<a href="#m02-12">M06.9</a>', '质押挖矿协议 + 模糊测试 + 自审报告'],
  ['13', '钱包原理', '<a href="#m03">M07</a> 前半', 'HD 派生、离线签名、广播的 Go 实现'],
  ['14', '企业钱包', '<a href="#m03">M07</a> 后半', 'nonce 管理器 + Gas 策略模块'],
  ['15', '方向分叉：选主线', '按岗位选读 M07.10 / M08（CEX 或 DEX）/ M03', '确定主线，写出主线项目的设计文档'],
  ['16–18', '实战 3（主线）', '<a href="#m03-9">M07.10</a>、<a href="#m04-10">M08.11</a> 或 <a href="#m07-10">M03.10</a>', '主线项目 v1，含压测或端到端测试'],
  ['19', '公链与基础设施', '<a href="#m05">M04</a>', 'RPC 网关原型或节点监控看板'],
  ['20', 'Agent 与账户抽象', '<a href="#m06">M10</a>', '一个只读链上 Agent 工具'],
  ['21', '预测市场与 Perp', '<a href="#m08">M09</a>', '完成资金费率与强平实验，写一篇机制分析'],
  ['22', '实战 4（相邻线）', '任选一个实战项目', '相邻线项目 MVP'],
  ['23', '作品集打磨', '本篇第 7、10 节', '统一 README、演示视频、复盘文章'],
  ['24', '面试冲刺', '本篇第 14 节', '模拟面试 3 次；投递简历']
])}
${call('info', `<p>12 周快速路线示例：第 1 周 M00 + 环境；第 2–3 周 M01 + 实战 1；第 4–6 周 M02 + 实战 2；第 7 周 M07 前半；第 8–10 周主线实战；第 11 周 M04/M10/M09 选读；第 12 周打磨与面试。</p>`)}

<h2>13. 怎样读白皮书、审计报告和源码</h2>
<h3>13.1 读白皮书（以比特币白皮书为例，共 9 页）</h3>
${steps([
  '先读摘要和结论，用一句话写下：它要解决什么问题？',
  '画出系统里的角色（用户、节点、矿工）和他们之间的消息。',
  '找出核心假设，例如“诚实节点控制多数算力”。问自己：假设不成立会怎样？',
  '找出所有公式和参数，用自己的例子算一遍（例如本手册的 <a href="#lab-confirm">确认数实验</a> 就是白皮书第 11 节）。',
  '最后写一篇 500 字总结，列出你仍然不懂的 3 个问题，带着问题读下一篇资料。'
])}
<h3>13.2 读审计报告</h3>
${tbl(['报告部分', '看什么', '学到什么'], [
  ['范围（Scope）', '审计了哪些合约、哪个提交哈希', '范围外的代码不受审计保护'],
  ['严重程度分级', 'Critical / High / Medium / Low / Informational', '学会判断漏洞影响和利用难度'],
  ['发现（Findings）', '每条的描述、利用场景、修复建议', '积累漏洞模式库，对照自己的代码'],
  ['状态', 'Fixed / Acknowledged（已知但不修）', '“已知不修”的问题往往是项目的真实风险'],
  ['集中化风险', '管理员权限、可升级性', '去中心化程度的真实情况']
])}
<h3>13.3 读源码</h3>
${steps([
  '先跑起来：克隆仓库，运行测试，确认环境正确。',
  '从入口读：合约看对外函数（external/public），后端看 main 和路由，前端看页面组件。',
  '从测试读：测试用例就是“这个函数应该怎样工作”的说明书。',
  '画调用图：对一个核心操作（例如 swap）画出完整调用链。用 <code>forge test -vvvv</code> 打印调用轨迹。',
  '改一行再跑：故意改一个条件，看哪些测试失败。这是理解代码最快的方法。',
  '推荐起点：OpenZeppelin Contracts（标准实现）、Uniswap V2（约几百行核心代码）、go-ethereum 的 ethclient 包。'
])}

<h2>14. 面试常见问题与回答要点</h2>
<p>按岗位整理的复习清单和面试演练见 <a href="#m12-5">M12.5 作品集与面试</a>。</p>
${tbl(['问题', '回答要点', '对应章节'], [
  ['一笔以太坊交易从签名到最终确定经历了什么？', '构造 → 签名 → 广播 → 内存池 → 打包 → 执行 → 确认 → 最终确定；提到 nonce、Gas、重组', '<a href="#m00-4">M00.4</a> <a href="#m01">M01</a>'],
  ['充值系统怎样处理链重组？', '等待确认数；记录区块哈希；检测父哈希不连续时回滚；入账幂等', '<a href="#m01-9">M01.9</a>'],
  ['多个服务同时用一个热钱包发交易，nonce 怎么管理？', '集中分配 nonce（数据库或 Redis 原子递增）；处理卡单、替换、空洞', '<a href="#m03">M07</a>'],
  ['什么是重入攻击？怎么防？', '外部调用回调原函数；检查-生效-交互顺序、重入锁、拉取式支付', '<a href="#m02">M02</a>'],
  ['EIP-1559 手续费怎么计算？', 'Base Fee 销毁 + 小费给出块者；实际单价 = Base + min(小费上限, 上限 − Base)', '<a href="#m00-4">M00.4</a>'],
  ['AMM 的价格影响和无常损失是什么？', 'x·y=k；价格影响约等于交易量/池子深度；价格偏离时 LP 相对持有的损失', '<a href="#lab-amm">AMM 实验</a> <a href="#lab-il">IL 实验</a>'],
  ['交易所账本怎样保证不错账？', '复式记账、事务、幂等键、每日对账（链上余额 vs 账本）', '<a href="#m04">M08</a>'],
  ['撮合引擎用什么数据结构？', '价格优先、时间优先；按价格排序的结构 + 每个价位一个 FIFO 队列；单线程顺序处理', '<a href="#m04">M08</a>'],
  ['乐观 Rollup 和 ZK Rollup 的区别？', '欺诈证明 + 挑战期 vs 有效性证明；提款时间和成本不同', '<a href="#m05">M04</a>'],
  ['怎样防止 AI Agent 被提示注入后乱转账？', '策略引擎在签名前校验：白名单、额度、频率；人工确认高风险操作', '<a href="#m06">M10</a>'],
  ['前端怎样处理用户切换账户或网络？', '监听钱包事件，刷新状态；交易前检查 chainId；显示交易各阶段状态', '<a href="#m07">M03</a>'],
  ['介绍一个你做过的项目', '按“目标 → 架构 → 最难的问题 → 怎么验证 → 数据结果 → 如果重做”讲，3 分钟内', '本篇第 7 节']
])}
${call('info', `<p>行为面试的高分回答都有具体数字：“把入账延迟从 30 秒降到 3 秒”“模糊测试发现了 1 个精度问题”。在作品集里提前记录这些数字。</p>`)}

<h2>15. 持续学习资源与扩展方向</h2>
${tbl(['资源类型', '例子', '怎么用'], [
  ['官方文档', 'ethereum.org 开发者文档、Solidity 文档、go-ethereum 文档、viem 文档、Foundry Book', '遇到问题先查官方文档'],
  ['标准提案', 'EIP 仓库（eips.ethereum.org）', '读懂 ERC-20、EIP-1559、EIP-712、EIP-4337 原文'],
  ['安全练习', 'Ethernaut、Damn Vulnerable DeFi', '每周做 1–2 关，写出攻击合约'],
  ['审计与竞赛', 'Code4rena、Sherlock、Cantina 的公开报告；OpenZeppelin、Trail of Bits 等审计公司的公开报告', '每周读 1 份报告，整理漏洞模式'],
  ['事件复盘', 'rekt.news、项目官方事故报告', '每次大事件后复现攻击原理'],
  ['数据平台', 'Dune、DefiLlama、L2BEAT、Etherscan', '用数据验证你的判断'],
  ['研究论坛', 'ethresear.ch、Ethereum Magicians、各协议治理论坛', '跟踪协议升级和机制设计讨论'],
  ['开源代码', 'OpenZeppelin Contracts、Uniswap、Aave、go-ethereum', '按第 13.3 节方法精读']
])}
<p>作品集扩展方向（任选，作为面试亮点）：</p>
<ul>
<li>把两个实战项目真实对接，例如 RPC 网关 + 充值监听 + 迷你 CEX，演示端到端充值入账。</li>
<li>给合约项目加不变量测试和形式化规格说明。</li>
<li>把单链项目扩展为多链，处理不同链的确认数、Gas 模型和地址格式。</li>
<li>参加一次公开审计竞赛，把提交的发现（无论是否获奖）整理进作品集。</li>
<li>给知名开源项目提交一个被合并的 PR（文档修正也算）。</li>
</ul>
${tryit(`<p>用 60 分钟启动你的能力成长项目：</p>
<ol><li>在第 3 节技能矩阵中选一个目标岗位，写下理由。</li><li>按第 5 节清单安装环境，运行第 8 节三段代码。预期：Go 程序打印 chainId=11155111；forge test 显示全部通过；TS 脚本打印区块号和余额。</li><li>在 GitHub 新建 my-web3-portfolio 仓库，提交 README（写明方向和 24 周计划）、portfolio.json 和 CI 配置，确认 CI 变绿。</li><li>在第 6 节的 weekly_logs 表（或电子表格）里写下第 1 周计划。</li></ol>`)}

${mistakes([
  ['先把所有理论学完再动手', '每周都要有可运行的产出。动手过程会暴露阅读时没发现的问题。'],
  ['作品越多越好', '2–3 个有测试、有文档、有复盘的深度项目，胜过 10 个照抄的演示。'],
  ['在日常电脑上直接运行“面试作业”仓库', '假招聘方用恶意仓库窃取钱包。陌生代码放在隔离环境运行。'],
  ['只学合约就能找到所有 Web3 工作', '后端、钱包、交易所、基础设施、前端、安全岗位同样有招聘需求，只是技能组合不同。'],
  ['手册代码能跑就算学会了', '关掉示例、从空目录重写、并加一个自己的扩展功能，才算“能独立实现”。']
])}
${recap([
  'Web3 岗位分为后端、合约、钱包、交易所、基础设施、前端、安全、研究、AI Agent 9 类，技能组合各不相同。',
  '把学习当作项目管理：可验证的验收标准、每周产出、CI 和周报。',
  '9 个实战项目可以组成相互对接的作品集；选一条主线做深 2 个，再做 1 个相邻项目。',
  '开发环境：Node（nvm）、Go、Foundry、Docker、独立的开发钱包和 RPC；开发机不放真实资产。',
  '读白皮书看假设和公式，读审计报告看分级与状态，读源码从测试和入口开始。',
  '面试回答要有结构和数字：目标、架构、难点、验证、结果、反思。'
])}
${quiz([
  { q: '一个只有 24 周的学习者，作品集最合理的规划是？', o: ['9 个实战项目全部做完', '只读文章，不做项目', '只做前端页面', '主线做深 2 个项目，相邻方向做 1 个，全部带测试和文档'], a: 3, why: '面试看深度和可验证性。2–3 个高质量项目比大量浅项目更有说服力。' },
  { q: '“招聘方”发来一个面试作业仓库，要求本地运行。最安全的做法是？', o: ['在虚拟机或容器中运行，开发环境不放真实资产', '直接在日常电脑上 npm install', '先把钱包助记词备份到仓库里', '拒绝所有面试作业'], a: 0, why: '冒充招聘方的恶意仓库会窃取钱包。隔离运行可以避免损失，同时仍能完成作业。' },
  { q: '在技能状态机中，从“能复现”进到“能独立实现”的检验方法是？', o: ['再读一遍文章', '关掉示例，从空目录按改动后的需求重写', '把代码复制到新仓库', '给项目加星标'], a: 1, why: '能独立实现意味着不依赖示例也能写出来，并且能适应需求变化。' },
  { q: '读一份智能合约审计报告时，“Acknowledged”状态的问题意味着什么？', o: ['问题已修复', '问题不存在', '项目方知道这个问题但选择不修，它仍是真实风险', '审计公司漏掉了这个问题'], a: 2, why: 'Acknowledged 表示已知但未修复，使用该协议时要把它算作风险。' },
  { q: '为什么作品集仓库要统一 README 结构和 make 命令？', o: ['让面试官在几分钟内看懂并复现项目', '为了让代码运行更快', '因为 GitHub 强制要求', '为了减少测试数量'], a: 0, why: '面试官时间有限。统一的“接口”让他快速找到目标、架构、测试和演示。' }
])}
${exercises([["设计题：你选定“钱包工程师”方向。请从技能矩阵里找出要求 3★ 的技能，并写出对应模块和代表作品。", "<p>钱包岗位要求 3★ 的技能有：区块链基础、密码学（哈希、签名、HD）、Go / 后端工程、安全与威胁建模。对应模块是 M07。代表作品是多链托管钱包。日常工作包括签名服务、多签、MPC、Gas 与 nonce 管理。</p>"], ["思考题：在单项技能状态机里，从“能独立实现”进到“能生产交付”，还需要补哪些能力？怎样证明你做到了？", "<p>需要补测试、监控和故障处理。证明方式是在项目里留下证据：CI 徽章和覆盖率报告、压测结果、Prometheus 指标和告警阈值、故障注入记录。企业级岗位通常要求达到“能生产交付”。</p>"], ["动手题：用本文的 projects 表，写一条 SQL，找出覆盖率低于 80% 或还没有覆盖率数据的项目。", "<p><code>SELECT article_id, repo_url, coverage FROM projects WHERE coverage &lt; 80 OR coverage IS NULL;</code><br>coverage 可以为空，所以要单独判断 IS NULL。否则还没测过的项目会被漏掉。</p>"]])}
${checklist(["能根据岗位地图和技能矩阵选定目标方向，并写出理由。", "做过搭好 Node、Go、Foundry、Docker 环境，并跑通三段验证代码。", "能写出一份 12–24 周、每周都有可验证产出的学习计划。", "能按统一的 README 7 段和 make 命令约定组织一个项目仓库。", "能按“目标、架构、难点、验证、结果、反思”在 3 分钟内介绍一个项目。"])}
${terms([
  ['作品集', 'Portfolio', '公开展示个人能力的项目集合'],
  ['技能矩阵', 'Skill Matrix', '列出岗位与技能要求程度的对照表'],
  ['里程碑', 'Milestone', '计划中带有具体交付物的检查点'],
  ['持续集成', 'Continuous Integration (CI)', '每次提交自动编译和测试的流程'],
  ['审计报告', 'Audit Report', '安全团队对代码的漏洞发现、分级和修复建议'],
  ['Foundry', 'Foundry', '包含 forge、cast、anvil 的以太坊合约开发工具链'],
  ['威胁模型', 'Threat Model', '系统资产、攻击者、攻击路径与防御措施的分析']
])}
` });

})();
