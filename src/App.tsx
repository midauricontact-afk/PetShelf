import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { sfx } from './audio/sounds';
import { themeById, themeVars } from './core/themes';
import { dismissCelebration, initApp, store } from './state/store';
import { Backdrop } from './ui/components/Backdrop';
import { Confetti } from './ui/components/Confetti';
import { Btn } from './ui/components/primitives';
import { TabBar } from './ui/components/TabBar';
import { UIContext, type AppUI, type TabId } from './ui/ctx';
import { CollectionScreen } from './ui/screens/Collection';
import { ListsScreen } from './ui/screens/Lists';
import { MoldsScreen } from './ui/screens/Molds';
import { Onboarding } from './ui/screens/Onboarding';
import { PetSheet } from './ui/screens/PetSheet';
import { ProgressScreen } from './ui/screens/Progress';
import { SettingsScreen } from './ui/screens/Settings';
import { Perf } from './perf';

interface ConfirmState {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

function useDarkMode(mode: 'auto' | 'light' | 'dark') {
  const query = '(prefers-color-scheme: dark)';
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mode === 'dark' || (mode === 'auto' && systemDark);
}

export function App() {
  // App ne suit que ce dont elle a besoin : cocher une figurine ne redessine pas toute l'application.
  const ready = store.useSel((st) => st.ready);
  const error = store.useSel((st) => st.error);
  const settings = store.useSel((st) => st.settings);
  const burst = store.useSel((st) => st.burst);
  const celebration = store.useSel((st) => st.celebration);
  const toasts = store.useSel((st) => st.toasts);
  const s = { ready, error, settings, burst, celebration, toasts };
  const [tab, setTab] = useState<TabId>('collection');
  // L'onglet surligné change immédiatement ; le contenu suit en transition.
  const [navTab, setNavTab] = useState<TabId>('collection');
  const [, startTransition] = useTransition();
  const scrollByTab = useRef<Partial<Record<TabId, number>>>({});
  const [pet, setPet] = useState<{ id: string; list: string[] } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const theme = themeById(s.settings.themeId);
  const dark = useDarkMode(s.settings.mode);

  useEffect(() => {
    void initApp();
  }, []);

  // Couleurs du thème sur toute la page (et la barre d'état de l'iPhone).
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(themeVars(theme, dark, s.settings.accent))) root.style.setProperty(k, v);
    root.dataset.mode = dark ? 'dark' : 'light';
    root.dataset.theme = theme.id;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#fff');
  }, [theme, dark, s.settings.accent]);

  // La célébration disparaît toute seule.
  useEffect(() => {
    if (!s.celebration) return;
    const t = setTimeout(dismissCelebration, 3200);
    return () => clearTimeout(t);
  }, [s.celebration]);

  const confirm = useCallback((opts: Omit<ConfirmState, 'resolve'>) => new Promise<boolean>((resolve) => setConfirmState({ ...opts, resolve })), []);

  const ui = useMemo<AppUI>(
    () => ({
      openPet: (id, list) => {
        sfx.open();
        setPet({ id, list: list ?? [id] });
      },
      goTab: (t) => {
        // Chaque onglet retrouve sa position de défilement ; le changement passe en « transition » pour que le doigt ne soit jamais bloqué.
        setTab((cur) => {
          scrollByTab.current[cur] = window.scrollY;
          return cur;
        });
        setNavTab(t);
        startTransition(() => setTab(t));
      },
      confirm,
    }),
    [confirm],
  );

  const settle = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };
  const closePet = useCallback(() => setPet(null), []);

  if (!s.ready) return <div className="splash" aria-busy="true"><span>🐾</span></div>;
  if (s.error)
    return (
      <div className="splash error">
        <p>Oups, l’app n’a pas pu démarrer.</p>
        <p className="muted small">{s.error}</p>
        <Btn onClick={() => location.reload()}>Réessayer</Btn>
      </div>
    );

  return (
    <Perf id="app">
    <MotionConfig reducedMotion="user">
      <UIContext.Provider value={ui}>
        <Backdrop theme={theme} />

        {!s.settings.onboarded ? (
          <Onboarding />
        ) : (
          <div className="app">
            <main className="content">
              {/* La collection reste en mémoire (cachée) : y revenir est instantané. Les autres onglets sont légers. */}
              <div className="tab-pane" hidden={tab !== 'collection'}>
                <CollectionScreen active={tab === 'collection'} />
              </div>
              {tab !== 'collection' && (
                <div key={tab} className="tab-pane fade">
                  {tab === 'molds' && <MoldsScreen />}
                  {tab === 'lists' && <ListsScreen />}
                  {tab === 'progress' && <ProgressScreen />}
                  {tab === 'settings' && <SettingsScreen />}
                </div>
              )}
              <ScrollRestore tab={tab} saved={scrollByTab} />
            </main>
            <TabBar tab={navTab} onChange={ui.goTab} />
          </div>
        )}

        <PetSheet id={pet?.id ?? null} list={pet?.list ?? []} onClose={closePet} onNavigate={(id) => setPet((p) => (p ? { ...p, id } : p))} />

        {s.burst > 0 && <Confetti key={s.burst} count={18} />}

        <AnimatePresence>
          {s.celebration && (
            <motion.div key={s.celebration.id} className="celebration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={dismissCelebration}>
              <Confetti count={60} />
              <motion.div className="celebration-card" initial={{ scale: 0.5, y: 40, rotate: -6 }} animate={{ scale: 1, y: 0, rotate: 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
                <motion.div className="celebration-emoji" animate={{ rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.9 }}>
                  {s.celebration.emoji}
                </motion.div>
                <h2>{s.celebration.title}</h2>
                <p>{s.celebration.text}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmState && (
            <motion.div className="dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => settle(false)}>
              <motion.div className="dialog" role="alertdialog" aria-modal="true" initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 320 }} onClick={(e) => e.stopPropagation()}>
                <h3>{confirmState.title}</h3>
                {confirmState.message && <p className="muted">{confirmState.message}</p>}
                <div className="row-btns">
                  <Btn variant="ghost" onClick={() => settle(false)}>
                    {confirmState.cancelLabel ?? 'Annuler'}
                  </Btn>
                  <Btn variant={confirmState.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
                    {confirmState.confirmLabel}
                  </Btn>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="toasts" aria-live="polite">
          <AnimatePresence>
            {s.toasts.map((t) => (
              <motion.div key={t.id} className={`toast ${t.kind}`} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ type: 'spring', damping: 24, stiffness: 320 }}>
                {t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </UIContext.Provider>
    </MotionConfig>
    </Perf>
  );
}

/** Remet la page à la position où on l'avait laissée dans cet onglet. */
function ScrollRestore({ tab, saved }: { tab: TabId; saved: React.RefObject<Partial<Record<TabId, number>>> }) {
  useEffect(() => {
    window.scrollTo({ top: saved.current?.[tab] ?? 0 });
  }, [tab, saved]);
  return null;
}
