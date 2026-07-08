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

/* bilineáris átméretezés (RGB/RGBA) */
function resize(px, sw, sh, bpp, dw, dh) {
  const out = Buffer.alloc(dw * dh * bpp);
  for (let y = 0; y < dh; y++) {
    let sy = (y + 0.5) * sh / dh - 0.5; let y0 = Math.floor(sy); let fy = sy - y0;
    if (y0 < 0) { y0 = 0; fy = 0; } if (y0 > sh - 2) { y0 = Math.max(0, sh - 2); fy = sh === 1 ? 0 : 1; }
    for (let x = 0; x < dw; x++) {
      let sx = (x + 0.5) * sw / dw - 0.5; let x0 = Math.floor(sx); let fx = sx - x0;
      if (x0 < 0) { x0 = 0; fx = 0; } if (x0 > sw - 2) { x0 = Math.max(0, sw - 2); fx = sw === 1 ? 0 : 1; }
      for (let c = 0; c < bpp; c++) {
        const i00 = (y0 * sw + x0) * bpp + c, i10 = (y0 * sw + x0 + 1) * bpp + c;
        const i01 = ((y0 + 1) * sw + x0) * bpp + c, i11 = ((y0 + 1) * sw + x0 + 1) * bpp + c;
        const top = px[i00] + (px[i10] - px[i00]) * fx;
        const bot = px[i01] + (px[i11] - px[i01]) * fx;
        out[(y * dw + x) * bpp + c] = Math.round(top + (bot - top) * fy);
      }
    }
  }
  return out;
}

/* SAFE PADDED ICON BOX: a kivágott ikont ARÁNYTARTÓN a TARGET-re méretezi, majd
   egy CANVAS×CANVAS ÁTLÁTSZÓ (RGBA) vászonra KÖZÉPRE komponálja → egységes méret,
   ≥ (CANVAS-TARGET)/2 padding, semmi nem vágódik le, semmi nem csúszik félre. */
function padIcon(cropBuf, cw, ch, srcBpp, CANVAS, TARGET) {
  const scale = TARGET / Math.max(cw, ch);
  const dw = Math.max(1, Math.round(cw * scale)), dh = Math.max(1, Math.round(ch * scale));
  const scaled = resize(cropBuf, cw, ch, srcBpp, dw, dh);
  const out = Buffer.alloc(CANVAS * CANVAS * 4, 0); // RGBA, teljesen átlátszó
  const ox = Math.floor((CANVAS - dw) / 2), oy = Math.floor((CANVAS - dh) / 2);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const s = (y * dw + x) * srcBpp, d = ((oy + y) * CANVAS + (ox + x)) * 4;
    out[d] = scaled[s]; out[d + 1] = scaled[s + 1]; out[d + 2] = scaled[s + 2]; out[d + 3] = 255;
  }
  return out;
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

/* SAFE PADDED ICON BOXES — a döntés: nem szűk auto-crop, hanem NAGYVONALÚ forrás-doboz
   (center + srcBox) az ikon köré (semmi nem vágódik le, a bőséges margó elnyeli a
   középpont-becslés kis hibáit), majd 256×256 ÁTLÁTSZÓ vászonra középre komponálva,
   ~204px belső tartalommal → EGYSÉGES méret, ≥26px padding, object-fit: contain.
   A menü-dobozok bővebbek (sötét gombon a margó nem látszik); a board-hexeknél
   szűkebb (a városi háttéren a sötét margó minimális). */
const CANVAS = 256, TARGET = 200;   // az ikon a 256 vászon ~70%-át tölti ki → BŐSÉGES átlátszó
                                    // padding, így a RENDERELT UI-ban sosem ér a badge/hexagon széléhez
const MSB = [180, 136];   // menü octagon forrás-doboz (octagon ~160×120 + margó, pontos rács-középpont)
const SSB = [120, 112];   // state hexagon forrás-doboz (hex ~114×106 + szűk margó, városi háttérhez)
const PAD = [
  // MAIN MENU octagon (1. sor) — center = octagon-középpont, srcBox nagyvonalú
  { src: 'ingame_icons.png', out: 'm-continue.png', center: [157, 201], srcBox: MSB },
  { src: 'ingame_icons.png', out: 'm-campaign.png', center: [357, 201], srcBox: MSB },
  { src: 'ingame_icons.png', out: 'm-scavenge.png', center: [562, 201], srcBox: MSB },
  { src: 'ingame_icons.png', out: 'm-armory.png',   center: [758, 201], srcBox: MSB },
  { src: 'ingame_icons.png', out: 'm-lab.png',      center: [957, 201], srcBox: MSB },
  { src: 'ingame_icons.png', out: 'm-shop.png',     center: [1181, 201], srcBox: MSB },
  { src: 'ingame_icons.png', out: 'm-settings.png', center: [1360, 201], srcBox: MSB },
  { src: 'ingame_icons.png', out: 'm-back.png',     center: [1541, 205], srcBox: MSB },
  // BOARD MARKER / MISSION STATE hexagon (2. sor)
  { src: 'ingame_icons.png', out: 's-done.png',     center: [141, 429], srcBox: SSB },
  { src: 'ingame_icons.png', out: 's-current.png',  center: [327, 429], srcBox: SSB },
  { src: 'ingame_icons.png', out: 's-locked.png',   center: [509, 429], srcBox: SSB },
  { src: 'ingame_icons.png', out: 's-boss.png',     center: [688, 429], srcBox: SSB },
  { src: 'ingame_icons.png', out: 's-loot.png',     center: [853, 429], srcBox: SSB },
  { src: 'ingame_icons.png', out: 's-danger.png',   center: [1021, 429], srcBox: SSB },
];

const cache = {};
function load(src) { if (!cache[src]) { cache[src] = readPNG(path.join(REF, src)); console.log('read', src, cache[src].w + 'x' + cache[src].h, 'colorType', cache[src].colorType); } return cache[src]; }

for (const j of MANUAL) {
  const s = load(j.src);
  const c = crop(s, j.x, j.y, j.w, j.h);
  writePNG(path.join(OUT, j.out), c.cw, c.ch, s.bpp, s.colorType, c.buf);
  console.log('  M', j.out, c.cw + 'x' + c.ch);
}
for (const j of PAD) {
  const s = load(j.src);
  const [bw, bh] = j.srcBox;
  const x = Math.round(j.center[0] - bw / 2), y = Math.round(j.center[1] - bh / 2);
  const c = crop(s, x, y, bw, bh);
  const rgba = padIcon(c.buf, c.cw, c.ch, s.bpp, CANVAS, TARGET);
  writePNG(path.join(OUT, j.out), CANVAS, CANVAS, 4, 6, rgba); // RGBA (átlátszó padding)
  console.log('  P', j.out, CANVAS + 'x' + CANVAS + ' (src ' + c.cw + 'x' + c.ch + ')');
}
console.log('done');
