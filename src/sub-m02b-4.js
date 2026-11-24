/* ---------- M02 子文章（m02b-4）：实战 质押挖矿协议 ---------- */
(() => {
CUR = 'm02-12';
addCh({ id: 'm02-12', nav: '实战：质押挖矿协议', title: 'M08.9 实战：质押挖矿协议（合约 + Foundry 测试 + 审计清单）', desc: '从需求到部署的企业级质押奖励合约：rewardPerToken 算法、完整实现、测试、监控与里程碑', html: `
<h1>M08.9 实战：质押挖矿协议（合约 + Foundry 测试 + 审计清单）</h1>
${meta(['推导 rewardPerToken 累加器算法，并用数值例子说清为什么它 Gas 是常数级。', '写出基于 OpenZeppelin 的完整质押合约，用 SafeERC20、ReentrancyGuard、AccessControl、Pausable。', '设计 Foundry 单元、模糊、不变量测试，部署脚本，集成接口，威胁模型和监控告警。'], '<a href="#m02-7">M02.8 合约安全 I</a>、<a href="#m02-5">M02.5 ERC-20 与授权</a>、<a href="#m02-4">M02.4 开发工具链</a>')}
${beginner(`<p><strong>质押（Staking）</strong>：把代币锁进合约，按时间获得奖励代币。这里的质押是“协议发奖励”，不是 <a href="#m05">M04</a> 的 PoS 共识质押。</p>
<p><strong>奖励速率（Reward Rate）</strong>：每秒发多少奖励代币，由全体质押者按份额瓜分。</p>
<p><strong>累加器（Accumulator）</strong>：一个只增不减的全局变量，记录“从开始到现在，每一个质押代币累计应得多少奖励”。</p>
<p><strong>不变量（Invariant）</strong>：无论怎么操作都必须始终成立的性质，例如“合约里的奖励代币 ≥ 所有人应领的总和”。</p>
<p><strong>里程碑（Milestone）</strong>：项目分阶段的交付节点，每个阶段有明确产出。</p>`)}
${art('一图看懂：质押挖矿只维护一个全局累加器 R，每人再记一张快照', 660, 330, [
  S.text(330, 22, '奖励速率 1 个/秒（示例）；R ＝ 每 1 个质押代币累计分到的奖励', { size: 13, anchor: 'middle', dim: 1, mw: 620 }),
  S.box(10, 40, 193, 66, { k: 'info', t: 't=0　R = 0', s: 'Alice 质押 100，T = 100', mono: 1 }),
  S.box(233, 40, 193, 66, { k: 'info', t: 't=10　R = 0.1', s: 'Bob 质押 300，T = 400', mono: 1 }),
  S.box(456, 40, 194, 66, { k: 'key', t: 't=20　R = 0.125', s: '再过 10 秒，每个币分 0.025', mono: 1 }),
  S.arrow(205, 73, 231, 73, { k: 'plain' }),
  S.arrow(428, 73, 454, 73, { k: 'plain' }),
  S.route([[500, 108], [500, 138], [165, 138], [165, 170]], { k: 'plain', label: '应得 ＝ 余额 × (R − 快照)' }),
  S.arrow(600, 108, 600, 170, { k: 'plain' }),
  S.box(10, 172, 310, 72, { k: 'ok', icon: 'person', t: 'Alice：100 × (0.125 − 0) ＝ 12.5', s: '快照 userR = 0', mono: 1 }),
  S.box(340, 172, 310, 72, { k: 'ok', icon: 'person', t: 'Bob：300 × (0.125 − 0.1) ＝ 7.5', s: '快照 userR = 0.1（进场时的 R）', mono: 1 }),
  S.text(330, 284, '12.5 + 7.5 ＝ 20 ＝ 20 秒 × 1 个/秒，全程没有遍历用户', { size: 13.5, b: 1, anchor: 'middle', mw: 620 }),
  S.text(330, 310, '谁的余额要变，就先把 (R − 快照) 结算进 rewards，再更新快照', { size: 12, anchor: 'middle', dim: 1, mw: 620 })
], [
  ['flow', 'R 只增不减：每过一秒，每个质押代币多分到 rate ÷ T。人多了，每个币分到的变少。'],
  ['key', '快照冻结历史：Bob 进场时快照 0.1，所以他只拿 R 从 0.1 涨到 0.125 的那一段。'],
  ['risk', '余额变化前不先结算，旧份额会被按新单价重算，奖励就会算错。'],
  ['limit', '没人质押时 R 冻结；奖励池余额不足以覆盖发放速率时，getReward 会失败。']
], '上方三个时刻 R 从 0 涨到 0.1 再到 0.125；Alice 在零时刻质押一百，快照为零，应得十二点五；Bob 在十秒时质押三百，快照为零点一，应得七点五；两人合计二十，等于二十秒乘以每秒一个，不需要遍历用户。', 'm02-12')}

<h2>1. 项目目标与验收标准</h2>
<p>做一个<strong>单边质押挖矿</strong>协议：用户质押一种 ERC-20（stakingToken，例如项目的 LP 代币或治理代币），按时间线性获得另一种 ERC-20 奖励（rewardToken）。这是 Synthetix StakingRewards 的经典模式，被无数协议复用。</p>
${tbl(['类别', '验收标准（示例）', '怎么量'], [
  ['功能', '质押、提取、领奖、退出；管理员配置奖励速率、充值奖励、暂停', '每条都有通过的测试用例'],
  ['正确性', '任意操作序列下，发放奖励总和 ≤ 已充值奖励；精度误差 ≤ 每用户 1 wei 量级', '不变量测试 + 模糊测试'],
  ['吞吐 / Gas', 'stake ≤ 110k gas，getReward ≤ 90k gas（示例目标）', 'forge test --gas-report'],
  ['可用性', '关键函数可被守护者在 1 笔交易内暂停', '演练：pause 后 stake 立即 revert'],
  ['安全', '无 Critical / High 审计发现；外部调用全部防重入', 'Slither 零高危 + 外部审计报告'],
  ['可运维', '关键事件可被索引；奖励池余额低于阈值告警', '事件订阅 + 监控规则上线']
])}

<h2>2. 需求拆解与用户故事</h2>
${steps([
  '作为质押者，我可以存入 N 个 stakingToken，从存入那一刻开始按我的份额累积奖励。',
  '作为质押者，我可以随时提取本金，或单独领取已累积的奖励，或一键退出（提本金 + 领奖励）。',
  '作为奖励发放方（管理员），我可以充值一批奖励代币并设定一个发放周期（例如 7 天），系统据此算出每秒速率。',
  '作为守护者（安全角色），发现异常时我可以暂停质押和领奖，保护资金。',
  '作为集成方（前端 / 后端），我可以读取某地址的待领奖励、总质押量、周期结束时间，并监听事件做入账和展示。'
])}
${call('info', `<p>范围约束：本项目不做锁仓期、不做提前退出罚金、不做多奖励代币、不做可升级（用不可变合约降低风险面）。这些都是常见扩展，见文末。</p>`)}

<h2>3. 系统架构、调用链与状态机</h2>
${mm('系统架构', `
flowchart TB
  subgraph ON["链上"]
    SC["StakingRewards 合约<br/>AccessControl + Pausable + ReentrancyGuard"]
    ST["stakingToken (ERC-20)"]
    RT["rewardToken (ERC-20)"]
    SC -->|"safeTransferFrom / safeTransfer"| ST
    SC -->|"safeTransfer 奖励"| RT
  end
  subgraph OFF["链下"]
    FE["前端 DApp<br/>读 earned / balanceOf"]
    IDX["索引器<br/>监听事件写数据库"]
    MON["监控告警<br/>奖励池余额 / 暂停状态"]
    KEEP["运营脚本<br/>周期续期 notifyRewardAmount"]
  end
  U["用户钱包"] -->|"approve + stake"| SC
  FE --> U
  SC -->|"事件 Staked / RewardPaid"| IDX
  SC --> MON
  KEEP -->|"REWARDS_ADMIN"| SC
  OR["多签 / 时间锁"] -->|"DEFAULT_ADMIN_ROLE"| SC
`, [
  ['flow', '资金只在用户和合约之间流动，链下组件只读和发起管理交易，不托管资金。'],
  ['key', '权限分四层：用户（公开函数）、运营（REWARDS_ADMIN 续期奖励）、安全（GUARDIAN 暂停）、超级权限（多签 + 时间锁）。'],
  ['risk', '奖励代币余额不足以覆盖承诺的发放时，getReward 会失败。运营脚本必须在周期结束前续期或预警。'],
  ['limit', '合约不可升级：逻辑错误只能靠部署新合约 + 迁移，所以上线前测试和审计必须充分。']
])}
${mm('一次 stake 的调用链', `
sequenceDiagram
  autonumber
  participant U as 用户
  participant RT as rewardToken
  participant ST as stakingToken
  participant S as StakingRewards
  U->>ST: approve(S, amount)
  U->>S: stake(amount)
  S->>S: updateReward(U) 先结算历史奖励
  S->>S: whenNotPaused 和 nonReentrant 检查
  S->>ST: safeTransferFrom(U, S, amount)
  S->>S: totalSupply += amount, balances[U] += amount
  S-->>U: emit Staked(U, amount)
`, [
  ['flow', 'updateReward 必须在改变余额之前调用，把“旧份额 × 这段时间的单价”结算进该用户账上。'],
  ['key', 'CEI：先结算和改内部账（Effects），最后 safeTransferFrom（Interaction）。配合 nonReentrant 双保险。'],
  ['fail', '若 stakingToken 是“转账收手续费”的代币，实际到账会少于 amount，内部记账会虚高。本项目在部署时要求 stakingToken 不收转账费，并在文档注明。']
])}
${mm('用户仓位状态机', `
stateDiagram-v2
  state "无仓位" as None
  state "质押中（累积奖励）" as Active
  state "已暂停（只能提本金）" as Pausd
  [*] --> None
  None --> Active: stake
  Active --> Active: stake 更多 / getReward
  Active --> None: exit（提本金 + 领奖励）
  Active --> Pausd: 守护者 pause
  Pausd --> Active: unpause
  Pausd --> None: withdraw 本金（提本金不受暂停限制）
`, [
  ['flow', '奖励只在“质押中”累积。退出后份额归零，不再累积。'],
  ['key', '设计选择：暂停时仍允许用户提取本金（不扣押用户资产），只暂停 stake 和 getReward。这是对用户更友好的做法，也降低“暂停被当作跑路”的信任风险。'],
  ['risk', '若把 withdraw 也暂停，用户资金会被锁，极端情况下等于冻结用户资产，需要谨慎权衡。']
])}

<h2>4. 技术选型与理由</h2>
${tbl(['组件', '选型', '备选', '理由'], [
  ['合约语言', 'Solidity 0.8.26', 'Vyper', '生态和审计工具最成熟；0.8 自带溢出检查'],
  ['库', 'OpenZeppelin Contracts v5', 'Solmate / 自写', '审计充分，SafeERC20、AccessControl、Pausable、ReentrancyGuard 开箱即用'],
  ['开发框架', 'Foundry', 'Hardhat', 'Solidity 写测试，原生模糊和不变量测试，速度快'],
  ['奖励算法', 'rewardPerToken 累加器', '逐账户计息', 'O(1) Gas，无需遍历用户'],
  ['权限', 'AccessControl + Ownable2Step（或 TimelockController）', '单一 owner', '角色分离，两步转移防误转，超级权限上时间锁'],
  ['索引', 'The Graph 或自建事件索引器', '直接 RPC 轮询', '事件驱动，历史可回放']
])}

<h2>5. 核心算法：rewardPerToken 累加器</h2>
<p>目标：在不遍历所有用户的前提下，精确计算每个人应得的奖励。核心思想：维护一个全局累加器 R，表示“从合约启动到现在，每 1 个质押代币累计应分到的奖励”。</p>
${steps([
  '设奖励速率 rate（每秒发放的 rewardToken），总质押量 T。这一秒里，每个代币新分到 rate / T 的奖励。',
  '全局累加器：R(t) = R(上次) + rate × (now − 上次更新时间) × 1e18 / T。乘 1e18 是为了保留精度（定点数）。',
  '每个用户记录两个值：进场时的累加器快照 userR[u]，和已结算未领取的奖励 rewards[u]。',
  '用户应得（未结算部分）= balance[u] × (R − userR[u]) / 1e18。',
  '关键不变量：只要在用户余额变化前，先把 (R − userR[u]) 这段结算进 rewards[u] 并把 userR[u] 更新为当前 R，历史就被正确冻结，之后份额变化不影响已结算部分。'
])}
<p><strong>算一算（示例）</strong>：rate = 1 token/秒。</p>
${steps([
  't=0：Alice 质押 100。T=100，R=0，userR[Alice]=0。',
  't=10：Bob 质押 300。先更新 R：这 10 秒每代币分到 1×10/100 = 0.1，R = 0.1。Alice 此时应得 100×(0.1−0)=10。Bob 进场，userR[Bob]=0.1。现在 T=400。',
  't=20：再过 10 秒，每代币分到 1×10/400 = 0.025，R = 0.125。',
  'Alice 应得 = 100 × (0.125 − 0) = 12.5；Bob 应得 = 300 × (0.125 − 0.1) = 7.5。合计 20，正好等于 20 秒 × 1 token/秒。',
  '验证：前 10 秒 Alice 独享 10；后 10 秒 Alice 得 2.5、Bob 得 7.5。Alice 共 12.5，Bob 共 7.5。与累加器算法一致，且全程没有遍历用户。'
])}
${art('代码结构：StakingRewards.sol 里谁调用谁', 660, 372, [
  S.box(10, 28, 640, 40, { k: 'idle', dash: 1, mono: 1, t: 'ReentrancyGuard + Pausable + AccessControl', s: 'OpenZeppelin v5：nonReentrant / whenNotPaused / onlyRole' }),
  S.box(10, 96, 200, 96, { k: 'info', icon: 'person', t: '用户函数', s: 'stake / withdraw\ngetReward / exit', tag: '任何人' }),
  S.box(230, 96, 200, 96, { k: 'warn', icon: 'gear', t: '管理函数', s: 'notifyRewardAmount\nsetRewardsDuration', tag: '运营角色' }),
  S.box(450, 96, 200, 96, { k: 'risk', icon: 'shield', t: '安全与救援', s: 'pause / unpause\nrecoverERC20', tag: '守护者/管理员' }),
  S.arrow(110, 70, 110, 94, { k: 'plain', dash: 1 }),
  S.arrow(330, 70, 330, 94, { k: 'plain', dash: 1 }),
  S.arrow(550, 70, 550, 94, { k: 'plain', dash: 1 }),
  S.box(60, 224, 540, 56, { k: 'key', mono: 1, t: 'modifier updateReward(account)', s: '先改 R、rewards[u]、userR[u]，再执行函数体' }),
  S.arrow(110, 194, 110, 222, { k: 'key' }),
  S.arrow(330, 194, 330, 222, { k: 'key' }),
  S.box(10, 312, 200, 48, { k: 'tint', mono: 1, t: 'rewardPerTokenStored', s: '全局累加器 R' }),
  S.box(230, 312, 200, 48, { k: 'tint', mono: 1, t: 'userRewardPerTokenPaid', s: '每人的快照 userR' }),
  S.box(450, 312, 200, 48, { k: 'tint', mono: 1, t: 'rewards / balanceOf', s: '已结算奖励 / 质押余额' }),
  S.arrow(110, 282, 110, 310, { k: 'plain' }),
  S.arrow(330, 282, 330, 310, { k: 'plain' }),
  S.arrow(550, 282, 550, 310, { k: 'plain' })
], [
  ['flow', '用户函数 stake、withdraw、getReward 和管理函数 notifyRewardAmount 都先经过 updateReward，再改状态。'],
  ['key', '角色分离：用户公开，REWARDS_ADMIN 管续期，GUARDIAN 管暂停，DEFAULT_ADMIN_ROLE 只管救援和授权。'],
  ['risk', 'pause 不加在 withdraw 上：暂停时用户仍能取回本金，只暂停 stake 和 getReward。'],
  ['limit', '合约不可升级；recoverERC20 不能动质押代币和奖励代币。']
], '最上方是继承的三个 OpenZeppelin 模块；中间三列是用户函数、管理函数、安全与救援函数；用户函数和续期函数先经过 updateReward 修饰器，再读写最下方的三组状态变量。', 'm02-12')}
${code('SOLIDITY', `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title 单边质押挖矿（Synthetix StakingRewards 模式）
contract StakingRewards is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant REWARDS_ADMIN = keccak256("REWARDS_ADMIN");
    bytes32 public constant GUARDIAN      = keccak256("GUARDIAN");

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRate;            // 每秒发放的奖励，单位是 rewardToken 的最小单位/秒（不额外乘 1e18）
    uint256 public periodFinish;          // 当前周期结束时间戳
    uint256 public rewardsDuration = 7 days;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;  // 全局累加器 R，放大 1e18

    mapping(address => uint256) public userRewardPerTokenPaid; // userR[u]
    mapping(address => uint256) public rewards;                // 已结算未领取
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward, uint256 periodFinish);
    event Recovered(address token, uint256 amount);

    error ZeroAmount();
    error RewardTooHigh();
    error ProtectedToken();

    constructor(address _staking, address _reward, address admin) {
        stakingToken = IERC20(_staking);
        rewardToken  = IERC20(_reward);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);   // admin 应为多签 / 时间锁
        _grantRole(REWARDS_ADMIN, admin);
        _grantRole(GUARDIAN, admin);
    }

    // ---- 累加器：所有改变份额或领奖的操作都先走这里 ----
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) return rewardPerTokenStored;   // 没人质押时累加器冻结
        uint256 dt = lastTimeRewardApplicable() - lastUpdateTime;
        return rewardPerTokenStored + (dt * rewardRate * 1e18) / totalSupply;
    }

    function earned(address account) public view returns (uint256) {
        return balanceOf[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18
             + rewards[account];
    }

    // ---- 用户操作 ----
    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        totalSupply += amount;
        balanceOf[msg.sender] += amount;                 // Effects
        stakingToken.safeTransferFrom(msg.sender, address(this), amount); // Interaction
        emit Staked(msg.sender, amount);
    }

    // 提本金不加 whenNotPaused：暂停时用户仍能取回自己的本金
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;                 // 下溢会在 0.8 下自动 revert
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;                     // Effects：先清零防重入
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function exit() external {
        withdraw(balanceOf[msg.sender]);
        getReward();
    }
}
`)}
<p>把奖励充值和周期管理放在管理函数里，并处理“周期中途续期”的剩余奖励：</p>
${code('SOLIDITY', `
    // 充值奖励并开启 / 续期发放周期；调用前应已把 reward 数量的 rewardToken 转入合约
    function notifyRewardAmount(uint256 reward)
        external onlyRole(REWARDS_ADMIN) updateReward(address(0))
    {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;   // 旧周期未发完的部分滚入新周期
            rewardRate = (reward + leftover) / rewardsDuration;
        }
        // 关键校验：合约里的奖励代币余额必须能支撑整个周期的发放，否则后期 getReward 会失败
        uint256 balance = rewardToken.balanceOf(address(this));
        if (rewardRate > balance / rewardsDuration) revert RewardTooHigh();

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward, periodFinish);
    }

    function setRewardsDuration(uint256 d) external onlyRole(REWARDS_ADMIN) {
        require(block.timestamp >= periodFinish, "period active"); // 只能在周期结束后改
        rewardsDuration = d;
    }

    function pause()   external onlyRole(GUARDIAN) { _pause(); }
    function unpause() external onlyRole(GUARDIAN) { _unpause(); }

    // 误转入的其他代币可救援，但禁止动质押代币和奖励代币
    function recoverERC20(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(stakingToken) || token == address(rewardToken)) revert ProtectedToken();
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Recovered(token, amount);
    }
