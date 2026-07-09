/* ZombieChronicles — ELLENSÉG-SPRITE előkészítő (zero-dep: beépített zlib+fs).
   A forrás multi-póz lapokból (assets/references/zombies/*.png, RGB, VILÁGOS/checker
   háttér) production ellenség-assetet készít:
     1) VILÁGOS háttér eltávolítása ÉL-FLOOD-FILL-lel (a SÖTÉT sziluetteket/ruhát/
        árnyékot MEGTARTJA — NEM fekete-küszöb!), lágy szél-feather.
     2) fél-felbontásra méretezés (a játék kis felbontású → elég).
     3) automatikus FRAME-detektálás sor/oszlop-projekcióval (rács nem feltételezett):
        tartalmi sávok → figurák (bbox, trim), olvasási sorrend (fent→le, bal→jobb).
     4) kimenet: tiszta sheet PNG (assets/enemies/) + atlasz JSON (frame-rectek + anchor)
        + debug-overlay PNG (piros keretek) az illesztés ellenőrzéséhez.
   Az EREDETIK érintetlenek. */
const fs = require('fs'), zlib = require('zlib'), path = require('path');

/* ---------- PNG I/O ---------- */
function readPNG(file) {
  const buf = fs.readFileSync(file); let off = 8, ihdr = null; const idat = [];
  while (off < buf.length) { const len = buf.readUInt32BE(off); const t = buf.toString('ascii', off + 4, off + 8); const d = buf.slice(off + 8, off + 8 + len); if (t === 'IHDR') ihdr = { w: d.readUInt32BE(0), h: d.readUInt32BE(4), bd: d[8], ct: d[9], il: d[12] }; else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break; off += 12 + len; }
  if (ihdr.bd !== 8 || ihdr.il) throw new Error('unsupported ' + file);
  const ch = ihdr.ct === 6 ? 4 : ihdr.ct === 2 ? 3 : ihdr.ct === 0 ? 1 : ihdr.ct === 4 ? 2 : 0;
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

/* ÉL-FLOOD-FILL: a széli VILÁGOS hátteret átlátszóvá teszi; a sötét sziluettet MEGTARTJA */
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
  /* DEFRINGE: a háttér+feather (alpha<255) RGB-jét SÖTÉTRE állítjuk, hogy a skálázás/
     imageSmoothing NE szivárogtasson fehér halót az élekre (fehér foltok mozgás közben). */
  for (let i = 0; i < N; i++) { const o = i * 4; if (px[o + 3] < 255) { px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; } }
  return s;
}

/* EXPLICIT RÁCS + cellánkénti tartalom-trim (determinisztikus, megbízható).
   cols×rows egyenletes cellák, row-major olvasási sorrend; minden cellát a benne lévő
   alpha-tartalom pontos bbox-ára vágunk (a lény ~középen ül, a trim tömör frame-et ad). */
function gridSlice(s, cols, rows) {
  const { w, h, px } = s; const AT = 18;
  const cw = w / cols, chh = h / rows;
  const frames = [];
  for (let ry = 0; ry < rows; ry++) for (let cx = 0; cx < cols; cx++) {
    const cx0 = Math.round(cx * cw), cy0 = Math.round(ry * chh);
    const cx1 = Math.round((cx + 1) * cw) - 1, cy1 = Math.round((ry + 1) * chh) - 1;
    let bx0 = cx1, by0 = cy1, bx1 = cx0, by1 = cy0, any = false;
    for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) if (px[(y * w + x) * 4 + 3] > AT) { any = true; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    if (!any) { frames.push(null); continue; }
    frames.push({ x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1 });
  }
  return frames;
}

/* piros keret rajzolása a debug-overlayre */
function strokeRect(px, w, h, r, col) {
  const set = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const o = (y * w + x) * 4; px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255; };
  for (let t = 0; t < 2; t++) { for (let x = r.x; x < r.x + r.w; x++) { set(x, r.y + t); set(x, r.y + r.h - 1 - t); } for (let y = r.y; y < r.y + r.h; y++) { set(r.x + t, y); set(r.x + r.w - 1 - t, y); } }
}

