import { useSyncExternalStore } from 'react';

/** Mini-store réactif : un état, des abonnés, un hook. */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const get = () => state;
  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  };
  return {
    get,
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      for (const fn of listeners) fn();
    },
    subscribe,
    use: (): T => useSyncExternalStore(subscribe, get),
    /** Ne s'abonne qu'à une partie de l'état : le composant ne se redessine que si cette partie change. */
    useSel: <R,>(sel: (s: T) => R): R => useSyncExternalStore(subscribe, () => sel(state)),
  };
}
