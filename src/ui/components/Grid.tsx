import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item, Pet } from '../../core/types';
import { toggleHave } from '../../state/store';
import { useUI } from '../ctx';
import { Tile } from './Tile';

const PAGE = 90;

/** Grille de vignettes, affichée par paquets au fil du défilement (des milliers de figurines, sans ralentir). */
export function Grid({
  pets,
  items,
  photoUrls,
  showNames,
  quick,
  size,
  resetKey,
}: {
  pets: Pet[];
  items: Map<string, Item>;
  photoUrls: Map<string, string>;
  showNames: boolean;
  quick: boolean;
  size: 's' | 'm' | 'l';
  resetKey: string;
}) {
  const ui = useUI();
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const listRef = useRef(pets);
  listRef.current = pets;

  useEffect(() => setShown(PAGE), [resetKey]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setShown((n) => Math.min(n + PAGE, listRef.current.length));
    }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, pets.length]);

  const onOpen = useCallback((id: string) => ui.openPet(id, listRef.current.map((p) => p.id)), [ui]);

  return (
    <>
      <div className={`grid size-${size}`}>
        {pets.slice(0, shown).map((p) => (
          <Tile key={p.id} pet={p} item={items.get(p.id)} photoUrl={photoUrls.get(p.id)} showName={showNames} quick={quick} onOpen={onOpen} onToggle={toggleHave} />
        ))}
      </div>
      {shown < pets.length && <div ref={sentinel} className="grid-sentinel" aria-hidden="true" />}
    </>
  );
}
