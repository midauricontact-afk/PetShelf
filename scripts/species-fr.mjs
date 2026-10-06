// Noms d'espèces (anglais de LPSMerch → français) et grande famille (pour la silhouette de remplacement).
// Familles : chien, chat, lapin, rongeur, oiseau, mer, ours, cheval, ferme, reptile, insecte, sauvage, autre.
const T = {
  chien: {
    Dog: 'Chien', Puppy: 'Chiot', Chihuahua: 'Chihuahua', Poodle: 'Caniche', Husky: 'Husky', Spaniel: 'Épagneul',
    'German Shepherd': 'Berger allemand', Dachshund: 'Teckel', Boxer: 'Boxer', Corgi: 'Corgi', Collie: 'Colley',
    Scottie: 'Scottish terrier', Beagle: 'Beagle', Pug: 'Carlin', 'Jack Russell': 'Jack Russell', 'Basset Hound': 'Basset',
    Bulldog: 'Bouledogue', 'St. Bernard': 'Saint-Bernard', 'Great Dane': 'Dogue allemand', Sheepdog: 'Bobtail',
    Dalmatian: 'Dalmatien', 'Lhasa Apso': 'Lhassa apso', Retriever: 'Retriever', Greyhound: 'Lévrier', 'Chow Chow': 'Chow-chow',
    'Boston Terrier': 'Boston terrier', Maltese: 'Bichon maltais', 'French Bulldog': 'Bouledogue français', Pomeranian: 'Loulou de Poméranie',
    Yorkie: 'Yorkshire', Komondor: 'Komondor', 'Shi Tzu': 'Shih tzu', 'Bull Terrier': 'Bull terrier', Labradoodle: 'Labradoodle',
    Schnautzer: 'Schnauzer', 'Berner Senner': 'Bouvier bernois', Dobermann: 'Dobermann', Sheltie: 'Berger des Shetland',
    'Labrador Retriever': 'Labrador', 'Afghan Hound': 'Lévrier afghan', Wolf: 'Loup',
  },
  chat: {
    Cat: 'Chat', 'Kitten Cat': 'Chaton', Kitten: 'Chaton', 'Cat Shorthair': 'Chat à poil court', 'Persian Cat': 'Chat persan',
    'Cat Persian': 'Chat persan', 'Cat Longhair': 'Chat à poil long', 'Persian Wolf Cat': 'Chat persan', 'Siamese Cat': 'Chat siamois',
    'Cat Siamese': 'Chat siamois', 'Scottish Fold Longhair': 'Scottish fold', 'Cat Himalayan': 'Chat himalayen',
    'Himalayan Cat': 'Chat himalayen', 'Angora Cat': 'Chat angora', 'Maine Coon Cat': 'Maine coon',
  },
  lapin: { Rabbit: 'Lapin', Bunny: 'Lapin', 'Angora Rabbit': 'Lapin angora' },
  rongeur: {
    Mouse: 'Souris', Hamster: 'Hamster', 'Guinea Pig': 'Cochon d’Inde', Squirrel: 'Écureuil', Ferret: 'Furet', Rat: 'Rat',
    Chinchilla: 'Chinchilla', Hedgehog: 'Hérisson', Beaver: 'Castor', 'Sugar Glider': 'Phalanger volant', Possum: 'Opossum',
    Capybara: 'Capybara', Chipmunk: 'Tamia', Meerkat: 'Suricate', Raccoon: 'Raton laveur', Skunk: 'Mouffette', Otter: 'Loutre',
  },
  oiseau: {
    Parakeet: 'Perruche', Owl: 'Chouette', Penguin: 'Pingouin', Cockatoo: 'Cacatoès', Duck: 'Canard', Chick: 'Poussin',
    Peacock: 'Paon', Pigeon: 'Pigeon', Hummingbird: 'Colibri', Pelican: 'Pélican', Quail: 'Caille', Flamingo: 'Flamant rose',
    Ostrich: 'Autruche', Toucan: 'Toucan', Woodpecker: 'Pic-vert', Swan: 'Cygne', Seagull: 'Mouette', Parrot: 'Perroquet',
    Bird: 'Oiseau', Puffin: 'Macareux', 'Kiwi Bird': 'Kiwi', Chicken: 'Poule', Canary: 'Canari', Rooster: 'Coq', 'Blue Heron': 'Héron bleu',
  },
  mer: {
    Fish: 'Poisson', Seahorse: 'Hippocampe', Octopus: 'Pieuvre', Seal: 'Phoque', 'Hermit Crab': 'Bernard-l’ermite', Angelfish: 'Poisson-ange',
    Walrus: 'Morse', Dolphin: 'Dauphin', Whale: 'Baleine', Shark: 'Requin', Clownfish: 'Poisson-clown', Axolotl: 'Axolotl', 'Sea Turtle': 'Tortue de mer',
  },
  ours: { Panda: 'Panda', Bear: 'Ours', 'Polar Bear': 'Ours polaire', Koala: 'Koala', 'Red Panda': 'Panda roux' },
  cheval: { Horse: 'Cheval', Donkey: 'Âne', Zebra: 'Zèbre', Llama: 'Lama', LLama: 'Lama', Camel: 'Chameau' },
  ferme: { Pig: 'Cochon', Lamb: 'Agneau', Cow: 'Vache', Goat: 'Chèvre', Bull: 'Taureau' },
  reptile: {
    Turtle: 'Tortue', Iguana: 'Iguane', Frog: 'Grenouille', Gecko: 'Gecko', Snake: 'Serpent', Crocodile: 'Crocodile',
    Chameleon: 'Caméléon', Lizard: 'Lézard', Dragon: 'Dragon',
  },
  insecte: {
    Butterfly: 'Papillon', Ladybug: 'Coccinelle', Dragonfly: 'Libellule', Snail: 'Escargot', Bee: 'Abeille', Spider: 'Araignée',
    Caterpillar: 'Chenille', Lovebug: 'Lovebug', Ant: 'Fourmi', Firefly: 'Luciole', Moth: 'Papillon de nuit', Bat: 'Chauve-souris',
  },
  sauvage: {
    Monkey: 'Singe', Deer: 'Faon', Fox: 'Renard', Giraffe: 'Girafe', Chimpanzee: 'Chimpanzé', Kangaroo: 'Kangourou', Tiger: 'Tigre',
    Lion: 'Lion', Elephant: 'Éléphant', Leopard: 'Léopard', Sloth: 'Paresseux', Armadillo: 'Tatou', Hippo: 'Hippopotame',
    Anteater: 'Fourmilier', Rhino: 'Rhinocéros', Platypus: 'Ornithorynque', Jaguar: 'Jaguar', Baboon: 'Babouin', Quokka: 'Quokka',
    'Fennec Fox': 'Fennec', Moose: 'Élan', 'Snow Leopard': 'Léopard des neiges', Pangolin: 'Pangolin', Cheetah: 'Guépard',
  },
  autre: { Human: 'Humain', Fairy: 'Fée', Animal: 'Animal' },
};

export const SPECIES_FR = {};
export const FAMILY = {};
for (const [fam, map] of Object.entries(T)) {
  for (const [en, fr] of Object.entries(map)) {
    SPECIES_FR[en] = fr;
    FAMILY[en] = fam;
  }
}
