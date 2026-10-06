import { motion } from 'framer-motion';
import { sfx } from '../../audio/sounds';
import type { TabId } from '../ctx';
import { IconChart, IconGear, IconList, IconMold, IconPaw } from '../icons';

const TABS: { id: TabId; label: string; Icon: typeof IconPaw }[] = [
  { id: 'collection', label: 'Collection', Icon: IconPaw },
  { id: 'molds', label: 'Moules', Icon: IconMold },
  { id: 'lists', label: 'Listes', Icon: IconList },
  { id: 'progress', label: 'Progrès', Icon: IconChart },
  { id: 'settings', label: 'Réglages', Icon: IconGear },
];

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, Icon }) => (
        <motion.button
          key={id}
          className={tab === id ? 'active' : ''}
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            if (tab !== id) sfx.tab();
            onChange(id);
          }}
          aria-current={tab === id ? 'page' : undefined}
        >
          {tab === id && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
          <motion.span className="tab-icon" animate={tab === id ? { y: [0, -4, 0] } : { y: 0 }} transition={{ duration: 0.35 }}>
            <Icon width={22} height={22} />
          </motion.span>
          <span className="tab-label">{label}</span>
        </motion.button>
      ))}
    </nav>
  );
}
