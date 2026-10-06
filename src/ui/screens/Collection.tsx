import { AnimatePresence, motion } from 'framer-motion';
import { useDeferredValue, useMemo, useState } from 'react';
import { sfx } from '../../audio/sounds';
import { facets } from '../../core/catalog';
import { activeFilterCount, applyFilters, SORTS, STATUSES, type Filters } from '../../core/filters';
import { progress } from '../../core/stats';
import { FAMILIES } from '../../core/types';
import { resetFilters, setFilters, store, updateSettings } from '../../state/store';
import { Grid } from '../components/Grid';
import { Btn, Chip, Segmented } from '../components/primitives';
import { Bar } from '../components/Ring';
import { Sheet } from '../components/Sheet';
import { IconBolt, IconClose, IconFilter, IconSearch } from '../icons';

export function CollectionScreen() {
  const s = store.use();
  const { catalog, items, filters, settings, quick, photoUrls } = s;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = useDeferredValue(filters.q);
  const pets = catalog?.pets ?? [];

  const list = useMemo(() => applyFilters(pets, items, { ...filters, q }, settings.sort), [pets, items, filters, q, settings.sort]);
  const prog = useMemo(() => progress(filters.gen === 'all' ? pets : pets.filter((p) => p.gen === filters.gen), items), [pets, items, filters.gen]);
  const nFilters = activeFilterCount(filters);
  const resetKey = JSON.stringify([filters, q, settings.sort]);

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">Ma collection</p>
          <h1>
            {prog.have} <span className="muted">/ {prog.total}</span>
          </h1>
        </div>
        <div className="head-pct">{prog.pct} %</div>
      </header>
      <Bar pct={prog.pct} />

      <div className="search-row">
        <label className="search">
          <IconSearch width={18} height={18} />
          <input type="search" inputMode="search" placeholder="Numéro, nom, couleur…" value={filters.q} onChange={(e) => setFilters({ q: e.target.value })} enterKeyHint="search" />
          {filters.q && (
            <button className="icon-btn small" onClick={() => setFilters({ q: '' })} aria-label="Effacer la recherche">
              <IconClose width={16} height={16} />
            </button>
          )}
        </label>
        <motion.button className={`icon-btn square${nFilters ? ' active' : ''}`} whileTap={{ scale: 0.9 }} onClick={() => (sfx.open(), setFiltersOpen(true))} aria-label="Filtres">
          <IconFilter width={20} height={20} />
          {nFilters > 0 && <span className="count-dot">{nFilters}</span>}
        </motion.button>
        <motion.button
          className={`icon-btn square${quick ? ' active quick-on' : ''}`}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            sfx.toggle();
            store.set({ quick: !quick });
          }}
          aria-pressed={quick}
          aria-label="Cochage rapide"
        >
          <IconBolt width={20} height={20} />
        </motion.button>
      </div>

      <AnimatePresence>
        {quick && (
          <motion.div className="quick-banner" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            ⚡ <strong>Cochage rapide</strong> : touche une vignette pour la cocher ou la décocher.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chip-row scroll-x">
        {STATUSES.map((st) => (
          <Chip key={st.id} active={filters.status === st.id} onClick={() => setFilters({ status: st.id })}>
            {st.label}
          </Chip>
        ))}
      </div>
      <Segmented
        value={filters.gen}
        options={[
          { id: 'all', label: 'Toutes' },
          { id: 'G2', label: 'G2 (2004-12)' },
          { id: 'G7', label: 'G7 (2024+)' },
        ]}
        onChange={(gen) => setFilters({ gen })}
      />

      <p className="result-count">
        {list.length} figurine{list.length > 1 ? 's' : ''}
        {nFilters > 0 && (
          <button className="link" onClick={() => (sfx.back(), resetFilters())}>
            Effacer les filtres
          </button>
        )}
      </p>

      {list.length ? (
        <Grid pets={list} items={items} photoUrls={photoUrls} showNames={settings.showNames} quick={quick} size={settings.thumb} resetKey={resetKey} />
      ) : (
        <div className="empty">
          <div className="empty-emoji">🔍</div>
          <p>Aucune figurine ne correspond.</p>
          <p className="muted">Essaie un numéro seul (« 1234 ») ou retire un filtre.</p>
        </div>
      )}

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} />
    </div>
  );
}

function FiltersSheet({ open, onClose, filters }: { open: boolean; onClose: () => void; filters: Filters }) {
  const s = store.use();
  const pets = s.catalog?.pets ?? [];
  const scoped = useMemo(() => (filters.gen === 'all' ? pets : pets.filter((p) => p.gen === filters.gen)), [pets, filters.gen]);
  const f = useMemo(() => facets(scoped), [scoped]);
  const speciesList = useMemo(() => f.species.filter((sp) => !filters.fam || scoped.some((p) => p.species === sp.name && p.fam === filters.fam)), [f, filters.fam, scoped]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filtres et tri"
      tall
      footer={
        <div className="row-btns">
          <Btn variant="ghost" onClick={() => resetFilters()}>
            Tout effacer
          </Btn>
          <Btn onClick={onClose}>Voir les figurines</Btn>
        </div>
      }
    >
      <section className="field">
        <h3>Trier par</h3>
        <div className="chip-row wrap">
          {SORTS.map((so) => (
            <Chip key={so.id} active={s.settings.sort === so.id} onClick={() => updateSettings({ sort: so.id })}>
              {so.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="field">
        <h3>Famille</h3>
        <div className="chip-row wrap">
          {FAMILIES.map((fa) => (
            <Chip key={fa.id} active={filters.fam === fa.id} onClick={() => setFilters({ fam: filters.fam === fa.id ? null : fa.id, species: null })}>
              {fa.emoji} {fa.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="field">
        <h3>Espèce</h3>
        <select className="select" value={filters.species ?? ''} onChange={(e) => (sfx.select(), setFilters({ species: e.target.value || null }))}>
          <option value="">Toutes les espèces</option>
          {speciesList.map((sp) => (
            <option key={sp.name} value={sp.name}>
              {sp.name} ({sp.count})
            </option>
          ))}
        </select>
      </section>

      <section className="field">
        <h3>Année</h3>
        <div className="chip-row wrap">
          {f.years.map((y) => (
            <Chip key={y} active={filters.year === y} onClick={() => setFilters({ year: filters.year === y ? null : y })}>
              {y}
            </Chip>
          ))}
        </div>
      </section>

      <section className="field">
        <h3>Gamme / set</h3>
        <select className="select" value={filters.line ?? ''} onChange={(e) => (sfx.select(), setFilters({ line: e.target.value || null }))}>
          <option value="">Toutes les gammes</option>
          {f.lines.map((l) => (
            <option key={l.name} value={l.name}>
              {l.name} ({l.count})
            </option>
          ))}
        </select>
      </section>
    </Sheet>
  );
}
