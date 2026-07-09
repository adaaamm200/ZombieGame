/* ZombieChronicles — GENERÁLT GOMB-ASSET előkészítő (zero-dependency: beépített zlib + fs).
   A felhasználó ChatGPT-vel generált button PNG-jei (RGB, VILÁGOS / világos-checker háttér)
   → production gomb-assetté alakítása az assets/ui/buttons/ mappába:
     1) VILÁGOS HÁTTÉR eltávolítása ÉL-FLOOD-FILL-lel (csak a kép SZÉLÉRŐL induló világos
        háttér lesz átlátszó → a belső 3D fém, betűk, glow, textúra, keret 1:1 MEGMARAD).
        Lágy szél-feather a fehér halo ellen.
     2) trim a tartalom (glow-t is tartalmazó) alpha-bbox-ára.
     3) ARÁNY-TARTÓ átméretezés a hosszabb oldal `cap` értékére + kis átlátszó safe padding
        (semmi nem ér a kép széléhez). NINCS 256×256 kényszer: széles gomb széles marad,
        vertical board-nav kártya vertical marad.
   A PNG MAGA a teljes gomb (nincs redraw, nincs slicing, nincs crop, nincs flat UI). */
const fs = require('fs'), zlib = require('zlib'), path = require('path');

/* ---- PNG olvasás (RGB/RGBA, bitdepth 8, non-interlaced) ---- */
function readPNG(file) {
  const buf = fs.readFileSync(file); let off = 8, ihdr = null; const idat = [];
  while (off < buf.length) { const len = buf.readUInt32BE(off); const t = buf.toString('ascii', off + 4, off + 8); const d = buf.slice(off + 8, off + 8 + len); if (t === 'IHDR') ihdr = { w: d.readUInt32BE(0), h: d.readUInt32BE(4), bd: d[8], ct: d[9], il: d[12] }; else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break; off += 12 + len; }
  if (ihdr.bd !== 8 || ihdr.il) throw new Error('unsupported ' + file);
  const ch = ihdr.ct === 6 ? 4 : ihdr.ct === 2 ? 3 : ihdr.ct === 0 ? 1 : ihdr.ct === 4 ? 2 : 0;
  if (!ch) throw new Error('colorType ' + ihdr.ct);
  const raw = zlib.inflateSync(Buffer.concat(idat)); const { w, h } = ihdr, stride = w * ch; const px = Buffer.alloc(h * stride); let p = 0;
  for (let y = 0; y < h; y++) { const ft = raw[p++]; for (let x = 0; x < stride; x++) { const rb = raw[p++]; const a = x >= ch ? px[y * stride + x - ch] : 0, b = y > 0 ? px[(y - 1) * stride + x] : 0, c = (x >= ch && y > 0) ? px[(y - 1) * stride + x - ch] : 0; let v; switch (ft) { case 0: v = rb; break; case 1: v = rb + a; break; case 2: v = rb + b; break; case 3: v = rb + ((a + b) >> 1); break; case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = rb + ((pa <= pb && pa <= pc) ? a : (pb <= pc) ? b : c); break; } } px[y * stride + x] = v & 0xff; } }
  return { w, h, ch, px };
}
function toRGBA(s) { const { w, h, ch, px } = s; if (ch === 4) return s; const out = Buffer.alloc(w * h * 4); for (let i = 0; i < w * h; i++) { const o = i * ch; out[i * 4] = px[o]; out[i * 4 + 1] = px[o + 1]; out[i * 4 + 2] = px[o + 2]; out[i * 4 + 3] = 255; } return { w, h, ch: 4, px: out }; }

const CRCT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const ty = Buffer.from(t, 'ascii'); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([ty, d])), 0); return Buffer.concat([l, ty, d, cr]); }
function writePNG(file, w, h, rgba) { const stride = w * 4; const f = Buffer.alloc(h * (stride + 1)); for (let y = 0; y < h; y++) { f[y * (stride + 1)] = 0; rgba.copy(f, y * (stride + 1) + 1, y * stride, y * stride + stride); } const idat = zlib.deflateSync(f, { level: 9 }); const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])); }

/* bilineáris RGBA resize */
function resize(px, w, h, dw, dh) { const out = Buffer.alloc(dw * dh * 4); for (let y = 0; y < dh; y++) { let sy = (y + .5) * h / dh - .5; let y0 = Math.floor(sy); let fy = sy - y0; if (y0 < 0) { y0 = 0; fy = 0 } if (y0 > h - 2) { y0 = Math.max(0, h - 2); fy = h === 1 ? 0 : 1 } for (let x = 0; x < dw; x++) { let sx = (x + .5) * w / dw - .5; let x0 = Math.floor(sx); let fx = sx - x0; if (x0 < 0) { x0 = 0; fx = 0 } if (x0 > w - 2) { x0 = Math.max(0, w - 2); fx = w === 1 ? 0 : 1 } for (let c = 0; c < 4; c++) { const i00 = (y0 * w + x0) * 4 + c, i10 = (y0 * w + x0 + 1) * 4 + c, i01 = ((y0 + 1) * w + x0) * 4 + c, i11 = ((y0 + 1) * w + x0 + 1) * 4 + c; const t = px[i00] + (px[i10] - px[i00]) * fx, b = px[i01] + (px[i11] - px[i01]) * fx; out[(y * dw + x) * 4 + c] = Math.round(t + (b - t) * fy); } } } return out; }

