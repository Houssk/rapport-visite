# Rapport de visite de risque

Remplace la fiche PDF imprimée : pendant la visite, sur tablette, on répond en touchant l'écran, on prend les photos directement dans la bonne section, on photographie les attestations (extincteurs, contrôle électrique…), puis on génère le rapport PDF au format de la compagnie, sans double saisie au bureau.

- **Qualification** : quelques questions (activité, surface, particularités) choisissent les bons formulaires (tronc commun + annexes).
- **Visite** : sections, réponses en un geste (oui/non, choix, compteurs), photos par section, observations (dictée possible avec le micro du clavier), enregistrement automatique sur la tablette, même sans réseau.
- **Rapport** : PDF généré sur la tablette, téléchargé ou partagé, puis la visite peut être effacée. **Aucune donnée n'est stockée sur un serveur.**

Maquette, spec et tests : dossier [`docs/`](docs/). Les formulaires sont des fichiers dans [`formulaires/`](formulaires/) : on les ajoute ou modifie avec Claude, à partir des PDF existants.

---

## Démarrer (Karim) : ce qu'il faut avant la première session

Une seule fois (environ 10 min) :

1. **Comptes** : GitHub, Vercel (vercel.com, « Continue with GitHub »). Pas besoin de Supabase pour cet outil.
2. **Vercel ↔ GitHub** : github.com > Settings > Applications > Vercel > Configure > **« All repositories »** > Save.
3. **Connecteur Claude** : sur claude.ai > Paramètres > Connecteurs, connecter **Vercel** (accepter tous les droits).
4. **Ton dépôt** : sur la page GitHub de ce modèle, **« Use this template »** > nom (ex. `visites-karim`) > Private > Create.

## Démarrer : la première session Claude Code

Ouvre une session Claude Code (cloud) sur ton nouveau dépôt et colle :

```
Mets en place le projet <nom-du-projet> en suivant la section « Mise en place » de CLAUDE.md.
Enchaîne sans t'arrêter tant que tout est OK. Au premier blocage, dis-moi exactement quoi
cliquer (avec le lien) et arrête-toi. À la fin, donne-moi l'URL et comment l'installer
sur la tablette.
```

Sur la tablette : ouvre l'URL dans le navigateur, puis « Partager > Sur l'écran d'accueil » (iPad) ou « Installer l'application » (Android) : l'outil s'ouvre alors comme une appli.

## Ajouter un vrai formulaire à partir d'un PDF AXA

1. Sur github.com, dans ton dépôt, ouvre le dossier `sources/` > **Add file > Upload files** > dépose le PDF (ex. `visite-multirisque.pdf`) > Commit.
2. Dans une session Claude Code, colle :

```
Nouveau formulaire : convertis sources/<nom-du-fichier>.pdf en formulaire de visite.
Suis la procédure « Ajouter un formulaire » de CLAUDE.md et le déroulé
design → spec → test → livraison, en attendant mon OK à chaque étape.
Il sert pour : <dans quels cas on l'utilise, ex. tous les restaurants>.
```

Claude te montre d'abord la liste des sections et questions qu'il a extraites (tu corriges), puis la règle de qualification, puis il teste et met en ligne.

## Faire évoluer l'outil : le déroulé en 4 étapes

Chaque évolution suit **design → spec → test → livraison**. Claude attend ton « OK » à chaque étape.

```
Nouvelle évolution : <le besoin en une ou deux phrases, avec un exemple concret>.
Suis le déroulé design → spec → test → livraison de CLAUDE.md, et attends mon OK à chaque étape.
```

| Étape | Ce que fait Claude | Ce que tu fais |
|---|---|---|
| 1. Design | Montre ce qui change à l'écran ou dans le rapport | Tu valides ou corriges |
| 2. Spec | Ajoute l'évolution à `docs/SPEC.md` (règles, « c'est fini quand… ») | Tu relis, tu valides |
| 3. Test | Vérifie les formulaires, construit l'appli, joue le parcours complet dans un navigateur | Rien, ou tu réponds à ses questions |
| 4. Livraison | Met en ligne, vérifie le déploiement, note la version dans `CHANGELOG.md`, te donne quoi vérifier sur la tablette | Tu testes sur la tablette, tu dis OK |

## Prompts utiles

```
Ça ne marche pas : <ce que je fais, ce que je vois, ce que j'attendais>. Trouve la cause,
explique-la en une phrase, corrige, et dis-moi comment vérifier.
```
```
Le rapport PDF doit ressembler à ce modèle : sources/<modele>.pdf. Adapte la mise en page
(lib/pdf.ts et lib/charte.ts) en suivant le déroulé de CLAUDE.md.
```

## Limites connues (version de départ)

- Les formulaires fournis sont des **exemples** : à remplacer par les vrais (procédure ci-dessus).
- Le rapport reprend une structure générique : à caler sur le modèle de la compagnie (couleurs, mentions, logo seulement si son usage est autorisé).
- Les visites restent sur la tablette où elles ont été saisies (pas de synchronisation entre appareils). Effacer le navigateur efface les visites non terminées.
