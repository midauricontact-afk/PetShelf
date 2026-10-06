import { useEffect, useState } from 'react';
import type { Pet } from '../../core/types';
import { Silhouette } from './Silhouette';

/**
 * Image d'une figurine : ma photo d'abord, sinon la photo du catalogue (affichée depuis sa source d'origine),
 * puis les photos de secours, et enfin une silhouette mignonne si rien ne charge.
 */
export function PetImage({ pet, photoUrl, eager = false, index = 0 }: { pet: Pet; photoUrl?: string; eager?: boolean; index?: number }) {
  const sources = photoUrl ? [photoUrl] : [...(index && pet.alt?.[index - 1] ? [pet.alt[index - 1]] : []), ...(pet.img ? [pet.img] : []), ...(pet.alt ?? [])];
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const key = sources.join('|');

  useEffect(() => {
    setStep(0);
    setLoaded(false);
  }, [key]);

  const src = sources[step];
  if (!src) return <Silhouette fam={pet.fam} label={pet.species} />;
  return (
    <>
      {!loaded && <Silhouette fam={pet.fam} label={pet.species} />}
      <img
        className={`pet-img${loaded ? ' loaded' : ''}`}
        src={src}
        alt={pet.species ?? 'Figurine'}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setStep((s) => s + 1);
        }}
      />
    </>
  );
}
