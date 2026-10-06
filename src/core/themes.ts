/**
 * Thèmes de couleurs. Chaque thème a une version claire et une version sombre.
 * Les couleurs passent par des variables CSS (--bg, --card, --accent…).
 */
export interface Theme {
  id: string;
  name: string;
  hint: string;
  accent: string;
  /** Teinte du fond (0-360) et couleurs des bulles décoratives. */
  hue: number;
  blobs: [string, string, string];
  pattern: 'paws' | 'hearts' | 'stars' | 'bubbles' | 'flowers' | 'none';
}

export const THEMES: Theme[] = [
  { id: 'bonbon', name: 'Bonbon', hint: 'Rose barbe à papa', accent: '#ff5fa2', hue: 335, blobs: ['#ffb3d4', '#c9b6ff', '#ffe1a8'], pattern: 'hearts' },
  { id: 'lagon', name: 'Lagon', hint: 'Turquoise et menthe', accent: '#13b5b1', hue: 180, blobs: ['#9ff0e3', '#a9d8ff', '#fff2a8'], pattern: 'bubbles' },
  { id: 'pomme', name: 'Pomme d’amour', hint: 'Vert pomme acidulé', accent: '#4cbb3c', hue: 105, blobs: ['#c7f5a5', '#fff09a', '#ffc9a8'], pattern: 'flowers' },
  { id: 'lavande', name: 'Lavande', hint: 'Lilas tout doux', accent: '#9a6bff', hue: 265, blobs: ['#d9c8ff', '#ffc8ec', '#b8e4ff'], pattern: 'stars' },
  { id: 'peche', name: 'Pêche', hint: 'Abricot et corail', accent: '#ff7a45', hue: 22, blobs: ['#ffd0b0', '#ffb3c1', '#fff0a0'], pattern: 'paws' },
  { id: 'ciel', name: 'Ciel d’été', hint: 'Bleu ciel et nuages', accent: '#3d8bff', hue: 212, blobs: ['#bcdcff', '#d6ccff', '#fff5c2'], pattern: 'bubbles' },
  { id: 'arcenciel', name: 'Arc-en-ciel', hint: 'Toutes les couleurs !', accent: '#ff4f81', hue: 300, blobs: ['#ffd36e', '#7ee0c3', '#8fb6ff'], pattern: 'stars' },
  { id: 'minimal', name: 'Minimal', hint: 'Sobre, sans décor', accent: '#5b6472', hue: 220, blobs: ['#e4e7ec', '#eef0f3', '#e9ecef'], pattern: 'none' },
];

export const ACCENTS = ['#ff5fa2', '#ff4f4f', '#ff7a45', '#f5b301', '#4cbb3c', '#13b5b1', '#3d8bff', '#9a6bff', '#d45bd8', '#5b6472'];

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Variables CSS d'un thème dans un mode donné. */
export function themeVars(t: Theme, dark: boolean, accentOverride: string | null): Record<string, string> {
  const accent = accentOverride ?? t.accent;
  const h = t.hue;
  return dark
    ? {
        '--bg': `hsl(${h} 28% 11%)`,
        '--bg2': `hsl(${h} 30% 16%)`,
        '--card': `hsl(${h} 22% 18% / 0.96)`,
        '--card-solid': `hsl(${h} 22% 18%)`,
        '--line': `hsl(${h} 20% 30% / 0.7)`,
        '--text': `hsl(${h} 30% 95%)`,
        '--muted': `hsl(${h} 14% 70%)`,
        '--accent': accent,
        '--accent-soft': `color-mix(in srgb, ${accent} 26%, transparent)`,
        '--accent-text': '#ffffff',
        '--tile': `hsl(${h} 22% 22%)`,
        '--shadow': '0 8px 24px rgba(0,0,0,0.35)',
        '--blob-opacity': '0.22',
      }
    : {
        '--bg': `hsl(${h} 70% 97%)`,
        '--bg2': `hsl(${h} 75% 93%)`,
        '--card': 'rgba(255,255,255,0.94)',
        '--card-solid': '#ffffff',
        '--line': `hsl(${h} 40% 86%)`,
        '--text': `hsl(${h} 30% 18%)`,
        '--muted': `hsl(${h} 12% 45%)`,
        '--accent': accent,
        '--accent-soft': `color-mix(in srgb, ${accent} 16%, white)`,
        '--accent-text': '#ffffff',
        '--tile': '#ffffff',
        '--shadow': `0 8px 22px hsl(${h} 50% 50% / 0.16)`,
        '--blob-opacity': '0.85',
      };
}
