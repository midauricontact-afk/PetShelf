// Construit le catalogue des figurines G2 (Hasbro 2004-2012) et G7 (Basic Fun 2024+) : npm run catalog
//
// Sources (pages publiques, autorisées par leur robots.txt) :
//  - LPSMerch.com : numéros, noms, espèces, gammes, sets, années et adresses des photos.
//    Leur découpage est plus fin que celui des collectionneurs : leurs « G1 + G2 + G3 » (#1 à ~#2675)
//    correspondent à la G2 Hasbro ; leur « G7 » est la relance Basic Fun.
//  - Toy Sisters : liste illustrée par numéro, pour recouper et combler les numéros manquants
//    (on respecte leur « Crawl-Delay: 20 » : une page toutes les 20 secondes).
//
// Les images ne sont JAMAIS copiées : on ne garde que leur adresse d'origine.
// Les pages téléchargées sont mises en cache dans scripts/.cache (ignoré par git) :
// supprime ce dossier pour forcer une mise à jour complète.
//
// Options :  --no-toysisters  (ne pas recouper avec Toy Sisters)
//            --colors         (calcule les couleurs dominantes depuis de toutes petites vignettes, sans les garder)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILY, SPECIES_FR } from './species-fr.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '.cache');
const OUT = join(ROOT, 'src', 'data', 'catalog.json');
const UA = 'PetShelf-catalog/1.0 (usage personnel, collection LPS)';
const args = new Set(process.argv.slice(2));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastHit = new Map();

