import { memo, useState } from 'react';
import type { Pet } from '../../core/types';
import { Silhouette } from './Silhouette';

/** Une image chargée ne déclenche aucun rendu React : la classe est posée directement (des centaines d'images, zéro saccade). */
const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => e.currentTarget.classList.add('loaded');

/**
 * Image d'une figurine : ma photo d'abord, sinon la photo du catalogue (affichée depuis sa source d'origine),
 * puis les photos de secours, et enfin une silhouette mignonne si rien ne charge.
 * La silhouette est dessinée dessous ; la photo la recouvre dès qu'elle est prête.
 */
export const PetImage = memo(function PetImage({ pet, photoUrl, eager = false, index = 0 }: { pet: Pet; photoUrl?: string; eager?: boolean; index?: number }) {
  const sources = photoUrl ? [photoUrl] : [...(index && pet.alt?.[index - 1] ? [pet.alt[index - 1]] : []), ...(pet.img ? [pet.img] : []), ...(pet.alt ?? [])];
  const key = sources.join('|');
  // Repart de la première source quand la figurine change (sans effet ni rendu supplémentaire).
  const [failed, setFailed] = useState<{ key: string; step: number }>({ key, step: 0 });
  const step = failed.key === key ? failed.step : 0;
  const src = sources[step];
  return (
    <>
      <Silhouette fam={pet.fam} label={pet.species} />
      {src && (
        <img
          key={src}
          className="pet-img"
          src={src}
          alt={pet.species ?? 'Figurine'}
          width={400}
          height={400}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={onLoad}
          onError={() => setFailed({ key, step: step + 1 })}
        />
      )}
    </>
  );
});
