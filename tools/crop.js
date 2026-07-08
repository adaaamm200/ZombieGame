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

/* ---- feldolgozandó kivágások ---- */
const REF = 'assets/references';
const OUT = 'assets/ui';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const JOBS = [
  // forrás, kimenet, x, y, w, h
  // app_logos.png (1672x941) — Logo A (piros koponya + ZOMBIE CHRONICLES + tagline)
  { src: 'app_logos.png', out: 'logo.png', x: 58, y: 176, w: 352, h: 368 },
  // App Icon A (piros koponya, lekerekített négyzet, bal-lent)
  { src: 'app_logos.png', out: 'appicon.png', x: 84, y: 618, w: 214, h: 214 },
  // ingame_icons.png (1672x941) — kör alakú vezérlő-gombok (3. sor)
  { src: 'ingame_icons.png', out: 'ic-fire.png',    x: 48,  y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-ammo.png',    x: 182, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-swap.png',    x: 313, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-grenade.png', x: 438, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-dash.png',    x: 563, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-pause.png',   x: 703, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-medkit.png',  x: 823, y: 598, w: 104, h: 104 },
  { src: 'ingame_icons.png', out: 'ic-coin.png',    x: 934, y: 598, w: 104, h: 104 },
  // --- MAIN MENU IKONOK (1. sor, octagon) ---
  { src: 'ingame_icons.png', out: 'm-continue.png', x: 78,   y: 143, w: 150, h: 150 },
  { src: 'ingame_icons.png', out: 'm-campaign.png', x: 283,  y: 143, w: 150, h: 150 },
  { src: 'ingame_icons.png', out: 'm-scavenge.png', x: 488,  y: 143, w: 150, h: 150 },
  { src: 'ingame_icons.png', out: 'm-armory.png',   x: 690,  y: 143, w: 150, h: 150 },
  { src: 'ingame_icons.png', out: 'm-lab.png',      x: 895,  y: 143, w: 150, h: 150 },
  { src: 'ingame_icons.png', out: 'm-shop.png',     x: 1118, y: 143, w: 150, h: 150 },
  { src: 'ingame_icons.png', out: 'm-settings.png', x: 1290, y: 143, w: 150, h: 150 },
  { src: 'ingame_icons.png', out: 'm-back.png',     x: 1466, y: 143, w: 150, h: 150 },
  // --- BOARD MARKER / MISSION STATE (2. sor, hexagon) ---
  { src: 'ingame_icons.png', out: 's-done.png',     x: 92,   y: 388, w: 124, h: 108 },
  { src: 'ingame_icons.png', out: 's-current.png',  x: 262,  y: 388, w: 124, h: 108 },
  { src: 'ingame_icons.png', out: 's-locked.png',   x: 458,  y: 388, w: 124, h: 108 },
  { src: 'ingame_icons.png', out: 's-boss.png',     x: 628,  y: 388, w: 124, h: 108 },
  { src: 'ingame_icons.png', out: 's-loot.png',     x: 802,  y: 388, w: 124, h: 108 },
  { src: 'ingame_icons.png', out: 's-danger.png',   x: 972,  y: 388, w: 124, h: 108 },
];

const cache = {};
for (const j of JOBS) {
  if (!cache[j.src]) { cache[j.src] = readPNG(path.join(REF, j.src)); console.log('read', j.src, cache[j.src].w + 'x' + cache[j.src].h, 'colorType', cache[j.src].colorType); }
  const s = cache[j.src];
  const c = crop(s, j.x, j.y, j.w, j.h);
  writePNG(path.join(OUT, j.out), c.cw, c.ch, s.bpp, s.colorType, c.buf);
  console.log('  ->', j.out, c.cw + 'x' + c.ch);
}
console.log('done');
