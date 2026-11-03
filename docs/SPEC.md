# Spécification fonctionnelle

Chaque évolution ajoute une section en bas (déroulé de CLAUDE.md, étape 2).

## 1. Version de départ

**Problème** : Karim imprime la fiche PDF, la remplit à la main pendant la visite, prend des photos à part, puis ressaisit tout au bureau.

**Utilisateur** : Karim, debout, tablette en main, en discussion avec le client.

### Parcours
1. **Mes visites** : visites en cours sur la tablette (client, adresse, formulaires, avancement) ; Reprendre ; Supprimer ; Nouvelle visite.
2. **Qualification** : client et adresse ; questions de `formulaires/qualification.json` ; la liste des formulaires se met à jour en direct selon les règles ; Démarrer.
3. **Saisie** : sections de tous les formulaires retenus (annexes signalées) ; compteur de réponses et coche par section ; types de réponse : oui / non / sans objet, choix, choix multiples, compteur, texte, date, observation, photos (plusieurs, appareil photo ou glisser-déposer), attestation (une photo de document, statut « à photographier » / « ajoutée ») ; questions conditionnelles ; enregistrement automatique ; précédente / suivante.
4. **Vérifier et générer** : par section, ce qui manque (les obligatoires en rouge) ; option « inclure les photos » ; Générer ; Télécharger, Aperçu, Partager ; « Rapport rangé : effacer la visite de la tablette ».

### Rapport PDF
- En-tête (cabinet, date), titre, client et adresse, puis chaque section en bandeau ; questions à gauche, réponses à droite ; « Non renseigné » en orange ; photos en grille légendée sous leur question ; pagination.
- Nom du fichier : `rapport-<client>-<date>.pdf`.

### Règles
- Aucune donnée envoyée sur internet ; les photos sont réduites à 1600 px avant stockage.
- Décision du 2026-11-03 : visites stockées uniquement sur la tablette (pas de base de données serveur) pour démarrer. Conséquences acceptées : pas de reprise sur un autre appareil, perte des visites non terminées si les données du navigateur sont effacées. Une base (Supabase) ne s'ajoute que sur décision explicite, en évolution.
- Une question conditionnelle masquée n'apparaît pas dans le rapport et ne compte pas comme manquante.

### C'est fini quand…
- `npm run verifier-formulaires`, `npm run build` et `npm run test:parcours` passent.
- La recette tablette de `docs/TESTS.md` passe.

### Hors périmètre (prévu ensuite)
- Formulaires réels (à convertir depuis les PDF).
- Mise en page exacte du rapport selon le modèle de la compagnie.
- Signature du client sur la tablette.
