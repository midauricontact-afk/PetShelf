import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Position verticale d'une liste dans la page, pour la virtualisation « au défilement de la fenêtre ».
 * Mesurée seulement quand ce qui se trouve au-dessus change de taille (bandeau, filtre…), jamais pendant le défilement :
 * mesurer à chaque image forcerait le navigateur à recalculer la mise en page et ferait saccader l'iPhone.
 */
export function useScrollMargin(ref: RefObject<HTMLElement | null>, active = true): number {
  const [margin, setMargin] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const measure = () => {
      const m = Math.round(el.getBoundingClientRect().top + window.scrollY);
      setMargin((cur) => (Math.abs(cur - m) > 1 ? m : cur));
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (let sib = el.previousElementSibling; sib; sib = sib.previousElementSibling) ro.observe(sib);
    // Un élément ajouté au-dessus (filtre de moule…) change la hauteur du parent : on le remarque aussi.
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref, active]);
  return margin;
}
