import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service worker : ouverture instantanée, fonctionnement hors ligne et images gardées en cache.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        // Mise à jour automatique : à chaque retour dans l'app, on regarde s'il existe une nouvelle version.
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) void reg.update().catch(() => undefined);
        });
      })
      .catch(() => undefined);
  });
  // Quand une nouvelle version prend le relais, on recharge une seule fois pour l'afficher
  // (pas au tout premier lancement, où il n'y avait pas encore de version installée).
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
}
