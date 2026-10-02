#!/usr/bin/env node
/**
 * Builds the AURELIA brand assets from the supplied source artwork:
 *  - public/brand/aurelia-logo.png        colour lockup, transparent background
 *  - public/brand/aurelia-logo-light.png  white lockup, transparent background
 *  - src/app/icon.png                     monogram favicon on brand background
 *  - src/app/apple-icon.png               monogram apple touch icon (180x180)
 *
 * Dependency-free: decodes and re-encodes PNG with zlib only. The supplied
 * artwork is opaque RGB with a flat light background; the script finds the
 * background by dominant colour, keys it out with a small alpha ramp, splits
 * monogram from wordmark by blank scanlines, and rescales with a bilinear
 * filter in premultiplied alpha space.
 *
 * Run: node scripts/build-brand-assets.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(HERE, 'brand/aurelia-logo-source.png');
const PUBLIC_DIR = resolve(HERE, '../public/brand');
const APP_DIR = resolve(HERE, '../src/app');

const KEY_NEAR = 8; // colour distance <= this is pure background
const KEY_FAR = 40; // colour distance >= this is fully opaque
const MASK_MIN = 12; // distance used for geometry (bbox / band detection)

/* ---------------------------------------------------------------- PNG I/O */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG not supported');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 0;
  if (!channels) throw new Error(`unsupported colour type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * channels);
  let pos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;
    const rowStart = y * stride;
    const prevStart = rowStart - stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? out[rowStart + x - channels] : 0;
      const b = y > 0 ? out[prevStart + x] : 0;
      const c = x >= channels && y > 0 ? out[prevStart + x - channels] : 0;
      let value = raw[pos + x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) value += paeth(a, b, c);
      else if (filter !== 0) throw new Error(`bad filter ${filter}`);
      out[rowStart + x] = value & 0xff;
    }
    pos += stride;
  }
  return { width, height, channels, data: out };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------ image tools */

function pixelAt(img, x, y) {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

function dominantBackground(img) {
  const bins = new Map();
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      const [r, g, b] = pixelAt(img, x, y);
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const entry = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      entry.count += 1;
      entry.r += r;
      entry.g += g;
      entry.b += b;
      bins.set(key, entry);
    }
  }
  const sorted = [...bins.entries()].sort((a, b) => b[1].count - a[1].count);
  console.log('top colours (quantised, count):');
  for (const [key, entry] of sorted.slice(0, 6)) {
    const r = Math.round(entry.r / entry.count);
    const g = Math.round(entry.g / entry.count);
    const b = Math.round(entry.b / entry.count);
    console.log(`  bin ${key.toString(16)} rgb(${r},${g},${b}) x${entry.count}`);
  }
  const top = sorted[0][1];
  return [Math.round(top.r / top.count), Math.round(top.g / top.count), Math.round(top.b / top.count)];
}

const colorDistance = (r, g, b, bg) =>
  Math.max(Math.abs(r - bg[0]), Math.abs(g - bg[1]), Math.abs(b - bg[2]));

function keyOut(img, bg) {
  const rgba = Buffer.alloc(img.width * img.height * 4);
  const ramp = KEY_FAR - KEY_NEAR;
  let opaque = 0;
  let semi = 0;
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      const [r, g, b] = pixelAt(img, x, y);
      const dist = colorDistance(r, g, b, bg);
      let alpha;
      if (dist <= KEY_NEAR) alpha = 0;
      else if (dist >= KEY_FAR) alpha = 255;
      else alpha = Math.round(((dist - KEY_NEAR) / ramp) * 255);
      const o = (y * img.width + x) * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = alpha;
      if (alpha === 255) opaque += 1;
      else if (alpha > 0) semi += 1;
    }
  }
  return { width: img.width, height: img.height, data: rgba, stats: { opaque, semi } };
}

function alphaAt(img, x, y) {
  return img.data[(y * img.width + x) * 4 + 3];
}

function artworkBands(img, minAlpha = MASK_MIN) {
  const rows = [];
  for (let y = 0; y < img.height; y += 1) {
    let any = false;
    for (let x = 0; x < img.width; x += 1) {
      if (alphaAt(img, x, y) >= minAlpha) {
        any = true;
        break;
      }
    }
    rows.push(any);
  }
  const bands = [];
  let start = -1;
  for (let y = 0; y <= img.height; y += 1) {
    const on = y < img.height && rows[y];
    if (on && start < 0) start = y;
    if (!on && start >= 0) {
      bands.push({ top: start, bottom: y - 1 });
      start = -1;
    }
  }
  return bands;
}

function bandColumns(img, band, minAlpha = MASK_MIN) {
  let left = img.width;
  let right = -1;
  for (let x = 0; x < img.width; x += 1) {
    for (let y = band.top; y <= band.bottom; y += 1) {
      if (alphaAt(img, x, y) >= minAlpha) {
        if (x < left) left = x;
        if (x > right) right = x;
        break;
      }
    }
  }
  return { left, right };
}

function cropRgba(img, box) {
  const w = box.right - box.left + 1;
  const h = box.bottom - box.top + 1;
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const s = ((box.top + y) * img.width + box.left + x) * 4;
      const d = (y * w + x) * 4;
      data[d] = img.data[s];
      data[d + 1] = img.data[s + 1];
      data[d + 2] = img.data[s + 2];
      data[d + 3] = img.data[s + 3];
    }
  }
  return { width: w, height: h, data };
}

function toWhite(img) {
  const data = Buffer.alloc(img.width * img.height * 4);
  for (let i = 0; i < img.width * img.height; i += 1) {
    const o = i * 4;
    data[o] = 255;
    data[o + 1] = 255;
    data[o + 2] = 255;
    data[o + 3] = img.data[o + 3];
  }
  return { width: img.width, height: img.height, data };
}

function scalePremultiplied(img, targetW, targetH) {
  const { width: sw, height: sh } = img;
  const out = Buffer.alloc(targetW * targetH * 4);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  for (let y = 0; y < targetH; y += 1) {
    const sy = ((y + 0.5) * sh) / targetH - 0.5;
    const y0 = clamp(Math.floor(sy), 0, sh - 1);
    const y1 = clamp(y0 + 1, 0, sh - 1);
    const fy = clamp(sy - Math.floor(sy), 0, 1);
    for (let x = 0; x < targetW; x += 1) {
      const sx = ((x + 0.5) * sw) / targetW - 0.5;
      const x0 = clamp(Math.floor(sx), 0, sw - 1);
      const x1 = clamp(x0 + 1, 0, sw - 1);
      const fx = clamp(sx - Math.floor(sx), 0, 1);
      let pr = 0;
      let pg = 0;
      let pb = 0;
      let pa = 0;
      for (const [xi, yi, weight] of [
        [x0, y0, (1 - fx) * (1 - fy)],
        [x1, y0, fx * (1 - fy)],
        [x0, y1, (1 - fx) * fy],
        [x1, y1, fx * fy],
      ]) {
        const s = (yi * sw + xi) * 4;
        const a = img.data[s + 3] / 255;
        pr += img.data[s] * a * weight;
        pg += img.data[s + 1] * a * weight;
        pb += img.data[s + 2] * a * weight;
        pa += a * weight;
      }
      const d = (y * targetW + x) * 4;
      if (pa <= 0.0001) {
        out[d] = 0;
        out[d + 1] = 0;
        out[d + 2] = 0;
        out[d + 3] = 0;
      } else {
        out[d] = clamp(Math.round(pr / pa), 0, 255);
        out[d + 1] = clamp(Math.round(pg / pa), 0, 255);
        out[d + 2] = clamp(Math.round(pb / pa), 0, 255);
        out[d + 3] = clamp(Math.round(pa * 255), 0, 255);
      }
    }
  }
  return { width: targetW, height: targetH, data: out };
}

function compositeOn(img, bg) {
  const data = Buffer.alloc(img.width * img.height * 4);
  for (let i = 0; i < img.width * img.height; i += 1) {
    const o = i * 4;
    const a = img.data[o + 3];
    const inv = 255 - a;
    data[o] = Math.round((img.data[o] * a + bg[0] * inv) / 255);
    data[o + 1] = Math.round((img.data[o + 1] * a + bg[1] * inv) / 255);
    data[o + 2] = Math.round((img.data[o + 2] * a + bg[2] * inv) / 255);
    data[o + 3] = 255;
  }
  return { width: img.width, height: img.height, data };
}

function placeScaledOnCanvas(canvas, artwork, contentFraction) {
  const scale = Math.min(
    (canvas.width * contentFraction) / artwork.width,
    (canvas.height * contentFraction) / artwork.height,
  );
  const w = Math.max(1, Math.round(artwork.width * scale));
  const h = Math.max(1, Math.round(artwork.height * scale));
  const scaled = scalePremultiplied(artwork, w, h);
  const dx = Math.round((canvas.width - w) / 2);
  const dy = Math.round((canvas.height - h) / 2);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const s = (y * w + x) * 4;
      const d = ((dy + y) * canvas.width + dx + x) * 4;
      const a = scaled.data[s + 3];
      if (a === 0) continue;
      const inv = 255 - a;
      canvas.data[d] = Math.round((scaled.data[s] * a + canvas.data[d] * inv) / 255);
      canvas.data[d + 1] = Math.round((scaled.data[s + 1] * a + canvas.data[d + 1] * inv) / 255);
      canvas.data[d + 2] = Math.round((scaled.data[s + 2] * a + canvas.data[d + 2] * inv) / 255);
      canvas.data[d + 3] = 255;
    }
  }
  return { width: w, height: h, dx, dy };
}

function solidCanvas(width, height, bg) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    data[o] = bg[0];
    data[o + 1] = bg[1];
    data[o + 2] = bg[2];
    data[o + 3] = 255;
  }
  return { width, height, data };
}

/* ------------------------------------------------------------------- build */

const source = decodePng(readFileSync(SOURCE));
console.log(`source: ${source.width}x${source.height} channels=${source.channels}`);
const bg = dominantBackground(source);
console.log(`background: rgb(${bg.join(',')})`);

const keyed = keyOut(source, bg);
console.log(`keyed: ${keyed.stats.opaque} opaque, ${keyed.stats.semi} semi-transparent pixels`);

const bands = artworkBands(keyed);
console.log(`bands: ${JSON.stringify(bands)}`);
if (bands.length < 2) throw new Error('expected monogram and wordmark bands');
const monogramBand = bands[0];
const wordmarkBand = bands[bands.length - 1];

const monogramCols = bandColumns(keyed, monogramBand);
const wordmarkCols = bandColumns(keyed, wordmarkBand);
console.log(`monogram: rows ${monogramBand.top}-${monogramBand.bottom}, cols ${monogramCols.left}-${monogramCols.right}`);
console.log(`wordmark: rows ${wordmarkBand.top}-${wordmarkBand.bottom}, cols ${wordmarkCols.left}-${wordmarkCols.right}`);

const lockupBox = {
  top: Math.min(monogramBand.top, wordmarkBand.top),
  bottom: Math.max(monogramBand.bottom, wordmarkBand.bottom),
  left: Math.min(monogramCols.left, wordmarkCols.left),
  right: Math.max(monogramCols.right, wordmarkCols.right),
};
const PAD = 2;
const lockupCrop = cropRgba(keyed, {
  top: Math.max(0, lockupBox.top - PAD),
  bottom: Math.min(keyed.height - 1, lockupBox.bottom + PAD),
  left: Math.max(0, lockupBox.left - PAD),
  right: Math.min(keyed.width - 1, lockupBox.right + PAD),
});
const monogramCrop = cropRgba(keyed, {
  top: Math.max(0, monogramBand.top - 1),
  bottom: Math.min(keyed.height - 1, monogramBand.bottom + 1),
  left: Math.max(0, monogramCols.left - 1),
  right: Math.min(keyed.width - 1, monogramCols.right + 1),
});

mkdirSync(PUBLIC_DIR, { recursive: true });
mkdirSync(APP_DIR, { recursive: true });

const logo = encodePng(lockupCrop.width, lockupCrop.height, lockupCrop.data);
writeFileSync(resolve(PUBLIC_DIR, 'aurelia-logo.png'), logo);

const lightCrop = toWhite(lockupCrop);
const logoLight = encodePng(lightCrop.width, lightCrop.height, lightCrop.data);
writeFileSync(resolve(PUBLIC_DIR, 'aurelia-logo-light.png'), logoLight);

const iconCanvas = solidCanvas(128, 128, bg);
placeScaledOnCanvas(iconCanvas, monogramCrop, 0.82);
writeFileSync(resolve(APP_DIR, 'icon.png'), encodePng(iconCanvas.width, iconCanvas.height, iconCanvas.data));

const appleCanvas = solidCanvas(180, 180, bg);
placeScaledOnCanvas(appleCanvas, monogramCrop, 0.76);
writeFileSync(resolve(APP_DIR, 'apple-icon.png'), encodePng(appleCanvas.width, appleCanvas.height, appleCanvas.data));

console.log('---');
console.log(`public/brand/aurelia-logo.png       ${lockupCrop.width}x${lockupCrop.height} (${logo.length} bytes)`);
console.log(`public/brand/aurelia-logo-light.png ${lightCrop.width}x${lightCrop.height} (${logoLight.length} bytes)`);
console.log(`src/app/icon.png                    128x128 (${readFileSync(resolve(APP_DIR, 'icon.png')).length} bytes)`);
console.log(`src/app/apple-icon.png              180x180 (${readFileSync(resolve(APP_DIR, 'apple-icon.png')).length} bytes)`);
const ratio = lockupCrop.width / lockupCrop.height;
console.log(`lockup aspect ratio: ${ratio.toFixed(4)} (width / height)`);
