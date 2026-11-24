/* ---------- Labs M02 合约进阶: proxy ---------- */
(() => {

addLab('proxy', {
  ch: 'm02-66', title: '代理合约存储槽冲突模拟器', desc: '对比 V1 升级到 V2 时的四种存储布局写法（末尾追加 / 中间插入 / 类型改宽 / ERC-7201 命名空间），观察每个存储槽读出的真实值是否错位。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 先看“末尾追加（安全）”，确认 V1 的 owner 和 totalAssets 原样读出。② 切换到“中间插入新变量”，看 V2 读出的 totalAssets 和 feeBps 发生了什么。③ 切换到“类型改宽”，看打包槽位被撑爆后的连锁错位。④ 切换到“ERC-7201 命名空间”，观察独立哈希槽位如何彻底隔离。</div>
    <div class="row-btns">${segHtml('mode', [
      ['append', '末尾追加（安全）'],
      ['insert', '中间插入（冲突）'],
      ['widen', '类型改宽（冲突）'],
      ['erc7201', 'ERC-7201 命名空间']
    ], 'append')}</div>
    <div class="stats" data-s></div>
    <div class="log" data-raw></div>
    <div class="verdict" data-vd></div>`;

    // V1 已经写入 Proxy 的真实底层槽位数据（示例）
    const V1 = [
      { slot: 'Slot 0', raw: '0x0000...0001_a1b2c3d4e5f6...7890', v1Meaning: 'address owner (0xa1b2...7890) + bool paused (true，打包同槽)' },
      { slot: 'Slot 1', raw: '0x0000...0000000000000000000f4240', v1Meaning: 'uint256 totalAssets = 1,000,000' },
      { slot: 'Slot 2', raw: '0x0000...00000000000000000000001e', v1Meaning: 'uint256 feeBps = 30 (0.30%)' },
      { slot: 'Slot 3', raw: '0x0000...000000000000000000000000', v1Meaning: '空闲（0）' }
    ];

    const renderMode = mode => {
      let rows = [], broken = 0, ownerRead = '0xa1b2...7890', assetsRead = '1,000,000', feeRead = '30 bps', note = '', cls = 'ok';
      if (mode === 'append') {
        rows = [
          ['Slot 0', V1[0].v1Meaning, 'owner + paused（完全匹配）', '正常'],
          ['Slot 1', V1[1].v1Meaning, 'totalAssets = 1,000,000', '正常'],
          ['Slot 2', V1[2].v1Meaning, 'feeBps = 30', '正常'],
          ['Slot 3', V1[3].v1Meaning, '新增 uint256 cap = 0（可在升级时初始化）', '正常']
        ];
        note = '安全：在旧变量末尾追加新变量不会移动 Slot 0–2 的偏移量，已有用户状态 100% 保持一致。';
      } else if (mode === 'insert') {
        broken = 2;
        assetsRead = '30（错读为旧 feeBps！）';
        feeRead = '0（读到空槽！）';
        cls = 'risk';
        rows = [
          ['Slot 0', V1[0].v1Meaning, 'owner + paused（匹配）', '正常'],
          ['Slot 1', V1[1].v1Meaning, '新增 address guardian ← 错把 1,000,000 当成地址 0x000...0f4240！', '错位！'],
          ['Slot 2', V1[2].v1Meaning, 'totalAssets ← 错把旧 feeBps=30 当成总资产！', '错位！'],
          ['Slot 3', V1[3].v1Meaning, 'feeBps ← 读出 0！', '错位！']
        ];
        note = '致命冲突：在 Slot 0 与 Slot 1 之间插入了 address guardian，导致后面全部槽位下移一位，资产总额瞬间从 1,000,000 变成 30，协议账本崩溃。';
      } else if (mode === 'widen') {
        broken = 3;
        ownerRead = '0xa1b2...7890（正常）';
        assetsRead = '1（错读为旧 paused！）';
        feeRead = '1,000,000 bps（错读为旧总资产！）';
        cls = 'risk';
        rows = [
          ['Slot 0', V1[0].v1Meaning, 'address owner（现在独占 Slot 0；把旧 paused 位丢弃）', '高位脏数据'],
          ['Slot 1', V1[1].v1Meaning, 'uint256 pausedFlag（改宽后挤进 Slot 1）← 错读 1,000,000', '错位！'],
          ['Slot 2', V1[2].v1Meaning, 'totalAssets ← 错读旧 feeBps = 30', '错位！'],
          ['Slot 3', V1[3].v1Meaning, 'feeBps ← 错读 0', '错位！']
        ];
        note = '致命冲突：把与 address 打包在 Slot 0 的 bool 改成 uint256，挤占了 Slot 1，引发后续所有变量连锁错位。';
      } else {
        cls = 'ok';
        rows = [
          ['Slot 0–2', 'V1 原始槽位保持原样', 'V1 状态不受任何新模块影响', '隔离'],
          ['0x7a4e...4f00', 'ERC-7201 命名空间 VaultV2 起始槽', 'struct VaultV2Storage { cap, guardian }', '独立槽位'],
          ['0x3608...bbc', 'EIP-1967 实现地址固定槽', 'impl = 0xNewImplV2...', '标准隔离']
        ];
        note = '推荐方案：ERC-7201 将新模块或新版本结构体映射到独立哈希槽位，彻底消除多继承顺序与变量插入带来的存储碰撞风险。';
      }

      $('[data-s]', el).innerHTML =
        stat('V2 读出 owner', ownerRead, broken ? 'warn' : 'ok') +
        stat('V2 读出 totalAssets', assetsRead, broken ? 'risk' : 'ok') +
        stat('V2 读出 feeBps', feeRead, broken ? 'risk' : 'ok') +
        stat('冲突槽位数', broken + ' 个', broken ? 'risk' : 'ok');

      $('[data-raw]', el).innerHTML = rows.map(r => `<b>${r[0]}</b> | V1 写入：${r[1]} → V2 读取：${r[2]} [<b>${r[3]}</b>]`).join('<br>');
      const vd = $('[data-vd]', el);
      vd.className = 'verdict ' + cls;
      vd.textContent = note;
    };

    seg(el, 'mode', renderMode);
    renderMode('append');
  }
});

})();
