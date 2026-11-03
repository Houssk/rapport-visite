# Tests

## 1. Automatiques (Claude, avant chaque push)
- `npm run verifier-formulaires` : formulaires JSON cohérents (ids uniques, types connus, options présentes, conditions qui visent une question existante, règles de qualification valides, formulaires importés).
- `npm run build` : l'application se construit.
- `npm run test:parcours` : dans un vrai navigateur, crée une visite « Restaurant », vérifie que l'annexe cuisson est proposée, qu'une question conditionnelle apparaît, ajoute une photo, génère et télécharge le PDF et vérifie qu'il contient l'image.

## 2. Recette sur la tablette (Karim, environ 10 min)
1. Ouvrir l'appli depuis l'écran d'accueil. Nouvelle visite, client « Test », activité « Restaurant » : l'annexe cuisson apparaît à droite.
2. Démarrer. Section Bâtiment : « Bâtiment mitoyen » = Oui → la question « Activité du voisin mitoyen » apparaît.
3. Prendre deux photos de la façade avec l'appareil de la tablette : elles s'affichent dans la section.
4. Protection incendie : photographier une attestation (n'importe quelle feuille) → « Attestation ajoutée ».
5. Passer la tablette en mode avion, répondre à quelques questions, fermer l'appli, la rouvrir : Reprendre, tout est là.
6. Terminer → les manques sont listés → Générer → Aperçu : réponses, « Non renseigné » en orange, photos sous leur section.
7. Télécharger (ou Partager vers le dossier client), puis « Rapport rangé : effacer la visite » → elle disparaît de « Mes visites ».

Chaque évolution ajoute ses cas ici.