/* ---------- jobok ---------- */
const SRC = 'assets/references/zombies', OUT = 'assets/enemies';
const HARD = 228, SOFT = 195, SCALE = 0.5;   // háttér-küszöb + fél-felbontás
// forrás-fájl → [belső név, cols, rows, várt frame-nevek row-major olvasási sorrendben]
const JOBS = [
  ['ChatGPT Image 2026. júl. 9. 13_34_33 (1).png', 'walker',  3, 2, ['idle', 'walk_01', 'walk_02', 'attack', 'hit', 'defeated']],
  ['ChatGPT Image 2026. júl. 9. 13_34_33 (2).png', 'runner',  3, 2, ['idle', 'run_01', 'run_02', 'attack', 'hit', 'defeated']],
  ['ChatGPT Image 2026. júl. 9. 13_34_33 (3).png', 'bloater', 3, 2, ['idle', 'walk_01', 'walk_02', 'attack', 'warning', 'defeated']],
  ['ChatGPT Image 2026. júl. 9. 13_34_34 (4).png', 'spitter', 3, 2, ['idle', 'walk_01', 'attack_spit', 'projectile', 'hit', 'defeated']],
  ['ChatGPT Image 2026. júl. 9. 13_34_34 (5).png', 'brute',   3, 2, ['idle', 'walk_01', 'guard', 'eruption', 'hit', 'defeated']],
  ['ChatGPT Image 2026. júl. 9. 13_34_34 (6).png', 'crawler', 2, 3, ['crawl_01', 'crawl_02', 'crawl_03', 'lunge', 'attack', 'defeated']],
  ['ChatGPT Image 2026. júl. 9. 13_34_35 (7).png', 'boss',    3, 3, ['idle', 'walk_01', 'attack_slam', 'attack_projectile', 'summon', 'rage', 'hit', 'defeated', 'icon']],
];

fs.mkdirSync(OUT, { recursive: true });
const atlas = {};
for (const [src, name, cols, rows, names] of JOBS) {
  let s = removeLightBg(toRGBA(readPNG(path.join(SRC, src))), HARD, SOFT);
  const dw = Math.round(s.w * SCALE), dh = Math.round(s.h * SCALE);
  s = { w: dw, h: dh, ch: 4, px: resize(s.px, s.w, s.h, dw, dh) };
  const frames = gridSlice(s, cols, rows);
  // kimenet: tiszta sheet
  writePNG(path.join(OUT, `enemy_${name}_sheet.png`), s.w, s.h, s.px);
  // debug overlay (a tiszta sheet + piros keretek)
  const dbg = Buffer.from(s.px);
  frames.forEach((f) => { if (f) strokeRect(dbg, s.w, s.h, f, [255, 40, 40]); });
  writePNG(path.join(OUT, `_debug_${name}.png`), s.w, s.h, dbg);
  // atlasz: frame-név → rect + anchor (talp = bbox alsó-közepe)
  const fm = {};
  let ok = 0;
  frames.forEach((f, i) => {
    const key = names[i] || ('frame_' + i);
    if (!f) return;
    ok++;
    fm[key] = { x: f.x, y: f.y, w: f.w, h: f.h, ax: 0.5, ay: 1.0 };
  });
  atlas[name] = { image: `enemy_${name}_sheet.png`, sheetW: s.w, sheetH: s.h, frames: fm };
  console.log(`${name.padEnd(9)} ${ok}/${names.length} frames`, ok !== names.length ? '  <-- ELTÉRÉS' : 'OK',
    frames.map((f) => f ? `${f.w}x${f.h}` : 'EMPTY').join(' '));
}
fs.writeFileSync(path.join(OUT, 'enemy_atlas.json'), JSON.stringify(atlas, null, 1));
console.log('atlas ->', path.join(OUT, 'enemy_atlas.json'));
