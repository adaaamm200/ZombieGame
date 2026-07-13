/* ZombieChronicles — MAP LAYER előkészítő (zero-dep: zlib + fs).  [v2 — CLEAN REBUILD]

   A régi flood-fill (removeDarkBg) a sötét-hátterű HD festett rétegeket SZÉTTÉPTE
   (svájcisajt-lyukak, rojtos él, kerék-halo), mert a küszöb-alapú fill a lyukas romokon
   ÁT is befolyt. Ezt egy NEM-destruktív eljárás váltja:

     chromaKey(): fényesség-alapú alfa-RAMP a mintázott háttérszínhez képest (nincs fill,
       nincs lyuk) → tiszta, él-simított perem; MAJD „exterior flood" csak a KÜLSŐ hátteret
       teszi átlátszóvá, a BEZÁRT (objektum-belső) sötét foltokat SZILÁRDRA tölti (solid),
       így nincs kerék-halo és nincs belső lyuk. 1px lágy perem-feather.

   Kompozíció: NEM tileljük a különálló kivágás-stripeket (az kollázs). Helyette a
   midground épületeket a stripből SZEGMENSEKRE bontjuk, és a motorban NÉHÁNY diszkrét
   struktúraként helyezzük el. Kevesebb, nagyobb, tisztább elem.

   Kimenet: assets/maps/level_01/  (bld_a, bld_b, watertower, props/bus, props/car).
   A far.png / ground.png / props/police.png / fx/* MEGMARAD (jók) — ezeket nem érinti. */
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

/* háttérszín mintázása a keretről (a sötét sarkok/élek átlaga) */
function sampleBg(s) { const { w, h, px } = s; let r = 0, g = 0, b = 0, n = 0; const pts = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3], [(w / 2) | 0, 2], [(w / 2) | 0, h - 3], [2, (h / 2) | 0], [w - 3, (h / 2) | 0]]; for (const [x, y] of pts) { const o = (y * w + x) * 4; r += px[o]; g += px[o + 1]; b += px[o + 2]; n++; } return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]; }

/* PER-OSZLOP SZILUETT-KITÖLTÉS. A festett tárgyak (épület/jármű/torony) sötét részei
   ugyanolyan feketék, mint a háttér, ÉS összefüggnek vele → semmilyen küszöb/flood nem
   választja szét tisztán (ez okozta a svájcisajt-lyukakat). Megoldás: a tárgy egy a talajon
   ÁLLÓ tömör tömeg. Oszloponként megkeressük a MAGABIZTOSAN tárgy-pixelek (lum > confLo)
   legfelső és legalsó sorát, és a KÖZTÜK lévő teljes függőleges sávot SZILÁRDRA töltjük
   (255), a sávon kívül (ég fent, semmi lent) átlátszó. Így nincs belső lyuk, a perem az
   igazi sziluettet követi. gapClose: kis függőleges rések áthidalása. */
function silhouette(s, confLo, gapClose) {
  const { w, h, px } = s; gapClose = gapClose || 0;
  const conf = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { const o = i * 4; conf[i] = Math.max(px[o], px[o + 1], px[o + 2]) > confLo ? 1 : 0; }
  const alpha = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    let top = -1, bot = -1;
    for (let y = 0; y < h; y++) { if (conf[y * w + x]) { if (top < 0) top = y; bot = y; } }
    if (top < 0) continue;
    for (let y = top; y <= bot; y++) alpha[y * w + x] = 255;
  }
  /* vízszintes rés-zárás: keskeny átlátszó oszlop-hézagok kitöltése a szomszédokból */
  if (gapClose > 0) {
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        if (alpha[y * w + x]) { x++; continue; }
        let g = x; while (g < w && !alpha[y * w + g]) g++;
        if (x > 0 && g < w && (g - x) <= gapClose) for (let k = x; k < g; k++) alpha[y * w + k] = 255;
        x = g + 1;
      }
    }
  }
  for (let i = 0; i < w * h; i++) { const o = i * 4; px[o + 3] = alpha[i]; if (!alpha[i]) { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; } }
  return s;
}
/* alfa 3×3 átlag-lágyítás (perem-feather, jaggie-mentes él) */
function featherAlpha(s, passes) {
  const { w, h, px } = s; passes = passes || 1;
  for (let p = 0; p < passes; p++) {
    const a = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) a[i] = px[i * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let sum = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; sum += a[yy * w + xx]; n++; }
      px[(y * w + x) * 4 + 3] = Math.round(sum / n);
    }
  }
  return s;
}
/* diszkrét struktúra/prop tisztítása: sziluett + feather + trim */
function cleanObject(s, delta, gapClose) {
  const bg = sampleBg(s); const bgMax = Math.max(bg[0], bg[1], bg[2]);
  silhouette(s, bgMax + (delta == null ? 20 : delta), gapClose);
  featherAlpha(s, 1);
  return trim(s, 24, 2);
}

