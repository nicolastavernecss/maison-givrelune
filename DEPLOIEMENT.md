# ❖ Mettre le hub en ligne

> Pour que les membres de la Maison y accèdent depuis n'importe où.

---

## D'abord : ce qui ne marchera pas

Le hub est une application **Node.js** (Next.js). Elle a besoin d'un serveur qui
exécute du JavaScript en continu et d'une base **PostgreSQL**.

| Offre | Verdict | Pourquoi |
|---|---|---|
| **Hostinger « Hébergement Web »** | ❌ Ne marche pas | Mutualisé PHP/Apache. Pas de processus Node.js permanent. |
| **Hostinger « Cloud »** | ❌ Ne marche pas | Même architecture, juste plus de ressources PHP. |
| OVH mutualisé, o2switch, Ionos perso | ❌ Ne marche pas | Idem : conçus pour WordPress et PHP. |
| **Hostinger VPS** | ⚠️ Marche, mais | Serveur nu : c'est **vous** qui installez Node, PostgreSQL, Nginx, le certificat SSL, et qui gérez les mises à jour et les sauvegardes. |

**Ne payez pas d'hébergement mutualisé pour ce site : il ne démarrera pas.**
Si un vendeur vous dit le contraire, demandez-lui s'il supporte Node.js 20+ avec
un processus permanent — la réponse sera non.

---

## Ce que je recommande : Vercel + Neon

**Gratuit, sans carte bancaire, mise en ligne en une vingtaine de minutes.**

Vercel est l'éditeur de Next.js — c'est le terrain naturel de ce site. Neon
fournit la base PostgreSQL. Les deux ont une offre gratuite qui suffit largement
à une maison RP.

| | Vercel (Hobby) | Neon (Free) |
|---|---|---|
| Prix | 0 € | 0 € |
| Carte bancaire | non | non |
| Domaine `.vercel.app` | inclus | — |
| Domaine à vous | possible (le nom coûte ~10 €/an ailleurs) | — |
| HTTPS | automatique | — |
| Limite | usage « non commercial » | ~0,5 Go de stockage |

### Étape 1 — Mettre le code sur GitHub

```bash
git init
git add .
git commit -m "Hub de la Maison Givrelune"
```

Créez un dépôt **privé** sur github.com, puis suivez les deux lignes que GitHub
affiche pour y pousser le code.

> Le fichier `.env` est déjà ignoré par git : vos secrets ne partiront pas.

### Étape 2 — Créer la base PostgreSQL

1. https://neon.tech → créer un compte (connexion GitHub possible)
2. Créer un projet, région **Europe (Frankfurt)** — le plus proche
3. Copier la chaîne de connexion **« Pooled connection »**
   (elle contient `-pooler`, indispensable en serverless)

Elle ressemble à :
`postgresql://user:motdepasse@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### Étape 3 — Basculer le projet sur PostgreSQL

```bash
npm run db:postgres
```

Puis dans `.env`, remplacez `DATABASE_URL` par la chaîne Neon, et créez les
tables :

```bash
npx prisma db push
npm run db:seed
```

> La recherche bascule automatiquement en insensible à la casse : sur
> PostgreSQL, sans cela, « dorik » ne trouverait plus « Dorik ».

Committez le changement de schéma :

```bash
git add -A && git commit -m "Passage a PostgreSQL" && git push
```

### Étape 4 — Déployer sur Vercel

1. https://vercel.com → **Add New… → Project** → importer le dépôt GitHub
2. Vercel détecte Next.js tout seul, ne touchez à rien
3. Avant de cliquer **Deploy**, ouvrir **Environment Variables** et ajouter :

| Nom | Valeur |
|---|---|
| `DATABASE_URL` | la chaîne Neon *pooled* |
| `AUTH_SECRET` | une longue chaîne aléatoire (voir ci-dessous) |
| `NEXT_PUBLIC_APP_URL` | `https://votre-projet.vercel.app` |

Pour engendrer `AUTH_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. **Deploy**. Deux minutes plus tard, le site est en ligne.

### Étape 5 — Premières précautions

1. Connectez-vous avec `nicolas.varian`
2. **Changez immédiatement le mot de passe** depuis *Mon compte* — celui du
   README est public
3. Créez les comptes des membres, ou envoyez-leur l'adresse `/rejoindre`

---

## Un domaine à votre nom

`givrelune.vercel.app` fonctionne très bien. Si vous préférez
`maison-givrelune.fr` :

1. Acheter le nom (~10 €/an) chez OVH, Gandi, Namecheap…
2. Vercel → projet → **Settings → Domains** → ajouter le domaine
3. Recopier les enregistrements DNS que Vercel indique chez le registrar
4. Mettre à jour `NEXT_PUBLIC_APP_URL` avec la nouvelle adresse

Le certificat HTTPS est automatique et gratuit.

---

## Si vous préférez payer

Rien ne l'exige, mais si vous voulez tout au même endroit ou dépasser les
limites du gratuit :

| Offre | Prix | Pour qui |
|---|---|---|
| **Railway** | ~5 €/mois | Le plus simple des payants : application **et** PostgreSQL au même endroit, déploiement depuis GitHub. Une bonne solution de repli si Neon vous limite. |
| **Render** | ~7 €/mois + ~7 €/mois pour la base | Correct, mais la base gratuite expire — prévoir les deux lignes. |
| **Vercel Pro** | ~20 €/mois | Uniquement si vous dépassez l'offre Hobby. Peu probable pour une maison RP. |
| **VPS** (Hostinger, Hetzner, OVH) | 4 à 8 €/mois | Contrôle total, mais **vous** administrez tout : Node, PostgreSQL, Nginx, SSL, sauvegardes, sécurité. Comptez une bonne demi-journée de mise en place et de l'entretien régulier. |

**Mon conseil : commencez gratuit.** Vous basculerez si un jour ça coince — le
code ne change pas, seule la variable `DATABASE_URL` change.

---

## Le point à surveiller : les images

Les pièces jointes — captures RP, photos d'ateliers — sont stockées **dans la
base**. C'est ce qui rend le site déployable partout sans service tiers, mais
cela consomme le quota de stockage de Neon.

Ordre de grandeur : une capture d'écran compressée pèse 200 Ko à 1 Mo. L'offre
gratuite en absorbe donc plusieurs centaines, ce qui laisse de la marge.

Si un jour la base sature, trois options :

1. Faire le ménage dans la galerie (bouton supprimer sur chaque publication) ;
2. Abaisser la taille maximale — `TAILLE_MAX` dans `src/lib/fichiers.ts`,
   actuellement 8 Mo ;
3. Passer les images sur un stockage dédié (Vercel Blob, Cloudflare R2), tous
   deux avec offre gratuite. Dites-le-moi, je ferai la bascule.

---

## Sauvegardes

Neon garde un historique permettant de revenir en arrière, mais une copie chez
vous ne coûte rien :

```bash
pg_dump "$DATABASE_URL" > givrelune-$(date +%F).sql
```

À faire de temps en temps, et systématiquement avant un gros changement.

---

## Mettre à jour le site

Une fois en place, chaque modification se publie toute seule :

```bash
git add -A
git commit -m "ce que j'ai changé"
git push
```

Vercel reconstruit et met en ligne en une à deux minutes. Si le build échoue,
l'ancienne version reste servie — le site ne tombe pas.

---

*Le givre forge notre patience. La lune éclaire notre destinée.*
