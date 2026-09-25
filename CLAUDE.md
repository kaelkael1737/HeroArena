# Projet : Hero Arena (nom provisoire) — cahier des charges

Ce document décrit un jeu de héros inspiré de l'ancien "Cointiply Arena", reconstruit autour de NFT sur la blockchain WAX.
L'objectif immédiat est un **site de test** pour valider le gameplay, puis une version reliée au **testnet WAX**.

Langue de l'interface : **français**.

---

## 1. Concept général

- Chaque héros est un **NFT (standard AtomicAssets)** détenu par le joueur.
- Le jeu fonctionne par **saisons**. Pendant une saison, le joueur envoie ses héros en **missions**, récolte des **ressources**, fabrique de l'**équipement** et fait progresser ses héros.
- Chaque saison se termine par un **tournoi final** (combats 1 contre 1 à élimination).
- Après le tournoi, **toute la progression saisonnière retombe à zéro**. Le NFT du héros, lui, reste au joueur.
- La progression dépend du **temps et des choix du joueur**, pas de l'argent dépensé. Il n'y a **pas de cagnotte en argent réel** dans cette version (voir section 10).

---

## 2. Plan de développement

### Phase 1 — Prototype sans blockchain (à faire en premier)
- Front-end complet avec des données simulées (mock) et un faux "portefeuille" local.
- Logique de jeu (missions, XP, artisanat, combats, fin de saison) dans un module TypeScript isolé et **testé unitairement**, pour pouvoir la porter ensuite dans le smart contract.
- Un panneau "admin/debug" pour : accélérer le temps, terminer une mission instantanément, lancer le tournoi, démarrer une nouvelle saison.

### Phase 2 — Testnet WAX
- Smart contract en C++ (Antelope CDT) déployé sur le testnet WAX.
- Collection, schémas et modèles AtomicAssets sur le testnet.
- Connexion par WAX Cloud Wallet et Anchor.
- Hasard via l'oracle RNG officiel de WAX (`orng.wax`).

Ne pas commencer la phase 2 tant que la phase 1 n'est pas jouable de bout en bout.

---

## 3. Stack suggérée

- Front : React + Vite + TypeScript, Tailwind CSS.
- État : Zustand ou équivalent léger.
- Tests : Vitest pour la logique de jeu.
- Phase 2 : `@waxio/waxjs`, Anchor (via `@wharfkit/session` ou UAL), API AtomicAssets pour lire les NFT.
- Toutes les valeurs d'équilibrage (durées, taux, recettes, courbe d'XP) dans **un seul fichier de configuration** (`src/game/config.ts`), faciles à modifier.

---

## 4. Les héros

### Attributs
| Attribut | Rôle |
|---|---|
| Chance | Facteur aléatoire en combat, chance de ressources rares en mission |
| Force | Puissance d'attaque |
| Santé | Résistance |
| Énergie | Nombre de missions simultanées / récupération |
| Agilité | Esquive, rapidité |

### Données permanentes (immuables dans le NFT)
- `name`, `image`, `description` (apparence)
- `rarity` (commun, peu commun, rare, épique, légendaire)
- Attributs de base : `base_luck`, `base_strength`, `base_health`, `base_energy`, `base_agility`
- `rarity_score` = somme pondérée des attributs de base (la Chance compte davantage)

### Données saisonnières (modifiables)
- `season_id` : numéro de la saison où le héros a progressé
- `level`, `xp`
- `unspent_points` : points d'attribut à répartir
- `bonus_luck`, `bonus_strength`, `bonus_health`, `bonus_energy`, `bonus_agility`

### Données d'historique (modifiables, jamais remises à zéro)
- `best_rank`, `total_wins`, `titles` (liste), `badges` (liste)

