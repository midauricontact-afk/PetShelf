import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { sfx } from '../../audio/sounds';
import { backupFileName } from '../../core/backup';
import { SORTS } from '../../core/filters';
import { ACCENTS, THEMES } from '../../core/themes';
import { exportBackup, importBackup, resetAll, store, toast, updateSettings } from '../../state/store';
import { Btn, Chip, Segmented, Switch } from '../components/primitives';
import { useUI } from '../ctx';
import { IconDownload, IconTrash, IconUpload } from '../icons';

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function SettingsScreen() {
  const s = store.use();
  const st = s.settings;
  const ui = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const doExport = async (withPhotos: boolean) => {
    setBusy(true);
    try {
      const text = await exportBackup(withPhotos);
      const name = backupFileName();
      const file = new File([text], name, { type: 'application/json' });
      // Sur iPhone, la feuille de partage permet d'enregistrer dans Fichiers ou iCloud Drive.
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Sauvegarde PetShelf' }).catch(() => undefined);
      else downloadText(name, text);
      toast('Sauvegarde prête 💾', 'ok');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (file: File) => {
    const replace = await ui.confirm({
      title: 'Comment importer ?',
      message: '« Remplacer » efface ta collection actuelle. Sinon, les deux sont fusionnées (la version la plus récente de chaque figurine gagne).',
      confirmLabel: 'Remplacer',
      cancelLabel: 'Fusionner',
      danger: true,
    });
    setBusy(true);
    try {
      const r = await importBackup(await file.text(), replace ? 'replace' : 'merge');
      sfx.victory();
      toast(`${r.items.length} figurines importées${r.skipped ? ` (${r.skipped} ignorées)` : ''}`, 'ok');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import impossible', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">Réglages</p>
          <h1>À ton goût</h1>
        </div>
      </header>

      <h2 className="section-title">Apparence</h2>
      <section className="card">
        <h3>Thème</h3>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <motion.button
              key={t.id}
              className={`theme-card${st.themeId === t.id ? ' active' : ''}`}
              style={{ background: `linear-gradient(135deg, ${t.blobs[0]}, ${t.blobs[1]})` }}
              whileTap={{ scale: 0.94 }}
              onClick={() => (sfx.select(), updateSettings({ themeId: t.id, accent: null }))}
            >
              <span className="theme-dot" style={{ background: t.accent }} />
              <strong>{t.name}</strong>
              <small>{t.hint}</small>
            </motion.button>
          ))}
        </div>
        <h3 className="mt">Mode</h3>
        <Segmented
          value={st.mode}
          options={[
            { id: 'auto', label: 'Automatique' },
            { id: 'light', label: 'Clair' },
            { id: 'dark', label: 'Sombre' },
          ]}
          onChange={(mode) => updateSettings({ mode })}
        />
        <h3 className="mt">Couleur d’accent</h3>
        <div className="accent-row">
          <button className={`accent-swatch auto${!st.accent ? ' active' : ''}`} onClick={() => (sfx.select(), updateSettings({ accent: null }))} aria-label="Couleur du thème">
            A
          </button>
          {ACCENTS.map((c) => (
            <motion.button key={c} className={`accent-swatch${st.accent === c ? ' active' : ''}`} style={{ background: c }} whileTap={{ scale: 0.85 }} onClick={() => (sfx.select(), updateSettings({ accent: c }))} aria-label={`Accent ${c}`} />
          ))}
        </div>
      </section>

      <h2 className="section-title">Galerie</h2>
      <section className="card">
        <h3>Taille des vignettes</h3>
        <Segmented
          value={st.thumb}
          options={[
            { id: 's', label: 'Petites' },
            { id: 'm', label: 'Moyennes' },
            { id: 'l', label: 'Grandes' },
          ]}
          onChange={(thumb) => updateSettings({ thumb })}
        />
        <h3 className="mt">Tri par défaut</h3>
        <div className="chip-row wrap">
          {SORTS.map((so) => (
            <Chip key={so.id} active={st.sort === so.id} onClick={() => updateSettings({ sort: so.id })}>
              {so.label}
            </Chip>
          ))}
        </div>
        <div className="row-between mt">
          <span>Afficher les noms sous les vignettes</span>
          <Switch checked={st.showNames} onChange={(showNames) => updateSettings({ showNames })} label="Afficher les noms" />
        </div>
        <div className="row-between mt">
          <span>Confettis à chaque nouvelle figurine</span>
          <Switch checked={st.celebrate} onChange={(celebrate) => updateSettings({ celebrate })} label="Confettis" />
        </div>
      </section>

      <h2 className="section-title">Sons</h2>
      <section className="card">
        <div className="row-between">
          <span>Effets sonores</span>
          <Switch checked={st.sound} onChange={(sound) => updateSettings({ sound })} label="Effets sonores" />
        </div>
        <label className={`volume mt${st.sound ? '' : ' disabled'}`}>
          <span>🔈</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={st.volume}
            disabled={!st.sound}
            style={{ ['--pct' as string]: `${st.volume * 100}%` }}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            onPointerUp={() => sfx.check()}
            aria-label="Volume"
          />
          <span>🔊</span>
        </label>
        <p className="muted small">Sur iPhone, le bouton « silencieux » coupe aussi ces sons.</p>
      </section>

      <h2 className="section-title">Sauvegarde</h2>
      <section className="card">
        <p className="small">Ta collection est enregistrée seulement sur ce téléphone. Fais une sauvegarde de temps en temps (dans Fichiers ou iCloud Drive).</p>
        <div className="stack mt">
          <Btn variant="soft" disabled={busy} onClick={() => doExport(false)}>
            <IconDownload width={18} height={18} /> Exporter (sans photos, léger)
          </Btn>
          <Btn variant="soft" disabled={busy} onClick={() => doExport(true)}>
            <IconDownload width={18} height={18} /> Exporter avec mes photos
          </Btn>
          <Btn variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
            <IconUpload width={18} height={18} /> Importer une sauvegarde
          </Btn>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = '';
          }}
        />
      </section>

      <h2 className="section-title">À propos</h2>
      <section className="card about">
        <p className="small">
          Catalogue du {s.catalog?.version || '—'} : {s.catalog?.pets.filter((p) => p.gen === 'G2').length ?? 0} figurines G2 et {s.catalog?.pets.filter((p) => p.gen === 'G7').length ?? 0} figurines G7.
        </p>
        <p className="small muted">
          Données et photos : bases de fans{' '}
          <a href="https://lpsmerch.com/" target="_blank" rel="noreferrer">
            LPSMerch
          </a>{' '}
          et{' '}
          <a href="https://www.toysisters.com/" target="_blank" rel="noreferrer">
            Toy Sisters
          </a>
          . Les photos appartiennent à leurs auteurs : elles sont affichées depuis leur site d’origine, jamais copiées. Années marquées « vers » et couleurs : estimations.
        </p>
        <p className="small muted">PetShelf est une app de fan, sans lien avec les marques Littlest Pet Shop, Hasbro ou Basic Fun.</p>
        <Btn
          variant="danger"
          onClick={async () => {
            if (await ui.confirm({ title: 'Tout effacer ?', message: 'Ta collection, tes notes et tes photos seront supprimées de ce téléphone. Fais une sauvegarde avant !', confirmLabel: 'Tout effacer', danger: true })) {
              await resetAll();
              toast('Collection effacée', 'info');
            }
          }}
        >
          <IconTrash width={18} height={18} /> Tout effacer
        </Btn>
      </section>
    </div>
  );
}
