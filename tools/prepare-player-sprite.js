/* ZombieChronicles — HD JÁTÉKOS-SPRITE előkészítő (zero-dep).
   A CHARACTER katona-lapból (assets/references/CHARACTER/*.png, RGB, világos háttér)
   tiszta játékos-sprite + atlasz. A sorok eltérő oszlopszámúak → PROJEKCIÓS detektálás
   (sor-sávok → oszlop-figurák), majd soronkénti állapot-prefix a nevekhez. */
const fs = require('fs'), zlib = require('zlib'), path = require('path');

function readPNG(file) {
  const buf = fs.readFileSync(file); let off = 8, ihdr = null; const idat = [];
  while (off < buf.length) { const len = buf.readUInt32BE(off); const t = buf.toString('ascii', off + 4, off + 8); const d = buf.slice(off + 8, off + 8 + len); if (t === 'IHDR') ihdr = { w: d.readUInt32BE(0), h: d.readUInt32BE(4), bd: d[8], ct: d[9], il: d[12] }; else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break; off += 12 + len; }
  const ch = ihdr.ct === 6 ? 4 : ihdr.ct === 2 ? 3 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat)); const { w, h } = ihdr, stride = w * ch; const px = Buffer.alloc(h * stride); let p = 0;
  for (let y = 0; y < h; y++) { const ft = raw[p++]; for (let x = 0; x < stride; x++) { const rb = raw[p++]; const a = x >= ch ? px[y * stride + x - ch] : 0, b = y > 0 ? px[(y - 1) * stride + x] : 0, c = (x >= ch && y > 0) ? px[(y - 1) * stride + x - ch] : 0; let v; switch (ft) { case 0: v = rb; break; case 1: v = rb + a; break; case 2: v = rb + b; break; case 3: v = rb + ((a + b) >> 1); break; case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = rb + ((pa <= pb && pa <= pc) ? a : (pb <= pc) ? b : c); break; } } px[y * stride + x] = v & 0xff; } }
  return { w, h, ch, px };
}
function toRGBA(s) { const { w, h, ch, px } = s; if (ch === 4) return s; const out = Buffer.alloc(w * h * 4); for (let i = 0; i < w * h; i++) { const o = i * ch; out[i * 4] = px[o]; out[i * 4 + 1] = px[o + 1]; out[i * 4 + 2] = px[o + 2]; out[i * 4 + 3] = 255; } return { w, h, ch: 4, px: out }; }
const CRCT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const ty = Buffer.from(t, 'ascii'); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([ty, d])), 0); return Buffer.concat([l, ty, d, cr]); }
function writePNG(file, w, h, rgba) { const stride = w * 4; const f = Buffer.alloc(h * (stride + 1)); for (let y = 0; y < h; y++) { f[y * (stride + 1)] = 0; rgba.copy(f, y * (stride + 1) + 1, y * stride, y * stride + stride); } const idat = zlib.deflateSync(f, { level: 9 }); const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])); }
function resize(px, w, h, dw, dh) { const out = Buffer.alloc(dw * dh * 4); for (let y = 0; y < dh; y++) { let sy = (y + .5) * h / dh - .5; let y0 = Math.floor(sy); let fy = sy - y0; if (y0 < 0) { y0 = 0; fy = 0 } if (y0 > h - 2) { y0 = Math.max(0, h - 2); fy = h === 1 ? 0 : 1 } for (let x = 0; x < dw; x++) { let sx = (x + .5) * w / dw - .5; let x0 = Math.floor(sx); let fx = sx - x0; if (x0 < 0) { x0 = 0; fx = 0 } if (x0 > w - 2) { x0 = Math.max(0, w - 2); fx = w === 1 ? 0 : 1 } for (let c = 0; c < 4; c++) { const i00 = (y0 * w + x0) * 4 + c, i10 = (y0 * w + x0 + 1) * 4 + c, i01 = ((y0 + 1) * w + x0) * 4 + c, i11 = ((y0 + 1) * w + x0 + 1) * 4 + c; const t = px[i00] + (px[i10] - px[i00]) * fx, b = px[i01] + (px[i11] - px[i01]) * fx; out[(y * dw + x) * 4 + c] = Math.round(t + (b - t) * fy); } } } return out; }
function removeLightBg(s, hardTh, softLo) {
  const { w, h, px } = s; const N = w * h; const bg = new Uint8Array(N); const stack = [];
  const isLight = (i) => { const o = i * 4; return Math.min(px[o], px[o + 1], px[o + 2]) > hardTh; };
  const pushIf = (i) => { if (!bg[i] && isLight(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { pushIf(x); pushIf((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { pushIf(y * w); pushIf(y * w + w - 1); }
  while (stack.length) { const i = stack.pop(); const x = i % w, y = (i / w) | 0; if (x > 0) pushIf(i - 1); if (x < w - 1) pushIf(i + 1); if (y > 0) pushIf(i - w); if (y < h - 1) pushIf(i + w); }
  for (let i = 0; i < N; i++) { const o = i * 4; if (bg[i]) { px[o + 3] = 0; continue; } const x = i % w, y = (i / w) | 0; const nb = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]); if (nb) { const mn = Math.min(px[o], px[o + 1], px[o + 2]); if (mn > softLo) px[o + 3] = Math.max(0, Math.min(255, Math.round(255 * (hardTh - mn) / (hardTh - softLo)))); } }
  /* DEFRINGE: háttér+feather RGB → fekete (nincs fehér halo a skálázott éleken) */
  for (let i = 0; i < N; i++) { const o = i * 4; if (px[o + 3] < 255) { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; } }
  return s;
}
/* futamok: on-indexek maximális futamai, ha az elválasztó rés >= gap */
function runs(val, thr, gap, n) {
  const on = new Uint8Array(n); for (let i = 0; i < n; i++) on[i] = val[i] > thr ? 1 : 0;
  const res = []; let i = 0;
  while (i < n) {
    while (i < n && !on[i]) i++; if (i >= n) break;
    let start = i, last = i;
    while (i < n) { if (on[i]) { last = i; i++; } else { let j = i; while (j < n && !on[j]) j++; if (j - i >= gap || j >= n) break; i = j; } }
    res.push([start, last]);
  }
  return res;
}
function detectRows(s, gapY) {
  const { w, h, px } = s; const AT = 40; const rc = new Int32Array(h);
  for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > AT) c++; rc[y] = c; }
  return runs(rc, Math.max(10, (w * 0.02) | 0), gapY, h);  // magas küszöb → a rés-sorok szórványát kiszűri
}
function detectCols(s, y0, y1, gapX) {
  const { w, px } = s; const AT = 40; const cc = new Int32Array(w);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > AT) cc[x]++;
  const cols = runs(cc, Math.max(4, ((y1 - y0) * 0.05) | 0), gapX, w);
  return cols.map(([x0, x1]) => {
    let bx0 = x1, by0 = y1, bx1 = x0, by1 = y0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (px[(y * w + x) * 4 + 3] > AT) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    return { x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1 };
  }).filter((f) => f.w > 14 && f.h > 30);
}
function strokeRect(px, w, h, r, col) { const set = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const o = (y * w + x) * 4; px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255; }; for (let t = 0; t < 2; t++) { for (let x = r.x; x < r.x + r.w; x++) { set(x, r.y + t); set(x, r.y + r.h - 1 - t); } for (let y = r.y; y < r.y + r.h; y++) { set(r.x + t, y); set(r.x + r.w - 1 - t, y); } } }