`)}
${call('warn', `<p>Synthetix 原版的一个历史坑：如果 rewardToken 和 stakingToken 是同一个代币，<code>recoverERC20</code> 或余额校验可能把用户本金误算进奖励池。本项目用 <code>ProtectedToken</code> 禁止救援这两种代币，并建议二者不同。另一个坑：<code>notifyRewardAmount</code> 必须在转入奖励代币之后调用，否则余额校验通过但实际没钱。</p>`)}

<h2>6. 接口设计（读函数与事件）</h2>
${tbl(['类型', '签名', '用途'], [
  ['写', 'stake(uint256) / withdraw(uint256) / getReward() / exit()', '用户操作'],
  ['写', 'notifyRewardAmount(uint256)', '运营续期奖励'],
  ['读', 'earned(address) → uint256', '前端显示待领奖励'],
  ['读', 'balanceOf(address) / totalSupply()', '份额与 TVL'],
  ['读', 'rewardRate() / periodFinish() / rewardPerToken()', '展示年化与周期'],
  ['事件', 'Staked / Withdrawn / RewardPaid / RewardAdded', '索引器入账与审计'],
]) }
${code('TYPESCRIPT', `
// 前端 / 后端用 viem 读取与监听（见 M03）
import { createPublicClient, http, formatUnits } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({ chain: mainnet, transport: http() });

