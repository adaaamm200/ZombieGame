/* ZombieChronicles — MAP PARALLAX-RÉTEG előkészítő (zero-dep: zlib + fs).
   A rétegre bontott HD forrás-stripekből (assets/references/maps/levels/) kicsi, játékkész
   runtime parallax-rétegeket készít az assets/maps/ alá.
     - FAR / GROUND: teljes-bleed, ATLÁTSZATLAN → csak leméretezés a játék-felbontásra.
     - MIDGROUND: a near-black ÉG-hátteret ÉL-FLOOD-FILL-lel a FELSŐ élről átlátszóvá teszi
       (a sötét ÉPÜLET-részletek MEGmaradnak — NEM naiv fekete-küszöb!), majd leméretez.
   A `tile` a motorban logikai méreten (px/ART, ART=2) rajzol → a kimeneti PNG szélessége/
   magassága = kívánt_logikai × ART. */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const ART = 2;

function readPNG(file) {
  const b = fs.readFileSync(file); let o = 8, ih = null; const id = [];
  while (o < b.length) { const l = b.readUInt32BE(o), t = b.toString('ascii', o + 4, o + 8), d = b.slice(o + 8, o + 8 + l); if (t === 'IHDR') ih = { w: d.readUInt32BE(0), h: d.readUInt32BE(4), bd: d[8], ct: d[9], il: d[12] }; else if (t === 'IDAT') id.push(d); else if (t === 'IEND') break; o += 12 + l; }
  if (ih.bd !== 8 || ih.il) throw new Error('unsupported ' + file);
  const ch = ih.ct === 6 ? 4 : ih.ct === 2 ? 3 : ih.ct === 0 ? 1 : 2;
  const raw = zlib.inflateSync(Buffer.concat(id)); const { w, h } = ih, st = w * ch; const px = Buffer.alloc(h * st); let p = 0;
  for (let y = 0; y < h; y++) { const ft = raw[p++]; for (let x = 0; x < st; x++) { const rb = raw[p++]; const a = x >= ch ? px[y * st + x - ch] : 0, bb = y > 0 ? px[(y - 1) * st + x] : 0, c = (x >= ch && y > 0) ? px[(y - 1) * st + x - ch] : 0; let v; switch (ft) { case 0: v = rb; break; case 1: v = rb + a; break; case 2: v = rb + bb; break; case 3: v = rb + ((a + bb) >> 1); break; case 4: { const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c); v = rb + ((pa <= pb && pa <= pc) ? a : (pb <= pc) ? bb : c); break; } } px[y * st + x] = v & 0xff; } }
  return { w, h, ch, px };
}
function toRGBA(s) { const { w, h, ch, px } = s; if (ch === 4) return s; const out = Buffer.alloc(w * h * 4); for (let i = 0; i < w * h; i++) { const o = i * ch; out[i * 4] = px[o]; out[i * 4 + 1] = px[o + 1]; out[i * 4 + 2] = px[o + 2]; out[i * 4 + 3] = 255; } return { w, h, ch: 4, px: out }; }
const CRCT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const ty = Buffer.from(t, 'ascii'); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([ty, d])), 0); return Buffer.concat([l, ty, d, cr]); }
function writePNG(file, w, h, rgba) { const stride = w * 4; const f = Buffer.alloc(h * (stride + 1)); for (let y = 0; y < h; y++) { f[y * (stride + 1)] = 0; rgba.copy(f, y * (stride + 1) + 1, y * stride, y * stride + stride); } const idat = zlib.deflateSync(f, { level: 9 }); const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])); }
function resize(px, w, h, dw, dh) { const out = Buffer.alloc(dw * dh * 4); for (let y = 0; y < dh; y++) { let sy = (y + .5) * h / dh - .5; let y0 = Math.floor(sy); let fy = sy - y0; if (y0 < 0) { y0 = 0; fy = 0 } if (y0 > h - 2) { y0 = Math.max(0, h - 2); fy = h === 1 ? 0 : 1 } for (let x = 0; x < dw; x++) { let sx = (x + .5) * w / dw - .5; let x0 = Math.floor(sx); let fx = sx - x0; if (x0 < 0) { x0 = 0; fx = 0 } if (x0 > w - 2) { x0 = Math.max(0, w - 2); fx = w === 1 ? 0 : 1 } for (let c = 0; c < 4; c++) { const i00 = (y0 * w + x0) * 4 + c, i10 = (y0 * w + x0 + 1) * 4 + c, i01 = ((y0 + 1) * w + x0) * 4 + c, i11 = ((y0 + 1) * w + x0 + 1) * 4 + c; const t = px[i00] + (px[i10] - px[i00]) * fx, b = px[i01] + (px[i11] - px[i01]) * fx; out[(y * dw + x) * 4 + c] = Math.round(t + (b - t) * fy); } } } return out; }

/* SÖTÉT háttér-eltávolítás flood-fillel a megadott élekről: a near-black (max-csatorna <
   darkTh), az élhez KAPCSOLÓDÓ tartományt átlátszóvá teszi. A zárt (objektum-belső) sötét
   részek NEM élhez kapcsolódnak → megmaradnak (NEM naiv fekete-küszöb!). Lágy feather + defringe. */
