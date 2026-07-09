/* ZombieChronicles — UI kit előkészítő (zero-dependency: beépített zlib + fs).
   A ui_kit_v1 forrás-PNG-k (1254², RGB, FLAT VILÁGOS háttér) production assetté
   alakítása a runtime assets/ui/ nevekre:
     1) VILÁGOS HÁTTÉR eltávolítása ÉL-FLOOD-FILL-lel (csak a kép SZÉLÉRŐL induló
        világos háttér lesz átlátszó → a belső highlightok / betűk / glow MEGMARADNAK,
        a fémkeret nem lyukad ki), lágy szél-feather a fehér halo ellen.
     2) trim a tartalom bbox-ára.
     3) ikonoknál: 256×256 átlátszó vászonra, a tartalom ~70%-án, középre (semmi nem
        vágódik le, semmi nem ér a szélhez); logónál: arány-tartó, transparent, cappelt.
   A 3D hatás / keret / glow / árnyék 1:1 megmarad (nincs redraw, nincs slicing). */
const fs = require('fs'), zlib = require('zlib'), path = require('path');

/* ---- PNG olvasás (RGB/RGBA) ---- */
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
/* -> RGBA */
function toRGBA(s) { const { w, h, ch, px } = s; if (ch === 4) return s; const out = Buffer.alloc(w * h * 4); for (let i = 0; i < w * h; i++) { const o = i * ch; out[i * 4] = px[o]; out[i * 4 + 1] = px[o + 1]; out[i * 4 + 2] = px[o + 2]; out[i * 4 + 3] = 255; } return { w, h, ch: 4, px: out }; }

const CRCT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const ty = Buffer.from(t, 'ascii'); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([ty, d])), 0); return Buffer.concat([l, ty, d, cr]); }
function writePNG(file, w, h, rgba) { const stride = w * 4; const f = Buffer.alloc(h * (stride + 1)); for (let y = 0; y < h; y++) { f[y * (stride + 1)] = 0; rgba.copy(f, y * (stride + 1) + 1, y * stride, y * stride + stride); } const idat = zlib.deflateSync(f, { level: 9 }); const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])); }

/* bilineáris RGBA resize */
function resize(px, w, h, dw, dh) { const out = Buffer.alloc(dw * dh * 4); for (let y = 0; y < dh; y++) { let sy = (y + .5) * h / dh - .5; let y0 = Math.floor(sy); let fy = sy - y0; if (y0 < 0) { y0 = 0; fy = 0 } if (y0 > h - 2) { y0 = Math.max(0, h - 2); fy = h === 1 ? 0 : 1 } for (let x = 0; x < dw; x++) { let sx = (x + .5) * w / dw - .5; let x0 = Math.floor(sx); let fx = sx - x0; if (x0 < 0) { x0 = 0; fx = 0 } if (x0 > w - 2) { x0 = Math.max(0, w - 2); fx = w === 1 ? 0 : 1 } for (let c = 0; c < 4; c++) { const i00 = (y0 * w + x0) * 4 + c, i10 = (y0 * w + x0 + 1) * 4 + c, i01 = ((y0 + 1) * w + x0) * 4 + c, i11 = ((y0 + 1) * w + x0 + 1) * 4 + c; const t = px[i00] + (px[i10] - px[i00]) * fx, b = px[i01] + (px[i11] - px[i01]) * fx; out[(y * dw + x) * 4 + c] = Math.round(t + (b - t) * fy); } } } return out; }

/* ÉL-FLOOD-FILL háttér-eltávolítás: a széli VILÁGOS hátteret átlátszóvá teszi,
   a belső világos részeket (betűk, highlight, glow) MEGTARTJA. */
