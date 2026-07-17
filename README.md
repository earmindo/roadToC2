# VocabMaster

Application React (Vite) pour apprendre et retenir le vocabulaire anglais.

## Fonctionnalités

- **Collections automatiques** : Verbes irréguliers (liste complète prédéfinie), Mots maîtrisés, Mots à travailler, Nouveaux mots. Le classement mots maîtrisés/à travailler est calculé automatiquement à partir de vos statistiques de réussite (système de type Leitner, boîtes 0 à 5).
- **Dictionnaire de base** : ~480 des mots anglais les plus fréquents, déjà traduits. Vous pouvez ajouter vos propres mots avec leur traduction depuis l'onglet "Ajouter".
- **4 modes de pratique** :
  - QCM (choisis la bonne traduction parmi 4)
  - Écriture (tape la traduction)
  - Association (relie les mots à leur traduction)
  - Flashcards (retourne la carte façon Anki, auto-évaluation)
- **Tableau de bord** : score global, précision, répartition des mots, points faibles, temps de pratique cumulé, nombre de sessions.
- **100% local** : toutes les données sont stockées dans le `localStorage` du navigateur, aucune connexion réseau nécessaire.

## Lancer en développement

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build
npm run preview
```

Le dossier `dist/` généré est un site statique : il peut être servi tel quel,
ou embarqué dans une app Apache Cordova (copier `dist/` dans `www/` d'un
projet Cordova) pour obtenir une application mobile.

## Notes

- La liste de mots courants (~480 mots) est un point de départ solide, pas
  exactement 1000 mots traduits un par un pour garantir la qualité des
  traductions. Utilisez "Ajouter un mot" pour compléter facilement.
