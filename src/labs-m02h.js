/* ---------- Labs M02 团队级 OpSec: blindsign ---------- */
(() => {

addLab('blindsign', {
  ch: 'm02-67', title: '多签盲签排雷模拟器', desc: '模拟 Safe 多签签名人的真实决策场景：对比“网页前端展示内容”与“独立解码的原始交易参数 / 硬件屏哈希”，识别隐藏的 DELEGATECALL 替换与钓鱼授权。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 依次切换 4 个真实感多签待签场景。② 对比“网页 UI 展示”和“独立工具解码的真实 calldata + 硬件屏哈希”。③ 先自己判断该“批准签名”还是“立刻拒绝”，再点击下方按钮验证结果。</div>
    <div class="row-btns">${segHtml('sc', [
      ['s1', '场景 1：归集 500 万 USDC'],
      ['s2', '场景 2：发放季度做市资金'],
      ['s3', '场景 3：热钱包日常补币'],
      ['s4', '场景 4：例行升级代理实现']
    ], 's1')}</div>
    <div class="two" data-cmp></div>
    <div class="row-btns" style="margin-top:4px">${segHtml('act', [
      ['wait', '先核对，再选操作…'],
      ['approve', '确认并按下硬件签名'],
      ['reject', '立刻拒绝并拉起战时室']
    ], 'wait')}</div>
    <div class="verdict" data-vd></div>`;

    const CASES = {
      s1: {
        ui: '转账 5,000,000 USDC 至机构冷金库 0xCold...8899',
        op: '1 (DELEGATECALL) ⚠️',
        to: '0x9622...MaliciousImpl（未验证新合约）',
        sel: '0xa9059cbb（伪装外壳，内部改写 Slot 0 实现地址！）',
        hashMatch: '不一致（网页 0x4b1a... ≠ 硬件屏 0x9f8e...）',
        safe: false,
        whyOk: '踩雷被盗！这是典型的 Bybit 式前端篡改攻击：普通 USDC 转账绝不该出现 operation = 1 (DELEGATECALL)，且硬件屏哈希与独立工具算出的结果不符，一旦签名整个 Safe 多签控制权瞬间移交黑客。',
        whyRej: '排雷成功！你精准抓住了两个致命红旗：① 资金转账却出现 operation = 1 (DELEGATECALL)；② 硬件屏哈希与独立解码不一致。应立即拒绝、通知其他签名人停签并排查前端/插件供应链。'
      },
      s2: {
        ui: '授权做市商子账户 200,000 USDC',
        op: '0 (CALL)',
        to: '0xA0b8...eB48（官方 USDC 合约）',
        sel: 'approve(0xUnknownEOA...4411, 2^256 - 1 无限额度！)',
        hashMatch: '一致（但独立解码发现额度为无限且 spender 非白名单）',
        safe: false,
        whyOk: '踩雷被盗！虽然哈希一致且是普通 CALL，但独立解码暴露了两个陷阱：授权对象是未登记的陌生地址，且额度被恶意改成了 uint256 最大值（无限授权），金库内全部 USDC 会被一笔转空。',
        whyRej: '排雷成功！只看哈希一致还不够，必须核对独立解码后的函数参数：严禁对未知 spender 签无限 approve，且资金合作应走限定额度或子账户隔离。'
      },
      s3: {
        ui: '向交易所热钱包补币 150 ETH',
        op: '0 (CALL)',
        to: '0xHotW...3321（白名单热钱包，与语音复核首尾一致）',
        sel: '0x（纯 ETH 转账，value = 150 ETH，data 为空）',
        hashMatch: '100% 逐字一致（独立工具 0x7c2d... === 硬件屏 0x7c2d...）',
        safe: true,
        whyOk: '放行正确！operation = 0、目标地址在白名单且经语音复核、data 为空、独立工具算出的 domainHash/messageHash 与硬件钱包屏幕逐字符吻合，符合零盲签 SOP。',
        whyRej: '过度拦截（可接受的安全保守，但本笔实际合规）：所有字段均已通过独立解码、白名单和硬件屏逐字比对，确认语音口令无误后可正常放行。'
      },
      s4: {
        ui: '将 VaultV1 升级至已审计的 VaultV2（绕过 48 小时时间锁）',
        op: '0 (CALL)',
        to: '0xVaultProxy...1100',
        sel: 'upgradeToAndCall(0xUnverifiedV2...9999, 0x...)',
        hashMatch: '一致，但目标新实现合约未在 Etherscan 开源且与审计 commit 字节码不匹配',
        safe: false,
        whyOk: '踩雷被盗！新实现合约字节码与审计报告 commit 不一致，且企图跳过 48 小时 Timelock 公示期——这是典型的社工催促或部署脚本被投毒场景，绝不可盲目放行。',
        whyRej: '排雷成功！合约升级必须核对链上字节码哈希与审计 commit 一致、走完 CI 存储布局检查，并通过标准 Timelock 流程公示，拒绝任何“紧急绕过时间锁”的可疑升级单。'
      }
    };

    let cur = 's1', act = 'wait';
    const render = () => {
      const c = CASES[cur];
      $('[data-cmp]', el).innerHTML =
        `<div class="stat"><div class="k">网页前端 UI 展示给你的内容</div><div class="small" style="margin-top:6px"><b>操作说明：</b>${esc(c.ui)}</div></div>` +
        `<div class="stat ${c.safe ? 'ok' : 'warn'}"><div class="k">独立工具解码 + 硬件钱包屏幕实测</div><div class="small mono" style="margin-top:6px;line-height:1.7">operation: ${esc(c.op)}<br>to: ${esc(c.to)}<br>calldata: ${esc(c.sel)}<br>哈希比对: ${esc(c.hashMatch)}</div></div>`;
      const vd = $('[data-vd]', el);
      if (act === 'wait') {
        vd.className = 'verdict info';
        vd.textContent = '请先仔细核对右侧“独立工具解码与硬件屏哈希”中的 operation、目标地址、calldata 参数与哈希比对结果，再点击上方按钮做出判断。';
      } else if (act === 'approve') {
        vd.className = 'verdict ' + (c.safe ? 'ok' : 'risk');
        vd.textContent = c.whyOk;
      } else {
        vd.className = 'verdict ' + (c.safe ? 'warn' : 'ok');
        vd.textContent = c.whyRej;
      }
    };

    const SAct = seg(el, 'act', v => { act = v; render(); });
    seg(el, 'sc', v => {
      cur = v; act = 'wait';
      $$('[data-seg="act"] button', el).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === 'wait' ? 'true' : 'false'));
      render();
    });
    render();
  }
});

})();
