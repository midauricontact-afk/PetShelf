import { memo, useMemo, type CSSProperties } from 'react';

const SYMBOLS = ['🐾', '♥', '✦', '★', '●', '✿'];
const COLORS = ['#ff5fa2', '#ffd36e', '#7ee0c3', '#8fb6ff', '#c9a2ff', '#ff9a3c'];

/**
 * Petite pluie de pattes, cœurs et étoiles qui montent et s'estompent.
 * Animation 100 % CSS (transform + opacity) : elle tourne sur la carte graphique, sans travail pour React.
 */
export const Confetti = memo(function Confetti({ count = 34 }: { count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 8 + Math.random() * 84,
        dx: Math.round((Math.random() - 0.5) * 140),
        dy: Math.round(-260 - Math.random() * 120),
        delay: (Math.random() * 0.5).toFixed(2),
        dur: (1.8 + Math.random() * 1.6).toFixed(2),
        size: Math.round(12 + Math.random() * 16),
        rot: Math.round((Math.random() - 0.5) * 220),
        symbol: SYMBOLS[i % SYMBOLS.length],
        color: Math.random() > 0.8 ? 'var(--accent)' : COLORS[i % COLORS.length],
      })),
    [count],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {parts.map((p) => (
        <span
          key={p.id}
          className="spark"
          style={
            {
              left: `${p.x}%`,
              fontSize: p.size,
              color: p.color,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--rot': `${p.rot}deg`,
            } as CSSProperties
          }
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
});
