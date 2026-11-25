/* ---------- M00 子文章（1/3）：m00-1 ~ m00-3 ---------- */
(() => {

CUR = 'm00-1';
addCh({ id: 'm00-1', nav: '钱、账本与信任', title: 'M00.1 钱、账本与信任：为什么需要区块链', desc: '从记账的历史讲起：谁有记账权，双花怎么防，区块链解决了什么。', html: `
<h1>M00.1 钱、账本与信任：为什么需要区块链</h1>
${meta(['用自己的话解释“钱的本质是账本”，并说清银行账本怎样工作。', '解释数字世界的双花问题和拜占庭将军问题，说明它们为什么难。', '用决策图判断一个业务场景该不该用区块链。'], '<a href="#m00">M00 模块总览</a>')}
${beginner(`<p><strong>账本（Ledger）</strong>：记录“谁有多少、谁给了谁多少”的本子。银行的数据库就是一本账本。</p>
<p><strong>记账权</strong>：谁有权往账本里写新记录。在银行，只有银行有记账权。</p>
<p><strong>双花（Double Spending）</strong>：同一笔钱被花了两次。纸币很难双花，数字文件可以无限复制，所以数字货币必须专门防双花。</p>
<p><strong>节点（Node）</strong>：参与网络的一台计算机。在区块链里，每个节点都保存一份完整或部分账本。</p>
<p><strong>共识（Consensus）</strong>：多个节点对“账本下一页写什么”达成一致的过程。</p>`)}

<h2>1. 一句话理解</h2>
${one('钱是一本大家都承认的账本。区块链让一群互不信任的人共同维护这本账本，不需要一个中心机构来记账。')}
${call('analogy', `<p>想象一个村子用一块公共黑板记账：谁欠谁几袋米，全写在黑板上。如果只有村长能写，村民必须信任村长不改账。区块链的做法是：每户人家都抄一份黑板，新记录要多数人核对、签字后才能写上；想改旧账，要说服全村大多数人一起改，几乎做不到。</p>
<p>类比的局限：真实区块链里“村民”是全球匿名的计算机，可以随时加入或离开；“签字”由密码学完成，不靠人工核对。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m00-1"><div class="mmd-title"><span>一图看懂：谁在记账，你在相信谁</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 260" role="img" aria-label="中心化账本与区块链账本对比"><rect x="10" y="10" width="360" height="240" rx="10" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="190" y="36" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">中心化：一家机构记账</text><g transform="translate(160,92)"><path d="M0 22 L30 4 L60 22 z" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="2"/><rect x="6" y="24" width="48" height="34" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="2"/><path d="M16 28 v26 M30 28 v26 M44 28 v26" stroke="var(--warn)" stroke-width="2"/></g><text x="190" y="172" font-size="13" text-anchor="middle" fill="var(--ink)" font-weight="700">银行：唯一账本</text><circle cx="60" cy="80" r="16" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="60" y="85" font-size="11" text-anchor="middle" fill="var(--ink)">用户</text><line x1="74" y1="80" x2="156" y2="120" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="4 4"/><path d="M156.0 120.0 L148.0 120.0 L151.1 113.7 z" fill="var(--ink-2)"/><circle cx="60" cy="190" r="16" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="60" y="195" font-size="11" text-anchor="middle" fill="var(--ink)">用户</text><line x1="74" y1="190" x2="156" y2="120" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="4 4"/><path d="M156.0 120.0 L152.8 127.3 L148.3 122.0 z" fill="var(--ink-2)"/><circle cx="320" cy="80" r="16" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="320" y="85" font-size="11" text-anchor="middle" fill="var(--ink)">用户</text><line x1="306" y1="80" x2="224" y2="120" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="4 4"/><path d="M224.0 120.0 L228.9 113.7 L232.0 120.0 z" fill="var(--ink-2)"/><circle cx="320" cy="190" r="16" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="320" y="195" font-size="11" text-anchor="middle" fill="var(--ink)">用户</text><line x1="306" y1="190" x2="224" y2="120" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="4 4"/><path d="M224.0 120.0 L231.7 122.0 L227.2 127.3 z" fill="var(--ink-2)"/><text x="190" y="236" font-size="12" text-anchor="middle" fill="var(--ink-2)">你必须相信它不出错、不作恶、不倒闭</text><rect x="390" y="10" width="360" height="240" rx="10" fill="var(--paper)" stroke="var(--rule)" stroke-width="1.5"/><text x="570" y="36" font-size="15" text-anchor="middle" fill="var(--ink)" font-weight="700">区块链：每个节点各存一本</text><line x1="470" y1="90" x2="670" y2="90" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4"/><line x1="470" y1="90" x2="470" y2="190" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4"/><line x1="470" y1="90" x2="670" y2="190" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4"/><line x1="670" y1="90" x2="470" y2="190" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4"/><line x1="670" y1="90" x2="670" y2="190" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4"/><line x1="470" y1="190" x2="670" y2="190" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4"/><circle cx="470" cy="90" r="26" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><g><rect x="457" y="74" width="26" height="32" rx="3" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/><path d="M463 84 h14 M463 90 h14 M463 96 h10" stroke="var(--accent)" stroke-width="2"/></g><circle cx="670" cy="90" r="26" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><g><rect x="657" y="74" width="26" height="32" rx="3" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/><path d="M663 84 h14 M663 90 h14 M663 96 h10" stroke="var(--accent)" stroke-width="2"/></g><circle cx="470" cy="190" r="26" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><g><rect x="457" y="174" width="26" height="32" rx="3" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/><path d="M463 184 h14 M463 190 h14 M463 196 h10" stroke="var(--accent)" stroke-width="2"/></g><circle cx="670" cy="190" r="26" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><g><rect x="657" y="174" width="26" height="32" rx="3" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/><path d="M663 184 h14 M663 190 h14 M663 196 h10" stroke="var(--accent)" stroke-width="2"/></g><rect x="512" y="128" width="116" height="24" rx="12" fill="var(--paper)" stroke="var(--accent)" stroke-width="1"/><text x="570" y="145" font-size="13" text-anchor="middle" fill="var(--accent)" font-weight="700">同一份账本 × N</text><text x="570" y="236" font-size="12" text-anchor="middle" fill="var(--ink-2)">你相信的是公开规则，以及多数节点不会一起作恶</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>左边所有人的账都记在银行一处；右边每个节点都保存同一份完整账本，并按同样的规则独立验证。</span></li><li><span class="chip key">关键</span><span>区块链没有消除信任，而是把“信任一家机构”换成“信任公开规则 + 多数节点”。</span></li><li><span class="chip limit">局限</span><span>代价是效率：每个节点都要重复存储和验证，所以链上操作比银行系统慢、贵。</span></li></ul></figcaption></figure>

<h2>2. 钱的本质：从贝壳到数据库</h2>
<p>钱解决一个问题：<strong>记录价值的转移</strong>。人类先后用了 4 种方式记录它：</p>
${tbl(['阶段', '形式', '谁来记账', '主要问题'], [
  ['实物货币', '贝壳、金银', '不需要记账，东西在谁手上就是谁的', '笨重，难分割，不能远程支付'],
  ['纸币与票据', '银票、纸币', '发行方（钱庄、央行）担保', '可以伪造；发行方可以超发'],
  ['银行账户', '数据库里的余额', '银行', '必须信任银行；跨境慢、贵；账户可被冻结'],
  ['区块链', '公开账本上的余额', '全网节点按规则共同记账', '性能有限；私钥丢失不可找回']
])}
<p>今天你手机里的“余额”只是银行数据库里的一行记录。你转账时，没有任何实物移动，银行只是把 A 行的数字减少，把 B 行的数字增加。所以：<strong>现代货币本质上就是账本里的数字</strong>。谁控制账本，谁就控制钱。</p>

<h2>3. 中心化账本：银行怎样记账</h2>
<p>银行采用<strong>复式记账（Double-entry Bookkeeping）</strong>：每一笔转账同时记一笔“借”和一笔“贷”，借贷总额永远相等。这样任何一笔错账都能被对账发现。</p>
${mm('一次银行转账的内部流程', `
sequenceDiagram
  participant A as 付款人 Alice
  participant APP as 手机银行
  participant CORE as 银行核心系统
  participant DB as 账本数据库
  participant B as 收款人 Bob
  A->>APP: 转账 100 元给 Bob
  APP->>CORE: 提交指令（已登录身份）
  CORE->>CORE: 风控检查 与 余额检查
  CORE->>DB: 开启事务
  DB->>DB: Alice 余额减 100（借记）
  DB->>DB: Bob 余额加 100（贷记）
  DB-->>CORE: 提交事务
  CORE-->>B: 到账通知
`, [
  ['flow', '指令从用户到银行核心系统，银行在一个<strong>数据库事务</strong>里同时改两行余额，要么都成功，要么都失败。'],
  ['key', '银行通过“唯一记账人 + 事务”天然防止双花：同一笔钱，数据库只允许扣一次。'],
  ['risk', '银行可以冻结账户、拒绝转账、出错或倒闭。用户只能信任银行和监管。'],
  ['limit', '跨行、跨境转账要经过多家银行和清算机构，每家都有自己的账本，需要层层对账，所以慢、贵。']
])}
<p>下面是一个简化的银行账本表结构。注意：余额表和流水表在同一个事务里修改。</p>
${code('SQL', `
-- 账户表：每个账户一行，balance 是当前余额（单位：分，避免小数误差）
CREATE TABLE accounts (
  id         BIGINT PRIMARY KEY,
  owner_name VARCHAR(64) NOT NULL,
  balance    BIGINT NOT NULL CHECK (balance >= 0),  -- 禁止透支：数据库层面防双花
  frozen     BOOLEAN NOT NULL DEFAULT FALSE         -- 银行可以冻结账户
);
-- 流水表：只追加，不修改，用于审计和对账
CREATE TABLE journal (
  id         BIGSERIAL PRIMARY KEY,
  tx_id      UUID NOT NULL,          -- 同一笔转账的借、贷两条记录共享 tx_id
  account_id BIGINT NOT NULL REFERENCES accounts(id),
  amount     BIGINT NOT NULL,        -- 负数=借记（转出），正数=贷记（转入）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 一次转账：同一个事务内完成
BEGIN;
UPDATE accounts SET balance = balance - 10000 WHERE id = 1 AND balance >= 10000 AND NOT frozen;
UPDATE accounts SET balance = balance + 10000 WHERE id = 2;
INSERT INTO journal (tx_id, account_id, amount) VALUES
  ('7b1c0e0a-0000-0000-0000-000000000001', 1, -10000),
  ('7b1c0e0a-0000-0000-0000-000000000001', 2,  10000);
COMMIT;
`)}
${call('info', `<p>区块链并没有发明“账本”。它改变的是<strong>谁有记账权</strong>：从一家机构，变成按公开规则竞争或轮换的一群节点。后面 M09 讲交易所账本时，你会再次看到上面这种表结构。</p>`)}

<h2>4. 数字世界的难题：双花与拜占庭将军</h2>
<h3>4.1 双花问题</h3>
<p>数字文件可以无限复制。如果“1 枚数字币”只是一个文件，Alice 可以把同一个文件同时发给 Bob 和 Carol。银行用“唯一账本”解决这个问题。但如果没有银行，谁来判断哪一笔先发生？</p>
${mm('没有中心账本时的双花攻击', `
flowchart LR
  A["Alice<br/>只有 1 枚币"] -->|"交易 T1：1 枚给 Bob"| N1["节点组 1"]
  A -->|"交易 T2：同 1 枚给 Carol"| N2["节点组 2"]
  N1 --> B["Bob 以为收到钱<br/>发货"]
  N2 --> C["Carol 以为收到钱<br/>发货"]
  N1 -.->|"两组节点账本冲突"| X["哪一笔有效？"]
  N2 -.-> X
`, [
  ['flow', 'Alice 同时向网络的两部分发出两笔冲突交易。'],
  ['fail', '如果节点之间没有统一的排序规则，两组节点会各自认为自己的交易有效，账本分裂。'],
  ['risk', 'Bob 和 Carol 都发了货，其中一人最终收不到钱。'],
  ['key', '防双花的本质是：全网对<strong>交易顺序</strong>达成一致。先被写入账本的交易有效，后一笔冲突交易作废。']
])}
<h3>4.2 拜占庭将军问题（Byzantine Generals Problem）</h3>
<p>1982 年，Lamport、Shostak 和 Pease 用一个故事描述分布式系统的难题：几位将军围攻一座城，只能靠信使通信。他们必须统一行动（全部进攻或全部撤退）。问题是：<strong>其中一些将军是叛徒</strong>，会故意发送矛盾的消息。忠诚的将军怎样才能达成一致？${cite('Lamport, Shostak, Pease: The Byzantine Generals Problem (1982)', 'https://www.microsoft.com/en-us/research/publication/byzantine-generals-problem/')}</p>
<p>在计算机里，“叛徒”就是出故障或被黑客控制的节点。它可能宕机不说话，也可能对不同节点说不同的话。能在这种情况下仍然达成一致的系统，叫<strong>拜占庭容错（Byzantine Fault Tolerance，BFT）</strong>系统。</p>
<p><strong>算一算（示例）</strong>：经典 BFT 结论是，要容忍 f 个叛徒，节点总数至少为 n = 3f + 1。</p>
${steps([
  '如果要容忍 1 个叛徒：n = 3 × 1 + 1 = 4 个节点。',
  '如果有 100 个节点：f = ⌊(100 − 1) / 3⌋ = 33，最多容忍 33 个叛徒。',
  '为什么 3 个节点不够？假设 A 是叛徒，它对 B 说“进攻”，对 C 说“撤退”。B 和 C 各自收到 1 票进攻、1 票撤退，无法判断谁在说谎。',
  '4 个节点时，忠诚节点有 3 个，诚实的多数（2f + 1 = 3）可以压过叛徒的声音。'
])}
${call('deep', `<p>经典 BFT 算法（例如 PBFT）要求<strong>事先知道所有节点是谁</strong>。比特币要解决的是更难的版本：节点匿名、可以随时加入。如果“一个节点一票”，攻击者可以伪造成千上万个节点（女巫攻击，Sybil Attack）。中本聪的答案是：投票权按<strong>算力</strong>分配（工作量证明），伪造节点没有用，伪造算力要付真实电费。以太坊在 2022 年 9 月（The Merge）改为按<strong>质押的 ETH</strong> 分配投票权（权益证明）。${cite('ethereum.org：The Merge', 'https://ethereum.org/roadmap/merge/')}详见 <a href="#m01">M01</a>。</p>`)}

<h2>5. 区块链的答案：公开账本 + 共识 + 密码学</h2>
<p>2008 年 10 月，中本聪（Satoshi Nakamoto）发布比特币白皮书；2009 年 1 月，比特币网络启动。它把三件已有的技术组合起来：</p>
${tbl(['组件', '解决什么问题', '具体做法', '详见'], [
  ['公开账本', '谁都能查账，不用信任记账人', '每个节点保存完整账本副本；区块用哈希首尾相连，改旧账会被发现', '<a href="#m00-2">M00.2 哈希</a>'],
  ['共识机制', '谁有记账权、交易顺序怎么定', '工作量证明（PoW）或权益证明（PoS）选出下一个出块者；最长/最重链规则统一顺序', '<a href="#m01">M01</a>'],
  ['数字签名', '谁有权花这笔钱', '只有私钥持有者能签出有效交易，任何人都能用公钥验证', '<a href="#m00-3">M00.3 签名</a>']
])}
${mm('三件套怎样配合防止双花', `
flowchart TB
  U["用户用私钥签名交易"] --> V{"节点验证<br/>签名有效？余额够？"}
  V -->|"否"| R["丢弃交易"]
  V -->|"是"| MP["进入内存池"]
  MP --> P["共识：选出本轮出块者"]
  P --> BLK["出块者把交易排序<br/>打包成新区块"]
  BLK --> CHK{"其他节点复核<br/>有冲突交易？"}
  CHK -->|"有：只保留先打包的"| BLK2["后一笔冲突交易作废"]
  CHK -->|"无"| ADD["区块追加到链尾<br/>记录上一块哈希"]
  ADD --> SYNC["全网账本一致"]
`, [
  ['flow', '签名证明“有权花”，共识决定“谁先谁后”，哈希链保证“写下后难改”。'],
  ['key', '三件套缺一不可：没有签名，谁都能花别人的钱；没有共识，账本会分裂；没有哈希链，旧账可以被悄悄改写。'],
  ['fail', '刚进入区块的交易仍可能因为链重组被撤销，所以收款方要等待若干个“确认”。见 <a href="#lab-confirm">确认数实验</a>。'],
  ['risk', '如果攻击者控制超过 50% 的算力或质押，他可以重写最近的账本，实施双花（51% 攻击）。'],
  ['limit', '全网每个节点都要验证每一笔交易，所以公链吞吐量远低于银行数据库。']
])}

<h2>6. 什么时候该用区块链？</h2>
<p>区块链不是万能数据库。它用<strong>性能和成本</strong>换取<strong>不需要信任单一机构</strong>。如果你的场景本来就有一个大家都信任的机构，用普通数据库更好。</p>
${mm('该不该用区块链：决策图', `
flowchart TB
  Q1{"需要多方共享<br/>同一份数据吗？"} -->|"否"| DB["用普通数据库"]
  Q1 -->|"是"| Q2{"各方互相信任<br/>或有可信第三方吗？"}
  Q2 -->|"是，且愿意依赖它"| DB2["用中心化数据库<br/>+ 审计日志"]
  Q2 -->|"否"| Q3{"需要防篡改<br/>和公开可验证吗？"}
  Q3 -->|"否"| DB3["用共享数据库<br/>+ 合同约束"]
  Q3 -->|"是"| Q4{"数据或参与者<br/>需要公开吗？"}
  Q4 -->|"可以公开"| PUB["公链 或 L2"]
  Q4 -->|"必须保密 且 成员固定"| PRI["联盟链<br/>或公链 + 零知识证明"]
`, [
  ['key', '核心判断：是否存在<strong>多方互不信任</strong>，又必须共享一份<strong>可验证</strong>的数据。'],
  ['limit', '区块链只保证“上链之后不被篡改”，不保证“上链的数据是真的”。把假数据写上链，它就是永久的假数据（预言机问题）。'],
  ['fail', '常见失败案例：把只有一家公司使用的内部系统改成“区块链”，结果比数据库更慢、更贵，没有任何信任收益。']
])}
${tbl(['场景', '适合吗', '原因'], [
  ['跨境支付、稳定币转账', '适合', '多国多机构互不信任；链上 7×24 小时结算'],
  ['去中心化交易与借贷（DeFi）', '适合', '规则写在公开合约里，任何人可验证，资产自托管'],
  ['数字资产所有权（代币、NFT）', '适合', '所有权由私钥证明，不依赖平台'],
  ['公司内部 OA、考勤系统', '不适合', '只有一个信任中心，数据库更快更便宜'],
  ['高频大数据（视频、日志）', '不适合', '链上存储昂贵；通常只把哈希上链，原文放链下'],
  ['需要删除数据的场景（个人隐私）', '谨慎', '链上数据不可删除，可能与“被遗忘权”等法规冲突']
])}
${tryit(`<p>打开 <a href="#lab-hashchain">哈希链实验</a>：</p>
<ol><li>点击“全部挖矿”，让 4 个区块都显示“有效”。</li><li>把区块 #2 的数据改成“Bob → Carol 20 BTC”。</li><li>预期结果：#2、#3、#4 全部变红。这说明改一条旧账，后面所有区块都要重做。</li><li>再写下一个你身边的场景，用上面的决策图判断它该不该用区块链，并写出理由。</li></ol>`)}

${mistakes([
  ['区块链是一种加密货币', '区块链是一种多方共同记账的技术。加密货币是它的第一个应用。'],
  ['上了链的数据就是真实的', '链只保证数据写入后不被篡改，不保证写入时是真的。'],
  ['去中心化系统不需要信任任何东西', '仍然要信任密码学、代码正确，以及多数节点诚实。'],
  ['所有系统用区块链都更好', '只有多方互不信任、又必须共享可验证数据时，区块链才有优势。']
])}
${recap([
  '现代货币本质上是账本里的数字，谁控制账本谁就控制钱。',
  '银行用“唯一记账人 + 数据库事务”防双花，代价是必须信任银行。',
  '没有中心机构时，难点是让互不信任的节点对交易顺序达成一致（拜占庭将军问题）。',
  '区块链 = 公开账本（哈希链）+ 共识（PoW/PoS）+ 数字签名。',
  '经典 BFT 要容忍 f 个叛徒，至少需要 3f + 1 个节点。',
  '只有在多方互不信任且需要可验证共享数据时，才该用区块链。'
])}
${quiz([
  { q: '银行系统怎样防止同一笔钱被花两次？', o: ['靠用户自觉', '只有银行能记账，并用数据库事务检查余额', '用工作量证明', '把每笔转账公开到网上'], a: 1, why: '银行是唯一记账人，扣款和入账在同一个事务里完成，余额不足就失败。工作量证明是比特币的做法。' },
  { q: '要容忍 2 个拜占庭（恶意）节点，经典 BFT 至少需要多少个节点？', o: ['3', '5', '6', '7'], a: 3, why: 'n = 3f + 1 = 3 × 2 + 1 = 7。' },
  { q: '下面哪个场景最不适合使用公链？', o: ['跨境稳定币支付', '公司内部考勤打卡系统', '去中心化交易所', '数字收藏品所有权'], a: 1, why: '考勤系统只有公司一个信任中心，用数据库更快更便宜，没有信任收益。' },
  { q: '在区块链“三件套”中，哪一项决定“两笔冲突交易谁有效”？', o: ['共识机制', '数字签名', '哈希函数的雪崩效应', '钱包界面'], a: 0, why: '共识决定交易顺序，先被打包的交易有效。签名只证明有没有权花这笔钱。' }
])}
${exercises([["计算题（示例）：一个经典 BFT 系统有 10 个节点。它最多能容忍几个叛徒？如果要容忍 5 个叛徒，至少需要多少个节点？", "<p>按 n = 3f + 1 反推：f = ⌊(10 − 1) / 3⌋ = 3，最多容忍 3 个叛徒。要容忍 5 个叛徒，n = 3 × 5 + 1 = 16 个节点。节点数少于这个值，诚实的多数（2f + 1）就压不过叛徒的矛盾消息。</p>"], ["思考题：在节点匿名、可以随时加入的网络里，为什么不能简单地“一个节点一票”？比特币和以太坊分别怎样解决？", "<p>攻击者可以伪造成千上万个节点，获得不成比例的投票权，这叫女巫攻击。比特币按算力分配投票权（工作量证明），伪造节点没用，伪造算力要付真实电费。以太坊在 2022 年改为按质押的 ETH 分配投票权（权益证明）。</p>"], ["设计题：三家互不信任的物流公司想共享一份可验证的货物交接记录。数据不能公开，成员固定。请用本文的决策图走一遍，并说出一个仍然存在的风险。", "<p>需要多方共享数据：是。各方互不信任，也没有愿意依赖的第三方：否。需要防篡改和可验证：是。数据必须保密且成员固定：选联盟链，或公链加零知识证明。仍然存在的风险是：链只保证上链之后不被篡改，不保证上链时的数据是真的。</p>"]])}
${checklist(["能用银行转账流程说明“唯一记账人 + 数据库事务”怎样防双花。", "能用 n = 3f + 1 手算任意节点数下最多能容忍的叛徒数。", "能说出公开账本、共识机制、数字签名各自解决的问题。", "能用决策图判断一个业务场景该不该用区块链，并写出理由。"])}
${terms([
  ['账本', 'Ledger', '记录资产归属和转移的数据集合'],
  ['复式记账', 'Double-entry Bookkeeping', '每笔交易同时记借和贷，两边总额相等'],
  ['双花', 'Double Spending', '同一笔数字资产被花费两次'],
  ['拜占庭将军问题', 'Byzantine Generals Problem', '存在恶意参与者时，分布式节点如何达成一致的问题'],
  ['拜占庭容错', 'Byzantine Fault Tolerance (BFT)', '在部分节点作恶时仍能达成一致的能力'],
  ['女巫攻击', 'Sybil Attack', '攻击者伪造大量身份以获取不成比例的投票权'],
  ['共识', 'Consensus', '节点对账本内容和顺序达成一致的过程'],
  ['51% 攻击', '51% Attack', '攻击者控制多数算力或质押，重写最近账本的攻击']
])}
` });

CUR = 'm00-2';
addCh({ id: 'm00-2', nav: '哈希函数', title: 'M00.2 哈希函数：从零理解区块链的“指纹机”', desc: '确定性、雪崩、单向、抗碰撞；SHA-256、Keccak-256 与六种链上用途。', html: `
<h1>M00.2 哈希函数：从零理解区块链的“指纹机”</h1>
${meta(['说出哈希函数的 5 个性质，并能用实验演示雪崩效应。', '区分 SHA-256 和 Keccak-256，说出它们分别用在哪条链的哪里。', '列举哈希在区块链中的 6 种用途，并用生日悖论估算碰撞难度。'], '<a href="#m00-1">M00.1 钱、账本与信任</a>', ['hashplay', 'hashchain'])}
${beginner(`<p><strong>比特（bit）</strong>：计算机里最小的信息单位，只能是 0 或 1。256 位 = 256 个 0/1。</p>
<p><strong>字节（byte）</strong>：8 个比特。32 字节 = 256 位。</p>
<p><strong>十六进制（hex）</strong>：用 0–9 和 a–f 共 16 个符号写数字，一个符号代表 4 个比特。256 位写成十六进制是 64 个字符，常以 <code>0x</code> 开头。</p>
<p><strong>穷举（Brute Force）</strong>：一个一个地试所有可能，直到找到答案。</p>
<p><strong>摘要（Digest）</strong>：哈希函数的输出，也叫哈希值。</p>`)}

<h2>1. 一句话理解</h2>
${one('哈希函数把任意长度的数据变成固定长度的“指纹”。同样的数据永远得到同样的指纹；数据改一点，指纹全变；从指纹无法反推数据。')}
${call('analogy', `<p>哈希像一台榨汁机：放进同样的水果，永远榨出同样味道的果汁；换一颗葡萄，味道完全不同；拿到果汁，你没法还原出原来是哪几个水果。</p>
<p>类比的局限：真实果汁能尝出“有苹果味”，哈希输出却完全看不出输入的任何特征。</p>`)}
${art('一图看懂：哈希是数据的指纹，同入同出，一改全变，无法倒推', 660, 305, [
  S.text(80, 28, '输入（任意长度）', { size: 12, dim: 1, anchor: 'middle' }),
  S.text(330, 28, '哈希函数', { size: 12, dim: 1, anchor: 'middle' }),
  S.text(580, 28, '指纹（固定长度）', { size: 12, dim: 1, anchor: 'middle' }),
  S.box(240, 40, 180, 176, { k: 'key', icon: 'hash', t: 'SHA-256', s: '固定 256 位输出\n同入必同出' }),
  S.box(10, 48, 140, 44, { k: 'info', t: 'hello', s: '5 个字符', mono: 1 }),
  S.box(10, 108, 140, 44, { k: 'warn', t: 'Hello', s: '只改 1 个字母' }),
  S.box(10, 168, 140, 44, { k: 'info', t: '1 GB 的文件', s: '长度完全不同' }),
  S.box(510, 48, 140, 44, { k: 'info', t: '2cf24dba…b9824', s: '64 个十六进制字符', mono: 1 }),
  S.box(510, 108, 140, 44, { k: 'warn', t: '185f8db3…81969', s: '几乎每一位都变了', mono: 1 }),
  S.box(510, 168, 140, 44, { k: 'info', t: '仍是 64 个字符', s: '长度永远不变' }),
  S.arrow(152, 70, 238, 70),
  S.arrow(152, 130, 238, 130, { k: 'warn' }),
  S.arrow(152, 190, 238, 190),
  S.arrow(422, 70, 508, 70),
  S.arrow(422, 130, 508, 130, { k: 'warn', label: '完全不同' }),
  S.arrow(422, 190, 508, 190),
  S.route([[580, 216], [580, 252], [80, 252], [80, 216]], { k: 'risk', dash: 1, label: '反过来推：做不到，只能一个个试' }),
  S.text(330, 288, '指纹相同就是同一份数据；指纹变了就是被改过（示例为 SHA-256）', { size: 13.5, anchor: 'middle', mw: 620 })
], [
  ['flow', '三种长度的输入，输出都是 64 个十六进制字符（256 位）；同一个输入任何时候算出的结果一样。'],
  ['key', '只把 h 改成 H，指纹几乎每一位都变（雪崩效应），所以无法“微调输入”逼近想要的指纹。'],
  ['risk', '从指纹反推原文只能穷举。原文可能值很少时（例如只有“是/否”），要加随机数 salt。'],
  ['limit', '哈希只能发现篡改，不能阻止篡改；阻止篡改靠共识。']
], '哈希函数把任意长度的输入变成固定长度的指纹：hello 和 Hello 的指纹完全不同，反向推导只能穷举', 'm00-2')}

<h2>2. 哈希函数的 5 个性质</h2>
${tbl(['性质', '含义', '例子 / 作用'], [
  ['固定长度输出', '输入可以是 1 个字或 1 GB 文件，输出长度不变', 'SHA-256 永远输出 256 位（64 个十六进制字符）'],
  ['确定性', '同一个输入，任何时间、任何电脑算出的结果都一样', '全球节点能独立验证同一个区块哈希'],
  ['雪崩效应', '输入改 1 个比特，输出约一半比特翻转', '无法通过“微调输入”逼近目标哈希'],
  ['单向性（抗原像）', '已知输出，算不出输入，只能穷举', '承诺方案、密码存储'],
  ['抗碰撞', '找不到两个不同输入得到相同输出', '哈希可以当作数据的唯一身份证']
])}
<p>看两个真实例子（SHA-256）：</p>
${code('BASH', `
$ printf 'hello' | shasum -a 256
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
$ printf 'Hello' | shasum -a 256      # 只把 h 改成大写 H
185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969
$ printf '' | shasum -a 256           # 空字符串也有哈希
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
`)}
${mm('哈希函数的输入与输出', `
flowchart LR
  I1["任意数据<br/>一句话 / 一个文件 / 一个区块"] --> HF["哈希函数<br/>SHA-256 或 Keccak-256"]
  HF --> O1["固定 256 位输出<br/>64 个十六进制字符"]
  O1 -.->|"反推？不可能，只能穷举"| I1
  I2["改动 1 个字符"] --> HF
  HF --> O2["约 128 个比特不同<br/>看起来毫无关系"]
`, [
  ['flow', '数据单向流动：输入到输出很快（微秒级），输出到输入没有捷径。'],
  ['key', '“微小改动 → 巨大差异”让哈希成为篡改检测器：任何一位被改，指纹都对不上。'],
  ['limit', '哈希不是加密。加密可以用密钥解回原文；哈希没有密钥，也无法“解密”。'],
  ['risk', '如果输入空间很小（例如 6 位数字密码），攻击者可以把所有可能输入都算一遍，直接查表反推。所以短输入要加随机盐（salt）。']
])}

<h2>3. 动手：观察雪崩效应与“挖矿”</h2>
<p>先做什么：实验里预填了两句只差一个字符的话。观察什么：两行哈希中红色字符的数量，以及“不同比特占比”是否接近 50%。然后用下半部分寻找以 N 个 0 开头的哈希，记录尝试次数。</p>
${lab('hashplay')}
<p>你会看到：N = 1 时平均要试约 16 次，N = 4 时平均要试约 65,536 次。这就是比特币<strong>工作量证明</strong>的原理：没有捷径，只能一次次试 nonce。</p>
<p><strong>算一算（示例）</strong>：哈希的每个十六进制字符是 0 的概率是 1/16。</p>
${steps([
  '开头 1 个 0 的概率 = 1/16，期望尝试 16 次。',
  '开头 4 个 0 的概率 = (1/16)⁴ = 1/65,536，期望尝试 65,536 次。',
  '如果你的电脑每秒算 100 万次哈希，开头 10 个 0 期望需要 16¹⁰ ≈ 1.1 × 10¹² 次，约 1.1 × 10⁶ 秒 ≈ 12.7 天。',
  '比特币网络的难度远高于此，全网每秒算的哈希次数以 EH/s（10¹⁸ 次/秒）计（2025 年 9 月，全网算力 7 日均值首次达到约 1 ZH/s，即 1,000 EH/s；此后在这一量级波动）。' + cite('CoinDesk：比特币 7 日均值算力首次达到 1 ZH/s（2025-09-02）', 'https://www.coindesk.com/markets/2025/09/02/bitcoin-s-7-day-average-hashrate-hits-1-zettahash-for-first-time')
])}

<h2>4. SHA-256 与 Keccak-256</h2>
${tbl(['对比项', 'SHA-256', 'Keccak-256'], [
  ['设计来源', '美国 NSA 设计，NIST 2001 年发布（SHA-2 家族）', 'Keccak 团队设计，2012 年赢得 NIST SHA-3 竞赛'],
  ['内部结构', 'Merkle–Damgård 结构', '海绵结构（Sponge Construction）'],
  ['输出长度', '256 位', '256 位'],
  ['主要使用者', '比特币：区块哈希、交易 ID、挖矿（双重 SHA-256）', '以太坊：地址、交易哈希、函数选择器、事件签名、存储槽'],
  ['“hello” 的哈希', '2cf24dba…938b9824', '1c8aff95…a36deac8']
])}
${call('warn', `<p><strong>Keccak-256 ≠ SHA3-256。</strong>以太坊在 NIST 正式发布 SHA-3 标准（FIPS 202，2015 年）之前就采用了 Keccak。NIST 最终版本修改了填充规则，所以同一个输入，两者结果不同。例如 Python 的 <code>hashlib.sha3_256(b'hello')</code> 得到 <code>3338be69…</code>，不是以太坊的 <code>1c8aff95…</code>。写以太坊代码时，必须用库里明确标注 “Keccak” 或 “Legacy Keccak” 的函数，否则地址和签名全部算错。</p>`)}
${code('GO', `
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/sha3" // go get golang.org/x/crypto
)

func main() {
	data := []byte("hello")

	// 比特币风格：SHA-256
	s := sha256.Sum256(data)
	fmt.Println("SHA-256   :", hex.EncodeToString(s[:]))

	// 以太坊风格：Keccak-256（注意是 Legacy Keccak，不是 SHA3-256）
	k := sha3.NewLegacyKeccak256()
	k.Write(data)
	fmt.Println("Keccak-256:", hex.EncodeToString(k.Sum(nil)))
	// 输出：1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8

	// 对比：标准 SHA3-256，结果不同
	s3 := sha3.Sum256(data)
	fmt.Println("SHA3-256  :", hex.EncodeToString(s3[:]))
}
`)}
<p>如果你装了 Foundry（见 <a href="#m00-7">M00.7</a>），一行命令就能算 Keccak：<code>cast keccak "hello"</code>。</p>

<h2>5. 哈希在区块链中的 6 种用途</h2>
${mm('哈希在区块链中的 6 种用途', `
flowchart TB
  H["哈希函数"] --> U1["① 区块链接<br/>每块存上一块哈希"]
  H --> U2["② 交易 ID<br/>交易数据的哈希"]
  H --> U3["③ 地址<br/>公钥哈希取一部分"]
  H --> U4["④ 默克尔树<br/>成千上万笔交易压成一个根"]
  H --> U5["⑤ 工作量证明<br/>找小于目标值的哈希"]
  H --> U6["⑥ 承诺<br/>先公布哈希，后公开原文"]
  U1 --> R1["改旧块，后续全断"]
  U4 --> R4["轻节点只需少量哈希<br/>就能验证交易"]
  U6 --> R6["投票、拍卖、随机数<br/>防止先看后改"]
`, [
  ['flow', '六种用途都基于同一个思想：<strong>用短指纹代表长数据</strong>，对比指纹就能发现篡改。'],
  ['key', '区块链接让历史不可悄悄修改；默克尔树让验证变便宜；PoW 让出块有成本。'],
  ['risk', '承诺方案中，如果原文可能值很少（例如只有“是/否”），别人可以穷举出你的选择。必须拼接一个随机数（salt）再哈希。'],
  ['limit', '哈希只能检测篡改，不能阻止篡改。阻止篡改靠共识：改了的链，诚实节点不接受。']
])}
${tbl(['用途', '怎么用', '例子'], [
  ['① 区块链接', '区块头包含上一区块的哈希，形成链', '比特币区块头的 prev hash 字段；见下方 hashchain 实验'],
  ['② 交易 ID', '对签名后的交易数据求哈希，作为唯一编号', '以太坊交易哈希 = Keccak-256(签名后交易的编码)'],
  ['③ 地址', '对公钥求哈希，取一部分作为地址', '以太坊：Keccak-256(公钥) 取后 20 字节；见 <a href="#m00-3">M00.3</a>'],
  ['④ 默克尔树', '两两哈希交易，逐层向上，得到一个默克尔根', '区块头只存默克尔根，详见 <a href="#m01">M01</a>'],
  ['⑤ 工作量证明', '不断改 nonce，直到区块头哈希小于目标值', '比特币挖矿；上面的 hashplay 实验'],
  ['⑥ 承诺', '先公开 hash(选择 + salt)，截止后再公开原文和 salt', '链上密封拍卖、提交-揭示（commit-reveal）投票；零知识证明也从承诺讲起，见 <a href="#m10-1">M07.1 零知识证明直觉</a>']
])}
<p>下面这个实验把用途 ① 和 ⑤ 结合起来。先做什么：点击“全部挖矿”。观察什么：改动区块 #2 后，为什么 #3、#4 也失效。</p>
${lab('hashchain')}

<h2>6. 抗碰撞有多强：生日悖论</h2>
<p>一个房间里有多少人，才能让“至少两人同一天生日”的概率超过 50%？答案只有 <strong>23 人</strong>。直觉以为要 183 人（365 的一半），但实际上要比较的是“任意两人”，23 人之间有 23 × 22 / 2 = 253 对组合。</p>
<p><strong>算一算（示例）</strong>：</p>
${steps([
  '23 人生日全不相同的概率 = (365/365) × (364/365) × … × (343/365) ≈ 0.4927。',
  '至少两人相同的概率 = 1 − 0.4927 ≈ 50.7%。',
  '推广：对一个 k 位的哈希，找到任意一对碰撞，大约要算 2^(k/2) 次，而不是 2^k 次。',
  '32 位的哈希：约 2¹⁶ ≈ 6.5 万次就有较大概率碰撞，一台笔记本 1 秒内完成。所以 32 位哈希不安全。',
  '256 位的哈希：约 2¹²⁸ ≈ 3.4 × 10³⁸ 次。假设全球每秒算 10²¹ 次，也需要 3.4 × 10³⁸ ÷ 10²¹ ≈ 3.4 × 10¹⁷ 秒 ≈ 1.1 × 10¹⁰ 年（约 110 亿年），和宇宙年龄（约 1.4 × 10¹⁰ 年）同一量级。也就是说，全世界的算力连续算上接近宇宙年龄那么久，才有约一半机会碰到一次。'
])}
${call('info', `<p>历史上被攻破的哈希：MD5（2004 年王小云等人公布实用碰撞）${cite('Wang et al.: Collisions for Hash Functions MD4, MD5, HAVAL-128 and RIPEMD (2004)', 'https://eprint.iacr.org/2004/199')}和 SHA-1（2017 年 2 月 Google 与 CWI 公布第一个实际碰撞 SHAttered）${cite('Google Security Blog：Announcing the first SHA1 collision', 'https://security.googleblog.com/2017/02/announcing-first-sha1-collision.html')}。所以新系统不能再用 MD5 或 SHA-1 做安全用途。SHA-256 和 Keccak-256 截至 2026 年公开资料没有已知的实用攻击。</p>`)}
${tryit(`<p>在终端里验证本文的哈希值（macOS/Linux 自带 <code>shasum</code>）：</p>
<ol><li>运行 <code>printf 'abc' | shasum -a 256</code>，预期输出 <code>ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad</code>。</li><li>运行 <code>printf 'abd' | shasum -a 256</code>，对比两行有多少字符不同。</li><li>如果装了 Foundry，运行 <code>cast keccak ""</code>，预期输出 <code>0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470</code>（空数据的 Keccak-256，在以太坊里常用来表示“空代码”）。</li><li>注意：用 <code>echo</code> 会多一个换行符，结果会不同。这本身就是一次雪崩效应演示。</li></ol>`)}

${mistakes([
  ['哈希就是加密，可以解密', '哈希没有密钥，不可逆。加密才能解密。'],
  ['输入差不多，哈希也差不多', '雪崩效应让输入改 1 位，输出约 50% 的比特翻转。'],
  ['SHA3-256 就是以太坊用的 Keccak-256', '填充规则不同，结果不同。以太坊用的是原版 Keccak-256。'],
  ['哈希可以安全地隐藏任何数据', '如果原文可能值很少，攻击者可以穷举。要加随机 salt。'],
  ['256 位哈希碰撞需要 2²⁵⁶ 次尝试', '由于生日悖论，找任意碰撞约需 2¹²⁸ 次，但仍然远超可行范围。']
])}
${recap([
  '哈希函数：任意输入 → 固定长度输出，具备确定性、雪崩效应、单向性、抗碰撞。',
  '比特币主要用 SHA-256（挖矿用双重 SHA-256）；以太坊用 Keccak-256。',
  'Keccak-256 与 NIST 标准 SHA3-256 结果不同，写代码时必须选对函数。',
  '哈希的 6 种链上用途：区块链接、交易 ID、地址、默克尔树、工作量证明、承诺。',
  '生日悖论：k 位哈希的碰撞难度约为 2^(k/2)，所以安全哈希至少要 256 位。'
])}
${quiz([
  { q: '把输入 “hello” 改成 “Hello”，SHA-256 输出会怎样？', o: ['只有第一个字符变', '完全不变', '大约一半比特翻转，看起来完全不同', '输出长度变短'], a: 2, why: '这是雪崩效应。输出长度固定不变，但内容看起来毫无关系。' },
  { q: '以太坊地址的计算使用哪个哈希函数？', o: ['SHA-256', 'Keccak-256', 'MD5', 'SHA3-256（FIPS 202 版）'], a: 1, why: '以太坊使用原版 Keccak-256，取公钥哈希的后 20 字节作为地址。它和 FIPS 202 的 SHA3-256 结果不同。' },
  { q: '开头 3 个十六进制 0 的哈希，期望需要尝试多少次？', o: ['48', '256', '1,024', '4,096'], a: 3, why: '每个字符是 0 的概率是 1/16，3 个就是 1/16³ = 1/4096。' },
  { q: '链上投票先提交 hash(选择) 再揭示，为什么还要拼接随机数 salt？', o: ['选择只有少数几种，不加 salt 别人能穷举出你的选择', '让哈希更短', '让交易手续费更低', '让哈希可以被解密'], a: 0, why: '如果选择只有“赞成/反对”，别人把两种都算一遍就能对上你的哈希。加 salt 后无法穷举。' }
])}
${exercises([["计算题（示例）：你的电脑每秒能算 100 万次哈希。要找到开头 6 个十六进制 0 的哈希，期望需要多少次尝试、多长时间？", "<p>每个十六进制字符是 0 的概率是 1/16。开头 6 个 0 的概率是 (1/16)⁶ = 1/16,777,216。期望尝试约 1,677 万次。每秒 100 万次，约需 16.8 秒。</p>"], ["计算题（示例）：一个系统用 64 位哈希做唯一 ID。按生日悖论，大约算多少次就有较大概率出现碰撞？如果每秒能算 10 亿次，需要多久？", "<p>k 位哈希的碰撞难度约为 2^(k/2)。64 位哈希约需 2³² ≈ 43 亿次。每秒 10 亿次，约 4.3 秒就能找到碰撞。所以 64 位哈希不适合做安全用途，安全哈希至少要 256 位。</p>"], ["思考题：一位同事写以太坊代码时，直接用 Python 的 <code>hashlib.sha3_256</code> 计算地址。会出什么问题？应该怎样改？", "<p>以太坊用的是原版 Keccak-256，它比 NIST 正式发布的 SHA3-256 早。NIST 最终版本修改了填充规则，所以同一输入的结果不同。用 SHA3-256 算出的地址和签名全部错误。应改用库里明确标注 “Keccak” 或 “Legacy Keccak” 的函数，例如 Go 的 <code>sha3.NewLegacyKeccak256()</code>。</p>"]])}
${checklist(["能说出哈希函数的 5 个性质，并为每个性质举一个链上作用。", "能手算开头 N 个十六进制 0 的期望尝试次数和耗时。", "能区分 SHA-256 与 Keccak-256 的使用者，并说明 Keccak-256 与 SHA3-256 结果不同的原因。", "做过用 shasum 对比两个只差一个字符的输入的哈希。", "能用生日悖论估算 k 位哈希的碰撞难度。"])}
${terms([
  ['哈希函数', 'Hash Function', '把任意数据映射为固定长度摘要的单向函数'],
  ['雪崩效应', 'Avalanche Effect', '输入微小变化导致输出约一半比特翻转'],
  ['抗碰撞', 'Collision Resistance', '找不到两个不同输入得到相同哈希的性质'],
  ['单向性', 'Preimage Resistance', '已知哈希值无法反推出输入的性质'],
  ['SHA-256', 'Secure Hash Algorithm 256', 'SHA-2 家族的 256 位哈希，比特币使用'],
  ['Keccak-256', 'Keccak-256', 'SHA-3 竞赛获胜算法的原版 256 位实现，以太坊使用'],
  ['默克尔树', 'Merkle Tree', '把多条数据逐层两两哈希、汇总为一个根的树结构'],
  ['承诺方案', 'Commitment Scheme', '先公开数据哈希、后公开原文，防止事后修改'],
  ['生日悖论', 'Birthday Paradox', 'k 位哈希的碰撞约在 2^(k/2) 次尝试时出现的概率现象'],
  ['盐', 'Salt', '拼接到原文上的随机数，防止穷举反推']
])}
` });

CUR = 'm00-3';
addCh({ id: 'm00-3', nav: '公钥私钥与签名', title: 'M00.3 公钥、私钥与数字签名：链上身份的数学基础', desc: '私钥→公钥→地址的单向推导；签名保证什么；随机数重用为何泄露私钥。', html: `
<h1>M00.3 公钥、私钥与数字签名：链上身份的数学基础</h1>
${meta(['区分对称加密和非对称加密，说清公钥和私钥各自的用途。', '一步步写出以太坊“私钥 → 公钥 → 地址 → EIP-55 校验和”的推导过程。', '画出签名与验证流程，说明签名保证的三件事，以及随机数重用为什么会泄露私钥。'], '<a href="#m00-2">M00.2 哈希函数</a>', ['sigtoy'])}
${beginner(`<p><strong>密钥（Key）</strong>：一串秘密数字，用来加密、解密或签名。</p>
<p><strong>私钥（Private Key）</strong>：只有你知道的密钥。以太坊私钥是一个 256 位随机数。</p>
<p><strong>公钥（Public Key）</strong>：由私钥算出、可以公开给所有人的密钥。</p>
<p><strong>模运算（mod）</strong>：取余数。例如 17 mod 5 = 2。密码学大量使用模运算，因为它让数字“绕圈”，难以反推。</p>
<p><strong>椭圆曲线（Elliptic Curve）</strong>：一种数学曲线。在它上面做“乘法”很容易，做“除法”极难。以太坊和比特币都用名为 secp256k1 的曲线。</p>`)}

<h2>1. 一句话理解</h2>
${one('私钥用来签名，公钥用来验证。从私钥算公钥很容易，从公钥反推私钥在计算上不可能。链上“你是谁”就由你能否签出有效签名决定。')}
${call('analogy', `<p>私钥像你独一无二的印章，公钥像公开备案的印模。你在合同上盖章（签名），任何人拿备案的印模比对（验证），就知道是你盖的，而且合同盖章后没被改过。</p>
<p>类比的局限：真实印章可以被仿刻；数字签名在私钥不泄露的前提下，无法伪造。另外，数字签名对每份文件都不一样，不能“剪下来贴到另一份文件上”。</p>`)}
<figure class="mmd fig-html fk-artfig" data-art="m00-3"><div class="mmd-title"><span>一图看懂：私钥、公钥、地址的单向关系</span></div><div class="fig-body"><svg class="fk-art" viewBox="0 0 760 190" role="img" aria-label="私钥推出公钥，公钥推出地址，反向不可行"><rect x="20" y="50" width="180" height="90" rx="10" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="1.5"/><text x="110" y="106" font-size="16" text-anchor="middle" fill="var(--ink)" font-weight="700">私钥</text><text x="110" y="128" font-size="12" text-anchor="middle" fill="var(--ink-2)">256 位随机数</text><rect x="290" y="50" width="180" height="90" rx="10" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1.5"/><text x="380" y="106" font-size="16" text-anchor="middle" fill="var(--ink)" font-weight="700">公钥</text><text x="380" y="128" font-size="12" text-anchor="middle" fill="var(--ink-2)">k × G（曲线上的点）</text><rect x="560" y="50" width="180" height="90" rx="10" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="1.5"/><text x="650" y="106" font-size="16" text-anchor="middle" fill="var(--ink)" font-weight="700">地址</text><text x="650" y="128" font-size="12" text-anchor="middle" fill="var(--ink-2)">Keccak-256 后 20 字节</text><g fill="none" stroke="var(--risk)" stroke-width="3"><circle cx="55" cy="78" r="9"/><path d="M64 78 h26 v8 M76 78 v6"/></g><g transform="translate(316,64)" fill="none" stroke="var(--info)" stroke-width="3"><rect x="0" y="12" width="22" height="18" rx="3"/><path d="M4 12 v-6 a7 7 0 0 1 14 0 v6"/></g><g transform="translate(588,66)" fill="none" stroke="var(--ok)" stroke-width="2.5"><rect x="0" y="4" width="28" height="20" rx="3"/><path d="M0 6 l14 10 l14 -10"/></g><line x1="204" y1="82" x2="284" y2="82" stroke="var(--ink-2)" stroke-width="2"/><path d="M284.0 82.0 L276.8 85.5 L276.8 78.5 z" fill="var(--ink-2)"/><text x="244" y="72" font-size="11" text-anchor="middle" fill="var(--ink)">椭圆曲线乘法</text><line x1="474" y1="82" x2="554" y2="82" stroke="var(--ink-2)" stroke-width="2"/><path d="M554.0 82.0 L546.8 85.5 L546.8 78.5 z" fill="var(--ink-2)"/><text x="514" y="72" font-size="11" text-anchor="middle" fill="var(--ink)">哈希</text><line x1="284" y1="116" x2="204" y2="116" stroke="var(--risk)" stroke-width="2" stroke-dasharray="5 4"/><path d="M204.0 116.0 L211.2 112.5 L211.2 119.5 z" fill="var(--risk)"/><text x="244" y="134" font-size="11" text-anchor="middle" fill="var(--risk)">✕ 算不回去</text><line x1="554" y1="116" x2="474" y2="116" stroke="var(--risk)" stroke-width="2" stroke-dasharray="5 4"/><path d="M474.0 116.0 L481.2 112.5 L481.2 119.5 z" fill="var(--risk)"/><text x="514" y="134" font-size="11" text-anchor="middle" fill="var(--risk)">✕ 算不回去</text><text x="110" y="168" font-size="12" text-anchor="middle" fill="var(--risk)">只在你手里，丢了就永远找不回</text><text x="380" y="168" font-size="12" text-anchor="middle" fill="var(--ink-2)">可以公开，用来验证签名</text><text x="650" y="168" font-size="12" text-anchor="middle" fill="var(--ink-2)">公开给别人收款</text></svg></div><figcaption><div class="cap">读图要点</div><ul class="notes"><li><span class="chip flow">数据流</span><span>从左往右计算很容易：私钥乘基点得到公钥，公钥哈希后取 20 字节得到地址。</span></li><li><span class="chip key">关键</span><span>从右往左在计算上不可行：知道地址或公钥，推不出私钥。这是“地址可以公开”的前提。</span></li><li><span class="chip risk">风险</span><span>私钥泄露 = 资产归别人。没有任何机构能帮你冻结或找回。</span></li></ul></figcaption></figure>

<h2>2. 对称加密与非对称加密</h2>
${tbl(['对比项', '对称加密', '非对称加密（公钥密码学）'], [
  ['密钥数量', '1 把，双方共享', '1 对：私钥 + 公钥'],
  ['典型算法', 'AES', 'RSA、ECDSA（椭圆曲线）、Ed25519'],
  ['速度', '快', '慢（通常只处理短数据，例如哈希）'],
  ['最大难题', '怎样把共享密钥安全地交给对方', '怎样确认“这个公钥真的属于对方”'],
  ['区块链中的用途', '钱包用密码加密本地存储的私钥（keystore 文件）', '交易签名、地址生成']
])}
<p>非对称密码学有两种用法：</p>
<ul>
<li><strong>加密</strong>：用对方的<strong>公钥</strong>加密，只有对方的<strong>私钥</strong>能解开。</li>
<li><strong>签名</strong>：用自己的<strong>私钥</strong>签名，任何人用你的<strong>公钥</strong>验证。区块链主要用这一种。</li>
</ul>
${call('info', `<p>公链交易<strong>没有被加密</strong>。所有人都能读到交易内容。签名只证明“是谁发的、没被改过”，不提供保密性。</p>`)}

<h2>3. 以太坊：私钥 → 公钥 → 地址</h2>
${mm('以太坊地址的单向推导链', `
flowchart LR
  R["安全随机数源"] --> SK["私钥<br/>32 字节随机数"]
  SK -->|"椭圆曲线乘法<br/>secp256k1：K = k × G"| PK["公钥<br/>64 字节（x, y）"]
  PK -->|"Keccak-256"| HH["32 字节哈希"]
  HH -->|"取后 20 字节"| AD["地址<br/>0x + 40 个十六进制字符"]
  AD -->|"EIP-55 大小写校验"| CS["校验和地址<br/>0x7E5F…5Bdf"]
  CS -.->|"反推？不可能"| SK
`, [
  ['flow', '每一步都是单向的：私钥 → 公钥靠椭圆曲线，公钥 → 地址靠哈希。'],
  ['key', '地址是公钥的“指纹”，不是公钥本身。节点在验证签名时，能从签名里恢复出公钥，再算出地址比对。'],
  ['risk', '一切安全都依赖私钥的随机性。用“脑钱包”（自己想一句话当私钥）或弱随机数生成私钥，资产会被机器人在几秒内盗走。'],
  ['limit', 'EIP-55 只防止输错字符，不防止复制了一个“看起来很像”的错误地址（地址投毒，见 <a href="#m00-6">M00.6</a>）。']
])}
<p><strong>算一算（示例，可在本机复现）</strong>：用私钥 = 1 演示（这个私钥人尽皆知，<strong>绝不能存钱</strong>）。</p>
${steps([
  '私钥 k = 0x000…0001（32 字节，最后一位是 1）。合法私钥范围是 1 到 n − 1，n ≈ 1.158 × 10⁷⁷。',
  '公钥 K = k × G。k = 1，所以 K 就是生成点 G 本身：x = 79BE667E…16F81798，y = 483ADA77…FB10D4B8，拼起来 64 字节。',
  'Keccak-256(x‖y) = 0xc0a6c424ac7157ae408398df<strong>7e5f4552091a69125d5dfcb7b8c2659029395bdf</strong>。',
  '取后 20 字节（40 个字符）：地址 = 0x7e5f4552091a69125d5dfcb7b8c2659029395bdf。',
  'EIP-55：对小写地址字符串（不含 0x）再做 Keccak-256，得到 a8aaec6a…。逐个字符对比：如果地址字符是字母，且哈希同一位置的十六进制数 ≥ 8，就把字母大写。',
  '第 2 个字符 e，哈希第 2 位是 8（≥ 8）→ 大写 E；第 4 个字符 f，哈希第 4 位是 a（≥ 8）→ 大写 F。最终：0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf。'
])}
${code('BASH', `
# 用 Foundry 的 cast 验证上面的推导
cast wallet address --private-key 0x0000000000000000000000000000000000000000000000000000000000000001
# 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf
cast to-check-sum-address 0x7e5f4552091a69125d5dfcb7b8c2659029395bdf
# 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf
`)}
${call('deep', `<p>为什么从公钥推不出私钥？椭圆曲线上的“k × G”是把点 G 自己加 k 次（用倍加法，只需约 256 步）。反过来，已知 K 和 G 求 k，叫<strong>椭圆曲线离散对数问题（ECDLP）</strong>，已知最好的经典算法也需要约 2¹²⁸ 步。比特币用同一条曲线，但地址算法不同（SHA-256 后再 RIPEMD-160，并用 Base58 或 Bech32 编码）。</p>`)}

<h2>4. 数字签名：签名与验证流程</h2>
${mm('签名与验证的完整流程', `
sequenceDiagram
  participant A as Alice 钱包（持有私钥）
  participant N as 网络节点
  participant B as 任何验证者
  A->>A: 1. 构造交易（to、value、nonce、gas）
  A->>A: 2. 计算交易哈希 z = Keccak-256(交易编码)
  A->>A: 3. 生成随机数 k，用私钥算出签名（r, s, v）
  A->>N: 4. 广播 交易 + 签名
  N->>N: 5. 用（z, r, s, v）恢复公钥，算出地址
  N->>N: 6. 恢复出的地址 等于 from 吗
  N-->>B: 7. 验证通过则进入内存池
  B->>B: 任何人可重复第 5 到 6 步，结果相同
`, [
  ['flow', '私钥只在第 3 步使用，且只在钱包内部。网络上传播的只有交易和签名（r, s, v）。'],
  ['key', '以太坊交易里没有写“发送方公钥”。节点用 ecrecover 从签名恢复公钥，再算地址。这就是 v 值的用途。'],
  ['fail', '如果交易任何字段被改动，哈希 z 改变，恢复出的地址变成另一个随机地址，验证失败。'],
  ['risk', '第 3 步的随机数 k 必须每次都不同且不可预测。k 重复或可预测会直接泄露私钥。']
])}
<p>签名保证三件事：</p>
${tbl(['保证', '含义', '如果没有它'], [
  ['身份认证（Authentication）', '签名只能由私钥持有者生成', '任何人都能冒充你转账'],
  ['完整性（Integrity）', '签名绑定了消息哈希，消息改一个字节签名就失效', '中间人可以把“转 1 ETH”改成“转 100 ETH”'],
  ['不可抵赖（Non-repudiation）', '签名者事后无法否认签过这条消息', '对方可以说“这笔不是我发的”']
])}
<p>先做什么：下面的实验已经替 Alice 签好一条消息。观察什么：分别点击“篡改消息”“篡改签名”“用错误公钥验证”，看 Bob 端的计算在哪一步对不上。</p>
${lab('sigtoy')}
<p><strong>算一算（示例，玩具 RSA）</strong>：p = 61，q = 53，n = 3233，公钥指数 e = 17，私钥 d = 2753。</p>
${steps([
  '假设消息哈希取模后 h = 65。',
  '签名：s = h^d mod n = 65²⁷⁵³ mod 3233 = 588。',
  '验证：s^e mod n = 588¹⁷ mod 3233 = 65。等于 h，验证通过。',
  '如果消息被改，h 变成别的数（例如 66），而 588¹⁷ mod 3233 仍然是 65，65 ≠ 66，验证失败。'
])}
${code('GO', `
package main

import (
	"fmt"

	"github.com/ethereum/go-ethereum/crypto" // go get github.com/ethereum/go-ethereum
)

func main() {
	// 1. 生成私钥（内部使用操作系统的安全随机数）
	key, _ := crypto.GenerateKey()
	addr := crypto.PubkeyToAddress(key.PublicKey) // Keccak-256(公钥) 后 20 字节
	fmt.Println("地址:", addr.Hex())               // Hex() 输出 EIP-55 校验和格式

	// 2. 对消息哈希签名，返回 65 字节：r(32) + s(32) + v(1)
	hash := crypto.Keccak256Hash([]byte("Alice 同意支付 Bob 10 ETH"))
	sig, _ := crypto.Sign(hash.Bytes(), key)

	// 3. 验证：从签名恢复公钥，再比较地址
	pub, _ := crypto.SigToPub(hash.Bytes(), sig)
	fmt.Println("恢复地址一致:", crypto.PubkeyToAddress(*pub) == addr) // true

	// 4. 篡改消息后再恢复：得到另一个无关地址
	bad := crypto.Keccak256Hash([]byte("Alice 同意支付 Bob 100 ETH"))
	pub2, _ := crypto.SigToPub(bad.Bytes(), sig)
	fmt.Println("篡改后一致:", crypto.PubkeyToAddress(*pub2) == addr) // false
}
`)}
<p>签名还有一个“交互版”：Schnorr 身份识别协议，它是理解零知识证明的入门例子，见 <a href="#m10-1">M07.1 零知识证明直觉</a>。</p>

<h2>5. 随机数重用：索尼 PS3 案例</h2>
<p>ECDSA 签名公式（简化）：r 来自随机点 k × G 的 x 坐标；s = k⁻¹ × (z + r × d) mod n，其中 d 是私钥，z 是消息哈希。</p>
<p>如果两条不同消息 z₁、z₂ 用了<strong>同一个 k</strong>，那么 r 相同，攻击者有两个方程、两个未知数：</p>
${steps([
  's₁ − s₂ = k⁻¹ × (z₁ − z₂)，所以 k = (z₁ − z₂) / (s₁ − s₂) mod n。',
  '求出 k 后，代入任意一条：d = (s₁ × k − z₁) / r mod n。',
  '私钥 d 被算出，攻击者可以签任何交易。'
])}
${mm('随机数 k 重用导致私钥泄露', `
flowchart LR
  M1["消息 1 签名<br/>(r, s₁)"] --> SAME{"两次签名 r 相同？"}
  M2["消息 2 签名<br/>(r, s₂)"] --> SAME
  SAME -->|"是：k 被重用"| K["解出 k"]
  K --> D["解出私钥 d"]
  D --> X["攻击者完全控制资产"]
  SAME -->|"否"| OK["无法求解"]
`, [
  ['flow', '攻击者只需要两条公开的签名，链上任何人都能拿到。'],
  ['risk', '2010 年底，fail0verflow 团队在 27C3 大会上公布：索尼 PS3 的固件签名每次使用相同的 k，因此算出了索尼的签名私钥。' + cite('27C3 演讲：Console Hacking 2010 - PS3 Epic Fail', 'https://media.ccc.de/v/27c3-4087-en-console_hacking_2010') + '2013 年 8 月，安卓系统随机数组件（SecureRandom）的缺陷导致比特币钱包签名出现重复 k，有资金被盗。' + cite('bitcoin.org 安全公告（2013-08-11）', 'https://bitcoin.org/en/alert/2013-08-11-android')],
  ['key', '现代库使用 RFC 6979 确定性 k：k 由私钥和消息哈希推导，同一消息得到同一 k，不同消息得到不同 k，不依赖随机数质量。'],
  ['limit', '自己手写签名算法几乎一定会出错。生产系统只用经过审计的库（go-ethereum、libsecp256k1、viem、ethers）。']
])}

<h2>6. 工程层：生产环境中的私钥与签名</h2>
${tbl(['方案', '私钥在哪里', '适用场景', '主要风险'], [
  ['浏览器钱包', '本地加密存储（密码解锁）', '个人日常小额', '恶意插件、钓鱼签名'],
  ['硬件钱包', '专用安全芯片，私钥不出设备', '个人大额', '盲签、供应链篡改'],
  ['服务器 keystore 文件', '服务器磁盘（加密）', '测试环境', '服务器被入侵即失窃'],
  ['云 KMS / HSM', '硬件安全模块，只暴露签名接口', '企业热钱包', '权限配置错误、接口被滥用'],
  ['MPC / 多签', '私钥分片或多把私钥', '交易所、托管机构', '实现复杂；详见 <a href="#m03">M08</a>']
])}
${call('warn', `<p>永远不要把私钥写进代码、提交到 Git、贴到聊天工具或发给 AI 助手。公开仓库里泄露的私钥，通常会在几分钟内被自动化机器人扫描并盗空。</p>`)}
${tryit(`<p>在 Remix 或本机体验“签名 → 恢复地址”（只用测试私钥）：</p>
<ol><li>安装 Foundry 后运行 <code>cast wallet new</code>，得到一个新地址和私钥（只用于练习）。</li><li>运行 <code>cast wallet sign --private-key &lt;私钥&gt; "hello"</code>，得到 65 字节签名。</li><li>运行 <code>cast wallet verify --address &lt;地址&gt; "hello" &lt;签名&gt;</code>，预期提示验证成功。</li><li>把消息改成 "hello!" 再验证，预期验证失败。</li></ol>`)}

${mistakes([
  ['地址就是公钥', '以太坊地址是 Keccak-256(公钥) 的后 20 字节，是公钥的指纹。'],
  ['区块链交易是加密传输的', '交易内容公开可见。签名只保证身份和完整性，不保证保密。'],
  ['地址大小写写错会转到别的地址', '地址本质上不区分大小写；EIP-55 的大小写只是校验和，钱包用它发现输错。'],
  ['签名算法用的随机数质量无所谓', '随机数 k 重复或可预测会直接泄露私钥（PS3 案例）。'],
  ['自己用一句话生成私钥更好记', '脑钱包熵太低，会被机器人穷举盗空。私钥必须来自安全随机数。']
])}
${recap([
  '非对称密码学：私钥签名，公钥验证；区块链主要用签名，不用加密。',
  '以太坊：私钥（32 字节）→ secp256k1 → 公钥（64 字节）→ Keccak-256 后 20 字节 → 地址 → EIP-55 校验和。',
  '每一步都是单向的，地址无法反推私钥。',
  '签名保证身份、完整性、不可抵赖；节点用 ecrecover 从签名恢复地址并比对 from。',
  'ECDSA 的随机数 k 重用会泄露私钥；生产中使用 RFC 6979 和经过审计的库。'
])}
${quiz([
  { q: '以太坊地址是怎么得到的？', o: ['私钥直接取前 20 字节', '公钥的 SHA-256 取前 20 字节', '公钥的 Keccak-256 取后 20 字节', '随机生成，与私钥无关'], a: 2, why: '以太坊地址 = Keccak-256(64 字节公钥) 的后 20 字节。' },
  { q: 'Bob 收到 Alice 签名的消息，但消息中一个字被改了。验证结果会怎样？', o: ['验证通过，签名和内容无关', '验证失败，因为消息哈希变了', '验证通过，但金额变了', '要看 Alice 是否在线'], a: 1, why: '签名绑定的是消息哈希。消息改动后哈希改变，验证失败。这是完整性保证。' },
  { q: '为什么同一个私钥用相同随机数 k 签两条消息很危险？', o: ['手续费翻倍', '交易会被拒绝', '地址会改变', '攻击者可以联立方程解出私钥'], a: 3, why: '两个签名 r 相同，攻击者能先解出 k，再解出私钥 d。索尼 PS3 就是这样被攻破的。' },
  { q: 'EIP-55 校验和地址的作用是什么？', o: ['发现手动输入或复制时的字符错误', '加密地址，防止别人看到', '让地址更短', '防止地址投毒攻击'], a: 0, why: 'EIP-55 用大小写编码一个校验和，能发现输错的字符。它不能防止攻击者构造“前后几位相同”的假地址。' }
])}
${exercises([["思考题：以太坊交易里没有写发送方的公钥。节点怎样确认这笔交易确实是 from 地址发的？", "<p>节点先算出交易哈希 z。然后用 ecrecover 从 (z, r, s, v) 恢复出公钥。再对公钥做 Keccak-256，取后 20 字节得到地址。恢复出的地址等于 from，验证才通过。交易任何字段被改，z 会变，恢复出的是另一个随机地址。</p>"], ["计算题（示例）：一个小写地址里有一段连续字符 “e5f”。EIP-55 哈希在这三个位置上的十六进制数依次是 8、c、2。校验和格式下，这三个字符应该写成什么？", "<p>规则：地址字符是字母，且哈希同一位置的数 ≥ 8，就把字母大写。e 对应 8，8 ≥ 8，写成 E。5 是数字，不变。f 对应 2，2 &lt; 8，保持小写。结果是 <code>E5f</code>。</p>"], ["设计题：一家公司要为热钱包服务选择私钥存放方式。生产环境不能用服务器上的 keystore 文件。请给出一个方案，并说出它的主要风险。", "<p>选云 KMS 或 HSM（硬件安全模块）。私钥留在硬件里，服务只能调用签名接口，拿不到私钥本身。主要风险是权限配置错误和签名接口被滥用。大额资产再加多签或 MPC。私钥绝不写进代码、Git 或聊天工具。</p>"]])}
${checklist(["能写出“私钥 → 公钥 → 地址 → EIP-55”每一步用到的算法和数据长度。", "做过用 cast 从私钥 1 推出地址，并核对校验和格式。", "能说出签名保证的三件事，并说明签名不提供保密性。", "能解释随机数 k 重用时，攻击者怎样联立方程求出私钥。", "能按场景在浏览器钱包、硬件钱包、KMS/HSM、多签之间选择私钥存放方式。"])}
${terms([
  ['非对称加密', 'Asymmetric Cryptography', '使用一对公钥和私钥的密码学体系'],
  ['公钥', 'Public Key', '由私钥推导、可公开的密钥，用于验证签名'],
  ['secp256k1', 'secp256k1', '比特币和以太坊使用的椭圆曲线'],
  ['数字签名', 'Digital Signature', '用私钥对消息哈希生成的证明，公钥可验证'],
  ['ECDSA', 'Elliptic Curve Digital Signature Algorithm', '基于椭圆曲线的数字签名算法'],
  ['EIP-55', 'EIP-55 Checksum', '用字母大小写编码校验和的以太坊地址格式'],
  ['ecrecover', 'ecrecover', '从消息哈希和签名恢复签名者地址的操作'],
  ['不可抵赖', 'Non-repudiation', '签名者事后不能否认签过某消息'],
  ['RFC 6979', 'RFC 6979', '由私钥和消息确定性生成签名随机数 k 的标准']
])}
` });

})();
