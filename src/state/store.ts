import { configureSound, sfx } from '../audio/sounds';
import { makeBackup, mergeItems, parseBackup } from '../core/backup';
import type { Catalog } from '../core/catalog';
import { loadCatalog } from '../core/catalog';
import type { Filters } from '../core/filters';
import { DEFAULT_FILTERS, indexCatalogOrder } from '../core/filters';
import type { Settings } from '../core/settings';
import { DEFAULT_SETTINGS, normalizeSettings } from '../core/settings';
import { milestoneReached, seriesCompletedBy, seriesIndex, seriesOf } from '../core/stats';
import type { Item, Pet } from '../core/types';
import { emptyItem, isEmptyItem } from '../core/types';
import { openStore } from '../storage/db';
import { createStore } from './createStore';

export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'info' | 'error';
}

export interface Celebration {
  id: number;
  title: string;
  text: string;
  emoji: string;
}

export interface AppState {
  ready: boolean;
  error: string | null;
  catalog: Catalog | null;
  series: Map<string, Pet[]>;
  /** Pour chaque figurine, ses séries (calculé une fois). */
  seriesIdx: Map<string, string[]>;
  /** Change quand je corrige un moule à la main (le classement par moule est alors recalculé). */
  moldVersion: number;
  items: Map<string, Item>;
  settings: Settings;
  filters: Filters;
  /** Mode « cochage rapide » : un appui sur une vignette coche / décoche directement. */
  quick: boolean;
  toasts: Toast[];
  /** Petite pluie de confettis (nouvelle figurine). */
  burst: number;
  celebration: Celebration | null;
  /** Adresses locales (blob:) de mes photos. */
  photoUrls: Map<string, string>;
}

export const store = createStore<AppState>({
  ready: false,
  error: null,
  catalog: null,
  series: new Map(),
  seriesIdx: new Map(),
  moldVersion: 0,
  items: new Map(),
  settings: DEFAULT_SETTINGS,
  filters: DEFAULT_FILTERS,
  quick: false,
  toasts: [],
  burst: 0,
  celebration: null,
  photoUrls: new Map(),
});

export const db = openStore();
let toastId = 0;

export function toast(text: string, kind: Toast['kind'] = 'info') {
  const id = ++toastId;
  store.set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, kind }] }));
  setTimeout(() => store.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2800);
}

export async function initApp() {
  try {
    const [catalog, items, rawSettings, photoIds] = await Promise.all([loadCatalog(), db.allItems(), db.getSettings(), db.photoIds()]);
    const settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...(rawSettings ?? {}) });
    configureSound({ enabled: settings.sound, volume: settings.volume });
    indexCatalogOrder(catalog.pets);
    const series = seriesOf(catalog.pets);
    store.set({
      ready: true,
      catalog,
      series,
      seriesIdx: seriesIndex(series),
      items: new Map(items.map((i) => [i.id, i])),
      settings,
      filters: DEFAULT_FILTERS,
    });
    void loadPhotoUrls(photoIds);
  } catch (e) {
    store.set({ ready: true, error: e instanceof Error ? e.message : String(e) });
  }
}

async function loadPhotoUrls(ids: string[]) {
  const map = new Map(store.get().photoUrls);
  for (const id of ids) {
    const blob = await db.getPhoto(id);
    if (blob) map.set(id, URL.createObjectURL(blob));
  }
  store.set({ photoUrls: map });
}

// ---------- Réglages ----------
export function updateSettings(patch: Partial<Settings>) {
  const settings = { ...store.get().settings, ...patch };
  configureSound({ enabled: settings.sound, volume: settings.volume });
  store.set({ settings });
  void db.putSettings(settings);
}

export const setFilters = (patch: Partial<Filters>) => store.set((s) => ({ filters: { ...s.filters, ...patch } }));
export const resetFilters = () => store.set((s) => ({ filters: { ...DEFAULT_FILTERS, q: s.filters.q } }));

// ---------- Ma collection ----------
/**
 * Écritures groupées : l'écran se met à jour tout de suite, la base IndexedDB est écrite juste après,
 * en une seule transaction (cocher 20 figurines d'affilée = 1 écriture, sans bloquer l'interface).
 */
const pending = new Map<string, Item | null>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
export async function flushWrites() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  if (!pending.size) return;
  const batch = [...pending];
  pending.clear();
  const puts = batch.filter(([, v]) => v).map(([, v]) => v!);
  const dels = batch.filter(([, v]) => !v).map(([id]) => id);
  try {
    if (puts.length) await db.putItems(puts);
    for (const id of dels) await db.deleteItem(id);
  } catch {
    toast('Enregistrement impossible sur ce téléphone.', 'error');
  }
}
if (typeof document !== 'undefined') {
  // Rien ne se perd si l'app passe en arrière-plan ou se ferme.
  document.addEventListener('visibilitychange', () => document.hidden && void flushWrites());
  window.addEventListener('pagehide', () => void flushWrites());
}

function save(next: Item) {
  const items = new Map(store.get().items);
  const stamped = { ...next, updatedAt: Date.now() };
  if (isEmptyItem(stamped)) {
    items.delete(next.id);
    pending.set(next.id, null);
  } else {
    items.set(next.id, stamped);
    pending.set(next.id, stamped);
  }
  store.set({ items });
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushWrites(), 250);
  return items;
}

export const itemOf = (id: string) => store.get().items.get(id) ?? emptyItem(id);

export function updateItem(id: string, patch: Partial<Item>) {
  save({ ...itemOf(id), ...patch });
}

function celebrate(c: Omit<Celebration, 'id'>) {
  sfx.victory();
  store.set({ celebration: { ...c, id: Date.now() } });
}