function removeDarkBg(s, darkTh, soft, allEdges) {
  const { w, h, px } = s; const N = w * h; const bg = new Uint8Array(N); const stack = [];
  const isDark = (i) => { const o = i * 4; return Math.max(px[o], px[o + 1], px[o + 2]) < darkTh; };
  const pushIf = (i) => { if (!bg[i] && isDark(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { pushIf(x); if (allEdges) pushIf((h - 1) * w + x); } // felső (+ alsó ha allEdges)
  for (let y = 0; y < h; y++) { pushIf(y * w); pushIf(y * w + w - 1); }             // bal/jobb él
  while (stack.length) { const i = stack.pop(); const x = i % w, y = (i / w) | 0; if (x > 0) pushIf(i - 1); if (x < w - 1) pushIf(i + 1); if (y > 0) pushIf(i - w); if (y < h - 1) pushIf(i + w); }
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    if (bg[i]) { px[o + 3] = 0; px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; continue; }
    const x = i % w, y = (i / w) | 0;
    const nb = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
    if (nb) { const mx = Math.max(px[o], px[o + 1], px[o + 2]); if (mx < soft) px[o + 3] = Math.max(0, Math.min(255, Math.round(255 * (mx - darkTh) / (soft - darkTh)))); }
  }
  return s;
}
/* felső N% levágása (a set-lapok címkéje) */
function cropTop(s, frac) {
  const { w, h, px } = s; const y0 = Math.round(h * frac); const nh = h - y0;
  const out = Buffer.alloc(w * nh * 4); px.copy(out, 0, y0 * w * 4, h * w * 4);
  return { w, h: nh, ch: 4, px: out };
}

/* [forrás, kimenet, logikai_magasság, mód('opaque'|'sky'|'prop'|'fx'), cropTopFrac?] */
function process(src, out, logicalH, mode, ct) {
  let s = toRGBA(readPNG(src));
  if (ct) s = cropTop(s, ct);
  if (mode === 'sky') s = removeDarkBg(s, 26, 46, false);
  else if (mode === 'prop') s = removeDarkBg(s, 17, 33, true); // dark-on-dark: csak a near-fekete hátteret, az objektumot megtartja
  const dh = Math.max(1, Math.round(logicalH * ART));
  const dw = Math.max(1, Math.round(s.w * dh / s.h));
  const px = resize(s.px, s.w, s.h, dw, dh);
  writePNG(out, dw, dh, px);
  return { file: path.basename(out), lw: Math.round(dw / ART), lh: logicalH };
}

const L1 = 'assets/references/maps/levels/level_01_quarantine_street';
const OUT = 'assets/maps/level_01';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'props'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'fx'), { recursive: true });
console.log('level_01 quarantine street:');
/* parallax rétegek */
[
  ['01_layers/quarantine_far_background.png', 'far.png', 118, 'opaque'],
  ['01_layers/quarantine_midground_buildings_strip.png', 'mid.png', 150, 'sky'],
  ['01_layers/quarantine_midground_infrastructure_strip.png', 'near.png', 140, 'sky'],
  ['05_ground/wet_road_long_no_line.png', 'ground.png', 46, 'opaque'],
  ['06_foreground/debris_pile_long_wood_barrel_tires.png', 'fg.png', 34, 'prop'],
].forEach(([s, o, hh, m]) => { const r = process(path.join(L1, s), path.join(OUT, o), hh, m); console.log('  layer', r.file.padEnd(12), r.lw + 'x' + r.lh); });
/* propok (sötét-maszk minden élről) */
const PROPS = [
  ['03_props/bus_rusted.png', 'bus.png', 46],
  ['04_vehicles_street_props/car_wreck_01.png', 'car.png', 30],
  ['04_vehicles_street_props/suv_wreck_01.png', 'suv.png', 32],
  ['03_props/police_car_lightbar.png', 'police.png', 30],
  ['03_props/concrete_barrier_01.png', 'barrier.png', 20],
  ['03_props/dirty_barrel.png', 'barrel.png', 24],
  ['03_props/wooden_x_barricade.png', 'xbarricade.png', 22],
  ['04_vehicles_street_props/trash_pile_small.png', 'trash.png', 16],
];
PROPS.forEach(([s, o, hh]) => { const r = process(path.join(L1, s), path.join(OUT, 'props', o), hh, 'prop'); console.log('  prop ', r.file.padEnd(12), r.lw + 'x' + r.lh); });
/* effektek (additív blendhez, felső címke levágva) */
[
  ['07_effects/atmospheric_particles_set.png', 'rain.png', 120, 0.34],
  ['07_effects/fog_smoke_set.png', 'fog.png', 90, 0.24],
  ['07_effects/streetlamp_light_pools_set.png', 'lightpool.png', 28, 0.34],
].forEach(([s, o, hh, ct]) => { const r = process(path.join(L1, s), path.join(OUT, 'fx', o), hh, 'fx', ct); console.log('  fx   ', r.file.padEnd(12), r.lw + 'x' + r.lh); });
console.log('done -> ' + OUT);
