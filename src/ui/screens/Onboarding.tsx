import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { sfx } from '../../audio/sounds';
import { THEMES } from '../../core/themes';
import { store, updateSettings } from '../../state/store';
import { Btn } from '../components/primitives';
import { IconBolt, IconCheck, IconHeart } from '../icons';

/** Trois petits écrans d'accueil, la première fois seulement. */
export function Onboarding() {
  const s = store.use();
  const [step, setStep] = useState(0);
  const g2 = s.catalog?.pets.filter((p) => p.gen === 'G2').length ?? 0;
  const g7 = s.catalog?.pets.filter((p) => p.gen === 'G7').length ?? 0;
  const next = () => {
    sfx.select();
    setStep((x) => Math.min(2, x + 1));
  };

  return (
    <div className="onboarding">
      <AnimatePresence mode="wait">
        <motion.div key={step} className="ob-step" initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          {step === 0 && (
            <>
              <motion.div className="ob-logo" animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
                🐾
              </motion.div>
              <h1>Bienvenue dans PetShelf</h1>
              <p>
                Ta collection de petits animaux à grosse tête, toujours dans ta poche : <strong>{g2}</strong> figurines G2 et <strong>{g7}</strong> figurines G7.
              </p>
              <Btn size="lg" onClick={next}>
                C’est parti !
              </Btn>
            </>
          )}
          {step === 1 && (
            <>
              <h1>Choisis ton thème</h1>
              <div className="theme-grid">
                {THEMES.slice(0, 6).map((t) => (
                  <motion.button
                    key={t.id}
                    className={`theme-card${s.settings.themeId === t.id ? ' active' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${t.blobs[0]}, ${t.blobs[1]})` }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => (sfx.select(), updateSettings({ themeId: t.id }))}
                  >
                    <span className="theme-dot" style={{ background: t.accent }} />
                    <strong>{t.name}</strong>
                  </motion.button>
                ))}
              </div>
              <p className="muted small">Tu pourras tout changer dans les Réglages.</p>
              <Btn size="lg" onClick={next}>
                Suivant
              </Btn>
            </>
          )}
          {step === 2 && (
            <>
              <h1>Comment ça marche</h1>
              <ul className="ob-tips">
                <li>
                  <span className="tip-icon check">
                    <IconCheck width={18} height={18} strokeWidth={3} />
                  </span>
                  <span>
                    Touche la pastille ronde d’une vignette : <strong>je l’ai !</strong>
                  </span>
                </li>
                <li>
                  <span className="tip-icon bolt">
                    <IconBolt width={18} height={18} />
                  </span>
                  <span>
                    Le <strong>cochage rapide</strong> ⚡ : toute la vignette devient une case. Idéal pour remplir ta collection la première fois.
                  </span>
                </li>
                <li>
                  <span className="tip-icon heart">
                    <IconHeart width={18} height={18} />
                  </span>
                  <span>
                    Ouvre une fiche pour la <strong>wishlist</strong>, les doubles, l’état, ta note et ta photo.
                  </span>
                </li>
              </ul>
              <Btn
                size="lg"
                onClick={() => {
                  sfx.victory();
                  updateSettings({ onboarded: true });
                }}
              >
                Voir ma collection
              </Btn>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="dots ob-dots">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i === step ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
