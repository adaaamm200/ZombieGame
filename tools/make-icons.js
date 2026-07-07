/* PNG app-ikonok generálása külső csomag nélkül (zlib + kézi PNG chunkok) */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---- minimál PNG-író ---- */
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePNG(file, size, pixels /* Uint8Array RGBA */) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  // szűrő byte minden sor elé
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log(`✔ ${path.basename(file)} (${size}x${size}, ${png.length} bájt)`);
}

/* ---- ikon rajzolása: 16x16 logikai pixelrács, felskálázva ---- */
const P = '.';
const GRID = [
  '................',
  '.##############.',
  '.#GGGGGGGGGGGG#.',
  '.#GGGGGGGGGGGG#.',
  '.#GGssssssssGG#.',
  '.#GGsSSssSSsGG#.',
  '.#GGsRSssRSsGG#.',
  '.#GGssssssssGG#.',
  '.#GGssssssssGG#.',
  '.#GGsMssssMsGG#.',
  '.#GGssMMMMssGG#.',
  '.#GGssssssssGG#.',
  '.#GGGGGGGGGGGG#.',
  '.#GGGGGGGGGGGG#.',
  '.##############.',
  '................',
];
const COLORS = {
  '.': [10, 15, 10, 255],     // háttér
  '#': [125, 219, 79, 255],   // keret — zöld
  G: [18, 26, 18, 255],       // belső sötét
  s: [123, 160, 91, 255],     // zombi bőr
  S: [42, 20, 20, 255],       // szemgödör
  R: [212, 61, 61, 255],      // vörös szem
  M: [42, 20, 20, 255],       // száj
};

function makeIcon(size, file) {
  const px = new Uint8Array(size * size * 4);
  const cell = size / 16;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.min(15, Math.floor(x / cell));
      const gy = Math.min(15, Math.floor(y / cell));
      const ch = GRID[gy][gx] || P;
      const c = COLORS[ch] || COLORS['.'];
      const i = (y * size + x) * 4;
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3];
    }
  }
  writePNG(file, size, px);
}

const out = path.join(__dirname, '..', 'icons');
makeIcon(180, path.join(out, 'icon-180.png'));
makeIcon(512, path.join(out, 'icon-512.png'));