/** Coche ou décoche « Je l'ai ». Un appui, aucune attente. */
export function toggleHave(id: string) {
  const s = store.get();
  const cur = itemOf(id);
  const have = !cur.have;
  const before = countHave(s.items);
  // Quand je l'ai enfin, elle sort de ma liste de recherche.
  const items = save({ ...cur, have, want: have ? false : cur.want, addedAt: have ? Date.now() : cur.addedAt });
  if (!have) {
    sfx.uncheck();
    return;
  }
  sfx.check();
  if (s.settings.celebrate) store.set((st) => ({ burst: st.burst + 1 }));
  const after = before + 1;
  const done = seriesCompletedBy(id, s.series, items, s.seriesIdx);
  const milestone = milestoneReached(before, after);
  if (done.length) {
    celebrate({ emoji: '🏆', title: 'Série complète !', text: done.slice(0, 2).join(' • ') });
  } else if (milestone) {
    celebrate({ emoji: milestone === 1 ? '🐾' : '🎉', title: milestone === 1 ? 'Première figurine !' : `${milestone} figurines !`, text: milestone === 1 ? 'Ta collection commence ici.' : 'Ta collection grandit, bravo !' });
  }
}

const countHave = (items: Map<string, Item>) => {
  let n = 0;
  for (const it of items.values()) if (it.have) n++;
  return n;
};

export function toggleWant(id: string) {
  const cur = itemOf(id);
  const want = !cur.want;
  save({ ...cur, want });
  if (want) sfx.wish();
  else sfx.back();
}

export function setDupes(id: string, dupes: number) {
  sfx.squeak();
  updateItem(id, { dupes: Math.max(0, Math.min(99, dupes)) });
}

export const dismissCelebration = () => store.set({ celebration: null });

/** Corrige le moule d'une figurine à la main (undefined = revenir au moule du catalogue). */
export function setMoldOverride(id: string, mold: string | undefined) {
  const pet = store.get().catalog?.byId.get(id);
  updateItem(id, { mold: mold && mold !== pet?.mold ? mold : undefined });
  store.set((s) => ({ moldVersion: s.moldVersion + 1 }));
  sfx.select();
  toast('Moule enregistré', 'ok');
}

/** Replie ou déplie une section de moule dans la galerie. */
export function toggleCollapsed(mold: string) {
  const cur = store.get().settings.collapsed;
  updateSettings({ collapsed: cur.includes(mold) ? cur.filter((m) => m !== mold) : [...cur, mold] });
}

// ---------- Mes photos ----------
/** Réduit la photo (900 px max, JPEG) pour qu'elle prenne peu de place sur le téléphone. */
async function shrink(file: Blob, max = 900): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Photo illisible'))), 'image/jpeg', 0.85));
}

export async function setPhoto(id: string, file: File) {
  try {
    const blob = await shrink(file);
    await db.putPhoto(id, blob);
    const photoUrls = new Map(store.get().photoUrls);
    const old = photoUrls.get(id);
    if (old) URL.revokeObjectURL(old);
    photoUrls.set(id, URL.createObjectURL(blob));
    store.set({ photoUrls });
    updateItem(id, { photo: true });
    sfx.sparkle();
    toast('Photo ajoutée 📸', 'ok');
  } catch {
    toast('Impossible de lire cette photo.', 'error');
  }
}

export async function removePhoto(id: string) {
  await db.deletePhoto(id);
  const photoUrls = new Map(store.get().photoUrls);
  const old = photoUrls.get(id);
  if (old) URL.revokeObjectURL(old);
  photoUrls.delete(id);
  store.set({ photoUrls });
  updateItem(id, { photo: undefined });
  toast('Photo retirée', 'info');
}

// ---------- Sauvegarde ----------
const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });

async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

export async function exportBackup(withPhotos: boolean): Promise<string> {
  await flushWrites();
  const s = store.get();
  let photos: Record<string, string> | undefined;
  if (withPhotos) {
    photos = {};
    for (const id of await db.photoIds()) {
      const b = await db.getPhoto(id);
      if (b) photos[id] = await blobToDataUrl(b);
    }
  }
  return JSON.stringify(makeBackup([...s.items.values()], s.settings, photos));
}

export async function importBackup(text: string, mode: 'merge' | 'replace') {
  await flushWrites();
  const parsed = parseBackup(text);
  const current = [...store.get().items.values()];
  const next = mode === 'replace' ? parsed.items : mergeItems(current, parsed.items);
  await db.replaceItems(next);
  for (const [id, url] of Object.entries(parsed.photos)) await db.putPhoto(id, await dataUrlToBlob(url));
  if (mode === 'replace') {
    // Les photos de figurines absentes de la sauvegarde n'ont plus de raison d'être.
    const keep = new Set(next.filter((i) => i.photo).map((i) => i.id));
    for (const id of await db.photoIds()) if (!keep.has(id)) await db.deletePhoto(id);
  }
  store.set((s) => ({ items: new Map(next.map((i) => [i.id, i])), moldVersion: s.moldVersion + 1 }));
  if (parsed.settings) updateSettings({ ...parsed.settings, onboarded: true });
  for (const u of store.get().photoUrls.values()) URL.revokeObjectURL(u);
  store.set({ photoUrls: new Map() });
  await loadPhotoUrls(await db.photoIds());
  return parsed;
}

export async function resetAll() {
  pending.clear();
  await db.clearAll();
  for (const u of store.get().photoUrls.values()) URL.revokeObjectURL(u);
  store.set({ items: new Map(), photoUrls: new Map(), settings: DEFAULT_SETTINGS, filters: DEFAULT_FILTERS });
  configureSound({ enabled: DEFAULT_SETTINGS.sound, volume: DEFAULT_SETTINGS.volume });
}

