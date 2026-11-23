/* ---------- core: registry, content helpers, router, diagrams, search ---------- */
const H = { ch: [], byId: {}, labs: {}, mmd: [], terms: [] };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let CUR = null; // chapter id while chapter files load (for terms)

/* Article ids are stable (links and saved progress keep working); the displayed order and numbering come from these maps.
   MOD_DISPLAY: internal module id -> displayed module number.  SUB_DISPLAY: article id -> displayed article number. */
/* 2026-11 restructure: part 1 公共基础 M00-M05, part 2 应用领域 M06-M11, part 3 毕业项目 M12.
   m13 = DeFi (articles keep their m02-* ids), the ZK articles m10-* now live in the public-chain module m05. */
const MOD_DISPLAY = { m00: 0, m01: 1, m02: 2, m07: 3, m05: 4, m11: 5, m13: 6, m03: 7, m04: 8, m08: 9, m06: 10, m09: 11, m12: 12 };
const MOD_OF = { 'm02-9': 'm13', 'm02-10': 'm13', 'm02-11': 'm13', 'm02-60': 'm13', 'm02-61': 'm13', 'm02-12': 'm13', 'm02-63': 'm13', 'm02-64': 'm13', 'm02-65': 'm13',
  'm06-5': 'm03',
  'm10-1': 'm05', 'm10-2': 'm05', 'm10-3': 'm05', 'm10-4': 'm05', 'm10-5': 'm05', 'm10-6': 'm05', 'm10-7': 'm05' };
/* old ids that are no longer pages: the hash is redirected */
const ALIAS = { m10: 'm10-1', 'm10-quiz': 'm05-quiz' };
/* parts of the book, by displayed module number */
const BOOK_PARTS = [{ name: '第一部分 · 公共基础', from: 0, to: 5 }, { name: '第二部分 · 应用领域', from: 6, to: 11 }, { name: '第三部分 · 毕业项目', from: 12, to: 12 }];
const isFoundation = c => c.modNo <= 5;
/* section headings inside a module: shown before the given article in the nav and in the overview cards */
const PART = { 'm04-70': '开篇：总对照', 'm04-1': 'CEX 篇', 'm04-71': 'DEX 篇',
  'm05-1': '以太坊与扩容', 'm10-1': '零知识与隐私计算', 'm05-11': '非 EVM 链与跨链', 'm05-9': '链上数据与取证' };
const SUB_DISPLAY = {
  'm01-50': 10,
  /* contracts M02 */
  'm02-50': 6, 'm02-6': 7, 'm02-7': 8, 'm02-8': 9, 'm02-62': 10,
  /* DeFi M06 (module m13) */
  'm02-9': 1, 'm02-10': 2, 'm02-11': 3, 'm02-63': 4, 'm02-64': 5, 'm02-60': 6, 'm02-61': 7, 'm02-65': 8, 'm02-12': 9,
  'm07-50': 11,
  /* wallet M07: account abstraction (internal m06-5) sits between gas strategy and the enterprise design */
  'm06-5': 8, 'm03-8': 9, 'm03-9': 10, 'm03-50': 11,
  /* exchange module (internal m04): overview, CEX part 2-12, DEX part 13-20 */
  'm04-70': 1, 'm04-1': 2, 'm04-2': 3, 'm04-3': 4, 'm04-4': 5, 'm04-5': 6, 'm04-6': 7, 'm04-7': 8, 'm04-8': 9, 'm04-9': 10, 'm04-10': 11, 'm04-50': 12,
  'm04-71': 13, 'm04-72': 14, 'm04-73': 15, 'm04-74': 16, 'm04-75': 17, 'm04-76': 18, 'm04-77': 19, 'm04-78': 20,
  /* public chains & cryptography M04 (module m05): Ethereum & scaling 1-9, ZK & privacy computing 10-16, non-EVM & bridges 17-25, data & forensics 26-28 */
  'm05-10': 8, 'm05-50': 9,
  'm10-1': 10, 'm10-2': 11, 'm10-3': 12, 'm10-4': 13, 'm10-5': 14, 'm10-6': 15, 'm10-7': 16,
  'm05-11': 17, 'm05-12': 18, 'm05-60': 19, 'm05-61': 20, 'm05-62': 21, 'm05-63': 22, 'm05-64': 23, 'm05-65': 24,
  'm05-68': 25, 'm05-8': 26, 'm05-9': 27, 'm05-66': 28, 'm05-67': 29,
  /* agent M10: account abstraction moved out; AI x crypto overview added before the project */
  'm06-6': 5, 'm06-7': 6, 'm06-8': 7, 'm06-60': 8, 'm06-9': 9, 'm06-50': 10,
  /* more application sectors M11: NFT markets & memecoins before the project */
  'm09-7': 6, 'm09-6': 7,
  'm08-50': 12
};
/* optional articles in the foundation part, with the scenarios that need them; every other foundation article is required */
const OPTIONAL = (() => {
  const o = {}, put = (ids, why) => ids.forEach(id => { o[id] = why; });
  put(['m01-6', 'm01-7', 'm01-8', 'm01-9', 'm01-50'], '后端 / 钱包 / 交易所开发');
  put(['m02-6'], '合约开发（上线前优化 Gas）');
  put(['m02-8', 'm02-62'], '合约开发 / 安全审计');
  put(['m07-9', 'm07-10', 'm07-50'], '前端开发');
  put(['m05-6', 'm05-10', 'm05-50'], '后端 / 钱包 / 交易所（自建节点与 RPC）');
  put(['m05-7'], 'DeFi / 交易所 / 交易类 Agent');
  put(['m10-2', 'm10-3', 'm10-4', 'm10-5', 'm10-6', 'm10-7'], 'ZK Rollup / 隐私协议 / 链上身份 / 协议研究');
  put(['m05-11', 'm05-12', 'm05-60', 'm05-61', 'm05-62', 'm05-63', 'm05-64', 'm05-65'], '多链钱包 / 交易所 / 协议研究');
  put(['m05-68'], '多链钱包 / 交易所 / 稳定币支付（USDT 大量在 Tron 上流转）');
  put(['m05-8'], '跨链产品 / 钱包 / 交易所 / 安全');
  put(['m05-9', 'm05-66', 'm05-67'], '数据分析 / 风控 / 合规 / 交易所');
  put(['m11-2', 'm11-3', 'm11-4', 'm11-5', 'm11-6'], '托管钱包 / 交易所 / 支付 / RWA');
  return o;
})();
function addCh(c) {
  const m = c.id.match(/^(m\d\d)(?:-(\d+))?$/);
  if (m) {
    c.mod = MOD_OF[c.id] || m[1]; c.sub = m[2] ? (SUB_DISPLAY[c.id] || +m[2]) : 0; c.group = 'core';
    c.modNo = MOD_DISPLAY[c.mod];
    if (!c.code) c.code = 'M' + String(c.modNo).padStart(2, '0') + (c.sub ? '.' + c.sub : '');
  }
  H.ch.push(c); H.byId[c.id] = c;
}
function sortCh() {
  const rank = c => c.id === 'home' ? [0, 0, 0] : c.mod ? [1, c.modNo, c.sub] : [2, c.id === 'labs' ? 0 : 1, 0];
  H.ch.sort((a, b) => { const x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; });
}

/* per-viewer progress (convenience only; page works without storage) */
const DONE = (() => { try { return new Set(JSON.parse(localStorage.getItem('w3hb-done') || '[]')); } catch (e) { return new Set(); } })();
function setDone(id, v) { v ? DONE.add(id) : DONE.delete(id); try { localStorage.setItem('w3hb-done', JSON.stringify([...DONE])); } catch (e) {} updateProgress(); }
function updateProgress() {
  $$('.navlink').forEach(a => a.classList.toggle('done', DONE.has(a.dataset.id)));
  $$('[data-prog]').forEach(s => { const list = H.ch.filter(c => c.mod === s.dataset.prog); const n = list.filter(c => DONE.has(c.id)).length; s.textContent = n ? `${n}/${list.length}` : list.length + ' 篇'; s.classList.toggle('full', n === list.length); });
  const all = H.ch.filter(c => c.mod), n = all.filter(c => DONE.has(c.id)).length;
  const t = $('#progAll'); if (t) t.textContent = `已学完 ${n} / ${all.length} 篇`;
}
function addLab(id, def) { H.labs[id] = def; }

/* compact SHA-256 (sync), used for block headers and the hash-chain lab */
function sha256(str) {
  const ascii = unescape(encodeURIComponent(str));
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  const mp = Math.pow, maxWord = mp(2, 32);
  let result = '', words = [], i, j;
  const bitLen = ascii.length * 8;
  let hash = sha256.h = sha256.h || [];
  const k = sha256.k = sha256.k || [];
  let pc = k.length;
  const comp = {};
  for (let cand = 2; pc < 64; cand++) {
    if (!comp[cand]) {
      for (i = 0; i < 313; i += cand) comp[i] = cand;
      hash[pc] = (mp(cand, .5) * maxWord) | 0;
      k[pc++] = (mp(cand, 1 / 3) * maxWord) | 0;
    }
  }
  let s = ascii + '\x80';
  while (s.length % 64 - 56) s += '\x00';
  for (i = 0; i < s.length; i++) { j = s.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
  words[words.length] = (bitLen / maxWord) | 0;
  words[words.length] = bitLen;
  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const old = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
        (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }
  for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? '0' : '') + b.toString(16); }
  return result;
}


/* Keccak-256 (Ethereum variant, not NIST SHA3). Input: Uint8Array or array of bytes. Output: hex string. */
const KRC = [0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an, 0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an, 0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n];
const KROT = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]];
function keccak256(input) {
  const rate = 136, M = (1n << 64n) - 1n;
  const rot = (v, n) => n === 0 ? v : ((v << BigInt(n)) | (v >> BigInt(64 - n))) & M;
  const len = input.length, padLen = rate - (len % rate);
  const buf = new Uint8Array(len + padLen); buf.set(input);
  buf[len] ^= 0x01; buf[len + padLen - 1] ^= 0x80;
  const st = new Array(25).fill(0n);
  for (let off = 0; off < buf.length; off += rate) {
    for (let i = 0; i < 17; i++) { let v = 0n; for (let b = 7; b >= 0; b--) v = (v << 8n) | BigInt(buf[off + i * 8 + b]); st[i] ^= v; }
    for (let r = 0; r < 24; r++) {
      const C = [0, 1, 2, 3, 4].map(x => st[x] ^ st[x + 5] ^ st[x + 10] ^ st[x + 15] ^ st[x + 20]);
      for (let x = 0; x < 5; x++) { const D = C[(x + 4) % 5] ^ rot(C[(x + 1) % 5], 1); for (let y = 0; y < 5; y++) st[x + 5 * y] ^= D; }
      const B = new Array(25).fill(0n);
      for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y + 5 * ((2 * x + 3 * y) % 5)] = rot(st[x + 5 * y], KROT[x][y]);
      for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) st[x + 5 * y] = B[x + 5 * y] ^ ((~B[(x + 1) % 5 + 5 * y] & M) & B[(x + 2) % 5 + 5 * y]);
      st[0] ^= KRC[r];
    }
  }
  let out = '';
  for (let i = 0; i < 4; i++) { let v = st[i]; for (let b = 0; b < 8; b++) { out += Number(v & 0xffn).toString(16).padStart(2, '0'); v >>= 8n; } }
  return out;
}
const utf8Bytes = str => Array.from(unescape(encodeURIComponent(str)), c => c.charCodeAt(0));
const hexBytes = h => { const a = []; for (let i = 0; i < h.length; i += 2) a.push(parseInt(h.slice(i, i + 2), 16)); return a; };
const keccakStr = str => keccak256(Uint8Array.from(utf8Bytes(str)));

