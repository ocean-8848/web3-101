/* ---------- Labs M14 应用赛道: cid ---------- */
(() => {

addLab('cid', {
  ch: 'm09-3', title: '内容寻址实验室', desc: '输入一段内容，算出它的 SHA-256 和 IPFS CIDv1；再模拟网关返回被篡改的内容，看客户端怎样用 CID 发现问题。',
  mount(el, p) {
    el.innerHTML = `<div class="try"><b>试一试：</b>① 记下“原始内容”的 CID。② 在“原始内容”末尾加一个空格，看 CID 怎样整体改变。③ 把“网关返回的内容”改掉一个字，或点“模拟篡改”，看校验结果。④ 点“恢复”，校验重新通过。</div>
    <div class="two">
      <label class="rng" for="${p}-src"><span>原始内容（发布者上传）</span><textarea id="${p}-src" data-k="src" rows="4" spellcheck="false">{"name":"Badge #1","image":"ipfs://bafy.../1.png"}</textarea></label>
      <label class="rng" for="${p}-got"><span>网关返回的内容（下载者收到）</span><textarea id="${p}-got" data-k="got" rows="4" spellcheck="false">{"name":"Badge #1","image":"ipfs://bafy.../1.png"}</textarea></label>
    </div>
    <div class="row-btns">${segHtml('act', [['same', '恢复：返回原内容'], ['tamper', '模拟篡改：换掉图片地址']], 'same')}</div>
    <div class="stats" data-s></div>
    <div class="log" data-raw></div>
    <div class="verdict" data-vd></div>`;

    const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
    // RFC 4648 base32，小写、无填充；IPFS 的 multibase 前缀 b 表示这种编码
    const base32 = bytes => { let bits = 0, v = 0, out = ''; for (const x of bytes) { v = (v << 8) | x; bits += 8; while (bits >= 5) { out += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } v &= 255; } if (bits > 0) out += B32[(v << (5 - bits)) & 31]; return out; };
    const hex2 = h => { const a = []; for (let i = 0; i < h.length; i += 2) a.push(parseInt(h.slice(i, i + 2), 16)); return a; };
    // CIDv1 = 版本 0x01 + 编解码 raw 0x55 + 多哈希（sha2-256 0x12，长度 0x20，摘要）
    const cidOf = str => { const d = sha256(str); return { d, cid: 'b' + base32([0x01, 0x55, 0x12, 0x20, ...hex2(d)]) }; };
    const bytesLen = str => unescape(encodeURIComponent(str)).length;

    const srcEl = $(`#${p}-src`, el), gotEl = $(`#${p}-got`, el);
    const S = seg(el, 'act', v => {
      gotEl.value = v === 'same' ? srcEl.value : srcEl.value.replace(/ipfs:\/\/[^"]*/, 'https://evil.example/1.png');
      B.upd();
    });
    const B = bindInputs(el, {}, v => {
      const a = cidOf(v.src), b = cidOf(v.got);
      const ok = a.cid === b.cid;
      $('[data-s]', el).innerHTML = stat('内容字节数', fmtN(bytesLen(v.src), 0)) + stat('请求的 CID（前 16 位）', esc(a.cid.slice(0, 16)) + '…', 'info') + stat('收到内容的 CID（前 16 位）', esc(b.cid.slice(0, 16)) + '…', ok ? 'ok' : 'risk');
      let diff = 0; for (let i = 0; i < 64; i++) if (a.d[i] !== b.d[i]) diff++;
      $('[data-raw]', el).innerHTML = `请求 CID: ${esc(a.cid)}<br>SHA-256: ${a.d}<br><br>收到 CID: ${esc(b.cid)}<br>SHA-256: ${b.d}<br><br>两个摘要有 ${diff} / 64 个十六进制位不同。`;
      const vd = $('[data-vd]', el);
      if (ok) { vd.className = 'verdict ok'; vd.textContent = '校验通过：收到的内容重新计算出的 CID 与请求的 CID 相同。无论哪个网关或节点提供，内容都没有被改动。'; }
      else { vd.className = 'verdict risk'; vd.textContent = '校验失败：收到内容的 CID 与请求的不同。只改一个字符，摘要也几乎全部改变。客户端应丢弃这份数据，换一个节点或网关重新获取。'; }
    });
    srcEl.addEventListener('input', () => { if (S.get() === 'same') { gotEl.value = srcEl.value; B.upd(); } });
  }
});

})();