function removeLightBg(s, hardTh, softLo) {
  const { w, h, px } = s; // RGBA in
  const N = w * h; const bg = new Uint8Array(N); // 1 = háttér
  const stack = []; const isLight = (i) => { const o = i * 4; return Math.min(px[o], px[o + 1], px[o + 2]) > hardTh; };
  const pushIf = (i) => { if (!bg[i] && isLight(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { pushIf(x); pushIf((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { pushIf(y * w); pushIf(y * w + w - 1); }
  while (stack.length) { const i = stack.pop(); const x = i % w, y = (i / w) | 0; if (x > 0) pushIf(i - 1); if (x < w - 1) pushIf(i + 1); if (y > 0) pushIf(i - w); if (y < h - 1) pushIf(i + w); }
  // alpha: háttér -> 0; a háttérrel szomszédos VILÁGOS él-pixeleket lágyítjuk (halo ellen)
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    if (bg[i]) { px[o + 3] = 0; continue; }
    const x = i % w, y = (i / w) | 0;
    const nearBg = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
    if (nearBg) {
      const mn = Math.min(px[o], px[o + 1], px[o + 2]);
      if (mn > softLo) { // világos szél -> arányos átlátszóság a fehér perem ellen
        const a = Math.max(0, Math.min(255, Math.round(255 * (hardTh - mn) / (hardTh - softLo))));
        px[o + 3] = a;
      }
    }
  }
  return s;
}

/* alpha bbox (trim) */
function alphaBBox(s, at) { const { w, h, px } = s; let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (px[(y * w + x) * 4 + 3] > at) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } if (x1 < 0) return { x: 0, y: 0, w, h }; return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; }
function cropRGBA(s, bb) { const { w, px } = s; const out = Buffer.alloc(bb.w * bb.h * 4); for (let j = 0; j < bb.h; j++) px.copy(out, j * bb.w * 4, ((bb.y + j) * w + bb.x) * 4, ((bb.y + j) * w + bb.x + bb.w) * 4); return { w: bb.w, h: bb.h, ch: 4, px: out }; }

/* ---- jobok ---- */
const KIT = 'assets/references/ui_kit_v1', OUT = 'assets/ui';
const HARD = 232, SOFT = 200;         // háttér-küszöbök
const CANVAS = 256, FILL = 0.70;      // ikon: 70% kitöltés
const ICONS = [
  ['menu/menu_continue.png', 'm-continue.png'], ['menu/menu_campaign.png', 'm-campaign.png'],
  ['menu/menu_scavenge.png', 'm-scavenge.png'], ['menu/menu_armory.png', 'm-armory.png'],
  ['menu/menu_lab.png', 'm-lab.png'], ['menu/menu_shop.png', 'm-shop.png'],
  ['menu/menu_settings.png', 'm-settings.png'], ['menu/menu_back.png', 'm-back.png'],
  ['markers/marker_completed.png', 's-done.png'], ['markers/marker_current.png', 's-current.png'],
  ['markers/marker_locked.png', 's-locked.png'], ['markers/marker_boss.png', 's-boss.png'],
  ['markers/marker_loot.png', 's-loot.png'], ['markers/marker_danger.png', 's-danger.png'],
  ['elements/coin.png', 'ic-coin.png'],
];
for (const [src, dst] of ICONS) {
  const s = removeLightBg(toRGBA(readPNG(path.join(KIT, src))), HARD, SOFT);
  const bb = alphaBBox(s, 12); const c = cropRGBA(s, bb);
  const target = Math.round(CANVAS * FILL);
  const scale = target / Math.max(c.w, c.h); const dw = Math.max(1, Math.round(c.w * scale)), dh = Math.max(1, Math.round(c.h * scale));
  const scaled = resize(c.px, c.w, c.h, dw, dh);
  const out = Buffer.alloc(CANVAS * CANVAS * 4, 0); const ox = (CANVAS - dw) >> 1, oy = (CANVAS - dh) >> 1;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const si = (y * dw + x) * 4, di = ((oy + y) * CANVAS + (ox + x)) * 4; out[di] = scaled[si]; out[di + 1] = scaled[si + 1]; out[di + 2] = scaled[si + 2]; out[di + 3] = scaled[si + 3]; }
  writePNG(path.join(OUT, dst), CANVAS, CANVAS, out);
  console.log('icon ', dst, ' bbox=' + bb.w + 'x' + bb.h, '-> content ' + dw + 'x' + dh + ' @256');
}

/* logó: arány-tartó, transparent, max 760px */
for (const [src, dst, cap] of [['logo/logo_full.png', 'logo.png', 760]]) {
  const s = removeLightBg(toRGBA(readPNG(path.join(KIT, src))), HARD, SOFT);
  const bb = alphaBBox(s, 12); const c = cropRGBA(s, bb);
  const scale = Math.min(1, cap / c.w); const dw = Math.round(c.w * scale), dh = Math.round(c.h * scale);
  const scaled = resize(c.px, c.w, c.h, dw, dh);
  writePNG(path.join(OUT, dst), dw, dh, scaled);
  console.log('logo ', dst, ' bbox=' + bb.w + 'x' + bb.h, '-> ' + dw + 'x' + dh);
}
console.log('done');
