import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../../audio/sounds';
import { moldName, petNumber, petTitle } from '../../core/catalog';
import { ACCESSORIES, CONDITIONS, FAMILIES, emptyItem } from '../../core/types';
import { removePhoto, setDupes, setFilters, setMoldOverride, setPhoto, store, toggleHave, toggleWant, updateItem } from '../../state/store';
import { PetImage } from '../components/PetImage';
import { Chip } from '../components/primitives';
import { Sheet } from '../components/Sheet';
import { useUI } from '../ctx';
import { IconBack, IconCamera, IconCheck, IconChevron, IconHeart, IconTrash } from '../icons';

const COLOR_HEX: Record<string, string> = {
  rose: '#ff8fc0', rouge: '#e5484d', orange: '#ff9a3c', jaune: '#ffd84d', vert: '#5ec46a', turquoise: '#3cc8c0', bleu: '#4f8dff',
  violet: '#9a6bff', marron: '#9b6a43', beige: '#e8d2a8', crème: '#fff3d1', blanc: '#ffffff', gris: '#a0a4ab', noir: '#2b2b30',
};

export function PetSheet({ id, list, onClose, onNavigate }: { id: string | null; list: string[]; onClose: () => void; onNavigate: (id: string) => void }) {
  const s = store.use();
  const ui = useUI();
  const pet = id ? s.catalog?.byId.get(id) : undefined;
  const item = (id && s.items.get(id)) || emptyItem(id ?? '');
  const photoUrl = id ? s.photoUrls.get(id) : undefined;
  const [imgIndex, setImgIndex] = useState(0);
  const [note, setNote] = useState(item.note ?? '');
  const [dir, setDir] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImgIndex(0);
    setNote(store.get().items.get(id ?? '')?.note ?? '');
  }, [id]);

  const pos = id ? list.indexOf(id) : -1;
  const go = (delta: number) => {
    const next = list[pos + delta];
    if (!next) return;
    sfx.select();
    setDir(delta);
    onNavigate(next);
  };
  const saveNote = () => {
    if (id && (note.trim() || undefined) !== item.note) updateItem(id, { note: note.trim() || undefined });
  };

  const imageCount = photoUrl ? 1 : (pet?.img ? 1 : 0) + (pet?.alt?.length ?? 0);
  const fam = FAMILIES.find((f) => f.id === pet?.fam);

  return (
    <Sheet
      open={!!pet}
      onClose={() => {
        saveNote();
        onClose();
      }}
      tall
      title={
        pet && (
          <span className="sheet-title-num">
            <span className={`gen-pill ${pet.gen.toLowerCase()}`}>{pet.gen}</span> {petNumber(pet)}
          </span>
        )
      }
    >
      {pet && (
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={pet.id} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.18 }}>
            <div className="detail-hero">
              <motion.div
                className={`detail-img${item.have ? ' have' : ''}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
                onClick={() => imageCount > 1 && (sfx.tick(), setImgIndex((i) => (i + 1) % imageCount))}
              >
                <PetImage pet={pet} photoUrl={photoUrl} eager index={photoUrl ? 0 : imgIndex} />
                {item.have && <span className="have-stamp">Je l’ai !</span>}
              </motion.div>
              {imageCount > 1 && (
                <div className="dots">
                  {Array.from({ length: imageCount }, (_, i) => (
                    <span key={i} className={i === imgIndex ? 'on' : ''} />
                  ))}
                </div>
              )}
              {pos >= 0 && list.length > 1 && (
                <div className="detail-nav">
                  <button className="icon-btn" disabled={pos <= 0} onClick={() => go(-1)} aria-label="Figurine précédente">
                    <IconBack width={20} height={20} />
                  </button>
                  <span className="muted small">
                    {pos + 1} / {list.length}
                  </span>
                  <button className="icon-btn" disabled={pos >= list.length - 1} onClick={() => go(1)} aria-label="Figurine suivante">
                    <IconChevron width={20} height={20} />
                  </button>
                </div>
              )}
            </div>

            <h2 className="detail-title">{petTitle(pet)}</h2>
            <p className="muted detail-sub">
              {fam?.emoji} {pet.species ?? 'Espèce inconnue'}{' '}
              · {pet.year ? `${pet.yearApprox ? 'vers ' : ''}${pet.year}` : 'année inconnue'} · {pet.era}
            </p>

            <div className="big-actions">
              <motion.button className={`big-toggle have${item.have ? ' on' : ''}`} whileTap={{ scale: 0.94 }} onClick={() => toggleHave(pet.id)} aria-pressed={item.have}>
                <motion.span key={String(item.have)} initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
                  <IconCheck width={22} height={22} strokeWidth={3} />
                </motion.span>
                {item.have ? 'Je l’ai !' : 'Je l’ai'}
              </motion.button>
              <motion.button className={`big-toggle want${item.want ? ' on' : ''}`} whileTap={{ scale: 0.94 }} onClick={() => toggleWant(pet.id)} aria-pressed={item.want}>
                <motion.span key={String(item.want)} initial={{ scale: 0.4 }} animate={{ scale: [0.4, 1.3, 1] }} transition={{ duration: 0.35 }}>
                  <IconHeart width={22} height={22} fill={item.want ? 'currentColor' : 'none'} />
                </motion.span>
                Je la cherche
              </motion.button>
            </div>

            <section className="card">
              <div className="row-between">
                <div>
                  <h3>En double</h3>
                  <p className="muted small">Exemplaires en plus, pour échanger</p>
                </div>
                <div className="stepper">
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setDupes(pet.id, item.dupes - 1)} disabled={item.dupes <= 0} aria-label="Un double de moins">
                    −
                  </motion.button>
                  <motion.span key={item.dupes} initial={{ scale: 1.5 }} animate={{ scale: 1 }}>
                    {item.dupes}
                  </motion.span>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setDupes(pet.id, item.dupes + 1)} aria-label="Un double de plus">
                    +
                  </motion.button>
                </div>
              </div>
            </section>

            <section className="card">
              <h3>État</h3>
              <div className="chip-row wrap">
                {CONDITIONS.map((c) => (
                  <Chip key={c.id} active={item.condition === c.id} onClick={() => updateItem(pet.id, { condition: item.condition === c.id ? undefined : c.id })}>
                    {c.emoji} {c.label}
                  </Chip>
                ))}
              </div>
              <h3 className="mt">Accessoires</h3>
              <div className="chip-row wrap">
                {ACCESSORIES.map((a) => (
                  <Chip key={a.id} active={item.acc === a.id} onClick={() => updateItem(pet.id, { acc: item.acc === a.id ? undefined : a.id })}>
                    {a.label}
                  </Chip>
                ))}
              </div>
            </section>

            <section className="card">
              <h3>Ma note</h3>
              <textarea className="note" rows={3} placeholder="Où je l’ai trouvée, son prix, un souvenir…" value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote} maxLength={2000} />
            </section>

            <section className="card">
              <div className="row-between">
                <div>
                  <h3>Ma photo</h3>
                  <p className="muted small">{photoUrl ? 'Elle remplace l’image du catalogue.' : 'Prends ta figurine en photo.'}</p>
                </div>
                <div className="row-gap">
                  {photoUrl && (
                    <button
                      className="icon-btn"
                      aria-label="Retirer ma photo"
                      onClick={async () => {
                        if (await ui.confirm({ title: 'Retirer ta photo ?', message: 'L’image du catalogue reviendra.', confirmLabel: 'Retirer', danger: true })) void removePhoto(pet.id);
                      }}
                    >
                      <IconTrash width={18} height={18} />
                    </button>
                  )}
                  <button className="btn soft sm" onClick={() => (sfx.click(), fileRef.current?.click())}>
                    <IconCamera width={18} height={18} /> {photoUrl ? 'Changer' : 'Ajouter'}
                  </button>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void setPhoto(pet.id, f);
                  e.target.value = '';
                }}
              />
            </section>

            <MoldCard petId={pet.id} onShowAll={(mold) => {
              setFilters({ mold, q: '', gen: 'all', status: 'all', fam: null, species: null, year: null, line: null });
              saveNote();
              onClose();
              ui.goTab('collection');
            }} />

            <section className="card">
              <h3>Fiche</h3>
              <dl className="facts">
                <dt>Numéro</dt>
                <dd>{petNumber(pet)}</dd>
                <dt>Génération</dt>
                <dd>{pet.gen === 'G2' ? `G2 (Hasbro) · ${pet.era}` : 'G7 (relance 2024)'}</dd>
                <dt>Espèce</dt>
                <dd>{pet.species ?? '—'}</dd>
                {pet.name && (
                  <>
                    <dt>Nom</dt>
                    <dd>{pet.name}</dd>
                  </>
                )}
                <dt>Année</dt>
                <dd>{pet.year ? `${pet.year}${pet.yearApprox ? ' (estimée)' : ''}` : '—'}</dd>
                {pet.colors?.length ? (
                  <>
                    <dt>Couleurs</dt>
                    <dd className="colors">
                      {pet.colors.map((c) => (
                        <span key={c} className="color-chip">
                          <i style={{ background: COLOR_HEX[c] ?? '#ccc' }} />
                          {c}
                        </span>
                      ))}
                      <span className="muted small"> (estimées)</span>
                    </dd>
                  </>
                ) : null}
              </dl>
              {pet.sets.length > 0 && (
                <>
                  <h3 className="mt">Sortie dans</h3>
                  <ul className="sets">
                    {pet.sets.map((st) => (
                      <li key={st.label}>
                        <strong>{st.label}</strong>
                        {st.year ? ` · ${st.year}` : ''}
                        {st.with && <span className="muted small"> — avec {st.with.replace(/ and /g, ' et ').replace(/other pets?/i, 'autres')}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="muted small mt">Photo : {pet.src === 'toysisters' ? 'Toy Sisters' : 'LPSMerch'} (affichée depuis le site d’origine).</p>
            </section>
          </motion.div>
        </AnimatePresence>
      )}
    </Sheet>
  );
}

/** Le moule de la figurine : affiché, et corrigeable à la main s'il est « à vérifier » (ou faux). */
function MoldCard({ petId, onShowAll }: { petId: string; onShowAll: (mold: string) => void }) {
  const catalog = store.useSel((s) => s.catalog);
  const override = store.useSel((s) => s.items.get(petId)?.mold);
  const [editing, setEditing] = useState(false);
  const pet = catalog?.byId.get(petId);
  const options = useMemo(() => (catalog ? [...catalog.molds.values()].sort((a, b) => a.fr.localeCompare(b.fr, 'fr')) : []), [catalog]);
  if (!pet || !catalog) return null;
  const current = override ?? pet.mold;
  const uncertain = pet.moldGuess && !override;
  return (
    <section className="card">
      <div className="row-between">
        <div>
          <h3>Moule</h3>
          <p className="mold-name">
            🧩 <strong>{moldName(catalog.molds, current)}</strong>
            {!override && pet.moldV ? <span className="muted small"> · {pet.moldV}</span> : null}
          </p>
          {uncertain && <p className="small warn">À vérifier : moule déduit de l’espèce, pas confirmé par les bases de collectionneurs.</p>}
          {override && <p className="small muted">Corrigé à la main (catalogue : {moldName(catalog.molds, pet.mold)}).</p>}
        </div>
        <button className="btn soft sm" onClick={() => (sfx.click(), onShowAll(current))}>
          Voir le moule
        </button>
      </div>
      {editing ? (
        <div className="mold-edit">
          <select
            className="select"
            value={current}
            onChange={(e) => {
              setMoldOverride(pet.id, e.target.value);
              setEditing(false);
            }}
          >
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fr}
                {m.en !== m.fr ? ` (${m.en})` : ''}
              </option>
            ))}
          </select>
          {override && (
            <button className="link" onClick={() => (setMoldOverride(pet.id, undefined), setEditing(false))}>
              Revenir au moule du catalogue
            </button>
          )}
        </div>
      ) : (
        <button className="link" onClick={() => (sfx.click(), setEditing(true))}>
          {uncertain ? 'Corriger le moule' : 'Ce n’est pas le bon moule ?'}
        </button>
      )}
    </section>
  );
}