/* ÉL-FLOOD-FILL: a széli VILÁGOS/checker hátteret átlátszóvá teszi, a belső 3D fémet /
   betűket / glow-t MEGTARTJA. hardTh: e fölötti min-csatorna = háttér-jelölt. */
function removeLightBg(s, hardTh, softLo) {
  const { w, h, px } = s; const N = w * h; const bg = new Uint8Array(N); const stack = [];
  const isLight = (i) => { const o = i * 4; return Math.min(px[o], px[o + 1], px[o + 2]) > hardTh; };
  const pushIf = (i) => { if (!bg[i] && isLight(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { pushIf(x); pushIf((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { pushIf(y * w); pushIf(y * w + w - 1); }
  while (stack.length) { const i = stack.pop(); const x = i % w, y = (i / w) | 0; if (x > 0) pushIf(i - 1); if (x < w - 1) pushIf(i + 1); if (y > 0) pushIf(i - w); if (y < h - 1) pushIf(i + w); }
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    if (bg[i]) { px[o + 3] = 0; continue; }
    const x = i % w, y = (i / w) | 0;
    const nearBg = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
    if (nearBg) { const mn = Math.min(px[o], px[o + 1], px[o + 2]); if (mn > softLo) px[o + 3] = Math.max(0, Math.min(255, Math.round(255 * (hardTh - mn) / (hardTh - softLo)))); }
  }
  return s;
}
function alphaBBox(s, at) { const { w, h, px } = s; let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (px[(y * w + x) * 4 + 3] > at) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } if (x1 < 0) return { x: 0, y: 0, w, h }; return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; }
function cropRGBA(s, bb) { const { w, px } = s; const out = Buffer.alloc(bb.w * bb.h * 4); for (let j = 0; j < bb.h; j++) px.copy(out, j * bb.w * 4, ((bb.y + j) * w + bb.x) * 4, ((bb.y + j) * w + bb.x + bb.w) * 4); return { w: bb.w, h: bb.h, ch: 4, px: out }; }

/* ---- jobok: [forrás-fájl, kimenet, hosszabb-oldal-cap] ---- */
const REF = 'assets/references', OUT = 'assets/ui/buttons';
const HARD = 232, SOFT = 200, PAD = 0.035; // háttér-küszöbök + safe padding (a tartalom hosszának 3.5%-a)
const JOBS = [
  ['ChatGPT Image 2026. júl. 9. 11_01_25 (1).png', 'btn_campaign_board.png', 640],
  ['ChatGPT Image 2026. júl. 9. 11_01_26 (2).png', 'btn_scavenge_board.png', 640],
  ['ChatGPT Image 2026. júl. 9. 11_01_26 (3).png', 'btn_settings_board.png', 640],
  ['ChatGPT Image 2026. júl. 9. 11_01_26 (4).png', 'btn_shop_cta.png', 720],
  ['ChatGPT Image 2026. júl. 9. 11_01_26 (5).png', 'btn_back.png', 256],
  ['ChatGPT Image 2026. júl. 9. 11_01_27 (8).png', 'btn_fight_boss.png', 720],
  ['ChatGPT Image 2026. júl. 9. 11_01_27 (9).png', 'btn_close.png', 256],
  ['ChatGPT Image 2026. júl. 9. 11_04_32.png', 'btn_replay.png', 720],
  ['ChatGPT Image 2026. júl. 9. 11_04_36.png', 'btn_start_run.png', 720],
];
fs.mkdirSync(OUT, { recursive: true });
for (const [src, dst, cap] of JOBS) {
  const s = removeLightBg(toRGBA(readPNG(path.join(REF, src))), HARD, SOFT);
  const bb = alphaBBox(s, 10); const c = cropRGBA(s, bb);
  const scale = Math.min(1, cap / Math.max(c.w, c.h));
  const dw = Math.max(1, Math.round(c.w * scale)), dh = Math.max(1, Math.round(c.h * scale));
  const scaled = resize(c.px, c.w, c.h, dw, dh);
  const pad = Math.max(4, Math.round(Math.max(dw, dh) * PAD));
  const cw = dw + pad * 2, chh = dh + pad * 2;
  const out = Buffer.alloc(cw * chh * 4, 0);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const si = (y * dw + x) * 4, di = ((pad + y) * cw + (pad + x)) * 4; out[di] = scaled[si]; out[di + 1] = scaled[si + 1]; out[di + 2] = scaled[si + 2]; out[di + 3] = scaled[si + 3]; }
  writePNG(path.join(OUT, dst), cw, chh, out);
  console.log('btn ', dst.padEnd(22), 'src bbox=' + bb.w + 'x' + bb.h, '-> ' + cw + 'x' + chh + ' (pad ' + pad + ')');
}
console.log('done');
