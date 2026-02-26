# Quiz Drapeau - Quiz Pays et Capitales

Application web de quiz pour apprendre les drapeaux, les pays/iles et les capitales.

Le projet est pense pour un entrainement rapide, avec plusieurs modes de jeu, des filtres par zones, un mode erreurs persistant, et un support PWA (installation + cache offline).

## Fonctionnalites principales

- 4 types de quiz:
- `Quiz Pays` (drapeau -> pays/ile)
- `Quiz Capitales` (pays -> capitale)
- `Quiz Pays + Capitale` (drapeau -> pays/ile + capitale)
- `Capitale -> Pays` (capitale -> pays/ile)

- Selection de parcours:
- Continents et zones dediees (Oceanie, Amerique du Nord, Amerique du Sud, Asie, Antarctique, Afrique, Europe, Iles)
- `Tour du Monde`
- `Sprint 15`
- `Melange Libre` (selection multi-zones avec filtres)
- `Revision Ciblee` (mode erreurs, visible seulement si des erreurs existent)

- Parametrage avance:
- Nombre de questions configurable (`all`, 5, 10, 15, 20, 30, 50)
- Filtres par zone: `Tout`, `Pays uniquement`, `Iles uniquement`, `Ignorer`
- Changement de mode en cours de partie
- Nouveau tirage aleatoire a la demande

- UX quiz:
- Progression visuelle
- Score live + score final
- Bouton `Voir` pour afficher/masquer la reponse
- Zoom drapeau en modal
- Auto-scroll vers la prochaine question
- Auto-capitalisation des saisies

- Gestion des erreurs:
- Erreurs sauvegardees en `localStorage`
- Rejouer uniquement les erreurs restantes
- Une erreur corrigee sort automatiquement du mode erreurs
- Boutons de reinitialisation des erreurs

- PWA:
- Manifest + Service Worker
- Cache des assets applicatifs pour usage offline partiel

## Regles de validation des reponses

- Tolerance accents/casse/ponctuation/tirets.
- Tolerance sur certains pluriels et variations (`ile`/`iles`, etc.).
- Alternates et aliases supportes (ex: `USA`, `NZE`, `Vatican`).
- En `Capitale -> Pays`, si plusieurs pays partagent une meme capitale, n importe lequel est accepte.
- Pour les entrees avec capitale `Inconnue/Inconnu`, ces reponses sont valides:
- champ vide
- `inconnu` ou `inconnue`
- `non`
- `rien`

## Structure du projet

```text
quizz.html
styles.css
app.js
quiz-logic.js
data.js
pwa.js
sw.js
manifest.webmanifest

src/
  js/modules/
    constants.js
    state.js
    dom.js
    icons.js
    renderers.js
    storage.js
    quiz-app.js
  styles/
    tokens.css
    layout.css
    components.css
    responsive.css

tests/
  quiz-logic.test.js
  app-modules.test.js
  dom-integration.test.js
```

## Stack technique

- HTML/CSS/JavaScript vanilla
- Architecture modulaire front (`src/js/modules`)
- Tests natifs Node (`node --test`)
- Tests DOM avec `jsdom`

## Installation et lancement

## 1) Installer les dependances

```bash
npm install
```

## 2) Lancer les tests

```bash
npm test
```

## 3) Lancer l application en local

Option simple:

- Ouvrir `quizz.html` dans le navigateur.

Option recommandee (pour PWA/Service Worker):

```bash
npx serve .
```

Puis ouvrir l URL locale affichee (ex: `http://localhost:3000/quizz.html`).

## Donnees et personnalisation

Les donnees sont centralisees dans `data.js`.

Chaque entree suit ce format:

```js
{
  country: "Nom",
  capital: "Capitale",
  code: "xx", // code ISO alpha-2 pour FlagCDN
  alternates: ["..."], // optionnel (capitales alternatives)
  countryAlternates: ["..."] // optionnel (noms de pays alternatifs)
}
```

Notes:

- Ajouter un nouveau continent dans `QUIZ_DATA` le rend disponible dans les modes automatiquement.
- Les iles sont detectees via `ISLAND_CODES` (utile pour les filtres `Iles uniquement`).

## PWA et offline

- `pwa.js` enregistre le Service Worker `sw.js`.
- `sw.js` met en cache le shell de l app et les fichiers statiques.
- Le cache est versionne via `CACHE_NAME` dans `sw.js`.

## Qualite et tests

Politique de tests (voir `TESTING.md`):

- Toute nouvelle fonctionnalite doit ajouter ou mettre a jour des tests.
- Toute correction de bug doit inclure un test de non-regression.
- Avant livraison: executer `npm test`.

## Remarques

- Les drapeaux sont charges depuis `flagcdn.com` via les codes pays.
- En mode offline complet, certains drapeaux distants peuvent dependre du cache navigateur/reseau.
