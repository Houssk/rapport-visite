# CLAUDE.md : rapport de visite de risque (tablette)

L'utilisateur n'est pas développeur. Réponds en français, phrases courtes, sans jargon (un terme technique inévitable = une ligne d'explication). Fais toi-même tout ce que les connecteurs permettent ; pour une action manuelle : étapes numérotées, clic par clic, lien direct.

## Règles fixes
- **Aucune donnée client sur un serveur** : tout reste dans le navigateur de la tablette (IndexedDB via `lib/stockage.ts`), le PDF est généré sur place (`lib/pdf.ts`). N'ajoute ni base de données, ni envoi réseau des réponses ou photos, sans accord explicite de l'utilisateur et sans le noter dans `docs/SPEC.md`.
- **Connecteur Vercel : ne jamais passer `teamId` ni `slug`** (provoque un 403 sur un compte Hobby).
- Pas de logo ni de marque d'une compagnie dans le dépôt sans confirmation écrite que l'usage est autorisé ; sinon un emplacement `[Logo de la compagnie]`.
- Avant chaque push : `npm run verifier-formulaires`, `npm run build`, `npm run test:parcours` doivent passer.
- Avant toute action irréversible : expliquer et attendre l'accord.

## Mise en place (quand on te demande « mets en place le projet <nom> »)
Tableau OK / KO à chaque étape ; au premier KO bloquant, dis exactement quoi cliquer et arrête-toi.
1. Vérifie : push possible sur ce dépôt ; connecteur Vercel (`list_projects` sans `teamId`) répond ; `npm ci`, `npm run verifier-formulaires`, `npm run build`, `npm run test:parcours` passent.
2. Vercel : `create_project` (sans `teamId`) nom `<nom>`, framework `nextjs`, `gitRepository` = ce dépôt (`type: github`). Aucune variable d'environnement n'est nécessaire. Si `repo_not_found` : faire passer l'App GitHub Vercel en « All repositories » (README), puis réessayer.
3. `create_deployment` target `production` depuis `main` ; suivre avec `get_deployment` jusqu'à `READY` ; l'URL réelle est dans `alias`.
4. Remplis `SETUP.md` (URL, date), commit, push. Termine par : comment l'installer sur l'écran d'accueil de la tablette, et la recette de `docs/TESTS.md` (partie tablette).

## Ajouter un formulaire (à partir d'un PDF dans `sources/`)
1. Lis le PDF en entier. Liste ses sections et questions dans l'ordre, sans en inventer ni en oublier ; repère les cases à cocher (→ `ouinon`, `choix`, `multi`), les nombres (→ `nombre` avec unité), les dates, les zones de texte libre (→ `observation`), les emplacements photo ou pièces jointes (→ `photos`, `attestation`), et les questions qui ne s'appliquent que si une autre réponse vaut X (→ `si`).
2. **Design** : montre à l'utilisateur ce tableau (section / question / type / obligatoire / condition) et la règle de qualification proposée (dans quels cas ce formulaire est ajouté). Attends son OK.
3. Crée `formulaires/<id>.json` (même structure que `multirisque.json` ; `id` = nom du fichier ; ids de champs uniques et parlants ; `"source": "sources/<fichier>.pdf"`). Importe-le dans `lib/formulaires.ts` (`FORMULAIRES`). Ajoute sa règle dans `formulaires/qualification.json` (et la question ou l'option manquante si besoin).
4. Supprime les formulaires d'exemple qu'il remplace (après accord).
5. Test puis livraison comme ci-dessous.

## Déroulé de toute évolution : design → spec → test → livraison
Attends le « OK » de l'utilisateur à la fin de chaque étape. Une évolution à la fois.
1. **Design** : reformule le besoin en une phrase ; montre ce qui change (écran de la tablette ou page du rapport). Si l'outil Artifact est disponible, mets à jour ou crée une maquette ; sinon décris chaque écran touché, textes exacts compris. Respecte `docs/MAQUETTE.md` (tablette tenue debout : gros boutons, réponses en un geste).
2. **Spec** : ajoute une section à `docs/SPEC.md` : objectif, règles, ce qui change dans le rapport PDF, critères « c'est fini quand… » vérifiables.
3. **Test** : complète d'abord `scripts/test-parcours.cjs` ou `scripts/verifier-formulaires.mjs` si l'évolution le permet, et `docs/TESTS.md` (recette tablette). Puis code. Puis lance `npm run verifier-formulaires`, `npm run build`, `npm run test:parcours` et montre les résultats réels.
4. **Livraison** : commit (message clair en français) et push sur `main` ; suis le déploiement Vercel jusqu'à `READY` ; ligne datée dans `CHANGELOG.md` ; donne la liste exacte des vérifications à faire sur la tablette.

## Architecture
- `formulaires/*.json` : un fichier par formulaire (sections → champs). Types : `texte`, `nombre` (`unite`, `pas`), `date`, `ouinon`, `choix` / `multi` (`options`), `photos`, `attestation` (une photo de document), `observation` (texte long). `obligatoire` ; `si: { champ, egal | different }` pour n'afficher un champ que selon une réponse précédente.
- `formulaires/qualification.json` : questions de qualification et règles « si la réponse contient X → ajouter le formulaire Y ».
- `lib/formulaires.ts` (registre, règles, visibilité, textes du rapport), `lib/stockage.ts` (visites et photos sur la tablette, photos réduites à 1600 px), `lib/pdf.ts` + `lib/charte.ts` (rapport).
- Écrans : `app/ui/Accueil.tsx`, `Qualification.tsx`, `Saisie.tsx`, `Recap.tsx`.