/* ---------- content helpers used by chapter files ---------- */
function meta(goals, pre, labs) {
  return `<div class="meta"><div class="k">学习目标</div><div>读完本章，你能：</div><ol>${goals.map(g => `<li>${g}</li>`).join('')}</ol>
  <div><span class="k">前置章节　</span>${pre}</div>${labs ? `<div><span class="k">交互实验　</span>${labs.map(id => `<a href="#lab-${id}">${H.labs[id] ? H.labs[id].title : id}</a>`).join(' · ')}</div>` : ''}</div>`;
}
function one(t) { return `<div class="oneliner">${t}</div>`; }
const CALL_TAG = { analogy: '打个比方', info: '注意', warn: '警告', risk: '风险', deep: '深入一点' };
function call(type, html, tag) { return `<div class="call ${type}"><span class="tag">${tag || CALL_TAG[type]}</span>${html}</div>`; }
const NOTE_TAG = { flow: '数据流', fail: '出错点', limit: '局限', risk: '风险', key: '关键' };
function mm(title, src, notes) {
  const k = H.mmd.push(src.trim()) - 1;
  return `<figure class="mmd"><div class="mmd-title"><span>${title}</span><span class="zoom">点击图放大 ⤢</span></div><div class="mmd-body" data-k="${k}"><span class="muted small">图加载中…</span></div>${notes ? `<figcaption><div class="cap">读图要点</div><ul class="notes">${notes.map(([t, s]) => `<li><span class="chip ${t}">${NOTE_TAG[t]}</span><span>${s}</span></li>`).join('')}</ul></figcaption>` : ''}</figure>`;
}
function tbl(head, rows) {
  return `<div class="table-wrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
/* tiny syntax highlighter: comments, strings, numbers, keywords, types, calls. Output is escaped text wrapped in <span class="tk-*"> */
const HLK = (() => {
  const w = s => new Set(s.split(' '));
  const sol = { k: w('pragma contract interface library abstract is function modifier event error struct enum mapping public private internal external view pure payable virtual override returns return if else for while do break continue emit revert require assert new delete import from using constructor receive fallback memory storage calldata immutable constant indexed unchecked try catch assembly type anonymous true false this super'), t: /^(u?int\d*|bytes\d*|address|bool|string|bytes)$/, c: '//' };
  const go = { k: w('package import func return if else for range switch case default break continue go defer chan select struct interface map type var const nil true false'), t: /^(string|int\d*|uint\d*|bool|byte|rune|float(32|64)|error|any)$/, c: '//' };
  const ts = { k: w('import export from const let var function return if else for while of in new class extends async await try catch throw type interface as typeof true false null undefined default switch case break continue enum readonly public private'), t: /^(string|number|boolean|bigint|void|any|unknown|never|Promise|Address|Hex)$/, c: '//' };
  const rs = { k: w('use mod pub fn let mut const static struct enum impl trait for in if else match return self Self crate super where as ref move loop while break continue true false unsafe dyn async await'), t: /^(u\d+|i\d+|usize|isize|bool|str|String|Vec|Option|Result|Pubkey|Account|Context)$/, c: '//' };
  const sh = { k: w('if then else fi for do done while case esac function export cd echo curl forge cast anvil npm npx git mkdir cp cat'), t: /^$/, c: '#' };
  const sql = { k: w('SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE INDEX PRIMARY KEY NOT NULL DEFAULT UNIQUE AND OR JOIN ON GROUP BY ORDER LIMIT AS select from where insert into values update set delete create table index primary key not null default unique and or join on group by order limit as'), t: /^(BIGINT|INT|TEXT|VARCHAR|NUMERIC|TIMESTAMP|BOOLEAN|bigint|int|text|varchar|numeric|timestamp|boolean)$/, c: '--' };
  const toml = { k: w('true false'), t: /^$/, c: '#' };
  return { solidity: sol, sol, go, typescript: ts, ts, javascript: ts, js: ts, tsx: ts, rust: rs, rs, bash: sh, sh, shell: sh, sql, toml, yaml: toml, json: { k: w('true false null'), t: /^$/, c: '' } };
})();
function hl(lang, src) {
  const K = HLK[String(lang).toLowerCase()];
  if (!K) return esc(src);
  const cm = K.c === '//' ? '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/' : K.c === '#' ? '#[^\\n]*' : K.c === '--' ? '--[^\\n]*' : '(?!x)x';
  const re = new RegExp('(' + cm + ')|("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')|(\\b0x[0-9a-fA-F]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?(?:e\\d+)?\\b)|([A-Za-z_$][\\w$]*)(\\s*\\()?', 'g');
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    const [all, c, s, n, id, call] = m;
    if (c) out += `<span class="tk-c">${esc(c)}</span>`;
    else if (s) out += `<span class="tk-s">${esc(s)}</span>`;
    else if (n) out += `<span class="tk-n">${esc(n)}</span>`;
    else if (K.k.has(id)) out += `<span class="tk-k">${esc(id)}</span>${call ? esc(call) : ''}`;
    else if (K.t.test(id)) out += `<span class="tk-t">${esc(id)}</span>${call ? esc(call) : ''}`;
    else if (call) out += `<span class="tk-f">${esc(id)}</span>${esc(call)}`;
    else out += esc(id);
    last = m.index + all.length;
  }
  return out + esc(src.slice(last));
}
function code(lang, src) { const t = src.trim(); return `<div class="code-wrap"><div class="code-bar"><span class="lang">${lang}</span><button type="button" class="copy-btn" data-copy>复制</button></div><pre><code>${hl(lang, t)}</code></pre></div>`; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const text = $('code', b.closest('.code-wrap')).textContent;
  const ok = () => { b.textContent = '已复制'; b.classList.add('done'); setTimeout(() => { b.textContent = '复制'; b.classList.remove('done'); }, 1500); };
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (err) { b.textContent = '复制失败'; } document.body.removeChild(ta); };
  try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (err) { fallback(); }
});
function lab(id) { return `<div class="lab-slot" data-lab="${id}"></div>`; }
function terms(list) {
  list.forEach(([t, en, d]) => H.terms.push({ t, en, d, ch: CUR }));
  return `<h2>术语表</h2>` + tbl(['术语', '英文', '定义'], list.map(([t, en, d]) => [`<strong>${t}</strong>`, en, d]));
}
function qs(list) { return `<h2>思考题</h2><ol>${list.map(q => `<li>${q}</li>`).join('')}</ol>`; }
function steps(list) { return `<ol>${list.map(s => `<li>${s}</li>`).join('')}</ol>`; }
/* beginner helpers */
function beginner(html) { return call('start', html, '零基础先看'); }
function tryit(html) { return call('try', html, '动手练习'); }
/* 前情提要: a short reminder of something explained in full elsewhere, with a link to it */
function recall(html) { return call('recall', html, '前情提要'); }
function mistakes(list) { return `<h2>常见误区</h2>` + tbl(['误区', '事实'], list.map(([a, b]) => [`<span class="muted">✗</span> ${a}`, `<strong>✓</strong> ${b}`])); }
function recap(list) { return `<div class="recap"><div class="k">本节要点</div><ul>${list.map(x => `<li>${x}</li>`).join('')}</ul></div>`; }
/* exercises (open questions with folded reference answers), checklist (saved in this browser), history cases (each with its own sources) */
function exercises(list) {
  return `<h2>练习题</h2><p class="muted small">先自己想，再点开看参考答案。</p>` + list.map(([q, a], i) => `<details class="ex"><summary><span class="mono">${i + 1}.</span> ${q}</summary><div class="ex-a">${a}</div></details>`).join('');
}
function exq(list) { return list.map(([q, a]) => `<details class="ex"><summary>${q}</summary><div class="ex-a">${a}</div></details>`).join(''); }
const CK = (() => { try { return new Set(JSON.parse(localStorage.getItem('w3hb-ck') || '[]')); } catch (e) { return new Set(); } })();
function checklist(list) {
  const id = CUR;
  return `<h2>过关清单</h2><p class="muted small">做到一项就勾一项。勾选状态只保存在你的浏览器里。</p><ul class="ck">${list.map((t, i) => { const k = id + ':' + i; return `<li><label><input type="checkbox" data-ck="${k}"${CK.has(k) ? ' checked' : ''}> <span>${t}</span></label></li>`; }).join('')}</ul>`;
}
document.addEventListener('change', e => {
  const b = e.target.closest('input[data-ck]'); if (!b) return;
  b.checked ? CK.add(b.dataset.ck) : CK.delete(b.dataset.ck);
  try { localStorage.setItem('w3hb-ck', JSON.stringify([...CK])); } catch (err) {}
});
function cases(list, lvl) {
  const t = lvl || 'h2';
  return `<${t}>历史案例</${t}>` + list.map(([title, when, body, srcs]) => `<div class="case"><div class="case-h"><strong>${title}</strong><span class="mono muted">${when}</span></div>${body}<div class="case-src">来源：${srcs.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${l}</a>`).join('；')}</div></div>`).join('');
}
let quizSeq = 0;
function quiz(list) {
  return `<h2>自测</h2><p class="muted small">点击选项检查答案。答对全部题目，再标记本节为已学完。</p>` + list.map((x, i) => {
    const id = 'qz' + (++quizSeq);
    return `<div class="quiz" data-a="${x.a}"><div class="qq"><span class="mono">Q${i + 1}</span> ${x.q}</div><div class="qo">${x.o.map((o, j) => `<button type="button" data-qi="${j}" id="${id}-${j}">${String.fromCharCode(65 + j)}. ${o}</button>`).join('')}</div><div class="qwhy" hidden><b class="qres"></b> ${x.why}</div></div>`;
  }).join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('.quiz button[data-qi]'); if (!b) return;
  const q = b.closest('.quiz'), ok = +b.dataset.qi === +q.dataset.a;
  $$('button', q).forEach(x => x.classList.remove('right', 'wrong'));
  b.classList.add(ok ? 'right' : 'wrong');
  $$('button', q)[+q.dataset.a].classList.add('right');
  const w = $('.qwhy', q); w.hidden = false; w.className = 'qwhy ' + (ok ? 'ok' : 'bad');
  $('.qres', w).textContent = ok ? '✓ 正确。' : '✗ 不对。正确答案已标出。';
  if (!q.dataset.first) q.dataset.first = ok ? 'ok' : 'bad';
  const sc = q.closest('[data-stage]');
  if (sc) {
    const all = $$('.quiz', sc), done = all.filter(x => x.dataset.first), right = done.filter(x => x.dataset.first === 'ok');
    const box = $('[data-stscore]', sc);
    box.innerHTML = done.length < all.length ? `已作答 ${done.length} / ${all.length} 题，首答正确 ${right.length} 题。`
      : `<b>完成：首答正确 ${right.length} / ${all.length}（${Math.round(right.length / all.length * 100)}%）。</b>${right.length / all.length >= 0.8 ? '已达到 80% 过关线，可以进入下一个模块。' : '未到 80% 过关线：按每题解析里的“复习”链接回看对应文章，再做一次。'}`;
    box.className = 'stscore ' + (done.length < all.length ? '' : right.length / all.length >= 0.8 ? 'ok' : 'bad');
  }
});
/* stage quiz: one page per module, listed last in the module. list items: { q, o, a, why, ref: 'article id' } */
function stageQuiz(mod, list) {
  const no = MOD_DISPLAY[mod], code = 'M' + String(no).padStart(2, '0');
  addCh({ id: mod + '-quiz', kind: 'stage', mod, modNo: no, sub: 999, group: 'core', code: code + ' 测验', nav: '阶段测验', title: code + ' 阶段测验', desc: `${list.length} 道综合题，覆盖本模块各篇；首答正确率 80% 过关`, html: () => {
    const m = H.byId[mod], refs = [...new Set(list.map(x => x.ref).filter(r => H.byId[r]))];
    const full = `${code} 阶段测验：${m ? m.nav || m.title : ''}`;
    return `<h1>${full}</h1>
<div class="meta"><div class="k">怎么用</div><ol><li>学完本模块的子文章后再做。每题只按第一次点击计分。</li><li>首答正确率达到 80% 就算过关；没过关，按解析里的“复习”链接回看，再刷新页面重做。</li><li>本测验覆盖 ${refs.length} 篇文章：${refs.map(r => `<a href="#${r}">${H.byId[r].code}</a>`).join(' · ')}</li></ol></div>
<div data-stage>${quiz(list.map(x => ({ ...x, why: x.why + (x.ref && H.byId[x.ref] ? ` <span class="muted">复习：<a href="#${x.ref}">${H.byId[x.ref].code} ${H.byId[x.ref].nav || ''}</a></span>` : '') })))}
<div class="stscore" data-stscore>已作答 0 / ${list.length} 题。</div></div>`;
  } });
}

