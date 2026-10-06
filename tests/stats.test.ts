import { describe, expect, it } from 'vitest';
import { petOfTheDay, tradeListText } from '../src/core/extras';
import { almostComplete, completedSeries, milestoneReached, progress, progressBy, progressOf, seriesCompletedBy, seriesOf, totals } from '../src/core/stats';
import { item, items, PETS } from './fixtures';

describe('progression', () => {
  it('compte et arrondit sans jamais annoncer 100 % trop tôt', () => {
    expect(progressOf(0, 0).pct).toBe(0);
    expect(progressOf(1, 3).pct).toBe(33);
    expect(progressOf(999, 1000).pct).toBe(99);
    expect(progressOf(5, 5).pct).toBe(100);
  });

  it('global et par génération', () => {
    const mine = items(item('g2-1', { have: true }), item('g7-1', { have: true }), item('g7-2', { want: true }));
    expect(progress(PETS, mine)).toEqual({ have: 2, total: 9, pct: 22 });
    const byGen = progressBy(PETS, mine, (p) => p.gen);
    expect(byGen.find((g) => g.key === 'G7')).toMatchObject({ have: 1, total: 2, pct: 50 });
    expect(byGen.find((g) => g.key === 'G2')).toMatchObject({ have: 1, total: 7 });
  });

  it('par espèce, année et gamme (une figurine peut compter dans plusieurs gammes)', () => {
    const mine = items(item('g2-2', { have: true }));
    expect(progressBy(PETS, mine, (p) => p.species).find((g) => g.key === 'Chat persan')).toMatchObject({ have: 1, total: 2, pct: 50 });
    expect(progressBy(PETS, mine, (p) => (p.year ? String(p.year) : undefined)).find((g) => g.key === '2006')).toMatchObject({ have: 1, total: 2 });
    expect(progressBy(PETS, mine, (p) => p.sets.map((s) => s.label.split(' – ')[0])).find((g) => g.key === 'Singles')).toMatchObject({ have: 0, total: 2 });
  });

  it('les totaux : wishlist, doubles, en boîte', () => {
    const t = totals(items(item('a', { have: true, condition: 'boite', dupes: 2 }), item('b', { want: true }), item('c', { dupes: 1 })));
    expect(t).toEqual({ have: 1, want: 1, dupes: 2, dupesCount: 3, boxed: 1 });
  });
});

describe('séries', () => {
  const series = seriesOf(PETS);

  it('regroupe les figurines vendues ensemble (2 minimum)', () => {
    expect([...series.keys()].sort()).toEqual(['G2 · Pet Pairs – Duo', 'G2 · Singles', 'G7 · Pet Surprise – Wave 1']);
  });

  it('détecte la série que je viens de compléter', () => {
    const mine = items(item('g2-2', { have: true }), item('g2-3', { have: true }));
    expect(seriesCompletedBy('g2-3', series, mine)).toEqual(['G2 · Pet Pairs – Duo']);
    expect(seriesCompletedBy('g2-1', series, mine)).toEqual([]);
    expect(completedSeries(series, mine)).toEqual(['G2 · Pet Pairs – Duo']);
  });

  it('propose les séries presque complètes', () => {
    const mine = items(item('g2-1', { have: true }), item('g7-1', { have: true }));
    const a = almostComplete(series, mine);
    expect(a.map((x) => x.key).sort()).toEqual(['G2 · Singles', 'G7 · Pet Surprise – Wave 1']);
    expect(a[0].missing).toHaveLength(1);
  });

  it('les paliers de badges', () => {
    expect(milestoneReached(0, 1)).toBe(1);
    expect(milestoneReached(9, 10)).toBe(10);
    expect(milestoneReached(10, 11)).toBeNull();
  });
});

describe('petits plus', () => {
  it('liste d’échange lisible', () => {
    const text = tradeListText(PETS, items(item('g7-1', { have: true, dupes: 2 }), item('g2-10', { want: true })));
    expect(text).toContain('À échanger (1)');
    expect(text).toContain('G7 #1 Panda ×2');
    expect(text).toContain('Je cherche (1)');
    expect(text).toContain('G2 #10 Sunny');
  });

  it('figurine du jour : stable dans la journée, jamais une que j’ai déjà', () => {
    const withImg = PETS.map((p) => ({ ...p, img: 'https://x/' + p.id }));
    const mine = items(...withImg.slice(0, 8).map((p) => item(p.id, { have: true })));
    const d = new Date(2026, 9, 6, 9);
    expect(petOfTheDay(withImg, mine, d)?.id).toBe('g7-2');
    const free = items();
    expect(petOfTheDay(withImg, free, d)?.id).toBe(petOfTheDay(withImg, free, new Date(2026, 9, 6, 22))?.id);
  });
});
