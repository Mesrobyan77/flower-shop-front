/**
 * Downloads licensed photography for the seed catalogue.
 *
 * The reference site's photography is copyrighted and is never used here. This
 * script pulls from a stock library whose licence permits commercial use, and
 * writes one .jpg per name the seed data expects, mirroring the file names that
 * generate-seed-images.mjs produces as .svg.
 *
 * Providers (pick whichever you have a free key for):
 *   PEXELS_API_KEY=...       https://www.pexels.com/api/
 *   UNSPLASH_ACCESS_KEY=...  https://unsplash.com/developers
 *
 * Run:
 *   PEXELS_API_KEY=xxx node scripts/fetch-seed-photos.mjs
 *   PEXELS_API_KEY=xxx node scripts/fetch-seed-photos.mjs --force   (re-download)
 *
 * Then reseed against the photos:
 *   cd ../backend && SEED_IMAGE_EXT=jpg npm run seed:fresh
 * and set SEED_IMAGE_EXT=jpg in backend/.env so the API serves the .jpg paths.
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', 'public', 'images', 'seed');
const FORCE = process.argv.includes('--force');

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

/* -------------------------------------------------------------------------- */
/* what each seed image should depict                                          */
/* -------------------------------------------------------------------------- */

/** Product artwork keys -> the subject the photo should show. */
const PRODUCT_QUERIES = {
  bouquet: 'flower bouquet',
  roses: 'rose bouquet',
  basket: 'flower basket arrangement',
  box: 'flowers in a gift box',
  plant: 'potted houseplant',
  wedding: 'wedding bouquet',
  wreath: 'flower wreath',
  diy: 'bunch of cut flowers',
  gift: 'flower gift box roses',
  trend: 'elegant flower arrangement bouquet',
};

const PRODUCT_KEYS = [
  'basket-01', 'basket-02', 'basket-03',
  'bouquet-01', 'bouquet-02', 'bouquet-03', 'bouquet-04',
  'bouquet-05', 'bouquet-06', 'bouquet-07', 'bouquet-08',
  'box-01', 'box-02', 'box-03', 'box-04',
  'diy-01', 'diy-02', 'diy-03', 'diy-04', 'diy-05',
  'gift-01', 'gift-02', 'gift-03', 'gift-04',
  'plant-01', 'plant-02', 'plant-03', 'plant-04', 'plant-05',
  'roses-01', 'roses-02',
  'trend-01', 'trend-02', 'trend-03',
  'wedding-01', 'wedding-02',
  'wreath-01', 'wreath-02',
];

const CATEGORY_QUERIES = {
  'flower-gifts': 'flower gift bouquet',
  bouquets: 'flower bouquet',
  'flower-baskets': 'flower basket',
  'flower-boxes': 'flowers in a box',
  roses: 'roses',
  'opening-plants': 'congratulatory plant pot',
  'congratulation-plants': 'orchid plant gift',
  orchids: 'orchid',
  planterior: 'indoor plants interior',
  promotion: 'elegant flower arrangement',
  'promotion-bouquets': 'formal bouquet',
  'office-plants': 'office plant',
  'wedding-funeral': 'white flower arrangement',
  'wedding-flowers': 'wedding flowers',
  'funeral-wreaths': 'white funeral flowers',
  'trend-pick': 'trendy flower arrangement',
  'diy-market': 'flower market stall',
  'single-stems': 'single flower stem',
  'florist-supplies': 'florist workshop tools',
};

const COLLECTION_QUERIES = {
  'florist-picks': 'florist arranging flowers',
  'flower-of-the-month': 'seasonal flowers',
  'flowers-and-gifts': 'flowers with chocolate gift',
  'newborn-gifts': 'pastel baby flowers',
  'season-picks': 'colourful seasonal bouquet',
};

/** name -> { q, orientation } for everything that is not a product image. */
const EXTRA = {
  'hero-01': { q: 'florist shop flowers', orientation: 'landscape' },
  'hero-02': { q: 'peony bouquet', orientation: 'landscape' },
  'hero-03': { q: 'flower subscription bouquet', orientation: 'landscape' },
  'event-01': { q: 'flower shop celebration', orientation: 'landscape' },
  'art-backdrop': { q: 'art gallery wall framed paintings', orientation: 'landscape' },
};
/** The eight theme tiles each illustrate their own occasion. */
const TILE_QUERIES = [
  'birthday flowers bouquet',
  'red roses romantic bouquet',
  'florist delivering flowers',
  'congratulation plant pot',
  'elegant formal bouquet',
  'wedding flowers bridal',
  'white lilies condolence',
  'flower market stall',
];
TILE_QUERIES.forEach((q, i) => { EXTRA[`tile-0${i + 1}`] = { q, orientation: 'square' }; });
for (let i = 1; i <= 3; i += 1) {
  EXTRA[`magazine-0${i}`] = { q: 'flowers editorial still life', orientation: 'landscape', page: i };
  EXTRA[`subscribe-0${i}`] = { q: 'weekly flower delivery bouquet', orientation: 'landscape', page: i };
}
for (const [slug, q] of Object.entries(CATEGORY_QUERIES)) EXTRA[`cat-${slug}`] = { q, orientation: 'landscape' };
for (const [slug, q] of Object.entries(COLLECTION_QUERIES)) EXTRA[`collection-${slug}`] = { q, orientation: 'landscape' };

