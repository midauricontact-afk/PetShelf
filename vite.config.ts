import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' : chemins relatifs, l'app marche dans le sous-dossier GitHub Pages (https://<pseudo>.github.io/PetShelf/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
