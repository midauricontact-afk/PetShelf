import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { backupFileName, makeBackup, mergeItems, parseBackup } from '../src/core/backup';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/core/settings';
import { openStore } from '../src/storage/db';
import { item } from './fixtures';

describe('export / import', () => {
  it('aller-retour sans perte', () => {
    const list = [item('g2-1', { have: true, condition: 'boite', acc: 'partiel', note: 'Vide-grenier 2€', addedAt: 10, updatedAt: 20 }), item('g7-3', { want: true, dupes: 2, updatedAt: 30 })];
    const text = JSON.stringify(makeBackup(list, { ...DEFAULT_SETTINGS, themeId: 'lagon' }, undefined, new Date('2026-10-06T10:00:00Z')));
    const back = parseBackup(text);
    expect(back.items).toEqual(list.map((i) => ({ ...i, photo: undefined, condition: i.condition, acc: i.acc, note: i.note })));
    expect(back.settings?.themeId).toBe('lagon');
    expect(back.skipped).toBe(0);
  });

  it('n’exporte pas les fiches vides', () => {
    expect(makeBackup([item('a'), item('b', { have: true })], DEFAULT_SETTINGS).items.map((i) => i.id)).toEqual(['b']);
  });

  it('garde les photos fournies et oublie les photos manquantes', () => {
    const b = makeBackup([item('a', { have: true, photo: true }), item('b', { have: true, photo: true })], DEFAULT_SETTINGS, { a: 'data:image/jpeg;base64,AAA', z: 'data:image/jpeg;base64,BBB' });
    const back = parseBackup(JSON.stringify(b));
    expect(Object.keys(back.photos)).toEqual(['a']);
    expect(back.items.find((i) => i.id === 'b')?.photo).toBeUndefined();
  });

  it('refuse clairement un fichier qui n’est pas une sauvegarde', () => {
    expect(() => parseBackup('pas du json')).toThrow(/lisible/);
    expect(() => parseBackup('{"app":"autre","items":[]}')).toThrow(/PetShelf/);
    expect(() => parseBackup('{"app":"petshelf","version":99,"items":[]}')).toThrow(/récente/);
  });

  it('nettoie les données bizarres', () => {
    const back = parseBackup(JSON.stringify({ app: 'petshelf', version: 1, items: [{ id: 'a', have: 'oui', dupes: -4, condition: 'nickel' }, { id: 'a' }, { nope: 1 }, { id: 'b', dupes: 3.6, note: '   ' }] }));
    expect(back.items).toHaveLength(2);
    expect(back.items[0]).toMatchObject({ id: 'a', have: false, dupes: 0, condition: undefined });
    expect(back.items[1]).toMatchObject({ id: 'b', dupes: 4, note: undefined });
    expect(back.skipped).toBe(2);
  });

  it('fusionne : la modification la plus récente gagne', () => {
    const merged = mergeItems([item('a', { have: true, updatedAt: 50 }), item('b', { have: true, updatedAt: 10, photo: true })], [item('a', { have: false, want: true, updatedAt: 40 }), item('b', { have: true, dupes: 1, updatedAt: 60 }), item('c', { want: true })]);
    const byId = Object.fromEntries(merged.map((i) => [i.id, i]));
    expect(byId.a.have).toBe(true);
    expect(byId.b).toMatchObject({ dupes: 1, photo: true });
    expect(byId.c.want).toBe(true);
  });

  it('les réglages incomplets ou faux reprennent les valeurs par défaut', () => {
    expect(normalizeSettings({ themeId: 'pomme', thumb: 'xl', volume: 3, sort: 'year' })).toEqual({ ...DEFAULT_SETTINGS, themeId: 'pomme', sort: 'year' });
    expect(backupFileName(new Date('2026-10-06T10:00:00Z'))).toBe('petshelf-sauvegarde-2026-10-06.json');
  });
});

describe('stockage sur le téléphone (IndexedDB)', () => {
  it('enregistre, relit, remplace et efface', async () => {
    const db = openStore('test-' + Math.random());
    await db.putItem(item('a', { have: true }));
    await db.putItems([item('b', { want: true }), item('c', { dupes: 1 })]);
    expect((await db.allItems()).map((i) => i.id).sort()).toEqual(['a', 'b', 'c']);
    await db.deleteItem('b');
    expect((await db.allItems()).map((i) => i.id).sort()).toEqual(['a', 'c']);
    await db.replaceItems([item('z', { have: true })]);
    expect((await db.allItems()).map((i) => i.id)).toEqual(['z']);
    await db.putSettings({ ...DEFAULT_SETTINGS, themeId: 'ciel' });
    expect((await db.getSettings())?.themeId).toBe('ciel');
    await db.putPhoto('z', new Blob(['jpeg'], { type: 'image/jpeg' }));
    expect(await db.photoIds()).toEqual(['z']);
    expect(await db.getPhoto('z')).toBeDefined();
    await db.clearAll();
    expect(await db.allItems()).toEqual([]);
    expect(await db.photoIds()).toEqual([]);
  });
});
