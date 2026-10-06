import { lineOf } from './catalog';
import type { Gen, Item, Mold, Pet } from './types';

export interface Progress {
  have: number;
  total: number;
  /** Pourcentage arrondi à l'unité inférieure (100 % seulement si tout est coché). */
  pct: number;
}

export const progressOf = (have: number, total: number): Progress => ({
  have,
  total,
  pct: total ? (have === total ? 100 : Math.floor((have / total) * 100)) : 0,
});

export function progress(pets: Pet[], items: Map<string, Item>): Progress {
  let have = 0;
  for (const p of pets) if (items.get(p.id)?.have) have++;
  return progressOf(have, pets.length);
}

export interface GroupProgress extends Progress {
  key: string;
}

/** Progression par groupe (génération, espèce, année, gamme…). */
export function progressBy(pets: Pet[], items: Map<string, Item>, keyOf: (p: Pet) => string | string[] | undefined): GroupProgress[] {
  const groups = new Map<string, { have: number; total: number }>();
  for (const p of pets) {
    const raw = keyOf(p);
    const keys = raw === undefined ? [] : Array.isArray(raw) ? [...new Set(raw)] : [raw];
    for (const k of keys) {
      const g = groups.get(k) ?? { have: 0, total: 0 };
      g.total++;
      if (items.get(p.id)?.have) g.have++;
      groups.set(k, g);
    }
  }
  return [...groups].map(([key, g]) => ({ key, ...progressOf(g.have, g.total) }));
}

/** Les « séries » : chaque set (gamme + vague) regroupant au moins deux figurines. */
export function seriesOf(pets: Pet[]): Map<string, Pet[]> {
  const map = new Map<string, Pet[]>();
  for (const p of pets) {
    for (const label of new Set(p.sets.map((s) => s.label))) {
      const key = `${p.gen} · ${label}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
  }
  for (const [k, list] of map) if (list.length < 2) map.delete(k);
  return map;
}

/** Séries complètes, et séries que cette figurine vient de compléter. */
export function completedSeries(series: Map<string, Pet[]>, items: Map<string, Item>): string[] {
  return [...series].filter(([, list]) => list.every((p) => items.get(p.id)?.have)).map(([k]) => k);
}

/** Pour chaque figurine, les séries dont elle fait partie (calculé une fois). */
export function seriesIndex(series: Map<string, Pet[]>): Map<string, string[]> {
  const idx = new Map<string, string[]>();
  for (const [key, list] of series) for (const p of list) idx.set(p.id, [...(idx.get(p.id) ?? []), key]);
  return idx;
}

export function seriesCompletedBy(petId: string, series: Map<string, Pet[]>, items: Map<string, Item>, index?: Map<string, string[]>): string[] {
  const keys = index ? (index.get(petId) ?? []) : [...series].filter(([, list]) => list.some((p) => p.id === petId)).map(([k]) => k);
  return keys.filter((k) => series.get(k)!.every((p) => items.get(p.id)?.have));
}

/** Séries presque complètes (il en manque 1 ou 2) : de bonnes cibles pour la wishlist. */
export function almostComplete(series: Map<string, Pet[]>, items: Map<string, Item>, maxMissing = 2) {
  const out: { key: string; missing: Pet[]; total: number }[] = [];
  for (const [key, list] of series) {
    const missing = list.filter((p) => !items.get(p.id)?.have);
    if (missing.length > 0 && missing.length <= maxMissing && list.length - missing.length >= 1) out.push({ key, missing, total: list.length });
  }
  return out.sort((a, b) => a.missing.length - b.missing.length || b.total - a.total);
}

export interface Totals {
  have: number;
  want: number;
  dupes: number;
  dupesCount: number;
  boxed: number;
}

export function totals(items: Map<string, Item>): Totals {
  const t: Totals = { have: 0, want: 0, dupes: 0, dupesCount: 0, boxed: 0 };
  for (const it of items.values()) {
    if (it.have) t.have++;
    if (it.want) t.want++;
    if (it.dupes > 0) {
      t.dupes++;
      t.dupesCount += it.dupes;
    }
    if (it.have && it.condition === 'boite') t.boxed++;
  }
  return t;
}

/** Paliers de collection : un petit badge à chaque étape. */
export const MILESTONES = [1, 10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000];

export const milestoneReached = (before: number, after: number) => MILESTONES.find((m) => before < m && after >= m) ?? null;

export interface MoldProgress extends Progress {
  mold: string;
  name: string;
  gens: Gen[];
  /** Une figurine représentative (avec photo de préférence). */
  cover: Pet;
  guesses: number;
}

/** Progression par moule (G2 et G7 réunies), triée par nom. */
export function moldProgress(pets: Pet[], items: Map<string, Item>, molds: Map<string, Mold>): MoldProgress[] {
  const map = new Map<string, { have: number; total: number; gens: Set<Gen>; cover: Pet; guesses: number }>();
  for (const p of pets) {
    const id = items.get(p.id)?.mold ?? p.mold;
    let g = map.get(id);
    if (!g) {
      g = { have: 0, total: 0, gens: new Set(), cover: p, guesses: 0 };
      map.set(id, g);
    }
    g.total++;
    g.gens.add(p.gen);
    if (items.get(p.id)?.have) g.have++;
    if (p.moldGuess && !items.get(p.id)?.mold) g.guesses++;
    if (!g.cover.img && p.img) g.cover = p;
  }
  return [...map]
    .map(([mold, g]) => ({ mold, name: molds.get(mold)?.fr ?? mold, gens: [...g.gens].sort(), cover: g.cover, guesses: g.guesses, ...progressOf(g.have, g.total) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export { lineOf };
