// Génère les icônes PNG de l'app (sans dépendance) : node scripts/gen-icons.mjs — une patte blanche sur fond bonbon.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const C1 = [255, 122, 182]; // rose bonbon
const C2 = [176, 140, 255]; // lilas
const WHITE = [255, 255, 255];

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const smooth = (d, w = 0.006) => Math.min(1, Math.max(0, 0.5 - d / w));

function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
const ellipse = (x, y, cx, cy, rx, ry) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);

function pixel(x, y, rounded) {
  if (rounded && sdRoundRect(x, y, 0.5, 0.5, 0.5, 0.5, 0.22) > 0) return [0, 0, 0, 0];
  // Fond : dégradé diagonal rose → lilas, avec un reflet doux en haut à gauche
  let col = mix(C1, C2, Math.min(1, Math.max(0, (x * 0.7 + y * 0.8) / 1.5)));
  col = mix(col, WHITE, Math.max(0, 1 - Math.hypot(x - 0.25, y - 0.2) / 0.5) ** 2 * 0.35);
  // Patte blanche : un coussinet + quatre doigts
  const pad = ellipse(x, y, 0.5, 0.63, 0.17, 0.14);
  const toes = Math.min(
    ellipse(x, y, 0.29, 0.44, 0.065, 0.08),
    ellipse(x, y, 0.41, 0.32, 0.068, 0.085),
    ellipse(x, y, 0.59, 0.32, 0.068, 0.085),
    ellipse(x, y, 0.71, 0.44, 0.065, 0.08),
  );
  col = mix(col, WHITE, smooth(Math.min(pad, toes)));
  // Petit cœur rose dans le coussinet
  const hx = (x - 0.5) / 0.07, hy = (0.64 - y) / 0.07 + 0.25;
  const heart = (hx * hx + hy * hy - 1) ** 3 - hx * hx * hy ** 3;
  if (heart <= 0) col = mix(col, C1, 0.95);
  return [...col, 255];
}

function render(size, { rounded, scale }) {
  const SS = 3;
  const data = Buffer.alloc(size * (size * 4 + 1));
  for (let py = 0; py < size; py++) {
    data[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          let x = (px + (sx + 0.5) / SS) / size;
          let y = (py + (sy + 0.5) / SS) / size;
          if (scale) {
            x = 0.5 + (x - 0.5) / scale;
            y = 0.5 + (y - 0.5) / scale;
          }
          const [cr, cg, cb, ca] = pixel(Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y)), rounded);
          r += cr * ca; g += cg * ca; b += cb * ca; a += ca;
        }
      }
      const o = py * (size * 4 + 1) + 1 + px * 4;
      const n = SS * SS;
      data[o] = a ? Math.round(r / a) : 0;
      data[o + 1] = a ? Math.round(g / a) : 0;
      data[o + 2] = a ? Math.round(b / a) : 0;
      data[o + 3] = Math.round(a / n);
    }
  }
  return png(size, data);
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  const tb = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tb));
  return Buffer.concat([len, tb, crc]);
}
function png(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size, opts] of [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['apple-touch-icon.png', 180, { rounded: false }],
  ['icon-maskable-512.png', 512, { rounded: false, scale: 0.8 }],
]) {
  writeFileSync(join(OUT, name), render(size, opts));
  console.log('écrit', name);
}

writeFileSync(
  join(OUT, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ab6"/><stop offset="1" stop-color="#b08cff"/></linearGradient></defs>
  <rect width="100" height="100" rx="22" fill="url(#g)"/>
  <g fill="#fff"><ellipse cx="50" cy="63" rx="17" ry="14"/><ellipse cx="29" cy="44" rx="6.5" ry="8"/><ellipse cx="41" cy="32" rx="6.8" ry="8.5"/><ellipse cx="59" cy="32" rx="6.8" ry="8.5"/><ellipse cx="71" cy="44" rx="6.5" ry="8"/></g>
  <path d="M50 70 C42 64 44 58 48 59 C49 59.3 50 60.5 50 61.5 C50 60.5 51 59.3 52 59 C56 58 58 64 50 70 Z" fill="#ff7ab6"/>
</svg>
`,
);
console.log('écrit icon.svg');
