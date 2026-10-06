import type { Item, Mold, Pet } from '../src/core/types';

export const pet = (p: Partial<Pet> & { id: string }): Pet => ({ gen: 'G2', era: 'G2.1', num: p.id.replace(/^g\d-/, ''), fam: 'chat', sets: [], src: 'test', ...p, mold: p.mold ?? 'inconnu' });

export const PETS: Pet[] = [
  pet({ id: 'g2-1', mold: 'chihuahua', num: '1', species: 'Chihuahua', fam: 'chien', year: 2006, sets: [{ label: 'Singles' }], colors: ['marron'] }),
  pet({ id: 'g2-2', mold: 'cat-persian', num: '2', species: 'Chat persan', fam: 'chat', year: 2006, sets: [{ label: 'Pet Pairs – Duo' }], colors: ['blanc', 'rose'] }),
  pet({ id: 'g2-3', mold: 'cat-persian', num: '3', species: 'Chat persan', fam: 'chat', year: 2007, sets: [{ label: 'Pet Pairs – Duo' }] }),
  pet({ id: 'g2-10', mold: 'rabbit', num: '10', species: 'Lapin', fam: 'lapin', year: 2008, name: 'Sunny', sets: [{ label: 'Singles' }] }),
  pet({ id: 'g2-100', mold: 'dachshund', moldGuess: true, num: '100', species: 'Teckel', fam: 'chien', year: 2008 }),
  pet({ id: 'g2-1200', mold: 'hamster', num: '1200', species: 'Hamster', fam: 'rongeur', year: 2009 }),
  pet({ id: 'g2-t226', mold: 'panda', num: 'T226', species: 'Panda', fam: 'ours', year: 2010 }),
  pet({ id: 'g7-1', mold: 'panda', gen: 'G7', era: 'G7', num: '1', species: 'Panda', fam: 'ours', year: 2024, sets: [{ label: 'Pet Surprise – Wave 1' }] }),
  pet({ id: 'g7-2', mold: 'corgi', gen: 'G7', era: 'G7', num: '2', species: 'Corgi', fam: 'chien', year: 2024, sets: [{ label: 'Pet Surprise – Wave 1' }] }),
];

export const item = (id: string, patch: Partial<Item> = {}): Item => ({ id, have: false, want: false, dupes: 0, updatedAt: 1, ...patch });

export const items = (...list: Item[]) => new Map(list.map((i) => [i.id, i]));

export const MOLDS = new Map<string, Mold>(
  [
    ['chihuahua', 'Chihuahua'],
    ['cat-persian', 'Chat persan'],
    ['rabbit', 'Lapin'],
    ['dachshund', 'Teckel'],
    ['hamster', 'Hamster'],
    ['panda', 'Panda'],
    ['corgi', 'Corgi'],
  ].map(([id, fr]) => [id, { id, fr, en: id }]),
);
