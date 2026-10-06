import { motion } from 'framer-motion';
import { memo } from 'react';
import type { Theme } from '../../core/themes';

const SYMBOL: Record<Theme['pattern'], string> = { paws: '🐾', hearts: '♥', stars: '✦', bubbles: '◯', flowers: '✿', none: '' };

/** Fond doux : trois grosses bulles colorées qui flottent, et un motif discret selon le thème. */
export const Backdrop = memo(function Backdrop({ theme }: { theme: Theme }) {
  const sym = SYMBOL[theme.pattern];
  return (
    <div className="backdrop" aria-hidden="true">
      {theme.blobs.map((c, i) => (
        <motion.div
          key={`${theme.id}-${i}`}
          className="blob"
          style={{ background: c, left: `${[-10, 55, 10][i]}%`, top: `${[-8, 20, 62][i]}%` }}
          animate={{ x: [0, 24, -12, 0], y: [0, -18, 14, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 18 + i * 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {sym &&
        Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="pattern" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53 + 7) % 100}%`, transform: `rotate(${(i * 29) % 50 - 25}deg)`, fontSize: 14 + ((i * 7) % 12) }}>
            {sym}
          </span>
        ))}
    </div>
  );
});
