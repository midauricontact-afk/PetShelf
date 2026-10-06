import type { SortId } from './filters';
import { SORTS } from './filters';

export type Mode = 'auto' | 'light' | 'dark';
export type ThumbSize = 's' | 'm' | 'l';

export interface Settings {
  themeId: string;
  mode: Mode;
  /** Couleur d'accent personnalisée (sinon celle du thème). */
  accent: string | null;
  thumb: ThumbSize;
  sort: SortId;
  sound: boolean;
  volume: number;
  /** Afficher le nom sous chaque vignette. */
  showNames: boolean;
  /** Animation de confettis à chaque nouvelle figurine. */
  celebrate: boolean;
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  themeId: 'bonbon',
  mode: 'auto',
  accent: null,
  thumb: 'm',
  sort: 'num',
  sound: true,
  volume: 0.6,
  showNames: true,
  celebrate: true,
  onboarded: false,
};

/** Accepte des réglages partiels ou anciens (sauvegarde importée…) et complète avec les valeurs par défaut. */
export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  const pick = <T,>(v: unknown, ok: (x: unknown) => boolean, def: T): T => (ok(v) ? (v as T) : def);
  return {
    themeId: pick(r.themeId, (v) => typeof v === 'string' && v.length < 40, d.themeId),
    mode: pick(r.mode, (v) => v === 'auto' || v === 'light' || v === 'dark', d.mode),
    accent: pick(r.accent, (v) => v === null || (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)), d.accent),
    thumb: pick(r.thumb, (v) => v === 's' || v === 'm' || v === 'l', d.thumb),
    sort: pick(r.sort, (v) => SORTS.some((s) => s.id === v), d.sort),
    sound: pick(r.sound, (v) => typeof v === 'boolean', d.sound),
    volume: pick(r.volume, (v) => typeof v === 'number' && v >= 0 && v <= 1, d.volume),
    showNames: pick(r.showNames, (v) => typeof v === 'boolean', d.showNames),
    celebrate: pick(r.celebrate, (v) => typeof v === 'boolean', d.celebrate),
    onboarded: pick(r.onboarded, (v) => typeof v === 'boolean', d.onboarded),
  };
}