/* -------------------------------------------------------------------------- */
/* providers                                                                   */
/* -------------------------------------------------------------------------- */

/** Returns a list of direct image URLs for a query, best first. */
async function search(query, { orientation = 'square', page = 1, perPage = 12 }) {
  if (PEXELS_KEY) {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
      `&per_page=${perPage}&page=${page}&orientation=${orientation === 'square' ? 'square' : 'landscape'}`;
    const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (!res.ok) throw new Error(`Pexels ${res.status} for "${query}"`);
    const json = await res.json();
    return (json.photos ?? []).map((p) => p.src?.large2x ?? p.src?.large).filter(Boolean);
  }

  if (UNSPLASH_KEY) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
      `&per_page=${perPage}&page=${page}&orientation=${orientation === 'square' ? 'squarish' : 'landscape'}`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
    if (!res.ok) throw new Error(`Unsplash ${res.status} for "${query}"`);
    const json = await res.json();
    return (json.results ?? []).map((p) => p.urls?.regular).filter(Boolean);
  }

  throw new Error('no provider key');
}

async function download(url, name) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${name}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(resolve(OUT, `${name}.jpg`), buf);
  return buf.length;
}

/* -------------------------------------------------------------------------- */

/** Groups product keys by family so one search feeds every variant of it. */
function productPlan() {
  const byFamily = new Map();
  for (const key of PRODUCT_KEYS) {
    const family = key.replace(/-\d+$/, '');
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push(key);
  }
  return byFamily;
}

async function main() {
  if (!PEXELS_KEY && !UNSPLASH_KEY) {
    process.stderr.write(
      'No image provider key found.\n\n' +
      'Set one of these and re-run:\n' +
      '  PEXELS_API_KEY=...       free key at https://www.pexels.com/api/\n' +
      '  UNSPLASH_ACCESS_KEY=...  free key at https://unsplash.com/developers\n\n' +
      'Both licences allow commercial use. Until then the generated .svg\n' +
      'placeholders from generate-seed-images.mjs remain in place.\n',
    );
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });
  let written = 0;
  let skipped = 0;
  const failures = [];

  // products: three variants per key, all drawn from that family's search
  for (const [family, keys] of productPlan()) {
    const query = PRODUCT_QUERIES[family] ?? `${family} flowers`;
    let pool = [];
    try {
      const [p1, p2] = await Promise.all([
        search(query, { orientation: 'square', perPage: 80, page: 1 }),
        search(query, { orientation: 'square', perPage: 80, page: 2 }),
      ]);
      pool = [...p1, ...p2];
    } catch (err) {
      failures.push(`${family}: ${err.message}`);
      continue;
    }

    let cursor = 0;
    for (const key of keys) {
      for (const suffix of ['', '-2', '-3']) {
        const name = `${key}${suffix}`;
        if (!FORCE && existsSync(resolve(OUT, `${name}.jpg`))) { skipped += 1; cursor += 1; continue; }
        const url = pool[cursor % pool.length];
        cursor += 1;
        if (!url) { failures.push(`${name}: empty pool`); continue; }
        try {
          await download(url, name);
          written += 1;
          process.stdout.write(`  ${name}.jpg\n`);
        } catch (err) {
          failures.push(`${name}: ${err.message}`);
        }
      }
    }
  }

  // heroes, tiles, categories, collections, editorial
  for (const [name, spec] of Object.entries(EXTRA)) {
    if (!FORCE && existsSync(resolve(OUT, `${name}.jpg`))) { skipped += 1; continue; }
    try {
      const pool = await search(spec.q, { orientation: spec.orientation, page: spec.page ?? 1, perPage: 12 });
      const url = pool[0];
      if (!url) { failures.push(`${name}: empty pool`); continue; }
      await download(url, name);
      written += 1;
      process.stdout.write(`  ${name}.jpg\n`);
    } catch (err) {
      failures.push(`${name}: ${err.message}`);
    }
  }

  process.stdout.write(`\nDownloaded ${written}, skipped ${skipped} already present.\n`);
  if (failures.length) {
    process.stdout.write(`${failures.length} failed:\n`);
    for (const f of failures.slice(0, 20)) process.stdout.write(`  - ${f}\n`);
  }
  process.stdout.write(
    '\nNext: set SEED_IMAGE_EXT=jpg in backend/.env, then\n' +
    '  cd backend && npm run seed:fresh\n',
  );
}

main().catch((err) => {
  process.stderr.write(`${err.stack ?? err}\n`);
  process.exit(1);
});
