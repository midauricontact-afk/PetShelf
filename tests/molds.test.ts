import { describe, expect, it } from 'vitest';
import raw from '../src/data/catalog.json';
import { parseBackup } from '../src/core/backup';
import { normalizeCatalog } from '../src/core/catalog';
import { applyFilters, DEFAULT_FILTERS, groupByMold, moldOf, type Filters } from '../src/core/filters';
import { moldProgress } from '../src/core/stats';
import { isEmptyItem } from '../src/core/types';
import { item, items, MOLDS, PETS } from './fixtures';
import { assignMolds, moldSlug, parseMoldIndex, parseMoldPage, splitMold } from '../scripts/build-catalog.mjs';

const f = (patch: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...patch });

describe('classement par moule', () => {
  it('regroupe en sections triées par nom, G2 et G7 ensemble', () => {
    const sections = groupByMold(PETS, items(), MOLDS);
    expect(sections.map((s) => s.name)).toEqual(['Chat persan', 'Chihuahua', 'Corgi', 'Hamster', 'Lapin', 'Panda', 'Teckel']);
    const panda = sections.find((s) => s.mold === 'panda')!;
    expect(panda.pets.map((p) => p.id)).toEqual(['g2-t226', 'g7-1']);
    expect(panda.gens).toEqual(['G2', 'G7']);
  });

  it('compte les figurines possédées dans chaque section', () => {
    const sections = groupByMold(PETS, items(item('g2-2', { have: true })), MOLDS);
    expect(sections.find((s) => s.mold === 'cat-persian')).toMatchObject({ have: 1 });
    expect(sections.find((s) => s.mold === 'panda')).toMatchObject({ have: 0 });
  });

  it('respecte la correction faite à la main', () => {
    const mine = items(item('g2-100', { mold: 'chihuahua' }));
    expect(moldOf(PETS[4], mine)).toBe('chihuahua');
    const chi = groupByMold(PETS, mine, MOLDS).find((s) => s.mold === 'chihuahua')!;
    expect(chi.pets.map((p) => p.id)).toEqual(['g2-1', 'g2-100']);
    // Une correction suffit pour garder la fiche (ce n'est plus une fiche « vide »).
    expect(isEmptyItem(item('x', { mold: 'panda' }))).toBe(false);
  });

  it('filtre et trie par moule', () => {
    expect(applyFilters(PETS, items(), f({ mold: 'panda' }), 'num').map((p) => p.id)).toEqual(['g2-t226', 'g7-1']);
    expect(applyFilters(PETS, items(), f({ q: 'teckel' }), 'num').map((p) => p.id)).toEqual(['g2-100']);
    const sorted = applyFilters(PETS, items(), f({}), 'mold', MOLDS).map((p) => p.id);
    expect(sorted.slice(0, 3)).toEqual(['g2-2', 'g2-3', 'g2-1']);
  });

  it('progression par moule, avec les figurines à vérifier', () => {
    const list = moldProgress(PETS, items(item('g7-1', { have: true })), MOLDS);
    expect(list.find((m) => m.mold === 'panda')).toMatchObject({ have: 1, total: 2, pct: 50, gens: ['G2', 'G7'] });
    expect(list.find((m) => m.mold === 'dachshund')).toMatchObject({ guesses: 1 });
  });

  it('la correction de moule survit à l’export / import', () => {
    const back = parseBackup(JSON.stringify({ app: 'petshelf', version: 1, items: [item('g2-1', { mold: 'collie' }), item('g2-2', { mold: '../hack' })] }));
    expect(back.items[0].mold).toBe('collie');
    expect(back.items[1].mold).toBeUndefined();
  });
});

describe('moules dans le catalogue', () => {
  const cat = normalizeCatalog(raw);

  it('chaque figurine a un moule connu du catalogue', () => {
    for (const p of cat.pets) expect(cat.molds.has(p.mold)).toBe(true);
    expect(cat.molds.size).toBeGreaterThan(100);
  });

  it('la plupart des moules sont confirmés par les bases de collectionneurs', () => {
    const guessed = cat.pets.filter((p) => p.moldGuess).length;
    expect(guessed / cat.pets.length).toBeLessThan(0.35);
  });

  it('un ancien catalogue sans moule reste utilisable (moule = espèce, à vérifier)', () => {
    const c = normalizeCatalog({ pets: [{ id: 'g2-1', gen: 'G2', num: '1', species: 'Chihuahua' }] });
    expect(c.pets[0]).toMatchObject({ mold: 'chihuahua', moldGuess: true });
    expect(c.molds.get('chihuahua')?.fr).toBe('Chihuahua');
  });

  it('la recherche trouve aussi le nom du moule', () => {
    const p = cat.pets.find((x) => !x.moldGuess)!;
    const name = cat.molds.get(p.mold)!.fr.split(' ')[0];
    expect(p.q).toContain(name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  });
});

describe('script : moules des collectionneurs', () => {
  it('lit la liste des moules et les pages de moule', () => {
    const idx = parseMoldIndex("<b><a href='/g1/mold/collie-v1/'>Collie V1</a></b><br />(4 pets)<b><a href='/g1/mold/cat-shorthair-v2/'>Cat Shorthair V2</a></b>");
    expect(idx).toEqual([
      { href: '/g1/mold/collie-v1/', name: 'Collie V1' },
      { href: '/g1/mold/cat-shorthair-v2/', name: 'Cat Shorthair V2' },
    ]);
    const ids = parseMoldPage("<div class='blog-post-body'><a href='/g1/details/lps67/'>a</a><a href='/g1/details/lps67/'>b</a><a href='/g1/details/lps1263/'>c</a></div><div class='post-footer'><a href='/g1/details/autre/'>x</a></div>");
    expect(ids).toEqual(['lps67', 'lps1263']);
  });

  it('sépare le nom du moule et sa version', () => {
    expect(splitMold('Cat Shorthair V2')).toEqual({ base: 'Cat Shorthair', version: 'V2' });
    expect(splitMold('Anteater')).toEqual({ base: 'Anteater', version: '' });
    expect(moldSlug('St. Bernard')).toBe('st-bernard');
  });

  it('donne un moule à tout le monde, et marque les déductions « à vérifier »', () => {
    const pets = [
      { gen: 'G2', speciesEn: 'Collie', moldEn: 'Collie V1' },
      { gen: 'G2', speciesEn: 'Collie', moldEn: 'Collie V1' },
      { gen: 'G2', speciesEn: 'Collie', moldEn: 'Collie V2' },
      { gen: 'G2', speciesEn: 'Collie' },
      { gen: 'G7', speciesEn: 'Collie', moldEn: 'Collie V1' },
      { gen: 'G7', speciesEn: 'Axolotl' },
      { gen: 'G2', speciesEn: '' },
    ] as Record<string, unknown>[];
    const molds = assignMolds(pets);
    expect(pets.map((p) => p.mold)).toEqual(['collie', 'collie', 'collie', 'collie', 'collie', 'axolotl', 'inconnu']);
    expect(pets.map((p) => !!p.moldGuess)).toEqual([false, false, false, true, false, true, true]);
    expect(pets[2].moldV).toBe('V2');
    expect(molds.collie.fr).toBe('Colley');
    expect(molds.inconnu.fr).toBe('Moule inconnu');
  });
});
