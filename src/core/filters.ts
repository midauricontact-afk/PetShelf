import { compareNum, lineOf } from './catalog';
import type { Family, Gen, Item, Pet } from './types';

export type Status = 'all' | 'have' | 'missing' | 'want' | 'dupes';
export type SortId = 'num' | 'year' | 'species' | 'recent' | 'missingFirst';

export interface Filters {
  q: string;
  gen: 'all' | Gen;
  status: Status;
  fam: Family | null;
  species: string | null;
  year: number | null;
  line: string | null;
}

export const DEFAULT_FILTERS: Filters = { q: '', gen: 'all', status: 'all', fam: null, species: null, year: null, line: null };

export const SORTS: { id: SortId; label: string }[] = [
  { id: 'num', label: 'Numéro' },
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

/** Minuscules sans accents, pour une recherche tolérante. */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Nombre de filtres actifs (hors recherche), pour la pastille du bouton. */
export const activeFilterCount = (f: Filters) =>
  (f.gen !== 'all' ? 1 : 0) + (f.status !== 'all' ? 1 : 0) + (f.fam ? 1 : 0) + (f.species ? 1 : 0) + (f.year ? 1 : 0) + (f.line ? 1 : 0);

/**
 * La recherche accepte : un numéro (« 1234 », « #1234 », « t226 »), un nom, une espèce, une couleur, un set.
 * Plusieurs mots = tous doivent correspondre (« chat rose 2008 »).
 */
export function matchesQuery(p: Pet, q: string): boolean {
  const query = fold(q).replace(/#/g, ' ');
  if (!query) return true;
  const num = fold(p.num);
  const words = query.split(/\s+/).filter(Boolean);
  // Un numéro seul : correspondance exacte d'abord (évite que « 12 » renvoie #1200…).
  if (words.length === 1 && /^[a-z]*\d+[a-z]?$/.test(words[0]) && !/^(19|20)\d\d$/.test(words[0])) return num === words[0];
  const hay = fold([p.num, p.name, p.species, p.year, p.gen, p.era, ...(p.colors ?? []), ...p.sets.map((s) => s.label)].filter(Boolean).join(' '));
  return words.every((w) => (/^\d+$/.test(w) && !/^(19|20)\d\d$/.test(w) ? num === w : hay.includes(w)));
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

export function applyFilters(pets: Pet[], items: Map<string, Item>, f: Filters, sort: SortId): Pet[] {
  const out = pets.filter(
    (p) =>
      (f.gen === 'all' || p.gen === f.gen) &&
      (!f.fam || p.fam === f.fam) &&
      (!f.species || p.species === f.species) &&
      (!f.year || p.year === f.year) &&
      (!f.line || p.sets.some((s) => lineOf(s.label) === f.line)) &&
      matchesStatus(items.get(p.id), f.status) &&
      matchesQuery(p, f.q),
  );
  return sortPets(out, items, sort);
}

const byNum = (a: Pet, b: Pet) => (a.gen === b.gen ? compareNum(a.num, b.num) : a.gen.localeCompare(b.gen));

export function sortPets(pets: Pet[], items: Map<string, Item>, sort: SortId): Pet[] {
  const list = [...pets];
  switch (sort) {
    case 'num':
      return list.sort(byNum);
    case 'year':
      return list.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || byNum(a, b));
    case 'species':
      return list.sort((a, b) => (a.species ?? '~').localeCompare(b.species ?? '~', 'fr') || byNum(a, b));
    case 'recent':
      return list.sort((a, b) => (items.get(b.id)?.addedAt ?? 0) - (items.get(a.id)?.addedAt ?? 0) || byNum(a, b));
    case 'missingFirst':
      return list.sort((a, b) => Number(!!items.get(a.id)?.have) - Number(!!items.get(b.id)?.have) || byNum(a, b));
  }
}
