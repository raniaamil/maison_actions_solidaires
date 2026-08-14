# Maison d'Actions Solidaires

Site web de l'association **Maison d'Actions Solidaires (MAACSO)** : un site vitrine
public doublé d'un back-office éditorial.

Le site présente l'association, ses pôles d'action et ses actualités, et permet aux
visiteurs de la contacter ou de faire un don. Côté administration, une interface
réservée permet de publier des actualités avec un éditeur de texte riche, de gérer
les comptes de l'équipe et de modérer les commentaires laissés par les membres.

---

## Stack technique

| Domaine | Technologies |
| --- | --- |
| Framework | Next.js 15.5 (App Router), React 19 |
| Langages | TypeScript, JavaScript |
| Styles | Tailwind CSS, CSS Modules |
| Base de données | PostgreSQL hébergé sur Supabase (client `pg`, requêtes SQL paramétrées) |
| Stockage de fichiers | Supabase Storage (images et vidéos) |
| Authentification | JWT maison — `jsonwebtoken` côté serveur, `jose` dans le middleware (Edge Runtime), mots de passe hachés avec `bcryptjs` |
| Éditeur de contenu | Jodit (`jodit-react`) |
| E-mails | Nodemailer (SMTP) |
| Hébergement | Vercel |

---

## Fonctionnalités

### Site public

- Pages de présentation : accueil, association, pôles d'action, faire un don
- Actualités : liste filtrable par type, page de détail par article
- Commentaires sur les articles, avec réponses imbriquées (réservés aux membres connectés)
- Formulaire de contact avec accusé de réception automatique par e-mail
- Pages légales : mentions légales, CGU, politique de confidentialité

### Espace membre

- Inscription publique et connexion
- Réinitialisation du mot de passe par e-mail (lien à usage unique, valable 1 heure)
- Publication et suppression de ses propres commentaires

### Back-office

Trois rôles, aux permissions distinctes :

| Rôle | Permissions |
| --- | --- |
| **Administrateur** | Accès complet : gestion des comptes (création, modification, suppression, changement de rôle), gestion des actualités, consultation des messages de contact |
| **Rédacteur** | Rédaction, modification et suppression d'actualités, téléversement de médias, consultation des messages de contact. **Aucun accès** à la gestion des comptes |
| **Utilisateur** | Compte membre du site public : commenter les articles. **Aucun accès** au back-office |

---

## Installation

### Prérequis

