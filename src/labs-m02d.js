/* ---------- M02 补充实验：ABI 编码器、存储槽计算器 ---------- */
(() => {
const pad32 = h => h.padStart(64, '0');
const padR32 = h => h + '0'.repeat((64 - (h.length % 64)) % 64);
const MAXU = (1n << 256n) - 1n;
const bytesToHex = a => a.map(b => b.toString(16).padStart(2, '0')).join('');
const short = h => h.length > 18 ? '0x' + h.slice(0, 8) + '…' + h.slice(-6) : '0x' + h;

addLab('abi', {
  ch: 'm02-2', title: 'ABI 编码器：函数调用如何变成 calldata', desc: '选一个函数，改参数，看选择器和每个 32 字节字的含义；字符串和数组会出现“偏移量 + 长度 + 内容”的动态编码。',
  mount(el, p) {
    const FN = {
      transfer: { sig: 'transfer(address,uint256)', types: ['address', 'uint256'], names: ['to', 'amount'], def: ['0x1111111111111111111111111111111111111111', '100'] },
      approve: { sig: 'approve(address,uint256)', types: ['address', 'uint256'], names: ['spender', 'amount'], def: ['0x2222222222222222222222222222222222222222', '1000000'] },
      msg: { sig: 'setMessage(uint256,string)', types: ['uint256', 'string'], names: ['id', 'text'], def: ['7', '你好'] },
      batch: { sig: 'batch(uint256[])', types: ['uint256[]'], names: ['values'], def: ['1,2,3'] }
    };
    let cur = 'transfer', vals = FN.transfer.def.slice();
    el.innerHTML = `<div class="try"><b>试一试：</b>① 选 transfer，把金额从 100 改成 255，只有最后一个字的末尾变化。② 选 setMessage，输入不同长度的文字，观察“偏移量”和“长度”两个字。③ 选 batch，增加数组元素，看数组长度字和元素字如何增加。</div>
    <div>${segHtml('fn', [['transfer', 'transfer'], ['approve', 'approve'], ['msg', 'setMessage'], ['batch', 'batch']], cur)}</div>
    <div class="ctrls" id="${p}-args"></div>
    <div class="stats" id="${p}-stats"></div>
    <div class="verdict info" data-vd></div>
    <div class="table-wrap"><table><thead><tr><th>位置</th><th>32 字节字（十六进制）</th><th>含义</th></tr></thead><tbody id="${p}-rows"></tbody></table></div>`;
    const argsBox = $(`#${p}-args`, el), rows = $(`#${p}-rows`, el), stats = $(`#${p}-stats`, el), vd = $('[data-vd]', el);

    function encode(f, v) {
      const heads = [], tails = [];
      const headBytes = f.types.length * 32;
      let tailBytes = 0;
      f.types.forEach((t, i) => {
        const raw = String(v[i] == null ? '' : v[i]).trim(), nm = f.names[i];
        if (t === 'address') {
          if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) throw new Error(`${nm}：地址必须是 0x 开头的 40 位十六进制`);
          heads.push([pad32(raw.slice(2).toLowerCase()), `${nm}：地址，左侧补 12 字节 0`]);
        } else if (t === 'uint256') {
          if (!/^\d+$/.test(raw) || BigInt(raw) > MAXU) throw new Error(`${nm}：请输入非负整数`);
          heads.push([pad32(BigInt(raw).toString(16)), `${nm} = ${raw}，大端对齐，左侧补 0`]);
        } else {
          let words;
          if (t === 'string') {
            const b = bytesToHex(utf8Bytes(raw));
            words = [[pad32((b.length / 2).toString(16)), `${nm} 的长度：${b.length / 2} 字节（UTF-8，一个汉字占 3 字节）`]];
            for (let o = 0; o < b.length; o += 64) words.push([padR32(b.slice(o, o + 64)), o === 0 ? `${nm} 的内容，右侧补 0 到 32 字节` : '内容（续）']);
          } else {
            const items = raw === '' ? [] : raw.split(',').map(x => x.trim());
            if (items.some(x => !/^\d+$/.test(x) || BigInt(x) > MAXU)) throw new Error(`${nm}：用英文逗号分隔非负整数，例如 1,2,3`);
            if (items.length > 8) throw new Error('本实验最多 8 个元素');
            words = [[pad32(items.length.toString(16)), `${nm} 的元素个数：${items.length}`]];
            items.forEach((x, j) => words.push([pad32(BigInt(x).toString(16)), `${nm}[${j}] = ${x}`]));
          }
          heads.push([pad32((headBytes + tailBytes).toString(16)), `${nm} 的偏移量：数据从参数区起点后第 ${headBytes + tailBytes} 字节开始`]);
          tails.push(...words);
          tailBytes += words.length * 32;
        }
      });
      return heads.concat(tails);
    }

    function draw() {
      const f = FN[cur];
      try {
        const sel = keccakStr(f.sig).slice(0, 8);
        const words = encode(f, vals);
        const data = sel + words.map(w => w[0]).join('');
        const bytes = hexBytes(data);
        const zero = bytes.filter(b => b === 0).length, nz = bytes.length - zero;
        let r = `<tr><td class="mono">0x00</td><td class="mono"><strong>${sel}</strong></td><td>函数选择器：keccak256(“${f.sig}”) 的前 4 字节</td></tr>`;
        words.forEach((w, i) => { r += `<tr><td class="mono">0x${(4 + i * 32).toString(16).padStart(2, '0')}</td><td class="mono" style="overflow-wrap:anywhere">${w[0].replace(/^(0+)/, '<span class="muted">$1</span>')}</td><td>${w[1]}</td></tr>`; });
        rows.innerHTML = r;
        stats.innerHTML = stat('选择器', '0x' + sel) + stat('calldata 总字节', bytes.length) + stat('零字节 / 非零字节', `${zero} / ${nz}`) + stat('calldata 的 Gas', fmtN(zero * 4 + nz * 16, 0), 'warn');
        vd.className = 'verdict info'; vd.textContent = `完整 calldata 共 ${bytes.length} 字节。零字节每个 4 Gas，非零字节每个 16 Gas（EIP-2028），所以填充的 0 很便宜，数据本身贵。`;
      } catch (e) {
        rows.innerHTML = ''; stats.innerHTML = '';
        vd.className = 'verdict warn'; vd.textContent = e.message;
      }
    }
    function drawArgs() {
      const f = FN[cur];
      argsBox.innerHTML = f.types.map((t, i) => `<label class="rng" for="${p}-a${i}"><span>${f.names[i]}（${t}）</span><input type="text" id="${p}-a${i}" data-i="${i}" value="${esc(vals[i])}" style="grid-column:1/-1;width:100%"></label>`).join('');
      $$('input', argsBox).forEach(inp => inp.addEventListener('input', () => { vals[+inp.dataset.i] = inp.value; draw(); }));
      draw();
    }
    seg(el, 'fn', v => { cur = v; vals = FN[v].def.slice(); drawArgs(); });
    drawArgs();
  }
});

addLab('slot', {
  ch: 'm02-6', title: '存储槽计算器：mapping 和动态数组的数据在哪', desc: '输入变量所在的槽号和键，算出 mapping 值、嵌套 mapping 值、动态数组元素的真实存储槽，并生成 cast storage 命令。',
  mount(el, p) {
    let mode = 'map';
    el.innerHTML = `<div class="try"><b>试一试：</b>① 选“mapping”，槽号 0，键 0：结果以 290decd9 开头，这是“32 个 0 的哈希”。② 把键改成一个地址，看槽位完全不同。③ 选“动态数组”，下标从 0 改到 1，槽号只加 1：数组元素在同一段连续的槽里。</div>
    <div>${segHtml('mode', [['map', 'mapping'], ['nested', '嵌套 mapping'], ['arr', '动态数组']], mode)}</div>
    <div class="ctrls">
      <label class="rng" for="${p}-p"><span>变量声明所在的槽号 p</span><input type="number" id="${p}-p" data-k="p" min="0" step="1" value="0" style="grid-column:1/-1;width:100%"></label>
      <label class="rng" for="${p}-k1" data-show="map nested"><span>键 key（0x 十六进制或十进制整数）</span><input type="text" id="${p}-k1" data-k="k1" value="0x1111111111111111111111111111111111111111" style="grid-column:1/-1;width:100%"></label>
      <label class="rng" for="${p}-k2" data-show="nested"><span>第二层键 key2</span><input type="text" id="${p}-k2" data-k="k2" value="0x2222222222222222222222222222222222222222" style="grid-column:1/-1;width:100%"></label>
      <label class="rng" for="${p}-i" data-show="arr"><span>数组下标 i（元素占 1 个槽）</span><input type="number" id="${p}-i" data-k="i" min="0" step="1" value="0" style="grid-column:1/-1;width:100%"></label>
      <label class="rng" for="${p}-c"><span>合约地址（用于生成命令）</span><input type="text" id="${p}-c" data-k="c" value="0xYourContract" style="grid-column:1/-1;width:100%"></label>
    </div>
    <div class="stats" id="${p}-stats"></div>
    <div class="verdict info" data-vd></div>
    <div class="log" id="${p}-log"></div>`;
    const stats = $(`#${p}-stats`, el), vd = $('[data-vd]', el), log = $(`#${p}-log`, el);
    const w32 = raw => {
      raw = String(raw).trim();
      if (/^0x[0-9a-fA-F]*$/.test(raw) && raw.length > 2) { const h = raw.slice(2).toLowerCase(); if (h.length > 64) throw new Error('键太长'); return pad32(h); }
      if (/^\d+$/.test(raw) && BigInt(raw) <= MAXU) return pad32(BigInt(raw).toString(16));
      throw new Error('键请输入 0x 十六进制或十进制整数');
    };
    const hashHex = hex => keccak256(Uint8Array.from(hexBytes(hex)));
    let st = { p: '0', k1: '0x1111111111111111111111111111111111111111', k2: '0x2222222222222222222222222222222222222222', i: '0', c: '0xYourContract' };
    function draw() {
      $$('[data-show]', el).forEach(l => { l.hidden = !l.dataset.show.split(' ').includes(mode); });
      try {
        if (!/^\d+$/.test(String(st.p))) throw new Error('槽号请输入非负整数');
        const pw = pad32(BigInt(st.p).toString(16));
        let slot, steps = [];
        if (mode === 'map') {
          const kw = w32(st.k1), inner = hashHex(kw + pw);
          slot = inner;
          steps = [`slot = keccak256( key ‖ p )`, `key = ${short(kw)}`, `p   = ${short(pw)}`, `slot = 0x${slot}`];
        } else if (mode === 'nested') {
          const k1 = w32(st.k1), k2 = w32(st.k2), mid = hashHex(k1 + pw);
          slot = hashHex(k2 + mid);
          steps = [`第一层：mid = keccak256( key ‖ p ) = 0x${mid}`, `第二层：slot = keccak256( key2 ‖ mid )`, `slot = 0x${slot}`];
        } else {
          if (!/^\d+$/.test(String(st.i))) throw new Error('下标请输入非负整数');
          const base = hashHex(pw);
          slot = pad32((BigInt('0x' + base) + BigInt(st.i)).toString(16));
          steps = [`数组长度存放在槽 p 本身`, `元素起点：base = keccak256( p ) = 0x${base}`, `元素 ${st.i} 的槽：base + ${st.i}`, `slot = 0x${slot}`];
        }
        stats.innerHTML = stat('目标槽（十六进制）', short(slot), 'ok') + stat('模式', { map: 'mapping(K => V)', nested: 'mapping(K1 => mapping(K2 => V))', arr: 'V[]（V 占 1 槽）' }[mode]);
        vd.className = 'verdict ok'; vd.textContent = '这个槽就是 SLOAD / SSTORE 实际读写的位置。键本身不会被存储，所以 mapping 无法遍历。';
        log.innerHTML = steps.map(s => `<div>${esc(s)}</div>`).join('') + `<div class="info">$ cast storage ${esc(st.c)} 0x${slot} --rpc-url $RPC</div>`;
      } catch (e) {
        stats.innerHTML = ''; log.innerHTML = ''; vd.className = 'verdict warn'; vd.textContent = e.message;
      }
    }
    $$('[data-k]', el).forEach(i => i.addEventListener('input', () => { st[i.dataset.k] = i.value; draw(); }));
    seg(el, 'mode', v => { mode = v; draw(); });
    draw();
  }
});
})();
