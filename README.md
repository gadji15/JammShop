# JammShop - E-commerce Platform

Une application e-commerce moderne et complète construite avec Next.js, Supabase et TypeScript.

## 🚀 Fonctionnalités

### Interface Publique
- **Catalogue de produits** avec recherche avancée et filtres
- **Système de panier** avec gestion des quantités
- **Authentification utilisateur** (inscription, connexion, réinitialisation mot de passe)
- **Gestion des commandes** avec suivi en temps réel
- **Système de paiement** (Mobile Money, Orange Money, Wave, Free Money, Paiement à la livraison)
- **Interface responsive** optimisée pour mobile et desktop
- **PWA** avec icônes d'installation

### Interface Administrateur
- **Dashboard** avec statistiques en temps réel
- **Gestion des produits** (CRUD complet)
- **Gestion des catégories** et organisation
- **Gestion des commandes** et statuts
- **Gestion des utilisateurs** et rôles
- **Intégration fournisseurs externes** (Alibaba, Jumia)
- **Import automatique** de produits
- **Système de permissions** (Admin/Super Admin)

## 🛠️ Technologies

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: Zustand, SWR
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📦 Installation

1. **Cloner le projet**
\`\`\`bash
git clone <repository-url>
cd jammshop
\`\`\`

2. **Installer les dépendances**
\`\`\`bash
npm install
# ou
pnpm install
# ou
yarn install
\`\`\`

3. **Configuration de l'environnement**
   - Copier `.env.local` et remplir avec vos variables Supabase
   - Configurer votre projet Supabase avec les scripts SQL fournis

4. **Exécuter les scripts de base de données**
   - Exécuter les scripts dans l'ordre : `001_create_database_schema.sql` → `007_add_super_admin_role.sql`

5. **Lancer le serveur de développement**
\`\`\`bash
npm run dev
# ou
pnpm dev
# ou
yarn dev
\`\`\`

## 🗄️ Structure de la Base de Données

- **profiles** - Profils utilisateurs avec rôles
- **products** - Catalogue de produits
- **categories** - Catégories de produits
- **orders** - Commandes clients
- **order_items** - Articles des commandes
- **payments** - Transactions de paiement
- **suppliers** - Fournisseurs externes
- **shopping_cart** - Panier d'achat
- **reviews** - Avis clients
- **coupons** - Codes de réduction

## 👥 Rôles Utilisateurs

- **Customer** - Client standard
- **Admin** - Administrateur avec accès au dashboard
- **Super Admin** - Administrateur avec tous les privilèges
- **Vendor** - Vendeur (fonctionnalité future)

## 🔧 Configuration Supabase

1. Créer un nouveau projet Supabase
2. Exécuter les scripts SQL dans l'ordre
3. Configurer les politiques RLS
4. Ajouter les variables d'environnement

## 📱 Contact

- **Email**: JammShop15@gmail.com
- **Téléphone**: +221766304380
- **Adresse**: Saly, Mbour, Sénégal

## 🌐 Réseaux Sociaux

- [Facebook](https://www.facebook.com/share/1Ch5odyw8Y/)
- [Instagram](https://www.instagram.com/jammshop15?igsh=MTNyamJlNWRnanB3OA==)
- [TikTok](https://www.tiktok.com/@jammshop5?_t=ZT-8zFw4JvFPva&_r=1)
- [X (Twitter)](https://x.com/SunuGain15?t=LiLJSyvhrNgBrnHhCeNftA&s=35)

## 📄 Licence

Ce projet est sous licence privée - voir le fichier LICENSE pour plus de détails.
