import { compareNum, fold, lineOf, searchText } from './catalog';
import type { Family, Gen, Item, Mold, Pet } from './types';

export { fold };

export type Status = 'all' | 'have' | 'missing' | 'want' | 'dupes';
export type SortId = 'num' | 'year' | 'species' | 'mold' | 'recent' | 'missingFirst';

export interface Filters {
  q: string;
  gen: 'all' | Gen;
  status: Status;
  fam: Family | null;
  species: string | null;
  year: number | null;
  line: string | null;
  mold: string | null;
}

export const DEFAULT_FILTERS: Filters = { q: '', gen: 'all', status: 'all', fam: null, species: null, year: null, line: null, mold: null };

export const SORTS: { id: SortId; label: string }[] = [
  { id: 'num', label: 'Numéro' },
  { id: 'mold', label: 'Moule' },
  { id: 'year', label: 'Année' },
  { id: 'species', label: 'Espèce' },
  { id: 'recent', label: 'Ajoutées récemment' },
  { id: 'missingFirst', label: 'Manquantes d’abord' },
];

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'have', label: 'Je les ai' },
  { id: 'missing', label: 'Manquantes' },
  { id: 'want', label: 'Je les cherche' },
  { id: 'dupes', label: 'En double' },
];

/** Nombre de filtres actifs (hors recherche), pour la pastille du bouton. */
export const activeFilterCount = (f: Filters) =>
  (f.gen !== 'all' ? 1 : 0) + (f.status !== 'all' ? 1 : 0) + (f.fam ? 1 : 0) + (f.species ? 1 : 0) + (f.year ? 1 : 0) + (f.line ? 1 : 0) + (f.mold ? 1 : 0);

/** Moule effectif : celui que j'ai corrigé à la main, sinon celui du catalogue. */
export const moldOf = (p: Pet, items: Map<string, Item>) => items.get(p.id)?.mold ?? p.mold;

/** Le résultat dépend-il de ma collection ? (sinon, cocher une figurine ne relance pas le filtrage) */
export const dependsOnItems = (f: Filters, sort: SortId) => f.status !== 'all' || sort === 'recent' || sort === 'missingFirst';

const YEAR_RE = /^(19|20)\d\d$/;

/**
 * La recherche accepte : un numéro (« 1234 », « #1234 », « t226 »), un nom, une espèce, un moule, une couleur, un set.
 * Plusieurs mots = tous doivent correspondre (« chat rose 2008 »).
 */
export function matchesQuery(p: Pet, q: string): boolean {
  const query = fold(q).replace(/#/g, ' ');
  if (!query) return true;
  const num = fold(p.num);
  const words = query.split(/\s+/).filter(Boolean);
  // Un numéro seul : correspondance exacte (évite que « 12 » renvoie #1200…).
  if (words.length === 1 && /^[a-z]*\d+[a-z]?$/.test(words[0]) && !YEAR_RE.test(words[0])) return num === words[0];
  const hay = p.q ?? searchText(p);
  return words.every((w) => (/^\d+$/.test(w) && !YEAR_RE.test(w) ? num === w : hay.includes(w)));
}

export function matchesStatus(item: Item | undefined, status: Status): boolean {
  switch (status) {
    case 'all':
      return true;
    case 'have':
      return !!item?.have;
    case 'missing':
      return !item?.have;
    case 'want':
      return !!item?.want;
    case 'dupes':
      return (item?.dupes ?? 0) > 0;
  }
}

export function applyFilters(pets: Pet[], items: Map<string, Item>, f: Filters, sort: SortId, molds?: Map<string, Mold>): Pet[] {
  const query = fold(f.q);
  const out = pets.filter(
    (p) =>
      (f.gen === 'all' || p.gen === f.gen) &&
      (!f.fam || p.fam === f.fam) &&
      (!f.species || p.species === f.species) &&
      (!f.year || p.year === f.year) &&
      (!f.mold || moldOf(p, items) === f.mold) &&
      (!f.line || p.sets.some((s) => lineOf(s.label) === f.line)) &&
      matchesStatus(items.get(p.id), f.status) &&
      (!query || matchesQuery(p, query)),
  );
  return sortPets(out, items, sort, molds);
}

const byNum = (a: Pet, b: Pet) => (a.gen === b.gen ? compareNum(a.num, b.num) : a.gen.localeCompare(b.gen));

/** Rang de chaque figurine dans l'ordre du catalogue : un tri par rang est bien plus rapide que des comparaisons de textes. */
const rankCache = new WeakMap<Pet, number>();
function rank(p: Pet): number {
  return rankCache.get(p) ?? 0;
}
/** À appeler une fois avec le catalogue (déjà trié par numéro). */
export function indexCatalogOrder(pets: Pet[]) {
  pets.forEach((p, i) => rankCache.set(p, i));
}
const byRank = (a: Pet, b: Pet) => rank(a) - rank(b) || byNum(a, b);

export function sortPets(pets: Pet[], items: Map<string, Item>, sort: SortId, molds?: Map<string, Mold>): Pet[] {
  const list = [...pets];
  switch (sort) {
    case 'num':
      return list.sort(byRank);
    case 'year':
      return list.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || byRank(a, b));
    case 'species':
      return list.sort((a, b) => (a.species ?? '~').localeCompare(b.species ?? '~', 'fr') || byRank(a, b));
    case 'mold': {
      const name = (p: Pet) => {
        const id = moldOf(p, items);
        return molds?.get(id)?.fr ?? id;
      };
      const names = new Map(list.map((p) => [p, name(p)]));
      return list.sort((a, b) => names.get(a)!.localeCompare(names.get(b)!, 'fr') || byRank(a, b));
    }
    case 'recent':
      return list.sort((a, b) => (items.get(b.id)?.addedAt ?? 0) - (items.get(a.id)?.addedAt ?? 0) || byRank(a, b));
    case 'missingFirst':
      return list.sort((a, b) => Number(!!items.get(a.id)?.have) - Number(!!items.get(b.id)?.have) || byRank(a, b));
  }
}

export interface MoldSection {
  mold: string;
  name: string;
  pets: Pet[];
  /** Possédées dans cette section (selon les filtres en cours). */
  have: number;
  /** Figurines de la section présentes dans les deux générations. */
  gens: Gen[];
}

/** Regroupe une liste (déjà filtrée et triée) en sections par moule, triées par nom français. */
export function groupByMold(pets: Pet[], items: Map<string, Item>, molds: Map<string, Mold>): MoldSection[] {
  const map = new Map<string, MoldSection>();
  for (const p of pets) {
    const id = moldOf(p, items);
    let s = map.get(id);
    if (!s) {
      s = { mold: id, name: molds.get(id)?.fr ?? id, pets: [], have: 0, gens: [] };
      map.set(id, s);
    }
    s.pets.push(p);
    if (items.get(p.id)?.have) s.have++;
    if (!s.gens.includes(p.gen)) s.gens.push(p.gen);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
