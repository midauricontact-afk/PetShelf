import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { sfx } from '../../audio/sounds';
import { petNumber, petTitle } from '../../core/catalog';
import { petOfTheDay, tradeListText } from '../../core/extras';
import { sortPets } from '../../core/filters';
import { almostComplete } from '../../core/stats';
import { store, toast, toggleWant } from '../../state/store';
import { Grid } from '../components/Grid';
import { PetImage } from '../components/PetImage';
import { Btn, Segmented } from '../components/primitives';
import { useUI } from '../ctx';
import { IconHeart, IconShare } from '../icons';

type ListId = 'want' | 'dupes' | 'recent';

export function ListsScreen() {
  const s = store.use();
  const ui = useUI();
  const [which, setWhich] = useState<ListId>('want');
  const pets = s.catalog?.pets ?? [];

  const lists = useMemo(() => {
    const want = pets.filter((p) => s.items.get(p.id)?.want && !s.items.get(p.id)?.have);
    const dupes = pets.filter((p) => (s.items.get(p.id)?.dupes ?? 0) > 0);
    const recent = sortPets(
      pets.filter((p) => s.items.get(p.id)?.have && s.items.get(p.id)?.addedAt),
      s.items,
      'recent',
    ).slice(0, 60);
    return { want, dupes, recent };
  }, [pets, s.items]);

  const daily = useMemo(() => petOfTheDay(pets, s.items), [pets, s.items]);
  const almost = useMemo(() => almostComplete(s.series, s.items).slice(0, 6), [s.series, s.items]);
  const current = lists[which];

  const share = async () => {
    const text = tradeListText(pets, s.items);
    try {
      if (navigator.share) await navigator.share({ title: 'Ma liste d’échange LPS', text });
      else {
        await navigator.clipboard.writeText(text);
        toast('Liste copiée 📋', 'ok');
      }
    } catch {
      /* partage annulé */
    }
  };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">Mes listes</p>
          <h1>Envies & échanges</h1>
        </div>
      </header>

      {daily && (
        <motion.button className="card daily" whileTap={{ scale: 0.98 }} onClick={() => (sfx.sparkle(), ui.openPet(daily.id))}>
          <div className="daily-img">
            <PetImage pet={daily} />
          </div>
          <div className="daily-text">
            <p className="eyebrow">✨ Figurine du jour</p>
            <h3>{petTitle(daily)}</h3>
            <p className="muted small">
              {daily.gen} {petNumber(daily)} {daily.year ? `· ${daily.year}` : ''}
            </p>
            <p className="small">Une figurine qui te manque, choisie au hasard chaque jour.</p>
          </div>
        </motion.button>
      )}

      <Segmented
        value={which}
        options={[
          { id: 'want', label: `Je cherche (${lists.want.length})` },
          { id: 'dupes', label: `Doubles (${lists.dupes.length})` },
          { id: 'recent', label: 'Récentes' },
        ]}
        onChange={setWhich}
      />

      {(which === 'want' || which === 'dupes') && (lists.want.length > 0 || lists.dupes.length > 0) && (
        <Btn variant="soft" onClick={share}>
          <IconShare width={18} height={18} /> Partager ma liste d’échange
        </Btn>
      )}

      {current.length ? (
        <Grid pets={current} items={s.items} photoUrls={s.photoUrls} showNames={s.settings.showNames} quick={false} size={s.settings.thumb} resetKey={which} />
      ) : (
        <div className="empty">
          <div className="empty-emoji">{which === 'want' ? '💖' : which === 'dupes' ? '🔁' : '🐾'}</div>
          <p>{which === 'want' ? 'Ta liste de recherche est vide.' : which === 'dupes' ? 'Aucun double pour l’instant.' : 'Coche des figurines pour les voir ici.'}</p>
          <p className="muted">
            {which === 'want' ? 'Dans une fiche, touche « Je la cherche ».' : which === 'dupes' ? 'Dans une fiche, utilise le compteur « En double ».' : 'Les dernières ajoutées apparaîtront en premier.'}
          </p>
        </div>
      )}

      {which === 'want' && almost.length > 0 && (
        <section className="card">
          <h3>Presque complètes 🏁</h3>
          <p className="muted small">Il ne manque qu’une ou deux figurines à ces séries.</p>
          <ul className="almost">
            {almost.map((a) => (
              <li key={a.key}>
                <div className="almost-head">
                  <strong>{a.key}</strong>
                  <span className="muted small">
                    {a.total - a.missing.length}/{a.total}
                  </span>
                </div>
                <div className="almost-pets">
                  {a.missing.map((p) => {
                    const wanted = !!s.items.get(p.id)?.want;
                    return (
                      <div key={p.id} className="mini">
                        <button className="mini-img" onClick={() => ui.openPet(p.id)}>
                          <PetImage pet={p} />
                        </button>
                        <button className={`mini-want${wanted ? ' on' : ''}`} onClick={() => toggleWant(p.id)} aria-label={wanted ? 'Retirer de ma liste' : 'Ajouter à ma liste'}>
                          <IconHeart width={14} height={14} fill={wanted ? 'currentColor' : 'none'} /> {petNumber(p)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