// 读某地址待领奖励
const pending = await client.readContract({
  address: STAKING, abi, functionName: "earned", args: [user],
});

// 估算年化（APR）：rate 是每秒奖励（rewardToken 最小单位）
// APR ≈ rewardRate * 一年秒数 * 奖励币价 / (totalSupply * 质押币价)
const [rate, total] = await Promise.all([
  client.readContract({ address: STAKING, abi, functionName: "rewardRate" }),
  client.readContract({ address: STAKING, abi, functionName: "totalSupply" }),
]);

// 监听领奖事件做入账
const unwatch = client.watchContractEvent({
  address: STAKING, abi, eventName: "RewardPaid",
  onLogs: (logs) => logs.forEach((l) => {
    // l.args.user, l.args.reward —— 落库前用 l.blockNumber 做幂等去重（见 M01 索引器）
  }),
});
`)}

<h2>7. 测试策略</h2>
${code('SOLIDITY', `
// test/StakingRewards.t.sol —— Foundry
pragma solidity 0.8.26;
import {Test} from "forge-std/Test.sol";
import {StakingRewards} from "../src/StakingRewards.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract StakingRewardsTest is Test {
    StakingRewards s; MockERC20 stk; MockERC20 rwd;
    address admin = address(0xA11CE); address alice = address(0x1); address bob = address(0x2);

    function setUp() public {
        stk = new MockERC20("Stake", "STK"); rwd = new MockERC20("Reward", "RWD");
        s = new StakingRewards(address(stk), address(rwd), admin);
        rwd.mint(address(s), 7 days * 1e18);           // 充入一周奖励
        vm.prank(admin); s.notifyRewardAmount(7 days * 1e18); // rate = 1e18/秒
        stk.mint(alice, 100e18); stk.mint(bob, 300e18);
    }

    // 单元：两人按份额和时间分奖励
    function test_TwoStakers_SplitByShareAndTime() public {
        vm.startPrank(alice); stk.approve(address(s), 100e18); s.stake(100e18); vm.stopPrank();
        skip(10);                                      // Alice 独享 10 秒
        vm.startPrank(bob); stk.approve(address(s), 300e18); s.stake(300e18); vm.stopPrank();
        skip(10);                                      // 之后按 100:300 分
        assertApproxEqAbs(s.earned(alice), 12.5e18, 1e12);
        assertApproxEqAbs(s.earned(bob),    7.5e18, 1e12);
    }

    function test_Pause_BlocksStake_AllowsWithdraw() public {
        vm.startPrank(alice); stk.approve(address(s), 100e18); s.stake(100e18); vm.stopPrank();
        vm.prank(admin); s.pause();
        vm.prank(alice); vm.expectRevert(); s.stake(1);        // 暂停禁止质押
        vm.prank(alice); s.withdraw(100e18);                   // 但本金可取
    }

    // 模糊：任意金额和等待时间，earned 不溢出、不超发
    function testFuzz_EarnedNeverExceedsFunded(uint96 amount, uint32 wait) public {
        amount = uint96(bound(amount, 1e6, 1e24)); wait = uint32(bound(wait, 0, 14 days));
        stk.mint(alice, amount);
        vm.startPrank(alice); stk.approve(address(s), amount); s.stake(amount); vm.stopPrank();
        skip(wait);
        assertLe(s.earned(alice), 7 days * 1e18);              // 不超过已充值总量
    }
}
`)}
${code('SOLIDITY', `
// test/StakingInvariant.t.sol —— 不变量测试：无论 handler 怎么乱序操作
contract StakingInvariant is Test {
    // ... setUp 部署合约和 Handler（随机 stake/withdraw/getReward/skip）
    // 不变量 1：合约奖励代币余额 ≥ 所有用户 earned 之和（永不资不抵债）
    function invariant_SolventRewards() public view {
        uint256 owed;
        for (uint i; i < handler.actorCount(); i++) owed += s.earned(handler.actors(i));
        assertGe(rwd.balanceOf(address(s)), owed);
    }
    // 不变量 2：totalSupply == 所有用户 balanceOf 之和
    function invariant_SupplyEqualsSumOfBalances() public view {
        uint256 sum;
        for (uint i; i < handler.actorCount(); i++) sum += s.balanceOf(handler.actors(i));
        assertEq(s.totalSupply(), sum);
    }
}
`)}
${tbl(['层次', '工具', '用例要点'], [
  ['单元', 'forge test', '单人/多人分配、周期续期、暂停、权限、边界（0 质押、周期结束后）'],
  ['模糊', 'forge test（testFuzz_）', '随机金额和时间下 earned 不溢出、不超发、不下溢'],
  ['不变量', 'forge test（invariant_）', '偿付性、份额守恒、累加器单调不减'],
  ['集成 / 分叉', 'forge test --fork-url', '用主网真实 USDT/USDC 做 stakingToken，验证 SafeERC20 兼容'],
  ['静态分析', 'slither .', '零高危；确认 updateReward 覆盖所有份额变更路径'],
  ['Gas', 'forge test --gas-report', '对照验收目标']
])}

<h2>8. 部署与运维</h2>
${code('SOLIDITY', `
// script/Deploy.s.sol —— Foundry 部署脚本
pragma solidity 0.8.26;
import {Script} from "forge-std/Script.sol";
import {StakingRewards} from "../src/StakingRewards.sol";