### Liste de départ
Générer **40 héros originaux** (aucun personnage existant ou protégé) :
- Répartition suggérée : 16 communs, 12 peu communs, 7 rares, 4 épiques, 1 légendaire.
- Total des attributs de base selon la rareté (valeurs indicatives) : commun 50–70, peu commun 70–90, rare 90–115, épique 115–140, légendaire 150+.
- Profils variés : certains axés Chance, d'autres Force, Agilité, etc.
- Stocker la liste dans `src/game/data/heroes.json`.
- Images : placeholders générés (initiales + couleur de rareté) en phase 1.

---

## 5. Saisons et remise à zéro

- Une saison dure N jours (config, par défaut 28 jours), puis le tournoi dure 24 h.
- Le contrat stocke `current_season`.
- **Reset paresseux** : on ne modifie pas tous les NFT à la fin de la saison. Quand un héros est lu ou utilisé, si `hero.season_id != current_season`, il est traité comme niveau 0 (XP, points et bonus à zéro), puis mis à jour au premier usage.
- Ce qui est conservé : données permanentes + historique.
- Récompenses de fin de saison selon le classement : titre, badge, élément cosmétique (aura, cadre). Aucun avantage de puissance durable par défaut.
- Option (désactivée par défaut, dans la config) : petit bonus de départ pour les vétérans.

---

## 6. Progression pendant la saison

### XP et niveaux
- Sources d'XP : missions et combats d'entraînement (gagnés ou perdus).
- Courbe d'XP dans la config (ex. `xp_requis(niveau) = 100 * niveau^1.5`).
- À chaque niveau : le joueur reçoit des points à **répartir lui-même** entre les attributs.

### Paliers d'évolution
- Aux niveaux 10, 25, 50 (config) : le héros évolue (effet visuel + petit bonus ou compétence débloquée).

### Fusion (optionnelle, à implémenter après le reste)
- Brûler un héros pour transférer une partie de ses attributs de base (ex. 10 %) en bonus saisonnier sur un autre héros.

---

## 7. Missions

- Le joueur envoie un héros dans une **zone** pour une **durée** donnée. Pendant la mission, le héros est bloqué.
- Au retour : XP + ressources.
- Nombre de missions simultanées limité (dépend de l'Énergie ou d'un plafond global, config).

### Zones
| Zone | Ressources principales | Niveau conseillé |
|---|---|---|
| Forêt | Bois, Herbes, Cuir | 0+ |
| Mine | Minerai de fer, Pierre, Cristal | 5+ |
| Marais | Écailles, Os de monstre, Herbes | 15+ |
| Volcan | Essences élémentaires, Mithril, Cœur de dragon | 30+ |

### Durées
- Courte (1 h), moyenne (4 h), longue (8 h), expédition (24 h).
- Plus c'est long, plus il y a de ressources et plus la chance de ressources rares augmente.
- La **Chance** du héros augmente la probabilité de ressources rares.

---

## 8. Ressources et artisanat

### Ressources (soldes stockés dans le contrat, pas des NFT)
| Rareté | Ressources |
|---|---|
| Commune | Bois, Minerai de fer, Cuir, Pierre |
| Peu commune | Acier, Écailles, Herbes, Os de monstre |
| Rare | Cristal, Mithril, Plume de phénix, Essence de feu, Essence de glace, Essence de foudre |
| Légendaire | Cœur de dragon, Fragment d'étoile |

- Transformation : 3 minerais de fer → 1 acier (atelier de fonte).

### Recettes de départ (toutes dans la config)
| Objet | Ingrédients | Effet |
|---|---|---|
| Épée en fer | 3 minerai de fer + 1 bois | +Force |
| Armure de cuir | 5 cuir | +Agilité |
| Bouclier d'écailles | 4 écailles + 2 bois | +Santé |
| Amulette de cristal | 1 cristal + 2 os de monstre | +Chance |
| Potion d'énergie | 3 herbes | +Énergie temporaire |
| Lame de feu | 2 mithril + 1 essence de feu | +Force + effet spécial |

Ajouter une dizaine de recettes supplémentaires cohérentes avec cette liste.

