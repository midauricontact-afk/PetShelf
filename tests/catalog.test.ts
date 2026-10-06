import { describe, expect, it } from 'vitest';
import raw from '../src/data/catalog.json';
import { compareNum, facets, normalizeCatalog, petNumber, petTitle } from '../src/core/catalog';
import { PETS } from './fixtures';
// Le script qui construit le catalogue (fonctions d'analyse, sans réseau).
import { isRealName, mergeReleases, parseLpsMerch, parseToySisters, resizeBlogger } from '../scripts/build-catalog.mjs';

describe('chargement du catalogue', () => {
  const cat = normalizeCatalog(raw);

  it('contient des figurines G2 et G7', () => {
    const g2 = cat.pets.filter((p) => p.gen === 'G2').length;
    const g7 = cat.pets.filter((p) => p.gen === 'G7').length;
    expect(g2).toBeGreaterThan(2000);
    expect(g7).toBeGreaterThan(300);
  });

  it('a des identifiants uniques et des numéros G2 jusqu’à #2675', () => {
    expect(new Set(cat.pets.map((p) => p.id)).size).toBe(cat.pets.length);
    const nums = cat.pets.filter((p) => p.gen === 'G2' && /^\d+$/.test(p.num)).map((p) => Number(p.num));
    expect(Math.max(...nums)).toBeLessThanOrEqual(2675);
    expect(nums).toContain(1);
  });

  it('ne référence que des images en https (aucune image copiée)', () => {
    for (const p of cat.pets) {
      if (p.img) expect(p.img).toMatch(/^https:\/\//);
      for (const a of p.alt ?? []) expect(a).toMatch(/^https:\/\//);
    }
    expect(cat.pets.filter((p) => p.img).length / cat.pets.length).toBeGreaterThan(0.95);
  });

  it('les années sont plausibles pour chaque génération', () => {
    for (const p of cat.pets) {
      if (!p.year) continue;
      if (p.gen === 'G2') expect(p.year).toBeGreaterThanOrEqual(2004), expect(p.year).toBeLessThanOrEqual(2013);
      else expect(p.year).toBeGreaterThanOrEqual(2023);
    }
  });

  it('ignore les entrées abîmées sans planter', () => {
    const c = normalizeCatalog({
      pets: [null, { id: 'x' }, { id: 'g2-1', gen: 'G2', num: '1', fam: 'licorne', img: 'http://pas-sur', sets: [{ label: '' }, { label: 'Singles', year: 2006 }] }, { id: 'g2-1', gen: 'G2' }],
    });
    expect(c.pets).toHaveLength(1);
    expect(c.pets[0].fam).toBe('autre');
    expect(c.pets[0].img).toBeUndefined();
    expect(c.pets[0].sets).toEqual([{ label: 'Singles', year: 2006, with: undefined }]);
    expect(normalizeCatalog(undefined).pets).toEqual([]);
  });

  it('trie les numéros naturellement', () => {
    expect(['T226', '100', '', '2', '10', 'B56', '1'].sort(compareNum)).toEqual(['1', '2', '10', '100', 'B56', 'T226', '']);
  });

  it('affiche joliment numéro et nom', () => {
    expect(petNumber(PETS[0])).toBe('#1');
    expect(petNumber(PETS[6])).toBe('T226');
    expect(petNumber({ ...PETS[0], num: '' })).toBe('sans n°');
    expect(petTitle(PETS[3])).toBe('Sunny');
    expect(petTitle(PETS[0])).toBe('Chihuahua');
  });

  it('calcule les valeurs des filtres', () => {
    const f = facets(PETS);
    expect(f.years).toEqual([2006, 2007, 2008, 2009, 2010, 2024]);
    expect(f.species.find((s) => s.name === 'Chat persan')?.count).toBe(2);
    expect(f.lines.map((l) => l.name)).toContain('Pet Pairs');
  });
});

describe('script de construction du catalogue', () => {
  const html = `<div class='data-main'><div class='data-item-long'><div class='data-top'><a href='https://1.bp.blogspot.com/abc/s1600/G7-1-Panda.jpg' imageanchor='1'><img src='x'/></a></div><div class='data-bottom'><b><a href='/g7/details/g7lpsbfs1p1/'>Panda</a></b> (#G7 - #1)<br /><a href='/g7/animal/panda/'>Panda</a><br /><a href='/g7/line/series-1/pet-surprise/'>Pet Surprise</a>: <a href='/g7/set/pet-surprise/wave-1/'>Wave 1</a> (2024)<span class='data-amzn'> (2099)</span></div></div><div class='data-item'><div class='data-top'><a href='https://2.bp.blogspot.com/def/s1600/1-Chihuahua.jpg'></a></div><div class='data-bottom'><b><a href='/g1/details/lps1b/'>Chihuahua</a></b> (#1)<br /><a href='/g1/animal/chihuahua/'>Chihuahua</a><br /><a href='/g1/line/pet-pairs/'>Pet Pairs</a>(2006)<span class='data-smallt'>Combined with #2</span></div></div><div class='data-item'><div class='data-top'><a href='https://2.bp.blogspot.com/p/s1600/plush.jpg'></a></div><div class='data-bottom'><b><a href='/g7/details/plush1/'>Bunny</a></b><br /><a href='/g7/animal/bunny/'>Bunny</a><br /><a href='/g7/line/series-3/surprise-plush-pets/'>Surprise Plush Pets</a>: <a href='/g7/set/x/'>Wave 1</a> (2025)</div></div>`;

  it('lit les fiches LPSMerch (les deux formats de page)', () => {
    const rs = parseLpsMerch(html, 'G7', 'G7');
    expect(rs).toHaveLength(3);
    expect(rs[0]).toMatchObject({ num: '1', name: 'Panda', animal: 'Panda', line: 'Pet Surprise', set: 'Wave 1', year: 2024 });
    expect(rs[1]).toMatchObject({ num: '1', line: 'Pet Pairs', year: 2006, with: '#2' });
    expect(rs[2].num).toBe('');
  });

  it('regroupe les sorties par numéro et écarte les peluches', () => {
    const pets = mergeReleases(parseLpsMerch(html, 'G7', 'G7'));
    expect(pets).toHaveLength(1);
    expect(pets[0]).toMatchObject({ id: 'g7-1', species: 'Panda', fam: 'ours', year: 2006 });
    expect(pets[0].sets.map((s: { label: string }) => s.label)).toEqual(['Pet Surprise – Wave 1', 'Pet Pairs']);
    expect(pets[0].img).toContain('/s400/');
  });

  it('distingue un vrai nom d’un simple nom d’espèce', () => {
    expect(isRealName('Persian', 'Persian Cat')).toBe(false);
    expect(isRealName('Kitten', 'Cat Shorthair')).toBe(false);
    expect(isRealName('Sunny', 'Rabbit')).toBe(true);
  });

  it('lit la liste par numéro de Toy Sisters', () => {
    const ts = parseToySisters('<div class="entry-content"><p>Pet #2001</p><img src="http://www.toysisters.com/a/2001.jpg?x=1"><p>Pet #2002</p><img class="a" src="https://www.toysisters.com/a/2002.jpg"></div>');
    expect(ts).toEqual([
      { num: '2001', image: 'https://www.toysisters.com/a/2001.jpg' },
      { num: '2002', image: 'https://www.toysisters.com/a/2002.jpg' },
    ]);
  });

  it('redimensionne seulement les images Blogger', () => {
    expect(resizeBlogger('https://1.bp.blogspot.com/a/s1600/x.jpg', 400)).toBe('https://1.bp.blogspot.com/a/s400/x.jpg');
    expect(resizeBlogger('https://www.toysisters.com/s1600/x.jpg', 400)).toBe('https://www.toysisters.com/s1600/x.jpg');
  });
});
