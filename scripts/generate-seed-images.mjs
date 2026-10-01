/**
 * Generates the placeholder artwork the seed data references.
 *
 * The reference site's photography is copyrighted, so instead of copying it we
 * synthesize deterministic floral SVGs from the brand palette. Same file name
 * always produces the same artwork, so seeds and screenshots stay stable.
 *
 * Run: node scripts/generate-seed-images.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', 'public', 'images', 'seed');

/* Palettes built around the measured brand tokens. */
const PALETTES = [
  { bg: ['#f3e9e4', '#e6d3cc'], petal: '#e0a3a8', petal2: '#c97f88', leaf: '#7f9a6d', center: '#f2c46b' },
  { bg: ['#eef2ea', '#dbe4d6'], petal: '#f0f0ea', petal2: '#d8dccb', leaf: '#71a200', center: '#fccb18' },
  { bg: ['#e8eff0', '#cfe0e0'], petal: '#a8c9cf', petal2: '#7fa9b4', leaf: '#4f8079', center: '#f0e4b8' },
  { bg: ['#f6efe2', '#ecdcc2'], petal: '#f3c56d', petal2: '#e0a13f', leaf: '#8a9a58', center: '#fff4d4' },
  { bg: ['#efe9f2', '#ded2e6'], petal: '#c1a8d6', petal2: '#9c7fbb', leaf: '#6f8a72', center: '#f6e7b6' },
  { bg: ['#e9f1ee', '#cfe1db'], petal: '#f7f2ee', petal2: '#dcd2c8', leaf: '#008577', center: '#fccb18' },
  { bg: ['#fbeceb', '#f2d3d2'], petal: '#e88b8b', petal2: '#cf5f63', leaf: '#7d9a6a', center: '#ffe6a6' },
  { bg: ['#eceff4', '#d6dce6'], petal: '#b9c6de', petal2: '#8fa2c4', leaf: '#5f7f6d', center: '#f4e3b0' },
];

