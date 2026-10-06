import { AnimatePresence, motion } from 'framer-motion';
import { memo, useDeferredValue, useMemo, useState, useTransition } from 'react';
import { sfx } from '../../audio/sounds';
import { facets, moldName } from '../../core/catalog';
import { activeFilterCount, applyFilters, dependsOnItems, groupByMold, SORTS, STATUSES, type Filters } from '../../core/filters';
import { progress } from '../../core/stats';
import { FAMILIES } from '../../core/types';
import { resetFilters, setFilters, store, updateSettings } from '../../state/store';
import { Grid } from '../components/Grid';
import { Btn, Chip, Segmented } from '../components/primitives';
import { Bar } from '../components/Ring';
import { Sheet } from '../components/Sheet';
import { IconBolt, IconClose, IconFilter, IconSearch } from '../icons';

const EMPTY = new Map();

export const CollectionScreen = memo(function CollectionScreen({ active }: { active: boolean }) {
  const catalog = store.useSel((s) => s.catalog);
  const items = store.useSel((s) => s.items);
  const filters = store.useSel((s) => s.filters);
  const settings = store.useSel((s) => s.settings);
  const quick = store.useSel((s) => s.quick);
  const photoUrls = store.useSel((s) => s.photoUrls);
  const moldVersion = store.useSel((s) => s.moldVersion);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [, startTransition] = useTransition();
  const pets = catalog?.pets ?? [];
  const molds = catalog?.molds ?? EMPTY;

  // Les boutons réagissent tout de suite ; la grille suit juste après, sans bloquer le doigt.
  const deferredFilters = useDeferredValue(filters);
  const sort = useDeferredValue(settings.sort);
  const byMold = useDeferredValue(settings.byMold);
  // Cocher une figurine ne relance le filtrage que si le résultat en dépend (statut, tri « récentes »…).
  const needsItems = dependsOnItems(deferredFilters, sort) || (byMold && moldVersion > 0) || sort === 'mold';
  const itemsForList = needsItems ? items : EMPTY;

  const list = useMemo(
    () => applyFilters(pets, itemsForList, deferredFilters, byMold && sort === 'mold' ? 'num' : sort, molds),
    // moldVersion : une correction de moule à la main relance le classement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pets, itemsForList, deferredFilters, sort, byMold, molds, moldVersion],
  );
  // Les sections ne dépendent que de la liste et des moules corrigés à la main (pas des cases cochées) :
  // cocher une figurine ne met à jour que son compteur de moule, pas toute la grille.
  const overrides = useMemo(() => {
    const m = new Map();
    for (const [id, it] of store.get().items) if (it.mold) m.set(id, it);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moldVersion, catalog]);
  const sections = useMemo(() => (byMold ? groupByMold(list, overrides, molds) : undefined), [byMold, list, overrides, molds]);
  const haveByMold = useMemo(() => {
    const m = new Map<string, number>();
    if (sections) for (const s of sections) m.set(s.mold, s.pets.reduce((n, p) => n + (items.get(p.id)?.have ? 1 : 0), 0));
    return m;
  }, [sections, items]);
  const scope = useMemo(() => (filters.gen === 'all' ? pets : pets.filter((p) => p.gen === filters.gen)), [pets, filters.gen]);
  const prog = useMemo(() => progress(scope, items), [scope, items]);
  const nFilters = activeFilterCount(filters);
  const set = (patch: Partial<Filters>) => startTransition(() => setFilters(patch));

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
          <input type="search" inputMode="search" placeholder="Numéro, nom, moule, couleur…" value={filters.q} onChange={(e) => setFilters({ q: e.target.value })} enterKeyHint="search" />
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
          <Chip key={st.id} active={filters.status === st.id} onClick={() => set({ status: st.id })}>
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
        onChange={(gen) => set({ gen })}
      />

      <div className="result-count">
        <span>
          {list.length} figurine{list.length > 1 ? 's' : ''}
          {sections && ` · ${sections.length} moule${sections.length > 1 ? 's' : ''}`}
        </span>
        <span className="row-gap">
          {nFilters > 0 && (
            <button className="link" onClick={() => (sfx.back(), startTransition(resetFilters))}>
              Effacer
            </button>
          )}
          <button
            className={`view-toggle${settings.byMold ? ' on' : ''}`}
            onClick={() => {
              sfx.toggle();
              startTransition(() => updateSettings({ byMold: !settings.byMold }));
            }}
            aria-pressed={settings.byMold}
          >
            {settings.byMold ? '🧩 Par moule' : '🔢 Par numéro'}
          </button>
        </span>
      </div>

      {filters.mold && (
        <div className="active-mold">
          Moule : <strong>{moldName(molds, filters.mold)}</strong>
          <button className="icon-btn small" onClick={() => set({ mold: null })} aria-label="Retirer le filtre de moule">
            <IconClose width={14} height={14} />
          </button>
        </div>
      )}

      {list.length ? (
        <Grid
          pets={sections ? undefined : list}
          sections={sections}
          items={items}
          photoUrls={photoUrls}
          showNames={settings.showNames}
          quick={quick}
          size={settings.thumb}
          collapsed={settings.collapsed}
          haveByMold={haveByMold}
          active={active}
        />
      ) : (
        <div className="empty">
          <div className="empty-emoji">🔍</div>
          <p>Aucune figurine ne correspond.</p>
          <p className="muted">Essaie un numéro seul (« 1234 ») ou retire un filtre.</p>
        </div>
      )}

      {filtersOpen && <FiltersSheet onClose={() => setFiltersOpen(false)} filters={filters} />}
    </div>
  );
});

/** Feuille des filtres : ses listes ne sont calculées que lorsqu'elle est ouverte. */
function FiltersSheet({ onClose, filters }: { onClose: () => void; filters: Filters }) {
  const catalog = store.useSel((s) => s.catalog);
  const sort = store.useSel((s) => s.settings.sort);
  const [open, setOpen] = useState(true);
  const pets = catalog?.pets ?? [];
  const scoped = useMemo(() => (filters.gen === 'all' ? pets : pets.filter((p) => p.gen === filters.gen)), [pets, filters.gen]);
  const f = useMemo(() => facets(scoped, catalog?.molds), [scoped, catalog]);
  const speciesList = useMemo(() => f.species.filter((sp) => !filters.fam || scoped.some((p) => p.species === sp.name && p.fam === filters.fam)), [f, filters.fam, scoped]);
  const close = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Filtres et tri"
      tall
      footer={
        <div className="row-btns">
          <Btn variant="ghost" onClick={() => resetFilters()}>
            Tout effacer
          </Btn>
          <Btn onClick={close}>Voir les figurines</Btn>
        </div>
      }
    >
      <section className="field">
        <h3>Trier par</h3>
        <div className="chip-row wrap">
          {SORTS.map((so) => (
            <Chip key={so.id} active={sort === so.id} onClick={() => updateSettings({ sort: so.id })}>
              {so.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="field">
        <h3>Moule</h3>
        <select className="select" value={filters.mold ?? ''} onChange={(e) => (sfx.select(), setFilters({ mold: e.target.value || null }))}>
          <option value="">Tous les moules</option>
          {f.molds.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.count})
            </option>
          ))}
        </select>
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
