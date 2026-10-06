# PetShelf 🐾

Ma collection de figurines **Littlest Pet Shop** des générations **G2** (Hasbro, 2004-2012) et **G7** (la relance Basic Fun de 2024), dans une jolie app pour iPhone.

Toutes les figurines sont visibles avec leur photo. Je coche celles que j'ai, je note celles que je cherche et mes doubles, et je suis ma progression.

**Ma collection reste sur mon téléphone** (dans le navigateur). Rien n'est envoyé nulle part.

## Ce que fait l'app

- **Galerie** de toutes les figurines G2 et G7 avec photo, numéro et une pastille « Je l'ai » (un seul appui).
- **Cochage rapide ⚡** : toute la vignette devient une case à cocher, idéal pour remplir sa collection la première fois.
- **Fiche détaillée** : « Je la cherche » (wishlist), « En double » avec quantité, état (neuve en boîte, parfait, très bon, bon, abîmée), accessoires (complets, en partie, aucun), note personnelle, **ma propre photo** (elle remplace l'image du catalogue), sets d'origine, année, couleurs. On passe à la figurine suivante en glissant la photo.
- **Recherche** par numéro (« 1234 », « #1234 », « T226 »), nom, espèce, couleur, set ou année. Plusieurs mots possibles : « chat rose 2008 ».
- **Filtres** : génération, famille d'animaux, espèce, année, gamme, et possédées / manquantes / wishlist / doubles. Plusieurs ordres de tri.
- **Progrès** : pourcentage global et par génération, par famille, année, espèce et gamme. Badges à 1, 10, 25, 50, 100… figurines. Séries complètes.
- **Mes listes** : wishlist, doubles, dernières ajoutées, **liste d'échange à partager** (Messages, WhatsApp…), **figurine du jour** et séries **presque complètes**.
- **Célébrations** : confettis à chaque nouvelle figurine, fanfare quand une série est complète ou un palier atteint.
- **Sons mignons** (pop, couinements, victoire), fabriqués par le code : aucun fichier audio. On peut les couper et régler le volume.
- **Personnalisation** : 8 thèmes, mode clair / sombre / automatique, couleur d'accent, taille des vignettes, tri par défaut, noms sous les vignettes, confettis.
- **Sauvegarde** : export JSON (avec ou sans mes photos) et import (fusion ou remplacement).
- **Hors connexion** : l'app s'ouvre sans internet, et les photos déjà vues restent en mémoire sur le téléphone.

## Mettre l'app en ligne (une seule fois)

1. Sur GitHub, crée un dépôt **public vide** nommé `PetShelf`.
2. Envoie le code :
   ```bash
   git remote add origin https://github.com/midauricontact-afk/PetShelf.git
   git push -u origin main
   ```
3. Sur GitHub, va dans **Settings › Pages** et choisis la source **GitHub Actions**.
4. Une minute plus tard, l'app est en ligne sur `https://midauricontact-afk.github.io/PetShelf/`.

## L'installer sur l'iPhone

1. Ouvre l'adresse de l'app dans **Safari**.
2. Touche le bouton **Partager**, puis **Sur l'écran d'accueil**.
3. Ouvre PetShelf depuis sa nouvelle icône : elle s'affiche en plein écran, comme une vraie app.

## Le catalogue

Le catalogue est le fichier `src/data/catalog.json`. Il contient pour chaque figurine : numéro officiel, nom (s'il existe), espèce, année, sets / packs d'origine, couleurs dominantes, génération et l'**adresse** de sa photo.

### Les sources

- [LPSMerch](https://lpsmerch.com/) : la base de fans la plus complète (numéros, noms, espèces, gammes, sets, années, photos). Leur découpage est plus fin que celui des collectionneurs : leurs « G1 + G2 + G3 » (#1 à #2675) forment la **G2** Hasbro, et leur « G7 » est la relance Basic Fun.
- [Toy Sisters](https://www.toysisters.com/) : guide illustré par numéro, utilisé pour **recouper** les numéros et compléter ceux qui manquaient.

Les deux sites autorisent la lecture de ces pages (fichier `robots.txt`). Le script respecte leurs délais (20 secondes entre deux pages chez Toy Sisters) et s'identifie honnêtement.

### Les photos

Les photos appartiennent à leurs auteurs. **Aucune image n'est copiée dans le dépôt** : le catalogue ne garde que leur adresse d'origine. Le téléphone les affiche depuis leur site, puis les garde en mémoire pour aller plus vite et marcher hors connexion. Si une image ne charge pas, une silhouette mignonne de l'espèce s'affiche à la place.

### Ce qui est estimé

- **Années « vers… »** : quand la source ne donne pas l'année, elle est estimée d'après les numéros voisins (les numéros suivent l'ordre de sortie).
- **Couleurs** : calculées automatiquement à partir d'une toute petite vignette de chaque photo (le fond est retiré). C'est approximatif, mais pratique pour chercher « chat rose ».
- **Accessoires** : les sources ne listent pas les accessoires de façon fiable. On note donc soi-même si les accessoires sont complets, en partie ou absents.

### Mettre à jour le catalogue

Quand de nouvelles figurines G7 sortent :

```bash
npm install
npm run catalog -- --colors
```

- Le script télécharge les pages (gardées dans `scripts/.cache`, ignoré par git). Pour tout reprendre de zéro, supprime ce dossier.
- `--colors` recalcule les couleurs des nouvelles figurines.
- `--no-toysisters` saute le recoupement (beaucoup plus rapide).

Ensuite : `npm test`, puis `git commit` et `git push`. Ma collection n'est pas touchée : chaque figurine garde son identifiant (`g2-1234`, `g7-56`).

## Pour les curieux

```bash
npm install
npm run dev      # développement
npm test         # tests (catalogue, filtres, progression, sauvegarde)
npm run build    # version de production (dossier dist)
```

Technos : Vite, React, TypeScript, Framer Motion, IndexedDB (`idb`), Web Audio. Service worker fait main.

PetShelf est une app de fan pour un usage personnel, sans lien avec les marques Littlest Pet Shop, Hasbro ou Basic Fun, et n'utilise ni leurs logos ni leurs marques.
