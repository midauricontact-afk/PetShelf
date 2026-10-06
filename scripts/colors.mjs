// Couleurs dominantes d'une petite vignette (RGBA décodée) → noms de couleurs en français.
// Le fond (relié aux bords et proche de la couleur des coins) est retiré par remplissage.

/** Nom de couleur pour un pixel (r, g, b de 0 à 255). */
export function colorName(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    const R = r / 255, G = g / 255, B = b / 255;
    if (max === R) h = 60 * (((G - B) / d) % 6);
    else if (max === G) h = 60 * ((B - R) / d + 2);
    else h = 60 * ((R - G) / d + 4);
    if (h < 0) h += 360;
  }
  if (l < 0.14) return 'noir';
  if (s < 0.2) return l > 0.8 ? 'blanc' : l < 0.25 ? 'noir' : 'gris';
  if (l > 0.86 && s < 0.5) return h > 20 && h < 70 ? 'crème' : 'blanc';
  const warm = h < 50 || h >= 330;
  // Ombres et teintes sombres peu saturées : marron pour les tons chauds (y compris les ombres violacées des photos).
  if (l < 0.32 && s < 0.45) return warm || h > 250 ? 'marron' : 'gris';
  if (h >= 340 || h < 15) {
    if (l < 0.45 && s < 0.55) return 'marron';
    return l > 0.6 ? 'rose' : 'rouge';
  }
  if (h < 45) {
    if (s < 0.45) return l > 0.62 ? 'beige' : 'marron';
    if (l > 0.72) return 'beige';
    return l < 0.42 ? 'marron' : 'orange';
  }
  if (h < 70) {
    if (h >= 46 && l < 0.5) return 'vert'; // vert olive (tortues, grenouilles…)
    return s < 0.4 ? 'beige' : 'jaune';
  }
  if (h < 160) return 'vert';
  if (h < 195) return 'turquoise';
  if (h < 255) return 'bleu';
  if (h < 290) return 'violet';
  return l < 0.35 ? 'violet' : 'rose';
}

/** Retourne 1 à 3 couleurs dominantes de la figurine. */
export function colorNames(img) {
  const { width: w, height: h, data } = img;
  const at = (x, y) => (y * w + x) * 4;
  // Couleur de fond estimée : moyenne des quatre coins.
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const bg = [0, 1, 2].map((c) => corners.reduce((sum, i) => sum + data[i + c], 0) / 4);
  const near = (i) => Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) < 70;
  const isBg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h || isBg[y * w + x] || !near(at(x, y))) continue;
    isBg[y * w + x] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const counts = new Map();
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isBg[y * w + x]) continue;
      const i = at(x, y);
      const n = colorName(data[i], data[i + 1], data[i + 2]);
      counts.set(n, (counts.get(n) ?? 0) + 1);
      total++;
    }
  }
  if (total < 50) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, c], i) => i === 0 || c / total >= 0.16)
    .slice(0, 3)
    .map(([n]) => n);
}
