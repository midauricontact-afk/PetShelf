import type { Family, Gen, Pet, PetSet } from './types';
import { FAMILIES } from './types';

export interface Catalog {
  version: string;
  sources: string[];
  pets: Pet[];
  byId: Map<string, Pet>;
}

const FAMILY_IDS = new Set<string>(FAMILIES.map((f) => f.id));
const isHttps = (u: unknown): u is string => typeof u === 'string' && /^https:\/\//.test(u);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Valide et nettoie le fichier de catalogue : une entrée abîmée est ignorée au lieu de casser l'app. */
export function normalizeCatalog(raw: unknown): Catalog {
  const data = (raw ?? {}) as { version?: unknown; sources?: unknown; pets?: unknown };
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
    const pet: Pet = {
      id,
      gen,
      era: str(r.era) || gen,
      num: str(r.num),
      name: str(r.name) || undefined,
      species: str(r.species) || undefined,
      fam: (FAMILY_IDS.has(str(r.fam)) ? str(r.fam) : 'autre') as Family,
      year: typeof r.year === 'number' && r.year > 1990 && r.year < 2100 ? r.year : undefined,
      yearApprox: r.yearApprox === true || undefined,
      sets,
      img: isHttps(r.img) ? r.img : undefined,
      alt: Array.isArray(r.alt) ? r.alt.filter(isHttps) : undefined,
      colors: Array.isArray(r.colors) ? r.colors.filter((c): c is string => typeof c === 'string') : undefined,
      src: str(r.src) || 'catalogue',
    };
    pets.push(pet);
    byId.set(id, pet);
  }
  return { version: str(data.version), sources: Array.isArray(data.sources) ? data.sources.filter(isHttps) : [], pets, byId };
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

export interface Facets {
  species: { name: string; count: number }[];
  years: number[];
  lines: { name: string; count: number }[];
}

/** Listes de valeurs pour les filtres. */
export function facets(pets: Pet[]): Facets {
  const sp = new Map<string, number>();
  const ln = new Map<string, number>();
  const yr = new Set<number>();
  for (const p of pets) {
    if (p.species) sp.set(p.species, (sp.get(p.species) ?? 0) + 1);
    if (p.year) yr.add(p.year);
    for (const l of new Set(p.sets.map((s) => lineOf(s.label)))) ln.set(l, (ln.get(l) ?? 0) + 1);
  }
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'fr');
  return {
    species: [...sp].map(([name, count]) => ({ name, count })).sort(byName),
    years: [...yr].sort((a, b) => a - b),
    lines: [...ln].map(([name, count]) => ({ name, count })).sort(byName),
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
