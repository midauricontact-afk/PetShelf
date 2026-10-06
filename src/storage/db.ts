import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Settings } from '../core/settings';
import type { Item } from '../core/types';

/** Tout reste sur le téléphone, dans la base IndexedDB du navigateur. */
interface ShelfDB extends DBSchema {
  items: { key: string; value: Item };
  photos: { key: string; value: { id: string; blob: Blob } };
  meta: { key: string; value: unknown };
}

export interface Store {
  allItems(): Promise<Item[]>;
  putItem(it: Item): Promise<void>;
  putItems(list: Item[]): Promise<void>;
  deleteItem(id: string): Promise<void>;
  replaceItems(list: Item[]): Promise<void>;
  getPhoto(id: string): Promise<Blob | undefined>;
  putPhoto(id: string, blob: Blob): Promise<void>;
  deletePhoto(id: string): Promise<void>;
  photoIds(): Promise<string[]>;
  getSettings(): Promise<Partial<Settings> | undefined>;
  putSettings(s: Settings): Promise<void>;
  clearAll(): Promise<void>;
}

export function openStore(name = 'petshelf'): Store {
  let dbp: Promise<IDBPDatabase<ShelfDB>> | null = null;
  const db = () =>
    (dbp ??= openDB<ShelfDB>(name, 1, {
      upgrade(d) {
        d.createObjectStore('items', { keyPath: 'id' });
        d.createObjectStore('photos', { keyPath: 'id' });
        d.createObjectStore('meta');
      },
    }));
  return {
    allItems: async () => (await db()).getAll('items'),
    putItem: async (it) => void (await (await db()).put('items', it)),
    async putItems(list) {
      const tx = (await db()).transaction('items', 'readwrite');
      await Promise.all([...list.map((i) => tx.store.put(i)), tx.done]);
    },
    deleteItem: async (id) => (await db()).delete('items', id),
    async replaceItems(list) {
      const tx = (await db()).transaction('items', 'readwrite');
      await tx.store.clear();
      await Promise.all([...list.map((i) => tx.store.put(i)), tx.done]);
    },
    getPhoto: async (id) => (await (await db()).get('photos', id))?.blob,
    putPhoto: async (id, blob) => void (await (await db()).put('photos', { id, blob })),
    deletePhoto: async (id) => (await db()).delete('photos', id),
    photoIds: async () => (await (await db()).getAllKeys('photos')) as string[],
    getSettings: async () => (await (await db()).get('meta', 'settings')) as Partial<Settings> | undefined,
    putSettings: async (s) => void (await (await db()).put('meta', s, 'settings')),
    async clearAll() {
      const d = await db();
      await Promise.all([d.clear('items'), d.clear('photos'), d.clear('meta')]);
    },
  };
}