### Équipement
- Chaque objet fabriqué est un **NFT d'équipement** (phase 2) ou un objet local (phase 1).
- Emplacements : arme, armure, bouclier, amulette.
- **Décision par défaut : l'équipement est saisonnier** (il porte un `season_id` et devient inutilisable à la saison suivante). Rendre ce comportement configurable, car ce choix n'est pas encore définitif.

---

## 9. Combats et tournoi final

### Formule de combat (inspirée de l'original, à ajuster)
Pour chaque héros :
1. Tirer un facteur de chance aléatoire entre 1 et sa Chance totale.
2. Pour chaque attribut (Force, Santé, Énergie, Agilité) : tirer un nombre entre 1 et la valeur de l'attribut, le multiplier par le facteur de chance.
3. Additionner, puis multiplier par le niveau.
4. Le score le plus élevé gagne.

Garder la formule dans une fonction pure, testée, et paramétrable.

### Tournoi
- En fin de saison, tous les héros inscrits sont appariés par niveau proche (élargir la plage si pas d'adversaire).
- Élimination directe par rondes jusqu'au champion.
- Chaque combat est enregistré (graine aléatoire + résultat) pour pouvoir afficher un **replay visuel**.
- Récompenses : titres, badges, cosmétiques, et historique mis à jour.

### Entraînement
- Combats d'entraînement contre des adversaires générés, pour gagner de l'XP pendant la saison.

---

## 10. Contraintes importantes

- **Pas de cagnotte en argent réel** ni de mécanique "payer pour une chance de gagner" : ce type de mécanique peut être qualifié de jeu d'argent (notamment en France). Toute évolution dans ce sens doit rester désactivée tant qu'un avis juridique n'a pas été obtenu.
- Aucun personnage, nom ou visuel appartenant à un autre jeu ou à Cointiply.
- Le smart contract devra être audité avant tout déploiement sur le mainnet.
- Ne jamais faire confiance au front-end : en phase 2, toutes les règles (durées, récompenses, recettes, combats) sont vérifiées par le contrat.

---

## 11. Pages du site

1. **Accueil** : présentation, saison en cours, compte à rebours.
2. **Mes héros** : liste des NFT du joueur, niveau, attributs, équipement, répartition des points.
3. **Missions** : choix de zone et de durée, missions en cours avec minuteur, récupération des récompenses.
4. **Inventaire** : ressources et équipement.
5. **Atelier** : recettes, fabrication, fonte.
6. **Arène** : entraînement, inscription au tournoi, résultats et replays.
7. **Classement** : classement de la saison et palmarès historique.
8. **Debug** (phase 1 uniquement) : contrôle du temps et des saisons.

---

## 12. Phase 2 — notes techniques WAX

- Collection AtomicAssets avec schémas `heroes` et `equipment`. Les attributs de base sont des données immuables ; la progression saisonnière et l'historique sont des données modifiables, mises à jour par le contrat (compte autorisé de la collection).
- Actions du contrat à prévoir (noms indicatifs) : `startmission`, `endmission`, `craft`, `smelt`, `equip`, `unequip`, `spendpoints`, `train`, `registertour`, `runround`, `newseason`, `setconfig`.
- Hasard : requêtes à `orng.wax` avec callback ; ne jamais utiliser le bloc ou l'horodatage comme source d'aléa.
- Commencer par le testnet ; vérifier les endpoints et versions des bibliothèques dans la documentation officielle de WAX au moment du développement.

---

## 13. Première tâche pour Claude Code

1. Initialiser le projet (React + Vite + TypeScript + Tailwind + Vitest).
2. Créer `src/game/config.ts` et `src/game/data/heroes.json` (40 héros).
3. Implémenter la logique de jeu pure (missions, XP, artisanat, combat, reset de saison) avec tests.
4. Construire les pages de la phase 1 avec des données simulées et le panneau de debug.
5. S'arrêter et faire un point avant d'attaquer la phase 2.