- Node.js 20 ou supérieur
- Un projet [Supabase](https://supabase.com) (base PostgreSQL + Storage)
- Un compte SMTP pour l'envoi d'e-mails (Gmail avec mot de passe d'application, par exemple)

### Mise en route

```bash
# 1. Cloner le dépôt
git clone https://github.com/raniaamil/maison_actions_solidaires.git
cd maison_actions_solidaires

# 2. Installer les dépendances
npm install

# 3. Créer le fichier d'environnement à partir du modèle
cp .env.example .env.local
```

### Variables d'environnement

Renseignez ensuite `.env.local`. Le fichier [`.env.example`](.env.example) documente
chaque variable ; en voici la liste :

| Variable | Rôle | Requise |
| --- | --- | --- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL/Supabase | ✅ |
| `JWT_SECRET` | Secret de signature des JWT (32 caractères minimum) | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role, pour le téléversement vers Supabase Storage | ✅ |
| `NEXT_PUBLIC_SITE_URL` | URL de base du site (liens des e-mails, contrôle d'origine) | ✅ |
| `SMTP_HOST` | Serveur SMTP | ✅ |
| `SMTP_PORT` | Port SMTP (587 pour STARTTLS, 465 pour TLS implicite) | ✅ |
| `SMTP_USER` | Identifiant SMTP | ✅ |
| `SMTP_PASS` | Mot de passe SMTP (mot de passe d'application avec Gmail) | ✅ |
| `CONTACT_EMAIL` | Destinataire du formulaire de contact (défaut : `SMTP_USER`) | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase (inutilisée actuellement) | — |
| `CSRF_ALLOW_NO_ORIGIN` | Autorise les écritures sans en-tête `Origin` (développement uniquement) | — |

> ⚠️ `.env.local` contient des secrets réels et ne doit jamais être commité — le
> `.gitignore` couvre déjà tous les fichiers `.env*`. La clé `SUPABASE_SERVICE_ROLE_KEY`
> contourne toutes les policies RLS : elle ne doit jamais être exposée côté client.

### Base de données

Le schéma complet se trouve dans [`src/database/schema.sql`](src/database/schema.sql)
(tables `users`, `actualites`, `comments`, `password_reset_tokens`, `contact_messages`).
Exécutez-le dans l'éditeur SQL de Supabase pour initialiser la base.

Créez ensuite votre premier compte administrateur directement en base : l'inscription
publique attribue systématiquement le rôle `Utilisateur`, et la création de comptes
privilégiés exige d'être déjà authentifié en tant qu'administrateur.

---

## Lancer le projet

```bash
npm run dev      # serveur de développement — http://localhost:3000
npm run build    # build de production
npm start        # démarrer le build de production
npm run lint     # ESLint
```

---

## Tests

La suite d'intégration interroge une instance réellement démarrée : lancez d'abord le
serveur, puis les tests dans un second terminal.

```bash
# Terminal 1
npm run dev

# Terminal 2
npm test
```

**46 tests** couvrent les routes publiques, la validation des entrées, le contrôle
d'accès, la limitation de débit et le rendu des pages.

Certains scénarios authentifiés sont ignorés si aucun compte de test n'est fourni.
Pour les activer :

```bash
ADMIN_EMAIL=... ADMIN_PASSWORD=... npm test
```

Une suite complémentaire de **61 vérifications d'authentification** a servi à valider
le contrôle d'accès sur les trois rôles : parcours de connexion réel, permissions et
refus attendus pour chaque rôle, rejet des jetons expirés, mal signés, forgés
(`alg:none`) ou dont la charge utile a été altérée. Elle nécessite des comptes de test
dédiés (un par rôle) et n'est pas versionnée, afin de ne pas laisser de comptes de test
dans le dépôt.

---

## Sécurité

Le projet a fait l'objet d'un audit de sécurité et des mesures suivantes :

- **Authentification par JWT vérifié** — la signature est validée à chaque requête :
  par `jose` dans le middleware (compatible Edge Runtime) et par `jsonwebtoken` dans
  chaque route sensible. L'algorithme est imposé (`HS256`), ce qui écarte les attaques
  par confusion d'algorithme.
- **Contrôle d'accès par rôle** — chaque route API sensible revérifie l'identité et le
  rôle de l'appelant côté serveur. Le middleware ne constitue pas à lui seul une
  frontière de sécurité. Le champ `role` d'un compte n'est modifiable que par un
  administrateur authentifié.
- **Sessions en cookie `HttpOnly`** — le jeton est posé par le serveur dans un cookie
  `HttpOnly`, `Secure` (production), `SameSite=Strict`. Il n'est jamais exposé au
  JavaScript de la page, donc inexfiltrable par une faille XSS.
- **Content Security Policy active** — CSP bloquante, avec `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'` et `frame-ancestors 'none'`. Complétée par
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  et HSTS en production.
- **Protection CSRF** — toute écriture vers l'API est refusée si l'en-tête
  `Origin`/`Referer` ne correspond pas à une origine autorisée.
- **Mots de passe** — hachés avec bcrypt. Aucun mot de passe ni jeton n'est écrit dans
  les journaux.
- **Requêtes SQL paramétrées** — aucune concaténation de valeurs utilisateur.
- **Téléversements contrôlés** — authentification requise, type MIME et taille validés,
  et vérification de la signature binaire réelle du fichier (nombres magiques).
- **Limitation de débit** sur la connexion (5 tentatives par tranche de 15 minutes).

---

## Structure du projet

```
src/
├── app/
│   ├── api/              # routes API (auth, actualités, commentaires, contact, upload, users)
│   ├── administrateur/   # back-office
│   ├── actualites/       # liste et détail des actualités
│   └── ...               # pages publiques
├── components/           # composants partagés
├── contexts/             # AuthContext (état de session côté client)
├── database/schema.sql   # schéma PostgreSQL
├── lib/                  # accès base, helpers d'authentification, transport e-mail
└── middleware.js         # vérification JWT, CSRF, limitation de débit
```

---

## Licence

Aucune licence n'est associée à ce dépôt : le code est protégé par le droit d'auteur et
tous droits sont réservés. Contactez l'autrice pour toute demande de réutilisation.
