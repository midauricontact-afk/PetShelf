import { memo } from 'react';
import type { Theme } from '../../core/themes';

const SYMBOL: Record<Theme['pattern'], string> = { paws: '🐾', hearts: '♥', stars: '✦', bubbles: '◯', flowers: '✿', none: '' };

/**
 * Fond doux : trois taches de couleur en dégradés radiaux, et un motif discret selon le thème.
 * Volontairement immobile et sans flou : sur iPhone, un grand flou animé coûte cher à chaque image affichée.
 */
export const Backdrop = memo(function Backdrop({ theme }: { theme: Theme }) {
  const sym = SYMBOL[theme.pattern];
  const [a, b, c] = theme.blobs;
  return (
    <div className="backdrop" aria-hidden="true">
      <div
        className="backdrop-blobs"
        style={{
          backgroundImage: `radial-gradient(ellipse 70% 45% at 10% 8%, ${a} 0%, transparent 70%), radial-gradient(ellipse 65% 45% at 92% 35%, ${b} 0%, transparent 70%), radial-gradient(ellipse 75% 45% at 25% 92%, ${c} 0%, transparent 70%)`,
        }}
      />
      {sym &&
        Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="pattern" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53 + 7) % 100}%`, transform: `rotate(${(i * 29) % 50 - 25}deg)`, fontSize: 14 + ((i * 7) % 12) }}>
            {sym}
          </span>
        ))}
    </div>
  );
});
