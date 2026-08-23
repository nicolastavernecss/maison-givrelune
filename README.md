# ❖ Hub de la Maison Givrelune

> « Nés sans titre, élevés par nos actes. »
> Honneur · Loyauté · Mérite — Monnaie : le **Septim**

Hub web complet de la **Maison Givrelune**, maison RP du serveur **Keizaal Online**
(Skyrim SE multijoueur, économie 100 % joueurs). Il **complète le Discord**, il ne
le remplace pas : il prend en charge ce qui demande des tableaux, des totaux et de
la mémoire — permis, inventaires, cours du marché, coûts de fabrication, impayés.

---

## Démarrage

```bash
npm install
npm run setup
npm run dev
```

`npm run setup` génère le client Prisma, crée la base SQLite et l'amorce avec les
référentiels de la Maison : rangs, branches, grades, cercles, Conseil, 18 métiers,
**489 matières**, **390 recettes** (tout l'arbre de fabrication) et la matrice
de permissions.

**Les compteurs démarrent à zéro** — ni prix, ni stock, ni coffre garni : la Maison
saisit ses vraies données. Pour peupler avec un jeu de démonstration :
`npm run db:demo`.

Le site tourne ensuite sur **http://localhost:3000**.

### Les deux comptes fondateurs

**Le mot de passe initial n'est écrit nulle part dans ce dépôt.** Il est engendré
au hasard lors du `npm run setup` et affiché **une seule fois** dans la console :

```
     ┌──────────────────────────────────────────────────────┐
     │  MOT DE PASSE INITIAL — affiché une seule fois       │
     └──────────────────────────────────────────────────────┘
        Corbeau-Ravine-Aubier-73
```

Notez-le, puis changez-le depuis *Mon compte* dès la première connexion. Pour en
imposer un connu d'avance (rejouer un amorçage, par exemple) :

```bash
SEED_PASSWORD="Votre-Mot-De-Passe-Solide-42" npm run db:seed
```

> Rejouer le seed ne réinitialise **jamais** un mot de passe existant : il n'est
> posé qu'à la création du compte.

| Identifiant | Membre | Rang |
|---|---|---|
| `nicolas.varian` | Nicolas Imperium Varian | Patriarche |
| `marcus.varro` | Marcus Varro | Patriarche, couturier |

La Maison démarre vide : aucun autre membre, aucune fonction de Conseil pourvue,
aucun grade attribué. Les vrais membres arrivent de deux façons :

1. ils adressent une **demande de rôle** depuis la page publique, en choisissant
   leurs identifiants — un Patriarche accepte, puis ouvre le compte d'un clic ;
2. ou un Patriarche les crée directement dans *Gouvernance → Membres & rôles*.

Dans les deux cas, **on attribue un rang, une branche, un grade et une fonction de
Conseil, et les droits suivent automatiquement** — rien à cocher permission par
permission. `npm run db:droits` affiche ce que chaque rôle confère.

> Pour retrouver un jeu de compagnons fictifs et des chiffres de démonstration :
> `npm run db:demo`. Pour revenir aux seuls fondateurs : `npm run db:fondateurs`.

### Autres commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run apercu` | Build + serveur de production — la vraie vitesse |
| `npm run db:seed` | Ré-amorce les référentiels (idempotent, compteurs à zéro) |
| `npm run db:demo` | Ré-amorce **avec** un jeu de démonstration chiffré |
| `npm run db:vider` | Remet à zéro prix, stocks, coffre et commandes |
| `npm run db:vider -- --tout` | Idem + registres, opérations, vie et journal |
| `npm run db:fondateurs` | Retire tous les membres sauf les deux fondateurs |
| `npm run db:droits` | Affiche les droits conférés par chaque rang, grade et fonction |
| `npm run db:studio` | Explorateur visuel de la base (Prisma Studio) |

`db:vider` ne touche jamais aux référentiels ni aux membres : c'est une remise à
zéro des chiffres, pas une destruction.

Pour vérifier un build sans perturber le serveur de dev :
`NEXT_DIST_DIR=.next-verif npx next build`

---

## Ce que contient le hub

### Public — pour les nouveaux venus
- **Accueil** : lore, devise, valeurs, les 4 branches et leurs grades, le Conseil, les 18 métiers
- **Histoire** et **Règlement** (les 8 sections), rendus sur parchemin
- **Demande de rôle** : formulaire public qui alimente directement le registre des demandes

### Registres
Patron commun à tous : liste filtrable + formulaire + statut + validation par un gradé
+ horodatage + auteur, avec pastilles de rappel dans la navigation.

- **Droits de passage** (Militaire) · **Patrouilles** (Garde-Chasse) · **Permis de récolte**
- **Missions** · **Objectifs** · **Rapports**
- **Contrats** · **Alliances** · **Boîte-aux-lettres**
- **Commerce** (achat / vente / troc)

### Économie — le cœur
- **Cours du marché** : chaque membre relève les prix qu'il constate ; le site en tire
  courbe, moyenne, min/max et variation. Fiche par matière avec graphique et historique.
- **Stock commun** et **stash personnel** : valorisés au cours du jour, alertes de seuil bas,
  historique nominatif des mouvements, photos des pièces.
- **Ateliers-métiers** : bibliothèque de recettes éditable, **chaînes de production**
  (minerai → lingot, peau → cuir → lanières) et **calculateur de coût** :
  - *coût au marché* — les composants directs au dernier cours,
  - *coût chaîne complète* — en remontant chaque palier jusqu'à la matière brute,
  - *prix conseillé* — coût × (1 + marge réglable),
  - *faisabilité* — combien on peut en produire avec le stock commun ou son stash.
- **Commandes** : le gabarit du Discord au champ près, reste à payer calculé,
  pré-remplissage du coût matière depuis une recette.
- **Impayés** : tableau de bord dédié, groupé par client, avec encaissement en un clic
  (et versement direct au coffre).
- **Trésorerie** (privée) : coffre, valeur du stock, créances, courbe et journal des mouvements.

### Craft — fabriquer pour de vrai, et compter ce que ça rapporte

Un onglet par atelier (Forge, Alchimie, Enchantement, Couture, Joaillerie, Cuisine,
Tannage, Bois), et **trois vues dans chaque atelier** :

**1. Fabriquer.** On choisit où puiser — *stock commun* ou *stash personnel* — et le
bouton *Fabriquer* :

- vérifie la disponibilité de chaque composant et affiche précisément ce qui manque,
- **déduit les composants** du stock choisi,
- **y range l'objet produit**,
- **inscrit le revenu** au nom de l'artisan,
- **verse 35 % au coffre** de la Maison, avec mouvement de trésorerie,
- consigne chaque mouvement nominativement, plus une entrée au journal d'audit.

Tout se fait en une seule transaction : soit la fabrication passe entièrement, soit
rien ne bouge.

**2. Prix des matières.** Chaque atelier saisit ce qu'il **paie réellement** ses
matières. Ce prix prime sur le cours du marché dans le calcul du coût de revient —
le forgeron qui achète son minerai moins cher voit sa vraie marge, pas une marge
théorique. Case vide = retour au cours.

**3. Revenus.** Le tableau **brut → taxe 35 % → net**, plus le coût matière et le
bénéfice. Chacun voit ses propres chiffres ; les Patriarches, le Sénéchal et
l'Intendant voient le total de l'atelier et la ventilation par artisan.

**390 recettes**, réparties sur les huit ateliers :

| Atelier | Recettes | Contenu |
|---|---|---|
| **Forgeron** | 168 | 11 paliers (fer → écailles de dragon) × 14 gabarits (cuirasse, casque, gantelets, bottes, bouclier, dague, épée, hache, masse, deux-mains, hache d'armes, marteau, arc, flèches) + les fontes |
| **Bijoutier** | 56 | 2 métaux × 4 formes × 7 sertissages (nu + 6 gemmes) |
| **Alchimiste** | 34 | Soins, magie, vigueur, résistances, élixirs de fortification, poisons |
| **Couturier** | 33 | Tissage, vêtements courants, cuir, pièces de cour, livrées de branche |
| **Cuisinier** | 33 | Soupes, ragoûts, grillades, pâtisseries, boissons |
| **Enchanteur** | 31 | 10 effets d'arme, 10 d'armure, 8 de bijou |
| **Chasseur** | 26 | Tannage de 14 peaux + apprêt des fourrures |
| **Bûcheron** | 8 | Planches, poutres, manches, charbon, coke, briquettes |

Trois axes sont **engendrés** plutôt que recopiés — l'armurerie, la joaillerie et
l'enchantement suivent un schéma régulier, exactement comme dans le jeu. Ajouter un
palier de métal ou une gemme crée automatiquement toutes les pièces correspondantes.

> Les noms d'objets et d'ingrédients suivent Skyrim. Les quantités de l'armurerie
> sont celles de l'armurerie vanilla ; pour l'alchimie, les **associations
> d'effets** sont un point de départ signalé comme tel dans chaque recette —
> ajustez-les à l'équilibrage de Keizaal depuis l'atelier, sans redéploiement.

> Le taux de taxe se change en une ligne : `TAUX_TAXE` dans `src/lib/domain.ts`. Le
> taux appliqué est figé dans chaque ligne de production — le modifier ne réécrit
> jamais l'historique.

### Comptes rendus de production

Chaque jour et chaque semaine écoulés sont **figés en compte rendu** et versés aux
**Archives** : un pour toute la Maison, un par atelier, avec la ventilation par
artisan et par objet. La journée en cours s'affiche à part, en direct.

Aucune tâche planifiée n'est nécessaire : le rattrapage se fait à la consultation,
en trois lectures et une écriture groupée. C'est ce qui permet au hub de tourner sur
n'importe quel hébergement gratuit, sans cron ni service en arrière-plan. Les
périodes sans production ne sont pas écrites — un jour sans forge n'a pas de compte
rendu.

### Vie de la Maison
Annonces (épinglables, par branche) · Calendrier avec RSVP · **Présence** · Galerie de captures RP.

**Présence — prise de poste.** Chacun clique « Je prends mon poste » en arrivant, et
choisit son état : *disponible*, *occupé* ou *en patrouille*. Le tableau montre qui est
là en direct (il se rafraîchit tout seul), et un gradé du Garde-Chasse **compose une
ronde en un clic** depuis les membres présents : il coche, donne la zone, et la
patrouille est créée au registre — les participants passant automatiquement « en
patrouille ». Un poste oublié cesse d'être compté au bout de 8 h. Les absences
prolongées restent déclarées séparément (règlement §VII).

### Gouvernance
Demandes de rôle · Membres & rôles (création de compte, métiers, **droits individuels**)
· Sanctions (§VIII) · Tickets · Archives · **Journal d'audit**.

---

## Comment fonctionnent les permissions

Un membre combine : **un rang** + (souvent) **une branche & un grade** + éventuellement
**une fonction de Conseil** + éventuellement **un cercle** + un ou plusieurs **métiers**.

Ses droits effectifs sont l'**union** des permissions du rang, du grade et de la fonction
de Conseil, **corrigée** par les octrois ou retraits individuels
(*Gouvernance → Membres & rôles → Droits*).

Règles amorcées par le seed, conformes au cahier des charges :

| Qui | Ce qu'il peut |
|---|---|
| Patriarches | Tout (`admin.full`) |
| Hauts-Pères | Lire, créer et valider partout ; trésorerie et stocks communs |
| Pères | Lire et créer ; examen des demandes de rôle |
| Fils | Lire ; soumettre permis, rapports, tickets, relevés de prix, son stash |
| Grade 1 (chef de branche) | Valide les registres de **sa** branche |
| Grades 2 et 3 | Créent les entrées de **leur** branche |
| Grade 4 (Recrue, Pisteur, Apprenti) | Lecture seule |
| Sénéchal | Administration des membres, rôles, sanctions, archives, audit |
| Intendant | Trésorerie, stocks communs, référentiel des matières, marché |
| Champion | Missions, droits de passage, rapports |
| Prêtre | Événements, annonces, validation des absences |
| Mage | Recettes, matières |

Tout se modifie sans redéploiement : rangs, branches, grades, métiers, matières et
recettes sont des données, pas du code.

---

## Authentification & sécurité

### Comment on entre dans la Maison

Le candidat remplit la **demande de rôle** et y choisit lui-même son **email**, son
**identifiant** et son **mot de passe**. Le mot de passe est haché à la réception :
la demande ne contient que son empreinte bcrypt. Un gradé examine, un Patriarche
tranche, puis **un clic ouvre le compte** avec les identifiants que le candidat a
choisis — rien à transmettre, personne n'a jamais vu le mot de passe.

**L'inscription libre reste impossible** : tant que la demande n'est pas acceptée,
aucun compte n'existe. Un compte Discord n'ouvre une session que s'il est déjà
rattaché à un membre, ou si un gradé a renseigné son pseudo Discord sur sa fiche.

### Politique de mot de passe

Un mot de passe est refusé s'il :

- fait moins de **12 caractères** ;
- figure dans la **liste embarquée** des mots de passe les plus compromis — comparée
  après normalisation « leet », donc `P@ssw0rd` est refusé comme `password` ;
- apparaît dans les **fuites de données publiques** : vérification chez Have I Been
  Pwned par **k-anonymat**, où seuls les cinq premiers caractères de l'empreinte
  SHA-1 quittent le serveur. Ni le mot de passe ni son empreinte complète ne sont
  jamais transmis. Si le service ne répond pas, on ne bloque pas : les deux
  premières lignes de défense suffisent ;
- contient un mot du contexte (`givrelune`, `skyrim`, `keizaal`, `septim`…) ou
  votre identifiant, votre nom RP ou votre email ;
- contient une suite de touches (`azerty`, `1234`, `abcd`), quatre fois le même
  caractère, ou un motif court répété ;
- mélange moins de trois familles de caractères sans atteindre 16 caractères.

La même exigence s'applique partout : demande de rôle, création par un gradé,
changement en libre-service. **L'administration ne contourne pas la politique.**

### Blocage après échecs

Cinq tentatives, puis blocage **30 s**, qui s'allonge ensuite : 60 s, 2 min, 5 min,
15 min. Le compteur est tenu **en base**, par identifiant *et* par adresse — il
survit à un redémarrage et fonctionne sur plusieurs instances. Le message indique
les essais restants avant blocage, puis un décompte.

Le décompte affiché n'est qu'un affichage : le blocage est vérifié côté serveur à
chaque tentative. Réactiver le bouton dans le navigateur ou recharger la page ne
permet pas d'essayer plus tôt, même avec le bon mot de passe.

### Ce qui ne passe jamais par le navigateur

- Les **règles de refus** et la liste des mots de passe compromis vivent dans un
  module marqué `server-only` : le compilateur refuse le build si quelqu'un tente
  de l'importer côté client. Le navigateur ne reçoit qu'un indicateur de robustesse
  purement structurel, qui n'autorise ni ne refuse rien.
- Les **montants** sont recalculés côté serveur : reste à payer, coût de revient,
  revenu brut, taxe. Un champ modifié dans le navigateur n'a aucun effet.
- Les **autorisations** sont revérifiées dans chaque action serveur, jamais
  déduites de ce que l'interface affiche. Masquer un bouton ne protège rien ;
  l'accès direct à l'URL est refusé de la même façon.

### Autres mesures

| Mesure | Détail |
|---|---|
| Hachage | bcrypt, coût 12 (~250 ms par vérification) |
| Sessions | Cookie signé HMAC-SHA256, `httpOnly`, `sameSite=lax`, `secure` en production |
| Révocation | Changer de mot de passe invalide **toutes** les autres sessions |
| Énumération | Message et temps de réponse identiques que le compte existe ou non |
| En-têtes | CSP stricte, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS en production |
| Fichiers | Type vérifié par **signature binaire**, pas par le type déclaré ; nom assaini ; 8 Mo maximum |
| Formulaire public | Le seul accessible sans compte : validé par schéma, limité par adresse et par nom |
| Élévation de privilège | Nul ne se nomme à son propre rang ni au-dessus, ne modifie sa propre fiche d'administration, ni ne s'accorde de droits |
| Traçabilité | Échecs de connexion, changements de mot de passe et actions sensibles au journal d'audit |

### Activer Discord

1. https://discord.com/developers/applications → **New Application** → onglet **OAuth2**
2. Redirect URI à déclarer : `http://localhost:3000/api/auth/discord/callback`
   (en production : `https://votre-domaine/api/auth/discord/callback`)
3. Copier `CLIENT_ID` et `CLIENT_SECRET` dans `.env`

**Synchronisation des rôles (optionnelle)** — en renseignant aussi `DISCORD_GUILD_ID`
et `DISCORD_BOT_TOKEN`, le site lit les rôles Discord du membre à la connexion et les
fait correspondre aux rangs, branches, grades et fonctions de Conseil **par comparaison
de libellés** (insensible à la casse et aux accents : un rôle Discord « Haut-Père »
correspond au rang « Haut-Père »).

La synchronisation ne peut qu'**élever ou compléter** : elle ne rétrograde jamais
personne et n'écrase pas une branche ou un grade déjà attribué. Les rétrogradations
restent une décision humaine.

---

## Mise en ligne

**Guide complet et pas à pas : [DEPLOIEMENT.md](DEPLOIEMENT.md).**

En résumé : **Vercel + Neon**, gratuits tous les deux, sans carte bancaire, une
vingtaine de minutes.

> ⚠️ **Un hébergement mutualisé ne fonctionnera pas** — Hostinger « Hébergement
> Web », OVH mutualisé, o2switch et consorts sont des serveurs PHP. Ce hub est
> une application Node.js : il lui faut un processus permanent. Voir le tableau
> comparatif dans [DEPLOIEMENT.md](DEPLOIEMENT.md).

Le schéma est écrit pour être portable : aucun enum SQL, aucun type natif
spécifique. La bascule tient en une commande :

```bash
npm run db:postgres
```

Elle change la ligne `provider` du schéma. Il reste à mettre l'URL PostgreSQL
dans `DATABASE_URL`, puis `npx prisma db push && npm run db:seed`.
`npm run db:sqlite` fait le chemin inverse.

La recherche textuelle s'adapte toute seule : SQLite ignore la casse d'office,
PostgreSQL non — le code ajoute `mode: "insensitive"` uniquement quand il détecte
une URL PostgreSQL.

Variables à définir chez l'hébergeur :

```
DATABASE_URL=postgresql://…      # chaîne « pooled » de Neon
AUTH_SECRET=<48 octets aléatoires>
NEXT_PUBLIC_APP_URL=https://votre-domaine
DISCORD_CLIENT_ID=…              # facultatif
DISCORD_CLIENT_SECRET=…          # facultatif
```

Générer `AUTH_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> **Les images sont stockées en base**, pas sur le disque : c'est délibéré, les
> hébergements gratuits ayant un système de fichiers éphémère. Les captures RP
> survivent donc aux redéploiements. Contrepartie : elles consomment le quota de
> stockage — voir [DEPLOIEMENT.md](DEPLOIEMENT.md) pour les options si cela
> devient serré.


## Personnaliser

| Ce que vous voulez faire | Où |
|---|---|
| Ajouter une matière | Depuis le site : *Économie → Matières* |
| Ajouter ou corriger une recette | Depuis le site : *Économie → Ateliers → l'atelier concerné* |
| Créer un membre, changer un rang | Depuis le site : *Gouvernance → Membres & rôles* |
| Modifier le règlement ou l'histoire | Table `SitePage` (ou `prisma/seed-data.ts` avant amorçage) |
| Ajouter un métier, une branche, un grade | `prisma/seed-data.ts`, puis `npm run db:seed` |
| Ajouter une permission | `src/lib/domain.ts` (`PERMISSION_CATALOG`), puis `npm run db:seed` |
| **Ajouter un registre entier** | Une entrée dans `src/lib/registres.ts` + un fichier `page.tsx` de 12 lignes |
| Changer les couleurs, la typo | `src/app/globals.css` (bloc `@theme`) |
| Modifier l'emblème | `src/components/ui/Embleme.tsx` |

### Le moteur de registres

Dix modules (droits de passage, patrouilles, permis, missions, objectifs, rapports,
contrats, alliances, correspondances, commerce) partagent un seul moteur. Chacun est
**décrit**, pas codé : champs, colonnes, statuts, permissions et transitions de
validation vivent dans `src/lib/registres.ts`. La liste filtrable, le formulaire,
le tableau responsive et les boutons de validation en sont engendrés.

Ajouter un onzième registre demande une entrée dans ce fichier, une entrée dans
`src/lib/navigation.ts`, et un `page.tsx` qui tient en douze lignes.

---

## Architecture

```
prisma/
  schema.prisma        Modèle de données complet (~35 tables)
  seed-data.ts         Référentiels Givrelune : rangs, branches, métiers, matières, recettes
  seed.ts              Amorçage idempotent + données de démonstration
src/
  app/
    (site)/            Pages publiques : accueil, histoire, règlement, rejoindre
    (app)/             Espace connecté (barre latérale, permissions)
    actions/           Server actions par domaine
    api/               Retour OAuth Discord, service des pièces jointes
  components/
    ui/                Emblème, icônes, cartes, tableaux, courbes SVG, formulaires
    layout/            Coquille applicative
    registre/          Moteur de registres générique
    economie/          Inventaires et recettes
  lib/
    domain.ts          Vocabulaire : permissions, statuts, nomenclatures
    auth.ts            Session, connexion, calcul des droits
    economie.ts        Cours, calcul de coût récursif, faisabilité, valorisation
    registres.ts       Description des dix registres
    navigation.ts      Arborescence de la barre latérale
```

**Stack** : Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma ·
SQLite → PostgreSQL. Aucune librairie de graphiques : les courbes du cours du marché
sont du SVG écrit à la main. Aucune librairie d'icônes : le jeu d'icônes est
sur-mesure, une icône par branche, par fonction de Conseil et par métier.

---

## Sauvegarde

**SQLite** — copiez `prisma/givrelune.db`. C'est toute la Maison, images comprises.

**PostgreSQL** — `pg_dump "$DATABASE_URL" > givrelune.sql`

---

*Le givre forge notre patience. La lune éclaire notre destinée. Nos actes écriront notre nom.*
