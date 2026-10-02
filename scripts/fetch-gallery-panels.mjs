/**
 * Downloads the art-line gallery band panels from Wikimedia Commons.
 * Commons. All five artists died well over a century ago, so the works are in
 * the public domain; we fetch our own scans rather than reusing anyone's banner.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = {
  'User-Agent': 'AURELIA/1.0 (seed catalogue build; contact: info@anahit-flower.am)',
};

const here = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] ?? resolve(here, '..', 'public', 'images', 'seed');
mkdirSync(OUT, { recursive: true });

/** Commons file titles, in the order they appear across the band. */
const PANELS = [
  ['art-01', 'Vincent van Gogh - Sunflowers - VGM F458.jpg'],
  ['art-02', 'Claude Monet - Woman with a Parasol - Madame Monet and Her Son - Google Art Project.jpg'],
  ['art-03', 'Van Gogh - Starry Night - Google Art Project.jpg'],
  ['art-04', 'Gustav Klimt 016.jpg'],
  ['art-05', 'Claude Monet - Water Lilies - 1906, Ryerson.jpg'],
];

async function info(title) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent('File:' + title) +
    '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1400&format=json';
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`api ${res.status}`);
  const json = await res.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const ii = page?.imageinfo?.[0];
  if (!ii) throw new Error('not found');
  return {
    url: ii.thumburl ?? ii.url,
    lic: ii.extmetadata?.LicenseShortName?.value ?? '?',
    w: ii.thumbwidth ?? ii.width,
    h: ii.thumbheight ?? ii.height,
  };
}

for (const [name, title] of PANELS) {
  try {
    const meta = await info(title);
    const res = await fetch(meta.url, { headers: UA });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 20000) throw new Error(`too small (${buf.length}b) - likely an error page`);
    writeFileSync(resolve(OUT, `${name}.jpg`), buf);
    console.log(`  ${name}.jpg  ${meta.w}x${meta.h}  ${meta.lic}  ${title.slice(0, 44)}`);
  } catch (err) {
    console.log(`  ${name} FAILED: ${err.message}  (${title.slice(0, 44)})`);
  }
}
