/* ---------- M02 智能合约（6）：m02-69 Yul、内联汇编与 EVM 字节码逆向 ---------- */
(() => {
CUR = 'm02-69';
addCh({ id: 'm02-69', nav: 'Yul 与 EVM 字节码逆向', title: 'M02.13 Yul、内联汇编与 EVM 字节码逆向：内存布局、反编译与攻击 Trace 还原', desc: 'EVM 内存布局（0x40 空闲指针）、Yul 内联汇编安全写法、反编译未开源合约（Heimdall/Dedaub）与 cast run 攻击复盘', html: `
<h1>M02.13 Yul、内联汇编与 EVM 字节码逆向：内存布局、反编译与攻击 Trace 还原</h1>
${meta([
  '熟记 Solidity 的 EVM 线性内存分区（0x00 暂存区、0x40 空闲指针、0x60 零槽）与内存安全汇编规则。',
  '能读懂并写出常见的 Yul 内联汇编片段（低开销转账、定制 revert、精确读取 calldata 与存储槽）。',
  '面对链上未开源的攻击合约或 MEV 机器人，能用反编译工具（Heimdall / Dedaub）还原函数选择器与控制流。',
  '掌握用 Foundry cast run 与 Tenderly 逐步拆解复杂黑客攻击交易的内部调用栈（Call Trace）。'
], '前置：<a href="#m02-1">M02.1 智能合约与 EVM</a>、<a href="#m02-6">M02.7 Gas 与存储优化</a>、<a href="#m02-66">M02.11 可升级合约与代理架构</a>')}
${beginner(`<p><strong>Yul</strong>：Solidity 编译器内置的中间汇编语言。在 Solidity 里写 <code>assembly { ... }</code> 时，写的就是 Yul，它直接对应 EVM 的底层操作码（Opcode）。</p>
<p><strong>空闲内存指针（Free Memory Pointer）</strong>：固定存放在内存地址 <code>0x40</code> 处的 32 字节数字，告诉 Solidity“下一次新分配数组或结构体从哪个字节开始写，才不会踩坏前面的数据”。</p>
<p><strong>反编译（Decompilation）</strong>：链上只存十六进制字节码，黑客不会把攻击合约源码上传到 Etherscan。反编译工具通过分析字节码里的 <code>PUSH4</code> 函数选择器和跳转表，把机器码尽量还原成类 Solidity 伪代码。</p>`)}

<h2>1. 一句话理解</h2>
${one('Solidity 是给普通业务写的“高级安全带”，Yul 内联汇编是拆掉安全带直接操作 EVM 栈、内存和存储槽的手术刀——平时只在底层库和极限优化时谨慎动用，但读懂它与反编译字节码，是看透黑客攻击 Trace 和高阶协议源码的必经门槛。')}
${call('analogy', `<p>写 Solidity 像开自动挡家用车，编译器自动帮你检查数组越界、算术溢出和内存分配；写 Yul 像拆开发动机盖直接调喷油嘴，动力和省油能挤到极限，但拧错一颗螺丝（比如忘了更新 0x40 指针）就会立刻拉缸爆内存。</p>
<p>比喻的局限：就算你自己一辈子不打算手写内联汇编，OpenZeppelin、Uniswap V4、Solady 的核心底层和 90% 的链上黑客攻击合约都充满 Yul 与未开源字节码，读不懂就无法做深度审计与应急复盘。</p>`)}
${art('一图看懂：Solidity 标准 EVM 线性内存布局（按字节偏移）', 660, 300, [
  S.box(20, 42, 130, 120, { k: 'info', t: '0x00 – 0x3f', s: '64 字节暂存区\nScratch Space\n给 keccak256 用', mono: 1 }),
  S.box(166, 42, 140, 120, { k: 'key', t: '0x40 – 0x5f', s: '空闲内存指针\nFree Memory Ptr\n初始值 = 0x80', mono: 1 }),
  S.box(322, 42, 120, 120, { k: 'warn', t: '0x60 – 0x7f', s: '永久零槽\nZero Slot\n空数组指向此', mono: 1 }),
  S.box(458, 42, 182, 120, { k: 'ok', t: '0x80 及之后', s: '动态对象分配区\nstring / bytes / struct\n只增不释放（单笔交易）', mono: 1 }),
  S.arrow(236, 164, 540, 200, { k: 'key' }),
  S.box(40, 202, 580, 56, { k: 'risk', icon: 'warn', t: '内存安全铁律：使用 0x00–0x3f 不影响指针；若向 0x80+ 写入且要保留，必须同步更新 0x40', s: '严禁向 0x60 零槽写入非零值，否则所有后续空动态数组都会读出脏数据！' }),
  S.text(330, 284, 'EVM 内存按字（32 字节）扩展，越往高地址写，二次方内存扩展 Gas 费暴涨', { size: 13, anchor: 'middle', mw: 630 })
], [
  ['flow', '所有 Solidity 合约在函数执行期间共享这套统一的线性内存约定。'],
  ['key', '在 0x00–0x3f 暂存区做两次 32 字节写入加 keccak256，既不触发内存扩展也不破坏 0x40 指针，是极常见省 Gas 技巧。'],
  ['risk', '绝不可随意往 0x60 零槽写入任何非零字节，也不可往 0x40 指向位置之外写数据而不更新指针。']
], '展示 EVM 线性内存四大分区：0x00至0x3f暂存区、0x40至0x5f空闲内存指针、0x60至0x7f零槽以及0x80之后的动态对象区', 'm02-69')}

<h2>2. 生产级 Yul 内联汇编：何时用、怎么写才安全</h2>
<p>业务合约不应为了炫技写汇编；只有在高频底层库（如 Solady、Uniswap V4、ERC-7201 槽位读取、安全无返回检查的 ERC-20 转账）中才值得使用，并且优先标记 <code>assembly ("memory-safe")</code> 以便编译器开启 IR 优化。</p>
${code('SOLIDITY', `
// 示例：Solady 风格的高效安全转账（兼容 USDT 等无 bool 返回值的非标准 ERC-20）
function safeTransfer(address token, address to, uint256 amount) internal {
    assembly ("memory-safe") {
        // 1. 临时借用 0x14 与 0x34，先备份 0x40 空闲指针的值到栈上（不污染高地址内存）
        let freePtr := mload(0x40)
        // 2. 写入 transfer(address,uint256) 选择器 0xa9059cbb
        mstore(0x00, 0xa9059cbb00000000000000000000000000000000000000000000000000000000)
        mstore(0x04, and(to, 0xffffffffffffffffffffffffffffffffffffffff)) // 清除高位脏位！
        mstore(0x24, amount)

        // 3. 发起外部 call：输入 68 字节（0x00..0x44），期望最多 32 字节返回值写回 0x00
        let ok := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
        // 4. 校验：call 成功 且 (返回长度==0 且目标有代码，或返回值为 1)
        if iszero(and(ok, or(and(iszero(returndatasize()), gt(extcodesize(token), 0)), eq(mload(0x00), 1)))) {
            mstore(0x00, 0x90b8ec18) // TransferFailed() 自定义错误选择器
            revert(0x1c, 0x04)
        }
        // 5. 恢复 0x40 空闲内存指针并清空临时覆盖的 0x34..0x44
        mstore(0x40, freePtr)
        mstore(0x60, 0) // 确保持久零槽为 0
    }
}
`)}
${call('warn', '<p><strong>内联汇编四大高频坑</strong>：① 忘记掩码清理 <code>address</code> 高 12 字节脏位（<code>and(addr, 0xff...ff)</code>）；② 忘记检查算术溢出（Yul 里的 <code>add/sub/mul</code> 默认回绕不报错）；③ <code>call</code> 给无代码 EOA 地址会直接返回 <code>1</code>（必须配合 <code>extcodesize</code> 检查）；④ 写完 <code>0x40</code> 区域忘记恢复空闲指针。</p>')}

<h2>3. 未开源合约字节码逆向与反编译</h2>
<p>当安全告警提示某个未知合约刚刚从协议提走 500 万美元时，Etherscan 上只能看到一串 <code>0x6080604052...</code> 字节码。逆向分析分三步走：</p>
${mm('未开源链上字节码逆向分析流程', `
flowchart LR
  B["1. 提取链上字节码<br/>cast code 0xAddr"] --> S["2. 识别函数选择器<br/>搜索 PUSH4 4字节签名"]
  S --> D["3. 自动化反编译<br/>Heimdall / Dedaub"]
  D --> T["4. 结合真实交易 Trace<br/>cast run --trace"]
  T --> R["还原资金流与漏洞触发点"]
`, [
  ['flow', '先用反编译器把字节码变成可读伪代码，再拿一笔真实攻击交易的 Trace 对照看每一步参数和存储变更。'],
  ['key', 'Solidity 合约开头几乎总是 0x6080604052（把 0x80 存进 0x40 空闲指针），紧接着是用 PUSH4 + EQ 构成的 Selector 路由表。']
])}
<ul>
<li><strong>Heimdall-rs（开源命令行）</strong>：运行 <code>heimdall decompile 0xTargetAddr --rpc-url $RPC</code>，几秒内基于符号执行还原出带函数签名（查 4byte 库）和控制流的 Solidity 伪代码与 ABI。</li>
<li><strong>Dedaub Contract Library</strong>：对复杂 DeFi 合约反编译可读性极高，能自动识别存储槽变量类型与内部跨合约调用。</li>
<li><strong>Foundry <code>cast run</code> 攻击复盘</strong>：拿到黑客交易哈希后，在本地直接跑 <code>cast run &lt;txHash&gt; --rpc-url $ARCHIVE_RPC --trace</code>，即可在终端打印完整的树状内部调用、每次 <code>DELEGATECALL</code> / <code>STATICCALL</code> 参数、余额变化与失败 revert 原因；配合 Tenderly Debugger 可单步查看每条 Opcode 执行时的栈和内存状态。</li>
</ul>

<h2>4. 常用 EVM 底层操作码速查</h2>
${tbl(['操作码', '作用', '关键工程注意点'], [
  ['<code>CALLDATALOAD</code> / <code>CALLDATASIZE</code>', '从只读交易输入读取 32 字节 / 总长度', '比 memory 便宜得多；自定义紧凑编码可省大量 Gas'],
  ['<code>SLOAD</code> / <code>SSTORE</code>', '读写持久化合约存储槽', '冷读 2,100 Gas，0→非0 写入 20,000 Gas（EIP-2929）'],
  ['<code>TLOAD</code> / <code>TSTORE</code>', '读写瞬态存储（EIP-1153，单笔交易结束自动清零）', '仅 ~100 Gas，现代重入锁与 Uniswap V4 闪电记账核心'],
  ['<code>RETURNDATACOPY</code>', '把外部调用返回的数据拷贝进内存', '警惕 Return Bomb：恶意目标返回超大字节导致调用方内存扩展 OOG'],
  ['<code>EXTCODESIZE</code>', '读取目标地址的字节码长度', '在合约 constructor 执行期间返回 0，绝不能用来判断“非合约”']
])}

${exercises([
  ['为什么在 Yul 内联汇编里调用外部合约后，如果直接 <code>returndatacopy(0, 0, returndatasize())</code> 可能遭到“返回值炸弹（Return Bomb）”攻击？', '<p>恶意目标合约可以故意返回几兆字节的垃圾数据。如果调用方无上限地把全部 <code>returndatasize()</code> 拷贝进自己内存，内存扩展的二次方 Gas 费会瞬间耗尽调用方剩余的全部 Gas 导致交易回滚。解法是只拷贝固定需要的最大字节数（例如 32 或 64 字节）。</p>'],
  ['为什么说 <code>assembly { ... }</code> 里的 <code>add(a, b)</code> 在 Solidity 0.8+ 里依然可能整数溢出？', '<p>Solidity 0.8+ 的自动溢出检查只作用于高级语言表达式；进入 <code>assembly</code> 块后直接映射为 EVM 原生 <code>ADD</code> 指令（模 2²⁵⁶ 回绕），编译器不会插入任何溢出检查，必须手工校验。</p>']
])}
${checklist([
  '能默写出 EVM 线性内存 0x00、0x40、0x60、0x80 四个分区的用途与修改禁忌。',
  '知道在 Yul 中做安全外部调用时为何要清理 address 高位、检查 extcodesize 并防范 Return Bomb。',
  '能用 Heimdall 或 Dedaub 反编译一个未开源合约，并用 <code>cast run --trace</code> 复盘真实链上攻击交易。',
  '理解 EIP-1153 瞬态存储（TLOAD/TSTORE）为何能把重入锁开销从数千 Gas 降到百级 Gas。'
])}
${mistakes([
  ['只要把普通 Solidity 代码改写成 Yul 汇编，合约就一定更安全、更省 Gas', '手写汇编会绕过编译器的类型、边界与溢出保护，极易引入严重漏洞；普通业务代码用 Solidity + <code>via-ir</code> 编译优化往往已足够。'],
  ['合约源码没在 Etherscan 上开源验证，别人就完全看不懂我的逻辑', '字节码永久公开在链上，任何安全研究员用 Heimdall/Dedaub 几秒就能反编译出核心控制流和函数逻辑；不要靠“闭源”隐藏密钥或算法漏洞。'],
  ['用 <code>extcodesize(msg.sender) == 0</code> 就能 100% 拦住智能合约调用', '攻击合约在自己的 <code>constructor</code> 构造函数里调用目标合约时，自身字节码尚未上链，<code>extcodesize</code> 返回 0，可以轻松绕过。']
])}
${recap([
  'EVM 内存由 0x00 暂存区、0x40 空闲指针、0x60 零槽和 0x80+ 动态区组成，写汇编必须严格维护指针与零槽不变性。',
  'Yul 汇编默认无溢出检查、无 address 高位清理，必须防范 Return Bomb 与 EOA 静默成功陷阱。',
  '链上无秘密：Heimdall / Dedaub 反编译结合 <code>cast run --trace</code> 是应急复盘未开源攻击合约的标准工具链。',
  'EIP-1153 瞬态存储（TLOAD/TSTORE）让跨调用共享临时状态（重入锁、闪电记账）成本大幅下降。'
])}
${quiz([
  { q: '在 Solidity 合约的 EVM 内存布局中，地址 <code>0x40</code> 存放的是什么？', o: ['合约的 owner 地址', '空闲内存指针（Free Memory Pointer），指示下一段可安全分配的内存起始偏移量', '当前区块的哈希值', '永久零槽，必须永远保持为 0'], a: 1, why: '0x40 存放空闲内存指针（初始为 0x80）；永久零槽在 0x60，暂存区在 0x00–0x3f。' },
  { q: '为什么在 Yul 内联汇编里调用一个没有部署代码的 EOA 地址（<code>call(gas(), eoa, 0, ...)</code>）时，不能只看返回值 <code>ok == 1</code> 就认为 ERC-20 转账成功？', o: ['EOA 地址会拒绝所有 call', 'EVM 规定向无代码地址发起 call 也会返回 1（成功）且 returndatasize 为 0，必须额外检查 extcodesize(token) > 0', 'EOA 会返回 2', 'call 只能调用合约不能调用 EOA'], a: 1, why: '向空地址发起 call 不会 revert，因此必须检查目标确实是合约且返回为空或布尔 true。' },
  { q: '面对一个在 Etherscan 上未开源验证的黑客攻击合约，安全研究员想在 2 分钟内还原攻击手法，最有效的组合是？', o: ['直接联系以太坊基金会索要源码', '用 Heimdall / Dedaub 反编译字节码，并用 Foundry cast run --trace 或 Tenderly 逐步查看真实攻击交易的内部调用栈', '把字节码当成 UTF-8 文本直接用记事本打开', '暴力猜测源码直到编译哈希一致'], a: 1, why: '反编译工具可还原函数路由与控制流，结合真实交易 Trace 能精准定位漏洞触发路径与资金流向。' },
  { q: 'EIP-1153 引入的 <code>TLOAD</code> / <code>TSTORE</code>（瞬态存储）最适合下面哪种场景？', o: ['永久保存用户的 ERC-20 余额', '单笔交易内生效、交易结束自动清零的重入锁或闪电记账状态', '替代区块链共识层存储历史区块', '跨链传输 NFT 元数据'], a: 1, why: '瞬态存储仅在单笔交易生命周期内存在，Gas 仅约 100 且无需手动清零退款，非常适合重入锁和 Uniswap V4 闪电记账。' }
])}
${terms([
  ['Yul', 'Yul Intermediate Language', 'Solidity 内置的底层中间汇编语言，可直接调用 EVM 操作码操作栈、内存与存储。'],
  ['空闲内存指针', 'Free Memory Pointer (0x40)', '固定位于内存偏移 0x40 处、指向当前未分配内存起始位置的指针。'],
  ['返回值炸弹', 'Return Bomb', '恶意合约返回超大字节数据，诱使调用方无上限拷贝进内存从而触发二次方 Gas 耗尽的攻击手法。'],
  ['瞬态存储', 'Transient Storage (EIP-1153)', '仅在单笔交易内持久、交易结束自动清空的低成本存储空间（TLOAD/TSTORE）。'],
  ['字节码反编译', 'Bytecode Decompilation', '将链上未开源的十六进制 EVM 字节码还原为可读控制流与类 Solidity 伪代码的逆向分析技术。']
])}
` });
})();
