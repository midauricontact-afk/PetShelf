import type { Settings } from './settings';
import { normalizeSettings } from './settings';
import type { Accessories, Condition, Item } from './types';
import { ACCESSORIES, CONDITIONS, isEmptyItem } from './types';

export const BACKUP_APP = 'petshelf';
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  items: Item[];
  settings: Settings;
  /** Mes photos, en texte (data URL JPEG), si je choisis de les inclure. */
  photos?: Record<string, string>;
}

export function makeBackup(items: Item[], settings: Settings, photos?: Record<string, string>, now = new Date()): Backup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    items: items.filter((i) => !isEmptyItem(i)),
    settings,
    ...(photos && Object.keys(photos).length ? { photos } : {}),
  };
}

const COND_IDS = new Set<string>(CONDITIONS.map((c) => c.id));
const ACC_IDS = new Set<string>(ACCESSORIES.map((a) => a.id));

function normalizeItem(raw: unknown): Item | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id || r.id.length > 80) return null;
  const dupes = typeof r.dupes === 'number' && Number.isFinite(r.dupes) ? Math.max(0, Math.min(99, Math.round(r.dupes))) : 0;
  return {
    id: r.id,
    have: r.have === true,
    want: r.want === true,
    dupes,
    condition: typeof r.condition === 'string' && COND_IDS.has(r.condition) ? (r.condition as Condition) : undefined,
    acc: typeof r.acc === 'string' && ACC_IDS.has(r.acc) ? (r.acc as Accessories) : undefined,
    note: typeof r.note === 'string' && r.note.trim() ? r.note.slice(0, 2000) : undefined,
    photo: r.photo === true || undefined,
    mold: typeof r.mold === 'string' && /^[a-z0-9-]{1,60}$/.test(r.mold) ? r.mold : undefined,
    addedAt: typeof r.addedAt === 'number' ? r.addedAt : undefined,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : Date.now(),
  };
}

export interface ParsedBackup {
  items: Item[];
  settings: Settings | null;
  photos: Record<string, string>;
  skipped: number;
}

/** Lit une sauvegarde. Lève une erreur claire (en français) si le fichier n'en est pas une. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Ce fichier n’est pas une sauvegarde PetShelf lisible.');
  }
  const d = data as Partial<Backup>;
  if (!d || typeof d !== 'object' || d.app !== BACKUP_APP || !Array.isArray(d.items)) throw new Error('Ce fichier n’est pas une sauvegarde PetShelf.');
  if (typeof d.version === 'number' && d.version > BACKUP_VERSION) throw new Error('Cette sauvegarde vient d’une version plus récente de l’app.');
  const items: Item[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const raw of d.items) {
    const it = normalizeItem(raw);
    if (!it || seen.has(it.id)) {
      skipped++;
      continue;
    }
    seen.add(it.id);
    items.push(it);
  }
  const photos: Record<string, string> = {};
  if (d.photos && typeof d.photos === 'object') {
    for (const [id, url] of Object.entries(d.photos)) if (typeof url === 'string' && url.startsWith('data:image/') && seen.has(id)) photos[id] = url;
  }
  // Une photo annoncée mais absente du fichier n'est plus « à moi ».
  for (const it of items) if (it.photo && !photos[it.id]) it.photo = undefined;
  return { items, settings: d.settings ? normalizeSettings(d.settings) : null, photos, skipped };
}

/** Fusion : pour chaque figurine, la version modifiée le plus récemment gagne. */
export function mergeItems(current: Item[], incoming: Item[]): Item[] {
  const map = new Map(current.map((i) => [i.id, i]));
  for (const it of incoming) {
    const cur = map.get(it.id);
    if (!cur || it.updatedAt >= cur.updatedAt) map.set(it.id, cur?.photo && !it.photo ? { ...it, photo: true } : it);
  }
  return [...map.values()];
}

export const backupFileName = (now = new Date()) => `petshelf-sauvegarde-${now.toISOString().slice(0, 10)}.json`;
