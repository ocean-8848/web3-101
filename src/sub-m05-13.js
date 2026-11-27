/* ---------- M06 多链生态（Solana 与 Rust）：m05-75 Rust 快速入门 ---------- */
(() => {
CUR = 'm05-75';
addCh({ id: 'm05-75', nav: 'Rust 快速入门', title: 'M06.5 Rust 快速入门：写 Solana 程序需要的全部基础', desc: '工具链与版本配对、所有权与借用、溢出安全的金额计算、Anchor 宏与 Borsh 空间计算，代码都能直接运行。', html: `
<h1>M06.5 Rust 快速入门：写 Solana 程序需要的全部基础</h1>
${meta(['装好 rustup、cargo、Solana CLI 与 Anchor，并避开版本不配对的坑；掌握变量、整数、结构体、枚举、match、Option 与 Result。', '读懂所有权、借用和生命周期，能看懂 <code>&amp;mut ctx.accounts.x</code> 与 <code>Context&lt;Initialize&gt;</code>、<code>Account&lt;&#39;info, T&gt;</code>，并修好常见的借用检查报错。', '说清 <code>#[program]</code>、<code>#[account]</code>、<code>#[derive(Accounts)]</code>、<code>#[error_code]</code> 各自生成了什么；会算 Borsh 账户空间，会用 checked 运算和 cargo test 写安全的金额计算。'], '<a href="#m01-6">M01.6 Go 快速入门</a>、<a href="#m02-2">M02.2 Solidity 基础 I</a>（会一点任意编程语言即可；M06.1–M06.4 比特币篇与本篇无依赖）')}
${beginner(`<p><strong>crate</strong>：Rust 的编译单位和发布单位，相当于 Go 的 module。一个 crate 编译成一个库或一个可执行文件。第三方 crate 发布在 crates.io。</p>
<p><strong>cargo</strong>：Rust 官方的构建与包管理工具。建项目、加依赖、编译、测试都用它，相当于 <code>go</code> 命令。</p>
<p><strong>所有权（ownership）</strong>：Rust 管理内存的规则。每个值只有一个“主人”变量；主人离开作用域，值就被释放。Rust 没有垃圾回收（GC）。</p>
<p><strong>借用（borrow）/ 引用（reference）</strong>：不拿走所有权，只临时使用一个值。<code>&amp;x</code> 是只读借用，<code>&amp;mut x</code> 是可写借用。</p>
<p><strong>trait</strong>：一组方法签名，相当于 Go 的 interface，但必须显式写 <code>impl Trait for Type</code>。</p>
<p><strong>宏（macro）</strong>：在编译期生成代码的代码。名字后面带 <code>!</code>（如 <code>println!</code>）或写成属性 <code>#[...]</code>。Anchor 的 <code>#[program]</code>、<code>#[account]</code> 都是宏。</p>`)}

<h2>1. 一句话理解</h2>
${one('Rust = 编译期检查内存和并发安全（所有权 + 借用检查器）+ 没有 GC 的性能 + 强大的宏。Solana 程序要在资源很紧的虚拟机里运行，又直接管理用户资产，所以官方选 Rust；Anchor 框架再用宏把账户校验和序列化代码替你生成出来。')}
${call('analogy', `<p>Go 的编译器像一个宽松的门卫：语法对就放行，内存问题交给运行时的 GC。Rust 的编译器像一个严格的仓库管理员：每件物品（值）只能登记在一个人名下；借出去时登记“只读借给多人”或“可写只借一人”；借条到期前，原主人不能乱动。手续繁琐，但仓库从不丢东西、不会两个人同时改一份账。</p>
<p><strong>类比的局限</strong>：管理员只管“内存”这一种安全。整数溢出、权限漏检、舍入方向这类业务错误，编译器不会替你发现，后面第 4 节和第 10 节专门讲。</p>`)}
${art('一图看懂：你写的 Rust + Anchor 宏，编译成链上程序和 IDL', 660, 336, [
  S.zone(10, 28, 200, 252, { t: '你写的代码（lib.rs）' }),
  S.box(20, 56, 180, 44, { k: 'tint', mono: 1, t: '#[program]', s: '指令函数' }),
  S.box(20, 112, 180, 44, { k: 'tint', mono: 1, t: '#[derive(Accounts)]', s: '账户约束' }),
  S.box(20, 168, 180, 44, { k: 'tint', mono: 1, t: '#[account]', s: '账户里存的数据' }),
  S.box(20, 224, 180, 44, { k: 'tint', mono: 1, t: '#[error_code]', s: '自定义错误' }),
  S.box(236, 112, 132, 96, { k: 'key', t: '宏展开', s: '生成分发、校验\n序列化、错误码' }),
  S.box(392, 112, 124, 96, { k: 'warn', t: 'rustc 编译', s: '类型检查\n借用检查\n目标 SBF' }),
  S.box(540, 68, 110, 72, { k: 'ok', t: '程序 .so', s: '部署到链上' }),
  S.box(540, 180, 110, 72, { k: 'info', t: 'IDL JSON', s: '客户端据此调用' }),
  S.arrow(212, 160, 234, 160),
  S.arrow(370, 160, 390, 160),
  S.arrow(518, 150, 538, 112),
  S.arrow(518, 170, 538, 214),
  S.text(330, 306, '宏在编译期生成看不见但真实存在的 Rust 代码；编译器检查的是展开后的全部代码', { size: 13, anchor: 'middle', mw: 620 }),
  S.text(330, 326, '借用检查和类型检查通过，才会产出 .so；没通过就没有程序可部署', { size: 12, dim: 1, anchor: 'middle', mw: 620 })
], [
  ['flow', '左边四个带 # 的属性都是宏。编译时它们先展开成普通 Rust 代码，再和你的业务代码一起交给 rustc 编译。'],
  ['key', '产物有两个：部署到链上的 .so 程序文件，和给客户端用的 IDL（作用类似以太坊的 ABI）。'],
  ['fail', '宏展开后的代码报错时，错误位置会指向宏所在的行。看不懂时用 <code>cargo expand</code> 查看展开结果。'],
  ['limit', '编译器只保证内存安全和类型正确，不保证业务逻辑正确：账户约束少写一条，照样能编译通过。']
], '左侧是你写的四类 Anchor 宏代码，经宏展开和 rustc 编译，产出链上程序 .so 文件和客户端用的 IDL', 'm05-75')}

<h2>2. 工具链：rustup、cargo、Solana CLI 与 Anchor 版本配对</h2>
<p>Go 只有一个 <code>go</code> 命令。Rust 的 Solana 开发要装四样东西，并且它们的版本要互相配对：</p>
${tbl(['工具', '作用', '对照 Go / Solidity'], [
  ['<code>rustup</code>', '安装和切换 Rust 编译器版本（stable、指定版本）', '类似用 brew / gvm 管理多个 Go 版本'],
  ['<code>cargo</code>', '建项目、管依赖、编译、测试、格式化、静态检查', '<code>go mod</code> + <code>go build</code> + <code>go test</code> + <code>go vet</code>'],
  ['Solana CLI（Agave）', '钱包、本地验证节点、部署；自带 <code>cargo build-sbf</code> 和 platform-tools（一套专门编译到 Solana 虚拟机的 Rust 编译器）', '类似 Foundry 里的 anvil + cast'],
  ['Anchor CLI（用 <code>avm</code> 管理版本）', '在 cargo 之上封装：建 Anchor 项目、编译、生成 IDL、跑测试、部署', '类似 Foundry 的 forge']
])}
${code('BASH', `
# 1. 安装 Rust（rustup 会同时装好 cargo、rustfmt、clippy）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version && cargo --version

# 2. 安装 Solana CLI（Anza 发布的 Agave 版本；安装命令以 Solana 官方文档为准）
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana --version

# 3. 用 avm（Anchor Version Manager）安装并固定 Anchor 版本（版本号是示例）
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.31.1 && avm use 0.31.1
anchor --version

# 4. 不用 Anchor 的纯 Rust 练习项目
cargo new rustintro          # 可执行项目：src/main.rs
cargo new --lib token_math   # 库项目：src/lib.rs
cd rustintro && cargo run
`)}
${steps([
  '日常命令：<code>cargo run</code> 运行；<code>cargo build --release</code> 优化编译；<code>cargo test</code> 测试；<code>cargo fmt</code> 格式化；<code>cargo clippy</code> 静态检查；<code>cargo add 包名</code> 加依赖。',
  '依赖写在 <code>Cargo.toml</code>，精确版本锁在 <code>Cargo.lock</code>。程序项目要提交 <code>Cargo.lock</code>，作用和 Go 的 <code>go.sum</code> 一样：任何机器编译出同样的依赖。',
  'Anchor 项目：<code>anchor init 项目名</code> 建项目，<code>anchor build</code> 编译，<code>anchor test</code> 本地测试，<code>anchor deploy</code> 部署（详见 <a href="#m05-12">M06.7 Solana 动手</a>）。',
  '在项目根目录的 <code>Anchor.toml</code> 里写死版本，让团队和 CI 用同一套工具（见下方配置）。'
])}
${code('TOML', `
# Anchor.toml（节选）：把工具版本写进仓库，版本号仅为示例
[toolchain]
anchor_version = "0.31.1"   # anchor 命令会按这里切换 avm 版本
solana_version = "2.1.0"    # 与该 Anchor 版本配套测试过的 Solana CLI

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"
`)}
${call('warn', `<p><strong>版本不配对是新手第一大坑。</strong>Anchor 的每个版本都对应一段 Solana CLI 版本和 Rust 版本。例如（截至撰写时的示例，<strong>以 Anchor 官方 release notes 为准</strong>）：Anchor 0.30.x 配 Solana 1.18.x；Anchor 0.31.x 配 Solana（Agave）2.1.x。版本不配对时，常见现象是：<code>anchor build</code> 报 <code>cargo build-sbf</code> 找不到、依赖解析失败、某个 crate 要求更新的 rustc；或者 <code>Cargo.toml</code> 里 <code>anchor-lang</code> 的版本和 CLI 版本不一致，导致生成的 IDL 客户端读不了。排查顺序：① <code>anchor --version</code>、<code>solana --version</code>、<code>rustc --version</code> 三个都打印出来；② 和 <code>Anchor.toml</code>、<code>Cargo.toml</code> 里写的版本对照；③ 查官方的版本对照说明后统一升级或降级。</p>`)}
${mm('从源码到链上程序：一次 anchor build / test / deploy 做了什么', `
flowchart LR
  SRC["lib.rs 等源码<br/>带 Anchor 宏"] --> EXP["宏展开<br/>生成校验和序列化代码"]
  EXP --> SBF["cargo build-sbf<br/>platform-tools 编译"]
  EXP --> IDLB["IDL 生成<br/>用本机 rustup 工具链"]
  SBF --> SO["target/deploy/名字.so<br/>和程序密钥对"]
  IDLB --> IDL["target/idl/名字.json<br/>target/types/名字.ts"]
  SO --> T["anchor test<br/>本地验证节点"]
  IDL --> T
  T -->|"通过"| DEP["anchor deploy<br/>写入程序账户"]
  T -->|"失败"| FIX["改代码后重来"]
  SBF -->|"版本不配对"| VER["编译失败<br/>核对三个版本号"]
`, [
  ['flow', '一份源码走两条路：编译成链上执行的 .so，同时生成 IDL 和 TypeScript 类型给客户端用。'],
  ['key', '链上程序由 Solana 的 platform-tools 编译；IDL 生成和 <code>cargo test</code> 用你本机 rustup 装的编译器。两套编译器版本不同，是很多“本机能测、build 报错”问题的根源。'],
  ['fail', '版本不配对时，失败通常出现在 cargo build-sbf 这一步，报错信息往往指向某个依赖 crate，而不是你的代码。'],
  ['limit', '本地验证节点测试通过，不代表 devnet / 主网行为一致：计算单元预算、账户大小上限和真实 RPC 限流只有在真实网络上才完全暴露。']
])}

<h2>3. 基本语法：变量、整数、结构体、枚举、match、Option 与 Result</h2>
<p>下面是一个完整的 <code>src/main.rs</code>。它用一个“金库存取款”的例子展示 Solana 程序会用到的全部基础语法，可以直接 <code>cargo run</code>。</p>
${code('RUST', `
// 一个文件演示 Solana 程序会用到的全部基础语法：cargo run 直接运行
use std::collections::HashMap;
use std::fmt;

// 结构体 + derive：自动生成打印（Debug）、复制（Clone）、比较（PartialEq）
#[derive(Debug, Clone, PartialEq)]
struct Vault {
    owner: String,
    balance: u64, // 链上金额：无符号 64 位整数，和 SPL Token 一致
    paused: bool,
}

// 枚举：每个变体可以带不同的数据（Solidity 的 enum 做不到）
#[derive(Debug)]
enum Instruction {
    Deposit { amount: u64 },
    Withdraw { amount: u64 },
    Pause,
}

// 自定义错误枚举
#[derive(Debug, PartialEq)]
enum VaultError {
    Paused,
    Overflow,
    InsufficientFunds,
}

// trait 实现：让 VaultError 可以用 {} 打印
impl fmt::Display for VaultError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            VaultError::Paused => write!(f, "vault is paused"),
            VaultError::Overflow => write!(f, "math overflow"),
            VaultError::InsufficientFunds => write!(f, "insufficient funds"),
        }
    }
}

// impl 块：给 Vault 定义方法
impl Vault {
    // 关联函数（没有 self），相当于构造函数
    fn new(owner: &str) -> Self {
        Vault { owner: owner.to_string(), balance: 0, paused: false }
    }

    // &mut self：要修改自己；返回 Result
    fn apply(&mut self, ix: &Instruction) -> Result<u64, VaultError> {
        if self.paused {
            return Err(VaultError::Paused);
        }
        match ix {
            // match 必须覆盖所有变体，漏一个就编译不过
            Instruction::Deposit { amount } => {
                self.balance = self.balance.checked_add(*amount).ok_or(VaultError::Overflow)?;
            }
            Instruction::Withdraw { amount } => {
                self.balance = self
                    .balance
                    .checked_sub(*amount)
                    .ok_or(VaultError::InsufficientFunds)?;
            }
            Instruction::Pause => self.paused = true,
        }
        Ok(self.balance)
    }
}

// Option：可能没有值。'a 是生命周期标注：返回的引用不能比 vaults 活得更久
fn find_vault<'a>(vaults: &'a HashMap<String, Vault>, owner: &str) -> Option<&'a Vault> {
    vaults.get(owner)
}

fn main() {
    // 1. 变量默认不可变，要改必须写 mut
    let decimals: u8 = 6;
    let mut v = Vault::new("alice");

    // 2. 枚举 + match + Result
    let ixs = vec![
        Instruction::Deposit { amount: 5_000_000 },
        Instruction::Withdraw { amount: 7_000_000 }, // 余额不足
        Instruction::Pause,
        Instruction::Deposit { amount: 1 }, // 已暂停
    ];
    for ix in &ixs {
        match v.apply(ix) {
            Ok(bal) => println!("{:?} -> balance {}", ix, bal),
            Err(e) => println!("{:?} -> error: {}", ix, e),
        }
    }

    // 3. 整数溢出：checked / wrapping / saturating 三种显式写法
    let max = u64::MAX;
    println!("checked_add  = {:?}", max.checked_add(1)); // None
    println!("wrapping_add = {}", max.wrapping_add(1)); // 0
    println!("saturating   = {}", max.saturating_add(1)); // 18446744073709551615

    // 4. as 转换会静默截断
    let big: u128 = 300;
    println!("300 as u8 = {}", big as u8); // 44
    println!("u8::try_from(300) = {:?}", u8::try_from(big)); // Err(..)

    // 5. 所有权：String 赋值是移动（move），之后原变量不能再用
    let a = String::from("alice");
    let b = a.clone(); // 想保留 a，就显式 clone
    let mut vaults = HashMap::new();
    vaults.insert(a, v.clone()); // a 被移动进 map
    // println!("{}", a);        // 再用 a 会报 E0382: borrow of moved value
    println!("found: {:?}", find_vault(&vaults, &b).map(|x| x.balance));
    println!("missing: {:?}", find_vault(&vaults, "bob"));

    // 6. 借用：同一时刻可以有多个 &，或者只有一个 &mut
    let r1 = &v;
    let r2 = &v;
    println!("two shared refs: {} {}", r1.balance, r2.balance);
    let w = &mut v; // r1、r2 之后不再使用，所以这里合法
    w.paused = false;
    println!("unpaused, decimals = {}", decimals);
}
`)}
<p>运行结果（前四行）：<code>Deposit { amount: 5000000 } -&gt; balance 5000000</code>、<code>Withdraw { amount: 7000000 } -&gt; error: insufficient funds</code>、<code>Pause -&gt; balance 5000000</code>、<code>Deposit { amount: 1 } -&gt; error: vault is paused</code>。</p>
${tbl(['语法点', 'Rust 写法', '对照 Go / Solidity', '要点'], [
  ['变量', '<code>let x = 1;</code> / <code>let mut x = 1;</code>', 'Go 的 <code>x := 1</code> 默认可改', 'Rust 默认<strong>不可变</strong>，要改必须写 <code>mut</code>；改不可变变量报 E0384'],
  ['整数', '<code>u8 u16 u32 u64 u128</code>、<code>i64</code>、<code>usize</code>', 'Solidity 有 <code>uint256</code>；Go 用 <code>*big.Int</code>', 'Rust 没有内置 256 位整数。SPL Token 金额是 <code>u64</code>，中间计算用 <code>u128</code>'],
  ['结构体与方法', '<code>struct</code> + <code>impl</code> 块', 'Go 的 struct + 方法接收者', '<code>&amp;self</code> 只读，<code>&amp;mut self</code> 可写，<code>self</code> 拿走所有权'],
  ['枚举', '<code>enum Ix { Deposit { amount: u64 }, Pause }</code>', 'Solidity enum 只是整数', 'Rust 枚举的每个变体可以带数据，Anchor 的指令参数、错误码都靠它'],
  ['match', '<code>match x { A =&gt; …, B =&gt; … }</code>', 'Go 的 switch', '必须穷尽所有情况，漏一个变体就编译失败'],
  ['Option', '<code>Some(v)</code> / <code>None</code>', 'Go 的 <code>v, ok := m[k]</code>', '没有 null。<code>checked_add</code> 溢出时返回 <code>None</code>'],
  ['Result 与 ?', '<code>Ok(v)</code> / <code>Err(e)</code>，<code>f()?</code>', 'Go 的 <code>if err != nil { return err }</code>', '<code>?</code> 遇到 Err 立刻向上返回，并按 <code>From</code> 自动转换错误类型'],
  ['错误终止', '<code>panic!</code>、<code>unwrap()</code>', 'Solidity 的 <code>revert</code>', '链上程序里 panic 会让整笔交易失败，但没有可读的错误码，见第 10 节']
])}
${call('info', `<p><strong><code>?</code> 运算符的两种用法</strong>：① 用在 <code>Result</code> 上：<code>Err(e)</code> 时立刻返回 <code>Err(From::from(e))</code>。② 用在 <code>Option</code> 上：<code>None</code> 时立刻返回 <code>None</code>。Option 不能直接在返回 Result 的函数里用 <code>?</code>，要先用 <code>.ok_or(错误)</code> 转成 Result。所以 Anchor 代码里到处是 <code>x.checked_add(y).ok_or(MyError::Overflow)?</code> 这种写法。</p>`)}

<h2>4. 整数溢出：为什么代币金额必须用 checked 运算</h2>
<p>Solidity 0.8 以后，加减乘溢出会自动 revert。Rust 不一样：<strong>debug 编译时溢出会 panic，release 编译时默认静默回绕（wrap）</strong>，除非在 <code>Cargo.toml</code> 里打开 <code>overflow-checks</code>。链上部署的是 release 版本。</p>
${code('TOML', `
# 工作区根目录 Cargo.toml。anchor init 生成的模板默认带这一段：release 版也检查溢出
[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
`)}
<p><strong>算一算（示例）</strong></p>
${steps([
  '<code>u64::MAX</code> = 18,446,744,073,709,551,615 ≈ 1.84 × 10<sup>19</sup>。',
  '一个 9 位小数的代币（SOL 本身也是 9 位：1 SOL = 10<sup>9</sup> lamports）。<code>u64</code> 最多表示 1.84 × 10<sup>19</sup> ÷ 10<sup>9</sup> ≈ 184 亿枚。总量 200 亿枚、9 位小数的代币，总量本身就放不进 <code>u64</code>。',
  '计算价值：数量 5,000 枚 = 5 × 10<sup>12</sup> 最小单位，价格 4.000000 用 6 位精度存成 4,000,000。两者相乘 = 2 × 10<sup>19</sup>，<strong>超过 u64::MAX</strong>。',
  '如果用 <code>wrapping</code> 语义，结果变成 2 × 10<sup>19</sup> − 2<sup>64</sup> = 1,553,255,926,290,448,384，一个看起来正常、实际完全错误的数。',
  '正确做法：先转成 <code>u128</code>（最大约 3.4 × 10<sup>38</sup>）再相乘，除以 10<sup>6</sup> 得到 2 × 10<sup>13</sup>，最后用 <code>u64::try_from</code> 安全转回 <code>u64</code>。'
])}
${tbl(['写法', '溢出时的结果', '什么时候用'], [
  ['<code>a + b</code>', '取决于编译配置：panic 或静默回绕', '链上金额计算里<strong>不要用</strong>'],
  ['<code>a.checked_add(b)</code>', '返回 <code>None</code>，你决定返回哪个错误', '<strong>默认选择</strong>：余额、份额、手续费'],
  ['<code>a.saturating_sub(b)</code> / <code>saturating_add</code>', '减法停在 0，加法停在 MAX', '只用于显示或统计；用在余额上会把“余额不足”藏成 0'],
  ['<code>a.wrapping_add(b)</code>', '按 2<sup>64</sup> 取模回绕', '只用于哈希、计数器回绕等明确需要模运算的场景'],
  ['<code>u64::try_from(x)</code>', '超出范围返回 <code>Err</code>', '从 <code>u128</code> / <code>i64</code> 转回 <code>u64</code>'],
  ['<code>x as u64</code>', '<strong>静默截断</strong>高位；负数变成巨大的正数', '只用于“一定不会越界”的扩宽转换，例如 <code>u32 as u64</code>']
])}
${call('warn', `<p><strong>溢出会直接丢钱。</strong>2018 年以太坊上的 BEC 代币事件就是乘法溢出：攻击者让 <code>数量 × 人数</code> 回绕成一个很小的数，通过余额检查后给自己转出了天量代币。Rust 程序里，一个没检查的 <code>amount * price</code> 或一个 <code>as u64</code> 截断，可以造成同样的后果。规则：<strong>链上金额只用 checked 系列运算；中间结果用 u128；转回 u64 用 try_from。</strong></p>`)}

<h2>5. 所有权、借用与生命周期：读懂 &amp;mut 和 Context&lt;&#39;info&gt;</h2>
<p>Go 有 GC：变量随便复制指针，没人用了运行时回收。Rust 没有 GC，靠三条规则在编译期决定什么时候释放内存：</p>
${steps([
  '每个值有且只有一个所有者（owner）。',
  '所有者离开作用域时，值被释放（drop）。',
  '把值赋给别的变量或传给函数，所有权就<strong>移动（move）</strong>了，原变量不能再用。<code>u64</code>、<code>bool</code>、<code>Pubkey</code> 这类实现了 <code>Copy</code> 的小类型例外：赋值是复制。'
])}
<p>不想交出所有权，就<strong>借用</strong>。借用规则只有一条：<strong>同一时刻，要么有任意多个只读引用 <code>&amp;T</code>，要么只有一个可写引用 <code>&amp;mut T</code>，二者不能同时存在。</strong>这条规则在编译期消灭了“一边读一边改”的数据竞争。</p>
${mm('一个值的去向：移动、只读借用、可写借用', `
flowchart TB
  V["let v = Vault::new()<br/>v 是所有者"] --> M["let w = v<br/>移动：所有权转给 w"]
  M --> MX["再用 v 报 E0382<br/>需要保留就 v.clone()"]:::risk
  V --> R["let r1 = 引用 v<br/>let r2 = 引用 v"]
  R --> RO["可以同时多个只读借用<br/>都不能修改 v"]:::ok
  V --> W["let w = 可写引用 v<br/>同一时刻只能有一个"]
  W --> WX["此时再借用 v<br/>报 E0499 或 E0502"]:::risk
  RO --> F1["最后一次使用后借用结束<br/>可以再做可写借用"]
  W --> F2["函数返回或作用域结束<br/>值被 drop，内存释放"]
`, [
  ['flow', '一个值要么被移动走，要么被借出去。借用在“最后一次使用”之后就结束（非词法生命周期），不必等到大括号结束。'],
  ['key', '只读借用可以多个，可写借用只能一个，两者不能重叠。这就是“借用检查器”检查的全部内容。'],
  ['fail', '最常见的报错：值移动后再用（E0382）、同时两个可写借用（E0499）、持有只读借用时又去修改（E0502）。'],
  ['limit', '借用规则只管“同一个程序内的内存”。Solana 账户数据在运行时用 RefCell 再检查一次：同一账户被重复可写借用，运行时报 AccountBorrowFailed。']
])}
<p><strong>生命周期（lifetime）</strong>是编译器给每个引用标注的“有效期”，写成 <code>&#39;a</code>、<code>&#39;info</code>。大多数时候编译器自动推断；当一个结构体里存的是引用时，必须显式写出来。这正是 Anchor 代码里 <code>&#39;info</code> 的来源：</p>
${code('RUST', `
// 摘自 M06.7 的计数器程序，逐行注释它用到的 Rust 特性
#[derive(Accounts)]                      // 宏：生成 try_accounts（反序列化 + 按约束校验）
pub struct Increment<'info> {            // 'info：本结构体里的引用，都指向本次交易的账户数据
    #[account(mut, seeds = [b"counter", authority.key().as_ref()], bump, has_one = authority)]
    pub counter: Account<'info, Counter>,  // 已校验 owner 和鉴别码、已反序列化的 Counter
    pub authority: Signer<'info>,          // 已校验签名的账户
}

pub fn increment(ctx: Context<Increment>) -> Result<()> {
    // ctx.accounts 的类型是 &mut Increment。这里对其中一个字段做可写借用
    let c = &mut ctx.accounts.counter;     // c: &mut Account<'info, Counter>
    // Account 实现了 Deref / DerefMut，所以 c.count 直接访问 Counter 的字段
    c.count = c.count.checked_add(1).ok_or(CounterError::Overflow)?;
    Ok(())                                 // 返回后 Anchor 调用 exit()，把 Counter 序列化写回账户
}
`)}
${tbl(['你在 Anchor 里看到的', '它在 Rust 里是什么', '读法'], [
  ['<code>Context&lt;Increment&gt;</code>', '泛型结构体 <code>Context&lt;&#39;a, &#39;b, &#39;c, &#39;info, T&gt;</code>，四个生命周期被省略', '“本次调用的上下文”：<code>program_id</code>、<code>accounts</code>、<code>remaining_accounts</code>、<code>bumps</code>'],
  ['<code>&#39;info</code>', '生命周期参数', '“这些引用都借自运行时传进来的同一块账户数据，指令执行期间有效”'],
  ['<code>Account&lt;&#39;info, Counter&gt;</code>', '包装了 <code>AccountInfo&lt;&#39;info&gt;</code> 和反序列化后的 <code>Counter</code>', '“一个 owner 是本程序、类型是 Counter 的账户”'],
  ['<code>&amp;mut ctx.accounts.counter</code>', '对字段的可写借用', '“我要修改这个账户”，对应约束里必须有 <code>mut</code>'],
  ['<code>ctx.accounts.user.key()</code>', '方法调用，返回 <code>Pubkey</code>（实现了 Copy）', '取地址，复制一份，不涉及借用冲突'],
  ['<code>Result&lt;()&gt;</code>', '<code>anchor_lang::Result</code>，即 <code>Result&lt;(), anchor_lang::error::Error&gt;</code>', '成功时不返回值；失败时返回 Anchor 错误']
])}
<p>新手最常碰到的编译错误，以及修法：</p>
${tbl(['错误码与信息', '典型触发代码', '修法'], [
  ['E0382 borrow of moved value', '<code>let t = s; println!("{}", s);</code>', '要两个都用就 <code>s.clone()</code>；只读就传 <code>&amp;s</code>'],
  ['E0499 cannot borrow as mutable more than once', '<code>let a = &amp;mut v; let b = &amp;mut v;</code> 然后都用', '把两段修改合并到一个借用里，或让第一个借用先结束'],
  ['E0502 cannot borrow as mutable because it is also borrowed as immutable', '<code>let first = &amp;list[0]; list.push(4); use(first);</code>', '先复制出需要的值（<code>let first = list[0];</code>），再修改'],
  ['E0308 mismatched types', '<code>let r: u128 = a * b;</code>（a、b 是 u64）', 'Rust 不会隐式转换：<code>u128::from(a) * u128::from(b)</code>'],
  ['E0106 missing lifetime specifier', '<code>pub struct Init { pub user: Signer }</code>', '结构体加 <code>&lt;&#39;info&gt;</code>，字段写 <code>Signer&lt;&#39;info&gt;</code>'],
  ['E0277 trait bound not satisfied', '把自定义结构体当指令参数，但没 derive 序列化', '加 <code>#[derive(AnchorSerialize, AnchorDeserialize)]</code>']
])}
${call('info', `<p><strong>Anchor 里一个典型的借用冲突</strong>：先写 <code>let vault = &amp;mut ctx.accounts.vault;</code>，再调用 <code>ctx.accounts.transfer_to_user()</code>（一个以 <code>&amp;self</code> 为接收者的方法）。第二行要借用整个 <code>ctx.accounts</code>，而第一行的可写借用还没结束，报 E0502。修法：先把需要的值（金额、bump）复制到局部变量，或者先做完 CPI 调用，再拿可写借用改 vault 字段。直接借用<strong>不同字段</strong>（<code>&amp;mut ctx.accounts.vault</code> 和 <code>&amp;ctx.accounts.user</code>）不冲突，编译器能区分。</p>`)}

<h2>6. trait、derive 与 Anchor 宏：它们生成了什么</h2>
<p><strong>trait</strong> 规定“一个类型能做什么”。和 Go interface 的区别：Go 是隐式实现（方法对上就算），Rust 必须显式写 <code>impl Trait for Type</code>，第 3 节的 <code>impl fmt::Display for VaultError</code> 就是一例。<strong>derive</strong> 是让编译器自动写出常见 trait 实现的宏：<code>#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]</code> 分别让类型可以 <code>{:?}</code> 打印、复制、用 <code>==</code> 比较、用 <code>T::default()</code> 得到零值。Anchor 的 <code>AnchorSerialize</code>、<code>AnchorDeserialize</code>、<code>InitSpace</code> 也是 derive 宏。</p>
<p>Anchor 的属性宏做的事情更多。下表列出每个宏<strong>展开后生成的代码</strong>，这是读懂 Anchor 报错和安全审计的关键：</p>
${tbl(['你写的', '宏展开后生成的（简化描述）', '你因此不用手写的'], [
  ['<code>declare_id!("…")</code>', '常量 <code>ID</code> 和函数 <code>id()</code>', '程序地址常量；Anchor 用它校验账户 owner'],
  ['<code>#[program] mod x</code>', '程序入口 <code>entrypoint</code>；按指令数据前 8 字节鉴别码（<code>sha256("global:函数名")</code> 前 8 字节）分发到对应函数；反序列化参数；构造 Context；函数返回后调用 exit', '手写 <code>process_instruction</code> 和 match 分发'],
  ['<code>#[derive(Accounts)]</code>', '<code>try_accounts</code>：逐个账户检查签名、owner、鉴别码、seeds、has_one 等约束并反序列化；<code>exit</code>：把可写账户序列化写回；生成 <code>ctx.bumps</code> 结构体', '几十行手写账户校验'],
  ['<code>#[account]</code>', 'Borsh 序列化与反序列化；8 字节鉴别码（<code>sha256("account:类型名")</code> 前 8 字节）；<code>Owner</code> 实现（owner 必须是本程序）', '类型混淆检查、读写账户数据'],
  ['<code>#[derive(InitSpace)]</code>', '常量 <code>INIT_SPACE</code>：按字段类型算出的字节数（不含 8 字节鉴别码）', '手算账户空间'],
  ['<code>#[error_code] enum</code>', '从 6000 开始编号的错误码；<code>#[msg]</code> 生成错误信息；实现到 <code>anchor_lang::error::Error</code> 的转换', '错误码定义和 <code>?</code> 转换'],
  ['<code>require!(cond, Err)</code>', '<code>if !cond { return Err(Err.into()); }</code>', '样板 if 判断']
])}
${mm('一条指令从进入程序到写回账户：宏生成的代码在哪里运行', `
sequenceDiagram
  participant RT as Solana 运行时
  participant EP as 入口与分发（program 宏）
  participant TA as try_accounts（Accounts 宏）
  participant H as 你写的指令函数
  participant EX as exit（Accounts 宏）
  RT->>EP: 程序 ID、账户列表、指令数据
  EP->>EP: 取前 8 字节鉴别码，找到 increment
  EP->>TA: 账户列表和参数
  TA->>TA: 校验签名、owner、鉴别码、seeds、has_one
  TA-->>RT: 任一约束失败，返回错误码，交易回滚
  TA->>H: 校验通过，构造 Context
  H->>H: checked_add 等业务逻辑
  H-->>RT: 返回 Err，交易回滚，账户不变
  H->>EX: 返回 Ok
  EX->>RT: 把 mut 账户序列化写回
`, [
  ['flow', '运行时只调用一个入口。分发、校验、写回都是宏生成的代码，你的函数只在中间一步运行。'],
  ['key', '约束检查在你的函数之前完成；数据写回在你的函数之后完成。函数体里修改的是内存里的结构体，返回 Ok 后才落到账户上。'],
  ['fail', '函数返回 Err 或 panic，整笔交易回滚，所有账户恢复原状。区别是 Err 带可读错误码，panic 没有。'],
  ['risk', '宏只校验你声明的约束。少写 <code>has_one</code> 或 <code>seeds</code>，宏不会报错，漏洞照样编译通过。']
])}
${code('RUST', `
// 自定义错误：#[error_code] 让每个变体变成一个从 6000 开始的错误码
#[error_code]
pub enum VaultError {
    #[msg("金额必须大于 0")]
    ZeroAmount,          // 6000 = 0x1770
    #[msg("数学运算溢出")]
    Overflow,            // 6001
    #[msg("余额不足")]
    InsufficientFunds,   // 6002
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, VaultError::ZeroAmount);              // 宏：条件不满足就返回错误
    let vault = &mut ctx.accounts.vault;
    vault.balance = vault
        .balance
        .checked_sub(amount)
        .ok_or(VaultError::InsufficientFunds)?;               // ? 自动把 VaultError 转成 anchor 的 Error
    msg!("withdraw {} left {}", amount, vault.balance);       // 宏：写程序日志，在交易日志里能看到
    Ok(())
}
`)}
${call('deep', `<p><strong>想看宏到底展开成什么？</strong>安装 <code>cargo install cargo-expand</code>，在程序目录运行 <code>cargo expand</code>，可以看到 <code>#[derive(Accounts)]</code> 生成的完整校验代码。审计 Anchor 程序时，这是确认“某个约束到底有没有生效”的最直接方法。不同 Anchor 版本生成的代码细节不同（例如 0.31 起支持自定义鉴别码），以你项目锁定的版本为准。</p>`)}

<h2>7. 模块、crate 与 Cargo features：Anchor 项目长什么样</h2>
<p>Go 用首字母大写表示导出；Rust 用 <code>pub</code>。Go 一个目录是一个 package；Rust 用 <code>mod</code> 声明模块，文件路径跟着模块名走。</p>
${code('BASH', `
my_vault/
├── Anchor.toml                 # Anchor 配置：工具版本、集群、钱包、程序 ID
├── Cargo.toml                  # 工作区：members、[profile.release] overflow-checks
├── Cargo.lock                  # 依赖精确版本，提交到仓库
├── programs/
│   └── my_vault/
│       ├── Cargo.toml          # 程序 crate：依赖与 features
│       └── src/
│           ├── lib.rs          # declare_id!、#[program]、mod 声明
│           ├── state.rs        # #[account] 结构体
│           ├── errors.rs       # #[error_code] 枚举
│           └── instructions/
│               ├── mod.rs      # pub mod deposit; pub mod withdraw;
│               ├── deposit.rs  # Deposit 账户结构体 + handler
│               └── withdraw.rs
├── tests/my_vault.ts           # anchor test 跑的集成测试
└── target/                     # 编译产物：deploy/*.so、idl/*.json、types/*.ts
`)}
<p><code>lib.rs</code> 里用 <code>pub mod state;</code> 声明子模块（对应 <code>state.rs</code> 或 <code>state/mod.rs</code>），再用 <code>use crate::state::Vault;</code> 引入名字。<code>#[program]</code> 里的指令函数只做转发，例如 <code>instructions::deposit::handler(ctx, amount)</code>，逻辑放在各自文件里。可见性有三档：<code>pub</code>（所有人可用）、<code>pub(crate)</code>（只在本 crate 内可用）、不写（只在本模块内可用）。路径里 <code>crate::</code> 从本 crate 根开始，<code>super::</code> 指上一层模块；Anchor 模板里的 <code>use super::*;</code> 就是把外层模块的名字全部引进 <code>#[program]</code> 模块。</p>
${code('TOML', `
# programs/my_vault/Cargo.toml（版本号仅为示例，与 Anchor CLI 保持一致）
[package]
name = "my_vault"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]   # cdylib：编译成链上 .so；lib：让别的 crate 能依赖它
name = "my_vault"

[features]
default = []
cpi = ["no-entrypoint"]          # 别的程序以 features = ["cpi"] 依赖本 crate 时，只拿 CPI 调用代码
no-entrypoint = []               # 不生成入口，避免两个程序的入口符号冲突
idl-build = ["anchor-lang/idl-build"]   # anchor build 生成 IDL 时打开

[dependencies]
anchor-lang = "0.31.1"
# anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }  # 危险功能要显式打开
`)}
${call('info', `<p><strong>Cargo features 是“编译开关”</strong>：代码里用 <code>#[cfg(feature = "cpi")]</code> 包住的部分，只有打开该 feature 才会被编译。Anchor 把有风险的功能放在 feature 后面，例如 <code>init-if-needed</code>：它允许“账户不存在就创建、存在就直接用”，用错会导致重复初始化攻击（攻击者重置你的状态）。默认不开，必须显式打开，就是为了让你多想一次。</p>`)}

<h2>8. Borsh 序列化与账户空间计算</h2>
<p>Solana 账户里存的是一串字节。Anchor 用 <strong>Borsh</strong>（Binary Object Representation Serializer for Hashing）把结构体变成字节。Borsh 的规则很简单：字段按声明顺序紧密排列，整数用<strong>小端序</strong>，没有填充和字段名。</p>
${code('RUST', `
// cargo add borsh --features derive 后可直接运行
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
struct Deposit {
    amount: u64,
    memo: String,
    referrer: Option<u8>,
}

fn main() {
    let d = Deposit { amount: 1_000_000, memo: "hi".to_string(), referrer: None };
    let bytes = borsh::to_vec(&d).unwrap();
    println!("{} bytes: {:02x?}", bytes.len(), bytes);
    // 15 bytes: [40, 42, 0f, 00, 00, 00, 00, 00, 02, 00, 00, 00, 68, 69, 00]
    //            └─ amount = 1,000,000 小端序 8 字节 ┘└ 长度 2 (u32) ┘└"hi"┘└None
    let back = Deposit::try_from_slice(&bytes).unwrap();
    assert_eq!(back, d);
}
`)}
${tbl(['类型', 'Borsh 占用字节', '说明'], [
  ['<code>bool</code> / <code>u8</code> / <code>i8</code>', '1', ''],
  ['<code>u16</code> / <code>u32</code> / <code>u64</code> / <code>u128</code>', '2 / 4 / 8 / 16', '小端序'],
  ['<code>Pubkey</code>', '32', '公钥原始字节'],
  ['<code>[T; N]</code>', 'N × T', '定长数组'],
  ['<code>String</code>', '4 + 字节数', '4 字节 u32 长度前缀；中文 UTF-8 每字 3 字节；Anchor 里用 <code>#[max_len(n)]</code> 声明上限'],
  ['<code>Vec&lt;T&gt;</code>', '4 + n × T', '同样要 <code>#[max_len(n)]</code>'],
  ['<code>Option&lt;T&gt;</code>', '1 + T', '1 字节标记 None / Some，按 Some 预留空间'],
  ['<code>enum</code>', '1 + 最大变体', '1 字节变体序号'],
  ['Anchor 账户鉴别码', '8', '每个 <code>#[account]</code> 账户开头，<code>INIT_SPACE</code> 不含它']
])}
${code('RUST', `
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,       // 32
    pub mint: Pubkey,            // 32
    pub total_deposited: u64,    // 8
    pub bump: u8,                // 1
    #[max_len(32)]
    pub name: String,            // 4 + 32 = 36
    pub paused: bool,            // 1
}
// Vault::INIT_SPACE = 32 + 32 + 8 + 1 + 36 + 1 = 110
// 创建时：space = 8 + Vault::INIT_SPACE = 118
`)}
<p><strong>算一算（示例）</strong>：上面的 Vault 账户共 8 + 110 = 118 字节。按 <a href="#m05-12">M06.7</a> 的押金公式，押金 = (128 + 118) × 6,960 = 1,712,160 lamports ≈ 0.00171 SOL。如果把 <code>name</code> 的上限从 32 改成 200，账户变成 286 字节，押金约 0.00288 SOL。字段多一个 <code>u64</code>，每个账户多 8 字节；一百万个用户账户就多 8 MB 链上空间，押金也按比例增加。</p>
${call('warn', `<p><strong>空间算错的两种后果</strong>：① 少算（最常见是忘了 8 字节鉴别码，或 String 忘了 4 字节长度前缀）：写入时序列化失败，交易报错，账户无法使用。② 字段顺序或类型改了，但链上已有旧账户：新代码按新布局读旧字节，读出的数据全部错位。升级程序时<strong>只在结构体末尾追加字段</strong>，并用 realloc 扩容或做数据迁移，不要改中间字段的顺序和类型。</p>`)}

<h2>9. 测试与代码质量：cargo test、clippy、fmt</h2>
<p>Rust 的单元测试和被测代码写在同一个文件里，放在 <code>#[cfg(test)] mod tests</code> 中，只在 <code>cargo test</code> 时编译。<strong>最划算的做法是把金额计算这类纯函数从指令里抽出来，用 cargo test 秒级测完</strong>；涉及账户和 CPI 的流程，再用 <code>anchor test</code> 或 Rust 侧的轻量模拟器（例如 LiteSVM、Mollusk）做集成测试。</p>
${steps([
  '<code>cargo test</code>：运行所有带 <code>#[test]</code> 的函数；<code>cargo test fee</code> 只跑名字含 fee 的测试。',
  '<code>assert_eq!(a, b)</code> 比较相等；<code>assert!(cond)</code> 检查条件；<code>#[should_panic]</code> 断言会 panic。',
  '<code>cargo fmt</code> 统一格式（相当于 gofmt），CI 里用 <code>cargo fmt --check</code>。',
  '<code>cargo clippy -- -D warnings</code>：静态检查，警告当错误。链上程序建议额外打开 <code>-W clippy::arithmetic_side_effects</code>（找出所有未检查的算术）和 <code>-W clippy::cast_possible_truncation</code>（找出可能截断的 as 转换）。'
])}
${tryit(`<p><strong>动手练习：写一个溢出安全的代币金额计算器 token_math，并用测试证明它正确。</strong></p>
<ol>
<li>运行 <code>cargo new --lib token_math &amp;&amp; cd token_math</code>，把下面的代码整体替换 <code>src/lib.rs</code>。</li>
<li>运行 <code>cargo test</code>。<strong>预期</strong>：<code>test result: ok. 6 passed</code>。</li>
<li>运行 <code>cargo clippy -- -D warnings -W clippy::arithmetic_side_effects -W clippy::cast_possible_truncation</code>。<strong>预期</strong>：没有任何警告（测试代码不参与这次检查）。</li>
<li>故意把 <code>mul_div_floor</code> 里的 <code>u128::from(a).checked_mul(…)</code> 改成 <code>(a * b / c)</code>，再跑 clippy，观察 <code>arithmetic_side_effects</code> 报出哪一行；再跑 <code>cargo test</code>，观察 debug 模式下 <code>mul_div_uses_u128</code> 测试因为溢出 panic 而失败。改回来。</li>
<li>扩展：加一个 <code>credit(balance, amount)</code> 函数（入账，溢出返回 <code>Overflow</code>），并为它写两个测试。</li>
</ol>`)}
${code('RUST', `
//! token_math：链上代币金额的安全计算（不依赖任何外部 crate）

/// 所有可能的计算错误。derive 让它能打印（Debug）、能用 == 比较（PartialEq）。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MathError {
    Overflow,          // 结果超出 u64
    DivideByZero,      // 除数为 0
    InsufficientFunds, // 余额不足
    BadDecimals,       // 小数位不合理
}

/// 10 的 decimals 次方。decimals 超过 19 时 u64 放不下，直接报错。
pub fn pow10(decimals: u8) -> Result<u64, MathError> {
    10u64
        .checked_pow(u32::from(decimals))
        .ok_or(MathError::BadDecimals)
}

/// 整数枚数 → 最小单位。例：ui_to_base(5, 6) = 5_000_000
pub fn ui_to_base(ui: u64, decimals: u8) -> Result<u64, MathError> {
    ui.checked_mul(pow10(decimals)?).ok_or(MathError::Overflow)
}

/// a × b ÷ c，向下取整。中间结果用 u128，最后安全转回 u64。
pub fn mul_div_floor(a: u64, b: u64, c: u64) -> Result<u64, MathError> {
    if c == 0 {
        return Err(MathError::DivideByZero);
    }
    let r = u128::from(a)
        .checked_mul(u128::from(b)) // u64 × u64 一定放得进 u128，这里仍按规范显式检查
        .ok_or(MathError::Overflow)?
        .checked_div(u128::from(c))
        .ok_or(MathError::DivideByZero)?;
    u64::try_from(r).map_err(|_| MathError::Overflow) // 不用 as u64：那会静默截断
}

/// a × b ÷ c，向上取整。收手续费时用它，舍入方向对协议有利。
pub fn mul_div_ceil(a: u64, b: u64, c: u64) -> Result<u64, MathError> {
    if c == 0 {
        return Err(MathError::DivideByZero);
    }
    let r = u128::from(a)
        .checked_mul(u128::from(b))
        .ok_or(MathError::Overflow)?
        .div_ceil(u128::from(c)); // 向上取整除法（Rust 1.73+）
    u64::try_from(r).map_err(|_| MathError::Overflow)
}

/// 手续费：amount × fee_bps ÷ 10_000，向上取整。1 bps = 0.01%。
pub fn fee(amount: u64, fee_bps: u16) -> Result<u64, MathError> {
    mul_div_ceil(amount, u64::from(fee_bps), 10_000)
}

/// 从余额里扣款，返回新余额。
pub fn debit(balance: u64, amount: u64) -> Result<u64, MathError> {
    balance
        .checked_sub(amount)
        .ok_or(MathError::InsufficientFunds)
}

/// 转账：扣掉手续费后，对方实收多少、协议收多少。
pub fn split_transfer(amount: u64, fee_bps: u16) -> Result<(u64, u64), MathError> {
    let f = fee(amount, fee_bps)?; // ? ：出错就把错误原样返回给调用方
    let net = amount.checked_sub(f).ok_or(MathError::Overflow)?;
    Ok((net, f))
}

#[cfg(test)]
mod tests {
    use super::*; // 引入上面所有函数

    #[test]
    fn converts_ui_amount() {
        assert_eq!(ui_to_base(5, 6), Ok(5_000_000));
        assert_eq!(ui_to_base(0, 9), Ok(0));
        // 200 亿枚 × 10^9 = 2 × 10^19，超过 u64::MAX ≈ 1.8 × 10^19
        assert_eq!(ui_to_base(20_000_000_000, 9), Err(MathError::Overflow));
        assert_eq!(pow10(20), Err(MathError::BadDecimals));
    }

    #[test]
    fn fee_rounds_up() {
        assert_eq!(fee(1_000_000, 30), Ok(3_000)); // 0.3%
        assert_eq!(fee(1, 30), Ok(1)); // 0.003 向上取整为 1
        assert_eq!(fee(0, 30), Ok(0));
    }

    #[test]
    fn mul_div_uses_u128() {
        // 5,000 枚（9 位小数）× 价格 4,000,000（6 位精度）：乘积 2 × 10^19 超过 u64
        let amount = 5_000_000_000_000u64;
        let price = 4_000_000u64;
        assert!(amount.checked_mul(price).is_none()); // 直接用 u64 乘会溢出
        assert_eq!(
            mul_div_floor(amount, price, 1_000_000),
            Ok(20_000_000_000_000)
        );
        assert_eq!(mul_div_floor(u64::MAX, 2, 1), Err(MathError::Overflow));
        assert_eq!(mul_div_floor(1, 1, 0), Err(MathError::DivideByZero));
    }

    #[test]
    fn debit_checks_balance() {
        assert_eq!(debit(100, 30), Ok(70));
        assert_eq!(debit(100, 101), Err(MathError::InsufficientFunds));
    }

    #[test]
    fn split_adds_up() {
        let (net, f) = split_transfer(1_000_000, 30).unwrap(); // 测试里可以 unwrap
        assert_eq!(net + f, 1_000_000);
        assert_eq!((net, f), (997_000, 3_000));
    }

    #[test]
    fn as_cast_truncates_silently() {
        let big: u128 = (u64::MAX as u128) + 2;
        assert_eq!(big as u64, 1); // 高位被直接丢掉
        assert_eq!(-1i64 as u64, u64::MAX); // 负数变成巨大的正数
        assert!(u64::try_from(big).is_err()); // try_from 会报错
    }
}
`)}
<p>把这些函数放进 Anchor 程序时，只要给 <code>MathError</code> 换成 <code>#[error_code]</code> 枚举（或者写一个 <code>impl From&lt;MathError&gt; for anchor_lang::error::Error</code>），指令里就能直接写 <code>let (net, fee) = split_transfer(amount, cfg.fee_bps)?;</code>。</p>

<h2>10. 链上程序里的 Rust 安全坑</h2>
<p>编译器能保证内存安全，但下面这些坑都能顺利编译、顺利部署，然后在主网上丢钱或卡死资金：</p>
${tbl(['坑', '后果', '正确写法'], [
  ['未检查的算术 <code>a + b</code>、<code>a * b</code>、<code>a - b</code>', '溢出回绕成错误金额；减法下溢让余额变成天文数字', '<code>checked_*</code> + 自定义错误；<code>overflow-checks = true</code> 作为兜底；clippy <code>arithmetic_side_effects</code>'],
  ['<code>as</code> 截断：<code>(x as u128 * y as u128) as u64</code>', '结果超出 u64 时高位被丢掉，静默得到一个小数字', '<code>u64::try_from(r).map_err(|_| 错误)?</code>'],
  ['<code>unwrap()</code> / <code>expect()</code> / 数组越界 <code>v[i]</code> / 除以 0', 'panic：交易失败且没有错误码，用户和前端不知道原因；如果某条必经路径总会 panic，资金可能被卡死', '<code>.ok_or(错误)?</code>、<code>v.get(i)</code>、先 <code>require!(c &gt; 0, …)</code>'],
  ['舍入方向随意', '每笔多给用户 1 个最小单位，攻击者用大量小额操作把金库抽干', '付给用户的向下取整，收用户的（手续费、债务）向上取整'],
  ['先除后乘 <code>a / c * b</code>', '精度损失；a 小于 c 时结果直接为 0', '先乘后除，中间用 u128'],
  ['用 <code>f32</code> / <code>f64</code> 算金额', '浮点误差；不同实现结果可能不同', '全程整数 + 定点精度（如 6 位或 9 位）'],
  ['<code>saturating_sub</code> 代替余额检查', '余额不足时得到 0 而不是报错，后续逻辑按“成功”继续', '<code>checked_sub(…).ok_or(InsufficientFunds)?</code>'],
  ['<code>UncheckedAccount</code> / <code>AccountInfo</code> 不做校验', '攻击者传入伪造账户', 'Anchor 要求这类字段写 <code>/// CHECK:</code> 注释说明为什么安全；能用 <code>Account&lt;T&gt;</code> 就别用它们'],
  ['大结构体放在栈上', 'SBF 每个栈帧只有 4 KB，程序运行时访问越界报错', '大账户用 <code>Box&lt;Account&lt;…&gt;&gt;</code> 放到堆上，或用 <code>zero_copy</code>']
])}
${call('warn', `<p><strong>测试一定要覆盖边界值</strong>：0、1、<code>u64::MAX</code>、刚好等于余额、余额减 1、手续费为 0 和 10,000 bps。第 9 节的 token_math 测试就是按这个思路写的。审计报告里的数学类漏洞，绝大多数出在这些边界上。</p>`)}

${mistakes([
  ['Rust 是内存安全的语言，所以写出来的 Solana 程序就是安全的。', '借用检查器只保证内存安全。溢出、截断、舍入、漏写账户约束都能顺利编译。安全审计主要查的就是这些业务层问题。'],
  ['release 版本和 debug 版本一样，溢出都会报错。', 'Rust 的 release 编译默认溢出静默回绕。要在 Cargo.toml 写 <code>[profile.release] overflow-checks = true</code>，并且金额运算仍要用 checked 系列。'],
  ['<code>x as u64</code> 和 <code>u64::try_from(x)</code> 效果一样。', '<code>as</code> 超出范围时静默截断，负数变成巨大的正数；<code>try_from</code> 返回错误。链上金额只用 try_from。'],
  ['账户空间写结构体字段大小之和就行。', '还要加 8 字节 Anchor 鉴别码；String 和 Vec 要加 4 字节长度前缀，并用 max_len 声明上限。'],
  ['遇到借用报错，到处加 <code>.clone()</code> 就能编译通过。', 'clone 复制的是一份副本，修改副本不会写回账户。先想清楚谁要修改数据，再缩短借用范围或先复制出需要的小值。']
])}
${recap([
  '工具链：rustup 管编译器，cargo 管项目，Solana CLI 提供 build-sbf 和本地节点，avm 管 Anchor；三者版本要配对，写进 Anchor.toml，以官方说明为准。',
  '变量默认不可变；enum 可以带数据，match 必须穷尽；没有 null 和异常，用 Option、Result 和 ? 传递失败。',
  '金额用 u64，中间计算用 u128；只用 checked 运算，转回 u64 用 try_from，不用 as；release 打开 overflow-checks。',
  '所有权只有一个主人；借用要么多个只读，要么一个可写；<code>&#39;info</code> 表示引用借自本次交易的账户数据。',
  'Anchor 宏在编译期生成分发、账户校验、序列化和错误码代码；它只校验你声明的约束。',
  'Borsh 按字段顺序紧密排列、小端序；空间 = 8 字节鉴别码 + INIT_SPACE；纯计算逻辑抽成函数用 cargo test 测边界值，并跑 clippy。'
])}
${quiz([
  { q: '<code>let x: u64 = u64::MAX;</code> 之后 <code>x.checked_add(1)</code> 的结果是什么？', o: ['0', '程序 panic', 'None', 'Some(u64::MAX)'], a: 2, why: 'checked 系列在溢出时返回 None，由你决定返回哪个错误。返回 0 的是 wrapping_add；停在 MAX 的是 saturating_add（而且它返回的是 u64，不是 Some）；panic 是 debug 模式下 <code>x + 1</code> 的行为。' },
  { q: '<code>let r: u128 = (u64::MAX as u128) + 6;</code> 那么 <code>r as u64</code> 等于多少？', o: ['编译错误', '5', 'u64::MAX', '程序 panic'], a: 1, why: 'r = 2^64 + 5。as 转换直接丢掉高位，得到 5，既不报错也不 panic。这就是链上程序必须用 <code>u64::try_from</code> 的原因。' },
  { q: 'Anchor 指令里 <code>let c = &amp;mut ctx.accounts.counter;</code> 这行代码表达的是什么？', o: ['对 counter 账户做可写借用，之后可以修改它的字段；对应的约束里需要有 mut', '把 counter 账户复制一份，修改副本', '把 counter 账户的所有权转移给 c，ctx 之后不能再用', '把 counter 标记为签名者'], a: 0, why: '&amp;mut 是可写借用，不复制、不转移所有权。修改后 Anchor 在 exit 阶段把数据写回账户；约束里没写 mut 的账户，运行时不允许写入。' },
  { q: '<code>#[account]</code> 宏为 <code>pub struct Counter</code> 生成了什么？', o: ['程序入口和指令分发', '账户签名校验', '自动扩容逻辑', 'Borsh 序列化、8 字节鉴别码和 owner 校验'], a: 3, why: '入口和分发由 #[program] 生成；签名校验来自 Signer 类型和 #[derive(Accounts)]；扩容要用 realloc 约束显式声明。#[account] 负责数据的序列化和类型识别。' },
  { q: '一个账户结构体有 Pubkey、u64、bool，以及 <code>#[max_len(20)]</code> 的 String。用 Anchor 创建它时 space 应该是多少？', o: ['65', '69', '73', '81'], a: 2, why: '8（鉴别码）+ 32 + 8 + 1 + (4 + 20) = 73。少了 8 字节鉴别码得 65；少了 String 的 4 字节长度前缀得 69。' }
])}
${exercises([
  ['计算题（示例）：用本文 token_math，<code>split_transfer(999, 30)</code> 返回什么？如果把 fee 改成向下取整，结果又是什么？差别说明了什么？', '<p>向上取整：999 × 30 = 29,970，除以 10,000 得 2.997，向上取整为 3，返回 (996, 3)。向下取整：手续费为 2，返回 (997, 2)。每笔相差 1 个最小单位。如果协议按向下取整收费，用户把大额拆成很多小额就能少交甚至不交手续费（例如 333 × 30 ÷ 10,000 = 0.999，向下取整为 0）。所以收用户的钱向上取整。</p>'],
  ['改错题：下面的代码能编译，但有两个安全问题，指出并改正：<code>let value = (amount as u128 * price as u128 / 1_000_000) as u64; vault.total = vault.total + value;</code>', '<p>① 最后的 <code>as u64</code> 会静默截断，应改成 <code>u64::try_from(v).map_err(|_| VaultError::Overflow)?</code>，中间的乘法用 <code>u128::from(amount).checked_mul(u128::from(price))</code>。② <code>vault.total + value</code> 未检查溢出，应改成 <code>vault.total.checked_add(value).ok_or(VaultError::Overflow)?</code>。前面的 <code>amount as u128</code> 是扩宽转换，本身不会丢数据，但统一用 <code>u128::from</code> 更清楚。</p>'],
  ['设计题：程序 v1 的账户是 <code>{ authority: Pubkey, count: u64 }</code>，v2 想加一个 <code>last_update: i64</code>。已有一万个 v1 账户在链上。应该怎么改结构体和迁移？', '<p>把 <code>last_update</code> 加在结构体<strong>末尾</strong>，不改前两个字段的顺序和类型；v1 账户的 space 是 8 + 40 = 48，v2 需要 56。用 Anchor 的 <code>realloc</code> 约束在用户下次交互时把账户扩到 56 字节（多出的押金由 payer 补），新字段初始化为 0 或当前时间。在迁移完成前，读取逻辑要能处理旧长度的账户。千万不要把新字段插在中间：旧账户的字节会按新布局错位解析。</p>']
])}
${checklist([
  '装好 rustup、Solana CLI 和 avm，能打印三个版本号，并在 Anchor.toml 里固定了版本。',
  '运行过第 3 节的 main.rs，能说出每一行输出对应的语法点。',
  '能看懂并修好 E0382、E0499、E0502 三类借用报错。',
  '能说清 #[program]、#[derive(Accounts)]、#[account]、#[error_code] 各自生成了什么。',
  '能手算一个 Anchor 账户的 space 和押金。',
  '完成了 token_math 练习：cargo test 全部通过，clippy 打开 arithmetic_side_effects 无警告。'
])}
${terms([
  ['cargo', 'Cargo', 'Rust 官方的构建和包管理工具，负责依赖、编译、测试和发布'],
  ['crate', 'Crate', 'Rust 的编译和发布单位，编译成一个库或一个可执行文件'],
  ['所有权', 'Ownership', '每个值只有一个所有者、所有者离开作用域时值被释放的内存管理规则'],
  ['借用', 'Borrowing', '通过引用临时使用一个值而不取得所有权；只读借用可多个，可写借用只能一个'],
  ['生命周期', 'Lifetime', '编译器为引用标注的有效范围，写作 ′a、′info'],
  ['借用检查器', 'Borrow Checker', '编译器中检查所有权和借用规则的部分'],
  ['trait', 'Trait', '一组方法签名，类型通过 impl 显式实现，相当于 Go 的 interface'],
  ['派生宏', 'Derive Macro', '用 #[derive(...)] 自动生成 trait 实现的宏'],
  ['Borsh', 'Binary Object Representation Serializer for Hashing', 'Solana 常用的二进制序列化格式：字段按顺序紧密排列、小端序'],
  ['检查运算', 'Checked Arithmetic', 'checked_add 等方法，溢出时返回 None 而不是回绕或 panic']
])}
` });
})();
