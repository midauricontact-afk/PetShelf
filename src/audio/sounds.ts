/**
 * Petits effets sonores mignons, générés avec la Web Audio API : aucun fichier audio, aucun droit d'auteur.
 * (Sur iPhone, le commutateur « silencieux » peut couper ces sons.)
 */

let ctx: AudioContext | null = null;
let config = { enabled: true, volume: 0.5 };

export function configureSound(c: { enabled: boolean; volume: number }) {
  config = c;
}

function audio(): AudioContext | null {
  if (!config.enabled || config.volume <= 0) return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOptions {
  freq: number;
  start?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** Glissando vers cette fréquence pendant la note. */
  slideTo?: number;
}

function tone(c: AudioContext, o: ToneOptions, bus: AudioNode) {
  const t0 = c.currentTime + (o.start ?? 0);
  const dur = o.dur ?? 0.18;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
  const peak = (o.gain ?? 0.2) * config.volume;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Un léger écho pour donner de l'air aux notes. */
function withEcho(c: AudioContext, wet = 0.25): AudioNode {
  const input = c.createGain();
  const delay = c.createDelay(0.6);
  const feedback = c.createGain();
  const out = c.createGain();
  delay.delayTime.value = 0.18;
  feedback.gain.value = 0.28;
  out.gain.value = wet;
  input.connect(c.destination);
  input.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(out).connect(c.destination);
  return input;
}

function play(fn: (c: AudioContext, bus: AudioNode) => void, echo = false) {
  const c = audio();
  if (!c) return;
  try {
    fn(c, echo ? withEcho(c) : c.destination);
  } catch {
    /* le son ne doit jamais casser l'app */
  }
}

/** Petit couinement de jouet : une montée rapide avec un léger trémolo. */
function squeak(c: AudioContext, bus: AudioNode, start = 0, base = 900, gain = 0.12) {
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  const g = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(base, t0);
  osc.frequency.exponentialRampToValueAtTime(base * 1.9, t0 + 0.09);
  osc.frequency.exponentialRampToValueAtTime(base * 1.5, t0 + 0.16);
  lfo.frequency.value = 38;
  lfoGain.gain.value = base * 0.06;
  lfo.connect(lfoGain).connect(osc.frequency);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(gain * config.volume, 0.0002), t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  osc.connect(g).connect(bus);
  osc.start(t0);
  lfo.start(t0);
  osc.stop(t0 + 0.22);
  lfo.stop(t0 + 0.22);
}

// Notes (Hz).
const N = { c5: 523.25, e5: 659.25, g5: 783.99, a5: 880, c6: 1046.5, e6: 1318.5, g6: 1568, g4: 392 };

/** Volontairement silencieux : un son à chaque appui (bouton, onglet, option…) faisait trop. */
const quiet = () => undefined;

export const sfx = {
  /** Toucher un bouton : silencieux. */
  click: quiet,
  /** Choisir une option, un onglet : silencieux. */
  select: quiet,
  /** Ouvrir une fiche : silencieux. */
  open: quiet,
  /** Fermer / revenir : silencieux. */
  back: quiet,
  /** Interrupteur : silencieux. */
  toggle: quiet,
  /** Cocher « Je l'ai » : pop + couinement joyeux. */
  check: () =>
    play((c, b) => {
      tone(c, { freq: 420, slideTo: 900, dur: 0.06, type: 'sine', gain: 0.16 }, b);
      squeak(c, b, 0.05, 1000, 0.1);
    }),
  /** Décocher : un petit « bloup » qui descend. */
  uncheck: () => play((c, b) => tone(c, { freq: 620, slideTo: 300, dur: 0.12, type: 'sine', gain: 0.12 }, b)),
  /** Ajouter à la wishlist : deux notes en cœur. */
  wish: () =>
    play((c, b) => {
      tone(c, { freq: N.a5, dur: 0.12, type: 'triangle', gain: 0.12 }, b);
      tone(c, { freq: N.e6, start: 0.08, dur: 0.18, type: 'triangle', gain: 0.1 }, b);
    }, true),
  /** Petit couinement seul (doubles, compteur…). */
  squeak: () => play((c, b) => squeak(c, b, 0, 1100, 0.1)),
  /** Série complétée ou palier atteint : petite fanfare de victoire. */
  victory: () =>
    play((c, b) => {
      [N.c5, N.e5, N.g5, N.c6].forEach((f, i) => tone(c, { freq: f, start: i * 0.1, dur: 0.22, type: 'square', gain: 0.05 }, b));
      [N.e6, N.g6].forEach((f, i) => tone(c, { freq: f, start: 0.45 + i * 0.12, dur: 0.5, type: 'triangle', gain: 0.1 }, b));
      tone(c, { freq: N.g4, start: 0.4, dur: 0.8, type: 'sine', gain: 0.08 }, b);
      squeak(c, b, 0.75, 1200, 0.08);
    }, true),
  /** Étincelle (confettis, figurine du jour). */
  sparkle: () => play((c, b) => [N.c6, N.e6, N.g6].forEach((f, i) => tone(c, { freq: f, start: i * 0.05, dur: 0.15, type: 'sine', gain: 0.06 }, b)), true),
  /** Petit cran (curseur, changement de photo) : silencieux. */
  tick: quiet,
};
