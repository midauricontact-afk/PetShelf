import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { memo, useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../../audio/sounds';
import { fold } from '../../core/catalog';
import { moldProgress, progressOf, type MoldProgress } from '../../core/stats';
import { setFilters, store } from '../../state/store';
import { PetImage } from '../components/PetImage';
import { Segmented } from '../components/primitives';
import { useUI } from '../ctx';
import { IconClose, IconSearch } from '../icons';

type Order = 'name' | 'progress' | 'size';
const ROW_H = 84;

/** Tous les moules (G2 et G7 réunis) avec leur progression. Un appui ouvre la collection filtrée sur ce moule. */
export const MoldsScreen = memo(function MoldsScreen() {
  const catalog = store.useSel((s) => s.catalog);
  const items = store.useSel((s) => s.items);
  const photoUrls = store.useSel((s) => s.photoUrls);
  const ui = useUI();
  const [q, setQ] = useState('');
  const [order, setOrder] = useState<Order>('name');
  const query = useDeferredValue(fold(q));

  const all = useMemo(() => (catalog ? moldProgress(catalog.pets, items, catalog.molds) : []), [catalog, items]);
  const list = useMemo(() => {
    const l = query ? all.filter((m) => fold(`${m.name} ${catalog?.molds.get(m.mold)?.en ?? ''}`).includes(query)) : [...all];
    if (order === 'progress') l.sort((a, b) => b.pct - a.pct || b.have - a.have);
    if (order === 'size') l.sort((a, b) => b.total - a.total);
    return l;
  }, [all, query, order, catalog]);
  const complete = all.filter((m) => m.have === m.total).length;
  const started = all.filter((m) => m.have > 0).length;
  const guesses = all.reduce((n, m) => n + m.guesses, 0);

  const open = (m: MoldProgress) => {
    sfx.open();
    setFilters({ mold: m.mold, q: '', gen: 'all', status: 'all', fam: null, species: null, year: null, line: null });
    ui.goTab('collection');
  };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">Moules</p>
          <h1>
            {all.length} <span className="muted">formes</span>
          </h1>
        </div>
        <div className="head-pct small-pct">{complete} complets</div>
      </header>
      <p className="muted small">
        Les figurines rangées par forme, comme chez les collectionneurs. G2 et G7 sont réunies quand elles partagent le même moule. {started} moule{started > 1 ? 's' : ''} commencé{started > 1 ? 's' : ''}
        {guesses ? ` · ${guesses} figurines à vérifier (point orange)` : ''}.
      </p>

      <label className="search">
        <IconSearch width={18} height={18} />
        <input type="search" placeholder="Colley, chat, teckel…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && (
          <button className="icon-btn small" onClick={() => setQ('')} aria-label="Effacer">
            <IconClose width={16} height={16} />
          </button>
        )}
      </label>
      <Segmented
        value={order}
        options={[
          { id: 'name', label: 'A → Z' },
          { id: 'progress', label: 'Progression' },
          { id: 'size', label: 'Les plus grands' },
        ]}
        onChange={setOrder}
      />

      <MoldList list={list} photoUrls={photoUrls} onOpen={open} />
      {!list.length && <p className="empty muted">Aucun moule ne correspond.</p>}
    </div>
  );
});

function MoldList({ list, photoUrls, onOpen }: { list: MoldProgress[]; photoUrls: Map<string, string>; onOpen: (m: MoldProgress) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [margin, setMargin] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = Math.round(ref.current.getBoundingClientRect().top + window.scrollY);
    if (Math.abs(m - margin) > 1) setMargin(m);
  });
  const v = useWindowVirtualizer({ count: list.length, estimateSize: () => ROW_H, overscan: 6, scrollMargin: margin });
  return (
    <div ref={ref} className="mold-list" style={{ height: v.getTotalSize() }}>
      {v.getVirtualItems().map((r) => {
        const m = list[r.index];
        const p = progressOf(m.have, m.total);
        return (
          <div key={m.mold} className="vrow" style={{ height: ROW_H, transform: `translateY(${r.start - margin}px)` }}>
            <button className={`mold-row${p.pct === 100 ? ' done' : ''}`} onClick={() => onOpen(m)}>
              <span className="mold-cover">
                <PetImage pet={m.cover} photoUrl={photoUrls.get(m.cover.id)} />
              </span>
              <span className="mold-text">
                <strong>
                  {m.name}
                  {m.guesses > 0 && <span className="guess-dot inline" title={`${m.guesses} à vérifier`} />}
                </strong>
                <span className="mold-sub">
                  {m.have} / {m.total}
                  {m.gens.map((g) => (
                    <span key={g} className={`gen-pill tiny ${g.toLowerCase()}`}>
                      {g}
                    </span>
                  ))}
                  {p.pct === 100 && ' 🏆'}
                </span>
                <span className="mold-bar">
                  <span style={{ width: `${p.pct}%` }} />
                </span>
              </span>
              <span className="mold-pct">{p.pct} %</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
