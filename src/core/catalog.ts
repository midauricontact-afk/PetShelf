import type { Family, Gen, Mold, Pet, PetSet } from './types';
import { FAMILIES } from './types';

export interface Catalog {
  version: string;
  sources: string[];
  /** Toutes les figurines, triées une fois pour toutes par génération puis numéro. */
  pets: Pet[];
  byId: Map<string, Pet>;
  molds: Map<string, Mold>;
}

const FAMILY_IDS = new Set<string>(FAMILIES.map((f) => f.id));
const isHttps = (u: unknown): u is string => typeof u === 'string' && /^https:\/\//.test(u);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Minuscules sans accents, pour une recherche tolérante. */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Identifiant de moule à partir d'un nom (« Cat Shorthair » → « cat-shorthair »). */
export const moldSlug = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Texte dans lequel la recherche fouille (calculé une seule fois au chargement). */
export function searchText(p: Pet, mold?: Mold): string {
  return fold([p.num, p.name, p.species, p.year, p.gen, p.era, mold?.fr, mold?.en, ...(p.colors ?? []), ...p.sets.map((s) => s.label)].filter(Boolean).join(' '));
}

/** Valide et nettoie le fichier de catalogue : une entrée abîmée est ignorée au lieu de casser l'app. */
export function normalizeCatalog(raw: unknown): Catalog {
  const data = (raw ?? {}) as { version?: unknown; sources?: unknown; pets?: unknown; molds?: unknown };
  const molds = new Map<string, Mold>();
  if (data.molds && typeof data.molds === 'object') {
    for (const [id, m] of Object.entries(data.molds as Record<string, { fr?: unknown; en?: unknown }>)) {
      if (!/^[a-z0-9-]+$/.test(id) || !m) continue;
      molds.set(id, { id, fr: str(m.fr) || str(m.en) || id, en: str(m.en) || str(m.fr) || id });
    }
  }
  const list = Array.isArray(data.pets) ? data.pets : [];
  const pets: Pet[] = [];
  const byId = new Map<string, Pet>();
  for (const r of list as Record<string, unknown>[]) {
    if (!r || typeof r !== 'object') continue;
    const id = str(r.id);
    const gen = r.gen === 'G2' || r.gen === 'G7' ? (r.gen as Gen) : null;
    if (!id || !gen || byId.has(id)) continue;
    const sets: PetSet[] = Array.isArray(r.sets)
      ? (r.sets as Record<string, unknown>[])
          .filter((s) => s && str(s.label))
          .map((s) => ({ label: str(s.label), year: typeof s.year === 'number' ? s.year : undefined, with: str(s.with) || undefined }))
      : [];
    const species = str(r.species) || undefined;
    // Ancien catalogue sans moule : on se rabat sur l'espèce (« à vérifier »).
    let mold = str(r.mold);
    let moldGuess = r.moldGuess === true || undefined;
    if (!mold || !/^[a-z0-9-]+$/.test(mold)) {
      mold = species ? moldSlug(species) : 'inconnu';
      moldGuess = true;
    }
    if (!molds.has(mold)) molds.set(mold, { id: mold, fr: species && moldSlug(species) === mold ? species : mold === 'inconnu' ? 'Moule inconnu' : mold, en: mold });
    const pet: Pet = {
      id,
      gen,
      era: str(r.era) || gen,
      num: str(r.num),
      name: str(r.name) || undefined,
      species,
      fam: (FAMILY_IDS.has(str(r.fam)) ? str(r.fam) : 'autre') as Family,
      year: typeof r.year === 'number' && r.year > 1990 && r.year < 2100 ? r.year : undefined,
      yearApprox: r.yearApprox === true || undefined,
      sets,
      img: isHttps(r.img) ? r.img : undefined,
      alt: Array.isArray(r.alt) ? r.alt.filter(isHttps) : undefined,
      colors: Array.isArray(r.colors) ? r.colors.filter((c): c is string => typeof c === 'string') : undefined,
      mold,
      moldV: /^V\d+$/.test(str(r.moldV)) ? str(r.moldV) : undefined,
      moldGuess,
      src: str(r.src) || 'catalogue',
    };
    pets.push(pet);
    byId.set(id, pet);
  }
  // Ordre de référence (génération puis numéro) : le tri « par numéro » n'a plus rien à calculer.
  pets.sort((a, b) => (a.gen === b.gen ? compareNum(a.num, b.num) : a.gen.localeCompare(b.gen)));
  for (const p of pets) p.q = searchText(p, molds.get(p.mold));
  return { version: str(data.version), sources: Array.isArray(data.sources) ? data.sources.filter(isHttps) : [], pets, byId, molds };
}

let cached: Promise<Catalog> | null = null;

/** Charge le catalogue (fichier séparé, chargé une seule fois puis gardé hors ligne par le service worker). */
export function loadCatalog(): Promise<Catalog> {
  cached ??= import('../data/catalog.json').then((m) => normalizeCatalog((m as { default: unknown }).default ?? m));
  return cached;
}

/** « #1234 », « T226 »… ou « sans n° ». */
export const petNumber = (p: Pet) => (p.num ? (/^\d/.test(p.num) ? `#${p.num}` : p.num) : 'sans n°');

/** Nom à afficher : le prénom s'il existe, sinon l'espèce. */
export const petTitle = (p: Pet) => p.name ?? p.species ?? 'Figurine mystère';

/** Gamme d'une sortie (« Pet Pairs » dans « Pet Pairs – Winter Pals »). */
export const lineOf = (label: string) => label.split(' – ')[0];

/** Nom d'un moule à afficher (« Colley »). */
export const moldName = (molds: Map<string, Mold>, id: string) => molds.get(id)?.fr ?? id;

export interface Facets {
  species: { name: string; count: number }[];
  years: number[];
  lines: { name: string; count: number }[];
  molds: { id: string; name: string; count: number }[];
}

/** Listes de valeurs pour les filtres. */
export function facets(pets: Pet[], molds: Map<string, Mold> = new Map()): Facets {
  const sp = new Map<string, number>();
  const ln = new Map<string, number>();
  const md = new Map<string, number>();
  const yr = new Set<number>();
  for (const p of pets) {
    if (p.species) sp.set(p.species, (sp.get(p.species) ?? 0) + 1);
    if (p.year) yr.add(p.year);
    md.set(p.mold, (md.get(p.mold) ?? 0) + 1);
    for (const l of new Set(p.sets.map((s) => lineOf(s.label)))) ln.set(l, (ln.get(l) ?? 0) + 1);
  }
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'fr');
  return {
    species: [...sp].map(([name, count]) => ({ name, count })).sort(byName),
    years: [...yr].sort((a, b) => a - b),
    lines: [...ln].map(([name, count]) => ({ name, count })).sort(byName),
    molds: [...md].map(([id, count]) => ({ id, name: moldName(molds, id), count })).sort(byName),
  };
}

const numParts = (n: string): [number, string, number, string] => {
  const m = n.match(/^([A-Z]*)(\d+)(.*)$/i);
  if (!n) return [3, '', 0, ''];
  if (!m) return [2, n, 0, ''];
  return [m[1] ? 1 : 0, m[1].toUpperCase(), Number(m[2]), m[3]];
};

/** Tri « naturel » des numéros : 1, 2, 10, 100… puis les numéros à lettres (B56, T226), puis les sans numéro. */
export function compareNum(a: string, b: string): number {
  const [ka, pa, na, ra] = numParts(a);
  const [kb, pb, nb, rb] = numParts(b);
  return ka - kb || pa.localeCompare(pb) || na - nb || ra.localeCompare(rb);
}
