import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../../audio/sounds';
import type { MoldSection } from '../../core/filters';
import type { Item, Pet } from '../../core/types';
import { toggleCollapsed, toggleHave } from '../../state/store';
import { useUI } from '../ctx';
import { useScrollMargin } from '../useScrollMargin';
import { IconChevron } from '../icons';
import { PetImage } from './PetImage';
import { Tile } from './Tile';

const GAP = { s: 8, m: 10, l: 12 } as const;
const MIN_W = { s: 78, m: 104, l: 150 } as const;
const HEADER_H = 76;

type Row = { kind: 'header'; section: MoldSection; collapsed: boolean } | { kind: 'row'; pets: Pet[] };

/** Largeur disponible, suivie au redimensionnement (rotation de l'écran…). */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Grille virtualisée : seules les rangées visibles (et quelques-unes autour) existent dans la page,
 * même avec les 3 500 figurines du catalogue. Les en-têtes de moule sont des rangées comme les autres.
 */
export const Grid = memo(function Grid({
  pets,
  sections,
  items,
  photoUrls,
  showNames,
  quick,
  size,
  collapsed = [],
  haveByMold,
  active = true,
}: {
  pets?: Pet[];
  /** Si fourni : affichage en sections (moules). */
  sections?: MoldSection[];
  items: Map<string, Item>;
  photoUrls: Map<string, string>;
  showNames: boolean;
  quick: boolean;
  size: 's' | 'm' | 'l';
  collapsed?: string[];
  /** Nombre de figurines possédées par moule (mis à jour à part, pour ne redessiner qu'un en-tête). */
  haveByMold?: Map<string, number>;
  /** Faux quand l'onglet est caché : la grille ne suit plus le défilement. */
  active?: boolean;
}) {
  const ui = useUI();
  const [wrapRef, width] = useWidth();
  const gap = GAP[size];
  const cols = Math.max(2, Math.floor((width + gap) / (MIN_W[size] + gap)) || 3);
  const tileW = width ? (width - gap * (cols - 1)) / cols : MIN_W[size];
  const metaH = showNames && size !== 's' ? 44 : 28;
  const rowH = Math.round(tileW + metaH + 4 + gap);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const chunk = (list: Pet[]) => {
      for (let i = 0; i < list.length; i += cols) out.push({ kind: 'row', pets: list.slice(i, i + cols) });
    };
    if (sections) {
      const closed = new Set(collapsed);
      for (const s of sections) {
        const isClosed = closed.has(s.mold);
        out.push({ kind: 'header', section: s, collapsed: isClosed });
        if (!isClosed) chunk(s.pets);
      }
    } else chunk(pets ?? []);
    return out;
  }, [pets, sections, collapsed, cols]);

  // Ordre de navigation dans les fiches (précédente / suivante) : celui de l'écran.
  const order = useMemo(() => (sections ? sections.flatMap((s) => s.pets) : (pets ?? [])).map((p) => p.id), [sections, pets]);
  const orderRef = useRef(order);
  orderRef.current = order;
  const onOpen = useCallback((id: string) => ui.openPet(id, orderRef.current), [ui]);

  const scrollMargin = useScrollMargin(wrapRef, active);

  const virtualizer = useWindowVirtualizer({
    count: active ? rows.length : 0,
    estimateSize: (i) => (rows[i]?.kind === 'header' ? HEADER_H : rowH),
    overscan: 4,
    scrollMargin,
    // Pas de rendu forcé à chaque événement de défilement : React regroupe, le défilement reste à 60 images/s.
    useFlushSync: false,
  });
  // Tailles fixes connues d'avance : on réinitialise les mesures quand la mise en page change.
  useLayoutEffect(() => virtualizer.measure(), [virtualizer, rows, rowH]);

  const virtualRows = virtualizer.getVirtualItems();
  return (
    <div ref={wrapRef} className={`vgrid size-${size}`} style={{ height: virtualizer.getTotalSize(), ['--cols' as string]: cols, ['--gap' as string]: `${gap}px`, ['--meta-h' as string]: `${metaH}px` }}>
      {virtualRows.map((v) => {
        const row = rows[v.index];
        return (
          <div key={v.key} className="vrow" style={{ height: v.size, transform: `translateY(${v.start - scrollMargin}px)` }}>
            {row.kind === 'header' ? (
              <SectionHeader section={row.section} have={haveByMold?.get(row.section.mold) ?? row.section.have} collapsed={row.collapsed} photoUrls={photoUrls} />
            ) : (
              <div className="vrow-tiles">
                {row.pets.map((p) => (
                  <Tile key={p.id} pet={p} item={items.get(p.id)} photoUrl={photoUrls.get(p.id)} showName={showNames} quick={quick} onOpen={onOpen} onToggle={toggleHave} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

const SectionHeader = memo(function SectionHeader({ section: s, have, collapsed, photoUrls }: { section: MoldSection; have: number; collapsed: boolean; photoUrls: Map<string, string> }) {
  // Vignette représentative : ma photo si j'en ai une, sinon la première photo du catalogue.
  const cover = s.pets.find((p) => photoUrls.has(p.id)) ?? s.pets.find((p) => p.img) ?? s.pets[0];
  const coverUrl = photoUrls.get(cover.id);
  const pct = s.pets.length ? Math.floor((have / s.pets.length) * 100) : 0;
  return (
    <button
      className={`mold-head${collapsed ? ' collapsed' : ''}${have === s.pets.length ? ' done' : ''}`}
      onClick={() => {
        sfx.toggle();
        toggleCollapsed(s.mold);
      }}
      aria-expanded={!collapsed}
    >
      <span className="mold-cover">
        <PetImage pet={cover} photoUrl={coverUrl} size={120} />
      </span>
      <span className="mold-text">
        <strong>{s.name}</strong>
        <span className="mold-sub">
          {have} / {s.pets.length}
          {s.gens.map((g) => (
            <span key={g} className={`gen-pill tiny ${g.toLowerCase()}`}>
              {g}
            </span>
          ))}
        </span>
        <span className="mold-bar">
          <span style={{ transform: `scaleX(${pct / 100})` }} />
        </span>
      </span>
      <IconChevron className="mold-chevron" width={18} height={18} />
    </button>
  );
});
