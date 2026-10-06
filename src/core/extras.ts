import { petNumber, petTitle } from './catalog';
import type { Item, Pet } from './types';

/** Texte prêt à envoyer pour un échange : mes doubles et ma liste de recherche. */
export function tradeListText(pets: Pet[], items: Map<string, Item>): string {
  const line = (p: Pet, extra = '') => `• ${p.gen} ${petNumber(p)} ${petTitle(p)}${extra}`;
  const dupes = pets.filter((p) => (items.get(p.id)?.dupes ?? 0) > 0);
  const wants = pets.filter((p) => items.get(p.id)?.want && !items.get(p.id)?.have);
  const parts = ['Ma liste d’échange Littlest Pet Shop 🐾'];
  parts.push('', `À échanger (${dupes.length}) :`, ...(dupes.length ? dupes.map((p) => line(p, items.get(p.id)!.dupes > 1 ? ` ×${items.get(p.id)!.dupes}` : '')) : ['(aucun double pour l’instant)']));
  parts.push('', `Je cherche (${wants.length}) :`, ...(wants.length ? wants.map((p) => line(p)) : ['(rien pour l’instant)']));
  return parts.join('\n');
}

/** Graine stable pour une date (AAAA-MM-JJ) : la même « figurine du jour » toute la journée. */
export function daySeed(date: Date): number {
  const s = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Figurine du jour : une figurine que je n'ai pas encore (avec photo de préférence). */
export function petOfTheDay(pets: Pet[], items: Map<string, Item>, date = new Date()): Pet | null {
  const pool = pets.filter((p) => p.img && !items.get(p.id)?.have);
  const list = pool.length ? pool : pets;
  return list.length ? list[daySeed(date) % list.length] : null;
}
