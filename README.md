# QuizzGeo

Application de quiz geographique (pays, iles, capitales, drapeaux) migree sur **Next.js** avec support **PWA**.

## Stack

- Next.js (App Router)
- React 18
- Tailwind CSS (active) + styles UI existants
- Tests Node (`node --test`) + Vitest/jsdom pour React

## Scripts

```bash
npm install
npm run dev
npm test
npm run build
npm run start
```

## URL locale

- Dev: `http://localhost:3000`

## Structure principale

```text
app/
  layout.js
  page.jsx
  components/
    QuizApp.jsx
  hooks/
    useQuizApp.js
  globals.css

public/
  manifest.webmanifest
  sw.js
  icons/

src/
  styles/

tests/
  quiz-logic.test.js
  react/
    quiz-app.react.test.jsx
```

## PWA

- Manifest: `public/manifest.webmanifest`
- Service Worker: `public/sw.js`
- Enregistrement SW: hook React dans `app/hooks/useQuizApp.js`

## Notes

- Les points d entree `.html` ont ete supprimes. L entree unique est Next.js (`app/page.jsx`).
- Le rendu + la gestion d etat quiz sont maintenant en composants/hooks React.
- Les regles metier de validation restent centralisees dans `quiz-logic.js`.
