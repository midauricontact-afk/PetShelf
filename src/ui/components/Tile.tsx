import { memo } from 'react';
import { petNumber, petTitle } from '../../core/catalog';
import type { Item, Pet } from '../../core/types';
import { IconCheck, IconHeart } from '../icons';
import { PetImage } from './PetImage';

/**
 * Une vignette de la grille. La pastille ronde coche / décoche en un appui.
 * En mode « cochage rapide », toute la vignette sert de case à cocher.
 * (Animations en CSS : des milliers de vignettes doivent rester fluides.)
 */
export const Tile = memo(function Tile({
  pet,
  item,
  photoUrl,
  showName,
  quick,
  onOpen,
  onToggle,
}: {
  pet: Pet;
  item?: Item;
  photoUrl?: string;
  showName: boolean;
  quick: boolean;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const have = !!item?.have;
  return (
    <div className={`tile${have ? ' have' : ''}${quick ? ' quick' : ''}`}>
      <button className="tile-main" onClick={() => (quick ? onToggle(pet.id) : onOpen(pet.id))} aria-label={`${petTitle(pet)} ${petNumber(pet)}${have ? ', je l’ai' : ''}`}>
        <div className="tile-img">
          <PetImage pet={pet} photoUrl={photoUrl} size={240} />
        </div>
        <div className="tile-meta">
          <span className="tile-num">
            <span className={`gen-dot ${pet.gen.toLowerCase()}`} />
            {petNumber(pet)}
          </span>
          {showName && <span className="tile-name">{petTitle(pet)}</span>}
          {pet.moldGuess && !item?.mold && <span className="guess-dot" title="Moule à vérifier" />}
        </div>
      </button>
      <button className={`tile-check${have ? ' on' : ''}`} onClick={() => onToggle(pet.id)} aria-pressed={have} aria-label={have ? 'Décocher' : 'Je l’ai'}>
        <IconCheck width={16} height={16} strokeWidth={3} />
      </button>
      {(item?.want || (item?.dupes ?? 0) > 0) && (
        <div className="tile-badges">
          {item?.want && !have && (
            <span className="badge want" title="Je la cherche">
              <IconHeart width={12} height={12} fill="currentColor" />
            </span>
          )}
          {(item?.dupes ?? 0) > 0 && <span className="badge dupe">×{item!.dupes + (have ? 1 : 0)}</span>}
        </div>
      )}
    </div>
  );
});