function hash(text) {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

/** Deterministic pseudo-random sequence seeded by the file name. */
function rng(seed) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

function bloom(cx, cy, radius, palette, petals, rotate) {
  const parts = [];
  for (let i = 0; i < petals; i += 1) {
    const angle = (360 / petals) * i + rotate;
    parts.push(
      `<ellipse cx="${cx}" cy="${cy - radius * 0.55}" rx="${(radius * 0.42).toFixed(1)}" ry="${radius.toFixed(
        1,
      )}" fill="${i % 2 ? palette.petal2 : palette.petal}" opacity="0.92" transform="rotate(${angle.toFixed(
        1,
      )} ${cx} ${cy})"/>`,
    );
  }
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${(radius * 0.34).toFixed(1)}" fill="${palette.center}"/>`);
  return parts.join('');
}

function leaf(cx, cy, length, angle, color) {
  return `<path d="M${cx} ${cy} q ${length * 0.4} ${-length * 0.35} ${length} ${-length * 0.1} q ${-length * 0.45} ${
    length * 0.4
  } ${-length} ${length * 0.1} z" fill="${color}" opacity="0.85" transform="rotate(${angle} ${cx} ${cy})"/>`;
}

function makeSvg(name, width, height, options = {}) {
  const seed = hash(name);
  const random = rng(seed);
  const palette = PALETTES[seed % PALETTES.length];
  const dense = options.dense ?? 1;

  const blooms = [];
  const count = Math.max(3, Math.round((options.blooms ?? 5) * dense));

  for (let i = 0; i < count; i += 1) {
    const cx = width * (0.18 + random() * 0.64);
    const cy = height * (0.28 + random() * 0.5);
    const radius = Math.min(width, height) * (0.07 + random() * 0.09);
    blooms.push(leaf(cx, cy, radius * 2.1, random() * 360, palette.leaf));
    blooms.push(leaf(cx, cy, radius * 1.7, random() * 360, palette.leaf));
    blooms.push(bloom(cx, cy, radius, palette, 5 + Math.round(random() * 3), random() * 60));
  }

  const grain = Array.from({ length: 26 }, () => {
    const cx = (random() * width).toFixed(1);
    const cy = (random() * height).toFixed(1);
    const r = (1 + random() * 2.4).toFixed(1);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="${(0.05 + random() * 0.13).toFixed(2)}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg[0]}"/>
      <stop offset="100%" stop-color="${palette.bg[1]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="24%" r="72%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  ${grain}
  ${blooms.join('\n  ')}
</svg>
`;
}

const PRODUCT_IMAGES = [
  'bouquet-01', 'bouquet-02', 'bouquet-03', 'bouquet-04', 'bouquet-05', 'bouquet-06', 'bouquet-07', 'bouquet-08',
  'roses-01', 'roses-02',
  'basket-01', 'basket-02', 'basket-03',
  'box-01', 'box-02', 'box-03', 'box-04',
  'wedding-01', 'wedding-02',
  'wreath-01', 'wreath-02',
  'plant-01', 'plant-02', 'plant-03', 'plant-04', 'plant-05',
  'gift-01', 'gift-02', 'gift-03', 'gift-04',
  'trend-01', 'trend-02', 'trend-03',
  'diy-01', 'diy-02', 'diy-03', 'diy-04', 'diy-05',
];

const CATEGORY_SLUGS = [
  'flower-gifts', 'bouquets', 'flower-baskets', 'flower-boxes', 'roses',
  'opening-plants', 'congratulation-plants', 'orchids', 'planterior',
  'promotion', 'promotion-bouquets', 'office-plants',
  'wedding-funeral', 'wedding-flowers', 'funeral-wreaths',
  'trend-pick', 'diy-market', 'single-stems', 'florist-supplies',
];

const COLLECTION_SLUGS = [
  'florist-picks', 'flower-of-the-month', 'flowers-and-gifts', 'newborn-gifts', 'season-picks', 'art-line',
];

function write(name, svg) {
  writeFileSync(resolve(OUT, `${name}.svg`), svg, 'utf8');
}

function main() {
  mkdirSync(OUT, { recursive: true });
  let count = 0;

  for (const base of PRODUCT_IMAGES) {
    write(base, makeSvg(base, 900, 900, { blooms: 6 }));
    write(`${base}-2`, makeSvg(`${base}-two`, 900, 900, { blooms: 4 }));
    write(`${base}-3`, makeSvg(`${base}-three`, 900, 900, { blooms: 7 }));
    count += 3;
  }

  for (let i = 1; i <= 3; i += 1) {
    write(`hero-0${i}`, makeSvg(`hero-0${i}`, 1920, 720, { blooms: 11 }));
    count += 1;
  }

  for (let i = 1; i <= 8; i += 1) {
    write(`tile-0${i}`, makeSvg(`tile-0${i}`, 720, 480, { blooms: 4 }));
    count += 1;
  }

  for (let i = 1; i <= 3; i += 1) {
    write(`magazine-0${i}`, makeSvg(`magazine-0${i}`, 960, 600, { blooms: 5 }));
    write(`subscribe-0${i}`, makeSvg(`subscribe-0${i}`, 960, 720, { blooms: 6 }));
    count += 2;
  }

  write('event-01', makeSvg('event-01', 960, 600, { blooms: 5 }));
  count += 1;

  write('art-backdrop', makeSvg('art-backdrop', 1920, 560, { blooms: 14 }));
  count += 1;

  for (const slug of CATEGORY_SLUGS) {
    write(`cat-${slug}`, makeSvg(`cat-${slug}`, 640, 480, { blooms: 4 }));
    count += 1;
  }

  for (const slug of COLLECTION_SLUGS) {
    write(`collection-${slug}`, makeSvg(`collection-${slug}`, 1280, 480, { blooms: 8 }));
    count += 1;
  }

  process.stdout.write(`Generated ${count} seed images into ${OUT}\n`);
}

main();
