export type Gen = 'G2' | 'G7';

/** Grande famille d'animaux : sert à la silhouette de remplacement et au filtre rapide. */
export type Family = 'chien' | 'chat' | 'lapin' | 'rongeur' | 'oiseau' | 'mer' | 'ours' | 'cheval' | 'ferme' | 'reptile' | 'insecte' | 'sauvage' | 'autre';

export interface PetSet {
  /** « Gamme – Set », par exemple « Pet Pairs – Winter Pals ». */
  label: string;
  year?: number;
  /** Avec qui la figurine était vendue (« #2 and #3 »…). */
  with?: string;
}

/** Une figurine du catalogue (données publiques, en lecture seule). */
export interface Pet {
  id: string;
  gen: Gen;
  /** Sous-période : G2.1, G2.2, G2.3 ou G7. */
  era: string;
  /** Numéro officiel (« 1234 », « T226 »…) ; vide si la figurine n'a pas de numéro connu. */
  num: string;
  name?: string;
  species?: string;
  fam: Family;
  year?: number;
  /** L'année est estimée d'après les numéros voisins. */
  yearApprox?: boolean;
  sets: PetSet[];
  /** Adresse d'origine de la photo (jamais copiée dans l'app). */
  img?: string;
  alt?: string[];
  /** Couleurs dominantes estimées (approximatives). */
  colors?: string[];
  src: string;
}

export type Condition = 'boite' | 'parfait' | 'tresbon' | 'bon' | 'abime';
export type Accessories = 'oui' | 'partiel' | 'non';

/** Ce que je sais de MA figurine (stocké sur le téléphone). */
export interface Item {
  id: string;
  have: boolean;
  want: boolean;
  /** Nombre d'exemplaires en plus (pour les échanges). */
  dupes: number;
  condition?: Condition;
  acc?: Accessories;
  note?: string;
  /** J'ai ajouté ma propre photo. */
  photo?: boolean;
  /** Date où je l'ai cochée. */
  addedAt?: number;
  updatedAt: number;
}

export const CONDITIONS: { id: Condition; label: string; emoji: string }[] = [
  { id: 'boite', label: 'Neuve en boîte', emoji: '📦' },
  { id: 'parfait', label: 'Parfait état', emoji: '✨' },
  { id: 'tresbon', label: 'Très bon', emoji: '😊' },
  { id: 'bon', label: 'Bon', emoji: '🙂' },
  { id: 'abime', label: 'Abîmée', emoji: '🩹' },
];

export const ACCESSORIES: { id: Accessories; label: string }[] = [
  { id: 'oui', label: 'Complets' },
  { id: 'partiel', label: 'En partie' },
  { id: 'non', label: 'Aucun' },
];

export const FAMILIES: { id: Family; label: string; emoji: string }[] = [
  { id: 'chien', label: 'Chiens', emoji: '🐶' },
  { id: 'chat', label: 'Chats', emoji: '🐱' },
  { id: 'lapin', label: 'Lapins', emoji: '🐰' },
  { id: 'rongeur', label: 'Petits mammifères', emoji: '🐹' },
  { id: 'oiseau', label: 'Oiseaux', emoji: '🐦' },
  { id: 'mer', label: 'Animaux marins', emoji: '🐠' },
  { id: 'ours', label: 'Ours & pandas', emoji: '🐼' },
  { id: 'cheval', label: 'Chevaux & cie', emoji: '🐴' },
  { id: 'ferme', label: 'Ferme', emoji: '🐷' },
  { id: 'reptile', label: 'Reptiles & grenouilles', emoji: '🐢' },
  { id: 'insecte', label: 'Petites bêtes', emoji: '🦋' },
  { id: 'sauvage', label: 'Animaux sauvages', emoji: '🦁' },
  { id: 'autre', label: 'Autres', emoji: '✨' },
];

export const emptyItem = (id: string): Item => ({ id, have: false, want: false, dupes: 0, updatedAt: 0 });

/** Un enregistrement vide n'a pas besoin d'être gardé. */
export const isEmptyItem = (it: Item) => !it.have && !it.want && !it.dupes && !it.condition && !it.acc && !it.note && !it.photo;