contract Deploy is Script {
    function run() external {
        address staking = vm.envAddress("STAKING_TOKEN");
        address reward  = vm.envAddress("REWARD_TOKEN");
        address admin   = vm.envAddress("ADMIN_MULTISIG");   // 多签 / 时间锁地址
        vm.startBroadcast();                                 // 私钥由 --ledger 或环境提供
        StakingRewards s = new StakingRewards(staking, reward, admin);
        vm.stopBroadcast();
        // 部署后由运营：① 转入奖励代币 ② 多签调用 notifyRewardAmount
    }
}
`)}
${code('BASH', `
# 部署并在 Etherscan 验证源码
forge script script/Deploy.s.sol \\
  --rpc-url $RPC_URL --ledger --broadcast \\
  --verify --etherscan-api-key $ETHERSCAN_KEY

# 续期（运营脚本，示例）：先转奖励，再 notify
cast send $REWARD_TOKEN "transfer(address,uint256)" $STAKING 700000000000000000000000 --ledger
cast send $STAKING "notifyRewardAmount(uint256)" 700000000000000000000000 --ledger
`)}
${tbl(['指标 / 事件', '含义', '告警阈值（示例）'], [
  ['rewardToken.balanceOf(合约)', '剩余可发放奖励', '低于 1 天发放量：紧急'],
  ['periodFinish − now', '距周期结束', '小于 24 小时：提醒续期'],
  ['Paused 事件', '合约被暂停', '出现即通知值班（可能是攻击或误操作）'],
  ['单笔 Staked / Withdrawn 金额', '异常大额', '超过 TVL 的 10%：人工复核'],
  ['getReward 失败率', '奖励池不足的早期信号', '任意失败即告警'],
  ['DEFAULT_ADMIN_ROLE 的 RoleGranted', '权限变更', '出现即高优先级告警']
])}
<p>密钥管理：DEFAULT_ADMIN_ROLE 用多签（例如 Gnosis Safe 3/5）+ 时间锁；REWARDS_ADMIN 可用运营热钱包但限定只能续期；GUARDIAN 用独立的暂停多签（例如 2/4），即使被盗最坏只能暂停。CI/CD：GitHub Actions 跑 <code>forge test</code> + <code>slither</code>，主网部署需人工审批并用硬件钱包签名。</p>

<h2>9. 安全清单与威胁模型</h2>
${mm('威胁模型：攻击者能从哪里下手', `
flowchart LR
  A["外部攻击者"] -->|"重入 getReward"| G["奖励转账回调"]
  A -->|"抢在 notify 前后操作"| N["周期切换边界"]
  A -->|"转账收费 / rebase 代币"| TK["stakingToken 非标准"]
  A -->|"极小额反复 stake/withdraw"| P["精度截断套利"]
  M["内部 / 私钥泄露"] -->|"改 rewardRate 过高"| R["奖励被抽空"]
  M -->|"recover 质押代币"| C["盗用户本金"]
  G -.->|"nonReentrant + CEI"| OK1["已防护"]
  TK -.->|"部署时限定标准代币"| OK2["已防护"]
  P -.->|"1e18 定点 + 向下取整"| OK3["已防护"]
  C -.->|"ProtectedToken + 多签时间锁"| OK4["已防护"]
