import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' : chemins relatifs, l'app marche dans le sous-dossier GitHub Pages (https://<pseudo>.github.io/PetShelf/).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  // `npm run build:profile` : React en mode « profiling » pour mesurer chaque rendu (voir src/perf.tsx).
  resolve: mode === 'profile' ? { alias: { 'react-dom/client': 'react-dom/profiling' } } : {},
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