const SRC = 'assets/references/CHARACTER/ChatGPT Image 2026. júl. 9. 11_20_15.png';
const OUT = 'assets/player';
const HARD = 228, SOFT = 195, SCALE = 0.5;
/* soronkénti állapot-prefix (fentről le); a sorokat a projekció találja meg */
const ROW_PREFIX = ['walk', 'run', 'shoot', 'aim', 'hurt', 'death'];

fs.mkdirSync(OUT, { recursive: true });
let s = removeLightBg(toRGBA(readPNG(SRC)), HARD, SOFT);
const dw = Math.round(s.w * SCALE), dh = Math.round(s.h * SCALE);
s = { w: dw, h: dh, ch: 4, px: resize(s.px, s.w, s.h, dw, dh) };
writePNG(path.join(OUT, 'player_sheet.png'), s.w, s.h, s.px);

const rows = detectRows(s, Math.round(14 * SCALE));
const frames = {};
const dbg = Buffer.from(s.px);
rows.forEach((band, ri) => {
  const cols = detectCols(s, band[0], band[1], Math.round(22 * SCALE));
  const prefix = ROW_PREFIX[ri] || ('row' + ri);
  cols.forEach((f, ci) => { frames[prefix + '_' + ci] = { x: f.x, y: f.y, w: f.w, h: f.h, ax: 0.5, ay: 1.0 }; strokeRect(dbg, s.w, s.h, f, [40, 200, 255]); });
  console.log(('row' + ri + ' ' + prefix).padEnd(14), cols.length + ' frames', cols.map((f) => f.w + 'x' + f.h).join(' '));
});
writePNG(path.join(OUT, '_debug_player.png'), s.w, s.h, dbg);
fs.writeFileSync(path.join(OUT, 'player_atlas.json'), JSON.stringify({ image: 'player_sheet.png', sheetW: s.w, sheetH: s.h, frames }, null, 1));
console.log('rows:', rows.length, '-> assets/player/player_atlas.json,', Object.keys(frames).length, 'frames');
