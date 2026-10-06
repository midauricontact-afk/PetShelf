import { memo, type ReactNode } from 'react';
import type { Family } from '../../core/types';

/**
 * Silhouette mignonne « grosse tête » dessinée en SVG, quand la photo manque ou ne charge pas.
 * Une variante par grande famille d'animaux (oreilles, bec, carapace…).
 */
export const Silhouette = memo(function Silhouette({ fam, label }: { fam: Family; label?: string }) {
  const fill = 'var(--sil-fill)';
  const ink = 'var(--sil-ink)';
  const extras: Record<Family, ReactNode> = {
    chien: (
      <>
        <path d="M26 28 C14 30 12 52 20 58 C26 56 28 44 30 36 Z" fill={ink} opacity="0.55" />
        <path d="M74 28 C86 30 88 52 80 58 C74 56 72 44 70 36 Z" fill={ink} opacity="0.55" />
        <ellipse cx="50" cy="56" rx="5" ry="3.6" fill={ink} />
      </>
    ),
    chat: (
      <>
        <path d="M27 30 L30 8 L46 22 Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        <path d="M73 30 L70 8 L54 22 Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        <path d="M47 55 L53 55 L50 58 Z" fill={ink} />
        <path d="M30 56 L18 53 M30 59 L18 61 M70 56 L82 53 M70 59 L82 61" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    lapin: (
      <>
        <ellipse cx="38" cy="10" rx="7" ry="19" fill={fill} stroke={ink} strokeWidth="2" transform="rotate(-12 38 10)" />
        <ellipse cx="62" cy="10" rx="7" ry="19" fill={fill} stroke={ink} strokeWidth="2" transform="rotate(12 62 10)" />
        <ellipse cx="50" cy="56" rx="3.5" ry="2.6" fill={ink} />
      </>
    ),
    rongeur: (
      <>
        <circle cx="28" cy="24" r="9" fill={fill} stroke={ink} strokeWidth="2" />
        <circle cx="72" cy="24" r="9" fill={fill} stroke={ink} strokeWidth="2" />
        <circle cx="50" cy="56" r="3" fill={ink} />
      </>
    ),
    oiseau: (
      <>
        <path d="M44 56 L56 56 L50 64 Z" fill="#ffb347" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M48 18 C46 10 52 6 54 12 C56 6 62 10 56 18" fill={fill} stroke={ink} strokeWidth="2" />
      </>
    ),
    mer: (
      <>
        <path d="M76 44 L92 32 L92 56 Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        <path d="M44 18 C50 10 58 12 60 20" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx="86" cy="14" r="3" fill="none" stroke={ink} strokeWidth="1.5" />
        <circle cx="80" cy="6" r="2" fill="none" stroke={ink} strokeWidth="1.5" />
      </>
    ),
    ours: (
      <>
        <circle cx="28" cy="22" r="9" fill={ink} opacity="0.6" />
        <circle cx="72" cy="22" r="9" fill={ink} opacity="0.6" />
        <ellipse cx="50" cy="56" rx="4.5" ry="3.4" fill={ink} />
      </>
    ),
    cheval: (
      <>
        <path d="M32 24 L34 6 L44 20 Z M68 24 L66 6 L56 20 Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        <path d="M40 18 C44 8 56 8 60 18 C56 14 44 14 40 18 Z" fill={ink} opacity="0.55" />
        <circle cx="45" cy="58" r="1.8" fill={ink} />
        <circle cx="55" cy="58" r="1.8" fill={ink} />
      </>
    ),
    ferme: (
      <>
        <path d="M28 26 L24 12 L40 20 Z M72 26 L76 12 L60 20 Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="50" cy="57" rx="8" ry="5.5" fill={fill} stroke={ink} strokeWidth="2" />
        <circle cx="47" cy="57" r="1.4" fill={ink} />
        <circle cx="53" cy="57" r="1.4" fill={ink} />
      </>
    ),
    reptile: (
      <>
        <path d="M30 82 C30 66 70 66 70 82 Z" fill={ink} opacity="0.45" />
        <path d="M42 57 Q50 62 58 57" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    insecte: (
      <>
        <path d="M42 20 C38 10 32 8 30 6 M58 20 C62 10 68 8 70 6" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="6" r="3" fill={ink} />
        <circle cx="70" cy="6" r="3" fill={ink} />
        <ellipse cx="22" cy="76" rx="12" ry="9" fill={fill} stroke={ink} strokeWidth="2" opacity="0.9" />
        <ellipse cx="78" cy="76" rx="12" ry="9" fill={fill} stroke={ink} strokeWidth="2" opacity="0.9" />
      </>
    ),
    sauvage: (
      <>
        <circle cx="50" cy="42" r="34" fill={ink} opacity="0.3" />
        <circle cx="30" cy="20" r="7" fill={fill} stroke={ink} strokeWidth="2" />
        <circle cx="70" cy="20" r="7" fill={fill} stroke={ink} strokeWidth="2" />
        <ellipse cx="50" cy="56" rx="4" ry="3" fill={ink} />
      </>
    ),
    autre: <path d="M50 6 L53 14 L61 14 L55 19 L57 27 L50 22 L43 27 L45 19 L39 14 L47 14 Z" fill="#ffd36e" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />,
  };
  const behind = fam === 'sauvage' || fam === 'chien' || fam === 'ours';
  return (
    <svg className="silhouette" viewBox="0 0 100 100" role="img" aria-label={label ?? 'Pas de photo'}>
      <ellipse cx="50" cy="94" rx="24" ry="4" fill={ink} opacity="0.12" />
      <ellipse cx="50" cy="80" rx="17" ry="12" fill={fill} stroke={ink} strokeWidth="2" />
      {behind && extras[fam]}
      <circle cx="50" cy="44" r="27" fill={fill} stroke={ink} strokeWidth="2" />
      {!behind && extras[fam]}
      {/* Les grands yeux brillants, signature des petits animaux à grosse tête */}
      <ellipse cx="39" cy="44" rx="6.5" ry="8" fill={ink} />
      <ellipse cx="61" cy="44" rx="6.5" ry="8" fill={ink} />
      <circle cx="41" cy="41" r="2.4" fill="#fff" />
      <circle cx="63" cy="41" r="2.4" fill="#fff" />
      <circle cx="31" cy="54" r="4" fill="#ff8fb1" opacity="0.45" />
      <circle cx="69" cy="54" r="4" fill="#ff8fb1" opacity="0.45" />
    </svg>
  );
});
