import { describe, expect, it } from 'vitest';
import { activeFilterCount, applyFilters, DEFAULT_FILTERS, fold, matchesQuery, type Filters } from '../src/core/filters';
import { item, items, PETS } from './fixtures';

const f = (patch: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...patch });
const ids = (list: { id: string }[]) => list.map((p) => p.id);
const mine = items(item('g2-1', { have: true, addedAt: 5 }), item('g2-2', { want: true }), item('g7-1', { have: true, dupes: 2, addedAt: 9 }));

describe('recherche', () => {
  it('trouve un numéro exact, avec ou sans #', () => {
    expect(ids(applyFilters(PETS, mine, f({ q: '10' }), 'num'))).toEqual(['g2-10']);
    expect(ids(applyFilters(PETS, mine, f({ q: '#1' }), 'num'))).toEqual(['g2-1', 'g7-1']);
    expect(ids(applyFilters(PETS, mine, f({ q: 't226' }), 'num'))).toEqual(['g2-t226']);
  });

  it('cherche dans le nom, l’espèce, la couleur et le set, sans tenir compte des accents', () => {
    expect(matchesQuery(PETS[3], 'sunny')).toBe(true);
    expect(matchesQuery(PETS[1], 'chat ROSE')).toBe(true);
    expect(matchesQuery(PETS[1], 'chat bleu')).toBe(false);
    expect(matchesQuery(PETS[4], 'téckel')).toBe(true);
    expect(matchesQuery(PETS[7], 'wave')).toBe(true);
    expect(fold('Écureuil')).toBe('ecureuil');
  });

  it('une année dans la recherche n’est pas prise pour un numéro', () => {
    expect(ids(applyFilters(PETS, mine, f({ q: 'panda 2024' }), 'num'))).toEqual(['g7-1']);
  });
});

describe('filtres', () => {
  it('filtre par génération, famille, espèce, année et gamme', () => {
    expect(ids(applyFilters(PETS, mine, f({ gen: 'G7' }), 'num'))).toEqual(['g7-1', 'g7-2']);
    expect(ids(applyFilters(PETS, mine, f({ fam: 'chien' }), 'num'))).toEqual(['g2-1', 'g2-100', 'g7-2']);
    expect(ids(applyFilters(PETS, mine, f({ species: 'Chat persan' }), 'num'))).toEqual(['g2-2', 'g2-3']);
    expect(ids(applyFilters(PETS, mine, f({ year: 2008 }), 'num'))).toEqual(['g2-10', 'g2-100']);
    expect(ids(applyFilters(PETS, mine, f({ line: 'Pet Pairs' }), 'num'))).toEqual(['g2-2', 'g2-3']);
  });

  it('filtre par statut : possédées, manquantes, wishlist, doubles', () => {
    expect(ids(applyFilters(PETS, mine, f({ status: 'have' }), 'num'))).toEqual(['g2-1', 'g7-1']);
    expect(applyFilters(PETS, mine, f({ status: 'missing' }), 'num')).toHaveLength(PETS.length - 2);
    expect(ids(applyFilters(PETS, mine, f({ status: 'want' }), 'num'))).toEqual(['g2-2']);
    expect(ids(applyFilters(PETS, mine, f({ status: 'dupes' }), 'num'))).toEqual(['g7-1']);
  });

  it('combine plusieurs filtres', () => {
    expect(ids(applyFilters(PETS, mine, f({ gen: 'G2', fam: 'ours' }), 'num'))).toEqual(['g2-t226']);
    expect(activeFilterCount(f({ gen: 'G2', fam: 'ours', q: 'x' }))).toBe(2);
  });

  it('trie par numéro, année, espèce, ajout récent et manquantes d’abord', () => {
    expect(ids(applyFilters(PETS, mine, f({}), 'num')).slice(0, 7)).toEqual(['g2-1', 'g2-2', 'g2-3', 'g2-10', 'g2-100', 'g2-1200', 'g2-t226']);
    expect(ids(applyFilters(PETS, mine, f({}), 'year'))[0]).toBe('g2-1');
    expect(ids(applyFilters(PETS, mine, f({}), 'species'))[0]).toBe('g2-2');
    expect(ids(applyFilters(PETS, mine, f({}), 'recent')).slice(0, 2)).toEqual(['g7-1', 'g2-1']);
    const missingFirst = ids(applyFilters(PETS, mine, f({}), 'missingFirst'));
    expect(missingFirst.slice(-2)).toEqual(['g2-1', 'g7-1']);
  });
});