/* alfa-bounding-box vágás kis paddinggal */
function trim(s, athr, pad) {
  athr = athr || 24; pad = pad || 2; const { w, h, px } = s;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (px[(y * w + x) * 4 + 3] > athr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) return s;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1; const out = Buffer.alloc(nw * nh * 4);
  for (let y = 0; y < nh; y++) px.copy(out, y * nw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + nw) * 4);
  return { w: nw, h: nh, ch: 4, px: out };
}

/* vízszintes szegmensekre bontás: a (jórészt) üres oszlopok mentén elvágva */
function segments(s, minW, minGap) {
  minW = minW || 60; minGap = minGap || 14; const { w, h, px } = s;
  const solidCol = new Uint8Array(w); const need = Math.max(3, Math.round(h * 0.05));
  for (let x = 0; x < w; x++) { let c = 0; for (let y = 0; y < h; y++) if (px[(y * w + x) * 4 + 3] > 60) c++; solidCol[x] = c >= need ? 1 : 0; }
  const segs = []; let x = 0;
  while (x < w) {
    while (x < w && !solidCol[x]) x++;
    if (x >= w) break; let s0 = x;
    let gap = 0, last = x;
    while (x < w) { if (solidCol[x]) { last = x; gap = 0; } else { gap++; if (gap > minGap) break; } x++; }
    if (last - s0 + 1 >= minW) segs.push([s0, last]);
  }
  return segs;
}
function cropCols(s, x0, x1) { const { w, h, px } = s; const nw = x1 - x0 + 1; const out = Buffer.alloc(nw * h * 4); for (let y = 0; y < h; y++) px.copy(out, y * nw * 4, (y * w + x0) * 4, (y * w + x1 + 1) * 4); return { w: nw, h, ch: 4, px: out }; }
/* frakcionális 2D téglalap-kivágás (a paletta-lapokból egy elem izolálása) */
function cropRect(s, fx0, fy0, fx1, fy1) {
  const { w, h, px } = s;
  const x0 = Math.max(0, Math.round(fx0 * w)), x1 = Math.min(w - 1, Math.round(fx1 * w));
  const y0 = Math.max(0, Math.round(fy0 * h)), y1 = Math.min(h - 1, Math.round(fy1 * h));
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1; const out = Buffer.alloc(nw * nh * 4);
  for (let y = 0; y < nh; y++) px.copy(out, y * nw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + nw) * 4);
  return { w: nw, h: nh, ch: 4, px: out };
}

function scaleH(s, logicalH) { const dh = Math.max(1, Math.round(logicalH * ART)); const dw = Math.max(1, Math.round(s.w * dh / s.h)); return { w: dw, h: dh, px: resize(s.px, s.w, s.h, dw, dh) }; }
function emit(out, s, logicalH) { const r = scaleH(s, logicalH); writePNG(out, r.w, r.h, r.px); return { file: path.basename(out), lw: Math.round(r.w / ART), lh: logicalH }; }

/* teljes-bleed ATLÁTSZATLAN réteg (far/ground): csak leméretezés (nincs kulcsolás) */
function emitOpaque(src, out, logicalH) { const s = emit(out, toRGBA(readPNG(src)), logicalH); return s; }

/* =================== LEVEL 01 — Quarantine Street =================== */
function doLevel01(OUT) {
  const L1 = 'assets/references/maps/levels/level_01_quarantine_street';
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'props'), { recursive: true });
  console.log('level_01 quarantine street — CLEAN rebuild →', OUT);
  const strip = toRGBA(readPNG(path.join(L1, '01_layers/quarantine_midground_buildings_strip.png')));
  [['bld_a.png', 16, 258], ['bld_b.png', 606, 1001]].forEach(([out, x0, x1]) => { const seg = cleanObject(cropCols(strip, x0, x1), 20, 6); const r = emit(path.join(OUT, out), seg, 156); console.log('  bld  ', out.padEnd(10), r.lw + 'x' + r.lh); });
  { const s = cleanObject(toRGBA(readPNG(path.join(L1, '03_props/watchtower_large.png'))), 26, 0); const r = emit(path.join(OUT, 'watertower.png'), s, 150); console.log('  watertower', r.lw + 'x' + r.lh); }
  [['03_props/bus_rusted.png', 'props/bus.png', 44], ['04_vehicles_street_props/car_wreck_01.png', 'props/car.png', 28], ['03_props/police_car_lightbar.png', 'props/police.png', 28]]
    .forEach(([src, out, hh]) => { const s = cleanObject(toRGBA(readPNG(path.join(L1, src))), 18, 10); const r = emit(path.join(OUT, out), s, hh); console.log('  prop ', r.file.padEnd(12), r.lw + 'x' + r.lh); });
  console.log('done -> ' + OUT);
}