`, [
  ['flow', '把每条攻击路径对到一条防护。没有对应防护的路径就是风险敞口。'],
  ['risk', '最大单点是 DEFAULT_ADMIN_ROLE：它能设 rewardRate、救援代币。必须多签 + 时间锁，不能是单个 EOA。'],
  ['key', 'updateReward 必须覆盖每一个改变 balanceOf 或 totalSupply 的函数，漏一个，累加器就会给错账。'],
  ['fail', 'notifyRewardAmount 的余额校验防止承诺超过库存，否则周期后段用户领不到奖励。']
])}
${tbl(['检查项', '为什么', '怎么验证'], [
  ['所有涉及资金的外部函数 nonReentrant + CEI', '防重入', 'Slither reentrancy 零告警 + 人工核对'],
  ['updateReward 覆盖 stake/withdraw/getReward/notify', '累加器正确性', '不变量测试通过'],
  ['stakingToken、rewardToken 为标准 ERC-20（无转账费、无 rebase）', '避免记账与实际余额不符', '部署清单核对 + 分叉测试'],
  ['notifyRewardAmount 有余额充足性校验', '防止承诺超过库存', '单元测试：reward 过高时 revert'],
  ['recoverERC20 禁止质押币和奖励币', '防盗用户本金', '测试：传入这两种代币 revert'],
  ['DEFAULT_ADMIN 为多签 + 时间锁，GUARDIAN 独立', '降低单点和内部作恶', '链上查角色持有者'],
  ['暂停不冻结用户本金', '保护用户资产与信任', '测试：暂停后 withdraw 成功'],
  ['外部审计 + 漏洞赏金', '发现未知问题', '审计报告 + Immunefi 计划上线']
])}
<p>送审前怎样准备范围文档、跑不变量与形式化工具，见 <a href="#m02-62">M02.10 审计方法与工具链</a>。</p>

<h2>10. 里程碑计划（5 周，示例）</h2>
${tbl(['周', '交付物', '完成标准'], [
  ['第 1 周', '需求冻结、接口定义、Foundry 工程骨架、MockERC20', '仓库可编译，CI 跑通空测试'],
  ['第 2 周', '核心合约（累加器、stake/withdraw/getReward/exit）', '单元测试覆盖主路径，手算对账一致'],
  ['第 3 周', '周期管理、权限、暂停、救援；模糊 + 不变量测试', 'invariant 偿付性通过，Slither 零高危'],
  ['第 4 周', '部署脚本、分叉测试、事件索引器、监控告警、前端读接口', '测试网端到端跑通，告警演练一次'],
  ['第 5 周', '外部审计修复、赏金上线、主网部署与验证、运维手册', '无 Critical/High，主网合约已验证源码']
])}

<h2>11. 扩展方向与作品集要点</h2>
<p><strong>扩展</strong>：① 锁仓期与提前退出罚金（veToken 模型）；② 多奖励代币（并行多个累加器）；③ 奖励加速（质押治理代币提升倍率，Curve gauge）；④ 可升级版本（UUPS + 存储命名空间，见 <a href="#m02-8">M02.9</a>）；⑤ 跨链奖励分发（把合约扩展成带前后端和监控的完整收益金库，见 <a href="#m12-3">M14.3 实现：合约与前后端</a>）。<strong>作品集要点</strong>：在 README 讲清 rewardPerToken 推导、贴 gas-report 和不变量测试输出、画本篇的架构图、写一页威胁模型。面试常问：为什么 updateReward 要在余额变更前调用？totalSupply 为 0 时累加器为何冻结？周期中途续期如何处理剩余奖励？暂停为何不冻结本金？</p>
${tryit(`<p>把本项目跑起来：</p>
<ol><li><code>forge init staking && cd staking</code>，<code>forge install OpenZeppelin/openzeppelin-contracts</code>。</li>
<li>把本篇 <code>StakingRewards</code> 放进 <code>src/</code>，测试放进 <code>test/</code>，补一个最简 <code>MockERC20</code>。</li>
<li>运行 <code>forge test -vvv</code>，预期两人分配用例通过，earned 约为 12.5 和 7.5。</li>
<li>运行 <code>forge test --gas-report</code> 看 stake / getReward 的 Gas，和第 1 节目标对照。</li>
<li>运行 <code>forge test --match-test invariant -vvv</code>，预期偿付性不变量不被打破。</li></ol>`)}

${mistakes([
  ['给每个用户逐秒计息。', '用全局累加器 rewardPerToken，用户余额 × 累加器差值即应得。O(1) Gas，不遍历用户。'],
  ['updateReward 只加在 stake 上。', '任何改变 balanceOf / totalSupply 的函数都要先 updateReward，漏一个就记错账。'],
  ['notifyRewardAmount 可以先设速率再转币。', '必须先把奖励代币转入合约，再 notify；且 notify 内要校验余额足够覆盖整个周期。'],
  ['暂停时连本金一起锁住最安全。', '锁住本金等于冻结用户资产，损害信任。只暂停 stake 和 getReward，始终允许提本金。'],
  ['rewardToken 和 stakingToken 用同一个代币没关系。', '会让余额校验和救援逻辑把本金误算成奖励，是经典事故来源。禁止救援这两种代币并建议二者不同。']
])}
${recap([
  '质押挖矿的核心是 rewardPerToken 累加器：维护全局“每代币累计奖励”，用户应得 = 份额 ×(累加器 − 快照)，Gas O(1)。',
  'updateReward 修饰器必须覆盖所有改变份额和领奖的函数，这是正确性的命根子。',
  '安全栈：SafeERC20 + ReentrancyGuard + CEI + Pausable（不冻本金）+ AccessControl（多签/时间锁 + 独立守护者）。',
  'notifyRewardAmount 先转币后通知，并校验余额能覆盖整个周期；周期续期要把剩余奖励滚入。',
  '工程闭环：单元 + 模糊 + 不变量 + 分叉测试、Slither、部署验证、事件索引、奖励池余额与暂停告警、多签时间锁。'
])}
${quiz([
  { q: 'rewardPerToken 累加器算法最大的好处是什么？', o: ['奖励发放更快到账', '计算每个用户奖励时不需要遍历所有用户，Gas 为 O(1)', '可以无限超发奖励', '不需要记录用户份额'], a: 1, why: '累加器把“每代币累计奖励”做成一个全局值，用户应得由份额和两个快照算出，无需遍历。它不改变到账速度，也不超发。' },
  { q: '为什么 updateReward 必须在改变用户余额之前调用？', o: ['为了节省 Gas', '把旧份额对应的历史奖励先结算冻结，份额变化后不影响已结算部分', '为了触发事件', '为了防止重入'], a: 1, why: '先按旧份额结算 (R − userR) 并更新快照，历史被正确冻结。放在余额变更之后会用新份额错误地重算整段历史。' },
  { q: '关于暂停（Pausable）的设计，本项目选择？', o: ['暂停时冻结所有操作，包括提本金', '暂停时禁止 stake 和 getReward，但允许 withdraw 本金', '只有管理员能在暂停时操作', '暂停会自动退还所有用户'], a: 1, why: '只暂停质押和领奖，始终允许用户取回本金，避免冻结用户资产带来的信任和法律风险。' },
  { q: 'notifyRewardAmount 中“余额充足性校验”防止的是？', o: ['重入攻击', '承诺的发放总量超过合约实际持有的奖励代币，导致后期用户领不到', '整数溢出', '权限被滥用'], a: 1, why: '校验 rewardRate ≤ 余额/周期，保证整个周期都有币可发。它不针对重入、溢出或权限（那些由别的机制处理）。' },
  { q: '为什么要禁止 recoverERC20 救援 stakingToken 和 rewardToken？', o: ['这两种代币不值钱', '否则管理员可能把用户质押的本金或奖励池当作“误转代币”取走', '它们无法转账', 'OpenZeppelin 要求这样'], a: 1, why: '救援函数本意是取回误转的无关代币。放开这两种代币等于给管理员开了盗取用户本金和奖励的后门。' }
])}
${exercises([["计算题：rate = 2 token/秒（示例）。t = 0 时 Alice 质押 200；t = 20 时 Bob 质押 200。t = 30 时两人各应得多少？用累加器 R 逐步计算。", "<p>t = 0 到 20：T = 200，R 增加 2 × 20 / 200 = 0.2。Bob 进场时 userR[Bob] = 0.2，T 变为 400。</p><p>t = 20 到 30：R 增加 2 × 10 / 400 = 0.05，R = 0.25。</p><p>Alice 应得 200 × (0.25 − 0) = 50；Bob 应得 200 × (0.25 − 0.2) = 10。合计 60，等于 30 秒 × 2 token/秒。</p>"], ["计算题：rewardsDuration 为 7 天（604,800 秒）。当前 rewardRate 为 1 token/秒，周期还剩 2 天（172,800 秒）。管理员此时续期 reward = 432,000（示例）。新的 rewardRate 是多少？合约至少要持有多少奖励代币，余额校验才能通过？", "<p>旧周期剩余 leftover = 172,800 × 1 = 172,800。</p><p>新 rewardRate = (432,000 + 172,800) / 604,800 = 1 token/秒。</p><p>校验要求 rewardRate ≤ 余额 / 604,800，所以余额至少为 604,800。必须先转入奖励代币，再调用 <code>notifyRewardAmount</code>。</p>"], ["思考题：周期进行中，所有人都退出了，totalSupply 变为 0，一小时后才有人再质押。这一小时的奖励去了哪里？", "<p>totalSupply 为 0 时，<code>rewardPerToken()</code> 直接返回旧值，累加器冻结。下一次 updateReward 会把 <code>lastUpdateTime</code> 推到当前时间。</p><p>所以这一小时的奖励没有分给任何人，留在合约余额里。recoverERC20 也不能取走 rewardToken。运营要知道这部分奖励不会自动补发。</p>"]])}
${checklist(["能用 rewardPerToken 累加器手算多名质押者在不同时间进出后的应得奖励。", "能说出 updateReward 必须覆盖的函数，并解释它为什么要在余额变化前执行。", "能写出偿付性和份额守恒两个不变量测试，并用 forge test 跑通。", "能按“先转入奖励代币、再调用 notifyRewardAmount”的顺序完成一次奖励续期。", "能为质押合约配置奖励池余额、周期结束时间、Paused 事件和角色变更的监控告警。"])}
${terms([
  ['质押挖矿', 'Staking Rewards / Yield Farming', '质押一种代币按时间获得另一种奖励代币的机制'],
  ['累加器', 'rewardPerToken Accumulator', '记录每单位质押代币累计应得奖励的全局变量'],
  ['奖励速率', 'Reward Rate', '每秒发放的奖励代币数量'],
  ['发放周期', 'Rewards Duration', '一批奖励被线性发放完的时间长度'],
  ['不变量测试', 'Invariant Testing', '随机操作序列下验证某性质始终成立的测试'],
  ['模糊测试', 'Fuzz Testing', '用大量随机输入运行同一测试以暴露边界问题'],
  ['偿付性', 'Solvency', '合约资产始终足以覆盖所有用户应得的性质'],
  ['两步所有权转移', 'Ownable2Step', '新 owner 需主动接受才生效，防止误转到错误地址']
])}
` });
})();