/* ---------- lab UI helpers ---------- */
function rng(p, k, label, min, max, step, val) {
  return `<label class="rng" for="${p}-${k}"><span>${label}</span><output data-o="${k}"></output><input type="range" id="${p}-${k}" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
}
function bindInputs(root, fmt, cb) {
  const ins = $$('[data-k]', root);
  const read = () => { const v = {}; ins.forEach(i => { v[i.dataset.k] = i.type === 'checkbox' ? i.checked : (i.type === 'range' || i.type === 'number') ? +i.value : i.value; }); return v; };
  const upd = () => { const v = read(); $$('[data-o]', root).forEach(o => { const k = o.dataset.o; if (k in v) o.textContent = fmt && fmt[k] ? fmt[k](v[k]) : v[k]; }); cb(v); };
  ins.forEach(i => i.addEventListener('input', upd));
  upd();
  return { read, upd, set(k, val) { const i = ins.find(x => x.dataset.k === k); if (i) { i.value = val; upd(); } } };
}
function seg(root, name, cb) {
  const box = $(`[data-seg="${name}"]`, root);
  const btns = $$('button', box);
  const pick = b => { btns.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); cb(b.dataset.v); };
  btns.forEach(b => b.addEventListener('click', () => pick(b)));
  return { get: () => (btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0]).dataset.v };
}
function segHtml(name, opts, cur) { return `<div class="seg" data-seg="${name}" role="group">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`; }
function stat(k, v, cls) { return `<div class="stat ${cls || ''}"><div class="k">${k}</div><div class="v">${v}</div></div>`; }
const fmtN = (x, d = 2) => (isFinite(x) ? Number(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const fmtP = (x, d = 2) => (isFinite(x) ? (x * 100).toFixed(d) + '%' : '—');

/* line chart: series [{pts:[[x,y]], cls}], optional markers [{x,y,cls,label}], vlines/hlines */
function lineChart(o) {
  const W = o.w || 640, Hh = o.h || 240, m = { l: 56, r: 16, t: 14, b: 32 };
  const [x0, x1] = o.xr, [y0, y1] = o.yr;
  const X = x => m.l + (o.logx ? (Math.log(x) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) : (x - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = y => m.t + (1 - (y - y0) / (y1 - y0)) * (Hh - m.t - m.b);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(o.label || '图表')}">`;
  (o.yticks || []).forEach(t => { s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text x="${m.l - 6}" y="${Y(t) + 4}" text-anchor="end">${o.fy ? o.fy(t) : t}</text>`; });
  (o.xticks || []).forEach(t => { const x = X(t), an = x < m.l + 30 ? 'start' : x > W - m.r - 30 ? 'end' : 'middle'; s += `<text x="${x}" y="${Hh - m.b + 16}" text-anchor="${an}">${o.fx ? o.fx(t) : t}</text>`; });
  s += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${Hh - m.b}" y2="${Hh - m.b}"/>`;
  (o.hlines || []).forEach(h => { s += `<line class="${h.cls || 's3'}" x1="${m.l}" x2="${W - m.r}" y1="${Y(h.y)}" y2="${Y(h.y)}"/>${h.label ? `<text x="${W - m.r - 4}" y="${Y(h.y) - 5}" text-anchor="end">${h.label}</text>` : ''}`; });
  (o.vlines || []).forEach(h => { s += `<line class="${h.cls || 's3'}" y1="${m.t}" y2="${Hh - m.b}" x1="${X(h.x)}" x2="${X(h.x)}"/>${h.label ? `<text x="${X(h.x) + 4}" y="${m.t + 10}">${h.label}</text>` : ''}`; });
  o.series.forEach(se => {
    const pts = se.pts.filter(p => isFinite(p[1]));
    if (!pts.length) return;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(Math.max(y0, Math.min(y1, p[1]))).toFixed(1)}`).join('');
    if (se.area) s += `<path class="area" d="${d}L${X(pts[pts.length - 1][0])},${Y(y0)}L${X(pts[0][0])},${Y(y0)}Z"/>`;
    s += `<path class="${se.cls || 's1'}" d="${d}"/>`;
  });
  (o.markers || []).forEach(mk => {
    const cx = X(mk.x), cy = Y(Math.max(y0, Math.min(y1, mk.y)));
    s += `<circle class="${mk.cls || 'dot'}" cx="${cx}" cy="${cy}" r="5.5"/>`;
    if (mk.label) { const right = mk.left ? false : cx < W * 0.7; s += `<text class="lbl" x="${cx + (right ? 9 : -9)}" y="${mk.below ? cy + 20 : cy - 9}" text-anchor="${right ? 'start' : 'end'}">${mk.label}</text>`; }
  });
  return s + '</svg>';
}

/* ---------- router & rendering ---------- */

/* ---------- learning aids: level, reading time, tracks, reading-order graph ---------- */
/* level: entry articles per displayed module (sub <= n); titles with 实战 are projects */
/* keyed by internal module id: articles with displayed number <= n are entry level */
const ENTRY_UPTO = { m00: 99, m01: 5, m02: 6, m07: 4, m05: 2, m11: 1, m13: 2, m03: 2, m04: 3, m08: 1, m06: 1, m09: 2, m12: 0 };
function levelOf(c) {
  if (!c.mod || !c.sub) return '';
  if (c.kind === 'stage') return '测验';
  if (/实战/.test(c.title)) return '实战';
  return (c.sub <= (ENTRY_UPTO[c.mod] || 0) || c.id === 'm08-6' || c.id === 'm04-71') ? '入门' : '进阶';
}
/* reading minutes: Chinese ~400 chars/min, English ~200 words/min, code ~15 lines/min, + time for diagrams, labs and quizzes */
function minutesOf(c) {
  if (c._mins) return c._mins;
  const html = typeof c.html === 'function' ? c.html() : c.html;
  let codeLines = 0;
  for (const m of html.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)) codeLines += m[1].split('\n').length;
  const text = html.replace(/<pre><code>[\s\S]*?<\/code><\/pre>/g, ' ').replace(/<[^>]+>/g, ' ');
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (text.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z][\w-]*/g) || []).length;
  const mm = (html.match(/class="mmd"/g) || []).length, labs = (html.match(/data-lab="/g) || []).length, qz = (html.match(/class="quiz"/g) || []).length;
  const raw = cjk / 400 + words / 200 + codeLines / 15 + mm * 1 + labs * 4 + qz * 0.5;
  return (c._mins = Math.max(5, Math.round(raw / 5) * 5));
}
/* tracks: internal ids. 'm02-*' = whole module, 'm01-1..5' = internal article numbers 1 to 5 */
const TRACKS = [
  { id: 'contract', name: '合约开发', who: '想写、测、审智能合约', must: ['m00-*', 'm01-1..5', 'm02-*', 'm07-1..6', 'm05-2', 'm05-5', 'm05-7', 'm05-8', 'm04-70', 'm04-71', 'm04-72', 'm04-74', 'm02-60..62', 'm02-64', 'm09-1', 'm09-4', 'm10-1..3', 'm12-*'] },
  { id: 'backend', name: '后端与钱包', who: 'Go/Java 后端，做索引、充提、签名服务', must: ['m00-*', 'm01-*', 'm02-1..5', 'm02-7', 'm03-*', 'm05-1', 'm05-2', 'm05-6', 'm05-9', 'm05-10', 'm05-50', 'm05-60', 'm05-61', 'm05-68', 'm05-67', 'm11-1', 'm11-2', 'm12-*'] },
  { id: 'cex', name: '交易所', who: '做 CEX 撮合与账本，或 DEX 报价与路由', must: ['m00-*', 'm01-*', 'm02-1', 'm02-5', 'm02-10', 'm03-1..8', 'm04-*', 'm05-6', 'm05-7', 'm08-6..9', 'm05-60', 'm05-68', 'm05-67', 'm11-1..3', 'm11-6', 'm12-*'] },
  { id: 'frontend', name: '前端', who: '做 DApp 界面、钱包连接、交易体验', must: ['m00-*', 'm01-1..5', 'm02-1..6', 'm02-50', 'm02-7', 'm02-10', 'm07-*', 'm04-70', 'm04-71', 'm04-72', 'm09-*', 'm12-*'] },
  { id: 'agent', name: 'Agent', who: '让 AI 代理安全地读写链', must: ['m00-*', 'm01-1..5', 'm02-1..5', 'm02-7', 'm07-1..6', 'm03-1..3', 'm06-*', 'm06-60', 'm09-4', 'm12-*'] },
  { id: 'data', name: '研究与数据', who: '做链上数据分析、资金追踪、风控与行业研究', must: ['m00-*', 'm01-1..5', 'm02-1', 'm02-5', 'm02-9..11', 'm02-60', 'm02-63', 'm02-65', 'm05-1', 'm05-2', 'm05-7', 'm05-8', 'm05-9', 'm05-60', 'm05-66', 'm05-67', 'm04-70', 'm04-71', 'm11-*', 'm12-1', 'm12-5'] },
  { id: 'protocol', name: '协议与密码学', who: '研究共识、比特币、零知识证明与隐私协议', must: ['m00-*', 'm01-1..5', 'm02-1..5', 'm05-1..5', 'm05-11', 'm05-60..65', 'm05-8', 'm10-*', 'm12-1', 'm12-5'] }
];
function trackHas(t, c) {
  if (!c.mod) return false;
  if (c.kind === 'stage' || c.id === c.mod) return H.ch.some(x => x.mod === c.mod && x.sub > 0 && x.kind !== 'stage' && trackHas(t, x));
  const [pre, num] = c.id.split('-'), n = +num;
  return t.must.some(r => {
    const [m, part] = r.split('-');
    if (m !== pre) return false;
    if (part === '*') return true;
    if (part.includes('..')) { const [a, b] = part.split('..').map(Number); return n >= a && n <= b; }
    return n === +part;
  });
}
const TRACK = (() => { try { return localStorage.getItem('w3hb-track') || ''; } catch (e) { return ''; } })();
let curTrack = TRACKS.find(t => t.id === TRACK) || null;
function setTrack(id) {
  curTrack = TRACKS.find(t => t.id === id) || null;
  try { localStorage.setItem('w3hb-track', curTrack ? curTrack.id : ''); } catch (e) {}
  applyTrack();
}
function applyTrack() {
  const sel = $('#trackSel'); if (sel) sel.value = curTrack ? curTrack.id : '';
  $$('.navlink').forEach(a => { const c = H.byId[a.dataset.id]; a.classList.toggle('opt', !!(curTrack && c && c.mod && !trackHas(curTrack, c))); });
  $$('details.mod').forEach(d => { const m = H.byId[d.dataset.mod]; d.classList.toggle('opt', !!(curTrack && m && !trackHas(curTrack, m))); });
  const note = $('#trackNote');
  if (note) {
    if (!curTrack) { note.textContent = ''; return; }
    const list = H.ch.filter(c => c.mod && c.sub && trackHas(curTrack, c));
    const mins = list.reduce((s, c) => s + minutesOf(c), 0);
    note.textContent = `必修 ${list.length} 篇，阅读约 ${Math.round(mins / 60)} 小时；灰色为选修。`;
  }
}
function tagsHtml(c) {
  if (!c.mod || !c.sub) return '';
  const lv = levelOf(c), musts = TRACKS.filter(t => trackHas(t, c)).map(t => t.name);
  return `<div class="tags">${reqHtml(c)}<span class="lvl lvl-${lv}">${lv}</span><span>阅读约 ${minutesOf(c)} 分钟（不含动手）</span>${musts.length ? `<span>方向路线必读：${musts.join(' · ')}</span>` : ''}</div>`;
}
/* required / optional badge: only the foundation part has optional articles; domain modules are picked by interest */
function reqOf(c) { if (!c.mod || !c.sub || c.kind === 'stage') return ''; return !isFoundation(c) ? 'domain' : OPTIONAL[c.id] ? 'opt' : 'req'; }
function reqHtml(c) {
  const r = reqOf(c);
  if (r === 'req') return '<span class="req req-must" title="公共基础：所有方向都要学">必修</span>';
  if (r === 'opt') return `<span class="req req-opt" title="按需学习">选修 · 适用：${OPTIONAL[c.id]}</span>`;
  if (r === 'domain') return '<span class="req req-dom" title="应用领域：按你的方向选择">应用领域</span>';
  return '';
}
/* reading-order graph of one module, from each article's prerequisite links */
function preIds(c) {
  const html = typeof c.html === 'function' ? c.html() : c.html;
  const m = html.match(/前置章节[\s\S]*?<\/div>/);
  return m ? [...m[0].matchAll(/href="#(m\d\d(?:-\d+)?)"/g)].map(x => x[1]) : [];
}
function depGraph(c) {
  const subs = H.ch.filter(x => x.mod === c.mod && x.sub > 0 && x.kind !== 'stage');
  if (subs.length < 2) return '';
  const nid = x => 'N' + x.id.replace('-', '_');
  const label = x => `${x.code}<br/>${(x.nav || x.title).replace(/["<>]/g, '')}`;
  let src = 'flowchart TB\n  OV["' + c.code + ' 模块总览"]\n';
  subs.forEach(x => { src += `  ${nid(x)}["${label(x)}"]\n`; });
  subs.forEach(x => {
    const pre = preIds(x).filter(p => H.byId[p] && H.byId[p].mod === c.mod && H.byId[p].sub > 0);
    if (!pre.length) src += `  OV --> ${nid(x)}\n`;
    pre.forEach(p => { src += `  ${nid(H.byId[p])} --> ${nid(x)}\n`; });
  });
  subs.filter(x => levelOf(x) === '实战').forEach(x => { src += `  class ${nid(x)} key\n`; });
  subs.filter(x => levelOf(x) === '入门').forEach(x => { src += `  class ${nid(x)} ok\n`; });
  return mm('本模块阅读顺序：箭头表示“先读 A 再读 B”', src, [
    ['flow', '从“模块总览”出发，沿箭头读。没有箭头相连的两篇可以按任意顺序读。'],
    ['key', '绿色是入门篇，青色是实战篇；其余是进阶篇。'],
    ['limit', '图中只画本模块内的前置关系；跨模块的前置写在每篇开头的“前置章节”里。']
  ]);
}
function buildNav() {
  const link = (c, label, code) => `<a class="navlink" href="#${c.id}" data-id="${c.id}"${c.mod && c.sub ? ` title="${reqOf(c) === 'opt' ? '选修 · 适用：' + OPTIONAL[c.id] + ' · ' : reqOf(c) === 'req' ? '必修 · ' : ''}${levelOf(c)} · 约 ${minutesOf(c)} 分钟"` : ''}><span class="code">${code || c.code}</span><span>${label || c.nav || c.title}</span>${reqOf(c) === 'opt' ? '<span class="optmk">选</span>' : ''}</a>`;
  const mods = H.ch.filter(c => c.mod && c.sub === 0);
  $('#navGroups').innerHTML =
    `<div class="group trackbox"><h4>我的方向</h4><select id="trackSel" class="search" aria-label="选择学习方向"><option value="">全部内容</option>${TRACKS.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select><div class="small muted" id="trackNote" style="padding:2px 8px"></div></div>` +
    `<div class="group"><h4>起步</h4>${H.ch.filter(c => c.id === 'home').map(c => link(c)).join('')}<div class="small muted" id="progAll" style="padding:2px 8px"></div></div>` +
    BOOK_PARTS.map(bp => `<div class="group"><h4>${bp.name}</h4>${mods.filter(m => m.modNo >= bp.from && m.modNo <= bp.to).map(m => `<details class="mod" data-mod="${m.mod}"><summary><span class="code">${m.code}</span><span class="mt">${m.nav || m.title}</span><span class="prog" data-prog="${m.mod}"></span></summary>${H.ch.filter(c => c.mod === m.mod).map(c => c.sub === 0 ? link(c, '模块总览', '总览') : (PART[c.id] ? `<div class="navpart">${PART[c.id]}</div>` : '') + link(c)).join('')}</details>`).join('')}</div>`).join('') +
    `<div class="group"><h4>工具</h4>${H.ch.filter(c => c.group === 'tools').map(c => link(c)).join('')}</div>`;
  updateProgress();
  $('#trackSel').addEventListener('change', e => setTrack(e.target.value));
  applyTrack();
}
function blockHash(c) { return '0x' + sha256(c.id + '|' + c.title).slice(0, 16); }
function blockHead(c) {
  const order = H.ch.filter(x => x.group !== 'tools');
  const i = order.indexOf(c);
  const prev = i > 0 ? blockHash(order[i - 1]) : '0x' + '0'.repeat(16);
  const where = c.mod ? (c.sub ? `模块 ${c.code.split('.')[0]} · 第 ${c.sub} 篇` : `模块 ${c.code} · 总览`) : c.code;
  return `<div class="blockhead" aria-label="章节区块信息"><div class="h">#${String(i).padStart(2, '0')}</div><div class="row">hash <b>${blockHash(c)}</b></div><div class="row">prev ${prev} · ${where}</div></div>`;
}
function pager(c) {
  const order = H.ch;
  const i = order.indexOf(c);
  const p = order[i - 1], n = order[i + 1];
  const done = c.mod ? `<div class="donebar"><button type="button" class="btn ${DONE.has(c.id) ? '' : 'primary'}" data-markdone="${c.id}">${DONE.has(c.id) ? '✓ 已学完（点击取消）' : '标记本篇为已学完'}</button><span class="muted small">进度只保存在你的浏览器里。</span></div>` : '';
  return done + `<nav class="pager" aria-label="翻页">${p ? `<a href="#${p.id}"><span class="k">← ${p.code}</span><span class="t">${p.title}</span></a>` : ''}${n ? `<a class="next" href="#${n.id}"><span class="k">${n.code} →</span><span class="t">${n.title}</span></a>` : ''}</nav>`;
}
function subGrid(c) {
  const subs = H.ch.filter(x => x.mod === c.mod && x.sub > 0);
  if (!subs.length) return '';
  return `<div class="subs"><div class="k">本模块共 ${subs.length} 篇子文章 · 建议先读完总览，再按顺序深入</div><div class="cards">${subs.map(x => (PART[x.id] ? `<div class="cardpart">${PART[x.id]}</div>` : '') + `<a class="card" href="#${x.id}"><span class="from">${x.code} · ${reqOf(x) === 'req' ? '必修 · ' : reqOf(x) === 'opt' ? '选修 · ' : ''}${levelOf(x)} · ${minutesOf(x)} 分钟${DONE.has(x.id) ? ' · ✓ 已学完' : ''}</span>${reqOf(x) === 'opt' ? `<span class="d">适用：${OPTIONAL[x.id]}</span>` : ''}<span class="t">${x.nav || x.title}</span>${x.desc ? `<span class="d">${x.desc}</span>` : ''}</a>`).join('')}</div></div>`;
}
function mountLab(slot, id) {
  const L = H.labs[id];
  if (!L) return;
  const chap = H.byId[L.ch];
  slot.outerHTML = `<section class="lab" id="slot-${id}" aria-label="${esc(L.title)}"><div class="lab-head"><span class="lk">LAB · ${chap ? chap.code : ''}</span><span class="lt">${L.title}</span>${location.hash.slice(1) === 'lab-' + id ? '' : `<a class="open" href="#lab-${id}">单独打开 ↗</a>`}<span class="ld">${L.desc}</span></div><div class="lab-body" data-labbody="${id}"></div></section>`;
  const body = $(`[data-labbody="${id}"]`);
  try { L.mount(body, id); } catch (e) { body.innerHTML = `<div class="verdict risk">实验加载失败：${esc(e.message)}</div>`; console.error(e); }
}
function render(id) {
  if (ALIAS[id]) { id = ALIAS[id]; history.replaceState(null, '', '#' + id); }
  const view = $('#view');
  let c = H.byId[id];
  if (id && id.startsWith('lab-') && H.labs[id.slice(4)]) {
    const lid = id.slice(4), L = H.labs[lid], chap = H.byId[L.ch];
    view.innerHTML = `<div class="blockhead"><div class="h">LAB</div><div class="row">来自 <b>${chap.code} ${chap.title}</b></div><div class="row"><a href="#${chap.id}">← 回到文章</a> · <a href="#labs">全部实验</a></div></div><h1>${L.title}</h1>${lab(lid)}`;
    c = chap;
  } else {
    if (!c) { c = H.ch[0]; id = c.id; }
    view.innerHTML = (c.group === 'tools' ? '' : blockHead(c)) + (typeof c.html === 'function' ? c.html() : c.html) + refsHtml(c.id) + pager(c);
    if (c.mod && c.sub === 0) { const mt = $('.meta', view); if (mt) mt.insertAdjacentHTML('afterend', subGrid(c) + depGraph(c)); }
    if (c.mod && c.sub > 0) { const mt = $('.meta', view); if (mt) mt.insertAdjacentHTML('afterbegin', tagsHtml(c)); }
  }
  $$('.lab-slot', view).forEach(s => mountLab(s, s.dataset.lab));
  const navId = id.startsWith('lab-') ? 'labs' : id;
  $$('.navlink').forEach(a => a.dataset.id === navId ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $$('details.mod').forEach(d => { if (d.dataset.mod === c.mod) d.open = true; });
  document.body.classList.remove('menu-open');
  window.scrollTo(0, 0);
  fitArt(view);
  renderDiagrams(view);
  buildToc(view);
  if (c.after) c.after(view);
}
/* "on this page" table of contents + scroll spy */
let tocObs = null;
function buildToc(view) {
  const box = $('#toc'), list = $('#tocList'), fab = $('#tocFab'), main = $('#main');
  if (tocObs) { tocObs.disconnect(); tocObs = null; }
  const hs = $$('h2, h3', view).filter(h => !h.closest('.lab, .quiz, .call'));
  const ok = hs.length >= 3;
  box.hidden = !ok; fab.hidden = !ok; main.classList.toggle('has-toc', ok);
  box.classList.remove('open'); fab.setAttribute('aria-expanded', 'false');
  if (!ok) { list.innerHTML = ''; return; }
  hs.forEach((h, i) => { h.id = h.id || 'h-' + i; });
  list.innerHTML = hs.map(h => `<a href="#" data-to="${h.id}" class="${h.tagName === 'H3' ? 'l3' : 'l2'}">${esc(h.textContent)}</a>`).join('');
  try {
    tocObs = new IntersectionObserver(es => {
      es.forEach(en => { if (en.isIntersecting) $$('a', list).forEach(a => a.classList.toggle('on', a.dataset.to === en.target.id)); });
    }, { rootMargin: '-60px 0px -70% 0px' });
    hs.forEach(h => tocObs.observe(h));
  } catch (e) {}
}
document.addEventListener('click', e => {
  const a = e.target.closest('#tocList a');
  if (a) { e.preventDefault(); const t = document.getElementById(a.dataset.to); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); $('#toc').classList.remove('open'); return; }
  if (e.target.closest('#tocFab')) { const t = $('#toc'); const o = t.classList.toggle('open'); $('#tocFab').setAttribute('aria-expanded', o); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-markdone]'); if (!b) return;
  const id = b.dataset.markdone, v = !DONE.has(id); setDone(id, v);
  b.className = 'btn ' + (v ? '' : 'primary'); b.textContent = v ? '✓ 已学完（点击取消）' : '标记本篇为已学完';
});

/* ---------- mermaid ---------- */
let mmdReady = false, mmdSeq = 0;
function mmdInit() {
  if (!window.mermaid) return false;
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
  mermaid.initialize({
    startOnLoad: false, theme: 'base', securityLevel: 'strict',
    fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif',
    flowchart: { htmlLabels: true, curve: 'basis', padding: 10, nodeSpacing: 34, rankSpacing: 38, wrappingWidth: 180 },
    sequence: { mirrorActors: false, actorMargin: 24, width: 120, wrap: true, messageMargin: 30, boxMargin: 8 },
    state: { nodeSpacing: 34, rankSpacing: 34 },
    themeVariables: {
      background: v('--paper'), primaryColor: v('--tint'), primaryTextColor: v('--ink'), primaryBorderColor: v('--accent'),
      secondaryColor: v('--accent-soft'), tertiaryColor: v('--paper'), lineColor: v('--ink-2'), textColor: v('--ink'),
      mainBkg: v('--tint'), nodeBorder: v('--accent'), clusterBkg: v('--ground'), clusterBorder: v('--rule'), titleColor: v('--ink'),
      edgeLabelBackground: v('--paper'), noteBkgColor: v('--warn-soft'), noteTextColor: v('--ink'), noteBorderColor: v('--warn'),
      actorBkg: v('--tint'), actorBorder: v('--accent'), actorTextColor: v('--ink'), actorLineColor: v('--rule'),
      signalColor: v('--ink-2'), signalTextColor: v('--ink'), labelBoxBkgColor: v('--tint'), labelBoxBorderColor: v('--accent'),
      labelTextColor: v('--ink'), loopTextColor: v('--ink'), activationBkgColor: v('--accent-soft'), activationBorderColor: v('--accent'),
      sequenceNumberColor: v('--paper'), fontSize: '14px',
      cScale0: v('--accent-soft'), cScale1: v('--info-soft'), cScale2: v('--warn-soft'), cScale3: v('--ok-soft'), cScale4: v('--risk-soft'),
      git0: v('--accent'), git1: v('--info'), git2: v('--warn'),
      stateLabelColor: v('--ink'), altBackground: v('--ground'), stateBkg: v('--tint'), compositeBackground: v('--ground'), compositeTitleBackground: v('--tint'),
      transitionColor: v('--ink-2'), transitionLabelColor: v('--ink'), specialStateColor: v('--accent'), innerEndBackground: v('--accent')
    }
  });
  mmdReady = true;
  return true;
}


/* ---------- sources and claim labels ----------
   cite(label, url): numbered superscript; the article gets an automatic “参考来源” list at the end.
   tag('惯例' | '推断' | '待核实'): small grey label for conventions, inferences and unverified claims. */
const REFS = {};
function cite(label, url) {
  const id = CUR, list = REFS[id] || (REFS[id] = []);
  let i = list.findIndex(r => r.url === url);
  if (i < 0) { list.push({ label, url }); i = list.length - 1; }
  return `<sup class="cite"><a href="#" data-ref="ref-${id}-${i + 1}" title="${esc(label)}">[${i + 1}]</a></sup>`;
}
const TAG_TIP = {
  '惯例': '行业惯例：多数项目这样做，但没有统一标准，具体以各项目为准。',
  '推断': '推断：作者根据公开信息和机制推理得出，不是官方说法。',
  '待核实': '待核实：没有找到可靠的公开来源，请谨慎引用。'
};
function tag(k) { return `<span class="ftag" title="${TAG_TIP[k] || ''}">${k === '惯例' ? '行业惯例' : k}</span>`; }
function refsHtml(id) {
  const list = REFS[id];
  if (!list || !list.length) return '';
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  return `<h2>参考来源</h2><ol class="refs">${list.map((r, i) => `<li id="ref-${id}-${i + 1}"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.label}</a> <span class="muted small">${host(r.url)}</span></li>`).join('')}</ol>` +
    `<p class="muted small">标注说明：[n] 指向上面的来源；「行业惯例」「推断」「待核实」标签的含义，把鼠标停在标签上可以看到；“（示例）”表示为了讲解而设定的数字。</p>`;
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-ref]'); if (!a) return;
  e.preventDefault();
  const t = document.getElementById(a.dataset.ref);
  if (t) { t.scrollIntoView({ block: 'center' }); t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1600); }
});

/* ---------- figure kit: friendlier HTML diagrams ----------
   Simple Mermaid sources are turned into HTML at render time (the Mermaid text stays as the source of truth):
   - a flowchart that is one straight chain of 3–9 steps  -> numbered step cards
   - a sequence diagram with at most 6 participants        -> swimlane timeline
   Everything else is still drawn by Mermaid. Authors can also call layers() / compare() directly. */
const FK_SIGN = /私钥|签名|sign|密钥|助记词/i, FK_RISK = /失败|revert|丢弃|攻击|被盗|拒绝|回滚|漏洞|超时|拉黑|清算|强平/i, FK_OK = /成功|完成|上链|确认|finalized|入账|到账|广播|返回结果|执行/i;
function fkLabel(raw) {
  const parts = String(raw).split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
  return { t: parts[0] || '', d: parts.slice(1).join('<br/>') };
}
function fkKind(text, cls) {
  if (cls) return cls === 'key' ? 'key' : cls === 'risk' ? 'risk' : cls === 'ok' ? 'ok' : cls === 'warn' ? 'warn' : '';
  if (FK_RISK.test(text)) return 'risk';
  if (FK_SIGN.test(text)) return 'sign';
  return '';
}
/* parse a flowchart; return ordered steps if it is a single chain, else null */
function fkChain(src) {
  const lines = src.split('\n').map(l => l.trim()).filter(Boolean);
  if (!/^(flowchart|graph)\s+(LR|RL|TB|TD|BT)$/.test(lines[0])) return null;
  if (lines.some(l => /^(subgraph|end$|style |linkStyle|click )/.test(l) || / & /.test(l))) return null;
  const label = {}, cls = {}, edges = [];
  const nodeRe = /([A-Za-z_][\w]*)\s*(\[\[|\[\(|\[\/|\[\\|\(\(|\(\[|\[|\(|\{\{|\{|>)\s*"?((?:[^"\]\)\}]|\](?!\s*$))*?)"?\s*(\]\]|\)\]|\/\]|\\\]|\)\)|\]\)|\]|\)|\}\}|\})(?::::(\w+))?/g;
  for (const l of lines.slice(1)) {
    let m;
    if ((m = l.match(/^class\s+([\w,]+)\s+(\w+)$/))) { m[1].split(',').forEach(id => cls[id] = m[2]); continue; }
    if (/^classDef\s/.test(l)) continue;
    // split the line into node tokens and edge tokens
    const toks = l.split(/\s*(-->|-\.->|==>|---|--\s*"[^"]*"\s*-->|-->\|[^|]*\|)\s*/);
    if (toks.length === 1) { // a pure node definition
      nodeRe.lastIndex = 0; const nm = nodeRe.exec(l);
      if (!nm) return null; label[nm[1]] = nm[3]; if (nm[5]) cls[nm[1]] = nm[5]; continue;
    }
    const ids = [];
    for (let i = 0; i < toks.length; i += 2) {
      const t = toks[i].trim(); if (!t) return null;
      nodeRe.lastIndex = 0; const nm = nodeRe.exec(t);
      if (nm && nm.index === 0) { label[nm[1]] = nm[3]; if (nm[5]) cls[nm[1]] = nm[5]; ids.push(nm[1]); }
      else if (/^[A-Za-z_]\w*(:::\w+)?$/.test(t)) { const [id, c] = t.split(':::'); if (c) cls[id] = c; ids.push(id); }
      else return null;
    }
    for (let i = 0; i + 1 < ids.length; i++) {
      const op = toks[2 * i + 1];
      const lm = op.match(/\|"?([^|"]*)"?\|/) || op.match(/--\s*"([^"]*)"/);
      edges.push({ a: ids[i], b: ids[i + 1], l: lm ? lm[1] : '' });
    }
  }
  const nodes = Object.keys(label);
  if (nodes.length < 3 || nodes.length > 9 || edges.length !== nodes.length - 1) return null;
  const outd = {}, ind = {};
  for (const e of edges) { outd[e.a] = (outd[e.a] || 0) + 1; ind[e.b] = (ind[e.b] || 0) + 1; if (!(e.a in label) || !(e.b in label)) return null; }
  if (nodes.some(n => (ind[n] || 0) > 1)) return null;
  const forks = nodes.filter(n => (outd[n] || 0) > 1);
  if (forks.length > 1) return null;                     // at most one fan-out, and only at the end of the chain
  const start = nodes.filter(n => !ind[n]); if (start.length !== 1) return null;
  const mk = (id, via) => { const L = fkLabel(label[id]); return { ...L, via, kind: fkKind(L.t + ' ' + L.d, cls[id]) }; };
  const order = []; let cur = start[0], via = '';
  while (cur && (outd[cur] || 0) <= 1) { const e = edges.find(x => x.a === cur); order.push(mk(cur, via)); via = e ? e.l : ''; cur = e ? e.b : null; }
  if (cur) {                                             // cur is the fork: all of its children must be leaves
    const kids = edges.filter(x => x.a === cur);
    if (kids.some(k => outd[k.b])) return null;
    const last = mk(cur, via); last.fan = kids.map(k => mk(k.b, k.l));
    order.push(last);
  }
  const count = order.length + (order[order.length - 1].fan || []).length;
  if (count !== nodes.length || order.length < 2) return null;
  return order;
}
function fkSteps(steps) {
  if (steps.length && !steps.some(s => s.kind)) steps[steps.length - 1].kind = FK_OK.test(steps[steps.length - 1].t) ? 'ok' : '';
  const used = new Set(steps.map(s => s.kind).filter(Boolean));
  const LEG = { sign: '用到私钥 / 签名', risk: '可能失败或有风险', ok: '完成 / 结果', key: '关键步骤', warn: '注意' };
  const cols = steps.length === 4 ? 2 : Math.min(3, steps.length);
  const fan = steps.length && steps[steps.length - 1].fan;
  if (fan) fan.forEach(f => used.add(f.kind));
  used.delete('');
  const fanHtml = fan ? `<div class="fk-fan"><div class="fk-fanh">${steps.length}. ${steps[steps.length - 1].t} 之后，分成 ${fan.length} 路：</div><div class="fk-fang" style="--f:${Math.min(fan.length, 3)}">${fan.map(f => `<div class="fk-st ${f.kind}">${f.via ? `<div class="fk-via">← ${f.via}</div>` : ''}<div class="fk-h"><b>${f.t}</b></div>${f.d ? `<div class="fk-d">${f.d}</div>` : ''}</div>`).join('')}</div></div>` : '';
  return `<div class="fk-pipe" style="--cols:${cols}">${steps.map((s, i) => `<div class="fk-st ${s.kind}${(i + 1) % cols === 0 ? ' eol' : ''}"><div class="fk-h"><span class="fk-n">${i + 1}</span><b>${s.t}</b></div>${s.via ? `<div class="fk-via">← ${s.via}</div>` : ''}${s.d ? `<div class="fk-d">${s.d}</div>` : ''}</div>`).join('')}</div>` + fanHtml +
    (used.size ? `<div class="fk-leg">${[...used].map(k => `<span><i class="fk-sw ${k}"></i>${LEG[k]}</span>`).join('')}</div>` : '');
}
/* parse a sequence diagram into a swimlane timeline, else null */
function fkSeq(src) {
  const lines = src.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines[0] !== 'sequenceDiagram') return null;
  const actors = [], name = {}, rows = []; let auto = false, n = 0;
  const add = id => { if (!(id in name)) { actors.push(id); name[id] = id; } };
  for (const l of lines.slice(1)) {
    let m;
    if (l === 'autonumber') { auto = true; continue; }
    if ((m = l.match(/^(participant|actor)\s+(\w+)(?:\s+as\s+(.+))?$/))) { add(m[2]); name[m[2]] = m[3] || m[2]; continue; }
    if (/^(activate|deactivate)\s/.test(l)) continue;
    if ((m = l.match(/^(\w+)\s*(-{1,2})(>>|>|x|\))\s*[+-]?\s*(\w+)\s*:\s*(.*)$/))) {
      add(m[1]); add(m[4]); n++;
      rows.push({ t: 'msg', a: m[1], b: m[4], dash: m[2] === '--', text: m[5], n }); continue;
    }
    if ((m = l.match(/^Note\s+(over|left of|right of)\s+([\w,\s]+):\s*(.*)$/i))) { rows.push({ t: 'note', who: m[2].split(',').map(s => s.trim()), text: m[3] }); continue; }
    if ((m = l.match(/^(alt|else|opt|loop|par|and|critical|break|rect)\b\s*(.*)$/))) { rows.push({ t: 'grp', k: m[1], text: m[1] === 'rect' ? '' : m[2] }); continue; }
    if (l === 'end') { rows.push({ t: 'end' }); continue; }
    return null;
  }
  if (actors.length < 2 || actors.length > 6 || !rows.some(r => r.t === 'msg')) return null;
  return { actors, name, rows, auto };
}
function fkLanes(sq) {
  const N = sq.actors.length, col = id => sq.actors.indexOf(id) + 1;
  const GK = { alt: '分支', else: '否则', opt: '可选', loop: '循环', par: '并行', and: '同时', critical: '关键区', break: '中断', rect: '' };
  let h = `<div class="fk-lanes" style="--n:${N}">`;
  h += sq.actors.map((a, i) => `<div class="fk-life" style="left:calc((${i} + .5) / var(--n) * 100%)"></div>`).join('');
  h += `<div class="fk-row fk-head">${sq.actors.map(a => `<div class="fk-actor">${sq.name[a]}</div>`).join('')}</div>`;
  for (const r of sq.rows) {
    if (r.t === 'msg') {
      const a = col(r.a), b = col(r.b), lo = Math.min(a, b), hi = Math.max(a, b), self = a === b;
      const kind = fkKind(r.text);
      h += `<div class="fk-row fk-msg ${kind}${r.dash ? ' back' : ''}">` +
        `<div class="fk-who">${r.n}. ${sq.name[r.a]} → ${sq.name[r.b]}</div>` +
        (self ? `<div class="fk-self" style="grid-column:${a} / span 1"><span class="fk-num">${r.n}</span>${r.text}</div>`
              : `<div class="fk-bar ${a < b ? 'r' : 'l'}" style="grid-column:${lo} / ${hi + 1};--span:${hi - lo + 1}"><span class="fk-txt"><span class="fk-num">${r.n}</span>${r.text}</span></div>`) +
        `</div>`;
    } else if (r.t === 'note') {
      const cs = r.who.map(col).filter(Boolean); const lo = Math.min(...cs), hi = Math.max(...cs);
      h += `<div class="fk-row"><div class="fk-note" style="grid-column:${lo} / ${hi + 1}">${r.text}</div></div>`;
    } else if (r.t === 'grp') {
      h += `<div class="fk-row"><div class="fk-grp" style="grid-column:1 / ${N + 1}">${GK[r.k] ? `<b>${GK[r.k]}</b>` : ''}${r.text}</div></div>`;
    } else if (r.t === 'end') {
      h += `<div class="fk-row"><div class="fk-gend" style="grid-column:1 / ${N + 1}"></div></div>`;
    }
  }
  return h + '</div>';
}
/* parse a flat stateDiagram-v2 (states, transitions, start/end markers); anything nested or annotated stays with Mermaid */
const FK_ST_RISK = /拒绝|失败|撤销|取消|过期|超时|回滚|作废|罚没|坏账|丢弃|Rejected|Failed|Cancel|Expired|Reverted|Slashed|Dropped/i, FK_ST_WARN = /审核|审批|挂起|暂停|异常|重试|争议|等待|Pending|Review|Approval|Paused|Dispute/i;
function fkStateParse(src) {
  const lines = src.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  if (lines[0] !== 'stateDiagram-v2') return null;
  const name = {}, order = [], tr = []; let start = null; const ends = new Set();
  const add = id => { if (!(id in name)) { name[id] = id; } if (!order.includes(id)) order.push(id); };
  for (const l of lines.slice(1)) {
    let m;
    if (/^direction\s/.test(l)) continue;
    if ((m = l.match(/^state\s+"([^"]+)"\s+as\s+(\w+)$/))) { name[m[2]] = m[1]; if (!order.includes(m[2])) order.push(m[2]); continue; }
    if ((m = l.match(/^(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)(?:\s*:\s*(.*))?$/))) {
      const [, a, b, lab] = m;
      if (a === '[*]' && b === '[*]') return null;
      if (a === '[*]') { add(b); if (!start) start = b; tr.push({ a: null, b, l: lab || '' }); continue; }
      if (b === '[*]') { add(a); ends.add(a); continue; }
      add(a); add(b); tr.push({ a, b, l: lab || '' }); continue;
    }
    if ((m = l.match(/^(\w+)\s*:\s*(.+)$/))) { add(m[1]); name[m[1]] = m[2]; continue; }
    return null;   // composite states, notes, choices, forks ...
  }
  if (order.length < 2 || order.length > 14 || !tr.some(t => t.a)) return null;
  if (!start) start = order[0];
  const out = id => tr.filter(t => t.a === id && t.b !== id);
  order.forEach(id => { if (!out(id).length) ends.add(id); });
  const kind = id => id === start ? 'start' : ends.has(id) ? (FK_ST_RISK.test(name[id] + ' ' + id) ? 'risk' : 'ok') : FK_ST_RISK.test(name[id] + ' ' + id) ? 'risk' : FK_ST_WARN.test(name[id] + ' ' + id) ? 'warn' : '';
  // main path: the longest simple path from the start to a normal end state
  let best = null;
  const walk = (id, path) => {
    if (ends.has(id) && kind(id) !== 'risk' && (!best || path.length > best.length)) best = path.slice();
    for (const t of out(id)) if (!path.includes(t.b) && path.length < 12) { path.push(t.b); walk(t.b, path); path.pop(); }
  };
  walk(start, [start]);
  if (!best) { best = [start]; let cur = start; for (;;) { const t = out(cur).find(x => !best.includes(x.b)); if (!t) break; best.push(t.b); cur = t.b; } }
  return { name, order, tr, start, ends, kind, main: best };
}
function fkStateHtml(sm) {
  const pill = id => `<span class="fk-smp ${sm.kind(id)}">${sm.name[id]}</span>`;
  const lab = (a, b) => { const t = sm.tr.find(x => x.a === a && x.b === b); return t ? t.l : ''; };
  const first = sm.tr.find(t => !t.a && t.b === sm.start);
  let h = '<div class="fk-sm"><div class="fk-sm-cap">主流程</div><div class="fk-sm-path">';
  sm.main.forEach((id, i) => {
    const l = i ? lab(sm.main[i - 1], id) : (first ? first.l : '');
    h += `<span class="fk-sm-step">${i || l ? `<span class="fk-sm-arrow"><i>${l}</i><b>→</b></span>` : ''}${pill(id)}</span>`;
  });
  h += '</div>';
  const side = sm.order.filter(id => !sm.main.includes(id));
  if (side.length) h += `<div class="fk-sm-cap">分支与异常状态</div><div class="fk-sm-side">${side.map(pill).join('')}</div>`;
  h += '<div class="fk-sm-cap">状态转换表：在某个状态下，发生什么事，会进入哪个状态</div><div class="table-wrap"><table class="fk-sm-t"><thead><tr><th>当前状态</th><th>发生什么</th><th>进入状态</th></tr></thead><tbody>';
  for (const id of sm.order) {
    const ts = sm.tr.filter(t => t.a === id);
    if (!ts.length) continue;
    ts.forEach((t, i) => { h += `<tr${i === 0 ? ' class="g"' : ''}>${i === 0 ? `<td rowspan="${ts.length}">${pill(id)}</td>` : ''}<td>${t.l || '<span class="muted">（无条件）</span>'}</td><td>${t.b === id ? '<span class="fk-sm-self">↻ 留在本状态</span>' : pill(t.b)}</td></tr>`; });
  }
  h += '</tbody></table></div>';
  const used = new Set(sm.order.map(sm.kind));
  const LEG = [['start', '起始状态'], ['', '中间状态'], ['warn', '需要等待或人工处理'], ['ok', '正常结束（终态）'], ['risk', '失败或异常结束']];
  h += `<div class="fk-leg">${LEG.filter(([k]) => used.has(k)).map(([k, t]) => `<span><i class="fk-sw fk-smsw ${k}"></i>${t}</span>`).join('')}</div></div>`;
  return h;
}
function fkFromMermaid(src) {
  if (/^%%raw/.test(src)) return null;             // author asked for the plain Mermaid rendering
  const st = fkChain(src); if (st) return { html: fkSteps(st), kind: 'steps' };
  const sq = fkSeq(src); if (sq) return { html: fkLanes(sq), kind: 'lanes' };
  const sm = fkStateParse(src); if (sm) return { html: fkStateHtml(sm), kind: 'state' };
  return null;
}
/* hand-authored components (use inside article html like mm()) */
function figWrap(title, inner, notes) {
  return `<figure class="mmd fig-html"><div class="mmd-title"><span>${title}</span></div><div class="fig-body">${inner}</div>${notes ? `<figcaption><div class="cap">读图要点</div><ul class="notes">${notes.map(([t, s]) => `<li><span class="chip ${t}">${NOTE_TAG[t]}</span><span>${s}</span></li>`).join('')}</ul></figcaption>` : ''}</figure>`;
}
/* layers(title, [{name, sub, chips:[...], kind:'l1'|'l2'|'key'|'risk'|''}], notes, arrows:[label between rows]) */
function layers(title, rows, notes, arrows) {
  const inner = `<div class="fk-stack">${rows.map((r, i) => (i ? `<div class="fk-down">▼${arrows && arrows[i - 1] ? ' ' + arrows[i - 1] : ''}</div>` : '') + `<div class="fk-layer ${r.kind || ''}"><div class="fk-name">${r.name}${r.sub ? `<small>${r.sub}</small>` : ''}</div><div class="fk-chips">${(r.chips || []).map(c => `<span class="fk-chip">${c}</span>`).join('')}</div></div>`).join('')}</div>`;
  return figWrap(title, inner, notes);
}
/* compare(title, [{name, tag, kind, points:[...]}], notes) */
function compare(title, cols, notes) {
  const inner = `<div class="fk-cmp" style="--c:${cols.length}">${cols.map(c => `<div class="fk-col ${c.kind || ''}"><div class="fk-ch"><b>${c.name}</b>${c.tag ? `<span>${c.tag}</span>` : ''}</div><ul>${c.points.map(p => `<li>${p}</li>`).join('')}</ul></div>`).join('')}</div>`;
  return figWrap(title, inner, notes);
}
/* steps(title, [{t, d, kind}], notes): hand-authored step cards */
function steps2(title, list, notes) { return figWrap(title, fkSteps(list.map(s => ({ t: s.t, d: s.d || '', via: s.via || '', kind: s.kind || '' }))), notes); }

/* ---------- art kit: declarative hand-drawn figures ----------
   art(title, w, h, [parts], notes, aria, id) draws one explanatory SVG. Build the parts with S.*.
   Colours are semantic and theme-aware: info (blue, data / neutral), ok (green, normal / safe), key (accent, the point),
   risk (red, danger), warn (amber, caution / human step), idle (grey dashed, unused), plain (neutral ink), tint.
   Text is fitted to its box at render time (data-mw), so only the layout needs care. No transforms: use absolute coordinates. */
const ART_K = { info: ['var(--info)', 'var(--info-soft)'], ok: ['var(--ok)', 'var(--ok-soft)'], key: ['var(--accent)', 'var(--accent-soft)'], risk: ['var(--risk)', 'var(--risk-soft)'], warn: ['var(--warn)', 'var(--warn-soft)'], idle: ['var(--rule)', 'var(--paper)'], plain: ['var(--ink-2)', 'var(--paper)'], tint: ['var(--rule)', 'var(--tint)'] };
const artTw = (str, size) => [...String(str)].reduce((a, c) => a + (/[⺀-鿿＀-￯]/.test(c) ? size : size * 0.58), 0);
const ART_ICONS = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
  block: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  doc: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4 4 0 0 1 17 18z"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><circle cx="9.5" cy="13.5" r="1.2"/><circle cx="14.5" cy="13.5" r="1.2"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/>',
  chart: '<path d="M4 20V4M4 20h16M8 15l3-4 3 2 5-7"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18.2h.01"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 1.8 5 4.5"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  scale: '<path d="M12 4v16M6 20h12M4 8h16M4 8l-2 6a3 3 0 0 0 6 0zM20 8l-2 6a3 3 0 0 0 6 0z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>'
};
const S = {
  text(x, y, str, o = {}) {
    const size = o.size || 13, lh = size * 1.32, lines = String(str).split('\n');
    const fill = o.k ? (ART_K[o.k] || ART_K.plain)[0] : (o.fill || (o.dim ? 'var(--ink-2)' : 'var(--ink)'));
    const at = ` font-size="${size}" text-anchor="${o.anchor || 'start'}" fill="${fill}"${o.b ? ' font-weight="700"' : ''}${o.mono ? ' font-family="ui-monospace,Menlo,monospace"' : ''}${o.mw ? ` data-mw="${o.mw}"` : ''}${o.box ? ` data-bx="${o.box.join(',')}"` : ''}`;
    const body = lines.length === 1 ? esc(lines[0]) : lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join('');
    return `<text x="${x}" y="${y}"${at}>${body}</text>`;
  },
  box(x, y, w, h, o = {}) {
    const [st, fi] = ART_K[o.k || 'idle'];
    let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r || 10}" fill="${fi}" stroke="${st}" stroke-width="${o.sw || 1.6}"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    const pad = 12, ix = o.icon ? 36 : 0, left = o.left || o.icon;
    if (o.icon) g += S.icon(o.icon, x + pad + 13, y + h / 2, 26, o.ik || o.k || 'plain');
    const cx = left ? x + pad + ix : x + w / 2, anc = left ? 'start' : 'middle', mw = Math.round(w - 2 * pad - ix);
    const ts = o.ts || 14, ss = o.ss || 12, tl = o.t ? String(o.t).split('\n').length : 0, sl = o.s ? String(o.s).split('\n').length : 0;
    const total = tl * ts * 1.32 + (sl ? sl * ss * 1.32 + 3 : 0), top = y + (h - total) / 2;
    if (o.t) g += S.text(cx, top + ts * 0.95, o.t, { size: ts, b: 1, anchor: anc, mw, box: [x, y, w, h], mono: o.mono });
    if (o.s) g += S.text(cx, top + tl * ts * 1.32 + 3 + ss * 0.95, o.s, { size: ss, dim: 1, anchor: anc, mw, box: [x, y, w, h] });
    if (o.tag) g += S.text(x + w - 8, y + 15, o.tag, { size: 11, anchor: 'end', k: o.k && o.k !== 'idle' ? o.k : 'plain', b: 1, mw: Math.round(w * 0.5), box: [x, y, w, h] });
    return g;
  },
  pill(x, y, w, h, str, o = {}) {
    const [st, fi] = ART_K[o.k || 'idle'];
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fi}" stroke="${st}" stroke-width="1.4"${o.dash ? ' stroke-dasharray="4 3"' : ''}/>` + S.text(x + w / 2, y + h / 2 + (o.size || 12.5) * 0.35, str, { size: o.size || 12.5, anchor: 'middle', mw: w - 14, box: [x, y, w, h], b: o.b });
  },
  zone(x, y, w, h, o = {}) {
    const [st] = ART_K[o.k || 'tint'];
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="var(--tint)" fill-opacity=".55" stroke="${st}" stroke-width="1.3" stroke-dasharray="6 5"/>` + (o.t ? S.text(x + 14, y + 20, o.t, { size: 12, b: 1, dim: 1, mw: w - 28 }) : '');
  },
  line(x1, y1, x2, y2, o = {}) { return S.route([[x1, y1], [x2, y2]], { ...o, head: false }); },
  arrow(x1, y1, x2, y2, o = {}) { return S.route([[x1, y1], [x2, y2]], o); },
  route(pts, o = {}) {
    const st = (ART_K[o.k || 'plain'] || ART_K.plain)[0], sw = o.w || 2, r = o.r == null ? 10 : o.r, HL = 9, HW = 4.6;
    const P = pts.map(p => [p[0], p[1]]), dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    const unit = (a, b) => { const d = dist(a, b) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
    const head = (tip, dir) => { const bx = tip[0] - dir[0] * HL, by = tip[1] - dir[1] * HL; return `<path d="M${tip[0]} ${tip[1]} L${S.n(bx - dir[1] * HW)} ${S.n(by + dir[0] * HW)} L${S.n(bx + dir[1] * HW)} ${S.n(by - dir[0] * HW)} z" fill="${st}"/>`; };
    const n = P.length, endDir = unit(P[n - 2], P[n - 1]), startDir = unit(P[1], P[0]);
    const Q = P.map(p => p.slice());
    if (o.head !== false) { Q[n - 1] = [P[n - 1][0] - endDir[0] * (HL - 1), P[n - 1][1] - endDir[1] * (HL - 1)]; }
    if (o.both) { Q[0] = [P[0][0] - startDir[0] * (HL - 1), P[0][1] - startDir[1] * (HL - 1)]; }
    let d = `M${S.n(Q[0][0])} ${S.n(Q[0][1])}`;
    for (let i = 1; i < n - 1; i++) {
      const a = Q[i - 1], b = Q[i], c = Q[i + 1], r1 = Math.min(r, dist(a, b) / 2), r2 = Math.min(r, dist(b, c) / 2), u1 = unit(a, b), u2 = unit(b, c);
      d += ` L${S.n(b[0] - u1[0] * r1)} ${S.n(b[1] - u1[1] * r1)} Q${b[0]} ${b[1]} ${S.n(b[0] + u2[0] * r2)} ${S.n(b[1] + u2[1] * r2)}`;
    }
    d += ` L${S.n(Q[n - 1][0])} ${S.n(Q[n - 1][1])}`;
    let g = `<path d="${d}" fill="none" stroke="${st}" stroke-width="${sw}"${o.dash ? ' stroke-dasharray="6 5"' : ''} stroke-linecap="round" stroke-linejoin="round"/>`;
    if (o.head !== false) g += head(P[n - 1], endDir);
    if (o.both) g += head(P[0], startDir);
    if (o.label) {
      let best = 0, bi = 0; for (let i = 0; i < n - 1; i++) { const L = dist(P[i], P[i + 1]); if (L > best) { best = L; bi = i; } }
      const mx = (P[bi][0] + P[bi + 1][0]) / 2 + (o.lx || 0), my = (P[bi][1] + P[bi + 1][1]) / 2 + (o.ly || 0), ls = o.ls || 12, tw = Math.max(20, artTw(o.label, ls) + 12);
      g += `<rect x="${S.n(mx - tw / 2)}" y="${S.n(my - ls * 0.8 - 3)}" width="${S.n(tw)}" height="${S.n(ls * 1.3 + 6)}" rx="6" fill="var(--paper)" stroke="var(--rule)" stroke-width="1"/>` + S.text(S.n(mx), S.n(my + ls * 0.35), o.label, { size: ls, anchor: 'middle', mw: Math.round(tw - 6), dim: 1 });
    }
    return g;
  },
  n(v) { return Math.round(v * 10) / 10; },
  num(x, y, n, o = {}) { const st = (ART_K[o.k || 'key'])[0]; return `<circle cx="${x}" cy="${y}" r="${o.r || 11}" fill="${st}"/>` + S.text(x, y + 4.5, String(n), { size: 12.5, b: 1, anchor: 'middle', fill: '#fff' }); },
  coin(x, y, r, str, o = {}) { const [st, fi] = ART_K[o.k || 'warn']; return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fi}" stroke="${st}" stroke-width="1.6"/>` + S.text(x, y + 4.5, str, { size: Math.min(13, r), b: 1, anchor: 'middle', mono: 1, mw: Math.round(r * 1.7) }); },
  icon(name, cx, cy, size = 28, k = 'plain') {
    const st = (ART_K[k] || ART_K.plain)[0], sc = size / 24, sw = Math.max(1.5, size / 15) / sc;
    return `<g transform="translate(${S.n(cx - size / 2)} ${S.n(cy - size / 2)}) scale(${S.n(sc * 1000) / 1000})" fill="none" stroke="${st}" stroke-width="${S.n(sw * 10) / 10}" stroke-linecap="round" stroke-linejoin="round">${ART_ICONS[name] || ''}</g>`;
  },
  /* even columns: S.cols(left, totalWidth, count, gap) -> [{x, w}, ...] */
  cols(x0, total, n, gap = 20) { const w = (total - gap * (n - 1)) / n; return Array.from({ length: n }, (_, i) => ({ x: S.n(x0 + i * (w + gap)), w: S.n(w) })); },
  /* a chain of blocks joined by short arrows: S.blocks(x, y, ['区块 1', ...], { w, h, gap, k, sub: [...] }) */
  blocks(x, y, labels, o = {}) {
    const w = o.w || 90, h = o.h || 46, gap = o.gap || 28; let g = '';
    labels.forEach((t, i) => {
      const kk = Array.isArray(o.k) ? o.k[i] : o.k;
      g += S.box(x + i * (w + gap), y, w, h, { k: kk || 'info', t, s: o.sub && o.sub[i] });
      if (i) g += S.arrow(x + i * (w + gap) - gap + 2, y + h / 2, x + i * (w + gap) - 2, y + h / 2, { k: 'plain', w: 1.8 });
    });
    return g;
  }
};
function art(title, w, h, parts, notes, aria, id) {
  const svg = `<svg class="fk-art" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(aria || String(title).replace(/^一图看懂：/, ''))}">${parts.join('')}</svg>`;
  return figWrap(title, svg, notes).replace('class="mmd fig-html"', `class="mmd fig-html fk-artfig"${id ? ` data-art="${id}"` : ''}`);
}
/* shrink any text wider than its slot (data-mw) so CJK width guesses never overflow a box */
function fitArt(root) {
  $$('svg.fk-art text[data-mw]', root).forEach(t => {
    let len = 0; try { len = t.getBBox().width; } catch (e) { return; }
    const mw = +t.dataset.mw;
    if (len > mw && len > 0) { const fs = parseFloat(t.getAttribute('font-size')) || 13; t.setAttribute('font-size', Math.max(9, fs * mw / len).toFixed(2)); }
  });
  /* narrow screens: the figure keeps a readable minimum width and scrolls sideways, so say so */
  $$('.fk-artfig .fig-body', root).forEach(b => {
    const nx = b.nextElementSibling;
    if (b.scrollWidth > b.clientWidth + 4 && !(nx && nx.classList.contains('fk-scrollhint'))) b.insertAdjacentHTML('afterend', '<div class="fk-scrollhint">← 左右滑动查看完整图 →</div>');
  });
}

/* readable diagrams: if a flowchart would shrink below MMD_MIN (or grow taller than a screen), try the other direction;
   whatever still shrinks below MMD_FLOOR is shown at MMD_FLOOR with horizontal scroll. */
const MMD_MIN = 0.6, MMD_FLOOR = 0.75, MMD_TALL = 1000;
function mmdFlip(src) {
  return src.replace(/^(\s*(?:flowchart|graph)\s+)(LR|RL|TB|TD|BT)/, (m, a, d) => a + ({ LR: 'TB', RL: 'TB', TB: 'LR', TD: 'LR', BT: 'LR' }[d]));
}
/* node classes usable in any flowchart / state diagram: A:::key  B:::risk  C:::ok  D:::warn (colors follow the theme) */
function mmdStyle(src) {
  if (!(/:::\w/.test(src) || /^\s*class\s+[\w,]+\s+(key|risk|ok|warn)\s*$/m.test(src)) || !/^\s*(flowchart|graph|stateDiagram)/.test(src)) return src;
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
  const def = (n, f, s) => `\n  classDef ${n} fill:${v(f)},stroke:${v(s)},stroke-width:2px,color:${v('--ink')}`;
  return src.replace(/\s+$/, '') + def('key', '--accent-soft', '--accent') + def('risk', '--risk-soft', '--risk') + def('ok', '--ok-soft', '--ok') + def('warn', '--warn-soft', '--warn');
}
function mmdMeasure(svg, avail) {
  const m = svg.match(/viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/);
  const w = m ? +m[1] : avail, h = m ? +m[2] : 0, s = Math.min(1, avail / w);
  return { w, h, s, shownH: h * s };
}
async function mmdRender(src, avail) {
  const a = (await mermaid.render('mmd' + (++mmdSeq), src)).svg;
  let best = { svg: a, ...mmdMeasure(a, avail), flipped: false };
  if (/^\s*(flowchart|graph)\s+(LR|RL|TB|TD|BT)/.test(src) && (best.s < MMD_MIN || best.shownH > MMD_TALL)) {
    try {
      const b = (await mermaid.render('mmd' + (++mmdSeq), mmdFlip(src))).svg, mb = mmdMeasure(b, avail);
      const better = best.s < MMD_MIN
        ? mb.s >= best.s + 0.15 && mb.shownH <= 1600            // too narrow: accept a taller but readable layout
        : mb.s >= MMD_MIN && mb.shownH < best.shownH * 0.8;     // too tall: accept a wider layout that stays readable
      if (better) best = { svg: b, ...mb, flipped: true };
    } catch (e) { $$('#dmmd' + mmdSeq).forEach(n => n.remove()); }
  }
  return best;
}
/* debug helper: measure every diagram at a given column width, e.g. await mmdAudit(790) */
async function mmdAudit(avail) {
  if (!mmdReady) mmdInit();
  const out = [];
  for (let i = 0; i < H.mmd.length; i++) {
    try { const r = await mmdRender(mmdStyle(H.mmd[i]), avail); out.push({ k: i, s: +r.s.toFixed(2), eff: +Math.max(r.s, MMD_FLOOR).toFixed(2), h: Math.round(r.h * Math.max(r.s, MMD_FLOOR)), flipped: r.flipped }); }
    catch (e) { out.push({ k: i, err: String(e).slice(0, 80) }); }
  }
  return out;
}
async function renderDiagrams(root) {
  const bodies = $$('.mmd-body', root);
  if (!bodies.length) return;
  const mmOk = mmdReady || mmdInit();
  for (const b of bodies) {
    const src = H.mmd[+b.dataset.k];
    const fk = fkFromMermaid(src);                 // simple chains and sequences become HTML cards / swimlanes
    if (fk) { b.innerHTML = fk.html; b.closest('figure').classList.add('fig-html', 'fk-' + fk.kind); continue; }
    if (!mmOk) { b.innerHTML = `<pre class="mmd-fallback">${esc(src)}</pre>`; continue; }
    try {
      const avail = Math.max(240, b.clientWidth - 28);
      const r = await mmdRender(mmdStyle(src), avail);
      b.innerHTML = r.svg;
      const fig = b.closest('figure');
      fig.classList.add('ready');
      const svg = $('svg', b);
      if (svg && r.s < MMD_FLOOR) {                 // never shrink text below ~75%: scroll sideways instead
        svg.style.maxWidth = 'none';
        svg.style.width = Math.round(r.w * MMD_FLOOR) + 'px';
        svg.style.height = 'auto';
        fig.classList.add('wide');
      }
    } catch (e) {
      b.innerHTML = `<pre class="mmd-fallback">${esc(src)}</pre>`;
      console.warn('mermaid', e);
      $$('#dmmd' + mmdSeq).forEach(n => n.remove());
    }
  }
}

/* ---------- diagram viewer (pan + zoom) ---------- */
const V = { s: 1, x: 0, y: 0, w: 0, h: 0 };
function vApply() { $('#vStage').style.transform = `translate(${V.x}px,${V.y}px) scale(${V.s})`; $('#vZoom').textContent = Math.round(V.s * 100) + '%'; }
function vFit() { const p = $('#vPort').getBoundingClientRect(); V.s = Math.min((p.width - 40) / V.w, (p.height - 40) / V.h, 3); V.x = (p.width - V.w * V.s) / 2; V.y = (p.height - V.h * V.s) / 2; vApply(); }
function vZoomAt(f, cx, cy) { const ns = Math.max(.2, Math.min(6, V.s * f)); V.x = cx - (cx - V.x) * ns / V.s; V.y = cy - (cy - V.y) * ns / V.s; V.s = ns; vApply(); }
function openViewer(fig) {
  const svg = $('svg', fig); if (!svg) return;
  const clone = svg.cloneNode(true);
  const vb = svg.viewBox && svg.viewBox.baseVal;
  V.w = (vb && vb.width) || svg.getBoundingClientRect().width; V.h = (vb && vb.height) || svg.getBoundingClientRect().height;
  clone.setAttribute('width', V.w + 24); clone.setAttribute('height', V.h + 24); clone.style.maxWidth = 'none';
  V.w += 24; V.h += 24;
  $('#vStage').innerHTML = ''; $('#vStage').appendChild(clone);
  $('#vTitle').textContent = $('.mmd-title span', fig).textContent;
  $('#viewer').hidden = false; document.body.style.overflow = 'hidden';
  vFit(); $('#vClose').focus();
}
function closeViewer() { $('#viewer').hidden = true; document.body.style.overflow = ''; }
function initViewer() {
  document.addEventListener('click', e => { const b = e.target.closest('figure.mmd.ready'); if (b && !e.target.closest('figcaption')) openViewer(b); });
  $('#vClose').onclick = closeViewer; $('#vFit').onclick = vFit;
  const ctr = () => { const p = $('#vPort').getBoundingClientRect(); return [p.width / 2, p.height / 2]; };
  $('#vIn').onclick = () => vZoomAt(1.25, ...ctr()); $('#vOut').onclick = () => vZoomAt(.8, ...ctr());
  const port = $('#vPort'); let drag = null; const pts = new Map(); let pinch = 0;
  port.addEventListener('wheel', e => { e.preventDefault(); const r = port.getBoundingClientRect(); if (e.ctrlKey || e.metaKey) vZoomAt(e.deltaY < 0 ? 1.12 : .89, e.clientX - r.left, e.clientY - r.top); else { V.x -= e.deltaX; V.y -= e.deltaY; vApply(); } }, { passive: false });
  port.addEventListener('pointerdown', e => { port.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); drag = [e.clientX, e.clientY]; });
  port.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const r = port.getBoundingClientRect(); if (pinch) vZoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); pinch = d; return; }
    if (drag) { V.x += e.clientX - drag[0]; V.y += e.clientY - drag[1]; drag = [e.clientX, e.clientY]; vApply(); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) drag = null; };
  port.addEventListener('pointerup', up); port.addEventListener('pointercancel', up);
  port.addEventListener('dblclick', e => { const r = port.getBoundingClientRect(); vZoomAt(1.6, e.clientX - r.left, e.clientY - r.top); });
  document.addEventListener('keydown', e => { if ($('#viewer').hidden) return; if (e.key === 'Escape') closeViewer(); if (e.key === '+' || e.key === '=') vZoomAt(1.25, ...ctr()); if (e.key === '-') vZoomAt(.8, ...ctr()); if (e.key === '0') vFit(); });
}

/* ---------- search ---------- */
let IDX = null;
function buildIndex() {
  const tmp = document.createElement('div');
  IDX = H.ch.map(c => { tmp.innerHTML = typeof c.html === 'function' ? c.html() : c.html; return { c, text: tmp.textContent.replace(/\s+/g, ' ') }; });
  Object.entries(H.labs).forEach(([id, L]) => IDX.push({ c: { id: 'lab-' + id, code: 'LAB', title: L.title }, text: L.title + ' ' + L.desc }));
}
function search(q) {
  const box = $('#results');
  q = q.trim();
  if (!q) { box.hidden = true; $('#navGroups').hidden = false; return; }
  if (!IDX) buildIndex();
  const ql = q.toLowerCase();
  const hits = IDX.map(({ c, text }) => {
    const i = text.toLowerCase().indexOf(ql);
    const inTitle = c.title.toLowerCase().includes(ql);
    if (i < 0 && !inTitle) return null;
    const st = Math.max(0, i - 24);
    const snip = i < 0 ? '' : esc(text.slice(st, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length, i + q.length + 40));
    return { c, snip, score: inTitle ? 0 : 1 };
  }).filter(Boolean).sort((a, b) => a.score - b.score);
  box.innerHTML = hits.length ? hits.slice(0, 30).map(h => `<a class="result" href="#${h.c.id}"><b>${h.c.code} ${esc(h.c.title)}</b><span>…${h.snip}…</span></a>`).join('') : '<div class="muted small" style="padding:8px">没有结果。换一个关键词。</div>';
  box.hidden = false; $('#navGroups').hidden = true;
}