/** Télécharge une page (avec cache disque et délai poli par site). */
async function get(url, delayMs) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_') + '.html');
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const host = new URL(url).host;
  const wait = (lastHit.get(host) ?? 0) + delayMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
  process.stdout.write(`  ↓ ${url}\n`);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} sur ${url}`);
  const html = await res.text();
  writeFileSync(file, html);
  return html;
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, '’')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

/** Adapte la taille d'une image Blogger (/s1600/ → /s400/…). Les autres adresses restent telles quelles. */
export const resizeBlogger = (url, size) =>
  /blogspot\.com|googleusercontent\.com/.test(url) ? url.replace(/\/s\d+(-[a-z0-9-]+)?\//i, `/s${size}/`) : url;

// ---------- LPSMerch ----------
const LPSMERCH = [
  { page: 'g1', gen: 'G2', era: 'G2.1' },
  { page: 'g2', gen: 'G2', era: 'G2.2' },
  { page: 'g3', gen: 'G2', era: 'G2.3' },
  { page: 'g7', gen: 'G7', era: 'G7' },
];

/** Analyse une page « all » de LPSMerch : une entrée par sortie (un même animal peut sortir dans plusieurs sets). */
export function parseLpsMerch(html, gen, era) {
  const out = [];
  for (const chunk of html.split(/<div class='data-item(?:-long)?'>/).slice(1)) {
    const img = chunk.match(/<div class='data-top'><a href='([^']+)'/);
    const bottom = chunk.split("<div class='data-bottom'>")[1];
    if (!bottom) continue;
    const head = bottom.match(/<b><a href='\/[^/]+\/details\/([^/]+)\/'>([^<]*)<\/a><\/b>(?:\s*\(#([^)]*)\))?/);
    if (!head) continue;
    const animal = bottom.match(/\/animal\/[^']*'>([^<]*)<\/a>/);
    const line = bottom.match(/\/line\/[^']*'>([^<]*)<\/a>/);
    const set = bottom.match(/\/set\/[^']*'>([^<]*)<\/a>/);
    const year = bottom.split('<span')[0].match(/\((\d{4})\)/);
    const combined = bottom.match(/Combined with ([^<]*)</);
    out.push({
      gen,
      era,
      srcId: head[1],
      name: decode(head[2]),
      num: decode(head[3] ?? '').replace(/^G7\s*-\s*#/i, '').trim(),
      animal: animal ? decode(animal[1]) : '',
      line: line ? decode(line[1]) : '',
      set: set ? decode(set[1]) : '',
      year: year ? Number(year[1]) : null,
      with: combined ? decode(combined[1]) : '',
      image: img ? img[1] : '',
    });
  }
  return out;
}

// ---------- Toy Sisters ----------
const TS_INDEX = 'https://www.toysisters.com/toy-guides/littlest-pet-shop/g2-littlest-pet-shop-by-number/';

/** Analyse une page « Pet #N » de Toy Sisters → [{ num, image }]. */
export function parseToySisters(html) {
  const out = [];
  const body = html.slice(Math.max(0, html.indexOf('<div class="entry-content"')));
  const re = /Pet #\s*([A-Z]*\d+[A-Za-z]?)\b[\s\S]{0,400}?<img[^>]+src="([^"]+)"/g;
  for (const m of body.matchAll(re)) out.push({ num: m[1], image: decode(m[2]).replace(/^http:/, 'https:').replace(/\?.*$/, '') });
  return out;
}

// ---------- Fusion ----------
const numKey = (n) => {
  const m = String(n).match(/^([A-Z]*)(\d+)(.*)$/i);
  return m ? [m[1].toUpperCase(), Number(m[2]), m[3]] : ['~', 0, String(n)];
};
export function compareNum(a, b) {
  const [pa, na, ra] = numKey(a);
  const [pb, nb, rb] = numKey(b);
  if (pa !== pb) return pa === '' ? -1 : pb === '' ? 1 : pa.localeCompare(pb);
  return na - nb || ra.localeCompare(rb);
}

const mostCommon = (xs) => {
  const c = new Map();
  for (const x of xs) if (x) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
};

/** Un vrai nom (« Sunny », « Pepper »…) et pas juste l'espèce (« Persian », « Kitten »…). */
export function isRealName(name, animal) {
  if (!name) return false;
  const n = name.toLowerCase();
  const a = (animal || '').toLowerCase();
  if (n === a || a.includes(n) || n.includes(a)) return false;
  return !Object.keys(SPECIES_FR).some((k) => k.toLowerCase() === n || k.toLowerCase().split(' ').includes(n));
}

/** Regroupe les sorties par génération + numéro : une fiche = une figurine. */
export function mergeReleases(releases) {
  const byKey = new Map();
  for (const r of releases) {
    if (/plush/i.test(r.line)) continue; // peluches : pas des figurines
    const unnumbered = !r.num || /^(none|\?|n\/a)$/i.test(r.num);
    const key = unnumbered ? `${r.gen}:?${r.srcId}` : `${r.gen}:${r.num}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r);
  }
  const pets = [];
  for (const [key, rs] of byKey) {
    const [gen, rawNum] = key.split(':');
    const num = rawNum.startsWith('?') ? '' : rawNum;
    const animal = mostCommon(rs.map((r) => r.animal));
    const years = rs.map((r) => r.year).filter(Boolean);
    const sets = [];
    for (const r of rs) {
      const label = [r.line, r.set].filter(Boolean).join(' – ');
      if (label && !sets.some((s) => s.label === label)) sets.push({ label, year: r.year ?? undefined, with: r.with || undefined });
    }
    const images = [...new Set(rs.map((r) => r.image).filter(Boolean))];
    const nameRaw = mostCommon(rs.map((r) => r.name));
    pets.push({
      id: `${gen.toLowerCase()}-${(num || 'x' + rs[0].srcId).toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
      gen,
      era: rs[0].era,
      num,
      name: isRealName(nameRaw, animal) ? nameRaw : '',
      species: SPECIES_FR[animal] ?? animal ?? '',
      speciesEn: animal,
      fam: FAMILY[animal] ?? 'autre',
      year: years.length ? Math.min(...years) : null,
      sets,
      img: images[0] ? resizeBlogger(images[0], 400) : '',
      alt: images.slice(1, 3).map((u) => resizeBlogger(u, 400)),
      src: 'lpsmerch',
      ref: rs[0].srcId,
    });
  }
  return pets;
}

/** Années manquantes : estimées depuis les numéros voisins (la numérotation suit l'ordre de sortie). */
export function fillYears(pets) {
  for (const gen of ['G2', 'G7']) {
    const list = pets.filter((p) => p.gen === gen && /^\d+$/.test(p.num)).sort((a, b) => Number(a.num) - Number(b.num));
    const known = list.filter((p) => p.year && !p.yearApprox);
    for (const p of list) {
      if (p.year) continue;
      const n = Number(p.num);
      let best = null;
      for (const k of known) if (!best || Math.abs(Number(k.num) - n) < Math.abs(Number(best.num) - n)) best = k;
      if (best && Math.abs(Number(best.num) - n) <= 400) {
        p.year = best.year;
        p.yearApprox = true;
      } else if (gen === 'G2') {
        // Repères des collectionneurs : #2100 à #2499 sortis en 2011, #2500 à #2675 en 2012.
        p.year = n >= 2500 ? 2012 : n >= 2000 ? 2011 : best?.year ?? null;
        if (p.year) p.yearApprox = true;
      }
    }
  }
}

// ---------- Couleurs (optionnel) ----------
async function addColors(pets) {
  const jpeg = await import('jpeg-js').then((m) => m.default ?? m).catch(() => null);
  if (!jpeg) {
    console.log('  (jpeg-js absent : couleurs ignorées — npm i -D jpeg-js)');
    return;
  }
  const { colorNames } = await import('./colors.mjs');
  const cacheFile = join(CACHE, 'colors.json');
  const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
  let i = 0;
  const todo = pets.filter((p) => p.img && /blogspot|googleusercontent/.test(p.img) && !(p.img in cache));
  async function worker() {
    while (i < todo.length) {
      const p = todo[i++];
      try {
        const res = await fetch(resizeBlogger(p.img, 96), { headers: { 'User-Agent': UA } });
        const buf = Buffer.from(await res.arrayBuffer());
        cache[p.img] = colorNames(jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 64 }));
      } catch {
        cache[p.img] = [];
      }
      if (i % 200 === 0) {
        process.stdout.write(`  couleurs ${i}/${todo.length}\n`);
        writeFileSync(cacheFile, JSON.stringify(cache));
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  writeFileSync(cacheFile, JSON.stringify(cache));
  for (const p of pets) if (cache[p.img]?.length) p.colors = cache[p.img];
}

// ---------- Programme ----------
async function main() {
  console.log('1/3 LPSMerch…');
  const releases = [];
  for (const { page, gen, era } of LPSMERCH) {
    const rs = parseLpsMerch(await get(`https://lpsmerch.com/${page}/all/`, 2000), gen, era);
    console.log(`  ${page} → ${rs.length} sorties`);
    releases.push(...rs);
  }
  const pets = mergeReleases(releases);

  if (!args.has('--no-toysisters')) {
    console.log('2/3 Toy Sisters (recoupement, 20 s entre pages)…');
    const idx = await get(TS_INDEX, 20000);
    const urls = [...new Set([...idx.matchAll(/href="([^"]*littlest-pet-shop-\d+-\d+\/?)"/g)].map((m) => m[1].replace(/^http:/, 'https:')))];
    const known = new Map(pets.map((p) => [`${p.gen}:${p.num}`, p]));
    let added = 0;
    let confirmed = 0;
    for (const url of urls) {
      const gen = /retro-basic-fun/.test(url) ? 'G7' : 'G2';
      let rows;
      try {
        rows = parseToySisters(await get(url, 20000));
      } catch (e) {
        console.log(`  ! ${e.message}`);
        continue;
      }
      for (const r of rows) {
        const p = known.get(`${gen}:${r.num}`);
        if (p) {
          confirmed++;
          if (!p.img) p.img = r.image;
          else if (p.alt.length < 3 && !p.alt.includes(r.image)) p.alt.push(r.image);
        } else if (gen === 'G2' && /^\d+$/.test(r.num) && Number(r.num) <= 2675) {
          const n = Number(r.num);
          const np = { id: `g2-${n}`, gen, era: n <= 456 ? 'G2.1' : n <= 1299 ? 'G2.2' : 'G2.3', num: r.num, name: '', species: '', speciesEn: '', fam: 'autre', year: null, sets: [], img: r.image, alt: [], src: 'toysisters' };
          pets.push(np);
          known.set(`${gen}:${r.num}`, np);
          added++;
        }
      }
    }
    console.log(`  ${confirmed} numéros confirmés, ${added} numéros ajoutés`);
  }

  fillYears(pets);
  if (args.has('--colors')) {
    console.log('3/3 Couleurs dominantes…');
    await addColors(pets);
  }

  pets.sort((a, b) => (a.gen === b.gen ? compareNum(a.num, b.num) : a.gen.localeCompare(b.gen)));
  // Format compact : on retire les champs vides pour alléger le fichier.
  const clean = pets.map((p) => {
    const { ref: _ref, speciesEn: _en, ...rest } = p;
    return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)));
  });
  const data = {
    version: new Date().toISOString().slice(0, 10),
    sources: ['https://lpsmerch.com/', 'https://www.toysisters.com/'],
    pets: clean,
  };
  writeFileSync(OUT, JSON.stringify(data));
  const g2 = clean.filter((p) => p.gen === 'G2').length;
  const g7 = clean.filter((p) => p.gen === 'G7').length;
  console.log(`Catalogue écrit : ${g2} figurines G2, ${g7} figurines G7 → src/data/catalog.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
