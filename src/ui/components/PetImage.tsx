import { memo, useState } from 'react';
import type { Pet } from '../../core/types';
import { Silhouette } from './Silhouette';

/** Une image chargée ne déclenche aucun rendu React : la classe est posée directement (des centaines d'images, zéro saccade). */
const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => e.currentTarget.classList.add('loaded');

/** Les photos Blogger existent en plusieurs tailles : on demande celle qu'il faut. */
const sized = (url: string, px: number) => (/blogspot\.com|googleusercontent\.com/.test(url) ? url.replace(/\/s\d+\//, `/s${px}/`) : url);

/**
 * Image d'une figurine : ma photo d'abord, sinon la photo du catalogue (affichée depuis sa source d'origine),
 * puis les photos de secours, et enfin une silhouette mignonne si rien ne charge.
 * La silhouette n'apparaît que pendant le chargement ou si la photo est introuvable.
 */
export const PetImage = memo(function PetImage({ pet, photoUrl, eager = false, index = 0, size = 200 }: { pet: Pet; photoUrl?: string; eager?: boolean; index?: number; size?: number }) {
  const sources = photoUrl ? [photoUrl] : [...(index && pet.alt?.[index - 1] ? [pet.alt[index - 1]] : []), ...(pet.img ? [pet.img] : []), ...(pet.alt ?? [])].map((u) => sized(u, size));
  const key = sources.join('|');
  // Repart de la première source quand la figurine change (sans effet ni rendu supplémentaire).
  const [failed, setFailed] = useState<{ key: string; step: number }>({ key, step: 0 });
  const step = failed.key === key ? failed.step : 0;
  const src = sources[step];
  return (
    <>
      {src && (
        <img
          key={src}
          className="pet-img"
          src={src}
          alt={pet.species ?? 'Figurine'}
          width={size}
          height={size}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={onLoad}
          onError={() => setFailed({ key, step: step + 1 })}
        />
      )}
      {/* Placée après la photo : masquée en CSS dès que la photo est chargée (.pet-img.loaded + .silhouette). */}
      <Silhouette fam={pet.fam} label={pet.species} />
    </>
  );
});
