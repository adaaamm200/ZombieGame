/* ZombieChronicles — zero-dependency PNG kivágó (csak beépített zlib + fs).
   Az AI-generált asset-lapokból (logó, ikon-sheet) vág ki egyedi PNG-ket a UI-hoz.
   Használat: node tools/crop.js  — a lenti CROPS listát dolgozza fel.
   Támogatott forrás: 8-bit, non-interlaced, colorType 2 (RGB) / 6 (RGBA). */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/* ---- CRC32 (PNG chunk checksum) ---- */
const CRCT = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRCT[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/* ---- PNG olvasás + unfilter ---- */
function readPNG(file) {
  const buf = fs.readFileSync(file);
  let off = 8, ihdr = null; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9], interlace: data[12] };
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (ihdr.bitDepth !== 8) throw new Error('bitDepth ' + ihdr.bitDepth + ' nem támogatott');
  if (ihdr.interlace) throw new Error('interlaced nem támogatott');
  const channels = ihdr.colorType === 6 ? 4 : ihdr.colorType === 2 ? 3 : ihdr.colorType === 0 ? 1 : ihdr.colorType === 4 ? 2 : null;
  if (!channels) throw new Error('colorType ' + ihdr.colorType + ' nem támogatott');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { w, h } = ihdr, bpp = channels, stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[p++];
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = (x >= bpp && y > 0) ? px[(y - 1) * stride + x - bpp] : 0;
      let v;
      switch (ft) {
        case 0: v = rb; break;
        case 1: v = rb + a; break;
        case 2: v = rb + b; break;
        case 3: v = rb + ((a + b) >> 1); break;
        case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = rb + ((pa <= pb && pa <= pc) ? a : (pb <= pc) ? b : c); break; }
        default: throw new Error('ismeretlen filter ' + ft);
      }
      px[y * stride + x] = v & 0xff;
    }
  }
  return { w, h, bpp, colorType: ihdr.colorType, px };
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function writePNG(file, w, h, bpp, colorType, px) {
  const stride = w * bpp;
  const filtered = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { filtered[y * (stride + 1)] = 0; px.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const idat = zlib.deflateSync(filtered, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = colorType; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const out = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(file, out);
}

function crop(src, x, y, cw, ch) {
  const { w, bpp } = src;
  x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(src.h - 1, y));
  cw = Math.min(cw, w - x); ch = Math.min(ch, src.h - y);
  const out = Buffer.alloc(cw * ch * bpp);
  for (let j = 0; j < ch; j++) src.px.copy(out, j * cw * bpp, ((y + j) * w + x) * bpp, ((y + j) * w + x + cw) * bpp);
  return { buf: out, cw, ch };
}

/* A megadott régión belül megkeresi a TARTALOM bounding-boxát (a sötét sheet-háttér
   fölött világos/telített ikon-pixelek). Sor/oszlop-projekcióval, hogy a texturális
   zaj (magányos fényes pixelek) ne rontsa el. */
function contentBBox(src, rx, ry, rw, rh, th, minCount) {
  const { w, bpp } = src;
  rx = Math.max(0, rx); ry = Math.max(0, ry); rw = Math.min(rw, src.w - rx); rh = Math.min(rh, src.h - ry);
  const col = new Int32Array(rw), row = new Int32Array(rh);
  for (let j = 0; j < rh; j++) {
    for (let i = 0; i < rw; i++) {
      const o = ((ry + j) * w + (rx + i)) * bpp;
      const r = src.px[o], g = src.px[o + 1], b = src.px[o + 2];
      const bright = Math.max(r, g, b);
      /* CSAK fényesség: a metál keret + belső artwork fényes, a színes külső GLOW
         viszont sötétebb → így a bbox a szolid ikonra szűkül (nem a glow-ra). */
      if (bright > th) { col[i]++; row[j]++; }
    }
  }
  let x0 = 0; while (x0 < rw && col[x0] < minCount) x0++;
  let x1 = rw - 1; while (x1 > x0 && col[x1] < minCount) x1--;
  let y0 = 0; while (y0 < rh && row[y0] < minCount) y0++;
  let y1 = rh - 1; while (y1 > y0 && row[y1] < minCount) y1--;
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: rx + x0, y: ry + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/* A fénylő pixelek SÚLYPONTJA (centroid) a régión belül — szimmetrikus ikonoknál
   stabil középpont, a keret fényességétől/színétől függetlenül (a ring-alak és a
   feliratkizárt Y-sáv miatt nem torzul). */
function centroid(src, rx, ry, rw, rh, th) {
  const { w, bpp } = src;
  rx = Math.max(0, rx); ry = Math.max(0, ry); rw = Math.min(rw, src.w - rx); rh = Math.min(rh, src.h - ry);
  let sx = 0, sy = 0, n = 0;
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    const o = ((ry + j) * w + (rx + i)) * bpp;
    if (Math.max(src.px[o], src.px[o + 1], src.px[o + 2]) > th) { sx += rx + i; sy += ry + j; n++; }
  }
  if (!n) return null;
  return { cx: sx / n, cy: sy / n, n };
}

/* Auto-crop: centroid + FIX (egységes) doboz → minden ikon azonos méretű, optikailag
   középre igazított kivágás (konzisztens padding/optikai súly). */
function autoCrop(src, region) {
  const [bw, bh] = region.box;
  let cx, cy, n = 0;
  if (region.center) {           // kézi középpont-felülírás (halvány/aszimmetrikus ikonokhoz)
    cx = region.center[0]; cy = region.center[1];
  } else {
    const c = centroid(src, region.x, region.y, region.w, region.h, region.th || 108);
    cx = c ? c.cx : region.x + region.w / 2;
    cy = c ? c.cy : region.y + region.h / 2;
    n = c ? c.n : 0;
  }
  const x = Math.round(cx - bw / 2), y = Math.round(cy - bh / 2);
  const r = crop(src, x, y, bw, bh);
  return { buf: r.buf, cw: r.cw, ch: r.ch, cx: Math.round(cx), cy: Math.round(cy), n };
}

/* ---- feldolgozandó kivágások ---- */
const REF = 'assets/references';
const OUT = 'assets/ui';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/* MANUÁLIS crop (kompozíciók + a sötét-keretes kör-vezérlők, ahol a tartalom-
   detektálás megbízhatatlan; ezek fix, kalibrált dobozok). */
const MANUAL = [
  { src: 'app_logos.png', out: 'logo.png', x: 58, y: 176, w: 352, h: 368 },
  { src: 'app_logos.png', out: 'appicon.png', x: 84, y: 618, w: 214, h: 214 },
  // kör alakú vezérlő-gombok (3. sor) — kalibrált fix dobozok
  { src: 'ingame_icons.png', out: 'ic-fire.png',    x: 48,  y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-ammo.png',    x: 182, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-swap.png',    x: 313, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-grenade.png', x: 438, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-dash.png',    x: 563, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-pause.png',   x: 703, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-medkit.png',  x: 823, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-coin.png',    x: 934, y: 598, w: 104, h: 104 },
];

/* AUTO crop — a fényes menü-octagonok (1. sor) és színes state-hexagonok (2. sor).
   A régió Y-sávja PONTOSAN az ikon-sávra van állítva (sor-sűrűség profilból),
   így a fejléc/felirat NEM lóg bele; az auto-crop középre igazít + EGYSÉGES padding.
   Row1 octagon: y 147..270 ; Row2 hexagon: y 387..493 (a feliratok kívül). */
/* box = FIX kimeneti dobozméret [w,h] — minden ikon azonos, a centroidra igazítva.
   Menü-octagon ~160×120 → box 170×130 (~5% egységes padding).
   State-hexagon ~114×106 → box 128×118. A Y-sáv a feliratokat kizárja. */
const MENU_BOX = [172, 132], STATE_BOX = [130, 120];
const AUTO = [
  // MAIN MENU octagon (1. sor) — régió a teljes ikont tartalmazza, szomszéd nélkül
  { src: 'ingame_icons.png', out: 'm-continue.png', x: 65,   y: 148, w: 176, h: 120, box: MENU_BOX, center: [157, 201] },
  { src: 'ingame_icons.png', out: 'm-campaign.png', x: 270,  y: 148, w: 176, h: 120, box: MENU_BOX },
  { src: 'ingame_icons.png', out: 'm-scavenge.png', x: 475,  y: 148, w: 176, h: 120, box: MENU_BOX },
  { src: 'ingame_icons.png', out: 'm-armory.png',   x: 677,  y: 148, w: 176, h: 120, box: MENU_BOX },
  { src: 'ingame_icons.png', out: 'm-lab.png',      x: 882,  y: 148, w: 176, h: 120, box: MENU_BOX },
  { src: 'ingame_icons.png', out: 'm-shop.png',     x: 1105, y: 148, w: 168, h: 120, box: MENU_BOX },
  { src: 'ingame_icons.png', out: 'm-settings.png', x: 1277, y: 148, w: 168, h: 120, box: MENU_BOX },
  { src: 'ingame_icons.png', out: 'm-back.png',     x: 1453, y: 148, w: 168, h: 120, box: MENU_BOX, center: [1541, 206] },
  // BOARD MARKER / MISSION STATE hexagon (2. sor)
  { src: 'ingame_icons.png', out: 's-done.png',     x: 79,   y: 392, w: 150, h: 96, box: STATE_BOX },
  { src: 'ingame_icons.png', out: 's-current.png',  x: 249,  y: 392, w: 150, h: 96, box: STATE_BOX },
  { src: 'ingame_icons.png', out: 's-locked.png',   x: 445,  y: 392, w: 150, h: 96, box: STATE_BOX },
  { src: 'ingame_icons.png', out: 's-boss.png',     x: 615,  y: 392, w: 150, h: 96, box: STATE_BOX },
  { src: 'ingame_icons.png', out: 's-loot.png',     x: 789,  y: 392, w: 150, h: 96, box: STATE_BOX },
  { src: 'ingame_icons.png', out: 's-danger.png',   x: 959,  y: 392, w: 150, h: 96, box: STATE_BOX },
];

const cache = {};
function load(src) { if (!cache[src]) { cache[src] = readPNG(path.join(REF, src)); console.log('read', src, cache[src].w + 'x' + cache[src].h, 'colorType', cache[src].colorType); } return cache[src]; }

for (const j of MANUAL) {
  const s = load(j.src);
  const c = crop(s, j.x, j.y, j.w, j.h);
  writePNG(path.join(OUT, j.out), c.cw, c.ch, s.bpp, s.colorType, c.buf);
  console.log('  M', j.out, c.cw + 'x' + c.ch);
}
for (const j of AUTO) {
  const s = load(j.src);
  const c = autoCrop(s, j);
  writePNG(path.join(OUT, j.out), c.cw, c.ch, s.bpp, s.colorType, c.buf);
  console.log('  A', j.out, c.cw + 'x' + c.ch, 'center=(' + c.cx + ',' + c.cy + ') n=' + c.n);
}
console.log('done');