/* =================== LEVEL 02 — Quick Mart =================== */
function doLevel02(OUT) {
  const L2 = 'assets/references/maps/levels/level_02_quick_mart';
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'props'), { recursive: true });
  console.log('level_02 quick mart — CLEAN build →', OUT);
  /* teljes-bleed: far skyline + nedves aszfalt talaj (átlátszatlan, leméretezve) */
  { const r = emitOpaque(path.join(L2, '01_layers/quickmart_far_background.png'), path.join(OUT, 'far.png'), 118); console.log('  far  ', r.lw + 'x' + r.lh); }
  { const r = emitOpaque(path.join(L2, '04_ground/wet_asphalt_long_no_line.png'), path.join(OUT, 'ground.png'), 46); console.log('  ground', r.lw + 'x' + r.lh); }
  /* diszkrét midground struktúrák (sziluett-tiszta): Quick Mart bolt-homlokzat + oszlop */
  { const s = cleanObject(toRGBA(readPNG(path.join(L2, '02_main_building/quickmart_store_facade_full.png'))), 22, 8); const r = emit(path.join(OUT, 'facade.png'), s, 140); console.log('  facade', r.lw + 'x' + r.lh); }
  { const s = cleanObject(toRGBA(readPNG(path.join(L2, '03_props_vehicles/power_pole.png'))), 24, 0); const r = emit(path.join(OUT, 'power_pole.png'), s, 132); console.log('  pole  ', r.lw + 'x' + r.lh); }
  /* ritka propok (tömör sziluett): furgon + benzinkút + konténer + ártábla */
  [['03_props_vehicles/van_wreck.png', 'props/van.png', 30],
   ['03_props_vehicles/gas_pump_red.png', 'props/gas_pump.png', 34],
   ['03_props_vehicles/dumpster_green.png', 'props/dumpster.png', 26],
   ['03_props_vehicles/gas_price_sign.png', 'props/gas_sign.png', 40]]
    .forEach(([src, out, hh]) => { const s = cleanObject(toRGBA(readPNG(path.join(L2, src))), 18, 10); const r = emit(path.join(OUT, out), s, hh); console.log('  prop ', r.file.padEnd(14), r.lw + 'x' + r.lh); });
  console.log('done -> ' + OUT);
}

/* =================== LEVEL 03 — Zombie Alley =================== */
function doLevel03(OUT) {
  const L3 = 'assets/references/maps/levels/level_03_zombie_alley';
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'props'), { recursive: true });
  console.log('level_03 zombie alley — CLEAN build →', OUT);
  /* teljes-bleed: far romváros-skyline + nedves aszfalt talaj */
  { const r = emitOpaque(path.join(L3, '01_layers/alley_far_background.png'), path.join(OUT, 'far.png'), 118); console.log('  far  ', r.lw + 'x' + r.lh); }
  { const r = emitOpaque(path.join(L3, '03_ground/alley_wet_asphalt_long_no_line.png'), path.join(OUT, 'ground.png'), 46); console.log('  ground', r.lw + 'x' + r.lh); }
  /* diszkrét struktúrák/propok a paletta-lapokból (2D crop → sziluett-tiszta) */
  const near = toRGBA(readPNG(path.join(L3, '01_layers/alley_nearground_storefronts_signs_fences_strip.png')));
  const mid = toRGBA(readPNG(path.join(L3, '01_layers/alley_midground_walls_cables_fences_strip.png')));
  /* midground struktúrák: BAR saroképület (near, bal) + fal/épület (mid, bal) */
  { const s = cleanObject(cropRect(near, 0.0, 0.02, 0.115, 0.80), 20, 8); const r = emit(path.join(OUT, 'bar_building.png'), s, 150); console.log('  bld bar_building', r.lw + 'x' + r.lh); }
  { const s = cleanObject(cropRect(mid, 0.0, 0.02, 0.135, 0.98), 22, 8); const r = emit(path.join(OUT, 'wall_a.png'), s, 148); console.log('  bld wall_a', r.lw + 'x' + r.lh); }
  /* propok: roncsautó + drótkerítés (cars-set) + zöld-fényű ajtó + konténer (near) */
  const cars = toRGBA(readPNG(path.join(L3, '06_vehicles/alley_car_wrecks_set.png')));
  { const s = cleanObject(cropRect(cars, 0.03, 0.58, 0.41, 1.0), 18, 10); const r = emit(path.join(OUT, 'props/car.png'), s, 28); console.log('  prop car', r.lw + 'x' + r.lh); }
  { const s = cleanObject(cropRect(cars, 0.005, 0.04, 0.30, 0.57), 20, 6); const r = emit(path.join(OUT, 'props/fence.png'), s, 30); console.log('  prop fence', r.lw + 'x' + r.lh); }
  { const s = cleanObject(cropRect(near, 0.82, 0.13, 0.955, 0.60), 20, 6); const r = emit(path.join(OUT, 'props/door.png'), s, 42); console.log('  prop door', r.lw + 'x' + r.lh); }
  console.log('done -> ' + OUT);
}

/* CLI: node prepare-map-layers.js [1|2|3|all]  (alap: 1 — más szintet NEM ír felül) */
const which = process.argv[2] || '1';
if (which === '1' || which === 'all') doLevel01(process.env.MAP_OUT || 'assets/maps/level_01');
if (which === '2' || which === 'all') doLevel02(process.env.MAP_OUT2 || 'assets/maps/level_02/_wip');
if (which === '3' || which === 'all') doLevel03(process.env.MAP_OUT3 || 'assets/maps/level_03/_wip');
