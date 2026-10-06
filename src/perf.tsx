import { Profiler, type ReactNode } from 'react';

/**
 * Mesure de performance (uniquement avec `npm run build:profile`) : chaque rendu React est noté dans window.__prof.
 * Dans la version normale, ce composant ne fait rien et disparaît de l'app.
 */
export function Perf({ id, children }: { id: string; children: ReactNode }) {
  if (!import.meta.env.VITE_PROFILE) return <>{children}</>;
  return (
    <Profiler
      id={id}
      onRender={(pid, phase, actual) => {
        const w = window as unknown as { __prof?: { id: string; phase: string; ms: number }[] };
        (w.__prof ??= []).push({ id: pid, phase, ms: actual });
      }}
    >
      {children}
    </Profiler>
  );
}
