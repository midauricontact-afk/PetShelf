import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { completedSeries, MILESTONES, progress, progressBy, totals, type GroupProgress } from '../../core/stats';
import { FAMILIES } from '../../core/types';
import { setFilters, store } from '../../state/store';
import { Bar, Ring } from '../components/Ring';
import { Segmented } from '../components/primitives';
import { useUI } from '../ctx';

type By = 'family' | 'mold' | 'year' | 'species' | 'line';

export function ProgressScreen() {
  const s = store.use();
  const ui = useUI();
  const pets = s.catalog?.pets ?? [];
  const [by, setBy] = useState<By>('family');
  const [all, setAll] = useState(false);

  const data = useMemo(() => {
    const global = progress(pets, s.items);
    const g2 = progress(pets.filter((p) => p.gen === 'G2'), s.items);
    const g7 = progress(pets.filter((p) => p.gen === 'G7'), s.items);
    const t = totals(s.items);
    const done = completedSeries(s.series, s.items);
    return { global, g2, g7, t, done };
  }, [pets, s.items, s.series]);

  const groups = useMemo(() => {
    let list: (GroupProgress & { label: string; onTap?: () => void })[];
    if (by === 'family')
      list = progressBy(pets, s.items, (p) => p.fam).map((g) => {
        const f = FAMILIES.find((x) => x.id === g.key);
        return { ...g, label: `${f?.emoji ?? ''} ${f?.label ?? g.key}`, onTap: () => openFiltered({ fam: f?.id ?? null }) };
      });
    else if (by === 'mold')
      list = progressBy(pets, s.items, (p) => s.items.get(p.id)?.mold ?? p.mold)
        .sort((a, b) => b.have - a.have || b.total - a.total)
        .map((g) => ({ ...g, label: `🧩 ${s.catalog?.molds.get(g.key)?.fr ?? g.key}`, onTap: () => openFiltered({ mold: g.key }) }));
    else if (by === 'year')
      list = progressBy(pets, s.items, (p) => (p.year ? String(p.year) : undefined))
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((g) => ({ ...g, label: g.key, onTap: () => openFiltered({ year: Number(g.key) }) }));
    else if (by === 'species')
      list = progressBy(pets, s.items, (p) => p.species)
        .sort((a, b) => b.have - a.have || b.total - a.total)
        .map((g) => ({ ...g, label: g.key, onTap: () => openFiltered({ species: g.key }) }));
    else
      list = progressBy(pets, s.items, (p) => p.sets.map((x) => x.label.split(' – ')[0]))
        .sort((a, b) => b.have - a.have || b.total - a.total)
        .map((g) => ({ ...g, label: g.key, onTap: () => openFiltered({ line: g.key }) }));
    if (by === 'family') list.sort((a, b) => b.pct - a.pct || b.total - a.total);
    return list;
  }, [by, pets, s.items]);

  function openFiltered(patch: Parameters<typeof setFilters>[0]) {
    setFilters({ gen: 'all', status: 'all', fam: null, species: null, year: null, line: null, mold: null, q: '', ...patch });
    ui.goTab('collection');
  }

  const nextMilestone = MILESTONES.find((m) => m > data.t.have);
  const reached = MILESTONES.filter((m) => m <= data.t.have);
  const shown = all ? groups : groups.slice(0, 10);

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">Progrès</p>
          <h1>Ma collection</h1>
        </div>
      </header>

      <section className="card hero-progress">
        <Ring pct={data.global.pct} size={150} stroke={14}>
          <strong className="ring-pct">{data.global.pct} %</strong>
          <span className="muted small">
            {data.global.have} / {data.global.total}
          </span>
        </Ring>
        <div className="gen-rings">
          {(['G2', 'G7'] as const).map((g) => {
            const p = g === 'G2' ? data.g2 : data.g7;
            return (
              <button key={g} className="gen-ring" onClick={() => openFiltered({ gen: g })}>
                <Ring pct={p.pct} size={76} stroke={9} color={g === 'G2' ? 'var(--g2)' : 'var(--g7)'}>
                  <strong>{p.pct} %</strong>
                </Ring>
                <span>
                  <strong>{g}</strong> {p.have}/{p.total}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="stat-grid">
        <Stat emoji="💖" value={data.t.want} label="je cherche" onTap={() => ui.goTab('lists')} />
        <Stat emoji="🔁" value={data.t.dupesCount} label="doubles" onTap={() => openFiltered({ status: 'dupes' })} />
        <Stat emoji="📦" value={data.t.boxed} label="en boîte" />
        <Stat emoji="🏆" value={data.done.length} label="séries complètes" />
      </div>

      <section className="card">
        <h3>Badges</h3>
        <div className="badges">
          {MILESTONES.slice(0, 10).map((m) => (
            <motion.div key={m} className={`milestone${data.t.have >= m ? ' on' : ''}`} whileTap={{ scale: 0.9, rotate: -6 }}>
              <span>{data.t.have >= m ? '🏅' : '🔒'}</span>
              <small>{m}</small>
            </motion.div>
          ))}
        </div>
        <p className="muted small">
          {reached.length} badge{reached.length > 1 ? 's' : ''} gagné{reached.length > 1 ? 's' : ''}
          {nextMilestone ? ` · prochain à ${nextMilestone} figurines (encore ${nextMilestone - data.t.have})` : ' · tous gagnés, incroyable !'}
        </p>
      </section>

      <section className="card">
        <h3>Par catégorie</h3>
        <Segmented
          value={by}
          options={[
            { id: 'family', label: 'Famille' },
            { id: 'mold', label: 'Moule' },
            { id: 'year', label: 'Année' },
            { id: 'species', label: 'Espèce' },
            { id: 'line', label: 'Gamme' },
          ]}
          onChange={(v) => {
            setBy(v);
            setAll(false);
          }}
        />
        <ul className="group-list">
          {shown.map((g) => (
            <li key={g.key}>
              <button onClick={g.onTap}>
                <div className="row-between">
                  <span>{g.label}</span>
                  <span className="muted small">
                    {g.have}/{g.total} · {g.pct} %
                  </span>
                </div>
                <Bar pct={g.pct} />
              </button>
            </li>
          ))}
        </ul>
        {groups.length > 10 && (
          <button className="link" onClick={() => setAll(!all)}>
            {all ? 'Voir moins' : `Voir tout (${groups.length})`}
          </button>
        )}
      </section>

      {data.done.length > 0 && (
        <section className="card">
          <h3>Séries complètes 🏆</h3>
          <ul className="done-list">
            {data.done.slice(0, 30).map((d) => (
              <li key={d}>✓ {d}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ emoji, value, label, onTap }: { emoji: string; value: number; label: string; onTap?: () => void }) {
  return (
    <motion.button className="stat card" whileTap={{ scale: 0.95 }} onClick={onTap} disabled={!onTap}>
      <span className="stat-emoji">{emoji}</span>
      <strong>{value}</strong>
      <span className="muted small">{label}</span>
    </motion.button>
  );
}
