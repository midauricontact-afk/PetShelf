import { createContext, useContext } from 'react';

export type TabId = 'collection' | 'molds' | 'lists' | 'progress' | 'settings';

export interface AppUI {
  /** Ouvre la fiche d'une figurine ; `list` permet de passer à la précédente / suivante. */
  openPet: (id: string, list?: string[]) => void;
  goTab: (t: TabId) => void;
  confirm: (opts: { title: string; message?: string; confirmLabel: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>;
}

export const UIContext = createContext<AppUI>({
  openPet: () => undefined,
  goTab: () => undefined,
  confirm: async () => false,
});

export const useUI = () => useContext(UIContext);
